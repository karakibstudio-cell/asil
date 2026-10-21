import { 
  Hotel,
  RoomTypeItem, 
  MealPlanOption, 
  MealPlanType,
  RoomBooking, 
  BookingStatus, 
  BookingModuleSettings,
  SiteSettings,
  HotelBookingPolicy,
  RoomSeasonPeriod,
  RoomPackageOption,
  BookingNightlyRateItem,
  BookingPriceBreakdown,
  BookingPolicySnapshot,
  BookingRuleSet,
  HotelPolicyItem,
  HotelPricingPeriod
} from '../types';
import { getSupabaseClient } from './supabase';
import { recordAuditLog, getCurrentAdminUser, db } from './firebase';

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

export const DEFAULT_BOOKING_RULE_SETS: BookingRuleSet[] = [
  {
    id: 'rules_default',
    hotelId: 'all',
    name: 'القواعد القياسية العامة (Standard Rules)',
    nameEn: 'Standard Booking Rules',
    minRooms: 1,
    maxRooms: 10,
    minNights: 1,
    maxNights: 30,
    isDefault: true,
    description: 'حد أدنى ليلة واحدة، وأقصى عدد 10 غرف للحجز'
  },
  {
    id: 'rules_ramadan',
    hotelId: 'all',
    name: 'قواعد موسم رمضان (حد أدنى 3 ليالٍ)',
    nameEn: 'Ramadan Season Rules (Min 3 Nights)',
    minRooms: 1,
    maxRooms: 8,
    minNights: 3,
    maxNights: 30,
    isDefault: false,
    description: 'تشترط حداً أدنى 3 ليالٍ خلال موسم رمضان المبارك'
  },
  {
    id: 'rules_weekend',
    hotelId: 'all',
    name: 'قواعد عطلة نهاية الأسبوع (ليلتان)',
    nameEn: 'Weekend Rules (Min 2 Nights)',
    minRooms: 1,
    maxRooms: 10,
    minNights: 2,
    maxNights: 14,
    isDefault: false,
    description: 'تشترط ليلتين لحجوزات الخميس والجمعة'
  }
];

export const DEFAULT_HOTEL_POLICIES: HotelPolicyItem[] = [
  {
    id: 'policy_flexible',
    hotelId: 'all',
    name: 'السياسة المرنة القياسية (إلغاء مجاني حتى 48 ساعة)',
    nameEn: 'Standard Flexible Policy (Free cancellation up to 48h)',
    isDefault: true,
    policyTextAr: 'إلغاء مجاني ومرن متاح بالكامل حتى 48 ساعة قبل موعد تسجيل الوصول. في حال الإلغاء خلال أقل من 48 ساعة أو عدم الحضور يتم خصم قيمة الليلة الأولى.',
    policyTextEn: 'Free and flexible cancellation up to 48 hours before check-in. In case of late cancellation within 48 hours or no-show, the first night will be charged.',
    termsTextAr: 'يلزم تقديم أصل بطاقة الهوية الوطنية أو الإقامة أو جواز السفر لجميع النزلاء المقيمين عند تسجيل الوصول. تطبق لائحة وزارة السياحة والضيافة في المملكة العربية السعودية.',
    termsTextEn: 'Original national ID, Iqama, or passport is required for all staying guests upon check-in. Saudi Ministry of Tourism hospitality regulations apply.',
    cancellationRules: [
      {
        id: 'crule_1',
        daysBeforeCheckIn: 2,
        feePercentage: 0,
        descriptionAr: 'إلغاء مجاني كامل واسترداد 100% حتى 48 ساعة قبل الوصول',
        descriptionEn: 'Free cancellation up to 48h before arrival'
      },
      {
        id: 'crule_2',
        daysBeforeCheckIn: 0,
        feePercentage: 100,
        descriptionAr: 'خصم قيمة الليلة الأولى عند الإلغاء في آخر 48 ساعة أو عدم الحضور',
        descriptionEn: 'First night fee charged on late cancellation or no-show'
      }
    ],
    checkInTime: '16:00 عصراً (Check-in)',
    checkOutTime: '12:00 ظهراً (Check-out)',
    version: 1,
    createdAt: 1704067200000,
    updatedAt: 1704067200000
  },
  {
    id: 'policy_nonrefundable',
    hotelId: 'all',
    name: 'سياسة المواسم الخاصة غير المستردة (Non-Refundable)',
    nameEn: 'Strict / Non-Refundable Season Policy',
    isDefault: false,
    policyTextAr: 'هذا الحجز غير قابل للإلغاء أو التعديل أو الاسترداد. يتم خصم كامل المبلغ بنسبة 100% فور تأكيد الحجز.',
    policyTextEn: 'This booking is non-refundable, non-cancellable, and non-amendable. 100% cancellation fee applies upon confirmation.',
    termsTextAr: 'تطبق الشروط والأحكام الخاصة بالمواسم الاستثنائية وخصومات الحجز المبكر.',
    termsTextEn: 'Special season terms and early booking discount conditions apply.',
    cancellationRules: [
      {
        id: 'crule_strict_1',
        daysBeforeCheckIn: 0,
        feePercentage: 100,
        descriptionAr: 'غير قابل للاسترداد - خصم 100% عند الإلغاء في أي وقت',
        descriptionEn: 'Non-refundable: 100% fee on cancellation at any time'
      }
    ],
    checkInTime: '16:00 عصراً (Check-in)',
    checkOutTime: '12:00 ظهراً (Check-out)',
    version: 1,
    createdAt: 1704067200000,
    updatedAt: 1704067200000
  }
];

export const DEFAULT_PRICING_PERIODS: HotelPricingPeriod[] = [
  {
    id: 'period_sample_ramadan_royal',
    hotelId: 'hotel_test_1790703048618',
    roomTypeId: 'room_royal_haram',
    roomTypeName: 'الجناح الملكي البانورامي (مطل على الحرم)',
    name: 'موسم شهر رمضان المبارك (العشر الأواخر)',
    nameEn: 'Ramadan Holy Season (Last 10 Nights)',
    startDate: '2026-03-10',
    endDate: '2026-04-10',
    availableRooms: 4,
    roomOnlyPrice: 1450,
    extraWithMeal: 1550,
    extraWithoutMeal: 1450,
    ruleSetId: 'rules_ramadan',
    policyId: 'policy_nonrefundable',
    isActive: true,
    minStayNights: 3
  },
  {
    id: 'period_sample_ramadan_dlx',
    hotelId: 'hotel_test_1790703048618',
    roomTypeId: 'room_deluxe_double',
    roomTypeName: 'غرفة ديلوكس ثنائية فاخرة',
    name: 'موسم شهر رمضان المبارك',
    nameEn: 'Ramadan Holy Season',
    startDate: '2026-03-01',
    endDate: '2026-04-10',
    availableRooms: 10,
    roomOnlyPrice: 580,
    extraWithMeal: 650,
    extraWithoutMeal: 580,
    ruleSetId: 'rules_ramadan',
    policyId: 'policy_flexible',
    isActive: true,
    minStayNights: 3
  }
];

const RULE_SETS_KEY = 'diy_booking_rule_sets';
const POLICIES_KEY = 'diy_hotel_policies_list';
const PERIODS_KEY = 'diy_hotel_pricing_periods';

export async function getRuleSetsFromDb(hotelId?: string): Promise<BookingRuleSet[]> {
  const current = getLocal<BookingRuleSet[]>(RULE_SETS_KEY, DEFAULT_BOOKING_RULE_SETS);
  if (hotelId) {
    const matched = current.filter(r => r.hotelId === hotelId || r.hotelId === 'all');
    return matched.length > 0 ? matched : DEFAULT_BOOKING_RULE_SETS;
  }
  return current;
}

export async function saveRuleSetToDb(ruleSet: BookingRuleSet): Promise<void> {
  const current = getLocal<BookingRuleSet[]>(RULE_SETS_KEY, DEFAULT_BOOKING_RULE_SETS);
  const existingIdx = current.findIndex(r => r.id === ruleSet.id);
  let updated: BookingRuleSet[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = ruleSet;
  } else {
    updated = [ruleSet, ...current];
  }
  setLocal(RULE_SETS_KEY, updated);
}

export async function deleteRuleSetFromDb(ruleSetId: string): Promise<void> {
  const current = getLocal<BookingRuleSet[]>(RULE_SETS_KEY, DEFAULT_BOOKING_RULE_SETS);
  const updated = current.filter(r => r.id !== ruleSetId);
  setLocal(RULE_SETS_KEY, updated);
}

export async function getPoliciesFromDb(hotelId?: string): Promise<HotelPolicyItem[]> {
  const current = getLocal<HotelPolicyItem[]>(POLICIES_KEY, DEFAULT_HOTEL_POLICIES);
  if (hotelId) {
    const matched = current.filter(p => p.hotelId === hotelId || p.hotelId === 'all');
    return matched.length > 0 ? matched : DEFAULT_HOTEL_POLICIES;
  }
  return current;
}

export async function savePolicyItemToDb(policy: HotelPolicyItem): Promise<void> {
  const current = getLocal<HotelPolicyItem[]>(POLICIES_KEY, DEFAULT_HOTEL_POLICIES);
  const existingIdx = current.findIndex(p => p.id === policy.id);
  let updated: HotelPolicyItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = policy;
  } else {
    updated = [policy, ...current];
  }
  setLocal(POLICIES_KEY, updated);
}

export async function deletePolicyItemFromDb(policyId: string): Promise<void> {
  const current = getLocal<HotelPolicyItem[]>(POLICIES_KEY, DEFAULT_HOTEL_POLICIES);
  const updated = current.filter(p => p.id !== policyId);
  setLocal(POLICIES_KEY, updated);
}

export async function getPricingPeriodsFromDb(hotelId?: string): Promise<HotelPricingPeriod[]> {
  const current = getLocal<HotelPricingPeriod[]>(PERIODS_KEY, DEFAULT_PRICING_PERIODS);

  // Background sync from Supabase if hotelId provided
  if (hotelId) {
    const sb = getSb();
    if (sb) {
      sb.from('hotels').select('id, booking_policy, location').eq('id', hotelId).maybeSingle()
        .then(({ data: hotelRow }) => {
          if (hotelRow) {
            let policy: any = {};
            if (typeof hotelRow.booking_policy === 'object' && hotelRow.booking_policy !== null) {
              policy = hotelRow.booking_policy;
            } else if (typeof hotelRow.booking_policy === 'string') {
              try { policy = JSON.parse(hotelRow.booking_policy); } catch {}
            }
            let loc: any = {};
            if (typeof hotelRow.location === 'object' && hotelRow.location !== null) {
              loc = hotelRow.location;
            } else if (typeof hotelRow.location === 'string') {
              try { loc = JSON.parse(hotelRow.location); } catch {}
            }
            const remotePeriods = policy.pricingPeriods || loc.pricingPeriods;
            if (Array.isArray(remotePeriods) && remotePeriods.length > 0) {
              const others = current.filter(p => p.hotelId !== hotelId);
              setLocal(PERIODS_KEY, [...remotePeriods, ...others]);
            }
          }
        }, () => {});
    }
    return current.filter(p => !p.hotelId || p.hotelId === 'all' || p.hotelId === hotelId);
  }
  return current;
}

export async function savePricingPeriodToDb(period: HotelPricingPeriod, _hotelId?: string): Promise<void> {
  const current = getLocal<HotelPricingPeriod[]>(PERIODS_KEY, DEFAULT_PRICING_PERIODS);
  const existingIdx = current.findIndex(p => p.id === period.id);
  let updated: HotelPricingPeriod[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = period;
  } else {
    updated = [period, ...current];
  }
  setLocal(PERIODS_KEY, updated);

  // Background non-blocking persistence to Supabase
  if (period.hotelId) {
    const sb = getSb();
    if (sb) {
      setTimeout(async () => {
        try {
          const hotelPeriods = updated.filter(p => p.hotelId === period.hotelId);
          const { data: hotelRow } = await sb.from('hotels').select('id, booking_policy, location').eq('id', period.hotelId).maybeSingle();
          if (hotelRow) {
            let policy: any = typeof hotelRow.booking_policy === 'object' && hotelRow.booking_policy !== null ? { ...hotelRow.booking_policy } : {};
            policy.pricingPeriods = hotelPeriods;
            await sb.from('hotels').update({ booking_policy: policy }).eq('id', period.hotelId);
          }
        } catch (err) {
          console.warn('[Supabase] Non-fatal pricing period sync warning:', err);
        }
      }, 0);
    }
  }
}

export async function deletePricingPeriodFromDb(periodId: string): Promise<void> {
  const current = getLocal<HotelPricingPeriod[]>(PERIODS_KEY, DEFAULT_PRICING_PERIODS);
  const targetPeriod = current.find(p => p.id === periodId);
  const updated = current.filter(p => p.id !== periodId);
  setLocal(PERIODS_KEY, updated);

  if (targetPeriod && targetPeriod.hotelId) {
    const sb = getSb();
    if (sb) {
      setTimeout(async () => {
        try {
          const hotelPeriods = updated.filter(p => p.hotelId === targetPeriod.hotelId);
          const { data: hotelRow } = await sb.from('hotels').select('id, booking_policy, location').eq('id', targetPeriod.hotelId).maybeSingle();
          if (hotelRow) {
            let policy: any = typeof hotelRow.booking_policy === 'object' && hotelRow.booking_policy !== null ? { ...hotelRow.booking_policy } : {};
            policy.pricingPeriods = hotelPeriods;
            await sb.from('hotels').update({ booking_policy: policy }).eq('id', targetPeriod.hotelId);
          }
        } catch (err) {
          console.warn('[Supabase] Non-fatal pricing period delete sync warning:', err);
        }
      }, 0);
    }
  }
}

/**
 * Check if a period overlaps with any existing active period for the same room type.
 * Returns overlapping period if any conflict exists.
 */
export function checkPeriodOverlap(
  candidate: { startDate: string; endDate: string; roomTypeId: string; id?: string },
  existingPeriods: HotelPricingPeriod[]
): HotelPricingPeriod | null {
  if (!candidate.startDate || !candidate.endDate || !candidate.roomTypeId) return null;
  
  const found = existingPeriods.find(p => {
    if (candidate.id && p.id === candidate.id) return false;
    if (p.isActive === false) return false;
    
    // If candidate or existing period applies to all room types, or same room type
    const roomsOverlap = 
      candidate.roomTypeId === 'all' || 
      p.roomTypeId === 'all' || 
      p.roomTypeId === candidate.roomTypeId ||
      (p.roomTypeIds && p.roomTypeIds.includes(candidate.roomTypeId));
      
    if (!roomsOverlap) return false;
    
    // Overlap condition: start1 <= end2 && end1 >= start2
    return candidate.startDate <= p.endDate && candidate.endDate >= p.startDate;
  });
  
  return found || null;
}

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
  cancellationPolicyAr: 'إلغاء مجاني ومرن متاح بالكامل حتى 48 ساعة قبل موعد تسجيل الوصول. في حال الإلغاء خلال أقل من 48 ساعة أو عدم الحضور يتم خصم قيمة الليلة الأولى.',
  cancellationPolicyEn: 'Free and flexible cancellation up to 48 hours before check-in. In case of late cancellation within 48 hours or no-show, the first night will be charged.',
  termsAr: 'يلزم تقديم أصل بطاقة الهوية الوطنية أو الإقامة أو جواز السفر لجميع النزلاء المقيمين عند تسجيل الوصول. تطبق لائحة وزارة السياحة والضيافة في المملكة العربية السعودية على جميع الحجوزات.',
  termsEn: 'Original national ID, Iqama, or passport is required for all staying guests upon check-in. Saudi Ministry of Tourism hospitality regulations apply to all bookings.',
  termsAndConditionsList: [
    'يلزم تقديم أصل بطاقة الهوية الوطنية أو الإقامة أو جواز السفر لجميع النزلاء المقيمين عند تسجيل الوصول.',
    'إلغاء مجاني ومرن متاح بالكامل حتى 48 ساعة قبل موعد تسجيل الوصول المحدد.',
    'يخضع طلب تسجيل الوصول المبكر أو تسجيل المغادرة المتأخر لمدى توفر الغرف لدى إدارة الفندق.',
    'تطبق لائحة وزارة السياحة والضيافة في المملكة العربية السعودية على جميع الحجوزات والتعاملات.'
  ],
  cancellationRules: [
    {
      id: 'rule_free',
      daysBeforeCheckIn: 2,
      feePercentage: 0,
      descriptionAr: 'إلغاء مجاني كامل واسترداد 100% حتى يومين (48 ساعة) قبل موعد الوصول',
      descriptionEn: 'Free cancellation with 100% refund up to 2 days before check-in'
    },
    {
      id: 'rule_partial',
      daysBeforeCheckIn: 1,
      feePercentage: 50,
      descriptionAr: 'إلغاء قبل 24 ساعة من الوصول: تطبيق رسوم 50% من قيمة الليلة الأولى',
      descriptionEn: 'Cancellation 24 hours prior: 50% fee of first night'
    },
    {
      id: 'rule_noshow',
      daysBeforeCheckIn: 0,
      feePercentage: 100,
      descriptionAr: 'في يوم الوصول أو عدم الحضور (No-show): رسوم 100% لليلة الأولى',
      descriptionEn: 'On day of arrival or no-show: 100% fee of first night'
    }
  ],
  bookingRules: {
    minNights: 1,
    maxNights: 30,
    minRoomsPerBooking: 1,
    maxRoomsPerBooking: 10,
    maxGuestsPerRoom: 6,
    currency: 'SAR',
    closedDates: []
  },
  version: 1,
  versionHistory: [
    {
      version: 1,
      updatedAt: 1704067200000,
      updatedBy: 'المدير العام',
      summary: 'السياسات والشروط المعتمدة الأساسية لشركة برستيج',
      snapshot: {}
    }
  ],
  currency: 'SAR',
  showFreeCancellationBadge: true,
  showPayAtHotelBadge: true,
  showInstantConfirmBadge: true,
  showMealInclusionBadge: true,
  priceIncludesTax: true,
  taxPercentage: 15
};

export function getStayNightDates(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  if (!checkIn || !checkOut) return dates;
  const cur = new Date(checkIn + 'T00:00:00');
  const end = new Date(checkOut + 'T00:00:00');
  while (cur < end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export interface NightlyAvailabilityItem {
  date: string;
  rate: number;
  seasonName?: string;
  allotment: number;
  bookedCount: number;
  availableRooms: number;
  isClosed: boolean;
  extraBedPrice?: number;
  extraPersonPrice?: number;
}

export interface NightlyAvailabilityCheck {
  isAvailable: boolean;
  totalNights: number;
  totalCost: number;
  averageNightlyRate: number;
  minRemainingRooms: number;
  nightlyBreakdown: NightlyAvailabilityItem[];
  validationErrors: string[];
}

/**
 * Check if an unconfirmed pending booking has exceeded its expiry window (default 24h)
 * When expired, it automatically stops holding allotment/rooms without cloud functions
 */
export function isBookingPendingExpired(booking: RoomBooking, customExpiryHours?: number): boolean {
  if (booking.status !== 'pending' && booking.status !== 'pending_confirmation') {
    return false;
  }
  const expiryHours = typeof customExpiryHours === 'number' && customExpiryHours > 0 ? customExpiryHours : 24;
  const createdAt = booking.createdAt || 0;
  if (!createdAt) return false;
  const ageMs = Date.now() - createdAt;
  return ageMs > (expiryHours * 3600 * 1000);
}

export function checkNightlyAvailability(
  hotel: Hotel | null | undefined,
  room: RoomTypeItem,
  checkInDate: string,
  checkOutDate: string,
  requestedRooms: number = 1,
  requestedGuests: number = 2,
  customPolicy?: HotelBookingPolicy,
  existingBookings: RoomBooking[] = []
): NightlyAvailabilityCheck {
  const policy = customPolicy || hotel?.bookingPolicy || DEFAULT_BOOKING_POLICY;
  const rules = policy.bookingRules || DEFAULT_BOOKING_POLICY.bookingRules;
  const validationErrors: string[] = [];

  if (!checkInDate || !checkOutDate) {
    return {
      isAvailable: false,
      totalNights: 0,
      totalCost: 0,
      averageNightlyRate: room.basePrice,
      minRemainingRooms: room.availableRooms || 0,
      nightlyBreakdown: [],
      validationErrors: ['يرجى تحديد تاريخي الدخول والمغادرة']
    };
  }

  const start = new Date(checkInDate + 'T00:00:00');
  const end = new Date(checkOutDate + 'T00:00:00');
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    validationErrors.push('تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول');
    return {
      isAvailable: false,
      totalNights: 0,
      totalCost: 0,
      averageNightlyRate: room.basePrice,
      minRemainingRooms: 0,
      nightlyBreakdown: [],
      validationErrors
    };
  }

  if (rules) {
    if (diffDays < (rules.minNights || 1)) {
      validationErrors.push(`الحد الأدنى للإقامة في هذا الفندق هو ${rules.minNights} ليالٍ`);
    }
    if (rules.maxNights && diffDays > rules.maxNights) {
      validationErrors.push(`الحد الأقصى للإقامة في الحجز الواحد هو ${rules.maxNights} ليلة`);
    }
    if (requestedRooms < (rules.minRoomsPerBooking || 1)) {
      validationErrors.push(`الحد الأدنى لعدد الغرف هو ${rules.minRoomsPerBooking}`);
    }
    if (rules.maxRoomsPerBooking && requestedRooms > rules.maxRoomsPerBooking) {
      validationErrors.push(`الحد الأقصى لعدد الغرف في الحجز الواحد هو ${rules.maxRoomsPerBooking} غرف`);
    }
    if (rules.maxGuestsPerRoom && requestedGuests > rules.maxGuestsPerRoom * requestedRooms) {
      validationErrors.push(`عدد النزلاء يتجاوز الطاقة الاستيعابية القصوى المسموح بها (${rules.maxGuestsPerRoom} نزلاء للغرفة)`);
    }
  }

  if (requestedGuests > room.maxGuests * requestedRooms) {
    validationErrors.push(`سعة الغرفة القصوى هي ${room.maxGuests} نزلاء للغرفة`);
  }

  const nightlyBreakdown: NightlyAvailabilityItem[] = [];
  let totalCost = 0;
  let allNightsAvailable = true;
  const closedDatesList = rules?.closedDates || [];

  for (let i = 0; i < diffDays; i++) {
    const curDateObj = new Date(start.getTime() + i * 86400000);
    const y = curDateObj.getFullYear();
    const m = String(curDateObj.getMonth() + 1).padStart(2, '0');
    const d = String(curDateObj.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const isClosed = closedDatesList.some(cd => dateStr >= cd.startDate && dateStr <= cd.endDate);
    if (isClosed) {
      allNightsAvailable = false;
      validationErrors.push(`الفندق مغلق للحجوزات في تاريخ: ${dateStr}`);
    }

    let nightlyRate = room.basePrice || 350;
    let seasonName: string | undefined = undefined;
    let allotment = room.availableRooms || room.totalRooms || 5;
    let extraBed = room.extraBedPrice || policy.extraBedPrice || 0;
    let extraPerson = room.extraPersonPrice || 0;

    // 1. Check Hotel Pricing Periods (Primary structured periods)
    const pricingPeriods = (hotel?.pricingPeriods || room.pricingPeriods || []);
    const matchingPeriod = pricingPeriods.find(p => {
      if (p.isActive === false) return false;
      if (dateStr < p.startDate || dateStr > p.endDate) return false;
      if (p.roomTypeId === 'all' || !p.roomTypeId) return true;
      if (p.roomTypeId === room.id) return true;
      if (p.roomTypeIds && p.roomTypeIds.includes(room.id)) return true;
      return false;
    });

    if (matchingPeriod) {
      seasonName = matchingPeriod.name;
      nightlyRate = matchingPeriod.roomOnlyPrice;
      if (matchingPeriod.roomDistribution && typeof matchingPeriod.roomDistribution[room.id] === 'number') {
        allotment = matchingPeriod.roomDistribution[room.id];
      } else if (typeof matchingPeriod.availableRooms === 'number' && matchingPeriod.availableRooms >= 0) {
        allotment = matchingPeriod.availableRooms;
      }
      if (matchingPeriod.minStayNights && diffDays < matchingPeriod.minStayNights) {
        validationErrors.push(`فترة "${matchingPeriod.name}" تشترط حداً أدنى للإقامة ${matchingPeriod.minStayNights} ليالٍ`);
      }
      // Evaluate linked booking rule set
      if (matchingPeriod.ruleSetId && hotel?.bookingRuleSets) {
        const linkedRule = hotel.bookingRuleSets.find(r => r.id === matchingPeriod.ruleSetId);
        if (linkedRule) {
          if (diffDays < linkedRule.minNights) {
            validationErrors.push(`قواعد فترة "${matchingPeriod.name}" تشترط حداً أدنى للإقامة ${linkedRule.minNights} ليالٍ`);
          }
          if (diffDays > linkedRule.maxNights) {
            validationErrors.push(`قواعد فترة "${matchingPeriod.name}" تسمح بحد أقصى ${linkedRule.maxNights} ليلة`);
          }
          if (requestedRooms < linkedRule.minRooms) {
            validationErrors.push(`قواعد فترة "${matchingPeriod.name}" تشترط حداً أدنى ${linkedRule.minRooms} غرف`);
          }
          if (requestedRooms > linkedRule.maxRooms) {
            validationErrors.push(`قواعد فترة "${matchingPeriod.name}" تسمح بحد أقصى ${linkedRule.maxRooms} غرف`);
          }
        }
      }
    } else if (room.seasonPeriods && room.seasonPeriods.length > 0) {
      // 2. Legacy fallback to room.seasonPeriods
      const match = room.seasonPeriods.find(s => dateStr >= s.startDate && dateStr <= s.endDate);
      if (match) {
        seasonName = match.name;
        nightlyRate = match.pricePerNight;
        if (typeof match.availableRoomsCount === 'number' && match.availableRoomsCount >= 0) {
          allotment = match.availableRoomsCount;
        }
        if (match.extraBedPrice !== undefined) extraBed = match.extraBedPrice;
        if (match.extraPersonPrice !== undefined) extraPerson = match.extraPersonPrice;
        if (match.isAvailable === false) {
          allNightsAvailable = false;
          validationErrors.push(`الغرفة غير متاحة في تاريخ: ${dateStr} (${match.name})`);
        }
        if (match.minStayNights && diffDays < match.minStayNights) {
          validationErrors.push(`موسم ${match.name} يشترط حداً أدنى ${match.minStayNights} ليالٍ`);
        }
      } else {
        allNightsAvailable = false;
        validationErrors.push(`التاريخ المحدد (${dateStr}) غير متاح للحجز.`);
      }
    } else if (pricingPeriods.length > 0) {
      // Hotel has structured pricing periods, but this specific date has no active period
      allNightsAvailable = false;
      validationErrors.push(`التاريخ المحدد (${dateStr}) خارج الفترات المتاحة للحجز أونلاين.`);
    } else {
      // Hotel has zero periods configured -> Strictly closed and unavailable
      allNightsAvailable = false;
      validationErrors.push(`التاريخ المحدد (${dateStr}) غير متاح للحجز (لم يتم تعيين فترة تسعير لهذا الفندق).`);
    }

    // حساب الحجوزات النشطة في هذه الليلة تحديداً (checkIn <= dateStr && checkOut > dateStr)
    const bookedOnNight = existingBookings
      .filter(b => {
        if (b.roomId !== room.id) return false;
        if (b.status === 'cancelled') return false;
        // Ignore expired pending bookings (default 24 hours, configurable)
        if (isBookingPendingExpired(b)) return false;
        return b.checkIn <= dateStr && b.checkOut > dateStr;
      })
      .reduce((sum, b) => sum + (Number(b.roomsCount) || 1), 0);

    const availableCount = Math.max(0, allotment - bookedOnNight);

    if (availableCount < requestedRooms) {
      allNightsAvailable = false;
      validationErrors.push(`لا تتوفر غرف كافية في تاريخ ${dateStr} (المتبقي بالمستودع: ${availableCount}، المطلوب: ${requestedRooms})`);
    }

    nightlyBreakdown.push({
      date: dateStr,
      rate: nightlyRate,
      seasonName,
      allotment,
      bookedCount: bookedOnNight,
      availableRooms: availableCount,
      isClosed,
      extraBedPrice: extraBed,
      extraPersonPrice: extraPerson
    });

    totalCost += nightlyRate * requestedRooms;
  }

  const minRemainingRooms = nightlyBreakdown.length > 0 
    ? Math.min(...nightlyBreakdown.map(n => n.availableRooms)) 
    : 0;

  const uniqueErrors = Array.from(new Set(validationErrors));

  return {
    isAvailable: allNightsAvailable && uniqueErrors.length === 0 && room.isActive && minRemainingRooms >= requestedRooms,
    totalNights: diffDays,
    totalCost,
    averageNightlyRate: Math.round(totalCost / (diffDays * requestedRooms)),
    minRemainingRooms,
    nightlyBreakdown,
    validationErrors: uniqueErrors
  };
}

export function calculateRoomPriceForDates(
  room: RoomTypeItem, 
  checkInDate: string, 
  checkOutDate: string,
  hotelPricingPeriods: HotelPricingPeriod[] = []
): {
  nightlyRate: number;
  totalCost: number;
  activeSeasonName?: string;
  isAvailable: boolean;
} {
  let activeRate = room.basePrice;
  let seasonName: string | undefined = undefined;
  let available = false;

  // 1. First check HotelPricingPeriods if provided
  if (hotelPricingPeriods && hotelPricingPeriods.length > 0 && checkInDate) {
    const match = hotelPricingPeriods.find(p => {
      if (p.isActive === false) return false;
      const overlaps = (checkInDate >= p.startDate && checkInDate <= p.endDate) ||
                       (checkOutDate >= p.startDate && checkOutDate <= p.endDate) ||
                       (checkInDate <= p.startDate && checkOutDate >= p.endDate);
      if (!overlaps) return false;
      if (p.roomTypeId === 'all' || !p.roomTypeId) return true;
      if (p.roomTypeId === room.id) return true;
      if (p.roomTypeIds && p.roomTypeIds.includes(room.id)) return true;
      return false;
    });

    if (match) {
      activeRate = match.roomOnlyPrice;
      seasonName = match.name;
      available = match.isAvailable !== false && room.status === 'available' && room.isActive !== false;
    } else {
      // Default to room base price and availability if active
      activeRate = room.basePrice || 350;
      seasonName = undefined;
      available = room.status === 'available' && room.isActive !== false && (room.basePrice || 0) > 0;
    }
  } else if (room.seasonPeriods && room.seasonPeriods.length > 0 && checkInDate) {
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
      available = match.isAvailable !== false && room.status === 'available' && room.isActive !== false;
    } else {
      activeRate = room.basePrice || 350;
      seasonName = undefined;
      available = room.status === 'available' && room.isActive !== false && (room.basePrice || 0) > 0;
    }
  } else {
    // Default base price and availability
    activeRate = room.basePrice || 350;
    seasonName = undefined;
    available = room.status === 'available' && room.isActive !== false && (room.basePrice || 0) > 0;
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

/**
 * حساب المخزون والغرف المتبقية للحجز أونلاين بناءً على فترات التسعير والحجوزات الحالية (مستودع الغرف)
 */
export interface RoomAvailabilityResult {
  isAvailable: boolean;
  totalAllotment: number;
  bookedCount: number;
  remainingRooms: number;
  activePeriod?: RoomSeasonPeriod;
  effectivePricePerNight: number;
  minStayNights: number;
  isPeriodSpecific: boolean;
  isClosedForBooking?: boolean;
}

export function calculateRoomAvailabilityAndRemaining(
  room: RoomTypeItem,
  checkInDate: string,
  checkOutDate: string,
  existingBookings: RoomBooking[] = [],
  hotelPricingPeriods: HotelPricingPeriod[] = []
): RoomAvailabilityResult {
  let match: RoomSeasonPeriod | undefined;
  let periodPrice = room.basePrice || 350;
  let periodAllotment = room.availableRooms || room.totalRooms || 5;
  let minStayNights = 1;
  let isPeriodMatched = false;

  if (hotelPricingPeriods && hotelPricingPeriods.length > 0 && checkInDate) {
    const hMatch = hotelPricingPeriods.find(p => {
      if (p.isActive === false) return false;
      const overlaps = (checkInDate >= p.startDate && checkInDate <= p.endDate) ||
                       (checkOutDate >= p.startDate && checkOutDate <= p.endDate) ||
                       (checkInDate <= p.startDate && checkOutDate >= p.endDate);
      if (!overlaps) return false;
      if (p.roomTypeId === 'all' || !p.roomTypeId) return true;
      if (p.roomTypeId === room.id) return true;
      if (p.roomTypeIds && p.roomTypeIds.includes(room.id)) return true;
      return false;
    });

    if (hMatch) {
      isPeriodMatched = true;
      periodPrice = hMatch.roomOnlyPrice;
      minStayNights = hMatch.minStayNights || 1;
      if (hMatch.roomDistribution && typeof hMatch.roomDistribution[room.id] === 'number') {
        periodAllotment = hMatch.roomDistribution[room.id];
      } else if (typeof hMatch.availableRooms === 'number') {
        periodAllotment = hMatch.availableRooms;
      }
      match = {
        id: hMatch.id,
        name: hMatch.name,
        startDate: hMatch.startDate,
        endDate: hMatch.endDate,
        pricePerNight: hMatch.roomOnlyPrice,
        minStayNights: hMatch.minStayNights || 1,
        isAvailable: hMatch.isAvailable !== false,
        availableRoomsCount: periodAllotment
      };
    }
  } else if (room.seasonPeriods && room.seasonPeriods.length > 0 && checkInDate) {
    const sMatch = room.seasonPeriods.find(s => {
      if (s.isAvailable === false) {
        return checkInDate <= s.endDate && checkOutDate >= s.startDate;
      }
      return (checkInDate >= s.startDate && checkInDate <= s.endDate) ||
             (checkOutDate >= s.startDate && checkOutDate <= s.endDate) ||
             (checkInDate <= s.startDate && checkOutDate >= s.endDate);
    });

    if (sMatch) {
      isPeriodMatched = true;
      match = sMatch;
      periodPrice = Number(sMatch.pricePerNight);
      minStayNights = sMatch.minStayNights || 1;
      if (typeof sMatch.availableRoomsCount === 'number') {
        periodAllotment = sMatch.availableRoomsCount;
      }
    }
  }

  const effectivePricePerNight = periodPrice;

  if (room.isActive === false || room.status === 'maintenance') {
    return {
      isAvailable: false,
      totalAllotment: 0,
      bookedCount: 0,
      remainingRooms: 0,
      activePeriod: match,
      effectivePricePerNight,
      minStayNights,
      isPeriodSpecific: isPeriodMatched,
      isClosedForBooking: true
    };
  }

  // Explicit Stop-Sell check
  if (match && match.isAvailable === false) {
    return {
      isAvailable: false,
      totalAllotment: 0,
      bookedCount: 0,
      remainingRooms: 0,
      activePeriod: match,
      effectivePricePerNight,
      minStayNights,
      isPeriodSpecific: true,
      isClosedForBooking: true
    };
  }

  // مستودع المخزون: إذا تم تحديد عدد غرف للفترة نستخدمه، وإلا نستخدم عدد الغرف المتاح للغرفة
  const isPeriodSpecific = Boolean(match && match.availableRoomsCount !== undefined && match.availableRoomsCount > 0);
  const totalAllotment = isPeriodSpecific
    ? Number(match!.availableRoomsCount)
    : (Number(room.availableRooms) || Number(room.totalRooms) || 5);

  // حساب التوفر لكل ليلة في الإقامة
  if (checkInDate && checkOutDate) {
    const nightDates = getStayNightDates(checkInDate, checkOutDate);
    if (nightDates.length > 0) {
      let minRemaining = totalAllotment;
      let maxBookedOnAnyNight = 0;

      for (const d of nightDates) {
        let nightAllotment = totalAllotment;
        if (hotelPricingPeriods && hotelPricingPeriods.length > 0) {
          const hNightMatch = hotelPricingPeriods.find(p => {
            if (p.isActive === false) return false;
            if (d < p.startDate || d > p.endDate) return false;
            if (p.roomTypeId === 'all' || !p.roomTypeId) return true;
            if (p.roomTypeId === room.id) return true;
            if (p.roomTypeIds && p.roomTypeIds.includes(room.id)) return true;
            return false;
          });
          if (hNightMatch) {
            if (hNightMatch.roomDistribution && typeof hNightMatch.roomDistribution[room.id] === 'number') {
              nightAllotment = hNightMatch.roomDistribution[room.id];
            } else if (typeof hNightMatch.availableRooms === 'number') {
              nightAllotment = hNightMatch.availableRooms;
            }
          }
        } else if (room.seasonPeriods && room.seasonPeriods.length > 0) {
          const nightMatch = room.seasonPeriods.find(s => d >= s.startDate && d <= s.endDate);
          if (nightMatch) {
            if (nightMatch.isAvailable === false) {
              return {
                isAvailable: false,
                totalAllotment,
                bookedCount: totalAllotment,
                remainingRooms: 0,
                activePeriod: nightMatch,
                effectivePricePerNight,
                minStayNights,
                isPeriodSpecific: true,
                isClosedForBooking: true
              };
            }
            if (typeof nightMatch.availableRoomsCount === 'number' && nightMatch.availableRoomsCount >= 0) {
              nightAllotment = nightMatch.availableRoomsCount;
            }
          }
        }

        const bookedOnNight = existingBookings
          .filter(b => {
            if (b.roomId !== room.id) return false;
            if (b.status === 'cancelled') return false;
            if (isBookingPendingExpired(b)) return false;
            return b.checkIn <= d && b.checkOut > d;
          })
          .reduce((sum, b) => sum + (Number(b.roomsCount) || 1), 0);

        const remOnNight = Math.max(0, nightAllotment - bookedOnNight);
        if (remOnNight < minRemaining) minRemaining = remOnNight;
        if (bookedOnNight > maxBookedOnAnyNight) maxBookedOnAnyNight = bookedOnNight;
      }

      const isRoomStatusOk = room.status !== 'booked';
      const isAvailable = minRemaining > 0 && isRoomStatusOk;
      return {
        isAvailable,
        totalAllotment,
        bookedCount: maxBookedOnAnyNight,
        remainingRooms: minRemaining,
        activePeriod: match,
        effectivePricePerNight,
        minStayNights,
        isPeriodSpecific,
        isClosedForBooking: !isAvailable
      };
    }
  }

  // في حال لم يتم تحديد التواريخ بعد
  const remainingRooms = Math.max(0, totalAllotment);
  const isRoomStatusOk = room.status !== 'booked';
  const isAvailable = remainingRooms > 0 && isRoomStatusOk;

  return {
    isAvailable,
    totalAllotment,
    bookedCount: 0,
    remainingRooms,
    activePeriod: match,
    effectivePricePerNight,
    minStayNights,
    isPeriodSpecific,
    isClosedForBooking: !isAvailable
  };
}

/**
 * خيارات الباقات المجهزة تلقائياً للغرفة (إقامة فقط، شامل الإفطار، نصف إقامة)
 * تربط نوع الغرفة وسعتها تلقائياً مع السعر وخطط الوجبات وأساس الاحتساب
 */
export interface BundledRateOption {
  mealId: string;
  mealType: MealPlanType;
  title: string;
  shortTitle: string;
  mealName: string;
  pricePerNight: number;
  totalStayPrice: number;
  mealAddonPerNight: number;
  pricingBasisText: string;
  isMealIncluded: boolean;
  badge?: string;
  isRoomOnly: boolean;
}

export function calculateBundledRatesForRoom(
  room: RoomTypeItem,
  baseNightlyRate: number,
  mealPlans: MealPlanOption[] = [],
  guestCount: number = 2,
  nights: number = 1
): BundledRateOption[] {
  // 1. Get raw active meals
  const rawActiveMeals = (mealPlans && mealPlans.length > 0)
    ? mealPlans.filter(m => m.isActive !== false)
    : [
        { id: 'meal_none', type: 'none' as const, name: 'إقامة فقط (بدون وجبات)', price: 0, pricingBasis: 'per_person_per_night' as const, isActive: true },
        { id: 'meal_breakfast', type: 'breakfast' as const, name: 'شامل بوفيه إفطار', price: 45, pricingBasis: 'per_person_per_night' as const, isActive: true }
      ];

  // 2. Strict Deduplication: Always have EXACTLY ONE canonical Room Only option
  const roomOnlyPlan: MealPlanOption = {
    id: 'meal_none',
    type: 'none' as const,
    name: 'إقامة فقط (بدون وجبات)',
    nameEn: 'Room Only (No Meals)',
    price: 0,
    pricePerPersonPerNight: 0,
    pricingBasis: 'per_person_per_night' as const,
    isActive: true,
    description: 'إقامة مريحة في الغرفة مع حرية اختيار وجباتك'
  };

  // 3. Collect only genuine food plans (price > 0 and not room only) with deduplication
  const foodPlans: MealPlanOption[] = [];
  const seenKeys = new Set<string>();

  for (const m of rawActiveMeals) {
    const rawPrice = Number(m.price ?? m.pricePerPersonPerNight ?? 0);
    const isRoomOnlyItem = 
      m.type === 'none' || 
      (m as any).type === 'room_only' || 
      m.id === 'meal_none' || 
      rawPrice === 0 || 
      (m.name && (m.name.includes('بدون وجبات') || m.name.includes('إقامة فقط')));

    if (isRoomOnlyItem) {
      // Absorbed into canonical roomOnlyPlan
      continue;
    }

    const key = (m.id || m.type || m.name || '').trim().toLowerCase();
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      foodPlans.push(m);
    }
  }

  // 4. If room defines specific mealPlanIds, filter allowed food plans
  let applicableFoodPlans = foodPlans;
  if (room.mealPlanIds && Array.isArray(room.mealPlanIds) && room.mealPlanIds.length > 0) {
    applicableFoodPlans = foodPlans.filter(m => room.mealPlanIds!.includes(m.id));
  }

  // 5. Sort: breakfast first, then half_board, full_board, then others
  applicableFoodPlans.sort((a, b) => {
    const order: Record<string, number> = { breakfast: 1, half_board: 2, full_board: 3 };
    return (order[a.type] || 4) - (order[b.type] || 4);
  });

  // Always exactly one Room Only plan + sorted unique food plans
  const allPlansToBundle: MealPlanOption[] = [roomOnlyPlan, ...applicableFoodPlans];

  const effectiveGuests = Math.max(1, Math.min(guestCount, room.maxGuests || 2));
  const effectiveNights = Math.max(1, nights || 1);

  return allPlansToBundle.map(meal => {
    const rawPrice = Number(meal.price ?? meal.pricePerPersonPerNight ?? 0);
    const isRoomOnly = meal.type === 'none' || rawPrice === 0;

    let mealAddonPerNight = 0;
    let pricingBasisText = 'السعر الأساسي للغرفة';

    if (!isRoomOnly) {
      if (meal.pricingBasis === 'per_room_per_night') {
        mealAddonPerNight = rawPrice;
        pricingBasisText = `+${rawPrice} ر.س للغرفة / ليلة`;
      } else {
        mealAddonPerNight = rawPrice * effectiveGuests;
        pricingBasisText = `+${rawPrice} ر.س للفرد (${effectiveGuests} أفراد = +${mealAddonPerNight} ر.س/ليلة)`;
      }
    }

    const pricePerNight = Math.max(0, baseNightlyRate + mealAddonPerNight);
    const totalStayPrice = pricePerNight * effectiveNights;

    let title = isRoomOnly 
      ? 'إقامة فقط (بدون وجبات)' 
      : meal.type === 'breakfast'
      ? `شامل ${meal.name || 'بوفيه الإفطار'}`
      : meal.type === 'half_board'
      ? `شامل نصف إقامة (${meal.name})`
      : `شامل ${meal.name}`;

    let shortTitle = isRoomOnly
      ? 'بدون وجبات'
      : meal.type === 'breakfast'
      ? 'شامل الإفطار'
      : meal.type === 'half_board'
      ? 'نصف إقامة'
      : meal.name;

    let badge = isRoomOnly 
      ? 'الخيار الاقتصادي' 
      : meal.type === 'breakfast' 
      ? 'الأكثر طلباً ⭐' 
      : undefined;

    return {
      mealId: meal.id,
      mealType: meal.type,
      title,
      shortTitle,
      mealName: meal.name,
      pricePerNight,
      totalStayPrice,
      mealAddonPerNight,
      pricingBasisText,
      isMealIncluded: !isRoomOnly,
      badge,
      isRoomOnly
    };
  });
}

/**
 * حساب المخزون المتبقي للباقة المحددة (مستودع الباقات)
 */
export interface PackageAvailabilityResult {
  isAvailable: boolean;
  totalAllotment?: number;
  bookedCount: number;
  remainingCount: number;
  isSoldOut: boolean;
}

export function calculatePackageRemaining(
  pkg: RoomPackageOption,
  existingBookings: RoomBooking[] = []
): PackageAvailabilityResult {
  const totalAllotment = pkg.availableRoomsCount !== undefined && pkg.availableRoomsCount > 0 ? Number(pkg.availableRoomsCount) : 5;
  const bookedCount = existingBookings
    .filter(b => {
      if (b.status === 'cancelled') return false;
      if (b.packageId && b.packageId === pkg.id) return true;
      if (b.specialRequests && b.specialRequests.includes(pkg.name)) return true;
      if (b.roomId !== pkg.roomId) return false;
      if (!pkg.startDate || !pkg.endDate) return false;
      return b.checkIn < pkg.endDate && b.checkOut > pkg.startDate;
    })
    .reduce((sum, b) => sum + (Number(b.roomsCount) || 1), 0);

  const remainingCount = Math.max(0, totalAllotment - bookedCount);
  const isSoldOut = remainingCount <= 0;

  return {
    isAvailable: pkg.isActive && remainingCount > 0,
    totalAllotment: pkg.availableRoomsCount,
    bookedCount,
    remainingCount,
    isSoldOut
  };
}

export function getHotelPolicy(hotel?: Hotel): HotelBookingPolicy {
  if (!hotel) return { ...DEFAULT_BOOKING_POLICY };
  
  const raw: any = hotel.bookingPolicy;
  if (!raw) return { ...DEFAULT_BOOKING_POLICY };
  
  // If stored as simple policy type string e.g. 'flexible' | 'moderate' | 'strict'
  if (typeof raw === 'string') {
    return {
      ...DEFAULT_BOOKING_POLICY,
      cancellationType: raw === 'strict' ? 'strict' : (raw === 'moderate' ? 'moderate' : 'free_flexible'),
      cancellationNoticeDays: raw === 'strict' ? 7 : (raw === 'moderate' ? 3 : 2)
    };
  }

  // If stored as full HotelBookingPolicy object, merge safely with DEFAULT_BOOKING_POLICY
  if (typeof raw === 'object') {
    return {
      ...DEFAULT_BOOKING_POLICY,
      ...raw,
      termsAndConditionsList: Array.isArray(raw.termsAndConditionsList) 
        ? raw.termsAndConditionsList 
        : DEFAULT_BOOKING_POLICY.termsAndConditionsList
    };
  }

  return { ...DEFAULT_BOOKING_POLICY };
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
  },
  {
    id: 'room_manazel_deluxe_king',
    hotelId: 'hotel_1790706496971', // منازل الزهراء (المدينة المنورة)
    name: 'غرفة ديلوكس كينج بإطلالة المدينة',
    nameEn: 'Deluxe King Room City View',
    category: 'غرفة ديلوكس',
    basePrice: 420,
    totalRooms: 15,
    availableRooms: 10,
    maxGuests: 2,
    bedType: '1 سرير كينج كبير فاخر',
    roomSize: '34 م²',
    features: ['إطلالة متميزة على المنطقة المركزية', 'واي فاي مجاني فائق السرعة', 'شاشة ذكية 55 بوصة', 'عازل متطور للصوت', 'حمام رخامي خاص'],
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80'
    ],
    keyPrefix: 'MZ-K',
    status: 'available',
    isActive: true,
    order: 1
  },
  {
    id: 'room_manazel_twin',
    hotelId: 'hotel_1790706496971',
    name: 'غرفة قياسية بسريرين منفصلين',
    nameEn: 'Standard Twin Room',
    category: 'غرفة قياسية',
    basePrice: 360,
    totalRooms: 20,
    availableRooms: 14,
    maxGuests: 2,
    bedType: '2 سرير مفرد مريح',
    roomSize: '30 م²',
    features: ['واي فاي مجاني', 'ميني بار وغلاية شاي', 'تكييف مركزي مريح', 'شاشة تلفزيون ذكية'],
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80'
    ],
    keyPrefix: 'MZ-T',
    status: 'available',
    isActive: true,
    order: 2
  },
  {
    id: 'room_manazel_family_suite',
    hotelId: 'hotel_1790706496971',
    name: 'جناح عائلي رحب لضيوف المسجد النبوي',
    nameEn: 'Madinah Family Suite',
    category: 'جناح عائلي',
    basePrice: 580,
    totalRooms: 8,
    availableRooms: 5,
    maxGuests: 4,
    bedType: '1 سرير كينج + 2 سرير مفرد',
    roomSize: '52 م²',
    features: ['صالة جلوس واسعة', 'ماكينة قهوة نسبريسو', 'واي فاي مجاني', 'شاشتان ذكيتان', 'روب حمام ومستلزمات VIP'],
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'
    ],
    keyPrefix: 'MZ-FAM',
    status: 'available',
    isActive: true,
    order: 3
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
  allowPublicBookingCreation: true,
  mode: 'full',
  showInHeader: true,
  showTrackBookingModal: true,
  showInHero: true,
  showInHotelDetail: true,
  bookingEmail: 'prestigeksa.umrah@gmail.com',
  bookingWhatsApp: '+966560580250',
  enableWhatsAppRedirect: true,
  enableEmailNotification: true,
  autoAssignDigitalKey: true,
  currency: 'ر.س',
  invoiceCompanyName: 'شركة برستيج لإدارة وتشغيل الفنادق',
  invoiceCompanySubtitle: 'للضيافة الفندقية وإدارة الإيواء السياحي بمكة والمدينة',
  invoiceCompanyAddress: 'مكة المكرمة - المملكة العربية السعودية',
  invoiceCrNumber: '4031258941',
  showInvoiceCr: true,
  invoiceTaxNumber: '310458921400003',
  showInvoiceTaxNo: true,
  invoiceSupportTitle: 'مجموعة برستيج الفندقية • المملكة العربية السعودية',
  invoiceSupportName: 'إدارة الحجوزات والمبيعات',
  invoiceSupportPhone: '+966544076726',
  invoiceSupportEmail: 'prestigeksa.umrah@gmail.com',
  showInvoiceSupportFooter: true,
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwfdkkIfLBAg7KsaEA4QEjbMWnqqvwBs0GkjcOy9HQfMG4zKcui3rs-ANsByJ5zztnB/exec',
  appsScriptSecret: 'prestige1478965236',
  enableEmailSending: true,
  companyEmail: 'prestigeksa.umrah@gmail.com'
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

export function mapDbRowToRoom(row: any): RoomTypeItem {
  return {
    id: row.id,
    hotelId: row.hotel_id || row.hotelId,
    name: row.name,
    nameEn: row.name_en || row.nameEn || '',
    category: row.category || 'غرفة فاخرة',
    basePrice: Number(row.base_price ?? row.basePrice ?? 350),
    totalRooms: Number(row.total_rooms ?? row.totalRooms ?? 5),
    availableRooms: Number(row.available_rooms ?? row.availableRooms ?? 5),
    maxGuests: Number(row.max_guests ?? row.maxGuests ?? 2),
    bedType: row.bed_type || row.bedType || 'سرير كينج مزدوج',
    roomSize: row.room_size || row.roomSize || '32 م²',
    features: Array.isArray(row.features) ? row.features : (typeof row.features === 'string' ? JSON.parse(row.features || '[]') : []),
    images: Array.isArray(row.images) ? row.images : (typeof row.images === 'string' ? JSON.parse(row.images || '[]') : []),
    keyPrefix: row.key_prefix || row.keyPrefix || 'KEY',
    status: row.status || 'available',
    isActive: typeof row.is_active === 'boolean' ? row.is_active : (row.isActive !== false),
    seasonPeriods: Array.isArray(row.season_periods) ? row.season_periods : (Array.isArray(row.seasonPeriods) ? row.seasonPeriods : []),
    packages: Array.isArray(row.packages) ? row.packages : [],
    services: Array.isArray(row.services) ? row.services : (Array.isArray(row.features) ? row.features : []),
    mealOptions: Array.isArray(row.meal_options) ? row.meal_options : [],
    showFreeCancellation: row.show_free_cancellation !== false,
    showPayAtHotel: row.show_pay_at_hotel !== false,
    order: typeof row.order_num === 'number' ? row.order_num : (row.order || 0)
  };
}

export function createDefaultRoomsForHotel(hotelId: string): RoomTypeItem[] {
  const prefix = hotelId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'RM';
  return [
    {
      id: `room_${hotelId}_std_king`,
      hotelId,
      name: 'غرفة قياسية بسرير كينج فاخر',
      nameEn: 'Standard King Room',
      category: 'غرفة قياسية',
      basePrice: 380,
      totalRooms: 12,
      availableRooms: 8,
      maxGuests: 2,
      bedType: '1 سرير كينج كبير',
      roomSize: '32 م²',
      features: ['واي فاي مجاني فائق السرعة', 'شاشة تلفزيون ذكية', 'حمام رخامي خاص مع كافة المستلزمات', 'تكييف مركزي هادئ', 'غلاية شاي وقهوة'],
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80'
      ],
      keyPrefix: `${prefix}-K`,
      status: 'available',
      isActive: true,
      order: 1
    },
    {
      id: `room_${hotelId}_dlx_twin`,
      hotelId,
      name: 'غرفة ديلوكس بسريرين منفصلين (مطلة)',
      nameEn: 'Deluxe Twin Room with View',
      category: 'غرفة ديلوكس',
      basePrice: 460,
      totalRooms: 10,
      availableRooms: 6,
      maxGuests: 2,
      bedType: '2 سرير مفرد كبير',
      roomSize: '38 م²',
      features: ['إطلالة متميزة', 'واي فاي مجاني', 'ميني بار وغلاية', 'مكتب عمل وشاشة ذكية', 'عازل متطور للصوت'],
      images: [
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80'
      ],
      keyPrefix: `${prefix}-D`,
      status: 'available',
      isActive: true,
      order: 2
    },
    {
      id: `room_${hotelId}_fam_suite`,
      hotelId,
      name: 'جناح عائلي رحب لضيوف الرحمن',
      nameEn: 'Spacious Family Suite',
      category: 'جناح عائلي',
      basePrice: 620,
      totalRooms: 8,
      availableRooms: 5,
      maxGuests: 4,
      bedType: '1 سرير كينج + 2 سرير مفرد',
      roomSize: '55 م²',
      features: ['صالة جلوس مستقلة', 'شاشتان ذكيتان', 'روب حمام ومستلزمات VIP', 'ماكينة قهوة نسبريسو', 'إطلالة بانورامية'],
      images: [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'
      ],
      keyPrefix: `${prefix}-S`,
      status: 'available',
      isActive: true,
      order: 3
    }
  ];
}

export async function getRoomsFromDb(hotelId?: string): Promise<RoomTypeItem[]> {
  const localRooms = getLocal<RoomTypeItem[]>(ROOMS_KEY, DEFAULT_ROOM_TYPES);
  
  // Try Supabase first
  const sb = getSb();
  if (sb) {
    try {
      let query = sb.from('room_types').select('*').order('order_num', { ascending: true });
      if (hotelId) {
        query = query.eq('hotel_id', hotelId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapDbRowToRoom);
        if (!hotelId) {
          setLocal(ROOMS_KEY, mapped);
        } else {
          // Merge into local cache
          const others = localRooms.filter(r => r.hotelId !== hotelId);
          setLocal(ROOMS_KEY, [...mapped, ...others]);
        }
        return mapped;
      }
    } catch (err) {
      console.warn('[Supabase] Failed fetching room_types:', err);
    }
  }

  if (hotelId) {
    const filtered = localRooms.filter(r => r.hotelId === hotelId && !r.id.includes(`_${hotelId}_`));
    return filtered;
  }
  return localRooms.filter(r => !r.id.includes('_dlx_king') || r.hotelId === 'hotel_test_1790703048618');
}

export async function saveRoomToDb(room: RoomTypeItem): Promise<void> {
  const current = getLocal<RoomTypeItem[]>(ROOMS_KEY, DEFAULT_ROOM_TYPES);
  const existingIdx = current.findIndex(r => r.id === room.id);
  const oldRoom = existingIdx >= 0 ? current[existingIdx] : null;

  let updated: RoomTypeItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = room;
  } else {
    updated = [room, ...current];
  }
  setLocal(ROOMS_KEY, updated);

  // Record audit log for pricing or availability change
  if (oldRoom && (oldRoom.basePrice !== room.basePrice || oldRoom.availableRooms !== room.availableRooms || oldRoom.status !== room.status)) {
    const admin = getCurrentAdminUser();
    recordAuditLog({
      userId: admin?.id || 'admin_user',
      userName: admin?.name || admin?.username || 'مشرف الأسعار',
      userEmail: admin?.email,
      module: 'availability_pricing',
      action: 'تعديل أسعار وتوفر الغرفة',
      actionLabelAr: 'تعديل السعر والمخزون',
      recordId: room.id,
      recordTitle: `${room.name} (${room.hotelId})`,
      details: `تحديث أسعار أو توفر الغرفة "${room.name}" - السعر: ${oldRoom.basePrice} -> ${room.basePrice} ر.س | الغرف المتاحة: ${oldRoom.availableRooms} -> ${room.availableRooms}`,
      oldValue: { basePrice: oldRoom.basePrice, availableRooms: oldRoom.availableRooms, status: oldRoom.status },
      newValue: { basePrice: room.basePrice, availableRooms: room.availableRooms, status: room.status }
    }).catch(() => {});
  } else if (!oldRoom) {
    const admin = getCurrentAdminUser();
    recordAuditLog({
      userId: admin?.id || 'admin_user',
      userName: admin?.name || admin?.username || 'مشرف الغرف',
      userEmail: admin?.email,
      module: 'availability_pricing',
      action: 'إضافة فئة غرفة جديدة',
      actionLabelAr: 'إضافة غرفة',
      recordId: room.id,
      recordTitle: `${room.name} (${room.hotelId})`,
      details: `إضافة غرفة جديدة "${room.name}" بسعر أساسي ${room.basePrice} ر.س ومخزون ${room.availableRooms} غرفة`,
      oldValue: null,
      newValue: { basePrice: room.basePrice, availableRooms: room.availableRooms, status: room.status }
    }).catch(() => {});
  }

  // Sync with Supabase
  const sb = getSb();
  if (sb) {
    try {
      const payload = {
        id: room.id,
        hotel_id: room.hotelId,
        name: room.name,
        name_en: room.nameEn || '',
        category: room.category || 'غرفة فاخرة',
        base_price: Number(room.basePrice || 0),
        total_rooms: Number(room.totalRooms || 1),
        available_rooms: Number(room.availableRooms || 0),
        max_guests: Number(room.maxGuests || 2),
        bed_type: room.bedType || 'سرير كينج مزدوج',
        room_size: room.roomSize || '32 م²',
        features: room.features || [],
        images: room.images || [],
        key_prefix: room.keyPrefix || 'KEY',
        status: room.status || 'available',
        season_periods: room.seasonPeriods || [],
        packages: room.packages || [],
        services: room.features || [],
        meal_options: room.mealOptions || [],
        show_free_cancellation: room.showFreeCancellation !== false,
        show_pay_at_hotel: room.showPayAtHotel !== false,
        price_includes_tax: room.priceIncludesTax !== false,
        is_active: room.isActive !== false,
        order_num: typeof room.order === 'number' ? room.order : 0,
        updated_at: new Date().toISOString()
      };
      await sb.from('room_types').upsert(payload);
    } catch (err) {
      console.warn('[Supabase] Failed upserting room:', err);
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
    } catch (err) {
      console.warn('[Supabase] Failed deleting room:', err);
    }
  }
}

// ==========================================
// MEAL PLANS MANAGEMENT
// ==========================================

export async function getMealPlansFromDb(hotelId?: string): Promise<MealPlanOption[]> {
  const allPlans = getLocal<MealPlanOption[]>(MEALS_KEY, DEFAULT_MEAL_PLANS);
  const sb = getSb();
  if (sb) {
    try {
      // 1. If hotelId is provided, first check if hotel has custom meal plans stored in JSONB
      if (hotelId) {
        const { data: hotelRow } = await sb.from('hotels').select('id, booking_policy, location').eq('id', hotelId).maybeSingle();
        if (hotelRow) {
          let policy: any = {};
          if (typeof hotelRow.booking_policy === 'object' && hotelRow.booking_policy !== null) {
            policy = hotelRow.booking_policy;
          } else if (typeof hotelRow.booking_policy === 'string') {
            try { policy = JSON.parse(hotelRow.booking_policy); } catch { policy = {}; }
          }

          let loc: any = {};
          if (typeof hotelRow.location === 'object' && hotelRow.location !== null) {
            loc = hotelRow.location;
          } else if (typeof hotelRow.location === 'string') {
            try { loc = JSON.parse(hotelRow.location); } catch { loc = {}; }
          }

          const hotelCustomPlans = policy.mealPlans || loc.mealPlans;
          if (Array.isArray(hotelCustomPlans) && hotelCustomPlans.length > 0) {
            const mappedCustom: MealPlanOption[] = hotelCustomPlans.map((m: any) => ({
              ...m,
              hotelId,
              price: Number(m.price ?? m.pricePerPersonPerNight ?? 0),
              pricePerPersonPerNight: Number(m.pricePerPersonPerNight ?? m.price ?? 0),
              pricingBasis: m.pricingBasis || 'per_person_per_night'
            }));
            return mappedCustom;
          }
        }
      }

      // 2. Check if meal_plans table has records for this hotel specifically
      if (hotelId) {
        try {
          const { data: hotelSpecificData, error: hotelErr } = await sb.from('meal_plans').select('*').eq('hotel_id', hotelId);
          if (!hotelErr && Array.isArray(hotelSpecificData) && hotelSpecificData.length > 0) {
            return hotelSpecificData.map((row: any) => ({
              id: row.id,
              hotelId: row.hotel_id || hotelId,
              type: row.type || 'breakfast',
              name: row.name,
              nameEn: row.name_en || row.nameEn || '',
              price: Number(row.price ?? row.price_per_person_per_night ?? 0),
              pricePerPersonPerNight: Number(row.price_per_person_per_night ?? row.price ?? 0),
              pricingBasis: row.pricing_basis || 'per_person_per_night',
              description: row.description || '',
              isActive: typeof row.is_active === 'boolean' ? row.is_active : (row.isActive !== false)
            }));
          }
        } catch {
          // hotel_id column might not exist yet if user hasn't run the SQL script
        }
      }

      // 3. Fallback: query global meal_plans table
      const { data, error } = await sb.from('meal_plans').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        const relevantRows = hotelId 
          ? data.filter((row: any) => !row.hotel_id || row.hotel_id === hotelId || row.hotel_id === 'all')
          : data.filter((row: any) => !row.hotel_id || row.hotel_id === 'all');

        const activeRows = relevantRows.length > 0 ? relevantRows : data;

        const mapped: MealPlanOption[] = activeRows.map((row: any) => ({
          id: row.id,
          hotelId: row.hotel_id || undefined,
          type: row.type || 'breakfast',
          name: row.name,
          nameEn: row.name_en || row.nameEn || '',
          price: Number(row.price ?? row.price_per_person_per_night ?? 0),
          pricePerPersonPerNight: Number(row.price_per_person_per_night ?? row.price ?? 0),
          pricingBasis: row.pricing_basis || 'per_person_per_night',
          description: row.description || '',
          isActive: typeof row.is_active === 'boolean' ? row.is_active : (row.isActive !== false)
        }));
        setLocal(MEALS_KEY, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('[Supabase] Exception fetching meal plans:', err);
    }
  }

  if (hotelId) {
    const hotelSpecific = allPlans.filter(m => m.hotelId === hotelId);
    if (hotelSpecific.length > 0) return hotelSpecific;
  }
  return allPlans;
}

export async function saveMealPlansToDb(plans: MealPlanOption[], hotelId?: string): Promise<void> {
  const current = getLocal<MealPlanOption[]>(MEALS_KEY, DEFAULT_MEAL_PLANS);
  // Merge or replace
  let updated: MealPlanOption[];
  if (hotelId) {
    const withoutThisHotel = current.filter(p => p.hotelId !== hotelId);
    const stampedPlans = plans.map(p => ({ ...p, hotelId }));
    updated = [...withoutThisHotel, ...stampedPlans];
  } else {
    updated = plans;
  }
  setLocal(MEALS_KEY, updated);

  const sb = getSb();
  if (sb) {
    try {
      // 1. If hotelId is provided, save custom meal plans into hotel's booking_policy and location JSONB
      if (hotelId) {
        const { data: hotelRow } = await sb.from('hotels').select('id, booking_policy, location').eq('id', hotelId).maybeSingle();
        if (hotelRow) {
          let currentPolicy: any = {};
          if (typeof hotelRow.booking_policy === 'object' && hotelRow.booking_policy !== null) {
            currentPolicy = hotelRow.booking_policy;
          } else if (typeof hotelRow.booking_policy === 'string') {
            try { currentPolicy = JSON.parse(hotelRow.booking_policy); } catch { currentPolicy = {}; }
          }
          currentPolicy.mealPlans = plans;

          let currentLoc: any = {};
          if (typeof hotelRow.location === 'object' && hotelRow.location !== null) {
            currentLoc = hotelRow.location;
          } else if (typeof hotelRow.location === 'string') {
            try { currentLoc = JSON.parse(hotelRow.location); } catch { currentLoc = {}; }
          }
          currentLoc.mealPlans = plans;

          await sb.from('hotels').update({ 
            booking_policy: currentPolicy,
            location: currentLoc 
          }).eq('id', hotelId);
        }
      }

      // 2. Persist to public.meal_plans table with strict deduplication by ID to prevent Postgres 21000 conflict error
      const payloadMap = new Map<string, any>();
      plans.forEach(p => {
        const rawId = p.id || `meal_${p.type || 'plan'}`;
        // Ensure unique ID per hotel so different hotels don't collide on the primary key
        const finalId = hotelId ? (rawId.includes(hotelId) ? rawId : `${rawId}_${hotelId}`) : rawId;
        const priceVal = Number(p.price ?? p.pricePerPersonPerNight ?? 0);

        payloadMap.set(finalId, {
          id: finalId,
          type: p.type || 'breakfast',
          name: p.name || 'خطة وجبة',
          name_en: p.nameEn || '',
          price_per_person_per_night: priceVal,
          description: p.description || '',
          is_active: p.isActive !== false,
          ...(hotelId ? { hotel_id: hotelId } : {}),
          pricing_basis: p.pricingBasis || 'per_person_per_night'
        });
      });

      const uniquePayloads = Array.from(payloadMap.values());

      if (uniquePayloads.length > 0) {
        // First try with hotel_id & pricing_basis
        const { error: fullError } = await sb.from('meal_plans').upsert(uniquePayloads);
        if (fullError) {
          // If schema cache indicates hotel_id column doesn't exist yet, retry with base columns only
          console.warn('[Supabase] Retrying meal_plans upsert with standard base columns:', fullError.message);
          const basePayloads = uniquePayloads.map(({ hotel_id: _h, pricing_basis: _b, ...rest }) => rest);
          await sb.from('meal_plans').upsert(basePayloads);
        }
      }
    } catch (err) {
      console.warn('[Supabase] saveMealPlansToDb safe handled exception:', err);
    }
  }
}

export async function deleteMealPlanFromDb(mealId: string, hotelId?: string): Promise<void> {
  const current = getLocal<MealPlanOption[]>(MEALS_KEY, DEFAULT_MEAL_PLANS);
  const updated = current.filter(p => p.id !== mealId);
  setLocal(MEALS_KEY, updated);

  const sb = getSb();
  if (sb) {
    try {
      if (hotelId) {
        const { data: hotelRow } = await sb.from('hotels').select('id, booking_policy, location').eq('id', hotelId).maybeSingle();
        if (hotelRow) {
          let policy: any = {};
          if (typeof hotelRow.booking_policy === 'object' && hotelRow.booking_policy !== null) {
            policy = hotelRow.booking_policy;
          } else if (typeof hotelRow.booking_policy === 'string') {
            try { policy = JSON.parse(hotelRow.booking_policy); } catch { policy = {}; }
          }

          let loc: any = {};
          if (typeof hotelRow.location === 'object' && hotelRow.location !== null) {
            loc = hotelRow.location;
          } else if (typeof hotelRow.location === 'string') {
            try { loc = JSON.parse(hotelRow.location); } catch { loc = {}; }
          }
          
          if (Array.isArray(policy.mealPlans)) {
            policy.mealPlans = policy.mealPlans.filter((m: any) => m.id !== mealId);
          }
          if (Array.isArray(loc.mealPlans)) {
            loc.mealPlans = loc.mealPlans.filter((m: any) => m.id !== mealId);
          }
          await sb.from('hotels').update({ booking_policy: policy, location: loc }).eq('id', hotelId);
        }
      }
      const targetId = hotelId && !mealId.includes(hotelId) ? `${mealId}_${hotelId}` : mealId;
      await sb.from('meal_plans').delete().or(`id.eq.${mealId},id.eq.${targetId}`);
    } catch (err) {
      console.warn('[Supabase] deleteMealPlanFromDb exception:', err);
    }
  }
}

// ==========================================
// BOOKINGS MANAGEMENT
// ==========================================

export async function getBookingsFromDb(hotelId?: string): Promise<RoomBooking[]> {
  const sb = getSb();
  if (sb) {
    try {
      let query = sb.from('room_bookings').select('*').order('created_at', { ascending: false });
      if (hotelId) {
        query = query.eq('hotel_id', hotelId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: RoomBooking[] = data.map((row: any) => {
          const rawData = typeof row.booking_data === 'object' && row.booking_data 
            ? row.booking_data 
            : (typeof row.booking_data === 'string' ? JSON.parse(row.booking_data || '{}') : {});

          return {
            ...rawData,
            id: row.id,
            bookingCode: row.booking_code || row.bookingCode || rawData.bookingCode || 'PRS-0000',
            digitalKey: row.digital_key || row.digitalKey || rawData.digitalKey || '',
            hotelId: row.hotel_id || row.hotelId || rawData.hotelId || '',
            hotelName: row.hotel_name || row.hotelName || rawData.hotelName || '',
            guestName: row.guest_name || row.guestName || rawData.guestName || '',
            guestPhone: row.guest_phone || row.guestPhone || rawData.guestPhone || '',
            checkIn: row.check_in || row.checkIn || rawData.checkIn || '',
            checkOut: row.check_out || row.checkOut || rawData.checkOut || '',
            totalAmount: Number(row.total_amount ?? row.totalAmount ?? rawData.totalAmount ?? 0),
            status: row.status || rawData.status || 'pending',
            assignedRoomNumber: row.assigned_room_number || row.assignedRoomNumber || rawData.assignedRoomNumber || '',
            adminNotes: row.admin_notes || row.adminNotes || rawData.adminNotes || '',
            createdAt: row.created_at ? new Date(row.created_at).getTime() : (rawData.createdAt || Date.now())
          };
        });
        if (!hotelId) {
          setLocal(BOOKINGS_KEY, mapped);
        }
        return mapped;
      }
    } catch {}
  }
  const localBookings = getLocal<RoomBooking[]>(BOOKINGS_KEY, INITIAL_ROOM_BOOKINGS);
  if (hotelId) {
    return localBookings.filter(b => b.hotelId === hotelId);
  }
  return localBookings;
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

  // Sync to Supabase & Firestore in background so user booking confirmation is instantaneous (0ms)
  (async () => {
    const sb = getSb();
    if (sb) {
      try {
        const { error } = await sb.from('room_bookings').upsert({
          id: booking.id,
          booking_code: booking.bookingCode,
          digital_key: booking.digitalKey || '',
          confirmation_code: booking.confirmationCode || '',
          hotel_id: booking.hotelId,
          hotel_name: booking.hotelName,
          hotel_city: booking.hotelCity || 'مكة المكرمة',
          room_id: booking.roomId || 'room_standard',
          room_name: booking.roomName || '',
          guest_name: booking.guestName,
          guest_phone: booking.guestPhone,
          guest_email: booking.guestEmail || '',
          check_in: booking.checkIn,
          check_out: booking.checkOut,
          nights: Number(booking.nights) || 1,
          rooms_count: Number(booking.roomsCount) || 1,
          adults: Number(booking.adults) || 1,
          children: Number(booking.children) || 0,
          meal_plan_id: booking.mealPlanId || 'meal_none',
          meal_plan_name: booking.mealPlanName || 'بدون وجبات',
          meal_plan_price: Number(booking.mealPlanPrice) || 0,
          room_price_per_night: Number(booking.roomPricePerNight) || 0,
          total_amount: Number(booking.totalAmount) || 0,
          status: booking.status || 'pending',
          special_requests: booking.specialRequests || '',
          assigned_room_number: booking.assignedRoomNumber || '',
          admin_notes: booking.adminNotes || '',
          booking_data: booking
        } as any);
        if (error) {
          console.warn('[Supabase] Warning saving booking:', error.message || error);
        }
      } catch (err) {
        console.warn('[Supabase] Network/client exception saving booking:', err);
      }
    }

    if (db) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const cleanForFirestore = (obj: any): any => JSON.parse(JSON.stringify(obj));
        const sanitizedBooking = cleanForFirestore(booking);
        await setDoc(doc(db, 'room_bookings', booking.id), sanitizedBooking, { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed saving booking:', err);
      }
    }
  })().catch(err => console.warn('[CloudSync] Background save error:', err));
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
  const oldBooking = current.find(b => b.id === id);

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

  // Record audit log for booking status change
  if (oldBooking && oldBooking.status !== status) {
    const admin = getCurrentAdminUser();
    recordAuditLog({
      userId: admin?.id || 'admin_user',
      userName: admin?.name || admin?.username || 'مشرف الحجوزات',
      userEmail: admin?.email,
      module: 'bookings_log',
      action: 'تحديث حالة الحجز',
      actionLabelAr: 'تغيير حالة الحجز',
      recordId: id,
      recordTitle: `حجز النزيل ${oldBooking.guestName || id}`,
      details: `تغيير حالة حجز النزيل "${oldBooking.guestName}" من "${oldBooking.status}" إلى "${status}"`,
      oldValue: { status: oldBooking.status },
      newValue: { status, assignedRoomNumber, bookingCode, digitalKey }
    }).catch(() => {});
  }

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

  if (db) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'room_bookings', id), { 
        status, 
        ...(bookingCode ? { bookingCode: bookingCode.trim().toUpperCase() } : {}),
        ...(digitalKey !== undefined ? { digitalKey: digitalKey.trim().toUpperCase() } : {}),
        ...(assignedRoomNumber ? { assignedRoomNumber } : {}),
        ...(adminNotes ? { adminNotes } : {})
      });
    } catch {}
  }
}

export async function updateBookingEmailStatus(
  bookingId: string,
  emailStatus: 'queued' | 'sent' | 'failed',
  emailError?: string
): Promise<void> {
  const current = getLocal<RoomBooking[]>(BOOKINGS_KEY, INITIAL_ROOM_BOOKINGS);
  const updated = current.map(b => {
    if (b.id === bookingId) {
      return {
        ...b,
        emailStatus,
        emailError: emailError !== undefined ? emailError : b.emailError
      };
    }
    return b;
  });
  setLocal(BOOKINGS_KEY, updated);

  const sb = getSb();
  if (sb) {
    try {
      const match = updated.find(b => b.id === bookingId);
      await sb.from('room_bookings').update({
        booking_data: match
      } as any).eq('id', bookingId);
    } catch {}
  }

  if (db) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'room_bookings', bookingId), {
        emailStatus,
        emailError: emailError || null
      });
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

  if (db) {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'room_bookings', bookingId));
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
// CODE & KEY GENERATORS (PR-YYYY-XXXXXX)
// ==========================================

export function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const serial = Math.floor(100000 + Math.random() * 900000);
  return `PR-${year}-${serial}`;
}

export function generateDigitalKey(prefix: string = 'CONF'): string {
  const cleanPrefix = (prefix || 'CONF').trim().toUpperCase();
  const roomNum = Math.floor(1000 + Math.random() * 9000);
  return `${cleanPrefix}-${roomNum}`;
}

// ==========================================
// SPAM PROTECTION & ATOMIC BOOKING ENGINE
// ==========================================

export interface CreateBookingParams {
  hotel: Hotel;
  room: RoomTypeItem;
  mealPlan?: MealPlanOption;
  checkIn: string;
  checkOut: string;
  roomsCount: number;
  adultsCount: number;
  childrenCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  specialRequests?: string;
  packageOption?: RoomPackageOption;
  consentAgreed: boolean;
  honeypot?: string;
  formStartTime?: number;
  customPolicy?: HotelBookingPolicy;
}

export class OverbookingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OverbookingError';
  }
}

export class SpamValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpamValidationError';
  }
}

export function validateBookingSpamAndRateLimit(params: {
  honeypot?: string;
  formStartTime?: number;
  email?: string;
  phone?: string;
  guestName?: string;
}): void {
  // 1. Honeypot check: Bots fill hidden inputs
  if (params.honeypot && params.honeypot.trim().length > 0) {
    throw new SpamValidationError('تم رصد نشاط غير صالح (Automated bot detected).');
  }

  // 2. Minimum form completion duration (at least 1.2s)
  if (params.formStartTime && (Date.now() - params.formStartTime < 1200)) {
    throw new SpamValidationError('تم إرسال النموذج بسرعة فائقة غير طبيعية. يرجى المحاولة بشكل يدوي.');
  }

  // 3. Client Rate Limit: Max 4 bookings per 5 minutes
  try {
    const RATE_KEY = 'prestige_booking_rate_limit';
    const now = Date.now();
    const windowMs = 5 * 60 * 1000;
    const raw = localStorage.getItem(RATE_KEY);
    let timestamps: number[] = raw ? JSON.parse(raw) : [];
    timestamps = timestamps.filter(t => typeof t === 'number' && now - t < windowMs);

    if (timestamps.length >= 4) {
      throw new SpamValidationError('عذراً، تم تسجيل عدة محاولات حجز خلال فترة وجيزة. للمحافظة على أمان واستقرار النظام، يرجى الانتظار 5 دقائق قبل المحاولة مجدداً.');
    }
  } catch (err) {
    if (err instanceof SpamValidationError) throw err;
  }

  // 4. Guest Name validation
  if (!params.guestName || params.guestName.trim().length < 3) {
    throw new SpamValidationError('يرجى إدخال اسم النزيل بالكامل (3 أحرف على الأقل).');
  }

  // 5. Email format validation (REQUIRED)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!params.email || !emailRegex.test(params.email.trim())) {
    throw new SpamValidationError('البريد الإلكتروني إلزامي وبصيغة صحيحة (مثال: name@example.com).');
  }

  // 6. WhatsApp international format validation (REQUIRED)
  const cleanPhone = (params.phone || '').replace(/[\s\-\(\)]/g, '');
  const waRegex = /^(\+|00)?[1-9]\d{7,14}$/;
  if (!cleanPhone || !waRegex.test(cleanPhone)) {
    throw new SpamValidationError('رقم الواتساب إلزامي بالصيغة الدولية مع مفتاح الدولة (مثال: +966501234567 أو 00966501234567).');
  }
}

export async function createBookingAtomic(params: CreateBookingParams): Promise<RoomBooking> {
  // 1. Spam & Format Validation Guard
  validateBookingSpamAndRateLimit({
    honeypot: params.honeypot,
    formStartTime: params.formStartTime,
    email: params.guestEmail,
    phone: params.guestPhone,
    guestName: params.guestName
  });

  if (!params.consentAgreed) {
    throw new SpamValidationError('يلزم الموافقة على شروط وسياسة الحجز المعتمدة واستلام الإشعارات لإتمام العملية.');
  }

  const hotelPolicy = params.customPolicy || getHotelPolicy(params.hotel);

  // 2. Fetch fresh bookings and pricing periods directly from DB to prevent race condition / overbooking
  const [freshBookings, freshPeriods] = await Promise.all([
    getBookingsFromDb(params.hotel.id),
    getPricingPeriodsFromDb(params.hotel.id)
  ]);

  // 3. Recalculate Per-Night Availability against freshest DB state and periods
  const totalGuests = (params.adultsCount || 1) + (params.childrenCount || 0);
  const avail = checkNightlyAvailability(
    { ...params.hotel, pricingPeriods: freshPeriods },
    params.room,
    params.checkIn,
    params.checkOut,
    params.roomsCount,
    totalGuests,
    hotelPolicy,
    freshBookings
  );

  if (!avail.isAvailable || avail.validationErrors.length > 0) {
    const errorMsg = avail.validationErrors.join('، ') || 'المخزون غير متوفر';
    throw new OverbookingError(`عذراً، تعذر إتمام الحجز لمنع الحجز المزدوج (Overbooking): ${errorMsg}. ربما تم حجز الغرفة الأخيرة تزامناً مع طلبك.`);
  }

  // 4. Build Immutable Policy Snapshot
  const policySnapshot: BookingPolicySnapshot = {
    version: hotelPolicy.version || 1,
    checkInTime: hotelPolicy.checkInTime || '16:00 عصراً (Check-in)',
    checkOutTime: hotelPolicy.checkOutTime || '12:00 ظهراً (Check-out)',
    cancellationType: hotelPolicy.cancellationType || 'free_flexible',
    cancellationNoticeDays: hotelPolicy.cancellationNoticeDays || 2,
    cancellationPolicyAr: hotelPolicy.cancellationPolicyAr || DEFAULT_BOOKING_POLICY.cancellationPolicyAr,
    cancellationPolicyEn: hotelPolicy.cancellationPolicyEn || DEFAULT_BOOKING_POLICY.cancellationPolicyEn,
    termsAr: hotelPolicy.termsAr || DEFAULT_BOOKING_POLICY.termsAr,
    termsEn: hotelPolicy.termsEn || DEFAULT_BOOKING_POLICY.termsEn,
    paymentTerms: hotelPolicy.paymentTerms || DEFAULT_BOOKING_POLICY.paymentTerms,
    currency: hotelPolicy.currency || 'SAR',
    cancellationRules: hotelPolicy.cancellationRules || DEFAULT_BOOKING_POLICY.cancellationRules
  };

  // 5. Build Immutable Price Breakdown (Night-by-night cross-period rates)
  const mealRate = params.mealPlan ? (params.mealPlan.price ?? params.mealPlan.pricePerPersonPerNight ?? 0) : 0;
  const mealBasis = params.mealPlan?.pricingBasis || 'per_person_per_night';
  const mealsCost = mealBasis === 'per_room_per_night'
    ? mealRate * (Number(params.roomsCount) || 1) * avail.totalNights
    : mealRate * totalGuests * avail.totalNights;
  const roomsCost = avail.totalCost;
  const subtotal = roomsCost + mealsCost;
  const isTaxIncluded = hotelPolicy.priceIncludesTax !== false;
  const taxes = isTaxIncluded ? 0 : Math.round(subtotal * 0.15);
  const grandTotal = subtotal + taxes;

  const priceBreakdown: BookingPriceBreakdown = {
    nights: avail.totalNights,
    nightlyRates: avail.nightlyBreakdown.map(n => ({
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
    currency: hotelPolicy.currency || 'SAR'
  };

  // 6. Generate readable reference code, cryptographically unguessable token and 4-digit code
  const bookingCode = generateBookingCode();
  const bookingId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Generate 32-hex-character unguessable security token for public invoice access & security
  let token = '';
  try {
    const randomBytes = new Uint8Array(20);
    crypto.getRandomValues(randomBytes);
    token = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    token = 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // 4-digit short WhatsApp confirmation code
  const confirmationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const invoiceNumber = `INV-${bookingCode}`;

  const newBooking: RoomBooking = {
    id: bookingId,
    token,
    bookingCode,
    confirmationCode,
    invoiceNumber,
    digitalKey: '', // Set by supervisor upon confirmation
    hotelId: params.hotel.id,
    hotelName: params.hotel.name,
    hotelCity: params.hotel.city,
    roomId: params.room.id,
    roomName: params.room.name,
    guestName: params.guestName.trim(),
    guestPhone: params.guestPhone.trim(),
    guestEmail: params.guestEmail.trim(),
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights: Number(avail.totalNights) || 1,
    roomsCount: Number(params.roomsCount) || 1,
    adults: Number(params.adultsCount) || 1,
    children: Number(params.childrenCount) || 0,
    mealPlanId: params.mealPlan?.id || 'meal_none',
    mealPlanName: params.mealPlan?.name || 'بدون وجبات',
    mealPlanPrice: Number(mealRate) || 0,
    roomPricePerNight: Number(avail.averageNightlyRate) || 0,
    totalAmount: Number(grandTotal) || 0,
    specialRequests: params.specialRequests?.trim() || undefined,
    packageId: params.packageOption?.id,
    packageName: params.packageOption?.name,
    status: 'pending_confirmation',
    createdAt: Date.now(),
    policySnapshot,
    priceBreakdown,
    consentAgreed: true,
    emailStatus: 'queued'
  };

  // 7. Atomic persistence
  await saveBookingToDb(newBooking);

  // 8. Record Rate Limit Submission Timestamp
  try {
    const RATE_KEY = 'prestige_booking_rate_limit';
    const raw = localStorage.getItem(RATE_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    timestamps.push(Date.now());
    localStorage.setItem(RATE_KEY, JSON.stringify(timestamps));
  } catch {}

  return newBooking;
}

// ==========================================
// WHATSAPP & EMAIL NOTIFICATION BUILDERS
// ==========================================

export function buildBookingWhatsAppMessage(booking: RoomBooking, siteSettings?: SiteSettings): string {
  const hotelCityText = booking.hotelCity ? ` - ${booking.hotelCity}` : '';
  const lines = [
    `🏨 *طلب حجز وتسكين عبر الموقع الرسمي*`,
    `✨ *فندق:* ${booking.hotelName}${hotelCityText}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔖 *رقم طلب الحجز:* #${booking.bookingCode}`,
    `📌 *حالة الطلب:* ${booking.status === 'confirmed' ? '✅ مؤكد ومعتمد' : booking.status === 'checked_in' ? '🏨 تم التسكين' : '⏳ قيد المراجعة والاعتماد لدى المشرف'}`,
    booking.digitalKey ? `🔑 *كود التأكيد / المفتاح الرقمي:* ${booking.digitalKey}` : null,
    booking.assignedRoomNumber ? `🚪 *رقم الغرفة المسكّنة:* غرفة #${booking.assignedRoomNumber}` : null,
    ``,
    `👤 *بيانات النزيل:*`,
    `• الاسم: ${booking.guestName}`,
    `• الهاتف: ${booking.guestPhone}`,
    booking.guestEmail ? `• البريد: ${booking.guestEmail}` : null,
    ``,
    `🛏️ *تفاصيل الغرفة والإقامة:*`,
    `• نوع الغرفة: ${booking.roomName}`,
    `• عدد الغرف: ${booking.roomsCount} غرفة`,
    `• عدد النزلاء: ${booking.adults} بالغين${booking.children > 0 ? ` + ${booking.children} أطفال` : ''}`,
    `• خيار الوجبات: ${booking.mealPlanName}`,
    `• تاريخ الوصول (Check-in): ${booking.checkIn}`,
    `• تاريخ المغادرة (Check-out): ${booking.checkOut}`,
    `• إجمالي عدد الليالي: ${booking.nights} ${booking.nights === 1 ? 'ليلة' : 'ليالٍ'}`,
    ``,
    `💰 *التكلفة الإجمالية:* ${booking.totalAmount.toLocaleString()} ر.س`,
    booking.adminNotes ? `\n📝 *ملاحظات وتوجيهات إدارة الفندق:*\n${booking.adminNotes}` : null,
    booking.specialRequests ? `\n✨ *طلبات خاصة من النزيل:*\n${booking.specialRequests}` : null,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📍 شركة برستيج لإدارة وتشغيل الفنادق`
  ].filter(Boolean);

  return lines.join('\n');
}

/**
 * رسالة المشرف/الإدارة المرسلة للنزيل عبر الواتساب (تشمل الملاحظات والكود والحالة بتنسيق فاخر)
 */
export function buildSupervisorWhatsAppMessage(
  booking: RoomBooking,
  customNotes?: string,
  customStatus?: BookingStatus,
  customKey?: string,
  customRoom?: string
): string {
  const note = customNotes !== undefined ? customNotes.trim() : (booking.adminNotes || '').trim();
  const status = customStatus || booking.status;
  const key = customKey !== undefined ? customKey.trim() : (booking.digitalKey || '').trim();
  const room = customRoom !== undefined ? customRoom.trim() : (booking.assignedRoomNumber || '').trim();
  const hotelCityText = booking.hotelCity ? ` - ${booking.hotelCity}` : '';

  let statusLabel = 'قيد المراجعة والاعتماد لدى المشرف ⏳';
  if (status === 'confirmed') statusLabel = 'مؤكد ومعتمد بنجاح ✅';
  else if (status === 'checked_in') statusLabel = 'تم التسكين واستلام الغرفة 🏨';
  else if (status === 'completed') statusLabel = 'مكتمل المغادرة ✓';
  else if (status === 'cancelled') statusLabel = 'ملغى ❌';

  const lines = [
    `🌟 *تحية طيبة ضيفنا العزيز أ. ${booking.guestName}*`,
    `معك إدارة فندق *${booking.hotelName}${hotelCityText}* (شركة برستيج للضيافة).`,
    `يسعدنا إفادتكم بخصوص حجزكم رقم: *#${booking.bookingCode}*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📌 *حالة الحجز:* ${statusLabel}`,
    key ? `🔑 *كود التأكيد / المفتاح الرقمي المعتمد:* ${key}` : `🔑 *كود التأكيد:* قيد الاعتماد الفوري من المشرف`,
    room ? `🚪 *رقم الغرفة المسكّنة بالفندق:* غرفة #${room}` : null,
    ``,
    `📋 *ملخص تفاصيل الإقامة:*`,
    `• نوع الغرفة: ${booking.roomName} (${booking.roomsCount} غرفة)`,
    `• خطة الوجبات: ${booking.mealPlanName}`,
    `• عدد النزلاء: ${booking.adults} بالغين${booking.children > 0 ? ` + ${booking.children} أطفال` : ''}`,
    `• تاريخ الوصول: ${booking.checkIn}`,
    `• تاريخ المغادرة: ${booking.checkOut}`,
    `• إجمالي الليالي: ${booking.nights} ${booking.nights === 1 ? 'ليلة' : 'ليالٍ'}`,
    `• إجمالي المبلغ: ${booking.totalAmount.toLocaleString()} ر.س (الدفع بالاستقبال عند الوصول)`,
    ``,
    note ? `📝 *ملاحظات وتوجيهات إدارة الفندق:*\n${note}\n` : null,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `نتشرف دائماً بخدمتكم ونتمنى لكم إقامة طيبة ومباركة في رحاب مكة المكرمة والمدينة المنورة.`,
    `لأي استفسار إضافي أو مساعدة يسعدنا الرد عليكم عبر هذه المحادثة مباشرة.`
  ].filter(Boolean);

  return lines.join('\n');
}

/**
 * رابط واتساب مباشر لإرسال رسالة المشرف للنزيل
 */
export function buildSupervisorGuestWhatsAppLink(
  booking: RoomBooking,
  customNotes?: string,
  customStatus?: BookingStatus,
  customKey?: string,
  customRoom?: string
): string {
  const cleanPhone = booking.guestPhone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('05') ? '966' + cleanPhone.slice(1) : cleanPhone;
  const msg = buildSupervisorWhatsAppMessage(booking, customNotes, customStatus, customKey, customRoom);
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
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

/**
 * رابط تأكيد النزيل للحجز عبر الواتساب مع رقم الحجز وكود التأكيد المكون من 4 أرقام
 */
export function buildVisitorWhatsAppConfirmationLink(
  booking: RoomBooking,
  siteSettings?: SiteSettings,
  lang: 'ar' | 'en' = 'ar'
): string {
  const isEn = lang === 'en';
  const companyPhone = (
    siteSettings?.bookingModule?.companyWhatsApp || 
    siteSettings?.bookingModule?.bookingWhatsApp || 
    '+966544076726'
  ).replace(/[^0-9]/g, '');

  const confirmationCode = booking.confirmationCode || (booking.digitalKey ? booking.digitalKey.slice(-4) : '4892');

  const customTemplate = isEn 
    ? siteSettings?.bookingModule?.whatsappMessageTemplateEn 
    : siteSettings?.bookingModule?.whatsappMessageTemplateAr;

  let msg = '';
  if (customTemplate) {
    msg = customTemplate
      .replace(/{bookingCode}/g, booking.bookingCode)
      .replace(/{booking_code}/g, booking.bookingCode)
      .replace(/{confirmationCode}/g, confirmationCode)
      .replace(/{confirmation_code}/g, confirmationCode)
      .replace(/{guestName}/g, booking.guestName)
      .replace(/{guest_name}/g, booking.guestName)
      .replace(/{hotelName}/g, booking.hotelName)
      .replace(/{hotel_name}/g, booking.hotelName)
      .replace(/{checkIn}/g, booking.checkIn)
      .replace(/{check_in}/g, booking.checkIn);
  } else if (isEn) {
    msg = `Hello Prestige Hotels Management,
I would like to confirm my booking request submitted via the website:
• Booking Reference: #${booking.bookingCode}
• 4-Digit Confirmation Code: ${confirmationCode}
• Guest Name: ${booking.guestName}
• Hotel: ${booking.hotelName}
• Check-in Date: ${booking.checkIn}
• Total: ${booking.totalAmount} SAR

Please confirm my reservation and issue the official certified invoice.`;
  } else {
    msg = `السلام عليكم شركة برستيج لإدارة الفنادق،
أرغب بتأكيد طلبي للحجز المباشر عبر الموقع الإلكتروني:
• رقم الحجز المرجعي: #${booking.bookingCode}
• كود التأكيد (٤ أرقام): ${confirmationCode}
• اسم النزيل: ${booking.guestName}
• الفندق: ${booking.hotelName}
• تاريخ الوصول: ${booking.checkIn}
• الإجمالي: ${booking.totalAmount.toLocaleString()} ر.س

أرجو اعتماد وتأكيد الحجز وتزويدي بالفاتورة الرسمية المعتمدة. شكراً لكم.`;
  }

  return `https://wa.me/${companyPhone}?text=${encodeURIComponent(msg)}`;
}

/**
 * رابط إرسال رسالة اعتماد وتأكيد الحجز من الموظف إلى العميل عبر الواتساب بنقرة واحدة (تشمل رابط الفاتورة)
 */
export function buildStaffConfirmationWhatsAppLink(
  booking: RoomBooking,
  siteSettings?: SiteSettings,
  lang: 'ar' | 'en' = 'ar'
): string {
  const isEn = lang === 'en';
  const cleanPhone = booking.guestPhone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('05') ? '966' + cleanPhone.slice(1) : cleanPhone;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://prestige-ksa.web.app';
  const tokenQuery = booking.token ? `?token=${encodeURIComponent(booking.token)}` : '';
  const invoiceUrl = `${origin}${isEn ? '/en' : ''}/invoice/${booking.id}${tokenQuery}`;
  const keyText = booking.digitalKey || 'قيد التسليم بالاستقبال';

  const customTemplate = isEn 
    ? siteSettings?.bookingModule?.whatsappStaffConfirmationTemplateEn 
    : siteSettings?.bookingModule?.whatsappStaffConfirmationTemplateAr;

  let msg = '';
  if (customTemplate) {
    msg = customTemplate
      .replace(/{guestName}/g, booking.guestName)
      .replace(/{guest_name}/g, booking.guestName)
      .replace(/{bookingCode}/g, booking.bookingCode)
      .replace(/{booking_code}/g, booking.bookingCode)
      .replace(/{hotelName}/g, booking.hotelName)
      .replace(/{hotel_name}/g, booking.hotelName)
      .replace(/{digitalKey}/g, keyText)
      .replace(/{assignedRoomNumber}/g, booking.assignedRoomNumber || 'يحدد عند الوصول')
      .replace(/{invoiceUrl}/g, invoiceUrl)
      .replace(/{invoice_link}/g, invoiceUrl);
  } else if (isEn) {
    msg = `Dear guest ${booking.guestName},
We are delighted to confirm your booking with Prestige Hotels & Resorts!
• Booking Reference: #${booking.bookingCode}
• Hotel: ${booking.hotelName}
• Confirmation Key: ${keyText}
${booking.assignedRoomNumber ? `• Assigned Room: Room #${booking.assignedRoomNumber}\n` : ''}
You can view, print, and download your official certified invoice & voucher here:
${invoiceUrl}

We wish you a pleasant and blessed stay in Makkah and Madinah.
Prestige Hospitality Group`;
  } else {
    msg = `أهلاً بك ضيفنا العزيز أ. ${booking.guestName}،
يسعدنا إبلاغكم بأنه تم تأكيد واعتماد حجزكم بنجاح لدى شركة برستيج للضيافة!
• رقم الحجز المرجعي: #${booking.bookingCode}
• الفندق: ${booking.hotelName}
• كود التأكيد / المفتاح الرقمي: ${keyText}
${booking.assignedRoomNumber ? `• رقم الغرفة المسكنة: غرفة #${booking.assignedRoomNumber}\n` : ''}
يمكنكم استعراض وطباعة وتحميل سند الحجز والفاتورة الرسمية المعتمدة عبر الرابط التالي:
${invoiceUrl}

نتمنى لكم إقامة طيبة ومباركة في رحاب مكة المكرمة والمدينة المنورة.
شركة برستيج لإدارة وتشغيل الفنادق`;
  }

  return `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
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

/**
 * Securely fetch a single booking for public invoice rendering.
 * Strictly verifies that the secret unguessable token matches.
 * Allows reading a single document even when collection listing is blocked for visitors.
 */
export async function getBookingByIdForInvoice(bookingId: string, token?: string): Promise<RoomBooking | null> {
  if (!bookingId || !token) return null;
  const cleanToken = token.trim();

  // 1. Check LocalStorage
  const localList = getLocal<RoomBooking[]>(BOOKINGS_KEY, INITIAL_ROOM_BOOKINGS);
  const foundLocal = localList.find(b => (b.id === bookingId || b.bookingCode === bookingId));
  if (foundLocal && foundLocal.token && foundLocal.token.trim() === cleanToken) {
    return foundLocal;
  }

  // 2. Fetch directly from Firestore (single doc by ID)
  if (db) {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'room_bookings', bookingId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as RoomBooking;
        if (data && data.token && data.token.trim() === cleanToken) {
          return { ...data, id: snap.id };
        }
      }
    } catch (err) {
      console.warn('[Firestore] Failed reading single booking for invoice:', err);
    }
  }

  // 3. Fetch from Supabase
  const sb = getSb();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('room_bookings')
        .select('*')
        .or(`id.eq.${bookingId},booking_code.eq.${bookingId}`)
        .maybeSingle();

      if (!error && data) {
        const rawData = typeof data.booking_data === 'object' && data.booking_data
          ? data.booking_data
          : (typeof data.booking_data === 'string' ? JSON.parse(data.booking_data || '{}') : {});
        const bToken = data.token || rawData.token;
        if (bToken && bToken.trim() === cleanToken) {
          return {
            ...rawData,
            id: data.id,
            bookingCode: data.booking_code || rawData.bookingCode,
            token: bToken
          };
        }
      }
    } catch (err) {
      console.warn('[Supabase] Failed reading single booking for invoice:', err);
    }
  }

  return null;
}


