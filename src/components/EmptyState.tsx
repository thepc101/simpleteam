import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  desc,
  children,
}: {
  icon: ReactNode
  title: string
  desc?: string
  children?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-2 py-16 text-center">
      <div className="mb-1 text-slate-300 dark:text-slate-600">{icon}</div>
      <p className="font-medium">{title}</p>
      {desc && <p className="max-w-sm text-sm text-slate-400">{desc}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}
