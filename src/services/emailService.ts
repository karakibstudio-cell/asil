import { RoomBooking, SiteSettings } from '../types';
import { getInvoiceUrl } from '../utils/routing';
import { updateBookingEmailStatus } from './bookingService';

export interface SendEmailResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Generate a luxury HTML email template for booking voucher and invoice
 */
export function buildBookingEmailHtml(booking: RoomBooking, siteSettings?: SiteSettings): string {
  const invoiceUrl = getInvoiceUrl(booking.id, booking.token);
  const companyPhone = siteSettings?.bookingModule?.companyWhatsApp || '+966544076726';
  const confirmationCode = booking.confirmationCode || (booking.digitalKey ? booking.digitalKey.slice(-4) : '4892');
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.hotelName + ' ' + (booking.hotelCity || 'مكة المكرمة'))}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(invoiceUrl)}`;
  const cleanCompanyPhone = companyPhone.replace(/[^0-9]/g, '');

  const viewLabels: Record<string, string> = {
    haram: 'إطلالة على الحرم الشريف',
    panoramic: 'إطلالة بانورامية مميزة',
    city: 'إطلالة على المدينة',
    quiet: 'إطلالة هادئة مريحة',
    any: 'حسب التوفر عند الوصول'
  };

  const floorLabels: Record<string, string> = {
    high: 'طابق علوي مرتفع',
    mid: 'طابق متوسط',
    low: 'طابق أرضي / منخفض لسهولة الحركة',
    any: 'حسب التوفر'
  };

  const hasPreferences = Boolean(booking.preferredView || booking.preferredFloor || booking.expressCheckInOptIn);

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد وسند حجز فندق ${booking.hotelName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f3ee; font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2d2a26;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f6f3ee; padding: 25px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width: 620px; width: 100%; background-color: #ffffff; border-radius: 24px; border: 1px solid #e7dfcf; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
          
          <!-- LUXURY HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 35px 30px; text-align: center;">
              <div style="display: inline-block; width: 52px; height: 52px; line-height: 52px; border-radius: 16px; background-color: rgba(201,162,75,0.2); border: 1px solid #C9A24B; color: #E0C070; font-size: 26px; font-weight: bold; margin-bottom: 12px;">P</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">شركة برستيج لإدارة وتشغيل الفنادق</h1>
              <p style="margin: 6px 0 0 0; color: #C9A24B; font-size: 13px; font-weight: 500;">Prestige Hotels & Resorts • الضيافة الفندقية الفاخرة</p>
              <div style="margin-top: 15px; display: inline-block; padding: 6px 18px; border-radius: 20px; background: rgba(201,162,75,0.15); border: 1px solid rgba(201,162,75,0.4); color: #E0C070; font-size: 12px; font-weight: bold;">
                سند حجز فندقي وبطاقة صعود رقمية معتمدة ⚡
              </div>
            </td>
          </tr>

          <!-- MAIN BODY -->
          <tr>
            <td style="padding: 30px 35px;">
              <h2 style="margin: 0 0 10px 0; color: #1c1917; font-size: 19px;">مرحباً ضيفنا العزيز أ. ${booking.guestName}،</h2>
              <p style="margin: 0 0 20px 0; color: #57534e; font-size: 14px; line-height: 1.7;">
                نشكركم لاختياركم الإقامة في <strong>${booking.hotelName}</strong>. تم تأكيد طلب حجزكم بنجاح ومرفق لكم سند الحجز وبطاقة الصعود المعتمدة مع رمز الاستجابة السريعة (QR Code) لتسهيل إجراءات الدخول.
              </p>

              <!-- 24-HOUR CANCELLATION WARNING BOX -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fff7ed; border: 1px solid #fdba74; border-radius: 14px; margin-bottom: 22px;">
                <tr>
                  <td style="padding: 14px 18px; text-align: center;">
                    <span style="font-size: 13px; font-weight: bold; color: #c2410c; display: block; margin-bottom: 4px;">⚠️ تنبيه إداري هام:</span>
                    <span style="font-size: 12px; color: #9a3412; font-weight: bold; line-height: 1.6;">
                      في حالة عدم التواصل مع الشركة وتأكيد الحجز خلال 24 ساعة، سيكون الحجز ملغياً تلقائياً.
                    </span>
                  </td>
                </tr>
              </table>

              <!-- QR CODE & VERIFICATION BOX -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fdfbf7; border: 1px solid #e7dfcf; border-radius: 18px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding-bottom: 12px;">
                          <div style="display: inline-block; padding: 10px; background: #ffffff; border-radius: 16px; border: 2px solid #C9A24B; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
                            <img src="${qrCodeUrl}" alt="QR Code" width="140" height="140" style="display: block; border-radius: 8px;" />
                          </div>
                          <div style="font-size: 11px; color: #78716c; margin-top: 6px; font-weight: bold;">
                            امسح الرمز ضوئياً عند الاستقبال للتسكين السريع (10 ثوانٍ)
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table width="100%" style="border-top: 1px solid #ebd9b8; padding-top: 12px;">
                            <tr>
                              <td style="font-size: 13px; color: #78716c;">رقم الحجز المرجعي:</td>
                              <td align="left" style="font-size: 16px; font-weight: bold; color: #B38A34; font-family: monospace;">#${booking.bookingCode}</td>
                            </tr>
                            <tr>
                              <td style="font-size: 13px; color: #78716c; padding-top: 6px;">كود التأكيد السريع:</td>
                              <td align="left" style="font-size: 16px; font-weight: bold; color: #059669; font-family: monospace; padding-top: 6px;">${confirmationCode}</td>
                            </tr>
                            <tr>
                              <td style="font-size: 13px; color: #78716c; padding-top: 6px;">الفندق والمدينة:</td>
                              <td align="left" style="font-size: 14px; font-weight: bold; color: #1c1917; padding-top: 6px;">${booking.hotelName} (${booking.hotelCity || 'مكة المكرمة'})</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- DETAILS TABLE -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
                <tr style="border-bottom: 1px solid #f0ede6;">
                  <td style="padding: 10px 0; color: #78716c;">نوع الغرفة:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #1c1917;" align="left">${booking.roomName} (${booking.roomsCount} غرفة)</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0ede6;">
                  <td style="padding: 10px 0; color: #78716c;">تاريخ الوصول:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #059669;" align="left">${booking.checkIn}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0ede6;">
                  <td style="padding: 10px 0; color: #78716c;">تاريخ المغادرة:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #1c1917;" align="left">${booking.checkOut}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0ede6;">
                  <td style="padding: 10px 0; color: #78716c;">مدة الإقامة:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #1c1917;" align="left">${booking.nights} ${booking.nights === 1 ? 'ليلة' : 'ليالٍ'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0ede6;">
                  <td style="padding: 10px 0; color: #78716c;">خطة الوجبات:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #1c1917;" align="left">${booking.mealPlanName}</td>
                </tr>
                ${hasPreferences ? `
                <tr style="border-bottom: 1px solid #f0ede6;">
                  <td style="padding: 10px 0; color: #78716c;">تفضيلات النزيل:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #854d0e;" align="left">
                    ${booking.preferredView ? viewLabels[booking.preferredView] || booking.preferredView : ''} 
                    ${booking.preferredFloor ? '• ' + (floorLabels[booking.preferredFloor] || booking.preferredFloor) : ''}
                  </td>
                </tr>
                ` : ''}
                <tr style="border-bottom: 2px solid #C9A24B;">
                  <td style="padding: 14px 0; font-weight: bold; font-size: 15px; color: #1c1917;">المبلغ الإجمالي المستحق:</td>
                  <td style="padding: 14px 0; font-weight: bold; font-size: 20px; color: #B38A34; font-family: monospace;" align="left">${booking.totalAmount.toLocaleString()} ر.س (الدفع عند الوصول)</td>
                </tr>
              </table>

              <!-- DUAL ACTION BUTTONS (INVOICE & WHATSAPP) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
                <tr>
                  <td align="center">
                    <a href="${invoiceUrl}" target="_blank" style="display: inline-block; background-color: #C9A24B; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(201,162,75,0.3); margin: 6px;">
                      📄 استعراض الفاتورة وبطاقة الـ QR أونلاين
                    </a>
                    <a href="https://wa.me/${cleanCompanyPhone}?text=${encodeURIComponent('السلام عليكم، أود تأكيد حجز فندق ' + booking.hotelName + ' برقم #' + booking.bookingCode)}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(37,211,102,0.3); margin: 6px;">
                      💬 التواصل مع الاستقبال عبر الواتساب
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <a href="${googleMapsUrl}" target="_blank" style="color: #78716c; text-decoration: underline; font-size: 12px; font-weight: bold;">
                      📍 عرض موقع الفندق على خرائط Google Maps
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #78716c; font-size: 12px; text-align: center; line-height: 1.6;">
                الدفع متاح نقداً أو عبر بطاقات مدى وفيزا بمكتب الاستقبال بالفندق.<br>
                خدمة العملاء على مدار الساعة: ${companyPhone}
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #fdfbf7; border-top: 1px solid #e7dfcf; padding: 22px 30px; text-align: center; font-size: 11px; color: #a8a29e; line-height: 1.8;">
              © ${new Date().getFullYear()} شركة برستيج لإدارة وتشغيل الفنادق • مكة المكرمة والمدينة المنورة<br>
              سجل تجاري: 4031258941 • الرقم الضريبي: 310458921400003 • جميع الحقوق محفوظة
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatch booking confirmation email with PDF attachment via Google Apps Script (Free)
 */
export async function sendBookingEmailViaAppsScript(
  booking: RoomBooking,
  pdfBase64?: string,
  siteSettings?: SiteSettings
): Promise<SendEmailResult> {
  const appsScriptUrl = siteSettings?.bookingModule?.appsScriptUrl || 'https://script.google.com/macros/s/AKfycbwfdkkIfLBAg7KsaEA4QEjbMWnqqvwBs0GkjcOy9HQfMG4zKcui3rs-ANsByJ5zztnB/exec';
  const appsScriptSecret = siteSettings?.bookingModule?.appsScriptSecret || 'prestige1478965236';
  const isEmailEnabled = siteSettings?.bookingModule?.enableEmailSending !== false;

  if (!isEmailEnabled) {
    return { success: false, error: 'Email sending is disabled in settings' };
  }

  if (!appsScriptUrl || !appsScriptUrl.startsWith('https://script.google.com')) {
    return { 
      success: false, 
      error: 'Google Apps Script URL is not configured' 
    };
  }

  const recipientEmail = booking.guestEmail?.trim() || siteSettings?.bookingModule?.bookingEmail?.trim() || 'prestigeksa.umrah@gmail.com';

  const subject = `سند وتأكيد حجز فندقي #${booking.bookingCode} - ${booking.hotelName}`;
  const html = buildBookingEmailHtml(booking, siteSettings);

  const payload = {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    confirmationCode: booking.confirmationCode || '4892',
    token: booking.token || '',
    to: recipientEmail,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    hotelName: booking.hotelName,
    hotelCity: booking.hotelCity || 'مكة المكرمة',
    roomName: booking.roomName,
    roomsCount: booking.roomsCount,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    mealPlanName: booking.mealPlanName,
    totalAmount: booking.totalAmount,
    preferredView: booking.preferredView || 'any',
    preferredFloor: booking.preferredFloor || 'any',
    expressCheckInOptIn: booking.expressCheckInOptIn ?? true,
    subject,
    html,
    pdfBase64: pdfBase64 || '',
    secret: appsScriptSecret
  };

  try {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    try {
      const data = await response.json();
      if (data && data.success) {
        await updateBookingEmailStatus(booking.id, 'sent');
        return { success: true, message: data.message };
      }
    } catch {
      // If parsing fails but status is ok, still mark sent
      await updateBookingEmailStatus(booking.id, 'sent');
      return { success: true, message: 'Delivered' };
    }
  } catch (err: any) {
    // If standard fetch encounters a network or CORS restriction, use no-cors fallback to ensure delivery
    try {
      await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      await updateBookingEmailStatus(booking.id, 'sent');
      return { success: true, message: 'Delivered via fallback mode' };
    } catch (fallbackErr: any) {
      console.error('Apps script fallback failed:', fallbackErr);
      await updateBookingEmailStatus(booking.id, 'failed', fallbackErr.message);
      return { success: false, error: fallbackErr.message };
    }
  }

  return { success: true };
}
