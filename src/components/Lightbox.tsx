import React, { useEffect, useState, useRef } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Play, 
  Pause,
  Film
} from 'lucide-react';
import { SafeVideoPlayer } from './SafeVideoPlayer';
import { useLanguage } from '../context/LanguageContext';

export interface LightboxMediaItem {
  type: 'image' | 'video';
  url: string;
  title?: string;
  thumbnail?: string;
}

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems?: LightboxMediaItem[];
  images?: string[];
  initialIndex?: number;
}

export const Lightbox: React.FC<LightboxProps> = ({
  isOpen,
  onClose,
  mediaItems,
  images,
  initialIndex = 0
}) => {
  const { language, isRtl } = useLanguage();
  const items: LightboxMediaItem[] = React.useMemo(() => {
    if (mediaItems && mediaItems.length > 0) return mediaItems;
    if (images && images.length > 0) {
      return images.filter(Boolean).map(img => ({ type: 'image' as const, url: img }));
    }
    return [];
  }, [mediaItems, images]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, initialIndex]);

  const handleNext = () => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') isRtl ? handlePrev() : handleNext();
      if (e.key === 'ArrowLeft') isRtl ? handleNext() : handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items.length, isRtl, onClose]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      // Swiped left
      isRtl ? handlePrev() : handleNext();
    } else if (diff < -50) {
      // Swiped right
      isRtl ? handleNext() : handlePrev();
    }
    setTouchStartX(null);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];

  return (
    <div
      id="fullscreen-lightbox-modal"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none animate-fadeIn"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Controls Bar */}
      <div className="w-full flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent z-20">
        <div className="flex items-center gap-3">
          <span 
            id="lightbox-counter-badge"
            className="px-3.5 py-1.5 rounded-full bg-white/10 text-neutral-200 text-xs sm:text-sm font-medium border border-white/10 font-mono"
          >
            {language === 'en' 
              ? `${currentIndex + 1} of ${items.length}` 
              : `عنصر ${currentIndex + 1} من ${items.length}`}
          </span>
          {currentItem.title && (
            <span className="hidden sm:inline text-neutral-300 text-sm font-cairo truncate max-w-md">
              {currentItem.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentItem.type === 'video' && (
            <>
              <button
                id="lightbox-mute-toggle"
                onClick={toggleSound}
                className="p-2.5 rounded-full bg-white/10 hover:bg-[#C9A24B] hover:text-black text-white transition-colors cursor-pointer"
                title={isMuted ? (language === 'en' ? 'Unmute' : 'تشغيل الصوت') : (language === 'en' ? 'Mute' : 'كتم الصوت')}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                id="lightbox-fullscreen-toggle"
                onClick={handleFullScreen}
                className="p-2.5 rounded-full bg-white/10 hover:bg-[#C9A24B] hover:text-black text-white transition-colors cursor-pointer"
                title={language === 'en' ? 'Fullscreen' : 'شاشة كاملة للفيديو'}
              >
                <Maximize className="w-5 h-5" />
              </button>
            </>
          )}

          <button
            id="lightbox-close-button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/15 hover:bg-red-500 text-white transition-colors ml-2 cursor-pointer"
            title={language === 'en' ? 'Close (Esc)' : 'إغلاق (Esc)'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center px-4 sm:px-16 overflow-hidden">
        {/* Previous Button */}
        {items.length > 1 && (
          <button
            id="lightbox-prev-button"
            onClick={isRtl ? handleNext : handlePrev}
            className="absolute left-3 sm:left-6 z-30 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-[#C9A24B] hover:text-black text-white border border-white/15 transition-all duration-200 transform hover:scale-110 cursor-pointer"
            aria-label="السابق"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        {/* Media Display */}
        <div className="max-w-5xl max-h-[82vh] w-full h-full flex items-center justify-center p-2">
          {currentItem.type === 'video' ? (
            <div className="relative w-full h-full max-h-[75vh] flex items-center justify-center">
              <SafeVideoPlayer
                videoRef={videoRef}
                key={currentItem.url}
                url={currentItem.url}
                poster={currentItem.thumbnail}
                className="max-h-[75vh] max-w-full rounded-lg shadow-2xl object-contain"
                autoPlay={true}
                muted={isMuted}
                loop={true}
                playsInline={true}
                controls={true}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          ) : (
            <div className="relative max-h-[80vh] max-w-full flex items-center justify-center rounded-2xl p-4 bg-white/5 backdrop-blur-xs border border-white/10 shadow-2xl">
              <img
                src={currentItem.url}
                alt={currentItem.title || 'صورة المعاينة'}
                className="max-h-[76vh] max-w-full rounded-lg object-contain transition-opacity duration-300 select-none drop-shadow-2xl"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* Next Button */}
        {items.length > 1 && (
          <button
            id="lightbox-next-button"
            onClick={isRtl ? handlePrev : handleNext}
            className="absolute right-3 sm:right-6 z-30 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-[#C9A24B] hover:text-black text-white border border-white/15 transition-all duration-200 transform hover:scale-110 cursor-pointer"
            aria-label="التالي"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {items.length > 1 && (
        <div className="w-full bg-gradient-to-t from-black/90 to-transparent p-4 pb-6 overflow-x-auto">
          <div className="flex items-center justify-center gap-2.5 max-w-4xl mx-auto px-4">
            {items.map((item, idx) => (
              <button
                key={idx}
                id={`lightbox-thumb-${idx}`}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden shrink-0 transition-all duration-200 border-2 cursor-pointer ${
                  currentIndex === idx
                    ? 'border-[#C9A24B] scale-105 shadow-md shadow-[#C9A24B]/30 opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Film className="w-5 h-5 text-[#C9A24B]" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </span>
                  </div>
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover bg-white/10" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
