import React, { useState } from 'react';
import { HomeSectionsSettings, SiteSettings } from '../types';
import { DEFAULT_HOME_SECTIONS } from '../services/firebase';
import { 
  LayoutGrid, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw, 
  Building2, 
  Sparkles, 
  Layers, 
  Tag, 
  MessageSquare, 
  Award, 
  Compass, 
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface AdminHomeSectionsManagerProps {
  homeSections?: HomeSectionsSettings;
  onUpdateHomeSections: (data: HomeSectionsSettings) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminHomeSectionsManager: React.FC<AdminHomeSectionsManagerProps> = ({
  homeSections = DEFAULT_HOME_SECTIONS,
  onUpdateHomeSections,
  onShowToast
}) => {
  const [form, setForm] = useState<HomeSectionsSettings>({
    ...DEFAULT_HOME_SECTIONS,
    ...(homeSections || {})
  });

  const handleToggle = (key: keyof HomeSectionsSettings) => {
    const currentVal = form[key];
    const newVal = typeof currentVal === 'boolean' ? !currentVal : true;
    const updated = { ...form, [key]: newVal };
    setForm(updated);
    onUpdateHomeSections(updated);
    onShowToast('تم تحديث حالة ظهور القسم بنجاح', 'success');
  };

  const handleSave = () => {
    onUpdateHomeSections(form);
    onShowToast('تم حفظ إعدادات أقسام الصفحة الرئيسية بنجاح ✨', 'success');
  };

  const handleReset = () => {
    if (window.confirm('هل تريد استعادة إعدادات الأقسام الافتراضية؟')) {
      setForm(DEFAULT_HOME_SECTIONS);
      onUpdateHomeSections(DEFAULT_HOME_SECTIONS);
      onShowToast('تمت استعادة الإعدادات الافتراضية', 'info');
    }
  };

  const SECTIONS_CONFIG = [
    {
      key: 'showStoryTeaser' as keyof HomeSectionsSettings,
      title: 'قسم نبذة وقصة شركة برستيج',
      desc: 'العنوان التشويقي، الفقرات الثلاث، وسوم المواقع، والبطاقة الجانبية الفاخرة.',
      icon: Sparkles
    },
    {
      key: 'showIntegratedServices' as keyof HomeSectionsSettings,
      title: 'قسم منظومة الضيافة المتكاملة (4 خدمات)',
      desc: 'إدارة وتشغيل الفنادق، النقل الفاخر، الإعاشة، واستخراج التأشيرات.',
      icon: Layers
    },
    {
      key: 'showFeaturedHotels' as keyof HomeSectionsSettings,
      title: 'قسم الفنادق المميزة (شبكة الـ 6 فنادق)',
      desc: 'استعراض أبرز بطاقات الفنادق المعتمدة مع خيارات الحجز المباشر.',
      icon: Building2
    },
    {
      key: 'showHotelsAccordion' as keyof HomeSectionsSettings,
      title: 'قسم تصنيف الفنادق حسب الأحياء والمدن',
      desc: 'قوائم منسدلة أنيقة لتصنيف فنادق مكة المكرمة والمدينة المنورة.',
      icon: LayoutGrid
    },
    {
      key: 'showOffersBanner' as keyof HomeSectionsSettings,
      title: 'شريط الإعلانات وبوسترات المواسم',
      desc: 'بانر عروض وبوسترات مواسم العمرة ورمضان والحج للشركات.',
      icon: Tag
    },
    {
      key: 'showStats' as keyof HomeSectionsSettings,
      title: 'قسم الإحصائيات والأرقام التفاعلية',
      desc: 'عدادات تصاعدية للخبرة، عدد الفنادق، النزلاء، ونسبة الرضا.',
      icon: Award
    },
    {
      key: 'showTestimonials' as keyof HomeSectionsSettings,
      title: 'قسم آراء وتجارب ضيوف الرحمن',
      desc: 'سلايدر التقييمات وآراء النزلاء المعتمدة مع زر إضافة تقييم.',
      icon: MessageSquare
    },
    {
      key: 'showWhyChooseUs' as keyof HomeSectionsSettings,
      title: 'قسم مميزات الثقة والضمان (لماذا برستيج؟)',
      desc: 'مميزات الحجوزات المؤكدة، القرب من الحرم، وفريق العمل الميداني 24/7.',
      icon: Compass
    }
  ];

  return (
    <div className="space-y-8 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-cairo font-bold text-stone-900">
              التحكم في أقسام الصفحة الرئيسية (Home Sections)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              إظهار أو إخفاء أي قسم من الصفحة الرئيسية بضغطة زر واحدة، وتخصيص العناوين
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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

      {/* Sections Switches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS_CONFIG.map((sec) => {
          const Icon = sec.icon;
          const isVisible = form[sec.key] !== false;
          return (
            <div
              key={sec.key}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                isVisible
                  ? 'bg-white border-stone-200 hover:border-[#C9A24B] shadow-2xs'
                  : 'bg-stone-50 border-dashed border-stone-300 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isVisible ? 'bg-[#C9A24B]/15 text-[#B38A34]' : 'bg-stone-200 text-stone-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-cairo font-bold text-stone-900 text-sm mb-1">
                    {sec.title}
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {sec.desc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(sec.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
                  isVisible
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                    : 'bg-stone-200 text-stone-600 border border-stone-300 hover:bg-stone-300'
                }`}
                title={isVisible ? 'إخفاء القسم' : 'إظهار القسم'}
              >
                {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{isVisible ? 'مفعّل' : 'مخفي'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Featured Hotels Title Customizer */}
      <div className="pt-6 border-t border-stone-200 space-y-4">
        <h3 className="font-cairo font-bold text-stone-900 text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#B38A34]" />
          <span>تخصيص عنوان ووصف قسم الفنادق المميزة</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">الشارة العلوية</label>
            <input
              type="text"
              value={form.featuredHotelsBadge || ''}
              onChange={(e) => setForm({ ...form, featuredHotelsBadge: e.target.value })}
              placeholder="فخامة وروحانية"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">العنوان الرئيسي</label>
            <input
              type="text"
              value={form.featuredHotelsTitle || ''}
              onChange={(e) => setForm({ ...form, featuredHotelsTitle: e.target.value })}
              placeholder="فنادقنا المميزة في مكة والمدينة"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-700 mb-1">الوصف الفرعي</label>
            <input
              type="text"
              value={form.featuredHotelsSubtitle || ''}
              onChange={(e) => setForm({ ...form, featuredHotelsSubtitle: e.target.value })}
              placeholder="مجموعة مختارة بعناية من أفخم الفنادق المطلة على الكعبة المشرفة..."
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom Save */}
      <div className="pt-4 border-t border-stone-200 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-8 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التغييرات</span>
        </button>
      </div>

    </div>
  );
};
