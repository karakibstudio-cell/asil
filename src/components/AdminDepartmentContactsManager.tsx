import React, { useState } from 'react';
import { DepartmentContact } from '../types';
import { 
  Users2, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Phone, 
  Clock, 
  Mail, 
  Briefcase, 
  UserCheck, 
  ExternalLink,
  MessageSquareQuote
} from 'lucide-react';
import { WhatsAppIcon } from './BookingIcons';

interface AdminDepartmentContactsManagerProps {
  contacts: DepartmentContact[];
  onChange: (contacts: DepartmentContact[]) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminDepartmentContactsManager: React.FC<AdminDepartmentContactsManagerProps> = ({
  contacts = [],
  onChange,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const [form, setForm] = useState<DepartmentContact>({
    id: '',
    department: '',
    name: '',
    roleTitle: '',
    phone: '',
    whatsapp: '',
    email: '',
    workingHours: 'على مدار الساعة 24/7',
    city: 'عام لجميع الفروع',
    isActive: true,
    order: 0
  });

  const [samePhoneForWhatsApp, setSamePhoneForWhatsApp] = useState(true);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    contact: DepartmentContact | null;
  }>({
    isOpen: false,
    contact: null
  });

  const handleOpenAdd = () => {
    setEditingContactId(null);
    setSamePhoneForWhatsApp(true);
    setForm({
      id: 'dept_' + Date.now(),
      department: '',
      name: '',
      roleTitle: '',
      phone: '',
      whatsapp: '',
      email: '',
      workingHours: 'على مدار الساعة 24/7',
      city: 'عام لجميع الفروع',
      isActive: true,
      order: contacts.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact: DepartmentContact) => {
    setEditingContactId(contact.id);
    const isSame = !contact.whatsapp || contact.whatsapp === contact.phone;
    setSamePhoneForWhatsApp(isSame);
    setForm({
      id: contact.id,
      department: contact.department || '',
      name: contact.name || '',
      roleTitle: contact.roleTitle || '',
      phone: contact.phone || '',
      whatsapp: contact.whatsapp || '',
      email: contact.email || '',
      workingHours: contact.workingHours || 'على مدار الساعة 24/7',
      city: contact.city || 'عام لجميع الفروع',
      isActive: contact.isActive !== false,
      order: typeof contact.order === 'number' ? contact.order : 1
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    const updated = contacts.map(c => c.id === id ? { ...c, isActive: !currentActive } : c);
    onChange(updated);
    onShowToast(!currentActive ? 'تم تفعيل ظهور جهة التواصل' : 'تم إخفاء جهة التواصل من العرض للزوار', 'success');
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= contacts.length) return;

    const list = [...contacts];
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);

    const reordered = list.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    onChange(reordered);
    onShowToast('تم تحديث ترتيب جهات التواصل بنجاح', 'success');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.department.trim()) {
      onShowToast('يرجى كتابة اسم القسم أو الإدارة', 'error');
      return;
    }
    if (!form.phone.trim()) {
      onShowToast('يرجى كتابة رقم الهاتف', 'error');
      return;
    }

    const finalWhatsApp = samePhoneForWhatsApp ? form.phone : form.whatsapp;

    const payload: DepartmentContact = {
      ...form,
      whatsapp: finalWhatsApp
    };

    let updated: DepartmentContact[];
    if (editingContactId) {
      updated = contacts.map(c => c.id === editingContactId ? payload : c);
    } else {
      updated = [...contacts, payload];
    }

    onChange(updated);
    setIsModalOpen(false);
    onShowToast(
      editingContactId 
        ? 'تم تحديث جهة التواصل بنجاح وتحديثها في صفحة تواصل معنا' 
        : 'تمت إضافة جهة التواصل الجديدة وتظهر فورياً في صفحة تواصل معنا', 
      'success'
    );
  };

  const confirmDelete = (contact: DepartmentContact) => {
    setDeleteModal({
      isOpen: true,
      contact
    });
  };

  const executeDelete = () => {
    if (!deleteModal.contact) return;
    const updated = contacts.filter(c => c.id !== deleteModal.contact?.id);
    onChange(updated);
    setDeleteModal({ isOpen: false, contact: null });
    onShowToast('تم حذف جهة التواصل بنجاح', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center border border-[#C9A24B]/30">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cairo font-bold text-lg text-stone-900">
                أرقام التواصل المتخصصة ومسؤولي الإدارات (مبيعات / حجوزات / حسابات)
              </h3>
              <p className="text-xs text-stone-500">
                إضافة أرقام ومسؤولي الأقسام (المسمى الوظيفي، الاسم، رقم الجوال والواتساب) وتظهر بشكل مميز في صفحة "تواصل معنا"
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
          <span>+ إضافة مسؤول قسم جديد</span>
        </button>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contacts.map((contact, index) => {
          const isActive = contact.isActive !== false;
          const cleanPhone = (contact.phone || '').replace(/[^0-9]/g, '');
          const cleanWa = (contact.whatsapp || contact.phone || '').replace(/[^0-9]/g, '');

          return (
            <div
              key={contact.id || index}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 shadow-xs ${
                isActive 
                  ? 'bg-stone-50/90 border-stone-200/90 hover:border-[#C9A24B]/60' 
                  : 'bg-stone-100/60 border-dashed border-stone-300 opacity-60'
              }`}
            >
              <div className="space-y-3">
                {/* Department Header & Controls */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C9A24B]/15 text-[#B38A34] border border-[#C9A24B]/30">
                      <Briefcase className="w-3 h-3" />
                      <span>{contact.department}</span>
                    </span>
                    <h4 className="font-cairo font-bold text-base text-stone-900">
                      {contact.name || 'مسؤول القسم'}
                    </h4>
                    {contact.roleTitle && (
                      <p className="text-xs text-stone-600 font-medium">
                        {contact.roleTitle}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
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
                      disabled={index === contacts.length - 1}
                      onClick={() => handleMoveOrder(index, 'down')}
                      className="p-1.5 rounded-lg bg-white text-stone-600 hover:text-[#B38A34] border border-stone-200 disabled:opacity-30 transition-colors"
                      title="تحريك لأسفل"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(contact.id, isActive)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-stone-200 text-stone-600 border-stone-300 hover:bg-stone-300'
                      }`}
                      title={isActive ? 'القسم مفعل وظاهر (انقر للإخفاء)' : 'القسم مخفي (انقر للتفعيل)'}
                    >
                      {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(contact)}
                      className="p-1.5 rounded-lg bg-white text-stone-600 hover:text-[#B38A34] border border-stone-200 hover:border-[#C9A24B] transition-colors"
                      title="تعديل بيانات جهة التواصل"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(contact)}
                      className="p-1.5 rounded-lg bg-white text-stone-600 hover:text-red-600 border border-stone-200 hover:border-red-300 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-1.5 pt-2 border-t border-stone-200/60 text-xs">
                  <div className="flex items-center justify-between text-stone-700">
                    <span className="text-stone-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#B38A34]" />
                      الهاتف:
                    </span>
                    <span className="font-mono font-bold dir-ltr">{contact.phone}</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-700">
                    <span className="text-stone-500 flex items-center gap-1">
                      <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                      الواتساب:
                    </span>
                    <span className="font-mono font-bold dir-ltr text-emerald-700">
                      {contact.whatsapp || contact.phone}
                    </span>
                  </div>

                  {contact.workingHours && (
                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        الدوام:
                      </span>
                      <span className="font-medium">{contact.workingHours}</span>
                    </div>
                  )}

                  {contact.email && (
                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-stone-400" />
                        البريد:
                      </span>
                      <span className="font-mono text-[11px] truncate max-w-[150px]">{contact.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Instant Test Call & WhatsApp */}
              <div className="pt-3 border-t border-stone-200/70 grid grid-cols-2 gap-2">
                <a
                  href={`tel:${contact.phone}`}
                  className="py-1.5 px-2 rounded-xl bg-white border border-stone-200 hover:border-[#C9A24B] text-stone-800 hover:text-[#B38A34] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <Phone className="w-3 h-3 text-[#B38A34]" />
                  <span>اتصال</span>
                </a>

                <a
                  href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`السلام عليكم، أود التواصل مع ${contact.department} بخصوص استفسارات الحجز والتسكين.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                  <span>واتساب</span>
                </a>
              </div>
            </div>
          );
        })}

        {contacts.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs sm:text-sm text-stone-500 bg-stone-50 rounded-3xl border border-dashed border-stone-300">
            لا توجد جهات تواصل متخصصة مضافة. اضغط على "+ إضافة مسؤول قسم جديد" لإضافة أرقام المبيعات والحجوزات والحسابات.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center border border-[#C9A24B]/30">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-lg text-stone-900 leading-tight">
                    {editingContactId ? 'تعديل جهة التواصل المتخصصة' : 'إضافة مسؤول تواصل وقسم جديد'}
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    ستظهر هذه البطاقة مباشرة في صفحة "تواصل معنا"
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
              {/* Department Name */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  اسم القسم أو الإدارة: *
                </label>
                <input
                  type="text"
                  required
                  value={form.department}
                  onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="مثال: إدارة المبيعات والشركات، قسم الحجوزات والتسكين، إدارة الحسابات والمالية..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              {/* Contact Name & Role Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    اسم المسؤول / الممثل:
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: أ. أحمد هشام، فريق المبيعات..."
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    المسمى الوظيفي / التخصص:
                  </label>
                  <input
                    type="text"
                    value={form.roleTitle || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, roleTitle: e.target.value }))}
                    placeholder="مثال: مسؤول مبيعات الشركات، استشاري التسكين..."
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    رقم الهاتف / الجوال: *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        phone: val,
                        whatsapp: samePhoneForWhatsApp ? val : prev.whatsapp
                      }));
                    }}
                    placeholder="+966501234567"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    رقم الواتساب:
                  </label>
                  <input
                    type="tel"
                    disabled={samePhoneForWhatsApp}
                    value={samePhoneForWhatsApp ? form.phone : (form.whatsapp || '')}
                    onChange={(e) => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="+966501234567"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right font-mono disabled:bg-stone-200/50 disabled:text-stone-500"
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
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    أوقات وساعات التواجد:
                  </label>
                  <input
                    type="text"
                    value={form.workingHours || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, workingHours: e.target.value }))}
                    placeholder="مثال: على مدار الساعة 24/7 أو 9:00 ص - 10:00 م"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    البريد الإلكتروني (اختياري):
                  </label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="sales@prestigehotels.sa"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right"
                  />
                </div>
              </div>

              {/* Active status */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isActive !== false}
                    onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded text-[#C9A24B] focus:ring-[#C9A24B] w-4 h-4"
                  />
                  <span className="text-xs font-bold text-stone-900">تفعيل ظهور جهة التواصل هذه للزوار في صفحة تواصل معنا</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingContactId ? 'حفظ التعديلات' : 'إضافة جهة التواصل'}</span>
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

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-cairo font-bold text-xl text-stone-900 text-center mb-2">
              تأكيد حذف جهة التواصل
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 text-center leading-relaxed mb-6">
              هل أنت متأكد من رغبتك في حذف <strong className="text-stone-900">"{deleteModal.contact?.department} - {deleteModal.contact?.name}"</strong>؟
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                نعم، احذف
              </button>
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, contact: null })}
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
