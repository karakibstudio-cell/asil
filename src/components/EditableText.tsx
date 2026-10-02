import React, { useState, useEffect, useRef } from 'react';
import { useLiveContent } from '../context/LiveContentContext';
import { useLanguage } from '../context/LanguageContext';
import { Edit3, Check, X, Loader2, Palette, Type, Bold, Plus, Minus, RotateCcw } from 'lucide-react';

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
  const { getContent, updateContent, isEditMode } = useLiveContent();
  const { language, t, translateDynamic } = useLanguage();
  const currentItem = getContent(contentKey, fallback);

  const currentText = currentItem.text ?? fallback;
  const textToShow = language === 'en' ? t(contentKey, translateDynamic(currentText)) : currentText;
  const currentColor = currentItem.color;
  const currentFontSize = currentItem.fontSize;
  const currentFontWeight = currentItem.fontWeight;

  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(currentText);
  const [draftColor, setDraftColor] = useState<string | undefined>(currentColor);
  const [draftFontSize, setDraftFontSize] = useState<string | undefined>(currentFontSize);
  const [draftFontWeight, setDraftFontWeight] = useState<string | undefined>(currentFontWeight);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync state with incoming content when not actively editing
  useEffect(() => {
    if (!isEditing) {
      setDraftText(currentText);
      setDraftColor(currentColor);
      setDraftFontSize(currentFontSize);
      setDraftFontWeight(currentFontWeight);
    }
  }, [currentText, currentColor, currentFontSize, currentFontWeight, isEditing]);

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
    setDraftText(currentText);
    setDraftColor(currentColor);
    setDraftFontSize(currentFontSize);
    setDraftFontWeight(currentFontWeight);
    setIsEditing(true);
  };

  const handleSave = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const payload = {
      text: draftText,
      color: draftColor,
      fontSize: draftFontSize,
      fontWeight: draftFontWeight,
    };
    // Close modal instantly (0ms instant response)
    setIsEditing(false);
    // Background save
    updateContent(contentKey, payload).catch((err) => {
      console.error('Failed to save editable text in background:', err);
    });
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDraftText(currentText);
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

  // Adjust font size by delta px
  const handleAdjustFontSize = (delta: number) => {
    const currentNum = parseInt(draftFontSize || '16', 10) || 16;
    const nextNum = Math.max(12, Math.min(72, currentNum + delta));
    setDraftFontSize(`${nextNum}px`);
  };

  // Reset all formatting to default
  const handleResetFormatting = () => {
    setDraftColor(undefined);
    setDraftFontSize(undefined);
    setDraftFontWeight(undefined);
  };

  // Shared active styles to render on visitor view or preview
  const appliedStyle: React.CSSProperties = {
    ...(currentColor ? { color: currentColor } : {}),
    ...(currentFontSize ? { fontSize: currentFontSize } : {}),
    ...(currentFontWeight ? { fontWeight: currentFontWeight } : {}),
  };

  // Draft styles used for live preview in edit mode
  const draftStyle: React.CSSProperties = {
    ...(draftColor ? { color: draftColor } : {}),
    ...(draftFontSize ? { fontSize: draftFontSize } : {}),
    ...(draftFontWeight ? { fontWeight: draftFontWeight } : {}),
  };

  // Case 1: Normal Visitor or Edit Mode OFF -> pure plain render with custom styles
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
        className={`inline-block relative z-40 max-w-full p-2.5 sm:p-3.5 bg-white border-2 border-[#C9A24B] rounded-2xl shadow-2xl text-stone-900 ${
          inline ? 'w-auto' : 'w-full'
        }`}
      >
        {/* Top Info Bar: Key label + Esc hint */}
        <div className="flex items-center justify-between text-[11px] text-[#B38A34] font-mono mb-2 select-none dir-ltr">
          <span className="font-bold bg-[#FAF8F5] border border-[#C9A24B]/30 px-2 py-0.5 rounded-md text-[10px] text-[#98752B]">
            {contentKey}
          </span>
          <span className="text-[10px] text-stone-500">Esc للإلغاء | Enter للحفظ</span>
        </div>

        {/* Floating Mini Formatting Toolbar */}
        <div
          id={`mini-toolbar-${contentKey}`}
          className="mb-3 p-2.5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl space-y-2.5 shadow-xs select-none"
        >
          {/* Row 1: Text Color Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-stone-800 flex items-center gap-1 min-w-[55px]">
              <Palette className="w-3.5 h-3.5 text-[#B38A34]" />
              <span>اللون:</span>
            </span>

            {/* Color Presets */}
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

            {/* Custom Color Picker Input */}
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

            {/* Reset color */}
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

          {/* Row 2: Font Size Controls */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-200">
            <span className="text-[11px] font-bold text-stone-800 flex items-center gap-1 min-w-[55px]">
              <Type className="w-3.5 h-3.5 text-[#B38A34]" />
              <span>الحجم:</span>
            </span>

            {/* Size +/- Buttons */}
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

            {/* Quick Size Presets */}
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

          {/* Row 3: Font Weight Controls */}
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

            {/* Reset all button */}
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

        {/* Live Input Field reflecting the selected format immediately */}
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={Math.max(2, Math.min(8, draftText.split('\n').length + 1))}
            style={draftStyle}
            className={`w-full p-3 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C9A24B] focus:border-[#C9A24B] resize-y leading-relaxed transition-all shadow-inner ${inputClassName}`}
            dir="rtl"
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
            dir="rtl"
          />
        )}

        {/* Action Buttons: Save (Green) & Cancel (Gray) */}
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
              <span>حفظ التعديلات والتنسيق</span>
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
            معاينة فورية مطبقة
          </span>
        </div>
      </div>
    );
  }

  // Case 3: In Edit Mode, not currently editing -> subtle dotted border on hover + pencil icon + custom styles
  return (
    <Component
      onClick={handleStartEdit}
      title={`انقر للتعديل وتنسيق الخط: ${contentKey}`}
      style={appliedStyle}
      className={`group/editable relative inline-block transition-all duration-150 cursor-pointer border border-transparent hover:border-dashed hover:border-[#C9A24B] hover:bg-[#C9A24B]/10 hover:shadow-sm rounded-lg px-1.5 py-0.5 -mx-1.5 ${className}`}
    >
      {textToShow}

      {/* Small Pencil Icon Badge ✏️ */}
      <span
        onClick={handleStartEdit}
        className="inline-flex items-center justify-center w-5 h-5 mr-1.5 rounded-full bg-[#C9A24B] text-black shadow-md opacity-85 group-hover/editable:opacity-100 group-hover/editable:scale-110 transition-all align-middle"
        aria-label="تعديل وتنسيق هذا النص"
      >
        <Edit3 className="w-2.5 h-2.5 stroke-[2.5]" />
      </span>
    </Component>
  );
};

