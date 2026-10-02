import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Users, 
  BedDouble, 
  Check, 
  Key, 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Phone, 
  Mail, 
  User, 
  Utensils, 
  Coffee, 
  Clock, 
  Building2, 
  Copy, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { Hotel, RoomTypeItem, MealPlanOption, RoomBooking, SiteSettings } from '../types';
import { 
  getRoomsFromDb, 
  getMealPlansFromDb, 
  saveBookingToDb, 
  generateBookingCode, 
  generateDigitalKey,
  buildGuestWhatsAppShareLink,
  getHotelPolicy 
} from '../services/bookingService';
import { useLanguage } from '../context/LanguageContext';

interface RoomBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: Hotel;
  siteSettings?: SiteSettings;
  preSelectedRoomId?: string;
  preSelectedMealId?: string;
  onSuccessToast?: (msg: string) => void;
  onOpenTrackModal?: (bookingCode: string) => void;
}

export const RoomBookingModal: React.FC<RoomBookingModalProps> = ({
  isOpen,
  onClose,
  hotel,
  siteSettings,
  preSelectedRoomId,
  preSelectedMealId,
  onSuccessToast,
  onOpenTrackModal
}) => {
  const { language, isRtl } = useLanguage();

  // Wizard Steps: 1: Room & Dates -> 2: Meal Plan -> 3: Guest Info -> 4: Success & Digital Key
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Available Rooms & Meal Plans
  const [rooms, setRooms] = useState<RoomTypeItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Selected Booking Parameters
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedMealId, setSelectedMealId] = useState<string>('meal_breakfast');
  
  // Dates
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => new Date(Date.now() + 86400000).toISOString().split('T')[0], []);
  const [checkIn, setCheckIn] = useState<string>(todayStr);
  const [checkOut, setCheckOut] = useState<string>(tomorrowStr);

  // Counts
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);

  // Guest Details
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // Submission State & Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<RoomBooking | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load Rooms and Meals on Open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoadingData(true);
    
    Promise.all([
      getRoomsFromDb(hotel.id),
      getMealPlansFromDb()
    ]).then(([fetchedRooms, fetchedMeals]) => {
      if (!isMounted) return;
      setRooms(fetchedRooms);
      setMealPlans(fetchedMeals.filter(m => m.isActive));

      if (preSelectedRoomId && fetchedRooms.some(r => r.id === preSelectedRoomId)) {
        setSelectedRoomId(preSelectedRoomId);
      } else if (fetchedRooms.length > 0) {
        setSelectedRoomId(fetchedRooms[0].id);
      }

      if (preSelectedMealId && fetchedMeals.some(m => m.id === preSelectedMealId)) {
        setSelectedMealId(preSelectedMealId);
      }
      setLoadingData(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, hotel.id, preSelectedRoomId, preSelectedMealId]);

  // Reset step on reopen
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setConfirmedBooking(null);
    }
  }, [isOpen]);

  // Calculate Nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [checkIn, checkOut]);

  // Selected Room & Meal Object
  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0] || null;
  }, [rooms, selectedRoomId]);

  const selectedMeal = useMemo(() => {
    return mealPlans.find(m => m.id === selectedMealId) || mealPlans[0] || null;
  }, [mealPlans, selectedMealId]);

  const hotelPolicy = useMemo(() => getHotelPolicy(hotel), [hotel]);
  const isTaxIncluded = hotelPolicy.priceIncludesTax !== false;

  // Price Breakdown Calculation
  const calculation = useMemo(() => {
    const roomRate = selectedRoom ? selectedRoom.basePrice : 0;
    const roomsCost = roomRate * nights * roomsCount;
    const mealPricePerPerson = selectedMeal ? selectedMeal.pricePerPersonPerNight : 0;
    const totalGuests = adultsCount + childrenCount;
    const mealsCost = mealPricePerPerson * totalGuests * nights;
    const subtotal = roomsCost + mealsCost;
    const taxes = isTaxIncluded ? 0 : Math.round(subtotal * 0.15); // 15% VAT if exclusive
    const grandTotal = subtotal + taxes;

    return {
      roomRate,
      roomsCost,
      mealPricePerPerson,
      mealsCost,
      subtotal,
      taxes,
      grandTotal,
      isTaxIncluded
    };
  }, [selectedRoom, selectedMeal, nights, roomsCount, adultsCount, childrenCount, isTaxIncluded]);

  if (!isOpen) return null;

  // Final Submission Handler
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const bookingCode = generateBookingCode();
      // المفتاح الرقمي ورقم التأكيد يحدده ويعتمده المشرف فقط ولا يصدر تلقائياً للعميل
      const digitalKey = '';

      const newBooking: RoomBooking = {
        id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        bookingCode,
        digitalKey,
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelCity: hotel.city,
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || undefined,
        checkIn,
        checkOut,
        nights,
        roomsCount,
        adults: adultsCount,
        children: childrenCount,
        mealPlanId: selectedMeal?.id || 'meal_none',
        mealPlanName: selectedMeal?.name || 'بدون وجبات',
        mealPlanPrice: selectedMeal?.pricePerPersonPerNight || 0,
        roomPricePerNight: selectedRoom.basePrice,
        totalAmount: calculation.grandTotal,
        specialRequests: specialRequests.trim() || undefined,
        status: 'pending',
        createdAt: Date.now()
      };

      await saveBookingToDb(newBooking);
      setConfirmedBooking(newBooking);
      setStep(4);

      if (onSuccessToast) {
        onSuccessToast(`تم تسجيل الحجز بنجاح! كود الحجز: ${bookingCode}`);
      }
    } catch (err) {
      console.error('Failed to create booking:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string, type: 'code' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#FCFBFA] w-full max-w-4xl max-h-[92vh] rounded-[32px] shadow-2xl border border-white/60 flex flex-col overflow-hidden relative"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/20 border border-[#C9A24B]/40 flex items-center justify-center text-[#E6C673]">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#C9A24B]/20 text-[#E6C673] font-bold">
                  حجز فوري مباشر
                </span>
                <span className="text-xs text-stone-400">{hotel.city}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-cairo text-white">
                {hotel.name}
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Stepper Bar */}
        {step < 4 && (
          <div className="px-6 py-3 bg-white/80 border-b border-stone-200/80 flex items-center justify-between text-xs font-bold text-stone-600 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 sm:gap-6 min-w-max">
              <button 
                onClick={() => setStep(1)}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${step === 1 ? 'text-[#B38A34]' : 'text-stone-400'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-[#C9A24B] text-white' : 'bg-stone-200 text-stone-600'}`}>
                  1
                </span>
                <span>الغرفة والتواريخ</span>
              </button>

              <ChevronRight className="w-3.5 h-3.5 text-stone-300" />

              <button 
                onClick={() => setStep(2)}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${step === 2 ? 'text-[#B38A34]' : 'text-stone-400'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-[#C9A24B] text-white' : 'bg-stone-200 text-stone-600'}`}>
                  2
                </span>
                <span>نظام الوجبات</span>
              </button>

              <ChevronRight className="w-3.5 h-3.5 text-stone-300" />

              <button 
                onClick={() => setStep(3)}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${step === 3 ? 'text-[#B38A34]' : 'text-stone-400'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-[#C9A24B] text-white' : 'bg-stone-200 text-stone-600'}`}>
                  3
                </span>
                <span>بيانات النزيل وتأكيد الحجز</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[#B38A34] bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60 font-medium text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>أفضل سعر إقامة مضمون</span>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loadingData ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-[#C9A24B] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-stone-500">جاري تحميل خيارات الغرف الفاخرة...</p>
            </div>
          ) : (
            <>
              {/* STEP 1: ROOM & DATES */}
              {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Dates & Guests Selector Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#B38A34]" />
                        <span>تاريخ الوصول (Check-in)</span>
                      </label>
                      <input 
                        type="date" 
                        value={checkIn}
                        min={todayStr}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#C9A24B]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#B38A34]" />
                        <span>تاريخ المغادرة (Check-out)</span>
                      </label>
                      <input 
                        type="date" 
                        value={checkOut}
                        min={checkIn || todayStr}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#C9A24B]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#B38A34]" />
                        <span>عدد النزلاء</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select 
                          value={adultsCount}
                          onChange={(e) => setAdultsCount(Number(e.target.value))}
                          className="px-2 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#C9A24B]"
                        >
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <option key={n} value={n}>{n} بالغين</option>
                          ))}
                        </select>
                        <select 
                          value={childrenCount}
                          onChange={(e) => setChildrenCount(Number(e.target.value))}
                          className="px-2 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#C9A24B]"
                        >
                          {[0, 1, 2, 3, 4].map(n => (
                            <option key={n} value={n}>{n} أطفال</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1 flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-[#B38A34]" />
                        <span>عدد الغرف</span>
                      </label>
                      <select 
                        value={roomsCount}
                        onChange={(e) => setRoomsCount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#C9A24B]"
                      >
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'غرفة واحدة' : 'غرف'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Room Selection Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <span>اختر نوع الغرفة أو الجناح المطلوب:</span>
                        <span className="text-xs font-medium text-stone-500">({rooms.length} خيارات متاحة)</span>
                      </h3>
                      <span className="text-xs text-[#B38A34] font-bold bg-[#C9A24B]/10 px-3 py-1 rounded-xl">
                        الإقامة: {nights} {nights === 1 ? 'ليلة' : 'ليالٍ'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rooms.map((room) => {
                        const isSelected = selectedRoomId === room.id;
                        return (
                          <div 
                            key={room.id}
                            onClick={() => setSelectedRoomId(room.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                              isSelected 
                                ? 'bg-amber-50/70 border-[#C9A24B] shadow-md ring-2 ring-[#C9A24B]/30' 
                                : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-[#C9A24B] text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}

                            <div>
                              {room.images?.[0] && (
                                <div className="h-36 rounded-xl overflow-hidden mb-3 relative">
                                  <img 
                                    src={room.images[0]} 
                                    alt={room.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-white font-bold">
                                    {room.category}
                                  </div>
                                </div>
                              )}

                              <h4 className="text-sm font-bold text-stone-900">{room.name}</h4>
                              <p className="text-xs text-stone-500 mt-0.5">{room.bedType} • {room.roomSize}</p>

                              {/* Features Chips */}
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {room.features.slice(0, 3).map((feat, idx) => (
                                  <span key={idx} className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium">
                                    {feat}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between">
                              <div>
                                <span className="text-base font-extrabold text-stone-900">{room.basePrice} ر.س</span>
                                <span className="text-[11px] text-stone-500"> / ليلة</span>
                              </div>
                              <span className={`text-xs font-bold px-3 py-1 rounded-xl ${
                                isSelected ? 'bg-[#C9A24B] text-white' : 'bg-stone-100 text-stone-700'
                              }`}>
                                {isSelected ? 'محددة ✓' : 'اختيار الغرفة'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: MEAL PLAN */}
              {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                    <Utensils className="w-5 h-5 text-[#B38A34] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">اختر تجربة الطعام والوجبات المفضلة لديك</h4>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        يتم إعداد كافة الوجبات بإشراف كبار الطهاة وتقديمها بنظام البوفيه الفاخر المفتوح بمطاعم الفندق.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mealPlans.map((meal) => {
                      const isSelected = selectedMealId === meal.id;
                      return (
                        <div 
                          key={meal.id}
                          onClick={() => setSelectedMealId(meal.id)}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected 
                              ? 'bg-amber-50/70 border-[#C9A24B] shadow-md ring-2 ring-[#C9A24B]/30' 
                              : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                                <Coffee className="w-4 h-4" />
                              </div>
                              {isSelected ? (
                                <span className="w-6 h-6 rounded-full bg-[#C9A24B] text-white flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </span>
                              ) : (
                                <span className="w-6 h-6 rounded-full border border-stone-300" />
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-stone-900 mt-3">{meal.name}</h4>
                            <p className="text-xs text-stone-500 mt-1">{meal.description}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-700">
                              {meal.pricePerPersonPerNight === 0 ? 'مشمول مجاناً' : `+ ${meal.pricePerPersonPerNight} ر.س / للفرد لكل ليلة`}
                            </span>
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                              isSelected ? 'bg-[#C9A24B] text-white' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {isSelected ? 'محدد' : 'تحديد'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: GUEST INFORMATION & SUMMARY */}
              {step === 3 && (
                <form onSubmit={handleConfirmBooking} className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Guest Inputs Column */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
                        <h4 className="text-xs font-bold text-stone-800 flex items-center gap-2">
                          <User className="w-4 h-4 text-[#B38A34]" />
                          <span>بيانات النزيل الأساسية (لإصدار الحجز والمفتاح الرقمي)</span>
                        </h4>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">
                            الاسم الكامل للنزيل <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input 
                              type="text" 
                              required
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              placeholder="مثال: أحمد محمود العتيبي"
                              className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                            />
                            <User className="w-4 h-4 text-stone-400 absolute top-3 right-3 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">
                            رقم الهاتف الجوال (مع كود الدولة) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input 
                              type="tel" 
                              required
                              value={guestPhone}
                              onChange={(e) => setGuestPhone(e.target.value)}
                              placeholder="مثال: +966500000000 أو 0500000000"
                              dir="ltr"
                              className="w-full px-3.5 py-2.5 pl-9 text-right rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                            />
                            <Phone className="w-4 h-4 text-stone-400 absolute top-3 left-3 pointer-events-none" />
                          </div>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            سنرسل تفاصيل الحجز وكود المفتاح على هذا الرقم
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">
                            البريد الإلكتروني (اختياري لاستلام الفاتورة)
                          </label>
                          <div className="relative">
                            <input 
                              type="email" 
                              value={guestEmail}
                              onChange={(e) => setGuestEmail(e.target.value)}
                              placeholder="example@gmail.com"
                              dir="ltr"
                              className="w-full px-3.5 py-2.5 pl-9 text-right rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                            />
                            <Mail className="w-4 h-4 text-stone-400 absolute top-3 left-3 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">
                            طلبات خاصة أو ملاحظات (اختياري)
                          </label>
                          <textarea 
                            rows={2}
                            value={specialRequests}
                            onChange={(e) => setSpecialRequests(e.target.value)}
                            placeholder="مثال: تفضيل طابق علوي، سرير أطفال إضافي، وصول متأخر..."
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Booking Price Receipt Breakdown Column */}
                    <div className="lg:col-span-5">
                      <div className="p-5 rounded-2xl bg-stone-900 text-white shadow-lg space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                          <h4 className="text-xs font-bold text-[#E6C673] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>ملخص الحساب والتكلفة</span>
                          </h4>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-stone-300">
                            {hotel.city}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-stone-300">
                            <span>الغرفة:</span>
                            <span className="font-bold text-white text-left max-w-[180px] truncate">{selectedRoom?.name}</span>
                          </div>
                          <div className="flex justify-between text-stone-300">
                            <span>الفترة:</span>
                            <span className="font-bold text-white">{nights} {nights === 1 ? 'ليلة' : 'ليالٍ'} ({roomsCount} غرفة)</span>
                          </div>
                          <div className="flex justify-between text-stone-300">
                            <span>سعر الغرف:</span>
                            <span className="font-bold text-white">{calculation.roomsCost.toLocaleString()} ر.س</span>
                          </div>
                          <div className="flex justify-between text-stone-300">
                            <span>الوجبات ({selectedMeal?.name}):</span>
                            <span className="font-bold text-white">
                              {calculation.mealsCost === 0 ? 'شاملة مجاناً' : `${calculation.mealsCost.toLocaleString()} ر.س`}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] pt-1 border-t border-stone-800">
                            <span className="text-stone-400">ضريبة القيمة المضافة (15%):</span>
                            {calculation.isTaxIncluded ? (
                              <span className="text-emerald-400 font-bold">مشمولة بالفعل بالكامل ✓</span>
                            ) : (
                              <span className="text-[#E6C673] font-mono font-bold">+{calculation.taxes.toLocaleString()} ر.س</span>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] text-stone-400 block">الإجمالي الكلي النهائي:</span>
                            <span className="text-xl font-black text-[#E6C673]">{calculation.grandTotal.toLocaleString()} ر.س</span>
                          </div>
                          <div className="text-[10px] text-stone-400 text-left">
                            <span>الدفع عند الوصول</span>
                            <span className="block text-emerald-400 font-bold">إلغاء مرن مجاني</span>
                          </div>
                        </div>

                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38A34] hover:from-[#B38A34] hover:to-[#9E782B] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>جاري إصدار الحجز والمفتاح...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>تأكيد الحجز الآن</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* STEP 4: SUCCESS CONFIRMATION & DIGITAL KEY */}
              {step === 4 && confirmedBooking && (
                <div className="space-y-6 text-center py-4 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 font-cairo">
                      تهانينا يا {confirmedBooking.guestName}! تم تأكيد طلب حجزك بنجاح
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                      تم تسجيل الحجز في منظومة فندق {confirmedBooking.hotelName} وتوليد المفتاح الرقمي المبدئي لتسهيل عملية التسكين عند الوصول.
                    </p>
                  </div>

                  {/* Digital Key Card (Apple Wallet Style) */}
                  <div className="max-w-md mx-auto p-5 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white shadow-2xl border border-[#C9A24B]/40 relative overflow-hidden text-right">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A24B]/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                      <div>
                        <span className="text-[10px] text-[#E6C673] font-bold block uppercase tracking-wider">PRESTIGE HOTELS KEY CARD</span>
                        <h4 className="text-sm font-bold text-white">{confirmedBooking.hotelName}</h4>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/20 text-[#E6C673] flex items-center justify-center">
                        <Key className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 block">رقم طلب الحجز المرجعي:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <strong className="text-[#E6C673] font-mono text-sm">{confirmedBooking.bookingCode}</strong>
                          <button 
                            type="button"
                            onClick={() => handleCopy(confirmedBooking.bookingCode, 'code')}
                            className="text-stone-400 hover:text-white cursor-pointer"
                            title="نسخ كود الحجز"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {copiedCode && <span className="text-[9px] text-emerald-400 block">تم النسخ ✓</span>}
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-400 block">رقم تأكيد الحجز والمفتاح الرقمي:</span>
                        {confirmedBooking.digitalKey ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <strong className="text-emerald-400 font-mono text-sm">{confirmedBooking.digitalKey}</strong>
                            <button 
                              type="button"
                              onClick={() => handleCopy(confirmedBooking.digitalKey, 'key')}
                              className="text-stone-400 hover:text-white cursor-pointer"
                              title="نسخ كود المفتاح"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                            <Clock className="w-3 h-3 shrink-0 text-amber-400" />
                            <span>قيد الإصدار والاعتماد بواسطة المشرف</span>
                          </div>
                        )}
                        {copiedKey && <span className="text-[9px] text-emerald-400 block">تم النسخ ✓</span>}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 block">فترة الإقامة:</span>
                        <span className="font-semibold text-white">{confirmedBooking.checkIn} ➔ {confirmedBooking.checkOut}</span>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-stone-400 block">الإجمالي:</span>
                        <span className="font-bold text-[#E6C673]">{confirmedBooking.totalAmount.toLocaleString()} ر.س</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Send to WhatsApp + Track Booking */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <a 
                      href={buildGuestWhatsAppShareLink(confirmedBooking, hotel.hotelWhatsApp, siteSettings)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>إرسال تفاصيل الحجز والمفتاح إلى واتساب الفندق</span>
                    </a>

                    {onOpenTrackModal && (
                      <button 
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenTrackModal(confirmedBooking.bookingCode);
                        }}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#B38A34]" />
                        <span>مراجعة وإدارة الحجز</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom Footer Navigation (Steps 1 & 2) */}
        {step < 3 && !loadingData && (
          <div className="p-4 sm:p-5 bg-white border-t border-stone-200/80 flex items-center justify-between shrink-0">
            <div>
              <span className="text-[11px] text-stone-400 block">الإجمالي التقديري:</span>
              <span className="text-base sm:text-lg font-black text-stone-900">
                {calculation.grandTotal.toLocaleString()} ر.س
              </span>
            </div>

            <div className="flex items-center gap-3">
              {step > 1 && (
                <button 
                  onClick={() => setStep(prev => (prev - 1) as any)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
              )}

              <button 
                onClick={() => setStep(prev => (prev + 1) as any)}
                className="px-6 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>متابعة الخطوة التالية</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
