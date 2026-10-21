import React from 'react';
import { ActivePage, Offer, SiteSettings } from '../types';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  ShieldCheck,
  ExternalLink,
  Calendar,
  Key,
  Star,
  Sparkles,
  Navigation,
  Globe
} from 'lucide-react';
import { WhatsAppIcon } from './BookingIcons';
import { 
  getActiveChannels, 
  getFirstActiveWhatsApp, 
  getFirstActivePhone, 
  getFirstActiveEmail, 
  getChannelHref,
  buildWhatsAppLink 
} from '../utils/channels';
import { ChannelIcon } from './ChannelIcon';
import { DEFAULT_QUICK_LINKS } from '../services/firebase';
import { useLanguage } from '../context/LanguageContext';
import { filterActionButtons, executeActionButton, getActionButtonHref } from '../utils/actionButtons';

interface FooterProps {
  onNavigate: (page: ActivePage) => void;
  activeOffers: Offer[];
  siteSettings: SiteSettings;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, activeOffers, siteSettings }) => {
  const { language, t, translateDynamic, isRtl } = useLanguage();
  
  // Filter active channels and hide any channel with an empty URL/value
  const activeChannels = getActiveChannels(siteSettings?.channels).filter(c => Boolean(c.value && c.value.trim()));
  const primaryWhatsApp = getFirstActiveWhatsApp(siteSettings?.channels);
  const primaryPhone = getFirstActivePhone(siteSettings?.channels);
  const primaryEmail = getFirstActiveEmail(siteSettings?.channels);

  // Dynamic texts from live siteSettings with fallback per language
  const brandTitle = language === 'en' 
    ? (siteSettings?.siteTitleEn || siteSettings?.siteTitle || 'Prestige Hotels Management')
    : (siteSettings?.siteTitle || 'برستيج لإدارة وتشغيل الفنادق');

  const brandSubtitle = language === 'en'
    ? (siteSettings?.siteSubtitleEn || siteSettings?.siteSubtitle || 'Hotel Management & Operations')
    : (siteSettings?.siteSubtitle || 'إدارة وتشغيل الفنادق والضيافة الفاخرة');

  const brandBio = language === 'en'
    ? (siteSettings?.footerBioEn || 'Leading company dedicated to providing hotel management, operations, and luxury accommodation solutions for pilgrims and visitors to the Two Holy Mosques, with over 15 years of excellence.')
    : (siteSettings?.footerBio || 'شركة برستيج الرائدة والمتخصصة في تقديم حلول إدارة وتشغيل الفنادق والتسكين الفاخر لحجاج بيت الله الحرام وزوار المسجد النبوي الشريف في مكة المكرمة والمدينة المنورة، بخبرة تمتد لأكثر من ١٥ عاماً من التميز والاحترافية.');

  const customerServiceTitle = language === 'en'
    ? (siteSettings?.customerServiceTitleEn || 'Customer Service & Inquiries')
    : (siteSettings?.customerServiceTitle || 'خدمة العملاء والتواصل');

  const customerServiceDesc = language === 'en'
    ? (siteSettings?.customerServiceDescEn || 'Our reception and booking team is available 24/7 to assist you and receive all inquiries.')
    : (siteSettings?.customerServiceDesc || 'فريق الاستقبال والحجوزات متاح على مدار الساعة طوال أيام الأسبوع لخدمتكم واستقبال استفساراتكم.');

  const whatsappButtonText = language === 'en'
    ? (siteSettings?.footerWhatsAppButtonTextEn || 'Chat with Housing Advisor on WhatsApp')
    : (siteSettings?.footerWhatsAppButtonText || primaryWhatsApp?.title || 'تحدث مع مستشار التسكين واتساب');

  // WhatsApp link: prioritize footerWhatsAppNumber if provided, else primaryWhatsApp
  const whatsappHref = siteSettings?.footerWhatsAppNumber
    ? buildWhatsAppLink(siteSettings.footerWhatsAppNumber, language === 'en' ? 'Hello, I would like to inquire about hotel reservations in Makkah or Madinah.' : 'السلام عليكم ورحمة الله، أود الاستفسار عن حجز فندق في مكة المكرمة أو المدينة المنورة')
    : (primaryWhatsApp ? getChannelHref(primaryWhatsApp, language === 'en' ? 'Hello, I would like to inquire about hotel reservations in Makkah or Madinah.' : 'السلام عليكم ورحمة الله، أود الاستفسار عن حجز فندق في مكة المكرمة أو المدينة المنورة') : '');

  const copyrightText = language === 'en'
    ? (siteSettings?.copyrightTextEn || 'Hotel Management & Operations. All rights reserved.')
    : (siteSettings?.copyrightText || 'لإدارة وتشغيل الفنادق والضيافة. جميع الحقوق محفوظة.');

  // Configured Action Buttons for Footer
  const footerActionButtons = filterActionButtons(
    siteSettings?.actionButtons, 
    { position: 'footer' },
    siteSettings?.contactsDirectory
  );

  // Icon Helper for action buttons
  const renderActionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'whatsapp': return <WhatsAppIcon className="w-5 h-5 text-white shrink-0" />;
      case 'phone': return <Phone className="w-5 h-5 shrink-0" />;
      case 'mail': return <Mail className="w-5 h-5 shrink-0" />;
      case 'map': return <MapPin className="w-5 h-5 shrink-0" />;
      case 'building': return <Building2 className="w-5 h-5 shrink-0" />;
      case 'calendar': return <Calendar className="w-5 h-5 shrink-0" />;
      case 'key': return <Key className="w-5 h-5 shrink-0" />;
      case 'star': return <Star className="w-5 h-5 shrink-0" />;
      case 'sparkles': return <Sparkles className="w-5 h-5 shrink-0" />;
      case 'navigation': return <Navigation className="w-5 h-5 shrink-0" />;
      case 'globe': return <Globe className="w-5 h-5 shrink-0" />;
      default: return <MessageCircle className="w-5 h-5 shrink-0" />;
    }
  };

  const getButtonStyleClasses = (style: string) => {
    switch (style) {
      case 'whatsapp':
        return 'bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md shadow-[#25D366]/20';
      case 'secondary':
        return 'bg-white hover:bg-stone-50 text-[#98752B] border-2 border-[#C9A24B] shadow-xs';
      case 'gold':
        return 'bg-gradient-to-r from-[#DFBE72] via-[#C9A24B] to-[#98752B] hover:brightness-105 text-white shadow-md shadow-[#C9A24B]/20';
      case 'dark':
        return 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs';
      case 'outline':
        return 'bg-transparent hover:bg-stone-200/60 border border-stone-400 text-stone-800';
      case 'glass':
        return 'bg-white/80 hover:bg-white text-stone-900 border border-stone-200 shadow-xs backdrop-blur-md';
      default: // primary
        return 'bg-[#C9A24B] hover:bg-[#B38A34] text-white shadow-md shadow-[#C9A24B]/20';
    }
  };

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
                  alt={brandTitle}
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
                  {brandTitle}
                </span>
                <span className="text-[11px] text-stone-600 font-medium">
                  {brandSubtitle}
                </span>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
              {brandBio}
            </div>

            {siteSettings?.showLicense !== false && siteSettings?.aboutUs?.showLicense !== false && (
              <div className="pt-2 flex items-center gap-2.5 text-xs text-[#98752B] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#98752B]" />
                <span>
                  {language === 'en' 
                    ? 'Licensed by the Ministry of Hajj & Umrah and Saudi Tourism Authority' 
                    : 'مرخصون من وزارة الحج والعمرة والهيئة السعودية للسياحة'}
                </span>
              </div>
            )}
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className={`text-stone-900 font-cairo font-bold text-base mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 ${isRtl ? 'after:right-0' : 'after:left-0'} after:w-10 after:h-[2px] after:bg-[#C9A24B]`}>
              {language === 'en' ? 'Quick Links' : 'روابط سريعة'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {(siteSettings?.quickLinks && siteSettings.quickLinks.length > 0 
                ? siteSettings.quickLinks 
                : DEFAULT_QUICK_LINKS
              )
                .filter(link => link.isActive !== false)
                .map((link, idx) => {
                  const linkDisplayTitle = language === 'en' 
                    ? (link.titleEn || translateDynamic(link.title)) 
                    : link.title;

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
                          <span>{linkDisplayTitle}</span>
                          <ExternalLink className="w-3 h-3 text-stone-500 opacity-60 group-hover:opacity-100" />
                        </a>
                      </li>
                    );
                  }

                  const targetPage = (link.targetPage as ActivePage) || 'home';
                  const defaultLabel = linkDisplayTitle || t(`nav.${targetPage}`);

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
                        <span>{defaultLabel}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Column 3: Contact & Branches */}
          <div>
            <h4 className={`text-stone-900 font-cairo font-bold text-base mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 ${isRtl ? 'after:right-0' : 'after:left-0'} after:w-10 after:h-[2px] after:bg-[#C9A24B]`}>
              {language === 'en' ? 'Our Official Branches' : 'فروعنا وتواصل الحجز'}
            </h4>
            <ul className="space-y-4 text-sm">
              {(siteSettings?.branches && siteSettings.branches.length > 0 
                ? siteSettings.branches.filter(b => b.isActive !== false && b.showInFooter !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                : []
              ).map((branch, index) => {
                const mapUrl = branch.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(`${branch.name} ${branch.city || ''}`)}`;
                const branchName = language === 'en' ? (branch.nameEn || translateDynamic(branch.name)) : branch.name;
                const branchAddress = language === 'en' ? (branch.addressEn || translateDynamic(branch.address)) : branch.address;

                // Dynamic contacts for this branch: respect branch showContactInfo and per-channel showInFooter
                const showBranchContacts = branch.showContactInfo ?? Boolean(branch.isMainBranch);
                const activeContacts = showBranchContacts
                  ? (branch.contacts || []).filter(c => c.isActive !== false && c.showInFooter !== false)
                  : [];

                const canOpenMap = branch.showMapUrl !== false && Boolean(mapUrl);

                return (
                  <li key={branch.id || index} className="group p-2 rounded-xl hover:bg-stone-200/50 transition-colors">
                    {canOpenMap ? (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2.5 text-stone-800 hover:text-stone-950 transition-colors"
                        title={language === 'en' ? 'Click to open on Google Maps' : 'اضغط لفتح موقع الفرع على خرائط Google'}
                      >
                        <div className="w-6 h-6 rounded-lg bg-[#C9A24B]/15 text-[#98752B] group-hover:bg-[#C9A24B] group-hover:text-white transition-all flex items-center justify-center shrink-0 mt-0.5 border border-[#C9A24B]/30">
                          <MapPin className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-stone-900 group-hover:text-[#98752B] transition-colors block text-xs font-bold">
                              {branchName}
                            </strong>
                            <ExternalLink className="w-3 h-3 text-[#98752B] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {branch.showAddress !== false && branchAddress && (
                            <span className="text-xs text-stone-600 group-hover:text-stone-900 transition-colors block mt-0.5 font-normal">
                              {branchAddress}
                            </span>
                          )}
                          {branch.showWorkingHours !== false && (branch.workingHoursEn || branch.workingHours) && (
                            <span className="text-[11px] text-stone-500 block mt-0.5 font-normal">
                              ⏱️ {language === 'en' ? (branch.workingHoursEn || branch.workingHours) : (branch.workingHours || branch.workingHoursEn)}
                            </span>
                          )}
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-start gap-2.5 text-stone-800">
                        <div className="w-6 h-6 rounded-lg bg-[#C9A24B]/15 text-[#98752B] flex items-center justify-center shrink-0 mt-0.5 border border-[#C9A24B]/30">
                          <MapPin className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-stone-900 block text-xs font-bold">
                              {branchName}
                            </strong>
                          </div>
                          {branch.showAddress !== false && branchAddress && (
                            <span className="text-xs text-stone-600 block mt-0.5 font-normal">
                              {branchAddress}
                            </span>
                          )}
                          {branch.showWorkingHours !== false && (branch.workingHoursEn || branch.workingHours) && (
                            <span className="text-[11px] text-stone-500 block mt-0.5 font-normal">
                              ⏱️ {language === 'en' ? (branch.workingHoursEn || branch.workingHours) : (branch.workingHours || branch.workingHoursEn)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dynamic Branch Contacts: If 0 active contacts or showContactInfo is off, completely hide contacts subsection */}
                    {activeContacts.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-stone-200/60 pl-8 pr-2 space-y-1">
                        {activeContacts.map((contact, cIdx) => {
                          const contactLabel = language === 'en' ? (contact.labelEn || contact.label) : contact.label;
                          let href = '';
                          let isExternal = false;
                          if (contact.type === 'whatsapp') {
                            href = buildWhatsAppLink(contact.value, language === 'en' ? `Hello, I would like to inquire regarding ${branchName}.` : `السلام عليكم ورحمة الله، أود الاستفسار والتواصل مع فرع ${branchName}.`);
                            isExternal = true;
                          } else if (contact.type === 'call') {
                            href = `tel:${contact.value.replace(/\s+/g, '')}`;
                          } else if (contact.type === 'email') {
                            href = `mailto:${contact.value}`;
                          } else if (contact.type === 'link') {
                            href = contact.value;
                            isExternal = true;
                          }

                          return (
                            <div key={contact.id || cIdx} className="flex items-center gap-1.5 text-[11px] text-stone-700">
                              {contact.type === 'whatsapp' && <WhatsAppIcon className="w-3 h-3 text-[#25D366] shrink-0" />}
                              {contact.type === 'call' && <Phone className="w-3 h-3 text-[#B38A34] shrink-0" />}
                              {contact.type === 'email' && <Mail className="w-3 h-3 text-[#B38A34] shrink-0" />}
                              {contact.type === 'link' && <ExternalLink className="w-3 h-3 text-[#B38A34] shrink-0" />}
                              <span className="text-stone-500">{contactLabel}:</span>
                              <a 
                                href={href} 
                                target={isExternal ? '_blank' : undefined}
                                rel={isExternal ? 'noopener noreferrer' : undefined}
                                className="font-mono dir-ltr font-semibold text-stone-900 hover:text-[#B38A34] transition-colors"
                              >
                                {contact.value}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}

              {/* Company-level phone & email as general settings */}
              {primaryPhone && (
                <li className="flex items-center gap-3 text-stone-800 pt-2 border-t border-stone-200/80">
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

          {/* Column 4: WhatsApp Direct, Action Buttons & Socials */}
          <div>
            <h4 className={`text-stone-900 font-cairo font-bold text-base mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 ${isRtl ? 'after:right-0' : 'after:left-0'} after:w-10 after:h-[2px] after:bg-[#C9A24B]`}>
              {customerServiceTitle}
            </h4>
            <div className="text-xs sm:text-sm text-stone-700 mb-4 leading-relaxed font-normal">
              {customerServiceDesc}
            </div>

            {/* Action Buttons list (if configured for footer) */}
            {footerActionButtons.length > 0 ? (
              <div className="space-y-2.5">
                {footerActionButtons.map((btn) => {
                  const label = language === 'en' ? (btn.labelEn || btn.label) : btn.label;
                  const href = getActionButtonHref(btn, language, undefined, siteSettings?.contactsDirectory);
                  const isExternal = btn.actionType === 'whatsapp' || btn.actionType === 'map' || btn.actionType === 'url';

                  return (
                    <a
                      key={btn.id}
                      id={`footer-action-btn-${btn.id}`}
                      href={href}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (btn.actionType === 'page' || btn.actionType === 'hotel') {
                          e.preventDefault();
                          executeActionButton(btn, { navigate: onNavigate, language }, siteSettings?.contactsDirectory);
                        }
                      }}
                      className={`inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${getButtonStyleClasses(btn.style)}`}
                    >
                      {renderActionIcon(btn.icon)}
                      <span>{label}</span>
                      {btn.badgeText && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-mono font-bold">
                          {language === 'en' ? (btn.badgeTextEn || btn.badgeText) : btn.badgeText}
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
            ) : (
              /* Fallback to single primary WhatsApp or Contact button */
              whatsappHref ? (
                <a
                  id="footer-whatsapp-button"
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm transition-all duration-300 shadow-md shadow-[#25D366]/20 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-white text-transparent shrink-0" />
                  <span>{whatsappButtonText}</span>
                </a>
              ) : (
                <button
                  id="footer-contact-button"
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <Mail className="w-5 h-5 shrink-0" />
                  <span>{language === 'en' ? 'Contact Us for Bookings' : 'تواصل معنا للحجز والاستفسار'}</span>
                </button>
              )
            )}

            {/* Dynamic Social & Contact Channels Icons: Empty URLs are completely hidden */}
            {activeChannels.length > 0 && (
              <div className="mt-5 space-y-2">
                <span className="text-xs text-stone-700 font-bold block">
                  {language === 'en' ? 'Official Channels:' : 'قنوات التواصل المعتمدة:'}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {activeChannels.map((channel, cIdx) => {
                    const href = getChannelHref(channel);
                    return (
                      <a
                        key={channel.id || `footer-channel-${cIdx}`}
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
            © {new Date().getFullYear()} {brandTitle} {copyrightText}
          </div>
          <div className="flex items-center gap-4">
            <a 
              id="footer-sitemap-link"
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-600 hover:text-[#98752B] hover:underline transition-colors font-medium"
            >
              {language === 'en' ? 'Sitemap' : 'خريطة الموقع'}
            </a>
            {siteSettings?.displaySettings?.showFooterAdminLink === true && (
              <>
                <span className="text-stone-400">|</span>
                <button 
                  id="footer-admin-shortcut"
                  onClick={() => { onNavigate('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-[#98752B] hover:text-[#B38A34] hover:underline transition-colors flex items-center gap-1 font-bold cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Admin Portal' : 'بوابة المشرفين (لوحة التحكم)'}</span>
                </button>
              </>
            )}
            <span className="text-stone-400">|</span>
            <span className="text-stone-600">
              {language === 'en' ? 'Privacy Policy & Terms' : 'سياسة الخصوصية والشروط'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
