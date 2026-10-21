import React, { useState, useEffect, useRef } from 'react';
import { useLiveContent } from '../context/LiveContentContext';
import { useLanguage } from '../context/LanguageContext';
import { DICTIONARY } from '../context/LanguageContext';
import { 
  Edit3, 
  Check, 
  X, 
  Loader2, 
  Palette, 
  Type, 
  Bold, 
  Plus, 
  Minus, 
  RotateCcw, 
  AlertTriangle,
  Languages,
  Sparkles
} from 'lucide-react';

interface EditableTextProps {
  contentKey: string;
  fallback: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  inline?: boolean;
}

// Quick brand color presets
const COLOR_PRESETS = [
  { name: 'أسود', hex: '#111111', border: '#444444' },
  { name: 'أبيض', hex: '#FFFFFF', border: '#CCCCCC' },
  { name: 'ذهبي', hex: '#C9A24B', border: '#DFBE72' },
  { name: 'بيچ', hex: '#DFBE72', border: '#C9A24B' },
];

// Quick font size presets
const FONT_SIZE_PRESETS = [
  { label: 'صغير', value: '14px', num: 14 },
  { label: 'عادي', value: '16px', num: 16 },
  { label: 'كبير', value: '22px', num: 22 },
  { label: 'كبير جداً', value: '32px', num: 32 },
];

// Font weights
const FONT_WEIGHT_PRESETS = [
  { label: 'عادي', value: '400' },
  { label: 'شبه غامق', value: '600' },
  { label: 'غامق', value: '700' },
];

export const EditableText: React.FC<EditableTextProps> = ({
  contentKey,
  fallback,
  as: Component = 'span',
  multiline = false,
  className = '',
  inputClassName = '',
  inline = false,
}) => {
  const { getContent, getContentText, updateContent, isEditMode } = useLiveContent();
  const { language, translateAsync } = useLanguage();

  const otherLang: 'ar' | 'en' = language === 'ar' ? 'en' : 'ar';
  const currentItem = getContent(contentKey, fallback);

  // Exact Display Order:
  // 1. Saved text for current language
  // 2. Default text from translation files (DICTIONARY or props)
  // 3. Fallback language
  const textToShow = getContentText(contentKey, fallback, language);

  // Check if translation is missing in the other language
  const otherLangSaved = currentItem?.[otherLang]?.trim();
  const otherLangDict = DICTIONARY[contentKey]?.[otherLang]?.trim();
  const hasOtherTranslation = Boolean(otherLangSaved || otherLangDict);

  const currentColor = currentItem.color;
  const currentFontSize = currentItem.fontSize;
  const currentFontWeight = currentItem.fontWeight;

  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(textToShow);
  const [draftOtherText, setDraftOtherText] = useState(otherLangSaved || otherLangDict || '');
  const [showOtherLangField, setShowOtherLangField] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const [draftColor, setDraftColor] = useState<string | undefined>(currentColor);
  const [draftFontSize, setDraftFontSize] = useState<string | undefined>(currentFontSize);
  const [draftFontWeight, setDraftFontWeight] = useState<string | undefined>(currentFontWeight);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync state with incoming content when not actively editing
  useEffect(() => {
    if (!isEditing) {
      setDraftText(textToShow);
      setDraftOtherText(otherLangSaved || otherLangDict || '');
      setDraftColor(currentColor);
      setDraftFontSize(currentFontSize);
      setDraftFontWeight(currentFontWeight);
    }
  }, [textToShow, otherLangSaved, otherLangDict, currentColor, currentFontSize, currentFontWeight, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ('setSelectionRange' in inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraftText(textToShow);
    setDraftOtherText(otherLangSaved || otherLangDict || '');
    setDraftColor(currentColor);
    setDraftFontSize(currentFontSize);
    setDraftFontWeight(currentFontWeight);
    setShowOtherLangField(!hasOtherTranslation);
    setIsEditing(true);
  };

  const handleAutoTranslate = async () => {
    if (!draftText.trim()) return;
    setIsTranslating(true);
    try {
      const trans = await translateAsync(draftText.trim());
      if (trans && trans !== draftText) {
        setDraftOtherText(trans);
        setShowOtherLangField(true);
      }
    } catch (err) {
      console.warn('Auto translate error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const payload: any = {
      [language]: draftText,
      text: language === 'ar' ? draftText : (currentItem.ar || draftText),
      color: draftColor,
      fontSize: draftFontSize,
      fontWeight: draftFontWeight,
    };

    if (draftOtherText && draftOtherText.trim()) {
      payload[otherLang] = draftOtherText.trim();
    }

    // Close modal instantly (0ms instant response)
    setIsEditing(false);

    // Save into the currently displayed language only (and other language if filled)
    updateContent(contentKey, payload, language).catch((err) => {
      console.error('Failed to save editable text in background:', err);
    });
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDraftText(textToShow);
    setDraftOtherText(otherLangSaved || otherLangDict || '');
    setDraftColor(currentColor);
    setDraftFontSize(currentFontSize);
    setDraftFontWeight(currentFontWeight);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleAdjustFontSize = (delta: number) => {
    const currentNum = parseInt(draftFontSize || '16', 10) || 16;
    const nextNum = Math.max(12, Math.min(72, currentNum + delta));
    setDraftFontSize(`${nextNum}px`);
  };

  const handleResetFormatting = () => {
    setDraftColor(undefined);
    setDraftFontSize(undefined);
    setDraftFontWeight(undefined);
  };

  const appliedStyle: React.CSSProperties = {
    ...(currentColor ? { color: currentColor } : {}),
    ...(currentFontSize ? { fontSize: currentFontSize } : {}),
    ...(currentFontWeight ? { fontWeight: currentFontWeight } : {}),
  };

  const draftStyle: React.CSSProperties = {
    ...(draftColor ? { color: draftColor } : {}),
    ...(draftFontSize ? { fontSize: draftFontSize } : {}),
    ...(draftFontWeight ? { fontWeight: draftFontWeight } : {}),
  };

  // Case 1: Normal Visitor or Edit Mode OFF
  if (!isEditMode) {
    return (
      <Component className={className} style={appliedStyle}>
        {textToShow}
      </Component>
    );
  }

  // Case 2: In Edit Mode AND currently editing this text
  if (isEditing) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`inline-block relative z-40 max-w-full p-3 sm:p-4 bg-white border-2 border-[#C9A24B] rounded-2xl shadow-2xl text-stone-900 ${
          inline ? 'w-auto' : 'w-full'
        }`}
      >
        {/* Top Info Bar */}
        <div className="flex flex-wrap items-center justify-between text-[11px] mb-2.5 pb-2 border-b border-stone-100 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold bg-[#FAF8F5] border border-[#C9A24B]/30 px-2 py-0.5 rounded-md text-[10px] text-[#98752B] font-mono">
              {contentKey}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A24B]/15 text-[#98752B] border border-[#C9A24B]/30">
              اللغة الحالية: {language === 'ar' ? 'العربية (AR)' : 'الإنجليزية (EN)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!hasOtherTranslation && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>ترجمة {otherLang === 'en' ? 'الإنجليزية' : 'العربية'} مفقودة</span>
              </span>
            )}
            <span className="text-[10px] text-stone-400 hidden sm:inline">Esc للإلغاء | Enter للحفظ</span>
          </div>
        </div>

        {/* Floating Mini Formatting Toolbar */}
        <div
          id={`mini-toolbar-${contentKey}`}
          className="mb-3 p-2.5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl space-y-2.5 shadow-xs select-none"
        >
          {/* Row 1: Text Color */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-stone-800 flex items-center gap-1 min-w-[55px]">
              <Palette className="w-3.5 h-3.5 text-[#B38A34]" />
              <span>اللون:</span>
            </span>

            <div className="flex items-center gap-1.5">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = draftColor?.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    title={preset.name}
                    onClick={() => setDraftColor(preset.hex)}
                    style={{ backgroundColor: preset.hex }}
                    className={`w-6 h-6 rounded-full transition-transform active:scale-90 flex items-center justify-center border border-stone-300 ${
                      isSelected ? 'ring-2 ring-offset-2 ring-offset-white ring-[#C9A24B] scale-110' : 'hover:scale-105'
                    }`}
                  >
                    {isSelected && (
                      <Check className={`w-3.5 h-3.5 ${preset.hex === '#FFFFFF' ? 'text-black' : 'text-white'} stroke-[3]`} />
                    )}
                  </button>
                );
              })}
            </div>

            <label
              title="اختر لوناً حراً"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-stone-50 border border-stone-300 text-[11px] text-stone-700 cursor-pointer transition-colors shadow-2xs"
            >
              <input
                type="color"
                value={draftColor || '#C9A24B'}
                onChange={(e) => setDraftColor(e.target.value)}
                className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <span className="text-[10px] font-mono">{draftColor || 'لون مخصص'}</span>
            </label>

            {draftColor && (
              <button
                type="button"
                onClick={() => setDraftColor(undefined)}
                title="استعادة اللون الافتراضي"
                className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-200 text-[10px] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Row 2: Font Size */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-200">
            <span className="text-[11px] font-bold text-stone-800 flex items-center gap-1 min-w-[55px]">
              <Type className="w-3.5 h-3.5 text-[#B38A34]" />
              <span>الحجم:</span>
            </span>

            <div className="flex items-center bg-white rounded-lg border border-stone-300 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => handleAdjustFontSize(-2)}
                title="تصغير الخط"
                className="px-2 py-1 hover:bg-stone-100 text-stone-700 active:scale-95 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 text-[10px] font-mono text-[#B38A34] font-bold">
                {draftFontSize || 'افتراضي'}
              </span>
              <button
                type="button"
                onClick={() => handleAdjustFontSize(2)}
                title="تكبير الخط"
                className="px-2 py-1 hover:bg-stone-100 text-stone-700 active:scale-95 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {FONT_SIZE_PRESETS.map((sz) => {
                const isSelected = draftFontSize === sz.value;
                return (
                  <button
                    key={sz.value}
                    type="button"
                    onClick={() => setDraftFontSize(sz.value)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all border ${
                      isSelected
                        ? 'bg-[#C9A24B] text-white border-[#C9A24B] shadow-2xs font-bold'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {sz.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Font Weight */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-200">
            <span className="text-[11px] font-bold text-stone-800 flex items-center gap-1 min-w-[55px]">
              <Bold className="w-3.5 h-3.5 text-[#B38A34]" />
              <span>السمك:</span>
            </span>

            <div className="flex items-center gap-1">
              {FONT_WEIGHT_PRESETS.map((w) => {
                const isSelected = draftFontWeight === w.value;
                return (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => setDraftFontWeight(w.value)}
                    className={`px-2.5 py-1 rounded-md text-[10px] transition-all border ${
                      isSelected
                        ? 'bg-[#C9A24B] text-white font-bold border-[#C9A24B] shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                    style={{ fontWeight: w.value }}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>

            {(draftColor || draftFontSize || draftFontWeight) && (
              <button
                type="button"
                onClick={handleResetFormatting}
                className="mr-auto px-2 py-0.5 rounded text-[10px] text-stone-500 hover:text-[#B38A34] hover:bg-stone-200 transition-colors flex items-center gap-1"
                title="إعادة ضبط التنسيق للافتراضي"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>افتراضي</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary Input Field (Active Language) */}
        <div className="mb-2">
          <label className="block text-[11px] font-bold text-stone-700 mb-1">
            النص ({language === 'ar' ? 'العربية' : 'English'}) - يحفظ في هذه اللغة:
          </label>
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={Math.max(2, Math.min(8, draftText.split('\n').length + 1))}
              style={draftStyle}
              className={`w-full p-3 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C9A24B] focus:border-[#C9A24B] resize-y leading-relaxed transition-all shadow-inner ${inputClassName}`}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={draftStyle}
              className={`w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C9A24B] focus:border-[#C9A24B] transition-all shadow-inner ${inputClassName}`}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          )}
        </div>

        {/* Optional Secondary Field (Other Language) */}
        <div className="mt-2.5 pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between mb-1">
            <button
              type="button"
              onClick={() => setShowOtherLangField(!showOtherLangField)}
              className="text-[11px] text-[#98752B] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-[#C9A24B]" />
              <span>
                {showOtherLangField 
                  ? `إخفاء حقل ${otherLang === 'en' ? 'الإنجليزية (EN)' : 'العربية (AR)'}` 
                  : `تعديل أو إضافة ترجمة ${otherLang === 'en' ? 'الإنجليزية (EN)' : 'العربية (AR)'}`}
              </span>
            </button>

            {language === 'ar' && (
              <button
                type="button"
                onClick={handleAutoTranslate}
                disabled={isTranslating || !draftText.trim()}
                className="text-[10px] text-stone-600 hover:text-[#98752B] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="توليد ترجمة إنجليزية تلقائية"
              >
                {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-[#C9A24B]" />}
                <span>ترجمة تلقائية</span>
              </button>
            )}
          </div>

          {showOtherLangField && (
            <input
              type="text"
              value={draftOtherText}
              onChange={(e) => setDraftOtherText(e.target.value)}
              placeholder={`أدخل النص المقابل بـ ${otherLang === 'en' ? 'الإنجليزية' : 'العربية'}...`}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
              dir={otherLang === 'ar' ? 'rtl' : 'ltr'}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>حفظ في قاعدة البيانات</span>
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 active:scale-95 text-stone-700 text-xs font-medium transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>إلغاء</span>
            </button>
          </div>

          <span className="text-[10px] text-stone-400">
            تحديث فوري لجميع الزوار
          </span>
        </div>
      </div>
    );
  }

  // Case 3: In Edit Mode, not currently editing
  return (
    <Component
      onClick={handleStartEdit}
      title={`انقر للتعديل باللغة ${language === 'ar' ? 'العربية' : 'الإنجليزية'}: ${contentKey}`}
      style={appliedStyle}
      className={`group/editable relative inline-block transition-all duration-150 cursor-pointer border border-transparent hover:border-dashed hover:border-[#C9A24B] hover:bg-[#C9A24B]/10 hover:shadow-sm rounded-lg px-1.5 py-0.5 -mx-1.5 ${className}`}
    >
      {textToShow}

      {/* Missing other language indicator (Requirement 3) */}
      {!hasOtherTranslation && (
        <span 
          title={`تنبيه: هذا النص لا يمتلك ترجمة باللغة ${otherLang === 'en' ? 'الإنجليزية' : 'العربية'}`}
          className="inline-flex items-center gap-0.5 mx-1 px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-800 align-middle select-none animate-pulse"
        >
          <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
          <span>{otherLang === 'en' ? 'EN مفقودة' : 'AR مفقودة'}</span>
        </span>
      )}

      {/* Small Pencil Icon Badge ✏️ */}
      <span
        onClick={handleStartEdit}
        className="inline-flex items-center justify-center w-5 h-5 mr-1.5 rounded-full bg-[#C9A24B] text-black shadow-md opacity-85 group-hover/editable:opacity-100 group-hover/editable:scale-110 transition-all align-middle"
        aria-label="تعديل هذا النص"
      >
        <Edit3 className="w-2.5 h-2.5 stroke-[2.5]" />
      </span>
    </Component>
  );
};
