const fs = require('fs');

const SUPABASE_URL = 'https://nejmudhoamtugdaqfbdd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lam11ZGhvYW10dWdkYXFmYmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2ODM3NDgsImV4cCI6MjEwNjI1OTc0OH0.E_VF3-JH9wyWxgSJyHBk8SS8BQM1nrDLYZN9I9YU6P8';

const headers = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY };

async function buildMockHotels() {
  const [hotelsRes, offersRes] = await Promise.all([
    fetch(SUPABASE_URL + '/rest/v1/hotels?select=*&order=order_num.asc,rating.desc', { headers }),
    fetch(SUPABASE_URL + '/rest/v1/offers?select=*', { headers })
  ]);

  const rawHotels = await hotelsRes.json();
  const rawOffers = await offersRes.json();

  const safeParseArray = (val) => {
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
      try {
        const p = JSON.parse(val);
        if (Array.isArray(p)) return p.filter(Boolean);
      } catch {}
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const cleanHotels = rawHotels.map(h => {
    let loc = {};
    try {
      loc = typeof h.location === 'object' && h.location ? h.location : (typeof h.location === 'string' ? JSON.parse(h.location || '{}') : {});
    } catch { loc = {}; }

    const rawGallery = safeParseArray(h.gallery_images || h.galleryImages);
    const cleanGallery = rawGallery.filter(Boolean).map(item => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object' && item !== null) {
        return {
          url: (item.url || '').trim(),
          category: item.category || 'all',
          title: item.title || ''
        };
      }
      return null;
    }).filter(item => typeof item === 'string' ? Boolean(item) : Boolean(item?.url));

    return {
      id: h.id,
      name: h.name,
      nameEn: h.name_en || h.nameEn || '',
      city: h.city,
      district: h.district || '',
      stars: h.stars || 4,
      distanceToHaram: h.distance_to_haram ?? h.distanceToHaram ?? 0,
      distanceText: h.distance_text || h.distanceText || (h.distance_to_haram ? h.distance_to_haram + ' متراً عن ساحة الحرم' : ''),
      walkingTimeMinutes: h.walking_time_minutes ?? h.walkingTimeMinutes ?? 5,
      featured: h.featured ?? true,
      isActive: h.is_active ?? h.isActive ?? true,
      order: h.order_num ?? h.order ?? 0,
      categories: safeParseArray(h.categories),
      rating: h.rating || 4.8,
      reviewCount: h.review_count ?? h.reviewCount ?? 0,
      mainImage: h.main_image || h.mainImage || '',
      galleryImages: cleanGallery,
      videoUrl: h.video_url || h.videoUrl || '',
      overview: h.overview || '',
      detailedDescription: h.detailed_description || h.detailedDescription || '',
      amenities: safeParseArray(h.amenities),
      bookingUrl: h.booking_url || h.bookingUrl || '',
      showBookingUrl: h.show_booking_url !== false,
      agodaUrl: h.agoda_url || h.agodaUrl || '',
      showAgodaUrl: h.show_agoda_url !== false,
      expediaUrl: h.expedia_url || h.expediaUrl || '',
      showExpediaUrl: h.show_expedia_url !== false,
      googleMapsUrl: h.google_maps_url || h.googleMapsUrl || '',
      showGoogleMapsUrl: h.show_google_maps_url !== false,
      hotelWhatsApp: h.hotel_whatsapp || h.hotelWhatsApp || '',
      showHotelWhatsApp: h.show_hotel_whatsapp !== false,
      hotelEmail: h.hotel_email || h.hotelEmail || '',
      showHotelEmail: h.show_hotel_email !== false,
      location: loc,
      keywords: h.keywords || '',
      onlineBookingEnabled: h.online_booking_enabled ?? true
    };
  });

  const code = `// Instant Initial Data Seed (0ms Load Time - Zero Latency for New Clients)
import { Hotel, Offer, HotelReview, SiteSettings } from '../types';
import { DEFAULT_ACTION_BUTTONS } from '../utils/actionButtons';

export const INITIAL_HOTELS: Hotel[] = ${JSON.stringify(cleanHotels, null, 2)};

export const INITIAL_OFFERS: Offer[] = ${JSON.stringify(Array.isArray(rawOffers) ? rawOffers : [], null, 2)};

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
`;

  fs.writeFileSync('./src/data/mockHotels.ts', code, 'utf8');
  console.log(`[sync] Successfully synchronized ${cleanHotels.length} hotels into mockHotels.ts`);
}

buildMockHotels().catch(console.error);
