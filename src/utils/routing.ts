import { Hotel, ActivePage } from '../types';

export type AdminTab = 
  | 'hotels' 
  | 'bookings'
  | 'rooms-inventory'
  | 'districts' 
  | 'users' 
  | 'intro-video' 
  | 'slides' 
  | 'offers' 
  | 'about' 
  | 'reviews' 
  | 'messages' 
  | 'settings';

export interface ParsedRoute {
  page: ActivePage;
  hotelId?: string;
  selectedHotel?: Hotel;
  adminTab?: AdminTab;
  cityFilter?: 'all' | 'مكة المكرمة' | 'المدينة المنورة';
  districtFilter?: string;
  offerId?: string;
  photoUrl?: string;
  hotelTab?: string;
}

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
 * Get base URL of current application
 */
function getBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin + window.location.pathname.replace(/\/$/, '');
}

/**
 * Get full, clean shareable URL for a hotel
 */
export function getHotelShareUrl(hotel: Hotel, tab?: string): string {
  const slug = getHotelSlug(hotel);
  const baseUrl = getBaseUrl();
  const query = tab ? `?tab=${tab}` : '';
  return `${baseUrl}#/hotel/${slug}${query}`;
}

/**
 * Get full, clean shareable URL for an admin tab
 * Example: https://prestige-ksa.web.app/#/admin/settings
 */
export function getAdminTabShareUrl(tab: AdminTab = 'settings'): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}#/admin/${tab}`;
}

/**
 * Get full, clean shareable URL for city-filtered hotels
 */
export function getCityHotelsShareUrl(city: 'makkah' | 'madinah'): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}#/hotels/${city}`;
}

/**
 * Get full, clean shareable URL for an offer
 */
export function getOfferShareUrl(offerId: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}#/offer/${encodeURIComponent(offerId)}`;
}

/**
 * Get full, clean shareable URL for any image / media preview
 */
export function getImageShareUrl(imageUrl: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}#/image?src=${encodeURIComponent(imageUrl)}`;
}

/**
 * Get shareable URL for any page
 */
export function getPageShareUrl(page: ActivePage, options?: { 
  hotel?: Hotel; 
  adminTab?: AdminTab;
  city?: 'makkah' | 'madinah';
  offerId?: string;
  hotelTab?: string;
}): string {
  const baseUrl = getBaseUrl();
  if (page === 'hotel-detail' && options?.hotel) {
    return getHotelShareUrl(options.hotel, options.hotelTab);
  }
  if (page === 'admin') {
    return getAdminTabShareUrl(options?.adminTab || 'hotels');
  }
  if (page === 'hotels' && options?.city) {
    return getCityHotelsShareUrl(options.city);
  }
  if (page === 'offers' && options?.offerId) {
    return getOfferShareUrl(options.offerId);
  }
  if (page === 'home') {
    return `${baseUrl}#/home`;
  }
  return `${baseUrl}#/${page}`;
}

/**
 * Parse the current browser URL (hash and search params) to determine current page, tabs, filters, and modals
 */
export function parseCurrentRoute(hotels: Hotel[] = []): ParsedRoute {
  if (typeof window === 'undefined') {
    return { page: 'home' };
  }

  const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
  const rawPath = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').trim();
  const targetStr = rawHash || rawPath;

  // Extract path and query string from hash or search
  let pathPart = targetStr;
  let queryPart = '';
  
  if (targetStr.includes('?')) {
    const parts = targetStr.split('?');
    pathPart = parts[0];
    queryPart = parts.slice(1).join('?');
  } else if (window.location.search) {
    queryPart = window.location.search.replace(/^\?/, '');
  }

  const searchParams = new URLSearchParams(queryPart);
  const photoParam = searchParams.get('src') || searchParams.get('img') || searchParams.get('photo');
  const cityParam = searchParams.get('city');
  const districtParam = searchParams.get('district');
  const tabParam = searchParams.get('tab');
  const offerParam = searchParams.get('offer');

  // Direct Image/Media view route: #/image?src=... or #/media?src=...
  if (pathPart.startsWith('image') || pathPart.startsWith('media') || photoParam) {
    return {
      page: 'home',
      photoUrl: photoParam || undefined
    };
  }

  if (!pathPart || pathPart === 'home') {
    return { page: 'home' };
  }

  // 1. Admin Route: #/admin, #/admin/settings, #/admin-settings, #/admin/hotels, etc.
  if (pathPart.startsWith('admin')) {
    let tab: AdminTab = 'hotels';
    const adminMatch = pathPart.match(/^admin[/-]([a-zA-Z0-9_-]+)/i);
    const validTabs: AdminTab[] = [
      'hotels', 'bookings', 'rooms-inventory', 'districts', 'users', 'intro-video', 'slides', 
      'offers', 'about', 'reviews', 'messages', 'settings'
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
      adminTab: tab
    };
  }

  // 2. Hotel Detail Route: #/hotel/:slugOrId or #/hotels/:slugOrId
  const hotelMatch = pathPart.match(/^(?:home\/)?(?:hotel|hotels)[/-](.+)$/i);
  if (hotelMatch && hotelMatch[1]) {
    const rawSlugOrId = decodeURIComponent(hotelMatch[1]).trim();
    
    // Check if it's a city filter shortcut like #/hotels/makkah or #/hotels/madinah
    if (rawSlugOrId === 'makkah' || rawSlugOrId === 'makkah-hotels' || rawSlugOrId === 'مكة' || rawSlugOrId === 'مكة-المكرمة') {
      return {
        page: 'hotels',
        cityFilter: 'مكة المكرمة'
      };
    }
    if (rawSlugOrId === 'madinah' || rawSlugOrId === 'madinah-hotels' || rawSlugOrId === 'المدينة' || rawSlugOrId === 'المدينة-المنورة') {
      return {
        page: 'hotels',
        cityFilter: 'المدينة المنورة'
      };
    }

    const hotel = findHotelBySlugOrId(hotels, rawSlugOrId);
    return {
      page: 'hotel-detail',
      hotelId: hotel?.id || rawSlugOrId,
      selectedHotel: hotel,
      hotelTab: tabParam || undefined
    };
  }

  // 3. Hotels Page with possible City or District filter: #/hotels, #/hotels-makkah, #/hotels-madinah
  if (pathPart.startsWith('hotels') || pathPart === 'hotels-makkah' || pathPart === 'hotels-madinah') {
    let resolvedCity: 'all' | 'مكة المكرمة' | 'المدينة المنورة' = 'all';
    if (pathPart.includes('makkah') || cityParam?.toLowerCase().includes('makkah') || cityParam?.includes('مكة')) {
      resolvedCity = 'مكة المكرمة';
    } else if (pathPart.includes('madinah') || cityParam?.toLowerCase().includes('madinah') || cityParam?.includes('مدينة')) {
      resolvedCity = 'المدينة المنورة';
    }

    return {
      page: 'hotels',
      cityFilter: resolvedCity,
      districtFilter: districtParam || undefined
    };
  }

  // 4. Offers Route: #/offers, #/ads, #/offer/:id, #/offers/:id
  if (pathPart.startsWith('offers') || pathPart.startsWith('offer') || pathPart.startsWith('ads') || pathPart.startsWith('ad')) {
    const offerMatch = pathPart.match(/^(?:offers|offer|ads|ad)[/-](.+)$/i);
    const resolvedOfferId = offerMatch ? decodeURIComponent(offerMatch[1]).trim() : (offerParam || undefined);
    return {
      page: 'offers',
      offerId: resolvedOfferId
    };
  }

  // 5. Room Booking Route: #/room-booking, #/bookings, #/booking, #/bookings?hotel=xxx or #/bookings/:hotelId
  if (pathPart.startsWith('room-booking') || pathPart.startsWith('bookings') || pathPart.startsWith('booking')) {
    const hotelParam = searchParams.get('hotel') || searchParams.get('hotelId');
    const bookingMatch = pathPart.match(/^(?:room-booking|bookings|booking)[/-](.+)$/i);
    const matchedHotelId = bookingMatch ? decodeURIComponent(bookingMatch[1]).trim() : undefined;
    const hotelIdentifier = hotelParam || matchedHotelId;
    const hotel = hotelIdentifier ? findHotelBySlugOrId(hotels, hotelIdentifier) : undefined;

    return { 
      page: 'room-booking',
      hotelId: hotel?.id || hotelIdentifier,
      selectedHotel: hotel
    };
  }

  // 6. About Page: #/about
  if (pathPart.startsWith('about')) {
    return { page: 'about' };
  }

  // 7. Contact Page: #/contact
  if (pathPart.startsWith('contact')) {
    return { page: 'contact' };
  }

  return { page: 'home' };
}

/**
 * Update the URL in the address bar cleanly without reloading the page
 */
export function syncRouteToUrl(
  page: ActivePage, 
  options?: {
    hotel?: Hotel;
    adminTab?: AdminTab;
    cityFilter?: 'all' | 'مكة المكرمة' | 'المدينة المنورة';
    districtFilter?: string;
    offerId?: string;
    hotelTab?: string;
    photoUrl?: string;
  },
  replaceState = false
) {
  if (typeof window === 'undefined') return;

  let targetHash = `#/${page}`;
  
  if (page === 'hotel-detail' && options?.hotel) {
    const slug = getHotelSlug(options.hotel);
    const query = options?.hotelTab ? `?tab=${options.hotelTab}` : '';
    targetHash = `#/hotel/${slug}${query}`;
  } else if (page === 'admin') {
    const tab = options?.adminTab || 'hotels';
    targetHash = `#/admin/${tab}`;
  } else if (page === 'hotels') {
    if (options?.cityFilter === 'مكة المكرمة') {
      targetHash = `#/hotels/makkah`;
    } else if (options?.cityFilter === 'المدينة المنورة') {
      targetHash = `#/hotels/madinah`;
    } else {
      targetHash = `#/hotels`;
    }
  } else if (page === 'offers') {
    if (options?.offerId) {
      targetHash = `#/offer/${options.offerId}`;
    } else {
      targetHash = `#/offers`;
    }
  } else if (page === 'room-booking') {
    if (options?.hotel) {
      targetHash = `#/bookings?hotel=${options.hotel.id}`;
    } else {
      targetHash = '#/bookings';
    }
  } else if (page === 'home') {
    if (options?.photoUrl) {
      targetHash = `#/image?src=${encodeURIComponent(options.photoUrl)}`;
    } else {
      targetHash = '#/home';
    }
  }

  if (window.location.hash !== targetHash) {
    if (replaceState) {
      window.history.replaceState(null, '', targetHash);
    } else {
      window.location.hash = targetHash;
    }
  }
}
