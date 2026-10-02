import React, { useState, useRef } from 'react';
import { SiteSettings, ActivePage } from '../types';
import { SafeVideoPlayer } from './SafeVideoPlayer';
import { 
  Film, 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Sparkles,
  Play,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const [isMuted, setIsMuted] = useState(intro?.muted ?? true);
  const [isPlaying, setIsPlaying] = useState(intro?.autoPlay ?? true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (!intro || !intro.enabled || !videoUrlString.trim()) {
    return null;
  }

  const handleToggleSound = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    // Direct synchronous unmuting on user gesture to satisfy browser autoplay/audio permissions
    const video = videoRef.current || (document.querySelector('#intro-video-section video') as HTMLVideoElement | null);
    if (video) {
      video.muted = nextMuted;
      video.defaultMuted = nextMuted;
      video.volume = nextMuted ? 0 : 1.0;
      if (!nextMuted) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[IntroVideo] play error upon unmuting:', err);
          });
        }
      }
    }
  };

  const handleScrollDown = () => {
    if (onSkip) {
      onSkip();
      return;
    }
    const heroEl = document.getElementById('hero-slider-section');
    if (heroEl) {
      heroEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
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
      handleScrollDown();
    }
  };

  return (
    <section 
      id="intro-video-section"
      className="relative w-full h-screen h-[100dvh] min-h-[550px] bg-black text-white overflow-hidden flex items-center justify-center select-none"
    >
      {/* Background Video Player */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <SafeVideoPlayer
          videoRef={videoRef}
          url={videoUrlString}
          poster={posterUrlString}
          className="w-full h-full object-cover scale-105"
          controls={false}
          autoPlay={intro.autoPlay !== false}
          muted={isMuted}
          loop={intro.loop !== false}
          playsInline={true}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {/* Light Overlays — keep video vivid, only gentle gradient for text contrast */}
        {intro.overlayStyle !== 'none' && (
          <>
            <div 
              className={`absolute inset-0 transition-opacity duration-500 ${
                intro.overlayStyle === 'cinematic'
                  ? 'bg-gradient-to-t from-black/35 via-transparent to-black/10'
                  : intro.overlayStyle === 'subtle'
                  ? 'bg-gradient-to-t from-black/20 via-transparent to-transparent'
                  : 'bg-gradient-to-t from-black/25 via-transparent to-black/5'
              }`} 
            />
            {intro.overlayStyle === 'cinematic' && (
              <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/10 pointer-events-none" />
            )}
            {/* Ambient Warm Golden Glow Halo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9A24B]/8 rounded-full blur-[140px] pointer-events-none" />
          </>
        )}
      </div>

      {/* Floating Audio & Playback Controls (Top Left / Right) */}
      {intro.showSoundButton !== false && (
        <div className={`absolute top-24 ${isRtl ? 'left-6' : 'right-6'} z-30 flex items-center gap-2`}>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleToggleSound}
            className="px-3.5 py-2 rounded-full bg-black/40 hover:bg-[#C9A24B] text-white hover:text-black border border-white/20 hover:border-[#C9A24B] backdrop-blur-md transition-all flex items-center gap-2 shadow-xl cursor-pointer text-xs font-bold font-cairo"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? (language === 'en' ? 'Unmute' : 'تشغيل الصوت') : (language === 'en' ? 'Mute' : 'كتم الصوت')}</span>
          </motion.button>
        </div>
      )}

      {/* Hero Content Overlay (If Admin added text) */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-8 text-center flex flex-col items-center justify-center space-y-6 pt-16">
        {intro.showBadge !== false && (intro.badgeText || (intro as any).badge) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A24B]/20 border border-[#C9A24B]/50 text-[#DFBE72] text-xs sm:text-sm font-bold backdrop-blur-md shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
            <span>{intro.badgeText || (intro as any).badge}</span>
          </motion.div>
        )}

        {intro.showTitle !== false && intro.title && (
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-cairo font-black text-white tracking-tight leading-tight filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]"
          >
            {intro.title}
          </motion.h1>
        )}

        {intro.showSubtitle !== false && intro.subtitle && (
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-sm sm:text-lg text-stone-100 max-w-2xl font-cairo font-medium leading-relaxed filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
          >
            {intro.subtitle}
          </motion.p>
        )}

        {intro.showActionButton !== false && intro.actionButtonText && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAction}
            className="px-7 py-3 rounded-full bg-[#C9A24B] hover:bg-[#b08b38] text-stone-950 font-bold text-xs sm:text-sm shadow-xl shadow-[#C9A24B]/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>{intro.actionButtonText}</span>
            <ArrowLeft className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
          </motion.button>
        )}
      </div>

      {/* Skip / Scroll Down Button to continue to Hero Slider */}
      {intro.showSkipButton !== false && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute bottom-6 sm:bottom-10 z-30 flex flex-col items-center gap-2"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleScrollDown}
            className="group px-5 py-2.5 rounded-full bg-white/10 hover:bg-[#C9A24B] text-white hover:text-stone-950 font-bold text-xs sm:text-sm border border-white/20 hover:border-[#C9A24B] backdrop-blur-md transition-all shadow-xl flex items-center gap-2 cursor-pointer"
          >
            <span>{intro.skipButtonText || (language === 'en' ? 'Skip to Content' : 'متابعة إلى الموقع')}</span>
            <ChevronDown className="w-4 h-4 text-[#DFBE72] group-hover:text-stone-950 group-hover:translate-y-0.5 transition-transform" />
          </motion.button>
        </motion.div>
      )}
    </section>
  );
};
