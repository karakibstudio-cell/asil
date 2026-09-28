import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  Upload, 
  Star, 
  Trash2, 
  Plus, 
  Play, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Eye, 
  Film, 
  X,
  Edit3
} from 'lucide-react';
import { SafeVideoPlayer } from './SafeVideoPlayer';
import { optimizeImageFile } from '../utils/imageOptimizer';

export interface AdditionalVideoItem {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
}

interface HotelMediaAlbumManagerProps {
  mainImage: string;
  galleryImages: string[];
  videoUrl?: string;
  additionalVideos?: AdditionalVideoItem[];
  onChange: (data: {
    mainImage: string;
    galleryImages: string[];
    videoUrl?: string;
    additionalVideos?: AdditionalVideoItem[];
  }) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const HotelMediaAlbumManager: React.FC<HotelMediaAlbumManagerProps> = ({
  mainImage,
  galleryImages = [],
  videoUrl = '',
  additionalVideos = [],
  onChange,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showAddUrlInput, setShowAddUrlInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Video Tour Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoForm, setVideoForm] = useState<AdditionalVideoItem>({
    id: '',
    title: '',
    thumbnail: '',
    videoUrl: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainVideoFileInputRef = useRef<HTMLInputElement>(null);
  const tourVideoFileInputRef = useRef<HTMLInputElement>(null);
  const videoThumbnailInputRef = useRef<HTMLInputElement>(null);

  // All images combined (Main image is first)
  const allImages = [
    ...(mainImage ? [{ url: mainImage, isMain: true }] : []),
    ...galleryImages
      .filter((img) => img && img !== mainImage)
      .map((img) => ({ url: img, isMain: false }))
  ];

  // ==========================================
  // Image Handlers
  // ==========================================
  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newBase64Images: string[] = [];

    const fileList = Array.from(files) as File[];

    for (const file of fileList) {
      if (file.size > 10 * 1024 * 1024) {
        onShowToast?.(`تم تخطي الملف "${file.name}" لأن حجمه يتجاوز 10 ميجابايت`, 'error');
        continue;
      }

      try {
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const optimized = await optimizeImageFile(file, {
          maxWidth: 1200,
          maxHeight: 1000,
          forcePng: isPng
        });
        newBase64Images.push(optimized);
      } catch (err) {
        console.warn('Failed to optimize image file:', file.name, err);
      }
    }

    finalizeUpload(newBase64Images);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const finalizeUpload = (newImages: string[]) => {
    setIsUploading(false);
    if (newImages.length === 0) return;

    let updatedMain = mainImage;
    let updatedGallery = [...galleryImages];

    if (!updatedMain) {
      updatedMain = newImages[0];
      updatedGallery = [...updatedGallery, ...newImages.slice(1)];
    } else {
      updatedGallery = [...updatedGallery, ...newImages];
    }

    onChange({
      mainImage: updatedMain,
      galleryImages: updatedGallery,
      videoUrl,
      additionalVideos
    });

    onShowToast?.(`تمت إضافة ${newImages.length} صورة إلى ألبوم الفندق بنجاح`, 'success');
  };

  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;

    const url = newImageUrl.trim();
    let updatedMain = mainImage;
    let updatedGallery = [...galleryImages];

    if (!updatedMain) {
      updatedMain = url;
    } else {
      if (!updatedGallery.includes(url)) {
        updatedGallery.push(url);
      }
    }

    onChange({
      mainImage: updatedMain,
      galleryImages: updatedGallery,
      videoUrl,
      additionalVideos
    });

    setNewImageUrl('');
    setShowAddUrlInput(false);
    onShowToast?.('تمت إضافة رابط الصورة إلى الألبوم بنجاح', 'success');
  };

  const handleSetAsMainImage = (targetUrl: string) => {
    if (targetUrl === mainImage) return;

    // Move old mainImage to gallery, and set targetUrl as main
    const filteredGallery = galleryImages.filter((img) => img !== targetUrl);
    if (mainImage && !filteredGallery.includes(mainImage)) {
      filteredGallery.unshift(mainImage);
    }

    onChange({
      mainImage: targetUrl,
      galleryImages: filteredGallery,
      videoUrl,
      additionalVideos
    });

    onShowToast?.('تم تعيين الصورة كصورة رئيسية للفندق بنجاح ⭐', 'success');
  };

  const handleDeleteImage = (targetUrl: string) => {
    if (targetUrl === mainImage) {
      // If deleting main image, pick next from gallery if available
      const remainingGallery = galleryImages.filter((img) => img !== targetUrl);
      const nextMain = remainingGallery[0] || '';
      const updatedGallery = remainingGallery.slice(1);

      onChange({
        mainImage: nextMain,
        galleryImages: updatedGallery,
        videoUrl,
        additionalVideos
      });
      onShowToast?.('تم حذف الصورة الرئيسية وتحديث الألبوم', 'info');
    } else {
      const updatedGallery = galleryImages.filter((img) => img !== targetUrl);
      onChange({
        mainImage,
        galleryImages: updatedGallery,
        videoUrl,
        additionalVideos
      });
      onShowToast?.('تم حذف الصورة من المعرض بنجاح', 'info');
    }
  };

  const handleMoveImage = (idx: number, direction: 'prev' | 'next') => {
    // Reorder gallery items
    const nonMain = allImages.filter(img => !img.isMain).map(img => img.url);
    const targetIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= nonMain.length) return;

    const temp = nonMain[idx];
    nonMain[idx] = nonMain[targetIdx];
    nonMain[targetIdx] = temp;

    onChange({
      mainImage,
      galleryImages: nonMain,
      videoUrl,
      additionalVideos
    });
  };

  // ==========================================
  // Video Handlers
  // ==========================================
  const handleMainVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      onShowToast?.('حجم الفيديو يتجاوز 30 ميجابايت، يرجى اختيار ملف فيديو أصغر حجماً', 'error');
      return;
    }

    setIsVideoUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onChange({
          mainImage,
          galleryImages,
          videoUrl: event.target.result,
          additionalVideos
        });
        onShowToast?.('تم رفع الفيديو التعريفي للفندق من جهازك بنجاح 🎬', 'success');
      }
      setIsVideoUploading(false);
    };
    reader.onerror = () => {
      setIsVideoUploading(false);
      onShowToast?.('حدث خطأ أثناء قراءة ملف الفيديو', 'error');
    };
    reader.readAsDataURL(file);

    if (mainVideoFileInputRef.current) mainVideoFileInputRef.current.value = '';
  };

  const handleTourVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      onShowToast?.('حجم الفيديو يتجاوز 30 ميجابايت، يرجى اختيار ملف فيديو أصغر حجماً', 'error');
      return;
    }

    setIsVideoUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setVideoForm((prev) => ({ ...prev, videoUrl: event.target!.result as string }));
        onShowToast?.('تم رفع مقطع جولة الفيديو من جهازك بنجاح', 'success');
      }
      setIsVideoUploading(false);
    };
    reader.onerror = () => {
      setIsVideoUploading(false);
      onShowToast?.('حدث خطأ أثناء قراءة ملف الفيديو', 'error');
    };
    reader.readAsDataURL(file);

    if (tourVideoFileInputRef.current) tourVideoFileInputRef.current.value = '';
  };

  const handleOpenAddVideo = () => {
    setEditingVideoId(null);
    setVideoForm({
      id: 'vid_' + Date.now(),
      title: '',
      thumbnail: mainImage || '',
      videoUrl: ''
    });
    setIsVideoModalOpen(true);
  };

  const handleOpenEditVideo = (item: AdditionalVideoItem) => {
    setEditingVideoId(item.id);
    setVideoForm({ ...item });
    setIsVideoModalOpen(true);
  };

  const handleSaveVideoItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.title.trim() || !videoForm.videoUrl.trim()) {
      onShowToast?.('يرجى كتابة عنوان الجولة ورابط الفيديو', 'error');
      return;
    }

    let updated: AdditionalVideoItem[];
    if (editingVideoId) {
      updated = additionalVideos.map((v) => (v.id === editingVideoId ? videoForm : v));
    } else {
      updated = [...additionalVideos, { ...videoForm, id: 'vid_' + Date.now() }];
    }

    onChange({
      mainImage,
      galleryImages,
      videoUrl,
      additionalVideos: updated
    });

    setIsVideoModalOpen(false);
    onShowToast?.('تم حفظ جولة الفيديو بنجاح', 'success');
  };

  const handleDeleteVideoItem = (id: string) => {
    const updated = additionalVideos.filter((v) => v.id !== id);
    onChange({
      mainImage,
      galleryImages,
      videoUrl,
      additionalVideos: updated
    });
    onShowToast?.('تم حذف جولة الفيديو بنجاح', 'info');
  };

  const handleUploadVideoThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const optimized = await optimizeImageFile(file, {
          maxWidth: 800,
          maxHeight: 500,
          forcePng: isPng
        });
        setVideoForm((prev) => ({ ...prev, thumbnail: optimized }));
      } catch (err) {
        console.warn('Failed to optimize thumbnail:', err);
      }
    }
  };

  return (
    <div id="hotel-media-album-manager" className="space-y-6">
      {/* Top Media Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'photos'
                ? 'bg-[#C9A24B] text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>ألبوم الصور ({allImages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'videos'
                ? 'bg-[#C9A24B] text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>ألبوم الفيديوهات ({(videoUrl ? 1 : 0) + additionalVideos.length})</span>
          </button>
        </div>

        <span className="text-[11px] text-stone-500 hidden sm:inline">
          تحكم كامل في رفع وتعيين الصور الرئيسية وحذفها
        </span>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PHOTOS ALBUM */}
      {/* ========================================================= */}
      {activeTab === 'photos' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action Bar: Upload from Device & Add URL */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Device File Upload Button (Supports Multiple) */}
              <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all">
                <Upload className="w-4 h-4" />
                <span>رفع صور (PNG، JPG، WebP - تحديد متعدد)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, .png, .jpg, .jpeg, .webp, image/*"
                  multiple
                  onChange={handleMultipleFilesUpload}
                  className="hidden"
                />
              </label>

              {/* Add by URL toggle */}
              <button
                type="button"
                onClick={() => setShowAddUrlInput(!showAddUrlInput)}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 text-[#B38A34]" />
                <span>إضافة رابط صورة بالـ URL</span>
              </button>
            </div>

            <div className="text-xs text-stone-500 font-medium">
              ⭐ انقر على زر النجمة لأي صورة لتعيينها كصورة رئيسية للغلاف.
            </div>
          </div>

          {/* Add URL Form Input (Conditional) */}
          {showAddUrlInput && (
            <form onSubmit={handleAddImageUrl} className="p-4 rounded-2xl bg-white border border-[#C9A24B]/40 shadow-xs flex gap-2 animate-scaleUp">
              <input
                type="url"
                required
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... أو رابط الصورة المباشر"
                className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold"
              >
                إضافة للألبوم
              </button>
              <button
                type="button"
                onClick={() => setShowAddUrlInput(false)}
                className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold"
              >
                إلغاء
              </button>
            </form>
          )}

          {isUploading && (
            <div className="p-3 text-center rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 animate-pulse">
              جاري معالجة ورفع الصور المحددة...
            </div>
          )}

          {/* Images Grid */}
          {allImages.length === 0 ? (
            <div className="py-12 text-center rounded-3xl border-2 border-dashed border-stone-300 p-8">
              <ImageIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h4 className="font-cairo font-bold text-base text-stone-700 mb-1">
                لا توجد صور في ألبوم هذا الفندق حتى الآن
              </h4>
              <p className="text-xs text-stone-500 mb-4">
                قم برفع صور الفندق والغرف والمرافق من جهازك أو إضافة روابط مباشرة.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-[#C9A24B] text-white text-xs font-bold shadow-sm"
              >
                اختر صوراً من جهازك
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allImages.map((img, idx) => {
                return (
                  <div
                    key={idx}
                    className={`group relative rounded-2xl overflow-hidden border-2 transition-all bg-stone-100 shadow-sm flex flex-col ${
                      img.isMain
                        ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/30'
                        : 'border-stone-200 hover:border-[#C9A24B]/50'
                    }`}
                  >
                    {/* Image Box */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
                      <img
                        src={img.url}
                        alt={`صورة ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />

                      {/* Primary Badge */}
                      {img.isMain && (
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-[#C9A24B] text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span>الصورة الرئيسية</span>
                        </div>
                      )}

                      {/* Hover Overlay with Action Buttons */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        {!img.isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetAsMainImage(img.url)}
                            className="p-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white shadow-md transition-transform hover:scale-110"
                            title="تعيين كصورة رئيسية للفندق"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.url)}
                          className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md transition-transform hover:scale-110"
                          title="حذف هذه الصورة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Info & Make Primary Button */}
                    <div className="p-2.5 bg-white flex items-center justify-between gap-1 border-t border-stone-100 text-[11px]">
                      {img.isMain ? (
                        <span className="text-[#B38A34] font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>صورة الغلاف</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetAsMainImage(img.url)}
                          className="text-stone-600 hover:text-[#B38A34] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Star className="w-3 h-3 text-[#C9A24B]" />
                          <span>اجعلها رئيسية</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.url)}
                        className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: VIDEOS ALBUM */}
      {/* ========================================================= */}
      {activeTab === 'videos' && (
        <div className="space-y-8 animate-fadeIn">
          {/* 1. Main Promotional Video Section */}
          <div className="p-5 rounded-3xl bg-stone-50 border border-stone-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-cairo font-bold text-base text-stone-900 flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#B38A34]" />
                  <span>الفيديو التعريفي الرئيسي للفندق</span>
                </h4>
                <p className="text-xs text-stone-500">
                  يمكنك رفع مقطع الفيديو مباشرة من جهازك (MP4، WebM) أو وضع رابط خارجي.
                </p>
              </div>

              {videoUrl && (
                <button
                  type="button"
                  onClick={() => onChange({ mainImage, galleryImages, videoUrl: '', additionalVideos })}
                  className="text-xs text-red-600 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إزالة الفيديو الرئيسي</span>
                </button>
              )}
            </div>

            {/* Video Upload from Device & Link Input */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Upload Video From Device Button */}
                <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>رفع فيديو الفندق من جهازك (MP4 / WebM)</span>
                  <input
                    ref={mainVideoFileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                    onChange={handleMainVideoUpload}
                    className="hidden"
                  />
                </label>

                <span className="text-[11px] text-stone-500">
                  أو كتابة رابط يوتيوب أو رابط فيديو مباشر بالأسفل
                </span>
              </div>

              <div>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => onChange({ mainImage, galleryImages, videoUrl: e.target.value, additionalVideos })}
                  placeholder="https://www.youtube.com/watch?v=... أو ارفع ملف فيديو من جهازك"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] dir-ltr text-left"
                />
              </div>

              {isVideoUploading && (
                <div className="p-3 text-center rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 animate-pulse">
                  جاري معالجة ورفع ملف الفيديو من جهازك... يرجى الانتظار
                </div>
              )}
            </div>

            {videoUrl && (
              <div className="mt-3 aspect-video max-w-md rounded-2xl overflow-hidden border border-stone-300 bg-stone-900 shadow-sm">
                <SafeVideoPlayer
                  url={videoUrl}
                  poster={mainImage}
                  controls={true}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* 2. Additional Suite & Room Tours Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-cairo font-bold text-base text-stone-900 flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#B38A34]" />
                  <span>جولات الأجنحة والغرف الإضافية ({additionalVideos.length})</span>
                </h4>
                <p className="text-xs text-stone-500">
                  مقاطع فيديو فرعية تبرز أجنحة معينة، المطاعم، أو مصليات وإطلالات الفندق.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddVideo}
                className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة جولة فيديو</span>
              </button>
            </div>

            {additionalVideos.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-500">
                لا توجد مقاطع جولات إضافية بعد. يمكنك إضافة جولات للأجنحة الملكية أو بوفيه الإفطار برفع مقاطعها من جهازك.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {additionalVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-[#C9A24B]/40 transition-all shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                      <img
                        src={vid.thumbnail || mainImage}
                        alt={vid.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-[#C9A24B] text-white flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 fill-current translate-x-[-1px]" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-cairo font-bold text-sm text-stone-900 line-clamp-1">
                        {vid.title}
                      </h5>
                      <span className="text-[11px] text-stone-400 font-mono line-clamp-1 dir-ltr text-left">
                        {vid.videoUrl.startsWith('data:') ? 'مقطع فيديو مرفوع من الجهاز' : vid.videoUrl}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEditVideo(vid)}
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVideoItem(vid.id)}
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-500 hover:text-white text-stone-700 transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Modal Form */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-lg w-full shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
              <h4 className="font-cairo font-bold text-base text-stone-900">
                {editingVideoId ? 'تعديل جولة الفيديو' : 'إضافة جولة فيديو جديدة'}
              </h4>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideoItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">عنوان الجولة / المقطع: *</label>
                <input
                  type="text"
                  required
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  placeholder="مثال: جولة في الجناح الملكي المطل على الكعبة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700 block">ملف الفيديو: *</label>
                  <label className="cursor-pointer text-[11px] font-semibold text-[#B38A34] hover:underline flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>رفع فيديو من الجهاز</span>
                    <input
                      ref={tourVideoFileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                      onChange={handleTourVideoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={videoForm.videoUrl}
                  onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                  placeholder="https://... رابط الفيديو أو اضغط رفع فيديو من الجهاز"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] dir-ltr text-left"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700 block">صورة غلاف الفيديو:</label>
                  <label className="cursor-pointer text-[11px] font-semibold text-[#B38A34] hover:underline flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>رفع غلاف من الجهاز</span>
                    <input
                      ref={videoThumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadVideoThumbnail}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={videoForm.thumbnail}
                  onChange={(e) => setVideoForm({ ...videoForm, thumbnail: e.target.value })}
                  placeholder="https://... رابط صورة الغلاف (اختياري)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] dir-ltr text-left"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  حفظ جولة الفيديو
                </button>
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
