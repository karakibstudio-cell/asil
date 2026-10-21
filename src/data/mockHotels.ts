// Instant Initial Data Seed (0ms Load Time - Zero Latency for New Clients)
import { Hotel, Offer, HotelReview, SiteSettings } from '../types';
import { DEFAULT_ACTION_BUTTONS } from '../utils/actionButtons';

export const INITIAL_HOTELS: Hotel[] = [
  {
    "id": "hotel_test_1790703048618",
    "name": "فندق برستيج اجياد",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "أجياد",
    "stars": 4,
    "distanceToHaram": 450,
    "distanceText": "7 دقائق سيراً للحرم",
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
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791378975751_bhxard.webp",
    "galleryImages": [],
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
      "viewType": "ساحة الحرم",
      "mealPlans": [
        {
          "id": "meal_none",
          "name": "بدون وجبات (إقامة فقط)",
          "type": "room_only",
          "price": 0,
          "nameEn": "Room Only",
          "isActive": true,
          "description": "إقامة مريحة في الغرفة مع حرية اختيار وجباتك خارج الفندق",
          "pricingBasis": "per_person_per_night",
          "pricePerPersonPerNight": 0
        },
        {
          "id": "meal_breakfast",
          "name": "شامل بوفيه إفطار ",
          "type": "breakfast",
          "price": 50,
          "nameEn": "Bed & Breakfast Buffet",
          "hotelId": "hotel_test_1790703048618",
          "isActive": true,
          "description": "بوفيه إفطار يومي متنوع يضم تشكيلة شرقية وغربية طازجة",
          "pricingBasis": "per_person_per_night",
          "pricePerPersonPerNight": 50
        },
        {
          "id": "meal_half_board",
          "name": "نصف إقامة (إفطار + عشاء)",
          "type": "half_board",
          "price": 0,
          "nameEn": "Half Board (Breakfast & Dinner)",
          "isActive": false,
          "description": "بوفيه إفطار صباحي مفتوح + وجبة عشاء فاخرة يومياً",
          "pricingBasis": "per_person_per_night",
          "pricePerPersonPerNight": 95
        },
        {
          "id": "meal_full_board",
          "name": "إقامة كاملة (إفطار + غداء + عشاء)",
          "type": "full_board",
          "price": 0,
          "nameEn": "Full Board (All 3 Meals)",
          "isActive": false,
          "description": "تجربة ضيافة ملكية متكاملة تشمل الإفطار والغداء والعشاء يومياً",
          "pricingBasis": "per_person_per_night",
          "pricePerPersonPerNight": 140
        }
      ],
      "showStars": true,
      "showRating": true,
      "showDistrict": true,
      "transportType": "walking",
      "showCategories": false,
      "metaDescription": "",
      "showDistanceBadge": false,
      "showTransportInfo": false,
      "customClassification": "",
      "onlineBookingEnabled": true
    },
    "keywords": "فنادق مكة",
    "onlineBookingEnabled": true
  },
  {
    "id": "hotel_1791233101522",
    "name": "فندق ميسان المقام",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "أجياد",
    "stars": 4,
    "distanceToHaram": 800,
    "distanceText": "8 دقائق سيراً للحرم",
    "walkingTimeMinutes": 8,
    "featured": true,
    "isActive": true,
    "order": 2,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791378997732_6ix65m.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/main_1791240473782.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_0_1791240475238.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_1_1791240475920.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_2_1791240476559.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_3_1791240477546.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_4_1791240478190.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_5_1791240478860.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_6_1791240479607.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_7_1791240480328.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_8_1791240481063.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_9_1791240481780.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_10_1791240482480.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_11_1791240483294.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_12_1791240484036.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233101522/gallery_13_1791240484807.webp",
        "category": "views",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "ملاذ هادئ يوفر إقامة استثنائية تمزج بين الهدوء التام والقرب الاستراتيجي من ساحات الحرم",
    "detailedDescription": " خيار مثالي لمن يبحث عن سهولة الوصول إلى الحرم مع الابتعاد عن صخب الشوارع الرئيسية. يقدم الفندق غرفاً مرتبة بعناية، ومرافق مريحة، وخدمات غرف تلبي كافة احتياجات المعتمرين على مدار الساعة لضمان تجربة إيمانية متكاملة.",
    "amenities": [
      "واي فاي مجاني",
      "مصاعد سريعة",
      "خدمة غرف 24/7",
      "قريب من الحرم"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/GLJRRHS1ymt8BHcb7",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 2,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "ساحة الحرم",
      "transportType": "walking",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791233437644",
    "name": "فندق أورنسيس الحرم",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "أجياد",
    "stars": 4,
    "distanceToHaram": 1000,
    "distanceText": "15 دقائق سيراً للحرم",
    "walkingTimeMinutes": 15,
    "featured": true,
    "isActive": true,
    "order": 3,
    "categories": [
      "فنادق العمرة",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379008807_s0jej8.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233437644/main_1791240493308.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233437644/gallery_0_1791240494222.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233437644/gallery_1_1791240494885.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233437644/gallery_2_1791240495515.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233437644/gallery_3_1791240495970.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233437644/gallery_4_1791240496429.webp",
        "category": "lobby",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "فندق يجمع بين الأناقة العصرية والضيافة الأصيلة، مصمم لتقديم راحة فائقة بعد أداء المناسك",
    "detailedDescription": "يتميز الفندق بنظام تسكين سلس ومرافق حديثة تلبي تطلعات الأفراد والمجموعات. يقدم غرفاً مجهزة بعناية فائقة لتوفير بيئة مريحة للراحة والاسترخاء، مع سهولة الوصول إلى الحرم المكي الشريف عبر مسارات أجياد المعروفة",
    "amenities": [
      "واي فاي مجاني",
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/uHshggCLJrHADYhL6",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 3,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "ساحة الحرم",
      "transportType": "walking",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791233647004",
    "name": "فندق فجر البديع 5",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "المسفلة",
    "stars": 3,
    "distanceToHaram": 1200,
    "distanceText": "15 دقائق سيراً للحرم",
    "walkingTimeMinutes": 15,
    "featured": true,
    "isActive": true,
    "order": 4,
    "categories": [
      "فنادق العمرة",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379026915_j7zs0j.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/main_1791240510891.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_0_1791240511551.webp",
        "category": "rooms",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_1_1791240512190.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_2_1791240512836.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_3_1791240513524.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_4_1791240514146.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_5_1791240514609.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_6_1791240515038.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_7_1791240515809.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_8_1791240516754.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_9_1791240517318.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_10_1791240517984.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_11_1791240518686.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_12_1791240519348.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_13_1791240520034.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_14_1791240520676.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_15_1791240521394.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233647004/gallery_16_1791240521881.webp",
        "category": "facilities",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "يقع في شريان مكة النابض بالحياة، ليوفر سهولة الوصول للأسواق والخدمات مع الحفاظ على هدوء الإقامة.",
    "detailedDescription": "بفضل موقعه الاستراتيجي على شارع إبراهيم الخليل، يمنح النزلاء تجربة متكاملة تجمع بين التسوق وتوفر الخدمات المحيطة وسهولة المشي المباشر للحرم. يتميز الفندق ببيئة داخلية هادئة ونظيفة، وإدارة تضع راحة المعتمر كأولوية قصوى.",
    "amenities": [
      "إطلالة على الحرم",
      "واي فاي مجاني",
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/tWaVT2TTKTGxBmhN7",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 4,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة حرم",
      "transportType": "walking",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791233836261",
    "name": "ملتقى العبادة",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "المسفلة",
    "stars": 3,
    "distanceToHaram": 1500,
    "distanceText": "20 دقائق سيراً للحرم",
    "walkingTimeMinutes": 20,
    "featured": true,
    "isActive": true,
    "order": 5,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي",
      "فنادق سنوية"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379061334_9fu5c9.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/main_1791240522724.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/gallery_0_1791240523609.webp",
        "category": "facilities",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/gallery_1_1791240524491.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/gallery_2_1791240524983.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/gallery_3_1791240525409.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/gallery_4_1791240526100.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/gallery_5_1791240526550.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/gallery_6_1791240527232.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/gallery_7_1791240527971.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/gallery_8_1791240528630.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/gallery_9_1791240529063.webp",
        "category": "views",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/gallery_10_1791240529519.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791233836261/gallery_11_1791240530165.webp",
        "category": "rooms",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "مساحة من السكينة تلبي كافة احتياجات ضيوف الرحمن بأسعار تنافسية وخدمة احترافية",
    "detailedDescription": "وفر الفندق بيئة روحانية مريحة تعين على الطاعة والعبادة، مع غرف مرتبة ومجهزة بخدمات متكاملة. يتميز بفريق استقبال احترافي يحرص على تقديم الدعم السريع للنزلاء، وتوفير أجواء هادئة بعد يوم طويل في رحاب الحرم.",
    "amenities": [
      "إطلالة على الحرم",
      "واي فاي مجاني",
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/TK3F2a2DUAqsETdw5",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 5,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على المدينة",
      "transportType": "walking",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791234018923",
    "name": "فندق سرايا الجوار",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "محبس الجن (مظلات )",
    "stars": 3,
    "distanceToHaram": 2500,
    "distanceText": "5 دقائق بالحافلة للحرم (ترددي 24/7)",
    "walkingTimeMinutes": 5,
    "featured": true,
    "isActive": true,
    "order": 6,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379079618_iawhde.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234018923/main_1791240506969.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234018923/gallery_0_1791240507883.webp",
        "category": "rooms",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234018923/gallery_1_1791240508502.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234018923/gallery_2_1791240508952.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234018923/gallery_3_1791240509634.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234018923/gallery_4_1791240510151.webp",
        "category": "rooms",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "خيار العائلات المفضل في محبس الجن، يتميز بمساحات واسعة وخدمة عملاء فائقة",
    "detailedDescription": "يوفر الفندق بيئة آمنة ومريحة للإقامات العائلية والمجموعات، مع غرف مصممة بعناية لاستيعاب الأعداد بأريحية. موقعه يوفر سهولة تامة ومباشرة في استخدام باصات النقل الترددي المتجهة فوراً إلى ساحات الحرم",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/fYKTrxjLNXo4ZfAPA",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 6,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على المدينة",
      "transportType": "bus",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791234182720",
    "name": "فندق نخبة الجوار",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "محبس الجن (مظلات )",
    "stars": 3,
    "distanceToHaram": 2500,
    "distanceText": "5 دقائق بالحافلة للحرم (ترددي 24/7)",
    "walkingTimeMinutes": 5,
    "featured": true,
    "isActive": true,
    "order": 7,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379109485_s90q86.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234182720/main_1791240531160.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234182720/gallery_0_1791240532098.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234182720/gallery_1_1791240532930.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234182720/gallery_2_1791240533367.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234182720/gallery_3_1791240533945.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234182720/gallery_4_1791240534421.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234182720/gallery_5_1791240534890.webp",
        "category": "lobby",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "يمثل المرونة والسعة الاستيعابية العالية، مصمم لاستقبال الأفواج الكبيرة بكفاءة",
    "detailedDescription": "شريك استراتيجي لشركات السياحة بفضل نظامه التشغيلي الدقيق ومرافقه الواسعة التي تضمن تسكيناً سريعاً وسلساً. يقدم خدمة لا تتوقف على مدار الساعة، وغرفاً عصرية تلبي المعايير الفندقية الصارمة لتجربة إقامة خالية من المتاعب.",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/jFKXu8au79tz4Nyr6",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 7,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على المدينة",
      "transportType": "bus",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791234316651",
    "name": "فندق برج الخير",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "محبس الجن (مظلات )",
    "stars": 3,
    "distanceToHaram": 2500,
    "distanceText": "5 دقائق بالحافلة للحرم (ترددي 24/7)",
    "walkingTimeMinutes": 5,
    "featured": true,
    "isActive": true,
    "order": 8,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379122311_qpteww.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/main_1791240497433.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_0_1791240498112.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_1_1791240498624.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_2_1791240499382.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_3_1791240499883.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_4_1791240500332.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_5_1791240501012.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_6_1791240501473.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_7_1791240502333.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_8_1791240502749.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_9_1791240503397.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_10_1791240503817.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_11_1791240504482.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_12_1791240505176.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791234316651/gallery_13_1791240505839.webp",
        "category": "all",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "يجمع بين جودة الخدمات الفندقية العالية والسعر التنافسي ليكون الخيار الاقتصادي الفاخر",
    "detailedDescription": "يقدم إقامة فندقية معتمدة تحت إدارة \"برستيج\" تضمن أعلى درجات النظافة والراحة. يضم مرافق تلبي الاحتياجات الأساسية بكفاءة عالية، مما يجعله وجهة مفضلة للمعتمرين الباحثين عن القيمة الممتازة دون المساومة على الجودة أو سهولة الوصول للحرم.",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/ecPNoJX3Wg3uRFMeA",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": true,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 8,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على المدينة",
      "transportType": "bus",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791237745988",
    "name": "فندق الجاد المحبس",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "محبس الجن (مظلات )",
    "stars": 3,
    "distanceToHaram": 2500,
    "distanceText": "5 دقائق بالحافلة للحرم (ترددي 24/7)",
    "walkingTimeMinutes": 5,
    "featured": true,
    "isActive": true,
    "order": 9,
    "categories": [
      "فنادق العمرة"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379158112_cvfq14.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/main_1791240558167.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_0_1791240558856.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_1_1791240559554.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_2_1791240560371.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_3_1791240561002.webp",
        "category": "all",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_4_1791240561594.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_5_1791240562237.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_6_1791240562889.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_7_1791240563357.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_8_1791240563951.webp",
        "category": "views",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_9_1791240564776.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_10_1791240565411.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_11_1791240566081.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1791237745988/gallery_12_1791240566731.webp",
        "category": "rooms",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "ملاذ هادئ صُمم خصيصاً ليفصل النزيل عن صخب المدينة ويوفر أجواء الاسترخاء التام",
    "detailedDescription": "يقدم الفندق خدمات ضيافة متكاملة تركز على الهدوء والراحة النفسية. الغرف مؤثثة بعناية فائقة لضمان نوم هانئ بعد أداء المناسك، مع توفير كافة المستلزمات الفندقية الأساسية وخدمة غرف سريعة الاستجابة.",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/81gaBPQtkQBH32Sn7",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 9,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على المدينة",
      "transportType": "bus",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791293632067",
    "name": "فندق أورنسيس المحبس",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "محبس الجن (مظلات )",
    "stars": 3,
    "distanceToHaram": 2500,
    "distanceText": "3 دقائق بالحافلة للحرم (ترددي 24/7)",
    "walkingTimeMinutes": 3,
    "featured": true,
    "isActive": true,
    "order": 10,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474573989_kpssov.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474571007_4bmser.webp",
        "category": "lobby",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474572561_hf8hk4.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474575764_u2ps7f.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474576779_6jk57s.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474577746_n0iz64.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474578630_eiwkwx.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474579501_750jji.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474580995_2vxer2.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474581913_lipypl.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474582830_txowxq.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474583651_mnm3em.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474584275_tyljm1.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474585065_7idoy7.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474585600_etil3w.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474586302_trlf91.webp",
        "category": "rooms",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "نقطة التقاء الضيافة العربية الأصيلة مع معايير الإدارة الفندقية الحديثة والعصرية",
    "detailedDescription": "يتميز بأجواء دافئة وترحيبية من لحظة دخول بهو الفندق. تولي الإدارة اهتماماً بالغاً بأدق تفاصيل الغرف والمرافق العامة لتقديم تجربة إقامة متكاملة تعكس الكرم العربي مقترناً بالنظافة والترتيب الفندقي الاحترافي.",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/tTkkgYzBWaMN1Mnf7",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": true,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 10,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على المدينة",
      "transportType": "bus",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791294010664",
    "name": "فندق بيوت الجزيرة",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "محبس الجن (مظلات )",
    "stars": 3,
    "distanceToHaram": 2500,
    "distanceText": "3 دقائق بالحافلة للحرم (ترددي 24/7)",
    "walkingTimeMinutes": 3,
    "featured": true,
    "isActive": true,
    "order": 11,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379192462_sof028.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482295270_y24iue.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482296938_2kphlg.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482298499_377aeg.webp",
        "category": "views",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482299964_a056l9.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482300806_wi0oyg.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482301686_ic61bp.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482302642_5b09cp.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482304179_fuvf4h.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482305033_itwi70.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482306528_s60lb3.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482307364_ykrdrh.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482308212_o340oq.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482309091_mjv9om.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482309879_6nlhv5.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482310629_wy44n5.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482311490_xem68u.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482312308_omjtyu.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482313074_ijvs16.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482313895_fxhdcp.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482315114_blfeez.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791482315827_zovfbz.webp",
        "category": "rooms",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "إقامة عصرية تتميز بالسلاسة والنظافة الفائقة لتلبية احتياجات المعتمر العصري",
    "detailedDescription": "يضم الفندق غرفاً مجهزة بكافة وسائل الراحة الحديثة وتصاميم داخلية مريحة للعين. يوفر تجربة تسكين سريعة، ومرافق عامة مرتبة، مع استفادة كاملة من ميزة القرب من محطات النقل الترددي في محبس الجن لرحلات يومية يسيرة للحرم.",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/3ng7PQVmQaiL1TgY8",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 11,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على المدينة",
      "transportType": "bus",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791294153374",
    "name": "فندق صفوة الخير",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "محبس الجن (مظلات )",
    "stars": 3,
    "distanceToHaram": 2500,
    "distanceText": "5 دقائق بالحافلة للحرم (ترددي 24/7)",
    "walkingTimeMinutes": 5,
    "featured": true,
    "isActive": true,
    "order": 12,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379231124_r92qvd.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294191320_vla2tl.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294186883_ebwxer.webp",
        "category": "all",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294188619_acyar2.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294190207_d5tkf2.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294192208_9kirhr.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294193296_pqlbvr.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294194560_yrlyzt.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294195726_124ipr.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294196652_ppky1m.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294197969_dccyw4.webp",
        "category": "lobby",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "وجهة متكاملة مصممة خصيصاً لاستيعاب وراحة المجموعات والأفواج بكفاءة عالية",
    "detailedDescription": "يتمتع الفندق بقدرة تشغيلية قوية ومطاعم واسعة تقدم خدمات الإطعام المتنوعة التي تلبي مختلف الأذواق والجنسيات. يعتبر شريكاً استراتيجياً لشركات السياحة بفضل سلاسة إجراءات التسكين وتوفر المساحات العامة الواسعة للضيوف.",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/zYPg95Zq34pMSZJd9",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 12,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على المدينة",
      "transportType": "bus",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791294316950",
    "name": "فندق ميسان المحبس",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "محبس الجن (مظلات )",
    "stars": 3,
    "distanceToHaram": 2500,
    "distanceText": "5 دقائق بالحافلة للحرم (ترددي 24/7)",
    "walkingTimeMinutes": 5,
    "featured": true,
    "isActive": true,
    "order": 13,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379245110_dfodpg.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294350445_ve92cd.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294348590_0kpgxd.webp",
        "category": "lobby",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294351721_kiwwti.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294353338_ofii3u.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294355041_guk8ws.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294355975_8r5teo.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294356917_dc7fmc.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294357469_r965n6.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791294358069_yfc4ww.webp",
        "category": "rooms",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "امتداد للتميز التشغيلي لسلسلة ميسان، يركز على توفير بيئة راقية وخدمة استثنائية",
    "detailedDescription": "يضع الفندق راحة النزيل في المقام الأول عبر تقديم خدمات فندقية دقيقة تشمل النظافة الدورية، الاستقبال على مدار الساعة، والغرف الواسعة المضاءة جيداً. صُمم لضمان تجربة إيمانية متكاملة خالية من أي مجهود إضافي على المعتمر.",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/bHnt2fnho3xehWGR9",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 13,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة حرم",
      "transportType": "bus",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791295024553",
    "name": "فندق أركان بكة",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "محبس الجن (جهه المقابله )",
    "stars": 3,
    "distanceToHaram": 2500,
    "distanceText": "5 دقائق بالحافلة للحرم (ترددي 24/7)",
    "walkingTimeMinutes": 5,
    "featured": true,
    "isActive": true,
    "order": 14,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474365968_gj8q29.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474367764_66kdx5.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474369721_b6q6n8.webp",
        "category": "views",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474370506_8do0g5.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474375350_u5c2am.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474378057_myrq54.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474379269_cb62zf.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474380415_dkjk1k.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474381247_tvtf8p.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474382488_krvzei.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474383284_6dj0m8.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474384077_i754l8.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474384963_dobjuc.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474386026_4bwmw9.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474386861_q7l9i1.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474387672_lb92ox.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474388456_r7j02u.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474389518_rx948d.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474390245_wmsyaa.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474391093_03foz6.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474392306_vs42n7.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474393121_5hi1ke.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474393660_j2hrmo.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474394342_2ml4tw.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791474394868_uu6ffk.webp",
        "category": "rooms",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "الخيار الأول للباحثين عن الهدوء المطلق والخدمة الفندقية الفائقة بعيداً عن الازدحام المباشر",
    "detailedDescription": "يتميز بموقعه في الجهة المقابلة لمحبس الجن، مما يوفر له ميزة الهدوء النسبي. يضم إطلالات داخلية مريحة، غرفاً فاخرة، ومرافق تلبي تطلعات الضيوف الباحثين عن الاسترخاء التام وتجديد النشاط للصلوات القادمة.",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/BagYxUEgoxc7G1ANA",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 14,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على المدينة",
      "transportType": "bus",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791295145595",
    "name": " فندق صفوت البيت 1",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "محبس الجن (جهه المقابله )",
    "stars": 3,
    "distanceToHaram": 2500,
    "distanceText": "5 دقائق بالحافلة للحرم (ترددي 24/7)",
    "walkingTimeMinutes": 5,
    "featured": true,
    "isActive": true,
    "order": 15,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379268093_ot0oa9.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295182381_bbvc55.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295183917_jsf6m2.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295185354_gv86ma.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295185939_ouv6bq.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295187197_91wtkw.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295188125_onaniy.webp",
        "category": "views",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295189112_eac1xy.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295190203_zcpa3n.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295191343_yp4x32.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295192519_4z3n62.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295193377_fj2bdx.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295194520_sp4kn2.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295195929_k40yg7.webp",
        "category": "facilities",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "يمثل التوازن المثالي بين الموقع الاستراتيجي، جودة الخدمة، والسعر المناسب",
    "detailedDescription": "يقدم الفندق نظام مواصلات ميسر وتسكين سلس. الغرف مجهزة بالكامل لضمان راحة النزلاء، مع توفر خيارات مرنة تلبي احتياجات الأفراد والمجموعات، لتجعل الرحلة الإيمانية أكثر يسراً.",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/Rh5Tn4FiRjudzf4E7",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 15,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على المدينة",
      "transportType": "bus",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791295272218",
    "name": "فندق صفوت البيت 2",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "محبس الجن (جهه المقابله )",
    "stars": 3,
    "distanceToHaram": 2500,
    "distanceText": "4 دقائق بالحافلة للحرم (ترددي 24/7)",
    "walkingTimeMinutes": 4,
    "featured": true,
    "isActive": true,
    "order": 16,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379279649_kesrpj.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295303922_o10oga.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295305714_jd5bn5.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295306891_h0iqba.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295308168_x68x4w.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295309274_to8mkp.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295310188_zwybr9.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295311071_oej4iv.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295311848_q1o8g2.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295312379_sl7hbb.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295313123_g7i2l3.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295313903_4wazrh.webp",
        "category": "rooms",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "امتداد موثوق لسلسلة صفوت البيت، يركز على راحة العائلات وتقديم خدمات فندقية متكاملة",
    "detailedDescription": "يوفر بيئة إقامة مريحة ونظيفة مع الاهتمام بالتفاصيل التي تهم المعتمر يومياً. يضمن الفندق تنقلات مرنة ومرافق عامة مرتبة تعزز من جودة الإقامة للمجموعات السياحية والرحلات العائلية.",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/4JTDqA8NXrgHhFKQA",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 16,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة على المدينة",
      "transportType": "bus",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791295519070",
    "name": "فندق ميسان الملتزم",
    "nameEn": "",
    "city": "مكة المكرمة",
    "district": "محبس الجن (جهه المقابله )",
    "stars": 3,
    "distanceToHaram": 2500,
    "distanceText": "5 دقائق بالحافلة للحرم (ترددي 24/7)",
    "walkingTimeMinutes": 5,
    "featured": true,
    "isActive": true,
    "order": 17,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379290477_gd2fd8.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295530941_i5y1r9.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295532017_cn1qrk.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295533114_ggg0pr.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295533985_7o1kxm.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295534994_ffk3zk.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295535908_iq4ynf.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295536977_j5mqma.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295537777_q7y2pz.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295538624_wj3fm6.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295540159_s79d0q.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295541097_f0x4cl.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295542210_v06zq3.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295543753_c4hv52.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295544848_75m0kh.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295545920_da1zqg.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295546853_cn1rsd.webp",
        "category": "rooms",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "ساحة من السكينة تلجأ إليها بعد طوافك وسعيك، مفعم بأجواء روحانية هادئة",
    "detailedDescription": "يتميز الفندق بتصاميمه الداخلية المريحة للعين وتوزيع مساحات الغرف بطريقة تضمن الخصوصية والهدوء. يوفر خدمات ضيافة تليق باسم ميسان، ليكون ملاذاً حقيقياً لاستعادة النشاط في قلب مكة.",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/WZs8xCDB2sPWFNmdA",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 54 327 7408⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 17,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة حرم",
      "transportType": "bus",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1790706496971",
    "name": "فندق منازل الزهراء ",
    "nameEn": "",
    "city": "المدينة المنورة",
    "district": "المنطقة المركزية الغربية",
    "stars": 4,
    "distanceToHaram": 600,
    "distanceText": "8 دقائق سيراً للحرم",
    "walkingTimeMinutes": 8,
    "featured": true,
    "isActive": true,
    "order": 18,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان"
    ],
    "rating": 5,
    "reviewCount": 1,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791380036972_bg2mpl.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/main_1791240535658.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_0_1791240536256.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_1_1791240537331.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_2_1791240538076.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_3_1791240538799.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_4_1791240539393.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_5_1791240539987.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_6_1791240540668.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_7_1791240541090.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_8_1791240542091.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_9_1791240542718.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_10_1791240543439.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_11_1791240544161.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_12_1791240544829.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_13_1791240545557.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_14_1791240545983.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_15_1791240546685.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_16_1791240547158.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_17_1791240547587.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_18_1791240548207.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_19_1791240548691.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_20_1791240549408.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_21_1791240550091.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_22_1791240550757.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_24_1791240552149.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_25_1791240553020.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_26_1791240553722.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_27_1791240554355.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_28_1791240555336.webp",
        "category": "facilities",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_29_1791240556013.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/hotel_1790706496971/gallery_30_1791240556723.webp",
        "category": "rooms",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "قع مكان إقامة \"فندق منازل الزهراء\" في المدينة المنورة، في حي وسط المدينة. لدى هذا الفندق المصنف نجمة واحدة غرف مكيفة مع حمّام خاص، بالإضافة إلى صالة مشتركة. يبعد مكان الإقامة مسافة 600 م عن مركز المدينة.",
    "detailedDescription": "يقع مكان إقامة \"فندق منازل الزهراء\" في المدينة المنورة، في حي وسط المدينة. لدى هذا الفندق المصنف نجمة واحدة غرف مكيفة مع حمّام خاص، بالإضافة إلى صالة مشتركة. يبعد مكان الإقامة مسافة 600 م عن مركز المدينة.\n\nتحتوي كل غرفة في \"فندق منازل الزهراء\" على خزانة ملابس وتلفزيون بشاشة مسطحة. تحتوي غرف الضيوف على بياضات أسرّة.\n\nيتحدث الموظفون اللغة العربية والإنجليزية في مكتب الاستقبال الذي يعمل على مدار الساعة، وسيكونون سعداء بتقديم نصائح مفيدة عن المنطقة.للضيوف.\n\nيقع مطار الأمير محمد بن عبدالعزيز الدولي على بُعد 15 كم من مكان الإقامة.",
    "amenities": [
      "إطلالة على الحرم",
      "واي فاي مجاني",
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "https://www.booking.com/hotel/sa/shrk-mnzl-lzwr-fndq-mnzl-lzhr-al-madinah-al-munawwarah.ar.html?aid=1893446&label=metagha-link-MRSA-hotel-10251642_dev-desktop_los-1_bw-0_dow-Tuesday_defdate-1_room-0_gstadt-2_rateid-dg_aud-0_gacid-21411124727_mcid-10_ppa-0_clrid-0_ad-1_gstkid-0_checkin-20260929_ppt-GBd_lp-2682_r-14647487273536385116-Share-JkSbMO%401790706738&sid=c32ae76d44808063ccf1791853d5d196&dest_id=10251642&dest_type=hotel&dist=0&group_adults=2&group_children=0&hapos=1&hpos=1&no_rooms=1&req_adults=2&req_children=0&room1=A%2CA&sb_price_type=total&sr_order=popularity&srepoch=1790879243&srpvid=e71f81c2fdb10b06&type=total&ucfs=1&",
    "showBookingUrl": true,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/BZoC7Ukfd118cdjy9",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "+966 59 034 8800⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 18,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "ساحة الحرم",
      "transportType": "walking",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791295648378",
    "name": "فندق منازل الحسن",
    "nameEn": "",
    "city": "المدينة المنورة",
    "district": "المنطقة المركزية الغربية",
    "stars": 3,
    "distanceToHaram": 350,
    "distanceText": "7 دقائق سيراً للحرم",
    "walkingTimeMinutes": 7,
    "featured": true,
    "isActive": true,
    "order": 19,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379384446_o0qdiw.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295697923_0l2gt6.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295691276_jj85q1.webp",
        "category": "facilities",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295692395_gagknk.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295693871_x88dub.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295694722_ikbioj.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295695554_7udp8e.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295696341_v8lhuy.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295696962_1warjt.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295698917_aegzzt.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295699858_ccruaw.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295700667_0w3n8q.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295701454_tiywnp.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295702307_c643gd.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295703440_y7xj4q.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295704569_dahuz1.webp",
        "category": "lobby",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295705689_335oku.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295706734_6dgsv8.webp",
        "category": "dining",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295707489_kdql1k.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295708090_5wmgbu.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295708914_prl697.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295709923_iq8xdc.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295710718_xp10wo.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295711636_eekdl1.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295712495_ecq091.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295713330_whq74e.webp",
        "category": "views",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "ضيافة راقية تعكس روحانية طابة الطيبة، يتميز بموقعه القريب ومرافقه المجددة ",
    "detailedDescription": "يقدم تجربة إقامة فاخرة تواكب تطلعات زوار مسجد المصطفى ﷺ. يتميز بغرف عصرية الإطلالة، وخدمات فندقية متكاملة تضمن السكينة، مما يتيح للزوار أداء الصلوات في المسجد النبوي والعودة سيراً بكل يسر وسهولة.",
    "amenities": [
      "إطلالة حرم",
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/DbQJMaDwNiXJiiT77",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 59 830 9040⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 19,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة حرم",
      "transportType": "walking",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  },
  {
    "id": "hotel_1791295908657",
    "name": "فندق منازل الصادق",
    "nameEn": "",
    "city": "المدينة المنورة",
    "district": "المنطقة المركزية الغربية",
    "stars": 4,
    "distanceToHaram": 500,
    "distanceText": "7 دقائق سيراً للحرم",
    "walkingTimeMinutes": 7,
    "featured": true,
    "isActive": true,
    "order": 20,
    "categories": [
      "فنادق العمرة",
      "فنادق رمضان",
      "عادي"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "mainImage": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791379399948_rwr36s.webp",
    "galleryImages": [
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295946777_n0hp7i.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295939241_0g97os.webp",
        "category": "views",
        "title": "الواجهة الرئيسية"
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295940372_ig3kun.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295941477_fbp8u7.webp",
        "category": "views",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295942388_6943a7.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295943248_qn3cz5.webp",
        "category": "views",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295944130_x9vsk4.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295945005_c04tsw.webp",
        "category": "rooms",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295945912_ax83yg.webp",
        "category": "views",
        "title": ""
      },
      {
        "url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/hotels/1791295947842_h38ceu.webp",
        "category": "all",
        "title": ""
      }
    ],
    "videoUrl": "",
    "overview": "حطتك الهادئة والموثوقة في المدينة المنورة لضمان إقامة مريحة وآمنة",
    "detailedDescription": "يضم غرفاً نظيفة ومرتبة تُدار بأعلى درجات الاحترافية الفندقية لضمان الراحة التامة. يوفر خدمة استقبال وإرشاد على مدار الساعة لتلبية كافة طلبات الزوار وتيسير تجربتهم في المدينة المنورة.",
    "amenities": [
      "مصاعد سريعة",
      "خدمة غرف 24/7"
    ],
    "bookingUrl": "",
    "showBookingUrl": false,
    "agodaUrl": "",
    "showAgodaUrl": false,
    "expediaUrl": "",
    "showExpediaUrl": false,
    "googleMapsUrl": "https://maps.app.goo.gl/227PbjnhFh5xuJQM6",
    "showGoogleMapsUrl": true,
    "hotelWhatsApp": "⁦+966 59 830 9040⁩",
    "showHotelWhatsApp": true,
    "hotelEmail": "",
    "showHotelEmail": false,
    "location": {
      "lat": 21.4225,
      "lng": 39.8262,
      "order": 20,
      "address": "أجياد، المنطقة المركزية، مكة المكرمة",
      "isActive": true,
      "viewType": "إطلالة حرم",
      "transportType": "walking",
      "metaDescription": "",
      "showDistanceBadge": false,
      "onlineBookingEnabled": false
    },
    "keywords": "",
    "onlineBookingEnabled": false
  }
];

export const INITIAL_OFFERS: Offer[] = [
  {
    "id": "offer_1790693212327",
    "title": "فنادق مكه",
    "short_description": "",
    "full_description": "",
    "media_type": "image",
    "media_url": "data:image/webp;base64,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",
    "video_url": "",
    "discount_percentage": 20,
    "end_date": "2028-02-01",
    "is_active": true,
    "badge_text": "عرض خاص",
    "keywords": "",
    "meta_description": "{\"gallery\":[{\"id\":\"gallery_1790706154559_d7s\",\"type\":\"image\",\"url\":\"https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/images/1790706153658_labfxw.jpeg\",\"caption\":\"WhatsApp Image 2026-08-26 at 12.20.33 PM.jpeg\"}],\"showDiscount\":false,\"showCountdown\":false,\"showInHeroSlides\":false,\"originalMetaDescription\":\"\"}",
    "created_at": "2026-09-29T14:49:29.302934+00:00",
    "updated_at": "2026-09-29T18:23:35.19+00:00"
  },
  {
    "id": "offer_1790706266310",
    "title": "فنادق المدينه",
    "short_description": "",
    "full_description": "",
    "media_type": "image",
    "media_url": "https://nejmudhoamtugdaqfbdd.supabase.co/storage/v1/object/public/prestige-media/images/1790706325107_f6yju1.jpeg",
    "video_url": "",
    "discount_percentage": 20,
    "end_date": "2027-12-13",
    "is_active": true,
    "badge_text": "إعلان مميز",
    "keywords": "",
    "meta_description": "{\"gallery\":[],\"showDiscount\":false,\"showCountdown\":false,\"showInHeroSlides\":false,\"originalMetaDescription\":\"\"}",
    "created_at": "2026-09-29T18:24:57.72648+00:00",
    "updated_at": "2026-09-29T18:25:30.757+00:00"
  }
];

export const INITIAL_REVIEWS: HotelReview[] = [];

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'برستيج لإدارة وتشغيل الفنادق',
  siteSubtitle: 'إدارة وتشغيل الفنادق والضيافة الفاخرة بمكة المكرمة والمدينة المنورة',
  primaryPhone: '+966544076726',
  primaryEmail: 'info@prestigehotels.sa',
  officeWhatsApp: '+966544076726',
  headquartersAddress: 'شارع أجياد العام، مكة المكرمة، المملكة العربية السعودية',
  commercialRegister: '4031245678',
  taxNumber: '300987654300003',
  tourismLicense: '73100845',
  copyrightText: 'جميع الحقوق محفوظة لشركة برستيج لإدارة وتشغيل الفنادق © 2026',
  browserTabTitle: 'برستيج لإدارة وتشغيل الفنادق | حجز فنادق مكة والمدينة وعروض الشركات',
  metaDescription: 'شركة برستيج الرائدة في إدارة وتشغيل الفنادق في مكة المكرمة والمدينة المنورة. أفضل عروض حجز فنادق مكة للشركات والمجموعات، فندق برستيج أجياد، خدمات إعاشة ونقل فاخر.',
  metaKeywords: 'حجز فنادق مكة, فنادق مكة والمدينة, إدارة فنادق, برستيج أجياد',
  logoUrl: '/images/brand/logo.png',
  faviconUrl: '/favicon.svg',
  actionButtons: DEFAULT_ACTION_BUTTONS,
  bookingModule: {
    enabled: true,
    showInHeader: true,
    showInHero: true,
    showInHotelDetail: true,
    allowPublicBookingCreation: true
  }
};
