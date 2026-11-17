// Small flat crop illustrations, drawn as inline SVG, used as commodity thumbnails.
const ART = {
  Onion: (
    <>
      <path d="M12 3.5v3.2M12 6.7c-.6-1.6-1.8-2.7-3-3.1M12 6.7c.6-1.6 1.8-2.7 3-3.1" stroke="#4f8a3c" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M12 6.5c-1.3 2.4-5.6 4.6-5.6 9a5.6 5.6 0 0 0 11.2 0c0-4.4-4.3-6.6-5.6-9Z" fill="#b5527e" />
      <path d="M12 8.5c-.8 2-2.6 4-2.6 7.2 0 2 1 3.6 2.6 4.2M12 8.5c.8 2 2.6 4 2.6 7.2 0 2-1 3.6-2.6 4.2" stroke="#e7a9c4" strokeWidth="1" fill="none" />
      <path d="M10.6 21.3h2.8" stroke="#8a3a5d" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  Tomato: (
    <>
      <circle cx="12" cy="13.8" r="7" fill="#e0472f" />
      <ellipse cx="9.3" cy="11.6" rx="1.6" ry="1" fill="#f28b74" transform="rotate(-30 9.3 11.6)" />
      <path d="M12 8.2c-1.3-1.3-3.3-1.4-4.6-.6 1.5.1 2.4.8 2.9 1.6M12 8.2c1.3-1.3 3.3-1.4 4.6-.6-1.5.1-2.4.8-2.9 1.6M12 8.2c-.3-1.2.1-2.6 1-3.6" stroke="#3f8a3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  Potato: (
    <>
      <path d="M5.2 14.2c-.9-3.8 2.2-7.6 6.6-8.3 4.4-.7 7.5 1.6 7.6 5.3.1 3.9-3 7.4-7.3 7.9-3.4.4-6.2-1.5-6.9-4.9Z" fill="#c99b5c" />
      <path d="M7.5 11.6c1-2.4 3.2-3.8 5.8-3.9" stroke="#e2c08e" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="10" cy="14.6" r=".8" fill="#8a6230" /><circle cx="14.4" cy="12.2" r=".8" fill="#8a6230" />
      <circle cx="15.2" cy="15.6" r=".7" fill="#8a6230" /><circle cx="8.6" cy="11.8" r=".6" fill="#8a6230" />
    </>
  ),
  Wheat: (
    <>
      <path d="M12 21.5V7.5" stroke="#9c7420" strokeWidth="1.4" strokeLinecap="round" />
      {[8.5, 11.5, 14.5].map((y) => (
        <g key={y} fill="#d9a52f">
          <ellipse cx="9.7" cy={y} rx="1.5" ry="2.6" transform={`rotate(-35 9.7 ${y})`} />
          <ellipse cx="14.3" cy={y} rx="1.5" ry="2.6" transform={`rotate(35 14.3 ${y})`} />
        </g>
      ))}
      <ellipse cx="12" cy="5.4" rx="1.3" ry="2.3" fill="#d9a52f" />
      <path d="M12 3.2V1.8M9 6.2 7.6 4.8M15 6.2l1.4-1.4" stroke="#b88a24" strokeWidth="1" strokeLinecap="round" />
    </>
  ),
  Rice: (
    <>
      <path d="M4 12.5h16a8 8 0 0 1-16 0Z" fill="#5f8f6a" />
      <path d="M4 12.5h16" stroke="#3f6c4a" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.5 12.5c.5-3 3.3-5.2 6.5-5.2s6 2.2 6.5 5.2Z" fill="#f4efe1" />
      {[[9, 9.6, -30], [12, 8.7, 0], [15, 9.6, 30], [10.4, 11.3, 20], [13.7, 11.3, -20], [7.7, 11.6, -10], [16.3, 11.6, 10]].map(([x, y, r]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx=".55" ry="1.1" fill="#d8ccad" transform={`rotate(${r} ${x} ${y})`} />
      ))}
      <path d="M9 21h6" stroke="#3f6c4a" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  Soyabean: (
    <>
      <path d="M6.2 18.6c-2-2-1.4-5.3 1.4-7.9l4.6-4.3c2.4-2.2 5.4-2.6 7-1 1.6 1.6 1.2 4.6-1 7l-4.3 4.6c-2.6 2.8-5.9 3.4-7.7 1.6Z" fill="#8bb04a" />
      <circle cx="9.2" cy="15.4" r="2" fill="#d7c46a" /><circle cx="12.6" cy="12" r="2" fill="#d7c46a" /><circle cx="16" cy="8.6" r="2" fill="#d7c46a" />
      <path d="M18.6 5.4l1.8-1.8" stroke="#5f7f2c" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
};

export default function CropThumb({ commodity, small = false, size }) {
  const cls = size || (small ? 'sm' : '');
  const px = { xs: 17, sm: 23 }[cls] || 32;
  return (
    <span className={`crop-thumb crop-${commodity} ${cls}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={px} height={px}>{ART[commodity]}</svg>
    </span>
  );
}
