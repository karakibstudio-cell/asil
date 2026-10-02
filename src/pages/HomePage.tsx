import React, { useState, useEffect } from 'react';
import { Hotel, Offer, ActivePage, SiteSettings, HotelReview, HeroSlide } from '../types';
import { HotelCard } from '../components/HotelCard';
import { FeaturedHotelsCarousel } from '../components/FeaturedHotelsCarousel';
import { OurHotelsAccordion } from '../components/OurHotelsAccordion';
import { AddReviewModal } from '../components/AddReviewModal';
import { HeroSlider } from '../components/HeroSlider';
import { IntroVideoSection } from '../components/IntroVideoSection';
import { CompanyStoryTeaser } from '../components/CompanyStoryTeaser';
import { IntegratedServices } from '../components/IntegratedServices';
import { EditableText } from '../components/EditableText';
import { getReviewsFromDb } from '../services/firebase';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { 
  Building2, 
  MapPin,
  Users, 
  Award, 
  HeartHandshake, 
  ArrowLeft, 
  ShieldCheck, 
  Compass, 
  Star, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  PhoneCall, 
  MessageSquarePlus, 
  Tag, 
  Quote 
} from 'lucide-react';

interface HomePageProps {
  hotels: Hotel[];
  activeOffers: Offer[];
  onNavigate: (page: ActivePage, hotelId?: string) => void;
  onSelectHotel: (hotelId: string) => void;
  siteSettings: SiteSettings;
  onFilterDistrict?: (city: string, district: string) => void;
}

// Interactive CountUp component
const CountUp: React.FC<{ end: number; duration?: number; suffix?: string; prefix?: string }> = ({
  end,
  duration = 2000,
  suffix = '',
  prefix = ''
}) => {
  const { language } = useLanguage();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{prefix}{(count ?? 0).toLocaleString(language === 'en' ? 'en-US' : 'ar-SA')}{suffix}</span>;
};

export const HomePage: React.FC<HomePageProps> = ({
  hotels,
  activeOffers,
  onNavigate,
  onSelectHotel,
  siteSettings,
  onFilterDistrict
}) => {
  const { language, t, translateDynamic, isRtl } = useLanguage();
  const [currentTestimonialIdx, setCurrentTestimonialIdx] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [liveReviews, setLiveReviews] = useState<HotelReview[]>([]);

  const loadLiveReviews = async () => {
    try {
      const allRevs = await getReviewsFromDb();
      const approved = allRevs.filter((r) => r.status === 'approved');
      if (approved.length > 0) {
        setLiveReviews(approved);
      }
    } catch (e) {
      console.warn('Failed loading reviews for homepage:', e);
    }
  };

  useEffect(() => {
    // Defer review loading to idle time — not critical for first paint
    const scheduleLoad = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 200);
    const handle = scheduleLoad(() => loadLiveReviews());
    return () => {
      if (typeof cancelIdleCallback !== 'undefined' && typeof handle === 'number') {
        cancelIdleCallback(handle);
      }
    };
  }, []);

  // Live approved reviews only (no mock data)
  const displayedTestimonials = liveReviews.length > 0
    ? liveReviews.map((rev) => ({
        id: rev.id,
        name: rev.authorName,
        role: rev.country || (rev as any).countryOrTitle || '',
        hotel: rev.hotelName || '',
        quote: rev.comment,
        stars: rev.rating || 5,
        avatar: (rev as any).avatarUrl || ''
      }))
    : [];

  // Auto slide testimonials every 6.5 seconds
  useEffect(() => {
    if (displayedTestimonials.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentTestimonialIdx((prev) => (prev + 1) % displayedTestimonials.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [displayedTestimonials.length]);

  const activeTestimonial = displayedTestimonials.length > 0
    ? (displayedTestimonials[currentTestimonialIdx] || displayedTestimonials[0])
    : null;

  const handleNextTestimonial = () => {
    setCurrentTestimonialIdx((prev) => (prev + 1) % displayedTestimonials.length);
  };

  const handlePrevTestimonial = () => {
    setCurrentTestimonialIdx((prev) => (prev - 1 + displayedTestimonials.length) % displayedTestimonials.length);
  };

  const activeHotels = React.useMemo(() => {
    return hotels
      .filter((h) => h.isActive !== false)
      .sort((a, b) => {
        const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : 9999;
        const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : 9999;
        if (orderA !== orderB) return orderA - orderB;
        return (b.rating || 0) - (a.rating || 0);
      });
  }, [hotels]);

  const featuredHotels = activeHotels.slice(0, 6);

  const scrollToStats = () => {
    const el = document.getElementById('stats-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const hasActiveOffers = activeOffers && activeOffers.some((o) => o.isActive);

  // Synthesize ads marked for hero slider into the slides list
  const mergedHeroSlides = React.useMemo(() => {
    const originalSlides = siteSettings?.heroSlides || [];
    const adSlides: HeroSlide[] = (activeOffers || [])
      .filter((o) => o.isActive && o.showInHeroSlides)
      .map((o, idx) => ({
        id: `ad_slide_${o.id}`,
        mediaType: o.mediaType,
        imageUrl: o.mediaUrl,
        videoUrl: o.videoUrl,
        videoThumbnail: o.mediaUrl,
        badge: o.badgeText || (o.showDiscount && o.discountPercentage ? `خصم ${o.discountPercentage}٪` : 'إعلان خاص'),
        title: o.title,
        subtitle: o.shortDescription,
        showBadge: true,
        showTitle: true,
        showSubtitle: true,
        showPrimaryButton: true,
        primaryButtonText: 'تفاصيل الإعلان',
        primaryButtonAction: 'offers',
        showSecondaryButton: true,
        secondaryButtonText: 'تواصل عبر واتساب',
        secondaryButtonAction: 'whatsapp',
        order: 9000 + idx,
        isActive: true
      }));

    return [...originalSlides, ...adSlides];
  }, [siteSettings?.heroSlides, activeOffers]);

  return (
    <div id="home-page" className="min-h-screen bg-[#F8F7F4] text-stone-900 overflow-hidden">
      {/* 1. Cinematic Intro Video (Customized from Admin - Top priority when enabled) */}
      <IntroVideoSection
        siteSettings={siteSettings}
        onNavigate={onNavigate}
        onSkip={() => {
          const heroEl = document.getElementById('hero-slider-section');
          if (heroEl) heroEl.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 2. Dynamic Interactive Hero Slider with Multi-Images & Transitions */}
      <HeroSlider
        slides={mergedHeroSlides}
        onNavigate={onNavigate}
        siteSettings={siteSettings}
        onScrollToNext={scrollToStats}
      />

      {/* 2. Featured Hotels Carousel Banner (Directly after Hero) */}
      <FeaturedHotelsCarousel 
        hotels={activeHotels}
        onSelectHotel={onSelectHotel}
      />

      {/* 3. Stats Section with Count-Up */}
      {siteSettings?.homeSections?.showStats !== false && (
        <section id="stats-section" className="py-16 sm:py-20 bg-white border-y border-[#E8E2D8] relative">
          <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8"
            >
              <motion.div 
                whileHover={{ y: -4 }}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] hover:border-[#C9A24B] transition-all shadow-xs"
              >
                <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/15 flex items-center justify-center mb-4 text-[#B38A34]">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 mb-2 font-mono">
                  <CountUp end={50} prefix="+" duration={2200} />
                </div>
                <span className="text-xs sm:text-sm text-stone-600 font-medium">
                  <EditableText 
                    contentKey="home.stats.item1.label"
                    fallback="فندق معتمد ومرخص بمكة والمدينة"
                  />
                </span>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4 }}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] hover:border-[#C9A24B] transition-all shadow-xs"
              >
                <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/15 flex items-center justify-center mb-4 text-[#B38A34]">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#B38A34] mb-2 font-mono">
                  <CountUp end={120} prefix="+" suffix={language === 'en' ? 'k+' : ' ألف'} duration={2500} />
                </div>
                <span className="text-xs sm:text-sm text-stone-600 font-medium">
                  <EditableText 
                    contentKey="home.stats.item2.label"
                    fallback="حاج ومعتمر تشرفنا بخدمتهم"
                  />
                </span>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4 }}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] hover:border-[#C9A24B] transition-all shadow-xs"
              >
                <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/15 flex items-center justify-center mb-4 text-[#B38A34]">
                  <Award className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 mb-2 font-mono">
                  <CountUp end={15} prefix="+" suffix={language === 'en' ? ' Years' : ' عاماً'} duration={2000} />
                </div>
                <span className="text-xs sm:text-sm text-stone-600 font-medium">
                  <EditableText 
                    contentKey="home.stats.item3.label"
                    fallback="من الريادة والخبرة المتخصصة"
                  />
                </span>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4 }}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] hover:border-[#C9A24B] transition-all shadow-xs"
              >
                <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/15 flex items-center justify-center mb-4 text-[#B38A34]">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#B38A34] mb-2 font-mono">
                  <CountUp end={99} suffix={language === 'en' ? '%' : '٪'} duration={2200} />
                </div>
                <span className="text-xs sm:text-sm text-stone-600 font-medium">
                  <EditableText 
                    contentKey="home.stats.item4.label"
                    fallback="نسبة رضا وثقة ضيوف الرحمن"
                  />
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* 4. Featured Hotels Grid Section (6 Cards) */}
      {siteSettings?.homeSections?.showFeaturedHotels !== false && (
        <section id="featured-hotels-section" className="py-20 sm:py-24 max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4"
          >
            <div>
              <div className="flex items-center gap-2 text-[#B38A34] text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
                <Building2 className="w-4 h-4" />
                <EditableText 
                  contentKey="home.hotels.badge"
                  fallback={siteSettings?.homeSections?.featuredHotelsBadge || "فخامة وروحانية"}
                />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-cairo font-bold text-stone-900">
                <EditableText 
                  contentKey="home.hotels.title"
                  fallback={siteSettings?.homeSections?.featuredHotelsTitle || "فنادقنا المميزة في مكة والمدينة"}
                  as="span"
                />
              </h2>
              <div className="text-sm text-stone-600 mt-2 max-w-xl">
                <EditableText 
                  contentKey="home.hotels.subtitle"
                  fallback={siteSettings?.homeSections?.featuredHotelsSubtitle || "مجموعة مختارة بعناية من أفخم الفنادق المطلة على الكعبة المشرفة وساحات المسجد النبوي، تضمن لكم راحة لا تضاهى."}
                  as="span"
                  multiline={true}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              id="featured-hotels-view-all"
              onClick={() => onNavigate('hotels')}
              className="px-6 py-3 rounded-full bg-white hover:bg-[#C9A24B] text-stone-800 hover:text-white font-bold text-sm border border-stone-300 hover:border-[#C9A24B] transition-all duration-300 flex items-center gap-2 shrink-0 group shadow-sm cursor-pointer"
            >
              <EditableText 
                contentKey="home.hotels.viewAllBtn"
                fallback="شاهد كل الفنادق"
                inline={true}
              />
              <span>({activeHotels.length})</span>
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'group-hover:-translate-x-1' : 'rotate-180 group-hover:translate-x-1'} transition-transform`} />
            </motion.button>
          </motion.div>

          {/* 6 Hotels Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {featuredHotels.map((hotel, index) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onClick={onSelectHotel}
                index={index}
              />
            ))}
          </motion.div>
        </section>
      )}

      {/* 5. Company Story Teaser */}
      {siteSettings?.homeSections?.showStoryTeaser !== false && (
        <CompanyStoryTeaser 
          onNavigate={onNavigate} 
          settings={siteSettings?.storyTeaser} 
        />
      )}

      {/* 6. Integrated Services Section */}
      {siteSettings?.homeSections?.showIntegratedServices !== false && (
        <IntegratedServices 
          onNavigate={onNavigate} 
          settings={siteSettings?.integratedServices} 
        />
      )}

      {/* 6.5. About Us & Headquarters Showcase Section (من نحن والمقر الرئيسي) */}
      <section id="about-us-home-section" className="py-20 sm:py-24 bg-white border-y border-[#E8E2D8] relative overflow-hidden">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Right Column: Mission, Vision, and Licensing */}
            <motion.div 
              initial={{ opacity: 0, x: isRtl ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs sm:text-sm font-bold border border-[#C9A24B]/30 shadow-xs">
                <Building2 className="w-4 h-4" />
                <span>{siteSettings?.aboutUs?.badge || 'عن شركة برستيج'}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-cairo font-extrabold text-stone-900 leading-tight">
                {siteSettings?.aboutUs?.title || 'برستيج.. حيث تلتقي فخامة الضيافة بروحانية المكان'}
              </h2>

              <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
                {siteSettings?.aboutUs?.subtitle || 'منذ عام 2010، انطلقت "برستيج لإدارة وتشغيل الفنادق" من قلب العاصمة المقدسة لتُعيد صياغة مفهوم الضيافة وخدمة ضيوف الرحمن، حيث ندير ونشغل نخبة من أرقى فنادق مكة المكرمة والمدينة المنورة.'}
              </p>

              {/* Value Pillars Mini Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] hover:border-[#C9A24B] transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center mb-2 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="font-cairo font-bold text-xs sm:text-sm text-stone-900 mb-1">المصداقية المطلقة</h4>
                  <p className="text-[11px] text-stone-500 leading-normal">مطابقة تامة للمسافات والمستويات الفندقية المتفق عليها دون مفاجآت.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] hover:border-[#C9A24B] transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center mb-2 font-bold">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <h4 className="font-cairo font-bold text-xs sm:text-sm text-stone-900 mb-1">فريق ميداني 24/7</h4>
                  <p className="text-[11px] text-stone-500 leading-normal">تواجد مدار الساعة بمكة والمدينة لاستقبال وتسكين الوفود والمعتمرين.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] hover:border-[#C9A24B] transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center mb-2 font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <h4 className="font-cairo font-bold text-xs sm:text-sm text-stone-900 mb-1">عقود حصرية مباشرة</h4>
                  <p className="text-[11px] text-stone-500 leading-normal">أفضل الأسعار الموسمية والسنوية مباشرة مع كبرى فنادق الحرمين.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 flex-wrap">
                <button
                  id="home-explore-about-btn"
                  onClick={() => onNavigate('about')}
                  className="px-6 py-3.5 rounded-full bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
                >
                  <span>تعرّف على مسيرة وتاريخ برستيج</span>
                  <ArrowLeft className={`w-4 h-4 ${isRtl ? 'group-hover:-translate-x-1' : 'rotate-180 group-hover:translate-x-1'} transition-transform`} />
                </button>

                <button
                  onClick={() => onNavigate('contact')}
                  className="px-6 py-3.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm transition-colors cursor-pointer"
                >
                  <span>تواصل مع المقر الرئيسي</span>
                </button>
              </div>
            </motion.div>

            {/* Left Column: Office Details, License & Photo Showcase */}
            <motion.div 
              initial={{ opacity: 0, x: isRtl ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5"
            >
              <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-white p-6 sm:p-8 border border-stone-800 shadow-2xl relative overflow-hidden space-y-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A24B]/10 rounded-full blur-3xl pointer-events-none" />

                {/* Top Badge & City */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/20 text-[#DFBE72] flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-cairo font-bold text-sm sm:text-base text-stone-100">
                        {siteSettings?.aboutUs?.officeTitle || 'المقر الرئيسي لشركة برستيج'}
                      </h4>
                      <span className="text-xs text-[#DFBE72]">
                        {siteSettings?.aboutUs?.officeCity || 'مكة المكرمة'}
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold">
                    مفتوح 24/7
                  </span>
                </div>

                {/* Office Location Address */}
                <div className="space-y-2 bg-stone-800/60 p-4 rounded-2xl border border-stone-700/60">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#C9A24B] shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
                      {siteSettings?.aboutUs?.officeAddress || 'أبراج وقف الملك عبدالعزيز - مجمع أبراج البيت، طريق أجياد، مكة المكرمة'}
                    </p>
                  </div>

                  {siteSettings?.aboutUs?.officeMapUrl && (
                    <a
                      href={siteSettings.aboutUs.officeMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#DFBE72] hover:text-white pt-1 hover:underline transition-colors"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>عرض اللوكيشن في خرائط Google Maps</span>
                    </a>
                  )}
                </div>

                {/* Official Licensing Card */}
                {siteSettings?.aboutUs?.showLicense !== false && (
                  <div className="p-4 rounded-2xl bg-[#C9A24B]/10 border border-[#C9A24B]/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C9A24B] text-stone-950 flex items-center justify-center shrink-0 shadow-md">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#DFBE72]">ترخيص رسمي معتمد:</span>
                        <span className="font-mono font-bold text-xs bg-stone-900 px-2 py-0.5 rounded text-white border border-stone-700">
                          {siteSettings?.aboutUs?.licenseNumber || '73104928'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 truncate mt-0.5">
                        {siteSettings?.aboutUs?.licenseAuthority || 'مرخصون من وزارة الحج والعمرة والهيئة السعودية للسياحة'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 7. Our Hotels Accordion by City and Districts */}
      {siteSettings?.homeSections?.showHotelsAccordion !== false && (
        <OurHotelsAccordion
          hotels={activeHotels}
          onSelectHotel={onSelectHotel}
          onFilterDistrict={(city, district) => {
            if (onFilterDistrict) {
              onFilterDistrict(city, district);
            } else {
              onNavigate('hotels');
            }
          }}
        />
      )}

      {/* 8. Active Offers Banner (if any active offers exist) */}
      {(hasActiveOffers && siteSettings?.homeSections?.showOffersBanner !== false) && (
        <section id="offers-spotlight-section" className="py-14 bg-gradient-to-r from-[#DFBE72]/15 via-[#C9A24B]/20 to-[#98752B]/15 border-b border-[#E8E2D8]">
          <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-right">
              <div className="w-14 h-14 rounded-2xl bg-[#C9A24B] text-white flex items-center justify-center shrink-0 shadow-md">
                <Tag className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#B38A34] uppercase">
                  <EditableText
                    contentKey="home.offers.badge"
                    fallback="إعلانات وبوسترات حصرية"
                    inline={true}
                  />
                </span>
                <h3 className="font-cairo font-black text-xl sm:text-2xl text-stone-900">
                  <EditableText
                    contentKey="home.offers.title"
                    fallback="تصفح أحدث إعلانات وبوسترات مواسم برستيج الفندقية"
                    as="span"
                  />
                </h3>
              </div>
            </div>

            <button
              onClick={() => onNavigate('offers')}
              className="px-7 py-3.5 rounded-full bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>
                <EditableText
                  contentKey="home.offers.btn"
                  fallback="استعراض كافة الإعلانات"
                  inline={true}
                />
              </span>
              <ArrowLeft className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </section>
      )}

      {/* 9. Testimonials Section (Guest Reviews & Feedback) */}
      {siteSettings?.homeSections?.showTestimonials !== false && (
        <section id="testimonials-section" className="py-20 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12 text-center sm:text-right">
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#B38A34] uppercase tracking-wider mb-2 block">
                <EditableText 
                  contentKey="home.testimonials.badge"
                  fallback="شهادات نعتز بها"
                />
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-cairo font-bold text-stone-900">
                <EditableText 
                  contentKey="home.testimonials.title"
                  fallback="آراء وتجارب ضيوف الرحمن"
                  as="span"
                />
              </h2>
            </div>

          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-[#FAF8F5] text-[#B38A34] font-bold text-xs sm:text-sm border border-[#C9A24B] shadow-xs flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{t('home.testimonials.addReview', 'أضف تقييمك وتجربتك')}</span>
          </button>
        </div>

        <div className="relative bg-white rounded-3xl border border-[#E8E2D8] p-8 sm:p-12 shadow-sm overflow-hidden">
          {activeTestimonial ? (
            <>
              {/* Decorative Quote Mark */}
              <div className="absolute top-6 left-8 text-8xl text-[#C9A24B]/10 font-serif pointer-events-none select-none">
                “
              </div>

              {/* Navigation Arrows for Testimonials */}
              {displayedTestimonials.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevTestimonial}
                    className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-stone-50 border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center transition-all z-20 shadow-xs cursor-pointer`}
                    aria-label={t('hero.prev', 'السابق')}
                  >
                    {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleNextTestimonial}
                    className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-stone-50 border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center transition-all z-20 shadow-xs cursor-pointer`}
                    aria-label={t('hero.next', 'التالي')}
                  >
                    {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                </>
              )}

              <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-8">
                {activeTestimonial.avatar ? (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-[#DFBE72] to-[#C9A24B] mb-6 shadow-md shrink-0">
                    <img
                      src={activeTestimonial.avatar}
                      alt={activeTestimonial.name}
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : null}

                {/* Stars */}
                <div className="flex items-center gap-1.5 mb-4">
                  {[...Array(activeTestimonial.stars || 5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#C9A24B] text-[#C9A24B]" />
                  ))}
                </div>

                {/* Quote Text */}
                <blockquote className="text-base sm:text-xl text-stone-700 font-cairo font-medium leading-relaxed max-w-3xl mb-5">
                  "{translateDynamic(activeTestimonial.quote)}"
                </blockquote>

                {/* Guest Name & Details */}
                <h4 className="font-cairo font-bold text-lg text-stone-900">
                  {translateDynamic(activeTestimonial.name)}
                </h4>

                {(activeTestimonial.role || activeTestimonial.hotel) && (
                  <span className="text-xs text-[#B38A34] mt-1 font-semibold">
                    {[
                      activeTestimonial.role ? translateDynamic(activeTestimonial.role) : '',
                      activeTestimonial.hotel 
                        ? (language === 'en' ? `Stayed at ${translateDynamic(activeTestimonial.hotel)}` : `الإقامة في ${activeTestimonial.hotel}`)
                        : ''
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </span>
                )}

                {/* Slider Dots Navigation */}
                {displayedTestimonials.length > 1 && (
                  <div className="flex items-center gap-2 mt-8">
                    {displayedTestimonials.map((_, idx) => (
                      <button
                        key={idx}
                        id={`testimonial-dot-${idx}`}
                        onClick={() => setCurrentTestimonialIdx(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          currentTestimonialIdx === idx
                            ? 'w-8 bg-[#C9A24B]'
                            : 'w-2 bg-stone-300 hover:bg-stone-400'
                        }`}
                        aria-label={`الشهادة رقم ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-cairo font-bold text-stone-900 mb-1">
                  {language === 'en' ? 'Be the first to share your experience with Prestige!' : 'كن أول من يشارك تجربته وتقييمه لشركة برستيج!'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                  {language === 'en'
                    ? 'We value your feedback and strive to deliver the highest hospitality standards in Makkah & Madinah.'
                    : 'نسعد دائماً باستقبال تقييماتكم وانطباعاتكم عن إقامتكم وخدمات الضيافة الفندقية في مكة المكرمة والمدينة المنورة.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>{t('home.testimonials.addReview', 'أضف تقييمك وتجربتك')}</span>
              </button>
            </div>
          )}
        </div>
      </section>
      )}

      {/* 10. Why Choose Us / Trust & Services Banner */}
      {siteSettings?.homeSections?.showWhyChooseUs !== false && (
        <section className="py-16 bg-[#FAF8F5] border-t border-[#E8E2D8]">
          <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <motion.div 
                whileHover={{ y: -6, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-[#E8E2D8] shadow-2xs hover:border-[#C9A24B] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-cairo font-bold text-stone-900 text-base mb-1">
                    <EditableText 
                      contentKey="home.trust.feature1.title"
                      fallback="حجوزات مؤكدة ومباشرة"
                    />
                  </h4>
                  <div className="text-xs text-stone-600 leading-relaxed">
                    <EditableText 
                      contentKey="home.trust.feature1.desc"
                      fallback="تعاقدات حصرية مع كبرى سلاسل الفنادق تضمن لك التسكين الفوري المؤكد."
                      multiline={true}
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -6, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-[#E8E2D8] shadow-2xs hover:border-[#C9A24B] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center shrink-0">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-cairo font-bold text-stone-900 text-base mb-1">
                    <EditableText 
                      contentKey="home.trust.feature2.title"
                      fallback="القرب الفائق من الحرم"
                    />
                  </h4>
                  <div className="text-xs text-stone-600 leading-relaxed">
                    <EditableText 
                      contentKey="home.trust.feature2.desc"
                      fallback="فنادق تبعد خطوات معدودة عن ساحات الحرمين لراحة كبار السن والأسر والأطفال."
                      multiline={true}
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -6, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-[#E8E2D8] shadow-2xs hover:border-[#C9A24B] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-cairo font-bold text-stone-900 text-base mb-1">
                    <EditableText 
                      contentKey="home.trust.feature3.title"
                      fallback="فريق ميداني على مدار 24/7"
                    />
                  </h4>
                  <div className="text-xs text-stone-600 leading-relaxed">
                    <EditableText 
                      contentKey="home.trust.feature3.desc"
                      fallback="ممثلونا متواجدون في مكة والمدينة لاستقبالكم وتسهيل إجراءات الدخول والإقامة."
                      multiline={true}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Review Submission Modal */}
      <AddReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        hotels={hotels}
      />
    </div>
  );
};

const TESTIMONIALS_DATA: any[] = [];
