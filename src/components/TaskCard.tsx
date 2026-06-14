'use client'

import { Building2, Circle, CircleCheck, Clock, MessageSquare } from 'lucide-react'
import { useApp } from '@/lib/store'
import type { Task } from '@/lib/types'
import { PRIORITY_LABELS } from '@/lib/types'
import { CATEGORY_META } from '@/lib/catalog'
import { cn, isOverdue, PRIORITY_STYLES, relativeDeadline } from '@/lib/utils'
import { Avatar } from './Avatar'

export function TaskCard({
  task,
  onClick,
  variant = 'list',
}: {
  task: Task
  onClick: () => void
  variant?: 'list' | 'board'
}) {
  const { userById, clientById, setStatus, commentsFor, canChangeStatus } = useApp()
  const assignee = userById(task.assigned_to)
  const client = clientById(task.client_id)
  const overdue = isOverdue(task)
  const done = task.status === 'completed'
  const commentCount = commentsFor(task.id).length
  const allowed = canChangeStatus(task)
  const cat = CATEGORY_META[task.category]

  function toggleDone(e: React.MouseEvent) {
    e.stopPropagation()
    if (!allowed) return
    setStatus(task.id, done ? 'pending' : 'completed')
  }

  const Check = (
    <button
      onClick={toggleDone}
      disabled={!allowed}
      className={cn(
        'mt-0.5 shrink-0 transition',
        done ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600',
        allowed ? 'hover:text-indigo-500' : 'cursor-default',
      )}
      aria-label={done ? 'Mark as not done' : 'Mark complete'}
    >
      {done ? <CircleCheck className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
    </button>
  )

  const meta = (
    <>
      <span className={cn('chip', cat.chip)}>{cat.short}</span>
      <span className={cn('chip', PRIORITY_STYLES[task.priority])}>{PRIORITY_LABELS[task.priority]}</span>
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs',
          overdue ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-slate-400',
        )}
      >
        <Clock className="h-3 w-3" />
        {relativeDeadline(task.deadline)}
      </span>
      {commentCount > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <MessageSquare className="h-3 w-3" />
          {commentCount}
        </span>
      )}
    </>
  )

  const clientLine = client && (
    <span className="inline-flex max-w-[140px] items-center gap-1 truncate text-xs text-slate-400">
      <Building2 className="h-3 w-3 shrink-0" />
      <span className="truncate">{client.name}</span>
    </span>
  )

  if (variant === 'board') {
    return (
      <div onClick={onClick} className="group card card-interactive cursor-pointer p-3">
        <div className="flex items-start gap-2">
          {Check}
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-medium leading-snug', done && 'text-slate-400 line-through')}>
              {task.title}
            </p>
            {client && <div className="mt-1">{clientLine}</div>}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-7">
          {meta}
          <span className="ml-auto">
            <Avatar user={assignee} size={22} />
          </span>
        </div>
      </div>
    )
  }

  return (
    <div onClick={onClick} className="group card card-interactive flex cursor-pointer items-start gap-3 px-4 py-3">
      {Check}
      <div className="min-w-0 flex-1">
        <p className={cn('font-medium leading-snug', done && 'text-slate-400 line-through')}>
          {task.title}
        </p>
        <div className="mt-1 flex items-center gap-3">{clientLine}</div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:hidden">{meta}</div>
      </div>
      <div className="hidden shrink-0 items-center gap-3 sm:flex">{meta}</div>
      <Avatar user={assignee} size={28} />
    </div>
  )
}
