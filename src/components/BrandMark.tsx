export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SimpleTeam logo"
      className="shrink-0 drop-shadow-sm"
    >
      <defs>
        <linearGradient id="stm-tile" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: 'rgb(var(--accent))' }} />
          <stop offset="1" style={{ stopColor: 'rgb(var(--accent-strong))' }} />
        </linearGradient>
        <linearGradient id="stm-shine" x1="0" y1="0" x2="0" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#stm-tile)" />
      <rect width="32" height="32" rx="9" fill="url(#stm-shine)" />
      {/* checkmark with a checkbox-dot at the pivot */}
      <path
        d="M8.4 16.8 L13.2 21.6 L23.4 10.4"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.4" cy="16.8" r="2" fill="#ffffff" />
    </svg>
  )
}
