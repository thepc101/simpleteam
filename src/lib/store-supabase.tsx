'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AppCtx, type AppContextValue } from './app-context'
import { supabase } from './supabaseClient'
import type {
  ChatMessage,
  Client,
  Comment,
  JoinRequest,
  Task,
  User,
  WaNotification,
  Workspace,
} from './types'
import { generateInviteCode, sanitizePhone } from './crypto'
import { pickAvatarColor } from './utils'
import { buildMessage } from './whatsapp'

interface DB {
  workspace: Workspace | null
  users: User[]
  clients: Client[]
  tasks: Task[]
  comments: Comment[]
  messages: ChatMessage[]
  notifications: WaNotification[]
  joinRequests: JoinRequest[]
}
const EMPTY_DB: DB = {
  workspace: null,
  users: [],
  clients: [],
  tasks: [],
  comments: [],
  notifications: [],
  messages: [],
  joinRequests: [],
}

const TABLE_KEY: Record<string, keyof DB> = {
  profiles: 'users',
  clients: 'clients',
  tasks: 'tasks',
  comments: 'comments',
  messages: 'messages',
  notifications: 'notifications',
  join_requests: 'joinRequests',
}

const uuid = () => crypto.randomUUID()
const nowIso = () => new Date().toISOString()

export function SupabaseAppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(EMPTY_DB)
  const [me, setMe] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const loadedRef = useRef<string | null>(null)
  const loadRef = useRef<((uid: string) => Promise<void>) | null>(null)

  // ---- local state helpers (optimistic; realtime echoes are deduped by id) ----
  function upsert(key: keyof DB, row: { id: string }) {
    setDb((prev) => {
      const arr = prev[key] as unknown as { id: string }[]
      const i = arr.findIndex((x) => x.id === row.id)
      const next = i >= 0 ? arr.map((x) => (x.id === row.id ? row : x)) : [row, ...arr]
      return { ...prev, [key]: next } as DB
    })
  }
  function patch(key: keyof DB, id: string, p: Record<string, unknown>) {
    setDb(
      (prev) =>
        ({
          ...prev,
          [key]: (prev[key] as unknown as { id: string }[]).map((x) => (x.id === id ? { ...x, ...p } : x)),
        }) as DB,
    )
  }
  function remove(key: keyof DB, id: string) {
    setDb(
      (prev) =>
        ({
          ...prev,
          [key]: (prev[key] as unknown as { id: string }[]).filter((x) => x.id !== id),
        }) as DB,
    )
  }

  useEffect(() => {
    if (!supabase) {
      setReady(true)
      return
    }
    const sb = supabase
    let channel: ReturnType<typeof sb.channel> | null = null

    function applyChange(table: string, payload: { eventType: string; new: unknown; old: unknown }) {
      if (table === 'workspaces') {
        if (payload.eventType !== 'DELETE') setDb((p) => ({ ...p, workspace: payload.new as Workspace }))
        return
      }
      const key = TABLE_KEY[table]
      if (!key) return
      setDb((prev) => {
        const arr = prev[key] as unknown as { id: string }[]
        if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as { id?: string })?.id
          return { ...prev, [key]: arr.filter((x) => x.id !== oldId) } as DB
        }
        const row = payload.new as { id: string }
        const i = arr.findIndex((x) => x.id === row.id)
        return { ...prev, [key]: i >= 0 ? arr.map((x) => (x.id === row.id ? row : x)) : [...arr, row] } as DB
      })
    }

    function subscribe(wsId: string, userId: string) {
      if (channel) sb.removeChannel(channel)
      channel = sb.channel(`ws-${wsId}`)
      for (const table of ['profiles', 'clients', 'tasks', 'comments', 'messages', 'notifications', 'workspaces', 'join_requests']) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: table === 'workspaces' ? `id=eq.${wsId}` : `workspace_id=eq.${wsId}` },
          (payload) => applyChange(table, payload as unknown as { eventType: string; new: unknown; old: unknown }),
        )
      }
      channel.subscribe()
      void userId
    }

    // For a signed-in user with no team yet: watch their own profile + join requests
    // so they enter automatically the moment an owner approves them.
    function subscribePending(userId: string) {
      if (channel) sb.removeChannel(channel)
      channel = sb.channel(`pending-${userId}`)
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => loadFor(userId))
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests', filter: `user_id=eq.${userId}` }, () => loadFor(userId))
      channel.subscribe()
    }

    async function loadFor(userId: string) {
      const { data: prof } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (!prof) {
        setMe(null)
        setDb(EMPTY_DB)
        setReady(true)
        return
      }
      const wsId = (prof as User).workspace_id
      if (!wsId) {
        // Signed in but no team yet → onboarding (create or request to join).
        const { data: reqs } = await sb.from('join_requests').select('*').eq('user_id', userId)
        setMe(prof as User)
        setDb({ ...EMPTY_DB, joinRequests: (reqs as JoinRequest[]) ?? [] })
        setReady(true)
        subscribePending(userId)
        return
      }
      const [ws, users, clients, tasks, comments, messages, notifications, joinRequests] = await Promise.all([
        sb.from('workspaces').select('*').eq('id', wsId).maybeSingle(),
        sb.from('profiles').select('*').eq('workspace_id', wsId),
        sb.from('clients').select('*').eq('workspace_id', wsId),
        sb.from('tasks').select('*').eq('workspace_id', wsId),
        sb.from('comments').select('*').eq('workspace_id', wsId),
        sb.from('messages').select('*').eq('workspace_id', wsId),
        sb.from('notifications').select('*').eq('workspace_id', wsId),
        sb.from('join_requests').select('*').eq('workspace_id', wsId),
      ])
      setMe(prof as User)
      setDb({
        workspace: (ws.data as Workspace) ?? null,
        users: (users.data as User[]) ?? [],
        clients: (clients.data as Client[]) ?? [],
        tasks: (tasks.data as Task[]) ?? [],
        comments: (comments.data as Comment[]) ?? [],
        messages: (messages.data as ChatMessage[]) ?? [],
        notifications: (notifications.data as WaNotification[]) ?? [],
        joinRequests: (joinRequests.data as JoinRequest[]) ?? [],
      })
      setReady(true)
      subscribe(wsId, userId)
    }
    loadRef.current = loadFor

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        loadedRef.current = null
        setMe(null)
        setDb(EMPTY_DB)
        if (channel) {
          sb.removeChannel(channel)
          channel = null
        }
        setReady(true)
        return
      }
      if (loadedRef.current !== session.user.id) {
        loadedRef.current = session.user.id
        loadFor(session.user.id)
      }
    })

    return () => {
      sub.subscription.unsubscribe()
      if (channel) sb.removeChannel(channel)
    }
  }, [])

  // ---- derived ----
  const currentWorkspace = db.workspace
  const isOwner = !!(me && currentWorkspace && currentWorkspace.owner_id === me.id)
  const isAdmin = !!(me && (me.role === 'admin' || isOwner))
  const canChangeStatus = (task: Task) => isAdmin || task.assigned_to === me?.id

  const value: AppContextValue = {
    ready,
    currentUser: me,
    currentWorkspace,
    isAdmin,
    isOwner,
    users: db.users,
    clients: db.clients,
    tasks: db.tasks,
    comments: db.comments,
    messages: db.messages,
    notifications: [...db.notifications].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    pendingNotifications: db.notifications.filter((n) => n.status === 'pending').length,
    joinRequests: db.joinRequests,
    myJoinRequest: me ? db.joinRequests.find((r) => r.user_id === me.id && r.status === 'pending') ?? null : null,
    userById: (id) => (id ? db.users.find((u) => u.id === id) : undefined),
    clientById: (id) => (id ? db.clients.find((c) => c.id === id) : undefined),
    commentsFor: (taskId) =>
      db.comments.filter((c) => c.task_id === taskId).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    messagesFor: (channel) =>
      db.messages.filter((m) => m.channel === channel).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    tasksForClient: (clientId) => db.tasks.filter((t) => t.client_id === clientId),
    canEditTask: () => isAdmin,
    canChangeStatus,

    // ---- auth ----
    login: async (email, password) => {
      if (!supabase) return { ok: false, error: 'Supabase not configured.' }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      return error ? { ok: false, error: error.message } : { ok: true }
    },
    register: async (input) => {
      if (!supabase) return { ok: false, error: 'Supabase not configured.' }
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: { data: { avatar_color: pickAvatarColor(input.email) } },
      })
      if (error) return { ok: false, error: error.message }
      if (!data.session)
        return { ok: false, error: 'Account created! Please check your email to confirm your address, then sign in.' }
      return { ok: true }
    },
    createWorkspace: async (name, fullName, username) => {
      if (!supabase || !me) return { ok: false, error: 'Not signed in.' }
      if (!fullName.trim()) return { ok: false, error: 'Please enter your full name.' }
      if (!name.trim()) return { ok: false, error: 'Please name your team.' }
      const { error } = await supabase.rpc('create_workspace', {
        p_name: name.trim(),
        p_full_name: fullName.trim(),
        p_username: username.trim(),
      })
      if (error) return { ok: false, error: error.message }
      await loadRef.current?.(me.id)
      return { ok: true }
    },
    requestJoin: async (inviteCode, fullName, username) => {
      if (!supabase || !me) return { ok: false, error: 'Not signed in.' }
      if (!fullName.trim()) return { ok: false, error: 'Please enter your full name.' }
      if (!inviteCode.trim()) return { ok: false, error: 'Enter an invite code.' }
      const { error } = await supabase.rpc('request_join', {
        p_code: inviteCode.trim(),
        p_full_name: fullName.trim(),
        p_username: username.trim(),
      })
      if (error)
        return { ok: false, error: /invalid/i.test(error.message) ? 'That invite code is not valid.' : error.message }
      await loadRef.current?.(me.id)
      return { ok: true }
    },
    cancelJoinRequest: () => {
      if (!supabase || !me) return
      const myReq = db.joinRequests.find((r) => r.user_id === me.id && r.status === 'pending')
      if (myReq) remove('joinRequests', myReq.id)
      supabase.from('join_requests').delete().eq('user_id', me.id).then(({ error }) => error && console.error(error))
    },
    approveJoin: (requestId, role) => {
      if (!supabase || !isAdmin || !me) return
      supabase.rpc('approve_join', { p_request: requestId, p_role: role }).then(({ error }) => {
        if (error) console.error(error)
        else loadRef.current?.(me.id)
      })
    },
    rejectJoin: (requestId) => {
      if (!supabase || !isAdmin) return
      patch('joinRequests', requestId, { status: 'rejected' })
      supabase.rpc('reject_join', { p_request: requestId }).then(({ error }) => error && console.error(error))
    },
    logout: () => {
      supabase?.auth.signOut()
    },
    changePassword: async (currentPassword, newPassword) => {
      if (!supabase || !me) return { ok: false, error: 'Not signed in.' }
      const { error: e1 } = await supabase.auth.signInWithPassword({ email: me.email, password: currentPassword })
      if (e1) return { ok: false, error: 'Current password is incorrect.' }
      if (newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' }
      const { error: e2 } = await supabase.auth.updateUser({ password: newPassword })
      return e2 ? { ok: false, error: e2.message } : { ok: true }
    },
    resetPassword: async (email) => {
      if (!supabase) return { ok: false, error: 'Supabase not configured.' }
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset` : undefined
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      return error ? { ok: false, error: error.message } : { ok: true }
    },
    deleteAccount: () => {
      if (!supabase || !me || !currentWorkspace) return { ok: false, error: 'Not signed in.' }
      const wsId = currentWorkspace.id
      const myId = me.id
      ;(async () => {
        if (isOwner) await supabase.from('workspaces').delete().eq('id', wsId)
        else await supabase.from('profiles').delete().eq('id', myId)
        await supabase.auth.signOut()
      })()
      return { ok: true }
    },

    // ---- tasks ----
    addTask: (input) => {
      if (!isAdmin || !currentWorkspace || !me || !supabase) return null
      const t: Task = {
        id: uuid(),
        workspace_id: currentWorkspace.id,
        title: input.title.trim().slice(0, 200),
        description: input.description?.trim().slice(0, 4000) || null,
        status: input.status ?? 'pending',
        priority: input.priority,
        category: input.category ?? 'other',
        deadline: input.deadline || null,
        assigned_to: input.assigned_to || me.id,
        created_by: me.id,
        client_id: input.client_id || null,
        created_at: nowIso(),
        updated_at: nowIso(),
      }
      upsert('tasks', t)
      supabase.from('tasks').insert(t).then(({ error }) => error && console.error(error))
      return t
    },
    updateTask: (id, p) => {
      if (!isAdmin || !supabase) return
      const updated_at = nowIso()
      patch('tasks', id, { ...p, updated_at })
      supabase.from('tasks').update({ ...p, updated_at }).eq('id', id).then(({ error }) => error && console.error(error))
    },
    deleteTask: (id) => {
      if (!isAdmin || !supabase) return
      remove('tasks', id)
      supabase.from('tasks').delete().eq('id', id).then(({ error }) => error && console.error(error))
    },
    setStatus: (id, status) => {
      const task = db.tasks.find((t) => t.id === id)
      if (!task || !supabase || !(isAdmin || task.assigned_to === me?.id)) return
      const updated_at = nowIso()
      patch('tasks', id, { status, updated_at })
      // status-only RPC (RLS lets only admins update task rows directly)
      supabase.rpc('set_task_status', { p_task: id, p_status: status }).then(({ error }) => error && console.error(error))
      const client = task.client_id ? db.clients.find((c) => c.id === task.client_id) : undefined
      if (isAdmin && status === 'completed' && task.status !== 'completed' && client?.phone && currentWorkspace?.wa_enabled) {
        const already = db.notifications.some((n) => n.task_id === id && n.status === 'pending')
        if (!already) {
          const n: WaNotification = {
            id: uuid(),
            workspace_id: currentWorkspace.id,
            task_id: task.id,
            task_title: task.title,
            to_name: client.contact_person || client.name,
            to_phone: client.phone,
            body: buildMessage(task, client, currentWorkspace),
            status: 'pending',
            created_at: nowIso(),
          }
          upsert('notifications', n)
          supabase.from('notifications').insert(n).then(({ error }) => error && console.error(error))
        }
      }
    },

    // ---- clients ----
    addClient: (input) => {
      if (!isAdmin || !currentWorkspace || !supabase) return null
      const c: Client = {
        id: uuid(),
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
        created_at: nowIso(),
      }
      upsert('clients', c)
      supabase.from('clients').insert(c).then(({ error }) => error && console.error(error))
      return c
    },
    updateClient: (id, p) => {
      if (!isAdmin || !supabase) return
      const clean: Record<string, unknown> = { ...p }
      if (typeof p.gstin === 'string') clean.gstin = p.gstin.trim().toUpperCase() || null
      if (typeof p.pan === 'string') clean.pan = p.pan.trim().toUpperCase() || null
      if (typeof p.phone === 'string') clean.phone = p.phone ? sanitizePhone(p.phone) : null
      patch('clients', id, clean)
      supabase.from('clients').update(clean).eq('id', id).then(({ error }) => error && console.error(error))
    },
    deleteClient: (id) => {
      if (!isAdmin || !supabase) return
      remove('clients', id)
      supabase.from('clients').delete().eq('id', id).then(({ error }) => error && console.error(error))
    },

    // ---- team / workspace ----
    updateUserRole: (id, role) => {
      if (!isAdmin || !currentWorkspace) return { ok: false, error: 'Only admins can change roles.' }
      if (currentWorkspace.owner_id === id) return { ok: false, error: 'The workspace owner’s role cannot be changed.' }
      patch('users', id, { role })
      supabase?.from('profiles').update({ role }).eq('id', id).then(({ error }) => error && console.error(error))
      return { ok: true }
    },
    updateUser: (id, p) => {
      if (!supabase || (id !== me?.id && !isAdmin)) return
      const clean: Record<string, unknown> = {}
      if (typeof p.full_name === 'string') clean.full_name = p.full_name
      if (p.role && isAdmin && currentWorkspace?.owner_id !== id) clean.role = p.role
      patch('users', id, clean)
      supabase.from('profiles').update(clean).eq('id', id).then(({ error }) => error && console.error(error))
    },
    updateWorkspace: (p) => {
      if (!isAdmin || !currentWorkspace || !supabase) return
      setDb((prev) => ({ ...prev, workspace: prev.workspace ? { ...prev.workspace, ...p } : prev.workspace }))
      supabase.from('workspaces').update(p).eq('id', currentWorkspace.id).then(({ error }) => error && console.error(error))
    },
    regenerateInvite: () => {
      if (!isAdmin || !currentWorkspace || !supabase) return
      const invite_code = generateInviteCode()
      setDb((prev) => ({ ...prev, workspace: prev.workspace ? { ...prev.workspace, invite_code } : prev.workspace }))
      supabase.from('workspaces').update({ invite_code }).eq('id', currentWorkspace.id).then(({ error }) => error && console.error(error))
    },

    // ---- comments / chat ----
    addComment: (taskId, body) => {
      const text = body.trim().slice(0, 1000)
      if (!text || !me || !currentWorkspace || !supabase) return
      const c: Comment = {
        id: uuid(),
        workspace_id: currentWorkspace.id,
        task_id: taskId,
        author_id: me.id,
        body: text,
        created_at: nowIso(),
      }
      upsert('comments', c)
      supabase.from('comments').insert(c).then(({ error }) => error && console.error(error))
    },
    sendMessage: (channel, body) => {
      const text = body.trim().slice(0, 2000)
      if (!text || !me || !currentWorkspace || !channel || !supabase) return
      const m: ChatMessage = {
        id: uuid(),
        workspace_id: currentWorkspace.id,
        channel,
        author_id: me.id,
        body: text,
        created_at: nowIso(),
      }
      upsert('messages', m)
      supabase.from('messages').insert(m).then(({ error }) => error && console.error(error))
    },

    // ---- whatsapp ----
    logClientUpdate: (taskId, body) => {
      if (!isAdmin || !currentWorkspace || !supabase) return
      const sb = supabase
      const task = db.tasks.find((t) => t.id === taskId)
      const client = task?.client_id ? db.clients.find((c) => c.id === task.client_id) : undefined
      if (!task || !client?.phone) return
      // clear any pending for this task, then log a sent record
      db.notifications.filter((n) => n.task_id === taskId && n.status === 'pending').forEach((n) => {
        remove('notifications', n.id)
        sb.from('notifications').delete().eq('id', n.id)
      })
      const n: WaNotification = {
        id: uuid(),
        workspace_id: currentWorkspace.id,
        task_id: task.id,
        task_title: task.title,
        to_name: client.contact_person || client.name,
        to_phone: client.phone,
        body: (body ?? buildMessage(task, client, currentWorkspace)).trim(),
        status: 'sent',
        created_at: nowIso(),
        sent_at: nowIso(),
      }
      upsert('notifications', n)
      sb.from('notifications').insert(n).then(({ error }) => error && console.error(error))
    },
    logClientMessage: (clientId, body) => {
      if (!isAdmin || !currentWorkspace || !body.trim() || !supabase) return
      const client = db.clients.find((c) => c.id === clientId)
      if (!client?.phone) return
      const n: WaNotification = {
        id: uuid(),
        workspace_id: currentWorkspace.id,
        task_id: '',
        task_title: 'Direct message',
        to_name: client.contact_person || client.name,
        to_phone: client.phone,
        body: body.trim(),
        status: 'sent',
        created_at: nowIso(),
        sent_at: nowIso(),
      }
      upsert('notifications', n)
      supabase.from('notifications').insert(n).then(({ error }) => error && console.error(error))
    },
    updateNotificationBody: (id, body) => {
      if (!isAdmin || !supabase) return
      patch('notifications', id, { body })
      supabase.from('notifications').update({ body }).eq('id', id).then(({ error }) => error && console.error(error))
    },
    markNotificationSent: (id) => {
      if (!isAdmin || !supabase) return
      const sent_at = nowIso()
      patch('notifications', id, { status: 'sent', sent_at })
      supabase.from('notifications').update({ status: 'sent', sent_at }).eq('id', id).then(({ error }) => error && console.error(error))
    },
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
