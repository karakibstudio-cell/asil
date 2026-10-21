import { Hotel, ActivePage } from '../types';

export type Language = 'ar' | 'en';

export type AdminTab = 
  | 'hotels' 
  | 'bookings'
  | 'online-control'
  | 'calendar-grid'
  | 'rooms-inventory'
  | 'rooms-list'
  | 'meals-list'
  | 'packages-list'
  | 'periods-pricing'
  | 'booking-rules'
  | 'booking-settings'
  | 'districts' 
  | 'users' 
  | 'intro-video' 
  | 'slides' 
  | 'buttons'
  | 'contacts'
  | 'offers' 
  | 'about' 
  | 'reviews' 
  | 'messages' 
  | 'settings'
  | 'home-sections'
  | 'story-teaser'
  | 'services'
  | 'audit-log';

export interface ParsedRoute {
  page: ActivePage;
  lang: Language;
  hotelId?: string;
  hotelSlug?: string;
  selectedHotel?: Hotel;
  adminTab?: AdminTab;
  cityFilter?: 'all' | 'مكة المكرمة' | 'المدينة المنورة';
  districtFilter?: string;
  offerId?: string;
  photoUrl?: string;
  hotelTab?: string;
  invoiceBookingId?: string;
  invoiceToken?: string;
  isLegacyHash?: boolean;
}

/**
 * Clean transliteration dictionary for Arabic hotel titles into readable Latin slugs
 */
export function arabicToLatinSlug(text: string): string {
  if (!text) return '';
  const dictionary: Record<string, string> = {
    'برستيج': 'prestige',
    'فندق': '',
    'أجياد': 'ajyad',
    'اجياد': 'ajyad',
    'مكة': 'makkah',
    'المدينة': 'madinah',
    'المنورة': 'munawwarah',
    'المكرمة': 'mukarramah',
    'الحرم': 'haram',
    'الصفوة': 'safwah',
    'ابراج': 'towers',
    'أبراج': 'towers',
    'منازل': 'manazel',
    'الزهراء': 'azzahra',
    'زهراء': 'zahra',
    'سويس': 'swiss',
    'فيرمونت': 'fairmont',
    'موفنبيك': 'movenpick',
    'هيلتون': 'hilton',
    'دار': 'dar',
    'التوحيد': 'tawhid',
    'العزيزية': 'aziziyah',
    'المسفلة': 'mesfalah',
    'زمزم': 'zamzam',
    'الشهداء': 'shuhada',
    'البديع': 'badee',
    'فجر': 'fajr',
    'الريان': 'rayyan',
    'رويال': 'royal',
    'المركزية': 'central'
  };

  let cleaned = text.trim();
  for (const [ar, en] of Object.entries(dictionary)) {
    const reg = new RegExp(ar, 'gi');
    cleaned = cleaned.replace(reg, ` ${en} `);
  }

  const charMap: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': '', 'ئ': 'e', 'ؤ': 'o'
  };

  let result = '';
  for (const ch of cleaned) {
    result += charMap[ch] !== undefined ? charMap[ch] : ch;
  }

  return result
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a clean, SEO-friendly Latin slug for a hotel
 * Example: "برستيج اجياد" -> "prestige-ajyad"
 */
export function getHotelSlug(hotel: Hotel): string {
  if (hotel.nameEn && hotel.nameEn.trim()) {
    const enSlug = hotel.nameEn
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (enSlug) return enSlug;
  }
  
  const transliterated = arabicToLatinSlug(hotel.name);
  if (transliterated) {
    return transliterated;
  }

  if (hotel.id) {
    return hotel.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  return 'hotel';
}

/**
 * Find hotel by slug, ID, or name
 */
export function findHotelBySlugOrId(hotels: Hotel[], identifier: string): Hotel | undefined {
  if (!identifier || !hotels || hotels.length === 0) return undefined;
  
  const rawDecoded = decodeURIComponent(identifier).trim();
  const normalized = rawDecoded.toLowerCase().replace(/[\s_-]+/g, '');

  // 1. Direct ID match
  const directId = hotels.find((h) => h.id === rawDecoded || h.id.toLowerCase() === rawDecoded.toLowerCase());
  if (directId) return directId;

  // 2. English name & slug match
  const matchEn = hotels.find((h) => {
    const slug = getHotelSlug(h).toLowerCase().replace(/[\s_-]+/g, '');
    if (slug === normalized) return true;
    if (h.nameEn) {
      const cleanEn = h.nameEn.toLowerCase().replace(/[\s_-]+/g, '');
      if (cleanEn === normalized) return true;
    }
    return false;
  });
  if (matchEn) return matchEn;

  // 3. Arabic transliteration match
  const matchTranslit = hotels.find((h) => {
    const translit = arabicToLatinSlug(h.name).replace(/[\s_-]+/g, '');
    return translit === normalized;
  });
  if (matchTranslit) return matchTranslit;

  // 4. Arabic original name match
  const matchAr = hotels.find((h) => {
    const cleanAr = h.name.toLowerCase().replace(/[\s_-]+/g, '');
    return cleanAr === normalized;
  });
  if (matchAr) return matchAr;

  // 5. Partial match
  const partial = hotels.find((h) => {
    const cleanName = h.name.toLowerCase().replace(/[\s_-]+/g, '');
    const cleanEn = (h.nameEn || '').toLowerCase().replace(/[\s_-]+/g, '');
    const slug = getHotelSlug(h).toLowerCase().replace(/[\s_-]+/g, '');
    return (
      cleanName.includes(normalized) || 
      normalized.includes(cleanName) ||
      cleanEn.includes(normalized) || 
      normalized.includes(cleanEn) ||
      slug.includes(normalized) ||
      normalized.includes(slug)
    );
  });
  if (partial) return partial;

  return undefined;
}

/**
 * Detect language from path, cookie, or storage
 */
export function detectLanguageFromUrl(): Language {
  if (typeof window === 'undefined') return 'ar';
  
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith('/en/') || pathname === '/en') return 'en';
  if (pathname.startsWith('/ar/') || pathname === '/ar') return 'ar';

  const hash = window.location.hash.toLowerCase();
  if (hash.includes('/en/') || hash.startsWith('#/en')) return 'en';
  if (hash.includes('/ar/') || hash.startsWith('#/ar')) return 'ar';

  try {
    const saved = localStorage.getItem('diy_app_language');
    if (saved === 'en' || saved === 'ar') return saved;
  } catch {}

  return 'ar';
}

/**
 * Parse the current browser URL (real pathname, search, or legacy hash)
 * This runs SYNCHRONOUSLY before initial render to prevent FOUC / wrong hotel flash!
 */
export function parseCurrentRoute(hotels: Hotel[] = []): ParsedRoute {
  if (typeof window === 'undefined') {
    return { page: 'home', lang: 'ar' };
  }

  let isLegacyHash = false;
  let rawPath = window.location.pathname.replace(/\/$/, '') || '/';
  let queryPart = window.location.search.replace(/^\?/, '');

  // Detect legacy hash route e.g. #/hotel/prestige-ajyad or #/hotels
  if (window.location.hash && window.location.hash.length > 1) {
    isLegacyHash = true;
    const hashContent = window.location.hash.replace(/^#\/?/, '').trim();
    if (hashContent.includes('?')) {
      const parts = hashContent.split('?');
      rawPath = '/' + parts[0];
      queryPart = parts.slice(1).join('?');
    } else {
      rawPath = '/' + hashContent;
    }
  }

  const searchParams = new URLSearchParams(queryPart);
  const photoParam = searchParams.get('src') || searchParams.get('img') || searchParams.get('photo');
  const cityParam = searchParams.get('city');
  const districtParam = searchParams.get('district');
  const tabParam = searchParams.get('tab');
  const offerParam = searchParams.get('offer') || searchParams.get('id');
  const hotelQueryParam = searchParams.get('hotel') || searchParams.get('hotelId') || searchParams.get('id');

  // Detect language prefix
  let lang: Language = 'ar';
  let pathWithoutLang = rawPath;

  if (rawPath.startsWith('/en/') || rawPath === '/en') {
    lang = 'en';
    pathWithoutLang = rawPath.replace(/^\/en/, '') || '/';
  } else if (rawPath.startsWith('/ar/') || rawPath === '/ar') {
    lang = 'ar';
    pathWithoutLang = rawPath.replace(/^\/ar/, '') || '/';
  } else {
    lang = detectLanguageFromUrl();
  }

  // Clean path segments
  const cleanPath = pathWithoutLang.replace(/^\/+/, '').replace(/\/+$/, '');

  // Direct image/media preview
  if (cleanPath.startsWith('image') || cleanPath.startsWith('media') || photoParam) {
    return {
      page: 'home',
      lang,
      photoUrl: photoParam || undefined,
      isLegacyHash
    };
  }

  // Home
  if (!cleanPath || cleanPath === 'home') {
    return { page: 'home', lang, isLegacyHash };
  }

  // 1. Admin: /admin or /admin/:tab
  if (cleanPath.startsWith('admin')) {
    let tab: AdminTab = 'hotels';
    const adminMatch = cleanPath.match(/^admin[/-]([a-zA-Z0-9_-]+)/i);
    const validTabs: AdminTab[] = [
      'hotels', 'bookings', 'rooms-inventory', 'districts', 'users', 'intro-video', 'slides', 'buttons', 'contacts',
      'offers', 'about', 'reviews', 'messages', 'settings', 'home-sections', 'story-teaser', 'services', 'audit-log'
    ];
    if (adminMatch && adminMatch[1]) {
      const parsedTab = adminMatch[1].toLowerCase() as AdminTab;
      if (parsedTab === ('ads' as any)) {
        tab = 'offers';
      } else if (validTabs.includes(parsedTab)) {
        tab = parsedTab;
      }
    } else if (tabParam && validTabs.includes(tabParam.toLowerCase() as AdminTab)) {
      tab = tabParam.toLowerCase() as AdminTab;
    }
    return {
      page: 'admin',
      lang,
      adminTab: tab,
      isLegacyHash
    };
  }

  // 2. Hotel Detail: /hotels/:slugOrId or /hotel/:slugOrId
  const hotelMatch = cleanPath.match(/^(?:hotel|hotels)[/-](.+)$/i);
  if (hotelMatch && hotelMatch[1]) {
    const rawSlugOrId = decodeURIComponent(hotelMatch[1]).trim();
    
    // Check if it's a city filter shortcut like /hotels/makkah or /hotels/madinah
    if (rawSlugOrId === 'makkah' || rawSlugOrId === 'makkah-hotels' || rawSlugOrId === 'مكة' || rawSlugOrId === 'مكة-المكرمة') {
      return {
        page: 'hotels',
        lang,
        cityFilter: 'مكة المكرمة',
        isLegacyHash
      };
    }
    if (rawSlugOrId === 'madinah' || rawSlugOrId === 'madinah-hotels' || rawSlugOrId === 'المدينة' || rawSlugOrId === 'المدينة-المنورة') {
      return {
        page: 'hotels',
        lang,
        cityFilter: 'المدينة المنورة',
        isLegacyHash
      };
    }

    const hotel = findHotelBySlugOrId(hotels, rawSlugOrId);
    return {
      page: 'hotel-detail',
      lang,
      hotelId: hotel?.id || rawSlugOrId,
      hotelSlug: hotel ? getHotelSlug(hotel) : rawSlugOrId,
      selectedHotel: hotel,
      hotelTab: tabParam || undefined,
      isLegacyHash
    };
  }

  // 3. Query-param based hotel detail: /hotels?id=xxx or /hotel-detail?id=xxx
  if ((cleanPath === 'hotel-detail' || cleanPath === 'hotels') && hotelQueryParam) {
    const hotel = findHotelBySlugOrId(hotels, hotelQueryParam);
    return {
      page: 'hotel-detail',
      lang,
      hotelId: hotel?.id || hotelQueryParam,
      hotelSlug: hotel ? getHotelSlug(hotel) : hotelQueryParam,
      selectedHotel: hotel,
      isLegacyHash: true
    };
  }

  // 4. Hotels List: /hotels, /hotels-makkah, /hotels-madinah
  if (cleanPath.startsWith('hotels') || cleanPath === 'hotels-makkah' || cleanPath === 'hotels-madinah') {
    let resolvedCity: 'all' | 'مكة المكرمة' | 'المدينة المنورة' = 'all';
    if (cleanPath.includes('makkah') || cityParam?.toLowerCase().includes('makkah') || cityParam?.includes('مكة')) {
      resolvedCity = 'مكة المكرمة';
    } else if (cleanPath.includes('madinah') || cityParam?.toLowerCase().includes('madinah') || cityParam?.includes('مدينة')) {
      resolvedCity = 'المدينة المنورة';
    }
    return {
      page: 'hotels',
      lang,
      cityFilter: resolvedCity,
      districtFilter: districtParam || undefined,
      isLegacyHash
    };
  }

  // 5. Offers: /offers, /offer/:id
  if (cleanPath.startsWith('offers') || cleanPath.startsWith('offer') || cleanPath.startsWith('ads') || cleanPath.startsWith('ad')) {
    const offerMatch = cleanPath.match(/^(?:offers|offer|ads|ad)[/-](.+)$/i);
    const resolvedOfferId = offerMatch ? decodeURIComponent(offerMatch[1]).trim() : (offerParam || undefined);
    return {
      page: 'offers',
      lang,
      offerId: resolvedOfferId,
      isLegacyHash
    };
  }

  // 6. Booking Portal: /room-booking, /bookings, /booking
  if (cleanPath.startsWith('room-booking') || cleanPath.startsWith('bookings') || cleanPath.startsWith('booking')) {
    const matchedHotel = hotelQueryParam ? findHotelBySlugOrId(hotels, hotelQueryParam) : undefined;
    return {
      page: 'room-booking',
      lang,
      hotelId: matchedHotel?.id || hotelQueryParam || undefined,
      selectedHotel: matchedHotel,
      isLegacyHash
    };
  }

  // 6.5 Public Invoice / Voucher: /invoice/:bookingId?token=... or /invoice?id=...&token=...
  if (cleanPath.startsWith('invoice') || cleanPath.startsWith('voucher') || cleanPath.startsWith('bill')) {
    const invoiceMatch = cleanPath.match(/^(?:invoice|voucher|bill)[/-](.+)$/i);
    const invoiceBookingId = invoiceMatch ? decodeURIComponent(invoiceMatch[1]).trim() : (searchParams.get('id') || searchParams.get('bookingId') || undefined);
    const invoiceToken = searchParams.get('token') || searchParams.get('key') || undefined;
    return {
      page: 'invoice',
      lang,
      invoiceBookingId,
      invoiceToken,
      isLegacyHash
    };
  }

  // 7. About: /about
  if (cleanPath.startsWith('about')) {
    return { page: 'about', lang, isLegacyHash };
  }

  // 8. Contact: /contact
  if (cleanPath.startsWith('contact')) {
    return { page: 'contact', lang, isLegacyHash };
  }

  return { page: 'home', lang, isLegacyHash };
}

/**
 * Generate full canonical path for any page
 */
export function getRoutePath(
  page: ActivePage,
  lang: Language = 'ar',
  options?: {
    hotel?: Hotel;
    hotelIdOrSlug?: string;
    cityFilter?: 'all' | 'مكة المكرمة' | 'المدينة المنورة';
    offerId?: string;
    adminTab?: AdminTab;
    hotelTab?: string;
    bookingId?: string;
    token?: string;
  }
): string {
  if (page === 'admin') {
    const tab = options?.adminTab || 'hotels';
    return `/admin/${tab}`;
  }

  const prefix = `/${lang}`;

  if (page === 'invoice') {
    const bId = options?.bookingId || '';
    const tokenQuery = options?.token ? `?token=${encodeURIComponent(options.token)}` : '';
    return `${prefix}/invoice/${bId}${tokenQuery}`;
  }

  if (page === 'home') {
    return prefix;
  }

  if (page === 'hotel-detail') {
    let slug = '';
    if (options?.hotel) {
      slug = getHotelSlug(options.hotel);
    } else if (options?.hotelIdOrSlug) {
      slug = options.hotelIdOrSlug;
    }
    const query = options?.hotelTab ? `?tab=${options.hotelTab}` : '';
    return `${prefix}/hotels/${slug}${query}`;
  }

  if (page === 'hotels') {
    if (options?.cityFilter === 'مكة المكرمة') {
      return `${prefix}/hotels/makkah`;
    }
    if (options?.cityFilter === 'المدينة المنورة') {
      return `${prefix}/hotels/madinah`;
    }
    return `${prefix}/hotels`;
  }

  if (page === 'offers') {
    if (options?.offerId) {
      return `${prefix}/offers/${options.offerId}`;
    }
    return `${prefix}/offers`;
  }

  if (page === 'room-booking') {
    if (options?.hotel?.id) {
      return `${prefix}/bookings?hotel=${options.hotel.id}`;
    }
    return `${prefix}/bookings`;
  }

  if (page === 'about') {
    return `${prefix}/about`;
  }

  if (page === 'contact') {
    return `${prefix}/contact`;
  }

  return prefix;
}

/**
/**
 * Get full absolute shareable URL for any page
 */
export function getPageShareUrl(
  page: ActivePage,
  lang: Language = 'ar',
  options?: {
    hotel?: Hotel;
    hotelIdOrSlug?: string;
    cityFilter?: 'all' | 'مكة المكرمة' | 'المدينة المنورة';
    offerId?: string;
    adminTab?: AdminTab;
    hotelTab?: string;
  }
): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://prestige-ksa.web.app';
  const path = getRoutePath(page, lang, options);
  return `${origin}${path}`;
}

/**
 * Get full canonical shareable URL for a specific hotel
 */
export function getHotelShareUrl(hotel: Hotel, lang: Language = 'ar', tab?: string): string {
  return getPageShareUrl('hotel-detail', lang, { hotel, hotelTab: tab });
}

/**
 * Get full canonical shareable URL for a specific offer
 */
export function getOfferShareUrl(offerId: string, lang: Language = 'ar'): string {
  return getPageShareUrl('offers', lang, { offerId });
}

/**
 * Sync route to browser URL via History API (pushState or replaceState)
 * Clean real browser-history URLs: no # hashes!
 */
export function syncRouteToUrl(
  page: ActivePage,
  langOrOptions?: Language | {
    hotel?: Hotel;
    hotelIdOrSlug?: string;
    cityFilter?: 'all' | 'مكة المكرمة' | 'المدينة المنورة';
    offerId?: string;
    adminTab?: AdminTab;
    hotelTab?: string;
    photoUrl?: string;
  },
  optionsOrReplace?: {
    hotel?: Hotel;
    hotelIdOrSlug?: string;
    cityFilter?: 'all' | 'مكة المكرمة' | 'المدينة المنورة';
    offerId?: string;
    adminTab?: AdminTab;
    hotelTab?: string;
    photoUrl?: string;
  } | boolean,
  replaceState = false
) {
  if (typeof window === 'undefined') return;

  let lang: Language = 'ar';
  let options: any = undefined;
  let shouldReplace = false;

  if (typeof langOrOptions === 'string' && (langOrOptions === 'ar' || langOrOptions === 'en')) {
    lang = langOrOptions;
    if (typeof optionsOrReplace === 'object') {
      options = optionsOrReplace;
      shouldReplace = Boolean(replaceState);
    } else if (typeof optionsOrReplace === 'boolean') {
      shouldReplace = optionsOrReplace;
    }
  } else if (typeof langOrOptions === 'object') {
    lang = detectLanguageFromUrl();
    options = langOrOptions;
    if (typeof optionsOrReplace === 'boolean') {
      shouldReplace = optionsOrReplace;
    }
  } else {
    lang = detectLanguageFromUrl();
  }

  const targetPath = getRoutePath(page, lang, options);
  const currentPathWithSearch = window.location.pathname + window.location.search;

  // Clear legacy hash if present
  if (window.location.hash) {
    window.history.replaceState(null, '', targetPath);
    return;
  }

  if (currentPathWithSearch !== targetPath) {
    if (shouldReplace) {
      window.history.replaceState(null, '', targetPath);
    } else {
      window.history.pushState(null, '', targetPath);
    }
  }
}

/**
 * Generate full public link to a booking invoice with security token
 */
export function getInvoiceUrl(bookingId: string, token?: string, lang: Language = 'ar'): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://prestige-ksa.web.app';
  const prefix = lang === 'en' ? '/en' : '';
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${origin}${prefix}/invoice/${bookingId}${tokenQuery}`;
}

