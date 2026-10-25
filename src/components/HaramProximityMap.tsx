import React, { useState, useMemo } from 'react';
import { Hotel } from '../types';
import { 
  Building2, 
  MapPin, 
  Footprints, 
  Bus, 
  Star, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Navigation, 
  ArrowRight, 
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import { isBusTransportation, formatTransportText } from '../utils/hotelTransport';

interface HaramProximityMapProps {
  hotels: Hotel[];
  activeCity?: 'all' | 'مكة المكرمة' | 'المدينة المنورة';
  onSelectHotel: (hotelId: string) => void;
  onNavigateToBooking?: (hotelId: string) => void;
}

export const HaramProximityMap: React.FC<HaramProximityMapProps> = ({
  hotels,
  activeCity = 'مكة المكرمة',
  onSelectHotel,
  onNavigateToBooking
}) => {
  const [selectedCity, setSelectedCity] = useState<'مكة المكرمة' | 'المدينة المنورة'>(
    activeCity === 'المدينة المنورة' ? 'المدينة المنورة' : 'مكة المكرمة'
  );
  const [activeDistrictFilter, setActiveDistrictFilter] = useState<string>('all');
  const [selectedHotelPin, setSelectedHotelPin] = useState<Hotel | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Filter hotels by selected city
  const cityHotels = useMemo(() => {
    return hotels.filter(h => 
      h.isActive !== false && 
      (h.city === selectedCity) &&
      (activeDistrictFilter === 'all' || h.district === activeDistrictFilter)
    );
  }, [hotels, selectedCity, activeDistrictFilter]);

  // Extract districts
  const districts = useMemo(() => {
    const list = Array.from(new Set(
      hotels
        .filter(h => h.city === selectedCity && h.district)
        .map(h => h.district!)
    ));
    return list;
  }, [hotels, selectedCity]);

  // Map Coordinates Calculation: Relative positioning around the holy sanctuary
  // Center (0,0) is the Kaaba / Holy Mosque (50% x 50%)
  const getHotelCoordinates = (hotel: Hotel, idx: number): { x: number; y: number } => {
    const district = (hotel.district || '').trim();
    const distance = hotel.distanceToHaram || 300;
    
    // Scale distance to percentage radius: 100m -> 15%, 1500m -> 38%
    const normalizedRadius = Math.min(38, Math.max(14, (distance / 1500) * 35));

    // Base angle by district in Makkah (concentric circular arrangement)
    let baseAngle = (idx * (360 / Math.max(cityHotels.length, 1))) * (Math.PI / 180);

    if (selectedCity === 'مكة المكرمة') {
      if (district.includes('أجياد')) {
        baseAngle = (110 + (idx % 4) * 20) * (Math.PI / 180); // South-East
      } else if (district.includes('المسفلة')) {
        baseAngle = (200 + (idx % 4) * 20) * (Math.PI / 180); // South-West
      } else if (district.includes('محبس')) {
        baseAngle = (30 + (idx % 4) * 15) * (Math.PI / 180); // North-East towards Aziziya
      } else if (district.includes('الشبيكة') || district.includes('التيسير')) {
        baseAngle = (290 + (idx % 4) * 20) * (Math.PI / 180); // North-West
      }
    } else {
      // Madinah arrangement
      if (district.includes('المركزية الشمالية')) {
        baseAngle = (270 + (idx % 3) * 25) * (Math.PI / 180);
      } else if (district.includes('المركزية الجنوبية')) {
        baseAngle = (90 + (idx % 3) * 25) * (Math.PI / 180);
      } else {
        baseAngle = (idx * 45) * (Math.PI / 180);
      }
    }

    const x = 50 + normalizedRadius * Math.cos(baseAngle);
    const y = 50 + normalizedRadius * Math.sin(baseAngle);

    return { x: Math.max(10, Math.min(90, x)), y: Math.max(12, Math.min(88, y)) };
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm flex flex-col animate-fadeIn">
      {/* Top Map Control Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-50 via-white to-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 rotate-45" />
          </div>
          <div>
            <h3 className="font-cairo font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2">
              <span>خريطة القرب المكاني من الحرم الشريف (Haram Map)</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                تفاعلية ثلاثية الأبعاد 🗺️
              </span>
            </h3>
            <p className="text-xs text-stone-500">
              استكشف مواقع الفنادق والمسافة سيراً على الأقدام ومسارات الحافلات الترددية
            </p>
          </div>
        </div>

        {/* City Toggle & District Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* City Segmented Toggle */}
          <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setSelectedCity('مكة المكرمة');
                setSelectedHotelPin(null);
                setActiveDistrictFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCity === 'مكة المكرمة'
                  ? 'bg-[#C9A24B] text-white shadow-2xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <span>🕋 مكة المكرمة</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCity('المدينة المنورة');
                setSelectedHotelPin(null);
                setActiveDistrictFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCity === 'المدينة المنورة'
                  ? 'bg-[#C9A24B] text-white shadow-2xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <span>🕌 المدينة المنورة</span>
            </button>
          </div>

          {/* District Filter Pills */}
          {districts.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveDistrictFilter('all')}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                  activeDistrictFilter === 'all'
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                }`}
              >
                كافة الأحياء
              </button>
              {districts.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setActiveDistrictFilter(d)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                    activeDistrictFilter === d
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="relative w-full h-[520px] sm:h-[600px] bg-gradient-to-b from-[#F2ECE1] via-[#EFE7D8] to-[#E8DEC9] overflow-hidden select-none">
        
        {/* Subtle Architectural Grid Lines & Sanctuary Radii */}
        <div 
          className="absolute inset-0 transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Concentric Walking Circles around Kaaba (100m, 300m, 600m, 1000m) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24%] aspect-square rounded-full border border-amber-600/25 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[46%] aspect-square rounded-full border border-dashed border-amber-600/20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68%] aspect-square rounded-full border border-amber-600/15 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] aspect-square rounded-full border border-dashed border-amber-600/10 pointer-events-none" />

          {/* Distance Radius Labels */}
          <span className="absolute top-[37%] left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-amber-800/60 bg-amber-100/50 px-1.5 py-0.5 rounded pointer-events-none">
            ~ ١٥٠ متراً (دقيقتان سيراً)
          </span>
          <span className="absolute top-[26%] left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-amber-800/60 bg-amber-100/50 px-1.5 py-0.5 rounded pointer-events-none">
            ~ ٥٠٠ متراً (٥ دقائق سيراً)
          </span>
          <span className="absolute top-[14%] left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-amber-800/50 bg-amber-100/40 px-1.5 py-0.5 rounded pointer-events-none">
            ~ ١٠٠٠ متراً (١٠ دقائق أو حافلات نقل)
          </span>

          {/* CENTRAL SANCTUARY: Kaaba / Al-Masjid Al-Haram or Al-Masjid An-Nabawi */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
            {selectedCity === 'مكة المكرمة' ? (
              <div className="relative group cursor-default">
                {/* Golden Glow Pulse */}
                <div className="absolute -inset-4 bg-[#C9A24B]/30 rounded-full blur-md animate-pulse pointer-events-none" />
                
                {/* Marble Courtyard (Mataf) */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/95 border-2 border-[#C9A24B] shadow-xl flex items-center justify-center p-2 relative">
                  {/* The Holy Kaaba 3D Cube */}
                  <div className="w-10 h-10 rounded-md bg-stone-950 border border-[#C9A24B] shadow-lg flex items-center justify-center relative overflow-hidden">
                    {/* Golden Kiswa Band */}
                    <div className="absolute top-1.5 inset-x-0 h-1 bg-gradient-to-r from-[#DFBE72] via-[#C9A24B] to-[#98752B]" />
                    <span className="text-[9px] font-bold text-[#C9A24B] tracking-widest">الكعبة</span>
                  </div>
                </div>

                {/* Badge Below */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-stone-900/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-[#C9A24B]/50">
                  <span>المسجد الحرام الشريف</span>
                </div>
              </div>
            ) : (
              <div className="relative group cursor-default">
                <div className="absolute -inset-4 bg-emerald-500/25 rounded-full blur-md animate-pulse pointer-events-none" />
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/95 border-2 border-emerald-600 shadow-xl flex items-center justify-center p-2 relative">
                  {/* The Green Dome */}
                  <div className="w-11 h-11 rounded-full bg-emerald-700 border-2 border-emerald-400 shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
                    🕌
                  </div>
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-stone-900/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-emerald-500/50">
                  <span>المسجد النبوي الشريف</span>
                </div>
              </div>
            )}
          </div>

          {/* PLOTTED HOTEL PINS */}
          {cityHotels.map((hotel, idx) => {
            const { x, y } = getHotelCoordinates(hotel, idx);
            const isSelected = selectedHotelPin?.id === hotel.id;
            const isBus = isBusTransportation(hotel);
            const minPrice = hotel.priceStartingFrom || (hotel.stars === 5 ? 550 : 380);

            return (
              <div
                key={hotel.id}
                style={{ top: `${y}%`, left: `${x}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-200"
              >
                {/* Interactive Pin Trigger Button */}
                <button
                  type="button"
                  onClick={() => setSelectedHotelPin(isSelected ? null : hotel)}
                  className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl shadow-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 text-white border-[#C9A24B] scale-110 z-40 ring-4 ring-[#C9A24B]/40'
                      : 'bg-white hover:bg-stone-900 text-stone-900 hover:text-white border-stone-300 hover:border-[#C9A24B] hover:scale-105'
                  }`}
                >
                  {/* Icon: Footprints or Bus */}
                  <span className={`w-5 h-5 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                    isSelected ? 'bg-[#C9A24B] text-white' : 'bg-[#C9A24B]/20 text-[#B38A34]'
                  }`}>
                    {isBus ? <Bus className="w-3 h-3" /> : <Footprints className="w-3 h-3" />}
                  </span>

                  {/* Hotel Info & Price */}
                  <div className="text-right leading-tight">
                    <span className="text-[11px] font-extrabold block whitespace-nowrap">
                      {hotel.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#C9A24B] block">
                      من {minPrice} ر.س
                    </span>
                  </div>

                  {/* Pulsing Dot */}
                  <span className="w-2 h-2 rounded-full bg-[#C9A24B] animate-ping absolute -top-1 -right-1" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Selected Hotel Floating Card Overlay */}
        {selectedHotelPin && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-40 bg-white/95 backdrop-blur-xl rounded-3xl border border-[#C9A24B]/40 p-4 sm:p-5 shadow-2xl animate-fadeIn">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedHotelPin.mainImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'}
                  alt={selectedHotelPin.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-stone-200 shrink-0"
                />
                <div>
                  <h4 className="font-cairo font-bold text-sm text-stone-900 line-clamp-1">
                    {selectedHotelPin.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#B38A34]" />
                    <span>{selectedHotelPin.city} - {selectedHotelPin.district}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[#C9A24B] text-xs">
                    {Array.from({ length: selectedHotelPin.stars || 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#C9A24B]" />
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedHotelPin(null)}
                className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Distance & Walking Badge */}
            <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-xs text-stone-800 mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold">
                {isBusTransportation(selectedHotelPin) ? (
                  <Bus className="w-4 h-4 text-[#B38A34]" />
                ) : (
                  <Footprints className="w-4 h-4 text-[#B38A34]" />
                )}
                <span>{selectedHotelPin.distanceText || `${selectedHotelPin.distanceToHaram} م عن الحرم`}</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#C9A24B]">
                من {selectedHotelPin.priceStartingFrom || 380} ر.س / ليلة
              </span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectHotel(selectedHotelPin.slug || selectedHotelPin.id)}
                className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>تفاصيل الفندق</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateToBooking) {
                    onNavigateToBooking(selectedHotelPin.id);
                  } else {
                    window.location.hash = `#/bookings?hotel=${selectedHotelPin.id}`;
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <span>احجز الآن أونلاين ⚡</span>
              </button>
            </div>
          </div>
        )}

        {/* Map Legend (Bottom Right) */}
        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-stone-200/80 shadow-md text-xs space-y-1.5 hidden sm:block">
          <strong className="text-[11px] text-stone-800 font-bold block mb-1">دليل الخريطة:</strong>
          <div className="flex items-center gap-2 text-stone-600 text-[11px]">
            <span className="w-3 h-3 rounded-full bg-[#C9A24B]" />
            <span>فندق قريب سيراً على الأقدام 🚶</span>
          </div>
          <div className="flex items-center gap-2 text-stone-600 text-[11px]">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span>حافلات نقل ترددي على مدار 24 ساعة 🚌</span>
          </div>
        </div>

        {/* Zoom Controls (Bottom Left) */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.15))}
            className="w-9 h-9 rounded-xl bg-white shadow-md border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-50 transition-colors cursor-pointer"
            title="تكبير الخريطة"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(0.85, prev - 0.15))}
            className="w-9 h-9 rounded-xl bg-white shadow-md border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-50 transition-colors cursor-pointer"
            title="تصغير الخريطة"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
