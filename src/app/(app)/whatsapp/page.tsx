'use client'

import { useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Clock,
  Info,
  MessageCircle,
  Pencil,
  Phone,
  Send,
  ShieldAlert,
} from 'lucide-react'
import { useApp } from '@/lib/store'
import { cn, timeAgo } from '@/lib/utils'
import { DEFAULT_WA_TEMPLATE, renderTemplate, WA_PLACEHOLDERS, waLink } from '@/lib/whatsapp'

export default function WhatsAppPage() {
  const {
    isAdmin,
    currentWorkspace,
    notifications,
    clients,
    updateWorkspace,
    updateNotificationBody,
    markNotificationSent,
    logClientMessage,
  } = useApp()

  const [template, setTemplate] = useState(currentWorkspace?.wa_template ?? DEFAULT_WA_TEMPLATE)
  const [savedTpl, setSavedTpl] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [composeClient, setComposeClient] = useState('')
  const [composeBody, setComposeBody] = useState('')

  const pending = notifications.filter((n) => n.status === 'pending')
  const sent = notifications.filter((n) => n.status === 'sent')
  const phoneClients = clients.filter((c) => c.phone)
  const selectedClient = clients.find((c) => c.id === composeClient)

  const preview = useMemo(
    () =>
      renderTemplate(template || DEFAULT_WA_TEMPLATE, {
        client: 'Nirvana Textiles',
        company: currentWorkspace?.name ?? 'our firm',
        task: 'File GSTR-3B for May 2025',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      }),
    [template, currentWorkspace?.name],
  )

  if (!isAdmin || !currentWorkspace) {
    return (
      <div className="card flex flex-col items-center gap-2 py-16 text-center">
        <ShieldAlert className="h-8 w-8 text-slate-300" />
        <p className="font-medium">Admins only</p>
        <p className="text-sm text-slate-400">WhatsApp automation is managed by workspace admins.</p>
      </div>
    )
  }

  const enabled = currentWorkspace.wa_enabled

  function saveTemplate() {
    updateWorkspace({ wa_template: template })
    setSavedTpl(true)
    setTimeout(() => setSavedTpl(false), 1500)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">WhatsApp Automation</h2>
          <p className="text-sm text-slate-500">Notify clients — every message is fully editable before it sends.</p>
        </div>
      </div>

      <div className="flex gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs leading-relaxed">
          Every message opens WhatsApp with the client’s number and your text pre-filled — just tap send.
          To send <span className="font-medium">from your firm’s business number</span>, install
          <span className="font-medium"> WhatsApp Business</span> and log in with that number on the device you send
          from; messages then go out from your business identity. No WhatsApp API required.
        </p>
      </div>

      {/* Default template + toggle */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Auto-notify on completion</h3>
            <p className="text-xs text-slate-400">Completing a task with a client number queues a WhatsApp update.</p>
          </div>
          <button
            onClick={() => updateWorkspace({ wa_enabled: !enabled })}
            role="switch"
            aria-checked={enabled}
            className={cn('relative h-6 w-11 shrink-0 rounded-full transition', enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700')}
          >
            <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition', enabled ? 'left-[22px]' : 'left-0.5')} />
          </button>
        </div>

        <div className="mt-5">
          <label className="label">Default message template</label>
          <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={3} className="input resize-none" />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Placeholders:</span>
            {WA_PLACEHOLDERS.map((p) => (
              <button key={p} onClick={() => setTemplate((t) => `${t} ${p}`)} className="chip bg-slate-100 font-mono text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
                {p}
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-500/10">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700/70 dark:text-emerald-400/70">Preview</p>
            <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200">{preview}</p>
          </div>
          <button onClick={saveTemplate} className="btn-primary btn-sm mt-3">
            {savedTpl ? <Check className="h-4 w-4" /> : null}
            {savedTpl ? 'Saved' : 'Save template'}
          </button>
        </div>
      </div>

      {/* Compose a custom message */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Pencil className="h-4 w-4 text-slate-400" /> Compose a custom message
        </h3>
        <p className="text-xs text-slate-400">Write anything and send it to any client on WhatsApp.</p>
        <div className="mt-3 space-y-3">
          <select
            value={composeClient}
            onChange={(e) => {
              const id = e.target.value
              setComposeClient(id)
              const c = clients.find((x) => x.id === id)
              if (c && !composeBody.trim())
                setComposeBody(`Hello ${c.contact_person || c.name}, this is ${currentWorkspace!.name}. `)
            }}
            className="input"
          >
            <option value="">Select a client…</option>
            {phoneClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.phone}
              </option>
            ))}
          </select>
          <textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            rows={3}
            placeholder="Type your message…"
            className="input resize-none"
          />
          {selectedClient?.phone && composeBody.trim() ? (
            <a
              href={waLink(selectedClient.phone, composeBody)}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                logClientMessage(selectedClient.id, composeBody)
                setComposeBody('')
                setComposeClient('')
              }}
              className="btn-primary btn-sm !bg-emerald-600 hover:!bg-emerald-700"
            >
              <Send className="h-3.5 w-3.5" /> Send on WhatsApp
            </a>
          ) : (
            <button disabled className="btn-primary btn-sm !bg-emerald-600 opacity-50">
              <Send className="h-3.5 w-3.5" /> Send on WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Pending queue (each editable) */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4 text-amber-500" />
          Pending updates
          {pending.length > 0 && (
            <span className="chip bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">{pending.length}</span>
          )}
        </h3>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No updates waiting to be sent.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {pending.map((n) => {
              const body = drafts[n.id] ?? n.body
              return (
                <div key={n.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{n.task_title}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-400">
                        <Phone className="h-3 w-3" /> {n.to_name} · {n.to_phone}
                      </p>
                    </div>
                    <a
                      href={waLink(n.to_phone, body)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        updateNotificationBody(n.id, body)
                        markNotificationSent(n.id)
                      }}
                      className="btn-primary btn-sm shrink-0 !bg-emerald-600 hover:!bg-emerald-700"
                    >
                      <Send className="h-3.5 w-3.5" /> Send
                    </a>
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setDrafts((d) => ({ ...d, [n.id]: e.target.value }))}
                    rows={2}
                    className="input mt-2 resize-none text-xs"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Edit the message above before sending.</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sent log */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Sent history
        </h3>
        {sent.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Nothing sent yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {sent.map((n) => (
              <div key={n.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{n.task_title}</p>
                  <p className="truncate text-xs text-slate-400">{n.to_name} · {n.to_phone}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{n.sent_at ? timeAgo(n.sent_at) : 'sent'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
