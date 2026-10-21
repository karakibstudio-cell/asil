import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const HotelDetailSkeleton: React.FC = () => {
  const { isRtl, language } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8F7F4] pt-24 pb-20 animate-pulse" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 space-y-8">
        
        {/* Breadcrumb & Navigation Skeleton */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-24 h-5 bg-stone-200 rounded-lg" />
            <div className="w-4 h-4 bg-stone-200 rounded" />
            <div className="w-40 h-5 bg-stone-200 rounded-lg" />
          </div>
          <div className="w-28 h-9 bg-stone-200 rounded-xl" />
        </div>

        {/* Hero Gallery Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[380px] sm:h-[480px]">
          {/* Main Large Image */}
          <div className="lg:col-span-2 h-full bg-stone-200 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            <div className="absolute bottom-6 start-6 space-y-2">
              <div className="w-32 h-6 bg-stone-300 rounded-full" />
              <div className="w-64 h-8 bg-stone-300 rounded-xl" />
            </div>
          </div>

          {/* Side Thumbnail Stack */}
          <div className="hidden lg:grid grid-rows-2 gap-4 h-full">
            <div className="h-full bg-stone-200 rounded-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            <div className="h-full bg-stone-200 rounded-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Header Bar: Title, Stars, Distance & Quick Booking Action */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-28 h-6 bg-[#C9A24B]/20 rounded-full" />
              <div className="w-24 h-5 bg-stone-200 rounded-lg" />
            </div>
            <div className="w-72 sm:w-96 h-9 bg-stone-200 rounded-2xl" />
            <div className="flex items-center gap-4 pt-1">
              <div className="w-44 h-5 bg-stone-200 rounded-lg" />
              <div className="w-32 h-5 bg-stone-200 rounded-lg" />
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-36 h-12 bg-[#C9A24B]/30 rounded-2xl flex-1 md:flex-initial" />
            <div className="w-32 h-12 bg-emerald-100 rounded-2xl flex-1 md:flex-initial" />
          </div>
        </div>

        {/* Tabs Bar Skeleton */}
        <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
          <div className="w-28 h-10 bg-[#C9A24B]/20 rounded-xl" />
          <div className="w-28 h-10 bg-stone-200 rounded-xl" />
          <div className="w-28 h-10 bg-stone-200 rounded-xl" />
          <div className="w-28 h-10 bg-stone-200 rounded-xl" />
        </div>

        {/* Content Body: Overview & Rooms Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-4">
              <div className="w-40 h-7 bg-stone-200 rounded-xl" />
              <div className="space-y-2.5">
                <div className="w-full h-4 bg-stone-200 rounded" />
                <div className="w-full h-4 bg-stone-200 rounded" />
                <div className="w-4/5 h-4 bg-stone-200 rounded" />
                <div className="w-2/3 h-4 bg-stone-200 rounded" />
              </div>
            </div>

            {/* Room Options Cards Skeleton */}
            <div className="space-y-4">
              <div className="w-48 h-7 bg-stone-200 rounded-xl" />
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="bg-white rounded-3xl p-6 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-20 bg-stone-200 rounded-2xl shrink-0" />
                    <div className="space-y-2">
                      <div className="w-48 h-6 bg-stone-200 rounded-lg" />
                      <div className="w-32 h-4 bg-stone-200 rounded" />
                      <div className="w-24 h-4 bg-stone-200 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="w-20 h-7 bg-stone-200 rounded-lg" />
                    <div className="w-28 h-11 bg-[#C9A24B]/30 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Booking Card Skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-stone-200 space-y-4 sticky top-28">
              <div className="w-32 h-6 bg-stone-200 rounded-lg" />
              <div className="w-full h-12 bg-stone-100 rounded-xl border border-stone-200" />
              <div className="w-full h-12 bg-stone-100 rounded-xl border border-stone-200" />
              <div className="w-full h-12 bg-[#C9A24B]/40 rounded-xl" />
              <div className="w-full h-12 bg-[#25D366]/30 rounded-xl" />
              <div className="pt-2 text-center text-xs text-stone-400">
                {language === 'en' ? 'Loading hotel details...' : 'جاري تحميل تفاصيل الفندق والغرف...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
