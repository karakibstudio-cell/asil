/**
 * Instant Route & Asset Prefetcher
 * Triggered on link hover, touch, or idle scheduler so page transitions feel 0ms instant.
 */

const prefetchedRoutes = new Set<string>();

export function prefetchRoute(route: string): void {
  if (!route || prefetchedRoutes.has(route)) return;
  prefetchedRoutes.add(route);

  try {
    switch (route) {
      case 'hotels':
      case 'hotels-makkah':
      case 'hotels-madinah':
        import('../pages/HotelsPage');
        break;
      case 'hotel-detail':
        import('../pages/HotelDetailPage');
        break;
      case 'offers':
        import('../pages/OffersPage');
        break;
      case 'about':
        import('../pages/AboutPage');
        break;
      case 'contact':
        import('../pages/ContactPage');
        break;
      case 'bookings':
      case 'room-booking':
        import('../pages/BookingPortalPage');
        import('../components/RoomBookingModal');
        break;
      case 'invoice':
        import('../pages/InvoicePage');
        break;
      case 'admin':
        import('../pages/AdminDashboard');
        break;
    }
  } catch {
    // Ignore prefetch errors in offline/background contexts
  }
}

/**
 * Schedule prefetching of high-priority public routes during browser idle time
 */
export function scheduleIdlePrefetch(): void {
  if (typeof window === 'undefined') return;
  // Delay background route prefetching until main thread is completely idle after load
  setTimeout(() => {
    const idleFn = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 1000));
    idleFn(() => {
      prefetchRoute('hotels');
      prefetchRoute('hotel-detail');
      prefetchRoute('about');
      prefetchRoute('offers');
    });
  }, 1200);
}
