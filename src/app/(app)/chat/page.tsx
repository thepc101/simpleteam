'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Hash, MessagesSquare, Send } from 'lucide-react'
import { useApp } from '@/lib/store'
import { cn, dmKey, timeAgo } from '@/lib/utils'
import { Avatar } from '@/components/Avatar'

export default function ChatPage() {
  const { messages, messagesFor, sendMessage, users, currentUser, userById } = useApp()
  const [active, setActive] = useState('general')
  const [draft, setDraft] = useState('')
  const [mobileThread, setMobileThread] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mark chat as seen (clears the nav badge) whenever messages change while viewing.
  useEffect(() => {
    try {
      localStorage.setItem('simpleteam:chat:seen', String(Date.now()))
      window.dispatchEvent(new Event('chat-read'))
    } catch {
      /* ignore */
    }
  }, [messages.length])

  const conversations = useMemo(() => {
    const others = users.filter((u) => u.id !== currentUser?.id)
    return [
      { key: 'general', name: 'General', user: undefined as ReturnType<typeof userById>, general: true },
      ...others.map((u) => ({ key: dmKey(currentUser!.id, u.id), name: u.full_name, user: u, general: false })),
    ]
  }, [users, currentUser?.id])

  const thread = messagesFor(active)
  const activeConv = conversations.find((c) => c.key === active)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active, thread.length])

  function send() {
    const t = draft.trim()
    if (!t) return
    sendMessage(active, t)
    setDraft('')
  }

  function openConv(key: string) {
    setActive(key)
    setMobileThread(true)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[460px] gap-4">
      {/* Conversation list */}
      <div className={cn('w-full flex-col lg:flex lg:w-[300px] lg:shrink-0', mobileThread ? 'hidden' : 'flex')}>
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <MessagesSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Chat</h2>
            <p className="text-xs text-slate-400">Team messaging</p>
          </div>
        </div>
        <div className="card flex-1 space-y-0.5 overflow-y-auto p-2">
          {conversations.map((c) => {
            const last = messagesFor(c.key).slice(-1)[0]
            const isActive = c.key === active
            return (
              <button
                key={c.key}
                onClick={() => openConv(c.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg p-2 text-left transition',
                  isActive ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60',
                )}
              >
                {c.general ? (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <Hash className="h-4 w-4" />
                  </span>
                ) : (
                  <Avatar user={c.user} size={36} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {last ? `${last.author_id === currentUser?.id ? 'You: ' : ''}${last.body}` : c.general ? 'Whole team' : 'Direct message'}
                  </p>
                </div>
                {last && <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(last.created_at)}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Thread */}
      <div className={cn('card flex-1 flex-col overflow-hidden lg:flex', mobileThread ? 'flex' : 'hidden')}>
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <button onClick={() => setMobileThread(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          {activeConv?.general ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              <Hash className="h-4 w-4" />
            </span>
          ) : (
            <Avatar user={activeConv?.user} size={32} />
          )}
          <div>
            <p className="text-sm font-semibold">{activeConv?.name ?? 'Conversation'}</p>
            <p className="text-xs text-slate-400">{activeConv?.general ? 'Everyone in the workspace' : 'Direct message'}</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {thread.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-400">
              <MessagesSquare className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
              No messages yet. Say hello 👋
            </div>
          )}
          {thread.map((m) => {
            const mine = m.author_id === currentUser?.id
            const author = userById(m.author_id)
            return (
              <div key={m.id} className={cn('flex gap-2.5', mine && 'flex-row-reverse')}>
                {!mine && <Avatar user={author} size={30} />}
                <div className={cn('max-w-[78%]', mine && 'items-end text-right')}>
                  {!mine && <p className="mb-0.5 text-xs font-medium text-slate-500">{author?.full_name ?? 'Someone'}</p>}
                  <div
                    className={cn(
                      'inline-block whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm',
                      mine ? 'accent-bg rounded-br-sm text-white' : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
                    )}
                  >
                    {m.body}
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400">{timeAgo(m.created_at)}</p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            maxLength={2000}
            placeholder={`Message ${activeConv?.general ? 'the team' : (activeConv?.name ?? '')}…`}
            className="input"
          />
          <button onClick={send} disabled={!draft.trim()} className="btn-primary !px-3 shrink-0" aria-label="Send">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
