import React, { useState, useEffect, useCallback } from 'react';
import { Hotel, Offer, ActivePage, SiteSettings } from './types';
import { 
  getHotelsFromDb, 
  getOffersFromDb, 
  getSiteSettingsFromDb, 
  saveSiteSettingsToDb, 
  DEFAULT_SITE_SETTINGS,
  auth,
  onAuthStateChanged
} from './services/firebase';
import { INITIAL_HOTELS, INITIAL_OFFERS, INITIAL_SITE_SETTINGS } from './data/mockHotels';
import { subscribeToSupabaseRealtime } from './services/supabase';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { WhatsAppFAB } from './components/WhatsAppFAB';
import { EditModeFloatingBar } from './components/EditModeFloatingBar';
import { Toast, ToastMessage } from './components/Toast';
import { LiveContentProvider } from './context/LiveContentContext';
import { LanguageProvider } from './context/LanguageContext';
import { 
  parseCurrentRoute, 
  syncRouteToUrl, 
  findHotelBySlugOrId, 
  getHotelSlug 
} from './utils/routing';
import { updateFavicon } from './utils/favicon';

// Pages
import { HomePage } from './pages/HomePage';
import { HotelsPage } from './pages/HotelsPage';
import { HotelDetailPage } from './pages/HotelDetailPage';
import { OffersPage } from './pages/OffersPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AdminDashboard } from './pages/AdminDashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState<ActivePage>('home');
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  // Data States - Instant Cache-First Hydration (0ms load time for all visitors)
  const [hotels, setHotels] = useState<Hotel[]>(() => {
    try {
      const saved = localStorage.getItem('diy_hotels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Seed localStorage immediately for subsequent zero-latency reads by any hook
      if (INITIAL_HOTELS.length > 0) {
        localStorage.setItem('diy_hotels', JSON.stringify(INITIAL_HOTELS));
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
        localStorage.setItem('diy_offers', JSON.stringify(INITIAL_OFFERS));
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
        localStorage.setItem('diy_site_settings', JSON.stringify(INITIAL_SITE_SETTINGS));
      }
    } catch {}
    return INITIAL_SITE_SETTINGS || DEFAULT_SITE_SETTINGS;
  });

  // Zero-latency initial load: Never block or show full-screen lag on mount
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

  // Fetch data from Supabase (primary cloud database) with instant local cache
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const [fetchedHotels, fetchedOffers, fetchedSettings] = await Promise.all([
        getHotelsFromDb(),
        getOffersFromDb(),
        getSiteSettingsFromDb()
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

  useEffect(() => {
    // Initial load: ALWAYS silent background sync so UI is 100% interactive at 0ms
    loadData(true);

    // Realtime live subscription: automatically updates on any database change in Supabase
    const unsubscribe = subscribeToSupabaseRealtime((payload) => {
      console.log('[Supabase Realtime Sync] Received change in:', payload.table, payload.eventType);
      if (payload.table === 'site_settings' && payload.new?.settings_data) {
        try {
          const raw = payload.new.settings_data;
          const fresh = typeof raw === 'object' ? raw : JSON.parse(raw);
          setSiteSettings(prev => ({ ...prev, ...fresh }));
        } catch {
          loadData(true);
        }
      } else {
        loadData(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Sync document.title (browser tab title) & dynamic Favicon with siteSettings
  useEffect(() => {
    const customTabTitle = siteSettings?.browserTabTitle?.trim();
    if (customTabTitle) {
      document.title = customTabTitle;
    } else if (siteSettings?.siteTitle) {
      document.title = `${siteSettings.siteTitle} | ${siteSettings.siteSubtitle || 'إدارة وتشغيل الفنادق والضيافة الفاخرة'}`;
    }
    // Dynamically update browser tab favicon to match company logo or custom favicon
    const activeFavicon = siteSettings?.faviconUrl || siteSettings?.logoUrl;
    if (activeFavicon) {
      updateFavicon(activeFavicon);
    }
  }, [siteSettings]);

  // Window Management Safeguard: Disable F11 accidental fullscreen to maintain taskbar & window controls
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
    // 0ms Optimistic UI update: instant update on all pages & components
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
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    handleRouteChange();

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [hotels]);

  // Navigation Handler
  const navigateTo = (page: ActivePage, hotelIdOrSlug?: string) => {
    setCurrentPage(page);
    if (page === 'hotel-detail' && hotelIdOrSlug) {
      const targetHotel = findHotelBySlugOrId(hotels, hotelIdOrSlug);
      if (targetHotel) {
        setSelectedHotelId(targetHotel.id);
        syncRouteToUrl('hotel-detail', targetHotel);
      } else {
        setSelectedHotelId(hotelIdOrSlug);
        window.location.hash = `#/hotel/${hotelIdOrSlug}`;
      }
    } else {
      syncRouteToUrl(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHotel = (hotelIdOrSlug: string) => {
    navigateTo('hotel-detail', hotelIdOrSlug);
  };

  // Selected hotel instance (resolves by ID or slug)
  const selectedHotel = (selectedHotelId && findHotelBySlugOrId(hotels, selectedHotelId)) || hotels[0];

  return (
    <LanguageProvider>
      <LiveContentProvider isAdminLoggedIn={isAdminLoggedIn} onShowToast={showToast}>
        <div className="min-h-screen bg-[#F8F7F4] text-stone-900 flex flex-col font-cairo selection:bg-[#C9A24B] selection:text-white">
          {/* Toast Notifications */}
          <Toast toasts={toasts} onDismiss={removeToast} />

          {/* Header Floating Glass Capsule */}
          <Header
            currentPage={currentPage}
            onNavigate={navigateTo}
            activeOffers={offers}
            isAdminLoggedIn={isAdminLoggedIn}
            siteSettings={siteSettings}
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
              />
            )}

            {currentPage === 'hotels' && (
              <HotelsPage
                hotels={hotels}
                isLoading={isLoading}
                onSelectHotel={handleSelectHotel}
              />
            )}

            {currentPage === 'hotel-detail' && selectedHotel && (
              <HotelDetailPage
                hotel={selectedHotel}
                allHotels={hotels}
                onBack={() => navigateTo('hotels')}
                onSelectHotel={handleSelectHotel}
                onNavigate={navigateTo}
              />
            )}

            {currentPage === 'offers' && (
              <OffersPage
                offers={offers}
                onNavigate={navigateTo}
                siteSettings={siteSettings}
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
              />
            )}
          </main>

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

          {/* Footer */}
          <Footer onNavigate={navigateTo} activeOffers={offers} siteSettings={siteSettings} />
        </div>
      </LiveContentProvider>
    </LanguageProvider>
  );
}
