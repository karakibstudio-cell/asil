import { 
  Hotel,
  RoomTypeItem, 
  MealPlanOption, 
  RoomBooking, 
  BookingStatus, 
  BookingModuleSettings,
  SiteSettings,
  HotelBookingPolicy,
  RoomSeasonPeriod,
  RoomPackageOption 
} from '../types';
import { getSupabaseClient } from './supabase';

function getSb() {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

// ==========================================
// DEFAULT SEED DATA (بيانات أولية غنية تعمل فوراً 0ms)
// ==========================================

export const DEFAULT_MEAL_PLANS: MealPlanOption[] = [
  {
    id: 'meal_none',
    type: 'none',
    name: 'بدون وجبات (إقامة فقط)',
    nameEn: 'Room Only (No Meals)',
    pricePerPersonPerNight: 0,
    description: 'إقامة مريحة في الغرفة مع حرية اختيار وجباتك خارج الفندق',
    isActive: true
  },
  {
    id: 'meal_breakfast',
    type: 'breakfast',
    name: 'شامل بوفيه إفطار فاخر',
    nameEn: 'Bed & Breakfast Buffet',
    pricePerPersonPerNight: 45,
    description: 'بوفيه إفطار يومي متنوع يضم تشكيلة شرقية وغربية طازجة',
    isActive: true
  },
  {
    id: 'meal_half_board',
    type: 'half_board',
    name: 'نصف إقامة (إفطار + عشاء)',
    nameEn: 'Half Board (Breakfast & Dinner)',
    pricePerPersonPerNight: 95,
    description: 'بوفيه إفطار صباحي مفتوح + وجبة عشاء فاخرة يومياً',
    isActive: true
  },
  {
    id: 'meal_full_board',
    type: 'full_board',
    name: 'إقامة كاملة (إفطار + غداء + عشاء)',
    nameEn: 'Full Board (All 3 Meals)',
    pricePerPersonPerNight: 140,
    description: 'تجربة ضيافة ملكية متكاملة تشمل الإفطار والغداء والعشاء يومياً',
    isActive: true
  }
];

export const DEFAULT_BOOKING_POLICY: HotelBookingPolicy = {
  checkInTime: '16:00 عصراً (Check-in)',
  checkOutTime: '12:00 ظهراً (Check-out)',
  cancellationType: 'free_flexible',
  cancellationNoticeDays: 2,
  childrenPolicyText: 'إقامة مجانية لطفل واحد دون سن 6 سنوات مشاركاً للأسرة المتوفرة. الأطفال من 6-12 سنة يتوفر لهم سرير إضافي برسوم مخفضة.',
  extraBedPrice: 120,
  petsAllowed: false,
  smokingAllowed: false,
  paymentTerms: 'الدفع عند الوصول في مكتب الاستقبال بالفندق (نقداً أو مدى أو فيزا / ماستركارد)، لا يشترط دفع مسبق.',
  termsAndConditionsList: [
    'يلزم تقديم أصل بطاقة الهوية الوطنية أو الإقامة أو جواز السفر لجميع النزلاء المقيمين عند تسجيل الوصول.',
    'إلغاء مجاني ومرن متاح بالكامل حتى 48 ساعة قبل موعد تسجيل الوصول المحدد.',
    'يخضع طلب تسجيل الوصول المبكر أو تسجيل المغادرة المتأخر لمدى توفر الغرف لدى إدارة الفندق.',
    'تطبق لائحة وزارة السياحة والضيافة في المملكة العربية السعودية على جميع الحجوزات والتعاملات.'
  ],
  showFreeCancellationBadge: true,
  showPayAtHotelBadge: true,
  showInstantConfirmBadge: true,
  showMealInclusionBadge: true,
  priceIncludesTax: true,
  taxPercentage: 15
};

export function calculateRoomPriceForDates(
  room: RoomTypeItem, 
  checkInDate: string, 
  checkOutDate: string
): {
  nightlyRate: number;
  totalCost: number;
  activeSeasonName?: string;
  isAvailable: boolean;
} {
  let activeRate = room.basePrice;
  let seasonName: string | undefined = undefined;
  let available = room.status === 'available';

  if (room.seasonPeriods && room.seasonPeriods.length > 0 && checkInDate) {
    const match = room.seasonPeriods.find(s => {
      if (s.isAvailable === false) {
        return checkInDate <= s.endDate && checkOutDate >= s.startDate;
      }
      return (checkInDate >= s.startDate && checkInDate <= s.endDate) ||
             (checkOutDate >= s.startDate && checkOutDate <= s.endDate) ||
             (checkInDate <= s.startDate && checkOutDate >= s.endDate);
    });

    if (match) {
      activeRate = match.pricePerNight;
      seasonName = match.name;
      if (!match.isAvailable) {
        available = false;
      }
    }
  }

  let nights = 1;
  if (checkInDate && checkOutDate) {
    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (diff > 0) nights = diff;
  }

  return {
    nightlyRate: activeRate,
    totalCost: activeRate * nights,
    activeSeasonName: seasonName,
    isAvailable: available
  };
}

export function getHotelPolicy(hotel?: Hotel): HotelBookingPolicy {
  return hotel?.bookingPolicy || DEFAULT_BOOKING_POLICY;
}

export const DEFAULT_ROOM_TYPES: RoomTypeItem[] = [
  {
    id: 'room_royal_haram',
    hotelId: 'hotel_test_1790703048618', // فندق برستيج اجياد
    name: 'الجناح الملكي البانورامي (مطل على الحرم)',
    nameEn: 'Royal Panoramic Haram Suite',
    category: 'جناح ملكي',
    basePrice: 850,
    totalRooms: 6,
    availableRooms: 4,
    maxGuests: 4,
    bedType: '1 سرير كينج كبير + صالة جلوس فاخرة',
    roomSize: '65 م²',
    features: ['إطلالة مباشرة على ساحة الحرم', 'صوت الأذان مباشرة داخل الجناح', 'واي فاي فائق السرعة مجاني', 'شاشة تلفزيون ذكية 65 بوصة', 'ميني بار مجاني ومكينة نسبريسو'],
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'
    ],
    keyPrefix: 'ROYAL',
    status: 'available',
    isActive: true,
    seasonPeriods: [
      {
        id: 'season_ramadan',
        name: 'موسم شهر رمضان المبارك (العشر الأواخر)',
        startDate: '2026-03-10',
        endDate: '2026-04-10',
        pricePerNight: 1450,
        minStayNights: 3,
        isAvailable: true
      },
      {
        id: 'season_weekend',
        name: 'عطلات نهاية الأسبوع ومواسم العمرة الفاخرة',
        startDate: '2026-10-01',
        endDate: '2026-12-31',
        pricePerNight: 950,
        minStayNights: 1,
        isAvailable: true
      }
    ],
    order: 1
  },
  {
    id: 'room_deluxe_double',
    hotelId: 'hotel_test_1790703048618',
    name: 'غرفة ديلوكس ثنائية فاخرة',
    nameEn: 'Deluxe Double Room',
    category: 'غرفة ديلوكس',
    basePrice: 380,
    totalRooms: 20,
    availableRooms: 12,
    maxGuests: 2,
    bedType: '1 سرير كينج أو سريرين منفصلين',
    roomSize: '36 م²',
    features: ['تصميم رخامي عصري', 'حمام خاص مع حوض استحمام ومستلزمات فاخرة', 'مكتب عمل وشاشة ذكية', 'إطلالة هادئة على المدينة'],
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80'
    ],
    keyPrefix: 'DLX',
    status: 'available',
    isActive: true,
    order: 2
  },
  {
    id: 'room_family_quad',
    hotelId: 'hotel_test_1790703048618',
    name: 'غرفة عائلية رباعية لضيوف الرحمن',
    nameEn: 'Family Quadruple Room',
    category: 'غرفة عائلية',
    basePrice: 520,
    totalRooms: 15,
    availableRooms: 8,
    maxGuests: 5,
    bedType: '4 أسرة مفردة مريحة جداً',
    roomSize: '48 م²',
    features: ['مساحة واسعة مناسبة للعائلات والمعتمرين', 'خزائن ملابس متعددة', 'شاي وقهوة مجاناً على مدار الساعة', 'ثلاجة وميكروويف صغير'],
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80'
    ],
    keyPrefix: 'FAM',
    status: 'available',
    isActive: true,
    order: 3
  },
  {
    id: 'room_executive_suite',
    hotelId: 'hotel_test_1790703048618',
    name: 'جناح تنفيذي لرجال الأعمال وكبار الشخصيات',
    nameEn: 'Executive VIP Suite',
    category: 'جناح تنفيذي',
    basePrice: 650,
    totalRooms: 8,
    availableRooms: 5,
    maxGuests: 3,
    bedType: '1 سرير ماستر كينج + مكتب اجتماعات',
    roomSize: '54 م²',
    features: ['دخول مجاني للصالات التنفيذية', 'خدمة الكونسيرج الخاصة', 'إنترنت ألياف ضوئية فائق', 'إفطار مجاني في الغرفة'],
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80'
    ],
    keyPrefix: 'EXEC',
    status: 'available',
    isActive: true,
    order: 4
  }
];

export const INITIAL_ROOM_BOOKINGS: RoomBooking[] = [
  {
    id: 'book_sample_101',
    bookingCode: 'PRS-8492',
    digitalKey: 'ROYAL-304',
    hotelId: 'hotel_test_1790703048618',
    hotelName: 'فندق برستيج اجياد',
    hotelCity: 'مكة المكرمة',
    roomId: 'room_royal_haram',
    roomName: 'الجناح الملكي البانورامي (مطل على الحرم)',
    guestName: 'عبدالرحمن إبراهيم آل سعود',
    guestPhone: '+966551234567',
    guestEmail: 'a.ibrahim@example.com',
    checkIn: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
    nights: 4,
    roomsCount: 1,
    adults: 2,
    children: 1,
    mealPlanId: 'meal_full_board',
    mealPlanName: 'إقامة كاملة (إفطار + غداء + عشاء)',
    mealPlanPrice: 140,
    roomPricePerNight: 850,
    totalAmount: 4520,
    specialRequests: 'نرجو توفير سرير إضافي للطفل وإطلالة مباشرة على الكعبة المشرفة',
    status: 'confirmed',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    assignedRoomNumber: '304',
    adminNotes: 'عميل VIP معتمد - تم تأكيد الغرفة وجاهزية المفتاح الرقمي'
  },
  {
    id: 'book_sample_102',
    bookingCode: 'PRS-6310',
    digitalKey: 'DLX-512',
    hotelId: 'hotel_test_1790703048618',
    hotelName: 'فندق برستيج اجياد',
    hotelCity: 'مكة المكرمة',
    roomId: 'room_deluxe_double',
    roomName: 'غرفة ديلوكس ثنائية فاخرة',
    guestName: 'محمد طارق منصور',
    guestPhone: '+201012345678',
    guestEmail: 'm.tareq@gmail.com',
    checkIn: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
    nights: 3,
    roomsCount: 1,
    adults: 2,
    children: 0,
    mealPlanId: 'meal_breakfast',
    mealPlanName: 'شامل بوفيه إفطار فاخر',
    mealPlanPrice: 45,
    roomPricePerNight: 380,
    totalAmount: 1410,
    specialRequests: 'طابق علوي هادئ لرحلة العمرة المباركة',
    status: 'pending',
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    assignedRoomNumber: '512'
  }
];

export const DEFAULT_BOOKING_SETTINGS: BookingModuleSettings = {
  enabled: true,
  showInHeader: true,
  showTrackBookingModal: true,
  showInHero: true,
  showInHotelDetail: true,
  bookingEmail: 'bookings@prestigeksa.com',
  bookingWhatsApp: '+966544076726',
  enableWhatsAppRedirect: true,
  enableEmailNotification: true,
  autoAssignDigitalKey: true,
  currency: 'ر.س'
};

// ==========================================
// STORAGE KEYS & LOCAL PERSISTENCE HELPERS
// ==========================================

const ROOMS_KEY = 'prestige_room_types';
const MEALS_KEY = 'prestige_meal_plans';
const BOOKINGS_KEY = 'prestige_room_bookings';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback) ? Array.isArray(parsed) : typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
  }
  return fallback;
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn(`Error writing ${key} to storage:`, err);
  }
}

// ==========================================
// ROOM TYPES MANAGEMENT
// ==========================================

export async function getRoomsFromDb(hotelId?: string): Promise<RoomTypeItem[]> {
  const rooms = getLocal<RoomTypeItem[]>(ROOMS_KEY, DEFAULT_ROOM_TYPES);
  if (hotelId) {
    // If specific hotel has rooms, return them; otherwise return all or fallback
    const filtered = rooms.filter(r => r.hotelId === hotelId);
    return filtered.length > 0 ? filtered : rooms;
  }
  return rooms;
}

export async function saveRoomToDb(room: RoomTypeItem): Promise<void> {
  const current = getLocal<RoomTypeItem[]>(ROOMS_KEY, DEFAULT_ROOM_TYPES);
  const existingIdx = current.findIndex(r => r.id === room.id);
  let updated: RoomTypeItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = room;
  } else {
    updated = [room, ...current];
  }
  setLocal(ROOMS_KEY, updated);

  // Optional background sync with Supabase if table exists
  const sb = getSb();
  if (sb) {
    try {
      await sb.from('room_types').upsert({
        id: room.id,
        hotel_id: room.hotelId,
        name: room.name,
        category: room.category,
        base_price: room.basePrice,
        total_rooms: room.totalRooms,
        available_rooms: room.availableRooms,
        status: room.status,
        data: room
      } as any);
    } catch {
      // Non-blocking fallback
    }
  }
}

export async function deleteRoomFromDb(roomId: string): Promise<void> {
  const current = getLocal<RoomTypeItem[]>(ROOMS_KEY, DEFAULT_ROOM_TYPES);
  const updated = current.filter(r => r.id !== roomId);
  setLocal(ROOMS_KEY, updated);

  const sb = getSb();
  if (sb) {
    try {
      await sb.from('room_types').delete().eq('id', roomId);
    } catch {}
  }
}

// ==========================================
// MEAL PLANS MANAGEMENT
// ==========================================

export async function getMealPlansFromDb(): Promise<MealPlanOption[]> {
  return getLocal<MealPlanOption[]>(MEALS_KEY, DEFAULT_MEAL_PLANS);
}

export async function saveMealPlansToDb(plans: MealPlanOption[]): Promise<void> {
  setLocal(MEALS_KEY, plans);
  const sb = getSb();
  if (sb) {
    try {
      await sb.from('meal_plans').upsert(plans as any);
    } catch {}
  }
}

// ==========================================
// BOOKINGS MANAGEMENT
// ==========================================

export async function getBookingsFromDb(): Promise<RoomBooking[]> {
  return getLocal<RoomBooking[]>(BOOKINGS_KEY, INITIAL_ROOM_BOOKINGS);
}

export async function saveBookingToDb(booking: RoomBooking): Promise<void> {
  const current = getLocal<RoomBooking[]>(BOOKINGS_KEY, INITIAL_ROOM_BOOKINGS);
  const existingIdx = current.findIndex(b => b.id === booking.id);
  let updated: RoomBooking[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = booking;
  } else {
    updated = [booking, ...current];
  }
  setLocal(BOOKINGS_KEY, updated);

  // Sync to Supabase room_bookings or messages if table configured
  const sb = getSb();
  if (sb) {
    try {
      await sb.from('room_bookings').upsert({
        id: booking.id,
        booking_code: booking.bookingCode,
        digital_key: booking.digitalKey,
        hotel_id: booking.hotelId,
        hotel_name: booking.hotelName,
        guest_name: booking.guestName,
        guest_phone: booking.guestPhone,
        check_in: booking.checkIn,
        check_out: booking.checkOut,
        total_amount: booking.totalAmount,
        status: booking.status,
        booking_data: booking
      } as any);
    } catch {
      // Non-blocking
    }
  }
}

export async function updateBookingStatus(
  id: string, 
  status: BookingStatus, 
  assignedRoomNumber?: string, 
  adminNotes?: string,
  bookingCode?: string,
  digitalKey?: string
): Promise<void> {
  const current = getLocal<RoomBooking[]>(BOOKINGS_KEY, INITIAL_ROOM_BOOKINGS);
  const updated = current.map(b => {
    if (b.id === id) {
      return {
        ...b,
        status,
        ...(bookingCode ? { bookingCode: bookingCode.trim().toUpperCase() } : {}),
        ...(digitalKey !== undefined ? { digitalKey: digitalKey.trim().toUpperCase() } : {}),
        ...(assignedRoomNumber !== undefined ? { assignedRoomNumber } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {})
      };
    }
    return b;
  });
  setLocal(BOOKINGS_KEY, updated);

  const sb = getSb();
  if (sb) {
    try {
      await sb.from('room_bookings').update({ 
        status, 
        ...(bookingCode ? { booking_code: bookingCode.trim().toUpperCase() } : {}),
        ...(digitalKey !== undefined ? { digital_key: digitalKey.trim().toUpperCase() } : {}),
        ...(assignedRoomNumber ? { assigned_room_number: assignedRoomNumber } : {}),
        ...(adminNotes ? { admin_notes: adminNotes } : {})
      } as any).eq('id', id);
    } catch {}
  }
}

export async function deleteBookingFromDb(bookingId: string): Promise<void> {
  const current = getLocal<RoomBooking[]>(BOOKINGS_KEY, INITIAL_ROOM_BOOKINGS);
  const updated = current.filter(b => b.id !== bookingId);
  setLocal(BOOKINGS_KEY, updated);

  const sb = getSb();
  if (sb) {
    try {
      await sb.from('room_bookings').delete().eq('id', bookingId);
    } catch {}
  }
}

export async function getBookingByCodeOrPhone(queryText: string): Promise<RoomBooking | null> {
  const clean = queryText.trim().toLowerCase();
  if (!clean) return null;
  const current = await getBookingsFromDb();
  const found = current.find(b => 
    b.bookingCode.toLowerCase() === clean ||
    (b.digitalKey && b.digitalKey.toLowerCase() === clean) ||
    b.guestPhone.replace(/[\s\-\+]/g, '').includes(clean.replace(/[\s\-\+]/g, '')) ||
    b.id === clean
  );
  return found || null;
}

// ==========================================
// CODE & KEY GENERATORS
// ==========================================

export function generateBookingCode(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `PRS-${randomNum}`;
}

export function generateDigitalKey(prefix: string = 'CONF'): string {
  const cleanPrefix = (prefix || 'CONF').trim().toUpperCase();
  const roomNum = Math.floor(1000 + Math.random() * 9000);
  return `${cleanPrefix}-${roomNum}`;
}

// ==========================================
// WHATSAPP & EMAIL NOTIFICATION BUILDERS
// ==========================================

export function buildBookingWhatsAppMessage(booking: RoomBooking, siteSettings?: SiteSettings): string {
  const hotelCityText = booking.hotelCity ? ` - ${booking.hotelCity}` : '';
  const lines = [
    `🏨 *طلب حجز وتسكين جديد عبر الموقع*`,
    `✨ *فندق:* ${booking.hotelName}${hotelCityText}`,
    `🔖 *رقم طلب الحجز:* #${booking.bookingCode}`,
    booking.digitalKey ? `🔑 *رقم تأكيد الحجز / المفتاح المعتمد:* ${booking.digitalKey}` : null,
    ``,
    `👤 *بيانات النزيل:*`,
    `• الاسم: ${booking.guestName}`,
    `• الهاتف: ${booking.guestPhone}`,
    booking.guestEmail ? `• البريد: ${booking.guestEmail}` : null,
    ``,
    `🛏️ *تفاصيل الغرفة والإقامة:*`,
    `• نوع الغرفة: ${booking.roomName}`,
    `• عدد الغرف: ${booking.roomsCount}`,
    `• عدد النزلاء: ${booking.adults} بالغين${booking.children > 0 ? ` + ${booking.children} أطفال` : ''}`,
    `• خيار الوجبات: ${booking.mealPlanName}`,
    `• تاريخ الوصول (Check-in): ${booking.checkIn}`,
    `• تاريخ المغادرة (Check-out): ${booking.checkOut}`,
    `• إجمالي عدد الليالي: ${booking.nights} ${booking.nights === 1 ? 'ليلة' : 'ليالٍ'}`,
    ``,
    `💰 *التكلفة الإجمالية:* ${booking.totalAmount.toLocaleString()} ر.س`,
    booking.specialRequests ? `📝 *طلبات خاصة:* ${booking.specialRequests}` : null,
    ``,
    `📌 *حالة الطلب:* ${booking.status === 'confirmed' ? '✅ حجز مؤكد ومعتمد' : 'بانتظار مراجعة واعتماد مشرف الحجز'}`
  ].filter(Boolean);

  return lines.join('\n');
}

export function buildGuestWhatsAppShareLink(
  booking: RoomBooking, 
  targetPhone?: string, 
  siteSettings?: SiteSettings
): string {
  const phone = (
    targetPhone || 
    siteSettings?.bookingModule?.bookingWhatsApp || 
    siteSettings?.channels?.find(c => c.type === 'whatsapp')?.value || 
    '+966544076726'
  ).replace(/[^0-9]/g, '');

  const msg = buildBookingWhatsAppMessage(booking, siteSettings);
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// ==========================================
// PACKAGES MANAGEMENT (باقات الغرف والعروض)
// ==========================================

export const INITIAL_ROOM_PACKAGES: RoomPackageOption[] = [
  {
    id: 'pkg_sample_twin_breakfast',
    hotelId: 'hotel_test_1790703048618',
    roomId: 'room_deluxe_double',
    roomName: 'غرفة ديلوكس ثنائية فاخرة',
    name: 'باقة المعتمر: غرفة ثنائية شاملة بوفيه الإفطار (3 ليالٍ)',
    nameEn: 'Umrah Package: Deluxe Double + Breakfast (3 Nights)',
    mealPlanId: 'meal_breakfast',
    mealPlanName: 'شامل بوفيه إفطار فاخر لشخصين',
    nights: 3,
    totalPrice: 1290,
    pricePerNight: 430,
    startDate: '2026-02-18',
    endDate: '2026-04-30',
    priceIncludesTax: true,
    badgeText: 'الأكثر طلباً ⭐',
    features: ['بوفيه إفطار يومي لشخصين', 'إلغاء مجاني حتى 48 ساعة', 'تسجيل وصول مبكر مجاني حسب الإمكانية'],
    isActive: true
  },
  {
    id: 'pkg_sample_royal_vip',
    hotelId: 'hotel_test_1790703048618',
    roomId: 'room_royal_haram',
    roomName: 'الجناح الملكي البانورامي (مطل على الحرم)',
    name: 'باقة كبار الشخصيات: جناح ملكي 5 ليالٍ شامل الإقامة الكاملة',
    nameEn: 'VIP Royal Suite 5-Nights Package (Full Board)',
    mealPlanId: 'meal_full_board',
    mealPlanName: 'إقامة كاملة (إفطار + غداء + عشاء)',
    nights: 5,
    totalPrice: 4600,
    pricePerNight: 920,
    startDate: '2026-02-18',
    endDate: '2026-05-15',
    priceIncludesTax: true,
    badgeText: 'باقة VIP ملكية 👑',
    features: ['إطلالة مباشرة على الكعبة', 'وجبات كاملة لـ 3 نزلاء', 'خدمة الكونسيرج واستقبال خاص'],
    isActive: true
  }
];

const PACKAGES_KEY = 'diy_room_packages';

export async function getPackagesFromDb(hotelId?: string): Promise<RoomPackageOption[]> {
  const pkgs = getLocal<RoomPackageOption[]>(PACKAGES_KEY, INITIAL_ROOM_PACKAGES);
  if (hotelId) {
    return pkgs.filter(p => p.hotelId === hotelId);
  }
  return pkgs;
}

export async function savePackageToDb(pkg: RoomPackageOption): Promise<void> {
  const current = getLocal<RoomPackageOption[]>(PACKAGES_KEY, INITIAL_ROOM_PACKAGES);
  const existingIdx = current.findIndex(p => p.id === pkg.id);
  let updated: RoomPackageOption[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = pkg;
  } else {
    updated = [pkg, ...current];
  }
  setLocal(PACKAGES_KEY, updated);
}

export async function deletePackageFromDb(pkgId: string): Promise<void> {
  const current = getLocal<RoomPackageOption[]>(PACKAGES_KEY, INITIAL_ROOM_PACKAGES);
  const updated = current.filter(p => p.id !== pkgId);
  setLocal(PACKAGES_KEY, updated);
}
