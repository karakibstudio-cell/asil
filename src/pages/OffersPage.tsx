import React, { useState, useEffect } from 'react';
import { Offer, ActivePage, SiteSettings } from '../types';
import { CountdownTimer } from '../components/CountdownTimer';
import { Lightbox, LightboxMediaItem } from '../components/Lightbox';
import { SafeVideoPlayer } from '../components/SafeVideoPlayer';
import { parseVideoUrl } from '../utils/video';
import { getFirstActiveWhatsApp, getChannelHref } from '../utils/channels';
import { useSEO } from '../utils/seo';
import { EditableText } from '../components/EditableText';
import { useLanguage } from '../context/LanguageContext';
import { getOfferShareUrl, syncRouteToUrl } from '../utils/routing';
import { 
  Tag, 
  Play, 
  Clock, 
  ArrowLeft, 
  X, 
  Calendar, 
  Percent, 
  Share2, 
  MessageCircle,
  Eye,
  Check,
  Sparkles,
  ExternalLink,
  Building2
} from 'lucide-react';

interface OffersPageProps {
  offers: Offer[];
  onNavigate: (page: ActivePage, hotelIdOrSlug?: string) => void;
  siteSettings?: SiteSettings;
  initialOfferId?: string;
}

export const OffersPage: React.FC<OffersPageProps> = ({ 
  offers, 
  onNavigate, 
  siteSettings,
  initialOfferId
}) => {
  const { language, t, translateDynamic, isRtl } = useLanguage();
  const activeOffers = offers.filter((o) => o.isActive);
  const primaryWhatsApp = getFirstActiveWhatsApp(siteSettings?.channels);

  // Lightbox for fullscreen image / video view
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMediaItem[]>([]);
  const [copiedOfferId, setCopiedOfferId] = useState<string | null>(null);

  // Detailed Modal for an Offer
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(() => {
    if (initialOfferId) {
      const match = offers.find(o => o.id === initialOfferId || encodeURIComponent(o.id) === initialOfferId);
      if (match) return match;
    }
    return null;
  });

  const [activeModalMediaIdx, setActiveModalMediaIdx] = useState<number>(0);

  // Auto-open offer modal if initialOfferId changes or is set via route
  useEffect(() => {
    if (initialOfferId) {
      const match = offers.find(o => o.id === initialOfferId || encodeURIComponent(o.id) === initialOfferId);
      if (match) {
        setSelectedOffer(match);
        setActiveModalMediaIdx(0);
      }
    }
  }, [initialOfferId, offers]);

  // Sync route URL when modal opens or closes
  const handleOpenOfferModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setActiveModalMediaIdx(0);
    syncRouteToUrl('offers', { offerId: offer.id });
  };

  const handleCloseOfferModal = () => {
    setSelectedOffer(null);
    syncRouteToUrl('offers');
  };

  const handleCopyLink = (offer: Offer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = getOfferShareUrl(offer.id);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedOfferId(offer.id);
      setTimeout(() => setCopiedOfferId(null), 2500);
    }).catch(() => {});
  };

  // Dynamic SEO Meta Tags
  useSEO({
    title: selectedOffer 
      ? `${selectedOffer.title} - إعلانات شركة برستيج`
      : 'إعلانات وبوسترات مواسم الحج والعمرة | برستيج لإدارة الفنادق',
    description: selectedOffer 
      ? (selectedOffer.metaDescription || selectedOffer.shortDescription || selectedOffer.fullDescription)
      : 'استفد من أقوى إعلانات وبوسترات مواسم التسكين الفاخر في مكة المكرمة والمدينة المنورة.',
    keywords: selectedOffer 
      ? (selectedOffer.keywords || `${selectedOffer.title}, إعلانات العمرة, فنادق مكة, باقات الحج`)
      : 'إعلانات العمرة, عروض فنادق مكة, فنادق المدينة, باقات تسكين الحجاج, إعلانات رمضان',
    image: selectedOffer ? selectedOffer.mediaUrl : undefined,
    type: 'article'
  });

  const handleOpenMedia = (offer: Offer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const items: LightboxMediaItem[] = [];
    const mainIsVideo = offer.mediaType === 'video' && Boolean(offer.videoUrl?.trim());
    items.push({
      type: mainIsVideo ? 'video' : 'image',
      url: (mainIsVideo && offer.videoUrl) ? offer.videoUrl : offer.mediaUrl,
      title: offer.title,
      thumbnail: offer.mediaUrl
    });

    if (Array.isArray(offer.gallery)) {
      offer.gallery.forEach((g) => {
        if (g.url?.trim()) {
          items.push({
            type: g.type === 'video' ? 'video' : 'image',
            url: g.url,
            title: g.title || offer.title,
            thumbnail: g.type === 'video' ? offer.mediaUrl : g.url
          });
        }
      });
    }

    setLightboxMedia(items);
    setLightboxOpen(true);
  };

  return (
    <div id="offers-events-page" className="min-h-screen bg-[#F8F7F4] text-stone-900 pt-28 pb-24">
      {/* Fullscreen Lightbox for Crisp Full-Resolution Viewing */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        mediaItems={lightboxMedia}
      />

      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        {/* Header */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold border border-[#C9A24B]/30 mb-3 shadow-2xs">
            <Tag className="w-3.5 h-3.5" />
            <EditableText 
              contentKey="offers.header.badge"
              fallback="إعلانات وبوسترات حصرية"
              inline={true}
            />
          </div>
          <h1 className="text-3xl sm:text-5xl font-cairo font-extrabold text-stone-900 mb-4 tracking-tight">
            <EditableText 
              contentKey="offers.header.title"
              fallback="إعلانات برستيج ومواسم الضيافة"
              as="span"
            />
          </h1>
          <div className="text-sm sm:text-base text-stone-600 leading-relaxed font-medium">
            <EditableText 
              contentKey="offers.header.subtitle"
              fallback="تصفح أحدث إعلانات وبوسترات مواسم برستيج الفندقية لحجوزات الحج والعمرة والضيافة الروحانية في مكة المكرمة والمدينة المنورة."
              as="span"
              multiline={true}
            />
          </div>
        </div>

        {/* Offers Grid */}
        {activeOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeOffers.map((offer) => (
              <div
                key={offer.id}
                id={`offer-card-${offer.id}`}
                className="group bg-white rounded-3xl border border-stone-200/90 hover:border-[#C9A24B] transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-[#C9A24B]/10 relative"
              >
                <div>
                  {/* High-Fidelity Frameless Poster Container */}
                  <div 
                    className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-stone-100 overflow-hidden cursor-pointer select-none"
                    onClick={() => handleOpenOfferModal(offer)}
                  >
                    <img
                      src={offer.mediaUrl}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out will-change-transform"
                      loading="lazy"
                    />
                    
                    {offer.mediaType === 'video' && (
                      <div className="absolute inset-0 bg-black/35 group-hover:bg-black/15 flex items-center justify-center transition-colors">
                        <div className="w-14 h-14 rounded-full bg-black/70 backdrop-blur-md border border-[#C9A24B] flex items-center justify-center text-[#DFBE72] shadow-2xl group-hover:scale-110 group-hover:bg-[#C9A24B] group-hover:text-black transition-all">
                          <Play className="w-6 h-6 fill-current translate-x-[-1px]" />
                        </div>
                      </div>
                    )}
                    
                    {/* Subtle Gradient Veil for Badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20 pointer-events-none" />

                    {/* Top Floating Badges */}
                    <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {offer.mediaType === 'video' ? (
                          <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-amber-300 text-[11px] font-bold border border-amber-400/30 flex items-center gap-1">
                            <Play className="w-3 h-3 fill-current" />
                            <span>{language === 'en' ? 'Promo Video' : 'فيديو دعائي'}</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold border border-white/15">
                            {offer.badgeText ? translateDynamic(offer.badgeText) : (language === 'en' ? 'Ad Poster' : 'بوستر إعلاني')}
                          </span>
                        )}

                        {Array.isArray(offer.gallery) && offer.gallery.length > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-stone-200 text-[10px] font-mono border border-white/20">
                            +{offer.gallery.length} وسائط
                          </span>
                        )}
                      </div>

                      {offer.showDiscount !== false && Boolean(offer.discountPercentage) && (
                        <span className="px-3 py-1 rounded-full bg-[#C9A24B] text-black text-xs font-black shadow-md">
                          {language === 'en' ? `${offer.discountPercentage}% OFF` : `خصم ${offer.discountPercentage}٪`}
                        </span>
                      )}
                    </div>

                    {/* Quick Fullscreen Zoom & Share Icons on Hover */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => handleOpenMedia(offer, e)}
                        className="p-2 rounded-xl bg-black/65 hover:bg-[#C9A24B] text-white hover:text-black backdrop-blur-md border border-white/20 shadow-md transition-all cursor-pointer"
                        title={language === 'en' ? 'Zoom image full screen' : 'معاينة وتكبير الصورة بدقة كاملة'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(offer, e)}
                        className="p-2 rounded-xl bg-black/65 hover:bg-[#C9A24B] text-white hover:text-black backdrop-blur-md border border-white/20 shadow-md transition-all cursor-pointer"
                        title={copiedOfferId === offer.id ? (language === 'en' ? 'Link Copied!' : 'تم نسخ الرابط!') : (language === 'en' ? 'Copy ad link' : 'نسخ رابط هذا الإعلان')}
                      >
                        {copiedOfferId === offer.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6">
                    <h3 className="font-cairo font-bold text-lg sm:text-xl text-stone-900 mb-2 group-hover:text-[#B38A34] transition-colors line-clamp-2">
                      {translateDynamic(offer.title)}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-3 mb-4">
                      {translateDynamic(offer.shortDescription)}
                    </p>

                    {/* Countdown Timer */}
                    {offer.showCountdown !== false && offer.endDate && (
                      <div className="mb-4 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/90">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-stone-500 flex items-center gap-1 font-bold">
                            <Clock className="w-3.5 h-3.5 text-[#C9A24B]" />
                            <span>{language === 'en' ? 'Offer ends in:' : 'ينتهي العرض خلال:'}</span>
                          </span>
                        </div>
                        <CountdownTimer targetDate={offer.endDate} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 sm:p-6 pt-0 border-t border-stone-100 mt-auto flex items-center gap-2">
                  <button
                    id={`offer-details-btn-${offer.id}`}
                    onClick={() => handleOpenOfferModal(offer)}
                    className="flex-1 py-3 rounded-xl bg-stone-100 hover:bg-[#C9A24B] text-stone-800 hover:text-white font-bold text-xs sm:text-sm border border-stone-200 hover:border-[#C9A24B] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <span>{language === 'en' ? 'Full Ad Details' : 'عرض تفاصيل الإعلان'}</span>
                    <ArrowLeft className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 max-w-lg mx-auto p-8 shadow-sm">
            <Tag className="w-12 h-12 text-[#C9A24B] mx-auto mb-4" />
            <h3 className="font-cairo font-bold text-xl text-stone-900 mb-2">
              <EditableText 
                contentKey="offers.empty.title"
                fallback="لا توجد إعلانات نشطة حالياً"
                inline={true}
              />
            </h3>
            <div className="text-sm text-stone-500 mb-6 leading-relaxed">
              <EditableText 
                contentKey="offers.empty.desc"
                fallback="تابعونا باستمرار للاطلاع على أحدث إعلانات وبوسترات مواسم الحج والعمرة وفنادق مكة والمدينة."
                multiline={true}
              />
            </div>
            <button
              onClick={() => onNavigate('hotels')}
              className="px-6 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm cursor-pointer shadow-md transition-all"
            >
              <EditableText 
                contentKey="offers.empty.cta"
                fallback="استعرض فنادق مكة والمدينة"
                inline={true}
              />
            </button>
          </div>
        )}
      </div>

      {/* Standalone Offer Details Modal - Clean high resolution preview with direct deep link */}
      {selectedOffer && (() => {
        const modalMediaList: { type: 'image' | 'video'; url: string; title?: string }[] = [];
        const isMainVid = selectedOffer.mediaType === 'video' && Boolean(selectedOffer.videoUrl?.trim());
        modalMediaList.push({
          type: isMainVid ? 'video' : 'image',
          url: (isMainVid && selectedOffer.videoUrl) ? selectedOffer.videoUrl : selectedOffer.mediaUrl,
          title: selectedOffer.title
        });

        if (Array.isArray(selectedOffer.gallery)) {
          selectedOffer.gallery.forEach((g) => {
            if (g.url?.trim()) {
              modalMediaList.push({
                type: g.type,
                url: g.url,
                title: g.title
              });
            }
          });
        }

        const currentMedia = modalMediaList[activeModalMediaIdx] || modalMediaList[0];

        return (
          <div 
            id="offer-detail-modal"
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn"
            onClick={(e) => { if (e.target === e.currentTarget) handleCloseOfferModal(); }}
          >
            <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden my-auto animate-scaleUp flex flex-col lg:flex-row max-h-[92vh]">
              {/* Natural High-Res Media View Container */}
              <div className="relative lg:w-3/5 bg-stone-950 flex flex-col items-center justify-center p-2 sm:p-4 min-h-[350px] lg:min-h-[560px] max-h-[65vh] lg:max-h-none overflow-hidden select-none">
                <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                  <button
                    type="button"
                    onClick={handleCloseOfferModal}
                    className="p-2.5 rounded-full bg-black/70 hover:bg-red-500 text-white transition-colors shadow-md cursor-pointer"
                    title={language === 'en' ? 'Close' : 'إغلاق'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className={`absolute top-3 ${isRtl ? 'right-3' : 'left-16'} flex items-center gap-2 z-20`}>
                  <button
                    type="button"
                    onClick={() => handleOpenMedia(selectedOffer)}
                    className="p-2.5 rounded-full bg-black/70 hover:bg-[#C9A24B] text-white hover:text-black transition-colors shadow-md cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-3"
                    title={language === 'en' ? 'Zoom Fullscreen' : 'تكبير فائق ودقة أصلية'}
                  >
                    <Eye className="w-4 h-4" />
                    <span>{language === 'en' ? 'High-Res Zoom' : 'معاينة أصلية فائقة'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleCopyLink(selectedOffer, e)}
                    className="p-2.5 rounded-full bg-black/70 hover:bg-[#C9A24B] text-white hover:text-black transition-colors shadow-md cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-3"
                    title={language === 'en' ? 'Copy link to this ad' : 'نسخ رابط هذا الإعلان'}
                  >
                    {copiedOfferId === selectedOffer.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">
                      {copiedOfferId === selectedOffer.id 
                        ? (language === 'en' ? 'Copied!' : 'تم النسخ!') 
                        : (language === 'en' ? 'Copy Link' : 'نسخ الرابط')}
                    </span>
                  </button>
                </div>

                {currentMedia.type === 'video' ? (
                  <div className="w-full h-full aspect-video flex items-center justify-center">
                    <SafeVideoPlayer
                      url={currentMedia.url}
                      poster={selectedOffer.mediaUrl}
                      controls={true}
                      autoPlay={true}
                      playsInline={true}
                      className="w-full h-full max-h-[70vh] object-contain rounded-2xl"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center overflow-hidden cursor-zoom-in group"
                    onClick={() => handleOpenMedia(selectedOffer)}
                    title={language === 'en' ? 'Click to open ultra-high resolution zoom' : 'انقر لفتح المعاينة الفائقة والتكبير'}
                  >
                    <img
                      src={currentMedia.url}
                      alt={selectedOffer.title}
                      className="max-h-[60vh] lg:max-h-[78vh] w-auto max-w-full object-contain rounded-xl shadow-2xl group-hover:scale-[1.02] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-4 py-2 rounded-full bg-black/80 text-[#DFBE72] text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md border border-[#C9A24B]/30">
                        <Eye className="w-4 h-4" />
                        {language === 'en' ? 'Click for Fullscreen Zoom' : 'انقر للتكبير فائق الدقة (4K)'}
                      </span>
                    </div>
                  </div>
                )}

                {selectedOffer.showDiscount !== false && Boolean(selectedOffer.discountPercentage) && (
                  <span className={`absolute bottom-3 ${isRtl ? 'right-3' : 'left-3'} px-4 py-1.5 rounded-full bg-[#C9A24B] text-black text-xs font-black shadow-lg z-10`}>
                    {language === 'en' ? `Special Discount ${selectedOffer.discountPercentage}% OFF` : `خصم خاص ${selectedOffer.discountPercentage}٪`}
                  </span>
                )}

                {/* Gallery Thumbnails Strip (if multiple items exist) */}
                {modalMediaList.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-2xl flex items-center gap-2 overflow-x-auto border border-white/10 z-20">
                    {modalMediaList.map((m, mIdx) => (
                      <button
                        key={mIdx}
                        type="button"
                        onClick={() => setActiveModalMediaIdx(mIdx)}
                        className={`relative w-12 h-9 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                          activeModalMediaIdx === mIdx ? 'border-[#C9A24B] scale-105 ring-2 ring-[#C9A24B]/40' : 'border-stone-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {m.type === 'video' ? (
                          <div className="w-full h-full bg-stone-800 flex items-center justify-center text-[#DFBE72]">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </div>
                        ) : (
                          <img src={m.url} alt={`وسائط ${mIdx + 1}`} className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Details & Action Content */}
              <div className="lg:w-2/5 p-6 sm:p-8 space-y-5 overflow-y-auto flex flex-col justify-between bg-white dark:bg-[#18181b]">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] dark:text-[#DFBE72] text-xs font-bold border border-[#C9A24B]/20">
                        {selectedOffer.mediaType === 'video'
                          ? (language === 'en' ? 'Promo Video' : 'مقطع فيديو دعائي')
                          : (language === 'en' ? 'Ad Poster' : 'تصميم بوستر إعلاني')}
                      </span>
                      {selectedOffer.badgeText && (
                        <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold">
                          {translateDynamic(selectedOffer.badgeText)}
                        </span>
                      )}
                    </div>
                    <h2 className="font-cairo font-extrabold text-xl sm:text-2xl text-stone-900 dark:text-white leading-tight">
                      {translateDynamic(selectedOffer.title)}
                    </h2>
                    {selectedOffer.showCountdown !== false && selectedOffer.endDate && (
                      <div className="mt-3">
                        <CountdownTimer targetDate={selectedOffer.endDate} />
                      </div>
                    )}
                  </div>

                  <div className="border-t border-stone-200 dark:border-stone-800 pt-4">
                    <h4 className="text-xs sm:text-sm font-bold text-[#B38A34] dark:text-[#DFBE72] mb-2 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {language === 'en' ? 'Ad Details & Description:' : 'تفاصيل ومعلومات الإعلان:'}
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line font-medium">
                      {translateDynamic(selectedOffer.fullDescription || selectedOffer.shortDescription)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-3">
                  {primaryWhatsApp ? (
                    <a
                      href={getChannelHref(
                        primaryWhatsApp,
                        language === 'en'
                          ? `Hello, I would like to inquire about ${selectedOffer.title} on Prestige Hotels Management.`
                          : `السلام عليكم، أود الاستفسار عن ${selectedOffer.title} المعلن لدى شركة برستيج لإدارة وتشغيل الفنادق.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-transparent" />
                      <span>{language === 'en' ? 'Inquire on WhatsApp Now' : 'تواصل واستفسر عبر واتساب فوراً'}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { handleCloseOfferModal(); onNavigate('contact'); }}
                      className="w-full py-3.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <span>{language === 'en' ? 'Contact Us About This Ad' : 'تواصل معنا بخصوص هذا الإعلان'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCloseOfferModal}
                    className="w-full py-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer text-center"
                  >
                    {language === 'en' ? 'Close' : 'إغلاق'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
