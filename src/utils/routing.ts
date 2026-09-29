import { Hotel, ActivePage } from '../types';

/**
 * Transliterate Arabic hotel titles into clean, concise Latin letters
 * to prevent ugly percent-encoded URLs like %D8%A8%D8%B1%D8%B3%D8%AA%D9%8A%D8%AC...
 */
export function arabicToLatinSlug(text: string): string {
  if (!text) return '';
  const dictionary: Record<string, string> = {
    'برستيج': 'prestige',
    'فندق': 'hotel',
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
 * Generate a clean, SEO-friendly, short Latin slug for a hotel
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

  // Fallback to clean hotel id
  if (hotel.id) {
    return hotel.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  return 'hotel';
}

/**
 * Find hotel in list by either ID, English slug, Arabic transliteration, or original Arabic name
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

  // 4. Arabic original name match (supports old links with Arabic text)
  const matchAr = hotels.find((h) => {
    const cleanAr = h.name.toLowerCase().replace(/[\s_-]+/g, '');
    return cleanAr === normalized;
  });
  if (matchAr) return matchAr;

  // 5. Partial substring match
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
 * Get full, clean shareable URL for a hotel
 */
export function getHotelShareUrl(hotel: Hotel): string {
  const slug = getHotelSlug(hotel);
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
  // Both path-style and hash-style links work cleanly
  return `${baseUrl}#/hotel/${slug}`;
}

/**
 * Get shareable URL for any page
 */
export function getPageShareUrl(page: ActivePage, hotel?: Hotel): string {
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
  if (page === 'hotel-detail' && hotel) {
    return getHotelShareUrl(hotel);
  }
  if (page === 'home') {
    return `${baseUrl}#/home`;
  }
  return `${baseUrl}#/${page}`;
}

/**
 * Parse the current browser URL (path or hash) to determine current page and hotel
 */
export function parseCurrentRoute(hotels: Hotel[] = []): { page: ActivePage; hotelId?: string; selectedHotel?: Hotel } {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').trim();

  const targetStr = hash || path;

  if (!targetStr || targetStr === 'home') {
    return { page: 'home' };
  }

  // Check for hotel route: hotel/:slugOrId or hotel-:slugOrId
  const hotelMatch = targetStr.match(/^(?:home\/)?hotel[/-](.+)$/i);
  if (hotelMatch && hotelMatch[1]) {
    const slugOrId = decodeURIComponent(hotelMatch[1]);
    const hotel = findHotelBySlugOrId(hotels, slugOrId);
    return {
      page: 'hotel-detail',
      hotelId: hotel?.id || slugOrId,
      selectedHotel: hotel
    };
  }

  if (targetStr.startsWith('hotels')) {
    return { page: 'hotels' };
  }
  if (targetStr.startsWith('offers')) {
    return { page: 'offers' };
  }
  if (targetStr.startsWith('about')) {
    return { page: 'about' };
  }
  if (targetStr.startsWith('contact')) {
    return { page: 'contact' };
  }
  if (targetStr.startsWith('admin')) {
    return { page: 'admin' };
  }

  return { page: 'home' };
}

/**
 * Update the URL in the address bar without reloading the page
 */
export function syncRouteToUrl(page: ActivePage, hotel?: Hotel, replaceState = false) {
  let targetHash = `#/${page}`;
  
  if (page === 'hotel-detail' && hotel) {
    const slug = getHotelSlug(hotel);
    targetHash = `#/hotel/${slug}`;
  } else if (page === 'home') {
    targetHash = '#/home';
  }

  if (window.location.hash !== targetHash) {
    if (replaceState) {
      window.history.replaceState(null, '', targetHash);
    } else {
      window.location.hash = targetHash;
    }
  }
}
