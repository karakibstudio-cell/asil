import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Hotel, SiteSettings, ActivePage, RoomBooking, RoomTypeItem, HotelPricingPeriod } from '../types';
import { 
  getBookingByCodeOrPhone, 
  buildGuestWhatsAppShareLink, 
  getRoomsFromDb, 
  getPricingPeriodsFromDb 
} from '../services/bookingService';
import { sendContactMessage } from '../services/firebase';
import { BookingFlow } from '../components/BookingFlow';
import { 
  Search, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  Sparkles, 
  Key, 
  Printer, 
  MessageSquare, 
  Copy, 
  Check, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Star, 
  Users, 
  RotateCcw, 
  BedDouble, 
  ArrowRight, 
  CheckCircle, 
  Briefcase, 
  MessageCircle, 
  Utensils, 
  Bus, 
  Send, 
  FileText, 
  CheckCheck, 
  ChevronDown 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { INITIAL_HOTELS } from '../data/mockHotels';
import { buildWhatsAppLink } from '../utils/channels';

const BookingVoucherModal = React.lazy(() => 
  import('../components/BookingVoucherModal').then(m => ({ default: m.BookingVoucherModal }))
);

interface BookingPortalPageProps {
  hotels: Hotel[];
  siteSettings: SiteSettings;
  onNavigate: (page: ActivePage, hotelId?: string) => void;
  onSelectHotel: (hotelId: string) => void;
  initialHotelId?: string;
}

export const BookingPortalPage: React.FC<BookingPortalPageProps> = ({
  hotels,
  siteSettings,
  onNavigate,
  initialHotelId
}) => {
  const { isRtl } = useLanguage();
  const isCreationAllowed = siteSettings?.bookingModule?.allowPublicBookingCreation !== false;

  // Fallback to INITIAL_HOTELS ensures 0ms render without null state
  const availableHotels = useMemo(() => {
    return (hotels && hotels.length > 0) ? hotels : INITIAL_HOTELS;
  }, [hotels]);

  // Read URL search params
  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const prefillHotel = urlParams.get('hotel') || urlParams.get('hotelId') || initialHotelId;
  const prefillCheckIn = urlParams.get('checkIn') || urlParams.get('checkin') || undefined;
  const prefillCheckOut = urlParams.get('checkOut') || urlParams.get('checkout') || undefined;
  const prefillRooms = urlParams.get('rooms') ? parseInt(urlParams.get('rooms')!, 10) : 1;
  const prefillAdults = urlParams.get('adults') ? parseInt(urlParams.get('adults')!, 10) : 2;
  const prefillChildren = urlParams.get('children') ? parseInt(urlParams.get('children')!, 10) : 0;
  const prefillManageCode = urlParams.get('code') || '';
  const prefillTab = urlParams.get('tab');

  // Smart default dates (today + 1 to today + 4)
  const defaultCheckInDate = useMemo(() => {
    if (prefillCheckIn) return prefillCheckIn;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, [prefillCheckIn]);

  const defaultCheckOutDate = useMemo(() => {
    if (prefillCheckOut) return prefillCheckOut;
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  }, [prefillCheckOut]);

  // Search State: Dates, Hotel query, City, Stars, Rooms and Guests count
  const [searchCheckIn, setSearchCheckIn] = useState<string>(defaultCheckInDate);
  const [searchCheckOut, setSearchCheckOut] = useState<string>(defaultCheckOutDate);
  const [searchRoomsCount, setSearchRoomsCount] = useState<number>(prefillRooms || 1);
  const [searchAdultsCount, setSearchAdultsCount] = useState<number>(prefillAdults || 2);
  const [searchChildrenCount, setSearchChildrenCount] = useState<number>(prefillChildren || 0);
  const [isGuestPopoverOpen, setIsGuestPopoverOpen] = useState<boolean>(false);
  const [hotelSearchQuery, setHotelSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<'all' | 'مكة المكرمة' | 'المدينة المنورة'>('all');
  const [selectedStars, setSelectedStars] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'distance' | 'rating' | 'price_asc'>('recommended');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isUpdatingSearch, setIsUpdatingSearch] = useState(false);
  const [showQuoteSection, setShowQuoteSection] = useState<boolean>(false);

  // If a hotel was explicitly prefilled from URL, start directly in wizard. Otherwise start in grid.
  const [viewMode, setViewMode] = useState<'wizard' | 'grid'>(() => {
    return prefillHotel ? 'wizard' : 'grid';
  });

  // DB Data: Loaded asynchronously for availability & price checking
  const [allRooms, setAllRooms] = useState<RoomTypeItem[]>([]);
  const [allPricingPeriods, setAllPricingPeriods] = useState<HotelPricingPeriod[]>([]);

  useEffect(() => {
    getRoomsFromDb().then(rooms => {
      if (Array.isArray(rooms) && rooms.length > 0) setAllRooms(rooms);
    }).catch(() => {});

    getPricingPeriodsFromDb().then(periods => {
      if (Array.isArray(periods) && periods.length > 0) setAllPricingPeriods(periods);
    }).catch(() => {});
  }, []);

  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const guestPopoverRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
      if (guestPopoverRef.current && !guestPopoverRef.current.contains(e.target as Node)) {
        setIsGuestPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute stay nights
  const nightsCount = useMemo(() => {
    if (!searchCheckIn || !searchCheckOut) return 1;
    const inDate = new Date(searchCheckIn).getTime();
    const outDate = new Date(searchCheckOut).getTime();
    const diffDays = Math.round((outDate - inDate) / (1000 * 3600 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [searchCheckIn, searchCheckOut]);

  const totalGuests = searchAdultsCount + searchChildrenCount;

  // Active hotels
  const activeHotels = useMemo(() => {
    return availableHotels.filter(h => h.isActive !== false);
  }, [availableHotels]);

  // Default hotel selection
  const defaultHotel = useMemo(() => {
    if (!availableHotels || availableHotels.length === 0) return null;
    if (prefillHotel) {
      const match = availableHotels.find(h => 
        h.id === prefillHotel || 
        h.name.toLowerCase().includes(prefillHotel.toLowerCase()) ||
        h.nameEn?.toLowerCase().includes(prefillHotel.toLowerCase())
      );
      if (match) return match;
    }
    const online = availableHotels.find(h => h.onlineBookingEnabled !== false && h.isActive !== false);
    return online || availableHotels[0];
  }, [availableHotels, prefillHotel]);

  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(defaultHotel);

  useEffect(() => {
    if (defaultHotel && (!selectedHotel || selectedHotel.id !== defaultHotel.id)) {
      setSelectedHotel(defaultHotel);
    }
  }, [defaultHotel]);

  // Real-time letter matching filter
  const matchedHotels = useMemo(() => {
    return activeHotels.filter(h => {
      if (selectedCity !== 'all' && h.city !== selectedCity) return false;
      if (selectedStars !== 'all' && (h.stars ?? 5) !== selectedStars) return false;
      if (!hotelSearchQuery.trim()) return true;
      const q = hotelSearchQuery.trim().toLowerCase();
      const nameAr = h.name.toLowerCase();
      const nameEn = (h.nameEn || '').toLowerCase();
      const district = (h.district || '').toLowerCase();
      const city = h.city.toLowerCase();
      return nameAr.includes(q) || nameEn.includes(q) || district.includes(q) || city.includes(q);
    });
  }, [activeHotels, selectedCity, selectedStars, hotelSearchQuery]);

  // Helper to get minimum starting price for any hotel
  const getHotelStartingPrice = (hotelId: string, stars: number = 5): number => {
    const hotelRooms = allRooms.filter(r => r.hotelId === hotelId && r.isActive !== false);
    if (hotelRooms.length > 0) {
      const validPrices = hotelRooms.map(r => r.basePrice || 0).filter(p => p > 0);
      if (validPrices.length > 0) return Math.min(...validPrices);
    }
    return stars === 5 ? 550 : stars === 4 ? 420 : 320;
  };

  // =========================================================================
  // ADMIN AVAILABILITY & PERIOD ENGINE: STRICT CHECKING PER HOTEL, DATES & CAPACITY
  // =========================================================================
  const getHotelAvailabilityStatus = (
    h: Hotel, 
    checkIn: string, 
    checkOut: string, 
    roomsReq: number = 1
  ): { 
    isAvailableOnline: boolean; 
    reason?: string; 
    matchingPeriod?: HotelPricingPeriod;
    allActivePeriods: HotelPricingPeriod[];
  } => {
    // Gather periods assigned to this hotel or global
    const periods = (
      allPricingPeriods.length > 0 ? allPricingPeriods : (h.pricingPeriods || [])
    ).filter(p => (p.hotelId === h.id || p.hotelId === 'all') && p.isActive !== false);

    // Rule 1: Admin enabled online booking?
    if (h.isActive === false) {
      return { isAvailableOnline: false, reason: 'الفندق غير نشط حالياً', allActivePeriods: periods };
    }
    if (h.onlineBookingEnabled === false || h.onlineAvailabilityMode === 'disabled') {
      return { 
        isAvailableOnline: false, 
        reason: 'الحجز أونلاين غير مفعّل لهذا الفندق من الإدارة (يتطلب طلب تسعير وتنسيق مخصص)',
        allActivePeriods: periods 
      };
    }

    // Rule 2: Active rooms check
    const hotelRooms = allRooms.filter(r => r.hotelId === h.id && r.isActive !== false);
    if (allRooms.length > 0 && hotelRooms.length === 0) {
      return { isAvailableOnline: false, reason: 'لا توجد غرف نشطة لهذا الفندق في النظام حالياً', allActivePeriods: periods };
    }

    // Rule 3: Blackout / Closed period check
    const blackoutPeriod = periods.find(p => 
      p.isAvailable === false && !(p.endDate < checkIn || p.startDate > checkOut)
    );
    if (blackoutPeriod) {
      return { 
        isAvailableOnline: false, 
        reason: `الفندق مغلق للحجوزات الإلكترونية خلال فترة: ${blackoutPeriod.name}`,
        allActivePeriods: periods 
      };
    }

    // Rule 4: Period matching
    const matchingPeriod = periods.find(p => 
      p.isAvailable !== false && p.startDate <= checkIn && p.endDate >= checkOut
    );

    // If onlineAvailabilityMode is 'periods_only': MUST be within an active period!
    if (h.onlineAvailabilityMode === 'periods_only') {
      if (!matchingPeriod) {
        return { 
          isAvailableOnline: false, 
          reason: 'الفندق متاح للحجز أونلاين في فترات ومواسم محددة فقط، والتواريخ المطلوبة تقع خارج هذه الفترات',
          allActivePeriods: periods 
        };
      }
      if (matchingPeriod.minStayNights && nightsCount < matchingPeriod.minStayNights) {
        return { 
          isAvailableOnline: false, 
          reason: `الحد الأدنى للإقامة في ${matchingPeriod.name} هو ${matchingPeriod.minStayNights} ليالٍ`,
          matchingPeriod,
          allActivePeriods: periods 
        };
      }
      if (typeof matchingPeriod.availableRooms === 'number' && matchingPeriod.availableRooms < roomsReq) {
        return { 
          isAvailableOnline: false, 
          reason: `المخزون المتاح في فترة ${matchingPeriod.name} (${matchingPeriod.availableRooms} غرف) أقل من المطلوب`,
          matchingPeriod,
          allActivePeriods: periods 
        };
      }
      return { isAvailableOnline: true, matchingPeriod, allActivePeriods: periods };
    }

    // If hotel has periods defined but not in 'periods_only':
    if (periods.length > 0) {
      if (matchingPeriod) {
        if (matchingPeriod.minStayNights && nightsCount < matchingPeriod.minStayNights) {
          return { 
            isAvailableOnline: false, 
            reason: `الحد الأدنى للإقامة هو ${matchingPeriod.minStayNights} ليالٍ`,
            matchingPeriod,
            allActivePeriods: periods 
          };
        }
        if (typeof matchingPeriod.availableRooms === 'number' && matchingPeriod.availableRooms < roomsReq) {
          return { 
            isAvailableOnline: false, 
            reason: `الغرف المتاحة في هذه الفترة أقل من المطلوب`,
            matchingPeriod,
            allActivePeriods: periods 
          };
        }
        return { isAvailableOnline: true, matchingPeriod, allActivePeriods: periods };
      }
      // If periods exist but none covers the selected dates:
      return { 
        isAvailableOnline: false, 
        reason: 'التواريخ المختارة تقع خارج الفترات المعتمدة للحجز المباشر من الإدارة',
        allActivePeriods: periods 
      };
    }

    // Default open
    return { isAvailableOnline: true, allActivePeriods: periods };
  };

  // 1. HOTELS STRICTLY AVAILABLE FOR DIRECT ONLINE BOOKING IN SELECTED PERIOD
  const onlineBookableHotels = useMemo(() => {
    return matchedHotels.filter(h => {
      const status = getHotelAvailabilityStatus(h, searchCheckIn, searchCheckOut, searchRoomsCount);
      return status.isAvailableOnline;
    });
  }, [matchedHotels, searchCheckIn, searchCheckOut, searchRoomsCount, allPricingPeriods, allRooms]);

  // 2. OTHER HOTELS: NOT AVAILABLE ONLINE IN THIS PERIOD (REQUIRE CUSTOM QUOTE & WHATSAPP)
  const quoteOnlyHotels = useMemo(() => {
    return matchedHotels.filter(h => {
      const status = getHotelAvailabilityStatus(h, searchCheckIn, searchCheckOut, searchRoomsCount);
      return !status.isAvailableOnline;
    });
  }, [matchedHotels, searchCheckIn, searchCheckOut, searchRoomsCount, allPricingPeriods, allRooms]);

  // Sorted list of online bookable hotels
  const sortedOnlineHotels = useMemo(() => {
    const list = [...onlineBookableHotels];
    return list.sort((a, b) => {
      if (sortBy === 'distance') return (a.distanceToHaram || 9999) - (b.distanceToHaram || 9999);
      if (sortBy === 'rating') return (b.rating || 4.5) - (a.rating || 4.5);
      if (sortBy === 'price_asc') {
        const priceA = getHotelStartingPrice(a.id, a.stars);
        const priceB = getHotelStartingPrice(b.id, b.stars);
        return priceA - priceB;
      }
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : 999;
      const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [onlineBookableHotels, sortBy, allRooms]);

  // All active admin periods across available hotels for quick switching
  const allActiveAdminPeriods = useMemo(() => {
    const seen = new Set<string>();
    const list: HotelPricingPeriod[] = [];
    const pool = allPricingPeriods.length > 0 ? allPricingPeriods : availableHotels.flatMap(h => h.pricingPeriods || []);
    for (const p of pool) {
      if (p.isActive !== false && p.isAvailable !== false && !seen.has(p.name + p.startDate)) {
        seen.add(p.name + p.startDate);
        list.push(p);
      }
    }
    return list.slice(0, 5);
  }, [allPricingPeriods, availableHotels]);

  // 3 Primary Tabs
  const [activeTab, setActiveTab] = useState<'book-individual' | 'book-corporate' | 'manage'>(() => {
    if (prefillManageCode) return 'manage';
    if (prefillTab === 'corporate') return 'book-corporate';
    return isCreationAllowed ? 'book-individual' : 'manage';
  });

  // Corporate Sub-tab mode
  const [corporateSubMode, setCorporateSubMode] = useState<'rfp' | 'online'>('rfp');

  // Corporate RFP Form State
  const [corpCompanyName, setCorpCompanyName] = useState('');
  const [corpAddress, setCorpAddress] = useState('');
  const [corpNationality, setCorpNationality] = useState('المملكة العربية السعودية');
  const [corpCoordinator, setCorpCoordinator] = useState('');
  const [corpPhone, setCorpPhone] = useState('');
  const [corpEmail, setCorpEmail] = useState('');
  const [corpHotelId, setCorpHotelId] = useState(defaultHotel?.id || '');
  const [corpCheckIn, setCorpCheckIn] = useState(defaultCheckInDate);
  const [corpCheckOut, setCorpCheckOut] = useState(defaultCheckOutDate);
  const [corpGuestsCount, setCorpGuestsCount] = useState<number>(45);
  const [corpDoubleRooms, setCorpDoubleRooms] = useState<number>(12);
  const [corpTripleRooms, setCorpTripleRooms] = useState<number>(6);
  const [corpQuadRooms, setCorpQuadRooms] = useState<number>(4);
  const [corpSuites, setCorpSuites] = useState<number>(2);
  const [corpSingleRooms, setCorpSingleRooms] = useState<number>(0);
  const [corpMealPlan, setCorpMealPlan] = useState<'room_only' | 'breakfast' | 'half_board' | 'full_board'>('breakfast');
  const [corpNeedBuses, setCorpNeedBuses] = useState(true);
  const [corpNeedAirportTransfer, setCorpNeedAirportTransfer] = useState(true);
  const [corpNotes, setCorpNotes] = useState('');
  const [corpSubmitting, setCorpSubmitting] = useState(false);
  const [corpSubmittedCode, setCorpSubmittedCode] = useState<string | null>(null);

  useEffect(() => {
    if (selectedHotel && !corpHotelId) setCorpHotelId(selectedHotel.id);
  }, [selectedHotel]);

  // Manage Booking Tab State
  const [manageQuery, setManageQuery] = useState(prefillManageCode);
  const [manageBooking, setManageBooking] = useState<RoomBooking | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageSearched, setManageSearched] = useState(false);
  const [copiedField, setCopiedField] = useState<'code' | 'key' | 'corp' | null>(null);
  const [manageVoucher, setManageVoucher] = useState<RoomBooking | null>(null);

  useEffect(() => {
    if (prefillManageCode) handleSearchBooking(prefillManageCode);
  }, [prefillManageCode]);

  const handleSearchBooking = async (queryToSearch?: string) => {
    const q = (queryToSearch || manageQuery).trim();
    if (!q) return;
    setManageLoading(true);
    setManageSearched(true);
    try {
      const result = await getBookingByCodeOrPhone(q);
      setManageBooking(result);
    } catch {
      setManageBooking(null);
    } finally {
      setManageLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: 'code' | 'key' | 'corp') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Period Switcher Quick Helpers
  const handleSelectQuickPeriod = (startDate: string, endDate: string) => {
    setSearchCheckIn(startDate);
    setSearchCheckOut(endDate);
  };

  const handleQuickWeekend = () => {
    const d = new Date();
    const day = d.getDay();
    const diffToThursday = (4 - day + 7) % 7 || 7;
    const thurs = new Date(d);
    thurs.setDate(d.getDate() + diffToThursday);
    const sat = new Date(thurs);
    sat.setDate(thurs.getDate() + 2);
    setSearchCheckIn(thurs.toISOString().split('T')[0]);
    setSearchCheckOut(sat.toISOString().split('T')[0]);
  };

  const handleQuickNextWeek = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const outD = new Date(d);
    outD.setDate(d.getDate() + 3);
    setSearchCheckIn(d.toISOString().split('T')[0]);
    setSearchCheckOut(outD.toISOString().split('T')[0]);
  };

  // WhatsApp Quote Builder for hotels requiring custom quotation or off-period
  const buildQuoteWhatsAppLink = (h: Hotel, reason?: string) => {
    const rawPhone = (
      (h.showHotelWhatsApp !== false && h.hotelWhatsApp?.trim()) ||
      siteSettings?.bookingModule?.bookingWhatsApp ||
      siteSettings?.channels?.find(c => c.type === 'whatsapp')?.value ||
      '+966544076726'
    );
    const msg = `السلام عليكم ورحمة الله،\n` +
      `أود الاستفسار وطلب *تسعير خاص وإتاحة فندقية* في:\n` +
      `🏨 *${h.name}* (${h.city} - حي ${h.district || 'المنطقة المركزية'})\n` +
      `📅 فترة الإقامة المطلوبة: من ${searchCheckIn} إلى ${searchCheckOut} (${nightsCount} ليالٍ)\n` +
      `🛏️ عدد الغرف المطلوبة: ${searchRoomsCount} غرفة\n` +
      `👥 إجمالي عدد النزلاء: ${totalGuests} شخص (${searchAdultsCount} بالغين${searchChildrenCount > 0 ? ` + ${searchChildrenCount} أطفال` : ''})\n` +
      (reason ? `📌 ملاحظة الإتاحة: ${reason}\n` : '') +
      `عبر منظومة برستيج المعتمدة. يرجى تزويدي بأفضل تسعير رسمي وإمكانية التسكين.`;
    return buildWhatsAppLink(rawPhone, msg);
  };

  // Format date to friendly Arabic
  const formatArabicDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Trigger search update
  const handleTriggerSearch = () => {
    setIsUpdatingSearch(true);
    setIsSearchDropdownOpen(false);
    setTimeout(() => {
      setIsUpdatingSearch(false);
      if (onlineBookableHotels.length > 0) {
        const stillSelected = onlineBookableHotels.find(h => h.id === selectedHotel?.id);
        if (!stillSelected) {
          setSelectedHotel(onlineBookableHotels[0]);
        }
      }
    }, 300);
  };

  // Handle Corporate RFP Submission
  const handleCorporateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!corpCompanyName.trim() || !corpPhone.trim()) {
      alert('يرجى ملء اسم الشركة ورقم الهاتف للتواصل.');
      return;
    }

    setCorpSubmitting(true);
    const code = 'B2B-PRS-' + Math.floor(10000 + Math.random() * 90000);
    const targetHotel = availableHotels.find(h => h.id === corpHotelId) || selectedHotel || availableHotels[0];

    const messageBody = `
=== طلب حجز وتعاقد شركات وبعثات (B2B Request) ===
كود الطلب المرجعي: ${code}
اسم الشركة / المؤسسة: ${corpCompanyName}
المقر والعنوان: ${corpAddress || 'غير محدد'}
جنسية الوفد / الدولة: ${corpNationality || 'السعودية'}
منسق الحجز: ${corpCoordinator || 'المسؤول المعتمد'}
رقم الجوال والواتساب: ${corpPhone}
البريد الإلكتروني: ${corpEmail || 'لم يسجل'}
الفندق المطلوب: ${targetHotel.name} (${targetHotel.city})
فترة الإقامة: من ${corpCheckIn} إلى ${corpCheckOut}
إجمالي عدد النزلاء: ${corpGuestsCount} شخص
توزيع الغرف المطلوبة:
- غرف ثنائية: ${corpDoubleRooms} غرفة
- غرف ثلاثية: ${corpTripleRooms} غرفة
- غرف رباعية: ${corpQuadRooms} غرفة
- أجنحة فاخرة: ${corpSuites} جناح
- غرف مفردة: ${corpSingleRooms} غرفة
نوع الإعاشة والوجبات: ${
  corpMealPlan === 'breakfast' ? 'إفطار بوفيه مفتوح' :
  corpMealPlan === 'half_board' ? 'نصف إقامة (إفطار + عشاء)' :
  corpMealPlan === 'full_board' ? 'إقامة كاملة (3 وجبات بوفيه)' :
  'إقامة فقط بدون وجبات'
}
طلب باصات ونقل: ${corpNeedBuses ? 'نعم، مطلوب حافلات نقل خاصة' : 'لا'}
استقبال مطار: ${corpNeedAirportTransfer ? 'نعم، مطلوب استقبال وتوديع بالمطار' : 'لا'}
تفاصيل وملاحظات إضافية: ${corpNotes || 'لا توجد ملاحظات إضافية'}
`.trim();

    try {
      await sendContactMessage({
        name: corpCoordinator ? `${corpCompanyName} - ${corpCoordinator}` : corpCompanyName,
        phone: corpPhone,
        email: corpEmail || undefined,
        subject: `طلب تعاقد شركات B2B (${corpCompanyName}) - ${targetHotel.name}`,
        message: messageBody,
        city: targetHotel.city,
        hotelInterest: targetHotel.id,
        hotelName: targetHotel.name,
        preferredCity: targetHotel.city,
        guestCount: corpGuestsCount
      });
      setCorpSubmittedCode(code);
    } catch (err) {
      console.error('Failed submitting corporate request:', err);
      setCorpSubmittedCode(code);
    } finally {
      setCorpSubmitting(false);
    }
  };

  // Build Corporate WhatsApp Link
  const buildCorporateWhatsAppUrl = () => {
    const rawPhone = (
      siteSettings?.bookingModule?.bookingWhatsApp ||
      siteSettings?.channels?.find(c => c.type === 'whatsapp')?.value ||
      '+966544076726'
    );
    const targetHotel = availableHotels.find(h => h.id === corpHotelId) || selectedHotel || availableHotels[0];
    const nights = Math.max(1, Math.round((new Date(corpCheckOut).getTime() - new Date(corpCheckIn).getTime()) / (1000 * 3600 * 24)));

    const msg = `🏢 *طلب حجز وتعاقد شركات ووفود (B2B Request)*\n` +
      `🔖 *كود الطلب المرجعي:* ${corpSubmittedCode || 'طلب جديد'}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏛️ *الشركة / الجهة:* ${corpCompanyName}\n` +
      `📍 *المقر والعنوان:* ${corpAddress || 'غير محدد'}\n` +
      `🌍 *جنسية الوفد / الدولة:* ${corpNationality}\n` +
      `👤 *منسق الحجز:* ${corpCoordinator}\n` +
      `📞 *رقم الجوال:* ${corpPhone}\n` +
      (corpEmail ? `✉️ *البريد الإلكتروني:* ${corpEmail}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏨 *الفندق المطلوب:* ${targetHotel.name} (${targetHotel.city})\n` +
      `📅 *تاريخ الدخول:* ${corpCheckIn}\n` +
      `📅 *تاريخ الخروج:* ${corpCheckOut} (${nights} ليالٍ)\n` +
      `👥 *إجمالي عدد النزلاء:* ${corpGuestsCount} شخص\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛏️ *توزيع وأنواع الغرف:*\n` +
      (corpDoubleRooms > 0 ? `• غرف ثنائية: ${corpDoubleRooms} غرفة\n` : '') +
      (corpTripleRooms > 0 ? `• غرف ثلاثية: ${corpTripleRooms} غرفة\n` : '') +
      (corpQuadRooms > 0 ? `• غرف رباعية: ${corpQuadRooms} غرفة\n` : '') +
      (corpSuites > 0 ? `• أجنحة فاخرة: ${corpSuites} جناح\n` : '') +
      (corpSingleRooms > 0 ? `• غرف مفردة: ${corpSingleRooms} غرفة\n` : '') +
      `🍽️ *نوع الوجبات:* ${
        corpMealPlan === 'breakfast' ? 'إفطار بوفيه مفتوح' :
        corpMealPlan === 'half_board' ? 'نصف إقامة (إفطار + عشاء)' :
        corpMealPlan === 'full_board' ? 'إقامة كاملة (3 وجبات)' :
        'إقامة فقط بدون وجبات'
      }\n` +
      (corpNeedBuses ? `🚌 *طلب توفير باصات نقل خاصة*\n` : '') +
      (corpNeedAirportTransfer ? `✈️ *طلب استقبال وتوديع بالمطار*\n` : '') +
      (corpNotes ? `📝 *ملاحظات التوزيع:* ${corpNotes}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `نرجو موافاتنا بأفضل تسعير رسمي وإمكانية الإتاحة فوراً.`;

    return buildWhatsAppLink(rawPhone, msg);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-stone-900 font-cairo pt-24 pb-16" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Hero Section */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A24B]/15 text-[#8C6D23] text-xs font-bold border border-[#C9A24B]/30 backdrop-blur-md shadow-2xs">
          <Sparkles className="w-4 h-4 text-[#B38A34]" />
          <span>منظومة الحجوزات الفندقية الذكية والمباشرة</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight">
          {activeTab === 'book-individual'
            ? 'احجز إقامتك الفاخرة بجوار الحرمين الشريفين'
            : activeTab === 'book-corporate'
            ? 'حجوزات الشركات والبعثات والحملات الكبرى (B2B)'
            : 'إدارة ومتابعة الحجز الفندقي والمفتاح الرقمي'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-3xl mx-auto leading-relaxed">
          {activeTab === 'book-individual'
            ? 'استعرض الفنادق المتاحة للحجز الفوري وفق إتاحة الإدارة المعتمدة، حدد التواريخ وعدد الغرف، واحجز إقامتك مباشرة بأفضل سعر معتمد بدون أي وسيط.'
            : activeTab === 'book-corporate'
            ? 'منظومة حصرية متكاملة لخدمة الشركات ووكالات السفر والحملات: فحص إتاحة فوري أونلاين أو تقديم طلب تسكين وتعاقد مخصص مع متابعة واتساب فورية.'
            : 'استعلم برقم الحجز أو رقم الجوال للاطلاع على تفاصيل إقامتك، كود التسكين الذكي، وتحميل سند الحجز الرسمي.'}
        </p>

        {/* 3 PRIMARY SEPARATED TABS */}
        <div className="pt-2 flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-stone-200 shadow-xs gap-1.5 sm:gap-2 flex-wrap justify-center">
            {isCreationAllowed && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('book-individual')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'book-individual'
                      ? 'bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>حجز فردي وعائلي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('book-corporate')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'book-corporate'
                      ? 'bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-[#DFBE72] border border-[#C9A24B]/50 shadow-md'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-[#C9A24B]" />
                  <span>حجز شركات ووفود (B2B)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C9A24B]/20 text-[#DFBE72] font-bold hidden md:inline">
                    عقود خاصة
                  </span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'manage'
                  ? 'bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#F4B400]" />
              <span>إدارة / متابعة حجز</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* TAB 1: INDIVIDUAL BOOKINGS (STRICT AVAILABILITY BASED ON ADMIN SETTINGS)    */}
        {/* ========================================================================= */}
        {activeTab === 'book-individual' && (
          <div className="space-y-6 animate-fadeIn">
            {/* ── LUXURY SEARCH BAR (Connected to Hotel, Period & Guest Count) ── */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-[#C9A24B]/30 shadow-lg relative z-20">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-extrabold text-stone-900 font-cairo">
                      ابحث وحدد الفترة وعدد الغرف
                    </span>
                    <span className="text-[11px] text-stone-500 font-normal">
                      يعرض فقط الفنادق المتاحة للحجز الفوري وفق فترات الإتاحة المعتمدة من الإدارة
                    </span>
                  </div>
                </div>

                {/* City Destination Quick Filters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all' as const, label: 'جميع الفنادق' },
                    { id: 'مكة المكرمة' as const, label: '🕋 مكة المكرمة' },
                    { id: 'المدينة المنورة' as const, label: '🕌 المدينة المنورة' }
                  ].map(cityOption => (
                    <button
                      key={cityOption.id}
                      type="button"
                      onClick={() => setSelectedCity(cityOption.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedCity === cityOption.id
                          ? 'bg-[#C9A24B] text-white shadow-2xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {cityOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Fields Grid: Check-in, Check-out, Rooms & Guests, Hotel Name */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-4">
                {/* 1. Check-In Date */}
                <div className="md:col-span-3 bg-stone-50/90 hover:bg-stone-50 p-3 rounded-2xl border border-stone-200 transition-colors">
                  <label className="text-[11px] font-bold text-stone-600 block mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#B38A34]" />
                      <span>تاريخ الوصول (الدخول)</span>
                    </span>
                    <span className="text-[10px] text-[#B38A34] font-medium">
                      {formatArabicDate(searchCheckIn)}
                    </span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={searchCheckIn}
                    onChange={(e) => {
                      const newIn = e.target.value;
                      setSearchCheckIn(newIn);
                      if (newIn >= searchCheckOut) {
                        const nextD = new Date(newIn);
                        nextD.setDate(nextD.getDate() + 2);
                        setSearchCheckOut(nextD.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  />
                </div>

                {/* 2. Check-Out Date */}
                <div className="md:col-span-3 bg-stone-50/90 hover:bg-stone-50 p-3 rounded-2xl border border-stone-200 transition-colors">
                  <label className="text-[11px] font-bold text-stone-600 block mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#B38A34]" />
                      <span>تاريخ المغادرة (الخروج)</span>
                    </span>
                    <span className="text-[10px] text-[#B38A34] font-medium">
                      {nightsCount} {nightsCount === 1 ? 'ليلة' : nightsCount === 2 ? 'ليلتين' : 'ليالٍ'}
                    </span>
                  </label>
                  <input
                    type="date"
                    min={searchCheckIn || new Date().toISOString().split('T')[0]}
                    value={searchCheckOut}
                    onChange={(e) => setSearchCheckOut(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  />
                </div>

                {/* 3. Rooms & Guests Picker */}
                <div className="md:col-span-2 relative" ref={guestPopoverRef}>
                  <div className="bg-stone-50/90 hover:bg-stone-50 p-3 rounded-2xl border border-stone-200 h-full flex flex-col justify-between">
                    <label className="text-[11px] font-bold text-stone-600 block mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#B38A34]" />
                      <span>الغرف والنزلاء</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsGuestPopoverOpen(!isGuestPopoverOpen)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 flex items-center justify-between cursor-pointer text-right"
                    >
                      <span className="truncate">
                        {searchRoomsCount} {searchRoomsCount === 1 ? 'غرفة' : 'غرف'} • {totalGuests} نزلاء
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    </button>
                  </div>

                  {/* Popover */}
                  {isGuestPopoverOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-50 space-y-3 animate-fadeIn w-64">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-700">عدد الغرف:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSearchRoomsCount(Math.max(1, searchRoomsCount - 1))}
                            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-800"
                          >
                            -
                          </button>
                          <span className="font-bold text-stone-900 w-4 text-center">{searchRoomsCount}</span>
                          <button
                            type="button"
                            onClick={() => setSearchRoomsCount(Math.min(10, searchRoomsCount + 1))}
                            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-800"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-700">البالغين:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSearchAdultsCount(Math.max(1, searchAdultsCount - 1))}
                            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-800"
                          >
                            -
                          </button>
                          <span className="font-bold text-stone-900 w-4 text-center">{searchAdultsCount}</span>
                          <button
                            type="button"
                            onClick={() => setSearchAdultsCount(Math.min(20, searchAdultsCount + 1))}
                            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-800"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-700">الأطفال:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSearchChildrenCount(Math.max(0, searchChildrenCount - 1))}
                            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-800"
                          >
                            -
                          </button>
                          <span className="font-bold text-stone-900 w-4 text-center">{searchChildrenCount}</span>
                          <button
                            type="button"
                            onClick={() => setSearchChildrenCount(Math.min(10, searchChildrenCount + 1))}
                            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-800"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsGuestPopoverOpen(false)}
                        className="w-full py-1.5 rounded-xl bg-stone-900 text-[#DFBE72] font-bold text-xs"
                      >
                        تم الاختيار ✓
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Hotel Search Input */}
                <div className="md:col-span-2 relative" ref={searchDropdownRef}>
                  <div className="bg-stone-50/90 hover:bg-stone-50 p-3 rounded-2xl border border-stone-200 h-full flex flex-col justify-between">
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      اسم الفندق أو الحي
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        value={hotelSearchQuery}
                        onFocus={() => setIsSearchDropdownOpen(true)}
                        onChange={(e) => {
                          setHotelSearchQuery(e.target.value);
                          setIsSearchDropdownOpen(true);
                        }}
                        placeholder="أجياد، المركزية..."
                        className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-2 pl-6 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                      />
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {isSearchDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-200 p-2 z-50 max-h-72 overflow-y-auto animate-fadeIn">
                      {matchedHotels.map(h => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            setSelectedHotel(h);
                            setHotelSearchQuery(h.name);
                            setIsSearchDropdownOpen(false);
                          }}
                          className="w-full p-2 rounded-xl text-right flex items-center justify-between text-xs hover:bg-stone-50 cursor-pointer"
                        >
                          <span className="font-bold truncate">{h.name}</span>
                          <span className="text-[10px] text-stone-500">{h.city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Search Button */}
                <div className="md:col-span-2 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={handleTriggerSearch}
                    disabled={isUpdatingSearch}
                    className="w-full h-full min-h-[52px] px-4 rounded-2xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#9E782B] hover:to-[#B38A34] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#C9A24B]/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-75"
                  >
                    {isUpdatingSearch ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>بحث وتحديث</span>
                  </button>
                </div>
              </div>

              {/* Quick Period Shortcuts Bar */}
              <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-extrabold text-stone-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#B38A34]" />
                    <span>فترات ومواسم معتمدة من الإدارة:</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleQuickWeekend}
                    className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-[#C9A24B]/15 hover:text-[#8C6D23] text-stone-700 text-[11px] font-bold transition-colors cursor-pointer border border-stone-200"
                  >
                    عطلة نهاية الأسبوع ⚡
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickNextWeek}
                    className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-[#C9A24B]/15 hover:text-[#8C6D23] text-stone-700 text-[11px] font-bold transition-colors cursor-pointer border border-stone-200"
                  >
                    الأسبوع القادم ⚡
                  </button>

                  {/* Admin configured active pricing periods */}
                  {allActiveAdminPeriods.map(p => {
                    const isSelected = searchCheckIn === p.startDate && searchCheckOut === p.endDate;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectQuickPeriod(p.startDate, p.endDate)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#C9A24B] text-white border-[#C9A24B] shadow-2xs'
                            : 'bg-white hover:bg-amber-50 text-stone-700 border-amber-300'
                        }`}
                        title={`من ${p.startDate} إلى ${p.endDate}`}
                      >
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>

                <span className="text-[11px] text-stone-500 font-medium">
                  ✓ الأسعار معتمدة ومباشرة من الإدارة
                </span>
              </div>
            </div>

            {/* ── VIEW MODE 1: GRID OF AVAILABLE HOTELS ── */}
            {viewMode === 'grid' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Available Online Count Bar */}
                <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs sm:text-sm font-bold text-stone-800">
                      الفنادق المتاحة للحجز الإلكتروني الفوري للفترة المختارة: 
                      <strong className="text-emerald-700 font-extrabold mr-1"> ({sortedOnlineHotels.length} فندقاً)</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-500">ترتيب:</span>
                    {[
                      { id: 'recommended' as const, label: 'الموصى به' },
                      { id: 'distance' as const, label: 'الأقرب للحرم' },
                      { id: 'price_asc' as const, label: 'الأقل سعراً' }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSortBy(s.id)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          sortBy === s.id ? 'bg-stone-900 text-[#DFBE72]' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ZERO AVAILABLE HOTELS ALERT */}
                {sortedOnlineHotels.length === 0 && (
                  <div className="bg-amber-50/80 rounded-3xl border border-amber-300/80 p-6 sm:p-8 text-center space-y-4 shadow-sm animate-fadeIn">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-[#8C6D23] flex items-center justify-center mx-auto">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-stone-900 font-cairo">
                        لا تتوفر فنادق متاحة للحجز الإلكتروني الفوري في هذه الفترة المحددة
                      </h3>
                      <p className="text-xs text-stone-600 max-w-xl mx-auto mt-1 leading-relaxed">
                        الفترة المختارة (من {searchCheckIn} إلى {searchCheckOut}) تقع خارج فترات الإتاحة المباشرة المعتمدة من الإدارة حالياً، أو تم حجز كامل المخزون المخصص لها.
                      </p>
                    </div>

                    {/* Quick Options */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      {allActiveAdminPeriods.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                          <span className="text-xs font-bold text-stone-700">اختر فترة متاحة معتمدة:</span>
                          {allActiveAdminPeriods.slice(0, 3).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectQuickPeriod(p.startDate, p.endDate)}
                              className="px-3 py-1.5 rounded-xl bg-white border border-[#C9A24B] text-[#8C6D23] text-xs font-bold hover:bg-[#C9A24B] hover:text-white transition-colors cursor-pointer shadow-2xs"
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* LIST OF INSTANT ONLINE BOOKING HOTELS (Booking.com style) */}
                <div className="space-y-5">
                  {sortedOnlineHotels.map((h) => {
                    const minPrice = getHotelStartingPrice(h.id, h.stars);
                    const totalPrice = minPrice * nightsCount * searchRoomsCount;
                    const score = ((h.rating || 4.8) * 2).toFixed(1);
                    const reviewScoreNum = parseFloat(score);
                    const ratingWord = reviewScoreNum >= 9.2 ? 'استثنائي' : reviewScoreNum >= 8.5 ? 'رائع جداً' : 'جيد جداً';
                    const activePeriod = h.pricingPeriods?.find(p => p.isActive !== false);

                    return (
                      <div
                        key={h.id}
                        className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col md:flex-row group hover:border-[#C9A24B]/40"
                      >
                        {/* 1. Photo Column */}
                        <div className="relative md:w-72 lg:w-80 shrink-0 aspect-video md:aspect-auto overflow-hidden bg-stone-100">
                          <img
                            src={h.mainImage}
                            alt={h.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-wrap z-10">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-black/75 backdrop-blur-md text-white border border-white/20">
                              {h.city === 'مكة المكرمة' ? '🕋 مكة' : '🕌 المدينة'}
                            </span>
                            {h.featured && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#C9A24B] text-white shadow-xs">
                                موصى به ★
                              </span>
                            )}
                          </div>

                          <div className="absolute bottom-3 right-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px] font-bold flex items-center justify-between border border-white/15">
                            <span className="truncate">{h.distanceText || `${h.distanceToHaram}م من ساحة الحرم`}</span>
                            <span className="text-amber-400 shrink-0">
                              {h.walkingTimeMinutes ? `${h.walkingTimeMinutes} دقائق سيراً` : 'موقع متميز'}
                            </span>
                          </div>
                        </div>

                        {/* 2. Middle Column: Info & Features */}
                        <div className="flex-1 p-5 space-y-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <h3 className="font-extrabold text-lg sm:text-xl text-stone-900 group-hover:text-[#B38A34] transition-colors">
                                  {h.name}
                                </h3>
                                {h.nameEn && (
                                  <span className="text-xs text-stone-400 font-medium block">
                                    {h.nameEn}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 text-amber-400">
                                {Array.from({ length: h.stars ?? 5 }).map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                            </div>

                            <p className="text-xs text-stone-600 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#B38A34] shrink-0" />
                              <span>{h.city} • حي {h.district}</span>
                              <span className="text-stone-300">|</span>
                              <span className="text-[#8C6D23] font-bold">{h.location?.viewType || 'إطلالة مباركة'}</span>
                            </p>

                            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                              {h.overview || h.detailedDescription}
                            </p>

                            {/* Booking Highlights Chips */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200/70 flex items-center gap-1">
                                <Utensils className="w-3 h-3 text-[#B38A34]" />
                                <span>إفطار بوفيه متوفر</span>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-stone-100 text-stone-700 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-[#C9A24B]" />
                                <span>واي فاي فائق مجاناً</span>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70 flex items-center gap-1">
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                <span>حجز فوري معتمد من الإدارة</span>
                              </span>
                            </div>
                          </div>

                          {/* Admin Period Badge */}
                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs flex-wrap gap-2">
                            {activePeriod ? (
                              <span className="text-[11px] text-amber-900 font-bold bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/80 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#B38A34]" />
                                <span>فترة الإتاحة النشطة: {activePeriod.name}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-stone-500 font-medium">
                                متاح للحجز طوال الموسم المعتمد
                              </span>
                            )}

                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>متاح للحجز الفوري أونلاين ✓</span>
                            </span>
                          </div>
                        </div>

                        {/* 3. Action Box */}
                        <div className="md:w-64 lg:w-72 shrink-0 p-5 bg-stone-50/80 md:border-r border-t md:border-t-0 border-stone-100 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <div className="text-right">
                              <span className="text-xs font-extrabold text-stone-900 block leading-tight">
                                {ratingWord}
                              </span>
                              <span className="text-[10px] text-stone-500">
                                {(h.reviewCount || 840).toLocaleString()} تقييم نزيل
                              </span>
                            </div>

                            <div className="w-10 h-10 rounded-xl bg-[#132A46] text-[#DFBE72] font-black text-sm flex items-center justify-center font-mono shadow-xs border border-[#C9A24B]/30">
                              {score}
                            </div>
                          </div>

                          <div className="py-3 text-left">
                            <span className="text-[11px] text-stone-500 block">
                              الإقامة لـ {nightsCount} {nightsCount === 1 ? 'ليلة' : 'ليالٍ'} ({searchRoomsCount} {searchRoomsCount === 1 ? 'غرفة' : 'غرف'}):
                            </span>
                            <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
                              <strong className="text-xl sm:text-2xl font-black text-[#8C6D23] font-mono">
                                {totalPrice.toLocaleString()}
                              </strong>
                              <span className="text-xs font-bold text-stone-700">ر.س</span>
                            </div>
                            <span className="text-[10px] text-stone-500 block text-left">
                              (من {minPrice.toLocaleString()} ر.س / ليلة) • شامل الضريبة
                            </span>
                          </div>

                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedHotel(h);
                                setViewMode('wizard');
                                window.scrollTo({ top: 120, behavior: 'smooth' });
                              }}
                              className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#9E782B] hover:to-[#B38A34] text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                            >
                              <span>اختر الغرف واحجز الآن ⚡</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>

                            <a
                              href={buildQuoteWhatsAppLink(h)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>استفسار وحجز عبر الواتساب</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── SECTION: HOTELS REQUIRING CUSTOM QUOTE / NOT IN THIS PERIOD ── */}
                {quoteOnlyHotels.length > 0 && (
                  <div className="pt-8 border-t border-stone-200/90 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-stone-900 font-cairo flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-[#B38A34]" />
                          <span>فنادق تتطلب طلب تسعير وتنسيق مخصص (عبر الواتساب)</span>
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          هذه الفنادق غير متاحة للحجز الفوري في الفترة المختارة أو تتطلب تسعيراً خاصاً من الإدارة
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowQuoteSection(!showQuoteSection)}
                        className="text-xs text-[#8C6D23] font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>{showQuoteSection ? 'إخفاء هذه الفنادق ▲' : `عرض الفنادق (${quoteOnlyHotels.length}) ▼`}</span>
                      </button>
                    </div>

                    {(showQuoteSection || sortedOnlineHotels.length === 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
                        {quoteOnlyHotels.map(h => {
                          const status = getHotelAvailabilityStatus(h, searchCheckIn, searchCheckOut, searchRoomsCount);
                          return (
                            <div
                              key={`quote-${h.id}`}
                              className="bg-white rounded-3xl border border-stone-200 p-4 flex flex-col justify-between shadow-2xs space-y-3"
                            >
                              <div className="space-y-2">
                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-100">
                                  <img src={h.mainImage} alt={h.name} className="w-full h-full object-cover" />
                                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white">
                                    {h.city}
                                  </div>
                                </div>

                                <h4 className="font-bold text-sm text-stone-900 truncate">{h.name}</h4>
                                <p className="text-xs text-stone-500 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-[#B38A34]" />
                                  <span>{h.distanceText || `حي ${h.district}`}</span>
                                </p>

                                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 space-y-1">
                                  <span className="font-bold text-amber-900 block">📌 سبب عدم الحجز الفوري:</span>
                                  <span className="block text-stone-500">{status.reason}</span>
                                </div>
                              </div>

                              <a
                                href={buildQuoteWhatsAppLink(h, status.reason)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer text-center"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>طلب تسعير وإرسال للواتساب 💬</span>
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── VIEW MODE 2: ACTIVE HOTEL WIZARD ── */}
            {viewMode === 'wizard' && (
              <div className="space-y-4">
                {selectedHotel && (
                  <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedHotel.mainImage}
                        alt={selectedHotel.name}
                        className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-stone-200 shadow-2xs"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-[#B38A34] font-extrabold">الفندق المختار لإتمام الحجز:</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            {selectedHotel.city}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-cairo font-black text-stone-900 mt-0.5">
                          {selectedHotel.name}
                        </h3>
                        <p className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                          <span>حي {selectedHotel.district}</span>
                          <span>•</span>
                          <span>الفترة: من <strong>{searchCheckIn}</strong> إلى <strong>{searchCheckOut}</strong> ({nightsCount} ليالٍ)</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-[#C9A24B]/15 hover:text-[#8C6D23] text-stone-700 text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-2 border border-stone-200"
                    >
                      <RotateCcw className="w-4 h-4 text-[#B38A34]" />
                      <span>← تغيير الفندق والعودة لكافة النتائج</span>
                    </button>
                  </div>
                )}

                {selectedHotel ? (
                  <BookingFlow
                    hotel={selectedHotel}
                    allHotels={activeHotels}
                    initialCheckIn={searchCheckIn}
                    initialCheckOut={searchCheckOut}
                    initialRooms={searchRoomsCount}
                    initialAdults={searchAdultsCount}
                    initialChildren={searchChildrenCount}
                    initialBookingType="individual"
                    siteSettings={siteSettings}
                    onNavigateHome={() => onNavigate('home')}
                    onSelectAnotherHotel={(hId) => {
                      if (hId) {
                        const h = activeHotels.find(x => x.id === hId);
                        if (h) setSelectedHotel(h);
                      }
                    }}
                    onOpenTrackModal={(code) => {
                      setActiveTab('manage');
                      if (code) {
                        setManageQuery(code);
                        handleSearchBooking(code);
                      }
                    }}
                  />
                ) : (
                  <div className="p-8 text-center bg-white rounded-3xl border border-stone-200">
                    <p className="text-sm font-bold text-stone-600">يرجى اختيار فندق من نتائج البحث للمتابعة.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CORPORATE BOOKINGS (B2B RFP SUITE & ONLINE AVAILABILITY)           */}
        {/* ========================================================================= */}
        {activeTab === 'book-corporate' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Corporate Sub-mode Switcher */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 border border-[#C9A24B]/40 shadow-md">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-900 text-[#DFBE72] flex items-center justify-center shrink-0 border border-[#C9A24B]/30">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-stone-900 font-cairo">
                      بوابة تعاقدات وحجوزات قطاع الشركات والحملات الكبرى
                    </h2>
                    <p className="text-xs text-stone-500">
                      اختر طريقة الحجز المناسبة لمؤسستك: تقديم طلب تسكين مخصص (RFP) أو فحص الإتاحة المباشرة أونلاين
                    </p>
                  </div>
                </div>

                <div className="inline-flex p-1 rounded-2xl bg-stone-100 border border-stone-200 gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCorporateSubMode('rfp')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      corporateSubMode === 'rfp'
                        ? 'bg-gradient-to-r from-stone-900 to-stone-800 text-[#DFBE72] shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>طلب تعاقد وتسكين مخصص (RFP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCorporateSubMode('online')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      corporateSubMode === 'online'
                        ? 'bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>فحص الإتاحة والحجز المباشر أونلاين</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SUB-MODE 1: DEDICATED CORPORATE RFP FORM */}
            {corporateSubMode === 'rfp' && (
              <div className="space-y-6">
                {corpSubmittedCode ? (
                  <div className="bg-white rounded-3xl border border-[#C9A24B]/40 p-6 sm:p-8 shadow-xl max-w-2xl mx-auto space-y-6 animate-fadeIn">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                        <CheckCheck className="w-8 h-8" />
                      </div>
                      <span className="text-xs font-black text-emerald-700 uppercase tracking-wider block">
                        تم استلام طلب التعاقد بنجاح
                      </span>
                      <h3 className="text-2xl font-black text-stone-900">
                        سند استلام طلب حجز الشركات والوفود
                      </h3>
                      <p className="text-xs text-stone-500 max-w-md mx-auto">
                        تم تسجيل طلب مؤسستكم في المنظومة الفندقية، وسيقوم استشاري التسكين المخصص بالرد عليكم خلال دقائق معدودة.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 text-white border border-[#C9A24B]/40 shadow-lg space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="text-xs text-stone-400">رقم الطلب المرجعي:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-lg font-mono text-[#DFBE72]">{corpSubmittedCode}</strong>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(corpSubmittedCode, 'corp')}
                            className="text-stone-400 hover:text-white cursor-pointer"
                            title="نسخ الكود"
                          >
                            {copiedField === 'corp' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-stone-400 block text-[11px]">اسم الشركة:</span>
                          <strong className="text-white">{corpCompanyName}</strong>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[11px]">عدد الأشخاص:</span>
                          <strong className="text-[#DFBE72]">{corpGuestsCount} شخص</strong>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[11px]">فترة الإقامة:</span>
                          <span className="text-stone-300">{corpCheckIn} ~ {corpCheckOut}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[11px]">نوع الإعاشة:</span>
                          <span className="text-stone-300">
                            {corpMealPlan === 'breakfast' ? 'إفطار بوفيه' : corpMealPlan === 'half_board' ? 'نصف إقامة' : corpMealPlan === 'full_board' ? 'إقامة كاملة' : 'بدون وجبات'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <a
                        href={buildCorporateWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>متابعة الطلب فوراً عبر واتساب المبيعات ⚡</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setCorpSubmittedCode(null);
                          setCorpCompanyName('');
                          setCorpPhone('');
                        }}
                        className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        تقديم طلب لشركة أو فندق آخر
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCorporateSubmit} className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="border-b border-stone-100 pb-4">
                      <h3 className="text-lg font-black text-stone-900 font-cairo">
                        نموذج طلب حجز وتعاقد الشركات والبعثات (B2B RFP)
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        يرجى تزويدنا ببيانات المؤسسة والوفد لتجهيز كوتة الغرف وأفضل عرض أسعار رسمي معتمد
                      </p>
                    </div>

                    {/* Section 1: Company & Coordinator */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-[#8C6D23] uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        <span>1. بيانات الشركة والمسؤول</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            اسم الشركة / المؤسسة / الحملة <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={corpCompanyName}
                            onChange={(e) => setCorpCompanyName(e.target.value)}
                            placeholder="مثال: شركة الهدى للسياحة والعمرة"
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            عنوان المقر والمدينة
                          </label>
                          <input
                            type="text"
                            value={corpAddress}
                            onChange={(e) => setCorpAddress(e.target.value)}
                            placeholder="الرياض أو القاهرة أو جاكرتا..."
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            جنسية الوفد / الدولة <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={corpNationality}
                            onChange={(e) => setCorpNationality(e.target.value)}
                            placeholder="مثال: وفد تركي / إندونيسي / مصري"
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            اسم منسق أو مسؤول الحجز
                          </label>
                          <input
                            type="text"
                            value={corpCoordinator}
                            onChange={(e) => setCorpCoordinator(e.target.value)}
                            placeholder="اسم منسق التسكين"
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            رقم الجوال والواتساب <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={corpPhone}
                            onChange={(e) => setCorpPhone(e.target.value)}
                            placeholder="0501234567 أو +966..."
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            البريد الإلكتروني للشركة
                          </label>
                          <input
                            type="email"
                            value={corpEmail}
                            onChange={(e) => setCorpEmail(e.target.value)}
                            placeholder="reservations@company.com"
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Hotel & Dates */}
                    <div className="space-y-4 pt-4 border-t border-stone-100">
                      <h4 className="text-xs font-black text-[#8C6D23] uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>2. الفندق وفترة الإقامة</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            الفندق المطلوب <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={corpHotelId}
                            onChange={(e) => setCorpHotelId(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                          >
                            {availableHotels.map(h => (
                              <option key={h.id} value={h.id}>
                                {h.name} ({h.city})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            تاريخ الوصول <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={corpCheckIn}
                            onChange={(e) => {
                              const newIn = e.target.value;
                              setCorpCheckIn(newIn);
                              if (newIn >= corpCheckOut) {
                                const nextD = new Date(newIn);
                                nextD.setDate(nextD.getDate() + 3);
                                setCorpCheckOut(nextD.toISOString().split('T')[0]);
                              }
                            }}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            تاريخ المغادرة <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            min={corpCheckIn}
                            value={corpCheckOut}
                            onChange={(e) => setCorpCheckOut(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Room Breakdown */}
                    <div className="space-y-4 pt-4 border-t border-stone-100">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-[#8C6D23] uppercase tracking-wider flex items-center gap-1.5">
                          <BedDouble className="w-4 h-4" />
                          <span>3. عدد النزلاء وتوزيع أنواع الغرف</span>
                        </h4>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-600">إجمالي النزلاء:</span>
                          <input
                            type="number"
                            min={1}
                            max={5000}
                            value={corpGuestsCount}
                            onChange={(e) => setCorpGuestsCount(parseInt(e.target.value, 10) || 1)}
                            className="w-20 bg-stone-50 border border-stone-300 rounded-xl px-2 py-1 text-xs font-bold text-center text-stone-900"
                          />
                          <span className="text-xs text-stone-500">شخص</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center space-y-1">
                          <span className="text-[11px] font-bold text-stone-600 block">ثنائية (Double)</span>
                          <input
                            type="number"
                            min={0}
                            value={corpDoubleRooms}
                            onChange={(e) => setCorpDoubleRooms(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-white border border-stone-300 rounded-xl p-1.5 text-xs font-black text-center text-stone-900"
                          />
                        </div>

                        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center space-y-1">
                          <span className="text-[11px] font-bold text-stone-600 block">ثلاثية (Triple)</span>
                          <input
                            type="number"
                            min={0}
                            value={corpTripleRooms}
                            onChange={(e) => setCorpTripleRooms(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-white border border-stone-300 rounded-xl p-1.5 text-xs font-black text-center text-stone-900"
                          />
                        </div>

                        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center space-y-1">
                          <span className="text-[11px] font-bold text-stone-600 block">رباعية (Quad)</span>
                          <input
                            type="number"
                            min={0}
                            value={corpQuadRooms}
                            onChange={(e) => setCorpQuadRooms(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-white border border-stone-300 rounded-xl p-1.5 text-xs font-black text-center text-stone-900"
                          />
                        </div>

                        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center space-y-1">
                          <span className="text-[11px] font-bold text-stone-600 block">أجنحة (Suites)</span>
                          <input
                            type="number"
                            min={0}
                            value={corpSuites}
                            onChange={(e) => setCorpSuites(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-white border border-stone-300 rounded-xl p-1.5 text-xs font-black text-center text-stone-900"
                          />
                        </div>

                        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center space-y-1">
                          <span className="text-[11px] font-bold text-stone-600 block">مفردة (Single)</span>
                          <input
                            type="number"
                            min={0}
                            value={corpSingleRooms}
                            onChange={(e) => setCorpSingleRooms(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-white border border-stone-300 rounded-xl p-1.5 text-xs font-black text-center text-stone-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Meal Plan & Services */}
                    <div className="space-y-4 pt-4 border-t border-stone-100">
                      <h4 className="text-xs font-black text-[#8C6D23] uppercase tracking-wider flex items-center gap-1.5">
                        <Utensils className="w-4 h-4" />
                        <span>4. نوع الإعاشة والخدمات اللوجستية الإضافية</span>
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { id: 'breakfast' as const, label: 'إفطار بوفيه مفتوح', sub: 'Bed & Breakfast' },
                          { id: 'half_board' as const, label: 'نصف إقامة', sub: 'إفطار + عشاء بوفيه' },
                          { id: 'full_board' as const, label: 'إقامة كاملة', sub: '3 وجبات بوفيه يومياً' },
                          { id: 'room_only' as const, label: 'إقامة فقط', sub: 'بدون وجبات' }
                        ].map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setCorpMealPlan(m.id)}
                            className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                              corpMealPlan === m.id
                                ? 'bg-amber-50/70 border-[#C9A24B] ring-1 ring-[#C9A24B]'
                                : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            <span className="block text-xs font-extrabold text-stone-900">{m.label}</span>
                            <span className="text-[10px] text-stone-500">{m.sub}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-6 pt-2 flex-wrap">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                          <input
                            type="checkbox"
                            checked={corpNeedBuses}
                            onChange={(e) => setCorpNeedBuses(e.target.checked)}
                            className="w-4 h-4 text-[#C9A24B] rounded border-stone-300"
                          />
                          <Bus className="w-4 h-4 text-[#B38A34]" />
                          <span>طلب توفير حافلات وباصات نقل خاصة للوفد</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                          <input
                            type="checkbox"
                            checked={corpNeedAirportTransfer}
                            onChange={(e) => setCorpNeedAirportTransfer(e.target.checked)}
                            className="w-4 h-4 text-[#C9A24B] rounded border-stone-300"
                          />
                          <Sparkles className="w-4 h-4 text-[#B38A34]" />
                          <span>طلب استقبال وتوديع بصالات المطار</span>
                        </label>
                      </div>
                    </div>

                    {/* Section 5: Room Distribution & Notes */}
                    <div className="space-y-2 pt-4 border-t border-stone-100">
                      <label className="text-xs font-bold text-stone-700 block">
                        تفاصيل وتوزيع الغرف والملاحظات الإضافية (اختياري)
                      </label>
                      <textarea
                        rows={3}
                        value={corpNotes}
                        onChange={(e) => setCorpNotes(e.target.value)}
                        placeholder="اكتب أي رغبات إضافية مثل: فواتير ضريبية، توزيع أسماء النزلاء، كوتة مخصصة..."
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white leading-relaxed"
                      />
                    </div>

                    {/* Form Submit Button */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <span className="text-xs text-stone-500">
                        سيتم حفظ الطلب وإتاحة المتابعة المباشرة عبر الواتساب فور الإرسال
                      </span>

                      <button
                        type="submit"
                        disabled={corpSubmitting}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 hover:from-black hover:to-stone-900 text-[#DFBE72] font-black text-xs sm:text-sm shadow-md border border-[#C9A24B]/50 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {corpSubmitting ? (
                          <div className="w-4 h-4 border-2 border-[#DFBE72] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>إرسال طلب التعاقد والحجز الفندقي للشركات ⚡</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* SUB-MODE 2: ONLINE CORPORATE AVAILABILITY & DIRECT BOOKING */}
            {corporateSubMode === 'online' && (
              <div className="space-y-4">
                <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تصفح الفنادق المفتوحة للحجز الجماعي والشركات أونلاين لحظياً</span>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    يمكن للشركات حجز كوتة غرف متعددة مباشرة مع إصدار سند الحجز الفوري
                  </span>
                </div>

                {selectedHotel && (
                  <BookingFlow
                    hotel={selectedHotel}
                    allHotels={activeHotels}
                    initialCheckIn={searchCheckIn}
                    initialCheckOut={searchCheckOut}
                    initialRooms={Math.max(3, prefillRooms)}
                    initialAdults={prefillAdults}
                    initialChildren={prefillChildren}
                    initialBookingType="group"
                    siteSettings={siteSettings}
                    onNavigateHome={() => onNavigate('home')}
                    onSelectAnotherHotel={(hId) => {
                      if (hId) {
                        const h = activeHotels.find(x => x.id === hId);
                        if (h) setSelectedHotel(h);
                      }
                    }}
                    onOpenTrackModal={(code) => {
                      setActiveTab('manage');
                      if (code) {
                        setManageQuery(code);
                        handleSearchBooking(code);
                      }
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MANAGE & TRACK BOOKING                                             */}
        {/* ========================================================================= */}
        {activeTab === 'manage' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#C9A24B]/15 text-[#8C6D23] flex items-center justify-center mx-auto">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">الاستعلام عن الحجز والمفتاح الرقمي</h2>
              <p className="text-xs text-stone-500">
                أدخل كود الحجز (مثل PRS-8492) أو رقم الهاتف المسجل لعرض التفاصيل وسند الحجز
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchBooking();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={manageQuery}
                onChange={(e) => setManageQuery(e.target.value)}
                placeholder="أدخل كود الحجز أو رقم الهاتف..."
                className="flex-1 h-12 px-4 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] shadow-2xs"
              />
              <button
                type="submit"
                disabled={manageLoading || !manageQuery.trim()}
                className="h-12 px-6 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {manageLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>استعلام</span>
                )}
              </button>
            </form>

            {manageBooking ? (
              <div className="space-y-5 pt-4 border-t border-stone-100 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="text-[11px] text-stone-500 block">حالة الحجز:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                      manageBooking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                      manageBooking.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                      manageBooking.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {manageBooking.status === 'confirmed' ? 'حجز مؤكد ومضمون ✓' :
                       manageBooking.status === 'checked_in' ? 'تم التسكين واستلام الغرفة' :
                       manageBooking.status === 'cancelled' ? 'ملغى' :
                       'قيد المراجعة الفورية'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-500 block">تاريخ الإصدار:</span>
                    <span className="text-xs font-bold text-stone-800">
                      {new Date(manageBooking.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-gradient-to-br from-stone-900 to-stone-800 text-white border border-[#C9A24B]/30 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#E6C673]" />
                      <strong className="text-sm font-bold">{manageBooking.hotelName}</strong>
                    </div>
                    <span className="text-[10px] bg-[#C9A24B]/20 text-[#E6C673] px-2.5 py-0.5 rounded-full font-bold">
                      {manageBooking.hotelCity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-stone-400 block">كود الحجز:</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <strong className="text-base font-mono text-[#E6C673]">{manageBooking.bookingCode}</strong>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(manageBooking.bookingCode, 'code')}
                          className="text-stone-400 hover:text-white"
                          title="نسخ"
                        >
                          {copiedField === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">المفتاح الرقمي:</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <strong className="text-base font-mono text-emerald-400">{manageBooking.digitalKey || 'قيد الإصدار'}</strong>
                        {manageBooking.digitalKey && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(manageBooking.digitalKey!, 'key')}
                            className="text-stone-400 hover:text-white"
                            title="نسخ"
                          >
                            {copiedField === 'key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <span className="text-stone-500">اسم النزيل:</span>
                    <strong className="text-stone-900">{manageBooking.guestName}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <span className="text-stone-500">نوع الغرفة:</span>
                    <strong className="text-stone-900">{manageBooking.roomName} ({manageBooking.roomsCount} غرف)</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <span className="text-stone-500">فترة الإقامة:</span>
                    <strong className="text-stone-900">{manageBooking.checkIn} إلى {manageBooking.checkOut} ({manageBooking.nights} ليالٍ)</strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-stone-500 font-bold">المجموع الإجمالي:</span>
                    <strong className="text-sm text-[#B38A34]">{manageBooking.totalAmount.toLocaleString()} ر.س</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={buildGuestWhatsAppShareLink(manageBooking, undefined, siteSettings)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>تأكيد عبر الواتساب</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setManageVoucher(manageBooking)}
                    className="px-5 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>سند الحجز (PDF)</span>
                  </button>
                </div>
              </div>
            ) : manageSearched && !manageLoading ? (
              <div className="py-8 text-center text-stone-500 space-y-2 animate-fadeIn">
                <AlertCircle className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-xs font-bold">لم يتم العثور على حجز مطابق</p>
                <p className="text-[11px] text-stone-400">يرجى التأكد من كود الحجز أو رقم الهاتف المدخل</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Printable Voucher Modal */}
      {manageVoucher && (
        <React.Suspense fallback={null}>
          <BookingVoucherModal
            booking={manageVoucher}
            siteSettings={siteSettings}
            onClose={() => setManageVoucher(null)}
          />
        </React.Suspense>
      )}
    </div>
  );
};
