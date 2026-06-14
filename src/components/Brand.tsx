import { BrandMark } from './BrandMark'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark size={32} />
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Simple<span className="accent-text">Team</span>
        </span>
      )}
    </div>
  )
}
