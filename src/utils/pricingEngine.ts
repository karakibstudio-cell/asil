import { 
  Hotel, 
  RoomTypeItem, 
  MealPlanOption, 
  HotelPricingPeriod, 
  BookingRuleSet, 
  BookingNightlyRateItem, 
  BookingPriceBreakdown,
  HotelBookingPolicy
} from '../types';

/**
 * Returns an array of ISO date strings (YYYY-MM-DD) for every night of a stay.
 * For example: checkIn = '2026-10-18', checkOut = '2026-10-21' -> ['2026-10-18', '2026-10-19', '2026-10-20'] (3 nights)
 */
export function getStayNightDates(checkIn: string, checkOut: string): string[] {
  if (!checkIn || !checkOut) return [];
  const start = new Date(checkIn + 'T00:00:00');
  const end = new Date(checkOut + 'T00:00:00');
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return [];

  const dates: string[] = [];
  for (let i = 0; i < diffDays; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

/**
 * Finds the applicable HotelPricingPeriod for a specific date and room.
 */
export function findPeriodForDate(
  dateStr: string,
  roomId: string,
  periods: HotelPricingPeriod[] = []
): HotelPricingPeriod | undefined {
  if (!periods || periods.length === 0) return undefined;
  return periods.find(p => {
    if (p.isActive === false) return false;
    if (dateStr < p.startDate || dateStr > p.endDate) return false;
    if (p.roomTypeId === 'all' || !p.roomTypeId) return true;
    if (p.roomTypeId === roomId) return true;
    if (p.roomTypeIds && p.roomTypeIds.includes(roomId)) return true;
    return false;
  });
}

export interface NightlyComputationItem {
  date: string;
  rate: number;
  seasonName?: string;
  allotment: number;
  isClosed: boolean;
  minStayNights: number;
  ruleSetId?: string;
}

export interface PricingEngineCalculationParams {
  hotel: Hotel;
  room: RoomTypeItem;
  checkIn: string;
  checkOut: string;
  roomsCount: number;
  guestsCount: number;
  mealPlan?: MealPlanOption | null;
  pricingPeriods?: HotelPricingPeriod[];
  customPolicy?: HotelBookingPolicy;
}

export interface PricingEngineResult {
  isValid: boolean;
  totalNights: number;
  averageNightlyRate: number;
  roomsCost: number;
  mealPricePerPerson: number;
  mealsCost: number;
  subtotal: number;
  taxes: number;
  grandTotal: number;
  isTaxIncluded: boolean;
  currency: string;
  nightlyBreakdown: NightlyComputationItem[];
  validationErrors: string[];
  priceBreakdown: BookingPriceBreakdown;
}

/**
 * Master Pricing Engine Calculation:
 * Evaluates night-by-night rates across configured pricing periods,
 * calculates room costs, meal plans, taxes, and validates period rules.
 */
export function calculateBookingPrice(params: PricingEngineCalculationParams): PricingEngineResult {
  const {
    hotel,
    room,
    checkIn,
    checkOut,
    roomsCount = 1,
    guestsCount = 2,
    mealPlan,
    pricingPeriods = hotel?.pricingPeriods || [],
    customPolicy
  } = params;

  const nights = getStayNightDates(checkIn, checkOut);
  const totalNights = nights.length;
  const validationErrors: string[] = [];

  const policy = customPolicy || hotel?.bookingPolicy;
  const rules = policy?.bookingRules;
  const currency = policy?.currency || 'SAR';
  const isTaxIncluded = policy?.priceIncludesTax !== false;

  if (totalNights <= 0) {
    validationErrors.push('يرجى تحديد تاريخي الدخول والمغادرة بشكل صحيح.');
  }

  // 1. Validate basic rules
  if (rules) {
    if (rules.minNights && totalNights < rules.minNights) {
      validationErrors.push(`الحد الأدنى للإقامة في هذا الفندق هو ${rules.minNights} ليالٍ.`);
    }
    if (rules.maxNights && totalNights > rules.maxNights) {
      validationErrors.push(`الحد الأقصى للإقامة في الحجز الواحد هو ${rules.maxNights} ليلة.`);
    }
    if (rules.minRoomsPerBooking && roomsCount < rules.minRoomsPerBooking) {
      validationErrors.push(`الحد الأدنى لعدد الغرف هو ${rules.minRoomsPerBooking}.`);
    }
    if (rules.maxRoomsPerBooking && roomsCount > rules.maxRoomsPerBooking) {
      validationErrors.push(`الحد الأقصى لعدد الغرف هو ${rules.maxRoomsPerBooking}.`);
    }
    if (rules.maxGuestsPerRoom && guestsCount > rules.maxGuestsPerRoom * roomsCount) {
      validationErrors.push(`العدد الإجمالي يتجاوز الحد الأقصى المسموح (${rules.maxGuestsPerRoom} نزلاء لكل غرفة).`);
    }
  }

  if (room.maxGuests && guestsCount > room.maxGuests * roomsCount) {
    validationErrors.push(`الطاقة الاستيعابية للغرفة هي ${room.maxGuests} نزلاء (المطلوب ${guestsCount} نزلاء لـ ${roomsCount} غرف).`);
  }

  // 2. Compute night-by-night pricing
  const nightlyBreakdown: NightlyComputationItem[] = [];
  let roomsCost = 0;

  for (const dateStr of nights) {
    const period = findPeriodForDate(dateStr, room.id, pricingPeriods);
    let nightlyRate = room.basePrice || 350;
    let seasonName: string | undefined = undefined;
    let allotment = room.availableRooms || room.totalRooms || 5;
    let isClosed = false;
    let minStay = 1;
    let ruleSetId: string | undefined = undefined;

    if (period) {
      seasonName = period.name;
      nightlyRate = period.roomOnlyPrice;
      isClosed = period.isAvailable === false;
      minStay = period.minStayNights || 1;
      ruleSetId = period.ruleSetId;

      if (period.roomDistribution && typeof period.roomDistribution[room.id] === 'number') {
        allotment = period.roomDistribution[room.id];
      } else if (typeof period.availableRooms === 'number') {
        allotment = period.availableRooms;
      }

      if (period.minStayNights && totalNights < period.minStayNights) {
        validationErrors.push(`الفترة "${period.name}" تشترط حداً أدنى للإقامة ${period.minStayNights} ليالٍ.`);
      }

      // Check linked rule sets if defined
      if (ruleSetId && hotel?.bookingRuleSets) {
        const linkedRule = hotel.bookingRuleSets.find(r => r.id === ruleSetId);
        if (linkedRule) {
          if (totalNights < linkedRule.minNights) {
            validationErrors.push(`فترة "${period.name}" تشترط حداً أدنى ${linkedRule.minNights} ليالٍ.`);
          }
          if (totalNights > linkedRule.maxNights) {
            validationErrors.push(`فترة "${period.name}" تسمح بحد أقصى ${linkedRule.maxNights} ليلة.`);
          }
          if (roomsCount < linkedRule.minRooms) {
            validationErrors.push(`فترة "${period.name}" تشترط حداً أدنى ${linkedRule.minRooms} غرف.`);
          }
          if (roomsCount > linkedRule.maxRooms) {
            validationErrors.push(`فترة "${period.name}" تسمح بحد أقصى ${linkedRule.maxRooms} غرف.`);
          }
        }
      }
    } else if (pricingPeriods.length > 0) {
      // Hotel has periods configured, but this date falls in an unpriced gap
      isClosed = true;
      validationErrors.push(`التاريخ المحدد (${dateStr}) غير متاح للحجز في جدول الفترات المعتمدة.`);
    }

    if (isClosed) {
      validationErrors.push(`الفندق مغلق للحجوزات في تاريخ: ${dateStr}`);
    }

    nightlyBreakdown.push({
      date: dateStr,
      rate: nightlyRate,
      seasonName,
      allotment,
      isClosed,
      minStayNights: minStay,
      ruleSetId
    });

    roomsCost += nightlyRate * roomsCount;
  }

  // 3. Compute Meals Cost
  const mealRate = mealPlan ? Number(mealPlan.price ?? mealPlan.pricePerPersonPerNight ?? 0) : 0;
  const mealBasis = mealPlan?.pricingBasis || 'per_person_per_night';
  const mealsCost = mealBasis === 'per_room_per_night'
    ? mealRate * roomsCount * totalNights
    : mealRate * guestsCount * totalNights;

  const subtotal = roomsCost + mealsCost;
  const taxes = isTaxIncluded ? 0 : Math.round(subtotal * 0.15);
  const grandTotal = subtotal + taxes;
  const averageNightlyRate = totalNights > 0 && roomsCount > 0 
    ? Math.round(roomsCost / (totalNights * roomsCount)) 
    : room.basePrice || 350;

  const uniqueErrors = Array.from(new Set(validationErrors));

  const priceBreakdown: BookingPriceBreakdown = {
    nights: totalNights,
    nightlyRates: nightlyBreakdown.map(n => ({
      date: n.date,
      rate: n.rate,
      seasonName: n.seasonName
    })),
    roomsCost,
    mealPricePerPerson: mealRate,
    mealsCost,
    extraCharges: 0,
    taxes,
    isTaxIncluded,
    totalAmount: grandTotal,
    currency
  };

  return {
    isValid: uniqueErrors.length === 0 && totalNights > 0,
    totalNights,
    averageNightlyRate,
    roomsCost,
    mealPricePerPerson: mealRate,
    mealsCost,
    subtotal,
    taxes,
    grandTotal,
    isTaxIncluded,
    currency,
    nightlyBreakdown,
    validationErrors: uniqueErrors,
    priceBreakdown
  };
}
