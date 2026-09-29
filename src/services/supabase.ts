import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Hotel, 
  Offer, 
  ContactMessage, 
  SiteSettings, 
  HotelReview, 
  District, 
  AdminUser, 
  ContentItem 
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
    return (data || []).map((row: any) => {
      const loc = typeof row.location === 'object' && row.location 
        ? row.location 
        : (typeof row.location === 'string' ? JSON.parse(row.location || '{}') : {});

      return {
        ...row,
        categories: Array.isArray(row.categories) ? row.categories : (typeof row.categories === 'string' ? JSON.parse(row.categories || '[]') : []),
        galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images : (typeof row.gallery_images === 'string' ? JSON.parse(row.gallery_images || '[]') : []),
        amenities: Array.isArray(row.amenities) ? row.amenities : (typeof row.amenities === 'string' ? JSON.parse(row.amenities || '[]') : []),
        location: loc,
        mainImage: row.main_image || row.mainImage || '',
        distanceToHaram: row.distance_to_haram || row.distanceToHaram || 0,
        distanceText: row.distance_text || row.distanceText || '',
        walkingTimeMinutes: row.walking_time_minutes || row.walkingTimeMinutes || 0,
        reviewCount: row.review_count || row.reviewCount || 0,
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
          : (loc.isActive !== false)
      };
    });
  } catch (err) {
    console.warn('[Supabase] Exception fetching hotels:', err);
    return null;
  }
}

export async function upsertHotelToSupabase(hotel: Hotel): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const loc = {
      ...(hotel.location || {}),
      order: typeof hotel.order === 'number' ? hotel.order : 0,
      isActive: hotel.isActive !== false,
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
      main_image: hotel.mainImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      gallery_images: hotel.galleryImages || [],
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
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      username: row.username || (row.email ? row.email.split('@')[0] : 'user'),
      email: row.email,
      role: row.role || 'controller',
      password: row.password || '',
      status: row.status || 'active',
      notes: row.notes || '',
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
    }));
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
      role: user.role,
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
    if (raw && raw.introVideo) {
      if (typeof raw.introVideo.videoUrl === 'object' && raw.introVideo.videoUrl !== null) {
        raw.introVideo.videoUrl = (raw.introVideo.videoUrl as any).url || (raw.introVideo.videoUrl as any).src || '';
      }
      if (typeof raw.introVideo.posterUrl === 'object' && raw.introVideo.posterUrl !== null) {
        raw.introVideo.posterUrl = (raw.introVideo.posterUrl as any).url || (raw.introVideo.posterUrl as any).src || '';
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
export async function uploadMediaToSupabase(
  file: File,
  folder: 'videos' | 'images' = 'videos'
): Promise<{ url: string; success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { url: '', success: false, error: 'إعدادات Supabase غير متوفرة' };
  }

  try {
    const rawExt = file.name.split('.').pop()?.toLowerCase();
    const ext = rawExt || (folder === 'videos' ? 'mp4' : 'jpg');
    const safeName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await client.storage
      .from('prestige-media')
      .upload(safeName, file, {
        cacheControl: '31536000',
        upsert: true,
        contentType: file.type || (folder === 'videos' ? 'video/mp4' : 'image/jpeg')
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

