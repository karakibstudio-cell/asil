export type HotelCategory = 'فنادق سنوية' | 'فنادق العمرة' | 'فنادق رمضان' | 'عادي';

export const ALL_HOTEL_CATEGORIES: HotelCategory[] = [
  'فنادق سنوية',
  'فنادق العمرة',
  'فنادق رمضان',
  'عادي'
];

export interface Hotel {
  id: string;
  name: string;
  nameEn?: string;
  city: 'مكة المكرمة' | 'المدينة المنورة';
  district: string; // المنطقة / الحي (حقل إجباري حر يكتبه الأدمن مثل: أجياد، العزيزية، المنطقة المركزية الشمالية)
  stars: number; // 3, 4, 5
  distanceToHaram: number; // in meters, e.g. 150
  distanceText: string; // e.g. "١٥٠م من الحرم المكي" or "ساحة الحرم النبوي الشريف"
  walkingTimeMinutes: number; // e.g. 2
  featured?: boolean; // يحدد ظهور الفندق في شريط الفنادق المميزة
  categories: HotelCategory[]; // تصنيفات متعددة: سنوي، عمرة، رمضان، عادي
  rating: number; // e.g. 4.9 (متوسط التقييمات المعتمدة)
  reviewCount: number; // عدد التقييمات المعتمدة
  mainImage: string;
  galleryImages: string[];
  videoUrl?: string; // Hotel promotional video
  additionalVideos?: {
    id: string;
    title: string;
    thumbnail: string;
    videoUrl: string;
  }[];
  overview: string;
  detailedDescription: string;
  amenities: string[];
  
  // External Platforms, Maps & Contact Channels
  bookingUrl?: string; // رابط بوكينج (Booking.com URL)
  showBookingUrl?: boolean; // إظهار / إخفاء زر Booking.com

  agodaUrl?: string; // رابط أجودا (Agoda URL)
  showAgodaUrl?: boolean; // إظهار / إخفاء زر Agoda

  expediaUrl?: string; // رابط إكسبيديا (Expedia URL)
  showExpediaUrl?: boolean; // إظهار / إخفاء زر Expedia

  googleMapsUrl?: string; // رابط خرائط جوجل (Google Maps URL)
  showGoogleMapsUrl?: boolean; // إظهار / إخفاء زر Google Maps

  hotelWhatsApp?: string; // رقم واتساب مخصص لحجوزات هذا الفندق
  showHotelWhatsApp?: boolean; // إظهار / إخفاء زر WhatsApp

  hotelEmail?: string; // بريد إلكتروني مخصص لحجوزات الفندق
  showHotelEmail?: boolean; // إظهار / إخفاء زر Email

  tripAdvisorUrl?: string; // رابط تريب أدفايزر
  customBookingUrl?: string; // رابط حجز مباشر إضافي
  customBookingTitle?: string; // عنوان رابط الحجز المخصص
  location: {
    lat?: number;
    lng?: number;
    address: string;
    mapEmbedUrl?: string;
    viewType: 'إطلالة مباشرة على الكعبة' | 'إطلالة على ساحات الحرم' | 'إطلالة على المدينة' | 'قريب جداً من الحرم';
  };
  reviewsList?: {
    id: string;
    author: string;
    country?: string;
    rating: number;
    date: string;
    comment: string;
  }[];
  keywords?: string;
  metaDescription?: string;
  createdAt?: number;
}

export interface Offer {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  videoUrl?: string;
  isActive: boolean; // مفتاح تفعيل/إخفاء للعرض
  badgeText?: string;
  hotelId?: string;
  keywords?: string;
  metaDescription?: string;
  createdAt?: number;
}

export interface HotelReview {
  id: string;
  hotelId?: string;
  hotelName?: string;
  authorName: string; // الاسم الذي أدخله العميل (إجباري)
  avatarUrl?: string; // صورة العميل الشخصية (اختياري - تظهر فقط إذا أرفقها العميل)
  rating: number; // تقييم النجوم 1 إلى 5
  comment: string; // نص التقييم ورأي العميل (إجباري)
  countryOrTitle?: string; // صفة أو بلد العميل (اختياري - يظهر فقط إذا كتبه)
  stayDate?: string; // موعد الإقامة (اختياري)
  status: 'pending' | 'approved';
  createdAt: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  hotelName?: string;
  preferredCity?: string;
  guestCount?: number;
  createdAt: number;
  read?: boolean;
}

export type ActivePage = 
  | 'home'
  | 'hotels'
  | 'hotel-detail'
  | 'offers'
  | 'about'
  | 'contact'
  | 'admin';

export interface FilterState {
  city: 'all' | 'مكة المكرمة' | 'المدينة المنورة';
  district: string; // 'all' or specific district name
  stars: 'all' | '3' | '4' | '5';
  maxDistance: number; // meters (e.g. 1000)
  sortBy: 'closest' | 'highest-rated';
  searchQuery: string;
  selectedCategories: HotelCategory[];
}

export type ChannelType = 
  | 'whatsapp' 
  | 'phone' 
  | 'email' 
  | 'facebook' 
  | 'instagram' 
  | 'tiktok' 
  | 'custom';

export interface ContactChannel {
  id: string;
  type: ChannelType;
  title: string;
  value: string;
  isActive: boolean;
  order: number;
}

export interface HeroSlide {
  id: string;
  mediaType?: 'image' | 'video';
  imageUrl: string;
  videoUrl?: string;
  videoThumbnail?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  showBadge?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showPrimaryButton?: boolean;
  primaryButtonText?: string;
  primaryButtonAction?: ActivePage | 'whatsapp';
  showSecondaryButton?: boolean;
  secondaryButtonText?: string;
  secondaryButtonAction?: ActivePage | 'whatsapp';
  order: number;
  isActive: boolean;
}

export interface BranchLocation {
  id: string;
  name: string; // e.g. "فرع مكة المكرمة"
  city: string; // "مكة المكرمة"
  address: string; // "أبراج وقف الملك عبدالعزيز، طريق أجياد، مكة"
  mapUrl: string; // "https://maps.google.com/?q=..."
  phone?: string;
  order?: number;
}

export interface QuickLinkItem {
  id: string;
  title: string;
  targetPage?: ActivePage | 'packages' | string;
  url?: string;
  isActive: boolean; // إظهار أو إخفاء الرابط
  order: number;
  isCustom?: boolean;
}

export interface ValuePillar {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  iconName?: string;
  customIconUrl?: string;
  order?: number;
}

export interface AboutPageSettings {
  title?: string;
  subtitle?: string;
  badge?: string;
  missionTitle?: string;
  missionText1?: string;
  missionText2?: string;
  visionTitle?: string;
  visionText?: string;
  yearsExperience?: string;
  servedGuests?: string;
  officeTitle?: string;
  officeCity?: string;
  officeAddress?: string;
  officeMapUrl?: string;
  officePhone?: string;
  officeWhatsApp?: string;
  officeEmail?: string;
  officeWorkingHours?: string;
  licenseNumber?: string;
  licenseAuthority?: string;
  showLicense?: boolean;
  photos?: string[];
  mainPhoto?: string;
  logoUrl?: string;
  valuePillars?: ValuePillar[];
}

export interface SiteSettings {
  siteTitle: string;
  siteSubtitle: string;
  logoUrl: string;
  showLicense?: boolean;
  channels?: ContactChannel[];
  heroSlides?: HeroSlide[];
  branches?: BranchLocation[];
  quickLinks?: QuickLinkItem[];
  aboutUs?: AboutPageSettings;
  updatedAt?: number;
}

export interface ContentItem {
  key: string;
  text: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  updatedAt?: number;
  updatedBy?: string;
}

export interface District {
  id: string;
  name: string;
  city: 'مكة المكرمة' | 'المدينة المنورة';
  description?: string;
  distanceRange?: string; // e.g. "١٠٠ - ٤٠٠ م"
  order?: number;
  createdAt?: number;
}

export type UserRole = 'admin' | 'controller';

export interface AdminUser {
  id: string;
  name: string;
  username?: string; // اسم المستخدم للدخول
  email: string;
  role: UserRole; // 'admin' = مدير عام (أدمن ahmed.tito.h1@gmail.com), 'controller' = مشرف
  password?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: number;
  lastLogin?: number;
}

