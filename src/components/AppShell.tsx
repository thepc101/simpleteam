'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Boxes,
  Building2,
  CalendarDays,
  Columns3,
  CircleCheck,
  Crown,
  FileText,
  Inbox,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Scale,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { useApp } from '@/lib/store'
import { ROLE_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Avatar } from './Avatar'
import { Brand } from './Brand'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'
import { TaskModal } from './TaskModal'
import { MadeBy } from './MadeBy'

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
  badgeKind?: 'whatsapp' | 'chat'
}

const SECTIONS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/modules', label: 'Modules', icon: Boxes },
      { href: '/my-tasks', label: 'My Tasks', icon: CircleCheck },
      { href: '/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/tasks', label: 'All Tasks', icon: Columns3 },
      { href: '/backlog', label: 'Backlog', icon: Inbox },
    ],
  },
  {
    label: 'Practice',
    items: [
      { href: '/clients', label: 'Clients', icon: Building2 },
      { href: '/team', label: 'Team', icon: Users },
      { href: '/chat', label: 'Chat', icon: MessagesSquare, badgeKind: 'chat' },
      { href: '/whatsapp', label: 'WhatsApp', icon: MessageCircle, badgeKind: 'whatsapp' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/invoices', label: 'Invoices', icon: FileText },
      { href: '/inventory', label: 'Inventory', icon: Boxes },
      { href: '/loans', label: 'Loans', icon: Landmark },
    ],
  },
  {
    label: 'Reference',
    items: [
      { href: '/laws', label: 'Laws', icon: Scale },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { currentUser, currentWorkspace, isAdmin, isOwner, logout, pendingNotifications, messages } =
    useApp()
  const [drawer, setDrawer] = useState(false)
  const [newTask, setNewTask] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [chatSeen, setChatSeen] = useState(0)

  useEffect(() => {
    setCollapsed(localStorage.getItem('simpleteam:sidebar') === 'collapsed')
    const readSeen = () => setChatSeen(Number(localStorage.getItem('simpleteam:chat:seen')) || 0)
    readSeen()
    window.addEventListener('chat-read', readSeen)
    window.addEventListener('storage', readSeen)
    return () => {
      window.removeEventListener('chat-read', readSeen)
      window.removeEventListener('storage', readSeen)
    }
  }, [])

  const chatUnread = messages.filter(
    (m) => m.author_id !== currentUser?.id && +new Date(m.created_at) > chatSeen,
  ).length

  function toggleCollapse() {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem('simpleteam:sidebar', next ? 'collapsed' : 'expanded')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const allItems = SECTIONS.flatMap((s) => s.items).filter((n) => !n.adminOnly || isAdmin)
  const active = allItems.find((n) => pathname.startsWith(n.href))
  const title = active?.label ?? 'SimpleTeam'

  function NavList({ mini, onNavigate }: { mini?: boolean; onNavigate?: () => void }) {
    return (
      <nav className="flex flex-col gap-0.5">
        {SECTIONS.map((section, i) => {
          const items = section.items.filter((n) => !n.adminOnly || isAdmin)
          if (items.length === 0) return null
          return (
            <div key={i}>
              {section.label && !mini && <p className="section-label">{section.label}</p>}
              {section.label && mini && i > 0 && <div className="my-1.5 border-t border-[var(--border)]" />}
              {items.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const Icon = item.icon
                const badgeCount =
                  item.badgeKind === 'whatsapp'
                    ? pendingNotifications
                    : item.badgeKind === 'chat'
                      ? chatUnread
                      : 0
                const showBadge = badgeCount > 0
                const badgeColor = item.badgeKind === 'whatsapp' ? 'bg-emerald-500' : 'accent-bg'
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={mini ? item.label : undefined}
                    className={cn('nav-link', mini && 'justify-center px-0', isActive && 'nav-link-active')}
                  >
                    <span className="relative">
                      <Icon className="h-[18px] w-[18px]" />
                      {mini && showBadge && (
                        <span className={cn('absolute -right-1 -top-1 h-2 w-2 rounded-full', badgeColor)} />
                      )}
                    </span>
                    {!mini && item.label}
                    {!mini && showBadge && (
                      <span className={cn('ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white', badgeColor)}>
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>
    )
  }

  function UserCard({ mini, onAction }: { mini?: boolean; onAction?: () => void }) {
    if (mini) {
      return (
        <div className="flex flex-col items-center gap-2">
          <Avatar user={currentUser} size={34} />
          <button
            onClick={() => {
              onAction?.()
              logout()
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--fg-subtle)] hover:bg-[var(--surface-2)] hover:text-rose-500"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
        <Avatar user={currentUser} size={36} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-semibold">
            {currentUser?.full_name}
            {isOwner && <Crown className="h-3 w-3 shrink-0 text-amber-500" />}
          </p>
          <p className="truncate text-xs text-slate-500">
            {currentUser ? (isOwner ? 'Owner' : ROLE_LABELS[currentUser.role]) : ''}
          </p>
        </div>
        <button
          onClick={() => {
            onAction?.()
            logout()
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--fg-subtle)] hover:bg-[var(--surface)] hover:text-rose-500"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[var(--border)] bg-[var(--surface)] p-3 transition-[width] duration-200 lg:flex',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        <div className={cn('py-2', collapsed ? 'flex justify-center' : 'px-1')}>
          {collapsed ? (
            <BrandMark size={32} />
          ) : (
            <>
              <Brand />
              {currentWorkspace && (
                <p className="mt-2 line-clamp-2 px-0.5 text-xs font-medium leading-snug text-[var(--fg-subtle)]">
                  {currentWorkspace.name}
                </p>
              )}
            </>
          )}
        </div>
        <div className="mt-3 flex-1 overflow-y-auto overflow-x-hidden">
          <NavList mini={collapsed} />
        </div>
        <button
          onClick={toggleCollapse}
          className={cn('nav-link mb-2', collapsed && 'justify-center px-0')}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          {!collapsed && 'Collapse'}
        </button>
        <UserCard mini={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl animate-slide-up">
            <div className="flex items-start justify-between">
              <div className="px-1 py-2">
                <Brand />
                {currentWorkspace && (
                  <p className="mt-2 line-clamp-2 px-0.5 text-xs font-medium leading-snug text-[var(--fg-subtle)]">
                    {currentWorkspace.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setDrawer(false)}
                className="mt-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--fg-subtle)] hover:bg-[var(--surface-2)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto">
              <NavList onNavigate={() => setDrawer(false)} />
            </div>
            <UserCard onAction={() => setDrawer(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-[68px]' : 'lg:pl-64')}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setDrawer(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--surface-2)] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Brand compact />
          </div>
          <h1 className="hidden text-lg font-semibold lg:block">{title}</h1>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {isAdmin && (
              <button onClick={() => setNewTask(true)} className="btn-primary btn-sm sm:!px-4 sm:!py-2 sm:!text-sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Task</span>
              </button>
            )}
            <ThemeToggle />
            <div className="hidden sm:block">
              <Avatar user={currentUser} size={34} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-16 sm:px-6 sm:py-8">{children}</main>
      </div>

      {isAdmin && <TaskModal open={newTask} onClose={() => setNewTask(false)} />}
      <MadeBy />
    </div>
  )
}
