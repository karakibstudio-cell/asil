import { RoomBooking, SiteSettings } from '../types';

/**
 * خدمة إشعارات الحجز الإلكتروني عبر البريد الإلكتروني والرسائل
 * Prestige Hotels Management - Booking Notification & Email Service
 */

/**
 * إنشاء قالب HTML فاخر واحترافي لإشعار الحجز عبر البريد الإلكتروني
 */
export function formatBookingEmailHtml(booking: RoomBooking, siteSettings?: SiteSettings): string {
  const hotelCity = booking.hotelCity ? ` - ${booking.hotelCity}` : '';
  const cleanPhone = booking.guestPhone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('05') ? '966' + cleanPhone.slice(1) : cleanPhone;
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://prestige-hotels.com';
  const siteName = siteSettings?.siteTitle || 'شركة برستيج لإدارة وتشغيل الفنادق';

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إشعار حجز جديد #${booking.bookingCode}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f6f2; color: #222; margin: 0; padding: 20px; direction: rtl; text-align: right; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e8e4dc; box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #161616 0%, #292524 100%); color: #ffffff; padding: 30px 24px; text-align: center; border-bottom: 3px solid #C9A24B; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; color: #E6C673; letter-spacing: 0.5px; }
    .header p { margin: 0; font-size: 13px; color: #d6d3d1; }
    .badge-bar { background: #FCF8EE; padding: 14px 24px; border-bottom: 1px solid #F1E5C9; display: flex; justify-content: space-between; align-items: center; }
    .badge { background: #C9A24B; color: #ffffff; font-weight: bold; padding: 5px 12px; border-radius: 30px; font-size: 12px; }
    .status-badge { background: #FEF3C7; color: #92400E; font-weight: bold; padding: 4px 10px; border-radius: 20px; font-size: 11px; border: 1px solid #FDE68A; }
    .content { padding: 24px; }
    .section-title { font-size: 14px; font-weight: bold; color: #1c1917; margin: 20px 0 10px 0; border-bottom: 1px dashed #e7e5e4; padding-bottom: 6px; }
    .table-info { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
    .table-info td { padding: 8px 6px; border-bottom: 1px solid #f5f5f4; vertical-align: top; }
    .table-info td.label { width: 38%; color: #78716c; font-weight: 600; }
    .table-info td.val { width: 62%; color: #1c1917; font-weight: bold; }
    .highlight-box { background: #FAFAF9; border-right: 4px solid #C9A24B; padding: 12px 16px; border-radius: 8px; margin: 15px 0; font-size: 13px; line-height: 1.6; }
    .total-box { background: linear-gradient(135deg, #FAF7EE 0%, #F5ECCE 100%); border: 1px solid #E6D5A7; border-radius: 14px; padding: 16px; text-align: center; margin: 20px 0; }
    .total-title { font-size: 12px; color: #785A1D; font-weight: bold; }
    .total-price { font-size: 24px; color: #98752B; font-weight: 900; margin: 4px 0; }
    .btn-container { text-align: center; margin: 25px 0 10px 0; }
    .btn-wa { display: inline-block; background-color: #25D366; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 14px; margin: 5px; box-shadow: 0 4px 12px rgba(37,211,102,0.3); }
    .btn-admin { display: inline-block; background-color: #1c1917; color: #E6C673 !important; text-decoration: none; padding: 12px 22px; border-radius: 12px; font-weight: bold; font-size: 13px; margin: 5px; border: 1px solid #C9A24B; }
    .footer { background: #fafaf9; padding: 18px; text-align: center; font-size: 11px; color: #a8a29e; border-top: 1px solid #e7e5e4; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${siteName}</h1>
      <p>🛎️ إشعار رسمي باستلام طلب حجز فندقي أونلاين جديد عبر الموقع</p>
    </div>

    <div class="badge-bar">
      <div>
        <span style="font-size: 12px; color: #78716c; font-weight: bold;">رقم طلب الحجز: </span>
        <span class="badge">#${booking.bookingCode}</span>
      </div>
      <div>
        <span class="status-badge">
          ${booking.status === 'confirmed' ? '✅ مؤكد' : '⏳ قيد المراجعة والاعتماد'}
        </span>
      </div>
    </div>

    <div class="content">
      <div class="section-title">🏨 فندق وإقامة النزيل</div>
      <table class="table-info">
        <tr>
          <td class="label">اسم الفندق:</td>
          <td class="val">${booking.hotelName}${hotelCity}</td>
        </tr>
        <tr>
          <td class="label">نوع الغرفة:</td>
          <td class="val">${booking.roomName} (${booking.roomsCount} غرفة)</td>
        </tr>
        <tr>
          <td class="label">خيار الوجبات:</td>
          <td class="val">${booking.mealPlanName}</td>
        </tr>
        <tr>
          <td class="label">عدد النزلاء:</td>
          <td class="val">${booking.adults} بالغين${booking.children > 0 ? ` + ${booking.children} أطفال` : ''}</td>
        </tr>
        <tr>
          <td class="label">تاريخ الوصول (Check-in):</td>
          <td class="val">${booking.checkIn}</td>
        </tr>
        <tr>
          <td class="label">تاريخ المغادرة (Check-out):</td>
          <td class="val">${booking.checkOut}</td>
        </tr>
        <tr>
          <td class="label">إجمالي الليالي:</td>
          <td class="val">${booking.nights} ${booking.nights === 1 ? 'ليلة' : 'ليالٍ'}</td>
        </tr>
        ${booking.digitalKey ? `
        <tr>
          <td class="label">كود التأكيد / المفتاح:</td>
          <td class="val" style="color: #059669; font-family: monospace; font-size: 14px;">${booking.digitalKey}</td>
        </tr>` : ''}
        ${booking.assignedRoomNumber ? `
        <tr>
          <td class="label">رقم الغرفة المسكّنة:</td>
          <td class="val" style="color: #2563eb;">غرفة #${booking.assignedRoomNumber}</td>
        </tr>` : ''}
      </table>

      <div class="section-title">👤 بيانات التواصل مع النزيل</div>
      <table class="table-info">
        <tr>
          <td class="label">اسم النزيل:</td>
          <td class="val">${booking.guestName}</td>
        </tr>
        <tr>
          <td class="label">رقم الهاتف:</td>
          <td class="val" dir="ltr" style="text-align: right;">${booking.guestPhone}</td>
        </tr>
        ${booking.guestEmail ? `
        <tr>
          <td class="label">البريد الإلكتروني:</td>
          <td class="val" dir="ltr" style="text-align: right;">${booking.guestEmail}</td>
        </tr>` : ''}
      </table>

      ${booking.specialRequests ? `
      <div class="section-title">✨ طلبات خاصة من النزيل</div>
      <div class="highlight-box">
        ${booking.specialRequests}
      </div>` : ''}

      ${booking.adminNotes ? `
      <div class="section-title">📝 ملاحظات وتوجيهات المشرف</div>
      <div class="highlight-box" style="border-right-color: #059669; background: #F0FDF4; color: #166534;">
        ${booking.adminNotes}
      </div>` : ''}

      <div class="total-box">
        <div class="total-title">إجمالي قيمة الحجز التقديرية</div>
        <div class="total-price">${booking.totalAmount.toLocaleString()} ر.س</div>
        <div style="font-size: 11px; color: #78716c;">(شامل الضريبة المعتمدة - الدفع عند الوصول في مكتب الاستقبال)</div>
      </div>

      <div class="btn-container">
        <a href="https://wa.me/${waPhone}" target="_blank" class="btn-wa">
          💬 مراسلة العميل عبر الواتساب فوراً
        </a>
        <a href="${siteUrl}/#/admin" target="_blank" class="btn-admin">
          🖥️ فتح لوحة تحكم الحجوزات
        </a>
      </div>
    </div>

    <div class="footer">
      تم إرسال هذا الإشعار الآلي بنجاح من نظام الحجوزات الإلكتروني بشركة برستيج.<br>
      تاريخ الإشعار: ${new Date(booking.createdAt || Date.now()).toLocaleString('ar-SA')}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * إنشاء نص بريد إلكتروني مقروء ومقسم لسطور
 */
export function formatBookingEmailPlainText(booking: RoomBooking, siteSettings?: SiteSettings): string {
  const hotelCity = booking.hotelCity ? ` - ${booking.hotelCity}` : '';
  const lines = [
    `🛎️ إشعار حجز فندقي أونلاين جديد عبر الموقع`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔖 رقم طلب الحجز: #${booking.bookingCode}`,
    `📌 حالة الطلب: ${booking.status === 'confirmed' ? 'مؤكد ومعتمد ✓' : 'قيد المراجعة والاعتماد لدى المشرف'}`,
    booking.digitalKey ? `🔑 كود التأكيد / المفتاح الرقمي: ${booking.digitalKey}` : null,
    booking.assignedRoomNumber ? `🚪 رقم الغرفة المسكنة: #${booking.assignedRoomNumber}` : null,
    ``,
    `🏨 بيانات الفندق والإقامة:`,
    `• الفندق: ${booking.hotelName}${hotelCity}`,
    `• نوع الغرفة: ${booking.roomName} (${booking.roomsCount} غرفة)`,
    `• خطة الوجبات: ${booking.mealPlanName}`,
    `• عدد النزلاء: ${booking.adults} بالغين${booking.children > 0 ? ` + ${booking.children} أطفال` : ''}`,
    `• تاريخ الوصول: ${booking.checkIn}`,
    `• تاريخ المغادرة: ${booking.checkOut}`,
    `• عدد الليالي: ${booking.nights} ${booking.nights === 1 ? 'ليلة' : 'ليالٍ'}`,
    ``,
    `👤 بيانات النزيل:`,
    `• الاسم: ${booking.guestName}`,
    `• الهاتف: ${booking.guestPhone}`,
    booking.guestEmail ? `• البريد: ${booking.guestEmail}` : null,
    ``,
    `💰 إجمالي المبلغ: ${booking.totalAmount.toLocaleString()} ر.س (الدفع عند الوصول في الاستقبال)`,
    booking.specialRequests ? `\n✨ طلبات خاصة: ${booking.specialRequests}` : null,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📄 رابط استعراض وسند الفاتورة وتحميل PDF مباشرة:\n${typeof window !== 'undefined' ? window.location.origin : 'https://prestige-ksa.web.app'}/#/invoice?id=${booking.id}&token=${booking.token || ''}`,
    `💬 رابط محادثة العميل بالواتساب: https://wa.me/${booking.guestPhone.replace(/[^0-9]/g, '')}`
  ].filter(Boolean);

  return lines.join('\n');
}

/**
 * تحديد البريد الإلكتروني الفعلي المعتمد لاستقبال الحجوزات
 */
export function resolveBookingEmail(siteSettings?: SiteSettings): string {
  const customBooking = siteSettings?.bookingModule?.bookingEmail?.trim();
  const officeEmail = siteSettings?.aboutUs?.officeEmail?.trim();
  const channelEmail = siteSettings?.channels?.find(c => c.type === 'email')?.value?.trim();

  // إذا تم إدخال بريد مخصص صحيح وغير وهمي
  if (customBooking && !customBooking.includes('prestigeksa.com') && customBooking.includes('@')) {
    return customBooking;
  }
  // إذا توفر بريد المقر الرئيسي الحقيقي
  if (officeEmail && !officeEmail.includes('prestigehotels.sa') && officeEmail.includes('@')) {
    return officeEmail;
  }
  // إذا توفر بريد قنوات التواصل
  if (channelEmail && channelEmail.includes('@')) {
    return channelEmail;
  }
  // البريد التشغيلي المعتمد لشركة برستيج
  return 'prestigeksa.umrah@gmail.com';
}

export interface BookingNotificationResult {
  success: boolean;
  emailUsed: string;
  needsActivation?: boolean;
  message?: string;
  error?: string;
}

/**
 * إرسال إشعار الحجز أونلاين لبريد الشركة تلقائياً
 */
export async function sendOnlineBookingNotification(
  booking: RoomBooking,
  siteSettings?: SiteSettings
): Promise<BookingNotificationResult> {
  const targetEmail = resolveBookingEmail(siteSettings);
  const subject = `🛎️ حجز أونلاين جديد: #${booking.bookingCode} - ${booking.guestName} (${booking.hotelName})`;
  const plainText = formatBookingEmailPlainText(booking, siteSettings);

  // الحجوزات أونلاين يتم حفظها وإدارتها حصرياً في جدول room_bookings ولوحة الحجوزات المخصصة،
  // ولن يتم إدراجها إطلاقاً في الرسائل الواردة المخصصة لطلبات الخدمة واستفسارات "تواصل معنا".

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://prestige-ksa.web.app';
  const invoicePdfUrl = `${siteUrl}/#/invoice?id=${booking.id}&token=${booking.token || ''}`;

  // إرسال البريد الإلكتروني الفعلي إلى بريد الشركة المعتمد عبر خدمة FormSubmit المباشرة
  try {
    const payload = {
      _subject: subject,
      _replyto: booking.guestEmail || targetEmail,
      _template: 'table',
      _captcha: 'false',
      'رقم_طلب_الحجز': `#${booking.bookingCode}`,
      'الفندق': booking.hotelName,
      'اسم_النزيل': booking.guestName,
      'رقم_الجوال': booking.guestPhone,
      'البريد_الإلكتروني': booking.guestEmail || 'غير محدد',
      'نوع_الغرفة': booking.roomName,
      'تاريخ_الوصول': booking.checkIn,
      'تاريخ_المغادرة': booking.checkOut,
      'عدد_الليالي': booking.nights,
      'الوجبات': booking.mealPlanName,
      'المبلغ_الإجمالي': `${booking.totalAmount.toLocaleString()} ر.س`,
      'سند_وفاتورة_الحجز_PDF': invoicePdfUrl,
      'ملاحظات_المشرف': booking.adminNotes || 'لا توجد',
      'طلبات_خاصة': booking.specialRequests || 'لا توجد',
      'رابط_محادثة_واتساب': `https://wa.me/${booking.guestPhone.replace(/[^0-9]/g, '')}`,
      'التفاصيل_الكاملة': plainText
    };

    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);
    
    // فحص ما إذا كانت الرسالة بحاجة لتفعيل البريد (أول مرة فقط)
    const isNeedsActivation = Boolean(
      data?.message && (
        data.message.toLowerCase().includes('activation') || 
        data.message.toLowerCase().includes('activate')
      )
    );

    if (isNeedsActivation) {
      console.info('[BookingNotification] FormSubmit needs one-time activation on:', targetEmail);
      return { 
        success: false, 
        needsActivation: true, 
        emailUsed: targetEmail, 
        message: 'تم إرسال رابط التفعيل إلى بريد الشركة، يرجى الضغط عليه لمرة واحدة لاعتماد الاستلام التلقائي.' 
      };
    }

    if (response.ok && (data?.success === 'true' || data?.success === true || !data?.error)) {
      return { success: true, emailUsed: targetEmail };
    }
  } catch (err: any) {
    console.warn('[BookingNotification] Direct email dispatch error:', err);
  }

  // 3. إرسال نسخة من تأكيد الحجز إلى بريد النزيل المسجل تلقائياً إذا كان متوفراً
  if (booking.guestEmail && booking.guestEmail.includes('@') && !booking.guestEmail.includes('example.com')) {
    sendBookingConfirmationToCustomer(booking, siteSettings).catch(() => {});
  }

  return { success: true, emailUsed: targetEmail };
}

/**
 * إرسال بريد تأكيد الحجز الرسمي المباشر إلى البريد المسجل للنزيل
 */
export async function sendBookingConfirmationToCustomer(
  booking: RoomBooking,
  siteSettings?: SiteSettings
): Promise<boolean> {
  if (!booking.guestEmail || !booking.guestEmail.includes('@') || booking.guestEmail.includes('example.com')) {
    return false;
  }

  const customerEmail = booking.guestEmail.trim();
  const siteName = siteSettings?.siteTitle || 'شركة برستيج لإدارة وتشغيل الفنادق';
  const subject = `✅ تم تأكيد حجزك الفندقي #${booking.bookingCode} - ${booking.hotelName} | ${siteName}`;
  const plainText = formatBookingEmailPlainText(booking, siteSettings);

  try {
    const payload = {
      _subject: subject,
      _replyto: resolveBookingEmail(siteSettings),
      _template: 'table',
      _captcha: 'false',
      'حالة_الحجز': 'مؤكد ومعتمد رسمياً ✓',
      'رقم_الحجز_المعتمد': `#${booking.bookingCode}`,
      'المفتاح_الرقمي_أو_الكود': booking.digitalKey || booking.confirmationCode || 'معتمد',
      'الفندق': booking.hotelName,
      'المدينة': booking.hotelCity || 'مكة المكرمة / المدينة المنورة',
      'نوع_الغرفة': booking.roomName,
      'تاريخ_الوصول': booking.checkIn,
      'تاريخ_المغادرة': booking.checkOut,
      'عدد_الليالي': `${booking.nights} ليالٍ`,
      'اسم_النزيل': booking.guestName,
      'المبلغ_الإجمالي': `${booking.totalAmount.toLocaleString()} ر.س (الدفع عند الوصول)`,
      'طريقة_الدفع': 'الدفع عند الوصول في مكتب الاستقبال بالفندق (نقداً أو بالبطاقات)',
      'سند_الحجز_والفاتورة': `${typeof window !== 'undefined' ? window.location.origin : 'https://prestige-ksa.web.app'}/#/invoice?id=${booking.id}&token=${booking.token || ''}`,
      'توجيهات_الإقامة': 'يرجى إبراز أصل الهوية الوطنية أو الإقامة أو جواز السفر لجميع النزلاء عند تسجيل الدخول في مكتب الاستقبال.',
      'تفاصيل_الحجز': plainText
    };

    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(customerEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);
    return response.ok && (data?.success === 'true' || data?.success === true || !data?.error);
  } catch (err) {
    console.warn('[BookingNotification] Customer email dispatch error:', err);
    return false;
  }
}

/**
 * تجهيز نص رسالة الواتساب المتكاملة لإرسالها للنزيل عند تأكيد الحجز
 */
export function buildCustomerBookingWhatsAppMessage(booking: RoomBooking, siteSettings?: SiteSettings): string {
  const hotelCity = booking.hotelCity ? ` - ${booking.hotelCity}` : '';
  const siteName = siteSettings?.siteTitle || 'شركة برستيج لإدارة وتشغيل الفنادق';
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://prestige-ksa.web.app';
  const invoiceUrl = `${siteUrl}/#/invoice?id=${booking.id}&token=${booking.token || ''}`;

  return [
    `✨ *تأكيد حجز فندقي معتمد - ${siteName}* ✨`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `مرحباً بك عزيزنا *${booking.guestName}* 👋`,
    `يسعدنا إبلاغك بأنه قد تم تأكيد واعتماد حجزك الفندقي رسمياً لدينا:`,
    ``,
    `🔖 *رقم الحجز المعتمد:* #${booking.bookingCode}`,
    `📌 *حالة الحجز:* مؤكد ومعتمد رسمياً ✓`,
    booking.digitalKey ? `🔑 *كود التأكيد / المفتاح الرقمي:* ${booking.digitalKey}` : null,
    booking.assignedRoomNumber ? `🚪 *رقم الغرفة المسكّنة:* #${booking.assignedRoomNumber}` : null,
    ``,
    `🏨 *تفاصيل الإقامة والفندق:*`,
    `• الفندق: *${booking.hotelName}${hotelCity}*`,
    `• نوع الغرفة: ${booking.roomName} (${booking.roomsCount} غرفة)`,
    `• خطة الوجبات: ${booking.mealPlanName}`,
    `• تاريخ الوصول: *${booking.checkIn}*`,
    `• تاريخ المغادرة: *${booking.checkOut}*`,
    `• مدة الإقامة: ${booking.nights} ${booking.nights === 1 ? 'ليلة' : 'ليالٍ'}`,
    `• عدد النزلاء: ${booking.adults} بالغين${booking.children > 0 ? ` + ${booking.children} أطفال` : ''}`,
    ``,
    `💰 *المبلغ الإجمالي:* *${booking.totalAmount.toLocaleString()} ر.س*`,
    `💳 *طريقة السداد:* الدفع عند الوصول في مكتب الاستقبال بالفندق`,
    ``,
    `📄 *رابط سند الحجز والفاتورة الإلكترونية:*`,
    invoiceUrl,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `نتمنى لكم إقامة طيبة ومباركة في رحاب الحرمين الشريفين 🕋`,
    `لأي استفسار يرجى الرد على هذه المحادثة مباشرة.`
  ].filter(Boolean).join('\n');
}

/**
 * رابط محادثة واتساب مباشر لإرسال تأكيد الحجز إلى هاتف النزيل بضغطة واحدة
 */
export function buildCustomerWhatsAppConfirmationUrl(booking: RoomBooking, siteSettings?: SiteSettings): string {
  const cleanPhone = booking.guestPhone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('05') ? '966' + cleanPhone.slice(1) : (cleanPhone.startsWith('5') ? '966' + cleanPhone : cleanPhone);
  const text = encodeURIComponent(buildCustomerBookingWhatsAppMessage(booking, siteSettings));
  return `https://wa.me/${waPhone}?text=${text}`;
}

/**
 * رابط فتح بريد Gmail مباشرة في المتصفح لإنشاء رسالة معبأة بجميع تفاصيل الحجز
 */
export function getBookingGmailComposeUrl(booking: RoomBooking, siteSettings?: SiteSettings): string {
  const targetEmail = resolveBookingEmail(siteSettings);
  const subject = `حجز جديد #${booking.bookingCode} - ${booking.guestName} (${booking.hotelName})`;
  const body = formatBookingEmailPlainText(booking, siteSettings);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * رابط mailto جاهز ومكتوب بدقة كبديل فوري أو يدوي لفتح تطبيق البريد في الهاتف أو الكمبيوتر
 */
export function getBookingMailtoUrl(booking: RoomBooking, siteSettings?: SiteSettings): string {
  const targetEmail = resolveBookingEmail(siteSettings);
  const subject = `حجز جديد #${booking.bookingCode} - ${booking.guestName} (${booking.hotelName})`;
  const body = formatBookingEmailPlainText(booking, siteSettings);

  return `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
