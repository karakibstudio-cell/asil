import React, { useState } from 'react';
import { BranchLocation } from '../types';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Check, 
  X, 
  AlertTriangle,
  Navigation,
  Globe,
  Building
} from 'lucide-react';

interface AdminBranchesManagerProps {
  branches: BranchLocation[];
  onChange: (branches: BranchLocation[]) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminBranchesManager: React.FC<AdminBranchesManagerProps> = ({
  branches = [],
  onChange,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  const [form, setForm] = useState<BranchLocation>({
    id: '',
    name: '',
    city: 'مكة المكرمة',
    address: '',
    mapUrl: '',
    phone: '',
    order: 0
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    branch: BranchLocation | null;
  }>({
    isOpen: false,
    branch: null
  });

  const handleOpenAdd = () => {
    setEditingBranchId(null);
    setForm({
      id: 'branch_' + Date.now(),
      name: '',
      city: 'مكة المكرمة',
      address: '',
      mapUrl: '',
      phone: '',
      order: branches.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: BranchLocation) => {
    setEditingBranchId(branch.id);
    setForm({ ...branch });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      onShowToast('يرجى كتابة اسم الفرع', 'error');
      return;
    }
    if (!form.address.trim()) {
      onShowToast('يرجى كتابة عنوان الفرع', 'error');
      return;
    }

    let finalMapUrl = form.mapUrl?.trim();
    if (!finalMapUrl) {
      // Auto generate google maps search url from address
      finalMapUrl = `https://maps.google.com/?q=${encodeURIComponent(`${form.name} ${form.address}`)}`;
    }

    const payload: BranchLocation = {
      ...form,
      mapUrl: finalMapUrl
    };

    let updated: BranchLocation[];
    if (editingBranchId) {
      updated = branches.map(b => b.id === editingBranchId ? payload : b);
    } else {
      updated = [...branches, payload];
    }

    onChange(updated);
    setIsModalOpen(false);
    onShowToast(editingBranchId ? 'تم تحديث بيانات الفرع بنجاح' : 'تمت إضافة الفرع الجديد بنجاح', 'success');
  };

  const confirmDelete = (branch: BranchLocation) => {
    setDeleteModal({
      isOpen: true,
      branch
    });
  };

  const executeDelete = () => {
    if (!deleteModal.branch) return;
    const updated = branches.filter(b => b.id !== deleteModal.branch?.id);
    onChange(updated);
    setDeleteModal({ isOpen: false, branch: null });
    onShowToast('تم حذف الفرع بنجاح', 'info');
  };

  const generateAutoMapLink = () => {
    if (form.address || form.name) {
      const query = encodeURIComponent(`${form.name} ${form.address}`);
      setForm(prev => ({
        ...prev,
        mapUrl: `https://maps.google.com/?q=${query}`
      }));
      onShowToast('تم إنشاء رابط الخريطة تلقائياً', 'info');
    } else {
      onShowToast('يرجى كتابة اسم الفرع والعنوان أولاً', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-cairo font-bold text-lg text-stone-900">
              فروعنا وروابط الخرائط (Google Maps)
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            إدارة مواقع وعناوين الفروع وروابط الخرائط التفاعلية التي تظهر للزوار في الفوتر وصفحة التواصل
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة فرع جديد</span>
        </button>
      </div>

      {/* Branches List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="p-5 rounded-2xl bg-stone-50 border border-stone-200/90 hover:border-[#C9A24B]/60 transition-all flex flex-col justify-between gap-4 shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center shrink-0 border border-[#C9A24B]/30">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-cairo font-bold text-sm text-stone-900">
                      {branch.name}
                    </h4>
                    <span className="text-[11px] text-[#B38A34] font-semibold">
                      {branch.city}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(branch)}
                    className="p-1.5 rounded-lg bg-white text-stone-600 hover:text-[#B38A34] border border-stone-200 hover:border-[#C9A24B] transition-colors"
                    title="تعديل الفرع ورابط الخريطة"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(branch)}
                    className="p-1.5 rounded-lg bg-white text-stone-600 hover:text-red-600 border border-stone-200 hover:border-red-300 transition-colors"
                    title="حذف الفرع"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed pt-1">
                {branch.address}
              </p>
            </div>

            {/* Map Link Info & Test Button */}
            <div className="pt-3 border-t border-stone-200/70 flex items-center justify-between gap-2">
              {branch.mapUrl ? (
                <a
                  href={branch.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#B38A34] border border-[#C9A24B]/40 hover:bg-[#C9A24B] hover:text-white transition-all text-xs font-bold shadow-2xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>معاينة واختبار الخريطة</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                  لم يتم إضافة رابط خريطة
                </span>
              )}

              {branch.phone && (
                <span className="text-[11px] text-stone-500 font-mono dir-ltr">
                  {branch.phone}
                </span>
              )}
            </div>
          </div>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
            لا توجد فروع مضافة حالياً. اضغط على "+ إضافة فرع جديد" لإضافة موقع جديد ورابط خريطته.
          </div>
        )}
      </div>

      {/* Add / Edit Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  {editingBranchId ? 'تعديل بيانات الفرع والخريطة' : 'إضافة فرع جديد'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">اسم الفرع: *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: فرع مكة المكرمة، فرع المدينة المنورة، فرع الرياض..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">المدينة: *</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="مثال: مكة المكرمة، المدينة المنورة، جدة..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">العنوان التفصيلي: *</label>
                <textarea
                  rows={2}
                  required
                  value={form.address}
                  onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="مثال: أبراج وقف الملك عبدالعزيز، طريق أجياد، مكة المكرمة"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">رابط الموقع على خرائط Google (Maps Link):</label>
                  <button
                    type="button"
                    onClick={generateAutoMapLink}
                    className="text-[11px] text-[#B38A34] hover:underline font-semibold"
                  >
                    توليد رابط تلقائي
                  </button>
                </div>
                <input
                  type="url"
                  value={form.mapUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, mapUrl: e.target.value }))}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                />
                <span className="text-[11px] text-stone-500 block mt-1">
                  يمكنك نسخ رابط مشاركة الموقع من تطبيق أو موقع Google Maps ولصقه هنا مباشرة.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">رقم هاتف الفرع (اختياري):</label>
                <input
                  type="tel"
                  value={form.phone || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+966501234567"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBranchId ? 'حفظ تعديلات الفرع' : 'إضافة الفرع'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-cairo font-bold text-xl text-stone-900 text-center mb-2">تأكيد حذف الفرع</h3>
            <p className="text-xs sm:text-sm text-stone-600 text-center leading-relaxed mb-6">
              هل أنت متأكد من رغبتك في حذف <strong className="text-stone-900">"{deleteModal.branch?.name}"</strong>؟
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                نعم، احذف الفرع
              </button>
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, branch: null })}
                className="flex-1 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
