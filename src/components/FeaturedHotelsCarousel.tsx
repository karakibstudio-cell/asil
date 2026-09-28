import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Hotel, HotelCategory } from '../types';
import { 
  Sparkles, 
  MapPin, 
  Footprints, 
  Star, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft, 
  Building, 
  Tag 
} from 'lucide-react';
import { EditableText } from './EditableText';
import { useLanguage } from '../context/LanguageContext';

interface FeaturedHotelsCarouselProps {
  hotels: Hotel[];
  onSelectHotel: (hotelId: string) => void;
}

const CATEGORY_COLORS: Record<HotelCategory, { bg: string; text: string; border: string }> = {
  'فنادق سنوية': { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  'فنادق العمرة': { bg: 'bg-sky-950/70', text: 'text-sky-300', border: 'border-sky-500/40' },
  'فنادق رمضان': { bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-500/40' },
  'عادي': { bg: 'bg-stone-900/70', text: 'text-stone-300', border: 'border-stone-500/40' },
};

export const FeaturedHotelsCarousel: React.FC<FeaturedHotelsCarouselProps> = ({
  hotels,
  onSelectHotel
}) => {
  const { language, t, translateDynamic, isRtl } = useLanguage();
  // Only show hotels marked as featured; fallback to all hotels if none are marked
  const featuredHotels = useMemo(() => {
    const featured = hotels.filter((h) => h.featured);
    return featured.length > 0 ? featured : hotels.slice(0, 5);
  }, [hotels]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentIndex >= featuredHotels.length) {
      setCurrentIndex(0);
    }
  }, [featuredHotels.length, currentIndex]);

  // Auto-slide every 5 seconds (unless paused by hover or manual interaction)
  useEffect(() => {
    if (featuredHotels.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredHotels.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredHotels.length, isPaused]);

  const triggerManualPause = () => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 8000);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerManualPause();
    setCurrentIndex((prev) => (prev + 1) % featuredHotels.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerManualPause();
    setCurrentIndex((prev) => (prev - 1 + featuredHotels.length) % featuredHotels.length);
  };

  const handleSelectDot = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerManualPause();
    setCurrentIndex(idx);
  };

  if (featuredHotels.length === 0) {
    return null;
  }

  const currentHotel = featuredHotels[currentIndex];

  return (
    <section 
      id="featured-hotels-carousel-section"
      className="py-10 sm:py-14 bg-gradient-to-b from-[#F8F7F4] via-white to-[#F8F7F4] relative"
    >
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold border border-[#C9A24B]/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#B38A34]" />
              <span>
                <EditableText
                  contentKey="home.featuredCarousel.badge"
                  fallback="فنادق مختارة ومميزة"
                  inline={true}
                />
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-cairo font-black text-stone-900">
              <EditableText
                contentKey="home.featuredCarousel.title"
                fallback="أبرز الفنادق الموصى بها في الحرمين"
                as="span"
              />
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 font-medium">
            <span>
              {language === 'en'
                ? `Hotel ${currentIndex + 1} of ${featuredHotels.length}`
                : `فندق ${currentIndex + 1} من ${featuredHotels.length}`}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A24B]" />
            <span>{language === 'en' ? 'Auto Play' : 'تبديل تلقائي'}</span>
          </div>
        </div>

        {/* Carousel Outer Frame */}
        <div 
          className="relative group select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Main Full-Width Banner with Direct Click navigation */}
          <div
            id={`featured-carousel-card-${currentHotel.id}`}
            onClick={() => onSelectHotel(currentHotel.id)}
            className="relative h-[360px] sm:h-[440px] md:h-[480px] lg:h-[520px] w-full rounded-3xl overflow-hidden border border-stone-300 shadow-2xl cursor-pointer bg-stone-900 transition-all duration-300 group-hover:border-[#C9A24B]"
            role="button"
            tabIndex={0}
            aria-label={language === 'en' ? `View details of ${currentHotel.nameEn || currentHotel.name}` : `عرض تفاصيل فندق ${currentHotel.name}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectHotel(currentHotel.id);
              }
            }}
          >
            {/* Background Images with Crossfade */}
            {featuredHotels.map((hotel, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div
                  key={hotel.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={hotel.mainImage}
                    alt={hotel.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-1000 ease-out"
                  />
                  {/* Subtle Dark Gradient Overlay for optimal text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
                </div>
              );
            })}

            {/* Top Badges (Category & Rating) */}
            <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-6 z-30 flex items-center justify-between gap-3 pointer-events-none">
              {/* Category tags */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(currentHotel.categories || ['عادي']).map((cat) => {
                  const style = CATEGORY_COLORS[cat] || CATEGORY_COLORS['عادي'];
                  return (
                    <span
                      key={cat}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${style.bg} ${style.text} ${style.border}`}
                    >
                      <Tag className="w-3 h-3" />
                      <span>{translateDynamic(cat)}</span>
                    </span>
                  );
                })}
              </div>

              {/* Stars & Rating */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs text-white">
                <div className="flex items-center gap-0.5">
                  {[...Array(currentHotel.stars)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#DFBE72] text-[#DFBE72]" />
                  ))}
                </div>
                <span className="font-bold text-[#DFBE72] font-mono">{currentHotel.rating} ★</span>
                <span className="text-stone-300">
                  {language === 'en' ? `(${currentHotel.reviewCount} reviews)` : `(${currentHotel.reviewCount} تقييم)`}
                </span>
              </div>
            </div>

            {/* Bottom Content Overlay (Hotel Name, City, District, Distance, CTA) */}
            <div className="absolute inset-x-0 bottom-0 z-30 p-5 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pointer-events-auto">
              {/* Hotel Info Block */}
              <div className="space-y-3 max-w-2xl">
                {/* City, District & Distance pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-stone-200">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md font-medium border border-white/20">
                    <MapPin className="w-3.5 h-3.5 text-[#DFBE72]" />
                    <span>{translateDynamic(currentHotel.city)} - {language === 'en' ? `${translateDynamic(currentHotel.district)} District` : `حي ${currentHotel.district}`}</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md font-medium border border-white/20">
                    <Footprints className="w-3.5 h-3.5 text-[#DFBE72]" />
                    <span>{translateDynamic(currentHotel.distanceText)}</span>
                  </span>

                  {currentHotel.location?.viewType && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md font-medium border border-white/20">
                      <Building className="w-3.5 h-3.5 text-[#DFBE72]" />
                      <span>{translateDynamic(currentHotel.location.viewType)}</span>
                    </span>
                  )}
                </div>

                {/* Hotel Title */}
                <h3 className="font-cairo font-black text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight drop-shadow-lg group-hover:text-[#F3E5AB] transition-colors">
                  {language === 'en' && currentHotel.nameEn ? currentHotel.nameEn : currentHotel.name}
                </h3>

                {/* Brief Overview */}
                <p className="text-xs sm:text-sm text-stone-300 line-clamp-2 leading-relaxed max-w-xl">
                  {translateDynamic(currentHotel.overview)}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end shrink-0 pt-2 md:pt-0">
                <div className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#DFBE72] via-[#C9A24B] to-[#B38A34] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-xl shadow-black/40 flex items-center gap-2 group-hover:scale-105 active:scale-95 transition-all">
                  <span>{t('carousel.viewDetails', 'استعراض الفندق والتفاصيل')}</span>
                  <ArrowLeft className={`w-4 h-4 text-white ${isRtl ? 'group-hover:-translate-x-1' : 'rotate-180 group-hover:translate-x-1'} transition-transform`} />
                </div>
              </div>
            </div>

            {/* Prev / Next Arrows positioned inside the banner */}
            <div className={`absolute inset-y-0 ${isRtl ? 'right-3 sm:right-5' : 'left-3 sm:left-5'} z-30 flex items-center pointer-events-auto`}>
              <button
                type="button"
                id="featured-carousel-prev-btn"
                onClick={handlePrev}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-[#C9A24B] hover:text-black text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95"
                aria-label={t('hero.prev', 'السابق')}
              >
                {isRtl ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
              </button>
            </div>

            <div className={`absolute inset-y-0 ${isRtl ? 'left-3 sm:left-5' : 'right-3 sm:right-5'} z-30 flex items-center pointer-events-auto`}>
              <button
                type="button"
                id="featured-carousel-next-btn"
                onClick={handleNext}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-[#C9A24B] hover:text-black text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95"
                aria-label={t('hero.next', 'التالي')}
              >
                {isRtl ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Dots Navigation Underneath the Banner */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {featuredHotels.map((hotel, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={hotel.id}
                  type="button"
                  id={`featured-carousel-dot-${idx}`}
                  onClick={(e) => handleSelectDot(idx, e)}
                  aria-label={`الانتقال للفندق ${idx + 1}: ${hotel.name}`}
                  className={`transition-all duration-300 rounded-full ${
                    isActive
                      ? 'w-8 sm:w-10 h-2.5 bg-[#C9A24B] shadow-md shadow-[#C9A24B]/40'
                      : 'w-2.5 h-2.5 bg-stone-300 hover:bg-stone-500'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
