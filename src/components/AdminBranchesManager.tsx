import React, { useState } from 'react';
import { BranchLocation, BranchContact } from '../types';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Check, 
  X, 
  AlertTriangle, 
  Building, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Phone, 
  Clock, 
  Mail, 
  Star,
  CheckCircle2,
  Globe,
  PlusCircle,
  Link as LinkIcon,
  HelpCircle,
  Layout,
  MessageSquare,
  Compass
} from 'lucide-react';
import { WhatsAppIcon } from './BookingIcons';

interface AdminBranchesManagerProps {
  branches: BranchLocation[];
  onChange: (branches: BranchLocation[]) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const DEFAULT_EMPTY_CONTACT: BranchContact = {
  id: '',
  label: '',
  labelEn: '',
  value: '',
  type: 'call',
  isActive: true,
  order: 1,
  showInAbout: true,
  showInContact: true,
  showInFooter: true,
  showInHotelDetail: true,
  showInFloating: false
};

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
    nameEn: '',
    city: 'مكة المكرمة',
    cityEn: 'Makkah Al-Mukarramah',
    address: '',
    addressEn: '',
    mapUrl: '',
    phone: '',
    whatsapp: '',
    workingHours: 'على مدار الساعة 24/7',
    workingHoursEn: '24/7 Around the clock',
    email: '',
    isMainBranch: false,
    showContactInfo: true,
    showAddress: true,
    showMapUrl: true,
    showWorkingHours: true,
    showInAboutPage: true,
    showInContactPage: true,
    showInFooter: true,
    isActive: true,
    order: 0,
    contacts: []
  });

  // State for contact add/edit sub-form inside modal
  const [contactDraft, setContactDraft] = useState<BranchContact>(DEFAULT_EMPTY_CONTACT);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    branch: BranchLocation | null;
  }>({
    isOpen: false,
    branch: null
  });

  const handleOpenAdd = () => {
    setEditingBranchId(null);
    setShowContactForm(false);
    setEditingContactId(null);
    setContactDraft(DEFAULT_EMPTY_CONTACT);

    const isFirstBranch = branches.length === 0;
    setForm({
      id: 'branch_' + Date.now(),
      name: '',
      nameEn: '',
      city: 'مكة المكرمة',
      cityEn: 'Makkah Al-Mukarramah',
      address: '',
      addressEn: '',
      mapUrl: '',
      phone: '',
      whatsapp: '',
      workingHours: 'على مدار الساعة 24/7',
      workingHoursEn: '24/7 Around the clock',
      email: '',
      isMainBranch: isFirstBranch,
      showContactInfo: isFirstBranch, // Main branch on by default, others off by default
      showAddress: true,
      showMapUrl: true,
      showWorkingHours: true,
      showInAboutPage: true,
      showInContactPage: true,
      showInFooter: true,
      isActive: true,
      order: branches.length + 1,
      contacts: [
        {
          id: 'contact_rec_' + Date.now(),
          label: 'هاتف الاستقبال',
          labelEn: 'Reception Phone',
          value: '+966501234567',
          type: 'call',
          order: 1,
          isActive: true,
          showInAbout: true,
          showInContact: true,
          showInFooter: true,
          showInHotelDetail: true,
          showInFloating: false
        },
        {
          id: 'contact_wa_' + Date.now(),
          label: 'واتساب الحجوزات والتسكين',
          labelEn: 'Inquiries & Housing WhatsApp',
          value: '+966501234567',
          type: 'whatsapp',
          order: 2,
          isActive: true,
          showInAbout: true,
          showInContact: true,
          showInFooter: true,
          showInHotelDetail: true,
          showInFloating: false
        }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: BranchLocation) => {
    setEditingBranchId(branch.id);
    setShowContactForm(false);
    setEditingContactId(null);
    setContactDraft(DEFAULT_EMPTY_CONTACT);

    // Ensure contacts array is populated and normalized with placement booleans
    let contactsList: BranchContact[] = Array.isArray(branch.contacts)
      ? branch.contacts.map((c, idx) => ({
          ...c,
          order: typeof c.order === 'number' ? c.order : idx + 1,
          isActive: c.isActive !== false,
          showInAbout: c.showInAbout !== false,
          showInContact: c.showInContact !== false,
          showInFooter: c.showInFooter !== false,
          showInHotelDetail: c.showInHotelDetail !== false,
          showInFloating: Boolean(c.showInFloating)
        }))
      : [];

    // Fallback: If legacy branch had only phone/whatsapp/email and empty contacts array, migrate them
    if (contactsList.length === 0 && (branch.phone || branch.whatsapp || branch.email)) {
      if (branch.phone) {
        contactsList.push({
          id: `c_${branch.id}_phone`,
          label: 'هاتف الاستقبال',
          labelEn: 'Reception Phone',
          value: branch.phone,
          type: 'call',
          order: 1,
          isActive: true,
          showInAbout: true,
          showInContact: true,
          showInFooter: true,
          showInHotelDetail: true,
          showInFloating: false
        });
      }
      if (branch.whatsapp) {
        contactsList.push({
          id: `c_${branch.id}_wa`,
          label: 'واتساب الحجوزات',
          labelEn: 'Reservations WhatsApp',
          value: branch.whatsapp,
          type: 'whatsapp',
          order: 2,
          isActive: true,
          showInAbout: true,
          showInContact: true,
          showInFooter: true,
          showInHotelDetail: true,
          showInFloating: false
        });
      }
      if (branch.email) {
        contactsList.push({
          id: `c_${branch.id}_email`,
          label: 'البريد الإلكتروني للفرع',
          labelEn: 'Branch Email',
          value: branch.email,
          type: 'email',
          order: 3,
          isActive: true,
          showInAbout: true,
          showInContact: true,
          showInFooter: true,
          showInHotelDetail: true,
          showInFloating: false
        });
      }
    }

    setForm({
      id: branch.id,
      name: branch.name || '',
      nameEn: branch.nameEn || '',
      city: branch.city || 'مكة المكرمة',
      cityEn: branch.cityEn || '',
      address: branch.address || '',
      addressEn: branch.addressEn || '',
      mapUrl: branch.mapUrl || '',
      phone: branch.phone || '',
      whatsapp: branch.whatsapp || '',
      workingHours: branch.workingHours || 'على مدار الساعة 24/7',
      workingHoursEn: branch.workingHoursEn || '24/7 Around the clock',
      email: branch.email || '',
      isMainBranch: Boolean(branch.isMainBranch),
      // Default: main branch is ON, secondary branches are OFF unless explicitly saved as true
      showContactInfo: typeof branch.showContactInfo === 'boolean' 
        ? branch.showContactInfo 
        : Boolean(branch.isMainBranch),
      showAddress: branch.showAddress !== false,
      showMapUrl: branch.showMapUrl !== false,
      showWorkingHours: branch.showWorkingHours !== false,
      showInAboutPage: branch.showInAboutPage !== false,
      showInContactPage: branch.showInContactPage !== false,
      showInFooter: branch.showInFooter !== false,
      isActive: branch.isActive !== false,
      order: typeof branch.order === 'number' ? branch.order : 1,
      contacts: contactsList
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    const updated = branches.map(b => b.id === id ? { ...b, isActive: !currentActive } : b);
    onChange(updated);
    onShowToast(!currentActive ? 'تم تفعيل ظهور الفرع في الموقع' : 'تم إخفاء الفرع من العرض للزوار', 'success');
  };

  const handleToggleBranchPageVisibility = (
    branchId: string, 
    pageKey: 'showInAboutPage' | 'showInContactPage' | 'showInFooter' | 'showContactInfo' | 'showAddress' | 'showMapUrl' | 'showWorkingHours'
  ) => {
    const targetBranch = branches.find(b => b.id === branchId);
    if (!targetBranch) return;
    const currentVal = targetBranch[pageKey] !== false;
    const updated = branches.map(b => b.id === branchId ? { ...b, [pageKey]: !currentVal } : b);
    onChange(updated);
    const labels: Record<string, string> = {
      showInAboutPage: 'صفحة من نحن',
      showInContactPage: 'صفحة تواصل معنا',
      showInFooter: 'الفوتر أسفل الموقع',
      showContactInfo: 'بيانات الاتصال للفرع',
      showAddress: 'العنوان التفصيلي للفرع',
      showMapUrl: 'رابط خريطة Google',
      showWorkingHours: 'ساعات العمل'
    };
    onShowToast(!currentVal ? `تم تفعيل إظهار ${labels[pageKey]}` : `تم إخفاء ${labels[pageKey]}`, 'info');
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= branches.length) return;

    const list = [...branches];
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);

    const reordered = list.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    onChange(reordered);
    onShowToast('تم تحديث ترتيب الفروع بنجاح', 'success');
  };

  // Contacts Sub-manager inside Form (Add / Edit / Delete / Reorder / Toggle)
  const handleOpenAddContact = () => {
    setEditingContactId(null);
    setContactDraft({
      id: '',
      label: '',
      labelEn: '',
      value: '',
      type: 'call',
      isActive: true,
      order: (form.contacts?.length || 0) + 1,
      showInAbout: true,
      showInContact: true,
      showInFooter: true,
      showInHotelDetail: true,
      showInFloating: false
    });
    setShowContactForm(true);
  };

  const handleOpenEditContact = (contact: BranchContact) => {
    setEditingContactId(contact.id);
    setContactDraft({
      id: contact.id,
      label: contact.label || '',
      labelEn: contact.labelEn || '',
      value: contact.value || '',
      type: contact.type || 'call',
      isActive: contact.isActive !== false,
      order: contact.order || 1,
      showInAbout: contact.showInAbout !== false,
      showInContact: contact.showInContact !== false,
      showInFooter: contact.showInFooter !== false,
      showInHotelDetail: contact.showInHotelDetail !== false,
      showInFloating: Boolean(contact.showInFloating)
    });
    setShowContactForm(true);
  };

  const handleSaveContact = () => {
    const label = contactDraft.label.trim();
    const value = contactDraft.value.trim();

    if (!label) {
      onShowToast('يرجى تحديد مسمى وسيلة الاتصال (مثل: هاتف الاستقبال، إدارة الحجوزات...)', 'error');
      return;
    }
    if (!value) {
      onShowToast('يرجى كتابة رقم الهاتف أو الواتساب أو البريد أو الرابط', 'error');
      return;
    }

    // Validation by Type
    if (contactDraft.type === 'call' || contactDraft.type === 'whatsapp') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 20) {
        onShowToast('يرجى إدخال رقم هاتف/واتساب صحيح (من 7 إلى 20 رقماً مع مفتاح الدولة)', 'error');
        return;
      }
    } else if (contactDraft.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        onShowToast('يرجى إدخال عنوان بريد إلكتروني صحيح (مثال: info@prestigehotels.sa)', 'error');
        return;
      }
    }

    const currentContacts = form.contacts || [];

    if (editingContactId) {
      // Edit existing contact
      const updated = currentContacts.map(c => 
        c.id === editingContactId 
          ? {
              ...contactDraft,
              id: editingContactId,
              label,
              labelEn: contactDraft.labelEn?.trim() || '',
              value
            }
          : c
      );
      setForm(prev => ({ ...prev, contacts: updated }));
      onShowToast('تم تحديث وسيلة الاتصال وتسمياتها بنجاح', 'success');
    } else {
      // Add new contact
      const created: BranchContact = {
        ...contactDraft,
        id: 'contact_' + Date.now(),
        label,
        labelEn: contactDraft.labelEn?.trim() || '',
        value,
        order: currentContacts.length + 1
      };
      setForm(prev => ({
        ...prev,
        contacts: [...currentContacts, created]
      }));
      onShowToast('تمت إضافة وسيلة الاتصال للفرع بنجاح', 'success');
    }

    setShowContactForm(false);
    setEditingContactId(null);
    setContactDraft(DEFAULT_EMPTY_CONTACT);
  };

  const handleToggleContactActive = (contactId: string) => {
    setForm(prev => ({
      ...prev,
      contacts: (prev.contacts || []).map(c => 
        c.id === contactId ? { ...c, isActive: c.isActive === false ? true : false } : c
      )
    }));
  };

  const handleDeleteContact = (contactId: string) => {
    setForm(prev => ({
      ...prev,
      contacts: (prev.contacts || []).filter(c => c.id !== contactId)
    }));
    if (editingContactId === contactId) {
      setShowContactForm(false);
      setEditingContactId(null);
    }
    onShowToast('تم حذف وسيلة الاتصال من هذا الفرع', 'info');
  };

  const handleMoveContact = (index: number, direction: 'up' | 'down') => {
    const contacts = [...(form.contacts || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= contacts.length) return;

    const [moved] = contacts.splice(index, 1);
    contacts.splice(targetIdx, 0, moved);

    const reordered = contacts.map((c, idx) => ({ ...c, order: idx + 1 }));
    setForm(prev => ({ ...prev, contacts: reordered }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      onShowToast('يرجى كتابة اسم الفرع بالعربية', 'error');
      return;
    }
    if (!form.address.trim()) {
      onShowToast('يرجى كتابة عنوان الفرع بالعربية', 'error');
      return;
    }

    let finalMapUrl = form.mapUrl?.trim();
    if (!finalMapUrl) {
      finalMapUrl = `https://maps.google.com/?q=${encodeURIComponent(`${form.name} ${form.address}`)}`;
    }

    // Keep primary legacy phone/whatsapp synced to first active contacts for compatibility
    const activeContacts = (form.contacts || []).filter(c => c.isActive !== false);
    const firstCall = activeContacts.find(c => c.type === 'call');
    const firstWa = activeContacts.find(c => c.type === 'whatsapp');
    const firstEmail = activeContacts.find(c => c.type === 'email');

    const payload: BranchLocation = {
      ...form,
      phone: firstCall?.value || form.phone || '',
      whatsapp: firstWa?.value || form.whatsapp || '',
      email: firstEmail?.value || form.email || '',
      mapUrl: finalMapUrl,
      showContactInfo: Boolean(form.showContactInfo),
      showAddress: form.showAddress !== false,
      showMapUrl: form.showMapUrl !== false,
      showWorkingHours: form.showWorkingHours !== false,
      contacts: form.contacts || []
    };

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
    onShowToast(
      editingBranchId 
        ? 'تم تحديث بيانات الفرع وقنوات اتصاله وظهورها بنجاح' 
        : 'تمت إضافة الفرع الجديد بنجاح مع كافة قنوات الاتصال المحددة', 
      'success'
    );
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
      onShowToast('تم إنشاء رابط الخريطة تلقائياً', 'info');
    } else {
      onShowToast('يرجى كتابة اسم الفرع والعنوان أولاً لتوليد الرابط', 'error');
    }
  };

  return (
    <div id="admin-branches-manager" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h3 className="font-cairo font-bold text-lg text-stone-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-[#C9A24B]" />
            <span>إدارة الفروع والمكاتب الميدانية وقنوات الاتصال</span>
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            تخصيص كامل لقنوات اتصال كل فرع (تعديل، إضافة، حذف، مسميات ثنائية اللغة، وتحكم بمكان الظهور في الموقع).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فرع جديد</span>
        </button>
      </div>

      {/* Branches List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch, index) => {
          const isMain = Boolean(branch.isMainBranch);
          const isBranchActive = branch.isActive !== false;
          const showContacts = branch.showContactInfo ?? isMain;
          const branchContacts = branch.contacts || [];
          const activeContactsCount = branchContacts.filter(c => c.isActive !== false).length;

          return (
            <div
              key={branch.id || index}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isMain
                  ? 'bg-gradient-to-br from-amber-50/70 via-white to-white border-[#C9A24B]/50 shadow-sm'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              } ${!isBranchActive ? 'opacity-60 bg-stone-50 border-dashed' : ''}`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isMain ? 'bg-[#C9A24B] text-white border-[#B38A34]' : 'bg-stone-100 text-stone-700 border-stone-200'
                  }`}>
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-cairo font-bold text-stone-900 text-sm sm:text-base">
                        {branch.name}
                      </h4>
                      {isMain && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A24B] text-white">
                          الفرع الرئيسي HQ
                        </span>
                      )}
                      {!isBranchActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-600">
                          مخفي للزوار
                        </span>
                      )}
                    </div>
                    {branch.nameEn && (
                      <span className="text-xs text-stone-400 font-normal dir-ltr block text-left">
                        {branch.nameEn}
                      </span>
                    )}
                    <span className="text-xs text-[#B38A34] font-semibold mt-0.5 block">
                      📍 {branch.city} {branch.cityEn && `(${branch.cityEn})`}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <span className="text-[10px] text-stone-400 font-semibold ml-1">الظهور في:</span>
                      <button
                        type="button"
                        onClick={() => handleToggleBranchPageVisibility(branch.id, 'showInAboutPage')}
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          branch.showInAboutPage !== false
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                            : 'bg-stone-100 text-stone-400 border border-dashed border-stone-300 hover:bg-stone-200 line-through'
                        }`}
                        title="انقر لتفعيل أو إخفاء هذا الفرع في صفحة من نحن"
                      >
                        {branch.showInAboutPage !== false ? <Eye className="w-2.5 h-2.5 text-amber-700" /> : <EyeOff className="w-2.5 h-2.5 text-stone-400" />}
                        <span>من نحن</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleBranchPageVisibility(branch.id, 'showInContactPage')}
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          branch.showInContactPage !== false
                            ? 'bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200'
                            : 'bg-stone-100 text-stone-400 border border-dashed border-stone-300 hover:bg-stone-200 line-through'
                        }`}
                        title="انقر لتفعيل أو إخفاء هذا الفرع في صفحة تواصل معنا"
                      >
                        {branch.showInContactPage !== false ? <Eye className="w-2.5 h-2.5 text-blue-700" /> : <EyeOff className="w-2.5 h-2.5 text-stone-400" />}
                        <span>تواصل معنا</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleBranchPageVisibility(branch.id, 'showInFooter')}
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          branch.showInFooter !== false
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-stone-100 text-stone-400 border border-dashed border-stone-300 hover:bg-stone-200 line-through'
                        }`}
                        title="انقر لتفعيل أو إخفاء هذا الفرع في الفوتر أسفل الموقع"
                      >
                        {branch.showInFooter !== false ? <Eye className="w-2.5 h-2.5 text-emerald-700" /> : <EyeOff className="w-2.5 h-2.5 text-stone-400" />}
                        <span>الفوتر</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleBranchPageVisibility(branch.id, 'showContactInfo')}
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          showContacts
                            ? 'bg-purple-100 text-purple-900 border border-purple-300 hover:bg-purple-200'
                            : 'bg-stone-100 text-stone-400 border border-dashed border-stone-300 hover:bg-stone-200'
                        }`}
                        title="انقر لإظهار أو إخفاء أرقام وقنوات اتصال هذا الفرع للزوار"
                      >
                        <Phone className="w-2.5 h-2.5 text-purple-700" />
                        <span>{showContacts ? 'الاتصال' : 'بدون اتصال'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleBranchPageVisibility(branch.id, 'showAddress')}
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          branch.showAddress !== false
                            ? 'bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200'
                            : 'bg-stone-100 text-stone-400 border border-dashed border-stone-300 hover:bg-stone-200 line-through'
                        }`}
                        title="انقر لإظهار أو إخفاء العنوان التفصيلي لهذا الفرع في الموقع"
                      >
                        {branch.showAddress !== false ? <Eye className="w-2.5 h-2.5 text-rose-700" /> : <EyeOff className="w-2.5 h-2.5 text-stone-400" />}
                        <span>العنوان</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleBranchPageVisibility(branch.id, 'showMapUrl')}
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          branch.showMapUrl !== false
                            ? 'bg-teal-100 text-teal-900 border border-teal-300 hover:bg-teal-200'
                            : 'bg-stone-100 text-stone-400 border border-dashed border-stone-300 hover:bg-stone-200 line-through'
                        }`}
                        title="انقر لإظهار أو إخفاء رابط وزر الخريطة لهذا الفرع"
                      >
                        {branch.showMapUrl !== false ? <Eye className="w-2.5 h-2.5 text-teal-700" /> : <EyeOff className="w-2.5 h-2.5 text-stone-400" />}
                        <span>الخريطة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleBranchPageVisibility(branch.id, 'showWorkingHours')}
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          branch.showWorkingHours !== false
                            ? 'bg-cyan-100 text-cyan-900 border border-cyan-300 hover:bg-cyan-200'
                            : 'bg-stone-100 text-stone-400 border border-dashed border-stone-300 hover:bg-stone-200 line-through'
                        }`}
                        title="انقر لإظهار أو إخفاء ساعات وأوقات العمل لهذا الفرع"
                      >
                        {branch.showWorkingHours !== false ? <Eye className="w-2.5 h-2.5 text-cyan-700" /> : <EyeOff className="w-2.5 h-2.5 text-stone-400" />}
                        <span>ساعات العمل</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions: Up / Down / Edit / Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveOrder(index, 'up')}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                    title="تحريك لأعلى"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === branches.length - 1}
                    onClick={() => handleMoveOrder(index, 'down')}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                    title="تحريك لأسفل"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(branch.id, isBranchActive)}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isBranchActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                    }`}
                    title={isBranchActive ? 'مفعل (انقر للإخفاء)' : 'مخفي (انقر للتفعيل)'}
                  >
                    {isBranchActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(branch)}
                    className="p-1.5 rounded-lg bg-[#C9A24B]/15 hover:bg-[#C9A24B]/30 text-[#B38A34] transition-colors cursor-pointer"
                    title="تعديل بيانات وقنوات اتصال الفرع"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(branch)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                    title="حذف الفرع"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Address & Hours */}
              <div className="text-xs text-stone-600 space-y-1 bg-stone-50/80 p-3 rounded-xl border border-stone-200/60">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{branch.address}</span>
                </div>
                {branch.workingHours && (
                  <div className="flex items-center gap-1.5 text-stone-500 pt-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{branch.workingHours}</span>
                  </div>
                )}
              </div>

              {/* Contacts Channels Summary */}
              <div className="pt-2 border-t border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#B38A34]" />
                    <span>قنوات الاتصال ({branchContacts.length}):</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    showContacts 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {showContacts ? `ظهور الأرقام: مفعل (${activeContactsCount} نشط)` : 'ظهور الأرقام: معطل للزوار'}
                  </span>
                </div>

                {branchContacts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {branchContacts.map((contact, cIdx) => (
                      <span
                        key={contact.id || cIdx}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono border ${
                          contact.isActive !== false
                            ? 'bg-white border-stone-200 text-stone-800'
                            : 'bg-stone-100 border-dashed border-stone-300 text-stone-400 line-through'
                        }`}
                        title={`${contact.label} - ${contact.value}`}
                      >
                        {contact.type === 'whatsapp' && <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />}
                        {contact.type === 'call' && <Phone className="w-3 h-3 text-[#B38A34]" />}
                        {contact.type === 'email' && <Mail className="w-3 h-3 text-[#B38A34]" />}
                        {contact.type === 'link' && <LinkIcon className="w-3 h-3 text-blue-600" />}
                        <span className="font-sans font-bold text-[10px] text-stone-900">{contact.label}:</span>
                        <span className="dir-ltr">{contact.value}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-400 italic">
                    لا توجد قنوات اتصال محددة لهذا الفرع.
                  </p>
                )}
              </div>

              {/* Map Link Preview */}
              {branch.mapUrl && (
                <div className="pt-2 flex items-center justify-between text-xs">
                  <a
                    href={branch.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B38A34] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>فتح اللوكيشن على الخريطة</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          );
        })}

        {branches.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs sm:text-sm text-stone-500 bg-stone-50 rounded-3xl border border-dashed border-stone-300">
            لا توجد فروع مضافة حالياً. اضغط على "+ إضافة فرع جديد" لإضافة موقع جديد وقنوات اتصاله.
          </div>
        )}
      </div>

      {/* Add / Edit Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center border border-[#C9A24B]/30">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-lg text-stone-900 leading-tight">
                    {editingBranchId ? 'تعديل بيانات الفرع وقنوات الاتصال' : 'إضافة فرع جديد'}
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    بيانات ثنائية اللغة + تحكم كامل بقنوات الاتصال ومواقع ظهورها
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

            <form onSubmit={handleSave} className="space-y-5">
              {/* Branch Name: Arabic & English */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">اسم الفرع (بالعربية): *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: فرع مكة المكرمة (المقر الرئيسي)"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">اسم الفرع (بالإنجليزي):</label>
                  <input
                    type="text"
                    value={form.nameEn || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, nameEn: e.target.value }))}
                    placeholder="e.g. Makkah Branch (Headquarters)"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                  />
                </div>
              </div>

              {/* City: Arabic & English */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">المدينة (بالعربية): *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="مثال: مكة المكرمة، المدينة المنورة، القاهرة، جاكرتا..."
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">المدينة (بالإنجليزي):</label>
                  <input
                    type="text"
                    value={form.cityEn || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, cityEn: e.target.value }))}
                    placeholder="e.g. Makkah, Madinah, Cairo, Jakarta..."
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                  />
                </div>
              </div>

              {/* Detailed Address: Arabic & English with Show/Hide Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#B38A34]" />
                    <span>العنوان التفصيلي وموقع المقر: *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, showAddress: prev.showAddress === false ? true : false }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                      form.showAddress !== false 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100' 
                        : 'bg-stone-100 text-stone-500 border border-stone-300 hover:bg-stone-200'
                    }`}
                    title={form.showAddress !== false ? 'العنوان ظاهر بالموقع للزوار (انقر للإخفاء)' : 'العنوان مخفي من الموقع (انقر للإظهار)'}
                  >
                    {form.showAddress !== false ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
                    <span>{form.showAddress !== false ? 'العنوان ظاهر' : 'العنوان مخفي'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">العنوان التفصيلي (عربي): *</label>
                    <textarea
                      rows={2}
                      required
                      value={form.address}
                      onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="مثال: أبراج وقف الملك عبدالعزيز (الصفوة)، شارع أجياد، مكة المكرمة"
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">العنوان التفصيلي (English):</label>
                    <textarea
                      rows={2}
                      value={form.addressEn || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, addressEn: e.target.value }))}
                      placeholder="e.g. King Abdulaziz Endowment Towers (Al Safwah), Ajyad St, Makkah"
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                    />
                  </div>
                </div>
              </div>

              {/* Map Link with Show/Hide Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#B38A34]" />
                      <span>رابط الموقع على خرائط Google (Google Maps URL):</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateAutoMapLink}
                      className="text-[11px] text-[#B38A34] hover:underline font-bold cursor-pointer"
                    >
                      ⚡ توليد رابط خريطة تلقائي
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, showMapUrl: prev.showMapUrl === false ? true : false }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                      form.showMapUrl !== false 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100' 
                        : 'bg-stone-100 text-stone-500 border border-stone-300 hover:bg-stone-200'
                    }`}
                    title={form.showMapUrl !== false ? 'رابط وزر الخريطة ظاهر للزوار (انقر للإخفاء)' : 'رابط وزر الخريطة مخفي (انقر للإظهار)'}
                  >
                    {form.showMapUrl !== false ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
                    <span>{form.showMapUrl !== false ? 'الخريطة ظاهرة' : 'الخريطة مخفية'}</span>
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

              {/* Working Hours: Arabic & English with Show/Hide Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#B38A34]" />
                    <span>ساعات وأوقات العمل:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, showWorkingHours: prev.showWorkingHours === false ? true : false }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                      form.showWorkingHours !== false 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100' 
                        : 'bg-stone-100 text-stone-500 border border-stone-300 hover:bg-stone-200'
                    }`}
                    title={form.showWorkingHours !== false ? 'ساعات العمل ظاهرة للزوار (انقر للإخفاء)' : 'ساعات العمل مخفية (انقر للإظهار)'}
                  >
                    {form.showWorkingHours !== false ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
                    <span>{form.showWorkingHours !== false ? 'ساعات العمل ظاهرة' : 'ساعات العمل مخفية'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">ساعات العمل (عربي):</label>
                    <input
                      type="text"
                      value={form.workingHours || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, workingHours: e.target.value }))}
                      placeholder="مثال: على مدار الساعة 24/7"
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">ساعات العمل (English):</label>
                    <input
                      type="text"
                      value={form.workingHoursEn || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, workingHoursEn: e.target.value }))}
                      placeholder="e.g. 24/7 Around the clock"
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-left"
                    />
                  </div>
                </div>
              </div>

              {/* BRANCH-LEVEL SHOW CONTACT INFO TOGGLE */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5 cursor-pointer">
                      <Phone className="w-4 h-4 text-[#B38A34]" />
                      <span>إظهار قنوات الاتصال لهذا الفرع في صفحات الموقع للزوار</span>
                    </label>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      عند التفعيل، ستظهر أرقام الهواتف والواتساب المحددة أدناه في صفحات الموقع (الفوتر، اتصل بنا، من نحن). عند التعطيل، يظهر الفرع كعنوان وموقع جغرافي فقط دون أرقام تواصل.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.showContactInfo !== false}
                      onChange={(e) => setForm(prev => ({ ...prev, showContactInfo: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A24B]"></div>
                  </label>
                </div>
              </div>

              {/* BRANCH PLACEMENT TOGGLES: Control where this branch appears */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <span className="text-xs font-bold text-stone-900 block flex items-center gap-1.5">
                  <Layout className="w-4 h-4 text-[#B38A34]" />
                  <span>تحديد أماكن ظهور هذا الفرع في صفحات الموقع:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* About Page */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-stone-200 cursor-pointer hover:bg-amber-50/50 transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={form.showInAboutPage !== false}
                      onChange={(e) => setForm(prev => ({ ...prev, showInAboutPage: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                    />
                    <div>
                      <strong className="text-xs block text-stone-900">صفحة من نحن</strong>
                      <span className="text-[10px] text-stone-500">عرض الفرع في من نحن</span>
                    </div>
                  </label>

                  {/* Contact Page */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-stone-200 cursor-pointer hover:bg-amber-50/50 transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={form.showInContactPage !== false}
                      onChange={(e) => setForm(prev => ({ ...prev, showInContactPage: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                    />
                    <div>
                      <strong className="text-xs block text-stone-900">صفحة تواصل معنا</strong>
                      <span className="text-[10px] text-stone-500">عرض الفرع في صفحة التواصل</span>
                    </div>
                  </label>

                  {/* Footer */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-stone-200 cursor-pointer hover:bg-amber-50/50 transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={form.showInFooter !== false}
                      onChange={(e) => setForm(prev => ({ ...prev, showInFooter: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                    />
                    <div>
                      <strong className="text-xs block text-stone-900">الفوتر (أسفل الموقع)</strong>
                      <span className="text-[10px] text-stone-500">عرض الفرع في تذييل الصفحات</span>
                    </div>
                  </label>

                  {/* Show Contact Info */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-stone-200 cursor-pointer hover:bg-purple-50/50 transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={form.showContactInfo !== false}
                      onChange={(e) => setForm(prev => ({ ...prev, showContactInfo: e.target.checked }))}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-600"
                    />
                    <div>
                      <strong className="text-xs block text-stone-900">أرقام وقنوات الاتصال</strong>
                      <span className="text-[10px] text-stone-500">عرض أرقام هاتف وواتساب الفرع</span>
                    </div>
                  </label>

                  {/* Show Address */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-stone-200 cursor-pointer hover:bg-rose-50/50 transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={form.showAddress !== false}
                      onChange={(e) => setForm(prev => ({ ...prev, showAddress: e.target.checked }))}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-600"
                    />
                    <div>
                      <strong className="text-xs block text-stone-900">العنوان التفصيلي</strong>
                      <span className="text-[10px] text-stone-500">إظهار نص العنوان في البطاقات</span>
                    </div>
                  </label>

                  {/* Show Map Link */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-stone-200 cursor-pointer hover:bg-teal-50/50 transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={form.showMapUrl !== false}
                      onChange={(e) => setForm(prev => ({ ...prev, showMapUrl: e.target.checked }))}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-600"
                    />
                    <div>
                      <strong className="text-xs block text-stone-900">رابط وزر الخريطة</strong>
                      <span className="text-[10px] text-stone-500">إظهار زر فتح خرائط Google</span>
                    </div>
                  </label>

                  {/* Show Working Hours */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-stone-200 cursor-pointer hover:bg-cyan-50/50 transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={form.showWorkingHours !== false}
                      onChange={(e) => setForm(prev => ({ ...prev, showWorkingHours: e.target.checked }))}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-600"
                    />
                    <div>
                      <strong className="text-xs block text-stone-900">ساعات وأوقات العمل</strong>
                      <span className="text-[10px] text-stone-500">إظهار مواعيد وساعات الدوام</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* DYNAMIC CONTACTS SECTION */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-300/80 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#B38A34]" />
                      <span>قنوات ووسائل اتصال الفرع (Contact Channels)</span>
                    </h4>
                    <p className="text-[10px] text-stone-500">
                      أضف وعدّل مسميات وأرقام الهواتف والواتساب وحدد أماكن ظهور كل قناة بدقة.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={showContactForm ? () => setShowContactForm(false) : handleOpenAddContact}
                    className="px-3 py-1.5 rounded-lg bg-[#C9A24B] text-white hover:bg-[#B38A34] text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                  >
                    {showContactForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{showContactForm ? 'إغلاق النموذج' : 'إضافة وسيلة اتصال'}</span>
                  </button>
                </div>

                {/* Sub-form to Add or EDIT Contact */}
                {showContactForm && (
                  <div className="p-4 bg-white rounded-2xl border-2 border-[#C9A24B]/50 shadow-md space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-[#B38A34]" />
                        <span>{editingContactId ? 'تعديل وسيلة الاتصال' : 'إضافة وسيلة اتصال جديدة للفرع'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowContactForm(false)}
                        className="text-stone-400 hover:text-stone-700 text-xs"
                      >
                        إلغاء
                      </button>
                    </div>

                    {/* Channel Type & Labels */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">نوع القناة:</label>
                        <select
                          value={contactDraft.type}
                          onChange={(e) => setContactDraft(prev => ({ ...prev, type: e.target.value as any }))}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-stone-50 focus:bg-white focus:border-[#C9A24B]"
                        >
                          <option value="call">📞 هاتف / اتصال مباشر</option>
                          <option value="whatsapp">💬 واتساب مباشر</option>
                          <option value="email">✉️ بريد إلكتروني</option>
                          <option value="link">🔗 رابط / موقع ويب</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">المسمى (عربي): *</label>
                        <input
                          type="text"
                          value={contactDraft.label}
                          onChange={(e) => setContactDraft(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="مثال: الإدارة العامة، هاتف الاستقبال، التسكين..."
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:border-[#C9A24B]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">المسمى (English):</label>
                        <input
                          type="text"
                          value={contactDraft.labelEn || ''}
                          onChange={(e) => setContactDraft(prev => ({ ...prev, labelEn: e.target.value }))}
                          placeholder="e.g. Management, Reception..."
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 dir-ltr text-left focus:border-[#C9A24B]"
                        />
                      </div>
                    </div>

                    {/* Value Field */}
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">
                        القيمة ({contactDraft.type === 'call' ? 'رقم الهاتف' : contactDraft.type === 'whatsapp' ? 'رقم الواتساب' : contactDraft.type === 'email' ? 'البريد الإلكتروني' : 'الرابط'}): *
                      </label>
                      <input
                        type="text"
                        value={contactDraft.value}
                        onChange={(e) => setContactDraft(prev => ({ ...prev, value: e.target.value }))}
                        placeholder={
                          contactDraft.type === 'call' || contactDraft.type === 'whatsapp'
                            ? '+966501234567'
                            : contactDraft.type === 'email'
                            ? 'makkah@prestigehotels.sa'
                            : 'https://...'
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 dir-ltr text-left font-mono focus:border-[#C9A24B]"
                      />
                    </div>

                    {/* Per-channel Display Placement Control */}
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                      <span className="text-[11px] font-bold text-stone-800 block flex items-center gap-1">
                        <Layout className="w-3.5 h-3.5 text-[#B38A34]" />
                        <span>أماكن ظهور هذه القناة في الموقع (Display Placements):</span>
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={contactDraft.showInAbout !== false}
                            onChange={(e) => setContactDraft(prev => ({ ...prev, showInAbout: e.target.checked }))}
                            className="rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                          />
                          <span className="text-stone-800 text-[11px]">صفحة من نحن (About)</span>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={contactDraft.showInContact !== false}
                            onChange={(e) => setContactDraft(prev => ({ ...prev, showInContact: e.target.checked }))}
                            className="rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                          />
                          <span className="text-stone-800 text-[11px]">صفحة اتصل بنا (Contact)</span>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={contactDraft.showInFooter !== false}
                            onChange={(e) => setContactDraft(prev => ({ ...prev, showInFooter: e.target.checked }))}
                            className="rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                          />
                          <span className="text-stone-800 text-[11px]">الفوتر (Footer)</span>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={contactDraft.showInHotelDetail !== false}
                            onChange={(e) => setContactDraft(prev => ({ ...prev, showInHotelDetail: e.target.checked }))}
                            className="rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                          />
                          <span className="text-stone-800 text-[11px]">صفحات الفنادق (Hotels)</span>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(contactDraft.showInFloating)}
                            onChange={(e) => setContactDraft(prev => ({ ...prev, showInFloating: e.target.checked }))}
                            className="rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                          />
                          <span className="text-stone-800 text-[11px]">الأزرار العائمة (Floating)</span>
                        </label>
                      </div>
                    </div>

                    {/* Active Toggle & Save Contact Button */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                        <input
                          type="checkbox"
                          checked={contactDraft.isActive !== false}
                          onChange={(e) => setContactDraft(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                        />
                        <span>قناة مفعلة</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowContactForm(false);
                            setEditingContactId(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveContact}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{editingContactId ? 'حفظ التعديل' : 'إدراج في قائمة الفرع'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contacts List */}
                <div className="space-y-2">
                  {(form.contacts || []).map((contact, cIdx) => {
                    const isContactActive = contact.isActive !== false;
                    return (
                      <div 
                        key={contact.id || cIdx}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                          isContactActive ? 'bg-white border-stone-200 shadow-2xs' : 'bg-stone-100 border-dashed border-stone-300 opacity-60'
                        }`}
                      >
                        {/* Info & Labels */}
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                            {contact.type === 'whatsapp' && <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />}
                            {contact.type === 'call' && <Phone className="w-4 h-4 text-[#B38A34]" />}
                            {contact.type === 'email' && <Mail className="w-4 h-4 text-[#B38A34]" />}
                            {contact.type === 'link' && <LinkIcon className="w-4 h-4 text-blue-600" />}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-stone-900">
                                {contact.label}
                              </span>
                              {contact.labelEn && (
                                <span className="text-stone-400 font-normal dir-ltr text-[11px]">
                                  ({contact.labelEn})
                                </span>
                              )}
                              {!isContactActive && (
                                <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-600 text-[10px] font-bold">
                                  معطل
                                </span>
                              )}
                            </div>

                            <div className="font-mono text-xs font-semibold text-stone-800 dir-ltr text-left">
                              {contact.value}
                            </div>

                            {/* Placement Pills */}
                            <div className="flex items-center gap-1 flex-wrap text-[10px] text-stone-500 pt-0.5">
                              <span className="font-semibold text-stone-400">الظهور:</span>
                              {contact.showInAbout !== false && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-[#B38A34] border border-amber-200/60">من نحن</span>
                              )}
                              {contact.showInContact !== false && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200/60">اتصل بنا</span>
                              )}
                              {contact.showInFooter !== false && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">الفوتر</span>
                              )}
                              {contact.showInHotelDetail !== false && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200/60">الفنادق</span>
                              )}
                              {contact.showInFloating && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 border border-cyan-200/60">عائم</span>
                              )}
                              {contact.showInAbout === false && contact.showInContact === false && contact.showInFooter === false && contact.showInHotelDetail === false && !contact.showInFloating && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200">مخفي من كافة المواضع</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order, Edit, Active Toggle, Delete */}
                        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            disabled={cIdx === 0}
                            onClick={() => handleMoveContact(cIdx, 'up')}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                            title="تحريك لأعلى"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={cIdx === (form.contacts || []).length - 1}
                            onClick={() => handleMoveContact(cIdx, 'down')}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                            title="تحريك لأسفل"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditContact(contact)}
                            className="p-1.5 rounded-lg bg-[#C9A24B]/15 hover:bg-[#C9A24B]/30 text-[#B38A34] transition-colors cursor-pointer"
                            title="تعديل المسمى والرقم وأماكن الظهور"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleContactActive(contact.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                              isContactActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                            }`}
                            title={isContactActive ? 'مفعل (انقر للإخفاء)' : 'مخفي (انقر للتفعيل)'}
                          >
                            {isContactActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-600 cursor-pointer transition-colors"
                            title="حذف وسيلة الاتصال"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {(!form.contacts || form.contacts.length === 0) && (
                    <div className="p-4 text-center text-xs text-stone-400 border border-dashed border-stone-300 rounded-xl bg-white">
                      لا توجد وسائل اتصال مضافة لهذا الفرع. اضغط على "+ إضافة وسيلة اتصال" أعلاه لإضافة رقم أو واتساب أو إيميل.
                    </div>
                  )}
                </div>
              </div>

              {/* Main Branch Flag */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isMainBranch)}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      isMainBranch: e.target.checked,
                      // If making it main branch, turn on showContactInfo automatically
                      showContactInfo: e.target.checked ? true : prev.showContactInfo 
                    }))}
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
                  className="flex-1 py-3.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBranchId ? 'حفظ تعديلات الفرع وجهات الاتصال' : 'إضافة وحفظ الفرع الجديد'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors cursor-pointer"
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
