import React from 'react';

export const BookingComIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor">
    <rect width="32" height="32" rx="6" fill="#003580" />
    <path
      d="M10 8h6.8c3.2 0 5.2 1.6 5.2 4.1 0 1.8-1.1 3.2-2.7 3.7 2.1.5 3.5 2.1 3.5 4.3 0 2.9-2.3 4.9-5.8 4.9H10V8zm4 3.5v3.6h2.5c1.2 0 1.9-.7 1.9-1.8 0-1.1-.7-1.8-1.9-1.8H14zm0 6.6v3.9h2.8c1.3 0 2.2-.8 2.2-2 0-1.2-.9-1.9-2.2-1.9H14z"
      fill="#ffffff"
    />
    <circle cx="24" cy="22" r="2.2" fill="#00BAFC" />
  </svg>
);

export const AgodaIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect width="32" height="32" rx="6" fill="#5856D6" />
    <circle cx="10" cy="12" r="3.2" fill="#FF2D55" />
    <circle cx="16" cy="10" r="3" fill="#FFCC00" />
    <circle cx="22" cy="12" r="3.2" fill="#4CD964" />
    <path
      d="M8.5 22.5L16 14l7.5 8.5H8.5z"
      fill="#ffffff"
    />
  </svg>
);

export const ExpediaIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect width="32" height="32" rx="6" fill="#FFCC00" />
    {/* Stylized dark blue airplane and arch */}
    <path
      d="M7 23.5c4.5-2.8 11.5-4.2 18-3"
      stroke="#002244"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M17.5 8.5L25 15.5l-4 .5-6-4.5-3.5.5 2.5 4.5-3.5.5-2-2-2 .5 1.5 3 16.5-2.5"
      fill="#002244"
    />
  </svg>
);

export const GoogleMapsIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect width="32" height="32" rx="6" fill="#ffffff" />
    <path
      d="M16 5C11.58 5 8 8.58 8 13c0 5.25 8 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8z"
      fill="#EA4335"
    />
    <path
      d="M16 17c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"
      fill="#ffffff"
    />
    <circle cx="16" cy="13" r="2.5" fill="#4285F4" />
  </svg>
);

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor">
    <rect width="32" height="32" rx="6" fill="#25D366" />
    <path
      d="M16 7.5C11.3 7.5 7.5 11.3 7.5 16c0 1.6.4 3.1 1.2 4.4L7.5 24.5l4.3-1.1c1.3.7 2.7 1.1 4.2 1.1 4.7 0 8.5-3.8 8.5-8.5s-3.8-8.5-8.5-8.5zm4.9 12.1c-.2.6-1.2 1.2-1.7 1.2-.5 0-1.1.2-3.4-.7-2.7-1.1-4.4-3.8-4.5-4-.1-.2-1.1-1.5-1.1-2.8 0-1.4.7-2.1 1-2.4.3-.3.6-.4.9-.4h.6c.2 0 .5 0 .7.5.3.6.9 2.2.9 2.4.1.2.1.3 0 .5-.1.2-.2.3-.4.5l-.5.6c-.2.2-.3.4-.1.7.4.7 1 1.5 1.8 2.2.9.8 1.8 1.2 2.5 1.5.2.1.5.1.7-.1.2-.2.8-1 1.1-1.3.2-.3.5-.2.8-.1.3.1 2 .9 2.3 1.1.3.2.5.3.6.4.1.2.1 1.1-.1 1.7z"
      fill="#ffffff"
    />
  </svg>
);

export const EmailIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect width="32" height="32" rx="6" fill="#EA4335" />
    <path
      d="M8 10h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2z"
      fill="#ffffff"
    />
    <path
      d="M8 11l8 6 8-6"
      stroke="#EA4335"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
