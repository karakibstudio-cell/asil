import React, { useRef, useState, useEffect } from 'react';
import { RoomBooking, SiteSettings } from '../types';
import { Printer, X, Download, MessageSquare, FileText, Mail, Check, Loader2 } from 'lucide-react';
import { InvoiceDocument } from './InvoiceDocument';
import { buildGuestWhatsAppShareLink } from '../services/bookingService';
import { sendBookingEmailViaAppsScript } from '../services/emailService';

interface BookingVoucherModalProps {
  booking: RoomBooking;
  siteSettings?: SiteSettings;
  onClose: () => void;
}

export const BookingVoucherModal: React.FC<BookingVoucherModalProps> = ({
  booking,
  siteSettings,
  onClose
}) => {
  const voucherRef = useRef<HTMLDivElement>(null);
  const voucherModalRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const res = await sendBookingEmailViaAppsScript(booking, undefined, siteSettings);
      if (res.success) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!voucherRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const { downloadInvoicePdf } = await import('../utils/pdfGenerator');
      await downloadInvoicePdf(voucherRef.current, `Prestige-Invoice-${booking.bookingCode}.pdf`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Keyboard Navigation: Tab to navigate, Esc to close, Enter to download PDF
  useEffect(() => {
    const timer = setTimeout(() => {
      if (voucherModalRef.current) {
        voucherModalRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Enter') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'BUTTON' || target.tagName === 'A')) {
          return;
        }
        e.preventDefault();
        handleDownloadPdf();
        return;
      }

      if (e.key === 'Tab' && voucherModalRef.current) {
        const focusableElements = voucherModalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements).filter((el): el is HTMLElement => (el as HTMLElement).offsetParent !== null);
        if (focusable.length > 0) {
          const firstElement = focusable[0];
          const lastElement = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === firstElement || document.activeElement === voucherModalRef.current) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn no-print-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={voucherModalRef}
        tabIndex={-1}
        className="bg-white w-full max-w-4xl rounded-[28px] shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[95vh] focus:outline-none"
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/20 text-[#E6C673] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-cairo">سند وفاتورة الحجز المعتمدة (PDF)</h3>
              <p className="text-[11px] text-stone-400">سند رسمي معتمد جاهز للطباعة والتحميل كملف PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Keyboard Shortcuts Hint */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-stone-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl font-mono">
              <span className="text-[#E6C673] font-bold">Tab</span> تنقل • <span className="text-[#E6C673] font-bold">Enter</span> تحميل • <span className="text-[#E6C673] font-bold">Esc</span> إغلاق
            </div>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-stone-400" />
              <span>طباعة</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'جاري...' : 'تحميل PDF'}</span>
            </button>

            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail || emailSent}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                emailSent
                  ? 'bg-emerald-800 text-emerald-200'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
              }`}
              title="إرسال سند الحجز إلى البريد الإلكتروني"
            >
              {isSendingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C9A24B]" />
              ) : emailSent ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Mail className="w-4 h-4 text-[#C9A24B]" />
              )}
              <span className="hidden sm:inline">{emailSent ? 'تم الإرسال' : 'إيميل'}</span>
            </button>

            <a
              href={buildGuestWhatsAppShareLink(booking, undefined, siteSettings)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">واتساب</span>
            </a>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-[#FAF9F5] print:p-0 print:bg-white flex-1" ref={voucherRef}>
          <InvoiceDocument
            booking={booking}
            siteSettings={siteSettings}
            lang="ar"
            showActionsBar={false}
          />
        </div>

        {/* Modal Bottom Footer (Hidden when printing) */}
        <div className="p-3.5 bg-stone-100 border-t border-stone-200 flex items-center justify-between print:hidden shrink-0">
          <span className="text-xs text-stone-500">
            كود السند المعتمد: <strong className="font-mono text-stone-800">#{booking.bookingCode}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-stone-200 text-stone-700 font-bold text-xs border border-stone-200 transition-colors cursor-pointer"
            >
              إغلاق
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-[#E6C673] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة السند</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
