import React, { useState, useRef } from 'react';
import { ActivePage, SiteSettings } from '../types';
import { EditableText } from '../components/EditableText';
import { useLanguage } from '../context/LanguageContext';
import { useLiveContent } from '../context/LiveContentContext';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Users, 
  Building2, 
  HeartHandshake, 
  CheckCircle2, 
  MapPin, 
  ExternalLink, 
  Phone, 
  Mail, 
  Clock, 
  Image as ImageIcon,
  ArrowLeft,
  Eye,
  Upload,
  Download,
  X,
  Maximize2,
  Check
} from 'lucide-react';
import { WhatsAppIcon } from '../components/BookingIcons';
import { Lightbox } from '../components/Lightbox';
import { PillarIcon } from '../components/PillarIcon';
import { DEFAULT_VALUE_PILLARS } from '../components/AdminAboutManager';

interface AboutPageProps {
  onNavigate: (page: ActivePage) => void;
  siteSettings?: SiteSettings;
  onUpdateSiteSettings?: (settings: SiteSettings) => Promise<void>;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isAdminLoggedIn?: boolean;
}

export const AboutPage: React.FC<AboutPageProps> = ({ 
  onNavigate, 
  siteSettings,
  onUpdateSiteSettings,
  onShowToast,
  isAdminLoggedIn: propIsAdminLoggedIn
}) => {
  const { language, t, isRtl } = useLanguage();
  const { isEditMode, isAdminLoggedIn: contextIsAdminLoggedIn } = useLiveContent();
  const isAdminLoggedIn = propIsAdminLoggedIn ?? contextIsAdminLoggedIn;
  const about = siteSettings?.aboutUs || {};
  
  // Active Logo URL or fallback
  const defaultEmblemUrl = 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=400&q=80';
  const logo = about.logoUrl || siteSettings?.logoUrl || '';
  const displayLogo = logo || defaultEmblemUrl;

  const defaultPhotos = [
    'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
  ];
  const photos = about.photos && about.photos.length > 0 ? about.photos : defaultPhotos;
  const mainPhoto = about.mainPhoto || photos[0];

  // Modals state
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const pngAlbumFileInputRef = useRef<HTMLInputElement>(null);

  // Combine all images into one complete viewable list for Lightbox
  const allAboutImages = Array.from(
    new Set([logo || displayLogo, mainPhoto, ...photos].filter(Boolean) as string[])
  );

  const openImageInLightbox = (imgUrl?: string) => {
    if (!imgUrl) return;
    const idx = allAboutImages.indexOf(imgUrl);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };

  // Open logo handler - opens the rich logo modal and offers all options
  const handleOpenLogo = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsLogoModalOpen(true);
  };

  // Upload New PNG Logo Handler
  const handleUploadLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      onShowToast?.('حجم الملف يتجاوز 8 ميجابايت، يرجى اختيار ملف أصغر', 'error');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      const optimizedLogo = await optimizeImageFile(file, {
        maxWidth: 512,
        maxHeight: 512,
        forcePng: isPng
      });

      if (onUpdateSiteSettings && siteSettings) {
        const updatedAbout = {
          ...about,
          logoUrl: optimizedLogo
        };
        const updatedSettings: SiteSettings = {
          ...siteSettings,
          logoUrl: optimizedLogo,
          aboutUs: updatedAbout
        };
        await onUpdateSiteSettings(updatedSettings);
        onShowToast?.('تم رفع وتحديث شعار الشركة (PNG) بنجاح وحفظه', 'success');
      } else {
        onShowToast?.('تمت معالجة الشعار بنجاح', 'success');
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      onShowToast?.('حدث خطأ أثناء معالجة الشعار', 'error');
    } finally {
      setIsUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  // Upload New PNG Photos into the Album
  const handleUploadPngPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    const newOptimizedPhotos: string[] = [];
    const fileList = Array.from(files) as File[];

    for (const file of fileList) {
      if (file.size > 10 * 1024 * 1024) {
        onShowToast?.(`تم تخطي الملف "${file.name}" لتجاوز الحجم 10 ميجابايت`, 'error');
        continue;
      }
      try {
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const optimized = await optimizeImageFile(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          forcePng: isPng
        });
        newOptimizedPhotos.push(optimized);
      } catch (err) {
        console.warn('Failed optimizing photo:', err);
      }
    }

    if (newOptimizedPhotos.length > 0 && onUpdateSiteSettings && siteSettings) {
      try {
        const currentPhotos = about.photos || defaultPhotos;
        const updatedPhotos = [...currentPhotos, ...newOptimizedPhotos];
        const updatedAbout = {
          ...about,
          photos: updatedPhotos
        };
        const updatedSettings: SiteSettings = {
          ...siteSettings,
          aboutUs: updatedAbout
        };
        await onUpdateSiteSettings(updatedSettings);
        onShowToast?.(`تمت إضافة ${newOptimizedPhotos.length} صورة PNG جديدة إلى ألبوم الشركة بنجاح`, 'success');
      } catch (err) {
        console.error('Failed saving photos to settings:', err);
        onShowToast?.('حدث خطأ أثناء حفظ الصور', 'error');
      }
    }
    setIsUploadingPhoto(false);
    if (pngAlbumFileInputRef.current) pngAlbumFileInputRef.current.value = '';
  };

  // Download logo file
  const handleDownloadLogo = () => {
    const a = document.createElement('a');
    a.href = displayLogo;
    a.download = 'prestige-hotels-logo.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast?.(t('about.downloadingLogo', 'جاري تنزيل ملف الشعار...'), 'info');
  };

  const officeMapUrl = about.officeMapUrl || 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah';
  const officeWhatsApp = about.officeWhatsApp || '+966501234567';
  const cleanPhone = officeWhatsApp.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    language === 'en'
      ? 'Hello, I would like to inquire about Prestige hotel bookings and services.'
      : 'السلام عليكم ورحمة الله، أود الاستفسار عن خدمات وحجوزات شركة برستيج.'
  )}`;

  return (
    <div id="about-us-page" className="min-h-screen bg-[#F8F7F4] text-stone-900 pt-28 pb-24">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        
        {/* ========================================================= */}
        {/* 1. HERO HEADER SECTION WITH LOGO & TITLE */}
        {/* ========================================================= */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          
          {/* Brand Logo Clickable Card */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div 
              id="about-company-logo-card"
              role="button"
              tabIndex={0}
              onClick={handleOpenLogo}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenLogo();
                }
              }}
              className="group relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white border-2 border-[#C9A24B]/40 shadow-xl p-3.5 flex items-center justify-center animate-fadeIn cursor-pointer hover:border-[#C9A24B] hover:shadow-2xl hover:scale-105 transition-all select-none"
              title={t('about.clickToOpenLogo', 'انقر لفتح ومعاينة وتكبير الشعار')}
            >
              {logo || siteSettings?.logoUrl ? (
                <img
                  src={logo || siteSettings?.logoUrl}
                  alt={siteSettings?.siteTitle || 'شعار الشركة'}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#DFBE72] via-[#C9A24B] to-[#98752B] p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-[#B38A34]" />
                  </div>
                </div>
              )}

              {/* Hover overlay with eye icon & open badge */}
              <div className="absolute inset-0 bg-black/55 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 backdrop-blur-xs text-white">
                <Eye className="w-6 h-6 text-[#DFBE72] animate-pulse" />
                <span className="text-xs font-bold font-cairo">
                  {language === 'en' ? 'Open Logo' : 'فتح وتكبير الشعار'}
                </span>
                <span className="text-[10px] text-stone-300">
                  {language === 'en' ? 'Click to preview' : 'اضغط للمعاينة والتحميل'}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons directly below the logo */}
            <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
              <button
                type="button"
                id="open-logo-modal-btn"
                onClick={handleOpenLogo}
                className="text-xs font-bold text-[#B38A34] hover:text-[#98752B] bg-[#C9A24B]/10 hover:bg-[#C9A24B]/20 border border-[#C9A24B]/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t('about.clickToOpenLogo', 'فتح وتكبير الشعار')}</span>
              </button>

              {(isAdminLoggedIn && isEditMode) && (
                <label className="text-xs font-bold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 border border-stone-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-[#B38A34]" />
                  <span>{language === 'en' ? 'Change Logo (PNG)' : 'تغيير الشعار (PNG)'}</span>
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, .png, image/*"
                    onChange={handleUploadLogoFile}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold border border-[#C9A24B]/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              <EditableText
                contentKey="about.badge"
                fallback={about.badge || t('about.badge', 'شرف خدمة ضيوف الرحمن')}
                inline={true}
              />
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-cairo font-extrabold text-stone-900 mb-4 leading-tight">
            <EditableText
              contentKey="about.title"
              fallback={about.title || (language === 'en' ? 'About Prestige Hotels Management' : 'عن شركة برستيج لإدارة وتشغيل الفنادق')}
              as="span"
            />
          </h1>

          <div className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto">
            <EditableText
              contentKey="about.subtitle"
              fallback={about.subtitle || (language === 'en' ? 'A legacy of excellence in hotel management, operations, and hospitality in Makkah & Madinah.' : 'مسيرة ريادة واحترافية في إدارة وتشغيل الفنادق والضيافة الفاخرة لضيوف الرحمن وزوار مكة المكرمة والمدينة المنورة.')}
              as="span"
              multiline={true}
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. STORY NARRATIVE & STATS */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center mb-20">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-cairo font-bold text-stone-900 leading-snug">
              <EditableText
                contentKey="about.missionTitle"
                fallback={about.missionTitle || (language === 'en' ? 'Our Mission: Excellence in Hotel Management & Hospitality' : 'رسالتنا: التميز في إدارة وتشغيل الفنادق وخدمة الضيوف')}
                as="span"
              />
            </h2>

            <div className="text-sm sm:text-base text-stone-700 leading-loose">
              <EditableText
                contentKey="about.missionText1"
                fallback={about.missionText1 || (language === 'en'
                  ? 'Prestige Hotels Management was established with a clear vision to redefine hospitality and hotel asset operations in Makkah & Madinah, delivering world-class guest experiences and efficient hotel operations.'
                  : 'تأسست شركة برستيج لإدارة وتشغيل الفنادق انطلاقاً من رؤية متكاملة لرفع كفاءة تشغيل الأصول الفندقية وتقديم أرقى حلول الضيافة والتسكين لضيوف الرحمن وشركات السياحة في المدينتين المقدستين.')}
                as="span"
                multiline={true}
              />
            </div>

            <div className="text-sm sm:text-base text-stone-600 leading-relaxed">
              <EditableText
                contentKey="about.missionText2"
                fallback={about.missionText2 || (language === 'en'
                  ? 'Through strategic partnerships and professional management of prestigious properties in Makkah and Madinah, we guarantee our partners high operational standards and our guests seamless, memorable stays.'
                  : 'بفضل خبراتنا الإدارية وكوادرنا التشغيلية المتخصصة في كبرى فنادق مكة المكرمة والمدينة المنورة، نضمن للمستثمرين والنزلاء أعلى معايير الجودة الفندقية وسرعة إجراءات التسكين.')}
                as="span"
                multiline={true}
              />
            </div>

            {/* Numbers & Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
                <strong className="text-2xl sm:text-3xl font-bold text-[#B38A34] block mb-1 font-mono">
                  {language === 'en' ? '15+ Years' : (about.yearsExperience || '١٥+ عاماً')}
                </strong>
                <span className="text-xs text-stone-500 font-medium">
                  {t('about.experienceYears', 'خبرة متخصصة في قطاع الحج والعمرة')}
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
                <strong className="text-2xl sm:text-3xl font-bold text-[#B38A34] block mb-1 font-mono">
                  {language === 'en' ? '120,000+' : (about.servedGuests || '١٢٠,٠٠٠+')}
                </strong>
                <span className="text-xs text-stone-500 font-medium">
                  {t('about.servedGuests', 'حاج ومعتمر سُعدنا بخدمتهم')}
                </span>
              </div>
            </div>
          </div>

          {/* Main Photo Card */}
          <div 
            onClick={() => openImageInLightbox(mainPhoto)}
            className="lg:col-span-6 relative rounded-3xl overflow-hidden border border-[#C9A24B]/30 shadow-xl aspect-[4/3] bg-stone-100 group cursor-pointer"
            title={t('about.zoomMainPhoto', 'انقر لتكبير ومعاينة الصورة')}
          >
            <img
              src={mainPhoto}
              alt="مقر شركة برستيج لإدارة وتشغيل الفنادق"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Click to zoom overlay */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
              <span>{t('about.zoomMainPhoto', 'تكبير الصورة')}</span>
            </div>
            
            {about.showLicense !== false && (
              <div className="absolute bottom-5 right-5 left-5 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-lg flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-[#B38A34] font-bold block mb-0.5">
                    {t('about.certifiedTitle', 'مرخصون ومعتمدون رسمياً')}
                  </span>
                  <span className="text-xs text-stone-700 font-medium block">
                    {language === 'en' 
                      ? 'Ministry of Hajj & Umrah and Saudi Tourism Authority Certified' 
                      : (about.licenseAuthority || 'ترخيص وزارة الحج والعمرة والهيئة العامة للسياحة')}
                  </span>
                  {about.licenseNumber && (
                    <span className="text-[11px] text-stone-500 font-mono">
                      {language === 'en' ? `License No: ${about.licenseNumber}` : `ترخيص رقم: ${about.licenseNumber}`}
                    </span>
                  )}
                </div>
                <ShieldCheck className="w-8 h-8 text-[#B38A34] shrink-0" />
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. OFFICE LOCATION & HEADQUARTERS SHOWCASE CARD */}
        {/* ========================================================= */}
        <div id="office-location-section" className="mb-20">
          <div className="bg-gradient-to-br from-white via-white to-amber-50/40 rounded-3xl border border-[#C9A24B]/30 p-6 sm:p-10 shadow-lg">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 mb-8 border-b border-stone-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#C9A24B] text-white flex items-center justify-center shadow-md shadow-[#C9A24B]/30 shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#B38A34] uppercase tracking-wide">
                      <EditableText
                        contentKey="about.office.sectionBadge"
                        fallback={language === 'en' ? 'Official Headquarters & Location' : 'الموقع الجغرافي والمقر الرسمي'}
                        inline={true}
                      />
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-cairo font-bold text-stone-900">
                    <EditableText
                      contentKey="about.office.title"
                      fallback={about.officeTitle || (language === 'en' ? 'Prestige Hotels Management Headquarters' : 'المقر الرئيسي لشركة برستيج لإدارة وتشغيل الفنادق')}
                      as="span"
                    />
                  </h3>
                </div>
              </div>

              <a
                href={officeMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#C9A24B]/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <MapPin className="w-4 h-4" />
                <span>{t('about.viewMap', 'فتح اللوكيشن على خرائط جوجل')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Office Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Address */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-[#B38A34] font-bold text-xs">
                  <MapPin className="w-4 h-4" />
                  <span>{language === 'en' ? 'Address & City' : 'العنوان والمدينة'}</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-stone-800 leading-relaxed">
                  <EditableText
                    contentKey="about.office.address"
                    fallback={about.officeAddress || 'أبراج وقف الملك عبدالعزيز - طريق أجياد، مكة المكرمة'}
                    as="span"
                  />
                </div>
                <span className="text-[11px] text-[#B38A34] block font-medium">
                  {language === 'en' ? 'Makkah Al-Mukarramah' : (about.officeCity || 'مكة المكرمة')}
                </span>
              </div>

              {/* Working Hours */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-[#B38A34] font-bold text-xs">
                  <Clock className="w-4 h-4" />
                  <span>{t('about.workingHoursTitle', 'أوقات وساعات العمل')}</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-stone-800">
                  <EditableText
                    contentKey="about.office.workingHours"
                    fallback={about.officeWorkingHours || 'على مدار الساعة 24/7'}
                    as="span"
                  />
                </div>
                <span className="text-[11px] text-stone-500 block">
                  {language === 'en' ? 'Every day throughout all seasons' : 'طوال أيام الأسبوع والمواسم'}
                </span>
              </div>

              {/* Direct Phone */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-[#B38A34] font-bold text-xs">
                  <Phone className="w-4 h-4" />
                  <span>
                    <EditableText
                      contentKey="about.office.receptionTitle"
                      fallback={language === 'en' ? 'Direct Reception Phone' : 'هاتف الاستقبال المباشر'}
                      inline={true}
                    />
                  </span>
                </div>
                <a
                  href={`tel:${about.officePhone || '+966501234567'}`}
                  className="text-xs sm:text-sm font-bold font-mono text-stone-900 hover:text-[#B38A34] block transition-colors dir-ltr text-right"
                >
                  {about.officePhone || '+966501234567'}
                </a>
                <span className="text-[11px] text-stone-500 block">
                  {language === 'en' ? 'Accommodation & Bookings' : 'استفسارات التسكين والحجوزات'}
                </span>
              </div>

              {/* Direct WhatsApp */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-[#25D366] font-bold text-xs">
                  <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                  <span>{language === 'en' ? 'Customer Care WhatsApp' : 'واتساب خدمة العملاء'}</span>
                </div>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm font-bold font-mono text-stone-900 hover:text-[#25D366] block transition-colors dir-ltr text-right"
                >
                  {about.officeWhatsApp || '+966501234567'}
                </a>
                <span className="text-[11px] text-emerald-600 block font-medium">
                  {language === 'en' ? 'Instant Consultant Response' : 'رد فوري من المستشار'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. OFFICE & COMPANY PHOTOS ALBUM (WITH PNG UPLOAD) */}
        {/* ========================================================= */}
        <div className="mb-20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold mb-1">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Photo Album' : 'ألبوم الصور'}</span>
              </div>
              <h3 className="text-2xl font-cairo font-bold text-stone-900">
                <EditableText
                  contentKey="about.album.title"
                  fallback={language === 'en' 
                    ? 'Photos from Company Headquarters, Reception & Team' 
                    : 'صور من مقر الشركة، مكاتب الاستقبال، وفريق العمل'}
                  as="span"
                />
              </h3>
            </div>

            {/* Upload PNG Photos Button (Always available for admin / edit mode) */}
            <div className="flex items-center gap-2 flex-wrap">
              {(isAdminLoggedIn && isEditMode) && (
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>
                    {isUploadingPhoto
                      ? (language === 'en' ? 'Uploading photos...' : 'جاري رفع الصور...')
                      : (language === 'en' ? 'Add PNG Photos to Album' : 'إضافة صور PNG للألبوم')}
                  </span>
                  <input
                    ref={pngAlbumFileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, .png, image/*"
                    multiple
                    disabled={isUploadingPhoto}
                    onChange={handleUploadPngPhotos}
                    className="hidden"
                  />
                </label>
              )}

              <span className="text-xs text-stone-500">
                {language === 'en' 
                  ? 'Click any photo to view in high resolution' 
                  : 'انقر على أي صورة لتكبيرها واستعراضها بجودة عالية'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((pic, idx) => (
              <div
                key={idx}
                onClick={() => openImageInLightbox(pic)}
                className="group relative rounded-2xl overflow-hidden border border-stone-200 shadow-xs aspect-[4/3] bg-stone-100 cursor-pointer hover:border-[#C9A24B] hover:shadow-md transition-all"
                title={language === 'en' ? 'Click to zoom photo' : 'انقر لتكبير الصورة'}
              >
                <img
                  src={pic}
                  alt={`صورة المقر ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2 rounded-xl bg-white/90 backdrop-blur-xs text-stone-900 shadow-md">
                    <Sparkles className="w-4 h-4 text-[#B38A34]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. CORE VALUES & PILLARS */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {(about.valuePillars && about.valuePillars.length > 0 ? about.valuePillars : DEFAULT_VALUE_PILLARS).map((pillar) => (
            <div 
              key={pillar.id} 
              className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col items-start hover:border-[#C9A24B]/50 transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <PillarIcon iconName={pillar.iconName} customIconUrl={pillar.customIconUrl} className="w-6 h-6 text-[#B38A34]" />
              </div>
              <h3 className="font-cairo font-bold text-xl text-stone-900 mb-2">
                <EditableText
                  contentKey={`about.pillar.${pillar.id}.title`}
                  fallback={language === 'en' ? (pillar.titleEn || pillar.title) : pillar.title}
                  as="span"
                />
              </h3>
              <div className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                <EditableText
                  contentKey={`about.pillar.${pillar.id}.desc`}
                  fallback={language === 'en' ? (pillar.descriptionEn || pillar.description) : pillar.description}
                  as="span"
                  multiline={true}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* 6. ACTION CTA */}
        {/* ========================================================= */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#98752B] via-[#C9A24B] to-[#DFBE72] text-white text-center space-y-6 shadow-xl">
          <div className="max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-cairo font-bold">
              <EditableText
                contentKey="about.cta.title"
                fallback={language === 'en' 
                  ? 'Planning an upcoming Umrah or Hajj journey?' 
                  : 'هل تخطط لرحلة عمرة أو حج قادمة؟'}
                as="span"
              />
            </h3>
            <div className="text-xs sm:text-sm text-white/90 leading-relaxed">
              <EditableText
                contentKey="about.cta.subtitle"
                fallback={language === 'en'
                  ? 'Explore our certified hotels in Makkah and Madinah or chat directly with our team to help select the ideal hotel.'
                  : 'تصفح قائمة فنادقنا المعتمدة في مكة والمدينة أو تواصل مباشرة مع فريقنا لمساعدتك في اختيار الفندق الأنسب.'}
                as="span"
                multiline={true}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('hotels')}
              className="px-8 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-900 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <span>{t('hero.exploreHotels', 'استعرض فنادق مكة والمدينة')}</span>
              <ArrowLeft className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              <span>{t('hero.contactConsultant', 'تحدث مع مستشار التسكين')}</span>
            </a>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 7. DEDICATED LOGO VIEWER & INTERACTIVE MODAL */}
      {/* ========================================================= */}
      {isLogoModalOpen && (
        <div
          id="logo-viewer-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none"
          onClick={() => setIsLogoModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden animate-scaleUp flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-base text-stone-900 leading-tight">
                    {language === 'en' ? 'Company Brand Logo' : (siteSettings?.siteTitle || 'شعار شركة برستيج')}
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    {language === 'en' ? 'High-Resolution Preview (PNG / SVG)' : 'معاينة الشعار بدقة عالية مع دعم الشفافية'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Logo Display with checkerboard pattern for PNG transparency */}
            <div className="p-6 flex flex-col items-center justify-center bg-radial from-stone-50 to-stone-100">
              <div 
                className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 border-dashed border-[#C9A24B]/40 p-6 flex items-center justify-center shadow-inner relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px]"
              >
                <img
                  src={displayLogo}
                  alt={siteSettings?.siteTitle || 'شعار شركة برستيج'}
                  className="max-h-full max-w-full object-contain drop-shadow-md select-none"
                />
              </div>

              <span className="mt-3 text-xs text-stone-500 font-medium">
                {language === 'en' ? 'Supports transparent PNG background' : 'صيغة مدعومة: PNG مع الحفاظ على شفافية الخلفية'}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Open in new window / full tab */}
                <a
                  href={displayLogo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold border border-stone-300 shadow-2xs flex items-center gap-1.5 transition-all"
                  title={language === 'en' ? 'Open image in new tab' : 'فتح الصورة الأصلية في تبويب جديد'}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#B38A34]" />
                  <span>{language === 'en' ? 'Open in Tab' : 'فتح في تبويب'}</span>
                </a>

                {/* 2. Download PNG */}
                <button
                  type="button"
                  onClick={handleDownloadLogo}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold border border-stone-300 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title={language === 'en' ? 'Download logo file (PNG)' : 'تنزيل ملف الشعار بصيغة PNG'}
                >
                  <Download className="w-3.5 h-3.5 text-[#B38A34]" />
                  <span>{language === 'en' ? 'Download PNG' : 'تحميل PNG'}</span>
                </button>

                {/* 3. Zoom in Lightbox */}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogoModalOpen(false);
                    openImageInLightbox(displayLogo);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold border border-stone-300 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title={language === 'en' ? 'Preview logo in fullscreen lightbox' : 'معاينة الشعار في عارض الشرائح بملء الشاشة'}
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#B38A34]" />
                  <span>{language === 'en' ? 'Fullscreen Zoom' : 'تكبير ملء الشاشة'}</span>
                </button>
              </div>

              {/* 4. Upload/Change Logo for Admin */}
              {(isAdminLoggedIn && isEditMode) && (
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {isUploadingLogo 
                      ? (language === 'en' ? 'Uploading...' : 'جاري الرفع...') 
                      : (language === 'en' ? 'Upload New PNG Logo' : 'رفع شعار PNG جديد')}
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, .png, image/*"
                    disabled={isUploadingLogo}
                    onChange={handleUploadLogoFile}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for viewing photos & logo in full screen */}
      {lightboxOpen && (
        <Lightbox
          isOpen={lightboxOpen}
          images={allAboutImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
