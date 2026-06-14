'use client'

import { useMemo, useState } from 'react'
import { FileText, Plus, Trash2, X } from 'lucide-react'
import { useApp } from '@/lib/store'
import { inr, modId, useCollection } from '@/lib/localModules'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { EmptyState } from '@/components/EmptyState'

interface Line {
  desc: string
  qty: number
  rate: number
}
interface Invoice {
  id: string
  number: string
  client: string
  date: string
  gstRate: number
  interState: boolean
  lines: Line[]
  status: 'unpaid' | 'paid'
}

const totals = (inv: Pick<Invoice, 'lines' | 'gstRate'>) => {
  const subtotal = inv.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0)
  const gst = (subtotal * (Number(inv.gstRate) || 0)) / 100
  return { subtotal, gst, total: subtotal + gst }
}

export default function InvoicesPage() {
  const { clients, isAdmin } = useApp()
  const { items, add, update, remove } = useCollection<Invoice>('invoices')
  const [open, setOpen] = useState(false)

  const stats = useMemo(() => {
    let billed = 0
    let outstanding = 0
    let paid = 0
    for (const inv of items) {
      const t = totals(inv).total
      billed += t
      if (inv.status === 'paid') paid += 1
      else outstanding += t
    }
    return { billed, outstanding, paid }
  }, [items])

  return (
    <div className="space-y-5">
      <PageHeader title="GST Invoicing" subtitle="Create GST-compliant invoices and track payments.">
        {isAdmin && (
          <button onClick={() => setOpen(true)} className="btn-primary btn-sm sm:!px-4 sm:!py-2 sm:!text-sm">
            <Plus className="h-4 w-4" /> New invoice
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total billed" value={inr(stats.billed)} icon={<FileText className="h-4 w-4" />} tone="indigo" />
        <StatCard label="Outstanding" value={inr(stats.outstanding)} icon={<FileText className="h-4 w-4" />} tone="amber" sub="unpaid" />
        <StatCard label="Paid" value={stats.paid} icon={<FileText className="h-4 w-4" />} tone="emerald" sub="invoices" />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="No invoices yet" desc="Create your first GST invoice.">
          {isAdmin && (
            <button onClick={() => setOpen(true)} className="btn-outline btn-sm">
              <Plus className="h-4 w-4" /> New invoice
            </button>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {items.map((inv) => {
            const t = totals(inv)
            return (
              <div key={inv.id} className="card flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {inv.number} · {inv.client || 'Client'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--fg-subtle)' }}>
                    {new Date(inv.date).toLocaleDateString('en-IN')} · GST {inv.gstRate}% · {inv.lines.length} item(s)
                  </p>
                </div>
                <span className="hidden text-sm font-semibold sm:block">{inr(t.total)}</span>
                <button
                  onClick={() => update(inv.id, { status: inv.status === 'paid' ? 'unpaid' : 'paid' })}
                  className={cn(
                    'chip',
                    inv.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
                  )}
                >
                  {inv.status === 'paid' ? 'Paid' : 'Mark paid'}
                </button>
                {isAdmin && (
                  <button onClick={() => remove(inv.id)} className="text-[var(--fg-subtle)] hover:text-rose-500" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {open && (
        <InvoiceModal
          clients={clients.map((c) => c.name)}
          nextNumber={`INV-${String(items.length + 1).padStart(4, '0')}`}
          onClose={() => setOpen(false)}
          onCreate={(inv) => {
            add(inv)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

function InvoiceModal({
  clients,
  nextNumber,
  onClose,
  onCreate,
}: {
  clients: string[]
  nextNumber: string
  onClose: () => void
  onCreate: (inv: Invoice) => void
}) {
  const [client, setClient] = useState('')
  const [date, setDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`
  })
  const [gstRate, setGstRate] = useState(18)
  const [interState, setInterState] = useState(false)
  const [lines, setLines] = useState<Line[]>([{ desc: '', qty: 1, rate: 0 }])

  const t = totals({ lines, gstRate })

  function setLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  function save() {
    if (!client.trim() || lines.every((l) => !l.desc.trim())) return
    onCreate({
      id: modId(),
      number: nextNumber,
      client: client.trim(),
      date,
      gstRate,
      interState,
      lines: lines.filter((l) => l.desc.trim()),
      status: 'unpaid',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl card animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-base font-semibold">New invoice · {nextNumber}</h2>
          <button onClick={onClose} className="text-[var(--fg-subtle)] hover:text-[var(--fg)]"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Client</label>
              <input list="inv-clients" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name" className="input" />
              <datalist id="inv-clients">{clients.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">GST rate</label>
              <select value={gstRate} onChange={(e) => setGstRate(Number(e.target.value))} className="input">
                {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className="label">Supply</label>
              <select value={interState ? 'inter' : 'intra'} onChange={(e) => setInterState(e.target.value === 'inter')} className="input">
                <option value="intra">Intra-state (CGST+SGST)</option>
                <option value="inter">Inter-state (IGST)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Line items</label>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input value={l.desc} onChange={(e) => setLine(i, { desc: e.target.value })} placeholder="Description" className="input flex-1" />
                  <input type="number" value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} className="input w-16" min={0} />
                  <input type="number" value={l.rate} onChange={(e) => setLine(i, { rate: Number(e.target.value) })} placeholder="Rate" className="input w-24" min={0} />
                  {lines.length > 1 && (
                    <button onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} className="text-[var(--fg-subtle)] hover:text-rose-500"><X className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setLines((ls) => [...ls, { desc: '', qty: 1, rate: 0 }])} className="link mt-2 text-xs">+ Add line</button>
          </div>

          <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--surface-2)' }}>
            <Row label="Subtotal" value={inr(t.subtotal)} />
            {interState ? (
              <Row label={`IGST (${gstRate}%)`} value={inr(t.gst)} />
            ) : (
              <>
                <Row label={`CGST (${gstRate / 2}%)`} value={inr(t.gst / 2)} />
                <Row label={`SGST (${gstRate / 2}%)`} value={inr(t.gst / 2)} />
              </>
            )}
            <div className="mt-1 border-t border-[var(--border)] pt-1">
              <Row label="Total" value={inr(t.total)} bold />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={!client.trim()} className="btn-primary">Create invoice</button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between py-0.5', bold && 'font-semibold')}>
      <span style={{ color: bold ? 'var(--fg)' : 'var(--fg-muted)' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}
