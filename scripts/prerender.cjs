const fs = require('fs');
const path = require('path');

// Constants & Configuration
const SITE_URL = 'https://prestige-ksa.web.app';
const SUPABASE_URL = 'https://nejmudhoamtugdaqfbdd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lam11ZGhvYW10dWdkYXFmYmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2ODM3NDgsImV4cCI6MjEwNjI1OTc0OH0.E_VF3-JH9wyWxgSJyHBk8SS8BQM1nrDLYZN9I9YU6P8';

// Fallback initial hotels seed
const FALLBACK_HOTELS = [
  {
    id: "hotel_test_1790703048618",
    name: "برستيج اجياد",
    nameEn: "Prestige Ajyad",
    city: "مكة المكرمة",
    district: "أجياد",
    stars: 4,
    distanceToHaram: 450,
    distanceText: "450 متراً عن ساحة الحرم",
    rating: 5,
    reviewCount: 124,
    mainImage: "https://prestige-ksa.web.app/images/hotels/hotel_test_1790703048618_main.webp",
    overview: "فندق برستيج اجياد قريب من الحرم ( أجياد المصافي ) بمكة المكرمة، إقامة فندقية راقية بإطلالات مباركة وخدمات ضيافة متكاملة لضيوف الرحمن.",
    detailedDescription: "يقع فندق برستيج أجياد المصنف 4 نجوم في حي أجياد بمكة المكرمة، على بُعد 450 متراً فقط من ساحات المسجد الحرام. يوفر غرفاً فندقية فاخرة ومجهزة بأحدث وسائل الراحة، مطعماً يقدم أشهى المأكولات، مكتب استقبال على مدار الساعة، وخدمة نقل خاصة.",
    amenities: ["واي فاي مجاني", "إطلالة على الحرم", "خدمة غرف 24/7", "مطعم فاخر", "مصاعد سريعة"]
  },
  {
    id: "hotel_1790706496971",
    name: "منازل الزهراء",
    nameEn: "Manazel Azzahra",
    city: "المدينة المنورة",
    district: "المنطقة المركزية الغربية",
    stars: 5,
    distanceToHaram: 600,
    distanceText: "600 متراً عن ساحة الحرم",
    rating: 4.8,
    reviewCount: 98,
    mainImage: "https://prestige-ksa.web.app/images/hotels/hotel_1790706496971_main.webp",
    overview: "فندق منازل الزهراء بالمدينة المنورة في المنطقة المركزية، على بُعد خطوات من المسجد النبوي الشريف.",
    detailedDescription: "يقع فندق منازل الزهراء في المنطقة المركزية بالمدينة المنورة على بُعد 600 متر من الحرم النبوي الشريف، ويوفر غرفاً عصرية مكيفة مع حمامات خاصة وخدمة واي فاي مجانية وبوفيه إفطار متنوع.",
    amenities: ["إطلالة على الحرم", "واي فاي مجاني", "بوفيه إفطار", "مصاعد سريعة", "خدمة غرف 24/7"]
  }
];

// Arabic transliteration dictionary matching routing.ts
function arabicToLatinSlug(text) {
  if (!text) return '';
  const dictionary = {
    'برستيج': 'prestige',
    'فندق': '',
    'أجياد': 'ajyad',
    'اجياد': 'ajyad',
    'مكة': 'makkah',
    'المدينة': 'madinah',
    'المنورة': 'munawwarah',
    'المكرمة': 'mukarramah',
    'الحرم': 'haram',
    'الصفوة': 'safwah',
    'ابراج': 'towers',
    'أبراج': 'towers',
    'منازل': 'manazel',
    'الزهراء': 'azzahra',
    'زهراء': 'zahra',
    'سويس': 'swiss',
    'فيرمونت': 'fairmont',
    'موفنبيك': 'movenpick',
    'هيلتون': 'hilton',
    'دار': 'dar',
    'التوحيد': 'tawhid',
    'العزيزية': 'aziziyah',
    'المسفلة': 'mesfalah',
    'زمزم': 'zamzam',
    'الشهداء': 'shuhada',
    'البديع': 'badee',
    'فجر': 'fajr',
    'الريان': 'rayyan',
    'رويال': 'royal',
    'المركزية': 'central'
  };

  let cleaned = text.trim();
  for (const [ar, en] of Object.entries(dictionary)) {
    const reg = new RegExp(ar, 'gi');
    cleaned = cleaned.replace(reg, ` ${en} `);
  }

  const charMap = {
    'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': '', 'ئ': 'e', 'ؤ': 'o'
  };

  let result = '';
  for (const ch of cleaned) {
    result += charMap[ch] !== undefined ? charMap[ch] : ch;
  }

  return result
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getHotelSlug(hotel) {
  if (hotel.nameEn && hotel.nameEn.trim()) {
    const enSlug = hotel.nameEn
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (enSlug) return enSlug;
  }
  const transliterated = arabicToLatinSlug(hotel.name);
  if (transliterated) return transliterated;
  if (hotel.id) return hotel.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return 'hotel';
}

async function fetchHotels() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/hotels?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[prerender] Fetched ${data.length} hotels from Supabase.`);
        return data.map(h => ({
          ...h,
          nameEn: h.name_en || h.nameEn || '',
          distanceToHaram: h.distance_to_haram ?? h.distanceToHaram ?? 0,
          distanceText: h.distance_text || h.distanceText || (h.distance_to_haram ? `${h.distance_to_haram} متراً عن ساحة الحرم` : ''),
          walkingTimeMinutes: h.walking_time_minutes ?? h.walkingTimeMinutes,
          mainImage: h.main_image || h.mainImage || '',
          galleryImages: h.gallery_images || h.galleryImages || [],
          detailedDescription: h.detailed_description || h.detailedDescription || h.overview || '',
          reviewCount: h.review_count ?? h.reviewCount ?? 0,
          bookingPolicy: h.booking_policy || h.bookingPolicy,
          onlineBookingEnabled: h.online_booking_enabled ?? h.onlineBookingEnabled ?? true
        }));
      }
    }
  } catch (err) {
    console.warn('[prerender] Failed to fetch from Supabase, using fallback hotels:', err.message);
  }
  return FALLBACK_HOTELS;
}

// Generate Static HTML with rich SEO markup & crawler-visible content
function buildPageHtml(baseTemplate, config) {
  const {
    lang = 'ar',
    title,
    description,
    canonicalPath,
    arPath,
    enPath,
    ogImage = `${SITE_URL}/favicon.svg`,
    jsonLd,
    bodyHtml = '',
    isNoIndex = false
  } = config;

  const isRtl = lang === 'ar';
  let html = baseTemplate;

  // 1. Set html tag lang and dir
  html = html.replace(/<html[^>]*>/i, `<html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">`);

  // 2. Set title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
  html = html.replace(/<meta name="title"[^>]*>/i, `<meta name="title" content="${title}" />`);

  // 3. Set description
  html = html.replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${description}" />`);

  // 4. Set Canonical and Hreflang tags
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const arUrl = `${SITE_URL}${arPath}`;
  const enUrl = `${SITE_URL}${enPath}`;

  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  const hreflangTags = `
    <link rel="alternate" hreflang="ar" href="${arUrl}" />
    <link rel="alternate" hreflang="en" href="${enUrl}" />
    <link rel="alternate" hreflang="x-default" href="${arUrl}" />
  `.trim();

  html = html.replace(/<link rel="canonical"[^>]*>/i, `${canonicalTag}\n    ${hreflangTags}`);

  // 5. Open Graph & Twitter & Site Name
  const siteName = isRtl
    ? 'برستيج لإدارة وتشغيل الفنادق | Prestige Hotels Management'
    : 'Prestige Hotels Management | برستيج لإدارة وتشغيل الفنادق';

  html = html.replace(/<meta property="og:site_name"[^>]*>/i, `<meta property="og:site_name" content="${siteName}" />`);
  html = html.replace(/<meta name="application-name"[^>]*>/i, `<meta name="application-name" content="${siteName}" />`);
  html = html.replace(/<meta name="apple-mobile-web-app-title"[^>]*>/i, `<meta name="apple-mobile-web-app-title" content="${siteName}" />`);

  html = html.replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta property="og:locale"[^>]*>/i, `<meta property="og:locale" content="${isRtl ? 'ar_SA' : 'en_US'}" />`);
  html = html.replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${ogImage}" />`);

  html = html.replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${description}" />`);
  html = html.replace(/<meta name="twitter:url"[^>]*>/i, `<meta name="twitter:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${ogImage}" />`);

  // Translate Base WebSite JSON-LD for English
  if (!isRtl) {
    html = html.replace(
      /"name":\s*"برستيج لإدارة وتشغيل الفنادق"/g,
      '"name": "Prestige Hotels Management"'
    );
    html = html.replace(/"inLanguage":\s*"ar"/g, '"inLanguage": "en"');
  }

  // 6. Robots Tag
  const robotsDirective = isNoIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  html = html.replace(/<meta name="robots"[^>]*>/i, `<meta name="robots" content="${robotsDirective}" />`);

  // 7. Structured JSON-LD Data
  if (jsonLd) {
    const jsonLdScript = `\n    <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n    </script>`;
    html = html.replace('</head>', `${jsonLdScript}\n  </head>`);
  }

  // Inject LCP Hero Preload specifically on Home Pages (Clean & Fast, Zero Video Blocking)
  if (['/', '/ar', '/en'].includes(canonicalPath)) {
    if (!html.includes('/images/slides/slide_0.webp')) {
      const heroPreload = `\n    <link rel="preload" href="/images/slides/slide_0.webp" as="image" type="image/webp" fetchpriority="high" />`;
      html = html.replace('</head>', `${heroPreload}\n  </head>`);
    }
    // Remove any accidental video preload to preserve mobile Lighthouse 90+ score
    html = html.replace(/<link rel="preload"[^>]*as="video"[^>]*>\s*/gi, '');
  }

  // 8. Inject Semantic Crawler-Visible Content inside <div id="root">
  if (bodyHtml) {
    if (html.includes('<div id="root"></div>')) {
      html = html.replace(
        '<div id="root"></div>',
        `<div id="root">${bodyHtml}</div>`
      );
    } else {
      const rootStart = html.indexOf('<div id="root">');
      const scriptStart = html.indexOf('<script', rootStart);
      if (rootStart !== -1 && scriptStart !== -1) {
        const lastDivClose = html.lastIndexOf('</div>', scriptStart);
        if (lastDivClose !== -1) {
          html = html.substring(0, rootStart) + `<div id="root">${bodyHtml}</div>` + html.substring(lastDivClose + 6);
        }
      }
    }
  }

  return html;
}

// Redirect page template for old ID-based links
function buildRedirectHtml(targetUrl) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0;url=${targetUrl}" />
    <link rel="canonical" href="${targetUrl}" />
    <title>إعادة توجيه فندقي | برستيج لإدارة وتشغيل الفنادق</title>
    <script>window.location.replace("${targetUrl}");</script>
  </head>
  <body style="font-family:sans-serif;text-align:center;padding:50px;">
    <p>جاري تحويلك إلى صفحة الفندق الرسمية...</p>
    <a href="${targetUrl}">انقر هنا إذا لم يتم تحويلك تلقائياً</a>
  </body>
</html>`;
}

async function run() {
  const distDir = path.resolve(__dirname, '../dist');
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.error('[prerender] dist/index.html not found! Run npm run build first.');
    process.exit(1);
  }

  const baseTemplate = fs.readFileSync(indexHtmlPath, 'utf8');
  const hotels = await fetchHotels();

  console.log(`[prerender] Starting pre-render generation for ${hotels.length} hotels in Arabic & English...`);

  // Route definitions
  const sitemapEntries = [];

  function addSitemapEntry(loc, arLoc, enLoc, priority = '0.8', changefreq = 'daily', image = null) {
    const cleanPath = loc === '' || loc === '/' ? '/' : loc;
    sitemapEntries.push({
      loc: cleanPath === '/' ? `${SITE_URL}/` : `${SITE_URL}${cleanPath}`,
      arLoc: `${SITE_URL}${arLoc}`,
      enLoc: `${SITE_URL}${enLoc}`,
      priority,
      changefreq,
      lastmod: new Date().toISOString().split('T')[0],
      image
    });
  }

  function writeRoute(routePath, htmlContent) {
    const cleanRoute = routePath.replace(/^\/+/, '');
    if (!cleanRoute) return;

    // 1. Directory index: dist/ar/hotels/prestige-ajyad/index.html
    const targetDir = path.join(distDir, cleanRoute);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetFile = path.join(targetDir, 'index.html');
    fs.writeFileSync(targetFile, htmlContent, 'utf8');

    // 2. Direct cleanUrls file: dist/ar/hotels/prestige-ajyad.html
    const parentDir = path.dirname(path.join(distDir, cleanRoute));
    fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, `${cleanRoute}.html`), htmlContent, 'utf8');
  }

  // FAQ Rich Snippets for Umrah & Hajj Search Queries
  const faqArJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "كيف يمكنني حجز فنادق مكة والمدينة عبر شركة برستيج؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "يمكنك الحجز مباشرة عبر الموقع الإلكتروني من خلال بوابة الحجز الإلكتروني، أو عبر التواصل المباشر مع استشاريي التسكين عبر الواتساب على مدار الساعة لضمان أفضل الأسعار وتأكيد الحجز الفوري."
        }
      },
      {
        "@type": "Question",
        "name": "ما هي أقرب فنادق برستيج للحرم المكي والمسجد النبوي الشريف؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "تضم محفظة برستيج فنادق متميزة مثل فندق برستيج أجياد (450 متراً فقط من ساحة الحرم المكي)، وفنادق بمحبس الجن والمسفلة مع حافلات ترددية، بالإضافة إلى فنادق المنطقة المركزية بالمدينة المنورة بالقرب من المسجد النبوي."
        }
      },
      {
        "@type": "Question",
        "name": "هل توفر شركة برستيج عقود وأسعار خاصة لشركات العمرة والمجموعات؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "نعم، توفر برستيج أسعاراً تفضيلية وعقود تسكين موسمية مباشرة للشركات والوكالات السياحية ومجموعات الحج والعمرة مع خدمات إعاشة ونقل وحافلات خاصة."
        }
      }
    ]
  };

  const faqEnJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How can I book Makkah and Madinah hotels directly with Prestige?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can book directly through our online booking portal or by contacting our 24/7 reservation consultants via WhatsApp for instant confirmation and exclusive seasonal rates."
        }
      },
      {
        "@type": "Question",
        "name": "Which Prestige hotels are closest to the Holy Mosques in Makkah and Madinah?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our portfolio includes prime properties like Prestige Ajyad Hotel (450m from the Holy Mosque courtyard in Makkah), hotels in Mahbas Al-Jin with 24/7 shuttle service, and central district hotels in Madinah facing the Prophet's Mosque."
        }
      },
      {
        "@type": "Question",
        "name": "Does Prestige provide corporate rates and packages for Umrah and Hajj groups?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Prestige offers tailored corporate contracts, seasonal bulk allocations, full catering buffets, and private luxury transport for international agencies and group operators."
        }
      }
    ]
  };

  // 1. Root / redirects or defaults to Arabic
  const rootArHtml = buildPageHtml(baseTemplate, {
    lang: 'ar',
    title: 'برستيج لإدارة وتشغيل الفنادق | حجز فنادق مكة والمدينة وعروض الشركات',
    description: 'شركة برستيج الرائدة في إدارة وتشغيل الفنادق في مكة المكرمة والمدينة المنورة. أفضل عروض حجز فنادق مكة للشركات والمجموعات، فندق برستيج أجياد، خدمات إعاشة ونقل فاخر.',
    canonicalPath: '/ar',
    arPath: '/ar',
    enPath: '/en',
    jsonLd: faqArJsonLd,
    bodyHtml: `
      <section id="intro-video-section" class="relative w-full h-[100dvh] min-h-[550px] bg-black text-white overflow-hidden flex items-center justify-center select-none" style="min-height:100dvh;background:#0d0b09;position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;width:100%;height:100%;overflow:hidden;z-index:0;">
          <img src="/images/slides/slide_0.webp" alt="برستيج لإدارة وتشغيل الفنادق" style="width:100%;height:100%;object-fit:cover;filter:brightness(0.8);" fetchpriority="high" />
          <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.35) 100%);pointer-events:none;"></div>
        </div>
        <div style="position:relative;z-index:20;max-width:896px;margin:0 auto;padding:0 24px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;">
          <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:9999px;background:rgba(201,162,75,0.2);border:1px solid rgba(201,162,75,0.5);color:#DFBE72;font-size:13px;font-weight:bold;backdrop-filter:blur(8px);">
            <span>فنادق مكة المكرمة والمدينة المنورة الأقرب للحرم</span>
          </div>
          <h1 style="font-size:clamp(1.75rem, 5vw, 3.5rem);font-weight:900;color:#ffffff;line-height:1.2;margin:0;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.8));">
            برستيج لإدارة وتشغيل الفنادق
          </h1>
          <p style="font-size:clamp(0.875rem, 2vw, 1.125rem);color:#f5f5f4;max-width:672px;line-height:1.6;margin:0;filter:drop-shadow(0 2px 10px rgba(0,0,0,0.9));">
            الضيافة الملكية الأقرب إلى رحاب الحرمين الشريفين في مكة المكرمة والمدينة المنورة
          </p>
        </div>
        <div class="prestige-intro-loader">
          <div class="prestige-intro-loader-bar"></div>
        </div>
      </section>
      <div class="sr-crawler-only" aria-hidden="false">
        <header>
          <h1>شركة برستيج لإدارة وتشغيل الفنادق</h1>
          <p>الضيافة الملكية الأقرب إلى رحاب الحرمين الشريفين في مكة المكرمة والمدينة المنورة</p>
        </header>
        <main>
          <h2>فنادقنا الرائدة بمكة والمدينة</h2>
          <ul>
            ${hotels.map(h => `<li><strong>${h.name}</strong> - ${h.city} (${h.stars} نجوم) - ${h.distanceText || `${h.distanceToHaram}م من الحرم`}</li>`).join('')}
          </ul>
        </main>
      </div>
    `
  });
  // Update root dist/index.html with pre-rendered Arabic home
  fs.writeFileSync(indexHtmlPath, rootArHtml, 'utf8');
  addSitemapEntry('/', '/ar', '/en', '1.0', 'daily');

  // 2. Language Homes: /ar and /en
  writeRoute('/ar', rootArHtml);
  addSitemapEntry('/ar', '/ar', '/en', '1.0', 'daily');

  const enHomeHtml = buildPageHtml(baseTemplate, {
    lang: 'en',
    title: 'Prestige Hotels Management | Luxury Hotel Booking & Operations in Makkah & Madinah',
    description: 'Prestige Hotels Management: Premier hotel management and direct bookings for Makkah & Madinah hotels overlooking the Holy Mosques. Exclusive group and corporate contracts.',
    canonicalPath: '/en',
    arPath: '/ar',
    enPath: '/en',
    jsonLd: faqEnJsonLd,
    bodyHtml: `
      <section id="intro-video-section" class="relative w-full h-[100dvh] min-h-[550px] bg-black text-white overflow-hidden flex items-center justify-center select-none" style="min-height:100dvh;background:#0d0b09;position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;width:100%;height:100%;overflow:hidden;z-index:0;">
          <img src="/images/slides/slide_0.webp" alt="Prestige Hotels Management" style="width:100%;height:100%;object-fit:cover;filter:brightness(0.8);" fetchpriority="high" />
          <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.35) 100%);pointer-events:none;"></div>
        </div>
        <div style="position:relative;z-index:20;max-width:896px;margin:0 auto;padding:0 24px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;">
          <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:9999px;background:rgba(201,162,75,0.2);border:1px solid rgba(201,162,75,0.5);color:#DFBE72;font-size:13px;font-weight:bold;backdrop-filter:blur(8px);">
            <span>Prime Hotels in Makkah &amp; Madinah Near the Holy Mosques</span>
          </div>
          <h1 style="font-size:clamp(1.75rem, 5vw, 3.5rem);font-weight:900;color:#ffffff;line-height:1.2;margin:0;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.8));">
            Prestige Hotels Management
          </h1>
          <p style="font-size:clamp(0.875rem, 2vw, 1.125rem);color:#f5f5f4;max-width:672px;line-height:1.6;margin:0;filter:drop-shadow(0 2px 10px rgba(0,0,0,0.9));">
            Royal Hospitality &amp; Premium Accommodations in Makkah &amp; Madinah
          </p>
        </div>
        <div class="prestige-intro-loader">
          <div class="prestige-intro-loader-bar"></div>
        </div>
      </section>
      <div class="sr-crawler-only" aria-hidden="false">
        <header>
          <h1>Prestige Hotels Management & Hospitality</h1>
          <p>Royal hospitality closest to the Holy Mosques in Makkah & Madinah</p>
        </header>
        <main>
          <h2>Featured Hotels</h2>
          <ul>
            ${hotels.map(h => `<li><strong>${h.nameEn || h.name}</strong> - ${h.city.includes('مكة') ? 'Makkah' : 'Madinah'} (${h.stars} Stars) - ${h.distanceToHaram}m from the Mosque</li>`).join('')}
          </ul>
        </main>
      </div>
    `
  });
  writeRoute('/en', enHomeHtml);
  addSitemapEntry('/en', '/ar', '/en', '1.0', 'daily');

  // 3. Hotels Directory: /hotels, /ar/hotels, /en/hotels
  const arHotelsHtml = buildPageHtml(baseTemplate, {
    lang: 'ar',
    title: 'دليل فنادق مكة المكرمة والمدينة المنورة | شركة برستيج',
    description: 'استعرض نخبة فنادق مكة المكرمة والمدينة المنورة الأقرب للحرمين الشريفين. أسعار خاصة وعقود مباشرة لشركات العمرة والمجموعات والأفراد.',
    canonicalPath: '/ar/hotels',
    arPath: '/ar/hotels',
    enPath: '/en/hotels',
    bodyHtml: `
      <main style="max-width:1200px;margin:0 auto;padding:20px;">
        <h1>دليل فنادق مكة والمدينة المنورة</h1>
        <p>استكشف فنادق الصف الأول القريبة من الحرم المكي والمسجد النبوي مع شركة برستيج</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;">
          ${hotels.map(h => `
            <article style="border:1px solid #ddd;padding:15px;border-radius:10px;">
              <h2>${h.name}</h2>
              <p>${h.city} - ${h.district || ''} (${h.stars} نجوم)</p>
              <p>${h.distanceText || `${h.distanceToHaram} متر عن الحرم`}</p>
              <a href="/ar/hotels/${getHotelSlug(h)}">عرض التفاصيل والأسعار</a>
            </article>
          `).join('')}
        </div>
      </main>
    `
  });
  writeRoute('/ar/hotels', arHotelsHtml);
  writeRoute('/hotels', arHotelsHtml);
  addSitemapEntry('/ar/hotels', '/ar/hotels', '/en/hotels', '0.9', 'daily');

  const enHotelsHtml = buildPageHtml(baseTemplate, {
    lang: 'en',
    title: 'Hotels Directory in Makkah & Madinah | Prestige Management',
    description: 'Explore premier 4-star and 5-star hotels in Makkah and Madinah facing the Two Holy Mosques. Exclusive group bookings and seasonal contracts.',
    canonicalPath: '/en/hotels',
    arPath: '/ar/hotels',
    enPath: '/en/hotels',
    bodyHtml: `
      <main style="max-width:1200px;margin:0 auto;padding:20px;">
        <h1>Hotels in Makkah & Madinah</h1>
        <p>Explore first-row hotels facing the Holy Mosques with Prestige Management</p>
        <div>
          ${hotels.map(h => `
            <article style="border:1px solid #ddd;padding:15px;margin-bottom:10px;">
              <h2>${h.nameEn || h.name}</h2>
              <p>${h.city.includes('مكة') ? 'Makkah' : 'Madinah'} (${h.stars} Stars)</p>
              <a href="/en/hotels/${getHotelSlug(h)}">View Hotel Details</a>
            </article>
          `).join('')}
        </div>
      </main>
    `
  });
  writeRoute('/en/hotels', enHotelsHtml);
  addSitemapEntry('/en/hotels', '/ar/hotels', '/en/hotels', '0.9', 'daily');

  // 4. City-specific Hotel lists (/hotels/makkah & /hotels/madinah)
  const makkahHotels = hotels.filter(h => h.city.includes('مكة'));
  const madinahHotels = hotels.filter(h => h.city.includes('مدينة'));

  const arMakkahHtml = buildPageHtml(baseTemplate, {
    lang: 'ar',
    title: 'فنادق مكة المكرمة القريبة من الحرم | شركة برستيج',
    description: 'حجز أرقى فنادق مكة المكرمة في أجياد ومحبس الجن والمسفلة والمنطقة المركزية. فنادق 4 و 5 نجوم مطلة على الكعبة المشرفة وساحات الحرم المكي.',
    canonicalPath: '/ar/hotels/makkah',
    arPath: '/ar/hotels/makkah',
    enPath: '/en/hotels/makkah',
    bodyHtml: `
      <main style="max-width:1200px;margin:0 auto;padding:20px;">
        <h1>فنادق مكة المكرمة القريبة من الحرم المكي</h1>
        <p>أفضل خيارات الإقامة الفندقية المطلة على الكعبة المشرفة وساحات الحرم</p>
        ${makkahHotels.map(h => `<article><h2>${h.name}</h2><p>${h.distanceText}</p><a href="/ar/hotels/${getHotelSlug(h)}">تفاصيل الفندق</a></article>`).join('')}
      </main>
    `
  });
  writeRoute('/ar/hotels/makkah', arMakkahHtml);
  writeRoute('/hotels/makkah', arMakkahHtml);
  addSitemapEntry('/ar/hotels/makkah', '/ar/hotels/makkah', '/en/hotels/makkah', '0.9', 'daily');

  const enMakkahHtml = buildPageHtml(baseTemplate, {
    lang: 'en',
    title: 'Makkah Hotels Near the Grand Mosque | Prestige Management',
    description: 'Book luxury hotels in Makkah in Ajyad, Central Area, overlooking the Holy Kaaba. Direct contracts for individuals and groups.',
    canonicalPath: '/en/hotels/makkah',
    arPath: '/ar/hotels/makkah',
    enPath: '/en/hotels/makkah',
  });
  writeRoute('/en/hotels/makkah', enMakkahHtml);
  addSitemapEntry('/en/hotels/makkah', '/ar/hotels/makkah', '/en/hotels/makkah', '0.9', 'daily');

  const arMadinahHtml = buildPageHtml(baseTemplate, {
    lang: 'ar',
    title: 'فنادق المدينة المنورة المقابلة للمسجد النبوي | شركة برستيج',
    description: 'حجز فنادق المدينة المنورة في المنطقة المركزية الشمالية والغربية والجنوبية. فنادق فاخرة على بُعد خطوات من الحرم النبوي الشريف.',
    canonicalPath: '/ar/hotels/madinah',
    arPath: '/ar/hotels/madinah',
    enPath: '/en/hotels/madinah',
  });
  writeRoute('/ar/hotels/madinah', arMadinahHtml);
  writeRoute('/hotels/madinah', arMadinahHtml);
  addSitemapEntry('/ar/hotels/madinah', '/ar/hotels/madinah', '/en/hotels/madinah', '0.9', 'daily');

  const enMadinahHtml = buildPageHtml(baseTemplate, {
    lang: 'en',
    title: 'Madinah Hotels Facing the Prophet’s Mosque | Prestige Management',
    description: 'Luxury hotels in Madinah Central Area facing the Prophet’s Mosque courtyards. Best rates and instant booking.',
    canonicalPath: '/en/hotels/madinah',
    arPath: '/ar/hotels/madinah',
    enPath: '/en/hotels/madinah',
  });
  writeRoute('/en/hotels/madinah', enMadinahHtml);
  addSitemapEntry('/en/hotels/madinah', '/ar/hotels/madinah', '/en/hotels/madinah', '0.9', 'daily');

  // 5. Individual Hotel Detail Pages in both Arabic and English!
  for (const hotel of hotels) {
    const slug = getHotelSlug(hotel);
    const arHotelPath = `/ar/hotels/${slug}`;
    const enHotelPath = `/en/hotels/${slug}`;
    const hotelCityEn = hotel.city.includes('مكة') ? 'Makkah' : 'Madinah';
    const hotelNameEn = hotel.nameEn || hotel.name;

    // Structured JSON-LD for Hotel & LodgingBusiness
    const hotelJsonLd = {
      "@context": "https://schema.org",
      "@type": ["Hotel", "LodgingBusiness"],
      "name": hotel.name,
      "alternateName": hotel.nameEn || undefined,
      "description": hotel.detailedDescription || hotel.overview,
      "image": hotel.mainImage ? (hotel.mainImage.startsWith('http') ? hotel.mainImage : `${SITE_URL}${hotel.mainImage}`) : undefined,
      "starRating": {
        "@type": "Rating",
        "ratingValue": hotel.stars || 4
      },
      "priceRange": "$$$",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": hotel.city,
        "addressRegion": "Makkah Province",
        "addressCountry": "SA",
        "streetAddress": hotel.district || hotel.city
      },
      "aggregateRating": hotel.reviewCount ? {
        "@type": "AggregateRating",
        "ratingValue": hotel.rating || 4.8,
        "reviewCount": hotel.reviewCount || 10
      } : undefined
    };

    const cleanArName = hotel.name.trim().startsWith('فندق') ? hotel.name.trim() : `فندق ${hotel.name.trim()}`;
    const distText = hotel.distanceText || (hotel.distanceToHaram ? `${hotel.distanceToHaram} متراً عن ساحة الحرم` : 'قريب من الحرم');
    const citySlug = hotel.city.includes('مكة') ? 'makkah' : 'madinah';
    const cityLabelAr = `فنادق ${hotel.city}`;
    const cityLabelEn = hotel.city.includes('مكة') ? 'Hotels in Makkah' : 'Hotels in Madinah';

    // BreadcrumbList Schema for Google Search Rich Snippets
    const arHotelBreadcrumbs = {
      "@type": "BreadcrumbList",
      "@id": `${SITE_URL}${arHotelPath}#breadcrumbs`,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "الرئيسية",
          "item": `${SITE_URL}/ar`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": cityLabelAr,
          "item": `${SITE_URL}/ar/hotels/${citySlug}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": cleanArName,
          "item": `${SITE_URL}${arHotelPath}`
        }
      ]
    };

    const enHotelBreadcrumbs = {
      "@type": "BreadcrumbList",
      "@id": `${SITE_URL}${enHotelPath}#breadcrumbs`,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": `${SITE_URL}/en`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": cityLabelEn,
          "item": `${SITE_URL}/en/hotels/${citySlug}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": hotelNameEn,
          "item": `${SITE_URL}${enHotelPath}`
        }
      ]
    };

    const arHotelJsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        hotelJsonLd,
        arHotelBreadcrumbs
      ]
    };

    const enHotelJsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        { ...hotelJsonLd, name: hotelNameEn },
        enHotelBreadcrumbs
      ]
    };

    // Arabic Hotel HTML
    const arHotelHtml = buildPageHtml(baseTemplate, {
      lang: 'ar',
      title: `${cleanArName} في ${hotel.city} (${hotel.stars} نجوم) | شركة برستيج`,
      description: hotel.metaDescription || `احجز إقامتك في ${cleanArName} في ${hotel.city}. يقع على بُعد ${distText}. حجز مباشر، أفضل الأسعار وخدمات ضيافة متكاملة.`,
      canonicalPath: arHotelPath,
      arPath: arHotelPath,
      enPath: enHotelPath,
      ogImage: hotel.mainImage ? (hotel.mainImage.startsWith('http') ? hotel.mainImage : `${SITE_URL}${hotel.mainImage}`) : undefined,
      jsonLd: arHotelJsonLd,
      bodyHtml: `
        <article style="max-width:1200px;margin:0 auto;padding:20px;">
          <nav aria-label="مسار التصفح" style="margin-bottom:15px;font-size:14px;color:#78716c;">
            <a href="/ar" style="color:#C9A24B;text-decoration:none;">الرئيسية</a> &gt; 
            <a href="/ar/hotels/${citySlug}" style="color:#C9A24B;text-decoration:none;">فنادق ${hotel.city}</a> &gt; 
            <span>${cleanArName}</span>
          </nav>
          <header>
            <h1>${cleanArName}</h1>
            <p><strong>المدينة:</strong> ${hotel.city} | <strong>الحي:</strong> ${hotel.district || ''} | <strong>التصنيف:</strong> ${hotel.stars} نجوم</p>
            <p><strong>المسافة إلى الحرم:</strong> ${distText}</p>
          </header>
          ${hotel.mainImage ? `
          <div style="margin:20px 0;">
            <img src="${hotel.mainImage.startsWith('http') ? hotel.mainImage : `${SITE_URL}${hotel.mainImage}`}" alt="${cleanArName} - ${hotel.city}" style="max-width:100%;height:auto;border-radius:12px;" />
          </div>` : ''}
          <section>
            <h2>نظرة عامة على الفندق</h2>
            <p>${hotel.overview || ''}</p>
            <h2>الوصف والتفاصيل</h2>
            <p>${hotel.detailedDescription || ''}</p>
            <h2>مرافق وخدمات الفندق</h2>
            <ul>
              ${(hotel.amenities || []).map(a => `<li>${a}</li>`).join('')}
            </ul>
          </section>
        </article>
      `
    });
    writeRoute(arHotelPath, arHotelHtml);
    const hotelImgAr = hotel.mainImage ? {
      loc: hotel.mainImage.startsWith('http') ? hotel.mainImage : `${SITE_URL}${hotel.mainImage}`,
      title: `${cleanArName} - ${hotel.city}`,
      caption: `${cleanArName} (${hotel.stars} نجوم) - ${distText}`
    } : null;
    addSitemapEntry(arHotelPath, arHotelPath, enHotelPath, '0.9', 'daily', hotelImgAr);

    // English Hotel HTML
    const enHotelHtml = buildPageHtml(baseTemplate, {
      lang: 'en',
      title: `${hotelNameEn} - ${hotelCityEn} (${hotel.stars} Stars) | Prestige Hotels Management`,
      description: `Book your stay at ${hotelNameEn} in ${hotelCityEn}. Located ${hotel.distanceText || `${hotel.distanceToHaram}m from the Mosque`}. Direct booking, best rates, and premium hospitality.`,
      canonicalPath: enHotelPath,
      arPath: arHotelPath,
      enPath: enHotelPath,
      ogImage: hotel.mainImage ? (hotel.mainImage.startsWith('http') ? hotel.mainImage : `${SITE_URL}${hotel.mainImage}`) : undefined,
      jsonLd: enHotelJsonLd,
      bodyHtml: `
        <article style="max-width:1200px;margin:0 auto;padding:20px;">
          <nav aria-label="Breadcrumb" style="margin-bottom:15px;font-size:14px;color:#78716c;">
            <a href="/en" style="color:#C9A24B;text-decoration:none;">Home</a> &gt; 
            <a href="/en/hotels/${citySlug}" style="color:#C9A24B;text-decoration:none;">Hotels in ${hotelCityEn}</a> &gt; 
            <span>${hotelNameEn}</span>
          </nav>
          <header>
            <h1>${hotelNameEn}</h1>
            <p><strong>City:</strong> ${hotelCityEn} | <strong>Stars:</strong> ${hotel.stars} Stars</p>
            <p><strong>Distance to Mosque:</strong> ${hotel.distanceToHaram} meters</p>
          </header>
          ${hotel.mainImage ? `
          <div style="margin:20px 0;">
            <img src="${hotel.mainImage.startsWith('http') ? hotel.mainImage : `${SITE_URL}${hotel.mainImage}`}" alt="${hotelNameEn} - ${hotelCityEn}" style="max-width:100%;height:auto;border-radius:12px;" />
          </div>` : ''}
          <section>
            <h2>Hotel Overview</h2>
            <p>${hotel.overview || ''}</p>
            <h2>Hotel Amenities</h2>
            <ul>
              ${(hotel.amenities || []).map(a => `<li>${a}</li>`).join('')}
            </ul>
          </section>
        </article>
      `
    });
    writeRoute(enHotelPath, enHotelHtml);
    const hotelImgEn = hotel.mainImage ? {
      loc: hotel.mainImage.startsWith('http') ? hotel.mainImage : `${SITE_URL}${hotel.mainImage}`,
      title: `${hotelNameEn} - ${hotelCityEn}`,
      caption: `${hotelNameEn} (${hotel.stars} Stars) in ${hotelCityEn}`
    } : null;
    addSitemapEntry(enHotelPath, arHotelPath, enHotelPath, '0.9', 'daily', hotelImgEn);

    // Backward-compatibility ID redirect: /hotels/:id and /ar/hotels/:id -> /ar/hotels/:slug
    if (hotel.id && hotel.id !== slug) {
      const redirectHtml = buildRedirectHtml(`${SITE_URL}/ar/hotels/${slug}`);
      writeRoute(`/hotels/${hotel.id}`, redirectHtml);
      writeRoute(`/ar/hotels/${hotel.id}`, redirectHtml);
      writeRoute(`/en/hotels/${hotel.id}`, buildRedirectHtml(`${SITE_URL}/en/hotels/${slug}`));
    }
  }

  // 6. About Page: /ar/about and /en/about
  const arAboutHtml = buildPageHtml(baseTemplate, {
    lang: 'ar',
    title: 'من نحن - مسيرة الريادة في تشغيل الفنادق والضيافة | شركة برستيج',
    description: 'تعرف على شركة برستيج لإدارة وتشغيل الفنادق، وخبرتنا الممتدة لأكثر من ١٥ عاماً في خدمة ضيوف الرحمن وشركات السياحة في مكة والمدينة.',
    canonicalPath: '/ar/about',
    arPath: '/ar/about',
    enPath: '/en/about',
    bodyHtml: `
      <main style="max-width:1200px;margin:0 auto;padding:20px;">
        <h1>عن شركة برستيج لإدارة وتشغيل الفنادق</h1>
        <p>نحن شركة سعودية رائدة متخصصة في الإدارة المتكاملة للمنشآت الفندقية بمكة المكرمة والمدينة المنورة.</p>
      </main>
    `
  });
  writeRoute('/ar/about', arAboutHtml);
  writeRoute('/about', arAboutHtml);
  addSitemapEntry('/ar/about', '/ar/about', '/en/about', '0.7', 'monthly');

  const enAboutHtml = buildPageHtml(baseTemplate, {
    lang: 'en',
    title: 'About Us - Leadership in Hotel Operations | Prestige Management',
    description: 'Learn about Prestige Hotels Management, our 15+ years track record in hospitality operations across Makkah and Madinah.',
    canonicalPath: '/en/about',
    arPath: '/ar/about',
    enPath: '/en/about',
    bodyHtml: `
      <main style="max-width:1200px;margin:0 auto;padding:20px;">
        <h1>About Prestige Hotels Management & Hospitality</h1>
        <p>Prestige is a leading Saudi hospitality firm specializing in hotel operations, Umrah & Hajj pilgrim services, and corporate bookings in Makkah and Madinah.</p>
      </main>
    `
  });
  writeRoute('/en/about', enAboutHtml);
  addSitemapEntry('/en/about', '/ar/about', '/en/about', '0.7', 'monthly');

  // 7. Contact Page: /ar/contact and /en/contact
  const arContactHtml = buildPageHtml(baseTemplate, {
    lang: 'ar',
    title: 'تواصل معنا - الفروع والاستفسارات وحجز الفنادق | شركة برستيج',
    description: 'تواصل مع فريق استشاريي التسكين بشركة برستيج المتاحين على مدار الساعة. فروعنا الرسمية بمكة المكرمة والمدينة المنورة والقاهرة وإندونيسيا.',
    canonicalPath: '/ar/contact',
    arPath: '/ar/contact',
    enPath: '/en/contact',
    bodyHtml: `
      <main style="max-width:1200px;margin:0 auto;padding:20px;">
        <h1>تواصل مع شركة برستيج لإدارة وتشغيل الفنادق</h1>
        <p>فريق خدمة العملاء واستشارات التسكين متاح على مدار الساعة عبر الهاتف والواتساب.</p>
        <section>
          <h2>فروعنا الرئيسية</h2>
          <p><strong>المقر الرئيسي:</strong> مكة المكرمة - المملكة العربية السعودية</p>
          <p><strong>فرع المدينة:</strong> المدينة المنورة - المملكة العربية السعودية</p>
          <p><strong>هاتف الاستقبال والحجز:</strong> +966555180424</p>
          <p><strong>البريد الإلكتروني:</strong> info@prestige-ksa.com</p>
        </section>
      </main>
    `
  });
  writeRoute('/ar/contact', arContactHtml);
  writeRoute('/contact', arContactHtml);
  addSitemapEntry('/ar/contact', '/ar/contact', '/en/contact', '0.7', 'monthly');

  const enContactHtml = buildPageHtml(baseTemplate, {
    lang: 'en',
    title: 'Contact Us - Reservations & Branch Locations | Prestige Management',
    description: 'Contact Prestige Hotels Management 24/7. Official branches in Makkah (HQ), Madinah, Cairo, and Indonesia.',
    canonicalPath: '/en/contact',
    arPath: '/ar/contact',
    enPath: '/en/contact',
    bodyHtml: `
      <main style="max-width:1200px;margin:0 auto;padding:20px;">
        <h1>Contact Prestige Hotels Management</h1>
        <p>Our 24/7 reservations and guest hospitality team is ready to assist your bookings.</p>
        <section>
          <h2>Headquarters & Global Branches</h2>
          <p><strong>Head Office:</strong> Makkah Al-Mukarramah, Kingdom of Saudi Arabia</p>
          <p><strong>Madinah Branch:</strong> Madinah Al-Munawwarah, Kingdom of Saudi Arabia</p>
          <p><strong>Phone / WhatsApp:</strong> +966555180424</p>
          <p><strong>Email:</strong> info@prestige-ksa.com</p>
        </section>
      </main>
    `
  });
  writeRoute('/en/contact', enContactHtml);
  addSitemapEntry('/en/contact', '/ar/contact', '/en/contact', '0.7', 'monthly');

  // 8. Offers Page: /ar/offers and /en/offers
  const arOffersHtml = buildPageHtml(baseTemplate, {
    lang: 'ar',
    title: 'عروض وإعلانات مواسم العمرة والحج الفندقية | شركة برستيج',
    description: 'أحدث عروض وبوسترات مواسم العمرة والحج الفندقية في مكة والمدينة من شركة برستيج لإدارة وتشغيل الفنادق.',
    canonicalPath: '/ar/offers',
    arPath: '/ar/offers',
    enPath: '/en/offers',
    bodyHtml: `
      <main style="max-width:1200px;margin:0 auto;padding:20px;">
        <h1>عروض وباقات الفنادق لمواسم العمرة والحج</h1>
        <p>استكشف أقوى العروض الموسمية وباقات التسكين المخصصة لشركات السياحة والحملات والأفراد بأفضل الأسعار المباشرة.</p>
      </main>
    `
  });
  writeRoute('/ar/offers', arOffersHtml);
  writeRoute('/offers', arOffersHtml);
  addSitemapEntry('/ar/offers', '/ar/offers', '/en/offers', '0.8', 'weekly');

  const enOffersHtml = buildPageHtml(baseTemplate, {
    lang: 'en',
    title: 'Exclusive Seasonal Hotel Offers & Packages | Prestige Management',
    description: 'Latest exclusive offers and seasonal rates for hotels in Makkah & Madinah from Prestige Hotels Management.',
    canonicalPath: '/en/offers',
    arPath: '/ar/offers',
    enPath: '/en/offers',
    bodyHtml: `
      <main style="max-width:1200px;margin:0 auto;padding:20px;">
        <h1>Exclusive Seasonal Hotel Offers & Packages</h1>
        <p>Explore high-season packages for Umrah and Hajj groups and individual luxury stays in Makkah & Madinah.</p>
      </main>
    `
  });
  writeRoute('/en/offers', enOffersHtml);
  addSitemapEntry('/en/offers', '/ar/offers', '/en/offers', '0.8', 'weekly');

  // 9. Bookings Portal: /ar/bookings and /en/bookings
  const arBookingsHtml = buildPageHtml(baseTemplate, {
    lang: 'ar',
    title: 'بوابة حجز فنادق مكة والمدينة | حجز فردي وعائلي وعقود الشركات B2B | شركة برستيج',
    description: 'بوابة الحجز الفوري لغرف فنادق مكة المكرمة والمدينة المنورة الأقرب للحرمين. حجز فردي وعائلي، عقود شركات وبعثات B2B، إتاحة مباشرة، وتأكيد فوري عبر الواتساب.',
    canonicalPath: '/ar/bookings',
    arPath: '/ar/bookings',
    enPath: '/en/bookings',
    bodyHtml: `
      <div class="min-h-screen bg-[#F8F7F4] text-stone-900 font-cairo pt-24 pb-16" dir="rtl">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 mb-8 text-center space-y-3">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C9A24B]/15 text-[#8C6D23] text-xs font-bold border border-[#C9A24B]/30">
            <span>منظومة الحجوزات الفندقية الذكية والمباشرة</span>
          </div>
          <h1 class="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">حجز فنادق مكة المكرمة والمدينة المنورة وعقود الشركات</h1>
          <p class="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed">استعرض الفنادق المتاحة للحجز الفوري بجوار الحرمين الشريفين، أو قدم طلب تسكين وتعاقد مخصص للشركات والبعثات مع تأكيد مباشر عبر الواتساب وسند حجز رسمي.</p>
        </div>
        <div class="max-w-5xl mx-auto px-4 sm:px-6">
          <div class="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 sm:p-8 min-h-[640px]">
            <div class="h-8 bg-stone-100 rounded-xl w-64 mx-auto mb-6"></div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="h-20 bg-stone-50 rounded-2xl border border-stone-200/60"></div>
              <div class="h-20 bg-stone-50 rounded-2xl border border-stone-200/60"></div>
              <div class="h-20 bg-stone-50 rounded-2xl border border-stone-200/60"></div>
            </div>
            <div class="h-64 bg-stone-50/60 rounded-2xl border border-stone-200/40"></div>
          </div>
        </div>
      </div>
    `
  });
  writeRoute('/ar/bookings', arBookingsHtml);
  writeRoute('/bookings', arBookingsHtml);
  addSitemapEntry('/ar/bookings', '/ar/bookings', '/en/bookings', '0.8', 'daily');

  const enBookingsHtml = buildPageHtml(baseTemplate, {
    lang: 'en',
    title: 'Online Hotel Room Booking Portal | Prestige Management',
    description: 'Instant digital room booking and reservation management for Makkah and Madinah hotels.',
    canonicalPath: '/en/bookings',
    arPath: '/ar/bookings',
    enPath: '/en/bookings',
    bodyHtml: `
      <div class="min-h-screen bg-[#F8F7F4] text-stone-900 font-cairo pt-24 pb-16" dir="ltr">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 mb-8 text-center space-y-3">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C9A24B]/15 text-[#8C6D23] text-xs font-bold border border-[#C9A24B]/30">
            <span>Direct Luxury Hotel Booking Portal</span>
          </div>
          <h1 class="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">Book Your Stay in Makkah & Madinah</h1>
          <p class="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed">Direct room reservations with instant digital confirmation, zero hidden fees, and verified hotel vouchers.</p>
        </div>
        <div class="max-w-5xl mx-auto px-4 sm:px-6">
          <div class="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 sm:p-8 min-h-[640px]">
            <div class="h-8 bg-stone-100 rounded-xl w-64 mx-auto mb-6"></div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="h-20 bg-stone-50 rounded-2xl border border-stone-200/60"></div>
              <div class="h-20 bg-stone-50 rounded-2xl border border-stone-200/60"></div>
              <div class="h-20 bg-stone-50 rounded-2xl border border-stone-200/60"></div>
            </div>
            <div class="h-64 bg-stone-50/60 rounded-2xl border border-stone-200/40"></div>
          </div>
        </div>
      </div>
    `
  });
  writeRoute('/en/bookings', enBookingsHtml);
  addSitemapEntry('/en/bookings', '/ar/bookings', '/en/bookings', '0.8', 'daily');

  // 10. Admin Page (Explicitly NoIndex!)
  const adminHtml = buildPageHtml(baseTemplate, {
    lang: 'ar',
    title: 'لوحة التحكم الإدارية | شركة برستيج',
    description: 'لوحة التحكم الإدارية المخصصة لمشرفي منصة برستيج لإدارة وتشغيل الفنادق.',
    canonicalPath: '/admin',
    arPath: '/admin',
    enPath: '/admin',
    isNoIndex: true
  });
  writeRoute('/admin', adminHtml);

  // 11. Generate Multilingual & Image Sitemap XML
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.google.com/schemas/sitemap-image/1.1 http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd">
${sitemapEntries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <xhtml:link rel="alternate" hreflang="ar" href="${e.arLoc}" />
    <xhtml:link rel="alternate" hreflang="en" href="${e.enLoc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${e.arLoc}" />
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>${e.image ? `
    <image:image>
      <image:loc>${e.image.loc}</image:loc>
      <image:title><![CDATA[${e.image.title}]]></image:title>
      <image:caption><![CDATA[${e.image.caption}]]></image:caption>
    </image:image>` : ''}
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
  fs.writeFileSync(path.resolve(__dirname, '../public/sitemap.xml'), sitemapXml, 'utf8');

  // Plaintext sitemap.txt
  const sitemapTxt = sitemapEntries.map(e => e.loc).join('\n');
  fs.writeFileSync(path.join(distDir, 'sitemap.txt'), sitemapTxt, 'utf8');
  fs.writeFileSync(path.resolve(__dirname, '../public/sitemap.txt'), sitemapTxt, 'utf8');

  // 12. Update robots.txt with disallows for admin
  const robotsTxt = `User-agent: *
Allow: /
Allow: /assets/
Allow: /images/
Allow: /fonts/

# Exclude Admin Panel completely from crawling
Disallow: /admin
Disallow: /admin/*
Disallow: /ar/admin*
Disallow: /en/admin*
Disallow: /#/admin*

# Exclude private customer invoices and backend APIs
Disallow: /invoice
Disallow: /invoice/*
Disallow: /ar/invoice*
Disallow: /en/invoice*
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap.txt
`;
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8');
  fs.writeFileSync(path.resolve(__dirname, '../public/robots.txt'), robotsTxt, 'utf8');

  console.log(`[prerender] Successfully generated ${sitemapEntries.length} sitemap URLs and pre-rendered all public pages!`);
}

run().catch(err => {
  console.error('[prerender] Fatal error during pre-rendering:', err);
  process.exit(1);
});
