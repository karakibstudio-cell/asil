import React, { useState, useRef, useEffect } from 'react';
import { parseVideoUrl } from '../utils/video';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Film, ExternalLink, Maximize } from 'lucide-react';

interface SafeVideoPlayerProps {
  url?: string;
  src?: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export const SafeVideoPlayer: React.FC<SafeVideoPlayerProps> = ({
  url,
  src,
  poster,
  className = 'w-full h-full object-contain',
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  playsInline = true,
  onPlay,
  onPause,
  onEnded,
  videoRef: externalVideoRef
}) => {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeVideoRef = externalVideoRef || internalVideoRef;

  const rawInput = url || src;
  const effectiveUrl = typeof rawInput === 'string'
    ? rawInput
    : (rawInput && typeof rawInput === 'object'
        ? ((rawInput as any).url || (rawInput as any).videoUrl || (rawInput as any).src || '')
        : '');

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  const isBackground = controls === false;
  const videoInfo = parseVideoUrl(effectiveUrl, isBackground);

  const isSlowOrMobile = typeof window !== 'undefined' && (
    Boolean((navigator as any).connection?.saveData) ||
    ['slow-2g', '2g'].includes((navigator as any).connection?.effectiveType)
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !containerRef.current) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { rootMargin: '100px' });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Reset states when url changes or user retries
  useEffect(() => {
    setLoadError(false);
    setIsLoading(true);
    setIsPlaying(false);
  }, [effectiveUrl, retryKey]);

  // Synchronize muted prop directly with DOM element and state
  useEffect(() => {
    setIsMuted(muted);
    if (activeVideoRef.current) {
      activeVideoRef.current.muted = muted;
      activeVideoRef.current.defaultMuted = muted;
      if (!muted) {
        activeVideoRef.current.volume = 1.0;
        if (activeVideoRef.current.paused) {
          activeVideoRef.current.play().catch(() => {});
        }
      }
    }
  }, [muted, activeVideoRef]);

  // Handle Autoplay safely without breaking browser autoplay restrictions
  useEffect(() => {
    // Never autoPlay if not visible or if mobile/slow data saver is active
    if (autoPlay && isVisible && !isSlowOrMobile && activeVideoRef.current && !videoInfo.isEmbed) {
      const vid = activeVideoRef.current;
      vid.muted = muted;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch(() => {
            vid.muted = true;
            setIsMuted(true);
            vid.play()
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
              })
              .catch(() => {
                setIsPlaying(false);
                setIsLoading(false);
              });
          });
      }
    }
  }, [autoPlay, isVisible, isSlowOrMobile, url, retryKey, videoInfo.isEmbed, activeVideoRef, muted]);

  // Toggle Play / Pause directly with user gesture
  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeVideoRef.current) return;

    if (activeVideoRef.current.paused) {
      activeVideoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          if (onPlay) onPlay();
        })
        .catch((err) => {
          console.warn('Video play prevented:', err);
        });
    } else {
      activeVideoRef.current.pause();
      setIsPlaying(false);
      if (onPause) onPause();
    }
  };

  // Toggle Sound
  const handleToggleSound = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeVideoRef.current) return;
    const newMuted = !activeVideoRef.current.muted;
    activeVideoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  // Fullscreen
  const handleFullscreen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeVideoRef.current) return;
    if (activeVideoRef.current.requestFullscreen) {
      activeVideoRef.current.requestFullscreen();
    }
  };

  // 1. YouTube or Vimeo Embed
  if (videoInfo.isEmbed && videoInfo.embedUrl) {
    if (isBackground) {
      return (
        <div className="relative w-full h-full min-h-full overflow-hidden bg-black flex items-center justify-center pointer-events-none">
          <iframe
            src={videoInfo.embedUrl}
            title="مشغل الفيديو الترحيبي"
            className="w-[160%] h-[160%] min-w-full min-h-full object-cover pointer-events-none border-0 absolute"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            tabIndex={-1}
          />
        </div>
      );
    }

    return (
      <div className="relative w-full h-full min-h-[260px] sm:min-h-[380px] bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
        <iframe
          src={videoInfo.embedUrl}
          title="مشغل الفيديو"
          className="w-full h-full border-0 absolute inset-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // 2. Fallback if URL is invalid or errored out
  if (loadError || !videoInfo.isValidVideo || !videoInfo.directUrl) {
    if (poster) {
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none">
          <img
            src={poster}
            alt="خلفية الشريحة"
            className={className || "w-full h-full object-cover"}
          />
          {controls && (
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoadError(false);
                  setRetryKey(prev => prev + 1);
                }}
                className="px-3 py-1.5 rounded-xl bg-black/75 hover:bg-[#C9A24B] text-white hover:text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md border border-white/20 backdrop-blur-xs cursor-pointer"
                title="إعادة محاولة تشغيل الفيديو"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-black/75 hover:bg-white text-white hover:text-black font-medium text-xs flex items-center gap-1.5 transition-all shadow-md border border-white/20 backdrop-blur-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح الرابط</span>
                </a>
              )}
            </div>
          )}
        </div>
      );
    }
    if (!controls) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-800 to-black flex items-center justify-center" />
      );
    }
    return (
      <div className="relative w-full h-full min-h-[260px] bg-stone-900 text-stone-200 rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 text-center border border-stone-800">
        <div className="relative z-10 flex flex-col items-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-stone-800/90 border border-[#C9A24B] flex items-center justify-center text-[#DFBE72] mb-3 shadow-lg">
            <Film className="w-7 h-7" />
          </div>
          <h4 className="font-cairo font-bold text-base text-white mb-1.5">
            مقطع الفيديو متاح عبر الرابط المباشر
          </h4>
          <p className="text-stone-300 text-xs mb-4 font-cairo">
            يمكنك فتح الرابط مباشرة لمشاهدة المقطع بجودة عالية.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => {
                setLoadError(false);
                setRetryKey(prev => prev + 1);
              }}
              className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#b08b38] text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1.5 transition-all border border-white/15"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح الرابط مباشرة</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Direct HTML5 Video Player
  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center bg-black group select-none overflow-hidden ${controls ? 'rounded-xl' : 'rounded-none'}`}
    >
      <video
        ref={activeVideoRef}
        key={`${videoInfo.directUrl}-${retryKey}`}
        src={isVisible ? videoInfo.directUrl : undefined}
        className={className}
        controls={controls}
        playsInline={playsInline}
        // @ts-ignore
        webkit-playsinline="true"
        x5-playsinline="true"
        disablePictureInPicture
        disableRemotePlayback
        loop={loop}
        muted={isMuted}
        defaultMuted={isMuted}
        poster={poster}
        autoPlay={autoPlay && isVisible && !isSlowOrMobile}
        preload={!isVisible ? 'none' : (isSlowOrMobile ? 'none' : 'metadata')}
        onPlay={() => {
          setIsPlaying(true);
          setIsLoading(false);
          if (onPlay) onPlay();
        }}
        onPause={() => {
          setIsPlaying(false);
          if (onPause) onPause();
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (!loop && onEnded) {
            const vid = activeVideoRef.current;
            if (vid && vid.duration && !isNaN(vid.duration) && vid.duration > 1.5) {
              if (vid.currentTime >= vid.duration - 0.8) {
                onEnded();
              }
            } else {
              onEnded();
            }
          }
        }}
        onLoadedData={() => {
          if (activeVideoRef.current) {
            activeVideoRef.current.muted = isMuted;
            activeVideoRef.current.defaultMuted = isMuted;
            if (!isMuted) activeVideoRef.current.volume = 1.0;
          }
          setIsLoading(false);
          setLoadError(false);
        }}
        onCanPlay={() => {
          if (activeVideoRef.current) {
            activeVideoRef.current.muted = isMuted;
            activeVideoRef.current.defaultMuted = isMuted;
            if (!isMuted) activeVideoRef.current.volume = 1.0;
          }
          setIsLoading(false);
        }}
        onError={() => {
          console.warn('Video load error for:', videoInfo.directUrl);
          setLoadError(true);
          setIsLoading(false);
        }}
      />

      {/* Floating Center Play Button if paused (Only when controls enabled) */}
      {controls && !isPlaying && !isLoading && (
        <button
          onClick={handleTogglePlay}
          className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/75 hover:bg-[#C9A24B] text-[#DFBE72] hover:text-black border-2 border-[#C9A24B] flex items-center justify-center transition-all duration-300 shadow-2xl group-hover:scale-110 z-20 cursor-pointer"
          aria-label="تشغيل الفيديو"
        >
          <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-current translate-x-[-2px]" />
        </button>
      )}

      {/* Quick Custom Sound & Fullscreen controls overlay (Only when controls enabled) */}
      {controls && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleToggleSound}
            className="p-2.5 rounded-full bg-black/70 hover:bg-[#C9A24B] text-white hover:text-black border border-white/20 transition-all shadow-lg"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2.5 rounded-full bg-black/70 hover:bg-[#C9A24B] text-white hover:text-black border border-white/20 transition-all shadow-lg"
            title="شاشة كاملة"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
