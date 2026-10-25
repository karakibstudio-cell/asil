import React, { useRef, useState } from 'react';
import { Hotel, RoomTypeItem, MealPlanOption, SiteSettings } from '../types';
import { generatePdfFromElement } from '../utils/pdfGenerator';
import { formatToHijriDate } from '../utils/hijriCalendar';
import { 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  X, 
  Building2, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { WhatsAppIcon } from './BookingIcons';

interface B2BQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: Hotel;
  rooms: RoomTypeItem[];
  selectedRoomsMap: Record<string, number>;
  selectedMealPlan: MealPlanOption | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  groupName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  siteSettings?: SiteSettings;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const B2BQuoteModal: React.FC<B2BQuoteModalProps> = ({
  isOpen,
  onClose,
  hotel,
  rooms,
  selectedRoomsMap,
  selectedMealPlan,
  checkIn,
  checkOut,
  nights,
  totalAmount,
  groupName = '',
  contactName = '',
  contactPhone = '',
  contactEmail = '',
  siteSettings,
  onShowToast
}) => {
  const quoteRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  // Generate unique Quote Reference
  const quoteNumber = `PQ-${Date.now().toString().slice(-6)}`;
  const issueDateHijri = formatToHijriDate(new Date().toISOString().split('T')[0]);
  const issueDateGregorian = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const checkInHijri = formatToHijriDate(checkIn);
  const checkOutHijri = formatToHijriDate(checkOut);

  // Selected rooms calculation
  const selectedRoomsList = Object.entries(selectedRoomsMap)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([rId, qty]) => {
      const room = rooms.find(r => r.id === rId);
      const pricePerNight = room?.basePrice || 350;
      const subtotal = pricePerNight * nights * Number(qty);
      return {
        room,
        qty: Number(qty),
        pricePerNight,
        subtotal
      };
    });

  const totalRoomsCount = selectedRoomsList.reduce((sum, item) => sum + item.qty, 0);

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!quoteRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const { pdf } = await generatePdfFromElement(quoteRef.current, {
        fileName: `Prestige_Quote_${quoteNumber}_${hotel.name}.pdf`
      });
      pdf.save(`Prestige_Quote_${quoteNumber}_${hotel.name}.pdf`);
      if (onShowToast) onShowToast('تم توليد وتحميل عرض السعر الرسمي PDF بنجاح ✓', 'success');
    } catch (err) {
      console.error('[PDF Error]', err);
      if (onShowToast) onShowToast('تعذر توليد ملف PDF، يرجى استخدام زر الطباعة', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print Document
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const companyPhone = (
      siteSettings?.bookingModule?.companyWhatsApp || 
      siteSettings?.channels?.find(c => c.type === 'whatsapp')?.value || 
      '+966544076726'
    ).replace(/[^0-9]/g, '');

    const message = `السلام عليكم شركة برستيج لإدارة وتشغيل الفنادق،
أرغب باعتماد عرض السعر المبدئي الصادر من الموقع الإلكتروني:
• رقم العرض المرجعي: #${quoteNumber}
• جهة الطلب / الحملة: ${groupName || contactName || 'حجز مجموعة'}
• الفندق: ${hotel.name} (${hotel.city})
• عدد الغرف: ${totalRoomsCount} غرفة (${nights} ليالٍ)
• تاريخ الوصول: ${checkIn} (${checkInHijri})
• تاريخ المغادرة: ${checkOut} (${checkOutHijri})
• باقة الوجبات: ${selectedMealPlan?.name || 'إقامة فقط'}
• الإجمالي التقديري: ${totalAmount.toLocaleString()} ر.س

أرجو التواصل لتأكيد العرض وحجز الغرف. شكراً لكم.`;

    window.open(`https://wa.me/${companyPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-stone-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Top Control Bar */}
        <div className="px-5 sm:px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cairo font-bold text-sm sm:text-base text-stone-900">
                عرض سعر رسمي معتمد للمجموعات والشركات (Proforma Quote)
              </h3>
              <span className="text-[11px] text-stone-500 font-mono">
                رقم العرض: #{quoteNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-stone-200/70 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-100 flex justify-center">
          
          {/* Printable A4 Sheet */}
          <div 
            ref={quoteRef} 
            className="w-full max-w-[794px] bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8 space-y-6 text-stone-900 font-cairo"
            dir="rtl"
          >
            {/* Header: Logo, Company Name, Official Metadata */}
            <div className="flex items-center justify-between border-b-2 border-[#C9A24B] pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DFBE72] via-[#C9A24B] to-[#98752B] p-0.5 shadow-xs">
                  <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#B38A34]" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-stone-900">
                    شركة برستيج لإدارة وتشغيل الفنادق
                  </h1>
                  <span className="text-xs text-[#B38A34] font-bold block">
                    Prestige Hotels Management & Hospitality Operations
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    مكة المكرمة - المملكة العربية السعودية | ضيافة فندقية معتمدة
                  </span>
                </div>
              </div>

              <div className="text-left text-xs space-y-1 font-mono">
                <div className="font-bold text-[#C9A24B] text-sm">عرض سعر رسمي (Quotation)</div>
                <div className="text-stone-600">رقم العرض: #{quoteNumber}</div>
                <div className="text-stone-500 text-[11px]">{issueDateHijri}</div>
                <div className="text-stone-400 text-[10px]">الموافق: {issueDateGregorian}</div>
              </div>
            </div>

            {/* Recipient & Hotel Details Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-stone-500 block">موجه إلى السادة:</span>
                <strong className="text-sm font-bold text-stone-900 block">
                  {groupName || contactName || 'السادة وكلاء السياحة ومسؤولي الحملات'}
                </strong>
                {contactName && contactName !== groupName && (
                  <div className="text-stone-600">المسؤول: {contactName}</div>
                )}
                {contactPhone && (
                  <div className="text-stone-600 font-mono dir-ltr text-right">الهاتف: {contactPhone}</div>
                )}
                {contactEmail && (
                  <div className="text-stone-600 font-mono text-[11px]">البريد: {contactEmail}</div>
                )}
              </div>

              <div className="space-y-1 sm:border-r sm:pr-4 border-stone-200">
                <span className="font-bold text-stone-500 block">بيانات الفندق المطلوب:</span>
                <strong className="text-sm font-bold text-[#C9A24B] block">{hotel.name}</strong>
                <div className="text-stone-600">المدينة: {hotel.city} - حي {hotel.district || 'المنطقة المركزية'}</div>
                <div className="text-stone-600">المسافة: {hotel.distanceText || `${hotel.distanceToHaram} م عن ساحة الحرم`}</div>
                <div className="text-stone-600">
                  فترة الإقامة: <span className="font-bold font-mono">{checkIn}</span> إلى <span className="font-bold font-mono">{checkOut}</span> ({nights} ليالٍ)
                </div>
              </div>
            </div>

            {/* Room Distribution & Pricing Table */}
            <div>
              <h4 className="text-xs font-bold text-stone-700 uppercase mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
                <span>تفاصيل توزيع الغرف والأسعار المعتمدة</span>
              </h4>
              <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#FAF8F5] text-stone-700 font-bold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">فئة الغرفة والنوع</th>
                      <th className="py-2.5 px-3 text-center">الكمية</th>
                      <th className="py-2.5 px-3 text-center">الليالي</th>
                      <th className="py-2.5 px-3 text-center">سعر الليلة</th>
                      <th className="py-2.5 px-3 text-left">الإجمالي الفرعي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedRoomsList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="py-2.5 px-3">
                          <strong className="text-stone-900 block">{item.room?.name || 'غرفة فندقية فاخرة'}</strong>
                          <span className="text-[10px] text-stone-500">
                            {item.room?.bedType || 'أسرة مفردة مريحة'} | سعة {item.room?.maxGuests || 2} نزلاء
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.qty} غرفة</td>
                        <td className="py-2.5 px-3 text-center font-mono">{nights}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{item.pricePerNight} ر.س</td>
                        <td className="py-2.5 px-3 text-left font-bold font-mono text-[#C9A24B]">
                          {item.subtotal.toLocaleString()} ر.س
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Meal Plan & Grand Total Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2">
              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs space-y-1.5">
                <strong className="text-amber-950 font-bold block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B38A34]" />
                  <span>باقة الوجبات والإعاشة المعتمدة:</span>
                </strong>
                <p className="text-stone-700">
                  {selectedMealPlan?.name || 'إقامة فقط بدون وجبات'}
                </p>
                {selectedMealPlan && selectedMealPlan.id !== 'meal_none' && (
                  <p className="text-[11px] text-stone-500">
                    تكلفة الوجبة: {Number(selectedMealPlan.price ?? selectedMealPlan.pricePerPersonPerNight ?? 0)} ر.س / فرد لليلة الواحدة
                  </p>
                )}
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-2">
                <div className="flex justify-between text-stone-600">
                  <span>إجمالي الغرف ({totalRoomsCount} غرفة):</span>
                  <span className="font-mono font-bold">{totalAmount.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>ضريبة القيمة المضافة (15%):</span>
                  <span className="text-emerald-700 font-bold">شاملة ومشمولة بالكامل ✓</span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between items-center text-sm">
                  <span className="font-extrabold text-stone-900">المبلغ الإجمالي المطلوب:</span>
                  <span className="text-base font-black text-[#C9A24B] font-mono">
                    {totalAmount.toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            </div>

            {/* Terms, Conditions & Official Signature/Stamp */}
            <div className="border-t border-stone-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-stone-500">
              <div className="space-y-0.5 text-center sm:text-right">
                <p>• هذا العرض ساري لمدة 3 أيام من تاريخ صدوره، ويخضع التسكين لتوفر الغرف النهائي عند الاعتماد.</p>
                <p>• تسجيل الوصول المعتمد: الساعة 4:00 عصراً | تسجيل المغادرة: الساعة 12:00 ظهراً.</p>
                <p>• للتأكيد الرسمي يرجى إشعار مستشار التسكين أو زيارة مكتب الإدارة في مكة المكرمة.</p>
              </div>

              {/* Official Seal Graphic */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#C9A24B] flex flex-col items-center justify-center text-center p-1 bg-amber-50/40 text-[#98752B] rotate-[-8deg] shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-[#C9A24B]" />
                  <span className="text-[9px] font-bold leading-tight mt-0.5">برستيج للفنادق</span>
                  <span className="text-[8px] font-mono leading-none">معتمد رسمي</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-5 sm:px-6 py-3.5 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500">
            يمكنك تحميل عرض السعر بصيغة PDF فورياً أو مشاركته مع فريق المبيعات عبر الواتساب.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>اعتماد عبر الواتساب</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-5 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'جاري التحميل...' : 'تحميل PDF 📄'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
