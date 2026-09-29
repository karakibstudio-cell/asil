import React, { useState } from 'react';
import { HeroSlide, SiteSettings, ActivePage } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  Image as ImageIcon, 
  Building2, 
  Check, 
  X, 
  RotateCcw,
  Eye,
  EyeOff,
  Video,
  Film,
  Play,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { Lightbox, LightboxMediaItem } from './Lightbox';
import { SafeVideoPlayer } from './SafeVideoPlayer';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { uploadMediaToSupabase } from '../services/supabase';

const sampleVideos = [
  {
    title: 'فيديو تجريبي للكعبة المشرفة',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-mecca-kaaba-at-night-41584-large.mp4',
    poster: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa'
  }
];

// Helper to extract a crisp video thumbnail on the fly
function extractVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;
      video.onloadeddata = () => {
        video.currentTime = Math.min(1, (video.duration || 2) / 2);
      };
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth || 640, 800);
          canvas.height = Math.min(video.videoHeight || 360, 450);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumb = canvas.toDataURL('image/jpeg', 0.8);
            URL.revokeObjectURL(url);
            resolve(thumb);
            return;
          }
        } catch {}
        URL.revokeObjectURL(url);
        resolve('');
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
    } catch {
      resolve('');
    }
  });
}

interface AdminHeroSlidesManagerProps {
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (settings: SiteSettings) => Promise<void>;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminHeroSlidesManager: React.FC<AdminHeroSlidesManagerProps> = ({
  siteSettings,
  onUpdateSiteSettings,
  onShowToast
}) => {
  const [slides, setSlides] = useState<HeroSlide[]>(() => {
    if (siteSettings?.heroSlides && Array.isArray(siteSettings.heroSlides)) {
      return siteSettings.heroSlides;
    }
    return [];
  });

  // Keep slides state in sync when siteSettings loads asynchronously from Supabase
  React.useEffect(() => {
    if (siteSettings?.heroSlides && Array.isArray(siteSettings.heroSlides)) {
      setSlides(siteSettings.heroSlides);
    }
  }, [siteSettings?.heroSlides]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const lightboxMediaItems: LightboxMediaItem[] = slides.map((s) => {
    const isVid = s.mediaType === 'video' && Boolean(s.videoUrl?.trim());
    return {
      type: isVid ? ('video' as const) : ('image' as const),
      url: (isVid && s.videoUrl) ? s.videoUrl : (s.imageUrl || s.videoThumbnail || ''),
      title: s.title,
      thumbnail: s.videoThumbnail || s.imageUrl
    };
  });

  const openSlideLightbox = (idx: number) => {
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };

  const [slideForm, setSlideForm] = useState<HeroSlide>({
    id: '',
    mediaType: 'image',
    imageUrl: '',
    videoUrl: '',
    videoThumbnail: '',
    badge: '',
    title: '',
    subtitle: '',
    showBadge: true,
    showTitle: true,
    showSubtitle: true,
    showPrimaryButton: true,
    primaryButtonText: 'استعرض الفنادق المتاحة',
    primaryButtonAction: 'hotels',
    showSecondaryButton: true,
    secondaryButtonText: 'تواصل مع مستشار الحجز',
    secondaryButtonAction: 'contact',
    order: 0,
    isActive: true
  });

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        onShowToast('حجم الصورة كبير، يرجى اختيار ملف صورة أقل من 8 ميجابايت', 'error');
        return;
      }
      try {
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const optimized = await optimizeImageFile(file, {
          maxWidth: 1600,
          maxHeight: 1000,
          forcePng: isPng
        });
        setSlideForm(prev => ({ ...prev, imageUrl: optimized }));
        onShowToast('تم تحميل وضغط صورة الخلفية بنجاح', 'info');
      } catch (err) {
        console.error('Error optimizing hero slide image:', err);
        onShowToast('حدث خطأ أثناء معالجة ملف الصورة', 'error');
      }
      e.target.value = '';
    }
  };

  const handleSlideVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 80 * 1024 * 1024) {
      onShowToast('حجم ملف الفيديو يتجاوز 80 ميجابايت، يرجى اختيار مقطع فيديو أصغر حجماً.', 'error');
      return;
    }

    setIsUploadingVideo(true);
    onShowToast('جاري معالجة ورفع ملف الفيديو إلى سحابة Supabase التخزينية المباشرة...', 'info');

    try {
      // 1. Generate video thumbnail poster automatically
      const generatedPoster = await extractVideoThumbnail(file);

      // 2. Upload file to Supabase Storage bucket 'prestige-media'
      const uploadRes = await uploadMediaToSupabase(file, 'videos');

      if (uploadRes.success && uploadRes.url) {
        setSlideForm(prev => ({
          ...prev,
          mediaType: 'video',
          videoUrl: uploadRes.url,
          imageUrl: prev.imageUrl || generatedPoster
        }));
        onShowToast('تم رفع وتثبيت الفيديو بنجاح في Supabase Storage ✓ سيعمل فورياً وبشكل دائم لجميع الزوار.', 'success');
        setIsUploadingVideo(false);
        e.target.value = '';
        return;
      }

      // 3. Fallback if storage bucket is not configured yet and file size is <= 6MB
      if (file.size <= 6 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result === 'string') {
            setSlideForm(prev => ({
              ...prev,
              mediaType: 'video',
              videoUrl: event.target!.result as string,
              imageUrl: prev.imageUrl || generatedPoster
            }));
            onShowToast('تم حفظ الفيديو محلياً. لتفعيل الرفع السحابي الدائم، يرجى تنفيذ سكريبت supabase_update_storage.sql في Supabase.', 'info');
          }
          setIsUploadingVideo(false);
        };
        reader.onerror = () => {
          onShowToast('حدث خطأ أثناء قراءة ملف الفيديو', 'error');
          setIsUploadingVideo(false);
        };
        reader.readAsDataURL(file);
      } else {
        onShowToast(`فشل الرفع السحابي: ${uploadRes.error || 'يرجى تشغيل سكريبت إنشاء حاوية التخزين في Supabase'}. يمكنك استخدام رابط YouTube أو MP4 مباشر.`, 'error');
        setIsUploadingVideo(false);
      }
    } catch (err) {
      console.error('Video upload error:', err);
      onShowToast('حدث خطأ أثناء رفع الفيديو', 'error');
      setIsUploadingVideo(false);
    }
    e.target.value = '';
  };

  const handleOpenAddModal = () => {
    setEditingSlideId(null);
    setSlideForm({
      id: 'slide_' + Date.now(),
      mediaType: 'image',
      imageUrl: '',
      videoUrl: '',
      videoThumbnail: '',
      badge: 'الضيافة الملكية المميزة',
      title: 'عنوان جديد للسلايدر الرئيسي',
      subtitle: 'وصف تسويقي راقٍ يبرز جودة وفخامة الإقامة وقربها من الحرمين الشريفين.',
      showBadge: true,
      showTitle: true,
      showSubtitle: true,
      showPrimaryButton: true,
      primaryButtonText: 'استعرض الفنادق المتاحة',
      primaryButtonAction: 'hotels',
      showSecondaryButton: true,
      secondaryButtonText: 'تواصل معنا',
      secondaryButtonAction: 'contact',
      order: slides.length,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slide: HeroSlide) => {
    setEditingSlideId(slide.id);
    const hasBlob = Boolean(slide.videoUrl?.startsWith('blob:'));
    setSlideForm({
      ...slide,
      mediaType: slide.mediaType || (slide.videoUrl ? 'video' : 'image'),
      videoUrl: hasBlob ? '' : (slide.videoUrl || ''),
      showBadge: slide.showBadge !== false,
      showTitle: slide.showTitle !== false,
      showSubtitle: slide.showSubtitle !== false,
      showPrimaryButton: slide.showPrimaryButton !== false,
      showSecondaryButton: slide.showSecondaryButton !== false
    });
    if (hasBlob) {
      onShowToast('تم تنبيهك: الرابط السابق كان مؤقتاً (blob). يرجى اختيار أحد نماذج الفيديو الدائمة أو رفع الفيديو.', 'info');
    }
    setIsModalOpen(true);
  };

  const saveSlidesList = async (updated: HeroSlide[]) => {
    setSaving(true);
    setSlides(updated);
    try {
      const newSettings: SiteSettings = {
        ...siteSettings,
        heroSlides: updated,
        updatedAt: Date.now()
      };
      await onUpdateSiteSettings(newSettings);
      onShowToast('تم حفظ وتحديث شرائح السلايدر بنجاح', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء حفظ السلايدر', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSlideForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate media
    if (slideForm.mediaType === 'video' && !slideForm.videoUrl?.trim()) {
      onShowToast('يرجى تحديد رابط أو ملف الفيديو الترحيبي', 'error');
      return;
    }
    if (slideForm.mediaType === 'video' && slideForm.videoUrl?.trim().startsWith('blob:')) {
      onShowToast('روابط blob المؤقتة لا تعمل بعد تحديث الصفحة. يرجى وضع رابط فيديو مباشر (MP4) أو رابط YouTube.', 'error');
      return;
    }
    if (slideForm.mediaType === 'image' && !slideForm.imageUrl?.trim()) {
      onShowToast('يرجى تحديد رابط أو ملف الصورة الخلفية', 'error');
      return;
    }

    const isVid = slideForm.mediaType === 'video';
    const cleanedSlide: HeroSlide = {
      ...slideForm,
      mediaType: isVid ? 'video' : 'image',
      videoUrl: isVid ? (slideForm.videoUrl || '').trim() : '',
      videoThumbnail: isVid ? (slideForm.videoThumbnail || slideForm.imageUrl || '').trim() : '',
      imageUrl: (slideForm.imageUrl || slideForm.videoThumbnail || '').trim()
    };

    let updated: HeroSlide[];
    if (editingSlideId) {
      updated = slides.map(s => s.id === editingSlideId ? cleanedSlide : s);
    } else {
      updated = [...slides, { ...cleanedSlide, order: slides.length }];
    }

    setIsModalOpen(false);
    await saveSlidesList(updated);
  };

  const handleToggleActive = async (id: string) => {
    const updated = slides.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    await saveSlidesList(updated);
  };

  const handleDeleteSlide = async (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه الشريحة نهائياً؟')) {
      const updated = slides.filter(s => s.id !== id);
      await saveSlidesList(updated);
      onShowToast('تم حذف الشريحة بنجاح', 'success');
    }
  };

  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    const listCopy = [...slides];
    const item = listCopy.splice(index, 1)[0];
    listCopy.splice(targetIdx, 0, item);

    const reordered = listCopy.map((s, idx) => ({ ...s, order: idx }));
    await saveSlidesList(reordered);
  };

  const handleClearAllSlides = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح كافة الشرائح والاعتماد على الشاشة الترحيبية للعلامة التجارية؟')) {
      await saveSlidesList([]);
      onShowToast('تم مسح جميع الشرائح وحفظ الإعدادات في قاعدة البيانات', 'info');
    }
  };

  return (
    <div id="admin-hero-slides-manager" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>إدارة شرائح الواجهة والهيرو</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-cairo font-bold text-stone-900">
            تخصيص الفيديوهات، الصور، النصوص، وأزرار الصفحة الترحيبية
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            يمكنك إضافة مقاطع فيديو أو صور بدقة عالية، مع إمكانية إخفاء النصوص والأزرار بالكامل لعرض جمالي نقي.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {slides.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllSlides}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200"
              title="مسح جميع الشرائح"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>مسح جميع الشرائح</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-md shadow-[#C9A24B]/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة شريحة جديدة</span>
          </button>
        </div>
      </div>

      {/* Slides List */}
      <div className="space-y-4">
        {slides.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#C9A24B]/15 text-[#B38A34] mx-auto flex items-center justify-center">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-cairo font-bold text-lg text-stone-900">
                لا توجد شرائح مضافة حالياً في قاعدة البيانات
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                يتم عرض الشاشة الترحيبية الملكية للعلامة التجارية تلقائياً. يمكنك إضافة شريحة مخصصة تحتوي على فيديو أو صورة بنصوص وأزرار تفاعلية في أي وقت.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-md shadow-[#C9A24B]/20 inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أول شريحة الآن</span>
            </button>
          </div>
        ) : (
          slides.map((slide, idx) => {
            const isVid = slide.mediaType === 'video' && Boolean(slide.videoUrl?.trim());
            const hasText = (slide.showTitle !== false && slide.title) || (slide.showSubtitle !== false && slide.subtitle);
            const hasBtns = (slide.showPrimaryButton !== false && slide.primaryButtonText) || (slide.showSecondaryButton !== false && slide.secondaryButtonText);

            return (
              <div
                key={slide.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
                  slide.isActive ? 'border-stone-200 hover:border-[#C9A24B]' : 'border-dashed border-stone-300 opacity-60 bg-stone-50'
                }`}
              >
              {/* Slide Preview & Info */}
              <div className="flex items-start sm:items-center gap-4 flex-1">
                <div 
                  onClick={() => openSlideLightbox(idx)}
                  className="group relative w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 cursor-pointer hover:border-[#C9A24B] hover:shadow-md transition-all"
                  title="انقر لتكبير ومعاينة الشريحة"
                >
                  {isVid ? (
                    <div className="w-full h-full relative bg-black flex items-center justify-center">
                      <SafeVideoPlayer
                        url={slide.videoUrl}
                        poster={slide.imageUrl || slide.videoThumbnail}
                        className="w-full h-full object-cover"
                        autoPlay={false}
                        muted={true}
                        controls={false}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={slide.imageUrl}
                      alt={slide.title || 'صورة الشريحة'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] text-white font-mono leading-none">
                    #{idx + 1}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isVid ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold flex items-center gap-1 border border-purple-200">
                        <Film className="w-3 h-3" />
                        <span>فيديو ترحيبي</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1 border border-blue-200">
                        <ImageIcon className="w-3 h-3" />
                        <span>صورة ثابتة</span>
                      </span>
                    )}

                    {slide.badge && slide.showBadge !== false && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-[10px] font-bold border border-[#C9A24B]/30">
                        {slide.badge}
                      </span>
                    )}

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      slide.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {slide.isActive ? 'نشطة في الواجهة' : 'معطلة'}
                    </span>
                  </div>

                  <h4 className="font-cairo font-bold text-sm sm:text-base text-stone-900">
                    {slide.showTitle !== false && slide.title ? slide.title : <span className="text-stone-400 italic">بدون عنوان نصي (خلفية فقط)</span>}
                  </h4>

                  {slide.showSubtitle !== false && slide.subtitle && (
                    <p className="text-xs text-stone-500 line-clamp-2 max-w-xl">
                      {slide.subtitle}
                    </p>
                  )}

                  {/* Badges for Elements Display */}
                  <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${hasText ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                      <span>{hasText ? 'النصوص مفعلة' : 'نصوص مخفية'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${hasBtns ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                      <span>{hasBtns ? 'الأزرار مفعلة' : 'أزرار مخفية'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions: Reorder, Active Toggle, Edit, Delete */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {/* Move Up */}
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveSlide(idx, 'up')}
                  className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-30 text-stone-700 transition-colors cursor-pointer"
                  title="تحريك لأعلى"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  disabled={idx === slides.length - 1}
                  onClick={() => handleMoveSlide(idx, 'down')}
                  className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-30 text-stone-700 transition-colors cursor-pointer"
                  title="تحريك لأسفل"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Toggle Active */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(slide.id)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    slide.isActive 
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' 
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-500'
                  }`}
                  title={slide.isActive ? 'إخفاء الشريحة' : 'تفعيل الشريحة'}
                >
                  {slide.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(slide)}
                  className="p-2 rounded-xl bg-[#C9A24B]/15 hover:bg-[#C9A24B] text-[#B38A34] hover:text-white transition-colors cursor-pointer"
                  title="تعديل الشريحة"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteSlide(slide.id)}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white transition-colors cursor-pointer"
                  title="حذف الشريحة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>

      {/* Slide Add/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-auto animate-scaleUp">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#B38A34]" />
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  {editingSlideId ? 'تعديل شريحة السلايدر' : 'إضافة شريحة جديدة للواجهة'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlideForm} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* ========================================================= */}
              {/* 1. MEDIA TYPE SELECTOR: Image vs Video */}
              {/* ========================================================= */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-800 block">
                  نوع الوسائط المعروضة في الشريحة:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSlideForm(prev => ({
                      ...prev,
                      mediaType: 'image',
                      videoUrl: '', // Reset video url to prevent interference
                      imageUrl: prev.imageUrl || prev.videoThumbnail || ''
                    }))}
                    className={`p-3.5 rounded-2xl border-2 font-cairo font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      slideForm.mediaType === 'image' || !slideForm.mediaType
                        ? 'border-[#C9A24B] bg-[#C9A24B]/10 text-[#B38A34] shadow-sm'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>صورة خلفية فاخرة (Image)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSlideForm(prev => ({
                      ...prev,
                      mediaType: 'video',
                      videoThumbnail: prev.imageUrl || prev.videoThumbnail || ''
                    }))}
                    className={`p-3.5 rounded-2xl border-2 font-cairo font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      slideForm.mediaType === 'video'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>مقطع فيديو ترحيبي (Video)</span>
                  </button>
                </div>
              </div>

              {/* MEDIA INPUT: IMAGE */}
              {(slideForm.mediaType === 'image' || !slideForm.mediaType) && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700 block">
                      رابط صورة الخلفية: *
                    </label>
                    <label className="cursor-pointer text-[11px] font-bold text-[#B38A34] hover:text-[#C9A24B] flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs transition-colors">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>رفع صورة (PNG, JPG, WebP)</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp, .png, .jpg, .jpeg, .webp, image/*"
                        onChange={handleSlideImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    required
                    value={slideForm.imageUrl || ''}
                    onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
                    placeholder="https://... رابط مباشر للصورة"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] dir-ltr text-left"
                  />
                </div>
              )}

              {/* MEDIA INPUT: VIDEO */}
              {slideForm.mediaType === 'video' && (
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700 block">
                      رابط مقطع الفيديو (Direct MP4 أو YouTube أو رابط سحابي): *
                    </label>
                    <label className={`cursor-pointer text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs transition-all ${isUploadingVideo ? 'opacity-60 pointer-events-none' : ''}`}>
                      {isUploadingVideo ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          <span>جاري الرفع لـ Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Film className="w-3.5 h-3.5" />
                          <span>رفع فيديو من جهازك</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="video/mp4, video/webm, video/quicktime, video/*"
                        onChange={handleSlideVideoUpload}
                        disabled={isUploadingVideo}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Warning banner for temporary blob URLs */}
                  {slideForm.videoUrl?.startsWith('blob:') && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚠️</span>
                        <div>
                          <p className="font-bold">الرابط الحالي مؤقت (blob) ولا يعمل للزوار بعد تحديث الصفحة</p>
                          <p className="text-[11px] text-amber-700">يرجى الضغط على زر "رفع فيديو من جهازك" لرفعه إلى سحابة Supabase، أو اختيار أحد النماذج المباشرة.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSlideForm(prev => ({
                          ...prev,
                          videoUrl: sampleVideos[0].url,
                          imageUrl: sampleVideos[0].poster
                        }))}
                        className="px-3 py-1.5 rounded-lg bg-[#C9A24B] hover:bg-[#b08b38] text-stone-950 font-bold text-[11px] shrink-0 transition-colors cursor-pointer shadow-sm"
                      >
                        تجربة نموذج سريع
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    required
                    value={slideForm.videoUrl || ''}
                    onChange={(e) => setSlideForm({ ...slideForm, videoUrl: e.target.value })}
                    placeholder="https://... رابط فيديو MP4 مباشر أو YouTube"
                    className="w-full px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-purple-500 dir-ltr text-left"
                  />

                  {/* Optional Poster / Thumbnail */}
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      صورة غلاف احتياطية للفيديو (Poster Image):
                    </label>
                    <input
                      type="text"
                      value={slideForm.imageUrl || ''}
                      onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
                      placeholder="https://... رابط صورة الغلاف أثناء تحميل الفيديو"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none dir-ltr text-left"
                    />
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 2. LIVE PREVIEW CARD */}
              {/* ========================================================= */}
              <div className="rounded-2xl overflow-hidden border border-stone-200 relative aspect-[16/8] bg-black shadow-inner">
                {slideForm.mediaType === 'video' ? (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-purple-600/90 text-white text-[10px] font-bold z-10 flex items-center gap-1 shadow-sm">
                    <Film className="w-3 h-3" />
                    <span>معاينة مشغل الفيديو الترحيبي</span>
                  </span>
                ) : (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[10px] font-bold z-10 flex items-center gap-1 shadow-sm">
                    <ImageIcon className="w-3 h-3" />
                    <span>معاينة صورة الخلفية</span>
                  </span>
                )}

                {slideForm.mediaType === 'video' && slideForm.videoUrl ? (
                  <SafeVideoPlayer
                    url={slideForm.videoUrl}
                    poster={slideForm.imageUrl}
                    className="w-full h-full object-cover"
                    autoPlay={true}
                    muted={true}
                    controls={false}
                  />
                ) : slideForm.imageUrl ? (
                  <img src={slideForm.imageUrl} alt="معاينة" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-500 text-xs">
                    يرجى تحديد صورة أو فيديو للمعاينة
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4 text-white pointer-events-none">
                  {slideForm.showBadge !== false && slideForm.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C9A24B]/30 border border-[#C9A24B] text-[#DFBE72] mb-1 font-bold">
                      {slideForm.badge}
                    </span>
                  )}
                  {slideForm.showTitle !== false && slideForm.title && (
                    <h4 className="text-sm font-bold font-cairo line-clamp-1 mb-1">{slideForm.title}</h4>
                  )}
                  {slideForm.showSubtitle !== false && slideForm.subtitle && (
                    <p className="text-[10px] text-stone-200 line-clamp-1 max-w-sm mb-2">{slideForm.subtitle}</p>
                  )}
                  <div className="flex items-center gap-1.5">
                    {slideForm.showPrimaryButton !== false && slideForm.primaryButtonText && (
                      <span className="px-2.5 py-1 rounded-full bg-[#C9A24B] text-white text-[9px] font-bold">
                        {slideForm.primaryButtonText}
                      </span>
                    )}
                    {slideForm.showSecondaryButton !== false && slideForm.secondaryButtonText && (
                      <span className="px-2.5 py-1 rounded-full bg-white text-stone-900 text-[9px] font-bold">
                        {slideForm.secondaryButtonText}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 3. TEXTS & BADGE (WITH SHOW/HIDE TOGGLES) */}
              {/* ========================================================= */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <h4 className="font-cairo font-bold text-xs text-stone-800">
                    النصوص والعناوين (يمكنك إخفاؤها لعرض خلفية نقية):
                  </h4>
                </div>

                {/* Badge Toggle & Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">الشارة العلوية (Badge):</label>
                    <label className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slideForm.showBadge !== false}
                        onChange={(e) => setSlideForm({ ...slideForm, showBadge: e.target.checked })}
                        className="w-4 h-4 text-[#C9A24B] rounded focus:ring-[#C9A24B]"
                      />
                      <span>إظهار في الشريحة</span>
                    </label>
                  </div>
                  {slideForm.showBadge !== false && (
                    <input
                      type="text"
                      value={slideForm.badge || ''}
                      onChange={(e) => setSlideForm({ ...slideForm, badge: e.target.value })}
                      placeholder="مثال: الضيافة الملكية الأقرب للحرم"
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                    />
                  )}
                </div>

                {/* Title Toggle & Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">العنوان الرئيسي الكبير:</label>
                    <label className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slideForm.showTitle !== false}
                        onChange={(e) => setSlideForm({ ...slideForm, showTitle: e.target.checked })}
                        className="w-4 h-4 text-[#C9A24B] rounded focus:ring-[#C9A24B]"
                      />
                      <span>إظهار في الشريحة</span>
                    </label>
                  </div>
                  {slideForm.showTitle !== false && (
                    <input
                      type="text"
                      value={slideForm.title || ''}
                      onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                      placeholder="مثال: تسكين في أرقى فنادق مكة المكرمة"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                    />
                  )}
                </div>

                {/* Subtitle Toggle & Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">الوصف التوضيحي:</label>
                    <label className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slideForm.showSubtitle !== false}
                        onChange={(e) => setSlideForm({ ...slideForm, showSubtitle: e.target.checked })}
                        className="w-4 h-4 text-[#C9A24B] rounded focus:ring-[#C9A24B]"
                      />
                      <span>إظهار في الشريحة</span>
                    </label>
                  </div>
                  {slideForm.showSubtitle !== false && (
                    <textarea
                      rows={2}
                      value={slideForm.subtitle || ''}
                      onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                      placeholder="اكتب وصفاً تسويقياً جذاباً..."
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                    />
                  )}
                </div>
              </div>

              {/* ========================================================= */}
              {/* 4. BUTTONS (WITH SHOW/HIDE TOGGLES) */}
              {/* ========================================================= */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <h4 className="font-cairo font-bold text-xs text-stone-800">
                    أزرار التفاعل (Call to Action):
                  </h4>
                </div>

                {/* Primary Button */}
                <div className="space-y-2 p-3 rounded-xl bg-white border border-stone-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#B38A34]">الزر الذهبي الرئيسي:</label>
                    <label className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slideForm.showPrimaryButton !== false}
                        onChange={(e) => setSlideForm({ ...slideForm, showPrimaryButton: e.target.checked })}
                        className="w-4 h-4 text-[#C9A24B] rounded focus:ring-[#C9A24B]"
                      />
                      <span>تفعيل الزر</span>
                    </label>
                  </div>

                  {slideForm.showPrimaryButton !== false && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <input
                          type="text"
                          value={slideForm.primaryButtonText || ''}
                          onChange={(e) => setSlideForm({ ...slideForm, primaryButtonText: e.target.value })}
                          placeholder="نص الزر (مثل: استعرض الفنادق)"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                        />
                      </div>
                      <div>
                        <select
                          value={slideForm.primaryButtonAction || 'hotels'}
                          onChange={(e) => setSlideForm({ ...slideForm, primaryButtonAction: e.target.value as any })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                        >
                          <option value="hotels">صفحة الفنادق (Hotels)</option>
                          <option value="offers">صفحة العروض (Offers)</option>
                          <option value="contact">صفحة تواصل معنا (Contact)</option>
                          <option value="about">صفحة من نحن (About)</option>
                          <option value="whatsapp">محادثة واتساب مباشرة</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Secondary Button */}
                <div className="space-y-2 p-3 rounded-xl bg-white border border-stone-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">الزر الثانوي الأبيض:</label>
                    <label className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slideForm.showSecondaryButton !== false}
                        onChange={(e) => setSlideForm({ ...slideForm, showSecondaryButton: e.target.checked })}
                        className="w-4 h-4 text-[#C9A24B] rounded focus:ring-[#C9A24B]"
                      />
                      <span>تفعيل الزر</span>
                    </label>
                  </div>

                  {slideForm.showSecondaryButton !== false && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <input
                          type="text"
                          value={slideForm.secondaryButtonText || ''}
                          onChange={(e) => setSlideForm({ ...slideForm, secondaryButtonText: e.target.value })}
                          placeholder="نص الزر (مثل: تواصل معنا)"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                        />
                      </div>
                      <div>
                        <select
                          value={slideForm.secondaryButtonAction || 'contact'}
                          onChange={(e) => setSlideForm({ ...slideForm, secondaryButtonAction: e.target.value as any })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                        >
                          <option value="contact">صفحة تواصل معنا (Contact)</option>
                          <option value="whatsapp">محادثة واتساب مباشرة</option>
                          <option value="hotels">صفحة الفنادق (Hotels)</option>
                          <option value="offers">صفحة العروض (Offers)</option>
                          <option value="about">صفحة من نحن (About)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-xs font-bold text-stone-800">تفعيل هذه الشريحة في الواجهة الرئيسية:</span>
                <input
                  type="checkbox"
                  checked={slideForm.isActive}
                  onChange={(e) => setSlideForm({ ...slideForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#C9A24B] rounded focus:ring-[#C9A24B]"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ الشريحة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox for Slides Preview */}
      {lightboxOpen && (
        <Lightbox
          mediaItems={lightboxMediaItems}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
