import React, { useState, useRef } from 'react';
import { useLiveContent } from '../context/LiveContentContext';
import { 
  Edit3, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowUpRight, 
  Eye, 
  Upload, 
  Type, 
  X, 
  Check, 
  Search, 
  HelpCircle
} from 'lucide-react';
import { ActivePage } from '../types';
import { optimizeImageFile } from '../utils/imageOptimizer';

interface EditModeFloatingBarProps {
  currentPage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Master catalogue of main headlines across the site for quick editing
const MAIN_HEADINGS_CATALOGUE = [
  {
    key: 'header.brand.title',
    page: 'عام (الهيدر)',
    label: 'اسم المنصة في شريط الترويسة',
    fallback: 'برستيج لإدارة وتشغيل الفنادق'
  },
  {
    key: 'header.brand.subtitle',
    page: 'عام (الهيدر)',
    label: 'الوصف الفرعي بالترويسة',
    fallback: 'تسكين وفنادق مكة والمدينة'
  },
  {
    key: 'hero.slide.default_slide_1.title',
    page: 'الرئيسية (الهيرو)',
    label: 'العنوان الرئيسي الأول في سلايدر الهيرو',
    fallback: 'تسكين في أرقى فنادق مكة المكرمة والمدينة المنورة'
  },
  {
    key: 'hero.slide.default_slide_1.subtitle',
    page: 'الرئيسية (الهيرو)',
    label: 'النص التعريفي في سلايدر الهيرو',
    fallback: 'نوفر لضيوف الرحمن وشركات السياحة أفضل خيارات الإقامة في فنادق الصف الأول المقابلة للحرم المكي والمسجد النبوي.'
  },
  {
    key: 'home.featuredCarousel.title',
    page: 'الرئيسية',
    label: 'عنوان بار الفنادق الموصى بها',
    fallback: 'أبرز الفنادق الموصى بها في الحرمين'
  },
  {
    key: 'home.hotels.title',
    page: 'الرئيسية',
    label: 'عنوان قسم الفنادق المميزة',
    fallback: 'فنادقنا المميزة في مكة والمدينة'
  },
  {
    key: 'home.hotels.subtitle',
    page: 'الرئيسية',
    label: 'وصف قسم الفنادق المميزة',
    fallback: 'مجموعة مختارة بعناية من أفخم الفنادق المطلة على الكعبة المشرفة وساحات المسجد النبوي، تضمن لكم راحة لا تضاهى.'
  },
  {
    key: 'home.accordion.title',
    page: 'الرئيسية',
    label: 'عنوان تصنيف الفنادق حسب الأحياء',
    fallback: 'فنادقنا حسب المدينة والأحياء'
  },
  {
    key: 'home.offers.title',
    page: 'الرئيسية',
    label: 'عنوان بار العروض الحصرية',
    fallback: 'تصفح أحدث تصاميم وبوسترات عروض المواسم والمناسبات'
  },
  {
    key: 'home.testimonials.title',
    page: 'الرئيسية',
    label: 'عنوان آراء وتجارب الزوار',
    fallback: 'آراء وتجارب ضيوف الرحمن'
  },
  {
    key: 'hotels.header.title',
    page: 'صفحة الفنادق',
    label: 'العنوان الرئيسي لصفحة الفنادق',
    fallback: 'دليل فنادق الحرمين الشريفين'
  },
  {
    key: 'hotels.header.subtitle',
    page: 'صفحة الفنادق',
    label: 'الوصف الفرعي لصفحة الفنادق',
    fallback: 'تصفح نخبة من أرقى الفنادق المركزية المعتمدة لضيوف الرحمن، وصنّف عبر الفلاتر المنسدلة الذكية بكل سهولة.'
  },
  {
    key: 'offers.header.title',
    page: 'صفحة العروض',
    label: 'العنوان الرئيسي لصفحة العروض',
    fallback: 'العروض والمناسبات الخاصة'
  },
  {
    key: 'offers.header.subtitle',
    page: 'صفحة العروض',
    label: 'الوصف الفرعي لصفحة العروض',
    fallback: 'استفد من أقوى العروض الموسمية لحجوزات الحج والعمرة، مع خصومات حصرية على باقات التسكين وفنادق مكة والمدينة.'
  },
  {
    key: 'about.title',
    page: 'صفحة من نحن',
    label: 'العنوان الرئيسي لصفحة من نحن',
    fallback: 'عن شركة برستيج لإدارة وتشغيل الفنادق'
  },
  {
    key: 'about.subtitle',
    page: 'صفحة من نحن',
    label: 'الوصف الفرعي لصفحة من نحن',
    fallback: 'مسيرة تفانٍ وإتقان امتدت لأكثر من ١٥ عاماً في تيسير إقامة حجاج ومعتمري بيت الله الحرام وزوار مسجد رسول الله صلى الله عليه وسلم.'
  },
  {
    key: 'about.missionTitle',
    page: 'صفحة من نحن',
    label: 'عنوان الرسالة والأهداف',
    fallback: 'رسالتنا: التميز في إدارة وتشغيل الفنادق وخدمة الضيوف'
  },
  {
    key: 'about.office.title',
    page: 'صفحة من نحن',
    label: 'عنوان المقر الرسمي للشركة',
    fallback: 'المقر الرئيسي لشركة برستيج لإدارة وتشغيل الفنادق'
  },
  {
    key: 'contact.header.title',
    page: 'صفحة تواصل معنا',
    label: 'العنوان الرئيسي لصفحة التواصل',
    fallback: 'تواصل معنا واستفسر عن الحجوزات'
  },
  {
    key: 'footer.brand.bio',
    page: 'الفوتر',
    label: 'نبذة الشركة في أسفل الموقع',
    fallback: 'الشركة الرائدة والمتخصصة في تقديم حلول التسكين الفاخرة لحجاج بيت الله الحرام وزوار المسجد النبوي الشريف في مكة المكرمة والمدينة المنورة.'
  }
];

export const EditModeFloatingBar: React.FC<EditModeFloatingBarProps> = ({
  currentPage,
  onNavigate,
  onShowToast,
}) => {
  const { isEditMode, setIsEditMode, isAdminLoggedIn, getContentText, updateContent } = useLiveContent();
  const [isHeadingsModalOpen, setIsHeadingsModalOpen] = useState(false);
  const [headingsSearch, setHeadingsSearch] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [quickUploadLoading, setQuickUploadLoading] = useState(false);

  const quickPngInputRef = useRef<HTMLInputElement>(null);

  if (!isAdminLoggedIn) {
    return null;
  }

  // Quick PNG Upload from the floating bar
  const handleQuickPngUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      onShowToast?.('حجم الصورة يتجاوز 8 ميجابايت، يرجى اختيار ملف أصغر', 'error');
      return;
    }

    setQuickUploadLoading(true);
    try {
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      const optimized = await optimizeImageFile(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        forcePng: isPng
      });

      // Save as latest uploaded quick asset
      await updateContent('assets.last_uploaded_png', { text: optimized });
      onShowToast?.('تم رفع صورة PNG بنجاح مع الحفاظ على شفافيتها وحفظها في الموقع ✓', 'success');
    } catch (err) {
      console.error('Failed quick PNG upload:', err);
      onShowToast?.('حدث خطأ أثناء معالجة صورة PNG', 'error');
    } finally {
      setQuickUploadLoading(false);
      if (quickPngInputRef.current) quickPngInputRef.current.value = '';
    }
  };

  const handleStartEditHeading = (key: string, currentVal: string) => {
    setEditingKey(key);
    setEditingText(currentVal);
  };

  const handleSaveHeading = async (key: string) => {
    setIsSavingKey(true);
    try {
      await updateContent(key, { text: editingText });
      setEditingKey(null);
      onShowToast?.('تم حفظ العنوان بنجاح ✓', 'success');
    } catch (err) {
      console.error('Failed saving heading:', err);
      onShowToast?.('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setIsSavingKey(false);
    }
  };

  const filteredHeadings = MAIN_HEADINGS_CATALOGUE.filter(h => 
    h.label.includes(headingsSearch) || 
    h.page.includes(headingsSearch) || 
    h.fallback.includes(headingsSearch)
  );

  return (
    <>
      <aside
        aria-label="شريط وضع التحرير المباشر"
        className="fixed bottom-6 right-6 z-40 select-none pointer-events-auto flex flex-col items-end gap-2"
      >
        {/* Active notification indicator pill */}
        {isEditMode && (
          <div className="bg-gradient-to-r from-[#DFBE72] to-[#C9A24B] text-stone-950 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
            <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>وضع التحرير نشط: انقر ✏️ على أي عنوان أو نص لتعديله فوراً</span>
          </div>
        )}

        {/* Main floating control capsule */}
        <div
          id="admin-edit-mode-floating-bar"
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border shadow-2xl transition-all duration-300 ${
            isEditMode
              ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/30'
              : 'border-stone-200 hover:border-[#C9A24B]/60'
          }`}
        >
          {/* Status icon & toggle indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                isEditMode
                  ? 'bg-[#C9A24B] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-500'
              }`}
            >
              <Edit3 className="w-4 h-4" />
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-bold font-cairo text-stone-900 flex items-center gap-1.5">
                <span>وضع التحرير</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                    isEditMode
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-100 text-stone-500 border border-stone-200'
                  }`}
                >
                  {isEditMode ? 'مفعّل' : 'معطّل'}
                </span>
              </span>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isEditMode}
            onClick={() => setIsEditMode(!isEditMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
              isEditMode ? 'bg-[#C9A24B]' : 'bg-stone-300 hover:bg-stone-400'
            }`}
            title={isEditMode ? 'إيقاف وضع التحرير' : 'تشغيل وضع التحرير'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                isEditMode ? '-translate-x-6' : '-translate-x-1'
              }`}
            />
          </button>

          {/* If edit mode is active, show quick actions */}
          {isEditMode && (
            <div className="flex items-center gap-1.5 border-r border-stone-200 pr-2 mr-1">
              {/* Quick Main Headings Editor Button */}
              <button
                type="button"
                onClick={() => setIsHeadingsModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#98752B] border border-[#C9A24B]/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="استعراض وتعديل كافة العناوين والنصوص الرئيسية للموقع في قائمة واحدة"
              >
                <Type className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">العناوين الرئيسية</span>
              </button>

              {/* Quick PNG Upload Action */}
              <label
                className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-[#C9A24B] text-stone-700 hover:text-white border border-stone-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="إضافة صور PNG مع الحفاظ على شفافيتها"
              >
                <Upload className="w-3.5 h-3.5 text-[#B38A34]" />
                <span className="hidden sm:inline">إضافة PNG</span>
                <input
                  ref={quickPngInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, .png, image/*"
                  disabled={quickUploadLoading}
                  onChange={handleQuickPngUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Quick Link to Admin Panel or Public View */}
          <div className="border-r border-stone-200 pr-2 mr-1">
            {currentPage === 'admin' ? (
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-stone-600 hover:text-stone-900 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="تصفح الموقع العام"
              >
                <Eye className="w-3.5 h-3.5 text-[#B38A34]" />
                <span className="hidden sm:inline">تصفح الموقع</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="text-stone-600 hover:text-stone-900 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="الانتقال للوحة التحكم"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#B38A34]" />
                <span className="hidden sm:inline">لوحة الإدارة</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* QUICK HEADINGS & TEXTS CATALOGUE MODAL */}
      {/* ========================================================= */}
      {isHeadingsModalOpen && (
        <div
          id="headings-editor-modal"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn"
          onClick={() => setIsHeadingsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C9A24B] text-white flex items-center justify-center shadow-md">
                  <Type className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-lg text-stone-900 leading-tight">
                    إدارة وتعديل العناوين والنصوص الرئيسية للموقع
                  </h3>
                  <p className="text-xs text-stone-500">
                    يمكنك تعديل أي عنوان رئيسي أو فرعي مباشرة وحفظه فوراً في قاعدة البيانات
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHeadingsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-stone-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={headingsSearch}
                  onChange={(e) => setHeadingsSearch(e.target.value)}
                  placeholder="ابحث باسم العنوان أو الصفحة أو النص..."
                  className="w-full pr-10 pl-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* List of Headings */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
              {filteredHeadings.map((item) => {
                const currentText = getContentText(item.key, item.fallback);
                const isItemEditing = editingKey === item.key;

                return (
                  <div
                    key={item.key}
                    className={`p-4 rounded-2xl border transition-all ${
                      isItemEditing
                        ? 'bg-amber-50/50 border-[#C9A24B] ring-2 ring-[#C9A24B]/20'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                          {item.page}
                        </span>
                        <span className="font-cairo font-bold text-xs sm:text-sm text-stone-900">
                          {item.label}
                        </span>
                      </div>

                      {!isItemEditing && (
                        <button
                          type="button"
                          onClick={() => handleStartEditHeading(item.key, currentText)}
                          className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-[#C9A24B] text-stone-700 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                      )}
                    </div>

                    {isItemEditing ? (
                      <div className="space-y-2 mt-2">
                        {item.fallback.length > 60 ? (
                          <textarea
                            rows={3}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-3 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] leading-relaxed"
                          />
                        ) : (
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                          />
                        )}

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingKey(null)}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            disabled={isSavingKey}
                            onClick={() => handleSaveHeading(item.key)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isSavingKey ? 'جاري الحفظ...' : 'حفظ التعديل'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                        {currentText}
                      </p>
                    )}
                  </div>
                );
              })}

              {filteredHeadings.length === 0 && (
                <div className="text-center py-12 text-stone-400 text-xs">
                  لا توجد نتائج مطابقة لبحثك
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                💡 يمكنك أيضاً النقر مباشرة على أي نص في صفحات الموقع أثناء تفعيل وضع التحرير لتعديله.
              </span>
              <button
                type="button"
                onClick={() => setIsHeadingsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
