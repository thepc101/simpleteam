'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type {
  AppState,
  Client,
  ClientType,
  Comment,
  Role,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  User,
  WaNotification,
  Workspace,
} from './types'
import { buildSeed } from './seed'
import { generateInviteCode, hashPassword, randomId, sanitizePhone, verifyPassword } from './crypto'
import { pickAvatarColor } from './utils'
import { buildMessage, DEFAULT_WA_TEMPLATE } from './whatsapp'

const STORE_KEY = 'simpleteam:data:v4'
const SESSION_KEY = 'simpleteam:session:v4'

const EMPTY: AppState = {
  workspaces: [],
  users: [],
  clients: [],
  tasks: [],
  comments: [],
  notifications: [],
}

function loadState(): AppState {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed && Array.isArray(parsed.workspaces) && Array.isArray(parsed.clients)) return parsed
    }
  } catch {
    /* fall through to reseed */
  }
  const seed = buildSeed()
  localStorage.setItem(STORE_KEY, JSON.stringify(seed))
  return seed
}

export interface NewTaskInput {
  title: string
  description?: string | null
  status?: TaskStatus
  priority: TaskPriority
  category?: TaskCategory
  deadline?: string | null
  assigned_to?: string | null
  client_id?: string | null
}

export interface ClientInput {
  name: string
  type: ClientType
  gstin?: string | null
  pan?: string | null
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
  assigned_to?: string | null
  active?: boolean
}

export interface RegisterInput {
  full_name: string
  email: string
  password: string
  mode: 'create' | 'join'
  workspaceName?: string
  inviteCode?: string
}

type Result = { ok: true } | { ok: false; error: string }

interface AppContextValue {
  ready: boolean
  currentUser: User | null
  currentWorkspace: Workspace | null
  isAdmin: boolean
  isOwner: boolean
  users: User[]
  clients: Client[]
  tasks: Task[]
  comments: Comment[]
  notifications: WaNotification[]
  pendingNotifications: number
  userById: (id: string | null) => User | undefined
  clientById: (id: string | null) => Client | undefined
  commentsFor: (taskId: string) => Comment[]
  tasksForClient: (clientId: string) => Task[]
  canEditTask: (task: Task) => boolean
  canChangeStatus: (task: Task) => boolean
  // auth
  login: (email: string, password: string) => Promise<Result>
  register: (input: RegisterInput) => Promise<Result>
  logout: () => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<Result>
  resetPassword: (email: string, newPassword: string) => Promise<Result>
  deleteAccount: () => Result
  // tasks
  addTask: (input: NewTaskInput) => Task | null
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  setStatus: (id: string, status: TaskStatus) => void
  // clients
  addClient: (input: ClientInput) => Client | null
  updateClient: (id: string, patch: Partial<ClientInput>) => void
  deleteClient: (id: string) => void
  // team / workspace
  updateUserRole: (id: string, role: Role) => Result
  updateUser: (id: string, patch: Partial<Pick<User, 'full_name' | 'role'>>) => void
  updateWorkspace: (patch: Partial<Pick<Workspace, 'name' | 'wa_enabled' | 'wa_template'>>) => void
  regenerateInvite: () => void
  // comments
  addComment: (taskId: string, body: string) => void
  // whatsapp
  logClientUpdate: (taskId: string, body?: string) => void
  logClientMessage: (clientId: string, body: string) => void
  updateNotificationBody: (id: string, body: string) => void
  markNotificationSent: (id: string) => void
  // demo
  resetDemo: () => void
}

const Ctx = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setState(loadState())
    setCurrentUserId(localStorage.getItem(SESSION_KEY))
    setReady(true)
    function onStorage(e: StorageEvent) {
      if (e.key === STORE_KEY) setState(loadState())
      if (e.key === SESSION_KEY) setCurrentUserId(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function commit(updater: (prev: AppState) => AppState) {
    setState((prev) => {
      const next = updater(prev)
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next))
      } catch {
        /* ignore quota */
      }
      return next
    })
  }

  function setSession(id: string | null) {
    if (id) localStorage.setItem(SESSION_KEY, id)
    else localStorage.removeItem(SESSION_KEY)
    setCurrentUserId(id)
  }

  const currentUser = state.users.find((u) => u.id === currentUserId) ?? null
  const currentWorkspace = currentUser
    ? state.workspaces.find((w) => w.id === currentUser.workspace_id) ?? null
    : null
  const isOwner = !!(currentUser && currentWorkspace && currentWorkspace.owner_id === currentUser.id)
  const isAdmin = !!(currentUser && (currentUser.role === 'admin' || isOwner))
  const wsId = currentWorkspace?.id ?? null

  const users = wsId ? state.users.filter((u) => u.workspace_id === wsId) : []
  const clients = wsId ? state.clients.filter((c) => c.workspace_id === wsId) : []
  const tasks = wsId ? state.tasks.filter((t) => t.workspace_id === wsId) : []
  const comments = wsId ? state.comments.filter((c) => c.workspace_id === wsId) : []
  const notifications = wsId
    ? state.notifications
        .filter((n) => n.workspace_id === wsId)
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    : []

  function canEditTask(_task: Task): boolean {
    return isAdmin
  }
  function canChangeStatus(task: Task): boolean {
    return isAdmin || task.assigned_to === currentUser?.id
  }

  const value: AppContextValue = {
    ready,
    currentUser,
    currentWorkspace,
    isAdmin,
    isOwner,
    users,
    clients,
    tasks,
    comments,
    notifications,
    pendingNotifications: notifications.filter((n) => n.status === 'pending').length,
    userById: (id) => (id ? state.users.find((u) => u.id === id) : undefined),
    clientById: (id) => (id ? state.clients.find((c) => c.id === id) : undefined),
    commentsFor: (taskId) =>
      comments
        .filter((c) => c.task_id === taskId)
        .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    tasksForClient: (clientId) => tasks.filter((t) => t.client_id === clientId),
    canEditTask,
    canChangeStatus,

    login: async (email, password) => {
      const user = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      if (!user) return { ok: false, error: 'No account found with that email.' }
      let ok = false
      if (user.password_hash && user.password_salt) {
        ok = await verifyPassword(password, user.password_hash, user.password_salt)
      } else if (user.password) {
        ok = user.password === password
      }
      if (!ok) return { ok: false, error: 'Incorrect password.' }
      setSession(user.id)
      return { ok: true }
    },

    register: async (input) => {
      const email = input.email.trim().toLowerCase()
      if (!input.full_name.trim()) return { ok: false, error: 'Please enter your name.' }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        return { ok: false, error: 'Please enter a valid email address.' }
      if (input.password.length < 6)
        return { ok: false, error: 'Password must be at least 6 characters.' }
      if (state.users.some((u) => u.email.toLowerCase() === email))
        return { ok: false, error: 'An account with that email already exists.' }

      const { hash, salt } = await hashPassword(input.password)
      const userId = randomId('u')
      const now = new Date().toISOString()
      const base = {
        id: userId,
        full_name: input.full_name.trim(),
        email,
        password_hash: hash,
        password_salt: salt,
        avatar_color: pickAvatarColor(userId),
        created_at: now,
      }

      if (input.mode === 'create') {
        if (!input.workspaceName?.trim()) return { ok: false, error: 'Please name your firm / workspace.' }
        const newWsId = randomId('ws')
        const workspace: Workspace = {
          id: newWsId,
          name: input.workspaceName.trim(),
          invite_code: generateInviteCode(),
          owner_id: userId,
          wa_enabled: true,
          wa_template: DEFAULT_WA_TEMPLATE,
          created_at: now,
        }
        const user: User = { ...base, workspace_id: newWsId, role: 'admin' }
        commit((prev) => ({
          ...prev,
          workspaces: [...prev.workspaces, workspace],
          users: [...prev.users, user],
        }))
      } else {
        const code = (input.inviteCode ?? '').trim()
        if (!code) return { ok: false, error: 'Enter an invite code to join a workspace.' }
        const workspace = state.workspaces.find((w) => w.invite_code === code)
        if (!workspace) return { ok: false, error: 'That invite code is not valid.' }
        const user: User = { ...base, workspace_id: workspace.id, role: 'standard' }
        commit((prev) => ({ ...prev, users: [...prev.users, user] }))
      }
      setSession(userId)
      return { ok: true }
    },

    logout: () => setSession(null),

    changePassword: async (currentPassword, newPassword) => {
      if (!currentUser) return { ok: false, error: 'Not signed in.' }
      let ok = false
      if (currentUser.password_hash && currentUser.password_salt) {
        ok = await verifyPassword(currentPassword, currentUser.password_hash, currentUser.password_salt)
      } else if (currentUser.password) {
        ok = currentUser.password === currentPassword
      }
      if (!ok) return { ok: false, error: 'Current password is incorrect.' }
      if (newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' }
      const { hash, salt } = await hashPassword(newPassword)
      commit((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === currentUser.id ? { ...u, password_hash: hash, password_salt: salt, password: undefined } : u,
        ),
      }))
      return { ok: true }
    },

    resetPassword: async (email, newPassword) => {
      const e = email.trim().toLowerCase()
      const user = state.users.find((u) => u.email.toLowerCase() === e)
      if (!user) return { ok: false, error: 'No account found with that email.' }
      if (newPassword.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
      const { hash, salt } = await hashPassword(newPassword)
      commit((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === user.id ? { ...u, password_hash: hash, password_salt: salt, password: undefined } : u,
        ),
      }))
      return { ok: true }
    },

    deleteAccount: () => {
      if (!currentUser || !currentWorkspace) return { ok: false, error: 'Not signed in.' }
      const wid = currentWorkspace.id
      const uid2 = currentUser.id
      if (isOwner) {
        commit((prev) => ({
          workspaces: prev.workspaces.filter((w) => w.id !== wid),
          users: prev.users.filter((u) => u.workspace_id !== wid),
          clients: prev.clients.filter((c) => c.workspace_id !== wid),
          tasks: prev.tasks.filter((t) => t.workspace_id !== wid),
          comments: prev.comments.filter((c) => c.workspace_id !== wid),
          notifications: prev.notifications.filter((n) => n.workspace_id !== wid),
        }))
      } else {
        commit((prev) => ({
          ...prev,
          users: prev.users.filter((u) => u.id !== uid2),
          tasks: prev.tasks.map((t) => (t.assigned_to === uid2 ? { ...t, assigned_to: null } : t)),
          clients: prev.clients.map((c) => (c.assigned_to === uid2 ? { ...c, assigned_to: null } : c)),
        }))
      }
      setSession(null)
      return { ok: true }
    },

    addTask: (input) => {
      if (!isAdmin || !currentWorkspace || !currentUser) return null
      const now = new Date().toISOString()
      const task: Task = {
        id: randomId('t'),
        workspace_id: currentWorkspace.id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        status: input.status ?? 'pending',
        priority: input.priority,
        category: input.category ?? 'other',
        deadline: input.deadline || null,
        assigned_to: input.assigned_to || currentUser.id,
        created_by: currentUser.id,
        client_id: input.client_id || null,
        created_at: now,
        updated_at: now,
      }
      commit((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }))
      return task
    },

    updateTask: (id, patch) => {
      const task = state.tasks.find((t) => t.id === id)
      if (!task || !isAdmin || task.workspace_id !== wsId) return
      commit((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t,
        ),
      }))
    },

    deleteTask: (id) => {
      const task = state.tasks.find((t) => t.id === id)
      if (!task || !isAdmin || task.workspace_id !== wsId) return
      commit((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
        comments: prev.comments.filter((c) => c.task_id !== id),
      }))
    },

    setStatus: (id, status) => {
      const task = state.tasks.find((t) => t.id === id)
      if (!task || task.workspace_id !== wsId) return
      if (!(isAdmin || task.assigned_to === currentUser?.id)) return
      const now = new Date().toISOString()
      commit((prev) => {
        const tasks = prev.tasks.map((t) => (t.id === id ? { ...t, status, updated_at: now } : t))
        let notifications = prev.notifications
        const client = task.client_id ? prev.clients.find((c) => c.id === task.client_id) : undefined
        const newlyDone = status === 'completed' && task.status !== 'completed'
        if (newlyDone && client?.phone && currentWorkspace?.wa_enabled) {
          const exists = prev.notifications.some((n) => n.task_id === id && n.status === 'pending')
          if (!exists) {
            notifications = [
              {
                id: randomId('n'),
                workspace_id: currentWorkspace.id,
                task_id: task.id,
                task_title: task.title,
                to_name: client.contact_person || client.name,
                to_phone: client.phone,
                body: buildMessage(task, client, currentWorkspace),
                status: 'pending',
                created_at: now,
              },
              ...prev.notifications,
            ]
          }
        }
        return { ...prev, tasks, notifications }
      })
    },

    addClient: (input) => {
      if (!isAdmin || !currentWorkspace) return null
      const now = new Date().toISOString()
      const client: Client = {
        id: randomId('c'),
        workspace_id: currentWorkspace.id,
        name: input.name.trim(),
        type: input.type,
        gstin: input.gstin?.trim().toUpperCase() || null,
        pan: input.pan?.trim().toUpperCase() || null,
        contact_person: input.contact_person?.trim() || null,
        phone: input.phone ? sanitizePhone(input.phone) : null,
        email: input.email?.trim() || null,
        notes: input.notes?.trim() || null,
        assigned_to: input.assigned_to || null,
        active: input.active ?? true,
        created_at: now,
      }
      commit((prev) => ({ ...prev, clients: [client, ...prev.clients] }))
      return client
    },

    updateClient: (id, patch) => {
      const client = state.clients.find((c) => c.id === id)
      if (!client || !isAdmin || client.workspace_id !== wsId) return
      const clean: Partial<Client> = {}
      if (patch.name !== undefined) clean.name = patch.name.trim()
      if (patch.type !== undefined) clean.type = patch.type
      if (patch.gstin !== undefined) clean.gstin = patch.gstin?.trim().toUpperCase() || null
      if (patch.pan !== undefined) clean.pan = patch.pan?.trim().toUpperCase() || null
      if (patch.contact_person !== undefined) clean.contact_person = patch.contact_person?.trim() || null
      if (patch.phone !== undefined) clean.phone = patch.phone ? sanitizePhone(patch.phone) : null
      if (patch.email !== undefined) clean.email = patch.email?.trim() || null
      if (patch.notes !== undefined) clean.notes = patch.notes?.trim() || null
      if (patch.assigned_to !== undefined) clean.assigned_to = patch.assigned_to || null
      if (patch.active !== undefined) clean.active = patch.active
      commit((prev) => ({
        ...prev,
        clients: prev.clients.map((c) => (c.id === id ? { ...c, ...clean } : c)),
      }))
    },

    deleteClient: (id) => {
      const client = state.clients.find((c) => c.id === id)
      if (!client || !isAdmin || client.workspace_id !== wsId) return
      commit((prev) => ({
        ...prev,
        clients: prev.clients.filter((c) => c.id !== id),
        tasks: prev.tasks.map((t) => (t.client_id === id ? { ...t, client_id: null } : t)),
      }))
    },

    updateUserRole: (id, role) => {
      if (!isAdmin || !currentWorkspace) return { ok: false, error: 'Only admins can change roles.' }
      const target = state.users.find((u) => u.id === id)
      if (!target || target.workspace_id !== currentWorkspace.id)
        return { ok: false, error: 'User not found.' }
      if (currentWorkspace.owner_id === id)
        return { ok: false, error: 'The workspace owner’s role cannot be changed.' }
      commit((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === id ? { ...u, role } : u)),
      }))
      return { ok: true }
    },

    updateUser: (id, patch) => {
      if (id !== currentUser?.id && !isAdmin) return
      const target = state.users.find((u) => u.id === id)
      if (!target || target.workspace_id !== wsId) return
      const clean: Partial<User> = {}
      if (typeof patch.full_name === 'string') clean.full_name = patch.full_name
      if (patch.role && isAdmin && currentWorkspace?.owner_id !== id) clean.role = patch.role
      commit((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === id ? { ...u, ...clean } : u)),
      }))
    },

    updateWorkspace: (patch) => {
      if (!isAdmin || !currentWorkspace) return
      commit((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((w) =>
          w.id === currentWorkspace.id ? { ...w, ...patch } : w,
        ),
      }))
    },

    regenerateInvite: () => {
      if (!isAdmin || !currentWorkspace) return
      const code = generateInviteCode()
      commit((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((w) =>
          w.id === currentWorkspace.id ? { ...w, invite_code: code } : w,
        ),
      }))
    },

    addComment: (taskId, body) => {
      if (!body.trim() || !currentUser || !currentWorkspace) return
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task || task.workspace_id !== currentWorkspace.id) return
      const c: Comment = {
        id: randomId('cm'),
        workspace_id: currentWorkspace.id,
        task_id: taskId,
        author_id: currentUser.id,
        body: body.trim(),
        created_at: new Date().toISOString(),
      }
      commit((prev) => ({ ...prev, comments: [...prev.comments, c] }))
    },

    logClientUpdate: (taskId, body) => {
      if (!isAdmin || !currentWorkspace) return
      const task = state.tasks.find((t) => t.id === taskId)
      const client = task?.client_id ? state.clients.find((c) => c.id === task.client_id) : undefined
      if (!task || !client?.phone) return
      const now = new Date().toISOString()
      commit((prev) => ({
        ...prev,
        notifications: [
          {
            id: randomId('n'),
            workspace_id: currentWorkspace.id,
            task_id: task.id,
            task_title: task.title,
            to_name: client.contact_person || client.name,
            to_phone: client.phone!,
            body: (body ?? buildMessage(task, client, currentWorkspace)).trim(),
            status: 'sent',
            created_at: now,
            sent_at: now,
          },
          ...prev.notifications.filter((n) => !(n.task_id === taskId && n.status === 'pending')),
        ],
      }))
    },

    logClientMessage: (clientId, body) => {
      if (!isAdmin || !currentWorkspace || !body.trim()) return
      const client = state.clients.find((c) => c.id === clientId)
      if (!client?.phone) return
      const now = new Date().toISOString()
      commit((prev) => ({
        ...prev,
        notifications: [
          {
            id: randomId('n'),
            workspace_id: currentWorkspace.id,
            task_id: '',
            task_title: 'Direct message',
            to_name: client.contact_person || client.name,
            to_phone: client.phone!,
            body: body.trim(),
            status: 'sent',
            created_at: now,
            sent_at: now,
          },
          ...prev.notifications,
        ],
      }))
    },

    updateNotificationBody: (id, body) => {
      if (!isAdmin) return
      commit((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id && n.workspace_id === wsId ? { ...n, body } : n,
        ),
      }))
    },

    markNotificationSent: (id) => {
      if (!isAdmin) return
      const now = new Date().toISOString()
      commit((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, status: 'sent', sent_at: now } : n,
        ),
      }))
    },

    resetDemo: () => {
      const seed = buildSeed()
      localStorage.setItem(STORE_KEY, JSON.stringify(seed))
      setState(seed)
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
