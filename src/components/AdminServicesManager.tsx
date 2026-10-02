import React, { useState } from 'react';
import { IntegratedServicesSettings, IntegratedServiceItem, ActivePage } from '../types';
import { DEFAULT_INTEGRATED_SERVICES } from '../services/firebase';
import { 
  Sparkles, 
  Building2, 
  Bus, 
  Utensils, 
  FileCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Check, 
  Save, 
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Layers,
  CheckCircle2,
  X
} from 'lucide-react';

interface AdminServicesManagerProps {
  integratedServices?: IntegratedServicesSettings;
  onUpdateIntegratedServices: (data: IntegratedServicesSettings) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const AVAILABLE_SERVICE_ICONS = [
  { name: 'Building2', label: 'مبنى / فندق', icon: Building2 },
  { name: 'Bus', label: 'حافلة / نقل', icon: Bus },
  { name: 'Utensils', label: 'مطعم / إعاشة', icon: Utensils },
  { name: 'FileCheck', label: 'تأشيرات / مستند', icon: FileCheck },
  { name: 'Sparkles', label: 'خدمة خاصة / تميز', icon: Sparkles }
];

export const AdminServicesManager: React.FC<AdminServicesManagerProps> = ({
  integratedServices = DEFAULT_INTEGRATED_SERVICES,
  onUpdateIntegratedServices,
  onShowToast
}) => {
  const [form, setForm] = useState<IntegratedServicesSettings>({
    ...DEFAULT_INTEGRATED_SERVICES,
    ...(integratedServices || {})
  });

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newHighlightText, setNewHighlightText] = useState('');

  const services = form.services || [];

  const handleSave = () => {
    onUpdateIntegratedServices(form);
    onShowToast('تم حفظ إعدادات منظومة الخدمات المتكاملة بنجاح ✨', 'success');
  };

  const handleResetToDefault = () => {
    if (window.confirm('هل تريد استعادة الخدمات والنصوص الافتراضية؟')) {
      setForm(DEFAULT_INTEGRATED_SERVICES);
      onUpdateIntegratedServices(DEFAULT_INTEGRATED_SERVICES);
      onShowToast('تمت استعادة الخدمات الافتراضية بنجاح', 'info');
    }
  };

  const handleToggleSection = () => {
    const updated = { ...form, isEnabled: !form.isEnabled };
    setForm(updated);
    onUpdateIntegratedServices(updated);
    onShowToast(
      updated.isEnabled ? 'تم تفعيل ظهور منظومة الخدمات' : 'تم إخفاء منظومة الخدمات من الموقع',
      'success'
    );
  };

  const handleToggleServiceActive = (serviceId: string) => {
    const updatedServices = services.map(s =>
      s.id === serviceId ? { ...s, isActive: !s.isActive } : s
    );
    const updated = { ...form, services: updatedServices };
    setForm(updated);
    onUpdateIntegratedServices(updated);
  };

  const handleMoveService = (serviceId: string, direction: 'up' | 'down') => {
    const index = services.findIndex(s => s.id === serviceId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    const newServices = [...services];
    const temp = newServices[index];
    newServices[index] = newServices[targetIndex];
    newServices[targetIndex] = temp;

    const reordered = newServices.map((s, idx) => ({ ...s, order: idx + 1 }));
    const updated = { ...form, services: reordered };
    setForm(updated);
    onUpdateIntegratedServices(updated);
  };

  const handleAddNewService = () => {
    const newService: IntegratedServiceItem = {
      id: `service_${Date.now()}`,
      title: 'خدمة جديدة',
      titleEn: 'New Service',
      badge: 'خدمة متميزة',
      badgeEn: 'Special Service',
      description: 'أدخل وصف الخدمة ومميزاتها لضيوف الرحمن والشركات.',
      descriptionEn: 'Enter service description and highlights.',
      iconName: 'Sparkles',
      highlights: ['ميزة الخدمة الأولى', 'ميزة الخدمة الثانية'],
      buttonText: 'طلب عرض خدمة',
      buttonAction: 'contact',
      isActive: true,
      showBadge: true,
      showDescription: true,
      showHighlights: true,
      showButton: true,
      order: services.length + 1
    };
    const updated = { ...form, services: [...services, newService] };
    setForm(updated);
    setEditingServiceId(newService.id);
    onUpdateIntegratedServices(updated);
    onShowToast('تمت إضافة خدمة جديدة، يمكنك الآن تعديل تفاصيلها', 'success');
  };

  const handleDeleteService = (serviceId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
      const updatedServices = services.filter(s => s.id !== serviceId);
      const updated = { ...form, services: updatedServices };
      setForm(updated);
      if (editingServiceId === serviceId) setEditingServiceId(null);
      onUpdateIntegratedServices(updated);
      onShowToast('تم حذف الخدمة', 'info');
    }
  };

  const currentEditingService = services.find(s => s.id === editingServiceId);

  const handleUpdateEditingService = (field: keyof IntegratedServiceItem, value: any) => {
    if (!editingServiceId) return;
    const updatedServices = services.map(s =>
      s.id === editingServiceId ? { ...s, [field]: value } : s
    );
    const updated = { ...form, services: updatedServices };
    setForm(updated);
    onUpdateIntegratedServices(updated);
  };

  const handleAddHighlightToEditingService = () => {
    if (!newHighlightText.trim() || !editingServiceId || !currentEditingService) return;
    const currentHighlights = currentEditingService.highlights || [];
    const updatedHighlights = [...currentHighlights, newHighlightText.trim()];
    handleUpdateEditingService('highlights', updatedHighlights);
    setNewHighlightText('');
  };

  const handleRemoveHighlight = (hIdx: number) => {
    if (!currentEditingService) return;
    const updatedHighlights = (currentEditingService.highlights || []).filter((_, i) => i !== hIdx);
    handleUpdateEditingService('highlights', updatedHighlights);
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
      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
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
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-cairo font-bold text-stone-900">
              إدارة منظومة الخدمات المتكاملة (Integrated Services)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              تحكم في إظهار أو إخفاء المنظومة، إضافة خدمات جديدة، وتخصيص كل زر وبطاقة ونقطة مميزة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleToggleSection}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              form.isEnabled !== false
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
            }`}
          >
            {form.isEnabled !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{form.isEnabled !== false ? 'المنظومة مفعّلة وظاهرة' : 'المنظومة مخفية بالكامل'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
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

      {/* Section Header Elements Control */}
      <div className="space-y-4">
        <h3 className="text-sm font-cairo font-bold text-stone-900 flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-[#B38A34]" />
          <span>عناوين رأس قسم الخدمات والتحكم في إظهارها</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">الشارة (Badge):</label>
              <VisibilityToggle
                active={form.showBadge !== false}
                onToggle={() => setForm({ ...form, showBadge: form.showBadge === false })}
              />
            </div>
            <input
              type="text"
              value={form.badge || ''}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              placeholder="خدماتنا المتكاملة"
              className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-[#C9A24B] focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">العنوان الرئيسي للمنظومة:</label>
              <VisibilityToggle
                active={form.showTitle !== false}
                onToggle={() => setForm({ ...form, showTitle: form.showTitle === false })}
              />
            </div>
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="منظومة ضيافة متكاملة تحت سقف واحد"
              className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-[#C9A24B] focus:outline-none font-bold"
            />
          </div>

          <div className="md:col-span-3 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">الوصف الفرعي للمنظومة:</label>
              <VisibilityToggle
                active={form.showSubtitle !== false}
                onToggle={() => setForm({ ...form, showSubtitle: form.showSubtitle === false })}
              />
            </div>
            <textarea
              rows={2}
              value={form.subtitle || ''}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="نقدم لعملائنا من الشركات والمجموعات وضيوف الرحمن باقة خدمات شاملة..."
              className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-[#C9A24B] focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Global Cards Feature Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-800 block">أزرار البطاقات (طلب عرض خدمة / استكشاف)</span>
              <span className="text-[11px] text-stone-500">إظهار أو إخفاء أزرار الانتقال في أسفل كل بطاقة</span>
            </div>
            <VisibilityToggle
              active={form.showCardButtons !== false}
              onToggle={() => setForm({ ...form, showCardButtons: form.showCardButtons === false })}
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-800 block">النقاط المميزة بالبطاقات (Highlights)</span>
              <span className="text-[11px] text-stone-500">إظهار أو إخفاء القائمة النقطية للمميزات</span>
            </div>
            <VisibilityToggle
              active={form.showCardHighlights !== false}
              onToggle={() => setForm({ ...form, showCardHighlights: form.showCardHighlights === false })}
            />
          </div>
        </div>
      </div>

      {/* Services List and Edit Section */}
      <div className="pt-6 border-t border-stone-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-cairo font-bold text-stone-900">
              بطاقات الخدمات المتوفرة ({services.length} خدمات)
            </h3>
            <p className="text-xs text-stone-500">
              يمكنك إعادة ترتيب البطاقات، تفعيلها/إلغاؤها، وتعديل أيقونتها ونصوصها
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddNewService}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة بطاقة خدمة جديدة</span>
          </button>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((srv, idx) => {
            const isEditing = editingServiceId === srv.id;
            const IconObj = AVAILABLE_SERVICE_ICONS.find(i => i.name === srv.iconName) || AVAILABLE_SERVICE_ICONS[4];
            const IconComp = IconObj.icon;

            return (
              <div
                key={srv.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isEditing 
                    ? 'bg-amber-50/60 border-[#C9A24B] shadow-md ring-2 ring-[#C9A24B]/20' 
                    : srv.isActive !== false 
                    ? 'bg-white border-stone-200 hover:border-[#C9A24B] shadow-2xs' 
                    : 'bg-stone-50 border-dashed border-stone-300 opacity-60'
                }`}
              >
                <div>
                  {/* Top Bar: Icon, Active Toggle & Reorder */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveService(srv.id, 'up')}
                        className="p-1 rounded-lg text-stone-500 hover:bg-stone-200 disabled:opacity-30"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === services.length - 1}
                        onClick={() => handleMoveService(srv.id, 'down')}
                        className="p-1 rounded-lg text-stone-500 hover:bg-stone-200 disabled:opacity-30"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleServiceActive(srv.id)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          srv.isActive !== false ? 'text-emerald-600 hover:bg-emerald-50' : 'text-stone-400 hover:bg-stone-200'
                        }`}
                        title={srv.isActive !== false ? 'إخفاء الخدمة' : 'إظهار الخدمة'}
                      >
                        {srv.isActive !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Title & Badge */}
                  <div className="mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF8F5] text-stone-600 border border-[#E8E2D8]">
                      {srv.badge || 'خدمة'}
                    </span>
                    <h4 className="font-cairo font-bold text-sm text-stone-900 mt-1">
                      {srv.title}
                    </h4>
                  </div>

                  <p className="text-xs text-stone-500 line-clamp-2 mb-3">
                    {srv.description}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingServiceId(isEditing ? null : srv.id)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isEditing 
                        ? 'bg-[#C9A24B] text-white' 
                        : 'bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'إغلاق التعديل' : 'تعديل التفاصيل'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteService(srv.id)}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="حذف الخدمة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Edit Modal/Panel for selected service */}
        {currentEditingService && (
          <div className="p-6 rounded-3xl bg-amber-50/40 border border-[#C9A24B]/40 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#C9A24B]/20">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#B38A34]" />
                <h4 className="font-cairo font-bold text-base text-stone-900">
                  تعديل خدمة: {currentEditingService.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingServiceId(null)}
                className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Individual Card Elements Visibility Toggles */}
            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-stone-800">إظهار/إخفاء عناصر هذه البطاقة:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <VisibilityToggle
                  active={currentEditingService.showTitle !== false}
                  onToggle={() => handleUpdateEditingService('showTitle', currentEditingService.showTitle === false)}
                  label={currentEditingService.showTitle !== false ? 'العنوان ظاهر' : 'العنوان مخفي'}
                />
                <VisibilityToggle
                  active={currentEditingService.showBadge !== false}
                  onToggle={() => handleUpdateEditingService('showBadge', currentEditingService.showBadge === false)}
                  label={currentEditingService.showBadge !== false ? 'الشارة ظاهرة' : 'الشارة مخفية'}
                />
                <VisibilityToggle
                  active={currentEditingService.showDescription !== false}
                  onToggle={() => handleUpdateEditingService('showDescription', currentEditingService.showDescription === false)}
                  label={currentEditingService.showDescription !== false ? 'الوصف ظاهر' : 'الوصف مخفي'}
                />
                <VisibilityToggle
                  active={currentEditingService.showHighlights !== false}
                  onToggle={() => handleUpdateEditingService('showHighlights', currentEditingService.showHighlights === false)}
                  label={currentEditingService.showHighlights !== false ? 'النقاط ظاهرة' : 'النقاط مخفية'}
                />
                <VisibilityToggle
                  active={currentEditingService.showButton !== false}
                  onToggle={() => handleUpdateEditingService('showButton', currentEditingService.showButton === false)}
                  label={currentEditingService.showButton !== false ? 'الزر ظاهر' : 'الزر مخفي'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">أيقونة الخدمة:</label>
                <select
                  value={currentEditingService.iconName || 'Sparkles'}
                  onChange={(e) => handleUpdateEditingService('iconName', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 outline-none"
                >
                  {AVAILABLE_SERVICE_ICONS.map(ic => (
                    <option key={ic.name} value={ic.name}>
                      {ic.label} ({ic.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Badge Arabic */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">شارة البطاقة (عربي):</label>
                <input
                  type="text"
                  value={currentEditingService.badge || ''}
                  onChange={(e) => handleUpdateEditingService('badge', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 outline-none"
                />
              </div>

              {/* Title Arabic */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">عنوان الخدمة (عربي):</label>
                <input
                  type="text"
                  value={currentEditingService.title || ''}
                  onChange={(e) => handleUpdateEditingService('title', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 outline-none"
                />
              </div>

              {/* Description Arabic */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-stone-700 mb-1">وصف الخدمة ومميزاتها (عربي):</label>
                <textarea
                  rows={2}
                  value={currentEditingService.description || ''}
                  onChange={(e) => handleUpdateEditingService('description', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 outline-none leading-relaxed"
                />
              </div>

              {/* Button Text & Action */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">نص زر الإجراء:</label>
                <input
                  type="text"
                  value={currentEditingService.buttonText || ''}
                  onChange={(e) => handleUpdateEditingService('buttonText', e.target.value)}
                  placeholder="طلب عرض خدمة"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">وجهة النقر (Action):</label>
                <select
                  value={currentEditingService.buttonAction || 'contact'}
                  onChange={(e) => handleUpdateEditingService('buttonAction', e.target.value as ActivePage)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 outline-none"
                >
                  <option value="contact">صفحة تواصل معنا (Contact Page)</option>
                  <option value="hotels">صفحة قائمة الفنادق (Hotels Page)</option>
                  <option value="offers">صفحة العروض (Offers Page)</option>
                  <option value="about">صفحة من نحن (About Page)</option>
                </select>
              </div>
            </div>

            {/* Highlights Management */}
            <div className="pt-4 border-t border-[#C9A24B]/20 space-y-3">
              <label className="block text-xs font-bold text-stone-700">
                النقاط المميزة بالبطاقة (Feature Bullets):
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHighlightText}
                  onChange={(e) => setNewHighlightText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddHighlightToEditingService()}
                  placeholder="أدخل ميزة جديدة (مثال: توفير باصات VIP حديثة)"
                  className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddHighlightToEditingService}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold"
                >
                  إضافة نقطة
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(currentEditingService.highlights || []).map((hl, hIdx) => (
                  <span
                    key={hIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-stone-300 text-xs text-stone-800 font-medium shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#B38A34]" />
                    <span>{hl}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHighlight(hIdx)}
                      className="text-stone-400 hover:text-red-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setEditingServiceId(null)}
                className="px-6 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                تم التعديل ✓
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
