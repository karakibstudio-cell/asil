import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Hotel, FilterState, HotelCategory, ALL_HOTEL_CATEGORIES } from '../types';
import { HotelCard, HotelCardSkeleton } from '../components/HotelCard';
import { EditableText } from '../components/EditableText';
import { useLanguage } from '../context/LanguageContext';
import { 
  Search, 
  RotateCcw, 
  Building, 
  Star, 
  Footprints, 
  MapPin, 
  ArrowUpDown,
  Tag,
  Check,
  ChevronDown,
  X,
  SlidersHorizontal
} from 'lucide-react';

interface HotelsPageProps {
  hotels: Hotel[];
  isLoading?: boolean;
  onSelectHotel: (hotelId: string) => void;
  initialCity?: string;
  initialDistrict?: string;
}

export const HotelsPage: React.FC<HotelsPageProps> = ({
  hotels,
  isLoading = false,
  onSelectHotel,
  initialCity,
  initialDistrict
}) => {
  const { language, t, translateDynamic, isRtl } = useLanguage();
  const [filters, setFilters] = useState<FilterState>({
    city: (initialCity as any) || 'all',
    district: initialDistrict || 'all',
    stars: 'all',
    maxDistance: 1000,
    sortBy: 'recommended',
    searchQuery: '',
    selectedCategories: []
  });

  // Open dropdown state: 'district' | 'stars' | 'distance' | 'category' | 'sort' | null
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialCity) {
      setFilters(prev => ({ ...prev, city: initialCity as any }));
    }
    if (initialDistrict) {
      setFilters(prev => ({ ...prev, district: initialDistrict }));
    }
  }, [initialCity, initialDistrict]);

  // Extract available districts dynamically according to city selection (active hotels only)
  const availableDistricts = useMemo(() => {
    const relevantHotels = (filters.city === 'all' 
      ? hotels 
      : hotels.filter(h => h.city === filters.city)
    ).filter(h => h.isActive !== false);
    
    const set = new Set<string>();
    relevantHotels.forEach(h => {
      if (h.district) set.add(h.district);
    });
    return Array.from(set).sort();
  }, [hotels, filters.city]);

  const resetFilters = () => {
    setFilters({
      city: 'all',
      district: 'all',
      stars: 'all',
      maxDistance: 1000,
      sortBy: 'recommended',
      searchQuery: '',
      selectedCategories: []
    });
    setOpenDropdown(null);
  };

  const toggleCategoryFilter = (category: HotelCategory) => {
    setFilters(prev => {
      const exists = prev.selectedCategories.includes(category);
      return {
        ...prev,
        selectedCategories: exists
          ? prev.selectedCategories.filter(c => c !== category)
          : [...prev.selectedCategories, category]
      };
    });
  };

  // Instant client-side filtering and sorting
  const filteredHotels = useMemo(() => {
    return hotels
      .filter((hotel) => {
        // Exclude hidden hotels completely from public visitor views
        if (hotel.isActive === false) {
          return false;
        }
        // City filter
        if (filters.city !== 'all' && hotel.city !== filters.city) {
          return false;
        }
        // District filter
        if (filters.district && filters.district !== 'all' && hotel.district !== filters.district) {
          return false;
        }
        // Stars filter
        if (filters.stars !== 'all' && hotel.stars !== parseInt(filters.stars)) {
          return false;
        }
        // Distance filter
        if (filters.maxDistance < 1000 && hotel.distanceToHaram > filters.maxDistance) {
          return false;
        }
        // Categories multi-select filter
        if (filters.selectedCategories.length > 0) {
          const hotelCats = hotel.categories || [];
          const matchesAny = filters.selectedCategories.some((cat) => hotelCats.includes(cat));
          if (!matchesAny) return false;
        }
        // Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchName = hotel.name.toLowerCase().includes(q);
          const matchOverview = hotel.overview.toLowerCase().includes(q);
          const matchCity = hotel.city.toLowerCase().includes(q);
          const matchDistrict = (hotel.district || '').toLowerCase().includes(q);
          const matchCategory = (hotel.categories || []).some(c => c.toLowerCase().includes(q));
          if (!matchName && !matchOverview && !matchCity && !matchDistrict && !matchCategory) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'closest') {
          return a.distanceToHaram - b.distanceToHaram;
        }
        if (filters.sortBy === 'highest-rated') {
          return b.rating - a.rating;
        }
        if (filters.sortBy === 'stars') {
          return b.stars - a.stars;
        }
        // Default: 'recommended' custom order set by admin
        const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : 9999;
        const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : 9999;
        if (orderA !== orderB) return orderA - orderB;
        return a.distanceToHaram - b.distanceToHaram;
      });
  }, [hotels, filters]);

  // Check if any non-default filter is applied
  const isAnyFilterActive = 
    filters.city !== 'all' ||
    filters.district !== 'all' ||
    filters.stars !== 'all' ||
    filters.maxDistance < 1000 ||
    filters.selectedCategories.length > 0 ||
    filters.searchQuery.trim() !== '';

  const activeFiltersCount = 
    (filters.city !== 'all' ? 1 : 0) +
    (filters.district !== 'all' ? 1 : 0) +
    (filters.stars !== 'all' ? 1 : 0) +
    (filters.maxDistance < 1000 ? 1 : 0) +
    filters.selectedCategories.length;

  return (
    <div id="hotels-listing-page" className="min-h-screen bg-[#F8F7F4] text-stone-900 pt-28 pb-24">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        
        {/* Page Title & Intro */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-[#C9A24B] text-xs font-bold uppercase tracking-wider mb-2">
            <Building className="w-4 h-4" />
            <EditableText 
              contentKey="hotels.header.badge"
              fallback="تسكين مكة المكرمة والمدينة المنورة"
              inline={true}
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-cairo font-extrabold text-stone-900 mb-2">
            <EditableText 
              contentKey="hotels.header.title"
              fallback="دليل فنادق الحرمين الشريفين"
              as="span"
            />
          </h1>
          <div className="text-xs sm:text-sm text-stone-600 max-w-2xl">
            <EditableText 
              contentKey="hotels.header.subtitle"
              fallback="تصفح نخبة من أرقى الفنادق المركزية المعتمدة لضيوف الرحمن، وصنّف عبر الفلاتر المنسدلة الذكية بكل سهولة."
              as="span"
              multiline={true}
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* COMPACT & SPACE-EFFICIENT DROPDOWN FILTERS BAR */}
        {/* ========================================================= */}
        <div 
          ref={filterBarRef}
          id="hotels-filter-bar" 
          className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 mb-8 shadow-xs relative z-30 space-y-4"
        >
          {/* Row 1: Search Input & City Tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className={`w-4 h-4 text-stone-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
              <input
                id="hotel-search-input"
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                placeholder={t('hotels.searchPlaceholder', 'ابحث باسم الفندق، الحي، أو التصنيف...')}
                className={`w-full ${isRtl ? 'pr-10 pl-9' : 'pl-10 pr-9'} py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#C9A24B] transition-colors`}
              />
              {filters.searchQuery && (
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                  className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 cursor-pointer p-1`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* City Selection Tabs */}
            <div className="flex items-center gap-1.5 bg-stone-100/80 p-1 rounded-2xl border border-stone-200 shrink-0 self-start md:self-auto overflow-x-auto max-w-full">
              {[
                { id: 'all', label: t('hotels.filterCityAll', 'كل المدن') },
                { id: 'مكة المكرمة', label: t('hotels.filterMakkah', 'مكة المكرمة') },
                { id: 'المدينة المنورة', label: t('hotels.filterMadinah', 'المدينة المنورة') }
              ].map((c) => (
                <button
                  key={c.id}
                  id={`filter-city-${c.id}`}
                  onClick={() => setFilters(prev => ({ ...prev, city: c.id as any, district: 'all' }))}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    filters.city === c.id
                      ? 'bg-[#C9A24B] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-white/60'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Sleek Dropdown Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-stone-100">
            
            {/* 1. Category Multi-Select Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  filters.selectedCategories.length > 0
                    ? 'bg-[#C9A24B] text-white border-[#C9A24B]'
                    : openDropdown === 'category'
                    ? 'bg-stone-100 text-stone-900 border-[#C9A24B]'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>
                  {filters.selectedCategories.length === 0
                    ? (language === 'en' ? 'Category' : 'التصنيف')
                    : filters.selectedCategories.length === 1
                    ? translateDynamic(filters.selectedCategories[0])
                    : (language === 'en' ? `Category (${filters.selectedCategories.length})` : `التصنيف (${filters.selectedCategories.length})`)}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'category' && (
                <div className={`absolute top-full ${isRtl ? 'right-0' : 'left-0'} mt-2 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl p-3 z-50 animate-fadeIn space-y-1`}>
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-1 px-1">
                    <span className="text-[11px] font-bold text-stone-500">
                      {language === 'en' ? 'Select Categories' : 'اختر تصنيفات الفندق'}
                    </span>
                    {filters.selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, selectedCategories: [] }))}
                        className="text-[10px] text-red-600 hover:underline cursor-pointer font-bold"
                      >
                        {language === 'en' ? 'Clear' : 'مسح التحديد'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {ALL_HOTEL_CATEGORIES.map((cat) => {
                      const isSelected = filters.selectedCategories.includes(cat);
                      return (
                        <div
                          key={cat}
                          onClick={() => toggleCategoryFilter(cat)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#C9A24B]/15 text-[#B38A34] font-bold'
                              : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <span>{translateDynamic(cat)}</span>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected ? 'bg-[#C9A24B] border-[#C9A24B] text-white' : 'border-stone-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. District Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'district' ? null : 'district')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  filters.district !== 'all'
                    ? 'bg-[#C9A24B] text-white border-[#C9A24B]'
                    : openDropdown === 'district'
                    ? 'bg-stone-100 text-stone-900 border-[#C9A24B]'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {filters.district === 'all' 
                    ? (language === 'en' ? 'District / Area' : 'الحي / المنطقة') 
                    : (language === 'en' ? `${translateDynamic(filters.district)} District` : `حي ${filters.district}`)}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'district' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'district' && (
                <div className={`absolute top-full ${isRtl ? 'right-0' : 'left-0'} mt-2 w-56 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 z-50 animate-fadeIn max-h-60 overflow-y-auto space-y-1`}>
                  <div
                    onClick={() => {
                      setFilters(prev => ({ ...prev, district: 'all' }));
                      setOpenDropdown(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center justify-between ${
                      filters.district === 'all' ? 'bg-[#C9A24B]/15 text-[#B38A34] font-bold' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{t('hotels.allDistricts', 'جميع الأحياء')}</span>
                    {filters.district === 'all' && <Check className="w-3.5 h-3.5 text-[#B38A34]" />}
                  </div>

                  {availableDistricts.map((dist) => (
                    <div
                      key={dist}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, district: dist }));
                        setOpenDropdown(null);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center justify-between ${
                        filters.district === dist ? 'bg-[#C9A24B]/15 text-[#B38A34] font-bold' : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span>{language === 'en' ? `${translateDynamic(dist)} District` : `حي ${dist}`}</span>
                      {filters.district === dist && <Check className="w-3.5 h-3.5 text-[#B38A34]" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Stars Rating Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'stars' ? null : 'stars')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  filters.stars !== 'all'
                    ? 'bg-[#C9A24B] text-white border-[#C9A24B]'
                    : openDropdown === 'stars'
                    ? 'bg-stone-100 text-stone-900 border-[#C9A24B]'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>
                  {filters.stars === 'all' 
                    ? (language === 'en' ? 'Stars' : 'النجوم') 
                    : `${filters.stars} ${language === 'en' ? 'Stars' : 'نجوم'}`}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'stars' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'stars' && (
                <div className={`absolute top-full ${isRtl ? 'right-0' : 'left-0'} mt-2 w-52 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 z-50 animate-fadeIn space-y-1`}>
                  {[
                    { id: 'all', label: language === 'en' ? 'All Ratings' : 'جميع التصنيفات' },
                    { id: '5', label: language === 'en' ? '5 Stars (Luxury Royal)' : '5 نجوم (فاخر ملكي)' },
                    { id: '4', label: language === 'en' ? '4 Stars (Premium)' : '4 نجوم (مميز)' },
                    { id: '3', label: language === 'en' ? '3 Stars (Standard)' : '3 نجوم (اقتصادي)' }
                  ].map((st) => (
                    <div
                      key={st.id}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, stars: st.id as any }));
                        setOpenDropdown(null);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center justify-between ${
                        filters.stars === st.id ? 'bg-[#C9A24B]/15 text-[#B38A34] font-bold' : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span>{st.label}</span>
                      {filters.stars === st.id && <Check className="w-3.5 h-3.5 text-[#B38A34]" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Distance Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'distance' ? null : 'distance')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  filters.maxDistance < 1000
                    ? 'bg-[#C9A24B] text-white border-[#C9A24B]'
                    : openDropdown === 'distance'
                    ? 'bg-stone-100 text-stone-900 border-[#C9A24B]'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>
                  {filters.maxDistance >= 1000
                    ? (language === 'en' ? 'Distance' : 'المسافة')
                    : filters.maxDistance <= 100
                    ? (language === 'en' ? 'Haram Courtyard (<100m)' : 'ساحة الحرم (<100م)')
                    : (language === 'en' ? `< ${filters.maxDistance}m` : `أقل من ${filters.maxDistance}م`)}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'distance' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'distance' && (
                <div className={`absolute top-full ${isRtl ? 'right-0' : 'left-0'} mt-2 w-56 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 z-50 animate-fadeIn space-y-1`}>
                  {[
                    { id: 1000, label: language === 'en' ? 'Any distance (up to 1 km)' : 'أي مسافة (حتى 1 كم)' },
                    { id: 100, label: language === 'en' ? 'Direct Haram Courtyard (<100m)' : 'ساحة الحرم مباشرة (<100م)' },
                    { id: 250, label: language === 'en' ? '< 250 meters' : 'أقل من 250 متراً' },
                    { id: 500, label: language === 'en' ? '< 500 meters' : 'أقل من 500 متراً' }
                  ].map((dist) => (
                    <div
                      key={dist.id}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, maxDistance: dist.id }));
                        setOpenDropdown(null);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center justify-between ${
                        filters.maxDistance === dist.id ? 'bg-[#C9A24B]/15 text-[#B38A34] font-bold' : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span>{dist.label}</span>
                      {filters.maxDistance === dist.id && <Check className="w-3.5 h-3.5 text-[#B38A34]" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Sort By Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  openDropdown === 'sort'
                    ? 'bg-stone-100 text-stone-900 border-[#C9A24B]'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#C9A24B]" />
                <span>
                  {filters.sortBy === 'recommended'
                    ? (language === 'en' ? 'Recommended' : 'الترتيب الموصى به')
                    : filters.sortBy === 'closest'
                    ? (language === 'en' ? 'Closest to Haram' : 'الأقرب للحرم')
                    : filters.sortBy === 'highest-rated'
                    ? (language === 'en' ? 'Highest Rated' : 'الأعلى تقييماً')
                    : (language === 'en' ? 'Stars' : 'النجوم')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'sort' && (
                <div className={`absolute top-full ${isRtl ? 'right-0' : 'left-0'} mt-2 w-52 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 z-50 animate-fadeIn space-y-1`}>
                  {[
                    { id: 'recommended', label: language === 'en' ? 'Recommended Order' : 'الترتيب الموصى به (الافتراضي)' },
                    { id: 'closest', label: language === 'en' ? 'Closest to Haram courtyard' : 'الأقرب إلى ساحة الحرم' },
                    { id: 'highest-rated', label: language === 'en' ? 'Highest Rated' : 'الأعلى تقييماً' },
                    { id: 'stars', label: language === 'en' ? 'Star Rating (Highest first)' : 'عدد النجوم (الأعلى أولاً)' }
                  ].map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, sortBy: s.id as any }));
                        setOpenDropdown(null);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center justify-between ${
                        filters.sortBy === s.id ? 'bg-[#C9A24B]/15 text-[#B38A34] font-bold' : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span>{s.label}</span>
                      {filters.sortBy === s.id && <Check className="w-3.5 h-3.5 text-[#B38A34]" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clear/Reset All Filters Button */}
            {isAnyFilterActive && (
              <button
                type="button"
                id="filter-reset-button"
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'en' ? `Reset (${activeFiltersCount})` : `إعادة ضبط (${activeFiltersCount})`}</span>
              </button>
            )}

            {/* Results Count Summary Tag */}
            <div className={`${isRtl ? 'mr-auto' : 'ml-auto'} text-xs text-stone-500 font-medium`}>
              <span>
                {language === 'en'
                  ? <>Found <strong className="text-stone-900 font-bold font-mono">{filteredHotels.length}</strong> hotels</>
                  : <>عُثر على <strong className="text-stone-900 font-bold font-mono">{filteredHotels.length}</strong> فندق</>}
              </span>
            </div>

          </div>

          {/* Active Filter Chips (if any) */}
          {filters.selectedCategories.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-stone-100">
              <span className="text-[11px] text-stone-500 font-semibold">
                {language === 'en' ? 'Active Filters:' : 'التصنيفات المحددة:'}
              </span>
              {filters.selectedCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-[11px] font-bold border border-[#C9A24B]/30"
                >
                  <span>{translateDynamic(cat)}</span>
                  <button
                    type="button"
                    onClick={() => toggleCategoryFilter(cat)}
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* HOTELS GRID */}
        {/* ========================================================= */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <HotelCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white border border-stone-200 p-8 shadow-xs max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#C9A24B]/10 text-[#C9A24B] flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-cairo font-bold text-stone-900 mb-2">
              {t('hotels.noHotelsFound', 'لم نعثر على فنادق مطابقة للبحث')}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mb-6 leading-relaxed">
              {language === 'en'
                ? 'Try adjusting your filters or expanding distance to view more certified hotels in Makkah & Madinah.'
                : 'جرّب تغيير خيارات التصفية أو توسيع نطاق المسافة لعرض المزيد من فنادق مكة والمدينة المعتمدة.'}
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              {language === 'en' ? 'Show All Hotels' : 'عرض جميع الفنادق'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onClick={() => onSelectHotel(hotel.slug || hotel.id)}
                onSelect={() => onSelectHotel(hotel.slug || hotel.id)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
