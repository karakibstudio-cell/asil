import { 
  ContactChannel, 
  HeroSlide, 
  BranchLocation, 
  DepartmentContact, 
  QuickLinkItem, 
  AboutPageSettings, 
  StoryTeaserSettings, 
  IntegratedServicesSettings, 
  HomeSectionsSettings,
  SiteSettings
} from '../types';
import { DEFAULT_ACTION_BUTTONS, DEFAULT_CONTACTS_DIRECTORY } from '../utils/actionButtons';
import { DEFAULT_VALUE_PILLARS } from './aboutPillars';

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide_1791476463388',
    badge: '',
    order: 0,
    title: 'برستيج عنوان الفخامه الفندقيه',
    imageUrl: '/images/slides/slide_0.webp',
    isActive: true,
    subtitle: '',
    videoUrl: '',
    mediaType: 'image',
    showBadge: false,
    showTitle: true,
    showSubtitle: false,
    videoThumbnail: '',
    primaryButtonText: 'فنادقنا',
    showPrimaryButton: true,
    primaryButtonAction: 'hotels',
    secondaryButtonText: 'تواصل معنا',
    showSecondaryButton: false,
    secondaryButtonAction: 'contact'
  },
  {
    id: 'slide_1790707591582',
    badge: 'الضيافة الملكية المميزة',
    order: 1,
    title: 'احجز الفنادق اللي تناسبك ',
    imageUrl: '/images/slides/slide_1.webp',
    isActive: true,
    subtitle: 'فنادق مكه والمدينه المنوره واختار المناسب ',
    videoUrl: '',
    mediaType: 'image',
    showBadge: true,
    showTitle: true,
    showSubtitle: true,
    videoThumbnail: '',
    primaryButtonText: 'استعرض الفنادق المتاحة',
    showPrimaryButton: true,
    primaryButtonAction: 'hotels',
    secondaryButtonText: 'تواصل معنا',
    showSecondaryButton: true,
    secondaryButtonAction: 'contact'
  }
];

export const DEFAULT_CHANNELS: ContactChannel[] = [
  {
    id: 'ch_whatsapp',
    type: 'whatsapp',
    title: 'واتساب إدارة وحجوزات برستيج',
    value: '+966560580250',
    isActive: true,
    order: 0,
  },
  {
    id: 'ch_phone',
    type: 'phone',
    title: 'رقم الهاتف المباشر',
    value: '+966560580250',
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
    nameEn: 'Makkah Branch (HQ)',
    city: 'مكة المكرمة',
    cityEn: 'Makkah',
    address: 'أبراج وقف الملك عبدالعزيز (الصفوة)، شارع أجياد، المنطقة المركزية، مكة المكرمة',
    addressEn: 'King Abdulaziz Endowment Towers (Al Safwah), Ajyad St, Central Area, Makkah',
    mapUrl: 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah',
    phone: '+966560580250',
    whatsapp: '+966560580250',
    email: 'prestigeksa.umrah@gmail.com',
    workingHours: 'على مدار الساعة 24/7',
    workingHoursEn: '24/7 Around the Clock',
    isMainBranch: true,
    showContactInfo: true,
    isActive: true,
    order: 1,
    contacts: [
      {
        id: 'cnt_mk_1',
        label: 'استقبال الفندق والتسكين',
        labelEn: 'Hotel Reception & Housing',
        value: '+966560580250',
        type: 'call',
        order: 1,
        isActive: true,
        showInAbout: true,
        showInContact: true,
        showInFooter: true,
        showInHotelDetail: true,
        showInFloating: false
      },
      {
        id: 'cnt_mk_2',
        label: 'واتساب الحجوزات المباشرة',
        labelEn: 'Direct Bookings WhatsApp',
        value: '+966560580250',
        type: 'whatsapp',
        order: 2,
        isActive: true,
        showInAbout: true,
        showInContact: true,
        showInFooter: true,
        showInHotelDetail: true,
        showInFloating: false
      },
      {
        id: 'cnt_mk_3',
        label: 'البريد الإلكتروني للإدارة',
        labelEn: 'HQ Official Email',
        value: 'prestigeksa.umrah@gmail.com',
        type: 'email',
        order: 3,
        isActive: true,
        showInAbout: true,
        showInContact: true,
        showInFooter: true,
        showInHotelDetail: true,
        showInFloating: false
      }
    ]
  },
  {
    id: 'branch_madinah',
    name: 'فرع المدينة المنورة',
    nameEn: 'Madinah Branch',
    city: 'المدينة المنورة',
    cityEn: 'Madinah',
    address: 'المنطقة المركزية الشمالية، أمام بوابة الملك فهد، طريق الملك فهد، المدينة المنورة',
    addressEn: 'Northern Central Area, Facing King Fahd Gate, Madinah',
    mapUrl: 'https://maps.google.com/?q=Northern+Central+Area+Madinah',
    phone: '+966501234568',
    whatsapp: '+966501234568',
    email: 'madinah@prestigehotels.sa',
    workingHours: 'على مدار الساعة 24/7',
    workingHoursEn: '24/7 Around the Clock',
    isMainBranch: false,
    showContactInfo: false,
    isActive: true,
    order: 2,
    contacts: [
      {
        id: 'cnt_md_1',
        label: 'هاتف الاستقبال والاستفسارات',
        labelEn: 'Inquiries & Reception Phone',
        value: '+966501234568',
        type: 'call',
        order: 1,
        isActive: true,
        showInAbout: true,
        showInContact: true,
        showInFooter: true,
        showInHotelDetail: true,
        showInFloating: false
      },
      {
        id: 'cnt_md_2',
        label: 'واتساب التسكين بالمدينة',
        labelEn: 'Madinah Housing WhatsApp',
        value: '+966501234568',
        type: 'whatsapp',
        order: 2,
        isActive: true,
        showInAbout: true,
        showInContact: true,
        showInFooter: true,
        showInHotelDetail: true,
        showInFloating: false
      }
    ]
  }
];

export const DEFAULT_DEPARTMENT_CONTACTS: DepartmentContact[] = [
  {
    id: 'dept_sales',
    department: 'إدارة المبيعات والشركات',
    name: 'فريق المبيعات والتعاقدات',
    roleTitle: 'مسؤول مبيعات الشركات وحجوزات المجموعات',
    phone: '+966560580250',
    whatsapp: '+966560580250',
    workingHours: 'متاح 24/7 طوال أيام الأسبوع',
    isActive: true,
    order: 1
  },
  {
    id: 'dept_bookings',
    department: 'قسم الحجوزات والتسكين',
    name: 'استشاري التسكين المباشر',
    roleTitle: 'مسؤول تأكيد الغرف والأجنحة الفندقية',
    phone: '+966560580250',
    whatsapp: '+966560580250',
    workingHours: 'على مدار الساعة 24/7',
    isActive: true,
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
    id: 'link_about',
    title: 'من نحن',
    targetPage: 'about',
    isActive: true,
    order: 6,
  },
  {
    id: 'link_contact',
    title: 'تواصل معنا',
    targetPage: 'contact',
    isActive: true,
    order: 7,
  }
];

export const DEFAULT_ABOUT_US: AboutPageSettings = {
  title: 'برستيج.. حيث تلتقي فخامة الضيافة بروحانية المكان',
  subtitle: 'منذ عام 2010، انطلقت "برستيج لإدارة وتشغيل الفنادق" من قلب العاصمة المقدسة لتُعيد صياغة مفهوم الضيافة وخدمة ضيوف الرحمن.',
  badge: 'شرف خدمة ضيوف الرحمن',
  missionTitle: 'مسيرتنا: صناعة تجارب إقامة استثنائية وشراكات استراتيجية',
  missionText1: 'منذ عام 2010، انطلقت "برستيج لإدارة وتشغيل الفنادق" من قلب العاصمة المقدسة لتُعيد صياغة مفهوم الضيافة وخدمة ضيوف الرحمن. لم نكتفِ يوماً بتقديم مجرد غرف فندقية، بل أخذنا على عاتقنا صناعة تجارب إقامة استثنائية تمزج بين الرفاهية والراحة التامة.',
  missionText2: 'بفضل الله ثم بثقة عملائنا من الشركات والمجموعات، امتدت مسيرة نجاحنا من مكة المكرمة إلى رحاب المدينة المنورة، لنعقد أضخم الشراكات السنوية في أهم المواقع الاستراتيجية (محبس الجن، أجياد، والمسفلة). واليوم، نتوج هذه المسيرة بفندقنا الخاص "برستيج أجياد"، إلى جانب إدارتنا وتشغيلنا لأكثر من 7 فنادق راقية ومجهزة بالكامل لاستقبال الحجاج والمعتمرين.',
  visionTitle: 'رؤيتنا: الريادة في إدارة وتشغيل الفنادق والضيافة الروحانية',
  visionText: 'أن نكون الخيار الأول والأكثر ثقة للمستثمرين وضيوف الرحمن ووكالات العمرة عالمياً من خلال تقديم أرقى معايير الإدارة والتشغيل الفندقي.',
  yearsExperience: '١٥+ عاماً',
  servedGuests: '١٢٠,٠٠٠+',
  officeTitle: 'المقر الرئيسي لشركة برستيج لإدارة وتشغيل الفنادق',
  officeCity: 'مكة المكرمة',
  officeAddress: 'أبراج وقف الملك عبدالعزيز - مجمع أبراج البيت، طريق أجياد، مكة المكرمة',
  officeMapUrl: 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah',
  officePhone: '+966560580250',
  officeWhatsApp: '+966560580250',
  officeEmail: 'prestigeksa.umrah@gmail.com',
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
  siteTitleEn: 'Prestige Hotels Management & Hospitality',
  siteSubtitle: 'إدارة وتشغيل الفنادق والضيافة الفاخرة بمكة المكرمة والمدينة المنورة',
  siteSubtitleEn: 'Hotel Management, Operations & Luxury Hospitality',
  logoUrl: '/images/brand/logo.png',
  showLicense: true,
  channels: DEFAULT_CHANNELS,
  contactsDirectory: DEFAULT_CONTACTS_DIRECTORY,
  heroSlides: DEFAULT_HERO_SLIDES,
  branches: DEFAULT_BRANCHES,
  departmentContacts: DEFAULT_DEPARTMENT_CONTACTS,
  quickLinks: DEFAULT_QUICK_LINKS,
  aboutUs: DEFAULT_ABOUT_US,
  storyTeaser: DEFAULT_STORY_TEASER,
  integratedServices: DEFAULT_INTEGRATED_SERVICES,
  homeSections: DEFAULT_HOME_SECTIONS,
  actionButtons: DEFAULT_ACTION_BUTTONS,
  introVideo: {
    enabled: true,
    videoUrl: 'https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/videos/1790863653287_7c96er.mp4',
    posterUrl: '/images/slides/slide_0.webp',
    loop: false,
    muted: true,
    autoPlay: true,
    frequency: 'always',
    showTitle: true,
    overlayStyle: 'cinematic',
    showSkipButton: true,
    skipButtonText: 'الانتقال للشرائح الترحيبية',
    showSoundButton: true
  },
  displaySettings: {
    introEnabled: true,
    headerBehavior: 'fixed',
    introFrequency: 'always',
    showFooterAdminLink: false
  },
  footerBio: 'شركة برستيج الرائدة والمتخصصة في تقديم حلول إدارة وتشغيل الفنادق والتسكين الفاخر لحجاج بيت الله الحرام وزوار المسجد النبوي الشريف في مكة المكرمة والمدينة المنورة، بخبرة تمتد لأكثر من ١٥ عاماً من التميز والاحترافية.',
  footerBioEn: 'Leading company dedicated to providing hotel management, operations, and luxury accommodation solutions for pilgrims and visitors to the Two Holy Mosques, with over 15 years of excellence.',
  customerServiceTitle: 'خدمة العملاء والتواصل المباشر',
  customerServiceTitleEn: 'Customer Service & Direct Contact',
  customerServiceDesc: 'فريق الاستقبال والحجوزات متاح على مدار الساعة طوال أيام الأسبوع لخدمتكم واستقبال استفساراتكم.',
  customerServiceDescEn: 'Our reception and booking team is available 24/7 to assist you and receive all inquiries.',
  footerWhatsAppButtonText: 'تحدث مع مستشار التسكين واتساب',
  footerWhatsAppButtonTextEn: 'Chat with Accommodation Consultant',
  footerWhatsAppNumber: '+966560580250',
  floatingWhatsAppBubbleText: 'تواصل مباشرة عبر واتساب',
  floatingWhatsAppBubbleTextEn: 'Chat on WhatsApp',
  copyrightText: 'لإدارة وتشغيل الفنادق والضيافة. جميع الحقوق محفوظة.',
  copyrightTextEn: 'Hotel Management & Operations. All rights reserved.',
  bookingModule: {
    enabled: true,
    allowPublicBookingCreation: true,
    showInHeader: true,
    showInHero: true,
    showInHotelDetail: true
  }
};
