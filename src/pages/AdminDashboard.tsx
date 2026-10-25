import React, { useState, useEffect, useMemo } from 'react';
import { Hotel, Offer, ContactMessage, ActivePage, SiteSettings, ContactChannel, HotelCategory, ALL_HOTEL_CATEGORIES, HotelReview, District, AdminUser, UserRole, BranchLocation, DepartmentContact, QuickLinkItem, StoryTeaserSettings, IntegratedServicesSettings, HomeSectionsSettings, ActionButtonItem, ContactDirectoryItem } from '../types';
import { AdminChannelsManager } from '../components/AdminChannelsManager';
import { AdminHeroSlidesManager } from '../components/AdminHeroSlidesManager';
import { AdminDistrictsManager } from '../components/AdminDistrictsManager';
import { AdminUsersManager } from '../components/AdminUsersManager';
import { AdminBranchesManager } from '../components/AdminBranchesManager';
import { AdminDepartmentContactsManager } from '../components/AdminDepartmentContactsManager';
import { AdminQuickLinksManager } from '../components/AdminQuickLinksManager';
import { HotelMediaAlbumManager } from '../components/HotelMediaAlbumManager';
import { AdminAboutManager } from '../components/AdminAboutManager';
import { AdminStoryTeaserManager } from '../components/AdminStoryTeaserManager';
import { AdminServicesManager } from '../components/AdminServicesManager';
import { AdminHomeSectionsManager } from '../components/AdminHomeSectionsManager';
import { AdminActionButtonsManager } from '../components/AdminActionButtonsManager';
import { AdminContactsDirectoryManager } from '../components/AdminContactsDirectoryManager';
import { AdminBookingsManager } from '../components/AdminBookingsManager';
import { AdminRoomsManager } from '../components/AdminRoomsManager';
import { AdminOnlineAvailabilityManager } from '../components/AdminOnlineAvailabilityManager';
import { AdminHotelsManager } from '../components/AdminHotelsManager';
import { AdminSEOEditor } from '../components/AdminSEOEditor';
import { getBookingsFromDb, getCachedBookings } from '../services/bookingService';
import { sendOnlineBookingNotification, resolveBookingEmail } from '../services/bookingNotificationService';
import { BookingComIcon, AgodaIcon, ExpediaIcon, GoogleMapsIcon, WhatsAppIcon, EmailIcon } from '../components/BookingIcons';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { buildWhatsAppLink } from '../utils/channels';
import { 
  auth, 
  signInWithEmailAndPassword, 
  signInWithGoogle,
  signOut, 
  onAuthStateChanged,
  saveHotelToDb,
  deleteHotelFromDb,
  saveOfferToDb,
  deleteOfferFromDb,
  getContactMessagesFromDb,
  markMessageAsReadInDb,
  deleteMessageFromDb,
  getReviewsFromDb,
  approveReview,
  deleteReviewFromDb,
  getDistrictsFromDb,
  getAdminUsersFromDb,
  getCurrentAdminUser,
  setCurrentAdminUser,
  getAdminRolesFromDb,
  saveAdminRoleToDb,
  deleteAdminRoleFromDb,
  getAuditLogsFromDb,
  recordAuditLog
} from '../services/firebase';
import { 
  AdminRole, 
  AuditLogEntry, 
  PermissionModule, 
  DEFAULT_ADMIN_ROLES, 
  SUPER_ADMIN_ROLE_ID 
} from '../types/rbac';
import { canAccessTab, hasPermission, isSuperAdminUser } from '../utils/rbac';
import { AccessDeniedScreen } from '../components/AccessDeniedScreen';
import { AuditLogViewer } from '../components/AuditLogViewer';
import { 
  ShieldCheck, 
  Shield,
  Building2, 
  Tag, 
  Mail, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Film, 
  LogOut, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink,
  MessageCircle,
  Star,
  MessageSquare,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Footprints,
  Users,
  UserCheck,
  Lock,
  Images,
  Info,
  RotateCcw,
  Phone,
  Database,
  Key,
  Copy,
  ChevronUp,
  ChevronDown,
  Play,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  Layers,
  LayoutGrid,
  BedDouble,
  Bus,
  Monitor,
  Layout,
  MousePointerClick,
  Utensils,
  CalendarRange,
  Search
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  isSupabaseConfigured,
  uploadMediaToSupabase,
  uploadBase64ToSupabase
} from '../services/supabase';
import { 
  parseDistanceInput, 
  formatDistanceDisplay, 
  isBusTransportation, 
  formatTransportText, 
  HOTEL_VIEW_OPTIONS 
} from '../utils/hotelTransport';
import { SafeVideoPlayer } from '../components/SafeVideoPlayer';

export type AdminDashboardTab = 
  | 'hotels' 
  | 'bookings'
  | 'online-control'
  | 'calendar-grid'
  | 'rooms-inventory'
  | 'rooms-list'
  | 'meals-list'
  | 'packages-list'
  | 'periods-pricing'
  | 'booking-rules'
  | 'booking-settings'
  | 'districts' 
  | 'users' 
  | 'intro-video' 
  | 'slides' 
  | 'buttons'
  | 'contacts'
  | 'offers' 
  | 'about' 
  | 'reviews' 
  | 'messages' 
  | 'settings'
  | 'home-sections'
  | 'story-teaser'
  | 'services'
  | 'audit-log';

interface AdminDashboardProps {
  hotels: Hotel[];
  offers: Offer[];
  onRefreshData: () => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateHome: () => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (status: boolean) => void;
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (newSettings: SiteSettings) => Promise<void>;
  initialTab?: AdminDashboardTab;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  hotels,
  offers,
  onRefreshData,
  onShowToast,
  onNavigateHome,
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  siteSettings,
  onUpdateSiteSettings,
  initialTab = 'hotels'
}) => {
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard Sidebar Navigation
  type AdminTab = AdminDashboardTab;
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    if (window.location.hash !== `#/admin/${tab}`) {
      window.location.hash = `#/admin/${tab}`;
    }
  };

  // Local optimistic state for instant 0ms response on reorder and toggle
  const [localHotels, setLocalHotels] = useState<Hotel[]>(hotels);
  const [localOffers, setLocalOffers] = useState<Offer[]>(offers);

  useEffect(() => {
    setLocalHotels(hotels);
  }, [hotels]);

  useEffect(() => {
    setLocalOffers(offers);
  }, [offers]);

  // Districts, Admin Users & RBAC Roles State
  const [districts, setDistricts] = useState<District[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>(DEFAULT_ADMIN_ROLES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => getCurrentAdminUser());
  const [customDistrictInput, setCustomDistrictInput] = useState(false);

  // Contact Messages State
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Reviews State
  const [reviews, setReviews] = useState<HotelReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // Bookings Counter State - Synchronously hydrated from cache (0ms)
  const [pendingBookingsCount, setPendingBookingsCount] = useState<number>(() => {
    const list = getCachedBookings();
    return list.filter(x => x.status === 'pending').length;
  });
  const [totalBookingsCount, setTotalBookingsCount] = useState<number>(() => {
    return getCachedBookings().length;
  });

  useEffect(() => {
    getBookingsFromDb().then(b => {
      setTotalBookingsCount(b.length);
      setPendingBookingsCount(b.filter(x => x.status === 'pending').length);
    }).catch(() => {});
  }, []);

  // Hierarchical Collapsible Menus State (Apple-grade Accordion)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'online-booking': true,
    'hotels-locations': true,
    'site-content': false,
    'inbox-reviews': false,
    'system-security': false
  });

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Auto-expand parent menu when activeTab changes
  useEffect(() => {
    if (['bookings', 'online-control', 'calendar-grid', 'rooms-inventory', 'rooms-list', 'meals-list', 'packages-list', 'periods-pricing', 'booking-rules', 'booking-settings'].includes(activeTab)) {
      setExpandedMenus(prev => ({ ...prev, 'online-booking': true }));
    } else if (['hotels', 'districts'].includes(activeTab)) {
      setExpandedMenus(prev => ({ ...prev, 'hotels-locations': true }));
    } else if (['slides', 'intro-video', 'offers', 'contacts', 'about', 'story-teaser', 'services', 'buttons', 'home-sections'].includes(activeTab)) {
      setExpandedMenus(prev => ({ ...prev, 'site-content': true }));
    } else if (['messages', 'reviews'].includes(activeTab)) {
      setExpandedMenus(prev => ({ ...prev, 'inbox-reviews': true }));
    } else if (['settings', 'users', 'audit-log'].includes(activeTab)) {
      setExpandedMenus(prev => ({ ...prev, 'system-security': true }));
    }
  }, [activeTab]);

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'hotel' | 'offer' | 'review' | 'message';
    id: string;
    title: string;
  }>({
    isOpen: false,
    type: 'hotel',
    id: '',
    title: ''
  });

  // Hotel Multi-Step Form State
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [hotelFormStep, setHotelFormStep] = useState<1 | 2 | 3 | 4>(1);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [hotelForm, setHotelForm] = useState<Hotel>({
    id: '',
    name: '',
    nameEn: '',
    city: 'مكة المكرمة',
    district: 'أجياد',
    stars: 5,
    distanceToHaram: 100,
    distanceText: '١٠٠ متراً عن ساحة الحرم',
    walkingTimeMinutes: 2,
    featured: true,
    categories: ['فنادق العمرة'],
    rating: 4.8,
    reviewCount: 0,
    mainImage: '',
    galleryImages: [],
    videoUrl: '',
    overview: '',
    detailedDescription: '',
    amenities: ['إطلالة مباشرة على الحرم', 'واي فاي مجاني', 'بوفيه إفطار فاخر', 'مصاعد سريعة للساحة'],
    location: {
      lat: 21.4225,
      lng: 39.8262,
      address: 'أجياد، المنطقة المركزية، مكة المكرمة',
      viewType: 'إطلالة حرم',
      transportType: 'walking'
    },
    keywords: 'فنادق مكة, فندق قريب من الحرم, إطلالة الكعبة, حجز فنادق العمرة',
    metaDescription: 'احجز إقامتك الفاخرة في أفضل فنادق مكة المكرمة بالقرب من الحرم المكي مع خدمات تسكين متكاملة وبوفيه إفطار متميز.'
  });

  // Smart distance input string state (e.g. "1.5" for 1500m or "350")
  const [distanceInputStr, setDistanceInputStr] = useState<string>('120');

  // Drag and drop / file upload simulation state for Hotel
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newAmenityInput, setNewAmenityInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Offer Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState<Offer>({
    id: '',
    title: '',
    shortDescription: '',
    fullDescription: '',
    mediaType: 'image',
    mediaUrl: '',
    videoUrl: '',
    discountPercentage: 20,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
    isActive: true,
    badgeText: 'إعلان مميز',
    showDiscount: true,
    showCountdown: true,
    showInHeroSlides: false,
    gallery: [],
    keywords: 'عروض العمرة, خصومات فنادق مكة, باقات الحج والعمرة',
    metaDescription: 'استفد من أقوى عروض وباقات التسكين الفاخرة في مكة والمدينة بأسعار حصرية من شركة برستيج لإدارة وتشغيل الفنادق.'
  });
  const [offerUploadProgress, setOfferUploadProgress] = useState<number>(0);
  const [isOfferUploading, setIsOfferUploading] = useState(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryType, setNewGalleryType] = useState<'image' | 'video'>('image');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [isUploadingGalleryItem, setIsUploadingGalleryItem] = useState(false);

  // Standalone Hotel Album Modal State
  const [albumModalHotel, setAlbumModalHotel] = useState<Hotel | null>(null);
  const [savingAlbum, setSavingAlbum] = useState(false);

  // Centralized Auto-Save & Cloud Synchronization State & Executor
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Listen for global auto-save events from child components (Rooms, Bookings, etc.)
  useEffect(() => {
    let savedTimeout: any = null;
    const handleCustomAutoSave = (e: any) => {
      const status = e.detail?.status;
      if (status === 'saving') {
        if (savedTimeout) clearTimeout(savedTimeout);
        setAutoSaveStatus('saving');
      } else if (status === 'saved') {
        setAutoSaveStatus('saved');
        savedTimeout = setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 2500);
      } else if (status === 'idle') {
        setAutoSaveStatus('idle');
      }
    };
    window.addEventListener('prestige:autosave', handleCustomAutoSave);
    return () => {
      window.removeEventListener('prestige:autosave', handleCustomAutoSave);
      if (savedTimeout) clearTimeout(savedTimeout);
    };
  }, []);

  // Centralized Auto-Save & Cloud Synchronization Executor
  const executeAutoSave = async <T,>(saveFn: () => Promise<T>): Promise<T> => {
    setAutoSaveStatus('saving');
    try {
      const result = await saveFn();
      setAutoSaveStatus('saved');
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 2500);
      return result;
    } catch (err) {
      console.error('Auto-save error:', err);
      setAutoSaveStatus('idle');
      throw err;
    }
  };

  const handleSaveAlbumModal = async (updatedData: {
    mainImage: string;
    galleryImages: any[];
    videoUrl?: string;
    additionalVideos?: any[];
  }) => {
    if (!albumModalHotel) return;
    const updatedHotel: Hotel = {
      ...albumModalHotel,
      mainImage: updatedData.mainImage || albumModalHotel.mainImage,
      galleryImages: updatedData.galleryImages,
      videoUrl: updatedData.videoUrl,
      additionalVideos: updatedData.additionalVideos
    };
    setAlbumModalHotel(updatedHotel);
    setSavingAlbum(true);
    try {
      await executeAutoSave(async () => {
        await saveHotelToDb(updatedHotel);
        await onRefreshData();
      });
      onShowToast('تم حفظ وتحديث ألبوم صور وفيديوهات الفندق في قاعدة البيانات بنجاح', 'success');
    } catch (err) {
      console.error('Failed saving hotel album:', err);
      onShowToast('حدث خطأ أثناء حفظ الألبوم', 'error');
    } finally {
      setSavingAlbum(false);
    }
  };

  // Site Settings Form State & Debounced Auto-Save
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [settingsSubTab, setSettingsSubTab] = useState<'brand' | 'display' | 'booking-module' | 'visibility' | 'contact-data' | 'hotel-detail' | 'database' | 'seo'>('brand');
  const [savingSettings, setSavingSettings] = useState(false);
  const initialSettingsLoadedRef = React.useRef(false);
  const settingsTimerRef = React.useRef<any>(null);

  // Automatic Debounced Save for Settings & Intro Video
  const triggerAutoSaveSettings = (newSettings: SiteSettings) => {
    setSettingsForm(newSettings);
    if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current);
    setAutoSaveStatus('saving');
    settingsTimerRef.current = setTimeout(async () => {
      try {
        await onUpdateSiteSettings(newSettings);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2500);
      } catch (err) {
        console.error('Auto-save settings error:', err);
        setAutoSaveStatus('idle');
      }
    }, 700);
  };

  const [isUploadingIntroVideo, setIsUploadingIntroVideo] = useState(false);
  const [introVideoUploadProgress, setIntroVideoUploadProgress] = useState(0);

  const handleIntroVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 150 * 1024 * 1024) {
      onShowToast('حجم ملف الفيديو يتجاوز 150 ميجابايت', 'error');
      return;
    }
    setIsUploadingIntroVideo(true);
    setIntroVideoUploadProgress(30);
    try {
      const res = await uploadMediaToSupabase(file, 'videos');
      setIntroVideoUploadProgress(100);
      const uploadedUrl = typeof res === 'string' ? res : (res?.url || '');
      if (uploadedUrl) {
        const currentIntro = settingsForm.introVideo || {
          enabled: true,
          videoUrl: ''
        };
        const updatedIntro = {
          ...currentIntro,
          enabled: true,
          videoUrl: uploadedUrl
        };
        const updated = {
          ...settingsForm,
          introVideo: updatedIntro
        };
        triggerAutoSaveSettings(updated);
        onShowToast('تم رفع فيديو الإنترو وحفظه تلقائياً بنجاح 🎬', 'success');
      } else {
        onShowToast(res?.error || 'تعذر رفع الفيديو إلى التخزين، يرجى استخدام رابط مباشر', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء رفع ملف الفيديو', 'error');
    } finally {
      setIsUploadingIntroVideo(false);
      setIntroVideoUploadProgress(0);
    }
  };

  const handleIntroPosterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadMediaToSupabase(file, 'images');
      const uploadedUrl = typeof res === 'string' ? res : (res?.url || '');
      const posterUrl = uploadedUrl || await optimizeImageFile(file, { maxWidth: 1600, maxHeight: 900 });
      const currentIntro = settingsForm.introVideo || { enabled: true, videoUrl: '' };
      const updated = {
        ...settingsForm,
        introVideo: { ...currentIntro, posterUrl }
      };
      triggerAutoSaveSettings(updated);
      onShowToast('تم تحديث غلاف بوستر الفيديو الترحيبي بنجاح', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء رفع البوستر', 'error');
    }
  };

  // Supabase Database Connection State
  const [supabaseUrl, setSupabaseUrl] = useState(() => getSupabaseConfig().url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => getSupabaseConfig().anonKey);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [showSqlSchemaModal, setShowSqlSchemaModal] = useState(false);

  const handleSaveSupabaseConfig = () => {
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    onShowToast('تم حفظ إعدادات ربط Supabase بنجاح', 'success');
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
      const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
      setSupabaseTestResult({
        tested: true,
        success: res.success,
        message: res.message
      });
      if (res.success) {
        onShowToast('تم الاتصال بقاعدة بيانات Supabase بنجاح! 🚀', 'success');
      } else {
        onShowToast(res.message, 'error');
      }
    } catch (err: any) {
      setSupabaseTestResult({
        tested: true,
        success: false,
        message: err.message || 'فشل الاتصال بـ Supabase'
      });
      onShowToast('فشل اختبار الاتصال بـ Supabase', 'error');
    } finally {
      setTestingSupabase(false);
    }
  };

  useEffect(() => {
    if (siteSettings) {
      setSettingsForm(siteSettings);
      setTimeout(() => {
        initialSettingsLoadedRef.current = true;
      }, 400);
    }
  }, [siteSettings]);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      onShowToast('حجم الملف يتجاوز 8 ميجابايت، يرجى اختيار ملف أصغر', 'error');
      return;
    }

    try {
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      const optimizedLogo = await optimizeImageFile(file, {
        maxWidth: 512,
        maxHeight: 512,
        forcePng: isPng
      });

      // Upload optimized image to Supabase Storage
      let finalLogoUrl = optimizedLogo;
      try {
        const base64Url = await uploadBase64ToSupabase(optimizedLogo, 'images');
        if (base64Url) finalLogoUrl = base64Url;
      } catch (storageErr) {
        console.warn('Storage upload fallback to base64:', storageErr);
      }

      const updated: SiteSettings = {
        ...settingsForm,
        logoUrl: finalLogoUrl,
        aboutUs: {
          ...(settingsForm.aboutUs || {}),
          logoUrl: finalLogoUrl
        }
      };

      setSettingsForm(updated);
      await executeAutoSave(async () => {
        await onUpdateSiteSettings(updated);
      });
      onShowToast('تم رفع وتحديث شعار الموقع وأيقونة علامة التبويب (Favicon) بنجاح', 'success');
    } catch (err) {
      console.error('Error uploading logo:', err);
      onShowToast('حدث خطأ أثناء معالجة الشعار', 'error');
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsForm.siteTitle.trim()) {
      onShowToast('يرجى كتابة اسم أو عنوان الموقع', 'error');
      return;
    }
    setSavingSettings(true);
    try {
      await executeAutoSave(async () => {
        await onUpdateSiteSettings(settingsForm);
        await handleRecordAudit({
          module: 'system_settings',
          action: 'تحديث إعدادات المنصة',
          details: `تحديث إعدادات وهوية الموقع العامة: "${settingsForm.siteTitle}"`,
          oldValue: { siteTitle: siteSettings.siteTitle, siteSubtitle: siteSettings.siteSubtitle },
          newValue: { siteTitle: settingsForm.siteTitle, siteSubtitle: settingsForm.siteSubtitle },
          recordId: 'site_settings',
          recordTitle: settingsForm.siteTitle
        });
      });
      onShowToast('تم حفظ وتحديث إعدادات الموقع والشعار في قاعدة البيانات بنجاح', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء حفظ الإعدادات', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleFaviconFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
      let finalFaviconUrl = '';

      if (isSvg) {
        try {
          const uploadRes = await uploadMediaToSupabase(file, 'images', `brand/favicon_${Date.now()}.svg`);
          if (uploadRes.success && uploadRes.url) {
            finalFaviconUrl = uploadRes.url;
          }
        } catch {}
      }

      if (!finalFaviconUrl) {
        const optimizedFavicon = await optimizeImageFile(file, {
          maxWidth: 128,
          maxHeight: 128,
          forcePng: true
        });

        finalFaviconUrl = optimizedFavicon;
        try {
          const base64Url = await uploadBase64ToSupabase(optimizedFavicon, 'images');
          if (base64Url) finalFaviconUrl = base64Url;
        } catch (storageErr) {
          console.warn('Storage upload fallback to base64:', storageErr);
        }
      }

      const updated: SiteSettings = {
        ...settingsForm,
        faviconUrl: finalFaviconUrl
      };

      setSettingsForm(updated);
      await executeAutoSave(async () => {
        await onUpdateSiteSettings(updated);
      });
      onShowToast('تم تحديث أيقونة علامة التبويب (Favicon) بنجاح', 'success');
    } catch (err) {
      console.error('Error uploading favicon:', err);
      onShowToast('حدث خطأ أثناء معالجة الأيقونة', 'error');
    }
  };

  const handleChannelsChange = async (updatedChannels: ContactChannel[]) => {
    const updated: SiteSettings = {
      ...settingsForm,
      channels: updatedChannels,
    };
    setSettingsForm(updated);
    try {
      await executeAutoSave(async () => {
        await onUpdateSiteSettings(updated);
      });
    } catch (err) {
      console.error('Failed to auto-save channels:', err);
    }
  };

  const handleBranchesChange = async (updatedBranches: BranchLocation[]) => {
    const updated: SiteSettings = {
      ...settingsForm,
      branches: updatedBranches,
    };
    setSettingsForm(updated);
    try {
      await executeAutoSave(async () => {
        await onUpdateSiteSettings(updated);
      });
    } catch (err) {
      console.error('Failed to auto-save branches:', err);
    }
  };

  const handleDepartmentContactsChange = async (updatedContacts: DepartmentContact[]) => {
    const updated: SiteSettings = {
      ...settingsForm,
      departmentContacts: updatedContacts,
    };
    setSettingsForm(updated);
    try {
      await executeAutoSave(async () => {
        await onUpdateSiteSettings(updated);
      });
    } catch (err) {
      console.error('Failed to auto-save department contacts:', err);
    }
  };

  const handleQuickLinksChange = async (updatedLinks: QuickLinkItem[]) => {
    const updated: SiteSettings = {
      ...settingsForm,
      quickLinks: updatedLinks,
    };
    setSettingsForm(updated);
    try {
      await executeAutoSave(async () => {
        await onUpdateSiteSettings(updated);
      });
    } catch (err) {
      console.error('Failed to auto-save quick links:', err);
    }
  };

  const handleStoryTeaserChange = async (updatedStoryTeaser: StoryTeaserSettings) => {
    const updated: SiteSettings = {
      ...settingsForm,
      storyTeaser: updatedStoryTeaser,
    };
    setSettingsForm(updated);
    try {
      await executeAutoSave(async () => {
        await onUpdateSiteSettings(updated);
      });
    } catch (err) {
      console.error('Failed to auto-save story teaser:', err);
    }
  };

  const handleServicesChange = async (updatedServices: IntegratedServicesSettings) => {
    const updated: SiteSettings = {
      ...settingsForm,
      integratedServices: updatedServices,
    };
    setSettingsForm(updated);
    try {
      await executeAutoSave(async () => {
        await onUpdateSiteSettings(updated);
      });
    } catch (err) {
      console.error('Failed to auto-save services:', err);
    }
  };

  const handleHomeSectionsChange = async (updatedHomeSections: HomeSectionsSettings) => {
    const updated: SiteSettings = {
      ...settingsForm,
      homeSections: updatedHomeSections,
    };
    setSettingsForm(updated);
    try {
      await executeAutoSave(async () => {
        await onUpdateSiteSettings(updated);
      });
    } catch (err) {
      console.error('Failed to auto-save home sections:', err);
    }
  };

  const handleActionButtonsChange = async (updatedButtons: ActionButtonItem[]) => {
    const updated: SiteSettings = {
      ...settingsForm,
      actionButtons: updatedButtons,
    };
    setSettingsForm(updated);
    try {
      await executeAutoSave(async () => {
        await onUpdateSiteSettings(updated);
      });
    } catch (err) {
      console.error('Failed to auto-save action buttons:', err);
    }
  };

  const handleContactsDirectoryChange = async (updatedContacts: ContactDirectoryItem[]) => {
    const updated: SiteSettings = {
      ...settingsForm,
      contactsDirectory: updatedContacts,
    };
    setSettingsForm(updated);
    try {
      await executeAutoSave(async () => {
        await onUpdateSiteSettings(updated);
      });
    } catch (err) {
      console.error('Failed to auto-save contacts directory:', err);
    }
  };

  // Check auth state on mount
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setIsAdminLoggedIn(true);
        }
      });
      return () => unsubscribe();
    }
  }, [setIsAdminLoggedIn]);

  // Load all dashboard auxiliary data
  const loadDistricts = async () => {
    try {
      const list = await getDistrictsFromDb();
      setDistricts(list);
    } catch (err) {
      console.error('Failed to load districts:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const list = await getAdminUsersFromDb();
      setAdminUsers(list);
    } catch (err) {
      console.error('Failed to load admin users:', err);
    }
  };

  const loadRoles = async () => {
    try {
      const list = await getAdminRolesFromDb();
      setAdminRoles(list);
    } catch (err) {
      console.error('Failed to load admin roles:', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const list = await getAuditLogsFromDb();
      setAuditLogs(list);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const handleRecordAudit = async (entry: {
    module: PermissionModule;
    action: string;
    details: string;
    oldValue?: any;
    newValue?: any;
    recordId?: string;
    recordTitle?: string;
  }) => {
    try {
      const user = currentUser || getCurrentAdminUser();
      await recordAuditLog({
        userId: user?.id || 'admin_user',
        userName: user?.name || user?.username || 'مدير النظام',
        userEmail: user?.email,
        module: entry.module,
        action: entry.action,
        actionLabelAr: entry.action,
        details: entry.details,
        recordId: entry.recordId,
        recordTitle: entry.recordTitle,
        oldValue: entry.oldValue,
        newValue: entry.newValue
      });
      const updated = await getAuditLogsFromDb();
      setAuditLogs(updated);
    } catch (err) {
      console.warn('Failed recording audit log:', err);
    }
  };

  useEffect(() => {
    loadDistricts();
    loadUsers();
    loadRoles();
    loadAuditLogs();
  }, []);

  // Load messages, reviews, roles & audit logs when respective tab is active
  useEffect(() => {
    if (isAdminLoggedIn) {
      loadDistricts();
      loadUsers();
      loadRoles();
      loadAuditLogs();
      if (activeTab === 'messages') {
        loadMessages();
      } else if (activeTab === 'reviews') {
        loadReviews();
      } else if (activeTab === 'audit-log') {
        loadAuditLogs();
      }
    }
  }, [isAdminLoggedIn, activeTab]);

  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      const msgs = await getContactMessagesFromDb();
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const revs = await getReviewsFromDb();
      setReviews(revs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleApproveReview = async (review: HotelReview) => {
    // 1. INSTANT 0ms OPTIMISTIC UI: Mark review as approved in state immediately
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: 'approved' } : r));
    onShowToast(`تم اعتماد تقييم "${review.authorName}" وإضافته للفندق بنجاح`, 'success');

    // 2. Background async sync to Supabase / Database with real-time saving status
    try {
      await executeAutoSave(async () => {
        await approveReview(review.id);
        await onRefreshData();
      });
    } catch (err) {
      console.error('Error approving review:', err);
      // Revert if error
      await loadReviews();
      onShowToast('حدث خطأ أثناء حفظ اعتماد التقييم في الخادم', 'error');
    }
  };

  const confirmDeleteReview = (review: HotelReview) => {
    setDeleteModal({
      isOpen: true,
      type: 'review',
      id: review.id,
      title: `تقييم ${review.authorName}`
    });
  };

  // Auth Handlers with RBAC (Strictly Fixed Super Admin A.hesham & Database Registered Users)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    // Security Rate Limiting Protection (Max 5 failed attempts, then 15 minutes lockout)
    const lockUntilStr = localStorage.getItem('prestige_admin_locked_until');
    if (lockUntilStr) {
      const lockUntil = parseInt(lockUntilStr, 10);
      if (!isNaN(lockUntil) && Date.now() < lockUntil) {
        const remainingMinutes = Math.ceil((lockUntil - Date.now()) / (60 * 1000));
        setLoginError(`تم حظر محاولات الدخول مؤقتاً لحماية الحساب نظراً لتكرار المحاولات الخاطئة. يرجى الانتظار ${remainingMinutes} دقيقة والمحاولة لاحقاً.`);
        setLoginLoading(false);
        return;
      } else {
        localStorage.removeItem('prestige_admin_locked_until');
        localStorage.removeItem('prestige_admin_failed_attempts');
      }
    }

    try {
      const input = email.trim();
      const inputLower = input.toLowerCase();

      // 1. Direct Fixed Super Admin Verification (A.hesham / 199991)
      if ((inputLower === 'a.hesham' || inputLower === 'admin') && password === '199991') {
        localStorage.removeItem('prestige_admin_failed_attempts');
        localStorage.removeItem('prestige_admin_locked_until');
        const superAdmin: AdminUser = {
          id: 'usr_super_admin_hesham',
          name: 'المدير العام (أحمد هشام)',
          username: 'A.hesham',
          email: 'a.hesham@prestigehotels.sa',
          role: 'admin',
          roleIds: [SUPER_ADMIN_ROLE_ID],
          status: 'active',
          createdAt: Date.now()
        };
        setCurrentUser(superAdmin);
        setCurrentAdminUser(superAdmin);
        setIsAdminLoggedIn(true);
        onShowToast('مرحباً بكم المدير العام أحمد هشام في لوحة تحكم شركة برستيج 👑', 'success');
        setLoginLoading(false);
        return;
      }

      // 2. Check against registered admin users in Database / Supabase / Storage
      const usersList = adminUsers.length > 0 ? adminUsers : await getAdminUsersFromDb();
      const matched = usersList.find(
        u => u.username?.toLowerCase() === inputLower || u.email?.toLowerCase() === inputLower
      );

      if (matched) {
        if (matched.status === 'inactive') {
          setLoginError('عذراً، هذا الحساب معطل حالياً من قبل المدير العام.');
          setLoginLoading(false);
          return;
        }
        if (matched.password === password) {
          localStorage.removeItem('prestige_admin_failed_attempts');
          localStorage.removeItem('prestige_admin_locked_until');
          const isSuper = matched.role === 'admin' || matched.username?.toLowerCase() === 'a.hesham' || matched.id === 'usr_super_admin_hesham' || (matched.roleIds && matched.roleIds.includes(SUPER_ADMIN_ROLE_ID));
          const verifiedUser: AdminUser = {
            ...matched,
            role: isSuper ? 'admin' : 'controller',
            roleIds: matched.roleIds && matched.roleIds.length > 0 ? matched.roleIds : (isSuper ? [SUPER_ADMIN_ROLE_ID] : [])
          };
          setCurrentUser(verifiedUser);
          setCurrentAdminUser(verifiedUser);
          setIsAdminLoggedIn(true);

          // If current tab is not accessible, auto-navigate to first permitted tab
          if (!canAccessTab(verifiedUser, adminRoles, activeTab)) {
            const allTabs: AdminTab[] = [
              'bookings', 'rooms-inventory', 'hotels', 'offers', 'districts',
              'home-sections', 'slides', 'intro-video', 'story-teaser', 'services',
              'about', 'messages', 'reviews', 'users', 'audit-log', 'settings'
            ];
            const firstAllowed = allTabs.find(t => canAccessTab(verifiedUser, adminRoles, t));
            if (firstAllowed) {
              handleSelectTab(firstAllowed);
            }
          }

          onShowToast(`مرحباً بكم ${verifiedUser.name} (${isSuper ? 'المدير العام' : 'مشرف'})`, 'success');
          setLoginLoading(false);
          return;
        }
      }

      // 3. Fallback for Firebase Email Auth (if registered)
      if (auth && input.includes('@') && password) {
        try {
          const res = await signInWithEmailAndPassword(auth, input, password);
          if (res.user) {
            localStorage.removeItem('prestige_admin_failed_attempts');
            localStorage.removeItem('prestige_admin_locked_until');
            const isSuper = inputLower === 'a.hesham@prestigehotels.sa';
            const adminProfile: AdminUser = matched || {
              id: res.user.uid,
              name: isSuper ? 'المدير العام (أحمد هشام)' : (res.user.displayName || input.split('@')[0]),
              username: input.split('@')[0],
              email: res.user.email || input,
              role: isSuper ? 'admin' : 'controller',
              status: 'active',
              createdAt: Date.now()
            };
            setCurrentUser(adminProfile);
            setCurrentAdminUser(adminProfile);
            setIsAdminLoggedIn(true);
            onShowToast(`تم تسجيل الدخول بنجاح كـ ${adminProfile.role === 'admin' ? 'المدير العام' : 'مشرف'}`, 'success');
            return;
          }
        } catch (firebaseErr: any) {
          console.warn('Firebase auth signIn error, fallback to credentials check:', firebaseErr);
        }
      }

      // Record failed attempt for rate limiting
      const failedCount = parseInt(localStorage.getItem('prestige_admin_failed_attempts') || '0', 10) + 1;
      localStorage.setItem('prestige_admin_failed_attempts', String(failedCount));
      if (failedCount >= 5) {
        const lockUntil = Date.now() + 15 * 60 * 1000;
        localStorage.setItem('prestige_admin_locked_until', String(lockUntil));
        setLoginError('تم تجاوز الحد الأقصى للمحاولات (5 محاولات). تم قفل تسجيل الدخول لمدة 15 دقيقة لدواعي الأمان.');
      } else {
        setLoginError(`اسم المستخدم أو كلمة المرور غير صحيحة (المحاولات المتبقية: ${5 - failedCount})`);
      }
    } catch (err: any) {
      setLoginError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn(e);
      }
    }
    setCurrentUser(null);
    setCurrentAdminUser(null);
    setIsAdminLoggedIn(false);
    onShowToast('تم تسجيل الخروج بنجاح', 'info');
  };

  // Sorted hotels by order (with fallback to rating) - Uses localHotels for 0ms instant UI reaction
  const sortedHotels = useMemo(() => {
    return [...localHotels].sort((a, b) => {
      const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : 9999;
      const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [localHotels]);

  // Hotel Actions
  const handleOpenAddHotel = () => {
    setEditingHotelId(null);
    setHotelFormStep(1);
    setDistanceInputStr('120');
    setHotelForm({
      id: 'hotel_' + Date.now(),
      name: '',
      nameEn: '',
      city: 'مكة المكرمة',
      district: 'أجياد',
      stars: 5,
      distanceToHaram: 120,
      distanceText: '١٢٠ متراً عن ساحة الحرم',
      walkingTimeMinutes: 2,
      transportType: 'walking',
      viewType: 'إطلالة حرم',
      featured: true,
      isActive: true,
      onlineBookingEnabled: true,
      showDistanceBadge: true,
      showStars: true,
      showRating: true,
      showCategories: true,
      showDistrict: true,
      customClassification: '',
      bookingPolicy: 'flexible',
      order: hotels.length + 1,
      categories: ['فنادق العمرة'],
      rating: 4.8,
      reviewCount: 0,
      mainImage: '',
      galleryImages: [],
      videoUrl: '',
      overview: 'فندق راقٍ يوفر إقامة هادئة بالقرب من الحرم الشريف مع بوفيه إفطار وخدمات متميزة.',
      detailedDescription: 'يتميز الفندق بموقعه الاستراتيجي وقربه من بوابات الحرم مع غرف وأجنحة مجهزة بأعلى المقاييس الفندقية العالمية لخدمة الحجاج والمعتمرين.',
      amenities: ['إطلالة حرم', 'واي فاي مجاني', 'بوفيه إفطار', 'مصاعد سريعة', 'خدمة غرف 24/7'],
      bookingUrl: '',
      showBookingUrl: true,
      agodaUrl: '',
      showAgodaUrl: true,
      expediaUrl: '',
      showExpediaUrl: true,
      googleMapsUrl: '',
      showGoogleMapsUrl: true,
      hotelWhatsApp: '',
      showHotelWhatsApp: true,
      hotelEmail: '',
      showHotelEmail: true,
      customBookingUrl: '',
      customBookingTitle: '',
      location: {
        lat: 21.4225,
        lng: 39.8262,
        address: 'أجياد، المنطقة المركزية، مكة المكرمة',
        viewType: 'إطلالة حرم',
        transportType: 'walking',
        showDistanceBadge: true
      },
      keywords: '',
      metaTitle: '',
      metaTitleEn: '',
      metaDescription: '',
      metaDescriptionEn: ''
    });
    setIsHotelModalOpen(true);
  };

  const handleEditHotel = (hotel: Hotel) => {
    setEditingHotelId(hotel.id);
    setHotelFormStep(1);

    const distMeters = hotel.distanceToHaram || 0;
    // Format distance input nicely: if 1500m show 1.5, if 350m show 350
    const initialInput = distMeters >= 1000 && distMeters % 100 === 0
      ? (distMeters / 1000).toString()
      : (distMeters > 0 ? distMeters.toString() : '0');
    setDistanceInputStr(initialInput);

    const rawView = hotel.viewType || hotel.location?.viewType || 'إطلالة حرم';
    const resolvedView = rawView.includes('مدينة') || rawView.includes('مدينه')
      ? 'إطلالة على المدينة'
      : (rawView.includes('ساحة') || rawView.includes('ساحات') ? 'ساحة الحرم' : 'إطلالة حرم');

    const isBus = isBusTransportation({
      viewType: resolvedView,
      transportType: hotel.transportType || hotel.location?.transportType,
      distanceToHaram: distMeters
    });
    const transportType = hotel.transportType || (isBus ? 'bus' : 'walking');

    setHotelForm({
      ...hotel,
      viewType: resolvedView,
      transportType,
      district: hotel.district || (hotel.city === 'مكة المكرمة' ? 'المنطقة المركزية' : 'المنطقة المركزية الشمالية'),
      featured: hotel.featured ?? true,
      isActive: hotel.isActive !== false,
      onlineBookingEnabled: hotel.onlineBookingEnabled !== false,
      showDistanceBadge: hotel.showDistanceBadge !== false,
      showStars: hotel.showStars !== false,
      showRating: hotel.showRating !== false,
      showCategories: hotel.showCategories !== false,
      showDistrict: hotel.showDistrict !== false,
      customClassification: hotel.customClassification || '',
      bookingPolicy: hotel.bookingPolicy || 'flexible',
      order: typeof hotel.order === 'number' && hotel.order > 0 ? hotel.order : (sortedHotels.findIndex(h => h.id === hotel.id) + 1),
      categories: (Array.isArray(hotel.categories) && hotel.categories.length > 0)
        ? hotel.categories
        : (typeof hotel.categories === 'string'
            ? (hotel.categories as string).split(',').map(s => s.trim()).filter(Boolean)
            : ['فنادق العمرة']),
      bookingUrl: hotel.bookingUrl || '',
      showBookingUrl: hotel.showBookingUrl !== false,
      agodaUrl: hotel.agodaUrl || '',
      showAgodaUrl: hotel.showAgodaUrl !== false,
      expediaUrl: hotel.expediaUrl || '',
      showExpediaUrl: hotel.showExpediaUrl !== false,
      googleMapsUrl: hotel.googleMapsUrl || '',
      showGoogleMapsUrl: hotel.showGoogleMapsUrl !== false,
      hotelWhatsApp: hotel.hotelWhatsApp || '',
      showHotelWhatsApp: hotel.showHotelWhatsApp !== false,
      hotelEmail: hotel.hotelEmail || '',
      showHotelEmail: hotel.showHotelEmail !== false,
      customBookingUrl: hotel.customBookingUrl || '',
      customBookingTitle: hotel.customBookingTitle || '',
      location: {
        ...hotel.location,
        viewType: resolvedView,
        transportType
      },
      keywords: hotel.keywords || '',
      metaTitle: hotel.metaTitle || '',
      metaTitleEn: hotel.metaTitleEn || '',
      metaDescription: hotel.metaDescription || '',
      metaDescriptionEn: hotel.metaDescriptionEn || ''
    });
    setNewCategoryInput('');
    setIsHotelModalOpen(true);
  };

  const toggleFormCategory = (category: string) => {
    setHotelForm(prev => {
      const current = Array.isArray(prev.categories) ? prev.categories : [];
      const exists = current.includes(category);
      const updated = exists ? current.filter(c => c !== category) : [...current, category];
      return {
        ...prev,
        categories: updated
      };
    });
  };

  const handleAddCustomCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    setHotelForm(prev => {
      const current = Array.isArray(prev.categories) ? prev.categories : [];
      if (current.includes(trimmed)) return prev;
      return {
        ...prev,
        categories: [...current, trimmed]
      };
    });
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    setHotelForm(prev => ({
      ...prev,
      categories: (Array.isArray(prev.categories) ? prev.categories : []).filter(c => c !== cat)
    }));
  };

  // Toggle Hotel Active / Hidden (تفعيل أو إخفاء الفندق من الموقع) - Instant 0ms Optimistic Update
  const handleToggleHotelActive = async (hotel: Hotel) => {
    const newActive = hotel.isActive === false ? true : false;
    const updated: Hotel = { ...hotel, isActive: newActive };

    // 1. INSTANT 0ms OPTIMISTIC UI: Toggle pill switches in the exact millisecond!
    setLocalHotels(prev => prev.map(h => h.id === hotel.id ? updated : h));

    onShowToast(
      newActive
        ? `تم تفعيل فندق "${hotel.name}" وظهوره في الموقع للزوار`
        : `تم إخفاء فندق "${hotel.name}" من الموقع ولن يظهر للزوار`,
      'success'
    );

    // 2. Background async sync to Supabase with real-time saving status
    try {
      await executeAutoSave(async () => {
        await saveHotelToDb(updated);
        await onRefreshData();
      });
    } catch (err) {
      console.error('Error toggling hotel active:', err);
      // Revert if error
      setLocalHotels(hotels);
      onShowToast('حدث خطأ أثناء تعديل حالة الفندق', 'error');
    }
  };

  // Toggle Hotel Online Booking (تفعيل أو تعطيل الحجز أونلاين) - Instant 0ms Optimistic Update
  const handleToggleHotelOnlineBooking = async (hotel: Hotel) => {
    const newOnline = hotel.onlineBookingEnabled === true ? false : true;
    const updated: Hotel = { ...hotel, onlineBookingEnabled: newOnline };

    setLocalHotels(prev => prev.map(h => h.id === hotel.id ? updated : h));

    onShowToast(
      newOnline
        ? `تم تفعيل الحجز أونلاين لفندق "${hotel.name}"`
        : `تم تحويل الحجز لفندق "${hotel.name}" إلى حجز مباشر عبر الواتساب فقط`,
      'success'
    );

    try {
      await executeAutoSave(async () => {
        await saveHotelToDb(updated);
        await onRefreshData();
      });
    } catch (err) {
      console.error('Error toggling hotel online booking:', err);
      setLocalHotels(hotels);
      onShowToast('حدث خطأ أثناء تعديل حالة الحجز أونلاين للفندق', 'error');
    }
  };

  // Move hotel up or down in display order (ترتيب الظهور) - Instant 0ms Optimistic Reorder
  const handleMoveHotelOrder = async (hotelId: string, direction: 'up' | 'down') => {
    const currentIndex = sortedHotels.findIndex(h => h.id === hotelId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedHotels.length) return;

    const currentHotel = sortedHotels[currentIndex];
    const targetHotel = sortedHotels[targetIndex];

    const updatedCurrent = { ...currentHotel, order: targetIndex + 1 };
    const updatedTarget = { ...targetHotel, order: currentIndex + 1 };

    // 1. INSTANT 0ms OPTIMISTIC REORDER: Row swaps position immediately!
    setLocalHotels(prev => prev.map(h => {
      if (h.id === currentHotel.id) return updatedCurrent;
      if (h.id === targetHotel.id) return updatedTarget;
      return h;
    }));

    onShowToast(`تم تعديل ترتيب ظهور فندق "${currentHotel.name}" بنجاح`, 'success');

    // 2. Background async sync to Supabase with real-time saving status
    try {
      await executeAutoSave(async () => {
        await Promise.all([
          saveHotelToDb(updatedCurrent),
          saveHotelToDb(updatedTarget)
        ]);
        await onRefreshData();
      });
    } catch (err) {
      console.error('Error moving hotel order:', err);
      // Revert if error
      setLocalHotels(hotels);
      onShowToast('حدث خطأ أثناء حفظ الترتيب الجديد', 'error');
    }
  };

  const handleToggleHotelFeatured = async (hotel: Hotel) => {
    const newFeatured = !hotel.featured;
    const updated: Hotel = { ...hotel, featured: newFeatured };

    // 1. INSTANT 0ms OPTIMISTIC UPDATE
    setLocalHotels(prev => prev.map(h => h.id === hotel.id ? updated : h));

    onShowToast(
      newFeatured
        ? `تمت إضافة فندق "${hotel.name}" إلى البار المتغيّر بالرئيسية`
        : `تمت إزالة فندق "${hotel.name}" من البار المتغيّر بالرئيسية`,
      'success'
    );

    try {
      await executeAutoSave(async () => {
        await saveHotelToDb(updated);
        await onRefreshData();
      });
    } catch (err) {
      console.error('Error toggling hotel featured:', err);
      setLocalHotels(hotels);
      onShowToast('حدث خطأ أثناء تعديل حالة التمييز', 'error');
    }
  };

  // Toggle Hotel Distance Badge (إظهار أو إخفاء شارة دقائق السير على البطاقة) - Instant 0ms Optimistic Update
  const handleToggleHotelDistanceBadge = async (hotel: Hotel) => {
    const newShow = hotel.showDistanceBadge === false ? true : false;
    const updated: Hotel = { 
      ...hotel, 
      showDistanceBadge: newShow,
      showTransportInfo: newShow,
      location: { 
        address: hotel.location?.address || '',
        viewType: hotel.location?.viewType || 'إطلالة على المدينة',
        ...(hotel.location || {}), 
        showDistanceBadge: newShow,
        showTransportInfo: newShow
      }
    };

    setLocalHotels(prev => prev.map(h => h.id === hotel.id ? updated : h));

    onShowToast(
      newShow
        ? `تم إظهار شارة وعداد دقائق السير لفندق "${hotel.name}"`
        : `تم إخفاء شارة وعداد دقائق السير تماماً لفندق "${hotel.name}"`,
      'success'
    );

    try {
      await executeAutoSave(async () => {
        await saveHotelToDb(updated);
        await onRefreshData();
      });
    } catch (err) {
      console.error('Error toggling hotel distance badge:', err);
      setLocalHotels(hotels);
      onShowToast('حدث خطأ أثناء تعديل إعدادات شارة المسافة', 'error');
    }
  };

  // Toggle Hotel Stars Badge (إظهار أو إخفاء النجوم على البطاقة) - Instant 0ms Optimistic Update
  const handleToggleHotelStarsBadge = async (hotel: Hotel) => {
    const newShow = hotel.showStars === false ? true : false;
    const updated: Hotel = { 
      ...hotel, 
      showStars: newShow,
      location: {
        address: hotel.location?.address || '',
        viewType: hotel.location?.viewType || '',
        ...(hotel.location || {}),
        showStars: newShow
      }
    };

    setLocalHotels(prev => prev.map(h => h.id === hotel.id ? updated : h));

    onShowToast(
      newShow
        ? `تم إظهار تصنيف النجوم لفندق "${hotel.name}"`
        : `تم إخفاء تصنيف النجوم لفندق "${hotel.name}"`,
      'success'
    );

    try {
      await executeAutoSave(async () => {
        await saveHotelToDb(updated);
        await onRefreshData();
      });
    } catch (err) {
      console.error('Error toggling hotel stars badge:', err);
      setLocalHotels(hotels);
      onShowToast('حدث خطأ أثناء تعديل ظهور النجوم', 'error');
    }
  };

  // Toggle Hotel Categories Badge (إظهار أو إخفاء تصنيفات الفندق رمضان/عمرة/حج) - Instant 0ms Optimistic Update
  const handleToggleHotelCategoriesBadge = async (hotel: Hotel) => {
    const newShow = hotel.showCategories === false ? true : false;
    const updated: Hotel = { 
      ...hotel, 
      showCategories: newShow,
      location: {
        address: hotel.location?.address || '',
        viewType: hotel.location?.viewType || '',
        ...(hotel.location || {}),
        showCategories: newShow
      }
    };

    setLocalHotels(prev => prev.map(h => h.id === hotel.id ? updated : h));

    onShowToast(
      newShow
        ? `تم إظهار تصنيفات الفندق لفندق "${hotel.name}"`
        : `تم إخفاء تصنيفات الفندق لفندق "${hotel.name}"`,
      'success'
    );

    try {
      await executeAutoSave(async () => {
        await saveHotelToDb(updated);
        await onRefreshData();
      });
    } catch (err) {
      console.error('Error toggling hotel categories badge:', err);
      setLocalHotels(hotels);
      onShowToast('حدث خطأ أثناء تعديل ظهور تصنيفات الفندق', 'error');
    }
  };

  // Bulk Toggle Distance Badge for all hotels or filtered by city (أداة التحكم الشامل بعداد ودقائق السير)
  const handleBulkToggleDistanceBadge = async (newShow: boolean, filterCity?: string) => {
    const targetHotels = localHotels.filter(h => !filterCity || filterCity === 'all' || h.city === filterCity);
    if (targetHotels.length === 0) {
      onShowToast('لا توجد فنادق مطابقة لتحديثها', 'warning');
      return;
    }

    const updatedList = localHotels.map(h => {
      if (!filterCity || filterCity === 'all' || h.city === filterCity) {
        return {
          ...h,
          showDistanceBadge: newShow,
          showTransportInfo: newShow,
          location: {
            address: h.location?.address || '',
            viewType: h.location?.viewType || 'إطلالة على المدينة',
            ...(h.location || {}),
            showDistanceBadge: newShow,
            showTransportInfo: newShow
          }
        };
      }
      return h;
    });

    // 1. INSTANT OPTIMISTIC UPDATE
    setLocalHotels(updatedList);

    const count = targetHotels.length;
    const cityText = filterCity === 'مكة المكرمة' ? 'بمكة المكرمة' : filterCity === 'المدينة المنورة' ? 'بالمدينة المنورة' : '';
    onShowToast(
      newShow
        ? `تم إظهار وتفعيل عداد السير لـ ${count} فندق ${cityText} بنجاح`
        : `تم إخفاء عداد السير تماماً عن ${count} فندق ${cityText} بنجاح`,
      'success'
    );

    // 2. Persist to DB in parallel
    try {
      await executeAutoSave(async () => {
        const toSave = updatedList.filter(h => targetHotels.some(th => th.id === h.id));
        await Promise.all(toSave.map(h => saveHotelToDb(h)));
        await onRefreshData();
      });
    } catch (err) {
      console.error('Error bulk toggling distance badge:', err);
      setLocalHotels(hotels);
      onShowToast('حدث خطأ أثناء حفظ التحديث الجماعي', 'error');
    }
  };

  const handleSaveHotel = async () => {
    if (!hotelForm.name.trim()) {
      onShowToast('يرجى إدخال اسم الفندق', 'error');
      setHotelFormStep(1);
      return;
    }

    if (!hotelForm.district?.trim()) {
      onShowToast('يرجى تحديد أو كتابة اسم الحي', 'error');
      setHotelFormStep(1);
      return;
    }

    try {
      const distMeters = parseDistanceInput(distanceInputStr || hotelForm.distanceToHaram);
      const rawView = hotelForm.viewType || hotelForm.location?.viewType || 'إطلالة حرم';
      const resolvedView = rawView.includes('مدينة') || rawView.includes('مدينه')
        ? 'إطلالة على المدينة'
        : (rawView.includes('ساحة') || rawView.includes('ساحات') ? 'ساحة الحرم' : 'إطلالة حرم');

      const isBus = isBusTransportation({
        viewType: resolvedView,
        transportType: hotelForm.transportType || hotelForm.location?.transportType,
        distanceToHaram: distMeters
      });
      const transportMode = hotelForm.transportType || (isBus ? 'bus' : 'walking');
      const transportInfo = formatTransportText({
        distanceToHaram: distMeters,
        viewType: resolvedView,
        transportType: transportMode,
        walkingTimeMinutes: hotelForm.walkingTimeMinutes
      }, 'ar');

      const finalizedHotel: Hotel = {
        ...hotelForm,
        distanceToHaram: distMeters,
        distanceText: transportInfo.text,
        showDistanceBadge: hotelForm.showDistanceBadge !== false,
        showStars: hotelForm.showStars !== false,
        showRating: hotelForm.showRating !== false,
        showCategories: hotelForm.showCategories !== false,
        showDistrict: hotelForm.showDistrict !== false,
        customClassification: hotelForm.customClassification?.trim() || undefined,
        viewType: resolvedView,
        transportType: transportMode,
        location: {
          ...hotelForm.location,
          viewType: resolvedView,
          transportType: transportMode,
          showDistanceBadge: hotelForm.showDistanceBadge !== false,
          showStars: hotelForm.showStars !== false,
          showRating: hotelForm.showRating !== false,
          showCategories: hotelForm.showCategories !== false,
          showDistrict: hotelForm.showDistrict !== false,
          customClassification: hotelForm.customClassification?.trim() || undefined
        }
      };

      // Optimistic update
      const isEdit = Boolean(editingHotelId);
      setLocalHotels(prev => isEdit ? prev.map(h => h.id === finalizedHotel.id ? finalizedHotel : h) : [finalizedHotel, ...prev]);
      setIsHotelModalOpen(false);
      onShowToast(editingHotelId ? 'تم تحديث بيانات الفندق بنجاح' : 'تمت إضافة الفندق الجديد بنجاح', 'success');

      await executeAutoSave(async () => {
        await saveHotelToDb(finalizedHotel);
        await handleRecordAudit({
          module: 'hotels',
          action: isEdit ? 'تعديل فندق' : 'إضافة فندق',
          details: `${isEdit ? 'تعديل بيانات الفندق' : 'إضافة فندق جديد'}: "${finalizedHotel.name}" (${finalizedHotel.city})`,
          recordId: finalizedHotel.id,
          recordTitle: finalizedHotel.name,
          newValue: { name: finalizedHotel.name, city: finalizedHotel.city, district: finalizedHotel.district, stars: finalizedHotel.stars }
        });
        await onRefreshData();
      });
    } catch (err) {
      console.error(err);
      setLocalHotels(hotels);
      onShowToast('حدث خطأ أثناء حفظ الفندق في قاعدة البيانات', 'error');
    }
  };

  const confirmDeleteHotel = (hotel: Hotel) => {
    setDeleteModal({
      isOpen: true,
      type: 'hotel',
      id: hotel.id,
      title: hotel.name
    });
  };

  // Offer / Ad Actions
  const handleOpenAddOffer = () => {
    setEditingOfferId(null);
    setOfferForm({
      id: 'offer_' + Date.now(),
      title: '',
      shortDescription: '',
      fullDescription: '',
      mediaType: 'image',
      mediaUrl: '',
      videoUrl: '',
      discountPercentage: 20,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
      isActive: true,
      badgeText: 'إعلان مميز',
      showDiscount: true,
      showCountdown: true,
      showInHeroSlides: false,
      gallery: [],
      keywords: '',
      metaDescription: ''
    });
    setNewGalleryUrl('');
    setNewGalleryCaption('');
    setIsOfferModalOpen(true);
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setOfferForm({ 
      ...offer,
      showDiscount: offer.showDiscount ?? true,
      showCountdown: offer.showCountdown ?? true,
      showInHeroSlides: offer.showInHeroSlides ?? false,
      gallery: offer.gallery || [],
      keywords: offer.keywords || '',
      metaDescription: offer.metaDescription || ''
    });
    setNewGalleryUrl('');
    setNewGalleryCaption('');
    setIsOfferModalOpen(true);
  };

  const handleOfferImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        onShowToast('حجم الملف يتجاوز 15 ميجابايت، يرجى اختيار ملف أصغر', 'error');
        return;
      }
      setIsOfferUploading(true);
      setOfferUploadProgress(20);
      try {
        // Try uploading to Supabase Storage first for cloud persistence
        const res = await uploadMediaToSupabase(file, 'images');
        setOfferUploadProgress(100);
        const uploadedUrl = typeof res === 'string' ? res : (res?.url || '');
        if (uploadedUrl) {
          setOfferForm((prev) => ({ ...prev, mediaUrl: uploadedUrl }));
          onShowToast('تم رفع الصورة إلى التخزين السحابي بنجاح', 'success');
        } else {
          // Fallback to optimized base64
          const optimized = await optimizeImageFile(file, {
            maxWidth: 1400,
            maxHeight: 900,
            forcePng: file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
          });
          setOfferForm((prev) => ({ ...prev, mediaUrl: optimized }));
          onShowToast('تم ضغط وحفظ صورة الإعلان بنجاح', 'success');
        }
      } catch (err) {
        console.error('Error optimizing offer image:', err);
        onShowToast('حدث خطأ أثناء معالجة ملف الصورة', 'error');
      } finally {
        setIsOfferUploading(false);
        setOfferUploadProgress(0);
      }
    }
  };

  const handleAddGalleryItem = (type: 'image' | 'video', url: string, caption?: string) => {
    if (!url.trim()) return;
    const newItem = {
      id: 'gallery_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      type,
      url: url.trim(),
      caption: caption?.trim() || undefined
    };
    setOfferForm(prev => ({
      ...prev,
      gallery: [...(prev.gallery || []), newItem]
    }));
    setNewGalleryUrl('');
    setNewGalleryCaption('');
    onShowToast('تمت إضافة الوسائط إلى معرض الإعلان بنجاح', 'info');
  };

  const handleRemoveGalleryItem = (id: string) => {
    setOfferForm(prev => ({
      ...prev,
      gallery: (prev.gallery || []).filter(item => item.id !== id)
    }));
  };

  const handleUploadGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingGalleryItem(true);
    try {
      const isVideo = file.type.startsWith('video/');
      const res = await uploadMediaToSupabase(file, isVideo ? 'videos' : 'images');
      const uploadedUrl = typeof res === 'string' ? res : (res?.url || '');
      if (uploadedUrl) {
        handleAddGalleryItem(isVideo ? 'video' : 'image', uploadedUrl, file.name);
      } else {
        if (!isVideo) {
          const opt = await optimizeImageFile(file, { maxWidth: 1400, maxHeight: 900 });
          handleAddGalleryItem('image', opt, file.name);
        } else {
          onShowToast('يرجى التأكد من إعدادات سوبابيس لرفع الفيديو المباشر أو استخدم رابط مباشر', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء رفع ملف المعرض', 'error');
    } finally {
      setIsUploadingGalleryItem(false);
    }
  };

  const handleSaveOffer = async () => {
    if (!offerForm.title.trim()) {
      onShowToast('يرجى إدخال عنوان الإعلان أو المناسبة', 'error');
      return;
    }

    try {
      setIsOfferModalOpen(false);
      onShowToast(editingOfferId ? 'تم تحديث الإعلان وحفظه تلقائياً بنجاح' : 'تمت إضافة الإعلان الجديد بنجاح', 'success');

      await executeAutoSave(async () => {
        await saveOfferToDb(offerForm);
        await onRefreshData();
      });
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء حفظ الإعلان', 'error');
    }
  };

  // Quick Toggles with Instant Auto-Save for Ads
  const handleToggleOfferActive = async (offer: Offer) => {
    try {
      const updated = { ...offer, isActive: !offer.isActive };
      onShowToast(updated.isActive ? 'تم تفعيل الإعلان وإظهاره للزوار' : 'تم إخفاء الإعلان عن الزوار', 'info');

      await executeAutoSave(async () => {
        await saveOfferToDb(updated);
        await onRefreshData();
      });
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء تحديث حالة الإعلان', 'error');
    }
  };

  const handleToggleOfferHeroSlides = async (offer: Offer) => {
    try {
      const updated = { ...offer, showInHeroSlides: !offer.showInHeroSlides };
      onShowToast(
        updated.showInHeroSlides 
          ? 'تم إدراج الإعلان في شرائح الترحيب (الهيرو) بالأعلى بنجاح ✓' 
          : 'تم إلغاء ظهور الإعلان من شرائح الترحيب', 
        'info'
      );

      await executeAutoSave(async () => {
        await saveOfferToDb(updated);
        await onRefreshData();
      });
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء تحديث ظهور الإعلان في الهيرو', 'error');
    }
  };

  const handleToggleOfferCountdown = async (offer: Offer) => {
    try {
      const updated = { ...offer, showCountdown: offer.showCountdown === false ? true : false };
      onShowToast(updated.showCountdown ? 'تم تفعيل مؤقت العد التنازلي' : 'تم إخفاء مؤقت العد التنازلي', 'info');

      await executeAutoSave(async () => {
        await saveOfferToDb(updated);
        await onRefreshData();
      });
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء تحديث العد التنازلي', 'error');
    }
  };

  const handleToggleOfferDiscount = async (offer: Offer) => {
    try {
      const updated = { ...offer, showDiscount: offer.showDiscount === false ? true : false };
      onShowToast(updated.showDiscount ? 'تم تفعيل شارة ونسبة الخصم' : 'تم إخفاء شارة الخصم', 'info');

      await executeAutoSave(async () => {
        await saveOfferToDb(updated);
        await onRefreshData();
      });
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء تحديث شارة الخصم', 'error');
    }
  };

  const confirmDeleteOffer = (offer: Offer) => {
    setDeleteModal({
      isOpen: true,
      type: 'offer',
      id: offer.id,
      title: offer.title
    });
  };

  // Execution of Delete (0ms Instant Optimistic UI + Background Sync)
  const handleExecuteDelete = async () => {
    const { type, id, title } = deleteModal;
    if (!id) return;

    // 1. INSTANT 0ms OPTIMISTIC UI: Close modal immediately!
    setDeleteModal({ isOpen: false, type: 'hotel', id: '', title: '' });

    // 2. Remove item from local state and toast immediately
    if (type === 'hotel') {
      setLocalHotels(prev => prev.filter(h => h.id !== id));
      onShowToast(`تم حذف الفندق "${title}" نهائياً`, 'success');
      deleteHotelFromDb(id).catch(err => {
        console.error('Error deleting hotel:', err);
        setLocalHotels(hotels);
        onShowToast('حدث خطأ أثناء حذف الفندق من الخادم', 'error');
      });
      handleRecordAudit({
        module: 'hotels',
        action: 'حذف فندق',
        details: `حذف الفندق "${title}" نهائياً من النظام`,
        recordId: id,
        recordTitle: title
      }).catch(() => {});
    } else if (type === 'offer') {
      setLocalOffers(prev => prev.filter(o => o.id !== id));
      onShowToast(`تم حذف العرض "${title}" نهائياً`, 'success');
      deleteOfferFromDb(id).catch(err => {
        console.error('Error deleting offer:', err);
        setLocalOffers(offers);
        onShowToast('حدث خطأ أثناء حذف العرض من الخادم', 'error');
      });
    } else if (type === 'review') {
      setReviews(prev => prev.filter(r => r.id !== id));
      onShowToast('تم حذف التقييم بنجاح', 'success');
      deleteReviewFromDb(id).catch(err => {
        console.error('Error deleting review:', err);
        loadReviews();
        onShowToast('حدث خطأ أثناء حذف التقييم من الخادم', 'error');
      });
    } else if (type === 'message') {
      setMessages(prev => prev.filter(m => m.id !== id));
      onShowToast('تم حذف الرسالة بنجاح', 'success');
      deleteMessageFromDb(id).catch(err => {
        console.error('Error deleting message:', err);
        loadMessages();
        onShowToast('حدث خطأ أثناء حذف الرسالة من الخادم', 'error');
      });
    }
  };

  const handleToggleMessageRead = async (msg: ContactMessage) => {
    const newStatus = !msg.read;
    // 1. INSTANT 0ms OPTIMISTIC UI
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: newStatus } : m));
    onShowToast(newStatus ? 'تم تعليم الرسالة كمقروءة ✓' : 'تم تعليم الرسالة كغير مقروءة ✉️', 'info');

    // 2. Background Sync
    try {
      await executeAutoSave(async () => {
        await markMessageAsReadInDb(msg.id, newStatus);
      });
    } catch (e) {
      console.error('Error toggling message read status:', e);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: !newStatus } : m));
      onShowToast('حدث خطأ أثناء تحديث حالة الرسالة في الخادم', 'error');
    }
  };

  const confirmDeleteMessage = (msg: ContactMessage) => {
    setDeleteModal({
      isOpen: true,
      type: 'message',
      id: msg.id,
      title: `رسالة ${msg.name}`
    });
  };

  // Amenity tag adding
  const handleAddAmenity = () => {
    if (newAmenityInput.trim() && !hotelForm.amenities.includes(newAmenityInput.trim())) {
      setHotelForm(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenityInput.trim()]
      }));
      setNewAmenityInput('');
    }
  };

  const handleRemoveAmenity = (name: string) => {
    setHotelForm(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== name)
    }));
  };

  const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length;
  const unreadMessagesCount = messages.filter(m => !m.read).length;

  // If NOT logged in, show luxury light login page
  if (!isAdminLoggedIn) {
    return (
      <div id="admin-login-screen" className="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-4 pt-24 pb-20">
        <div className="max-w-md w-full bg-white border border-[#E8E2D8] rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#DFBE72] via-[#C9A24B] to-[#98752B] p-[1.5px] mx-auto mb-4 shadow-md shadow-[#C9A24B]/20">
              <div className="w-full h-full bg-[#FAF8F5] rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-[#B38A34]" />
              </div>
            </div>
            <h2 className="text-2xl font-cairo font-bold text-stone-900 mb-2">تسجيل دخول المسؤول</h2>
            <p className="text-xs text-stone-600">
              لوحة تحكم إدارة الفنادق، العروض، والتقييمات ورسائل ضيوف الرحمن
            </p>
          </div>

          {loginError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">اسم المستخدم (Username):</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="A.hesham أو اسم المستخدم المسجل"
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors dir-ltr text-right"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">كلمة المرور (Password):</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors dir-ltr text-right"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loginLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs text-stone-500 hover:text-[#C9A24B] transition-colors"
            >
              العودة إلى الصفحة الرئيسية للموقع
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  return (
    <div id="admin-dashboard-container" className="min-h-screen bg-[#F8F7F4] text-stone-900 pt-28 pb-20">
      <div className="w-full max-w-[1780px] mx-auto px-3 sm:px-6 lg:px-8">
        {/* Dashboard Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center border border-[#C9A24B]/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-cairo font-bold text-stone-900">
                  لوحة تحكم إدارة شركة برستيج
                </h1>
                {currentUser && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-100 text-[#98752B] border border-amber-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {currentUser.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    <span>{currentUser.name} ({currentUser.role === 'admin' ? 'مدير عام' : 'متحكم'})</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                إدارة الفنادق، الأحياء، المستخدمين، العروض، والتقييمات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Real-time Auto-save & Cloud Sync Indicator Badge */}
            {autoSaveStatus === 'saving' && (
              <div id="admin-header-autosave-saving" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-bold animate-pulse shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>جاري الحفظ تلقائياً...</span>
              </div>
            )}
            {autoSaveStatus === 'saved' && (
              <div id="admin-header-autosave-saved" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-bold shadow-xs transition-all">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>تم الحفظ والمزامنة بنجاح ✓</span>
              </div>
            )}
            {autoSaveStatus === 'idle' && (
              <div id="admin-header-autosave-idle" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100/80 border border-stone-200 text-stone-600 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>الحفظ التلقائي مفعّل ☁️</span>
              </div>
            )}

            {/* Toggle Full Workspace Width (Collapse Sidebar) */}
            <button
              type="button"
              onClick={() => setIsSidebarHidden(prev => !prev)}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title={isSidebarHidden ? 'إظهار القائمة الجانبية' : 'توسيع شاشة العمل وإخفاء القائمة الجانبية مؤقتاً لعرض كامل الجداول بدون سحب'}
            >
              <Layout className="w-3.5 h-3.5 text-[#B38A34]" />
              <span>{isSidebarHidden ? 'إظهار القائمة ◨' : 'توسيع شاشة العمل ⛶'}</span>
            </button>

            <button
              onClick={onNavigateHome}
              className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C9A24B]" />
              <span>معاينة الموقع كزائر</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid Layout: Responsive Sidebar & Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          {/* Hierarchical Sidebar Navigation (القوائم الرئيسية والمنسدلة الفرعية) */}
          {!isSidebarHidden && (
            <div className="lg:col-span-3 xl:col-span-2 flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 gap-3 no-scrollbar transition-all">
            {[
              {
                id: 'online-booking',
                categoryTitle: 'منظومة الحجوزات والتسكين أونلاين',
                categoryIcon: Calendar,
                badgeCount: pendingBookingsCount > 0 ? pendingBookingsCount : undefined,
                badgeAlert: pendingBookingsCount > 0,
                items: [
                  { 
                    id: 'bookings' as AdminTab, 
                    label: 'سجل الحجوزات والمتابعة', 
                    icon: Calendar, 
                    count: pendingBookingsCount > 0 ? pendingBookingsCount : (totalBookingsCount || undefined),
                    badgeAlert: pendingBookingsCount > 0 
                  },
                  { 
                    id: 'online-control' as AdminTab, 
                    label: 'إتاحة الفنادق والمواسم للزوار', 
                    icon: Sliders,
                    badgeAlert: true
                  },
                  { 
                    id: 'calendar-grid' as AdminTab, 
                    label: 'مصفوفة التقويم والتوفر اليومي', 
                    icon: LayoutGrid 
                  },
                  { 
                    id: 'rooms-list' as AdminTab, 
                    label: 'فئات الغرف والمفاتيح الرقمية', 
                    icon: BedDouble 
                  },
                  { 
                    id: 'meals-list' as AdminTab, 
                    label: 'خطط وباقات الوجبات', 
                    icon: Utensils 
                  },
                  { 
                    id: 'packages-list' as AdminTab, 
                    label: 'باقات الإقامة الخاصة', 
                    icon: Sparkles 
                  },
                  { 
                    id: 'periods-pricing' as AdminTab, 
                    label: 'المواسم والفترات التسعيرية', 
                    icon: CalendarRange 
                  },
                  { 
                    id: 'booking-rules' as AdminTab, 
                    label: 'قواعد الحجز والسياسات والشروط', 
                    icon: ShieldCheck 
                  }
                ]
              },
              {
                id: 'hotels-locations',
                categoryTitle: 'الفنادق والمواقع الجغرافية',
                categoryIcon: Building2,
                badgeCount: hotels.length,
                items: [
                  { id: 'hotels' as AdminTab, label: 'الفنادق المعتمدة', icon: Building2, count: hotels.length },
                  { id: 'districts' as AdminTab, label: 'المناطق والأحياء والمواقع', icon: MapPin, count: districts.length || undefined }
                ]
              },
              {
                id: 'site-content',
                categoryTitle: 'صفحات الموقع والمحتوى المرئي',
                categoryIcon: Layout,
                items: [
                  { id: 'slides' as AdminTab, label: 'الشرائح الترحيبية (الهيرو)', icon: ImageIcon, count: siteSettings?.heroSlides?.length || undefined },
                  { id: 'intro-video' as AdminTab, label: 'فيديو الإنترو الترحيبي', icon: Film },
                  { id: 'offers' as AdminTab, label: 'الإعلانات وبوسترات العروض', icon: Tag, count: offers.length },
                  { 
                    id: 'contacts' as AdminTab, 
                    label: 'صفحة تواصل معنا والدليل', 
                    icon: Phone, 
                    count: settingsForm?.contactsDirectory?.length || siteSettings?.contactsDirectory?.length || undefined 
                  },
                  { id: 'about' as AdminTab, label: 'صفحة من نحن وفروع الشركة', icon: Info },
                  { id: 'story-teaser' as AdminTab, label: 'قصة ونبذة الشركة التفاعلية', icon: Sparkles },
                  { id: 'services' as AdminTab, label: 'منظومة الخدمات المتكاملة', icon: Layers },
                  { id: 'buttons' as AdminTab, label: 'أزرار وبطاقات الإجراءات', icon: MousePointerClick, count: settingsForm?.actionButtons?.length || siteSettings?.actionButtons?.length || undefined },
                  { id: 'home-sections' as AdminTab, label: 'ترتيب وتخصيص أقسام الرئيسية', icon: Sliders }
                ]
              },
              {
                id: 'inbox-reviews',
                categoryTitle: 'التواصل والرسائل والتقييمات',
                categoryIcon: MessageSquare,
                badgeCount: (unreadMessagesCount > 0 ? unreadMessagesCount : 0) + (pendingReviewsCount > 0 ? pendingReviewsCount : 0) || undefined,
                badgeAlert: unreadMessagesCount > 0 || pendingReviewsCount > 0,
                items: [
                  { id: 'messages' as AdminTab, label: 'الرسائل والاستفسارات الواردة', icon: Mail, count: unreadMessagesCount > 0 ? unreadMessagesCount : (messages.length || undefined), badgeAlert: unreadMessagesCount > 0 },
                  { id: 'reviews' as AdminTab, label: 'تقييمات وآراء النزلاء', icon: MessageSquare, count: pendingReviewsCount > 0 ? pendingReviewsCount : (reviews.length || undefined), badgeAlert: pendingReviewsCount > 0 }
                ]
              },
              {
                id: 'system-security',
                categoryTitle: 'إعدادات المنصة والأمان والمشرفين',
                categoryIcon: Settings,
                items: [
                  { id: 'settings' as AdminTab, label: 'الهوية البصرية والإعدادات العامة', icon: Settings },
                  { id: 'users' as AdminTab, label: 'المشرفين والصلاحيات (RBAC)', icon: Users, count: adminUsers.length || undefined },
                  { id: 'audit-log' as AdminTab, label: 'سجل تدقيق العمليات', icon: Clock, count: auditLogs.length || undefined }
                ]
              }
            ].map((group) => {
              const visibleItems = group.items.filter(item => canAccessTab(currentUser, adminRoles, item.id));
              if (visibleItems.length === 0) return null;
              const isExpanded = expandedMenus[group.id] !== false;
              const hasActiveChild = visibleItems.some(item => activeTab === item.id);

              return (
                <div key={group.id} className="space-y-1.5 shrink-0 lg:w-full bg-white/80 backdrop-blur-md rounded-2xl p-2.5 border border-stone-200/80 shadow-2xs">
                  {/* Category Header (Accordion Toggle) */}
                  <button
                    type="button"
                    onClick={() => toggleMenu(group.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      hasActiveChild 
                        ? 'bg-[#C9A24B]/15 text-[#8C6D23]' 
                        : 'text-stone-700 hover:bg-stone-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <group.categoryIcon className="w-4 h-4 text-[#B38A34]" />
                      <span className="truncate">{group.categoryTitle}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {group.badgeCount !== undefined && group.badgeCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          group.badgeAlert 
                            ? 'bg-amber-500 text-white animate-pulse' 
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          {group.badgeCount}
                        </span>
                      )}
                      <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Sub-items (القوائم الفرعية المنسدلة) */}
                  {isExpanded && (
                    <div className="flex lg:flex-col gap-1 pr-1.5 lg:pr-2 border-r-2 border-[#C9A24B]/30 pt-1">
                      {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const isSelected = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            id={`admin-tab-btn-${item.id}`}
                            onClick={() => handleSelectTab(item.id)}
                            className={`shrink-0 lg:w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white shadow-md shadow-[#C9A24B]/20 font-bold'
                                : 'bg-transparent hover:bg-stone-100 text-stone-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-stone-500'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.count !== undefined && (
                              <span className={`text-[10px] mr-1.5 px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                isSelected 
                                  ? 'bg-white/20 text-white' 
                                  : (item as any).badgeAlert 
                                  ? 'bg-amber-500 text-white animate-pulse'
                                  : 'bg-stone-200/70 text-stone-700'
                              }`}>
                                {item.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}

          {/* Main Content Area: Expands to full 100% width (col-span-12) when sidebar is hidden */}
          <div className={isSidebarHidden ? "col-span-12 w-full transition-all duration-300" : "lg:col-span-9 xl:col-span-10 w-full transition-all duration-300"}>
            {!canAccessTab(currentUser, adminRoles, activeTab) ? (
              <AccessDeniedScreen
                tab={activeTab}
                user={currentUser}
                roles={adminRoles}
                onNavigateTab={(allowedTab) => handleSelectTab(allowedTab as AdminTab)}
              />
            ) : (
              <>
            {/* ONLINE AVAILABILITY & PERIODS CONTROL (NEW DEDICATED MANAGER) */}
            {activeTab === 'online-control' && (
              <AdminOnlineAvailabilityManager
                hotels={localHotels}
                siteSettings={siteSettings}
                onUpdateHotel={async (updatedHotel) => {
                  setLocalHotels(prev => prev.map(h => h.id === updatedHotel.id ? updatedHotel : h));
                  try {
                    await saveHotelToDb(updatedHotel);
                  } catch (err) {
                    console.error('Failed to save hotel in DB:', err);
                  }
                }}
                onUpdateSiteSettings={onUpdateSiteSettings}
                onShowToast={onShowToast}
              />
            )}

            {/* ROOM BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <AdminBookingsManager 
                onShowToast={onShowToast}
                siteSettings={siteSettings}
                currentUser={currentUser}
                adminRoles={adminRoles}
                hotels={localHotels}
              />
            )}

            {/* ROOMS, CALENDAR MATRIX, MEALS, PACKAGES, PERIODS, RULES TAB */}
            {(activeTab === 'rooms-inventory' || 
              activeTab === 'calendar-grid' || 
              activeTab === 'rooms-list' || 
              activeTab === 'meals-list' || 
              activeTab === 'packages-list' || 
              activeTab === 'periods-pricing' || 
              activeTab === 'booking-rules') && (
              <AdminRoomsManager 
                hotels={localHotels}
                onShowToast={onShowToast}
                onRefreshHotels={onRefreshData}
                onUpdateHotel={async (updatedHotel) => {
                  setLocalHotels(prev => prev.map(h => h.id === updatedHotel.id ? updatedHotel : h));
                  try {
                    await saveHotelToDb(updatedHotel);
                  } catch (err) {
                    console.error('Failed to save hotel in DB:', err);
                  }
                }}
                activeSubTab={
                  activeTab === 'calendar-grid' ? 'calendar-grid' :
                  activeTab === 'rooms-list' ? 'rooms' :
                  activeTab === 'meals-list' ? 'meals' :
                  activeTab === 'packages-list' ? 'packages' :
                  activeTab === 'periods-pricing' ? 'periods-pricing' :
                  activeTab === 'booking-rules' ? 'booking-rules' :
                  'rooms'
                }
              />
            )}

            {/* 1. HOTELS MANAGEMENT TAB */}
            {activeTab === 'hotels' && (
              <AdminHotelsManager
                hotels={sortedHotels}
                currentUser={currentUser}
                adminRoles={adminRoles}
                onOpenAddHotel={handleOpenAddHotel}
                onEditHotel={handleEditHotel}
                onDeleteHotel={confirmDeleteHotel}
                onOpenAlbum={(hotel) => setAlbumModalHotel(hotel)}
                onToggleActive={handleToggleHotelActive}
                onToggleOnlineBooking={handleToggleHotelOnlineBooking}
                onToggleFeatured={handleToggleHotelFeatured}
                onToggleDistanceBadge={handleToggleHotelDistanceBadge}
                onToggleStarsBadge={handleToggleHotelStarsBadge}
                onToggleCategoriesBadge={handleToggleHotelCategoriesBadge}
                onBulkToggleDistanceBadge={handleBulkToggleDistanceBadge}
                onMoveOrder={handleMoveHotelOrder}
                onShowToast={onShowToast}
              />
            )}

            {/* 2. DISTRICTS MANAGEMENT TAB */}
            {activeTab === 'districts' && (
              <div id="admin-districts-section">
                <AdminDistrictsManager
                  districts={districts}
                  hotels={hotels}
                  onRefreshDistricts={loadDistricts}
                  onRefreshHotels={onRefreshData}
                  onShowToast={onShowToast}
                />
              </div>
            )}

            {/* 3. USERS & ROLES MANAGEMENT TAB */}
            {activeTab === 'users' && (
              <div id="admin-users-section">
                <AdminUsersManager
                  users={adminUsers}
                  roles={adminRoles}
                  currentUserId={currentUser?.id}
                  currentUser={currentUser}
                  currentUserRole={currentUser?.role || 'admin'}
                  onRefreshUsers={loadUsers}
                  onRefreshRoles={loadRoles}
                  onShowToast={onShowToast}
                  onRecordAudit={handleRecordAudit}
                />
              </div>
            )}

            {/* INTRO VIDEO MANAGEMENT TAB */}
            {activeTab === 'intro-video' && (
              <div id="admin-intro-video-section" className="space-y-8 animate-fadeIn">
                {/* Intro Video Header Card */}
                <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                          <Film className="w-4 h-4" />
                        </div>
                        <h2 className="text-xl font-cairo font-bold text-stone-900">
                          فيديو الإنترو الترحيبي (Intro Video)
                        </h2>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        يظهر كأول عنصر في أعلى الصفحة الرئيسية لجذب الزوار، يليه مباشرة الشرائح الترحيبية ثم باقي أقسام الموقع.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Auto-Save Indicator */}
                      {autoSaveStatus === 'saving' && (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span>جاري الحفظ التلقائي...</span>
                        </span>
                      )}
                      {autoSaveStatus === 'saved' && (
                        <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>تم الحفظ تلقائياً ✓</span>
                        </span>
                      )}

                      {/* Main Enable / Disable Switch */}
                      <button
                        type="button"
                        onClick={() => {
                          const current = settingsForm.introVideo || { enabled: false, videoUrl: '' };
                          const updated = {
                            ...settingsForm,
                            introVideo: {
                              ...current,
                              enabled: !current.enabled
                            }
                          };
                          triggerAutoSaveSettings(updated);
                          onShowToast(
                            !current.enabled
                              ? 'تم تفعيل فيديو الإنترو وسيظهر في أعلى الموقع للزوار 🎬'
                              : 'تم إخفاء فيديو الإنترو من الموقع',
                            'info'
                          );
                        }}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                          settingsForm.introVideo?.enabled
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-300'
                        }`}
                      >
                        {settingsForm.introVideo?.enabled ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>مفعّل في الرئيسية (ظاهر)</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span>معطّل (مخفي حالياً)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column 1: Video Source & Media */}
                    <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-800 flex items-center gap-2">
                          <Film className="w-4 h-4 text-[#C9A24B]" />
                          <span>مصدر مقطع الفيديو (URL أو رفع ملف): *</span>
                        </label>

                        {/* Direct Video Upload Button to Supabase Storage */}
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-[#C9A24B] text-white text-xs font-bold transition-colors">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{isUploadingIntroVideo ? 'جاري الرفع...' : 'رفع فيديو من جهازك'}</span>
                          <input
                            type="file"
                            accept="video/mp4, video/webm, video/quicktime, .mp4, .webm, .mov"
                            onChange={handleIntroVideoFileUpload}
                            disabled={isUploadingIntroVideo}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {isUploadingIntroVideo && (
                        <div className="space-y-1.5">
                          <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-[#C9A24B] h-full transition-all duration-300"
                              style={{ width: `${introVideoUploadProgress}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-stone-500 font-mono text-center block">
                            جاري رفع الفيديو إلى السحابة... يرجى الانتظار
                          </span>
                        </div>
                      )}

                      <input
                        type="url"
                        value={settingsForm.introVideo?.videoUrl || ''}
                        onChange={(e) => {
                          const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                          const updated = {
                            ...settingsForm,
                            introVideo: { ...current, videoUrl: e.target.value }
                          };
                          triggerAutoSaveSettings(updated);
                        }}
                        placeholder="https://.../video.mp4 أو رابط فيديو مباشر"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs font-mono focus:border-[#C9A24B] focus:outline-none dir-ltr text-left"
                      />

                      {/* Poster Image */}
                      <div className="pt-2 border-t border-stone-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-stone-700">
                            صورة غلاف الفيديو (Poster - اختياري):
                          </label>
                          <label className="cursor-pointer text-[11px] font-bold text-[#B38A34] hover:underline flex items-center gap-1">
                            <UploadCloud className="w-3 h-3" />
                            <span>رفع بوستر</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleIntroPosterFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="url"
                          value={settingsForm.introVideo?.posterUrl || ''}
                          onChange={(e) => {
                            const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                            const updated = {
                              ...settingsForm,
                              introVideo: { ...current, posterUrl: e.target.value }
                            };
                            triggerAutoSaveSettings(updated);
                          }}
                          placeholder="رابط صورة الغلاف أو ارفع من جهازك"
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs font-mono focus:border-[#C9A24B] focus:outline-none dir-ltr text-left"
                        />
                      </div>
                    </div>

                    {/* Column 2: Titles & Texts Overlay */}
                    <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                      {/* Overlay Filter Style (إزالة الطابعة الداكنة) */}
                      <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#B38A34]" />
                            <span>نمط تدرج الغطاء وصفاء الفيديو (Overlay Style):</span>
                          </label>
                          <span className="text-[10px] font-bold text-[#B38A34] bg-white px-2 py-0.5 rounded-full border border-amber-200">
                            معالجة الطابعة الداكنة
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'clear' as const, title: 'فائق الإشراق والنقاء ✨', desc: 'بدون طبقة عاتمة مع بريق ذهبي ناعم' },
                            { id: 'subtle' as const, title: 'هادئ ومشرق', desc: 'تدرج ضوئي خفيف يحافظ على ألوان الفيديو' },
                            { id: 'cinematic' as const, title: 'سينمائي متوازن', desc: 'تدرج كلاسيكي متوسط لتباين النص' },
                            { id: 'none' as const, title: 'بدون أي تدرج (نقي 100%)', desc: 'فيديو خام بدون أي طبقات تغطية' }
                          ].map((ov) => {
                            const isCurrent = (settingsForm.introVideo?.overlayStyle || 'clear') === ov.id;
                            return (
                              <button
                                key={ov.id}
                                type="button"
                                onClick={() => {
                                  const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                                  const updated = {
                                    ...settingsForm,
                                    introVideo: { ...current, overlayStyle: ov.id }
                                  };
                                  triggerAutoSaveSettings(updated);
                                }}
                                className={`p-2.5 rounded-xl text-right transition-all text-xs border cursor-pointer ${
                                  isCurrent
                                    ? 'bg-[#C9A24B] text-white border-[#C9A24B] shadow-2xs font-bold'
                                    : 'bg-white hover:bg-amber-100/50 text-stone-700 border-stone-200'
                                }`}
                              >
                                <span className="block font-bold mb-0.5">{ov.title}</span>
                                <span className={`text-[10px] block leading-tight ${isCurrent ? 'text-amber-100' : 'text-stone-500'}`}>
                                  {ov.desc}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Title input with toggle */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-stone-800">
                            العنوان الترحيبي العريض (Title):
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                              const updated = {
                                ...settingsForm,
                                introVideo: { ...current, showTitle: current.showTitle === false ? true : false }
                              };
                              triggerAutoSaveSettings(updated);
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              settingsForm.introVideo?.showTitle !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {settingsForm.introVideo?.showTitle !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{settingsForm.introVideo?.showTitle !== false ? 'ظاهر' : 'مخفي'}</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={settingsForm.introVideo?.title || ''}
                          onChange={(e) => {
                            const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                            const updated = {
                              ...settingsForm,
                              introVideo: { ...current, title: e.target.value }
                            };
                            triggerAutoSaveSettings(updated);
                          }}
                          placeholder="مثال: مرحباً بكم في شركة برستيج لإدارة وتشغيل الفنادق"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs font-semibold focus:border-[#C9A24B] focus:outline-none"
                        />
                      </div>

                      {/* Subtitle input with toggle */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-stone-800">
                            الوصف الترحيبي (Subtitle):
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                              const updated = {
                                ...settingsForm,
                                introVideo: { ...current, showSubtitle: current.showSubtitle === false ? true : false }
                              };
                              triggerAutoSaveSettings(updated);
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              settingsForm.introVideo?.showSubtitle !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {settingsForm.introVideo?.showSubtitle !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{settingsForm.introVideo?.showSubtitle !== false ? 'ظاهر' : 'مخفي'}</span>
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={settingsForm.introVideo?.subtitle || ''}
                          onChange={(e) => {
                            const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                            const updated = {
                              ...settingsForm,
                              introVideo: { ...current, subtitle: e.target.value }
                            };
                            triggerAutoSaveSettings(updated);
                          }}
                          placeholder="مثال: نأخذكم في جولة حصرية للتعرف على معايير الضيافة الفاخرة وخدمات تسكين الحجاج والمعتمرين."
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:border-[#C9A24B] focus:outline-none"
                        />
                      </div>

                      {/* Badge input with toggle */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-stone-800">
                            شارة الفيديو العلوية (Badge):
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                              const updated = {
                                ...settingsForm,
                                introVideo: { ...current, showBadge: current.showBadge === false ? true : false }
                              };
                              triggerAutoSaveSettings(updated);
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              settingsForm.introVideo?.showBadge !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {settingsForm.introVideo?.showBadge !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{settingsForm.introVideo?.showBadge !== false ? 'ظاهر' : 'مخفي'}</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={settingsForm.introVideo?.badgeText || ''}
                          onChange={(e) => {
                            const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                            const updated = {
                              ...settingsForm,
                              introVideo: { ...current, badgeText: e.target.value }
                            };
                            triggerAutoSaveSettings(updated);
                          }}
                          placeholder="مثال: جولة تعريفية حصرية"
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:border-[#C9A24B] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Playback Toggles & Action Button */}
                  <div className="p-5 rounded-2xl bg-stone-900 text-white space-y-4">
                    <h4 className="font-cairo font-bold text-sm text-stone-100 border-b border-stone-800 pb-2">
                      خيارات التشغيل والتحكم التفاعلي والأزرار
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                      {/* Autoplay Toggle */}
                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-800/80 border border-stone-700 cursor-pointer hover:bg-stone-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={settingsForm.introVideo?.autoPlay !== false}
                          onChange={(e) => {
                            const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                            const updated = {
                              ...settingsForm,
                              introVideo: { ...current, autoPlay: e.target.checked }
                            };
                            triggerAutoSaveSettings(updated);
                          }}
                          className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                        />
                        <div>
                          <strong className="text-xs block text-stone-100">تشغيل تلقائي</strong>
                          <span className="text-[10px] text-stone-400">يبدأ الفيديو فوراً</span>
                        </div>
                      </label>

                      {/* Muted Toggle */}
                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-800/80 border border-stone-700 cursor-pointer hover:bg-stone-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={settingsForm.introVideo?.muted !== false}
                          onChange={(e) => {
                            const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                            const updated = {
                              ...settingsForm,
                              introVideo: { ...current, muted: e.target.checked }
                            };
                            triggerAutoSaveSettings(updated);
                          }}
                          className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                        />
                        <div>
                          <strong className="text-xs block text-stone-100">صامت افتراضياً</strong>
                          <span className="text-[10px] text-stone-400">كتم الصوت بالبداية</span>
                        </div>
                      </label>

                      {/* Sound Button Toggle */}
                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-800/80 border border-stone-700 cursor-pointer hover:bg-stone-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={settingsForm.introVideo?.showSoundButton !== false}
                          onChange={(e) => {
                            const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                            const updated = {
                              ...settingsForm,
                              introVideo: { ...current, showSoundButton: e.target.checked }
                            };
                            triggerAutoSaveSettings(updated);
                          }}
                          className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                        />
                        <div>
                          <strong className="text-xs block text-stone-100">زر الصوت</strong>
                          <span className="text-[10px] text-stone-400">زر للتحكم بالصوت</span>
                        </div>
                      </label>

                      {/* Loop Toggle */}
                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-800/80 border border-stone-700 cursor-pointer hover:bg-stone-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={settingsForm.introVideo?.loop !== false}
                          onChange={(e) => {
                            const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                            const updated = {
                              ...settingsForm,
                              introVideo: { ...current, loop: e.target.checked }
                            };
                            triggerAutoSaveSettings(updated);
                          }}
                          className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                        />
                        <div>
                          <strong className="text-xs block text-stone-100">تكرار الفيديو</strong>
                          <span className="text-[10px] text-stone-400">إعادة التشغيل</span>
                        </div>
                      </label>

                      {/* Skip Button Toggle */}
                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-800/80 border border-stone-700 cursor-pointer hover:bg-stone-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={settingsForm.introVideo?.showSkipButton !== false}
                          onChange={(e) => {
                            const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                            const updated = {
                              ...settingsForm,
                              introVideo: { ...current, showSkipButton: e.target.checked }
                            };
                            triggerAutoSaveSettings(updated);
                          }}
                          className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                        />
                        <div>
                          <strong className="text-xs block text-stone-100">زر التخطي</strong>
                          <span className="text-[10px] text-stone-400">للانتقال للأسفل</span>
                        </div>
                      </label>
                    </div>

                    {/* Action Button & Skip Button Customization Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-800">
                      {/* Action Button settings */}
                      <div className="space-y-2 bg-stone-800/50 p-3 rounded-xl border border-stone-700">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-stone-200 font-bold flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={settingsForm.introVideo?.showActionButton !== false}
                              onChange={(e) => {
                                const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                                const updated = {
                                  ...settingsForm,
                                  introVideo: { ...current, showActionButton: e.target.checked }
                                };
                                triggerAutoSaveSettings(updated);
                              }}
                              className="w-3.5 h-3.5 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                            />
                            <span>زر الإجراء التفاعلي (Action Button)</span>
                          </label>
                          <span className="text-[10px] text-[#DFBE72]">رابط مباشر في الفيديو</span>
                        </div>
                        {settingsForm.introVideo?.showActionButton !== false && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <input
                              type="text"
                              value={settingsForm.introVideo?.actionButtonText || ''}
                              onChange={(e) => {
                                const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                                const updated = {
                                  ...settingsForm,
                                  introVideo: { ...current, actionButtonText: e.target.value }
                                };
                                triggerAutoSaveSettings(updated);
                              }}
                              placeholder="استكشف فنادقنا"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:border-[#C9A24B] focus:outline-none"
                            />
                            <select
                              value={settingsForm.introVideo?.actionButtonPage || 'hotels'}
                              onChange={(e) => {
                                const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                                const updated = {
                                  ...settingsForm,
                                  introVideo: { ...current, actionButtonPage: e.target.value as any }
                                };
                                triggerAutoSaveSettings(updated);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:border-[#C9A24B] focus:outline-none"
                            >
                              <option value="hotels">صفحة الفنادق</option>
                              <option value="offers">صفحة العروض</option>
                              <option value="about">صفحة من نحن</option>
                              <option value="contact">صفحة التواصل</option>
                              <option value="whatsapp">محادثة واتساب</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Skip Button Text Customization */}
                      {settingsForm.introVideo?.showSkipButton !== false && (
                        <div className="space-y-2 bg-stone-800/50 p-3 rounded-xl border border-stone-700">
                          <label className="text-xs text-stone-200 font-bold block">
                            نص زر التخطي للأسفل:
                          </label>
                          <input
                            type="text"
                            value={settingsForm.introVideo?.skipButtonText || ''}
                            onChange={(e) => {
                              const current = settingsForm.introVideo || { enabled: true, videoUrl: '' };
                              const updated = {
                                ...settingsForm,
                                introVideo: { ...current, skipButtonText: e.target.value }
                              };
                              triggerAutoSaveSettings(updated);
                            }}
                            placeholder="تخطي إلى محتوى الموقع ⬇"
                            className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:border-[#C9A24B] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Intro Frequency Setting Card */}
                  <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#C9A24B]" />
                        <span>تكرار ظهور الإنترو للزوار (Intro Frequency):</span>
                      </label>
                      <span className="text-[10px] text-stone-500 font-bold bg-white px-2 py-0.5 rounded-full border border-stone-200">
                        يختفي تلقائياً بعد انتهائه أو تخطيه
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'session' as const, title: 'مرة لكل جلسة متصفح 🌐', desc: 'مرة واحدة عند أول دخول ويختفي بعدها طوال الجلسة (الافتراضي)' },
                        { id: 'daily' as const, title: 'مرة كل 24 ساعة ⏱️', desc: 'مرة واحدة في اليوم فقط للزائر' },
                        { id: 'always' as const, title: 'مع كل زيارة 🎬', desc: 'يعرض مع كل فتح جديد للصفحة الرئيسية' }
                      ].map(item => {
                        const currentFreq = settingsForm.displaySettings?.introFrequency || settingsForm.introVideo?.frequency || 'session';
                        const isSelected = currentFreq === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              const updated: SiteSettings = {
                                ...settingsForm,
                                introVideo: {
                                  ...(settingsForm.introVideo || { videoUrl: '', enabled: true }),
                                  frequency: item.id
                                },
                                displaySettings: {
                                  ...settingsForm.displaySettings,
                                  introFrequency: item.id
                                }
                              };
                              triggerAutoSaveSettings(updated);
                              onShowToast(`تم ضبط تكرار الإنترو: ${item.title}`, 'success');
                            }}
                            className={`p-3 rounded-xl text-right transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-[#C9A24B] text-white border-[#C9A24B] shadow-xs font-bold'
                                : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            <strong className="text-xs block mb-0.5">{item.title}</strong>
                            <span className={`text-[10px] block leading-tight ${isSelected ? 'text-amber-100' : 'text-stone-500'}`}>{item.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Interactive Video Preview */}
                  <div className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-950">
                    <div className="p-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between text-xs text-stone-300">
                      <span className="font-bold flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
                        <span>معاينة حية لفيديو الإنترو (بدون طابعة داكنة)</span>
                      </span>
                      {settingsForm.introVideo?.videoUrl ? (
                        <span className="text-emerald-400 text-[11px] font-mono">● جاهز للعرض</span>
                      ) : (
                        <span className="text-amber-400 text-[11px]">يرجى إدخال رابط فيديو أو رفعه للمعاينة</span>
                      )}
                    </div>

                    <div className="relative aspect-video max-h-[380px] w-full flex items-center justify-center bg-black overflow-hidden">
                      {settingsForm.introVideo?.videoUrl ? (
                        <SafeVideoPlayer
                          src={settingsForm.introVideo.videoUrl}
                          poster={settingsForm.introVideo.posterUrl}
                          autoPlay={false}
                          muted={true}
                          loop={settingsForm.introVideo.loop !== false}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-8 text-stone-500">
                          <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-xs">لم يتم تحديد رابط فيديو إنترو حتى الآن</p>
                        </div>
                      )}

                      {/* Simulation Overlays */}
                      {settingsForm.introVideo?.videoUrl && (
                        <div className={`absolute inset-0 pointer-events-none p-6 flex flex-col justify-between ${
                          (settingsForm.introVideo?.overlayStyle === 'clear' || !settingsForm.introVideo?.overlayStyle)
                            ? 'bg-gradient-to-t from-black/45 via-transparent to-black/20'
                            : settingsForm.introVideo?.overlayStyle === 'subtle'
                            ? 'bg-gradient-to-t from-black/55 via-black/15 to-black/25'
                            : settingsForm.introVideo?.overlayStyle === 'none'
                            ? 'bg-transparent'
                            : 'bg-gradient-to-t from-black/75 via-black/30 to-black/40'
                        }`}>
                          <div>
                            {settingsForm.introVideo?.badgeText && settingsForm.introVideo?.showBadge !== false && (
                              <span className="inline-block bg-[#C9A24B] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                                {settingsForm.introVideo.badgeText}
                              </span>
                            )}
                          </div>
                          <div>
                            {settingsForm.introVideo?.showTitle !== false && (
                              <h3 className="text-lg sm:text-2xl font-cairo font-bold text-white mb-1 drop-shadow-md">
                                {settingsForm.introVideo?.title || 'عنوان فيديو الإنترو الترحيبي'}
                              </h3>
                            )}
                            {settingsForm.introVideo?.showSubtitle !== false && (
                              <p className="text-xs text-stone-200 max-w-xl drop-shadow-sm line-clamp-2">
                                {settingsForm.introVideo?.subtitle || 'الوصف الترحيبي لشركة برستيج للفنادق'}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. HERO SLIDES MANAGEMENT TAB */}
            {activeTab === 'slides' && (
              <div id="admin-slides-section">
                <AdminHeroSlidesManager
                  hotels={hotels}
                  siteSettings={siteSettings}
                  onUpdateSiteSettings={onUpdateSiteSettings}
                  onShowToast={onShowToast}
                />
              </div>
            )}

            {/* 3. ADS & OFFERS MANAGEMENT TAB */}
            {activeTab === 'offers' && (
              <div id="admin-offers-section" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
                  <div>
                    <h2 className="text-xl font-cairo font-bold text-stone-900">إدارة الإعلانات الترويجية والعروض</h2>
                    <p className="text-xs text-stone-500 mt-1">
                      تحكم كامل في إعلانات الموقع: إدراج في شرائح الترحيب (الهيرو)، والتحكم في العد التنازلي والخصومات بضغطة زر مع حفظ فوري.
                    </p>
                  </div>

                  <button
                    id="admin-add-offer-btn"
                    onClick={handleOpenAddOffer}
                    className="px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ إضافة إعلان جديد</span>
                  </button>
                </div>

                {/* Ads Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm min-w-[850px]">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 text-xs font-semibold">
                        <th className="pb-3 pr-2">الإعلان والمحتوى</th>
                        <th className="pb-3">النوع</th>
                        <th className="pb-3 text-center">الخصم</th>
                        <th className="pb-3 text-center">العد التنازلي</th>
                        <th className="pb-3 text-center">في شرائح الهيرو</th>
                        <th className="pb-3 text-center">الحالة في الموقع</th>
                        <th className="pb-3 pl-2 text-left">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {localOffers.map((offer) => {
                        const galleryCount = offer.gallery?.length || 0;
                        return (
                          <tr key={offer.id} className="hover:bg-stone-50 transition-colors">
                            <td className="py-3.5 pr-2">
                              <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  <img
                                    src={offer.mediaUrl}
                                    alt=""
                                    className="w-14 h-10 rounded-lg object-cover bg-stone-100 border border-stone-200 shadow-2xs"
                                  />
                                  {galleryCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-[#C9A24B] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                                      +{galleryCount}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <strong className="text-stone-900 font-bold block truncate max-w-[200px]">
                                      {offer.title}
                                    </strong>
                                    {offer.badgeText && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                        {offer.badgeText}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-stone-500 line-clamp-1 max-w-[240px]">
                                    {offer.shortDescription || 'لا يوجد وصف مختصر'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 text-stone-700">
                              <span className="inline-flex items-center gap-1">
                                {offer.mediaType === 'video' ? (
                                  <>
                                    <Film className="w-3.5 h-3.5 text-amber-600" />
                                    <span>فيديو</span>
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                                    <span>صورة</span>
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Discount quick toggle */}
                            <td className="py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleOfferDiscount(offer)}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                  offer.showDiscount !== false && offer.discountPercentage
                                    ? 'bg-amber-50 text-[#B38A34] border border-amber-200 hover:bg-amber-100'
                                    : 'bg-stone-100 text-stone-400 border border-stone-200 hover:bg-stone-200'
                                }`}
                                title="اضغط لتبديل إظهار شارة الخصم"
                              >
                                {offer.showDiscount !== false && offer.discountPercentage
                                  ? `${offer.discountPercentage}٪ (معروض)`
                                  : 'مخفي'}
                              </button>
                            </td>

                            {/* Countdown quick toggle */}
                            <td className="py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleOfferCountdown(offer)}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                                  offer.showCountdown !== false
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                                    : 'bg-stone-100 text-stone-400 border border-stone-200 hover:bg-stone-200'
                                }`}
                                title="اضغط لتفعيل أو إخفاء مؤقت الوقت التنازلي"
                              >
                                <Clock className="w-3 h-3" />
                                <span>{offer.showCountdown !== false ? 'مفعّل' : 'مخفي'}</span>
                              </button>
                            </td>

                            {/* Hero Slides inclusion quick toggle */}
                            <td className="py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleOfferHeroSlides(offer)}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                                  offer.showInHeroSlides
                                    ? 'bg-[#C9A24B]/15 text-[#B38A34] border border-[#C9A24B]/30 hover:bg-[#C9A24B]/25'
                                    : 'bg-stone-100 text-stone-400 border border-stone-200 hover:bg-stone-200'
                                }`}
                                title="اضغط لإدراج الإعلان في شرائح الترحيب بأعلى الصفحة الرئيسية"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>{offer.showInHeroSlides ? 'ظاهر بالهيرو ✓' : 'غير مدرج'}</span>
                              </button>
                            </td>

                            {/* Status in site toggle */}
                            <td className="py-3.5 text-center">
                              <button
                                onClick={() => handleToggleOfferActive(offer)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 mx-auto ${
                                  offer.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                                }`}
                              >
                                {offer.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                <span>{offer.isActive ? 'نشط ومعروض' : 'مخفي'}</span>
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 pl-2 text-left">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditOffer(offer)}
                                  className="p-2 rounded-lg bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 transition-colors"
                                  title="تعديل الإعلان"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => confirmDeleteOffer(offer)}
                                  className="p-2 rounded-lg bg-stone-100 hover:bg-red-500 hover:text-white text-stone-700 transition-colors"
                                  title="حذف الإعلان"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. HOME SECTIONS CONTROLLER TAB */}
            {activeTab === 'home-sections' && (
              <div id="admin-home-sections-container">
                <AdminHomeSectionsManager
                  homeSections={settingsForm.homeSections || siteSettings?.homeSections}
                  onUpdateHomeSections={handleHomeSectionsChange}
                  onShowToast={onShowToast}
                />
              </div>
            )}

            {/* CONTACTS DIRECTORY MANAGEMENT TAB */}
            {activeTab === 'contacts' && (
              <div id="admin-contacts-directory-container">
                <AdminContactsDirectoryManager
                  contacts={settingsForm.contactsDirectory || siteSettings?.contactsDirectory || []}
                  onChange={handleContactsDirectoryChange}
                  onShowToast={onShowToast}
                  actionButtons={settingsForm.actionButtons || siteSettings?.actionButtons || []}
                  onUpdateActionButtons={handleActionButtonsChange}
                  branches={settingsForm.branches || siteSettings?.branches || []}
                  onUpdateBranches={handleBranchesChange}
                />
              </div>
            )}

            {/* ACTION BUTTONS MANAGER TAB */}
            {activeTab === 'buttons' && (
              <div id="admin-action-buttons-container">
                <AdminActionButtonsManager
                  buttons={settingsForm.actionButtons || siteSettings?.actionButtons || []}
                  onChange={handleActionButtonsChange}
                  onShowToast={onShowToast}
                  hotels={hotels}
                  contactsDirectory={settingsForm.contactsDirectory || siteSettings?.contactsDirectory || []}
                  onNavigateToContacts={() => handleSelectTab('contacts')}
                />
              </div>
            )}

            {/* 5. STORY & NARRATIVE TEASER TAB */}
            {activeTab === 'story-teaser' && (
              <div id="admin-story-teaser-container">
                <AdminStoryTeaserManager
                  storyTeaser={settingsForm.storyTeaser || siteSettings?.storyTeaser}
                  onUpdateStoryTeaser={handleStoryTeaserChange}
                  onShowToast={onShowToast}
                />
              </div>
            )}

            {/* 6. INTEGRATED SERVICES TAB */}
            {activeTab === 'services' && (
              <div id="admin-services-container">
                <AdminServicesManager
                  integratedServices={settingsForm.integratedServices || siteSettings?.integratedServices}
                  onUpdateIntegratedServices={handleServicesChange}
                  onShowToast={onShowToast}
                />
              </div>
            )}

            {/* 4. ABOUT US, STORY TEASER, SERVICES & OFFICE MANAGEMENT TAB */}
            {activeTab === 'about' && (
              <div id="admin-about-section">
                <AdminAboutManager
                  aboutUs={settingsForm.aboutUs || siteSettings?.aboutUs || {}}
                  siteLogoUrl={settingsForm.logoUrl || siteSettings?.logoUrl || ''}
                  storyTeaser={settingsForm.storyTeaser || siteSettings?.storyTeaser}
                  integratedServices={settingsForm.integratedServices || siteSettings?.integratedServices}
                  onUpdateStoryTeaser={handleStoryTeaserChange}
                  onUpdateIntegratedServices={handleServicesChange}
                  onUpdateAboutUs={async (updatedAboutUs, updatedLogo) => {
                    const updatedSettings: SiteSettings = {
                      ...settingsForm,
                      aboutUs: updatedAboutUs,
                      logoUrl: updatedLogo !== undefined ? updatedLogo : settingsForm.logoUrl
                    };
                    setSettingsForm(updatedSettings);
                    await onUpdateSiteSettings(updatedSettings);
                  }}
                  onShowToast={onShowToast}
                />
              </div>
            )}

            {/* 5. REVIEWS MODERATION TAB */}
            {activeTab === 'reviews' && (
              <div id="admin-reviews-section" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
                  <div>
                    <h2 className="text-xl font-cairo font-bold text-stone-900">إدارة واعتماد تقييمات النزلاء</h2>
                    <p className="text-xs text-stone-500 mt-1">
                      التقييمات المعتمدة تظهر فوراً في تفاصيل الفندق وصفحة التقييمات العامة.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReviewFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        reviewFilter === 'all' ? 'bg-[#C9A24B] text-white' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      الكل ({reviews.length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        reviewFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      بانتظار الاعتماد ({pendingReviewsCount})
                    </button>
                    <button
                      onClick={() => setReviewFilter('approved')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        reviewFilter === 'approved' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      معتمد ({reviews.filter(r => r.status === 'approved').length})
                    </button>
                  </div>
                </div>

                {/* Reviews List */}
                {loadingReviews ? (
                  <div className="py-12 text-center text-xs text-stone-500">جاري تحميل التقييمات...</div>
                ) : (
                  <div className="space-y-4">
                    {reviews
                      .filter(r => reviewFilter === 'all' || r.status === reviewFilter)
                      .map((rev, revIdx) => (
                        <div
                          key={rev.id || `admin-review-${revIdx}`}
                          className="p-5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-[#C9A24B]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5 flex-1">
                            {rev.avatarUrl ? (
                              <img
                                src={rev.avatarUrl}
                                alt={rev.authorName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-[#C9A24B]/40 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : null}

                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-cairo font-bold text-sm text-stone-900">{rev.authorName}</span>
                                {rev.countryOrTitle && (
                                  <span className="text-xs text-stone-500 font-medium">({rev.countryOrTitle})</span>
                                )}
                                <span className="text-xs text-stone-500">• فندق: <strong className="text-stone-800">{rev.hotelName}</strong></span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  rev.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {rev.status === 'approved' ? 'معتمد ومنشور' : 'بانتظار المراجعة'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                {[...Array(rev.rating)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-[#C9A24B] text-[#C9A24B]" />
                                ))}
                                <span className="text-xs text-stone-400 mr-2">
                                  {new Date(rev.createdAt).toLocaleDateString('ar-SA')}
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                                "{rev.comment}"
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {rev.status !== 'approved' && (
                              <button
                                onClick={() => handleApproveReview(rev)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>اعتماد ونشر</span>
                              </button>
                            )}

                            <button
                              onClick={() => confirmDeleteReview(rev)}
                              className="p-2 rounded-xl bg-stone-100 hover:bg-red-500 hover:text-white text-stone-600 transition-colors cursor-pointer"
                              title="حذف التقييم"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                    {reviews.length === 0 && (
                      <div className="py-12 text-center text-xs text-stone-500">
                        لا توجد تقييمات مسجلة حالياً
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4. MESSAGES MANAGEMENT TAB */}
            {activeTab === 'messages' && (
              <div id="admin-messages-section" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-cairo font-bold text-stone-900">رسائل واستفسارات الزوار</h2>
                      {unreadMessagesCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                          {unreadMessagesCount} رسائل جديدة
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      الاستفسارات الواردة مباشرة من نموذج صفحة التواصل ونوافذ الحجز.
                    </p>
                  </div>

                  {/* Filter Pills & Refresh Button */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setMessageFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        messageFilter === 'all'
                          ? 'bg-[#C9A24B] text-white shadow-2xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      الكل ({messages.length})
                    </button>

                    <button
                      onClick={() => setMessageFilter('unread')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        messageFilter === 'unread'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      غير مقروء ({unreadMessagesCount})
                    </button>

                    <button
                      onClick={() => setMessageFilter('read')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        messageFilter === 'read'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      تمت مراجعته ({messages.length - unreadMessagesCount})
                    </button>

                    <button
                      type="button"
                      onClick={loadMessages}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                      title="تحديث وجلب أحدث الرسائل من فايرستور"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {loadingMessages ? (
                    <div className="text-center py-16 text-stone-500 text-xs">
                      جاري جلب الرسائل الواردة من قاعدة بيانات فايرستور...
                    </div>
                  ) : messages.filter(m => messageFilter === 'all' || (messageFilter === 'unread' ? !m.read : m.read)).length > 0 ? (
                    messages
                      .filter(m => messageFilter === 'all' || (messageFilter === 'unread' ? !m.read : m.read))
                      .map((msg) => {
                        const cleanPhone = msg.phone.replace(/[^0-9]/g, '');
                        const waReplyText = `السلام عليكم ورحمة الله أستاذ ${msg.name}،\nمعكم مستشار التسكين من شركة برستيج لإدارة وتشغيل الفنادق.\nبخصوص استفساركم: "${msg.subject || 'حجز وتسكين الفنادق'}"...`;
                        const waHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waReplyText)}`;

                        return (
                          <div
                            key={msg.id}
                            className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-3.5 ${
                              !msg.read
                                ? 'bg-amber-50/40 border-amber-300/80 shadow-xs'
                                : 'bg-stone-50 border-stone-200'
                            }`}
                          >
                            {/* Top Info Bar */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                  !msg.read
                                    ? 'bg-[#C9A24B] text-white shadow-xs'
                                    : 'bg-stone-200 text-stone-700'
                                }`}>
                                  {msg.name ? msg.name.charAt(0) : 'ز'}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <strong className="font-cairo font-bold text-sm sm:text-base text-stone-900">
                                      {msg.name}
                                    </strong>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      !msg.read
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}>
                                      {!msg.read ? 'رسالة جديدة' : 'تمت المراجعة'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5 flex-wrap">
                                    <span className="font-mono dir-ltr">{msg.phone}</span>
                                    {msg.email && <span className="font-mono">({msg.email})</span>}
                                  </div>
                                </div>
                              </div>

                              <span className="text-xs text-stone-400 font-medium">
                                {new Date(msg.createdAt).toLocaleString('ar-SA', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </span>
                            </div>

                            {/* Tags: City, Guest count, Hotel */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {msg.preferredCity && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-[#B38A34] border border-stone-200">
                                  <MapPin className="w-3 h-3" />
                                  <span>{msg.preferredCity}</span>
                                </span>
                              )}

                              {msg.guestCount && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
                                  <Users className="w-3 h-3 text-stone-500" />
                                  <span>{msg.guestCount} ضيوف</span>
                                </span>
                              )}

                              {msg.hotelName && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
                                  <Building2 className="w-3 h-3 text-[#B38A34]" />
                                  <span>فندق: {msg.hotelName}</span>
                                </span>
                              )}
                            </div>

                            {/* Subject */}
                            {msg.subject && (
                              <div className="text-xs sm:text-sm font-bold text-[#B38A34]">
                                {msg.subject}
                              </div>
                            )}

                            {/* Message Content */}
                            <div className="text-xs sm:text-sm text-stone-800 leading-relaxed bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                              {msg.message || 'لا توجد ملاحظات إضافية مرفقة.'}
                            </div>

                            {/* Actions Bar */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                              <div className="flex items-center gap-2">
                                <a
                                  href={waHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                >
                                  <WhatsAppIcon className="w-4 h-4 text-white" />
                                  <span>الرد الفوري عبر واتساب</span>
                                </a>

                                <a
                                  href={`tel:${msg.phone}`}
                                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Phone className="w-3.5 h-3.5 text-[#B38A34]" />
                                  <span>اتصال هاتفي</span>
                                </a>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleMessageRead(msg)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                    msg.read
                                      ? 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-bold'
                                  }`}
                                >
                                  {msg.read ? 'تعليم كغير مقروء' : 'تعليم كمقروء ✓'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => confirmDeleteMessage(msg)}
                                  className="p-2 rounded-xl bg-stone-100 hover:bg-red-500 hover:text-white text-stone-600 transition-colors cursor-pointer"
                                  title="حذف الرسالة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-16 rounded-2xl bg-stone-50 border border-stone-200 text-stone-500 text-xs">
                      لا توجد رسائل مطابقة للتصفية الحالية
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. SITE SETTINGS & CHANNELS */}
            {activeTab === 'settings' && (
              <div id="admin-settings-section" className="space-y-6">
                {/* Header Bar with Auto-Save Status & Save Button */}
                <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                        <Settings className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-cairo font-bold text-stone-900">إعدادات المنصة الشاملة</h2>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      إدارة الهوية، الشعار، عناصر التواصل، الفروع، الربط السحابي، والتحكم في ظهور كافة الأقسام.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {autoSaveStatus === 'saving' && (
                      <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        <span>جاري الحفظ التلقائي...</span>
                      </span>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>تم الحفظ تلقائياً ✓</span>
                      </span>
                    )}

                    <button
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="px-6 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs Categorization Navigation */}
                <div className="bg-white rounded-3xl border border-stone-200 p-2 sm:p-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 px-1">
                    <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5 font-cairo">
                      <Sliders className="w-3.5 h-3.5 text-[#B38A34]" />
                      <span>أقسام وتبويبات إعدادات المنصة:</span>
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">
                      ٧ أقسام تحكم متكاملة
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {[
                      { id: 'brand' as const, num: '١', label: 'الهوية والشعار', icon: Building2, desc: 'الاسم الرسمي والشعار والتبويب' },
                      { id: 'display' as const, num: '٢', label: 'الواجهة والعرض', icon: Monitor, desc: 'الهيدر، الإنترو، وبوابة المشرف' },
                      { id: 'booking-module' as const, num: '٣', label: 'نظام الحجوزات', icon: Key, desc: 'بوابة الحجز، الواتساب، والبريد' },
                      { id: 'contact-data' as const, num: '٤', label: 'الفروع والقنوات', icon: Phone, desc: 'أرقام الاتصال والخرائط والمقر' },
                      { id: 'visibility' as const, num: '٥', label: 'عناصر الظهور', icon: Eye, desc: 'إظهار وإخفاء الأقسام والأزرار' },
                      { id: 'hotel-detail' as const, num: '٦', label: 'نصوص الفنادق', icon: Sliders, desc: 'الفنادق المقترحة وروابط الفوتر' },
                      { id: 'database' as const, num: '٧', label: 'قاعدة البيانات', icon: Database, desc: 'Supabase والاتصال الحي' },
                      { id: 'seo' as const, num: '٨', label: 'محركات البحث (SEO)', icon: Search, desc: 'معاينة جوجل والوصف التعريفي' }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isCurrent = settingsSubTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSettingsSubTab(tab.id)}
                          className={`p-3 rounded-2xl text-right transition-all flex flex-col justify-between gap-1.5 cursor-pointer border relative group ${
                            isCurrent
                              ? 'bg-[#C9A24B] text-white border-[#C9A24B] shadow-md shadow-[#C9A24B]/20 font-bold'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200/90'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-white' : 'text-[#B38A34]'}`} />
                              <strong className="text-xs font-bold truncate font-cairo">{tab.label}</strong>
                            </div>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold ${
                              isCurrent ? 'bg-white/25 text-white' : 'bg-stone-200/70 text-stone-600'
                            }`}>
                              {tab.num}
                            </span>
                          </div>
                          <span className={`text-[10px] leading-tight line-clamp-1 ${isCurrent ? 'text-amber-100' : 'text-stone-400 group-hover:text-stone-500'}`}>
                            {tab.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-Tab 1: Brand & Logo Manager */}
                {settingsSubTab === 'brand' && (
                  <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6 animate-fadeIn">
                    <div className="pb-4 border-b border-stone-200">
                      <h3 className="text-lg font-cairo font-bold text-stone-900">هوية الموقع والشعار العام</h3>
                      <p className="text-xs text-stone-500">
                        التحكم في اسم المنصة، الشعار المرفوع، والروابط الرسمية
                      </p>
                    </div>

                  {/* 1. Brand Name & Subtitle (Bilingual) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-100 pb-2">
                      <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
                      <span>١. اسم وهوية المنصة والشركة (عربي / English)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">اسم المنصة أو الشركة (بالعربية):</label>
                        <input
                          type="text"
                          value={settingsForm.siteTitle}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, siteTitle: e.target.value })}
                          placeholder="برستيج لإدارة وتشغيل الفنادق"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">اسم المنصة أو الشركة (English):</label>
                        <input
                          type="text"
                          value={settingsForm.siteTitleEn || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, siteTitleEn: e.target.value })}
                          placeholder="Prestige Hotels Management & Operation"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors dir-ltr text-left"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">الوصف الفرعي (بالعربية):</label>
                        <input
                          type="text"
                          value={settingsForm.siteSubtitle}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, siteSubtitle: e.target.value })}
                          placeholder="إدارة وتشغيل الفنادق والضيافة الفاخرة"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">الوصف الفرعي (English):</label>
                        <input
                          type="text"
                          value={settingsForm.siteSubtitleEn || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, siteSubtitleEn: e.target.value })}
                          placeholder="Luxury Hospitality & Hotel Management"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors dir-ltr text-left"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Footer Description / Bio (Bilingual) */}
                  <div className="space-y-4 pt-4 border-t border-stone-200">
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-100 pb-2">
                      <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
                      <span>٢. نبذة الشركة ونصوص الفوتر الرسمية (عربي / English)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">نبذة الفوتر العامة (بالعربية):</label>
                        <textarea
                          rows={3}
                          value={settingsForm.footerBio || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, footerBio: e.target.value })}
                          placeholder="شركة برستيج الرائدة والمتخصصة في تقديم حلول إدارة وتشغيل الفنادق والتسكين الفاخر..."
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">نبذة الفوتر العامة (English):</label>
                        <textarea
                          rows={3}
                          value={settingsForm.footerBioEn || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, footerBioEn: e.target.value })}
                          placeholder="Leading company dedicated to providing hotel management, operations, and luxury accommodation..."
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors leading-relaxed dir-ltr text-left"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Customer Service Heading & Description (Bilingual) */}
                  <div className="space-y-4 pt-4 border-t border-stone-200">
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-100 pb-2">
                      <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
                      <span>٣. قسم خدمة العملاء والمساعدة (الفوتر) (عربي / English)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">عنوان قسم خدمة العملاء (عربي):</label>
                        <input
                          type="text"
                          value={settingsForm.customerServiceTitle || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, customerServiceTitle: e.target.value })}
                          placeholder="خدمة العملاء والتواصل"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">عنوان قسم خدمة العملاء (English):</label>
                        <input
                          type="text"
                          value={settingsForm.customerServiceTitleEn || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, customerServiceTitleEn: e.target.value })}
                          placeholder="Customer Service & Inquiries"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none dir-ltr text-left"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">وصف خدمة العملاء (عربي):</label>
                        <textarea
                          rows={2}
                          value={settingsForm.customerServiceDesc || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, customerServiceDesc: e.target.value })}
                          placeholder="فريق الاستقبال والحجوزات متاح على مدار الساعة طوال أيام الأسبوع لخدمتكم واستقبال استفساراتكم."
                          className="w-full px-4 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">وصف خدمة العملاء (English):</label>
                        <textarea
                          rows={2}
                          value={settingsForm.customerServiceDescEn || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, customerServiceDescEn: e.target.value })}
                          placeholder="Our reception and booking team is available 24/7 to assist you and receive all inquiries."
                          className="w-full px-4 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none dir-ltr text-left"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. WhatsApp Direct Button & Floating WhatsApp Bubble (Bilingual) */}
                  <div className="space-y-4 pt-4 border-t border-stone-200">
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-100 pb-2">
                      <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
                      <span>٤. زر واتساب الفوتر والفقاعة العائمة (عربي / English)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">نص زر واتساب في الفوتر (عربي):</label>
                        <input
                          type="text"
                          value={settingsForm.footerWhatsAppButtonText || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, footerWhatsAppButtonText: e.target.value })}
                          placeholder="تحدث مع مستشار التسكين واتساب"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">نص زر واتساب في الفوتر (English):</label>
                        <input
                          type="text"
                          value={settingsForm.footerWhatsAppButtonTextEn || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, footerWhatsAppButtonTextEn: e.target.value })}
                          placeholder="Chat with Housing Advisor on WhatsApp"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none dir-ltr text-left"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">رقم واتساب الفوتر المباشر (اختياري):</label>
                        <input
                          type="tel"
                          value={settingsForm.footerWhatsAppNumber || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, footerWhatsAppNumber: e.target.value })}
                          placeholder="+966544076726"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm font-mono dir-ltr text-left focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">نص فقاعة واتساب العائمة (عربي):</label>
                        <input
                          type="text"
                          value={settingsForm.floatingWhatsAppBubbleText || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, floatingWhatsAppBubbleText: e.target.value })}
                          placeholder="تواصل معنا على واتساب"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">نص فقاعة واتساب العائمة (English):</label>
                        <input
                          type="text"
                          value={settingsForm.floatingWhatsAppBubbleTextEn || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, floatingWhatsAppBubbleTextEn: e.target.value })}
                          placeholder="Chat on WhatsApp"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none dir-ltr text-left"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. Copyright Text (Bilingual) */}
                  <div className="space-y-4 pt-4 border-t border-stone-200">
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-100 pb-2">
                      <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
                      <span>٥. نص حقوق الملكية الفكرية (Copyright) (عربي / English)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">نص الحقوق (بالعربية):</label>
                        <input
                          type="text"
                          value={settingsForm.copyrightText || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, copyrightText: e.target.value })}
                          placeholder="لإدارة وتشغيل الفنادق والضيافة. جميع الحقوق محفوظة."
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">نص الحقوق (English):</label>
                        <input
                          type="text"
                          value={settingsForm.copyrightTextEn || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, copyrightTextEn: e.target.value })}
                          placeholder="Hotel Management & Operations. All rights reserved."
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none dir-ltr text-left"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo Management */}
                  <div className="pt-4 border-t border-stone-200 space-y-6">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-3">شعار الموقع والهوية الرسمية (Logo):</label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-stone-50 border border-stone-200 p-2 flex items-center justify-center shrink-0">
                          {settingsForm.logoUrl ? (
                            <img
                              src={settingsForm.logoUrl}
                              alt="Logo"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                              <Building2 className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-3">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-[#C9A24B] text-stone-800 hover:text-white text-xs font-bold border border-stone-300 transition-colors">
                            <UploadCloud className="w-4 h-4" />
                            <span>رفع ملف شعار من الجهاز (PNG شفاف، JPG، WebP، SVG)</span>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, .png, .jpg, .jpeg, .webp, .svg, image/*"
                              onChange={handleLogoFileUpload}
                              className="hidden"
                            />
                          </label>

                          <div>
                            <span className="text-xs text-stone-600 block mb-1 font-semibold">أو رابط صورة الشعار:</span>
                            <input
                              type="url"
                              value={settingsForm.logoUrl}
                              onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, logoUrl: e.target.value })}
                              placeholder="https://example.com/logo.png"
                              className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs font-mono focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Browser Tab Favicon & Tab Name Customization */}
                    <div className="p-5 rounded-2xl bg-stone-900 text-white space-y-5 shadow-inner">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#C9A24B]/20 text-[#DFBE72] flex items-center justify-center">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-cairo font-bold text-sm text-stone-100">
                              تخصيص علامة تبويب المتصفح (شعار + اسم التبويب)
                            </h4>
                            <span className="text-[11px] text-stone-400">
                              تحكم كامل في الأيقونة واسم الصفحة الذي يظهر للمستخدم في شريط المتصفح
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                          ✓ حفظ وتحديث فوري
                        </span>
                      </div>

                      {/* Custom Tab Title Input */}
                      <div className="space-y-1.5 bg-stone-800/60 p-4 rounded-xl border border-stone-700">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-stone-200">
                            اسم / عنوان علامة التبويب (Tab Title):
                          </label>
                          {settingsForm.browserTabTitle && (
                            <button
                              type="button"
                              onClick={() => triggerAutoSaveSettings({ ...settingsForm, browserTabTitle: '' })}
                              className="text-[11px] text-[#DFBE72] hover:underline"
                            >
                              استعادة التلقائي
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={settingsForm.browserTabTitle || ''}
                          onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, browserTabTitle: e.target.value })}
                          placeholder={`${settingsForm.siteTitle || 'برستيج لإدارة وتشغيل الفنادق'} | ${settingsForm.siteSubtitle || 'Prestige Hotels'}`}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-600 text-stone-100 text-xs focus:border-[#C9A24B] focus:outline-none"
                        />
                        <p className="text-[11px] text-stone-400">
                          اكتب الاسم الذي تريده أن يظهر في لسان المتصفح أعلى النافذة. إذا تركته فارغاً سيتم استخدام اسم الموقع.
                        </p>
                      </div>

                      {/* Realistic Browser Tab Mockup */}
                      <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800/80 flex items-center justify-center">
                        <div className="max-w-md w-full bg-[#202124] text-stone-200 px-3.5 py-2 rounded-t-xl border-t-2 border-[#C9A24B] flex items-center justify-between gap-3 shadow-md">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {/* Live Favicon */}
                            <div className="w-5 h-5 rounded-md bg-stone-800 p-0.5 flex items-center justify-center shrink-0 border border-stone-700 overflow-hidden">
                              {settingsForm.faviconUrl || settingsForm.logoUrl ? (
                                <img
                                  src={settingsForm.faviconUrl || settingsForm.logoUrl}
                                  alt="Favicon"
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Building2 className="w-3.5 h-3.5 text-[#C9A24B]" />
                              )}
                            </div>
                            {/* Live Tab Title */}
                            <span className="text-xs font-semibold truncate text-stone-100">
                              {settingsForm.browserTabTitle || `${settingsForm.siteTitle || 'برستيج لإدارة وتشغيل الفنادق'} | ${settingsForm.siteSubtitle || 'Prestige'}`}
                            </span>
                          </div>

                          {/* Close X */}
                          <div className="w-4 h-4 rounded-full hover:bg-stone-700 text-stone-400 flex items-center justify-center text-[10px] shrink-0">
                            ✕
                          </div>
                        </div>
                      </div>

                      {/* Custom Favicon URL & Direct Upload */}
                      <div className="space-y-2 bg-stone-800/60 p-4 rounded-xl border border-stone-700">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-stone-200">
                            أيقونة علامة التبويب (Favicon):
                          </label>
                          {settingsForm.faviconUrl && (
                            <button
                              type="button"
                              onClick={() => triggerAutoSaveSettings({ ...settingsForm, faviconUrl: '' })}
                              className="text-[11px] text-[#DFBE72] hover:underline"
                            >
                              استعادة شعار الموقع كأيقونة
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="url"
                            value={settingsForm.faviconUrl || ''}
                            onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, faviconUrl: e.target.value })}
                            placeholder="https://example.com/favicon.png أو ارفع ملف من الزر المجاور"
                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-600 text-stone-100 text-xs font-mono focus:border-[#C9A24B] focus:outline-none"
                          />
                          <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#d8b054] text-stone-900 text-xs font-bold transition-colors shrink-0 shadow-sm">
                            <UploadCloud className="w-4 h-4" />
                            <span>رفع أيقونة Favicon</span>
                            <input
                              type="file"
                              accept="image/png, image/x-icon, image/svg+xml, image/webp, .ico, .png, .svg, .webp, image/*"
                              onChange={handleFaviconFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-[11px] text-stone-400">
                          يمكنك رفع أيقونة مخصصة (PNG شفاف، ICO، SVG، WebP) أو وضع رابط مباشر. إذا تركتها فارغة سيتم استخدام شعار الموقع تلقائياً.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <p className="text-[11px] text-stone-400 leading-relaxed">
                          أي تغيير في الشعار، الأيقونة، أو اسم علامة التبويب يتم حفظه وتحديثه لحظياً لدى جميع زوار الموقع.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

                {/* Sub-Tab: Site Display & Layout Settings (عرض وتجربة الموقع، الهيدر، الإنترو، وبوابة المشرفين) */}
                {settingsSubTab === 'display' && (
                  <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-8 animate-fadeIn">
                    <div className="pb-4 border-b border-stone-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                          <Monitor className="w-4 h-4" />
                        </div>
                        <h3 className="text-lg font-cairo font-bold text-stone-900">
                          إعدادات عرض وتجربة تصفح الموقع (Display & UX Settings)
                        </h3>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        التحكم في سلوك شريط التنقل العلوي (الهيدر)، تكرار تشغيل فيديو الإنترو في الصفحة الرئيسية، وخصوصية روابط المشرفين.
                      </p>
                    </div>

                    {/* Section 1: Header Navbar Behavior */}
                    <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-sm font-bold text-stone-900 flex items-center gap-2">
                          <Layout className="w-4 h-4 text-[#C9A24B]" />
                          <span>سلوك شريط التنقل العلوي (Header Navbar Behavior):</span>
                        </label>
                        <span className="text-[10px] font-bold text-stone-500 bg-white px-2.5 py-1 rounded-full border border-stone-200">
                          يطبق للجوال والكمبيوتر دون قفزات (No Layout Jumps)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          {
                            id: 'scroll_hide' as const,
                            title: 'إخفاء ذكي عند النزول / إظهار عند الصعود ⚡',
                            subtitle: 'Hide on scroll down / Show on scroll up',
                            badge: 'الموصى به افتراضياً',
                            desc: 'يظهر في أعلى الصفحة، ويختفي بنعومة أثناء التمرير للأسفل لتوفير مساحة قراءة للزائر، ويعود فور التمرير للأعلى أو اقتراب المؤشر من الأعلى.'
                          },
                          {
                            id: 'fixed' as const,
                            title: 'ثابت وظاهر دائماً (Always Fixed) 📌',
                            subtitle: 'Always visible at top',
                            badge: 'شريط عائم دائم',
                            desc: 'يبقى شريط التنقل الزجاجي ثابتاً وظاهراً في أعلى الشاشة في كل الأوقات وأثناء التمرير على الجوال والكمبيوتر.'
                          },
                          {
                            id: 'static' as const,
                            title: 'متمرر مع الصفحة (Static / Scrolls Away) 📜',
                            subtitle: 'Scrolls naturally with content',
                            badge: 'تصفح تقليدي',
                            desc: 'يبقى في بداية الصفحة ويتمرر للأعلى مع المحتوى ليختفي بطريقة طبيعية دون أي تثبيت أو قفزات في التخطيط.'
                          }
                        ].map(item => {
                          const currentBehavior = settingsForm.displaySettings?.headerBehavior || 'scroll_hide';
                          const isSelected = currentBehavior === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                const updated: SiteSettings = {
                                  ...settingsForm,
                                  displaySettings: {
                                    ...settingsForm.displaySettings,
                                    headerBehavior: item.id
                                  }
                                };
                                triggerAutoSaveSettings(updated);
                                onShowToast(`تم ضبط سلوك شريط الهيدر: ${item.title}`, 'success');
                              }}
                              className={`p-4 rounded-2xl text-right transition-all flex flex-col justify-between border cursor-pointer relative ${
                                isSelected
                                  ? 'bg-white border-[#C9A24B] shadow-sm ring-2 ring-[#C9A24B]/30'
                                  : 'bg-white/80 hover:bg-white border-stone-200 text-stone-700'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <strong className="text-xs font-bold text-stone-900 block">{item.title}</strong>
                                  {isSelected && (
                                    <div className="w-5 h-5 rounded-full bg-[#C9A24B] text-white flex items-center justify-center shrink-0">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] text-stone-400 block font-mono mb-2">{item.subtitle}</span>
                                <p className="text-[11px] text-stone-600 leading-relaxed">{item.desc}</p>
                              </div>
                              <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                                <span className="text-[10px] text-[#B38A34] font-bold">{item.badge}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 2: Intro Animation Frequency */}
                    <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-stone-900 flex items-center gap-2">
                          <Film className="w-4 h-4 text-[#C9A24B]" />
                          <span>تكرار وظهور إنترو الصفحة الرئيسية (Intro Animation Frequency):</span>
                        </label>

                        {/* Toggle Intro enabled/disabled */}
                        <button
                          type="button"
                          onClick={() => {
                            const currentEnabled = settingsForm.displaySettings?.introEnabled !== false && settingsForm.introVideo?.enabled !== false;
                            const updated: SiteSettings = {
                              ...settingsForm,
                              introVideo: {
                                ...(settingsForm.introVideo || { videoUrl: '' }),
                                enabled: !currentEnabled
                              },
                              displaySettings: {
                                ...settingsForm.displaySettings,
                                introEnabled: !currentEnabled
                              }
                            };
                            triggerAutoSaveSettings(updated);
                            onShowToast(!currentEnabled ? 'تم تفعيل إنترو الصفحة الرئيسية' : 'تم تعطيل إنترو الصفحة الرئيسية', 'info');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            (settingsForm.displaySettings?.introEnabled !== false && settingsForm.introVideo?.enabled !== false)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {(settingsForm.displaySettings?.introEnabled !== false && settingsForm.introVideo?.enabled !== false) ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>الإنترو مفعّل</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5" />
                              <span>الإنترو معطّل</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          {
                            id: 'session' as const,
                            title: 'مرة واحدة لكل جلسة متصفح 🌐',
                            subtitle: 'Once per browser session',
                            badge: 'الافتراضي الموصى به',
                            desc: 'يتم تشغيل الإنترو الترحيبي مرة واحدة فقط عند فتح الزائر للموقع، ويختفي بعد انتهائه أو تخطيه ولا يتكرر أثناء تنقله حتى يغلق المتصفح.'
                          },
                          {
                            id: 'daily' as const,
                            title: 'مرة واحدة كل 24 ساعة ⏱️',
                            subtitle: 'Once every 24 hours',
                            badge: 'هادئ للزوار المتكررين',
                            desc: 'يظهر للزائر مرة واحدة في اليوم فقط. في حال زيارته المتكررة لن يظهر الإنترو مجدداً إلا بعد انقضاء 24 ساعة كاملة.'
                          },
                          {
                            id: 'always' as const,
                            title: 'مع كل زيارة للرئيسية 🎬',
                            subtitle: 'Every visit / page load',
                            badge: 'عرض دائم',
                            desc: 'يتم تشغيل مقطع الإنترو مع كل فتح أو إعادة تحميل للصفحة الرئيسية، مع إمكانية التخطي الفوري بزر المتابعة.'
                          }
                        ].map(item => {
                          const currentFreq = settingsForm.displaySettings?.introFrequency || settingsForm.introVideo?.frequency || 'session';
                          const isSelected = currentFreq === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                const updated: SiteSettings = {
                                  ...settingsForm,
                                  introVideo: {
                                    ...(settingsForm.introVideo || { videoUrl: '', enabled: true }),
                                    frequency: item.id
                                  },
                                  displaySettings: {
                                    ...settingsForm.displaySettings,
                                    introFrequency: item.id
                                  }
                                };
                                triggerAutoSaveSettings(updated);
                                onShowToast(`تم ضبط تكرار الإنترو: ${item.title}`, 'success');
                              }}
                              className={`p-4 rounded-2xl text-right transition-all flex flex-col justify-between border cursor-pointer ${
                                isSelected
                                  ? 'bg-white border-[#C9A24B] shadow-sm ring-2 ring-[#C9A24B]/30'
                                  : 'bg-white/80 hover:bg-white border-stone-200 text-stone-700'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <strong className="text-xs font-bold text-stone-900 block">{item.title}</strong>
                                  {isSelected && (
                                    <div className="w-5 h-5 rounded-full bg-[#C9A24B] text-white flex items-center justify-center shrink-0">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] text-stone-400 block font-mono mb-2">{item.subtitle}</span>
                                <p className="text-[11px] text-stone-600 leading-relaxed">{item.desc}</p>
                              </div>
                              <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                                <span className="text-[10px] text-[#B38A34] font-bold">{item.badge}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                        <Sparkles className="w-4 h-4 text-[#C9A24B] shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                          <strong>حماية السيو وسرعة الأرشفة:</strong> يتم استثناء محركات البحث والمفهرسات (Googlebot و Bingbot وغيرها) تلقائياً لعرض محتوى الموقع الفوري دون أي حجب أو تأخير، كما يختفي الإنترو كلياً بمجرد انتهاء الفيديو أو الضغط على زر التخطي.
                        </p>
                      </div>
                    </div>

                    {/* Section 3: Admin Link in Footer */}
                    <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <label className="text-sm font-bold text-stone-900 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-[#C9A24B]" />
                            <span>رابط "بوابة المشرفين" في أسفل الموقع (Footer Admin Link):</span>
                          </label>
                          <p className="text-xs text-stone-500 mt-0.5">
                            إظهار أو إخفاء رابط الدخول للوحة التحكم في الفوتر للزوار العاديين.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const currentVal = settingsForm.displaySettings?.showFooterAdminLink === true;
                            const updated: SiteSettings = {
                              ...settingsForm,
                              displaySettings: {
                                ...settingsForm.displaySettings,
                                showFooterAdminLink: !currentVal
                              }
                            };
                            triggerAutoSaveSettings(updated);
                            onShowToast(!currentVal ? 'تم إظهار رابط بوابة المشرفين في الفوتر' : 'تم إخفاء رابط المشرفين من الفوتر بنجاح', 'info');
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                            settingsForm.displaySettings?.showFooterAdminLink === true
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                          }`}
                        >
                          {settingsForm.displaySettings?.showFooterAdminLink === true ? (
                            <>
                              <Eye className="w-4 h-4" />
                              <span>ظاهر في الفوتر</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4" />
                              <span>مخفي عن الزوار (الافتراضي الآمن)</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-3 bg-stone-100 rounded-xl border border-stone-200/80 text-[11px] text-stone-600 space-y-1">
                        <p className="font-semibold text-stone-800">
                          🔒 ملاحظة أمنية:
                        </p>
                        <p>
                          عند إخفاء الرابط، تظل بوابة المشرفين متاحة دائماً للإدارة عبر كتابة الرابط المباشر <code className="px-1.5 py-0.5 rounded bg-white font-mono text-[#B38A34] font-bold">/admin</code> في شريط المتصفح، وهي محمية بنظام قيود المحاولات المتكررة (Rate Limiting) ووسم <code className="px-1.5 py-0.5 rounded bg-white font-mono">noindex</code> لمنع محركات البحث من فهرستها.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab: Booking Module Settings (التحكم في إظهار وإخفاء نظام الحجوزات) */}
                {settingsSubTab === 'booking-module' && (
                  <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6 animate-fadeIn">
                    <div className="pb-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-cairo font-bold text-stone-900">
                          إعدادات نظام الحجوزات والغرف الفندقية
                        </h3>
                        <p className="text-xs text-stone-500">
                          تحكم شامل في تفعيل أو إخفاء ميزة حجز الغرف، أرقام الواتساب والبريد المخصصة للحجز، وتوليد المفاتيح الرقمية.
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#C9A24B]/10 border border-[#C9A24B]/20 text-[#8C6D23] text-xs font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>التنقل وإدارة الأقسام متاح عبر القوائم الجانبية</span>
                      </div>
                    </div>

                    {/* Master Switch: Enable / Disable Booking Module */}
                    <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-4">
                      <div>
                        <strong className="text-sm font-bold text-amber-950 block">
                          تفعيل منظومة حجز الغرف في الموقع بالكامل
                        </strong>
                        <p className="text-xs text-amber-800 mt-0.5">
                          عند التعطيل، يتم إخفاء أزرار الحجز وقوائم الغرف ومتابعة الحجز عن كافة زوار الموقع في ثوانٍ.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const currentEnabled = settingsForm.bookingModule?.enabled !== false;
                          triggerAutoSaveSettings({
                            ...settingsForm,
                            bookingModule: {
                              ...settingsForm.bookingModule,
                              enabled: !currentEnabled,
                              allowPublicBookingCreation: settingsForm.bookingModule?.allowPublicBookingCreation !== false,
                              mode: settingsForm.bookingModule?.mode || (settingsForm.bookingModule?.allowPublicBookingCreation === false ? 'manage_only' : 'full'),
                              showInHeader: settingsForm.bookingModule?.showInHeader !== false,
                              showTrackBookingModal: settingsForm.bookingModule?.showTrackBookingModal !== false,
                              showInHero: settingsForm.bookingModule?.showInHero !== false,
                              showInHotelDetail: settingsForm.bookingModule?.showInHotelDetail !== false,
                              enableWhatsAppRedirect: settingsForm.bookingModule?.enableWhatsAppRedirect !== false,
                              enableEmailNotification: settingsForm.bookingModule?.enableEmailNotification !== false,
                              autoAssignDigitalKey: settingsForm.bookingModule?.autoAssignDigitalKey !== false
                            }
                          });
                        }}
                        className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                          settingsForm.bookingModule?.enabled !== false ? 'bg-[#C9A24B]' : 'bg-stone-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                          settingsForm.bookingModule?.enabled !== false ? (document.dir === 'rtl' ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Operating Mode: Full Online Booking vs Manage & Track Only */}
                    <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <strong className="text-sm font-bold text-stone-900 block">
                            نمط تشغيل نظام الحجوزات والفنادق
                          </strong>
                          <p className="text-xs text-stone-600 mt-0.5">
                            التحكم في إتاحة حجز الغرف أونلاين على الموقع أو تحويل النظام إلى إدارة ومتابعة فقط (الفنادق غير متاحة للحجز المباشر على الموقع).
                          </p>
                        </div>

                        <div className="inline-flex p-1 rounded-xl bg-stone-200/80 shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              triggerAutoSaveSettings({
                                ...settingsForm,
                                bookingModule: {
                                  ...settingsForm.bookingModule,
                                  enabled: settingsForm.bookingModule?.enabled !== false,
                                  allowPublicBookingCreation: true,
                                  mode: 'full',
                                  showInHeader: settingsForm.bookingModule?.showInHeader !== false,
                                  showTrackBookingModal: settingsForm.bookingModule?.showTrackBookingModal !== false,
                                  showInHero: settingsForm.bookingModule?.showInHero !== false,
                                  showInHotelDetail: settingsForm.bookingModule?.showInHotelDetail !== false,
                                  enableWhatsAppRedirect: settingsForm.bookingModule?.enableWhatsAppRedirect !== false,
                                  enableEmailNotification: settingsForm.bookingModule?.enableEmailNotification !== false,
                                  autoAssignDigitalKey: settingsForm.bookingModule?.autoAssignDigitalKey !== false
                                }
                              });
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              settingsForm.bookingModule?.allowPublicBookingCreation !== false
                                ? 'bg-white text-stone-900 shadow-xs'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            حجز مباشر أونلاين (كامل)
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              triggerAutoSaveSettings({
                                ...settingsForm,
                                bookingModule: {
                                  ...settingsForm.bookingModule,
                                  enabled: settingsForm.bookingModule?.enabled !== false,
                                  allowPublicBookingCreation: false,
                                  mode: 'manage_only',
                                  showInHeader: settingsForm.bookingModule?.showInHeader !== false,
                                  showTrackBookingModal: settingsForm.bookingModule?.showTrackBookingModal !== false,
                                  showInHero: settingsForm.bookingModule?.showInHero !== false,
                                  showInHotelDetail: settingsForm.bookingModule?.showInHotelDetail !== false,
                                  enableWhatsAppRedirect: settingsForm.bookingModule?.enableWhatsAppRedirect !== false,
                                  enableEmailNotification: settingsForm.bookingModule?.enableEmailNotification !== false,
                                  autoAssignDigitalKey: settingsForm.bookingModule?.autoAssignDigitalKey !== false
                                }
                              });
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              settingsForm.bookingModule?.allowPublicBookingCreation === false
                                ? 'bg-[#C9A24B] text-white shadow-xs'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            إدارة ومتابعة حجز فقط (تعطيل الحجز على الموقع)
                          </button>
                        </div>
                      </div>

                      {settingsForm.bookingModule?.allowPublicBookingCreation === false && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 animate-fadeIn">
                          <ShieldCheck className="w-4 h-4 text-[#B38A34] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">
                              وضع المنظومة الحالي: إدارة ومتابعة فقط (الحجز المباشر مغلق على الموقع)
                            </span>
                            <span className="text-[11px] text-amber-800 leading-relaxed block mt-0.5">
                              تم إخفاء نماذج الحجز الآلي من واجهة الزوار، وأصبحت أزرار الفنادق تحوّل للطلب والاستفسار عبر الواتساب/الهاتف، بينما يظل بإمكان النزلاء متابعة حجوزاتهم المسجلة بالكود أو الهاتف، وللإدارة كامل الصلاحيات لإدارة الحجوزات وتعيين الغرف من لوحة التحكم.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Toggles Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {[
                        {
                          key: 'allowPublicBookingCreation',
                          title: 'إتاحة إنشاء حجز جديد للزوار من الموقع',
                          desc: 'عند التعطيل تصبح الفنادق غير متاحة للحجز أونلاين وتتحول لإدارة واستفسار'
                        },
                        {
                          key: 'showInHeader',
                          title: 'إظهار رابط الحجوزات في القائمة العلوية',
                          desc: 'زر مميز في شريط التنقل للوصول المباشر'
                        },
                        {
                          key: 'showTrackBookingModal',
                          title: 'إظهار خيار "متابعة الحجز" للنزلاء',
                          desc: 'تمكين النزيل من البحث عن حجزه وعرض مفتاحه'
                        },
                        {
                          key: 'showInHotelDetail',
                          title: 'تفعيل قسم حجز الغرف في تفاصيل الفندق',
                          desc: 'عرض خيارات الغرف وأزرار الحجز المباشر'
                        },
                        {
                          key: 'enableWhatsAppRedirect',
                          title: 'فتح واتساب العميل تلقائياً عند التأكيد',
                          desc: 'تجهيز رسالة الحجز الكاملة ليقوم بإرسالها فوراً'
                        },
                        {
                          key: 'autoAssignDigitalKey',
                          title: 'توليد المفتاح الرقمي (Digital Key) تلقائياً',
                          desc: 'إصدار كود دخول مؤقت لكل حجز مسجل'
                        },
                        {
                          key: 'enableEmailNotification',
                          title: 'تفعيل إشعارات البريد الإلكتروني',
                          desc: 'إرسال تأكيد الحجز لبريد العميل والإدارة'
                        }
                      ].map((item) => {
                        const isChecked = (settingsForm.bookingModule as any)?.[item.key] !== false;
                        return (
                          <div 
                            key={item.key}
                            className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-3"
                          >
                            <div>
                              <strong className="text-xs font-bold text-stone-900 block">{item.title}</strong>
                              <p className="text-[11px] text-stone-500 mt-0.5">{item.desc}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    enabled: settingsForm.bookingModule?.enabled !== false,
                                    allowPublicBookingCreation: settingsForm.bookingModule?.allowPublicBookingCreation !== false,
                                    mode: settingsForm.bookingModule?.mode || 'full',
                                    showInHeader: settingsForm.bookingModule?.showInHeader !== false,
                                    showTrackBookingModal: settingsForm.bookingModule?.showTrackBookingModal !== false,
                                    showInHero: settingsForm.bookingModule?.showInHero !== false,
                                    showInHotelDetail: settingsForm.bookingModule?.showInHotelDetail !== false,
                                    enableWhatsAppRedirect: settingsForm.bookingModule?.enableWhatsAppRedirect !== false,
                                    enableEmailNotification: settingsForm.bookingModule?.enableEmailNotification !== false,
                                    autoAssignDigitalKey: settingsForm.bookingModule?.autoAssignDigitalKey !== false,
                                    [item.key]: !isChecked
                                  }
                                });
                              }}
                              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 mt-0.5 ${
                                isChecked ? 'bg-[#C9A24B]' : 'bg-stone-300'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                                isChecked ? (document.dir === 'rtl' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* WhatsApp & Email Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-stone-200">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1.5">
                          رقم واتساب المخصص لاستقبال الحجوزات:
                        </label>
                        <input
                          type="tel"
                          dir="ltr"
                          placeholder="+966544076726"
                          value={settingsForm.bookingModule?.bookingWhatsApp || ''}
                          onChange={(e) => {
                            triggerAutoSaveSettings({
                              ...settingsForm,
                              bookingModule: {
                                ...settingsForm.bookingModule,
                                enabled: settingsForm.bookingModule?.enabled !== false,
                                allowPublicBookingCreation: settingsForm.bookingModule?.allowPublicBookingCreation !== false,
                                mode: settingsForm.bookingModule?.mode || 'full',
                                showInHeader: settingsForm.bookingModule?.showInHeader !== false,
                                showTrackBookingModal: settingsForm.bookingModule?.showTrackBookingModal !== false,
                                showInHero: settingsForm.bookingModule?.showInHero !== false,
                                showInHotelDetail: settingsForm.bookingModule?.showInHotelDetail !== false,
                                enableWhatsAppRedirect: settingsForm.bookingModule?.enableWhatsAppRedirect !== false,
                                enableEmailNotification: settingsForm.bookingModule?.enableEmailNotification !== false,
                                autoAssignDigitalKey: settingsForm.bookingModule?.autoAssignDigitalKey !== false,
                                bookingWhatsApp: e.target.value
                              }
                            });
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs font-bold text-right focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors"
                        />
                        <span className="text-[10px] text-stone-400 mt-1 block">
                          عند قيام العميل بالحجز، يفتح محادثة واتساب مباشرة مع هذا الرقم
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-stone-700 block">
                            بريد إشعارات الحجز المعتمد (Gmail / Corporate):
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const target = resolveBookingEmail(settingsForm);
                                onShowToast(`جاري إرسال إشعار تجريبي إلى ${target}...`, 'info');
                                try {
                                  const sampleBooking: any = {
                                    id: 'test_' + Date.now(),
                                    bookingCode: 'TEST-8800',
                                    digitalKey: 'CONF-8800',
                                    hotelId: 'test_hotel',
                                    hotelName: 'فندق تجريبي (فحص الإشعار والبريد)',
                                    hotelCity: 'مكة المكرمة',
                                    roomId: 'room_suite',
                                    roomName: 'جناح ديلوكس تجريبي',
                                    guestName: 'أحمد هشام (اختبار النظام)',
                                    guestPhone: '+966560580250',
                                    guestEmail: target,
                                    checkIn: '2026-03-01',
                                    checkOut: '2026-03-04',
                                    nights: 3,
                                    roomsCount: 1,
                                    adults: 2,
                                    children: 1,
                                    mealPlanId: 'meal_breakfast',
                                    mealPlanName: 'شامل بوفيه إفطار فاخر',
                                    mealPlanPrice: 45,
                                    roomPricePerNight: 400,
                                    totalAmount: 1335,
                                    specialRequests: 'إشعار تجريبي لاختبار وصول رسائل الحجوزات والواتساب والبريد.',
                                    status: 'pending',
                                    adminNotes: 'ملاحظة المشرف: حجز تجريبي للتأكد من وصول تفاصيل الحجز إلى بريد الشركة.',
                                    createdAt: Date.now()
                                  };
                                  const res = await sendOnlineBookingNotification(sampleBooking, settingsForm);
                                  if (res && res.needsActivation) {
                                    onShowToast(`تم إرسال رابط التفعيل إلى: ${target} - يرجى الضغط على زر التفعيل في البريد لمرة واحدة للاستلام التلقائي المستمر.`, 'info');
                                  } else {
                                    onShowToast(`تم تسليم إشعار التجربة بنجاح إلى: ${target}`, 'success');
                                  }
                                } catch {
                                  onShowToast('حدث خطأ أثناء إرسال الإشعار التجريبي', 'error');
                                }
                              }}
                              className="text-[11px] text-[#B38A34] hover:text-[#98752B] font-bold bg-[#C9A24B]/15 hover:bg-[#C9A24B]/25 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                            >
                              ✉️ تجربة إرسال إشعار بريدي
                            </button>
                            <a
                              href="https://mail.google.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-stone-500 hover:text-stone-800 font-semibold underline"
                            >
                              فتح Gmail للتحقق
                            </a>
                          </div>
                        </div>
                        <input
                          type="email"
                          dir="ltr"
                          placeholder="prestigeksa.umrah@gmail.com"
                          value={settingsForm.bookingModule?.bookingEmail || ''}
                          onChange={(e) => {
                            triggerAutoSaveSettings({
                              ...settingsForm,
                              bookingModule: {
                                ...settingsForm.bookingModule,
                                enabled: settingsForm.bookingModule?.enabled !== false,
                                allowPublicBookingCreation: settingsForm.bookingModule?.allowPublicBookingCreation !== false,
                                mode: settingsForm.bookingModule?.mode || 'full',
                                showInHeader: settingsForm.bookingModule?.showInHeader !== false,
                                showTrackBookingModal: settingsForm.bookingModule?.showTrackBookingModal !== false,
                                showInHero: settingsForm.bookingModule?.showInHero !== false,
                                showInHotelDetail: settingsForm.bookingModule?.showInHotelDetail !== false,
                                enableWhatsAppRedirect: settingsForm.bookingModule?.enableWhatsAppRedirect !== false,
                                enableEmailNotification: settingsForm.bookingModule?.enableEmailNotification !== false,
                                autoAssignDigitalKey: settingsForm.bookingModule?.autoAssignDigitalKey !== false,
                                bookingEmail: e.target.value
                              }
                            });
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs font-bold text-right focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors"
                        />
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          عند قيام العميل بالحجز أونلاين، يتم إرسال إشعار فوري منسق بتفاصيل الحجز وسند الحجز إلى هذا الإيميل، وتصلك رسالة مع زر محادثة واتساب مباشر مع العميل.
                        </span>
                      </div>
                    </div>

                    {/* POST-BOOKING AUTOMATION & FREE WORKFLOW SETTINGS */}
                    <div className="pt-6 border-t border-stone-200 space-y-6">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#C9A24B]" />
                        <h4 className="text-sm font-bold text-stone-900 font-cairo">
                          إعدادات سير العمل والتأكيد الآلي (البريد المجاني + الواتساب)
                        </h4>
                      </div>

                      {/* Expiry Hours & Email Toggle Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Pending Expiry Hours */}
                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                          <label className="text-xs font-bold text-stone-800 block">
                            مهلة انتهاء صلاحية الحجوزات المعلقة (بالساعات):
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="72"
                            value={settingsForm.bookingModule?.pendingExpiryHours ?? 24}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 24);
                              triggerAutoSaveSettings({
                                ...settingsForm,
                                bookingModule: {
                                  ...settingsForm.bookingModule,
                                  pendingExpiryHours: val
                                }
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-mono font-bold text-xs"
                          />
                          <p className="text-[10px] text-stone-500 leading-normal">
                            القيمة الافتراضية 24 ساعة. بعد انقضاء هذه المدة دون تأكيد، يتوقف احتساب الحجز من الغرف تلقائياً دون الحاجة لـ Cloud Functions.
                          </p>
                        </div>

                        {/* Enable/Disable Email Sending */}
                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                          <div>
                            <strong className="text-xs font-bold text-stone-900 block">إرسال الفواتير وسندات الحجز بالبريد</strong>
                            <p className="text-[10px] text-stone-500 mt-0.5">
                              تفعيل أو تعطيل إرسال ملفات PDF عبر Google Apps Script تلقائياً للنزيل
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = settingsForm.bookingModule?.enableEmailSending !== false;
                              triggerAutoSaveSettings({
                                ...settingsForm,
                                bookingModule: {
                                  ...settingsForm.bookingModule,
                                  enableEmailSending: !curr
                                }
                              });
                            }}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                              settingsForm.bookingModule?.enableEmailSending !== false ? 'bg-[#C9A24B]' : 'bg-stone-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                              settingsForm.bookingModule?.enableEmailSending !== false ? (document.dir === 'rtl' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </div>

                      {/* Google Apps Script Integration (100% Free) */}
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 border border-amber-200/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[#B38A34]" />
                            <h5 className="text-xs font-bold text-stone-900">
                              تكامل البريد المجاني (Google Apps Script + Gmail)
                            </h5>
                          </div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            مجاني 100% بدون Blaze
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">
                              رابط تطبيق ويب Google Apps Script (Web App URL):
                            </label>
                            <input
                              type="url"
                              dir="ltr"
                              placeholder="https://script.google.com/macros/s/.../exec"
                              value={settingsForm.bookingModule?.appsScriptUrl || ''}
                              onChange={(e) => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    appsScriptUrl: e.target.value.trim()
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs font-mono font-bold focus:border-[#C9A24B] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">
                              المفتاح السري المشترك (Shared Secret Key):
                            </label>
                            <input
                              type="password"
                              dir="ltr"
                              placeholder="أدخل السر المحفوظ في Script Properties"
                              value={settingsForm.bookingModule?.appsScriptSecret || ''}
                              onChange={(e) => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    appsScriptSecret: e.target.value.trim()
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs font-mono font-bold focus:border-[#C9A24B] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] text-stone-500 bg-white/80 p-3 rounded-xl border border-stone-200 space-y-1">
                          <strong className="text-stone-800 block text-xs">تعليمات إعداد ونشر Google Apps Script:</strong>
                          <p>1. افتح الملف <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">apps-script/Code.gs</code> في مشروعك.</p>
                          <p>2. توجه إلى <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-[#B38A34] underline">script.google.com</a> وأنشئ مشروعاً جديداً والصق محتوى الملف.</p>
                          <p>3. في إعدادات المشروع (Project Settings ➔ Script Properties)، أضف خاصية باسم <code>SHARED_SECRET</code> وضع قيمة سرية قوية، وأضف <code>COMPANY_EMAIL</code> لبريدك.</p>
                          <p>4. انقر <strong>Deploy ➔ New deployment ➔ Web app</strong> واجعل التنفيذ <em>Execute as: Me</em> والوصول <em>Who has access: Anyone</em>.</p>
                          <p>5. انسخ رابط الويب والصقه في الحقل أعلاه وضع نفس القيمة السرية.</p>
                        </div>
                      </div>

                      {/* WhatsApp Channels & Message Templates */}
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              رقم واتساب الشركة الرسمي لاستقبال التأكيدات:
                            </label>
                            <input
                              type="tel"
                              dir="ltr"
                              placeholder="+966544076726"
                              value={settingsForm.bookingModule?.companyWhatsApp || ''}
                              onChange={(e) => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    companyWhatsApp: e.target.value.trim(),
                                    bookingWhatsApp: e.target.value.trim()
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs font-bold text-right focus:border-[#C9A24B] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              أرقام مسؤولي التسكين وطاقم العمل (مفصولة بفاصلة):
                            </label>
                            <input
                              type="text"
                              dir="ltr"
                              placeholder="+966544076726, +966501234567"
                              value={settingsForm.bookingModule?.staffContactNumbers?.join(', ') || ''}
                              onChange={(e) => {
                                const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    staffContactNumbers: list
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs font-bold text-right focus:border-[#C9A24B] focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* WhatsApp Message Templates (AR / EN) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Visitor Confirmation Template (AR) */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-800 block">
                              قالب رسالة تأكيد النزيل عبر الواتساب (عربي):
                            </label>
                            <textarea
                              rows={5}
                              dir="rtl"
                              placeholder="السلام عليكم شركة برستيج... أرغب بتأكيد طلبي للحجز #{bookingCode} بكود التأكيد {confirmationCode}..."
                              value={settingsForm.bookingModule?.whatsappMessageTemplateAr || ''}
                              onChange={(e) => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    whatsappMessageTemplateAr: e.target.value
                                  }
                                });
                              }}
                              className="w-full p-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                            />
                            <span className="text-[10px] text-stone-400 block">
                              المتغيرات المتاحة: <code>{'{bookingCode}'}</code>, <code>{'{confirmationCode}'}</code>, <code>{'{guestName}'}</code>, <code>{'{hotelName}'}</code>, <code>{'{checkIn}'}</code>
                            </span>
                          </div>

                          {/* Visitor Confirmation Template (EN) */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-800 block">
                              Visitor WhatsApp Confirmation Template (English):
                            </label>
                            <textarea
                              rows={5}
                              dir="ltr"
                              placeholder="Hello Prestige Hotels... I would like to confirm my booking #{bookingCode} with confirmation code {confirmationCode}..."
                              value={settingsForm.bookingModule?.whatsappMessageTemplateEn || ''}
                              onChange={(e) => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    whatsappMessageTemplateEn: e.target.value
                                  }
                                });
                              }}
                              className="w-full p-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                            />
                            <span className="text-[10px] text-stone-400 block">
                              Available placeholders: <code>{'{bookingCode}'}</code>, <code>{'{confirmationCode}'}</code>, <code>{'{guestName}'}</code>, <code>{'{hotelName}'}</code>, <code>{'{checkIn}'}</code>
                            </span>
                          </div>
                        </div>

                        {/* Staff WhatsApp Confirmation Message Templates (AR / EN) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                          {/* Staff Confirmation to Guest Template (AR) */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-800 block">
                              قالب رد الموظف باعتماد الحجز والفاتورة للنزيل (عربي):
                            </label>
                            <textarea
                              rows={4}
                              dir="rtl"
                              placeholder="أهلاً بك ضيفنا العزيز {guestName}... تم اعتماد وتأكيد حجزك رقم #{bookingCode} بفندق {hotelName}. رابط فاتورتك وسندك الرسمي: {invoiceUrl}"
                              value={settingsForm.bookingModule?.whatsappStaffConfirmationTemplateAr || ''}
                              onChange={(e) => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    whatsappStaffConfirmationTemplateAr: e.target.value
                                  }
                                });
                              }}
                              className="w-full p-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                            />
                            <span className="text-[10px] text-stone-400 block">
                              المتغيرات المتاحة: <code>{'{bookingCode}'}</code>, <code>{'{guestName}'}</code>, <code>{'{hotelName}'}</code>, <code>{'{invoiceUrl}'}</code>
                            </span>
                          </div>

                          {/* Staff Confirmation to Guest Template (EN) */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-800 block">
                              Staff WhatsApp Confirmation & Invoice Template (English):
                            </label>
                            <textarea
                              rows={4}
                              dir="ltr"
                              placeholder="Dear {guestName}, your booking #{bookingCode} at {hotelName} is confirmed! View your official certified invoice here: {invoiceUrl}"
                              value={settingsForm.bookingModule?.whatsappStaffConfirmationTemplateEn || ''}
                              onChange={(e) => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    whatsappStaffConfirmationTemplateEn: e.target.value
                                  }
                                });
                              }}
                              className="w-full p-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                            />
                            <span className="text-[10px] text-stone-400 block">
                              Available placeholders: <code>{'{bookingCode}'}</code>, <code>{'{guestName}'}</code>, <code>{'{hotelName}'}</code>, <code>{'{invoiceUrl}'}</code>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ── INVOICE & VOUCHER CUSTOMIZATION CARD (تخصيص فواتير وسندات الحجز المعتمدة) ── */}
                      <div className="pt-6 border-t border-stone-200 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#C9A24B]" />
                            <h4 className="text-sm font-bold text-stone-900 font-cairo">
                              تخصيص بيانات فواتير وسندات الحجز الرسمية (Vouchers & Invoices)
                            </h4>
                          </div>
                          <span className="text-[11px] font-bold text-[#B38A34] bg-[#C9A24B]/10 px-3 py-1 rounded-full border border-[#C9A24B]/20 shrink-0">
                            طباعة A4 معتمدة وإمكانية الإخفاء
                          </span>
                        </div>

                        {/* Top Header Information (Name, Subtitle, Address) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              اسم الشركة الرسمي في الفاتورة:
                            </label>
                            <input
                              type="text"
                              dir="rtl"
                              placeholder="شركة برستيج لإدارة وتشغيل الفنادق"
                              value={settingsForm.bookingModule?.invoiceCompanyName ?? ''}
                              onChange={(e) => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    invoiceCompanyName: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs font-bold focus:border-[#C9A24B] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              وصف ونشاط الشركة في الفاتورة:
                            </label>
                            <input
                              type="text"
                              dir="rtl"
                              placeholder="للضيافة الفندقية وإدارة الإيواء السياحي بمكة والمدينة"
                              value={settingsForm.bookingModule?.invoiceCompanySubtitle ?? ''}
                              onChange={(e) => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    invoiceCompanySubtitle: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:border-[#C9A24B] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-stone-700 block mb-1">
                              عنوان ومقر الشركة في الفاتورة:
                            </label>
                            <input
                              type="text"
                              dir="rtl"
                              placeholder="مكة المكرمة - المملكة العربية السعودية"
                              value={settingsForm.bookingModule?.invoiceCompanyAddress ?? ''}
                              onChange={(e) => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    invoiceCompanyAddress: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:border-[#C9A24B] focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* CR Number & Tax Number with Show/Hide Toggles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* CR Number */}
                          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-stone-800">
                                رقم السجل التجاري (س.ت):
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-stone-500">
                                  {settingsForm.bookingModule?.showInvoiceCr !== false ? 'ظاهر' : 'مخفي'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = settingsForm.bookingModule?.showInvoiceCr !== false;
                                    triggerAutoSaveSettings({
                                      ...settingsForm,
                                      bookingModule: {
                                        ...settingsForm.bookingModule,
                                        showInvoiceCr: !current
                                      }
                                    });
                                  }}
                                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                                    settingsForm.bookingModule?.showInvoiceCr !== false ? 'bg-[#C9A24B]' : 'bg-stone-300'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                                    settingsForm.bookingModule?.showInvoiceCr !== false ? (document.dir === 'rtl' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                                  }`} />
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              dir="ltr"
                              placeholder="4031258941"
                              value={settingsForm.bookingModule?.invoiceCrNumber ?? ''}
                              onChange={(e) => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    invoiceCrNumber: e.target.value.trim()
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-mono font-bold text-xs text-right focus:border-[#C9A24B] focus:outline-none"
                            />
                            <p className="text-[10px] text-stone-400">
                              يمكنك تعديل رقم السجل أو النقر على المفتاح لإخفائه تماماً من الفاتورة وسند الحجز.
                            </p>
                          </div>

                          {/* Tax / VAT Number */}
                          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-stone-800">
                                الرقم الضريبي (VAT):
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-stone-500">
                                  {settingsForm.bookingModule?.showInvoiceTaxNo !== false ? 'ظاهر' : 'مخفي'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = settingsForm.bookingModule?.showInvoiceTaxNo !== false;
                                    triggerAutoSaveSettings({
                                      ...settingsForm,
                                      bookingModule: {
                                        ...settingsForm.bookingModule,
                                        showInvoiceTaxNo: !current
                                      }
                                    });
                                  }}
                                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                                    settingsForm.bookingModule?.showInvoiceTaxNo !== false ? 'bg-[#C9A24B]' : 'bg-stone-300'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                                    settingsForm.bookingModule?.showInvoiceTaxNo !== false ? (document.dir === 'rtl' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                                  }`} />
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              dir="ltr"
                              placeholder="310458921400003"
                              value={settingsForm.bookingModule?.invoiceTaxNumber ?? ''}
                              onChange={(e) => {
                                triggerAutoSaveSettings({
                                  ...settingsForm,
                                  bookingModule: {
                                    ...settingsForm.bookingModule,
                                    invoiceTaxNumber: e.target.value.trim()
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-mono font-bold text-xs text-right focus:border-[#C9A24B] focus:outline-none"
                            />
                            <p className="text-[10px] text-stone-400">
                              يمكنك تعديل الرقم الضريبي أو النقر على المفتاح لإخفائه تماماً من الفاتورة وسند الحجز.
                            </p>
                          </div>
                        </div>

                        {/* Footer Contact Details (Support Name, Phone, Email, Toggle) */}
                        <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                            <div>
                              <strong className="text-xs font-bold text-stone-900 block">
                                بيانات التواصل وخدمة العملاء في تذييل الفاتورة (أسفل الفاتورة)
                              </strong>
                              <p className="text-[11px] text-stone-500 mt-0.5">
                                إمكانية تعديل اسم المسؤول أو القسم، رقم الهاتف، والبريد الإلكتروني أو إخفاء التذييل.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-stone-500">
                                {settingsForm.bookingModule?.showInvoiceSupportFooter !== false ? 'مفعل' : 'معطل'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const current = settingsForm.bookingModule?.showInvoiceSupportFooter !== false;
                                  triggerAutoSaveSettings({
                                    ...settingsForm,
                                    bookingModule: {
                                      ...settingsForm.bookingModule,
                                      showInvoiceSupportFooter: !current
                                    }
                                  });
                                }}
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                                  settingsForm.bookingModule?.showInvoiceSupportFooter !== false ? 'bg-[#C9A24B]' : 'bg-stone-300'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                                  settingsForm.bookingModule?.showInvoiceSupportFooter !== false ? (document.dir === 'rtl' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="text-xs font-bold text-stone-700 block mb-1">
                                عنوان التذييل (الجهة):
                              </label>
                              <input
                                type="text"
                                dir="rtl"
                                placeholder="مجموعة برستيج الفندقية"
                                value={settingsForm.bookingModule?.invoiceSupportTitle ?? ''}
                                onChange={(e) => {
                                  triggerAutoSaveSettings({
                                    ...settingsForm,
                                    bookingModule: {
                                      ...settingsForm.bookingModule,
                                      invoiceSupportTitle: e.target.value
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:border-[#C9A24B] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-stone-700 block mb-1">
                                اسم المسؤول / القسم:
                              </label>
                              <input
                                type="text"
                                dir="rtl"
                                placeholder="إدارة الحجوزات والمبيعات"
                                value={settingsForm.bookingModule?.invoiceSupportName ?? ''}
                                onChange={(e) => {
                                  triggerAutoSaveSettings({
                                    ...settingsForm,
                                    bookingModule: {
                                      ...settingsForm.bookingModule,
                                      invoiceSupportName: e.target.value
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:border-[#C9A24B] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-stone-700 block mb-1">
                                رقم هاتف التواصل:
                              </label>
                              <input
                                type="tel"
                                dir="ltr"
                                placeholder="+966544076726"
                                value={settingsForm.bookingModule?.invoiceSupportPhone ?? ''}
                                onChange={(e) => {
                                  triggerAutoSaveSettings({
                                    ...settingsForm,
                                    bookingModule: {
                                      ...settingsForm.bookingModule,
                                      invoiceSupportPhone: e.target.value.trim()
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs text-right font-mono focus:border-[#C9A24B] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-stone-700 block mb-1">
                                البريد الإلكتروني للتواصل:
                              </label>
                              <input
                                type="email"
                                dir="ltr"
                                placeholder="booking@prestige-hotels.com"
                                value={settingsForm.bookingModule?.invoiceSupportEmail ?? ''}
                                onChange={(e) => {
                                  triggerAutoSaveSettings({
                                    ...settingsForm,
                                    bookingModule: {
                                      ...settingsForm.bookingModule,
                                      invoiceSupportEmail: e.target.value.trim()
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs text-right font-mono focus:border-[#C9A24B] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 2: Granular Visibility Controls for Contact Us */}
                {settingsSubTab === 'visibility' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div id="admin-contact-sections-card" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                            <Eye className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-cairo font-bold text-lg text-stone-900">
                              التحكم الدقيق في إظهار وإخفاء عناصر صفحة "تواصل معنا"
                            </h3>
                            <p className="text-xs text-stone-500">
                              إمكانية إخفاء وإظهار كل عنوان، كل بطاقة، وكل زر اتصال أو خرائط أو إرسال بشكل منفرد
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-[#B38A34] bg-[#C9A24B]/10 px-3 py-1 rounded-full border border-[#C9A24B]/20 shrink-0">
                          تحديث فوري ولحظي
                        </span>
                      </div>

                      {/* Group 1: Header Elements */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
                          <span>١. ترويسة صفحة التواصل الرئيسية</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { key: 'showBadge' as const, label: 'شارة الترحيب العلوية', desc: 'نحن في خدمتكم دائماً' },
                            { key: 'showTitle' as const, label: 'العنوان الرئيسي', desc: 'تواصل معنا واستفسر عن الحجوزات' },
                            { key: 'showSubtitle' as const, label: 'الوصف الفرعي التوضيحي', desc: 'فريق استشاريي التسكين متاح 24/7' }
                          ].map((item) => {
                            const isVisible = (settingsForm.contactSections as any)?.[item.key] !== false;
                            return (
                              <div
                                key={item.key}
                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                                  isVisible ? 'bg-white border-stone-200 shadow-2xs' : 'bg-stone-50 border-dashed border-stone-300 opacity-60'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <strong className="text-xs font-bold text-stone-900">{item.label}</strong>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cs = settingsForm.contactSections || {};
                                      const updatedCs = { ...cs, [item.key]: !isVisible };
                                      triggerAutoSaveSettings({ ...settingsForm, contactSections: updatedCs });
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                      isVisible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-200 text-stone-600'
                                    }`}
                                  >
                                    {isVisible ? <Eye className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3 text-stone-500" />}
                                    <span>{isVisible ? 'ظاهر' : 'مخفي'}</span>
                                  </button>
                                </div>
                                <p className="text-[11px] text-stone-500">{item.desc}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Group 2: Departments & Actions */}
                      <div className="space-y-3 pt-3 border-t border-stone-100">
                        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
                          <span>٢. بطاقات الأقسام المتخصصة (مبيعات / حجوزات / حسابات)</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { key: 'showDepartments' as const, label: 'قسم الأقسام ككل', desc: 'إظهار أو إخفاء حاوية الأقسام بالكامل' },
                            { key: 'showDepartmentsTitle' as const, label: 'عنوان قسم الأقسام', desc: 'الأقسام المتخصصة والتواصل المباشر' },
                            { key: 'showDepartmentsCallButton' as const, label: 'أزرار الاتصال الهاتفي', desc: 'زر الاتصال المباشر بكل قسم' },
                            { key: 'showDepartmentsWhatsAppButton' as const, label: 'أزرار محادثة واتساب', desc: 'زر واتساب السريع لكل قسم' }
                          ].map((item) => {
                            const isVisible = (settingsForm.contactSections as any)?.[item.key] !== false;
                            return (
                              <div
                                key={item.key}
                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                                  isVisible ? 'bg-white border-stone-200 shadow-2xs' : 'bg-stone-50 border-dashed border-stone-300 opacity-60'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <strong className="text-xs font-bold text-stone-900">{item.label}</strong>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cs = settingsForm.contactSections || {};
                                      const updatedCs = { ...cs, [item.key]: !isVisible };
                                      triggerAutoSaveSettings({ ...settingsForm, contactSections: updatedCs });
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                      isVisible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-200 text-stone-600'
                                    }`}
                                  >
                                    {isVisible ? <Eye className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3 text-stone-500" />}
                                    <span>{isVisible ? 'ظاهر' : 'مخفي'}</span>
                                  </button>
                                </div>
                                <p className="text-[11px] text-stone-500">{item.desc}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Group 3: WhatsApp Fast Banner */}
                      <div className="space-y-3 pt-3 border-t border-stone-100">
                        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
                          <span>٣. شريط الواتساب السريع المباشر (24/7)</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { key: 'showWaBanner' as const, label: 'شريط الواتساب ككل', desc: 'إظهار أو إخفاء البانر كاملاً' },
                            { key: 'showWaBannerTitle' as const, label: 'عنوان شريط الواتساب', desc: 'خدمة العملاء السريعة عبر واتساب' },
                            { key: 'showWaBannerDesc' as const, label: 'النص والوصف التوضيحي', desc: 'استفسارات تسكين وحجوزات فورية' },
                            { key: 'showWaBannerButton' as const, label: 'زر بدء المحادثة', desc: 'زر فتح دردشة واتساب الفورية' }
                          ].map((item) => {
                            const isVisible = (settingsForm.contactSections as any)?.[item.key] !== false;
                            return (
                              <div
                                key={item.key}
                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                                  isVisible ? 'bg-white border-stone-200 shadow-2xs' : 'bg-stone-50 border-dashed border-stone-300 opacity-60'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <strong className="text-xs font-bold text-stone-900">{item.label}</strong>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cs = settingsForm.contactSections || {};
                                      const updatedCs = { ...cs, [item.key]: !isVisible };
                                      triggerAutoSaveSettings({ ...settingsForm, contactSections: updatedCs });
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                      isVisible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-200 text-stone-600'
                                    }`}
                                  >
                                    {isVisible ? <Eye className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3 text-stone-500" />}
                                    <span>{isVisible ? 'ظاهر' : 'مخفي'}</span>
                                  </button>
                                </div>
                                <p className="text-[11px] text-stone-500">{item.desc}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Group 4: Channels & Branches */}
                      <div className="space-y-3 pt-3 border-t border-stone-100">
                        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
                          <span>٤. قنوات الاتصال المعتمدة والمكاتب الميدانية والفروع</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { key: 'showChannels' as const, label: 'قسم القنوات ككل', desc: 'هواتف، بريد، ومنصات التواصل' },
                            { key: 'showChannelsTitle' as const, label: 'عنوان قنوات الاتصال', desc: 'قنوات التواصل المعتمدة' },
                            { key: 'showBranches' as const, label: 'قسم الفروع ككل', desc: 'فروع مكة المكرمة والمدينة المنورة' },
                            { key: 'showBranchesTitle' as const, label: 'عنوان قسم الفروع', desc: 'المكاتب الميدانية والفروع' },
                            { key: 'showBranchesMapButton' as const, label: 'زر خرائط Google', desc: 'زر فتح لوكيشن الفرع على الخريطة' },
                            { key: 'showBranchesPhoneButton' as const, label: 'زر هاتف الفرع', desc: 'زر الاتصال المباشر بالفرع' },
                            { key: 'showBranchesWhatsAppButton' as const, label: 'زر واتساب الفرع', desc: 'زر محادثة واتساب الخاص بالفرع' },
                            { key: 'showBranchesFooterInfo' as const, label: 'أوقات العمل والمعلومات', desc: 'ساعات الدوام والبريد في الفرع' }
                          ].map((item) => {
                            const isVisible = (settingsForm.contactSections as any)?.[item.key] !== false;
                            return (
                              <div
                                key={item.key}
                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                                  isVisible ? 'bg-white border-stone-200 shadow-2xs' : 'bg-stone-50 border-dashed border-stone-300 opacity-60'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <strong className="text-xs font-bold text-stone-900">{item.label}</strong>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cs = settingsForm.contactSections || {};
                                      const updatedCs = { ...cs, [item.key]: !isVisible };
                                      triggerAutoSaveSettings({ ...settingsForm, contactSections: updatedCs });
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                      isVisible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-200 text-stone-600'
                                    }`}
                                  >
                                    {isVisible ? <Eye className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3 text-stone-500" />}
                                    <span>{isVisible ? 'ظاهر' : 'مخفي'}</span>
                                  </button>
                                </div>
                                <p className="text-[11px] text-stone-500">{item.desc}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Group 5: Inquiry Form */}
                      <div className="space-y-3 pt-3 border-t border-stone-100">
                        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
                          <span>٥. نموذج إرسال الاستفسار والرسالة</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { key: 'showContactForm' as const, label: 'نموذج التواصل ككل', desc: 'إظهار أو إخفاء استمارة المراسلة' },
                            { key: 'showContactFormHeader' as const, label: 'ترويسة وعنوان النموذج', desc: 'أرسل لنا استفسارك وسنعاود الاتصال' },
                            { key: 'showContactFormSubmitButton' as const, label: 'زر إرسال الرسالة', desc: 'زر إتمام وإرسال الاستمارة' }
                          ].map((item) => {
                            const isVisible = (settingsForm.contactSections as any)?.[item.key] !== false;
                            return (
                              <div
                                key={item.key}
                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                                  isVisible ? 'bg-white border-stone-200 shadow-2xs' : 'bg-stone-50 border-dashed border-stone-300 opacity-60'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <strong className="text-xs font-bold text-stone-900">{item.label}</strong>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cs = settingsForm.contactSections || {};
                                      const updatedCs = { ...cs, [item.key]: !isVisible };
                                      triggerAutoSaveSettings({ ...settingsForm, contactSections: updatedCs });
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                      isVisible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-200 text-stone-600'
                                    }`}
                                  >
                                    {isVisible ? <Eye className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3 text-stone-500" />}
                                    <span>{isVisible ? 'ظاهر' : 'مخفي'}</span>
                                  </button>
                                </div>
                                <p className="text-[11px] text-stone-500">{item.desc}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 3: Channels, Branches & Department Contacts Data */}
                {settingsSubTab === 'contact-data' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Contact Channels Manager Card */}
                    <div id="admin-channels-manager-card" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                      <AdminChannelsManager
                        channels={settingsForm.channels || []}
                        onChange={handleChannelsChange}
                        onShowToast={onShowToast}
                      />
                    </div>

                    {/* Branches & Google Maps Links Manager Card */}
                    <div id="admin-branches-manager-card" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                      <AdminBranchesManager
                        branches={settingsForm.branches || []}
                        onChange={handleBranchesChange}
                        onShowToast={onShowToast}
                      />
                    </div>

                    {/* Specialized Department Contacts (مبيعات / حجوزات / حسابات) */}
                    <div id="admin-department-contacts-manager-card" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                      <AdminDepartmentContactsManager
                        contacts={settingsForm.departmentContacts || []}
                        onChange={handleDepartmentContactsChange}
                        onShowToast={onShowToast}
                      />
                    </div>
                  </div>
                )}

                {/* Sub-Tab 4: Hotel Detail Texts & Quick Links */}
                {settingsSubTab === 'hotel-detail' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Hotel Detail Page Custom Texts (الفنادق المقترحة والخيارات الإضافية) */}
                    <div id="admin-hotel-detail-texts-card" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-cairo font-bold text-lg text-stone-900">
                              نصوص وعناوين صفحة الفندق (قسم الفنادق المقترحة)
                            </h3>
                            <p className="text-xs text-stone-500">
                              التحكم في عنوان وشارة قسم "فنادق أخرى مميزة في مكة المكرمة / المدينة المنورة" الذي يظهر أسفل صفحة الفندق
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1.5">
                            الشارة العلوية (Badge):
                          </label>
                          <input
                            type="text"
                            value={settingsForm.similarHotelsBadge || ''}
                            onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, similarHotelsBadge: e.target.value })}
                            placeholder="خيارات إضافية"
                            className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1.5 flex items-center justify-between">
                            <span>العنوان الرئيسي المقترح:</span>
                            <span className="text-[11px] text-[#B38A34] font-normal">استخدم {'{city}'} لاسم المدينة تلقائياً</span>
                          </label>
                          <input
                            type="text"
                            value={settingsForm.similarHotelsTitle || ''}
                            onChange={(e) => triggerAutoSaveSettings({ ...settingsForm, similarHotelsTitle: e.target.value })}
                            placeholder="فنادق أخرى مميزة في {city}"
                            className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm font-bold focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Links Manager Card (روابط سريعة في الفوتر) */}
                    <div id="admin-quick-links-manager-card" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                      <AdminQuickLinksManager
                        links={settingsForm.quickLinks || []}
                        onChange={handleQuickLinksChange}
                        onShowToast={onShowToast}
                      />
                    </div>
                  </div>
                )}

                {/* Sub-Tab 5: Supabase Database Connection & Migration */}
                {settingsSubTab === 'database' && (
                  <div className="animate-fadeIn">
                    <div id="admin-supabase-manager-card" className="bg-white rounded-3xl border border-[#C9A24B]/40 p-6 sm:p-8 shadow-md space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                            <Database className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-xl font-cairo font-bold text-stone-900">ربط قاعدة بيانات سوبا بيز (Supabase)</h2>
                              {isSupabaseConfigured() ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>مفعل ومتصل</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  بانتظار إدخال المفاتيح
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">
                              تخزين واسترجاع بيانات الفنادق، العروض، الرسائل، والمستخدمين مباشرة وسحابياً عبر Supabase PostgreSQL
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowSqlSchemaModal(true)}
                          className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-[#C9A24B] text-stone-800 hover:text-white font-bold text-xs transition-colors flex items-center gap-2 shrink-0 border border-stone-300 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>عرض ونسخ سكريبت SQL</span>
                        </button>
                      </div>

                      {/* Supabase Test Result Banner */}
                      {supabaseTestResult && (
                        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${
                          supabaseTestResult.success 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                            : 'bg-red-50 border-red-300 text-red-800'
                        }`}>
                          {supabaseTestResult.success ? (
                            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
                          )}
                          <span>{supabaseTestResult.message}</span>
                        </div>
                      )}

                      {/* Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-[#B38A34]" />
                            <span>رابط مشروع سوبا بيز (Supabase Project URL):</span>
                          </label>
                          <input
                            type="url"
                            value={supabaseUrl}
                            onChange={(e) => setSupabaseUrl(e.target.value)}
                            placeholder="https://your-project-id.supabase.co"
                            className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs font-mono focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors dir-ltr"
                          />
                          <span className="text-[11px] text-stone-400 block">من إعدادات Project Settings {'>'} API في لوحة Supabase</span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-[#B38A34]" />
                            <span>مفتاح الوصول العام (Anon / Public Key):</span>
                          </label>
                          <input
                            type="password"
                            value={supabaseAnonKey}
                            onChange={(e) => setSupabaseAnonKey(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs font-mono focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors dir-ltr"
                          />
                          <span className="text-[11px] text-stone-400 block">مفتاح anon public للوصول الآمن والعمليات الفورية</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                        <div className="text-xs text-stone-500">
                          💡 في حال لم تكن المفاتيح مدخلة، يعمل النظام تلقائياً عبر التخزين المحلي والفايرستور البديل دون أي انقطاع.
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleTestSupabase}
                            disabled={testingSupabase || !supabaseUrl || !supabaseAnonKey}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {testingSupabase ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>جاري الاختبار...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>اختبار الاتصال المباشر</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveSupabaseConfig}
                            className="px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>حفظ الإعدادات</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 8: SEO & Google SERP Preview Settings */}
                {settingsSubTab === 'seo' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                      <div>
                        <h4 className="font-cairo font-bold text-base text-stone-900">
                          إعدادات محركات البحث العامة للموقع (Site-wide SEO & Google SERP)
                        </h4>
                        <p className="text-xs text-stone-500">
                          تخصيص عنوان ووصف الصفحة الرئيسية وكلمات البحث المستهدفة لرحلات الحج والعمرة
                        </p>
                      </div>
                    </div>

                    <AdminSEOEditor
                      values={{
                        titleAr: settingsForm.metaTitle || settingsForm.siteTitle || 'برستيج لإدارة وتشغيل الفنادق | حجز فنادق مكة والمدينة وعروض الشركات',
                        titleEn: settingsForm.metaTitleEn || settingsForm.siteTitleEn || 'Prestige Hotels Management | Luxury Hotel Booking & Operations in Makkah & Madinah',
                        descriptionAr: settingsForm.metaDescription || settingsForm.footerBio || 'شركة برستيج الرائدة في إدارة وتشغيل الفنادق في مكة المكرمة والمدينة المنورة. أفضل عروض حجز فنادق مكة للشركات والمجموعات، فندق برستيج أجياد، خدمات إعاشة ونقل فاخر.',
                        descriptionEn: settingsForm.metaDescriptionEn || settingsForm.footerBioEn || 'Prestige Hotels Management: premier hotel management and direct bookings for Makkah & Madinah hotels overlooking the Holy Mosques. Exclusive group and corporate contracts.',
                        keywords: settingsForm.metaKeywords || 'فنادق مكة, فنادق المدينة المنورة, حجز فنادق العمرة, شركة برستيج لإدارة الفنادق',
                        slug: ''
                      }}
                      onChange={(seo) => {
                        const updated = {
                          ...settingsForm,
                          metaTitle: seo.titleAr,
                          metaTitleEn: seo.titleEn,
                          metaDescription: seo.descriptionAr,
                          metaDescriptionEn: seo.descriptionEn,
                          metaKeywords: seo.keywords
                        };
                        triggerAutoSaveSettings(updated);
                      }}
                      pagePathPrefix=""
                      defaultTitleAr="برستيج لإدارة وتشغيل الفنادق | حجز فنادق مكة والمدينة وعروض الشركات"
                      defaultTitleEn="Prestige Hotels Management | Luxury Hotel Booking & Operations in Makkah & Madinah"
                      defaultDescAr="شركة برستيج الرائدة في إدارة وتشغيل الفنادق في مكة المكرمة والمدينة المنورة. أفضل عروض حجز فنادق مكة للشركات والمجموعات، فندق برستيج أجياد، خدمات إعاشة ونقل فاخر."
                      defaultDescEn="Prestige Hotels Management: premier hotel management and direct bookings for Makkah & Madinah hotels overlooking the Holy Mosques."
                    />
                  </div>
                )}
              </div>
            )}

            {/* 6. AUDIT LOG TAB */}
            {activeTab === 'audit-log' && (
              <div id="admin-audit-log-section">
                <AuditLogViewer
                  logs={auditLogs}
                  auditLogs={auditLogs}
                  users={adminUsers}
                  onRefresh={loadAuditLogs}
                  onShowToast={onShowToast}
                />
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div 
          id="admin-delete-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-cairo font-bold text-xl text-stone-900 text-center mb-2">تأكيد الحذف النهائي</h3>
            <p className="text-xs sm:text-sm text-stone-600 text-center leading-relaxed mb-6">
              هل أنت متأكد من رغبتك في حذف <strong className="text-stone-900">"{deleteModal.title}"</strong>؟ لا يمكن التراجع عن هذا الإجراء وسيتم إزالته فوراً.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExecuteDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                نعم، احذف الآن
              </button>
              <button
                onClick={() => setDeleteModal({ isOpen: false, type: 'hotel', id: '', title: '' })}
                className="flex-1 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotel Multi-Step Add/Edit Modal (NO PRICES) */}
      {isHotelModalOpen && (
        <div 
          id="admin-hotel-multistep-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full shadow-2xl my-8 overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-stone-200 bg-stone-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-cairo font-bold text-xl text-stone-900">
                  {editingHotelId ? 'تعديل بيانات الفندق' : 'إضافة فندق جديد إلى القائمة'}
                </h3>
                <button
                  onClick={() => setIsHotelModalOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { step: 1 as const, title: '١. البيانات والحي' },
                  { step: 2 as const, title: '٢. الصور والفيديو' },
                  { step: 3 as const, title: '٣. المرافق والوصف' },
                  { step: 4 as const, title: '٤. روابط الحجز والخرائط' },
                  { step: 5 as const, title: '٥. إعدادات SEO وجوجل' }
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setHotelFormStep(s.step)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                      hotelFormStep === s.step
                        ? 'bg-[#C9A24B] text-white shadow-xs'
                        : hotelFormStep > s.step
                        ? 'bg-[#C9A24B]/15 text-[#B38A34] border border-[#C9A24B]/30'
                        : 'bg-stone-100 text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* STEP 1: Basic Info & District */}
              {hotelFormStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">اسم الفندق باللغة العربية: *</label>
                    <input
                      type="text"
                      required
                      value={hotelForm.name}
                      onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                      placeholder="مثال: فندق برج الساعة فيرمونت مكة"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">اسم الفندق بالإنجليزية (اختياري):</label>
                    <input
                      type="text"
                      value={hotelForm.nameEn || ''}
                      onChange={(e) => setHotelForm({ ...hotelForm, nameEn: e.target.value })}
                      placeholder="e.g. Fairmont Makkah Clock Royal Tower"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">المدينة:</label>
                      <select
                        value={hotelForm.city}
                        onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value as any })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                      >
                        <option value="مكة المكرمة">مكة المكرمة</option>
                        <option value="المدينة المنورة">المدينة المنورة</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-stone-700">الحي / المنطقة: *</label>
                        <button
                          type="button"
                          onClick={() => setCustomDistrictInput(!customDistrictInput)}
                          className="text-[11px] text-[#B38A34] hover:underline font-semibold"
                        >
                          {customDistrictInput ? 'اختيار من القائمة' : '+ حي جديد / مخصص'}
                        </button>
                      </div>

                      {customDistrictInput ? (
                        <input
                          type="text"
                          required
                          value={hotelForm.district || ''}
                          onChange={(e) => setHotelForm({ ...hotelForm, district: e.target.value })}
                          placeholder="أجياد، المنطقة المركزية، العزيزية، الشبيكة..."
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                        />
                      ) : (
                        <select
                          value={hotelForm.district || ''}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setCustomDistrictInput(true);
                              setHotelForm({ ...hotelForm, district: '' });
                            } else {
                              setHotelForm({ ...hotelForm, district: e.target.value });
                            }
                          }}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                        >
                          <option value="">-- اختر الحي المرتبط --</option>
                          {districts
                            .filter(d => d.city === hotelForm.city)
                            .map((d, dIdx) => (
                              <option key={d.id || `district-${d.name}-${dIdx}`} value={d.name}>
                                حي {d.name} {d.distanceRange ? `(${d.distanceRange})` : ''}
                              </option>
                            ))}
                          {/* If current hotel's district is not in the list */}
                          {hotelForm.district && !districts.some(d => d.name === hotelForm.district && d.city === hotelForm.city) && (
                            <option value={hotelForm.district}>
                              حي {hotelForm.district} (الحالي)
                            </option>
                          )}
                          <option value="__custom__">+ كتابة حي آخر...</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Stars, Custom Classification & View Type Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">تصنيف النجوم:</label>
                      <select
                        value={hotelForm.stars}
                        onChange={(e) => setHotelForm({ ...hotelForm, stars: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ 5 نجوم (فاخر ملكي)</option>
                        <option value={4}>⭐⭐⭐⭐ 4 نجوم (ديلوكس)</option>
                        <option value={3}>⭐⭐⭐ 3 نجوم (اقتصادي)</option>
                        <option value={2}>⭐⭐ نجمتان (سياحي)</option>
                        <option value={1}>⭐ نجمة واحدة</option>
                        <option value={0}>بدون نجوم (تصنيف مخصص)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        لقب أو تصنيف مخصص (اختياري):
                      </label>
                      <input
                        type="text"
                        value={hotelForm.customClassification || ''}
                        onChange={(e) => setHotelForm({ ...hotelForm, customClassification: e.target.value })}
                        placeholder="مثال: شقق فندقية فاخرة، أجنحة ملكية"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">نوع الإطلالة: *</label>
                      <select
                        value={hotelForm.viewType || hotelForm.location?.viewType || 'إطلالة حرم'}
                        onChange={(e) => {
                          const newView = e.target.value as any;
                          const currentDist = parseDistanceInput(distanceInputStr);
                          // When "إطلالة على المدينة" is chosen or distance is far, auto-switch to bus
                          const autoBus = newView === 'إطلالة على المدينة' || currentDist >= 1000;
                          const newTransport = autoBus ? 'bus' : (hotelForm.transportType || 'walking');
                          setHotelForm(prev => ({
                            ...prev,
                            viewType: newView,
                            transportType: newTransport,
                            location: { ...prev.location, viewType: newView, transportType: newTransport }
                          }));
                        }}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-bold focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                      >
                        {HOTEL_VIEW_OPTIONS.map((opt, optIdx) => (
                          <option key={`${opt.value}-${optIdx}`} value={opt.value}>
                            {opt.label} ({opt.desc})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Smart Distance & Transportation Card */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <span>المسافة ووسيلة النقل إلى الحرم</span>
                          <span className="text-[10px] text-[#B38A34] font-medium bg-[#C9A24B]/10 px-2 py-0.5 rounded-full">
                            حساب ذكي وتلقائي
                          </span>
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          يمكنك كتابة 1.5 ويفهم النظام تلقائياً أنها 1500 متر، أو كتابة 350 مباشرة.
                        </p>
                      </div>

                      {/* Transportation Mode Toggle */}
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setHotelForm(prev => ({
                              ...prev,
                              transportType: 'walking',
                              location: { ...prev.location, transportType: 'walking' }
                            }));
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            hotelForm.transportType !== 'bus'
                              ? 'bg-[#C9A24B] text-white shadow-xs'
                              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                          }`}
                        >
                          <Footprints className="w-3.5 h-3.5" />
                          <span>مشياً على الأقدام</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setHotelForm(prev => ({
                              ...prev,
                              transportType: 'bus',
                              location: { ...prev.location, transportType: 'bus' }
                            }));
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            hotelForm.transportType === 'bus'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                          }`}
                        >
                          <Bus className="w-3.5 h-3.5" />
                          <span>حافلة / باص ترددي</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-stone-700">المسافة إلى ساحة الحرم:</label>
                          <span className="text-[11px] font-bold text-[#B38A34] bg-white px-2 py-0.5 rounded-md border border-stone-200">
                            {formatDistanceDisplay(parseDistanceInput(distanceInputStr), 'ar')}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={distanceInputStr}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDistanceInputStr(val);
                            const parsed = parseDistanceInput(val);
                            const currentView = hotelForm.viewType || hotelForm.location?.viewType || 'إطلالة حرم';
                            const autoBus = parsed >= 1000 || currentView === 'إطلالة على المدينة';
                            const newTransport = autoBus ? 'bus' : (hotelForm.transportType || 'walking');
                            setHotelForm(prev => ({
                              ...prev,
                              distanceToHaram: parsed,
                              transportType: newTransport,
                              location: { ...prev.location, transportType: newTransport }
                            }));
                          }}
                          placeholder="مثال: 1.5 أو 350 أو 2"
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                        />
                        <div className="flex items-center justify-between mt-1 text-[11px] text-stone-500">
                          <span>القيمة بالأمتار: {parseDistanceInput(distanceInputStr).toLocaleString('ar-SA')} م</span>
                          {parseDistanceInput(distanceInputStr) >= 1000 && (
                            <span className="text-amber-700 font-semibold flex items-center gap-1">
                              <Bus className="w-3 h-3 text-amber-600" />
                              حافلة مفعلة للمسافة
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-1">
                          {hotelForm.transportType === 'bus' ? (
                            <>
                              <Bus className="w-3.5 h-3.5 text-amber-600" />
                              <span>وقت الوصول بالحافلة (دقائق):</span>
                            </>
                          ) : (
                            <>
                              <Footprints className="w-3.5 h-3.5 text-[#B38A34]" />
                              <span>وقت المشي (دقائق):</span>
                            </>
                          )}
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={hotelForm.walkingTimeMinutes || 2}
                          onChange={(e) => setHotelForm({ ...hotelForm, walkingTimeMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                        />
                        <p className="text-[11px] text-stone-500 mt-1">
                          {hotelForm.transportType === 'bus'
                            ? 'نقل ترددي مباشر بالحافلات إلى ساحات الحرم 24/7.'
                            : 'الوقت المقدر للمشي على الأقدام حتى ساحات الحرم الشريف.'}
                        </p>
                      </div>
                    </div>

                    {/* Show/Hide Distance Badge on Hotel Card */}
                    <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-4">
                      <div>
                        <strong className="text-xs font-bold text-stone-900 block mb-0.5">
                          إظهار شارة المسافة والوقت على صورة الفندق ({hotelForm.transportType === 'bus' ? 'باص الحرم' : 'دقائق سيراً للحرم'})
                        </strong>
                        <p className="text-[11px] text-stone-500">
                          عند إخفائها، لن تظهر شارة (دقائق سيراً للحرم) على صورة الفندق في بطاقات الموقع.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setHotelForm(prev => ({ ...prev, showDistanceBadge: prev.showDistanceBadge === false ? true : false }))}
                        className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                          hotelForm.showDistanceBadge !== false ? 'bg-[#C9A24B] justify-end' : 'bg-stone-300 justify-start'
                        }`}
                        title={hotelForm.showDistanceBadge !== false ? 'الشارة معروضة للزوار' : 'الشارة مخفية'}
                      >
                        <div className="w-6 h-6 rounded-full bg-white shadow-md" />
                      </button>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                    {(() => {
                      const formCategories = Array.isArray(hotelForm.categories) 
                        ? hotelForm.categories 
                        : (typeof hotelForm.categories === 'string' ? (hotelForm.categories as string).split(',').map(s => s.trim()).filter(Boolean) : []);

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-stone-800 block">
                              نوع الفندق وتصنيفات المواسم (عمرة، رمضان، سنوي، حج، أو مخصص):
                            </label>
                            <span className="text-[11px] text-stone-500 font-medium">
                              {formCategories.length} تصنيف مختار
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {ALL_HOTEL_CATEGORIES.map((cat, catIdx) => {
                              const isChecked = formCategories.includes(cat);
                              return (
                                <div
                                  key={`${cat || 'cat'}-${catIdx}`}
                                  onClick={() => toggleFormCategory(cat)}
                                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-[#C9A24B]/15 border-[#C9A24B] text-[#B38A34]'
                                      : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly
                                    className="w-4 h-4 rounded text-[#C9A24B] accent-[#C9A24B]"
                                  />
                                  <span className="select-none text-xs">{cat}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Custom Categories Chips if any exist */}
                          {formCategories.filter(c => !ALL_HOTEL_CATEGORIES.includes(c as any)).length > 0 && (
                            <div className="pt-2">
                              <span className="text-[11px] font-bold text-stone-600 block mb-1.5">تصنيفات مخصصة إضافية:</span>
                              <div className="flex flex-wrap gap-2">
                                {formCategories.filter(c => !ALL_HOTEL_CATEGORIES.includes(c as any)).map((customCat, cIdx) => (
                                  <span
                                    key={`${customCat}-${cIdx}`}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#C9A24B]/15 border border-[#C9A24B]/30 text-xs font-bold text-[#B38A34]"
                                  >
                                    <span>{customCat}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCategory(customCat)}
                                      className="w-4 h-4 rounded-full hover:bg-[#C9A24B]/30 flex items-center justify-center text-stone-600 hover:text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Add Custom Category Input */}
                    <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
                      <input
                        type="text"
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomCategory();
                          }
                        }}
                        placeholder="إضافة نوع أو موسم جديد (مثال: فنادق الحج، باقات الشتاء)..."
                        className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className="px-3 py-1.5 bg-[#C9A24B] hover:bg-[#B38A34] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة تصنيف</span>
                      </button>
                    </div>
                  </div>

                  {/* Master Card Display & Visibility Controls */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-stone-50 to-stone-100 border border-[#C9A24B]/40 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#C9A24B]/20 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                          <Eye className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                            التحكم في إظهار وإخفاء عناصر بطاقة الفندق للزوار
                          </h4>
                          <p className="text-[11px] text-stone-500">
                            تحكم كامل في كل عنصر يظهر أو يختفي للزوار على بطاقة الفندق في الموقع
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#B38A34] bg-[#C9A24B]/10 px-2.5 py-1 rounded-full border border-[#C9A24B]/20">
                        تحكم فوري
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* 1. Distance & Walking Time Badge */}
                      <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <Footprints className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-800 block truncate">
                              مدة المشي والمسافة للحرم
                            </span>
                            <span className="text-[10px] text-stone-400 block truncate">
                              {hotelForm.showDistanceBadge !== false ? 'ظاهرة على صورة الفندق' : 'مخفية عن الزوار'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHotelForm(prev => ({ ...prev, showDistanceBadge: prev.showDistanceBadge === false ? true : false }))}
                          className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                            hotelForm.showDistanceBadge !== false ? 'bg-[#C9A24B] justify-end' : 'bg-stone-300 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      {/* 2. Hotel Stars Rating */}
                      <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#B38A34] flex items-center justify-center shrink-0">
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-800 block truncate">
                              تصنيف النجوم
                            </span>
                            <span className="text-[10px] text-stone-400 block truncate">
                              {hotelForm.showStars !== false ? 'النجوم الذهبية ظاهرة' : 'النجوم مخفية'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHotelForm(prev => ({ ...prev, showStars: prev.showStars === false ? true : false }))}
                          className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                            hotelForm.showStars !== false ? 'bg-[#C9A24B] justify-end' : 'bg-stone-300 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      {/* 3. Hotel Categories (عمرة / رمضان / سنوي / حج) */}
                      <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-800 block truncate">
                              نوع وتصنيف الفندق (رمضان/عمرة/حج)
                            </span>
                            <span className="text-[10px] text-stone-400 block truncate">
                              {hotelForm.showCategories !== false ? 'شارات المواسم ظاهرة' : 'شارات المواسم مخفية'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHotelForm(prev => ({ ...prev, showCategories: prev.showCategories === false ? true : false }))}
                          className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                            hotelForm.showCategories !== false ? 'bg-[#C9A24B] justify-end' : 'bg-stone-300 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      {/* 4. Guest Rating & Reviews */}
                      <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-800 block truncate">
                              تقييم النزلاء والمراجعات
                            </span>
                            <span className="text-[10px] text-stone-400 block truncate">
                              {hotelForm.showRating !== false ? 'رقم التقييم ظاهر' : 'التقييم مخفي'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHotelForm(prev => ({ ...prev, showRating: prev.showRating === false ? true : false }))}
                          className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                            hotelForm.showRating !== false ? 'bg-[#C9A24B] justify-end' : 'bg-stone-300 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      {/* 5. District & Neighborhood */}
                      <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-800 block truncate">
                              اسم الحي والمنطقة
                            </span>
                            <span className="text-[10px] text-stone-400 block truncate">
                              {hotelForm.showDistrict !== false ? 'شارة الحي ظاهرة' : 'شارة الحي مخفية'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHotelForm(prev => ({ ...prev, showDistrict: prev.showDistrict === false ? true : false }))}
                          className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                            hotelForm.showDistrict !== false ? 'bg-[#C9A24B] justify-end' : 'bg-stone-300 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      {/* 6. Active / Hidden Full Hotel */}
                      <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-800 block truncate">
                              ظهور الفندق ككل بالموقع
                            </span>
                            <span className="text-[10px] text-stone-400 block truncate">
                              {hotelForm.isActive !== false ? 'الفندق متاح للزوار' : 'الفندق مخفي ومعطل'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHotelForm(prev => ({ ...prev, isActive: prev.isActive === false ? true : false }))}
                          className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                            hotelForm.isActive !== false ? 'bg-emerald-600 justify-end' : 'bg-stone-300 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Featured Toggle */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4">
                    <div>
                      <strong className="text-xs font-bold text-stone-900 block mb-1">
                        تثبيت في شريط الفنادق المميزة بالصفحة الرئيسية
                      </strong>
                      <p className="text-[11px] text-stone-500">
                        يظهر الفندق في البار الدوار المتميز أعلى الرئيسية.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHotelForm(prev => ({ ...prev, featured: !prev.featured }))}
                      className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                        hotelForm.featured ? 'bg-[#C9A24B] justify-end' : 'bg-stone-300 justify-start'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  {/* Display Order (ترتيب الظهور) */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4">
                    <div>
                      <strong className="text-xs font-bold text-stone-900 block mb-1">
                        ترتيب ظهور الفندق في الموقع
                      </strong>
                      <p className="text-[11px] text-stone-500">
                        الرقم الأصغر يظهر أولاً بالموقع وقائمة الفنادق (1 ثم 2 ثم 3...).
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500 font-bold">رقم:</span>
                      <input
                        type="number"
                        min={1}
                        value={hotelForm.order ?? 1}
                        onChange={(e) => setHotelForm(prev => ({ ...prev, order: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-20 px-3 py-2 bg-white border border-stone-300 rounded-xl text-center font-mono font-bold text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Media & Album Manager */}
              {hotelFormStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <HotelMediaAlbumManager
                    mainImage={hotelForm.mainImage}
                    galleryImages={hotelForm.galleryImages || []}
                    videoUrl={hotelForm.videoUrl || ''}
                    additionalVideos={hotelForm.additionalVideos || []}
                    onChange={(data) => {
                      setHotelForm((prev) => ({
                        ...prev,
                        mainImage: data.mainImage,
                        galleryImages: data.galleryImages,
                        videoUrl: data.videoUrl,
                        additionalVideos: data.additionalVideos
                      }));
                    }}
                    onShowToast={onShowToast}
                  />
                </div>
              )}

              {/* STEP 3: Amenities, Overview & SEO */}
              {hotelFormStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">المرافق والخدمات:</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newAmenityInput}
                        onChange={(e) => setNewAmenityInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAmenity(); } }}
                        placeholder="أدخل مرفق جديد مثل: بوفيه مفتوح، خدمة نقل..."
                        className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                      />
                      <button
                        type="button"
                        onClick={handleAddAmenity}
                        className="px-4 py-2 rounded-xl bg-[#C9A24B] text-white text-xs font-bold"
                      >
                        إضافة
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {hotelForm.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-medium border border-stone-200 flex items-center gap-1.5"
                        >
                          <span>{amenity}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenity(amenity)}
                            className="text-stone-400 hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">نبذة عامة مختصرة:</label>
                    <textarea
                      rows={2}
                      value={hotelForm.overview}
                      onChange={(e) => setHotelForm({ ...hotelForm, overview: e.target.value })}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">الوصف التفصيلي الكامل:</label>
                    <textarea
                      rows={4}
                      value={hotelForm.detailedDescription}
                      onChange={(e) => setHotelForm({ ...hotelForm, detailedDescription: e.target.value })}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Booking Links & Platforms */}
              {hotelFormStep === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-3.5 rounded-2xl bg-[#C9A24B]/10 border border-[#C9A24B]/20 text-xs text-stone-800 leading-relaxed">
                    💡 <strong>روابط الحجز ومنصات الاتصال والخرائط:</strong> تحكم في إمكانية حجز الغرف أونلاين، وروابط الحجز الخارجية، وموقع الخريطة، وقنوات التواصل المباشرة (واتساب وإيميل) مع إمكانية <strong>تفعيل أو إخفاء أي منها</strong> بضغطة زر.
                  </div>

                  {/* 0. Direct Online Room Booking Switch */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-xs font-bold text-stone-900 block">
                          نظام حجز الغرف المباشر أونلاين (Online Direct Booking)
                        </strong>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          hotelForm.onlineBookingEnabled !== false ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {hotelForm.onlineBookingEnabled !== false ? 'مفعّل (حجز غرف إلكتروني)' : 'معطّل (حجز مباشر عبر واتساب فقط)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        عند التعطيل، يتحول زر الحجز للزوار إلى محادثة واتساب مجهزة بكافة تفاصيل الفندق دون فتح بوابة الحجز الإلكتروني أو فورم الرسائل.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHotelForm(prev => ({ ...prev, onlineBookingEnabled: prev.onlineBookingEnabled === false ? true : false }))}
                      className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer shrink-0 ${
                        hotelForm.onlineBookingEnabled !== false ? 'bg-[#C9A24B] justify-end' : 'bg-stone-300 justify-start'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {/* 1. Booking.com */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      hotelForm.showBookingUrl !== false 
                        ? 'bg-white border-stone-200 shadow-2xs' 
                        : 'bg-stone-50/70 border-stone-200/60 opacity-80'
                    }`}>
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#003580] text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <BookingComIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-cairo font-bold text-xs sm:text-sm text-stone-900 block">
                              Booking.com (رابط الحجز)
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              منصة بوكينج العالمية للحجوزات الفندقية
                            </span>
                          </div>
                        </div>

                        {/* Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setHotelForm(prev => ({ ...prev, showBookingUrl: prev.showBookingUrl === false }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            hotelForm.showBookingUrl !== false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300 border border-stone-300'
                          }`}
                        >
                          {hotelForm.showBookingUrl !== false ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>مفعّل (ظاهر)</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                              <span>مخفي</span>
                            </>
                          )}
                        </button>
                      </div>

                      <input
                        type="url"
                        value={hotelForm.bookingUrl || ''}
                        onChange={(e) => setHotelForm({ ...hotelForm, bookingUrl: e.target.value })}
                        placeholder="https://www.booking.com/hotel/sa/..."
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                      />
                    </div>

                    {/* 2. Agoda */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      hotelForm.showAgodaUrl !== false 
                        ? 'bg-white border-stone-200 shadow-2xs' 
                        : 'bg-stone-50/70 border-stone-200/60 opacity-80'
                    }`}>
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#5856D6] text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <AgodaIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-cairo font-bold text-xs sm:text-sm text-stone-900 block">
                              Agoda (رابط الحجز)
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              منصة أجودا لعروض وحجوزات الفنادق
                            </span>
                          </div>
                        </div>

                        {/* Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setHotelForm(prev => ({ ...prev, showAgodaUrl: prev.showAgodaUrl === false }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            hotelForm.showAgodaUrl !== false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300 border border-stone-300'
                          }`}
                        >
                          {hotelForm.showAgodaUrl !== false ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>مفعّل (ظاهر)</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                              <span>مخفي</span>
                            </>
                          )}
                        </button>
                      </div>

                      <input
                        type="url"
                        value={hotelForm.agodaUrl || ''}
                        onChange={(e) => setHotelForm({ ...hotelForm, agodaUrl: e.target.value })}
                        placeholder="https://www.agoda.com/..."
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                      />
                    </div>

                    {/* 3. Expedia */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      hotelForm.showExpediaUrl !== false 
                        ? 'bg-white border-stone-200 shadow-2xs' 
                        : 'bg-stone-50/70 border-stone-200/60 opacity-80'
                    }`}>
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#FFCC00] text-[#002244] flex items-center justify-center shrink-0 shadow-2xs">
                            <ExpediaIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-cairo font-bold text-xs sm:text-sm text-stone-900 block">
                              Expedia (رابط الحجز)
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              منصة إكسبيديا العالمية الشهيرة
                            </span>
                          </div>
                        </div>

                        {/* Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setHotelForm(prev => ({ ...prev, showExpediaUrl: prev.showExpediaUrl === false }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            hotelForm.showExpediaUrl !== false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300 border border-stone-300'
                          }`}
                        >
                          {hotelForm.showExpediaUrl !== false ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>مفعّل (ظاهر)</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                              <span>مخفي</span>
                            </>
                          )}
                        </button>
                      </div>

                      <input
                        type="url"
                        value={hotelForm.expediaUrl || ''}
                        onChange={(e) => setHotelForm({ ...hotelForm, expediaUrl: e.target.value })}
                        placeholder="https://www.expedia.com/Hotel-Search?..."
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                      />
                    </div>

                    {/* 4. Google Maps */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      hotelForm.showGoogleMapsUrl !== false 
                        ? 'bg-white border-stone-200 shadow-2xs' 
                        : 'bg-stone-50/70 border-stone-200/60 opacity-80'
                    }`}>
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs">
                            <GoogleMapsIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-cairo font-bold text-xs sm:text-sm text-stone-900 block">
                              خرائط جوجل (Google Maps)
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              رابط الموقع الجغرافي واتجاهات الوصول للفندق
                            </span>
                          </div>
                        </div>

                        {/* Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setHotelForm(prev => ({ ...prev, showGoogleMapsUrl: prev.showGoogleMapsUrl === false }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            hotelForm.showGoogleMapsUrl !== false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300 border border-stone-300'
                          }`}
                        >
                          {hotelForm.showGoogleMapsUrl !== false ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>مفعّل (ظاهر)</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                              <span>مخفي</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={hotelForm.googleMapsUrl || ''}
                          onChange={(e) => setHotelForm({ ...hotelForm, googleMapsUrl: e.target.value })}
                          placeholder="https://maps.google.com/?q=..."
                          className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (hotelForm.name || hotelForm.city) {
                              const q = encodeURIComponent(`${hotelForm.name} ${hotelForm.city} ${hotelForm.district || ''}`);
                              setHotelForm(prev => ({ ...prev, googleMapsUrl: `https://maps.google.com/?q=${q}` }));
                              onShowToast('تم توليد رابط الخريطة تلقائياً', 'info');
                            }
                          }}
                          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-[#B38A34] text-xs font-bold rounded-xl border border-stone-300 shrink-0 transition-colors"
                          title="توليد رابط تلقائي من الاسم والمدينة"
                        >
                          توليد تلقائي
                        </button>
                      </div>
                    </div>

                    {/* 5. WhatsApp */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      hotelForm.showHotelWhatsApp !== false 
                        ? 'bg-white border-stone-200 shadow-2xs' 
                        : 'bg-stone-50/70 border-stone-200/60 opacity-80'
                    }`}>
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <WhatsAppIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-cairo font-bold text-xs sm:text-sm text-stone-900 block">
                              واتساب مخصص للفندق (WhatsApp)
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              رقم التواصل والحجز المباشر (يقبل 05XXXXXXXX أو +966 أو روابط wa.me)
                            </span>
                          </div>
                        </div>

                        {/* Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setHotelForm(prev => ({ ...prev, showHotelWhatsApp: prev.showHotelWhatsApp === false }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            hotelForm.showHotelWhatsApp !== false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300 border border-stone-300'
                          }`}
                        >
                          {hotelForm.showHotelWhatsApp !== false ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>مفعّل (ظاهر)</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                              <span>مخفي</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={hotelForm.hotelWhatsApp || ''}
                          onChange={(e) => setHotelForm({ ...hotelForm, hotelWhatsApp: e.target.value })}
                          placeholder="مثال: 0544076726 أو +966544076726 أو رابط wa.me"
                          className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                        />
                        {hotelForm.hotelWhatsApp?.trim() && (
                          <a
                            href={buildWhatsAppLink(hotelForm.hotelWhatsApp, `السلام عليكم، تجربة رسالة استفسار وحجز فندق ${hotelForm.name}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-300 shrink-0 transition-colors flex items-center gap-1"
                            title="فتح الرابط في واتساب للتأكد من الرقم"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>اختبار</span>
                          </a>
                        )}
                      </div>

                      {hotelForm.hotelWhatsApp?.trim() ? (
                        <div className="mt-2 text-[11px] text-stone-600 flex items-center gap-1 dir-ltr text-left font-mono bg-stone-50 p-2 rounded-lg border border-stone-200/80">
                          <span className="text-stone-400 shrink-0">رابط الواتساب النشط:</span>
                          <span className="text-emerald-700 truncate">{buildWhatsAppLink(hotelForm.hotelWhatsApp)}</span>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-[11px] text-stone-400">
                          * إذا تركته فارغاً سيتم استخدام رقم واتساب الموقع الافتراضي تلقائياً.
                        </p>
                      )}
                    </div>

                    {/* 6. Email */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      hotelForm.showHotelEmail !== false 
                        ? 'bg-white border-stone-200 shadow-2xs' 
                        : 'bg-stone-50/70 border-stone-200/60 opacity-80'
                    }`}>
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#EA4335] text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <EmailIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-cairo font-bold text-xs sm:text-sm text-stone-900 block">
                              البريد الإلكتروني المباشر (Email)
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              بريد إلكتروني مخصص لاستقبال الحجوزات والاستفسارات
                            </span>
                          </div>
                        </div>

                        {/* Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setHotelForm(prev => ({ ...prev, showHotelEmail: prev.showHotelEmail === false }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            hotelForm.showHotelEmail !== false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300 border border-stone-300'
                          }`}
                        >
                          {hotelForm.showHotelEmail !== false ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>مفعّل (ظاهر)</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                              <span>مخفي</span>
                            </>
                          )}
                        </button>
                      </div>

                      <input
                        type="email"
                        value={hotelForm.hotelEmail || ''}
                        onChange={(e) => setHotelForm({ ...hotelForm, hotelEmail: e.target.value })}
                        placeholder="reservations@hotel.com"
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                      />
                    </div>

                    {/* 7. Custom Direct Booking Link */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#B38A34]" />
                        <span className="font-cairo font-bold text-xs sm:text-sm text-stone-900">
                          رابط حجز رسمي إضافي أو مخصص (اختياري)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-stone-600 block mb-1">
                            عنوان الرابط:
                          </label>
                          <input
                            type="text"
                            value={hotelForm.customBookingTitle || ''}
                            onChange={(e) => setHotelForm({ ...hotelForm, customBookingTitle: e.target.value })}
                            placeholder="مثال: موقع الفندق الرسمي"
                            className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-600 block mb-1">
                            الرابط (URL):
                          </label>
                          <input
                            type="url"
                            value={hotelForm.customBookingUrl || ''}
                            onChange={(e) => setHotelForm({ ...hotelForm, customBookingUrl: e.target.value })}
                            placeholder="https://myhotel.com/book"
                            className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] dir-ltr text-left"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: SEO & Google Search Snippet */}
              {hotelFormStep === 5 && (
                <div className="space-y-4 animate-fadeIn">
                  <AdminSEOEditor
                    values={{
                      titleAr: hotelForm.metaTitle || (hotelForm.name ? `فندق ${hotelForm.name} في ${hotelForm.city} (${hotelForm.stars} نجوم) | شركة برستيج` : ''),
                      titleEn: hotelForm.metaTitleEn || (hotelForm.nameEn ? `${hotelForm.nameEn} - ${hotelForm.city} (${hotelForm.stars} Stars) | Prestige Hotels Management` : ''),
                      descriptionAr: hotelForm.metaDescription || (hotelForm.overview || ''),
                      descriptionEn: hotelForm.metaDescriptionEn || '',
                      keywords: hotelForm.keywords || '',
                      slug: hotelForm.slug || ''
                    }}
                    onChange={(seo) => {
                      setHotelForm(prev => ({
                        ...prev,
                        metaTitle: seo.titleAr,
                        metaTitleEn: seo.titleEn,
                        metaDescription: seo.descriptionAr,
                        metaDescriptionEn: seo.descriptionEn,
                        keywords: seo.keywords
                      }));
                    }}
                    pagePathPrefix="hotels"
                    defaultTitleAr={`فندق ${hotelForm.name || 'الفندق'} في ${hotelForm.city || 'مكة المكرمة'} | شركة برستيج`}
                    defaultTitleEn={`${hotelForm.nameEn || hotelForm.name || 'Hotel'} | Prestige Hotels Management`}
                    defaultDescAr={`احجز إقامتك في فندق ${hotelForm.name || 'الفندق'} في ${hotelForm.city || 'مكة المكرمة'}. حجز مباشر، أفضل الأسعار وخدمات ضيافة متكاملة.`}
                    defaultDescEn={`Book your stay at ${hotelForm.nameEn || hotelForm.name || 'Hotel'} in ${hotelForm.city || 'Makkah'}. Direct booking and premium hospitality.`}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer Navigation */}
            <div className="p-4 sm:p-6 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              {hotelFormStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setHotelFormStep((hotelFormStep - 1) as any)}
                  className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition-colors"
                >
                  الخطوة السابقة
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHotelModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
                >
                  إلغاء
                </button>

                {hotelFormStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => setHotelFormStep((hotelFormStep + 1) as any)}
                    className="px-5 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    التالي
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveHotel}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    حفظ الفندق في قاعدة البيانات
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offer Add/Edit Modal */}
      {isOfferModalOpen && (
        <div 
          id="admin-offer-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full shadow-2xl my-8 overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div>
                <h3 className="font-cairo font-bold text-xl text-stone-900">
                  {editingOfferId ? 'تعديل بيانات الإعلان' : 'إضافة إعلان ترويجي جديد'}
                </h3>
                <span className="text-xs text-stone-500">
                  تحكم كامل بالوسائط، العد التنازلي، والظهور في شرائح الترحيب
                </span>
              </div>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">عنوان الإعلان والمناسبة: *</label>
                <input
                  type="text"
                  required
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  placeholder="مثال: باقة رمضان المبارك - خصم الحجز المبكر"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">الوصف المختصر:</label>
                  <textarea
                    rows={2}
                    value={offerForm.shortDescription}
                    onChange={(e) => setOfferForm({ ...offerForm, shortDescription: e.target.value })}
                    placeholder="نبذة سريعة تظهر بالبطاقة"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">التفاصيل الكاملة للإعلان:</label>
                  <textarea
                    rows={2}
                    value={offerForm.fullDescription}
                    onChange={(e) => setOfferForm({ ...offerForm, fullDescription: e.target.value })}
                    placeholder="تظهر عند فتح المعاينة الكاملة"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Visibility & Feature Toggles */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                <span className="text-xs font-bold text-amber-900 block">
                  خيارات العرض والظهور في الموقع:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Hero Slides Inclusion Toggle */}
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-amber-200/60 cursor-pointer hover:bg-amber-50 transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={offerForm.showInHeroSlides ?? false}
                      onChange={(e) => setOfferForm({ ...offerForm, showInHeroSlides: e.target.checked })}
                      className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                    />
                    <div>
                      <strong className="text-xs block text-stone-900">ضمن شرائح الهيرو</strong>
                      <span className="text-[10px] text-stone-500">يعرض في أعلى الرئيسية</span>
                    </div>
                  </label>

                  {/* Countdown Timer Toggle */}
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-amber-200/60 cursor-pointer hover:bg-amber-50 transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={offerForm.showCountdown !== false}
                      onChange={(e) => setOfferForm({ ...offerForm, showCountdown: e.target.checked })}
                      className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                    />
                    <div>
                      <strong className="text-xs block text-stone-900">مؤقت العد التنازلي</strong>
                      <span className="text-[10px] text-stone-500">إظهار الوقت المتبقي</span>
                    </div>
                  </label>

                  {/* Discount Badge Toggle */}
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-amber-200/60 cursor-pointer hover:bg-amber-50 transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={offerForm.showDiscount !== false}
                      onChange={(e) => setOfferForm({ ...offerForm, showDiscount: e.target.checked })}
                      className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                    />
                    <div>
                      <strong className="text-xs block text-stone-900">إظهار نسبة الخصم</strong>
                      <span className="text-[10px] text-stone-500">شارة الخصم المميزة</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Type, Discount %, End Date, Badge */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">نوع الوسائط الرئيسي:</label>
                  <select
                    value={offerForm.mediaType}
                    onChange={(e) => setOfferForm({ ...offerForm, mediaType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  >
                    <option value="image">صورة / بوستر تصميم</option>
                    <option value="video">مقطع فيديو دعائي</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">نسبة الخصم (%):</label>
                  <input
                    type="number"
                    value={offerForm.discountPercentage || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, discountPercentage: parseInt(e.target.value) || undefined })}
                    placeholder="25"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">تاريخ الانتهاء:</label>
                  <input
                    type="date"
                    value={offerForm.endDate || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">شارة الإعلان (Badge):</label>
                  <input
                    type="text"
                    value={offerForm.badgeText || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, badgeText: e.target.value })}
                    placeholder="عرض حصري"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Main Media Upload & URL Section */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 block">
                    {offerForm.mediaType === 'video' ? 'بوستر / صورة غلاف الفيديو الرئيسي: *' : 'صورة أو بوستر الإعلان الرئيسي: *'}
                  </label>

                  <label className="cursor-pointer text-xs font-bold text-[#B38A34] hover:text-[#C9A24B] flex items-center gap-1.5 bg-[#C9A24B]/15 px-3 py-1.5 rounded-xl border border-[#C9A24B]/30 hover:bg-[#C9A24B]/25 transition-all">
                    <UploadCloud className="w-4 h-4" />
                    <span>{isOfferUploading ? 'جاري الرفع...' : 'رفع بوستر من جهازك'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleOfferImageUpload}
                      disabled={isOfferUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <input
                    type="text"
                    value={offerForm.mediaUrl}
                    onChange={(e) => setOfferForm({ ...offerForm, mediaUrl: e.target.value })}
                    placeholder="رابط الصورة أو ارفع ملف من جهازك"
                    className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] dir-ltr text-left"
                  />
                </div>

                {offerForm.mediaUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-stone-300 bg-stone-900 max-h-48 aspect-video flex items-center justify-center">
                    <img
                      src={offerForm.mediaUrl}
                      alt="معاينة البوستر"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      معاينة البوستر الرئيسي
                    </div>
                  </div>
                )}
              </div>

              {/* Video URL if video type */}
              {offerForm.mediaType === 'video' && (
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">رابط مقطع الفيديو (MP4 أو YouTube):</label>
                  <input
                    type="url"
                    value={offerForm.videoUrl || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, videoUrl: e.target.value })}
                    placeholder="https://.../video.mp4"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] dir-ltr text-left"
                  />
                </div>
              )}

              {/* Multi-Media Gallery Section (Multiple Images & Videos for the Ad) */}
              <div className="p-4 rounded-2xl bg-stone-900 text-white space-y-4 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Images className="w-4 h-4 text-[#C9A24B]" />
                    <div>
                      <h4 className="font-cairo font-bold text-xs sm:text-sm text-stone-100">
                        معرض وسائط الإعلان (صور وفيديوهات إضافية)
                      </h4>
                      <span className="text-[10px] text-stone-400">
                        يمكنك إضافة عدة صور أو فيديوهات للزائر ليتنقل بينها بأريحية
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-[#DFBE72] bg-stone-800 px-2.5 py-0.5 rounded-full">
                    {offerForm.gallery?.length || 0} عناصر مضافة
                  </span>
                </div>

                {/* Existing Gallery Thumbnails */}
                {offerForm.gallery && offerForm.gallery.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {offerForm.gallery.map((item, idx) => (
                      <div key={item.id || `offer-media-${idx}`} className="relative rounded-xl overflow-hidden bg-stone-800 border border-stone-700 group aspect-video">
                        {item.type === 'video' ? (
                          <div className="w-full h-full bg-stone-950 flex items-center justify-center">
                            <Film className="w-6 h-6 text-[#C9A24B]" />
                            <span className="absolute bottom-1 right-1 text-[9px] bg-black/80 px-1.5 py-0.5 rounded text-stone-300">
                              فيديو
                            </span>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryItem(item.id)}
                          className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity"
                          title="حذف هذا العنصر"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Gallery Item Row */}
                <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700 space-y-3">
                  <span className="text-[11px] font-bold text-stone-300 block">
                    + إضافة صورة أو فيديو جديد للمعرض:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <select
                      value={newGalleryType}
                      onChange={(e) => setNewGalleryType(e.target.value as any)}
                      className="sm:col-span-3 px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-200 focus:outline-none"
                    >
                      <option value="image">صورة (Image)</option>
                      <option value="video">فيديو (Video)</option>
                    </select>

                    <input
                      type="url"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      placeholder="رابط الصورة أو الفيديو..."
                      className="sm:col-span-6 px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs font-mono text-stone-200 focus:outline-none dir-ltr text-left"
                    />

                    <button
                      type="button"
                      onClick={() => handleAddGalleryItem(newGalleryType, newGalleryUrl, newGalleryCaption)}
                      disabled={!newGalleryUrl.trim()}
                      className="sm:col-span-3 px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] disabled:opacity-50 text-white text-xs font-bold transition-colors"
                    >
                      إضافة للمعرض
                    </button>
                  </div>

                  {/* Direct upload for gallery */}
                  <div className="pt-2 border-t border-stone-700/80 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400">أو يمكنك الرفع المباشر من جهازك:</span>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold transition-colors">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isUploadingGalleryItem ? 'جاري الرفع...' : 'رفع ملف إلى المعرض'}</span>
                      <input
                        type="file"
                        accept="image/*, video/*"
                        onChange={handleUploadGalleryFile}
                        disabled={isUploadingGalleryItem}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveOffer}
                className="px-6 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>حفظ وتحديث الإعلان</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Standalone Hotel Media & Album Manager Modal */}
      {albumModalHotel && (
        <div
          id="admin-hotel-album-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAlbumModalHotel(null);
          }}
        >
          <div className="bg-white border border-stone-200 rounded-3xl max-w-4xl w-full shadow-2xl my-auto overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
            <div className="p-5 sm:p-6 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold mb-1">
                  <Images className="w-3.5 h-3.5" />
                  <span>ألبوم وسائط الفندق</span>
                </div>
                <h3 className="font-cairo font-bold text-xl text-stone-900">
                  {albumModalHotel.name} ({albumModalHotel.city} - {albumModalHotel.district})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAlbumModalHotel(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <HotelMediaAlbumManager
                mainImage={albumModalHotel.mainImage}
                galleryImages={albumModalHotel.galleryImages || []}
                videoUrl={albumModalHotel.videoUrl || ''}
                additionalVideos={albumModalHotel.additionalVideos || []}
                onChange={handleSaveAlbumModal}
                onShowToast={onShowToast}
              />
            </div>

            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <span className="text-xs text-stone-500 font-medium">
                {savingAlbum ? 'جاري الحفظ في السحابة...' : 'يتم حفظ التغييرات وتحديث المعرض تلقائياً.'}
              </span>
              <button
                type="button"
                onClick={() => setAlbumModalHotel(null)}
                className="px-6 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                تم والانتهاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase SQL Schema Viewer & Copy Modal */}
      {showSqlSchemaModal && (
        <div 
          id="admin-supabase-sql-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-stone-200 rounded-3xl max-w-3xl w-full shadow-2xl my-auto overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
            <div className="p-5 sm:p-6 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-lg text-stone-900">
                    سكريبت إنشاء جداول سوبا بيز (Supabase SQL Schema)
                  </h3>
                  <p className="text-xs text-stone-500">
                    انسخ هذا الكود والصقه في نافذة SQL Editor في لوحة تحكم Supabase واضغط Run
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlSchemaModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-stone-900 text-stone-100 font-mono text-xs leading-relaxed space-y-3 dir-ltr text-left select-all">
              <pre className="whitespace-pre-wrap font-mono text-[11px] text-emerald-300">
{`-- ==============================================================================
-- Prestige Hotels Management - Supabase PostgreSQL Database Schema
-- شركة برستيج لإدارة وتشغيل الفنادق - سكريبت إنشاء جداول قاعدة بيانات Supabase
-- ==============================================================================

-- 1. DISTRICTS TABLE (المناطق والأحياء)
CREATE TABLE IF NOT EXISTS public.districts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'مكة المكرمة',
    description TEXT,
    distance_range TEXT,
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Districts (الأحياء والمناطق الأساسية)
INSERT INTO public.districts (id, name, city, description, distance_range, order_num)
VALUES
    ('dist_ajyad', 'أجياد', 'مكة المكرمة', 'منطقة حيوية مقابلة لأبراج البيت وباب الملك عبدالعزيز', '١٠٠ - ٣٥٠ م', 1),
    ('dist_mesfalah', 'المسفلة', 'مكة المكرمة', 'شارع إبراهيم الخليل والخدمات المركزية وباب الملك فهد', '٥٠٠ - ٨٥٠ م', 2),
    ('dist_mahbas', 'محبس الجن', 'مكة المكرمة', 'منطقة كبرى مع حافلات نقل ترددي مستمرة 24 ساعة للحرم', 'حافلات ترددية (دقائق)', 3),
    ('dist_aziziyah', 'العزيزية', 'مكة المكرمة', 'أرقى الفنادق والمقرات الواسعة للحملات والمجموعات', 'توصيل مجاني مستمر', 4),
    ('dist_aziziyah_north', 'العزيزية الشمالية', 'مكة المكرمة', 'طريق المسجد الحرام وقرب محطات النقل السريع', 'حافلات ترددية 24/7', 5),
    ('dist_ghazzah', 'المركزية / الغزة', 'مكة المكرمة', 'مقابل التوسعة الشمالية وساحات الحرم', '٢٠٠ - ٤٠٠ م', 6),
    ('dist_shubaika', 'الشبيكة / الغزة', 'مكة المكرمة', 'المنطقة المركزية الغربية وقرب بوابات الحرم', '٣٠٠ - ٥٠٠ م', 7),
    ('dist_kudai', 'كدي / أجياد', 'مكة المكرمة', 'قرب مواقف كدي وشارع أجياد السريع', '٧٠٠ - ٩٠٠ م', 8),
    ('dist_central_north_madinah', 'المنطقة المركزية الشمالية', 'المدينة المنورة', 'مقابل ساحات المسجد النبوي الشريف ومصلى النساء', '١٠٠ - ٢٥٠ م', 9),
    ('dist_central_west_madinah', 'المنطقة المركزية الغربية', 'المدينة المنورة', 'قرب باب السلام والساحات الغربية للمسجد النبوي', '١٥٠ - ٣٠٠ م', 10),
    ('dist_central_south_madinah', 'المنطقة المركزية الجنوبية', 'المدينة المنورة', 'قرب ساحة قباء وباب قباء', '٢٠٠ - ٤٠٠ م', 11)
ON CONFLICT (id) DO NOTHING;

-- 2. ADMIN USERS TABLE (المستخدمين وصلاحيات الإدارة)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'controller',
    password TEXT NOT NULL DEFAULT 'admin',
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Super Admin (المدير العام الثابت A.hesham)
INSERT INTO public.admin_users (id, name, username, email, role, password, status, notes)
VALUES (
    'usr_super_admin_hesham',
    'المدير العام (أحمد هشام)',
    'A.hesham',
    'a.hesham@prestigehotels.sa',
    'admin',
    '199991',
    'active',
    'حساب المدير العام الرئيسي الثابت ولا يمكن تعديله أو حذفه'
)
ON CONFLICT (id) DO UPDATE SET 
    username = 'A.hesham',
    password = '199991',
    role = 'admin',
    name = 'المدير العام (أحمد هشام)';

-- 3. HOTELS TABLE (الفنادق المعتمدة)
CREATE TABLE IF NOT EXISTS public.hotels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    city TEXT NOT NULL DEFAULT 'مكة المكرمة',
    district TEXT NOT NULL,
    stars INTEGER DEFAULT 5,
    distance_to_haram INTEGER DEFAULT 100,
    distance_text TEXT,
    walking_time_minutes INTEGER DEFAULT 2,
    featured BOOLEAN DEFAULT true,
    categories JSONB DEFAULT '["فنادق سنوية", "فنادق العمرة"]'::jsonb,
    rating NUMERIC(3, 1) DEFAULT 4.8,
    review_count INTEGER DEFAULT 0,
    main_image TEXT NOT NULL,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    video_url TEXT,
    overview TEXT,
    detailed_description TEXT,
    amenities JSONB DEFAULT '[]'::jsonb,
    booking_url TEXT,
    show_booking_url BOOLEAN DEFAULT true,
    agoda_url TEXT,
    show_agoda_url BOOLEAN DEFAULT true,
    expedia_url TEXT,
    show_expedia_url BOOLEAN DEFAULT true,
    google_maps_url TEXT,
    show_google_maps_url BOOLEAN DEFAULT true,
    hotel_whatsapp TEXT,
    show_hotel_whatsapp BOOLEAN DEFAULT true,
    hotel_email TEXT,
    show_hotel_email BOOLEAN DEFAULT true,
    location JSONB DEFAULT '{}'::jsonb,
    keywords TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OFFERS TABLE (العروض والمناسبات)
CREATE TABLE IF NOT EXISTS public.offers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    short_description TEXT,
    full_description TEXT,
    media_type TEXT DEFAULT 'image',
    media_url TEXT NOT NULL,
    video_url TEXT,
    discount_percentage INTEGER DEFAULT 0,
    end_date TEXT,
    is_active BOOLEAN DEFAULT true,
    badge_text TEXT,
    keywords TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REVIEWS TABLE (التقييمات وتجارب النزلاء)
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    hotel_id TEXT,
    hotel_name TEXT,
    author_name TEXT NOT NULL,
    country TEXT,
    rating INTEGER DEFAULT 5,
    comment TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    stay_date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MESSAGES TABLE (رسائل واستفسارات الضيوف)
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    city TEXT,
    hotel_interest TEXT,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SITE SETTINGS TABLE (إعدادات وهوية الموقع)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'main_config',
    settings_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LIVE CONTENT TABLE (نصوص وتعديلات الواجهة الحية)
CREATE TABLE IF NOT EXISTS public.content (
    key TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    color TEXT,
    font_size TEXT,
    font_weight TEXT,
    updated_at BIGINT,
    updated_by TEXT
);

-- RLS Policies
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Public Read Admin Users" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Public Read Hotels" ON public.hotels FOR SELECT USING (true);
CREATE POLICY "Public Read Offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Content" ON public.content FOR SELECT USING (true);

CREATE POLICY "Public Insert Messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Reviews" ON public.reviews FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon Full Access Districts" ON public.districts FOR ALL USING (true);
CREATE POLICY "Anon Full Access Hotels" ON public.hotels FOR ALL USING (true);
CREATE POLICY "Anon Full Access Offers" ON public.offers FOR ALL USING (true);
CREATE POLICY "Anon Full Access Reviews" ON public.reviews FOR ALL USING (true);
CREATE POLICY "Anon Full Access Messages" ON public.messages FOR ALL USING (true);
CREATE POLICY "Anon Full Access Settings" ON public.site_settings FOR ALL USING (true);
CREATE POLICY "Anon Full Access Admin Users" ON public.admin_users FOR ALL USING (true);
CREATE POLICY "Anon Full Access Content" ON public.content FOR ALL USING (true);`}
              </pre>
            </div>

            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-stone-500">
                الملف متوفر أيضاً في المجلد الرئيسي: <code className="text-stone-800 font-bold">supabase_schema.sql</code>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const scriptText = document.querySelector('#admin-supabase-sql-modal pre')?.textContent || '';
                    navigator.clipboard.writeText(scriptText);
                    onShowToast('تم نسخ سكريبت SQL إلى الحافظة بنجاح! الصقه في Supabase SQL Editor', 'success');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>نسخ الكود بالكامل</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSqlSchemaModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Auto-Save & Cloud Synchronization Real-Time Capsule */}
      {autoSaveStatus !== 'idle' && (
        <div 
          id="admin-autosave-floating-pill" 
          className="fixed bottom-6 right-6 sm:right-8 z-[99999] pointer-events-none transition-all duration-300 transform translate-y-0 opacity-100 animate-fadeIn"
        >
          <div className={`apple-glass bg-white/95 backdrop-blur-2xl border shadow-2xl rounded-2xl px-5 py-3.5 flex items-center gap-3.5 text-stone-900 pointer-events-auto transition-all ${
            autoSaveStatus === 'saving' 
              ? 'border-amber-300/80 ring-2 ring-amber-400/20 shadow-amber-500/10' 
              : 'border-emerald-300/80 ring-2 ring-emerald-400/20 shadow-emerald-500/10'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              autoSaveStatus === 'saving' 
                ? 'bg-amber-500/15 text-amber-600' 
                : 'bg-emerald-500/15 text-emerald-600'
            }`}>
              {autoSaveStatus === 'saving' ? (
                <RotateCcw className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-cairo font-bold text-sm ${
                  autoSaveStatus === 'saving' ? 'text-stone-900' : 'text-emerald-800'
                }`}>
                  {autoSaveStatus === 'saving' ? 'جاري الحفظ تلقائياً...' : 'تم الحفظ والمزامنة بنجاح'}
                </span>
                {autoSaveStatus === 'saving' ? (
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                ) : (
                  <span className="text-emerald-600 text-xs font-bold">✓</span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {autoSaveStatus === 'saving' 
                  ? 'يتم الآن مزامنة كافة التعديلات والتحديثات مع قاعدة البيانات السحابية' 
                  : 'تم تأكيد وحفظ كافة البيانات في السحابة بنجاح وهي معروضة للزوار الآن'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
