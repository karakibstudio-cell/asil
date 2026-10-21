import React, { useState, useMemo } from 'react';
import { RoomBooking, Hotel, SiteSettings } from '../types';
import { 
  OFFICIAL_WHATSAPP_TEMPLATES, 
  generateWhatsAppLink,
  WhatsAppTemplateParams 
} from '../utils/whatsappTemplates';
import { 
  X, 
  Copy, 
  Check, 
  CheckCircle2, 
  CreditCard, 
  ShieldCheck, 
  MapPin, 
  Wifi, 
  Star,
  ExternalLink,
  Sparkles,
  MessageSquare,
  Edit3
} from 'lucide-react';
import { WhatsAppIcon } from './BookingIcons';

interface WhatsAppTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: RoomBooking;
  hotel?: Hotel;
  siteSettings?: SiteSettings;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const WhatsAppTemplatesModal: React.FC<WhatsAppTemplatesModalProps> = ({
  isOpen,
  onClose,
  booking,
  hotel,
  siteSettings,
  onShowToast
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('booking_confirmation');
  const [copied, setCopied] = useState(false);

  // Custom editable fields for dynamic template values
  const [customDeposit, setCustomDeposit] = useState<number>(() => Math.round(booking.totalAmount * 0.3) || 300);
  const [customBank, setCustomBank] = useState<string>('مصرف الراجحي');
  const [customIban, setCustomIban] = useState<string>('SA0380000000000000000000');
  const [customReceived, setCustomReceived] = useState<number>(() => Math.round(booking.totalAmount * 0.3) || 300);
  const [customRoomNumber, setCustomRoomNumber] = useState<string>(booking.assignedRoomNumber || '305');
  const [customWifiPass, setCustomWifiPass] = useState<string>('Prestige@2026');
  const [customCheckInTime, setCustomCheckInTime] = useState<string>('04:00 عصراً');

  const activeTemplate = OFFICIAL_WHATSAPP_TEMPLATES[selectedTemplateId] || OFFICIAL_WHATSAPP_TEMPLATES.booking_confirmation;

  // Formatted Message based on current inputs
  const formattedMessage = useMemo(() => {
    const params: WhatsAppTemplateParams = {
      booking,
      hotel,
      siteSettings,
      depositAmount: customDeposit,
      bankName: customBank,
      iban: customIban,
      receivedAmount: customReceived,
      remainingAmount: Math.max(0, booking.totalAmount - customReceived),
      roomNumber: customRoomNumber,
      wifiPassword: customWifiPass,
      checkInTime: customCheckInTime,
      locationUrl: hotel?.location?.googleMapsUrl || hotel?.googleMapsUrl || 'https://maps.google.com',
      googleReviewUrl: hotel?.googleReviewUrl || hotel?.location?.googleMapsUrl || 'https://maps.google.com'
    };

    return activeTemplate.format(params);
  }, [
    activeTemplate, 
    booking, 
    hotel, 
    siteSettings, 
    customDeposit, 
    customBank, 
    customIban, 
    customReceived, 
    customRoomNumber, 
    customWifiPass, 
    customCheckInTime
  ]);

  const targetWhatsAppUrl = useMemo(() => {
    return generateWhatsAppLink(booking.guestPhone, formattedMessage);
  }, [booking.guestPhone, formattedMessage]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    if (onShowToast) onShowToast('تم نسخ نص الرسالة بنجاح', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (!targetWhatsAppUrl) {
      if (onShowToast) onShowToast('رقم هاتف العميل غير متوفر أو غير صالح', 'error');
      return;
    }
    window.open(targetWhatsAppUrl, '_blank', 'noopener,noreferrer');
  };

  const getTemplateIcon = (id: string) => {
    switch (id) {
      case 'booking_confirmation': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'deposit_request': return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'payment_received': return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'pre_arrival': return <MapPin className="w-4 h-4 text-purple-600" />;
      case 'welcome_wifi': return <Wifi className="w-4 h-4 text-teal-600" />;
      case 'post_checkout': return <Star className="w-4 h-4 text-amber-500" />;
      default: return <MessageSquare className="w-4 h-4 text-[#C9A24B]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/50 flex items-center justify-center text-[#25D366]">
              <WhatsAppIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cairo font-bold text-base text-white">قوالب واتساب الذكية المعتمدة</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-mono text-amber-300">
                  #{booking.bookingCode}
                </span>
              </div>
              <p className="text-[11px] text-stone-300 mt-0.5">
                إرسال رسائل موحدة ومجهزة ببيانات النزيل ({booking.guestName}) بنقرة واحدة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Split Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column: Template Selector List */}
          <div className="md:col-span-5 space-y-2 border-b md:border-b-0 md:border-l border-stone-200 pb-3 md:pb-0 md:pl-4">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              اختر القالب المناسب لحالة العميل:
            </span>

            <div className="space-y-1.5">
              {Object.values(OFFICIAL_WHATSAPP_TEMPLATES).map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`w-full p-2.5 rounded-2xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                        : 'bg-stone-50/60 hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getTemplateIcon(tmpl.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className={`block text-xs font-bold leading-snug ${isSelected ? 'text-emerald-950' : 'text-stone-900'}`}>
                        {tmpl.title}
                      </strong>
                      <span className="block text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                        {tmpl.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Context Settings (If deposit or room wifi selected) */}
            {selectedTemplateId === 'deposit_request' && (
              <div className="mt-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                <span className="font-bold text-amber-900 block text-[11px]">بيانات العربون والتحويل:</span>
                <div>
                  <label className="text-[10px] text-stone-600 block mb-0.5">قيمة العربون (ر.س):</label>
                  <input
                    type="number"
                    value={customDeposit}
                    onChange={(e) => setCustomDeposit(Number(e.target.value))}
                    className="w-full px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-600 block mb-0.5">اسم البنك:</label>
                  <input
                    type="text"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    className="w-full px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs"
                  />
                </div>
              </div>
            )}

            {selectedTemplateId === 'welcome_wifi' && (
              <div className="mt-3 p-3 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2 text-xs">
                <span className="font-bold text-teal-900 block text-[11px]">بيانات التسكين والإنترنت:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-600 block mb-0.5">رقم الغرفة:</label>
                    <input
                      type="text"
                      value={customRoomNumber}
                      onChange={(e) => setCustomRoomNumber(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg bg-white border border-teal-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-600 block mb-0.5">رمز الواي فاي:</label>
                    <input
                      type="text"
                      value={customWifiPass}
                      onChange={(e) => setCustomWifiPass(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg bg-white border border-teal-300 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Message Preview */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
                  <span>معاينة الرسالة الحية:</span>
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  إلى: {booking.guestPhone}
                </span>
              </div>

              {/* Chat Bubble Style Container */}
              <div className="p-3.5 rounded-2xl bg-[#EFEAE2] border border-[#D1D7DB] relative overflow-hidden shadow-inner font-sans text-xs leading-relaxed text-stone-900 whitespace-pre-wrap max-h-72 overflow-y-auto">
                {formattedMessage}
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="نسخ نص الرسالة إلى الحافظة"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الرسالة'}</span>
              </button>

              <button
                type="button"
                onClick={handleSend}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                title="فتح تطبيق واتساب محمل بالرسالة فوراً"
              >
                <WhatsAppIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>إرسال عبر واتساب العميل فوراً ➔</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
