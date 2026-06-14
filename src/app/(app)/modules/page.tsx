'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Boxes,
  Briefcase,
  Building2,
  CalendarDays,
  Cloud,
  FileChartColumn,
  FileText,
  FolderOpen,
  Landmark,
  MessageCircle,
  MessagesSquare,
  Network,
  QrCode,
  Receipt,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import { MODULE_GROUPS } from '@/lib/modules'
import { PageHeader } from '@/components/PageHeader'

const ICONS: Record<string, typeof Cloud> = {
  Briefcase, Building2, CalendarDays, MessageCircle, MessagesSquare, Scale,
  Cloud, Receipt, FileText, QrCode, Truck, Boxes, ShoppingCart, Network,
  ShieldCheck, FileChartColumn, Landmark, FolderOpen,
}

export default function ModulesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Modules" subtitle="One platform for your whole practice — accounting, compliance, billing and AI." />

      {MODULE_GROUPS.map((group) => (
        <section key={group.label}>
          <p className="section-label !px-0">{group.label}</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((m) => {
              const Icon = ICONS[m.icon] ?? Boxes
              const live = m.status === 'live'
              const inner = (
                <>
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ background: 'var(--surface-2)', color: 'var(--fg)' }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {live ? (
                      <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Live</span>
                    ) : (
                      <span className="chip" style={{ background: 'var(--surface-2)', color: 'var(--fg-muted)' }}>Coming soon</span>
                    )}
                  </div>
                  <p className="mt-3 font-semibold">{m.title}</p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{m.desc}</p>
                  {live && (
                    <span className="link mt-3 inline-flex items-center gap-1 text-sm">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </>
              )
              return live && m.href ? (
                <Link key={m.key} href={m.href} className="card card-interactive block p-4">
                  {inner}
                </Link>
              ) : (
                <div key={m.key} className="card p-4 opacity-90">
                  {inner}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
