import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Key, 
  Calendar, 
  User, 
  Phone, 
  Utensils, 
  BedDouble, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  ExternalLink,
  Building2,
  Copy,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { RoomBooking, SiteSettings } from '../types';
import { getBookingByCodeOrPhone, buildGuestWhatsAppShareLink } from '../services/bookingService';
import { useLanguage } from '../context/LanguageContext';

interface TrackBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  siteSettings?: SiteSettings;
}

export const TrackBookingModal: React.FC<TrackBookingModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
  siteSettings
}) => {
  const { isRtl } = useLanguage();
  const [query, setQuery] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<RoomBooking | null>(null);
  const [searched, setSearched] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setQuery(initialCode);
      handleSearch(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setBooking(null);
      setSearched(false);
    }
  }, [isOpen]);

  const handleSearch = async (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!q) return;

    setLoading(true);
    setSearched(true);
    try {
      const found = await getBookingByCodeOrPhone(q);
      setBooking(found);
    } catch (err) {
      console.error(err);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'code' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const getStatusBadge = (status: RoomBooking['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>حجز مؤكد ومضمون ✓</span>
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Key className="w-3.5 h-3.5 text-blue-600" />
            <span>تم التسكين واستلام الغرفة</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-stone-500" />
            <span>حجز مكتمل</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            <span>ملغى</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>قيد المراجعة الفورية والتأكيد</span>
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#FCFBFA] w-full max-w-2xl max-h-[92vh] rounded-[32px] shadow-2xl border border-white/60 flex flex-col overflow-hidden relative"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/20 border border-[#C9A24B]/40 flex items-center justify-center text-[#E6C673]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-cairo text-white">
                إدارة ومراجعة الحجز الفندقي
              </h2>
              <p className="text-xs text-stone-400">
                استعلم عن حالة حجزك ومفتاح الغرفة الرقمي عبر كود الحجز أو رقم الهاتف
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Search Box */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="أدخل كود الحجز (مثال: PRS-8492) أو رقم الهاتف أو كود المفتاح..."
                className="w-full px-4 py-3 pr-10 rounded-2xl bg-white border border-stone-300 text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] shadow-2xs"
              />
              <Search className="w-4 h-4 text-stone-400 absolute top-3.5 right-3.5 pointer-events-none" />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>بحث</span>
              )}
            </button>
          </form>

          {/* Result Card */}
          {booking ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Status Header Bar */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-stone-400 block">حالة الحجز الحالية:</span>
                  <div className="mt-1">{getStatusBadge(booking.status)}</div>
                </div>

                <div className="text-right sm:text-left">
                  <span className="text-[10px] text-stone-400 block">تاريخ إصدار الحجز:</span>
                  <span className="text-xs font-semibold text-stone-700">
                    {new Date(booking.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>

              {/* Digital Access Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white shadow-xl border border-[#C9A24B]/30 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#E6C673]" />
                    <h3 className="text-sm font-bold text-white">{booking.hotelName}</h3>
                  </div>
                  <span className="text-[10px] bg-[#C9A24B]/20 text-[#E6C673] px-2.5 py-0.5 rounded-full font-bold">
                    {booking.hotelCity || 'المملكة العربية السعودية'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block">رقم الحجز المعتمد:</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <strong className="text-base font-mono text-[#E6C673]">{booking.bookingCode}</strong>
                      <button 
                        type="button"
                        onClick={() => handleCopy(booking.bookingCode, 'code')}
                        className="text-stone-400 hover:text-white cursor-pointer"
                        title="نسخ"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {copiedCode && <span className="text-[9px] text-emerald-400 block">تم النسخ ✓</span>}
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 block">رقم تأكيد الحجز والمفتاح الرقمي:</span>
                    {booking.digitalKey ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <strong className="text-base font-mono text-emerald-400">{booking.digitalKey}</strong>
                        <button 
                          type="button"
                          onClick={() => handleCopy(booking.digitalKey, 'key')}
                          className="text-stone-400 hover:text-white cursor-pointer"
                          title="نسخ"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-amber-300 font-medium">
                        <span>⏳ قيد الاعتماد من المشرف</span>
                      </div>
                    )}
                    {copiedKey && <span className="text-[9px] text-emerald-400 block">تم النسخ ✓</span>}
                  </div>
                </div>

                {booking.assignedRoomNumber && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-stone-300">رقم الغرفة المعينة بالفندق:</span>
                    <span className="font-bold text-white bg-white/10 px-3 py-1 rounded-lg">
                      غرفة رقم #{booking.assignedRoomNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Details List */}
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">اسم النزيل:</span>
                  <span className="font-bold text-stone-900">{booking.guestName}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">رقم الهاتف:</span>
                  <span className="font-bold text-stone-900" dir="ltr">{booking.guestPhone}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">نوع الغرفة:</span>
                  <span className="font-bold text-stone-900">{booking.roomName}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">نظام الوجبات:</span>
                  <span className="font-bold text-[#B38A34]">{booking.mealPlanName}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">تواريخ الإقامة:</span>
                  <span className="font-bold text-stone-900">
                    من {booking.checkIn} إلى {booking.checkOut} ({booking.nights} {booking.nights === 1 ? 'ليلة' : 'ليالٍ'})
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">عدد النزلاء والغرف:</span>
                  <span className="font-bold text-stone-900">
                    {booking.roomsCount} غرفة • {booking.adults} بالغين {booking.children > 0 ? `+ ${booking.children} أطفال` : ''}
                  </span>
                </div>

                <div className="flex justify-between pt-2 text-sm">
                  <span className="font-bold text-stone-700">إجمالي المبلغ:</span>
                  <span className="font-extrabold text-[#B38A34]">{booking.totalAmount.toLocaleString()} ر.س</span>
                </div>

                {booking.adminNotes && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] mt-2">
                    <strong>ملاحظات إدارة الفندق: </strong> {booking.adminNotes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <a 
                  href={buildGuestWhatsAppShareLink(booking, undefined, siteSettings)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>تواصل مع الفندق بالواتساب</span>
                </a>

                <button 
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الإيصال</span>
                </button>
              </div>
            </div>
          ) : searched ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-800">لم يتم العثور على حجز مطابق</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                يرجى التأكد من كتابة كود الحجز الصحيح (مثل PRS-8492) أو رقم الجوال المستخدم أثناء إتمام الحجز.
              </p>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-stone-400 space-y-2">
              <ShieldCheck className="w-8 h-8 text-[#C9A24B]/40 mx-auto" />
              <p>أدخل بيانات الحجز أعلاه للاطلاع المباشر على التذكرة الإلكترونية ومفتاح الدخول.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
