export type HotelCategory = 'فنادق سنوية' | 'فنادق العمرة' | 'فنادق رمضان' | 'فنادق الحج' | 'عادي' | string;

export const ALL_HOTEL_CATEGORIES: HotelCategory[] = [
  'فنادق العمرة',
  'فنادق رمضان',
  'فنادق سنوية',
  'فنادق الحج',
  'عادي'
];

export type HotelImageCategory = 'all' | 'rooms' | 'views' | 'dining' | 'lobby' | 'facilities';

export interface HotelGalleryItem {
  url: string;
  category?: HotelImageCategory;
  title?: string;
}

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
  isActive?: boolean; // تفعيل ظهور الفندق للزوار في الموقع أو إخفائه
  order?: number; // ترتيب ظهور الفندق (الرقم الأصغر يظهر أولاً)
  categories: HotelCategory[]; // تصنيفات متعددة: سنوي، عمرة، رمضان، عادي
  rating: number; // e.g. 4.9 (متوسط التقييمات المعتمدة)
  reviewCount: number; // عدد التقييمات المعتمدة
  mainImage: string;
  galleryImages: (string | HotelGalleryItem)[];
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
    viewType: 'إطلالة حرم' | 'ساحة الحرم' | 'إطلالة على المدينة' | 'إطلالة مباشرة على الكعبة' | 'إطلالة على ساحات الحرم' | 'قريب جداً من الحرم' | string;
    transportType?: 'walking' | 'bus';
    order?: number;
    isActive?: boolean;
    metaDescription?: string;
    showDistanceBadge?: boolean;
    [key: string]: any;
  };
  transportType?: 'walking' | 'bus';
  reviewsList?: {
    id: string;
    author: string;
    country?: string;
    rating: number;
    date: string;
    comment: string;
  }[];
  keywords?: string;
  metaTitle?: string;
  metaTitleEn?: string;
  metaDescription?: string;
  metaDescriptionEn?: string;
  onlineBookingEnabled?: boolean; // تحديد إتاحة الفندق للحجز أونلاين
  onlineAvailabilityMode?: 'always' | 'periods_only' | 'disabled'; // نمط الإتاحة: متاح دائماً، متاح في الفترات المحددة فقط، أو معطل
  showDistanceBadge?: boolean; // إظهار أو إخفاء شارة المسافة (مشي / باص)
  showCategories?: boolean; // إظهار أو إخفاء تصنيفات الفندق (العمرة، رمضان، سنوية، الحج)
  showTransportInfo?: boolean; // إظهار أو إخفاء معلومات النقل والمشي
  showStars?: boolean; // إظهار أو إخفاء تصنيف النجوم على بطاقات الفندق
  showRating?: boolean; // إظهار أو إخفاء التقييم الرقمي للنزلاء (مثال: 4.8 ★)
  showDistrict?: boolean; // إظهار أو إخفاء شارة اسم الحي والمدينة
  customClassification?: string; // مسمى تصنيف إضافي أو مخصص (مثال: فندق اقتصادي، شقق فندقية)
  bookingPolicy?: HotelBookingPolicy; // سياسات وشروط الفندق العالمية
  bookingRuleSets?: BookingRuleSet[]; // مجموعات قواعد الحجز الخاصة بالفندق
  policiesList?: HotelPolicyItem[]; // السياسات والشروط المعتمدة للفندق
  pricingPeriods?: HotelPricingPeriod[]; // الفترات والمواسم والأسعار الخاصة بالفندق
  viewType?: string; // إطلالة الفندق (الحرم، الكعبة، المدينة)
  slug?: string;
  googleReviewUrl?: string;
  createdAt?: number;
}

export interface AdMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title?: string;
}

export interface Offer {
  id: string;
  title: string;
  shortDescription?: string;
  short_description?: string;
  fullDescription?: string;
  full_description?: string;
  mediaType?: 'image' | 'video';
  media_type?: 'image' | 'video';
  mediaUrl?: string;
  media_url?: string;
  videoUrl?: string;
  video_url?: string;
  gallery?: AdMediaItem[]; // ألبوم صور وفيديوهات إضافية للإعلان
  discountPercentage?: number;
  discount_percentage?: number;
  showDiscount?: boolean; // إظهار أو إخفاء نسبة الخصم
  show_discount?: boolean;
  endDate?: string;
  end_date?: string;
  showCountdown?: boolean; // إظهار أو إخفاء العداد التنازلي
  show_countdown?: boolean;
  showInHeroSlides?: boolean; // خيار إظهار الإعلان ضمن الشرائح الترحيبية بالرئيسية
  show_in_hero_slides?: boolean;
  isActive?: boolean; // مفتاح تفعيل/إخفاء للإعلان
  is_active?: boolean;
  badgeText?: string;
  badge_text?: string;
  hotelId?: string;
  hotel_id?: string;
  keywords?: string;
  metaDescription?: string;
  meta_description?: string;
  createdAt?: number;
  created_at?: string | number;
  updated_at?: string | number;
}

export interface HotelReview {
  id: string;
  hotelId?: string;
  hotelName?: string;
  authorName: string; // الاسم الذي أدخله العميل (إجباري)
  avatarUrl?: string; // صورة العميل الشخصية (اختياري - تظهر فقط إذا أرفقها العميل)
  rating: number; // تقييم النجوم 1 إلى 5
  comment: string; // نص التقييم ورأي العميل (إجباري)
  country?: string; // صفة أو بلد العميل
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
  subject?: string;
  message: string;
  city?: string;
  hotelInterest?: string;
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
  | 'room-booking'
  | 'invoice'
  | 'admin';

export interface FilterState {
  city: 'all' | 'مكة المكرمة' | 'المدينة المنورة';
  district: string; // 'all' or specific district name
  stars: 'all' | '3' | '4' | '5';
  maxDistance: number; // meters (e.g. 1000)
  sortBy: 'recommended' | 'closest' | 'highest-rated' | 'stars';
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

export type HeroButtonAction = 
  | ActivePage 
  | 'whatsapp' 
  | 'hotels-makkah' 
  | 'hotels-madinah' 
  | 'hotel-detail' 
  | string;

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
  primaryButtonAction?: HeroButtonAction;
  primaryButtonHotelId?: string;
  primaryButtonWhatsApp?: string;
  showSecondaryButton?: boolean;
  secondaryButtonText?: string;
  secondaryButtonAction?: HeroButtonAction;
  secondaryButtonHotelId?: string;
  secondaryButtonWhatsApp?: string;
  order: number;
  isActive: boolean;
}

export interface DepartmentContact {
  id: string;
  department: string; // e.g. "إدارة المبيعات والشركات", "قسم الحجوزات والتسكين", "قسم الحسابات والمالية"
  name: string; // e.g. "أ. أحمد هشام"
  roleTitle?: string; // e.g. "مسؤول مبيعات الشركات وحجوزات المجموعات"
  phone: string; // e.g. "+966501234567"
  whatsapp?: string; // e.g. "+966501234567"
  email?: string;
  workingHours?: string; // e.g. "على مدار الساعة 24/7"
  city?: string; // e.g. "مكة المكرمة"
  isActive: boolean;
  order: number;
}

export interface BranchContact {
  id: string;
  contactId?: string; // معرّف جهة الاتصال المرتبطة من دليل جهات الاتصال (أو فارغ للمخصص)
  label: string; // e.g. "هاتف الاستقبال" أو "الإدارة"
  labelEn?: string; // e.g. "Reception Phone" or "Management"
  value: string; // e.g. "+966501234567" or "info@..." or "https://..."
  type: 'call' | 'whatsapp' | 'email' | 'link';
  icon?: string;
  order: number;
  isActive: boolean;
  showInAbout?: boolean; // إظهار في صفحة من نحن
  showInContact?: boolean; // إظهار في صفحة تواصل معنا
  showInFooter?: boolean; // إظهار في الفوتر
  showInHotelDetail?: boolean; // إظهار في صفحات الفنادق
  showInFloating?: boolean; // إظهار في الأزرار والقنوات العائمة
}

export interface BranchLocation {
  id: string;
  name: string; // e.g. "فرع مكة المكرمة"
  nameEn?: string;
  city: string; // "مكة المكرمة"
  cityEn?: string;
  address: string; // "أبراج وقف الملك عبدالعزيز، طريق أجياد، مكة"
  addressEn?: string;
  mapUrl?: string; // "https://maps.google.com/?q=..."
  phone?: string;
  whatsapp?: string;
  email?: string;
  workingHours?: string;
  workingHoursEn?: string;
  isMainBranch?: boolean; // الفرع الرئيسي
  showContactInfo?: boolean; // إظهار معلومات وقنوات الاتصال لهذا الفرع (مفعل للرئيسي فقط افتراضياً)
  showAddress?: boolean; // إظهار أو إخفاء العنوان التفصيلي لهذا الفرع (افتراضي: true)
  showMapUrl?: boolean; // إظهار أو إخفاء رابط وزر الخريطة لهذا الفرع (افتراضي: true)
  showWorkingHours?: boolean; // إظهار أو إخفاء ساعات العمل لهذا الفرع (افتراضي: true)
  showInAboutPage?: boolean; // إظهار هذا الفرع في صفحة من نحن (افتراضي: true)
  showInContactPage?: boolean; // إظهار هذا الفرع في صفحة تواصل معنا (افتراضي: true)
  showInFooter?: boolean; // إظهار هذا الفرع في الفوتر أسفل الشاشة (افتراضي: true)
  isActive?: boolean; // تفعيل / إخفاء الفرع
  order?: number;
  contacts?: BranchContact[]; // جهات الاتصال الديناميكية التابعة للفرع
}

export interface QuickLinkItem {
  id: string;
  title: string;
  titleEn?: string;
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
  isActive?: boolean; // إظهار أو إخفاء بطاقة الميزة بالكامل
  showTitle?: boolean;
  showDescription?: boolean;
  order?: number;
}

export type ActionButtonType = 
  | 'call' 
  | 'whatsapp' 
  | 'email' 
  | 'hotel' 
  | 'page' 
  | 'url' 
  | 'map';

export type ActionButtonStyle = 
  | 'primary'      // Gold filled
  | 'secondary'    // White with gold border
  | 'whatsapp'     // Emerald green
  | 'outline'      // Stone outline
  | 'dark'         // Dark stone
  | 'glass'        // Frosted glass
  | 'gold';        // Royal Gold gradient

export type ActionButtonPosition = 
  | 'header'       // Navbar / Header CTA
  | 'hero'         // Hero section CTAs
  | 'floating'     // Floating Action Buttons (FAB)
  | 'footer'       // Footer Action / WhatsApp bar
  | 'hotel_detail' // Hotel Detail Page Sticky / Action bar
  | 'about_hq'     // About Page Office / HQ Card Action (وجهة المقر)
  | 'contact_page';// Contact Page CTAs

export type ActionButtonDevice = 'all' | 'mobile' | 'desktop';

export interface ContactDirectoryItem {
  id: string;
  name: string; // Arabic name, e.g. "هاتف الاستقبال" أو "مستشار التسكين"
  nameEn?: string; // English name, e.g. "Reception Desk" or "Housing Consultant"
  roleTag?: string; // e.g. "استقبال 24/7", "استشاري خاص", "حجوزات فورية"
  roleTagEn?: string;
  phone: string; // International phone number, e.g. "+966560580250"
  whatsapp?: string; // WhatsApp number (can differ from phone or be empty)
  email?: string; // Optional email, e.g. "info@prestigehotels.sa"
  workingHours?: string; // Optional Arabic working hours, e.g. "على مدار الساعة 24/7"
  workingHoursEn?: string; // Optional English working hours
  isActive: boolean; // Active toggle
  order: number; // Sorting order
  notes?: string; // Internal admin notes
}

export interface ActionButtonItem {
  id: string;
  label: string; // Arabic label, e.g. "تحدث مع مستشار التسكين"
  labelEn?: string; // English label, e.g. "Housing Consultant"
  icon?: string; // e.g. 'whatsapp' | 'phone' | 'mail' | 'map' | 'building' | 'calendar' | 'link' | 'star' | etc.
  style: ActionButtonStyle;
  actionType: ActionButtonType;
  contactId?: string; // Linked contact ID from ContactsDirectory, or 'custom' for custom target
  target: string; // Target value: phone number, email, URL, address/map query, hotel ID, or page name
  targetHotelId?: string; // If actionType === 'hotel'
  targetPage?: ActivePage | string; // If actionType === 'page'
  whatsappMessage?: string; // Custom prefilled WhatsApp message (Arabic)
  whatsappMessageEn?: string; // Custom prefilled WhatsApp message (English)
  order: number;
  isActive: boolean;
  pages: string[]; // ['all'] or ['home', 'hotels', 'hotel-detail', 'about', 'contact', 'room-booking', ...]
  positions: ActionButtonPosition[]; // ['floating', 'header', 'hero', 'footer', 'hotel_detail', 'about_hq', 'contact_page']
  devices: ActionButtonDevice; // 'all' | 'mobile' | 'desktop'
  badgeText?: string;
  badgeTextEn?: string;
}

export interface AboutPageSettings {
  title?: string;
  subtitle?: string;
  badge?: string;
  showBadge?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showLogoCard?: boolean;
  showLogoCardButton?: boolean; // إظهار أو إخفاء زر فتح ومعاينة الشعار
  showStorySection?: boolean;
  showStoryParagraphs?: boolean;
  missionTitle?: string;
  showMissionTitle?: boolean;
  missionText1?: string;
  missionText2?: string;
  showMissionText1?: boolean;
  showMissionText2?: boolean;
  visionTitle?: string;
  showVisionTitle?: boolean;
  visionText?: string;
  showVisionText?: boolean;
  showVisionSection?: boolean;
  yearsExperience?: string;
  servedGuests?: string;
  showStats?: boolean;
  showYearsExperience?: boolean;
  showServedGuests?: boolean;
  officeTitle?: string;
  officeCity?: string;
  officeAddress?: string;
  officeMapUrl?: string;
  officeActionType?: ActionButtonType; // نوع إجراء وجهة المقر (خريطة، اتصال، واتساب، فندق، صفحة، رابط، بريد)
  officeActionTarget?: string; // قيمة الوجهة
  officeActionHotelId?: string; // الفندق المستهدف
  officeActionPage?: ActivePage | string; // الصفحة المستهدفة
  officeActionLabel?: string; // مسمى زر وجهة المقر بالعربية
  officeActionLabelEn?: string; // مسمى زر وجهة المقر بالإنجليزية
  officeActionWhatsappMessage?: string; // رسالة الواتساب المجهزة لوجهة المقر
  officePhone?: string;
  officeWhatsApp?: string;
  officeEmail?: string;
  officeWorkingHours?: string;
  showOfficeSection?: boolean;
  showOfficeBadge?: boolean;
  showOfficeTitle?: boolean;
  showBranchSwitcher?: boolean;
  showOfficeMapButton?: boolean;
  showOfficeAddress?: boolean;
  showOfficeWorkingHours?: boolean;
  showOfficeHours?: boolean;
  showOfficePhone?: boolean;
  showOfficeWhatsApp?: boolean;
  showOfficeEmail?: boolean;
  licenseNumber?: string;
  licenseAuthority?: string;
  showLicense?: boolean;
  photos?: string[];
  mainPhoto?: string;
  showMainPhoto?: boolean;
  showPhotoAlbum?: boolean;
  showPhotoAlbumTitle?: boolean;
  showPhotoAlbumUploadButton?: boolean;
  logoUrl?: string;
  valuePillars?: ValuePillar[];
  showValuePillars?: boolean;
  showIntegratedServices?: boolean;
  showCtaSection?: boolean;
  showCtaBanner?: boolean;
  showCtaTitle?: boolean;
  showCtaSubtitle?: boolean;
  showCtaHotelsButton?: boolean; // إظهار أو إخفاء زر استعراض الفنادق في الفوتر
  showCtaConsultantButton?: boolean; // إظهار أو إخفاء زر التحدث مع مستشار التسكين
}

export type HeaderScrollBehavior = 'fixed' | 'scroll_hide' | 'static';

export interface SiteDisplaySettings {
  headerBehavior?: HeaderScrollBehavior; // fixed (always visible), scroll_hide (hide on scroll down / show on scroll up), static (scrolls away)
  showFooterAdminLink?: boolean; // إظهار أو إخفاء رابط بوابة المشرفين في الفوتر (الافتراضي: مخفي)
  introFrequency?: 'session' | 'daily' | 'always'; // تكرار عرض الإنترو: مرة لكل جلسة (الافتراضي)، مرة كل 24 ساعة، أو مع كل زيارة
  introEnabled?: boolean; // تفعيل أو إيقاف الإنترو
}

export interface FirstVisitIntroSettings {
  enabled?: boolean;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  badgeAr?: string;
  badgeEn?: string;
  logoUrl?: string;
  backgroundColor?: string;
  accentColor?: string;
  minDurationMs?: number;
  maxDurationMs?: number;
  showProgressBar?: boolean;
  showSkipButton?: boolean;
  frequency?: 'session' | 'daily' | 'once' | 'always';
  resetVersion?: number;
}

export interface IntroVideoSettings {
  enabled: boolean;
  videoUrl: string;
  posterUrl?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeText?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  overlayStyle?: 'clear' | 'subtle' | 'cinematic' | 'none'; // درجة سطوع وصفاء الفيديو وعدم طمسه بطبقة داكنة
  frequency?: 'session' | 'daily' | 'always'; // تكرار العرض: مرة واحدة لكل جلسة متصفح (الافتراضي)، مرة كل 24 ساعة، أو مع كل زيارة
  autoDismissOnEnd?: boolean; // إخفاء واختفاء الإنترو تلقائياً بعد انتهاء تشغيل الفيديو
  showBadge?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showSoundButton?: boolean;
  showSkipButton?: boolean;
  skipButtonText?: string;
  showActionButton?: boolean;
  actionButtonText?: string;
  actionButtonPage?: ActivePage | 'whatsapp';
}

export interface StoryLocationTag {
  id: string;
  text: string;
  iconName?: string;
  isActive?: boolean;
}

export interface StoryShowcasePoint {
  id: string;
  title: string;
  description: string;
  isActive?: boolean;
}

export interface StoryTeaserSettings {
  isEnabled: boolean;
  badge?: string;
  title?: string;
  showBadge?: boolean;
  showTitle?: boolean;
  showParagraphs?: boolean;
  paragraph1?: string;
  showParagraph1?: boolean;
  paragraph2?: string;
  showParagraph2?: boolean;
  paragraph3?: string;
  showParagraph3?: boolean;
  showExploreButton?: boolean;
  exploreButtonText?: string;
  showContactButton?: boolean;
  contactButtonText?: string;
  contactButtonAction?: 'whatsapp' | 'call' | 'email' | 'contact' | 'about';
  contactButtonTarget?: string;
  contactButtonWhatsappMessage?: string;
  showcaseEstablishedYear?: string;
  showcaseBadge?: string;
  showcaseTitle?: string;
  showcaseLicenseNote?: string;
  showShowcaseCard?: boolean;
  showShowcaseYear?: boolean;
  showShowcaseBadge?: boolean;
  showShowcaseTitle?: boolean;
  showShowcasePoints?: boolean;
  showShowcaseLicense?: boolean;
  locationTags?: StoryLocationTag[];
  showLocationTags?: boolean;
  showcasePoints?: StoryShowcasePoint[];
}

export interface IntegratedServiceItem {
  id: string;
  title: string;
  titleEn?: string;
  badge?: string;
  badgeEn?: string;
  description: string;
  descriptionEn?: string;
  iconName?: string;
  highlights?: string[];
  buttonText?: string;
  buttonAction?: ActivePage | 'whatsapp' | string;
  contactButtonType?: 'whatsapp' | 'phone' | 'email' | 'page';
  contactButtonTarget?: string;
  contactButtonWhatsappMessage?: string;
  showBadge?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showHighlights?: boolean;
  showButton?: boolean;
  isActive: boolean;
  order: number;
}

export interface IntegratedServicesSettings {
  isEnabled: boolean;
  badge?: string;
  title?: string;
  subtitle?: string;
  showBadge?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showCardButtons?: boolean;
  showCardHighlights?: boolean;
  services?: IntegratedServiceItem[];
}

export interface ContactSectionsSettings {
  showBadge?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showDepartments?: boolean;
  showDepartmentsTitle?: boolean;
  showDepartmentsCallButton?: boolean;
  showDepartmentsWhatsAppButton?: boolean;
  showWaBanner?: boolean;
  showWaBannerTitle?: boolean;
  showWaBannerDesc?: boolean;
  showWaBannerButton?: boolean;
  showChannels?: boolean;
  showChannelsTitle?: boolean;
  showBranches?: boolean;
  showBranchesTitle?: boolean;
  showBranchesMapButton?: boolean;
  showBranchesPhoneButton?: boolean;
  showBranchesWhatsAppButton?: boolean;
  showBranchesFooterInfo?: boolean;
  showContactForm?: boolean;
  showContactFormHeader?: boolean;
  showContactFormSubmitButton?: boolean;
}

export interface HomeSectionsSettings {
  showStats?: boolean;
  showFeaturedHotels?: boolean;
  featuredHotelsBadge?: string;
  featuredHotelsTitle?: string;
  featuredHotelsSubtitle?: string;
  showStoryTeaser?: boolean;
  showIntegratedServices?: boolean;
  showHotelsAccordion?: boolean;
  showOffersBanner?: boolean;
  showTestimonials?: boolean;
  showWhyChooseUs?: boolean;
  showAboutUsHomeSection?: boolean;
}

export interface SiteSettings {
  siteTitle: string;
  siteTitleEn?: string;
  siteSubtitle: string;
  siteSubtitleEn?: string;
  browserTabTitle?: string; // اسم وعنوان علامة التبويب في المتصفح المخصص
  logoUrl: string;
  faviconUrl?: string; // أيقونة علامة التبويب في المتصفح (Favicon)
  firstVisitIntro?: FirstVisitIntroSettings; // إعدادات شاشة الترحيب والتحميل للزيارة الأولى (First-Visit Brand Intro)
  introVideo?: IntroVideoSettings; // فيديو الإنترو الترويجي في بداية الصفحة الرئيسية
  showLicense?: boolean;
  primaryPhone?: string;
  primaryEmail?: string;
  officeWhatsApp?: string;
  headquartersAddress?: string;
  commercialRegister?: string;
  taxNumber?: string;
  tourismLicense?: string;
  channels?: ContactChannel[];
  contactsDirectory?: ContactDirectoryItem[]; // دليل جهات الاتصال المركزي الموحد
  heroSlides?: HeroSlide[];
  branches?: BranchLocation[];
  departmentContacts?: DepartmentContact[]; // أقسام ومسؤولي التواصل المتخصصة (مبيعات / حجوزات / حسابات)
  quickLinks?: QuickLinkItem[];
  aboutUs?: AboutPageSettings;
  storyTeaser?: StoryTeaserSettings; // إعدادات قسم نبذة عن الشركة والقصة
  integratedServices?: IntegratedServicesSettings; // إعدادات منظومة الخدمات المتكاملة
  homeSections?: HomeSectionsSettings; // التحكم في إظهار وإخفاء أقسام الصفحة الرئيسية
  contactSections?: ContactSectionsSettings; // التحكم في إظهار وإخفاء أقسام وبطاقات صفحة تواصل معنا
  similarHotelsBadge?: string; // الشارة العلوية لقسم الفنادق المقترحة (مثال: خيارات إضافية)
  similarHotelsTitle?: string; // عنوان قسم الفنادق المقترحة (مثال: فنادق أخرى مميزة في {city})
  bookingModule?: BookingModuleSettings; // إعدادات وحدة حجز الغرف وإدارتها
  displaySettings?: SiteDisplaySettings; // إعدادات العرض وتجربة الموقع (الهيدر، الإنترو، الفوتر)
  actionButtons?: ActionButtonItem[]; // أزرار الإجراءات والتواصل الشاملة في كافة صفحات وأقسام الموقع
  footerBio?: string;
  footerBioEn?: string;
  customerServiceTitle?: string;
  customerServiceTitleEn?: string;
  customerServiceDesc?: string;
  customerServiceDescEn?: string;
  footerWhatsAppButtonText?: string;
  footerWhatsAppButtonTextEn?: string;
  footerWhatsAppNumber?: string;
  floatingWhatsAppBubbleText?: string;
  floatingWhatsAppBubbleTextEn?: string;
  copyrightText?: string;
  copyrightTextEn?: string;
  contentVersion?: number;
  metaTitle?: string;
  metaTitleEn?: string;
  metaDescription?: string;
  metaDescriptionEn?: string;
  metaKeywords?: string;
  updatedAt?: number;
}

export interface ContentItem {
  key: string;
  text?: string;
  ar?: string;
  en?: string;
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

export * from './rbac';

export interface AdminUser {
  id: string;
  name: string;
  username?: string; // اسم المستخدم للدخول
  email: string;
  role?: UserRole | string; // 'admin' = مدير عام, 'controller' = مشرف (للتوافق القديم)
  roleIds?: string[]; // معرّفات الأدوار المخصصة الممنوحة للمستخدم
  password?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: number;
  lastLogin?: number;
}

// ==========================================
// ROOM BOOKINGS & INVENTORY TYPES (نظام الحجوزات وإدارة الغرف)
// ==========================================

export type MealPlanType = 'none' | 'breakfast' | 'half_board' | 'full_board';

export interface MealPlanOption {
  id: string;
  hotelId?: string; // اختياري لتخصيص وجبات محددة لكل فندق
  type: MealPlanType;
  name: string;
  nameEn?: string;
  price?: number; // سعر الوجبة
  pricePerPersonPerNight?: number; // للتوافق القديم
  pricingBasis?: 'per_person_per_night' | 'per_room_per_night'; // تحديد أساس التسعير (لكل فرد في الليلة أو لكل غرفة في الليلة)
  description?: string;
  isActive: boolean;
  order?: number;
}

export interface BookingRuleSet {
  id: string;
  hotelId: string;
  name: string; // مثل: قواعد الحجز الافتراضية، موسم رمضان، عطلات نهاية الأسبوع
  nameEn?: string;
  minRooms: number; // الحد الأدنى للغرف بالحجز الواحد
  maxRooms: number; // الحد الأقصى للغرف بالحجز الواحد
  minNights: number; // الحد الأدنى لعدد الليالي
  maxNights: number; // الحد الأقصى لعدد الليالي
  isDefault?: boolean; // هل هي المجموعة الافتراضية للفندق
  description?: string;
}

export interface CancellationRuleItem {
  id: string;
  daysBeforeCheckIn: number; // عدد الأيام قبل موعد الوصول
  feePercentage: number; // نسبة الغرامة (0 = مجاني، 50 = 50%، 100 = كامل المبلغ)
  descriptionAr: string; // الوصف بالعربية
  descriptionEn?: string; // الوصف بالإنجليزية
}

export interface PolicyVersionItem {
  version: number;
  updatedAt: number;
  updatedBy: string;
  summary: string;
  snapshot: any;
}

export interface HotelPolicyItem {
  id: string;
  hotelId: string;
  name: string; // اسم السياسة: السياسة المرنة، سياسة رمضان غير المستردة، السياسة القياسية
  nameEn?: string;
  isDefault?: boolean; // هل هي السياسة الافتراضية
  policyTextAr: string; // نص السياسة بالعربية
  policyTextEn?: string; // نص السياسة بالإنجليزية
  termsTextAr: string; // الشروط والأحكام بالعربية
  termsTextEn?: string; // الشروط والأحكام بالإنجليزية
  cancellationRules: CancellationRuleItem[]; // قواعد الإلغاء الهيكلية المحددة
  checkInTime?: string; // موعد تسجيل الوصول (مثلاً: 16:00 عصراً)
  checkOutTime?: string; // موعد تسجيل المغادرة (مثلاً: 12:00 ظهراً)
  version: number; // رقم إصدار السياسة والشروط (تحديث تراكمي)
  versionHistory?: PolicyVersionItem[]; // سجل الإصدارات التاريخية للسياسات
  createdAt?: number;
  updatedAt?: number;
}

export interface ClosedDateItem {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reasonAr: string;
  reasonEn?: string;
}

export interface HotelBookingRules {
  minNights: number; // الحد الأدنى لعدد الليالي
  maxNights: number; // الحد الأقصى لعدد الليالي
  minRoomsPerBooking: number; // الحد الأدنى للغرف بالحجز الواحد
  maxRoomsPerBooking: number; // الحد الأقصى للغرف بالحجز الواحد
  maxGuestsPerRoom: number; // الحد الأقصى للنزلاء في الغرفة
  closedDates: ClosedDateItem[]; // التواريخ المغلقة / أيام الصيانة والحجب
  currency: string; // العملة المستخدمة: ر.س SAR أو USD أو EUR
}

export interface HotelBookingPolicy {
  checkInTime: string; // وقت استلام الغرفة (مثلاً: 16:00 عصراً)
  checkOutTime: string; // وقت مغادرة الغرفة (مثلاً: 12:00 ظهراً)
  cancellationType: 'free_flexible' | 'moderate' | 'strict' | 'non_refundable'; // نوع سياسة الإلغاء
  cancellationNoticeDays: number; // إشعار الإلغاء قبل كم يوم للإلغاء المجاني الكامل
  childrenPolicyText: string; // سياسة الأطفال والأسرة
  extraBedPrice: number; // تكلفة السرير الإضافي لليلة
  petsAllowed: boolean; // الحيوانات الأليفة
  smokingAllowed: boolean; // التدخين
  paymentTerms: string; // شروط الدفع (الدفع عند الوصول في الفندق)
  termsAndConditionsList: string[]; // بنود وشروط الإقامة المعتمدة دولياً
  // Editable terms & policies in Arabic and English
  cancellationPolicyAr?: string; // نص سياسة الإلغاء والاسترداد بالعربية
  cancellationPolicyEn?: string; // نص سياسة الإلغاء والاسترداد بالإنجليزية
  termsAr?: string; // الشروط والأحكام بالعربية
  termsEn?: string; // الشروط والأحكام بالإنجليزية
  cancellationRules?: CancellationRuleItem[]; // قواعد الإلغاء الهيكلية المحددة
  bookingRules?: HotelBookingRules; // قواعد الحجز والحدود والتواريخ المغلقة
  version?: number; // رقم إصدار السياسة والشروط (تحديث تراكمي)
  versionHistory?: PolicyVersionItem[]; // سجل الإصدارات التاريخية للسياسات
  currency?: string; // العملة المعتمدة للفندق
  // Visibility toggles for booking options and badges
  showFreeCancellationBadge?: boolean; // إظهار أو إخفاء شارة إلغاء مجاني
  showPayAtHotelBadge?: boolean; // إظهار أو إخفاء لا يلزم الدفع المسبق
  showInstantConfirmBadge?: boolean; // إظهار أو إخفاء تأكيد فوري عبر واتساب
  showMealInclusionBadge?: boolean; // إظهار أو إخفاء باقات الوجبات والإفطار
  priceIncludesTax?: boolean; // تحديد هل السعر شامل الضريبة 15% أو غير شامل
  taxPercentage?: number; // نسبة الضريبة المطبقة (افتراضياً 15%)
}

export interface RoomPackageOption {
  id: string;
  name: string; // مثل: باقة غرفة ثنائية شاملة بوفيه الإفطار
  nameEn?: string;
  hotelId: string;
  roomId: string; // الغرفة المرتبطة بالباقة
  roomTypeId?: string; // معرف نوع الغرفة
  roomName?: string;
  mealPlanId?: string; // الوجبة المشمولة (إفطار، نصف إقامة...)
  mealPlanName?: string;
  personsCount?: number; // عدد الأشخاص المشمولين
  nights?: number; // عدد الليالي المشمولة (مثلاً: 3 ليالٍ)
  price?: number; // السعر
  totalPrice?: number; // السعر الإجمالي للباقة للتوافق
  pricePerNight?: number; // السعر المحسوب لليلة
  priceBasis?: 'per_night' | 'total_stay'; // تحديد أساس السعر (لليلة الواحدة أو لكامل الإقامة)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  priceIncludesTax?: boolean; // هل السعر شامل الضريبة
  badgeText?: string; // شارة مميزة مثل: "عرض خاص" أو "الأكثر طلباً"
  features?: string[]; // مميزات إضافية للباقة
  isActive: boolean;
  availableRoomsCount?: number; // عدد الغرف أو الباقات المتاحة للحجز أونلاين (مستودع المخزون)
}

export interface HotelPricingPeriod {
  id: string;
  hotelId: string;
  name: string; // مثل: موسم رمضان المبارك، موسم الحج، نهاية الأسبوع، إجازة المدارس
  nameEn?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  roomTypeId: string; // معرف فئة الغرفة المرتبطة ('all' لجميع الغرف أو معرف محدد)
  roomTypeName?: string;
  roomTypeIds?: string[]; // قائمة معرفات الغرف المحددة
  availableRooms: number; // إجمالي عدد الغرف المتاحة للحجز أونلاين يومياً (المخزون)
  roomDistribution?: Record<string, number>; // توزيع الغرف المتاحة لكل نوع غرفة { [roomTypeId]: count }
  roomOnlyPrice: number; // سعر الغرفة "إقامة فقط بدون وجبات"
  breakfastPrice?: number;
  halfBoardPrice?: number;
  fullBoardPrice?: number;
  extraWithMeal?: number; // السعر الإضافي عند شمول الوجبات (اختياري)
  extraWithoutMeal?: number; // السعر الإضافي بدون وجبات
  ruleSetId?: string; // معرف مجموعة قواعد الحجز المرتبطة
  policyId?: string; // معرف السياسة والشروط المرتبطة
  isAvailable?: boolean; // هل متاح للبيع في هذه الفترة (إيقاف/فتح البيع)
  isActive: boolean; // تفعيل/تعطيل الفترة
  isDefault?: boolean;
  minStayNights?: number; // الحد الأدنى لعدد الليالي
}

export interface RoomSeasonPeriod {
  id: string;
  name: string; // مثل: موسم رمضان المبارك، موسم الحج، نهاية الأسبوع، إجازة المدارس
  nameEn?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  pricePerNight: number; // السعر المخصص لليلة في هذه الفترة
  extraBedPrice?: number; // تكلفة السرير الإضافي في هذا الموسم
  extraPersonPrice?: number; // تكلفة الشخص الإضافي في هذا الموسم
  minStayNights?: number; // الحد الأدنى لعدد الليالي
  isAvailable: boolean; // هل متاح للحجز في هذه الفترة
  priceIncludesTax?: boolean; // هل السعر شامل الضريبة
  availableRoomsCount?: number; // عدد الغرف المتاحة للحجز أونلاين خلال هذه الفترة (مستودع المخزون)
  ruleSetId?: string;
  policyId?: string;
}

export type RoomStatus = 'available' | 'booked' | 'maintenance';

export interface RoomTypeItem {
  id: string;
  hotelId: string;
  name: string; // اسم فئة الغرفة (مفردة، ثنائية، ثلاثية، رباعية...)
  nameEn?: string;
  bedsCount?: number; // عدد الأسرة
  description?: string; // الوصف بالعربية
  descriptionEn?: string; // الوصف بالإنجليزية
  category?: 'جناح ملكي' | 'جناح تنفيذي' | 'غرفة ديلوكس' | 'غرفة عائلية' | 'غرفة ثلاثية' | 'غرفة ثنائية' | 'غرفة مفردة' | string;
  basePrice?: number; // السعر الأساسي لليلة الواحدة (للتوافق القديم)
  extraBedPrice?: number; // تكلفة السرير الإضافي للغرفة
  extraPersonPrice?: number; // تكلفة الفرد الإضافي للغرفة
  priceIncludesTax?: boolean; // هل السعر شامل ضريبة القيمة المضافة (15%) أو غير شامل
  totalRooms?: number; // العدد الإجمالي للغرف
  availableRooms?: number; // العدد المتاح للحجز حالياً
  maxGuests?: number; // السعة القصوى للنزلاء
  bedType?: string; // نوع السرير: سرير كينج، سريرين منفصلين...
  roomSize?: string; // المساحة م2
  features?: string[]; // مميزات الغرفة: إطلالة على الحرم، واي فاي، ميني بار...
  images: string[]; // صور الغرفة المتعددة
  keyPrefix?: string; // بادئة المفتاح الرقمي للغرفة مثلاً (KEY- أو RM-)
  status?: RoomStatus; // متاح، محجوز، صيانة
  seasonPeriods?: RoomSeasonPeriod[]; // جدول الفترات والمواسم والأسعار الخاصة
  pricingPeriods?: HotelPricingPeriod[];
  packages?: RoomPackageOption[]; // باقات العروض الخاصة المرتبطة بالغرفة
  services?: string[]; // الخدمات المتاحة
  mealOptions?: string[]; // خيارات الوجبات المرتبطة
  mealPlanIds?: string[]; // معرفات الوجبات المرتبطة بالغرفة
  showFreeCancellation?: boolean; // إمكانية تخصيص شارة الإلغاء للغرفة
  showPayAtHotel?: boolean; // إمكانية تخصيص شارة الدفع عند الوصول
  isActive: boolean; // إظهار أو إخفاء الغرفة
  order?: number;
}

export type BookingStatus = 
  | 'pending_confirmation' 
  | 'pending' 
  | 'confirmed' 
  | 'checked_in' 
  | 'completed' 
  | 'cancelled';

export interface BookingNightlyRateItem {
  date: string;
  rate: number;
  seasonName?: string;
}

export interface BookingPriceBreakdown {
  nights: number;
  nightlyRates: BookingNightlyRateItem[];
  roomsCost: number;
  mealPricePerPerson: number;
  mealsCost: number;
  extraCharges?: number;
  taxes: number;
  isTaxIncluded: boolean;
  totalAmount: number;
  currency: string;
}

export interface BookingPolicySnapshot {
  version?: number;
  checkInTime: string;
  checkOutTime: string;
  cancellationType: string;
  cancellationNoticeDays: number;
  cancellationPolicyAr?: string;
  cancellationPolicyEn?: string;
  termsAr?: string;
  termsEn?: string;
  paymentTerms?: string;
  currency?: string;
  cancellationRules?: CancellationRuleItem[];
}

export interface RoomBooking {
  id: string;
  token?: string; // رمز وصول طويل عشوائي غير قابل للتخمين للوصول الآمن للفاتورة وحماية الخصوصية
  bookingCode: string; // كود الحجز المرجعي مثل PR-2026-000123
  digitalKey: string; // كود المفتاح الرقمي للغرفة مثل KEY-304
  confirmationCode?: string; // كود تأكيد قصير مكون من 4 أرقام عبر الواتساب (مثال: 4892)
  invoiceNumber?: string; // رقم الفاتورة المعتمدة (مثال: INV-2026-004892)
  idempotencyKey?: string; // مفتاح عدم تكرار العملية لمنع تكرار الحجوزات عند الضغط المزدوج أو إعادة المحاولة
  hotelId: string;
  hotelName: string;
  hotelCity?: string;
  roomId: string;
  roomName: string;
  guestName: string;
  guestPhone: string; // رقم الواتساب بالصيغة الدولية المعتمدة
  guestEmail: string; // البريد الإلكتروني الإلزامي
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  roomsCount: number;
  adults: number;
  children: number;
  mealPlanId: string;
  mealPlanName: string;
  mealPlanPrice: number;
  roomPricePerNight: number;
  totalAmount: number;
  specialRequests?: string;
  status: BookingStatus;
  createdAt: number;
  adminNotes?: string;
  assignedRoomNumber?: string; // رقم الغرفة الفعلي المعين
  packageId?: string; // معرف الباقة المحجوزة إن وجد
  packageName?: string; // اسم الباقة
  policySnapshot?: BookingPolicySnapshot; // لقطة ثابتة من السياسة والشروط وقت الحجز
  priceBreakdown?: BookingPriceBreakdown; // تفاصيل التسعير لكل ليلة والمواسم
  consentAgreed?: boolean; // الموافقة على الشروط والسياسة وتلقي الإشعارات
  emailStatus?: 'queued' | 'sent' | 'failed'; // حالة إرسال البريد الإلكتروني عبر Apps Script
  emailDeliveryStatus?: 'delivered' | 'failed' | 'pending' | 'queued' | 'sent';
  emailError?: string; // سبب فشل إرسال البريد
  whatsappDeliveryStatus?: 'delivered' | 'failed' | 'pending'; // حالة إرسال إشعار الواتساب
  whatsappDeliveryError?: string; // سبب فشل إرسال الواتساب إن وجد
  emailDeliveryError?: string; // سبب فشل إرسال البريد إن وجد

  // تفضيلات الإقامة والتسكين السريع (VIP Guest Preferences & Express Check-in)
  preferredView?: 'haram' | 'city' | 'panoramic' | 'quiet' | 'any'; // تفضيل الإطلالة
  preferredFloor?: 'high' | 'mid' | 'low' | 'any'; // تفضيل الطابق
  expressCheckInOptIn?: boolean; // تفعيل خدمة التسكين السريع عند الوصول
  
  // حجز المجموعات وحملات العمرة (Group & Bus Tours)
  isGroupBooking?: boolean; // هل الحجز لمجموعة أو حملة
  companyOrGroupName?: string; // اسم الشركة أو الحملة أو العائلة الكبيرة
  groupLeaderName?: string; // اسم قائد الحملة أو مسؤول المجموعة
  groupLeaderPhone?: string; // هاتف قائد المجموعة
  busCount?: number; // عدد الباصات أو الحافلات
  roomingList?: string; // قائمة أسماء النزلاء وتوزيع الغرف (Rooming List)
  groupRoomsBreakdown?: Array<{
    roomId: string;
    roomName: string;
    roomsCount: number;
    adultsPerRoom?: number;
    pricePerNight?: number;
    totalAmount?: number;
  }>;
}

export interface BookingModuleSettings {
  enabled: boolean; // إظهار أو إخفاء نظام الحجوزات بالكامل
  allowPublicBookingCreation?: boolean; // السماح بإنشاء حجوزات جديدة من الموقع (عند التعطيل يصبح النظام إدارة ومتابعة فقط)
  mode?: 'full' | 'manage_only'; // نمط النظام: كامل (إنشاء وإدارة) أو إدارة ومتابعة فقط
  showInHeader?: boolean; // إظهار زر "حجز غرفة" في القائمة العلوية
  showTrackBookingModal?: boolean; // إظهار زر "متابعة الحجز" للنزيل
  showInHero?: boolean; // إظهار شريط الحجز السريع في الصفحة الرئيسية
  showInHotelDetail?: boolean; // إظهار نظام حجز الغرف في تفاصيل الفندق
  bookingEmail?: string; // بريد إلكتروني لاستقبال الحجوزات
  bookingWhatsApp?: string; // رقم واتساب لاستقبال تفاصيل الحجز
  companyWhatsApp?: string; // رقم واتساب الشركة الرسمي لاستقبال تأكيد الحجوزات من النزلاء
  staffContactNumbers?: string[]; // أرقام هواتف موظفي الحجوزات للاستفسارات السريعة
  whatsappMessageTemplateAr?: string; // قالب رسالة تأكيد العميل عبر واتساب (عربي)
  whatsappMessageTemplateEn?: string; // قالب رسالة تأكيد العميل عبر واتساب (إنجليزي)
  whatsappStaffConfirmationTemplateAr?: string; // قالب رسالة اعتماد الحجز المرسلة للعميل (عربي)
  whatsappStaffConfirmationTemplateEn?: string; // قالب رسالة اعتماد الحجز المرسلة للعميل (إنجليزي)
  companyEmail?: string; // البريد الإلكتروني الرسمي لشركة برستيج
  appsScriptUrl?: string; // رابط تطبيق Google Apps Script Web App لإرسال البريد مجاناً
  appsScriptSecret?: string; // المفتاح السري المشترك لحماية Apps Script
  pendingExpiryHours?: number; // مهلة صلاحية الحجز غير المؤكد بالساعات قبل إيقاف حجز الغرف بالمخزون (الافتراضي 24 ساعة)
  enableEmailSending?: boolean; // تفعيل أو إيقاف إرسال إشعارات البريد الإلكتروني
  enableWhatsAppRedirect?: boolean; // فتح واتساب مباشرة للعميل بعد الحجز
  enableEmailNotification?: boolean; // إشعار البريد الإلكتروني
  autoAssignDigitalKey?: boolean; // توليد مفتاح إلكتروني فوري تلقائياً
  currency?: string; // العملة الافتراضية (ر.س / USD)

  // إعدادات وتخصيص فواتير وسندات الحجز المعتمدة (Invoice & Voucher Customization)
  invoiceCompanyName?: string; // اسم الشركة الرسمي بالفاتورة
  invoiceCompanySubtitle?: string; // الوصف الرسمي أسفل اسم الشركة
  invoiceCompanyAddress?: string; // عنوان ومقر الشركة بالفاتورة
  invoiceCrNumber?: string; // رقم السجل التجاري (س.ت)
  showInvoiceCr?: boolean; // إظهار أو إخفاء السجل التجاري
  invoiceTaxNumber?: string; // الرقم الضريبي (VAT)
  showInvoiceTaxNo?: boolean; // إظهار أو إخفاء الرقم الضريبي
  invoiceSupportTitle?: string; // عنوان جهة التواصل أسفل الفاتورة
  invoiceSupportName?: string; // اسم مسؤول التواصل أو القسم بأسفل الفاتورة
  invoiceSupportPhone?: string; // رقم هاتف التواصل بأسفل الفاتورة
  invoiceSupportEmail?: string; // البريد الإلكتروني بأسفل الفاتورة
  showInvoiceSupportFooter?: boolean; // إظهار أو إخفاء معلومات التواصل أسفل الفاتورة
}
