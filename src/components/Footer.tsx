import React from 'react';
import { ActivePage, Offer, SiteSettings } from '../types';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  ShieldCheck,
  ExternalLink 
} from 'lucide-react';
import { 
  getActiveChannels, 
  getFirstActiveWhatsApp, 
  getFirstActivePhone, 
  getFirstActiveEmail, 
  getChannelHref 
} from '../utils/channels';
import { ChannelIcon } from './ChannelIcon';
import { EditableText } from './EditableText';
import { DEFAULT_QUICK_LINKS } from '../services/firebase';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onNavigate: (page: ActivePage) => void;
  activeOffers: Offer[];
  siteSettings: SiteSettings;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, activeOffers, siteSettings }) => {
  const { language, t, translateDynamic, isRtl } = useLanguage();
  const hasActiveOffers = activeOffers && activeOffers.some((o) => o.isActive);
  const activeChannels = getActiveChannels(siteSettings?.channels);
  const primaryWhatsApp = getFirstActiveWhatsApp(siteSettings?.channels);
  const primaryPhone = getFirstActivePhone(siteSettings?.channels);
  const primaryEmail = getFirstActiveEmail(siteSettings?.channels);

  return (
    <footer
      id="main-footer"
      className="bg-[#F5F1EA] border-t border-[#E5DDD0] text-stone-800 relative overflow-hidden transition-colors duration-300"
    >
      {/* Subtle Warm Amber Ambient Highlights */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-[#C9A24B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-32 bg-[#DFBE72]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Column 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {siteSettings?.logoUrl ? (
                <img
                  src={siteSettings.logoUrl}
                  alt={siteSettings.siteTitle || 'شعار الموقع'}
                  className="w-10 h-10 rounded-xl object-contain bg-white border border-[#C9A24B]/30 shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DFBE72] via-[#C9A24B] to-[#98752B] p-[1.5px] shadow-xs">
                  <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#B38A34]" />
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <span className="font-cairo font-bold text-xl text-stone-900">
                  <EditableText 
                    contentKey="footer.brand.title"
                    fallback={siteSettings?.siteTitle || (language === 'en' ? 'Prestige Hotels Management' : 'برستيج لإدارة وتشغيل الفنادق')}
                  />
                </span>
                <span className="text-[11px] text-stone-600 font-medium">
                  <EditableText 
                    contentKey="footer.brand.subtitle"
                    fallback={siteSettings?.siteSubtitle || (language === 'en' ? 'Hotel Management & Operations' : 'إدارة وتشغيل الفنادق والضيافة الفاخرة')}
                  />
                </span>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
              <EditableText 
                contentKey="footer.brand.bio"
                fallback={language === 'en' 
                  ? 'Leading company dedicated to providing hotel management, operations, and luxury accommodation solutions for pilgrims and visitors to the Two Holy Mosques, with over 15 years of excellence.'
                  : 'شركة برستيج الرائدة والمتخصصة في تقديم حلول إدارة وتشغيل الفنادق والتسكين الفاخر لحجاج بيت الله الحرام وزوار المسجد النبوي الشريف في مكة المكرمة والمدينة المنورة، بخبرة تمتد لأكثر من ١٥ عاماً من التميز والاحترافية.'}
                multiline={true}
              />
            </div>

            {siteSettings?.showLicense !== false && siteSettings?.aboutUs?.showLicense !== false && (
              <div className="pt-2 flex items-center gap-2.5 text-xs text-[#98752B] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#98752B]" />
                <span>
                  <EditableText 
                    contentKey="footer.brand.license"
                    fallback={language === 'en' ? 'Licensed by the Ministry of Hajj & Umrah and Saudi Tourism Authority' : 'مرخصون من وزارة الحج والعمرة والهيئة السعودية للسياحة'}
                  />
                </span>
              </div>
            )}
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className={`text-stone-900 font-cairo font-bold text-base mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 ${isRtl ? 'after:right-0' : 'after:left-0'} after:w-10 after:h-[2px] after:bg-[#C9A24B]`}>
              <EditableText 
                contentKey="footer.links.heading"
                fallback={language === 'en' ? 'Quick Links' : 'روابط سريعة'}
              />
            </h4>
            <ul className="space-y-2.5 text-sm">
              {(siteSettings?.quickLinks && siteSettings.quickLinks.length > 0 
                ? siteSettings.quickLinks 
                : DEFAULT_QUICK_LINKS
              )
                .filter(link => link.isActive !== false)
                .map((link, idx) => {
                  if (link.url && (link.targetPage === 'custom_url' || !link.targetPage)) {
                    return (
                      <li key={link.id || idx}>
                        <a
                          id={`footer-link-${link.id}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#98752B] transition-colors flex items-center gap-1.5 text-stone-800 font-semibold group"
                        >
                          <span className={`text-[#C9A24B] ${isRtl ? 'group-hover:translate-x-[-2px]' : 'group-hover:translate-x-[2px]'} transition-transform font-bold`}>›</span>
                          <span>{translateDynamic(link.title)}</span>
                          <ExternalLink className="w-3 h-3 text-stone-500 opacity-60 group-hover:opacity-100" />
                        </a>
                      </li>
                    );
                  }

                  const targetPage = (link.targetPage as ActivePage) || 'home';
                  const defaultLabel = link.title ? translateDynamic(link.title) : t(`nav.${targetPage}`);

                  return (
                    <li key={link.id || idx}>
                      <button
                        id={`footer-link-${link.id || targetPage}`}
                        onClick={() => { 
                          onNavigate(targetPage); 
                          window.scrollTo({ top: 0, behavior: 'smooth' }); 
                        }}
                        className={`hover:text-[#98752B] transition-colors flex items-center gap-1.5 text-stone-800 font-semibold group cursor-pointer ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                        <span className={`text-[#C9A24B] ${isRtl ? 'group-hover:translate-x-[-2px]' : 'group-hover:translate-x-[2px]'} transition-transform font-bold`}>›</span>
                        <EditableText 
                          contentKey={`footer.link.${targetPage}`} 
                          fallback={defaultLabel} 
                          inline={true} 
                        />
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Column 3: Contact & Branches */}
          <div>
            <h4 className={`text-stone-900 font-cairo font-bold text-base mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 ${isRtl ? 'after:right-0' : 'after:left-0'} after:w-10 after:h-[2px] after:bg-[#C9A24B]`}>
              <EditableText 
                contentKey="footer.branches.heading"
                fallback={language === 'en' ? 'Our Official Branches' : 'فروعنا وتواصل الحجز'}
              />
            </h4>
            <ul className="space-y-3.5 text-sm">
              {(siteSettings?.branches && siteSettings.branches.length > 0 
                ? siteSettings.branches.filter(b => b.isActive !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                : [
                    {
                      id: 'branch_makkah',
                      name: language === 'en' ? 'Makkah Branch:' : 'فرع مكة المكرمة:',
                      address: language === 'en' ? 'King Abdulaziz Endowment Towers, Ajyad St, Makkah' : 'أبراج وقف الملك عبدالعزيز، طريق أجياد، مكة',
                      mapUrl: 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah'
                    },
                    {
                      id: 'branch_madinah',
                      name: language === 'en' ? 'Madinah Branch:' : 'فرع المدينة المنورة:',
                      address: language === 'en' ? 'Northern Central Area, King Fahd Rd, Madinah' : 'المنطقة المركزية الشمالية، طريق الملك فهد',
                      mapUrl: 'https://maps.google.com/?q=Northern+Central+Area+Madinah'
                    }
                  ]
              ).map((branch, index) => {
                const mapUrl = branch.mapUrl || (index === 0
                  ? 'https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah'
                  : 'https://maps.google.com/?q=Northern+Central+Area+Madinah');

                return (
                  <li key={branch.id || index} className="group">
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 text-stone-800 hover:text-stone-950 transition-colors p-2 -m-1.5 rounded-xl hover:bg-stone-200/50"
                      title={language === 'en' ? 'Click to open on Google Maps' : 'اضغط لفتح موقع الفرع على خرائط Google'}
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#C9A24B]/15 text-[#98752B] group-hover:bg-[#C9A24B] group-hover:text-white transition-all flex items-center justify-center shrink-0 mt-0.5 border border-[#C9A24B]/30">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-stone-900 group-hover:text-[#98752B] transition-colors block text-xs font-bold">
                            {translateDynamic(branch.name)}
                          </strong>
                          <ExternalLink className="w-3 h-3 text-[#98752B] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xs text-stone-700 group-hover:text-stone-900 transition-colors block mt-0.5 font-normal">
                          {translateDynamic(branch.address)}
                        </span>
                      </div>
                    </a>
                  </li>
                );
              })}

              {primaryPhone && (
                <li className="flex items-center gap-3 text-stone-800 pt-1">
                  <Phone className="w-4 h-4 text-[#98752B] shrink-0" />
                  <a 
                    href={getChannelHref(primaryPhone)} 
                    className="hover:text-[#98752B] transition-colors dir-ltr font-mono font-bold text-xs sm:text-sm text-stone-800"
                  >
                    {primaryPhone.value}
                  </a>
                </li>
              )}
              {primaryEmail && (
                <li className="flex items-center gap-3 text-stone-800">
                  <Mail className="w-4 h-4 text-[#98752B] shrink-0" />
                  <a 
                    href={getChannelHref(primaryEmail)} 
                    className="hover:text-[#98752B] transition-colors font-mono text-xs font-semibold text-stone-800"
                  >
                    {primaryEmail.value}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: WhatsApp Direct & Socials */}
          <div>
            <h4 className={`text-stone-900 font-cairo font-bold text-base mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 ${isRtl ? 'after:right-0' : 'after:left-0'} after:w-10 after:h-[2px] after:bg-[#C9A24B]`}>
              <EditableText 
                contentKey="footer.contact.heading"
                fallback={language === 'en' ? 'Direct Contact & Inquiries' : 'خدمة العملاء والتواصل'}
              />
            </h4>
            <div className="text-xs sm:text-sm text-stone-700 mb-4 leading-relaxed font-normal">
              <EditableText 
                contentKey="footer.contact.desc"
                fallback={language === 'en' 
                  ? 'Our reception and booking team is available 24/7 to assist you and receive all inquiries.' 
                  : 'فريق الاستقبال والحجوزات متاح على مدار الساعة طوال أيام الأسبوع لخدمتكم واستقبال استفساراتكم.'}
                multiline={true}
              />
            </div>

            {primaryWhatsApp ? (
              <a
                id="footer-whatsapp-button"
                href={getChannelHref(primaryWhatsApp, 'السلام عليكم ورحمة الله، أود الاستفسار عن حجز فندق في مكة المكرمة أو المدينة المنورة')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm transition-all duration-300 shadow-md shadow-[#25D366]/20 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white text-transparent shrink-0" />
                <span>
                  <EditableText 
                    contentKey="footer.whatsapp.buttonText"
                    fallback={primaryWhatsApp.title || 'تحدث مع مستشار التسكين واتساب'}
                    inline={true}
                  />
                </span>
              </a>
            ) : (
              <button
                id="footer-contact-button"
                type="button"
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm transition-all duration-300 shadow-sm cursor-pointer"
              >
                <Mail className="w-5 h-5 shrink-0" />
                <span>
                  <EditableText 
                    contentKey="footer.contact.buttonText"
                    fallback="تواصل معنا للحجز والاستفسار"
                    inline={true}
                  />
                </span>
              </button>
            )}

            {/* Dynamic Social & Contact Channels Icons */}
            {activeChannels.length > 0 && (
              <div className="mt-5 space-y-2">
                <span className="text-xs text-stone-700 font-bold block">
                  <EditableText 
                    contentKey="footer.channels.label"
                    fallback="قنوات التواصل المعتمدة:"
                  />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {activeChannels.map((channel) => {
                    const href = getChannelHref(channel);
                    return (
                      <a
                        key={channel.id}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${channel.title}: ${channel.value}`}
                        className="group flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-[#DED6C9] hover:border-[#C9A24B] text-stone-800 hover:text-[#98752B] shadow-2xs hover:shadow-xs transition-all duration-200 relative"
                      >
                        <ChannelIcon type={channel.type} className="w-4 h-4 transition-transform group-hover:scale-110" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar: Copyright & Admin Portal Link */}
        <div className="mt-12 pt-6 border-t border-[#E5DDD0] flex flex-col sm:flex-row items-center justify-between text-xs text-stone-600 gap-4">
          <div className="font-medium text-stone-700">
            © {new Date().getFullYear()} {siteSettings?.siteTitle || (language === 'en' ? 'Prestige Hotels Management' : 'برستيج لإدارة وتشغيل الفنادق')}{' '}
            <EditableText 
              contentKey="footer.bottom.copyrightText"
              fallback="لإدارة وتشغيل الفنادق والضيافة. جميع الحقوق محفوظة."
              inline={true}
            />
          </div>
          <div className="flex items-center gap-4">
            <button 
              id="footer-admin-shortcut"
              onClick={() => { onNavigate('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="text-[#98752B] hover:text-[#B38A34] hover:underline transition-colors flex items-center gap-1 font-bold cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                <EditableText 
                  contentKey="footer.bottom.adminLink"
                  fallback="بوابة المشرفين (لوحة التحكم)"
                  inline={true}
                />
              </span>
            </button>
            <span className="text-stone-400">|</span>
            <span className="text-stone-600">
              <EditableText 
                contentKey="footer.bottom.privacy"
                fallback="سياسة الخصوصية والشروط"
                inline={true}
              />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
