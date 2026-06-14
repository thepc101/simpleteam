'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, KeyRound, Loader2, Lock, LogOut, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'
import { useApp } from '@/lib/store'
import { ROLE_LABELS } from '@/lib/types'
import { Avatar } from '@/components/Avatar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AccentPicker } from '@/components/AccentPicker'

export default function SettingsPage() {
  const {
    currentUser,
    currentWorkspace,
    isAdmin,
    isOwner,
    updateUser,
    updateWorkspace,
    regenerateInvite,
    resetDemo,
    logout,
    changePassword,
    deleteAccount,
  } = useApp()
  const router = useRouter()
  const [name, setName] = useState(currentUser?.full_name ?? '')
  const [wsName, setWsName] = useState(currentWorkspace?.name ?? '')
  const [savedProfile, setSavedProfile] = useState(false)
  const [savedWs, setSavedWs] = useState(false)
  const [copied, setCopied] = useState(false)
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pwBusy, setPwBusy] = useState(false)

  if (!currentUser || !currentWorkspace) return null
  const dirtyName = name.trim() !== currentUser.full_name && name.trim().length > 0
  const dirtyWs = wsName.trim() !== currentWorkspace.name && wsName.trim().length > 0

  function saveProfile() {
    updateUser(currentUser!.id, { full_name: name.trim() })
    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 1500)
  }
  function saveWs() {
    updateWorkspace({ name: wsName.trim() })
    setSavedWs(true)
    setTimeout(() => setSavedWs(false), 1500)
  }
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(currentWorkspace!.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked */
    }
  }
  function regenerate() {
    if (confirm('Regenerate the invite code? The old code will stop working immediately.'))
      regenerateInvite()
  }
  async function doChangePassword() {
    setPwMsg(null)
    setPwBusy(true)
    const res = await changePassword(curPw, newPw)
    setPwBusy(false)
    if (res.ok) {
      setPwMsg({ ok: true, text: 'Password updated.' })
      setCurPw('')
      setNewPw('')
    } else {
      setPwMsg({ ok: false, text: res.error })
    }
  }

  function doDelete() {
    const msg = isOwner
      ? 'This will permanently delete the ENTIRE workspace and all its data (clients, tasks, team). This cannot be undone. Continue?'
      : 'Permanently delete your account? This cannot be undone.'
    if (confirm(msg)) {
      deleteAccount()
      router.replace('/login')
    }
  }

  function signOut() {
    logout()
    router.replace('/login')
  }
  function reset() {
    if (confirm('Reset all demo data (tasks, comments, team, notifications) to defaults?')) resetDemo()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-slate-500">Manage your profile and workspace.</p>
      </div>

      {/* Profile */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold">Profile</h3>
        <div className="mt-4 flex items-center gap-4">
          <Avatar user={{ full_name: name || currentUser.full_name, avatar_color: currentUser.avatar_color }} size={56} />
          <div className="text-sm">
            <p className="font-medium">{currentUser.email}</p>
            <p className="text-slate-400">{isOwner ? 'Owner · Admin' : ROLE_LABELS[currentUser.role]}</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Display name</label>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
            <button onClick={saveProfile} disabled={!dirtyName} className="btn-primary shrink-0">
              {savedProfile ? <Check className="h-4 w-4" /> : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Workspace + invite (admin) */}
      {isAdmin && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold">Workspace</h3>
          <div className="mt-4">
            <label className="label">Workspace name</label>
            <div className="flex gap-2">
              <input value={wsName} onChange={(e) => setWsName(e.target.value)} className="input" />
              <button onClick={saveWs} disabled={!dirtyWs} className="btn-primary shrink-0">
                {savedWs ? <Check className="h-4 w-4" /> : 'Save'}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <label className="label flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Invite code
            </label>
            <p className="mb-2 text-xs text-slate-400">
              Share this with teammates to let them join. New members join as Members; promote them
              in Team.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800">
                {currentWorkspace.invite_code}
              </code>
              <div className="flex gap-2">
                <button onClick={copyInvite} className="btn-outline btn-sm">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={regenerate} className="btn-outline btn-sm">
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="h-4 w-4 text-slate-400" /> Password
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Current password</label>
            <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} className="input" autoComplete="current-password" />
          </div>
          <div>
            <label className="label">New password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="input" autoComplete="new-password" />
          </div>
        </div>
        {pwMsg && (
          <p className={`mt-2 text-sm ${pwMsg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {pwMsg.text}
          </p>
        )}
        <button onClick={doChangePassword} disabled={pwBusy || !curPw || !newPw} className="btn-primary btn-sm mt-3">
          {pwBusy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
        </button>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold">Appearance</h3>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-slate-400">Switch between light and dark mode.</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-sm font-medium">Accent colour</p>
          <p className="mb-3 text-xs text-slate-400">Brand the workspace in your firm’s colour.</p>
          <AccentPicker />
        </div>
      </div>

      {/* Data */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold">Workspace data</h3>
        <p className="mt-1 text-xs text-slate-400">
          This demo stores everything locally in your browser. Resetting restores the original
          sample workspace, tasks and team.
        </p>
        <button onClick={reset} className="btn-outline btn-sm mt-3">
          <RotateCcw className="h-4 w-4" /> Reset demo data
        </button>
      </div>

      {/* Account */}
      <div className="card flex items-center justify-between p-5">
        <div>
          <h3 className="text-sm font-semibold">Account</h3>
          <p className="text-xs text-slate-400">Sign out of this workspace.</p>
        </div>
        <button onClick={signOut} className="btn-outline btn-sm">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-5 dark:border-rose-500/20 dark:bg-rose-500/5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400">
          <Trash2 className="h-4 w-4" /> Danger zone
        </h3>
        <p className="mt-1 text-xs text-rose-700/70 dark:text-rose-400/70">
          {isOwner
            ? 'As the owner, deleting your account removes the entire workspace and all of its data.'
            : 'Permanently delete your account and unassign your tasks.'}
        </p>
        <button onClick={doDelete} className="btn-danger btn-sm mt-3">
          <Trash2 className="h-4 w-4" /> {isOwner ? 'Delete workspace' : 'Delete account'}
        </button>
      </div>

      <p className="px-1 text-center text-xs text-slate-400">
        SimpleTeam · Local demo build · Backend (Supabase + Groq) wires in on Vercel for production.
      </p>
    </div>
  )
}
