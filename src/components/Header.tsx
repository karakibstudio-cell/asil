import React, { useState, useEffect } from 'react';
import { ActivePage, Offer, SiteSettings } from '../types';
import { 
  Menu, 
  X, 
  Sparkles,
  Globe
} from 'lucide-react';
import { EditableText } from './EditableText';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentPage: ActivePage;
  onNavigate: (page: ActivePage, hotelId?: string) => void;
  activeOffers: Offer[];
  isAdminLoggedIn?: boolean;
  siteSettings: SiteSettings;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  activeOffers,
  isAdminLoggedIn,
  siteSettings,
}) => {
  const { language, toggleLanguage, t, isRtl } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMouseNearTop, setIsMouseNearTop] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);

  // Enforce pure Light Mode across the app
  useEffect(() => {
    try {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('diy_theme');
      localStorage.setItem('diy_theme', 'light');
    } catch {}
  }, []);

  useEffect(() => {
    setLogoLoadError(false);
  }, [siteSettings?.logoUrl]);

  useEffect(() => {
    const handleScroll = () => {
      // Threshold for scrolling down: 40px
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 50) {
        setIsMouseNearTop(true);
      } else if (e.clientY > 100) {
        setIsMouseNearTop(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const navItems = [
    { id: 'home' as ActivePage, label: t('nav.home', 'الرئيسية') },
    { id: 'hotels' as ActivePage, label: t('nav.hotels', 'الفنادق') },
    { id: 'offers' as ActivePage, label: t('nav.offers', 'العروض والمناسبات') },
    { id: 'about' as ActivePage, label: t('nav.about', 'من نحن') },
    { id: 'contact' as ActivePage, label: t('nav.contact', 'تواصل معنا') },
  ];

  const handleNavClick = (page: ActivePage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // The floating header capsule is always visible at the top for immediate access to navigation & language switcher
  const isVisible = true;

  return (
    <div
      id="floating-header-wrapper"
      className={`fixed top-3 sm:top-5 inset-x-3 sm:inset-x-6 md:inset-x-8 max-w-7xl lg:max-w-[1400px] xl:max-w-[1600px] mx-auto z-50 transition-all duration-500 ease-out ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : '-translate-y-28 opacity-0 pointer-events-none'
      }`}
    >
      <header
        id="main-header"
        className={`w-full bg-white/95 backdrop-blur-2xl border border-stone-200/90 shadow-lg shadow-stone-900/5 transition-all duration-300 ${
          mobileMenuOpen ? 'rounded-3xl' : 'rounded-full'
        }`}
      >
        <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          {/* Logo & Site Title Section */}
          <div
            id="brand-logo-button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none shrink-0"
          >
            {/* Custom Uploaded Logo or Fallback Emblem */}
            {siteSettings?.logoUrl && !logoLoadError ? (
              <img
                src={siteSettings.logoUrl}
                alt={siteSettings.siteTitle || 'شعار الموقع'}
                onError={() => setLogoLoadError(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-contain bg-white border border-[#C9A24B]/30 shadow-xs"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#DFBE72] via-[#C9A24B] to-[#98752B] p-[1.5px] shadow-xs group-hover:shadow-md group-hover:shadow-[#C9A24B]/30 transition-all duration-300 shrink-0">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#B38A34] group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
            )}

            <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
              <span className="font-cairo font-bold text-base sm:text-lg text-stone-900 tracking-tight leading-tight group-hover:text-[#B38A34] transition-colors">
                <EditableText 
                  contentKey="header.brand.title"
                  fallback={siteSettings?.siteTitle || (language === 'en' ? 'Prestige Hotels Management' : 'برستيج لإدارة وتشغيل الفنادق')}
                  inline={true}
                />
              </span>
              <span className="text-[10px] sm:text-[11px] text-stone-600 font-medium tracking-wide leading-tight hidden xs:inline">
                <EditableText 
                  contentKey="header.brand.subtitle"
                  fallback={siteSettings?.siteSubtitle || (language === 'en' ? 'Hotel Management & Operations' : 'إدارة وتشغيل الفنادق والضيافة الفاخرة')}
                  inline={true}
                />
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Capsule pills) */}
          <nav
            id="desktop-navigation"
            className="hidden lg:flex items-center gap-1 bg-stone-100/90 p-1 rounded-full border border-stone-200/80"
          >
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#98752B] font-bold shadow-xs border border-stone-200/80'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-white/80'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Actions: Language Switcher & Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Switcher - Compact Small Icon Button */}
            <button
              id="header-language-toggle-btn"
              type="button"
              onClick={toggleLanguage}
              className="p-1.5 sm:p-2 rounded-full bg-stone-100 hover:bg-[#C9A24B]/15 text-stone-700 hover:text-[#B38A34] border border-stone-200/90 hover:border-[#C9A24B]/50 text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer relative flex items-center justify-center"
              title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
              aria-label="تبديل اللغة Language Switcher"
            >
              <Globe className="w-4 h-4 text-[#B38A34]" />
              <span className="sr-only">{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              id="mobile-menu-toggle-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-full text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-stone-800" />
              ) : (
                <Menu className="w-5 h-5 text-stone-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation-drawer"
            className="lg:hidden border-t border-stone-200/80 px-4 pt-3 pb-4 rounded-b-3xl bg-white/98 backdrop-blur-xl animate-fadeIn"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-link-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl ${isRtl ? 'text-right' : 'text-left'} text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#C9A24B]/15 text-[#B38A34] font-bold border-r-4 border-[#C9A24B]'
                        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-950'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />}
                  </button>
                );
              })}

              {/* Mobile Language Switcher Row */}
              <div className="pt-2 mt-1 border-t border-stone-200 flex items-center justify-between px-1">
                <span className="text-xs text-stone-600 font-semibold">
                  {language === 'ar' ? 'اللغة / Language:' : 'Language / اللغة:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    toggleLanguage();
                    setMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#C9A24B]/20 text-[#B38A34] text-xs font-bold border border-stone-200 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

