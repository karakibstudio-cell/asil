import React, { useState, useEffect, useMemo } from 'react';
import { Hotel, RoomTypeItem, MealPlanOption, RoomBooking, SiteSettings } from '../types';
import { 
  createBookingAtomic, 
  getRoomsFromDb, 
  getMealPlansFromDb,
  getPricingPeriodsFromDb,
  checkNightlyAvailability,
  generateBookingCode,
  generateDigitalKey
} from '../services/bookingService';
import { 
  X, 
  Plus, 
  Calendar, 
  User, 
  Phone, 
  Building2, 
  BedDouble, 
  Utensils, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { WhatsAppIcon } from './BookingIcons';

interface AdminQuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotels: Hotel[];
  siteSettings?: SiteSettings;
  onBookingCreated?: (booking: RoomBooking) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminQuickBookingModal: React.FC<AdminQuickBookingModalProps> = ({
  isOpen,
  onClose,
  hotels,
  siteSettings,
  onBookingCreated,
  onShowToast
}) => {
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [rooms, setRooms] = useState<RoomTypeItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedMealId, setSelectedMealId] = useState<string>('');

  // Default dates: today and tomorrow
  const [checkIn, setCheckIn] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [roomsCount, setRoomsCount] = useState(1);
  const [adultsCount, setAdultsCount] = useState(2);
  const [customPriceOverride, setCustomPriceOverride] = useState<number | ''>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selected hotel
  useEffect(() => {
    if (isOpen && hotels.length > 0 && !selectedHotelId) {
      setSelectedHotelId(hotels[0].id);
    }
  }, [isOpen, hotels, selectedHotelId]);

  // Load rooms and meal plans for selected hotel
  useEffect(() => {
    if (!selectedHotelId) return;

    let isMounted = true;
    Promise.all([
      getRoomsFromDb(selectedHotelId),
      getMealPlansFromDb(selectedHotelId)
    ]).then(([fetchedRooms, fetchedMeals]) => {
      if (!isMounted) return;
      setRooms(fetchedRooms);
      setMealPlans(fetchedMeals);
      if (fetchedRooms.length > 0) {
        setSelectedRoomId(fetchedRooms[0].id);
      }
      if (fetchedMeals.length > 0) {
        setSelectedMealId(fetchedMeals[0].id);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedHotelId]);

  const selectedHotel = useMemo(() => {
    return hotels.find(h => h.id === selectedHotelId) || hotels[0];
  }, [hotels, selectedHotelId]);

  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  const selectedMeal = useMemo(() => {
    return mealPlans.find(m => m.id === selectedMealId);
  }, [mealPlans, selectedMealId]);

  // Calculate nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const s = new Date(checkIn).getTime();
    const e = new Date(checkOut).getTime();
    const d = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    return d > 0 ? d : 1;
  }, [checkIn, checkOut]);

  // Estimated Price
  const estimatedTotal = useMemo(() => {
    if (typeof customPriceOverride === 'number' && customPriceOverride >= 0) {
      return customPriceOverride;
    }
    const roomPrice = selectedRoom?.basePrice || 350;
    const mealPrice = selectedMeal?.pricePerPerson || 0;
    return (roomPrice * roomsCount * nights) + (mealPrice * adultsCount * nights);
  }, [customPriceOverride, selectedRoom, selectedMeal, roomsCount, nights, adultsCount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHotel || !selectedRoom) {
      onShowToast('يرجى اختيار الفندق والغرفة', 'error');
      return;
    }

    if (!guestName.trim()) {
      onShowToast('يرجى إدخال اسم النزيل', 'error');
      return;
    }

    if (!guestPhone.trim() || guestPhone.length < 8) {
      onShowToast('يرجى إدخال رقم هاتف/واتساب صحيح للنزيل', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const emailToUse = guestEmail.trim() || `guest_${Date.now()}@prestige-booking.sa`;
      
      const created = await createBookingAtomic({
        hotel: selectedHotel,
        room: selectedRoom,
        mealPlan: selectedMeal,
        checkIn,
        checkOut,
        roomsCount,
        adultsCount,
        childrenCount: 0,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: emailToUse,
        specialRequests: adminNotes ? `[إدخال مباشر من الإدارة]: ${adminNotes}` : '[حجز سريع من لوحة التحكم]',
        consentAgreed: true
      });

      onShowToast(`تم إنشاء وتأكيد الحجز بنجاح برقم #${created.bookingCode}`, 'success');
      
      if (onBookingCreated) {
        onBookingCreated(created);
      }

      onClose();
    } catch (err: any) {
      console.error('Quick booking creation error:', err);
      onShowToast(`تعذر إنشاء الحجز: ${err.message || 'خطأ غير متوقع'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/20 border border-[#C9A24B]/50 flex items-center justify-center text-[#DFBE72]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cairo font-bold text-base text-white">إضافة حجز سريع فوري</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  تسكين مباشر 10 ثوانٍ
                </span>
              </div>
              <p className="text-[11px] text-stone-300 mt-0.5">
                إدخال الحجز فورياً وخصم الغرفة من المخزون لمنع تكرار البيع
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Hotel & Room Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5 text-[#B38A34]" />
                <span>الفندق:</span>
              </label>
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
              >
                {hotels.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-1">
                <BedDouble className="w-3.5 h-3.5 text-[#B38A34]" />
                <span>فئة الغرفة:</span>
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
              >
                {rooms.length > 0 ? (
                  rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} - ({r.basePrice} ر.س / ليلة)
                    </option>
                  ))
                ) : (
                  <option value="">غرفة قياسية</option>
                )}
              </select>
            </div>
          </div>

          {/* Row 2: Check-in / Check-out */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-amber-50/50 border border-[#C9A24B]/30">
            <div>
              <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#B38A34]" />
                <span>تاريخ الوصول:</span>
              </label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#B38A34]" />
                <span>تاريخ المغادرة ({nights} ليالٍ):</span>
              </label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
              />
            </div>
          </div>

          {/* Row 3: Guest Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-[#B38A34]" />
                <span>اسم النزيل / العميل:</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: أحمد محمد القحطاني"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-[#B38A34]" />
                <span>رقم الواتساب / الجوال:</span>
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                placeholder="+966 50 123 4567"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white text-right"
              />
            </div>
          </div>

          {/* Row 4: Rooms count, Adults, and Total */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">عدد الغرف:</label>
              <select
                value={roomsCount}
                onChange={(e) => setRoomsCount(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'غرفة' : 'غرف'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">عدد النزلاء:</label>
              <select
                value={adultsCount}
                onChange={(e) => setAdultsCount(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map(n => (
                  <option key={n} value={n}>{n} نزلاء</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">المبلغ الإجمالي (ر.س):</label>
              <input
                type="number"
                placeholder={`تلقائي: ${estimatedTotal}`}
                value={customPriceOverride}
                onChange={(e) => setCustomPriceOverride(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900"
              />
            </div>
          </div>

          {/* Row 5: Notes */}
          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">ملاحظات إضافية:</label>
            <input
              type="text"
              placeholder="مثال: دفع عربون 500 ر.س بالتحويل، وصول متأخر الساعة 8 مساءً..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-stone-500">الإجمالي المحسوب: </span>
              <strong className="text-sm font-black text-stone-900">{estimatedTotal.toLocaleString()} ر.س</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري الحفظ والخصم...' : 'حفظ وتأكيد الحجز فوراً ✓'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
