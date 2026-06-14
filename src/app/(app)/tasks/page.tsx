'use client'

import { useMemo, useState } from 'react'
import { Columns3, List, Plus, Search } from 'lucide-react'
import { useApp } from '@/lib/store'
import type { Task, TaskCategory, TaskPriority, TaskStatus } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'
import { CATEGORY_META, CATEGORY_ORDER } from '@/lib/catalog'
import { cn, sortTasks } from '@/lib/utils'
import { TaskCard } from '@/components/TaskCard'
import { KanbanBoard } from '@/components/KanbanBoard'
import { TaskModal } from '@/components/TaskModal'
import { EmptyState } from '@/components/EmptyState'

const STATUS_TABS: (TaskStatus | 'all')[] = ['all', 'pending', 'in_progress', 'completed']

export default function TasksPage() {
  const { tasks, users, clients, isAdmin } = useApp()
  const [view, setView] = useState<'list' | 'board'>('list')
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<TaskStatus | 'all'>('all')
  const [category, setCategory] = useState<TaskCategory | 'all'>('all')
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all')
  const [assignee, setAssignee] = useState<string>('all')
  const [clientId, setClientId] = useState<string>('all')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return tasks.filter((t) => {
      if (category !== 'all' && t.category !== category) return false
      if (priority !== 'all' && t.priority !== priority) return false
      if (assignee !== 'all' && t.assigned_to !== assignee) return false
      if (clientId !== 'all' && t.client_id !== clientId) return false
      if (needle && !`${t.title} ${t.description ?? ''}`.toLowerCase().includes(needle)) return false
      return true
    })
  }, [tasks, q, category, priority, assignee, clientId])

  const listItems = useMemo(
    () => sortTasks(tab === 'all' ? filtered : filtered.filter((t) => t.status === tab)),
    [filtered, tab],
  )

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
          <h2 className="text-xl font-bold tracking-tight">All Tasks</h2>
          <p className="text-sm text-slate-500">{filtered.length} tasks · {view === 'list' ? 'List view' : 'Board view'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            <button onClick={() => setView('list')} className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition', view === 'list' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500')}>
              <List className="h-4 w-4" /> List
            </button>
            <button onClick={() => setView('board')} className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition', view === 'board' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500')}>
              <Columns3 className="h-4 w-4" /> Board
            </button>
          </div>
          {isAdmin && (
            <button onClick={openCreate} className="btn-primary btn-sm sm:!px-4 sm:!py-2 sm:!text-sm">
              <Plus className="h-4 w-4" /> New
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" className="input pl-9" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory | 'all')} className="input w-auto">
          <option value="all">All compliance</option>
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>{CATEGORY_META[c].label}</option>
          ))}
        </select>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input w-auto">
          <option value="all">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority | 'all')} className="input w-auto">
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="input w-auto">
          <option value="all">Everyone</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </select>
      </div>

      {view === 'list' ? (
        <>
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-slate-800/60">
            {STATUS_TABS.map((s) => (
              <button key={s} onClick={() => setTab(s)} className={cn('flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition', tab === s ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
                <span className="ml-1.5 text-xs text-slate-400">{s === 'all' ? filtered.length : filtered.filter((t) => t.status === s).length}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {listItems.length === 0 && (
              <EmptyState icon={<Search className="h-8 w-8" />} title="No tasks match your filters">
                {isAdmin && (
                  <button onClick={openCreate} className="btn-outline btn-sm">
                    <Plus className="h-4 w-4" /> Create a task
                  </button>
                )}
              </EmptyState>
            )}
            {listItems.map((t) => (
              <TaskCard key={t.id} task={t} onClick={() => openEdit(t)} />
            ))}
          </div>
        </>
      ) : (
        <KanbanBoard tasks={filtered} onOpen={openEdit} />
      )}

      <TaskModal open={open} task={editing} onClose={() => setOpen(false)} />
    </div>
  )
}
