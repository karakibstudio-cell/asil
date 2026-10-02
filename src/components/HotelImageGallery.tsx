import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Images, 
  LayoutGrid, 
  Maximize2, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  BedDouble, 
  Utensils, 
  Building2, 
  Eye, 
  CheckCircle2, 
  Coffee,
  Share2,
  SlidersHorizontal,
  Compass,
  ArrowRight
} from 'lucide-react';
import { Hotel } from '../types';

export interface GalleryItem {
  id: string;
  url: string;
  title: string;
  category: 'rooms' | 'dining' | 'lobby' | 'views' | 'facilities' | 'all';
  categoryLabel: string;
  description?: string;
  facilityTag?: string;
  isVideo?: boolean;
  videoUrl?: string;
}

interface HotelImageGalleryProps {
  hotel: Hotel;
  onOpenLightbox: (index: number) => void;
  className?: string;
  initialCategory?: string;
  showFacilityShowcase?: boolean;
}

export const HotelImageGallery: React.FC<HotelImageGalleryProps> = ({
  hotel,
  onOpenLightbox,
  className = '',
  showFacilityShowcase = true
}) => {
  // Categories definition
  const categories = [
    { key: 'all', label: 'كافة الصور والمرافق', icon: Images },
    { key: 'rooms', label: 'الغرف والأجنحة', icon: BedDouble },
    { key: 'views', label: 'إطلالات الحرم', icon: Eye },
    { key: 'dining', label: 'المطاعم والبوفيه', icon: Utensils },
    { key: 'lobby', label: 'الاستقبال والبهو', icon: Building2 },
    { key: 'facilities', label: 'الخدمات والمرافق', icon: Coffee },
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);

  // Generate authentic gallery items for the hotel (no artificial modulo or external filler photos)
  const galleryItems = useMemo<GalleryItem[]>(() => {
    const items: GalleryItem[] = [];
    const addedUrls = new Set<string>();

    const categoryLabels: Record<string, string> = {
      rooms: 'الغرف والأجنحة',
      views: 'إطلالات وموقع',
      dining: 'المطاعم والبوفيه',
      lobby: 'الاستقبال والبهو',
      facilities: 'الخدمات والمرافق',
      all: 'ألبوم الفندق'
    };

    // 1. Add promotional video first if available
    if (hotel.videoUrl) {
      items.push({
        id: `vid-${hotel.id}-main`,
        url: hotel.mainImage || '',
        title: `جولة فيديو تعريفية شاملة - ${hotel.name}`,
        category: 'views',
        categoryLabel: 'فيديو وجولة',
        description: 'جولة مرئية عالية الدقة تستعرض مرافق الفندق والأجنحة عن قُرب.',
        facilityTag: 'فيديو الفندق',
        isVideo: true,
        videoUrl: hotel.videoUrl
      });
    }

    // 2. Add main image
    if (hotel.mainImage && hotel.mainImage.trim()) {
      addedUrls.add(hotel.mainImage);
      items.push({
        id: `img-${hotel.id}-main`,
        url: hotel.mainImage,
        title: `الواجهة الرئيسية - ${hotel.name}`,
        category: 'views',
        categoryLabel: 'إطلالات وموقع',
        description: `موقع استثنائي في ${hotel.city} على بُعد ${hotel.distanceText}.`,
        facilityTag: 'صورة الغلاف',
        isVideo: false
      });
    }

    // 3. Add hotel's actual gallery images
    (hotel.galleryImages || []).forEach((item: any, index: number) => {
      if (!item) return;
      
      let url = '';
      let category: GalleryItem['category'] = 'all';
      let title = '';

      if (typeof item === 'string') {
        url = item.trim();
        category = 'all';
        title = `${hotel.name} - صورة ${items.length + 1}`;
      } else if (typeof item === 'object' && item.url) {
        url = (item.url || '').trim();
        category = (item.category && item.category !== 'all' ? item.category : 'all') as GalleryItem['category'];
        title = item.title?.trim() || `${hotel.name} - صورة ${items.length + 1}`;
      }

      if (!url || addedUrls.has(url)) return;
      addedUrls.add(url);

      items.push({
        id: `img-${hotel.id}-${index}`,
        url,
        title,
        category,
        categoryLabel: categoryLabels[category] || 'ألبوم الفندق',
        description: '',
        facilityTag: categoryLabels[category] || 'فندق',
        isVideo: false
      });
    });

    return items;
  }, [hotel]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return galleryItems;
    return galleryItems.filter(item => item.category === selectedCategory);
  }, [galleryItems, selectedCategory]);

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategory]);

  // Autoplay functionality
  useEffect(() => {
    if (!isAutoPlaying || filteredItems.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isAutoPlaying, filteredItems.length]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailScrollRef.current) {
      const activeThumb = thumbnailScrollRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  };

  // Keyboard navigation for slider
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'slider') return;
      if (e.key === 'ArrowRight') handlePrev();
      if (e.key === 'ArrowLeft') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, filteredItems.length]);

  // Touch Swipe handlers
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

  const currentItem = filteredItems[currentIndex] || filteredItems[0];

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Find original index in global media items for lightbox
  const getGlobalIndex = (item: GalleryItem) => {
    const globalIdx = galleryItems.findIndex(g => g.id === item.id);
    return globalIdx >= 0 ? globalIdx : 0;
  };

  return (
    <div id="hotel-image-gallery-section" className={`space-y-6 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-[#C9A24B]/15 text-[#B38A34]">
              <Images className="w-5 h-5" />
            </span>
            <h3 className="font-cairo font-bold text-xl text-stone-900">
              معرض صور ومرافق {hotel.name}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 font-cairo">
            استعرض مرافق الفندق، الغرف والأجنحة الفاخرة، المطاعم، وإطلالات الحرم الشريف بدقة عالية
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* View Mode Switcher */}
          <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 border border-stone-200">
            <button
              onClick={() => setViewMode('slider')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'slider'
                  ? 'bg-white text-[#B38A34] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="عرض السلايدر التفاعلي"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>سلايدر تفاعلي</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-[#B38A34] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="عرض الشبكة الكاملة"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>شبكة الصور ({filteredItems.length})</span>
            </button>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors relative"
            title="مشاركة المعرض"
          >
            <Share2 className="w-4 h-4 text-stone-700" />
            {copiedLink && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                تم النسخ!
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.key;
          const count = cat.key === 'all' 
            ? galleryItems.length 
            : galleryItems.filter(i => i.category === cat.key).length;

          if (count === 0 && cat.key !== 'all') return null;

          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border shrink-0 ${
                isSelected
                  ? 'bg-[#C9A24B] text-white border-[#C9A24B] shadow-sm shadow-[#C9A24B]/30'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#B38A34]'}`} />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected ? 'bg-black/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. SLIDER / SHOWCASE VIEW */}
      {viewMode === 'slider' && currentItem && (
        <div className="space-y-4">
          <div 
            className="relative bg-stone-900 rounded-3xl overflow-hidden shadow-xl border border-stone-200 aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/10] max-h-[520px] select-none group"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Main Stage Image */}
            <img
              key={currentItem.id}
              src={currentItem.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'}
              alt={currentItem.title}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallbackApplied) {
                  target.dataset.fallbackApplied = 'true';
                  target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
                }
              }}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />

            {/* Top Bar inside image: category badge & counter & controls */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#DFBE72]" />
                  <span>{currentItem.categoryLabel}</span>
                </span>
                {currentItem.facilityTag && (
                  <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-[#C9A24B]/80 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                    {currentItem.facilityTag}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Autoplay Toggle */}
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-medium border border-white/20 flex items-center gap-1.5 transition-all"
                  title={isAutoPlaying ? 'إيقاف التشغيل التلقائي' : 'تشغيل تلقائي'}
                >
                  {isAutoPlaying ? (
                    <>
                      <Pause className="w-3 h-3 text-[#DFBE72]" />
                      <span className="hidden sm:inline">إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-[#DFBE72] fill-[#DFBE72]" />
                      <span className="hidden sm:inline">تشغيل تلقائي</span>
                    </>
                  )}
                </button>

                {/* Counter */}
                <span className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-mono border border-white/20">
                  {currentIndex + 1} / {filteredItems.length}
                </span>

                {/* Fullscreen Lightbox Trigger */}
                <button
                  onClick={() => onOpenLightbox(getGlobalIndex(currentItem))}
                  className="p-1.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white shadow-md transition-transform hover:scale-105"
                  title="تكبير ملء الشاشة"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Play Overlay if video */}
            {currentItem.isVideo && (
              <div 
                onClick={() => onOpenLightbox(getGlobalIndex(currentItem))}
                className="absolute inset-0 flex items-center justify-center cursor-pointer group/vid"
              >
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-[#C9A24B]/90 hover:bg-[#C9A24B] text-black flex items-center justify-center shadow-2xl transition-all transform group-hover/vid:scale-110">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-[-2px]" />
                </div>
              </div>
            )}

            {/* Navigation Arrows */}
            {filteredItems.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-[#C9A24B] hover:text-black text-white backdrop-blur-md border border-white/20 transition-all transform hover:scale-110"
                  aria-label="السابق"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-[#C9A24B] hover:text-black text-white backdrop-blur-md border border-white/20 transition-all transform hover:scale-110"
                  aria-label="التالي"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-6 z-10 text-right">
              <h4 className="text-base sm:text-xl md:text-2xl font-cairo font-bold text-white mb-1.5 drop-shadow-md">
                {currentItem.title}
              </h4>
              {currentItem.description && (
                <p className="text-xs sm:text-sm text-stone-200 line-clamp-2 max-w-3xl drop-shadow">
                  {currentItem.description}
                </p>
              )}
            </div>
          </div>

          {/* Thumbnails Navigation Strip */}
          {filteredItems.length > 1 && (
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-sm">
              <div 
                ref={thumbnailScrollRef}
                className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1 no-scrollbar scroll-smooth"
              >
                {filteredItems.map((item, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative w-20 h-14 sm:w-28 sm:h-18 rounded-xl overflow-hidden shrink-0 transition-all duration-300 border-2 ${
                        isActive
                          ? 'border-[#C9A24B] scale-105 shadow-md shadow-[#C9A24B]/30 opacity-100 ring-2 ring-[#C9A24B]/40'
                          : 'border-transparent opacity-60 hover:opacity-95'
                      }`}
                    >
                      <img
                        src={item.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallbackApplied) {
                            target.dataset.fallbackApplied = 'true';
                            target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                      {item.isVideo && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-mono leading-none">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. GRID / MASONRY VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onOpenLightbox(getGlobalIndex(item))}
              className="group relative bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-[#C9A24B] shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                <img
                  src={item.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = 'true';
                      target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                {/* Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                    {item.categoryLabel}
                  </span>
                  {item.facilityTag && (
                    <span className="px-2 py-1 rounded-lg bg-[#C9A24B]/90 text-white text-[10px] font-bold shadow-sm">
                      {item.facilityTag}
                    </span>
                  )}
                </div>

                {/* Expand / Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-[#C9A24B] text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                    {item.isVideo ? (
                      <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
                    ) : (
                      <Maximize2 className="w-5 h-5" />
                    )}
                  </div>
                </div>

                <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/70 text-[10px] text-white font-mono">
                  {idx + 1}
                </span>
              </div>

              {/* Caption */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <h4 className="font-cairo font-bold text-sm text-stone-900 line-clamp-1 group-hover:text-[#B38A34] transition-colors">
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. VISUAL FACILITY SHOWCASE CARDS */}
      {showFacilityShowcase && (
        <div className="mt-10 pt-8 border-t border-stone-200">
          <div className="mb-6">
            <h4 className="font-cairo font-bold text-lg text-stone-900 mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#B38A34]" />
              <span>مرافق الفندق الحصرية المصورة</span>
            </h4>
            <p className="text-xs sm:text-sm text-stone-500">
              تصفح أبرز وسائل الراحة والخدمات المتاحة لنزلاء الفندق مع توثيق مصور
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Rooms */}
            <div 
              onClick={() => {
                setSelectedCategory('rooms');
                setViewMode('slider');
              }}
              className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-[#C9A24B] shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/10 text-[#B38A34] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BedDouble className="w-5 h-5" />
              </div>
              <h5 className="font-cairo font-bold text-sm text-stone-900 mb-1 group-hover:text-[#B38A34] transition-colors">
                أجنحة وغرف فاخرة
              </h5>
              <p className="text-xs text-stone-500 line-clamp-2 mb-3">
                خيارات متنوعة للأفراد والعائلات مع تجهيزات 5 نجوم ونظام عزل صوتي متطور.
              </p>
              <span className="text-[11px] font-bold text-[#B38A34] flex items-center gap-1">
                <span>عرض صور الغرف</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </span>
            </div>

            {/* Card 2: Dining */}
            <div 
              onClick={() => {
                setSelectedCategory('dining');
                setViewMode('slider');
              }}
              className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-[#C9A24B] shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/10 text-[#B38A34] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Utensils className="w-5 h-5" />
              </div>
              <h5 className="font-cairo font-bold text-sm text-stone-900 mb-1 group-hover:text-[#B38A34] transition-colors">
                مطاعم وبوفيه ملكي
              </h5>
              <p className="text-xs text-stone-500 line-clamp-2 mb-3">
                أشهى المأكولات العالمية والشرقية يومياً مع إطلالات ساحرة على رحاب الحرم.
              </p>
              <span className="text-[11px] font-bold text-[#B38A34] flex items-center gap-1">
                <span>عرض صور المطاعم</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </span>
            </div>

            {/* Card 3: Views */}
            <div 
              onClick={() => {
                setSelectedCategory('views');
                setViewMode('slider');
              }}
              className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-[#C9A24B] shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/10 text-[#B38A34] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Eye className="w-5 h-5" />
              </div>
              <h5 className="font-cairo font-bold text-sm text-stone-900 mb-1 group-hover:text-[#B38A34] transition-colors">
                إطلالات الحرم والساحات
              </h5>
              <p className="text-xs text-stone-500 line-clamp-2 mb-3">
                {hotel.location.viewType} بالقرب التام من بوابات الحرم ومصليات النساء والرجال.
              </p>
              <span className="text-[11px] font-bold text-[#B38A34] flex items-center gap-1">
                <span>عرض الإطلالات</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </span>
            </div>

            {/* Card 4: Lobby & Services */}
            <div 
              onClick={() => {
                setSelectedCategory('lobby');
                setViewMode('slider');
              }}
              className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-[#C9A24B] shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/10 text-[#B38A34] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <h5 className="font-cairo font-bold text-sm text-stone-900 mb-1 group-hover:text-[#B38A34] transition-colors">
                بهو واستقبال VIP
              </h5>
              <p className="text-xs text-stone-500 line-clamp-2 mb-3">
                خدمة استقبال متميزة على مدار 24 ساعة، مصاعد سريعة، ومرافق لذوي الهمم.
              </p>
              <span className="text-[11px] font-bold text-[#B38A34] flex items-center gap-1">
                <span>عرض صور الاستقبال</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
