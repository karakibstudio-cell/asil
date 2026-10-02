import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Hotel, 
  RoomTypeItem, 
  MealPlanOption, 
  RoomStatus,
  RoomSeasonPeriod,
  HotelBookingPolicy,
  RoomPackageOption,
  HotelGalleryItem 
} from '../types';
import { 
  getRoomsFromDb, 
  saveRoomToDb, 
  deleteRoomFromDb, 
  getMealPlansFromDb, 
  saveMealPlansToDb,
  DEFAULT_BOOKING_POLICY,
  getHotelPolicy,
  getPackagesFromDb,
  savePackageToDb,
  deletePackageFromDb 
} from '../services/bookingService';
import { saveHotelToDb } from '../services/firebase';
import { 
  BedDouble, 
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
  DollarSign,
  Coffee,
  Sparkles,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  Sliders,
  ChevronRight,
  Wifi,
  Tv,
  Wind,
  VolumeX,
  Bath,
  Sun,
  Moon,
  Layers,
  CheckSquare,
  Square,
  Lock,
  HeartHandshake,
  Tag,
  Upload,
  Star,
  Eye,
  EyeOff,
  Receipt,
  Percent
} from 'lucide-react';

interface AdminRoomsManagerProps {
  hotels: Hotel[];
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshHotels?: () => Promise<void>;
  onUpdateHotel?: (hotel: Hotel) => void;
}

// Predefined Luxury Hotel Amenities for Easy One-Click Selection
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

// Predefined Season Presets for Drop-of-Drop creation
const SEASON_PRESETS = [
  {
    id: 'ramadan_full',
    name: '🌙 موسم شهر رمضان المبارك (كامل الشهر)',
    defaultStart: '2026-02-18',
    defaultEnd: '2026-03-20',
    defaultMinStay: 3,
    multiplier: 1.8
  },
  {
    id: 'ramadan_last10',
    name: '✨ العشر الأواخر من رمضان (ليالي القدر)',
    defaultStart: '2026-03-10',
    defaultEnd: '2026-03-20',
    defaultMinStay: 5,
    multiplier: 2.5
  },
  {
    id: 'hajj_season',
    name: '🕋 موسم الحج الأكبر المبارك',
    defaultStart: '2026-05-20',
    defaultEnd: '2026-06-05',
    defaultMinStay: 5,
    multiplier: 3.0
  },
  {
    id: 'umrah_winter',
    name: '🕊️ موسم العمرة الشتوية (رجب وشعبان)',
    defaultStart: '2026-01-10',
    defaultEnd: '2026-02-15',
    defaultMinStay: 2,
    multiplier: 1.3
  },
  {
    id: 'school_holiday',
    name: '🏖️ إجازة منتصف العام وعطلة الربيع',
    defaultStart: '2026-01-01',
    defaultEnd: '2026-01-15',
    defaultMinStay: 2,
    multiplier: 1.25
  },
  {
    id: 'weekend',
    name: '🎉 عطلة نهاية الأسبوع (الخميس والجمعة)',
    defaultStart: new Date().toISOString().split('T')[0],
    defaultEnd: new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
    defaultMinStay: 2,
    multiplier: 1.2
  },
  {
    id: 'peak_season',
    name: '🌟 موسم الذروة السياحي المرتفع',
    defaultStart: new Date().toISOString().split('T')[0],
    defaultEnd: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
    defaultMinStay: 1,
    multiplier: 1.4
  },
  {
    id: 'custom',
    name: '⚙️ فترة وموسم مخصص بتواريخ حرة',
    defaultStart: new Date().toISOString().split('T')[0],
    defaultEnd: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    defaultMinStay: 1,
    multiplier: 1.0
  }
];

export const AdminRoomsManager: React.FC<AdminRoomsManagerProps> = ({
  hotels,
  onShowToast,
  onRefreshHotels,
  onUpdateHotel
}) => {
  // Selected Hotel to Configure
  const [selectedHotelId, setSelectedHotelId] = useState<string>(hotels[0]?.id || '');
  const [hotelList, setHotelList] = useState<Hotel[]>(hotels);

  useEffect(() => {
    setHotelList(hotels);
    if (!selectedHotelId && hotels.length > 0) {
      setSelectedHotelId(hotels[0].id);
    }
  }, [hotels]);

  const selectedHotel = hotelList.find(h => h.id === selectedHotelId) || hotelList[0] || null;

  // Main Configuration Tabs
  const [hotelTab, setHotelTab] = useState<'rooms' | 'packages' | 'seasons-pricing' | 'policy' | 'meals'>('rooms');

  // Rooms Data
  const [rooms, setRooms] = useState<RoomTypeItem[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Meal Plans Data
  const [mealPlans, setMealPlans] = useState<MealPlanOption[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);

  // Packages Data
  const [packages, setPackages] = useState<RoomPackageOption[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [packageForm, setPackageForm] = useState<RoomPackageOption>({
    id: '',
    hotelId: selectedHotelId,
    roomId: '',
    roomName: '',
    name: '',
    nameEn: '',
    mealPlanId: 'meal_breakfast',
    mealPlanName: 'شامل بوفيه إفطار فاخر لشخصين',
    nights: 3,
    totalPrice: 1290,
    pricePerNight: 430,
    startDate: '2026-02-18',
    endDate: '2026-04-30',
    priceIncludesTax: true,
    badgeText: 'الأكثر طلباً ⭐',
    features: ['بوفيه إفطار يومي لشخصين', 'إلغاء مجاني حتى 48 ساعة', 'تسجيل وصول مبكر مجاني حسب الإمكانية'],
    isActive: true
  });

  // Room Form Modal
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState<RoomTypeItem>({
    id: '',
    hotelId: selectedHotelId,
    name: '',
    nameEn: '',
    category: 'غرفة ديلوكس',
    basePrice: 400,
    priceIncludesTax: true,
    totalRooms: 10,
    availableRooms: 10,
    maxGuests: 2,
    bedType: 'سرير كينج كبير',
    roomSize: '35 م²',
    features: ['واي فاي مجاني فائق السرعة', 'شاشة ذكية 55 بوصة مع قنوات فضائية', 'تكييف مركزي هادئ بتحكم مستقل'],
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
    keyPrefix: 'DLX',
    status: 'available',
    isActive: true
  });
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [imagesInput, setImagesInput] = useState('');
  const [showHotelGalleryPicker, setShowHotelGalleryPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drop-of-Drop Quick Pricing Form State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ramadan_full');
  const [targetRoomScope, setTargetRoomScope] = useState<string>('all'); // 'all' or room.id
  const [pricingType, setPricingType] = useState<'per_night' | 'package_2' | 'package_3' | 'package_5' | 'package_7' | 'package_10'>('per_night');
  const [minStayOption, setMinStayOption] = useState<number>(3);
  const [periodCustomName, setPeriodCustomName] = useState<string>('موسم شهر رمضان المبارك (كامل الشهر)');
  const [periodStartDate, setPeriodStartDate] = useState<string>('2026-02-18');
  const [periodEndDate, setPeriodEndDate] = useState<string>('2026-03-20');
  const [periodRate, setPeriodRate] = useState<number>(850);
  const [periodIsAvailable, setPeriodIsAvailable] = useState<boolean>(true);
  const [savingPeriod, setSavingPeriod] = useState(false);

  // Hotel Policy State
  const [policyForm, setPolicyForm] = useState<HotelBookingPolicy>(() => {
    return getHotelPolicy(selectedHotel);
  });
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    if (selectedHotel) {
      setPolicyForm(getHotelPolicy(selectedHotel));
    }
  }, [selectedHotel]);

  // Delete Room Modal
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  // Fetch Rooms, Meals & Packages
  const loadData = async () => {
    setLoadingRooms(true);
    setLoadingMeals(true);
    setLoadingPackages(true);
    try {
      const [r, m, p] = await Promise.all([
        getRoomsFromDb(),
        getMealPlansFromDb(),
        getPackagesFromDb()
      ]);
      setRooms(r);
      setMealPlans(m);
      setPackages(p);
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء تحميل بيانات الغرف والباقات', 'error');
    } finally {
      setLoadingRooms(false);
      setLoadingMeals(false);
      setLoadingPackages(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Rooms for Selected Hotel
  const hotelRooms = useMemo(() => {
    return rooms.filter(r => r.hotelId === selectedHotelId);
  }, [rooms, selectedHotelId]);

  // Aggregate All Season Periods across all rooms of the selected hotel
  const hotelAllSeasonPeriods = useMemo(() => {
    const list: {
      period: RoomSeasonPeriod;
      roomId: string;
      roomName: string;
    }[] = [];

    hotelRooms.forEach(rm => {
      if (rm.seasonPeriods && rm.seasonPeriods.length > 0) {
        rm.seasonPeriods.forEach(p => {
          list.push({
            period: p,
            roomId: rm.id,
            roomName: rm.name
          });
        });
      }
    });

    return list;
  }, [hotelRooms]);

  // When Dropdown 1 (Season Preset) changes: automatically populate name, dates, and min stay
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = SEASON_PRESETS.find(x => x.id === presetId);
    if (!p) return;

    setPeriodCustomName(p.name);
    setPeriodStartDate(p.defaultStart);
    setPeriodEndDate(p.defaultEnd);
    setMinStayOption(p.defaultMinStay);

    // Estimate price based on base price of selected hotel rooms
    const base = hotelRooms[0]?.basePrice || 450;
    setPeriodRate(Math.round(base * p.multiplier));
  };

  // Toggle Hotel Online Booking Availability
  const handleToggleHotelOnline = async (hotel: Hotel) => {
    const currentStatus = hotel.onlineBookingEnabled !== false;
    const newStatus = !currentStatus;
    const updatedHotel: Hotel = {
      ...hotel,
      onlineBookingEnabled: newStatus
    };

    setHotelList(prev => prev.map(h => h.id === hotel.id ? updatedHotel : h));
    if (onUpdateHotel) {
      onUpdateHotel(updatedHotel);
    }

    try {
      await saveHotelToDb(updatedHotel);
      onShowToast(
        newStatus 
          ? `تم تفعيل الحجز أونلاين لفندق "${hotel.name}" بنجاح` 
          : `تم إيقاف الحجز أونلاين لفندق "${hotel.name}"`,
        'success'
      );
      if (onRefreshHotels) {
        await onRefreshHotels();
      }
    } catch {
      onShowToast('فشل تحديث حالة إتاحة الفندق', 'error');
    }
  };

  // Save Hotel Policies
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;

    setSavingPolicy(true);
    const updatedHotel: Hotel = {
      ...selectedHotel,
      bookingPolicy: policyForm
    };

    setHotelList(prev => prev.map(h => h.id === selectedHotel.id ? updatedHotel : h));
    try {
      await saveHotelToDb(updatedHotel);
      onShowToast(`تم حفظ وتحديث سياسات وشروط فندق "${selectedHotel.name}" بنجاح`);
      if (onRefreshHotels) onRefreshHotels();
    } catch {
      onShowToast('فشل حفظ سياسات الفندق', 'error');
    } finally {
      setSavingPolicy(false);
    }
  };

  // Extract all available images from the selected hotel (main image + gallery)
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

  // Upload room images from local device
  const handleDeviceImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readers = Array.from(files).map((file: File) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(dataUrls => {
      setRoomForm(prev => ({
        ...prev,
        images: [...(prev.images || []), ...dataUrls]
      }));
      onShowToast(`تم رفع (${dataUrls.length}) صور بنجاح من جهازك إلى الغرفة`, 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }).catch(err => {
      console.error(err);
      onShowToast('حدث خطأ أثناء قراءة الصور من الجهاز', 'error');
    });
  };

  // Toggle hotel photo for room
  const handleToggleHotelImageForRoom = (url: string) => {
    setRoomForm(prev => {
      const current = prev.images || [];
      const exists = current.includes(url);
      if (exists) {
        return { ...prev, images: current.filter(img => img !== url) };
      } else {
        return { ...prev, images: [...current, url] };
      }
    });
  };

  // Set image as cover / main photo
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

  // Remove room image
  const handleRemoveRoomImage = (index: number) => {
    setRoomForm(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  // Quick Toggle Room Status & Availability
  const handleToggleRoomStatus = async (room: RoomTypeItem) => {
    const nextStatus = room.status === 'available' ? 'booked' : (room.status === 'booked' ? 'maintenance' : 'available');
    const updatedRoom: RoomTypeItem = {
      ...room,
      status: nextStatus,
      isActive: nextStatus !== 'maintenance'
    };

    setRooms(prev => prev.map(r => r.id === room.id ? updatedRoom : r));
    try {
      await saveRoomToDb(updatedRoom);
      onShowToast(`تم تحديث حالة "${room.name}" إلى: ${nextStatus === 'available' ? 'متاح للحجز ✓' : nextStatus === 'booked' ? 'محجوز بالكامل ⏳' : 'تحت الصيانة / معطل ✕'}`);
    } catch {
      onShowToast('فشل حفظ حالة الغرفة', 'error');
    }
  };

  // Open Add Room Modal
  const handleOpenAddRoom = () => {
    setEditingRoomId(null);
    setShowHotelGalleryPicker(false);
    setRoomForm({
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      hotelId: selectedHotelId,
      name: '',
      nameEn: '',
      category: 'غرفة ديلوكس',
      basePrice: 450,
      priceIncludesTax: true,
      totalRooms: 10,
      availableRooms: 10,
      maxGuests: 2,
      bedType: 'سرير كينج كبير',
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
      isActive: true
    });
    setCustomFeatureInput('');
    setImagesInput('');
    setIsRoomModalOpen(true);
  };

  // Open Edit Room Modal
  const handleOpenEditRoom = (room: RoomTypeItem) => {
    setEditingRoomId(room.id);
    setShowHotelGalleryPicker(false);
    setRoomForm({
      ...room,
      images: room.images || [],
      priceIncludesTax: room.priceIncludesTax !== false
    });
    setCustomFeatureInput('');
    setImagesInput('');
    setIsRoomModalOpen(true);
  };

  // Toggle Feature in Room Form
  const handleToggleService = (serviceName: string) => {
    setRoomForm(prev => {
      const exists = prev.features.includes(serviceName);
      if (exists) {
        return { ...prev, features: prev.features.filter(f => f !== serviceName) };
      } else {
        return { ...prev, features: [...prev.features, serviceName] };
      }
    });
  };

  // Add Custom Service
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

  // Save Room Submit
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.name.trim()) {
      onShowToast('يرجى كتابة اسم الغرفة أو الجناح', 'error');
      return;
    }

    const manualImages = imagesInput
      .split('\n')
      .map(img => img.trim())
      .filter(Boolean);

    const mergedImages = Array.from(new Set([...(roomForm.images || []), ...manualImages])).filter(Boolean);

    const updatedRoom: RoomTypeItem = {
      ...roomForm,
      hotelId: selectedHotelId,
      features: roomForm.features.length > 0 ? roomForm.features : ['إقامة فندقية فاخرة'],
      images: mergedImages.length > 0 ? mergedImages : [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
      ]
    };

    try {
      await saveRoomToDb(updatedRoom);
      setRooms(prev => {
        const idx = prev.findIndex(r => r.id === updatedRoom.id);
        if (idx >= 0) {
          const cp = [...prev];
          cp[idx] = updatedRoom;
          return cp;
        }
        return [updatedRoom, ...prev];
      });

      onShowToast(`تم حفظ وتحديث الغرفة "${updatedRoom.name}" بنجاح`);
      setIsRoomModalOpen(false);
    } catch {
      onShowToast('فشل حفظ الغرفة', 'error');
    }
  };

  // Packages Management Handlers
  const hotelPackages = useMemo(() => {
    return packages.filter(p => p.hotelId === selectedHotelId);
  }, [packages, selectedHotelId]);

  const handleOpenAddPackage = () => {
    setEditingPackageId(null);
    const defaultRoom = hotelRooms[0];
    const defaultMeal = mealPlans.find(m => m.isActive && m.type === 'breakfast') || mealPlans[0];
    setPackageForm({
      id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      hotelId: selectedHotelId,
      roomId: defaultRoom?.id || '',
      roomName: defaultRoom?.name || 'غرفة ثنائية فاخرة',
      name: 'باقة المعتمر: غرفة ثنائية شاملة بوفيه الإفطار (3 ليالٍ)',
      nameEn: 'Umrah Package: Deluxe Double + Breakfast (3 Nights)',
      mealPlanId: defaultMeal?.id || 'meal_breakfast',
      mealPlanName: defaultMeal?.name || 'شامل بوفيه إفطار فاخر لشخصين',
      nights: 3,
      totalPrice: (defaultRoom ? defaultRoom.basePrice * 3 : 1200) + 90,
      pricePerNight: Math.round(((defaultRoom ? defaultRoom.basePrice * 3 : 1200) + 90) / 3),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
      priceIncludesTax: policyForm.priceIncludesTax !== false,
      badgeText: 'الأكثر طلباً ⭐',
      features: ['بوفيه إفطار يومي لشخصين', 'إلغاء مجاني حتى 48 ساعة قبل الوصول', 'تسجيل وصول مبكر مجاني حسب الإمكانية'],
      isActive: true
    });
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg: RoomPackageOption) => {
    setEditingPackageId(pkg.id);
    setPackageForm({ ...pkg });
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.name.trim()) {
      onShowToast('يرجى كتابة اسم الباقة', 'error');
      return;
    }

    const assignedRoom = rooms.find(r => r.id === packageForm.roomId);
    const assignedMeal = mealPlans.find(m => m.id === packageForm.mealPlanId);

    const updatedPkg: RoomPackageOption = {
      ...packageForm,
      hotelId: selectedHotelId,
      roomName: assignedRoom?.name || packageForm.roomName || 'غرفة فندقية',
      mealPlanName: assignedMeal?.name || packageForm.mealPlanName || 'بدون وجبات',
      pricePerNight: Math.round(packageForm.totalPrice / (packageForm.nights || 1))
    };

    try {
      await savePackageToDb(updatedPkg);
      setPackages(prev => {
        const idx = prev.findIndex(p => p.id === updatedPkg.id);
        if (idx >= 0) {
          const cp = [...prev];
          cp[idx] = updatedPkg;
          return cp;
        }
        return [updatedPkg, ...prev];
      });
      onShowToast(`تم حفظ وتحديث باقة "${updatedPkg.name}" بنجاح`);
      setIsPackageModalOpen(false);
    } catch (err) {
      console.error(err);
      onShowToast('فشل حفظ الباقة', 'error');
    }
  };

  const handleTogglePackageStatus = async (pkg: RoomPackageOption) => {
    const updated = { ...pkg, isActive: !pkg.isActive };
    try {
      await savePackageToDb(updated);
      setPackages(prev => prev.map(p => p.id === pkg.id ? updated : p));
      onShowToast(updated.isActive ? 'تم تفعيل الباقة أونلاين' : 'تم إيقاف الباقة مؤقتاً');
    } catch {
      onShowToast('فشل تحديث حالة الباقة', 'error');
    }
  };

  const handleDeletePackage = async (pkgId: string) => {
    try {
      await deletePackageFromDb(pkgId);
      setPackages(prev => prev.filter(p => p.id !== pkgId));
      onShowToast('تم حذف الباقة بنجاح');
    } catch {
      onShowToast('فشل حذف الباقة', 'error');
    }
  };

  // Delete Room
  const handleDeleteRoom = async (id: string) => {
    try {
      await deleteRoomFromDb(id);
      setRooms(prev => prev.filter(r => r.id !== id));
      onShowToast('تم حذف الغرفة بنجاح');
      setDeletingRoomId(null);
    } catch {
      onShowToast('فشل حذف الغرفة', 'error');
    }
  };

  // Save "Drop of Drop" Season Period to Target Rooms
  const handleAddDropOfDropPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodCustomName.trim()) {
      onShowToast('يرجى تحديد أو كتابة اسم الفترة / الموسم', 'error');
      return;
    }

    if (hotelRooms.length === 0) {
      onShowToast('يرجى إضافة غرف لهذا الفندق أولاً لتطبيق جدول الأسعار عليها', 'error');
      return;
    }

    setSavingPeriod(true);
    const periodId = `period_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const newPeriodObj: RoomSeasonPeriod = {
      id: periodId,
      name: periodCustomName.trim(),
      startDate: periodStartDate,
      endDate: periodEndDate,
      pricePerNight: Number(periodRate),
      minStayNights: Number(minStayOption),
      isAvailable: periodIsAvailable
    };

    try {
      // Determine which rooms to update: All rooms in hotel, or a specific room
      const targetRooms = targetRoomScope === 'all'
        ? hotelRooms
        : hotelRooms.filter(r => r.id === targetRoomScope);

      for (const rm of targetRooms) {
        const existing = rm.seasonPeriods || [];
        const updated = [...existing.filter(p => p.name !== newPeriodObj.name), newPeriodObj];
        const roomToSave: RoomTypeItem = {
          ...rm,
          seasonPeriods: updated
        };
        await saveRoomToDb(roomToSave);
      }

      // Refresh local rooms state
      setRooms(prev => prev.map(r => {
        if (targetRoomScope === 'all' ? r.hotelId === selectedHotelId : r.id === targetRoomScope) {
          const existing = r.seasonPeriods || [];
          return {
            ...r,
            seasonPeriods: [...existing.filter(p => p.name !== newPeriodObj.name), newPeriodObj]
          };
        }
        return r;
      }));

      onShowToast(`تمت إضافة فترة "${newPeriodObj.name}" لـ (${targetRooms.length}) غرف بنجاح`);
    } catch (err) {
      console.error(err);
      onShowToast('فشل إضافة فترة التسعير', 'error');
    } finally {
      setSavingPeriod(false);
    }
  };

  // Delete Season Period from specific room
  const handleDeletePeriodFromRoom = async (roomId: string, periodId: string) => {
    const target = rooms.find(r => r.id === roomId);
    if (!target) return;

    const updated = (target.seasonPeriods || []).filter(p => p.id !== periodId);
    const updatedRoom: RoomTypeItem = {
      ...target,
      seasonPeriods: updated
    };

    try {
      await saveRoomToDb(updatedRoom);
      setRooms(prev => prev.map(r => r.id === roomId ? updatedRoom : r));
      onShowToast('تم حذف فترة التسعير بنجاح');
    } catch {
      onShowToast('فشل حذف الفترة', 'error');
    }
  };

  // Toggle Meal Plan
  const handleUpdateMeal = async (mealId: string, updates: Partial<MealPlanOption>) => {
    const updatedMeals = mealPlans.map(m => {
      if (m.id === mealId) {
        return { ...m, ...updates };
      }
      return m;
    });
    setMealPlans(updatedMeals);
    try {
      await saveMealPlansToDb(updatedMeals);
      onShowToast('تم تحديث خيارات الوجبات بنجاح');
    } catch {
      onShowToast('فشل تحديث الوجبات', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HOTEL SELECTOR & ONLINE AVAILABILITY ROW */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div>
            <h2 className="text-xl font-bold font-cairo text-stone-900">
              إدارة الحجز، الإتاحة، الغرف، وجدول الأسعار
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              تحكم في إتاحة الفندق أونلاين، حدد أنواع الغرف والخدمات، واضبط فترات المواسم بجدول ذكي بنظام Drop of Drop.
            </p>
          </div>
          <span className="text-xs text-[#B38A34] bg-[#C9A24B]/10 px-3 py-1 rounded-xl font-bold">
            {hotelList.length} فندق مسجل
          </span>
        </div>

        {/* Hotel Cards Picker */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotelList.map((h) => {
            const isSelected = h.id === selectedHotelId;
            const isOnline = h.onlineBookingEnabled !== false;
            const hRoomsCount = rooms.filter(r => r.hotelId === h.id).length;

            return (
              <div
                key={h.id}
                onClick={() => setSelectedHotelId(h.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-amber-50/70 border-[#C9A24B] shadow-md ring-2 ring-[#C9A24B]/30' 
                    : 'bg-stone-50/60 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-400 font-bold">{h.city} • {h.district}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleHotelOnline(h);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                        isOnline 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isOnline ? 'متاح أونلاين ✓' : 'غير متاح أونلاين ✕'}
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 mt-2">{h.name}</h4>
                  <p className="text-xs text-stone-500 mt-0.5 truncate">{h.distanceText}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-medium">
                    {hRoomsCount} غرف مسجلة
                  </span>
                  <span className={`font-bold flex items-center gap-1 ${isSelected ? 'text-[#B38A34]' : 'text-stone-400'}`}>
                    <span>{isSelected ? 'الفندق المختار' : 'اختيار'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CONFIGURE SELECTED HOTEL TABS */}
      {selectedHotel && (
        <div className="space-y-4">
          <div className="p-4 bg-stone-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/20 text-[#E6C673] flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">إعدادات الفندق المختار:</span>
                <h3 className="text-base font-bold text-white">{selectedHotel.name} ({selectedHotel.city})</h3>
              </div>
            </div>

            {/* Sub-tabs buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
              {[
                { id: 'rooms' as const, label: 'تحديد أنواع الغرف والخدمات', icon: BedDouble },
                { id: 'packages' as const, label: 'باقات الغرف والعروض ⭐', icon: Sparkles },
                { id: 'seasons-pricing' as const, label: 'جدول الأسعار والفترات (Drop of Drop)', icon: Calendar },
                { id: 'policy' as const, label: 'السياسات والشروط المعتمدة', icon: ShieldCheck },
                { id: 'meals' as const, label: 'باقات الوجبات', icon: Utensils }
              ].map((tab) => {
                const Icon = tab.icon;
                const isCur = hotelTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setHotelTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
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
          {/* TAB 1: ROOM TYPES & SERVICES (تحديد أنواع الغرف والخدمات)                 */}
          {/* ========================================================================= */}
          {hotelTab === 'rooms' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900">
                    قائمة أنواع الغرف والأجنحة لفندق {selectedHotel.name} ({hotelRooms.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    اضغط على "تعديل" لتخصيص الخدمات والمرافق، السعة، الأسعار، والمفاتيح الرقمية.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddRoom}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة نوع غرفة وجناح جديد</span>
                </button>
              </div>

              {hotelRooms.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
                  <BedDouble className="w-10 h-10 text-stone-300 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-800">لا توجد غرف مضافة لهذا الفندق حتى الآن</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    اضغط على زر "إضافة نوع غرفة وجناح جديد" لإدخال تفاصيل أول غرفة، وتحديد خدماتها وأسعارها.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {hotelRooms.map((room) => (
                    <div 
                      key={room.id}
                      className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div>
                        {room.images?.[0] ? (
                          <div className="h-44 rounded-2xl overflow-hidden mb-3 relative">
                            <img 
                              src={room.images[0]} 
                              alt={room.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-white font-bold">
                              {room.category}
                            </div>
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-[#C9A24B] text-[10px] text-white font-bold font-mono">
                              المفتاح: {room.keyPrefix || 'KEY'}-XXX
                            </div>
                          </div>
                        ) : (
                          <div className="h-44 rounded-2xl bg-stone-100 flex items-center justify-center mb-3 text-stone-400">
                            <BedDouble className="w-10 h-10 text-[#C9A24B]" />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleToggleRoomStatus(room)}
                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all hover:scale-105 cursor-pointer flex items-center gap-1 ${
                              room.status === 'available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100' :
                              room.status === 'booked' ? 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100' : 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
                            }`}
                            title="اضغط للتبديل السريع بين (متاح / محجوز / صيانة)"
                          >
                            <span>{room.status === 'available' ? 'متاح للحجز ✓' : room.status === 'booked' ? 'محجوز بالكامل ⏳' : 'صيانة / معطل ✕'}</span>
                          </button>

                          {room.seasonPeriods && room.seasonPeriods.length > 0 && (
                            <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">
                              {room.seasonPeriods.length} فترات تسعير
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-stone-900 mt-2 font-cairo">{room.name}</h4>
                        <p className="text-xs text-stone-500 mt-0.5">{room.bedType} • {room.roomSize}</p>

                        {/* Services preview badges */}
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {room.features.slice(0, 3).map((feat, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium">
                              {feat}
                            </span>
                          ))}
                          {room.features.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-[#B38A34] text-[10px] font-bold">
                              +{room.features.length - 3} خدمات
                            </span>
                          )}
                        </div>

                        <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-stone-400 block font-bold">المتاح / الإجمالي:</span>
                            <strong className="text-stone-800">{room.availableRooms} من {room.totalRooms} غرفة</strong>
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] text-stone-400 block font-bold">أقصى نزلاء:</span>
                            <strong className="text-stone-800">{room.maxGuests} ضيوف</strong>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <span className="text-lg font-black text-[#B38A34]">{room.basePrice} ر.س</span>
                          <span className="text-[11px] text-stone-400"> / ليلة</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRoom(room)}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="تعديل الغرفة والخدمات"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingRoomId(room.id)}
                            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            title="حذف الغرفة"
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
          {/* TAB 2: SEASONS & PRICING TABLE (جدول الأسعار والفترات - Drop of Drop)      */}
          {/* ========================================================================= */}
          {hotelTab === 'seasons-pricing' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Drop-of-Drop Quick Creator Form Card */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#B38A34] flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 font-cairo">
                      إضافة وتحديد فترات الأسعار الذكية بنظام (Drop of Drop)
                    </h3>
                    <p className="text-xs text-stone-500">
                      اختر الموسم من القائمة المنسدلة، حدد نطاق الغرف، طريقة التسعير (ليلة أو باقة)، وسيتم تحديث وحساب الأسعار تلقائياً!
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddDropOfDropPeriod} className="space-y-4">
                  {/* Row 1: The 4 Dropdowns (Drop of Drop) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-bold">
                    {/* Drop 1: Preset Season / Period */}
                    <div>
                      <label className="block text-stone-700 mb-1">
                        1. اختر الموسم أو الفترة (Preset)
                      </label>
                      <select
                        value={selectedPresetId}
                        onChange={(e) => handlePresetChange(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                      >
                        {SEASON_PRESETS.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Drop 2: Target Room Scope */}
                    <div>
                      <label className="block text-stone-700 mb-1">
                        2. نطاق الغرف المطبقة
                      </label>
                      <select
                        value={targetRoomScope}
                        onChange={(e) => setTargetRoomScope(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                      >
                        <option value="all">⭐ تطبيق على جميع غرف الفندق دفعة واحدة</option>
                        {hotelRooms.map(r => (
                          <option key={r.id} value={r.id}>غرفة: {r.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Drop 3: Pricing & Stay Type */}
                    <div>
                      <label className="block text-stone-700 mb-1">
                        3. نوع التسعير والإقامة
                      </label>
                      <select
                        value={pricingType}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setPricingType(val);
                          if (val === 'package_2') setMinStayOption(2);
                          else if (val === 'package_3') setMinStayOption(3);
                          else if (val === 'package_5') setMinStayOption(5);
                          else if (val === 'package_7') setMinStayOption(7);
                          else if (val === 'package_10') setMinStayOption(10);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                      >
                        <option value="per_night">💰 سعر الليلة الواحدة (Per Night)</option>
                        <option value="package_2">📦 باقة إقامة ليلتان (2 Nights)</option>
                        <option value="package_3">📦 باقة إقامة 3 ليالٍ (3 Nights)</option>
                        <option value="package_5">📦 باقة إقامة 5 ليالٍ (5 Nights)</option>
                        <option value="package_7">📦 باقة أسبوعية 7 ليالٍ (Weekly)</option>
                        <option value="package_10">📦 باقة العشر الأواخر 10 ليالٍ (10 Nights)</option>
                      </select>
                    </div>

                    {/* Drop 4: Min Stay Nights */}
                    <div>
                      <label className="block text-stone-700 mb-1">
                        4. الحد الأدنى للإقامة
                      </label>
                      <select
                        value={minStayOption}
                        onChange={(e) => setMinStayOption(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 7, 10, 14].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'ليلة واحدة' : 'ليالٍ'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Name, Dates, Price & Submit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-bold pt-1">
                    <div>
                      <label className="block text-stone-700 mb-1">اسم الفترة المعروض للنزلاء</label>
                      <input
                        type="text"
                        required
                        value={periodCustomName}
                        onChange={(e) => setPeriodCustomName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 mb-1">تاريخ البداية (من)</label>
                      <input
                        type="date"
                        required
                        value={periodStartDate}
                        onChange={(e) => setPeriodStartDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 mb-1">تاريخ النهاية (إلى)</label>
                      <input
                        type="date"
                        required
                        value={periodEndDate}
                        onChange={(e) => setPeriodEndDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 mb-1">السعر لليلة الواحدة (ر.س)</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={periodRate}
                        onChange={(e) => setPeriodRate(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-bold text-sm focus:outline-none focus:border-[#C9A24B]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                      <input
                        type="checkbox"
                        checked={periodIsAvailable}
                        onChange={(e) => setPeriodIsAvailable(e.target.checked)}
                        className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                      />
                      <span>متاح للحجز الفوري أونلاين في هذه الفترة</span>
                    </label>

                    <button
                      type="submit"
                      disabled={savingPeriod}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{savingPeriod ? 'جاري التطبيق والحفظ...' : 'تطبيق وإضافة إلى جدول الأسعار'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Master Unified Seasons & Rates Table */}
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <h4 className="text-sm font-bold text-stone-900 font-cairo">
                    جدول الفترات والمواسم المعتمدة لفندق {selectedHotel.name} ({hotelAllSeasonPeriods.length})
                  </h4>
                  <span className="text-xs text-stone-500">
                    يتم تطبيق هذه الأسعار تلقائياً عند بحث العميل بالتواريخ المحددة.
                  </span>
                </div>

                {hotelAllSeasonPeriods.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                        <tr>
                          <th className="p-3">اسم الفترة / الموسم</th>
                          <th className="p-3">الغرفة المستهدفة</th>
                          <th className="p-3">من تاريخ</th>
                          <th className="p-3">إلى تاريخ</th>
                          <th className="p-3">سعر الليلة</th>
                          <th className="p-3">الحد الأدنى للإقامة</th>
                          <th className="p-3">حالة الإتاحة</th>
                          <th className="p-3 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-semibold text-stone-700">
                        {hotelAllSeasonPeriods.map((item, idx) => (
                          <tr key={`${item.roomId}_${item.period.id}_${idx}`} className="hover:bg-amber-50/20 transition-colors">
                            <td className="p-3">
                              <span className="font-bold text-stone-900 block font-cairo">{item.period.name}</span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-[11px] font-bold">
                                {item.roomName}
                              </span>
                            </td>
                            <td className="p-3 font-mono">{item.period.startDate}</td>
                            <td className="p-3 font-mono">{item.period.endDate}</td>
                            <td className="p-3">
                              <strong className="text-[#B38A34] text-sm font-bold">{item.period.pricePerNight} ر.س</strong>
                              <span className="text-[10px] text-stone-400"> / ليلة</span>
                            </td>
                            <td className="p-3">{item.period.minStayNights || 1} ليالٍ</td>
                            <td className="p-3">
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                                item.period.isAvailable !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {item.period.isAvailable !== false ? 'متاح أونلاين ✓' : 'مغلق مؤقتاً'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeletePeriodFromRoom(item.roomId, item.period.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                                title="حذف هذه الفترة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-stone-400">
                    لا توجد فترات تسعير مضافة حالياً لهذا الفندق. يتم تطبيق الأسعار الأساسية للغرف.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PACKAGES & OFFERS (باقات الغرف والعروض الخاصة)                    */}
          {/* ========================================================================= */}
          {hotelTab === 'packages' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-stone-900 font-cairo">
                      باقات وعروض الإقامة الخاصة لفندق {selectedHotel.name}
                    </h3>
                    <span className="text-[11px] bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                      {hotelPackages.length} باقات مضافة
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    أنشئ باقات متكاملة تشمل نوع الغرفة، الوجبات، عدد الليالي، السعر الإجمالي، وفترة السريان (مثل: باقة المعتمر، عطلة الربيع، ليالي رمضان).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddPackage}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة باقة إقامة جديدة</span>
                </button>
              </div>

              {hotelPackages.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
                  <Sparkles className="w-10 h-10 text-[#C9A24B] mx-auto opacity-70" />
                  <h4 className="text-sm font-bold text-stone-800">لا توجد باقات مضافة لهذا الفندق بعد</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    اضغط على زر "إضافة باقة إقامة جديدة" لإنشاء عرض مخصص يشمل الغرفة والوجبة وسعر الإقامة الكاملة لجذب النزلاء.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {hotelPackages.map(pkg => (
                    <div
                      key={pkg.id}
                      className={`p-5 rounded-3xl bg-white border transition-all flex flex-col justify-between relative shadow-2xs ${
                        pkg.isActive ? 'border-stone-200 hover:shadow-md' : 'border-stone-200 opacity-60 bg-stone-50'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 text-[10px] font-bold">
                            {pkg.badgeText || 'عرض خاص ⭐'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePackageStatus(pkg)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                              pkg.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {pkg.isActive ? 'مفعلة أونلاين ✓' : 'معطلة'}
                          </button>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-stone-900 leading-snug">{pkg.name}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                            <BedDouble className="w-3.5 h-3.5 text-[#B38A34]" />
                            <span>{pkg.roomName}</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/50 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">مدة الإقامة:</span>
                            <span className="font-bold text-stone-800">{pkg.nights} ليالٍ</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">الوجبة المشمولة:</span>
                            <span className="font-bold text-stone-800 truncate max-w-[150px]">{pkg.mealPlanName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">فترة الصلاحية:</span>
                            <span className="font-mono text-[11px] text-stone-700">{pkg.startDate} إلى {pkg.endDate}</span>
                          </div>
                        </div>

                        {pkg.features && pkg.features.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {pkg.features.map((feat, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-[11px] text-stone-600">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-400 block">إجمالي سعر الباقة:</span>
                          <div className="flex items-baseline gap-1">
                            <strong className="text-lg font-black text-[#B38A34] font-mono">
                              {pkg.totalPrice.toLocaleString()}
                            </strong>
                            <span className="text-xs font-bold text-stone-600">ر.س</span>
                          </div>
                          <span className="text-[10px] text-stone-400 block">
                            {pkg.priceIncludesTax !== false ? 'شامل الضريبة 15%' : '+15% ضريبة القيمة المضافة'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPackage(pkg)}
                            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                            title="تعديل الباقة"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            title="حذف الباقة"
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
          {/* TAB 3: POLICIES & TERMS (السياسات والشروط المعتمدة)                       */}
          {/* ========================================================================= */}
          {hotelTab === 'policy' && (
            <form onSubmit={handleSavePolicy} className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-6 animate-fadeIn">
              <div className="pb-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-cairo">
                    سياسات وشروط فندق {selectedHotel.name} المعتمدة
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    مواعيد الدخول والمغادرة، شروط الإلغاء والاسترداد، وإدارة الشارات وسياسة الضريبة المطبقة.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={savingPolicy}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingPolicy ? 'جاري الحفظ...' : 'حفظ السياسات والشروط'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs font-bold">
                <div>
                  <label className="block text-stone-700 mb-1.5">موعد تسجيل الوصول (Check-in)</label>
                  <input
                    type="text"
                    value={policyForm.checkInTime}
                    onChange={(e) => setPolicyForm({ ...policyForm, checkInTime: e.target.value })}
                    placeholder="مثال: 16:00 عصراً"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-1.5">موعد تسجيل المغادرة (Check-out)</label>
                  <input
                    type="text"
                    value={policyForm.checkOutTime}
                    onChange={(e) => setPolicyForm({ ...policyForm, checkOutTime: e.target.value })}
                    placeholder="مثال: 12:00 ظهراً"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-1.5">نوع سياسة الإلغاء المعتمدة</label>
                  <select
                    value={policyForm.cancellationType}
                    onChange={(e) => setPolicyForm({ ...policyForm, cancellationType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    <option value="free_flexible">إلغاء مرن مجاني بالكامل</option>
                    <option value="moderate">إلغاء متوسط (خصم ليلة واحدة)</option>
                    <option value="strict">إلغاء صارم</option>
                    <option value="non_refundable">غير مسترد نهائياً</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 mb-1.5">مهلة الإلغاء المجاني (عدد الأيام قبل موعد الوصول)</label>
                  <input
                    type="number"
                    min={0}
                    value={policyForm.cancellationNoticeDays}
                    onChange={(e) => setPolicyForm({ ...policyForm, cancellationNoticeDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-1.5">سعر السرير الإضافي لليلة (ر.س)</label>
                  <input
                    type="number"
                    min={0}
                    value={policyForm.extraBedPrice}
                    onChange={(e) => setPolicyForm({ ...policyForm, extraBedPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-1.5">شروط وطريقة الدفع المعتمدة</label>
                  <input
                    type="text"
                    value={policyForm.paymentTerms}
                    onChange={(e) => setPolicyForm({ ...policyForm, paymentTerms: e.target.value })}
                    placeholder="الدفع عند الوصول في الفندق نقداً أو ببطاقات مدى وفيزا"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION: ظهور أزرار وشارات الحجز في البوابة (Booking Badges & Buttons)    */}
              {/* ========================================================================= */}
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#B38A34]" />
                  <h4 className="text-xs font-bold text-stone-900">
                    خيارات ظهور أزرار وشارات الحجز في جدول الغرف وبوابة الحجز:
                  </h4>
                </div>
                <p className="text-[11px] text-stone-500">
                  يمكنك تفعيل أو إخفاء أي شارة أو ميزة تظهر للنزيل بجوار كل غرفة (مثل إخفاء الإلغاء المجاني أو الدفع في الفندق).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Badge 1: Free Cancellation */}
                  <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">شارة "إلغاء مجاني"</span>
                      <span className="text-[11px] text-stone-500">عرض إمكانية الإلغاء والاسترداد حتى مهلة محددة</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPolicyForm({ ...policyForm, showFreeCancellationBadge: policyForm.showFreeCancellationBadge === false ? true : false })}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        policyForm.showFreeCancellationBadge !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {policyForm.showFreeCancellationBadge !== false ? 'مفعلة أونلاين ✓' : 'مخفية ✕'}
                    </button>
                  </div>

                  {/* Badge 2: Pay At Hotel */}
                  <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">شارة "لا يلزم الدفع المسبق - ادفع بالفندق"</span>
                      <span className="text-[11px] text-stone-500">توضيح إمكانية السداد عند الوصول نقداً أو بالبطاقة</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPolicyForm({ ...policyForm, showPayAtHotelBadge: policyForm.showPayAtHotelBadge === false ? true : false })}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        policyForm.showPayAtHotelBadge !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {policyForm.showPayAtHotelBadge !== false ? 'مفعلة أونلاين ✓' : 'مخفية ✕'}
                    </button>
                  </div>

                  {/* Badge 3: Instant Confirm */}
                  <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">شارة "تأكيد فوري عبر واتساب وبمفتاح رقمي"</span>
                      <span className="text-[11px] text-stone-500">إبراز ميزة المراجعة السريعة وإصدار المفتاح الرقمي</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPolicyForm({ ...policyForm, showInstantConfirmBadge: policyForm.showInstantConfirmBadge === false ? true : false })}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        policyForm.showInstantConfirmBadge !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {policyForm.showInstantConfirmBadge !== false ? 'مفعلة أونلاين ✓' : 'مخفية ✕'}
                    </button>
                  </div>

                  {/* Badge 4: Meal Options */}
                  <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">خيارات وباقات الوجبات المشمولة (الإفطار)</span>
                      <span className="text-[11px] text-stone-500">إتاحة اختيار الوجبات (بوفيه إفطار، نصف إقامة) أثناء الحجز</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPolicyForm({ ...policyForm, showMealInclusionBadge: policyForm.showMealInclusionBadge === false ? true : false })}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        policyForm.showMealInclusionBadge !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {policyForm.showMealInclusionBadge !== false ? 'مفعلة أونلاين ✓' : 'مخفية ✕'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION: سياسة ضريبة القيمة المضافة 15% (VAT Tax Policy)                 */}
              {/* ========================================================================= */}
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#B38A34]" />
                  <h4 className="text-xs font-bold text-stone-900">
                    تحديد سياسة ضريبة القيمة المضافة (15% VAT):
                  </h4>
                </div>
                <p className="text-[11px] text-stone-500">
                  حدد ما إذا كانت أسعار الغرف والباقات المدخلة شاملة للضريبة، أم غير شاملة ليقوم النظام باحتساب +15% ضريبة وتوضيحها للنزيل.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Option 1: Inclusive */}
                  <div
                    onClick={() => setPolicyForm({ ...policyForm, priceIncludesTax: true })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      policyForm.priceIncludesTax !== false
                        ? 'bg-amber-50/80 border-[#C9A24B] ring-2 ring-[#C9A24B]/30'
                        : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      policyForm.priceIncludesTax !== false ? 'bg-[#C9A24B] text-white' : 'border border-stone-300'
                    }`}>
                      {policyForm.priceIncludesTax !== false && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        الأسعار شاملة ضريبة القيمة المضافة (15% مشمولة بالفعل)
                      </span>
                      <span className="text-[11px] text-stone-500 mt-1 block">
                        السعر المعروض للنزيل نهائي ولن تضاف أي مبالغ إضافية عند الدفع، مع إبراز عبارة "شامل الضرائب والرسوم الحكومية".
                      </span>
                    </div>
                  </div>

                  {/* Option 2: Exclusive */}
                  <div
                    onClick={() => setPolicyForm({ ...policyForm, priceIncludesTax: false })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      policyForm.priceIncludesTax === false
                        ? 'bg-amber-50/80 border-[#C9A24B] ring-2 ring-[#C9A24B]/30'
                        : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      policyForm.priceIncludesTax === false ? 'bg-[#C9A24B] text-white' : 'border border-stone-300'
                    }`}>
                      {policyForm.priceIncludesTax === false && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        الأسعار غير شاملة الضريبة (يتم احتساب +15% ضريبة إضافية)
                      </span>
                      <span className="text-[11px] text-stone-500 mt-1 block">
                        سيتم إبراز السعر الأساسي الصافي مع توضيح مبلغ ضريبة القيمة المضافة (15%) بشكل شفاف وإضافته للإجمالي النهائي في الفاتورة.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">سياسة إقامة الأطفال والرضع</label>
                <textarea
                  rows={2}
                  value={policyForm.childrenPolicyText}
                  onChange={(e) => setPolicyForm({ ...policyForm, childrenPolicyText: e.target.value })}
                  placeholder="مثال: يرحب الفندق بالأطفال من جميع الأعمار، ويقيم الأطفال دون سن 6 سنوات مجاناً عند استخدام الأسرة المتوفرة."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  البنود والشروط المعتمدة دولياً (اكتب كل بند في سطر مستقل)
                </label>
                <textarea
                  rows={4}
                  value={policyForm.termsAndConditionsList.join('\n')}
                  onChange={(e) => setPolicyForm({ 
                    ...policyForm, 
                    termsAndConditionsList: e.target.value.split('\n').filter(Boolean) 
                  })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: MEAL PLANS (باقات الوجبات)                                         */}
          {/* ========================================================================= */}
          {hotelTab === 'meals' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900">
                <strong>خيارات وباقات الوجبات الفندقية المعتمدة: </strong>
                يمكنك تعديل أسعار الوجبات للفرد في الليلة الواحدة، أو تعطيل/تفعيل أي باقة حسب سياسة الفندق.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mealPlans.map((meal) => (
                  <div key={meal.id} className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                          <Coffee className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">{meal.name}</h4>
                          <span className="text-xs text-stone-400">{meal.nameEn}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateMeal(meal.id, { isActive: !meal.isActive })}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          meal.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        {meal.isActive ? 'مفعلة ✓' : 'معطلة'}
                      </button>
                    </div>

                    <p className="text-xs text-stone-500">{meal.description}</p>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-600">سعر الوجبة (للفرد / ليلة):</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          min={0}
                          value={meal.pricePerPersonPerNight}
                          onChange={(e) => handleUpdateMeal(meal.id, { pricePerPersonPerNight: Number(e.target.value) })}
                          className="w-24 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] text-center"
                        />
                        <span className="text-xs font-bold text-stone-500">ر.س</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT ROOM & SERVICES MODAL (تحديد أنواع الغرف والخدمات)              */}
      {/* ========================================================================= */}
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
                  {editingRoomId ? 'تعديل نوع الغرفة والخدمات' : 'إضافة نوع غرفة وجناح جديد'}
                </h3>
                <span className="text-xs text-[#B38A34] font-bold">
                  {selectedHotel ? `${selectedHotel.name} (${selectedHotel.city})` : ''}
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

            <form onSubmit={handleSaveRoom} className="space-y-4 text-xs font-bold">
              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">اسم الغرفة / الجناح (بالعربية)</label>
                  <input 
                    type="text"
                    required
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    placeholder="مثال: جناح ملكي بإطلالة بانورامية على الحرم"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">تصنيف الغرفة</label>
                  <select
                    value={roomForm.category}
                    onChange={(e) => setRoomForm({ ...roomForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    <option value="جناح ملكي">جناح ملكي (Royal Suite)</option>
                    <option value="جناح تنفيذي">جناح تنفيذي (Executive Suite)</option>
                    <option value="غرفة ديلوكس">غرفة ديلوكس (Deluxe Room)</option>
                    <option value="غرفة عائلية">غرفة عائلية (Family Room)</option>
                    <option value="غرفة ثلاثية">غرفة ثلاثية (Triple Room)</option>
                    <option value="غرفة ثنائية">غرفة ثنائية (Twin / Double)</option>
                    <option value="غرفة مفردة">غرفة مفردة (Single)</option>
                  </select>
                </div>
              </div>

              {/* Price, Beds & Guests */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">سعر الليلة الأساسي (ر.س)</label>
                  <input 
                    type="number"
                    min={0}
                    required
                    value={roomForm.basePrice}
                    onChange={(e) => setRoomForm({ ...roomForm, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">أقصى عدد نزلاء</label>
                  <input 
                    type="number"
                    min={1}
                    value={roomForm.maxGuests}
                    onChange={(e) => setRoomForm({ ...roomForm, maxGuests: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">إجمالي الغرف</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    value={roomForm.totalRooms}
                    onChange={(e) => setRoomForm({ ...roomForm, totalRooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">المتاح للحجز الآن</label>
                  <input 
                    type="number"
                    min={0}
                    required
                    value={roomForm.availableRooms}
                    onChange={(e) => setRoomForm({ ...roomForm, availableRooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Tax Option for this Room */}
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                  <input 
                    type="checkbox"
                    checked={roomForm.priceIncludesTax !== false}
                    onChange={(e) => setRoomForm({ ...roomForm, priceIncludesTax: e.target.checked })}
                    className="w-4 h-4 rounded text-[#B38A34] focus:ring-[#C9A24B] border-stone-300 cursor-pointer"
                  />
                  <span>سعر الليلة للغرفة شامل ضريبة القيمة المضافة (15% VAT)</span>
                </label>
                <span className="text-[11px] text-amber-800 font-medium">
                  {roomForm.priceIncludesTax !== false ? '✓ السعر نهائي شامل الضرائب' : 'تُضاف 15% ضريبة إضافية عند الحجز'}
                </span>
              </div>

              {/* Bed Type, Room Size, Key Prefix, Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">نوع السرير</label>
                  <input 
                    type="text"
                    value={roomForm.bedType}
                    onChange={(e) => setRoomForm({ ...roomForm, bedType: e.target.value })}
                    placeholder="سرير كينج، سريرين منفصلين..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">مساحة الغرفة</label>
                  <input 
                    type="text"
                    value={roomForm.roomSize}
                    onChange={(e) => setRoomForm({ ...roomForm, roomSize: e.target.value })}
                    placeholder="مثال: 38 م²"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">بادئة المفتاح الرقمي</label>
                  <input 
                    type="text"
                    value={roomForm.keyPrefix || 'KEY'}
                    onChange={(e) => setRoomForm({ ...roomForm, keyPrefix: e.target.value })}
                    placeholder="DLX أو PRS"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-mono focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">حالة الغرفة</label>
                  <select
                    value={roomForm.status}
                    onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value as RoomStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    <option value="available">متاح للحجز</option>
                    <option value="booked">محجوز</option>
                    <option value="maintenance">صيانة</option>
                  </select>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION: تحديد الخدمات (Interactive Services Checklist)                   */}
              {/* ========================================================================= */}
              <div className="pt-2 border-t border-stone-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-800">
                    تحديد الخدمات والمميزات المشمولة في هذه الغرفة (اضغط للاختيار):
                  </label>
                  <span className="text-[11px] text-[#B38A34] font-bold">
                    {roomForm.features.length} خدمات محددة
                  </span>
                </div>

                {/* Grid of clickable service pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PREDEFINED_ROOM_SERVICES.map(srv => {
                    const isSelected = roomForm.features.includes(srv.name);
                    const Icon = srv.icon;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => handleToggleService(srv.name)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 select-none ${
                          isSelected
                            ? 'bg-amber-50/90 border-[#C9A24B] text-amber-950 font-bold shadow-2xs'
                            : 'bg-stone-50/70 border-stone-200/80 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#C9A24B] text-white' : 'bg-stone-200 text-stone-400'
                        }`}>
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-[11px] truncate">{srv.name}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Add Custom Specialty Service */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customFeatureInput}
                    onChange={(e) => setCustomFeatureInput(e.target.value)}
                    placeholder="إضافة خدمة فندقية مخصصة أخرى..."
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomService}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    إضافة +
                  </button>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION: التحكم في صور الغرفة (رفع من الجهاز + تحديد من صور الفندق)       */}
              {/* ========================================================================= */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-900">
                      معرض صور الغرفة ({roomForm.images?.length || 0} صور):
                    </label>
                    <span className="text-[11px] text-stone-500">
                      الصورة الأولى باللون الذهبي هي الغلاف الرئيسي، يمكنك رفع صور من جهازك أو اختيارها من صور الفندق.
                    </span>
                  </div>

                  {/* Upload Actions */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleDeviceImagesUpload}
                      className="hidden"
                      id="room-device-file-input"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[#B38A34] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-[#C9A24B]/30"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع من جهازك</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowHotelGalleryPicker(!showHotelGalleryPicker)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${
                        showHotelGalleryPicker 
                          ? 'bg-stone-900 text-white border-stone-900' 
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>صور الفندق ({hotelAvailableImages.length})</span>
                    </button>
                  </div>
                </div>

                {/* Hotel Gallery Picker Popdown */}
                {showHotelGalleryPicker && (
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800">
                        اضغط على أي صورة لإضافتها أو إزالتها من هذه الغرفة:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowHotelGalleryPicker(false)}
                        className="text-[11px] text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
                      >
                        إغلاق ✕
                      </button>
                    </div>

                    {hotelAvailableImages.length === 0 ? (
                      <p className="text-xs text-stone-400 py-3 text-center">لا توجد صور مسجلة في معرض هذا الفندق حالياً.</p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                        {hotelAvailableImages.map((imgUrl, i) => {
                          const isPicked = (roomForm.images || []).includes(imgUrl);
                          return (
                            <div
                              key={i}
                              onClick={() => handleToggleHotelImageForRoom(imgUrl)}
                              className={`aspect-video rounded-xl overflow-hidden relative cursor-pointer border-2 transition-all group ${
                                isPicked 
                                  ? 'border-[#C9A24B] shadow-md ring-2 ring-[#C9A24B]/30' 
                                  : 'border-transparent opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={imgUrl} alt={`Hotel ${i}`} className="w-full h-full object-cover" />
                              <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                                isPicked ? 'bg-black/40' : 'bg-black/0 group-hover:bg-black/20'
                              }`}>
                                {isPicked && (
                                  <div className="w-5 h-5 rounded-full bg-[#C9A24B] text-white flex items-center justify-center shadow-xs">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Current Room Images Thumbnails */}
                {roomForm.images && roomForm.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {roomForm.images.map((img, idx) => {
                      const isCover = idx === 0;
                      return (
                        <div 
                          key={idx} 
                          className={`rounded-2xl overflow-hidden border-2 relative group bg-stone-100 ${
                            isCover ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/20' : 'border-stone-200'
                          }`}
                        >
                          <div className="aspect-video relative">
                            <img src={img} alt={`Room ${idx}`} className="w-full h-full object-cover" />
                            {isCover && (
                              <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-[#C9A24B] text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                <span>الغلاف</span>
                              </span>
                            )}
                          </div>

                          <div className="p-1.5 bg-white/95 flex items-center justify-between gap-1 border-t border-stone-100">
                            {!isCover ? (
                              <button
                                type="button"
                                onClick={() => handleSetCoverImage(idx)}
                                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-[#C9A24B]/15 hover:text-[#B38A34] text-[10px] font-bold text-stone-600 transition-colors cursor-pointer"
                              >
                                تعيين كغلاف
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-[#B38A34] px-1">رئيسية ✓</span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveRoomImage(idx)}
                              className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
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
                  <div className="p-6 text-center rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 text-xs">
                    لا توجد صور محددة لهذه الغرفة. ارفع صور من جهازك أو اختر من صور الفندق أعلاه.
                  </div>
                )}

                {/* Optional External URL input */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={imagesInput}
                    onChange={(e) => setImagesInput(e.target.value)}
                    placeholder="أو اكتب رابط صورة مباشر (https://...) واضغط حفظ"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-[11px] font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
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
                  {editingRoomId ? 'تحديث وحفظ الغرفة' : 'إضافة الغرفة فوراً'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT PACKAGE MODAL (إضافة وتعديل باقة إقامة)                         */}
      {/* ========================================================================= */}
      {isPackageModalOpen && (
        <div 
          className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPackageModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-cairo">
                    {editingPackageId ? 'تعديل باقة الإقامة' : 'إضافة باقة إقامة جديدة'}
                  </h3>
                  <span className="text-xs text-[#B38A34] font-bold">
                    {selectedHotel ? `${selectedHotel.name} (${selectedHotel.city})` : ''}
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsPackageModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-stone-700 mb-1">اسم الباقة (بالعربية)</label>
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
                  <label className="block text-stone-700 mb-1">نوع الغرفة المخصصة للباقة</label>
                  <select
                    value={packageForm.roomId}
                    onChange={(e) => {
                      const r = rooms.find(rm => rm.id === e.target.value);
                      setPackageForm({
                        ...packageForm,
                        roomId: e.target.value,
                        roomName: r?.name || ''
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    {hotelRooms.length === 0 ? (
                      <option value="">لا توجد غرف مسجلة</option>
                    ) : (
                      hotelRooms.map(rm => (
                        <option key={rm.id} value={rm.id}>
                          {rm.name} ({rm.category} - {rm.basePrice} ر.س)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">الوجبة الفندقية المشمولة</label>
                  <select
                    value={packageForm.mealPlanId}
                    onChange={(e) => {
                      const m = mealPlans.find(ml => ml.id === e.target.value);
                      setPackageForm({
                        ...packageForm,
                        mealPlanId: e.target.value,
                        mealPlanName: m?.name || ''
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                  >
                    {mealPlans.map(ml => (
                      <option key={ml.id} value={ml.id}>
                        {ml.name} ({ml.pricePerPersonPerNight} ر.س / ليلة)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">عدد الليالي المشمولة</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    value={packageForm.nights}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setPackageForm({
                        ...packageForm,
                        nights: n,
                        pricePerNight: Math.round(packageForm.totalPrice / (n || 1))
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-center font-bold focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">السعر الإجمالي للباقة (ر.س)</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    value={packageForm.totalPrice}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setPackageForm({
                        ...packageForm,
                        totalPrice: p,
                        pricePerNight: Math.round(p / (packageForm.nights || 1))
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-[#B38A34] text-center font-mono font-bold focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-stone-700 mb-1">الشارة التسويقية</label>
                  <input 
                    type="text"
                    value={packageForm.badgeText || ''}
                    onChange={(e) => setPackageForm({ ...packageForm, badgeText: e.target.value })}
                    placeholder="الأكثر طلباً ⭐ أو باقة VIP"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Tax checkbox */}
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                  <input 
                    type="checkbox"
                    checked={packageForm.priceIncludesTax !== false}
                    onChange={(e) => setPackageForm({ ...packageForm, priceIncludesTax: e.target.checked })}
                    className="w-4 h-4 rounded text-[#B38A34] focus:ring-[#C9A24B] border-stone-300 cursor-pointer"
                  />
                  <span>سعر الباقة شامل ضريبة القيمة المضافة (15% VAT)</span>
                </label>
                <span className="text-[11px] text-amber-800">
                  {packageForm.priceIncludesTax !== false ? 'شامل الضريبة ✓' : '+15% ضريبة إضافية'}
                </span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 mb-1">تاريخ بدء سريان الباقة</label>
                  <input 
                    type="date"
                    required
                    value={packageForm.startDate}
                    onChange={(e) => setPackageForm({ ...packageForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 mb-1">تاريخ انتهاء سريان الباقة</label>
                  <input 
                    type="date"
                    required
                    value={packageForm.endDate}
                    onChange={(e) => setPackageForm({ ...packageForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Package features */}
              <div>
                <label className="block text-stone-700 mb-1">
                  مميزات الباقة الإضافية (اكتب كل ميزة في سطر مستقل)
                </label>
                <textarea 
                  rows={3}
                  value={(packageForm.features || []).join('\n')}
                  onChange={(e) => setPackageForm({ 
                    ...packageForm, 
                    features: e.target.value.split('\n').filter(Boolean) 
                  })}
                  placeholder="بوفيه إفطار يومي لشخصين&#10;إلغاء مجاني حتى 48 ساعة&#10;تسجيل وصول مبكر مجاني"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-[#C9A24B] resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingPackageId ? 'تحديث وحفظ الباقة' : 'إضافة الباقة فوراً'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRoomId && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-stone-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-stone-900">هل أنت متأكد من حذف هذه الغرفة؟</h4>
              <p className="text-xs text-stone-500 mt-1">سيتم إزالة الغرفة وجداول أسعارها المرتبطة من قاعدة البيانات.</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRoomId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
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
    </div>
  );
};
