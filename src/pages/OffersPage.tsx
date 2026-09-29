import React, { useState } from 'react';
import { Offer, ActivePage, SiteSettings } from '../types';
import { CountdownTimer } from '../components/CountdownTimer';
import { Lightbox, LightboxMediaItem } from '../components/Lightbox';
import { SafeVideoPlayer } from '../components/SafeVideoPlayer';
import { parseVideoUrl } from '../utils/video';
import { getFirstActiveWhatsApp, getChannelHref } from '../utils/channels';
import { useSEO } from '../utils/seo';
import { EditableText } from '../components/EditableText';
import { useLanguage } from '../context/LanguageContext';
import { 
  Tag, 
  Play, 
  Clock, 
  ArrowLeft, 
  X, 
  Calendar, 
  Percent, 
  Share2, 
  MessageCircle 
} from 'lucide-react';

interface OffersPageProps {
  offers: Offer[];
  onNavigate: (page: ActivePage) => void;
  siteSettings?: SiteSettings;
}

export const OffersPage: React.FC<OffersPageProps> = ({ offers, onNavigate, siteSettings }) => {
  const { language, t, translateDynamic, isRtl } = useLanguage();
  // Only show active offers to visitors
  const activeOffers = offers.filter((o) => o.isActive);
  const primaryWhatsApp = getFirstActiveWhatsApp(siteSettings?.channels);

  // Lightbox for video or images
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMediaItem[]>([]);

  // Detailed Modal for an Offer
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const [activeModalMediaIdx, setActiveModalMediaIdx] = useState<number>(0);

  // Dynamic SEO Meta Tags (updates when viewing an offer or default offers page)
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

  const handleOpenMedia = (offer: Offer) => {
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
      {/* Fullscreen Lightbox for Video / Image */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        mediaItems={lightboxMedia}
      />

      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        {/* Header */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold border border-[#C9A24B]/30 mb-3">
            <Tag className="w-3.5 h-3.5" />
            <EditableText 
              contentKey="offers.header.badge"
              fallback="إعلانات وبوسترات حصرية"
              inline={true}
            />
          </div>
          <h1 className="text-3xl sm:text-5xl font-cairo font-extrabold text-stone-900 mb-4">
            <EditableText 
              contentKey="offers.header.title"
              fallback="إعلانات برستيج ومواسم الضيافة"
              as="span"
            />
          </h1>
          <div className="text-sm sm:text-base text-stone-600 leading-relaxed">
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
                className="group bg-white rounded-3xl border border-stone-200 hover:border-[#C9A24B] transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-lg"
              >
                <div>
                  {/* Media Cover - Design Poster or Promo Video */}
                  <div className="relative aspect-[16/10] bg-stone-900 overflow-hidden cursor-pointer" onClick={() => handleOpenMedia(offer)}>
                    <img
                      src={offer.mediaUrl}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    />
                    
                    {offer.mediaType === 'video' && (
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                        <div className="w-14 h-14 rounded-full bg-black/70 backdrop-blur-md border border-[#C9A24B] flex items-center justify-center text-[#DFBE72] shadow-2xl group-hover:scale-110 group-hover:bg-[#C9A24B] group-hover:text-black transition-all">
                          <Play className="w-6 h-6 fill-current translate-x-[-1px]" />
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Content Type Badge & Discount */}
                    <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {offer.mediaType === 'video' ? (
                          <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-amber-300 text-[11px] font-bold border border-amber-400/30 flex items-center gap-1">
                            <Play className="w-3 h-3 fill-current" />
                            <span>{language === 'en' ? 'Promo Video' : 'فيديو دعائي'}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold border border-white/15">
                            {offer.badgeText ? translateDynamic(offer.badgeText) : (language === 'en' ? 'Ad Poster' : 'بوستر إعلاني')}
                          </span>
                        )}

                        {Array.isArray(offer.gallery) && offer.gallery.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-stone-200 text-[10px] font-mono border border-white/20">
                            +{offer.gallery.length} وسائط
                          </span>
                        )}
                      </div>

                      {offer.showDiscount !== false && Boolean(offer.discountPercentage) && (
                        <span className="px-3 py-1 rounded-full bg-[#C9A24B] text-black text-xs font-extrabold shadow-md">
                          {language === 'en' ? `${offer.discountPercentage}% OFF` : `خصم ${offer.discountPercentage}٪`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content - Text Description alongside Media */}
                  <div className="p-5 sm:p-6">
                    <h3 className="font-cairo font-bold text-lg sm:text-xl text-stone-900 mb-2 group-hover:text-[#B38A34] transition-colors">
                      {translateDynamic(offer.title)}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-3 mb-4">
                      {translateDynamic(offer.shortDescription)}
                    </p>

                    {/* Countdown Timer if enabled and endDate present */}
                    {offer.showCountdown !== false && offer.endDate && (
                      <div className="mb-4 p-3 rounded-2xl bg-stone-50 border border-stone-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-stone-500 flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-[#C9A24B]" />
                            <span>{language === 'en' ? 'Ad countdown ends in:' : 'ينتهي الإعلان خلال:'}</span>
                          </span>
                        </div>
                        <CountdownTimer targetDate={offer.endDate} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 sm:p-6 pt-0 border-t border-stone-100 mt-auto">
                  <button
                    id={`offer-details-btn-${offer.id}`}
                    onClick={() => {
                      setSelectedOffer(offer);
                      setActiveModalMediaIdx(0);
                    }}
                    className="w-full py-3 rounded-xl bg-stone-100 hover:bg-[#C9A24B] text-stone-800 hover:text-white font-bold text-xs sm:text-sm border border-stone-200 hover:border-[#C9A24B] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Full Ad Details' : 'عرض تفاصيل الإعلان'}</span>
                    <ArrowLeft className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State if no offers currently active */
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 max-w-lg mx-auto p-8 shadow-sm">
            <Tag className="w-12 h-12 text-[#C9A24B] mx-auto mb-4" />
            <h3 className="font-cairo font-bold text-xl text-stone-900 mb-2">
              <EditableText 
                contentKey="offers.empty.title"
                fallback="لا توجد إعلانات نشطة حالياً"
                inline={true}
              />
            </h3>
            <div className="text-sm text-stone-500 mb-6">
              <EditableText 
                contentKey="offers.empty.desc"
                fallback="تابعونا باستمرار للاطلاع على أحدث إعلانات وبوسترات مواسم الحج والعمرة وفنادق مكة والمدينة."
                multiline={true}
              />
            </div>
            <button
              onClick={() => onNavigate('hotels')}
              className="px-6 py-2.5 rounded-xl bg-[#C9A24B] text-white font-bold text-sm hover:bg-[#B38A34]"
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

      {/* Standalone Offer Details Modal - Fluid unconstrained natural aspect ratio */}
      {selectedOffer && (() => {
        // Collect all available media items for this ad
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
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedOffer(null); }}
          >
            <div className="bg-white border border-stone-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto animate-scaleUp flex flex-col max-h-[92vh]">
              {/* Natural Fluid Media View Container */}
              <div className="relative w-full bg-stone-950 flex flex-col items-center justify-center p-2 sm:p-4 min-h-[280px] max-h-[65vh] overflow-hidden select-none">
                <button
                  type="button"
                  onClick={() => setSelectedOffer(null)}
                  className="absolute top-3 left-3 p-2 rounded-full bg-black/70 hover:bg-red-500 text-white transition-colors z-20 shadow-md cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>

                {currentMedia.type === 'video' ? (
                  <div className="w-full h-full max-h-[60vh] aspect-video max-w-2xl flex items-center justify-center">
                    <SafeVideoPlayer
                      url={currentMedia.url}
                      poster={selectedOffer.mediaUrl}
                      controls={true}
                      autoPlay={true}
                      playsInline={true}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center overflow-hidden">
                    <img
                      src={currentMedia.url}
                      alt={selectedOffer.title}
                      className="max-h-[58vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                    />
                  </div>
                )}

                {selectedOffer.showDiscount !== false && Boolean(selectedOffer.discountPercentage) && (
                  <span className={`absolute bottom-3 ${isRtl ? 'right-3' : 'left-3'} px-3.5 py-1.5 rounded-full bg-[#C9A24B] text-black text-xs font-extrabold shadow-lg z-10`}>
                    {language === 'en' ? `Special Discount ${selectedOffer.discountPercentage}% OFF` : `خصم خاص ${selectedOffer.discountPercentage}٪`}
                  </span>
                )}
              </div>

              {/* Gallery Thumbnails Strip (if multiple items exist) */}
              {modalMediaList.length > 1 && (
                <div className="bg-stone-900 px-4 py-2 flex items-center gap-2 overflow-x-auto border-t border-stone-800">
                  <span className="text-[11px] text-stone-400 font-bold shrink-0 ml-1">
                    وسائط الإعلان ({modalMediaList.length}):
                  </span>
                  {modalMediaList.map((m, mIdx) => (
                    <button
                      key={mIdx}
                      type="button"
                      onClick={() => setActiveModalMediaIdx(mIdx)}
                      className={`relative w-12 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        activeModalMediaIdx === mIdx ? 'border-[#C9A24B] scale-105' : 'border-stone-700 opacity-60 hover:opacity-100'
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

              {/* Modal Content */}
              <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold">
                      {selectedOffer.mediaType === 'video'
                        ? (language === 'en' ? 'Promo Video' : 'مقطع فيديو دعائي')
                        : (language === 'en' ? 'Ad Poster' : 'تصميم بوستر إعلاني')}
                    </span>
                    {selectedOffer.badgeText && (
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-semibold">
                        {translateDynamic(selectedOffer.badgeText)}
                      </span>
                    )}
                  </div>
                  <h2 className="font-cairo font-bold text-xl sm:text-2xl text-stone-900 mb-2">
                    {translateDynamic(selectedOffer.title)}
                  </h2>
                  {selectedOffer.showCountdown !== false && selectedOffer.endDate && (
                    <div className="mt-3 inline-block">
                      <CountdownTimer targetDate={selectedOffer.endDate} />
                    </div>
                  )}
                </div>

                <div className="border-t border-stone-200 pt-4">
                  <h4 className="text-xs sm:text-sm font-bold text-[#B38A34] mb-2">
                    {language === 'en' ? 'Ad Details & Description:' : 'تفاصيل ومعلومات الإعلان:'}
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                    {translateDynamic(selectedOffer.fullDescription || selectedOffer.shortDescription)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center gap-3">
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
                      className="w-full sm:flex-1 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-transparent" />
                      <span>{language === 'en' ? 'Inquire on WhatsApp Now' : 'تواصل واستفسر عبر واتساب فوراً'}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setSelectedOffer(null); onNavigate('contact'); }}
                      className="w-full sm:flex-1 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <span>{language === 'en' ? 'Contact Us About This Ad' : 'تواصل معنا بخصوص هذا الإعلان'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedOffer(null)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
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
