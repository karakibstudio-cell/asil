import React, { useState, useEffect, useMemo } from 'react';
import { 
  RoomBooking, 
  BookingStatus, 
  SiteSettings 
} from '../types';
import { 
  getBookingsFromDb, 
  updateBookingStatus, 
  deleteBookingFromDb, 
  buildGuestWhatsAppShareLink 
} from '../services/bookingService';
import { 
  Search, 
  Key, 
  Calendar, 
  User, 
  Phone, 
  Utensils, 
  BedDouble, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  ExternalLink,
  Building2,
  DollarSign,
  Filter,
  Check,
  X,
  Edit3,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Copy
} from 'lucide-react';

interface AdminBookingsManagerProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  siteSettings?: SiteSettings;
}

export const AdminBookingsManager: React.FC<AdminBookingsManagerProps> = ({
  onShowToast,
  siteSettings
}) => {
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');

  // Edit / Status Modal State
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
  const [editBookingCode, setEditBookingCode] = useState('');
  const [editDigitalKey, setEditDigitalKey] = useState('');
  const [newStatus, setNewStatus] = useState<BookingStatus>('pending');
  const [assignedRoomNumber, setAssignedRoomNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedReviewMsg, setCopiedReviewMsg] = useState(false);

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getBookingsFromDb();
      setBookings(data);
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء تحميل الحجوزات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        b.guestName.toLowerCase().includes(q) ||
        b.guestPhone.includes(q) ||
        b.bookingCode.toLowerCase().includes(q) ||
        (b.digitalKey && b.digitalKey.toLowerCase().includes(q)) ||
        b.hotelName.toLowerCase().includes(q) ||
        b.roomName.toLowerCase().includes(q);

      return matchesStatus && matchesQuery;
    });
  }, [bookings, statusFilter, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length;
    const totalRevenue = bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return { total, pending, confirmed, totalRevenue };
  }, [bookings]);

  // Open Edit Modal
  const handleOpenEdit = (b: RoomBooking) => {
    setSelectedBooking(b);
    setEditBookingCode(b.bookingCode || '');
    setEditDigitalKey(b.digitalKey || '');
    setNewStatus(b.status);
    setAssignedRoomNumber(b.assignedRoomNumber || '');
    setAdminNotes(b.adminNotes || '');
  };

  // Save Status & Room Number
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setIsUpdating(true);
    try {
      const finalCode = editBookingCode.trim().toUpperCase() || selectedBooking.bookingCode;
      const finalDigitalKey = editDigitalKey.trim().toUpperCase();
      const finalRoomNumber = newStatus === 'checked_in' 
        ? (assignedRoomNumber.trim() || undefined)
        : (selectedBooking.assignedRoomNumber || undefined);

      await updateBookingStatus(
        selectedBooking.id,
        newStatus,
        finalRoomNumber,
        adminNotes.trim() || undefined,
        finalCode,
        finalDigitalKey
      );

      setBookings(prev => prev.map(b => {
        if (b.id === selectedBooking.id) {
          return {
            ...b,
            bookingCode: finalCode,
            digitalKey: finalDigitalKey,
            status: newStatus,
            assignedRoomNumber: finalRoomNumber,
            adminNotes: adminNotes.trim() || undefined
          };
        }
        return b;
      }));

      onShowToast(`تم حفظ وتحديث الحجز #${finalCode} بنجاح`, 'success');
      setSelectedBooking(null);
    } catch (err) {
      console.error(err);
      onShowToast('فشل تحديث الحجز', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Booking
  const handleDeleteBooking = async (id: string) => {
    try {
      await deleteBookingFromDb(id);
      setBookings(prev => prev.filter(b => b.id !== id));
      onShowToast('تم حذف الحجز بنجاح');
      setDeletingId(null);
    } catch (err) {
      console.error(err);
      onShowToast('فشل حذف الحجز', 'error');
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            مؤكد ✓
          </span>
        );
      case 'checked_in':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            تم التسكين (مستلم)
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
            مكتمل
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            ملغى
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
            جديد (بانتظار التأكيد)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Refresh Bar */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cairo text-stone-900">سجل وإدارة حجوزات الغرف</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                إدارة طلبات الحجز المباشرة، تعيين أرقام الغرف، التحكم في المفاتيح الرقمية، والتواصل مع النزلاء.
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={fetchBookings}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث السجل</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-bold block">إجمالي الحجوزات</span>
          <span className="text-2xl font-black text-stone-900 font-cairo mt-1 block">{kpis.total}</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs">
          <span className="text-[11px] text-amber-800 font-bold block">بانتظار التأكيد الفوري</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-amber-900 font-cairo">{kpis.pending}</span>
            {kpis.pending > 0 && (
              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                تحتاج إجراء
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs">
          <span className="text-[11px] text-emerald-800 font-bold block">حجوزات مؤكدة ومسكنة</span>
          <span className="text-2xl font-black text-emerald-900 font-cairo mt-1 block">{kpis.confirmed}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-bold block">إجمالي الإيرادات المسجلة</span>
          <span className="text-2xl font-black text-[#B38A34] font-cairo mt-1 block">
            {kpis.totalRevenue.toLocaleString()} ر.س
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم النزيل، الهاتف، كود الحجز أو المفتاح..."
            className="w-full px-3.5 py-2 pr-9 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute top-2.5 right-3 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0">
          {(['all', 'pending', 'confirmed', 'checked_in', 'completed', 'cancelled'] as const).map((st) => {
            const labels: Record<string, string> = {
              all: 'الكل',
              pending: 'قيد الانتظار',
              confirmed: 'مؤكد',
              checked_in: 'تم التسكين',
              completed: 'مكتمل',
              cancelled: 'ملغى'
            };
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected 
                    ? 'bg-[#C9A24B] text-white shadow-xs' 
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                {labels[st]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bookings Table / Cards */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#C9A24B] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-500">جاري تحميل سجل الحجوزات...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">لا توجد حجوزات مطابقة</h3>
            <p className="text-xs text-stone-500">لم يتم العثور على أي حجز مطابق لمعايير البحث أو التصفية الحالية.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                <tr>
                  <th className="p-3.5">كود الحجز & المفتاح</th>
                  <th className="p-3.5">النزيل والتواصل</th>
                  <th className="p-3.5">الفندق والغرفة</th>
                  <th className="p-3.5">الوجبات والنزلاء</th>
                  <th className="p-3.5">التواريخ والليالي</th>
                  <th className="p-3.5">المبلغ الإجمالي</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-stone-700">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="p-3.5">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-stone-400 font-bold">طلب:</span>
                          <strong className="text-stone-900 font-mono text-xs">{b.bookingCode}</strong>
                        </div>
                        {b.digitalKey ? (
                          <span className="text-[11px] text-emerald-700 font-mono flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                            <Key className="w-3 h-3 text-emerald-600" />
                            <span>تأكيد: {b.digitalKey}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/70 w-fit flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            <span>بانتظار تحديد المشرف</span>
                          </span>
                        )}
                        {b.assignedRoomNumber && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded w-fit">
                            غرفة #{b.assignedRoomNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-900">{b.guestName}</span>
                        <a 
                          href={`tel:${b.guestPhone}`} 
                          dir="ltr" 
                          className="text-[11px] text-stone-500 hover:text-[#B38A34] text-right"
                        >
                          {b.guestPhone}
                        </a>
                      </div>
                    </td>

                    <td className="p-3.5 max-w-[200px]">
                      <div className="flex flex-col">
                        <span className="text-stone-900 font-bold truncate">{b.hotelName}</span>
                        <span className="text-[11px] text-stone-500 truncate">{b.roomName}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-col">
                        <span className="text-amber-800 font-medium text-[11px]">{b.mealPlanName}</span>
                        <span className="text-[10px] text-stone-400">
                          {b.adults} بالغين {b.children > 0 ? `+ ${b.children} أطفال` : ''} • {b.roomsCount} غرفة
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-col text-[11px]">
                        <span>{b.checkIn} ➔ {b.checkOut}</span>
                        <span className="text-[10px] text-stone-400 font-bold">{b.nights} {b.nights === 1 ? 'ليلة' : 'ليالٍ'}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <strong className="text-stone-900 text-sm font-bold">
                        {b.totalAmount.toLocaleString()} ر.س
                      </strong>
                    </td>

                    <td className="p-3.5">
                      {getStatusBadge(b.status)}
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Status / Room Button */}
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                          title="تعديل الحالة وتعيين الغرفة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Contact Guest Button */}
                        <a
                          href={`https://wa.me/${b.guestPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            b.digitalKey
                              ? `مرحباً بك يا أ. ${b.guestName}، معك إدارة فندق ${b.hotelName} بخصوص حجزك رقم #${b.bookingCode}. نود إفادتك بأن حجزك مؤكد بنجاح، ورقم التأكيد والمفتاح الرقمي المعتمد هو: ${b.digitalKey}. أهلاً ومرحباً بك ضيفاً عزيزاً!`
                              : `مرحباً بك يا أ. ${b.guestName}، معك إدارة فندق ${b.hotelName} بخصوص طلب حجزك رقم #${b.bookingCode}. نود إفادتك بأن طلبكم قيد المراجعة والاعتماد لدى المشرف، وسيتم تزويدك برقم التأكيد والمفتاح الرقمي فور اعتماده.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          title="محادثة العميل عبر الواتساب"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeletingId(b.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                          title="حذف الحجز"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Status & Room Modal */}
      {selectedBooking && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedBooking(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 font-cairo flex items-center gap-2">
                  <span>إدارة حجز #{editBookingCode || selectedBooking.bookingCode}</span>
                </h3>
                <p className="text-xs text-stone-500">{selectedBooking.guestName} • {selectedBooking.hotelName}</p>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              {/* Booking Code & Reference */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  رقم / كود الحجز (الذي يستلم ويراجع به النزيل)
                </label>
                <input 
                  type="text"
                  value={editBookingCode}
                  onChange={(e) => setEditBookingCode(e.target.value)}
                  placeholder="مثال: PRS-8492"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  حالة الحجز
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => {
                    const status = e.target.value as BookingStatus;
                    setNewStatus(status);
                    // إذا تم اختيار تأكيد الحجز وكان كود التأكيد فارغاً، اقترح كود تأكيد تلقائي للمشرف
                    if ((status === 'confirmed' || status === 'checked_in') && !editDigitalKey) {
                      const num = Math.floor(1000 + Math.random() * 9000);
                      setEditDigitalKey(`CONF-${num}`);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                >
                  <option value="pending">قيد الانتظار (غير مؤكد)</option>
                  <option value="confirmed">تأكيد الحجز (مؤكد)</option>
                  <option value="checked_in">تم التسكين واستلام الغرفة (وقت الوصول)</option>
                  <option value="completed">غادر الفندق (مكتمل المغادرة)</option>
                  <option value="cancelled">إلغاء الحجز</option>
                </select>
              </div>

              {/* Digital Confirmation Key / Confirmation Code (Supervisor Controlled) */}
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#B38A34]" />
                    <span>رقم تأكيد الحجز / المفتاح الرقمي المعتمد</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const num = Math.floor(1000 + Math.random() * 9000);
                      setEditDigitalKey(`CONF-${num}`);
                    }}
                    className="text-[10px] text-[#B38A34] hover:text-[#98752B] font-bold bg-[#C9A24B]/15 hover:bg-[#C9A24B]/25 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                  >
                    ⚡ توليد كود تأكيد
                  </button>
                </div>
                <input 
                  type="text"
                  value={editDigitalKey}
                  onChange={(e) => setEditDigitalKey(e.target.value)}
                  placeholder="مثال: CONF-8492 أو KEY-304"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-[#C9A24B]"
                />
                <p className="text-[10px] text-stone-500 leading-normal">
                  🔒 <strong className="text-stone-700">تحكم المشرف:</strong> هذا الرقم لا يظهر للعميل في تفاصيل الحجز أو رسائل التأكيد إلا بعد أن تحدده وتعتمد الحجز هنا.
                </p>
              </div>

              {/* Room Assignment - Strictly restricted to Arrival / Check-in */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>رقم الغرفة المسكّنة بالفندق</span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    {newStatus === 'checked_in' ? 'متاح للتسكين الآن' : 'مغلق حتى وصول النزيل'}
                  </span>
                </label>
                <input 
                  type="text"
                  disabled={newStatus !== 'checked_in'}
                  value={assignedRoomNumber}
                  onChange={(e) => setAssignedRoomNumber(e.target.value)}
                  placeholder={newStatus === 'checked_in' ? 'مثال: 304 أو جناح-201' : 'يتم التعيين فقط عند اختيار "تم التسكين"'}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                    newStatus === 'checked_in'
                      ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950 focus:border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                />
                {newStatus !== 'checked_in' ? (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200/70 mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>تنبيه: لا يتم إضافة وتعيين رقم الغرفة إلا وقت الوصول واختيار حالة "تم التسكين واستلام الغرفة".</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200/70 mt-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>النزيل متواجد بالاستقبال (وقت الوصول) - يرجى كتابة وتأكيد رقم الغرفة المسكّنة.</span>
                  </p>
                )}
              </div>

              {/* Notes Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ملاحظات إدارية داخلية (تظهر للنزيل أيضاً بالإيصال)
                </label>
                <textarea 
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="مثال: يرجى تحديد وقت الوصول المتوقع وطريقة الدفع..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] resize-none"
                />

                {/* Notes Helper Chips when unconfirmed/pending */}
                {newStatus === 'pending' && (
                  <div className="pt-1.5">
                    <span className="text-[10px] text-stone-500 block mb-1 font-bold">قوالب سريعة للملاحظات:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAdminNotes(prev => (prev ? prev + ' • ' : '') + 'يرجى تأكيد موعد وصولكم المتوقع لتجهيز الغرفة والمفتاح الرقمي.')}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#C9A24B]/15 text-stone-700 hover:text-[#98752B] text-[10px] font-bold border border-stone-200 cursor-pointer transition-colors"
                      >
                        🕒 + تحديد وقت الوصول المتوقع
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminNotes(prev => (prev ? prev + ' • ' : '') + 'طريقة الدفع المتاحة: نقداً أو مدى / فيزا عند الوصول بالاستقبال.')}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#C9A24B]/15 text-stone-700 hover:text-[#98752B] text-[10px] font-bold border border-stone-200 cursor-pointer transition-colors"
                      >
                        💳 + تحديد طرق الدفع
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Ready-made Thank You, Review & Feedback Card for Confirmed, Checked-in or Completed */}
              {(newStatus === 'confirmed' || newStatus === 'checked_in' || newStatus === 'completed') && (() => {
                const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://prestige-hotels.com';
                const thankYouText = `أهلاً بك أستاذ/ة ${selectedBooking.guestName}،
نشكركم لاختياركم ${selectedBooking.hotelName}. ونتمنى لكم إقامة سعيدة ومباركة.
يسعدنا مشاركتكم تقييمكم وتجربتكم معنا عبر الرابط التالي:
${siteOrigin}/#/about
وفي حال واجهتكم أي مشكلة أو ملاحظة نرجو إبلاغنا بها فوراً لخدمتكم وراحتكم على مدار الساعة.`;

                const cleanPhone = selectedBooking.guestPhone.replace(/[^0-9]/g, '');
                const waPhone = cleanPhone.startsWith('05') ? '966' + cleanPhone.slice(1) : cleanPhone;

                return (
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#B38A34]" />
                        <span>رسالة شكر على الإقامة ورابط التقييم (واتساب جاهز):</span>
                      </span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-amber-200 font-bold text-[#B38A34]">
                        جاهزة للإرسال
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/90 border border-amber-100 text-stone-700 text-[11px] leading-relaxed whitespace-pre-line font-sans">
                      {thankYouText}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://wa.me/${waPhone}?text=${encodeURIComponent(thankYouText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>إرسال الرسالة عبر الواتساب</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(thankYouText);
                          setCopiedReviewMsg(true);
                          setTimeout(() => setCopiedReviewMsg(false), 2000);
                          onShowToast('تم نسخ رسالة الشكر والتقييم بنجاح', 'success');
                        }}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedReviewMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedReviewMsg ? 'تم النسخ' : 'نسخ الرسالة'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isUpdating ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 font-cairo">هل أنت متأكد من حذف هذا الحجز نهائياً؟</h3>
            <p className="text-xs text-stone-500">سيتم حذف بيانات الحجز والمفتاح الرقمي من سجل المنظومة.</p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                تراجع
              </button>
              <button
                onClick={() => handleDeleteBooking(deletingId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
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
