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
  Eye,
  EyeOff,
  Sparkles,
  Edit3,
  Tag,
  Save,
  RotateCcw,
  Layers,
  FileText,
  Compass,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { AboutPageSettings, SiteSettings, ValuePillar, StoryTeaserSettings, StoryLocationTag, StoryShowcasePoint, IntegratedServicesSettings } from '../types';
import { DEFAULT_STORY_TEASER, DEFAULT_INTEGRATED_SERVICES } from '../services/firebase';
import { AdminServicesManager } from './AdminServicesManager';
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
  storyTeaser?: StoryTeaserSettings;
  integratedServices?: IntegratedServicesSettings;
  onUpdateStoryTeaser?: (data: StoryTeaserSettings) => void;
  onUpdateIntegratedServices?: (data: IntegratedServicesSettings) => void;
  onUpdateAboutUs: (data: AboutPageSettings, updatedLogoUrl?: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminAboutManager: React.FC<AdminAboutManagerProps> = ({
  aboutUs = {} as AboutPageSettings,
  siteLogoUrl = '',
  storyTeaser = DEFAULT_STORY_TEASER,
  integratedServices = DEFAULT_INTEGRATED_SERVICES,
  onUpdateStoryTeaser,
  onUpdateIntegratedServices,
  onUpdateAboutUs,
  onShowToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'story' | 'services' | 'mission' | 'pillars' | 'office' | 'photos' | 'cta'>('story');

  // Story Teaser state
  const [storyForm, setStoryForm] = useState<StoryTeaserSettings>({
    ...DEFAULT_STORY_TEASER,
    ...(storyTeaser || {})
  });

  const [newTagText, setNewTagText] = useState('');

  // About Page state
  const [form, setForm] = useState<AboutPageSettings>({
    title: aboutUs.title || 'برستيج.. حيث تلتقي فخامة الضيافة بروحانية المكان',
    subtitle: aboutUs.subtitle || 'منذ عام 2010، انطلقت "برستيج لإدارة وتشغيل الفنادق" من قلب العاصمة المقدسة لتُعيد صياغة مفهوم الضيافة وخدمة ضيوف الرحمن.',
    badge: aboutUs.badge || 'شرف خدمة ضيوف الرحمن',
    missionTitle: aboutUs.missionTitle || 'مسيرتنا: صناعة تجارب إقامة استثنائية وشراكات استراتيجية',
    missionText1: aboutUs.missionText1 || 'منذ عام 2010، انطلقت "برستيج لإدارة وتشغيل الفنادق" من قلب العاصمة المقدسة لتُعيد صياغة مفهوم الضيافة وخدمة ضيوف الرحمن. لم نكتفِ يوماً بتقديم مجرد غرف فندقية، بل أخذنا على عاتقنا صناعة تجارب إقامة استثنائية تمزج بين الرفاهية والراحة التامة.',
    missionText2: aboutUs.missionText2 || 'بفضل الله ثم بثقة عملائنا من الشركات والمجموعات، امتدت مسيرة نجاحنا من مكة المكرمة إلى رحاب المدينة المنورة، لنعقد أضخم الشراكات السنوية في أهم المواقع الاستراتيجية (محبس الجن، أجياد، والمسفلة). واليوم، نتوج هذه المسيرة بفندقنا الخاص "برستيج أجياد"، إلى جانب إدارتنا وتشغيلنا لأكثر من 7 فنادق راقية ومجهزة بالكامل لاستقبال الحجاج والمعتمرين. مع "برستيج"، أنت لا تحجز إقامة فقط، بل تضمن منظومة خدمات متكاملة تليق بك وبضيوفك.',
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
    showLogoCard: aboutUs.showLogoCard !== false,
    showBadge: aboutUs.showBadge !== false,
    showTitle: aboutUs.showTitle !== false,
    showSubtitle: aboutUs.showSubtitle !== false,
    showStorySection: aboutUs.showStorySection !== false,
    showMissionTitle: aboutUs.showMissionTitle !== false,
    showStoryParagraphs: aboutUs.showStoryParagraphs !== false,
    showMissionText1: aboutUs.showMissionText1 !== false,
    showMissionText2: aboutUs.showMissionText2 !== false,
    showStats: aboutUs.showStats !== false,
    showYearsExperience: aboutUs.showYearsExperience !== false,
    showServedGuests: aboutUs.showServedGuests !== false,
    showMainPhoto: aboutUs.showMainPhoto !== false,
    showVisionSection: aboutUs.showVisionSection !== false,
    showVisionTitle: aboutUs.showVisionTitle !== false,
    showVisionText: aboutUs.showVisionText !== false,
    showOfficeSection: aboutUs.showOfficeSection !== false,
    showOfficeBadge: aboutUs.showOfficeBadge !== false,
    showOfficeTitle: aboutUs.showOfficeTitle !== false,
    showBranchSwitcher: aboutUs.showBranchSwitcher !== false,
    showOfficeMapButton: aboutUs.showOfficeMapButton !== false,
    showOfficeAddress: aboutUs.showOfficeAddress !== false,
    showOfficeHours: aboutUs.showOfficeHours !== false,
    showOfficePhone: aboutUs.showOfficePhone !== false,
    showOfficeWhatsApp: aboutUs.showOfficeWhatsApp !== false,
    showOfficeEmail: aboutUs.showOfficeEmail !== false,
    showPhotoAlbum: aboutUs.showPhotoAlbum !== false,
    showPhotoAlbumTitle: aboutUs.showPhotoAlbumTitle !== false,
    showPhotoAlbumUploadButton: aboutUs.showPhotoAlbumUploadButton !== false,
    showValuePillars: aboutUs.showValuePillars !== false,
    showCtaSection: aboutUs.showCtaSection !== false,
    showCtaBanner: aboutUs.showCtaBanner !== false,
    showCtaTitle: aboutUs.showCtaTitle !== false,
    showCtaSubtitle: aboutUs.showCtaSubtitle !== false,
    showCtaHotelsButton: aboutUs.showCtaHotelsButton !== false,
    showCtaConsultantButton: aboutUs.showCtaConsultantButton !== false,
    photos: Array.isArray(aboutUs.photos) ? aboutUs.photos : [],
    mainPhoto: aboutUs.mainPhoto || '',
    logoUrl: aboutUs.logoUrl || siteLogoUrl || '',
    valuePillars: aboutUs.valuePillars && aboutUs.valuePillars.length > 0 ? aboutUs.valuePillars : DEFAULT_VALUE_PILLARS
  });

  const allPhotos = form.photos || [];

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

  // Logo Upload Handlers
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

  // Photos Multi-upload Handlers
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

  const handleDeletePhoto = (photoUrl: string) => {
    const current = form.photos || [];
    const updated = current.filter((p) => p !== photoUrl);
    const newMain = form.mainPhoto === photoUrl ? (updated[0] || '') : form.mainPhoto;
    setForm((prev) => ({ ...prev, photos: updated, mainPhoto: newMain }));
    onShowToast('تم حذف الصورة من الألبوم', 'info');
  };

  const handleSetMainPhoto = (photoUrl: string) => {
    setForm((prev) => ({ ...prev, mainPhoto: photoUrl }));
    onShowToast('تم تعيين الصورة كغلاف رئيسي لصفحة "من نحن"', 'success');
  };

  // Pillars Management
  const handleUpdatePillar = (id: string, updates: Partial<ValuePillar>) => {
    setForm((prev) => ({
      ...prev,
      valuePillars: (prev.valuePillars || DEFAULT_VALUE_PILLARS).map((p) =>
        p.id === id ? { ...p, ...updates } : p
      )
    }));
  };

  const handleAddPillar = () => {
    const newPillar: ValuePillar = {
      id: `pillar_${Date.now()}`,
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

  // Story Teaser Handlers
  const handleAddTag = () => {
    if (!newTagText.trim()) return;
    const newTag: StoryLocationTag = {
      id: `tag_${Date.now()}`,
      text: newTagText.trim(),
      iconName: 'Building2',
      isActive: true
    };
    const updatedTags = [...(storyForm.locationTags || []), newTag];
    const updated = { ...storyForm, locationTags: updatedTags };
    setStoryForm(updated);
    setNewTagText('');
    if (onUpdateStoryTeaser) onUpdateStoryTeaser(updated);
    onShowToast(`تمت إضافة الوسم "${newTag.text}"`, 'success');
  };

  const handleToggleTag = (tagId: string) => {
    const updatedTags = (storyForm.locationTags || []).map(t => 
      t.id === tagId ? { ...t, isActive: t.isActive === false ? true : false } : t
    );
    const updated = { ...storyForm, locationTags: updatedTags };
    setStoryForm(updated);
    if (onUpdateStoryTeaser) onUpdateStoryTeaser(updated);
  };

  const handleDeleteTag = (tagId: string) => {
    const updatedTags = (storyForm.locationTags || []).filter(t => t.id !== tagId);
    const updated = { ...storyForm, locationTags: updatedTags };
    setStoryForm(updated);
    if (onUpdateStoryTeaser) onUpdateStoryTeaser(updated);
    onShowToast('تم حذف الوسم', 'info');
  };

  const handleUpdateStoryPoint = (pointId: string, title: string, description: string) => {
    const updatedPoints = (storyForm.showcasePoints || []).map(p =>
      p.id === pointId ? { ...p, title, description } : p
    );
    const updated = { ...storyForm, showcasePoints: updatedPoints };
    setStoryForm(updated);
    if (onUpdateStoryTeaser) onUpdateStoryTeaser(updated);
  };

  const handleResetStoryToDefault = () => {
    if (window.confirm('هل تريد استعادة النصوص الافتراضية لقسم نبذة وقصة الشركة؟')) {
      setStoryForm(DEFAULT_STORY_TEASER);
      if (onUpdateStoryTeaser) onUpdateStoryTeaser(DEFAULT_STORY_TEASER);
      onShowToast('تمت استعادة النصوص الافتراضية للنبذة بنجاح', 'info');
    }
  };

  // Master Save
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const dataToSave: AboutPageSettings = {
      ...form,
      logoUrl: currentLogo
    };
    onUpdateAboutUs(dataToSave, currentLogo);
    if (onUpdateStoryTeaser) {
      onUpdateStoryTeaser(storyForm);
    }
    onShowToast('تم حفظ وتحديث بيانات "من نحن والنبذة التعريفية" بنجاح 🎉', 'success');
  };

  // Helper toggle component
  const VisibilityToggle = ({ 
    active, 
    onToggle, 
    label 
  }: { 
    active: boolean; 
    onToggle: () => void; 
    label?: string;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
        active 
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100' 
          : 'bg-stone-100 text-stone-500 border border-stone-300 hover:bg-stone-200'
      }`}
      title={active ? 'ظاهر بالموقع (انقر للإخفاء)' : 'مخفي (انقر للإظهار)'}
    >
      {active ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
      <span>{label || (active ? 'ظاهر' : 'مخفي')}</span>
    </button>
  );

  return (
    <div id="admin-about-manager" className="space-y-8 animate-fadeIn">
      {/* Top Banner & Save CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>إدارة النبذة وقصة الشركة وصفحة من نحن</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-cairo font-bold text-stone-900">
            التحكم الكامل في إظهار وإخفاء النصوص والبطاقات والأزرار
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            تحكم دقيق في كل عنوان، فقرة، زر، بطاقة، وصورة في صفحة "من نحن" وقسم "نبذة وقصة الشركة" بالصفحة الرئيسية.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSaveAll()}
          className="px-6 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md shadow-[#C9A24B]/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Check className="w-4 h-4" />
          <span>حفظ جميع التعديلات</span>
        </button>
      </div>

      {/* Modern Apple-style Sub-navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 no-scrollbar">
        {[
          { id: 'story' as const, label: '١. نبذة وقصة الشركة (Story Teaser)', icon: Sparkles },
          { id: 'services' as const, label: '٢. منظومة الخدمات المتكاملة (Services)', icon: Layers },
          { id: 'mission' as const, label: '٣. الرسالة، الرؤية ومسيرة النجاح', icon: Compass },
          { id: 'pillars' as const, label: '٤. ركائز ومميزات الضيافة', icon: Award },
          { id: 'office' as const, label: '٥. المقر الرئيسي والتراخيص', icon: MapPin },
          { id: 'photos' as const, label: '٦. الشعار وألبوم صور المقر', icon: ImageIcon },
          { id: 'cta' as const, label: '٧. شريط الدعوة للحجز (CTA)', icon: ArrowLeft }
        ].map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-[#C9A24B] text-white shadow-sm'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB: INTEGRATED SERVICES (منظومة الخدمات المتكاملة) */}
      {/* ========================================================= */}
      {activeSubTab === 'services' && (
        <div className="animate-fadeIn">
          <AdminServicesManager
            integratedServices={integratedServices}
            onUpdateIntegratedServices={(updated) => {
              if (onUpdateIntegratedServices) onUpdateIntegratedServices(updated);
            }}
            onShowToast={onShowToast}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 1: STORY TEASER & NARRATIVE (النبذة وقصة الشركة) */}
      {/* ========================================================= */}
      {activeSubTab === 'story' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-8 animate-fadeIn">
          {/* Header & Main Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  نصوص نبذة وقصة الشركة في الصفحة الرئيسية
                </h3>
                <p className="text-xs text-stone-500">
                  تظهر هذه النبذة في الصفحة الرئيسية لتعريف الزوار بمسيرة برستيج وتاريخ الضيافة.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Master Enable/Disable Switch */}
              <button
                type="button"
                onClick={() => {
                  const updated = { ...storyForm, isEnabled: !storyForm.isEnabled };
                  setStoryForm(updated);
                  if (onUpdateStoryTeaser) onUpdateStoryTeaser(updated);
                  onShowToast(
                    updated.isEnabled ? 'تم تفعيل ظهور قسم نبذة الشركة' : 'تم إخفاء قسم نبذة الشركة من الموقع',
                    'success'
                  );
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  storyForm.isEnabled !== false
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                }`}
              >
                {storyForm.isEnabled !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{storyForm.isEnabled !== false ? 'القسم مفعّل وظاهر' : 'القسم مخفي بالكامل'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetStoryToDefault}
                className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="استعادة النصوص الأصلية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الافتراضي</span>
              </button>
            </div>
          </div>

          {/* Story Titles & Badges */}
          <div className="space-y-5">
            <h4 className="font-cairo font-bold text-stone-900 text-sm flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#B38A34]" />
              <span>العناوين والفقرات التعريفية وإظهارها/إخفاؤها</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">
                    الشارة العلوية (Badge):
                  </label>
                  <VisibilityToggle
                    active={storyForm.showBadge !== false}
                    onToggle={() => setStoryForm({ ...storyForm, showBadge: storyForm.showBadge === false })}
                  />
                </div>
                <input
                  type="text"
                  value={storyForm.badge || ''}
                  onChange={(e) => setStoryForm({ ...storyForm, badge: e.target.value })}
                  placeholder="نبذة عن شركة برستيج"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">
                    العنوان الرئيسي للنبذة:
                  </label>
                  <VisibilityToggle
                    active={storyForm.showTitle !== false}
                    onToggle={() => setStoryForm({ ...storyForm, showTitle: storyForm.showTitle === false })}
                  />
                </div>
                <input
                  type="text"
                  value={storyForm.title || ''}
                  onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                  placeholder="برستيج.. حيث تلتقي فخامة الضيافة بروحانية المكان"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
            </div>

            {/* Paragraph 1 */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">
                  الفقرة الأولى (الانطلاقة والرسالة منذ 2010):
                </label>
                <VisibilityToggle
                  active={storyForm.showStory1 !== false}
                  onToggle={() => setStoryForm({ ...storyForm, showStory1: storyForm.showStory1 === false })}
                />
              </div>
              <textarea
                rows={3}
                value={storyForm.paragraph1 || ''}
                onChange={(e) => setStoryForm({ ...storyForm, paragraph1: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] leading-relaxed"
              />
            </div>

            {/* Paragraph 2 */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">
                  الفقرة الثانية (التوسع من مكة إلى المدينة والشراكات السنوية):
                </label>
                <VisibilityToggle
                  active={storyForm.showStory2 !== false}
                  onToggle={() => setStoryForm({ ...storyForm, showStory2: storyForm.showStory2 === false })}
                />
              </div>
              <textarea
                rows={2}
                value={storyForm.paragraph2 || ''}
                onChange={(e) => setStoryForm({ ...storyForm, paragraph2: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] leading-relaxed"
              />
            </div>

            {/* Paragraph 3 */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">
                  الفقرة الثالثة (صندوق التتويج بفندق برستيج أجياد والـ 7 فنادق):
                </label>
                <VisibilityToggle
                  active={storyForm.showStory3 !== false}
                  onToggle={() => setStoryForm({ ...storyForm, showStory3: storyForm.showStory3 === false })}
                />
              </div>
              <textarea
                rows={3}
                value={storyForm.paragraph3 || ''}
                onChange={(e) => setStoryForm({ ...storyForm, paragraph3: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-semibold focus:outline-none focus:border-[#C9A24B] leading-relaxed"
              />
            </div>

            {/* Action Buttons Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">زر "استكشف فنادقنا المعتمدة"</span>
                  <span className="text-[11px] text-stone-500">ينقل الزائر لقائمة الفنادق</span>
                </div>
                <VisibilityToggle
                  active={storyForm.showExploreButton !== false}
                  onToggle={() => setStoryForm({ ...storyForm, showExploreButton: storyForm.showExploreButton === false })}
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">زر "تواصل مع مستشار التسكين"</span>
                  <span className="text-[11px] text-stone-500">ينقل الزائر لصفحة التواصل</span>
                </div>
                <VisibilityToggle
                  active={storyForm.showContactButton !== false}
                  onToggle={() => setStoryForm({ ...storyForm, showContactButton: storyForm.showContactButton === false })}
                />
              </div>
            </div>
          </div>

          {/* Location Tags Management */}
          <div className="pt-6 border-t border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-cairo font-bold text-stone-900 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#B38A34]" />
                <span>وسوم المواقع والشراكات (Location Badges)</span>
              </h4>
              <VisibilityToggle
                active={storyForm.showLocationTags !== false}
                onToggle={() => setStoryForm({ ...storyForm, showLocationTags: storyForm.showLocationTags === false })}
                label={storyForm.showLocationTags !== false ? 'الوسوم ظاهرة' : 'الوسوم مخفية'}
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="أدخل نص وسم جديد (مثال: فنادق محبس الجن للعمرة)"
                className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة وسم</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(storyForm.locationTags || []).map((tag) => (
                <div
                  key={tag.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    tag.isActive !== false
                      ? 'bg-stone-100 border-stone-300 text-stone-800'
                      : 'bg-stone-50 border-dashed border-stone-200 text-stone-400 opacity-60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    className="cursor-pointer hover:text-[#B38A34]"
                    title={tag.isActive !== false ? 'إخفاء الوسم' : 'إظهار الوسم'}
                  >
                    {tag.isActive !== false ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
                  </button>
                  <span>{tag.text}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(tag.id)}
                    className="cursor-pointer text-stone-400 hover:text-red-600 p-0.5"
                    title="حذف الوسم"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dark Showcase Box Settings (Left Card) */}
          <div className="pt-6 border-t border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-cairo font-bold text-stone-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#B38A34]" />
                <span>البطاقة الجانبية الفاخرة (Dark Showcase Card)</span>
              </h4>
              <VisibilityToggle
                active={storyForm.showShowcaseCard !== false}
                onToggle={() => setStoryForm({ ...storyForm, showShowcaseCard: storyForm.showShowcaseCard === false })}
                label={storyForm.showShowcaseCard !== false ? 'البطاقة ظاهرة' : 'البطاقة مخفية'}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">سنة التأسيس / الشارة:</label>
                  <VisibilityToggle
                    active={storyForm.showEstablishedYear !== false}
                    onToggle={() => setStoryForm({ ...storyForm, showEstablishedYear: storyForm.showEstablishedYear === false })}
                  />
                </div>
                <input
                  type="text"
                  value={storyForm.showcaseEstablishedYear || ''}
                  onChange={(e) => setStoryForm({ ...storyForm, showcaseEstablishedYear: e.target.value })}
                  placeholder="منذ 2010 م"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">عنوان شارة البطاقة:</label>
                </div>
                <input
                  type="text"
                  value={storyForm.showcaseBadge || ''}
                  onChange={(e) => setStoryForm({ ...storyForm, showcaseBadge: e.target.value })}
                  placeholder="شراكات استراتيجية موثوقة"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">العنوان الرئيسي للبطاقة:</label>
                  <VisibilityToggle
                    active={storyForm.showShowcaseTitle !== false}
                    onToggle={() => setStoryForm({ ...storyForm, showShowcaseTitle: storyForm.showShowcaseTitle === false })}
                  />
                </div>
                <input
                  type="text"
                  value={storyForm.showcaseTitle || ''}
                  onChange={(e) => setStoryForm({ ...storyForm, showcaseTitle: e.target.value })}
                  placeholder="إدارة وتشغيل أكثر من 7 فنادق راقية بمكة والمدينة"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
            </div>

            {/* Showcase Points */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">
                  النقاط المميزة داخل البطاقة:
                </label>
                <VisibilityToggle
                  active={storyForm.showShowcasePoints !== false}
                  onToggle={() => setStoryForm({ ...storyForm, showShowcasePoints: storyForm.showShowcasePoints === false })}
                />
              </div>

              {(storyForm.showcasePoints || []).map((point, pIdx) => (
                <div key={point.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#B38A34]">النقطة رقم {pIdx + 1}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={point.title}
                      onChange={(e) => handleUpdateStoryPoint(point.id, e.target.value, point.description)}
                      placeholder="عنوان النقطة"
                      className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                    />
                    <input
                      type="text"
                      value={point.description}
                      onChange={(e) => handleUpdateStoryPoint(point.id, point.title, e.target.value)}
                      placeholder="وصف النقطة"
                      className="sm:col-span-2 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#C9A24B]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* License Note Toggle */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-800 block">شارة الترخيص أسفل البطاقة</span>
                <span className="text-[11px] text-stone-500">"مرخصون من وزارة الحج والعمرة والهيئة العامة للسياحة"</span>
              </div>
              <VisibilityToggle
                active={storyForm.showLicenseNote !== false && storyForm.showShowcaseLicense !== false}
                onToggle={() => {
                  const val = !(storyForm.showLicenseNote !== false && storyForm.showShowcaseLicense !== false);
                  setStoryForm({ ...storyForm, showLicenseNote: val, showShowcaseLicense: val });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: MISSION & VISION (الرسالة والرؤية ومسيرة النجاح) */}
      {/* ========================================================= */}
      {activeSubTab === 'mission' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
            <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cairo font-bold text-lg text-stone-900">
                الرسالة، الرؤية، وإحصائيات الخبرة (صفحة من نحن)
              </h3>
              <p className="text-xs text-stone-500">
                تحكم في إظهار وإخفاء كل عنوان، فقرة، وإحصائية في صفحة "من نحن".
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Main Header / Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">العنوان الرئيسي لصفحة من نحن:</label>
                  <VisibilityToggle
                    active={form.showTitle !== false}
                    onToggle={() => setForm({ ...form, showTitle: form.showTitle === false })}
                  />
                </div>
                <input
                  type="text"
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">الشارة الترحيبية (Badge):</label>
                  <VisibilityToggle
                    active={form.showBadge !== false}
                    onToggle={() => setForm({ ...form, showBadge: form.showBadge === false })}
                  />
                </div>
                <input
                  type="text"
                  value={form.badge || ''}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
            </div>

            {/* Subtitle */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">المقدمة والنبذة العامة لصفحة من نحن:</label>
                <VisibilityToggle
                  active={form.showSubtitle !== false}
                  onToggle={() => setForm({ ...form, showSubtitle: form.showSubtitle === false })}
                />
              </div>
              <textarea
                rows={2}
                value={form.subtitle || ''}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
              />
            </div>

            {/* Stats section */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="text-xs font-bold text-stone-800">إحصائيات الخبرة والأرقام</span>
                <VisibilityToggle
                  active={form.showStats !== false}
                  onToggle={() => setForm({ ...form, showStats: form.showStats === false })}
                  label={form.showStats !== false ? 'قسم الأرقام ظاهر' : 'قسم الأرقام مخفي'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">سنوات الخبرة:</label>
                    <VisibilityToggle
                      active={form.showYearsExperience !== false}
                      onToggle={() => setForm({ ...form, showYearsExperience: form.showYearsExperience === false })}
                    />
                  </div>
                  <input
                    type="text"
                    value={form.yearsExperience || ''}
                    onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })}
                    placeholder="مثال: ١٥+ عاماً"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">عدد الضيوف المخدومين:</label>
                    <VisibilityToggle
                      active={form.showServedGuests !== false}
                      onToggle={() => setForm({ ...form, showServedGuests: form.showServedGuests === false })}
                    />
                  </div>
                  <input
                    type="text"
                    value={form.servedGuests || ''}
                    onChange={(e) => setForm({ ...form, servedGuests: e.target.value })}
                    placeholder="مثال: ١٢٠,٠٠٠+ معتمر"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>
            </div>

            {/* Story Section in About */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="text-xs font-bold text-stone-800">قسم مسيرة النجاح وتاريخ التأسيس</span>
                <VisibilityToggle
                  active={form.showStorySection !== false}
                  onToggle={() => setForm({ ...form, showStorySection: form.showStorySection === false })}
                  label={form.showStorySection !== false ? 'القسم ظاهر' : 'القسم مخفي'}
                />
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">عنوان مسيرة النجاح:</label>
                    <VisibilityToggle
                      active={form.showMissionTitle !== false}
                      onToggle={() => setForm({ ...form, showMissionTitle: form.showMissionTitle === false })}
                    />
                  </div>
                  <input
                    type="text"
                    value={form.missionTitle || ''}
                    onChange={(e) => setForm({ ...form, missionTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">الفقرة 1 (الانطلاقة والرسالة):</label>
                    <VisibilityToggle
                      active={form.showMissionText1 !== false}
                      onToggle={() => setForm({ ...form, showMissionText1: form.showMissionText1 === false })}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={form.missionText1 || ''}
                    onChange={(e) => setForm({ ...form, missionText1: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] leading-relaxed"
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">الفقرة 2 (الشراكات والتوسع):</label>
                    <VisibilityToggle
                      active={form.showMissionText2 !== false}
                      onToggle={() => setForm({ ...form, showMissionText2: form.showMissionText2 === false })}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={form.missionText2 || ''}
                    onChange={(e) => setForm({ ...form, missionText2: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Vision Section */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="text-xs font-bold text-stone-800">قسم الرؤية المستقبلية (Vision)</span>
                <VisibilityToggle
                  active={form.showVisionSection !== false}
                  onToggle={() => setForm({ ...form, showVisionSection: form.showVisionSection === false })}
                  label={form.showVisionSection !== false ? 'الرؤية ظاهرة' : 'الرؤية مخفية'}
                />
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">عنوان الرؤية المستقبلية:</label>
                    <VisibilityToggle
                      active={form.showVisionTitle !== false}
                      onToggle={() => setForm({ ...form, showVisionTitle: form.showVisionTitle === false })}
                    />
                  </div>
                  <input
                    type="text"
                    value={form.visionTitle || ''}
                    onChange={(e) => setForm({ ...form, visionTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">نص الرؤية المستقبلية:</label>
                    <VisibilityToggle
                      active={form.showVisionText !== false}
                      onToggle={() => setForm({ ...form, showVisionText: form.showVisionText === false })}
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={form.visionText || ''}
                    onChange={(e) => setForm({ ...form, visionText: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Action CTA Banner Controls */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">شريط الحجز السريع أسفل الصفحة (CTA Banner)</span>
                  <span className="text-[11px] text-stone-500">"هل تخطط لرحلة عمرة أو حج قادمة؟ تصفح فنادقنا أو تواصل مباشرة"</span>
                </div>
                <VisibilityToggle
                  active={form.showCtaSection !== false && form.showCtaBanner !== false}
                  onToggle={() => {
                    const nextVal = form.showCtaSection === false ? true : false;
                    setForm({ ...form, showCtaSection: nextVal, showCtaBanner: nextVal });
                  }}
                  label={form.showCtaSection !== false ? 'الشريط ظاهر' : 'الشريط مخفي'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">عنوان شريط الحجز (Title)</span>
                  <VisibilityToggle
                    active={form.showCtaTitle !== false}
                    onToggle={() => setForm({ ...form, showCtaTitle: form.showCtaTitle === false })}
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">الوصف الفرعي لشريط الحجز</span>
                  <VisibilityToggle
                    active={form.showCtaSubtitle !== false}
                    onToggle={() => setForm({ ...form, showCtaSubtitle: form.showCtaSubtitle === false })}
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-700 block">زر "استعرض فنادق مكة والمدينة"</span>
                    <span className="text-[10px] text-stone-400">ينقل المستخدم لقائمة الفنادق</span>
                  </div>
                  <VisibilityToggle
                    active={form.showCtaHotelsButton !== false}
                    onToggle={() => setForm({ ...form, showCtaHotelsButton: form.showCtaHotelsButton === false })}
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-700 block">زر "تحدث مع مستشار التسكين"</span>
                    <span className="text-[10px] text-stone-400">يفتح محادثة واتساب المباشرة</span>
                  </div>
                  <VisibilityToggle
                    active={form.showCtaConsultantButton !== false}
                    onToggle={() => setForm({ ...form, showCtaConsultantButton: form.showCtaConsultantButton === false })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: VALUE PILLARS (ركائز ومميزات الضيافة) */}
      {/* ========================================================= */}
      {activeSubTab === 'pillars' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  مميزات وركائز الخدمة / بطاقات القيمة الرئيسية
                </h3>
                <p className="text-xs text-stone-500">
                  تحكّم في بطاقات المميزات والركائز المودعة بالموقع مع إمكانية رفع أيقونات PNG مخصصة.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <VisibilityToggle
                active={form.showValuePillars !== false}
                onToggle={() => setForm({ ...form, showValuePillars: form.showValuePillars === false })}
                label={form.showValuePillars !== false ? 'قسم الركائز ظاهر' : 'قسم الركائز مخفي'}
              />

              <button
                type="button"
                onClick={handleAddPillar}
                className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة بطاقة ميزة</span>
              </button>
            </div>
          </div>

          {/* Cards List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(form.valuePillars || DEFAULT_VALUE_PILLARS).map((pillar, idx) => (
              <div 
                key={pillar.id}
                className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-4 relative group"
              >
                {/* Header: Number, Visibility & Remove */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#C9A24B] text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-stone-800">بطاقة الميزة</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <VisibilityToggle
                      active={pillar.isActive !== false}
                      onToggle={() => handleUpdatePillar(pillar.id, { isActive: pillar.isActive === false ? true : false })}
                      label={pillar.isActive !== false ? 'ظاهرة' : 'مخفية'}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePillar(pillar.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="حذف البطاقة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
                            className="text-[10px] text-red-500 hover:underline"
                          >
                            حذف PNG
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-stone-700">
                        عنوان الميزة (عربي):
                      </label>
                      <VisibilityToggle
                        active={pillar.showTitle !== false}
                        onToggle={() => handleUpdatePillar(pillar.id, { showTitle: pillar.showTitle === false })}
                      />
                    </div>
                    <input
                      type="text"
                      value={pillar.title || ''}
                      onChange={(e) => handleUpdatePillar(pillar.id, { title: e.target.value })}
                      placeholder="مثال: المصداقية المطلقة"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 outline-none focus:border-[#C9A24B]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-stone-700">
                        وصف الميزة (عربي):
                      </label>
                      <VisibilityToggle
                        active={pillar.showDescription !== false}
                        onToggle={() => handleUpdatePillar(pillar.id, { showDescription: pillar.showDescription === false })}
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={pillar.description || ''}
                      onChange={(e) => handleUpdatePillar(pillar.id, { description: e.target.value })}
                      placeholder="اكتب شرحاً للميزة..."
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 outline-none focus:border-[#C9A24B] leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: OFFICE & LICENSES (المقر الرئيسي والتراخيص) */}
      {/* ========================================================= */}
      {activeSubTab === 'office' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  المقر الرئيسي، بيانات الاتصال، والتراخيص المعتمدة
                </h3>
                <p className="text-xs text-stone-500">
                  تحكم في إظهار أو إخفاء بطاقة المقر ورابط خرائط Google والتراخيص الرسمية.
                </p>
              </div>
            </div>

            <VisibilityToggle
              active={form.showOfficeSection !== false}
              onToggle={() => setForm({ ...form, showOfficeSection: form.showOfficeSection === false })}
              label={form.showOfficeSection !== false ? 'قسم المقر ظاهر' : 'قسم المقر مخفي'}
            />
          </div>

          <div className="space-y-4">
            {/* Header elements: Title, Badge, Branch Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">عنوان قسم المقر</span>
                  <span className="text-[11px] text-stone-500">اسم الفرع / المقر المعتمد</span>
                </div>
                <VisibilityToggle
                  active={form.showOfficeTitle !== false}
                  onToggle={() => setForm({ ...form, showOfficeTitle: form.showOfficeTitle === false })}
                />
              </div>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">الشارة العلوية للمقر</span>
                  <span className="text-[11px] text-stone-500">الموقع الجغرافي والفرع المعتمد</span>
                </div>
                <VisibilityToggle
                  active={form.showOfficeBadge !== false}
                  onToggle={() => setForm({ ...form, showOfficeBadge: form.showOfficeBadge === false })}
                />
              </div>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">شريط التبديل بين الفروع</span>
                  <span className="text-[11px] text-stone-500">أزرار اختيار الفروع (مكة / المدينة)</span>
                </div>
                <VisibilityToggle
                  active={form.showBranchSwitcher !== false}
                  onToggle={() => setForm({ ...form, showBranchSwitcher: form.showBranchSwitcher === false })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <label className="text-xs font-bold text-stone-700 block">عنوان البطاقة (Title):</label>
                <input
                  type="text"
                  value={form.officeTitle || ''}
                  onChange={(e) => setForm({ ...form, officeTitle: e.target.value })}
                  placeholder="المقر الرئيسي لشركة برستيج لإدارة وتشغيل الفنادق"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <label className="text-xs font-bold text-stone-700 block">المدينة (City):</label>
                <input
                  type="text"
                  value={form.officeCity || ''}
                  onChange={(e) => setForm({ ...form, officeCity: e.target.value })}
                  placeholder="مكة المكرمة"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
            </div>

            {/* Address */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">العنوان التفصيلي للمقر:</label>
                <VisibilityToggle
                  active={form.showOfficeAddress !== false}
                  onToggle={() => setForm({ ...form, showOfficeAddress: form.showOfficeAddress === false })}
                />
              </div>
              <input
                type="text"
                value={form.officeAddress || ''}
                onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                placeholder="أبراج وقف الملك عبدالعزيز - مجمع أبراج البيت، طريق أجياد، مكة المكرمة"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
              />
            </div>

            {/* Google Maps Link */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">رابط الموقع على خرائط Google (Maps URL):</label>
                <VisibilityToggle
                  active={form.showOfficeMapButton !== false}
                  onToggle={() => setForm({ ...form, showOfficeMapButton: form.showOfficeMapButton === false })}
                  label={form.showOfficeMapButton !== false ? 'زر الخريطة ظاهر' : 'زر الخريطة مخفي'}
                />
              </div>
              <input
                type="url"
                value={form.officeMapUrl || ''}
                onChange={(e) => setForm({ ...form, officeMapUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-mono focus:outline-none focus:border-[#C9A24B]"
              />
            </div>

            {/* Contact Channels for Office */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">رقم الهاتف:</label>
                  <VisibilityToggle
                    active={form.showOfficePhone !== false}
                    onToggle={() => setForm({ ...form, showOfficePhone: form.showOfficePhone === false })}
                  />
                </div>
                <input
                  type="text"
                  value={form.officePhone || ''}
                  onChange={(e) => setForm({ ...form, officePhone: e.target.value })}
                  placeholder="+966501234567"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-mono focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">رقم الواتساب:</label>
                  <VisibilityToggle
                    active={form.showOfficeWhatsApp !== false}
                    onToggle={() => setForm({ ...form, showOfficeWhatsApp: form.showOfficeWhatsApp === false })}
                  />
                </div>
                <input
                  type="text"
                  value={form.officeWhatsApp || ''}
                  onChange={(e) => setForm({ ...form, officeWhatsApp: e.target.value })}
                  placeholder="+966501234567"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-mono focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">البريد الإلكتروني:</label>
                  <VisibilityToggle
                    active={form.showOfficeEmail !== false}
                    onToggle={() => setForm({ ...form, showOfficeEmail: form.showOfficeEmail === false })}
                  />
                </div>
                <input
                  type="email"
                  value={form.officeEmail || ''}
                  onChange={(e) => setForm({ ...form, officeEmail: e.target.value })}
                  placeholder="info@prestigehotels.sa"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-mono focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
            </div>

            {/* Working Hours */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">أوقات العمل واستقبال النزلاء:</label>
                <VisibilityToggle
                  active={form.showOfficeHours !== false}
                  onToggle={() => setForm({ ...form, showOfficeHours: form.showOfficeHours === false })}
                />
              </div>
              <input
                type="text"
                value={form.officeWorkingHours || ''}
                onChange={(e) => setForm({ ...form, officeWorkingHours: e.target.value })}
                placeholder="على مدار الساعة 24/7 لخدمة ضيوف الرحمن"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
              />
            </div>

            {/* Official Licenses Box */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#B38A34]" />
                  <span className="text-xs font-bold text-stone-800">بيانات وشارة التراخيص الرسمية</span>
                </div>
                <VisibilityToggle
                  active={form.showLicense !== false}
                  onToggle={() => setForm({ ...form, showLicense: form.showLicense === false })}
                  label={form.showLicense !== false ? 'شارة الترخيص ظاهرة' : 'شارة الترخيص مخفية'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">الجهة المرخصة:</label>
                  <input
                    type="text"
                    value={form.licenseAuthority || ''}
                    onChange={(e) => setForm({ ...form, licenseAuthority: e.target.value })}
                    placeholder="مرخصون من وزارة الحج والعمرة والهيئة السعودية للسياحة"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">رقم الترخيص / السجل التجاري:</label>
                  <input
                    type="text"
                    value={form.licenseNumber || ''}
                    onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                    placeholder="73104928"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-mono focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 5: PHOTOS & LOGO (الشعار وألبوم صور المقر) */}
      {/* ========================================================= */}
      {activeSubTab === 'photos' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-8 animate-fadeIn">
          {/* Logo Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  شعار الشركة (Company Logo)
                </h3>
                <p className="text-xs text-stone-500">
                  يظهر في رأس صفحة "من نحن" وفي بطاقة المقر الرئيسي
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <VisibilityToggle
                  active={form.showLogoCardButton !== false}
                  onToggle={() => setForm({ ...form, showLogoCardButton: form.showLogoCardButton === false })}
                  label={form.showLogoCardButton !== false ? 'زر فتح وتكبير الشعار ظاهر' : 'زر فتح الشعار مخفي'}
                />
                <VisibilityToggle
                  active={form.showLogoCard !== false}
                  onToggle={() => setForm({ ...form, showLogoCard: form.showLogoCard === false })}
                  label={form.showLogoCard !== false ? 'بطاقة الشعار كاملة ظاهرة' : 'بطاقة الشعار مخفية'}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="w-28 h-28 rounded-2xl bg-stone-900 border border-stone-700 p-3 flex items-center justify-center shrink-0">
                {currentLogo ? (
                  <img
                    src={currentLogo}
                    alt="Company Logo"
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_10px_rgba(201,162,75,0.3)]"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-[#DFBE72]" />
                )}
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-colors">
                    <Upload className="w-4 h-4 text-[#DFBE72]" />
                    <span>رفع شعار جديد (PNG شفاف / SVG)</span>
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml, .png, .svg"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {currentLogo && (
                    <button
                      type="button"
                      onClick={() => openAdminLightbox(currentLogo)}
                      className="px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة مكبرة</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-stone-500">
                  يُفضل رفع شعار بخلفية شفافة PNG بجودة عالية وأبعاد متناسقة.
                </p>
              </div>
            </div>
          </div>

          {/* Photo Album Gallery */}
          <div className="pt-6 border-t border-stone-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  ألبوم صور المقر الرئيسي والضيافة (Photo Album)
                </h3>
                <p className="text-xs text-stone-500">
                  الصور التي تظهر في معرض صور صفحة من نحن ({allPhotos.length} صورة حالياً)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <VisibilityToggle
                  active={form.showPhotoAlbumTitle !== false}
                  onToggle={() => setForm({ ...form, showPhotoAlbumTitle: form.showPhotoAlbumTitle === false })}
                  label={form.showPhotoAlbumTitle !== false ? 'عنوان المعرض ظاهر' : 'عنوان المعرض مخفي'}
                />
                <VisibilityToggle
                  active={form.showPhotoAlbumUploadButton !== false}
                  onToggle={() => setForm({ ...form, showPhotoAlbumUploadButton: form.showPhotoAlbumUploadButton === false })}
                  label={form.showPhotoAlbumUploadButton !== false ? 'زر رفع الصور ظاهر' : 'زر الرفع مخفي'}
                />
                <VisibilityToggle
                  active={form.showPhotoAlbum !== false}
                  onToggle={() => setForm({ ...form, showPhotoAlbum: form.showPhotoAlbum === false })}
                  label={form.showPhotoAlbum !== false ? 'المعرض كامل ظاهر' : 'المعرض مخفي'}
                />

                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صور من الجهاز</span>
                  <input
                    ref={photosFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotosUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowAddUrlInput(!showAddUrlInput)}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>رابط صورة</span>
                </button>
              </div>
            </div>

            {/* URL Input Form */}
            {showAddUrlInput && (
              <form onSubmit={handleAddPhotoUrl} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex gap-2">
                <input
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-mono outline-none focus:border-[#C9A24B]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl"
                >
                  إضافة
                </button>
              </form>
            )}

            {/* Photos Grid */}
            {allPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {allPhotos.map((photo, pIdx) => {
                  const isMain = form.mainPhoto === photo;
                  return (
                    <div
                      key={pIdx}
                      className={`group relative rounded-2xl overflow-hidden border aspect-video bg-stone-100 shadow-2xs ${
                        isMain ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/30' : 'border-stone-200'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Photo ${pIdx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => openAdminLightbox(photo)}
                      />

                      {/* Main Badge */}
                      {isMain && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#C9A24B] text-white text-[10px] font-bold shadow-xs">
                          الغلاف الرئيسي
                        </span>
                      )}

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainPhoto(photo)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#C9A24B] text-white text-[10px] font-bold hover:bg-[#B38A34] transition-colors"
                            title="تعيين كغلاف رئيسي"
                          >
                            تعيين رئيسية
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openAdminLightbox(photo)}
                          className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/40 transition-colors"
                          title="معاينة مكبرة"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo)}
                          className="p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                          title="حذف الصورة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-stone-200 rounded-2xl">
                <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-500 font-medium">لا توجد صور في ألبوم المقر حالياً</p>
                <p className="text-[11px] text-stone-400 mt-0.5">انقر على "رفع صور من الجهاز" لإضافة صور جديدة</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* SUB-TAB 7: CALL TO ACTION BANNER (شريط الدعوة للحجز في الفوتر) */}
      {/* ========================================================= */}
      {activeSubTab === 'cta' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  شريط الدعوة للحجز والتواصل في أسفل صفحة من نحن (CTA Banner)
                </h3>
                <p className="text-xs text-stone-500">
                  التحكم في إظهار أو إخفاء البانر الذهبي السفلي، عنوانه، نصوصه، وأزرار استعراض الفنادق وواتساب.
                </p>
              </div>
            </div>

            <VisibilityToggle
              active={form.showCtaSection !== false && form.showCtaBanner !== false}
              onToggle={() => {
                const val = !(form.showCtaSection !== false && form.showCtaBanner !== false);
                setForm({ ...form, showCtaSection: val, showCtaBanner: val });
              }}
              label={(form.showCtaSection !== false && form.showCtaBanner !== false) ? 'البانر ظاهر بالكامل' : 'البانر مخفي'}
            />
          </div>

          <div className="space-y-4">
            {/* CTA Title */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">العنوان الرئيسي للشريط:</label>
                <VisibilityToggle
                  active={form.showCtaTitle !== false}
                  onToggle={() => setForm({ ...form, showCtaTitle: form.showCtaTitle === false })}
                />
              </div>
              <p className="text-xs text-stone-500">
                النص الافتراضي: "هل تخطط لرحلة عمرة أو حج قادمة؟" (يمكن تعديله بالنقر المباشر عليه داخل الصفحة عند تفعيل وضع التعديل)
              </p>
            </div>

            {/* CTA Subtitle */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">النص التوضيحي للشريط (الوصف):</label>
                <VisibilityToggle
                  active={form.showCtaSubtitle !== false}
                  onToggle={() => setForm({ ...form, showCtaSubtitle: form.showCtaSubtitle === false })}
                />
              </div>
              <p className="text-xs text-stone-500">
                النص الافتراضي: "تصفح قائمة فنادقنا المعتمدة في مكة والمدينة أو تواصل مباشرة مع فريقنا لمساعدتك في اختيار الفندق الأنسب."
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">زر "استعرض فنادق مكة والمدينة"</span>
                  <span className="text-[11px] text-stone-500">زر أبيض ينقل الزائر لصفحة الفنادق</span>
                </div>
                <VisibilityToggle
                  active={form.showCtaHotelsButton !== false}
                  onToggle={() => setForm({ ...form, showCtaHotelsButton: form.showCtaHotelsButton === false })}
                />
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">زر "تحدث مع مستشار التسكين"</span>
                  <span className="text-[11px] text-stone-500">زر داكن يفتح محادثة واتساب مباشرة</span>
                </div>
                <VisibilityToggle
                  active={form.showCtaConsultantButton !== false}
                  onToggle={() => setForm({ ...form, showCtaConsultantButton: form.showCtaConsultantButton === false })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <Lightbox
          images={allAdminImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
