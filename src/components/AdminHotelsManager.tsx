import React, { useState, useEffect, useMemo } from 'react';
import { 
  Hotel, 
  AdminUser, 
  AdminRole,
  RoomTypeItem 
} from '../types';
import { hasPermission } from '../utils/rbac';
import { getRoomsFromDb } from '../services/bookingService';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  Plus, 
  Images, 
  ExternalLink, 
  BedDouble, 
  Star, 
  MapPin, 
  Building2, 
  SlidersHorizontal, 
  Download, 
  ChevronRight, 
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Check,
  RotateCcw,
  Clock,
  Sparkles,
  Footprints,
  Tag,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { WhatsAppIcon } from './BookingIcons';

export interface AdminHotelsManagerProps {
  hotels: Hotel[];
  currentUser: AdminUser | null;
  adminRoles: AdminRole[];
  onOpenAddHotel: () => void;
  onEditHotel: (hotel: Hotel) => void;
  onDeleteHotel: (hotel: Hotel) => void;
  onOpenAlbum: (hotel: Hotel) => void;
  onToggleActive: (hotel: Hotel) => Promise<void> | void;
  onToggleOnlineBooking: (hotel: Hotel) => Promise<void> | void;
  onToggleFeatured?: (hotel: Hotel) => Promise<void> | void;
  onToggleDistanceBadge?: (hotel: Hotel) => Promise<void> | void;
  onToggleStarsBadge?: (hotel: Hotel) => Promise<void> | void;
  onToggleCategoriesBadge?: (hotel: Hotel) => Promise<void> | void;
  onBulkToggleDistanceBadge?: (targetStatus: boolean, filterCity?: string) => Promise<void> | void;
  onMoveOrder: (id: string, dir: 'up' | 'down') => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type SortField = 'order' | 'name' | 'city' | 'stars' | 'status' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface ColumnVisibility {
  thumbnail: boolean;
  name: boolean;
  city: boolean;
  branch: boolean;
  stars: boolean;
  categories: boolean;
  status: boolean;
  roomsSummary: boolean;
  lastUpdated: boolean;
  actions: boolean;
}

const DEFAULT_COLUMNS: ColumnVisibility = {
  thumbnail: true,
  name: true,
  city: true,
  branch: true,
  stars: true,
  categories: true,
  status: true,
  roomsSummary: true,
  lastUpdated: true,
  actions: true
};

export const AdminHotelsManager: React.FC<AdminHotelsManagerProps> = ({
  hotels,
  currentUser,
  adminRoles,
  onOpenAddHotel,
  onEditHotel,
  onDeleteHotel,
  onOpenAlbum,
  onToggleActive,
  onToggleOnlineBooking,
  onToggleFeatured,
  onToggleDistanceBadge,
  onToggleStarsBadge,
  onToggleCategoriesBadge,
  onBulkToggleDistanceBadge,
  onMoveOrder,
  onShowToast
}) => {
  // Distance Tool Bulk Modal State
  const [showDistanceToolModal, setShowDistanceToolModal] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<'all' | 'مكة المكرمة' | 'المدينة المنورة'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'online' | 'whatsapp'>('all');
  const [starsFilter, setStarsFilter] = useState<'all' | '3' | '4' | '5'>('all');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Column Visibility Toggle State (Persistent in localStorage)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    try {
      const saved = localStorage.getItem('admin_hotels_column_visibility');
      if (saved) return { ...DEFAULT_COLUMNS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_COLUMNS;
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Rooms and Allotment Summary cache per hotel
  const [hotelRoomsMap, setHotelRoomsMap] = useState<Record<string, RoomTypeItem[]>>({});
  const [isWideMode, setIsWideMode] = useState(false);

  useEffect(() => {
    getRoomsFromDb().then((allRooms) => {
      const map: Record<string, RoomTypeItem[]> = {};
      allRooms.forEach(room => {
        if (!map[room.hotelId]) map[room.hotelId] = [];
        map[room.hotelId].push(room);
      });
      setHotelRoomsMap(map);
    }).catch(() => {});
  }, [hotels]);

  const toggleColumn = (key: keyof ColumnVisibility) => {
    setColumnVisibility(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('admin_hotels_column_visibility', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Distance Badge Global Statistics
  const hotelsWithDistanceVisible = useMemo(() => {
    return hotels.filter(h => h.showDistanceBadge !== false && h.showTransportInfo !== false).length;
  }, [hotels]);
  const hotelsWithDistanceHidden = hotels.length - hotelsWithDistanceVisible;

  // Filtered & Sorted Hotels
  const processedHotels = useMemo(() => {
    let result = hotels.filter(h => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        h.name.toLowerCase().includes(q) ||
        (h.nameEn && h.nameEn.toLowerCase().includes(q)) ||
        h.city.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. City Filter
      if (cityFilter !== 'all' && h.city !== cityFilter) return false;

      // 3. Status Filter
      if (statusFilter === 'active' && h.isActive === false) return false;
      if (statusFilter === 'hidden' && h.isActive !== false) return false;
      if (statusFilter === 'online' && h.onlineBookingEnabled !== true) return false;
      if (statusFilter === 'whatsapp' && h.onlineBookingEnabled === true) return false;

      // 4. Stars Filter
      if (starsFilter !== 'all' && h.stars !== Number(starsFilter)) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let valA: any = a[sortField as keyof Hotel];
      let valB: any = b[sortField as keyof Hotel];

      if (sortField === 'order') {
        valA = a.order ?? 999;
        valB = b.order ?? 999;
      } else if (sortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortField === 'city') {
        valA = a.city;
        valB = b.city;
      } else if (sortField === 'stars') {
        valA = a.stars || 0;
        valB = b.stars || 0;
      } else if (sortField === 'status') {
        valA = a.isActive !== false ? 1 : 0;
        valB = b.isActive !== false ? 1 : 0;
      } else if (sortField === 'updatedAt') {
        valA = a.createdAt || 0;
        valB = b.createdAt || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [hotels, searchQuery, cityFilter, statusFilter, starsFilter, sortField, sortDirection]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, cityFilter, statusFilter, starsFilter, pageSize]);

  // Pagination Slice
  const totalItems = processedHotels.length;
  const totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;
  const paginatedHotels = useMemo(() => {
    if (pageSize <= 0) return processedHotels;
    const start = (currentPage - 1) * pageSize;
    return processedHotels.slice(start, start + pageSize);
  }, [processedHotels, currentPage, pageSize]);

  // Export Filtered Hotels to CSV
  const handleExportCSV = () => {
    if (!hasPermission(currentUser, adminRoles, 'hotels', 'export')) {
      onShowToast('ليس لديك صلاحية تصدير بيانات الفنادق', 'error');
      return;
    }

    const headers = [
      'الترتيب',
      'اسم الفندق بالعربية',
      'اسم الفندق بالإنجليزية',
      'المدينة',
      'الفرع والحي',
      'النجوم',
      'حالة الظهور',
      'نمط الحجز',
      'فئات الغرف',
      'إجمالي الغرف المتاحة',
      'المسافة عن الحرم',
      'التقييم',
      'عدد المراجعات'
    ];

    const rows = processedHotels.map((h, i) => {
      const rooms = hotelRoomsMap[h.id] || [];
      const totalAvail = rooms.reduce((s, r) => s + (r.availableRooms || 0), 0);
      return [
        h.order ?? (i + 1),
        `"${h.name.replace(/"/g, '""')}"`,
        `"${(h.nameEn || '').replace(/"/g, '""')}"`,
        `"${h.city}"`,
        `"${h.district}"`,
        h.stars,
        h.isActive !== false ? 'مفعل' : 'مخفي',
        h.onlineBookingEnabled === true ? 'أونلاين' : 'واتساب فقط',
        rooms.length,
        totalAvail,
        `"${h.distanceText || ''}"`,
        h.rating,
        h.reviewCount
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prestige_hotels_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('تم تصدير قائمة الفنادق بنجاح بصيغة CSV (Excel)');
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-stone-300" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-[#B38A34]" /> 
      : <ArrowDown className="w-3 h-3 text-[#B38A34]" />;
  };

  return (
    <div 
      id="admin-hotels-section" 
      className={`bg-white rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4 transition-all duration-300 ${
        isWideMode 
          ? 'w-full lg:-mx-8 xl:-mx-20 lg:w-[calc(100%+4rem)] xl:w-[calc(100%+10rem)] max-w-none z-10 relative' 
          : 'w-full'
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-cairo font-bold text-stone-900">قائمة الفنادق المعتمدة</h2>
              <p className="text-xs text-stone-500">
                إدارة {hotels.length} فندقاً معتمد بمكة المكرمة والمدينة المنورة مع التحكم الكامل بالتوفر والأسعار.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          {/* Widescreen Full-Width Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsWideMode(!isWideMode)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isWideMode 
                ? 'bg-[#C9A24B] text-white ring-2 ring-[#C9A24B]/30' 
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
            title={isWideMode ? 'العودة للعرض العادي' : 'توسيع الجدول وعرض لاين كامل بدون سحب أو تمرير'}
          >
            {isWideMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-[#B38A34]" />}
            <span>{isWideMode ? 'العرض العادي' : 'توسيع لاين كامل ↔'}</span>
          </button>

          {/* Export Button (Permission Controlled) */}
          {hasPermission(currentUser, adminRoles, 'hotels', 'export') && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="تصدير النتائج المعروضة إلى ملف CSV / Excel"
            >
              <Download className="w-3.5 h-3.5 text-[#B38A34]" />
              <span>تصدير Excel/CSV</span>
            </button>
          )}

          {/* Global Distance Counter Bulk Tool */}
          {onBulkToggleDistanceBadge && (
            <button
              type="button"
              onClick={() => setShowDistanceToolModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-stone-900 border border-[#C9A24B]/50 hover:border-[#C9A24B] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group"
              title="أداة التحكم الشامل بعداد ودقائق السير لجميع الفنادق دفعة واحدة"
            >
              <Footprints className="w-4 h-4 text-[#B38A34] group-hover:scale-110 transition-transform" />
              <span>أداة عداد السير</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#C9A24B]/20 text-[10px] text-[#8C6B1C] font-black">
                {hotelsWithDistanceVisible} ظاهر / {hotelsWithDistanceHidden} مخفي
              </span>
            </button>
          )}

          {/* Add Hotel Button (Permission Controlled) */}
          {hasPermission(currentUser, adminRoles, 'hotels', 'create') && (
            <button
              id="admin-add-hotel-btn"
              type="button"
              onClick={onOpenAddHotel}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38A34] hover:from-[#B38A34] hover:to-[#9E782B] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة فندق جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Search, Filters & Column Visibility Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الفندق، المدينة، أو الحي والفرع..."
            className="w-full px-3.5 py-2 pr-9 pl-8 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute top-2.5 right-3 pointer-events-none" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute top-2.5 left-3 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
          >
            <option value="all">كل المدن (مكة والمدينة)</option>
            <option value="مكة المكرمة">🕋 مكة المكرمة</option>
            <option value="المدينة المنورة">🕌 المدينة المنورة</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
          >
            <option value="all">كل الحالات (المعروض والمخفي)</option>
            <option value="active">مفعل (ظاهر للزوار)</option>
            <option value="hidden">مخفي من الموقع</option>
            <option value="online">حجز أونلاين مباشر</option>
            <option value="whatsapp">حجز واتساب فقط</option>
          </select>

          {/* Stars Filter */}
          <select
            value={starsFilter}
            onChange={(e) => setStarsFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
          >
            <option value="all">جميع النجوم</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 نجوم</option>
            <option value="4">⭐⭐⭐⭐ 4 نجوم</option>
            <option value="3">⭐⭐⭐ 3 نجوم</option>
          </select>

          {/* Column Visibility Dropdown Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="px-3 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-xs font-bold text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="تخصيص وإظهار/إخفاء الأعمدة في الجدول"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#B38A34]" />
              <span>الأعمدة</span>
            </button>

            {showColumnDropdown && (
              <div 
                className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 p-3 z-30 space-y-1.5 animate-fadeIn text-xs"
                dir="rtl"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-100 font-bold text-stone-800 text-[11px]">
                  <span>إظهار وإخفاء الأعمدة:</span>
                  <button 
                    onClick={() => setColumnVisibility(DEFAULT_COLUMNS)}
                    className="text-[10px] text-[#B38A34] hover:underline"
                  >
                    استعادة الكل
                  </button>
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
                  {[
                    { key: 'thumbnail', label: 'صورة الفندق (Thumbnail)' },
                    { key: 'name', label: 'اسم الفندق' },
                    { key: 'city', label: 'المدينة' },
                    { key: 'branch', label: 'الفرع والحي' },
                    { key: 'stars', label: 'النجوم والتصنيف' },
                    { key: 'categories', label: 'نوع الفندق والتصنيفات (عمرة، رمضان، سنوي)' },
                    { key: 'status', label: 'الحالة ونمط الحجز وشارات العرض' },
                    { key: 'roomsSummary', label: 'ملخص الغرف والتوفر' },
                    { key: 'lastUpdated', label: 'آخر تحديث' },
                    { key: 'actions', label: 'الإجراءات' }
                  ].map(({ key, label }) => {
                    const colKey = key as keyof ColumnVisibility;
                    return (
                      <label 
                        key={key} 
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-50 cursor-pointer select-none text-stone-700"
                      >
                        <span>{label}</span>
                        <input
                          type="checkbox"
                          checked={columnVisibility[colKey]}
                          onChange={() => toggleColumn(colKey)}
                          className="w-3.5 h-3.5 rounded text-[#C9A24B] focus:ring-[#C9A24B] cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Fast Responsive Table */}
      <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
        {paginatedHotels.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Building2 className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">لا توجد فنادق مطابقة للبحث</h3>
            <p className="text-xs text-stone-500">جرب تعديل كلمة البحث أو تصفية المدن والحالات لعرض الفنادق.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCityFilter('all');
                setStatusFilter('all');
                setStarsFilter('all');
              }}
              className="mt-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-right text-xs table-auto">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                <tr>
                  <th className="py-2.5 px-1.5 text-center w-10 whitespace-nowrap">
                    <span 
                      onClick={() => handleSort('order')} 
                      className="cursor-pointer inline-flex items-center gap-0.5 hover:text-[#B38A34]"
                      title="ترتيب الظهور"
                    >
                      # {getSortIcon('order')}
                    </span>
                  </th>

                  {columnVisibility.thumbnail && (
                    <th className="py-2.5 px-1.5 text-center w-12 whitespace-nowrap">الصورة</th>
                  )}

                  {columnVisibility.name && (
                    <th className="py-2.5 px-2 min-w-[150px]">
                      <span 
                        onClick={() => handleSort('name')} 
                        className="cursor-pointer inline-flex items-center gap-1 hover:text-[#B38A34]"
                      >
                        الفندق {getSortIcon('name')}
                      </span>
                    </th>
                  )}

                  {columnVisibility.city && (
                    <th className="py-2.5 px-2 whitespace-nowrap w-24">
                      <span 
                        onClick={() => handleSort('city')} 
                        className="cursor-pointer inline-flex items-center gap-1 hover:text-[#B38A34]"
                      >
                        المدينة {getSortIcon('city')}
                      </span>
                    </th>
                  )}

                  {columnVisibility.branch && (
                    <th className="py-2.5 px-2 whitespace-nowrap w-28">الفرع والحي</th>
                  )}

                  {columnVisibility.stars && (
                    <th className="py-2.5 px-1.5 text-center whitespace-nowrap w-24">
                      <span 
                        onClick={() => handleSort('stars')} 
                        className="cursor-pointer inline-flex items-center gap-0.5 hover:text-[#B38A34]"
                      >
                        النجوم {getSortIcon('stars')}
                      </span>
                    </th>
                  )}

                  {columnVisibility.categories && (
                    <th className="py-2.5 px-2 min-w-[130px]">نوع الفندق والتصنيف</th>
                  )}

                  {columnVisibility.status && (
                    <th className="py-2.5 px-2 text-center whitespace-nowrap min-w-[150px]">
                      <span 
                        onClick={() => handleSort('status')} 
                        className="cursor-pointer inline-flex items-center gap-1 hover:text-[#B38A34]"
                      >
                        الحالة ونمط الحجز {getSortIcon('status')}
                      </span>
                    </th>
                  )}

                  {columnVisibility.roomsSummary && (
                    <th className="py-2.5 px-2 whitespace-nowrap w-28">الغرف والتوفر</th>
                  )}

                  {columnVisibility.lastUpdated && (
                    <th className="py-2.5 px-1.5 text-center whitespace-nowrap w-20">
                      <span 
                        onClick={() => handleSort('updatedAt')} 
                        className="cursor-pointer inline-flex items-center gap-0.5 hover:text-[#B38A34]"
                      >
                        التحديث {getSortIcon('updatedAt')}
                      </span>
                    </th>
                  )}

                  {columnVisibility.actions && (
                    <th className="py-2.5 px-2 text-center whitespace-nowrap w-28">الإجراءات</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100 font-semibold text-stone-700">
                {paginatedHotels.map((hotel, index) => {
                  const hotelRooms = hotelRoomsMap[hotel.id] || [];
                  const totalAvailRooms = hotelRooms.reduce((sum, r) => sum + (r.availableRooms || 0), 0);
                  const isMakkah = hotel.city === 'مكة المكرمة';

                  return (
                    <tr 
                      key={hotel.id}
                      className={`hover:bg-amber-50/30 transition-colors ${
                        hotel.isActive === false ? 'bg-stone-50/60 opacity-80' : ''
                      }`}
                    >
                      {/* Order and reorder buttons */}
                      <td className="py-2 px-1 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-0.5 bg-stone-100 px-1.5 py-0.5 rounded-lg border border-stone-200">
                          <span className="font-mono font-bold text-[10px] text-stone-700">
                            #{hotel.order ?? (index + 1)}
                          </span>
                          <div className="flex flex-col -my-0.5">
                            <button
                              type="button"
                              onClick={() => onMoveOrder(hotel.id, 'up')}
                              className="text-stone-400 hover:text-[#B38A34] cursor-pointer p-0.5"
                              title="تقديم ترتيب الفندق لأعلى"
                            >
                              <ChevronUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveOrder(hotel.id, 'down')}
                              className="text-stone-400 hover:text-[#B38A34] cursor-pointer p-0.5"
                              title="تأخير ترتيب الفندق لأسفل"
                            >
                              <ChevronDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Image Thumbnail */}
                      {columnVisibility.thumbnail && (
                        <td className="py-2 px-1 text-center whitespace-nowrap">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-2xs mx-auto">
                            <img 
                              src={hotel.mainImage} 
                              alt={hotel.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                      )}

                      {/* Hotel Name */}
                      {columnVisibility.name && (
                        <td className="py-2 px-2">
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <strong className="text-stone-900 font-bold text-xs truncate max-w-[190px]">
                                {hotel.name}
                              </strong>
                              {hotel.featured && (
                                <span className="text-[9px] bg-[#C9A24B]/15 text-[#B38A34] px-1 py-0.2 rounded font-bold shrink-0">
                                  مميز ★
                                </span>
                              )}
                            </div>
                            {hotel.nameEn && (
                              <span className="text-[10px] text-stone-400 font-medium truncate max-w-[190px]">
                                {hotel.nameEn}
                              </span>
                            )}
                            <div className="flex items-center gap-1 text-[9px] text-stone-500 mt-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                              <span className="font-bold">{hotel.rating || 4.8}</span>
                              <span>({hotel.reviewCount || 0})</span>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* City */}
                      {columnVisibility.city && (
                        <td className="py-2 px-2 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isMakkah 
                              ? 'bg-amber-50 text-amber-900 border border-amber-200' 
                              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          }`}>
                            <span>{isMakkah ? '🕋' : '🕌'}</span>
                            <span>{hotel.city}</span>
                          </span>
                        </td>
                      )}

                      {/* Branch and District */}
                      {columnVisibility.branch && (
                        <td className="py-2 px-2 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-stone-900 font-bold text-[11px]">
                              {isMakkah ? 'فرع مكة' : 'فرع المدينة'}
                            </span>
                            <span className="text-[10px] text-[#B38A34] font-medium flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate max-w-[110px]">حي {hotel.district}</span>
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Stars & Classification */}
                      {columnVisibility.stars && (
                        <td className="py-2 px-1 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="inline-flex items-center justify-center gap-0.5 text-amber-500">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-[11px] font-bold text-stone-800 font-mono">{hotel.stars ?? 5}</span>
                              <span className="text-[10px] text-stone-500">نجوم</span>
                            </div>
                            {onToggleStarsBadge && (
                              <button
                                type="button"
                                onClick={() => onToggleStarsBadge(hotel)}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-bold border transition-all cursor-pointer ${
                                  hotel.showStars !== false
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                    : 'bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200'
                                }`}
                                title={hotel.showStars !== false ? 'النجوم معروضة بالبطاقة (اضغط للإخفاء)' : 'النجوم مخفية بالبطاقة (اضغط للإظهار)'}
                              >
                                <span>{hotel.showStars !== false ? 'ظاهرة' : 'مخفية'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Categories */}
                      {columnVisibility.categories && (() => {
                        const cats = (Array.isArray(hotel.categories) 
                          ? hotel.categories 
                          : (typeof hotel.categories === 'string' ? (hotel.categories as string).split(',') : [])
                        ).map((c: any) => String(c).trim()).filter(Boolean);

                        return (
                          <td className="py-2 px-2">
                            <div className="flex flex-col gap-0.5 items-start">
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {cats.slice(0, 2).map((cat, catIdx) => (
                                  <span
                                    key={`${cat}-${catIdx}`}
                                    className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#EFE6D8]/60 text-stone-800 border border-[#EFE6D8] truncate max-w-[70px]"
                                  >
                                    {cat}
                                  </span>
                                ))}
                                {cats.length > 2 && (
                                  <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-stone-200 text-stone-600">
                                    +{cats.length - 2}
                                  </span>
                                )}
                                {cats.length === 0 && (
                                  <span className="text-[9px] text-stone-400 font-medium">بدون تصنيف</span>
                                )}
                              </div>
                              {onToggleCategoriesBadge && (
                                <button
                                  type="button"
                                  onClick={() => onToggleCategoriesBadge(hotel)}
                                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-bold border transition-all cursor-pointer ${
                                    hotel.showCategories !== false
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200'
                                  }`}
                                  title={hotel.showCategories !== false ? 'وسوم التصنيف معروضة بالبطاقة' : 'وسوم التصنيف مخفية بالبطاقة'}
                                >
                                  <Tag className="w-2 h-2" />
                                  <span>{hotel.showCategories !== false ? 'الوسوم: ظاهرة' : 'مخفية'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })()}

                      {/* Status & Online Booking Toggles */}
                      {columnVisibility.status && (
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center justify-center gap-1">
                              {/* Active Toggle */}
                              <button
                                type="button"
                                onClick={() => onToggleActive(hotel)}
                                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all cursor-pointer ${
                                  hotel.isActive !== false
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                                }`}
                                title={hotel.isActive !== false ? 'الفندق مفعّل ومعروض للزوار' : 'الفندق مخفي من الموقع'}
                              >
                                {hotel.isActive !== false ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                                <span>{hotel.isActive !== false ? 'مفعل' : 'مخفي'}</span>
                              </button>

                              {/* Online Booking Mode Toggle */}
                              <button
                                type="button"
                                onClick={() => onToggleOnlineBooking(hotel)}
                                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all cursor-pointer ${
                                  hotel.onlineBookingEnabled === true
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                    : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                                }`}
                                title={hotel.onlineBookingEnabled === true ? 'الحجز متاح أونلاين عبر الموقع' : 'الحجز عبر واتساب فقط'}
                              >
                                {hotel.onlineBookingEnabled === true ? (
                                  <>
                                    <BedDouble className="w-2.5 h-2.5 text-[#B38A34]" />
                                    <span>أونلاين</span>
                                  </>
                                ) : (
                                  <>
                                    <WhatsAppIcon className="w-2.5 h-2.5" />
                                    <span>واتساب</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Distance Badge Toggle */}
                            {onToggleDistanceBadge && (
                              <button
                                type="button"
                                onClick={() => onToggleDistanceBadge(hotel)}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-bold border transition-all cursor-pointer ${
                                  hotel.showDistanceBadge !== false && hotel.showTransportInfo !== false
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                    : 'bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200'
                                }`}
                                title={
                                  hotel.showDistanceBadge !== false && hotel.showTransportInfo !== false
                                    ? 'عداد ودقائق السير ظاهرة بالبطاقة'
                                    : 'عداد ودقائق السير مخفية من البطاقة'
                                }
                              >
                                <Footprints className="w-2 h-2 text-[#B38A34]" />
                                <span>
                                  {hotel.showDistanceBadge !== false && hotel.showTransportInfo !== false
                                    ? 'السير: ظاهر'
                                    : 'السير: مخفي'}
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Rooms & Availability Summary */}
                      {columnVisibility.roomsSummary && (
                        <td className="py-2 px-2 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-stone-900 font-bold text-[11px]">
                              {hotelRooms.length > 0 ? `${hotelRooms.length} فئات غرف` : 'غرف قياسية'}
                            </span>
                            <span className={`text-[10px] font-medium ${
                              totalAvailRooms <= 0 ? 'text-red-600 font-bold' : totalAvailRooms <= 5 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              {hotelRooms.length > 0 
                                ? `📦 متاح ${totalAvailRooms} غرفة` 
                                : 'متاح للحجز'}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Last Updated */}
                      {columnVisibility.lastUpdated && (
                        <td className="py-2 px-1 text-center whitespace-nowrap text-[10px] text-stone-500">
                          <span>
                            {hotel.createdAt 
                              ? new Date(hotel.createdAt).toLocaleDateString('ar-SA')
                              : 'تلقائي'}
                          </span>
                        </td>
                      )}

                      {/* Actions Column */}
                      {columnVisibility.actions && (
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {/* View Public Page */}
                            <a
                              href={`/#/hotels/${hotel.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
                              title="معاينة صفحة الفندق العامة"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            {/* Album Manager Button */}
                            {hasPermission(currentUser, adminRoles, 'hotels', 'edit') && (
                              <button
                                type="button"
                                onClick={() => onOpenAlbum(hotel)}
                                className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#B38A34] flex items-center justify-center transition-colors cursor-pointer"
                                title="إدارة ألبوم الصور والفيديوهات"
                              >
                                <Images className="w-3 h-3" />
                              </button>
                            )}

                            {/* Edit Hotel Button */}
                            {hasPermission(currentUser, adminRoles, 'hotels', 'edit') && (
                              <button
                                type="button"
                                onClick={() => onEditHotel(hotel)}
                                className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                                title="تعديل بيانات الفندق"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}

                            {/* Delete Hotel Button */}
                            {hasPermission(currentUser, adminRoles, 'hotels', 'delete') && (
                              <button
                                type="button"
                                onClick={() => onDeleteHotel(hotel)}
                                className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-red-500 hover:text-white text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="حذف الفندق"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Pagination & Count Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600 pt-2 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <span>إجمالي الفنادق: <strong>{totalItems}</strong></span>
          <span className="text-stone-300">•</span>
          <span>عرض الصفحة: <strong>{currentPage}</strong> من <strong>{totalPages || 1}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-500">لكل صفحة:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-stone-100 border border-stone-200 text-xs font-bold text-stone-700 focus:outline-none cursor-pointer"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="0">الكل</option>
            </select>
          </div>

          {/* Prev / Next Pagination Buttons */}
          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  currentPage <= 1
                    ? 'border-stone-200 text-stone-300 cursor-not-allowed'
                    : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                }`}
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Show only nearby pages if too many
                if (totalPages > 7 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="px-1 text-stone-400">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#C9A24B] text-white shadow-xs'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  currentPage >= totalPages
                    ? 'border-stone-200 text-stone-300 cursor-not-allowed'
                    : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                }`}
                title="الصفحة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* نافذة أداة التحكم الشامل بعداد ودقائق السير لجميع الفنادق */}
      {showDistanceToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/20 border border-[#C9A24B]/50 flex items-center justify-center text-[#DFBE72]">
                  <Footprints className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-base text-white">أداة التحكم الشامل بعداد السير</h3>
                  <p className="text-[11px] text-stone-300">إظهار أو إخفاء دقائق السير للحرم والشارة عن جميع الفنادق دفعة واحدة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDistanceToolModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Stats Card */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-center">
                <div className="p-2">
                  <span className="text-[11px] text-stone-500 block">إجمالي الفنادق</span>
                  <span className="text-base font-black text-stone-800">{hotels.length}</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 block font-semibold">ظاهر بالبطاقات</span>
                  <span className="text-base font-black text-emerald-800">{hotelsWithDistanceVisible}</span>
                </div>
                <div className="p-2 bg-stone-100 rounded-xl border border-stone-200">
                  <span className="text-[11px] text-stone-600 block font-semibold">مخفي تماماً</span>
                  <span className="text-base font-black text-stone-700">{hotelsWithDistanceHidden}</span>
                </div>
              </div>

              {/* Main Actions */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B38A34]" />
                  <span>الإجراءات الشاملة المباشرة:</span>
                </p>

                {/* زر إخفاء الكل */}
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={async () => {
                    if (onBulkToggleDistanceBadge) {
                      setIsBulkProcessing(true);
                      await onBulkToggleDistanceBadge(false, 'all');
                      setIsBulkProcessing(false);
                      setShowDistanceToolModal(false);
                    }
                  }}
                  className="w-full p-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-300 hover:border-red-400 text-stone-800 hover:text-red-700 text-xs font-bold flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 text-right">
                    <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <EyeOff className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">إخفاء عداد السير عن جميع الفنادق (إخفاء كامل)</span>
                      <span className="block text-[11px] text-stone-500 font-normal">يخفي الشارة وعبارة "دقائق سيراً للحرم" عن كافة الفنادق بالموقع</span>
                    </div>
                  </div>
                  <span className="text-stone-400 group-hover:text-red-600 font-black text-sm">➔</span>
                </button>

                {/* زر إظهار الكل */}
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={async () => {
                    if (onBulkToggleDistanceBadge) {
                      setIsBulkProcessing(true);
                      await onBulkToggleDistanceBadge(true, 'all');
                      setIsBulkProcessing(false);
                      setShowDistanceToolModal(false);
                    }
                  }}
                  className="w-full p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 hover:border-emerald-400 text-emerald-900 text-xs font-bold flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 text-right">
                    <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">إظهار عداد السير لجميع الفنادق</span>
                      <span className="block text-[11px] text-emerald-700 font-normal">يعرض شارة وعداد السير لجميع فنادق مكة والمدينة على البطاقات</span>
                    </div>
                  </div>
                  <span className="text-emerald-500 group-hover:text-emerald-800 font-black text-sm">➔</span>
                </button>
              </div>

              {/* Scope by City */}
              <div className="pt-3 border-t border-stone-200/80">
                <span className="text-[11px] font-bold text-stone-600 block mb-2">تطبيق حسب المدينة:</span>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    disabled={isBulkProcessing}
                    onClick={async () => {
                      if (onBulkToggleDistanceBadge) {
                        setIsBulkProcessing(true);
                        await onBulkToggleDistanceBadge(false, 'مكة المكرمة');
                        setIsBulkProcessing(false);
                        setShowDistanceToolModal(false);
                      }
                    }}
                    className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-center cursor-pointer transition-colors"
                  >
                    إخفاء لفنادق مكة فقط
                  </button>
                  <button
                    type="button"
                    disabled={isBulkProcessing}
                    onClick={async () => {
                      if (onBulkToggleDistanceBadge) {
                        setIsBulkProcessing(true);
                        await onBulkToggleDistanceBadge(false, 'المدينة المنورة');
                        setIsBulkProcessing(false);
                        setShowDistanceToolModal(false);
                      }
                    }}
                    className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-center cursor-pointer transition-colors"
                  >
                    إخفاء لفنادق المدينة فقط
                  </button>
                </div>
              </div>

              {/* Note */}
              <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-center">
                💡 <span className="font-semibold">تلميح:</span> يمكنك أيضاً تفعيل أو إخفاء الشارة لكل فندق بشكل فردي من خلال عمود الحالة في جدول الفنادق في أي وقت.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
