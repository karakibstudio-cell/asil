import { 
  ActionButtonItem, 
  ActionButtonPosition, 
  ActivePage, 
  ContactDirectoryItem 
} from '../types';
import { buildWhatsAppLink } from './channels';

/**
 * Standard default Contacts Directory (دليل جهات الاتصال المركزي المعتمد)
 */
export const DEFAULT_CONTACTS_DIRECTORY: ContactDirectoryItem[] = [
  {
    id: 'cnt_reception',
    name: 'هاتف الاستقبال المباشر',
    nameEn: 'Direct Reception Desk',
    roleTag: 'استقبال 24/7',
    roleTagEn: '24/7 Reception',
    phone: '+966560580250',
    whatsapp: '+966560580250',
    email: 'info@prestigehotels.sa',
    workingHours: 'على مدار الساعة 24/7',
    workingHoursEn: '24/7 Around the clock',
    isActive: true,
    order: 1
  },
  {
    id: 'cnt_housing_consultant',
    name: 'مستشار التسكين المعتمد',
    nameEn: 'Certified Housing Advisor',
    roleTag: 'استشارات وتسكين',
    roleTagEn: 'Housing Consultant',
    phone: '+966560580250',
    whatsapp: '+966560580250',
    email: 'consultant@prestigehotels.sa',
    workingHours: 'على مدار الساعة 24/7',
    workingHoursEn: '24/7 Dedicated Support',
    isActive: true,
    order: 2
  },
  {
    id: 'cnt_bookings_manager',
    name: 'مسؤول الحجوزات والتسكين الفوري',
    nameEn: 'Instant Bookings Manager',
    roleTag: 'حجوزات فورية',
    roleTagEn: 'Direct Bookings',
    phone: '+966560580250',
    whatsapp: '+966560580250',
    email: 'prestigeksa.umrah@gmail.com',
    workingHours: 'على مدار الساعة 24/7',
    workingHoursEn: '24/7 Around the clock',
    isActive: true,
    order: 3
  },
  {
    id: 'cnt_inquiries',
    name: 'خدمة العملاء والاستفسارات العامة',
    nameEn: 'Customer Care & General Inquiries',
    roleTag: 'خدمة العملاء',
    roleTagEn: 'Customer Support',
    phone: '+966560580250',
    whatsapp: '+966560580250',
    email: 'info@prestigehotels.sa',
    workingHours: 'على مدار الساعة 24/7',
    workingHoursEn: '24/7 Around the clock',
    isActive: true,
    order: 4
  },
  {
    id: 'cnt_makkah_hq',
    name: 'فرع مكة المكرمة - أبراج وقف الملك عبدالعزيز',
    nameEn: 'Makkah Branch - Clock Tower',
    roleTag: 'المقر الرئيسي',
    roleTagEn: 'Headquarters',
    phone: '+966560580250',
    whatsapp: '+966560580250',
    email: 'prestigeksa.umrah@gmail.com',
    workingHours: 'على مدار الساعة 24/7',
    workingHoursEn: '24/7 Around the clock',
    isActive: true,
    order: 5
  },
  {
    id: 'cnt_madinah_branch',
    name: 'فرع المدينة المنورة - المنطقة المركزية',
    nameEn: 'Madinah Branch - Central Area',
    roleTag: 'فرع المدينة',
    roleTagEn: 'Madinah Branch',
    phone: '+966501234568',
    whatsapp: '+966501234568',
    email: 'madinah@prestigehotels.sa',
    workingHours: 'على مدار الساعة 24/7',
    workingHoursEn: '24/7 Around the clock',
    isActive: true,
    order: 6
  }
];

export const DEFAULT_ACTION_BUTTONS: ActionButtonItem[] = [
  {
    id: 'btn_consultant_whatsapp',
    contactId: 'cnt_housing_consultant',
    label: 'تحدث مع مستشار التسكين واتساب',
    labelEn: 'Chat with Housing Advisor on WhatsApp',
    icon: 'whatsapp',
    style: 'whatsapp',
    actionType: 'whatsapp',
    target: '+966560580250',
    whatsappMessage: 'السلام عليكم ورحمة الله، أود التواصل مع مستشار التسكين لمساعدتي في اختيار أفضل فندق وغرفة تناسب ميزانيتي واحتياجي.',
    whatsappMessageEn: 'Hello, I would like to consult with the accommodation advisor to help me choose the best hotel and room that suits my budget and needs.',
    order: 1,
    isActive: true,
    pages: ['all'],
    positions: ['footer', 'floating'],
    devices: 'all',
    badgeText: '24/7',
    badgeTextEn: '24/7'
  },
  {
    id: 'btn_group_bookings_whatsapp',
    contactId: 'cnt_bookings_manager',
    label: 'حجز المجموعات وحملات العمرة',
    labelEn: 'Group & Umrah Tours Bookings',
    icon: 'whatsapp',
    style: 'whatsapp',
    actionType: 'whatsapp',
    target: '+966560580250',
    whatsappMessage: 'السلام عليكم، أود الاستفسار عن أسعار وعروض حجز المجموعات والشركات (قروبات / حملات) لدى فنادق برستيج بمكة المكرمة والمدينة المنورة.',
    whatsappMessageEn: 'Hello, I would like to inquire about group and corporate rates/offers for Umrah campaigns at Prestige Hotels in Makkah and Madinah.',
    order: 2,
    isActive: true,
    pages: ['all'],
    positions: ['header', 'footer'],
    devices: 'all',
    badgeText: 'عروض خاصة',
    badgeTextEn: 'Special Rates'
  },
  {
    id: 'btn_reception_call',
    contactId: 'cnt_reception',
    label: 'هاتف الاستقبال المباشر',
    labelEn: 'Direct Reception Phone',
    icon: 'phone',
    style: 'primary',
    actionType: 'call',
    target: '+966560580250',
    order: 3,
    isActive: true,
    pages: ['all'],
    positions: ['header', 'hotel_detail'],
    devices: 'all',
    badgeText: 'فوري',
    badgeTextEn: 'Direct'
  },
  {
    id: 'btn_hq_location',
    label: 'فتح اللوكيشن على خرائط جوجل',
    labelEn: 'Open Location on Google Maps',
    icon: 'map',
    style: 'gold',
    actionType: 'map',
    target: 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah',
    order: 4,
    isActive: true,
    pages: ['about', 'home'],
    positions: ['about_hq'],
    devices: 'all'
  },
  {
    id: 'btn_explore_hotels',
    label: 'استكشف فنادقنا المعتمدة',
    labelEn: 'Explore Our Certified Hotels',
    icon: 'building',
    style: 'primary',
    actionType: 'page',
    target: 'hotels',
    targetPage: 'hotels',
    order: 5,
    isActive: true,
    pages: ['home'],
    positions: ['hero'],
    devices: 'all'
  },
  {
    id: 'btn_instant_room_booking',
    contactId: 'cnt_bookings_manager',
    label: 'حجز فوري وتسكين مباشر',
    labelEn: 'Instant Booking & Housing',
    icon: 'calendar',
    style: 'whatsapp',
    actionType: 'whatsapp',
    target: '+966560580250',
    whatsappMessage: 'السلام عليكم ورحمة الله، أود الاستفسار وحجز إقامة فندقية. فضلاً تزويدي بالأسعار والإتاحة المتاحة.',
    whatsappMessageEn: 'Hello, I would like to inquire about booking a stay. Please provide rates and availability.',
    order: 6,
    isActive: true,
    pages: ['hotels', 'hotel-detail'],
    positions: ['hotel_detail'],
    devices: 'all'
  }
];

export interface ActionButtonExecutionContext {
  navigate?: (page: ActivePage) => void;
  onSelectHotel?: (hotelId: string) => void;
  language?: 'ar' | 'en';
  hotelName?: string;
  roomName?: string;
}

/**
 * Validates international phone format (e.g. +966560580250, +201012345678, +628123456789)
 */
export function isValidInternationalPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(\+|00)[1-9]\d{6,14}$/.test(cleaned);
}

/**
 * Normalizes input to international phone format with +
 */
export function formatInternationalPhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  } else if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('05')) {
      // Saudi Arabia convenience: 05XXXXXXXX -> +9665XXXXXXXX
      cleaned = '+966' + cleaned.substring(1);
    } else if (cleaned.startsWith('5') && cleaned.length === 9) {
      cleaned = '+966' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}

export interface ResolvedButtonTarget {
  target: string;
  contact?: ContactDirectoryItem;
  status: 'ok' | 'missing_contact' | 'inactive_contact' | 'empty_target';
  statusMessageAr: string;
  statusMessageEn: string;
}

/**
 * Resolves the final target (phone, whatsapp, email, url, etc.) for any button,
 * pulling dynamically from the central Contacts Directory if linked.
 */
export function resolveActionButtonTarget(
  button: ActionButtonItem,
  contactsDirectory: ContactDirectoryItem[] = DEFAULT_CONTACTS_DIRECTORY
): ResolvedButtonTarget {
  const isDirectChannel = button.actionType === 'call' || button.actionType === 'whatsapp' || button.actionType === 'email';
  
  if (!isDirectChannel) {
    const rawTarget = (button.target || '').trim();
    if (!rawTarget && !button.targetHotelId && !button.targetPage) {
      return {
        target: '',
        status: 'empty_target',
        statusMessageAr: 'الهدف أو الرابط فارغ',
        statusMessageEn: 'Target URL/Page is empty'
      };
    }
    return {
      target: rawTarget,
      status: 'ok',
      statusMessageAr: 'سليم وجاهز',
      statusMessageEn: 'Active and ready'
    };
  }

  // If a contact from directory is specified
  if (button.contactId && button.contactId !== 'custom') {
    const matchedContact = (contactsDirectory || []).find(c => c.id === button.contactId);
    if (!matchedContact) {
      return {
        target: button.target || '',
        status: 'missing_contact',
        statusMessageAr: 'جهة الاتصال المرتبطة محذوفة أو غير موجودة',
        statusMessageEn: 'Linked contact is missing or deleted'
      };
    }

    if (matchedContact.isActive === false) {
      return {
        target: matchedContact.phone || button.target || '',
        contact: matchedContact,
        status: 'inactive_contact',
        statusMessageAr: `جهة الاتصال (${matchedContact.name}) معطلة حالياً`,
        statusMessageEn: `Linked contact (${matchedContact.nameEn || matchedContact.name}) is currently inactive`
      };
    }

    let resolved = '';
    if (button.actionType === 'call') {
      resolved = matchedContact.phone || button.target || '';
    } else if (button.actionType === 'whatsapp') {
      resolved = matchedContact.whatsapp || matchedContact.phone || button.target || '';
    } else if (button.actionType === 'email') {
      resolved = matchedContact.email || button.target || '';
    }

    if (!resolved.trim()) {
      return {
        target: '',
        contact: matchedContact,
        status: 'empty_target',
        statusMessageAr: `الرقم / البريد فارغ في بطاقة (${matchedContact.name})`,
        statusMessageEn: `No number/email found for contact (${matchedContact.nameEn || matchedContact.name})`
      };
    }

    return {
      target: resolved.trim(),
      contact: matchedContact,
      status: 'ok',
      statusMessageAr: `مرتبط مع: ${matchedContact.name} (${resolved.trim()})`,
      statusMessageEn: `Linked to: ${matchedContact.nameEn || matchedContact.name} (${resolved.trim()})`
    };
  }

  // Custom target (contactId === 'custom' or empty)
  const customTarget = (button.target || '').trim();
  if (!customTarget) {
    return {
      target: '',
      status: 'empty_target',
      statusMessageAr: 'لم يتم تحديد رقم أو جهة اتصال للزر',
      statusMessageEn: 'No phone/contact assigned to button'
    };
  }

  return {
    target: customTarget,
    status: 'ok',
    statusMessageAr: `رقم مخصص (${customTarget})`,
    statusMessageEn: `Custom target (${customTarget})`
  };
}

/**
 * Returns computed href for anchor tags or direct links.
 */
export function getActionButtonHref(
  button: ActionButtonItem,
  language: 'ar' | 'en' = 'ar',
  fallbackWhatsAppMsg?: string,
  contactsDirectory?: ContactDirectoryItem[]
): string {
  const resolved = resolveActionButtonTarget(button, contactsDirectory);
  const target = resolved.target;

  switch (button.actionType) {
    case 'call':
      return target ? `tel:${target.replace(/\s+/g, '')}` : '#';

    case 'whatsapp': {
      if (!target) return '#';
      const msg = language === 'en'
        ? (button.whatsappMessageEn || button.whatsappMessage || fallbackWhatsAppMsg || 'Hello, I would like to inquire about Prestige hotels.')
        : (button.whatsappMessage || fallbackWhatsAppMsg || 'السلام عليكم ورحمة الله، أود الاستفسار عن حجوزات وخدمات شركة برستيج.');
      return buildWhatsAppLink(target, msg);
    }

    case 'email':
      return target ? `mailto:${target}` : '#';

    case 'map': {
      if (!target) return '#';
      if (target.startsWith('http://') || target.startsWith('https://')) {
        return target;
      }
      return `https://maps.google.com/?q=${encodeURIComponent(target)}`;
    }

    case 'url':
      return target || '#';

    case 'hotel':
      return `#hotel-${button.targetHotelId || target}`;

    case 'page':
      return `#${button.targetPage || target}`;

    default:
      return target || '#';
  }
}

/**
 * Computes exact testable URL for admin "Test" action
 */
export function getButtonTestUrl(
  button: ActionButtonItem,
  contactsDirectory?: ContactDirectoryItem[],
  language: 'ar' | 'en' = 'ar'
): string {
  return getActionButtonHref(button, language, undefined, contactsDirectory);
}

/**
 * Executes the button action (handles navigation, modal, tel, whatsapp, maps).
 */
export function executeActionButton(
  button: ActionButtonItem,
  context: ActionButtonExecutionContext,
  contactsDirectory?: ContactDirectoryItem[]
) {
  const lang = context.language || 'ar';
  const resolved = resolveActionButtonTarget(button, contactsDirectory);
  const target = resolved.target;

  if (!target && (button.actionType === 'call' || button.actionType === 'whatsapp' || button.actionType === 'email')) {
    console.warn(`[ActionButton] Cannot execute button "${button.label}": target is empty or contact is disabled.`);
    return;
  }

  switch (button.actionType) {
    case 'call':
      window.location.href = `tel:${target.replace(/\s+/g, '')}`;
      break;

    case 'whatsapp': {
      let msg = lang === 'en'
        ? (button.whatsappMessageEn || button.whatsappMessage || '')
        : (button.whatsappMessage || '');
      
      if (!msg && context.hotelName) {
        msg = lang === 'en'
          ? `Hello, I would like to inquire about ${context.hotelName}${context.roomName ? ` (${context.roomName})` : ''}.`
          : `السلام عليكم ورحمة الله، أود الاستفسار عن فندق ${context.hotelName}${context.roomName ? ` (${context.roomName})` : ''}.`;
      }
      const waUrl = buildWhatsAppLink(target, msg);
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      break;
    }

    case 'email':
      window.location.href = `mailto:${target}`;
      break;

    case 'map': {
      const mapUrl = target.startsWith('http://') || target.startsWith('https://')
        ? target
        : `https://maps.google.com/?q=${encodeURIComponent(target)}`;
      window.open(mapUrl, '_blank', 'noopener,noreferrer');
      break;
    }

    case 'url':
      window.open(target, '_blank', 'noopener,noreferrer');
      break;

    case 'hotel': {
      const hotelId = button.targetHotelId || target;
      if (context.onSelectHotel) {
        context.onSelectHotel(hotelId);
      } else if (context.navigate) {
        context.navigate('hotels');
      }
      break;
    }

    case 'page': {
      const targetPage = (button.targetPage || target) as ActivePage;
      if (context.navigate) {
        context.navigate(targetPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      break;
    }

    default:
      if (target.startsWith('http://') || target.startsWith('https://')) {
        window.open(target, '_blank');
      }
  }
}

/**
 * Filter action buttons for public visitors:
 * - Checks active state (btn.isActive !== false)
 * - Checks page matching
 * - Checks position placement
 * - Checks device matching
 * - Automatically hides buttons that have missing or inactive linked contacts (prevents broken visitor links!)
 */
export function filterActionButtons(
  buttons: ActionButtonItem[] | undefined,
  filter: {
    page?: string;
    position?: ActionButtonPosition;
    isMobile?: boolean;
  },
  contactsDirectory?: ContactDirectoryItem[]
): ActionButtonItem[] {
  if (!Array.isArray(buttons) || buttons.length === 0) {
    return [];
  }

  const contacts = contactsDirectory || DEFAULT_CONTACTS_DIRECTORY;

  return buttons
    .filter(btn => btn.isActive !== false)
    .filter(btn => {
      // Check linked contact validity for channel buttons
      if (btn.actionType === 'call' || btn.actionType === 'whatsapp' || btn.actionType === 'email') {
        const resolved = resolveActionButtonTarget(btn, contacts);
        if (resolved.status !== 'ok' || !resolved.target) {
          // Hide broken or inactive buttons from public visitors!
          return false;
        }
      }

      // Page match
      if (filter.page && btn.pages && btn.pages.length > 0) {
        const matchesPage = btn.pages.includes('all') || btn.pages.includes(filter.page);
        if (!matchesPage) return false;
      }
      // Position match
      if (filter.position && btn.positions && btn.positions.length > 0) {
        const matchesPos = btn.positions.includes(filter.position);
        if (!matchesPos) return false;
      }
      // Device match
      if (filter.isMobile !== undefined && btn.devices && btn.devices !== 'all') {
        if (filter.isMobile && btn.devices === 'desktop') return false;
        if (!filter.isMobile && btn.devices === 'mobile') return false;
      }
      return true;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
