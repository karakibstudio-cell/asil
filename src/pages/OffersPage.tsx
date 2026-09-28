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
  Sparkles, 
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

  // Dynamic SEO Meta Tags (updates when viewing an offer or default offers page)
  useSEO({
    title: selectedOffer 
      ? `${selectedOffer.title} - عروض شركة برستيج`
      : 'عروض ومواسم الحج والعمرة الخاصة | برستيج لإدارة الفنادق',
    description: selectedOffer 
      ? (selectedOffer.metaDescription || selectedOffer.shortDescription || selectedOffer.fullDescription)
      : 'استفد من أقوى العروض الموسمية لحجوزات الحج والعمرة وباقات التسكين الفاخرة في مكة المكرمة والمدينة المنورة.',
    keywords: selectedOffer 
      ? (selectedOffer.keywords || `${selectedOffer.title}, عروض العمرة, خصومات فنادق مكة, باقات الحج`)
      : 'عروض العمرة, عروض فنادق مكة, خصومات فنادق المدينة, باقات تسكين الحجاج, عروض رمضان',
    image: selectedOffer ? selectedOffer.mediaUrl : undefined,
    type: 'article'
  });

  const handleOpenMedia = (offer: Offer) => {
    const videoInfo = parseVideoUrl(offer.videoUrl);
    if (offer.mediaType === 'video' && videoInfo.isValidVideo) {
      setLightboxMedia([
        {
          type: 'video',
          url: offer.videoUrl!,
          title: offer.title,
          thumbnail: offer.mediaUrl
        }
      ]);
      setLightboxOpen(true);
    } else {
      setLightboxMedia([
        {
          type: 'image',
          url: offer.mediaUrl,
          title: offer.title
        }
      ]);
      setLightboxOpen(true);
    }
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
            <Sparkles className="w-3.5 h-3.5" />
            <EditableText 
              contentKey="offers.header.badge"
              fallback="مواسم البركة والخصومات الحصرية"
              inline={true}
            />
          </div>
          <h1 className="text-3xl sm:text-5xl font-cairo font-extrabold text-stone-900 mb-4">
            <EditableText 
              contentKey="offers.header.title"
              fallback="العروض والمناسبات الخاصة"
              as="span"
            />
          </h1>
          <div className="text-sm sm:text-base text-stone-600 leading-relaxed">
            <EditableText 
              contentKey="offers.header.subtitle"
              fallback="استفد من أقوى العروض الموسمية لحجوزات الحج والعمرة، مع خصومات حصرية على باقات التسكين وفنادق مكة والمدينة."
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
                      <div className="flex items-center gap-1.5">
                        {offer.mediaType === 'video' ? (
                          <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-amber-300 text-[11px] font-bold border border-amber-400/30 flex items-center gap-1">
                            <Play className="w-3 h-3 fill-current" />
                            <span>{language === 'en' ? 'Promo Video' : 'فيديو دعائي'}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold border border-white/15">
                            {offer.badgeText ? translateDynamic(offer.badgeText) : (language === 'en' ? 'Offer Poster' : 'بوستر العرض')}
                          </span>
                        )}
                      </div>

                      {offer.discountPercentage && (
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

                    {/* Countdown Timer if endDate present */}
                    {offer.endDate && (
                      <div className="mb-4 p-3 rounded-2xl bg-stone-50 border border-stone-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-stone-500 flex items-center gap-1 font-semibold">
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
                <div className="p-5 sm:p-6 pt-0 border-t border-stone-100 mt-auto">
                  <button
                    id={`offer-details-btn-${offer.id}`}
                    onClick={() => setSelectedOffer(offer)}
                    className="w-full py-3 rounded-xl bg-stone-100 hover:bg-[#C9A24B] text-stone-800 hover:text-white font-bold text-xs sm:text-sm border border-stone-200 hover:border-[#C9A24B] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Full Offer Details' : 'تفاصيل العرض الكاملة'}</span>
                    <ArrowLeft className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State if no offers currently active */
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 max-w-lg mx-auto p-8 shadow-sm">
            <Sparkles className="w-12 h-12 text-[#C9A24B] mx-auto mb-4" />
            <h3 className="font-cairo font-bold text-xl text-stone-900 mb-2">
              <EditableText 
                contentKey="offers.empty.title"
                fallback="لا توجد عروض موسمية نشطة حالياً"
                inline={true}
              />
            </h3>
            <div className="text-sm text-stone-500 mb-6">
              <EditableText 
                contentKey="offers.empty.desc"
                fallback="تابعونا باستمرار للاطلاع على أحدث عروض مواسم الحج والعمرة والاعتكاف في الحرمين الشريفين."
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

      {/* Standalone Offer Details Modal */}
      {selectedOffer && (
        <div 
          id="offer-detail-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-scaleUp">
            {/* Modal Image/Video Preview */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              {selectedOffer.mediaType === 'video' ? (
                <SafeVideoPlayer
                  url={selectedOffer.videoUrl}
                  poster={selectedOffer.mediaUrl}
                  controls={true}
                  autoPlay={true}
                  playsInline={true}
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={selectedOffer.mediaUrl}
                  alt={selectedOffer.title}
                  className="w-full h-full object-contain bg-stone-950"
                />
              )}

              <button
                onClick={() => setSelectedOffer(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {selectedOffer.discountPercentage && (
                <span className={`absolute bottom-4 ${isRtl ? 'right-4' : 'left-4'} px-3.5 py-1.5 rounded-full bg-[#C9A24B] text-black text-xs font-extrabold shadow-lg z-10`}>
                  {language === 'en' ? `Special Discount ${selectedOffer.discountPercentage}% OFF` : `خصم خاص ${selectedOffer.discountPercentage}٪`}
                </span>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold">
                    {selectedOffer.mediaType === 'video'
                      ? (language === 'en' ? 'Promo Video' : 'مقطع فيديو دعائي')
                      : (language === 'en' ? 'Offer Poster' : 'تصميم بوستر العرض')}
                  </span>
                  {selectedOffer.badgeText && (
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-semibold">
                      {translateDynamic(selectedOffer.badgeText)}
                    </span>
                  )}
                </div>
                <h2 className="font-cairo font-bold text-2xl text-stone-900 mb-2">
                  {translateDynamic(selectedOffer.title)}
                </h2>
                {selectedOffer.endDate && (
                  <div className="mt-3 inline-block">
                    <CountdownTimer targetDate={selectedOffer.endDate} />
                  </div>
                )}
              </div>

              <div className="border-t border-stone-200 pt-4">
                <h4 className="text-sm font-bold text-[#B38A34] mb-2">
                  {language === 'en' ? 'Offer Terms & Details:' : 'تفاصيل وشروط العرض:'}
                </h4>
                <p className="text-sm sm:text-base text-stone-700 leading-loose whitespace-pre-line">
                  {translateDynamic(selectedOffer.fullDescription || selectedOffer.shortDescription)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center gap-3">
                {primaryWhatsApp ? (
                  <a
                    href={getChannelHref(
                      primaryWhatsApp,
                      language === 'en'
                        ? `Hello, I would like to book ${selectedOffer.title} listed on Prestige Hotels Management.`
                        : `السلام عليكم، أود الاستفادة من ${selectedOffer.title} المعلن لدى شركة برستيج لإدارة وتشغيل الفنادق.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 fill-white text-transparent" />
                    <span>{language === 'en' ? 'Book Offer on WhatsApp Now' : 'احجز العرض عبر واتساب فوراً'}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setSelectedOffer(null); onNavigate('contact'); }}
                    className="w-full sm:flex-1 py-3.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Contact Us to Book This Offer' : 'تواصل معنا لحجز هذا العرض'}</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedOffer(null)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Close' : 'إغلاق'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
