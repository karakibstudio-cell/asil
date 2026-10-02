import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Hotel, Offer, ActivePage, SiteSettings } from './types';
import { 
  getHotelsFromDb, 
  getOffersFromDb, 
  getSiteSettingsFromDb, 
  saveSiteSettingsToDb, 
  DEFAULT_SITE_SETTINGS,
  auth,
  onAuthStateChanged,
  safeSetLocalStorage
} from './services/firebase';
import { INITIAL_HOTELS, INITIAL_OFFERS, INITIAL_SITE_SETTINGS } from './data/mockHotels';
import { subscribeToSupabaseRealtime } from './services/supabase';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { WhatsAppFAB } from './components/WhatsAppFAB';
import { EditModeFloatingBar } from './components/EditModeFloatingBar';
import { Toast, ToastMessage } from './components/Toast';
import { Lightbox, LightboxMediaItem } from './components/Lightbox';
import { RoomBookingModal } from './components/RoomBookingModal';
import { TrackBookingModal } from './components/TrackBookingModal';
import { LiveContentProvider } from './context/LiveContentContext';
import { LanguageProvider } from './context/LanguageContext';
import { ScrollNavigationButton } from './components/ScrollNavigationButton';
import { 
  parseCurrentRoute, 
  syncRouteToUrl, 
  findHotelBySlugOrId, 
  getHotelSlug,
  AdminTab
} from './utils/routing';
import { updateFavicon } from './utils/favicon';

// Pages - all public visitor pages are bundled for instant (0ms) zero-latency navigation
import { HomePage } from './pages/HomePage';
import { HotelsPage } from './pages/HotelsPage';
import { HotelDetailPage } from './pages/HotelDetailPage';
import { OffersPage } from './pages/OffersPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { BookingPortalPage } from './pages/BookingPortalPage';
import type { AdminDashboardTab } from './pages/AdminDashboard';

// Safe lazy loader for the heavy Admin Dashboard only
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

// Lazy load ONLY the heavy Admin Dashboard so visitors load the page instantly
const AdminDashboard = safeLazy(() => 
  import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);

export default function App() {
  const [currentPage, setCurrentPage] = useState<ActivePage>('home');
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [selectedBookingHotelId, setSelectedBookingHotelId] = useState<string | undefined>(undefined);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminDashboardTab>('hotels');
  const [activeCityFilter, setActiveCityFilter] = useState<'all' | 'مكة المكرمة' | 'المدينة المنورة'>('all');
  const [activeDistrictFilter, setActiveDistrictFilter] = useState<string | undefined>(undefined);
  const [activeOfferId, setActiveOfferId] = useState<string | undefined>(undefined);
  const [directPhotoUrl, setDirectPhotoUrl] = useState<string | null>(null);

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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setIsAdminLoggedIn(true);
        }
      });
      return () => unsubscribe();
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

  // Fetch data from Supabase — skipCache=true ensures we always get fresh data from the DB
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const [fetchedHotels, fetchedOffers, fetchedSettings] = await Promise.all([
        getHotelsFromDb(true),
        getOffersFromDb(true),
        getSiteSettingsFromDb(true)
      ]);
      if (Array.isArray(fetchedHotels) && fetchedHotels.length > 0) {
        setHotels(fetchedHotels);
      }
      if (Array.isArray(fetchedOffers) && fetchedOffers.length > 0) {
        setOffers(fetchedOffers);
      }
      if (fetchedSettings && typeof fetchedSettings === 'object') {
        setSiteSettings(fetchedSettings);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  // Debounce ref to prevent rapid-fire re-fetches from realtime events
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Initial load always bypasses cache to get the freshest data from Supabase
    loadData(true);

    const unsubscribe = subscribeToSupabaseRealtime((payload) => {
      // Handle site_settings changes instantly (optimistic)
      if (payload.table === 'site_settings' && payload.new?.settings_data) {
        try {
          const raw = payload.new.settings_data;
          const fresh = typeof raw === 'object' ? raw : JSON.parse(raw);
          setSiteSettings(prev => ({ ...prev, ...fresh }));
          return;
        } catch {
          // Fall through to debounced reload
        }
      }

      // For hotels/offers changes, debounce to avoid hammering the API
      // skipCache=true ensures we bypass the in-memory cache on realtime events
      if (payload.table === 'hotels' || payload.table === 'offers' || payload.table === 'site_settings') {
        if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
        realtimeDebounceRef.current = setTimeout(() => {
          if (payload.table === 'hotels') {
            getHotelsFromDb(true).then(h => { if (h?.length) setHotels(h); });
          } else if (payload.table === 'offers') {
            getOffersFromDb(true).then(o => { if (o?.length) setOffers(o); });
          } else {
            getSiteSettingsFromDb(true).then(s => { if (s) setSiteSettings(s); });
          }
        }, 300);
      }
      // Ignore messages, reviews, districts, admin_users — no need to re-fetch main data
    });

    return () => {
      unsubscribe();
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

  const selectedHotel = (selectedHotelId && findHotelBySlugOrId(hotels, selectedHotelId)) || hotels[0];

  return (
    <LanguageProvider>
      <LiveContentProvider isAdminLoggedIn={isAdminLoggedIn} onShowToast={showToast}>
        <div className="min-h-screen bg-[#F8F7F4] text-stone-900 flex flex-col font-cairo selection:bg-[#C9A24B] selection:text-white">
          {/* Toast Notifications */}
          <Toast toasts={toasts} onDismiss={removeToast} />

          {/* Direct Image Lightbox Modal if URL points to #/image?src=... */}
          {directPhotoUrl && (
            <Lightbox
              isOpen={Boolean(directPhotoUrl)}
              onClose={() => {
                setDirectPhotoUrl(null);
                window.location.hash = '#/home';
              }}
              mediaItems={[{
                type: 'image',
                url: directPhotoUrl,
                title: 'معاينة الصورة'
              }]}
            />
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

              {currentPage === 'hotel-detail' && selectedHotel && (
                <HotelDetailPage
                  hotel={selectedHotel}
                  allHotels={hotels}
                  onBack={() => navigateTo('hotels')}
                  onSelectHotel={handleSelectHotel}
                  onNavigate={navigateTo}
                  siteSettings={siteSettings}
                />
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
            currentHotelName={currentPage === 'hotel-detail' && selectedHotel ? selectedHotel.name : undefined}
          />

          {/* Floating In-Place Live Edit Mode Bar (Right - Only for authenticated Admin) */}
          <EditModeFloatingBar
            currentPage={currentPage}
            onNavigate={navigateTo}
            onShowToast={showToast}
          />

          {/* Global Interactive Room Booking Modal */}
          {hotels.length > 0 && (
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
          )}

          {/* Global Track & Review Booking Modal */}
          <TrackBookingModal
            isOpen={isTrackModalOpen}
            onClose={() => setIsTrackModalOpen(false)}
            initialCode={globalTrackCode}
            siteSettings={siteSettings}
          />

          {/* Footer */}
          <Footer onNavigate={navigateTo} activeOffers={offers} siteSettings={siteSettings} />
        </div>
      </LiveContentProvider>
    </LanguageProvider>
  );
}
