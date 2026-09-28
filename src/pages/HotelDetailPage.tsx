import React, { useState, useEffect } from 'react';
import { Hotel, ActivePage, SiteSettings } from '../types';
import { HotelCard } from '../components/HotelCard';
import { Lightbox, LightboxMediaItem } from '../components/Lightbox';
import { SafeVideoPlayer } from '../components/SafeVideoPlayer';
import { AddReviewModal } from '../components/AddReviewModal';
import { HotelImageGallery } from '../components/HotelImageGallery';
import { HotelBookingModal } from '../components/HotelBookingModal';
import { BookingComIcon, AgodaIcon, ExpediaIcon, GoogleMapsIcon, WhatsAppIcon, EmailIcon } from '../components/BookingIcons';
import { useSEO } from '../utils/seo';
import { getFirstActiveWhatsApp, getChannelHref } from '../utils/channels';
import { useLanguage } from '../context/LanguageContext';
import { 
  Star, 
  MapPin, 
  Footprints, 
  Play, 
  Images, 
  Share2, 
  Check, 
  Wifi, 
  Utensils, 
  Airplay, 
  Bus, 
  Building2, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  PhoneCall, 
  Sparkles,
  ArrowRight,
  Tv,
  Accessibility,
  MessageSquarePlus,
  BedDouble,
  Users,
  Copy
} from 'lucide-react';
import { getHotelShareUrl, getHotelSlug } from '../utils/routing';

interface HotelDetailPageProps {
  hotel: Hotel;
  allHotels: Hotel[];
  onBack: () => void;
  onSelectHotel: (hotelId: string) => void;
  onNavigate: (page: ActivePage) => void;
  siteSettings?: SiteSettings;
}

export const HotelDetailPage: React.FC<HotelDetailPageProps> = ({
  hotel,
  allHotels,
  onBack,
  onSelectHotel,
  onNavigate,
  siteSettings
}) => {
  const { language, t, translateDynamic, isRtl } = useLanguage();
  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Active Tab
  type TabKey = 'description' | 'gallery' | 'rooms' | 'amenities' | 'location' | 'videos' | 'reviews';
  const [activeTab, setActiveTab] = useState<TabKey>('description');

  // Read more toggle for description
  const [isExpandedDescription, setIsExpandedDescription] = useState(false);

  // Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    roomCount: '1',
    adults: '2'
  });
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const shareUrl = getHotelShareUrl(hotel);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`شاهد تفاصيل وعروض الإقامة في ${hotel.name} (${hotel.city}):\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Dynamic SEO Meta Tags for Hotel
  useSEO({
    title: `${hotel.name} - فنادق ${hotel.city}`,
    description: hotel.metaDescription || hotel.overview || hotel.detailedDescription,
    keywords: hotel.keywords || `${hotel.name}, فنادق ${hotel.city}, حجز فندق ${hotel.name}, فنادق قريبة من الحرم, تسكين معتمرين`,
    image: hotel.mainImage,
    url: shareUrl,
    type: 'product'
  });

  // Scroll to top on mount or hotel change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsExpandedDescription(false);
    setActiveTab('description');
  }, [hotel.id]);

  // Build complete media items for Lightbox
  const allMediaItems: LightboxMediaItem[] = [];

  if (hotel.videoUrl) {
    allMediaItems.push({
      type: 'video',
      url: hotel.videoUrl,
      title: `فيديو تعريفي - ${hotel.name}`,
      thumbnail: hotel.mainImage
    });
  }

  // Combine main and gallery images without duplicates
  const uniqueImages = Array.from(new Set([hotel.mainImage, ...hotel.galleryImages]));
  uniqueImages.forEach((imgUrl, i) => {
    allMediaItems.push({
      type: 'image',
      url: imgUrl,
      title: `${hotel.name} - صورة ${i + 1}`
    });
  });

  if (hotel.additionalVideos) {
    hotel.additionalVideos.forEach(v => {
      allMediaItems.push({
        type: 'video',
        url: v.videoUrl,
        title: v.title,
        thumbnail: v.thumbnail
      });
    });
  }

  const openLightboxAt = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Similar hotels (same city, excluding current)
  const similarHotels = allHotels
    .filter(h => h.id !== hotel.id && h.city === hotel.city)
    .slice(0, 3);

  const fallbackSimilar = similarHotels.length > 0 
    ? similarHotels 
    : allHotels.filter(h => h.id !== hotel.id).slice(0, 3);

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'description', label: language === 'en' ? 'Overview' : 'الوصف الشامل' },
    { key: 'gallery', label: language === 'en' ? 'Photo Gallery' : 'معرض صور المرافق', count: uniqueImages.length },
    { key: 'rooms', label: language === 'en' ? 'Rooms & Suites' : 'الغرف والأجنحة' },
    { key: 'amenities', label: language === 'en' ? 'Amenities & Services' : 'المرافق والخدمات', count: hotel.amenities.length },
    { key: 'location', label: language === 'en' ? 'Location & Map' : 'الموقع والخريطة' },
    { key: 'videos', label: language === 'en' ? 'Room Tours & Videos' : 'الفيديوهات وجولات الغرف', count: (hotel.additionalVideos?.length || 0) + (hotel.videoUrl ? 1 : 0) },
    { key: 'reviews', label: language === 'en' ? 'Guest Reviews' : 'التقييمات وتجارب النزلاء', count: (hotel.reviewsList?.length || 0) + (hotel.reviewCount || 0) }
  ];

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBookedSuccess(true);
    setTimeout(() => {
      setIsBookedSuccess(false);
      setBookingModalOpen(false);
    }, 2800);
  };

  const primaryWhatsApp = getFirstActiveWhatsApp(siteSettings?.channels);
  const waCustomMessage = language === 'en'
    ? `Hello, I would like to inquire and book a stay at ${hotel.name} (${hotel.city} - ${hotel.district}) via ${siteSettings?.siteTitle || 'Prestige Hotels Management'}.`
    : `السلام عليكم ورحمة الله، أود الاستفسار وحجز إقامة في ${hotel.name} (${hotel.city} - حي ${hotel.district}) عبر ${siteSettings?.siteTitle || 'برستيج لإدارة وتشغيل الفنادق'}.`;
  const whatsAppBookingUrl = primaryWhatsApp
    ? getChannelHref(primaryWhatsApp, waCustomMessage)
    : `https://wa.me/966500000000?text=${encodeURIComponent(waCustomMessage)}`;

  const getAmenityIcon = (text: string) => {
    if (text.includes('واي فاي') || text.includes('إنترنت')) return <Wifi className="w-5 h-5" />;
    if (text.includes('إفطار') || text.includes('مطعم') || text.includes('طعام')) return <Utensils className="w-5 h-5" />;
    if (text.includes('تكييف')) return <Airplay className="w-5 h-5" />;
    if (text.includes('نقل') || text.includes('حافلات') || text.includes('سيارات')) return <Bus className="w-5 h-5" />;
    if (text.includes('احتياجات') || text.includes('كراسي')) return <Accessibility className="w-5 h-5" />;
    if (text.includes('تلفزيون') || text.includes('شاشة')) return <Tv className="w-5 h-5" />;
    return <Sparkles className="w-5 h-5" />;
  };

  return (
    <div id="hotel-detail-page" className="min-h-screen bg-[#F8F7F4] text-stone-900 pt-24 pb-28">
      {/* Lightbox Modal */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        mediaItems={allMediaItems}
        initialIndex={lightboxIndex}
      />

      {/* Review Modal */}
      <AddReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        hotels={allHotels}
        initialHotelId={hotel.id}
      />

      {/* Main Container */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        {/* Navigation Breadcrumb / Back Button */}
        <div className="flex items-center justify-between py-4 mb-4 text-xs sm:text-sm text-stone-500">
          <button
            id="detail-back-button"
            onClick={onBack}
            className="flex items-center gap-2 hover:text-[#C9A24B] transition-colors py-1.5 px-3 rounded-xl bg-white border border-stone-200 shadow-sm cursor-pointer"
          >
            <ArrowRight className={`w-4 h-4 text-[#C9A24B] ${isRtl ? '' : 'rotate-180'}`} />
            <span>{language === 'en' ? 'Back to Hotels' : 'العودة إلى قائمة الفنادق'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">{t('nav.home', 'الرئيسية')}</span>
            <span className="hidden sm:inline">/</span>
            <span>{translateDynamic(hotel.city)}</span>
            <span>/</span>
            <span className="text-stone-900 font-medium truncate max-w-[150px] sm:max-w-none">{translateDynamic(hotel.name)}</span>
          </div>
        </div>

        {/* Hotel Main Title Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold border border-[#C9A24B]/30 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {translateDynamic(hotel.city)} - {language === 'en' ? `${translateDynamic(hotel.district)} District` : `حي ${hotel.district}`}
              </span>
              <div className="flex items-center gap-1">
                {[...Array(hotel.stars)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9A24B] text-[#C9A24B]" />
                ))}
              </div>
              <span className="text-xs text-stone-500">
                ({hotel.rating} {language === 'en' ? 'out of 5 stars' : 'من 5 نجوم'})
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-cairo font-extrabold text-stone-900 tracking-tight">
              {translateDynamic(hotel.name)}
            </h1>
            {hotel.nameEn && (
              <p className="text-xs sm:text-sm text-stone-500 font-sans tracking-wide mt-1">
                {hotel.nameEn}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Share / Copy Direct Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                  : 'bg-white border-stone-200 hover:border-[#C9A24B] text-stone-700 hover:text-[#B38A34] shadow-xs'
              }`}
              title={language === 'en' ? 'Copy page URL' : 'نسخ رابط صفحة هذا الفندق'}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'en' ? 'Link Copied!' : 'تم نسخ الرابط!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#C9A24B]" />
                  <span>{language === 'en' ? 'Copy Link' : 'نسخ الرابط'}</span>
                </>
              )}
            </button>

            {/* Share on WhatsApp Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
              title={language === 'en' ? 'Share via WhatsApp' : 'مشاركة رابط الفندق عبر الواتساب'}
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'en' ? 'Share on WhatsApp' : 'مشاركة عبر الواتساب'}</span>
            </button>

            {/* Google Maps Link */}
            {hotel.showGoogleMapsUrl !== false && (
              <a
                href={hotel.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-stone-700 hover:text-stone-950 shadow-sm transition-all flex items-center gap-1.5 text-xs font-semibold"
                title="خرائط جوجل"
              >
                <GoogleMapsIcon className="w-4 h-4" />
                <span className="hidden md:inline">{language === 'en' ? 'Map Location' : 'الموقع بالخريطة'}</span>
              </a>
            )}

            {/* Booking.com Link */}
            {hotel.showBookingUrl !== false && (
              <a
                href={hotel.bookingUrl || `https://www.booking.com/searchresults.ar.html?ss=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#003580] hover:bg-[#00224f] text-white shadow-sm transition-all flex items-center gap-1.5 text-xs font-semibold"
                title="Booking.com"
              >
                <BookingComIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Booking</span>
              </a>
            )}

            {/* Agoda Link */}
            {hotel.showAgodaUrl !== false && (
              <a
                href={hotel.agodaUrl || `https://www.agoda.com/search?text=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#5856D6] hover:bg-[#4340c2] text-white shadow-sm transition-all flex items-center gap-1.5 text-xs font-semibold"
                title="Agoda"
              >
                <AgodaIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Agoda</span>
              </a>
            )}

            {/* Expedia Link */}
            {hotel.showExpediaUrl !== false && !!hotel.expediaUrl && (
              <a
                href={hotel.expediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#FFCC00] hover:bg-[#e6b800] text-[#002244] shadow-sm transition-all flex items-center gap-1.5 text-xs font-bold"
                title="Expedia"
              >
                <ExpediaIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Expedia</span>
              </a>
            )}

            {/* Direct Email Link */}
            {hotel.showHotelEmail !== false && !!hotel.hotelEmail && (
              <a
                href={`mailto:${hotel.hotelEmail}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#EA4335] hover:bg-[#d33828] text-white shadow-sm transition-all flex items-center gap-1.5 text-xs font-semibold"
                title={`البريد الإلكتروني: ${hotel.hotelEmail}`}
              >
                <EmailIcon className="w-4 h-4" />
                <span className="hidden md:inline">البريد</span>
              </a>
            )}

            {/* Share Link */}
            <button 
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('تم نسخ رابط الفندق لمشاركته');
                }
              }}
              className="p-2.5 rounded-xl bg-white border border-stone-200 hover:border-[#C9A24B] text-stone-700 hover:text-stone-900 shadow-sm transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <Share2 className="w-4 h-4 text-[#C9A24B]" />
              <span className="hidden sm:inline">مشاركة</span>
            </button>
          </div>
        </div>

        {/* Gallery Mosaic */}
        <section id="gallery-mosaic-hero" className="mb-8 relative select-none">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 sm:gap-3 rounded-2xl sm:rounded-3xl overflow-hidden max-h-[500px]">
            {/* Primary Large Image */}
            <div 
              id="gallery-main-item"
              onClick={() => openLightboxAt(0)}
              className="md:col-span-2 relative aspect-[16/10] md:aspect-auto md:h-full bg-stone-100 cursor-pointer group overflow-hidden"
            >
              <img
                src={hotel.mainImage}
                alt={hotel.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

              {hotel.videoUrl && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/70 backdrop-blur-md border border-[#C9A24B] flex items-center justify-center text-[#DFBE72] shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current translate-x-[-2px]" />
                  </div>
                  <span className={`absolute bottom-4 ${isRtl ? 'right-4' : 'left-4'} px-3 py-1 rounded-lg bg-black/80 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5`}>
                    <Play className="w-3.5 h-3.5 text-[#C9A24B] fill-[#C9A24B]" />
                    <span>{language === 'en' ? 'Promo Video Available' : 'فيديو تعريفي متوفر'}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Left 4 Smaller Images Grid */}
            <div className="hidden md:grid col-span-2 grid-cols-2 gap-2.5 sm:gap-3">
              {(hotel.galleryImages.slice(1, 5).length > 0
                ? hotel.galleryImages.slice(1, 5)
                : [hotel.mainImage, hotel.mainImage, hotel.mainImage, hotel.mainImage]
              ).map((imgUrl, idx) => (
                <div
                  key={idx}
                  id={`gallery-thumb-item-${idx}`}
                  onClick={() => openLightboxAt(hotel.videoUrl ? idx + 1 : idx + 1)}
                  className="relative aspect-[4/3] bg-stone-100 cursor-pointer group overflow-hidden"
                >
                  <img
                    src={imgUrl}
                    alt={`${hotel.name} - ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* View all photos & interactive gallery buttons */}
          <div className={`absolute bottom-4 ${isRtl ? 'left-4' : 'right-4'} z-10 flex items-center gap-2 flex-wrap`}>
            <button
              id="view-interactive-gallery-btn"
              onClick={() => {
                setActiveTab('gallery');
                const target = document.getElementById('hotel-tabs-container');
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#b58e37] text-white font-bold text-xs sm:text-sm border border-[#DFBE72]/40 backdrop-blur-md transition-all shadow-xl flex items-center gap-2 cursor-pointer"
            >
              <Images className="w-4 h-4 text-white" />
              <span>{language === 'en' ? 'Photo Gallery' : 'معرض صور المرافق'}</span>
            </button>

            <button
              id="view-all-photos-btn"
              onClick={() => openLightboxAt(0)}
              className="px-3.5 py-2 rounded-xl bg-black/80 hover:bg-black text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all shadow-xl flex items-center gap-1.5 cursor-pointer"
            >
              <span>{language === 'en' ? `Enlarge All (${allMediaItems.length})` : `تكبير الكل (${allMediaItems.length})`}</span>
            </button>
          </div>
        </section>

        {/* Sticky Info Bar */}
        <section 
          id="hotel-sticky-info-bar"
          className="sticky top-[68px] z-30 bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl p-4 sm:p-5 mb-8 shadow-md flex flex-wrap items-center justify-between gap-4 transition-all"
        >
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div>
              <span className="text-[11px] text-stone-500 block">{language === 'en' ? 'Selected Hotel' : 'الفندق المحدد'}</span>
              <strong className="text-sm sm:text-base text-stone-900 font-cairo truncate max-w-[220px] block">
                {language === 'en' && hotel.nameEn ? hotel.nameEn : translateDynamic(hotel.name)}
              </strong>
            </div>

            {/* Distance Meter */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-800">
              <Footprints className="w-4 h-4 text-[#C9A24B]" />
              <span>{translateDynamic(hotel.distanceText)}</span>
              <span className="text-stone-500">
                {language === 'en' ? `(${hotel.walkingTimeMinutes} min walk)` : `(${hotel.walkingTimeMinutes} دقائق مشياً)`}
              </span>
            </div>

            {/* Star badge */}
            <div className="hidden lg:flex items-center gap-1 text-xs text-[#B38A34]">
              {[...Array(hotel.stars)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current text-[#C9A24B]" />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 mr-auto sm:mr-0 flex-wrap">
            {/* Direct Google Maps */}
            {hotel.showGoogleMapsUrl !== false && (
              <a
                href={hotel.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-transform hover:scale-105"
                title="موقع الفندق على خرائط جوجل"
              >
                <GoogleMapsIcon className="w-5 h-5" />
              </a>
            )}

            {/* Direct Booking.com */}
            {hotel.showBookingUrl !== false && (
              <a
                href={hotel.bookingUrl || `https://www.booking.com/searchresults.ar.html?ss=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#003580] hover:bg-[#00224f] text-white transition-transform hover:scale-105"
                title="رابط الحجز على Booking.com"
              >
                <BookingComIcon className="w-5 h-5" />
              </a>
            )}

            {/* Direct Agoda */}
            {hotel.showAgodaUrl !== false && (
              <a
                href={hotel.agodaUrl || `https://www.agoda.com/search?text=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#5856D6] hover:bg-[#4340c2] text-white transition-transform hover:scale-105"
                title="رابط الحجز على Agoda"
              >
                <AgodaIcon className="w-5 h-5" />
              </a>
            )}

            {/* Direct Expedia */}
            {hotel.showExpediaUrl !== false && !!hotel.expediaUrl && (
              <a
                href={hotel.expediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#FFCC00] hover:bg-[#e6b800] text-[#002244] transition-transform hover:scale-105"
                title="رابط الحجز على Expedia"
              >
                <ExpediaIcon className="w-5 h-5" />
              </a>
            )}

            {/* Direct Email */}
            {hotel.showHotelEmail !== false && !!hotel.hotelEmail && (
              <a
                href={`mailto:${hotel.hotelEmail}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#EA4335] hover:bg-[#d33828] text-white transition-transform hover:scale-105"
                title={`البريد الإلكتروني: ${hotel.hotelEmail}`}
              >
                <EmailIcon className="w-5 h-5" />
              </a>
            )}

            {/* Direct WhatsApp CTA */}
            {hotel.showHotelWhatsApp !== false && (
              <a
                id="sticky-whatsapp-book-btn"
                href={whatsAppBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>{language === 'en' ? 'WhatsApp Booking' : 'حجز واتساب'}</span>
              </a>
            )}

            {/* Gold CTA "طلب حجز واستفسار" */}
            <button
              id="sticky-book-now-button"
              onClick={() => setBookingModalOpen(true)}
              className="px-4 sm:px-6 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              {language === 'en' ? 'Book / Inquire' : 'للتواصل أو الحجز'}
            </button>
          </div>
        </section>

        {/* Tabs Container */}
        <section id="hotel-tabs-container" className="mb-14">
          <div className="border-b border-stone-200 mb-8 relative flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`hotel-tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all relative whitespace-nowrap flex items-center gap-2 ${
                    isSelected ? 'text-[#B38A34] font-bold' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isSelected ? 'bg-[#C9A24B]/20 text-[#B38A34]' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {isSelected && (
                    <span className="absolute bottom-0 inset-x-0 h-[2.5px] bg-[#C9A24B] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm transition-opacity duration-300">
            {/* 1. Tab: Description */}
            {activeTab === 'description' && (
              <div id="tab-pane-description" className="space-y-6">
                <h3 className="font-cairo font-bold text-xl text-stone-900">
                  {language === 'en' ? 'Accommodation Overview' : 'نظرة عامة على الإقامة'}
                </h3>
                <p className="text-base text-stone-700 leading-relaxed font-normal">
                  {translateDynamic(hotel.overview)}
                </p>

                <div className="border-t border-stone-200 pt-5">
                  <h4 className="font-cairo font-bold text-lg text-stone-900 mb-3">
                    {language === 'en' ? 'Hotel Details & Haram Proximity' : 'التفاصيل الفندقية وموقع الحرم'}
                  </h4>
                  <div
                    className={`overflow-hidden transition-all duration-400 text-sm sm:text-base text-stone-600 leading-loose whitespace-pre-line ${
                      isExpandedDescription ? 'max-h-[1200px]' : 'max-h-[130px] relative'
                    }`}
                  >
                    {translateDynamic(hotel.detailedDescription)}
                    {!isExpandedDescription && (
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}
                  </div>

                  <button
                    id="read-more-desc-btn"
                    onClick={() => setIsExpandedDescription(!isExpandedDescription)}
                    className="mt-3 text-xs sm:text-sm font-bold text-[#B38A34] hover:text-[#C9A24B] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isExpandedDescription ? (
                      <>
                        <span>{language === 'en' ? 'Show less' : 'عرض أقل'}</span>
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>{language === 'en' ? 'Read more hotel details' : 'قراءة المزيد من تفاصيل الفندق'}</span>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 2. Tab: Image Gallery (معرض صور المرافق) */}
            {activeTab === 'gallery' && (
              <div id="tab-pane-gallery">
                <HotelImageGallery
                  hotel={hotel}
                  onOpenLightbox={openLightboxAt}
                  showFacilityShowcase={true}
                />
              </div>
            )}

            {/* 3. Tab: Rooms & Suites */}
            {activeTab === 'rooms' && (
              <div id="tab-pane-rooms" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-cairo font-bold text-xl text-stone-900">
                      {language === 'en' ? 'Rooms & Suites Options' : 'خيارات الغرف والأجنحة الفندقية'}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-500">
                      {language === 'en'
                        ? 'Rooms equipped with the highest standards of comfort for individuals, families, and groups'
                        : 'غرف مجهزة بأعلى معايير الراحة الفندقية لتلائم الأفراد والعائلات والمجموعات'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-[#C9A24B] transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                        <BedDouble className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-cairo font-bold text-base text-stone-900">
                          {language === 'en' ? 'Classic Twin / King Room' : 'غرفة كلاسيكية ثنائية (Twin / King)'}
                        </h4>
                        <span className="text-xs text-stone-500">
                          {language === 'en' ? 'Accommodates up to 2 adults' : 'تتسع لشخصين بالغين'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed mb-4">
                      {language === 'en'
                        ? 'Twin beds or king bed with private marble bathroom, smart TV, and equipped minibar.'
                        : 'سريران مفردان أو سرير كينج مع حمام رخامي خاص، شاشة تلفاز ذكية، وميني بار مجهز.'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-stone-700">
                      <Check className="w-3.5 h-3.5 text-[#B38A34]" />
                      <span>
                        {language === 'en'
                          ? 'Serene view, quiet central AC, high-speed Wi-Fi'
                          : 'إطلالة مريحة، تكييف مركزي هادئ، واي فاي فائق السرعة'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-[#C9A24B] transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-cairo font-bold text-base text-stone-900">
                          {language === 'en' ? 'Family Triple / Quad Room' : 'غرفة عائلية ثلاثية / رباعية (Triple/Quad)'}
                        </h4>
                        <span className="text-xs text-stone-500">
                          {language === 'en' ? 'Accommodates 3 - 4 guests' : 'تتسع لـ ٣ - ٤ أشخاص'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed mb-4">
                      {language === 'en'
                        ? 'Spacious layout ideal for families and pilgrims, with separate beds and large wardrobes.'
                        : 'مساحة رحبة تناسب العائلات والمعتمرين، مع أسرة منفصلة وخزائن ملابس واسعة.'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-stone-700">
                      <Check className="w-3.5 h-3.5 text-[#B38A34]" />
                      <span>
                        {language === 'en' ? 'Ideal for families, 24/7 room service' : 'مثالية للعائلات، خدمة غرف على مدار الساعة'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#C9A24B]/40 hover:border-[#C9A24B] transition-all md:col-span-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#C9A24B] text-white flex items-center justify-center shadow-sm">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-cairo font-bold text-base text-stone-900">
                          {language === 'en' ? 'Executive / Royal Haram View Suite' : 'جناح تنفيذي / ملكي مطل على الحرم'}
                        </h4>
                        <span className="text-xs text-[#B38A34] font-semibold">
                          {language === 'en'
                            ? 'Direct panoramic view of Holy Kaaba / Prophet Mosque'
                            : 'إطلالة بانورامية مباشرة على الكعبة المشرفة / المسجد النبوي'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed mb-4">
                      {language === 'en'
                        ? 'Master bedroom with separate living hall, dining area, jacuzzi bathroom, and live Haram audio system.'
                        : 'غرفة نوم رئيسية فاخرة مع صالة جلوس مستقلة، طاولة طعام، حمام جاكوزي، ونظام صوتي متصل بأذان الحرم المكي الشريف.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-700">
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-[#B38A34]" /> {language === 'en' ? 'Direct View' : 'إطلالة مباشرة'}</span>
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-[#B38A34]" /> {language === 'en' ? 'Luxury Living Hall' : 'صالة معيشة فاخرة'}</span>
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-[#B38A34]" /> {language === 'en' ? 'VIP Hospitality' : 'خدمة كبار الشخصيات VIP'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Tab: Amenities */}
            {activeTab === 'amenities' && (
              <div id="tab-pane-amenities" className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-cairo font-bold text-xl text-stone-900">
                      {language === 'en' ? 'Featured Amenities & Included Services' : 'المرافق المتميزة والخدمات المشمولة'}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-500">
                      {language === 'en'
                        ? 'Full hotel hospitality services & 5-star facilities ensuring highest peace of mind'
                        : 'خدمات فندقية متكاملة ومرافق 5 نجوم لضمان أعلى مستويات الراحة لضيوف الرحمن'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className="px-4 py-2 rounded-xl bg-[#C9A24B]/15 hover:bg-[#C9A24B] text-[#B38A34] hover:text-white font-bold text-xs border border-[#C9A24B]/30 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <Images className="w-4 h-4" />
                    <span>{language === 'en' ? 'Browse All Facilities Photos' : 'تصفح معرض صور كافة المرافق'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3.5 p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-[#C9A24B]/40 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/10 text-[#B38A34] flex items-center justify-center shrink-0">
                        {getAmenityIcon(amenity)}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-stone-800">
                        {translateDynamic(amenity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Embedded Mini Facility Gallery Carousel */}
                <div className="pt-6 border-t border-stone-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-cairo font-bold text-base text-stone-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#B38A34]" />
                      <span>{language === 'en' ? 'Live Snapshots of Hotel Facilities' : 'لقطات حية لمرافق الفندق'}</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('gallery')}
                      className="text-xs font-bold text-[#B38A34] hover:text-[#C9A24B] flex items-center gap-1 cursor-pointer"
                    >
                      <span>{language === 'en' ? 'Interactive Gallery' : 'عرض المعرض التفاعلي'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {uniqueImages.slice(0, 4).map((imgUrl, i) => (
                      <div
                        key={i}
                        onClick={() => openLightboxAt(hotel.videoUrl ? i + 1 : i)}
                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer bg-stone-100 border border-stone-200 hover:border-[#C9A24B] shadow-sm transition-all"
                      >
                        <img
                          src={imgUrl}
                          alt={`${hotel.name} - ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        <span className={`absolute bottom-2 ${isRtl ? 'right-2' : 'left-2'} px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-cairo backdrop-blur-sm`}>
                          {i === 0 
                            ? (language === 'en' ? 'Facade' : 'الواجهة')
                            : i === 1 
                            ? (language === 'en' ? 'Suites' : 'الأجنحة')
                            : i === 2 
                            ? (language === 'en' ? 'Dining' : 'المطعم')
                            : (language === 'en' ? 'Lobby' : 'البهو')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Tab: Location */}
            {activeTab === 'location' && (
              <div id="tab-pane-location" className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-cairo font-bold text-xl text-stone-900 mb-1">
                      {language === 'en' ? 'Geographic Location & Holy Mosque Proximity' : 'الموقع الجغرافي وقرب الحرم الشريف'}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-500 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#C9A24B]" />
                      <span>{translateDynamic(hotel.location.address)} ({language === 'en' ? `${translateDynamic(hotel.district)} District` : `حي ${hotel.district}`})</span>
                    </p>
                  </div>

                  <a
                    id="get-directions-button"
                    href={`https://maps.google.com/?q=${hotel.location.lat},${hotel.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-[#C9A24B] text-stone-800 hover:text-white font-semibold text-xs border border-stone-200 hover:border-[#C9A24B] transition-colors flex items-center gap-2 self-start sm:self-auto"
                  >
                    <span>{language === 'en' ? 'Get Directions on Google Maps' : 'احصل على الاتجاهات في Google Maps'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="text-center p-3">
                    <span className="text-xs text-stone-500 block mb-1">{language === 'en' ? 'Actual Distance' : 'المسافة الفعلية'}</span>
                    <strong className="text-lg font-bold text-[#B38A34]">{hotel.distanceToHaram} {language === 'en' ? 'meters' : 'متراً'}</strong>
                  </div>
                  <div className="text-center p-3 border-r sm:border-r-0 sm:border-x border-stone-200">
                    <span className="text-xs text-stone-500 block mb-1">{language === 'en' ? 'Walking Time' : 'وقت المشي المتوقع'}</span>
                    <strong className="text-lg font-bold text-[#B38A34]">{hotel.walkingTimeMinutes} {language === 'en' ? 'minutes' : 'دقائق'}</strong>
                  </div>
                  <div className="text-center p-3">
                    <span className="text-xs text-stone-500 block mb-1">{language === 'en' ? 'View Type' : 'نوع الإطلالة'}</span>
                    <strong className="text-base font-bold text-stone-900">{translateDynamic(hotel.location.viewType)}</strong>
                  </div>
                </div>

                <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 relative">
                  <iframe
                    title={`location of ${hotel.name}`}
                    src={hotel.location.mapEmbedUrl || `https://maps.google.com/maps?q=${hotel.location.lat},${hotel.location.lng}&hl=${language}&z=17&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* 5. Tab: Videos */}
            {activeTab === 'videos' && (
              <div id="tab-pane-videos" className="space-y-8">
                <div>
                  <h3 className="font-cairo font-bold text-xl text-stone-900 mb-2">
                    {language === 'en' ? 'Video Tours & Royal Suites' : 'جولات الفيديو والغرف والأجنحة الملكية'}
                  </h3>
                  <p className="text-stone-600 text-sm">
                    {language === 'en'
                      ? 'Watch real high-definition tours of hotel facilities, rooms, and views.'
                      : 'شاهد تصوير حقيقي وعالي الدقة لمرافق الفندق والغرف والإطلالات المباشرة على الحرم.'}
                  </p>
                </div>

                {/* Featured In-Page Player */}
                {hotel.videoUrl && (
                  <div className="bg-stone-950 rounded-2xl overflow-hidden border border-stone-800 shadow-xl">
                    <div className="relative aspect-video w-full">
                      <SafeVideoPlayer
                        url={hotel.videoUrl}
                        poster={hotel.mainImage}
                        controls={true}
                        autoPlay={false}
                        playsInline={true}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900 border-t border-stone-800">
                      <div>
                        <h4 className="font-cairo font-bold text-white text-base">
                          {language === 'en' ? `Main Overview Tour - ${hotel.nameEn || hotel.name}` : `الجولة التعريفية الرئيسية - ${hotel.name}`}
                        </h4>
                        <p className="text-xs text-stone-400 font-cairo">
                          {language === 'en' ? 'Explore luxury and exceptional location before booking' : 'استكشف الفخامة والموقع الاستثنائي قبل تأكيد الحجز'}
                        </p>
                      </div>
                      <button
                        onClick={() => openLightboxAt(0)}
                        className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#b08b38] text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 shadow-md cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{language === 'en' ? 'Watch Fullscreen' : 'مشاهدة بملء الشاشة'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Additional Room & View Tours Grid */}
                {hotel.additionalVideos && hotel.additionalVideos.length > 0 && (
                  <div>
                    <h4 className="font-cairo font-bold text-base text-stone-900 mb-4">
                      {language === 'en' ? `Additional Suite & View Tours (${hotel.additionalVideos.length})` : `جولات إضافية للأجنحة والإطلالات (${hotel.additionalVideos.length})`}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      {hotel.additionalVideos.map((vid) => {
                        const targetIdx = allMediaItems.findIndex(m => m.url === vid.videoUrl);
                        return (
                          <div
                            key={vid.id}
                            id={`video-card-${vid.id}`}
                            onClick={() => openLightboxAt(targetIdx >= 0 ? targetIdx : 0)}
                            className="group relative aspect-video bg-stone-100 rounded-2xl overflow-hidden border border-stone-200 hover:border-[#C9A24B] cursor-pointer shadow-sm hover:shadow-md transition-all"
                          >
                            <img
                              src={vid.thumbnail}
                              alt={vid.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                              <div className="w-13 h-13 rounded-full bg-[#C9A24B] text-stone-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
                              </div>
                            </div>
                            <div className="absolute bottom-3 right-3 left-3">
                              <span className="text-xs font-bold text-white line-clamp-1 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                {translateDynamic(vid.title)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. Tab: Reviews */}
            {activeTab === 'reviews' && (
              <div id="tab-pane-reviews" className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
                  <div>
                    <h3 className="font-cairo font-bold text-xl text-stone-900">
                      {language === 'en' ? 'Pilgrim Experiences & Reviews' : 'تجارب وتقييمات المعتمرين'}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-500">
                      {language === 'en'
                        ? `Genuine reviews from guests who stayed at ${hotel.nameEn || hotel.name}`
                        : `شهادات حقيقية من ضيوف الرحمن الذين أقاموا في ${hotel.name}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <MessageSquarePlus className="w-4 h-4" />
                      <span>{language === 'en' ? 'Add Hotel Review' : 'أضف تقييمك لهذا الفندق'}</span>
                    </button>

                    <div className="flex items-center gap-3 bg-stone-50 px-4 py-2 rounded-2xl border border-stone-200">
                      <span className="text-2xl font-bold font-mono text-[#B38A34]">{hotel.rating}</span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-[#C9A24B] text-[#C9A24B]" />
                          ))}
                        </div>
                        <span className="text-[11px] text-stone-500 font-medium">
                          {hotel.reviewCount} {language === 'en' ? 'verified reviews' : 'تقييم موثق'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {(hotel.reviewsList && hotel.reviewsList.length > 0 ? hotel.reviewsList : [
                    {
                      id: 'def1',
                      author: 'عبدالله بن فهد المنصور',
                      country: 'المملكة العربية السعودية',
                      rating: 5,
                      date: 'منذ أسبوع',
                      comment: 'إقامة فاخرة جداً تليق بضيوف بيت الله الحرام. سرعة الوصول إلى المسجد وبوفيه الإفطار والهدوء داخل الغرفة كلها عوامل جعلت رحلتنا لا تُنسى.'
                    },
                    {
                      id: 'def2',
                      author: 'الحاجة سميرة الشافعي',
                      country: 'جمهورية مصر العربية',
                      rating: 5,
                      date: 'منذ ٣ أسابيع',
                      comment: 'نشكر إدارة شركة برستيج على حسن الاستقبال وتسكيننا في هذا الفندق الممتاز القريب من الساحات.'
                    }
                  ]).map((rev: any) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col gap-3 transition-colors hover:border-[#C9A24B]/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {rev.avatarUrl ? (
                            <img
                              src={rev.avatarUrl}
                              alt={rev.author}
                              className="w-11 h-11 rounded-full object-cover border border-[#C9A24B]/40 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-cairo font-bold text-sm text-stone-900">{translateDynamic(rev.author)}</span>
                              {rev.country && (
                                <span className="text-xs text-stone-500">• {translateDynamic(rev.country)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {[...Array(rev.rating || 5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-[#C9A24B] text-[#C9A24B]" />
                              ))}
                            </div>
                          </div>
                        </div>
                        {rev.date && (
                          <span className="text-xs text-stone-400 shrink-0">{translateDynamic(rev.date)}</span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                        "{translateDynamic(rev.comment)}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Similar Hotels */}
        <section id="similar-hotels-section" className="border-t border-stone-200 pt-14">
          <div className="mb-8">
            <span className="text-xs font-bold text-[#C9A24B] uppercase tracking-wider block mb-1">
              {language === 'en' ? 'Similar Choices' : 'خيارات إضافية'}
            </span>
            <h3 className="text-2xl font-cairo font-bold text-stone-900">
              {language === 'en' ? `Other Premier Hotels in ${translateDynamic(hotel.city)}` : `فنادق أخرى مميزة في ${hotel.city}`}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {fallbackSimilar.map((simHotel, idx) => (
              <HotelCard
                key={simHotel.id}
                hotel={simHotel}
                onClick={() => onSelectHotel(simHotel.slug || simHotel.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Hotel Booking Modal */}
      <HotelBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        hotel={hotel}
        siteSettings={siteSettings}
      />
    </div>
  );
};
