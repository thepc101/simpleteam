'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Building2,
  Calendar,
  Flag,
  Lock,
  MessageCircle,
  MessageSquare,
  Send,
  Tag,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react'
import { useApp } from '@/lib/store'
import type { Task, TaskCategory, TaskPriority, TaskStatus } from '@/lib/types'
import { PRIORITY_LABELS, STATUS_LABELS } from '@/lib/types'
import { CATEGORY_META, CATEGORY_ORDER } from '@/lib/catalog'
import { timeAgo } from '@/lib/utils'
import { buildMessage, waLink } from '@/lib/whatsapp'
import { Avatar } from './Avatar'

function toInputDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`
}

export function TaskModal({
  open,
  onClose,
  task,
  defaultStatus = 'pending',
  defaultClientId,
}: {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaultStatus?: TaskStatus
  defaultClientId?: string
}) {
  const {
    addTask,
    updateTask,
    setStatus,
    deleteTask,
    users,
    clients,
    currentUser,
    currentWorkspace,
    isAdmin,
    canChangeStatus,
    commentsFor,
    addComment,
    logClientUpdate,
    clientById,
    userById,
  } = useApp()
  const editing = !!task
  const editable = isAdmin
  const canStatus = task ? canChangeStatus(task) : isAdmin

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatusValue] = useState<TaskStatus>(defaultStatus)
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [category, setCategory] = useState<TaskCategory>('gst')
  const [deadline, setDeadline] = useState('')
  const [assignee, setAssignee] = useState('')
  const [clientId, setClientId] = useState('')
  const [comment, setComment] = useState('')
  const [waMsg, setWaMsg] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setStatusValue(task?.status ?? defaultStatus)
    setPriority(task?.priority ?? 'medium')
    setCategory(task?.category ?? 'gst')
    setDeadline(toInputDate(task?.deadline ?? null))
    setAssignee(task?.assigned_to ?? currentUser?.id ?? '')
    setClientId(task?.client_id ?? defaultClientId ?? '')
    setComment('')
    const c0 = task?.client_id ? clientById(task.client_id) : undefined
    setWaMsg(task && c0 && currentWorkspace ? buildMessage(task, c0, currentWorkspace) : '')
    setTimeout(() => titleRef.current?.focus(), 50)
  }, [open, task, defaultStatus, defaultClientId, currentUser?.id])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function save() {
    if (editing && task) {
      if (editable) {
        if (!title.trim()) return
        updateTask(task.id, {
          title,
          description,
          status,
          priority,
          category,
          deadline: deadline ? new Date(`${deadline}T17:00:00`).toISOString() : null,
          assigned_to: assignee || null,
          client_id: clientId || null,
        })
      } else if (canStatus) {
        setStatus(task.id, status)
      }
    } else {
      if (!title.trim()) return
      addTask({
        title,
        description,
        status,
        priority,
        category,
        deadline: deadline ? new Date(`${deadline}T17:00:00`).toISOString() : null,
        assigned_to: assignee || null,
        client_id: clientId || null,
      })
    }
    onClose()
  }

  function remove() {
    if (task && confirm('Delete this task? This cannot be undone.')) {
      deleteTask(task.id)
      onClose()
    }
  }

  const comments = task ? commentsFor(task.id) : []
  const showSave = editable || (editing && canStatus)
  const saveLabel = editing ? (editable ? 'Save changes' : 'Update status') : 'Create task'
  const taskClient = task ? clientById(task.client_id) : undefined
  const hasClient = !!(taskClient?.phone && currentWorkspace)
  const fieldCls = 'input disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-slide-up dark:bg-slate-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold">{editing ? (editable ? 'Edit task' : 'Task') : 'New task'}</h2>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {editing && !editable && (
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              {canStatus
                ? 'You can update the status and comment. Only admins edit task details.'
                : 'Read-only. Only admins can edit this task.'}
            </div>
          )}

          <div>
            <label className="label">Title</label>
            <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. File GSTR-3B — May 2025" className={fieldCls} disabled={!editable} />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details, working notes or acceptance criteria…" rows={3} className={`${fieldCls} resize-none`} disabled={!editable} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select value={status} onChange={(e) => setStatusValue(e.target.value as TaskStatus)} className={fieldCls} disabled={!canStatus}>
                {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label"><Flag className="mr-1 inline h-3 w-3" />Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={fieldCls} disabled={!editable}>
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label"><Tag className="mr-1 inline h-3 w-3" />Compliance</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)} className={fieldCls} disabled={!editable}>
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>{CATEGORY_META[c].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label"><Calendar className="mr-1 inline h-3 w-3" />Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={fieldCls} disabled={!editable} />
              {!deadline && editable && <p className="mt-1 text-[11px] text-slate-400">No deadline → Backlog</p>}
            </div>
            <div>
              <label className="label"><Building2 className="mr-1 inline h-3 w-3" />Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={fieldCls} disabled={!editable}>
                <option value="">Internal (no client)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label"><UserIcon className="mr-1 inline h-3 w-3" />Assignee</label>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={fieldCls} disabled={!editable}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {hasClient && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp the client
                <span className="font-normal text-emerald-700/70 dark:text-emerald-400/70">
                  · {taskClient?.name} · {taskClient?.phone}
                </span>
              </p>
              {isAdmin ? (
                <>
                  <textarea
                    value={waMsg}
                    onChange={(e) => setWaMsg(e.target.value)}
                    rows={3}
                    placeholder="Type the message to send…"
                    className="input mt-2 resize-none text-xs"
                  />
                  <a
                    href={waMsg.trim() ? waLink(taskClient!.phone!, waMsg) : '#'}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      if (!waMsg.trim()) {
                        e.preventDefault()
                        return
                      }
                      if (task) logClientUpdate(task.id, waMsg)
                    }}
                    className="btn-primary btn-sm mt-2 w-full !bg-emerald-600 hover:!bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" /> Send WhatsApp update now
                  </a>
                  <p className="mt-1 text-[11px] text-emerald-700/70 dark:text-emerald-400/70">
                    {currentWorkspace?.wa_enabled
                      ? 'Edit freely — completing this task also queues this update automatically.'
                      : 'Edit the message above, then send.'}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs text-emerald-700/70 dark:text-emerald-400/70">
                  An admin will send the client update.
                </p>
              )}
            </div>
          )}

          {editing && (
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="label flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Conversation ({comments.length})</p>
              <div className="space-y-3">
                {comments.map((c) => {
                  const author = userById(c.author_id)
                  return (
                    <div key={c.id} className="flex gap-2.5">
                      <Avatar user={author} size={28} />
                      <div className="min-w-0">
                        <p className="text-xs"><span className="font-semibold">{author?.full_name ?? 'Someone'}</span><span className="ml-1.5 text-slate-400">{timeAgo(c.created_at)}</span></p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{c.body}</p>
                      </div>
                    </div>
                  )
                })}
                {comments.length === 0 && <p className="text-sm text-slate-400">No comments yet.</p>}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) { addComment(task!.id, comment); setComment('') } }}
                  placeholder="Write a comment…"
                  className="input"
                />
                <button onClick={() => { if (comment.trim()) { addComment(task!.id, comment); setComment('') } }} className="btn-primary !px-3" aria-label="Send comment">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          {editing && editable ? (
            <button onClick={remove} className="btn-ghost !text-rose-600 dark:!text-rose-400">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">{showSave ? 'Cancel' : 'Close'}</button>
            {showSave && (
              <button onClick={save} disabled={editable && !title.trim()} className="btn-primary">{saveLabel}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
