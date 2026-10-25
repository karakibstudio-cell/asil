import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SiteSettings, ActivePage } from '../types';
import { parseVideoUrl } from '../utils/video';
import { 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Sparkles,
  Play
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getFirstActiveWhatsApp, buildWhatsAppLink } from '../utils/channels';

interface IntroVideoSectionProps {
  siteSettings?: SiteSettings;
  onNavigate: (page: ActivePage) => void;
  onSkip?: () => void;
}

export const IntroVideoSection: React.FC<IntroVideoSectionProps> = ({
  siteSettings,
  onNavigate,
  onSkip
}) => {
  const { language, isRtl } = useLanguage();
  const intro = siteSettings?.introVideo;

  const rawVideoUrl = intro?.videoUrl;
  const videoUrlString = typeof rawVideoUrl === 'string'
    ? rawVideoUrl
    : (rawVideoUrl && typeof rawVideoUrl === 'object'
        ? ((rawVideoUrl as any).url || (rawVideoUrl as any).src || (rawVideoUrl as any).videoUrl || '')
        : '');

  const rawPosterUrl = intro?.posterUrl;
  const posterUrlString = typeof rawPosterUrl === 'string'
    ? rawPosterUrl
    : (rawPosterUrl && typeof rawPosterUrl === 'object'
        ? ((rawPosterUrl as any).url || (rawPosterUrl as any).src || '')
        : undefined);

  // Crawler Detection: Never block crawlers, search engines, or performance audits
  const isCrawler = typeof navigator !== 'undefined' && (
    Boolean(navigator.webdriver) ||
    /bot|crawler|spider|crawling|googlebot|bingbot|lighthouse|prerender|headlesschrome|pagespeed/i.test(navigator.userAgent || '')
  );

  const isEnabled = (siteSettings?.displaySettings?.introEnabled !== false) && (intro?.enabled !== false);

  // Default to muted for seamless browser autoplay compliance (Chrome, Safari, iOS, Android)
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasAutoScrolledRef = useRef(false);

  const videoInfo = parseVideoUrl(videoUrlString, true);

  // 1. Initial Mount: Set manual scroll restoration and reset to top (0, 0) for instant intro replay on reload
  useEffect(() => {
    if (typeof window !== 'undefined' && isEnabled && videoUrlString.trim() && !isCrawler) {
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
      } catch {}
    }
  }, [isEnabled, videoUrlString, isCrawler]);

  // 2. Smoothly scroll down to Welcoming Slides (Hero Slider) upon completion or skip
  const handleScrollToHero = useCallback((isCompletedAuto: boolean = false) => {
    if (hasAutoScrolledRef.current) return;
    hasAutoScrolledRef.current = true;

    const heroEl = document.getElementById('hero-slider-section');
    if (heroEl) {
      const rect = heroEl.getBoundingClientRect();
      const targetY = window.pageYOffset + rect.top;
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
      });
    }

    if (onSkip) {
      onSkip();
    }
  }, [onSkip]);

  // 3. Robust, guaranteed Autoplay handler
  const attemptPlay = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;

    try {
      vid.muted = true;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        setIsAutoplayBlocked(false);
      }
    } catch {
      // Browser blocked autoplay: keep muted and wait for user gesture
      try {
        vid.muted = true;
        setIsMuted(true);
        const p2 = vid.play();
        if (p2 !== undefined) {
          await p2;
          setIsPlaying(true);
          setIsAutoplayBlocked(false);
        }
      } catch (err) {
        console.warn('Autoplay pending user gesture:', err);
        setIsAutoplayBlocked(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!isEnabled || !videoUrlString.trim() || isCrawler) return;

    attemptPlay();

    // Fallback: If browser low-power mode paused video, first tap anywhere plays it
    const handleFirstGesture = () => {
      const vid = videoRef.current;
      if (vid && vid.paused && !hasAutoScrolledRef.current) {
        setIsAutoplayBlocked(false);
        attemptPlay();
      }
    };

    window.addEventListener('touchstart', handleFirstGesture, { once: true, passive: true });
    window.addEventListener('click', handleFirstGesture, { once: true, passive: true });

    return () => {
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
    };
  }, [attemptPlay, isEnabled, videoUrlString, isCrawler]);

  // 4. Progress and completion detection
  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || !vid.duration || isNaN(vid.duration)) return;

    const current = vid.currentTime;
    const dur = vid.duration;
    const pct = Math.min((current / dur) * 100, 100);
    setProgress(pct);

    // If video reaches the end (within 0.35s of end or native ended flag)
    if (dur > 2 && (current >= dur - 0.35 || vid.ended)) {
      handleScrollToHero(true);
    }
  };

  // If disabled, empty, or crawler: do not render
  if (!isEnabled || !videoUrlString.trim() || isCrawler) {
    return null;
  }

  const handleToggleSound = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    const vid = videoRef.current;
    if (vid) {
      vid.muted = nextMuted;
      vid.defaultMuted = nextMuted;
      vid.volume = nextMuted ? 0 : 1.0;
      if (!nextMuted && vid.paused) {
        vid.play().catch(() => {});
      }
    }
  };

  const handleAction = () => {
    if (intro?.actionButtonPage === 'whatsapp') {
      const siteWhatsApp = getFirstActiveWhatsApp(siteSettings?.channels);
      const targetWhatsApp = siteWhatsApp?.value || siteSettings?.officeWhatsApp || siteSettings?.primaryPhone || '';
      const url = buildWhatsAppLink(targetWhatsApp, 'السلام عليكم ورحمة الله، أود الاستفسار عن خدمات وحجوزات برستيج لإدارة وتشغيل الفنادق.');
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else if (intro?.actionButtonPage) {
      onNavigate(intro.actionButtonPage);
    } else {
      handleScrollToHero(false);
    }
  };

  return (
    <section 
      id="intro-video-section"
      className="relative w-full h-screen h-[100dvh] min-h-[550px] bg-black text-white overflow-hidden flex items-center justify-center select-none"
      style={{ contain: 'layout style', minHeight: '100dvh' }}
    >
      {/* Background Video Player */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        {videoInfo.isEmbed && videoInfo.embedUrl ? (
          <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center pointer-events-none">
            <iframe
              src={videoInfo.embedUrl}
              title="فيديو الإنترو الترويجي"
              className="w-[160%] h-[160%] min-w-full min-h-full object-cover pointer-events-none border-0 absolute"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              tabIndex={-1}
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoInfo.directUrl || videoUrlString}
            poster={posterUrlString || '/images/slides/slide_0.webp'}
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            // @ts-ignore
            webkit-playsinline="true"
            x5-playsinline="true"
            muted={isMuted}
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onLoadStart={attemptPlay}
            onLoadedMetadata={attemptPlay}
            onCanPlay={attemptPlay}
            onLoadedData={attemptPlay}
            onError={() => {
              console.warn('Intro video playback error, skipping to hero section.');
              handleScrollToHero(false);
            }}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => handleScrollToHero(true)}
            onPlay={() => {
              setIsPlaying(true);
              setIsAutoplayBlocked(false);
            }}
            onPause={() => setIsPlaying(false)}
          />
        )}
        
        {/* Subtle Ambient Overlay for optimal typography legibility */}
        {intro?.overlayStyle !== 'none' && (
          <div 
            className={`absolute inset-0 pointer-events-none ${
              intro?.overlayStyle === 'cinematic'
                ? 'bg-gradient-to-t from-black/60 via-black/20 to-black/35'
                : 'bg-black/30'
            }`} 
          />
        )}
      </div>

      {/* Floating Center Play prompt ONLY if browser blocked autoplay */}
      {isAutoplayBlocked && !isPlaying && (
        <button
          onClick={() => {
            setIsAutoplayBlocked(false);
            attemptPlay();
          }}
          className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 hover:bg-[#C9A24B] text-[#DFBE72] hover:text-black border-2 border-[#C9A24B] flex items-center justify-center transition-all duration-300 shadow-2xl z-20 cursor-pointer"
          aria-label="تشغيل الفيديو"
        >
          <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-[-2px]" />
        </button>
      )}

      {/* Audio Control (Top Left/Right) */}
      {intro?.showSoundButton !== false && !videoInfo.isEmbed && (
        <div className={`absolute top-24 ${isRtl ? 'left-6' : 'right-6'} z-30 flex items-center gap-2`}>
          <button
            onClick={handleToggleSound}
            type="button"
            className="px-3.5 py-2 rounded-full bg-black/60 hover:bg-[#C9A24B] text-white hover:text-black border border-white/20 hover:border-[#C9A24B] backdrop-blur-md transition-all flex items-center gap-2 shadow-xl cursor-pointer text-xs font-bold font-cairo"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? (language === 'en' ? 'Unmute' : 'تشغيل الصوت') : (language === 'en' ? 'Mute' : 'كتم الصوت')}</span>
          </button>
        </div>
      )}

      {/* Content Overlay (Title, Subtitle, CTA) */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-8 text-center flex flex-col items-center justify-center space-y-6 pt-16 pointer-events-auto">
        {intro?.showBadge !== false && (intro?.badgeText || (intro as any)?.badge) && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A24B]/20 border border-[#C9A24B]/50 text-[#DFBE72] text-xs sm:text-sm font-bold backdrop-blur-md shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
            <span>{intro?.badgeText || (intro as any)?.badge}</span>
          </div>
        )}

        {intro?.showTitle !== false && intro?.title && (
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-cairo font-black text-white tracking-tight leading-tight filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            {intro.title}
          </h1>
        )}

        {intro?.showSubtitle !== false && intro?.subtitle && (
          <p className="text-sm sm:text-lg text-stone-100 max-w-2xl font-cairo font-medium leading-relaxed filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {intro.subtitle}
          </p>
        )}

        {intro?.showActionButton !== false && intro?.actionButtonText && (
          <button
            onClick={handleAction}
            type="button"
            className="px-7 py-3 rounded-full bg-[#C9A24B] hover:bg-[#b08b38] text-stone-950 font-bold text-xs sm:text-sm shadow-xl shadow-[#C9A24B]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>{intro.actionButtonText}</span>
            <ArrowLeft className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
          </button>
        )}
      </div>

      {/* Down Button: Smoothly glides down to Welcoming Hero Slides */}
      {intro?.showSkipButton !== false && (
        <div className="absolute bottom-6 sm:bottom-10 z-30 flex flex-col items-center gap-2 pointer-events-auto">
          <button
            onClick={() => handleScrollToHero(false)}
            type="button"
            className="group px-5 py-2.5 rounded-full bg-white/10 hover:bg-[#C9A24B] text-white hover:text-stone-950 font-bold text-xs sm:text-sm border border-white/20 hover:border-[#C9A24B] backdrop-blur-md transition-all shadow-xl flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
            title={language === 'en' ? 'Continue to welcoming slides' : 'الانتقال للشرائح الترحيبية'}
          >
            <span>{intro?.skipButtonText || (language === 'en' ? 'Explore Welcoming Slides' : 'الانتقال للشرائح الترحيبية')}</span>
            <ChevronDown className="w-4 h-4 text-[#DFBE72] group-hover:text-stone-950 group-hover:translate-y-1 transition-transform animate-bounce" />
          </button>
        </div>
      )}

      {/* Dynamic Golden Progress Bar at the bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15 z-30 overflow-hidden pointer-events-none">
        <div 
          className="h-full bg-gradient-to-r from-[#DFBE72] via-[#C9A24B] to-[#DFBE72] transition-all duration-200 ease-linear shadow-[0_0_8px_rgba(201,162,75,0.8)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  );
};
