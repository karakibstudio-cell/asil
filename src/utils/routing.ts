import { Hotel, ActivePage } from '../types';

/**
 * Generate a clean, SEO-friendly and human-readable slug for a hotel
 * Example: "فندق برج الساعة فيرمونت" -> "fairmont-makkah-clock-royal-tower" or "Safwat_Al_Khair_Hotel"
 */
export function getHotelSlug(hotel: Hotel): string {
  if (hotel.nameEn && hotel.nameEn.trim()) {
    return hotel.nameEn
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s-]+/g, '_');
  }
  // Arabic slug fallback
  return hotel.name
    .trim()
    .replace(/[^\u0621-\u064A\w\s-]/g, '')
    .replace(/[\s-]+/g, '_');
}

/**
 * Find hotel in list by either ID or slug (English / Arabic / variations)
 */
export function findHotelBySlugOrId(hotels: Hotel[], identifier: string): Hotel | undefined {
  if (!identifier || !hotels || hotels.length === 0) return undefined;
  
  const rawDecoded = decodeURIComponent(identifier).trim();
  const normalized = rawDecoded.toLowerCase().replace(/[\s_-]+/g, '');

  // 1. Direct ID match
  const directId = hotels.find((h) => h.id === rawDecoded || h.id.toLowerCase() === rawDecoded.toLowerCase());
  if (directId) return directId;

  // 2. English name slug match
  const matchEn = hotels.find((h) => {
    if (!h.nameEn) return false;
    const cleanEn = h.nameEn.toLowerCase().replace(/[\s_-]+/g, '');
    const cleanSlug = getHotelSlug(h).toLowerCase().replace(/[\s_-]+/g, '');
    return cleanEn === normalized || cleanSlug === normalized;
  });
  if (matchEn) return matchEn;

  // 3. Arabic name match
  const matchAr = hotels.find((h) => {
    const cleanAr = h.name.toLowerCase().replace(/[\s_-]+/g, '');
    return cleanAr === normalized;
  });
  if (matchAr) return matchAr;

  // 4. Partial substring match
  const partial = hotels.find((h) => {
    const cleanName = h.name.toLowerCase().replace(/[\s_-]+/g, '');
    const cleanEn = (h.nameEn || '').toLowerCase().replace(/[\s_-]+/g, '');
    return cleanName.includes(normalized) || cleanEn.includes(normalized) || normalized.includes(cleanName);
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
