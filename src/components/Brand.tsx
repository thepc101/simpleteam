import { BrandMark } from './BrandMark'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark size={26} />
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>
          SimpleTeam
        </span>
      )}
    </div>
  )
}
