import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Star, 
  ExternalLink, 
  Phone, 
  Calendar, 
  Users, 
  Check, 
  Send,
  Building,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Hotel, SiteSettings } from '../types';
import { BookingComIcon, AgodaIcon, ExpediaIcon, GoogleMapsIcon, WhatsAppIcon, EmailIcon } from './BookingIcons';
import { getFirstActiveWhatsApp, getChannelHref } from '../utils/channels';
import { sendContactMessage } from '../services/firebase';
import { useLanguage } from '../context/LanguageContext';

interface HotelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: Hotel;
  siteSettings?: SiteSettings;
  onSuccessToast?: (msg: string) => void;
}

export const HotelBookingModal: React.FC<HotelBookingModalProps> = ({
  isOpen,
  onClose,
  hotel,
  siteSettings,
  onSuccessToast
}) => {
  const { language, translateDynamic, isRtl } = useLanguage();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    rooms: '1',
    guests: '2',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  // WhatsApp Calculation
  const siteWhatsApp = getFirstActiveWhatsApp(siteSettings?.channels);
  const targetPhone = hotel.hotelWhatsApp || siteWhatsApp?.value || '+966501234567';
  const customMessage = language === 'en'
    ? `Hello, I would like to book an accommodation at *${hotel.nameEn || hotel.name}* (${translateDynamic(hotel.city)} - ${translateDynamic(hotel.district)} District) through Prestige Hotels Management.\nPlease provide available rates and confirmation.`
    : `السلام عليكم ورحمة الله، أود حجز إقامة في *${hotel.name}* (${hotel.city} - حي ${hotel.district}) عبر شركة برستيج لإدارة وتشغيل الفنادق.\nيرجى تزويدي بالأسعار المتاحة وتأكيد الحجز.`;
  const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
  const whatsAppHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`;

  // Default fallback URLs if not explicitly customized
  const bookingUrl = hotel.bookingUrl || `https://www.booking.com/searchresults.ar.html?ss=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`;
  const agodaUrl = hotel.agodaUrl || `https://www.agoda.com/search?text=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`;
  const expediaUrl = hotel.expediaUrl || `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`;
  const googleMapsUrl = hotel.googleMapsUrl || (hotel.location?.lat && hotel.location?.lng 
    ? `https://maps.google.com/?q=${hotel.location.lat},${hotel.location.lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`);

  const showBooking = hotel.showBookingUrl !== false;
  const showAgoda = hotel.showAgodaUrl !== false;
  const showExpedia = hotel.showExpediaUrl !== false && !!hotel.expediaUrl;
  const showMaps = hotel.showGoogleMapsUrl !== false;
  const showWhatsApp = hotel.showHotelWhatsApp !== false;
  const showEmail = hotel.showHotelEmail !== false && !!hotel.hotelEmail;

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSubmitting(true);

    try {
      await sendContactMessage({
        name: form.name,
        phone: form.phone,
        subject: `طلب حجز فندق: ${hotel.name}`,
        message: `طلب حجز جديد:\n- الفندق: ${hotel.name} (${hotel.city})\n- تاريخ الوصول: ${form.checkIn || 'غير محدد'}\n- تاريخ المغادرة: ${form.checkOut || 'غير محدد'}\n- عدد الغرف: ${form.rooms}\n- عدد النزلاء: ${form.guests}\n- ملاحظات: ${form.notes || 'لا يوجد'}`,
        hotelName: hotel.name,
        preferredCity: hotel.city,
        guestCount: parseInt(form.guests, 10) || 2
      });

      setSubmitted(true);
      if (onSuccessToast) {
        onSuccessToast('تم إرسال طلب الحجز بنجاح، سيتواصل معك فريق الحجوزات فوراً');
      }
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      id="hotel-booking-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="hotel-booking-modal-content"
        className="bg-white w-full max-w-2xl rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-auto animate-scaleUp"
      >
        {/* Header with Hotel Snapshot */}
        <div className="relative bg-stone-900 text-white p-5 sm:p-6 overflow-hidden">
          <img 
            src={hotel.mainImage} 
            alt={hotel.name}
            className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-xs" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/80 to-stone-900/60" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors z-10"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C9A24B]/30 text-[#DFBE72] text-[11px] font-bold border border-[#DFBE72]/30 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {translateDynamic(hotel.city)} - {language === 'en' ? `${translateDynamic(hotel.district)} District` : `حي ${hotel.district}`}
              </span>
              <div className="flex items-center gap-0.5">
                {[...Array(hotel.stars)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#DFBE72] text-[#DFBE72]" />
                ))}
              </div>
            </div>

            <h3 className="font-cairo font-bold text-xl sm:text-2xl text-white">
              {hotel.nameEn && language === 'en' ? hotel.nameEn : hotel.name}
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 flex items-center gap-2">
              <span>{translateDynamic(hotel.distanceText)}</span>
              <span>•</span>
              <span>{translateDynamic(hotel.location?.viewType || 'إطلالة مميزة')}</span>
            </p>
          </div>
        </div>

        {/* Modal Body: Direct Booking Channels & Platforms */}
        <div className="p-5 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section: Quick Direct Action Links */}
          <div>
            <h4 className="font-cairo font-bold text-sm text-stone-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B38A34]" />
              <span>{language === 'en' ? 'Direct Booking & Instant Contact' : 'خيارات التواصل والحجز المباشر والسريع'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp Booking (Primary) */}
              {showWhatsApp && (
                <a
                  id="modal-whatsapp-direct-btn"
                  href={whatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366] text-stone-900 hover:text-white border border-[#25D366]/30 hover:border-[#25D366] transition-all group shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <WhatsAppIcon className="w-5 h-5" />
                    </div>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <span className="font-cairo font-bold text-xs sm:text-sm block">
                        {language === 'en' ? 'Direct WhatsApp Booking' : 'حجز مباشر عبر الواتساب'}
                      </span>
                      <span className="text-[11px] text-stone-500 group-hover:text-white/90 block">
                        {language === 'en' ? 'Instant consultant confirmation' : 'تأكيد فوري مع خدمة العملاء'}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-white" />
                </a>
              )}

              {/* Booking.com Link */}
              {showBooking && (
                <a
                  id="modal-bookingcom-btn"
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#003580]/10 hover:bg-[#003580] text-stone-900 hover:text-white border border-[#003580]/30 hover:border-[#003580] transition-all group shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#003580] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <BookingComIcon className="w-5 h-5" />
                    </div>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <span className="font-cairo font-bold text-xs sm:text-sm block">
                        {language === 'en' ? 'Book via Booking.com' : 'حجز عبر Booking.com'}
                      </span>
                      <span className="text-[11px] text-stone-500 group-hover:text-white/90 block">
                        {language === 'en' ? 'View live rates & availability' : 'عرض الأسعار والتوافر'}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-white" />
                </a>
              )}

              {/* Agoda Link */}
              {showAgoda && (
                <a
                  id="modal-agoda-btn"
                  href={agodaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#5856D6]/10 hover:bg-[#5856D6] text-stone-900 hover:text-white border border-[#5856D6]/30 hover:border-[#5856D6] transition-all group shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#5856D6] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <AgodaIcon className="w-5 h-5" />
                    </div>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <span className="font-cairo font-bold text-xs sm:text-sm block">
                        {language === 'en' ? 'Book via Agoda' : 'حجز عبر Agoda'}
                      </span>
                      <span className="text-[11px] text-stone-500 group-hover:text-white/90 block">
                        {language === 'en' ? 'Agoda deals & discounts' : 'عروض وخصومات أجودا'}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-white" />
                </a>
              )}

              {/* Expedia Link */}
              {showExpedia && (
                <a
                  id="modal-expedia-btn"
                  href={expediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFCC00]/15 hover:bg-[#FFCC00] text-stone-900 hover:text-[#002244] border border-[#FFCC00]/40 hover:border-[#FFCC00] transition-all group shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFCC00] text-[#002244] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <ExpediaIcon className="w-5 h-5" />
                    </div>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <span className="font-cairo font-bold text-xs sm:text-sm block">
                        {language === 'en' ? 'Book via Expedia' : 'حجز عبر Expedia'}
                      </span>
                      <span className="text-[11px] text-stone-500 group-hover:text-[#002244]/80 block">
                        {language === 'en' ? 'Expedia global deals' : 'عروض إكسبيديا العالمية'}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-[#002244]" />
                </a>
              )}

              {/* Google Maps Location */}
              {showMaps && (
                <a
                  id="modal-google-maps-btn"
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 hover:bg-stone-800 text-stone-900 hover:text-white border border-stone-200 hover:border-stone-800 transition-all group shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <GoogleMapsIcon className="w-5 h-5" />
                    </div>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <span className="font-cairo font-bold text-xs sm:text-sm block">
                        {language === 'en' ? 'View on Google Maps' : 'موقع الفندق على خرائط جوجل'}
                      </span>
                      <span className="text-[11px] text-stone-500 group-hover:text-white/90 block">
                        {language === 'en' ? 'Directions to Haram courtyards' : 'عرض المسافة والاتجاهات للحرم'}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-white" />
                </a>
              )}

              {/* Direct Email Link */}
              {showEmail && (
                <a
                  id="modal-email-btn"
                  href={`mailto:${hotel.hotelEmail}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#EA4335]/10 hover:bg-[#EA4335] text-stone-900 hover:text-white border border-[#EA4335]/30 hover:border-[#EA4335] transition-all group shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EA4335] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <EmailIcon className="w-5 h-5" />
                    </div>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <span className="font-cairo font-bold text-xs sm:text-sm block">
                        {language === 'en' ? 'Direct Hotel Email' : 'البريد الإلكتروني المباشر'}
                      </span>
                      <span className="text-[11px] text-stone-500 group-hover:text-white/90 block">{hotel.hotelEmail}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-white" />
                </a>
              )}

              {/* Custom Direct Booking Link (if configured) */}
              {hotel.customBookingUrl && (
                <a
                  id="modal-custom-booking-btn"
                  href={hotel.customBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-2xl bg-[#C9A24B]/15 hover:bg-[#C9A24B] text-stone-900 hover:text-white border border-[#C9A24B]/40 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C9A24B] text-white flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <span className="font-cairo font-bold text-xs sm:text-sm block">
                        {hotel.customBookingTitle || (language === 'en' ? 'Official Direct Booking Link' : 'رابط الحجز المباشر الرسمي')}
                      </span>
                      <span className="text-[11px] text-stone-500 group-hover:text-white/90 block">
                        {language === 'en' ? 'Property direct booking site' : 'موقع الحجز المباشر للمنشأة'}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-white" />
                </a>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-stone-500 font-semibold">
                {language === 'en' ? 'Or Send Quick Booking Inquiry' : 'أو أرسل طلب حجز واستفسار سريع'}
              </span>
            </div>
          </div>

          {/* Quick Inquiry Form */}
          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-cairo font-bold text-base text-emerald-900 mb-1">
                {language === 'en' ? 'Booking inquiry submitted successfully!' : 'تم استلام طلب حجزك بنجاح!'}
              </h4>
              <p className="text-xs text-emerald-700">
                {language === 'en'
                  ? 'Our booking team will contact you shortly to confirm stay details.'
                  : 'سيتواصل معك مستشار الحجوزات في أقرب وقت لتأكيد تفاصيل الإقامة.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitInquiry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Full Name: *' : 'الاسم الكريم: *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={language === 'en' ? 'e.g. John Doe' : 'مثال: محمد عبدالله'}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Mobile / WhatsApp: *' : 'رقم الهاتف / الواتساب: *'}
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+966 50 000 0000"
                    className={`w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] ${isRtl ? 'text-right' : 'text-left'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Check-in:' : 'الوصول:'}
                  </label>
                  <input
                    type="date"
                    value={form.checkIn}
                    onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Check-out:' : 'المغادرة:'}
                  </label>
                  <input
                    type="date"
                    value={form.checkOut}
                    onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Rooms:' : 'الغرف:'}
                  </label>
                  <select
                    value={form.rooms}
                    onChange={(e) => setForm({ ...form, rooms: e.target.value })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  >
                    <option value="1">{language === 'en' ? '1 Room' : '١ غرفة'}</option>
                    <option value="2">{language === 'en' ? '2 Rooms' : '٢ غرف'}</option>
                    <option value="3">{language === 'en' ? '3 Rooms' : '٣ غرف'}</option>
                    <option value="4+">{language === 'en' ? '4+ Rooms / Group' : '٤+ غرف / حملة'}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Guests:' : 'النزلاء:'}
                  </label>
                  <select
                    value={form.guests}
                    onChange={(e) => setForm({ ...form, guests: e.target.value })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  >
                    <option value="1">{language === 'en' ? '1 Guest' : '١ فرد'}</option>
                    <option value="2">{language === 'en' ? '2 Guests' : '٢ أفراد'}</option>
                    <option value="4">{language === 'en' ? '4 Guests' : '٤ أفراد'}</option>
                    <option value="6+">{language === 'en' ? 'Family / Large Group' : 'عائلة / وفد كبير'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  {language === 'en' ? 'Notes or Special Requests (optional):' : 'ملاحظات أو طلبات خاصة (اختياري):'}
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder={language === 'en' ? 'e.g. King bed, Kaaba view, high floor...' : 'مثال: سرير مزدوج، إطلالة على الحرم، طابق مرتفع...'}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting
                    ? (language === 'en' ? 'Sending inquiry...' : 'جاري الإرسال...')
                    : (language === 'en' ? 'Submit Booking Inquiry' : 'إرسال طلب الحجز والاستفسار')}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
