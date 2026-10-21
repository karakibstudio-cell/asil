import React, { useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { Hotel, SiteSettings } from '../types';
import { BookingFlow } from './BookingFlow';
import { useLanguage } from '../context/LanguageContext';

export interface RoomBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: Hotel;
  siteSettings?: SiteSettings;
  preSelectedRoomId?: string;
  preSelectedMealId?: string;
  onSuccessToast?: (msg: string) => void;
  onOpenTrackModal?: (bookingCode: string) => void;
}

export const RoomBookingModal: React.FC<RoomBookingModalProps> = ({
  isOpen,
  onClose,
  hotel,
  siteSettings,
  preSelectedRoomId,
  preSelectedMealId,
  onSuccessToast,
  onOpenTrackModal
}) => {
  const { isRtl } = useLanguage();

  // Escape key listener to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        className="relative w-full max-w-4xl bg-[#FBFBFA] border border-stone-200/80 rounded-3xl md:rounded-[32px] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Top Bar with Close Button */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-stone-100 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 border border-[#C9A24B]/30 flex items-center justify-center text-[#C9A24B]">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-stone-500 block leading-tight">بوابة الحجز المباشر</span>
              <span className="text-sm font-extrabold text-stone-900 block leading-tight">{hotel.name}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors focus:outline-none"
            title="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-2 sm:p-4">
          <BookingFlow
            hotel={hotel}
            initialRoomId={preSelectedRoomId}
            initialMealId={preSelectedMealId}
            siteSettings={siteSettings}
            onOpenTrackModal={(code) => {
              onClose();
              if (onOpenTrackModal) onOpenTrackModal(code);
            }}
          />
        </div>
      </div>
    </div>
  );
};
