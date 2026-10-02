export type HotelCategory = 'فنادق سنوية' | 'فنادق العمرة' | 'فنادق رمضان' | 'عادي';

export const ALL_HOTEL_CATEGORIES: HotelCategory[] = [
  'فنادق سنوية',
  'فنادق العمرة',
  'فنادق رمضان',
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
    viewType: 'إطلالة مباشرة على الكعبة' | 'إطلالة على ساحات الحرم' | 'إطلالة على المدينة' | 'قريب جداً من الحرم';
    order?: number;
    isActive?: boolean;
    metaDescription?: string;
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
  onlineBookingEnabled?: boolean; // تحديد إتاحة الفندق للحجز أونلاين
  bookingPolicy?: HotelBookingPolicy; // سياسات وشروط الفندق العالمية
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
  shortDescription: string;
  fullDescription: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  videoUrl?: string;
  gallery?: AdMediaItem[]; // ألبوم صور وفيديوهات إضافية للإعلان
  discountPercentage?: number;
  showDiscount?: boolean; // إظهار أو إخفاء نسبة الخصم
  endDate?: string;
  showCountdown?: boolean; // إظهار أو إخفاء العداد التنازلي
  showInHeroSlides?: boolean; // خيار إظهار الإعلان ضمن الشرائح الترحيبية بالرئيسية
  isActive: boolean; // مفتاح تفعيل/إخفاء للإعلان
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

export interface BranchLocation {
  id: string;
  name: string; // e.g. "فرع مكة المكرمة"
  city: string; // "مكة المكرمة"
  address: string; // "أبراج وقف الملك عبدالعزيز، طريق أجياد، مكة"
  mapUrl: string; // "https://maps.google.com/?q=..."
  phone?: string;
  whatsapp?: string;
  email?: string;
  workingHours?: string;
  isMainBranch?: boolean; // الفرع الرئيسي
  isActive?: boolean; // تفعيل / إخفاء الفرع
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
  isActive?: boolean; // إظهار أو إخفاء بطاقة الميزة بالكامل
  showTitle?: boolean;
  showDescription?: boolean;
  order?: number;
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
  siteSubtitle: string;
  browserTabTitle?: string; // اسم وعنوان علامة التبويب في المتصفح المخصص
  logoUrl: string;
  faviconUrl?: string; // أيقونة علامة التبويب في المتصفح (Favicon)
  introVideo?: IntroVideoSettings; // فيديو الإنترو الترويجي في بداية الصفحة الرئيسية
  showLicense?: boolean;
  channels?: ContactChannel[];
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
  metaDescription?: string;
  metaKeywords?: string;
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

// ==========================================
// ROOM BOOKINGS & INVENTORY TYPES (نظام الحجوزات وإدارة الغرف)
// ==========================================

export type MealPlanType = 'none' | 'breakfast' | 'half_board' | 'full_board';

export interface MealPlanOption {
  id: string;
  type: MealPlanType;
  name: string;
  nameEn: string;
  pricePerPersonPerNight: number;
  description: string;
  isActive: boolean;
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
  roomName?: string;
  mealPlanId?: string; // الوجبة المشمولة (إفطار، نصف إقامة...)
  mealPlanName?: string;
  nights: number; // عدد الليالي المشمولة (مثلاً: 3 ليالٍ)
  totalPrice: number; // السعر الإجمالي للباقة
  pricePerNight?: number; // السعر المحسوب لليلة
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  priceIncludesTax?: boolean; // هل السعر شامل الضريبة
  badgeText?: string; // شارة مميزة مثل: "عرض خاص" أو "الأكثر طلباً"
  features?: string[]; // مميزات إضافية للباقة
  isActive: boolean;
}

export interface RoomSeasonPeriod {
  id: string;
  name: string; // مثل: موسم رمضان المبارك، موسم الحج، نهاية الأسبوع، إجازة المدارس
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  pricePerNight: number; // السعر المخصص لليلة في هذه الفترة
  minStayNights?: number; // الحد الأدنى لعدد الليالي
  isAvailable: boolean; // هل متاح للحجز في هذه الفترة
  priceIncludesTax?: boolean; // هل السعر شامل الضريبة
}

export type RoomStatus = 'available' | 'booked' | 'maintenance';

export interface RoomTypeItem {
  id: string;
  hotelId: string;
  name: string;
  nameEn?: string;
  category: 'جناح ملكي' | 'جناح تنفيذي' | 'غرفة ديلوكس' | 'غرفة عائلية' | 'غرفة ثلاثية' | 'غرفة ثنائية' | 'غرفة مفردة';
  basePrice: number; // السعر الأساسي لليلة الواحدة
  priceIncludesTax?: boolean; // هل السعر شامل ضريبة القيمة المضافة (15%) أو غير شامل
  totalRooms: number; // العدد الإجمالي للغرف
  availableRooms: number; // العدد المتاح للحجز حالياً
  maxGuests: number; // السعة القصوى للنزلاء
  bedType: string; // نوع السرير: سرير كينج، سريرين منفصلين...
  roomSize: string; // المساحة م2
  features: string[]; // مميزات الغرفة: إطلالة على الحرم، واي فاي، ميني بار...
  images: string[];
  keyPrefix?: string; // بادئة المفتاح الرقمي للغرفة مثلاً (KEY- أو RM-)
  status: RoomStatus; // متاح، محجوز، صيانة
  seasonPeriods?: RoomSeasonPeriod[]; // جدول الفترات والمواسم والأسعار الخاصة
  packages?: RoomPackageOption[]; // باقات العروض الخاصة المرتبطة بالغرفة
  services?: string[]; // الخدمات المتاحة
  mealOptions?: string[]; // خيارات الوجبات المرتبطة
  showFreeCancellation?: boolean; // إمكانية تخصيص شارة الإلغاء للغرفة
  showPayAtHotel?: boolean; // إمكانية تخصيص شارة الدفع عند الوصول
  isActive: boolean;
  order?: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';

export interface RoomBooking {
  id: string;
  bookingCode: string; // كود الحجز مثل PRS-8492
  digitalKey: string; // كود المفتاح الرقمي للغرفة مثل KEY-304
  hotelId: string;
  hotelName: string;
  hotelCity?: string;
  roomId: string;
  roomName: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
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
}

export interface BookingModuleSettings {
  enabled: boolean; // إظهار أو إخفاء نظام الحجوزات بالكامل
  allowPublicBookingCreation?: boolean; // السماح بإنشاء حجوزات جديدة من الموقع (عند التعطيل يصبح النظام إدارة ومتابعة فقط)
  mode?: 'full' | 'manage_only'; // نمط النظام: كامل (إنشاء وإدارة) أو إدارة ومتابعة فقط
  showInHeader: boolean; // إظهار زر "حجز غرفة" في القائمة العلوية
  showTrackBookingModal: boolean; // إظهار زر "متابعة الحجز" للنزيل
  showInHero: boolean; // إظهار شريط الحجز السريع في الصفحة الرئيسية
  showInHotelDetail: boolean; // إظهار نظام حجز الغرف في تفاصيل الفندق
  bookingEmail?: string; // بريد إلكتروني لاستقبال الحجوزات
  bookingWhatsApp?: string; // رقم واتساب لاستقبال تفاصيل الحجز
  enableWhatsAppRedirect: boolean; // فتح واتساب مباشرة للعميل بعد الحجز
  enableEmailNotification: boolean; // إشعار البريد الإلكتروني
  autoAssignDigitalKey: boolean; // توليد مفتاح إلكتروني فوري تلقائياً
  currency?: string; // العملة الافتراضية (ر.س / USD)
}
