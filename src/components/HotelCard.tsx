import React, { useState } from 'react';
import { Hotel, SiteSettings } from '../types';
import { 
  Star, 
  MapPin, 
  Footprints, 
  ArrowLeft, 
  Building,
  Bus,
  CalendarCheck,
  ExternalLink,
  PhoneCall,
  BedDouble
} from 'lucide-react';
import { BookingComIcon, AgodaIcon, ExpediaIcon, GoogleMapsIcon, WhatsAppIcon, EmailIcon } from './BookingIcons';
import { HotelBookingModal } from './HotelBookingModal';
import { useLanguage } from '../context/LanguageContext';
import { prefetchRoute, prefetchHotelDetails } from '../utils/prefetch';
import { buildWhatsAppLink, getFirstActiveWhatsApp } from '../utils/channels';
import { isBusTransportation, formatTransportText } from '../utils/hotelTransport';

interface HotelCardProps {
  hotel: Hotel;
  onClick?: (hotelId: string) => void;
  onSelect?: (hotelId: string) => void;
  index?: number;
  siteSettings?: SiteSettings;
  onOpenBookingModal?: (hotel: Hotel) => void;
}

export const HotelCard: React.FC<HotelCardProps> = ({ 
  hotel, 
  onClick, 
  onSelect,
  index = 0,
  siteSettings,
  onOpenBookingModal
}) => {
  const { language, t, translateDynamic, isRtl } = useLanguage();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleSelectHotel = (e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    const targetKey = hotel.slug || hotel.id;
    if (onClick) onClick(targetKey);
    if (onSelect) onSelect(targetKey);
  };

  const isOnlineBookingActive = siteSettings?.bookingModule?.enabled !== false && hotel.onlineBookingEnabled === true;

  const handleBookingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenBookingModal) {
      onOpenBookingModal(hotel);
    } else if (isOnlineBookingActive) {
      window.location.hash = `#/bookings?hotel=${hotel.id}`;
    } else if (whatsAppUrl) {
      window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
    } else {
      setIsBookingOpen(true);
    }
  };

  const bookingUrl = hotel.bookingUrl || `https://www.booking.com/searchresults.ar.html?ss=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`;
  const agodaUrl = hotel.agodaUrl || `https://www.agoda.com/search?text=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`;
  const expediaUrl = hotel.expediaUrl || `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`;
  const googleMapsUrl = hotel.googleMapsUrl || (hotel.location?.lat && hotel.location?.lng 
    ? `https://maps.google.com/?q=${hotel.location.lat},${hotel.location.lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`);

  const showBooking = hotel.showBookingUrl !== false;
  const showAgoda = hotel.showAgodaUrl !== false;
  const showExpedia = hotel.showExpediaUrl !== false && !!hotel.expediaUrl;
  const showMaps = hotel.showGoogleMapsUrl !== false;
  const siteWhatsApp = getFirstActiveWhatsApp(siteSettings?.channels);
  const resolvedWhatsApp = hotel.hotelWhatsApp || siteWhatsApp?.value || siteSettings?.officeWhatsApp || '';
  const showWhatsApp = hotel.showHotelWhatsApp !== false && !!resolvedWhatsApp;
  const hotelWaMsg = language === 'en'
    ? `Hello, I would like to inquire about accommodation rates at ${hotel.nameEn || hotel.name} (${translateDynamic(hotel.city)}).`
    : `السلام عليكم ورحمة الله، أود الاستفسار وحجز إقامة في فندق ${hotel.name} (${hotel.city}).`;
  const whatsAppUrl = buildWhatsAppLink(resolvedWhatsApp, hotelWaMsg);
  const showEmail = hotel.showHotelEmail !== false && !!hotel.hotelEmail;

  return (
    <>
      <div
        id={`hotel-card-${hotel.id}`}
        onClick={handleSelectHotel}
        onMouseEnter={() => {
          prefetchHotelDetails(hotel.slug || hotel.id);
          prefetchRoute('hotel-detail');
        }}
        onTouchStart={() => {
          prefetchHotelDetails(hotel.slug || hotel.id);
          prefetchRoute('hotel-detail');
        }}
        className="group bg-white hover:bg-[#FAF8F5] rounded-2xl border border-[#EFE6D8] hover:border-[#C9A24B] transition-all duration-300 overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:shadow-[#C9A24B]/10 flex flex-col relative"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {/* Image Container with Fixed Aspect Ratio & Zoom */}
        <div className="relative aspect-[16/10] sm:aspect-[16/11] w-full overflow-hidden bg-stone-200">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 animate-pulse flex items-center justify-center">
              <Building className="w-8 h-8 text-stone-300" />
            </div>
          )}
          <img
            src={hotel.mainImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'}
            alt={hotel.name}
            className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading={index < 6 ? "eager" : "lazy"}
            fetchPriority={index < 3 ? "high" : "auto"}
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.fallbackApplied) {
                target.dataset.fallbackApplied = 'true';
                target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
              }
              setImageLoaded(true);
            }}
          />

          {/* Gradient Overlay for Badges Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
            {/* Distance Badge */}
            {hotel.showDistanceBadge !== false && hotel.distanceText ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-stone-900 text-xs font-semibold border border-stone-200 shadow-sm">
                <Footprints className="w-3.5 h-3.5 text-[#B38A34]" />
                <span>{translateDynamic(hotel.distanceText)}</span>
              </span>
            ) : <div />}

            <div className="flex items-center gap-1.5">
              {/* Online Booking Badge */}
              {isOnlineBookingActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/95 text-white text-[11px] font-bold shadow-md border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
                  <span>{language === 'en' ? 'Online' : 'أونلاين ✓'}</span>
                </span>
              )}

              {/* Featured Badge if flagged */}
              {hotel.featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C9A24B] text-white text-xs font-bold shadow-md">
                  <span>{language === 'en' ? 'Featured' : 'مميز'}</span>
                </span>
              )}
            </div>
          </div>

          {/* City & District Tag on Bottom-Right of Image */}
          {hotel.showDistrict !== false && (
            <div className={`absolute bottom-3 ${isRtl ? 'right-3' : 'left-3'} pointer-events-none`}>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium border border-white/20">
                <MapPin className="w-3 h-3 text-[#DFBE72]" />
                <span>{translateDynamic(hotel.city)} - {translateDynamic(hotel.district)}</span>
              </span>
            </div>
          )}

          {/* External Platform Badges Top Left/Bottom Left */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
            {/* Google Maps quick icon */}
            {showMaps && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-transform hover:scale-110"
                title={language === 'en' ? 'Hotel location on Google Maps' : 'موقع الفندق على خرائط جوجل'}
              >
                <GoogleMapsIcon className="w-4 h-4" />
              </a>
            )}

            {/* Booking.com icon */}
            {showBooking && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 rounded-lg bg-[#003580] hover:bg-[#00224f] shadow-md flex items-center justify-center transition-transform hover:scale-110"
                title={language === 'en' ? 'Direct booking on Booking.com' : 'رابط الحجز على Booking.com'}
              >
                <BookingComIcon className="w-4 h-4" />
              </a>
            )}

            {/* Agoda icon */}
            {showAgoda && (
              <a
                href={agodaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 rounded-lg bg-[#5856D6] hover:bg-[#4340c2] shadow-md flex items-center justify-center transition-transform hover:scale-110"
                title={language === 'en' ? 'Direct booking on Agoda' : 'رابط الحجز على Agoda'}
              >
                <AgodaIcon className="w-4 h-4" />
              </a>
            )}

            {/* Expedia icon */}
            {showExpedia && (
              <a
                href={expediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 rounded-lg bg-[#FFCC00] hover:bg-[#e6b800] shadow-md flex items-center justify-center transition-transform hover:scale-110"
                title={language === 'en' ? 'Direct booking on Expedia' : 'رابط الحجز على Expedia'}
              >
                <ExpediaIcon className="w-4 h-4" />
              </a>
            )}

            {/* WhatsApp icon */}
            {showWhatsApp && !!whatsAppUrl && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] shadow-md flex items-center justify-center transition-transform hover:scale-110"
                title={language === 'en' ? 'Direct hotel WhatsApp booking' : 'تواصل وحجز واتساب للفندق'}
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            )}

            {/* Email icon */}
            {showEmail && (
              <a
                href={`mailto:${hotel.hotelEmail}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 rounded-lg bg-[#EA4335] hover:bg-[#d33828] shadow-md flex items-center justify-center transition-transform hover:scale-110"
                title={language === 'en' ? `Email hotel: ${hotel.hotelEmail}` : `مراسلة الفندق عبر البريد: ${hotel.hotelEmail}`}
              >
                <EmailIcon className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
          <div>
            {/* Star Rating & Reviews */}
            {(hotel.showStars !== false || hotel.showRating !== false || hotel.customClassification) && (
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                {hotel.showStars !== false ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    {[...Array(Math.max(0, Math.min(7, typeof hotel.stars === 'number' ? hotel.stars : (parseInt(hotel.stars as any, 10) || 0))))].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#C9A24B] text-[#C9A24B]" />
                    ))}
                    <span className={`text-xs text-stone-500 ${isRtl ? 'mr-1.5' : 'ml-1.5'} font-medium`}>
                      ({hotel.stars ?? 5} {language === 'en' ? 'Stars' : 'نجوم'})
                    </span>
                    {hotel.customClassification && (
                      <span className="text-[11px] font-bold text-[#B38A34] bg-[#C9A24B]/10 px-2 py-0.5 rounded-md border border-[#C9A24B]/30 mr-1">
                        {translateDynamic(hotel.customClassification)}
                      </span>
                    )}
                  </div>
                ) : hotel.customClassification ? (
                  <span className="text-[11px] font-bold text-[#B38A34] bg-[#C9A24B]/10 px-2.5 py-0.5 rounded-md border border-[#C9A24B]/30">
                    {translateDynamic(hotel.customClassification)}
                  </span>
                ) : <div />}

                {hotel.showRating !== false && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#C9A24B]/10 text-[#B38A34] border border-[#C9A24B]/30">
                    {hotel.rating} ★
                  </span>
                )}
              </div>
            )}

            {/* Hotel Title */}
            <h3 className="font-cairo font-bold text-base sm:text-lg text-stone-900 group-hover:text-[#B38A34] transition-colors line-clamp-1">
              {language === 'en' && hotel.nameEn ? hotel.nameEn : translateDynamic(hotel.name)}
            </h3>

            {/* Location view / Walking or Bus Transport */}
            {(hotel.showTransportInfo !== false || hotel.showDistanceBadge !== false) && (
              <p className="text-xs text-stone-500 mt-1 line-clamp-1 flex items-center gap-1.5 flex-wrap">
                {hotel.location?.viewType && (
                  <span className="flex items-center gap-1 text-stone-700 font-medium">
                    <Building className="w-3.5 h-3.5 text-[#B38A34] shrink-0" />
                    <span>{translateDynamic(hotel.location.viewType)}</span>
                  </span>
                )}
                {hotel.showDistanceBadge !== false && hotel.showTransportInfo !== false && (
                  <>
                    {hotel.location?.viewType && <span className="text-stone-300">•</span>}
                    <span className="inline-flex items-center gap-1 font-semibold text-[#B38A34]">
                      {isBusTransportation(hotel) ? (
                        <>
                          <Bus className="w-3.5 h-3.5 text-[#C9A24B] shrink-0" />
                          <span>{formatTransportText(hotel, language).text}</span>
                        </>
                      ) : (
                        <>
                          <Footprints className="w-3.5 h-3.5 text-[#C9A24B] shrink-0" />
                          <span>{formatTransportText(hotel, language).text}</span>
                        </>
                      )}
                    </span>
                  </>
                )}
              </p>
            )}

            {/* Hotel Category Tags */}
            {hotel.showCategories !== false && (() => {
              const cats = (Array.isArray(hotel.categories) 
                ? hotel.categories 
                : (typeof hotel.categories === 'string' ? (hotel.categories as string).split(',') : [])
              ).map((c: any) => String(c).trim()).filter(Boolean);

              if (cats.length === 0) return null;

              return (
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {cats.map((cat, idx) => (
                    <span
                      key={`${cat || 'cat'}-${idx}`}
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#EFE6D8]/40 text-stone-800 border border-[#EFE6D8]"
                    >
                      {translateDynamic(cat)}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Card Actions: Contact/Book & View Details */}
          <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
            {/* Direct Booking / WhatsApp Button */}
            {isOnlineBookingActive ? (
              <button
                type="button"
                id={`hotel-card-book-btn-${hotel.id}`}
                onClick={handleBookingClick}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#B38A34] to-[#C9A24B] hover:from-[#98752B] hover:to-[#B38A34] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:shadow-md cursor-pointer"
                title={language === 'en' ? 'Book Online' : 'حجز الغرف أونلاين'}
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Book Online' : 'حجز الغرف أونلاين'}</span>
              </button>
            ) : whatsAppUrl ? (
              <a
                id={`hotel-card-wa-book-btn-${hotel.id}`}
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#25D366] to-[#20bd5a] hover:from-[#1eb852] hover:to-[#179641] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:shadow-md cursor-pointer"
                title={language === 'en' ? 'Direct WhatsApp Booking' : 'حجز مباشر عبر الواتساب'}
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'WhatsApp' : 'حجز واتساب'}</span>
              </a>
            ) : (
              <button
                type="button"
                id={`hotel-card-book-btn-${hotel.id}`}
                onClick={handleSelectHotel}
                className="flex-1 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#C9A24B]" />
                <span>{language === 'en' ? 'Contact' : 'تواصل للحجز'}</span>
              </button>
            )}

            {/* View Details Button */}
            <button
              type="button"
              id={`hotel-card-details-btn-${hotel.id}`}
              onClick={handleSelectHotel}
              className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-800 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{t('hotels.viewDetails', 'التفاصيل')}</span>
              <ArrowLeft className={`w-3 h-3 ${isRtl ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Modal if parent didn't provide callback */}
      {!onOpenBookingModal && isBookingOpen && (
        <HotelBookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          hotel={hotel}
          siteSettings={siteSettings}
        />
      )}
    </>
  );
};

export const HotelCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs animate-pulse flex flex-col">
      <div className="aspect-[16/10] bg-stone-200" />
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 bg-stone-200 rounded-md w-1/3" />
          <div className="h-5 bg-stone-200 rounded-md w-3/4" />
          <div className="h-3 bg-stone-200 rounded-md w-1/2" />
        </div>
        <div className="pt-3 border-t border-stone-100 flex justify-between">
          <div className="h-4 bg-stone-200 rounded-md w-1/4" />
          <div className="h-4 bg-stone-200 rounded-md w-1/4" />
        </div>
      </div>
    </div>
  );
};
