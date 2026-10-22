import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Hotel, 
  Offer, 
  ContactMessage, 
  SiteSettings, 
  HotelReview, 
  District, 
  AdminUser, 
  ContentItem,
  AdminRole,
  AuditLogEntry,
  SUPER_ADMIN_ROLE_ID,
  BOOKINGS_STAFF_ROLE_ID,
  DEFAULT_ADMIN_ROLES
} from '../types';
import { safeSetLocalStorage, safeStringify } from './firebase';

// Storage keys for dynamic Supabase settings
export const SUPABASE_URL_KEY = 'diy_supabase_url';
export const SUPABASE_KEY_KEY = 'diy_supabase_anon_key';

export const DEFAULT_SUPABASE_URL = 'https://nejmudhoamtugdaqfbdd.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lam11ZGhvYW10dWdkYXFmYmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2ODM3NDgsImV4cCI6MjEwNjI1OTc0OH0.E_VF3-JH9wyWxgSJyHBk8SS8BQM1nrDLYZN9I9YU6P8';

// Helper to get active Supabase credentials (from env or stored settings or defaults)
export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  let url = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  let anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  // Auto-heal: If env points to the dead/deleted Supabase project or placeholder, fallback to active project
  if (url.includes('tjywogkyazdyqqncdshi') || url.includes('placeholder')) {
    url = DEFAULT_SUPABASE_URL;
    anonKey = DEFAULT_SUPABASE_ANON_KEY;
  }

  try {
    const customUrl = localStorage.getItem(SUPABASE_URL_KEY);
    const customKey = localStorage.getItem(SUPABASE_KEY_KEY);
    if (customUrl && customUrl.trim()) {
      if (customUrl.includes('tjywogkyazdyqqncdshi')) {
        localStorage.removeItem(SUPABASE_URL_KEY);
        localStorage.removeItem(SUPABASE_KEY_KEY);
      } else {
        url = customUrl.trim();
        if (customKey && customKey.trim()) anonKey = customKey.trim();
      }
    }
  } catch {}

  const isConfigured = Boolean(url && anonKey && url.startsWith('http') && !url.includes('placeholder'));
  return { url, anonKey, isConfigured };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    if (url) localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    if (anonKey) localStorage.setItem(SUPABASE_KEY_KEY, anonKey.trim());
  } catch (err) {
    console.warn('Failed to save Supabase config to localStorage:', err);
  }
}

// Singleton client initialization
let cachedClient: SupabaseClient | null = null;
let lastClientUrl = '';
let lastClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (cachedClient && lastClientUrl === url && lastClientKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    lastClientUrl = url;
    lastClientKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Live connection test
export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
}> {
  const url = customUrl || getSupabaseConfig().url;
  const anonKey = customKey || getSupabaseConfig().anonKey;

  if (!url || !anonKey) {
    return {
      success: false,
      message: 'يرجى إدخال عنوان URL ومفتاح Anon Key للاتصال بقاعدة بيانات Supabase.'
    };
  }

  const startTime = Date.now();
  try {
    const client = createClient(url, anonKey);
    const { data, error } = await client.from('districts').select('id').limit(1);
    const latencyMs = Date.now() - startTime;

    if (error) {
      // If table does not exist yet, connection is still valid
      if (error.code === '42P01') {
        return {
          success: true,
          message: `تم الاتصال بنجاح بـ Supabase (${latencyMs}ms)، ولكن يلزم تنفيذ سكريبت الجداول SQL Schema.`,
          latencyMs
        };
      }
      return {
        success: false,
        message: `خطأ من Supabase: ${error.message} (${error.code || ''})`
      };
    }

    return {
      success: true,
      message: `تم الاتصال بنجاح بقاعدة بيانات Supabase! زمن الاستجابة: ${latencyMs}ms`,
      latencyMs
    };
  } catch (err: any) {
    return {
      success: false,
      message: `تعذر الاتصال: ${err.message || 'تأكد من صحة الرابط ومفتاح الوصول.'}`
    };
  }
}

// ==========================================
// 1. HOTELS CRUD (Supabase)
// ==========================================
export function mapSupabaseRowToHotel(row: any): Hotel {
  const safeParseArray = (val: any): string[] => {
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {}
      }
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  let loc: any = {};
  try {
    loc = typeof row.location === 'object' && row.location 
      ? row.location 
      : (typeof row.location === 'string' ? JSON.parse(row.location || '{}') : {});
  } catch {
    loc = {};
  }

  return {
    ...row,
    id: row.id,
    name: row.name,
    nameEn: row.name_en || row.nameEn || '',
    city: row.city,
    district: row.district || 'المنطقة المركزية',
    stars: row.stars || 5,
    rating: row.rating || 5,
    reviewCount: row.review_count || row.reviewCount || 0,
    featured: row.featured ?? true,
    categories: safeParseArray(row.categories),
    galleryImages: safeParseArray(row.gallery_images || row.galleryImages)
      .filter(Boolean)
      .map((item: any) => {
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'object' && item !== null) {
          return {
            url: (item.url || '').trim(),
            category: item.category || 'all',
            title: item.title || ''
          };
        }
        return null;
      })
      .filter((item: any) => typeof item === 'string' ? Boolean(item) : Boolean(item?.url)),
    amenities: safeParseArray(row.amenities).filter((a: any) => typeof a === 'string' && a.trim().length > 0),
    location: loc,
    viewType: loc.viewType || row.view_type || undefined,
    transportType: loc.transportType || row.transport_type || undefined,
    mainImage: row.main_image || row.mainImage || '',
    distanceToHaram: row.distance_to_haram || row.distanceToHaram || 0,
    distanceText: row.distance_text || row.distanceText || '',
    walkingTimeMinutes: row.walking_time_minutes || row.walkingTimeMinutes || 0,
    videoUrl: row.video_url || row.videoUrl || '',
    bookingUrl: row.booking_url || row.bookingUrl || '',
    showBookingUrl: row.show_booking_url !== false,
    agodaUrl: row.agoda_url || row.agodaUrl || '',
    showAgodaUrl: row.show_agoda_url !== false,
    expediaUrl: row.expedia_url || row.expediaUrl || '',
    showExpediaUrl: row.show_expedia_url !== false,
    googleMapsUrl: row.google_maps_url || row.googleMapsUrl || '',
    showGoogleMapsUrl: row.show_google_maps_url !== false,
    hotelWhatsApp: row.hotel_whatsapp || row.hotelWhatsApp || '',
    showHotelWhatsApp: row.show_hotel_whatsapp !== false,
    hotelEmail: row.hotel_email || row.hotelEmail || '',
    showHotelEmail: row.show_hotel_email !== false,
    detailedDescription: row.detailed_description || row.detailedDescription || '',
    metaDescription: loc.metaDescription || '',
    order: typeof row.order_num === 'number' 
      ? row.order_num 
      : (typeof loc.order === 'number' ? loc.order : 0),
    isActive: typeof row.is_active === 'boolean' 
      ? row.is_active 
      : (loc.isActive !== false),
    onlineBookingEnabled: typeof row.online_booking_enabled === 'boolean'
      ? row.online_booking_enabled
      : (typeof loc.onlineBookingEnabled === 'boolean' 
          ? loc.onlineBookingEnabled 
          : (row.onlineBookingEnabled === true || loc.onlineBookingEnabled === true || row.id === 'hotel_test_1790703048618')),
    bookingPolicy: row.booking_policy || row.bookingPolicy || undefined,
    showDistanceBadge: typeof loc.showDistanceBadge === 'boolean'
      ? loc.showDistanceBadge
      : (typeof (row.booking_policy as any)?.showDistanceBadge === 'boolean'
          ? (row.booking_policy as any).showDistanceBadge
          : true),
    showTransportInfo: typeof loc.showDistanceBadge === 'boolean'
      ? loc.showDistanceBadge
      : (typeof (row.booking_policy as any)?.showDistanceBadge === 'boolean'
          ? (row.booking_policy as any).showDistanceBadge
          : true),
    showStars: typeof loc.showStars === 'boolean' ? loc.showStars : true,
    showRating: typeof loc.showRating === 'boolean' ? loc.showRating : true,
    showCategories: typeof loc.showCategories === 'boolean' ? loc.showCategories : true,
    showDistrict: typeof loc.showDistrict === 'boolean' ? loc.showDistrict : true,
    customClassification: loc.customClassification || ''
  };
}

export async function fetchHotelsFromSupabase(): Promise<Hotel[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('hotels')
      .select('*')
      .order('order_num', { ascending: true })
      .order('rating', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchHotels error:', error);
      return null;
    }

    return (data || []).map(mapSupabaseRowToHotel);
  } catch (err) {
    console.warn('[Supabase] Exception fetching hotels:', err);
    return null;
  }
}

export async function upsertHotelToSupabase(hotel: Hotel): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Automatic Base64 Sanitization: ensure no large data URIs bloat the PostgreSQL DB
    let cleanMainImage = hotel.mainImage || '';
    if (cleanMainImage.startsWith('data:')) {
      const uploaded = await uploadBase64ToSupabase(cleanMainImage, `hotels/${hotel.id}`);
      if (uploaded) cleanMainImage = uploaded;
    }

    let cleanGalleryImages = (hotel.galleryImages || []).filter(Boolean);
    if (Array.isArray(cleanGalleryImages)) {
      cleanGalleryImages = await Promise.all(
        cleanGalleryImages.map(async (item) => {
          if (!item) return null;
          const url = typeof item === 'string' ? item : (item.url || '');
          if (url && url.startsWith('data:')) {
            const uploaded = await uploadBase64ToSupabase(url, `hotels/${hotel.id}`);
            if (uploaded) {
              return typeof item === 'string' ? uploaded : { ...item, url: uploaded };
            }
          }
          return item;
        })
      );
      cleanGalleryImages = cleanGalleryImages.filter(Boolean);
    }

    const isOnline = hotel.onlineBookingEnabled === true;
    const loc = {
      ...(hotel.location || {}),
      viewType: hotel.viewType || hotel.location?.viewType || undefined,
      transportType: hotel.transportType || hotel.location?.transportType || undefined,
      order: typeof hotel.order === 'number' ? hotel.order : 0,
      isActive: hotel.isActive !== false,
      onlineBookingEnabled: isOnline,
      showDistanceBadge: hotel.showDistanceBadge !== false,
      showTransportInfo: hotel.showDistanceBadge !== false,
      showStars: hotel.showStars !== false,
      showRating: hotel.showRating !== false,
      showCategories: hotel.showCategories !== false,
      showDistrict: hotel.showDistrict !== false,
      customClassification: hotel.customClassification || '',
      metaDescription: hotel.metaDescription || ''
    };

    const payload = {
      id: hotel.id,
      name: hotel.name,
      name_en: hotel.nameEn || '',
      city: hotel.city,
      district: hotel.district || 'المنطقة المركزية',
      stars: hotel.stars || 5,
      distance_to_haram: hotel.distanceToHaram || 0,
      distance_text: hotel.distanceText || '',
      walking_time_minutes: hotel.walkingTimeMinutes || 0,
      featured: hotel.featured ?? true,
      categories: hotel.categories || [],
      rating: hotel.rating || 5,
      review_count: hotel.reviewCount || 0,
      main_image: cleanMainImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      gallery_images: cleanGalleryImages,
      video_url: hotel.videoUrl || '',
      overview: hotel.overview || '',
      detailed_description: hotel.detailedDescription || '',
      amenities: hotel.amenities || [],
      booking_url: hotel.bookingUrl || '',
      show_booking_url: hotel.showBookingUrl !== false,
      agoda_url: hotel.agodaUrl || '',
      show_agoda_url: hotel.showAgodaUrl !== false,
      expedia_url: hotel.expediaUrl || '',
      show_expedia_url: hotel.showExpediaUrl !== false,
      google_maps_url: hotel.googleMapsUrl || '',
      show_google_maps_url: hotel.showGoogleMapsUrl !== false,
      hotel_whatsapp: hotel.hotelWhatsApp || '',
      show_hotel_whatsapp: hotel.showHotelWhatsApp !== false,
      hotel_email: hotel.hotelEmail || '',
      show_hotel_email: hotel.showHotelEmail !== false,
      location: loc,
      keywords: hotel.keywords || '',
      is_active: hotel.isActive !== false,
      online_booking_enabled: isOnline,
      booking_policy: typeof hotel.bookingPolicy === 'object' && hotel.bookingPolicy 
        ? { ...hotel.bookingPolicy, showDistanceBadge: hotel.showDistanceBadge !== false } 
        : (hotel.bookingPolicy || null),
      order_num: typeof hotel.order === 'number' ? hotel.order : 0,
      updated_at: new Date().toISOString()
    };

    const { error } = await client.from('hotels').upsert(payload);
    if (error) {
      console.warn('[Supabase] upsertHotel error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exception upserting hotel:', err);
    return false;
  }
}

export async function deleteHotelFromSupabase(hotelId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('hotels').delete().eq('id', hotelId);
    return !error;
  } catch (err) {
    console.warn('[Supabase] deleteHotel error:', err);
    return false;
  }
}

// ==========================================
// 2. OFFERS / ADS CRUD (Supabase)
// ==========================================
export async function fetchOffersFromSupabase(): Promise<Offer[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return null;
    return (data || []).map((row: any) => {
      let extraMeta: any = {};
      try {
        if (row.meta_description && row.meta_description.startsWith('{')) {
          extraMeta = JSON.parse(row.meta_description);
        }
      } catch {}

      return {
        id: row.id,
        title: row.title,
        shortDescription: row.short_description || row.shortDescription || '',
        fullDescription: row.full_description || row.fullDescription || '',
        mediaType: row.media_type || row.mediaType || 'image',
        mediaUrl: row.media_url || row.mediaUrl || '',
        videoUrl: row.video_url || row.videoUrl || '',
        gallery: Array.isArray(extraMeta.gallery) ? extraMeta.gallery : (Array.isArray(row.gallery) ? row.gallery : []),
        discountPercentage: row.discount_percentage ?? row.discountPercentage ?? 0,
        showDiscount: extraMeta.showDiscount !== undefined ? Boolean(extraMeta.showDiscount) : true,
        endDate: row.end_date || row.endDate || '',
        showCountdown: extraMeta.showCountdown !== undefined ? Boolean(extraMeta.showCountdown) : true,
        showInHeroSlides: extraMeta.showInHeroSlides !== undefined ? Boolean(extraMeta.showInHeroSlides) : false,
        isActive: row.is_active ?? row.isActive ?? true,
        badgeText: row.badge_text || row.badgeText || '',
        keywords: row.keywords || '',
        metaDescription: extraMeta.originalMetaDescription || (row.meta_description?.startsWith('{') ? '' : row.meta_description || '')
      };
    });
  } catch (err) {
    return null;
  }
}

export async function upsertOfferToSupabase(offer: Offer): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const extraMeta = {
      gallery: offer.gallery || [],
      showDiscount: offer.showDiscount !== false,
      showCountdown: offer.showCountdown !== false,
      showInHeroSlides: Boolean(offer.showInHeroSlides),
      originalMetaDescription: offer.metaDescription || ''
    };

    const payload = {
      id: offer.id,
      title: offer.title,
      short_description: offer.shortDescription,
      full_description: offer.fullDescription,
      media_type: offer.mediaType,
      media_url: offer.mediaUrl,
      video_url: offer.videoUrl || '',
      discount_percentage: offer.discountPercentage ?? 0,
      end_date: offer.endDate || '',
      is_active: offer.isActive !== false,
      badge_text: offer.badgeText || '',
      keywords: offer.keywords || '',
      meta_description: JSON.stringify(extraMeta),
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from('offers').upsert(payload);
    if (error) {
      console.warn('[Supabase] upsertOffer error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exception upserting offer:', err);
    return false;
  }
}

export async function deleteOfferFromSupabase(offerId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('offers').delete().eq('id', offerId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 3. DISTRICTS CRUD (Supabase)
// ==========================================
export async function fetchDistrictsFromSupabase(): Promise<District[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('districts')
      .select('*')
      .order('order_num', { ascending: true });

    if (error) return null;
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      description: row.description || '',
      distanceRange: row.distance_range || row.distanceRange || '',
      order: row.order_num ?? row.order ?? 0,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
    }));
  } catch {
    return null;
  }
}

export async function upsertDistrictToSupabase(district: District): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: district.id,
      name: district.name,
      city: district.city,
      description: district.description || '',
      distance_range: district.distanceRange || '',
      order_num: district.order ?? 0,
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from('districts').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteDistrictFromSupabase(districtId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('districts').delete().eq('id', districtId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 4. REVIEWS CRUD (Supabase)
// ==========================================
export async function fetchReviewsFromSupabase(): Promise<HotelReview[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return null;
    return (data || []).map((row: any) => ({
      id: row.id,
      hotelId: row.hotel_id || row.hotelId,
      hotelName: row.hotel_name || row.hotelName,
      authorName: row.author_name || row.authorName,
      country: row.country || '',
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      status: row.status || 'pending',
      stayDate: row.stay_date || row.stayDate || ''
    }));
  } catch {
    return null;
  }
}

export async function upsertReviewToSupabase(review: HotelReview): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: review.id,
      hotel_id: review.hotelId,
      hotel_name: review.hotelName,
      author_name: review.authorName,
      country: review.country || '',
      rating: review.rating,
      comment: review.comment,
      status: review.status || 'pending',
      stay_date: review.stayDate || '',
      created_at: new Date(review.createdAt || Date.now()).toISOString()
    };
    const { error } = await client.from('reviews').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteReviewFromSupabase(reviewId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('reviews').delete().eq('id', reviewId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 5. CONTACT MESSAGES CRUD (Supabase)
// ==========================================
export async function fetchMessagesFromSupabase(): Promise<ContactMessage[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return null;
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      city: row.city,
      hotelInterest: row.hotel_interest || row.hotelInterest,
      message: row.message,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      read: row.read ?? false
    }));
  } catch {
    return null;
  }
}

export async function insertMessageToSupabase(msg: ContactMessage): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: msg.id,
      name: msg.name,
      email: msg.email,
      phone: msg.phone,
      city: msg.city,
      hotel_interest: msg.hotelInterest || '',
      message: msg.message,
      read: msg.read ?? false,
      created_at: new Date(msg.createdAt || Date.now()).toISOString()
    };
    const { error } = await client.from('messages').insert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function updateMessageReadStatusInSupabase(messageId: string, read: boolean): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('messages').update({ read }).eq('id', messageId);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteMessageFromSupabase(messageId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('messages').delete().eq('id', messageId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 6. ADMIN USERS CRUD (Supabase)
// ==========================================
export async function fetchAdminUsersFromSupabase(): Promise<AdminUser[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return null;
    return (data || []).map((row: any) => {
      let roleIds: string[] = [];
      if (Array.isArray(row.role_ids)) {
        roleIds = row.role_ids;
      } else if (typeof row.role_ids === 'string') {
        try { roleIds = JSON.parse(row.role_ids); } catch {}
      }
      if (roleIds.length === 0) {
        roleIds = (row.role === 'admin' || row.username?.toLowerCase() === 'a.hesham')
          ? [SUPER_ADMIN_ROLE_ID]
          : [BOOKINGS_STAFF_ROLE_ID];
      }
      return {
        id: row.id,
        name: row.name,
        username: row.username || (row.email ? row.email.split('@')[0] : 'user'),
        email: row.email,
        role: row.role || (roleIds.includes(SUPER_ADMIN_ROLE_ID) ? 'admin' : 'controller'),
        roleIds,
        password: row.password || '',
        status: row.status || 'active',
        notes: row.notes || '',
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
      };
    });
  } catch {
    return null;
  }
}

export async function upsertAdminUserToSupabase(user: AdminUser): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: user.id,
      name: user.name,
      username: user.username || user.email.split('@')[0],
      email: user.email,
      role: user.role || (user.roleIds?.includes(SUPER_ADMIN_ROLE_ID) ? 'admin' : 'controller'),
      role_ids: user.roleIds || [],
      password: user.password || '',
      status: user.status || 'active',
      notes: user.notes || '',
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from('admin_users').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteAdminUserFromSupabase(userId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('admin_users').delete().eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 6B. ADMIN ROLES CRUD (Supabase)
// ==========================================
// 6B. ADMIN ROLES (Supabase RBAC)
// ==========================================
let adminRolesTableAvailable: boolean | null = null;

export function resetAdminRolesTableCheck() {
  adminRolesTableAvailable = null;
  try {
    localStorage.removeItem('supabase_missing_admin_roles');
  } catch {}
}

export async function fetchAdminRolesFromSupabase(): Promise<AdminRole[] | null> {
  if (adminRolesTableAvailable === false) return null;
  try {
    if (localStorage.getItem('supabase_missing_admin_roles') === 'true') {
      adminRolesTableAvailable = false;
      return null;
    }
  } catch {}

  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error, status } = await client
      .from('admin_roles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      if (status === 404 || error.code === 'PGRST205' || error.message?.includes('not found') || error.message?.includes('does not exist')) {
        adminRolesTableAvailable = false;
        try {
          localStorage.setItem('supabase_missing_admin_roles', 'true');
        } catch {}
      }
      return null;
    }

    if (!data || data.length === 0) return null;
    adminRolesTableAvailable = true;
    try {
      localStorage.removeItem('supabase_missing_admin_roles');
    } catch {}

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      nameEn: row.name_en || undefined,
      description: row.description || '',
      isSystem: row.is_system === true,
      permissions: typeof row.permissions === 'object' ? row.permissions : JSON.parse(row.permissions || '{}'),
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined
    }));
  } catch {
    return null;
  }
}

export async function upsertAdminRoleToSupabase(role: AdminRole): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: role.id,
      name: role.name,
      name_en: role.nameEn || '',
      description: role.description || '',
      is_system: role.isSystem || false,
      permissions: role.permissions,
      updated_at: new Date().toISOString()
    };
    const { error, status } = await client.from('admin_roles').upsert(payload);
    if (error) {
      if (status === 404 || error.code === 'PGRST205' || error.message?.includes('not found') || error.message?.includes('does not exist')) {
        adminRolesTableAvailable = false;
        try {
          localStorage.setItem('supabase_missing_admin_roles', 'true');
        } catch {}
      }
      return false;
    }
    adminRolesTableAvailable = true;
    try {
      localStorage.removeItem('supabase_missing_admin_roles');
    } catch {}
    return !error;
  } catch {
    return false;
  }
}

export async function deleteAdminRoleFromSupabase(roleId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error, status } = await client.from('admin_roles').delete().eq('id', roleId);
    if (error) {
      if (status === 404 || error.code === 'PGRST205' || error.message?.includes('not found') || error.message?.includes('does not exist')) {
        adminRolesTableAvailable = false;
        try {
          localStorage.setItem('supabase_missing_admin_roles', 'true');
        } catch {}
      }
      return false;
    }
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 6C. AUDIT LOGS (Supabase)
// ==========================================
let auditLogsTableAvailable: boolean | null = null;

export function resetAuditLogsTableCheck() {
  auditLogsTableAvailable = null;
  try {
    localStorage.removeItem('supabase_missing_audit_logs');
  } catch {}
}

export async function fetchAuditLogsFromSupabase(limit = 200): Promise<AuditLogEntry[] | null> {
  if (auditLogsTableAvailable === false) return null;
  try {
    if (localStorage.getItem('supabase_missing_audit_logs') === 'true') {
      auditLogsTableAvailable = false;
      return null;
    }
  } catch {}

  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error, status } = await client
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (status === 404 || error.code === 'PGRST205' || error.message?.includes('not found') || error.message?.includes('does not exist')) {
        auditLogsTableAvailable = false;
        try {
          localStorage.setItem('supabase_missing_audit_logs', 'true');
        } catch {}
      }
      return null;
    }

    if (!data) return null;
    auditLogsTableAvailable = true;
    try {
      localStorage.removeItem('supabase_missing_audit_logs');
    } catch {}

    return data.map((row: any) => ({
      id: row.id,
      timestamp: row.timestamp || (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
      userId: row.user_id,
      userName: row.user_name || 'مسؤول',
      userEmail: row.user_email || undefined,
      module: row.module,
      action: row.action,
      actionLabelAr: row.action_label_ar || row.action,
      recordId: row.record_id || undefined,
      recordTitle: row.record_title || undefined,
      details: row.details || '',
      oldValue: typeof row.old_value === 'string' ? JSON.parse(row.old_value) : row.old_value,
      newValue: typeof row.new_value === 'string' ? JSON.parse(row.new_value) : row.new_value
    }));
  } catch {
    return null;
  }
}

export async function insertAuditLogToSupabase(log: AuditLogEntry): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: log.id,
      timestamp: log.timestamp,
      user_id: log.userId,
      user_name: log.userName,
      user_email: log.userEmail || null,
      module: log.module,
      action: log.action,
      action_label_ar: log.actionLabelAr,
      record_id: log.recordId || null,
      record_title: log.recordTitle || null,
      details: log.details,
      old_value: log.oldValue !== undefined ? log.oldValue : null,
      new_value: log.newValue !== undefined ? log.newValue : null,
      created_at: new Date(log.timestamp).toISOString()
    };
    const { error, status } = await client.from('audit_logs').insert(payload);
    if (error) {
      if (status === 404 || error.code === 'PGRST205' || error.message?.includes('not found')) {
        auditLogsTableAvailable = false;
      }
      return false;
    }
    auditLogsTableAvailable = true;
    return !error;
  } catch {
    return false;
  }
}


// ==========================================
// 7. SITE SETTINGS CRUD (Supabase)
// ==========================================
export async function fetchSiteSettingsFromSupabase(): Promise<SiteSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('site_settings')
      .select('settings_data')
      .eq('id', 'main_config')
      .maybeSingle();

    if (error || !data) return null;
    const raw = typeof data.settings_data === 'object' ? data.settings_data : JSON.parse(data.settings_data);
    if (raw) {
      if (raw.introVideo) {
        if (typeof raw.introVideo.videoUrl === 'object' && raw.introVideo.videoUrl !== null) {
          raw.introVideo.videoUrl = (raw.introVideo.videoUrl as any).url || (raw.introVideo.videoUrl as any).src || '';
        }
        if (typeof raw.introVideo.posterUrl === 'object' && raw.introVideo.posterUrl !== null) {
          raw.introVideo.posterUrl = (raw.introVideo.posterUrl as any).url || (raw.introVideo.posterUrl as any).src || '';
        }
      }
    }
    return raw;
  } catch {
    return null;
  }
}

export async function upsertSiteSettingsToSupabase(settings: SiteSettings): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const cleanSettings: SiteSettings = { ...settings };
    if (cleanSettings.introVideo) {
      const v = cleanSettings.introVideo.videoUrl;
      const p = cleanSettings.introVideo.posterUrl;
      cleanSettings.introVideo = {
        ...cleanSettings.introVideo,
        videoUrl: typeof v === 'string' ? v : ((v as any)?.url || (v as any)?.src || ''),
        posterUrl: typeof p === 'string' ? p : ((p as any)?.url || (p as any)?.src || undefined)
      };
    }

    const payload = {
      id: 'main_config',
      settings_data: cleanSettings,
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from('site_settings').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Realtime subscription to live updates from Supabase (hotels, offers, site_settings, reviews, messages, districts)
 */
export function subscribeToSupabaseRealtime(
  callback: (payload: { table: string; eventType: string; new: any; old: any }) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channel = client
      .channel('prestige-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload: any) => {
          callback({
            table: payload.table,
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] Connected to live PostgreSQL changes ✓');
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to initialize subscription:', err);
    return () => {};
  }
}

// ==========================================
// 8. SUPABASE STORAGE (prestige-media)
// ==========================================

export function base64ToBlob(dataUri: string): { blob: Blob; mimeType: string; ext: string } | null {
  try {
    const parts = dataUri.split(',');
    if (parts.length !== 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('mp4')) ext = 'mp4';
    else if (mimeType.includes('webm')) ext = 'webm';
    return { blob: new Blob([array], { type: mimeType }), mimeType, ext };
  } catch {
    return null;
  }
}

export async function uploadBase64ToSupabase(
  dataUri: string,
  folder = 'images'
): Promise<string | null> {
  if (!dataUri || !dataUri.startsWith('data:')) return dataUri;
  const res = base64ToBlob(dataUri);
  if (!res) return null;
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const safeName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${res.ext}`;
    const { error } = await client.storage
      .from('prestige-media')
      .upload(safeName, res.blob, {
        contentType: res.mimeType,
        cacheControl: '31536000',
        upsert: true
      });
    if (error) {
      console.warn('[Supabase Storage] Base64 upload error:', error);
      return null;
    }
    const { data } = client.storage.from('prestige-media').getPublicUrl(safeName);
    return data.publicUrl;
  } catch (err) {
    console.warn('[Supabase Storage] Base64 upload exception:', err);
    return null;
  }
}

export async function uploadMediaToSupabase(
  file: File | Blob,
  folder: 'videos' | 'images' | string = 'videos',
  customFileName?: string
): Promise<{ url: string; success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { url: '', success: false, error: 'إعدادات Supabase غير متوفرة' };
  }

  try {
    let ext = 'jpg';
    let mimeType = file.type || '';
    if ('name' in file && typeof file.name === 'string') {
      const rawExt = file.name.split('.').pop()?.toLowerCase();
      if (rawExt) ext = rawExt;
    } else {
      if (mimeType.includes('mp4')) ext = 'mp4';
      else if (mimeType.includes('webm')) ext = 'webm';
      else if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (folder.includes('video')) ext = 'mp4';
    }

    if (!mimeType) {
      mimeType = folder.includes('video') ? 'video/mp4' : 'image/jpeg';
    }

    const safeName = customFileName || `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await client.storage
      .from('prestige-media')
      .upload(safeName, file, {
        cacheControl: '31536000',
        upsert: true,
        contentType: mimeType
      });

    if (uploadError) {
      console.warn('[Supabase Storage] Upload error:', uploadError);
      return { url: '', success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = client.storage
      .from('prestige-media')
      .getPublicUrl(safeName);

    return { url: publicUrlData.publicUrl, success: true };
  } catch (err: any) {
    console.warn('[Supabase Storage] Upload exception:', err);
    return { url: '', success: false, error: err?.message || 'حدث خطأ أثناء رفع الملف' };
  }
}

// ==========================================
// Live Content (bilingual key+lang records)
// ==========================================
// In-Flight Promise Deduplication & Cache for Live Content
// ==========================================
let liveContentFetchPromise: Promise<Record<string, ContentItem>> | null = null;
let liveContentCache: { data: Record<string, ContentItem>; timestamp: number } | null = null;
const LIVE_CONTENT_CACHE_TTL = 15000; // 15 seconds

export function invalidateLiveContentCache(): void {
  liveContentCache = null;
  liveContentFetchPromise = null;
}

export async function fetchLiveContentFromSupabase(forceRefresh = false): Promise<Record<string, ContentItem>> {
  if (!forceRefresh && liveContentCache && Date.now() - liveContentCache.timestamp < LIVE_CONTENT_CACHE_TTL) {
    return liveContentCache.data;
  }

  if (liveContentFetchPromise) {
    return liveContentFetchPromise;
  }

  const client = getSupabaseClient();
  if (!client) return {};

  liveContentFetchPromise = (async () => {
    try {
      const { data, error } = await client.from('content').select('*');
      if (error || !Array.isArray(data)) {
        return {};
      }

      const map: Record<string, ContentItem> = {};
      for (const row of data) {
        if (!row || !row.key) continue;
        const rowKey = String(row.key);

        // Check if rowKey has language suffix like "hero.title:ar" or "hero.title:en"
        if (rowKey.includes(':ar') || rowKey.includes(':en')) {
          const parts = rowKey.split(':');
          const baseKey = parts.slice(0, -1).join(':');
          const lang = parts[parts.length - 1] as 'ar' | 'en';
          if (!map[baseKey]) {
            map[baseKey] = { key: baseKey, text: '' };
          }
          map[baseKey][lang] = row.text || '';
          if (lang === 'ar' && !map[baseKey].text) {
            map[baseKey].text = row.text || '';
          }
          if (row.color) map[baseKey].color = row.color;
          if (row.font_size) map[baseKey].fontSize = row.font_size;
          if (row.font_weight) map[baseKey].fontWeight = row.font_weight;
          continue;
        }

        // Check if text is stringified JSON containing { ar, en }
        let parsedJson: any = null;
        if (typeof row.text === 'string' && row.text.startsWith('{') && row.text.endsWith('}')) {
          try {
            parsedJson = JSON.parse(row.text);
          } catch {}
        }

        const existing = map[rowKey] || { key: rowKey, text: '' };
        if (parsedJson && (parsedJson.ar !== undefined || parsedJson.en !== undefined)) {
          map[rowKey] = {
            ...existing,
            key: rowKey,
            ar: parsedJson.ar !== undefined ? parsedJson.ar : existing.ar,
            en: parsedJson.en !== undefined ? parsedJson.en : existing.en,
            text: parsedJson.ar || parsedJson.text || row.text || existing.text,
            color: parsedJson.color || row.color || existing.color,
            fontSize: parsedJson.fontSize || row.font_size || existing.fontSize,
            fontWeight: parsedJson.fontWeight || row.font_weight || existing.fontWeight,
            updatedAt: row.updated_at ? Number(row.updated_at) : existing.updatedAt,
            updatedBy: row.updated_by || existing.updatedBy,
          };
        } else {
          map[rowKey] = {
            ...existing,
            key: rowKey,
            text: row.text || existing.text || '',
            ar: existing.ar || row.text || '',
            color: row.color || existing.color,
            fontSize: row.font_size || existing.fontSize,
            fontWeight: row.font_weight || existing.fontWeight,
            updatedAt: row.updated_at ? Number(row.updated_at) : existing.updatedAt,
            updatedBy: row.updated_by || existing.updatedBy,
          };
        }
      }

      liveContentCache = { data: map, timestamp: Date.now() };
      return map;
    } catch (err) {
      console.warn('[Supabase] fetchLiveContentFromSupabase error:', err);
      return {};
    } finally {
      liveContentFetchPromise = null;
    }
  })();

  return liveContentFetchPromise;
}

export async function upsertLiveContentToSupabase(key: string, item: ContentItem): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const jsonPayload = {
      ar: item.ar ?? (item.text || ''),
      en: item.en ?? '',
      text: item.text ?? (item.ar || ''),
      color: item.color,
      fontSize: item.fontSize,
      fontWeight: item.fontWeight,
      updatedAt: item.updatedAt || Date.now()
    };

    const rowsToUpsert = [
      {
        key: key,
        text: JSON.stringify(jsonPayload),
        color: item.color || null,
        font_size: item.fontSize || null,
        font_weight: item.fontWeight || null,
        updated_at: item.updatedAt || Date.now(),
        updated_by: item.updatedBy || null
      }
    ];

    if (item.ar !== undefined) {
      rowsToUpsert.push({
        key: `${key}:ar`,
        text: item.ar,
        color: item.color || null,
        font_size: item.fontSize || null,
        font_weight: item.fontWeight || null,
        updated_at: item.updatedAt || Date.now(),
        updated_by: item.updatedBy || null
      });
    }

    if (item.en !== undefined) {
      rowsToUpsert.push({
        key: `${key}:en`,
        text: item.en,
        color: item.color || null,
        font_size: item.fontSize || null,
        font_weight: item.fontWeight || null,
        updated_at: item.updatedAt || Date.now(),
        updated_by: item.updatedBy || null
      });
    }

    await client.from('content').upsert(rowsToUpsert);
    invalidateLiveContentCache();
  } catch (err) {
    console.warn('[Supabase] upsertLiveContentToSupabase error:', err);
  }
}

export async function bulkUpsertLiveContentToSupabase(items: ContentItem[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client || items.length === 0) return;

  try {
    const rows: any[] = [];
    for (const item of items) {
      const jsonPayload = {
        ar: item.ar ?? (item.text || ''),
        en: item.en ?? '',
        text: item.text ?? (item.ar || ''),
        color: item.color,
        fontSize: item.fontSize,
        fontWeight: item.fontWeight,
        updatedAt: item.updatedAt || Date.now()
      };
      rows.push({
        key: item.key,
        text: JSON.stringify(jsonPayload),
        color: item.color || null,
        font_size: item.fontSize || null,
        font_weight: item.fontWeight || null,
        updated_at: item.updatedAt || Date.now(),
        updated_by: item.updatedBy || null
      });
      if (item.ar !== undefined) {
        rows.push({
          key: `${item.key}:ar`,
          text: item.ar,
          color: item.color || null,
          font_size: item.fontSize || null,
          font_weight: item.fontWeight || null,
          updated_at: item.updatedAt || Date.now(),
          updated_by: item.updatedBy || null
        });
      }
      if (item.en !== undefined) {
        rows.push({
          key: `${item.key}:en`,
          text: item.en,
          color: item.color || null,
          font_size: item.fontSize || null,
          font_weight: item.fontWeight || null,
          updated_at: item.updatedAt || Date.now(),
          updated_by: item.updatedBy || null
        });
      }
    }

    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      await client.from('content').upsert(batch);
    }
    invalidateLiveContentCache();
  } catch (err) {
    console.warn('[Supabase] bulkUpsertLiveContentToSupabase error:', err);
  }
}

