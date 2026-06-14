'use client'

import { useMemo } from 'react'
import { Crown, Mail, Shield, User as UserIcon } from 'lucide-react'
import { useApp } from '@/lib/store'
import type { Role } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/Avatar'

const ROLE_STYLE: Record<Role, string> = {
  admin: 'bg-violet-50 text-violet-700 ring-1 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400',
  leader: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400',
  standard: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}
const ROLE_ICON: Record<Role, typeof Crown> = { admin: Crown, leader: Shield, standard: UserIcon }

export default function TeamPage() {
  const { users, tasks, currentUser, currentWorkspace, isAdmin, updateUserRole } = useApp()
  const ownerId = currentWorkspace?.owner_id

  const rows = useMemo(
    () =>
      [...users]
        .sort((a, b) => (a.id === ownerId ? -1 : b.id === ownerId ? 1 : 0))
        .map((u) => ({
          user: u,
          open: tasks.filter((t) => t.assigned_to === u.id && t.status !== 'completed').length,
          done: tasks.filter((t) => t.assigned_to === u.id && t.status === 'completed').length,
        })),
    [users, tasks, ownerId],
  )

  const byRole = (r: Role) => users.filter((u) => u.role === r).length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Team</h2>
        <p className="text-sm text-slate-500">
          {users.length} members · {byRole('admin')} admin · {byRole('leader')} leaders ·{' '}
          {byRole('standard')} members
        </p>
      </div>

      {!isAdmin && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60">
          Only admins can change roles or create tasks. You’re signed in as{' '}
          <span className="font-medium">{currentUser ? ROLE_LABELS[currentUser.role] : ''}</span>.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ user, open, done }) => {
          const isUserOwner = user.id === ownerId
          const isSelf = user.id === currentUser?.id
          const RoleIcon = ROLE_ICON[user.role]
          const showSelect = isAdmin && !isUserOwner && !isSelf
          return (
            <div key={user.id} className="card p-4">
              <div className="flex items-center gap-3">
                <Avatar user={user} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-semibold">
                    {user.full_name}
                    {isSelf && <span className="text-xs font-normal text-slate-400">(you)</span>}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                    <Mail className="h-3 w-3 shrink-0" /> {user.email}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                {isUserOwner ? (
                  <span className="chip bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400">
                    <Crown className="h-3 w-3" /> Owner
                  </span>
                ) : showSelect ? (
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as Role)}
                    className="input w-auto !py-1 text-xs"
                  >
                    <option value="admin">Admin</option>
                    <option value="leader">Team Leader</option>
                    <option value="standard">Member</option>
                  </select>
                ) : (
                  <span className={cn('chip', ROLE_STYLE[user.role])}>
                    <RoleIcon className="h-3 w-3" />
                    {ROLE_LABELS[user.role]}
                  </span>
                )}
                <div className="text-right text-xs text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{open}</span> open ·{' '}
                  {done} done
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
