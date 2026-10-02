import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Play, 
  Film,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Download,
  Share2,
  Check
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
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copiedLink, setCopiedLink] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Reset zoom & pan on image change
  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetTransform();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      resetTransform();
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, initialIndex, resetTransform]);

  useEffect(() => {
    resetTransform();
  }, [currentIndex, resetTransform]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.35, 4));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.35, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (zoom > 1) {
      resetTransform();
    } else {
      setZoom(2.2);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (items[currentIndex]?.type === 'video') return;
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev + 0.2, 4));
    } else {
      setZoom((prev) => {
        const next = Math.max(prev - 0.2, 1);
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Mouse Drag / Pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    e.preventDefault();
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if (zoom > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y
        });
      } else {
        setTouchStartX(e.touches[0].clientX);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoom > 1 && e.touches.length === 1) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    if (zoom <= 1 && touchStartX !== null && e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (diff > 50) {
        isRtl ? handlePrev() : handleNext();
      } else if (diff < -50) {
        isRtl ? handleNext() : handlePrev();
      }
      setTouchStartX(null);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') isRtl ? handlePrev() : handleNext();
      if (e.key === 'ArrowLeft') isRtl ? handleNext() : handlePrev();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-' || e.key === '_') handleZoomOut();
      if (e.key === '0') resetTransform();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items.length, isRtl, onClose, handleNext, handlePrev, resetTransform]);

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleFullScreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  };

  const handleDownload = () => {
    const current = items[currentIndex];
    if (!current?.url) return;
    const a = document.createElement('a');
    a.href = current.url;
    a.download = `prestige-${Date.now()}.${current.type === 'video' ? 'mp4' : 'jpg'}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyDirectLink = () => {
    const current = items[currentIndex];
    if (!current?.url) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#/image?src=${encodeURIComponent(current.url)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];

  return (
    <div
      ref={containerRef}
      id="fullscreen-lightbox-modal"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between select-none animate-fadeIn"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseUp={handleMouseUp}
    >
      {/* Top Controls Bar - Sleek Frosted Glass */}
      <div className="w-full flex items-center justify-between p-3 sm:p-5 bg-gradient-to-b from-black/90 via-black/60 to-transparent z-30">
        <div className="flex items-center gap-3">
          <span 
            id="lightbox-counter-badge"
            className="px-3.5 py-1.5 rounded-full bg-white/10 text-neutral-100 text-xs sm:text-sm font-semibold border border-white/15 font-mono shadow-sm"
          >
            {language === 'en' 
              ? `${currentIndex + 1} / ${items.length}` 
              : `${currentIndex + 1} من ${items.length}`}
          </span>
          {currentItem.title && (
            <span className="hidden md:inline text-neutral-200 text-sm font-cairo font-medium truncate max-w-lg">
              {currentItem.title}
            </span>
          )}
          {zoom > 1 && (
            <span className="px-2.5 py-1 rounded-full bg-[#C9A24B] text-black text-xs font-bold font-mono">
              {Math.round(zoom * 100)}%
            </span>
          )}
        </div>

        {/* Toolbar Action Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentItem.type === 'image' && (
            <>
              {/* Zoom Out */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-[#C9A24B] hover:text-black text-white disabled:opacity-40 disabled:hover:bg-white/10 disabled:hover:text-white transition-all cursor-pointer"
                title={language === 'en' ? 'Zoom Out (-)' : 'تصغير (-)'}
              >
                <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 4}
                className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-[#C9A24B] hover:text-black text-white disabled:opacity-40 transition-all cursor-pointer"
                title={language === 'en' ? 'Zoom In (+)' : 'تكبير (+)'}
              >
                <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Reset Zoom */}
              {(zoom !== 1 || rotation !== 0) && (
                <button
                  type="button"
                  onClick={resetTransform}
                  className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-[#C9A24B] hover:text-black text-white transition-all cursor-pointer"
                  title={language === 'en' ? 'Reset (0)' : 'إعادة ضبط الحجم'}
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Rotate */}
              <button
                type="button"
                onClick={handleRotate}
                className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-[#C9A24B] hover:text-black text-white transition-all cursor-pointer"
                title={language === 'en' ? 'Rotate' : 'تدوير الصورة'}
              >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          )}

          {currentItem.type === 'video' && (
            <button
              id="lightbox-mute-toggle"
              type="button"
              onClick={toggleSound}
              className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-[#C9A24B] hover:text-black text-white transition-all cursor-pointer"
              title={isMuted ? (language === 'en' ? 'Unmute' : 'تشغيل الصوت') : (language === 'en' ? 'Mute' : 'كتم الصوت')}
            >
              {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          )}

          {/* Share / Copy Image Link */}
          <button
            type="button"
            onClick={handleCopyDirectLink}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-[#C9A24B] hover:text-black text-white transition-all cursor-pointer"
            title={language === 'en' ? 'Share image link' : 'مشاركة رابط الصورة'}
          >
            {copiedLink ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Download Original Image */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-[#C9A24B] hover:text-black text-white transition-all cursor-pointer"
            title={language === 'en' ? 'Download Original' : 'تحميل الصورة الأصلية'}
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Fullscreen Request */}
          <button
            id="lightbox-fullscreen-toggle"
            type="button"
            onClick={handleFullScreen}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-[#C9A24B] hover:text-black text-white transition-all cursor-pointer"
            title={language === 'en' ? 'Fullscreen' : 'شاشة كاملة'}
          >
            <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Close Lightbox */}
          <button
            id="lightbox-close-button"
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full bg-white/20 hover:bg-red-600 text-white transition-all ml-1 sm:ml-2 cursor-pointer shadow-lg"
            title={language === 'en' ? 'Close (Esc)' : 'إغلاق (Esc)'}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Main Expansive Viewport Area - Zero Border Constriction */}
      <div 
        className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {/* Previous Navigation Button */}
        {items.length > 1 && (
          <button
            id="lightbox-prev-button"
            type="button"
            onClick={isRtl ? handleNext : handlePrev}
            className="absolute left-3 sm:left-6 z-30 p-3 sm:p-4 rounded-full bg-black/70 hover:bg-[#C9A24B] hover:text-black text-white border border-white/20 backdrop-blur-md transition-all duration-200 transform hover:scale-110 shadow-2xl cursor-pointer"
            aria-label="السابق"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        {/* Media Canvas */}
        <div className="w-full h-full flex items-center justify-center p-0 select-none">
          {currentItem.type === 'video' ? (
            <div className="relative w-full h-full max-h-[86vh] flex items-center justify-center p-2 sm:p-4">
              <SafeVideoPlayer
                videoRef={videoRef}
                key={currentItem.url}
                url={currentItem.url}
                poster={currentItem.thumbnail}
                className="max-h-[86vh] max-w-[96vw] w-auto h-auto rounded-xl shadow-2xl object-contain"
                autoPlay={true}
                muted={isMuted}
                loop={true}
                playsInline={true}
                controls={true}
              />
            </div>
          ) : (
            <div 
              className={`w-full h-full flex items-center justify-center p-1 sm:p-4 overflow-hidden ${
                zoom > 1 
                  ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') 
                  : 'cursor-zoom-in'
              }`}
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={currentItem.url}
                alt={currentItem.title || 'صورة المعاينة الفائقة'}
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  maxHeight: '92vh',
                  maxWidth: '96vw',
                  imageRendering: 'auto'
                }}
                className="w-auto h-auto object-contain select-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto"
                draggable={false}
              />
            </div>
          )}
        </div>

        {/* Next Navigation Button */}
        {items.length > 1 && (
          <button
            id="lightbox-next-button"
            type="button"
            onClick={isRtl ? handlePrev : handleNext}
            className="absolute right-3 sm:right-6 z-30 p-3 sm:p-4 rounded-full bg-black/70 hover:bg-[#C9A24B] hover:text-black text-white border border-white/20 backdrop-blur-md transition-all duration-200 transform hover:scale-110 shadow-2xl cursor-pointer"
            aria-label="التالي"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip - Dynamic & Glassmorphic */}
      {items.length > 1 && (
        <div className="w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 sm:p-4 pb-4 sm:pb-6 overflow-x-auto z-30">
          <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-5xl mx-auto px-2">
            {items.map((item, idx) => (
              <button
                key={idx}
                id={`lightbox-thumb-${idx}`}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-12 sm:w-22 sm:h-16 rounded-xl overflow-hidden shrink-0 transition-all duration-200 border-2 cursor-pointer ${
                  currentIndex === idx
                    ? 'border-[#C9A24B] scale-105 shadow-xl shadow-[#C9A24B]/40 opacity-100 ring-2 ring-[#C9A24B]/50'
                    : 'border-white/10 opacity-50 hover:opacity-90 hover:border-white/40'
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

