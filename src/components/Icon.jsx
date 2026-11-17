// A small set of line icons drawn as inline SVG (no icon library needed).
const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  arrowRight: <path d="M5 12h14m-5-5 5 5-5 5" />,
  download: <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 20h14" />,
  refresh: <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8m0-4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16m0 4v-4h-4" />,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.2" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" /></>,
  list: <path d="M4 6h16M4 12h16M4 18h16" />,
  bell: <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15ZM10 20.5a2 2 0 0 0 4 0" />,
  chart: <path d="M4 20h16M7 16v-5M12 16V7M17 16v-8" />,
  scale: <path d="M12 4v16M5 20h14M6 8h12M6 8l-3 6a3 3 0 0 0 6 0Zm12 0-3 6a3 3 0 0 0 6 0Z" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16Zm9-13 4 4" />,
  trash: <path d="M5 7h14M10 7V4.5h4V7m-7 0 .8 12.5h8.4L17 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.01" /></>,
  alert: <path d="M12 4 2.8 19.5h18.4ZM12 10v4M12 17v.01" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  printer: <path d="M7 9V4h10v5M7 17H4.5v-7h15v7H17M7 14h10v6H7Z" />,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" /><path d="m4 6.5 8 6 8-6" /></>,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />,
  sort: <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />,
  sortUp: <path d="m8 14 4-4 4 4" />,
  sortDown: <path d="m8 10 4 4 4-4" />,
  pin: <><path d="M12 21s6.5-6.2 6.5-11a6.5 6.5 0 0 0-13 0c0 4.8 6.5 11 6.5 11Z" /><circle cx="12" cy="10" r="2.2" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="1.5" /><path d="M4 10h16M8.5 3v4M15.5 3v4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
};

export default function Icon({ name, size = 18, filled = false, className = '', title }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}

// The AgriCompare mark: a sprout growing out of a bar, for "crops + prices".
export function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo-mark">
      <rect width="32" height="32" rx="9" fill="#1F6B47" />
      <path d="M16 25V14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 16c0-4.2 2.8-7 7-7 0 4.2-2.8 7-7 7Z" fill="#fff" />
      <path d="M16 19c0-3.4-2.3-5.6-5.8-5.6 0 3.4 2.3 5.6 5.8 5.6Z" fill="#cfe5d4" />
      <path d="M9 25h14" stroke="#e4c46a" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
