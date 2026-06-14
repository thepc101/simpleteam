export type Role = 'admin' | 'leader' | 'standard'
export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskCategory = 'gst' | 'income_tax' | 'tds' | 'roc' | 'audit' | 'advisory' | 'other'
export type ClientType =
  | 'private_limited'
  | 'public_limited'
  | 'llp'
  | 'partnership'
  | 'proprietorship'
  | 'individual'
  | 'huf'
  | 'trust'

export interface Workspace {
  id: string
  name: string
  invite_code: string
  owner_id: string
  wa_enabled: boolean
  wa_template: string
  created_at: string
}

export interface JoinRequest {
  id: string
  workspace_id: string
  user_id: string
  email: string | null
  full_name: string | null
  username: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface User {
  id: string
  workspace_id: string
  full_name: string
  username?: string | null
  email: string
  password_hash?: string
  password_salt?: string
  password?: string // demo seed only
  role: Role
  avatar_color: string
  created_at: string
}

export interface Client {
  id: string
  workspace_id: string
  name: string
  type: ClientType
  gstin: string | null
  pan: string | null
  contact_person: string | null
  phone: string | null // WhatsApp
  email: string | null
  notes: string | null
  assigned_to: string | null // team member responsible for this client
  active: boolean
  created_at: string
}

export interface Comment {
  id: string
  workspace_id: string
  task_id: string
  author_id: string
  body: string
  created_at: string
}

export interface Task {
  id: string
  workspace_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  category: TaskCategory
  deadline: string | null // null => "Pending Works" backlog
  assigned_to: string | null
  created_by: string
  client_id: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  workspace_id: string
  channel: string // 'general' or a DM key (dm:<idA>:<idB>)
  author_id: string
  body: string
  created_at: string
}

export interface WaNotification {
  id: string
  workspace_id: string
  task_id: string
  task_title: string
  to_name: string
  to_phone: string
  body: string
  status: 'pending' | 'sent'
  created_at: string
  sent_at?: string
}

export interface AppState {
  workspaces: Workspace[]
  users: User[]
  clients: Client[]
  tasks: Task[]
  comments: Comment[]
  messages: ChatMessage[]
  notifications: WaNotification[]
  joinRequests: JoinRequest[]
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  leader: 'Team Leader',
  standard: 'Member',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}
