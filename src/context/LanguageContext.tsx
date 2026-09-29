import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Language = 'ar' | 'en';

export interface Translations {
  [key: string]: {
    ar: string;
    en: string;
  };
}

// Comprehensive bilingual dictionary for the entire application
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
  'nav.offers': { ar: 'الإعلانات', en: 'Ads & Offers' },
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
  'hero.badge': { ar: 'الضيافة الملكية الأقرب إلى رحاب الحرمين الشريفين', en: 'Royal Hospitality Closest to the Two Holy Mosques' },
  'hero.title': { ar: 'تسكين في أرقى فنادق مكة المكرمة والمدينة المنورة', en: 'Stay at the Finest Hotels in Makkah & Madinah' },
  'hero.subtitle': { ar: 'نوفر لضيوف الرحمن وشركات السياحة أفضل خيارات الإقامة في فنادق الصف الأول المقابلة للحرم المكي والمسجد النبوي، مع تسهيلات حجز معتمدة ومباشرة.', en: 'Providing pilgrims and travel agencies with premier first-row accommodation directly facing the Grand Mosque and Prophet’s Mosque, with certified direct bookings.' },
  'hero.exploreHotels': { ar: 'استعرض الفنادق المتاحة', en: 'Explore Available Hotels' },
  'hero.contactConsultant': { ar: 'تواصل مع مستشار الحجز', en: 'Contact Booking Consultant' },
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
  'home.offers.badge': { ar: 'عروض حصرية محدودة', en: 'Exclusive Limited Offers' },
  'home.offers.title': { ar: 'تصفح أحدث تصاميم وبوسترات عروض المواسم والمناسبات', en: 'Browse Latest Seasonal & Event Offers and Posters' },
  'home.offers.btn': { ar: 'استعراض قسم الإعلانات والعروض', en: 'Explore Ads & Offers' },

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
  'offers.header.badge': { ar: 'مواسم البركة والخصومات الحصرية', en: 'Seasons of Blessing & Exclusive Discounts' },
  'offers.header.title': { ar: 'الإعلانات والعروض الخاصة', en: 'Special Ads & Seasonal Offers' },
  'offers.header.subtitle': { ar: 'استفد من أقوى العروض الموسمية لحجوزات الحج والعمرة، مع خصومات حصرية على باقات التسكين وفنادق مكة والمدينة.', en: 'Benefit from seasonal Hajj & Umrah accommodation deals with exclusive discounts in Makkah and Madinah.' },
  'offers.promoVideo': { ar: 'فيديو دعائي', en: 'Promo Video' },
  'offers.posterBadge': { ar: 'بوستر العرض', en: 'Offer Poster' },
  'offers.discountOff': { ar: 'خصم {discount}٪', en: '{discount}% OFF' },
  'offers.endsIn': { ar: 'ينتهي العرض خلال:', en: 'Offer ends in:' },
  'offers.fullDetails': { ar: 'تفاصيل العرض الكاملة', en: 'Full Offer Details' },
  'offers.bookViaWhatsApp': { ar: 'احجز هذا العرض عبر الواتساب', en: 'Book This Offer via WhatsApp' },
  'offers.closeModal': { ar: 'إغلاق النافذة', en: 'Close Window' },
  'offers.empty.title': { ar: 'لا توجد عروض موسمية نشطة حالياً', en: 'No Active Seasonal Offers Currently' },
  'offers.empty.desc': { ar: 'تابعونا باستمرار للاطلاع على أحدث عروض مواسم الحج والعمرة والاعتكاف في الحرمين الشريفين.', en: 'Stay tuned for upcoming Hajj, Umrah, and Ramadan stay packages.' },
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
  'footer.link.hotels': { ar: 'فنادقنا المُدارة', en: 'Hotels' },
  'footer.link.packages': { ar: 'باقات الحج والعمرة', en: 'Hajj & Umrah Packages' },
  'footer.link.offers': { ar: 'الإعلانات', en: 'Ads & Offers' },
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

  // Districts
  'أجياد': 'Ajyad',
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

  // Hotel Names (Arabized -> English Brand Names)
  'برستيج اجياد': 'Prestige Ajyad Hotel',
  'برستيج أجياد': 'Prestige Ajyad Hotel',
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

  // Core Value Pillars
  'المصداقية المطلقة': 'Absolute Integrity',
  'رعاية وتواجد ميداني': 'On-Ground Field Support',
  'عقود مباشرة وأفضل الأسعار': 'Direct Contracts & Best Rates',
  'ما تراه وتتفق عليه هو ما تجده تماماً، دون مفاجآت في المسافة أو مستوى الغرفة أو الخدمات المتفق عليها.': 'What you see and agree upon is exactly what you receive, with no surprises in distances, room standards, or agreed services.',
  'فريقنا الميداني في مكة المكرمة والمدينة المنورة على أهبة الاستعداد على مدار الساعة لاستقبالكم وتلبية كافة متطلباتكم.': 'Our field representatives in Makkah and Madinah are on standby 24/7 to welcome you and assist with all your requirements.',
  'عقود موسمية وسنوية مباشرة مع كبرى فنادق الحرمين تتيح لنا تقديم أسعار حصرية ومنافسة تلبي كافة الميزانيات.': 'Direct seasonal and annual contracts with premier Haramain hotels enable us to offer exclusive, competitive rates for all budgets.',
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

  // Distance Phrases
  '٢٥٠ متراً عن ساحة الحرم المكي (شارع أجياد)': '250m from Holy Mosque courtyards (Ajyad St)',
  '١٠٠ متراً عن ساحة الحرم المكي (إطلالة مباشرة)': '100m from Holy Mosque courtyards (Direct View)',
  '٣٥٠ متراً عن الحرم المكي (شارع أجياد)': '350m from Holy Mosque (Ajyad St)',
  '٤٠٠ متراً عن الحرم المكي الشريف': '400m from the Holy Mosque',
  '١٥٠ متراً عن المسجد النبوي الشريف': '150m from Prophet Mosque',
  '٥٠ متراً عن ساحات المسجد النبوي': '50m from Prophet Mosque courtyards',
  '٢٠٠ متراً عن المسجد النبوي الشريف': '200m from Prophet Mosque',
  '١٠٠ متراً عن ساحة الحرم النبوي': '100m from Prophet Mosque courtyards',
  '١٥٠ متراً عن ساحة الحرم المكي': '150m from Holy Mosque courtyards',
  '٥٠ متراً عن ساحة الحرم المكي': '50m from Holy Mosque courtyards',

  // Common Amenities & Services
  'مسافة 4 دقائق سيراً إلى ساحات الحرم المكي': '4-minute walk to Grand Mosque courtyards',
  'واي فاي فائق السرعة مجاني في الغرف واللوبي': 'Free high-speed Wi-Fi in rooms and lobby',
  'واي فاي مجاني فائق السرعة': 'Free High-speed Wi-Fi',
  'واي فاي مجاني': 'Free Wi-Fi',
  'بوفيه مفتوح مع تشكيلة أطباق عالمية وشرقية': 'Open buffet with international and oriental dishes',
  'إفطار بوفيه فاخر مجاني': 'Complimentary Buffet Breakfast',
  'إفطار بوفيه مفتوح': 'Open Buffet Breakfast',
  'شامل الإفطار': 'Breakfast Included',
  'بدون إفطار': 'Room Only (No Breakfast)',
  'شامل الإفطار والعشاء': 'Half Board (Breakfast & Dinner)',
  'شامل جميع الوجبات': 'Full Board (All Meals)',
  'خدمة استقبال واستعلامات على مدار 24 ساعة': '24/7 reception and concierge service',
  'خدمة استقبال على مدار 24 ساعة': '24/7 Reception Desk',
  'خدمة كونسيرج واستقبال 24/7': '24/7 Concierge & Reception',
  'خدمة كونسيرج وغرف VIP 24 ساعة': '24/7 Concierge & VIP room service',
  'خدمة الغرف على مدار 24 ساعة': '24/7 Room Service',
  'تكييف مركزي متطور مع تحكم فردي': 'Advanced central AC with individual control',
  'تكييف مركزي': 'Central Air Conditioning',
  'مصاعد حديثة وسريعة': 'Modern high-speed elevators',
  'مصاعد سريعة ومهيأة لكبار السن': 'High-Speed Elevators for Seniors',
  'شاشات تلفزيون ذكية ونظام صوتي متصل بالحرم': 'Smart TVs with direct Haram audio system',
  'شاشات تلفزيون ذكية': 'Smart LED TV',
  'إطلالة مباشرة على ساحات الحرم المكي الشريف': 'Direct view of the Holy Mosque courtyards',
  'دقيقتان سيراً فقط لساحات الصلاة': 'Only 2-minute walk to prayer courtyards',
  'بوفيه إفطار ملكي مفتوح يومياً': 'Daily royal open buffet breakfast',
  'مصلى خاص متصل بنظام صوت الحرم المكي': 'Private prayer hall linked to Haram audio',
  'مصلى خاص داخل الفندق': 'In-Hotel Prayer Hall',
  'إنترنت عالي السرعة في جميع المرافق': 'High-speed internet in all areas',
  'إنترنت فائق السرعة مجاني': 'Free high-speed internet',
  'حافلات نقل ترددية مجانية على مدار 24 ساعة': '24/7 Free Shuttle Bus to Haram',
  'حافلات ترددية للحرم': 'Haram Shuttle Service',
  'حافلات ترددية': 'Shuttle Buses',
  'مطاعم عالمية ومحلية راقية': 'Fine Dining & Global Restaurants',
  'مطاعم فاخرة': 'Luxury Restaurants',
  'مطعم فاخر': 'Fine Dining Restaurant',
  'موقف سيارات خاص': 'Private Parking',
  'مواقف سيارات خاصة وخدمة صف السيارات': 'Private parking & valet service',
  'إطلالة بانورامية ساحرة على الكعبة المشرفة والحرم': 'Panoramic breathtaking view of the Holy Kaaba & Haram',
  'مدخل مباشر من أبراج البيت إلى ساحات الحرم': 'Direct entrance from Abraj Al-Bait to Haram courtyards',
  'مطاعم عالمية فاخرة تقدم أرقى المأكولات': 'Luxury global fine-dining restaurants',
  'خدمة غرف فاخرة وخدمة المساعد الشخصي': 'Luxury room service & butler service',
  'مركز أعمال وصالونات استقبال فخمة': 'Business center & luxury VIP lounges',
  'خطوات معدودة من ساحة الحرم النبوي الشريف': 'Few steps from the Prophet Mosque courtyards',
  'تصميم عربي وإسلامي فاخر مفعم بالسكينة': 'Luxurious Islamic & Arabic design filled with serenity',
  'بوفيه إفطار عالمي متنوع وغني': 'Rich international buffet breakfast',
  'صالون شاي ومقهى راقٍ في بهو الفندق': 'Elegant tea lounge & café in hotel lobby',
  'خدمات استقبال وإرشاد على مدار الساعة': '24/7 reception & tour assistance',
  'إطلالة فريدة ومباشرة على ساحات المسجد النبوي الشريف': 'Unique direct view of Prophet Mosque courtyards',
  'أجنحة عائلية وغرف تنفيذية مجهزة بأحدث وسائل الراحة': 'Family suites & executive rooms with state-of-the-art comforts',
  'مطاعم متعددة تقدم بوفيهات مفتوحة وقوائم طعام شرقية وغربية': 'Multiple restaurants serving international & oriental buffets',
  'خدمة تنظيف وغسيل الملابس السريعة': 'Fast laundry and dry cleaning service',
  'مكتب حجوزات وتنظيم زيارات المزارات والمعالم الدينية': 'Tour & historical site excursions desk',

  // Room Types
  'غرفة ثنائية قياسية': 'Standard Twin / Double Room',
  'غرفة ثنائية': 'Twin Room',
  'غرفة ثلاثية': 'Triple Room',
  'غرفة رباعية عائلية': 'Family Quad Room',
  'غرفة رباعية': 'Quad Room',
  'جناح جونيور': 'Junior Suite',
  'جناح تنفيذي مطل على الحرم': 'Executive Suite with Haram View',
  'جناح رئاسي مطل على الكعبة': 'Presidential Suite with Kaaba View',
  'سرير كينج': 'King Bed',
  'سريران مفردان': '2 Single Beds',
  '3 أسرة مفردة': '3 Single Beds',
  '4 أسرة مفردة': '4 Single Beds',

  // Default Testimonials
  'المهندس عبدالرحمن السعيد': 'Eng. Abdulrahman Al-Saeed',
  'معتمر من دولة الكويت': 'Pilgrim from Kuwait',
  'تجربة إقامة تفوق الوصف! المصداقية العالية في حجز الغرفة المطلة وسرعة تسجيل الدخول بدون أي انتظار جعلت رحلتنا مع الوالدة في قمة الراحة والسكينة.':
    'An accommodation experience beyond words! The high credibility in reserving the view room and rapid check-in with zero waiting made our trip with my mother deeply serene and comfortable.',
  'الأستاذ طارق بن فيصل': 'Mr. Tariq Bin Faisal',
  'منظم رحلات سياحية - الإمارات': 'Tour Operator - UAE',
  'نتعامل مع شركة برستيج لتسكين مجموعاتنا منذ ٤ سنوات. الالتزام بالوعود والأسعار المميزة والمتابعة الميدانية الدائمة تجعلهم شريكنا الأول والموثوق دائماً.':
    'We have partnered with Prestige Hotels Management for our group accommodation for 4 years. Punctual commitments, premier rates, and continuous on-ground support make them our foremost trusted partner.',
  'الدكتور محمد فاروق': 'Dr. Mohamed Farouk',
  'حاج ومعتمر من مصر': 'Pilgrim from Egypt',
  'قرب الفندق المباشر من ساحة الحرم المكي ساعد والدي المسن على أداء كل الصلوات في المسجد الحرام دون مشقة. شكراً لفريق شركة برستيج على حسن الضيافة والاهتمام.':
    'The hotel’s direct proximity to the Grand Mosque courtyards helped my elderly father attend all prayers with total ease. Thank you to the Prestige Hotels Management team for outstanding hospitality and care.',

  // Default Offers
  'عرض رمضان المبارك - فندق برستيج اجياد': 'Blessed Ramadan Offer - Prestige Ajyad Hotel',
  'إقامة فاخرة على بُعد خطوات من الحرم المكي مع بوفيه إفطار وسحور فاخر.':
    'Luxury accommodation steps from the Holy Mosque with gourmet Iftar & Suhoor buffet.',
  'عش الأجواء الروحانية لشهر رمضان المبارك في فندق برستيج أجياد بالقرب من ساحة الحرم المكي الشريف.\n\nيشمل العرض:\n- إقامة راقية في غرف وأجنحة مجهزة.\n- بوفيه إفطار وسحور ملكي يومياً.\n- خدمة استقبال ومساعدة على مدار الساعة.\n- إنترنت سريع مجاني.':
    'Experience the spiritual atmosphere of the blessed month of Ramadan at Prestige Ajyad Hotel near the Holy Mosque courtyards.\n\nOffer includes:\n- Elegant stay in equipped rooms & suites.\n- Daily royal Iftar & Suhoor buffet.\n- 24/7 reception and assistance.\n- Free high-speed internet.',
  'عرض رمضان': 'Ramadan Offer',
  'باقة العمرة المتميزة - فندق ميسان المقام': 'Premium Umrah Package - Maysan Al-Maqam Hotel',
  'إطلالة بانورامية مباشرة على ساحات الحرم وبوفيه ملكي مفتوح.':
    'Direct panoramic view of Haram courtyards with open royal buffet.',
  'استمتع بأعلى درجات الراحة والسكينة في ميسان المقام على بُعد 100 متر فقط من ساحة الحرم.\n\nيشمل العرض ترقية مجانية للغرف حسب التوافر وبوفيه إفطار ملكي متكامل.':
    'Enjoy utmost serenity and comfort at Maysan Al-Maqam, only 100 meters from Haram courtyards.\n\nOffer includes complimentary room upgrade subject to availability and full royal breakfast buffet.',
  'باقة مميزة': 'Special Package',
  'عرض الإقامة الاقتصادية والعائلية - فندق اركان بكه': 'Budget & Family Stay Offer - Arkan Bakkah Hotel',
  'غرف عائلية واسعة مع حافلات نقل ترددي مجاني للحرم على مدار 24 ساعة.':
    'Spacious family rooms with 24/7 complimentary shuttle buses to the Holy Mosque.',
  'الخيار الأفضل للمجموعات والعائلات الباحثين عن إقامة مريحة وواسعة مع مواصلات مجانية سريعة ومستمرة لبوابات الحرم المكي.':
    'The top choice for families and groups seeking spacious, comfortable stays with free 24/7 rapid shuttle transit to Haram gates.',
  'نقل مجاني 24/7': 'Free 24/7 Shuttle'
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRtl: boolean;
  t: (key: string, fallback?: string) => string;
  translateDynamic: (text: string) => string;
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

  const isRtl = language === 'ar';

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('diy_app_language', lang);
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'ar' ? 'en' : 'ar';
      try {
        localStorage.setItem('diy_app_language', next);
      } catch {}
      return next;
    });
  }, []);

  // Sync HTML & Body tags lang, dir, and typography classes
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

  // Dynamic helper for translating raw strings like city names, amenities, distances, etc.
  const translateDynamic = useCallback((text: string): string => {
    if (language === 'ar' || !text) return text;
    const trimmed = text.trim();

    // 1. Direct hit in terms map
    if (DYNAMIC_TERMS_MAP[trimmed]) {
      return DYNAMIC_TERMS_MAP[trimmed];
    }

    // 2. Direct hit in dictionary
    for (const entry of Object.values(DICTIONARY)) {
      if (entry.ar === trimmed) {
        return entry.en;
      }
    }

    // 3. Pattern match for districts: "حي {name}" -> "{name} District"
    if (trimmed.startsWith('حي ')) {
      const distName = trimmed.replace('حي ', '').trim();
      const translatedDist = DYNAMIC_TERMS_MAP[distName] || distName;
      return `${translatedDist} District`;
    }

    // 4. Pattern match for walking minutes: "{X} دقائق سيراً للحرم"
    const walkMatch = trimmed.match(/^(\d+)\s*دقائق\s*سيراً/);
    if (walkMatch) {
      return `${walkMatch[1]} min walk to Haram`;
    }

    // 5. Pattern match for distance: "{X} متراً عن ساحة..." or "{X}م من..."
    const distMatch = trimmed.match(/^([\d\u0660-\u0669]+)\s*(?:متراً|متر|م)\s*(?:عن|من)\s*(.*)/);
    if (distMatch) {
      const rawNum = distMatch[1].replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
      const target = distMatch[2].includes('نبوي') ? 'Prophet Mosque' : 'Haram courtyards';
      return `${rawNum}m from ${target}`;
    }

    // 6. Pattern match for count: "فندق {X} من {Y}"
    const countMatch = trimmed.match(/فندق\s*(\d+)\s*من\s*(\d+)/);
    if (countMatch) {
      return `Hotel ${countMatch[1]} of ${countMatch[2]}`;
    }

    // 7. Pattern match for reviews: "({X} تقييم)"
    const revMatch = trimmed.match(/\((\d+)\s*تقييم\)/);
    if (revMatch) {
      return `(${revMatch[1]} reviews)`;
    }

    return text;
  }, [language]);

  // Translator function for dictionary keys with fallback
  const t = useCallback((key: string, fallback?: string): string => {
    if (DICTIONARY[key]) {
      return DICTIONARY[key][language];
    }
    // If in English and a fallback exists, dynamically translate it
    if (language === 'en' && fallback) {
      return translateDynamic(fallback);
    }
    return fallback || key;
  }, [language, translateDynamic]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isRtl,
        t,
        translateDynamic
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
      translateDynamic: (text: string) => text
    };
  }
  return context;
};
