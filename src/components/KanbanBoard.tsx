'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import type { Task, TaskStatus } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'
import { cn, sortTasks, STATUS_DOT } from '@/lib/utils'
import { TaskCard } from './TaskCard'

const COLUMNS: TaskStatus[] = ['pending', 'in_progress', 'completed']

export function KanbanBoard({
  tasks,
  onOpen,
}: {
  tasks: Task[]
  onOpen: (t: Task) => void
}) {
  const { setStatus, canChangeStatus } = useApp()
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<TaskStatus | null>(null)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = sortTasks(tasks.filter((t) => t.status === col))
        return (
          <div
            key={col}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(col)
            }}
            onDragLeave={() => setOver((o) => (o === col ? null : o))}
            onDrop={(e) => {
              e.preventDefault()
              if (dragId) setStatus(dragId, col)
              setDragId(null)
              setOver(null)
            }}
            className={cn(
              'rounded-2xl border p-3 transition',
              over === col
                ? 'border-indigo-400 bg-indigo-50/60 dark:border-indigo-600 dark:bg-indigo-500/5'
                : 'border-slate-200 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/40',
            )}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[col])} />
                <h3 className="text-sm font-semibold">{STATUS_LABELS[col]}</h3>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {items.length}
              </span>
            </div>
            <div className="min-h-[60px] space-y-2.5">
              {items.map((t) => {
                const movable = canChangeStatus(t)
                return (
                  <div
                    key={t.id}
                    draggable={movable}
                    onDragStart={() => movable && setDragId(t.id)}
                    onDragEnd={() => {
                      setDragId(null)
                      setOver(null)
                    }}
                    className={cn(
                      movable && 'cursor-grab active:cursor-grabbing',
                      dragId === t.id && 'opacity-40',
                    )}
                  >
                    <TaskCard task={t} variant="board" onClick={() => onOpen(t)} />
                  </div>
                )
              })}
              {items.length === 0 && (
                <p className="px-1 py-6 text-center text-xs text-slate-400">Drop tasks here</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
