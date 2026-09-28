import React, { useState, useEffect, useRef } from 'react';
import { HeroSlide, ActivePage, SiteSettings } from '../types';
import { 
  Sparkles, 
  ArrowLeft, 
  PhoneCall, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Pause,
  Play,
  Eye,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsAppIcon } from './BookingIcons';
import { getFirstActiveWhatsApp, getChannelHref } from '../utils/channels';
import { Lightbox, LightboxMediaItem } from './Lightbox';
import { SafeVideoPlayer } from './SafeVideoPlayer';
import { EditableText } from './EditableText';
import { useLanguage } from '../context/LanguageContext';

interface HeroSliderProps {
  slides?: HeroSlide[];
  onNavigate: (page: ActivePage) => void;
  siteSettings: SiteSettings;
  onScrollToNext?: () => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides = [],
  onNavigate,
  siteSettings,
  onScrollToNext
}) => {
  // Only use active slides, fallback to default if empty
  const activeSlides = slides.filter((s) => s.isActive);
  const effectiveSlides = activeSlides.length > 0 ? activeSlides : [
    {
      id: 'default_slide_1',
      mediaType: 'image' as const,
      imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1920&q=85',
      badge: 'الضيافة الملكية الأقرب إلى رحاب الحرمين الشريفين',
      title: 'تسكين في أرقى فنادق مكة المكرمة والمدينة المنورة',
      subtitle: 'نوفر لضيوف الرحمن وشركات السياحة أفضل خيارات الإقامة في فنادق الصف الأول المقابلة للحرم المكي والمسجد النبوي، مع تسهيلات حجز معتمدة ومباشرة.',
      showBadge: true,
      showTitle: true,
      showSubtitle: true,
      showPrimaryButton: true,
      primaryButtonText: 'استعرض الفنادق المتاحة',
      primaryButtonAction: 'hotels' as const,
      showSecondaryButton: true,
      secondaryButtonText: 'تواصل مع مستشار الحجز',
      secondaryButtonAction: 'contact' as const,
      order: 0,
      isActive: true
    }
  ];

  const { language, t, isRtl } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHeroMuted, setIsHeroMuted] = useState(true);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = effectiveSlides.length;

  // Convert slides into Lightbox media items (handling both video and image)
  const lightboxMediaItems: LightboxMediaItem[] = effectiveSlides.map((s) => {
    const isVid = s.mediaType === 'video' || Boolean(s.videoUrl);
    return {
      type: isVid ? ('video' as const) : ('image' as const),
      url: (isVid && s.videoUrl) ? s.videoUrl : (s.imageUrl || s.videoUrl || ''),
      title: s.title,
      thumbnail: s.videoThumbnail || s.imageUrl
    };
  });

  // Auto-play interval
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setSlideDirection('next');
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 7500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalSlides, isPaused, currentIndex]);

  const handleNext = () => {
    setSlideDirection('next');
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setSlideDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const currentSlide = effectiveSlides[currentIndex] || effectiveSlides[0];
  const isCurrentVideo = currentSlide.mediaType === 'video' || Boolean(currentSlide.videoUrl);

  const hasBadge = currentSlide.showBadge !== false && Boolean(currentSlide.badge?.trim());
  const hasTitle = currentSlide.showTitle !== false && Boolean(currentSlide.title?.trim());
  const hasSubtitle = currentSlide.showSubtitle !== false && Boolean(currentSlide.subtitle?.trim());
  const hasPrimaryButton = currentSlide.showPrimaryButton !== false && Boolean(currentSlide.primaryButtonText?.trim());
  const hasSecondaryButton = currentSlide.showSecondaryButton !== false && Boolean(currentSlide.secondaryButtonText?.trim());
  const hasAnyTextOrButtons = hasBadge || hasTitle || hasSubtitle || hasPrimaryButton || hasSecondaryButton;

  // WhatsApp Link calculation
  const primaryWhatsApp = getFirstActiveWhatsApp(siteSettings?.channels);
  const defaultWhatsAppMsg = `السلام عليكم ورحمة الله، أود الاستفسار عن عروض وتسكين الفنادق في مكة والمدينة عبر ${siteSettings?.siteTitle || 'برستيج لإدارة وتشغيل الفنادق'}.`;
  const whatsAppBookingUrl = primaryWhatsApp
    ? getChannelHref(primaryWhatsApp, defaultWhatsAppMsg)
    : `https://wa.me/966501234567?text=${encodeURIComponent(defaultWhatsAppMsg)}`;

  const handleAction = (action?: ActivePage | 'whatsapp') => {
    if (!action) return;
    if (action === 'whatsapp') {
      window.open(whatsAppBookingUrl, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate(action);
    }
  };

  return (
    <section 
      id="hero-slider-section" 
      className="relative h-screen h-[100dvh] min-h-[100dvh] w-full flex items-center justify-center p-0 m-0 overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Media Layer (Images & Videos) */}
      {effectiveSlides.map((slide, idx) => {
        const isCurrent = idx === currentIndex;
        const isSlideVideo = slide.mediaType === 'video' || Boolean(slide.videoUrl);

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
              <img
                src={slide.imageUrl}
                alt={slide.title || 'صورة الهيرو'}
                className={`w-full h-full object-cover object-center transform transition-transform duration-10000 ease-out ${
                  isCurrent ? 'scale-110' : 'scale-100'
                }`}
              />
            )}
          </div>
        );
      })}

      {/* Atmospheric Gradient Layer (Adjusted if no text overlay is shown) */}
      <div className={`absolute inset-0 transition-opacity duration-700 z-1 ${
        hasAnyTextOrButtons
          ? 'bg-gradient-to-t from-[#F8F7F4] via-black/55 to-black/75'
          : 'bg-gradient-to-t from-[#F8F7F4]/40 via-black/20 to-black/40'
      }`} />
      
      {hasAnyTextOrButtons && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9A24B]/20 rounded-full blur-[130px] pointer-events-none z-1" />
      )}

      {/* Top Floating Controls Bar: Fullscreen Zoom & Video Sound Toggle */}
      <div className={`absolute top-24 sm:top-28 ${isRtl ? 'right-4 sm:right-8' : 'left-4 sm:left-8'} z-20 flex items-center gap-2`}>
        {isCurrentVideo && (
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
            className="p-2.5 rounded-full bg-black/45 hover:bg-[#C9A24B] text-white hover:text-black border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            title={isHeroMuted ? (language === 'en' ? 'Unmute video' : 'تشغيل صوت الفيديو') : (language === 'en' ? 'Mute video' : 'كتم صوت الفيديو')}
          >
            {isHeroMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/45 hover:bg-[#C9A24B] text-white hover:text-black border border-white/20 hover:border-[#C9A24B] text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          title={language === 'en' ? 'View slide fullscreen' : 'معاينة الشريحة بملء الشاشة'}
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">{isCurrentVideo ? t('hero.zoomVideo', 'تكبير الفيديو') : t('hero.zoomMedia', 'تكبير الصورة')}</span>
        </button>
      </div>

      {/* Slide Content Container (Only if text or buttons are enabled) */}
      <AnimatePresence mode="wait">
        {hasAnyTextOrButtons ? (
          <motion.div 
            key={`slide-content-${currentSlide.id}-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center pt-10 sm:pt-0"
          >
            {/* Animated Badge */}
            {hasBadge && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/45 border border-[#C9A24B]/60 text-[#DFBE72] text-xs sm:text-sm font-semibold mb-6 backdrop-blur-md shadow-xl"
              >
                <Sparkles className="w-4 h-4 text-[#DFBE72]" />
                <span>
                  <EditableText
                    contentKey={`hero.slide.${currentSlide.id}.badge`}
                    fallback={currentSlide.badge || ''}
                    inline={true}
                  />
                </span>
              </motion.div>
            )}

            {/* Main Animated Headline */}
            {hasTitle && (
              <motion.h1 
                id="hero-slider-title"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="font-cairo font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[1.2] sm:leading-[1.15] mb-5 max-w-4xl drop-shadow-lg"
              >
                <EditableText
                  contentKey={`hero.slide.${currentSlide.id}.title`}
                  fallback={currentSlide.title || ''}
                  as="span"
                />
              </motion.h1>
            )}

            {/* Short Animated Narrative */}
            {hasSubtitle && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-base sm:text-lg md:text-xl text-stone-200 font-normal leading-relaxed max-w-2xl mb-8 drop-shadow"
              >
                <EditableText
                  contentKey={`hero.slide.${currentSlide.id}.subtitle`}
                  fallback={currentSlide.subtitle || ''}
                  as="span"
                  multiline={true}
                />
              </motion.div>
            )}

            {/* Action Buttons (Rendered only if enabled) */}
            {(hasPrimaryButton || hasSecondaryButton) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto z-20"
              >
                {hasPrimaryButton && (
                  <motion.button
                    id="hero-slider-primary-cta"
                    whileHover={{ scale: 1.04, boxShadow: "0 20px 30px -10px rgba(201, 162, 75, 0.45)" }}
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
                    whileHover={{ scale: 1.04 }}
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
              transition={{ delay: 0.6, duration: 0.6 }}
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
            className={`absolute ${isRtl ? 'right-3 sm:right-6' : 'left-3 sm:left-6'} top-1/2 -translate-y-1/2 z-20 p-3 sm:p-3.5 rounded-full bg-black/40 hover:bg-[#C9A24B] text-white backdrop-blur-md border border-white/20 hover:border-[#C9A24B] shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 hidden sm:flex items-center justify-center cursor-pointer`}
            aria-label={t('hero.prev', 'السابق')}
          >
            {isRtl ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
          </button>

          {/* Next Slide Arrow */}
          <button
            id="hero-slider-next-btn"
            onClick={handleNext}
            className={`absolute ${isRtl ? 'left-3 sm:left-6' : 'right-3 sm:right-6'} top-1/2 -translate-y-1/2 z-20 p-3 sm:p-3.5 rounded-full bg-black/40 hover:bg-[#C9A24B] text-white backdrop-blur-md border border-white/20 hover:border-[#C9A24B] shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 hidden sm:flex items-center justify-center cursor-pointer`}
            aria-label={t('hero.next', 'التالي')}
          >
            {isRtl ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
          </button>

          {/* Bottom Pagination Indicators Strip */}
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
                  className={`h-2.5 rounded-full transition-all duration-500 relative overflow-hidden cursor-pointer ${
                    isActive
                      ? 'w-10 bg-[#C9A24B] shadow-lg shadow-[#C9A24B]/50'
                      : 'w-2.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`شريحة ${idx + 1}`}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Fullscreen Lightbox for Welcoming Background Slides (Handles both video & image) */}
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
