'use client'

import { useMemo, useState } from 'react'
import { Boxes, Minus, Plus, Trash2 } from 'lucide-react'
import { useApp } from '@/lib/store'
import { inr, modId, useCollection } from '@/lib/localModules'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { EmptyState } from '@/components/EmptyState'

interface Item {
  id: string
  name: string
  sku: string
  qty: number
  price: number
  reorder: number
}

export default function InventoryPage() {
  const { isAdmin } = useApp()
  const { items, add, update, remove } = useCollection<Item>('inventory')
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [reorder, setReorder] = useState('')

  const stats = useMemo(() => {
    const value = items.reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0)
    const low = items.filter((i) => i.qty <= i.reorder).length
    return { count: items.length, low, value }
  }, [items])

  function addItem() {
    if (!name.trim()) return
    add({ id: modId(), name: name.trim(), sku: sku.trim(), qty: Number(qty) || 0, price: Number(price) || 0, reorder: Number(reorder) || 0 })
    setName(''); setSku(''); setQty(''); setPrice(''); setReorder('')
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Inventory" subtitle="Track stock levels and get low-stock alerts." />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Items" value={stats.count} icon={<Boxes className="h-4 w-4" />} tone="indigo" />
        <StatCard label="Low stock" value={stats.low} icon={<Boxes className="h-4 w-4" />} tone="rose" sub="need reorder" />
        <StatCard label="Stock value" value={inr(stats.value)} icon={<Boxes className="h-4 w-4" />} tone="emerald" />
      </div>

      {isAdmin && (
        <div className="card p-3">
          <div className="flex flex-wrap gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" className="input min-w-[140px] flex-1" />
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className="input w-24" />
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" className="input w-20" />
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="₹ Price" className="input w-24" />
            <input type="number" value={reorder} onChange={(e) => setReorder(e.target.value)} placeholder="Reorder" className="input w-24" />
            <button onClick={addItem} disabled={!name.trim()} className="btn-primary btn-sm shrink-0"><Plus className="h-4 w-4" /> Add</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={<Boxes className="h-8 w-8" />} title="No items yet" desc={isAdmin ? 'Add your first stock item above.' : 'No inventory items.'} />
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const low = it.qty <= it.reorder
            return (
              <div key={it.id} className="card flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {it.name}
                    {it.sku && <span className="ml-2 text-xs font-mono" style={{ color: 'var(--fg-subtle)' }}>{it.sku}</span>}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--fg-subtle)' }}>{inr(it.price)} each · reorder at {it.reorder}</p>
                </div>
                {low && <span className="chip bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">Low</span>}
                <div className="flex items-center gap-1.5">
                  {isAdmin && (
                    <button onClick={() => update(it.id, { qty: Math.max(0, it.qty - 1) })} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] hover:bg-[var(--surface-2)]"><Minus className="h-3.5 w-3.5" /></button>
                  )}
                  <span className={cn('w-10 text-center text-sm font-semibold', low && 'text-rose-500')}>{it.qty}</span>
                  {isAdmin && (
                    <button onClick={() => update(it.id, { qty: it.qty + 1 })} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] hover:bg-[var(--surface-2)]"><Plus className="h-3.5 w-3.5" /></button>
                  )}
                </div>
                {isAdmin && (
                  <button onClick={() => remove(it.id)} className="text-[var(--fg-subtle)] hover:text-rose-500" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
