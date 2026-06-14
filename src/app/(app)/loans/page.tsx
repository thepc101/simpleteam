'use client'

import { useMemo, useState } from 'react'
import { Landmark, Plus, Trash2 } from 'lucide-react'
import { useApp } from '@/lib/store'
import { inr, modId, useCollection } from '@/lib/localModules'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { EmptyState } from '@/components/EmptyState'

interface Loan {
  id: string
  borrower: string
  principal: number
  rate: number // annual %
  months: number
  status: 'active' | 'closed'
}

function emiOf(l: Pick<Loan, 'principal' | 'rate' | 'months'>) {
  const p = Number(l.principal) || 0
  const n = Number(l.months) || 0
  const r = (Number(l.rate) || 0) / 12 / 100
  if (!p || !n) return 0
  if (r === 0) return p / n
  const f = Math.pow(1 + r, n)
  return (p * r * f) / (f - 1)
}

export default function LoansPage() {
  const { isAdmin } = useApp()
  const { items, add, update, remove } = useCollection<Loan>('loans')
  const [borrower, setBorrower] = useState('')
  const [principal, setPrincipal] = useState('')
  const [rate, setRate] = useState('')
  const [months, setMonths] = useState('')

  const stats = useMemo(() => {
    const active = items.filter((l) => l.status === 'active')
    return {
      active: active.length,
      disbursed: active.reduce((s, l) => s + (l.principal || 0), 0),
      emi: active.reduce((s, l) => s + emiOf(l), 0),
    }
  }, [items])

  function addLoan() {
    if (!borrower.trim() || !Number(principal)) return
    add({
      id: modId(),
      borrower: borrower.trim(),
      principal: Number(principal),
      rate: Number(rate) || 0,
      months: Number(months) || 12,
      status: 'active',
    })
    setBorrower(''); setPrincipal(''); setRate(''); setMonths('')
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Retail Loans" subtitle="Track loans, borrowers and EMIs." />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Active loans" value={stats.active} icon={<Landmark className="h-4 w-4" />} tone="indigo" />
        <StatCard label="Disbursed" value={inr(stats.disbursed)} icon={<Landmark className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Monthly EMI" value={inr(Math.round(stats.emi))} icon={<Landmark className="h-4 w-4" />} tone="amber" sub="across active" />
      </div>

      {isAdmin && (
        <div className="card p-3">
          <div className="flex flex-wrap gap-2">
            <input value={borrower} onChange={(e) => setBorrower(e.target.value)} placeholder="Borrower" className="input min-w-[140px] flex-1" />
            <input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="₹ Principal" className="input w-28" />
            <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate %" className="input w-20" />
            <input type="number" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="Months" className="input w-24" />
            <button onClick={addLoan} disabled={!borrower.trim() || !Number(principal)} className="btn-primary btn-sm shrink-0"><Plus className="h-4 w-4" /> Add</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={<Landmark className="h-8 w-8" />} title="No loans yet" desc={isAdmin ? 'Add a loan above to compute its EMI.' : 'No loans recorded.'} />
      ) : (
        <div className="space-y-2">
          {items.map((l) => {
            const emi = emiOf(l)
            return (
              <div key={l.id} className="card flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{l.borrower}</p>
                  <p className="text-xs" style={{ color: 'var(--fg-subtle)' }}>
                    {inr(l.principal)} · {l.rate}% · {l.months} mo · payable {inr(Math.round(emi * l.months))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{inr(Math.round(emi))}<span className="text-xs font-normal" style={{ color: 'var(--fg-subtle)' }}>/mo</span></p>
                </div>
                <button
                  onClick={() => update(l.id, { status: l.status === 'active' ? 'closed' : 'active' })}
                  className={cn('chip', l.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-[var(--surface-2)]')}
                  style={l.status === 'closed' ? { color: 'var(--fg-muted)' } : undefined}
                >
                  {l.status === 'active' ? 'Active' : 'Closed'}
                </button>
                {isAdmin && (
                  <button onClick={() => remove(l.id)} className="text-[var(--fg-subtle)] hover:text-rose-500" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
