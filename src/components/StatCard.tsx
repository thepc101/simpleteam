import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'slate' | 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet' | 'sky'

const TONES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'slate',
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon: ReactNode
  tone?: Tone
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', TONES[tone])}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold sm:text-3xl">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}
