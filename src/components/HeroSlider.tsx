import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HeroSlide, ActivePage, SiteSettings } from '../types';
import { 
  Building2, 
  ArrowLeft, 
  ArrowRight,
  PhoneCall, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Pause,
  Play,
  Eye,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsAppIcon } from './BookingIcons';
import { getFirstActiveWhatsApp, getChannelHref, buildWhatsAppLink } from '../utils/channels';
import { Lightbox, LightboxMediaItem } from './Lightbox';
import { SafeVideoPlayer } from './SafeVideoPlayer';
import { EditableText } from './EditableText';
import { useLanguage } from '../context/LanguageContext';

interface HeroSliderProps {
  slides?: HeroSlide[];
  onNavigate: (page: ActivePage, hotelIdOrSlug?: string) => void;
  siteSettings: SiteSettings;
  onScrollToNext?: () => void;
}

const SLIDE_DURATION_MS = 8000;

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides = [],
  onNavigate,
  siteSettings,
  onScrollToNext
}) => {
  const activeSlides = slides.filter((s) => s.isActive);
  const effectiveSlides = activeSlides;

  const { language, t, isRtl } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHeroMuted, setIsHeroMuted] = useState(true);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const totalSlides = effectiveSlides.length;

  // WhatsApp Link calculation
  const primaryWhatsApp = getFirstActiveWhatsApp(siteSettings?.channels);
  const targetWhatsApp = primaryWhatsApp?.value || siteSettings?.officeWhatsApp || siteSettings?.primaryPhone || '';
  const defaultWhatsAppMsg = `السلام عليكم ورحمة الله، أود الاستفسار عن عروض وتسكين الفنادق في مكة والمدينة عبر ${siteSettings?.siteTitle || 'برستيج لإدارة وتشغيل الفنادق'}.`;
  const whatsAppBookingUrl = buildWhatsAppLink(targetWhatsApp, defaultWhatsAppMsg);

  const handleAction = (action?: ActivePage | 'whatsapp' | 'hotels-makkah' | 'hotels-madinah' | string) => {
    if (!action) return;
    if (action === 'whatsapp') {
      window.open(whatsAppBookingUrl, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate(action as ActivePage);
    }
  };

  const handleNext = useCallback(() => {
    setSlideDirection('next');
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setSlideDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Convert slides into Lightbox media items (handling both video and image)
  const lightboxMediaItems: LightboxMediaItem[] = effectiveSlides.map((s) => {
    const isVid = s.mediaType === 'video' && Boolean(s.videoUrl?.trim());
    return {
      type: isVid ? ('video' as const) : ('image' as const),
      url: (isVid && s.videoUrl) ? s.videoUrl : (s.imageUrl || ''),
      title: s.title,
      thumbnail: s.videoThumbnail || s.imageUrl
    };
  });

  // Auto-Play timer loop - Zero main-thread overhead, hardware-accelerated
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    const timer = setTimeout(() => {
      handleNext();
    }, SLIDE_DURATION_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [totalSlides, isPaused, handleNext, currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    // Only trigger horizontal swipe if movement is primarily horizontal
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        // Swipe left
        isRtl ? handlePrev() : handleNext();
      } else {
        // Swipe right
        isRtl ? handleNext() : handlePrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // If no slides exist in the database, render an ultra-luxury branded hero section
  if (totalSlides === 0) {
    return (
      <section 
        id="hero-slider-section" 
        className="relative min-h-[85vh] sm:min-h-[92vh] w-full flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-gradient-to-b from-[#1C1917] via-[#0C0A09] to-[#1C1917] text-white select-none"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#C9A24B]/20 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 pt-20">
          {siteSettings?.logoUrl && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-4"
            >
              <img
                src={siteSettings.logoUrl}
                alt={siteSettings.siteTitle || 'Logo'}
                className="h-16 sm:h-24 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(201,162,75,0.45)]"
              />
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-[#C9A24B]/40 text-[#DFBE72] text-xs sm:text-sm font-bold backdrop-blur-md shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-[#C9A24B]" />
            <span>{siteSettings?.siteSubtitle || t('hero.welcomeBadge', 'الضيافة الملكية الأقرب إلى رحاب الحرمين الشريفين')}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-cairo font-black text-white tracking-tight leading-tight"
          >
            {siteSettings?.siteTitle || 'برستيج لإدارة وتشغيل الفنادق'}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-sm sm:text-lg text-stone-300 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            {language === 'en' 
              ? 'Luxury hotel management, operations, and premier hospitality for Umrah and Hajj guests in Makkah & Madinah.'
              : 'نوفر لضيوف الرحمن وشركات السياحة أفضل خيارات الإقامة في فنادق مكة المكرمة والمدينة المنورة مع تسهيلات حجز معتمدة ومباشرة.'}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-3.5 pt-4 flex-wrap"
          >
            <button
              type="button"
              onClick={() => onNavigate('hotels')}
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#DFBE72] via-[#C9A24B] to-[#B38A34] text-white font-bold text-xs sm:text-sm shadow-xl shadow-[#C9A24B]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>{t('hero.exploreHotels', 'استعرض الفنادق المتاحة')}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => handleAction('whatsapp')}
              className="px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/25 hover:border-white/50 backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              <span>{t('hero.contactWhatsApp', 'تواصل عبر الواتساب')}</span>
            </button>
          </motion.div>
        </div>

        {onScrollToNext && (
          <div 
            onClick={onScrollToNext}
            className="absolute bottom-6 sm:bottom-8 z-20 cursor-pointer flex flex-col items-center gap-1.5 text-stone-400 hover:text-[#DFBE72] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center animate-bounce">
              <ChevronDown className="w-4 h-4 text-[#DFBE72]" />
            </div>
          </div>
        )}
      </section>
    );
  }

  const currentSlide = effectiveSlides[currentIndex] || effectiveSlides[0];
  const isCurrentVideo = currentSlide.mediaType === 'video' && Boolean(currentSlide.videoUrl?.trim());

  const hasBadge = currentSlide.showBadge !== false && Boolean(currentSlide.badge?.trim());
  const hasTitle = currentSlide.showTitle !== false && Boolean(currentSlide.title?.trim());
  const hasSubtitle = currentSlide.showSubtitle !== false && Boolean(currentSlide.subtitle?.trim());
  const hasPrimaryButton = currentSlide.showPrimaryButton !== false && Boolean(currentSlide.primaryButtonText?.trim());
  const hasSecondaryButton = currentSlide.showSecondaryButton !== false && Boolean(currentSlide.secondaryButtonText?.trim());
  const hasAnyTextOrButtons = hasBadge || hasTitle || hasSubtitle || hasPrimaryButton || hasSecondaryButton;

  return (
    <section 
      id="hero-slider-section" 
      className="relative h-screen h-[100dvh] min-h-[100dvh] w-full flex items-center justify-center p-0 m-0 overflow-hidden select-none bg-stone-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Media Layers with Smooth Crossfade & Ken-Burns Zoom Effect */}
      {effectiveSlides.map((slide, idx) => {
        const isCurrent = idx === currentIndex;
        const isSlideVideo = slide.mediaType === 'video' && Boolean(slide.videoUrl?.trim());

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out overflow-hidden ${
              isCurrent ? 'opacity-100 z-0' : 'opacity-0 -z-10 pointer-events-none'
            }`}
          >
            {isSlideVideo ? (
              <div className="w-full h-full relative overflow-hidden pointer-events-none">
                <SafeVideoPlayer
                  url={slide.videoUrl}
                  poster={slide.imageUrl || slide.videoThumbnail}
                  className="w-full h-full object-cover scale-105"
                  autoPlay={isCurrent}
                  muted={!isCurrent || isHeroMuted}
                  loop={true}
                  playsInline={true}
                  controls={false}
                />
              </div>
            ) : (
              <div className="w-full h-full relative overflow-hidden">
                <img
                  src={slide.imageUrl}
                  alt={slide.title || 'صورة الهيرو'}
                  className={`w-full h-full object-cover object-center transform transition-transform duration-[10000ms] ease-out will-change-transform ${
                    isCurrent ? 'scale-110 translate-y-[-1%]' : 'scale-100 translate-y-0'
                  }`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  decoding="async"
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Atmospheric Radiant Luxury Gradient Layers (Crystal-clear & showcases imagery vibrantly) */}
      <div className={`absolute inset-0 transition-opacity duration-700 z-1 ${
        hasAnyTextOrButtons
          ? 'bg-gradient-to-t from-stone-950/70 via-black/20 to-black/35'
          : 'bg-gradient-to-t from-stone-950/40 via-transparent to-black/20'
      }`} />
      
      {/* Ambient Warm Golden Glow Halo */}
      {hasAnyTextOrButtons && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#C9A24B]/18 rounded-full blur-[150px] pointer-events-none z-1" />
      )}

      {/* Floating Controls Bar: Fullscreen Zoom, Video Sound Toggle & Play/Pause */}
      <div className={`absolute top-24 sm:top-28 ${isRtl ? 'right-4 sm:right-8' : 'left-4 sm:left-8'} z-20 flex items-center gap-2`}>
        {/* Play / Pause Toggle */}
        {totalSlides > 1 && (
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-2.5 rounded-full bg-black/50 hover:bg-[#C9A24B] text-white hover:text-black border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            title={isPaused ? (language === 'en' ? 'Resume auto-play' : 'استئناف التبديل التلقائي') : (language === 'en' ? 'Pause auto-play' : 'إيقاف مؤقت')}
            aria-label="Play/Pause"
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>
        )}

        {/* Video Audio Mute/Unmute */}
        {Boolean(currentSlide?.mediaType === 'video' && currentSlide?.videoUrl?.trim()) && (
          <button
            type="button"
            onClick={() => {
              const nextMuted = !isHeroMuted;
              setIsHeroMuted(nextMuted);
              try {
                const activeVideo = document.querySelector('#hero-slider-section video') as HTMLVideoElement | null;
                if (activeVideo) {
                  activeVideo.muted = nextMuted;
                  if (!nextMuted) {
                    activeVideo.volume = 1.0;
                    if (activeVideo.paused) {
                      activeVideo.play().catch(() => {});
                    }
                  }
                }
              } catch {}
            }}
            className="p-2.5 rounded-full bg-black/50 hover:bg-[#C9A24B] text-white hover:text-black border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            title={isHeroMuted ? (language === 'en' ? 'Unmute video' : 'تشغيل صوت الفيديو') : (language === 'en' ? 'Mute video' : 'كتم صوت الفيديو')}
            aria-label="Sound"
          >
            {isHeroMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}

        {/* Zoom Lightbox Trigger */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/50 hover:bg-[#C9A24B] text-white hover:text-black border border-white/20 hover:border-[#C9A24B] text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          title={language === 'en' ? 'View slide fullscreen' : 'معاينة الشريحة بملء الشاشة'}
          aria-label="Zoom"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">{isCurrentVideo ? t('hero.zoomVideo', 'تكبير الفيديو') : t('hero.zoomMedia', 'تكبير الصورة')}</span>
        </button>
      </div>

      {/* Slide Content Container (Dynamic Animated Typography) */}
      <AnimatePresence mode="wait">
        {hasAnyTextOrButtons ? (
          <motion.div 
            key={`slide-content-${currentSlide.id}-${currentIndex}`}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center pt-10 sm:pt-0"
          >
            {/* Animated Frosted Gold Badge */}
            {hasBadge && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.88, y: -12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-black/50 border border-[#C9A24B]/70 text-[#DFBE72] text-xs sm:text-sm font-bold mb-6 backdrop-blur-md shadow-2xl ring-1 ring-[#C9A24B]/30"
              >
                <Sparkles className="w-4 h-4 text-[#DFBE72] animate-pulse" />
                <span>
                  <EditableText
                    contentKey={`hero.slide.${currentSlide.id}.badge`}
                    fallback={currentSlide.badge || ''}
                    inline={true}
                  />
                </span>
              </motion.div>
            )}

            {/* Main Headline */}
            {hasTitle && (
              <motion.h1 
                id="hero-slider-title"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="font-cairo font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[1.2] sm:leading-[1.15] mb-5 max-w-4xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
              >
                <EditableText
                  contentKey={`hero.slide.${currentSlide.id}.title`}
                  fallback={currentSlide.title || ''}
                  as="span"
                />
              </motion.h1>
            )}

            {/* Short Narrative Subtitle */}
            {hasSubtitle && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="text-base sm:text-lg md:text-xl text-stone-200 font-normal leading-relaxed max-w-2xl mb-8 drop-shadow-md"
              >
                <EditableText
                  contentKey={`hero.slide.${currentSlide.id}.subtitle`}
                  fallback={currentSlide.subtitle || ''}
                  as="span"
                  multiline={true}
                />
              </motion.div>
            )}

            {/* Action Buttons */}
            {(hasPrimaryButton || hasSecondaryButton) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto z-20"
              >
                {hasPrimaryButton && (
                  <motion.button
                    id="hero-slider-primary-cta"
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 35px -10px rgba(201, 162, 75, 0.55)" }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleAction(currentSlide.primaryButtonAction || 'hotels')}
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#DFBE72] via-[#C9A24B] to-[#B38A34] text-white font-bold text-base shadow-xl shadow-[#C9A24B]/35 transition-all duration-300 flex items-center justify-center gap-3 group cursor-pointer"
                  >
                    <span>
                      <EditableText
                        contentKey={`hero.slide.${currentSlide.id}.primaryButtonText`}
                        fallback={currentSlide.primaryButtonText || (language === 'en' ? 'Explore Available Hotels' : 'استعرض الفنادق المتاحة')}
                        inline={true}
                      />
                    </span>
                    <ArrowLeft className={`w-5 h-5 ${isRtl ? 'group-hover:-translate-x-1.5' : 'group-hover:translate-x-1.5 rotate-180'} transition-transform text-white`} />
                  </motion.button>
                )}

                {hasSecondaryButton && (
                  <motion.button
                    id="hero-slider-secondary-cta"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleAction(currentSlide.secondaryButtonAction || 'contact')}
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/95 hover:bg-white text-stone-900 border border-stone-300 hover:border-[#C9A24B] font-bold text-base backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    {currentSlide.secondaryButtonAction === 'whatsapp' ? (
                      <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                    ) : (
                      <PhoneCall className="w-4 h-4 text-[#B38A34]" />
                    )}
                    <span>
                      <EditableText
                        contentKey={`hero.slide.${currentSlide.id}.secondaryButtonText`}
                        fallback={currentSlide.secondaryButtonText || (language === 'en' ? 'Contact Booking Consultant' : 'تواصل مع مستشار الحجز')}
                        inline={true}
                      />
                    </span>
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Bottom Scroll Down Hint */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              onClick={onScrollToNext}
              className="mt-8 sm:mt-12 cursor-pointer flex flex-col items-center gap-1.5 text-stone-300 hover:text-[#DFBE72] transition-colors group select-none"
            >
              <span className="text-xs font-semibold tracking-wide">{t('hero.discoverMore', 'اكتشف المزيد')}</span>
              <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 shadow-sm flex items-center justify-center group-hover:border-[#C9A24B] transition-all animate-bounce">
                <ChevronDown className="w-4 h-4 text-[#DFBE72]" />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* Minimal Bottom Scroll Down Hint when no text is displayed */
          <motion.div 
            key="minimal-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onScrollToNext}
            className="absolute bottom-16 sm:bottom-20 z-20 cursor-pointer flex flex-col items-center gap-1.5 text-stone-200 hover:text-[#DFBE72] transition-colors group select-none"
          >
            <span className="text-xs font-semibold tracking-wide bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">{t('hero.exploreShort', 'استكشف الفنادق')}</span>
            <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 shadow-sm flex items-center justify-center group-hover:border-[#C9A24B] transition-all animate-bounce">
              <ChevronDown className="w-4 h-4 text-[#DFBE72]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Controls (If multiple slides) */}
      {totalSlides > 1 && (
        <>
          {/* Previous Slide Arrow */}
          <button
            id="hero-slider-prev-btn"
            onClick={handlePrev}
            className={`absolute ${isRtl ? 'right-3 sm:right-6' : 'left-3 sm:left-6'} top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 rounded-full bg-black/45 hover:bg-[#C9A24B] text-white hover:text-black backdrop-blur-md border border-white/25 hover:border-[#C9A24B] shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 hidden sm:flex items-center justify-center cursor-pointer`}
            aria-label={t('hero.prev', 'السابق')}
          >
            {isRtl ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
          </button>

          {/* Next Slide Arrow */}
          <button
            id="hero-slider-next-btn"
            onClick={handleNext}
            className={`absolute ${isRtl ? 'left-3 sm:left-6' : 'right-3 sm:right-6'} top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 rounded-full bg-black/45 hover:bg-[#C9A24B] text-white hover:text-black backdrop-blur-md border border-white/25 hover:border-[#C9A24B] shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 hidden sm:flex items-center justify-center cursor-pointer`}
            aria-label={t('hero.next', 'التالي')}
          >
            {isRtl ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
          </button>

          {/* Bottom Pagination Indicators Strip with Countdown Progress Bar */}
          <div className="absolute bottom-6 sm:bottom-8 inset-x-0 z-20 flex items-center justify-center gap-2.5">
            {effectiveSlides.map((s, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={s.id}
                  id={`hero-slide-dot-${idx}`}
                  onClick={() => {
                    setSlideDirection(idx > currentIndex ? 'next' : 'prev');
                    setCurrentIndex(idx);
                  }}
                  className={`h-2.5 rounded-full transition-all duration-300 relative overflow-hidden cursor-pointer ${
                    isActive
                      ? 'w-12 bg-white/30 shadow-lg'
                      : 'w-2.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`شريحة ${idx + 1}`}
                >
                  {isActive && (
                    <div 
                      key={`progress-${currentIndex}`}
                      className="absolute inset-y-0 left-0 bg-[#C9A24B] rounded-full shadow-xs"
                      style={{
                        animation: `heroProgressAnim ${SLIDE_DURATION_MS}ms linear forwards`,
                        animationPlayState: isPaused ? 'paused' : 'running'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Fullscreen Lightbox for Welcoming Background Slides */}
      {lightboxOpen && (
        <Lightbox
          mediaItems={lightboxMediaItems}
          initialIndex={currentIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </section>
  );
};
