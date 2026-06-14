'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User as UserIcon } from 'lucide-react'
import { useApp } from '@/lib/store'
import { BACKEND } from '@/lib/app-context'
import { BrandMark } from '@/components/BrandMark'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MadeBy } from '@/components/MadeBy'

type Mode = 'signin' | 'signup' | 'forgot'

export default function LoginPage() {
  const { ready, currentUser, currentWorkspace, login, register, resetPassword } = useApp()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (ready && currentUser) router.replace(currentWorkspace ? '/dashboard' : '/onboarding')
  }, [ready, currentUser, currentWorkspace, router])

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
      mode === 'signin' ? await login(email, password) : await register({ full_name: name, email, password })
    setBusy(false)
    if (!res.ok) setError(res.error)
    else router.replace(mode === 'signup' ? '/onboarding' : '/dashboard')
  }

  const heading = mode === 'signin' ? 'Sign in to SimpleTeam' : mode === 'signup' ? 'Create your account' : 'Reset password'
  const subtitle =
    mode === 'signin'
      ? 'Welcome back. Enter your details to continue.'
      : mode === 'signup'
        ? 'You’ll set up your team in the next step.'
        : BACKEND === 'supabase'
          ? 'We’ll email you a secure reset link.'
          : 'Set a new password for your account.'
  const submitLabel =
    mode === 'signin'
      ? 'Sign in'
      : mode === 'forgot'
        ? BACKEND === 'supabase'
          ? 'Send reset link'
          : 'Reset password'
        : 'Create account'

  const showPwField = !(mode === 'forgot' && BACKEND === 'supabase')

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-5 py-12"
      style={{
        backgroundColor: 'var(--bg)',
        backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[384px]">
        <div className="mb-7 flex flex-col items-center text-center">
          <BrandMark size={40} />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">{heading}</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--fg-muted)' }}>
            {subtitle}
          </p>
        </div>

        {notice && (
          <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
            {notice}
          </p>
        )}

        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Full name</label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--fg-subtle)' }} />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" maxLength={120} className="input pl-9" />
                </div>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--fg-subtle)' }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="input pl-9" autoComplete="email" />
              </div>
            </div>

            {showPwField && (
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
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--fg-subtle)' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input px-9"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-subtle)' }}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>{submitLabel}<ArrowRight className="h-4 w-4" /></>)}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
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

      <MadeBy />
    </div>
  )
}
