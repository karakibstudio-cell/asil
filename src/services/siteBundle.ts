/**
 * Ultra-Fast Public Site Bundle Loader
 * يقوم بتحميل وتحديث بيانات الموقع (فنادق، عروض، إعدادات) مباشرة عبر Supabase والتخزين المحلي
 * بدون استيراد حزمة Firebase الضخمة في مسار التحميل الأولي للزوار
 */

import { Hotel, Offer, District, SiteSettings, SiteBundle, HotelReview } from '../types';
import { safeSetLocalStorage } from '../utils/storage';
import { INITIAL_HOTELS, INITIAL_OFFERS, INITIAL_SITE_SETTINGS } from '../data/mockHotels';
import { DEFAULT_SITE_SETTINGS } from '../data/defaultSettings';
import { getHotelSlug } from '../utils/routing';
import {
  fetchHotelsFromSupabase,
  fetchOffersFromSupabase,
  fetchSiteSettingsFromSupabase,
  fetchDistrictsFromSupabase,
  getSupabaseConfig
} from './supabase';

// In-memory cache for 0ms instantaneous read
const memoryCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function getMem<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setMem<T>(key: string, data: T): void {
  memoryCache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

export async function getSiteBundleFromDb(skipCache = false): Promise<SiteBundle> {
  // 1. In-memory cache (0ms)
  if (!skipCache) {
    const mem = getMem<SiteBundle>('site_bundle');
    if (mem) return mem;

    // 2. LocalStorage cache (0ms)
    try {
      const saved = localStorage.getItem('diy_site_bundle');
      if (saved) {
        const parsed = JSON.parse(saved) as SiteBundle;
        if (parsed && Array.isArray(parsed.hotels) && parsed.hotels.length >= INITIAL_HOTELS.length) {
          setMem('site_bundle', parsed);
          return parsed;
        }
      }
    } catch {}
  }

  // 3. Direct, parallel Supabase query (no heavy Firebase SDK!)
  try {
    const [rawSettings, rawHotels, rawOffers, rawDistricts] = await Promise.all([
      fetchSiteSettingsFromSupabase(),
      fetchHotelsFromSupabase(),
      fetchOffersFromSupabase(),
      fetchDistrictsFromSupabase()
    ]);

    const siteSettings: SiteSettings = rawSettings
      ? { ...DEFAULT_SITE_SETTINGS, ...rawSettings }
      : (INITIAL_SITE_SETTINGS || DEFAULT_SITE_SETTINGS);

    const hotels: Hotel[] = Array.isArray(rawHotels) && rawHotels.length > 0
      ? rawHotels
      : INITIAL_HOTELS;

    const offers: Offer[] = Array.isArray(rawOffers)
      ? rawOffers
      : INITIAL_OFFERS;

    const districts: District[] = Array.isArray(rawDistricts)
      ? rawDistricts
      : [];

    const slugMap: Record<string, string> = {};
    hotels.forEach(h => {
      slugMap[h.id] = h.id;
      const slug = getHotelSlug(h);
      if (slug) slugMap[slug] = h.id;
    });

    const bundle: SiteBundle = {
      version: Date.now(),
      updatedAt: Date.now(),
      siteSettings,
      hotels,
      offers,
      districts,
      slugMap
    };

    setMem('site_bundle', bundle);
    safeSetLocalStorage('diy_site_bundle', bundle);
    safeSetLocalStorage('diy_site_settings', siteSettings);
    safeSetLocalStorage('diy_hotels', hotels);
    safeSetLocalStorage('diy_offers', offers);
    safeSetLocalStorage('diy_slug_map', slugMap);

    return bundle;
  } catch (err) {
    console.warn('[SiteBundle] Direct Supabase fetch error, fallback to seed:', err);
    const slugMap: Record<string, string> = {};
    INITIAL_HOTELS.forEach(h => {
      slugMap[h.id] = h.id;
      const slug = getHotelSlug(h);
      if (slug) slugMap[slug] = h.id;
    });
    return {
      version: Date.now(),
      updatedAt: Date.now(),
      siteSettings: INITIAL_SITE_SETTINGS,
      hotels: INITIAL_HOTELS,
      offers: INITIAL_OFFERS,
      districts: [],
      slugMap
    };
  }
}

/**
 * Fetch approved reviews directly from Supabase REST (0ms Firebase overhead)
 */
export async function getApprovedReviewsFromDb(limitCount = 6, hotelId?: string): Promise<HotelReview[]> {
  const cacheKey = `approved_reviews_${hotelId || 'all'}_${limitCount}`;
  const mem = getMem<HotelReview[]>(cacheKey);
  if (mem) return mem;

  try {
    const { url, anonKey, isConfigured } = getSupabaseConfig();
    if (!isConfigured) return [];

    let query = `${url}/rest/v1/reviews?status=eq.approved&order=created_at.desc&limit=${limitCount}`;
    if (hotelId) {
      query += `&hotel_id=eq.${encodeURIComponent(hotelId)}`;
    }

    const res = await fetch(query, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const reviews: HotelReview[] = data.map((r: any) => ({
          id: r.id,
          hotelId: r.hotel_id,
          hotelName: r.hotel_name,
          authorName: r.author_name || 'نزيل',
          avatarUrl: r.avatar_url || '',
          rating: typeof r.rating === 'number' ? r.rating : 5,
          comment: r.comment || '',
          country: r.country || '',
          stayDate: r.stay_date || '',
          status: 'approved',
          createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now()
        }));
        setMem(cacheKey, reviews);
        return reviews;
      }
    }
  } catch (err) {
    console.warn('[SiteBundle] getApprovedReviewsFromDb error:', err);
  }

  return [];
}
