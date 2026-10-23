import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Hotel, Offer, ActivePage, SiteSettings } from './types';
import { DEFAULT_SITE_SETTINGS } from './data/defaultSettings';
import { safeSetLocalStorage } from './utils/storage';
import { INITIAL_HOTELS, INITIAL_OFFERS, INITIAL_SITE_SETTINGS } from './data/mockHotels';
import { subscribeToSupabaseRealtime, mapSupabaseRowToHotel } from './services/supabase';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { WhatsAppFAB } from './components/WhatsAppFAB';
import { EditModeFloatingBar } from './components/EditModeFloatingBar';
import { Toast, ToastMessage } from './components/Toast';
import type { LightboxMediaItem } from './components/Lightbox';
import { LiveContentProvider } from './context/LiveContentContext';
import { LanguageProvider } from './context/LanguageContext';
import { ScrollNavigationButton } from './components/ScrollNavigationButton';
import { 
  parseCurrentRoute, 
  syncRouteToUrl, 
  findHotelBySlugOrId, 
  getHotelSlug,
  detectLanguageFromUrl,
  AdminTab
} from './utils/routing';
import { updateFavicon } from './utils/favicon';
import { SEOHead } from './components/SEOHead';
import { HotelDetailSkeleton } from './components/HotelDetailSkeleton';
import { FirstVisitIntroOverlay } from './components/FirstVisitIntroOverlay';
import { PageErrorBoundary } from './components/PageErrorBoundary';

import { prefetchRoute, scheduleIdlePrefetch } from './utils/prefetch';
import type { AdminDashboardTab } from './pages/AdminDashboard';

// Safe lazy loader for chunks
function safeLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      window.location.reload();
      return new Promise(() => {}) as Promise<{ default: T }>;
    }
  });
}

import { HomePage } from './pages/HomePage';

// Route-level lazy loading for non-home pages: only load active chunk
const HotelsPage = safeLazy(() => import('./pages/HotelsPage').then(m => ({ default: m.HotelsPage })));
const HotelDetailPage = safeLazy(() => import('./pages/HotelDetailPage').then(m => ({ default: m.HotelDetailPage })));
const OffersPage = safeLazy(() => import('./pages/OffersPage').then(m => ({ default: m.OffersPage })));
const AboutPage = safeLazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = safeLazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const BookingPortalPage = safeLazy(() => import('./pages/BookingPortalPage').then(m => ({ default: m.BookingPortalPage })));
const InvoicePage = safeLazy(() => import('./pages/InvoicePage').then(m => ({ default: m.InvoicePage })));

// Lazy load modals & heavy overlays
const RoomBookingModal = safeLazy(() => import('./components/RoomBookingModal').then(m => ({ default: m.RoomBookingModal })));
const TrackBookingModal = safeLazy(() => import('./components/TrackBookingModal').then(m => ({ default: m.TrackBookingModal })));
const Lightbox = safeLazy(() => import('./components/Lightbox').then(m => ({ default: m.Lightbox })));
const AdminDashboard = safeLazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

export default function App() {
  // Synchronous route parsing on initial render so the correct page and hotel is selected immediately (0ms, no flash)
  const initialRoute = useRef(
    parseCurrentRoute(
      (() => {
        try {
          const saved = localStorage.getItem('diy_hotels');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch {}
        return INITIAL_HOTELS;
      })()
    )
  ).current;

  const [currentPage, setCurrentPage] = useState<ActivePage>(initialRoute.page);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(initialRoute.hotelId || null);
  const [selectedBookingHotelId, setSelectedBookingHotelId] = useState<string | undefined>(
    initialRoute.page === 'room-booking' ? initialRoute.hotelId : undefined
  );
  const [activeAdminTab, setActiveAdminTab] = useState<AdminDashboardTab>(initialRoute.adminTab || 'hotels');
  const [activeCityFilter, setActiveCityFilter] = useState<'all' | 'مكة المكرمة' | 'المدينة المنورة'>(
    initialRoute.cityFilter || 'all'
  );
  const [activeDistrictFilter, setActiveDistrictFilter] = useState<string | undefined>(initialRoute.districtFilter);
  const [activeOfferId, setActiveOfferId] = useState<string | undefined>(initialRoute.offerId);
  const [directPhotoUrl, setDirectPhotoUrl] = useState<string | null>(initialRoute.photoUrl || null);
  const [invoiceBookingId, setInvoiceBookingId] = useState<string | undefined>(initialRoute.invoiceBookingId);
  const [invoiceToken, setInvoiceToken] = useState<string | undefined>(initialRoute.invoiceToken);

  // Global Room Booking & Tracking Modals State
  const [isGlobalBookingModalOpen, setIsGlobalBookingModalOpen] = useState<boolean>(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState<boolean>(false);
  const [globalTrackCode, setGlobalTrackCode] = useState<string>('');

  // Data States - Instant Cache-First Hydration (0ms load time for all visitors)
  const [hotels, setHotels] = useState<Hotel[]>(() => {
    try {
      const saved = localStorage.getItem('diy_hotels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_HOTELS.length) return parsed;
      }
      if (INITIAL_HOTELS.length > 0) {
        safeSetLocalStorage('diy_hotels', INITIAL_HOTELS);
      }
    } catch {}
    return INITIAL_HOTELS;
  });

  const [offers, setOffers] = useState<Offer[]>(() => {
    try {
      const saved = localStorage.getItem('diy_offers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      if (INITIAL_OFFERS.length > 0) {
        safeSetLocalStorage('diy_offers', INITIAL_OFFERS);
      }
    } catch {}
    return INITIAL_OFFERS;
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('diy_site_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...INITIAL_SITE_SETTINGS, ...DEFAULT_SITE_SETTINGS, ...parsed };
      }
      if (INITIAL_SITE_SETTINGS) {
        safeSetLocalStorage('diy_site_settings', INITIAL_SITE_SETTINGS);
      }
    } catch {}
    return INITIAL_SITE_SETTINGS || DEFAULT_SITE_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFontsReady, setIsFontsReady] = useState<boolean>(false);

  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready
        .then(() => setIsFontsReady(true))
        .catch(() => setIsFontsReady(true));
    } else {
      setIsFontsReady(true);
    }
  }, []);

  // Admin Auth State with persistence & Firebase Auth sync
  const [isAdminLoggedIn, setIsAdminLoggedInState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('diy_admin_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const setIsAdminLoggedIn = useCallback((val: boolean) => {
    setIsAdminLoggedInState(val);
    try {
      if (val) {
        localStorage.setItem('diy_admin_logged_in', 'true');
      } else {
        localStorage.removeItem('diy_admin_logged_in');
        localStorage.setItem('diy_edit_mode', 'false');
      }
    } catch {}
  }, []);

  useEffect(() => {
    scheduleIdlePrefetch();
  }, []);

  useEffect(() => {
    // Only subscribe to Firebase Auth if an admin was logged in or URL targets /admin
    const wasLoggedIn = (() => {
      try {
        return localStorage.getItem('diy_admin_logged_in') === 'true';
      } catch {
        return false;
      }
    })();
    const isAdminRoute = typeof window !== 'undefined' && 
      (window.location.pathname.includes('/admin') || window.location.hash.includes('/admin'));

    if (wasLoggedIn || isAdminRoute) {
      let isSubscribed = true;
      let unsubscribeFn: (() => void) | null = null;
      import('./services/firebase').then(({ auth, onAuthStateChanged }) => {
        if (!isSubscribed) return;
        if (auth) {
          unsubscribeFn = onAuthStateChanged(auth, (user) => {
            if (user) {
              setIsAdminLoggedIn(true);
            }
          });
        }
      });
      return () => {
        isSubscribed = false;
        if (unsubscribeFn) unsubscribeFn();
      };
    }
  }, [setIsAdminLoggedIn]);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, text, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch data with Stale-While-Revalidate: 1 bundled read, instant cache-first, silent background revalidation
  const loadData = useCallback(async (isSilent = true, forceRefresh = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const { getSiteBundleFromDb } = await import('./services/firebase');
      const bundle = await getSiteBundleFromDb(forceRefresh);
      if (Array.isArray(bundle.hotels) && bundle.hotels.length > 0) {
        setHotels(bundle.hotels);
      }
      if (Array.isArray(bundle.offers) && bundle.offers.length > 0) {
        setOffers(bundle.offers);
      }
      if (bundle.siteSettings && typeof bundle.siteSettings === 'object') {
        setSiteSettings(bundle.siteSettings);
      }
    } catch (err) {
      console.error('Error loading site bundle:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  // Debounce ref to prevent rapid-fire re-fetches from realtime events
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Initial mount: instant display from memory/INITIAL_HOTELS (0ms) and silently revalidate from Supabase
    loadData(true, true);

    const unsubscribeSupabase = subscribeToSupabaseRealtime((payload) => {
      // 1. Instant Optimistic Realtime Sync for Hotels (0ms)
      if (payload.table === 'hotels') {
        if (payload.eventType === 'DELETE' && (payload.old?.id || payload.new?.id)) {
          const deleteId = payload.old?.id || payload.new?.id;
          setHotels(prev => {
            const next = prev.filter(h => h.id !== deleteId);
            safeSetLocalStorage('diy_hotels', next);
            return next;
          });
        } else if (payload.new) {
          try {
            const updatedHotel = mapSupabaseRowToHotel(payload.new);
            setHotels(prev => {
              const exists = prev.some(h => h.id === updatedHotel.id);
              let next: Hotel[];
              if (exists) {
                next = prev.map(h => h.id === updatedHotel.id ? { ...h, ...updatedHotel } : h);
              } else {
                next = [updatedHotel, ...prev];
              }
              safeSetLocalStorage('diy_hotels', next);
              return next;
            });
          } catch (e) {
            console.warn('[Realtime Hotels Sync] Map error:', e);
          }
        }
      }

      // 2. Instant Optimistic Realtime Sync for Offers (0ms)
      if (payload.table === 'offers') {
        if (payload.eventType === 'DELETE' && (payload.old?.id || payload.new?.id)) {
          const deleteId = payload.old?.id || payload.new?.id;
          setOffers(prev => {
            const next = prev.filter(o => o.id !== deleteId);
            safeSetLocalStorage('diy_offers', next);
            return next;
          });
        } else if (payload.new) {
          try {
            const updatedOffer = payload.new as Offer;
            setOffers(prev => {
              const exists = prev.some(o => o.id === updatedOffer.id);
              let next: Offer[];
              if (exists) {
                next = prev.map(o => o.id === updatedOffer.id ? { ...o, ...updatedOffer } : o);
              } else {
                next = [updatedOffer, ...prev];
              }
              safeSetLocalStorage('diy_offers', next);
              return next;
            });
          } catch (e) {
            console.warn('[Realtime Offers Sync] Map error:', e);
          }
        }
      }

      // 3. Instant Optimistic Realtime Sync for Site Settings
      if (payload.table === 'site_settings' && payload.new?.settings_data) {
        try {
          const raw = payload.new.settings_data;
          const fresh = typeof raw === 'object' ? raw : JSON.parse(raw);
          setSiteSettings(prev => {
            const next = { ...prev, ...fresh };
            safeSetLocalStorage('diy_site_settings', next);
            return next;
          });
        } catch {}
      }

      // Safety debounce background revalidation to guarantee consistency across all tables
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
      realtimeDebounceRef.current = setTimeout(() => {
        loadData(true, true);
      }, 1500);
    });

    return () => {
      unsubscribeSupabase();
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
    };
  }, [loadData]);

  // Sync document.title & Favicon with siteSettings
  useEffect(() => {
    const customTabTitle = siteSettings?.browserTabTitle?.trim();
    if (customTabTitle) {
      document.title = customTabTitle;
    } else if (siteSettings?.siteTitle) {
      document.title = `${siteSettings.siteTitle} | ${siteSettings.siteSubtitle || 'إدارة وتشغيل الفنادق والضيافة الفاخرة'}`;
    }
    const activeFavicon = siteSettings?.faviconUrl || siteSettings?.logoUrl;
    if (activeFavicon) {
      updateFavicon(activeFavicon);
    }
  }, [siteSettings]);

  // Window Management Safeguard: Disable F11 accidental fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdateSiteSettings = async (newSettings: SiteSettings) => {
    setSiteSettings(newSettings);
    try {
      const { saveSiteSettingsToDb } = await import('./services/firebase');
      await saveSiteSettingsToDb(newSettings);
    } catch (err) {
      console.error('Failed to sync site settings to DB:', err);
    }
  };

  // URL Route Sync for deep linking, bookmarking & browser back/forward support
  useEffect(() => {
    const handleRouteChange = () => {
      const route = parseCurrentRoute(hotels);
      setCurrentPage(route.page);
      
      if (route.page === 'hotel-detail' && route.hotelId) {
        setSelectedHotelId(route.hotelId);
      }
      if (route.page === 'room-booking' && route.hotelId) {
        setSelectedBookingHotelId(route.hotelId);
      }
      if (route.adminTab) {
        setActiveAdminTab(route.adminTab);
      }
      if (route.cityFilter) {
        setActiveCityFilter(route.cityFilter);
      }
      if (route.districtFilter) {
        setActiveDistrictFilter(route.districtFilter);
      }
      if (route.offerId) {
        setActiveOfferId(route.offerId);
      }
      if (route.photoUrl) {
        setDirectPhotoUrl(route.photoUrl);
      } else {
        setDirectPhotoUrl(null);
      }
      if (route.page === 'invoice') {
        setInvoiceBookingId(route.invoiceBookingId);
        setInvoiceToken(route.invoiceToken);
      }
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    handleRouteChange();

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [hotels]);

  // Universal Navigation Handler supporting sub-routes, options, and deep links
  const navigateTo = (
    page: ActivePage | 'hotels-makkah' | 'hotels-madinah' | 'bookings' | string, 
    optionsOrHotelId?: string | {
      hotelId?: string;
      adminTab?: AdminDashboardTab;
      city?: 'all' | 'مكة المكرمة' | 'المدينة المنورة';
      district?: string;
      offerId?: string;
    }
  ) => {
    let resolvedPage: ActivePage = 'home';
    let targetOptions: any = {};

    if (page === 'hotels-makkah') {
      resolvedPage = 'hotels';
      targetOptions = { cityFilter: 'مكة المكرمة' };
      setActiveCityFilter('مكة المكرمة');
    } else if (page === 'hotels-madinah') {
      resolvedPage = 'hotels';
      targetOptions = { cityFilter: 'المدينة المنورة' };
      setActiveCityFilter('المدينة المنورة');
    } else if (page === 'admin') {
      resolvedPage = 'admin';
      const tab = (typeof optionsOrHotelId === 'object' ? optionsOrHotelId?.adminTab : undefined) || activeAdminTab || 'hotels';
      targetOptions = { adminTab: tab };
      setActiveAdminTab(tab);
    } else if (page === 'hotel-detail') {
      resolvedPage = 'hotel-detail';
      const targetIdentifier = typeof optionsOrHotelId === 'string' ? optionsOrHotelId : optionsOrHotelId?.hotelId;
      if (targetIdentifier) {
        const targetHotel = findHotelBySlugOrId(hotels, targetIdentifier);
        if (targetHotel) {
          setSelectedHotelId(targetHotel.id);
          targetOptions = { hotel: targetHotel };
        } else {
          setSelectedHotelId(targetIdentifier);
        }
      }
    } else if (page === 'offers') {
      resolvedPage = 'offers';
      const offId = typeof optionsOrHotelId === 'string' ? optionsOrHotelId : optionsOrHotelId?.offerId;
      if (offId) {
        setActiveOfferId(offId);
        targetOptions = { offerId: offId };
      }
    } else if (page === 'room-booking' || page === 'bookings') {
      resolvedPage = 'room-booking';
      const targetIdentifier = typeof optionsOrHotelId === 'string' ? optionsOrHotelId : optionsOrHotelId?.hotelId;
      if (targetIdentifier) {
        const targetHotel = findHotelBySlugOrId(hotels, targetIdentifier);
        setSelectedBookingHotelId(targetHotel?.id || targetIdentifier);
        targetOptions = { hotel: targetHotel || { id: targetIdentifier } };
      } else {
        setSelectedBookingHotelId(undefined);
      }
    } else if (page === 'invoice') {
      resolvedPage = 'invoice';
      const bId = typeof optionsOrHotelId === 'string' ? optionsOrHotelId : (optionsOrHotelId as any)?.bookingId;
      const tok = (optionsOrHotelId as any)?.token;
      if (bId) setInvoiceBookingId(bId);
      if (tok) setInvoiceToken(tok);
      targetOptions = { invoiceBookingId: bId, invoiceToken: tok };
    } else if (['home', 'hotels', 'about', 'contact'].includes(page)) {
      resolvedPage = page as ActivePage;
      if (page === 'hotels' && typeof optionsOrHotelId === 'object' && optionsOrHotelId?.city) {
        targetOptions = { cityFilter: optionsOrHotelId.city };
        setActiveCityFilter(optionsOrHotelId.city);
      }
    }

    setCurrentPage(resolvedPage);
    syncRouteToUrl(resolvedPage, targetOptions);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHotel = (hotelIdOrSlug: string) => {
    navigateTo('hotel-detail', hotelIdOrSlug);
  };

  // Determine selected hotel strictly from ID/slug. NEVER fall back to hotels[0] to avoid flashing wrong hotel!
  const selectedHotel = selectedHotelId ? findHotelBySlugOrId(hotels, selectedHotelId) : undefined;

  // Auto-redirect legacy hash routes to clean canonical paths
  useEffect(() => {
    if (initialRoute.isLegacyHash) {
      syncRouteToUrl(currentPage, initialRoute.lang, {
        hotel: selectedHotel,
        hotelIdOrSlug: selectedHotelId || undefined,
        cityFilter: activeCityFilter !== 'all' ? activeCityFilter : undefined,
        adminTab: activeAdminTab,
        offerId: activeOfferId,
        photoUrl: directPhotoUrl || undefined
      }, true);
    }
  }, []);

  return (
    <LanguageProvider>
      <LiveContentProvider isAdminLoggedIn={isAdminLoggedIn} onShowToast={showToast}>
        {/* Dynamic SEO Meta, Canonical, Hreflang & JSON-LD Injection */}
        <SEOHead
          page={currentPage}
          lang={detectLanguageFromUrl()}
          hotel={selectedHotel}
          siteSettings={siteSettings}
        />

        {/* First-Visit Brand Intro & Loading Presentation */}
        <FirstVisitIntroOverlay
          siteSettings={siteSettings}
          isReady={isFontsReady && hotels.length > 0}
          onFinished={() => {
            const heroEl = document.getElementById('hero-slider-section');
            if (heroEl) {
              heroEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        />

        <div className="min-h-screen bg-[#F8F7F4] text-stone-900 flex flex-col font-cairo selection:bg-[#C9A24B] selection:text-white">
          {/* Toast Notifications */}
          <Toast toasts={toasts} onDismiss={removeToast} />

          {/* Direct Image Lightbox Modal if URL points to #/image?src=... */}
          {directPhotoUrl && (
            <React.Suspense fallback={null}>
              <Lightbox
                isOpen={Boolean(directPhotoUrl)}
                onClose={() => {
                  setDirectPhotoUrl(null);
                  navigateTo('home');
                }}
                mediaItems={[{
                  type: 'image',
                  url: directPhotoUrl,
                  title: 'معاينة الصورة'
                }]}
              />
            </React.Suspense>
          )}

          {/* Header Floating Glass Capsule */}
          <Header
            currentPage={currentPage}
            onNavigate={navigateTo}
            activeOffers={offers}
            isAdminLoggedIn={isAdminLoggedIn}
            siteSettings={siteSettings}
            onOpenBookingModal={() => setIsGlobalBookingModalOpen(true)}
            onOpenTrackModal={() => setIsTrackModalOpen(true)}
          />

          {/* Main Content Render */}
          <main className="flex-1">
            {currentPage === 'home' && (
              <HomePage
                hotels={hotels}
                activeOffers={offers}
                onNavigate={navigateTo}
                onSelectHotel={handleSelectHotel}
                siteSettings={siteSettings}
                onFilterDistrict={(city, district) => {
                  setActiveCityFilter(city as any);
                  setActiveDistrictFilter(district);
                  navigateTo('hotels', { city: city as any, district });
                }}
              />
            )}

            {currentPage !== 'home' && currentPage !== 'admin' && (
              <React.Suspense fallback={
                currentPage === 'room-booking' ? (
                  <div className="min-h-screen bg-[#F8F7F4] pt-24 pb-16" dir="rtl">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8 text-center space-y-3">
                      <div className="h-6 w-48 bg-stone-200/80 rounded-full mx-auto animate-pulse" />
                      <div className="h-10 w-96 max-w-full bg-stone-200 rounded-xl mx-auto animate-pulse" />
                      <div className="h-4 w-72 max-w-full bg-stone-200/60 rounded-lg mx-auto animate-pulse" />
                    </div>
                    <div className="max-w-5xl mx-auto px-4 sm:px-6">
                      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 sm:p-8 min-h-[640px] animate-pulse">
                        <div className="h-8 bg-stone-100 rounded-xl w-64 mx-auto mb-6" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="h-20 bg-stone-50 rounded-2xl border border-stone-200/60" />
                          <div className="h-20 bg-stone-50 rounded-2xl border border-stone-200/60" />
                          <div className="h-20 bg-stone-50 rounded-2xl border border-stone-200/60" />
                        </div>
                        <div className="h-64 bg-stone-50/60 rounded-2xl border border-stone-200/40" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[70vh] flex items-center justify-center bg-[#F8F7F4]">
                    <div className="w-8 h-8 rounded-full border-2 border-[#C9A24B] border-t-transparent animate-spin" />
                  </div>
                )
              }>
                {currentPage === 'hotels' && (
                <HotelsPage
                  hotels={hotels}
                  isLoading={isLoading}
                  onSelectHotel={handleSelectHotel}
                  initialCity={activeCityFilter}
                  initialDistrict={activeDistrictFilter}
                  siteSettings={siteSettings}
                />
              )}

              {currentPage === 'hotel-detail' && (
                <PageErrorBoundary onReset={() => navigateTo('hotels')}>
                  {selectedHotel ? (
                    <HotelDetailPage
                      hotel={selectedHotel}
                      allHotels={hotels}
                      onBack={() => navigateTo('hotels')}
                      onSelectHotel={handleSelectHotel}
                      onNavigate={navigateTo}
                      siteSettings={siteSettings}
                    />
                  ) : (
                    <HotelDetailSkeleton onBack={() => navigateTo('hotels')} />
                  )}
                </PageErrorBoundary>
              )}

              {currentPage === 'room-booking' && (
                <BookingPortalPage
                  hotels={hotels}
                  siteSettings={siteSettings}
                  onNavigate={navigateTo}
                  onSelectHotel={handleSelectHotel}
                  initialHotelId={selectedBookingHotelId}
                />
              )}

              {currentPage === 'offers' && (
                <OffersPage
                  offers={offers}
                  onNavigate={navigateTo}
                  siteSettings={siteSettings}
                  initialOfferId={activeOfferId}
                />
              )}

              {currentPage === 'about' && (
                <AboutPage 
                  onNavigate={navigateTo} 
                  siteSettings={siteSettings} 
                  onUpdateSiteSettings={handleUpdateSiteSettings}
                  onShowToast={showToast}
                  isAdminLoggedIn={isAdminLoggedIn}
                />
              )}

              {currentPage === 'contact' && (
                <ContactPage onShowToast={showToast} siteSettings={siteSettings} />
              )}

              {currentPage === 'invoice' && (
                <InvoicePage
                  bookingId={invoiceBookingId}
                  token={invoiceToken}
                  siteSettings={siteSettings}
                  onNavigateHome={() => navigateTo('home')}
                  onShowToast={showToast}
                />
              )}
              </React.Suspense>
            )}

            {currentPage === 'admin' && (
              <React.Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
                  <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#C9A24B]/30 shadow-xl flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#C9A24B]/15 border border-[#C9A24B]/30 flex items-center justify-center animate-spin">
                      <div className="w-6 h-6 border-2 border-[#C9A24B] border-t-transparent rounded-full" />
                    </div>
                    <span className="text-sm font-bold text-stone-700">جاري تحميل لوحة التحكم الذكية...</span>
                  </div>
                </div>
              }>
                <AdminDashboard
                  hotels={hotels}
                  offers={offers}
                  onRefreshData={loadData}
                  onShowToast={showToast}
                  onNavigateHome={() => navigateTo('home')}
                  isAdminLoggedIn={isAdminLoggedIn}
                  setIsAdminLoggedIn={setIsAdminLoggedIn}
                  siteSettings={siteSettings}
                  onUpdateSiteSettings={handleUpdateSiteSettings}
                  initialTab={activeAdminTab}
                />
              </React.Suspense>
            )}
          </main>

          {/* Floating Quick Scroll to Top / Bottom (Bottom-Left) */}
          <ScrollNavigationButton />

          {/* Floating WhatsApp Action Button (Left) */}
          <WhatsAppFAB
            channels={siteSettings?.channels}
            siteSettings={siteSettings}
            currentHotelName={currentPage === 'hotel-detail' && selectedHotel ? selectedHotel.name : undefined}
          />

          {/* Floating In-Place Live Edit Mode Bar (Right - Only for authenticated Admin) */}
          <EditModeFloatingBar
            currentPage={currentPage}
            onNavigate={navigateTo}
            onShowToast={showToast}
          />

          {/* Global Interactive Room Booking Modal (Lazy-Loaded only when requested) */}
          {hotels.length > 0 && siteSettings?.bookingModule?.enabled !== false && isGlobalBookingModalOpen && (
            <React.Suspense fallback={null}>
              <RoomBookingModal
                isOpen={isGlobalBookingModalOpen}
                onClose={() => setIsGlobalBookingModalOpen(false)}
                hotel={selectedHotel || hotels[0]}
                siteSettings={siteSettings}
                onSuccessToast={showToast}
                onOpenTrackModal={(code) => {
                  setGlobalTrackCode(code);
                  setIsTrackModalOpen(true);
                }}
              />
            </React.Suspense>
          )}

          {/* Global Track & Review Booking Modal (Lazy-Loaded only when requested) */}
          {isTrackModalOpen && (
            <React.Suspense fallback={null}>
              <TrackBookingModal
                isOpen={isTrackModalOpen}
                onClose={() => setIsTrackModalOpen(false)}
                initialCode={globalTrackCode}
                siteSettings={siteSettings}
              />
            </React.Suspense>
          )}

          {/* Footer */}
          <Footer onNavigate={navigateTo} activeOffers={offers} siteSettings={siteSettings} />
        </div>
      </LiveContentProvider>
    </LanguageProvider>
  );
}
