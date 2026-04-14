import React from "react";

interface IconProps {
  className?: string;
}

const defaultClass = "w-5 h-5";

export const GmailIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" fill="#EA4335"/>
    <path d="M2 6l10 7 10-7" stroke="#fff" strokeWidth="1.5" fill="none"/>
    <path d="M2 6v12h3V9.5L12 15l7-5.5V18h3V6l-10 7L2 6z" fill="#C5221F"/>
    <path d="M2 18h3V9.5l7 5.5 7-5.5V18h3" fill="#fff" opacity="0.3"/>
  </svg>
);

export const OutlookIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M22 6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6z" fill="#0078D4"/>
    <path d="M2 6l10 7 10-7" stroke="#fff" strokeWidth="1.2" fill="none"/>
    <ellipse cx="12" cy="13" rx="4" ry="3.5" fill="#fff" opacity="0.9"/>
    <ellipse cx="12" cy="13" rx="2.8" ry="2.3" stroke="#0078D4" strokeWidth="1.2" fill="none"/>
  </svg>
);

export const WhatsAppIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="#25D366"/>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.174-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51l-.57-.01c-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.174-1.413-.075-.124-.273-.198-.57-.347z" fill="#fff"/>
  </svg>
);

export const InstagramIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#FD5"/>
        <stop offset="50%" stopColor="#FF543E"/>
        <stop offset="100%" stopColor="#C837AB"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)"/>
    <circle cx="12" cy="12" r="4.5" stroke="#fff" strokeWidth="1.8" fill="none"/>
    <circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/>
  </svg>
);

export const LinkedInIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#0A66C2"/>
    <path d="M7.5 10v7M7.5 7.5v.01" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    <path d="M11 17v-4c0-1.5.8-2.5 2-2.5s1.5 1 1.5 2.5v4" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

export const TwilioIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="10" fill="#F22F46"/>
    <circle cx="12" cy="12" r="6" stroke="#fff" strokeWidth="1.5" fill="none"/>
    <circle cx="9.5" cy="9.5" r="1.3" fill="#fff"/>
    <circle cx="14.5" cy="9.5" r="1.3" fill="#fff"/>
    <circle cx="9.5" cy="14.5" r="1.3" fill="#fff"/>
    <circle cx="14.5" cy="14.5" r="1.3" fill="#fff"/>
  </svg>
);

export const TelegramIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="10" fill="#229ED9"/>
    <path d="M6.5 11.5l10-4.5-1.5 10-3.5-2.5-2 2.5-.5-3.5-2.5-2z" fill="#fff"/>
    <path d="M9.5 14l.5 3.5 2-2.5" fill="#B0D4F1"/>
    <path d="M9.5 14l6.5-5.5-5 4.5" stroke="#B0D4F1" strokeWidth="0.5" fill="none"/>
  </svg>
);

export const GoogleSheetsIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" fill="#0F9D58"/>
    <path d="M14 2l6 6h-4a2 2 0 01-2-2V2z" fill="#87CEAC"/>
    <rect x="7" y="11" width="10" height="8" rx="0.5" fill="#fff" opacity="0.9"/>
    <line x1="12" y1="11" x2="12" y2="19" stroke="#0F9D58" strokeWidth="0.8"/>
    <line x1="7" y1="15" x2="17" y2="15" stroke="#0F9D58" strokeWidth="0.8"/>
  </svg>
);

export const HubSpotIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" fill="#FF7A59"/>
    <path d="M12 6.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM14.5 11a2.5 2.5 0 11-5 0M9.5 14.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM14.5 14.5a1.5 1.5 0 11-3 0" fill="none" stroke="#fff" strokeWidth="1.3"/>
    <circle cx="15" cy="11" r="1.2" fill="#fff"/>
    <circle cx="9" cy="11" r="1.2" fill="#fff"/>
    <circle cx="12" cy="15" r="1.2" fill="#fff"/>
    <line x1="12" y1="6.5" x2="12" y2="9" stroke="#fff" strokeWidth="1.3"/>
  </svg>
);

export const SalesforceIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M9.5 5.5a4 4 0 016.5 1.5 3.5 3.5 0 013 6 3 3 0 01-2 5.5H7a3.5 3.5 0 01-1.5-6.5A4.5 4.5 0 019.5 5.5z" fill="#00A1E0"/>
  </svg>
);

export const PipedriveIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="10" fill="#1A1A1A"/>
    <path d="M10 6h4v6a4 4 0 01-4 4v-4a2 2 0 002-2V6z" fill="#25CE4A" fillRule="evenodd"/>
    <path d="M10 16v2" stroke="#25CE4A" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const AirtableIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#FCB400"/>
    <rect x="4" y="4" width="7" height="7" rx="1" fill="#18BFFF"/>
    <rect x="13" y="4" width="7" height="7" rx="1" fill="#F82B60"/>
    <rect x="4" y="13" width="7" height="7" rx="1" fill="#18BFFF" opacity="0.6"/>
    <rect x="13" y="13" width="7" height="7" rx="1" fill="#7C39ED"/>
  </svg>
);

export const ShopifyIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M17 3l2 1v14l-7 4-7-4V7l5-4 4 1" fill="#95BF47"/>
    <path d="M12 22l7-4V4l-2-1-3 16z" fill="#5E8E3E"/>
    <path d="M10.5 8.5c0-.8.7-1.2 1.5-1.2s1.3.4 1.3.4l.7-2s-.7-.6-2-.6c-2 0-3.3 1.2-3.3 3 0 3 3.5 2.5 3.5 4 0 .6-.5 1-1.3 1s-1.7-.6-1.7-.6l-.8 2s.9.7 2.3.7c1.8 0 3.3-1 3.3-3 0-3.2-3.5-2.7-3.5-3.7z" fill="#fff"/>
  </svg>
);

export const IntercomIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="4" fill="#1F8DED"/>
    <path d="M7 8v5M10 7v7M13 7v7M16 8v5M7 16s2 2 5 2 5-2 5-2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export const GoogleCalendarIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <rect x="3" y="5" width="18" height="16" rx="2" fill="#4285F4"/>
    <rect x="3" y="5" width="18" height="5" rx="2" fill="#1967D2"/>
    <rect x="7" y="3" width="2" height="4" rx="1" fill="#EA4335"/>
    <rect x="15" y="3" width="2" height="4" rx="1" fill="#EA4335"/>
    <rect x="6" y="12" width="3" height="2" rx="0.5" fill="#fff"/>
    <rect x="10.5" y="12" width="3" height="2" rx="0.5" fill="#fff"/>
    <rect x="15" y="12" width="3" height="2" rx="0.5" fill="#fff"/>
    <rect x="6" y="16" width="3" height="2" rx="0.5" fill="#fff"/>
    <rect x="10.5" y="16" width="3" height="2" rx="0.5" fill="#fff"/>
  </svg>
);

export const CalendlyIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <rect x="3" y="5" width="18" height="16" rx="2" fill="#006BFF"/>
    <rect x="3" y="5" width="18" height="5" fill="#0052CC"/>
    <rect x="7" y="3" width="2" height="4" rx="1" fill="#006BFF"/>
    <rect x="15" y="3" width="2" height="4" rx="1" fill="#006BFF"/>
    <circle cx="12" cy="15" r="3" stroke="#fff" strokeWidth="1.5" fill="none"/>
    <path d="M12 13.5v1.5l1.5 1" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
  </svg>
);

export const CalComIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <rect x="3" y="5" width="18" height="16" rx="2" fill="#292929"/>
    <rect x="3" y="5" width="18" height="5" fill="#111"/>
    <rect x="7" y="3" width="2" height="4" rx="1" fill="#666"/>
    <rect x="15" y="3" width="2" height="4" rx="1" fill="#666"/>
    <path d="M10 14l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const CsvIcon: React.FC<IconProps> = ({ className = defaultClass }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" fill="#0F9D58"/>
    <path d="M14 2l6 6h-4a2 2 0 01-2-2V2z" fill="#87CEAC"/>
    <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold" fontFamily="sans-serif">CSV</text>
  </svg>
);
