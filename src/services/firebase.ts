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
import { Hotel, Offer, ContactMessage, SiteSettings, ContactChannel, ContentItem, HotelReview, HeroSlide, District, AdminUser, BranchLocation, DepartmentContact, QuickLinkItem, AboutPageSettings, StoryTeaserSettings, IntegratedServicesSettings, HomeSectionsSettings } from '../types';
import { DEFAULT_VALUE_PILLARS } from '../components/AdminAboutManager';
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
  } catch (_err) {
    try {
      // Clear non-critical caches first to free up space
      try {
        localStorage.removeItem('diy_messages_cache');
        localStorage.removeItem('diy_reviews_cache');
        localStorage.removeItem('diy_offers_cache');
      } catch {}

      if (typeof value === 'object' && value !== null) {
        // Strip out huge data URLs / base64 images from the local cache copy
        const maxLen = key === 'diy_site_settings' ? 500000 : 50000;
        const strippedStr = safeStringify(value, (_k, v) => {
          if (typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('data:video/') || v.startsWith('blob:')) && v.length > maxLen) {
            return '';
          }
          return v;
        });
        localStorage.setItem(key, strippedStr);
        return true;
      }
    } catch (_innerErr) {
      // Gracefully handle storage quota limit - data is safe in Supabase/Firebase
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

// ==========================================
// In-Memory Fetch Cache (prevents redundant Supabase calls within short windows)
// ==========================================
const CACHE_TTL_MS = 2_000; // 2 seconds — keep low for fast freshness after admin edits

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const fetchCache: Record<string, CacheEntry<any>> = {};

function getCached<T>(key: string, skipCache = false): T | null {
  if (skipCache) return null;
  const entry = fetchCache[key];
  if (entry && (Date.now() - entry.timestamp) < CACHE_TTL_MS) {
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  fetchCache[key] = { data, timestamp: Date.now() };
}

export function invalidateCache(key?: string): void {
  if (key) {
    delete fetchCache[key];
  } else {
    Object.keys(fetchCache).forEach(k => delete fetchCache[k]);
  }
}

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [];

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
    name: 'فرع مكة المكرمة (المقر الرئيسي)',
    city: 'مكة المكرمة',
    address: 'أبراج وقف الملك عبدالعزيز (الصفوة)، شارع أجياد، المنطقة المركزية، مكة المكرمة',
    mapUrl: 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah',
    phone: '+966501234567',
    whatsapp: '+966501234567',
    workingHours: 'على مدار الساعة 24/7',
    isMainBranch: true,
    isActive: true,
    order: 1
  },
  {
    id: 'branch_madinah',
    name: 'فرع المدينة المنورة',
    city: 'المدينة المنورة',
    address: 'المنطقة المركزية الشمالية، أمام بوابة الملك فهد، طريق الملك فهد، المدينة المنورة',
    mapUrl: 'https://maps.google.com/?q=Northern+Central+Area+Madinah',
    phone: '+966501234568',
    whatsapp: '+966501234568',
    workingHours: 'على مدار الساعة 24/7',
    isMainBranch: false,
    isActive: true,
    order: 2
  }
];

export const DEFAULT_DEPARTMENT_CONTACTS: DepartmentContact[] = [
  {
    id: 'dept_sales',
    department: 'إدارة المبيعات والشركات',
    name: 'فريق المبيعات والتعاقدات',
    roleTitle: 'مسؤول مبيعات الشركات وحجوزات المجموعات',
    phone: '+966501234567',
    whatsapp: '+966501234567',
    workingHours: 'متاح 24/7 طوال أيام الأسبوع',
    isActive: true,
    order: 1
  },
  {
    id: 'dept_bookings',
    department: 'قسم الحجوزات والتسكين',
    name: 'استشاري التسكين المباشر',
    roleTitle: 'مسؤول تأكيد الغرف والأجنحة الفندقية',
    phone: '+966501234568',
    whatsapp: '+966501234568',
    workingHours: 'على مدار الساعة 24/7',
    isActive: true,
    order: 2
  },
  {
    id: 'dept_accounts',
    department: 'قسم الحسابات والمالية',
    name: 'الإدارة المالية والمدفوعات',
    roleTitle: 'المسؤول المالي والفواتير والتحويلات',
    phone: '+966501234569',
    whatsapp: '+966501234569',
    workingHours: '9:00 ص - 6:00 م',
    isActive: true,
    order: 3
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
    id: 'link_hotels_makkah',
    title: 'فنادق مكة المكرمة',
    targetPage: 'hotels-makkah',
    isActive: true,
    order: 2,
  },
  {
    id: 'link_hotels_madinah',
    title: 'فنادق المدينة المنورة',
    targetPage: 'hotels-madinah',
    isActive: true,
    order: 3,
  },
  {
    id: 'link_hotels',
    title: 'جميع الفنادق',
    targetPage: 'hotels',
    isActive: false,
    order: 4,
  },
  {
    id: 'link_offers',
    title: 'الإعلانات والعروض',
    targetPage: 'offers',
    isActive: true,
    order: 5,
  },
  {
    id: 'link_packages',
    title: 'باقات الحج والعمرة',
    targetPage: 'packages',
    isActive: false,
    order: 6,
  },
  {
    id: 'link_about',
    title: 'من نحن',
    targetPage: 'about',
    isActive: true,
    order: 7,
  },
  {
    id: 'link_contact',
    title: 'تواصل معنا',
    targetPage: 'contact',
    isActive: true,
    order: 8,
  }
];

export const DEFAULT_ABOUT_US: AboutPageSettings = {
  title: 'برستيج.. حيث تلتقي فخامة الضيافة بروحانية المكان',
  subtitle: 'منذ عام 2010، انطلقت "برستيج لإدارة وتشغيل الفنادق" من قلب العاصمة المقدسة لتُعيد صياغة مفهوم الضيافة وخدمة ضيوف الرحمن.',
  badge: 'شرف خدمة ضيوف الرحمن',
  missionTitle: 'مسيرتنا: صناعة تجارب إقامة استثنائية وشراكات استراتيجية',
  missionText1: 'منذ عام 2010، انطلقت "برستيج لإدارة وتشغيل الفنادق" من قلب العاصمة المقدسة لتُعيد صياغة مفهوم الضيافة وخدمة ضيوف الرحمن. لم نكتفِ يوماً بتقديم مجرد غرف فندقية، بل أخذنا على عاتقنا صناعة تجارب إقامة استثنائية تمزج بين الرفاهية والراحة التامة.',
  missionText2: 'بفضل الله ثم بثقة عملائنا من الشركات والمجموعات، امتدت مسيرة نجاحنا من مكة المكرمة إلى رحاب المدينة المنورة، لنعقد أضخم الشراكات السنوية في أهم المواقع الاستراتيجية (محبس الجن، أجياد، والمسفلة). واليوم، نتوج هذه المسيرة بفندقنا الخاص "برستيج أجياد"، إلى جانب إدارتنا وتشغيلنا لأكثر من 7 فنادق راقية ومجهزة بالكامل لاستقبال الحجاج والمعتمرين. مع "برستيج"، أنت لا تحجز إقامة فقط، بل تضمن منظومة خدمات متكاملة تليق بك وبضيوفك.',
  visionTitle: 'رؤيتنا: الريادة في إدارة وتشغيل الفنادق والضيافة الروحانية',
  visionText: 'أن نكون الخيار الأول والأكثر ثقة للمستثمرين وضيوف الرحمن ووكالات العمرة عالمياً من خلال تقديم أرقى معايير الإدارة والتشغيل الفندقي.',
  yearsExperience: '١٥+ عاماً',
  servedGuests: '١٢٠,٠٠٠+',
  officeTitle: 'المقر الرئيسي لشركة برستيج لإدارة وتشغيل الفنادق',
  officeCity: 'مكة المكرمة',
  officeAddress: 'أبراج وقف الملك عبدالعزيز - مجمع أبراج البيت، طريق أجياد، مكة المكرمة',
  officeMapUrl: 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah',
  officePhone: '+966501234567',
  officeWhatsApp: '+966501234567',
  officeEmail: 'info@prestigehotels.sa',
  officeWorkingHours: 'على مدار الساعة 24/7 لخدمة ضيوف الرحمن',
  licenseNumber: '73104928',
  licenseAuthority: 'مرخصون من وزارة الحج والعمرة والهيئة السعودية للسياحة',
  showLicense: true,
  photos: [],
  mainPhoto: '',
  logoUrl: '',
  valuePillars: DEFAULT_VALUE_PILLARS
};

export const DEFAULT_STORY_TEASER: StoryTeaserSettings = {
  isEnabled: true,
  badge: 'نبذة عن شركة برستيج',
  title: 'برستيج.. حيث تلتقي فخامة الضيافة بروحانية المكان',
  paragraph1: "منذ عام 2010، انطلقت 'برستيج لإدارة وتشغيل الفنادق' من قلب العاصمة المقدسة لتُعيد صياغة مفهوم الضيافة وخدمة ضيوف الرحمن. لم نكتفِ يوماً بتقديم مجرد غرف فندقية، بل أخذنا على عاتقنا صناعة تجارب إقامة استثنائية تمزج بين الرفاهية والراحة التامة.",
  paragraph2: "بفضل الله ثم بثقة عملائنا من الشركات والمجموعات، امتدت مسيرة نجاحنا من مكة المكرمة إلى رحاب المدينة المنورة، لنعقد أضخم الشراكات السنوية في أهم المواقع الاستراتيجية (محبس الجن، أجياد، والمسفلة).",
  paragraph3: "واليوم، نتوج هذه المسيرة بفندقنا الخاص 'برستيج أجياد'، إلى جانب إدارتنا وتشغيلنا لأكثر من 7 فنادق راقية ومجهزة بالكامل لاستقبال الحجاج والمعتمرين. مع 'برستيج'، أنت لا تحجز إقامة فقط، بل تضمن منظومة خدمات متكاملة تليق بك وبضيوفك.",
  showExploreButton: true,
  exploreButtonText: 'اقرأ المزيد عنا',
  showContactButton: true,
  contactButtonText: 'عروض الشركات والمجموعات',
  showcaseEstablishedYear: 'منذ 2010 م',
  showcaseBadge: 'شراكات استراتيجية موثوقة',
  showcaseTitle: 'إدارة وتشغيل أكثر من 7 فنادق راقية بمكة والمدينة',
  showcaseLicenseNote: 'شركة مرخصة ومعتمدة من وزارة الحج والعمرة والهيئة السعودية للسياحة',
  locationTags: [
    { id: 'tag_1', text: 'فندق برستيج أجياد (فندقنا الخاص)', iconName: 'MapPin', isActive: true },
    { id: 'tag_2', text: 'فنادق محبس الجن للعمرة', iconName: 'Building2', isActive: true },
    { id: 'tag_3', text: 'فنادق المسفلة وأجياد', iconName: 'Building2', isActive: true },
    { id: 'tag_4', text: 'فنادق المدينة المنورة المركزية', iconName: 'Award', isActive: true }
  ],
  showcasePoints: [
    { id: 'pt_1', title: 'فندق برستيج أجياد', description: 'الفندق الخاص للشركة بأرقى معايير الضيافة الفندقية في مكة.', isActive: true },
    { id: 'pt_2', title: 'تغطية المواقع الحيوية', description: 'محبس الجن، أجياد، والمسفلة بمكة المكرمة والمنطقة المركزية بالمدينة.', isActive: true },
    { id: 'pt_3', title: 'عقود سنوية وموسمية للشركات', description: 'تسكين فوري وأسعار خاصة لشركات السياحة وحملات الحج والعمرة.', isActive: true }
  ]
};

export const DEFAULT_INTEGRATED_SERVICES: IntegratedServicesSettings = {
  isEnabled: true,
  badge: 'خدماتنا المتكاملة',
  title: 'منظومة ضيافة متكاملة تحت سقف واحد',
  subtitle: 'نقدم لعملائنا من الشركات والمجموعات وضيوف الرحمن باقة خدمات شاملة تضمن أعلى مستويات الراحة والتميز من الاستقبال وحتى المغادرة.',
  services: [
    {
      id: 'service_hotel_management',
      iconName: 'Building2',
      badge: 'الخدمة الأساسية',
      badgeEn: 'Core Service',
      title: 'إدارة وتشغيل الفنادق',
      titleEn: 'Hotel Management & Operations',
      description: 'ريادة واحترافية في إدارة المرافق الفندقية وتشغيل الفنادق في مكة المكرمة والمدينة المنورة لضمان أعلى معايير الجودة والراحة للنزلاء وضيوف الرحمن.',
      descriptionEn: 'Leadership and professionalism in hotel facilities management and hospitality operations in Makkah and Madinah.',
      highlights: ['إدارة شاملة للأصول الفندقية', 'فندق برستيج أجياد وأكثر من 7 فنادق راقية', 'تسكين فوري ومباشر'],
      buttonText: 'استكشف الفنادق',
      buttonAction: 'hotels',
      isActive: true,
      order: 1
    },
    {
      id: 'service_luxury_transport',
      iconName: 'Bus',
      badge: 'تنقلات آمنة ومريحة',
      badgeEn: 'Safe & Luxury Fleet',
      title: 'خدمات النقل الفاخر',
      titleEn: 'Luxury Transport Services',
      description: 'أسطول حديث ومتنوع لتأمين تنقلات مريحة، آمنة، وسلسة للحجاج والمعتمرين والمجموعات والشركات بين المطارات، الفنادق، والمشاعر المقدسة.',
      descriptionEn: 'A modern and diverse fleet securing smooth, safe, and comfortable transfers for groups and corporate partners.',
      highlights: ['حافلات وسيارات حديثة ومكيفة', 'سائقون محترفون وخبراء بطرق الحرمين', 'خدمة استقبال وتوديع بالمطارات'],
      buttonText: 'طلب عرض خدمة',
      buttonAction: 'contact',
      isActive: true,
      order: 2
    },
    {
      id: 'service_catering',
      iconName: 'Utensils',
      badge: 'أعلى معايير الجودة',
      badgeEn: 'Premium Quality',
      title: 'خدمات الإعاشة (Catering)',
      titleEn: 'Catering & Hospitality Food Services',
      description: 'قوائم طعام متنوعة ومعدة بأعلى معايير الجودة والسلامة الغذائية لتناسب كافة الأذواق وتلبي احتياجات ضيوف الرحمن والمجموعات والشركات.',
      descriptionEn: 'Diverse meal menus prepared with the highest quality and safety standards to suit all tastes for pilgrim groups.',
      highlights: ['بوفيهات فندقية مفتوحة ووجبات مغلفة', 'مطابخ مركزية مرخصة ومجهزة', 'خيارات مخصصة للشركات والبعثات'],
      buttonText: 'طلب عرض خدمة',
      buttonAction: 'contact',
      isActive: true,
      order: 3
    },
    {
      id: 'service_visas',
      iconName: 'FileCheck',
      badge: 'إجراءات سريعة ومضمونة',
      badgeEn: 'Fast & Certified',
      title: 'استخراج التأشيرات',
      titleEn: 'Visa Issuance & Processing',
      description: 'فريق متخصص لتسهيل وتسريع إجراءات تأشيرات الحج والعمرة وإصدار التصاريح النظامية لضمان رحلة سلسة وبلا عقبات لضيوف الرحمن.',
      descriptionEn: 'A dedicated team facilitating and expediting Umrah & Hajj visa procedures ensuring a hassle-free journey.',
      highlights: ['إصدار سريع لتأشيرات العمرة', 'تنسيق متكامل مع المنصات الرسمية', 'دعم فني واستشارات متواصلة'],
      buttonText: 'طلب عرض خدمة',
      buttonAction: 'contact',
      isActive: true,
      order: 4
    }
  ]
};

export const DEFAULT_HOME_SECTIONS: HomeSectionsSettings = {
  showStats: true,
  showFeaturedHotels: true,
  featuredHotelsBadge: 'فخامة وروحانية',
  featuredHotelsTitle: 'فنادقنا المميزة في مكة والمدينة',
  featuredHotelsSubtitle: 'مجموعة مختارة بعناية من أفخم الفنادق المطلة على الكعبة المشرفة وساحات المسجد النبوي، تضمن لكم راحة لا تضاهى.',
  showStoryTeaser: true,
  showIntegratedServices: true,
  showHotelsAccordion: true,
  showOffersBanner: true,
  showTestimonials: true,
  showWhyChooseUs: true
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'برستيج لإدارة وتشغيل الفنادق',
  siteSubtitle: 'إدارة وتشغيل الفنادق والضيافة الفاخرة',
  logoUrl: '',
  showLicense: true,
  channels: DEFAULT_CHANNELS,
  heroSlides: DEFAULT_HERO_SLIDES,
  branches: DEFAULT_BRANCHES,
  departmentContacts: DEFAULT_DEPARTMENT_CONTACTS,
  quickLinks: DEFAULT_QUICK_LINKS,
  aboutUs: DEFAULT_ABOUT_US,
  storyTeaser: DEFAULT_STORY_TEASER,
  integratedServices: DEFAULT_INTEGRATED_SERVICES,
  homeSections: DEFAULT_HOME_SECTIONS,
  bookingModule: {
    enabled: true,
    allowPublicBookingCreation: true,
    mode: 'full',
    showInHeader: true,
    showTrackBookingModal: true,
    showInHero: true,
    showInHotelDetail: true,
    bookingEmail: 'bookings@prestigeksa.com',
    bookingWhatsApp: '+966544076726',
    enableWhatsAppRedirect: true,
    enableEmailNotification: true,
    autoAssignDigitalKey: true,
    currency: 'ر.س'
  },
  ...(INITIAL_SITE_SETTINGS || {})
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
              isActive: b.isActive !== false,
              order: typeof b.order === 'number' ? b.order : idx + 1
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
}

// ==========================================
// Hotels CRUD (Zero Initial Data -> Manual Admin Entry / Supabase)
// ==========================================
export async function getHotelsFromDb(skipCache = false): Promise<Hotel[]> {
  // Check in-memory cache first (skipped when triggered by realtime events)
  const cached = getCached<Hotel[]>('hotels', skipCache);
  if (cached) return cached;

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
    isActive: h.isActive !== false,
    onlineBookingEnabled: typeof h.onlineBookingEnabled === 'boolean'
      ? h.onlineBookingEnabled
      : (typeof h.online_booking_enabled === 'boolean' 
          ? h.online_booking_enabled 
          : (typeof (h.location as any)?.onlineBookingEnabled === 'boolean' 
              ? (h.location as any).onlineBookingEnabled 
              : true)),
    bookingPolicy: h.bookingPolicy || h.booking_policy || undefined,
    order: typeof h.order === 'number' 
      ? h.order 
      : (typeof (h.location as any)?.order === 'number' ? (h.location as any).order : 0),
  });

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

  // 2. Check local clean version
  const version = localStorage.getItem(HOTELS_VERSION_KEY);
  if (!version) {
    safeSetLocalStorage('diy_hotels', INITIAL_HOTELS);
    safeSetLocalStorage(HOTELS_VERSION_KEY, '1.0');
    return INITIAL_HOTELS;
  }

  if (!db) {
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
        let textVal = '';
        if (typeof parsed[k] === 'string') {
          textVal = parsed[k];
          normalized[k] = { key: k, text: textVal.includes('ضيافة الحرمين') ? textVal.replace(/ضيافة الحرمين/g, 'شركة برستيج') : textVal };
        } else if (parsed[k] && typeof parsed[k] === 'object') {
          textVal = parsed[k].text || '';
          normalized[k] = { 
            key: k, 
            ...parsed[k],
            text: textVal.includes('ضيافة الحرمين') ? textVal.replace(/ضيافة الحرمين/g, 'شركة برستيج') : textVal 
          };
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
          const rawText = data.text;
          const cleanedText = rawText.includes('ضيافة الحرمين') ? rawText.replace(/ضيافة الحرمين/g, 'شركة برستيج') : rawText;
          map[docSnap.id] = {
            key: docSnap.id,
            text: cleanedText,
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
