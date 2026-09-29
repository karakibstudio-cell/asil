import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
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
import { Hotel, Offer, ContactMessage, SiteSettings, ContactChannel, ContentItem, HotelReview, HeroSlide, District, AdminUser, BranchLocation, QuickLinkItem } from '../types';
import { INITIAL_HOTELS, INITIAL_OFFERS, INITIAL_REVIEWS } from '../data/mockHotels';
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
  fetchSiteSettingsFromSupabase,
  upsertSiteSettingsToSupabase,
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
  
  if (firebaseConfigJson.firestoreDatabaseId) {
    db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);
  } else {
    db = getFirestore(app);
  }
  
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase initialization error, will use local persistence fallback:', err);
}

export { app, db, auth };

// Helper to detect DOM nodes, Elements, Fiber nodes, Window, and non-plain data objects
function isDomOrNonSerializable(val: any): boolean {
  if (!val || typeof val !== 'object') return false;

  // 1. Check constructor name
  const name = val?.constructor?.name;
  if (
    name && 
    (name.includes('Element') || 
     name.includes('Node') || 
     name.includes('Fiber') || 
     name.includes('Window') || 
     name.includes('Document') || 
     name.includes('Event') ||
     name === 'HTMLVideoElement' ||
     name === 'HTMLMediaElement' ||
     name === 'HTMLElement')
  ) {
    return true;
  }

  // 2. Check standard DOM properties
  if (
    typeof val.nodeType === 'number' || 
    typeof val.tagName === 'string' ||
    'ownerDocument' in val ||
    ('play' in val && typeof val.play === 'function' && 'pause' in val)
  ) {
    return true;
  }

  // 3. Check React internal keys (Fiber / Props / Events)
  try {
    for (const key of Object.getOwnPropertyNames(val)) {
      if (key.startsWith('__reactFiber') || key.startsWith('__reactProps') || key.startsWith('__reactEvents')) {
        return true;
      }
    }
  } catch {}

  // 4. Check prototype: For data objects in JSON, prototype must be Object.prototype or null (or Array)
  if (!Array.isArray(val)) {
    try {
      const proto = Object.getPrototypeOf(val);
      if (proto !== null && proto !== Object.prototype) {
        return true;
      }
    } catch {}
  }

  return false;
}

// Deeply sanitize an object to strip non-serializable properties and break cycles
function deepSanitizeData(data: any, seen = new WeakSet()): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (isDomOrNonSerializable(data) || seen.has(data)) {
    return undefined;
  }
  seen.add(data);

  if (Array.isArray(data)) {
    return data
      .map(item => deepSanitizeData(item, seen))
      .filter(item => item !== undefined);
  }

  const result: Record<string, any> = {};
  try {
    for (const [k, v] of Object.entries(data)) {
      if (k.startsWith('__reactFiber') || k.startsWith('__reactProps') || k.startsWith('__reactEvents')) continue;
      const sanitizedVal = deepSanitizeData(v, seen);
      if (sanitizedVal !== undefined) {
        result[k] = sanitizedVal;
      }
    }
  } catch {
    return {};
  }
  return result;
}

// Safe JSON stringify helper that handles circular structures, DOM elements, React nodes & functions safely
export function safeStringify(obj: any, replacer?: (key: string, value: any) => any): string {
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (isDomOrNonSerializable(value) || seen.has(value)) {
          return undefined;
        }
        seen.add(value);
      }
      if (replacer) {
        return replacer(key, value);
      }
      return value;
    });
  } catch (err) {
    console.warn('[safeStringify] Caught stringify error, falling back to deepSanitizeData:', err);
    try {
      const sanitized = deepSanitizeData(obj);
      return JSON.stringify(sanitized, replacer);
    } catch {
      return '{}';
    }
  }
}

// Safe LocalStorage setter that handles QuotaExceededError and circular references gracefully
export function safeSetLocalStorage(key: string, value: any): boolean {
  try {
    const serialized = typeof value === 'string' ? value : safeStringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.warn(`[Storage] Quota exceeded or error saving "${key}" to localStorage:`, err);
    try {
      // Clear non-critical caches first to free up space
      try {
        localStorage.removeItem('diy_messages_cache');
        localStorage.removeItem('diy_reviews_cache');
      } catch {}

      if (typeof value === 'object' && value !== null) {
        // Strip out huge data URLs / base64 images from the local cache copy
        const strippedStr = safeStringify(value, (_k, v) => {
          if (typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('data:video/') || v.startsWith('blob:')) && v.length > 10000) {
            return '';
          }
          return v;
        });
        localStorage.setItem(key, strippedStr);
        return true;
      }
    } catch (innerErr) {
      console.warn(`[Storage] Secondary save failed for "${key}":`, innerErr);
    }
    return false;
  }
}

// Collection references
const HOTELS_COLLECTION = 'hotels';
const OFFERS_COLLECTION = 'offers';
const MESSAGES_COLLECTION = 'messages';
const SETTINGS_COLLECTION = 'settings';
const REVIEWS_COLLECTION = 'reviews';
const DISTRICTS_COLLECTION = 'districts';
const USERS_COLLECTION = 'admin_users';
export const CONTENT_COLLECTION = 'content';

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide_1',
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=2000&q=85',
    badge: 'الضيافة الملكية الأقرب إلى رحاب الحرمين الشريفين',
    title: 'تسكين في أرقى فنادق مكة المكرمة والمدينة المنورة',
    subtitle: 'نوفر لضيوف الرحمن وشركات السياحة أفضل خيارات الإقامة في فنادق الصف الأول المقابلة للحرم المكي والمسجد النبوي، مع تسهيلات حجز معتمدة ومباشرة.',
    primaryButtonText: 'استعرض الفنادق المتاحة',
    primaryButtonAction: 'hotels',
    secondaryButtonText: 'تواصل مع مستشار الحجز',
    secondaryButtonAction: 'contact',
    order: 0,
    isActive: true
  },
  {
    id: 'slide_2',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85',
    badge: 'إطلالات روحانية مباشرة وساحرة',
    title: 'أجنحة ملكية فاخرة مطلة على الكعبة المشرفة',
    subtitle: 'عش التجربة الروحانية الاستثنائية مع غرف وأجنحة ملكية وبوفيهات فاخرة تلبي رغبات العائلات والمجموعات وحملات المعتمرين بأعلى درجات الرفاهية.',
    primaryButtonText: 'استكشف العروض الحصرية',
    primaryButtonAction: 'offers',
    secondaryButtonText: 'حجز مباشر عبر الواتساب',
    secondaryButtonAction: 'whatsapp',
    order: 1,
    isActive: true
  },
  {
    id: 'slide_3',
    imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=2000&q=85',
    badge: 'المدينة المنورة - جوار المسجد النبوي الشريف',
    title: 'سكينة وراحة في فنادق المنطقة المركزية بالمدينة',
    subtitle: 'خطوات معدودة تفصلك عن الروضة الشريفة وباب السلام، مع خدمات فندقية راقية ونقل ترددي مستمر على مدار الساعة لخدمة الزوار الكرام.',
    primaryButtonText: 'فنادق المدينة المنورة',
    primaryButtonAction: 'hotels',
    secondaryButtonText: 'تواصل سريع عبر الواتساب',
    secondaryButtonAction: 'whatsapp',
    order: 2,
    isActive: true
  },
  {
    id: 'slide_4',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=85',
    badge: 'خدمات الاستقبال والضيافة المتكاملة 5 نجوم',
    title: 'باقات متكاملة تشمل التسكين الفاخر وأرقى مستويات الخدمة',
    subtitle: 'فريق عمل متخصص في استقبال وتسكين ضيوف الرحمن وتسهيل كافة إجراءات الدخول والإقامة بأعلى معايير الجودة والراحة.',
    primaryButtonText: 'طلب استشارة أو حجز',
    primaryButtonAction: 'contact',
    secondaryButtonText: 'استعراض كافة الفنادق',
    secondaryButtonAction: 'hotels',
    order: 3,
    isActive: true
  }
];

export const DEFAULT_CHANNELS: ContactChannel[] = [
  {
    id: 'ch_whatsapp',
    type: 'whatsapp',
    title: 'واتساب إدارة وحجوزات برستيج',
    value: '+966501234567',
    isActive: true,
    order: 0,
  },
  {
    id: 'ch_phone',
    type: 'phone',
    title: 'رقم الهاتف المباشر',
    value: '+966501234567',
    isActive: true,
    order: 1,
  },
  {
    id: 'ch_email',
    type: 'email',
    title: 'البريد الإلكتروني الرسمي',
    value: 'info@prestigehotels.sa',
    isActive: true,
    order: 2,
  },
  {
    id: 'ch_instagram',
    type: 'instagram',
    title: 'حسابنا على إنستقرام',
    value: 'https://instagram.com/prestige_hospitality',
    isActive: true,
    order: 3,
  },
  {
    id: 'ch_facebook',
    type: 'facebook',
    title: 'صفحتنا على فيسبوك',
    value: 'https://facebook.com/prestige.hospitality',
    isActive: true,
    order: 4,
  },
  {
    id: 'ch_tiktok',
    type: 'tiktok',
    title: 'تيك توك',
    value: 'https://tiktok.com/@prestige_hospitality',
    isActive: true,
    order: 5,
  }
];

export const DEFAULT_BRANCHES: BranchLocation[] = [
  {
    id: 'branch_makkah',
    name: 'المكتب الإداري - مكة المكرمة',
    city: 'مكة المكرمة',
    address: 'أبراج وقف الملك عبدالعزيز، طريق أجياد، مكة المكرمة',
    mapUrl: 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah',
    phone: '+966501234567',
    order: 1
  },
  {
    id: 'branch_madinah',
    name: 'المكتب الإداري - المدينة المنورة',
    city: 'المدينة المنورة',
    address: 'المنطقة المركزية الشمالية، طريق الملك فهد، المدينة المنورة',
    mapUrl: 'https://maps.google.com/?q=Northern+Central+Area+Madinah',
    phone: '+966501234567',
    order: 2
  }
];

export const DEFAULT_QUICK_LINKS: QuickLinkItem[] = [
  {
    id: 'link_home',
    title: 'الرئيسية',
    targetPage: 'home',
    isActive: true,
    order: 1,
  },
  {
    id: 'link_hotels',
    title: 'فنادقنا المُدارة',
    targetPage: 'hotels',
    isActive: true,
    order: 2,
  },
  {
    id: 'link_packages',
    title: 'باقات الحج والعمرة',
    targetPage: 'packages',
    isActive: true,
    order: 3,
  },
  {
    id: 'link_offers',
    title: 'العروض والمناسبات',
    targetPage: 'offers',
    isActive: true,
    order: 4,
  },
  {
    id: 'link_about',
    title: 'من نحن',
    targetPage: 'about',
    isActive: true,
    order: 5,
  },
  {
    id: 'link_contact',
    title: 'تواصل معنا',
    targetPage: 'contact',
    isActive: true,
    order: 6,
  }
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'برستيج لإدارة وتشغيل الفنادق',
  siteSubtitle: 'إدارة وتشغيل الفنادق والضيافة الفاخرة',
  logoUrl: '',
  showLicense: true,
  channels: DEFAULT_CHANNELS,
  heroSlides: DEFAULT_HERO_SLIDES,
  branches: DEFAULT_BRANCHES,
  quickLinks: DEFAULT_QUICK_LINKS,
};

export async function getSiteSettingsFromDb(): Promise<SiteSettings> {
  const local = localStorage.getItem('diy_site_settings');
  const fallback = local ? JSON.parse(local) : DEFAULT_SITE_SETTINGS;

  if (!fallback.heroSlides || !Array.isArray(fallback.heroSlides) || fallback.heroSlides.length === 0) {
    fallback.heroSlides = DEFAULT_HERO_SLIDES;
  } else {
    fallback.heroSlides = fallback.heroSlides.map((s: any, idx: number) => ({
      ...s,
      videoUrl: (s.videoUrl && typeof s.videoUrl === 'string' && !s.videoUrl.startsWith('blob:'))
        ? s.videoUrl
        : (DEFAULT_HERO_SLIDES[idx]?.videoUrl || '')
    }));
  }
  if (!fallback.branches || !Array.isArray(fallback.branches) || fallback.branches.length === 0) {
    fallback.branches = DEFAULT_BRANCHES;
  }
  if (!fallback.quickLinks || !Array.isArray(fallback.quickLinks) || fallback.quickLinks.length === 0) {
    fallback.quickLinks = DEFAULT_QUICK_LINKS;
  }

  // 1. Try Supabase first
  try {
    const supabaseSettings = await fetchSiteSettingsFromSupabase();
    if (supabaseSettings) {
      safeSetLocalStorage('diy_site_settings', supabaseSettings);
      return supabaseSettings;
    }
  } catch (err) {
    console.warn('Failed to load site settings from Supabase:', err);
  }

  // 2. Try Firestore
  if (!db) {
    return fallback;
  }

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'general');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<SiteSettings>;
      const channels = Array.isArray(data.channels) 
        ? [...data.channels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : (fallback.channels || DEFAULT_CHANNELS);

      const heroSlides = Array.isArray(data.heroSlides) && data.heroSlides.length > 0
        ? data.heroSlides.map((s, idx) => {
            const localSlide = fallback.heroSlides?.[idx];
            const rawVideo = s.videoUrl || (localSlide?.id === s.id ? localSlide.videoUrl : s.videoUrl) || '';
            const safeVideo = (rawVideo && typeof rawVideo === 'string' && !rawVideo.startsWith('blob:'))
              ? rawVideo
              : (DEFAULT_HERO_SLIDES[idx]?.videoUrl || '');
            return {
              ...s,
              videoUrl: safeVideo,
              imageUrl: s.imageUrl || (localSlide?.id === s.id ? localSlide.imageUrl : s.imageUrl) || '',
            };
          }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : (fallback.heroSlides || DEFAULT_HERO_SLIDES);

      const branches = Array.isArray(data.branches) && data.branches.length > 0
        ? [...data.branches].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : (fallback.branches || DEFAULT_BRANCHES);

      const quickLinks = Array.isArray(data.quickLinks) && data.quickLinks.length > 0
        ? [...data.quickLinks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : (fallback.quickLinks || DEFAULT_QUICK_LINKS);

      const merged: SiteSettings = {
        siteTitle: data.siteTitle || DEFAULT_SITE_SETTINGS.siteTitle,
        siteSubtitle: data.siteSubtitle || DEFAULT_SITE_SETTINGS.siteSubtitle,
        logoUrl: data.logoUrl || fallback.logoUrl || '',
        showLicense: data.showLicense ?? fallback.showLicense ?? true,
        aboutUs: data.aboutUs || fallback.aboutUs,
        channels,
        heroSlides,
        branches,
        quickLinks,
        updatedAt: data.updatedAt,
      };
      safeSetLocalStorage('diy_site_settings', merged);
      return merged;
    }
  } catch (err) {
    console.warn('Failed to load site settings from Firestore, using cache:', err);
  }

  return fallback;
}

export async function saveSiteSettingsToDb(settings: SiteSettings): Promise<void> {
  const toSave: SiteSettings = {
    ...settings,
    updatedAt: Date.now()
  };

  const sanitized: SiteSettings = JSON.parse(safeStringify(toSave));
  
  // Safe set local storage
  safeSetLocalStorage('diy_site_settings', sanitized);

  // Sync with Supabase
  try {
    await upsertSiteSettingsToSupabase(sanitized);
  } catch (err) {
    console.warn('Supabase site settings sync error:', err);
  }

  // Sync with Firestore
  if (db) {
    try {
      const firestorePayload = JSON.parse(
        safeStringify(sanitized, (key, value) => {
          if (typeof value === 'string' && (value.startsWith('data:video/') || value.startsWith('blob:')) && value.length > 500000) {
            console.warn(`[Firestore] Truncating large video string for key "${key}" for remote cloud sync while preserving local storage.`);
            return '';
          }
          return value;
        })
      );

      const docRef = doc(db, SETTINGS_COLLECTION, 'general');
      await setDoc(docRef, firestorePayload, { merge: true });
    } catch (err) {
      console.warn('Could not sync site settings to Firestore (saved locally):', err);
    }
  }
}

// ==========================================
// Hotels CRUD (Zero Initial Data -> Manual Admin Entry / Supabase)
// ==========================================
export async function getHotelsFromDb(): Promise<Hotel[]> {
  const HOTELS_VERSION_KEY = 'prestige_zero_hotels_v1';
  const normalizeHotel = (h: any): Hotel => ({
    ...h,
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
  });

  // 1. Try Supabase first
  const supabaseHotels = await fetchHotelsFromSupabase();
  if (supabaseHotels) {
    safeSetLocalStorage('diy_hotels', supabaseHotels);
    return supabaseHotels.map(normalizeHotel);
  }

  // 2. Check local clean version
  const version = localStorage.getItem(HOTELS_VERSION_KEY);
  if (!version) {
    safeSetLocalStorage('diy_hotels', INITIAL_HOTELS);
    safeSetLocalStorage(HOTELS_VERSION_KEY, '1.0');
    return INITIAL_HOTELS;
  }

  if (!db) {
    const saved = localStorage.getItem('diy_hotels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeHotel);
        }
      } catch {}
    }
    return INITIAL_HOTELS;
  }

  try {
    const q = query(collection(db, HOTELS_COLLECTION));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      const saved = localStorage.getItem('diy_hotels');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map(normalizeHotel);
          }
        } catch {}
      }
      return INITIAL_HOTELS;
    }
    const hotels: Hotel[] = [];
    snapshot.forEach((docSnap) => {
      hotels.push(normalizeHotel({ id: docSnap.id, ...docSnap.data() }));
    });
    return hotels;
  } catch (err) {
    console.warn('Failed to fetch hotels from Firestore, reading local cache:', err);
    const saved = localStorage.getItem('diy_hotels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeHotel);
        }
      } catch {}
    }
    return INITIAL_HOTELS;
  }
}

export async function saveHotelToDb(hotel: Hotel): Promise<void> {
  const localList = await getHotelsFromDb();
  const existingIdx = localList.findIndex(h => h.id === hotel.id);
  let updatedList: Hotel[];
  if (existingIdx >= 0) {
    updatedList = [...localList];
    updatedList[existingIdx] = hotel;
  } else {
    updatedList = [hotel, ...localList];
  }
  safeSetLocalStorage('diy_hotels', updatedList);

  // Sync to Supabase
  await upsertHotelToSupabase(hotel);

  // Sync to Firestore
  if (db) {
    try {
      const hotelRef = doc(db, HOTELS_COLLECTION, hotel.id);
      const sanitized = JSON.parse(safeStringify({
        ...hotel,
        updatedAt: Date.now()
      }));
      await setDoc(hotelRef, sanitized, { merge: true });
    } catch (err) {
      console.warn('Could not sync hotel to Firestore (saved locally):', err);
    }
  }
}

export async function deleteHotelFromDb(hotelId: string): Promise<void> {
  const localList = await getHotelsFromDb();
  const filtered = localList.filter(h => h.id !== hotelId);
  safeSetLocalStorage('diy_hotels', filtered);

  await deleteHotelFromSupabase(hotelId);

  if (db) {
    try {
      await deleteDoc(doc(db, HOTELS_COLLECTION, hotelId));
    } catch (err) {
      console.error('Error deleting hotel from Firestore:', err);
    }
  }
}

// ==========================================
// Offers CRUD (Supabase + Local)
// ==========================================
export async function getOffersFromDb(): Promise<Offer[]> {
  const OFFERS_VERSION_KEY = 'prestige_zero_offers_v1';
  const supabaseOffers = await fetchOffersFromSupabase();
  if (supabaseOffers) {
    safeSetLocalStorage('diy_offers', supabaseOffers);
    return supabaseOffers;
  }

  const version = localStorage.getItem(OFFERS_VERSION_KEY);
  if (!version) {
    safeSetLocalStorage('diy_offers', INITIAL_OFFERS);
    safeSetLocalStorage(OFFERS_VERSION_KEY, '1.0');
    return INITIAL_OFFERS;
  }

  if (!db) {
    const saved = localStorage.getItem('diy_offers');
    return saved ? JSON.parse(saved) : INITIAL_OFFERS;
  }
  try {
    const q = query(collection(db, OFFERS_COLLECTION));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      const saved = localStorage.getItem('diy_offers');
      return saved ? JSON.parse(saved) : INITIAL_OFFERS;
    }
    const offers: Offer[] = [];
    snapshot.forEach((docSnap) => {
      offers.push({ id: docSnap.id, ...docSnap.data() } as Offer);
    });
    return offers;
  } catch (err) {
    console.warn('Failed to fetch offers from Firestore, reading local cache:', err);
    const saved = localStorage.getItem('diy_offers');
    return saved ? JSON.parse(saved) : INITIAL_OFFERS;
  }
}

export async function saveOfferToDb(offer: Offer): Promise<void> {
  const localList = await getOffersFromDb();
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
      await setDoc(offerRef, sanitized, { merge: true });
    } catch (err) {
      console.warn('Could not sync offer to Firestore (saved locally):', err);
    }
  }
}

export async function deleteOfferFromDb(offerId: string): Promise<void> {
  const localList = await getOffersFromDb();
  const filtered = localList.filter(o => o.id !== offerId);
  safeSetLocalStorage('diy_offers', filtered);

  await deleteOfferFromSupabase(offerId);

  if (db) {
    try {
      await deleteDoc(doc(db, OFFERS_COLLECTION, offerId));
    } catch (err) {
      console.error('Error deleting offer from Firestore:', err);
    }
  }
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
      await setDoc(doc(db, REVIEWS_COLLECTION, newId), fullReview);
    } catch (err) {
      console.error('Error submitting review to Firestore:', err);
    }
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
  const supabaseMsgs = await fetchMessagesFromSupabase();
  if (supabaseMsgs) {
    safeSetLocalStorage('diy_messages', supabaseMsgs);
    return supabaseMsgs;
  }

  if (!db) {
    return getStoredContactMessages();
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
    return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.warn('Failed to load messages from Firestore:', err);
    return getStoredContactMessages();
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
// In-Place Live Content Editing CRUD
// ==========================================
export function subscribeToLiveContent(callback: (contentMap: Record<string, ContentItem>) => void): () => void {
  try {
    const cached = localStorage.getItem('diy_live_content');
    if (cached) {
      const parsed = JSON.parse(cached);
      const normalized: Record<string, ContentItem> = {};
      Object.keys(parsed).forEach((k) => {
        if (typeof parsed[k] === 'string') {
          normalized[k] = { key: k, text: parsed[k] };
        } else if (parsed[k] && typeof parsed[k] === 'object') {
          normalized[k] = { key: k, text: parsed[k].text || '', ...parsed[k] };
        }
      });
      callback(normalized);
    }
  } catch (e) {
    console.warn('Failed reading cached live content:', e);
  }

  if (!db) {
    return () => {};
  }

  try {
    const collRef = collection(db, CONTENT_COLLECTION);
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const map: Record<string, ContentItem> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && typeof data.text === 'string') {
          map[docSnap.id] = {
            key: docSnap.id,
            text: data.text,
            color: data.color || undefined,
            fontSize: data.fontSize || undefined,
            fontWeight: data.fontWeight || undefined,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy
          };
        }
      });

      try {
        const cached = localStorage.getItem('diy_live_content');
        const existing = cached ? JSON.parse(cached) : {};
        const merged = { ...existing, ...map };
        safeSetLocalStorage('diy_live_content', merged);
        callback(merged);
      } catch {
        callback(map);
      }
    }, (error) => {
      console.warn('Firestore live content listener error:', error);
    });

    return unsubscribe;
  } catch (err) {
    console.error('Error setting up onSnapshot for live content:', err);
    return () => {};
  }
}

export async function saveContentToDb(
  key: string, 
  content: string | Partial<ContentItem>, 
  updatedBy?: string
): Promise<void> {
  const item: ContentItem = typeof content === 'string'
    ? { key, text: content }
    : { key, text: content.text ?? '', ...content };

  const payload: ContentItem = {
    ...item,
    key,
    updatedAt: Date.now(),
    ...(updatedBy ? { updatedBy } : {})
  };

  const sanitized = JSON.parse(safeStringify(payload));

  try {
    const cached = localStorage.getItem('diy_live_content');
    const existing = cached ? JSON.parse(cached) : {};
    existing[key] = sanitized;
    safeSetLocalStorage('diy_live_content', existing);
  } catch (e) {
    console.warn('Failed to cache live content locally:', e);
  }

  if (db) {
    try {
      const docRef = doc(db, CONTENT_COLLECTION, key);
      await setDoc(docRef, sanitized, { merge: true });
    } catch (err) {
      console.warn('Could not sync content to Firestore (saved locally):', err);
    }
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

  if (!db) {
    safeSetLocalStorage('diy_districts', DEFAULT_DISTRICTS);
    return DEFAULT_DISTRICTS;
  }

  try {
    const q = query(collection(db, DISTRICTS_COLLECTION));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      safeSetLocalStorage('diy_districts', DEFAULT_DISTRICTS);
      return DEFAULT_DISTRICTS;
    }
    const list: District[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as District);
    });
    const sorted = list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    safeSetLocalStorage('diy_districts', sorted);
    return sorted;
  } catch (err) {
    console.warn('Failed to load districts from Firestore, using cache/defaults:', err);
    safeSetLocalStorage('diy_districts', DEFAULT_DISTRICTS);
    return DEFAULT_DISTRICTS;
  }
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
// Admin Users & Controllers Management (RBAC)
// ==========================================
export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr_super_admin_hesham',
    name: 'المدير العام (أحمد هشام)',
    username: 'A.hesham',
    email: 'a.hesham@prestigehotels.sa',
    role: 'admin',
    password: '199991',
    status: 'active',
    notes: 'حساب المدير العام الرئيسي الثابت ولا يمكن تعديله أو حذفه',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
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
        return parsed;
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
      list.push({ id: docSnap.id, ...docSnap.data() } as AdminUser);
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
  const list = await getAdminUsersFromDb();
  const existingIdx = list.findIndex(u => u.id === user.id);
  let updatedList: AdminUser[];
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = user;
  } else {
    updatedList = [user, ...list];
  }
  safeSetLocalStorage('diy_admin_users', updatedList);

  await upsertAdminUserToSupabase(user);

  if (db) {
    try {
      const docRef = doc(db, USERS_COLLECTION, user.id);
      const sanitized = JSON.parse(safeStringify(user));
      await setDoc(docRef, sanitized, { merge: true });
    } catch (err) {
      console.warn('Could not sync user to Firestore (saved locally):', err);
    }
  }
}

export async function deleteAdminUserFromDb(userId: string): Promise<void> {
  const list = await getAdminUsersFromDb();
  const filtered = list.filter(u => u.id !== userId);
  safeSetLocalStorage('diy_admin_users', filtered);

  await deleteAdminUserFromSupabase(userId);

  if (db) {
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, userId));
    } catch (err) {
      console.error('Error deleting admin user from Firestore:', err);
    }
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
