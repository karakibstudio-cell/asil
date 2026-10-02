import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ScrollNavigationButton: React.FC = () => {
  const [showButtons, setShowButtons] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      setIsAtTop(scrollY < 120);
      setIsAtBottom(scrollY + clientHeight >= scrollHeight - 120);
      setShowButtons(scrollHeight > clientHeight + 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  if (!showButtons) return null;

  return (
    <div 
      id="floating-scroll-navigation"
      className="fixed bottom-24 left-6 sm:bottom-28 sm:left-7 z-40 flex flex-col items-center gap-2 select-none print:hidden"
      dir="ltr"
    >
      <AnimatePresence>
        {/* Scroll To Top Button */}
        {!isAtTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 10 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={scrollToTop}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-900/85 hover:bg-[#C9A24B] text-white shadow-xl hover:shadow-[#C9A24B]/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors cursor-pointer group"
            title="الصعود لأعلى الصفحة (Scroll to Top)"
            aria-label="الصعود لأعلى الصفحة"
          >
            <ChevronUp className="w-5 h-5 text-[#DFBE72] group-hover:text-white transition-colors" />
          </motion.button>
        )}

        {/* Scroll To Bottom Button */}
        {!isAtBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: -10 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={scrollToBottom}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-900/85 hover:bg-[#C9A24B] text-white shadow-xl hover:shadow-[#C9A24B]/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors cursor-pointer group"
            title="النزول لأسفل الصفحة (Scroll to Bottom)"
            aria-label="النزول لأسفل الصفحة"
          >
            <ChevronDown className="w-5 h-5 text-[#DFBE72] group-hover:text-white transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
