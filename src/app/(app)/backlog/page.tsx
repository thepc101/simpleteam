'use client'

import { useMemo, useState } from 'react'
import { Inbox, Plus } from 'lucide-react'
import { useApp } from '@/lib/store'
import type { Task, TaskPriority } from '@/lib/types'
import { sortTasks } from '@/lib/utils'
import { TaskCard } from '@/components/TaskCard'
import { TaskModal } from '@/components/TaskModal'

export default function BacklogPage() {
  const { tasks, currentUser, isAdmin } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [mineOnly, setMineOnly] = useState(false)
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all')

  const backlog = useMemo(() => {
    return sortTasks(
      tasks.filter((t) => {
        if (t.deadline || t.status === 'completed') return false
        if (mineOnly && t.assigned_to !== currentUser?.id) return false
        if (priority !== 'all' && t.priority !== priority) return false
        return true
      }),
    )
  }, [tasks, mineOnly, priority, currentUser?.id])

  function openEdit(t: Task) {
    setEditing(t)
    setOpen(true)
  }
  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Pending Works</h2>
          <p className="text-sm text-slate-500">
            Tasks without a deadline — your team’s backlog for downtime.
          </p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary btn-sm self-start sm:!px-4 sm:!py-2 sm:!text-sm">
            <Plus className="h-4 w-4" /> New
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setMineOnly((v) => !v)}
          className={mineOnly ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
        >
          Assigned to me
        </button>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority | 'all')}
          className="input w-auto !py-1.5 text-sm"
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span className="ml-auto text-sm text-slate-400">{backlog.length} pending</span>
      </div>

      {backlog.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-16 text-center">
          <Inbox className="h-8 w-8 text-slate-300" />
          <p className="font-medium">Backlog is clear</p>
          <p className="text-sm text-slate-400">No undated tasks to pick up right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {backlog.map((t) => (
            <TaskCard key={t.id} task={t} onClick={() => openEdit(t)} />
          ))}
        </div>
      )}

      <TaskModal open={open} task={editing} onClose={() => setOpen(false)} />
    </div>
  )
}
