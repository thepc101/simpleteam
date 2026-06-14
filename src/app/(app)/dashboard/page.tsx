'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  Clock,
  ListTodo,
} from 'lucide-react'
import { useApp } from '@/lib/store'
import type { Task } from '@/lib/types'
import { CATEGORY_META, CATEGORY_ORDER } from '@/lib/catalog'
import { cn, isOverdue, relativeDeadline, sortTasks, startOfDay } from '@/lib/utils'
import { Avatar } from '@/components/Avatar'
import { StatCard } from '@/components/StatCard'
import { TaskModal } from '@/components/TaskModal'

export default function DashboardPage() {
  const { tasks, users, clients, currentUser } = useApp()
  const [editing, setEditing] = useState<Task | null>(null)

  const m = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'completed')
    const weekEnd = startOfDay(new Date()).getTime() + 7 * 86400000
    const today = startOfDay(new Date()).getTime()
    return {
      clients: clients.filter((c) => c.active).length,
      open: open.length,
      overdue: tasks.filter(isOverdue).length,
      dueWeek: open.filter(
        (t) => t.deadline && startOfDay(new Date(t.deadline)).getTime() >= today && +new Date(t.deadline) <= weekEnd,
      ).length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    }
  }, [tasks, clients])

  const byCategory = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'completed')
    return CATEGORY_ORDER.map((c) => ({
      key: c,
      meta: CATEGORY_META[c],
      count: open.filter((t) => t.category === c).length,
    })).filter((x) => x.count > 0)
  }, [tasks])
  const catMax = Math.max(...byCategory.map((c) => c.count), 1)

  const upcoming = useMemo(
    () => sortTasks(tasks.filter((t) => t.deadline && t.status !== 'completed')).slice(0, 6),
    [tasks],
  )

  const workload = useMemo(() => {
    return users
      .map((u) => ({ user: u, count: tasks.filter((t) => t.assigned_to === u.id && t.status !== 'completed').length }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [tasks, users])

  const statusSeg = [
    { label: 'Pending', val: m.pending, color: 'bg-slate-400' },
    { label: 'In progress', val: m.inProgress, color: 'bg-indigo-500' },
    { label: 'Completed', val: m.completed, color: 'bg-emerald-500' },
  ]
  const segTotal = tasks.length || 1

  const hr = new Date().getHours()
  const greeting = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          {greeting}, {currentUser?.full_name.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-slate-500">Here’s your firm’s compliance pulse for today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Active Clients" value={m.clients} icon={<Building2 className="h-4 w-4" />} tone="indigo" sub="engaged" />
        <StatCard label="Open Tasks" value={m.open} icon={<ListTodo className="h-4 w-4" />} tone="slate" sub={`${m.inProgress} in progress`} />
        <StatCard label="Overdue" value={m.overdue} icon={<AlertTriangle className="h-4 w-4" />} tone="rose" sub="need attention" />
        <StatCard label="Due This Week" value={m.dueWeek} icon={<CalendarClock className="h-4 w-4" />} tone="amber" sub="upcoming filings" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <h3 className="text-sm font-semibold">Status overview</h3>
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              {statusSeg.map((s) => (
                <div key={s.label} className={s.color} style={{ width: `${(s.val / segTotal) * 100}%` }} title={`${s.label}: ${s.val}`} />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {statusSeg.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full', s.color)} />
                  <span className="text-sm text-slate-600 dark:text-slate-300">{s.label}</span>
                  <span className="ml-auto text-sm font-semibold">{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold">Open work by compliance area</h3>
            <div className="mt-4 space-y-3">
              {byCategory.length === 0 && <p className="text-sm text-slate-400">No open work. 🎉</p>}
              {byCategory.map((c) => (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm text-slate-500">{c.meta.label}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={cn('h-full rounded-full', c.meta.bar)} style={{ width: `${(c.count / catMax) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-sm font-semibold">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold">Team workload</h3>
          <p className="text-xs text-slate-400">Open tasks per member</p>
          <div className="mt-4 space-y-3">
            {workload.length === 0 && <p className="text-sm text-slate-400">Nothing assigned.</p>}
            {workload.map(({ user, count }) => (
              <div key={user.id} className="flex items-center gap-3">
                <Avatar user={user} size={32} />
                <span className="truncate text-sm font-medium">{user.full_name}</span>
                <span className="ml-auto chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Upcoming &amp; overdue filings</h3>
          <Link href="/tasks" className="link inline-flex items-center gap-1 text-xs">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {upcoming.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No scheduled filings. 🎉</p>}
          {upcoming.map((t) => {
            const od = isOverdue(t)
            const cat = CATEGORY_META[t.category]
            return (
              <button key={t.id} onClick={() => setEditing(t)} className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', od ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' : 'bg-slate-100 text-slate-500 dark:bg-slate-800')}>
                  <Clock className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                <span className={cn('chip hidden shrink-0 sm:inline-flex', cat.chip)}>{cat.short}</span>
                <span className={cn('shrink-0 text-xs font-medium', od ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400')}>
                  {relativeDeadline(t.deadline)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <TaskModal open={!!editing} task={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
