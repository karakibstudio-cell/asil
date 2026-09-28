import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <span className="text-xs text-neutral-400 font-medium">العرض شارف على الانتهاء</span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 select-none" dir="ltr">
      <div className="flex flex-col items-center bg-[#1A1A1A] border border-[#2B2B2B] px-2 py-1 rounded-lg min-w-[38px]">
        <span className="font-mono text-xs sm:text-sm font-bold text-[#DFBE72]">
          {String(timeLeft.days).padStart(2, '0')}
        </span>
        <span className="text-[9px] text-neutral-400 font-cairo">يوم</span>
      </div>
      <span className="text-[#C9A24B] font-bold text-xs">:</span>
      <div className="flex flex-col items-center bg-[#1A1A1A] border border-[#2B2B2B] px-2 py-1 rounded-lg min-w-[38px]">
        <span className="font-mono text-xs sm:text-sm font-bold text-[#DFBE72]">
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className="text-[9px] text-neutral-400 font-cairo">ساعة</span>
      </div>
      <span className="text-[#C9A24B] font-bold text-xs">:</span>
      <div className="flex flex-col items-center bg-[#1A1A1A] border border-[#2B2B2B] px-2 py-1 rounded-lg min-w-[38px]">
        <span className="font-mono text-xs sm:text-sm font-bold text-[#DFBE72]">
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className="text-[9px] text-neutral-400 font-cairo">دقيقة</span>
      </div>
      <span className="text-[#C9A24B] font-bold text-xs">:</span>
      <div className="flex flex-col items-center bg-[#1A1A1A] border border-[#2B2B2B] px-2 py-1 rounded-lg min-w-[38px]">
        <span className="font-mono text-xs sm:text-sm font-bold text-[#DFBE72]">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className="text-[9px] text-neutral-400 font-cairo">ثانية</span>
      </div>
    </div>
  );
};
