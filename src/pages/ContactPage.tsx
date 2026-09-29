import React, { useState } from 'react';
import { sendContactMessage } from '../services/firebase';
import { SiteSettings } from '../types';
import { EditableText } from '../components/EditableText';
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  CheckCircle2, 
  Send, 
  Clock,
  ExternalLink,
  Share2,
  Users2,
  Briefcase,
  Building2,
  UserCheck
} from 'lucide-react';
import { WhatsAppIcon } from '../components/BookingIcons';
import { 
  getActiveChannels, 
  getFirstActiveWhatsApp, 
  getFirstActivePhone, 
  getFirstActiveEmail, 
  getChannelHref,
  CHANNEL_METAS
} from '../utils/channels';
import { ChannelIcon } from '../components/ChannelIcon';
import { useLanguage } from '../context/LanguageContext';

interface ContactPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  siteSettings?: SiteSettings;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onShowToast, siteSettings }) => {
  const { language, t, translateDynamic, isRtl } = useLanguage();
  const activeChannels = getActiveChannels(siteSettings?.channels);
  const primaryWhatsApp = getFirstActiveWhatsApp(siteSettings?.channels);
  const primaryPhone = getFirstActivePhone(siteSettings?.channels);
  const primaryEmail = getFirstActiveEmail(siteSettings?.channels);

  // Active Branches
  const activeBranches = (siteSettings?.branches && siteSettings.branches.length > 0
    ? siteSettings.branches.filter(b => b.isActive !== false)
    : [
        {
          id: 'branch_makkah',
          name: language === 'en' ? 'Makkah Al-Mukarramah Branch' : 'فرع مكة المكرمة (المقر الرئيسي)',
          city: 'مكة المكرمة',
          address: language === 'en' ? 'King Abdulaziz Endowment Towers, Ajyad St, Central Area, Makkah' : 'أبراج وقف الملك عبدالعزيز (الصفوة)، شارع أجياد، المنطقة المركزية، مكة',
          mapUrl: 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah',
          phone: '+966501234567',
          whatsapp: '+966501234567',
          isMainBranch: true,
          isActive: true
        },
        {
          id: 'branch_madinah',
          name: language === 'en' ? 'Madinah Al-Munawwarah Branch' : 'فرع المدينة المنورة',
          city: 'المدينة المنورة',
          address: language === 'en' ? 'Northern Central Area, Facing King Fahd Gate, Madinah' : 'المنطقة المركزية الشمالية، أمام بوابة الملك فهد، المدينة المنورة',
          mapUrl: 'https://maps.google.com/?q=Northern+Central+Area+Madinah',
          phone: '+966501234568',
          whatsapp: '+966501234568',
          isMainBranch: false,
          isActive: true
        }
      ]
  ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Specialized Department Contacts
  const departmentContacts = (siteSettings?.departmentContacts && siteSettings.departmentContacts.length > 0
    ? siteSettings.departmentContacts.filter(c => c.isActive !== false)
    : []
  ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: language === 'en' ? 'Hotel Booking Inquiry' : 'استفسار عن حجز فندق',
    preferredCity: 'مكة المكرمة',
    guestCount: 2,
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      onShowToast('يرجى كتابة الاسم ورقم الهاتف على الأقل', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendContactMessage({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        subject: formData.subject,
        preferredCity: formData.preferredCity,
        guestCount: Number(formData.guestCount),
        message: formData.message
      });

      setIsSuccess(true);
      onShowToast('تم إرسال رسالتكم بنجاح! سيتواصل معكم فريقنا قريباً', 'success');
      setFormData({
        name: '',
        phone: '',
        email: '',
        subject: 'استفسار عن حجز فندق',
        preferredCity: 'مكة المكرمة',
        guestCount: 2,
        message: ''
      });
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء الإرسال، يرجى المحاولة أو التواصل عبر واتساب', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="contact-us-page" className="min-h-screen bg-[#F8F7F4] text-stone-900 pt-28 pb-24">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold border border-[#C9A24B]/30 mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <EditableText 
              contentKey="contact.header.badge"
              fallback="نحن في خدمتكم دائماً"
              inline={true}
            />
          </div>
          <h1 className="text-3xl sm:text-5xl font-cairo font-extrabold text-stone-900 mb-4">
            <EditableText 
              contentKey="contact.header.title"
              fallback="تواصل معنا واستفسر عن الحجوزات"
              as="span"
            />
          </h1>
          <div className="text-sm sm:text-base text-stone-600 leading-relaxed">
            <EditableText 
              contentKey="contact.header.subtitle"
              fallback="فريق استشاريي التسكين متاح على مدار الساعة للإجابة عن تساؤلاتكم ومساعدتكم في اختيار الفندق الأمثل لرحلتكم المباركة."
              as="span"
              multiline={true}
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* SPECIALIZED DEPARTMENT CONTACTS SECTION */}
        {/* ========================================================= */}
        {departmentContacts.length > 0 && (
          <div className="mb-14 bg-gradient-to-br from-white via-white to-amber-50/50 rounded-3xl border border-[#C9A24B]/30 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center border border-[#C9A24B]/30 shrink-0">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-lg sm:text-xl text-stone-900">
                    <EditableText
                      contentKey="contact.dept.title"
                      fallback="أرقام ومسؤولو التواصل المتخصص (مبيعات / حجوزات / حسابات)"
                      inline={true}
                    />
                  </h3>
                  <p className="text-xs text-stone-500">
                    {language === 'en'
                      ? 'Contact specific department representatives directly for fast inquiries and booking confirmations'
                      : 'تواصل مباشرة مع مسؤول القسم والإدارة المختصة لخدمتكم وإنجاز حجزكم بأعلى سرعة'}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-[#B38A34] bg-[#C9A24B]/10 px-3 py-1 rounded-full shrink-0 border border-[#C9A24B]/20">
                {departmentContacts.length} {language === 'en' ? 'Departments' : 'أقسام متخصصة'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentContacts.map((dept) => {
                const cleanPhone = (dept.phone || '').replace(/[^0-9]/g, '');
                const cleanWa = (dept.whatsapp || dept.phone || '').replace(/[^0-9]/g, '');
                const waDeptUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
                  language === 'en'
                    ? `Hello, I would like to contact ${dept.department} regarding hotel bookings and services.`
                    : `السلام عليكم ورحمة الله، أود التواصل مع ${dept.department} بخصوص خدمات وحجوزات الفنادق.`
                )}`;

                return (
                  <div
                    key={dept.id}
                    className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-[#C9A24B] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C9A24B]/15 text-[#B38A34] border border-[#C9A24B]/25">
                          <Briefcase className="w-3 h-3" />
                          <span>{translateDynamic(dept.department)}</span>
                        </span>
                        {dept.workingHours && (
                          <span className="text-[10px] text-stone-500 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{translateDynamic(dept.workingHours)}</span>
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-cairo font-bold text-sm sm:text-base text-stone-900 group-hover:text-[#B38A34] transition-colors">
                          {translateDynamic(dept.name)}
                        </h4>
                        {dept.roleTitle && (
                          <p className="text-xs text-stone-600 font-medium mt-0.5">
                            {translateDynamic(dept.roleTitle)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${dept.phone}`}
                        className="py-2 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 hover:text-[#B38A34] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#B38A34]" />
                        <span>{language === 'en' ? 'Call' : 'اتصال'}</span>
                      </a>

                      <a
                        href={waDeptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 fill-white text-white" />
                        <span>{language === 'en' ? 'WhatsApp' : 'واتساب'}</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Contact Details & Branches (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick WhatsApp Banner (if WhatsApp channel is active) */}
            {primaryWhatsApp && (
              <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md">
                    <MessageCircle className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <h3 className="font-cairo font-bold text-lg text-stone-900">
                      <EditableText 
                        contentKey="contact.waBanner.title"
                        fallback={primaryWhatsApp.title || (language === 'en' ? 'Quick & Direct Booking' : 'حجز سريع ومباشر')}
                        inline={true}
                      />
                    </h3>
                    <span className="text-xs text-emerald-700 font-semibold">
                      {language === 'en' 
                        ? `Available 24/7 on WhatsApp (${primaryWhatsApp.value})` 
                        : `متاح 24/7 عبر واتساب (${primaryWhatsApp.value})`}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-stone-600 mb-4 leading-relaxed">
                  <EditableText 
                    contentKey="contact.waBanner.desc"
                    fallback={language === 'en' 
                      ? 'Prefer instant replies and direct accommodation discussion? Chat with our booking consultant right now.' 
                      : 'هل تفضل الرد الفوري ومشاركة تفاصيل الإقامة مباشرة؟ تواصل مع مستشار التسكين الآن.'}
                    multiline={true}
                  />
                </div>
                <a
                  href={getChannelHref(primaryWhatsApp, language === 'en' ? 'Hello, I would like to inquire about Makkah & Madinah hotel bookings.' : 'السلام عليكم، أود الاستفسار عن حجوزات فنادق مكة والمدينة')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>
                    <EditableText 
                      contentKey="contact.waBanner.buttonText"
                      fallback={language === 'en' ? 'Open WhatsApp Chat Now' : 'افتح محادثة واتساب الآن'}
                      inline={true}
                    />
                  </span>
                </a>
              </div>
            )}

            {/* Dynamic Active Contact Channels Section */}
            {activeChannels.length > 0 && (
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#B38A34]" />
                    <h4 className="font-cairo font-bold text-base text-stone-900">
                      <EditableText 
                        contentKey="contact.channels.heading"
                        fallback={language === 'en' ? 'Direct Official Channels' : 'قنوات التواصل السريع والمعتمد'}
                        inline={true}
                      />
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#B38A34] font-semibold bg-[#C9A24B]/10 px-2 py-0.5 rounded-full">
                    {activeChannels.length} {language === 'en' ? 'Channels' : 'قنوات متاحة'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeChannels.map((channel) => {
                    const href = getChannelHref(channel);
                    const meta = CHANNEL_METAS[channel.type] || CHANNEL_METAS.custom;

                    return (
                      <a
                        key={channel.id}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-3 rounded-2xl bg-stone-50 hover:bg-white border border-stone-200/80 hover:border-[#C9A24B] transition-all duration-200 shadow-2xs hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${meta.bgClass} ${meta.borderClass} ${meta.textClass}`}>
                            <ChannelIcon type={channel.type} className="w-5 h-5" />
                          </div>
                          <div className={`min-w-0 flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                            <span className="font-cairo font-bold text-xs sm:text-sm text-stone-900 block truncate group-hover:text-[#B38A34] transition-colors">
                              {translateDynamic(channel.title)}
                            </span>
                            <span className={`text-[11px] text-stone-500 font-mono block truncate dir-ltr ${isRtl ? 'text-right' : 'text-left'}`}>
                              {channel.value}
                            </span>
                          </div>
                        </div>

                        <div className={`flex items-center gap-1 text-[#B38A34] opacity-80 group-hover:opacity-100 shrink-0 ${isRtl ? 'mr-2' : 'ml-2'}`}>
                          <span className="text-[11px] font-bold hidden sm:inline">{language === 'en' ? 'Open' : 'فتح'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Branches Card */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h4 className="font-cairo font-bold text-base text-stone-900">
                  <EditableText 
                    contentKey="contact.branches.heading"
                    fallback={language === 'en' ? 'Field Offices & Branches' : 'مكاتبنا الميدانية وفروعنا'}
                    inline={true}
                  />
                </h4>
                <span className="text-[11px] text-[#B38A34] font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Locations on map' : 'مواقعنا على الخريطة'}</span>
                </span>
              </div>

              <div className="space-y-4">
                {activeBranches.map((branch, idx) => {
                  const mapUrl = branch.mapUrl || (idx === 0
                    ? 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah'
                    : 'https://maps.google.com/?q=Northern+Central+Area+Madinah');

                  return (
                    <div key={branch.id || idx} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 hover:border-[#C9A24B] transition-all space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center shrink-0 mt-0.5 border border-[#C9A24B]/30">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <strong className="text-stone-900 text-sm block font-bold">
                                {translateDynamic(branch.name)}
                              </strong>
                              {branch.isMainBranch && (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#C9A24B]/15 text-[#B38A34]">
                                  {language === 'en' ? 'Headquarters' : 'المقر الرئيسي'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                              {translateDynamic(branch.address)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between flex-wrap gap-2">
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#B38A34] hover:text-[#98752B] font-bold hover:underline"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{language === 'en' ? 'View on Google Maps' : 'عرض على خرائط Google'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <div className="flex items-center gap-3 text-[11px] font-mono dir-ltr">
                          {branch.phone && (
                            <a href={`tel:${branch.phone}`} className="text-stone-600 hover:text-[#B38A34] transition-colors flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#B38A34]" />
                              <span>{branch.phone}</span>
                            </a>
                          )}
                          {branch.whatsapp && (
                            <a
                              href={`https://wa.me/${branch.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1 font-bold"
                            >
                              <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                              <span>واتساب</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-3">
                {primaryPhone && (
                  <div className="flex items-center gap-3 text-stone-700 text-xs sm:text-sm">
                    <Phone className="w-4 h-4 text-[#B38A34] shrink-0" />
                    <a href={getChannelHref(primaryPhone)} className="font-mono dir-ltr hover:text-[#B38A34] transition-colors">
                      {primaryPhone.value}
                    </a>
                  </div>
                )}
                {primaryEmail && (
                  <div className="flex items-center gap-3 text-stone-700 text-xs sm:text-sm">
                    <Mail className="w-4 h-4 text-[#B38A34] shrink-0" />
                    <a href={getChannelHref(primaryEmail)} className="font-mono hover:text-[#B38A34] transition-colors">
                      {primaryEmail.value}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3 text-stone-700 text-xs sm:text-sm">
                  <Clock className="w-4 h-4 text-[#B38A34] shrink-0" />
                  <span>
                    <EditableText 
                      contentKey="contact.hours.text"
                      fallback="خدمة النزلاء على مدار 24 ساعة يومياً"
                      inline={true}
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact & Inquiry Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
            <h3 className="font-cairo font-bold text-xl text-stone-900 mb-2">
              <EditableText 
                contentKey="contact.form.title"
                fallback="أرسل استفسارك أو طلب التسكين"
                inline={true}
              />
            </h3>
            <div className="text-xs sm:text-sm text-stone-600 mb-6">
              <EditableText 
                contentKey="contact.form.desc"
                fallback="املأ النموذج أدناه وسيقوم أحد ممثلينا بالرد عليكم وتوفير العرض المناسب."
                multiline={true}
              />
            </div>

            {isSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[#B38A34] flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">
                  {language === 'en'
                    ? 'Your message has been received successfully! Our team will contact you shortly.'
                    : 'تم استلام رسالتكم بنجاح! سيتم التواصل معكم عبر الهاتف أو الواتساب في أقرب وقت.'}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Full Name:' : 'الاسم الكريم:'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={language === 'en' ? 'e.g. John Doe' : 'مثال: أحمد عبد الرحمن'}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Mobile or WhatsApp Number:' : 'رقم الجوال أو الواتساب:'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+966 5X XXX XXXX"
                    className={`w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white dir-ltr ${isRtl ? 'text-right' : 'text-left'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Email Address (optional):' : 'البريد الإلكتروني (اختياري):'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className={`w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white dir-ltr ${isRtl ? 'text-right' : 'text-left'}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {language === 'en' ? 'Preferred Accommodation City:' : 'المدينة المفضلة للإقامة:'}
                  </label>
                  <select
                    value={formData.preferredCity}
                    onChange={(e) => setFormData({ ...formData, preferredCity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white"
                  >
                    <option value="مكة المكرمة">{t('hotels.filterMakkah', 'مكة المكرمة')}</option>
                    <option value="المدينة المنورة">{t('hotels.filterMadinah', 'المدينة المنورة')}</option>
                    <option value="الاثنان معاً (مكة والمدينة)">{language === 'en' ? 'Both (Makkah & Madinah)' : 'الاثنان معاً (مكة والمدينة)'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  {language === 'en' ? 'Subject:' : 'موضوع الاستفسار:'}
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={language === 'en' ? 'e.g. Booking inquiry for Ramadan last 10 days' : 'مثال: حجز فندق فيرمونت في العشر الأواخر من رمضان'}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  {language === 'en' ? 'Inquiry Details & Special Requests:' : 'تفاصيل الاستفسار وملاحظاتك:'}
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={language === 'en' ? 'Proposed dates, room count, Kaaba view preference, or special accessibility needs...' : 'اكتب التواريخ المقترحة، عدد الغرف، نوع الإطلالة المطلوبة، أو أي متطلبات خاصة...'}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#C9A24B] focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>{language === 'en' ? 'Sending inquiry...' : 'جاري إرسال الطلب...'}</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      <span>
                        <EditableText 
                          contentKey="contact.form.submitButton"
                          fallback={language === 'en' ? 'Send Inquiry & Booking Request' : 'إرسال طلب الاستفسار والتسكين'}
                          inline={true}
                        />
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
