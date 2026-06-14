'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Brand } from '@/components/Brand'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setMsg({ ok: false, text: 'Password reset links are only available on the hosted (Supabase) version.' })
      return
    }
    if (pw.length < 6) {
      setMsg({ ok: false, text: 'Password must be at least 6 characters.' })
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) setMsg({ ok: false, text: error.message })
    else {
      setMsg({ ok: true, text: 'Password updated. Redirecting…' })
      setTimeout(() => router.replace('/dashboard'), 1200)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-5">
        <Brand />
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold tracking-tight">Set a new password</h2>
          <p className="mt-1.5 text-sm text-slate-500">Choose a new password for your account.</p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="label">New password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-9"
                  autoComplete="new-password"
                />
              </div>
            </div>
            {msg && (
              <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                {msg.text}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Update password<ArrowRight className="h-4 w-4" /></>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
