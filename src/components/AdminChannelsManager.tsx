import React, { useState } from 'react';
import { ContactChannel, ChannelType } from '../types';
import { 
  CHANNEL_METAS, 
  validateChannelValue, 
  getChannelHref 
} from '../utils/channels';
import { ChannelIcon } from './ChannelIcon';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  X, 
  AlertCircle, 
  ExternalLink, 
  GripVertical,
  Eye,
  EyeOff,
  Sparkles,
  Share2
} from 'lucide-react';

interface AdminChannelsManagerProps {
  channels: ContactChannel[];
  onChange: (updatedChannels: ContactChannel[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminChannelsManager: React.FC<AdminChannelsManagerProps> = ({
  channels = [],
  onChange,
  onShowToast,
}) => {
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);

  // Form inputs
  const [formData, setFormData] = useState<{
    type: ChannelType;
    title: string;
    value: string;
    isActive: boolean;
  }>({
    type: 'whatsapp',
    title: 'واتساب الحجوزات السريعة',
    value: '',
    isActive: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Drag & drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Open modal for new channel
  const handleOpenAdd = () => {
    setEditingChannelId(null);
    setFormData({
      type: 'whatsapp',
      title: CHANNEL_METAS.whatsapp.defaultTitle,
      value: '',
      isActive: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing channel
  const handleOpenEdit = (ch: ContactChannel) => {
    setEditingChannelId(ch.id);
    setFormData({
      type: ch.type,
      title: ch.title,
      value: ch.value,
      isActive: ch.isActive,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Type Change in Form
  const handleTypeChange = (newType: ChannelType) => {
    const meta = CHANNEL_METAS[newType];
    setFormData(prev => ({
      ...prev,
      type: newType,
      // If user hasn't modified title or it was default of another type, suggest new default
      title: (!prev.title || Object.values(CHANNEL_METAS).some(m => m.defaultTitle === prev.title))
        ? meta.defaultTitle
        : prev.title,
    }));
    // Revalidate if value exists
    if (formData.value) {
      setFormError(validateChannelValue(newType, formData.value));
    } else {
      setFormError(null);
    }
  };

  // Save Channel (Add or Update)
  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setFormError('يرجى كتابة تسمية أو عنوان للقناة');
      return;
    }

    const valError = validateChannelValue(formData.type, formData.value);
    if (valError) {
      setFormError(valError);
      return;
    }

    if (editingChannelId) {
      // Update existing
      const updated = channels.map(ch => {
        if (ch.id === editingChannelId) {
          return {
            ...ch,
            type: formData.type,
            title: formData.title.trim(),
            value: formData.value.trim(),
            isActive: formData.isActive,
          };
        }
        return ch;
      });
      onChange(updated);
      onShowToast('تم تعديل بيانات قناة التواصل بنجاح', 'success');
    } else {
      // Add new
      const newChannel: ContactChannel = {
        id: `ch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: formData.type,
        title: formData.title.trim(),
        value: formData.value.trim(),
        isActive: formData.isActive,
        order: channels.length,
      };
      onChange([...channels, newChannel]);
      onShowToast('تمت إضافة قناة التواصل الجديدة بنجاح', 'success');
    }

    setIsModalOpen(false);
  };

  // Delete Channel
  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من حذف قناة "${title}" نهائياً؟`)) {
      const filtered = channels
        .filter(c => c.id !== id)
        .map((c, idx) => ({ ...c, order: idx }));
      onChange(filtered);
      onShowToast('تم حذف القناة من قائمة التواصل', 'info');
    }
  };

  // Toggle active / inactive
  const handleToggleActive = (id: string) => {
    const updated = channels.map(ch => {
      if (ch.id === id) {
        return { ...ch, isActive: !ch.isActive };
      }
      return ch;
    });
    onChange(updated);
  };

  // Move Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newArr = [...channels];
    const temp = newArr[index - 1];
    newArr[index - 1] = newArr[index];
    newArr[index] = temp;
    // Recalculate order property
    const reordered = newArr.map((item, idx) => ({ ...item, order: idx }));
    onChange(reordered);
  };

  // Move Down
  const handleMoveDown = (index: number) => {
    if (index >= channels.length - 1) return;
    const newArr = [...channels];
    const temp = newArr[index + 1];
    newArr[index + 1] = newArr[index];
    newArr[index] = temp;
    // Recalculate order property
    const reordered = newArr.map((item, idx) => ({ ...item, order: idx }));
    onChange(reordered);
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newArr = [...channels];
    const [draggedItem] = newArr.splice(draggedIndex, 1);
    newArr.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    const reordered = newArr.map((item, idx) => ({ ...item, order: idx }));
    onChange(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const activeCount = channels.filter(c => c.isActive).length;

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#B38A34]" />
            <h3 className="text-base sm:text-lg font-cairo font-bold text-stone-900">
              قنوات التواصل ومنصات التواصل الاجتماعي
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#C9A24B]/15 text-[#B38A34] font-mono border border-[#C9A24B]/30 font-bold">
              {activeCount} مفعّلة من {channels.length}
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            أضف ورتّب قنوات الاتصال (واتساب، هاتف، إيميل، فيسبوك، إنستجرام، تيك توك). تنعكس تلقائياً في صفحة تواصل معنا، الفوتر، وزر الواتساب العائم.
          </p>
        </div>

        <button
          id="add-new-channel-btn"
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBE72] to-[#C9A24B] hover:from-[#C9A24B] hover:to-[#B38A34] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة قناة تواصل جديدة</span>
        </button>
      </div>

      {/* Channels List */}
      {channels.length === 0 ? (
        <div className="p-8 rounded-2xl bg-stone-50 border border-dashed border-stone-300 text-center">
          <Share2 className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <p className="text-sm text-stone-800 font-bold mb-1">لا توجد قنوات تواصل مضافة حتى الآن</p>
          <p className="text-xs text-stone-500 mb-4">انقر على زر "إضافة قناة تواصل جديدة" لإضافة أول قناة كـ واتساب أو هاتف.</p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-[#C9A24B] text-white font-bold text-xs"
          >
            + إضافة قناة الآن
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {channels.map((ch, index) => {
            const meta = CHANNEL_METAS[ch.type] || CHANNEL_METAS.custom;
            const testHref = getChannelHref(ch);

            return (
              <div
                key={ch.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 select-none ${
                  draggedIndex === index
                    ? 'opacity-50 border-[#C9A24B] bg-stone-100'
                    : ch.isActive
                    ? 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
                    : 'bg-stone-50 border-stone-200 opacity-60'
                }`}
              >
                {/* Right: Drag Handle & Order Arrows & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Drag Handle */}
                  <div 
                    title="اسحب لإعادة الترتيب" 
                    className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 hidden sm:block p-1"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Order Up / Down Arrows */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title="تحريك لأعلى"
                      className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-25 disabled:hover:bg-stone-100 transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === channels.length - 1}
                      title="تحريك لأسفل"
                      className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-25 disabled:hover:bg-stone-100 transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Icon & Platform Badge */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    ch.isActive ? 'bg-[#FAF8F5] border-[#E8E2D8] text-[#B38A34]' : 'bg-stone-100 border-stone-200 text-stone-400'
                  }`}>
                    <ChannelIcon type={ch.type} className="w-5 h-5" />
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-cairo font-bold text-sm text-stone-900 truncate">
                        {ch.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200 font-semibold">
                        {meta.label.split(' ')[0]}
                      </span>
                      {index === 0 && ch.type === 'whatsapp' && ch.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          رقم الواتساب الرئيسي للزر العائم
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 font-mono dir-ltr text-right truncate mt-0.5">
                      {ch.value}
                    </p>
                  </div>
                </div>

                {/* Left: Actions (Toggle, Test Link, Edit, Delete) */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Test Link Button */}
                  {testHref && testHref !== '#' && (
                    <a
                      href={testHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="تجربة القناة وفتح الرابط"
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Active / Inactive Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(ch.id)}
                    title={ch.isActive ? 'القناة مفعّلة وظاهرة للزوار - انقر للإخفاء' : 'القناة مخفية - انقر للتفعيل'}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      ch.isActive
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-stone-100 border-stone-200 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    {ch.isActive ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">مفعّلة</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">مخفية</span>
                      </>
                    )}
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(ch)}
                    title="تعديل بيانات القناة"
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(ch.id, ch.title)}
                    title="حذف القناة"
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Channel Modal */}
      {isModalOpen && (
        <div 
          id="admin-channel-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                  <ChannelIcon type={formData.type} className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-cairo font-bold text-lg text-stone-900">
                    {editingChannelId ? 'تعديل قناة تواصل' : 'إضافة قناة تواصل جديدة'}
                  </h4>
                  <p className="text-xs text-stone-500">
                    أدخل بيانات القناة وتحقق من صحة الرقم أو الرابط
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChannel} className="space-y-4">
              {/* Type Select */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  نوع قناة التواصل *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value as ChannelType)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors"
                >
                  <option value="whatsapp">واتساب (WhatsApp) - محادثة فورية وحجوزات</option>
                  <option value="phone">رقم هاتف عادي (Phone) - اتصال صوتي</option>
                  <option value="email">بريد إلكتروني (Email) - مراسلات رسمية</option>
                  <option value="instagram">إنستجرام (Instagram)</option>
                  <option value="facebook">فيسبوك (Facebook)</option>
                  <option value="tiktok">تيك توك (TikTok)</option>
                  <option value="custom">رابط مخصص آخر (موقع ويب / تيليجرام / منصة)</option>
                </select>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  عنوان / تسمية القناة (يظهر للمستخدمين) *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="مثال: واتساب الحجوزات السريعة، خدمة عملاء مكة"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              {/* Value Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  {formData.type === 'whatsapp' || formData.type === 'phone'
                    ? 'رقم الهاتف *'
                    : formData.type === 'email'
                    ? 'عنوان البريد الإلكتروني *'
                    : 'الرابط أو اسم المستخدم *'}
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, value: val }));
                    if (val) {
                      setFormError(validateChannelValue(formData.type, val));
                    } else {
                      setFormError(null);
                    }
                  }}
                  placeholder={CHANNEL_METAS[formData.type]?.placeholder || ''}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm font-mono focus:border-[#C9A24B] focus:bg-white focus:outline-none transition-colors dir-ltr text-right"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  {CHANNEL_METAS[formData.type]?.helperText}
                </span>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">حالة ظهور القناة</span>
                  <span className="text-[11px] text-stone-500">
                    تفعيل أو إخفاء القناة من الموقع فوراً
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isActive ? 'bg-[#C9A24B]' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.isActive ? 'translate-x-0' : '-translate-x-5'
                    }`}
                  />
                </button>
              </div>

              {/* Validation Error Banner */}
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button
                  id="save-channel-submit-btn"
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingChannelId ? 'حفظ التعديلات' : 'إضافة القناة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
