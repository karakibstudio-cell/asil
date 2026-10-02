import React, { useState, useRef } from 'react';
import { ActivePage, SiteSettings } from '../types';
import { EditableText } from '../components/EditableText';
import { useLanguage } from '../context/LanguageContext';
import { useLiveContent } from '../context/LiveContentContext';
import { optimizeImageFile, openImageInNewTab } from '../utils/imageOptimizer';
import { buildWhatsAppLink, getFirstActiveWhatsApp } from '../utils/channels';
import { 
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
import { IntegratedServices } from '../components/IntegratedServices';

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
  const { language, t, isRtl, translateDynamic } = useLanguage();
  const { isEditMode, isAdminLoggedIn: contextIsAdminLoggedIn } = useLiveContent();
  const isAdminLoggedIn = propIsAdminLoggedIn ?? contextIsAdminLoggedIn;
  const about = siteSettings?.aboutUs || {};
  
  // Active Logo URL (Always synchronized directly with Brand Identity logo)
  const logo = siteSettings?.logoUrl || about.logoUrl || '';
  const displayLogo = logo;

  // Active Branches list
  const activeBranches = (siteSettings?.branches && siteSettings.branches.length > 0
    ? siteSettings.branches.filter(b => b.isActive !== false)
    : []
  ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranches[0]?.id || '');
  const currentBranch = activeBranches.find(b => b.id === selectedBranchId) || activeBranches[0] || null;

  const photos = Array.isArray(about.photos) ? about.photos.filter(Boolean) : [];
  const mainPhoto = about.mainPhoto || photos[0] || '';

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
        const currentPhotos = Array.isArray(about.photos) ? about.photos : [];
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

  // Open logo in new tab safely without browser data: url blocking
  const handleOpenLogoInTab = () => {
    if (!displayLogo) {
      onShowToast?.('لا يوجد شعار متاح حالياً للعرض', 'error');
      return;
    }
    openImageInNewTab(displayLogo, siteSettings?.siteTitle || 'شعار شركة برستيج');
  };

  // Download logo file (supports data URLs and remote URLs)
  const handleDownloadLogo = async () => {
    if (!displayLogo) return;
    try {
      if (displayLogo.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = displayLogo;
        a.download = 'prestige-hotels-logo.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        onShowToast?.(t('about.downloadingLogo', 'جاري تنزيل ملف الشعار...'), 'info');
        return;
      }

      const response = await fetch(displayLogo);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'prestige-hotels-logo.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      onShowToast?.(t('about.downloadingLogo', 'جاري تنزيل ملف الشعار...'), 'info');
    } catch {
      window.open(displayLogo, '_blank');
    }
  };

  // Selected Branch Data
  const siteWhatsApp = getFirstActiveWhatsApp(siteSettings?.channels);
  const sitePhone = siteSettings?.channels?.find(c => c.type === 'phone' && c.isActive)?.value || siteSettings?.primaryPhone;
  const officeMapUrl = currentBranch?.mapUrl || about.officeMapUrl || 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah';
  const branchPhone = currentBranch?.phone || about.officePhone || sitePhone || '';
  const branchWhatsApp = currentBranch?.whatsapp || about.officeWhatsApp || siteWhatsApp?.value || siteSettings?.officeWhatsApp || siteSettings?.primaryPhone || '';
  const branchAddress = currentBranch?.address || about.officeAddress || 'أبراج وقف الملك عبدالعزيز - طريق أجياد، مكة المكرمة';
  const branchCity = currentBranch?.city || about.officeCity || 'مكة المكرمة';
  const branchTitle = currentBranch ? currentBranch.name : (about.officeTitle || 'المقر الرئيسي لشركة برستيج لإدارة وتشغيل الفنادق');
  const branchWorkingHours = currentBranch?.workingHours || about.officeWorkingHours || 'على مدار الساعة 24/7';

  const defaultWaMsg = language === 'en'
    ? `Hello, I would like to inquire about Prestige hotel bookings at ${branchCity}.`
    : `السلام عليكم ورحمة الله، أود الاستفسار عن خدمات وحجوزات شركة برستيج في ${branchCity}.`;
  const waUrl = buildWhatsAppLink(branchWhatsApp, defaultWaMsg);

  return (
    <div id="about-us-page" className="min-h-screen bg-[#F8F7F4] text-stone-900 pt-28 pb-24">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        
        {/* ========================================================= */}
        {/* 1. HERO HEADER SECTION WITH LOGO & TITLE */}
        {/* ========================================================= */}
        {(about.showLogoCard !== false || about.showBadge !== false || about.showTitle !== false || about.showSubtitle !== false) && (
          <div className="text-center max-w-3xl mx-auto mb-16">
            
            {/* Brand Logo Clickable Card */}
            {about.showLogoCard !== false && (
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
                        <Building2 className="w-10 h-10 text-[#B38A34]" />
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
                  {about.showLogoCardButton !== false && (
                    <button
                      type="button"
                      id="open-logo-modal-btn"
                      onClick={handleOpenLogo}
                      className="text-xs font-bold text-[#B38A34] hover:text-[#98752B] bg-[#C9A24B]/10 hover:bg-[#C9A24B]/20 border border-[#C9A24B]/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('about.clickToOpenLogo', 'فتح وتكبير الشعار')}</span>
                    </button>
                  )}

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
            )}

            {about.showBadge !== false && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold border border-[#C9A24B]/30 mb-3">
                <Building2 className="w-3.5 h-3.5" />
                <span>
                  <EditableText
                    contentKey="about.badge"
                    fallback={about.badge || t('about.badge', 'شرف خدمة ضيوف الرحمن')}
                    inline={true}
                  />
                </span>
              </div>
            )}

            {about.showTitle !== false && (
              <h1 className="text-3xl sm:text-5xl font-cairo font-extrabold text-stone-900 mb-4 leading-tight">
                <EditableText
                  contentKey="about.title"
                  fallback={about.title || (language === 'en' ? 'Prestige.. Where Luxury Hospitality Meets the Sacred Essence' : 'برستيج.. حيث تلتقي فخامة الضيافة بروحانية المكان')}
                  as="span"
                />
              </h1>
            )}

            {about.showSubtitle !== false && (
              <div className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto">
                <EditableText
                  contentKey="about.subtitle"
                  fallback={about.subtitle || (language === 'en' ? 'Since 2010, Prestige Hotels Management started in the Holy City to redefine hospitality and guest service in Makkah & Madinah.' : 'منذ عام 2010، انطلقت "برستيج لإدارة وتشغيل الفنادق" من قلب العاصمة المقدسة لتُعيد صياغة مفهوم الضيافة وخدمة ضيوف الرحمن.')}
                  as="span"
                  multiline={true}
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. STORY NARRATIVE & STATS */}
        {/* ========================================================= */}
        {about.showStorySection !== false && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center mb-20">
            <div className="lg:col-span-6 space-y-6">
              {about.showMissionTitle !== false && (
                <h2 className="text-2xl sm:text-3xl font-cairo font-bold text-stone-900 leading-snug">
                  <EditableText
                    contentKey="about.missionTitle"
                    fallback={about.missionTitle || (language === 'en' ? 'Our Legacy: Transforming Hospitality for Pilgrims & Corporate Partners' : 'مسيرتنا: صناعة تجارب إقامة استثنائية وشراكات استراتيجية')}
                    as="span"
                  />
                </h2>
              )}

              {about.showStoryParagraphs !== false && (
                <div className="space-y-4">
                  {about.showMissionText1 !== false && (
                    <div className="text-sm sm:text-base text-stone-700 leading-loose">
                      <EditableText
                        contentKey="about.missionText1"
                        fallback={about.missionText1 || (language === 'en'
                          ? 'Since 2010, Prestige Hotels Management launched from the heart of the Holy City to redefine the concept of hospitality and pilgrim service. We never settled for merely providing hotel rooms; we took it upon ourselves to craft exceptional accommodation experiences blending luxury with absolute comfort.'
                          : 'منذ عام 2010، انطلقت "برستيج لإدارة وتشغيل الفنادق" من قلب العاصمة المقدسة لتُعيد صياغة مفهوم الضيافة وخدمة ضيوف الرحمن. لم نكتفِ يوماً بتقديم مجرد غرف فندقية، بل أخذنا على عاتقنا صناعة تجارب إقامة استثنائية تمزج بين الرفاهية والراحة التامة.')}
                        as="span"
                        multiline={true}
                      />
                    </div>
                  )}

                  {about.showMissionText2 !== false && (
                    <div className="text-sm sm:text-base text-stone-600 leading-relaxed">
                      <EditableText
                        contentKey="about.missionText2"
                        fallback={about.missionText2 || (language === 'en'
                          ? 'With the trust of our corporate partners and groups, our success journey expanded from Makkah to Madinah, forging major annual partnerships in key strategic locations (Mahbas Al-Jin, Ajyad, and Kudai/Misfalah). Today, we crown this journey with our own hotel "Prestige Ajyad", alongside managing over 7 prestigious, fully equipped hotels.'
                          : 'بفضل الله ثم بثقة عملائنا من الشركات والمجموعات، امتدت مسيرة نجاحنا من مكة المكرمة إلى رحاب المدينة المنورة، لنعقد أضخم الشراكات السنوية في أهم المواقع الاستراتيجية (محبس الجن، أجياد، والمسفلة). واليوم، نتوج هذه المسيرة بفندقنا الخاص "برستيج أجياد"، إلى جانب إدارتنا وتشغيلنا لأكثر من 7 فنادق راقية ومجهزة بالكامل لاستقبال الحجاج والمعتمرين. مع "برستيج"، أنت لا تحجز إقامة فقط، بل تضمن منظومة خدمات متكاملة تليق بك وبضيوفك.')}
                        as="span"
                        multiline={true}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Numbers & Stats */}
              {about.showStats !== false && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {about.showYearsExperience !== false && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
                      <strong className="text-2xl sm:text-3xl font-bold text-[#B38A34] block mb-1 font-mono">
                        {language === 'en' ? '15+ Years' : (about.yearsExperience || '١٥+ عاماً')}
                      </strong>
                      <span className="text-xs text-stone-500 font-medium">
                        {t('about.experienceYears', 'خبرة متخصصة في قطاع الحج والعمرة')}
                      </span>
                    </div>
                  )}

                  {about.showServedGuests !== false && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
                      <strong className="text-2xl sm:text-3xl font-bold text-[#B38A34] block mb-1 font-mono">
                        {language === 'en' ? '120,000+' : (about.servedGuests || '١٢٠,٠٠٠+')}
                      </strong>
                      <span className="text-xs text-stone-500 font-medium">
                        {t('about.servedGuests', 'حاج ومعتمر سُعدنا بخدمتهم')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main Photo Card */}
            {about.showMainPhoto !== false && (
              <div 
                onClick={() => mainPhoto && openImageInLightbox(mainPhoto)}
                className={`lg:col-span-6 relative rounded-3xl overflow-hidden border border-[#C9A24B]/30 shadow-xl aspect-[4/3] ${
                  mainPhoto ? 'bg-stone-100 group cursor-pointer' : 'bg-gradient-to-br from-[#1C1917] via-[#2A241C] to-[#1C1917] flex items-center justify-center p-8'
                }`}
                title={mainPhoto ? t('about.zoomMainPhoto', 'انقر لتكبير ومعاينة الصورة') : undefined}
              >
                {mainPhoto ? (
                  <>
                    <img
                      src={mainPhoto}
                      alt="مقر شركة برستيج لإدارة وتشغيل الفنادق"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Click to zoom overlay */}
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#C9A24B]" />
                      <span>{t('about.zoomMainPhoto', 'تكبير الصورة')}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-4 max-w-sm pb-16">
                    {logo ? (
                      <img src={logo} alt="Logo" className="h-20 w-auto mx-auto object-contain filter drop-shadow-[0_0_15px_rgba(201,162,75,0.4)]" />
                    ) : (
                      <div className="w-16 h-16 rounded-3xl bg-[#C9A24B]/20 text-[#DFBE72] mx-auto flex items-center justify-center border border-[#C9A24B]/40">
                        <Building2 className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-cairo font-bold text-lg text-white">
                        {about.title || 'شركة برستيج لإدارة وتشغيل الفنادق'}
                      </h4>
                      <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                        {about.subtitle || 'إدارة وتشغيل الفنادق والضيافة الفاخرة لضيوف الرحمن'}
                      </p>
                    </div>
                  </div>
                )}
                
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
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. OFFICE LOCATION & HEADQUARTERS SHOWCASE CARD */}
        {/* ========================================================= */}
        {about.showOfficeSection !== false && (
          <div id="office-location-section" className="mb-20">
            <div className="bg-gradient-to-br from-white via-white to-amber-50/40 rounded-3xl border border-[#C9A24B]/30 p-6 sm:p-10 shadow-lg space-y-6">
              
              {/* If multiple active branches exist, show sleek switcher tabs */}
              {about.showBranchSwitcher !== false && activeBranches.length > 1 && (
                <div className="flex items-center gap-2 pb-2 overflow-x-auto no-scrollbar border-b border-stone-200/80">
                  <span className="text-xs font-bold text-stone-500 shrink-0 ml-2">
                    {language === 'en' ? 'Select Branch:' : 'اختر الفرع لعرض موقعه:'}
                  </span>
                  {activeBranches.map((branch) => {
                    const isSelected = branch.id === (currentBranch?.id || selectedBranchId);
                    return (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => setSelectedBranchId(branch.id)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#C9A24B] text-white shadow-sm'
                            : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{translateDynamic(branch.name)}</span>
                        {branch.isMainBranch && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-normal ${isSelected ? 'bg-white/25 text-white' : 'bg-[#C9A24B]/15 text-[#B38A34]'}`}>
                            {language === 'en' ? 'Main' : 'الرئيسي'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-stone-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#C9A24B] text-white flex items-center justify-center shadow-md shadow-[#C9A24B]/30 shrink-0">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    {about.showOfficeBadge !== false && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#B38A34] uppercase tracking-wide">
                          <EditableText
                            contentKey="about.office.sectionBadge"
                            fallback={language === 'en' ? 'Official Branch Location' : 'الموقع الجغرافي والفرع المعتمد'}
                            inline={true}
                          />
                        </span>
                        {currentBranch?.isMainBranch && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A24B]/15 text-[#B38A34] border border-[#C9A24B]/30">
                            {language === 'en' ? 'Headquarters' : 'المقر الرئيسي'}
                          </span>
                        )}
                      </div>
                    )}
                    {about.showOfficeTitle !== false && (
                      <h3 className="text-xl sm:text-2xl font-cairo font-bold text-stone-900 mt-0.5">
                        {translateDynamic(branchTitle)}
                      </h3>
                    )}
                  </div>
                </div>

              {about.showOfficeMapButton !== false && (
                <a
                  href={officeMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#C9A24B]/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{t('about.viewMap', 'فتح اللوكيشن على خرائط جوجل')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Office Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Address */}
              {about.showOfficeAddress !== false && (
                <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-[#B38A34] font-bold text-xs">
                    <MapPin className="w-4 h-4" />
                    <span>{language === 'en' ? 'Address & City' : 'العنوان والمدينة'}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-stone-800 leading-relaxed">
                    {translateDynamic(branchAddress)}
                  </div>
                  <span className="text-[11px] text-[#B38A34] block font-medium">
                    {translateDynamic(branchCity)}
                  </span>
                </div>
              )}

              {/* Working Hours */}
              {about.showOfficeWorkingHours !== false && (
                <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-[#B38A34] font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>{t('about.workingHoursTitle', 'أوقات وساعات العمل')}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-stone-800">
                    {translateDynamic(branchWorkingHours)}
                  </div>
                  <span className="text-[11px] text-stone-500 block">
                    {language === 'en' ? 'Every day throughout all seasons' : 'طوال أيام الأسبوع والمواسم'}
                  </span>
                </div>
              )}

              {/* Direct Phone */}
              {about.showOfficePhone !== false && (
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
                    href={`tel:${branchPhone}`}
                    className="text-xs sm:text-sm font-bold font-mono text-stone-900 hover:text-[#B38A34] block transition-colors dir-ltr text-right"
                  >
                    {branchPhone}
                  </a>
                  <span className="text-[11px] text-stone-500 block">
                    {language === 'en' ? 'Accommodation & Bookings' : 'استفسارات التسكين والحجوزات'}
                  </span>
                </div>
              )}

              {/* Direct WhatsApp */}
              {about.showOfficeWhatsApp !== false && (
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
                    {branchWhatsApp}
                  </a>
                  <span className="text-[11px] text-emerald-600 block font-medium">
                    {language === 'en' ? 'Instant Consultant Response' : 'رد فوري من المستشار'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* ========================================================= */}
        {/* 4. OFFICE & COMPANY PHOTOS ALBUM (WITH PNG UPLOAD) */}
        {/* ========================================================= */}
        {about.showPhotoAlbum !== false && (photos.length > 0 || (isAdminLoggedIn && isEditMode)) && (
          <div className="mb-20 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold mb-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Photo Album' : 'ألبوم الصور'}</span>
                </div>
                {about.showPhotoAlbumTitle !== false && (
                  <h3 className="text-2xl font-cairo font-bold text-stone-900">
                    <EditableText
                      contentKey="about.album.title"
                      fallback={language === 'en' 
                        ? 'Photos from Company Headquarters, Reception & Team' 
                        : 'صور من مقر الشركة، مكاتب الاستقبال، وفريق العمل'}
                      as="span"
                    />
                  </h3>
                )}
              </div>

              {/* Upload PNG Photos Button (Always available for admin / edit mode) */}
              <div className="flex items-center gap-2 flex-wrap">
                {(isAdminLoggedIn && isEditMode && about.showPhotoAlbumUploadButton !== false) && (
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

                {photos.length > 0 && (
                  <span className="text-xs text-stone-500">
                    {language === 'en' 
                      ? 'Click any photo to view in high resolution' 
                      : 'انقر على أي صورة لتكبيرها واستعراضها بجودة عالية'}
                  </span>
                )}
              </div>
            </div>

            {photos.length > 0 ? (
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
                        <Eye className="w-4 h-4 text-[#B38A34]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-stone-50 border border-dashed border-stone-300 text-xs text-stone-500">
                {language === 'en' ? 'No photos in album yet. Use the button above to add photos.' : 'لا توجد صور في الألبوم حالياً. استخدم الزر بالأعلى لإضافة صور لمقر الشركة.'}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. INTEGRATED HOSPITALITY SERVICES */}
        {/* ========================================================= */}
        {about.showIntegratedServices !== false && (
          <div className="mb-20">
            <IntegratedServices 
              onNavigate={onNavigate} 
              className="!py-0 !bg-transparent" 
              settings={siteSettings?.integratedServices}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. CORE VALUES & PILLARS */}
        {/* ========================================================= */}
        {about.showValuePillars !== false && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {(about.valuePillars && about.valuePillars.length > 0 ? about.valuePillars : DEFAULT_VALUE_PILLARS)
              .filter(pillar => pillar.isActive !== false)
              .map((pillar) => (
                <div 
                  key={pillar.id} 
                  className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col items-start hover:border-[#C9A24B]/50 transition-all hover:shadow-md group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <PillarIcon iconName={pillar.iconName} customIconUrl={pillar.customIconUrl} className="w-6 h-6 text-[#B38A34]" />
                  </div>
                  {pillar.showTitle !== false && (
                    <h3 className="font-cairo font-bold text-xl text-stone-900 mb-2">
                      <EditableText
                        contentKey={`about.pillar.${pillar.id}.title`}
                        fallback={language === 'en' ? (pillar.titleEn || pillar.title) : pillar.title}
                        as="span"
                      />
                    </h3>
                  )}
                  {pillar.showDescription !== false && (
                    <div className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      <EditableText
                        contentKey={`about.pillar.${pillar.id}.desc`}
                        fallback={language === 'en' ? (pillar.descriptionEn || pillar.description) : pillar.description}
                        as="span"
                        multiline={true}
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. ACTION CTA */}
        {/* ========================================================= */}
        {(about.showCtaSection !== false && (about as any).showCtaBanner !== false) && (
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#98752B] via-[#C9A24B] to-[#DFBE72] text-white text-center space-y-6 shadow-xl">
            {(about.showCtaTitle !== false || about.showCtaSubtitle !== false) && (
              <div className="max-w-2xl mx-auto space-y-2">
                {about.showCtaTitle !== false && (
                  <h3 className="text-2xl sm:text-3xl font-cairo font-bold">
                    <EditableText
                      contentKey="about.cta.title"
                      fallback={language === 'en' 
                        ? 'Planning an upcoming Umrah or Hajj journey?' 
                        : 'هل تخطط لرحلة عمرة أو حج قادمة؟'}
                      as="span"
                    />
                  </h3>
                )}
                {about.showCtaSubtitle !== false && (
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
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              {about.showCtaHotelsButton !== false && (
                <button
                  onClick={() => onNavigate('hotels')}
                  className="px-8 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-900 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{t('hero.exploreHotels', 'استعرض فنادق مكة والمدينة')}</span>
                  <ArrowLeft className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
                </button>
              )}

              {about.showCtaConsultantButton !== false && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3.5 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                  <span>{t('hero.contactConsultant', 'تحدث مع مستشار التسكين')}</span>
                </a>
              )}
            </div>
          </div>
        )}

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
                  <Building2 className="w-4 h-4" />
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
                <button
                  type="button"
                  onClick={handleOpenLogoInTab}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold border border-stone-300 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title={language === 'en' ? 'Open image in new tab' : 'فتح الصورة الأصلية في تبويب جديد'}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#B38A34]" />
                  <span>{language === 'en' ? 'Open in Tab' : 'فتح في تبويب'}</span>
                </button>

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
