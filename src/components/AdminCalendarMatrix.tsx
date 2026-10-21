import React, { useState, useMemo } from 'react';
import { Hotel, RoomTypeItem, HotelPricingPeriod } from '../types';
import { 
  savePricingPeriodToDb, 
  deletePricingPeriodFromDb 
} from '../services/bookingService';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Edit3, 
  Zap, 
  Plus, 
  Check, 
  X, 
  SlidersHorizontal, 
  Layers, 
  Sparkles,
  Info,
  DollarSign,
  BedDouble,
  ShieldCheck,
  Building2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface AdminCalendarMatrixProps {
  hotel: Hotel;
  rooms: RoomTypeItem[];
  pricingPeriods: HotelPricingPeriod[];
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshData: () => Promise<void>;
}

export const AdminCalendarMatrix: React.FC<AdminCalendarMatrixProps> = ({
  hotel,
  rooms,
  pricingPeriods,
  onShowToast,
  onRefreshData
}) => {
  // Start date for the matrix window (default: today)
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Window length: 14 days or 30 days
  const [daysCount, setDaysCount] = useState<number>(14);

  // Quick Inline Edit State
  const [editingCell, setEditingCell] = useState<{
    roomId: string;
    dateStr: string;
    price: number;
    allotment: number;
  } | null>(null);

  // Bulk Update Modal State
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkFromDate, setBulkFromDate] = useState<string>(() => startDateStr);
  const [bulkToDate, setBulkToDate] = useState<string>(() => {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [bulkRoomIds, setBulkRoomIds] = useState<string[]>(['all']);
  const [bulkPrice, setBulkPrice] = useState<number>(500);
  const [bulkAllotment, setBulkAllotment] = useState<number>(5);
  const [bulkStopSell, setBulkStopSell] = useState<boolean>(false);
  const [bulkPeriodName, setBulkPeriodName] = useState<string>('تسعير خاص للفترة');
  const [isBulkApplying, setIsBulkApplying] = useState<boolean>(false);

  // Hotel isolated pricing periods
  const hotelPeriods = useMemo(() => {
    return pricingPeriods.filter(p => p.hotelId === hotel.id && p.isActive !== false);
  }, [pricingPeriods, hotel.id]);

  // Generate Date Columns
  const dateColumns = useMemo(() => {
    const cols: Array<{
      dateStr: string;
      dayNameAr: string;
      dayNumber: number;
      monthNameAr: string;
      isWeekend: boolean;
      isToday: boolean;
    }> = [];

    const base = new Date(startDateStr);
    const todayStr = new Date().toISOString().split('T')[0];
    const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthNamesAr = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    for (let i = 0; i < daysCount; i++) {
      const cur = new Date(base.getTime() + i * 86400000);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const dayIdx = cur.getDay();

      cols.push({
        dateStr,
        dayNameAr: dayNamesAr[dayIdx],
        dayNumber: cur.getDate(),
        monthNameAr: monthNamesAr[cur.getMonth()],
        isWeekend: dayIdx === 5 || dayIdx === 6, // Friday / Saturday
        isToday: dateStr === todayStr
      });
    }

    return cols;
  }, [startDateStr, daysCount]);

  // Shift start date by N days
  const handleShiftDays = (delta: number) => {
    const base = new Date(startDateStr);
    base.setDate(base.getDate() + delta);
    setStartDateStr(base.toISOString().split('T')[0]);
  };

  // Jump to specific preset date
  const handleJumpPreset = (preset: 'today' | 'nextWeek' | 'nextMonth') => {
    const now = new Date();
    if (preset === 'today') {
      setStartDateStr(now.toISOString().split('T')[0]);
    } else if (preset === 'nextWeek') {
      now.setDate(now.getDate() + 7);
      setStartDateStr(now.toISOString().split('T')[0]);
    } else if (preset === 'nextMonth') {
      now.setMonth(now.getMonth() + 1);
      setStartDateStr(now.toISOString().split('T')[0]);
    }
  };

  // Helper to compute room rate and availability for a specific day
  const getCellData = (room: RoomTypeItem, dateStr: string) => {
    // 1. Find matching period
    const matchingPeriod = hotelPeriods.find(p => {
      if (dateStr < p.startDate || dateStr > p.endDate) return false;
      if (p.roomTypeId === 'all' || !p.roomTypeId) return true;
      if (p.roomTypeId === room.id) return true;
      if (p.roomTypeIds && p.roomTypeIds.includes(room.id)) return true;
      return false;
    });

    let price = room.basePrice || 350;
    let allotment = room.availableRooms || room.totalRooms || 5;
    let isStopSell = false;
    let periodName = 'الافتراضي';
    let matchingPeriodId: string | undefined = undefined;

    if (matchingPeriod) {
      matchingPeriodId = matchingPeriod.id;
      price = matchingPeriod.roomOnlyPrice;
      periodName = matchingPeriod.name;
      if (matchingPeriod.roomDistribution && typeof matchingPeriod.roomDistribution[room.id] === 'number') {
        allotment = matchingPeriod.roomDistribution[room.id];
      } else if (typeof matchingPeriod.availableRooms === 'number') {
        allotment = matchingPeriod.availableRooms;
      }
      isStopSell = matchingPeriod.isAvailable === false;
    } else if (hotelPeriods.length > 0) {
      // No period configured for this specific day -> Closed/Stop-sell
      isStopSell = true;
      price = room.basePrice || 350;
    }

    return {
      price,
      allotment,
      isStopSell,
      periodName,
      matchingPeriodId
    };
  };

  // 1-Click Stop-Sell Toggle for a specific Room & Date
  const handleToggleStopSell = async (room: RoomTypeItem, dateStr: string) => {
    const cell = getCellData(room, dateStr);
    const newStopSell = !cell.isStopSell;

    try {
      const periodId = cell.matchingPeriodId || `sp_${room.id}_${dateStr}_${Date.now().toString(36)}`;
      const updatedPeriod: HotelPricingPeriod = {
        id: periodId,
        hotelId: hotel.id,
        name: newStopSell ? `إيقاف بيع ${room.name} (${dateStr})` : `إتاحة ${room.name} (${dateStr})`,
        startDate: dateStr,
        endDate: dateStr,
        roomTypeId: room.id,
        roomTypeIds: [room.id],
        roomOnlyPrice: cell.price,
        breakfastPrice: cell.price + 45,
        halfBoardPrice: cell.price + 95,
        fullBoardPrice: cell.price + 140,
        availableRooms: cell.allotment,
        isAvailable: !newStopSell,
        isActive: true,
        isDefault: false
      };

      await savePricingPeriodToDb(updatedPeriod, hotel.id);
      await onRefreshData();
      onShowToast(newStopSell ? `تم إيقاف البيع 🔒 لـ ${room.name} بتاريخ ${dateStr}` : `تم فتح البيع 🟢 لـ ${room.name} بتاريخ ${dateStr}`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('فشل تعديل حالة إيقاف البيع', 'error');
    }
  };

  // 1-Click Stop-Sell for Entire Column (Day)
  const handleToggleDayStopSell = async (dateStr: string, shouldClose: boolean) => {
    try {
      const periodId = `day_lock_${dateStr}_${Date.now().toString(36)}`;
      const updatedPeriod: HotelPricingPeriod = {
        id: periodId,
        hotelId: hotel.id,
        name: shouldClose ? `إغلاق شامل لكافة الغرف (${dateStr})` : `فتح شامل لكافة الغرف (${dateStr})`,
        startDate: dateStr,
        endDate: dateStr,
        roomTypeId: 'all',
        roomOnlyPrice: 500,
        availableRooms: 5,
        isAvailable: !shouldClose,
        isActive: true,
        isDefault: false
      };

      await savePricingPeriodToDb(updatedPeriod, hotel.id);
      await onRefreshData();
      onShowToast(shouldClose ? `تم إغلاق الفندق بالكامل 🔒 في تاريخ ${dateStr}` : `تم فتح حجز الفندق بالكامل 🟢 في تاريخ ${dateStr}`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('فشل تحديث إتاحة اليوم', 'error');
    }
  };

  // Save Inline Quick Edit
  const handleSaveInlineEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell) return;

    const room = rooms.find(r => r.id === editingCell.roomId);
    if (!room) return;

    try {
      const existingCell = getCellData(room, editingCell.dateStr);
      const periodId = existingCell.matchingPeriodId || `sp_${room.id}_${editingCell.dateStr}_${Date.now().toString(36)}`;

      const updatedPeriod: HotelPricingPeriod = {
        id: periodId,
        hotelId: hotel.id,
        name: `تسعير مخصص (${room.name} - ${editingCell.dateStr})`,
        startDate: editingCell.dateStr,
        endDate: editingCell.dateStr,
        roomTypeId: room.id,
        roomTypeIds: [room.id],
        roomOnlyPrice: Number(editingCell.price) || room.basePrice,
        breakfastPrice: (Number(editingCell.price) || room.basePrice) + 45,
        halfBoardPrice: (Number(editingCell.price) || room.basePrice) + 95,
        fullBoardPrice: (Number(editingCell.price) || room.basePrice) + 140,
        availableRooms: Number(editingCell.allotment) || 5,
        isAvailable: true,
        isActive: true,
        isDefault: false
      };

      await savePricingPeriodToDb(updatedPeriod, hotel.id);
      await onRefreshData();
      onShowToast(`تم تحديث سعر وإتاحة ${room.name} ليوم ${editingCell.dateStr} بنجاح ✓`, 'success');
      setEditingCell(null);
    } catch (err) {
      console.error(err);
      onShowToast('فشل حفظ التعديل السريع', 'error');
    }
  };

  // Apply Bulk Range Update
  const handleApplyBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkFromDate || !bulkToDate || bulkFromDate > bulkToDate) {
      onShowToast('يرجى التأكد من صحة نطاق التواريخ', 'error');
      return;
    }

    setIsBulkApplying(true);
    try {
      const isAllRooms = bulkRoomIds.includes('all');
      const targetRoomId = isAllRooms ? 'all' : (bulkRoomIds[0] || 'all');
      const targetRoomIds = isAllRooms ? rooms.map(r => r.id) : bulkRoomIds;

      const newPeriodId = `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newPeriod: HotelPricingPeriod = {
        id: newPeriodId,
        hotelId: hotel.id,
        name: bulkPeriodName.trim() || `تحديث جماعي (${bulkFromDate} إلى ${bulkToDate})`,
        startDate: bulkFromDate,
        endDate: bulkToDate,
        roomTypeId: targetRoomId,
        roomTypeIds: targetRoomIds,
        roomOnlyPrice: Number(bulkPrice) || 500,
        breakfastPrice: Number(bulkPrice) + 45,
        halfBoardPrice: Number(bulkPrice) + 95,
        fullBoardPrice: Number(bulkPrice) + 140,
        availableRooms: Number(bulkAllotment) || 5,
        isAvailable: !bulkStopSell,
        isActive: true,
        isDefault: false
      };

      await savePricingPeriodToDb(newPeriod, hotel.id);
      await onRefreshData();
      onShowToast(`تم تطبيق التحديث الجماعي للفترة (${bulkFromDate} إلى ${bulkToDate}) بنجاح!`, 'success');
      setShowBulkModal(false);
    } catch (err: any) {
      console.error('Bulk update error:', err);
      onShowToast(`فشل تطبيق التحديث الجماعي: ${err.message || 'خطأ'}`, 'error');
    } finally {
      setIsBulkApplying(false);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Control & Date Range Navigation Bar */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Window Navigator */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 shadow-2xs">
            <button
              type="button"
              onClick={() => handleShiftDays(-daysCount)}
              className="p-2 rounded-xl bg-white hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer shadow-2xs"
              title={`الرجوع ${daysCount} يوماً`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleShiftDays(daysCount)}
              className="p-2 rounded-xl bg-white hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer shadow-2xs"
              title={`التقدم ${daysCount} يوماً`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-700">بدءاً من:</span>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => handleJumpPreset('today')}
              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => handleJumpPreset('nextWeek')}
              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
            >
              الأسبوع القادم
            </button>
            <button
              type="button"
              onClick={() => handleJumpPreset('nextMonth')}
              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
            >
              الشهر القادم
            </button>
          </div>
        </div>

        {/* Right: Days mode switcher & Bulk Update CTA */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* 14 vs 30 Days view */}
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setDaysCount(14)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                daysCount === 14 ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              14 يوماً
            </button>
            <button
              type="button"
              onClick={() => setDaysCount(30)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                daysCount === 30 ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              30 يوماً (شهر كامل)
            </button>
          </div>

          {/* Bulk Update Button */}
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-stone-900 to-stone-800 hover:from-[#B38A34] hover:to-[#C9A24B] text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-stone-900/15 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-3.5 h-3.5 text-[#E0C070]" />
            <span>⚡ تسعير وإغلاق جماعي لفترة (Bulk Update)</span>
          </button>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-900">
          <Info className="w-4 h-4 text-amber-800 shrink-0" />
          <span>
            <strong>نظام Yield Management الفندقي المباشر:</strong> انقر على أي خانة لتعديل السعر أو الإتاحة، أو اضغط 🔒 لإيقاف البيع الفوري (Stop-Sell).
          </span>
        </div>
        <span className="text-[11px] text-amber-800 font-bold shrink-0 hidden md:inline">
          {rooms.length} فئات غرف معرّفة
        </span>
      </div>

      {/* MATRIX TABLE (Booking.com style) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-right border-collapse select-none min-w-[1000px]">
            <thead>
              {/* Row 1: Header Dates */}
              <tr className="bg-stone-900 text-white text-xs sticky top-0 z-30">
                <th className="p-3.5 w-60 min-w-[240px] sticky right-0 bg-stone-900 z-40 border-l border-stone-800 shadow-md">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-[#E0C070]" />
                    <span className="font-bold">فئة الغرفة / التواريخ</span>
                  </div>
                </th>

                {dateColumns.map(col => (
                  <th
                    key={col.dateStr}
                    className={`p-2 text-center border-l border-stone-800 min-w-[105px] ${
                      col.isToday
                        ? 'bg-amber-950/80 text-[#E0C070] ring-1 ring-amber-400/40'
                        : col.isWeekend
                        ? 'bg-stone-850'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-stone-400 font-normal">{col.dayNameAr}</span>
                      <span className="text-sm font-black font-mono mt-0.5">{col.dayNumber}</span>
                      <span className="text-[9px] text-stone-400">{col.monthNameAr}</span>
                    </div>
                  </th>
                ))}
              </tr>

              {/* Row 2: Master Stop-Sell for Entire Day */}
              <tr className="bg-stone-100 text-stone-700 text-[11px] border-b border-stone-200">
                <th className="p-2.5 sticky right-0 bg-stone-100 z-20 border-l border-stone-200 font-bold text-stone-800">
                  <div className="flex items-center justify-between">
                    <span>🔒 إيقاف بيع اليوم بالكامل (Master Stop):</span>
                  </div>
                </th>

                {dateColumns.map(col => (
                  <td key={col.dateStr} className="p-1.5 text-center border-l border-stone-200">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleDayStopSell(col.dateStr, true)}
                        className="p-1 rounded-md bg-red-100 hover:bg-red-200 text-red-700 transition-colors cursor-pointer"
                        title="إغلاق حجز الفندق بالكامل لهذا اليوم"
                      >
                        <Lock className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDayStopSell(col.dateStr, false)}
                        className="p-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors cursor-pointer"
                        title="فتح حجز الفندق بالكامل لهذا اليوم"
                      >
                        <Unlock className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200 text-xs font-cairo">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-stone-50/70 transition-colors">
                  {/* Sticky Room Info Cell */}
                  <td className="p-3 sticky right-0 bg-white hover:bg-stone-50 z-20 border-l border-stone-200 shadow-xs">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5 truncate">
                        <span className={`w-2 h-2 rounded-full ${room.status === 'available' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span>{room.name}</span>
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-500">
                        <span>الأساس: <strong>{room.basePrice} ر.س</strong></span>
                        <span>• السعة: <strong>{room.availableRooms || 5} غرف</strong></span>
                      </div>
                    </div>
                  </td>

                  {/* Day Cells */}
                  {dateColumns.map(col => {
                    const cell = getCellData(room, col.dateStr);
                    const isEditing = editingCell?.roomId === room.id && editingCell?.dateStr === col.dateStr;

                    return (
                      <td
                        key={col.dateStr}
                        className={`p-2 border-l border-stone-100 transition-all ${
                          cell.isStopSell
                            ? 'bg-red-50/70'
                            : col.isWeekend
                            ? 'bg-stone-50/50'
                            : 'bg-white'
                        }`}
                      >
                        {isEditing ? (
                          /* Quick Edit Input Form */
                          <form onSubmit={handleSaveInlineEdit} className="p-1.5 rounded-xl bg-amber-50 border border-amber-300 shadow-md space-y-1">
                            <div>
                              <span className="text-[9px] text-stone-500 block">السعر:</span>
                              <input
                                type="number"
                                min={1}
                                value={editingCell.price}
                                onChange={(e) => setEditingCell(prev => prev ? { ...prev, price: Math.max(1, parseInt(e.target.value) || 0) } : null)}
                                className="w-full px-1.5 py-0.5 rounded bg-white border border-amber-300 text-xs font-bold text-center"
                                autoFocus
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-stone-500 block">الغرف:</span>
                              <input
                                type="number"
                                min={0}
                                max={50}
                                value={editingCell.allotment}
                                onChange={(e) => setEditingCell(prev => prev ? { ...prev, allotment: Math.max(0, parseInt(e.target.value) || 0) } : null)}
                                className="w-full px-1.5 py-0.5 rounded bg-white border border-amber-300 text-xs font-bold text-center"
                              />
                            </div>
                            <div className="flex items-center justify-center gap-1 pt-1">
                              <button
                                type="submit"
                                className="p-1 rounded bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                                title="حفظ التعديل"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCell(null)}
                                className="p-1 rounded bg-stone-300 text-stone-700 text-[10px] cursor-pointer"
                                title="إلغاء"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* Standard Matrix Cell */
                          <div
                            onDoubleClick={() => setEditingCell({
                              roomId: room.id,
                              dateStr: col.dateStr,
                              price: cell.price,
                              allotment: cell.allotment
                            })}
                            className={`p-1.5 rounded-xl border transition-all flex flex-col items-center justify-between text-center min-h-[68px] ${
                              cell.isStopSell
                                ? 'border-red-200 bg-red-100/60 text-red-900'
                                : 'border-stone-200 hover:border-[#C9A24B] hover:shadow-2xs cursor-pointer'
                            }`}
                            title={`انقر مرتين لتعديل السعر والإتاحة\nالفترة: ${cell.periodName}`}
                          >
                            {/* Price Pill */}
                            <div className="flex items-center justify-between w-full">
                              <span className="font-extrabold text-xs font-mono font-cairo">
                                {cell.price} <span className="text-[9px] font-normal">ر.س</span>
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStopSell(room, col.dateStr);
                                }}
                                className={`p-0.5 rounded transition-colors cursor-pointer ${
                                  cell.isStopSell
                                    ? 'text-red-700 hover:bg-red-200'
                                    : 'text-stone-400 hover:text-stone-800'
                                }`}
                                title={cell.isStopSell ? 'إلغاء إيقاف البيع وفتح الغرفة' : 'إيقاف البيع الفوري (Stop-Sell)'}
                              >
                                {cell.isStopSell ? <Lock className="w-3 h-3 text-red-600" /> : <Unlock className="w-3 h-3 opacity-40 hover:opacity-100" />}
                              </button>
                            </div>

                            {/* Allotment & Quick Edit Button */}
                            <div className="flex items-center justify-between w-full mt-1 pt-1 border-t border-stone-200/60">
                              <span className={`text-[10px] font-bold ${cell.allotment <= 2 ? 'text-red-700' : 'text-stone-600'}`}>
                                {cell.isStopSell ? 'مغلق 🔒' : `${cell.allotment} غرف`}
                              </span>

                              <button
                                type="button"
                                onClick={() => setEditingCell({
                                  roomId: room.id,
                                  dateStr: col.dateStr,
                                  price: cell.price,
                                  allotment: cell.allotment
                                })}
                                className="p-0.5 rounded text-stone-400 hover:text-[#B38A34] hover:bg-amber-50 transition-colors"
                                title="تعديل سريع"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BULK UPDATE MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/20 flex items-center justify-center text-[#E0C070]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-sm text-white">تحديث جماعي لفترة (Bulk Update)</h3>
                  <p className="text-[11px] text-stone-400">تطبيق السعر والإتاحة وإيقاف البيع على نطاق زمني دفعة واحدة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleApplyBulkUpdate} className="p-5 space-y-4 text-xs font-cairo">
              <div>
                <label className="font-bold text-stone-700 block mb-1">اسم الفترة / الموسم:</label>
                <input
                  type="text"
                  value={bulkPeriodName}
                  onChange={(e) => setBulkPeriodName(e.target.value)}
                  placeholder="مثال: العشر الأواخر من رمضان، إجازة الربيع..."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">من تاريخ:</label>
                  <input
                    type="date"
                    value={bulkFromDate}
                    onChange={(e) => setBulkFromDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">إلى تاريخ:</label>
                  <input
                    type="date"
                    value={bulkToDate}
                    min={bulkFromDate}
                    onChange={(e) => setBulkToDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">فئات الغرف المشمولة:</label>
                <select
                  value={bulkRoomIds[0] || 'all'}
                  onChange={(e) => setBulkRoomIds([e.target.value])}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                >
                  <option value="all">⭐ تطبيق على كافة أنواع الغرف بالفندق</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">سعر الليلة الموحد (ر.س):</label>
                  <input
                    type="number"
                    min={1}
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">عدد الغرف المتاحة (Allotment):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={bulkAllotment}
                    onChange={(e) => setBulkAllotment(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                    required
                  />
                </div>
              </div>

              {/* Stop-Sell Toggle */}
              <div className="p-3 rounded-xl bg-red-50/80 border border-red-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-red-900 block">إيقاف البيع الفوري (Stop-Sell):</span>
                  <span className="text-[10px] text-red-700">إغلاق الحجز لكافة أيام هذه الفترة في الموقع</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBulkStopSell(!bulkStopSell)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                    bulkStopSell
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-300'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{bulkStopSell ? 'مغلق 🔒' : 'مفتوح 🟢'}</span>
                </button>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isBulkApplying}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#C9A24B] hover:to-[#DFBE72] text-white font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isBulkApplying ? 'جاري التطبيق...' : 'تطبيق التحديث على كافة الأيام ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
