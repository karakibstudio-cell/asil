import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronDown
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
    // Prefer Prestige Ajyad or first active hotel
    const ajyad = availableHotels.find(h => 
      h.name.includes('أجياد') || 
      h.name.includes('اجياد') || 
      h.id.includes('ajyad')
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

  const activeHotels = useMemo(() => {
    return availableHotels.filter(h => h.isActive !== false);
  }, [availableHotels]);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-stone-900 font-cairo pt-24 pb-16" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C9A24B]/15 text-[#8C6D23] text-xs font-bold border border-[#C9A24B]/30 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>منظومة الحجوزات الفندقية الذكية والمباشرة</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          {activeTab === 'book'
            ? 'احجز إقامتك الفاخرة بجوار الحرمين الشريفين'
            : 'إدارة ومتابعة الحجز الفندقي والمفتاح الرقمي'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {activeTab === 'book'
            ? 'حجز سريع في ٣ خطوات واضحة، تأكيد فوري بالواتساب، إصدار سند الحجز الرقمي، وأفضل سعر مباشر بدون عمولات.'
            : 'استعلم برقم الحجز أو رقم الجوال للاطلاع على تفاصيل إقامتك، كود التسكين الذكي، وتحميل سند الحجز الرسمي.'}
        </p>

        {/* Tab Switcher: Book Room vs Manage Booking */}
        <div className="pt-2 flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-stone-200 shadow-sm gap-2">
            {isCreationAllowed && (
              <button
                type="button"
                onClick={() => setActiveTab('book')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
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
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* ========================================================================= */}
        {/* TAB 1: 3-STEP ONLINE BOOKING FLOW                                         */}
        {/* ========================================================================= */}
        {activeTab === 'book' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Quick Hotel Switcher Bar */}
            {activeHotels.length > 1 && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 border border-stone-200/80 shadow-xs flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
                  <Building2 className="w-4 h-4 text-[#C9A24B]" />
                  <span>الفندق المحدد للحجز:</span>
                </div>
                <div className="relative flex-1 max-w-sm">
                  <select
                    value={selectedHotel?.id || ''}
                    onChange={(e) => {
                      const h = activeHotels.find(x => x.id === e.target.value);
                      if (h) setSelectedHotel(h);
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    {activeHotels.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.city}) {h.onlineBookingEnabled !== false ? '• متاح أونلاين ✓' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Render High-Performance 3-Step Booking Wizard */}
            {selectedHotel ? (
              <BookingFlow
                hotel={selectedHotel}
                allHotels={activeHotels}
                initialCheckIn={prefillCheckIn}
                initialCheckOut={prefillCheckOut}
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
                <p className="text-sm font-bold text-stone-600">جاري تحميل الفندق...</p>
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
