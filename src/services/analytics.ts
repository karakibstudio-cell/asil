/**
 * Free Google Firebase Analytics Funnel Tracker
 * Safely tracks visitor progression through the 3-step booking flow
 */

let analyticsInstance: any = null;
let isInitialized = false;

async function getAnalyticsSafe() {
  if (isInitialized) return analyticsInstance;
  isInitialized = true;
  if (typeof window === 'undefined') return null;

  try {
    const { getApps } = await import('firebase/app');
    const apps = getApps();
    if (apps.length > 0) {
      const { getAnalytics, isSupported } = await import('firebase/analytics');
      const supported = await isSupported().catch(() => false);
      if (supported) {
        analyticsInstance = getAnalytics(apps[0]);
      }
    }
  } catch (err) {
    // Analytics not supported or blocked by ad-blocker
  }
  return analyticsInstance;
}

export type BookingFunnelEvent = 
  | 'booking_funnel_started'
  | 'booking_dates_selected'
  | 'booking_room_selected'
  | 'booking_details_reached'
  | 'booking_submitted'
  | 'booking_confirmed'
  | 'booking_error';

export interface BookingFunnelParams {
  hotel_id?: string;
  hotel_name?: string;
  hotel_city?: string;
  room_id?: string;
  room_name?: string;
  check_in?: string;
  check_out?: string;
  nights?: number;
  rooms_count?: number;
  guests_count?: number;
  meal_plan_id?: string;
  meal_plan_name?: string;
  total_amount?: number;
  currency?: string;
  booking_code?: string;
  error_message?: string;
  step_number?: number;
  [key: string]: any;
}

/**
 * Log a funnel step to Firebase Analytics with safe fallback
 */
export async function trackBookingFunnel(
  event: BookingFunnelEvent,
  params: BookingFunnelParams = {}
): Promise<void> {
  try {
    const analytics = await getAnalyticsSafe();
    if (analytics) {
      const { logEvent } = await import('firebase/analytics');
      logEvent(analytics, event, {
        ...params,
        timestamp: Date.now(),
        page_location: typeof window !== 'undefined' ? window.location.href : ''
      });
    }
    
    // In development or for audit trail, log friendly message
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.search.includes('debug=true'))) {
      console.log(`📊 [Analytics Funnel] ${event}:`, params);
    }
  } catch {
    // Fail silently so user booking flow is NEVER disrupted
  }
}
