import React from 'react';
import { MessageCircle } from 'lucide-react';
import { ContactChannel } from '../types';
import { getFirstActiveWhatsApp, getChannelHref } from '../utils/channels';
import { EditableText } from './EditableText';
import { useLanguage } from '../context/LanguageContext';

interface WhatsAppFABProps {
  currentHotelName?: string;
  channels?: ContactChannel[];
}

export const WhatsAppFAB: React.FC<WhatsAppFABProps> = ({ currentHotelName, channels }) => {
  const { language } = useLanguage();
  // Find first active WhatsApp channel
  const activeWhatsApp = getFirstActiveWhatsApp(channels);

  // If no active WhatsApp channel exists, automatically hide the FAB
  if (!activeWhatsApp) {
    return null;
  }

  const baseMessage = currentHotelName 
    ? (language === 'en'
        ? `Hello, I am interested in booking ${currentHotelName} via Prestige Hotels Management, and would like to inquire about rates and room availability.`
        : `السلام عليكم ورحمة الله وبركاته، أنا مهتم بحجز ${currentHotelName} عبر شركة برستيج لإدارة وتشغيل الفنادق، وأود الاستفسار عن الأسعار وتوافر الغرف.`)
    : (language === 'en'
        ? 'Hello, I am interested in booking a hotel in Makkah or Madinah for Hajj and Umrah accommodation.'
        : 'السلام عليكم ورحمة الله وبركاته، أنا مهتم بحجز فندق في مكة المكرمة أو المدينة المنورة لحجوزات الحج والعمرة.');

  const whatsappUrl = getChannelHref(activeWhatsApp, baseMessage);

  return (
    <aside
      aria-label={language === 'en' ? 'Chat via WhatsApp' : 'تواصل عبر واتساب'}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-2 group select-none pointer-events-auto"
    >
      <a
        id="floating-whatsapp-fab"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={language === 'en' ? `Chat via WhatsApp: ${activeWhatsApp.title}` : `تواصل عبر واتساب مباشرة: ${activeWhatsApp.title}`}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-transform duration-300 animate-wa-pulse relative shrink-0"
      >
        <MessageCircle className="w-8 h-8 fill-white text-[#25D366]" />

        {/* Small ping dot */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
          {language === 'en' ? '1' : '١'}
        </span>
      </a>

      {/* Visible Floating Label Chip on Desktop / Tablet */}
      <div className="hidden md:flex items-center px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#E8E2D8] text-stone-800 text-xs font-bold shadow-lg hover:border-[#25D366] transition-all">
        <EditableText
          contentKey="common.whatsapp.fabLabel"
          fallback={language === 'en' ? 'Chat on WhatsApp' : 'تواصل معنا على واتساب'}
          inline={true}
        />
      </div>

      {/* Tooltip on hover */}
      <div className="hidden sm:block md:hidden absolute right-full ml-0 mr-3 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-800 text-xs font-semibold whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <EditableText
          contentKey="common.whatsapp.fabTooltip"
          fallback={currentHotelName ? `تواصل لحجز ${currentHotelName}` : `${activeWhatsApp.title} (متاح 24/7)`}
          inline={true}
        />
      </div>
    </aside>
  );
};
