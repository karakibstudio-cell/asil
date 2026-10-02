import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';

export type Language = 'ar' | 'en';

export interface Translations {
  [key: string]: {
    ar: string;
    en: string;
  };
}

// Comprehensive bilingual dictionary for all platform UI elements
export const DICTIONARY: Record<string, { ar: string; en: string }> = {
  // Brand & General
  'brand.title': { ar: 'برستيج لإدارة وتشغيل الفنادق', en: 'Prestige Hotels Management & Hospitality' },
  'brand.subtitle': { ar: 'إدارة وتشغيل الفنادق والضيافة الفاخرة', en: 'Hotel Management, Operations & Luxury Hospitality' },
  'brand.licensed': { ar: 'شركة معتمدة ومتخصصة في إدارة وتشغيل الفنادق وحلول التسكين', en: 'Certified Company Specializing in Hotel Management, Operations & Hospitality Solutions' },
  'header.brand.title': { ar: 'برستيج لإدارة وتشغيل الفنادق', en: 'Prestige Hotels Management' },
  'header.brand.subtitle': { ar: 'إدارة وتشغيل الفنادق والضيافة الفاخرة', en: 'Hotel Management & Operations' },

  // Navigation Links
  'nav.home': { ar: 'الرئيسية', en: 'Home' },
  'nav.hotels': { ar: 'الفنادق', en: 'Hotels' },
  'nav.offers': { ar: 'الإعلانات والعروض', en: 'Ads & Offers' },
  'nav.packages': { ar: 'باقات الحج والعمرة', en: 'Hajj & Umrah Packages' },
  'nav.about': { ar: 'من نحن', en: 'About Us' },
  'nav.contact': { ar: 'تواصل معنا', en: 'Contact Us' },
  'nav.admin': { ar: 'لوحة التحكم', en: 'Admin Dashboard' },

  // Language Switcher
  'lang.switch': { ar: 'English', en: 'العربية' },
  'lang.current': { ar: 'العربية', en: 'English' },
  'lang.badge': { ar: 'EN', en: 'عربي' },
  'lang.tooltip': { ar: 'التحويل إلى اللغة الإنجليزية (Switch to English)', en: 'Switch to Arabic (التحويل إلى العربية)' },

  // Hero Section
  'hero.welcomeBadge': { ar: 'الضيافة الملكية الأقرب إلى رحاب الحرمين الشريفين', en: 'Royal Hospitality Closest to the Two Holy Mosques' },
  'hero.badge': { ar: 'الضيافة الملكية الأقرب إلى رحاب الحرمين الشريفين', en: 'Royal Hospitality Closest to the Two Holy Mosques' },
  'hero.title': { ar: 'تسكين في أرقى فنادق مكة المكرمة والمدينة المنورة', en: 'Stay at the Finest Hotels in Makkah & Madinah' },
  'hero.subtitle': { ar: 'نوفر لضيوف الرحمن وشركات السياحة أفضل خيارات الإقامة في فنادق الصف الأول المقابلة للحرم المكي والمسجد النبوي، مع تسهيلات حجز معتمدة ومباشرة.', en: 'Providing pilgrims and travel agencies with premier first-row accommodation directly facing the Grand Mosque and Prophet’s Mosque, with certified direct bookings.' },
  'hero.exploreHotels': { ar: 'استعرض الفنادق المتاحة', en: 'Explore Available Hotels' },
  'hero.contactConsultant': { ar: 'تواصل مع مستشار الحجز', en: 'Contact Booking Consultant' },
  'hero.contactWhatsApp': { ar: 'تواصل عبر الواتساب', en: 'Chat on WhatsApp' },
  'hero.discoverMore': { ar: 'اكتشف المزيد', en: 'Discover More' },
  'hero.exploreShort': { ar: 'استكشف الفنادق', en: 'Explore Hotels' },
  'hero.zoomMedia': { ar: 'تكبير الصورة', en: 'Zoom Image' },
  'hero.zoomVideo': { ar: 'تكبير الفيديو', en: 'Zoom Video' },
  'hero.prev': { ar: 'السابق', en: 'Previous' },
  'hero.next': { ar: 'التالي', en: 'Next' },
  'hero.slide.default_slide_1.badge': { ar: 'الضيافة الملكية الأقرب إلى رحاب الحرمين الشريفين', en: 'Royal Hospitality Closest to the Two Holy Mosques' },
  'hero.slide.default_slide_1.title': { ar: 'تسكين في أرقى فنادق مكة المكرمة والمدينة المنورة', en: 'Stay at the Finest Hotels in Makkah & Madinah' },
  'hero.slide.default_slide_1.subtitle': { ar: 'نوفر لضيوف الرحمن وشركات السياحة أفضل خيارات الإقامة في فنادق الصف الأول المقابلة للحرم المكي والمسجد النبوي، مع تسهيلات حجز معتمدة ومباشرة.', en: 'Providing pilgrims and travel agencies with premier first-row accommodation directly facing the Grand Mosque and Prophet’s Mosque, with certified direct bookings.' },
  'hero.slide.default_slide_1.primaryButtonText': { ar: 'استعرض الفنادق المتاحة', en: 'Explore Available Hotels' },
  'hero.slide.default_slide_1.secondaryButtonText': { ar: 'تواصل مع مستشار الحجز', en: 'Contact Booking Consultant' },

  // Stats Section
  'stats.hotels.number': { ar: '+50', en: '50+' },
  'stats.hotels.label': { ar: 'فندق معتمد ومرخص بمكة والمدينة', en: 'Certified Hotels in Makkah & Madinah' },
  'stats.guests.number': { ar: '+120 ألف', en: '120k+' },
  'stats.guests.label': { ar: 'حاج ومعتمر تشرفنا بخدمتهم', en: 'Pilgrims We Proudly Accommodated' },
  'stats.years.number': { ar: '+15 عاماً', en: '15+ Years' },
  'stats.years.label': { ar: 'من الريادة والخبرة المتخصصة', en: 'Of Specialized Leadership & Experience' },
  'stats.satisfaction.number': { ar: '99٪', en: '99%' },
  'stats.satisfaction.label': { ar: 'نسبة رضا وثقة ضيوف الرحمن', en: 'Guest Satisfaction & Trust Rate' },
  'home.stats.item1.label': { ar: 'فندق معتمد ومرخص بمكة والمدينة', en: 'Certified & Licensed Hotels in Makkah & Madinah' },
  'home.stats.item2.label': { ar: 'حاج ومعتمر تشرفنا بخدمتهم', en: 'Pilgrims We Proudly Accommodated' },
  'home.stats.item3.label': { ar: 'من الريادة والخبرة المتخصصة', en: 'Of Specialized Leadership & Experience' },
  'home.stats.item4.label': { ar: 'نسبة رضا وثقة ضيوف الرحمن', en: 'Guest Satisfaction & Trust Rate' },

  // Featured Hotels Section
  'home.hotels.badge': { ar: 'فخامة وروحانية', en: 'Luxury & Spirituality' },
  'home.hotels.title': { ar: 'فنادقنا المميزة في مكة والمدينة', en: 'Featured Hotels in Makkah & Madinah' },
  'home.hotels.subtitle': { ar: 'مجموعة مختارة بعناية من أفخم الفنادق المطلة على الكعبة المشرفة وساحات المسجد النبوي، تضمن لكم راحة لا تضاهى.', en: 'A handpicked collection of luxury hotels overlooking the Holy Kaaba and the Prophet’s Mosque courtyards, ensuring unmatched comfort.' },
  'home.hotels.viewAllBtn': { ar: 'شاهد كل الفنادق', en: 'View All Hotels' },

  // Featured Carousel Banner
  'home.featuredCarousel.badge': { ar: 'فنادق مختارة ومميزة', en: 'Handpicked Featured Hotels' },
  'home.featuredCarousel.title': { ar: 'أبرز الفنادق الموصى بها في الحرمين', en: 'Top Recommended Hotels in the Two Holy Mosques' },
  'carousel.hotelOf': { ar: 'فندق {current} من {total}', en: 'Hotel {current} of {total}' },
  'carousel.autoPlay': { ar: 'تبديل تلقائي', en: 'Auto Play' },
  'carousel.viewDetails': { ar: 'استعراض الفندق والتفاصيل', en: 'View Hotel & Details' },

  // Accordion Section
  'home.accordion.badge': { ar: 'دليل التسكين الشامل', en: 'Comprehensive Accommodation Guide' },
  'home.accordion.title': { ar: 'فنادقنا حسب المدينة والأحياء', en: 'Our Hotels by City & Districts' },
  'home.accordion.subtitle': { ar: 'استكشف تشكيلة فنادقنا الفاخرة الموزعة بدقة على أهم أحياء مكة المكرمة والمدينة المنورة الأقرب للحرمين الشريفين.', en: 'Explore our luxury hotel collection across prime districts in Makkah and Madinah closest to the Two Holy Mosques.' },
  'accordion.makkahHotels': { ar: 'فنادق مكة المكرمة', en: 'Makkah Hotels' },
  'accordion.madinahHotels': { ar: 'فنادق المدينة المنورة', en: 'Madinah Hotels' },
  'accordion.districtDistrict': { ar: 'حي {district}', en: '{district} District' },
  'accordion.availableHotels': { ar: '{count} فندق متاح ومعتمد', en: '{count} certified hotels available' },
  'accordion.showHotels': { ar: 'استعراض الفنادق', en: 'View Hotels' },
  'accordion.hideHotels': { ar: 'إخفاء الفنادق', en: 'Hide Hotels' },
  'accordion.filterDistrict': { ar: 'عرض وتصفية جميع فنادق حي {district} في صفحة الفنادق', en: 'View & filter all hotels of {district} District in Hotels page' },

  // Offers Spotlight in Home
  'home.offers.badge': { ar: 'إعلانات وبوسترات حصرية', en: 'Exclusive Ads & Posters' },
  'home.offers.title': { ar: 'تصفح أحدث إعلانات وبوسترات مواسم برستيج الفندقية', en: 'Browse Latest Prestige Hotel Seasonal Posters & Ads' },
  'home.offers.btn': { ar: 'استعراض كافة الإعلانات', en: 'Explore All Ads & Offers' },

  // Testimonials Section
  'home.testimonials.badge': { ar: 'شهادات نعتز بها', en: 'Valued Guest Reviews' },
  'home.testimonials.title': { ar: 'آراء وتجارب ضيوف الرحمن', en: 'Experiences of the Guests of Allah' },
  'home.testimonials.addReview': { ar: 'أضف تقييمك وتجربتك', en: 'Add Your Review' },
  'home.testimonials.stayAt': { ar: 'الإقامة في', en: 'Stayed at' },

  // Trust Features
  'home.trust.feature1.title': { ar: 'حجوزات مؤكدة ومباشرة', en: 'Guaranteed Direct Bookings' },
  'home.trust.feature1.desc': { ar: 'تعاقدات حصرية مع كبرى سلاسل الفنادق تضمن لك التسكين الفوري المؤكد.', en: 'Exclusive contracts with premier hotel chains ensure instant confirmed accommodation.' },
  'home.trust.feature2.title': { ar: 'القرب الفائق من الحرم', en: 'Extreme Proximity to the Haram' },
  'home.trust.feature2.desc': { ar: 'فنادق تبعد خطوات معدودة عن ساحات الحرمين لراحة كبار السن والأسر والأطفال.', en: 'Hotels located just steps away from the Haram courtyards for elderly, families, and children.' },
  'home.trust.feature3.title': { ar: 'فريق ميداني على مدار 24/7', en: '24/7 On-Ground Support' },
  'home.trust.feature3.desc': { ar: 'ممثلونا متواجدون في مكة والمدينة لاستقبالكم وتسهيل إجراءات الدخول والإقامة.', en: 'Our representatives are stationed in Makkah and Madinah to welcome you and ensure seamless check-in.' },

  // Hotels Page & Filter
  'hotels.header.badge': { ar: 'تسكين مكة المكرمة والمدينة المنورة', en: 'Makkah & Madinah Accommodation' },
  'hotels.header.title': { ar: 'دليل فنادق الحرمين الشريفين', en: 'Two Holy Mosques Hotel Directory' },
  'hotels.header.subtitle': { ar: 'تصفح نخبة من أرقى الفنادق المركزية المعتمدة لضيوف الرحمن، وصنّف عبر الفلاتر المنسدلة الذكية بكل سهولة.', en: 'Browse premier certified central hotels for pilgrims, easily filtered by location, rating, and distance.' },
  'hotels.title': { ar: 'فنادق مكة المكرمة والمدينة المنورة', en: 'Hotels in Makkah & Madinah' },
  'hotels.subtitle': { ar: 'تصفح باقة مختارة من أرقى فنادق الصف الأول والمناطق المركزية الأقرب للحرمين الشريفين.', en: 'Browse a handpicked selection of premier first-row and central hotels nearest to the Two Holy Mosques.' },
  'hotels.searchPlaceholder': { ar: 'ابحث باسم الفندق، الحي، أو التصنيف...', en: 'Search by hotel name, district, or category...' },
  'hotels.filterCityAll': { ar: 'كل المدن', en: 'All Cities' },
  'hotels.filterMakkah': { ar: 'مكة المكرمة', en: 'Makkah' },
  'hotels.filterMadinah': { ar: 'المدينة المنورة', en: 'Madinah' },
  'hotels.category': { ar: 'التصنيف', en: 'Category' },
  'hotels.selectCategories': { ar: 'اختر تصنيفات الفندق', en: 'Select Categories' },
  'hotels.clearSelection': { ar: 'مسح التحديد', en: 'Clear' },
  'hotels.district': { ar: 'الحي / المنطقة', en: 'District / Area' },
  'hotels.allDistricts': { ar: 'جميع الأحياء', en: 'All Districts' },
  'hotels.stars': { ar: 'النجوم', en: 'Stars' },
  'hotels.allRatings': { ar: 'جميع التصنيفات', en: 'All Ratings' },
  'hotels.stars5': { ar: '5 نجوم (فاخر ملكي)', en: '5 Stars (Luxury Royal)' },
  'hotels.stars4': { ar: '4 نجوم (مميز)', en: '4 Stars (Premium)' },
  'hotels.stars3': { ar: '3 نجوم (اقتصادي)', en: '3 Stars (Standard)' },
  'hotels.distance': { ar: 'المسافة', en: 'Distance' },
  'hotels.anyDistance': { ar: 'أي مسافة (حتى 1 كم)', en: 'Any distance (up to 1 km)' },
  'hotels.directCourtyard': { ar: 'ساحة الحرم مباشرة (<100م)', en: 'Direct Haram Courtyard (<100m)' },
  'hotels.under250m': { ar: 'أقل من 250 متراً', en: '< 250 meters' },
  'hotels.under500m': { ar: 'أقل من 500 متراً', en: '< 500 meters' },
  'hotels.sortBy': { ar: 'ترتيب حسب:', en: 'Sort by:' },
  'hotels.sortRecommended': { ar: 'الموصى به', en: 'Recommended' },
  'hotels.sortClosest': { ar: 'الأقرب للحرم', en: 'Closest to Haram' },
  'hotels.sortRating': { ar: 'الأعلى تقييماً', en: 'Highest Rated' },
  'hotels.sortStars': { ar: 'عدد النجوم (الأعلى أولاً)', en: 'Star Rating (Highest first)' },
  'hotels.reset': { ar: 'إعادة ضبط', en: 'Reset' },
  'hotels.foundCount': { ar: 'عُثر على {count} فندق', en: 'Found {count} hotels' },
  'hotels.activeFilters': { ar: 'التصنيفات المحددة:', en: 'Active Filters:' },
  'hotels.noHotelsFound': { ar: 'لم نعثر على فنادق مطابقة للبحث', en: 'No matching hotels found' },
  'hotels.noHotelsFoundDesc': { ar: 'جرّب تغيير خيارات التصفية أو توسيع نطاق المسافة لعرض المزيد من فنادق مكة والمدينة المعتمدة.', en: 'Try adjusting your filters or expanding distance to view more certified hotels in Makkah & Madinah.' },
  'hotels.showAll': { ar: 'عرض جميع الفنادق', en: 'Show All Hotels' },
  'hotels.bookNow': { ar: 'للتواصل والحجز', en: 'Book & Inquire' },
  'hotels.viewDetails': { ar: 'التفاصيل', en: 'Details' },

  // Hotel Card Details & Badges
  'card.from': { ar: 'يبدأ من', en: 'From' },
  'card.perNight': { ar: 'لكل ليلة', en: 'per night' },
  'card.meters': { ar: 'متر إلى ساحة الحرم', en: 'meters to Haram courtyards' },
  'card.freeWifi': { ar: 'واي فاي مجاني', en: 'Free Wi-Fi' },
  'card.breakfast': { ar: 'شامل الإفطار', en: 'Breakfast Included' },
  'card.haramView': { ar: 'إطلالة على الحرم', en: 'Haram View' },
  'card.kaabaView': { ar: 'إطلالة على الكعبة', en: 'Kaaba View' },
  'card.shuttleBus': { ar: 'حافلات ترددية', en: 'Shuttle Buses' },
  'card.restaurant': { ar: 'مطاعم فاخرة', en: 'Luxury Restaurants' },
  'card.featured': { ar: 'مميز', en: 'Featured' },
  'card.minWalk': { ar: '{min} دقائق سيراً للحرم', en: '{min} min walk to Haram' },
  'card.bookDirect': { ar: 'للتواصل والحجز', en: 'Book & Inquire' },
  'card.details': { ar: 'التفاصيل', en: 'Details' },
  'card.reviewsCount': { ar: '({count} تقييم)', en: '({count} reviews)' },

  // Hotel Detail Page
  'detail.back': { ar: 'العودة إلى قائمة الفنادق', en: 'Back to Hotels' },
  'detail.outOf5': { ar: 'من 5 نجوم', en: 'out of 5 stars' },
  'detail.copyLink': { ar: 'نسخ الرابط', en: 'Copy Link' },
  'detail.linkCopied': { ar: 'تم نسخ الرابط!', en: 'Link Copied!' },
  'detail.shareWhatsApp': { ar: 'مشاركة عبر واتساب', en: 'Share via WhatsApp' },
  'detail.tabOverview': { ar: 'الوصف الشامل', en: 'Overview' },
  'detail.tabGallery': { ar: 'معرض صور المرافق', en: 'Photo Gallery' },
  'detail.tabRooms': { ar: 'الغرف والأجنحة', en: 'Rooms & Suites' },
  'detail.tabAmenities': { ar: 'المرافق والخدمات', en: 'Amenities & Services' },
  'detail.tabLocation': { ar: 'الموقع والخريطة', en: 'Location & Map' },
  'detail.tabVideos': { ar: 'الفيديوهات وجولات الغرف', en: 'Room Tours & Videos' },
  'detail.tabReviews': { ar: 'التقييمات وتجارب النزلاء', en: 'Guest Reviews' },
  'detail.bookingCardTitle': { ar: 'تأكيد الحجز والاستفسار المباشر', en: 'Confirm Booking & Direct Inquiry' },
  'detail.instantBooking': { ar: 'حجز فوري ومؤكد عبر الواتساب', en: 'Instant Confirmed Booking via WhatsApp' },
  'detail.callConsultant': { ar: 'اتصال هاتفي بمستشار التسكين', en: 'Call Accommodation Consultant' },
  'detail.globalPlatforms': { ar: 'منصات الحجز العالمية المعتمدة:', en: 'Certified Global Booking Platforms:' },
  'detail.pricePerNight': { ar: 'السعر التقديري لليلة:', en: 'Estimated Rate Per Night:' },
  'detail.estimatedSAR': { ar: 'حسب الموسم والتواريخ', en: 'Based on season & dates' },
  'detail.viewType': { ar: 'نوع الإطلالة:', en: 'View Type:' },
  'detail.distanceToHaram': { ar: 'المسافة إلى الحرم:', en: 'Distance to Haram:' },
  'detail.walkingTime': { ar: 'مدة السير على الأقدام:', en: 'Walking Duration:' },
  'detail.readMore': { ar: 'قراءة المزيد من التفاصيل...', en: 'Read more details...' },
  'detail.readLess': { ar: 'عرض أقل', en: 'Show less' },
  'detail.openMaps': { ar: 'عرض في تطبيق خرائط Google', en: 'Open in Google Maps' },
  'detail.similarHotels': { ar: 'فنادق مماثلة في نفس المدينة', en: 'Similar Hotels in Same City' },
  'detail.similarSubtitle': { ar: 'خيارات فندقية إضافية تلبي تطلعات ضيوف الرحمن بأعلى مستويات الراحة.', en: 'Additional hotel options meeting pilgrim expectations with utmost comfort.' },

  // Offers Page
  'offers.header.badge': { ar: 'إعلانات وبوسترات حصرية', en: 'Exclusive Ads & Posters' },
  'offers.header.title': { ar: 'إعلانات برستيج ومواسم الضيافة', en: 'Prestige Hotel Ads & Hospitality Seasons' },
  'offers.header.subtitle': { ar: 'تصفح أحدث إعلانات وبوسترات مواسم برستيج الفندقية لحجوزات الحج والعمرة والضيافة الروحانية في مكة المكرمة والمدينة المنورة.', en: 'Browse the latest Prestige Hotel accommodation posters and seasonal deals for Hajj, Umrah, and spiritual stays in Makkah and Madinah.' },
  'offers.promoVideo': { ar: 'فيديو دعائي', en: 'Promo Video' },
  'offers.posterBadge': { ar: 'بوستر إعلاني', en: 'Ad Poster' },
  'offers.discountOff': { ar: 'خصم {discount}٪', en: '{discount}% OFF' },
  'offers.endsIn': { ar: 'ينتهي الإعلان خلال:', en: 'Offer ends in:' },
  'offers.fullDetails': { ar: 'عرض تفاصيل الإعلان', en: 'Full Ad Details' },
  'offers.bookViaWhatsApp': { ar: 'تواصل واستفسر عبر واتساب فوراً', en: 'Inquire on WhatsApp Now' },
  'offers.closeModal': { ar: 'إغلاق', en: 'Close' },
  'offers.empty.title': { ar: 'لا توجد إعلانات نشطة حالياً', en: 'No Active Ads Currently' },
  'offers.empty.desc': { ar: 'تابعونا باستمرار للاطلاع على أحدث إعلانات وبوسترات مواسم الحج والعمرة وفنادق مكة والمدينة.', en: 'Stay tuned for upcoming Hajj, Umrah, and Ramadan accommodation posters.' },
  'offers.empty.cta': { ar: 'استعرض فنادق مكة والمدينة', en: 'Explore Makkah & Madinah Hotels' },

  // About Us Page
  'about.badge': { ar: 'شرف خدمة ضيوف الرحمن', en: 'Honored to Serve Pilgrims' },
  'about.title': { ar: 'عن شركة برستيج لإدارة وتشغيل الفنادق', en: 'About Prestige Hotels Management' },
  'about.subtitle': { ar: 'مسيرة ريادة واحترافية في إدارة وتشغيل الفنادق والضيافة الفاخرة لضيوف الرحمن وزوار مكة المكرمة والمدينة المنورة.', en: 'A legacy of excellence in hotel management, operations, and luxury hospitality in Makkah & Madinah.' },
  'about.missionTitle': { ar: 'رسالتنا: التميز في إدارة وتشغيل الفنادق وخدمة الضيوف', en: 'Our Mission: Excellence in Hotel Management & Hospitality' },
  'about.missionText1': { ar: 'تأسست شركة برستيج لإدارة وتشغيل الفنادق انطلاقاً من رؤية متكاملة لرفع كفاءة تشغيل الأصول الفندقية وتقديم أرقى حلول الضيافة والتسكين لضيوف الرحمن وشركات السياحة في المدينتين المقدستين.', en: 'Prestige Hotels Management was established with a clear vision to elevate hotel asset operations and deliver premier hospitality solutions in Makkah & Madinah.' },
  'about.missionText2': { ar: 'بفضل خبراتنا الإدارية وكوادرنا التشغيلية المتخصصة في كبرى فنادق مكة المكرمة والمدينة المنورة، نضمن للمستثمرين والنزلاء أعلى معايير الجودة الفندقية وسرعة إجراءات التسكين.', en: 'Through strategic management across premier Makkah and Madinah hotels, we guarantee our partners high operational standards and our guests seamless stays.' },
  'about.visionTitle': { ar: 'رؤيتنا: الريادة في إدارة وتشغيل الفنادق والضيافة الروحانية', en: 'Our Vision: Leadership in Hotel Operations & Spiritual Hospitality' },
  'about.visionText': { ar: 'أن نكون الخيار الأول والأكثر ثقة للمستثمرين وضيوف الرحمن ووكالات العمرة عالمياً من خلال تقديم أرقى معايير الإدارة والتشغيل الفندقي.', en: 'To be the premier trusted choice for investors, pilgrims, and global travel agencies through world-class hotel management and operations.' },
  'about.header.badge': { ar: 'شرف خدمة ضيوف الرحمن', en: 'Honored to Serve Pilgrims' },
  'about.header.title': { ar: 'عن شركة برستيج لإدارة وتشغيل الفنادق', en: 'About Prestige Hotels Management' },
  'about.header.subtitle': { ar: 'مسيرة ريادة واحترافية في إدارة وتشغيل الفنادق والضيافة الفاخرة لضيوف الرحمن وزوار مكة المكرمة والمدينة المنورة.', en: 'A legacy of excellence in hotel management, operations, and luxury hospitality in Makkah & Madinah.' },
  'about.logoCard.prompt': { ar: 'انقر هنا لتكبير وفتح الشعار', en: 'Click here to enlarge & open logo' },
  'about.logoCard.enlarge': { ar: 'تكبير الشعار', en: 'Enlarge Logo' },
  'about.logoCard.replace': { ar: 'تغيير الشعار PNG', en: 'Replace Logo PNG' },
  'about.logoModal.title': { ar: 'شعار شركة برستيج لإدارة وتشغيل الفنادق', en: 'Prestige Hotels Management Company Logo' },
  'about.logoModal.subtitle': { ar: 'معاينة الشعار بدقة عالية مع دعم الشفافية', en: 'High-resolution logo preview with transparency' },
  'about.logoModal.openOriginal': { ar: 'فتح الصورة الأصلية', en: 'Open Original Image' },
  'about.logoModal.downloadPng': { ar: 'تحميل PNG', en: 'Download PNG' },
  'about.logoModal.fullscreen': { ar: 'عرض ملء الشاشة', en: 'View Fullscreen' },
  'about.logoModal.uploadPng': { ar: 'رفع وتغيير الشعار (PNG)', en: 'Upload New Logo (PNG)' },
  'about.mission.title': { ar: 'رسالتنا: التميز في إدارة وتشغيل الفنادق وخدمة الضيوف', en: 'Our Mission: Excellence in Hotel Management & Hospitality' },
  'about.mission.desc': { ar: 'توفير أرقى مستويات الراحة والطمأنينة لضيوف الرحمن عبر تأمين فنادق الصف الأول المقابلة للحرمين بأفضل الأسعار وأعلى معايير المصداقية.', en: 'Providing the highest standards of peace and comfort to pilgrims by securing premier first-row hotels facing the Two Holy Mosques at the best rates.' },
  'about.vision.title': { ar: 'رؤيتنا: الريادة في إدارة وتشغيل الفنادق والضيافة الروحانية', en: 'Our Vision: Leadership in Hotel Operations & Spiritual Hospitality' },
  'about.vision.desc': { ar: 'أن نكون الخيار الأول والأكثر ثقة للمستثمرين وضيوف الرحمن ووكالات العمرة عالمياً من خلال تقديم أرقى معايير الإدارة والتشغيل الفندقي.', en: 'To be the premier trusted choice for investors, pilgrims, and global travel agencies through world-class hotel management and operations.' },
  'about.values.title': { ar: 'قيمنا الجوهرية', en: 'Our Core Values' },
  'about.values.desc': { ar: 'الأمانة في التعامل، الصدق والوضوح في الحجوزات، والجاهزية الميدانية الدائمة لخدمة ضيف الرحمن.', en: 'Integrity in service, transparency in reservations, and continuous on-ground readiness.' },
  'about.experienceYears': { ar: 'خبرة متخصصة في قطاع الحج والعمرة', en: 'Years of specialized Hajj & Umrah expertise' },
  'about.servedGuests': { ar: 'حاج ومعتمر سُعدنا بخدمتهم', en: 'Pilgrims we have proudly accommodated' },
  'about.stats.experience': { ar: 'خبرة متخصصة في قطاع الحج والعمرة', en: 'Years of specialized Hajj & Umrah expertise' },
  'about.stats.pilgrims': { ar: 'حاج ومعتمر سُعدنا بخدمتهم', en: 'Pilgrims we have proudly accommodated' },
  'about.stats.hotels': { ar: 'فندق معتمد في مكة المكرمة والمدينة المنورة', en: 'Certified hotels in Makkah & Madinah' },
  'about.stats.satisfaction': { ar: 'نسبة رضا عملائنا وشركائنا', en: 'Client & partner satisfaction rate' },
  'about.clickToOpenLogo': { ar: 'انقر لفتح ومعاينة وتكبير الشعار', en: 'Click to enlarge & preview logo' },
  'about.zoomMainPhoto': { ar: 'تكبير الصورة', en: 'Zoom Photo' },
  'about.viewMap': { ar: 'فتح اللوكيشن على خرائط جوجل', en: 'Open in Google Maps' },
  'about.workingHoursTitle': { ar: 'أوقات وساعات العمل', en: 'Working Hours' },
  'about.license.badge': { ar: 'اعتماد رسمي', en: 'Official Accreditation' },
  'about.license.title': { ar: 'مرخصون ومعتمدون رسمياً', en: 'Officially Licensed & Certified' },
  'about.certifiedTitle': { ar: 'مرخصون ومعتمدون رسمياً', en: 'Officially Licensed & Certified' },
  'about.license.authority': { ar: 'مرخصون من وزارة الحج والعمرة والهيئة السعودية للسياحة', en: 'Certified by the Ministry of Hajj & Umrah and Saudi Tourism Authority' },
  'about.licenseAuthority': { ar: 'مرخصون من وزارة الحج والعمرة والهيئة السعودية للسياحة', en: 'Certified by the Ministry of Hajj & Umrah and Saudi Tourism Authority' },
  'about.license.number': { ar: 'ترخيص رقم: 73104928', en: 'License No: 73104928' },
  'about.hq.title': { ar: 'المقر الرئيسي لشركة برستيج', en: 'Prestige Headquarters' },
  'about.hq.address': { ar: 'أبراج وقف الملك عبدالعزيز - مجمع أبراج البيت، طريق أجياد، مكة المكرمة', en: 'King Abdulaziz Endowment Towers (Abraj Al-Bait), Ajyad Road, Makkah' },
  'about.office.sectionBadge': { ar: 'الموقع الجغرافي والمقر الرسمي', en: 'Official Headquarters & Location' },
  'about.office.title': { ar: 'المقر الرئيسي لشركة برستيج لإدارة وتشغيل الفنادق', en: 'Prestige Hotels Management Headquarters' },
  'about.office.address': { ar: 'أبراج وقف الملك عبدالعزيز - مجمع أبراج البيت، طريق أجياد، مكة المكرمة', en: 'King Abdulaziz Endowment Towers (Abraj Al-Bait), Ajyad Road, Makkah' },
  'about.office.workingHours': { ar: 'على مدار الساعة 24/7 لخدمة ضيوف الرحمن', en: '24/7 Round the Clock Service' },
  'about.office.receptionTitle': { ar: 'هاتف الاستقبال المباشر', en: 'Direct Reception Phone' },
  'about.hours.title': { ar: 'أوقات العمل الرسمية', en: 'Official Working Hours' },
  'about.hours.desc': { ar: 'على مدار الساعة 24/7 لخدمة ضيوف الرحمن', en: '24/7 round-the-clock service for pilgrims' },
  'about.album.badge': { ar: 'ألبوم الصور والفعاليات', en: 'Photo Album & Events' },
  'about.album.title': { ar: 'صور من مقر الشركة، مكاتب الاستقبال، وفريق العمل', en: 'Photos from Company Headquarters, Reception & Team' },
  'about.album.subtitle': { ar: 'لقطات حية توثق مكاتبنا الرئيسية، قاعات الاستقبال والضيافة، وكوادرنا الميدانية المتاحة لخدمتكم على مدار الساعة.', en: 'Live captures showcasing our main offices, reception lounges, and dedicated on-ground team available 24/7.' },
  'about.album.addPng': { ar: 'إضافة صور PNG للألبوم', en: 'Add PNG Photos to Album' },

  // Contact Page
  'contact.header.badge': { ar: 'نحن في خدمتكم دائماً', en: 'Always at Your Service' },
  'contact.header.title': { ar: 'تواصل معنا واستفسر عن الحجوزات', en: 'Contact Us & Hotel Inquiries' },
  'contact.header.subtitle': { ar: 'فريق استشاريي التسكين متاح على مدار الساعة للإجابة عن تساؤلاتكم ومساعدتكم في اختيار الفندق الأمثل لرحلتكم المباركة.', en: 'Our accommodation consulting team is available 24/7 to assist with your bookings.' },
  'contact.waBanner.title': { ar: 'حجز سريع ومباشر', en: 'Quick Direct Booking' },
  'contact.waBanner.desc': { ar: 'تواصل فوراً مع مستشار الحجز للحصول على أسعار الغرف وتأكيد الحجز الفوري.', en: 'Chat immediately with our booking consultant for rates and instant reservation.' },
  'contact.waBanner.open': { ar: 'فتح محادثة واتساب الآن', en: 'Open WhatsApp Chat Now' },
  'contact.callDirect': { ar: 'اتصال هاتفي مباشر', en: 'Direct Phone Call' },
  'contact.emailDirect': { ar: 'البريد الإلكتروني', en: 'Email Address' },
  'contact.form.title': { ar: 'أرسل لنا استفسارك أو طلب الحجز', en: 'Send Your Inquiry or Booking Request' },
  'contact.form.subtitle': { ar: 'املأ النموذج التالي وسيقوم مستشار التسكين بالتواصل معك خلال دقائق معدودة.', en: 'Fill out the form below and our consultant will get in touch within minutes.' },
  'contact.form.name': { ar: 'الاسم الكريم', en: 'Full Name' },
  'contact.form.phone': { ar: 'رقم الجوال / الواتساب', en: 'Mobile / WhatsApp' },
  'contact.form.email': { ar: 'البريد الإلكتروني', en: 'Email Address' },
  'contact.form.city': { ar: 'المدينة المفضلة للتسكين', en: 'Preferred City' },
  'contact.form.guests': { ar: 'عدد الضيوف المطلوب تسكينهم', en: 'Number of Guests' },
  'contact.form.message': { ar: 'نص الرسالة أو تفاصيل الحجز المطلوبة', en: 'Message / Booking Details' },
  'contact.form.submit': { ar: 'إرسال الرسالة الآن', en: 'Send Message Now' },
  'contact.form.submitting': { ar: 'جاري الإرسال...', en: 'Sending...' },
  'contact.form.success': { ar: 'تم استلام رسالتكم بنجاح! سيتواصل معكم مستشار الحجز قريباً.', en: 'Your message has been received! Our consultant will contact you shortly.' },
  'contact.offices.title': { ar: 'فروعنا ومكاتبنا الميدانية', en: 'Our Field Branches & Offices' },
  'contact.branchMakkah': { ar: 'فرع مكة المكرمة الرئيسي', en: 'Main Makkah Branch' },
  'contact.branchMadinah': { ar: 'فرع المدينة المنورة', en: 'Madinah Branch' },

  // Footer
  'footer.brand.title': { ar: 'برستيج لإدارة وتشغيل الفنادق', en: 'Prestige Hotels Management' },
  'footer.brand.subtitle': { ar: 'إدارة وتشغيل الفنادق والضيافة الفاخرة', en: 'Hotel Management & Operations' },
  'footer.brand.bio': { ar: 'شركة برستيج الرائدة والمتخصصة في تقديم حلول إدارة وتشغيل الفنادق والتسكين الفاخر لحجاج بيت الله الحرام وزوار المسجد النبوي الشريف في مكة المكرمة والمدينة المنورة، بخبرة تمتد لأكثر من ١٥ عاماً من التميز والاحترافية.', en: 'Leading company dedicated to providing hotel management, operations, and luxury accommodation solutions for pilgrims and visitors to the Two Holy Mosques, with over 15 years of excellence.' },
  'footer.brand.license': { ar: 'مرخصون من وزارة الحج والعمرة والهيئة السعودية للسياحة', en: 'Licensed by the Ministry of Hajj & Umrah and Saudi Tourism Authority' },
  'footer.links.heading': { ar: 'روابط سريعة', en: 'Quick Links' },
  'footer.branches.heading': { ar: 'فروعنا وتواصل الحجز', en: 'Our Official Branches' },
  'footer.contact.heading': { ar: 'خدمة العملاء والتواصل', en: 'Direct Contact & Inquiries' },
  'footer.contact.desc': { ar: 'فريق الاستقبال والحجوزات متاح على مدار الساعة طوال أيام الأسبوع لخدمتكم واستقبال استفساراتكم.', en: 'Our reception and booking team is available 24/7 to assist you and receive all inquiries.' },
  'footer.whatsapp.buttonText': { ar: 'تحدث مع مستشار التسكين واتساب', en: 'Inquire on WhatsApp (24/7)' },
  'footer.contact.buttonText': { ar: 'تواصل معنا للحجز والاستفسار', en: 'Contact Us for Inquiries' },
  'footer.channels.label': { ar: 'قنوات التواصل المعتمدة:', en: 'Certified Contact Channels:' },
  'footer.bottom.copyrightText': { ar: 'لإدارة وتشغيل الفنادق والضيافة. جميع الحقوق محفوظة.', en: 'Hotel Management & Hospitality. All rights reserved.' },
  'footer.bottom.adminLink': { ar: 'بوابة المشرفين (لوحة التحكم)', en: 'Admin Portal' },
  'footer.bottom.privacy': { ar: 'سياسة الخصوصية والشروط', en: 'Privacy Policy & Terms' },
  'footer.rights': { ar: 'جميع الحقوق محفوظة لشركة برستيج لإدارة وتشغيل الفنادق', en: 'All rights reserved © Prestige Hotels Management & Hospitality' },

  // Footer Link Keys
  'footer.link.home': { ar: 'الرئيسية', en: 'Home' },
  'footer.link.hotels': { ar: 'جميع فنادق مكة والمدينة', en: 'All Hotels' },
  'footer.link.hotels-makkah': { ar: 'فنادق مكة المكرمة', en: 'Makkah Hotels' },
  'footer.link.hotels-madinah': { ar: 'فنادق المدينة المنورة', en: 'Madinah Hotels' },
  'footer.link.packages': { ar: 'باقات الحج والعمرة', en: 'Hajj & Umrah Packages' },
  'footer.link.offers': { ar: 'الإعلانات والعروض', en: 'Ads & Offers' },
  'footer.link.about': { ar: 'من نحن', en: 'About Us' },
  'footer.link.contact': { ar: 'تواصل معنا', en: 'Contact Us' },
  'footer.link.admin': { ar: 'لوحة التحكم', en: 'Admin Dashboard' },

  // WhatsApp Floating Action Button & Lightbox
  'common.whatsapp.fabLabel': { ar: 'تواصل معنا على واتساب', en: 'Chat on WhatsApp' },
  'common.whatsapp.fabTooltip': { ar: 'حجز واستفسار سريع عبر واتساب (متاح 24/7)', en: 'Quick WhatsApp Booking & Inquiry (24/7)' },
  'lightbox.close': { ar: 'إغلاق (Esc)', en: 'Close (Esc)' },
  'lightbox.prev': { ar: 'السابق', en: 'Previous' },
  'lightbox.next': { ar: 'التالي', en: 'Next' },
  'lightbox.itemCount': { ar: 'عنصر {current} من {total}', en: 'Item {current} of {total}' },
  'lightbox.mute': { ar: 'كتم الصوت', en: 'Mute Audio' },
  'lightbox.unmute': { ar: 'تشغيل الصوت', en: 'Unmute Audio' },
  'lightbox.fullscreen': { ar: 'شاشة كاملة', en: 'Fullscreen' },

  // General & Common UI words
  'common.close': { ar: 'إغلاق', en: 'Close' },
  'common.save': { ar: 'حفظ', en: 'Save' },
  'common.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'common.loading': { ar: 'جاري التحميل...', en: 'Loading...' },
  'common.sar': { ar: 'ر.س', en: 'SAR' },
  'common.meter': { ar: 'متر', en: 'm' },
  'common.stars': { ar: 'نجوم', en: 'Stars' },
  'common.viewMap': { ar: 'خرائط Google', en: 'Google Maps' },
  'common.reviews': { ar: 'تقييم', en: 'reviews' },
  'common.night': { ar: 'ليلة', en: 'night' },
  'common.hotels': { ar: 'فنادق', en: 'Hotels' }
};

// Comprehensive dynamic translation lookup table for hotel names, amenities, room types, districts, and phrases
export const DYNAMIC_TERMS_MAP: Record<string, string> = {
  // Cities
  'مكة المكرمة': 'Makkah Al-Mukarramah',
  'المدينة المنورة': 'Madinah Al-Munawwarah',
  'مكة': 'Makkah',
  'المدينة': 'Madinah',
  'فنادق مكة المكرمة': 'Makkah Hotels',
  'فنادق المدينة المنورة': 'Madinah Hotels',
  'فنادقنا المُدارة': 'Our Managed Hotels',
  'فنادق مكة والمدينة': 'Makkah & Madinah Hotels',
  'جميع فنادق مكة والمدينة': 'All Makkah & Madinah Hotels',
  'الإعلانات والعروض': 'Ads & Offers',
  'العروض والمناسبات': 'Ads & Offers',
  'باقات الحج والعمرة': 'Hajj & Umrah Packages',

  // Districts
  'أجياد': 'Ajyad',
  'اجياد': 'Ajyad',
  'محبس الجن': 'Mahbas Al-Jin',
  'العزيزية': 'Al-Aziziyah',
  'المنطقة المركزية': 'Central Area',
  'المنطقة المركزية الشمالية': 'Northern Central Area',
  'المنطقة المركزية الجنوبية': 'Southern Central Area',
  'المنطقة المركزية الغربية': 'Western Central Area',
  'جبل عمر': 'Jabal Omar',
  'إبراهيم الخليل': 'Ibrahim Al-Khalil St',
  'ريع بخش': 'Rea Bakhsh',
  'الشبيكة': 'Al-Shubaika',
  'المسفلة': 'Al-Misfalah',
  'الغزة': 'Al-Ghazza',
  'جرول': 'Jarwal',
  'الهجرة': 'Al-Hijrah',
  'بني خدرة': 'Bani Khidrah',
  'بضاعة': 'Bida\'ah',
  'سيد الشهداء': 'Sayyid Al-Shuhada',

  // Hotel Names
  'برستيج اجياد': 'Prestige Ajyad Hotel',
  'برستيج أجياد': 'Prestige Ajyad Hotel',
  'فندق برستيج اجياد': 'Prestige Ajyad Hotel',
  'فندق برستيج أجياد': 'Prestige Ajyad Hotel',
  'ميسان المقام': 'Maysan Al Maqam Hotel',
  'سويس اوتيل المقام': 'Swissôtel Al Maqam Makkah',
  'سويس أوتيل المقام': 'Swissôtel Al Maqam Makkah',
  'سويس اوتيل مكة': 'Swissôtel Makkah',
  'فيرمونت برج الساعة': 'Makkah Clock Royal Tower, A Fairmont Hotel',
  'فيرمونت برج الساعة - مكة': 'Fairmont Clock Tower Makkah',
  'دار التوحيد إنتركونتيننتال': 'Dar Al Tawhid InterContinental',
  'فندق دار التوحيد إنتركونتيننتال': 'Dar Al Tawhid InterContinental Makkah',
  'شذا المدينة': 'Shaza Al Madina',
  'شذا المدينة - المدينة المنورة': 'Shaza Al Madina',
  'أنوار المدينة موفنبيك': 'Anwar Al Madinah Mövenpick',
  'دار الإيمان إنتركونتيننتال': 'Dar Al Iman InterContinental Madinah',
  'بولمان زمزم المدينة': 'Pullman Zamzam Madina',
  'بولمان زمزم مكة': 'Pullman Zamzam Makkah',
  'رافلز قصر مكة': 'Raffles Makkah Palace',
  'المروة ريحان من روتانا': 'Al Marwa Rayhaan by Rotana',
  'أبراج مكة': 'Makkah Towers',
  'هيلتون مكة للمؤتمرات': 'Hilton Makkah Convention Hotel',
  'كونراد مكة': 'Conrad Makkah',
  'أوبروي المدينة': 'The Oberoi Madina',
  'دار التقوى المدينة': 'Dar Al Taqwa Hotel Madinah',

  // Categories
  'فنادق سنوية': 'Annual Hotels',
  'فنادق العمرة': 'Umrah Hotels',
  'فنادق رمضان': 'Ramadan Hotels',
  'عادي': 'Standard',
  'فنادق الحج': 'Hajj Hotels',
  'فنادق الصف الأول': 'First-Row Hotels',
  'إطلالة الكعبة': 'Kaaba View',
  'اقتصادي مميز': 'Budget Friendly',
  'عائلية فاخرة': 'Family Luxury',

  // View Types
  'إطلالة مباشرة على الكعبة': 'Direct Kaaba View',
  'إطلالة على الكعبة': 'Kaaba View',
  'إطلالة على ساحات الحرم': 'Haram Courtyard View',
  'إطلالة على الحرم': 'Haram View',
  'إطلالة على الحرم المكي': 'Holy Mosque View',
  'إطلالة على المسجد النبوي': 'Prophet Mosque View',
  'إطلالة على المدينة': 'City View',
  'قريب جداً من الحرم': 'Extremely Close to Haram',
  'إطلالة مميزة': 'Premier View',
  'إطلالة بانورامية': 'Panoramic View',

  // Common Amenities & Services
  'واي فاي مجاني': 'Free Wi-Fi',
  'واي فاي مجاني فائق السرعة': 'Free High-Speed Wi-Fi',
  'شامل الإفطار': 'Breakfast Included',
  'بدون إفطار': 'Room Only (No Breakfast)',
  'بوفيه مفتوح': 'Open Buffet',
  'بوفيه إفطار فاخر': 'Gourmet Breakfast Buffet',
  'خدمة الغرف': 'Room Service',
  'خدمة استقبال على مدار 24 ساعة': '24/7 Reception Desk',
  'خدمة استقبال واستعلامات على مدار 24 ساعة': '24/7 Reception & Concierge',
  'تكييف مركزي': 'Central Air Conditioning',
  'مصاعد سريعة': 'High-Speed Elevators',
  'مصاعد سريعة للساحة': 'Fast Elevators to Courtyard',
  'مصلى خاص': 'In-Hotel Prayer Hall',
  'حافلات ترددية': 'Shuttle Buses',
  'حافلات ترددية للحرم': 'Haram Shuttle Service',
  'مطاعم فاخرة': 'Luxury Restaurants',
  'مطعم فاخر': 'Fine Dining Restaurant',
  'مواقف سيارات': 'Parking Area',
  'موقف سيارات خاص': 'Private Parking',
  'شاشات تلفزيون ذكية': 'Smart LED TV',
  'مكتب استقبال 24/7': '24/7 Front Desk'
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRtl: boolean;
  t: (key: string, fallback?: string) => string;
  translateDynamic: (text: string) => string;
  translateAsync: (text: string) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('diy_app_language');
      if (saved === 'en' || saved === 'ar') return saved;
      return 'ar';
    } catch {
      return 'ar';
    }
  });

  // Persistent dynamic translation cache in memory and localStorage
  const translationCache = useRef<Record<string, string>>((() => {
    try {
      const saved = localStorage.getItem('prestige_translations_cache');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  })());

  const [, setCacheVersion] = useState(0);
  const isRtl = language === 'ar';

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('diy_app_language', lang);
      // Sync google translate cookie for full DOM translation bridge
      document.cookie = `googtrans=/ar/${lang}; path=/;`;
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'ar' ? 'en' : 'ar';
      try {
        localStorage.setItem('diy_app_language', next);
        document.cookie = `googtrans=/ar/${next}; path=/;`;
      } catch {}
      return next;
    });
  }, []);

  // Async neural translation fetcher with caching
  const translateAsync = useCallback(async (text: string): Promise<string> => {
    if (!text || language === 'ar') return text;
    const trimmed = text.trim();
    if (!trimmed) return text;

    // Check memory cache
    const cached = translationCache.current[trimmed];
    if (cached) return cached;

    // Check direct dictionary
    if (DYNAMIC_TERMS_MAP[trimmed]) return DYNAMIC_TERMS_MAP[trimmed];
    for (const entry of Object.values(DICTIONARY)) {
      if (entry.ar === trimmed) return entry.en;
    }

    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0].map((chunk: any) => chunk[0] || '').join('');
          if (translated) {
            translationCache.current[trimmed] = translated;
            try {
              localStorage.setItem('prestige_translations_cache', JSON.stringify(translationCache.current));
            } catch {}
            setCacheVersion((v) => v + 1);
            return translated;
          }
        }
      }
    } catch (e) {
      // Fallback
    }

    return trimmed;
  }, [language]);

  // Synchronous translation with smart NLP tokenizer and background async hydration
  const translateDynamic = useCallback((text: string): string => {
    if (language === 'ar' || !text) return text;
    const trimmed = text.trim();
    if (!trimmed) return text;

    // 1. Memory Cache hit
    if (translationCache.current[trimmed]) {
      return translationCache.current[trimmed];
    }

    // 2. Direct hit in terms map
    if (DYNAMIC_TERMS_MAP[trimmed]) {
      return DYNAMIC_TERMS_MAP[trimmed];
    }

    // 3. Direct hit in dictionary
    for (const entry of Object.values(DICTIONARY)) {
      if (entry.ar === trimmed) {
        return entry.en;
      }
    }

    // 4. Pattern match for districts: "حي {name}" -> "{name} District"
    if (trimmed.startsWith('حي ')) {
      const distName = trimmed.replace('حي ', '').trim();
      const translatedDist = DYNAMIC_TERMS_MAP[distName] || distName;
      return `${translatedDist} District`;
    }

    // 5. Pattern match for walking minutes: "{X} دقائق سيراً للحرم"
    const walkMatch = trimmed.match(/^(\d+)\s*دقائق\s*سيراً/);
    if (walkMatch) {
      return `${walkMatch[1]} min walk to Haram`;
    }

    // 6. Pattern match for distance: "{X} متراً عن ساحة..." or "{X}م من..."
    const distMatch = trimmed.match(/^([\d\u0660-\u0669]+)\s*(?:متراً|متر|م)\s*(?:عن|من)\s*(.*)/);
    if (distMatch) {
      const rawNum = distMatch[1].replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
      const target = distMatch[2].includes('نبوي') ? 'Prophet Mosque' : 'Haram courtyards';
      return `${rawNum}m from ${target}`;
    }

    // 7. Pattern match for hotel count: "فندق {X} من {Y}"
    const countMatch = trimmed.match(/فندق\s*(\d+)\s*من\s*(\d+)/);
    if (countMatch) {
      return `Hotel ${countMatch[1]} of ${countMatch[2]}`;
    }

    // 8. Pattern match for reviews: "({X} تقييم)"
    const revMatch = trimmed.match(/\((\d+)\s*تقييم\)/);
    if (revMatch) {
      return `(${revMatch[1]} reviews)`;
    }

    // 9. If text contains Arabic characters and is longer, queue background async translation
    if (/[\u0600-\u06FF]/.test(trimmed) && trimmed.length > 3) {
      translateAsync(trimmed);
    }

    return text;
  }, [language, translateAsync]);

  // Dictionary key translator
  const t = useCallback((key: string, fallback?: string): string => {
    if (DICTIONARY[key]) {
      return DICTIONARY[key][language];
    }
    if (language === 'en' && fallback) {
      return translateDynamic(fallback);
    }
    return fallback || key;
  }, [language, translateDynamic]);

  // Sync HTML & Body tags
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.body.dir = isRtl ? 'rtl' : 'ltr';
    document.body.style.direction = isRtl ? 'rtl' : 'ltr';

    if (isRtl) {
      document.documentElement.classList.remove('font-sans-en', 'ltr-mode');
      document.body.classList.remove('ltr-layout');
    } else {
      document.documentElement.classList.add('font-sans-en', 'ltr-mode');
      document.body.classList.add('ltr-layout');
    }
  }, [language, isRtl]);

  // Automated DOM Auto-Translator for dynamic arbitrary text when in English mode
  useEffect(() => {
    if (language !== 'en') return;

    let isCancelled = false;
    const arabicRegex = /[\u0600-\u06FF]/;
    const ignoredTags = new Set(['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'CODE', 'PRE']);

    const translateElementNodes = (node: Node) => {
      if (isCancelled) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue?.trim();
        if (text && arabicRegex.test(text)) {
          // Check synchronous dictionary / cache first
          if (translationCache.current[text]) {
            node.nodeValue = translationCache.current[text];
            return;
          }
          if (DYNAMIC_TERMS_MAP[text]) {
            node.nodeValue = DYNAMIC_TERMS_MAP[text];
            return;
          }
          // Fetch dynamic translation
          translateAsync(text).then((translated) => {
            if (!isCancelled && translated && translated !== text && node.parentNode) {
              node.nodeValue = translated;
            }
          }).catch(() => {});
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (ignoredTags.has(el.tagName) || el.getAttribute('contenteditable') === 'true') {
          return;
        }
        // Also translate placeholders and titles
        const placeholder = el.getAttribute('placeholder');
        if (placeholder && arabicRegex.test(placeholder)) {
          translateAsync(placeholder).then((trans) => {
            if (!isCancelled && trans) el.setAttribute('placeholder', trans);
          }).catch(() => {});
        }
        const title = el.getAttribute('title');
        if (title && arabicRegex.test(title)) {
          translateAsync(title).then((trans) => {
            if (!isCancelled && trans) el.setAttribute('title', trans);
          }).catch(() => {});
        }

        for (let i = 0; i < node.childNodes.length; i++) {
          translateElementNodes(node.childNodes[i]);
        }
      }
    };

    // Initial pass on root
    const rootEl = document.getElementById('root') || document.body;
    translateElementNodes(rootEl);

    // Dynamic mutation observer for newly mounted elements
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((addedNode) => {
            translateElementNodes(addedNode);
          });
        } else if (mutation.type === 'characterData' && mutation.target) {
          const text = mutation.target.nodeValue?.trim();
          if (text && arabicRegex.test(text) && !translationCache.current[text]) {
            translateElementNodes(mutation.target);
          }
        }
      }
    });

    observer.observe(rootEl, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      isCancelled = true;
      observer.disconnect();
    };
  }, [language, translateAsync]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isRtl,
        t,
        translateDynamic,
        translateAsync
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'ar',
      setLanguage: () => {},
      toggleLanguage: () => {},
      isRtl: true,
      t: (_key: string, fallback?: string) => fallback || _key,
      translateDynamic: (text: string) => text,
      translateAsync: async (text: string) => text
    };
  }
  return context;
};
