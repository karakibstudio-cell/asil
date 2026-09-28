import React, { useState, useEffect } from 'react';
import { Hotel, Offer, ContactMessage, ActivePage, SiteSettings, ContactChannel, HotelCategory, ALL_HOTEL_CATEGORIES, HotelReview, District, AdminUser, UserRole, BranchLocation, QuickLinkItem } from '../types';
import { AdminChannelsManager } from '../components/AdminChannelsManager';
import { AdminHeroSlidesManager } from '../components/AdminHeroSlidesManager';
import { AdminDistrictsManager } from '../components/AdminDistrictsManager';
import { AdminUsersManager } from '../components/AdminUsersManager';
import { AdminBranchesManager } from '../components/AdminBranchesManager';
import { AdminQuickLinksManager } from '../components/AdminQuickLinksManager';
import { HotelMediaAlbumManager } from '../components/HotelMediaAlbumManager';
import { AdminAboutManager } from '../components/AdminAboutManager';
import { BookingComIcon, AgodaIcon, ExpediaIcon, GoogleMapsIcon, WhatsAppIcon, EmailIcon } from '../components/BookingIcons';
import { optimizeImageFile } from '../utils/imageOptimizer';
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
  setCurrentAdminUser
} from '../services/firebase';
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
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink,
  MessageCircle,
  Star,
  MessageSquare,
  CheckCircle2,
  Clock,
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
  Copy
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  isSupabaseConfigured 
} from '../services/supabase';

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
  onUpdateSiteSettings
}) => {
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard Sidebar Navigation
  type AdminTab = 'hotels' | 'districts' | 'users' | 'slides' | 'offers' | 'about' | 'reviews' | 'messages' | 'settings';
  const [activeTab, setActiveTab] = useState<AdminTab>('hotels');

  // Districts & Admin Users State
  const [districts, setDistricts] = useState<District[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
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
    reviewCount: 150,
    mainImage: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
    ],
    videoUrl: '',
    overview: '',
    detailedDescription: '',
    amenities: ['إطلالة مباشرة على الحرم', 'واي فاي مجاني', 'بوفيه إفطار فاخر', 'مصاعد سريعة للساحة'],
    location: {
      lat: 21.4225,
      lng: 39.8262,
      address: 'أجياد، المنطقة المركزية، مكة المكرمة',
      viewType: 'إطلالة مباشرة على الكعبة'
    },
    keywords: 'فنادق مكة, فندق قريب من الحرم, إطلالة الكعبة, حجز فنادق العمرة',
    metaDescription: 'احجز إقامتك الفاخرة في أفضل فنادق مكة المكرمة بالقرب من الحرم المكي مع خدمات تسكين متكاملة وبوفيه إفطار متميز.'
  });

  // Drag and drop / file upload simulation state for Hotel
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newAmenityInput, setNewAmenityInput] = useState('');

  // Offer Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState<Offer>({
    id: '',
    title: '',
    shortDescription: '',
    fullDescription: '',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80',
    videoUrl: '',
    discountPercentage: 20,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
    isActive: true,
    badgeText: 'عرض موسمي',
    keywords: 'عروض العمرة, خصومات فنادق مكة, باقات الحج والعمرة',
    metaDescription: 'استفد من أقوى عروض وباقات التسكين الفاخرة في مكة والمدينة بأسعار حصرية من ضيافة الحرمين.'
  });
  const [offerUploadProgress, setOfferUploadProgress] = useState<number>(0);
  const [isOfferUploading, setIsOfferUploading] = useState(false);

  // Standalone Hotel Album Modal State
  const [albumModalHotel, setAlbumModalHotel] = useState<Hotel | null>(null);
  const [savingAlbum, setSavingAlbum] = useState(false);

  const handleSaveAlbumModal = async (updatedData: {
    mainImage: string;
    galleryImages: string[];
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
      await saveHotelToDb(updatedHotel);
      await onRefreshData();
      onShowToast('تم حفظ وتحديث ألبوم صور وفيديوهات الفندق في قاعدة البيانات بنجاح', 'success');
    } catch (err) {
      console.error('Failed saving hotel album:', err);
      onShowToast('حدث خطأ أثناء حفظ الألبوم', 'error');
    } finally {
      setSavingAlbum(false);
    }
  };

  // Site Settings Form State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [savingSettings, setSavingSettings] = useState(false);

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
    }
  }, [siteSettings]);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onShowToast('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت', 'error');
        return;
      }
      try {
        const optimized = await optimizeImageFile(file, {
          maxWidth: 512,
          maxHeight: 512,
          forcePng: file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
        });
        setSettingsForm(prev => ({
          ...prev,
          logoUrl: optimized
        }));
        onShowToast('تم تجهيز الشعار بنجاح (مع الحفاظ على الشفافية). اضغط "حفظ التعديلات" لتطبيقه.', 'success');
      } catch (err) {
        console.error('Error optimizing logo image:', err);
        onShowToast('حدث خطأ أثناء معالجة ملف الصورة', 'error');
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsForm.siteTitle.trim()) {
      onShowToast('يرجى كتابة اسم أو عنوان الموقع', 'error');
      return;
    }
    setSavingSettings(true);
    try {
      await onUpdateSiteSettings(settingsForm);
      onShowToast('تم حفظ وتحديث إعدادات الموقع والشعار في Firestore بنجاح', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء حفظ الإعدادات في Firestore', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChannelsChange = async (updatedChannels: ContactChannel[]) => {
    const updated: SiteSettings = {
      ...settingsForm,
      channels: updatedChannels,
    };
    setSettingsForm(updated);
    try {
      await onUpdateSiteSettings(updated);
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
      await onUpdateSiteSettings(updated);
    } catch (err) {
      console.error('Failed to auto-save branches:', err);
    }
  };

  const handleQuickLinksChange = async (updatedLinks: QuickLinkItem[]) => {
    const updated: SiteSettings = {
      ...settingsForm,
      quickLinks: updatedLinks,
    };
    setSettingsForm(updated);
    try {
      await onUpdateSiteSettings(updated);
    } catch (err) {
      console.error('Failed to auto-save quick links:', err);
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

  useEffect(() => {
    loadDistricts();
    loadUsers();
  }, []);

  // Load messages & reviews when respective tab is active
  useEffect(() => {
    if (isAdminLoggedIn) {
      loadDistricts();
      loadUsers();
      if (activeTab === 'messages') {
        loadMessages();
      } else if (activeTab === 'reviews') {
        loadReviews();
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
    try {
      await approveReview(review.id);
      onShowToast(`تم اعتماد تقييم "${review.authorName}" وإضافته للفندق بنجاح`, 'success');
      await loadReviews();
      await onRefreshData();
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء اعتماد التقييم', 'error');
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

  // Auth Handlers with RBAC (Strictly Registered Users & Super Admin ahmed.tito.h1@gmail.com)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const input = email.trim().toLowerCase();
      // 1. Check against registered admin users in Database / Supabase / Storage
      const usersList = adminUsers.length > 0 ? adminUsers : await getAdminUsersFromDb();
      const matched = usersList.find(
        u => u.email.toLowerCase() === input || (u.username && u.username.toLowerCase() === input)
      );

      if (matched) {
        if (matched.status === 'inactive') {
          setLoginError('عذراً، هذا الحساب معطل حالياً. يرجى مراجعة المدير العام.');
          setLoginLoading(false);
          return;
        }
        if (matched.password && matched.password === password) {
          const isSuper = matched.email.toLowerCase() === 'ahmed.tito.h1@gmail.com';
          const verifiedUser: AdminUser = {
            ...matched,
            role: isSuper ? 'admin' : 'controller'
          };
          setCurrentUser(verifiedUser);
          setCurrentAdminUser(verifiedUser);
          setIsAdminLoggedIn(true);
          onShowToast(`مرحباً بكم ${verifiedUser.name} (${verifiedUser.role === 'admin' ? 'المدير العام' : 'مشرف'})`, 'success');
          setLoginLoading(false);
          return;
        }
      }

      // 2. Try Firebase Auth (if identifier is email)
      if (auth && input.includes('@') && password) {
        try {
          const res = await signInWithEmailAndPassword(auth, input, password);
          if (res.user) {
            const isSuper = res.user.email?.toLowerCase() === 'ahmed.tito.h1@gmail.com';
            const adminProfile: AdminUser = matched || {
              id: res.user.uid,
              name: res.user.displayName || (isSuper ? 'المدير العام (أحمد تيتو)' : input.split('@')[0]),
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

      // 3. Super Admin Direct Credential Fallback (ahmed.tito.h1@gmail.com or username admin)
      if ((input === 'ahmed.tito.h1@gmail.com' || input === 'admin') && (password === 'admin' || password === 'admin123' || password === 'admin123456')) {
        const defaultAdmin: AdminUser = {
          id: 'usr_super_admin_tito',
          name: 'المدير العام (أحمد تيتو)',
          username: 'admin',
          email: 'ahmed.tito.h1@gmail.com',
          role: 'admin',
          status: 'active',
          createdAt: Date.now()
        };
        setCurrentUser(defaultAdmin);
        setCurrentAdminUser(defaultAdmin);
        setIsAdminLoggedIn(true);
        onShowToast('مرحباً بكم المدير العام أحمد تيتو في لوحة تحكم شركة برستيج', 'success');
      } else {
        setLoginError('اسم المستخدم / البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch (err: any) {
      setLoginError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setLoginError('');
    try {
      const user = await signInWithGoogle();
      if (user) {
        const isSuperAdmin = user.email?.toLowerCase() === 'ahmed.tito.h1@gmail.com';
        
        // Find existing profile in registered users
        const usersList = adminUsers.length > 0 ? adminUsers : await getAdminUsersFromDb();
        const existing = usersList.find(u => u.email.toLowerCase() === user.email?.toLowerCase());

        if (existing && existing.status === 'inactive') {
          setLoginError('عذراً، هذا الحساب معطل حالياً من قبل المدير العام.');
          setGoogleLoading(false);
          return;
        }

        const googleAdmin: AdminUser = existing ? {
          ...existing,
          role: isSuperAdmin ? 'admin' : 'controller'
        } : {
          id: user.uid,
          name: user.displayName || (isSuperAdmin ? 'المدير العام (أحمد تيتو)' : 'مشرف Google'),
          username: user.email ? user.email.split('@')[0] : 'google_user',
          email: user.email || 'user@google.com',
          role: isSuperAdmin ? 'admin' : 'controller',
          status: 'active',
          createdAt: Date.now()
        };

        setCurrentUser(googleAdmin);
        setCurrentAdminUser(googleAdmin);
        setIsAdminLoggedIn(true);
        onShowToast(`تم تسجيل الدخول بنجاح كـ ${googleAdmin.role === 'admin' ? 'المدير العام' : 'مشرف'} (${user.displayName || user.email})`, 'success');
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        const currentHost = window.location.hostname;
        setLoginError(`النطاق الحالي (${currentHost}) غير مضاف في قائمة النطاقات المصرح بها لـ Google OAuth. يمكنك تسجيل الدخول باسم المستخدم (admin) وكلمة المرور مباشرة، أو إضافة النطاق في Firebase Console -> Authentication -> Settings -> Authorized domains.`);
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup intentionally
      } else if (err.code === 'auth/popup-blocked') {
        setLoginError('تم حظر النافذة المنبثقة من قِبل المتصفح. يرجى السماح بالنوافذ المنبثقة ثم المحاولة مجدداً.');
      } else {
        setLoginError(err.message || 'تعذر تسجيل الدخول عبر Google. يمكنك استخدام اسم المستخدم وكلمة المرور.');
      }
    } finally {
      setGoogleLoading(false);
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

  // Hotel Actions
  const handleOpenAddHotel = () => {
    setEditingHotelId(null);
    setHotelFormStep(1);
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
      featured: true,
      categories: ['فنادق العمرة'],
      rating: 4.8,
      reviewCount: 80,
      mainImage: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
      ],
      videoUrl: '',
      overview: 'فندق راقٍ يوفر إقامة هادئة بالقرب من الحرم الشريف مع بوفيه إفطار وخدمات متميزة.',
      detailedDescription: 'يتميز الفندق بموقعه الاستراتيجي وقربه من بوابات الحرم مع غرف وأجنحة مجهزة بأعلى المقاييس الفندقية العالمية لخدمة الحجاج والمعتمرين.',
      amenities: ['إطلالة على الحرم', 'واي فاي مجاني', 'بوفيه إفطار', 'مصاعد سريعة', 'خدمة غرف 24/7'],
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
        viewType: 'إطلالة على ساحات الحرم'
      },
      keywords: '',
      metaDescription: ''
    });
    setIsHotelModalOpen(true);
  };

  const handleEditHotel = (hotel: Hotel) => {
    setEditingHotelId(hotel.id);
    setHotelFormStep(1);
    setHotelForm({
      ...hotel,
      district: hotel.district || (hotel.city === 'مكة المكرمة' ? 'المنطقة المركزية' : 'المنطقة المركزية الشمالية'),
      featured: hotel.featured ?? true,
      categories: hotel.categories && hotel.categories.length > 0 ? hotel.categories : ['فنادق العمرة'],
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
      keywords: hotel.keywords || '',
      metaDescription: hotel.metaDescription || ''
    });
    setIsHotelModalOpen(true);
  };

  const toggleFormCategory = (category: HotelCategory) => {
    setHotelForm(prev => {
      const current = prev.categories || [];
      const exists = current.includes(category);
      const updated = exists ? current.filter(c => c !== category) : [...current, category];
      return {
        ...prev,
        categories: updated
      };
    });
  };

  const handleToggleHotelFeatured = async (hotel: Hotel) => {
    try {
      const newFeatured = !hotel.featured;
      const updated: Hotel = { ...hotel, featured: newFeatured };
      await saveHotelToDb(updated);
      await onRefreshData();
      onShowToast(
        newFeatured
          ? `تمت إضافة فندق "${hotel.name}" إلى البار المتغيّر بالرئيسية`
          : `تمت إزالة فندق "${hotel.name}" من البار المتغيّر بالرئيسية`,
        'success'
      );
    } catch (err) {
      console.error('Error toggling hotel featured:', err);
      onShowToast('حدث خطأ أثناء تعديل حالة التمييز', 'error');
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
      await saveHotelToDb(hotelForm);
      await onRefreshData();
      setIsHotelModalOpen(false);
      onShowToast(editingHotelId ? 'تم تحديث بيانات الفندق بنجاح' : 'تمت إضافة الفندق الجديد بنجاح', 'success');
    } catch (err) {
      console.error(err);
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

  // Offer Actions
  const handleOpenAddOffer = () => {
    setEditingOfferId(null);
    setOfferForm({
      id: 'offer_' + Date.now(),
      title: '',
      shortDescription: '',
      fullDescription: '',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80',
      videoUrl: '',
      discountPercentage: 20,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
      isActive: true,
      badgeText: 'عرض خاص',
      keywords: '',
      metaDescription: ''
    });
    setIsOfferModalOpen(true);
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setOfferForm({ 
      ...offer,
      keywords: offer.keywords || '',
      metaDescription: offer.metaDescription || ''
    });
    setIsOfferModalOpen(true);
  };

  const handleOfferImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        onShowToast('حجم الصورة يتجاوز 8 ميجابايت، يرجى اختيار ملف أصغر', 'error');
        return;
      }
      try {
        const optimized = await optimizeImageFile(file, {
          maxWidth: 1200,
          maxHeight: 800,
          forcePng: file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
        });
        setOfferForm((prev) => ({ ...prev, mediaUrl: optimized }));
        onShowToast('تم تحميل وضغط صورة العرض بنجاح', 'success');
      } catch (err) {
        console.error('Error optimizing offer image:', err);
        onShowToast('حدث خطأ أثناء معالجة ملف الصورة', 'error');
      }
    }
  };

  const handleSaveOffer = async () => {
    if (!offerForm.title.trim()) {
      onShowToast('يرجى إدخال عنوان العرض أو المناسبة', 'error');
      return;
    }

    try {
      await saveOfferToDb(offerForm);
      await onRefreshData();
      setIsOfferModalOpen(false);
      onShowToast(editingOfferId ? 'تم تحديث العرض بنجاح' : 'تمت إضافة العرض الجديد بنجاح', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء حفظ العرض', 'error');
    }
  };

  const handleToggleOfferActive = async (offer: Offer) => {
    try {
      const updated = { ...offer, isActive: !offer.isActive };
      await saveOfferToDb(updated);
      await onRefreshData();
      onShowToast(updated.isActive ? 'تم تفعيل العرض وإظهاره للزوار' : 'تم إخفاء العرض عن الزوار', 'info');
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء تحديث حالة العرض', 'error');
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

  // Execution of Delete
  const handleExecuteDelete = async () => {
    try {
      if (deleteModal.type === 'hotel') {
        await deleteHotelFromDb(deleteModal.id);
        onShowToast(`تم حذف الفندق "${deleteModal.title}" نهائياً`, 'success');
      } else if (deleteModal.type === 'offer') {
        await deleteOfferFromDb(deleteModal.id);
        onShowToast(`تم حذف العرض "${deleteModal.title}" نهائياً`, 'success');
      } else if (deleteModal.type === 'review') {
        await deleteReviewFromDb(deleteModal.id);
        onShowToast(`تم حذف التقييم بنجاح`, 'success');
        await loadReviews();
      } else if (deleteModal.type === 'message') {
        await deleteMessageFromDb(deleteModal.id);
        onShowToast(`تم حذف الرسالة بنجاح`, 'success');
        await loadMessages();
      }
      await onRefreshData();
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء الحذف', 'error');
    } finally {
      setDeleteModal({ isOpen: false, type: 'hotel', id: '', title: '' });
    }
  };

  const handleToggleMessageRead = async (msg: ContactMessage) => {
    try {
      const newStatus = !msg.read;
      await markMessageAsReadInDb(msg.id, newStatus);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: newStatus } : m));
      onShowToast(newStatus ? 'تم تعليم الرسالة كمقروءة ✓' : 'تم تعليم الرسالة كغير مقروءة ✉️', 'info');
    } catch (e) {
      console.error(e);
      onShowToast('حدث خطأ أثناء تحديث حالة الرسالة', 'error');
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
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">اسم المستخدم أو البريد الإلكتروني:</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin أو ahmed.tito.h1@gmail.com"
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors dir-ltr text-right"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">كلمة المرور:</label>
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

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
              <span className="relative bg-white px-3 text-[11px] text-stone-400">أو</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full py-3 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>تسجيل الدخول عبر حساب Google / Gmail</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <div className="flex items-center gap-3">
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

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Sidebar Tabs (3 cols on desktop, responsive horizontal swipe bar on mobile) */}
          <div className="lg:col-span-3 flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 gap-2 no-scrollbar">
            {[
              { id: 'hotels' as AdminTab, label: 'الفنادق المعتمدة', icon: Building2, count: hotels.length },
              { id: 'districts' as AdminTab, label: 'المناطق والأحياء', icon: MapPin, count: districts.length || undefined },
              { id: 'users' as AdminTab, label: 'المستخدمين والصلاحيات', icon: Users, count: adminUsers.length || undefined, restricted: currentUser?.role === 'controller' },
              { id: 'slides' as AdminTab, label: 'شرائح الهيرو', icon: ImageIcon, count: siteSettings?.heroSlides?.length || 4 },
              { id: 'offers' as AdminTab, label: 'العروض والمناسبات', icon: Tag, count: offers.length },
              { id: 'about' as AdminTab, label: 'من نحن والمكتب', icon: Info },
              { id: 'reviews' as AdminTab, label: 'إدارة التقييمات', icon: MessageSquare, count: pendingReviewsCount > 0 ? pendingReviewsCount : (reviews.length || undefined), badgeAlert: pendingReviewsCount > 0 },
              { id: 'messages' as AdminTab, label: 'الرسائل الواردة', icon: Mail, count: unreadMessagesCount > 0 ? unreadMessagesCount : (messages.length || undefined), badgeAlert: unreadMessagesCount > 0 },
              { id: 'settings' as AdminTab, label: 'الإعدادات والهوية', icon: Settings, restricted: currentUser?.role === 'controller' }
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-tab-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`shrink-0 lg:w-full flex items-center justify-between p-3 sm:p-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal ${
                    isSelected
                      ? 'bg-[#C9A24B] text-white shadow-md shadow-[#C9A24B]/20'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span>{item.label}</span>
                    {item.restricted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-normal hidden sm:inline">
                        أدمن فقط
                      </span>
                    )}
                  </div>
                  {item.count !== undefined && (
                    <span className={`text-[11px] sm:text-xs mr-2 px-2 py-0.5 rounded-full font-mono font-bold ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : item.badgeAlert 
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-stone-100 text-[#B38A34]'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Content Area (9 cols) */}
          <div className="lg:col-span-9">
            {/* 1. HOTELS MANAGEMENT TAB */}
            {activeTab === 'hotels' && (
              <div id="admin-hotels-section" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
                  <div>
                    <h2 className="text-xl font-cairo font-bold text-stone-900">قائمة الفنادق المعتمدة</h2>
                    <span className="text-xs text-stone-500">إجمالي: {hotels.length} فندق</span>
                  </div>

                  <button
                    id="admin-add-hotel-btn"
                    onClick={handleOpenAddHotel}
                    className="px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ إضافة فندق جديد</span>
                  </button>
                </div>

                {/* Hotels Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 text-xs font-semibold">
                        <th className="pb-3 pr-2">الفندق</th>
                        <th className="pb-3">المدينة والحي</th>
                        <th className="pb-3">النجوم</th>
                        <th className="pb-3">التصنيفات</th>
                        <th className="pb-3 text-center">البار الرئيسي</th>
                        <th className="pb-3">المسافة</th>
                        <th className="pb-3 pl-2 text-left">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {hotels.map((hotel) => (
                        <tr key={hotel.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-3.5 pr-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={hotel.mainImage}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200"
                              />
                              <div>
                                <strong className="text-stone-900 font-bold block truncate max-w-[180px]">
                                  {hotel.name}
                                </strong>
                                <span className="text-[11px] text-stone-500 font-mono">
                                  {hotel.rating} ★ ({hotel.reviewCount} تقييم)
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className="text-stone-900 font-semibold block">{hotel.city}</span>
                            <span className="text-[11px] text-[#B38A34]">حي {hotel.district}</span>
                          </td>
                          <td className="py-3.5 text-[#B38A34] font-bold">{hotel.stars} نجوم</td>
                          <td className="py-3.5">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {(hotel.categories && hotel.categories.length > 0 ? hotel.categories : ['عادي']).map(c => (
                                <span key={c} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-[#B38A34] border border-stone-200">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleHotelFeatured(hotel)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                                hotel.featured
                                  ? 'bg-[#C9A24B]/15 text-[#B38A34] border-[#C9A24B]/40 hover:bg-[#C9A24B]/25'
                                  : 'bg-stone-100 text-stone-500 border-stone-200 hover:text-stone-800'
                              }`}
                              title={hotel.featured ? 'اضغط لإلغاء التمييز في البار المتغيّر' : 'اضغط لتفعيل الظهور في البار المتغيّر'}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>{hotel.featured ? 'معروض' : 'مخفي'}</span>
                            </button>
                          </td>
                          <td className="py-3.5 text-stone-700 font-mono">{hotel.distanceToHaram} م</td>
                          <td className="py-3.5 pl-2 text-left">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                id={`album-hotel-btn-${hotel.id}`}
                                onClick={() => setAlbumModalHotel(hotel)}
                                className="p-2 rounded-lg bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 transition-colors"
                                title="إدارة ألبوم الصور والفيديوهات"
                              >
                                <Images className="w-4 h-4" />
                              </button>
                              <button
                                id={`edit-hotel-btn-${hotel.id}`}
                                onClick={() => handleEditHotel(hotel)}
                                className="p-2 rounded-lg bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 transition-colors"
                                title="تعديل بيانات الفندق"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                id={`delete-hotel-btn-${hotel.id}`}
                                onClick={() => confirmDeleteHotel(hotel)}
                                className="p-2 rounded-lg bg-stone-100 hover:bg-red-500 hover:text-white text-stone-700 transition-colors"
                                title="حذف الفندق"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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

            {/* 3. USERS MANAGEMENT TAB */}
            {activeTab === 'users' && (
              <div id="admin-users-section">
                {currentUser?.role === 'controller' ? (
                  <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xs text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#B38A34] flex items-center justify-center mx-auto">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-cairo font-bold text-stone-900">قسم مقيد للمدير العام فقط</h3>
                    <p className="text-sm text-stone-600 max-w-md mx-auto">
                      أنت مسجل حالياً بصلاحية <strong>متحكم / مشرف</strong>. إدارة المستخدمين وتغيير الصلاحيات تتطلب تسجيل الدخول بحساب المدير العام (أدمن).
                    </p>
                  </div>
                ) : (
                  <AdminUsersManager
                    users={adminUsers}
                    currentUserId={currentUser?.id}
                    currentUserRole={currentUser?.role || 'admin'}
                    onRefreshUsers={loadUsers}
                    onShowToast={onShowToast}
                  />
                )}
              </div>
            )}

            {/* 2. HERO SLIDES MANAGEMENT TAB */}
            {activeTab === 'slides' && (
              <div id="admin-slides-section">
                <AdminHeroSlidesManager
                  siteSettings={siteSettings}
                  onUpdateSiteSettings={onUpdateSiteSettings}
                  onShowToast={onShowToast}
                />
              </div>
            )}

            {/* 3. OFFERS MANAGEMENT TAB */}
            {activeTab === 'offers' && (
              <div id="admin-offers-section" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
                  <div>
                    <h2 className="text-xl font-cairo font-bold text-stone-900">إدارة العروض والمناسبات</h2>
                    <p className="text-xs text-stone-500 mt-1">
                      يمكنك تفعيل أو إخفاء أي عرض بضغطة زر دون حذف بياناته.
                    </p>
                  </div>

                  <button
                    id="admin-add-offer-btn"
                    onClick={handleOpenAddOffer}
                    className="px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ إضافة عرض أو مناسبة</span>
                  </button>
                </div>

                {/* Offers Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 text-xs font-semibold">
                        <th className="pb-3 pr-2">العرض والمناسبة</th>
                        <th className="pb-3">النوع</th>
                        <th className="pb-3">الخصم</th>
                        <th className="pb-3">الحالة في الموقع</th>
                        <th className="pb-3 pl-2 text-left">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {offers.map((offer) => (
                        <tr key={offer.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-3.5 pr-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={offer.mediaUrl}
                                alt=""
                                className="w-12 h-9 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200"
                              />
                              <div>
                                <strong className="text-stone-900 font-bold block truncate max-w-[200px]">
                                  {offer.title}
                                </strong>
                                <span className="text-[11px] text-stone-500 line-clamp-1 max-w-[240px]">
                                  {offer.shortDescription}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-stone-700">
                            {offer.mediaType === 'video' ? 'فيديو دعائي' : 'بوستر تصميم'}
                          </td>
                          <td className="py-3.5 text-[#B38A34] font-bold">
                            {offer.discountPercentage ? `${offer.discountPercentage}٪` : '-'}
                          </td>
                          <td className="py-3.5">
                            <button
                              onClick={() => handleToggleOfferActive(offer)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                offer.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                              }`}
                            >
                              {offer.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              <span>{offer.isActive ? 'نشط ومعروض' : 'مخفي'}</span>
                            </button>
                          </td>
                          <td className="py-3.5 pl-2 text-left">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditOffer(offer)}
                                className="p-2 rounded-lg bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 transition-colors"
                                title="تعديل العرض"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => confirmDeleteOffer(offer)}
                                className="p-2 rounded-lg bg-stone-100 hover:bg-red-500 hover:text-white text-stone-700 transition-colors"
                                title="حذف العرض"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. ABOUT US & OFFICE MANAGEMENT TAB */}
            {activeTab === 'about' && (
              <div id="admin-about-section">
                <AdminAboutManager
                  aboutUs={settingsForm.aboutUs || siteSettings?.aboutUs || {}}
                  siteLogoUrl={settingsForm.logoUrl || siteSettings?.logoUrl || ''}
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
                      .map((rev) => (
                        <div
                          key={rev.id}
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
              <div id="admin-settings-section" className="space-y-8">
                {/* Brand and Logo Manager */}
                <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                    <div>
                      <h2 className="text-xl font-cairo font-bold text-stone-900">هوية الموقع والشعار العام</h2>
                      <p className="text-xs text-stone-500">
                        التحكم في اسم المنصة، الشعار المرفوع، والروابط الرسمية
                      </p>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="px-6 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1.5">اسم المنصة أو الموقع:</label>
                      <input
                        type="text"
                        value={settingsForm.siteTitle}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, siteTitle: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1.5">الوصف الفرعي (Subtitle):</label>
                      <input
                        type="text"
                        value={settingsForm.siteSubtitle}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, siteSubtitle: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Logo Management */}
                  <div className="pt-4 border-t border-stone-200">
                    <label className="text-xs font-bold text-stone-700 block mb-3">شعار الموقع (Logo):</label>
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
                            <Sparkles className="w-6 h-6" />
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
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                            placeholder="https://example.com/logo.png"
                            className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs font-mono focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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

                {/* Quick Links Manager Card (روابط سريعة في الفوتر) */}
                <div id="admin-quick-links-manager-card" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                  <AdminQuickLinksManager
                    links={settingsForm.quickLinks || []}
                    onChange={handleQuickLinksChange}
                    onShowToast={onShowToast}
                  />
                </div>

                {/* Supabase Database Connection & Migration Card */}
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { step: 1 as const, title: '١. البيانات والحي' },
                  { step: 2 as const, title: '٢. الصور والفيديو' },
                  { step: 3 as const, title: '٣. المرافق والوصف' },
                  { step: 4 as const, title: '٤. روابط الحجز والخرائط' }
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
                            .map(d => (
                              <option key={d.id} value={d.name}>
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">تصنيف النجوم:</label>
                      <select
                        value={hotelForm.stars}
                        onChange={(e) => setHotelForm({ ...hotelForm, stars: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                      >
                        <option value={5}>5 نجوم (فاخر ملكي)</option>
                        <option value={4}>4 نجوم (ديلوكس)</option>
                        <option value={3}>3 نجوم (اقتصادي)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">المسافة عن الحرم (متر):</label>
                      <input
                        type="number"
                        value={hotelForm.distanceToHaram}
                        onChange={(e) => {
                          const dist = parseInt(e.target.value) || 0;
                          setHotelForm({
                            ...hotelForm,
                            distanceToHaram: dist,
                            distanceText: dist === 0 ? 'على ساحة الحرم مباشرة (٠م)' : `${dist} متراً عن ساحة الحرم`
                          });
                        }}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">وقت المشي (دقائق):</label>
                      <input
                        type="number"
                        value={hotelForm.walkingTimeMinutes}
                        onChange={(e) => setHotelForm({ ...hotelForm, walkingTimeMinutes: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">نوع الإطلالة:</label>
                    <select
                      value={hotelForm.location.viewType}
                      onChange={(e) => setHotelForm({
                        ...hotelForm,
                        location: { ...hotelForm.location, viewType: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                    >
                      <option value="إطلالة مباشرة على الكعبة">إطلالة مباشرة على الكعبة</option>
                      <option value="إطلالة على ساحات الحرم">إطلالة على ساحات الحرم</option>
                      <option value="إطلالة على المدينة">إطلالة على المدينة</option>
                      <option value="قريب جداً من الحرم">قريب جداً من الحرم</option>
                    </select>
                  </div>

                  {/* Categories */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                    <label className="text-xs font-bold text-stone-800 block mb-2">
                      تصنيفات الفندق (يمكن اختيار أكثر من تصنيف):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {ALL_HOTEL_CATEGORIES.map((cat) => {
                        const isChecked = (hotelForm.categories || []).includes(cat);
                        return (
                          <div
                            key={cat}
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
                    💡 <strong>روابط الحجز ومنصات الاتصال والخرائط:</strong> تحكم في روابط الحجز الخارجية، موقع الخريطة، وقنوات التواصل المباشرة (واتساب وإيميل) مع إمكانية <strong>تفعيل أو إخفاء أي منها</strong> بضغطة زر.
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
                              رقم التواصل والحجز المباشر عبر الواتساب
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

                      <input
                        type="tel"
                        value={hotelForm.hotelWhatsApp || ''}
                        onChange={(e) => setHotelForm({ ...hotelForm, hotelWhatsApp: e.target.value })}
                        placeholder="+966500000000 (اتركه فارغاً لاستخدام رقم واتساب الموقع الافتراضي)"
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                      />
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

                {hotelFormStep < 4 ? (
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
          <div className="bg-white border border-stone-200 rounded-3xl max-w-xl w-full shadow-2xl my-8 overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <h3 className="font-cairo font-bold text-xl text-stone-900">
                {editingOfferId ? 'تعديل بيانات العرض' : 'إضافة عرض ومناسبة جديدة'}
              </h3>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">عنوان العرض والمناسبة: *</label>
                <input
                  type="text"
                  required
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  placeholder="مثال: باقة رمضان المبارك - خصم الحجز المبكر"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">الوصف المختصر:</label>
                <textarea
                  rows={2}
                  value={offerForm.shortDescription}
                  onChange={(e) => setOfferForm({ ...offerForm, shortDescription: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">التفاصيل الكاملة للعرض:</label>
                <textarea
                  rows={3}
                  value={offerForm.fullDescription}
                  onChange={(e) => setOfferForm({ ...offerForm, fullDescription: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">نوع الوسائط:</label>
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
                  <label className="text-xs font-bold text-stone-700 block mb-1">نسبة الخصم (% اختياري):</label>
                  <input
                    type="number"
                    value={offerForm.discountPercentage || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, discountPercentage: parseInt(e.target.value) || undefined })}
                    placeholder="مثال: 25"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Media Upload & URL Section */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 block">
                    {offerForm.mediaType === 'video' ? 'بوستر / صورة غلاف الفيديو:' : 'بوستر أو صورة العرض الترويجي: *'}
                  </label>

                  <label className="cursor-pointer text-xs font-bold text-[#B38A34] hover:text-[#C9A24B] flex items-center gap-1.5 bg-[#C9A24B]/15 px-3 py-1.5 rounded-xl border border-[#C9A24B]/30 hover:bg-[#C9A24B]/25 transition-all">
                    <UploadCloud className="w-4 h-4" />
                    <span>رفع بوستر من جهازك</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleOfferImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct link or Base64 Input */}
                <div>
                  <input
                    type="text"
                    value={offerForm.mediaUrl}
                    onChange={(e) => setOfferForm({ ...offerForm, mediaUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/... أو ارفع ملف من جهازك"
                    className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] dir-ltr text-left"
                  />
                </div>

                {/* Poster Live Preview */}
                {offerForm.mediaUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-stone-300 bg-stone-900 max-h-48 aspect-video flex items-center justify-center">
                    <img
                      src={offerForm.mediaUrl}
                      alt="معاينة البوستر"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      معاينة البوستر المرفوع
                    </div>
                  </div>
                )}
              </div>

              {offerForm.mediaType === 'video' && (
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">رابط مقطع الفيديو (MP4 أو YouTube):</label>
                  <input
                    type="url"
                    value={offerForm.videoUrl || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, videoUrl: e.target.value })}
                    placeholder="https://.../video.mp4 أو https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] dir-ltr text-left"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">تاريخ انتهاء العرض:</label>
                  <input
                    type="date"
                    value={offerForm.endDate || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">شارة العرض (Badge):</label>
                  <input
                    type="text"
                    value={offerForm.badgeText || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, badgeText: e.target.value })}
                    placeholder="مثال: خصم حصري"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
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
                className="px-6 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs"
              >
                حفظ العرض
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

-- Seed Super Admin (المدير العام الوحيد)
INSERT INTO public.admin_users (id, name, username, email, role, password, status, notes)
VALUES (
    'usr_super_admin_tito',
    'المدير العام (أحمد)',
    'admin',
    'ahmed.tito.h1@gmail.com',
    'admin',
    'admin',
    'active',
    'حساب المدير العام الرئيسي المخول بكامل الصلاحيات وتغيير كلمات المرور وإدارة المشرفين'
)
ON CONFLICT (id) DO NOTHING;

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
    </div>
  );
};
