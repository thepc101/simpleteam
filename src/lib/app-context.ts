'use client'

import { createContext, useContext } from 'react'
import type {
  ChatMessage,
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

export type Result = { ok: true } | { ok: false; error: string }

export interface AppContextValue {
  ready: boolean
  currentUser: User | null
  currentWorkspace: Workspace | null
  isAdmin: boolean
  isOwner: boolean
  users: User[]
  clients: Client[]
  tasks: Task[]
  comments: Comment[]
  messages: ChatMessage[]
  notifications: WaNotification[]
  pendingNotifications: number
  userById: (id: string | null) => User | undefined
  clientById: (id: string | null) => Client | undefined
  commentsFor: (taskId: string) => Comment[]
  messagesFor: (channel: string) => ChatMessage[]
  tasksForClient: (clientId: string) => Task[]
  sendMessage: (channel: string, body: string) => void
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

export const AppCtx = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}

/** Which member-management backend is active (for UI copy differences). */
export const BACKEND: 'local' | 'supabase' =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? 'supabase'
    : 'local'
