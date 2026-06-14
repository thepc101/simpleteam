export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SimpleTeam"
      className="shrink-0"
    >
      <rect width="28" height="28" rx="7" style={{ fill: 'var(--fg)' }} />
      <path
        d="M7.6 14.4 L12 18.6 L20.4 9.4"
        style={{ stroke: 'var(--bg)' }}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
