import type { Task, TaskPriority, TaskStatus } from './types'

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6',
]
export function pickAvatarColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function isOverdue(task: Task): boolean {
  if (!task.deadline || task.status === 'completed') return false
  return new Date(task.deadline).getTime() < startOfDay(new Date()).getTime()
}

export function isDueToday(task: Task): boolean {
  if (!task.deadline) return false
  return startOfDay(new Date(task.deadline)).getTime() === startOfDay(new Date()).getTime()
}

export function isUpcoming(task: Task): boolean {
  if (!task.deadline) return false
  return startOfDay(new Date(task.deadline)).getTime() > startOfDay(new Date()).getTime()
}

export function formatDate(iso: string | null): string {
  if (!iso) return 'No deadline'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function relativeDeadline(iso: string | null): string {
  if (!iso) return 'No deadline'
  const today = startOfDay(new Date()).getTime()
  const day = startOfDay(new Date(iso)).getTime()
  const diff = Math.round((day - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff <= 7) return `In ${diff}d`
  return formatDate(iso)
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return formatDate(iso)
}

export const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
  high: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400',
}

export const STATUS_STYLES: Record<TaskStatus, string> = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300',
  in_progress: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400',
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
}

export const STATUS_DOT: Record<TaskStatus, string> = {
  pending: 'bg-slate-400',
  in_progress: 'bg-indigo-500',
  completed: 'bg-emerald-500',
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // overdue first, then by priority, then by deadline, then newest
    const ao = isOverdue(a) ? 0 : 1
    const bo = isOverdue(b) ? 0 : 1
    if (ao !== bo) return ao - bo
    if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority])
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity
    const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity
    if (ad !== bd) return ad - bd
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/

export function isValidGstin(v: string): boolean {
  return GSTIN_RE.test(v.trim().toUpperCase())
}
export function isValidPan(v: string): boolean {
  return PAN_RE.test(v.trim().toUpperCase())
}

/** Stable conversation key for a 1:1 direct message. */
export function dmKey(a: string, b: string): string {
  return `dm:${[a, b].sort().join(':')}`
}
