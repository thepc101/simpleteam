'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, AtSign, Building2, Clock, KeyRound, Loader2, LogOut, User as UserIcon } from 'lucide-react'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Brand } from '@/components/Brand'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function OnboardingPage() {
  const { ready, currentUser, currentWorkspace, myJoinRequest, createWorkspace, requestJoin, cancelJoinRequest, logout } = useApp()
  const router = useRouter()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
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
    const res =
      mode === 'create'
        ? await createWorkspace(teamName, fullName, username)
        : await requestJoin(code, fullName, username)
    setBusy(false)
    if (!res.ok) setError(res.error)
    else if (mode === 'create') router.replace('/dashboard')
    // join → stays on this page; the pending view below takes over
  }

  function signOut() {
    logout()
    router.replace('/login')
  }

  if (!ready || !currentUser || currentWorkspace) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--fg)' }} />
      </div>
    )
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-5 py-12"
      style={{ backgroundColor: 'var(--bg)', backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
    >
      <div className="absolute right-5 top-5 flex items-center gap-1.5">
        <ThemeToggle />
        <button onClick={signOut} className="btn-ghost btn-sm">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="w-full max-w-[400px]">
        <div className="mb-7 flex justify-center">
          <Brand />
        </div>

        {myJoinRequest ? (
          <div className="card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--surface-2)' }}>
              <Clock className="h-6 w-6" style={{ color: 'var(--fg-muted)' }} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Request sent</h1>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--fg-muted)' }}>
              Waiting for a team admin to approve you. You’ll be let in automatically once they do —
              you can leave this page open.
            </p>
            <button onClick={cancelJoinRequest} className="btn-outline btn-sm mt-5 w-full">
              Cancel request
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-center text-2xl font-semibold tracking-tight">Set up your workspace</h1>
            <p className="mb-6 mt-1.5 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
              Tell us who you are, then create or join a team.
            </p>

            <div className="card p-6">
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label">Full name</label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--fg-subtle)' }} />
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Aarav Sharma" maxLength={120} className="input pl-9" />
                  </div>
                </div>
                <div>
                  <label className="label">Username <span style={{ color: 'var(--fg-subtle)' }}>(optional)</span></label>
                  <div className="relative">
                    <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--fg-subtle)' }} />
                    <input value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} placeholder="aarav" maxLength={40} className="input pl-9" />
                  </div>
                </div>

                <div className="flex rounded-lg p-1" style={{ background: 'var(--surface-2)' }}>
                  {(['create', 'join'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMode(m); setError('') }}
                      className={cn('flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition')}
                      style={mode === m ? { background: 'var(--surface)', color: 'var(--fg)', boxShadow: '0 1px 2px rgb(0 0 0 / 0.06)' } : { color: 'var(--fg-muted)' }}
                    >
                      {m === 'create' ? 'Create a team' : 'Join a team'}
                    </button>
                  ))}
                </div>

                {mode === 'create' ? (
                  <div>
                    <label className="label">Team / firm name</label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--fg-subtle)' }} />
                      <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Sharma & Co., Chartered Accountants" maxLength={120} className="input pl-9" />
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: 'var(--fg-subtle)' }}>You’ll be the owner &amp; admin.</p>
                  </div>
                ) : (
                  <div>
                    <label className="label">Invite code</label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--fg-subtle)' }} />
                      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="stm_…" className="input pl-9 font-mono text-xs" />
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: 'var(--fg-subtle)' }}>An admin must approve your request. Your role is set by them.</p>
                  </div>
                )}

                {error && (
                  <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
                )}

                <button type="submit" disabled={busy} className="btn-primary w-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>{mode === 'create' ? 'Create team' : 'Request to join'}<ArrowRight className="h-4 w-4" /></>)}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
