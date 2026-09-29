import React, { useState } from 'react';
import { QuickLinkItem, ActivePage } from '../types';
import { DEFAULT_QUICK_LINKS } from '../services/firebase';
import { 
  Link2, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Check, 
  X, 
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Layers,
  Compass
} from 'lucide-react';

interface AdminQuickLinksManagerProps {
  links: QuickLinkItem[];
  onChange: (links: QuickLinkItem[]) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminQuickLinksManager: React.FC<AdminQuickLinksManagerProps> = ({
  links = DEFAULT_QUICK_LINKS,
  onChange,
  onShowToast
}) => {
  const currentLinks = links && links.length > 0 ? links : DEFAULT_QUICK_LINKS;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  const [form, setForm] = useState<QuickLinkItem>({
    id: '',
    title: '',
    targetPage: 'home',
    url: '',
    isActive: true,
    order: 0,
    isCustom: true
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    link: QuickLinkItem | null;
  }>({
    isOpen: false,
    link: null
  });

  const standardPages: { key: string; label: string }[] = [
    { key: 'home', label: 'الرئيسية (الصفحة الأولى)' },
    { key: 'hotels', label: 'فنادق مكة والمدينة' },
    { key: 'packages', label: 'باقات الحج والعمرة' },
    { key: 'offers', label: 'العروض والمناسبات' },
    { key: 'about', label: 'من نحن' },
    { key: 'contact', label: 'تواصل معنا' },
    { key: 'custom_url', label: 'رابط خارجي أو مخصص (URL)' },
  ];

  const handleToggleActive = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = currentLinks.map(link => {
      if (link.id === id) {
        const nextState = !link.isActive;
        onShowToast(
          nextState 
            ? `تم تفعيل وإظهار رابط "${link.title}" للزوار` 
            : `تم إخفاء رابط "${link.title}" من الفوتر`,
          nextState ? 'success' : 'info'
        );
        return { ...link, isActive: nextState };
      }
      return link;
    });
    onChange(updated);
  };

  const handleOpenAdd = () => {
    setEditingLinkId(null);
    setForm({
      id: 'quick_' + Date.now(),
      title: '',
      targetPage: 'hotels',
      url: '',
      isActive: true,
      order: currentLinks.length + 1,
      isCustom: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (link: QuickLinkItem) => {
    setEditingLinkId(link.id);
    setForm({ ...link });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      onShowToast('يرجى كتابة عنوان الرابط', 'error');
      return;
    }

    const payload: QuickLinkItem = {
      ...form,
      title: form.title.trim(),
      order: Number(form.order) || (currentLinks.length + 1)
    };

    let updated: QuickLinkItem[];
    if (editingLinkId) {
      updated = currentLinks.map(l => l.id === editingLinkId ? payload : l);
    } else {
      updated = [...currentLinks, payload];
    }

    // Sort by order
    updated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    onChange(updated);
    setIsModalOpen(false);
    onShowToast(
      editingLinkId ? 'تم تحديث بيانات الرابط السريع بنجاح' : 'تمت إضافة الرابط السريع الجديد بنجاح', 
      'success'
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentLinks.length) return;

    const newArr = [...currentLinks];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;

    // update order numbers
    const normalized = newArr.map((item, idx) => ({ ...item, order: idx + 1 }));
    onChange(normalized);
    onShowToast('تم تحديث ترتيب الروابط', 'info');
  };

  const confirmDelete = (link: QuickLinkItem) => {
    setDeleteModal({
      isOpen: true,
      link
    });
  };

  const executeDelete = () => {
    if (!deleteModal.link) return;
    const updated = currentLinks.filter(l => l.id !== deleteModal.link?.id);
    onChange(updated);
    setDeleteModal({ isOpen: false, link: null });
    onShowToast('تم حذف الرابط بنجاح', 'info');
  };

  const handleResetToDefaults = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في استعادة الروابط السريعة الافتراضية؟')) {
      onChange(DEFAULT_QUICK_LINKS);
      onShowToast('تمت استعادة الروابط الافتراضية بنجاح', 'success');
    }
  };

  const getTargetLabel = (link: QuickLinkItem) => {
    if (link.targetPage === 'custom_url' || link.url) {
      return link.url || 'رابط خارجي مخصص';
    }
    const found = standardPages.find(p => p.key === link.targetPage);
    return found ? found.label : (link.targetPage || 'صفحة داخلية');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <h3 className="font-cairo font-bold text-lg text-stone-900">
              الروابط السريعة (Quick Links) في الفوتر
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            تحكم كامل في إظهار أو إخفاء أي رابط، تعديل المسميات، وإضافة روابط جديدة تظهر لزوار الموقع في الفوتر
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="استعادة الروابط الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>الافتراضية</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة رابط جديد</span>
          </button>
        </div>
      </div>

      {/* Quick Summary / Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-500" />
            <span className="text-xs text-stone-600 font-semibold">إجمالي الروابط:</span>
          </div>
          <span className="text-sm font-bold font-mono text-stone-900">{currentLinks.length}</span>
        </div>

        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-emerald-800 font-semibold">الروابط الظاهرة للزوار:</span>
          </div>
          <span className="text-sm font-bold font-mono text-emerald-700">
            {currentLinks.filter(l => l.isActive !== false).length}
          </span>
        </div>

        <div className="p-3.5 bg-stone-100/80 rounded-2xl border border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-stone-500" />
            <span className="text-xs text-stone-600 font-semibold">الروابط المخفية:</span>
          </div>
          <span className="text-sm font-bold font-mono text-stone-600">
            {currentLinks.filter(l => l.isActive === false).length}
          </span>
        </div>
      </div>

      {/* Links List */}
      <div className="space-y-3">
        {currentLinks.map((link, index) => {
          const isVisible = link.isActive !== false;
          return (
            <div
              key={link.id || index}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isVisible
                  ? 'bg-white border-stone-200 shadow-2xs hover:border-[#C9A24B]/40'
                  : 'bg-stone-50/80 border-stone-200/60 opacity-75'
              }`}
            >
              {/* Left Side Info: Order, Title & Target */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {/* Order Controls */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded-md bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed text-stone-600 transition-colors"
                    title="تحريك لأعلى"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === currentLinks.length - 1}
                    className="p-1 rounded-md bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed text-stone-600 transition-colors"
                    title="تحريك لأسفل"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Status Dot */}
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isVisible ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-stone-400'
                }`} />

                {/* Link Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-cairo font-bold text-sm text-stone-900">
                      {link.title}
                    </span>
                    {link.isCustom && (
                      <span className="px-2 py-0.5 rounded-md bg-[#C9A24B]/15 text-[#B38A34] text-[10px] font-bold">
                        مخصص
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5 truncate">
                    <Compass className="w-3 h-3 text-[#B38A34] shrink-0" />
                    <span className="truncate">{getTargetLabel(link)}</span>
                  </div>
                </div>
              </div>

              {/* Right Side Actions: Toggle Switch, Edit & Delete */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {/* Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleActive(link.id, e)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                    isVisible
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                      : 'bg-stone-200 text-stone-600 hover:bg-stone-300 border border-stone-300'
                  }`}
                  title={isVisible ? 'انقر لإخفاء هذا الرابط من الفوتر' : 'انقر لإظهار هذا الرابط في الفوتر'}
                >
                  {isVisible ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>مفعّل (ظاهر)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                      <span>مخفي</span>
                    </>
                  )}
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(link)}
                  className="p-2 rounded-xl bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 transition-colors"
                  title="تعديل الرابط"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button (Allowed for all or custom) */}
                <button
                  type="button"
                  onClick={() => confirmDelete(link)}
                  className="p-2 rounded-xl bg-stone-100 hover:bg-red-500 hover:text-white text-stone-600 transition-colors"
                  title="حذف الرابط"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-lg text-stone-900">
                    {editingLinkId ? 'تعديل الرابط السريع' : 'إضافة رابط سريع جديد'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    حدد عنوان الرابط والوجهة وحالة الظهور للزوار
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Link Title */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  عنوان الرابط (الاسم الظاهر): <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: فنادق رمضان، باقات العمرة، سياسة الخصوصية"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Target Destination Dropdown */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  وجهة الرابط (الصفحة المستهدفة): <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.targetPage || 'home'}
                  onChange={(e) => setForm({ ...form, targetPage: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                >
                  {standardPages.map(page => (
                    <option key={page.key} value={page.key}>
                      {page.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom URL Field if selected */}
              {(form.targetPage === 'custom_url' || !standardPages.some(p => p.key === form.targetPage)) && (
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    الرابط الخارجي المخصص (URL):
                  </label>
                  <input
                    type="url"
                    value={form.url || ''}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://example.com/page"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs font-mono focus:border-[#C9A24B] focus:bg-white focus:outline-none dir-ltr text-left"
                  />
                </div>
              )}

              {/* Visibility State (Active/Hidden) Toggle */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="font-cairo font-bold text-xs text-stone-900 block">
                    حالة الظهور في الفوتر
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    {form.isActive !== false ? 'الرابط سيظهر للزوار في الفوتر' : 'الرابط مخفي ولن يظهر للزوار'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: form.isActive === false })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    form.isActive !== false
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-200 text-stone-600 border border-stone-300'
                  }`}
                >
                  {form.isActive !== false ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>مفعّل (ظاهر)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                      <span>مخفي</span>
                    </>
                  )}
                </button>
              </div>

              {/* Order Field */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  رقم الترتيب:
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.order || 1}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:border-[#C9A24B] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingLinkId ? 'حفظ التعديلات' : 'إضافة الرابط'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-cairo font-bold text-lg text-stone-900 text-center mb-2">
              تأكيد حذف الرابط السريع
            </h3>
            <p className="text-xs text-stone-600 text-center leading-relaxed mb-6">
              هل أنت متأكد من رغبتك في حذف رابط <strong className="text-stone-900">"{deleteModal.link?.title}"</strong>؟ يمكنك إعادة إضافته لاحقاً في أي وقت.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, link: null })}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
