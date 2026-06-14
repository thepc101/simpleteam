'use client'

import { useMemo, useState } from 'react'
import {
  Building2,
  CalendarClock,
  ExternalLink,
  Info,
  Landmark,
  Receipt,
  Scale,
  Search,
} from 'lucide-react'
import { LAW_DISCLAIMER, LAWS, type Law } from '@/lib/laws'
import { cn } from '@/lib/utils'

const ICONS = { receipt: Receipt, landmark: Landmark, building: Building2 }

const ACCENT: Record<string, { box: string; dot: string; tag: string }> = {
  violet: {
    box: 'bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
    dot: 'bg-violet-500',
    tag: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  },
  emerald: {
    box: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    tag: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  sky: {
    box: 'bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    dot: 'bg-sky-500',
    tag: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  },
}

function lawMatches(law: Law, q: string): boolean {
  if (!q) return true
  const hay = [
    law.title,
    law.shortName,
    law.tag,
    law.summary,
    ...law.sections.flatMap((s) => [s.heading, ...s.points]),
    ...law.compliance.map((c) => `${c.item} ${c.cadence}`),
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q.toLowerCase())
}

export default function LawsPage() {
  const [q, setQ] = useState('')
  const [activeId, setActiveId] = useState(LAWS[0].id)

  const filtered = useMemo(() => LAWS.filter((l) => lawMatches(l, q)), [q])
  const active = filtered.find((l) => l.id === activeId) ?? filtered[0] ?? null

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Laws &amp; Compliance</h2>
          <p className="text-sm text-slate-500">Indian regulatory reference for the company.</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs leading-relaxed">{LAW_DISCLAIMER}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search across GST, Income-tax & Companies Act…"
          className="input pl-9"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Law selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {filtered.map((law) => {
            const Icon = ICONS[law.iconKey]
            const a = ACCENT[law.accent]
            const isActive = active?.id === law.id
            return (
              <button
                key={law.id}
                onClick={() => setActiveId(law.id)}
                className={cn(
                  'card flex min-w-[200px] items-center gap-3 p-3 text-left transition lg:min-w-0',
                  isActive
                    ? 'border-indigo-400 ring-2 ring-indigo-500/20 dark:border-indigo-600'
                    : 'hover:border-slate-300 dark:hover:border-slate-700',
                )}
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', a.box)}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{law.shortName}</span>
                  <span className="block truncate text-xs text-slate-400">{law.tag}</span>
                </span>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No matches.</p>
          )}
        </div>

        {/* Detail */}
        {active && <LawDetail law={active} />}
      </div>
    </div>
  )
}

function LawDetail({ law }: { law: Law }) {
  const Icon = ICONS[law.iconKey]
  const a = ACCENT[law.accent]
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', a.box)}>
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight">{law.title}</h3>
              <span className={cn('chip', a.tag)}>{law.tag}</span>
            </div>
            <p className="text-xs text-slate-400">{law.updated}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{law.summary}</p>

        {/* Highlights */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {law.highlights.map((h) => (
            <div key={h.label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{h.label}</p>
              <p className="mt-0.5 text-sm font-semibold leading-tight">{h.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {law.sections.map((s) => (
          <div key={s.heading} className="card p-5">
            <h4 className="text-sm font-semibold">{s.heading}</h4>
            <ul className="mt-3 space-y-2">
              {s.points.map((p, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', a.dot)} />
                  <span className="leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Compliance calendar */}
      <div className="card p-5">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <CalendarClock className="h-4 w-4 text-slate-400" />
          Key filings &amp; cadence
        </h4>
        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {law.compliance.map((c) => (
            <div key={c.item} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm font-medium">{c.item}</span>
              <span className="shrink-0 text-xs text-slate-500">{c.cadence}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="flex flex-wrap gap-2">
        {law.resources.map((r) => (
          <a
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="btn-outline btn-sm"
          >
            {r.label}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ))}
      </div>
    </div>
  )
}
