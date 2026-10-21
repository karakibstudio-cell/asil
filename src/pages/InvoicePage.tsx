import React, { useState, useEffect } from 'react';
import { RoomBooking, SiteSettings } from '../types';
import { getBookingByIdForInvoice } from '../services/bookingService';
import { InvoiceDocument } from '../components/InvoiceDocument';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  Home, 
  PhoneCall, 
  Building2, 
  MessageSquare,
  Lock,
  RefreshCw
} from 'lucide-react';

export interface InvoicePageProps {
  bookingId?: string;
  token?: string;
  siteSettings?: SiteSettings;
  onNavigateHome: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const InvoicePage: React.FC<InvoicePageProps> = ({
  bookingId,
  token,
  siteSettings,
  onNavigateHome,
  onShowToast
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [booking, setBooking] = useState<RoomBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId || !token) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const found = await getBookingByIdForInvoice(bookingId, token);
        if (!found) {
          setAccessDenied(true);
          return;
        }

        setBooking(found);
        setAccessDenied(false);
      } catch (err) {
        console.error('Failed loading booking invoice:', err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [bookingId, token]);

  const companyWhatsApp = siteSettings?.bookingModule?.companyWhatsApp || '+966544076726';
  const cleanPhone = companyWhatsApp.replace(/[^0-9]/g, '');

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 border-3 border-[#C9A24B] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-stone-900 font-cairo">
            {isEn ? 'Loading official invoice...' : 'جاري تحميل الفاتورة الرسمية وسند الحجز...'}
          </h2>
          <p className="text-xs text-stone-500">
            {isEn ? 'Verifying security token and booking records' : 'التحقق من رمز الحماية وسجلات الحجز المعتمدة'}
          </p>
        </div>
      </div>
    );
  }

  if (accessDenied || !booking) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-stone-200 text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-stone-900 font-cairo">
              {isEn ? 'Access Denied / Invalid Token' : 'غير مصرح بالدخول أو رمز التحقق غير صالح'}
            </h2>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
              {isEn 
                ? 'The security token is missing or incorrect. Public booking invoices can only be accessed using the secure personalized link sent to you.'
                : 'رمز الوصول السري غير متطابق. لحماية خصوصية النزلاء، لا يمكن استعراض بيانات الفاتورة إلا من خلال الرابط الشخصي المشفر المرسل لك.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                isEn 
                  ? `Hello Prestige Hotels, I need help accessing my booking invoice #${bookingId || ''}` 
                  : `السلام عليكم خدمة عملاء برستيج، أرجو تزويدي برابط فاتورة الحجز الخاص بي رقم ${bookingId || ''}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isEn ? 'Contact Customer Support' : 'طلب المساعدة عبر الواتساب'}</span>
            </a>

            <button
              onClick={onNavigateHome}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>{isEn ? 'Return to Home Page' : 'العودة للصفحة الرئيسية'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/70 py-8 px-4 sm:px-6">
      {/* Top Navigation Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between gap-3 print:hidden">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
        >
          {isEn ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          <span>{isEn ? 'Back to Prestige Website' : 'العودة لموقع برستيج'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span>{isEn ? 'Secured Public Invoice' : 'فاتورة إلكترونية مؤمنة'}</span>
          <span>🔒</span>
        </div>
      </div>

      {/* Invoice Document Component */}
      <InvoiceDocument
        booking={booking}
        siteSettings={siteSettings}
        lang={isEn ? 'en' : 'ar'}
        showActionsBar={true}
        onShowToast={onShowToast}
      />
    </div>
  );
};
