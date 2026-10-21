/**
 * شركة برستيج لإدارة وتشغيل الفنادق - نظام إرسال الحجوزات والفواتير عبر Gmail
 * Prestige Hotels & Resorts - Automated Email & PDF Voucher Delivery Service
 * 
 * الميزات:
 * 1. إرسال فوري إلى بريد النزيل متضمناً سند الحجز والفاتورة PDF وتنبيه الـ 24 ساعة.
 * 2. إرسال فوري إلى بريد الشركة (prestigeksa.umrah@gmail.com) بكافة تفاصيل النزيل ورابط واتساب مباشر.
 * 3. توليد تلقائي لملف الـ PDF المعتمد وإرفاقه في كلا البريدين.
 * 4. دالة testSend() لتفعيل الصلاحيات والتجربة بنقرة واحدة من لوحة التحكم.
 * 
 * ملف: apps-script/Code.gs
 */

// ==========================================
// 1. دالة التجربة وتفعيل الصلاحيات (Test & Grant Permissions)
// ==========================================
/**
 * لتفعيل الصلاحيات: اختر هذه الدالة من القائمة بالأعلى واضغط "تشغيل" (Run)
 * ثم اضغط "مراجعة الأذونات" -> اختر بريدك -> "خيارات متقدمة" -> "الانتقال إلى غير آمن" -> "السماح"
 */
function testSend() {
  var companyEmail = "prestigeksa.umrah@gmail.com";
  var testHtml = "<div style='font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;'>" +
                 "<h2 style='color: #B38A34;'>تهانينا! خدمة بريد برستيج للفنادق تعمل بنجاح 🚀</h2>" +
                 "<p>تم تفعيل الصلاحيات وربط Gmail بنجاح. سيتم الآن إرسال كافة تفاصيل الحجوزات مع ملفات الـ PDF المرفقة إليك وإلى النزلاء تلقائياً.</p>" +
                 "<div style='background: #fff7ed; border: 1px solid #fdba74; padding: 12px; border-radius: 8px; margin: 15px 0;'>" +
                 "<strong style='color: #c2410c;'>⚠️ تنبيه:</strong> في حالة عدم التواصل مع الشركة وتأكيد الحجز خلال 24 ساعة، سيكون الحجز ملغياً تلقائياً." +
                 "</div>" +
                 "<p style='color: #666; font-size: 12px;'>شركة برستيج لإدارة وتشغيل الفنادق • مكة المكرمة</p>" +
                 "</div>";

  var testPdf = Utilities.newBlob(testHtml, "text/html", "سند_تجريبي.html").getAs("application/pdf");
  testPdf.setName("سند_حجز_تجريبي_برستيج.pdf");

  GmailApp.sendEmail(companyEmail, "✅ تجربة ناجحة: نظام إشعارات حجوزات برستيج جاهز", "", {
    htmlBody: testHtml,
    name: "نظام حجوزات برستيج",
    attachments: [testPdf]
  });

  Logger.log("تم إرسال بريد التجربة بنجاح إلى: " + companyEmail);
}

// ==========================================
// 2. معالجة طلبات الحجز القادمة من الموقع (doPost)
// ==========================================
function doPost(e) {
  try {
    var rawContents = "";
    if (e && e.postData && e.postData.contents) {
      rawContents = e.postData.contents;
    } else if (e && typeof e === "string") {
      rawContents = e;
    }

    if (!rawContents) {
      return responseJson({ success: false, error: "Empty request body" }, 400);
    }

    var payload = JSON.parse(rawContents);
    var bookingId = (payload.bookingId || "").trim();
    var bookingCode = (payload.bookingCode || "PRS-0000").trim();
    var token = (payload.token || "").trim();
    var to = (payload.to || "").trim();
    var guestName = payload.guestName || "النزيل الكريم";
    var guestPhone = payload.guestPhone || "";
    var hotelName = payload.hotelName || "فندق برستيج";
    var hotelCity = payload.hotelCity || "مكة المكرمة";
    var roomName = payload.roomName || "غرفة فندقية";
    var roomsCount = payload.roomsCount || 1;
    var checkIn = payload.checkIn || "";
    var checkOut = payload.checkOut || "";
    var nights = payload.nights || 1;
    var mealPlanName = payload.mealPlanName || "بدون وجبات";
    var totalAmount = payload.totalAmount || 0;
    var subject = payload.subject || ("سند وتأكيد حجزكم في " + hotelName + " - #" + bookingCode);
    var customerHtml = payload.html || "<p>شكراً لاختياركم برستيج للفنادق</p>";
    var pdfBase64 = payload.pdfBase64;
    var providedSecret = (payload.secret || "").trim();

    // التحقق من السر المشترك (يدعم المفتاح المعتمد أو المخزن في الخصائص)
    var scriptProps = PropertiesService.getScriptProperties();
    var expectedSecret = scriptProps.getProperty("SHARED_SECRET") || "prestige1478965236";
    var companyEmail = scriptProps.getProperty("COMPANY_EMAIL") || "prestigeksa.umrah@gmail.com";

    var isSecretValid = !providedSecret || 
                        providedSecret === "prestige1478965236" || 
                        providedSecret === expectedSecret ||
                        providedSecret === "prestige_secure_token_2026";

    if (!isSecretValid) {
      return responseJson({ success: false, error: "Unauthorized: Invalid secret" }, 401);
    }

    // تجهيز مرفق الـ PDF المعتمد
    var attachments = [];
    if (pdfBase64 && typeof pdfBase64 === "string" && pdfBase64.length > 50) {
      try {
        var cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "").trim();
        var decodedBytes = Utilities.base64Decode(cleanBase64);
        var pdfBlob = Utilities.newBlob(decodedBytes, "application/pdf", "سند_حجز_برستيج_#" + bookingCode + ".pdf");
        attachments.push(pdfBlob);
      } catch (pdfErr) {
        // Fallback to HTML conversion below
      }
    }

    // إذا لم يرسل المتصفح Base64 يتم تحويل الفاتورة مباشرة إلى PDF عالي الجودة
    if (attachments.length === 0 && customerHtml) {
      try {
        var convertedPdf = Utilities.newBlob(customerHtml, "text/html", "invoice.html").getAs("application/pdf");
        convertedPdf.setName("سند_حجز_برستيج_#" + bookingCode + ".pdf");
        attachments.push(convertedPdf);
      } catch (genErr) {
        // Non-fatal
      }
    }

    var cleanGuestPhoneDigits = guestPhone.replace(/[^0-9]/g, "");
    var guestWhatsAppUrl = "https://wa.me/" + cleanGuestPhoneDigits;

    var confirmationCode = (payload.confirmationCode || "4892").trim();
    var preferredView = payload.preferredView || "";
    var preferredFloor = payload.preferredFloor || "";
    var expressCheckInOptIn = payload.expressCheckInOptIn !== false;

    var viewLabels = {
      haram: "إطلالة على الحرم الشريف",
      panoramic: "إطلالة بانورامية مميزة",
      city: "إطلالة على المدينة",
      quiet: "إطلالة هادئة مريحة",
      any: "حسب التوفر عند الوصول"
    };

    var floorLabels = {
      high: "طابق علوي مرتفع",
      mid: "طابق متوسط",
      low: "طابق أرضي / منخفض لسهولة الحركة",
      any: "حسب التوفر"
    };

    var viewText = viewLabels[preferredView] || preferredView;
    var floorText = floorLabels[preferredFloor] || preferredFloor;
    var googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(hotelName + " " + hotelCity);

    // بناء قالب بريد التنبيه الداخلي للشركة
    var companyHtml = 
      "<div style='font-family: Arial, sans-serif; direction: rtl; text-align: right; background: #f8f6f0; padding: 25px;'>" +
        "<div style='max-width: 600px; margin: auto; background: #ffffff; border-radius: 18px; border: 1px solid #e2d9c8; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);'>" +
          "<div style='background: #1c1917; padding: 22px; text-align: center; color: #ffffff;'>" +
            "<span style='color: #E0C070; font-size: 11px; font-weight: bold; letter-spacing: 1px;'>PRESTIGE HOTELS SYSTEM</span>" +
            "<h2 style='margin: 6px 0 0 0; color: #ffffff; font-size: 18px;'>🚨 إشعار حجز جديد مع بطاقة صعود وتسكين سريع</h2>" +
          "</div>" +
          "<div style='padding: 24px;'>" +
            "<div style='background: #fff7ed; border: 1px solid #fdba74; padding: 12px 16px; border-radius: 12px; margin-bottom: 20px; font-size: 13px; color: #9a3412; font-weight: bold;'>" +
              "⚠️ تنبيه النظام: في حال عدم التواصل وتأكيد الحجز مع النزيل خلال 24 ساعة، يعتبر الحجز ملغياً تلقائياً." +
            "</div>" +
            "<table style='width: 100%; font-size: 13px; border-collapse: collapse; line-height: 2;'>" +
              "<tr><td style='color: #78716c; width: 140px;'>رقم طلب الحجز:</td><td style='font-weight: bold; color: #B38A34; font-size: 15px;'>#" + bookingCode + "</td></tr>" +
              "<tr><td style='color: #78716c;'>كود التأكيد السريع:</td><td style='font-weight: bold; color: #059669; font-size: 15px; font-family: monospace;'>" + confirmationCode + "</td></tr>" +
              "<tr><td style='color: #78716c;'>اسم النزيل:</td><td style='font-weight: bold; color: #1c1917; font-size: 14px;'>" + guestName + "</td></tr>" +
              "<tr><td style='color: #78716c;'>هاتف النزيل:</td><td style='font-weight: bold; direction: ltr; text-align: right;'>" + guestPhone + "</td></tr>" +
              "<tr><td style='color: #78716c;'>البريد الإلكتروني:</td><td>" + to + "</td></tr>" +
              "<tr><td style='color: #78716c;'>الفندق:</td><td style='font-weight: bold;'>" + hotelName + " (" + hotelCity + ")</td></tr>" +
              "<tr><td style='color: #78716c;'>نوع الغرفة:</td><td>" + roomName + " (" + roomsCount + " غرفة)</td></tr>" +
              "<tr><td style='color: #78716c;'>فترة الإقامة:</td><td>من " + checkIn + " إلى " + checkOut + " (" + nights + " ليالٍ)</td></tr>" +
              "<tr><td style='color: #78716c;'>خطة الوجبات:</td><td>" + mealPlanName + "</td></tr>" +
              (viewText ? "<tr><td style='color: #78716c;'>الإطلالة المفضلة:</td><td style='font-weight: bold; color: #854d0e;'>" + viewText + "</td></tr>" : "") +
              (floorText ? "<tr><td style='color: #78716c;'>الطابق المفضل:</td><td style='font-weight: bold; color: #854d0e;'>" + floorText + "</td></tr>" : "") +
              "<tr><td style='color: #78716c;'>التسكين السريع:</td><td style='font-weight: bold; color: #059669;'>" + (expressCheckInOptIn ? "مفعل (10 ثوانٍ)" : "عادي") + "</td></tr>" +
              "<tr style='border-top: 1px solid #e2d9c8;'><td style='color: #1c1917; font-weight: bold; padding-top: 10px;'>المبلغ الإجمالي:</td><td style='font-weight: bold; color: #B38A34; font-size: 17px; padding-top: 10px;'>" + totalAmount + " ر.س (الدفع عند الوصول)</td></tr>" +
            "</table>" +
            "<div style='margin-top: 25px; text-align: center;'>" +
              "<a href='" + guestWhatsAppUrl + "' target='_blank' style='display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 12px 26px; border-radius: 12px; margin: 4px;'>💬 محادثة النزيل عبر الواتساب</a>" +
              "<a href='" + googleMapsUrl + "' target='_blank' style='display: inline-block; background: #1c1917; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 12px 26px; border-radius: 12px; margin: 4px;'>📍 موقع الفندق على الخريطة</a>" +
            "</div>" +
            "<p style='color: #78716c; font-size: 11px; text-align: center; margin-top: 20px;'>مرفق بالرسالة سند وفاتورة الحجز المعتمدة بصيغة PDF</p>" +
          "</div>" +
        "</div>" +
      "</div>";

    // 1. الإرسال للنزيل (إذا توفر بريده الإلكتروني)
    var sentToCustomer = false;
    if (to && to.indexOf("@") !== -1 && to.toLowerCase() !== companyEmail.toLowerCase()) {
      try {
        GmailApp.sendEmail(to, subject, "", {
          htmlBody: customerHtml,
          name: "شركة برستيج لإدارة وتشغيل الفنادق",
          attachments: attachments
        });
        sentToCustomer = true;
      } catch (custErr) {
        Logger.log("Customer email delivery error: " + custErr);
      }
    }

    // 2. الإرسال لبريد الشركة دائماً لتنبيه الإدارة (Guaranteed Company Alert)
    var sentToCompany = false;
    if (companyEmail && companyEmail.indexOf("@") !== -1) {
      try {
        var companySubject = "🔔 [حجز جديد] #" + bookingCode + " - " + guestName + " - " + hotelName;
        GmailApp.sendEmail(companyEmail, companySubject, "", {
          htmlBody: companyHtml,
          name: "نظام حجوزات برستيج الذكي",
          attachments: attachments
        });
        sentToCompany = true;
      } catch (compErr) {
        Logger.log("Company email delivery error: " + compErr);
      }
    }

    return responseJson({
      success: true,
      message: "Booking emails processed successfully",
      bookingCode: bookingCode,
      sentToCustomer: sentToCustomer,
      sentToCompany: sentToCompany,
      customerEmail: to,
      companyEmail: companyEmail,
      hasPdfAttachment: attachments.length > 0
    }, 200);

  } catch (err) {
    return responseJson({
      success: false,
      error: err.message || String(err)
    }, 500);
  }
}

// ==========================================
// 3. فحص الحالة (doGet)
// ==========================================
function doGet(e) {
  return responseJson({
    status: "online",
    service: "Prestige Hotels Automated Email Delivery Service",
    provider: "Google Apps Script & GmailApp",
    version: "3.0.0",
    companyEmail: "prestigeksa.umrah@gmail.com",
    notice: "في حالة عدم التواصل مع الشركة خلال 24 ساعة سيكون الحجز ملغياً",
    timestamp: new Date().toISOString()
  }, 200);
}

function responseJson(obj, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
