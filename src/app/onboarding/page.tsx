'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Building2, KeyRound, Loader2, LogOut } from 'lucide-react'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Brand } from '@/components/Brand'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function OnboardingPage() {
  const { ready, currentUser, currentWorkspace, createWorkspace, joinWorkspace, logout } = useApp()
  const router = useRouter()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [teamName, setTeamName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (!currentUser) router.replace('/login')
    else if (currentWorkspace) router.replace('/dashboard')
  }, [ready, currentUser, currentWorkspace, router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = mode === 'create' ? await createWorkspace(teamName) : await joinWorkspace(code)
    setBusy(false)
    if (!res.ok) setError(res.error)
    else router.replace('/dashboard')
  }

  if (!ready || !currentUser || currentWorkspace) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-5">
        <Brand />
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            onClick={() => {
              logout()
              router.replace('/login')
            }}
            className="btn-ghost btn-sm"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome, {currentUser.full_name.split(' ')[0]} 👋
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">Set up your workspace to get started.</p>

          <div className="mt-6 flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(['create', 'join'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m)
                  setError('')
                }}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition',
                  mode === m ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500',
                )}
              >
                {m === 'create' ? 'Create a team' : 'Join a team'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === 'create' ? (
              <div>
                <label className="label">Team / firm name</label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Sharma & Co., Chartered Accountants"
                    maxLength={120}
                    className="input pl-9"
                    autoFocus
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">You’ll be the owner &amp; admin.</p>
              </div>
            ) : (
              <div>
                <label className="label">Invite code</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="stm_…"
                    className="input pl-9 font-mono text-xs"
                    autoFocus
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Your role is set by the team owner after you join.</p>
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === 'create' ? 'Create team' : 'Join team'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
