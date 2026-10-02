import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Bus, Utensils, FileCheck, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { EditableText } from './EditableText';
import { ActivePage, IntegratedServicesSettings, IntegratedServiceItem } from '../types';
import { DEFAULT_INTEGRATED_SERVICES } from '../services/firebase';

interface IntegratedServicesProps {
  onNavigate?: (page: ActivePage) => void;
  className?: string;
  settings?: IntegratedServicesSettings;
}

const ICON_MAP: Record<string, any> = {
  Building2,
  Bus,
  Utensils,
  FileCheck,
  Sparkles
};

export const IntegratedServices: React.FC<IntegratedServicesProps> = ({ 
  onNavigate, 
  className = '',
  settings
}) => {
  const { language, isRtl } = useLanguage();
  const serviceSettings = settings || DEFAULT_INTEGRATED_SERVICES;

  // If the section is disabled by admin, don't render
  if (serviceSettings.isEnabled === false) {
    return null;
  }

  const allServices = (serviceSettings.services && serviceSettings.services.length > 0)
    ? serviceSettings.services
    : DEFAULT_INTEGRATED_SERVICES.services!;

  const activeServices = allServices
    .filter(s => s.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (activeServices.length === 0) {
    return null;
  }

  return (
    <section id="integrated-services-section" className={`py-20 sm:py-24 bg-gradient-to-b from-white via-[#FAF8F5] to-white relative overflow-hidden ${className}`}>
      {/* Background Subtle Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A24B]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C9A24B]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 relative z-10">
        
        {/* Section Header */}
        {(serviceSettings.showBadge !== false || serviceSettings.showTitle !== false || serviceSettings.showSubtitle !== false) && (
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            {serviceSettings.showBadge !== false && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs sm:text-sm font-bold border border-[#C9A24B]/30 mb-3 shadow-xs">
                <Sparkles className="w-4 h-4 text-[#C9A24B]" />
                <span>
                  <EditableText
                    contentKey="home.services.badge"
                    fallback={serviceSettings.badge || 'خدماتنا المتكاملة'}
                    inline={true}
                  />
                </span>
              </div>
            )}

            {serviceSettings.showTitle !== false && (
              <h2 className="text-2xl sm:text-4xl font-cairo font-black text-stone-900 mb-4">
                <EditableText
                  contentKey="home.services.title"
                  fallback={serviceSettings.title || 'منظومة ضيافة متكاملة تحت سقف واحد'}
                  as="span"
                />
              </h2>
            )}

            {serviceSettings.showSubtitle !== false && (
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto">
                <EditableText
                  contentKey="home.services.subtitle"
                  fallback={serviceSettings.subtitle || 'نقدم لعملائنا من الشركات والمجموعات وضيوف الرحمن باقة خدمات شاملة تضمن أعلى مستويات الراحة والتميز من الاستقبال وحتى المغادرة.'}
                  as="span"
                  multiline={true}
                />
              </p>
            )}
          </motion.div>
        )}

        {/* Dynamic Cards Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${activeServices.length >= 4 ? 'lg:grid-cols-4' : activeServices.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2 max-w-4xl mx-auto'} gap-6 sm:gap-8`}>
          {activeServices.map((srv, idx) => {
            const Icon = (srv.iconName && ICON_MAP[srv.iconName]) || Sparkles;
            const buttonAction = (srv.buttonAction || 'contact') as ActivePage;

            return (
              <motion.div
                key={srv.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
                className="group relative rounded-3xl bg-white p-7 border border-[#E8E2D8] hover:border-[#C9A24B] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Icon & Badge */}
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#C9A24B]/15 text-[#B38A34] group-hover:bg-[#C9A24B] group-hover:text-white transition-colors duration-300 flex items-center justify-center shrink-0 shadow-xs">
                      <Icon className="w-7 h-7" />
                    </div>
                    {srv.showBadge !== false && (
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#FAF8F5] group-hover:bg-[#C9A24B]/10 text-stone-600 group-hover:text-[#B38A34] border border-[#E8E2D8] transition-colors">
                        <EditableText
                          contentKey={`service.${srv.id}.badge`}
                          fallback={language === 'en' ? (srv.badgeEn || srv.badge || '') : (srv.badge || '')}
                          inline={true}
                        />
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  {srv.showTitle !== false && (
                    <h3 className="font-cairo font-bold text-lg sm:text-xl text-stone-900 mb-3 group-hover:text-[#B38A34] transition-colors">
                      <EditableText
                        contentKey={`service.${srv.id}.title`}
                        fallback={language === 'en' ? (srv.titleEn || srv.title) : srv.title}
                        as="span"
                      />
                    </h3>
                  )}

                  {/* Description */}
                  {srv.showDescription !== false && (
                    <div className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
                      <EditableText
                        contentKey={`service.${srv.id}.desc`}
                        fallback={language === 'en' ? (srv.descriptionEn || srv.description) : srv.description}
                        as="span"
                        multiline={true}
                      />
                    </div>
                  )}

                  {/* Feature Bullets */}
                  {serviceSettings.showCardHighlights !== false && srv.showHighlights !== false && srv.highlights && srv.highlights.length > 0 && (
                    <ul className="space-y-2 mb-6 border-t border-[#FAF8F5] pt-4">
                      {srv.highlights.map((hl, hIdx) => (
                        <li key={hIdx} className="flex items-center gap-2 text-xs text-stone-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A24B] shrink-0" />
                          <span>
                            <EditableText
                              contentKey={`service.${srv.id}.hl.${hIdx}`}
                              fallback={hl}
                              inline={true}
                            />
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Footer Link Button */}
                {onNavigate && serviceSettings.showCardButtons !== false && srv.showButton !== false && (
                  <div className="pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => onNavigate((buttonAction as string) === 'whatsapp' ? 'contact' : buttonAction)}
                      className="w-full py-2.5 rounded-xl bg-stone-50 group-hover:bg-[#C9A24B] text-stone-700 group-hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>
                        <EditableText
                          contentKey={`service.${srv.id}.btn`}
                          fallback={srv.buttonText || (srv.id === 'service_hotel_management' ? 'استكشف الفنادق' : 'طلب عرض خدمة')}
                          inline={true}
                        />
                      </span>
                      <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? 'group-hover:-translate-x-1' : 'rotate-180 group-hover:translate-x-1'} transition-transform`} />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
