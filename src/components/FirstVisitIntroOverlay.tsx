import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SiteSettings } from '../types';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FirstVisitIntroOverlayProps {
  siteSettings?: SiteSettings;
  isReady?: boolean; // Triggered when fonts and primary data are hydrated
  onFinished?: () => void;
}

export const FirstVisitIntroOverlay: React.FC<FirstVisitIntroOverlayProps> = ({
  siteSettings,
  isReady = true,
  onFinished
}) => {
  const { language, isRtl } = useLanguage();
  const config = siteSettings?.firstVisitIntro;

  // 1. Crawler / Bot Detection (Never block search engines, bots, or lighthouse audits)
  const isCrawler = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /bot|crawler|spider|crawling|googlebot|bingbot|lighthouse|prerender|headlesschrome/i.test(ua);
  }, []);

  const hasIntroVideo = (siteSettings?.introVideo?.enabled !== false) && Boolean(siteSettings?.introVideo?.videoUrl);

  const isEnabled = config?.enabled !== false && (siteSettings?.displaySettings?.introEnabled !== false);
  const resetVersion = config?.resetVersion || 1;
  const storageKey = `prestige_first_visit_intro_v${resetVersion}`;

  // 2. Frequency verification (session [default], daily, once, always)
  const frequency = config?.frequency || siteSettings?.displaySettings?.introFrequency || 'session';

  // Helper to detect hard reload (Ctrl+Shift+R) or standard browser refresh
  const isPageReload = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      // 1. Navigation Timing API Level 2
      const navEntries = performance.getEntriesByType?.('navigation');
      if (navEntries && navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming;
        if (nav.type === 'reload') return true;
      }
      // 2. Legacy Performance Navigation API
      if ((performance as any)?.navigation?.type === 1) {
        return true;
      }
      // 3. User initiated reload marker (captured via keydown Ctrl+Shift+R or Ctrl+R or F5)
      if (sessionStorage.getItem('prestige_force_intro_reload') === 'true') {
        return true;
      }
    } catch {}
    return false;
  };

  const [shouldShow, setShouldShow] = useState<boolean>(() => {
    if (typeof window === 'undefined' || isCrawler || !isEnabled || hasIntroVideo) return false;
    try {
      // If user reloaded the page via Ctrl+Shift+R, F5, or browser refresh, repeat the intro!
      if (isPageReload()) {
        sessionStorage.removeItem(storageKey);
        sessionStorage.removeItem('prestige_force_intro_reload');
        return true;
      }

      if (frequency === 'session') {
        return sessionStorage.getItem(storageKey) !== 'shown';
      } else if (frequency === 'once') {
        return localStorage.getItem(storageKey) !== 'shown';
      } else if (frequency === 'daily') {
        const last = localStorage.getItem(`${storageKey}_timestamp`);
        if (last) {
          const elapsed = Date.now() - parseInt(last, 10);
          return elapsed > 24 * 60 * 60 * 1000;
        }
        return true;
      } else if (frequency === 'always') {
        return true;
      }
    } catch {
      return false;
    }
    return true;
  });

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(15);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const minDurationMs = Math.min(config?.minDurationMs || 400, 550);
  const maxDurationMs = Math.min(config?.maxDurationMs || 2500, 3000);
  const startTimeRef = useRef<number>(Date.now());
  const hasDismissedRef = useRef<boolean>(false);

  // Capture Ctrl+Shift+R, Ctrl+R, F5 to ensure intro replays on reload
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R' || e.keyCode === 82)) ||
        e.key === 'F5' || e.keyCode === 116
      ) {
        try {
          sessionStorage.removeItem(storageKey);
          sessionStorage.removeItem('prestige_intro_session_shown');
          sessionStorage.setItem('prestige_force_intro_reload', 'true');
        } catch {}
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [storageKey]);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mq.addEventListener?.('change', listener);
      return () => mq.removeEventListener?.('change', listener);
    }
  }, []);

  // Smooth scroll and direct to welcoming hero slides
  const navigateToHeroSlides = () => {
    const heroEl = document.getElementById('hero-slider-section');
    if (heroEl) {
      heroEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (onFinished) onFinished();
  };

  // Dismiss intro smoothly with fade-out and redirect to welcoming hero slides
  const dismissIntro = (isSkipped = false) => {
    if (hasDismissedRef.current) return;
    hasDismissedRef.current = true;

    try {
      if (frequency === 'session') {
        sessionStorage.setItem(storageKey, 'shown');
      } else {
        localStorage.setItem(storageKey, 'shown');
        localStorage.setItem(`${storageKey}_timestamp`, String(Date.now()));
      }
    } catch {}

    if (prefersReducedMotion || isSkipped) {
      setShouldShow(false);
      navigateToHeroSlides();
    } else {
      setIsFadingOut(true);
      // Wait for smooth luxury fade-out to complete (550ms), then direct to welcoming hero slides
      setTimeout(() => {
        navigateToHeroSlides();
        setTimeout(() => {
          setShouldShow(false);
        }, 200);
      }, 550);
    }
  };

  // High-performance progress animation without 40ms CPU re-render loops
  useEffect(() => {
    if (!shouldShow) return;

    startTimeRef.current = Date.now();

    // Advance to 85% quickly on mount
    const timer1 = setTimeout(() => {
      setProgress(85);
    }, 100);

    // Hard max safeguard timeout
    const maxTimeout = setTimeout(() => {
      setProgress(100);
      dismissIntro(false);
    }, maxDurationMs);

    return () => {
      clearTimeout(timer1);
      clearTimeout(maxTimeout);
    };
  }, [shouldShow, maxDurationMs]);

  // When readiness criteria are satisfied (fonts loaded + primary data ready)
  useEffect(() => {
    if (!shouldShow || !isReady) return;

    const elapsed = Date.now() - startTimeRef.current;
    const remainingMin = Math.max(0, minDurationMs - elapsed);

    const readyTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        dismissIntro(false);
      }, 80);
    }, remainingMin);

    return () => clearTimeout(readyTimer);
  }, [shouldShow, isReady, minDurationMs]);

  useEffect(() => {
    if (hasIntroVideo && shouldShow) {
      setShouldShow(false);
      onFinished?.();
    }
  }, [hasIntroVideo, shouldShow, onFinished]);

  if (!shouldShow || hasIntroVideo) return null;

  const logoUrl = config?.logoUrl || siteSettings?.logoUrl || '/images/brand/logo.png';
  const title = language === 'en' 
    ? (config?.titleEn || siteSettings?.siteTitleEn || 'PRESTIGE')
    : (config?.titleAr || siteSettings?.siteTitle || 'برستيج');

  const subtitle = language === 'en'
    ? (config?.subtitleEn || siteSettings?.siteSubtitleEn || 'Luxury Hotel Management & Hospitality')
    : (config?.subtitleAr || siteSettings?.siteSubtitle || 'إدارة وتشغيل الفنادق والضيافة الفاخرة');

  const badge = language === 'en'
    ? (config?.badgeEn || 'Kingdom of Saudi Arabia')
    : (config?.badgeAr || 'المملكة العربية السعودية');

  return (
    <div
      role="status"
      aria-label="Loading Prestige Hospitality"
      aria-live="polite"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden transition-all ${
        prefersReducedMotion ? 'duration-150' : 'duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]'
      } ${
        isFadingOut ? 'opacity-0 scale-[1.03] blur-sm pointer-events-none' : 'opacity-100 scale-100 blur-none'
      }`}
      style={{
        backgroundColor: config?.backgroundColor || '#0B0B0C',
        willChange: 'opacity, transform'
      }}
    >
      {/* Subtle Radial Ambient Gold Glow (Pure GPU) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 48%, rgba(201, 162, 75, 0.12) 0%, rgba(11, 11, 12, 0.95) 65%, #0B0B0C 100%)',
          willChange: 'transform'
        }}
      />

      {/* Decorative Ultra-Thin Gold Grid Accents */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#C9A24B_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Top Skip Button */}
      {config?.showSkipButton !== false && (
        <div className={`absolute top-6 ${isRtl ? 'left-6' : 'right-6'} z-30 animate-fadeIn`}>
          <button
            type="button"
            onClick={() => dismissIntro(true)}
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#C9A24B]/50 text-white/80 hover:text-white text-xs font-bold transition-all backdrop-blur-md flex items-center gap-1.5 shadow-lg cursor-pointer group"
          >
            <span>{language === 'en' ? 'Skip' : 'تخطي'}</span>
            <ChevronRight className={`w-3.5 h-3.5 text-[#C9A24B] transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
          </button>
        </div>
      )}

      {/* Central Brand Identity Capsule */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 max-w-lg mx-auto space-y-5">
        
        {/* Prestige Gold Badge */}
        <div 
          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#C9A24B]/10 border border-[#C9A24B]/30 text-[#DFBE72] text-[11px] font-bold backdrop-blur-md shadow-xs ${
            prefersReducedMotion ? '' : 'animate-fadeIn'
          }`}
        >
          <Sparkles className="w-3 h-3 text-[#C9A24B]" />
          <span>{badge}</span>
        </div>

        {/* Brand Logo with Ambient Aura */}
        <div className="relative my-2">
          {/* Subtle pulsating back-glow */}
          <div 
            className={`absolute inset-0 bg-[#C9A24B]/20 rounded-full blur-2xl scale-125 ${
              prefersReducedMotion ? '' : 'animate-pulse'
            }`} 
          />
          
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 p-0.5 border border-[#C9A24B]/40 shadow-2xl flex items-center justify-center backdrop-blur-xl">
            <img
              src={logoUrl}
              alt="Prestige Logo"
              width={80}
              height={80}
              fetchPriority="high"
              decoding="async"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain filter drop-shadow-[0_2px_12px_rgba(201,162,75,0.4)]"
              onError={(e) => {
                // Fallback text mark if logo file fails
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black font-cairo tracking-tight text-white filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-medium font-cairo max-w-md leading-relaxed filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
            {subtitle}
          </p>
        </div>

        {/* Thin Gold Progress Bar Indicator */}
        {config?.showProgressBar !== false && (
          <div className="w-44 sm:w-56 pt-3 space-y-1.5">
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden p-0.5 backdrop-blur-sm border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-[#B38A34] via-[#E6C673] to-[#B38A34] rounded-full transition-all ease-out"
                style={{ 
                  width: `${progress}%`,
                  transitionDuration: '240ms',
                  boxShadow: '0 0 10px rgba(201, 162, 75, 0.6)'
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span className="text-[#DFBE72] font-bold">PRESTIGE</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Subtle Bottom Copyright */}
      <div className="absolute bottom-6 text-[11px] text-stone-400 font-medium tracking-wide">
        <span>© {new Date().getFullYear()} {language === 'en' ? 'Prestige Hospitality Management' : 'شركة برستيج للضيافة الفاخرة'}</span>
      </div>
    </div>
  );
};
