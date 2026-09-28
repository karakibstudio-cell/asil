import { ChannelType, ContactChannel } from '../types';

export interface ChannelMeta {
  type: ChannelType;
  label: string;
  placeholder: string;
  helperText: string;
  defaultTitle: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const CHANNEL_METAS: Record<ChannelType, ChannelMeta> = {
  whatsapp: {
    type: 'whatsapp',
    label: 'واتساب (WhatsApp)',
    placeholder: 'مثال: +966501234567 أو 0501234567',
    helperText: 'يقبل رقم هاتف مع رمز الدولة أو بدونه، وسيتم تحويله تلقائياً لرابط wa.me فوري.',
    defaultTitle: 'واتساب الحجوزات السريعة',
    bgClass: 'bg-emerald-50 hover:bg-emerald-100',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200 hover:border-emerald-300',
  },
  phone: {
    type: 'phone',
    label: 'رقم هاتف عادي (Phone)',
    placeholder: 'مثال: +966501234567 أو 920000000',
    helperText: 'رقم هاتف مباشر يتيح للعميل الاتصال الصوتي الفوري عبر tel.',
    defaultTitle: 'الاتصال المباشر',
    bgClass: 'bg-blue-50 hover:bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200 hover:border-blue-300',
  },
  email: {
    type: 'email',
    label: 'بريد إلكتروني (Email)',
    placeholder: 'مثال: info@diyafat-alharamain.sa',
    helperText: 'عنوان بريد إلكتروني رسمي يفتح تطبيق البريد مباشرة.',
    defaultTitle: 'البريد الإلكتروني الرسمي',
    bgClass: 'bg-amber-50 hover:bg-amber-100',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200 hover:border-amber-300',
  },
  instagram: {
    type: 'instagram',
    label: 'إنستجرام (Instagram)',
    placeholder: 'مثال: https://instagram.com/diyafat أو اسم المستخدم @diyafat',
    helperText: 'رابط حساب إنستجرام أو اسم المستخدم.',
    defaultTitle: 'حسابنا على إنستقرام',
    bgClass: 'bg-pink-50 hover:bg-pink-100',
    textClass: 'text-pink-700',
    borderClass: 'border-pink-200 hover:border-pink-300',
  },
  facebook: {
    type: 'facebook',
    label: 'فيسبوك (Facebook)',
    placeholder: 'مثال: https://facebook.com/diyafat.alharamain',
    helperText: 'رابط الصفحة الرسمية على فيسبوك.',
    defaultTitle: 'صفحتنا على فيسبوك',
    bgClass: 'bg-indigo-50 hover:bg-indigo-100',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-200 hover:border-indigo-300',
  },
  tiktok: {
    type: 'tiktok',
    label: 'تيك توك (TikTok)',
    placeholder: 'مثال: https://tiktok.com/@diyafat أو @diyafat',
    helperText: 'رابط حساب تيك توك الرسمي أو اسم الحساب.',
    defaultTitle: 'حساب تيك توك',
    bgClass: 'bg-stone-100 hover:bg-stone-200',
    textClass: 'text-stone-800',
    borderClass: 'border-stone-300 hover:border-stone-400',
  },
  custom: {
    type: 'custom',
    label: 'رابط مخصص آخر (Custom URL)',
    placeholder: 'مثال: https://example.com/channel',
    helperText: 'رابط مخصص لموقع ويب، منصة حجز أخرى، تيليجرام، أو أي منصة.',
    defaultTitle: 'رابط مخصص',
    bgClass: 'bg-stone-50 hover:bg-stone-100',
    textClass: 'text-stone-700',
    borderClass: 'border-stone-200 hover:border-stone-300',
  },
};

/**
 * Cleans and converts phone numbers to international digits format.
 * If Saudi local mobile '05XXXXXXXX' is passed, converts to '9665XXXXXXXX'.
 */
export function cleanPhoneNumber(raw: string): string {
  if (!raw) return '';
  // Remove all non-numeric characters except +
  let cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  // If starts with 00, remove it
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  // Saudi local number conversion: 05XXXXXXXX -> 9665XXXXXXXX
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    cleaned = '966' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Validates the value based on channel type.
 * Returns error string if invalid, or null if valid.
 */
export function validateChannelValue(type: ChannelType, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'قيمة القناة مطلوبة';
  }

  if (type === 'whatsapp' || type === 'phone') {
    const cleaned = cleanPhoneNumber(trimmed);
    // Should have digits only, between 7 and 15 digits
    if (!/^\d{7,15}$/.test(cleaned)) {
      return type === 'whatsapp' 
        ? 'يرجى إدخال رقم هاتف صحيح للواتساب (بين 7 إلى 15 رقماً، مثال: +966501234567)'
        : 'يرجى إدخال رقم هاتف صحيح (مثال: +966501234567 أو 0501234567)';
    }
    return null;
  }

  if (type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'يرجى إدخال عنوان بريد إلكتروني صحيح (مثال: info@example.com)';
    }
    return null;
  }

  if (type === 'instagram') {
    // Can be @handle, handle, or full URL
    return null;
  }

  if (type === 'tiktok') {
    // Can be @handle, handle, or full URL
    return null;
  }

  if (type === 'facebook' || type === 'custom') {
    // Should generally be a valid URL
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.includes('.')) {
      return 'يرجى إدخال رابط صالح يبدأ بـ https://';
    }
    return null;
  }

  return null;
}

/**
 * Builds the executable href for a channel.
 */
export function getChannelHref(channel: ContactChannel, customMessage?: string): string {
  const { type, value } = channel;
  const trimmed = value.trim();

  if (type === 'whatsapp') {
    const cleanNum = cleanPhoneNumber(trimmed);
    if (!cleanNum) return '#';
    const textQuery = customMessage ? `?text=${encodeURIComponent(customMessage)}` : '';
    return `https://wa.me/${cleanNum}${textQuery}`;
  }

  if (type === 'phone') {
    const cleanNum = trimmed.replace(/[^\d+]/g, '');
    return `tel:${cleanNum || trimmed}`;
  }

  if (type === 'email') {
    return `mailto:${trimmed}`;
  }

  if (type === 'instagram') {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    const cleanHandle = trimmed.replace(/^@/, '');
    return `https://instagram.com/${cleanHandle}`;
  }

  if (type === 'facebook') {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://facebook.com/${trimmed.replace(/^\//, '')}`;
  }

  if (type === 'tiktok') {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    const cleanHandle = trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
    return `https://tiktok.com/${cleanHandle}`;
  }

  if (type === 'custom') {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Finds the first enabled WhatsApp channel.
 */
export function getFirstActiveWhatsApp(channels?: ContactChannel[]): ContactChannel | null {
  if (!channels || !channels.length) return null;
  const sorted = [...channels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return sorted.find(c => c.type === 'whatsapp' && c.isActive) || null;
}

/**
 * Finds the first enabled Phone channel.
 */
export function getFirstActivePhone(channels?: ContactChannel[]): ContactChannel | null {
  if (!channels || !channels.length) return null;
  const sorted = [...channels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return sorted.find(c => c.type === 'phone' && c.isActive) || null;
}

/**
 * Finds the first enabled Email channel.
 */
export function getFirstActiveEmail(channels?: ContactChannel[]): ContactChannel | null {
  if (!channels || !channels.length) return null;
  const sorted = [...channels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return sorted.find(c => c.type === 'email' && c.isActive) || null;
}

/**
 * Returns all active channels sorted by order.
 */
export function getActiveChannels(channels?: ContactChannel[]): ContactChannel[] {
  if (!channels || !channels.length) return [];
  return [...channels]
    .filter(c => c.isActive)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
