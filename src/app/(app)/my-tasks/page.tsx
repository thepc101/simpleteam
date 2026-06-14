'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, CheckCircle2, Inbox, Sun } from 'lucide-react'
import { useApp } from '@/lib/store'
import type { Task } from '@/lib/types'
import { isDueToday, isOverdue, isUpcoming, sortTasks } from '@/lib/utils'
import { TaskCard } from '@/components/TaskCard'
import { TaskModal } from '@/components/TaskModal'

export default function MyTasksPage() {
  const { tasks, currentUser } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  const groups = useMemo(() => {
    const mine = tasks.filter((t) => t.assigned_to === currentUser?.id)
    return {
      overdue: sortTasks(mine.filter(isOverdue)),
      today: sortTasks(mine.filter((t) => isDueToday(t) && t.status !== 'completed')),
      upcoming: sortTasks(mine.filter((t) => isUpcoming(t) && t.status !== 'completed')),
      later: sortTasks(mine.filter((t) => !t.deadline && t.status !== 'completed')),
      completed: sortTasks(mine.filter((t) => t.status === 'completed')),
      count: mine.filter((t) => t.status !== 'completed').length,
    }
  }, [tasks, currentUser?.id])

  function openEdit(t: Task) {
    setEditing(t)
    setOpen(true)
  }

  const sections = [
    { key: 'overdue', title: 'Overdue', icon: AlertTriangle, tone: 'text-rose-500', items: groups.overdue },
    { key: 'today', title: 'Today', icon: Sun, tone: 'text-amber-500', items: groups.today },
    { key: 'upcoming', title: 'Upcoming', icon: CalendarClock, tone: 'text-indigo-500', items: groups.upcoming },
    { key: 'later', title: 'Later (no deadline)', icon: Inbox, tone: 'text-slate-400', items: groups.later },
    { key: 'completed', title: 'Completed', icon: CheckCircle2, tone: 'text-emerald-500', items: groups.completed },
  ] as const

  const allEmpty = sections.every((s) => s.items.length === 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">My Tasks</h2>
        <p className="text-sm text-slate-500">
          {groups.count} open {groups.count === 1 ? 'task' : 'tasks'} assigned to you.
        </p>
      </div>

      {allEmpty && (
        <div className="card flex flex-col items-center gap-2 py-16 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="font-medium">You’re all caught up!</p>
          <p className="text-sm text-slate-400">Nothing is assigned to you right now.</p>
        </div>
      )}

      {sections.map(
        (s) =>
          s.items.length > 0 && (
            <section key={s.key}>
              <div className="mb-2 flex items-center gap-2">
                <s.icon className={`h-4 w-4 ${s.tone}`} />
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <span className="chip bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {s.items.length}
                </span>
              </div>
              <div className="space-y-2">
                {s.items.map((t) => (
                  <TaskCard key={t.id} task={t} onClick={() => openEdit(t)} />
                ))}
              </div>
            </section>
          ),
      )}

      <TaskModal open={open} task={editing} onClose={() => setOpen(false)} />
    </div>
  )
}
