'use client'

import { useMemo, useState } from 'react'
import { Building2, FileText, Mail, Phone, Plus, Search, Users } from 'lucide-react'
import { useApp } from '@/lib/store'
import type { Client, ClientType } from '@/lib/types'
import { CLIENT_TYPE_META, CLIENT_TYPE_ORDER } from '@/lib/catalog'
import { cn, initials, pickAvatarColor } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { EmptyState } from '@/components/EmptyState'
import { ClientModal } from '@/components/ClientModal'
import { Avatar } from '@/components/Avatar'

export default function ClientsPage() {
  const { clients, tasks, isAdmin, currentUser, userById } = useApp()
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<ClientType | 'all'>('all')
  const [mineOnly, setMineOnly] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)

  const openByClient = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of tasks) {
      if (t.client_id && t.status !== 'completed') map[t.client_id] = (map[t.client_id] ?? 0) + 1
    }
    return map
  }, [tasks])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return [...clients]
      .filter((c) => {
        if (typeFilter !== 'all' && c.type !== typeFilter) return false
        if (mineOnly && c.assigned_to !== currentUser?.id) return false
        if (needle && !`${c.name} ${c.gstin ?? ''} ${c.pan ?? ''} ${c.contact_person ?? ''}`.toLowerCase().includes(needle))
          return false
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [clients, q, typeFilter, mineOnly, currentUser?.id])

  function openEdit(c: Client) {
    setEditing(c)
    setOpen(true)
  }
  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  const totalOpen = Object.values(openByClient).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      <PageHeader title="Clients" subtitle="Your firm’s client directory and their compliance work.">
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary btn-sm sm:!px-4 sm:!py-2 sm:!text-sm">
            <Plus className="h-4 w-4" /> Add client
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Clients" value={clients.length} icon={<Building2 className="h-4 w-4" />} tone="indigo" />
        <StatCard label="Active" value={clients.filter((c) => c.active).length} icon={<Users className="h-4 w-4" />} tone="emerald" sub="engaged" />
        <StatCard label="Open work" value={totalOpen} icon={<FileText className="h-4 w-4" />} tone="amber" sub="across clients" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, GSTIN, PAN…" className="input pl-9" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ClientType | 'all')} className="input sm:w-48">
          <option value="all">All entity types</option>
          {CLIENT_TYPE_ORDER.map((c) => (
            <option key={c} value={c}>{CLIENT_TYPE_META[c].label}</option>
          ))}
        </select>
        <button onClick={() => setMineOnly((v) => !v)} className={mineOnly ? 'btn-primary btn-sm shrink-0' : 'btn-outline btn-sm shrink-0'}>
          My clients
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="No clients found"
          desc={isAdmin ? 'Add your first client to start tracking their compliance.' : 'No clients match your search.'}
        >
          {isAdmin && (
            <button onClick={openCreate} className="btn-outline btn-sm">
              <Plus className="h-4 w-4" /> Add client
            </button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const openCount = openByClient[c.id] ?? 0
            return (
              <button key={c.id} onClick={() => openEdit(c)} className="card card-interactive p-4 text-left">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: pickAvatarColor(c.id) }}
                  >
                    {initials(c.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-xs text-slate-400">{CLIENT_TYPE_META[c.type].label}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  {c.gstin && <p className="font-mono">GSTIN {c.gstin}</p>}
                  {!c.gstin && c.pan && <p className="font-mono">PAN {c.pan}</p>}
                  <div className="flex items-center gap-3 pt-0.5 text-slate-400">
                    {c.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{c.email}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <span className={cn('chip', c.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800')}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{openCount}</span> open
                    </span>
                    {c.assigned_to && <Avatar user={userById(c.assigned_to)} size={22} />}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <ClientModal open={open} client={editing} onClose={() => setOpen(false)} />
    </div>
  )
}
