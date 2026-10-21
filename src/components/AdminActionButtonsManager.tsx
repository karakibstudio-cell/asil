import React, { useState } from 'react';
import { 
  ActionButtonItem, 
  ActionButtonType, 
  ActionButtonStyle, 
  ActionButtonPosition, 
  ActionButtonDevice, 
  Hotel, 
  ActivePage,
  ContactDirectoryItem 
} from '../types';
import { 
  MousePointerClick, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Calendar, 
  Key, 
  Star, 
  Sparkles, 
  Navigation, 
  Layers, 
  ShieldCheck, 
  HeartHandshake, 
  User, 
  ExternalLink, 
  Globe, 
  Smartphone, 
  Monitor, 
  Layout, 
  AlertTriangle,
  Tag,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { WhatsAppIcon } from './BookingIcons';
import { 
  DEFAULT_ACTION_BUTTONS, 
  DEFAULT_CONTACTS_DIRECTORY,
  resolveActionButtonTarget,
  getButtonTestUrl,
  isValidInternationalPhone,
  formatInternationalPhone
} from '../utils/actionButtons';

interface AdminActionButtonsManagerProps {
  buttons: ActionButtonItem[];
  onChange: (buttons: ActionButtonItem[]) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  hotels?: Hotel[];
  contactsDirectory?: ContactDirectoryItem[];
  onNavigateToContacts?: () => void;
}

const AVAILABLE_ICONS = [
  { id: 'whatsapp', label: 'واتساب', icon: WhatsAppIcon },
  { id: 'phone', label: 'هاتف', icon: Phone },
  { id: 'mail', label: 'بريد', icon: Mail },
  { id: 'map', label: 'خريطة', icon: MapPin },
  { id: 'building', label: 'فندق / مبنى', icon: Building },
  { id: 'calendar', label: 'تقويم / حجز', icon: Calendar },
  { id: 'key', label: 'مفتاح الغرفة', icon: Key },
  { id: 'star', label: 'نجمة / VIP', icon: Star },
  { id: 'sparkles', label: 'مميز', icon: Sparkles },
  { id: 'navigation', label: 'ملاحة / مسار', icon: Navigation },
  { id: 'layers', label: 'خدمات', icon: Layers },
  { id: 'shield', label: 'أمان وتوثيق', icon: ShieldCheck },
  { id: 'heart', label: 'رعاية وخدمة', icon: HeartHandshake },
  { id: 'user', label: 'مستشار / شخصي', icon: User },
  { id: 'link', label: 'رابط خارجي', icon: ExternalLink },
  { id: 'globe', label: 'موقع ويب', icon: Globe },
];

const AVAILABLE_STYLES: { id: ActionButtonStyle; label: string; bgClass: string }[] = [
  { id: 'primary', label: 'ذهبي معتمد (Primary Gold)', bgClass: 'bg-[#C9A24B] text-white' },
  { id: 'whatsapp', label: 'أخضر واتساب (Emerald WhatsApp)', bgClass: 'bg-[#25D366] text-white' },
  { id: 'secondary', label: 'أبيض بإطار ذهبي (Secondary)', bgClass: 'bg-white border-2 border-[#C9A24B] text-[#98752B]' },
  { id: 'gold', label: 'تدرج ذهبي ملكي (Royal Gold)', bgClass: 'bg-gradient-to-r from-[#DFBE72] via-[#C9A24B] to-[#98752B] text-white' },
  { id: 'dark', label: 'حجري داكن (Dark Stone)', bgClass: 'bg-stone-900 text-white' },
  { id: 'outline', label: 'إطار ناعم (Outline)', bgClass: 'bg-transparent border border-stone-300 text-stone-800' },
  { id: 'glass', label: 'زجاجي مصنفر (Glassmorphism)', bgClass: 'bg-white/80 backdrop-blur-md border border-white/40 text-stone-900' }
];

const AVAILABLE_POSITIONS: { id: ActionButtonPosition; label: string; desc: string }[] = [
  { id: 'header', label: 'الهيدر والشريط العلوي', desc: 'أعلى الموقع بجانب زر الحجز' },
  { id: 'hero', label: 'واجهة الترحيب (الهيرو)', desc: 'الأزرار التفاعلية الرئيسية بالصفحة الأولى' },
  { id: 'floating', label: 'الأزرار والقنوات العائمة (FAB)', desc: 'زر عائم دائم أسفل الشاشة للزوار' },
  { id: 'footer', label: 'الفوتر وتذييل الصفحة', desc: 'شريط التواصل أسفل كل صفحة' },
  { id: 'hotel_detail', label: 'صفحات تفاصيل الفنادق', desc: 'الشريط السفلي وأزرار التواصل الخاصة بكل فندق' },
  { id: 'about_hq', label: 'وجهة وبطاقة المقر الرئيسي (About)', desc: 'زر الوجهة واللوكيشن في صفحة من نحن' },
  { id: 'contact_page', label: 'صفحة تواصل معنا', desc: 'أزرار الاتصال السريع في صفحة التواصل' },
];

const AVAILABLE_PAGES: { id: string; label: string }[] = [
  { id: 'all', label: 'كافة صفحات الموقع (All Pages)' },
  { id: 'home', label: 'الرئيسية (Home)' },
  { id: 'hotels', label: 'الفنادق المعتمدة (Hotels)' },
  { id: 'hotel-detail', label: 'تفاصيل الفندق (Hotel Detail)' },
  { id: 'about', label: 'من نحن والمقر (About)' },
  { id: 'contact', label: 'اتصل بنا (Contact)' },
  { id: 'room-booking', label: 'حجز وتسكين الغرف (Booking)' },
  { id: 'packages', label: 'الباقات والعروض (Packages)' },
  { id: 'track-booking', label: 'متابعة الحجز (Track)' }
];

const DEFAULT_DRAFT: ActionButtonItem = {
  id: '',
  label: '',
  labelEn: '',
  icon: 'whatsapp',
  style: 'whatsapp',
  actionType: 'whatsapp',
  contactId: 'cnt_housing_consultant',
  target: '+966560580250',
  whatsappMessage: 'السلام عليكم ورحمة الله، أود الاستفسار والتواصل.',
  whatsappMessageEn: 'Hello, I would like to inquire regarding hotel booking.',
  order: 1,
  isActive: true,
  pages: ['all'],
  positions: ['footer', 'floating'],
  devices: 'all',
  badgeText: '',
  badgeTextEn: ''
};

export const AdminActionButtonsManager: React.FC<AdminActionButtonsManagerProps> = ({
  buttons = [],
  onChange,
  onShowToast,
  hotels = [],
  contactsDirectory = DEFAULT_CONTACTS_DIRECTORY,
  onNavigateToContacts
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActionButtonItem>(DEFAULT_DRAFT);
  
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    button: ActionButtonItem | null;
  }>({
    isOpen: false,
    button: null
  });

  const currentButtons = Array.isArray(buttons) && buttons.length > 0 
    ? buttons 
    : DEFAULT_ACTION_BUTTONS;

  const currentContacts = Array.isArray(contactsDirectory) && contactsDirectory.length > 0
    ? contactsDirectory
    : DEFAULT_CONTACTS_DIRECTORY;

  const handleOpenAdd = () => {
    setEditingId(null);
    const defaultContact = currentContacts.length > 0 ? currentContacts[0].id : 'custom';
    setDraft({
      ...DEFAULT_DRAFT,
      id: 'btn_' + Date.now(),
      contactId: defaultContact,
      order: currentButtons.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (button: ActionButtonItem) => {
    setEditingId(button.id);
    setDraft({
      ...button,
      contactId: button.contactId || (button.actionType === 'call' || button.actionType === 'whatsapp' || button.actionType === 'email' ? 'custom' : undefined),
      pages: Array.isArray(button.pages) && button.pages.length > 0 ? button.pages : ['all'],
      positions: Array.isArray(button.positions) && button.positions.length > 0 ? button.positions : ['footer'],
      devices: button.devices || 'all'
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    const updated = currentButtons.map(b => 
      b.id === id ? { ...b, isActive: !currentActive } : b
    );
    onChange(updated);
    onShowToast(!currentActive ? 'تم تفعيل ظهور الزر في الموقع' : 'تم إخفاء الزر من الموقع', 'success');
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentButtons.length) return;

    const list = [...currentButtons];
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);

    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    onChange(reordered);
    onShowToast('تم تحديث ترتيب الأزرار بنجاح', 'success');
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.label.trim()) {
      onShowToast('يرجى إدخال مسمى الزر بالعربية', 'error');
      return;
    }

    const isChannel = draft.actionType === 'call' || draft.actionType === 'whatsapp' || draft.actionType === 'email';
    
    // Auto sync target if contact is picked
    let finalTarget = draft.target.trim();
    if (isChannel && draft.contactId && draft.contactId !== 'custom') {
      const contact = currentContacts.find(c => c.id === draft.contactId);
      if (contact) {
        if (draft.actionType === 'call') finalTarget = contact.phone;
        else if (draft.actionType === 'whatsapp') finalTarget = contact.whatsapp || contact.phone;
        else if (draft.actionType === 'email') finalTarget = contact.email || '';
      }
    } else if (isChannel && (!draft.contactId || draft.contactId === 'custom')) {
      if (!finalTarget) {
        onShowToast('يرجى إدخال الرقم المخصص للزر', 'error');
        return;
      }
      if ((draft.actionType === 'call' || draft.actionType === 'whatsapp') && !isValidInternationalPhone(finalTarget)) {
        finalTarget = formatInternationalPhone(finalTarget);
      }
    } else if (!isChannel && !finalTarget && !draft.targetHotelId && !draft.targetPage) {
      onShowToast('يرجى تحديد وجهة الإجراء (رابط، صفحة، أو فندق)', 'error');
      return;
    }

    const finalizedDraft: ActionButtonItem = {
      ...draft,
      target: finalTarget
    };

    let updated: ActionButtonItem[];
    if (editingId) {
      updated = currentButtons.map(b => b.id === editingId ? { ...finalizedDraft, id: editingId } : b);
    } else {
      updated = [...currentButtons, { ...finalizedDraft, id: 'btn_' + Date.now(), order: currentButtons.length + 1 }];
    }

    onChange(updated);
    setIsModalOpen(false);
    onShowToast(editingId ? 'تم تحديث الزر بنجاح' : 'تمت إضافة الزر الجديد بنجاح', 'success');
  };

  const executeDelete = () => {
    if (!deleteModal.button) return;
    const updated = currentButtons.filter(b => b.id !== deleteModal.button?.id);
    onChange(updated);
    setDeleteModal({ isOpen: false, button: null });
    onShowToast('تم حذف الزر بنجاح', 'info');
  };

  const togglePageSelection = (pageId: string) => {
    let current = [...draft.pages];
    if (pageId === 'all') {
      if (current.includes('all')) {
        current = [];
      } else {
        current = ['all'];
      }
    } else {
      current = current.filter(p => p !== 'all');
      if (current.includes(pageId)) {
        current = current.filter(p => p !== pageId);
      } else {
        current.push(pageId);
      }
      if (current.length === 0) {
        current = ['all'];
      }
    }
    setDraft({ ...draft, pages: current });
  };

  const togglePositionSelection = (posId: ActionButtonPosition) => {
    let current = [...draft.positions];
    if (current.includes(posId)) {
      if (current.length > 1) {
        current = current.filter(p => p !== posId);
      } else {
        onShowToast('يجب تحديد موضع ظهور واحد على الأقل للزر', 'error');
        return;
      }
    } else {
      current.push(posId);
    }
    setDraft({ ...draft, positions: current });
  };

  const handleTestButton = (button: ActionButtonItem) => {
    const testUrl = getButtonTestUrl(button, currentContacts);
    if (!testUrl || testUrl === '#') {
      onShowToast('الزر غير مكتمل أو لا يحتوي على رابط صالح للاختبار', 'error');
      return;
    }
    window.open(testUrl, '_blank', 'noopener,noreferrer');
    onShowToast(`تم فتح رابط الاختبار: ${testUrl}`, 'info');
  };

  const handleResetDefaults = () => {
    if (window.confirm('هل تود استعادة الأزرار التفاعلية وقنوات الاتصال الافتراضية؟')) {
      onChange(DEFAULT_ACTION_BUTTONS);
      onShowToast('تمت استعادة الأزرار الافتراضية بنجاح', 'success');
    }
  };

  // Count warning buttons (missing or inactive contact)
  const brokenButtons = currentButtons.filter(b => {
    if (b.actionType === 'call' || b.actionType === 'whatsapp' || b.actionType === 'email') {
      const res = resolveActionButtonTarget(b, currentContacts);
      return res.status !== 'ok';
    }
    return false;
  });

  return (
    <div id="admin-action-buttons-manager" className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-8 shadow-xs space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/15 border border-[#C9A24B]/30 flex items-center justify-center text-[#98752B]">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-cairo font-bold text-stone-900 flex items-center gap-2">
                <span>إدارة أزرار الإجراءات والتواصل الشاملة</span>
                <span className="text-xs bg-[#C9A24B]/10 text-[#98752B] border border-[#C9A24B]/30 px-2.5 py-0.5 rounded-full font-bold">
                  مرتبطة بدليل جهات الاتصال
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                تحكم موحد في كافة أزرار الموقع (مستشار التسكين، هاتف الاستقبال، واتساب، الأزرار العائمة FAB، المقر الرئيسي، وأزرار الفنادق).
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onNavigateToContacts && (
            <button
              type="button"
              onClick={onNavigateToContacts}
              className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#98752B] border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4 text-[#C9A24B]" />
              <span>دليل جهات الاتصال ↗</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="استعادة الأزرار الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>استعادة الافتراضية</span>
          </button>

          <button
            type="button"
            id="admin-add-action-button-btn"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة زر إجراء جديد</span>
          </button>
        </div>
      </div>

      {/* Warning Banner if any button is broken */}
      {brokenButtons.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="block font-bold">
                تنبيه: يوجد ({brokenButtons.length}) أزرار بحاجة لتحديد جهة اتصال نشطة أو رقم صالح.
              </strong>
              <span className="text-[11px] text-amber-800">
                لحماية تجربة الزوار، يقوم النظام تلقائياً بإخفاء هذه الأزرار من الموقع لمنع الروابط المعطلة حتى يتم ضبطها.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Master Action Buttons Table */}
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-right text-xs sm:text-sm min-w-[950px]">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 text-xs font-bold">
              <th className="py-3.5 px-3">الترتيب</th>
              <th className="py-3.5 px-3">مسمى الزر والمظهر</th>
              <th className="py-3.5 px-3">أماكن الظهور (Placement)</th>
              <th className="py-3.5 px-3">نوع القناة / الإجراء</th>
              <th className="py-3.5 px-3">جهة الاتصال والهدف</th>
              <th className="py-3.5 px-3 text-center">الحالة</th>
              <th className="py-3.5 px-3 text-left">الإجراءات واختبار الرابط</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {currentButtons.map((btn, idx) => {
              const iconObj = AVAILABLE_ICONS.find(i => i.id === btn.icon) || AVAILABLE_ICONS[0];
              const IconComponent = iconObj.icon;
              const styleObj = AVAILABLE_STYLES.find(s => s.id === btn.style) || AVAILABLE_STYLES[0];
              const resolved = resolveActionButtonTarget(btn, currentContacts);
              const isFirst = idx === 0;
              const isLast = idx === currentButtons.length - 1;

              return (
                <tr key={btn.id} className="hover:bg-amber-50/30 transition-colors">
                  {/* Order & Reorder */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 font-mono font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveOrder(idx, 'up')}
                          className="p-0.5 rounded text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                          title="تحريك لأعلى"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveOrder(idx, 'down')}
                          className="p-0.5 rounded text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                          title="تحريك لأسفل"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Label & Style Preview */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${styleObj.bgClass} shadow-2xs`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <strong className="text-stone-900 font-bold block truncate max-w-[220px]">
                            {btn.label}
                          </strong>
                          {btn.labelEn && (
                            <span className="text-[11px] text-stone-500 font-medium block truncate max-w-[220px]">
                              {btn.labelEn}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Positions & Device */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {btn.positions?.map(pos => {
                          const posObj = AVAILABLE_POSITIONS.find(p => p.id === pos);
                          return (
                            <span key={pos} className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold">
                              {posObj?.label || pos}
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium">
                        {btn.devices === 'mobile' ? (
                          <span className="flex items-center gap-1 text-purple-700 font-bold">
                            <Smartphone className="w-3 h-3" />
                            <span>جوال فقط</span>
                          </span>
                        ) : btn.devices === 'desktop' ? (
                          <span className="flex items-center gap-1 text-blue-700 font-bold">
                            <Monitor className="w-3 h-3" />
                            <span>كمبيوتر فقط</span>
                          </span>
                        ) : (
                          <span>جميع الأجهزة</span>
                        )}
                        <span>•</span>
                        <span>{btn.pages?.includes('all') ? 'كافة الصفحات' : `${btn.pages?.length || 0} صفحات`}</span>
                      </div>
                    </div>
                  </td>

                  {/* Channel / Action Type */}
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      btn.actionType === 'whatsapp'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : btn.actionType === 'call'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : btn.actionType === 'email'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-stone-100 text-stone-800'
                    }`}>
                      {btn.actionType === 'whatsapp' && <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />}
                      {btn.actionType === 'call' && <Phone className="w-3.5 h-3.5 text-amber-600" />}
                      {btn.actionType === 'email' && <Mail className="w-3.5 h-3.5 text-blue-600" />}
                      {btn.actionType === 'map' && <MapPin className="w-3.5 h-3.5 text-red-600" />}
                      {btn.actionType === 'page' && <Layout className="w-3.5 h-3.5 text-stone-600" />}
                      {btn.actionType === 'hotel' && <Building className="w-3.5 h-3.5 text-amber-700" />}
                      {btn.actionType === 'url' && <ExternalLink className="w-3.5 h-3.5 text-stone-600" />}
                      <span>
                        {btn.actionType === 'whatsapp' ? 'واتساب مباشر' :
                         btn.actionType === 'call' ? 'اتصال هاتفي' :
                         btn.actionType === 'email' ? 'بريد إلكتروني' :
                         btn.actionType === 'map' ? 'موقع خرائط' :
                         btn.actionType === 'page' ? 'صفحة بالموقع' :
                         btn.actionType === 'hotel' ? 'صفحة فندق' : 'رابط خارجي'}
                      </span>
                    </span>
                  </td>

                  {/* Target & Linked Contact Status */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      {resolved.contact ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-900">
                            {resolved.contact.name}
                          </span>
                          {resolved.contact.roleTag && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                              {resolved.contact.roleTag}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-stone-700 block">
                          {btn.actionType === 'page' ? `صفحة: ${btn.targetPage || btn.target}` :
                           btn.actionType === 'hotel' ? `فندق ID: ${btn.targetHotelId || btn.target}` :
                           btn.contactId === 'custom' ? 'رقم مخصص' : 'وجهة مخصصة'}
                        </span>
                      )}

                      {/* Resolved Target & Warning Indicator */}
                      <div className="flex items-center gap-1.5">
                        {resolved.status === 'ok' ? (
                          <span className="text-[11px] font-mono text-emerald-700 dir-ltr text-left font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{resolved.target}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{resolved.statusMessageAr}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Active Toggle */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(btn.id, btn.isActive !== false)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                        btn.isActive !== false && resolved.status === 'ok'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : btn.isActive !== false && resolved.status !== 'ok'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                      }`}
                      title="اضغط لتبديل حالة التفعيل"
                    >
                      {btn.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>
                        {btn.isActive !== false 
                          ? (resolved.status === 'ok' ? 'نشط ومعروض' : 'مخفي (تنبيه)') 
                          : 'مخفي'}
                      </span>
                    </button>
                  </td>

                  {/* Actions & Test Button */}
                  <td className="py-3 px-3 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Live Test Action Button */}
                      <button
                        type="button"
                        onClick={() => handleTestButton(btn)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#98752B] border border-amber-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="تجربة فتح الرابط الفعلي للزر في نافذة جديدة"
                      >
                        <Play className="w-3 h-3 text-[#C9A24B] fill-[#C9A24B]" />
                        <span>اختبار الرابط</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(btn)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 transition-colors cursor-pointer"
                        title="تعديل الزر"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteModal({ isOpen: true, button: btn })}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-red-500 hover:text-white text-stone-700 transition-colors cursor-pointer"
                        title="حذف الزر"
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

      {/* Unified Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in duration-200 text-right">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/15 text-[#98752B] flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-lg text-stone-900">
                    {editingId ? 'تعديل زر الإجراء' : 'إضافة زر تفاعلي وقناة اتصال جديدة'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    حدد مسمى الزر، وقناة الاتصال، وجهة الاتصال من الدليل المركزي، وأماكن ظهوره.
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

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Labels Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    نص الزر بالعربية: *
                  </label>
                  <input
                    type="text"
                    required
                    value={draft.label}
                    onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                    placeholder="مثال: تحدث مع مستشار التسكين"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    نص الزر بالإنجليزية:
                  </label>
                  <input
                    type="text"
                    value={draft.labelEn || ''}
                    onChange={(e) => setDraft({ ...draft, labelEn: e.target.value })}
                    placeholder="e.g. Chat with Housing Consultant"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Action Type (Channel) & Contact Selection Row */}
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      نوع القناة / الإجراء: *
                    </label>
                    <select
                      value={draft.actionType}
                      onChange={(e) => {
                        const newType = e.target.value as ActionButtonType;
                        const isChannel = newType === 'call' || newType === 'whatsapp' || newType === 'email';
                        const defaultContact = isChannel && currentContacts.length > 0 ? currentContacts[0].id : 'custom';
                        setDraft({
                          ...draft,
                          actionType: newType,
                          contactId: isChannel ? defaultContact : undefined,
                          icon: newType === 'whatsapp' ? 'whatsapp' : newType === 'call' ? 'phone' : newType === 'email' ? 'mail' : newType === 'map' ? 'map' : 'building',
                          style: newType === 'whatsapp' ? 'whatsapp' : 'primary'
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                    >
                      <option value="whatsapp">📱 محادثة واتساب فورية (WhatsApp)</option>
                      <option value="call">📞 اتصال هاتفي مباشر (Phone Call)</option>
                      <option value="email">✉️ إرسال بريد إلكتروني (Email)</option>
                      <option value="map">📍 فتح لوكيشن / خرائط جوجل (Google Maps)</option>
                      <option value="hotel">🏨 فتح صفحة فندق محدد (Hotel Detail)</option>
                      <option value="page">📄 انتقال لصفحة داخلية (Internal Page)</option>
                      <option value="url">🔗 رابط خارجي مخصص (Custom URL)</option>
                    </select>
                  </div>

                  {/* If Direct Channel (call, whatsapp, email) -> Show Contact Directory Dropdown */}
                  {(draft.actionType === 'call' || draft.actionType === 'whatsapp' || draft.actionType === 'email') ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-stone-800">
                          جهة الاتصال (دليل الأرقام): *
                        </label>
                        {onNavigateToContacts && (
                          <button
                            type="button"
                            onClick={onNavigateToContacts}
                            className="text-[10px] text-[#98752B] font-bold hover:underline"
                          >
                            + إضافة جهة جديدة للدليل
                          </button>
                        )}
                      </div>
                      <select
                        value={draft.contactId || 'custom'}
                        onChange={(e) => {
                          const cId = e.target.value;
                          const contact = currentContacts.find(c => c.id === cId);
                          let newTarget = draft.target;
                          if (contact) {
                            if (draft.actionType === 'call') newTarget = contact.phone;
                            else if (draft.actionType === 'whatsapp') newTarget = contact.whatsapp || contact.phone;
                            else if (draft.actionType === 'email') newTarget = contact.email || '';
                          }
                          setDraft({
                            ...draft,
                            contactId: cId,
                            target: newTarget
                          });
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                      >
                        {currentContacts.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({draft.actionType === 'whatsapp' ? (c.whatsapp || c.phone) : draft.actionType === 'email' ? (c.email || 'لا يوجد بريد') : c.phone}) {c.isActive === false ? '⚠️ (معطل)' : ''}
                          </option>
                        ))}
                        <option value="custom">✏️ إدخال رقم أو بريد مخصص يدوي...</option>
                      </select>
                    </div>
                  ) : draft.actionType === 'hotel' ? (
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">
                        الفندق المستهدف: *
                      </label>
                      <select
                        value={draft.targetHotelId || draft.target}
                        onChange={(e) => setDraft({ ...draft, targetHotelId: e.target.value, target: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                      >
                        <option value="">-- اختر الفندق --</option>
                        {hotels.map(h => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : draft.actionType === 'page' ? (
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">
                        الصفحة المستهدفة: *
                      </label>
                      <select
                        value={draft.targetPage || draft.target}
                        onChange={(e) => setDraft({ ...draft, targetPage: e.target.value as ActivePage, target: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-bold focus:outline-none focus:border-[#C9A24B]"
                      >
                        {AVAILABLE_PAGES.filter(p => p.id !== 'all').map(p => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">
                        رابط الوجهة أو الخريطة: *
                      </label>
                      <input
                        type="text"
                        required
                        value={draft.target}
                        onChange={(e) => setDraft({ ...draft, target: e.target.value })}
                        placeholder="https://maps.google.com/..."
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-mono dir-ltr text-left focus:outline-none focus:border-[#C9A24B]"
                      />
                    </div>
                  )}
                </div>

                {/* If Custom Contact is chosen for Channel, show custom input */}
                {(draft.actionType === 'call' || draft.actionType === 'whatsapp' || draft.actionType === 'email') && (!draft.contactId || draft.contactId === 'custom') && (
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      الرقم أو البريد المخصص: *
                    </label>
                    <input
                      type="text"
                      required
                      value={draft.target}
                      onChange={(e) => setDraft({ ...draft, target: e.target.value })}
                      placeholder={draft.actionType === 'email' ? 'contact@prestigehotels.sa' : '+966560580250'}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono dir-ltr text-left focus:outline-none focus:border-[#C9A24B]"
                    />
                  </div>
                )}
              </div>

              {/* Optional WhatsApp Prefilled Message */}
              {draft.actionType === 'whatsapp' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      رسالة الواتساب التلقائية (عربي):
                    </label>
                    <input
                      type="text"
                      value={draft.whatsappMessage || ''}
                      onChange={(e) => setDraft({ ...draft, whatsappMessage: e.target.value })}
                      placeholder="السلام عليكم ورحمة الله، أود الاستفسار والتواصل."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      رسالة الواتساب التلقائية (إنجليزي):
                    </label>
                    <input
                      type="text"
                      value={draft.whatsappMessageEn || ''}
                      onChange={(e) => setDraft({ ...draft, whatsappMessageEn: e.target.value })}
                      placeholder="Hello, I would like to inquire about hotel bookings."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                    />
                  </div>
                </div>
              )}

              {/* Icon & Style Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    الأيقونة التعبيرية:
                  </label>
                  <select
                    value={draft.icon}
                    onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                  >
                    {AVAILABLE_ICONS.map(i => (
                      <option key={i.id} value={i.id}>{i.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    نمط ولون الزر:
                  </label>
                  <select
                    value={draft.style}
                    onChange={(e) => setDraft({ ...draft, style: e.target.value as ActionButtonStyle })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-[#C9A24B]"
                  >
                    {AVAILABLE_STYLES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Placements & Pages */}
              <div className="space-y-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-2">
                    مواضع الظهور في الموقع (Placements): *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_POSITIONS.map(pos => {
                      const isChecked = draft.positions?.includes(pos.id);
                      return (
                        <label
                          key={pos.id}
                          onClick={() => togglePositionSelection(pos.id)}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-amber-50/80 border-[#C9A24B] text-amber-900 font-bold'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                          />
                          <div>
                            <span className="text-xs block leading-tight">{pos.label}</span>
                            <span className="text-[10px] text-stone-500 block leading-tight">{pos.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Device Viewport */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    أجهزة العرض المستهدفة:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'all', label: 'جميع الأجهزة' },
                      { id: 'mobile', label: 'الجوال والتابلت فقط 📱' },
                      { id: 'desktop', label: 'أجهزة الكمبيوتر فقط 💻' }
                    ].map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDraft({ ...draft, devices: d.id as ActionButtonDevice })}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          draft.devices === d.id
                            ? 'bg-[#C9A24B] text-white border-[#C9A24B] shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="pt-2 border-t border-stone-200">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={draft.isActive !== false}
                      onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                    />
                    <div>
                      <strong className="text-xs font-bold text-stone-900 block">
                        تفعيل ظهور الزر في الموقع (Active)
                      </strong>
                      <span className="text-[11px] text-stone-500">
                        إذا تم التعطيل، يختفي الزر فوراً من صفحات الموقع للزوار.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'حفظ التعديلات' : 'إضافة الزر الآن'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.button && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-right">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cairo font-bold text-base text-stone-900">
                  تأكيد حذف زر الإجراء
                </h3>
                <p className="text-xs text-stone-500">
                  {deleteModal.button.label}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذا الزر من الموقع؟ لن يظهر للزوار بعد الآن.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, button: null })}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الحذف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
