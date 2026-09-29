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
  Building, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Phone, 
  Clock, 
  Mail, 
  Star,
  CheckCircle2
} from 'lucide-react';
import { WhatsAppIcon } from './BookingIcons';

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
    whatsapp: '',
    workingHours: 'على مدار الساعة 24/7',
    email: '',
    isMainBranch: false,
    isActive: true,
    order: 0
  });

  const [samePhoneForWhatsApp, setSamePhoneForWhatsApp] = useState(true);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    branch: BranchLocation | null;
  }>({
    isOpen: false,
    branch: null
  });

  const handleOpenAdd = () => {
    setEditingBranchId(null);
    setSamePhoneForWhatsApp(true);
    setForm({
      id: 'branch_' + Date.now(),
      name: '',
      city: 'مكة المكرمة',
      address: '',
      mapUrl: '',
      phone: '',
      whatsapp: '',
      workingHours: 'على مدار الساعة 24/7',
      email: '',
      isMainBranch: branches.length === 0,
      isActive: true,
      order: branches.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: BranchLocation) => {
    setEditingBranchId(branch.id);
    const isSame = !branch.whatsapp || branch.whatsapp === branch.phone;
    setSamePhoneForWhatsApp(isSame);
    setForm({
      id: branch.id,
      name: branch.name || '',
      city: branch.city || 'مكة المكرمة',
      address: branch.address || '',
      mapUrl: branch.mapUrl || '',
      phone: branch.phone || '',
      whatsapp: branch.whatsapp || '',
      workingHours: branch.workingHours || 'على مدار الساعة 24/7',
      email: branch.email || '',
      isMainBranch: Boolean(branch.isMainBranch),
      isActive: branch.isActive !== false,
      order: typeof branch.order === 'number' ? branch.order : 1
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    const updated = branches.map(b => b.id === id ? { ...b, isActive: !currentActive } : b);
    onChange(updated);
    onShowToast(!currentActive ? 'تم تفعيل ظهور الفرع في الموقع' : 'تم إخفاء الفرع من العرض للزوار', 'success');
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= branches.length) return;

    const list = [...branches];
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);

    // Update orders sequentially
    const reordered = list.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    onChange(reordered);
    onShowToast('تم تحديث ترتيب الفروع بنجاح', 'success');
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
      finalMapUrl = `https://maps.google.com/?q=${encodeURIComponent(`${form.name} ${form.address}`)}`;
    }

    const finalWhatsApp = samePhoneForWhatsApp ? form.phone : form.whatsapp;

    let payload: BranchLocation = {
      ...form,
      whatsapp: finalWhatsApp,
      mapUrl: finalMapUrl
    };

    // If marked as main branch, demote others
    let updated: BranchLocation[];
    if (form.isMainBranch) {
      const sanitizedBranches = branches.map(b => ({ ...b, isMainBranch: false }));
      if (editingBranchId) {
        updated = sanitizedBranches.map(b => b.id === editingBranchId ? payload : b);
      } else {
        updated = [...sanitizedBranches, payload];
      }
    } else {
      if (editingBranchId) {
        updated = branches.map(b => b.id === editingBranchId ? payload : b);
      } else {
        updated = [...branches, payload];
      }
    }

    onChange(updated);
    setIsModalOpen(false);
    onShowToast(editingBranchId ? 'تم تحديث بيانات الفرع بنجاح وتحديث ظهوره فورياً' : 'تمت إضافة الفرع الجديد بنجاح ويظهر في الفوتر ومن نحن وتواصل معنا', 'success');
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
      const query = encodeURIComponent(`${form.name} ${form.city} ${form.address}`);
      setForm(prev => ({
        ...prev,
        mapUrl: `https://maps.google.com/?q=${query}`
      }));
      onShowToast('تم إنشاء رابط خريطة Google Maps تلقائياً', 'info');
    } else {
      onShowToast('يرجى كتابة اسم الفرع والعنوان أولاً', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center border border-[#C9A24B]/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cairo font-bold text-lg text-stone-900">
                إدارة الفروع والمواقع الرسمية (Google Maps)
              </h3>
              <p className="text-xs text-stone-500">
                أي فرع يتم إضافته أو تعديله هنا ينعكس فوراً في (الفوتر، صفحة من نحن، صفحة تواصل معنا)
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة فرع جديد</span>
        </button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch, index) => {
          const isActive = branch.isActive !== false;
          return (
            <div
              key={branch.id || index}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 shadow-xs ${
                isActive 
                  ? 'bg-stone-50/90 border-stone-200/90 hover:border-[#C9A24B]/60' 
                  : 'bg-stone-100/60 border-dashed border-stone-300 opacity-60'
              }`}
            >
              <div className="space-y-3">
                {/* Branch Header: Name, City & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center shrink-0 border border-[#C9A24B]/30">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-cairo font-bold text-sm sm:text-base text-stone-900">
                          {branch.name}
                        </h4>
                        {branch.isMainBranch && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A24B] text-white shadow-2xs">
                            الفرع الرئيسي
                          </span>
                        )}
                        {!isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-300 text-stone-700">
                            مخفي
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#B38A34] font-semibold">
                        {branch.city}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Reorder, Active Toggle, Edit, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveOrder(index, 'up')}
                      className="p-1.5 rounded-lg bg-white text-stone-600 hover:text-[#B38A34] border border-stone-200 disabled:opacity-30 transition-colors"
                      title="تحريك لأعلى"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === branches.length - 1}
                      onClick={() => handleMoveOrder(index, 'down')}
                      className="p-1.5 rounded-lg bg-white text-stone-600 hover:text-[#B38A34] border border-stone-200 disabled:opacity-30 transition-colors"
                      title="تحريك لأسفل"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(branch.id, isActive)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-stone-200 text-stone-600 border-stone-300 hover:bg-stone-300'
                      }`}
                      title={isActive ? 'الفرع مفعل وظاهر (انقر للإخفاء)' : 'الفرع مخفي (انقر للتفعيل)'}
                    >
                      {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(branch)}
                      className="p-1.5 rounded-lg bg-white text-stone-600 hover:text-[#B38A34] border border-stone-200 hover:border-[#C9A24B] transition-colors"
                      title="تعديل بيانات الفرع"
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

                {/* Address Description */}
                <p className="text-xs text-stone-600 leading-relaxed pt-1">
                  {branch.address}
                </p>

                {/* Contacts row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-200/60">
                  {branch.phone && (
                    <div className="flex items-center gap-1.5 text-stone-700">
                      <Phone className="w-3.5 h-3.5 text-[#B38A34] shrink-0" />
                      <span className="font-mono dir-ltr">{branch.phone}</span>
                    </div>
                  )}
                  {branch.whatsapp && (
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                      <span className="font-mono dir-ltr">{branch.whatsapp}</span>
                    </div>
                  )}
                  {branch.workingHours && (
                    <div className="flex items-center gap-1.5 text-stone-500 col-span-full">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{branch.workingHours}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Map Link Info & Preview Button */}
              <div className="pt-3 border-t border-stone-200/70 flex items-center justify-between gap-2">
                {branch.mapUrl ? (
                  <a
                    href={branch.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#B38A34] border border-[#C9A24B]/40 hover:bg-[#C9A24B] hover:text-white transition-all text-xs font-bold shadow-2xs"
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

                <span className="text-[11px] text-stone-400 font-mono">
                  الترتيب: #{branch.order || index + 1}
                </span>
              </div>
            </div>
          );
        })}

        {branches.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs sm:text-sm text-stone-500 bg-stone-50 rounded-3xl border border-dashed border-stone-300">
            لا توجد فروع مضافة حالياً. اضغط على "+ إضافة فرع جديد" لإضافة موقع جديد ورابط خريطته.
          </div>
        )}
      </div>

      {/* Add / Edit Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center border border-[#C9A24B]/30">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-lg text-stone-900 leading-tight">
                    {editingBranchId ? 'تعديل بيانات الفرع والخريطة' : 'إضافة فرع جديد'}
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    سيظهر الفرع تلقائياً في الفوتر ومن نحن وتواصل معنا
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Branch Name */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">اسم الفرع: *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: فرع مكة المكرمة (المقر الرئيسي)، فرع المدينة المنورة، فرع الرياض..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">المدينة: *</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="مثال: مكة المكرمة، المدينة المنورة، جدة، الرياض..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              {/* Detailed Address */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">العنوان التفصيلي: *</label>
                <textarea
                  rows={2}
                  required
                  value={form.address}
                  onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="مثال: أبراج وقف الملك عبدالعزيز (الصفوة)، شارع أجياد، مكة المكرمة"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              {/* Map Link */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">رابط الموقع على خرائط Google (Google Maps URL):</label>
                  <button
                    type="button"
                    onClick={generateAutoMapLink}
                    className="text-[11px] text-[#B38A34] hover:underline font-bold cursor-pointer"
                  >
                    ⚡ توليد رابط خريطة تلقائي
                  </button>
                </div>
                <input
                  type="url"
                  value={form.mapUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, mapUrl: e.target.value }))}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                />
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">رقم هاتف الفرع:</label>
                  <input
                    type="tel"
                    value={form.phone || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        phone: val,
                        whatsapp: samePhoneForWhatsApp ? val : prev.whatsapp
                      }));
                    }}
                    placeholder="+966501234567"
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">رقم واتساب الفرع:</label>
                  <input
                    type="tel"
                    disabled={samePhoneForWhatsApp}
                    value={samePhoneForWhatsApp ? (form.phone || '') : (form.whatsapp || '')}
                    onChange={(e) => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="+966501234567"
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right font-mono disabled:bg-stone-200/50 disabled:text-stone-500"
                  />
                </div>
              </div>

              {/* Checkbox: Same phone for WhatsApp */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={samePhoneForWhatsApp}
                  onChange={(e) => {
                    setSamePhoneForWhatsApp(e.target.checked);
                    if (e.target.checked) {
                      setForm(prev => ({ ...prev, whatsapp: prev.phone }));
                    }
                  }}
                  className="rounded text-[#C9A24B] focus:ring-[#C9A24B] w-4 h-4"
                />
                <span>استخدام نفس رقم الهاتف لحساب الواتساب</span>
              </label>

              {/* Working Hours & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">ساعات العمل:</label>
                  <input
                    type="text"
                    value={form.workingHours || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, workingHours: e.target.value }))}
                    placeholder="مثال: على مدار الساعة 24/7"
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">البريد الإلكتروني (اختياري):</label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="branch@prestigehotels.sa"
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right"
                  />
                </div>
              </div>

              {/* Flags: Main Branch & Active */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isMainBranch)}
                    onChange={(e) => setForm(prev => ({ ...prev, isMainBranch: e.target.checked }))}
                    className="rounded text-[#C9A24B] focus:ring-[#C9A24B] w-4 h-4"
                  />
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-[#B38A34]" />
                    <span className="text-xs font-bold text-stone-900">تعيين كفرع رئيسي للشركة (Headquarters)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isActive !== false}
                    onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded text-[#C9A24B] focus:ring-[#C9A24B] w-4 h-4"
                  />
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-stone-900">تفعيل ظهور الفرع في الموقع للزوار</span>
                  </div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBranchId ? 'حفظ تعديلات الفرع' : 'إضافة وحفظ الفرع'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors cursor-pointer"
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
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                نعم، احذف الفرع
              </button>
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, branch: null })}
                className="flex-1 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors cursor-pointer"
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
