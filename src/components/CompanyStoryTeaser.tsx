import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Sparkles, MapPin, Award, ArrowLeft, CheckCircle2, PhoneCall } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { EditableText } from './EditableText';
import { ActivePage, StoryTeaserSettings } from '../types';
import { DEFAULT_STORY_TEASER } from '../services/firebase';

interface CompanyStoryTeaserProps {
  onNavigate?: (page: ActivePage, hotelId?: string) => void;
  className?: string;
  showExploreButton?: boolean;
  settings?: StoryTeaserSettings;
}

export const CompanyStoryTeaser: React.FC<CompanyStoryTeaserProps> = ({
  onNavigate,
  className = '',
  showExploreButton = true,
  settings
}) => {
  const { language, isRtl } = useLanguage();
  const teaser = settings || DEFAULT_STORY_TEASER;

  // If section is explicitly disabled by admin, don't render
  if (teaser.isEnabled === false) {
    return null;
  }

  const locationTags = (teaser.locationTags && teaser.locationTags.length > 0)
    ? teaser.locationTags.filter(t => t.isActive !== false)
    : (DEFAULT_STORY_TEASER.locationTags || []).filter(t => t.isActive !== false);

  const showcasePoints = (teaser.showcasePoints && teaser.showcasePoints.length > 0)
    ? teaser.showcasePoints.filter(p => p.isActive !== false)
    : (DEFAULT_STORY_TEASER.showcasePoints || []).filter(p => p.isActive !== false);

  return (
    <section id="company-story-teaser" className={`py-20 sm:py-24 bg-white relative overflow-hidden border-t border-[#E8E2D8] ${className}`}>
      {/* Decorative Golden Ambient Glows */}
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-[#C9A24B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-24 w-80 h-80 bg-[#C9A24B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Narrative Content (7 Cols) */}
          <motion.div 
            initial={{ opacity: 0, x: isRtl ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Badge */}
            {teaser.showBadge !== false && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs sm:text-sm font-bold border border-[#C9A24B]/30 shadow-2xs">
                <Sparkles className="w-4 h-4 text-[#C9A24B]" />
                <span>
                  <EditableText
                    contentKey="story.badge"
                    fallback={teaser.badge || 'نبذة عن شركة برستيج'}
                    inline={true}
                  />
                </span>
              </div>
            )}

            {/* Title */}
            {teaser.showTitle !== false && (
              <h2 className="text-2xl sm:text-4xl font-cairo font-black text-stone-900 leading-tight">
                <EditableText
                  contentKey="story.title"
                  fallback={teaser.title || 'برستيج.. حيث تلتقي فخامة الضيافة بروحانية المكان'}
                  as="span"
                />
              </h2>
            )}

            {/* Main Story Paragraphs */}
            {teaser.showParagraphs !== false && (
              <div className="space-y-4 text-stone-700 text-sm sm:text-base leading-relaxed">
                {teaser.showParagraph1 !== false && (
                  <p className="font-medium text-stone-800">
                    <EditableText
                      contentKey="story.paragraph1"
                      fallback={teaser.paragraph1 || DEFAULT_STORY_TEASER.paragraph1!}
                      as="span"
                      multiline={true}
                    />
                  </p>
                )}

                {teaser.showParagraph2 !== false && (
                  <p>
                    <EditableText
                      contentKey="story.paragraph2"
                      fallback={teaser.paragraph2 || DEFAULT_STORY_TEASER.paragraph2!}
                      as="span"
                      multiline={true}
                    />
                  </p>
                )}

                {teaser.showParagraph3 !== false && (
                  <p className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-stone-900 font-semibold">
                    <EditableText
                      contentKey="story.paragraph3"
                      fallback={teaser.paragraph3 || DEFAULT_STORY_TEASER.paragraph3!}
                      as="span"
                      multiline={true}
                    />
                  </p>
                )}
              </div>
            )}

            {/* Key Locations / Focus Areas */}
            {teaser.showLocationTags !== false && locationTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                {locationTags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 text-stone-800 text-xs font-bold border border-stone-200">
                    <MapPin className="w-3.5 h-3.5 text-[#B38A34]" />
                    <span>
                      <EditableText
                        contentKey={`story.tag.${tag.id}`}
                        fallback={tag.text}
                        inline={true}
                      />
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA Buttons */}
            {showExploreButton && onNavigate && (
              <div className="flex flex-wrap items-center gap-4 pt-4">
                {teaser.showExploreButton !== false && (
                  <button
                    type="button"
                    onClick={() => onNavigate('about')}
                    className="px-6 py-3.5 rounded-2xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>
                      <EditableText
                        contentKey="story.exploreBtn"
                        fallback={teaser.exploreButtonText || 'اقرأ المزيد عنا'}
                        inline={true}
                      />
                    </span>
                    <ArrowLeft className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
                  </button>
                )}

                {teaser.showContactButton !== false && (
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm border border-stone-300 hover:border-[#C9A24B] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4 text-[#B38A34]" />
                    <span>
                      <EditableText
                        contentKey="story.contactBtn"
                        fallback={teaser.contactButtonText || 'عروض الشركات والمجموعات'}
                        inline={true}
                      />
                    </span>
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* Visual Showcase Card (5 Cols) */}
          {teaser.showShowcaseCard !== false && (
            <motion.div
              initial={{ opacity: 0, x: isRtl ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl p-8 bg-gradient-to-br from-[#1C1917] via-[#2A241C] to-[#1C1917] text-white shadow-2xl border border-[#C9A24B]/30 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A24B]/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-[#C9A24B]/20 border border-[#C9A24B]/40 flex items-center justify-center text-[#DFBE72]">
                      <Building2 className="w-7 h-7" />
                    </div>
                    {teaser.showShowcaseYear !== false && (
                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#C9A24B]/20 text-[#DFBE72] border border-[#C9A24B]/40">
                        <EditableText
                          contentKey="story.showcase.year"
                          fallback={teaser.showcaseEstablishedYear || 'منذ 2010 م'}
                          inline={true}
                        />
                      </span>
                    )}
                  </div>

                  <div>
                    {teaser.showShowcaseBadge !== false && (
                      <span className="text-xs font-bold text-[#DFBE72] uppercase tracking-wider block mb-1">
                        <EditableText
                          contentKey="story.showcase.badge"
                          fallback={teaser.showcaseBadge || 'شراكات استراتيجية موثوقة'}
                          inline={true}
                        />
                      </span>
                    )}
                    {teaser.showShowcaseTitle !== false && (
                      <h3 className="font-cairo font-black text-2xl text-white leading-snug">
                        <EditableText
                          contentKey="story.showcase.title"
                          fallback={teaser.showcaseTitle || 'إدارة وتشغيل أكثر من 7 فنادق راقية بمكة والمدينة'}
                          as="span"
                        />
                      </h3>
                    )}
                  </div>

                  {teaser.showShowcasePoints !== false && showcasePoints.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {showcasePoints.map((point) => (
                        <div key={point.id} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                          <CheckCircle2 className="w-5 h-5 text-[#DFBE72] shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-white">
                              <EditableText
                                contentKey={`story.point.${point.id}.title`}
                                fallback={point.title}
                                inline={true}
                              />
                            </h4>
                            <p className="text-xs text-stone-300">
                              <EditableText
                                contentKey={`story.point.${point.id}.desc`}
                                fallback={point.description}
                                inline={true}
                              />
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {teaser.showShowcaseLicense !== false && (
                    <div className="pt-2 text-center">
                      <span className="text-xs text-stone-400">
                        <EditableText
                          contentKey="story.showcase.licenseNote"
                          fallback={teaser.showcaseLicenseNote || 'شركة مرخصة ومعتمدة من وزارة الحج والعمرة والهيئة السعودية للسياحة'}
                          inline={true}
                        />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </section>
  );
};
