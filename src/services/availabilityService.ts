import { 
  doc, 
  getDoc, 
  setDoc, 
  runTransaction, 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Hotel, 
  RoomTypeItem, 
  RoomBooking, 
  HotelPricingPeriod, 
  BookingPriceBreakdown,
  HotelBookingPolicy,
  MealPlanOption
} from '../types';
import { calculateBookingPrice, getStayNightDates } from '../utils/pricingEngine';
import { 
  getRoomsFromDb, 
  getPricingPeriodsFromDb, 
  getBookingsFromDb, 
  generateBookingCode,
  getHotelPolicy,
  DEFAULT_BOOKING_POLICY
} from './bookingService';

export interface NightAvailabilityData {
  allotment: number;
  booked: number;
  available: number;
  price: number;
  isClosed: boolean;
  minStay?: number;
  seasonName?: string;
}

export interface MonthAvailabilityDoc {
  id: string; // `${hotelId}_${roomId}_${yearMonth}`
  hotelId: string;
  roomId: string;
  yearMonth: string; // YYYY-MM
  days: Record<string, NightAvailabilityData>;
  updatedAt: number;
}

// In-memory cache for fast lookups with 60s TTL
const memoryCache = new Map<string, { doc: MonthAvailabilityDoc; expiresAt: number }>();

export class OverbookingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OverbookingError';
  }
}

/**
 * Helper to get the year-month string (YYYY-MM) from an ISO date string
 */
export function getYearMonth(dateStr: string): string {
  return dateStr.substring(0, 7);
}

/**
 * Returns distinct YYYY-MM months touched by an array of stay dates
 */
export function getDistinctMonths(dates: string[]): string[] {
  const set = new Set<string>();
  for (const d of dates) {
    set.add(getYearMonth(d));
  }
  return Array.from(set);
}

/**
 * Generate a doc ID for monthly availability
 */
export function getAvailabilityDocId(hotelId: string, roomId: string, yearMonth: string): string {
  return `${hotelId}_${roomId}_${yearMonth}`;
}

/**
 * Initialize month days map from room and periods
 */
export function initializeMonthDays(
  yearMonth: string,
  room: RoomTypeItem,
  periods: HotelPricingPeriod[] = [],
  existingBookings: RoomBooking[] = [],
  hotel?: Hotel
): Record<string, NightAvailabilityData> {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed

  // Number of days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: Record<string, NightAvailabilityData> = {};

  const isHotelDisabled = hotel?.onlineAvailabilityMode === 'disabled' || hotel?.onlineBookingEnabled === false;
  const isPeriodsOnly = hotel?.onlineAvailabilityMode === 'periods_only';
  const isRoomDisabled = room.isActive === false || room.status === 'maintenance';

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${yearMonth}-${dayStr}`;

    // Period matching
    const period = periods.find(p => {
      if (p.isActive === false) return false;
      if (dateStr < p.startDate || dateStr > p.endDate) return false;
      if (p.roomTypeId === 'all' || !p.roomTypeId) return true;
      if (p.roomTypeId === room.id) return true;
      if (p.roomTypeIds && p.roomTypeIds.includes(room.id)) return true;
      return false;
    });

    let allotment = room.availableRooms || room.totalRooms || 5;
    let price = room.basePrice || 350;
    let isClosed = false;
    let minStay = 1;
    let seasonName: string | undefined = undefined;

    if (isHotelDisabled || isRoomDisabled) {
      isClosed = true;
    } else if (period) {
      price = period.roomOnlyPrice;
      isClosed = period.isAvailable === false;
      minStay = period.minStayNights || 1;
      seasonName = period.name;

      if (period.roomDistribution && typeof period.roomDistribution[room.id] === 'number') {
        allotment = period.roomDistribution[room.id];
      } else if (typeof period.availableRooms === 'number') {
        allotment = period.availableRooms;
      }
    } else if (isPeriodsOnly || periods.length > 0) {
      isClosed = true;
    }

    // Active bookings on this night
    const booked = existingBookings
      .filter(b => {
        if (b.roomId !== room.id) return false;
        if (b.status === 'cancelled') return false;
        return b.checkIn <= dateStr && b.checkOut > dateStr;
      })
      .reduce((sum, b) => sum + (Number(b.roomsCount) || 1), 0);

    const available = Math.max(0, allotment - booked);

    days[dateStr] = {
      allotment,
      booked,
      available,
      price,
      isClosed,
      minStay,
      seasonName
    };
  }

  return days;
}

/**
 * Fetch a single month availability document (from memory cache, Firestore, or initialize on the fly)
 */
export async function getMonthAvailability(
  hotelId: string,
  room: RoomTypeItem,
  yearMonth: string,
  periods: HotelPricingPeriod[] = [],
  bookings: RoomBooking[] = [],
  hotel?: Hotel
): Promise<MonthAvailabilityDoc> {
  const docId = getAvailabilityDocId(hotelId, room.id, yearMonth);
  const cached = memoryCache.get(docId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.doc;
  }

  // Attempt reading from Firestore
  try {
    if (db) {
      const docRef = doc(db, 'availability', docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as MonthAvailabilityDoc;
        memoryCache.set(docId, { doc: data, expiresAt: Date.now() + 60000 });
        return data;
      }
    }
  } catch (err) {
    console.warn(`[availabilityService] Firestore read failed for ${docId}, falling back to local computation:`, err);
  }

  // Initialize fresh document
  const days = initializeMonthDays(yearMonth, room, periods, bookings, hotel);
  const newDoc: MonthAvailabilityDoc = {
    id: docId,
    hotelId,
    roomId: room.id,
    yearMonth,
    days,
    updatedAt: Date.now()
  };

  memoryCache.set(docId, { doc: newDoc, expiresAt: Date.now() + 60000 });

  // Background save to Firestore so next read is immediate
  if (db) {
    setDoc(doc(db, 'availability', docId), newDoc).catch(() => {});
  }

  return newDoc;
}

/**
 * Fast availability check for a stay across 1 or 2 months:
 * Reads monthly docs and determines if every night has sufficient rooms.
 */
export async function checkFastStayAvailability(
  hotel: Hotel,
  room: RoomTypeItem,
  checkIn: string,
  checkOut: string,
  requestedRooms: number = 1,
  periods: HotelPricingPeriod[] = [],
  bookings: RoomBooking[] = []
): Promise<{
  isAvailable: boolean;
  minRemainingRooms: number;
  nightsBreakdown: NightAvailabilityData[];
  validationErrors: string[];
}> {
  const nights = getStayNightDates(checkIn, checkOut);
  if (nights.length === 0) {
    return {
      isAvailable: false,
      minRemainingRooms: 0,
      nightsBreakdown: [],
      validationErrors: ['يرجى تحديد تواريخ الدخول والمغادرة.']
    };
  }

  const months = getDistinctMonths(nights);
  const monthDocs = await Promise.all(
    months.map(ym => getMonthAvailability(hotel.id, room, ym, periods, bookings, hotel))
  );

  const monthMap = new Map<string, MonthAvailabilityDoc>();
  monthDocs.forEach(m => monthMap.set(m.yearMonth, m));

  const nightsBreakdown: NightAvailabilityData[] = [];
  const validationErrors: string[] = [];
  let minRemaining = 999;

  for (const dateStr of nights) {
    const ym = getYearMonth(dateStr);
    const mDoc = monthMap.get(ym);
    const day = mDoc?.days?.[dateStr];

    if (!day) {
      validationErrors.push(`التاريخ المحدد (${dateStr}) غير متاح في النظام.`);
      continue;
    }

    if (day.isClosed) {
      validationErrors.push(`الفندق مغلق للحجوزات في تاريخ: ${dateStr}.`);
    }

    if (day.available < requestedRooms) {
      validationErrors.push(`لا تتوفر غرف كافية في تاريخ ${dateStr} (المتاح: ${day.available}، المطلوب: ${requestedRooms}).`);
    }

    minRemaining = Math.min(minRemaining, day.available);
    nightsBreakdown.push(day);
  }

  const isAvail = validationErrors.length === 0 && minRemaining >= requestedRooms;

  return {
    isAvailable: isAvail,
    minRemainingRooms: minRemaining === 999 ? 0 : minRemaining,
    nightsBreakdown,
    validationErrors: Array.from(new Set(validationErrors))
  };
}

/**
 * Prefetches the next month in calendar to guarantee 0ms transitions
 */
export function prefetchNextMonth(
  hotelId: string,
  room: RoomTypeItem,
  currentYearMonth: string,
  periods: HotelPricingPeriod[] = [],
  bookings: RoomBooking[] = []
): void {
  const [yStr, mStr] = currentYearMonth.split('-');
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) + 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  const nextYm = `${y}-${String(m).padStart(2, '0')}`;
  getMonthAvailability(hotelId, room, nextYm, periods, bookings).catch(() => {});
}

export interface CreateAtomicBookingParams {
  hotel: Hotel;
  room: RoomTypeItem;
  checkIn: string;
  checkOut: string;
  roomsCount: number;
  adultsCount: number;
  childrenCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  mealPlan?: MealPlanOption | null;
  specialRequests?: string;
  idempotencyKey?: string;
  honeypot?: string;
  formStartTime?: number;
  consentAgreed: boolean;
  customPolicy?: HotelBookingPolicy;
  preferredView?: 'haram' | 'city' | 'panoramic' | 'quiet' | 'any';
  preferredFloor?: 'high' | 'mid' | 'low' | 'any';
  expressCheckInOptIn?: boolean;
}

/**
 * ATOMIC BOOKING TRANSACTION:
 * Executes an atomic transaction in Firestore:
 * 1. Validates idempotency key (prevents duplicate submission on double click or retry).
 * 2. Reads required month availability docs inside the transaction.
 * 3. Re-verifies every night has available >= requestedRooms (ZERO OVERBOOKING).
 * 4. Re-calculates price securely from hotel periods (never trusts client price).
 * 5. Atomically decrements available counters and increments booked counters.
 * 6. Creates the booking record and returns it.
 */
export async function createBookingAtomicTransaction(
  params: CreateAtomicBookingParams
): Promise<RoomBooking> {
  const {
    hotel,
    room,
    checkIn,
    checkOut,
    roomsCount = 1,
    adultsCount = 2,
    childrenCount = 0,
    guestName,
    guestPhone,
    guestEmail,
    mealPlan,
    specialRequests,
    idempotencyKey,
    consentAgreed,
    customPolicy
  } = params;

  if (!consentAgreed) {
    throw new Error('يلزم الموافقة على سياسة وشروط الحجز للمتابعة.');
  }

  const cleanPhone = guestPhone.replace(/[\s\-\(\)]/g, '');
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error('يرجى إدخال رقم واتساب صحيح يبدأ بمفتاح الدولة الدولي.');
  }

  const nights = getStayNightDates(checkIn, checkOut);
  if (nights.length === 0) {
    throw new Error('تواريخ الدخول والمغادرة غير صحيحة.');
  }

  // 1. Fetch fresh periods to recompute price
  const freshPeriods = await getPricingPeriodsFromDb(hotel.id);
  const totalGuests = adultsCount + childrenCount;

  // Re-calculate price on server side
  const pricingResult = calculateBookingPrice({
    hotel,
    room,
    checkIn,
    checkOut,
    roomsCount,
    guestsCount: totalGuests,
    mealPlan,
    pricingPeriods: freshPeriods,
    customPolicy
  });

  if (!pricingResult.isValid || pricingResult.validationErrors.length > 0) {
    throw new Error(pricingResult.validationErrors.join('، '));
  }

  // 2. Check Idempotency Key first
  const resolvedIdempotencyKey = idempotencyKey || `idem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  if (db) {
    try {
      const q = query(
        collection(db, 'room_bookings'),
        where('idempotencyKey', '==', resolvedIdempotencyKey)
      );
      const existingSnap = await getDocs(q);
      if (!existingSnap.empty) {
        // Return existing booking directly! Idempotent retry succeeded.
        return existingSnap.docs[0].data() as RoomBooking;
      }
    } catch {}
  }

  const months = getDistinctMonths(nights);
  const bookingCode = generateBookingCode();
  const bookingId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const invoiceNumber = `INV-${bookingCode}`;

  // Unguessable token for public invoice access
  let token = '';
  try {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    token = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    token = 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  const confirmationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const hotelPolicy = customPolicy || getHotelPolicy(hotel);

  const newBooking: RoomBooking = {
    id: bookingId,
    token,
    bookingCode,
    confirmationCode,
    invoiceNumber,
    digitalKey: '',
    idempotencyKey: resolvedIdempotencyKey,
    hotelId: hotel.id,
    hotelName: hotel.name,
    hotelCity: hotel.city,
    roomId: room.id,
    roomName: room.name,
    guestName: guestName.trim(),
    guestPhone: cleanPhone,
    guestEmail: guestEmail.trim(),
    checkIn,
    checkOut,
    nights: pricingResult.totalNights,
    roomsCount,
    adults: adultsCount,
    children: childrenCount,
    mealPlanId: mealPlan?.id || 'meal_none',
    mealPlanName: mealPlan?.name || 'بدون وجبات',
    mealPlanPrice: pricingResult.mealPricePerPerson,
    roomPricePerNight: pricingResult.averageNightlyRate,
    totalAmount: pricingResult.grandTotal,
    specialRequests: specialRequests?.trim() || undefined,
    status: 'pending_confirmation',
    createdAt: Date.now(),
    consentAgreed: true,
    policySnapshot: {
      version: hotelPolicy.version || 1,
      checkInTime: hotelPolicy.checkInTime || '16:00 عصراً',
      checkOutTime: hotelPolicy.checkOutTime || '12:00 ظهراً',
      cancellationType: hotelPolicy.cancellationType || 'free_flexible',
      cancellationNoticeDays: hotelPolicy.cancellationNoticeDays || 2,
      cancellationPolicyAr: hotelPolicy.cancellationPolicyAr || DEFAULT_BOOKING_POLICY.cancellationPolicyAr,
      cancellationPolicyEn: hotelPolicy.cancellationPolicyEn || DEFAULT_BOOKING_POLICY.cancellationPolicyEn,
      termsAr: hotelPolicy.termsAr || DEFAULT_BOOKING_POLICY.termsAr,
      termsEn: hotelPolicy.termsEn || DEFAULT_BOOKING_POLICY.termsEn,
      paymentTerms: hotelPolicy.paymentTerms || DEFAULT_BOOKING_POLICY.paymentTerms,
      currency: pricingResult.currency,
      cancellationRules: hotelPolicy.cancellationRules || DEFAULT_BOOKING_POLICY.cancellationRules
    },
    priceBreakdown: pricingResult.priceBreakdown,
    emailStatus: 'queued',
    preferredView: params.preferredView || 'any',
    preferredFloor: params.preferredFloor || 'any',
    expressCheckInOptIn: params.expressCheckInOptIn ?? true
  };

  // 3. FIRESTORE ATOMIC TRANSACTION
  if (db) {
    await runTransaction(db, async (tx) => {
      // Step A: Read month docs inside transaction
      const monthRefs = months.map(ym => doc(db, 'availability', getAvailabilityDocId(hotel.id, room.id, ym)));
      const monthSnaps = await Promise.all(monthRefs.map(ref => tx.get(ref)));

      const monthDocsMap = new Map<string, MonthAvailabilityDoc>();

      for (let i = 0; i < months.length; i++) {
        const ym = months[i];
        const snap = monthSnaps[i];
        if (snap.exists()) {
          monthDocsMap.set(ym, snap.data() as MonthAvailabilityDoc);
        } else {
          // Initialize in-memory copy
          const days = initializeMonthDays(ym, room, freshPeriods, []);
          monthDocsMap.set(ym, {
            id: getAvailabilityDocId(hotel.id, room.id, ym),
            hotelId: hotel.id,
            roomId: room.id,
            yearMonth: ym,
            days,
            updatedAt: Date.now()
          });
        }
      }

      // Step B: Verify availability for every night
      for (const dateStr of nights) {
        const ym = getYearMonth(dateStr);
        const mDoc = monthDocsMap.get(ym);
        const day = mDoc?.days?.[dateStr];

        if (!day || day.isClosed || day.available < roomsCount) {
          throw new OverbookingError(
            `عذراً، نفدت الغرف المتاحة في تاريخ ${dateStr} (المتبقي: ${day ? day.available : 0}، المطلوب: ${roomsCount}). نرجو اختيار تاريخ أو غرفة بديلة.`
          );
        }
      }

      // Step C: Decrement availability atomically
      for (const dateStr of nights) {
        const ym = getYearMonth(dateStr);
        const mDoc = monthDocsMap.get(ym)!;
        const day = mDoc.days[dateStr];
        day.available -= roomsCount;
        day.booked += roomsCount;
      }

      // Step D: Write updated month availability docs
      for (let i = 0; i < months.length; i++) {
        const ym = months[i];
        const ref = monthRefs[i];
        const mDoc = monthDocsMap.get(ym)!;
        mDoc.updatedAt = Date.now();
        tx.set(ref, mDoc);
        // Invalidate/update local memory cache
        memoryCache.set(mDoc.id, { doc: mDoc, expiresAt: Date.now() + 60000 });
      }

      // Step E: Create booking record
      const bookingRef = doc(db, 'room_bookings', bookingId);
      tx.set(bookingRef, newBooking);
    });
  } else {
    // Local / fallback mode
    const existing = JSON.parse(localStorage.getItem('prestige_bookings') || '[]');
    existing.unshift(newBooking);
    localStorage.setItem('prestige_bookings', JSON.stringify(existing));
  }

  return newBooking;
}

/**
 * REBUILD AVAILABILITY ACTION (Admin utility):
 * Recalculates month availability documents from current pricing periods and rooms,
 * syncing them with active bookings for the next 12 months.
 */
export async function rebuildHotelAvailability(hotelId: string): Promise<{ success: boolean; updatedMonthsCount: number }> {
  if (!db) return { success: false, updatedMonthsCount: 0 };

  const [rooms, periods, bookings] = await Promise.all([
    getRoomsFromDb(hotelId),
    getPricingPeriodsFromDb(hotelId),
    getBookingsFromDb(hotelId)
  ]);

  const hotelRooms = rooms.filter(r => r.hotelId === hotelId && r.isActive !== false);
  const now = new Date();
  const monthsToBuild: string[] = [];

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthsToBuild.push(ym);
  }

  const batch = writeBatch(db);
  let count = 0;

  for (const room of hotelRooms) {
    for (const ym of monthsToBuild) {
      const days = initializeMonthDays(ym, room, periods, bookings);
      const docId = getAvailabilityDocId(hotelId, room.id, ym);
      const monthDoc: MonthAvailabilityDoc = {
        id: docId,
        hotelId,
        roomId: room.id,
        yearMonth: ym,
        days,
        updatedAt: Date.now()
      };
      const docRef = doc(db, 'availability', docId);
      batch.set(docRef, monthDoc);
      memoryCache.set(docId, { doc: monthDoc, expiresAt: Date.now() + 60000 });
      count++;
    }
  }

  await batch.commit();
  return { success: true, updatedMonthsCount: count };
}
