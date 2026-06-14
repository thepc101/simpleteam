'use client'

import { useEffect, useState } from 'react'
import { Building2, MessageCircle, Trash2, X } from 'lucide-react'
import { useApp } from '@/lib/store'
import type { Client, ClientType } from '@/lib/types'
import { CATEGORY_META, CLIENT_TYPE_META, CLIENT_TYPE_ORDER } from '@/lib/catalog'
import { cn, isValidGstin, isValidPan, relativeDeadline, STATUS_DOT, sortTasks } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'

export function ClientModal({
  open,
  onClose,
  client,
}: {
  open: boolean
  onClose: () => void
  client?: Client | null
}) {
  const { addClient, updateClient, deleteClient, isAdmin, tasksForClient, users, currentWorkspace } =
    useApp()
  const editing = !!client
  const editable = isAdmin

  const [name, setName] = useState('')
  const [type, setType] = useState<ClientType>('private_limited')
  const [gstin, setGstin] = useState('')
  const [pan, setPan] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  useEffect(() => {
    if (!open) return
    setName(client?.name ?? '')
    setType(client?.type ?? 'private_limited')
    setGstin(client?.gstin ?? '')
    setPan(client?.pan ?? '')
    setContact(client?.contact_person ?? '')
    setPhone(client?.phone ?? '')
    setEmail(client?.email ?? '')
    setNotes(client?.notes ?? '')
    setAssignedTo(client?.assigned_to ?? '')
  }, [open, client])

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
    if (!name.trim() || !editable) return
    const payload = {
      name,
      type,
      gstin: gstin || null,
      pan: pan || null,
      contact_person: contact || null,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
      assigned_to: assignedTo || null,
    }
    if (client) updateClient(client.id, payload)
    else addClient(payload)
    onClose()
  }

  function remove() {
    if (client && confirm('Delete this client? Their tasks will be kept but unlinked.')) {
      deleteClient(client.id)
      onClose()
    }
  }

  const tasks = client ? sortTasks(tasksForClient(client.id)) : []
  const open_count = tasks.filter((t) => t.status !== 'completed').length
  const gstinBad = gstin.trim().length > 0 && !isValidGstin(gstin)
  const panBad = pan.trim().length > 0 && !isValidPan(pan)
  const fieldCls = 'input disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-slide-up dark:bg-slate-900 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold">{editing ? (editable ? 'Edit client' : 'Client') : 'New client'}</h2>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Client / Entity name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nirvana Textiles Pvt Ltd" className={fieldCls} disabled={!editable} />
            </div>
            <div className="col-span-2">
              <label className="label">Entity type</label>
              <select value={type} onChange={(e) => setType(e.target.value as ClientType)} className={fieldCls} disabled={!editable}>
                {CLIENT_TYPE_ORDER.map((c) => (
                  <option key={c} value={c}>{CLIENT_TYPE_META[c].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">GSTIN</label>
              <input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="27AABCN1234A1Z5" className={cn(fieldCls, 'font-mono text-xs', gstinBad && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20')} disabled={!editable} />
              {gstinBad && <p className="mt-1 text-[11px] text-rose-500">Not a valid 15-char GSTIN</p>}
            </div>
            <div>
              <label className="label">PAN</label>
              <input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="AABCN1234A" className={cn(fieldCls, 'font-mono text-xs', panBad && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20')} disabled={!editable} />
              {panBad && <p className="mt-1 text-[11px] text-rose-500">Not a valid 10-char PAN</p>}
            </div>
            <div>
              <label className="label">Contact person</label>
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Full name" className={fieldCls} disabled={!editable} />
            </div>
            <div>
              <label className="label">WhatsApp number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="91XXXXXXXXXX" inputMode="tel" className={fieldCls} disabled={!editable} />
            </div>
            <div className="col-span-2">
              <label className="label">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.in" className={fieldCls} disabled={!editable} />
            </div>
            <div className="col-span-2">
              <label className="label">Relationship manager (team)</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={fieldCls} disabled={!editable}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything the team should know…" className={`${fieldCls} resize-none`} disabled={!editable} />
            </div>
          </div>

          {editing && client?.phone && (
            <a href={waLink(client.phone, `Hello ${client.contact_person || client.name}, this is ${currentWorkspace?.name ?? 'our firm'}.`)} target="_blank" rel="noreferrer" className="btn-outline btn-sm w-full !text-emerald-700 dark:!text-emerald-400">
              <MessageCircle className="h-4 w-4" /> Message on WhatsApp
            </a>
          )}

          {editing && (
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="label">Work for this client ({open_count} open)</p>
              <div className="space-y-1.5">
                {tasks.length === 0 && <p className="text-sm text-slate-400">No tasks linked yet.</p>}
                {tasks.slice(0, 8).map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50">
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[t.status])} />
                    <span className={cn('min-w-0 flex-1 truncate', t.status === 'completed' && 'text-slate-400 line-through')}>{t.title}</span>
                    <span className={cn('chip shrink-0', CATEGORY_META[t.category].chip)}>{CATEGORY_META[t.category].short}</span>
                    <span className="shrink-0 text-xs text-slate-400">{relativeDeadline(t.deadline)}</span>
                  </div>
                ))}
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
            <button onClick={onClose} className="btn-ghost">{editable ? 'Cancel' : 'Close'}</button>
            {editable && (
              <button onClick={save} disabled={!name.trim()} className="btn-primary">
                {editing ? 'Save changes' : 'Add client'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
