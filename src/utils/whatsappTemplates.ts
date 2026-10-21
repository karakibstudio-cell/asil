import { RoomBooking, Hotel, SiteSettings } from '../types';
import { getInvoiceUrl } from './routing';

export interface WhatsAppTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'lifecycle' | 'support';
  format: (params: WhatsAppTemplateParams) => string;
}

export interface WhatsAppTemplateParams {
  booking?: Partial<RoomBooking>;
  hotel?: Partial<Hotel>;
  depositAmount?: number;
  bankName?: string;
  iban?: string;
  receivedAmount?: number;
  remainingAmount?: number;
  checkInTime?: string;
  locationUrl?: string;
  roomNumber?: string;
  wifiNetwork?: string;
  wifiPassword?: string;
  googleReviewUrl?: string;
  siteSettings?: SiteSettings;
}

export const OFFICIAL_WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplate> = {
  // 1. قالب تأكيد الحجز الرسمي وإرسال السند
  booking_confirmation: {
    id: 'booking_confirmation',
    title: 'تأكيد الحجز الرسمي وإرسال السند',
    description: 'إرسال بيانات الحجز المؤكد مع رابط السند والفاتورة',
    icon: 'CheckCircle2',
    category: 'lifecycle',
    format: ({ booking, siteSettings }) => {
      const guestName = booking?.guestName || 'النزيل الكريم';
      const bookingCode = booking?.bookingCode || 'PRS-0000';
      const hotelName = booking?.hotelName || 'فندق برستيج';
      const roomName = booking?.roomName || 'غرفة فندقية';
      const roomsCount = booking?.roomsCount || 1;
      const checkIn = booking?.checkIn || '';
      const checkOut = booking?.checkOut || '';
      const totalAmount = booking?.totalAmount ? booking.totalAmount.toLocaleString() : '0';
      const voucherUrl = booking?.id ? getInvoiceUrl(booking.id, booking.token) : 'https://prestige-ksa.web.app';

      return [
        `السلام عليكم ورحمة الله وبركاته، أهلاً بك أستاذ ${guestName} 🌸`,
        ``,
        `يسعدنا إبلاغك بأنه تم تأكيد حجزك بنجاح لدى شركة برستيج لإدارة وتشغيل الفنادق.`,
        ``,
        `📋 تفاصيل الحجز:`,
        `• رقم الحجز: #${bookingCode}`,
        `• الفندق: ${hotelName}`,
        `• نوع الغرفة: ${roomName} (${roomsCount} غرفة)`,
        `• تاريخ الوصول: ${checkIn}`,
        `• تاريخ المغادرة: ${checkOut}`,
        `• إجمالي المبلغ: ${totalAmount} ر.س`,
        ``,
        `📄 سند الحجز والفاتورة: يمكنك استعراض وتحميل سند الحجز الإلكتروني عبر الرابط:`,
        `${voucherUrl}`,
        ``,
        `نتمنى لك إقامة ممتعة ومباركة، ويسعدنا دائماً خدمتك! ✨`
      ].join('\n');
    }
  },

  // 2. قالب طلب تحويل العربون لتثبيت الحجز
  deposit_request: {
    id: 'deposit_request',
    title: 'طلب تحويل العربون لتثبيت الحجز',
    description: 'تزويد العميل بالحساب البنكي وقيمة العربون لضمان عدم إلغاء الغرفة',
    icon: 'CreditCard',
    category: 'lifecycle',
    format: ({ booking, depositAmount, bankName, iban, siteSettings }) => {
      const guestName = booking?.guestName || 'النزيل الكريم';
      const hotelName = booking?.hotelName || 'فندق برستيج';
      const bookingCode = booking?.bookingCode || 'PRS-0000';
      const total = booking?.totalAmount || 0;
      const calculatedDeposit = depositAmount || Math.round(total * 0.3) || 300;
      const bank = bankName || 'مصرف الراجحي';
      const ibanNumber = iban || 'SA0000000000000000000000';

      return [
        `مرحباً أستاذ ${guestName}، طاب يومك بكل خير 💐`,
        ``,
        `نشكر لك اختيارك ${hotelName}. تم تسجيل طلب حجزك المبدئي برقم #${bookingCode}.`,
        ``,
        `⏳ لتثبيت الغرفة وضمان عدم إلغائها آلياً، نرجو تحويل مبلغ العربون:`,
        ``,
        `• قيمة العربون: ${calculatedDeposit.toLocaleString()} ر.س`,
        `• البنك: ${bank}`,
        `• الآيبان: ${ibanNumber}`,
        `• اسم الحساب: شركة برستيج لإدارة وتشغيل الفنادق`,
        ``,
        `📸 فضلاً تزويدنا بصورة إشعار التحويل لتأكيد الحجز فوراً وإصدار السند الرسمي.`
      ].join('\n');
    }
  },

  // 3. قالب تأكيد استلام الدفعة / العربون
  payment_received: {
    id: 'payment_received',
    title: 'تأكيد استلام الدفعة / العربون',
    description: 'إشعار العميل بتأكيد وتثبيت الحجز وتحديث المبلغ المتبقي',
    icon: 'ShieldCheck',
    category: 'lifecycle',
    format: ({ booking, receivedAmount, remainingAmount }) => {
      const guestName = booking?.guestName || 'النزيل الكريم';
      const total = booking?.totalAmount || 0;
      const rec = receivedAmount || Math.round(total * 0.3) || 300;
      const rem = remainingAmount !== undefined ? remainingAmount : Math.max(0, total - rec);

      return [
        `أهلاً بك أستاذ ${guestName} 🌟`,
        ``,
        `تم استلام الدفعة بقيمة ${rec.toLocaleString()} ر.س بنجاح.`,
        ``,
        `• المبلغ المتبقي عند الوصول: ${rem.toLocaleString()} ر.س`,
        `تم تحديث حالة حجزك إلى مؤكد ومثبت. نترقب تشريفك لنا قريباً! 🏨`
      ].join('\n');
    }
  },

  // 4. قالب ما قبل الوصول بـ 24 ساعة والموقع
  pre_arrival: {
    id: 'pre_arrival',
    title: 'تذكير ما قبل الوصول بـ 24 ساعة واللوكيشن',
    description: 'تذكير بموعد الدخول ورابط خريطة قوقل ماب',
    icon: 'MapPin',
    category: 'lifecycle',
    format: ({ booking, hotel, checkInTime, locationUrl }) => {
      const guestName = booking?.guestName || 'النزيل الكريم';
      const hotelName = booking?.hotelName || hotel?.name || 'فندق برستيج';
      const bookingCode = booking?.bookingCode || 'PRS-0000';
      const entryHour = checkInTime || '04:00 عصراً';
      const mapUrl = locationUrl || hotel?.location?.googleMapsUrl || hotel?.googleMapsUrl || 'https://maps.google.com';

      return [
        `أهلاً بك ضيفنا العزيز ${guestName}، نترقب وصولك غداً بإذن الله 🕋✨`,
        ``,
        `نود تذكيرك بتفاصيل حجزك في ${hotelName}:`,
        ``,
        `• موعد تسجيل الدخول: ابتداءً من الساعة ${entryHour}`,
        `• رقم الحجز: #${bookingCode}`,
        `📍 موقع الفندق على خرائط جوجل: ${mapUrl}`,
        ``,
        `🚗 تتوفر خدمة استقبال ومواقف. إذا احتجت أي مساعدة أثناء الطريق، نحن في خدمتك على هذا الرقم مباشرة. رافقتكم السلامة!`
      ].join('\n');
    }
  },

  // 5. قالب الترحيب وكلمة سر الواي فاي يوم التسكين
  welcome_wifi: {
    id: 'welcome_wifi',
    title: 'الترحيب وكلمة سر الواي فاي يوم التسكين',
    description: 'إرسال رقم الغرفة ومعلومات الإنترنت اللاسلكي للنزيل',
    icon: 'Wifi',
    category: 'lifecycle',
    format: ({ booking, roomNumber, wifiNetwork, wifiPassword }) => {
      const guestName = booking?.guestName || 'النزيل الكريم';
      const hotelName = booking?.hotelName || 'فندق برستيج';
      const roomNum = roomNumber || booking?.assignedRoomNumber || '305';
      const net = wifiNetwork || `${hotelName.replace(/\s+/g, '_')}_Guest`;
      const pass = wifiPassword || 'Prestige@2026';

      return [
        `أهلاً بك في بيتك الثاني، ${guestName}! 🌿`,
        ``,
        `يسعد فريق ${hotelName} باستضافتك في الغرفة رقم (${roomNum}).`,
        ``,
        `📶 بيانات الإنترنت المجاني (Wi-Fi):`,
        `• الشبكة: ${net}`,
        `• كلمة المرور: ${pass}`,
        ``,
        `🛎️ لخدمة الغرف أو أي طلب، يمكنك الاتصال برقم الاستقبال الداخلي (0) أو مراسلتنا هنا مباشرة. نتمنى لك إقامة هانئة!`
      ].join('\n');
    }
  },

  // 6. قالب الشكر وطلب التقييم بعد المغادرة
  post_checkout: {
    id: 'post_checkout',
    title: 'الشكر وطلب التقييم بعد المغادرة',
    description: 'شكر النزيل وإرسال رابط تقييم قوقل ماب للموقع',
    icon: 'Star',
    category: 'lifecycle',
    format: ({ booking, hotel, googleReviewUrl }) => {
      const guestName = booking?.guestName || 'النزيل الكريم';
      const hotelName = booking?.hotelName || hotel?.name || 'فندق برستيج';
      const reviewUrl = googleReviewUrl || hotel?.googleReviewUrl || hotel?.location?.googleMapsUrl || 'https://maps.google.com';

      return [
        `أستاذ ${guestName}، سررنا جداً باستضافتك 🤍`,
        ``,
        `نتمنى أن تكون إقامتك في ${hotelName} قد نالت رضاك واستحسانك. رأيك يهمنا جداً ويساعدنا على تقديم الأفضل دائماً، ويسعدنا مشاركة تجربتك في دقيقة واحدة عبر تقييمنا على قوقل:`,
        `🔗 ${reviewUrl}`,
        ``,
        `ننتظر زيارتك القادمة بإذن الله، في أمان الله وحفظه! 🌟`
      ].join('\n');
    }
  }
};

// ==========================================
// PUBLIC WEBSITE ACTION TEMPLATES
// ==========================================

export const PUBLIC_WHATSAPP_MESSAGES = {
  // 1. زر تواصل مع خدمة العملاء العام
  generalSupport: {
    clientMessage: 'السلام عليكم ورحمة الله، أود الاستفسار والتواصل مع خدمة العملاء بخصوص حجوزات وخدمات شركة برستيج الفندقية.',
    staffAutoReply: 'وعليكم السلام ورحمة الله وبركاته، أهلاً بك في شركة برستيج لإدارة وتشغيل الفنادق 🌟. يسعدنا خدمتك، كيف نقدر نساعدك اليوم؟'
  },

  // 2. زر احجز هذا الفندق عبر واتساب
  hotelInquiry: (hotelName: string, city: string = 'مكة المكرمة') => ({
    clientMessage: `السلام عليكم ورحمة الله، أود الاستفسار وحجز إقامة في فندق: ${hotelName} - ${city}. فضلاً تزويدي بالأسعار والإتاحة المتاحة.`,
    staffAutoReply: `أهلاً بك يا غالي في فندق ${hotelName} 🌸 يسعدنا خدمتك، فضلاً تزويدنا بالتالي لنعطيك أفضل عرض فوري:\n1. تاريخ الوصول والمغادرة:\n2. عدد الأشخاص والغرف المطلوبة:\n3. هل تفضل الحجز مع إفطار أم بدون؟`
  }),

  // 3. زر حجز المجموعات وحملات العمرة والباصات
  groupBooking: {
    clientMessage: 'السلام عليكم، أود الاستفسار عن أسعار وعروض حجز المجموعات والشركات (قروبات / حملات) لدى فنادق برستيج بمكة المكرمة والمدينة المنورة.',
    staffAutoReply: 'أهلاً بك وبضيوفك الكرام 🕋. نحن متخصصون في تسكين الحملات والشركات. فضلاً كم عدد الغرف أو النزلاء التقريبي وتاريخ الوصول لنقوم بإعداد عرض سعر رسمي ومميز لك فوراً.'
  },

  // 4. زر مستشار التسكين الفندقي
  advisor: {
    clientMessage: 'السلام عليكم ورحمة الله، أود التواصل مع مستشار التسكين لمساعدتي في اختيار أفضل فندق وغرفة تناسب ميزانيتي واحتياجي.',
    staffAutoReply: 'أهلاً بك، معك مستشار التسكين من شركة برستيج 🌟. يسعدني جداً مساعدتك في اختيار الفندق الأقرب للحرم والأنسب لميزانيتك. هل رحلتك إلى مكة المكرمة أم المدينة المنورة؟ وما هي التواريخ المخططة؟'
  },

  // 5. قالب الرد خارج أوقات العمل
  afterHours: {
    staffAutoReply: [
      'مرحباً بك في شركة برستيج لإدارة وتشغيل الفنادق 🌙',
      '',
      'نشكر تواصلك معنا! ساعات العمل الرسمية لفريق خدمة العملاء هي من [9:00 صباحاً] حتى [11:00 مساءً]. تم تسجيل رسالتك وسيقوم موظف الحجوزات بالرد عليك فور بدء الدوام مباشرة.',
      '',
      'إذا كان استفسارك بخصوص حجز عاجل اليوم، فضلاً اكتب كلمة (عاجل) مع رقم حجزك. طابت ليلتك بكل خير ✨'
    ].join('\n')
  }
};

/**
 * دالة مساعدة لتوليد رابط واتساب مباشر مع الرسالة لأي رقم هاتف
 */
export function generateWhatsAppLink(rawPhone: string, message: string): string {
  if (!rawPhone) return '';
  let clean = rawPhone.replace(/[^0-9]/g, '');
  if (clean.startsWith('05')) {
    clean = '966' + clean.slice(1);
  } else if (clean.startsWith('5') && clean.length === 9) {
    clean = '966' + clean;
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
