import React, { useEffect } from 'react';
import { Hotel, ActivePage, SiteSettings } from '../types';
import { Language, getPageShareUrl, getHotelSlug } from '../utils/routing';
import { getBrandLogoUrl } from '../utils/brandLogo';

interface SEOHeadProps {
  page: ActivePage;
  lang: Language;
  hotel?: Hotel;
  siteSettings?: SiteSettings;
  customTitle?: string;
  customDescription?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  page,
  lang,
  hotel,
  siteSettings,
  customTitle,
  customDescription
}) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const origin = window.location.origin || 'https://prestige-ksa.web.app';
    const isEn = lang === 'en';
    const companyTitle = isEn 
      ? (siteSettings?.siteTitleEn || siteSettings?.siteTitle || 'Prestige Hotels Management') 
      : (siteSettings?.siteTitle || 'برستيج لإدارة وتشغيل الفنادق');
    const companySubtitle = isEn 
      ? (siteSettings?.siteSubtitleEn || siteSettings?.siteSubtitle || 'Hotel Management & Operations') 
      : (siteSettings?.siteSubtitle || 'إدارة وتشغيل الفنادق والضيافة الفاخرة');

    // 1. Determine Title & Description based on page
    let pageTitle = '';
    let pageDescription = '';
    let ogImage = hotel?.mainImage || getBrandLogoUrl(siteSettings?.logoUrl) || `${origin}/images/brand/logo.png`;
    let isNoIndex = page === 'admin';

    if (customTitle) {
      pageTitle = customTitle;
    } else if (page === 'home') {
      pageTitle = isEn
        ? `${companyTitle} | Luxury Hotel Management & Booking in Makkah & Madinah`
        : `${companyTitle} | حجز فنادق مكة والمدينة وعروض الشركات`;
      pageDescription = isEn
        ? (siteSettings?.footerBioEn || 'Prestige Hotels Management: premier hotel management, direct bookings for Makkah & Madinah hotels overlooking the Holy Mosques, catering and transportation services for pilgrims.')
        : (siteSettings?.footerBio || 'شركة برستيج الرائدة في إدارة وتشغيل الفنادق في مكة المكرمة والمدينة المنورة. أفضل عروض حجز فنادق مكة للشركات والمجموعات، فندق برستيج أجياد، خدمات إعاشة ونقل فاخر.');
    } else if (page === 'hotel-detail' && hotel) {
      const hotelName = isEn ? (hotel.nameEn || hotel.name) : hotel.name;
      const starsText = isEn ? `${hotel.stars} Stars` : `${hotel.stars} نجوم`;
      const city = isEn ? (hotel.city.includes('مكة') ? 'Makkah' : 'Madinah') : hotel.city;
      pageTitle = isEn
        ? `${hotelName} - ${city} (${starsText}) | ${companyTitle}`
        : `فندق ${hotelName} في ${city} (${starsText}) | ${companyTitle}`;
      pageDescription = hotel.metaDescription || (isEn 
        ? `Book your stay at ${hotelName} in ${city}. Located ${hotel.distanceText || `${hotel.distanceToHaram}m from Haram`}. Direct booking, best rates, and premium hospitality.` 
        : `احجز إقامتك في فندق ${hotelName} في ${city}. يقع على بعد ${hotel.distanceText || `${hotel.distanceToHaram} م من الحرم`}. حجز مباشر، أفضل الأسعار، وخدمات ضيافة متكاملة.`);
      if (hotel.mainImage) ogImage = hotel.mainImage;
    } else if (page === 'hotels') {
      pageTitle = isEn
        ? `Hotels in Makkah & Madinah | ${companyTitle}`
        : `دليل فنادق مكة المكرمة والمدينة المنورة | ${companyTitle}`;
      pageDescription = isEn
        ? 'Explore luxury hotels in Makkah and Madinah facing the Two Holy Mosques. Exclusive seasonal rates, group bookings, and direct contracts.'
        : 'استعرض نخبة فنادق مكة المكرمة والمدينة المنورة الأقرب للحرمين الشريفين. أسعار خاصة وعقود مباشرة لشركات العمرة والمجموعات والأفراد.';
    } else if (page === 'offers') {
      pageTitle = isEn
        ? `Exclusive Seasonal Offers & Hotel Ads | ${companyTitle}`
        : `عروض وإعلانات مواسم العمرة والحج الفندقية | ${companyTitle}`;
      pageDescription = isEn
        ? 'Latest exclusive offers and seasonal hotel rates in Makkah & Madinah from Prestige Hotels Management.'
        : 'أحدث عروض وبوسترات مواسم العمرة والحج الفندقية في مكة والمدينة من شركة برستيج لإدارة وتشغيل الفنادق.';
    } else if (page === 'about') {
      pageTitle = isEn
        ? `About Us - Leadership in Hotel Management | ${companyTitle}`
        : `من نحن - مسيرة الريادة في تشغيل الفنادق والضيافة | ${companyTitle}`;
      pageDescription = isEn
        ? (siteSettings?.aboutUs?.subtitle || 'Learn about Prestige Hotels Management, our 15+ years track record in hospitality, and operations across Makkah and Madinah.')
        : (siteSettings?.aboutUs?.subtitle || 'تعرف على شركة برستيج لإدارة وتشغيل الفنادق، وخبرتنا الممتدة لأكثر من ١٥ عاماً في خدمة ضيوف الرحمن وشركات السياحة.');
    } else if (page === 'contact') {
      pageTitle = isEn
        ? `Contact Us - Branches & Reservations | ${companyTitle}`
        : `تواصل معنا - الفروع والاستفسارات وحجز الفنادق | ${companyTitle}`;
      pageDescription = isEn
        ? 'Contact Prestige Hotels Management 24/7. Official branches in Makkah (HQ), Madinah, Cairo, and Indonesia.'
        : 'تواصل مع فريق استشاريي التسكين بشركة برستيج المتاحين على مدار الساعة. فروعنا الرسمية بمكة المكرمة والمدينة المنورة والقاهرة وإندونيسيا.';
    } else if (page === 'room-booking') {
      pageTitle = isEn
        ? `Online Hotel & Room Booking Portal | ${companyTitle}`
        : `بوابة حجز الغرف والفنادق أونلاين | ${companyTitle}`;
      pageDescription = isEn
        ? 'Instant digital room booking, digital key issuance, and direct confirmation with Prestige Hotels Management.'
        : 'بوابة الحجز الفوري لغرف فنادق مكة والمدينة، إصدار سندات الحجز والمفتاح الرقمي مباشرة.';
    } else if (page === 'admin') {
      pageTitle = `لوحة التحكم الإدارية | ${companyTitle}`;
      pageDescription = 'لوحة التحكم الإدارية المخصصة لمشرفي منصة برستيج';
      isNoIndex = true;
    }

    if (customDescription) {
      pageDescription = customDescription;
    }

    // 2. Set document.title
    document.title = pageTitle;

    // 3. Set html lang & dir attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = isEn ? 'ltr' : 'rtl';
    document.body.dir = isEn ? 'ltr' : 'rtl';

    // 4. Update Meta Tags Helper
    const setMetaTag = (nameOrProp: 'name' | 'property', attrValue: string, content: string) => {
      let el = document.querySelector(`meta[${nameOrProp}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(nameOrProp, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Description & Keywords
    setMetaTag('name', 'description', pageDescription);
    setMetaTag('name', 'robots', isNoIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Canonical & Hreflang Tags
    const canonicalUrl = getPageShareUrl(page, lang, { hotel });
    const arUrl = getPageShareUrl(page, 'ar', { hotel });
    const enUrl = getPageShareUrl(page, 'en', { hotel });

    const setLinkTag = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang 
        ? `link[rel="${rel}"][hreflang="${hreflang}"]` 
        : `link[rel="${rel}"]:not([hreflang])`;
      let el = document.querySelector(selector) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        if (hreflang) el.hreflang = hreflang;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    setLinkTag('canonical', canonicalUrl);
    setLinkTag('alternate', arUrl, 'ar');
    setLinkTag('alternate', enUrl, 'en');
    setLinkTag('alternate', arUrl, 'x-default');

    // Open Graph & Site Identity
    const siteName = isEn
      ? 'Prestige Hotels Management | برستيج لإدارة وتشغيل الفنادق'
      : 'برستيج لإدارة وتشغيل الفنادق | Prestige Hotels Management';
    setMetaTag('property', 'og:site_name', siteName);
    setMetaTag('name', 'application-name', siteName);
    setMetaTag('name', 'apple-mobile-web-app-title', isEn ? 'Prestige Hotels' : 'برستيج للفنادق');

    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', pageDescription);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:locale', isEn ? 'en_US' : 'ar_SA');
    setMetaTag('property', 'og:type', page === 'hotel-detail' ? 'place' : 'website');
    if (ogImage) {
      const absoluteImg = ogImage.startsWith('http') ? ogImage : `${origin}${ogImage}`;
      setMetaTag('property', 'og:image', absoluteImg);
      setMetaTag('name', 'twitter:image', absoluteImg);
    }

    // Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', pageDescription);
    setMetaTag('name', 'twitter:url', canonicalUrl);

    // 5. Structured Data (JSON-LD)
    const jsonLdId = 'dynamic-seo-jsonld';
    let scriptEl = document.getElementById(jsonLdId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = jsonLdId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    let structuredData: any;
    if (page === 'hotel-detail' && hotel) {
      const hotelName = isEn ? (hotel.nameEn || hotel.name) : hotel.name;
      const absoluteImg = hotel.mainImage?.startsWith('http') ? hotel.mainImage : `${origin}${hotel.mainImage || '/favicon.svg'}`;
      const citySlug = hotel.city.includes('مكة') ? 'makkah' : 'madinah';
      const cityLabel = isEn ? (hotel.city.includes('مكة') ? 'Hotels in Makkah' : 'Hotels in Madinah') : `فنادق ${hotel.city}`;

      structuredData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Hotel",
            "@id": `${canonicalUrl}#hotel`,
            "name": hotelName,
            "description": pageDescription,
            "url": canonicalUrl,
            "image": absoluteImg,
            "starRating": {
              "@type": "Rating",
              "ratingValue": hotel.stars || 4
            },
            "aggregateRating": hotel.reviewCount ? {
              "@type": "AggregateRating",
              "ratingValue": hotel.rating || 4.8,
              "reviewCount": hotel.reviewCount || 1,
              "bestRating": "5"
            } : undefined,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": hotel.city,
              "streetAddress": hotel.district || hotel.location?.address || hotel.city,
              "addressCountry": "SA"
            },
            "priceRange": "$$$",
            "telephone": hotel.hotelWhatsApp || siteSettings?.footerWhatsAppNumber || "+966544076726"
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${canonicalUrl}#breadcrumbs`,
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": isEn ? "Home" : "الرئيسية",
                "item": `${origin}/${lang}`
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": cityLabel,
                "item": `${origin}/${lang}/hotels/${citySlug}`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": hotelName,
                "item": canonicalUrl
              }
            ]
          }
        ]
      };
    } else if (page === 'home') {
      structuredData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${origin}/#website`,
            "name": isEn ? (siteSettings?.siteTitleEn || "Prestige for Hotels Management") : (siteSettings?.siteTitle || "برستيج لإدارة وتشغيل الفنادق"),
            "alternateName": [
              "Prestige for Hotels Management",
              "Prestige Hotels Management",
              "برستيج للضيافة",
              "برستيج أجياد",
              "Prestige Hotels"
            ],
            "url": `${origin}/`,
            "description": pageDescription,
            "publisher": { "@id": `${origin}/#organization` },
            "inLanguage": isEn ? "en" : "ar"
          },
          {
            "@type": "Organization",
            "@id": `${origin}/#organization`,
            "name": companyTitle,
            "alternateName": [
              "Prestige for Hotels Management",
              "Prestige Hotels Management",
              "شركة برستيج لإدارة وتشغيل الفنادق"
            ],
            "url": `${origin}/`,
            "logo": {
              "@type": "ImageObject",
              "url": `${origin}/images/brand/logo.png`,
              "width": 512,
              "height": 256
            },
            "image": `${origin}/images/brand/logo.png`,
            "description": pageDescription,
            "telephone": siteSettings?.footerWhatsAppNumber || siteSettings?.primaryPhone || "+966560580250",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": siteSettings?.footerWhatsAppNumber || siteSettings?.primaryPhone || "+966560580250",
              "contactType": "customer support",
              "areaServed": "SA",
              "availableLanguage": ["Arabic", "English"]
            }
          },
          {
            "@type": "FAQPage",
            "@id": `${origin}/#faq`,
            "mainEntity": [
              {
                "@type": "Question",
                "name": isEn 
                  ? "How can I book Makkah and Madinah hotels directly with Prestige?" 
                  : "كيف يمكنني حجز فنادق مكة والمدينة عبر شركة برستيج؟",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": isEn
                    ? "You can book directly through our online booking portal or by contacting our 24/7 reservation consultants via WhatsApp for instant confirmation and exclusive seasonal rates."
                    : "يمكنك الحجز مباشرة عبر الموقع الإلكتروني من خلال بوابة الحجز الإلكتروني، أو عبر التواصل المباشر مع استشاريي التسكين عبر الواتساب على مدار الساعة لضمان أفضل الأسعار وتأكيد الحجز الفوري."
                }
              },
              {
                "@type": "Question",
                "name": isEn 
                  ? "Which Prestige hotels are closest to the Holy Mosques in Makkah and Madinah?" 
                  : "ما هي أقرب فنادق برستيج للحرم المكي والمسجد النبوي الشريف؟",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": isEn
                    ? "Our portfolio includes prime properties like Prestige Ajyad Hotel (450m from the Holy Mosque courtyard in Makkah), hotels in Mahbas Al-Jin with 24/7 shuttle service, and central district hotels in Madinah facing the Prophet's Mosque."
                    : "تضم محفظة برستيج فنادق متميزة مثل فندق برستيج أجياد (450 متراً فقط من ساحة الحرم المكي)، وفنادق بمحبس الجن والمسفلة مع حافلات ترددية، بالإضافة إلى فنادق المنطقة المركزية بالمدينة المنورة بالقرب من المسجد النبوي."
                }
              },
              {
                "@type": "Question",
                "name": isEn 
                  ? "Does Prestige provide corporate rates and packages for Umrah and Hajj groups?" 
                  : "هل توفر شركة برستيج عقود وأسعار خاصة لشركات العمرة والمجموعات؟",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": isEn
                    ? "Yes, Prestige offers tailored corporate contracts, seasonal bulk allocations, full catering buffets, and private luxury transport for international agencies and group operators."
                    : "نعم، توفر برستيج أسعاراً تفضيلية وعقود تسكين موسمية مباشرة للشركات والوكالات السياحية ومجموعات الحج والعمرة مع خدمات إعاشة ونقل وحافلات خاصة."
                }
              }
            ]
          }
        ]
      };
    } else {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        "name": companyTitle,
        "url": origin,
        "logo": `${origin}/images/brand/logo.png`,
        "description": pageDescription,
        "telephone": siteSettings?.footerWhatsAppNumber || "+966560580250"
      };
    }

    setMetaTag('property', 'og:site_name', isEn ? 'Prestige Hotels Management' : (siteSettings?.siteTitle || 'برستيج لإدارة وتشغيل الفنادق'));

    scriptEl.textContent = JSON.stringify(structuredData);
  }, [page, lang, hotel, siteSettings, customTitle, customDescription]);

  return null;
};
