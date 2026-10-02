import React, { useState, useEffect, useMemo } from 'react';
import { 
  Hotel, 
  RoomTypeItem, 
  MealPlanOption, 
  SiteSettings, 
  ActivePage,
  RoomBooking,
  HotelGalleryItem,
  RoomPackageOption 
} from '../types';
import { 
  getRoomsFromDb, 
  getMealPlansFromDb, 
  calculateRoomPriceForDates,
  getHotelPolicy,
  getBookingByCodeOrPhone,
  buildGuestWhatsAppShareLink,
  getPackagesFromDb 
} from '../services/bookingService';
import { RoomBookingModal } from '../components/RoomBookingModal';
import { WhatsAppIcon } from '../components/BookingIcons';
import { 
  Search, 
  Calendar, 
  Users, 
  MapPin, 
  Building2, 
  Key, 
  ShieldCheck, 
  Sparkles, 
  Utensils, 
  CheckCircle2, 
  AlertCircle, 
  BedDouble, 
  Star, 
  ChevronRight, 
  ChevronLeft,
  Clock, 
  Check, 
  Coffee, 
  PhoneCall, 
  ExternalLink,
  Info,
  Filter,
  ArrowRight,
  ArrowLeft,
  Copy,
  ChevronDown,
  X,
  MessageSquare,
  Wifi,
  Car,
  CigaretteOff,
  Accessibility,
  Dumbbell,
  Bell,
  Share2,
  Heart,
  Camera,
  Maximize2,
  Navigation
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FALLBACK_HOTEL_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

const getImageUrl = (item: string | HotelGalleryItem | undefined): string => {
  if (!item) return '';
  return typeof item === 'string' ? item : item.url;
};

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
  onSelectHotel,
  initialHotelId
}) => {
  const isCreationAllowed = siteSettings?.bookingModule?.allowPublicBookingCreation !== false;

  // Top View Switcher: 'search' (حجز جديد) vs 'manage' (إدارة ومتابعة حجز)
  const [activePortalTab, setActivePortalTab] = useState<'search' | 'manage'>(() => {
    return isCreationAllowed ? 'search' : 'manage';
  });

  useEffect(() => {
    if (!isCreationAllowed && activePortalTab === 'search') {
      setActivePortalTab('manage');
    }
  }, [isCreationAllowed, activePortalTab]);

  // Dates
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], []);
  const [checkIn, setCheckIn] = useState<string>(todayStr);
  const [checkOut, setCheckOut] = useState<string>(tomorrowStr);

  // Search Parameters
  const [selectedCity, setSelectedCity] = useState<'all' | 'مكة المكرمة' | 'المدينة المنورة'>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedHotelId, setSelectedHotelId] = useState<string>(initialHotelId || 'all');

  useEffect(() => {
    if (initialHotelId) {
      setSelectedHotelId(initialHotelId);
    }
  }, [initialHotelId]);
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [roomsCount, setRoomsCount] = useState<number>(1);

  // Data
  const [allRooms, setAllRooms] = useState<RoomTypeItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanOption[]>([]);
  const [allPackages, setAllPackages] = useState<RoomPackageOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Booking Modal
  const [bookingModalHotel, setBookingModalHotel] = useState<Hotel | null>(null);
  const [bookingModalRoomId, setBookingModalRoomId] = useState<string | undefined>(undefined);
  const [bookingModalMealId, setBookingModalMealId] = useState<string | undefined>(undefined);

  // Manage Booking Tab State
  const [manageQuery, setManageQuery] = useState('');
  const [manageBooking, setManageBooking] = useState<RoomBooking | null>(null);
  const [manageSearched, setManageSearched] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Lightbox Modal for Hotel Gallery Photos
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Load Rooms, Meal Plans & Packages
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      getRoomsFromDb(),
      getMealPlansFromDb(),
      getPackagesFromDb()
    ]).then(([r, m, p]) => {
      if (!mounted) return;
      setAllRooms(r);
      setMealPlans(m);
      setAllPackages(p);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Calculate Nights Count
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [checkIn, checkOut]);

  // Selected Hotel Match (if user picked a specific hotel in search bar or clicked on card)
  const targetHotel = useMemo(() => {
    if (selectedHotelId === 'all') return null;
    return hotels.find(h => h.id === selectedHotelId) || null;
  }, [hotels, selectedHotelId]);

  // Matching Hotels for the Search
  const searchResults = useMemo(() => {
    let list = hotels.filter(h => h.isActive !== false);

    if (selectedCity !== 'all') {
      list = list.filter(h => h.city === selectedCity);
    }
    if (selectedDistrict !== 'all') {
      list = list.filter(h => h.district === selectedDistrict);
    }

    if (targetHotel) {
      const isTargetOnline = targetHotel.onlineBookingEnabled !== false;
      const alternatives = list.filter(h => h.id !== targetHotel.id && h.onlineBookingEnabled !== false);
      return {
        targetHotel,
        isTargetOnline,
        alternatives
      };
    }

    // If no specific hotel selected: show online-available hotels first
    const onlineList = list.filter(h => h.onlineBookingEnabled !== false);
    const offlineList = list.filter(h => h.onlineBookingEnabled === false);

    return {
      targetHotel: null,
      isTargetOnline: true,
      hotelsList: onlineList,
      offlineCount: offlineList.length
    };
  }, [hotels, selectedCity, selectedDistrict, targetHotel]);

  // Manage Booking Lookup Handler
  const handleManageSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageQuery.trim()) return;

    setManageLoading(true);
    setManageSearched(true);
    try {
      const found = await getBookingByCodeOrPhone(manageQuery);
      setManageBooking(found);
    } catch {
      setManageBooking(null);
    } finally {
      setManageLoading(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleShareHotel = (hotel: Hotel) => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  // Build gallery image list for target hotel
  const targetHotelGallery = useMemo(() => {
    if (!targetHotel) return [];
    const list: string[] = [];
    if (targetHotel.mainImage) list.push(targetHotel.mainImage);
    if (Array.isArray(targetHotel.galleryImages)) {
      targetHotel.galleryImages.forEach(img => {
        const u = getImageUrl(img);
        if (u && !list.includes(u)) list.push(u);
      });
    }
    return list.length > 0 ? list : [FALLBACK_HOTEL_IMG];
  }, [targetHotel]);

  if (siteSettings?.bookingModule?.enabled === false) {
    const siteWhatsApp = siteSettings?.bookingModule?.bookingWhatsApp || siteSettings?.channels?.find(c => c.type === 'whatsapp')?.value || '+966544076726';
    const cleanWa = siteWhatsApp.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent('السلام عليكم ورحمة الله، أود الاستفسار وحجز إقامة فندقية لديكم.')}`;

    return (
      <div className="min-h-screen bg-[#F8F7F4] text-stone-900 font-cairo pt-28 pb-16" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-[#EFE6D8] p-8 sm:p-12 shadow-xl text-center space-y-6 relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-[#C9A24B]/30 flex items-center justify-center mx-auto text-[#B38A34] shadow-xs">
              <PhoneCall className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#C9A24B]/10 text-[#98752B] text-xs font-bold">
                الحجز والتسكين المباشر عبر خدمة العملاء
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
                نظام الحجز أونلاين مغلق حالياً
              </h2>
              <p className="text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
                تم إيقاف نظام الحجز الذكي الآلي مؤقتاً. فريق برستيج لخدمة العملاء والحجوزات جاهز لاستقبال طلباتكم وتأكيد إقامتكم فورياً بأفضل الأسعار عبر الواتساب أو الهاتف مباشرة.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#25D366] to-[#20bd5a] hover:from-[#1eb852] hover:to-[#179641] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span>طلب حجز مباشر عبر الواتساب</span>
              </a>

              <button
                type="button"
                onClick={() => onNavigate('hotels')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#C9A24B]" />
                <span>استعراض قائمة الفنادق</span>
              </button>
            </div>

            {/* Hotels Quick Directory */}
            <div className="mt-8 pt-8 border-t border-stone-100 text-right">
              <h4 className="text-xs font-bold text-stone-400 mb-4 text-center">أو تواصل مباشرة مع أحد فنادقنا:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hotels.filter(h => h.isActive !== false).map((hotel) => {
                  const hWa = hotel.hotelWhatsApp || siteWhatsApp;
                  const hWaLink = `https://wa.me/${hWa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`السلام عليكم، أود حجز إقامة في ${hotel.name}`)}`;
                  return (
                    <div key={hotel.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-center justify-between">
                      <div>
                        <strong className="text-sm font-bold text-stone-900 block">{hotel.name}</strong>
                        <span className="text-xs text-stone-500">{hotel.city} • {hotel.district}</span>
                      </div>
                      <a
                        href={hWaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#25D366] hover:text-white text-stone-800 text-xs font-bold border border-stone-200 transition-colors flex items-center gap-1"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                        <span>حجز</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-stone-900 font-cairo pt-24 pb-16" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Hero Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold border border-[#C9A24B]/30 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isCreationAllowed ? 'منصة الحجوزات الفندقية الذكية المباشرة' : 'بوابة متابعة وإدارة الحجوزات الفندقية'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
            {isCreationAllowed 
              ? 'احجز إقامتك الفاخرة بجوار الحرمين بأفضل سعر مضمون'
              : 'إدارة ومتابعة حجزك الفندقي واستعراض المفتاح الرقمي'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {isCreationAllowed
              ? 'تحقق من الإتاحة الفورية، استعرض صور الفنادق والمرافق، قارن بين الغرف والأجنحة الفندقية، واحصل على تأكيد حجزك فورياً.'
              : 'استعلم برقم الحجز أو رقم الهاتف لعرض تفاصيل إقامتك، كود الدخول والمفتاح الرقمي الذكي، وحالة التسكين ومواعيد الوصول.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
        {/* Top Control Bar: Switcher between Search & Manage Booking */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-white border border-stone-200 shadow-xs gap-1.5">
            {isCreationAllowed && (
              <button
                type="button"
                onClick={() => setActivePortalTab('search')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activePortalTab === 'search'
                    ? 'bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white shadow-sm'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-stone-50'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>بحث وحجز الغرف</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActivePortalTab('manage')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activePortalTab === 'manage'
                  ? 'bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white shadow-sm'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-stone-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#F4B400]" />
              <span>إدارة ومتابعة حجز</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isCreationAllowed ? 'إلغاء مرن مجاني حتى 48 ساعة • الدفع عند الوصول بالفندق' : 'خدمة ضيوف الرحمن 24/7 • متابعة فورية للحجوزات'}</span>
          </div>
        </div>

        {/* VIEW 1: SEARCH & BOOKING FLOW */}
        {activePortalTab === 'search' && (
          <div className="space-y-6">
            {/* Booking.com Search Bar with Prestige Royal Gold Accent */}
            <div className="bg-white rounded-2xl border-[3px] border-[#C9A24B] shadow-xl relative flex flex-col lg:flex-row items-stretch overflow-visible">
              {/* 1. اختر الوجهة */}
              <div className="flex-1 p-3.5 sm:p-4 flex items-center justify-between gap-3 relative group hover:bg-amber-50/20 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-[#B38A34]">
                    <BedDouble className="w-5 h-5 text-[#B38A34]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      اختر الوجهة أو الفندق
                    </span>
                    <select
                      value={selectedHotelId !== 'all' ? `hotel_${selectedHotelId}` : (selectedCity !== 'all' ? `city_${selectedCity}` : 'all')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('city_')) {
                          setSelectedCity(val.replace('city_', '') as any);
                          setSelectedHotelId('all');
                        } else if (val.startsWith('hotel_')) {
                          setSelectedHotelId(val.replace('hotel_', ''));
                        } else {
                          setSelectedCity('all');
                          setSelectedDistrict('all');
                          setSelectedHotelId('all');
                        }
                      }}
                      className="w-full bg-transparent font-bold text-xs sm:text-sm text-stone-900 focus:outline-none cursor-pointer truncate"
                    >
                      <option value="all">جميع الوجهات والفنادق (مكة والمدينة)</option>
                      <optgroup label="المدن المقدسة">
                        <option value="city_مكة المكرمة">🕋 مكة المكرمة</option>
                        <option value="city_المدينة المنورة">🕌 المدينة المنورة</option>
                      </optgroup>
                      <optgroup label="الفنادق المتاحة للحجز">
                        {hotels.map(h => (
                          <option key={h.id} value={`hotel_${h.id}`}>
                            {h.name} ({h.city}) {h.onlineBookingEnabled === false ? '• (حجز هاتفي فقط)' : ''}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {(selectedCity !== 'all' || selectedHotelId !== 'all') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCity('all');
                      setSelectedDistrict('all');
                      setSelectedHotelId('all');
                    }}
                    className="w-7 h-7 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
                    title="مسح الوجهة والعودة للكل"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Vertical divider */}
              <div className="h-[2px] lg:h-auto lg:w-[2px] bg-stone-200" />

              {/* 2. تحديد التواريخ */}
              <div className="flex-1 p-3.5 sm:p-4 flex items-center gap-3 hover:bg-amber-50/20 transition-colors">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-[#B38A34]">
                  <Calendar className="w-5 h-5 text-[#B38A34]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    تاريخ الإقامة ({nights} {nights === 1 ? 'ليلة' : 'ليالٍ'})
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <input
                      type="date"
                      min={todayStr}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="bg-transparent font-bold text-xs sm:text-sm text-stone-900 focus:outline-none cursor-pointer"
                      title="تاريخ تسجيل الوصول"
                    />
                    <span className="text-stone-400 font-bold">—</span>
                    <input
                      type="date"
                      min={checkIn || todayStr}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="bg-transparent font-bold text-xs sm:text-sm text-stone-900 focus:outline-none cursor-pointer"
                      title="تاريخ تسجيل المغادرة"
                    />
                  </div>
                </div>
              </div>

              {/* Vertical divider */}
              <div className="h-[2px] lg:h-auto lg:w-[2px] bg-stone-200" />

              {/* 3. تحديد الإشغال */}
              <div className="flex-1 p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-amber-50/20 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-[#B38A34]">
                    <Users className="w-5 h-5 text-[#B38A34]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      النزلاء والغرف
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <select
                        value={adultsCount}
                        onChange={(e) => setAdultsCount(Number(e.target.value))}
                        className="bg-transparent font-bold text-xs sm:text-sm text-stone-900 focus:outline-none cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 8].map(n => (
                          <option key={n} value={n}>{n} بالغين</option>
                        ))}
                      </select>
                      <span className="text-stone-400">•</span>
                      <select
                        value={childrenCount}
                        onChange={(e) => setChildrenCount(Number(e.target.value))}
                        className="bg-transparent font-bold text-xs sm:text-sm text-stone-900 focus:outline-none cursor-pointer"
                      >
                        <option value={0}>من دون أطفال</option>
                        {[1, 2, 3, 4].map(n => (
                          <option key={n} value={n}>{n} أطفال</option>
                        ))}
                      </select>
                      <span className="text-stone-400">•</span>
                      <select
                        value={roomsCount}
                        onChange={(e) => setRoomsCount(Number(e.target.value))}
                        className="bg-transparent font-bold text-xs sm:text-sm text-stone-900 focus:outline-none cursor-pointer"
                      >
                        {[1, 2, 3, 4].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'غرفة' : 'غرف'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
              </div>

              {/* 4. زر البحث برستيج الذهبي */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('portal-results-anchor');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white px-8 py-4 font-bold text-base lg:rounded-l-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shrink-0 active:scale-98"
              >
                <Search className="w-5 h-5" />
                <span>بحث</span>
              </button>
            </div>

            <div id="portal-results-anchor" />

            {/* ========================================================================= */}
            {/* CASE A: USER SELECTED A SPECIFIC HOTEL (Booking.com Detailed Experience)   */}
            {/* ========================================================================= */}
            {targetHotel && (
              <div className="space-y-8 animate-fadeIn">
                {/* Back to all hotels button & Breadcrumbs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200 text-xs">
                  <div className="flex items-center gap-2 flex-wrap text-stone-500">
                    <span 
                      onClick={() => onNavigate('home')} 
                      className="hover:text-[#B38A34] cursor-pointer transition-colors"
                    >
                      الرئيسية
                    </span>
                    <span>/</span>
                    <span 
                      onClick={() => setSelectedHotelId('all')} 
                      className="hover:text-[#B38A34] cursor-pointer transition-colors"
                    >
                      فنادق {targetHotel.city}
                    </span>
                    <span>/</span>
                    <span className="text-stone-900 font-bold">{targetHotel.name}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHotelId('all');
                      window.scrollTo({ top: 200, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-[#B38A34] hover:border-[#C9A24B] font-bold transition-all cursor-pointer w-fit shadow-2xs"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>العودة لجميع الفنادق والنتائج</span>
                  </button>
                </div>

                {searchResults.isTargetOnline ? (
                  <div className="space-y-8">
                    {/* 1. Header Bar: Title, Stars, Address, and Action Buttons */}
                    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-2">
                          {/* Stars & Category */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 text-amber-500">
                              {Array.from({ length: targetHotel.stars || 5 }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                              متاح للحجز الفوري أونلاين ✓
                            </span>
                            <span className="text-xs text-stone-500 font-medium">
                              {targetHotel.city} • حي {targetHotel.district}
                            </span>
                          </div>

                          {/* Hotel Name */}
                          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-cairo">
                            {targetHotel.name}
                          </h2>

                          {/* Location & Distance */}
                          <div className="flex items-center gap-2 text-xs text-stone-600 flex-wrap">
                            <MapPin className="w-4 h-4 text-[#B38A34] shrink-0" />
                            <span>{targetHotel.location?.address || targetHotel.distanceText}</span>
                            <span className="text-stone-300">•</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (targetHotel.googleMapsUrl) {
                                  window.open(targetHotel.googleMapsUrl, '_blank');
                                } else {
                                  onSelectHotel(targetHotel.id);
                                }
                              }}
                              className="text-[#B38A34] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>عرض على الخريطة</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Top CTA Buttons in Prestige Brand Gold */}
                        <div className="flex items-center gap-3 shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleShareHotel(targetHotel)}
                            className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            title="مشاركة رابط الفندق"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>{copiedShareLink ? 'تم نسخ الرابط ✓' : 'مشاركة'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById('booking-rooms-table');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                          >
                            <BedDouble className="w-4 h-4" />
                            <span>احجز الآن / اختر غرفتك</span>
                          </button>
                        </div>
                      </div>

                      {/* Booking.com Sub-Navigation Bar */}
                      <div className="flex items-center gap-4 pt-3 border-t border-stone-100 text-xs font-bold text-stone-600 overflow-x-auto no-scrollbar">
                        <button 
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('hotel-gallery-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="hover:text-[#B38A34] whitespace-nowrap cursor-pointer py-1 border-b-2 border-transparent hover:border-[#C9A24B]"
                        >
                          نظرة عامة والصور
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('booking-rooms-table');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="text-[#B38A34] border-b-2 border-[#C9A24B] whitespace-nowrap cursor-pointer py-1"
                        >
                          المعلومات والأسعار (المتوافر)
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('hotel-amenities-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="hover:text-[#B38A34] whitespace-nowrap cursor-pointer py-1 border-b-2 border-transparent hover:border-[#C9A24B]"
                        >
                          المرافق والخدمات
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('hotel-policies-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="hover:text-[#B38A34] whitespace-nowrap cursor-pointer py-1 border-b-2 border-transparent hover:border-[#C9A24B]"
                        >
                          سياسات الإقامة
                        </button>
                      </div>
                    </div>

                    {/* 2. Booking.com Multi-Photo Gallery Grid matching Image 2 */}
                    <div id="hotel-gallery-section" className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                        {/* Right/Main Showcase Image (Col 7) */}
                        <div 
                          onClick={() => {
                            setLightboxImages(targetHotelGallery);
                            setLightboxIndex(0);
                          }}
                          className="lg:col-span-7 h-72 sm:h-96 rounded-2xl overflow-hidden relative cursor-pointer group shadow-sm"
                        >
                          <img 
                            src={targetHotelGallery[0] || FALLBACK_HOTEL_IMG} 
                            alt={targetHotel.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-white text-xs font-bold flex items-center gap-1.5">
                              <Maximize2 className="w-4 h-4" />
                              <span>تكبير واستعراض الصورة بدقة عالية</span>
                            </span>
                          </div>
                        </div>

                        {/* Middle/Thumbnail Grid (Col 5) */}
                        <div className="lg:col-span-5 grid grid-cols-2 gap-3 h-72 sm:h-96">
                          {targetHotelGallery.slice(1, 5).map((imgUrl, idx) => {
                            const isLastThumb = idx === 3 || idx === targetHotelGallery.slice(1, 5).length - 1;
                            const extraCount = Math.max(0, targetHotelGallery.length - 5);
                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  setLightboxImages(targetHotelGallery);
                                  setLightboxIndex(idx + 1);
                                }}
                                className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-2xs h-full"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`${targetHotel.name} - ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                {isLastThumb && extraCount > 0 ? (
                                  <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center text-white text-center p-2 group-hover:bg-black/75 transition-colors">
                                    <Camera className="w-5 h-5 mb-1 text-[#E6C673]" />
                                    <span className="text-sm font-extrabold font-mono">+{extraCount + 1} صور</span>
                                    <span className="text-[10px] text-stone-300">عرض جميع الصور</span>
                                  </div>
                                ) : (
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Guest Review & Location Highlights Bar (Matching Image 2 left box) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-4 rounded-2xl bg-white border border-stone-200 flex items-center justify-between shadow-2xs">
                          <div>
                            <span className="text-[11px] font-bold text-stone-500 block">تقييم النزلاء العام:</span>
                            <strong className="text-base font-bold text-stone-900">رائع ومميز</strong>
                            <span className="text-[10px] text-stone-400 block">بناءً على 2,177 تقييم معتمد</span>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B38A34] to-[#C9A24B] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                            {targetHotel.rating ? targetHotel.rating.toFixed(1) : '9.1'}
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-stone-200 flex items-center gap-3 shadow-2xs">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B38A34] flex items-center justify-center shrink-0">
                            <Navigation className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-stone-500 block">الموقع وقربه من الحرم:</span>
                            <span className="text-xs font-bold text-stone-900 block">{targetHotel.distanceText}</span>
                            <span className="text-[10px] text-emerald-700 font-bold">موقع استثنائي - 9.4</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-stone-200 flex items-center gap-3 shadow-2xs">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B38A34] flex items-center justify-center shrink-0">
                            <Coffee className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-stone-500 block">خيارات وجبة الإفطار:</span>
                            <span className="text-xs font-bold text-stone-900 block">بوفيه عالمي، شرقي وكونتيننتال</span>
                            <span className="text-[10px] text-stone-500">إفطار استثنائي مشمول أو حسب الباقة</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Popular Amenities Pills (Matching Image 2 Amenities Bar) */}
                    <div id="hotel-amenities-section" className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
                      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                        أبرز المرافق والخدمات المتاحة بالفندق:
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                        <span className="px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 flex items-center gap-2">
                          <Coffee className="w-4 h-4 text-[#B38A34]" />
                          <span>إفطار بوفيه فاخر</span>
                        </span>
                        <span className="px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 flex items-center gap-2">
                          <Car className="w-4 h-4 text-[#B38A34]" />
                          <span>موقف سيارات خاص</span>
                        </span>
                        <span className="px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-[#B38A34]" />
                          <span>واي فاي مجاني فائق السرعة</span>
                        </span>
                        <span className="px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#B38A34]" />
                          <span>غرف وأجنحة عائلية</span>
                        </span>
                        <span className="px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 flex items-center gap-2">
                          <Bell className="w-4 h-4 text-[#B38A34]" />
                          <span>خدمة الغرف على مدار 24 ساعة</span>
                        </span>
                        <span className="px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-[#B38A34]" />
                          <span>مطاعم بإطلالات مميزة</span>
                        </span>
                        <span className="px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 flex items-center gap-2">
                          <CigaretteOff className="w-4 h-4 text-[#B38A34]" />
                          <span>غرف لغير المدخنين</span>
                        </span>
                        <span className="px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 flex items-center gap-2">
                          <Accessibility className="w-4 h-4 text-[#B38A34]" />
                          <span>مرافق مجهزة لذوي الاحتياجات الخاصة</span>
                        </span>
                      </div>
                    </div>

                    {/* 4. Hotel Description & Key Perks Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
                        <h3 className="text-lg font-bold text-stone-900 font-cairo">
                          استشعر كأنك نجم واستمتع بالمعاملة والخدمات الراقية في {targetHotel.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                          {targetHotel.detailedDescription || targetHotel.overview || `يقع ${targetHotel.name} في ${targetHotel.city} بحي ${targetHotel.district}، على مسافة ${targetHotel.distanceText}، ويقدم للنزلاء إقامة فاخرة تجمع بين روحانية المكان وأرقى معايير الضيافة العالمية مع إطلالات خلابة وخدمات متكاملة.`}
                        </p>

                        <div className="pt-3 border-t border-stone-100 flex items-center gap-4 text-xs text-stone-500">
                          <span className="flex items-center gap-1.5 font-bold text-stone-800">
                            <Clock className="w-4 h-4 text-[#B38A34]" />
                            <span>تسجيل الوصول: {getHotelPolicy(targetHotel).checkInTime}</span>
                          </span>
                          <span className="flex items-center gap-1.5 font-bold text-stone-800">
                            <Clock className="w-4 h-4 text-[#B38A34]" />
                            <span>تسجيل المغادرة: {getHotelPolicy(targetHotel).checkOutTime}</span>
                          </span>
                        </div>
                      </div>

                      <div className="lg:col-span-4 bg-stone-900 text-white p-6 rounded-3xl space-y-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#E6C673]" />
                          <h4 className="font-bold text-base text-[#E6C673]">مميزات مكان الإقامة</h4>
                        </div>
                        <ul className="space-y-2.5 text-xs text-stone-300">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#E6C673] shrink-0 mt-0.5" />
                            <span>موقع استثنائي بجوار الحرمين الشريفين يسهل الوصول سيراً على الأقدام.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#E6C673] shrink-0 mt-0.5" />
                            <span>خيارات إفطار ووجبات متنوعة تناسب مختلف الأذواق.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#E6C673] shrink-0 mt-0.5" />
                            <span>طاقم استقبال يتحدث العربية والإنجليزية ولغات متعددة على مدار 24 ساعة.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#E6C673] shrink-0 mt-0.5" />
                            <span>خدمات حجز مسبقة مع خيار الإلغاء المرن المجاني.</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* 4.5 EXCLUSIVE PACKAGES & OFFERS */}
                    {(() => {
                      const hotelPackages = allPackages.filter(p => p.hotelId === targetHotel.id && p.isActive !== false);
                      if (hotelPackages.length === 0) return null;

                      return (
                        <div className="space-y-3 pt-2">
                          <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 p-5 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/20 text-[#E6C673] flex items-center justify-center font-bold">
                                <Sparkles className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-bold font-cairo text-white">
                                  باقات وعروض الإقامة الحصرية ({hotelPackages.length})
                                </h3>
                                <p className="text-xs text-stone-300">
                                  عروض متكاملة تشمل الغرفة والإفطار أو الوجبات بسعر إجمالي مخفض لفترة محددة.
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] text-[#E6C673] font-bold bg-white/10 px-3 py-1 rounded-xl self-start sm:self-auto">
                              عروض لفترة محدودة ⏳
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {hotelPackages.map(pkg => (
                              <div
                                key={pkg.id}
                                className="p-5 rounded-3xl bg-white border border-stone-200 hover:border-[#C9A24B] shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between relative group"
                              >
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-amber-100/90 text-amber-950 text-[10px] font-bold">
                                      {pkg.badgeText || 'عرض خاص ⭐'}
                                    </span>
                                    <span className="text-[11px] text-stone-500 font-mono font-bold">
                                      {pkg.nights} {pkg.nights === 1 ? 'ليلة' : 'ليالٍ'}
                                    </span>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-bold text-stone-900 group-hover:text-[#B38A34] transition-colors leading-snug">
                                      {pkg.name}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                                      <BedDouble className="w-3.5 h-3.5 text-[#B38A34]" />
                                      <span>{pkg.roomName}</span>
                                    </div>
                                  </div>

                                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-stone-500">الوجبة المشمولة:</span>
                                      <span className="font-bold text-stone-800 truncate max-w-[140px]">{pkg.mealPlanName}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-stone-500">صلاحية العرض:</span>
                                      <span className="font-mono text-[11px] text-stone-600">{pkg.startDate} إلى {pkg.endDate}</span>
                                    </div>
                                  </div>

                                  {pkg.features && pkg.features.length > 0 && (
                                    <div className="space-y-1 pt-1">
                                      {pkg.features.map((feat, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-stone-600">
                                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                          <span>{feat}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                                  <div>
                                    <span className="text-[10px] text-stone-400 block">إجمالي سعر الباقة:</span>
                                    <div className="flex items-baseline gap-1">
                                      <strong className="text-xl font-black text-[#B38A34] font-mono">
                                        {pkg.totalPrice.toLocaleString()}
                                      </strong>
                                      <span className="text-xs font-bold text-stone-600">ر.س</span>
                                    </div>
                                    <span className="text-[10px] text-stone-400 block">
                                      {pkg.priceIncludesTax !== false ? 'شامل الضريبة والرسوم' : '+15% ضريبة القيمة المضافة'}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBookingModalHotel(targetHotel);
                                      setBookingModalRoomId(pkg.roomId);
                                      setBookingModalMealId(pkg.mealPlanId);
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                                  >
                                    <span>احجز الباقة</span>
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 5. Booking.com ROOM AVAILABILITY & RATES TABLE ("المتوافر") */}
                    <div id="booking-rooms-table" className="space-y-4 pt-2">
                      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-extrabold text-stone-900 font-cairo">
                              المتوافر - جدول الغرف والأسعار
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                              تحديث فوري للأسعار
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            الأسعار معروضة لإقامة ({nights} {nights === 1 ? 'ليلة' : 'ليالٍ'}) من {checkIn} إلى {checkOut} لعدد ({adultsCount} بالغين و {childrenCount} أطفال).
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              window.scrollTo({ top: 120, behavior: 'smooth' });
                            }}
                            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5 text-[#B38A34]" />
                            <span>تعديل التواريخ أو الضيوف</span>
                          </button>
                        </div>
                      </div>

                      {/* Rooms Table (Booking.com style) */}
                      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                        {/* Table Header on Desktop */}
                        <div className="hidden lg:grid lg:grid-cols-12 bg-stone-100/90 text-stone-700 font-bold text-xs p-4 border-b border-stone-200">
                          <div className="col-span-4">نوع الغرفة والمميزات</div>
                          <div className="col-span-2 text-center">عدد الضيوف</div>
                          <div className="col-span-3 text-center">السعر لـ ({nights} {nights === 1 ? 'ليلة' : 'ليالٍ'})</div>
                          <div className="col-span-3 text-center">خيارات الإقامة والحجز</div>
                        </div>

                        {/* Room Rows */}
                        <div className="divide-y divide-stone-200">
                          {allRooms
                            .filter(r => r.hotelId === targetHotel.id && r.isActive !== false)
                            .map((room) => {
                              const priceCalc = calculateRoomPriceForDates(room, checkIn, checkOut);
                              const totalStayPrice = priceCalc.nightlyRate * nights;

                              return (
                                <div 
                                  key={room.id}
                                  className="p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center hover:bg-amber-50/15 transition-colors"
                                >
                                  {/* Col 1: Room Details & Photo */}
                                  <div className="lg:col-span-4 space-y-3">
                                    <div className="flex items-start gap-4">
                                      {room.images?.[0] ? (
                                        <div 
                                          onClick={() => {
                                            setLightboxImages(room.images);
                                            setLightboxIndex(0);
                                          }}
                                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 relative cursor-pointer group shadow-2xs"
                                        >
                                          <img 
                                            src={room.images[0]} 
                                            alt={room.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                          />
                                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <Camera className="w-4 h-4 text-white opacity-80" />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-stone-100 flex items-center justify-center shrink-0 text-stone-400">
                                          <BedDouble className="w-8 h-8 text-[#B38A34]" />
                                        </div>
                                      )}

                                      <div className="space-y-1 min-w-0 flex-1">
                                        <h4 className="text-base font-bold text-stone-900 font-cairo">
                                          {room.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                                          <BedDouble className="w-3.5 h-3.5 text-[#B38A34]" />
                                          <span>{room.bedType || 'سرير كينج فاخر'}</span>
                                        </div>
                                        {room.roomSize && (
                                          <p className="text-[11px] text-stone-400">
                                            المساحة: {room.roomSize}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Room Features Tags */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-bold">
                                        واي فاي مجاني
                                      </span>
                                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-bold">
                                        عازل للصوت
                                      </span>
                                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-bold">
                                        تكييف مركزي
                                      </span>
                                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-bold">
                                        حمام خاص
                                      </span>
                                    </div>
                                  </div>

                                  {/* Col 2: Max Guests */}
                                  <div className="lg:col-span-2 flex lg:flex-col items-center justify-between lg:justify-center gap-1 text-stone-700 py-2 border-y lg:border-none border-stone-100">
                                    <span className="lg:hidden text-xs font-bold text-stone-500">السعة الاستيعابية:</span>
                                    <div className="flex items-center gap-1">
                                      {Array.from({ length: Math.min(room.maxGuests || 2, 4) }).map((_, i) => (
                                        <Users key={i} className="w-4 h-4 text-stone-700" />
                                      ))}
                                    </div>
                                    <span className="text-xs font-bold text-stone-600">
                                      يتسع لـ {room.maxGuests || 2} ضيوف
                                    </span>
                                  </div>

                                  {/* Col 3: Price Calculation */}
                                  <div className="lg:col-span-3 flex lg:flex-col items-center justify-between lg:justify-center gap-1 text-center py-2 border-b lg:border-none border-stone-100">
                                    <span className="lg:hidden text-xs font-bold text-stone-500">إجمالي السعر:</span>
                                    <div>
                                      {(() => {
                                        const hotelPolicy = getHotelPolicy(targetHotel);
                                        const isPriceIncludesTax = room.priceIncludesTax !== undefined 
                                          ? room.priceIncludesTax 
                                          : (hotelPolicy.priceIncludesTax !== false);

                                        if (isPriceIncludesTax) {
                                          return (
                                            <>
                                              <div className="flex items-baseline justify-center gap-1">
                                                <strong className="text-xl sm:text-2xl font-extrabold text-[#B38A34] font-mono">
                                                  {totalStayPrice.toLocaleString()}
                                                </strong>
                                                <span className="text-xs font-bold text-stone-600">ر.س</span>
                                              </div>
                                              <div className="text-[11px] text-stone-400 mt-0.5">
                                                ({priceCalc.nightlyRate} ر.س / ليلة)
                                              </div>
                                              <span className="text-[10px] text-emerald-700 font-semibold block">
                                                شامل ضريبة القيمة المضافة 15% والرسوم
                                              </span>
                                            </>
                                          );
                                        } else {
                                          const taxAmount = Math.round(totalStayPrice * 0.15);
                                          const grandWithTax = totalStayPrice + taxAmount;
                                          return (
                                            <div className="space-y-1">
                                              <div className="flex items-baseline justify-center gap-1">
                                                <strong className="text-xl sm:text-2xl font-extrabold text-[#B38A34] font-mono">
                                                  {grandWithTax.toLocaleString()}
                                                </strong>
                                                <span className="text-xs font-bold text-stone-600">ر.س</span>
                                              </div>
                                              <div className="text-[11px] text-stone-500 font-medium">
                                                الأساسي: {totalStayPrice.toLocaleString()} ر.س ({priceCalc.nightlyRate} / ليلة)
                                              </div>
                                              <div className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200/50">
                                                +15% ضريبة ({taxAmount.toLocaleString()} ر.س)
                                              </div>
                                            </div>
                                          );
                                        }
                                      })()}
                                      {priceCalc.activeSeasonName && (
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[#C9A24B]/15 text-[#B38A34] text-[10px] font-bold border border-[#C9A24B]/30">
                                          {priceCalc.activeSeasonName}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Col 4: Perks & Booking Button in Prestige Gold */}
                                  <div className="lg:col-span-3 space-y-3">
                                    {(() => {
                                      const hotelPolicy = getHotelPolicy(targetHotel);
                                      return (
                                        <div className="space-y-1.5 text-xs">
                                          {hotelPolicy.showFreeCancellationBadge !== false && (
                                            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                              <span>إلغاء مجاني حتى {hotelPolicy.cancellationNoticeDays} أيام قبل الوصول</span>
                                            </div>
                                          )}
                                          {hotelPolicy.showPayAtHotelBadge !== false && (
                                            <div className="flex items-center gap-1.5 text-stone-600">
                                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                              <span>لا يلزم الدفع المسبق - ادفع في الفندق</span>
                                            </div>
                                          )}
                                          {hotelPolicy.showInstantConfirmBadge !== false && (
                                            <div className="flex items-center gap-1.5 text-stone-600">
                                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                              <span>تأكيد فوري عبر الواتساب وبرقم حجز موثق</span>
                                            </div>
                                          )}
                                          {hotelPolicy.showMealInclusionBadge !== false && (
                                            <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                                              <Coffee className="w-3.5 h-3.5 text-[#B38A34] shrink-0" />
                                              <span>خيارات بوفيه الإفطار والوجبات متاحة</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {/* Prestige Gold Action Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBookingModalHotel(targetHotel);
                                        setBookingModalRoomId(room.id);
                                        setBookingModalMealId(undefined);
                                      }}
                                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                                    >
                                      <span>احجز الآن</span>
                                      <ChevronLeft className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>

                    {/* 6. Standard Hotel Policies Card */}
                    <div id="hotel-policies-section" className="p-6 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-4 text-xs">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#B38A34]" />
                        <span>سياسات وشروط الإقامة المعتمدة عالمياً بالفندق:</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                          <span className="text-[11px] text-stone-400 block font-bold">مواعيد الدخول والمغادرة:</span>
                          <span className="font-bold text-stone-800 text-xs block">
                            تسجيل الدخول: {getHotelPolicy(targetHotel).checkInTime}
                          </span>
                          <span className="font-bold text-stone-800 text-xs block">
                            تسجيل المغادرة: {getHotelPolicy(targetHotel).checkOutTime}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                          <span className="text-[11px] text-stone-400 block font-bold">سياسة الإلغاء والاسترداد:</span>
                          <span className="font-bold text-emerald-700 text-xs block">
                            إلغاء مجاني حتى {getHotelPolicy(targetHotel).cancellationNoticeDays} أيام قبل الوصول
                          </span>
                          <span className="text-[10px] text-stone-500 block">استرداد كامل بدون أي رسوم خصم</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                          <span className="text-[11px] text-stone-400 block font-bold">طريقة وسداد الدفع:</span>
                          <span className="font-bold text-stone-800 text-xs block">
                            الدفع عند الوصول في الفندق
                          </span>
                          <span className="text-[10px] text-stone-500 block">نقداً أو ببطاقات مدى وفيزا وماستركارد</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Targeted Hotel is OFFLINE
                  <div className="p-8 sm:p-12 rounded-3xl bg-amber-50/90 border border-amber-200 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-200/80 text-amber-800 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-amber-950 font-cairo">
                        فندق {targetHotel.name} غير متاح للحجز المباشر عبر الإنترنت في التواريخ المختارة
                      </h3>
                      <p className="text-xs sm:text-sm text-amber-800 mt-2 max-w-lg mx-auto leading-relaxed">
                        تم تعيين هذا الفندق كحجز مباشر عبر التواصل الهاتفي، أو أن جميع الغرف محجوزة بالكامل في هذه الفترة.
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedHotelId('all')}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        عرض الفنادق والبدائل المتاحة فوراً
                      </button>
                    </div>
                  </div>
                )}

                {/* Recommended Alternative Hotels */}
                {searchResults.alternatives && searchResults.alternatives.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#B38A34]" />
                        <span>فنادق بديلة مقترحة ومتاحة للحجز بنفس المدينة ({targetHotel.city}):</span>
                      </h3>
                      <span className="text-xs text-stone-500 font-medium">
                        {searchResults.alternatives.length} بدائل فاخرة
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {searchResults.alternatives.map((altHotel) => (
                        <div 
                          key={altHotel.id}
                          className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="h-48 relative overflow-hidden">
                              <img 
                                src={altHotel.mainImage || FALLBACK_HOTEL_IMG} 
                                alt={altHotel.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                                {altHotel.city} • {altHotel.district}
                              </div>
                            </div>

                            <div className="p-5 space-y-2">
                              <div className="flex items-center gap-1 text-amber-500">
                                {Array.from({ length: altHotel.stars || 4 }).map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                              <h4 className="text-base font-bold text-stone-900">{altHotel.name}</h4>
                              <p className="text-xs text-stone-500 line-clamp-2">{altHotel.distanceText}</p>
                            </div>
                          </div>

                          <div className="p-5 pt-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedHotelId(altHotel.id);
                                window.scrollTo({ top: 120, behavior: 'smooth' });
                              }}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                            >
                              <span>استعراض الغرف المتاحة والأسعار</span>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* CASE B: GENERAL SEARCH RESULTS (SHOW ALL HOTELS WITH PICTURES & DETAILS)   */}
            {/* ========================================================================= */}
            {!targetHotel && searchResults.hotelsList && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#B38A34]" />
                    <span>الفنادق المتاحة للحجز أونلاين:</span>
                  </h3>
                  <span className="text-xs text-stone-500 font-bold bg-white px-3 py-1 rounded-full border border-stone-200">
                    ({searchResults.hotelsList.length} فندق متاح للحجز الفوري)
                  </span>
                </div>

                <div className="space-y-6">
                  {searchResults.hotelsList.map((hotel) => {
                    const hotelRooms = allRooms.filter(r => r.hotelId === hotel.id && r.isActive !== false);
                    
                    // Compute lowest room price
                    const minPrice = hotelRooms.reduce((min, r) => {
                      const p = calculateRoomPriceForDates(r, checkIn, checkOut).nightlyRate;
                      return p < min ? p : min;
                    }, 999999);

                    return (
                      <div 
                        key={hotel.id}
                        className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-lg transition-all flex flex-col md:flex-row group"
                      >
                        {/* Prominent Hotel Image on the Right/Side */}
                        <div 
                          onClick={() => {
                            setSelectedHotelId(hotel.id);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                          className="md:w-80 lg:w-96 h-60 md:h-auto relative overflow-hidden shrink-0 cursor-pointer"
                        >
                          <img 
                            src={hotel.mainImage || FALLBACK_HOTEL_IMG} 
                            alt={hotel.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          
                          {/* Image Badges */}
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                              {hotel.city} • حي {hotel.district}
                            </span>
                          </div>

                          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-amber-400 text-xs font-bold">
                            <div className="flex items-center">
                              {Array.from({ length: hotel.stars || 4 }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                            <span className="text-white text-[11px] font-mono mr-1">
                              {hotel.rating ? hotel.rating.toFixed(1) : '9.0'}
                            </span>
                          </div>
                        </div>

                        {/* Hotel Info & Content */}
                        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                    متاح أونلاين ✓
                                  </span>
                                  <span className="text-xs text-stone-400">
                                    {hotel.city} • {hotel.district}
                                  </span>
                                </div>

                                <h4 
                                  onClick={() => {
                                    setSelectedHotelId(hotel.id);
                                    window.scrollTo({ top: 120, behavior: 'smooth' });
                                  }}
                                  className="text-xl font-extrabold text-stone-900 mt-1 cursor-pointer hover:text-[#B38A34] transition-colors font-cairo"
                                >
                                  {hotel.name}
                                </h4>
                              </div>

                              <button
                                type="button"
                                onClick={() => onSelectHotel(hotel.id)}
                                className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                                title="عرض صفحة الفندق المستقلة"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Distance & Proximity */}
                            <div className="flex items-center gap-1.5 text-xs text-stone-600">
                              <MapPin className="w-4 h-4 text-[#B38A34] shrink-0" />
                              <span className="font-bold">{hotel.distanceText}</span>
                              <span className="text-stone-300">•</span>
                              <span className="text-emerald-700 font-bold">موقع ممتاز</span>
                            </div>

                            {/* Perks preview */}
                            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                              {hotel.overview || 'إقامة فندقية فاخرة وخدمات ضيافة متميزة بالقرب من ساحات الحرم الشريف.'}
                            </p>

                            {/* Room Preview Chips */}
                            <div className="pt-2">
                              <span className="text-xs font-bold text-stone-700 block mb-2">
                                خيارات الغرف المتاحة ({hotelRooms.length}):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {hotelRooms.slice(0, 2).map((rm) => {
                                  const pricing = calculateRoomPriceForDates(rm, checkIn, checkOut);
                                  return (
                                    <div 
                                      key={rm.id}
                                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs"
                                    >
                                      <div className="min-w-0 pr-1">
                                        <strong className="text-stone-800 block truncate">{rm.name}</strong>
                                        <span className="text-[#B38A34] font-bold">{pricing.nightlyRate} ر.س</span>
                                        <span className="text-[10px] text-stone-400"> / ليلة</span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setBookingModalHotel(hotel);
                                          setBookingModalRoomId(rm.id);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer shrink-0"
                                      >
                                        حجز
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Starting Price & Primary View Action */}
                          <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              {minPrice < 999999 ? (
                                <div>
                                  <span className="text-[11px] text-stone-500 block">ابتداءً من:</span>
                                  <div className="flex items-baseline gap-1">
                                    <strong className="text-xl font-extrabold text-[#B38A34] font-mono">
                                      {minPrice}
                                    </strong>
                                    <span className="text-xs font-bold text-stone-700">ر.س / ليلة</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-stone-500">حسب نوع الغرفة المختارة</span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedHotelId(hotel.id);
                                window.scrollTo({ top: 120, behavior: 'smooth' });
                              }}
                              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                            >
                              <span>استعراض الغرف المتاحة والأسعار</span>
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: MANAGE & TRACK BOOKING BY CODE / PHONE                             */}
        {/* ========================================================================= */}
        {activePortalTab === 'manage' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl border-[3px] border-[#C9A24B] p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manageQuery}
                    onChange={(e) => setManageQuery(e.target.value)}
                    placeholder="اكتب رقم الهاتف (مثل 05xxxxxxxx) أو كود الحجز (مثل PRS-8492)..."
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-stone-50 border border-stone-300 text-sm font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white transition-all font-mono"
                  />
                  <Key className="w-5 h-5 text-stone-400 absolute right-3 top-3.5" />
                  {manageQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setManageQuery('');
                        setManageBooking(null);
                        setManageSearched(false);
                      }}
                      className="absolute left-3 top-3.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleManageSearch}
                  disabled={manageLoading}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>{manageLoading ? 'جاري الاستعلام...' : 'استعلام عن الحجز'}</span>
                </button>
              </div>
            </div>

            {/* Manage Booking Results Card */}
            {manageBooking && (
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-md space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-stone-100 flex-wrap gap-3">
                  <div>
                    <span className="text-[10px] text-stone-400 block font-bold">رقم الحجز المعتمد:</span>
                    <strong className="text-xl font-mono text-[#B38A34]">{manageBooking.bookingCode}</strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 block font-bold mb-1">حالة الحجز الحالية:</span>
                    <span className={`text-xs px-3.5 py-1.5 rounded-full font-bold inline-flex items-center gap-1.5 ${
                      manageBooking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                      manageBooking.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                      manageBooking.status === 'completed' ? 'bg-stone-100 text-stone-800' :
                      manageBooking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {manageBooking.status === 'confirmed' ? '✓ تم تأكيد الحجز (مؤكد)' :
                       manageBooking.status === 'checked_in' ? '🛎️ تم التسكين واستلام الغرفة' :
                       manageBooking.status === 'completed' ? 'غادر الفندق (مكتمل المغادرة)' :
                       manageBooking.status === 'cancelled' ? 'ملغى' : 'قيد الانتظار (غير مؤكد)'}
                    </span>
                  </div>
                </div>

                {/* Room Number & Arrival Notice Rule */}
                {manageBooking.status === 'checked_in' && manageBooking.assignedRoomNumber ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-800 font-bold block">الغرفة المسكّنة بالفندق:</span>
                      <strong className="text-lg text-emerald-950 font-bold">غرفة رقم #{manageBooking.assignedRoomNumber}</strong>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                      تم التسكين بنجاح
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>ملاحظة وصول: يتم تحديد وتخصيص رقم الغرفة الفعلي عند وصولكم بالاستقبال وتسجيل الدخول.</span>
                  </div>
                )}

                {/* Digital Access Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#E6C673] font-bold block">رقم تأكيد الحجز والمفتاح الرقمي:</span>
                    {manageBooking.digitalKey ? (
                      <strong className="text-lg font-mono text-emerald-400 block mt-0.5">{manageBooking.digitalKey}</strong>
                    ) : (
                      <span className="text-xs text-amber-300 font-medium block mt-0.5">⏳ قيد الإصدار والاعتماد من مشرف الحجز</span>
                    )}
                  </div>

                  {manageBooking.digitalKey && (
                    <button
                      type="button"
                      onClick={() => handleCopyKey(manageBooking.digitalKey)}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedKey ? 'تم النسخ ✓' : 'نسخ المفتاح'}</span>
                    </button>
                  )}
                </div>

                {/* Details Breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-500">اسم النزيل:</span>
                    <span className="font-bold text-stone-900">{manageBooking.guestName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-500">الفندق:</span>
                    <span className="font-bold text-stone-900">{manageBooking.hotelName} ({manageBooking.hotelCity})</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-500">الغرفة والوجبات:</span>
                    <span className="font-bold text-stone-900">{manageBooking.roomName} • {manageBooking.mealPlanName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-500">التواريخ:</span>
                    <span className="font-bold text-stone-900">{manageBooking.checkIn} ➔ {manageBooking.checkOut} ({manageBooking.nights} ليالٍ)</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-bold text-stone-700">المبلغ الإجمالي:</span>
                    <span className="font-black text-[#B38A34] text-sm">{manageBooking.totalAmount.toLocaleString()} ر.س</span>
                  </div>
                </div>

                {/* Thank You / Review Note if Checked-in or Completed */}
                {(manageBooking.status === 'checked_in' || manageBooking.status === 'completed' || manageBooking.status === 'confirmed') && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                    <span className="font-bold text-amber-900 block">رسالة فندقية:</span>
                    <p className="text-stone-700 leading-relaxed">
                      سعداء بخدمتكم في {manageBooking.hotelName}. نسعى دائماً لتقديم أقصى درجات الضيافة والراحة. يسعدنا تقييمكم للإقامة عبر الموقع، وفي حال واجهتكم أي مشكلة أو رغبة بمساعدة يرجى التواصل فوراً مع موظف الاستقبال.
                    </p>
                  </div>
                )}

                <a
                  href={buildGuestWhatsAppShareLink(manageBooking, undefined, siteSettings)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>التواصل الفوري عبر الواتساب مع الفندق</span>
                </a>
              </div>
            )}

            {manageSearched && !manageBooking && !manageLoading && (
              <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-3xl border border-stone-200 shadow-sm">
                لم يتم العثور على حجز بالرقم "{manageQuery}". يرجى التأكد من كتابة رقم الهاتف أو الكود بشكل دقيق.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Embedded Room Booking Modal */}
      {bookingModalHotel && (
        <RoomBookingModal
          isOpen={Boolean(bookingModalHotel)}
          onClose={() => {
            setBookingModalHotel(null);
            setBookingModalRoomId(undefined);
            setBookingModalMealId(undefined);
          }}
          hotel={bookingModalHotel}
          preSelectedRoomId={bookingModalRoomId}
          preSelectedMealId={bookingModalMealId}
          siteSettings={siteSettings}
          onOpenTrackModal={(code) => {
            setBookingModalHotel(null);
            setActivePortalTab('manage');
            setManageQuery(code);
          }}
        />
      )}

      {/* Full-Screen Lightbox Modal for Hotel & Room Photos */}
      {lightboxImages && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxImages(null)}
        >
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
            <span className="text-xs font-bold font-mono bg-white/10 px-3 py-1.5 rounded-full">
              {lightboxIndex + 1} / {lightboxImages.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxImages(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Active Image */}
          <div 
            className="max-w-5xl max-h-[80vh] w-full flex items-center justify-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={lightboxImages[lightboxIndex]} 
              alt="صورة الفندق" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl select-none"
            />

            {/* Prev/Next Buttons */}
            {lightboxImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1))}
                  className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors backdrop-blur-sm"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0))}
                  className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors backdrop-blur-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails preview strip */}
          {lightboxImages.length > 1 && (
            <div 
              className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 overflow-x-auto py-2 no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 transition-all cursor-pointer border-2 ${
                    lightboxIndex === idx ? 'border-[#C9A24B] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
