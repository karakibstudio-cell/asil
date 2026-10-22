import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Hotel, SiteSettings, ActivePage, RoomBooking } from '../types';
import { getBookingByCodeOrPhone, buildGuestWhatsAppShareLink } from '../services/bookingService';
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
  ExternalLink, 
  PhoneCall, 
  Copy, 
  Check, 
  AlertCircle,
  Clock,
  ChevronDown,
  Calendar,
  MapPin,
  Star,
  Users,
  RotateCcw,
  BedDouble,
  ArrowRight,
  Filter,
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { INITIAL_HOTELS } from '../data/mockHotels';

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
  onSelectHotel,
  initialHotelId
}) => {
  const { isRtl } = useLanguage();
  const isCreationAllowed = siteSettings?.bookingModule?.allowPublicBookingCreation !== false;

  // Immediate fallback to INITIAL_HOTELS ensures 0ms render without null state
  const availableHotels = useMemo(() => {
    return (hotels && hotels.length > 0) ? hotels : INITIAL_HOTELS;
  }, [hotels]);

  // Read URL search params for prefill
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

  // Date and Search Bar State
  const [searchCheckIn, setSearchCheckIn] = useState<string>(defaultCheckInDate);
  const [searchCheckOut, setSearchCheckOut] = useState<string>(defaultCheckOutDate);
  const [hotelSearchQuery, setHotelSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<'all' | 'مكة المكرمة' | 'المدينة المنورة'>('all');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isUpdatingSearch, setIsUpdatingSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'wizard' | 'grid'>('wizard');

  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
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

  // Active hotels
  const activeHotels = useMemo(() => {
    return availableHotels.filter(h => h.isActive !== false);
  }, [availableHotels]);

  // Smart default hotel selection
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
    // Prefer Prestige Ajyad or first active hotel with online booking
    const ajyad = availableHotels.find(h => 
      (h.name.includes('أجياد') || h.name.includes('اجياد') || h.id.includes('ajyad')) &&
      h.onlineBookingEnabled !== false && h.isActive !== false
    );
    if (ajyad) return ajyad;
    const online = availableHotels.find(h => h.onlineBookingEnabled !== false && h.isActive !== false);
    return online || availableHotels[0];
  }, [availableHotels, prefillHotel]);

  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(defaultHotel);

  useEffect(() => {
    if (defaultHotel && (!selectedHotel || selectedHotel.id !== defaultHotel.id)) {
      setSelectedHotel(defaultHotel);
    }
  }, [defaultHotel]);

  // Real-time letter-by-letter matching hotels
  const matchedHotels = useMemo(() => {
    return activeHotels.filter(h => {
      if (selectedCity !== 'all' && h.city !== selectedCity) return false;
      if (!hotelSearchQuery.trim()) return true;
      const q = hotelSearchQuery.trim().toLowerCase();
      const nameAr = h.name.toLowerCase();
      const nameEn = (h.nameEn || '').toLowerCase();
      const district = (h.district || '').toLowerCase();
      const city = h.city.toLowerCase();
      return nameAr.includes(q) || nameEn.includes(q) || district.includes(q) || city.includes(q);
    });
  }, [activeHotels, selectedCity, hotelSearchQuery]);

  // Filter for hotels where admin enabled online booking
  const onlineAvailableHotels = useMemo(() => {
    return matchedHotels.filter(h => h.onlineBookingEnabled !== false && h.isActive !== false);
  }, [matchedHotels]);

  // Tab: 'book' vs 'manage'
  const [activeTab, setActiveTab] = useState<'book' | 'manage'>(() => {
    if (prefillManageCode) return 'manage';
    return isCreationAllowed ? 'book' : 'manage';
  });

  // Manage Booking Tab State
  const [manageQuery, setManageQuery] = useState(prefillManageCode);
  const [manageBooking, setManageBooking] = useState<RoomBooking | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageSearched, setManageSearched] = useState(false);
  const [copiedField, setCopiedField] = useState<'code' | 'key' | null>(null);
  const [manageVoucher, setManageVoucher] = useState<RoomBooking | null>(null);

  // Auto-search if code was in URL
  useEffect(() => {
    if (prefillManageCode) {
      handleSearchBooking(prefillManageCode);
    }
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

  const copyToClipboard = (text: string, field: 'code' | 'key') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle Search & Refresh Button
  const handleTriggerSearch = () => {
    setIsUpdatingSearch(true);
    setIsSearchDropdownOpen(false);
    setTimeout(() => {
      setIsUpdatingSearch(false);
      // If the current selected hotel is not among online available, pick the first matched
      if (onlineAvailableHotels.length > 0) {
        const stillSelected = onlineAvailableHotels.find(h => h.id === selectedHotel?.id);
        if (!stillSelected) {
          setSelectedHotel(onlineAvailableHotels[0]);
        }
      }
    }, 350);
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

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-stone-900 font-cairo pt-24 pb-16" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Expansive Top Hero Section */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A24B]/15 text-[#8C6D23] text-xs font-bold border border-[#C9A24B]/30 backdrop-blur-md shadow-2xs">
          <Sparkles className="w-4 h-4 text-[#B38A34]" />
          <span>منظومة الحجوزات الفندقية الذكية والمباشرة</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight">
          {activeTab === 'book'
            ? 'احجز إقامتك الفاخرة بجوار الحرمين الشريفين'
            : 'إدارة ومتابعة الحجز الفندقي والمفتاح الرقمي'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-3xl mx-auto leading-relaxed">
          {activeTab === 'book'
            ? 'استعرض الفنادق المتاحة لحظياً، حدد التواريخ واحجز مباشرة بأفضل سعر معتمد وبدون أي عمولات أو وسطاء.'
            : 'استعلم برقم الحجز أو رقم الجوال للاطلاع على تفاصيل إقامتك، كود التسكين الذكي، وتحميل سند الحجز الرسمي.'}
        </p>

        {/* Tab Switcher: Book Room vs Manage Booking */}
        <div className="pt-2 flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-stone-200 shadow-xs gap-2">
            {isCreationAllowed && (
              <button
                type="button"
                onClick={() => setActiveTab('book')}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'book'
                    ? 'bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>حجز فندقي جديد</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'manage'
                  ? 'bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#F4B400]" />
              <span>إدارة ومتابعة حجز</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* TAB 1: LUXURY SEARCH BAR & BOOKING FLOW                                   */}
        {/* ========================================================================= */}
        {activeTab === 'book' && (
          <div className="space-y-6 animate-fadeIn">
            {/* ── UNIFIED LUXURY SEARCH BAR (Apple Glassmorphism Design) ── */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-[#C9A24B]/30 shadow-lg relative z-20">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-extrabold text-stone-900 font-cairo">
                      ابحث وحدد فترة الإقامة بالفندق
                    </span>
                    <span className="text-[11px] text-stone-500 font-normal">
                      يعرض فقط الفنادق المتاحة فعلياً وفق إمكانية الإدارة لمنع أي حجز زائد
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

              {/* Main Fields Grid */}
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

                {/* 3. Hotel Search Bar (Real-Time Autocomplete as visitor types letters) */}
                <div className="md:col-span-4 relative" ref={searchDropdownRef}>
                  <div className="bg-stone-50/90 hover:bg-stone-50 p-3 rounded-2xl border border-stone-200 h-full flex flex-col justify-between">
                    <label className="text-[11px] font-bold text-stone-600 block mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#C9A24B]" />
                        <span>اسم الفندق (تابع للأحرف)</span>
                      </span>
                      {selectedHotel && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200 truncate max-w-[140px]">
                          ✓ {selectedHotel.name}
                        </span>
                      )}
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
                        placeholder={selectedHotel ? selectedHotel.name : "اكتب اسم الفندق (مثال: برستيج، أجياد)..."}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 pl-8 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                      />
                      <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      {hotelSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setHotelSearchQuery('')}
                          className="absolute left-8 top-2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Real-time Matching Dropdown List */}
                  {isSearchDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-200 p-2 z-50 max-h-80 overflow-y-auto animate-fadeIn">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-stone-100 text-[11px] text-stone-500 font-bold">
                        <span>الفنادق المطابقة للأحرف ({matchedHotels.length}):</span>
                        <span className="text-[10px] text-[#B38A34]">اضغط لاختيار الفندق</span>
                      </div>

                      {matchedHotels.length === 0 ? (
                        <div className="p-4 text-center text-xs text-stone-500">
                          لا توجد فنادق مطابقة للبحث. جرب كتابة اسم آخر.
                        </div>
                      ) : (
                        <div className="divide-y divide-stone-100">
                          {matchedHotels.map(h => {
                            const isOnline = h.onlineBookingEnabled !== false && h.isActive !== false;
                            const isSelected = selectedHotel?.id === h.id;

                            return (
                              <button
                                key={h.id}
                                type="button"
                                onClick={() => {
                                  setSelectedHotel(h);
                                  setHotelSearchQuery(h.name);
                                  setIsSearchDropdownOpen(false);
                                  setViewMode('wizard');
                                }}
                                className={`w-full p-2.5 rounded-xl text-right flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                  isSelected 
                                    ? 'bg-[#C9A24B]/15 text-[#8C6D23]' 
                                    : 'hover:bg-stone-50 text-stone-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={h.mainImage}
                                    alt={h.name}
                                    className="w-10 h-10 rounded-lg object-cover shrink-0 bg-stone-100 border border-stone-200"
                                  />
                                  <div className="min-w-0 text-right">
                                    <strong className="text-xs font-bold block truncate">
                                      {h.name}
                                    </strong>
                                    <span className="text-[10px] text-stone-500 block truncate">
                                      {h.city} • حي {h.district}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-left shrink-0">
                                  {isOnline ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 block">
                                      متاح أونلاين ✓
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-stone-100 text-stone-500 block">
                                      واتساب فقط
                                    </span>
                                  )}
                                  <div className="flex items-center justify-end gap-0.5 text-amber-400 mt-1">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    <span className="text-[10px] text-stone-700 font-bold">{h.stars ?? 5}</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Search & Update Button */}
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

              {/* View Mode Toggle: Selected Hotel Wizard vs Explore Available Hotels */}
              <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2 text-stone-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    الفنادق المتاحة للحجز أونلاين: <strong>{onlineAvailableHotels.length} فندقاً</strong>
                  </span>
                  <span className="text-stone-300">•</span>
                  <span>المدة: <strong>{nightsCount} {nightsCount === 1 ? 'ليلة' : 'ليالٍ'}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'wizard' ? 'grid' : 'wizard')}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-[#C9A24B]/15 hover:text-[#8C6D23] text-stone-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>
                      {viewMode === 'wizard' 
                        ? 'استعراض كل الفنادق المتاحة في شبكة ⊞' 
                        : 'العودة لخطوات حجز الفندق الحالي ←'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── VIEW MODE 1: GRID OF ALL AVAILABLE HOTELS MATCHING SEARCH ── */}
            {viewMode === 'grid' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 font-cairo">
                    الفنادق المتاحة للحجز المباشر في الفترة المحددة:
                  </h3>
                  <span className="text-xs text-stone-500">
                    اضغط على أي فندق لفتح خطوات الحجز فوراً
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {onlineAvailableHotels.map((h) => {
                    const isSelected = selectedHotel?.id === h.id;
                    const isMakkah = h.city === 'مكة المكرمة';

                    return (
                      <div
                        key={h.id}
                        className={`rounded-3xl border bg-white overflow-hidden transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                          isSelected 
                            ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/30' 
                            : 'border-stone-200'
                        }`}
                      >
                        <div>
                          {/* Image */}
                          <div className="relative aspect-video bg-stone-100">
                            <img
                              src={h.mainImage}
                              alt={h.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/20">
                                {isMakkah ? '🕋 مكة' : '🕌 المدينة'}
                              </span>
                              {h.featured && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A24B] text-white shadow-xs">
                                  مميز ★
                                </span>
                              )}
                            </div>
                            <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-stone-800 flex items-center gap-1 shadow-2xs">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{h.stars ?? 5} نجوم</span>
                              <span className="text-stone-400">• {h.rating || 4.8}</span>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-4 space-y-2">
                            <h4 className="font-bold text-sm sm:text-base text-stone-900 truncate">
                              {h.name}
                            </h4>
                            <p className="text-xs text-stone-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#B38A34] shrink-0" />
                              <span>حي {h.district} {h.distanceText ? `• ${h.distanceText}` : ''}</span>
                            </p>
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs">
                              <span className="text-emerald-800 font-bold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>متاح أونلاين وفق خطة الإدارة</span>
                              </span>
                              <span className="text-[11px] text-stone-500 font-mono">
                                {nightsCount} ليالٍ
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Action */}
                        <div className="p-4 pt-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHotel(h);
                              setViewMode('wizard');
                            }}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                : 'bg-[#C9A24B] hover:bg-[#B38A34] text-white shadow-2xs'
                            }`}
                          >
                            <span>{isSelected ? 'الفندق المختار حالياً ✓' : 'احجز الآن بهذا الفندق ⚡'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── VIEW MODE 2: ACTIVE HOTEL WIZARD ── */}
            {viewMode === 'wizard' && (
              <div className="space-y-4">
                {/* Active Selected Hotel Banner */}
                {selectedHotel && (
                  <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedHotel.mainImage}
                        alt={selectedHotel.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-200 shadow-2xs"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-[#B38A34] font-bold">الفندق المختار لإتمام الحجز:</span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            {selectedHotel.city}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-cairo font-extrabold text-stone-900">
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
                      className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#B38A34]" />
                      <span>تغيير الفندق أو استعراض البدائل</span>
                    </button>
                  </div>
                )}

                {/* Render High-Performance 3-Step Booking Wizard */}
                {selectedHotel ? (
                  <BookingFlow
                    hotel={selectedHotel}
                    allHotels={activeHotels}
                    initialCheckIn={searchCheckIn}
                    initialCheckOut={searchCheckOut}
                    initialRooms={prefillRooms}
                    initialAdults={prefillAdults}
                    initialChildren={prefillChildren}
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
        {/* TAB 2: MANAGE & TRACK BOOKING                                             */}
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

            {/* Results */}
            {manageBooking ? (
              <div className="space-y-5 pt-4 border-t border-stone-100 animate-fadeIn">
                {/* Status Card */}
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

                {/* Digital Key & Booking Code Card */}
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

                {/* Details Breakdown */}
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

                {/* Actions */}
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
