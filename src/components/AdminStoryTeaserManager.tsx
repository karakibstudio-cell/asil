import React, { useState } from 'react';
import { StoryTeaserSettings, StoryLocationTag, StoryShowcasePoint } from '../types';
import { DEFAULT_STORY_TEASER } from '../services/firebase';
import { 
  Sparkles, 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw, 
  Tag, 
  MousePointerClick
} from 'lucide-react';

interface AdminStoryTeaserManagerProps {
  storyTeaser?: StoryTeaserSettings;
  onUpdateStoryTeaser: (data: StoryTeaserSettings) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminStoryTeaserManager: React.FC<AdminStoryTeaserManagerProps> = ({
  storyTeaser = DEFAULT_STORY_TEASER,
  onUpdateStoryTeaser,
  onShowToast
}) => {
  const [form, setForm] = useState<StoryTeaserSettings>({
    ...DEFAULT_STORY_TEASER,
    ...(storyTeaser || {})
  });

  const [newTagText, setNewTagText] = useState('');

  const handleSave = () => {
    onUpdateStoryTeaser(form);
    onShowToast('تم حفظ إعدادات ونصوص نبذة الشركة بنجاح ✨', 'success');
  };

  const handleResetToDefault = () => {
    if (window.confirm('هل تريد استعادة النصوص الافتراضية لقسم نبذة الشركة؟')) {
      setForm(DEFAULT_STORY_TEASER);
      onUpdateStoryTeaser(DEFAULT_STORY_TEASER);
      onShowToast('تمت استعادة النصوص الافتراضية بنجاح', 'info');
    }
  };

  const handleAddTag = () => {
    if (!newTagText.trim()) return;
    const newTag: StoryLocationTag = {
      id: `tag_${Date.now()}`,
      text: newTagText.trim(),
      iconName: 'Building2',
      isActive: true
    };
    const updatedTags = [...(form.locationTags || []), newTag];
    const updated = { ...form, locationTags: updatedTags };
    setForm(updated);
    setNewTagText('');
    onUpdateStoryTeaser(updated);
    onShowToast(`تمت إضافة الوسم "${newTag.text}"`, 'success');
  };

  const handleToggleTag = (tagId: string) => {
    const updatedTags = (form.locationTags || []).map(t => 
      t.id === tagId ? { ...t, isActive: t.isActive === false ? true : false } : t
    );
    const updated = { ...form, locationTags: updatedTags };
    setForm(updated);
    onUpdateStoryTeaser(updated);
  };

  const handleDeleteTag = (tagId: string) => {
    const updatedTags = (form.locationTags || []).filter(t => t.id !== tagId);
    const updated = { ...form, locationTags: updatedTags };
    setForm(updated);
    onUpdateStoryTeaser(updated);
    onShowToast('تم حذف الوسم', 'info');
  };

  const handleTogglePointActive = (pointId: string) => {
    const updatedPoints = (form.showcasePoints || []).map(p =>
      p.id === pointId ? { ...p, isActive: p.isActive === false ? true : false } : p
    );
    const updated = { ...form, showcasePoints: updatedPoints };
    setForm(updated);
    onUpdateStoryTeaser(updated);
  };

  // Helper Visibility Toggle
  const VisibilityToggle = ({ 
    active, 
    onToggle, 
    label 
  }: { 
    active: boolean; 
    onToggle: () => void; 
    label?: string;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0 ${
        active 
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100' 
          : 'bg-stone-100 text-stone-500 border border-stone-300 hover:bg-stone-200'
      }`}
      title={active ? 'ظاهر بالموقع (انقر للإخفاء)' : 'مخفي (انقر للإظهار)'}
    >
      {active ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
      <span>{label || (active ? 'ظاهر' : 'مخفي')}</span>
    </button>
  );

  return (
    <div className="space-y-8 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
      
      {/* Header & Main Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-cairo font-bold text-stone-900">
              إدارة قسم نبذة وقصة الشركة (Story Teaser)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              تحكم دقيق وفوري في إظهار أو إخفاء كل عنوان، فقرة، زر، بطاقة، ونقطة مميزة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Master Enable/Disable Switch */}
          <button
            type="button"
            onClick={() => {
              const updated = { ...form, isEnabled: !form.isEnabled };
              setForm(updated);
              onUpdateStoryTeaser(updated);
              onShowToast(
                updated.isEnabled ? 'تم تفعيل ظهور قسم نبذة الشركة' : 'تم إخفاء قسم نبذة الشركة من الموقع',
                'success'
              );
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              form.isEnabled !== false
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
            }`}
          >
            {form.isEnabled !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{form.isEnabled !== false ? 'القسم مفعّل وظاهر' : 'القسم مخفي'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="استعادة النصوص الأصلية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">الافتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ</span>
          </button>
        </div>
      </div>

      {/* Main Text Content Form with Granular Show/Hide Toggles */}
      <div className="space-y-6">
        <h3 className="font-cairo font-bold text-stone-900 text-base flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-[#B38A34]" />
          <span>العناوين والفقرات التعريفية وإظهارها</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Badge */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">الشارة العلوية (Badge):</label>
              <VisibilityToggle
                active={form.showBadge !== false}
                onToggle={() => setForm({ ...form, showBadge: form.showBadge === false })}
              />
            </div>
            <input
              type="text"
              value={form.badge || ''}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              placeholder="نبذة عن شركة برستيج"
              className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-sm focus:border-[#C9A24B] focus:outline-none"
            />
          </div>

          {/* Main Title */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">العنوان الرئيسي للقسم:</label>
              <VisibilityToggle
                active={form.showTitle !== false}
                onToggle={() => setForm({ ...form, showTitle: form.showTitle === false })}
              />
            </div>
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="برستيج.. حيث تلتقي فخامة الضيافة بروحانية المكان"
              className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-sm focus:border-[#C9A24B] focus:outline-none font-bold"
            />
          </div>
        </div>

        {/* Paragraph 1 */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-700">الفقرة الأولى (الانطلاقة والرسالة):</label>
            <VisibilityToggle
              active={form.showParagraph1 !== false}
              onToggle={() => setForm({ ...form, showParagraph1: form.showParagraph1 === false })}
            />
          </div>
          <textarea
            rows={3}
            value={form.paragraph1 || ''}
            onChange={(e) => setForm({ ...form, paragraph1: e.target.value })}
            className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-sm focus:border-[#C9A24B] focus:outline-none leading-relaxed"
          />
        </div>

        {/* Paragraph 2 */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-700">الفقرة الثانية (التوسع والشراكات):</label>
            <VisibilityToggle
              active={form.showParagraph2 !== false}
              onToggle={() => setForm({ ...form, showParagraph2: form.showParagraph2 === false })}
            />
          </div>
          <textarea
            rows={2}
            value={form.paragraph2 || ''}
            onChange={(e) => setForm({ ...form, paragraph2: e.target.value })}
            className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-sm focus:border-[#C9A24B] focus:outline-none leading-relaxed"
          />
        </div>

        {/* Paragraph 3 (Highlighted Box) */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-800">الفقرة الثالثة (صندوق مميز - التتويج بـ برستيج أجياد والـ 7 فنادق):</label>
            <VisibilityToggle
              active={form.showParagraph3 !== false}
              onToggle={() => setForm({ ...form, showParagraph3: form.showParagraph3 === false })}
            />
          </div>
          <textarea
            rows={3}
            value={form.paragraph3 || ''}
            onChange={(e) => setForm({ ...form, paragraph3: e.target.value })}
            className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-sm focus:border-[#C9A24B] focus:outline-none leading-relaxed font-semibold"
          />
        </div>
      </div>

      {/* Buttons Controls */}
      <div className="pt-6 border-t border-stone-200 space-y-4">
        <h3 className="font-cairo font-bold text-stone-900 text-base flex items-center gap-2">
          <MousePointerClick className="w-4 h-4 text-[#B38A34]" />
          <span>أزرار التفاعل والانتقال (CTA Buttons)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Button 1 */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">زر الاستكشاف ("اقرأ المزيد عنا"):</label>
              <VisibilityToggle
                active={form.showExploreButton !== false}
                onToggle={() => setForm({ ...form, showExploreButton: form.showExploreButton === false })}
              />
            </div>
            <input
              type="text"
              value={form.exploreButtonText || 'اقرأ المزيد عنا'}
              onChange={(e) => setForm({ ...form, exploreButtonText: e.target.value })}
              className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-sm focus:border-[#C9A24B] focus:outline-none font-bold"
            />
          </div>

          {/* Button 2 */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">زر التواصل ("عروض الشركات والمجموعات"):</label>
              <VisibilityToggle
                active={form.showContactButton !== false}
                onToggle={() => setForm({ ...form, showContactButton: form.showContactButton === false })}
              />
            </div>
            <input
              type="text"
              value={form.contactButtonText || 'عروض الشركات والمجموعات'}
              onChange={(e) => setForm({ ...form, contactButtonText: e.target.value })}
              className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-sm focus:border-[#C9A24B] focus:outline-none font-bold"
            />
          </div>
        </div>
      </div>

      {/* Location Tags Management */}
      <div className="pt-6 border-t border-stone-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-cairo font-bold text-stone-900 text-base flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#B38A34]" />
            <span>وسوم المواقع والفنادق (Location Badges)</span>
          </h3>
          <VisibilityToggle
            active={form.showLocationTags !== false}
            onToggle={() => setForm({ ...form, showLocationTags: form.showLocationTags === false })}
            label={form.showLocationTags !== false ? 'الوسوم ظاهرة' : 'الوسوم مخفية'}
          />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTagText}
            onChange={(e) => setNewTagText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="أدخل نص وسم جديد (مثال: فنادق محبس الجن للعمرة)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-[#C9A24B] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة وسم</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {(form.locationTags || []).map((tag) => (
            <div
              key={tag.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                tag.isActive !== false
                  ? 'bg-stone-100 border-stone-300 text-stone-800'
                  : 'bg-stone-50 border-dashed border-stone-200 text-stone-400 opacity-60'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggleTag(tag.id)}
                className="cursor-pointer hover:text-[#B38A34]"
                title={tag.isActive !== false ? 'إخفاء الوسم' : 'إظهار الوسم'}
              >
                {tag.isActive !== false ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
              </button>
              <span>{tag.text}</span>
              <button
                type="button"
                onClick={() => handleDeleteTag(tag.id)}
                className="cursor-pointer text-stone-400 hover:text-red-600 p-0.5"
                title="حذف الوسم"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dark Showcase Box Settings (Left Card) */}
      <div className="pt-6 border-t border-stone-200 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-cairo font-bold text-stone-900 text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#B38A34]" />
            <span>البطاقة الجانبية الفاخرة (Showcase Card)</span>
          </h3>
          <VisibilityToggle
            active={form.showShowcaseCard !== false}
            onToggle={() => setForm({ ...form, showShowcaseCard: form.showShowcaseCard === false })}
            label={form.showShowcaseCard !== false ? 'البطاقة كاملة ظاهرة' : 'البطاقة كاملة مخفية'}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">شارة سنة التأسيس:</label>
              <VisibilityToggle
                active={form.showShowcaseYear !== false}
                onToggle={() => setForm({ ...form, showShowcaseYear: form.showShowcaseYear === false })}
              />
            </div>
            <input
              type="text"
              value={form.showcaseEstablishedYear || ''}
              onChange={(e) => setForm({ ...form, showcaseEstablishedYear: e.target.value })}
              placeholder="منذ 2010 م"
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm focus:border-[#C9A24B] focus:outline-none"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">عنوان شارة البطاقة:</label>
              <VisibilityToggle
                active={form.showShowcaseBadge !== false}
                onToggle={() => setForm({ ...form, showShowcaseBadge: form.showShowcaseBadge === false })}
              />
            </div>
            <input
              type="text"
              value={form.showcaseBadge || ''}
              onChange={(e) => setForm({ ...form, showcaseBadge: e.target.value })}
              placeholder="شراكات استراتيجية موثوقة"
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm focus:border-[#C9A24B] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">العنوان الرئيسي للبطاقة:</label>
              <VisibilityToggle
                active={form.showShowcaseTitle !== false}
                onToggle={() => setForm({ ...form, showShowcaseTitle: form.showShowcaseTitle === false })}
              />
            </div>
            <input
              type="text"
              value={form.showcaseTitle || ''}
              onChange={(e) => setForm({ ...form, showcaseTitle: e.target.value })}
              placeholder="إدارة وتشغيل أكثر من 7 فنادق راقية بمكة والمدينة"
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm focus:border-[#C9A24B] focus:outline-none font-bold"
            />
          </div>
        </div>

        {/* Showcase Points (highlights) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-800">
              النقاط المميزة داخل البطاقة:
            </label>
            <VisibilityToggle
              active={form.showShowcasePoints !== false}
              onToggle={() => setForm({ ...form, showShowcasePoints: form.showShowcasePoints === false })}
              label={form.showShowcasePoints !== false ? 'النقاط ظاهرة' : 'النقاط مخفية'}
            />
          </div>

          {(form.showcasePoints || []).map((point, pIdx) => (
            <div key={point.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#B38A34]">النقطة رقم {pIdx + 1}</span>
                <VisibilityToggle
                  active={point.isActive !== false}
                  onToggle={() => handleTogglePointActive(point.id)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={point.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      showcasePoints: (prev.showcasePoints || []).map(p => p.id === point.id ? { ...p, title: val } : p)
                    }));
                  }}
                  placeholder="عنوان النقطة"
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white focus:outline-none"
                />
                <input
                  type="text"
                  value={point.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      showcasePoints: (prev.showcasePoints || []).map(p => p.id === point.id ? { ...p, description: val } : p)
                    }));
                  }}
                  placeholder="الوصف التفصيلي"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        {/* License note */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-700">ملاحظة الترخيص في أسفل البطاقة:</label>
            <VisibilityToggle
              active={form.showShowcaseLicense !== false}
              onToggle={() => setForm({ ...form, showShowcaseLicense: form.showShowcaseLicense === false })}
            />
          </div>
          <input
            type="text"
            value={form.showcaseLicenseNote || ''}
            onChange={(e) => setForm({ ...form, showcaseLicenseNote: e.target.value })}
            placeholder="شركة مرخصة ومعتمدة من وزارة الحج والعمرة والهيئة السعودية للسياحة"
            className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm focus:border-[#C9A24B] focus:outline-none"
          />
        </div>
      </div>

      {/* Save bar at bottom */}
      <div className="pt-6 border-t border-stone-200 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="px-8 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>حفظ كافة التعديلات</span>
        </button>
      </div>

    </div>
  );
};
