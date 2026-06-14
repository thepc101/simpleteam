import type { ClientType, TaskCategory } from './types'

export interface CategoryMeta {
  label: string
  short: string
  chip: string // chip background/text classes
  dot: string // solid dot color
  bar: string // solid bar color
}

export const CATEGORY_META: Record<TaskCategory, CategoryMeta> = {
  gst: {
    label: 'GST',
    short: 'GST',
    chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300',
    dot: 'bg-violet-500',
    bar: 'bg-violet-500',
  },
  income_tax: {
    label: 'Income Tax',
    short: 'IT',
    chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
  },
  tds: {
    label: 'TDS / TCS',
    short: 'TDS',
    chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
  },
  roc: {
    label: 'ROC / MCA',
    short: 'ROC',
    chip: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300',
    dot: 'bg-sky-500',
    bar: 'bg-sky-500',
  },
  audit: {
    label: 'Audit',
    short: 'Audit',
    chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
  },
  advisory: {
    label: 'Advisory',
    short: 'Advisory',
    chip: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300',
    dot: 'bg-indigo-500',
    bar: 'bg-indigo-500',
  },
  other: {
    label: 'Internal / Other',
    short: 'Other',
    chip: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400',
  },
}

export const CATEGORY_ORDER: TaskCategory[] = [
  'gst',
  'income_tax',
  'tds',
  'roc',
  'audit',
  'advisory',
  'other',
]

export const CLIENT_TYPE_META: Record<ClientType, { label: string; short: string }> = {
  private_limited: { label: 'Private Limited', short: 'Pvt Ltd' },
  public_limited: { label: 'Public Limited', short: 'Ltd' },
  llp: { label: 'LLP', short: 'LLP' },
  partnership: { label: 'Partnership Firm', short: 'Partnership' },
  proprietorship: { label: 'Proprietorship', short: 'Prop.' },
  individual: { label: 'Individual', short: 'Individual' },
  huf: { label: 'HUF', short: 'HUF' },
  trust: { label: 'Trust / Society', short: 'Trust' },
}

export const CLIENT_TYPE_ORDER: ClientType[] = [
  'private_limited',
  'llp',
  'partnership',
  'proprietorship',
  'individual',
  'huf',
  'public_limited',
  'trust',
]
