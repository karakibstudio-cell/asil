import React, { useState } from 'react';
import { Search, Globe, Smartphone, Monitor, Sparkles, Check, AlertCircle } from 'lucide-react';

export interface SEOValues {
  titleAr: string;
  titleEn?: string;
  descriptionAr: string;
  descriptionEn?: string;
  keywords?: string;
  slug?: string;
}

interface AdminSEOEditorProps {
  values: SEOValues;
  onChange: (updated: SEOValues) => void;
  pagePathPrefix?: string;
  defaultTitleAr?: string;
  defaultTitleEn?: string;
  defaultDescAr?: string;
  defaultDescEn?: string;
}

export const AdminSEOEditor: React.FC<AdminSEOEditorProps> = ({
  values,
  onChange,
  pagePathPrefix = 'hotels',
  defaultTitleAr = 'برستيج لإدارة وتشغيل الفنادق',
  defaultTitleEn = 'Prestige Hotels Management',
  defaultDescAr = 'حجز فنادق مكة المكرمة والمدينة المنورة الأقرب للحرمين الشريفين وعروض الشركات والمجموعات.',
  defaultDescEn = 'Luxury hotel management and direct bookings for Makkah and Madinah hotels near the Holy Mosques.'
}) => {
  const [activeLang, setActiveLang] = useState<'ar' | 'en'>('ar');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  const currentTitle = activeLang === 'ar' 
    ? (values.titleAr || defaultTitleAr)
    : (values.titleEn || defaultTitleEn);

  const currentDesc = activeLang === 'ar'
    ? (values.descriptionAr || defaultDescAr)
    : (values.descriptionEn || defaultDescEn);

  const titleLen = currentTitle.length;
  const descLen = currentDesc.length;

  const getTitleStatus = () => {
    if (titleLen === 0) return { text: 'فارغ', color: 'text-stone-400' };
    if (titleLen < 35) return { text: 'قصير نسبياً (أقل من 35 حرفاً)', color: 'text-amber-500' };
    if (titleLen <= 65) return { text: 'طول مثالي لنتائج جوجل (35-65)', color: 'text-emerald-600' };
    return { text: 'طويل قد يقطعه محرك البحث (>65)', color: 'text-red-500' };
  };

  const getDescStatus = () => {
    if (descLen === 0) return { text: 'فارغ', color: 'text-stone-400' };
    if (descLen < 90) return { text: 'قصير نسبياً (أقل من 90 حرفاً)', color: 'text-amber-500' };
    if (descLen <= 165) return { text: 'طول مثالي للظهور في نتائج البحث (90-165)', color: 'text-emerald-600' };
    return { text: 'طويل قد يتم قطعه في المقتطف (>165)', color: 'text-red-500' };
  };

  const titleStatus = getTitleStatus();
  const descStatus = getDescStatus();

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-6 space-y-6">
      {/* Header & Language Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 border border-[#C9A24B]/30 flex items-center justify-center text-[#B38A34]">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
              <span>إعدادات تحسين محركات البحث (SEO & Google SERP)</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#C9A24B]/20 text-[#8C6D23] font-semibold">متقدم</span>
            </h4>
            <p className="text-xs text-stone-500">تخصيص العنوان والوصف التعريفي للظهور في نتائج بحث جوجل بدقة</p>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded-xl self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveLang('ar')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeLang === 'ar'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            🇸🇦 العربية (العنوان والوصف)
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('en')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeLang === 'en'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            🇬🇧 English (Title & Meta)
          </button>
        </div>
      </div>

      {/* Google-Style Live SERP Snippet Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
            <span>معاينة المقتطف في جوجل (Google Search Preview)</span>
          </span>

          <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded-md transition-all ${previewDevice === 'mobile' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-700'}`}
              title="معاينة الهاتف المحمول (Mobile)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded-md transition-all ${previewDevice === 'desktop' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-700'}`}
              title="معاينة سطح المكتب (Desktop)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real Google Card Box */}
        <div 
          className={`bg-white rounded-xl border border-stone-200 p-4 shadow-sm transition-all ${
            previewDevice === 'mobile' ? 'max-w-md' : 'w-full'
          }`}
          dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Site URL & Breadcrumb Header */}
          <div className="flex items-center gap-2 mb-1 text-[12px] text-stone-600">
            <div className="w-4 h-4 rounded-full bg-[#1c1917] flex items-center justify-center p-0.5 flex-shrink-0">
              <span className="text-[9px] font-bold text-[#C9A24B]">P</span>
            </div>
            <div className="flex items-center gap-1 truncate text-stone-800">
              <span className="font-semibold text-stone-900">
                {activeLang === 'ar' ? 'برستيج لإدارة وتشغيل الفنادق' : 'Prestige Hotels Management'}
              </span>
              <span className="text-stone-400">›</span>
              <span className="text-stone-500 truncate">
                https://prestige-ksa.web.app/{activeLang}/{pagePathPrefix}/{values.slug || 'hotel-name'}
              </span>
            </div>
          </div>

          {/* Clickable Blue Title */}
          <h5 className="text-[17px] sm:text-[19px] leading-snug font-medium text-[#1a0dab] hover:underline cursor-pointer mb-1 line-clamp-2">
            {currentTitle}
          </h5>

          {/* Snippet Description */}
          <p className="text-[13px] leading-relaxed text-[#4d5156] line-clamp-2 sm:line-clamp-3">
            {currentDesc}
          </p>
        </div>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 gap-4 pt-2">
        {/* Title Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <span>{activeLang === 'ar' ? 'عنوان الصفحة لمحركات البحث (<title>)' : 'SEO Page Title (<title>)'}</span>
              <span className="text-[11px] font-normal text-stone-500">(موصى به: 50-60 حرفاً)</span>
            </label>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold ${titleStatus.color}`}>
                {titleStatus.text}
              </span>
              <span className="text-xs font-mono font-semibold text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-md">
                {titleLen}/65
              </span>
            </div>
          </div>
          <input
            type="text"
            dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
            value={activeLang === 'ar' ? (values.titleAr || '') : (values.titleEn || '')}
            onChange={(e) => {
              if (activeLang === 'ar') {
                onChange({ ...values, titleAr: e.target.value });
              } else {
                onChange({ ...values, titleEn: e.target.value });
              }
            }}
            placeholder={activeLang === 'ar' ? defaultTitleAr : defaultTitleEn}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-xs sm:text-sm bg-white outline-none transition-all"
          />
        </div>

        {/* Description Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <span>{activeLang === 'ar' ? 'الوصف التعريفي (Meta Description)' : 'Meta Description'}</span>
              <span className="text-[11px] font-normal text-stone-500">(موصى به: 120-160 حرفاً)</span>
            </label>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold ${descStatus.color}`}>
                {descStatus.text}
              </span>
              <span className="text-xs font-mono font-semibold text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-md">
                {descLen}/165
              </span>
            </div>
          </div>
          <textarea
            rows={3}
            dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
            value={activeLang === 'ar' ? (values.descriptionAr || '') : (values.descriptionEn || '')}
            onChange={(e) => {
              if (activeLang === 'ar') {
                onChange({ ...values, descriptionAr: e.target.value });
              } else {
                onChange({ ...values, descriptionEn: e.target.value });
              }
            }}
            placeholder={activeLang === 'ar' ? defaultDescAr : defaultDescEn}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-xs sm:text-sm bg-white outline-none transition-all leading-relaxed"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5">
            الكلمات المفتاحية المستهدفة (Focus Keywords - مفصولة بفواصل)
          </label>
          <input
            type="text"
            dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
            value={values.keywords || ''}
            onChange={(e) => onChange({ ...values, keywords: e.target.value })}
            placeholder="فنادق مكة قريبة من الحرم, فنادق المدينة المنورة المركزية, حجز فنادق العمرة 1447, عقود فنادق برستيج"
            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 text-xs bg-white outline-none"
          />
        </div>
      </div>
    </div>
  );
};
