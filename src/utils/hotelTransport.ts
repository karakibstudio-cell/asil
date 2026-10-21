/**
 * Helper utilities for hotel distance parsing, formatting, and transport modes (Walking vs Shuttle Bus)
 */

export type HotelViewType = 'إطلالة حرم' | 'ساحة الحرم' | 'إطلالة على المدينة';

export const HOTEL_VIEW_OPTIONS: { value: HotelViewType; label: string; desc: string }[] = [
  { value: 'إطلالة حرم', label: 'إطلالة حرم (مباشرة)', desc: 'إطلالة أمامية على الحرم الشريف' },
  { value: 'ساحة الحرم', label: 'ساحة الحرم', desc: 'مواجهة لساحات وأبواب الحرم الشريف' },
  { value: 'إطلالة على المدينة', label: 'إطلالة على المدينة', desc: 'إطلالة بانورامية مع حافلات ترددية مستمرة 24/7' },
];

/**
 * Intelligently parse distance input:
 * If user enters "1.5" or 1.5, it understands 1500 meters.
 * If user enters "1500", it understands 1500 meters.
 * If user enters "0.8", it understands 800 meters.
 * If user enters "350", it understands 350 meters.
 */
export function parseDistanceInput(input: string | number): number {
  if (typeof input === 'number') {
    if (isNaN(input) || input <= 0) return 0;
    if (input < 20) {
      return Math.round(input * 1000);
    }
    return Math.round(input);
  }

  const str = String(input).trim().replace(/,/g, '.');
  if (!str) return 0;

  // Extract first floating-point number
  const match = str.match(/\d+(?:\.\d+)?/);
  if (!match) return 0;

  const num = parseFloat(match[0]);
  if (isNaN(num) || num <= 0) return 0;

  // If number is small (< 20, e.g. 1.5, 2, 0.8), treat as kilometers
  if (num < 20) {
    return Math.round(num * 1000);
  }
  return Math.round(num);
}

/**
 * Format distance in a human-friendly way:
 * E.g. 1500 -> "1.5 كم", 350 -> "350 م"
 */
export function formatDistanceDisplay(meters: number, language: string = 'ar'): string {
  if (!meters || meters <= 0) {
    return language === 'en' ? 'Directly on Haram courtyard' : 'على ساحة الحرم مباشرة';
  }
  if (meters >= 1000) {
    const km = (meters / 1000).toFixed(1).replace(/\.0$/, '');
    return language === 'en' ? `${km} km` : `${km} كم`;
  }
  return language === 'en' ? `${meters}m` : `${meters} م`;
}

/**
 * Determine if hotel access is by shuttle bus:
 * City view hotels or hotels with distance >= 1000m or explicit bus transport
 */
export function isBusTransportation(hotel: {
  distanceToHaram?: number;
  walkingTimeMinutes?: number;
  transportType?: 'walking' | 'bus';
  viewType?: string;
  location?: {
    viewType?: string;
    transportType?: 'walking' | 'bus';
  };
}): boolean {
  if (hotel.transportType === 'bus' || hotel.location?.transportType === 'bus') return true;
  if (hotel.transportType === 'walking' || hotel.location?.transportType === 'walking') return false;

  const view = (hotel.viewType || hotel.location?.viewType || '').trim();
  if (view === 'إطلالة على المدينة' || view.includes('مدينة')) return true;
  if ((hotel.distanceToHaram || 0) >= 1000) return true;
  return false;
}

/**
 * Format transportation time and label
 */
export function formatTransportText(hotel: {
  distanceToHaram?: number;
  walkingTimeMinutes?: number;
  transportType?: 'walking' | 'bus';
  viewType?: string;
  location?: {
    viewType?: string;
    transportType?: 'walking' | 'bus';
  };
}, language: string = 'ar'): { text: string; mode: 'walking' | 'bus' } {
  const isBus = isBusTransportation(hotel);
  const minutes = hotel.walkingTimeMinutes || (isBus ? 5 : 3);

  if (isBus) {
    return {
      mode: 'bus',
      text: language === 'en'
        ? `${minutes} min by shuttle bus`
        : `${minutes} دقائق بالحافلة للحرم (ترددي 24/7)`
    };
  }

  return {
    mode: 'walking',
    text: language === 'en'
      ? `${minutes} min walk to Haram`
      : `${minutes} دقائق سيراً للحرم`
  };
}
