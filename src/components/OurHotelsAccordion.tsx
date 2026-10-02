import React, { useState, useMemo } from 'react';
import { Hotel } from '../types';
import { 
  Building2, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Footprints, 
  Star, 
  ArrowLeft
} from 'lucide-react';
import { EditableText } from './EditableText';
import { useLanguage } from '../context/LanguageContext';

interface OurHotelsAccordionProps {
  hotels: Hotel[];
  onSelectHotel: (hotelId: string) => void;
  onFilterDistrict?: (city: string, district: string) => void;
}

export const OurHotelsAccordion: React.FC<OurHotelsAccordionProps> = ({
  hotels,
  onSelectHotel,
  onFilterDistrict
}) => {
  const { language, t, translateDynamic, isRtl } = useLanguage();
  const [activeCity, setActiveCity] = useState<'مكة المكرمة' | 'المدينة المنورة'>('مكة المكرمة');
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);

  // Group hotels by City and then by District
  const groupedData = useMemo(() => {
    const data: Record<string, Record<string, Hotel[]>> = {
      'مكة المكرمة': {},
      'المدينة المنورة': {}
    };

    hotels
      .filter((hotel) => hotel.isActive !== false)
      .sort((a, b) => {
        const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : 9999;
        const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : 9999;
        if (orderA !== orderB) return orderA - orderB;
        return (b.rating || 0) - (a.rating || 0);
      })
      .forEach((hotel) => {
        const city = hotel.city === 'مكة المكرمة' ? 'مكة المكرمة' : 'المدينة المنورة';
        const district = hotel.district || (city === 'مكة المكرمة' ? 'أجياد' : 'المنطقة المركزية الشمالية');
        
        if (!data[city][district]) {
          data[city][district] = [];
        }
        data[city][district].push(hotel);
      });

    return data;
  }, [hotels]);

  const currentCityDistricts = groupedData[activeCity] || {};
  const districtNames = Object.keys(currentCityDistricts);

  // Auto-expand first district if none expanded
  React.useEffect(() => {
    if (districtNames.length > 0 && !expandedDistrict) {
      setExpandedDistrict(districtNames[0]);
    }
  }, [activeCity, districtNames, expandedDistrict]);

  const handleCityChange = (city: 'مكة المكرمة' | 'المدينة المنورة') => {
    setActiveCity(city);
    const firstDistrict = Object.keys(groupedData[city] || {})[0] || null;
    setExpandedDistrict(firstDistrict);
  };

  const toggleDistrict = (district: string) => {
    setExpandedDistrict((prev) => (prev === district ? null : district));
  };

  return (
    <section 
      id="our-hotels-accordion-section" 
      className="py-18 sm:py-24 bg-white border-y border-[#EFE6D8] relative"
    >
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold border border-[#C9A24B]/30 mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <EditableText 
              contentKey="home.accordion.badge" 
              fallback="دليل التسكين الشامل" 
            />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-cairo font-extrabold text-stone-900 mb-3">
            <EditableText 
              contentKey="home.accordion.title" 
              fallback="فنادقنا حسب المدينة والأحياء" 
              as="span"
            />
          </h2>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            <EditableText 
              contentKey="home.accordion.subtitle" 
              fallback="استكشف تشكيلة فنادقنا الفاخرة الموزعة بدقة على أهم أحياء مكة المكرمة والمدينة المنورة الأقرب للحرمين الشريفين." 
              as="span"
              multiline={true}
            />
          </p>
        </div>

        {/* City Toggle Buttons (Pill tabs) */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            type="button"
            id="city-tab-makkah"
            onClick={() => handleCityChange('مكة المكرمة')}
            className={`px-6 sm:px-8 py-3 rounded-full font-cairo font-bold text-sm sm:text-base transition-all duration-300 flex items-center gap-2.5 shadow-sm cursor-pointer ${
              activeCity === 'مكة المكرمة'
                ? 'bg-[#C9A24B] text-white shadow-md shadow-[#C9A24B]/30 scale-105'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>
              {language === 'en'
                ? `Makkah Hotels (${Object.values(groupedData['مكة المكرمة']).flat().length})`
                : `فنادق مكة المكرمة (${Object.values(groupedData['مكة المكرمة']).flat().length})`}
            </span>
          </button>

          <button
            type="button"
            id="city-tab-madinah"
            onClick={() => handleCityChange('المدينة المنورة')}
            className={`px-6 sm:px-8 py-3 rounded-full font-cairo font-bold text-sm sm:text-base transition-all duration-300 flex items-center gap-2.5 shadow-sm cursor-pointer ${
              activeCity === 'المدينة المنورة'
                ? 'bg-[#C9A24B] text-white shadow-md shadow-[#C9A24B]/30 scale-105'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>
              {language === 'en'
                ? `Madinah Hotels (${Object.values(groupedData['المدينة المنورة']).flat().length})`
                : `فنادق المدينة المنورة (${Object.values(groupedData['المدينة المنورة']).flat().length})`}
            </span>
          </button>
        </div>

        {/* Accordion Container */}
        <div className="max-w-4xl mx-auto space-y-4">
          {districtNames.map((district) => {
            const districtHotels = currentCityDistricts[district] || [];
            const isExpanded = expandedDistrict === district;

            return (
              <div
                key={district}
                id={`district-accordion-${district}`}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded
                    ? 'bg-[#FAF8F5] border-[#C9A24B] shadow-md shadow-[#C9A24B]/10'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleDistrict(district)}
                  className={`w-full px-5 sm:px-6 py-4.5 flex items-center justify-between ${isRtl ? 'text-right' : 'text-left'} cursor-pointer select-none`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isExpanded ? 'bg-[#C9A24B] text-white' : 'bg-[#EFE6D8]/60 text-[#B38A34]'
                    }`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-cairo font-bold text-base sm:text-lg text-stone-900">
                        {language === 'en' ? `${translateDynamic(district)} District` : `حي ${district}`}
                      </h3>
                      <span className="text-xs text-stone-500 font-medium">
                        {language === 'en' ? `${districtHotels.length} certified hotels available` : `${districtHotels.length} فندق متاح ومعتمد`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#B38A34] hidden xs:inline">
                      {isExpanded ? (language === 'en' ? 'Hide Hotels' : 'إخفاء الفنادق') : (language === 'en' ? 'View Hotels' : 'استعراض الفنادق')}
                    </span>
                    <div className={`w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center transition-transform duration-300 ${
                      isExpanded ? 'rotate-180 bg-[#C9A24B] text-white border-transparent' : 'bg-white text-stone-600'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {/* Accordion Content (List of Hotels in this District) */}
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-[#EFE6D8]/80 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {districtHotels.map((hotel) => (
                        <div
                          key={hotel.id}
                          id={`accordion-hotel-item-${hotel.id}`}
                          onClick={() => onSelectHotel(hotel.id)}
                          className="flex items-center gap-3.5 p-3 rounded-xl bg-white border border-stone-200 hover:border-[#C9A24B] transition-all cursor-pointer group shadow-2xs hover:shadow-sm"
                        >
                          <img
                            src={hotel.mainImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                            alt={hotel.name}
                            className="w-18 h-18 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0 group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallbackApplied) {
                                target.dataset.fallbackApplied = 'true';
                                target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              {[...Array(hotel.stars)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-[#C9A24B] text-[#C9A24B]" />
                              ))}
                              <span className={`text-[11px] font-bold text-stone-500 ${isRtl ? 'mr-1' : 'ml-1'}`}>
                                {hotel.rating} ★
                              </span>
                            </div>
                            <h4 className="font-cairo font-bold text-sm text-stone-900 truncate group-hover:text-[#B38A34] transition-colors">
                              {language === 'en' && hotel.nameEn ? hotel.nameEn : hotel.name}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                              <Footprints className="w-3 h-3 text-[#B38A34]" />
                              <span>{translateDynamic(hotel.distanceText)}</span>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-[#EFE6D8]/50 group-hover:bg-[#C9A24B] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                            <ArrowLeft className={`w-4 h-4 text-[#B38A34] group-hover:text-white ${isRtl ? '' : 'rotate-180'}`} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Filter in full hotels page button */}
                    {onFilterDistrict && (
                      <div className="mt-4 pt-3 text-center border-t border-stone-200/60">
                        <button
                          type="button"
                          onClick={() => onFilterDistrict(activeCity, district)}
                          className="text-xs sm:text-sm font-bold text-[#B38A34] hover:text-[#98752B] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>
                            {language === 'en'
                              ? `View and filter all ${translateDynamic(district)} District hotels in Hotels page`
                              : `عرض وتصفية جميع فنادق حي ${district} في صفحة الفنادق`}
                          </span>
                          <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? '' : 'rotate-180'}`} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
