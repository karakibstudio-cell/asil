import React, { useState, useEffect, useMemo } from 'react';
import { 
  RoomBooking, 
  BookingStatus, 
  SiteSettings,
  AdminUser,
  AdminRole,
  Hotel
} from '../types';
import { 
  getBookingsFromDb, 
  updateBookingStatus, 
  deleteBookingFromDb, 
  buildSupervisorWhatsAppMessage,
  buildSupervisorGuestWhatsAppLink,
  buildStaffConfirmationWhatsAppLink,
  isBookingPendingExpired
} from '../services/bookingService';
import { sendBookingEmailViaAppsScript } from '../services/emailService';
import { 
  sendBookingConfirmationToCustomer, 
  buildCustomerWhatsAppConfirmationUrl 
} from '../services/bookingNotificationService';
import { getInvoiceUrl } from '../utils/routing';
import { hasPermission } from '../utils/rbac';
import { BookingVoucherModal } from './BookingVoucherModal';
import { WhatsAppTemplatesModal } from './WhatsAppTemplatesModal';
import { AdminQuickBookingModal } from './AdminQuickBookingModal';
import { GroupBookingModal } from './GroupBookingModal';
import { getSupabaseClient } from '../services/supabase';
import { 
  Search, 
  Key, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  Utensils, 
  BedDouble, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
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
  Copy,
  Printer,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  CheckSquare,
  Square,
  FileText,
  Plus,
  Zap,
  Sparkles,
  LogIn,
  LogOut,
  Home
} from 'lucide-react';

export interface AdminBookingsManagerProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  siteSettings?: SiteSettings;
  currentUser?: AdminUser | null;
  adminRoles?: AdminRole[];
  hotels?: Hotel[];
}

type DateFilterType = 'createdAt' | 'checkIn';
type SortField = 'createdAt' | 'checkIn' | 'guestName' | 'totalAmount' | 'status';
type SortDirection = 'asc' | 'desc';

const ALL_STATUSES: BookingStatus[] = ['pending_confirmation', 'pending', 'confirmed', 'checked_in', 'completed', 'cancelled'];

const STATUS_LABELS: Record<BookingStatus, { label: string; bg: string; text: string; border: string }> = {
  pending_confirmation: { label: 'بانتظار التأكيد (واتساب)', bg: 'bg-amber-100', text: 'text-amber-950 font-black', border: 'border-amber-400' },
  pending: { label: 'قيد الانتظار', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  confirmed: { label: 'مؤكد', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  checked_in: { label: 'تم التسكين', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  completed: { label: 'مكتمل (غادر)', bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' },
  cancelled: { label: 'ملغى', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
};

const triggerGlobalAutoSave = (status: 'saving' | 'saved' | 'idle') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('prestige:autosave', { detail: { status } }));
  }
};

const withAutoSave = async <T,>(fn: () => Promise<T>): Promise<T> => {
  triggerGlobalAutoSave('saving');
  try {
    const res = await fn();
    triggerGlobalAutoSave('saved');
    return res;
  } catch (err) {
    triggerGlobalAutoSave('idle');
    throw err;
  }
};

export const AdminBookingsManager: React.FC<AdminBookingsManagerProps> = ({
  onShowToast,
  siteSettings,
  currentUser = null,
  adminRoles = [],
  hotels = []
}) => {
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // RBAC Permission checks
  const canEdit = hasPermission(currentUser, adminRoles, 'bookings_log', 'edit');
  const canDelete = hasPermission(currentUser, adminRoles, 'bookings_log', 'delete');
  const canExport = hasPermission(currentUser, adminRoles, 'bookings_log', 'export');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<BookingStatus[]>([]);
  
  // Date Range Filter State
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('createdAt');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Daily Workflow Filter State (All, Today Arrivals, Today Departures, In-House)
  const [dailyWorkflowFilter, setDailyWorkflowFilter] = useState<'all' | 'today_arrivals' | 'today_departures' | 'in_house'>('all');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Quick Booking & WhatsApp Lifecycle Modals & Group Bookings
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [isGroupBookingOpen, setIsGroupBookingOpen] = useState(false);
  const [whatsAppModalBooking, setWhatsAppModalBooking] = useState<RoomBooking | null>(null);

  // Edit / Status Modal State
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
  const [editBookingCode, setEditBookingCode] = useState('');
  const [editDigitalKey, setEditDigitalKey] = useState('');
  const [newStatus, setNewStatus] = useState<BookingStatus>('pending');
  const [assignedRoomNumber, setAssignedRoomNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedReviewMsg, setCopiedReviewMsg] = useState(false);
  const [copiedSupervisorMsg, setCopiedSupervisorMsg] = useState(false);
  const [voucherBooking, setVoucherBooking] = useState<RoomBooking | null>(null);

  // Quick Inline Status Update In Progress ID
  const [quickUpdatingId, setQuickUpdatingId] = useState<string | null>(null);

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Delivery Failure Info Popover State
  const [deliveryInfoBooking, setDeliveryInfoBooking] = useState<RoomBooking | null>(null);

  // Staff Confirmation & Resend Email States
  const [staffConfirmationModal, setStaffConfirmationModal] = useState<{
    booking: RoomBooking;
    whatsappUrl: string;
  } | null>(null);
  const [isResendingEmailId, setIsResendingEmailId] = useState<string | null>(null);
  const [isConfirmingId, setIsConfirmingId] = useState<string | null>(null);

  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Today Date string in local format YYYY-MM-DD
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  // Daily Workflow Statistics (Arrivals, Departures, In-house)
  const dailyWorkflowStats = useMemo(() => {
    let todayArrivals = 0;
    let todayDepartures = 0;
    let inHouse = 0;

    bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      if (b.checkIn === todayDateStr && b.status !== 'completed') {
        todayArrivals++;
      }
      if (b.checkOut === todayDateStr) {
        todayDepartures++;
      }
      if (b.status === 'checked_in' || (b.status === 'confirmed' && b.checkIn <= todayDateStr && b.checkOut > todayDateStr)) {
        inHouse++;
      }
    });

    return { todayArrivals, todayDepartures, inHouse };
  }, [bookings, todayDateStr]);

  const fetchBookings = async (isSilent: boolean = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await getBookingsFromDb();
      setBookings(data);
    } catch (err) {
      console.error(err);
      if (!isSilent) onShowToast('حدث خطأ أثناء تحميل الحجوزات', 'error');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchBookings();

    // 1. Supabase Realtime channel subscription to 'room_bookings' table
    const sb = getSupabaseClient();
    let channel: any = null;
    if (sb) {
      try {
        channel = sb
          .channel('realtime_admin_room_bookings')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'room_bookings' },
            (payload) => {
              console.log('[Realtime] Booking update received:', payload);
              fetchBookings(true);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsLiveConnected(true);
            }
          });
      } catch (err) {
        console.warn('[Realtime] Subscription error:', err);
      }
    }

    // 2. Cross-tab & local storage event listeners
    const handleLocalBooking = () => {
      fetchBookings(true);
    };
    window.addEventListener('prestige:booking_created', handleLocalBooking);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'prestige_room_bookings') {
        fetchBookings(true);
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Heartbeat fallback polling (every 60 seconds)
    const interval = setInterval(() => {
      fetchBookings(true);
    }, 60000);

    return () => {
      if (channel && sb) {
        sb.removeChannel(channel);
      }
      window.removeEventListener('prestige:booking_created', handleLocalBooking);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Delivery validation helper
  const checkDeliveryStatus = (b: RoomBooking) => {
    const rawPhone = (b.guestPhone || '').replace(/\s+/g, '');
    const isPhoneValid = /^\+?[1-9]\d{7,14}$/.test(rawPhone);
    const isEmailValid = Boolean(b.guestEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.guestEmail.trim()));
    
    const whatsappFailed = b.whatsappDeliveryStatus === 'failed' || (!isPhoneValid && Boolean(b.guestPhone));
    const emailFailed = b.emailDeliveryStatus === 'failed' || (!isEmailValid && Boolean(b.guestEmail));

    return {
      hasFailure: whatsappFailed || emailFailed,
      whatsappFailed,
      emailFailed,
      isPhoneValid,
      isEmailValid,
      whatsappError: b.whatsappDeliveryError || (!isPhoneValid ? 'صيغة رقم الواتساب غير دولية (+)' : undefined),
      emailError: b.emailDeliveryError || (!isEmailValid ? 'عنوان البريد الإلكتروني غير صالح' : undefined)
    };
  };

  // Toggle single status in multi-select
  const handleToggleStatus = (status: BookingStatus) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  // Select all / clear all statuses
  const handleSelectAllStatuses = () => {
    setSelectedStatuses([]);
  };

  // Quick Date Range Presets
  const handleDatePreset = (preset: 'today' | 'last7' | 'thisMonth' | 'futureCheckIn' | 'all') => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
      return;
    }

    if (preset === 'today') {
      const todayStr = formatDate(today);
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === 'last7') {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      setDateFrom(formatDate(past));
      setDateTo(formatDate(today));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setDateFrom(formatDate(firstDay));
      setDateTo(formatDate(lastDay));
    } else if (preset === 'futureCheckIn') {
      setDateFilterType('checkIn');
      setDateFrom(formatDate(today));
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 3);
      setDateTo(formatDate(nextMonth));
    }
  };

  // Filtered Bookings Logic
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // 0. Daily Operations Workflow Filter (Arrivals, Departures, In-House)
      if (dailyWorkflowFilter === 'today_arrivals') {
        if (b.checkIn !== todayDateStr || b.status === 'cancelled' || b.status === 'completed') return false;
      } else if (dailyWorkflowFilter === 'today_departures') {
        if (b.checkOut !== todayDateStr || b.status === 'cancelled') return false;
      } else if (dailyWorkflowFilter === 'in_house') {
        const isInHouse = b.status === 'checked_in' || (b.status === 'confirmed' && b.checkIn <= todayDateStr && b.checkOut > todayDateStr);
        if (!isInHouse || b.status === 'cancelled') return false;
      }

      // 1. Status Multi-select Filter (empty means all)
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(b.status)) {
        return false;
      }

      // 2. Date Range Filter
      if (dateFrom || dateTo) {
        let bookingDateStr = '';
        if (dateFilterType === 'createdAt') {
          if (b.createdAt) {
            bookingDateStr = new Date(b.createdAt).toISOString().split('T')[0];
          }
        } else {
          bookingDateStr = b.checkIn || '';
        }

        if (bookingDateStr) {
          if (dateFrom && bookingDateStr < dateFrom) return false;
          if (dateTo && bookingDateStr > dateTo) return false;
        } else if (dateFrom || dateTo) {
          return false;
        }
      }

      // 3. Search Query Filter (reference number, guest name, phone, email, digital key, hotel)
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesQuery = 
          (b.bookingCode && b.bookingCode.toLowerCase().includes(q)) ||
          (b.guestName && b.guestName.toLowerCase().includes(q)) ||
          (b.guestPhone && b.guestPhone.includes(q)) ||
          (b.guestEmail && b.guestEmail.toLowerCase().includes(q)) ||
          (b.digitalKey && b.digitalKey.toLowerCase().includes(q)) ||
          (b.assignedRoomNumber && b.assignedRoomNumber.toLowerCase().includes(q)) ||
          (b.hotelName && b.hotelName.toLowerCase().includes(q)) ||
          (b.roomName && b.roomName.toLowerCase().includes(q));

        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [bookings, selectedStatuses, dateFilterType, dateFrom, dateTo, searchQuery]);

  // Sorted Bookings
  const sortedBookings = useMemo(() => {
    const list = [...filteredBookings];
    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'createdAt') {
        valA = a.createdAt || 0;
        valB = b.createdAt || 0;
      } else if (sortField === 'checkIn') {
        valA = a.checkIn || '';
        valB = b.checkIn || '';
      } else if (sortField === 'guestName') {
        valA = (a.guestName || '').toLowerCase();
        valB = (b.guestName || '').toLowerCase();
      } else if (sortField === 'totalAmount') {
        valA = a.totalAmount || 0;
        valB = b.totalAmount || 0;
      } else if (sortField === 'status') {
        valA = a.status || '';
        valB = b.status || '';
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredBookings, sortField, sortDirection]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatuses, dateFilterType, dateFrom, dateTo, pageSize]);

  // Pagination Slice
  const totalFilteredCount = sortedBookings.length;
  const totalPages = pageSize > 0 ? Math.ceil(totalFilteredCount / pageSize) : 1;
  const paginatedBookings = useMemo(() => {
    if (pageSize <= 0) return sortedBookings;
    const start = (currentPage - 1) * pageSize;
    return sortedBookings.slice(start, start + pageSize);
  }, [sortedBookings, currentPage, pageSize]);

  // Filtered Dynamic Counters by Status
  const filteredCounters = useMemo(() => {
    const total = filteredBookings.length;
    const pending = filteredBookings.filter(b => b.status === 'pending').length;
    const confirmed = filteredBookings.filter(b => b.status === 'confirmed').length;
    const checkedIn = filteredBookings.filter(b => b.status === 'checked_in').length;
    const completed = filteredBookings.filter(b => b.status === 'completed').length;
    const cancelled = filteredBookings.filter(b => b.status === 'cancelled').length;
    const revenue = filteredBookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    // Delivery failure count among filtered
    const deliveryFailures = filteredBookings.filter(b => checkDeliveryStatus(b).hasFailure).length;

    return { 
      total, 
      pending, 
      confirmed, 
      checkedIn, 
      completed, 
      cancelled, 
      revenue,
      deliveryFailures
    };
  }, [filteredBookings]);

  // Handle Sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 opacity-60" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-[#B38A34]" /> 
      : <ArrowDown className="w-3.5 h-3.5 text-[#B38A34]" />;
  };

  // Quick Inline Status Change (permission-controlled)
  const handleQuickStatusChange = async (booking: RoomBooking, status: BookingStatus) => {
    if (!canEdit) {
      onShowToast('ليس لديك صلاحية تعديل حالة الحجوزات', 'error');
      return;
    }

    setQuickUpdatingId(booking.id);
    try {
      // Auto-generate digital key if confirming and key is missing
      let keyToAssign = booking.digitalKey;
      if ((status === 'confirmed' || status === 'checked_in') && !keyToAssign) {
        const num = Math.floor(1000 + Math.random() * 9000);
        keyToAssign = `CONF-${num}`;
      }

      await withAutoSave(async () => {
        await updateBookingStatus(
          booking.id,
          status,
          booking.assignedRoomNumber,
          booking.adminNotes,
          booking.bookingCode,
          keyToAssign
        );
      });

      const updatedBooking: RoomBooking = {
        ...booking,
        status,
        digitalKey: keyToAssign || booking.digitalKey
      };

      setBookings(prev => prev.map(b => b.id === booking.id ? updatedBooking : b));

      // Automated email and WhatsApp if confirmed
      if (status === 'confirmed') {
        // 1. Dispatch confirmation email directly to the registered customer email
        sendBookingConfirmationToCustomer(updatedBooking, siteSettings).catch(() => {});
        // 2. Dispatch official PDF invoice via Apps Script
        sendBookingEmailViaAppsScript(updatedBooking, undefined, siteSettings).catch(() => {});
        // 3. Prepare 1-tap WhatsApp confirmation link
        const whatsappUrl = buildCustomerWhatsAppConfirmationUrl(updatedBooking, siteSettings);
        setStaffConfirmationModal({
          booking: updatedBooking,
          whatsappUrl
        });
        onShowToast(`تم تأكيد الحجز #${booking.bookingCode} وإرسال التفاصيل لبريد النزيل!`, 'success');
      } else {
        onShowToast(`تم تحديث حالة الحجز #${booking.bookingCode} إلى (${STATUS_LABELS[status]?.label}) بنجاح`, 'success');
      }
    } catch (err) {
      console.error(err);
      onShowToast('فشل تحديث حالة الحجز', 'error');
    } finally {
      setQuickUpdatingId(null);
    }
  };

  // 1-Tap Confirm Booking by Staff (Verifies WhatsApp code, confirms, emails PDF, generates 1-tap WhatsApp reply)
  const handleConfirmBookingByStaff = async (booking: RoomBooking) => {
    if (!canEdit) {
      onShowToast('ليس لديك صلاحية اعتماد وتأكيد الحجوزات', 'error');
      return;
    }
    setIsConfirmingId(booking.id);
    try {
      let keyToAssign = booking.digitalKey;
      if (!keyToAssign) {
        const num = Math.floor(1000 + Math.random() * 9000);
        keyToAssign = `PRS-${num}`;
      }

      await withAutoSave(async () => {
        await updateBookingStatus(
          booking.id,
          'confirmed',
          booking.assignedRoomNumber,
          booking.adminNotes,
          booking.bookingCode,
          keyToAssign
        );
      });

      const updatedBooking: RoomBooking = {
        ...booking,
        status: 'confirmed',
        digitalKey: keyToAssign
      };

      setBookings(prev => prev.map(b => b.id === booking.id ? updatedBooking : b));

      // Send to registered customer email directly via FormSubmit AJAX
      sendBookingConfirmationToCustomer(updatedBooking, siteSettings).catch(err => {
        console.warn('Customer direct email error:', err);
      });

      // Automated email dispatch via Google Apps Script with PDF attached
      sendBookingEmailViaAppsScript(updatedBooking, undefined, siteSettings).then(res => {
        if (res.success) {
          onShowToast('تم اعتماد الحجز وإرسال الفاتورة الرسمية PDF لبريد النزيل بنجاح!', 'success');
        } else {
          onShowToast(`تم اعتماد الحجز وإرسال إشعار التأكيد لبريد النزيل.`, 'success');
        }
        fetchBookings();
      }).catch(() => {
        fetchBookings();
      });

      // Prepare 1-tap WhatsApp reply with invoice URL and official greetings
      const whatsappUrl = buildCustomerWhatsAppConfirmationUrl(updatedBooking, siteSettings);
      setStaffConfirmationModal({
        booking: updatedBooking,
        whatsappUrl
      });

      onShowToast(`تم اعتماد وتأكيد الحجز #${booking.bookingCode} بنجاح!`, 'success');
    } catch (err: any) {
      console.error('Failed to confirm booking:', err);
      onShowToast('فشل تأكيد الحجز: ' + (err.message || 'خطأ غير متوقع'), 'error');
    } finally {
      setIsConfirmingId(null);
    }
  };

  // Resend Email with PDF
  const handleResendEmail = async (booking: RoomBooking) => {
    setIsResendingEmailId(booking.id);
    try {
      const res = await sendBookingEmailViaAppsScript(booking, undefined, siteSettings);
      if (res.success) {
        onShowToast(`تم إعادة إرسال الفاتورة وسند الحجز إلى ${booking.guestEmail} بنجاح!`, 'success');
      } else {
        onShowToast(`فشل إرسال البريد: ${res.error || 'تحقق من رابط وسر Apps Script'}`, 'error');
      }
      await fetchBookings();
    } catch (err: any) {
      onShowToast('تعذر إرسال البريد: ' + err.message, 'error');
    } finally {
      setIsResendingEmailId(null);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (b: RoomBooking) => {
    if (!canEdit) {
      onShowToast('ليس لديك صلاحية تعديل تفاصيل الحجز', 'error');
      return;
    }
    setSelectedBooking(b);
    setEditBookingCode(b.bookingCode || '');
    setEditDigitalKey(b.digitalKey || '');
    setNewStatus(b.status);
    setAssignedRoomNumber(b.assignedRoomNumber || '');
    setAdminNotes(b.adminNotes || '');
  };

  // Save Status & Room Number from Modal
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

      await withAutoSave(async () => {
        await updateBookingStatus(
          selectedBooking.id,
          newStatus,
          finalRoomNumber,
          adminNotes.trim() || undefined,
          finalCode,
          finalDigitalKey
        );
      });

      const updatedBooking: RoomBooking = {
        ...selectedBooking,
        bookingCode: finalCode,
        digitalKey: finalDigitalKey,
        status: newStatus,
        assignedRoomNumber: finalRoomNumber,
        adminNotes: adminNotes.trim() || undefined
      };

      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? updatedBooking : b));

      if (newStatus === 'confirmed') {
        sendBookingConfirmationToCustomer(updatedBooking, siteSettings).catch(() => {});
        sendBookingEmailViaAppsScript(updatedBooking, undefined, siteSettings).catch(() => {});
        const whatsappUrl = buildCustomerWhatsAppConfirmationUrl(updatedBooking, siteSettings);
        setStaffConfirmationModal({
          booking: updatedBooking,
          whatsappUrl
        });
        onShowToast(`تم اعتماد وتأكيد الحجز #${finalCode} وإرسال التفاصيل لبريد النزيل!`, 'success');
      } else {
        onShowToast(`تم حفظ وتحديث الحجز #${finalCode} بنجاح`, 'success');
      }

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
    if (!canDelete) {
      onShowToast('ليس لديك صلاحية حذف الحجوزات', 'error');
      return;
    }
    // 1. INSTANT 0ms OPTIMISTIC UI: Remove from list and close dialog immediately
    setBookings(prev => prev.filter(b => b.id !== id));
    setDeletingId(null);
    onShowToast('تم حذف الحجز بنجاح', 'success');

    // 2. Background sync to database
    try {
      await withAutoSave(async () => {
        await deleteBookingFromDb(id);
      });
    } catch (err) {
      console.error(err);
      onShowToast('فشل حذف الحجز من الخادم', 'error');
      fetchBookings();
    }
  };

  // CSV / Excel Export of Filtered Bookings (with UTF-8 BOM)
  const handleExportCSV = () => {
    if (!canExport) {
      onShowToast('ليس لديك صلاحية تصدير سجل الحجوزات', 'error');
      return;
    }

    if (sortedBookings.length === 0) {
      onShowToast('لا توجد حجوزات مطابقة للتصدير', 'info');
      return;
    }

    const headers = [
      'كود الحجز',
      'المفتاح الرقمي / التأكيد',
      'رقم الغرفة المسكنة',
      'اسم النزيل',
      'رقم الهاتف والواتساب',
      'البريد الإلكتروني',
      'الفندق',
      'فئة الغرفة',
      'خطة الوجبات',
      'عدد الغرف',
      'البالغين',
      'الأطفال',
      'تاريخ الوصول',
      'تاريخ المغادرة',
      'عدد الليالي',
      'المبلغ الإجمالي (ر.س)',
      'الحالة',
      'تاريخ إنشاء الحجز',
      'حالة إشعار الواتساب',
      'حالة إشعار البريد',
      'ملاحظات المشرف'
    ];

    const rows = sortedBookings.map(b => {
      const delivery = checkDeliveryStatus(b);
      const bookingDate = b.createdAt ? new Date(b.createdAt).toLocaleString('ar-SA') : '';
      return [
        `"${b.bookingCode || ''}"`,
        `"${b.digitalKey || ''}"`,
        `"${b.assignedRoomNumber || ''}"`,
        `"${(b.guestName || '').replace(/"/g, '""')}"`,
        `"${b.guestPhone || ''}"`,
        `"${b.guestEmail || ''}"`,
        `"${(b.hotelName || '').replace(/"/g, '""')}"`,
        `"${(b.roomName || '').replace(/"/g, '""')}"`,
        `"${(b.mealPlanName || '').replace(/"/g, '""')}"`,
        b.roomsCount || 1,
        b.adults || 1,
        b.children || 0,
        `"${b.checkIn || ''}"`,
        `"${b.checkOut || ''}"`,
        b.nights || 1,
        b.totalAmount || 0,
        `"${STATUS_LABELS[b.status]?.label || b.status}"`,
        `"${bookingDate}"`,
        `"${delivery.whatsappFailed ? 'تعذر التسليم' : 'سليم'}"`,
        `"${delivery.emailFailed ? 'تعذر التسليم' : 'سليم'}"`,
        `"${(b.adminNotes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    // Add UTF-8 BOM so Arabic letters render correctly in Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nowStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `prestige-bookings-log-${nowStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onShowToast(`تم تصدير ${sortedBookings.length} حجز بنجاح إلى ملف CSV`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Actions & Permission Indicators */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center font-bold shadow-2xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold font-cairo text-stone-900">سجل وإدارة حجوزات الغرف</h2>
              <span className="text-xs bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full font-bold">
                {bookings.length} إجمالي بالحافظة
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>مزامنة فورية (Realtime Live)</span>
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              فلترة متقدمة حسب التواريخ والحالات، تعيين الغرف، المفاتيح الرقمية، رصد وصول الإشعارات، وتصدير التقارير.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* + Quick Booking Button (10 Seconds) */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsQuickBookingOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/15 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="إنشاء حجز فوري جديد بالهاتف أو الاستقبال في 10 ثوانٍ مع خصم الإتاحة تلقائياً"
            >
              <Plus className="w-4 h-4" />
              <span>+ حجز سريع (10 ثوانٍ)</span>
            </button>
          )}

          {/* + Group & Bus Tours Booking Button */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsGroupBookingOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-[#B38A34] hover:from-amber-500 hover:to-[#C9A24B] text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/15 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="إنشاء حجز مجموعات وحملات وباصات متعدد الغرف مع كشف النزلاء Rooming List وفاتورة موحدة"
            >
              <Plus className="w-4 h-4" />
              <span>+ حجز مجموعة / باصات 🚌</span>
            </button>
          )}

          {/* Manual / Realtime Refresh Button */}
          <button
            type="button"
            onClick={() => {
              fetchBookings(false);
              onShowToast('تم تحديث قائمة الحجوزات لحظياً', 'info');
            }}
            className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="تحديث قائمة الحجوزات يدوياً"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#B38A34]' : 'text-stone-600'}`} />
            <span>تحديث فوري</span>
          </button>

          {/* Export Button */}
          {canExport && (
            <button
              onClick={handleExportCSV}
              disabled={loading || sortedBookings.length === 0}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="تصدير النتائج المفلترة الحالية إلى ملف Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير النتائج ({sortedBookings.length})</span>
            </button>
          )}

          {/* Refresh Button */}
          <button 
            onClick={fetchBookings}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث السجل</span>
          </button>
        </div>
      </div>

      {/* DAILY OPERATIONS WORKFLOW BAR */}
      <div className="p-3.5 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-3xl border border-stone-800 text-white shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#C9A24B]/20 border border-[#C9A24B]/40 flex items-center justify-center text-[#E0C070] shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">إدارة العمليات والتسكين اليومي</span>
              <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-mono">
                {todayDateStr}
              </span>
            </div>
            <span className="text-[10px] text-stone-400">متابعة وصول ومغادرة اليوم والنزلاء المسكنين بنقرة واحدة</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setDailyWorkflowFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              dailyWorkflowFilter === 'all'
                ? 'bg-stone-700 text-white shadow-xs'
                : 'bg-stone-800/60 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <span>جميع الحجوزات</span>
          </button>

          <button
            type="button"
            onClick={() => setDailyWorkflowFilter('today_arrivals')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              dailyWorkflowFilter === 'today_arrivals'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 ring-2 ring-emerald-400/40'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/50'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>نزلاء اليوم - وصول ({dailyWorkflowStats.todayArrivals})</span>
          </button>

          <button
            type="button"
            onClick={() => setDailyWorkflowFilter('today_departures')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              dailyWorkflowFilter === 'today_departures'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30 ring-2 ring-amber-400/40'
                : 'bg-amber-950/40 text-amber-300 border border-amber-800/40 hover:bg-amber-900/50'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>المغادرون اليوم ({dailyWorkflowStats.todayDepartures})</span>
          </button>

          <button
            type="button"
            onClick={() => setDailyWorkflowFilter('in_house')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              dailyWorkflowFilter === 'in_house'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-2 ring-blue-400/40'
                : 'bg-blue-950/40 text-blue-300 border border-blue-800/40 hover:bg-blue-900/50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>المسكّنون حالياً ({dailyWorkflowStats.inHouse})</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC COUNTERS OF FILTERED RESULTS BY STATUS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Filtered */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-bold block">إجمالي النتائج</span>
          <span className="text-2xl font-black text-stone-900 font-cairo mt-1 block">
            {filteredCounters.total}
          </span>
          <span className="text-[10px] text-stone-400 block mt-0.5">حسب الفلاتر المطبقة</span>
        </div>

        {/* Pending */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs">
          <span className="text-[11px] text-amber-800 font-bold block">قيد الانتظار</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-amber-900 font-cairo">{filteredCounters.pending}</span>
            {filteredCounters.pending > 0 && (
              <span className="text-[9px] bg-amber-200/90 text-amber-950 px-1.5 py-0.5 rounded-full font-bold">
                تحتاج إجراء
              </span>
            )}
          </div>
          <span className="text-[10px] text-amber-700 block mt-0.5">طلبات جديدة</span>
        </div>

        {/* Confirmed & Checked-in */}
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs">
          <span className="text-[11px] text-emerald-800 font-bold block">مؤكد ومسكّن</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-black text-emerald-900 font-cairo">
              {filteredCounters.confirmed + filteredCounters.checkedIn}
            </span>
            <span className="text-[10px] text-emerald-700">
              ({filteredCounters.checkedIn} مسكّن)
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 block mt-0.5">حجوزات معتمدة</span>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-600 font-bold block">مكتمل المغادرة</span>
          <span className="text-2xl font-black text-stone-800 font-cairo mt-1 block">
            {filteredCounters.completed}
          </span>
          <span className="text-[10px] text-stone-500 block mt-0.5">أنهوا إقامتهم</span>
        </div>

        {/* Cancelled */}
        <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 shadow-2xs">
          <span className="text-[11px] text-red-800 font-bold block">ملغى</span>
          <span className="text-2xl font-black text-red-900 font-cairo mt-1 block">
            {filteredCounters.cancelled}
          </span>
          <span className="text-[10px] text-red-600 block mt-0.5">حجوزات ملغية</span>
        </div>

        {/* Filtered Revenue & Delivery Alerts */}
        <div className="p-4 rounded-2xl bg-stone-900 text-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#E0C070] font-bold block">الإيراد المفلتر</span>
            {filteredCounters.deliveryFailures > 0 && (
              <span className="text-[9px] bg-red-500/90 text-white px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5" title="حجوزات بها تعذر في إرسال الواتساب أو البريد">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>{filteredCounters.deliveryFailures} إشعار</span>
              </span>
            )}
          </div>
          <span className="text-xl font-black text-white font-cairo mt-1 block truncate">
            {filteredCounters.revenue.toLocaleString()} ر.س
          </span>
          <span className="text-[10px] text-stone-400 block mt-0.5">باستثناء الملغاة</span>
        </div>
      </div>

      {/* 3. ADVANCED FILTER & SEARCH PANEL */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-4">
        {/* Row 1: Search bar + Date Mode Switcher + Clear Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الحجز المرجعي، كود المفتاح، اسم النزيل، الهاتف، البريد أو الفندق..."
              className="w-full px-4 py-2.5 pr-10 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white transition-colors"
            />
            <Search className="w-4 h-4 text-stone-400 absolute top-3 right-3.5 pointer-events-none" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute top-2.5 left-3 text-stone-400 hover:text-stone-600 p-0.5"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto text-xs font-bold">
            <span className="text-[11px] text-stone-400 hidden xl:inline">فترة سريعة:</span>
            <button
              onClick={() => handleDatePreset('all')}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                !dateFrom && !dateTo 
                  ? 'bg-stone-900 text-white border-stone-900' 
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              كل التواريخ
            </button>
            <button
              onClick={() => handleDatePreset('today')}
              className="px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 text-[11px] transition-colors cursor-pointer"
            >
              اليوم
            </button>
            <button
              onClick={() => handleDatePreset('last7')}
              className="px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 text-[11px] transition-colors cursor-pointer"
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => handleDatePreset('thisMonth')}
              className="px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 text-[11px] transition-colors cursor-pointer"
            >
              هذا الشهر
            </button>
            <button
              onClick={() => handleDatePreset('futureCheckIn')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#B38A34] border border-amber-200 text-[11px] transition-colors cursor-pointer font-bold"
            >
              🏨 وصول قادم
            </button>
          </div>
        </div>

        {/* Row 2: Date Range Switchable Inputs */}
        <div className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Switcher: Booking Date vs Check-in Date */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-700 text-xs shrink-0 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#B38A34]" />
              <span>تطبيق النطاق الزمني على:</span>
            </span>
            <div className="inline-flex rounded-xl bg-white p-1 border border-stone-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setDateFilterType('createdAt')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  dateFilterType === 'createdAt'
                    ? 'bg-[#C9A24B] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                📅 تاريخ الحجز (الطلب)
              </button>
              <button
                type="button"
                onClick={() => setDateFilterType('checkIn')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  dateFilterType === 'checkIn'
                    ? 'bg-[#C9A24B] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🏨 تاريخ الوصول (Check-in)
              </button>
            </div>
          </div>

          {/* Date from / to inputs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-[11px] text-stone-400 font-bold">من:</span>
              <input 
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs font-mono font-bold text-stone-800 bg-transparent focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-[11px] text-stone-400 font-bold">إلى:</span>
              <input 
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs font-mono font-bold text-stone-800 bg-transparent focus:outline-none"
              />
            </div>

            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 cursor-pointer transition-colors"
                title="إلغاء تصفية التواريخ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Multi-Select Status Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 border-t border-stone-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#B38A34]" />
              <span>تصفية الحالات (متعدد):</span>
            </span>

            {/* All toggle button */}
            <button
              onClick={handleSelectAllStatuses}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatuses.length === 0
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              الكل ({bookings.length})
            </button>

            {/* Individual Status Checkbox Pills */}
            {ALL_STATUSES.map(st => {
              const isSelected = selectedStatuses.includes(st);
              const count = bookings.filter(b => b.status === st).length;
              const meta = STATUS_LABELS[st];

              return (
                <button
                  key={st}
                  onClick={() => handleToggleStatus(st)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#C9A24B] text-white border-[#B38A34] shadow-xs'
                      : `${meta.bg} ${meta.text} ${meta.border} hover:opacity-90`
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 shrink-0 opacity-50" />
                  )}
                  <span>{meta.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-white/60 text-stone-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Filters Clear Button */}
          {(selectedStatuses.length > 0 || dateFrom || dateTo || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatuses([]);
                setDateFrom('');
                setDateTo('');
                setSearchQuery('');
              }}
              className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط كل الفلاتر</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. BOOKINGS TABLE */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#C9A24B] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-500">جاري تحميل سجل الحجوزات...</p>
          </div>
        ) : sortedBookings.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Calendar className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">لا توجد حجوزات مطابقة لمعايير البحث والتصفية</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              جرب تغيير التواريخ المحددة، أو إلغاء تحديد بعض الحالات، أو مسح نص البحث لإظهار النتائج.
            </p>
            {(selectedStatuses.length > 0 || dateFrom || dateTo || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedStatuses([]);
                  setDateFrom('');
                  setDateTo('');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>مسح كل الفلاتر</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-right text-xs min-w-[1050px]">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                <tr>
                  <th 
                    className="p-3.5 text-center w-28 cursor-pointer hover:text-[#B38A34]"
                    onClick={() => handleSort('createdAt')}
                    title="فرز حسب تاريخ الطلب"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span>كود الطلب</span>
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                  <th 
                    className="p-3.5 cursor-pointer hover:text-[#B38A34]"
                    onClick={() => handleSort('guestName')}
                    title="فرز حسب اسم النزيل"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>النزيل والتواصل</span>
                      {getSortIcon('guestName')}
                    </div>
                  </th>
                  <th className="p-3.5">الفندق والغرفة</th>
                  <th className="p-3.5">الوجبات والنزلاء</th>
                  <th 
                    className="p-3.5 cursor-pointer hover:text-[#B38A34]"
                    onClick={() => handleSort('checkIn')}
                    title="فرز حسب تاريخ الوصول"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>تاريخ الوصول والإقامة</span>
                      {getSortIcon('checkIn')}
                    </div>
                  </th>
                  <th 
                    className="p-3.5 cursor-pointer hover:text-[#B38A34]"
                    onClick={() => handleSort('totalAmount')}
                    title="فرز حسب المبلغ الإجمالي"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>المبلغ الإجمالي</span>
                      {getSortIcon('totalAmount')}
                    </div>
                  </th>
                  <th 
                    className="p-3.5 text-center min-w-[170px] cursor-pointer hover:text-[#B38A34]"
                    onClick={() => handleSort('status')}
                    title="فرز حسب حالة الحجز"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span>حالة الحجز (تغيير سريع)</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="p-3.5 text-center min-w-[120px]">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-stone-700">
                {paginatedBookings.map((b, bIdx) => {
                  const delivery = checkDeliveryStatus(b);
                  const isQuickUpdating = quickUpdatingId === b.id;
                  const isPending = b.status === 'pending_confirmation' || b.status === 'pending';
                  const isExpired = isBookingPendingExpired(b, siteSettings?.bookingModule?.pendingExpiryHours);

                  return (
                    <tr 
                      key={b.id || `booking-${b.bookingCode || bIdx}`} 
                      className={`hover:bg-amber-50/25 transition-colors ${
                        isPending 
                          ? (isExpired ? 'bg-stone-50 border-r-4 border-r-red-400 opacity-80' : 'bg-amber-50/50 border-r-4 border-r-amber-500') 
                          : delivery.hasFailure ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* 1. Reference Code, Confirmation Code & Expiry Badge */}
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                            <span className="text-[10px] text-stone-400 font-bold">#</span>
                            <strong className="text-stone-900 font-mono text-xs">{b.bookingCode}</strong>
                          </div>

                          {/* 4-Digit Confirmation Code */}
                          {b.confirmationCode && (
                            <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300" title="كود التأكيد المرسل للنزيل عبر الواتساب">
                              كود: {b.confirmationCode}
                            </span>
                          )}

                          {/* Pending Expiry or Status Tag */}
                          {isExpired ? (
                            <span className="text-[9px] text-red-800 bg-red-100 px-1.5 py-0.5 rounded border border-red-300 font-bold flex items-center gap-0.5 animate-pulse" title="انتهت مهلة التأكيد وتوقف حجز الغرف تلقائياً">
                              <Clock className="w-2.5 h-2.5 text-red-600" />
                              <span>منتهي الصلاحية ⏱️</span>
                            </span>
                          ) : isPending ? (
                            <span className="text-[9px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 font-bold" title="بانتظار تأكيد النزيل عبر الواتساب">
                              بانتظار التأكيد
                            </span>
                          ) : null}

                          {b.digitalKey && (
                            <span className="text-[9px] text-stone-600 font-mono flex items-center gap-1 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200" title="المفتاح الرقمي">
                              <Key className="w-2.5 h-2.5 text-stone-500" />
                              <span>{b.digitalKey}</span>
                            </span>
                          )}

                          {b.assignedRoomNumber && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
                              غرفة #{b.assignedRoomNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Guest Info & Delivery / Email Status Badges */}
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-stone-900 font-bold text-xs sm:text-sm">
                              {b.guestName}
                            </strong>
                            
                            {/* WhatsApp Delivery Failure Badge */}
                            {delivery.whatsappFailed && (
                              <button
                                type="button"
                                onClick={() => setDeliveryInfoBooking(b)}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 cursor-pointer transition-colors"
                                title="تنبيه: صيغة رقم الهاتف غير دولية أو تعذر إشعار الواتساب"
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                                <span>واتساب ⚠️</span>
                              </button>
                            )}

                            {/* Email Status & Resend Button */}
                            {b.emailStatus === 'sent' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300" title="تم تسليم الفاتورة بالبريد بنجاح">
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                                <span>إيميل مرسل</span>
                              </span>
                            )}

                            {b.emailStatus === 'queued' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-300" title="الإيميل قيد الإرسال">
                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                                <span>إيميل معلّق</span>
                              </span>
                            )}

                            {b.emailStatus === 'failed' && (
                              <div className="inline-flex items-center gap-1">
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-100 text-red-900 border border-red-300" title={b.emailError || 'فشل تسليم البريد الإلكتروني'}>
                                  <AlertCircle className="w-2.5 h-2.5 text-red-700" />
                                  <span>فشل البريد ⚠️</span>
                                </span>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => handleResendEmail(b)}
                                    disabled={isResendingEmailId === b.id}
                                    className="px-1.5 py-0.2 rounded bg-[#C9A24B]/15 hover:bg-[#C9A24B] hover:text-white text-[#9E782B] text-[9px] font-bold border border-[#C9A24B]/30 cursor-pointer transition-colors"
                                    title="إعادة إرسال الفاتورة عبر البريد الإلكتروني الآن"
                                  >
                                    {isResendingEmailId === b.id ? 'إرسال...' : 'إعادة إرسال'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-stone-500">
                            <a 
                              href={`tel:${b.guestPhone}`} 
                              dir="ltr" 
                              className="hover:text-[#B38A34] text-right font-mono flex items-center gap-0.5"
                            >
                              <Phone className="w-3 h-3 text-stone-400" />
                              <span>{b.guestPhone}</span>
                            </a>
                            {b.guestEmail && (
                              <span className="text-[10px] text-stone-400 truncate max-w-[140px]" title={b.guestEmail}>
                                • {b.guestEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Hotel and Room */}
                      <td className="p-3.5 max-w-[200px]">
                        <div className="flex flex-col">
                          <span className="text-stone-900 font-bold truncate flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-[#B38A34] shrink-0" />
                            <span>{b.hotelName}</span>
                          </span>
                          <span className="text-[11px] text-stone-500 truncate mt-0.5">
                            {b.roomName}
                          </span>
                        </div>
                      </td>

                      {/* 4. Meal Plan & Guests */}
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="text-amber-800 font-bold text-[11px] flex items-center gap-1">
                            <Utensils className="w-3 h-3" />
                            <span>{b.mealPlanName}</span>
                          </span>
                          <span className="text-[10px] text-stone-400 mt-0.5">
                            {b.adults} بالغين {b.children > 0 ? `+ ${b.children} أطفال` : ''} • {b.roomsCount} {b.roomsCount === 1 ? 'غرفة' : 'غرف'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Dates & Nights */}
                      <td className="p-3.5">
                        <div className="flex flex-col text-[11px]">
                          <span className="font-bold text-stone-900 font-mono">
                            {b.checkIn} ➔ {b.checkOut}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-stone-500 font-bold">
                              {b.nights} {b.nights === 1 ? 'ليلة' : 'ليالٍ'}
                            </span>
                            {b.createdAt && (
                              <span className="text-[9px] text-stone-400 font-mono" title="تاريخ الطلب">
                                ({new Date(b.createdAt).toLocaleDateString('ar-SA')})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 6. Total Amount */}
                      <td className="p-3.5">
                        <strong className="text-stone-900 text-sm font-bold font-mono">
                          {b.totalAmount.toLocaleString()} ر.س
                        </strong>
                      </td>

                      {/* 7. Quick Status Change & 1-Tap Confirmation */}
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {canEdit ? (
                            <div className="inline-flex items-center gap-1">
                              <select
                                value={b.status}
                                disabled={isQuickUpdating}
                                onChange={(e) => handleQuickStatusChange(b, e.target.value as BookingStatus)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none ${
                                  STATUS_LABELS[b.status]?.bg || 'bg-stone-50'
                                } ${
                                  STATUS_LABELS[b.status]?.text || 'text-stone-700'
                                } ${
                                  STATUS_LABELS[b.status]?.border || 'border-stone-200'
                                } hover:opacity-95`}
                              >
                                <option value="pending_confirmation">⚡ بانتظار التأكيد (واتساب)</option>
                                <option value="pending">⏳ قيد الانتظار</option>
                                <option value="confirmed">✓ مؤكد</option>
                                <option value="checked_in">🏨 تم التسكين</option>
                                <option value="completed">✔ مكتمل (غادر)</option>
                                <option value="cancelled">✕ ملغى</option>
                              </select>
                              {isQuickUpdating && (
                                <div className="w-3 h-3 border-2 border-[#C9A24B] border-t-transparent rounded-full animate-spin shrink-0" />
                              )}
                            </div>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block ${
                              STATUS_LABELS[b.status]?.bg
                            } ${STATUS_LABELS[b.status]?.text} ${STATUS_LABELS[b.status]?.border}`}>
                              {STATUS_LABELS[b.status]?.label}
                            </span>
                          )}

                          {/* 1-Tap Staff Confirmation Button for Pending Bookings */}
                          {canEdit && (b.status === 'pending_confirmation' || b.status === 'pending') && (
                            <button
                              type="button"
                              onClick={() => handleConfirmBookingByStaff(b)}
                              disabled={isConfirmingId === b.id}
                              className="w-full max-w-[140px] py-1 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                              title="اعتماد وتأكيد الحجز فورياً، وإرسال الفاتورة بالبريد وتجهيز رد الواتساب"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isConfirmingId === b.id ? 'جاري التأكيد...' : 'تأكيد الحجز ✓'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 8. Row Action Buttons */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* View Certified Online Invoice */}
                          <a
                            href={getInvoiceUrl(b.id, b.token)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 transition-colors"
                            title="عرض الفاتورة وسند الحجز المعتمد أونلاين"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>

                          {/* WhatsApp Official Lifecycle Templates */}
                          <button
                            type="button"
                            onClick={() => setWhatsAppModalBooking(b)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                            title="قوالب الواتساب الرسمية المعتمدة (تأكيد، عربون، دفعة، موقع، واي فاي، تقييم)"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Luxury Voucher Button */}
                          <button
                            onClick={() => setVoucherBooking(b)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#B38A34] transition-colors cursor-pointer"
                            title="عرض وطباعة سند الحجز الفندقي المعتمد (PDF)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details & Assign Room Button */}
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(b)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                              title="تعديل تفاصيل الحجز، تعيين الغرفة، المفتاح والملاحظات"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Button (RBAC controlled) */}
                          {canDelete && (
                            <button
                              onClick={() => setDeletingId(b.id)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                              title="حذف الحجز من السجل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. PAGINATION BAR */}
        {!loading && sortedBookings.length > 0 && (
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Page Size & Items Count */}
            <div className="flex items-center gap-3">
              <span className="text-stone-500 font-semibold">
                عرض {pageSize > 0 ? `${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, totalFilteredCount)}` : totalFilteredCount} من أصل <strong className="text-stone-800">{totalFilteredCount}</strong> حجز مفلتر
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-stone-400">في الصفحة:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 font-bold focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={0}>الكل</option>
                </select>
              </div>
            </div>

            {/* Prev / Next Pagination Controls */}
            {pageSize > 0 && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-lg bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 font-mono text-xs font-bold px-2 text-stone-700">
                  <span>{currentPage}</span>
                  <span className="text-stone-300">/</span>
                  <span>{totalPages}</span>
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1.5 rounded-lg bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. DELIVERY FAILURE DETAILS POPOVER / MODAL */}
      {deliveryInfoBooking && (() => {
        const delivery = checkDeliveryStatus(deliveryInfoBooking);
        const cleanPhone = (deliveryInfoBooking.guestPhone || '').replace(/[^0-9]/g, '');
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
          `السلام عليكم ورحمة الله، الأستاذ/ة ${deliveryInfoBooking.guestName} بخصوص حجزكم برقم ${deliveryInfoBooking.bookingCode} في ${deliveryInfoBooking.hotelName}.`
        )}`;
        const mailtoLink = `mailto:${deliveryInfoBooking.guestEmail}?subject=${encodeURIComponent(
          `تأكيد وتفاصيل حجزكم في ${deliveryInfoBooking.hotelName} (#${deliveryInfoBooking.bookingCode})`
        )}`;

        return (
          <div 
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeliveryInfoBooking(null);
            }}
          >
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 font-cairo">
                      حالة إرسال الإشعارات للنزيل
                    </h3>
                    <p className="text-[11px] text-stone-500 font-mono">
                      حجز #{deliveryInfoBooking.bookingCode} • {deliveryInfoBooking.guestName}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setDeliveryInfoBooking(null)}
                  className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status details */}
              <div className="space-y-3 text-xs">
                {/* WhatsApp Status */}
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-stone-900">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>إشعار الواتساب:</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      delivery.whatsappFailed ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {delivery.whatsappFailed ? 'تعذر أو صيغة غير دولية' : 'سليم'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-mono" dir="ltr">
                    {deliveryInfoBooking.guestPhone}
                  </p>
                  {delivery.whatsappError && (
                    <p className="text-[10px] text-red-700 font-bold">
                      السبب: {delivery.whatsappError}
                    </p>
                  )}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>مراسلة النزيل يدوياً عبر الواتساب</span>
                  </a>
                </div>

                {/* Email Status */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-stone-900">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>إشعار البريد الإلكتروني:</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      delivery.emailFailed ? 'bg-red-100 text-red-900' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {delivery.emailFailed ? 'تعذر الإرسال أو البريد غير صالح' : 'سليم'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-mono">
                    {deliveryInfoBooking.guestEmail || 'غير مسجل'}
                  </p>
                  {delivery.emailError && (
                    <p className="text-[10px] text-red-700 font-bold">
                      السبب: {delivery.emailError}
                    </p>
                  )}
                  {deliveryInfoBooking.guestEmail && (
                    <a
                      href={mailtoLink}
                      className="mt-1 w-full py-1.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال بريد إلكتروني مباشر للنزيل</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setDeliveryInfoBooking(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. EDIT STATUS & ROOM MODAL */}
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
                  <option value="pending">⏳ قيد الانتظار (غير مؤكد)</option>
                  <option value="confirmed">✓ تأكيد الحجز (مؤكد)</option>
                  <option value="checked_in">🏨 تم التسكين واستلام الغرفة (وقت الوصول)</option>
                  <option value="completed">✔ غادر الفندق (مكتمل المغادرة)</option>
                  <option value="cancelled">✕ إلغاء الحجز</option>
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
                  🔒 <strong className="text-stone-700">تحكم المشرف:</strong> هذا الرقم لا يظهر للعميل في تفاصيل الحجز أو رسائل التأكيد إلا بعد اعتماده هنا.
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

                {/* Notes Helper Chips */}
                <div className="pt-1.5">
                  <span className="text-[10px] text-stone-500 block mb-1 font-bold">قوالب سريعة للملاحظات:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAdminNotes(prev => (prev ? prev + ' • ' : '') + 'يرجى تأكيد موعد وصولكم المتوقع لتجهيز الغرفة والمفتاح الرقمي.')}
                      className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-[#C9A24B]/15 text-stone-700 hover:text-[#98752B] text-[10px] font-bold border border-stone-200 cursor-pointer transition-colors"
                    >
                      🕒 وقت الوصول المتوقع
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminNotes(prev => (prev ? prev + ' • ' : '') + 'طريقة الدفع: نقداً أو مدى / فيزا عند الوصول بالاستقبال بالفندق.')}
                      className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-[#C9A24B]/15 text-stone-700 hover:text-[#98752B] text-[10px] font-bold border border-stone-200 cursor-pointer transition-colors"
                    >
                      💳 الدفع بالاستقبال
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminNotes(prev => (prev ? prev + ' • ' : '') + 'يلزم إحضار أصل الهوية الوطنية أو الإقامة أو جواز السفر لجميع النزلاء.')}
                      className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-[#C9A24B]/15 text-stone-700 hover:text-[#98752B] text-[10px] font-bold border border-stone-200 cursor-pointer transition-colors"
                    >
                      🆔 أصل الهوية
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminNotes(prev => (prev ? prev + ' • ' : '') + 'تمت ترقية الغرفة وتجهيز الضيافة الخاصة تقديراً لاختياركم.')}
                      className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-[#C9A24B]/15 text-stone-700 hover:text-[#98752B] text-[10px] font-bold border border-stone-200 cursor-pointer transition-colors"
                    >
                      ✨ ترقية وضيافة
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Supervisor WhatsApp Message Preview & Direct Send */}
              {(() => {
                const supervisorMsg = buildSupervisorWhatsAppMessage(
                  selectedBooking,
                  adminNotes,
                  newStatus,
                  editDigitalKey,
                  assignedRoomNumber
                );
                const supervisorLink = buildSupervisorGuestWhatsAppLink(
                  selectedBooking,
                  adminNotes,
                  newStatus,
                  editDigitalKey,
                  assignedRoomNumber
                );

                return (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>رسالة الواتساب للنزيل (تشمل الملاحظات والكود والحالة):</span>
                      </span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-emerald-200 font-bold text-emerald-800">
                        تحديث مباشر
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/95 border border-emerald-100 text-stone-700 text-[11px] leading-relaxed whitespace-pre-line font-sans max-h-36 overflow-y-auto">
                      {supervisorMsg}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={supervisorLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>إرسال الملاحظات والتحديث للنزيل (واتساب)</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(supervisorMsg);
                          setCopiedSupervisorMsg(true);
                          setTimeout(() => setCopiedSupervisorMsg(false), 2000);
                          onShowToast('تم نسخ نص الرسالة والملاحظات بنجاح', 'success');
                        }}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedSupervisorMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSupervisorMsg ? 'تم النسخ' : 'نسخ النص'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoucherBooking({
                          ...selectedBooking,
                          status: newStatus,
                          digitalKey: editDigitalKey,
                          assignedRoomNumber: assignedRoomNumber,
                          adminNotes: adminNotes,
                          bookingCode: editBookingCode
                        })}
                        className="px-3 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="معاينة وطباعة سند الحجز PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>سند PDF</span>
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

      {/* 8. DELETE CONFIRMATION MODAL */}
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

      {/* 9. LUXURY PRINTABLE VOUCHER MODAL */}
      {voucherBooking && (
        <BookingVoucherModal
          booking={voucherBooking}
          siteSettings={siteSettings}
          onClose={() => setVoucherBooking(null)}
        />
      )}

      {/* 10. STAFF CONFIRMATION WHATSAPP POPUP (1-Tap Send Confirmation via WhatsApp) */}
      {staffConfirmationModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                تم اعتماد الحجز بنجاح ✓
              </span>
              <h3 className="text-base font-extrabold text-stone-900 font-cairo mt-2">
                حجز النزيل {staffConfirmationModal.booking.guestName}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                رقم الحجز: <strong className="font-mono text-stone-800">#{staffConfirmationModal.booking.bookingCode}</strong> • تم إرسال الفاتورة الرسمية PDF لبريد النزيل.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-right text-xs space-y-1.5">
              <span className="text-[11px] font-bold text-stone-600 block">إشعار الواتساب المباشر للنزيل:</span>
              <p className="text-[11px] text-stone-500">
                أرسل الآن رسالة الاعتماد الرسمية ورابط الفاتورة المباشر إلى رقم واتساب النزيل بنقرة واحدة:
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={staffConfirmationModal.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setStaffConfirmationModal(null)}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>إرسال التأكيد ورابط الفاتورة عبر الواتساب</span>
              </a>

              <button
                type="button"
                onClick={() => setStaffConfirmationModal(null)}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
              >
                تم الإرسال / إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. OFFICIAL WHATSAPP LIFECYCLE TEMPLATES MODAL */}
      {whatsAppModalBooking && (
        <WhatsAppTemplatesModal
          isOpen={Boolean(whatsAppModalBooking)}
          onClose={() => setWhatsAppModalBooking(null)}
          booking={whatsAppModalBooking}
          hotel={hotels.find(h => h.id === whatsAppModalBooking.hotelId || h.name === whatsAppModalBooking.hotelName)}
          siteSettings={siteSettings}
          onShowToast={onShowToast}
        />
      )}

      {/* 12. ADMIN QUICK BOOKING MODAL (10 SECONDS) */}
      {isQuickBookingOpen && (
        <AdminQuickBookingModal
          isOpen={isQuickBookingOpen}
          onClose={() => setIsQuickBookingOpen(false)}
          hotels={hotels}
          siteSettings={siteSettings}
          onBookingCreated={(newBk) => {
            setBookings(prev => [newBk, ...prev]);
            fetchBookings(true);
            onShowToast(`تم إنشاء الحجز #${newBk.bookingCode} بنجاح وخصم الإتاحة!`, 'success');
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* 13. ADMIN GROUP & BUS TOURS BOOKING MODAL */}
      {isGroupBookingOpen && (
        <GroupBookingModal
          isOpen={isGroupBookingOpen}
          onClose={() => setIsGroupBookingOpen(false)}
          hotels={hotels}
          siteSettings={siteSettings}
          isAdminMode={true}
          onBookingCreated={(newGrp) => {
            setBookings(prev => [newGrp, ...prev]);
            fetchBookings(true);
            onShowToast(`تم تثبيت حجز المجموعة #${newGrp.bookingCode} بنجاح وخصم الإتاحة!`, 'success');
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
