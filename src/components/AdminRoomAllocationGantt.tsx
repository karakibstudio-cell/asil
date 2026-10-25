import React, { useState, useMemo } from 'react';
import { RoomBooking, Hotel, RoomTypeItem, BookingStatus } from '../types';
import { updateBookingStatus } from '../services/bookingService';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  BedDouble, 
  Building2, 
  User, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Search, 
  Filter, 
  X, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  ExternalLink,
  Zap,
  ArrowRight
} from 'lucide-react';
import { WhatsAppIcon } from './BookingIcons';

interface AdminRoomAllocationGanttProps {
  hotels: Hotel[];
  bookings: RoomBooking[];
  rooms: RoomTypeItem[];
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshData?: () => Promise<void>;
}

interface PhysicalRoom {
  roomNumber: string;
  floor: number;
  roomTypeId: string;
  roomTypeName: string;
  hotelId: string;
}

export const AdminRoomAllocationGantt: React.FC<AdminRoomAllocationGanttProps> = ({
  hotels,
  bookings,
  rooms,
  onShowToast,
  onRefreshData
}) => {
  // 1. Hotel filter
  const [selectedHotelId, setSelectedHotelId] = useState<string>(() => {
    return hotels[0]?.id || '';
  });

  // Current view window date (default to 1st of current month or today)
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Range view mode: '14days' | 'month'
  const [viewMode, setViewMode] = useState<'14days' | 'month'>('14days');
  const [searchGuestQuery, setSearchGuestQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'checked_in'>('all');

  // Selected Booking for Quick Reallocation Modal
  const [activeBooking, setActiveBooking] = useState<RoomBooking | null>(null);
  const [reassignRoomNum, setReassignRoomNum] = useState<string>('');
  const [isUpdatingAllocation, setIsUpdatingAllocation] = useState(false);

  const selectedHotel = useMemo(() => {
    return hotels.find(h => h.id === selectedHotelId) || hotels[0] || null;
  }, [hotels, selectedHotelId]);

  // Hotel rooms filtered
  const hotelRooms = useMemo(() => {
    if (!selectedHotel) return [];
    return rooms.filter(r => r.hotelId === selectedHotel.id);
  }, [rooms, selectedHotel]);

  // Generate virtual physical rooms for the hotel based on rooms units or defined numbers
  const physicalRooms = useMemo<PhysicalRoom[]>(() => {
    if (!selectedHotel) return [];
    const list: PhysicalRoom[] = [];

    // Check bookings for existing assigned room numbers
    const hotelBookings = bookings.filter(b => b.hotelId === selectedHotel.id);
    const existingRoomNums = new Set<string>();
    hotelBookings.forEach(b => {
      if (b.assignedRoomNumber && b.assignedRoomNumber.trim()) {
        existingRoomNums.add(b.assignedRoomNumber.trim());
      }
    });

    if (hotelRooms.length > 0) {
      hotelRooms.forEach((rt, rIdx) => {
        const units = Math.max(rt.totalUnits || 4, 3);
        const floorBase = (rIdx + 1) * 100;
        for (let i = 1; i <= units; i++) {
          const num = `${floorBase + i}`;
          existingRoomNums.delete(num);
          list.push({
            roomNumber: num,
            floor: rIdx + 1,
            roomTypeId: rt.id,
            roomTypeName: rt.name,
            hotelId: selectedHotel.id
          });
        }
      });
    } else {
      // Fallback default rooms
      for (let floor = 1; floor <= 4; floor++) {
        for (let r = 1; r <= 4; r++) {
          const num = `${floor * 100 + r}`;
          existingRoomNums.delete(num);
          list.push({
            roomNumber: num,
            floor,
            roomTypeId: `type-${floor}`,
            roomTypeName: floor === 1 ? 'جناح تنفيذي مطل' : floor === 2 ? 'غرفة ديلوكس كينج' : 'غرفة ثنائية مميزة',
            hotelId: selectedHotel.id
          });
        }
      }
    }

    // Add any custom room numbers from existing bookings
    existingRoomNums.forEach(num => {
      const match = num.match(/\d+/);
      const floor = match ? Math.max(1, Math.floor(parseInt(match[0], 10) / 100)) : 1;
      list.push({
        roomNumber: num,
        floor,
        roomTypeId: 'custom',
        roomTypeName: 'غرفة إضافية مسكنة',
        hotelId: selectedHotel.id
      });
    });

    return list.sort((a, b) => {
      const na = parseInt(a.roomNumber, 10) || 0;
      const nb = parseInt(b.roomNumber, 10) || 0;
      return na - nb;
    });
  }, [selectedHotel, hotelRooms, bookings]);

  // Days columns based on view mode and currentDate
  const daysColumns = useMemo(() => {
    const list: Array<{
      dateStr: string;
      dayNum: number;
      dayName: string;
      monthName: string;
      isToday: boolean;
      isWeekend: boolean;
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];
    const totalDays = viewMode === '14days' ? 14 : 30;
    const base = new Date(currentDate);

    const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthNamesAr = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayIdx = d.getDay();
      list.push({
        dateStr,
        dayNum: d.getDate(),
        dayName: dayNamesAr[dayIdx],
        monthName: monthNamesAr[d.getMonth()],
        isToday: dateStr === todayStr,
        isWeekend: dayIdx === 4 || dayIdx === 5 // Thursday or Friday
      });
    }

    return list;
  }, [currentDate, viewMode]);

  const startDateStr = daysColumns[0]?.dateStr || '';
  const endDateStr = daysColumns[daysColumns.length - 1]?.dateStr || '';
  const todayStr = new Date().toISOString().split('T')[0];

  // Relevant bookings for selected hotel within or overlapping the window
  const hotelBookings = useMemo(() => {
    if (!selectedHotel) return [];
    return bookings.filter(b => {
      if (b.hotelId !== selectedHotel.id) return false;
      if (b.status === 'cancelled') return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (searchGuestQuery.trim()) {
        const q = searchGuestQuery.toLowerCase();
        const matchName = (b.guestName || '').toLowerCase().includes(q);
        const matchCode = (b.bookingCode || '').toLowerCase().includes(q);
        const matchRoom = (b.assignedRoomNumber || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchRoom) return false;
      }
      // Overlaps with window: checkIn <= endDate && checkOut >= startDate
      return b.checkIn <= endDateStr && b.checkOut >= startDateStr;
    });
  }, [bookings, selectedHotel, statusFilter, searchGuestQuery, startDateStr, endDateStr]);

  // Unassigned bookings in this window (no room assigned yet)
  const unassignedBookings = useMemo(() => {
    return hotelBookings.filter(b => !b.assignedRoomNumber || !b.assignedRoomNumber.trim());
  }, [hotelBookings]);

  // Map of roomNumber -> Bookings assigned
  const roomBookingsMap = useMemo(() => {
    const map = new Map<string, RoomBooking[]>();
    physicalRooms.forEach(pr => map.set(pr.roomNumber, []));

    hotelBookings.forEach(b => {
      if (b.assignedRoomNumber && b.assignedRoomNumber.trim()) {
        const num = b.assignedRoomNumber.trim();
        const existing = map.get(num) || [];
        existing.push(b);
        map.set(num, existing);
      }
    });

    return map;
  }, [physicalRooms, hotelBookings]);

  // Quick Stats
  const stats = useMemo(() => {
    const todayArrivals = hotelBookings.filter(b => b.checkIn === todayStr).length;
    const todayDepartures = hotelBookings.filter(b => b.checkOut === todayStr).length;
    const currentOccupied = hotelBookings.filter(b => b.checkIn <= todayStr && b.checkOut > todayStr).length;
    const totalRooms = physicalRooms.length || 1;
    const occupancyRate = Math.min(100, Math.round((currentOccupied / totalRooms) * 100));

    return {
      todayArrivals,
      todayDepartures,
      currentOccupied,
      totalRooms,
      occupancyRate
    };
  }, [hotelBookings, physicalRooms, todayStr]);

  // Date Navigation
  const handlePrev = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (viewMode === '14days' ? 14 : 30));
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (viewMode === '14days' ? 14 : 30));
    setCurrentDate(d);
  };

  const handleJumpToToday = () => {
    const d = new Date();
    if (viewMode === '14days') {
      d.setDate(d.getDate() - 2); // Show 2 days before today for context
    } else {
      d.setDate(1);
    }
    setCurrentDate(d);
  };

  // Assign or change room number
  const handleSaveRoomAssignment = async () => {
    if (!activeBooking) return;
    setIsUpdatingAllocation(true);
    try {
      const roomNum = reassignRoomNum.trim();
      
      // Check for conflict in the target room
      if (roomNum) {
        const assignedToThisRoom = roomBookingsMap.get(roomNum) || [];
        const conflict = assignedToThisRoom.find(b => 
          b.id !== activeBooking.id &&
          b.status !== 'cancelled' &&
          b.checkIn < activeBooking.checkOut &&
          b.checkOut > activeBooking.checkIn
        );

        if (conflict) {
          const proceed = window.confirm(
            `تنبيه تضارب: الغرفة ${roomNum} محجوزة مسبقاً للنزيل "${conflict.guestName}" من ${conflict.checkIn} إلى ${conflict.checkOut}.\nهل تود تأكيد التسكين المزدوج رغم ذلك؟`
          );
          if (!proceed) {
            setIsUpdatingAllocation(false);
            return;
          }
        }
      }

      await updateBookingStatus(
        activeBooking.id,
        activeBooking.status,
        roomNum,
        activeBooking.adminNotes,
        activeBooking.bookingCode,
        activeBooking.digitalKey
      );

      activeBooking.assignedRoomNumber = roomNum;
      onShowToast(roomNum ? `تم تسكين النزيل ${activeBooking.guestName} في الغرفة ${roomNum} بنجاح ✓` : 'تم إلغاء تخصيص الغرفة', 'success');
      setActiveBooking(null);
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء حفظ التسكين', 'error');
    } finally {
      setIsUpdatingAllocation(false);
    }
  };

  // Helper to calculate column span for a booking
  const getBookingSpanStyle = (b: RoomBooking) => {
    const startIdx = daysColumns.findIndex(c => c.dateStr === b.checkIn);
    const endIdx = daysColumns.findIndex(c => c.dateStr === b.checkOut);

    let leftCol = startIdx >= 0 ? startIdx : 0;
    let rightCol = endIdx >= 0 ? endIdx : daysColumns.length;

    if (startIdx < 0 && b.checkIn < startDateStr) leftCol = 0;
    if (endIdx < 0 && b.checkOut > endDateStr) rightCol = daysColumns.length;

    const span = Math.max(1, rightCol - leftCol);

    return {
      gridColumnStart: leftCol + 1,
      gridColumnEnd: `span ${span}`
    };
  };

  // Color badges based on status
  const getStatusColorClasses = (b: RoomBooking) => {
    if (b.checkOut === todayStr) {
      return 'bg-purple-600/90 hover:bg-purple-600 text-white border-purple-400 shadow-purple-500/20';
    }
    if (b.checkIn === todayStr) {
      return 'bg-amber-500/95 hover:bg-amber-500 text-stone-950 border-amber-300 font-black shadow-amber-500/30';
    }
    switch (b.status) {
      case 'confirmed':
        return 'bg-emerald-600/90 hover:bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/20';
      case 'checked_in':
        return 'bg-blue-600/90 hover:bg-blue-600 text-white border-blue-400 shadow-blue-500/20';
      case 'pending':
      case 'pending_confirmation':
        return 'bg-amber-600/85 hover:bg-amber-600 text-white border-amber-300 shadow-amber-500/20';
      default:
        return 'bg-stone-600/80 hover:bg-stone-600 text-white border-stone-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & HOTEL SELECTOR */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold shadow-2xs">
            <BedDouble className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold font-cairo text-stone-900">
                مخطط تسكين الغرف الزمني البصري (Room Allocation Gantt)
              </h2>
              <span className="text-xs bg-[#C9A24B]/15 text-[#8C6D23] font-bold px-2.5 py-0.5 rounded-full border border-[#C9A24B]/30">
                إدارة الاستقبال والتسكين
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              رؤية أفقية تفاعلية لإشغال الغرف يومياً، منع التضارب، وتعيين الغرف الفوري للنزلاء.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-end">
          {/* Hotel Dropdown */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-stone-400" />
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
            >
              {hotels.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.city})
                </option>
              ))}
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('14days')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === '14days' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              ١٤ يوماً
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              ٣٠ يوماً (شهر كامل)
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS & KPI BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-500 font-bold block">نسبة الإشغال اليوم</span>
            <span className="text-xl font-black font-mono text-[#C9A24B]">{stats.occupancyRate}%</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#C9A24B] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-500 font-bold block">الغرف المشغولة حالياً</span>
            <span className="text-xl font-black font-mono text-blue-600">{stats.currentOccupied} / {stats.totalRooms}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <BedDouble className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-500 font-bold block">وصول متوقع اليوم</span>
            <span className="text-xl font-black font-mono text-emerald-600">{stats.todayArrivals}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <LogIn className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-500 font-bold block">مغادرة متوقعة اليوم</span>
            <span className="text-xl font-black font-mono text-purple-600">{stats.todayDepartures}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <LogOut className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. CONTROLS & DATE NAVIGATOR */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
              title="الفترة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 font-bold text-xs transition-colors cursor-pointer"
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
              title="الفترة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs font-black text-stone-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#C9A24B]" />
            <span dir="ltr" className="font-mono">{startDateStr}</span>
            <span>إلى</span>
            <span dir="ltr" className="font-mono">{endDateStr}</span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              value={searchGuestQuery}
              onChange={(e) => setSearchGuestQuery(e.target.value)}
              placeholder="بحث باسم النزيل أو الغرفة..."
              className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#C9A24B]"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl text-xs bg-stone-50 border border-stone-200 text-stone-700 focus:outline-none"
          >
            <option value="all">كل الحالات</option>
            <option value="confirmed">المؤكدة فقط</option>
            <option value="checked_in">تم التسكين</option>
            <option value="pending">قيد الانتظار</option>
          </select>
        </div>
      </div>

      {/* 4. UNASSIGNED BOOKINGS DRAWER (if any) */}
      {unassignedBookings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-amber-900">
                حجوزات بانتظار تخصيص رقم الغرفة ({unassignedBookings.length})
              </span>
            </div>
            <span className="text-[11px] text-amber-700">
              اضغط على أي حجز لتخصيص رقم الغرفة له فوراً
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {unassignedBookings.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setActiveBooking(b);
                  setReassignRoomNum(b.assignedRoomNumber || '');
                }}
                className="px-3 py-2 rounded-xl bg-white border border-amber-300 hover:border-[#C9A24B] shadow-xs text-right shrink-0 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-stone-900">
                  <span>{b.guestName}</span>
                  <span className="font-mono text-[10px] text-amber-600">#{b.bookingCode}</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-2">
                  <span>{b.roomName}</span>
                  <span>•</span>
                  <span dir="ltr">{b.checkIn} ~ {b.checkOut}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. GANTT MATRIX TABLE */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Color Legend */}
        <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between flex-wrap gap-2 text-[11px]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-stone-700">دليل الألوان:</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-600">
              <span className="w-3 h-3 rounded-md bg-emerald-600" />
              <span>مؤكد</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-600">
              <span className="w-3 h-3 rounded-md bg-blue-600" />
              <span>مسكن حالياً</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-600">
              <span className="w-3 h-3 rounded-md bg-amber-500" />
              <span>وصول اليوم</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-600">
              <span className="w-3 h-3 rounded-md bg-purple-600" />
              <span>مغادرة اليوم</span>
            </span>
          </div>
          <span className="text-stone-400 font-mono text-[10px]">
            * انقر على أي حجز لعرض بيانات النزيل وتعديل رقم الغرفة
          </span>
        </div>

        {/* Scrollable Matrix */}
        <div className="overflow-x-auto scrollbar-thin">
          <div className="min-w-[900px]">
            {/* Header: Date Columns */}
            <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(50px,1fr))] border-b border-stone-200 bg-stone-100/70 sticky top-0 z-20">
              <div className="p-3 border-l border-stone-200 font-bold text-xs text-stone-700 flex items-center justify-between">
                <span>الغرفة / الفئة</span>
                <BedDouble className="w-4 h-4 text-stone-400" />
              </div>

              {daysColumns.map((col) => (
                <div
                  key={col.dateStr}
                  className={`p-2 text-center border-l border-stone-200/70 transition-colors ${
                    col.isToday
                      ? 'bg-amber-100/60 font-black text-amber-900 ring-2 ring-amber-400/80 inset-0 z-10'
                      : col.isWeekend
                      ? 'bg-stone-100 font-medium text-stone-700'
                      : 'text-stone-600 font-normal'
                  }`}
                >
                  <div className="text-[10px] block opacity-80">{col.dayName}</div>
                  <div className="text-sm font-bold font-mono">{col.dayNum}</div>
                  <div className="text-[9px] block opacity-60">{col.monthName}</div>
                </div>
              ))}
            </div>

            {/* Rows: Physical Rooms */}
            {physicalRooms.map((pr) => {
              const assigned = roomBookingsMap.get(pr.roomNumber) || [];

              return (
                <div
                  key={pr.roomNumber}
                  className="grid grid-cols-[160px_repeat(auto-fit,minmax(50px,1fr))] border-b border-stone-100 hover:bg-stone-50/50 transition-colors relative min-h-[58px]"
                >
                  {/* Left Room Label */}
                  <div className="p-3 border-l border-stone-200 bg-white sticky right-0 z-10 flex items-center justify-between gap-1 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded-md border border-stone-200">
                          {pr.roomNumber}
                        </span>
                        <span className="text-[10px] text-stone-400 font-bold">ط{pr.floor}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 block truncate max-w-[100px] mt-0.5" title={pr.roomTypeName}>
                        {pr.roomTypeName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const guestName = prompt(`تسكين يدوي سريع للغرفة ${pr.roomNumber}:\nيرجى إدخال اسم النزيل أو كود الحجز:`);
                        if (guestName && guestName.trim()) {
                          onShowToast(`تم تسجيل الغرفة ${pr.roomNumber} تحت المتابعة`, 'info');
                        }
                      }}
                      className="text-stone-400 hover:text-[#C9A24B] p-1 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                      title="إضافة تسكين يدوي للغرفة"
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day Grid Cells for this room */}
                  <div className="col-span-full grid grid-cols-[repeat(auto-fit,minmax(50px,1fr))] mr-[160px] relative pointer-events-none">
                    {daysColumns.map((col) => (
                      <div
                        key={col.dateStr}
                        className={`border-l border-stone-100/80 h-full ${
                          col.isToday ? 'bg-amber-50/20' : col.isWeekend ? 'bg-stone-50/30' : ''
                        }`}
                      />
                    ))}

                    {/* Booking Blocks overlaid */}
                    {assigned.map((b) => {
                      const spanStyle = getBookingSpanStyle(b);
                      const colorClass = getStatusColorClasses(b);

                      return (
                        <div
                          key={b.id}
                          style={spanStyle}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveBooking(b);
                            setReassignRoomNum(b.assignedRoomNumber || pr.roomNumber);
                          }}
                          className={`absolute top-1.5 bottom-1.5 m-0.5 px-2 py-1 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] hover:z-20 pointer-events-auto flex items-center justify-between gap-1 shadow-sm overflow-hidden ${colorClass}`}
                          title={`${b.guestName} (${b.checkIn} ~ ${b.checkOut}) - #${b.bookingCode}`}
                        >
                          <div className="truncate flex items-center gap-1 min-w-0">
                            <span className="font-bold truncate text-[11px]">{b.guestName}</span>
                            <span className="font-mono text-[9px] opacity-75 hidden sm:inline">#{b.bookingCode}</span>
                          </div>
                          <span className="text-[10px] font-mono shrink-0 opacity-80">{b.nights}ل</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. QUICK ALLOCATION / GUEST DETAILS MODAL */}
      {activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">{activeBooking.guestName}</h3>
                  <span className="text-xs font-mono text-stone-500">كود الحجز: #{activeBooking.bookingCode}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveBooking(null)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
              <div>
                <span className="text-stone-400 block text-[10px]">الفندق</span>
                <strong className="text-stone-800">{activeBooking.hotelName}</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">فئة الغرفة</span>
                <strong className="text-stone-800">{activeBooking.roomName}</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">تاريخ الدخول</span>
                <strong className="text-stone-800 font-mono" dir="ltr">{activeBooking.checkIn}</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">تاريخ المغادرة</span>
                <strong className="text-stone-800 font-mono" dir="ltr">{activeBooking.checkOut}</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">النزلاء</span>
                <strong className="text-stone-800">{activeBooking.adults} بالغين {activeBooking.children ? `+ ${activeBooking.children} أطفال` : ''}</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">المبلغ الإجمالي</span>
                <strong className="text-[#C9A24B] font-mono">{activeBooking.totalAmount} ر.س</strong>
              </div>
            </div>

            {/* Reassign Room Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-800">
                تخصيص / تغيير رقم الغرفة المسكنة:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={reassignRoomNum}
                  onChange={(e) => setReassignRoomNum(e.target.value)}
                  placeholder="مثال: 104 أو 302..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-white border border-stone-300 text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
                {physicalRooms.length > 0 && (
                  <select
                    onChange={(e) => setReassignRoomNum(e.target.value)}
                    value={reassignRoomNum}
                    className="px-3 py-2.5 rounded-xl text-xs bg-stone-100 border border-stone-200 text-stone-700 font-mono"
                  >
                    <option value="">-- اختر من الغرف --</option>
                    {physicalRooms.map(pr => (
                      <option key={pr.roomNumber} value={pr.roomNumber}>
                        غرفة {pr.roomNumber} ({pr.roomTypeName})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-[11px] text-stone-500">
                اترك الحقل فارغاً لنقل الحجز إلى قائمة "بانتظار التسكين".
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
              {activeBooking.guestPhone && (
                <a
                  href={`https://wa.me/${activeBooking.guestPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`السلام عليكم ${activeBooking.guestName}، بخصوص حجزكم في ${activeBooking.hotelName}...`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>تواصل واتساب</span>
                </a>
              )}

              <div className="flex items-center gap-2 mr-auto">
                <button
                  type="button"
                  onClick={() => setActiveBooking(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoomAssignment}
                  disabled={isUpdatingAllocation}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C9A24B] hover:bg-[#B38A34] text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isUpdatingAllocation ? 'جارٍ الحفظ...' : 'حفظ التسكين ✓'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
