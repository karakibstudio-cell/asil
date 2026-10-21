import React, { useState, useEffect, useRef } from 'react';
import { RoomBooking, SiteSettings } from '../types';
import QRCode from 'qrcode';
import { 
  X, 
  Download, 
  Printer, 
  Share2, 
  Check, 
  MapPin, 
  Clock, 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  Compass, 
  Layers, 
  Copy,
  Mail,
  Send,
  Loader2
} from 'lucide-react';
import { getInvoiceUrl } from '../utils/routing';
import { sendBookingEmailViaAppsScript } from '../services/emailService';

interface ExpressCheckInModalProps {
  booking: RoomBooking;
  siteSettings?: SiteSettings;
  onClose: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ExpressCheckInModal: React.FC<ExpressCheckInModalProps> = ({
  booking,
  siteSettings,
  onClose,
  onShowToast
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const confirmationCode = booking.confirmationCode || (booking.digitalKey ? booking.digitalKey.slice(-4) : '4892');
  const invoiceUrl = getInvoiceUrl(booking.id, booking.token);
  const verificationPayload = `${window.location.origin}/#/invoice?id=${booking.id}&token=${booking.token || ''}&express=1`;
  const companyPhone = siteSettings?.bookingModule?.companyWhatsApp || siteSettings?.bookingModule?.bookingWhatsApp || '+966544076726';

  // Generate QR Code
  useEffect(() => {
    QRCode.toDataURL(verificationPayload, {
      width: 320,
      margin: 1,
      color: {
        dark: '#1c1917',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate QR:', err));
  }, [verificationPayload]);

  // Labels for preferences
  const viewLabels: Record<string, string> = {
    haram: 'إطلالة على الحرم الشريف',
    panoramic: 'إطلالة بانورامية مميزة',
    city: 'إطلالة على المدينة',
    quiet: 'إطلالة هادئة مريحة',
    any: 'حسب التوفر عند التسكين'
  };

  const floorLabels: Record<string, string> = {
    high: 'طابق علوي مرتفع',
    mid: 'طابق متوسط',
    low: 'طابق أرضي / منخفض لسهولة الحركة',
    any: 'حسب التوفر'
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.bookingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const res = await sendBookingEmailViaAppsScript(booking, undefined, siteSettings);
      if (res.success) {
        setEmailSent(true);
        onShowToast?.(`تم إرسال بطاقة التسكين إلى ${booking.guestEmail || 'بريدك'} بنجاح`, 'success');
      } else {
        onShowToast?.(res.error || 'تعذر إرسال البريد حالياً', 'error');
      }
    } catch {
      onShowToast?.('تعذر إرسال البريد', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `السلام عليكم ورحمة الله وبركاته،\nبطاقة التسكين السريع المعتمدة بفندق ${booking.hotelName}:\n` +
      `• رقم الحجز: #${booking.bookingCode}\n` +
      `• كود التأكيد السريع: ${confirmationCode}\n` +
      `• اسم النزيل: ${booking.guestName}\n` +
      `• تاريخ الوصول: ${booking.checkIn}\n` +
      `• تاريخ المغادرة: ${booking.checkOut}\n` +
      `• نوع الغرفة: ${booking.roomName}\n` +
      `• الإجمالي: ${booking.totalAmount.toLocaleString()} ر.س (الدفع عند الوصول)\n\n` +
      `رابط الفاتورة وسند التسكين الرقمي بالـ QR:\n${invoiceUrl}`;
    
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const { downloadInvoicePdf } = await import('../utils/pdfGenerator');
      await downloadInvoicePdf(cardRef.current, `Prestige-Express-CheckIn-${booking.bookingCode}.pdf`);
      onShowToast?.('تم تحميل بطاقة الصعود وسند التسكين بنجاح', 'success');
    } catch (err) {
      console.error(err);
      onShowToast?.('فشل تحميل الملف', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.hotelName + ' ' + (booking.hotelCity || 'مكة المكرمة'))}`;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir="rtl"
    >
      <div className="relative w-full max-w-xl my-6 bg-stone-900 border border-[#C9A24B]/40 rounded-3xl shadow-2xl overflow-hidden text-stone-100 animate-scaleUp">
        
        {/* Top Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-all border border-stone-700/60"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable & Downloadable Card Area */}
        <div ref={cardRef} className="p-6 sm:p-8 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950">
          
          {/* Header Seal & Brand */}
          <div className="text-center pb-6 border-b border-stone-800/80 relative">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-[#C9A24B]/15 border border-[#C9A24B]/30 text-[#E0C070] text-xs font-bold mb-3 tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>بطاقة صعود فندقية رقمية • Express Check-in Pass</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              شركة برستيج لإدارة وتشغيل الفنادق
            </h2>
            <p className="text-xs text-[#C9A24B] mt-1 font-medium">
              Prestige Hotels & Resorts • الضيافة الفندقية الفاخرة
            </p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-xs text-stone-400">فندق:</span>
              <span className="text-base sm:text-lg font-extrabold text-white">
                {booking.hotelName}
              </span>
              <span className="text-xs text-stone-400">({booking.hotelCity || 'مكة المكرمة'})</span>
            </div>
          </div>

          {/* QR Code & Pin Section (Boarding Pass Hero) */}
          <div className="my-6 p-5 sm:p-6 bg-stone-800/40 rounded-2xl border border-stone-700/60 backdrop-blur-xl flex flex-col sm:flex-row items-center gap-6 justify-between">
            {/* QR Box */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-2.5 bg-white rounded-2xl shadow-xl shadow-black/40 border-2 border-[#C9A24B]/50 flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Check-in QR Code" className="w-36 h-36 sm:w-40 sm:h-40 rounded-lg object-contain" />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-stone-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-bold text-stone-400">
                امسح الرمز ضوئياً عند الاستقبال للتسكين الفوري
              </span>
            </div>

            {/* Verification Numbers */}
            <div className="flex-1 space-y-4 text-center sm:text-right w-full">
              <div className="bg-stone-900/80 p-3.5 rounded-xl border border-stone-800">
                <span className="text-[11px] text-stone-400 block mb-0.5">رمز الحجز المرجعي:</span>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xl sm:text-2xl font-black text-[#E0C070] font-mono tracking-wider">
                    #{booking.bookingCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                    title="نسخ الرمز"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-xl">
                <span className="text-[11px] text-emerald-300 block mb-0.5 font-bold">كود التحقق السريع للاستقبال:</span>
                <span className="text-2xl font-black text-emerald-400 font-mono tracking-widest">
                  {confirmationCode}
                </span>
              </div>

              <div className="text-[11px] text-stone-400 flex items-center justify-center sm:justify-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>حجز موثق ومؤكد عبر نظام برستيج السحابي</span>
              </div>
            </div>
          </div>

          {/* Guest and Stay Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-stone-900/60 rounded-2xl border border-stone-800 text-xs">
            <div>
              <span className="text-stone-400 block mb-0.5">اسم النزيل:</span>
              <span className="font-bold text-white text-sm truncate block">{booking.guestName}</span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">نوع الغرفة:</span>
              <span className="font-bold text-white truncate block">{booking.roomName}</span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">عدد الغرف:</span>
              <span className="font-bold text-white">{booking.roomsCount} غرفة</span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">تاريخ الوصول:</span>
              <span className="font-bold text-emerald-400">{booking.checkIn}</span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">تاريخ المغادرة:</span>
              <span className="font-bold text-stone-300">{booking.checkOut}</span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">مدة الإقامة:</span>
              <span className="font-bold text-white">{booking.nights} ليالٍ</span>
            </div>
          </div>

          {/* Preferences Badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {booking.preferredView && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-800/80 border border-stone-700 text-stone-200">
                <Compass className="w-3.5 h-3.5 text-[#C9A24B]" />
                <span>الإطلالة: {viewLabels[booking.preferredView] || booking.preferredView}</span>
              </div>
            )}
            {booking.preferredFloor && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-800/80 border border-stone-700 text-stone-200">
                <Layers className="w-3.5 h-3.5 text-[#C9A24B]" />
                <span>الطابق: {floorLabels[booking.preferredFloor] || booking.preferredFloor}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              <span>تسكين سريع مسبق (10 ثوانٍ)</span>
            </div>
          </div>

          {/* Financial summary bar */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 border border-[#C9A24B]/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-400 block">المبلغ الإجمالي المستحق:</span>
              <span className="text-xl sm:text-2xl font-black text-[#E0C070] font-mono">
                {booking.totalAmount.toLocaleString()} ر.س
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              الدفع عند الوصول بالفندق
            </span>
          </div>

          {/* 24h Policy Note */}
          <div className="mt-4 p-3 rounded-xl bg-orange-950/30 border border-orange-500/30 text-center">
            <p className="text-[11px] text-orange-300 font-medium leading-relaxed">
              ⚠️ <strong>تنبيه الإدارة:</strong> في حال عدم التواصل وتأكيد الحجز خلال 24 ساعة، يعتبر الحجز ملغياً تلقائياً.
            </p>
          </div>

          {/* Location link */}
          <div className="mt-4 text-center">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#C9A24B] hover:text-[#E0C070] underline font-medium"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>عرض موقع الفندق على خرائط Google Maps</span>
            </a>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 flex flex-wrap items-center justify-center sm:justify-between gap-3">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#25D366]/20 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة واتساب</span>
            </button>

            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSendingEmail || emailSent}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                emailSent 
                  ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-300' 
                  : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-200'
              }`}
            >
              {isSendingEmail ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : emailSent ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Mail className="w-3.5 h-3.5 text-[#C9A24B]" />
              )}
              <span>{emailSent ? 'تم الإرسال للبريد' : 'إرسال للبريد'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#C9A24B]" />}
              <span>حفظ السند (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 text-xs flex items-center justify-center gap-1.5 transition-all"
              title="طباعة"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
