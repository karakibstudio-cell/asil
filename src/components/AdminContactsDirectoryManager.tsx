import React, { useState } from 'react';
import { 
  ContactDirectoryItem, 
  ActionButtonItem, 
  BranchLocation,
  SiteSettings 
} from '../types';
import { 
  Phone, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Mail, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Building,
  HelpCircle,
  Link as LinkIcon,
  RotateCcw
} from 'lucide-react';
import { WhatsAppIcon } from './BookingIcons';
import { 
  DEFAULT_CONTACTS_DIRECTORY, 
  isValidInternationalPhone, 
  formatInternationalPhone 
} from '../utils/actionButtons';

interface AdminContactsDirectoryManagerProps {
  contacts: ContactDirectoryItem[];
  onChange: (contacts: ContactDirectoryItem[]) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  buttons?: ActionButtonItem[];
  branches?: BranchLocation[];
  onUpdateButtons?: (buttons: ActionButtonItem[]) => void;
  onUpdateBranches?: (branches: BranchLocation[]) => void;
}

const DEFAULT_EMPTY_CONTACT: ContactDirectoryItem = {
  id: '',
  name: '',
  nameEn: '',
  roleTag: 'استقبال وتسكين',
  roleTagEn: 'Reception & Housing',
  phone: '+966560580250',
  whatsapp: '+966560580250',
  email: '',
  workingHours: 'على مدار الساعة 24/7',
  workingHoursEn: '24/7 Around the clock',
  isActive: true,
  order: 1,
  notes: ''
};

export const AdminContactsDirectoryManager: React.FC<AdminContactsDirectoryManagerProps> = ({
  contacts = [],
  onChange,
  onShowToast,
  buttons = [],
  branches = [],
  onUpdateButtons,
  onUpdateBranches
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContactDirectoryItem>(DEFAULT_EMPTY_CONTACT);
  const [phoneError, setPhoneError] = useState<string>('');
  const [waError, setWaError] = useState<string>('');

  // Delete Dependency Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    contact: ContactDirectoryItem | null;
    dependentButtons: ActionButtonItem[];
    dependentBranches: { branch: BranchLocation; count: number }[];
    replacementContactId: string;
  }>({
    isOpen: false,
    contact: null,
    dependentButtons: [],
    dependentBranches: [],
    replacementContactId: ''
  });

  const activeContactsList = Array.isArray(contacts) && contacts.length > 0
    ? contacts
    : DEFAULT_CONTACTS_DIRECTORY;

  const sortedContacts = [...activeContactsList].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Find buttons using a given contact
  const getButtonsUsingContact = (contactId: string): ActionButtonItem[] => {
    return buttons.filter(b => b.contactId === contactId);
  };

  // Find branches using a given contact
  const getBranchesUsingContact = (contactId: string): { branch: BranchLocation; count: number }[] => {
    const list: { branch: BranchLocation; count: number }[] = [];
    for (const br of branches) {
      const matchCount = (br.contacts || []).filter(c => c.contactId === contactId).length;
      if (matchCount > 0) {
        list.push({ branch: br, count: matchCount });
      }
    }
    return list;
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setPhoneError('');
    setWaError('');
    setDraft({
      ...DEFAULT_EMPTY_CONTACT,
      id: 'cnt_' + Date.now(),
      order: sortedContacts.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ContactDirectoryItem) => {
    setEditingId(item.id);
    setPhoneError('');
    setWaError('');
    setDraft({
      ...item,
      nameEn: item.nameEn || '',
      roleTag: item.roleTag || '',
      roleTagEn: item.roleTagEn || '',
      whatsapp: item.whatsapp || '',
      email: item.email || '',
      workingHours: item.workingHours || '',
      workingHoursEn: item.workingHoursEn || '',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handlePhoneChange = (val: string) => {
    setDraft(prev => ({ ...prev, phone: val }));
    if (val && !isValidInternationalPhone(val)) {
      setPhoneError('يرجى إدخال الرقم بالصيغة الدولية مع مفتاح الدولة (مثال: 966560580250+)');
    } else {
      setPhoneError('');
    }
  };

  const handleWaChange = (val: string) => {
    setDraft(prev => ({ ...prev, whatsapp: val }));
    if (val && !isValidInternationalPhone(val)) {
      setWaError('يرجى إدخال رقم الواتساب بالصيغة الدولية مع مفتاح الدولة (مثال: 966560580250+)');
    } else {
      setWaError('');
    }
  };

  const handleSaveDraft = () => {
    if (!draft.name.trim()) {
      onShowToast('يرجى إدخال اسم جهة الاتصال (بالعربية)', 'error');
      return;
    }

    const formattedPhone = formatInternationalPhone(draft.phone);
    if (!formattedPhone || !isValidInternationalPhone(formattedPhone)) {
      onShowToast('يرجى إدخال رقم هاتف صالح بالصيغة الدولية (مثال: 966560580250+)', 'error');
      return;
    }

    let formattedWa = draft.whatsapp?.trim();
    if (formattedWa) {
      formattedWa = formatInternationalPhone(formattedWa);
      if (!isValidInternationalPhone(formattedWa)) {
        onShowToast('يرجى التأكد من صحة رقم الواتساب بالصيغة الدولية', 'error');
        return;
      }
    }

    const finalItem: ContactDirectoryItem = {
      ...draft,
      phone: formattedPhone,
      whatsapp: formattedWa || undefined,
      email: draft.email?.trim() || undefined,
      workingHours: draft.workingHours?.trim() || undefined,
      workingHoursEn: draft.workingHoursEn?.trim() || undefined,
      notes: draft.notes?.trim() || undefined
    };

    let updated: ContactDirectoryItem[];
    if (editingId) {
      updated = sortedContacts.map(c => c.id === editingId ? finalItem : c);
      onShowToast(`تم تحديث جهة الاتصال "${finalItem.name}" وتحديث كافة الأزرار المرتبطة بها فوراً`, 'success');
    } else {
      updated = [...sortedContacts, finalItem];
      onShowToast(`تمت إضافة جهة الاتصال "${finalItem.name}" إلى الدليل المركزي بنجاح`, 'success');
    }

    onChange(updated);
    setIsModalOpen(false);
  };

  const handleToggleActive = (item: ContactDirectoryItem) => {
    const newActive = item.isActive === false ? true : false;
    const updated = sortedContacts.map(c => c.id === item.id ? { ...c, isActive: newActive } : c);
    onChange(updated);
    onShowToast(
      newActive
        ? `تم تفعيل جهة الاتصال "${item.name}" وإظهار أزرارها للزوار`
        : `تم تعطيل جهة الاتصال "${item.name}" وإخفاء أزرارها مؤقتاً لحماية الزوار من الروابط المعطلة`,
      'info'
    );
  };

  const handleMoveOrder = (item: ContactDirectoryItem, direction: 'up' | 'down') => {
    const idx = sortedContacts.findIndex(c => c.id === item.id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sortedContacts.length) return;

    const currentItem = sortedContacts[idx];
    const targetItem = sortedContacts[targetIdx];

    const updatedCurrent = { ...currentItem, order: targetIdx + 1 };
    const updatedTarget = { ...targetItem, order: idx + 1 };

    const updated = sortedContacts.map(c => {
      if (c.id === currentItem.id) return updatedCurrent;
      if (c.id === targetItem.id) return updatedTarget;
      return c;
    });

    onChange(updated);
    onShowToast(`تم تغيير ترتيب جهة الاتصال "${item.name}"`, 'success');
  };

  const handleInitiateDelete = (item: ContactDirectoryItem) => {
    const dependentButtons = getButtonsUsingContact(item.id);
    const dependentBranches = getBranchesUsingContact(item.id);

    const availableReplacements = sortedContacts.filter(c => c.id !== item.id && c.isActive !== false);
    const defaultReplacement = availableReplacements.length > 0 ? availableReplacements[0].id : '';

    setDeleteModal({
      isOpen: true,
      contact: item,
      dependentButtons,
      dependentBranches,
      replacementContactId: defaultReplacement
    });
  };

  const handleConfirmDelete = () => {
    const contact = deleteModal.contact;
    if (!contact) return;

    const replacementId = deleteModal.replacementContactId;

    // If replacement chosen, reassign dependent buttons
    if (replacementId && onUpdateButtons && deleteModal.dependentButtons.length > 0) {
      const updatedButtons = buttons.map(btn => {
        if (btn.contactId === contact.id) {
          return { ...btn, contactId: replacementId };
        }
        return btn;
      });
      onUpdateButtons(updatedButtons);
    }

    // If replacement chosen, reassign dependent branches
    if (replacementId && onUpdateBranches && deleteModal.dependentBranches.length > 0) {
      const updatedBranches = branches.map(br => {
        const updatedContacts = (br.contacts || []).map(c => {
          if (c.contactId === contact.id) {
            return { ...c, contactId: replacementId };
          }
          return c;
        });
        return { ...br, contacts: updatedContacts };
      });
      onUpdateBranches(updatedBranches);
    }

    const updated = sortedContacts.filter(c => c.id !== contact.id);
    onChange(updated);
    setDeleteModal({
      isOpen: false,
      contact: null,
      dependentButtons: [],
      dependentBranches: [],
      replacementContactId: ''
    });

    onShowToast(`تم حذف جهة الاتصال "${contact.name}" بنجاح`, 'success');
  };

  const handleResetDefaults = () => {
    if (window.confirm('هل تود استعادة دليل جهات الاتصال الافتراضي المعتمد لشركة برستيج؟')) {
      onChange(DEFAULT_CONTACTS_DIRECTORY);
      onShowToast('تمت استعادة دليل جهات الاتصال الافتراضي بنجاح', 'success');
    }
  };

  const totalContacts = sortedContacts.length;
  const activeContactsCount = sortedContacts.filter(c => c.isActive !== false).length;
  const totalLinkedButtons = buttons.filter(b => b.contactId && b.contactId !== 'custom').length;

  return (
    <div id="admin-contacts-directory-manager" className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-8 shadow-xs space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/15 border border-[#C9A24B]/30 flex items-center justify-center text-[#98752B]">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-cairo font-bold text-stone-900 flex items-center gap-2">
                <span>دليل جهات الاتصال المركزي (Contacts Directory)</span>
                <span className="text-xs bg-[#C9A24B]/10 text-[#98752B] border border-[#C9A24B]/30 px-2.5 py-0.5 rounded-full font-bold">
                  مركز التحكم بالهواتف
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                إدارة مركزية لجميع أرقام الهواتف، والواتساب، ومسؤولي التسكين والفروع. تغيير أي رقم هنا يُحدّث فوراً كافة الأزرار والقنوات المرتبطة به في كامل الموقع.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="استعادة جهات الاتصال القياسية الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>الافتراضية</span>
          </button>

          <button
            type="button"
            id="admin-add-contact-btn"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة جهة اتصال جديدة</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            {totalContacts}
          </div>
          <div>
            <span className="text-xs text-stone-600 block">إجمالي جهات الاتصال</span>
            <strong className="text-sm font-bold text-stone-900">{totalContacts} بطاقة مسجلة</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            {activeContactsCount}
          </div>
          <div>
            <span className="text-xs text-stone-600 block">جهات الاتصال النشطة</span>
            <strong className="text-sm font-bold text-emerald-700">{activeContactsCount} تعمل الآن</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            {totalLinkedButtons}
          </div>
          <div>
            <span className="text-xs text-stone-600 block">الأزرار المرتبطة بالدليل</span>
            <strong className="text-sm font-bold text-blue-700">{totalLinkedButtons} أزرار وقنوات متصلة</strong>
          </div>
        </div>
      </div>

      {/* Contacts Master Table */}
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-right text-xs sm:text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 text-xs font-bold">
              <th className="py-3.5 px-3">الترتيب</th>
              <th className="py-3.5 px-3">اسم جهة الاتصال والتصنيف</th>
              <th className="py-3.5 px-3">رقم الهاتف (الاتصال)</th>
              <th className="py-3.5 px-3">رقم الواتساب</th>
              <th className="py-3.5 px-3">البريد الإلكتروني / ساعات العمل</th>
              <th className="py-3.5 px-3 text-center">الأزرار المرتبطة</th>
              <th className="py-3.5 px-3 text-center">الحالة</th>
              <th className="py-3.5 px-3 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sortedContacts.map((contact, idx) => {
              const usingButtons = getButtonsUsingContact(contact.id);
              const usingBranches = getBranchesUsingContact(contact.id);
              const totalUsages = usingButtons.length + usingBranches.length;
              const isFirst = idx === 0;
              const isLast = idx === sortedContacts.length - 1;

              return (
                <tr key={contact.id} className="hover:bg-amber-50/30 transition-colors">
                  {/* Order & Reorder Arrows */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 font-mono font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveOrder(contact, 'up')}
                          className={`p-0.5 rounded text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer`}
                          title="تحريك لأعلى"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveOrder(contact, 'down')}
                          className={`p-0.5 rounded text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer`}
                          title="تحريك لأسفل"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Name & Role Tag */}
                  <td className="py-3 px-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-stone-900 font-bold text-xs sm:text-sm">
                          {contact.name}
                        </strong>
                        {contact.roleTag && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800 font-bold border border-amber-200">
                            {contact.roleTag}
                          </span>
                        )}
                      </div>
                      {contact.nameEn && (
                        <div className="text-[11px] text-stone-500 font-medium">
                          {contact.nameEn}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                        className="font-mono text-xs font-bold text-stone-900 hover:text-[#C9A24B] flex items-center gap-1.5 dir-ltr text-left"
                        title="اختبار اتصال فوري"
                      >
                        <Phone className="w-3.5 h-3.5 text-stone-500" />
                        <span>{contact.phone}</span>
                      </a>
                    </div>
                  </td>

                  {/* WhatsApp */}
                  <td className="py-3 px-3">
                    {contact.whatsapp ? (
                      <a
                        href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 dir-ltr text-left bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 w-fit"
                        title="اختبار فتح محادثة واتساب"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{contact.whatsapp}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-stone-400 italic">يماثل رقم الهاتف</span>
                    )}
                  </td>

                  {/* Email & Working Hours */}
                  <td className="py-3 px-3">
                    <div className="space-y-0.5 text-xs">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-stone-700 hover:text-blue-600 flex items-center gap-1 dir-ltr text-left truncate max-w-[160px]"
                        >
                          <Mail className="w-3 h-3 text-stone-400" />
                          <span>{contact.email}</span>
                        </a>
                      ) : (
                        <span className="text-stone-400 text-[11px] block">—</span>
                      )}
                      {contact.workingHours && (
                        <div className="text-[11px] text-stone-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{contact.workingHours}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Dependent Usage Badges */}
                  <td className="py-3 px-3 text-center">
                    {totalUsages > 0 ? (
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" />
                          <span>{totalUsages} زر / فرع</span>
                        </span>
                        <span className="text-[10px] text-stone-500 truncate max-w-[120px]" title={usingButtons.map(b => b.label).join(', ')}>
                          {usingButtons.length > 0 ? usingButtons[0].label : 'فرع مرتبط'}
                          {usingButtons.length > 1 ? ` (+${usingButtons.length - 1})` : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                        غير مستخدم بعد
                      </span>
                    )}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(contact)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                        contact.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                      }`}
                      title="اضغط لتبديل حالة التفعيل / التعطيل"
                    >
                      {contact.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{contact.isActive !== false ? 'نشط' : 'معطل'}</span>
                    </button>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-3 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(contact)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 transition-colors cursor-pointer"
                        title="تعديل جهة الاتصال"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInitiateDelete(contact)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-red-500 hover:text-white text-stone-700 transition-colors cursor-pointer"
                        title="حذف جهة الاتصال"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in duration-200 text-right">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/15 text-[#98752B] flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-lg text-stone-900">
                    {editingId ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة في الدليل'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    يتم ربط الأزرار وقنوات الاتصال بهذه البطاقة وتحديثها آلياً
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-4">
              {/* Names Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    الاسم باللغة العربية: *
                  </label>
                  <input
                    type="text"
                    required
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="مثال: هاتف الاستقبال المباشر"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    الاسم بالإنجليزية (اختياري):
                  </label>
                  <input
                    type="text"
                    value={draft.nameEn || ''}
                    onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
                    placeholder="e.g. Direct Reception Phone"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Roles & Classification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    التصنيف / شارة الوظيفة (عربي):
                  </label>
                  <input
                    type="text"
                    value={draft.roleTag || ''}
                    onChange={(e) => setDraft({ ...draft, roleTag: e.target.value })}
                    placeholder="مثال: استقبال 24/7، استشاري، حجوزات"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    شارة الوظيفة (إنجليزي):
                  </label>
                  <input
                    type="text"
                    value={draft.roleTagEn || ''}
                    onChange={(e) => setDraft({ ...draft, roleTagEn: e.target.value })}
                    placeholder="e.g. 24/7 Reception, Consultant"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Phone & WhatsApp Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-800">
                      رقم الهاتف المباشر (الاتصال): *
                    </label>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                      صيغة دولية (+966)
                    </span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={draft.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+966560580250"
                    className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl text-xs sm:text-sm font-mono dir-ltr text-left focus:bg-white focus:outline-none ${
                      phoneError ? 'border-red-500 bg-red-50/40 text-red-900' : 'border-stone-300 text-stone-900 focus:border-[#C9A24B]'
                    }`}
                  />
                  {phoneError && (
                    <span className="text-[10px] text-red-600 font-bold block mt-1">{phoneError}</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-800">
                      رقم الواتساب (اختياري):
                    </label>
                    <span className="text-[10px] text-stone-500">
                      فارغ = نفس الهاتف
                    </span>
                  </div>
                  <input
                    type="tel"
                    value={draft.whatsapp || ''}
                    onChange={(e) => handleWaChange(e.target.value)}
                    placeholder="+966560580250"
                    className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl text-xs sm:text-sm font-mono dir-ltr text-left focus:bg-white focus:outline-none ${
                      waError ? 'border-red-500 bg-red-50/40 text-red-900' : 'border-stone-300 text-stone-900 focus:border-[#C9A24B]'
                    }`}
                  />
                  {waError && (
                    <span className="text-[10px] text-red-600 font-bold block mt-1">{waError}</span>
                  )}
                </div>
              </div>

              {/* Email & Working Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    البريد الإلكتروني الرسمي (اختياري):
                  </label>
                  <input
                    type="email"
                    value={draft.email || ''}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    placeholder="info@prestigehotels.sa"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm dir-ltr text-left focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    أوقات العمل والتواجد (عربي):
                  </label>
                  <input
                    type="text"
                    value={draft.workingHours || ''}
                    onChange={(e) => setDraft({ ...draft, workingHours: e.target.value })}
                    placeholder="على مدار الساعة 24/7"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Active Toggle & Internal Notes */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={draft.isActive !== false}
                    onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                  />
                  <div>
                    <strong className="text-xs font-bold text-stone-900 block">
                      تفعيل جهة الاتصال في الموقع (Active)
                    </strong>
                    <span className="text-[11px] text-stone-500">
                      عند التعطيل، يتم إخفاء الأزرار التابعة لها تلقائياً لحماية الزوار من الضغط على أرقام غير مفعلة.
                    </span>
                  </div>
                </label>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    ملاحظات داخلية للإدارة (اختياري):
                  </label>
                  <input
                    type="text"
                    value={draft.notes || ''}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                    placeholder="ملاحظات توضيحية للإدارة ومشرفي المنصة..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-6 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ في الدليل المركزي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dependency Warning Modal */}
      {deleteModal.isOpen && deleteModal.contact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in duration-200 text-right">
            <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  تأكيد حذف جهة الاتصال
                </h3>
                <p className="text-xs text-stone-500">
                  {deleteModal.contact.name} ({deleteModal.contact.phone})
                </p>
              </div>
            </div>

            {/* If buttons or branches are dependent on this contact */}
            {(deleteModal.dependentButtons.length > 0 || deleteModal.dependentBranches.length > 0) ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                  <strong className="block font-bold mb-1">
                    ⚠️ تنبيه: جهة الاتصال هذه مرتبطة حالياً بـ ({deleteModal.dependentButtons.length + deleteModal.dependentBranches.length}) عنصر في الموقع:
                  </strong>
                  <ul className="list-disc list-inside space-y-1 mt-2 text-stone-700 font-medium">
                    {deleteModal.dependentButtons.map(b => (
                      <li key={b.id}>زر إجراء: <strong>{b.label}</strong> (الموضع: {b.positions.join(', ')})</li>
                    ))}
                    {deleteModal.dependentBranches.map(br => (
                      <li key={br.branch.id}>فرع: <strong>{br.branch.name}</strong> ({br.count} قنوات اتصال)</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 block">
                    اختر جهة اتصال بديلة لنقل الأزرار إليها تلقائياً:
                  </label>
                  <select
                    value={deleteModal.replacementContactId}
                    onChange={(e) => setDeleteModal({ ...deleteModal, replacementContactId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] font-bold"
                  >
                    <option value="">-- بدون بديل (ستتحول الأزرار لأرقام مخصصة ثابتة) --</option>
                    {sortedContacts
                      .filter(c => c.id !== deleteModal.contact?.id && c.isActive !== false)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone}) {c.roleTag ? `- ${c.roleTag}` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-600 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف جهة الاتصال "{deleteModal.contact.name}" من الدليل؟ لا توجد أزرار تعتمد عليها حالياً.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, contact: null, dependentButtons: [], dependentBranches: [], replacementContactId: '' })}
                className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الحذف النهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
