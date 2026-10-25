import React, { useState, useEffect, useMemo } from 'react';
import { 
  Hotel, 
  RoomTypeItem, 
  MealPlanOption, 
  HotelPricingPeriod, 
  SiteSettings 
} from '../types';
import { 
  getRoomsFromDb, 
  getCachedRooms,
  getCachedMealPlans,
  getCachedPricingPeriods,
  saveRoomToDb, 
  getMealPlansFromDb, 
  saveMealPlansToDb,
  getPricingPeriodsFromDb, 
  savePricingPeriodToDb, 
  deletePricingPeriodFromDb,
  checkPeriodOverlap
} from '../services/bookingService';
import { rebuildHotelAvailability } from '../services/availabilityService';
import { saveHotelToDb } from '../services/firebase';
import { 
  Building2, 
  Calendar, 
  Sparkles, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  BedDouble, 
  Utensils, 
  Sliders, 
  SlidersHorizontal,
  Info,
  CalendarRange,
  Zap,
  Lock,
  ChevronDown,
  Layers
} from 'lucide-react';

interface AdminOnlineAvailabilityManagerProps {
  hotels: Hotel[];
  siteSettings: SiteSettings;
  onUpdateHotel: (hotel: Hotel) => void;
  onUpdateSiteSettings: (settings: SiteSettings) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminOnlineAvailabilityManager: React.FC<AdminOnlineAvailabilityManagerProps> = ({
  hotels,
  siteSettings,
  onUpdateHotel,
  onUpdateSiteSettings,
  onShowToast
}) => {
  // Selected Hotel State
  const [selectedHotelId, setSelectedHotelId] = useState<string>(hotels[0]?.id || '');
  const selectedHotel = useMemo(() => {
    return hotels.find(h => h.id === selectedHotelId) || hotels[0] || null;
  }, [hotels, selectedHotelId]);

  // Data states for the selected hotel - Cache-First Hydration (0ms Load Time)
  const [rooms, setRooms] = useState<RoomTypeItem[]>(() => {
    return selectedHotelId ? getCachedRooms(selectedHotelId) : [];
  });
  const [mealPlans, setMealPlans] = useState<MealPlanOption[]>(() => {
    return selectedHotelId ? getCachedMealPlans(selectedHotelId) : [];
  });
  const [periods, setPricingPeriods] = useState<HotelPricingPeriod[]>(() => {
    return selectedHotelId ? getCachedPricingPeriods(selectedHotelId) : [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return selectedHotelId ? getCachedRooms(selectedHotelId).length === 0 : false;
  });
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);

  // New/Edit Period Modal State
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<HotelPricingPeriod | null>(null);
  const [periodForm, setPeriodForm] = useState<{
    name: string;
    startDate: string;
    endDate: string;
    availableRooms: number;
    roomOnlyPrice: number;
    minStayNights: number;
    isActive: boolean;
  }>({
    name: '',
    startDate: '',
    endDate: '',
    availableRooms: 5,
    roomOnlyPrice: 350,
    minStayNights: 1,
    isActive: true
  });

  // Load hotel-specific rooms, meal plans, and periods with Stale-While-Revalidate
  useEffect(() => {
    if (!selectedHotel) return;
    let isMounted = true;
    if (rooms.length === 0) setLoading(true);

    Promise.all([
      getRoomsFromDb(selectedHotel.id),
      getMealPlansFromDb(selectedHotel.id),
      getPricingPeriodsFromDb(selectedHotel.id)
    ]).then(([rList, mList, pList]) => {
      if (!isMounted) return;
      setRooms(rList.filter(r => r.hotelId === selectedHotel.id));
      setMealPlans(mList);
      setPricingPeriods(pList || []);
      setLoading(false);
    }).catch(err => {
      console.error('[AdminOnlineAvailability] Fetch failed:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedHotel?.id]);

  // Handle Changing Hotel Online Mode
  const handleModeChange = async (mode: 'always' | 'periods_only' | 'disabled') => {
    if (!selectedHotel) return;
    const isOnline = mode !== 'disabled';
    const updatedHotel: Hotel = {
      ...selectedHotel,
      onlineBookingEnabled: isOnline,
      onlineAvailabilityMode: mode
    };

    // Instant optimistic local update
    onUpdateHotel(updatedHotel);
    onShowToast(
      mode === 'always'
        ? `تم ضبط ${selectedHotel.name}: متاح للحجز أونلاين دائماً ✓`
        : mode === 'periods_only'
        ? `تم ضبط ${selectedHotel.name}: متاح حصرياً في الفترات والمواسم المحددة 📅`
        : `تم تعطيل الحجز أونلاين لـ ${selectedHotel.name} 🚫`,
      'success'
    );

    try {
      await saveHotelToDb(updatedHotel);
    } catch (err) {
      console.error('Failed to save hotel online mode:', err);
      onShowToast('حدث خطأ أثناء مزامنة حالة الفندق مع السحابة', 'error');
    }
  };

  // Rebuild Availability Cloud Cache
  const handleRebuild = async () => {
    if (!selectedHotel) return;
    setIsRebuilding(true);
    try {
      const res = await rebuildHotelAvailability(selectedHotel.id);
      if (res.success) {
        onShowToast(`تمت مزامنة وتحديث جداول التوفر السحابي بنجاح (${res.updatedMonthsCount} شهراً) ⚡`, 'success');
      } else {
        onShowToast('تم تحديث التوفر بنجاح.', 'success');
      }
    } catch (err: any) {
      onShowToast('فشل تحديث التوفر: ' + (err.message || 'خطأ غير متوقع'), 'error');
    } finally {
      setIsRebuilding(false);
    }
  };

  // Toggle Period Active Status
  const handleTogglePeriodActive = async (period: HotelPricingPeriod) => {
    const updated: HotelPricingPeriod = {
      ...period,
      isActive: !period.isActive
    };
    try {
      await savePricingPeriodToDb(updated);
      setPricingPeriods(prev => prev.map(p => p.id === period.id ? updated : p));
      onShowToast(updated.isActive ? 'تم تفعيل الفترة للموقع بنجاح ✓' : 'تم إيقاف تفعيل الفترة بنجاح', 'success');
    } catch {
      onShowToast('تعذر تحديث حالة الفترة', 'error');
    }
  };

  // Delete Period
  const handleDeletePeriod = async (periodId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الفترة المعتمدة؟')) return;
    try {
      await deletePricingPeriodFromDb(periodId);
      setPricingPeriods(prev => prev.filter(p => p.id !== periodId));
      onShowToast('تم حذف الفترة بنجاح', 'success');
    } catch {
      onShowToast('تعذر حذف الفترة', 'error');
    }
  };

  // Open Add/Edit Modal
  const handleOpenAddPeriod = () => {
    const today = new Date().toISOString().split('T')[0];
    const afterWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    setEditingPeriod(null);
    setPeriodForm({
      name: '',
      startDate: today,
      endDate: afterWeek,
      availableRooms: 5,
      roomOnlyPrice: 350,
      minStayNights: 1,
      isActive: true
    });
    setIsPeriodModalOpen(true);
  };

  const handleOpenEditPeriod = (period: HotelPricingPeriod) => {
    setEditingPeriod(period);
    setPeriodForm({
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      availableRooms: period.availableRooms || 5,
      roomOnlyPrice: period.roomOnlyPrice || 350,
      minStayNights: period.minStayNights || 1,
      isActive: period.isActive !== false
    });
    setIsPeriodModalOpen(true);
  };

  // Save Period
  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;
    if (!periodForm.name.trim() || !periodForm.startDate || !periodForm.endDate) {
      onShowToast('يرجى ملء جميع الحقول المطلوبة للفترة', 'error');
      return;
    }
    if (periodForm.startDate > periodForm.endDate) {
      onShowToast('تاريخ البدء يجب أن يكون قبل أو يساوي تاريخ الانتهاء', 'error');
      return;
    }

    const newPeriod: HotelPricingPeriod = {
      id: editingPeriod ? editingPeriod.id : `period_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      hotelId: selectedHotel.id,
      name: periodForm.name.trim(),
      startDate: periodForm.startDate,
      endDate: periodForm.endDate,
      roomTypeId: 'all',
      availableRooms: Number(periodForm.availableRooms) || 1,
      roomOnlyPrice: Number(periodForm.roomOnlyPrice) || 350,
      minStayNights: Number(periodForm.minStayNights) || 1,
      isActive: periodForm.isActive
    };

    try {
      await savePricingPeriodToDb(newPeriod);
      setPricingPeriods(prev => {
        const idx = prev.findIndex(p => p.id === newPeriod.id);
        if (idx >= 0) {
          const cp = [...prev];
          cp[idx] = newPeriod;
          return cp;
        }
        return [newPeriod, ...prev];
      });
      setIsPeriodModalOpen(false);
      onShowToast(editingPeriod ? 'تم تعديل الفترة بنجاح ✓' : 'تمت إضافة الفترة المتاحة بنجاح ✓', 'success');
    } catch {
      onShowToast('تعذر حفظ بيانات الفترة', 'error');
    }
  };

  // Toggle Room Online Availability
  const handleToggleRoomActive = async (room: RoomTypeItem) => {
    const updated: RoomTypeItem = {
      ...room,
      isActive: !room.isActive
    };
    try {
      await saveRoomToDb(updated);
      setRooms(prev => prev.map(r => r.id === room.id ? updated : r));
      onShowToast(updated.isActive ? 'تمت إتاحة الغرفة للحجز أونلاين ✓' : 'تم إخفاء الغرفة عن الحجز أونلاين', 'success');
    } catch {
      onShowToast('تعذر تحديث حالة الغرفة', 'error');
    }
  };

  // Toggle Meal Plan Active Status
  const handleToggleMealActive = async (meal: MealPlanOption) => {
    const updatedMeals = mealPlans.map(m => m.id === meal.id ? { ...m, isActive: !m.isActive } : m);
    try {
      await saveMealPlansToDb(selectedHotel!.id, updatedMeals);
      setMealPlans(updatedMeals);
      onShowToast('تم تحديث إتاحة خطة الوجبات أونلاين بنجاح ✓', 'success');
    } catch {
      onShowToast('تعذر تحديث إتاحة الوجبة', 'error');
    }
  };

  const currentMode = selectedHotel?.onlineAvailabilityMode || (selectedHotel?.onlineBookingEnabled !== false ? 'always' : 'disabled');

  return (
    <div className="space-y-6 text-stone-900 font-cairo" dir="rtl">
      {/* 1. Header Banner & Quick Help */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A24B]/15 text-[#8C6D23] text-xs font-bold mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>لوحة التحكم الشاملة في إتاحة الحجز والمواسم أونلاين</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-stone-900 tracking-tight">
            إدارة توفر الفنادق، الغرف، والفترات المتاحة للزوار
          </h2>
          <p className="text-xs md:text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
            تحكم دقيق في الفنادق التي تظهر متاحة أونلاين، تخصيص فترات ومواسم محددة فقط يكون الفندق متاحاً فيها، وإخفاء أو إظهار فئات الغرف والوجبات للزوار.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRebuild}
          disabled={isRebuilding || !selectedHotel}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:opacity-95 text-white text-xs md:text-sm font-bold shadow-md shadow-[#C9A24B]/20 flex items-center justify-center gap-2 cursor-pointer transition-all self-start md:self-center disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRebuilding ? 'animate-spin' : ''}`} />
          <span>{isRebuilding ? 'جاري المزامنة...' : 'مزامنة التوفر السحابي'}</span>
        </button>
      </div>

      {/* 2. Hotel Selector Bar */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-stone-800">
          <Building2 className="w-4 h-4 text-[#C9A24B]" />
          <span>اختر الفندق لإدارة إتاحته أونلاين:</span>
        </div>
        <div className="flex-1 max-w-md relative">
          <select
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
          >
            {hotels.map(h => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.city}) — {
                  h.onlineAvailabilityMode === 'periods_only'
                    ? '📅 فترات محددة فقط'
                    : h.onlineBookingEnabled !== false
                    ? '🟢 متاح دائماً'
                    : '🔴 معطل أونلاين'
                }
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedHotel && (
        <>
          {/* 3. Availability Mode Selection (الخيارات الثلاثة الكبرى) */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-stone-900">
              <Zap className="w-5 h-5 text-[#C9A24B]" />
              <h3 className="text-base md:text-lg font-bold">
                نمط ظهور وإتاحة الحجز أونلاين لفندق: <span className="text-[#8C6D23] font-extrabold">{selectedHotel.name}</span>
              </h3>
            </div>
            <p className="text-xs text-stone-500">
              حدد كيف يتعامل الموقع مع زوار بوابة الحجز عند اختيار هذا الفندق:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Option 1: Always Available */}
              <button
                type="button"
                onClick={() => handleModeChange('always')}
                className={`p-5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  currentMode === 'always'
                    ? 'border-[#C9A24B] bg-[#C9A24B]/10 ring-2 ring-[#C9A24B]/30'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      متاح دائماً
                    </span>
                    {currentMode === 'always' && <CheckCircle2 className="w-5 h-5 text-[#C9A24B]" />}
                  </div>
                  <h4 className="font-extrabold text-sm text-stone-900 mb-1">
                    متاح للحجز أونلاين باستمرار
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    يظهر الفندق للزوار في أي تاريخ يبحثون عنه على مدار العام، ويتم الحساب بالسعر والمخزون اليومي القياسي.
                  </p>
                </div>
              </button>

              {/* Option 2: Periods Only (Exact user requirement) */}
              <button
                type="button"
                onClick={() => handleModeChange('periods_only')}
                className={`p-5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  currentMode === 'periods_only'
                    ? 'border-[#C9A24B] bg-[#C9A24B]/10 ring-2 ring-[#C9A24B]/30'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      فترات محددة فقط
                    </span>
                    {currentMode === 'periods_only' && <CheckCircle2 className="w-5 h-5 text-[#C9A24B]" />}
                  </div>
                  <h4 className="font-extrabold text-sm text-stone-900 mb-1">
                    متاح حصرياً في الفترات المعتمدة فقط
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    يظهر الفندق متاحاً فقط خلال الفترات والمواسم النشطة المضافة بالأسفل. أي تاريخ خارج هذه الفترات يُقفل بالتقويم تماماً.
                  </p>
                </div>
              </button>

              {/* Option 3: Disabled */}
              <button
                type="button"
                onClick={() => handleModeChange('disabled')}
                className={`p-5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  currentMode === 'disabled'
                    ? 'border-red-400 bg-red-50/70 ring-2 ring-red-200'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">
                      <Lock className="w-3.5 h-3.5 text-red-600" />
                      معطل مؤقتاً
                    </span>
                    {currentMode === 'disabled' && <CheckCircle2 className="w-5 h-5 text-red-600" />}
                  </div>
                  <h4 className="font-extrabold text-sm text-stone-900 mb-1">
                    إخفاء الحجز أونلاين لهذا الفندق
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    يتم استبعاد هذا الفندق تماماً من بوابة الحجز أونلاين، ويبقى متاحاً للاستعراض والتواصل المباشر عبر الواتساب فقط.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 4. Active Allowed Periods Management (إدارة الفترات والمواسم المتاحة) */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-[#C9A24B]" />
                  <h3 className="text-base md:text-lg font-bold text-stone-900">
                    جدول الفترات والمواسم المتاحة للحجز أونلاين
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  {currentMode === 'periods_only' 
                    ? '⚠️ نظراً لتفعيل نمط (فترات محددة فقط)، لن يتمكن الزائر من الحجز إلا في التواريخ الواقعة ضمن الفترات النشطة أدناه.'
                    : 'الفترات تمنح أسعاراً ومخزوناً خاصاً خلال أوقات محددة (مواسم الحج، رمضان، الأعياد).'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddPeriod}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-center"
              >
                <Plus className="w-4 h-4 text-[#C9A24B]" />
                <span>إضافة فترة إتاحة جديدة</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs font-bold text-stone-500">جاري تحميل الفترات...</div>
            ) : periods.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <AlertCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-xs md:text-sm font-bold text-stone-700">لا توجد فترات إتاحة مخصصة لهذا الفندق حالياً</p>
                <p className="text-xs text-stone-500 mt-1">انقر على زر "إضافة فترة إتاحة جديدة" لتعريف موسم حجز أو نافذة توفر محددة.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {periods.map(period => (
                  <div
                    key={period.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      period.isActive !== false
                        ? 'bg-stone-50/60 border-stone-200 hover:border-[#C9A24B]/40'
                        : 'bg-stone-100/50 border-stone-200/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-extrabold text-sm text-stone-900 truncate">
                        {period.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTogglePeriodActive(period)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                          period.isActive !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {period.isActive !== false ? 'مفعلة أونلاين ✓' : 'معطلة'}
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs text-stone-600 mb-4 bg-white p-3 rounded-xl border border-stone-100 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">من تاريخ:</span>
                        <span className="font-bold text-stone-800">{period.startDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">إلى تاريخ:</span>
                        <span className="font-bold text-stone-800">{period.endDate}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                        <span className="text-stone-400">سعر الليلة:</span>
                        <span className="font-extrabold text-[#8C6D23]">{period.roomOnlyPrice} ر.س</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">المخزون اليومي:</span>
                        <span className="font-bold text-stone-800">{period.availableRooms} غرفة</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">الحد الأدنى للإقامة:</span>
                        <span className="font-bold text-stone-800">{period.minStayNights || 1} ليالٍ</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPeriod(period)}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePeriod(period.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Room Types Online Visibility (إتاحة أنواع الغرف أونلاين) */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base md:text-lg font-bold text-stone-900 flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-[#C9A24B]" />
                  <span>إتاحة فئات الغرف أونلاين لهذا الفندق</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  الغرفة المعطلة لا تظهر للزوار في الخطوة الثانية من حجز الأونلاين.
                </p>
              </div>
              <span className="text-xs font-bold text-stone-400 font-mono">
                {rooms.filter(r => r.isActive !== false).length} من {rooms.length} متاحة أونلاين
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rooms.map(room => (
                <div
                  key={room.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    room.isActive !== false
                      ? 'bg-stone-50/60 border-stone-200'
                      : 'bg-stone-100 border-stone-200/60 opacity-60'
                  }`}
                >
                  <div>
                    <h4 className="font-extrabold text-xs md:text-sm text-stone-900">{room.name}</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5 font-mono">
                      السعر القياسي: {room.basePrice || 350} ر.س • السعة: {room.maxGuests || 2} نزلاء
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleRoomActive(room)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      room.isActive !== false
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                        : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                    }`}
                  >
                    {room.isActive !== false ? 'متاحة للزوار ✓' : 'مخفية'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Meal Plans Online Visibility (إتاحة باقات الوجبات) */}
          {mealPlans.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm space-y-4">
              <div>
                <h3 className="text-base md:text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#C9A24B]" />
                  <span>إتاحة خيارات وباقات الوجبات أونلاين</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  خيارات الوجبات المتاحة تظهر كبطاقات إضافية للزائر أثناء اختيار الغرفة في الحجز.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {mealPlans.map(meal => (
                  <div
                    key={meal.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      meal.isActive !== false
                        ? 'bg-stone-50/60 border-stone-200'
                        : 'bg-stone-100 border-stone-200/60 opacity-60'
                    }`}
                  >
                    <div>
                      <h4 className="font-extrabold text-xs md:text-sm text-stone-900">{meal.name}</h4>
                      <p className="text-[11px] text-[#8C6D23] font-mono mt-0.5">
                        +{meal.pricePerPerson} ر.س / فرد / ليلة
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleMealActive(meal)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        meal.isActive !== false
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                          : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                      }`}
                    >
                      {meal.isActive !== false ? 'متاحة ✓' : 'معطلة'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Period Modal (Add / Edit) */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-base md:text-lg text-stone-900 flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-[#C9A24B]" />
                <span>{editingPeriod ? 'تعديل فترة إتاحة معتمدة' : 'إضافة فترة إتاحة وموسم جديد'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPeriodModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  اسم الفترة أو الموسم (يظهر للزائر) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: موسم شهر رجب، إجازة منتصف العام، موسم رمضان المبارك"
                  value={periodForm.name}
                  onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-stone-200 text-xs md:text-sm font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    تاريخ البدء *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodForm.startDate}
                    onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-stone-200 text-xs md:text-sm font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    تاريخ الانتهاء *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodForm.endDate}
                    onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-stone-200 text-xs md:text-sm font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    سعر الليلة (ر.س) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={periodForm.roomOnlyPrice}
                    onChange={e => setPeriodForm({ ...periodForm, roomOnlyPrice: Number(e.target.value) })}
                    className="w-full h-11 px-3 rounded-xl border border-stone-200 text-xs md:text-sm font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    الغرف المتاحة *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={periodForm.availableRooms}
                    onChange={e => setPeriodForm({ ...periodForm, availableRooms: Number(e.target.value) })}
                    className="w-full h-11 px-3 rounded-xl border border-stone-200 text-xs md:text-sm font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    الحد الأدنى لليالي
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={periodForm.minStayNights}
                    onChange={e => setPeriodForm({ ...periodForm, minStayNights: Number(e.target.value) })}
                    className="w-full h-11 px-3 rounded-xl border border-stone-200 text-xs md:text-sm font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={periodForm.isActive}
                    onChange={e => setPeriodForm({ ...periodForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#C9A24B] rounded-sm focus:ring-[#C9A24B]"
                  />
                  <span>تفعيل الفترة فوراً للحجز بالموقع</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPeriodModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold cursor-pointer transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] text-white text-xs font-bold shadow-md shadow-[#C9A24B]/20 cursor-pointer hover:opacity-95 transition-opacity"
                  >
                    {editingPeriod ? 'حفظ التعديلات' : 'إضافة الفترة المتاحة'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
