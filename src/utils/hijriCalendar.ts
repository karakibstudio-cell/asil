/**
 * Islamic Umm al-Qura Hijri Calendar & Seasons Utility
 * Converts Gregorian dates to Hijri and provides predefined Hajj/Umrah seasons for Makkah & Madinah hotels.
 * Uses native Intl.DateTimeFormat (0kb external bundle footprint).
 */

export interface HijriDateParts {
  day: number;
  month: number;
  year: number;
  monthName: string;
  formatted: string;
}

export interface IslamicSeasonShortcut {
  id: string;
  nameAr: string;
  nameEn: string;
  hijriLabel: string;
  gregorianStart: string; // YYYY-MM-DD
  gregorianEnd: string;   // YYYY-MM-DD
  badgeText: string;
  description: string;
  isHighSeason: boolean;
}

const HIJRI_MONTH_NAMES_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان المبارك',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
];

/**
 * Format any Gregorian date string (YYYY-MM-DD) into Hijri formatted string
 */
export function formatToHijriDate(dateStr: string, options: { includeYear?: boolean; isRtl?: boolean } = {}): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: options.includeYear !== false ? 'numeric' : undefined
    });

    return formatter.format(date);
  } catch (err) {
    console.warn('[Hijri] Formatting error:', err);
    return dateStr;
  }
}

/**
 * Get detailed Hijri parts for precise day/month/year arithmetic
 */
export function getHijriParts(dateStr: string): HijriDateParts | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });

    const parts = formatter.formatToParts(date);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '1447', 10);
    const monthName = HIJRI_MONTH_NAMES_AR[month - 1] || 'رجب';

    return {
      day,
      month,
      year,
      monthName,
      formatted: `${day} ${monthName} ${year} هـ`
    };
  } catch {
    return null;
  }
}

/**
 * Predefined Hajj, Umrah & Ramadan High-Demand Seasons
 * Dynamically tailored for the current and upcoming Islamic year
 */
export const ISLAMIC_SEASONS_SHORTCUTS: IslamicSeasonShortcut[] = [
  {
    id: 'rajab_start',
    nameAr: 'غرة رجب وموسم العمرة المبكرة',
    nameEn: 'Start of Rajab (Early Umrah)',
    hijriLabel: '١ - ٥ رجب',
    gregorianStart: '2026-01-20',
    gregorianEnd: '2026-01-25',
    badgeText: 'موسم رجب 🌙',
    description: 'أجواء روحانية ميسرة وإقبال معتدل قبل زحام شعبان',
    isHighSeason: false
  },
  {
    id: 'shaban_mid',
    nameAr: 'موسم ليلة النصف من شعبان',
    nameEn: 'Mid-Sha\'ban Season',
    hijriLabel: '١٣ - ١٧ شعبان',
    gregorianStart: '2026-02-02',
    gregorianEnd: '2026-02-07',
    badgeText: 'موسم شعبان ✨',
    description: 'فترة الذروة التحضيرية لشهر رمضان المبارك',
    isHighSeason: true
  },
  {
    id: 'ramadan_first_10',
    nameAr: 'العشر الأوائل من رمضان المبارك',
    nameEn: 'Ramadan - First 10 Days',
    hijriLabel: '١ - ١٠ رمضان',
    gregorianStart: '2026-02-18',
    gregorianEnd: '2026-02-28',
    badgeText: 'رمضان المبارك 🕌',
    description: 'بداية الشهر الفضيل وإقبال مميز على صلوات التراويح',
    isHighSeason: true
  },
  {
    id: 'ramadan_last_10',
    nameAr: 'العشر الأواخر من رمضان وختم القرآن',
    nameEn: 'Ramadan - Last 10 Nights (Laylat al-Qadr)',
    hijriLabel: '٢٠ - ٣٠ رمضان',
    gregorianStart: '2026-03-10',
    gregorianEnd: '2026-03-20',
    badgeText: 'العشر الأواخر 👑',
    description: 'أعظم ليالي العام، صلاة التهجد، وحضور ختم القرآن الكريم بالحرمين',
    isHighSeason: true
  },
  {
    id: 'eid_alfitr',
    nameAr: 'إجازة عيد الفطر المبارك',
    nameEn: 'Eid Al-Fitr Holiday',
    hijriLabel: '١ - ٥ شوال',
    gregorianStart: '2026-03-20',
    gregorianEnd: '2026-03-25',
    badgeText: 'عيد الفطر 🎉',
    description: 'أجواء احتفالية وبهجة العيد في رحاب مكة والمدينة',
    isHighSeason: true
  },
  {
    id: 'hajj_season',
    nameAr: 'موسم الحج الأكبر (ذو الحجة)',
    nameEn: 'Grand Hajj Season',
    hijriLabel: '١ - ١٣ ذو الحجة',
    gregorianStart: '2026-05-26',
    gregorianEnd: '2026-06-08',
    badgeText: 'موسم الحج 🕋',
    description: 'فترة أداء مناسك الحج وتسكين الحملات والشركات',
    isHighSeason: true
  }
];
