'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Scale,
  Sparkles,
  User as UserIcon,
  Users,
  Zap,
} from 'lucide-react'
import { useApp } from '@/lib/store'
import { BACKEND } from '@/lib/app-context'
import { cn } from '@/lib/utils'
import { Brand } from '@/components/Brand'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MadeBy } from '@/components/MadeBy'

type Mode = 'signin' | 'signup' | 'forgot'

const FEATURES = [
  { icon: Zap, title: 'Real-time, frictionless', desc: 'Tasks, priorities and deadlines update live across the team.' },
  { icon: Users, title: 'Role-based & secure', desc: 'Owner and admins assign work; members focus on their tasks.' },
  { icon: Scale, title: 'Indian compliance built-in', desc: 'GST, Income-tax Act 2025 and Companies Act references on hand.' },
]

export default function LoginPage() {
  const { ready, currentUser, login, register, resetPassword } = useApp()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [joinMode, setJoinMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (ready && currentUser) router.replace('/dashboard')
  }, [ready, currentUser, router])

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setNotice('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    if (mode === 'forgot') {
      const res = await resetPassword(email, password)
      setBusy(false)
      if (!res.ok) setError(res.error)
      else {
        setPassword('')
        setMode('signin')
        setNotice(
          BACKEND === 'supabase'
            ? 'If that email exists, a reset link has been sent. Check your inbox.'
            : 'Password reset. Sign in with your new password.',
        )
      }
      return
    }
    const res =
      mode === 'signin'
        ? await login(email, password)
        : await register({ full_name: name, email, password, mode: joinMode, workspaceName, inviteCode })
    setBusy(false)
    if (!res.ok) setError(res.error)
    else router.replace('/dashboard')
  }

  const heading = mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'
  const subtitle =
    mode === 'signin'
      ? 'Sign in to your SimpleTeam workspace.'
      : mode === 'signup'
        ? 'Start a workspace or join one with an invite code.'
        : BACKEND === 'supabase'
          ? 'We’ll email you a secure password-reset link.'
          : 'Set a new password for your account.'
  const submitLabel =
    mode === 'signin'
      ? 'Sign in'
      : mode === 'forgot'
        ? BACKEND === 'supabase'
          ? 'Send reset link'
          : 'Reset password'
        : joinMode === 'create'
          ? 'Create workspace'
          : 'Join workspace'

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="accent-bg relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">SimpleTeam</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight">Asana, but simpler.</h1>
          <p className="mt-3 text-white/80">
            An all-in-one workspace for your chartered accountancy practice — tasks, clients,
            compliance and client updates in one place.
          </p>
          <div className="mt-10 space-y-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-white/80">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-white/70">Invite-only workspace · Not for public sign-up</p>
      </div>

      {/* Right form */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Brand />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-8">
          <div className="w-full max-w-sm">
            <div className="mb-7 hidden justify-end lg:flex">
              <ThemeToggle />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
            <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>

            {notice && (
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                {notice}
              </p>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                    {(['create', 'join'] as const).map((jm) => (
                      <button
                        key={jm}
                        type="button"
                        onClick={() => setJoinMode(jm)}
                        className={cn(
                          'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition',
                          joinMode === jm ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500',
                        )}
                      >
                        {jm === 'create' ? 'New workspace' : 'Join with code'}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="label">Full name</label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" className="input pl-9" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="input pl-9" autoComplete="email" />
                </div>
              </div>

              {!(mode === 'forgot' && BACKEND === 'supabase') && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">{mode === 'forgot' ? 'New password' : 'Password'}</label>
                  {mode === 'signin' && (
                    <button type="button" onClick={() => switchMode('forgot')} className="link mb-1.5 text-xs">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input px-9"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              )}

              {mode === 'signup' && joinMode === 'create' && (
                <div>
                  <label className="label">Firm / workspace name</label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="Acme & Associates, CAs" className="input pl-9" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">You’ll be the owner &amp; admin.</p>
                </div>
              )}

              {mode === 'signup' && joinMode === 'join' && (
                <div>
                  <label className="label">Invite code</label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="stm_…" className="input pl-9 font-mono text-xs" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">Ask an admin for your workspace code.</p>
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>{submitLabel}<ArrowRight className="h-4 w-4" /></>)}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-500">
              {mode === 'forgot' ? (
                <button onClick={() => switchMode('signin')} className="link">Back to sign in</button>
              ) : (
                <>
                  {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="link">
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </>
              )}
            </p>

          </div>
        </div>
      </div>
      <MadeBy />
    </div>
  )
}
