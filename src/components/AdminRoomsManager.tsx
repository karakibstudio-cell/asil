import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Hotel, 
  RoomTypeItem, 
  MealPlanOption, 
  RoomStatus,
  RoomPackageOption,
  HotelGalleryItem,
  CancellationRuleItem,
  ClosedDateItem,
  PolicyVersionItem,
  BookingRuleSet,
  HotelPolicyItem,
  HotelPricingPeriod
} from '../types';
import { 
  getRoomsFromDb, 
  getCachedRooms,
  getCachedMealPlans,
  getCachedPricingPeriods,
  saveRoomToDb, 
  deleteRoomFromDb, 
  getMealPlansFromDb, 
  saveMealPlansToDb,
  deleteMealPlanFromDb,
  getPackagesFromDb,
  savePackageToDb,
  deletePackageFromDb,
  getRuleSetsFromDb,
  saveRuleSetToDb,
  deleteRuleSetFromDb,
  getPoliciesFromDb,
  savePolicyItemToDb,
  deletePolicyItemFromDb,
  getPricingPeriodsFromDb,
  savePricingPeriodToDb,
  deletePricingPeriodFromDb,
  checkPeriodOverlap,
  DEFAULT_BOOKING_RULE_SETS,
  DEFAULT_HOTEL_POLICIES,
  DEFAULT_PRICING_PERIODS,
  DEFAULT_MEAL_PLANS
} from '../services/bookingService';
import { rebuildHotelAvailability } from '../services/availabilityService';
import { saveHotelToDb, getCurrentAdminUser, recordAuditLog } from '../services/firebase';
import { uploadMediaToSupabase, uploadBase64ToSupabase } from '../services/supabase';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { AdminCalendarMatrix } from './AdminCalendarMatrix';
import { 
  BedDouble, 
  RefreshCw,
  Utensils, 
  Plus, 
  Edit3, 
  Trash2, 
  Key, 
  Check, 
  X, 
  Image as ImageIcon, 
  ShieldCheck, 
  Building2,
  Coffee,
  Sparkles,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Wifi,
  Tv,
  Wind,
  VolumeX,
  Bath,
  Sun,
  Layers,
  Lock,
  HeartHandshake,
  Upload,
  Eye,
  EyeOff,
  Percent,
  History,
  RotateCcw,
  Ban,
  FileText,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  Search,
  CheckSquare,
  BookmarkCheck,
  AlertTriangle
} from 'lucide-react';

interface AdminRoomsManagerProps {
  hotels: Hotel[];
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshHotels?: () => Promise<void>;
  onUpdateHotel?: (hotel: Hotel) => void;
  activeSubTab?: 'rooms' | 'meals' | 'packages' | 'periods-pricing' | 'booking-rules' | 'policies' | 'calendar-grid';
}

// Predefined Luxury Hotel Amenities
const PREDEFINED_ROOM_SERVICES = [
  { id: 'wifi', name: 'واي فاي مجاني فائق السرعة', icon: Wifi },
  { id: 'breakfast', name: 'إفطار بوفيه فاخر مشمول', icon: Coffee },
  { id: 'kaaba_view', name: 'إطلالة مباشرة على الكعبة المشرفة', icon: Sparkles },
  { id: 'haram_view', name: 'إطلالة بانورامية على ساحات الحرم', icon: Building2 },
  { id: 'city_view', name: 'إطلالة على معالم المدينة المقدسة', icon: Sun },
  { id: 'ac', name: 'تكييف مركزي هادئ بتحكم مستقل', icon: Wind },
  { id: 'soundproof', name: 'عزل صوتي متطور للراحة التامة', icon: VolumeX },
  { id: 'smart_tv', name: 'شاشة ذكية 55 بوصة مع قنوات فضائية', icon: Tv },
  { id: 'private_bath', name: 'حمام رخامي خاص مع حوض استحمام ومستلزمات', icon: Bath },
  { id: 'coffee_maker', name: 'آلة قهوة نسبريسو وغلاية شاي', icon: Coffee },
  { id: 'minibar', name: 'ثلاجة وميني بار مجهز', icon: Layers },
  { id: 'safe', name: 'صندوق أمانات رقمي لحفظ المتعلقات', icon: Lock },
  { id: 'room_service', name: 'خدمة الغرف على مدار 24 ساعة', icon: HeartHandshake },
  { id: 'living_area', name: 'صالة جلوس واسعة ومستقلة', icon: Users },
  { id: 'extra_bed', name: 'إمكانية إضافة سرير إضافي عند الطلب', icon: BedDouble },
  { id: 'nonsmoking', name: 'غرفة مخصصة لغير المدخنين', icon: CheckCircle2 }
];

const triggerGlobalAutoSave = (status: 'saving' | 'saved' | 'idle') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('prestige:autosave', { detail: { status } }));
  }
};

const withAutoSave = async <T,>(fn: () => Promise<T>): Promise<T> => {
  triggerGlobalAutoSave('saving');
  try {
    const res = await fn();
    triggerGlobalAutoSave('saved');
    return res;
  } catch (err) {
    triggerGlobalAutoSave('idle');
    throw err;
  }
};

export const AdminRoomsManager: React.FC<AdminRoomsManagerProps> = ({
  hotels,
  onShowToast,
  onRefreshHotels,
  onUpdateHotel,
  activeSubTab
}) => {
  // -------------------------------------------------------------
  // 1. HOTEL SELECTION STATE (Strict per-hotel isolation)
  // -------------------------------------------------------------
  const [selectedHotelId, setSelectedHotelId] = useState<string>(hotels[0]?.id || '');
  const [hotelList, setHotelList] = useState<Hotel[]>(hotels);

  useEffect(() => {
    setHotelList(hotels);
    if (!selectedHotelId && hotels.length > 0) {
      setSelectedHotelId(hotels[0].id);
    }
  }, [hotels]);

  const selectedHotel = hotelList.find(h => h.id === selectedHotelId) || hotelList[0] || null;

  // 7 Tabs including the Calendar Matrix & Yield Management
  const [hotelTab, setHotelTab] = useState<'rooms' | 'meals' | 'packages' | 'periods-pricing' | 'booking-rules' | 'policies' | 'calendar-grid'>(
    activeSubTab || 'calendar-grid'
  );

  useEffect(() => {
    if (activeSubTab && activeSubTab !== hotelTab) {
      setHotelTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Search query state per tab
  const [searchQuery, setSearchQuery] = useState('');

  // Rooms View Mode: table vs cards
  const [roomsViewMode, setRoomsViewMode] = useState<'table' | 'cards'>('table');

  // Multi-Selection State for Bulk Actions in Rooms Table
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [bulkPriceAdjustment, setBulkPriceAdjustment] = useState<number>(10);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState<boolean>(false);

  // Simplified Hotel Selector States
  const [hotelCityFilter, setHotelCityFilter] = useState<'all' | 'makkah' | 'madinah' | 'online'>('all');
  const [showAllHotelsGrid, setShowAllHotelsGrid] = useState<boolean>(false);
  const [isRebuildingAvailability, setIsRebuildingAvailability] = useState<boolean>(false);

  const handleRebuildAvailability = async () => {
    if (!selectedHotelId) return;
    setIsRebuildingAvailability(true);
    try {
      const res = await rebuildHotelAvailability(selectedHotelId);
      if (res.success) {
        if (onShowToast) onShowToast(`تم تحديث عدادات التوفر بنجاح لـ ${res.updatedMonthsCount} شهراً! ⚡`);
      } else {
        if (onShowToast) onShowToast('تم تحديث التوفر.');
      }
    } catch (err: any) {
      if (onShowToast) onShowToast('تعذر تحديث عدادات التوفر: ' + (err.message || 'خطأ'));
    } finally {
      setIsRebuildingAvailability(false);
    }
  };

  // -------------------------------------------------------------
  // 2. DATA STATES - Cache-First Hydration (0ms Load Time)
  // -------------------------------------------------------------
  const [rooms, setRooms] = useState<RoomTypeItem[]>(() => getCachedRooms());
  const [loadingRooms, setLoadingRooms] = useState<boolean>(() => getCachedRooms().length === 0);

  const [mealPlans, setMealPlans] = useState<MealPlanOption[]>(() => getCachedMealPlans(selectedHotelId));
  const [loadingMeals, setLoadingMeals] = useState<boolean>(() => getCachedMealPlans(selectedHotelId).length === 0);

  const [packages, setPackages] = useState<RoomPackageOption[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const [ruleSets, setRuleSets] = useState<BookingRuleSet[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);

  const [policiesList, setPoliciesList] = useState<HotelPolicyItem[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  const [pricingPeriods, setPricingPeriods] = useState<HotelPricingPeriod[]>(() => getCachedPricingPeriods(selectedHotelId));
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(() => getCachedPricingPeriods(selectedHotelId).length === 0);

  // Load all 6 data models with Stale-While-Revalidate
  const loadData = async () => {
    if (rooms.length === 0) setLoadingRooms(true);
    if (mealPlans.length === 0) setLoadingMeals(true);
    if (pricingPeriods.length === 0) setLoadingPeriods(true);
    try {
      const [r, m, p, rules, pols, periods] = await Promise.all([
        getRoomsFromDb(),
        getMealPlansFromDb(selectedHotelId),
        getPackagesFromDb(),
        getRuleSetsFromDb(selectedHotelId),
        getPoliciesFromDb(selectedHotelId),
        getPricingPeriodsFromDb(selectedHotelId)
      ]);
      setRooms(r);
      setMealPlans(m);
      setPackages(p);
      setRuleSets(rules);
      setPoliciesList(pols);
      setPricingPeriods(periods);
    } catch (err) {
      console.error('Error loading room manager data:', err);
      onShowToast('حدث خطأ أثناء تحميل بيانات الفندق', 'error');
    } finally {
      setLoadingRooms(false);
      setLoadingMeals(false);
      setLoadingPackages(false);
      setLoadingRules(false);
      setLoadingPolicies(false);
      setLoadingPeriods(false);
    }
  };

  useEffect(() => {
    loadData();
    setSelectedRoomIds([]);
    setSearchQuery('');
  }, [selectedHotelId]);

  // Filtered hotel list by city or online status
  const filteredHotelList = useMemo(() => {
    return hotelList.filter(h => {
      if (hotelCityFilter === 'makkah') return h.city?.includes('مكة');
      if (hotelCityFilter === 'madinah') return h.city?.includes('المدينة');
      if (hotelCityFilter === 'online') return h.onlineBookingEnabled === true;
      return true;
    });
  }, [hotelList, hotelCityFilter]);

  // Hotel rooms filtered
  const hotelRooms = useMemo(() => {
    return rooms
      .filter(r => r.hotelId === selectedHotelId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [rooms, selectedHotelId]);

  // Filtered rooms by search
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return hotelRooms;
    const q = searchQuery.toLowerCase();
    return hotelRooms.filter(r => 
      r.name.toLowerCase().includes(q) || 
      (r.nameEn && r.nameEn.toLowerCase().includes(q)) ||
      (r.category && r.category.toLowerCase().includes(q))
    );
  }, [hotelRooms, searchQuery]);

  // Hotel packages filtered
  const hotelPackages = useMemo(() => {
    return packages.filter(p => p.hotelId === selectedHotelId);
  }, [packages, selectedHotelId]);

  const filteredPackages = useMemo(() => {
    if (!searchQuery.trim()) return hotelPackages;
    const q = searchQuery.toLowerCase();
    return hotelPackages.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
      (p.roomName && p.roomName.toLowerCase().includes(q))
    );
  }, [hotelPackages, searchQuery]);

  // Hotel pricing periods filtered
  const hotelPeriods = useMemo(() => {
    return pricingPeriods.filter(p => p.hotelId === selectedHotelId);
  }, [pricingPeriods, selectedHotelId]);

  const filteredPeriods = useMemo(() => {
    if (!searchQuery.trim()) return hotelPeriods;
    const q = searchQuery.toLowerCase();
    return hotelPeriods.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.roomTypeName && p.roomTypeName.toLowerCase().includes(q)) ||
      p.startDate.includes(q) ||
      p.endDate.includes(q)
    );
  }, [hotelPeriods, searchQuery]);

  // Filtered meals
  const filteredMeals = useMemo(() => {
    if (!searchQuery.trim()) return mealPlans;
    const q = searchQuery.toLowerCase();
    return mealPlans.filter(m => 
      m.name.toLowerCase().includes(q) ||
      (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
      (m.description && m.description.toLowerCase().includes(q))
    );
  }, [mealPlans, searchQuery]);

  // Currency label
  const currentCurrency = 'ر.س';

  // -------------------------------------------------------------
  // 3. TAB 1: ROOM TYPES MANAGEMENT (نوع الغرفة ومواصفاتها فقط)
  // -------------------------------------------------------------
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState<RoomTypeItem>({
    id: '',
    hotelId: selectedHotelId,
    name: '',
    nameEn: '',
    bedsCount: 2,
    description: '',
    descriptionEn: '',
    category: 'غرفة ثنائية',
    basePrice: 400,
    extraBedPrice: 100,
    extraPersonPrice: 50,
    priceIncludesTax: true,
    totalRooms: 10,
    availableRooms: 10,
    maxGuests: 2,
    bedType: 'سرير كينج كبير',
    roomSize: '35 م²',
    features: ['واي فاي مجاني فائق السرعة', 'شاشة ذكية 55 بوصة مع قنوات فضائية', 'تكييف مركزي هادئ بتحكم مستقل'],
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
    keyPrefix: 'PRS',
    status: 'available',
    isActive: true,
    order: 0
  });
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [showHotelGalleryPicker, setShowHotelGalleryPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pool of hotel photos for room image picker
  const hotelImagesPool = useMemo(() => {
    if (!selectedHotel) return [];
    const pool: string[] = [];
    if (selectedHotel.mainImage) pool.push(selectedHotel.mainImage);
    if (Array.isArray(selectedHotel.galleryImages)) {
      selectedHotel.galleryImages.forEach(img => {
        const url = typeof img === 'string' ? img : (img as any)?.url;
        if (url && !pool.includes(url)) pool.push(url);
      });
    }
    hotelRooms.forEach(rm => {
      (rm.images || []).forEach(img => {
        if (img && !pool.includes(img)) pool.push(img);
      });
    });
    return pool;
  }, [selectedHotel, hotelRooms]);

  const handleOpenAddRoom = () => {
    setEditingRoomId(null);
    setShowHotelGalleryPicker(false);
    setRoomForm({
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      hotelId: selectedHotelId,
      name: '',
      nameEn: '',
      bedsCount: 2,
      description: 'غرفة فندقية أنيقة مجهزة بكافة سبل الراحة والضيافة الراقية',
      descriptionEn: 'Elegant hotel room equipped with modern luxury amenities',
      category: 'غرفة ثنائية',
      basePrice: 400,
      extraBedPrice: 100,
      extraPersonPrice: 50,
      priceIncludesTax: true,
      totalRooms: 10,
      availableRooms: 10,
      maxGuests: 2,
      bedType: 'سريرين مفردين أو سرير كينج',
      roomSize: '35 م²',
      features: [
        'واي فاي مجاني فائق السرعة', 
        'شاشة ذكية 55 بوصة مع قنوات فضائية', 
        'تكييف مركزي هادئ بتحكم مستقل',
        'حمام رخامي خاص مع حوض استحمام ومستلزمات'
      ],
      images: [
        hotelAvailableImages[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
      ],
      keyPrefix: 'PRS',
      status: 'available',
      isActive: true,
      order: hotelRooms.length + 1
    });
    setCustomFeatureInput('');
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: RoomTypeItem) => {
    setEditingRoomId(room.id);
    setShowHotelGalleryPicker(false);
    setRoomForm({
      ...room,
      bedsCount: room.bedsCount || 2,
      description: room.description || '',
      descriptionEn: room.descriptionEn || '',
      images: room.images || []
    });
    setCustomFeatureInput('');
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.name.trim()) {
      onShowToast('يرجى كتابة اسم نوع الغرفة (مثال: مفردة، ثنائية، ثلاثية، رباعية، جناح)', 'error');
      return;
    }

    const effectiveGuests = Number(roomForm.maxGuests) || (
      roomForm.name.includes('خماس') ? 5 :
      roomForm.name.includes('رباع') ? 4 :
      roomForm.name.includes('ثلاث') ? 3 :
      roomForm.name.includes('مفرد') ? 1 : 2
    );

    const updatedRoom: RoomTypeItem = {
      ...roomForm,
      hotelId: selectedHotelId,
      bedsCount: Number(roomForm.bedsCount) || effectiveGuests,
      maxGuests: effectiveGuests,
      basePrice: Number(roomForm.basePrice) || 350,
      totalRooms: Number(roomForm.totalRooms) || 10,
      availableRooms: Number(roomForm.availableRooms) || 10,
      bedType: roomForm.bedType || (
        effectiveGuests === 5 ? '5 أسرة مفردة مريحة' :
        effectiveGuests === 4 ? '4 أسرة مفردة مريحة' :
        effectiveGuests === 3 ? '3 أسرة مفردة مريحة' :
        effectiveGuests === 1 ? 'سرير مفرد مريح' : 'سريرين مفردين أو سرير كينج'
      ),
      features: roomForm.features.length > 0 ? roomForm.features : ['إقامة فندقية فاخرة'],
      images: (roomForm.images && roomForm.images.length > 0) ? roomForm.images : [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
      ]
    };

    // 1. Optimistic instant UI update
    setRooms(prev => {
      const idx = prev.findIndex(r => r.id === updatedRoom.id);
      if (idx >= 0) {
        const cp = [...prev];
        cp[idx] = updatedRoom;
        return cp;
      }
      return [updatedRoom, ...prev];
    });
    setIsRoomModalOpen(false);
    onShowToast(`تم حفظ نوع الغرفة "${updatedRoom.name}" بنجاح ✓`, 'success');

    // 2. Persist to DB in background
    withAutoSave(async () => {
      await saveRoomToDb(updatedRoom);
    }).catch(err => {
      console.error('Failed to save room in DB:', err);
      onShowToast('حدث خطأ أثناء مزامنة الغرفة مع السحابة', 'error');
    });
  };

  const handleToggleRoomActive = async (room: RoomTypeItem) => {
    const updated: RoomTypeItem = {
      ...room,
      isActive: !room.isActive,
      status: (!room.isActive ? 'available' : 'maintenance') as RoomStatus
    };
    setRooms(prev => prev.map(r => r.id === room.id ? updated : r));
    try {
      await withAutoSave(async () => {
        await saveRoomToDb(updated);
      });
      onShowToast(updated.isActive ? `تم إظهار نوع الغرفة "${room.name}" للزوار` : `تم إخفاء نوع الغرفة "${room.name}"`, 'info');
    } catch {
      onShowToast('فشل تحديث حالة الغرفة', 'error');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      await withAutoSave(async () => {
        await deleteRoomFromDb(id);
      });
      setRooms(prev => prev.filter(r => r.id !== id));
      setSelectedRoomIds(prev => prev.filter(x => x !== id));
      onShowToast('تم حذف نوع الغرفة بنجاح', 'success');
      setDeletingRoomId(null);
    } catch {
      onShowToast('فشل حذف الغرفة', 'error');
    }
  };

  // Reorder Rooms (Up / Down)
  const handleMoveRoom = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= hotelRooms.length) return;

    const reordered = [...hotelRooms];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const updatedWithOrder = reordered.map((r, i) => ({ ...r, order: i + 1 }));

    setRooms(prev => {
      const rest = prev.filter(r => r.hotelId !== selectedHotelId);
      return [...rest, ...updatedWithOrder];
    });

    try {
      await withAutoSave(async () => {
        await Promise.all(updatedWithOrder.map(r => saveRoomToDb(r)));
      });
      onShowToast('تم تحديث ترتيب عرض الغرف بنجاح', 'success');
    } catch {
      onShowToast('فشل حفظ ترتيب الغرف', 'error');
    }
  };

  // -------------------------------------------------------------
  // 4. TAB 2: MEALS MANAGEMENT (الوجبات وتحديد نوع الاحتساب)
  // -------------------------------------------------------------
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [mealForm, setMealForm] = useState<MealPlanOption>({
    id: '',
    hotelId: selectedHotelId,
    type: 'breakfast',
    name: '',
    nameEn: '',
    price: 45,
    pricePerPersonPerNight: 45,
    pricingBasis: 'per_person_per_night',
    description: '',
    isActive: true
  });

  const handleOpenAddMeal = () => {
    setEditingMealId(null);
    setMealForm({
      id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      hotelId: selectedHotelId,
      type: 'breakfast',
      name: 'بوفيه إفطار فاخر',
      nameEn: 'Buffet Breakfast',
      price: 45,
      pricePerPersonPerNight: 45,
      pricingBasis: 'per_person_per_night',
      description: 'بوفيه إفطار صباحي مفتوح يضم تشكيلة شرقية وغربية طازجة',
      isActive: true
    });
    setIsMealModalOpen(true);
  };

  const handleOpenEditMeal = (meal: MealPlanOption) => {
    setEditingMealId(meal.id);
    setMealForm({
      ...meal,
      hotelId: selectedHotelId,
      price: meal.price ?? meal.pricePerPersonPerNight ?? 45,
      pricingBasis: meal.pricingBasis || 'per_person_per_night'
    });
    setIsMealModalOpen(true);
  };

  const handleSaveMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealForm.name.trim()) {
      onShowToast('يرجى إدخال اسم الوجبة بالعربية', 'error');
      return;
    }

    const updatedPlan: MealPlanOption = {
      ...mealForm,
      hotelId: selectedHotelId,
      price: Number(mealForm.price) || 0,
      pricePerPersonPerNight: Number(mealForm.price) || 0,
      pricingBasis: mealForm.pricingBasis || 'per_person_per_night'
    };

    let updatedList: MealPlanOption[];
    const idx = mealPlans.findIndex(m => m.id === updatedPlan.id);
    if (idx >= 0) {
      updatedList = [...mealPlans];
      updatedList[idx] = updatedPlan;
    } else {
      updatedList = [...mealPlans, updatedPlan];
    }

    setMealPlans(updatedList);
    try {
      await withAutoSave(async () => {
        await saveMealPlansToDb(updatedList, selectedHotelId);
      });
      onShowToast(`تم حفظ خطة وجبة "${updatedPlan.name}" بنجاح ✓`, 'success');
      setIsMealModalOpen(false);
    } catch {
      onShowToast('فشل حفظ خطة الوجبة', 'error');
    }
  };

  const handleInlineMealEdit = async (mealId: string, field: 'price' | 'pricingBasis' | 'isActive', value: any) => {
    const updated = mealPlans.map(m => {
      if (m.id === mealId) {
        if (field === 'price') {
          return { ...m, price: Number(value), pricePerPersonPerNight: Number(value) };
        }
        return { ...m, [field]: value };
      }
      return m;
    });
    setMealPlans(updated);
    try {
      await withAutoSave(async () => {
        await saveMealPlansToDb(updated, selectedHotelId);
      });
      onShowToast('تم تحديث بيانات الوجبة فوراً ✓', 'info');
    } catch {
      onShowToast('فشل تحديث الوجبة', 'error');
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await withAutoSave(async () => {
        await deleteMealPlanFromDb(mealId, selectedHotelId);
      });
      setMealPlans(prev => prev.filter(m => m.id !== mealId));
      onShowToast('تم حذف خطة الوجبة بنجاح', 'success');
      setDeletingMealId(null);
    } catch {
      onShowToast('فشل حذف الوجبة', 'error');
    }
  };

  // -------------------------------------------------------------
  // 5. TAB 3: PACKAGES MANAGEMENT (الباقات والعروض المخصصة)
  // -------------------------------------------------------------
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [deletingPackageId, setDeletingPackageId] = useState<string | null>(null);
  const [packageForm, setPackageForm] = useState<RoomPackageOption>({
    id: '',
    hotelId: selectedHotelId,
    roomId: '',
    roomTypeId: '',
    roomName: '',
    name: '',
    nameEn: '',
    mealPlanId: 'meal_breakfast',
    mealPlanName: 'شامل بوفيه إفطار فاخر لشخصين',
    nights: 3,
    personsCount: 2,
    totalPrice: 1290,
    pricePerNight: 430,
    priceBasis: 'total_stay',
    startDate: '2026-02-18',
    endDate: '2026-04-30',
    priceIncludesTax: true,
    badgeText: 'الأكثر طلباً ⭐',
    features: ['بوفيه إفطار يومي لشخصين', 'إلغاء مجاني حتى 48 ساعة', 'تسجيل وصول مبكر مجاني حسب الإمكانية'],
    isActive: true
  });

  const handleOpenAddPackage = () => {
    setEditingPackageId(null);
    const defaultRoom = hotelRooms[0];
    const defaultMeal = mealPlans.find(m => m.isActive && m.type === 'breakfast') || mealPlans[0];
    setPackageForm({
      id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      hotelId: selectedHotelId,
      roomId: defaultRoom?.id || '',
      roomTypeId: defaultRoom?.id || '',
      roomName: defaultRoom?.name || 'غرفة ثنائية فاخرة',
      name: 'باقة المعتمر: غرفة ثنائية شاملة بوفيه الإفطار (3 ليالٍ)',
      nameEn: 'Umrah Package: Deluxe Double + Breakfast (3 Nights)',
      mealPlanId: defaultMeal?.id || 'meal_breakfast',
      mealPlanName: defaultMeal?.name || 'شامل بوفيه إفطار فاخر لشخصين',
      nights: 3,
      personsCount: 2,
      totalPrice: (defaultRoom ? defaultRoom.basePrice * 3 : 1200) + 90,
      pricePerNight: Math.round(((defaultRoom ? defaultRoom.basePrice * 3 : 1200) + 90) / 3),
      priceBasis: 'total_stay',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
      priceIncludesTax: true,
      badgeText: 'عرض خاص ⭐',
      features: ['بوفيه إفطار يومي لشخصين', 'إلغاء مجاني حتى 48 ساعة قبل الوصول'],
      isActive: true,
      availableRoomsCount: 5
    });
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg: RoomPackageOption) => {
    setEditingPackageId(pkg.id);
    setPackageForm({
      ...pkg,
      roomTypeId: pkg.roomTypeId || pkg.roomId,
      personsCount: pkg.personsCount || 2,
      priceBasis: pkg.priceBasis || 'total_stay'
    });
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.name.trim()) {
      onShowToast('يرجى كتابة اسم الباقة', 'error');
      return;
    }
    if (!packageForm.startDate || !packageForm.endDate) {
      onShowToast('يرجى تحديد فترة سريان الباقة (من - إلى)', 'error');
      return;
    }
    if (packageForm.startDate > packageForm.endDate) {
      onShowToast('تاريخ بداية الباقة يجب أن يكون قبل تاريخ النهاية', 'error');
      return;
    }

    const assignedRoom = rooms.find(r => r.id === (packageForm.roomTypeId || packageForm.roomId));
    const assignedMeal = mealPlans.find(m => m.id === packageForm.mealPlanId);

    const updatedPkg: RoomPackageOption = {
      ...packageForm,
      hotelId: selectedHotelId,
      roomId: packageForm.roomTypeId || packageForm.roomId || '',
      roomTypeId: packageForm.roomTypeId || packageForm.roomId || '',
      roomName: assignedRoom?.name || packageForm.roomName || 'غرفة فندقية',
      mealPlanName: assignedMeal?.name || packageForm.mealPlanName || 'بدون وجبات',
      personsCount: Number(packageForm.personsCount) || 2,
      priceBasis: packageForm.priceBasis || 'total_stay',
      pricePerNight: packageForm.priceBasis === 'per_night' 
        ? Number(packageForm.totalPrice) 
        : Math.round(Number(packageForm.totalPrice) / (Number(packageForm.nights) || 1))
    };

    try {
      await withAutoSave(async () => {
        await savePackageToDb(updatedPkg);
      });
      setPackages(prev => {
        const idx = prev.findIndex(p => p.id === updatedPkg.id);
        if (idx >= 0) {
          const cp = [...prev];
          cp[idx] = updatedPkg;
          return cp;
        }
        return [updatedPkg, ...prev];
      });
      onShowToast(`تم حفظ وتحديث باقة "${updatedPkg.name}" بنجاح ✓`, 'success');
      setIsPackageModalOpen(false);
    } catch (err) {
      console.error(err);
      onShowToast('فشل حفظ الباقة', 'error');
    }
  };

  const handleTogglePackageStatus = async (pkg: RoomPackageOption) => {
    const updated = { ...pkg, isActive: !pkg.isActive };
    try {
      await withAutoSave(async () => {
        await savePackageToDb(updated);
      });
      setPackages(prev => prev.map(p => p.id === pkg.id ? updated : p));
      onShowToast(updated.isActive ? 'تم تفعيل الباقة للزوار أونلاين' : 'تم إيقاف الباقة مؤقتاً', 'info');
    } catch {
      onShowToast('فشل تحديث حالة الباقة', 'error');
    }
  };

  const handleDeletePackage = async (pkgId: string) => {
    try {
      await withAutoSave(async () => {
        await deletePackageFromDb(pkgId);
      });
      setPackages(prev => prev.filter(p => p.id !== pkgId));
      onShowToast('تم حذف الباقة بنجاح', 'success');
      setDeletingPackageId(null);
    } catch {
      onShowToast('فشل حذف الباقة', 'error');
    }
  };

  // -------------------------------------------------------------
  // 6. TAB 4: PERIODS & PRICES MANAGEMENT (الفترات والأسعار ومنع التداخل)
  // -------------------------------------------------------------
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [deletingPeriodId, setDeletingPeriodId] = useState<string | null>(null);
  const [periodOverlapError, setPeriodOverlapError] = useState<string | null>(null);
  const [enableCustomDistribution, setEnableCustomDistribution] = useState(false);
  const [periodForm, setPeriodForm] = useState<HotelPricingPeriod>({
    id: '',
    hotelId: selectedHotelId,
    roomTypeId: 'all',
    roomTypeName: 'جميع أنواع الغرف المتاحة',
    name: 'موسم شهر رمضان المبارك',
    nameEn: 'Ramadan Holy Season',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    availableRooms: 10,
    roomOnlyPrice: 400,
    extraWithMeal: 0,
    extraWithoutMeal: 400,
    ruleSetId: 'rules_default',
    policyId: 'policy_flexible',
    isActive: true,
    minStayNights: 1
  });

  const handleOpenAddPeriod = () => {
    setEditingPeriodId(null);
    setPeriodOverlapError(null);
    const defaultRule = ruleSets.find(r => r.isDefault) || ruleSets[0];
    const defaultPolicy = policiesList.find(p => p.isDefault) || policiesList[0];

    const initialDist: Record<string, number> = {};
    hotelRooms.forEach(rm => {
      initialDist[rm.id] = 2;
    });

    setPeriodForm({
      id: `period_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      hotelId: selectedHotelId,
      roomTypeId: 'all',
      roomTypeName: 'جميع أنواع الغرف المتاحة',
      name: 'فترة تسعير مخصصة',
      nameEn: 'Special Pricing Period',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      availableRooms: hotelRooms.length > 0 ? hotelRooms.length * 2 : 10,
      roomDistribution: initialDist,
      roomOnlyPrice: 400,
      extraWithMeal: 0,
      extraWithoutMeal: 400,
      ruleSetId: defaultRule?.id || 'rules_default',
      policyId: defaultPolicy?.id || 'policy_flexible',
      isActive: true,
      minStayNights: 1
    });
    setEnableCustomDistribution(false);
    setIsPeriodModalOpen(true);
  };

  const handleOpenEditPeriod = (period: HotelPricingPeriod) => {
    setEditingPeriodId(period.id);
    setPeriodOverlapError(null);
    setPeriodForm({ ...period });
    setEnableCustomDistribution(Boolean(period.roomDistribution && Object.keys(period.roomDistribution).length > 0));
    setIsPeriodModalOpen(true);
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setPeriodOverlapError(null);

    if (!periodForm.name.trim()) {
      setPeriodOverlapError('يرجى كتابة اسم الفترة أو الموسم');
      return;
    }
    if (!periodForm.startDate || !periodForm.endDate) {
      setPeriodOverlapError('يرجى إدخال تاريخ البداية والنهاية');
      return;
    }
    if (periodForm.startDate >= periodForm.endDate) {
      setPeriodOverlapError(`خطأ في التواريخ: تاريخ البداية (${periodForm.startDate}) يجب أن يكون قبل تاريخ النهاية (${periodForm.endDate})`);
      return;
    }

    // Overlap Check strictly per room type
    const overlapConflict = checkPeriodOverlap({
      startDate: periodForm.startDate,
      endDate: periodForm.endDate,
      roomTypeId: periodForm.roomTypeId || 'all',
      id: editingPeriodId || undefined
    }, hotelPeriods);

    if (overlapConflict) {
      const msg = `تعارض وتداخل في التواريخ: الفترة الجديدة تتقاطع مع فترة قائمة "${overlapConflict.name}" (من ${overlapConflict.startDate} إلى ${overlapConflict.endDate}) لنفس الفندق/نوع الغرفة. يرجى تعديل التواريخ لمنع التداخل.`;
      setPeriodOverlapError(msg);
      return;
    }

    const assignedRoom = periodForm.roomTypeId === 'all' 
      ? null 
      : rooms.find(r => r.id === periodForm.roomTypeId);

    const updatedPeriod: HotelPricingPeriod = {
      ...periodForm,
      hotelId: selectedHotelId,
      roomTypeId: periodForm.roomTypeId || 'all',
      roomTypeName: periodForm.roomTypeId === 'all' ? 'جميع أنواع الغرف المتاحة' : (assignedRoom?.name || periodForm.roomTypeName || 'غرفة فندقية'),
      roomOnlyPrice: Number(periodForm.roomOnlyPrice) || 0,
      extraWithMeal: Number(periodForm.extraWithMeal) || 0,
      extraWithoutMeal: Number(periodForm.roomOnlyPrice) || 0,
      availableRooms: Number(periodForm.availableRooms) || 1,
      roomDistribution: enableCustomDistribution ? (periodForm.roomDistribution || {}) : undefined,
      minStayNights: Number(periodForm.minStayNights) || 1
    };

    try {
      await savePricingPeriodToDb(updatedPeriod);
      setPricingPeriods(prev => {
        const idx = prev.findIndex(p => p.id === updatedPeriod.id);
        if (idx >= 0) {
          const cp = [...prev];
          cp[idx] = updatedPeriod;
          return cp;
        }
        return [updatedPeriod, ...prev];
      });

      onShowToast(`تم حفظ فترة التسعير "${updatedPeriod.name}" بنجاح ✓`, 'success');
      setIsPeriodModalOpen(false);
    } catch {
      onShowToast('فشل حفظ فترة التسعير', 'error');
    }
  };

  const handleInlinePeriodEdit = async (periodId: string, field: 'roomOnlyPrice' | 'availableRooms' | 'isActive', value: any) => {
    const target = pricingPeriods.find(p => p.id === periodId);
    if (!target) return;

    const updated: HotelPricingPeriod = {
      ...target,
      [field]: value
    };

    setPricingPeriods(prev => prev.map(p => p.id === periodId ? updated : p));
    try {
      await savePricingPeriodToDb(updated);
      onShowToast('تم تحديث السعر / الطاقة الاستيعابية فوراً ✓', 'info');
    } catch {
      onShowToast('فشل التحديث الفوري', 'error');
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    try {
      await deletePricingPeriodFromDb(periodId);
      setPricingPeriods(prev => prev.filter(p => p.id !== periodId));
      onShowToast('تم حذف فترة التسعير بنجاح', 'success');
      setDeletingPeriodId(null);
    } catch {
      onShowToast('فشل حذف الفترة', 'error');
    }
  };

  // -------------------------------------------------------------
  // 7. TAB 5: BOOKING RULES MANAGEMENT (مجموعات قواعد الحجز المسماة)
  // -------------------------------------------------------------
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<BookingRuleSet>({
    id: '',
    hotelId: selectedHotelId,
    name: '',
    nameEn: '',
    minRooms: 1,
    maxRooms: 10,
    minNights: 1,
    maxNights: 30,
    isDefault: false,
    description: ''
  });

  const handleOpenAddRule = () => {
    setEditingRuleId(null);
    setRuleForm({
      id: `rules_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      hotelId: selectedHotelId,
      name: 'قواعد حجز جديدة',
      nameEn: 'New Booking Rules',
      minRooms: 1,
      maxRooms: 10,
      minNights: 1,
      maxNights: 30,
      isDefault: ruleSets.length === 0,
      description: 'حد أدنى ليلة واحدة وغرفة واحدة'
    });
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRule = (rule: BookingRuleSet) => {
    setEditingRuleId(rule.id);
    setRuleForm({ ...rule, hotelId: selectedHotelId });
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.name.trim()) {
      onShowToast('يرجى إدخال اسم مجموعة القواعد', 'error');
      return;
    }
    if (ruleForm.minNights > ruleForm.maxNights) {
      onShowToast('الحد الأدنى لليالي يجب أن يكون أقل من أو يساوي الحد الأقصى', 'error');
      return;
    }
    if (ruleForm.minRooms > ruleForm.maxRooms) {
      onShowToast('الحد الأدنى للغرف يجب أن يكون أقل من أو يساوي الحد الأقصى', 'error');
      return;
    }

    const updatedRule: BookingRuleSet = {
      ...ruleForm,
      hotelId: selectedHotelId,
      minRooms: Number(ruleForm.minRooms) || 1,
      maxRooms: Number(ruleForm.maxRooms) || 10,
      minNights: Number(ruleForm.minNights) || 1,
      maxNights: Number(ruleForm.maxNights) || 30
    };

    try {
      await saveRuleSetToDb(updatedRule);
      setRuleSets(prev => {
        const idx = prev.findIndex(r => r.id === updatedRule.id);
        if (idx >= 0) {
          const cp = [...prev];
          cp[idx] = updatedRule;
          return cp;
        }
        return [updatedRule, ...prev];
      });
      onShowToast(`تم حفظ مجموعة قواعد الحجز "${updatedRule.name}" بنجاح ✓`, 'success');
      setIsRuleModalOpen(false);
    } catch {
      onShowToast('فشل حفظ قواعد الحجز', 'error');
    }
  };

  const handleSetDefaultRule = async (ruleId: string) => {
    const updatedList = ruleSets.map(r => ({
      ...r,
      isDefault: r.id === ruleId
    }));
    setRuleSets(updatedList);
    try {
      await Promise.all(updatedList.map(r => saveRuleSetToDb(r)));
      onShowToast('تم تعيين مجموعة القواعد كافتراضية للفندق ✓', 'success');
    } catch {
      onShowToast('فشل تعيين القاعدة الافتراضية', 'error');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteRuleSetFromDb(ruleId);
      setRuleSets(prev => prev.filter(r => r.id !== ruleId));
      onShowToast('تم حذف مجموعة القواعد بنجاح', 'success');
      setDeletingRuleId(null);
    } catch {
      onShowToast('فشل حذف مجموعة القواعد', 'error');
    }
  };

  // -------------------------------------------------------------
  // 8. TAB 6: POLICIES & TERMS MANAGEMENT (السياسات والشروط وقواعد الإلغاء الهيكلية وإصداراتها)
  // -------------------------------------------------------------
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);
  const [viewingVersionHistoryPolicy, setViewingVersionHistoryPolicy] = useState<HotelPolicyItem | null>(null);

  const [policyForm, setPolicyForm] = useState<HotelPolicyItem>({
    id: '',
    hotelId: selectedHotelId,
    name: 'السياسة القياسية المرنة',
    nameEn: 'Standard Flexible Policy',
    isDefault: false,
    policyTextAr: 'إلغاء مجاني ومرن متاح بالكامل حتى 48 ساعة قبل موعد تسجيل الوصول.',
    policyTextEn: 'Free and flexible cancellation up to 48 hours before check-in.',
    termsTextAr: 'يلزم تقديم أصل الهوية الوطنية أو جواز السفر لجميع النزلاء المقيمين عند تسجيل الوصول.',
    termsTextEn: 'Original national ID or passport required for all guests upon check-in.',
    cancellationRules: [
      {
        id: 'crule_1',
        daysBeforeCheckIn: 2,
        feePercentage: 0,
        descriptionAr: 'إلغاء مجاني كامل واسترداد 100% حتى 48 ساعة قبل موعد الوصول',
        descriptionEn: 'Free cancellation up to 48 hours prior'
      },
      {
        id: 'crule_2',
        daysBeforeCheckIn: 0,
        feePercentage: 100,
        descriptionAr: 'خصم قيمة الليلة الأولى في حال الإلغاء المتأخر أو عدم الحضور',
        descriptionEn: 'First night fee on late cancellation or no-show'
      }
    ],
    checkInTime: '16:00 عصراً (Check-in)',
    checkOutTime: '12:00 ظهراً (Check-out)',
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  const [newRuleDays, setNewRuleDays] = useState<number>(3);
  const [newRuleFee, setNewRuleFee] = useState<number>(0);
  const [newRuleDescAr, setNewRuleDescAr] = useState<string>('');
  const [newRuleDescEn, setNewRuleDescEn] = useState<string>('');

  const handleOpenAddPolicy = () => {
    setEditingPolicyId(null);
    setPolicyForm({
      id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      hotelId: selectedHotelId,
      name: 'سياسة حجز وإلغاء جديدة',
      nameEn: 'New Booking & Cancellation Policy',
      isDefault: policiesList.length === 0,
      policyTextAr: 'إلغاء مجاني ومرن متاح حتى 48 ساعة قبل موعد تسجيل الوصول.',
      policyTextEn: 'Free cancellation up to 48 hours before check-in.',
      termsTextAr: 'يلزم تقديم أصل الهوية الوطنية أو الإقامة أو جواز السفر عند الوصول.',
      termsTextEn: 'Original national ID or passport required at check-in.',
      cancellationRules: [
        {
          id: `crule_${Date.now()}_1`,
          daysBeforeCheckIn: 2,
          feePercentage: 0,
          descriptionAr: 'إلغاء مجاني كامل حتى يومين قبل الوصول',
          descriptionEn: 'Free cancellation up to 2 days before check-in'
        }
      ],
      checkInTime: '16:00 عصراً (Check-in)',
      checkOutTime: '12:00 ظهراً (Check-out)',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setNewRuleDescAr('');
    setNewRuleDescEn('');
    setIsPolicyModalOpen(true);
  };

  const handleOpenEditPolicy = (policy: HotelPolicyItem) => {
    setEditingPolicyId(policy.id);
    setPolicyForm({ ...policy, hotelId: selectedHotelId });
    setNewRuleDescAr('');
    setNewRuleDescEn('');
    setIsPolicyModalOpen(true);
  };

  const handleAddCancellationRuleToForm = () => {
    if (!newRuleDescAr.trim()) {
      onShowToast('يرجى كتابة وصف قاعدة الإلغاء', 'error');
      return;
    }

    const newRule: CancellationRuleItem = {
      id: `crule_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      daysBeforeCheckIn: Number(newRuleDays) || 0,
      feePercentage: Number(newRuleFee) || 0,
      descriptionAr: newRuleDescAr.trim(),
      descriptionEn: newRuleDescEn.trim() || undefined
    };

    setPolicyForm(prev => ({
      ...prev,
      cancellationRules: [...(prev.cancellationRules || []), newRule].sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
    }));

    setNewRuleDescAr('');
    setNewRuleDescEn('');
    onShowToast('تمت إضافة شرط الإلغاء إلى السياسة', 'info');
  };

  const handleRemoveCancellationRule = (ruleId: string) => {
    setPolicyForm(prev => ({
      ...prev,
      cancellationRules: (prev.cancellationRules || []).filter(r => r.id !== ruleId)
    }));
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.name.trim()) {
      onShowToast('يرجى إدخال اسم السياسة', 'error');
      return;
    }

    const currentUser = getCurrentAdminUser();
    const currentVer = policyForm.version || 1;
    const isEdit = !!editingPolicyId;
    const nextVer = isEdit ? currentVer + 1 : 1;

    // Snapshot version history for immutability
    const historyEntry: PolicyVersionItem = {
      version: currentVer,
      updatedAt: Date.now(),
      updatedBy: currentUser?.name || currentUser?.username || 'مشرف النظام',
      summary: `تحديث بنود وشروط السياسة "${policyForm.name}" (النسخة v${currentVer}.0)`,
      snapshot: { ...policyForm }
    };

    const updatedHistory = isEdit 
      ? [historyEntry, ...(policyForm.versionHistory || [])].slice(0, 15)
      : (policyForm.versionHistory || []);

    const updatedPolicy: HotelPolicyItem = {
      ...policyForm,
      hotelId: selectedHotelId,
      version: nextVer,
      versionHistory: updatedHistory,
      updatedAt: Date.now()
    };

    try {
      await savePolicyItemToDb(updatedPolicy);
      setPoliciesList(prev => {
        const idx = prev.findIndex(p => p.id === updatedPolicy.id);
        if (idx >= 0) {
          const cp = [...prev];
          cp[idx] = updatedPolicy;
          return cp;
        }
        return [updatedPolicy, ...prev];
      });

      onShowToast(`تم حفظ السياسة "${updatedPolicy.name}" واعتماد الإصدار v${nextVer}.0 بنجاح ✓`, 'success');
      setIsPolicyModalOpen(false);
    } catch {
      onShowToast('فشل حفظ السياسة', 'error');
    }
  };

  const handleSetDefaultPolicy = async (policyId: string) => {
    const updatedList = policiesList.map(p => ({
      ...p,
      isDefault: p.id === policyId
    }));
    setPoliciesList(updatedList);
    try {
      await Promise.all(updatedList.map(p => savePolicyItemToDb(p)));
      onShowToast('تم تعيين السياسة كافتراضية للفندق ✓', 'success');
    } catch {
      onShowToast('فشل تعيين السياسة الافتراضية', 'error');
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await deletePolicyItemFromDb(policyId);
      setPoliciesList(prev => prev.filter(p => p.id !== policyId));
      onShowToast('تم حذف السياسة بنجاح', 'success');
      setDeletingPolicyId(null);
    } catch {
      onShowToast('فشل حذف السياسة', 'error');
    }
  };

  const handleRestorePolicyVersion = async (targetPolicy: HotelPolicyItem, vItem: PolicyVersionItem) => {
    if (!vItem.snapshot) return;
    const restored: HotelPolicyItem = {
      ...(vItem.snapshot as HotelPolicyItem),
      version: (targetPolicy.version || 1) + 1,
      versionHistory: targetPolicy.versionHistory,
      updatedAt: Date.now()
    };

    try {
      await savePolicyItemToDb(restored);
      setPoliciesList(prev => prev.map(p => p.id === targetPolicy.id ? restored : p));
      setViewingVersionHistoryPolicy(null);
      onShowToast(`تم استرجاع بيانات الإصدار v${vItem.version}.0 بنجاح وتوليد الإصدار v${restored.version}.0 ✓`, 'success');
    } catch {
      onShowToast('فشل استرجاع الإصدار', 'error');
    }
  };

  // -------------------------------------------------------------
  // 9. IMAGES & GALLERY HELPERS
  // -------------------------------------------------------------
  const hotelAvailableImages = useMemo(() => {
    if (!selectedHotel) return [];
    const list: string[] = [];
    if (selectedHotel.mainImage) list.push(selectedHotel.mainImage);
    if (Array.isArray(selectedHotel.galleryImages)) {
      selectedHotel.galleryImages.forEach(img => {
        const url = typeof img === 'string' ? img : (img as HotelGalleryItem)?.url;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    return list;
  }, [selectedHotel]);

  const handleDeviceImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    const uploadedUrls: string[] = [];

    for (const file of fileList) {
      if (file.size > 20 * 1024 * 1024) {
        onShowToast(`تم تخطي الملف "${file.name}" لأن حجمه يتجاوز 20 ميجابايت`, 'error');
        continue;
      }

      try {
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const optimized = await optimizeImageFile(file, {
          maxWidth: 1400,
          maxHeight: 1000,
          forcePng: isPng
        });

        const cdnUrl = await uploadBase64ToSupabase(optimized, 'rooms');
        if (cdnUrl) {
          uploadedUrls.push(cdnUrl);
        } else {
          const res = await uploadMediaToSupabase(file, 'images');
          if (res?.url) uploadedUrls.push(res.url);
        }
      } catch (err) {
        console.warn('Failed to upload room image:', file.name, err);
      }
    }

    if (uploadedUrls.length > 0) {
      setRoomForm(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls]
      }));
      onShowToast(`تم رفع وحفظ (${uploadedUrls.length}) صور بنجاح للغرفة ☁️`, 'success');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSetCoverImage = (index: number) => {
    setRoomForm(prev => {
      const current = prev.images || [];
      if (index === 0 || index >= current.length) return prev;
      const target = current[index];
      const rest = current.filter((_, i) => i !== index);
      return { ...prev, images: [target, ...rest] };
    });
    onShowToast('تم تعيين الصورة كغلاف رئيسي للغرفة', 'info');
  };

  const handleRemoveRoomImage = (index: number) => {
    setRoomForm(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const handleToggleService = (serviceName: string) => {
    setRoomForm(prev => {
      const exists = prev.features.includes(serviceName);
      return {
        ...prev,
        features: exists ? prev.features.filter(f => f !== serviceName) : [...prev.features, serviceName]
      };
    });
  };

  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFeatureInput.trim()) return;
    if (!roomForm.features.includes(customFeatureInput.trim())) {
      setRoomForm(prev => ({
        ...prev,
        features: [...prev.features, customFeatureInput.trim()]
      }));
    }
    setCustomFeatureInput('');
  };

  const handleToggleHotelActiveInRooms = async (e: React.MouseEvent, hotel: Hotel) => {
    e.stopPropagation();
    const newActive = hotel.isActive === false ? true : false;
    const updated: Hotel = { 
      ...hotel, 
      isActive: newActive,
      onlineBookingEnabled: newActive ? (hotel.onlineBookingEnabled === true) : false
    };

    setHotelList(prev => prev.map(h => h.id === hotel.id ? updated : h));
    onUpdateHotel?.(updated);
    onShowToast(newActive ? `تم تفعيل فندق "${hotel.name}" وظهوره للزوار بالموقع ✓` : `تم إخفاء فندق "${hotel.name}" عن الزوار ✕`, 'success');

    try {
      await saveHotelToDb(updated);
      onRefreshHotels?.();
    } catch (err) {
      console.error(err);
      setHotelList(hotels);
      onShowToast('حدث خطأ أثناء حفظ حالة الفندق', 'error');
    }
  };

  const handleToggleHotelOnlineBookingInRooms = async (e: React.MouseEvent, hotel: Hotel) => {
    e.stopPropagation();
    const newOnline = hotel.onlineBookingEnabled === true ? false : true;
    const updated: Hotel = { 
      ...hotel, 
      onlineBookingEnabled: newOnline, 
      isActive: newOnline ? true : hotel.isActive 
    };

    setHotelList(prev => prev.map(h => h.id === hotel.id ? updated : h));
    onUpdateHotel?.(updated);
    onShowToast(newOnline ? `تم فتح وتفعيل الحجز أونلاين لفندق "${hotel.name}" بالبوابة ✓` : `تم تحويل فندق "${hotel.name}" لحجز مباشر عبر واتساب فقط`, 'success');

    try {
      await saveHotelToDb(updated);
      onRefreshHotels?.();
    } catch (err) {
      console.error(err);
      setHotelList(hotels);
      onShowToast('حدث خطأ أثناء حفظ حالة الحجز أونلاين', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. COMPACT HOTEL SELECTOR & CONTROL BAR (SIMPLIFIED LUXURY DESIGN)        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Header with Title and Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-xl font-bold font-cairo text-stone-900 flex items-center gap-2">
              <span>إدارة الإتاحة والأسعار والغرف</span>
              <span className="text-xs font-bold text-[#B38A34] bg-[#C9A24B]/15 px-2.5 py-0.5 rounded-full">
                {hotelList.length} فنادق
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              حدد الفندق للتحكم الفوري في إتاحته أونلاين، مواسم الأسعار، أنواع الغرف، وقواعد الحجز.
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-100/90 border border-stone-200 self-start md:self-auto overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setHotelCityFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                hotelCityFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              الكل ({hotelList.length})
            </button>
            <button
              type="button"
              onClick={() => setHotelCityFilter('makkah')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                hotelCityFilter === 'makkah'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              مكة المكرمة
            </button>
            <button
              type="button"
              onClick={() => setHotelCityFilter('madinah')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                hotelCityFilter === 'madinah'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              المدينة المنورة
            </button>
            <button
              type="button"
              onClick={() => setHotelCityFilter('online')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                hotelCityFilter === 'online'
                  ? 'bg-[#C9A24B] text-white shadow-xs'
                  : 'text-amber-800 hover:text-amber-900'
              }`}
            >
              مفعّل أونلاين ⚡
            </button>
          </div>
        </div>

        {/* Selected Hotel Interactive Control Bar */}
        {selectedHotel && (
          <div className="bg-stone-50/80 rounded-2xl border border-stone-200/90 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
              <label className="text-xs font-bold text-stone-500 whitespace-nowrap shrink-0">
                الفندق النشط حالياً:
              </label>

              {/* Styled Dropdown Selector */}
              <div className="relative flex-1 min-w-0 max-w-xl">
                <select
                  value={selectedHotelId}
                  onChange={(e) => setSelectedHotelId(e.target.value)}
                  className="w-full px-4 py-2.5 pl-9 rounded-xl bg-white border border-stone-300 hover:border-[#C9A24B] text-stone-900 font-bold text-sm focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 focus:outline-none transition-all cursor-pointer shadow-2xs font-cairo"
                >
                  {filteredHotelList.map((h) => {
                    const isOnline = h.onlineBookingEnabled === true;
                    const isActive = h.isActive !== false;
                    return (
                      <option key={h.id} value={h.id}>
                        {h.name} • {h.city} {isOnline ? '⚡ (أونلاين)' : '💬 (واتساب)'} {!isActive ? '🚫 (مخفي)' : ''}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Direct 1-Click Action Toggles for Selected Hotel */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Toggle 1: Visibility to Clients (إظهار / إخفاء) */}
              <button
                type="button"
                onClick={(e) => selectedHotel && handleToggleHotelActiveInRooms(e, selectedHotel)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-102 active:scale-98 ${
                  selectedHotel.isActive !== false
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                    : 'bg-stone-200 text-stone-600 border border-stone-300 hover:bg-stone-300'
                }`}
                title={selectedHotel.isActive !== false ? 'الفندق مفعّل ومعروض للزوار بالموقع (اضغط لإخفائه)' : 'الفندق مخفي عن الزوار (اضغط لإظهاره)'}
              >
                {selectedHotel.isActive !== false ? <Eye className="w-3.5 h-3.5 text-emerald-700" /> : <EyeOff className="w-3.5 h-3.5 text-stone-500" />}
                <span>{selectedHotel.isActive !== false ? 'معروض للزوار بالموقع ✓' : 'مخفي عن الزوار ✕'}</span>
              </button>

              {/* Toggle 2: Online Booking Mode vs WhatsApp (حجز أونلاين بالبوابة / واتساب) */}
              <button
                type="button"
                onClick={(e) => selectedHotel && handleToggleHotelOnlineBookingInRooms(e, selectedHotel)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-102 active:scale-98 ${
                  selectedHotel.onlineBookingEnabled === true
                    ? 'bg-[#C9A24B] text-white hover:bg-[#B38A34]'
                    : 'bg-stone-200 text-stone-700 border border-stone-300 hover:bg-stone-300'
                }`}
                title={selectedHotel.onlineBookingEnabled === true ? 'الحجز متاح إلكترونياً أونلاين عبر البوابة (اضغط للتحويل لواتساب)' : 'الحجز عبر واتساب فقط (اضغط لتفعيل الحجز أونلاين)'}
              >
                <BedDouble className={`w-3.5 h-3.5 ${selectedHotel.onlineBookingEnabled === true ? 'text-white' : 'text-stone-500'}`} />
                <span>{selectedHotel.onlineBookingEnabled === true ? 'حجز أونلاين بالبوابة (مفعّل) ✓' : 'حجز مباشر عبر واتساب فقط'}</span>
              </button>

              {/* Button 3: Rebuild Fast Availability Counters */}
              <button
                type="button"
                disabled={isRebuildingAvailability}
                onClick={handleRebuildAvailability}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 disabled:opacity-50"
                title="إعادة احتساب وتحديث عدادات التوفر الشهرية للغرف (Fast Availability Engine)"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#C9A24B] ${isRebuildingAvailability ? 'animate-spin' : ''}`} />
                <span>{isRebuildingAvailability ? 'جاري التحديث...' : 'تحديث عدادات التوفر ⚡'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Horizontal Quick-Switch Hotel Pills Row */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span>التنقل السريع بين الفنادق بنقرة واحدة:</span>
            <button
              type="button"
              onClick={() => setShowAllHotelsGrid(prev => !prev)}
              className="text-[#B38A34] hover:underline cursor-pointer font-bold flex items-center gap-1"
            >
              <span>{showAllHotelsGrid ? 'إخفاء الشبكة الكاملة ▲' : `عرض كشبكة بطاقات (${filteredHotelList.length}) ▼`}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            {filteredHotelList.map((h) => {
              const isSel = h.id === selectedHotelId;
              const isOnline = h.onlineBookingEnabled === true;
              const isAct = h.isActive !== false;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHotelId(h.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 ${
                    isSel
                      ? 'bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white ring-2 ring-[#C9A24B]/30'
                      : isAct
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/80'
                      : 'bg-stone-100 text-stone-400 border border-dashed border-stone-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-stone-400'}`} />
                  <span className="truncate max-w-[150px]">{h.name}</span>
                  {isOnline && <span className="text-[10px] opacity-90">⚡</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Collapsible Full Grid */}
        {showAllHotelsGrid && (
          <div className="pt-3 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-fadeIn">
            {filteredHotelList.map((h) => {
              const isSelected = h.id === selectedHotelId;
              const hRoomsCount = rooms.filter(r => r.hotelId === h.id).length;
              const hPeriodsCount = pricingPeriods.filter(p => p.hotelId === h.id).length;
              const isHotelActive = h.isActive !== false;
              const isOnlineBooking = h.onlineBookingEnabled === true;

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHotelId(h.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-amber-50/80 border-[#C9A24B] shadow-sm ring-2 ring-[#C9A24B]/30' 
                      : 'bg-white border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[10px] text-stone-400 font-bold">{h.city} • {h.district}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleToggleHotelActiveInRooms(e, h)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isHotelActive 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isHotelActive ? <Eye className="w-3 h-3 text-emerald-700" /> : <EyeOff className="w-3 h-3 text-stone-500" />}
                          <span>{isHotelActive ? 'معروض' : 'مخفي'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleToggleHotelOnlineBookingInRooms(e, h)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isOnlineBooking 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          <BedDouble className={`w-3 h-3 ${isOnlineBooking ? 'text-amber-800' : 'text-stone-500'}`} />
                          <span>{isOnlineBooking ? 'أونلاين ✓' : 'واتساب'}</span>
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 mt-2">{h.name}</h4>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                    <span className="text-stone-400 font-medium">
                      {hRoomsCount} غرف • {hPeriodsCount} فترات
                    </span>
                    <span className={`font-bold flex items-center gap-0.5 ${isSelected ? 'text-[#B38A34]' : 'text-stone-400'}`}>
                      <span>{isSelected ? 'النشط' : 'اختيار'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 6 CLEAR TABS BAR                                                   */}
      {/* ========================================================================= */}
      {selectedHotel && (
        <div className="space-y-4">
          <div className="p-4 bg-stone-900 text-white rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/20 text-[#E6C673] flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">الفندق المحدد للتهيئة:</span>
                <h3 className="text-base font-bold text-white">{selectedHotel.name} ({selectedHotel.city})</h3>
              </div>
            </div>

            {/* 6 Tabs as specified */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto no-scrollbar">
              {[
                { id: 'calendar-grid' as const, label: '⚡ تقويم الإتاحة والأسعار الشبكي (Yield Matrix)', icon: LayoutGrid },
                { id: 'rooms' as const, label: '1. أنواع الغرف (Room Types)', icon: BedDouble },
                { id: 'meals' as const, label: '2. الوجبات (Meals)', icon: Utensils },
                { id: 'packages' as const, label: '3. الباقات (Packages)', icon: Sparkles },
                { id: 'periods-pricing' as const, label: '4. الفترات والأسعار (Periods & Prices)', icon: Calendar },
                { id: 'booking-rules' as const, label: '5. قواعد الحجز (Booking Rules)', icon: SlidersHorizontal },
                { id: 'policies' as const, label: '6. السياسات والشروط (Policies & Terms)', icon: ShieldCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                const isCur = hotelTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setHotelTab(tab.id);
                      setSearchQuery('');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      isCur 
                        ? 'bg-[#C9A24B] text-white shadow-xs' 
                        : 'bg-white/10 text-stone-300 hover:bg-white/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: ROOM TYPES (أنواع الغرف فقط بدون أسعار هنا)                          */}
          {/* ========================================================================= */}
          {hotelTab === 'rooms' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Notice Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-[#C9A24B]/30 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#B38A34] shrink-0 mt-0.5" />
                <div className="text-xs text-stone-700 space-y-1">
                  <p className="font-bold text-stone-900">
                    تنبيه: هنا يتم تعريف نوع الغرفة ومواصفاتها فقط (الاسم، عدد الأسرة، الصور، الوصف).
                  </p>
                  <p className="text-stone-600">
                    الأسعار والمواسم والطاقة الاستيعابية تُدار وتُحدد في تبويب <strong>"4. الفترات والأسعار (Periods & Prices)"</strong> لضمان المرونة الكاملة عبر المواسم.
                  </p>
                </div>
              </div>

              {/* Action and Search Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث في أنواع الغرف..."
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setRoomsViewMode('table')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        roomsViewMode === 'table' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                      }`}
                      title="عرض الجدول المتقدم"
                    >
                      <TableIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoomsViewMode('cards')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        roomsViewMode === 'cards' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                      }`}
                      title="عرض البطاقات المصورة"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddRoom}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة نوع غرفة جديد</span>
                  </button>
                </div>
              </div>

              {/* Table View */}
              {filteredRooms.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
                  <BedDouble className="w-10 h-10 text-stone-300 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-800">لا توجد غرف مسجلة تطابق البحث</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    اضغط على "إضافة نوع غرفة جديد" لإدخال مواصفات أول غرفة في هذا الفندق.
                  </p>
                </div>
              ) : roomsViewMode === 'table' ? (
                <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                        <tr>
                          <th className="p-3 text-center w-14">الترتيب</th>
                          <th className="p-3">نوع الغرفة والتصنيف</th>
                          <th className="p-3">عدد الأسرة والنوع</th>
                          <th className="p-3">الوصف (عربي / En)</th>
                          <th className="p-3">معرض الصور</th>
                          <th className="p-3">الظهور والحالة</th>
                          <th className="p-3 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                        {filteredRooms.map((room, idx) => (
                          <tr key={room.id} className="hover:bg-amber-50/20 transition-colors">
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-0.5">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveRoom(idx, 'up')}
                                  className="p-1 rounded hover:bg-stone-200 disabled:opacity-20 cursor-pointer text-stone-600"
                                  title="تحريك لأعلى"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === filteredRooms.length - 1}
                                  onClick={() => handleMoveRoom(idx, 'down')}
                                  className="p-1 rounded hover:bg-stone-200 disabled:opacity-20 cursor-pointer text-stone-600"
                                  title="تحريك لأسفل"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                {room.images?.[0] ? (
                                  <img 
                                    src={room.images[0]} 
                                    alt={room.name} 
                                    className="w-12 h-10 rounded-lg object-cover shrink-0 border border-stone-200" 
                                  />
                                ) : (
                                  <div className="w-12 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 text-stone-400">
                                    <BedDouble className="w-5 h-5 text-[#C9A24B]" />
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-stone-900 block font-cairo text-sm leading-tight">
                                    {room.name}
                                  </span>
                                  {room.nameEn && (
                                    <span className="text-[11px] text-stone-400 font-sans block">{room.nameEn}</span>
                                  )}
                                  <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 text-[10px] font-bold">
                                    {room.category}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="space-y-0.5">
                                <span className="font-bold text-stone-800 block">
                                  🛏️ {room.bedsCount || 2} أسرة ({room.maxGuests || 2} نزلاء)
                                </span>
                                <span className="text-stone-400 text-[11px]">{room.bedType || 'سرير مزدوج'}</span>
                              </div>
                            </td>

                            <td className="p-3 max-w-xs">
                              <p className="text-stone-600 truncate">{room.description || '—'}</p>
                              {room.descriptionEn && (
                                <p className="text-[10px] text-stone-400 font-sans truncate">{room.descriptionEn}</p>
                              )}
                            </td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-bold text-[11px]">
                                📷 {room.images?.length || 0} صور
                              </span>
                            </td>

                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => handleToggleRoomActive(room)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                                  room.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                                }`}
                              >
                                {room.isActive !== false ? 'مفعلة (ظاهرة) ✓' : 'مخفية ✕'}
                              </button>
                            </td>

                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditRoom(room)}
                                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                                  title="تعديل"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingRoomId(room.id)}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredRooms.map((room) => (
                    <div key={room.id} className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        {room.images?.[0] ? (
                          <div className="h-44 rounded-2xl overflow-hidden mb-3 relative">
                            <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-white font-bold">
                              {room.bedsCount || 2} أسرة
                            </div>
                          </div>
                        ) : null}
                        <h4 className="text-base font-bold text-stone-900 font-cairo">{room.name}</h4>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">{room.description || room.bedType}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          room.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {room.isActive !== false ? 'مفعلة ✓' : 'مخفية'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRoom(room)}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold cursor-pointer"
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingRoomId(room.id)}
                            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MEALS (الوجبات وتحديد الاحتساب بوضوح للفرد أو للغرفة)                */}
          {/* ========================================================================= */}
          {hotelTab === 'meals' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث في خطط الوجبات..."
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddMeal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة خطة وجبة جديدة</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                      <tr>
                        <th className="p-3">اسم الوجبة (عربي / En)</th>
                        <th className="p-3">نوع الوجبة</th>
                        <th className="p-3">السعر</th>
                        <th className="p-3">أساس الاحتساب (Pricing Basis)</th>
                        <th className="p-3">الوصف</th>
                        <th className="p-3">الحالة والظهور</th>
                        <th className="p-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                      {filteredMeals.map((meal) => {
                        const basis = meal.pricingBasis || 'per_person_per_night';
                        return (
                          <tr key={meal.id} className="hover:bg-amber-50/20 transition-colors">
                            <td className="p-3 font-bold text-stone-900 font-cairo text-sm">
                              <div className="flex items-center gap-2">
                                <Coffee className="w-4 h-4 text-[#B38A34]" />
                                <div>
                                  <span>{meal.name}</span>
                                  {meal.nameEn && (
                                    <span className="text-[11px] text-stone-400 font-sans block">{meal.nameEn}</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-bold text-[10px]">
                                {meal.type}
                              </span>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  value={meal.price ?? meal.pricePerPersonPerNight ?? 0}
                                  onChange={(e) => handleInlineMealEdit(meal.id, 'price', Number(e.target.value))}
                                  className="w-20 px-2 py-1 rounded-lg bg-stone-50 border border-stone-200 text-center font-bold font-mono text-[#B38A34] text-sm focus:outline-none focus:border-[#C9A24B]"
                                  title="تعديل فوري للسعر"
                                />
                                <span className="text-[11px] text-stone-500 font-bold">{currentCurrency}</span>
                              </div>
                            </td>

                            <td className="p-3">
                              <select
                                value={basis}
                                onChange={(e) => handleInlineMealEdit(meal.id, 'pricingBasis', e.target.value)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer border ${
                                  basis === 'per_person_per_night'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-purple-50 text-purple-800 border-purple-200'
                                }`}
                              >
                                <option value="per_person_per_night">👤 لكل فرد / ليلة (الافتراضي)</option>
                                <option value="per_room_per_night">🏨 لكل غرفة / ليلة</option>
                              </select>
                            </td>

                            <td className="p-3 max-w-xs text-stone-500 truncate">{meal.description || '—'}</td>

                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => handleInlineMealEdit(meal.id, 'isActive', !meal.isActive)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                                  meal.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                                }`}
                              >
                                {meal.isActive ? 'مفعلة أونلاين ✓' : 'معطلة'}
                              </button>
                            </td>

                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMeal(meal)}
                                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                                  title="تعديل"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingMealId(meal.id)}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PACKAGES (الباقات والعروض مع تحديد أساس السعر)                      */}
          {/* ========================================================================= */}
          {hotelTab === 'packages' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث في الباقات..."
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddPackage}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة باقة إقامة جديدة</span>
                </button>
              </div>

              {filteredPackages.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
                  <Sparkles className="w-10 h-10 text-[#C9A24B] mx-auto opacity-70" />
                  <h4 className="text-sm font-bold text-stone-800">لا توجد باقات مضافة لهذا الفندق</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    أنشئ باقات إقامة متكاملة تظهر في نموذج حجز الزائر عند مطابقة التواريخ.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                        <tr>
                          <th className="p-3">اسم الباقة</th>
                          <th className="p-3">نوع الغرفة المخصصة</th>
                          <th className="p-3">الوجبة المشمولة</th>
                          <th className="p-3">الأشخاص والليالي</th>
                          <th className="p-3">السعر وأساس الاحتساب</th>
                          <th className="p-3">فترة الصلاحية (من - إلى)</th>
                          <th className="p-3">الحالة والظهور</th>
                          <th className="p-3 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                        {filteredPackages.map((pkg) => (
                          <tr key={pkg.id} className="hover:bg-amber-50/20 transition-colors">
                            <td className="p-3">
                              <span className="font-bold text-stone-900 block font-cairo text-sm">{pkg.name}</span>
                              {pkg.badgeText && (
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                                  {pkg.badgeText}
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-stone-800">{pkg.roomName}</td>
                            <td className="p-3 text-stone-600">{pkg.mealPlanName}</td>
                            <td className="p-3 font-bold text-stone-900">
                              {pkg.personsCount || 2} أشخاص • {pkg.nights} ليالٍ
                            </td>
                            <td className="p-3">
                              <div className="space-y-0.5">
                                <div>
                                  <strong className="text-sm font-bold font-mono text-[#B38A34]">{pkg.totalPrice?.toLocaleString()}</strong>
                                  <span className="text-[11px] text-stone-500 font-bold mr-1">{currentCurrency}</span>
                                </div>
                                <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  pkg.priceBasis === 'per_night' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-800'
                                }`}>
                                  {pkg.priceBasis === 'per_night' ? 'لكل ليلة' : 'لكامل فترة الإقامة'}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-stone-500">
                              {pkg.startDate} إلى {pkg.endDate}
                            </td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => handleTogglePackageStatus(pkg)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                  pkg.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                                }`}
                              >
                                {pkg.isActive ? 'مفعلة أونلاين ✓' : 'معطلة'}
                              </button>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPackage(pkg)}
                                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                                  title="تعديل"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingPackageId(pkg.id)}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PERIODS & PRICES (الفترات والأسعار ومنع التداخل والربط بالقواعد)     */}
          {/* ========================================================================= */}
          {hotelTab === 'periods-pricing' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث في فترات التسعير والمواسم..."
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddPeriod}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة فترة تسعير جديدة</span>
                </button>
              </div>

              {filteredPeriods.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
                  <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-800">لا توجد فترات تسعير مضافة</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    أضف فترات مواسم محددة بتواريخها وأسعارها ومستودع الغرف لكل ليلة مع ربطها بقواعد وسياسات الحجز.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                        <tr>
                          <th className="p-3">اسم الفترة / الموسم</th>
                          <th className="p-3">نوع الغرفة</th>
                          <th className="p-3">من تاريخ</th>
                          <th className="p-3">إلى تاريخ</th>
                          <th className="p-3">سعر الغرفة فقط</th>
                          <th className="p-3">خيارات إضافية</th>
                          <th className="p-3">المتاح / ليلة</th>
                          <th className="p-3">قواعد الحجز والسياسة</th>
                          <th className="p-3">الحالة</th>
                          <th className="p-3 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                        {filteredPeriods.map((period) => {
                          const linkedRule = ruleSets.find(r => r.id === period.ruleSetId);
                          const linkedPolicy = policiesList.find(p => p.id === period.policyId);

                          return (
                            <tr key={period.id} className="hover:bg-amber-50/20 transition-colors">
                              <td className="p-3 font-bold text-stone-900 font-cairo">
                                {period.name}
                              </td>

                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-bold text-[11px]">
                                  {period.roomTypeName}
                                </span>
                              </td>

                              <td className="p-3 font-mono text-stone-600">{period.startDate}</td>
                              <td className="p-3 font-mono text-stone-600">{period.endDate}</td>

                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min={1}
                                    value={period.roomOnlyPrice}
                                    onChange={(e) => handleInlinePeriodEdit(period.id, 'roomOnlyPrice', Number(e.target.value))}
                                    className="w-20 px-2 py-1 rounded-lg bg-stone-50 border border-stone-200 text-center font-bold font-mono text-[#B38A34] text-xs focus:outline-none focus:border-[#C9A24B]"
                                    title="تعديل فوري للسعر"
                                  />
                                  <span className="text-[10px] text-stone-500 font-bold">{currentCurrency}</span>
                                </div>
                              </td>

                              <td className="p-3 text-[11px]">
                                <div className="space-y-0.5">
                                  <span className="text-emerald-700 block font-semibold">
                                    مع وجبة: {period.extraWithMeal || period.roomOnlyPrice} {currentCurrency}
                                  </span>
                                  <span className="text-stone-500 block">
                                    بدون وجبة: {period.extraWithoutMeal || period.roomOnlyPrice} {currentCurrency}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={1}
                                    value={period.availableRooms}
                                    onChange={(e) => handleInlinePeriodEdit(period.id, 'availableRooms', Number(e.target.value))}
                                    className="w-16 px-2 py-1 rounded-lg bg-stone-50 border border-stone-200 text-center font-bold text-stone-800 text-xs focus:outline-none focus:border-[#C9A24B]"
                                    title="تعديل مستودع الغرف لكل ليلة"
                                  />
                                  <span className="text-[10px] text-stone-400">غرف</span>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="space-y-1">
                                  {linkedRule && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold block">
                                      <SlidersHorizontal className="w-3 h-3 text-[#B38A34]" />
                                      <span className="truncate max-w-[120px]">{linkedRule.name}</span>
                                    </span>
                                  )}
                                  {linkedPolicy && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-bold block">
                                      <ShieldCheck className="w-3 h-3 text-purple-600" />
                                      <span className="truncate max-w-[120px]">{linkedPolicy.name}</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() => handleInlinePeriodEdit(period.id, 'isActive', !period.isActive)}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                    period.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                                  }`}
                                >
                                  {period.isActive ? 'مفعلة ✓' : 'معطلة'}
                                </button>
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPeriod(period)}
                                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                                    title="تعديل"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingPeriodId(period.id)}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: BOOKING RULES (مجموعات قواعد الحجز المسماة)                           */}
          {/* ========================================================================= */}
          {hotelTab === 'booking-rules' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 font-cairo">
                    مجموعات قواعد الحجز المسماة ({ruleSets.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    يمكن إنشاء عدة مجموعات لقواعد الحجز (حدود الغرف والليالي) وربط كل فترة تسعير بمجموعة خاصة.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddRule}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مجموعة قواعد جديدة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ruleSets.map((rule) => (
                  <div 
                    key={rule.id} 
                    className={`p-5 rounded-3xl bg-white border transition-all flex flex-col justify-between ${
                      rule.isDefault ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/20 shadow-sm' : 'border-stone-200 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-stone-900 font-cairo">{rule.name}</span>
                        {rule.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-[#C9A24B]/15 text-[#98752B] font-bold text-[10px]">
                            الافتراضية ★
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-500 mt-1">{rule.description || 'قواعد مخصصة'}</p>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                          <span className="text-[10px] text-stone-400 block font-bold">عدد الليالي</span>
                          <span className="font-bold text-stone-800">
                            من {rule.minNights} إلى {rule.maxNights} ليلة
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                          <span className="text-[10px] text-stone-400 block font-bold">عدد الغرف</span>
                          <span className="font-bold text-stone-800">
                            من {rule.minRooms} إلى {rule.maxRooms} غرف
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      {!rule.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultRule(rule.id)}
                          className="text-xs font-bold text-[#B38A34] hover:underline cursor-pointer"
                        >
                          تعيين كافتراضية
                        </button>
                      ) : (
                        <span className="text-xs text-stone-400">مطبقة تلقائياً</span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditRule(rule)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!rule.isDefault && (
                          <button
                            type="button"
                            onClick={() => setDeletingRuleId(rule.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: POLICIES & TERMS (السياسات والشروط مع إصدارات مؤرخة وقواعد إلغاء)    */}
          {/* ========================================================================= */}
          {hotelTab === 'policies' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 font-cairo">
                    سياسات وشروط الحجز والإلغاء المعتمدة ({policiesList.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    نظام إصدارات مؤرخة (Versioned)؛ كل تعديل ينشئ نسخة جديدة ويحفظ لقطة في سجل الحجز دون التأثير على الحجوزات السابقة.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddPolicy}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة سياسة وشروط جديدة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policiesList.map((policy) => (
                  <div 
                    key={policy.id}
                    className={`p-5 rounded-3xl bg-white border transition-all flex flex-col justify-between space-y-4 ${
                      policy.isDefault ? 'border-purple-300 ring-2 ring-purple-100 shadow-sm' : 'border-stone-200 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900 font-cairo">{policy.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono font-bold text-[10px]">
                            v{policy.version || 1}.0
                          </span>
                        </div>
                        {policy.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px]">
                            السياسة الافتراضية
                          </span>
                        )}
                      </div>

                      <div className="mt-3 p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-stone-700 block">نص سياسة الإلغاء (عربي):</span>
                          <p className="text-stone-600 line-clamp-2 mt-0.5">{policy.policyTextAr}</p>
                        </div>
                        <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                          <span>تسجيل الوصول: {policy.checkInTime}</span>
                          <span>المغادرة: {policy.checkOutTime}</span>
                        </div>
                      </div>

                      {/* Structured rules count */}
                      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-stone-700">
                        <ShieldCheck className="w-4 h-4 text-[#B38A34]" />
                        <span>({policy.cancellationRules?.length || 0}) قواعد إلغاء هيكلية محددة</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {!policy.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultPolicy(policy.id)}
                            className="text-xs font-bold text-purple-700 hover:underline cursor-pointer"
                          >
                            تعيين كافتراضية
                          </button>
                        )}
                        {(policy.versionHistory?.length || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => setViewingVersionHistoryPolicy(policy)}
                            className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold cursor-pointer flex items-center gap-1"
                          >
                            <History className="w-3 h-3" />
                            <span>السجل ({policy.versionHistory?.length})</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPolicy(policy)}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل وإصدار نسخة جديدة</span>
                        </button>
                        {!policy.isDefault && (
                          <button
                            type="button"
                            onClick={() => setDeletingPolicyId(policy.id)}
                            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: CALENDAR MATRIX & YIELD MANAGEMENT (Booking.com style)             */}
          {/* ========================================================================= */}
          {hotelTab === 'calendar-grid' && (
            <AdminCalendarMatrix
              hotel={selectedHotel}
              rooms={rooms.filter(r => r.hotelId === selectedHotel.id)}
              pricingPeriods={pricingPeriods.filter(p => p.hotelId === selectedHotel.id)}
              onShowToast={onShowToast}
              onRefreshData={loadData}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & DIALOGS                                                          */}
      {/* ========================================================================= */}

      {/* 1. ROOM TYPES MODAL */}
      {isRoomModalOpen && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRoomModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 font-cairo">
                  {editingRoomId ? 'تعديل مواصفات نوع الغرفة' : 'إضافة نوع غرفة وجناح جديد'}
                </h3>
                <span className="text-xs text-[#B38A34] font-bold">
                  {selectedHotel?.name}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Type Presets */}
            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80">
              <span className="text-[11px] font-bold text-amber-950 block mb-2">⚡ نماذج سريعة لتحديد السعة والأسرة بنقرة واحدة:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'مفردة (1 نزيل)', name: 'مفرد', nameEn: 'Single Room', beds: 1, guests: 1, bedType: 'سرير مفرد مريح', cat: 'غرفة مفردة', price: 280 },
                  { label: 'ثنائية (2 نزلاء)', name: 'ثنائي', nameEn: 'Double Room', beds: 2, guests: 2, bedType: 'سريرين مفردين أو سرير كينج', cat: 'غرفة ثنائية', price: 400 },
                  { label: 'ثلاثية (3 نزلاء)', name: 'ثلاثي', nameEn: 'Triple Room', beds: 3, guests: 3, bedType: '3 أسرة مفردة مريحة', cat: 'غرفة ثلاثية', price: 480 },
                  { label: 'رباعية (4 نزلاء)', name: 'رباعي', nameEn: 'Quadruple Room', beds: 4, guests: 4, bedType: '4 أسرة مفردة مريحة', cat: 'غرفة رباعية', price: 580 },
                  { label: 'خماسية (5 نزلاء)', name: 'خماسي', nameEn: 'Quintuple Room', beds: 5, guests: 5, bedType: '5 أسرة مفردة مريحة', cat: 'غرفة خماسية', price: 680 },
                  { label: 'جناح عائلي (4-6)', name: 'جناح عائلي رحب', nameEn: 'Family Suite', beds: 4, guests: 5, bedType: '1 سرير كينج + 2 سرير مفرد + صالة', cat: 'جناح عائلي', price: 750 }
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      setRoomForm({
                        ...roomForm,
                        name: preset.name,
                        nameEn: preset.nameEn,
                        bedsCount: preset.beds,
                        maxGuests: preset.guests,
                        bedType: preset.bedType,
                        category: preset.cat,
                        basePrice: roomForm.basePrice || preset.price
                      });
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#C9A24B] hover:text-white border border-amber-300 text-amber-900 text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">اسم نوع الغرفة (بالعربية) *</label>
                  <input 
                    type="text"
                    required
                    value={roomForm.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const lower = val.toLowerCase();
                      let g = roomForm.maxGuests || 2;
                      let b = roomForm.bedsCount || 2;
                      let bt = roomForm.bedType || 'سريرين مفردين أو سرير كينج';
                      let cat = roomForm.category || 'غرفة فندقية';
                      if (lower.includes('خماس') || lower.includes('خمس')) {
                        g = 5; b = 5; bt = '5 أسرة مفردة مريحة'; cat = 'غرفة خماسية';
                      } else if (lower.includes('رباع') || lower.includes('أربع')) {
                        g = 4; b = 4; bt = '4 أسرة مفردة مريحة'; cat = 'غرفة رباعية';
                      } else if (lower.includes('ثلاث') || lower.includes('ثلاثي')) {
                        g = 3; b = 3; bt = '3 أسرة مفردة مريحة'; cat = 'غرفة ثلاثية';
                      } else if (lower.includes('مفرد') || lower.includes('فردي')) {
                        g = 1; b = 1; bt = 'سرير مفرد مريح'; cat = 'غرفة مفردة';
                      } else if (lower.includes('ثنائ') || lower.includes('مزدوج')) {
                        g = 2; b = 2; bt = 'سريرين مفردين أو سرير كينج'; cat = 'غرفة ثنائية';
                      }
                      setRoomForm({ ...roomForm, name: val, maxGuests: g, bedsCount: b, bedType: bt, category: cat });
                    }}
                    placeholder="مثال: ثنائي، ثلاثي، رباعي، جناح..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">اسم نوع الغرفة (بالإنجليزية)</label>
                  <input 
                    type="text"
                    value={roomForm.nameEn || ''}
                    onChange={(e) => setRoomForm({ ...roomForm, nameEn: e.target.value })}
                    placeholder="e.g. Deluxe Double Room"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-sans focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">سعة الغرفة (النزلاء) *</label>
                  <input 
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={roomForm.maxGuests || 2}
                    onChange={(e) => setRoomForm({ ...roomForm, maxGuests: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">نوع وتوزيع الأسرة *</label>
                  <input 
                    type="text"
                    required
                    value={roomForm.bedType || 'سريرين مفردين أو سرير كينج'}
                    onChange={(e) => setRoomForm({ ...roomForm, bedType: e.target.value })}
                    placeholder="مثال: 3 أسرة مفردة، سرير كينج..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">سعر الليلة الأساسي ({currentCurrency}) *</label>
                  <input 
                    type="number"
                    min={50}
                    required
                    value={roomForm.basePrice || 400}
                    onChange={(e) => setRoomForm({ ...roomForm, basePrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">عدد الغرف المتاحة *</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    value={roomForm.availableRooms || 10}
                    onChange={(e) => setRoomForm({ ...roomForm, availableRooms: Number(e.target.value), totalRooms: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">وصف الغرفة (بالعربية)</label>
                  <textarea
                    rows={2}
                    value={roomForm.description || ''}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                    placeholder="وصف مميزات وموقع الغرفة..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">وصف الغرفة (بالإنجليزية)</label>
                  <textarea
                    rows={2}
                    value={roomForm.descriptionEn || ''}
                    onChange={(e) => setRoomForm({ ...roomForm, descriptionEn: e.target.value })}
                    placeholder="English room description..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-sans focus:outline-none focus:border-[#C9A24B] resize-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">حالة نوع الغرفة للزوار (Active / Hidden)</span>
                <button
                  type="button"
                  onClick={() => setRoomForm({ ...roomForm, isActive: !roomForm.isActive })}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                    roomForm.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {roomForm.isActive !== false ? 'نشطة ومفعلة ✓' : 'مخفية'}
                </button>
              </div>

              {/* Images */}
              <div className="pt-2 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-900">
                    معرض صور الغرفة ({roomForm.images?.length || 0} صور):
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleDeviceImagesUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowHotelGalleryPicker(!showHotelGalleryPicker)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                        showHotelGalleryPicker
                          ? 'bg-[#C9A24B] text-white border-[#B38A34] shadow-xs'
                          : 'bg-[#C9A24B]/10 hover:bg-[#C9A24B]/20 text-[#B38A34] border-[#C9A24B]/30'
                      }`}
                      title="اختيار من صور الفندق المحددة والمرفوعة مسبقاً"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>اختيار من صور الفندق ({hotelImagesPool.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-stone-200"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع من جهازك</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Hotel Photos Picker Drawer */}
                {showHotelGalleryPicker && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <ImageIcon className="w-4 h-4 text-[#C9A24B]" />
                        <span>انقر على صور الفندق لإضافتها أو إزالتها من صور الغرفة:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowHotelGalleryPicker(false)}
                        className="text-[11px] font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        إغلاق ✕
                      </button>
                    </div>

                    {hotelImagesPool.length === 0 ? (
                      <p className="text-xs text-stone-500 text-center py-3">
                        لا توجد صور مسجلة للفندق حالياً. يمكنك رفع صور من جهازك مباشرة.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1">
                        {hotelImagesPool.map((imgUrl, iIdx) => {
                          const isSelected = (roomForm.images || []).includes(imgUrl);
                          return (
                            <button
                              key={iIdx}
                              type="button"
                              onClick={() => {
                                const currentImgs = roomForm.images || [];
                                if (isSelected) {
                                  setRoomForm({
                                    ...roomForm,
                                    images: currentImgs.filter(u => u !== imgUrl)
                                  });
                                } else {
                                  setRoomForm({
                                    ...roomForm,
                                    images: [...currentImgs, imgUrl]
                                  });
                                }
                              }}
                              className={`aspect-video rounded-xl overflow-hidden relative border-2 transition-all cursor-pointer group ${
                                isSelected 
                                  ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/30 scale-[1.02]' 
                                  : 'border-stone-200 hover:border-amber-400 opacity-80 hover:opacity-100'
                              }`}
                              title={isSelected ? 'انقر للإزالة من الغرفة' : 'انقر لإضافة هذه الصورة للغرفة'}
                            >
                              <img src={imgUrl} alt={`Hotel ${iIdx}`} className="w-full h-full object-cover" />
                              {isSelected && (
                                <div className="absolute inset-0 bg-[#C9A24B]/30 backdrop-blur-[1px] flex items-center justify-center">
                                  <span className="w-5 h-5 rounded-full bg-[#C9A24B] text-white flex items-center justify-center text-xs shadow-xs font-bold">
                                    ✓
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {roomForm.images && roomForm.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {roomForm.images.map((img, idx) => (
                      <div key={idx} className="rounded-2xl overflow-hidden border-2 relative group bg-stone-100">
                        <div className="aspect-video relative">
                          <img src={img} alt={`Room ${idx}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-1 right-1 px-2 py-0.5 rounded-md bg-[#C9A24B] text-white text-[10px] font-bold">
                              الغلاف
                            </span>
                          )}
                        </div>
                        <div className="p-1 bg-white flex items-center justify-between text-[10px]">
                          {idx !== 0 ? (
                            <button
                              type="button"
                              onClick={() => handleSetCoverImage(idx)}
                              className="text-stone-600 hover:text-[#B38A34] font-bold cursor-pointer"
                            >
                              تعيين كغلاف
                            </button>
                          ) : (
                            <span className="text-[#B38A34] font-bold">الرئيسية ✓</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveRoomImage(idx)}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  حفظ نوع الغرفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MEALS MODAL */}
      {isMealModalOpen && (
        <div 
          className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMealModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 font-cairo">
                {editingMealId ? 'تعديل خطة الوجبة' : 'إضافة خطة وجبة جديدة'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsMealModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMealSubmit} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-stone-700 mb-1">اسم خطة الوجبة (بالعربية) *</label>
                <input
                  type="text"
                  required
                  value={mealForm.name}
                  onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                  placeholder="مثال: شامل بوفيه إفطار فاخر"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="block text-stone-700 mb-1">اسم خطة الوجبة (بالإنجليزية)</label>
                <input
                  type="text"
                  value={mealForm.nameEn || ''}
                  onChange={(e) => setMealForm({ ...mealForm, nameEn: e.target.value })}
                  placeholder="e.g. Bed & Breakfast Buffet"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-sans focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">السعر ({currentCurrency}) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={mealForm.price}
                    onChange={(e) => setMealForm({ ...mealForm, price: Number(e.target.value), pricePerPersonPerNight: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">أساس احتساب السعر *</label>
                  <select
                    value={mealForm.pricingBasis || 'per_person_per_night'}
                    onChange={(e) => setMealForm({ ...mealForm, pricingBasis: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    <option value="per_person_per_night">👤 لكل فرد / ليلة (الافتراضي)</option>
                    <option value="per_room_per_night">🏨 لكل غرفة / ليلة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 mb-1">الوصف والتفاصيل</label>
                <textarea
                  rows={2}
                  value={mealForm.description || ''}
                  onChange={(e) => setMealForm({ ...mealForm, description: e.target.value })}
                  placeholder="بوفيه مفتوح يومياً في مطعم الفندق..."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsMealModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white font-bold cursor-pointer"
                >
                  حفظ خطة الوجبة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. PACKAGES MODAL */}
      {isPackageModalOpen && (
        <div 
          className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPackageModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 font-cairo">
                {editingPackageId ? 'تعديل باقة الإقامة' : 'إضافة باقة إقامة جديدة'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsPackageModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-stone-700 mb-1">اسم الباقة (بالعربية) *</label>
                <input 
                  type="text"
                  required
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="مثال: باقة المعتمر: غرفة ثنائية شاملة بوفيه الإفطار (3 ليالٍ)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">نوع الغرفة المخصصة *</label>
                  <select
                    value={packageForm.roomTypeId || packageForm.roomId}
                    onChange={(e) => {
                      const r = rooms.find(rm => rm.id === e.target.value);
                      setPackageForm({
                        ...packageForm,
                        roomId: e.target.value,
                        roomTypeId: e.target.value,
                        roomName: r?.name || ''
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    {hotelRooms.map(rm => (
                      <option key={rm.id} value={rm.id}>{rm.name} ({rm.bedsCount || 2} أسرة)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">الوجبة المشمولة (اختياري)</label>
                  <select
                    value={packageForm.mealPlanId}
                    onChange={(e) => {
                      const m = mealPlans.find(ml => ml.id === e.target.value);
                      setPackageForm({
                        ...packageForm,
                        mealPlanId: e.target.value,
                        mealPlanName: m?.name || 'بدون وجبات'
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    <option value="">بدون وجبات إضافية</option>
                    {mealPlans.map(ml => (
                      <option key={ml.id} value={ml.id}>{ml.name} ({ml.price} {currentCurrency})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">عدد الأشخاص</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    value={packageForm.personsCount || 2}
                    onChange={(e) => setPackageForm({ ...packageForm, personsCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-center font-bold focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">السعر ({currentCurrency}) *</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    value={packageForm.totalPrice}
                    onChange={(e) => setPackageForm({ ...packageForm, totalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-[#B38A34] text-center font-mono font-bold focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">أساس السعر *</label>
                  <select
                    value={packageForm.priceBasis || 'total_stay'}
                    onChange={(e) => setPackageForm({ ...packageForm, priceBasis: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    <option value="total_stay">لكامل فترة الإقامة</option>
                    <option value="per_night">لكل ليلة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">تاريخ بداية صلاحية الباقة *</label>
                  <input 
                    type="date"
                    required
                    value={packageForm.startDate}
                    onChange={(e) => setPackageForm({ ...packageForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">تاريخ نهاية صلاحية الباقة *</label>
                  <input 
                    type="date"
                    required
                    value={packageForm.endDate}
                    onChange={(e) => setPackageForm({ ...packageForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white font-bold cursor-pointer"
                >
                  حفظ الباقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PERIODS & PRICING MODAL */}
      {isPeriodModalOpen && (
        <div 
          className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPeriodModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 font-cairo">
                {editingPeriodId ? 'تعديل فترة وموسم التسعير' : 'إضافة فترة وموسم تسعير جديد'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsPeriodModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Overlap Error Alert */}
            {periodOverlapError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{periodOverlapError}</span>
              </div>
            )}

            <form onSubmit={handleSavePeriod} className="space-y-3.5 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">اسم الفترة / الموسم *</label>
                  <input
                    type="text"
                    required
                    value={periodForm.name}
                    onChange={(e) => {
                      setPeriodForm({ ...periodForm, name: e.target.value });
                      setPeriodOverlapError(null);
                    }}
                    placeholder="مثال: موسم رمضان المبارك"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">تطبيق الفترة على أنواع الغرف</label>
                  <select
                    value={periodForm.roomTypeId || 'all'}
                    onChange={(e) => {
                      const val = e.target.value;
                      const r = rooms.find(rm => rm.id === val);
                      setPeriodForm({
                        ...periodForm,
                        roomTypeId: val,
                        roomTypeName: val === 'all' ? 'جميع أنواع الغرف المتاحة' : (r?.name || '')
                      });
                      setPeriodOverlapError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    <option value="all">🌟 تطبيق على جميع أنواع الغرف المتاحة بالفندق (شامل)</option>
                    {hotelRooms.map(rm => (
                      <option key={rm.id} value={rm.id}>غرفة محددة: {rm.name} ({rm.bedsCount || 2} أسرة)</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-stone-400 font-normal mt-0.5 block">
                    يتم تحديد أنواع الغرف المفعلة والظاهرة للزوار من تبويب (أنواع الغرف).
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">تاريخ البداية (من) *</label>
                  <input
                    type="date"
                    required
                    value={periodForm.startDate}
                    onChange={(e) => {
                      setPeriodForm({ ...periodForm, startDate: e.target.value });
                      setPeriodOverlapError(null);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">تاريخ النهاية (إلى) *</label>
                  <input
                    type="date"
                    required
                    value={periodForm.endDate}
                    onChange={(e) => {
                      setPeriodForm({ ...periodForm, endDate: e.target.value });
                      setPeriodOverlapError(null);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/70">
                  <label className="block text-stone-800 mb-1">سعر الغرفة فقط (Room Only) ({currentCurrency}) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={periodForm.roomOnlyPrice}
                    onChange={(e) => setPeriodForm({ ...periodForm, roomOnlyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                  />
                  <span className="text-[10px] text-amber-800 font-normal mt-1 block">
                    💡 السعر الأساسي للإقامة. عند رغبة العميل بوجبة، يُضاف سعر الوجبة المختارة تلقائياً في صفحة الحجز وفقاً لخطة الوجبة.
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <label className="block text-stone-700 mb-1">إجمالي المتاح / ليلة (Allotment) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={periodForm.availableRooms}
                    onChange={(e) => setPeriodForm({ ...periodForm, availableRooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                  />
                  <span className="text-[10px] text-stone-500 font-normal mt-1 block">
                    إجمالي الطاقة الاستيعابية المتوفرة للحجز في هذه الفترة يومياً.
                  </span>
                </div>
              </div>

              {/* Optional Room Distribution across room types */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      توزيع الغرف المتاحة على أنواع الغرف (اختياري)
                    </span>
                    <span className="text-[10px] text-stone-500 font-normal">
                      تخصيص كوتة وعدد الغرف المتاحة لكل نوع غرفة خلال هذه الفترة (مثال: لو متاح 10 غرف تحدد توزيعتها).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !enableCustomDistribution;
                      setEnableCustomDistribution(next);
                      if (next && (!periodForm.roomDistribution || Object.keys(periodForm.roomDistribution).length === 0)) {
                        const dist: Record<string, number> = {};
                        const perRoom = Math.max(1, Math.floor(periodForm.availableRooms / Math.max(1, hotelRooms.length)));
                        hotelRooms.forEach(rm => { dist[rm.id] = perRoom; });
                        setPeriodForm(prev => ({ ...prev, roomDistribution: dist }));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      enableCustomDistribution 
                        ? 'bg-[#C9A24B] text-white shadow-xs' 
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {enableCustomDistribution ? 'مُفعّل ✓' : 'تفعيل التوزيع'}
                  </button>
                </div>

                {enableCustomDistribution && hotelRooms.length > 0 && (
                  <div className="pt-2 border-t border-stone-200/80 space-y-2 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hotelRooms.map(rm => {
                        const currentVal = periodForm.roomDistribution?.[rm.id] ?? 0;
                        return (
                          <div key={rm.id} className="p-2 rounded-xl bg-white border border-stone-200 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-bold text-stone-800 text-xs truncate block">{rm.name}</span>
                              <span className="text-[10px] text-stone-400 font-normal">{rm.bedsCount || 2} أسرة</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="number"
                                min={0}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  const updated = { ...(periodForm.roomDistribution || {}), [rm.id]: val };
                                  const sum = Object.values(updated).reduce<number>((a, b) => a + (Number(b) || 0), 0);
                                  setPeriodForm(prev => ({
                                    ...prev,
                                    roomDistribution: updated,
                                    availableRooms: sum > 0 ? sum : prev.availableRooms
                                  }));
                                }}
                                className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                              />
                              <span className="text-[10px] text-stone-500">غرفة</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Live Sum indicator */}
                    {(() => {
                      const totalAllocated = Object.values(periodForm.roomDistribution || {}).reduce<number>((a, b) => a + (Number(b) || 0), 0);
                      return (
                        <div className="flex items-center justify-between text-[11px] px-3 py-1.5 bg-amber-50 rounded-xl text-amber-900 font-bold border border-amber-200">
                          <span>إجمالي الغرف الموزعة:</span>
                          <span className="font-mono">{totalAllocated} غرفة</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Linked Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-stone-700 mb-1">ربط بمجموعة قواعد الحجز</label>
                  <select
                    value={periodForm.ruleSetId || ''}
                    onChange={(e) => setPeriodForm({ ...periodForm, ruleSetId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    {ruleSets.map(r => (
                      <option key={r.id} value={r.id}>{r.name} {r.isDefault ? '(الافتراضية)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">ربط بسياسة الحجز والإلغاء</label>
                  <select
                    value={periodForm.policyId || ''}
                    onChange={(e) => setPeriodForm({ ...periodForm, policyId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    {policiesList.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (v{p.version || 1}.0)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPeriodModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white font-bold cursor-pointer"
                >
                  فحص التداخل وحفظ الفترة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. BOOKING RULES MODAL */}
      {isRuleModalOpen && (
        <div 
          className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRuleModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 font-cairo">
                {editingRuleId ? 'تعديل مجموعة قواعد الحجز' : 'إضافة مجموعة قواعد حجز'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-stone-700 mb-1">اسم مجموعة القواعد (مثال: قواعد موسم الحج) *</label>
                <input
                  type="text"
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">الحد الأدنى لليالي *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={ruleForm.minNights}
                    onChange={(e) => setRuleForm({ ...ruleForm, minNights: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">الحد الأقصى لليالي *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={ruleForm.maxNights}
                    onChange={(e) => setRuleForm({ ...ruleForm, maxNights: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">الحد الأدنى للغرف *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={ruleForm.minRooms}
                    onChange={(e) => setRuleForm({ ...ruleForm, minRooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">الحد الأقصى للغرف *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={ruleForm.maxRooms}
                    onChange={(e) => setRuleForm({ ...ruleForm, maxRooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 mb-1">وصف أو ملاحظات المجموعة</label>
                <input
                  type="text"
                  value={ruleForm.description || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  placeholder="ملاحظات حول سريان هذه القواعد..."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white font-bold cursor-pointer"
                >
                  حفظ القواعد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. POLICIES & TERMS MODAL */}
      {isPolicyModalOpen && (
        <div 
          className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPolicyModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 font-cairo">
                  {editingPolicyId ? `تعديل السياسة وإصدار نسخة جديدة (v${(policyForm.version || 1) + 1}.0)` : 'إضافة سياسة وشروط جديدة'}
                </h3>
                <span className="text-xs text-purple-700 font-bold">
                  تحفظ الحجوزات السابقة لقطة غير متغيرة من السياسة الحالية
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">اسم السياسة (بالعربية) *</label>
                  <input
                    type="text"
                    required
                    value={policyForm.name}
                    onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                    placeholder="مثال: السياسة المرنة القياسية"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">اسم السياسة (بالإنجليزية)</label>
                  <input
                    type="text"
                    value={policyForm.nameEn || ''}
                    onChange={(e) => setPolicyForm({ ...policyForm, nameEn: e.target.value })}
                    placeholder="e.g. Standard Flexible Policy"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-sans focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">موعد تسجيل الوصول (Check-in)</label>
                  <input
                    type="text"
                    value={policyForm.checkInTime}
                    onChange={(e) => setPolicyForm({ ...policyForm, checkInTime: e.target.value })}
                    placeholder="16:00 عصراً"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">موعد تسجيل المغادرة (Check-out)</label>
                  <input
                    type="text"
                    value={policyForm.checkOutTime}
                    onChange={(e) => setPolicyForm({ ...policyForm, checkOutTime: e.target.value })}
                    placeholder="12:00 ظهراً"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Cancellation Matrix */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>قواعد الإلغاء الهيكلية (Structured Cancellation Rules)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-stone-600 text-[10px] mb-1">الأيام قبل الوصول</label>
                    <input
                      type="number"
                      min={0}
                      value={newRuleDays}
                      onChange={(e) => setNewRuleDays(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 text-[10px] mb-1">نسبة الغرامة %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newRuleFee}
                      onChange={(e) => setNewRuleFee(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 text-[10px] mb-1">الوصف بالعربية</label>
                    <input
                      type="text"
                      value={newRuleDescAr}
                      onChange={(e) => setNewRuleDescAr(e.target.value)}
                      placeholder="إلغاء مجاني حتى 48 ساعة"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCancellationRuleToForm}
                    className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer"
                  >
                    إضافة الشرط +
                  </button>
                </div>

                {policyForm.cancellationRules && policyForm.cancellationRules.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {policyForm.cancellationRules.map(rule => (
                      <div key={rule.id} className="p-2 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-800">قبل {rule.daysBeforeCheckIn} أيام:</span>
                          <span className={`px-2 py-0.5 rounded-md font-bold ${
                            rule.feePercentage === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {rule.feePercentage === 0 ? 'إلغاء مجاني 100%' : `غرامة ${rule.feePercentage}%`}
                          </span>
                          <span className="text-stone-500">{rule.descriptionAr}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCancellationRule(rule.id)}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bilingual Policy & Terms Texts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">نص سياسة الإلغاء (عربي) *</label>
                  <textarea
                    rows={3}
                    required
                    value={policyForm.policyTextAr}
                    onChange={(e) => setPolicyForm({ ...policyForm, policyTextAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">نص سياسة الإلغاء (إنجليزي)</label>
                  <textarea
                    rows={3}
                    value={policyForm.policyTextEn || ''}
                    onChange={(e) => setPolicyForm({ ...policyForm, policyTextEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-sans focus:outline-none focus:border-[#C9A24B] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">الشروط والأحكام العامة (عربي) *</label>
                  <textarea
                    rows={3}
                    required
                    value={policyForm.termsTextAr}
                    onChange={(e) => setPolicyForm({ ...policyForm, termsTextAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">الشروط والأحكام العامة (إنجليزي)</label>
                  <textarea
                    rows={3}
                    value={policyForm.termsTextEn || ''}
                    onChange={(e) => setPolicyForm({ ...policyForm, termsTextEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-sans focus:outline-none focus:border-[#C9A24B] resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer"
                >
                  {editingPolicyId ? 'حفظ وإنشاء إصدار جديد' : 'حفظ السياسة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. VERSION HISTORY MODAL */}
      {viewingVersionHistoryPolicy && (
        <div 
          className="fixed inset-0 z-[135] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingVersionHistoryPolicy(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-bold text-stone-900 font-cairo">
                  سجل إصدارات السياسة: {viewingVersionHistoryPolicy.name}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setViewingVersionHistoryPolicy(null)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(viewingVersionHistoryPolicy.versionHistory || []).length > 0 ? (
              <div className="space-y-3">
                {viewingVersionHistoryPolicy.versionHistory?.map((vh, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono font-bold text-[11px]">
                          v{vh.version}.0
                        </span>
                        <span className="text-stone-400 font-mono">
                          {new Date(vh.updatedAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <p className="font-bold text-stone-800 mt-1">{vh.summary}</p>
                      <span className="text-stone-500 text-[11px]">بواسطة: {vh.updatedBy}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestorePolicyVersion(viewingVersionHistoryPolicy, vh)}
                      className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-700 hover:text-white text-purple-800 font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>استرجاع</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 text-center py-6">لا توجد إصدارات أقدم مسجلة بعد.</p>
            )}
          </div>
        </div>
      )}

      {/* 8. CONFIRM DELETE MODALS */}
      {deletingRoomId && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-stone-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-stone-900">هل أنت متأكد من حذف نوع الغرفة؟</h4>
              <p className="text-xs text-stone-500 mt-1">سيتم إزالة نوع الغرفة فوراً من قاعدة البيانات.</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRoomId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRoom(deletingRoomId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingMealId && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-stone-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-stone-900">حذف خطة الوجبة</h4>
              <p className="text-xs text-stone-500 mt-1">هل أنت متأكد من حذف هذه الوجبة؟</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMealId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMeal(deletingMealId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingPackageId && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-stone-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-stone-900">حذف باقة الإقامة</h4>
              <p className="text-xs text-stone-500 mt-1">هل أنت متأكد من حذف هذه الباقة؟</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPackageId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => handleDeletePackage(deletingPackageId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingPeriodId && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-stone-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-stone-900">حذف فترة وموسم التسعير</h4>
              <p className="text-xs text-stone-500 mt-1">هل أنت متأكد من حذف هذه الفترة؟</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPeriodId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => handleDeletePeriod(deletingPeriodId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingRuleId && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-stone-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-stone-900">حذف مجموعة قواعد الحجز</h4>
              <p className="text-xs text-stone-500 mt-1">هل أنت متأكد من حذف هذه المجموعة؟</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRuleId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRule(deletingRuleId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingPolicyId && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-stone-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-stone-900">حذف السياسة والشروط</h4>
              <p className="text-xs text-stone-500 mt-1">هل أنت متأكد من حذف هذه السياسة؟</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPolicyId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => handleDeletePolicy(deletingPolicyId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
