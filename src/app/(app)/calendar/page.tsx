'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '@/lib/store'
import type { Task } from '@/lib/types'
import { CATEGORY_META } from '@/lib/catalog'
import { cn, isOverdue, startOfDay } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { TaskModal } from '@/components/TaskModal'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

export default function CalendarPage() {
  const { tasks, clients, clientById } = useApp()
  const [cursor, setCursor] = useState(() => {
    const d = startOfDay(new Date())
    d.setDate(1)
    return d
  })
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [editing, setEditing] = useState<Task | null>(null)

  const today = startOfDay(new Date())

  const cells = useMemo(() => {
    const first = new Date(cursor)
    const offset = (first.getDay() + 6) % 7 // Monday-first
    const start = new Date(first)
    start.setDate(1 - offset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [cursor])

  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>()
    for (const t of tasks) {
      if (!t.deadline) continue
      if (clientFilter !== 'all' && t.client_id !== clientFilter) continue
      const d = startOfDay(new Date(t.deadline))
      const k = keyOf(d)
      const arr = m.get(k)
      if (arr) arr.push(t)
      else m.set(k, [t])
    }
    return m
  }, [tasks, clientFilter])

  const agenda = useMemo(
    () =>
      cells
        .filter((d) => d.getMonth() === cursor.getMonth() && byDay.get(keyOf(d))?.length)
        .map((d) => ({ d, items: byDay.get(keyOf(d))! })),
    [cells, cursor, byDay],
  )

  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const monthCount = useMemo(
    () =>
      cells.filter((d) => d.getMonth() === cursor.getMonth()).reduce((n, d) => n + (byDay.get(keyOf(d))?.length ?? 0), 0),
    [cells, cursor, byDay],
  )

  function shift(delta: number) {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() + delta)
    setCursor(d)
  }
  function goToday() {
    const d = startOfDay(new Date())
    d.setDate(1)
    setCursor(d)
  }

  function TaskChip({ t }: { t: Task }) {
    const cat = CATEGORY_META[t.category]
    const od = isOverdue(t)
    const done = t.status === 'completed'
    return (
      <button
        onClick={() => setEditing(t)}
        title={`${t.title}${clientById(t.client_id) ? ` · ${clientById(t.client_id)!.name}` : ''}`}
        className={cn(
          'flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] leading-tight transition hover:bg-slate-100 dark:hover:bg-slate-800',
          done && 'opacity-50',
        )}
      >
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', cat.bar)} />
        <span className={cn('truncate', od && 'font-medium text-rose-600 dark:text-rose-400', done && 'line-through')}>
          {t.title}
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Compliance Calendar" subtitle={`${monthCount} filings this month`} icon={<CalendarDays className="h-6 w-6 text-slate-400" />}>
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="input w-auto">
          <option value="all">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </PageHeader>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{monthLabel}</h3>
        <div className="flex items-center gap-1.5">
          <button onClick={goToday} className="btn-outline btn-sm">Today</button>
          <button onClick={() => shift(-1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => shift(1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Desktop / tablet grid */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 sm:block">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2 text-center text-xs font-semibold text-slate-400">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === cursor.getMonth()
            const isToday = d.getTime() === today.getTime()
            const dayTasks = byDay.get(keyOf(d)) ?? []
            return (
              <div
                key={i}
                className={cn(
                  'min-h-[92px] border-b border-r border-slate-100 p-1.5 dark:border-slate-800/70',
                  i % 7 === 6 && 'border-r-0',
                  i >= 35 && 'border-b-0',
                  !inMonth && 'bg-slate-50/60 dark:bg-slate-900/40',
                )}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                      isToday ? 'accent-bg font-semibold text-white' : inMonth ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600',
                    )}
                  >
                    {d.getDate()}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <TaskChip key={t.id} t={t} />
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="px-1 text-[10px] font-medium text-slate-400">+{dayTasks.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile agenda */}
      <div className="space-y-3 sm:hidden">
        {agenda.length === 0 && (
          <div className="card py-12 text-center text-sm text-slate-400">No filings scheduled this month.</div>
        )}
        {agenda.map(({ d, items }) => {
          const isToday = d.getTime() === today.getTime()
          return (
            <div key={keyOf(d)} className="card p-3">
              <p className={cn('mb-2 text-sm font-semibold', isToday && 'accent-text')}>
                {d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                {isToday && ' · Today'}
              </p>
              <div className="space-y-1">
                {items.map((t) => {
                  const cat = CATEGORY_META[t.category]
                  return (
                    <button key={t.id} onClick={() => setEditing(t)} className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <span className={cn('chip shrink-0', cat.chip)}>{cat.short}</span>
                      <span className={cn('min-w-0 flex-1 truncate text-sm', t.status === 'completed' && 'text-slate-400 line-through', isOverdue(t) && 'font-medium text-rose-600 dark:text-rose-400')}>
                        {t.title}
                      </span>
                      {t.client_id && <span className="shrink-0 text-xs text-slate-400">{clientById(t.client_id)?.name?.split(' ')[0]}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {Object.values(CATEGORY_META).map((m) => (
          <span key={m.label} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <span className={cn('h-2 w-2 rounded-full', m.bar)} /> {m.label}
          </span>
        ))}
      </div>

      <TaskModal open={!!editing} task={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
