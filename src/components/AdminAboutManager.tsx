import React, { useState, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Upload, 
  Trash2, 
  Star, 
  Plus, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Image as ImageIcon, 
  ExternalLink,
  Award,
  Users,
  Check,
  Eye
} from 'lucide-react';
import { AboutPageSettings, SiteSettings, ValuePillar } from '../types';
import { Lightbox } from './Lightbox';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { PillarIcon, ICON_OPTIONS } from './PillarIcon';

export const DEFAULT_VALUE_PILLARS: ValuePillar[] = [
  {
    id: 'pillar_1',
    title: 'المصداقية المطلقة',
    titleEn: 'Absolute Integrity',
    description: 'ما تراه وتتفق عليه هو ما تجده تماماً، دون مفاجآت في المسافة أو مستوى الغرفة أو الخدمات المتفق عليها.',
    descriptionEn: 'What you see and agree upon is exactly what you receive, with no surprises in distances, room standards, or agreed services.',
    iconName: 'ShieldCheck',
    order: 1
  },
  {
    id: 'pillar_2',
    title: 'رعاية وتواجد ميداني',
    titleEn: 'On-Ground Field Support',
    description: 'فريقنا الميداني في مكة المكرمة والمدينة المنورة على أهبة الاستعداد على مدار الساعة لاستقبالكم وتلبية كافة متطلباتكم.',
    descriptionEn: 'Our field representatives in Makkah and Madinah are on standby 24/7 to welcome you and assist with all your requirements.',
    iconName: 'HeartHandshake',
    order: 2
  },
  {
    id: 'pillar_3',
    title: 'عقود مباشرة وأفضل الأسعار',
    titleEn: 'Direct Contracts & Best Rates',
    description: 'عقود موسمية وسنوية مباشرة مع كبرى فنادق الحرمين تتيح لنا تقديم أسعار حصرية ومنافسة تلبي كافة الميزانيات.',
    descriptionEn: 'Direct seasonal and annual contracts with premier Haramain hotels enable us to offer exclusive, competitive rates for all budgets.',
    iconName: 'Award',
    order: 3
  }
];

interface AdminAboutManagerProps {
  aboutUs?: AboutPageSettings;
  siteLogoUrl?: string;
  onUpdateAboutUs: (data: AboutPageSettings, updatedLogoUrl?: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminAboutManager: React.FC<AdminAboutManagerProps> = ({
  aboutUs = {} as AboutPageSettings,
  siteLogoUrl = '',
  onUpdateAboutUs,
  onShowToast
}) => {
  const [form, setForm] = useState<AboutPageSettings>({
    title: aboutUs.title || 'عن شركة برستيج لإدارة وتشغيل الفنادق',
    subtitle: aboutUs.subtitle || 'مسيرة ريادة واحترافية في إدارة وتشغيل الفنادق والضيافة الفاخرة لضيوف الرحمن وزوار مكة المكرمة والمدينة المنورة.',
    badge: aboutUs.badge || 'شرف خدمة ضيوف الرحمن',
    missionTitle: aboutUs.missionTitle || 'رسالتنا: التميز في إدارة وتشغيل الفنادق وخدمة الضيوف',
    missionText1: aboutUs.missionText1 || 'تأسست شركة برستيج لإدارة وتشغيل الفنادق انطلاقاً من رؤية متكاملة لرفع كفاءة تشغيل الأصول الفندقية وتقديم أرقى حلول الضيافة والتسكين لضيوف الرحمن وشركات السياحة في المدينتين المقدستين.',
    missionText2: aboutUs.missionText2 || 'بفضل خبراتنا الإدارية وكوادرنا التشغيلية المتخصصة في كبرى فنادق مكة المكرمة والمدينة المنورة، نضمن للمستثمرين والنزلاء أعلى معايير الجودة الفندقية وسرعة إجراءات التسكين.',
    visionTitle: aboutUs.visionTitle || 'رؤيتنا: الريادة في إدارة وتشغيل الفنادق والضيافة الروحانية',
    visionText: aboutUs.visionText || 'أن نكون الخيار الأول والأكثر ثقة للمستثمرين وضيوف الرحمن ووكالات العمرة عالمياً من خلال تقديم أرقى معايير الإدارة والتشغيل الفندقي.',
    yearsExperience: aboutUs.yearsExperience || '١٥+ عاماً',
    servedGuests: aboutUs.servedGuests || '١٢٠,٠٠٠+',
    officeTitle: aboutUs.officeTitle || 'المقر الرئيسي لشركة برستيج لإدارة وتشغيل الفنادق',
    officeCity: aboutUs.officeCity || 'مكة المكرمة',
    officeAddress: aboutUs.officeAddress || 'أبراج وقف الملك عبدالعزيز - مجمع أبراج البيت، طريق أجياد، مكة المكرمة',
    officeMapUrl: aboutUs.officeMapUrl || 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah',
    officePhone: aboutUs.officePhone || '+966501234567',
    officeWhatsApp: aboutUs.officeWhatsApp || '+966501234567',
    officeEmail: aboutUs.officeEmail || 'info@prestigehotels.sa',
    officeWorkingHours: aboutUs.officeWorkingHours || 'على مدار الساعة 24/7 لخدمة ضيوف الرحمن',
    licenseNumber: aboutUs.licenseNumber || '73104928',
    licenseAuthority: aboutUs.licenseAuthority || 'مرخصون من وزارة الحج والعمرة والهيئة السعودية للسياحة',
    showLicense: aboutUs.showLicense !== false,
    photos: Array.isArray(aboutUs.photos) ? aboutUs.photos : [],
    mainPhoto: aboutUs.mainPhoto || '',
    logoUrl: aboutUs.logoUrl || siteLogoUrl || '',
    valuePillars: aboutUs.valuePillars && aboutUs.valuePillars.length > 0 ? aboutUs.valuePillars : DEFAULT_VALUE_PILLARS
  });

  const [currentLogo, setCurrentLogo] = useState<string>(aboutUs.logoUrl || siteLogoUrl || '');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [showAddUrlInput, setShowAddUrlInput] = useState(false);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const allAdminImages = Array.from(
    new Set([currentLogo, form.mainPhoto, ...(form.photos || [])].filter(Boolean) as string[])
  );

  const openAdminLightbox = (imgUrl?: string) => {
    if (!imgUrl) return;
    const idx = allAdminImages.indexOf(imgUrl);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const photosFileInputRef = useRef<HTMLInputElement>(null);

  // Logo Upload Handlers (supports PNG transparency, JPG, WebP, SVG)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      onShowToast('حجم الشعار يتجاوز 8 ميجابايت، يرجى اختيار ملف أصغر', 'error');
      return;
    }

    try {
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      const logoData = await optimizeImageFile(file, {
        maxWidth: 512,
        maxHeight: 512,
        forcePng: isPng
      });
      setCurrentLogo(logoData);
      setForm((prev) => ({ ...prev, logoUrl: logoData }));
      onShowToast('تم رفع ومعالجة شعار الشركة الجديد بنجاح (مع الحفاظ على الشفافية)', 'success');
    } catch (err) {
      console.error('Error optimizing logo:', err);
      onShowToast('حدث خطأ أثناء معالجة الشعار', 'error');
    }
    if (logoFileInputRef.current) logoFileInputRef.current.value = '';
  };

  // Photos Multi-upload Handlers (supports PNG, JPG, WebP)
  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUploaded: string[] = [];

    const fileList = Array.from(files) as File[];

    for (const file of fileList) {
      if (file.size > 10 * 1024 * 1024) {
        onShowToast(`تم تخطي الملف "${file.name}" لتجاوز الحجم 10 ميجابايت`, 'error');
        continue;
      }

      try {
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const optimized = await optimizeImageFile(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          forcePng: isPng
        });
        newUploaded.push(optimized);
      } catch (err) {
        console.warn('Failed to process image:', file.name, err);
      }
    }

    if (newUploaded.length > 0) {
      finalizePhotos(newUploaded);
    }
    if (photosFileInputRef.current) photosFileInputRef.current.value = '';
  };

  const finalizePhotos = (newPics: string[]) => {
    if (newPics.length === 0) return;
    const current = form.photos || [];
    const updated = [...current, ...newPics];
    const mainPic = form.mainPhoto || updated[0] || '';
    setForm((prev) => ({ ...prev, photos: updated, mainPhoto: mainPic }));
    onShowToast(`تمت إضافة ${newPics.length} صورة لمقر وتفاصيل الشركة بنجاح`, 'success');
  };

  const handleAddPhotoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    const url = newPhotoUrl.trim();
    const current = form.photos || [];
    const updated = current.includes(url) ? current : [...current, url];
    const mainPic = form.mainPhoto || url;
    setForm((prev) => ({ ...prev, photos: updated, mainPhoto: mainPic }));
    setNewPhotoUrl('');
    setShowAddUrlInput(false);
    onShowToast('تمت إضافة رابط الصورة بنجاح', 'success');
  };

  const handleSetMainPhoto = (url: string) => {
    setForm((prev) => ({ ...prev, mainPhoto: url }));
    onShowToast('تم تعيين الصورة كصورة رئيسية لصفحة من نحن ⭐', 'success');
  };

  const handleDeletePhoto = (url: string) => {
    const updated = (form.photos || []).filter((p) => p !== url);
    const mainPic = form.mainPhoto === url ? (updated[0] || '') : form.mainPhoto;
    setForm((prev) => ({ ...prev, photos: updated, mainPhoto: mainPic }));
    onShowToast('تم حذف الصورة بنجاح', 'info');
  };

  // Pillar Management Handlers
  const handleUpdatePillar = (id: string, updatedFields: Partial<ValuePillar>) => {
    setForm((prev) => ({
      ...prev,
      valuePillars: (prev.valuePillars || DEFAULT_VALUE_PILLARS).map((p) =>
        p.id === id ? { ...p, ...updatedFields } : p
      )
    }));
  };

  const handleAddPillar = () => {
    const newId = 'pillar_' + Date.now();
    const newPillar: ValuePillar = {
      id: newId,
      title: 'ميزة جديدة',
      titleEn: 'New Feature',
      description: 'اكتب وصف الميزة أو الخدمة هنا...',
      descriptionEn: 'Write description of feature or service here...',
      iconName: 'Building2',
      order: (form.valuePillars?.length || 0) + 1
    };
    setForm((prev) => ({
      ...prev,
      valuePillars: [...(prev.valuePillars || DEFAULT_VALUE_PILLARS), newPillar]
    }));
    onShowToast('تمت إضافة بطاقة ميزة جديدة بنجاح', 'info');
  };

  const handleDeletePillar = (id: string) => {
    if ((form.valuePillars?.length || 0) <= 1) {
      onShowToast('يجب الإبقاء على بطاقة ميزة واحدة على الأقل', 'error');
      return;
    }
    setForm((prev) => ({
      ...prev,
      valuePillars: (prev.valuePillars || DEFAULT_VALUE_PILLARS).filter((p) => p.id !== id)
    }));
    onShowToast('تم حذف البطاقة بنجاح', 'info');
  };

  const handlePillarIconUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onShowToast('حجم أيقونة PNG يجب ألا يتجاوز 5 ميجابايت', 'error');
      return;
    }

    try {
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      const iconData = await optimizeImageFile(file, {
        maxWidth: 256,
        maxHeight: 256,
        forcePng: isPng
      });
      handleUpdatePillar(id, { customIconUrl: iconData });
      onShowToast('تم رفع أيقونة PNG الخاصة بالبطاقة بنجاح (مع الحفاظ على الشفافية)', 'success');
    } catch (err) {
      console.error('Failed uploading pillar icon:', err);
      onShowToast('حدث خطأ أثناء معالجة أيقونة PNG', 'error');
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave: AboutPageSettings = {
      ...form,
      logoUrl: currentLogo
    };
    onUpdateAboutUs(dataToSave, currentLogo);
    onShowToast('تم حفظ وتحديث بيانات صفحة "من نحن" والمكتب بنجاح 🎉', 'success');
  };

  const allPhotos = form.photos || [];

  return (
    <div id="admin-about-manager" className="space-y-8 animate-fadeIn">
      {/* Top Banner & Save CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>إدارة صفحة من نحن والمكتب</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-cairo font-bold text-stone-900">
            تخصيص الشعار، صور ومقر المكتب، ولوكيشن الخريطة والتفاصيل
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            يتم تطبيق التعديلات مباشرة على صفحة "من نحن" وبيانات الفوتر وتفاصيل الموقع.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="px-6 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md shadow-[#C9A24B]/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Check className="w-4 h-4" />
          <span>حفظ جميع التعديلات</span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-8">
        {/* ========================================================= */}
        {/* SECTION 1: LOGO & BRAND EMBLEM */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
              ١
            </div>
            <div>
              <h3 className="font-cairo font-bold text-lg text-stone-900">شعار وهوية الشركة (Logo)</h3>
              <p className="text-xs text-stone-500">
                الشعار الرسمي الذي يظهر في أعلى الهيدر، الفوتر، وصفحة من نحن.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Logo Preview */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center">
              <div 
                onClick={() => currentLogo && openAdminLightbox(currentLogo)}
                className={`group relative w-24 h-24 rounded-2xl bg-white border-2 border-[#C9A24B]/30 shadow-md p-2 flex items-center justify-center overflow-hidden mb-3 ${
                  currentLogo ? 'cursor-pointer hover:border-[#C9A24B] hover:shadow-lg' : ''
                }`}
                title={currentLogo ? 'انقر لتكبير ومعاينة الشعار' : undefined}
              >
                {currentLogo ? (
                  <>
                    <img
                      src={currentLogo}
                      alt="شعار الشركة"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <Building2 className="w-10 h-10 text-[#B38A34]" />
                )}
              </div>
              <span className="text-xs font-bold text-stone-800">
                {currentLogo ? 'الشعار المعتمد الحالي' : 'الشعار الافتراضي للنظام'}
              </span>
              {currentLogo && (
                <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => openAdminLightbox(currentLogo)}
                    className="text-[11px] text-[#B38A34] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>تكبير الشعار</span>
                  </button>
                  <span className="text-stone-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentLogo('');
                      setForm((prev) => ({ ...prev, logoUrl: '' }));
                    }}
                    className="text-[11px] text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>إزالة الشعار</span>
                  </button>
                </div>
              )}
            </div>

            {/* Logo Actions */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer px-5 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>رفع لوجو من جهازك (PNG شفاف، JPG، SVG)</span>
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, .png, .jpg, .jpeg, .webp, .svg, image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  أو كتابة رابط صورة اللوجو (URL مباشر):
                </label>
                <input
                  type="text"
                  value={currentLogo}
                  onChange={(e) => {
                    setCurrentLogo(e.target.value);
                    setForm((prev) => ({ ...prev, logoUrl: e.target.value }));
                  }}
                  placeholder="https://... رابط صورة الشعار"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: OFFICE & COMPANY PHOTOS ALBUM */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                ٢
              </div>
              <div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  ألبوم صور المقر والمكتب وفريق العمل ({allPhotos.length})
                </h3>
                <p className="text-xs text-stone-500">
                  ارفع صور مكاتب الاستقبال، قاعات الاجتماعات، وفريق خدمة ضيوف الرحمن.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all">
                <Upload className="w-4 h-4" />
                <span>رفع صور من الجهاز (PNG, JPG, WebP)</span>
                <input
                  ref={photosFileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, .png, .jpg, .jpeg, .webp, image/*"
                  multiple
                  onChange={handlePhotosUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowAddUrlInput(!showAddUrlInput)}
                className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#B38A34]" />
                <span>إضافة برابط URL</span>
              </button>
            </div>
          </div>

          {/* Add URL Form Input */}
          {showAddUrlInput && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-[#C9A24B]/40 flex gap-2 animate-scaleUp">
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... أو رابط مباشر للصورة"
                className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B]"
              />
              <button
                type="button"
                onClick={handleAddPhotoUrl}
                className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold cursor-pointer"
              >
                إضافة للألبوم
              </button>
            </div>
          )}

          {/* Photos Grid */}
          {allPhotos.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border-2 border-dashed border-stone-300 p-6">
              <ImageIcon className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-500 font-semibold">
                لا توجد صور مضافة للمقر بعد. اضغط على زر الرفع لإضافة صور مكاتب الشركة.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allPhotos.map((img, idx) => {
                const isMain = img === form.mainPhoto;
                return (
                  <div
                    key={idx}
                    className={`group relative rounded-2xl overflow-hidden border-2 transition-all bg-stone-100 shadow-sm flex flex-col ${
                      isMain ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/30' : 'border-stone-200'
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
                      <img
                        src={img}
                        alt={`صورة ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />

                      {isMain && (
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-[#C9A24B] text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span>الصورة الرئيسية</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={() => openAdminLightbox(img)}
                          className="p-2 rounded-xl bg-white/90 hover:bg-white text-stone-900 shadow-md cursor-pointer"
                          title="تكبير ومعاينة الصورة"
                        >
                          <Eye className="w-4 h-4 text-[#B38A34]" />
                        </button>
                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainPhoto(img)}
                            className="p-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white shadow-md cursor-pointer"
                            title="تعيين كصورة رئيسية لصفحة من نحن"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(img)}
                          className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer"
                          title="حذف الصورة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white flex items-center justify-between border-t border-stone-100 text-[11px]">
                      {isMain ? (
                        <span className="text-[#B38A34] font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>الغلاف الرئيسي</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetMainPhoto(img)}
                          className="text-stone-600 hover:text-[#B38A34] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Star className="w-3 h-3 text-[#C9A24B]" />
                          <span>اجعلها رئيسية</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(img)}
                        className="text-stone-400 hover:text-red-600 p-1 cursor-pointer"
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

        {/* ========================================================= */}
        {/* SECTION 3: OFFICE LOCATION & GOOGLE MAPS */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
              ٣
            </div>
            <div>
              <h3 className="font-cairo font-bold text-lg text-stone-900">
                لوكيشن وبيانات التواصل الخاصة بالمكتب (Office Location & Maps)
              </h3>
              <p className="text-xs text-stone-500">
                موقع المقر على خرائط جوجل، العنوان الدقيق، وأرقام التواصل المباشرة.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">اسم المقر / الفرع: *</label>
              <input
                type="text"
                required
                value={form.officeTitle || ''}
                onChange={(e) => setForm({ ...form, officeTitle: e.target.value })}
                placeholder="المقر الرئيسي - مكة المكرمة"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">المدينة:</label>
              <select
                value={form.officeCity || 'مكة المكرمة'}
                onChange={(e) => setForm({ ...form, officeCity: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
              >
                <option value="مكة المكرمة">مكة المكرمة</option>
                <option value="المدينة المنورة">المدينة المنورة</option>
                <option value="جدة">جدة</option>
                <option value="الرياض">الرياض</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-stone-700 block mb-1">
                العنوان التفصيلي (البرج، الشارع، الحي، رقم المكتب): *
              </label>
              <input
                type="text"
                required
                value={form.officeAddress || ''}
                onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                placeholder="أبراج وقف الملك عبدالعزيز - مجمع أبراج البيت، طريق أجياد، مكة المكرمة"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700 block">
                  رابط لوكيشن خرائط جوجل (Google Maps URL): *
                </label>
                {form.officeMapUrl && (
                  <a
                    href={form.officeMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#B38A34] hover:underline font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>فتح اللوكيشن وتجربته</span>
                  </a>
                )}
              </div>
              <input
                type="url"
                required
                value={form.officeMapUrl || ''}
                onChange={(e) => setForm({ ...form, officeMapUrl: e.target.value })}
                placeholder="https://maps.google.com/?q=... أو رابط الموقع الجغرافي"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">هاتف المكتب:</label>
              <input
                type="text"
                value={form.officePhone || ''}
                onChange={(e) => setForm({ ...form, officePhone: e.target.value })}
                placeholder="+966501234567"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">واتساب المكتب:</label>
              <input
                type="text"
                value={form.officeWhatsApp || ''}
                onChange={(e) => setForm({ ...form, officeWhatsApp: e.target.value })}
                placeholder="+966501234567"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">البريد الإلكتروني الرسمي:</label>
              <input
                type="email"
                value={form.officeEmail || ''}
                onChange={(e) => setForm({ ...form, officeEmail: e.target.value })}
                placeholder="info@diyafat.sa"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">ساعات وأوقات العمل:</label>
              <input
                type="text"
                value={form.officeWorkingHours || ''}
                onChange={(e) => setForm({ ...form, officeWorkingHours: e.target.value })}
                placeholder="مفتوح 24/7 لخدمة ضيوف الرحمن"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3.5: VALUE PILLARS & FEATURE CARDS */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                ٤
              </div>
              <div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  مميزات وركائز الخدمة / بطاقات القيمة الرئيسية (Feature Cards & Icons)
                </h3>
                <p className="text-xs text-stone-500">
                  تحكّم في بطاقات المميزات والركائز المودعة بالموقع، مع إمكانية تغيير الأيقونات أو رفع أيقونات PNG مخصصة لكل بطاقة.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddPillar}
              className="px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة بطاقة ميزة جديدة</span>
            </button>
          </div>

          {/* Cards List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(form.valuePillars || DEFAULT_VALUE_PILLARS).map((pillar, idx) => (
              <div 
                key={pillar.id}
                className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-4 relative group"
              >
                {/* Header: Number & Remove */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#C9A24B] text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-stone-800">بطاقة الميزة</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePillar(pillar.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="حذف البطاقة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Icon Selector / Preview */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-3">
                  <label className="text-[11px] font-bold text-stone-700 block">
                    أيقونة البطاقة (Icon):
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center shrink-0 border border-[#C9A24B]/30">
                      <PillarIcon iconName={pillar.iconName} customIconUrl={pillar.customIconUrl} className="w-6 h-6 text-[#B38A34]" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <select
                        value={pillar.iconName || 'ShieldCheck'}
                        onChange={(e) => handleUpdatePillar(pillar.id, { iconName: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-900 outline-none"
                      >
                        {ICON_OPTIONS.map((opt) => (
                          <option key={opt.name} value={opt.name}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      {/* Upload PNG Icon option */}
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer text-[10px] font-bold text-[#B38A34] hover:text-[#98752B] bg-[#C9A24B]/10 hover:bg-[#C9A24B]/20 border border-[#C9A24B]/30 px-2.5 py-1 rounded-md flex items-center gap-1 transition-all">
                          <Upload className="w-3 h-3" />
                          <span>{pillar.customIconUrl ? 'تغيير PNG' : 'رفع أيقونة PNG'}</span>
                          <input
                            type="file"
                            accept="image/png, image/svg+xml, .png, image/*"
                            onChange={(e) => handlePillarIconUpload(pillar.id, e)}
                            className="hidden"
                          />
                        </label>

                        {pillar.customIconUrl && (
                          <button
                            type="button"
                            onClick={() => handleUpdatePillar(pillar.id, { customIconUrl: undefined })}
                            className="text-[10px] text-red-600 hover:underline"
                          >
                            إلغاء PNG والرجوع للأيقونة
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Title (Arabic) */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    العنوان بالعربية: *
                  </label>
                  <input
                    type="text"
                    required
                    value={pillar.title}
                    onChange={(e) => handleUpdatePillar(pillar.id, { title: e.target.value })}
                    placeholder="مثال: المصداقية المطلقة"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                {/* Card Title (English) */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    العنوان بالإنجليزية (English Title):
                  </label>
                  <input
                    type="text"
                    value={pillar.titleEn || ''}
                    onChange={(e) => handleUpdatePillar(pillar.id, { titleEn: e.target.value })}
                    placeholder="e.g. Absolute Integrity"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] dir-ltr text-left"
                  />
                </div>

                {/* Card Description (Arabic) */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    الوصف بالعربية: *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={pillar.description}
                    onChange={(e) => handleUpdatePillar(pillar.id, { description: e.target.value })}
                    placeholder="شرح وتفاصيل الميزة..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B] resize-none"
                  />
                </div>

                {/* Card Description (English) */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    الوصف بالإنجليزية (English Description):
                  </label>
                  <textarea
                    rows={3}
                    value={pillar.descriptionEn || ''}
                    onChange={(e) => handleUpdatePillar(pillar.id, { descriptionEn: e.target.value })}
                    placeholder="e.g. What you see is what you get..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] resize-none dir-ltr text-left"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 5: DETAILED INFORMATION & CREDENTIALS */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
              ٥
            </div>
            <div>
              <h3 className="font-cairo font-bold text-lg text-stone-900">
                تفاصيل وقصة الشركة والاعتماد (Company Details & Story)
              </h3>
              <p className="text-xs text-stone-500">
                الرسالة، الرؤية، عدد سنوات الخبرة، وشهادات وتراخيص الاعتماد الرسمية.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">العنوان الرئيسي للصفحة:</label>
                <input
                  type="text"
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">الشارة الترحيبية (Badge):</label>
                <input
                  type="text"
                  value={form.badge || ''}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">المقدمة والنبذة العامة:</label>
              <textarea
                rows={2}
                value={form.subtitle || ''}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">سنوات الخبرة (إحصائية):</label>
                <input
                  type="text"
                  value={form.yearsExperience || ''}
                  onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })}
                  placeholder="مثال: ١٥+ عاماً"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">عدد الضيوف المخدومين:</label>
                <input
                  type="text"
                  value={form.servedGuests || ''}
                  onChange={(e) => setForm({ ...form, servedGuests: e.target.value })}
                  placeholder="مثال: ١٢٠,٠٠٠+ معتمر"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">نص رسالة الشركة وقصة التأسيس:</label>
              <textarea
                rows={3}
                value={form.missionText1 || ''}
                onChange={(e) => setForm({ ...form, missionText1: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">رقم الترخيص الرسمي:</label>
                <input
                  type="text"
                  value={form.licenseNumber || ''}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  placeholder="73104928"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">جهة الاعتماد والتصريح:</label>
                <input
                  type="text"
                  value={form.licenseAuthority || ''}
                  onChange={(e) => setForm({ ...form, licenseAuthority: e.target.value })}
                  placeholder="وزارة الحج والعمرة والهيئة السعودية للسياحة"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>
            </div>

            {/* License Enable / Disable Toggle */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  إظهار شارة الترخيص والاعتماد في الموقع
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  تفعيل أو إخفاء بطاقة الاعتماد ورقم الترخيص في صفحة "من نحن" والفوتر
                </p>
              </div>

              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, showLicense: !prev.showLicense }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  form.showLicense !== false
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                }`}
              >
                {form.showLicense !== false ? 'مفعل (ظاهر للزوار)' : 'مخفي (معطل)'}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>حفظ وتحديث بيانات صفحة من نحن</span>
          </button>
        </div>
      </form>

      {/* Fullscreen Lightbox Preview for Admin */}
      {lightboxOpen && (
        <Lightbox
          images={allAdminImages}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
