import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Calendar, 
  Users, 
  BedDouble, 
  Check, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Phone, 
  Mail, 
  User, 
  Copy, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Utensils, 
  Coffee, 
  Printer, 
  Download, 
  ExternalLink, 
  MessageCircle, 
  Info, 
  Lock, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Building2,
  MapPin,
  Flame,
  X,
  Compass,
  Layers,
  QrCode,
  Plus,
  Minus,
  Briefcase,
  Bus,
  UsersRound
} from 'lucide-react';
import { 
  Hotel, 
  RoomTypeItem, 
  MealPlanOption, 
  RoomBooking, 
  SiteSettings, 
  HotelPricingPeriod 
} from '../types';
import { 
  calculateBookingPrice, 
  getStayNightDates, 
  PricingEngineResult 
} from '../utils/pricingEngine';
import { 
  checkFastStayAvailability, 
  createBookingAtomicTransaction, 
  prefetchNextMonth,
  OverbookingError 
} from '../services/availabilityService';
import { 
  getRoomsFromDb, 
  getMealPlansFromDb, 
  getPricingPeriodsFromDb, 
  getBookingsFromDb, 
  getHotelPolicy,
  buildVisitorWhatsAppConfirmationLink,
  DEFAULT_BOOKING_POLICY
} from '../services/bookingService';
import { sendBookingEmailViaAppsScript } from '../services/emailService';
import { ExpressCheckInModal } from './ExpressCheckInModal';
import { trackBookingFunnel } from '../services/analytics';
import { getInvoiceUrl } from '../utils/routing';
import { useLanguage } from '../context/LanguageContext';

export interface CountryCodeItem {
  code: string;
  dialCode: string;
  flag: string;
  nameAr: string;
  nameEn: string;
}

export const POPULAR_COUNTRIES: CountryCodeItem[] = [
  { code: 'SA', dialCode: '+966', flag: '🇸🇦', nameAr: 'السعودية', nameEn: 'Saudi Arabia' },
  { code: 'EG', dialCode: '+20', flag: '🇪🇬', nameAr: 'مصر', nameEn: 'Egypt' },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪', nameAr: 'الإمارات', nameEn: 'UAE' },
  { code: 'KW', dialCode: '+965', flag: '🇰🇼', nameAr: 'الكويت', nameEn: 'Kuwait' },
  { code: 'OM', dialCode: '+968', flag: '🇴🇲', nameAr: 'عُمان', nameEn: 'Oman' },
  { code: 'BH', dialCode: '+973', flag: '🇧🇭', nameAr: 'البحرين', nameEn: 'Bahrain' },
  { code: 'QA', dialCode: '+974', flag: '🇶🇦', nameAr: 'قطر', nameEn: 'Qatar' },
  { code: 'JO', dialCode: '+962', flag: '🇯🇴', nameAr: 'الأردن', nameEn: 'Jordan' },
  { code: 'ID', dialCode: '+62', flag: '🇮🇩', nameAr: 'إندونيسيا', nameEn: 'Indonesia' },
  { code: 'MY', dialCode: '+60', flag: '🇲🇾', nameAr: 'ماليزيا', nameEn: 'Malaysia' },
  { code: 'TR', dialCode: '+90', flag: '🇹🇷', nameAr: 'تركيا', nameEn: 'Turkey' },
  { code: 'PK', dialCode: '+92', flag: '🇵🇰', nameAr: 'باكستان', nameEn: 'Pakistan' },
  { code: 'IN', dialCode: '+91', flag: '🇮🇳', nameAr: 'الهند', nameEn: 'India' },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', nameAr: 'بريطانيا', nameEn: 'United Kingdom' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', nameAr: 'أمريكا', nameEn: 'United States' }
];

const DRAFT_STORAGE_KEY = 'prestige_booking_draft_v2';

export const getEffectiveRoomCapacity = (room: RoomTypeItem): number => {
  const name = (room.name + ' ' + (room.category || '')).toLowerCase();
  if (name.includes('خماس') || name.includes('خمس') || name.includes('quint')) return Math.max(room.maxGuests || 0, 5);
  if (name.includes('رباع') || name.includes('أربع') || name.includes('quad')) return Math.max(room.maxGuests || 0, 4);
  if (name.includes('ثلاث') || name.includes('ثلاثي') || name.includes('triple')) return Math.max(room.maxGuests || 0, 3);
  if (name.includes('مفرد') || name.includes('فردي') || name.includes('single')) return Math.max(room.maxGuests || 0, 1);
  if (name.includes('ثنائ') || name.includes('مزدوج') || name.includes('double') || name.includes('twin')) return Math.max(room.maxGuests || 0, 2);
  return room.maxGuests || 2;
};

export const getEffectiveBedType = (room: RoomTypeItem): string => {
  const name = (room.name + ' ' + (room.category || '')).toLowerCase();
  if (room.bedType && room.bedType !== 'سريرين مفردين أو سرير كينج' && room.bedType !== 'سرير مزدوج فاخر') {
    return room.bedType;
  }
  if (name.includes('خماس') || name.includes('خمس')) return '5 أسرة مفردة مريحة';
  if (name.includes('رباع') || name.includes('أربع')) return '4 أسرة مفردة مريحة';
  if (name.includes('ثلاث') || name.includes('ثلاثي')) return '3 أسرة مفردة مريحة';
  if (name.includes('مفرد') || name.includes('فردي')) return 'سرير مفرد مريح';
  if (name.includes('ثنائ') || name.includes('مزدوج')) return 'سريرين مفردين أو سرير كينج';
  return room.bedType || 'سريرين مفردين أو سرير كينج';
};

export interface BookingFlowProps {
  hotel: Hotel;
  allHotels?: Hotel[];
  initialRoomId?: string;
  initialMealId?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialRooms?: number;
  initialAdults?: number;
  initialChildren?: number;
  initialBookingType?: 'individual' | 'group';
  hideBookingTypeToggle?: boolean;
  siteSettings?: SiteSettings;
  onNavigateHome?: () => void;
  onSelectAnotherHotel?: (hotelId: string) => void;
  onOpenTrackModal?: (code: string) => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  hotel,
  allHotels = [],
  initialRoomId,
  initialMealId,
  initialCheckIn,
  initialCheckOut,
  initialRooms = 1,
  initialAdults = 2,
  initialChildren = 0,
  initialBookingType,
  hideBookingTypeToggle = false,
  siteSettings,
  onNavigateHome,
  onSelectAnotherHotel,
  onOpenTrackModal
}) => {
  const { language, isRtl } = useLanguage();

  // 3-Step Wizard: 1: Dates & Guests, 2: Choose Room & Meal, 3: Details & Confirm, 4: Confirmation Screen
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Default dates
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], []);

  // Step 1 State: Dates & Guests
  const [checkIn, setCheckIn] = useState<string>(() => {
    return initialCheckIn || todayStr;
  });
  const [checkOut, setCheckOut] = useState<string>(() => {
    return initialCheckOut || tomorrowStr;
  });
  const [roomsCount, setRoomsCount] = useState<number>(initialRooms || 1);
  const [adultsCount, setAdultsCount] = useState<number>(initialAdults || 2);
  const [childrenCount, setChildrenCount] = useState<number>(initialChildren || 0);

  useEffect(() => {
    if (initialCheckIn) setCheckIn(initialCheckIn);
  }, [initialCheckIn]);

  useEffect(() => {
    if (initialCheckOut) setCheckOut(initialCheckOut);
  }, [initialCheckOut]);

  useEffect(() => {
    if (initialRooms) setRoomsCount(initialRooms);
  }, [initialRooms]);

  useEffect(() => {
    if (initialAdults) setAdultsCount(initialAdults);
  }, [initialAdults]);

  useEffect(() => {
    if (initialChildren !== undefined) setChildrenCount(initialChildren);
  }, [initialChildren]);

  // Booking Mode: Individual / Family vs Group / Campaign (Tied to parent top choices)
  const [bookingType, setBookingType] = useState<'individual' | 'group'>(() => {
    return initialBookingType || 'individual';
  });

  useEffect(() => {
    if (initialBookingType) {
      setBookingType(initialBookingType);
      if (initialBookingType === 'group') {
        setRoomsCount(prev => (prev < 3 ? 3 : prev));
      }
    }
  }, [initialBookingType]);

  // Step 2 State: Multi-room selection map (roomId -> quantity) & Selected Meal
  const [selectedRoomsMap, setSelectedRoomsMap] = useState<Record<string, number>>(() => {
    if (initialRoomId) {
      return { [initialRoomId]: initialRooms || 1 };
    }
    return {};
  });
  const [selectedRoomId, setSelectedRoomId] = useState<string>(initialRoomId || '');
  const [selectedMealId, setSelectedMealId] = useState<string>(initialMealId || 'meal_none');

  // Group / Campaign details (if bookingType === 'group' or multi-room)
  const [companyOrGroupName, setCompanyOrGroupName] = useState<string>('');
  const [groupLeaderName, setGroupLeaderName] = useState<string>('');
  const [groupLeaderPhone, setGroupLeaderPhone] = useState<string>('');
  const [busCount, setBusCount] = useState<number>(1);
  const [roomingList, setRoomingList] = useState<string>('');

  // Step 3 State: Guest Details & Consent
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeItem>(POPULAR_COUNTRIES[0]);
  const [guestPhoneNumber, setGuestPhoneNumber] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [consentAgreed, setConsentAgreed] = useState<boolean>(true);
  const [honeypot, setHoneypot] = useState<string>('');
  const [formStartTime] = useState<number>(() => Date.now());

  // VIP Preferences & Express Check-in
  const [preferredView, setPreferredView] = useState<'haram' | 'city' | 'panoramic' | 'quiet' | 'any'>('any');
  const [preferredFloor, setPreferredFloor] = useState<'high' | 'mid' | 'low' | 'any'>('any');
  const [expressCheckInOptIn, setExpressCheckInOptIn] = useState<boolean>(true);
  const [showExpressModal, setShowExpressModal] = useState<boolean>(false);
  const [emailSendingStatus, setEmailSendingStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [emailErrorMessage, setEmailErrorMessage] = useState<string>('');

  // Idempotency Key (Generated once per draft session)
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => {
    return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  });

  // Data Loading & State
  const [rooms, setRooms] = useState<RoomTypeItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanOption[]>([]);
  const [pricingPeriods, setPricingPeriods] = useState<HotelPricingPeriod[]>([]);
  const [existingBookings, setExistingBookings] = useState<RoomBooking[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Availability Cache Map by Room ID: { isAvailable, minRemainingRooms, validationErrors }
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, {
    isAvailable: boolean;
    minRemainingRooms: number;
    validationErrors: string[];
  }>>({});
  const [checkingAvailability, setCheckingAvailability] = useState<boolean>(false);

  // Confirmation Result
  const [confirmedBooking, setConfirmedBooking] = useState<RoomBooking | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // UI Drawer / Details expander for Mobile Sticky Bar
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState<boolean>(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // 1. Restore Auto-Saved Draft from LocalStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.hotelId === hotel.id) {
          if (parsed.bookingType) setBookingType(parsed.bookingType);
          if (parsed.checkIn && parsed.checkIn >= todayStr) setCheckIn(parsed.checkIn);
          if (parsed.checkOut && parsed.checkOut > (parsed.checkIn || todayStr)) setCheckOut(parsed.checkOut);
          if (parsed.roomsCount) setRoomsCount(parsed.roomsCount);
          if (parsed.adultsCount) setAdultsCount(parsed.adultsCount);
          if (parsed.childrenCount !== undefined) setChildrenCount(parsed.childrenCount);
          if (parsed.guestName) setGuestName(parsed.guestName);
          if (parsed.guestEmail) setGuestEmail(parsed.guestEmail);
          if (parsed.guestPhoneNumber) setGuestPhoneNumber(parsed.guestPhoneNumber);
          if (parsed.selectedRoomId) setSelectedRoomId(parsed.selectedRoomId);
          if (parsed.selectedMealId) setSelectedMealId(parsed.selectedMealId);
          if (parsed.selectedRoomsMap && typeof parsed.selectedRoomsMap === 'object') {
            setSelectedRoomsMap(parsed.selectedRoomsMap);
          }
          if (parsed.companyOrGroupName) setCompanyOrGroupName(parsed.companyOrGroupName);
          if (parsed.groupLeaderName) setGroupLeaderName(parsed.groupLeaderName);
          if (parsed.groupLeaderPhone) setGroupLeaderPhone(parsed.groupLeaderPhone);
          if (parsed.busCount) setBusCount(parsed.busCount);
          if (parsed.roomingList) setRoomingList(parsed.roomingList);
          if (parsed.specialRequests) setSpecialRequests(parsed.specialRequests);
          if (parsed.idempotencyKey) setIdempotencyKey(parsed.idempotencyKey);
        }
      }
    } catch {}
  }, [hotel.id, todayStr]);

  // 2. Auto-save Draft to LocalStorage whenever fields update
  useEffect(() => {
    if (currentStep === 4) return; // Don't persist after success
    const draft = {
      hotelId: hotel.id,
      bookingType,
      checkIn,
      checkOut,
      roomsCount,
      adultsCount,
      childrenCount,
      selectedRoomId,
      selectedMealId,
      selectedRoomsMap,
      companyOrGroupName,
      groupLeaderName,
      groupLeaderPhone,
      busCount,
      roomingList,
      guestName,
      guestEmail,
      guestPhoneNumber,
      specialRequests,
      idempotencyKey,
      savedAt: Date.now()
    };
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {}
  }, [
    hotel.id,
    bookingType,
    checkIn,
    checkOut,
    roomsCount,
    adultsCount,
    childrenCount,
    selectedRoomId,
    selectedMealId,
    selectedRoomsMap,
    companyOrGroupName,
    groupLeaderName,
    groupLeaderPhone,
    busCount,
    roomingList,
    guestName,
    guestEmail,
    guestPhoneNumber,
    specialRequests,
    idempotencyKey,
    currentStep
  ]);

  // 3. Load DB records for rooms, meal plans, pricing periods
  useEffect(() => {
    let isMounted = true;
    setLoadingData(true);

    Promise.all([
      getRoomsFromDb(hotel.id),
      getMealPlansFromDb(hotel.id),
      getPricingPeriodsFromDb(hotel.id)
    ]).then(([rList, mList, pList]) => {
      if (!isMounted) return;
      const hotelRooms = rList.filter(r => r.hotelId === hotel.id && r.isActive !== false);
      setRooms(hotelRooms);
      setMealPlans(mList.filter(m => m.isActive !== false));
      setPricingPeriods(pList || []);
      setLoadingData(false);

      // Auto-initialize selected room if none selected
      if (hotelRooms.length > 0) {
        setSelectedRoomsMap(prev => {
          if (Object.values(prev).some(q => Number(q) > 0)) return prev;
          const targetId = initialRoomId || hotelRooms[0].id;
          return { [targetId]: initialRooms || 1 };
        });
        if (!selectedRoomId) {
          setSelectedRoomId(initialRoomId || hotelRooms[0].id);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [hotel.id]);

  // 4. Track Funnel Start
  useEffect(() => {
    trackBookingFunnel('booking_funnel_started', {
      hotel_id: hotel.id,
      hotel_name: hotel.name,
      hotel_city: hotel.city
    });
  }, [hotel.id, hotel.name, hotel.city]);

  // 5. Fast Availability Re-computation (Debounced & Cached)
  useEffect(() => {
    if (!checkIn || !checkOut || rooms.length === 0) return;
    let isMounted = true;
    setCheckingAvailability(true);

    const timer = setTimeout(async () => {
      const results: Record<string, { isAvailable: boolean; minRemainingRooms: number; validationErrors: string[] }> = {};

      for (const room of rooms) {
        try {
          const avail = await checkFastStayAvailability(
            hotel,
            room,
            checkIn,
            checkOut,
            roomsCount,
            pricingPeriods,
            existingBookings
          );
          results[room.id] = {
            isAvailable: avail.isAvailable,
            minRemainingRooms: avail.minRemainingRooms,
            validationErrors: avail.validationErrors
          };
        } catch {
          results[room.id] = {
            isAvailable: true,
            minRemainingRooms: room.availableRooms || 3,
            validationErrors: []
          };
        }
      }

      if (isMounted) {
        setAvailabilityMap(results);
        setCheckingAvailability(false);

        // Prefetch next month calendar data in background
        const currentYm = checkIn.substring(0, 7);
        if (rooms[0]) {
          prefetchNextMonth(hotel.id, rooms[0], currentYm, pricingPeriods, existingBookings);
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [hotel, rooms, checkIn, checkOut, roomsCount, pricingPeriods, existingBookings]);

  // Primary Selected Room ID & Object
  const primarySelectedRoomId = useMemo(() => {
    const entry = (Object.entries(selectedRoomsMap) as [string, number][]).find(([_, q]) => Number(q) > 0);
    if (entry) return entry[0];
    return selectedRoomId || (rooms[0]?.id || '');
  }, [selectedRoomsMap, selectedRoomId, rooms]);

  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === primarySelectedRoomId) || rooms[0] || null;
  }, [rooms, primarySelectedRoomId]);

  // Standard and Custom Meal Plans Combined
  const allAvailableMealPlans: MealPlanOption[] = useMemo(() => {
    const baseline: MealPlanOption[] = [
      {
        id: 'meal_none',
        type: 'none',
        name: 'بدون وجبات (إقامة فقط)',
        nameEn: 'Room Only',
        price: 0,
        pricePerPersonPerNight: 0,
        pricingBasis: 'per_person_per_night',
        description: 'إقامة مريحة تشمل كافة المرافق والخدمات الفندقية الأساسية.',
        isActive: true
      },
      {
        id: 'meal_breakfast',
        type: 'breakfast',
        name: 'إفطار بوفيه مفتوح فاخر',
        nameEn: 'Buffet Breakfast',
        price: 45,
        pricePerPersonPerNight: 45,
        pricingBasis: 'per_person_per_night',
        description: 'بوفيه صباحي يومي بأشهى المأكولات العالمية والشرقية والمشروبات الطازجة.',
        isActive: true
      },
      {
        id: 'meal_half_board',
        type: 'half_board',
        name: 'نصف إقامة (إفطار + عشاء)',
        nameEn: 'Half Board',
        price: 85,
        pricePerPersonPerNight: 85,
        pricingBasis: 'per_person_per_night',
        description: 'يشمل بوفيه الإفطار الصباحي بالإضافة إلى وجبة عشاء فاخرة يومياً.',
        isActive: true
      },
      {
        id: 'meal_full_board',
        type: 'full_board',
        name: 'إقامة كاملة (إفطار + غداء + عشاء)',
        nameEn: 'Full Board',
        price: 130,
        pricePerPersonPerNight: 130,
        pricingBasis: 'per_person_per_night',
        description: 'تغذية متكاملة لجميع النزلاء مع ثلاث وجبات يومية بوفيه مفتوح.',
        isActive: true
      }
    ];

    if (mealPlans.length === 0) return baseline;

    const combined = [...mealPlans];
    for (const b of baseline) {
      if (!combined.some(m => m.id === b.id)) {
        combined.push(b);
      }
    }
    return combined;
  }, [mealPlans]);

  // Selected Meal Plan Object
  const selectedMealPlan = useMemo(() => {
    if (selectedMealId === 'meal_none') return null;
    return allAvailableMealPlans.find(m => m.id === selectedMealId) || null;
  }, [allAvailableMealPlans, selectedMealId]);

  // Total Nights Count
  const nightsCount = useMemo(() => {
    return getStayNightDates(checkIn, checkOut).length;
  }, [checkIn, checkOut]);

  // Multi-room counters & breakdowns
  const totalSelectedRoomsCount = useMemo(() => {
    return Object.values(selectedRoomsMap).reduce((s: number, c) => s + (Number(c) || 0), 0);
  }, [selectedRoomsMap]);

  const totalRoomsCapacity = useMemo(() => {
    return (Object.entries(selectedRoomsMap) as [string, number][]).reduce((sum: number, [rId, qty]) => {
      const nQty = Number(qty) || 0;
      if (nQty <= 0) return sum;
      const r = rooms.find(room => room.id === rId);
      return sum + (r ? getEffectiveRoomCapacity(r) : 2) * nQty;
    }, 0);
  }, [selectedRoomsMap, rooms]);

  const groupRoomsBreakdown = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];
    const selectedEntries = (Object.entries(selectedRoomsMap) as [string, number][]).filter(([_, qty]) => Number(qty) > 0);
    if (selectedEntries.length === 0) {
      if (!selectedRoom) return [];
      const cap = getEffectiveRoomCapacity(selectedRoom);
      return [{
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        roomsCount: roomsCount,
        adultsPerRoom: cap,
        pricePerNight: selectedRoom.basePrice || 350,
        totalAmount: (selectedRoom.basePrice || 350) * roomsCount * (nightsCount || 1)
      }];
    }

    return selectedEntries
      .map(([rId, qty]) => {
        const roomObj = rooms.find(r => r.id === rId) || (selectedRoom?.id === rId ? selectedRoom : null);
        if (!roomObj) return null;
        const nQty = Number(qty) || 1;
        const cap = getEffectiveRoomCapacity(roomObj);
        const singleCalc = calculateBookingPrice({
          hotel,
          room: roomObj,
          checkIn,
          checkOut,
          roomsCount: nQty,
          guestsCount: cap * nQty,
          mealPlan: null,
          pricingPeriods
        });
        return {
          roomId: rId,
          roomName: roomObj.name,
          roomsCount: nQty,
          adultsPerRoom: cap,
          pricePerNight: singleCalc.averageNightlyRate,
          totalAmount: singleCalc.roomsCost
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [selectedRoomsMap, selectedRoom, roomsCount, rooms, hotel, checkIn, checkOut, pricingPeriods, nightsCount]);

  // Handler for Room Quantity Increment/Decrement
  const handleRoomQuantityChange = (roomId: string, delta: number) => {
    setSelectedRoomsMap(prev => {
      const current = Number(prev[roomId]) || 0;
      const roomAvail = availabilityMap[roomId];
      const maxAllowed = roomAvail?.minRemainingRooms ?? 10;
      const next = Math.max(0, current + delta);
      if (delta > 0 && next > maxAllowed) {
        return prev;
      }
      const updated = { ...prev, [roomId]: next };
      if (next > 0) {
        setSelectedRoomId(roomId);
      }
      return updated;
    });
  };

  // Master Pricing Engine Calculation
  const pricingResult: PricingEngineResult = useMemo(() => {
    const selectedEntries = (Object.entries(selectedRoomsMap) as [string, number][]).filter(([_, qty]) => Number(qty) > 0);

    if (selectedEntries.length > 0) {
      let totalRoomsCost = 0;
      const allErrors: string[] = [];
      const nightlyRatesCombined: any[] = [];

      for (const [rId, qty] of selectedEntries) {
        const roomObj = rooms.find(r => r.id === rId);
        if (!roomObj) continue;
        const nQty = Number(qty) || 1;

        const singleCalc = calculateBookingPrice({
          hotel,
          room: roomObj,
          checkIn,
          checkOut,
          roomsCount: nQty,
          guestsCount: getEffectiveRoomCapacity(roomObj) * nQty,
          mealPlan: null,
          pricingPeriods
        });

        if (!singleCalc.isValid && singleCalc.validationErrors.length > 0) {
          allErrors.push(...singleCalc.validationErrors);
        }

        totalRoomsCost += singleCalc.roomsCost;
        if (nightlyRatesCombined.length === 0 && singleCalc.priceBreakdown.nightlyRates) {
          nightlyRatesCombined.push(...singleCalc.priceBreakdown.nightlyRates);
        }
      }

      const totalRooms = selectedEntries.reduce((s: number, [_, q]) => s + (Number(q) || 0), 0);
      const mealRate = selectedMealPlan ? Number(selectedMealPlan.price ?? selectedMealPlan.pricePerPersonPerNight ?? 0) : 0;
      const mealBasis = selectedMealPlan?.pricingBasis || 'per_person_per_night';
      const effectiveGuests = Math.max(adultsCount + childrenCount, totalRoomsCapacity || totalRooms * 2);

      const mealsCost = mealBasis === 'per_room_per_night'
        ? mealRate * totalRooms * nightsCount
        : mealRate * effectiveGuests * nightsCount;

      const isTaxIncluded = hotel.bookingPolicy?.priceIncludesTax !== false;
      const subtotal = totalRoomsCost + mealsCost;
      const taxes = isTaxIncluded ? 0 : Math.round(subtotal * 0.15);
      const grandTotal = subtotal + taxes;
      const avgRate = nightsCount > 0 && totalRooms > 0 
        ? Math.round(totalRoomsCost / (nightsCount * totalRooms)) 
        : (selectedRoom?.basePrice || 350);

      return {
        isValid: allErrors.length === 0 && totalRooms > 0 && nightsCount > 0,
        totalNights: nightsCount,
        averageNightlyRate: avgRate,
        roomsCost: totalRoomsCost,
        mealPricePerPerson: mealRate,
        mealsCost,
        subtotal,
        taxes,
        grandTotal,
        isTaxIncluded,
        currency: 'SAR',
        nightlyBreakdown: [],
        validationErrors: Array.from(new Set(allErrors)),
        priceBreakdown: {
          nights: nightsCount,
          nightlyRates: nightlyRatesCombined,
          roomsCost: totalRoomsCost,
          mealPricePerPerson: mealRate,
          mealsCost,
          extraCharges: 0,
          taxes,
          isTaxIncluded,
          totalAmount: grandTotal,
          currency: 'SAR'
        }
      };
    }

    if (!selectedRoom || !checkIn || !checkOut) {
      return {
        isValid: false,
        totalNights: 0,
        averageNightlyRate: selectedRoom?.basePrice || 350,
        roomsCost: 0,
        mealPricePerPerson: 0,
        mealsCost: 0,
        subtotal: 0,
        taxes: 0,
        grandTotal: 0,
        isTaxIncluded: true,
        currency: 'SAR',
        nightlyBreakdown: [],
        validationErrors: ['يرجى تحديد تفاصيل الحجز'],
        priceBreakdown: {
          nights: 0,
          nightlyRates: [],
          roomsCost: 0,
          mealPricePerPerson: 0,
          mealsCost: 0,
          extraCharges: 0,
          taxes: 0,
          isTaxIncluded: true,
          totalAmount: 0,
          currency: 'SAR'
        }
      };
    }

    return calculateBookingPrice({
      hotel,
      room: selectedRoom,
      checkIn,
      checkOut,
      roomsCount,
      guestsCount: adultsCount + childrenCount,
      mealPlan: selectedMealPlan,
      pricingPeriods
    });
  }, [
    hotel,
    rooms,
    selectedRoomsMap,
    selectedRoom,
    checkIn,
    checkOut,
    roomsCount,
    adultsCount,
    childrenCount,
    totalRoomsCapacity,
    selectedMealPlan,
    pricingPeriods,
    nightsCount
  ]);

  // Step 1 Validation (Never blocks user from seeing availability or proceeding)
  const isStep1Valid = useMemo(() => {
    return Boolean(
      checkIn && 
      checkOut && 
      checkOut > checkIn && 
      nightsCount > 0 && 
      (roomsCount >= 1 || totalSelectedRoomsCount >= 1) && 
      adultsCount >= 1
    );
  }, [checkIn, checkOut, nightsCount, roomsCount, totalSelectedRoomsCount, adultsCount]);

  // Check if dates are outside active periods
  const isOutsideActivePeriods = useMemo(() => {
    if (hotel.onlineAvailabilityMode !== 'periods_only' || !checkIn || !checkOut || checkOut <= checkIn) {
      return false;
    }
    const activePeriods = pricingPeriods.filter(p => p.isActive !== false);
    if (activePeriods.length === 0) return true;
    const stayDates = getStayNightDates(checkIn, checkOut);
    return !stayDates.every(d => activePeriods.some(p => d >= p.startDate && d <= p.endDate));
  }, [hotel.onlineAvailabilityMode, checkIn, checkOut, pricingPeriods]);

  // Step 2 Validation: Must have selected at least 1 room
  const isStep2Valid = useMemo(() => {
    const hasRooms = (totalSelectedRoomsCount > 0) || Boolean(selectedRoom);
    if (!hasRooms) return false;
    return pricingResult.isValid && pricingResult.grandTotal > 0;
  }, [totalSelectedRoomsCount, selectedRoom, pricingResult]);

  // Step 3 Validation: Guest details
  const isStep3Valid = useMemo(() => {
    const isNameValid = guestName.trim().length >= 3;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim());
    const cleanPhone = guestPhoneNumber.replace(/\D/g, '');
    const isPhoneValid = cleanPhone.length >= 7 && cleanPhone.length <= 15;
    const isGroupValid = bookingType === 'group' 
      ? (companyOrGroupName.trim().length >= 2 || guestName.trim().length >= 3)
      : true;
    return isNameValid && isEmailValid && isPhoneValid && consentAgreed && isGroupValid;
  }, [guestName, guestEmail, guestPhoneNumber, consentAgreed, bookingType, companyOrGroupName]);

  // Full International Phone String
  const fullWhatsAppNumber = useMemo(() => {
    const clean = guestPhoneNumber.replace(/^0+/, '').replace(/\D/g, '');
    return `${selectedCountry.dialCode}${clean}`;
  }, [selectedCountry, guestPhoneNumber]);

  // Quick Period Switchers (تبديل الفترة)
  const handleSelectPeriod = (startDate: string, endDate: string) => {
    setCheckIn(startDate);
    setCheckOut(endDate);
  };

  const handleQuickWeekend = () => {
    const d = new Date();
    const day = d.getDay();
    const diffToThursday = (4 - day + 7) % 7 || 7;
    const thurs = new Date(d);
    thurs.setDate(d.getDate() + diffToThursday);
    const sat = new Date(thurs);
    sat.setDate(thurs.getDate() + 2);
    setCheckIn(thurs.toISOString().split('T')[0]);
    setCheckOut(sat.toISOString().split('T')[0]);
  };

  const handleQuickNextWeek = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const outD = new Date(d);
    outD.setDate(d.getDate() + 3);
    setCheckIn(d.toISOString().split('T')[0]);
    setCheckOut(outD.toISOString().split('T')[0]);
  };

  // Transition handlers with analytics tracking
  const handleProceedToStep2 = () => {
    if (!isStep1Valid) return;
    trackBookingFunnel('booking_dates_selected', {
      hotel_id: hotel.id,
      check_in: checkIn,
      check_out: checkOut,
      nights: nightsCount,
      rooms_count: roomsCount,
      guests_count: adultsCount + childrenCount
    });
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToStep3 = () => {
    if (!isStep2Valid || !selectedRoom) return;
    trackBookingFunnel('booking_room_selected', {
      hotel_id: hotel.id,
      room_id: selectedRoom.id,
      room_name: selectedRoom.name,
      meal_plan_id: selectedMealPlan?.id || 'meal_none',
      total_amount: pricingResult.grandTotal
    });
    trackBookingFunnel('booking_details_reached', {
      hotel_id: hotel.id,
      step_number: 3
    });
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submission handler with Atomic Transaction and Idempotency Guard
  const handleConfirmBooking = async () => {
    if (!isStep3Valid || !selectedRoom || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    trackBookingFunnel('booking_submitted', {
      hotel_id: hotel.id,
      room_id: selectedRoom.id,
      total_amount: pricingResult.grandTotal,
      idempotency_key: idempotencyKey
    });

    try {
      const booking = await createBookingAtomicTransaction({
        hotel,
        room: selectedRoom,
        checkIn,
        checkOut,
        roomsCount: totalSelectedRoomsCount || roomsCount,
        adultsCount,
        childrenCount,
        guestName,
        guestPhone: fullWhatsAppNumber,
        guestEmail,
        mealPlan: selectedMealPlan,
        specialRequests,
        idempotencyKey,
        honeypot,
        formStartTime,
        consentAgreed,
        preferredView,
        preferredFloor,
        expressCheckInOptIn,
        isGroupBooking: bookingType === 'group' || groupRoomsBreakdown.length > 1,
        companyOrGroupName: companyOrGroupName.trim() || undefined,
        groupLeaderName: groupLeaderName.trim() || undefined,
        groupLeaderPhone: groupLeaderPhone.trim() || undefined,
        busCount: bookingType === 'group' ? busCount : undefined,
        roomingList: roomingList.trim() || undefined,
        groupRoomsBreakdown,
        customGrandTotal: pricingResult.grandTotal,
        customRoomPricePerNight: pricingResult.averageNightlyRate
      });

      setConfirmedBooking(booking);
      setCurrentStep(4);
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      // Automated Background Email Dispatch via Google Apps Script
      setEmailSendingStatus('sending');
      sendBookingEmailViaAppsScript(booking, undefined, siteSettings)
        .then((res) => {
          if (res.success) {
            setEmailSendingStatus('sent');
          } else {
            setEmailSendingStatus('failed');
            setEmailErrorMessage(res.error || '');
          }
        })
        .catch((err) => {
          setEmailSendingStatus('failed');
          setEmailErrorMessage(err?.message || '');
        });

      trackBookingFunnel('booking_confirmed', {
        hotel_id: hotel.id,
        booking_code: booking.bookingCode,
        total_amount: booking.totalAmount,
        room_name: booking.roomName
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[BookingFlow] Submission failed:', err);
      const friendlyMsg = err instanceof OverbookingError || err.message?.includes('نفدت')
        ? err.message
        : 'تعذر إتمام الحجز في الوقت الحالي. يرجى مراجعة البيانات والمحاولة مرة أخرى أو التواصل معنا عبر الواتساب.';
      setSubmitError(friendlyMsg);
      trackBookingFunnel('booking_error', {
        hotel_id: hotel.id,
        error_message: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!confirmedBooking) return;
    setEmailSendingStatus('sending');
    setEmailErrorMessage('');
    try {
      const res = await sendBookingEmailViaAppsScript(confirmedBooking, undefined, siteSettings);
      if (res.success) {
        setEmailSendingStatus('sent');
      } else {
        setEmailSendingStatus('failed');
        setEmailErrorMessage(res.error || '');
      }
    } catch (err: any) {
      setEmailSendingStatus('failed');
      setEmailErrorMessage(err?.message || '');
    }
  };

  // WhatsApp instant share link after confirmation
  const whatsappUrl = useMemo(() => {
    if (!confirmedBooking) return '';
    return buildVisitorWhatsAppConfirmationLink(confirmedBooking, siteSettings);
  }, [confirmedBooking, siteSettings]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10 text-stone-900" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Header & Hotel Badge */}
      <div className="bg-white/80 backdrop-blur-xl border border-[#C9A24B]/30 rounded-3xl p-5 md:p-7 shadow-lg shadow-[#C9A24B]/5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#C9A24B] tracking-wide mb-1 uppercase">
              <Building2 className="w-4 h-4" />
              <span>{hotel.city} - {hotel.district || 'المنطقة المركزية'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">
              {hotel.name}
            </h1>
            <p className="text-xs md:text-sm text-stone-500 mt-1">
              {hotel.distanceText || `${hotel.distanceToHaram} متر عن الحرم`} • تصنيف {hotel.stars} نجوم
            </p>
          </div>

          {currentStep < 4 && allHotels.length > 1 && onSelectAnotherHotel && (
            <button
              onClick={() => onSelectAnotherHotel('')}
              className="text-xs font-semibold text-stone-600 hover:text-[#C9A24B] border border-stone-200 hover:border-[#C9A24B]/40 px-3.5 py-2 rounded-xl transition-colors self-start md:self-center"
            >
              تغيير الفندق
            </button>
          )}
        </div>

        {/* 2. Three-Step Visible Progress Indicator */}
        {currentStep < 4 && (
          <div className="mt-6 pt-6 border-t border-stone-100">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-stone-100 -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-0 right-0 h-1 bg-[#C9A24B] -translate-y-1/2 z-0 transition-all duration-300"
                style={{
                  width: currentStep === 1 ? '16%' : currentStep === 2 ? '50%' : '100%',
                  right: isRtl ? 0 : 'auto',
                  left: isRtl ? 'auto' : 0
                }}
              />

              {/* Step 1 */}
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep >= 1 ? 'bg-[#C9A24B] text-white shadow-md shadow-[#C9A24B]/30' : 'bg-stone-100 text-stone-400'
                }`}>
                  {currentStep > 1 ? <Check className="w-4 h-4" /> : '١'}
                </div>
                <span className={`text-xs font-bold ${currentStep === 1 ? 'text-[#C9A24B]' : 'text-stone-500'}`}>
                  التواريخ والنزلاء
                </span>
              </button>

              {/* Step 2 */}
              <button
                type="button"
                onClick={() => isStep1Valid && setCurrentStep(2)}
                disabled={!isStep1Valid}
                className={`relative z-10 flex flex-col items-center gap-1.5 focus:outline-none ${!isStep1Valid ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep >= 2 ? 'bg-[#C9A24B] text-white shadow-md shadow-[#C9A24B]/30' : 'bg-stone-100 text-stone-400'
                }`}>
                  {currentStep > 2 ? <Check className="w-4 h-4" /> : '٢'}
                </div>
                <span className={`text-xs font-bold ${currentStep === 2 ? 'text-[#C9A24B]' : 'text-stone-500'}`}>
                  اختيار الغرفة
                </span>
              </button>

              {/* Step 3 */}
              <button
                type="button"
                onClick={() => isStep1Valid && isStep2Valid && setCurrentStep(3)}
                disabled={!isStep1Valid || !isStep2Valid}
                className={`relative z-10 flex flex-col items-center gap-1.5 focus:outline-none ${(!isStep1Valid || !isStep2Valid) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === 3 ? 'bg-[#C9A24B] text-white shadow-md shadow-[#C9A24B]/30' : 'bg-stone-100 text-stone-400'
                }`}>
                  ٣
                </div>
                <span className={`text-xs font-bold ${currentStep === 3 ? 'text-[#C9A24B]' : 'text-stone-500'}`}>
                  بيانات النزيل
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. STEP CONTENT */}
      
      {/* ======================================================== */}
      {/* STEP 1: Dates & Guests                                   */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm">
          {/* Segmented Booking Mode Toggle (Hidden when user is in individual booking flow) */}
          {(!hideBookingTypeToggle && initialBookingType !== 'individual') && (
            <div className="mb-6 p-1.5 bg-stone-100 rounded-2xl flex items-center gap-1.5 border border-stone-200/90 shadow-inner">
              <button
                type="button"
                onClick={() => setBookingType('individual')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  bookingType === 'individual'
                    ? 'bg-white text-stone-900 shadow-md border border-[#C9A24B]/40 ring-1 ring-[#C9A24B]/20'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <User className="w-4 h-4 text-[#C9A24B]" />
                <span>👤 حجز فردي / عائلي</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBookingType('group');
                  if (roomsCount < 3 && totalSelectedRoomsCount < 3) {
                    setRoomsCount(3);
                  }
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  bookingType === 'group'
                    ? 'bg-gradient-to-r from-stone-900 to-stone-800 text-white shadow-lg border border-[#C9A24B]/50'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <UsersRound className="w-4 h-4 text-[#E0C070]" />
                <span>👥 حجز مجموعة / حملة / شركات</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C9A24B]/25 text-[#E0C070] font-bold hidden sm:inline border border-[#C9A24B]/30">
                  حملات ومجموعات
                </span>
              </button>
            </div>
          )}

          {/* Group Booking Informative Banner */}
          {bookingType === 'group' && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#C9A24B]/15 to-amber-500/10 border border-[#C9A24B]/40 text-stone-900 text-xs flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-[#8C6D23] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-extrabold text-[#8C6D23] text-sm">
                  ميزة حجز المجموعات والحملات مفعلة 👥
                </strong>
                <p className="mt-1 text-stone-600 leading-relaxed">
                  يمكنك في الخطوة التالية تحديد واختيار أكثر من نوع غرفة معاً (مثال: غرف ثنائية + غرف ثلاثية + أجنحة عائلية)، واختيار باقة الوجبات الجماعية، وتدوين بيانات قائد الحملة وكشف التسكين الأولي.
                </p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#C9A24B]" />
              <span>{bookingType === 'group' ? 'حدد تواريخ إقامة المجموعة والعدد التقديري' : 'حدد تواريخ الإقامة وعدد النزلاء'}</span>
            </h2>
            <p className="text-xs md:text-sm text-stone-500 mt-1">
              إلغاء مرن وتأكيد فوري مباشرة من إدارة الفندق بدون وسطاء.
            </p>
          </div>

          {/* ── PERIOD SWITCHER COMPONENT (تبديل الفترة والمواسم المتاحة) ── */}
          <div className="mb-6 p-4 rounded-2xl bg-stone-50 border border-stone-200/90 text-right space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-stone-800">
                <Calendar className="w-4 h-4 text-[#B38A34]" />
                <span>تبديل الفترة والمواسم المتاحة للفندق:</span>
              </div>
              <span className="text-[11px] text-stone-500">
                اضغط على أي موسم أو فترة لتحديث التواريخ فوراً
              </span>
            </div>

            {/* Hotel Defined Pricing Periods */}
            {pricingPeriods.filter(p => p.isActive !== false).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pricingPeriods.filter(p => p.isActive !== false).map(p => {
                  const isCurrent = checkIn === p.startDate && checkOut === p.endDate;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPeriod(p.startDate, p.endDate)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                        isCurrent
                          ? 'bg-[#C9A24B] text-white border-[#C9A24B] shadow-xs'
                          : 'bg-white hover:bg-amber-50 text-stone-800 border-stone-200 hover:border-[#C9A24B]/50'
                      }`}
                    >
                      <Sparkles className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-[#B38A34]'}`} />
                      <span>{p.name}:</span>
                      <span dir="ltr" className="font-mono text-[11px]">{p.startDate} ~ {p.endDate}</span>
                      {isCurrent && <span className="text-[10px] bg-white/20 px-1 rounded">المحدد حالياً ✓</span>}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Quick Shortcuts: Weekend & Next Week */}
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-stone-200/60">
              <span className="text-[11px] text-stone-500 font-bold">اختصارات سريعة:</span>
              <button
                type="button"
                onClick={handleQuickWeekend}
                className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-[#C9A24B] text-[11px] font-bold text-stone-700 transition-colors cursor-pointer"
              >
                عطلة نهاية الأسبوع (خميس - سبت) ⚡
              </button>
              <button
                type="button"
                onClick={handleQuickNextWeek}
                className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-[#C9A24B] text-[11px] font-bold text-stone-700 transition-colors cursor-pointer"
              >
                الأسبوع القادم (3 ليالٍ) ⚡
              </button>
            </div>

            {/* Friendly Non-Blocking Advisory if outside active periods */}
            {isOutsideActivePeriods && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-stone-800 text-xs flex items-center justify-between flex-wrap gap-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    التواريخ الحالية خارج المواسم المجدولة للفندق. يمكنك المتابعة أو تبديل الفترة لأحد المواسم المعتمدة.
                  </span>
                </div>
                {pricingPeriods.filter(p => p.isActive !== false).length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstP = pricingPeriods.find(p => p.isActive !== false);
                      if (firstP) handleSelectPeriod(firstP.startDate, firstP.endDate);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#C9A24B] text-white font-bold text-[11px] hover:bg-[#B38A34] transition-colors cursor-pointer shrink-0"
                  >
                    تبديل لأقرب موسم متاح الآن ⚡
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Check-In Date */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                تاريخ الدخول (Check-in)
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={todayStr}
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (e.target.value >= checkOut) {
                      const nextDay = new Date(new Date(e.target.value).getTime() + 86400000).toISOString().split('T')[0];
                      setCheckOut(nextDay);
                    }
                  }}
                  className="w-full h-13 px-4 rounded-2xl border border-stone-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-stone-800 font-semibold text-sm transition-all bg-stone-50/50"
                />
              </div>
            </div>

            {/* Check-Out Date */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                تاريخ المغادرة (Check-out)
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={checkIn || todayStr}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full h-13 px-4 rounded-2xl border border-stone-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-stone-800 font-semibold text-sm transition-all bg-stone-50/50"
                />
              </div>
            </div>
          </div>

          {/* Nights Badge */}
          {nightsCount > 0 && (
            <div className="bg-[#C9A24B]/10 border border-[#C9A24B]/30 rounded-2xl p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-[#8C6D23] mb-6">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>إجمالي مدة الإقامة:</span>
              </span>
              <span>{nightsCount} {nightsCount === 1 ? 'ليلة واحدة' : nightsCount === 2 ? 'ليلتان' : `${nightsCount} ليالٍ`}</span>
            </div>
          )}

          {/* Room & Guests Counter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200/80 mb-6">
            {/* Rooms Counter */}
            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-[#C9A24B]" />
                <span>{bookingType === 'group' ? 'عدد الغرف المبدئي' : 'عدد الغرف'}</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRoomsCount(prev => Math.max(1, prev - 1))}
                  disabled={roomsCount <= 1}
                  className="w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold flex items-center justify-center hover:border-[#C9A24B] disabled:opacity-40 transition-colors shadow-sm"
                >
                  -
                </button>
                <span className="font-extrabold text-stone-900 text-base min-w-[20px] text-center">{roomsCount}</span>
                <button
                  type="button"
                  onClick={() => setRoomsCount(prev => Math.min(bookingType === 'group' ? 100 : 15, prev + 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold flex items-center justify-center hover:border-[#C9A24B] transition-colors shadow-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Adults Counter */}
            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#C9A24B]" />
                <span>{bookingType === 'group' ? 'أفراد المجموعة (البالغون)' : 'البالغون (١٢+ سنة)'}</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdultsCount(prev => Math.max(1, prev - 1))}
                  disabled={adultsCount <= 1}
                  className="w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold flex items-center justify-center hover:border-[#C9A24B] disabled:opacity-40 transition-colors shadow-sm"
                >
                  -
                </button>
                <span className="font-extrabold text-stone-900 text-base min-w-[20px] text-center">{adultsCount}</span>
                <button
                  type="button"
                  onClick={() => setAdultsCount(prev => Math.min(bookingType === 'group' ? 500 : 30, prev + 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold flex items-center justify-center hover:border-[#C9A24B] transition-colors shadow-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Children Counter */}
            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-stone-400" />
                <span>الأطفال (أقل من ١٢)</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setChildrenCount(prev => Math.max(0, prev - 1))}
                  disabled={childrenCount <= 0}
                  className="w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold flex items-center justify-center hover:border-[#C9A24B] disabled:opacity-40 transition-colors shadow-sm"
                >
                  -
                </button>
                <span className="font-extrabold text-stone-900 text-base min-w-[20px] text-center">{childrenCount}</span>
                <button
                  type="button"
                  onClick={() => setChildrenCount(prev => Math.min(50, prev + 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold flex items-center justify-center hover:border-[#C9A24B] transition-colors shadow-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleProceedToStep2}
            disabled={!isStep1Valid}
            className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#C9A24B] to-[#B38E38] text-white font-extrabold text-base shadow-lg shadow-[#C9A24B]/25 hover:shadow-xl hover:shadow-[#C9A24B]/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>متابعة لاختيار الغرف والوجبات</span>
            <ArrowLeft className={`w-5 h-5 ${isRtl ? '' : 'rotate-180'}`} />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: Choose Room & Meals                              */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-stone-900 flex items-center gap-2">
                <BedDouble className="w-6 h-6 text-[#C9A24B]" />
                <span>اختر الغرف والكميات وباقة الوجبات</span>
              </h2>
              <p className="text-xs md:text-sm text-stone-500 mt-1">
                {bookingType === 'group'
                  ? 'يمكنك اختيار كميات وتوزيعات مختلفة من الغرف وتحديد الوجبات المناسبة للمجموعة.'
                  : 'يمكنك اختيار نوع الغرفة، أو الجمع بين أكثر من نوع غرفة وتحديد باقة الوجبات.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs font-bold text-stone-600 hover:text-[#C9A24B] flex items-center gap-1 self-start sm:self-center transition-colors cursor-pointer"
            >
              <ArrowRight className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
              <span>تعديل التواريخ والنزلاء</span>
            </button>
          </div>

          {/* Rooms List */}
          {loadingData ? (
            <div className="space-y-4">
              {[1, 2].map(n => (
                <div key={n} className="h-44 rounded-3xl bg-stone-100 animate-pulse" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center text-amber-800">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="font-bold">لا توجد غرف متاحة لهذا الفندق حالياً أونلاين.</p>
              <p className="text-xs mt-1">تفضل بالتواصل معنا مباشرة عبر الواتساب لتأكيد توفر الغرف.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => {
                const roomAvail = availabilityMap[room.id] || { isAvailable: true, minRemainingRooms: room.availableRooms || 3, validationErrors: [] };
                const currentQty = selectedRoomsMap[room.id] || 0;
                const remaining = roomAvail.minRemainingRooms;
                const isRoomSoldOut = !roomAvail.isAvailable || remaining <= 0;
                const hasSelectedThisRoom = currentQty > 0;

                return (
                  <div
                    key={room.id}
                    onClick={() => {
                      if (!isRoomSoldOut && currentQty === 0) {
                        handleRoomQuantityChange(room.id, 1);
                      }
                    }}
                    className={`rounded-3xl p-5 md:p-6 transition-all border ${
                      hasSelectedThisRoom 
                        ? 'bg-gradient-to-br from-white to-[#FBF8F0] border-[#C9A24B] ring-2 ring-[#C9A24B]/30 shadow-lg shadow-[#C9A24B]/10' 
                        : isRoomSoldOut
                        ? 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-stone-200 hover:border-[#C9A24B]/40 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Room Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="text-lg md:text-xl font-extrabold text-stone-900">
                            {room.name}
                          </h3>
                          {hasSelectedThisRoom && (
                            <span className="bg-[#C9A24B] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                              <Check className="w-3.5 h-3.5" />
                              <span>تم اختيار {currentQty} {currentQty === 1 ? 'غرفة' : 'غرف'}</span>
                            </span>
                          )}
                          {remaining <= 3 && remaining > 0 && !isRoomSoldOut && (
                            <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                              <Flame className="w-3.5 h-3.5" />
                              <span>متبقي {remaining} {remaining === 1 ? 'غرفة فقط' : 'غرف فقط'}!</span>
                            </span>
                          )}
                          {isRoomSoldOut && (
                            <span className="bg-stone-200 text-stone-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                              غير متاح لهذه التواريخ
                            </span>
                          )}
                        </div>

                        <p className="text-xs md:text-sm text-stone-500 mb-3 line-clamp-2">
                          {room.description || 'إقامة مريحة ومميزة تشمل كافة الخدمات الفندقية المتكاملة.'}
                        </p>

                        {/* Room Features */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 mb-2">
                          <span className="bg-amber-50 border border-amber-200/90 text-amber-950 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold shadow-2xs">
                            <Users className="w-3.5 h-3.5 text-[#B38A34]" />
                            <span>سعة {getEffectiveRoomCapacity(room)} نزلاء للغرفة</span>
                          </span>
                          <span className="bg-stone-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium text-stone-700">
                            <BedDouble className="w-3.5 h-3.5 text-stone-500" />
                            <span>{getEffectiveBedType(room)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Room Price & Quantity Control */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-stone-100">
                        <div className="text-right md:text-left">
                          <div className="text-xs text-stone-400">سعر الليلة للغرفة</div>
                          <div className="text-xl md:text-2xl font-black text-[#C9A24B] tracking-tight">
                            {room.basePrice || 350} <span className="text-xs font-bold text-stone-600">ر.س</span>
                          </div>
                          {selectedMealPlan && selectedMealPlan.id !== 'meal_none' && (
                            <div className="text-[10px] font-bold text-[#8C6D23] mt-0.5">
                              + وجبة {selectedMealPlan.name}: {Number(selectedMealPlan.price ?? selectedMealPlan.pricePerPersonPerNight ?? 0)} ر.س / فرد
                            </div>
                          )}
                        </div>

                        {/* Quantity Increment/Decrement Controls */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {currentQty === 0 ? (
                            isRoomSoldOut ? (
                              <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8C6D23] font-extrabold text-[11px] transition-all flex items-center gap-1.5 border border-amber-300 cursor-pointer shadow-xs active:scale-95"
                                title="تبديل الفترة لتحديث تواريخ الإقامة"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>تبديل الفترة 🔄</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRoomQuantityChange(room.id, 1)}
                                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 font-extrabold text-xs transition-all flex items-center gap-1.5 border border-stone-200 cursor-pointer active:scale-95 shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>إضافة للحجز</span>
                              </button>
                            )
                          ) : (
                            <div className="flex items-center gap-2 bg-white border border-[#C9A24B]/50 p-1 rounded-xl shadow-sm">
                              <button
                                type="button"
                                onClick={() => handleRoomQuantityChange(room.id, -1)}
                                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold flex items-center justify-center transition-all cursor-pointer active:scale-95"
                                title="إنقاص غرفة"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-black text-stone-900 text-sm min-w-[28px] text-center">
                                {currentQty}
                              </span>
                              <button
                                type="button"
                                disabled={currentQty >= remaining}
                                onClick={() => handleRoomQuantityChange(room.id, 1)}
                                className="w-8 h-8 rounded-lg bg-[#C9A24B] hover:bg-[#B38E38] text-white font-extrabold flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs active:scale-95"
                                title={currentQty >= remaining ? 'وصلت للحد الأقصى المتاح' : 'زيادة غرفة'}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Rooms Aggregate Summary Badge */}
          {totalSelectedRoomsCount > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#C9A24B]/15 to-amber-500/10 border border-[#C9A24B]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div>
                <div className="flex items-center gap-2 text-xs md:text-sm font-black text-[#8C6D23]">
                  <BedDouble className="w-4 h-4 text-[#8C6D23]" />
                  <span>
                    الغرف المحددة للحجز ({totalSelectedRoomsCount} غرف - تتسع لـ {totalRoomsCapacity} نزيل):
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {groupRoomsBreakdown.map((item) => (
                    <span key={item.roomId} className="bg-white/95 px-3 py-1 rounded-xl border border-[#C9A24B]/40 text-stone-800 text-xs font-bold shadow-2xs">
                      {item.roomsCount}x {item.roomName} <span className="text-[#8C6D23]">({item.totalAmount} ر.س)</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right sm:text-left shrink-0">
                <span className="text-[11px] text-stone-500 block">إجمالي تكلفة الغرف</span>
                <span className="text-lg font-black text-stone-900">{pricingResult.roomsCost} {pricingResult.currency}</span>
              </div>
            </div>
          )}

          {/* DEDICATED MEAL PLANS SECTION */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 text-[#C9A24B] flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-stone-900">
                    باقة الوجبات وتغذية الإقامة (Meal Plan)
                  </h3>
                  <p className="text-xs text-stone-500">
                    حدد باقة الطعام المفضلة لجميع النزلاء طوال فترة الإقامة ({nightsCount} ليالٍ)
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
                اختياري
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {allAvailableMealPlans.map((meal) => {
                const isSelected = selectedMealId === meal.id;
                const price = Number(meal.price ?? meal.pricePerPersonPerNight ?? 0);

                return (
                  <button
                    key={meal.id}
                    type="button"
                    onClick={() => setSelectedMealId(meal.id)}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#C9A24B]/10 border-[#C9A24B] ring-2 ring-[#C9A24B]/20 shadow-md'
                        : 'bg-stone-50/70 border-stone-200 hover:border-[#C9A24B]/40 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#C9A24B] bg-[#C9A24B]' : 'border-stone-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-xs font-black ${isSelected ? 'text-[#8C6D23]' : 'text-stone-700'}`}>
                          {price === 0 ? 'مشول مجاناً' : `+${price} ر.س / فرد / ليلة`}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-stone-900 mb-1">
                        {meal.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        {meal.description || 'باقة وجبات طازجة ومتكاملة طوال مدة الإقامة.'}
                      </p>
                    </div>

                    {isSelected && price > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#C9A24B]/20 text-[11px] font-bold text-[#8C6D23] flex items-center justify-between">
                        <span>إجمالي الوجبات:</span>
                        <span>{pricingResult.mealsCost} ر.س</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="h-12 px-6 rounded-2xl border border-stone-200 text-stone-700 font-bold text-sm hover:border-[#C9A24B] transition-colors cursor-pointer"
            >
              السابق
            </button>
            <button
              type="button"
              onClick={handleProceedToStep3}
              disabled={!isStep2Valid}
              className="flex-1 max-w-sm h-12 rounded-2xl bg-gradient-to-r from-[#C9A24B] to-[#B38E38] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>متابعة لبيانات النزيل</span>
              <ArrowLeft className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: Details & Confirm                                */}
      {/* ======================================================== */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <User className="w-5 h-5 text-[#C9A24B]" />
              <span>بيانات مسؤول الحجز وإصدار السند</span>
            </h2>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="text-xs font-bold text-stone-600 hover:text-[#C9A24B] flex items-center gap-1"
            >
              <ArrowRight className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
              <span>تغيير الغرفة</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-5">
            {/* GROUP & CAMPAIGN DETAILS (When Group Booking) */}
            {bookingType === 'group' && (
              <div className="bg-gradient-to-br from-[#FAF8F2] to-amber-50/60 rounded-2xl border border-[#C9A24B]/40 p-4 md:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-[#C9A24B]/20">
                  <Briefcase className="w-5 h-5 text-[#8C6D23]" />
                  <div>
                    <h4 className="text-sm font-extrabold text-stone-900">
                      بيانات الحملة أو الشركة المنظمة للمجموعة
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      تُدرج هذه البيانات رسمياً في سند الحجز وسجل التسكين والفاتورة.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company or Group Name */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      اسم الحملة / الشركة / الجهة <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: حملة الهدى للعمرة / شركة الأفق"
                      value={companyOrGroupName}
                      onChange={(e) => setCompanyOrGroupName(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-stone-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-stone-900 font-bold text-xs bg-white"
                    />
                  </div>

                  {/* Group Leader Name */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      اسم مشرف أو قائد المجموعة
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: أ. عبد الرحمن السالم"
                      value={groupLeaderName}
                      onChange={(e) => setGroupLeaderName(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-stone-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-stone-900 text-xs bg-white"
                    />
                  </div>

                  {/* Group Leader Phone */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      رقم هاتف المشرف المباشر للتواصل
                    </label>
                    <input
                      type="tel"
                      placeholder="+966 50 000 0000"
                      value={groupLeaderPhone}
                      onChange={(e) => setGroupLeaderPhone(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-stone-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-stone-900 text-xs bg-white"
                      dir="ltr"
                    />
                  </div>

                  {/* Bus Count */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      عدد الحافلات / الباصات
                    </label>
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-[#C9A24B]" />
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={busCount}
                        onChange={(e) => setBusCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full h-12 px-4 rounded-xl border border-stone-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-stone-900 font-bold text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Rooming list / notes */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    كشف التسكين الأولي / ملاحظات توزيع النزلاء (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="يمكنك كتابة توزيع الأسماء والغرف، أو أي متطلبات خاصة بالتسكين الجماعي..."
                    value={roomingList}
                    onChange={(e) => setRoomingList(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-stone-800 text-xs bg-white resize-none"
                  />
                </div>
              </div>
            )}

            {/* Guest Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                الاسم الثلاثي للنزيل (كما في الهوية أو جواز السفر) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد عبد الله المحمدي"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={`w-full h-13 px-4 rounded-2xl border text-stone-900 font-medium text-sm transition-all bg-stone-50/50 ${
                    guestName.trim().length >= 3 
                      ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                      : 'border-stone-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20'
                  }`}
                />
                {guestName.trim().length >= 3 && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute top-1/2 left-4 -translate-y-1/2" />
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                البريد الإلكتروني (لاستلام الفاتورة الإلكترونية وسند الحجز) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full h-13 px-4 rounded-2xl border border-stone-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-stone-900 font-medium text-sm transition-all bg-stone-50/50"
                  dir="ltr"
                />
                <Mail className="w-5 h-5 text-stone-400 absolute top-1/2 right-4 -translate-y-1/2" />
              </div>
            </div>

            {/* WhatsApp Phone with Country Code Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                رقم الواتساب للتأكيد والتواصل الفوري <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2" dir="ltr">
                {/* Country Code Dropdown */}
                <div className="relative min-w-[125px]">
                  <select
                    value={selectedCountry.dialCode}
                    onChange={(e) => {
                      const found = POPULAR_COUNTRIES.find(c => c.dialCode === e.target.value);
                      if (found) setSelectedCountry(found);
                    }}
                    className="w-full h-13 px-3 rounded-2xl border border-stone-200 bg-stone-50/80 text-stone-800 text-xs font-bold focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 appearance-none cursor-pointer"
                  >
                    {POPULAR_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.dialCode}>
                        {c.flag} {c.dialCode} ({c.nameAr})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-400 absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Phone Input */}
                <input
                  type="tel"
                  required
                  placeholder="50 123 4567"
                  value={guestPhoneNumber}
                  onChange={(e) => setGuestPhoneNumber(e.target.value)}
                  className="flex-1 h-13 px-4 rounded-2xl border border-stone-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-stone-900 font-bold text-sm tracking-wide bg-stone-50/50"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1" dir={isRtl ? 'rtl' : 'ltr'}>
                سنرسل سند الحجز ورابط الفاتورة المباشر إلى رقم الواتساب المسجل.
              </p>
            </div>

            {/* Special Requests (Optional) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                ملاحظات أو طلبات خاصة (اختياري)
              </label>
              <textarea
                rows={2}
                placeholder="مثال: سرير إضافي، طابق علوي هادئ، وصول مبكر..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-stone-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-stone-800 text-xs transition-all bg-stone-50/50 resize-none"
              />
            </div>

            {/* VIP STAY PREFERENCES & EXPRESS CHECK-IN */}
            <div className="bg-gradient-to-br from-[#FAF7F0] to-[#F5EEDD]/40 rounded-2xl border border-[#C9A24B]/30 p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/20 border border-[#C9A24B]/40 flex items-center justify-center text-[#9E7B2D]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-extrabold text-stone-900">
                      تفضيلات الإقامة والتسكين السريع (VIP Preferences)
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      حدد تفضيلاتك وسنجهز غرفتك مسبقاً قبل وصولك.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#C9A24B]/15 text-[#9E7B2D] border border-[#C9A24B]/30">
                  خدمة مجانية
                </span>
              </div>

              {/* View Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#C9A24B]" />
                  <span>الإطلالة المفضلة للغرفة:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'any', label: 'حسب التوفر' },
                    { id: 'haram', label: 'إطلالة الحرم الشريف' },
                    { id: 'panoramic', label: 'إطلالة بانورامية' },
                    { id: 'city', label: 'إطلالة على المدينة' },
                    { id: 'quiet', label: 'إطلالة هادئة داخلية' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPreferredView(item.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-right flex items-center justify-between cursor-pointer ${
                        preferredView === item.id
                          ? 'bg-[#C9A24B] text-white border-[#C9A24B] shadow-sm'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-[#C9A24B]/50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {preferredView === item.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Floor Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#C9A24B]" />
                  <span>الطابق المفضل:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'any', label: 'حسب التوفر' },
                    { id: 'high', label: 'طابق علوي مرتفع' },
                    { id: 'mid', label: 'طابق متوسط' },
                    { id: 'low', label: 'طابق أرضي/منخفض' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPreferredFloor(item.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-right flex items-center justify-between cursor-pointer ${
                        preferredFloor === item.id
                          ? 'bg-[#C9A24B] text-white border-[#C9A24B] shadow-sm'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-[#C9A24B]/50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {preferredFloor === item.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Express Check-In Opt-in Switch */}
              <div className="pt-2 border-t border-[#C9A24B]/20">
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-white/80 border border-[#C9A24B]/20 hover:border-[#C9A24B]/40 transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        تفعيل التسكين السريع بدون تلامس (Express Online Check-in) ⚡
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        إصدار بطاقة صعود رقمية برمز QR لاستلام المفتاح عند الوصول في 10 ثوانٍ.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={expressCheckInOptIn}
                    onChange={(e) => setExpressCheckInOptIn(e.target.checked)}
                    className="w-5 h-5 rounded text-[#C9A24B] focus:ring-[#C9A24B] border-stone-300 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Spam Honeypot field (hidden from real users) */}
            <input
              type="text"
              name="company_url_hp"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            {/* Policy & Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded-lg text-[#C9A24B] focus:ring-[#C9A24B] border-stone-300"
                />
                <span className="text-xs text-stone-600 leading-relaxed">
                  أوافق على{' '}
                  <button
                    type="button"
                    onClick={() => setIsPolicyModalOpen(true)}
                    className="text-[#C9A24B] font-bold underline hover:text-[#8C6D23]"
                  >
                    سياسة الإلغاء والشروط الخاصة بالحجز
                  </button>
                  ، وأفوض إدارة الفندق بإصدار سند الحجز الرقمي.
                </span>
              </label>
            </div>
          </div>

          {/* ITEM-BY-ITEM SUMMARY (Shown right above confirm button) */}
          <div className="bg-gradient-to-br from-stone-50 to-stone-100/80 rounded-3xl border border-stone-200 p-5 md:p-6">
            <h3 className="text-sm font-extrabold text-stone-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C9A24B]" />
              <span>ملخص الحجز والتكلفة النهائية</span>
            </h3>

            <div className="space-y-2.5 text-xs md:text-sm text-stone-700">
              {bookingType === 'group' && companyOrGroupName && (
                <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                  <span className="font-bold text-[#8C6D23]">الجهة / الحملة المنظمة:</span>
                  <span className="font-extrabold text-stone-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    {companyOrGroupName}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span>الفندق:</span>
                <span className="font-bold text-stone-900">{hotel.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span>فترة الإقامة:</span>
                <span className="font-bold text-stone-900">{checkIn} إلى {checkOut} ({nightsCount} ليالٍ)</span>
              </div>
              <div className="py-2 border-b border-stone-200/60">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-stone-900">
                    الغرف المحددة ({totalSelectedRoomsCount || roomsCount} غرف • {adultsCount + childrenCount} نزلاء):
                  </span>
                  <span className="font-bold text-stone-900">{pricingResult.roomsCost} {pricingResult.currency}</span>
                </div>
                <div className="space-y-1 pr-2">
                  {groupRoomsBreakdown.map((item) => (
                    <div key={item.roomId} className="flex justify-between items-center text-[11px] text-stone-600">
                      <span>• {item.roomsCount}x {item.roomName}</span>
                      <span className="font-mono font-bold text-stone-700">{item.totalAmount} ر.س</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span>باقة الوجبات:</span>
                <span className="font-bold text-stone-900">
                  {selectedMealPlan ? selectedMealPlan.name : 'بدون وجبات (إقامة فقط)'}
                  {pricingResult.mealsCost > 0 && ` (${pricingResult.mealsCost} ${pricingResult.currency})`}
                </span>
              </div>
              {pricingResult.taxes > 0 && (
                <div className="flex justify-between items-center py-1 border-b border-stone-200/60 text-[11px] text-stone-500">
                  <span>الضريبة المضافة (15%):</span>
                  <span>{pricingResult.taxes} {pricingResult.currency}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 text-base font-extrabold text-stone-900">
                <span>المجموع الإجمالي (شامل الضريبة):</span>
                <span className="text-xl font-black text-[#C9A24B]">{pricingResult.grandTotal} {pricingResult.currency}</span>
              </div>
            </div>
          </div>

          {/* Submission Error Banner */}
          {submitError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs md:text-sm text-rose-700 font-bold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Confirm Button */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={submitting}
              className="h-14 px-6 rounded-2xl border border-stone-200 text-stone-700 font-bold text-sm hover:border-[#C9A24B] transition-colors"
            >
              السابق
            </button>
            <button
              type="button"
              onClick={handleConfirmBooking}
              disabled={!isStep3Valid || submitting}
              className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-[#C9A24B] to-[#9E7B2D] text-white font-extrabold text-base shadow-xl shadow-[#C9A24B]/30 hover:shadow-2xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>جاري تأكيد الحجز وإصدار السند...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>تأكيد الحجز الفوري الآن ({pricingResult.grandTotal} ر.س)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: Success Confirmation Screen                      */}
      {/* ======================================================== */}
      {currentStep === 4 && confirmedBooking && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-10 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              تم تسجيل الحجز بنجاح
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 mt-2">
              سند حجز فندقي موثق
            </h2>
            <p className="text-xs md:text-sm text-stone-500 mt-1">
              تم حجز غرفتك في {confirmedBooking.hotelName} وتثبيت السعر المعتمد.
            </p>
          </div>

          {/* Reference Code Card */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 max-w-md mx-auto">
            <span className="text-xs font-bold text-stone-500 block mb-1">الرقم المرجعي للحجز</span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl md:text-3xl font-black text-[#C9A24B] tracking-wider font-mono">
                {confirmedBooking.bookingCode}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(confirmedBooking.bookingCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-[#C9A24B] transition-colors"
                title="نسخ الرقم المرجعي"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Booking Summary Highlights */}
          <div className="max-w-2xl mx-auto bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80 text-xs text-right space-y-2.5">
            {confirmedBooking.companyOrGroupName && (
              <div className="flex justify-between items-center pb-2 border-b border-stone-200/60">
                <span className="text-[#8C6D23] font-bold">الجهة / الحملة المنظمة:</span>
                <span className="font-extrabold text-stone-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                  {confirmedBooking.companyOrGroupName}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-stone-400 block">الفندق</span>
                <span className="font-bold text-stone-800">{confirmedBooking.hotelName}</span>
              </div>
              <div>
                <span className="text-stone-400 block">الغرف المحجوزة</span>
                <span className="font-bold text-stone-800">
                  {confirmedBooking.groupRoomsBreakdown && confirmedBooking.groupRoomsBreakdown.length > 0
                    ? confirmedBooking.groupRoomsBreakdown.map(g => `${g.roomsCount}x ${g.roomName}`).join('، ')
                    : `${confirmedBooking.roomsCount}x ${confirmedBooking.roomName}`}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">فترة الإقامة</span>
                <span className="font-bold text-stone-800">{confirmedBooking.checkIn} ({confirmedBooking.nights} ليالٍ)</span>
              </div>
              <div>
                <span className="text-stone-400 block">الإجمالي المعتمد</span>
                <span className="font-bold text-[#C9A24B]">{confirmedBooking.totalAmount} ر.س</span>
              </div>
            </div>
            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
              <span className="text-stone-500">باقة الوجبات المعتمدة:</span>
              <span className="font-bold text-stone-800">{confirmedBooking.mealPlanName || 'بدون وجبات'}</span>
            </div>
          </div>

          {/* VIP Express Check-In Pass Button */}
          <div className="max-w-md mx-auto pt-2">
            <button
              type="button"
              onClick={() => setShowExpressModal(true)}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white border border-[#C9A24B]/60 shadow-xl shadow-black/20 hover:border-[#C9A24B] hover:shadow-2xl transition-all flex items-center justify-between gap-3 active:scale-[0.99] cursor-pointer group"
            >
              <div className="flex items-center gap-3 text-right">
                <div className="w-11 h-11 rounded-xl bg-[#C9A24B]/20 border border-[#C9A24B]/50 flex items-center justify-center text-[#E0C070] shrink-0 group-hover:scale-105 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-sm font-extrabold text-[#E0C070]">
                    بطاقة وسند التسكين السريع بالـ QR ⚡
                  </span>
                  <span className="block text-[11px] text-stone-300">
                    امسح الرمز واستلم المفتاح خلال 10 ثوانٍ عند الوصول
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#C9A24B] text-white text-[11px] font-bold shrink-0">
                فتح البطاقة
              </span>
            </button>
          </div>

          {/* Real-time Email Delivery Indicator */}
          <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 max-w-md mx-auto text-xs text-right">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {emailSendingStatus === 'sending' && (
                  <RefreshCw className="w-4 h-4 text-[#C9A24B] animate-spin shrink-0" />
                )}
                {emailSendingStatus === 'sent' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                {emailSendingStatus === 'failed' && (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                {emailSendingStatus === 'idle' && (
                  <Mail className="w-4 h-4 text-[#C9A24B] shrink-0" />
                )}
                <div>
                  <span className="font-bold text-stone-800 block text-xs">
                    {emailSendingStatus === 'sending' && 'جاري إرسال سند الحجز والفاتورة PDF لبريدك...'}
                    {emailSendingStatus === 'sent' && 'تم إرسال سند الحجز والفاتورة المعتمدة لبريدك ✉️'}
                    {emailSendingStatus === 'failed' && 'إشعار البريد الإلكتروني (يمكنك إعادة المحاولة)'}
                    {emailSendingStatus === 'idle' && 'إشعار البريد الإلكتروني'}
                  </span>
                  <span className="text-[11px] text-stone-500 font-mono block">
                    {confirmedBooking.guestEmail || guestEmail}
                  </span>
                </div>
              </div>

              {emailSendingStatus === 'sent' ? (
                <button
                  type="button"
                  onClick={handleResendEmail}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold border border-stone-200 transition-colors cursor-pointer"
                >
                  إعادة إرسال
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={emailSendingStatus === 'sending'}
                  className="px-2.5 py-1 rounded-lg bg-[#C9A24B] hover:bg-[#B38A34] text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {emailSendingStatus === 'sending' ? 'جاري الإرسال...' : 'إرسال للبريد'}
                </button>
              )}
            </div>
            {emailErrorMessage && (
              <p className="text-[10px] text-rose-600 mt-1 font-medium">{emailErrorMessage}</p>
            )}
          </div>

          {/* Primary Action: Confirm via WhatsApp */}
          <div className="space-y-3 max-w-md mx-auto pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-base shadow-lg shadow-[#25D366]/25 hover:shadow-xl transition-all flex items-center justify-center gap-2.5 active:scale-[0.99]"
            >
              <MessageCircle className="w-6 h-6" />
              <span>تأكيد واستلام الفاتورة عبر الواتساب</span>
            </a>

            {/* Secondary Action: Digital Invoice & PDF */}
            <div className="flex gap-2.5">
              <a
                href={getInvoiceUrl(confirmedBooking.id, confirmedBooking.token)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-12 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-stone-200"
              >
                <FileText className="w-4 h-4 text-[#C9A24B]" />
                <span>عرض الفاتورة الرقمية</span>
              </a>

              {onOpenTrackModal && (
                <button
                  type="button"
                  onClick={() => onOpenTrackModal(confirmedBooking.bookingCode)}
                  className="flex-1 h-12 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-stone-200"
                >
                  <Clock className="w-4 h-4 text-stone-500" />
                  <span>متابعة حالة الحجز</span>
                </button>
              )}
            </div>

            {/* Google Maps Hotel Location Link */}
            <div className="pt-1 text-center">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(confirmedBooking.hotelName + ' ' + (confirmedBooking.hotelCity || 'مكة المكرمة'))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-bold transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#C9A24B]" />
                <span>موقع الفندق على خرائط Google Maps</span>
              </a>
            </div>
          </div>

          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-xs font-bold text-stone-500 hover:text-stone-800 underline pt-2"
            >
              العودة إلى الصفحة الرئيسية
            </button>
          )}
        </div>
      )}

      {/* 4. MOBILE STICKY SUMMARY BAR (Fixed at bottom on small screens) */}
      {currentStep < 4 && (
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-stone-200 px-4 py-3 z-40 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-[#C9A24B]">
                  {pricingResult.grandTotal} <span className="text-xs font-bold text-stone-700">ر.س</span>
                </span>
                <span className="text-[11px] text-stone-500">/ {nightsCount} ليالٍ</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
                className="text-[11px] font-bold text-stone-500 hover:text-[#C9A24B] flex items-center gap-1"
              >
                <span>تفاصيل السعر</span>
                {isMobileSummaryOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Quick Action button matching current step */}
            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleProceedToStep2}
                disabled={!isStep1Valid}
                className="h-11 px-5 rounded-xl bg-[#C9A24B] text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center gap-1"
              >
                <span>اختيار الغرفة</span>
                <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? '' : 'rotate-180'}`} />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleProceedToStep3}
                disabled={!isStep2Valid}
                className="h-11 px-5 rounded-xl bg-[#C9A24B] text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center gap-1"
              >
                <span>بيانات النزيل</span>
                <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? '' : 'rotate-180'}`} />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={!isStep3Valid || submitting}
                className="h-11 px-5 rounded-xl bg-[#C9A24B] text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>تأكيد الحجز</span>
              </button>
            )}
          </div>

          {/* Expandable Drawer on Mobile */}
          {isMobileSummaryOpen && (
            <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1.5">
              <div className="flex justify-between">
                <span>الغرف المختارة ({totalSelectedRoomsCount || roomsCount}):</span>
                <span className="font-bold text-stone-800">
                  {groupRoomsBreakdown.length > 1
                    ? groupRoomsBreakdown.map(g => `${g.roomsCount}x ${g.roomName}`).join('، ')
                    : selectedRoom?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>تكلفة الغرف:</span>
                <span className="font-bold text-stone-800">{pricingResult.roomsCost} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span>باقة الوجبات:</span>
                <span className="font-bold text-stone-800">{selectedMealPlan?.name || 'بدون وجبات'}</span>
              </div>
              {pricingResult.mealsCost > 0 && (
                <div className="flex justify-between">
                  <span>تكلفة الوجبات:</span>
                  <span className="font-bold text-stone-800">{pricingResult.mealsCost} ر.س</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200">
                <span>الإجمالي (شامل الضريبة):</span>
                <span className="text-[#C9A24B]">{pricingResult.grandTotal} ر.س</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Policy Modal / Drawer */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#C9A24B]" />
                <span>شروط وسياسة الحجز المعتمدة</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-stone-600 space-y-3 leading-relaxed">
              <p><strong>أوقات التسكين:</strong> تسجيل الدخول من الساعة 4:00 عصراً، وتسجيل المغادرة حتى الساعة 12:00 ظهراً.</p>
              <p><strong>سياسة الإلغاء:</strong> إلغاء مجاني متاح حتى 48 ساعة قبل موعد تسجيل الدخول. في حال الإلغاء بعد ذلك أو عدم الحضور، يتم تطبيق شروط الموسم.</p>
              <p><strong>المفتاح الرقمي:</strong> يتم تفعيل المفتاح الرقمي وإرسال بيانات الغرفة فور تأكيد الحجز ومطابقة وثائق إثبات الشخصية.</p>
              <p><strong>الضرائب والرسوم:</strong> جميع الأسعار تشمل ضريبة القيمة المضافة (15%) ورسوم الخدمة المعتمدة بالمملكة العربية السعودية.</p>
            </div>

            <button
              type="button"
              onClick={() => setIsPolicyModalOpen(false)}
              className="w-full h-11 rounded-xl bg-stone-900 text-white font-bold text-xs cursor-pointer"
            >
              فهمت وموافق
            </button>
          </div>
        </div>
      )}

      {/* 6. Express Check-in & Digital Boarding Pass Modal */}
      {showExpressModal && confirmedBooking && (
        <ExpressCheckInModal
          booking={confirmedBooking}
          siteSettings={siteSettings}
          onClose={() => setShowExpressModal(false)}
        />
      )}
    </div>
  );
};
