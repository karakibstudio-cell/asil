// Instant Initial Data Seed (0ms Load Time - Zero Latency for New Clients)
import { Hotel, Offer, HotelReview, SiteSettings } from '../types';

export const INITIAL_HOTELS: Hotel[] = [
  {
    "id": "hotel_test_1790703048618",
    "name": "برستيج اجياد",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "أجياد",
    "stars": 4,
    "distanceToHaram": 450,
    "distanceText": "450 متراً عن ساحة الحرم",
    "walkingTimeMinutes": 7,
    "featured": true,
    "isActive": true,
    "order": 1,
    "categories": [
      "فنادق العمرة",
      "فنادق سنوية",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 5,
    "reviewCount": 1,
    "mainImage": "/images/hotels/hotel_test_1790703048618_main.png",
    "galleryImages": [
      {
        "url": "/images/hotels/hotel_test_1790703048618_gallery_0.webp",
        "title": "",
        "category": "lobby"
      },
      {
        "url": "/images/hotels/hotel_test_1790703048618_gallery_1.webp",
        "title": "",
        "category": "facilities"
      },
      {
        "url": "/images/hotels/hotel_test_1790703048618_gallery_2.webp",
        "title": "",
        "category": "rooms"
      },
      {
        "url": "/images/hotels/hotel_test_1790703048618_gallery_3.webp",
        "title": "",
        "category": "views"
      },
      {
        "url": "/images/hotels/hotel_test_1790703048618_gallery_4.webp",
        "title": "",
        "category": "dining"
      },
      {
        "url": "/images/hotels/hotel_test_1790703048618_gallery_5.webp",
        "title": "",
        "category": "facilities"
      },
      {
        "url": "/images/hotels/hotel_test_1790703048618_gallery_6.webp",
        "title": "",
        "category": "rooms"
      },
      {
        "url": "/images/hotels/hotel_test_1790703048618_gallery_7.webp",
        "title": "",
        "category": "rooms"
      },
      {
        "url": "/images/hotels/hotel_test_1790703048618_gallery_8.webp",
        "title": "",
        "category": "rooms"
      },
      {
        "url": "/images/hotels/hotel_test_1790703048618_gallery_9.webp",
        "title": "",
        "category": "facilities"
      },
      {
        "url": "/images/hotels/hotel_test_1790703048618_gallery_10.webp",
        "title": "",
        "category": "dining"
      }
    ],
    "videoUrl": "",
    "overview": "فندق برستيج اجياد قريب من الحرم ( اجياد المصافي )",
    "detailedDescription": "يقع مكان إقامة \"فندق برستيج اجياد\" المصنف 4 نجوم في Ajyad. تشمل المرافق المتوفرة في مكان الإقامة هذا مطعماً، وخدمة الغرف، ومكتب استقبال يعمل على مدار الساعة، بالإضافة إلى واي فاي مجاني في جميع أنحاء مكان الإقامة. يمكن ترتيب مواقف خاصة للسيارات مقابل تكلفة إضافية.\n\nيوفر \"فندق برستيج اجياد\" للضيوف غرفاً مكيفة وتحتوي على خزانة ملابس وغلاية وصندوق ودائع آمن، بالإضافة إلى تلفزيون بشاشة مسطحة وشرفة وحمّام خاص مع دش.\n\nيقدم الإفطار للضيوف خيارات طعام من بوفيه أو من قائمة مأكولات أو آسيوية.\n\nيقع مطار الملك عبد العزيز الدولي على بُعد 92 كم من مكان الإقامة.",
    "amenities": [
      "واي فاي مجاني",
      "إطلالة على الحرم"
    ],
    "bookingUrl": "https://www.booking.com/Share-UXwLvB",
    "showBookingUrl": true,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/RX4Epj6hwe25VCpe7",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "+966544076726",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "order": 1,
      "address": "أجياد، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على ساحات الحرم",
      "metaDescription": ""
    },
    "keywords": "فنادق مكة",
    "metaDescription": ""
  },
  {
    "id": "hotel_1790706496971",
    "name": "منازل الزهراء ",
    "nameEn": "Manazel Azzahra",
    "city": "المدينة المنورة",
    "district": "المنطقة المركزية الغربية",
    "stars": 5,
    "distanceToHaram": 600,
    "distanceText": "600 متراً عن ساحة الحرم",
    "walkingTimeMinutes": 8,
    "featured": true,
    "isActive": true,
    "order": 2,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "/images/hotels/hotel_1790706496971_main.webp",
    "galleryImages": [],
    "videoUrl": "",
    "overview": "قع مكان إقامة \"فندق منازل الزهراء\" في المدينة المنورة، في حي وسط المدينة. لدى هذا الفندق المصنف نجمة واحدة غرف مكيفة مع حمّام خاص، بالإضافة إلى صالة مشتركة. يبعد مكان الإقامة مسافة 600 م عن مركز المدينة.",
    "detailedDescription": "يقع مكان إقامة \"فندق منازل الزهراء\" في المدينة المنورة، في حي وسط المدينة. لدى هذا الفندق المصنف نجمة واحدة غرف مكيفة مع حمّام خاص، بالإضافة إلى صالة مشتركة. يبعد مكان الإقامة مسافة 600 م عن مركز المدينة.\n\nتحتوي كل غرفة في \"فندق منازل الزهراء\" على خزانة ملابس وتلفزيون بشاشة مسطحة. تحتوي غرف الضيوف على بياضات أسرّة.\n\nيتحدث الموظفون اللغة العربية والإنجليزية في مكتب الاستقبال الذي يعمل على مدار الساعة، وسيكونون سعداء بتقديم نصائح مفيدة عن المنطقة.للضيوف.\n\nيقع مطار الأمير محمد بن عبدالعزيز الدولي على بُعد 15 كم من مكان الإقامة.",
    "amenities": [
      "إطلالة على الحرم",
      "واي فاي مجاني",
      "بوفيه إفطار",
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "https://www.booking.com/Share-JkSbMO",
    "showBookingUrl": true,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/BZoC7Ukfd118cdjy9",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "+966590348800",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 2,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على ساحات الحرم",
      "metaDescription": ""
    },
    "keywords": "",
    "metaDescription": ""
  }
];

export const INITIAL_OFFERS: Offer[] = [];

export const INITIAL_REVIEWS: HotelReview[] = [];

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  "aboutUs": {
    "badge": "شرف خدمة ضيوف الرحمن",
    "title": "عن شركة برستيج لإدارة وتشغيل الفنادق",
    "photos": [
      "/images/about/photo_0.webp",
      "/images/about/photo_1.webp",
      "/images/about/photo_2.webp",
      "/images/about/photo_3.webp",
      "/images/about/photo_4.webp"
    ],
    "logoUrl": "/images/brand/about_logo.png",
    "subtitle": "مسيرة ريادة واحترافية في إدارة وتشغيل الفنادق والضيافة الفاخرة لضيوف الرحمن وزوار مكة المكرمة والمدينة المنورة.",
    "mainPhoto": "/images/about/main_photo.webp",
    "officeCity": "مكة المكرمة",
    "visionText": "أن نكون الخيار الأول والأكثر ثقة للمستثمرين وضيوف الرحمن ووكالات العمرة عالمياً من خلال تقديم أرقى معايير الإدارة والتشغيل الفندقي.",
    "officeEmail": "prestigeksa.umrah@gmail.com",
    "officePhone": "+966560580250⁩",
    "officeTitle": "المقر الرئيسي لشركة برستيج لإدارة وتشغيل الفنادق",
    "showLicense": false,
    "visionTitle": "رؤيتنا: الريادة في إدارة وتشغيل الفنادق والضيافة الروحانية",
    "missionText1": "تأسست شركة برستيج لإدارة وتشغيل الفنادق انطلاقاً من رؤية متكاملة لرفع كفاءة تشغيل الأصول الفندقية وتقديم أرقى حلول الضيافة والتسكين لضيوف الرحمن وشركات السياحة في المدينتين المقدستين.",
    "missionText2": "بفضل خبراتنا الإدارية وكوادرنا التشغيلية المتخصصة في كبرى فنادق مكة المكرمة والمدينة المنورة، نضمن للمستثمرين والنزلاء أعلى معايير الجودة الفندقية وسرعة إجراءات التسكين.",
    "missionTitle": "رسالتنا: التميز في إدارة وتشغيل الفنادق وخدمة الضيوف",
    "officeMapUrl": "https://maps.app.goo.gl/sCNr6a6X4UkbSYGn6",
    "servedGuests": "١٢٠,٠٠٠+",
    "valuePillars": [
      {
        "id": "pillar_1",
        "order": 1,
        "title": "المصداقية المطلقة",
        "titleEn": "Absolute Integrity",
        "iconName": "ShieldCheck",
        "description": "ما تراه وتتفق عليه هو ما تجده تماماً، دون مفاجآت في المسافة أو مستوى الغرفة أو الخدمات المتفق عليها.",
        "descriptionEn": "What you see and agree upon is exactly what you receive, with no surprises in distances, room standards, or agreed services."
      },
      {
        "id": "pillar_2",
        "order": 2,
        "title": "رعاية وتواجد ميداني",
        "titleEn": "On-Ground Field Support",
        "iconName": "HeartHandshake",
        "description": "فريقنا الميداني في مكة المكرمة والمدينة المنورة على أهبة الاستعداد على مدار الساعة لاستقبالكم وتلبية كافة متطلباتكم.",
        "descriptionEn": "Our field representatives in Makkah and Madinah are on standby 24/7 to welcome you and assist with all your requirements."
      },
      {
        "id": "pillar_3",
        "order": 3,
        "title": "عقود مباشرة وأفضل الأسعار",
        "titleEn": "Direct Contracts & Best Rates",
        "iconName": "Award",
        "description": "عقود موسمية وسنوية مباشرة مع كبرى فنادق الحرمين تتيح لنا تقديم أسعار حصرية ومنافسة تلبي كافة الميزانيات.",
        "descriptionEn": "Direct seasonal and annual contracts with premier Haramain hotels enable us to offer exclusive, competitive rates for all budgets."
      }
    ],
    "licenseNumber": "73104928",
    "officeAddress": "برج مشارق - الدائري الثالث، الرصيفه، مكة المكرمة",
    "officeWhatsApp": "+966544076726",
    "yearsExperience": "١٥+ عاماً",
    "licenseAuthority": "مرخصون من وزارة الحج والعمرة والهيئة السعودية للسياحة",
    "officeWorkingHours": "على مدار الساعة 24/7 لخدمة ضيوف الرحمن"
  },
  "logoUrl": "/images/brand/logo.png",
  "branches": [
    {
      "id": "branch_makkah",
      "city": "مكة المكرمة",
      "name": "فرع مكة المكرمة (المقر الرئيسي)",
      "email": "",
      "order": 1,
      "phone": "⁦+966560580250⁩",
      "mapUrl": "https://maps.app.goo.gl/sCNr6a6X4UkbSYGn6",
      "address": "برج مشارق - الدائري الثالث، الرصيفه، مكة المكرمة",
      "isActive": true,
      "whatsapp": "⁦+966560580250⁩",
      "isMainBranch": true,
      "workingHours": "على مدار الساعة 24/7"
    },
    {
      "id": "branch_madinah",
      "city": "المدينة المنورة",
      "name": "فرع المدينة المنورة",
      "email": "",
      "order": 2,
      "phone": "+966501234568",
      "mapUrl": "https://maps.app.goo.gl/LTTrbyMkEJJj359eA",
      "address": "المنطقة المركزية الغربيه ، فندق منازل الزهراء ، المدينة المنورة",
      "isActive": true,
      "whatsapp": "+966501234568",
      "isMainBranch": false,
      "workingHours": "على مدار الساعة 24/7"
    }
  ],
  "channels": [
    {
      "id": "ch_whatsapp",
      "type": "whatsapp",
      "order": 0,
      "title": "واتساب إدارة وحجوزات برستيج",
      "value": "+966544076726",
      "isActive": true
    },
    {
      "id": "ch_phone",
      "type": "phone",
      "order": 1,
      "title": "رقم الهاتف المباشر",
      "value": "⁦+966560580250⁩",
      "isActive": true
    },
    {
      "id": "ch_email",
      "type": "email",
      "order": 2,
      "title": "البريد الإلكتروني الرسمي",
      "value": "prestigeksa.umrah@gmail.com",
      "isActive": true
    }
  ],
  "siteTitle": "برستيج لإدارة وتشغيل الفنادق",
  "updatedAt": 1790708031489,
  "faviconUrl": "/images/brand/favicon.png",
  "heroSlides": [
    {
      "id": "slide_1790707591582",
      "badge": "الضيافة الملكية المميزة",
      "order": 0,
      "title": "احجز الفنادق اللي تناسبك ",
      "imageUrl": "/images/slides/slide_0.png",
      "isActive": true,
      "subtitle": "فنادق مكه والمدينه  المنوره  واختار المناسب ",
      "videoUrl": "",
      "mediaType": "image",
      "showBadge": true,
      "showTitle": true,
      "showSubtitle": true,
      "videoThumbnail": "",
      "primaryButtonText": "استعرض الفنادق المتاحة",
      "showPrimaryButton": true,
      "primaryButtonAction": "hotels",
      "secondaryButtonText": "تواصل معنا",
      "showSecondaryButton": true,
      "secondaryButtonAction": "contact"
    },
    {
      "id": "slide_1790706060183",
      "badge": "🦅🦅🦅برستيج لإدارة وتشغيل الفنادق 🦅🦅🦅",
      "order": 1,
      "title": "برستيج لإدارة وتشغيل الفنادق",
      "imageUrl": "/images/slides/slide_1.webp",
      "isActive": true,
      "subtitle": "وصف تسويقي راقٍ يبرز جودة وفخامة الإقامة وقربها من الحرمين الشريفين.",
      "videoUrl": "",
      "mediaType": "image",
      "showBadge": true,
      "showTitle": true,
      "showSubtitle": false,
      "videoThumbnail": "",
      "primaryButtonText": "تواصل معنا",
      "showPrimaryButton": true,
      "primaryButtonAction": "contact",
      "secondaryButtonText": "برستيج",
      "showSecondaryButton": true,
      "secondaryButtonAction": "about"
    }
  ],
  "introVideo": {
    "enabled": true,
    "videoUrl": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotel-media/1790703188446_ze8r9p.mp4"
  },
  "quickLinks": [
    {
      "id": "link_home",
      "order": 1,
      "title": "الرئيسية",
      "isActive": true,
      "targetPage": "home"
    },
    {
      "id": "link_hotels",
      "order": 2,
      "title": "فنادقنا المُدارة",
      "isActive": true,
      "targetPage": "hotels"
    },
    {
      "id": "link_packages",
      "order": 3,
      "title": "باقات الحج والعمرة",
      "isActive": false,
      "targetPage": "packages"
    },
    {
      "id": "link_offers",
      "order": 4,
      "title": "العروض والمناسبات",
      "isActive": true,
      "targetPage": "offers"
    },
    {
      "id": "link_about",
      "order": 5,
      "title": "من نحن",
      "isActive": true,
      "targetPage": "about"
    },
    {
      "id": "link_contact",
      "order": 6,
      "title": "تواصل معنا",
      "isActive": true,
      "targetPage": "contact"
    }
  ],
  "showLicense": true,
  "metaKeywords": "فنادق مكة, فنادق المدينة, حجز فنادق الحرم, برستيج لإدارة الفنادق, تسكين فنادق, عمرة وحج",
  "siteSubtitle": "تسكين وفنادق مكة المكرمة والمدينة المنورة",
  "metaDescription": "شركة برستيج لإدارة وتشغيل الفنادق - رواد الضيافة والتسكين الفندقي في مكة المكرمة والمدينة المنورة.",
  "departmentContacts": [
    {
      "id": "dept_sales",
      "name": "فريق المبيعات والتعاقدات",
      "order": 1,
      "phone": "+966501234567",
      "isActive": true,
      "whatsapp": "+966501234567",
      "roleTitle": "مسؤول مبيعات الشركات وحجوزات المجموعات",
      "department": "إدارة المبيعات والشركات",
      "workingHours": "متاح 24/7 طوال أيام الأسبوع"
    },
    {
      "id": "dept_bookings",
      "name": "استشاري التسكين المباشر",
      "order": 2,
      "phone": "+966501234568",
      "isActive": true,
      "whatsapp": "+966501234568",
      "roleTitle": "مسؤول تأكيد الغرف والأجنحة الفندقية",
      "department": "قسم الحجوزات والتسكين",
      "workingHours": "على مدار الساعة 24/7"
    },
    {
      "id": "dept_accounts",
      "name": "الإدارة المالية والمدفوعات",
      "order": 3,
      "phone": "+966501234569",
      "isActive": true,
      "whatsapp": "+966501234569",
      "roleTitle": "المسؤول المالي والفواتير والتحويلات",
      "department": "قسم الحسابات والمالية",
      "workingHours": "9:00 ص - 6:00 م"
    }
  ]
};
