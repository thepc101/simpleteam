import { initials } from '@/lib/utils'
import type { User } from '@/lib/types'

export function Avatar({
  user,
  size = 32,
}: {
  user?: Pick<User, 'full_name' | 'avatar_color'> | null
  size?: number
}) {
  if (!user) {
    return (
      <div
        className="shrink-0 rounded-full bg-slate-200 dark:bg-slate-700"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white dark:ring-slate-900"
      style={{
        width: size,
        height: size,
        backgroundColor: user.avatar_color,
        fontSize: Math.round(size * 0.4),
      }}
      title={user.full_name}
    >
      {initials(user.full_name)}
    </div>
  )
}
