import React, { useState } from 'react';
import { 
  formatToHijriDate, 
  ISLAMIC_SEASONS_SHORTCUTS, 
  IslamicSeasonShortcut 
} from '../utils/hijriCalendar';
import { Moon, Calendar, Sparkles, Check } from 'lucide-react';

interface HijriDatePickerWidgetProps {
  checkIn: string;
  checkOut: string;
  onSelectDates: (checkIn: string, checkOut: string) => void;
  isRtl?: boolean;
}

export const HijriDatePickerWidget: React.FC<HijriDatePickerWidgetProps> = ({
  checkIn,
  checkOut,
  onSelectDates,
  isRtl = true
}) => {
  const [calendarMode, setCalendarMode] = useState<'both' | 'hijri' | 'gregorian'>('both');

  const hijriCheckIn = checkIn ? formatToHijriDate(checkIn) : '';
  const hijriCheckOut = checkOut ? formatToHijriDate(checkOut) : '';

  return (
    <div className="bg-gradient-to-br from-amber-50/60 via-white to-amber-50/40 rounded-2xl border border-amber-200/80 p-4 sm:p-4.5 space-y-3.5 mb-5 shadow-2xs">
      {/* Top Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center shrink-0">
            <Moon className="w-4 h-4 fill-[#C9A24B]/20" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-900 block">
              التقويم الهجري الذكي والمواسم المباركة (أم القرى)
            </span>
            <span className="text-[11px] text-stone-500 block">
              اختر فترتك بالتقويم الهجري أو حدد أحد مواسم الحج والعمرة بنقرة واحدة
            </span>
          </div>
        </div>

        {/* Calendar Mode Segmented Toggle */}
        <div className="flex items-center p-1 bg-stone-100/90 rounded-xl border border-stone-200 text-[11px] font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setCalendarMode('both')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              calendarMode === 'both'
                ? 'bg-white text-[#98752B] shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            الميلادي والهجري معاً
          </button>
          <button
            type="button"
            onClick={() => setCalendarMode('hijri')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              calendarMode === 'hijri'
                ? 'bg-[#C9A24B] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Moon className="w-3 h-3" />
            <span>الهجري فقط</span>
          </button>
        </div>
      </div>

      {/* Live Bilingual Dates Presentation Bar */}
      {(checkIn || checkOut) && (
        <div className="bg-white rounded-xl p-3 border border-amber-200/60 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-500">فترة الإقامة المحددة:</span>
            {checkIn && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-950 font-bold border border-amber-200">
                <span className="text-[#B38A34]">الدخول:</span>
                <span>{hijriCheckIn}</span>
                {calendarMode !== 'hijri' && (
                  <span dir="ltr" className="font-mono text-[11px] text-stone-600">({checkIn})</span>
                )}
              </span>
            )}
            <span className="text-stone-400">➔</span>
            {checkOut && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-950 font-bold border border-amber-200">
                <span className="text-[#B38A34]">المغادرة:</span>
                <span>{hijriCheckOut}</span>
                {calendarMode !== 'hijri' && (
                  <span dir="ltr" className="font-mono text-[11px] text-stone-600">({checkOut})</span>
                )}
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#B38A34] font-bold">
            تقويم أم القرى الرسمي 🌙
          </span>
        </div>
      )}

      {/* Predefined Islamic Seasons & High Demand Shortcuts */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-bold text-stone-600 block">
          مواسم الحج والعمرة والشهور الفضيلة (تحديد فوري):
        </span>
        <div className="flex flex-wrap gap-2">
          {ISLAMIC_SEASONS_SHORTCUTS.map((season) => {
            const isSelected = checkIn === season.gregorianStart && checkOut === season.gregorianEnd;
            return (
              <button
                key={season.id}
                type="button"
                onClick={() => onSelectDates(season.gregorianStart, season.gregorianEnd)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#C9A24B] text-white border-[#C9A24B] shadow-xs'
                    : 'bg-white hover:bg-amber-50 text-stone-800 border-stone-200 hover:border-[#C9A24B]/50'
                }`}
                title={season.description}
              >
                <span>{season.badgeText}</span>
                <span className="text-[10px] text-stone-500 font-normal">({season.hijriLabel})</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
