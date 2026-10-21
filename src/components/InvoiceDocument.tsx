import React, { useRef, useState } from 'react';
import { RoomBooking, SiteSettings } from '../types';
import { 
  Printer, 
  Download, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  Building2, 
  CreditCard,
  ShieldCheck, 
  Share2,
  MessageSquare
} from 'lucide-react';

import QRCode from 'qrcode';

export interface InvoiceDocumentProps {
  booking: RoomBooking;
  siteSettings?: SiteSettings;
  lang?: 'ar' | 'en';
  showActionsBar?: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  booking,
  siteSettings,
  lang = 'ar',
  showActionsBar = true,
  onShowToast
}) => {
  const isEn = lang === 'en';
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Metadata and Dynamic Settings fallbacks
  const bookingMod = siteSettings?.bookingModule;
  const invoiceCompanyName = bookingMod?.invoiceCompanyName || (isEn ? 'Prestige Hotels Management' : 'شركة برستيج لإدارة وتشغيل الفنادق');
  const invoiceCompanySubtitle = bookingMod?.invoiceCompanySubtitle || (isEn ? 'Luxury Hospitality & Umrah Services' : 'للضيافة الفندقية وإدارة الإيواء السياحي بمكة والمدينة');
  const invoiceCompanyAddress = bookingMod?.invoiceCompanyAddress || (isEn ? 'Makkah Al-Mukarramah - Kingdom of Saudi Arabia' : 'مكة المكرمة - المملكة العربية السعودية');
  
  const showCr = bookingMod?.showInvoiceCr !== false;
  const crNumber = bookingMod?.invoiceCrNumber || '4031258941';
  
  const showTax = bookingMod?.showInvoiceTaxNo !== false;
  const taxNumber = bookingMod?.invoiceTaxNumber || '310458921400003';

  // Support / Footer Contacts
  const showFooterSupport = bookingMod?.showInvoiceSupportFooter !== false;
  const supportTitle = bookingMod?.invoiceSupportTitle || (isEn ? 'Prestige Hospitality Group • Kingdom of Saudi Arabia' : 'مجموعة برستيج الفندقية • المملكة العربية السعودية');
  const supportName = bookingMod?.invoiceSupportName || (isEn ? 'Reservations Department' : 'إدارة الحجوزات والمبيعات');
  const supportPhone = bookingMod?.invoiceSupportPhone || bookingMod?.companyWhatsApp || bookingMod?.bookingWhatsApp || '+966544076726';
  const supportEmail = bookingMod?.invoiceSupportEmail || bookingMod?.bookingEmail || 'prestigeksa.umrah@gmail.com';

  const invoiceNumber = booking.invoiceNumber || `INV-${booking.bookingCode || '2026'}`;
  const confirmationCode = booking.confirmationCode || (booking.digitalKey ? booking.digitalKey.replace(/[^0-9]/g, '').slice(-4) : '1344');
  const policy = booking.policySnapshot;

  const invoicePublicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#/invoice?id=${booking.id}&token=${booking.token || ''}`
    : `https://prestige-hotels.com/#/invoice?id=${booking.id}`;

  React.useEffect(() => {
    QRCode.toDataURL(invoicePublicUrl, {
      width: 160,
      margin: 1,
      color: {
        dark: '#1c1917',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(() => {});
  }, [invoicePublicUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const fileName = `Prestige-Invoice-${booking.bookingCode}.pdf`;
      const { downloadInvoicePdf } = await import('../utils/pdfGenerator');
      await downloadInvoicePdf(invoiceRef.current, fileName);
      onShowToast?.(isEn ? 'PDF downloaded successfully' : 'تم تحميل الفاتورة بصيغة PDF بنجاح', 'success');
    } catch (err) {
      console.error('Failed generating PDF:', err);
      onShowToast?.(isEn ? 'Failed to generate PDF' : 'فشل إنشاء ملف PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = isEn
      ? `Hello, here is my confirmed booking invoice #${booking.bookingCode} at ${booking.hotelName}.\nTotal: ${(Number(booking.totalAmount) || 0).toLocaleString()} SAR\nView & Download Invoice PDF: ${invoicePublicUrl}`
      : `السلام عليكم، تفاصيل فاتورة وسند الحجز المعتمد #${booking.bookingCode} بفندق ${booking.hotelName}.\nالمبلغ الإجمالي: ${(Number(booking.totalAmount) || 0).toLocaleString()} ر.س (الدفع عند الوصول)\nكود التأكيد: ${confirmationCode}\nرابط الفاتورة وسند الحجز الإلكتروني PDF:\n${invoicePublicUrl}`;
    
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareEmail = () => {
    const subject = isEn
      ? `Booking Invoice #${booking.bookingCode} - ${booking.hotelName}`
      : `فاتورة وسند حجز فندقي #${booking.bookingCode} - ${booking.hotelName}`;
    const body = isEn
      ? `Dear Guest,\n\nPlease find your booking invoice #${booking.bookingCode} for your stay at ${booking.hotelName}.\nDates: ${booking.checkIn} to ${booking.checkOut}\nTotal: ${(Number(booking.totalAmount) || 0).toLocaleString()} SAR\n\nView and download your official invoice:\n${invoicePublicUrl}\n\nPrestige Hotels Management`
      : `السيد/ة ${booking.guestName} المحترم،\n\nمرفق تفاصيل فاتورة وسند حجزكم المعتمد رقم #${booking.bookingCode} بفندق ${booking.hotelName}.\nتاريخ الوصول: ${booking.checkIn}\nتاريخ المغادرة: ${booking.checkOut}\nكود التأكيد: ${confirmationCode}\nإجمالي المبلغ: ${(Number(booking.totalAmount) || 0).toLocaleString()} ر.س (الدفع عند الوصول)\n\nيمكنكم استعراض وتحميل الفاتورة بصيغة PDF عبر الرابط التالي:\n${invoicePublicUrl}\n\nمع تحيات شركة برستيج لإدارة وتشغيل الفنادق`;

    const mailto = `mailto:${booking.guestEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  // Status Badge Label
  const getStatusMeta = () => {
    switch (booking.status) {
      case 'confirmed':
        return {
          label: isEn ? 'Confirmed & Guaranteed' : 'مؤكد ومعتمد رسمياً',
          bg: '#ECFDF5',
          color: '#065F46',
          border: '#A7F3D0',
          dot: '#059669'
        };
      case 'checked_in':
        return {
          label: isEn ? 'Checked-In' : 'تم التسكين واستلام الغرفة',
          bg: '#EFF6FF',
          color: '#1E40AF',
          border: '#BFDBFE',
          dot: '#2563EB'
        };
      case 'completed':
        return {
          label: isEn ? 'Stay Completed' : 'إقامة مكتملة',
          bg: '#F5F5F4',
          color: '#44403C',
          border: '#E7E5E4',
          dot: '#78716C'
        };
      case 'cancelled':
        return {
          label: isEn ? 'Cancelled' : 'حجز ملغى',
          bg: '#FEF2F2',
          color: '#991B1B',
          border: '#FECACA',
          dot: '#DC2626'
        };
      case 'pending_confirmation':
      case 'pending':
      default:
        return {
          label: isEn ? 'Pending Confirmation' : 'بانتظار التأكيد',
          bg: '#FFFBEB',
          color: '#92400E',
          border: '#FDE68A',
          dot: '#D97706'
        };
    }
  };

  const statusMeta = getStatusMeta();
  const logoSrc = siteSettings?.logoUrl || '/images/brand/logo.png';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. TOP ACTIONS TOOLBAR (Hidden in print) */}
      {showActionsBar && (
        <div className="print:hidden bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span 
              style={{ 
                backgroundColor: statusMeta.bg, 
                color: statusMeta.color, 
                borderColor: statusMeta.border 
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
            >
              <span style={{ backgroundColor: statusMeta.dot }} className="w-2 h-2 rounded-full" />
              <span>{statusMeta.label}</span>
            </span>
            <span className="text-xs text-stone-500 font-mono font-bold">
              #{booking.bookingCode}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* WhatsApp Share */}
            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title={isEn ? 'Share via WhatsApp' : 'إرسال ومشاركة عبر الواتساب'}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isEn ? 'WhatsApp' : 'واتساب'}</span>
            </button>

            {/* Email Share */}
            <button
              onClick={handleShareEmail}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isEn ? 'Share via Email' : 'إرسال عبر البريد الإلكتروني'}
            >
              <Mail className="w-4 h-4 text-stone-600" />
              <span>{isEn ? 'Email' : 'إيميل'}</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-stone-600" />
              <span>{isEn ? 'Print' : 'طباعة'}</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              type="button"
              className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? (isEn ? 'Generating...' : 'جاري الإنشاء...') : (isEn ? 'Download PDF' : 'تحميل PDF')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. THE OFFICIAL INVOICE & VOUCHER DOCUMENT CANVAS */}
      <div 
        ref={invoiceRef}
        id="prestige-invoice-paper"
        dir={isEn ? 'ltr' : 'rtl'}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          border: '1px solid #E7E5E4',
          padding: '36px 40px',
          color: '#1C1917',
          fontFamily: isEn ? "'Plus Jakarta Sans', system-ui, sans-serif" : "'Cairo', 'IBM Plex Sans Arabic', system-ui, sans-serif",
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
          lineHeight: '1.6'
        }}
        className="print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* ── TOP HEADER ROW ── */}
        <div style={{ borderBottom: '1px solid #E7E5E4', paddingBottom: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            
            {/* Top Right: Company Branding & Official Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div 
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '18px', 
                  backgroundColor: '#FAF5EB', 
                  border: '1px solid #E6D5A7', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '4px',
                  flexShrink: 0
                }}
              >
                <img 
                  src={logoSrc} 
                  alt="Prestige Hotels" 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<span style="font-size: 28px; font-weight: 900; color: #98752B; font-family: serif;">P</span>';
                    }
                  }}
                />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1C1917', fontFamily: "'Cairo', sans-serif", letterSpacing: '-0.3px' }}>
                  {invoiceCompanyName}
                </h1>
                {invoiceCompanySubtitle && (
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', fontWeight: 600, color: '#98752B' }}>
                    {invoiceCompanySubtitle}
                  </p>
                )}
                {invoiceCompanyAddress && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#57534E', fontWeight: 500 }}>
                    {invoiceCompanyAddress}
                  </p>
                )}
                {(showCr || showTax) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '11px', color: '#78716C', fontFamily: 'monospace' }}>
                    {showCr && <span>{isEn ? `CR: ${crNumber}` : `س.ت: ${crNumber}`}</span>}
                    {showCr && showTax && <span>•</span>}
                    {showTax && <span>{isEn ? `Tax No: ${taxNumber}` : `الرقم الضريبي: ${taxNumber}`}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Top Left: Invoice & Booking Metadata Box with QR Code */}
            <div 
              style={{ 
                backgroundColor: '#FAFAF9', 
                border: '1px solid #E7E5E4', 
                borderRadius: '16px', 
                padding: '12px 18px', 
                minWidth: '260px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                textAlign: isEn ? 'left' : 'right'
              }}
            >
              {qrDataUrl && (
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                  <img 
                    src={qrDataUrl} 
                    alt="Booking QR Verification" 
                    style={{ width: '70px', height: '70px', borderRadius: '8px', border: '1px solid #E7E5E4', display: 'block' }} 
                  />
                  <span style={{ fontSize: '9px', color: '#78716C', display: 'block', marginTop: '3px', fontWeight: 700 }}>
                    {isEn ? 'Scan to Verify' : 'تحقق إلكتروني'}
                  </span>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: '#78716C', fontWeight: 600 }}>{isEn ? 'Invoice No:' : 'رقم الفاتورة:'}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1C1917' }}>{invoiceNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: '#78716C', fontWeight: 600 }}>{isEn ? 'Booking Ref:' : 'مرجع الحجز:'}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#98752B' }}>#{booking.bookingCode}</span>
                </div>
                {confirmationCode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontSize: '12px', marginBottom: '5px' }}>
                    <span style={{ color: '#78716C', fontWeight: 600 }}>{isEn ? 'Confirm Code:' : 'كود التأكيد:'}</span>
                    <span style={{ 
                      fontFamily: 'monospace', 
                      fontWeight: 800, 
                      color: '#065F46', 
                      backgroundColor: '#D1FAE5', 
                      padding: '2px 8px', 
                      borderRadius: '6px', 
                      border: '1px solid #A7F3D0',
                      fontSize: '12px'
                    }}>
                      {confirmationCode}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#78716C', paddingTop: '5px', borderTop: '1px solid #E7E5E4' }}>
                  <span>{isEn ? 'Date:' : 'التاريخ:'}</span>
                  <span style={{ fontFamily: 'monospace', color: '#1C1917', fontWeight: 600 }}>
                    {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString(isEn ? 'en-US' : 'ar-SA') : new Date().toLocaleDateString(isEn ? 'en-US' : 'ar-SA')}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── MIDDLE ROW: GUEST & HOTEL CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          
          {/* Right Card: Primary Guest Details */}
          <div style={{ backgroundColor: '#FAFAF9', border: '1px solid #E7E5E4', borderRadius: '16px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#98752B', marginBottom: '8px' }}>
              {isEn ? 'Primary Guest Details' : 'بيانات النزيل الرئيسي'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1C1917', marginBottom: '8px' }}>
              {booking.guestName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#44403C', fontFamily: 'monospace', direction: 'ltr', justifyContent: isEn ? 'flex-start' : 'flex-end', marginBottom: '4px' }}>
              <span>{booking.guestPhone}</span>
              <Phone style={{ width: '14px', height: '14px', color: '#A8A29E' }} />
            </div>
            {booking.guestEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#44403C', fontFamily: 'monospace', direction: 'ltr', justifyContent: isEn ? 'flex-start' : 'flex-end' }}>
                <span>{booking.guestEmail}</span>
                <Mail style={{ width: '14px', height: '14px', color: '#A8A29E' }} />
              </div>
            )}
          </div>

          {/* Left Card: Hotel & Destination Details */}
          <div style={{ backgroundColor: '#FAFAF9', border: '1px solid #E7E5E4', borderRadius: '16px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#98752B', marginBottom: '8px' }}>
              {isEn ? 'Hotel & Property' : 'الفندق والوجهة'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800, color: '#1C1917', marginBottom: '6px' }}>
              <Building2 style={{ width: '18px', height: '18px', color: '#C9A24B', flexShrink: 0 }} />
              <span>{booking.hotelName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#57534E', marginBottom: '4px' }}>
              <MapPin style={{ width: '14px', height: '14px', color: '#A8A29E', flexShrink: 0 }} />
              <span>{booking.hotelCity ? `${booking.hotelCity} - المملكة العربية السعودية` : 'مكة المكرمة - المملكة العربية السعودية'}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#78716C' }}>
              {isEn ? 'Operated by Prestige Hospitality Group' : 'إدارة وتشغيل مجموعة برستيج الفندقية'}
            </div>
          </div>

        </div>

        {/* ── 4 SUMMARY STAT PILLS ── */}
        <div 
          style={{ 
            backgroundColor: '#FFFDF9', 
            border: '1px solid #FDE68A', 
            borderRadius: '18px', 
            padding: '12px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', textAlign: 'center' }}>
            {/* 1. Check In */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #FEF3C7', borderRadius: '14px', padding: '10px 8px' }}>
              <div style={{ fontSize: '11px', color: '#78716C', marginBottom: '4px' }}>{isEn ? 'Check-In' : 'تاريخ الوصول'}</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1C1917', fontFamily: 'monospace' }}>{booking.checkIn}</div>
              <div style={{ fontSize: '10px', color: '#A8A29E', marginTop: '2px' }}>{policy?.checkInTime || '16:00 عصراً (Check-in)'}</div>
            </div>

            {/* 2. Check Out */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #FEF3C7', borderRadius: '14px', padding: '10px 8px' }}>
              <div style={{ fontSize: '11px', color: '#78716C', marginBottom: '4px' }}>{isEn ? 'Check-Out' : 'تاريخ المغادرة'}</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1C1917', fontFamily: 'monospace' }}>{booking.checkOut}</div>
              <div style={{ fontSize: '10px', color: '#A8A29E', marginTop: '2px' }}>{policy?.checkOutTime || '12:00 ظهراً (Check-out)'}</div>
            </div>

            {/* 3. Nights & Rooms */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #FEF3C7', borderRadius: '14px', padding: '10px 8px' }}>
              <div style={{ fontSize: '11px', color: '#78716C', marginBottom: '4px' }}>{isEn ? 'Nights & Rooms' : 'الليالي والغرف'}</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1C1917' }}>
                {booking.nights} {booking.nights === 1 ? (isEn ? 'Night' : 'ليلة') : (isEn ? 'Nights' : 'ليالٍ')}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#98752B', marginTop: '2px' }}>
                {booking.roomsCount} {booking.roomsCount === 1 ? (isEn ? 'Room' : 'غرفة') : (isEn ? 'Rooms' : 'غرف')}
              </div>
            </div>

            {/* 4. Guests & Meals */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #FEF3C7', borderRadius: '14px', padding: '10px 8px' }}>
              <div style={{ fontSize: '11px', color: '#78716C', marginBottom: '4px' }}>{isEn ? 'Guests & Meals' : 'النزلاء والوجبات'}</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1C1917' }}>
                {booking.adults} {isEn ? 'Adults' : 'بالغين'}{booking.children > 0 ? ` + ${booking.children}` : ''}
              </div>
              <div style={{ fontSize: '10px', color: '#57534E', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={booking.mealPlanName}>
                {booking.mealPlanName || (isEn ? 'Room Only (No Meals)' : 'إقامة فقط (بدون وجبات)')}
              </div>
            </div>
          </div>
        </div>

        {/* ── ITEMIZED PRICING & BREAKDOWN TABLE ── */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', fontWeight: 800, color: '#1C1917' }}>
            <CreditCard style={{ width: '16px', height: '16px', color: '#C9A24B' }} />
            <span>{isEn ? 'Pricing Breakdown & Charges' : 'تفاصيل التسعير والرسوم'}</span>
          </div>

          <div style={{ border: '1px solid #E7E5E4', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isEn ? 'left' : 'right' }}>
              <thead style={{ backgroundColor: '#FAFAF9', borderBottom: '1px solid #E7E5E4', color: '#57534E', fontSize: '11px', fontWeight: 700 }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: isEn ? 'left' : 'right' }}>{isEn ? 'Item / Description' : 'البند / البيان'}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>{isEn ? 'Qty / Nights' : 'العدد / الليالي'}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>{isEn ? 'Unit Rate' : 'سعر الوحدة'}</th>
                  <th style={{ padding: '12px 16px', textAlign: isEn ? 'right' : 'left' }}>{isEn ? 'Total (SAR)' : 'المجموع (ر.س)'}</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '12px', color: '#1C1917' }}>
                {/* Rooms Line */}
                {(() => {
                  const bNights = Math.max(1, Number(booking.nights) || 1);
                  const bRooms = Math.max(1, Number(booking.roomsCount) || 1);
                  const bRate = Number(booking.roomPricePerNight) || 0;
                  const bRoomsCost = Number(booking.priceBreakdown?.roomsCost ?? (bRate * bNights * bRooms)) || 0;
                  const unitRate = Math.round(bRoomsCost / (bNights * bRooms));

                  return (
                    <tr style={{ borderBottom: '1px solid #F5F5F4' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#1C1917' }}>{booking.roomName || 'غرفة فندقية فاخرة'}</div>
                        <div style={{ fontSize: '11px', color: '#78716C', marginTop: '2px' }}>
                          {bRooms} {isEn ? 'room(s)' : 'غرفة'} × {bNights} {isEn ? 'night(s)' : 'ليلة'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{bNights}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{unitRate.toLocaleString()} ر.س</td>
                      <td style={{ padding: '14px 16px', textAlign: isEn ? 'right' : 'left', fontFamily: 'monospace', fontWeight: 800, color: '#1C1917' }}>
                        {bRoomsCost.toLocaleString()} ر.س
                      </td>
                    </tr>
                  );
                })()}

                {/* Meals Line (if selected) */}
                {Number(booking.mealPlanPrice) > 0 && (() => {
                  const bNights = Math.max(1, Number(booking.nights) || 1);
                  const bAdults = Math.max(1, Number(booking.adults) || 1);
                  const bChildren = Number(booking.children) || 0;
                  const bGuests = bAdults + bChildren;
                  const mPrice = Number(booking.mealPlanPrice) || 0;
                  const bMealsCost = Number(booking.priceBreakdown?.mealsCost ?? (mPrice * bGuests * bNights)) || 0;

                  return (
                    <tr style={{ borderBottom: '1px solid #F5F5F4' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#1C1917' }}>{booking.mealPlanName || 'خطة الوجبات'}</div>
                        <div style={{ fontSize: '11px', color: '#78716C', marginTop: '2px' }}>
                          {bGuests} {isEn ? 'guest(s)' : 'نزيل'} × {bNights} {isEn ? 'night(s)' : 'ليلة'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{bGuests * bNights}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{mPrice.toLocaleString()} ر.س</td>
                      <td style={{ padding: '12px 16px', textAlign: isEn ? 'right' : 'left', fontFamily: 'monospace', fontWeight: 800, color: '#1C1917' }}>
                        {bMealsCost.toLocaleString()} ر.س
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>

            {/* Total Summary Footer */}
            <div style={{ backgroundColor: '#FAFAF9', padding: '14px 18px', borderTop: '1px solid #E7E5E4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#57534E', marginBottom: '8px' }}>
                <span>{isEn ? 'Value Added Tax (15%):' : 'ضريبة القيمة المضافة (١٥٪):'}</span>
                <span style={{ fontWeight: 700, color: '#1C1917' }}>{isEn ? 'Included in total' : 'شاملة في الإجمالي المحدد'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #E7E5E4' }}>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#1C1917', fontFamily: "'Cairo', sans-serif" }}>
                    {isEn ? 'Grand Total Due:' : 'المبلغ الإجمالي المستحق:'}
                  </span>
                  <div style={{ fontSize: '11px', color: '#78716C', marginTop: '2px' }}>
                    {isEn ? 'Pay upon arrival at reception' : 'الدفع عند الوصول في الاستقبال'}
                  </div>
                </div>
                <div style={{ textAlign: isEn ? 'right' : 'left' }}>
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#98752B', fontFamily: 'monospace' }}>
                    {(Number(booking.totalAmount) || 0).toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── OFFICIAL POLICY & TERMS SNAPSHOT ── */}
        <div style={{ border: '1px solid #E7E5E4', borderRadius: '16px', backgroundColor: '#FAFAF9', padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, color: '#1C1917', marginBottom: '12px' }}>
            <ShieldCheck style={{ width: '16px', height: '16px', color: '#059669' }} />
            <span>{isEn ? 'Official Booking & Cancellation Policy' : 'شروط الحجز وسياسة الإلغاء المعتمدة'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', fontSize: '11px', lineHeight: 1.7, color: '#57534E' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#1C1917', marginBottom: '4px' }}>
                {isEn ? 'Cancellation & Refund Policy:' : 'سياسة الإلغاء والاسترداد:'}
              </div>
              <div>
                {policy?.cancellationPolicyAr || 'إلغاء مجاني ومرن متاح بالكامل حتى 48 ساعة قبل موعد تسجيل الوصول. في حال الإلغاء خلال أقل من 48 ساعة أو عدم الحضور يتم خصم قيمة الليلة الأولى.'}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 800, color: '#1C1917', marginBottom: '4px' }}>
                {isEn ? 'Check-in & Entry Requirements:' : 'متطلبات تسجيل الوصول والدخول:'}
              </div>
              <div>
                {policy?.termsAr || 'يلزم تقديم أصل بطاقة الهوية الوطنية أو الإقامة أو جواز السفر لجميع النزلاء المقيمين عند تسجيل الوصول. تطبق لائحة وزارة السياحة والضيافة في المملكة العربية السعودية على جميع الحجوزات.'}
              </div>
            </div>
          </div>

          {booking.specialRequests && (
            <div style={{ paddingTop: '10px', marginTop: '10px', borderTop: '1px solid #E7E5E4', fontSize: '11px' }}>
              <strong style={{ color: '#1C1917' }}>{isEn ? 'Special Requests:' : 'طلبات خاصة:'} </strong>
              <span style={{ color: '#57534E' }}>{booking.specialRequests}</span>
            </div>
          )}
        </div>

        {/* ── FOOTER & VERIFICATION STAMP ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', paddingTop: '16px', borderTop: '1px solid #E7E5E4' }}>
          {/* Certified Stamp Badge */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            border: '1px solid #6EE7B7', 
            backgroundColor: '#ECFDF5', 
            padding: '8px 14px', 
            borderRadius: '12px',
            color: '#065F46'
          }}>
            <CheckCircle2 style={{ width: '16px', height: '16px', color: '#059669' }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800 }}>{isEn ? 'Certified Electronic Voucher' : 'سند حجز إلكتروني معتمد'}</div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#059669' }}>#{booking.bookingCode}</div>
            </div>
          </div>

          {/* Company Info */}
          {showFooterSupport && (
            <div style={{ textAlign: isEn ? 'right' : 'left', fontSize: '11px', color: '#78716C' }}>
              <div style={{ fontWeight: 800, color: '#1C1917', marginBottom: '2px' }}>
                {supportTitle}
              </div>
              <div>
                {isEn ? (
                  <span>
                    Customer Support: {supportName ? `${supportName} • ` : ''}
                    <span dir="ltr">{supportPhone}</span> • {supportEmail}
                  </span>
                ) : (
                  <span>
                    خدمة العملاء والحجوزات: {supportName ? `${supportName} - ` : ''}
                    <span dir="ltr">{supportPhone}</span> • {supportEmail}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
