import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  writeBatch,
  onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User 
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { 
  Hotel, 
  Offer, 
  ContactMessage, 
  SiteSettings, 
  ContactChannel, 
  ContentItem, 
  HotelReview, 
  HeroSlide, 
  District, 
  AdminUser, 
  BranchLocation, 
  DepartmentContact, 
  QuickLinkItem, 
  AboutPageSettings, 
  StoryTeaserSettings, 
  IntegratedServicesSettings, 
  HomeSectionsSettings,
  AdminRole,
  AuditLogEntry,
  SUPER_ADMIN_ROLE_ID,
  BOOKINGS_STAFF_ROLE_ID,
  AVAILABILITY_MANAGER_ROLE_ID,
  DEFAULT_ADMIN_ROLES,
  PermissionModule
} from '../types';
import { DEFAULT_VALUE_PILLARS } from '../data/aboutPillars';
import { getHotelSlug } from '../utils/routing';
import { DEFAULT_ACTION_BUTTONS, DEFAULT_CONTACTS_DIRECTORY } from '../utils/actionButtons';
import { INITIAL_HOTELS, INITIAL_OFFERS, INITIAL_REVIEWS, INITIAL_SITE_SETTINGS } from '../data/mockHotels';
import {
  fetchHotelsFromSupabase,
  upsertHotelToSupabase,
  deleteHotelFromSupabase,
  fetchOffersFromSupabase,
  upsertOfferToSupabase,
  deleteOfferFromSupabase,
  fetchDistrictsFromSupabase,
  upsertDistrictToSupabase,
  deleteDistrictFromSupabase,
  fetchReviewsFromSupabase,
  upsertReviewToSupabase,
  deleteReviewFromSupabase,
  fetchMessagesFromSupabase,
  insertMessageToSupabase,
  updateMessageReadStatusInSupabase,
  deleteMessageFromSupabase,
  fetchAdminUsersFromSupabase,
  upsertAdminUserToSupabase,
  deleteAdminUserFromSupabase,
  fetchAdminRolesFromSupabase,
  upsertAdminRoleToSupabase,
  deleteAdminRoleFromSupabase,
  fetchAuditLogsFromSupabase,
  insertAuditLogToSupabase,
  fetchSiteSettingsFromSupabase,
  upsertSiteSettingsToSupabase,
  fetchLiveContentFromSupabase,
  upsertLiveContentToSupabase,
  bulkUpsertLiveContentToSupabase,
  getSupabaseConfig
} from './supabase';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfigJson);
  } else {
    app = getApp();
  }
  
  // Initialize Firestore with multi-tab persistent IndexedDB local cache (instant 0ms loads, automatic offline support)
  if (typeof window !== 'undefined') {
    const firestoreDbId = (firebaseConfigJson as any).firestoreDatabaseId && (firebaseConfigJson as any).firestoreDatabaseId !== '(default)' 
      ? (firebaseConfigJson as any).firestoreDatabaseId 
      : undefined;

    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      }, firestoreDbId);
    } catch {
      // Fallback if already initialized or if IndexedDB is restricted
      db = firestoreDbId 
        ? getFirestore(app, firestoreDbId) 
        : getFirestore(app);
    }
  } else {
    const firestoreDbId = (firebaseConfigJson as any).firestoreDatabaseId && (firebaseConfigJson as any).firestoreDatabaseId !== '(default)' 
      ? (firebaseConfigJson as any).firestoreDatabaseId 
      : undefined;
    db = firestoreDbId 
      ? getFirestore(app, firestoreDbId) 
      : getFirestore(app);
  }
  
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase initialization error, will use local persistence fallback:', err);
}

export { app, db, auth };

// Re-export storage utilities from storage.ts
import { 
  safeSetLocalStorage, 
  safeStringify, 
  deepSanitizeData, 
  safeGetLocalStorage 
} from '../utils/storage';

export { 
  safeSetLocalStorage, 
  safeStringify, 
  deepSanitizeData, 
  safeGetLocalStorage 
};

// Collection references
const HOTELS_COLLECTION = 'hotels';
const OFFERS_COLLECTION = 'offers';
const MESSAGES_COLLECTION = 'messages';
const SETTINGS_COLLECTION = 'settings';
const REVIEWS_COLLECTION = 'reviews';
const DISTRICTS_COLLECTION = 'districts';
const USERS_COLLECTION = 'admin_users';
export const CONTENT_COLLECTION = 'content';
export const ROLES_COLLECTION = 'admin_roles';
export const AUDIT_LOGS_COLLECTION = 'audit_logs';

// ==========================================
// In-Memory Fetch Cache & Stale-While-Revalidate Engine
// ==========================================
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes in-memory cache — zero network delay for in-session navigations

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const fetchCache: Record<string, CacheEntry<any>> = {};

export function getCached<T>(key: string, skipCache = false): T | null {
  if (skipCache) return null;
  const entry = fetchCache[key];
  if (entry && (Date.now() - entry.timestamp) < CACHE_TTL_MS) {
    return entry.data as T;
  }
  return null;
}

export function setCache<T>(key: string, data: T): void {
  fetchCache[key] = { data, timestamp: Date.now() };
}

export function invalidateCache(key?: string): void {
  if (key) {
    delete fetchCache[key];
  } else {
    Object.keys(fetchCache).forEach(k => delete fetchCache[k]);
  }
}

export const normalizeHotel = (h: any): Hotel => {
  if (!h || typeof h !== 'object') return h;

  const rawGallery = Array.isArray(h.galleryImages || h.gallery_images)
    ? (h.galleryImages || h.gallery_images)
    : [];
  const cleanGalleryImages = rawGallery
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
    .filter((item: any) => typeof item === 'string' ? Boolean(item) : Boolean(item?.url));

  const cleanAmenities = Array.isArray(h.amenities)
    ? h.amenities.filter((a: any) => typeof a === 'string' && a.trim().length > 0)
    : [];

  const cleanVideos = Array.isArray(h.additionalVideos)
    ? h.additionalVideos.filter((v: any) => v && typeof v === 'object' && v.videoUrl)
    : [];

  return {
    ...h,
    stars: typeof h.stars === 'number' && !isNaN(h.stars) ? Math.max(1, Math.min(5, h.stars)) : 5,
    galleryImages: cleanGalleryImages,
    amenities: cleanAmenities,
    additionalVideos: cleanVideos,
    district: h.district || (h.city === 'مكة المكرمة' ? 'أجياد' : 'المنطقة المركزية الشمالية'),
    featured: h.featured ?? true,
    categories: Array.isArray(h.categories) && h.categories.length > 0 ? h.categories : ['فنادق العمرة'],
    rating: typeof h.rating === 'number' ? h.rating : 4.8,
    reviewCount: typeof h.reviewCount === 'number' ? h.reviewCount : 0,
    bookingUrl: h.bookingUrl || '',
    showBookingUrl: h.showBookingUrl !== false,
    agodaUrl: h.agodaUrl || '',
    showAgodaUrl: h.showAgodaUrl !== false,
    expediaUrl: h.expediaUrl || '',
    showExpediaUrl: h.showExpediaUrl !== false,
    googleMapsUrl: h.googleMapsUrl || '',
    showGoogleMapsUrl: h.showGoogleMapsUrl !== false,
    hotelWhatsApp: h.hotelWhatsApp || '',
    showHotelWhatsApp: h.showHotelWhatsApp !== false,
    hotelEmail: h.hotelEmail || '',
    showHotelEmail: h.showHotelEmail !== false,
    isActive: h.isActive !== false,
    onlineBookingEnabled: typeof h.onlineBookingEnabled === 'boolean'
      ? h.onlineBookingEnabled
      : (typeof h.online_booking_enabled === 'boolean' 
          ? h.online_booking_enabled 
          : (typeof (h.location as any)?.onlineBookingEnabled === 'boolean' 
              ? (h.location as any).onlineBookingEnabled 
              : (h.id === 'hotel_test_1790703048618'))),
    bookingPolicy: h.bookingPolicy || h.booking_policy || undefined,
    order: typeof h.order === 'number' 
      ? h.order 
      : (typeof (h.location as any)?.order === 'number' ? (h.location as any).order : 0),
    showDistanceBadge: typeof h.showDistanceBadge === 'boolean'
      ? h.showDistanceBadge
      : (typeof (h.location as any)?.showDistanceBadge === 'boolean' ? (h.location as any).showDistanceBadge : true),
    showStars: typeof h.showStars === 'boolean'
      ? h.showStars
      : (typeof (h.location as any)?.showStars === 'boolean' ? (h.location as any).showStars : true),
    showRating: typeof h.showRating === 'boolean'
      ? h.showRating
      : (typeof (h.location as any)?.showRating === 'boolean' ? (h.location as any).showRating : true),
    showCategories: typeof h.showCategories === 'boolean'
      ? h.showCategories
      : (typeof (h.location as any)?.showCategories === 'boolean' ? (h.location as any).showCategories : true),
    showDistrict: typeof h.showDistrict === 'boolean'
      ? h.showDistrict
      : (typeof (h.location as any)?.showDistrict === 'boolean' ? (h.location as any).showDistrict : true),
    customClassification: h.customClassification || (h.location as any)?.customClassification || ''
  };
};

// ==========================================
// Single Consolidated Site Bundle & Content Versioning (Loaded ONCE per session)
// ==========================================
export interface SiteBundle {
  version: number;
  updatedAt: number;
  siteSettings: SiteSettings;
  hotels: Hotel[];
  offers: Offer[];
  districts: District[];
  slugMap: Record<string, string>;
}

export function listenToSiteVersion(_callback: (version: number) => void): () => void {
  // Supabase PostgreSQL Realtime handles live multi-client updates directly without Firestore permission issues
  return () => {};
}

export async function bumpSiteVersion(_section?: string): Promise<number> {
  const newVersion = Date.now();
  invalidateCache('site_bundle');
  invalidateCache('site_settings');
  invalidateCache('hotels');
  invalidateCache('offers');

  if (db) {
    try {
      await setDoc(doc(db, SETTINGS_COLLECTION, 'version'), {
        version: newVersion,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Failed bumping site version in Firestore:', err);
    }

    // Refresh bundled document asynchronously in background
    setTimeout(async () => {
      try {
        const [siteSettings, hotels, offers, districts] = await Promise.all([
          getSiteSettingsFromDb(true),
          getHotelsFromDb(true),
          getOffersFromDb(true),
          getDistrictsFromDb()
        ]);
        const slugMap: Record<string, string> = {};
        hotels.forEach(h => {
          slugMap[h.id] = h.id;
          const slug = getHotelSlug(h);
          if (slug) slugMap[slug] = h.id;
        });
        const freshBundle: SiteBundle = {
          version: newVersion,
          updatedAt: Date.now(),
          siteSettings,
          hotels,
          offers,
          districts,
          slugMap
        };
        const sanitized = JSON.parse(safeStringify(freshBundle));
        await setDoc(doc(db, SETTINGS_COLLECTION, 'site_config'), sanitized, { merge: true });
      } catch (err) {
        console.warn('Failed background site_config update:', err);
      }
    }, 100);
  }

  return newVersion;
}

export async function getSiteBundleFromDb(skipCache = false): Promise<SiteBundle> {
  // 1. Check in-memory cache first (0ms instantaneous)
  const cached = getCached<SiteBundle>('site_bundle', skipCache);
  if (cached) return cached;

  // 1.5. Check LocalStorage persistent cache (0ms instantaneous for all visitors)
  if (!skipCache) {
    try {
      const savedBundle = localStorage.getItem('diy_site_bundle');
      if (savedBundle) {
        const parsed = JSON.parse(savedBundle) as SiteBundle;
        if (parsed && Array.isArray(parsed.hotels) && parsed.hotels.length >= INITIAL_HOTELS.length) {
          parsed.hotels = parsed.hotels.map(normalizeHotel);
          setCache('site_bundle', parsed);
          setCache('site_settings', parsed.siteSettings);
          setCache('hotels', parsed.hotels);
          setCache('offers', parsed.offers || []);
          return parsed;
        }
      }
    } catch {}
  }

  // 2. Direct, parallel fetch from Supabase (300ms)
  try {
    const [siteSettings, hotels, offers, districts] = await Promise.all([
      getSiteSettingsFromDb(skipCache),
      getHotelsFromDb(skipCache),
      getOffersFromDb(skipCache),
      getDistrictsFromDb()
    ]);

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

    setCache('site_bundle', bundle);
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

export async function prefetchHotelDetails(hotelIdOrSlug: string): Promise<Hotel | undefined> {
  if (!hotelIdOrSlug) return undefined;
  const cleanId = hotelIdOrSlug.trim();
  const cacheKey = `hotel_detail_${cleanId}`;
  const cached = getCached<Hotel>(cacheKey);
  if (cached) return cached;

  const warmImage = (h: Hotel) => {
    try {
      if (typeof window !== 'undefined' && h.mainImage) {
        const img = new Image();
        img.src = h.mainImage;
        if (Array.isArray(h.galleryImages) && h.galleryImages[0]) {
          const first = typeof h.galleryImages[0] === 'string' ? h.galleryImages[0] : (h.galleryImages[0] as any)?.url;
          if (first) {
            const g = new Image();
            g.src = first;
          }
        }
      }
    } catch {}
  };

  // Check in-memory hotels cache first (0ms)
  const memHotels = getCached<Hotel[]>('hotels');
  if (memHotels && Array.isArray(memHotels)) {
    const found = memHotels.find(h => h.id === cleanId || h.slug === cleanId || getHotelSlug(h) === cleanId);
    if (found) {
      setCache(cacheKey, found);
      setCache(`hotel_detail_${found.id}`, found);
      warmImage(found);
      return found;
    }
  }

  // Check localStorage diy_hotels next (0ms)
  try {
    const saved = localStorage.getItem('diy_hotels');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const found = parsed.find((h: any) => h.id === cleanId || h.slug === cleanId || getHotelSlug(h) === cleanId);
        if (found) {
          const norm = normalizeHotel(found);
          setCache(cacheKey, norm);
          setCache(`hotel_detail_${norm.id}`, norm);
          warmImage(norm);
          return norm;
        }
      }
    }
  } catch {}

  const hotels = await getHotelsFromDb();
  const found = hotels.find(h => h.id === cleanId || h.slug === cleanId || getHotelSlug(h) === cleanId);
  if (found) {
    setCache(cacheKey, found);
    setCache(`hotel_detail_${found.id}`, found);
    warmImage(found);
    return found;
  }
  return undefined;
}

export async function saveBatchToDb(
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: any;
    options?: { merge?: boolean };
  }>
): Promise<void> {
  if (!db || operations.length === 0) return;
  const batch = writeBatch(db);
  for (const op of operations) {
    const docRef = doc(db, op.collection, op.docId);
    if (op.type === 'set') {
      batch.set(docRef, op.data, op.options || { merge: true });
    } else if (op.type === 'update') {
      batch.update(docRef, op.data);
    } else if (op.type === 'delete') {
      batch.delete(docRef);
    }
  }
  await batch.commit();
}

import {
  DEFAULT_HERO_SLIDES,
  DEFAULT_CHANNELS,
  DEFAULT_BRANCHES,
  DEFAULT_DEPARTMENT_CONTACTS,
  DEFAULT_QUICK_LINKS,
  DEFAULT_ABOUT_US,
  DEFAULT_STORY_TEASER,
  DEFAULT_INTEGRATED_SERVICES,
  DEFAULT_HOME_SECTIONS,
  DEFAULT_SITE_SETTINGS
} from '../data/defaultSettings';
export {
  DEFAULT_HERO_SLIDES,
  DEFAULT_CHANNELS,
  DEFAULT_BRANCHES,
  DEFAULT_DEPARTMENT_CONTACTS,
  DEFAULT_QUICK_LINKS,
  DEFAULT_ABOUT_US,
  DEFAULT_STORY_TEASER,
  DEFAULT_INTEGRATED_SERVICES,
  DEFAULT_HOME_SECTIONS,
  DEFAULT_SITE_SETTINGS
};

export async function getSiteSettingsFromDb(skipCache = false): Promise<SiteSettings> {
  // Check in-memory cache first (skipped when triggered by realtime events)
  const cached = getCached<SiteSettings>('site_settings', skipCache);
  if (cached) return cached;

  // 1. Try Supabase first (authoritative primary database — always trust it over local cache)
  try {
    const supabaseSettings = await fetchSiteSettingsFromSupabase();
    if (supabaseSettings && typeof supabaseSettings === 'object') {
      const normalized: SiteSettings = {
        ...DEFAULT_SITE_SETTINGS,
        ...supabaseSettings,
        channels: Array.isArray(supabaseSettings.channels) && supabaseSettings.channels.length > 0 
          ? [...supabaseSettings.channels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          : (INITIAL_SITE_SETTINGS?.channels || DEFAULT_CHANNELS),
        heroSlides: Array.isArray(supabaseSettings.heroSlides) && supabaseSettings.heroSlides.length > 0
          ? supabaseSettings.heroSlides.map((s, idx) => {
              const hasValidVideoUrl = Boolean(s.videoUrl?.trim()) && !s.videoUrl.startsWith('blob:');
              const isVid = s.mediaType === 'video' && hasValidVideoUrl;
              return {
                ...s,
                mediaType: isVid ? ('video' as const) : ('image' as const),
                videoUrl: hasValidVideoUrl ? s.videoUrl : '',
                imageUrl: s.imageUrl || '',
                order: typeof s.order === 'number' ? s.order : idx,
                isActive: s.isActive !== false,
                showBadge: s.showBadge !== false,
                showTitle: s.showTitle !== false,
                showSubtitle: s.showSubtitle !== false,
                showPrimaryButton: s.showPrimaryButton !== false,
                showSecondaryButton: s.showSecondaryButton !== false
              };
            }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          : (INITIAL_SITE_SETTINGS?.heroSlides || DEFAULT_HERO_SLIDES),
        branches: Array.isArray(supabaseSettings.branches) && supabaseSettings.branches.length > 0
          ? supabaseSettings.branches.map((b, idx) => ({
              ...b,
              isMainBranch: Boolean(b.isMainBranch),
              showContactInfo: typeof b.showContactInfo === 'boolean' 
                ? b.showContactInfo 
                : Boolean(b.isMainBranch),
              isActive: b.isActive !== false,
              order: typeof b.order === 'number' ? b.order : idx + 1,
              contacts: Array.isArray(b.contacts) ? b.contacts.map((c, cIdx) => ({
                ...c,
                order: typeof c.order === 'number' ? c.order : cIdx + 1,
                isActive: c.isActive !== false,
                showInAbout: c.showInAbout !== false,
                showInContact: c.showInContact !== false,
                showInFooter: c.showInFooter !== false,
                showInHotelDetail: c.showInHotelDetail !== false,
                showInFloating: Boolean(c.showInFloating)
              })) : []
            })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          : (INITIAL_SITE_SETTINGS?.branches || DEFAULT_BRANCHES),
        departmentContacts: Array.isArray(supabaseSettings.departmentContacts) && supabaseSettings.departmentContacts.length > 0
          ? supabaseSettings.departmentContacts.map((c, idx) => ({
              ...c,
              isActive: c.isActive !== false,
              order: typeof c.order === 'number' ? c.order : idx + 1
            })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          : (INITIAL_SITE_SETTINGS?.departmentContacts || DEFAULT_DEPARTMENT_CONTACTS),
        quickLinks: Array.isArray(supabaseSettings.quickLinks) && supabaseSettings.quickLinks.length > 0
          ? [...supabaseSettings.quickLinks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          : (INITIAL_SITE_SETTINGS?.quickLinks || DEFAULT_QUICK_LINKS),
        aboutUs: supabaseSettings.aboutUs || INITIAL_SITE_SETTINGS?.aboutUs || DEFAULT_ABOUT_US,
        contactsDirectory: Array.isArray(supabaseSettings.contactsDirectory) && supabaseSettings.contactsDirectory.length > 0
          ? [...supabaseSettings.contactsDirectory].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          : (INITIAL_SITE_SETTINGS?.contactsDirectory || DEFAULT_CONTACTS_DIRECTORY),
        actionButtons: Array.isArray(supabaseSettings.actionButtons) && supabaseSettings.actionButtons.length > 0
          ? [...supabaseSettings.actionButtons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          : (INITIAL_SITE_SETTINGS?.actionButtons || DEFAULT_ACTION_BUTTONS),
      };
      // Write Supabase authoritative data to localStorage (overrides any stale cache)
      safeSetLocalStorage('diy_site_settings', normalized);
      setCache('site_settings', normalized);
      return normalized;
    }
  } catch (err) {
    console.warn('Failed to load site settings from Supabase:', err);
  }

  // 2. Fallback to localStorage cache
  const local = localStorage.getItem('diy_site_settings');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_SITE_SETTINGS, ...parsed };
      }
    } catch {}
  }

  return DEFAULT_SITE_SETTINGS;
}

export async function saveSiteSettingsToDb(settings: SiteSettings): Promise<void> {
  invalidateCache('site_settings');
  const toSave: SiteSettings = {
    ...settings,
    updatedAt: Date.now()
  };

  const sanitized: SiteSettings = JSON.parse(safeStringify(toSave));
  
  // Safe set local storage for instant optimistic UI
  safeSetLocalStorage('diy_site_settings', sanitized);

  // Sync directly to Supabase (authoritative primary database)
  try {
    await upsertSiteSettingsToSupabase(sanitized);
  } catch (err) {
    console.warn('Supabase site settings sync error:', err);
  }

  // Background non-blocking sync to Firestore if configured
  if (db) {
    try {
      const firestorePayload = JSON.parse(
        safeStringify(sanitized, (key, value) => {
          if (typeof value === 'string' && (value.startsWith('data:video/') || value.startsWith('blob:')) && value.length > 500000) {
            return '';
          }
          return value;
        })
      );
      const docRef = doc(db, SETTINGS_COLLECTION, 'general');
      setDoc(docRef, firestorePayload, { merge: true }).catch(() => {});
    } catch (err) {
      console.warn('Could not sync site settings to Firestore:', err);
    }
  }

  // Bump site version so all visitor browsers refresh instantly
  bumpSiteVersion().catch(() => {});
}

// ==========================================
// Hotels CRUD (Zero Initial Data -> Manual Admin Entry / Supabase)
// ==========================================
export async function getHotelsFromDb(skipCache = false): Promise<Hotel[]> {
  // Check in-memory cache first (skipped when triggered by realtime events)
  const cached = getCached<Hotel[]>('hotels', skipCache);
  if (cached) return cached;

  const HOTELS_VERSION_KEY = 'prestige_zero_hotels_v1';

  // 1. Try Supabase first (authoritative cloud database)
  const supabaseHotels = await fetchHotelsFromSupabase();
  if (supabaseHotels !== null) {
    if (supabaseHotels.length > 0) {
      safeSetLocalStorage('diy_hotels', supabaseHotels);
      const result = supabaseHotels.map(normalizeHotel);
      setCache('hotels', result);
      return result;
    }

    // If Supabase returned empty array (0 hotels), check if we have local hotels or INITIAL_HOTELS to restore and sync up
    const savedHotels = localStorage.getItem('diy_hotels');
    if (savedHotels) {
      try {
        const parsed = JSON.parse(savedHotels);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeHotel);
        }
      } catch {}
    }
    safeSetLocalStorage('diy_hotels', INITIAL_HOTELS);
    return INITIAL_HOTELS.map(normalizeHotel);
  }

  // 2. Fallback to local storage or INITIAL_HOTELS
  const saved = localStorage.getItem('diy_hotels');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= INITIAL_HOTELS.length) {
        return parsed.map(normalizeHotel);
      }
    } catch {}
  }
  safeSetLocalStorage('diy_hotels', INITIAL_HOTELS);
  return INITIAL_HOTELS.map(normalizeHotel);
}

export async function saveHotelToDb(hotel: Hotel): Promise<void> {
  invalidateCache('hotels');
  const saved = localStorage.getItem('diy_hotels');
  let localList: Hotel[] = [];
  try {
    if (saved) localList = JSON.parse(saved);
  } catch {}

  const existingIdx = localList.findIndex(h => h.id === hotel.id);
  let updatedList: Hotel[];
  if (existingIdx >= 0) {
    updatedList = [...localList];
    updatedList[existingIdx] = hotel;
  } else {
    updatedList = [hotel, ...localList];
  }
  safeSetLocalStorage('diy_hotels', updatedList);

  // Direct sync to Supabase (primary cloud database)
  await upsertHotelToSupabase(hotel);

  // Background non-blocking sync to Firestore
  if (db) {
    try {
      const hotelRef = doc(db, HOTELS_COLLECTION, hotel.id);
      const sanitized = JSON.parse(safeStringify({
        ...hotel,
        updatedAt: Date.now()
      }));
      setDoc(hotelRef, sanitized, { merge: true }).catch(() => {});
    } catch {}
  }

  bumpSiteVersion().catch(() => {});
}

export async function deleteHotelFromDb(hotelId: string): Promise<void> {
  invalidateCache('hotels');
  const saved = localStorage.getItem('diy_hotels');
  let localList: Hotel[] = [];
  try {
    if (saved) localList = JSON.parse(saved);
  } catch {}

  const filtered = localList.filter(h => h.id !== hotelId);
  safeSetLocalStorage('diy_hotels', filtered);

  await deleteHotelFromSupabase(hotelId);

  if (db) {
    try {
      deleteDoc(doc(db, HOTELS_COLLECTION, hotelId)).catch(() => {});
    } catch {}
  }

  bumpSiteVersion().catch(() => {});
}

// ==========================================
// Offers CRUD (Supabase + Local)
// ==========================================
export async function getOffersFromDb(skipCache = false): Promise<Offer[]> {
  // Check in-memory cache first (skipped when triggered by realtime events)
  const cached = getCached<Offer[]>('offers', skipCache);
  if (cached) return cached;

  const supabaseOffers = await fetchOffersFromSupabase();
  if (supabaseOffers) {
    safeSetLocalStorage('diy_offers', supabaseOffers);
    setCache('offers', supabaseOffers);
    return supabaseOffers;
  }

  const saved = localStorage.getItem('diy_offers');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }

  return INITIAL_OFFERS;
}

export async function saveOfferToDb(offer: Offer): Promise<void> {
  invalidateCache('offers');
  const saved = localStorage.getItem('diy_offers');
  let localList: Offer[] = [];
  try {
    if (saved) localList = JSON.parse(saved);
  } catch {}

  const existingIdx = localList.findIndex(o => o.id === offer.id);
  let updatedList: Offer[];
  if (existingIdx >= 0) {
    updatedList = [...localList];
    updatedList[existingIdx] = offer;
  } else {
    updatedList = [offer, ...localList];
  }
  safeSetLocalStorage('diy_offers', updatedList);

  await upsertOfferToSupabase(offer);

  if (db) {
    try {
      const offerRef = doc(db, OFFERS_COLLECTION, offer.id);
      const sanitized = JSON.parse(safeStringify({
        ...offer,
        updatedAt: Date.now()
      }));
      setDoc(offerRef, sanitized, { merge: true }).catch(() => {});
    } catch {}
  }

  bumpSiteVersion().catch(() => {});
}

export async function deleteOfferFromDb(offerId: string): Promise<void> {
  invalidateCache('offers');
  const saved = localStorage.getItem('diy_offers');
  let localList: Offer[] = [];
  try {
    if (saved) localList = JSON.parse(saved);
  } catch {}

  const filtered = localList.filter(o => o.id !== offerId);
  safeSetLocalStorage('diy_offers', filtered);

  await deleteOfferFromSupabase(offerId);

  if (db) {
    try {
      deleteDoc(doc(db, OFFERS_COLLECTION, offerId)).catch(() => {});
    } catch {}
  }

  bumpSiteVersion().catch(() => {});
}

// ==========================================
// Reviews CRUD & Moderation (Supabase + Local)
// ==========================================
export async function submitHotelReview(review: Omit<HotelReview, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const newId = 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const fullReview: HotelReview = {
    ...review,
    id: newId,
    status: 'pending',
    createdAt: Date.now()
  };

  const stored = getStoredReviews();
  safeSetLocalStorage('diy_reviews', [fullReview, ...stored]);

  await upsertReviewToSupabase(fullReview);

  if (db) {
    try {
      setDoc(doc(db, REVIEWS_COLLECTION, newId), fullReview).catch(() => {});
    } catch {}
  }
  return newId;
}

export function getStoredReviews(): HotelReview[] {
  try {
    const saved = localStorage.getItem('diy_reviews');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export async function getReviewsFromDb(): Promise<HotelReview[]> {
  const supabaseReviews = await fetchReviewsFromSupabase();
  if (supabaseReviews) {
    safeSetLocalStorage('diy_reviews', supabaseReviews);
    return supabaseReviews;
  }

  if (!db) {
    return getStoredReviews();
  }
  try {
    const q = query(collection(db, REVIEWS_COLLECTION));
    const snapshot = await getDocs(q);
    const reviews: HotelReview[] = [];
    snapshot.forEach((docSnap) => {
      reviews.push({ id: docSnap.id, ...docSnap.data() } as HotelReview);
    });
    const local = getStoredReviews();
    const map = new Map<string, HotelReview>();
    [...reviews, ...local].forEach(r => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.warn('Failed to load reviews from Firestore:', err);
    return getStoredReviews();
  }
}

export async function getApprovedReviewsFromDb(limitCount = 6, hotelId?: string): Promise<HotelReview[]> {
  const cacheKey = `approved_reviews_${hotelId || 'all'}_${limitCount}`;
  const cached = getCached<HotelReview[]>(cacheKey);
  if (cached) return cached;

  if (db) {
    try {
      const constraints: any[] = [
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      ];
      if (hotelId) {
        constraints.unshift(where('hotelId', '==', hotelId));
      }
      const q = query(collection(db, REVIEWS_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list: HotelReview[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as HotelReview);
        });
        setCache(cacheKey, list);
        return list;
      }
    } catch (err) {
      console.warn('[Firestore] Failed querying approved reviews with index, falling back to local:', err);
    }
  }

  // Fallback to local / cached reviews
  const all = await getReviewsFromDb();
  const filtered = all
    .filter(r => r.status === 'approved' && (!hotelId || r.hotelId === hotelId))
    .slice(0, limitCount);
  setCache(cacheKey, filtered);
  return filtered;
}

export async function approveReview(reviewId: string): Promise<void> {
  const reviews = await getReviewsFromDb();
  const review = reviews.find(r => r.id === reviewId);
  if (!review) return;

  review.status = 'approved';
  safeSetLocalStorage('diy_reviews', reviews);

  await upsertReviewToSupabase(review);

  if (db) {
    try {
      await setDoc(doc(db, REVIEWS_COLLECTION, reviewId), { status: 'approved' }, { merge: true });
    } catch (err) {
      console.error('Error approving review in Firestore:', err);
    }
  }

  // Also append to the hotel's reviewsList in the database
  try {
    const hotels = await getHotelsFromDb();
    const hotel = hotels.find(h => h.id === review.hotelId);
    if (hotel) {
      const reviewsList = hotel.reviewsList || [];
      const newReviewEntry = {
        id: review.id,
        author: review.authorName,
        avatarUrl: review.avatarUrl || undefined,
        country: review.countryOrTitle || 'زائر موثق',
        rating: review.rating,
        date: review.stayDate || 'مؤخراً',
        comment: review.comment
      };
      
      const exists = reviewsList.some(r => r.id === review.id);
      if (!exists) {
        reviewsList.unshift(newReviewEntry);
        const totalRating = reviewsList.reduce((acc, r) => acc + r.rating, 0);
        const avgRating = Number((totalRating / reviewsList.length).toFixed(1));
        
        hotel.reviewsList = reviewsList;
        hotel.rating = avgRating;
        hotel.reviewCount = reviewsList.length;
        
        await saveHotelToDb(hotel);
      }
    }
  } catch (e) {
    console.warn('Failed to link approved review to hotel:', e);
  }
}

export async function deleteReviewFromDb(reviewId: string): Promise<void> {
  const reviews = await getReviewsFromDb();
  const filtered = reviews.filter(r => r.id !== reviewId);
  safeSetLocalStorage('diy_reviews', filtered);

  await deleteReviewFromSupabase(reviewId);

  if (db) {
    try {
      await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
    } catch (err) {
      console.error('Error deleting review from Firestore:', err);
    }
  }

  bumpSiteVersion().catch(() => {});
}

// ==========================================
// Contact messages (Supabase + Local)
// ==========================================
export async function sendContactMessage(msg: Omit<ContactMessage, 'id' | 'createdAt'>): Promise<string> {
  const newId = 'msg_' + Date.now();
  const fullMsg: ContactMessage = {
    ...msg,
    id: newId,
    createdAt: Date.now(),
    read: false
  };

  const localMsgs = getStoredContactMessages();
  safeSetLocalStorage('diy_messages', [fullMsg, ...localMsgs]);

  await insertMessageToSupabase(fullMsg);

  if (db) {
    try {
      await setDoc(doc(db, MESSAGES_COLLECTION, newId), fullMsg);
    } catch (err) {
      console.error('Error sending message to Firestore:', err);
    }
  }
  return newId;
}

export function getStoredContactMessages(): ContactMessage[] {
  try {
    const saved = localStorage.getItem('diy_messages');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export async function getContactMessagesFromDb(): Promise<ContactMessage[]> {
  // تصفية الرسائل بحيث تقتصر فقط على طلبات الخدمة واستفسارات الزوار من "تواصل معنا" دون خلطها بالحجوزات أونلاين
  const isContactInquiryOnly = (m: ContactMessage) => {
    const s = (m.subject || '').toLowerCase();
    const b = (m.message || '').toLowerCase();
    return !s.includes('حجز أونلاين') && !b.includes('رقم طلب الحجز: #pr-');
  };

  const supabaseMsgs = await fetchMessagesFromSupabase();
  if (supabaseMsgs) {
    const filtered = supabaseMsgs.filter(isContactInquiryOnly);
    safeSetLocalStorage('diy_messages', filtered);
    return filtered;
  }

  if (!db) {
    return getStoredContactMessages().filter(isContactInquiryOnly);
  }
  try {
    const q = query(collection(db, MESSAGES_COLLECTION));
    const snapshot = await getDocs(q);
    const messages: ContactMessage[] = [];
    snapshot.forEach((docSnap) => {
      messages.push({ id: docSnap.id, ...docSnap.data() } as ContactMessage);
    });
    const local = getStoredContactMessages();
    const map = new Map<string, ContactMessage>();
    [...messages, ...local].forEach(m => map.set(m.id, m));
    return Array.from(map.values())
      .filter(isContactInquiryOnly)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.warn('Failed to load messages from Firestore:', err);
    return getStoredContactMessages().filter(isContactInquiryOnly);
  }
}

export async function markMessageAsReadInDb(messageId: string, readStatus: boolean = true): Promise<void> {
  const messages = await getContactMessagesFromDb();
  const msg = messages.find(m => m.id === messageId);
  if (msg) {
    msg.read = readStatus;
    safeSetLocalStorage('diy_messages', messages);
  }

  await updateMessageReadStatusInSupabase(messageId, readStatus);

  if (db) {
    try {
      await setDoc(doc(db, MESSAGES_COLLECTION, messageId), { read: readStatus }, { merge: true });
    } catch (err) {
      console.error('Error updating message status in Firestore:', err);
    }
  }
}

export async function deleteMessageFromDb(messageId: string): Promise<void> {
  const messages = await getContactMessagesFromDb();
  const filtered = messages.filter(m => m.id !== messageId);
  safeSetLocalStorage('diy_messages', filtered);

  await deleteMessageFromSupabase(messageId);

  if (db) {
    try {
      await deleteDoc(doc(db, MESSAGES_COLLECTION, messageId));
    } catch (err) {
      console.error('Error deleting message from Firestore:', err);
    }
  }
}

// ==========================================
// In-Place Live Content Editing CRUD (Bilingual Key+Lang Records)
// ==========================================
export function subscribeToLiveContent(callback: (contentMap: Record<string, ContentItem>) => void): () => void {
  let isSubscribed = true;

  // 1. Instant cache hydration from localStorage
  try {
    const cached = localStorage.getItem('diy_live_content');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (isSubscribed) callback(parsed);
    }
  } catch (e) {
    console.warn('Failed reading cached live content:', e);
  }

  // 2. Fetch authoritative live content from Supabase immediately on mount (so every new browser sees all edits!)
  fetchLiveContentFromSupabase().then((supabaseMap) => {
    if (!isSubscribed) return;
    if (supabaseMap && Object.keys(supabaseMap).length > 0) {
      try {
        const cached = localStorage.getItem('diy_live_content');
        const existing = cached ? JSON.parse(cached) : {};
        const merged = { ...existing, ...supabaseMap };
        safeSetLocalStorage('diy_live_content', merged);
        if (isSubscribed) callback(merged);
      } catch {
        if (isSubscribed) callback(supabaseMap);
      }
    }
  }).catch((err) => {
    console.warn('Initial Supabase live content fetch error:', err);
  });

  // 3. Set up Firestore snapshot listener as well (dual real-time coverage)
  if (!db) {
    return () => {
      isSubscribed = false;
    };
  }

  try {
    const collRef = collection(db, CONTENT_COLLECTION);
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      if (!isSubscribed) return;
      const map: Record<string, ContentItem> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data) {
          const docId = docSnap.id;
          // Check if docId has language suffix
          if (docId.includes(':ar') || docId.includes(':en')) {
            const parts = docId.split(':');
            const baseKey = parts.slice(0, -1).join(':');
            const lang = parts[parts.length - 1] as 'ar' | 'en';
            if (!map[baseKey]) map[baseKey] = { key: baseKey };
            map[baseKey][lang] = data.text || '';
            if (lang === 'ar') map[baseKey].text = data.text || '';
            return;
          }

          map[docId] = {
            key: docId,
            text: data.text || data.ar || '',
            ar: data.ar || (data.text || ''),
            en: data.en || '',
            color: data.color || undefined,
            fontSize: data.fontSize || undefined,
            fontWeight: data.fontWeight || undefined,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy
          };
        }
      });

      if (Object.keys(map).length > 0 && isSubscribed) {
        try {
          const cached = localStorage.getItem('diy_live_content');
          const existing = cached ? JSON.parse(cached) : {};
          const merged = { ...existing, ...map };
          safeSetLocalStorage('diy_live_content', merged);
          if (isSubscribed) callback(merged);
        } catch {
          if (isSubscribed) callback(map);
        }
      }
    }, (error) => {
      console.warn('Firestore live content listener error:', error);
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  } catch (err) {
    console.error('Error setting up onSnapshot for live content:', err);
    return () => {
      isSubscribed = false;
    };
  }
}

export async function saveContentToDb(
  key: string, 
  content: string | Partial<ContentItem>, 
  language: 'ar' | 'en' = 'ar',
  updatedBy?: string
): Promise<void> {
  // 1. Get existing record from local cache
  let existingItem: ContentItem = { key };
  try {
    const cached = localStorage.getItem('diy_live_content');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed[key]) existingItem = parsed[key];
    }
  } catch {}

  const newText = typeof content === 'string' ? content : (content.text ?? (content[language] || ''));
  const newAr = language === 'ar' 
    ? newText 
    : (typeof content === 'object' && content.ar !== undefined ? content.ar : (existingItem.ar || existingItem.text || ''));
  const newEn = language === 'en' 
    ? newText 
    : (typeof content === 'object' && content.en !== undefined ? content.en : (existingItem.en || ''));

  const payload: ContentItem = {
    ...existingItem,
    ...(typeof content === 'object' ? content : {}),
    key,
    ar: newAr,
    en: newEn,
    text: language === 'ar' ? newText : (existingItem.ar || newText),
    updatedAt: Date.now(),
    ...(updatedBy ? { updatedBy } : {})
  };

  const sanitized: ContentItem = JSON.parse(safeStringify(payload));

  // 2. Optimistic local cache update
  try {
    const cached = localStorage.getItem('diy_live_content');
    const existingMap = cached ? JSON.parse(cached) : {};
    existingMap[key] = sanitized;
    safeSetLocalStorage('diy_live_content', existingMap);
  } catch (e) {
    console.warn('Failed to cache live content locally:', e);
  }

  // 3. Save to Supabase (Authoritative primary database)
  try {
    await upsertLiveContentToSupabase(key, sanitized);
  } catch (err) {
    console.warn('Could not sync content to Supabase:', err);
  }

  // 4. Save to Firestore (Dual sync)
  if (db) {
    try {
      const docRef = doc(db, CONTENT_COLLECTION, key);
      await setDoc(docRef, sanitized, { merge: true });
      bumpSiteVersion('content').catch(() => {});
    } catch (err) {
      console.warn('Could not sync content to Firestore:', err);
    }
  }
}

export async function migrateInitialTextsToDatabase(dictionary: Record<string, { ar: string; en: string }>): Promise<void> {
  const MIGRATION_FLAG = 'prestige_texts_migrated_v2';
  try {
    if (localStorage.getItem(MIGRATION_FLAG) === 'true') {
      return;
    }
  } catch {}

  try {
    const existingFromDb = await fetchLiveContentFromSupabase();
    const itemsToUpsert: ContentItem[] = [];

    for (const [key, trans] of Object.entries(dictionary)) {
      if (!existingFromDb[key] || (!existingFromDb[key].ar && !existingFromDb[key].en)) {
        itemsToUpsert.push({
          key,
          ar: trans.ar,
          en: trans.en,
          text: trans.ar,
          updatedAt: Date.now(),
          updatedBy: 'initial_migration'
        });
      }
    }

    if (itemsToUpsert.length > 0) {
      await bulkUpsertLiveContentToSupabase(itemsToUpsert);
      if (db) {
        for (const it of itemsToUpsert.slice(0, 40)) {
          try {
            await setDoc(doc(db, CONTENT_COLLECTION, it.key), it, { merge: true });
          } catch {}
        }
      }
    }

    try {
      localStorage.setItem(MIGRATION_FLAG, 'true');
    } catch {}
  } catch (err) {
    console.warn('Initial texts migration error:', err);
  }
}

// ==========================================
// Districts & Areas CRUD (Supabase + Local)
// ==========================================
export const DEFAULT_DISTRICTS: District[] = [
  { id: 'dist_ajyad', name: 'أجياد', city: 'مكة المكرمة', description: 'منطقة حيوية مقابلة لأبراج البيت وباب الملك عبدالعزيز', distanceRange: '١٠٠ - ٣٥٠ م', order: 1, createdAt: Date.now() },
  { id: 'dist_mesfalah', name: 'المسفلة', city: 'مكة المكرمة', description: 'شارع إبراهيم الخليل والخدمات المركزية وباب الملك فهد', distanceRange: '٥٠٠ - ٨٥٠ م', order: 2, createdAt: Date.now() },
  { id: 'dist_mahbas', name: 'محبس الجن', city: 'مكة المكرمة', description: 'منطقة كبرى مع حافلات نقل ترددي مستمرة 24 ساعة للحرم', distanceRange: 'حافلات ترددية (دقائق)', order: 3, createdAt: Date.now() },
  { id: 'dist_aziziyah', name: 'العزيزية', city: 'مكة المكرمة', description: 'أرقى الفنادق والمقرات الواسعة للحملات والمجموعات', distanceRange: 'توصيل مجاني مستمر', order: 4, createdAt: Date.now() },
  { id: 'dist_aziziyah_north', name: 'العزيزية الشمالية', city: 'مكة المكرمة', description: 'طريق المسجد الحرام وقرب محطات النقل السريع', distanceRange: 'حافلات ترددية 24/7', order: 5, createdAt: Date.now() },
  { id: 'dist_ghazzah', name: 'المركزية / الغزة', city: 'مكة المكرمة', description: 'مقابل التوسعة الشمالية وساحات الحرم', distanceRange: '٢٠٠ - ٤٠٠ م', order: 6, createdAt: Date.now() },
  { id: 'dist_shubaika', name: 'الشبيكة / الغزة', city: 'مكة المكرمة', description: 'المنطقة المركزية الغربية وقرب بوابات الحرم', distanceRange: '٣٠٠ - ٥٠٠ م', order: 7, createdAt: Date.now() },
  { id: 'dist_kudai', name: 'كدي / أجياد', city: 'مكة المكرمة', description: 'قرب مواقف كدي وشارع أجياد السريع', distanceRange: '٧٠٠ - ٩٠٠ م', order: 8, createdAt: Date.now() },
  { id: 'dist_central_north_madinah', name: 'المنطقة المركزية الشمالية', city: 'المدينة المنورة', description: 'مقابل ساحات المسجد النبوي الشريف ومصلى النساء', distanceRange: '١٠٠ - ٢٥٠ م', order: 9, createdAt: Date.now() },
  { id: 'dist_central_west_madinah', name: 'المنطقة المركزية الغربية', city: 'المدينة المنورة', description: 'قرب باب السلام والساحات الغربية للمسجد النبوي', distanceRange: '١٥٠ - ٣٠٠ م', order: 10, createdAt: Date.now() },
  { id: 'dist_central_south_madinah', name: 'المنطقة المركزية الجنوبية', city: 'المدينة المنورة', description: 'قرب ساحة قباء وباب قباء', distanceRange: '٢٠٠ - ٤٠٠ م', order: 11, createdAt: Date.now() },
];

export async function getDistrictsFromDb(): Promise<District[]> {
  const supabaseDistricts = await fetchDistrictsFromSupabase();
  if (supabaseDistricts && supabaseDistricts.length > 0) {
    safeSetLocalStorage('diy_districts', supabaseDistricts);
    return supabaseDistricts.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const local = localStorage.getItem('diy_districts');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    } catch {}
  }

  safeSetLocalStorage('diy_districts', DEFAULT_DISTRICTS);
  return DEFAULT_DISTRICTS;
}

export async function saveDistrictToDb(district: District): Promise<void> {
  const list = await getDistrictsFromDb();
  const existingIdx = list.findIndex(d => d.id === district.id);
  let updatedList: District[];
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = district;
  } else {
    updatedList = [...list, district];
  }
  safeSetLocalStorage('diy_districts', updatedList);

  await upsertDistrictToSupabase(district);

  if (db) {
    try {
      const docRef = doc(db, DISTRICTS_COLLECTION, district.id);
      const sanitized = JSON.parse(safeStringify(district));
      await setDoc(docRef, sanitized, { merge: true });
    } catch (err) {
      console.warn('Could not sync district to Firestore (saved locally):', err);
    }
  }
}

export async function deleteDistrictFromDb(districtId: string): Promise<void> {
  const list = await getDistrictsFromDb();
  const filtered = list.filter(d => d.id !== districtId);
  safeSetLocalStorage('diy_districts', filtered);

  await deleteDistrictFromSupabase(districtId);

  if (db) {
    try {
      await deleteDoc(doc(db, DISTRICTS_COLLECTION, districtId));
    } catch (err) {
      console.error('Error deleting district from Firestore:', err);
    }
  }
}

// Rename district and cascade changes to hotels
export async function syncDistrictRenameToHotels(oldName: string, newName: string): Promise<number> {
  if (!oldName || !newName || oldName === newName) return 0;
  const hotels = await getHotelsFromDb();
  let updatedCount = 0;

  for (const h of hotels) {
    if (h.district === oldName) {
      h.district = newName;
      await saveHotelToDb(h);
      updatedCount++;
    }
  }
  return updatedCount;
}

// ==========================================
// Admin Roles CRUD (RBAC System)
// ==========================================
export async function getAdminRolesFromDb(): Promise<AdminRole[]> {
  // 1. Try Supabase first
  const supabaseRoles = await fetchAdminRolesFromSupabase();
  if (supabaseRoles && supabaseRoles.length > 0) {
    safeSetLocalStorage('diy_admin_roles', supabaseRoles);
    return supabaseRoles;
  }

  // 2. Try localStorage
  const local = localStorage.getItem('diy_admin_roles');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure Super Admin role is always included and protected
        const hasSuper = parsed.some((r: AdminRole) => r.id === SUPER_ADMIN_ROLE_ID || r.isSystem);
        if (!hasSuper) {
          const merged = [DEFAULT_ADMIN_ROLES[0], ...parsed];
          safeSetLocalStorage('diy_admin_roles', merged);
          return merged;
        }
        return parsed;
      }
    } catch {}
  }

  // 3. Try Firestore
  if (db) {
    try {
      const q = query(collection(db, ROLES_COLLECTION));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list: AdminRole[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as AdminRole);
        });
        if (list.length > 0) {
          safeSetLocalStorage('diy_admin_roles', list);
          return list;
        }
      }
    } catch (err) {
      console.warn('Could not fetch roles from Firestore:', err);
    }
  }

  // 4. Default Seed Roles
  safeSetLocalStorage('diy_admin_roles', DEFAULT_ADMIN_ROLES);
  return DEFAULT_ADMIN_ROLES;
}

export async function saveAdminRoleToDb(role: AdminRole): Promise<void> {
  // Super Admin cannot be edited into non-system role or have permissions stripped
  if (role.id === SUPER_ADMIN_ROLE_ID && !role.isSystem) {
    role.isSystem = true;
  }

  const list = await getAdminRolesFromDb();
  const existingIdx = list.findIndex(r => r.id === role.id);
  let updatedList: AdminRole[];
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = { ...role, updatedAt: Date.now() };
  } else {
    updatedList = [role, ...list];
  }
  safeSetLocalStorage('diy_admin_roles', updatedList);

  try {
    await Promise.race([
      upsertAdminRoleToSupabase(role),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 4000))
    ]);
  } catch (err) {
    console.warn('Supabase role sync timeout or error (saved locally):', err);
  }

  if (db) {
    try {
      const docRef = doc(db, ROLES_COLLECTION, role.id);
      const sanitized = JSON.parse(safeStringify(role));
      setDoc(docRef, sanitized, { merge: true }).catch((err) => {
        console.warn('Could not sync role to Firestore:', err);
      });
    } catch (err) {
      console.warn('Could not sync role to Firestore:', err);
    }
  }
}

export async function deleteAdminRoleFromDb(roleId: string): Promise<void> {
  if (roleId === SUPER_ADMIN_ROLE_ID) {
    throw new Error('لا يمكن حذف دور المدير العام (Super Admin) الثابت');
  }

  const list = await getAdminRolesFromDb();
  const target = list.find(r => r.id === roleId);
  if (target?.isSystem) {
    throw new Error('لا يمكن حذف الأدوار النظامية الأساسية');
  }

  const filtered = list.filter(r => r.id !== roleId);
  safeSetLocalStorage('diy_admin_roles', filtered);

  try {
    await Promise.race([
      deleteAdminRoleFromSupabase(roleId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 4000))
    ]);
  } catch (err) {
    console.warn('Supabase role delete timeout or error:', err);
  }

  if (db) {
    try {
      deleteDoc(doc(db, ROLES_COLLECTION, roleId)).catch(() => {});
    } catch (err) {
      console.warn('Could not delete role from Firestore:', err);
    }
  }
}

// ==========================================
// Admin Users & Controllers Management (RBAC)
// ==========================================
export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr_super_admin_hesham',
    name: 'المدير العام (أحمد هشام)',
    username: 'A.hesham',
    email: 'a.hesham@prestigehotels.sa',
    role: 'admin',
    roleIds: [SUPER_ADMIN_ROLE_ID],
    password: '199991',
    status: 'active',
    notes: 'حساب المدير العام الرئيسي الثابت ولا يمكن تعديله أو حذفه لمنع قفل النظام',
    createdAt: 1704067200000,
  },
  {
    id: 'usr_bookings_staff_1',
    name: 'موظف الحجوزات (تجريبي)',
    username: 'staff.booking',
    email: 'booking@prestigehotels.sa',
    role: 'controller',
    roleIds: [BOOKINGS_STAFF_ROLE_ID],
    password: 'staff1234',
    status: 'active',
    notes: 'حساب موظف حجوزات تجريبي (صلاحية سجل الحجوزات والفواتير فقط)',
    createdAt: 1704067200000,
  },
  {
    id: 'usr_availability_mgr_1',
    name: 'مدير الأسعار والتوفر (تجريبي)',
    username: 'pricing.mgr',
    email: 'pricing@prestigehotels.sa',
    role: 'controller',
    roleIds: [AVAILABILITY_MANAGER_ROLE_ID],
    password: 'pricing1234',
    status: 'active',
    notes: 'حساب مدير توفر وأسعار تجريبي (صلاحية التوفر والأسعار والغرف فقط)',
    createdAt: 1704067200000,
  }
];

export async function getAdminUsersFromDb(): Promise<AdminUser[]> {
  const supabaseUsers = await fetchAdminUsersFromSupabase();
  if (supabaseUsers && supabaseUsers.length > 0) {
    safeSetLocalStorage('diy_admin_users', supabaseUsers);
    return supabaseUsers;
  }

  const local = localStorage.getItem('diy_admin_users');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure roleIds array exists on all user records
        const normalized = parsed.map((u: AdminUser) => ({
          ...u,
          roleIds: Array.isArray(u.roleIds) && u.roleIds.length > 0 
            ? u.roleIds 
            : (u.role === 'admin' || u.username?.toLowerCase() === 'a.hesham' ? [SUPER_ADMIN_ROLE_ID] : [BOOKINGS_STAFF_ROLE_ID])
        }));
        return normalized;
      }
    } catch {}
  }

  if (!db) {
    safeSetLocalStorage('diy_admin_users', DEFAULT_ADMIN_USERS);
    return DEFAULT_ADMIN_USERS;
  }

  try {
    const q = query(collection(db, USERS_COLLECTION));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      safeSetLocalStorage('diy_admin_users', DEFAULT_ADMIN_USERS);
      return DEFAULT_ADMIN_USERS;
    }
    const list: AdminUser[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const roleIds = Array.isArray(data.roleIds) && data.roleIds.length > 0
        ? data.roleIds
        : (data.role === 'admin' ? [SUPER_ADMIN_ROLE_ID] : [BOOKINGS_STAFF_ROLE_ID]);
      list.push({ id: docSnap.id, ...data, roleIds } as AdminUser);
    });
    safeSetLocalStorage('diy_admin_users', list);
    return list;
  } catch (err) {
    console.warn('Failed to fetch admin users from Firestore, using defaults:', err);
    safeSetLocalStorage('diy_admin_users', DEFAULT_ADMIN_USERS);
    return DEFAULT_ADMIN_USERS;
  }
}

export async function saveAdminUserToDb(user: AdminUser): Promise<void> {
  // Ensure email fallback
  if (!user.email || !user.email.trim()) {
    user.email = `${(user.username || 'user').trim().toLowerCase()}@prestige.local`;
  }

  const list = await getAdminUsersFromDb();

  // Protect against demoting or deactivating the last Super Admin
  const isSuper = user.role === 'admin' || (user.roleIds && user.roleIds.includes(SUPER_ADMIN_ROLE_ID)) || user.id === 'usr_super_admin_hesham';
  const existingUser = list.find(u => u.id === user.id);
  const wasSuper = existingUser?.role === 'admin' || (existingUser?.roleIds && existingUser.roleIds.includes(SUPER_ADMIN_ROLE_ID));

  if (wasSuper && (!isSuper || user.status === 'inactive')) {
    const otherActiveSuperAdmins = list.filter(u => 
      u.id !== user.id && 
      u.status === 'active' && 
      (u.role === 'admin' || (u.roleIds && u.roleIds.includes(SUPER_ADMIN_ROLE_ID)))
    );
    if (otherActiveSuperAdmins.length === 0) {
      throw new Error('لا يمكن إلغاء صلاحية أو تعطيل المدير العام الأخير في النظام لمنع قفل لوحة التحكم');
    }
  }

  const existingIdx = list.findIndex(u => u.id === user.id);
  let updatedList: AdminUser[];
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = user;
  } else {
    updatedList = [user, ...list];
  }
  safeSetLocalStorage('diy_admin_users', updatedList);

  // Sync to Supabase with race timeout to prevent UI hanging
  try {
    await Promise.race([
      upsertAdminUserToSupabase(user),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 4000))
    ]);
  } catch (err) {
    console.warn('Supabase user sync timeout or error (saved locally):', err);
  }

  // Sync to Firestore in background without blocking UI
  if (db) {
    try {
      const docRef = doc(db, USERS_COLLECTION, user.id);
      const sanitized = JSON.parse(safeStringify(user));
      setDoc(docRef, sanitized, { merge: true }).catch((err) => {
        console.warn('Could not sync user to Firestore (saved locally):', err);
      });
    } catch (err) {
      console.warn('Could not sync user to Firestore (saved locally):', err);
    }
  }
}

export async function deleteAdminUserFromDb(userId: string): Promise<void> {
  const list = await getAdminUsersFromDb();
  const target = list.find(u => u.id === userId);

  // Protect against deleting the last Super Admin
  if (target) {
    const isSuper = target.role === 'admin' || (target.roleIds && target.roleIds.includes(SUPER_ADMIN_ROLE_ID)) || target.id === 'usr_super_admin_hesham';
    if (isSuper) {
      const otherActiveSuperAdmins = list.filter(u => 
        u.id !== userId && 
        u.status === 'active' && 
        (u.role === 'admin' || (u.roleIds && u.roleIds.includes(SUPER_ADMIN_ROLE_ID)))
      );
      if (otherActiveSuperAdmins.length === 0) {
        throw new Error('لا يمكن حذف حساب المدير العام الأخير في النظام لمنع قفل لوحة التحكم');
      }
    }
  }

  const filtered = list.filter(u => u.id !== userId);
  safeSetLocalStorage('diy_admin_users', filtered);

  try {
    await Promise.race([
      deleteAdminUserFromSupabase(userId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 4000))
    ]);
  } catch (err) {
    console.warn('Supabase user delete timeout or error:', err);
  }

  if (db) {
    try {
      deleteDoc(doc(db, USERS_COLLECTION, userId)).catch(() => {});
    } catch (err) {
      console.error('Error deleting admin user from Firestore:', err);
    }
  }
}

// ==========================================
// Audit Logs Persistence
// ==========================================
export async function getAuditLogsFromDb(limitCount = 200): Promise<AuditLogEntry[]> {
  // 1. Try Supabase
  const supabaseLogs = await fetchAuditLogsFromSupabase(limitCount);
  if (supabaseLogs && supabaseLogs.length > 0) {
    safeSetLocalStorage('diy_audit_logs', supabaseLogs);
    return supabaseLogs;
  }

  // 2. Try localStorage
  const local = localStorage.getItem('diy_audit_logs');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, limitCount);
      }
    } catch {}
  }

  // 3. Try Firestore
  if (db) {
    try {
      const q = query(collection(db, AUDIT_LOGS_COLLECTION));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list: AuditLogEntry[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as AuditLogEntry);
        });
        list.sort((a, b) => b.timestamp - a.timestamp);
        const trimmed = list.slice(0, limitCount);
        safeSetLocalStorage('diy_audit_logs', trimmed);
        return trimmed;
      }
    } catch (err) {
      console.warn('Could not fetch audit logs from Firestore:', err);
    }
  }

  return [];
}

export async function recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
  const fullLog: AuditLogEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    timestamp: Date.now(),
    ...entry
  };

  // 1. Save to local storage
  try {
    const currentLogs = await getAuditLogsFromDb(100);
    const updated = [fullLog, ...currentLogs].slice(0, 300);
    safeSetLocalStorage('diy_audit_logs', updated);
  } catch {}

  // 2. Sync to Supabase
  insertAuditLogToSupabase(fullLog).catch(() => {});

  // 3. Sync to Firestore
  if (db) {
    try {
      const docRef = doc(db, AUDIT_LOGS_COLLECTION, fullLog.id);
      const sanitized = JSON.parse(safeStringify(fullLog));
      setDoc(docRef, sanitized).catch(() => {});
    } catch {}
  }
}


export function getCurrentAdminUser(): AdminUser | null {
  try {
    const saved = localStorage.getItem('diy_current_admin_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function setCurrentAdminUser(user: AdminUser | null): void {
  if (user) {
    safeSetLocalStorage('diy_current_admin_user', user);
  } else {
    localStorage.removeItem('diy_current_admin_user');
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword 
};
export type { User };
