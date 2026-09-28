import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <aside
      aria-label="إشعارات النظام"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-[#181818] border border-[#C9A24B]/40 text-white shadow-2xl shadow-black/80 backdrop-blur-md animate-slideDown"
    >
      <div className="flex items-center gap-3">
        {toast.type === 'success' && (
          <div className="w-8 h-8 rounded-full bg-[#C9A24B]/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#DFBE72]" />
          </div>
        )}
        {toast.type === 'error' && (
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
        )}
        {toast.type === 'info' && (
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
        )}
        <span className="text-sm font-medium font-cairo leading-snug">{toast.message}</span>
      </div>

      <button
        onClick={onClose}
        className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
};
