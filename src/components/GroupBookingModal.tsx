import React, { useState, useEffect, useMemo } from 'react';
import { Hotel, RoomTypeItem, MealPlanOption, RoomBooking, SiteSettings } from '../types';
import { 
  getRoomsFromDb, 
  getMealPlansFromDb,
  getPricingPeriodsFromDb,
  checkNightlyAvailability,
  generateBookingCode,
  saveBookingToDb
} from '../services/bookingService';
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  BedDouble, 
  Utensils, 
  Bus, 
  FileText, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  DollarSign,
  Users,
  Layers,
  Send
} from 'lucide-react';
import { WhatsAppIcon } from './BookingIcons';

export interface GroupBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotels: Hotel[];
  siteSettings?: SiteSettings;
  isAdminMode?: boolean;
  initialHotelId?: string;
  onBookingCreated?: (booking: RoomBooking) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface RoomAllocationItem {
  id: string;
  roomId: string;
  roomsCount: number;
  adultsPerRoom: number;
}

export const GroupBookingModal: React.FC<GroupBookingModalProps> = ({
  isOpen,
  onClose,
  hotels,
  siteSettings,
  isAdminMode = false,
  initialHotelId,
  onBookingCreated,
  onShowToast
}) => {
  const [selectedHotelId, setSelectedHotelId] = useState<string>(initialHotelId || hotels[0]?.id || '');
  const [rooms, setRooms] = useState<RoomTypeItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanOption[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string>('meal_none');

  // Dates
  const [checkIn, setCheckIn] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });

  // Group Details
  const [companyOrGroupName, setCompanyOrGroupName] = useState<string>('');
  const [leaderName, setLeaderName] = useState<string>('');
  const [leaderPhone, setLeaderPhone] = useState<string>('');
  const [leaderEmail, setLeaderEmail] = useState<string>('');
  const [busCount, setBusCount] = useState<number>(1);
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Rooming List
  const [roomingListText, setRoomingListText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'details' | 'rooming_list'>('details');

  // Multi-room Allocations
  const [allocations, setAllocations] = useState<RoomAllocationItem[]>([
    { id: 'alloc_1', roomId: '', roomsCount: 3, adultsPerRoom: 2 },
    { id: 'alloc_2', roomId: '', roomsCount: 2, adultsPerRoom: 3 }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Hotel Object
  const selectedHotel = useMemo(() => {
    return hotels.find(h => h.id === selectedHotelId) || hotels[0] || null;
  }, [hotels, selectedHotelId]);

  // Load Hotel Rooms & Meal Plans
  useEffect(() => {
    if (!selectedHotel) return;
    let isMounted = true;

    Promise.all([
      getRoomsFromDb(selectedHotel.id),
      getMealPlansFromDb(selectedHotel.id)
    ]).then(([rList, mList]) => {
      if (!isMounted) return;
      const activeRooms = rList.filter(r => r.isActive !== false);
      setRooms(activeRooms);
      setMealPlans(mList.filter(m => m.isActive !== false));

      // Auto-assign first rooms to allocations if empty
      if (activeRooms.length > 0) {
        setAllocations(prev => prev.map((a, idx) => ({
          ...a,
          roomId: a.roomId || (activeRooms[idx % activeRooms.length]?.id || activeRooms[0].id)
        })));
      }
    }).catch(err => {
      console.error('Error loading group booking rooms:', err);
    });

    return () => { isMounted = false; };
  }, [selectedHotelId, selectedHotel]);

  // Total Nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 3600 * 24);
    return Math.max(1, Math.round(diff));
  }, [checkIn, checkOut]);

  // Summary Counts
  const totalRooms = useMemo(() => {
    return allocations.reduce((sum, a) => sum + (Number(a.roomsCount) || 0), 0);
  }, [allocations]);

  const totalGuests = useMemo(() => {
    return allocations.reduce((sum, a) => sum + ((Number(a.roomsCount) || 0) * (Number(a.adultsPerRoom) || 1)), 0);
  }, [allocations]);

  const selectedMeal = useMemo(() => {
    return mealPlans.find(m => m.id === selectedMealId) || null;
  }, [mealPlans, selectedMealId]);

  // Estimated Pricing
  const pricingBreakdown = useMemo(() => {
    let roomsTotal = 0;
    const breakdown = allocations.map(a => {
      const roomObj = rooms.find(r => r.id === a.roomId);
      const nightlyPrice = roomObj?.basePrice || 350;
      const subtotal = nightlyPrice * (Number(a.roomsCount) || 0) * nights;
      roomsTotal += subtotal;
      return {
        roomId: a.roomId,
        roomName: roomObj?.name || 'غرفة فندقية',
        roomsCount: a.roomsCount,
        adultsPerRoom: a.adultsPerRoom,
        pricePerNight: nightlyPrice,
        totalAmount: subtotal
      };
    });

    const mealRate = selectedMeal ? (selectedMeal.price ?? selectedMeal.pricePerPersonPerNight ?? 0) : 0;
    const mealsTotal = mealRate * totalGuests * nights;
    const grandTotal = roomsTotal + mealsTotal;

    return {
      breakdown,
      roomsTotal,
      mealsTotal,
      grandTotal
    };
  }, [allocations, rooms, nights, selectedMeal, totalGuests]);

  // Add allocation row
  const handleAddAllocation = () => {
    const nextRoom = rooms[allocations.length % rooms.length] || rooms[0];
    setAllocations(prev => [
      ...prev,
      {
        id: `alloc_${Date.now()}`,
        roomId: nextRoom ? nextRoom.id : '',
        roomsCount: 2,
        adultsPerRoom: 2
      }
    ]);
  };

  // Remove allocation row
  const handleRemoveAllocation = (id: string) => {
    if (allocations.length <= 1) {
      onShowToast('يجب إبقاء فئة غرفة واحدة على الأقل في حجز المجموعة', 'info');
      return;
    }
    setAllocations(prev => prev.filter(a => a.id !== id));
  };

  // Download Rooming List Template
  const handleDownloadTemplate = () => {
    const header = 'رقم الغرفة,فئة الغرفة,اسم النزيل الأول,رقم الهوية / الجواز,اسم النزيل الثاني,اسم النزيل الثالث,ملاحظات\n';
    const sampleRows = [
      '1,غرفة ثنائية,محمد أحمد,A1234567,عبدالله أحمد,,سرير مزدوج',
      '2,غرفة ثنائية,سالم حسن,B9876543,إبراهيم حسن,,قريب من المصعد',
      '3,غرفة ثلاثية,خالد العلي,C5544332,يوسف العلي,طارق العلي,طابق علوي'
    ].join('\n');
    const blob = new Blob(['\uFEFF' + header + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Prestige_Rooming_List_Template.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('تم تحميل نموذج كشف النزلاء (Rooming List) بنجاح', 'success');
  };

  // File Upload for Rooming List
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRoomingListText(content);
        setActiveTab('rooming_list');
        onShowToast(`تم استيراد ملف النزلاء (${file.name}) بنجاح!`, 'success');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent, method: 'direct' | 'whatsapp') => {
    e.preventDefault();

    if (!selectedHotel) {
      onShowToast('يرجى اختيار الفندق', 'error');
      return;
    }

    if (!companyOrGroupName.trim()) {
      onShowToast('يرجى إدخال اسم الحملة / الشركة أو العائلة', 'error');
      return;
    }

    if (!leaderName.trim()) {
      onShowToast('يرجى إدخال اسم قائد الحملة / مسؤول الحجز', 'error');
      return;
    }

    if (!leaderPhone.trim() || leaderPhone.length < 8) {
      onShowToast('يرجى إدخال رقم واتساب صحيح لمسؤول المجموعة', 'error');
      return;
    }

    if (totalRooms < 1) {
      onShowToast('يرجى تحديد عدد الغرف المطلوبة للمجموعة', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingCode = `GRP-${Math.floor(100000 + Math.random() * 900000)}`;
      const bookingId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const emailToUse = leaderEmail.trim() || `group_${Date.now()}@prestige-hospitality.sa`;
      const primaryRoom = rooms.find(r => r.id === allocations[0]?.roomId) || rooms[0];

      const newGroupBooking: RoomBooking = {
        id: bookingId,
        bookingCode,
        invoiceNumber: `INV-${bookingCode}`,
        digitalKey: `GRP-KEY-${Math.floor(1000 + Math.random() * 9000)}`,
        hotelId: selectedHotel.id,
        hotelName: selectedHotel.name,
        hotelCity: selectedHotel.city,
        roomId: primaryRoom ? primaryRoom.id : 'grp_multi_rooms',
        roomName: `حجز مجموعة (${totalRooms} غرف - ${companyOrGroupName.trim()})`,
        guestName: `${leaderName.trim()} (${companyOrGroupName.trim()})`,
        guestPhone: leaderPhone.trim(),
        guestEmail: emailToUse,
        checkIn,
        checkOut,
        nights,
        roomsCount: totalRooms,
        adults: totalGuests,
        children: 0,
        mealPlanId: selectedMeal?.id || 'meal_none',
        mealPlanName: selectedMeal?.name || 'بدون وجبات',
        mealPlanPrice: selectedMeal ? (selectedMeal.price ?? 0) : 0,
        roomPricePerNight: Math.round(pricingBreakdown.roomsTotal / (totalRooms * nights)),
        totalAmount: pricingBreakdown.grandTotal,
        specialRequests: `[حجز مجموعة / باصات - ${companyOrGroupName}]: ${specialNotes ? specialNotes + '\n' : ''}عدد الباصات: ${busCount}`,
        status: isAdminMode ? 'confirmed' : 'pending_confirmation',
        createdAt: Date.now(),
        consentAgreed: true,
        // Group Specific metadata
        isGroupBooking: true,
        companyOrGroupName: companyOrGroupName.trim(),
        groupLeaderName: leaderName.trim(),
        groupLeaderPhone: leaderPhone.trim(),
        busCount,
        roomingList: roomingListText.trim() || undefined,
        groupRoomsBreakdown: pricingBreakdown.breakdown
      };

      // Save directly to DB
      await saveBookingToDb(newGroupBooking);

      if (onBookingCreated) {
        onBookingCreated(newGroupBooking);
      }

      onShowToast(`تم تسجيل حجز المجموعة بنجاح برقم #${bookingCode}`, 'success');

      // WhatsApp Quote Redirect if method === 'whatsapp' or requested
      if (method === 'whatsapp') {
        const roomsText = pricingBreakdown.breakdown
          .map(b => `• ${b.roomsCount}x ${b.roomName} (${b.adultsPerRoom} نزلاء/غرفة)`)
          .join('\n');

        const waMsg = [
          `🚌 *طلب حجز مجموعة وحملة عمرة / شركات*`,
          `✨ *فندق:* ${selectedHotel.name} (${selectedHotel.city})`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `🏢 *اسم الحملة / الشركة:* ${companyOrGroupName}`,
          `👤 *المسؤول:* ${leaderName}`,
          `📱 *الهاتف:* ${leaderPhone}`,
          `🚌 *عدد الباصات / الحافلات:* ${busCount}`,
          ``,
          `📅 *تواريخ الإقامة:* من ${checkIn} إلى ${checkOut} (${nights} ليالٍ)`,
          `🛏️ *إجمالي الغرف:* ${totalRooms} غرف | 👥 *إجمالي النزلاء:* ${totalGuests} شخص`,
          `🍽️ *الوجبات:* ${selectedMeal?.name || 'بدون وجبات'}`,
          ``,
          `📋 *توزيع الغرف:*`,
          roomsText,
          ``,
          `💰 *الإجمالي التقديري:* ${pricingBreakdown.grandTotal.toLocaleString()} ر.س`,
          roomingListText ? `📄 *تم إرفاق قائمة النزلاء (Rooming List)*` : null,
          specialNotes ? `📝 *ملاحظات خاصة:* ${specialNotes}` : null,
          `━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `📍 نرجو تزويدنا بأفضل عرض سعر رسمي وتأكيد الإتاحة.`
        ].filter(Boolean).join('\n');

        const targetPhone = (siteSettings?.bookingModule?.bookingWhatsApp || '+966560580250').replace(/[^0-9]/g, '');
        const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(waMsg)}`;
        window.open(waUrl, '_blank');
      }

      onClose();
    } catch (err: any) {
      console.error('Group booking submit error:', err);
      onShowToast(`فشل تسجيل حجز المجموعة: ${err.message || 'خطأ غير متوقع'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-4 sm:p-6 flex items-center justify-between border-b border-stone-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#C9A24B]/20 border border-[#C9A24B]/40 flex items-center justify-center text-[#E0C070] shadow-sm">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-cairo font-black text-base sm:text-lg text-white">
                  حجز المجموعات وحملات العمرة والشركات 🚌
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#C9A24B]/25 text-[#E0C070] text-[10px] font-bold border border-[#C9A24B]/40">
                  فاتورة موحدة و Rooming List
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                تسكين الحملات والعائلات الكبيرة (3 إلى 50+ غرفة معاً) تحت حساب موحد
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="bg-stone-100 p-2 px-4 sm:px-6 flex items-center justify-between border-b border-stone-200 shrink-0">
          <div className="inline-flex rounded-xl bg-white p-1 border border-stone-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📋 تفاصيل المجموعة والغرف
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rooming_list')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rooming_list'
                  ? 'bg-[#C9A24B] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>كشف النزلاء وتوزيع الغرف (Rooming List)</span>
              {roomingListText.trim() && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          </div>

          {/* Quick Counter */}
          <div className="hidden sm:flex items-center gap-3 text-xs font-bold text-stone-700 font-cairo">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
              {totalRooms} غرف مطلوبة
            </span>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
              {totalGuests} نزيل
            </span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Section 1: Company & Leader Info */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <span className="text-xs font-extrabold text-stone-900 font-cairo flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#B38A34]" />
                  <span>1. بيانات الشركة / الحملة والمسؤول:</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      اسم الحملة / الشركة / العائلة: *
                    </label>
                    <input
                      type="text"
                      value={companyOrGroupName}
                      onChange={(e) => setCompanyOrGroupName(e.target.value)}
                      placeholder="مثال: حملة الوفاق للعمرة أو شركة النخبة"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      اسم قائد المجموعة / المسؤول: *
                    </label>
                    <input
                      type="text"
                      value={leaderName}
                      onChange={(e) => setLeaderName(e.target.value)}
                      placeholder="مثال: أ. عبد الرحمن السعدي"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      رقم الواتساب للتنسيق: *
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={leaderPhone}
                      onChange={(e) => setLeaderPhone(e.target.value)}
                      placeholder="+966 50 123 4567"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] text-right"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      البريد الإلكتروني للفاتورة:
                    </label>
                    <input
                      type="email"
                      dir="ltr"
                      value={leaderEmail}
                      onChange={(e) => setLeaderEmail(e.target.value)}
                      placeholder="group@company.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] text-right"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      عدد الحافلات / الباصات المتوقعة:
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={busCount}
                      onChange={(e) => setBusCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      خطة الوجبات للمجموعة:
                    </label>
                    <select
                      value={selectedMealId}
                      onChange={(e) => setSelectedMealId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                    >
                      {mealPlans.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.price ? `(+${m.price} ر.س/شخص)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Hotel & Dates */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <span className="text-xs font-extrabold text-stone-900 font-cairo flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#B38A34]" />
                  <span>2. الفندق وفترة الإقامة:</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      اختيار الفندق: *
                    </label>
                    <select
                      value={selectedHotelId}
                      onChange={(e) => setSelectedHotelId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                    >
                      {hotels.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      تاريخ الوصول (Check-in): *
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      تاريخ المغادرة (Check-out): *
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Multi-Category Room Allocations */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-stone-900 font-cairo flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-[#B38A34]" />
                    <span>3. توزيع وتحديد الغرف المطلوبة (Multi-Room Allocation):</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleAddAllocation}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-[#C9A24B] text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ إضافة فئة غرفة أخرى</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {allocations.map((alloc, index) => {
                    const roomObj = rooms.find(r => r.id === alloc.roomId);
                    return (
                      <div
                        key={alloc.id}
                        className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                      >
                        <div className="sm:col-span-5">
                          <label className="text-[11px] font-bold text-stone-500 block mb-1">
                            فئة الغرفة #{index + 1}:
                          </label>
                          <select
                            value={alloc.roomId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAllocations(prev => prev.map(a => a.id === alloc.id ? { ...a, roomId: val } : a));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                          >
                            {rooms.map(r => (
                              <option key={r.id} value={r.id}>
                                {r.name} - ({r.basePrice} ر.س / ليلة)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[11px] font-bold text-stone-500 block mb-1">
                            عدد الغرف من هذه الفئة:
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={alloc.roomsCount}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setAllocations(prev => prev.map(a => a.id === alloc.id ? { ...a, roomsCount: val } : a));
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 text-center"
                            />
                            <span className="text-[11px] text-stone-500 font-bold shrink-0">غرفة</span>
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[11px] font-bold text-stone-500 block mb-1">
                            نزلاء كل غرفة:
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={8}
                              value={alloc.adultsPerRoom}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setAllocations(prev => prev.map(a => a.id === alloc.id ? { ...a, adultsPerRoom: val } : a));
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 text-center"
                            />
                            <span className="text-[11px] text-stone-500 font-bold shrink-0">أفراد</span>
                          </div>
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveAllocation(alloc.id)}
                            className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="حذف هذه الفئة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  ملاحظات أو طلبات خاصة من إدارة الحملة (مثل: أدوار متقاربة، أسرة منفصلة، موعد الوصول):
                </label>
                <textarea
                  rows={2}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="اكتب هنا أي اشتراطات أو مواعيد محددة للحملة..."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
            </div>
          ) : (
            /* Rooming List Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-amber-800 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 font-cairo">
                      إرفاق كشف أسماء وتوزيع النزلاء (Rooming List)
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      يمكنك لصق الأسماء مباشرة أو رفع ملف Excel / CSV لتسريع تسكين المجموعات عند الوصول
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل نموذج Excel فارغ</span>
                  </button>

                  <label className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-[#C9A24B] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>استيراد ملف CSV / نص</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  نص كشف النزلاء وتوزيع الغرف:
                </label>
                <textarea
                  rows={10}
                  value={roomingListText}
                  onChange={(e) => setRoomingListText(e.target.value)}
                  placeholder={`الغرفة 1 (ثنائية): 1. محمد أحمد سالم - 2. أحمد محمد سالم\nالغرفة 2 (ثنائية): 1. خالد عبدالله العلي - 2. يوسف عبدالله العلي\nالغرفة 3 (ثلاثية): 1. إبراهيم خليل - 2. سليمان خليل - 3. عمر خليل\n...`}
                  className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-900 focus:outline-none focus:border-[#C9A24B] leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Pricing & Summary Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 text-white shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div>
                <span className="text-[11px] text-[#E0C070] font-bold block">
                  ملخص حجز المجموعة ({selectedHotel.name})
                </span>
                <span className="text-sm font-extrabold text-white font-cairo">
                  {totalRooms} غرف • {totalGuests} نزيل • {nights} {nights === 1 ? 'ليلة' : 'ليالٍ'}
                </span>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-stone-400 block">الإجمالي الموحد الشامل:</span>
                <span className="text-2xl font-black text-[#E0C070] font-cairo font-mono">
                  {pricingBreakdown.grandTotal.toLocaleString()} ر.س
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {pricingBreakdown.breakdown.map((b, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                  <span className="text-[10px] text-stone-400 block">{b.roomName}</span>
                  <span className="font-bold text-white block mt-0.5">
                    {b.roomsCount} غرف × {b.pricePerNight} ر.س
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
          >
            إلغاء / إغلاق
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* WhatsApp Quote & Direct Sales Chat */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, 'whatsapp')}
              className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-900/15 transition-all cursor-pointer disabled:opacity-50"
              title="إرسال طلب الحجز والتفاصيل لمسؤول المبيعات عبر الواتساب فوراً"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              <span>طلب تسعير واعتماد عبر واتساب</span>
            </button>

            {/* Direct Confirmation & Invoice */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, 'direct')}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38A34] hover:from-[#DFBE72] hover:to-[#C9A24B] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#C9A24B]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : (isAdminMode ? 'حفظ وتثبيت حجز المجموعة ✓' : 'تأكيد الحجز واستلام الفاتورة ✓')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
