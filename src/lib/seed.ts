import type { AppState, ChatMessage, Client, Task, User, WaNotification, Workspace } from './types'
import { generateInviteCode } from './crypto'
import { dmKey, pickAvatarColor } from './utils'
import { DEFAULT_WA_TEMPLATE } from './whatsapp'

export const DEMO_PASSWORD = 'demo1234'
const WS_ID = 'ws-acme'

function mkUser(id: string, full_name: string, email: string, role: User['role']): User {
  return {
    id,
    workspace_id: WS_ID,
    full_name,
    email,
    password: DEMO_PASSWORD, // demo-only; new sign-ups are PBKDF2-hashed
    role,
    avatar_color: pickAvatarColor(id),
    created_at: new Date('2025-01-05T09:00:00Z').toISOString(),
  }
}

export const SEED_USERS: User[] = [
  mkUser('u-admin', 'Aarav Sharma', 'admin@simpleteam.app', 'admin'),
  mkUser('u-priya', 'Priya Nair', 'priya@simpleteam.app', 'leader'),
  mkUser('u-rohan', 'Rohan Mehta', 'rohan@simpleteam.app', 'leader'),
  mkUser('u-diya', 'Diya Patel', 'diya@simpleteam.app', 'standard'),
  mkUser('u-karthik', 'Karthik Rao', 'karthik@simpleteam.app', 'standard'),
  mkUser('u-sneha', 'Sneha Gupta', 'sneha@simpleteam.app', 'standard'),
]

function mkClient(
  id: string,
  name: string,
  type: Client['type'],
  gstin: string | null,
  pan: string | null,
  contact_person: string | null,
  phone: string | null,
  email: string | null,
  assigned_to: string | null,
): Client {
  return {
    id,
    workspace_id: WS_ID,
    name,
    type,
    gstin,
    pan,
    contact_person,
    phone,
    email,
    notes: null,
    assigned_to,
    active: true,
    created_at: new Date('2025-01-10T09:00:00Z').toISOString(),
  }
}

export const SEED_CLIENTS: Client[] = [
  mkClient('c-nirvana', 'Nirvana Textiles Pvt Ltd', 'private_limited', '27AABCN1234A1Z5', 'AABCN1234A', 'Vikram Shah', '919876500001', 'accounts@nirvanatex.in', 'u-priya'),
  mkClient('c-sunrise', 'Sunrise Foods LLP', 'llp', '29AACFS5678B1Z3', 'AACFS5678B', 'Anita Rao', '919876500002', 'finance@sunrisefoods.in', 'u-priya'),
  mkClient('c-meridian', 'Meridian Auto Industries Pvt Ltd', 'private_limited', '06AAFCM4321C1Z8', 'AAFCM4321C', 'Sanjay Gupta', '919876500003', 'cfo@meridianauto.in', 'u-rohan'),
  mkClient('c-rahul', 'Rahul Verma', 'individual', null, 'ABCPV6789D', 'Rahul Verma', '919876500004', 'rahul.verma@gmail.com', 'u-rohan'),
  mkClient('c-greenleaf', 'Greenleaf Traders', 'proprietorship', '24ADGPT2345E1Z9', 'ADGPT2345E', 'Meena Joshi', '919876500005', 'greenleaf.traders@gmail.com', 'u-sneha'),
  mkClient('c-patel', 'Patel & Co.', 'partnership', '27AAEFP8765G1Z2', 'AAEFP8765G', 'Nikhil Patel', '919876500006', 'office@patelandco.in', 'u-karthik'),
]

function dayOffset(days: number): string {
  const d = new Date()
  d.setHours(17, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export function buildSeed(): AppState {
  const now = new Date()
  const ago = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString()

  const workspace: Workspace = {
    id: WS_ID,
    name: 'Acme & Associates, Chartered Accountants',
    invite_code: generateInviteCode(),
    owner_id: 'u-admin',
    wa_enabled: true,
    wa_template: DEFAULT_WA_TEMPLATE,
    created_at: new Date('2025-01-05T09:00:00Z').toISOString(),
  }

  const tasks: Task[] = [
    t('t1', 'File GSTR-3B — May 2025', 'Reconcile ITC against GSTR-2B and file the monthly summary return before the 20th.', 'in_progress', 'high', 'gst', dayOffset(-1), 'u-priya', ago(180), 'c-nirvana'),
    t('t2', 'File GSTR-1 — May 2025', 'Upload B2B and B2C outward supplies for the month.', 'pending', 'high', 'gst', dayOffset(1), 'u-diya', ago(60), 'c-greenleaf'),
    t('t3', 'Reply to GST notice (ASMT-10)', 'Draft a response to the scrutiny notice regarding the ITC mismatch.', 'pending', 'high', 'gst', dayOffset(2), 'u-priya', ago(200), 'c-nirvana'),
    t('t4', 'ITR filing — AY 2025-26', 'Compute total income, claim eligible deductions and file the return.', 'pending', 'medium', 'income_tax', dayOffset(8), 'u-rohan', ago(400), 'c-rahul'),
    t('t5', 'Advance tax — Q1 computation', 'Estimate the liability and prepare the challan for 15 June.', 'in_progress', 'high', 'income_tax', dayOffset(0), 'u-rohan', ago(90), 'c-patel'),
    t('t6', 'TDS return 26Q — Q1', 'Quarterly TDS return for non-salary payments.', 'in_progress', 'high', 'tds', dayOffset(3), 'u-priya', ago(140), 'c-meridian'),
    t('t7', 'TDS payment challan — May', 'Deposit the TDS deducted for May before the 7th.', 'completed', 'medium', 'tds', dayOffset(-6), 'u-diya', ago(8000), 'c-greenleaf'),
    t('t8', 'AOC-4 annual filing', 'File financial statements with the MCA (small company).', 'pending', 'high', 'roc', dayOffset(11), 'u-priya', ago(600), 'c-sunrise'),
    t('t9', 'MGT-7A annual return', 'Prepare and file the abridged annual return for the small company.', 'pending', 'medium', 'roc', dayOffset(14), 'u-karthik', ago(700), 'c-nirvana'),
    t('t10', 'DIR-3 KYC — directors', 'Complete annual KYC for all directors before 30 September.', 'completed', 'low', 'roc', dayOffset(-10), 'u-karthik', ago(14400), 'c-meridian'),
    t('t11', 'Statutory audit — FY 2024-25', 'Vouching, ledger scrutiny and drafting of the audit report.', 'in_progress', 'medium', 'audit', dayOffset(20), 'u-rohan', ago(1000), 'c-meridian'),
    t('t12', 'GSTR-9 annual return', 'Annual GST reconciliation — no fixed date scheduled yet.', 'pending', 'low', 'gst', null, 'u-priya', ago(1500), 'c-sunrise'),
    t('t13', 'Monthly bookkeeping review — May', 'Review Tally entries and flag mismatches for the client.', 'in_progress', 'medium', 'advisory', dayOffset(4), 'u-sneha', ago(120), 'c-greenleaf'),
    t('t14', 'Draft engagement letter', 'Prepare the FY25-26 engagement letter for partner sign-off.', 'pending', 'low', 'advisory', null, 'u-sneha', ago(2000), 'c-patel'),
    t('t15', 'Update firm compliance calendar', 'Internal: refresh the due-date tracker across all clients.', 'pending', 'low', 'other', null, 'u-admin', ago(800), null),
  ]

  const notifications: WaNotification[] = [
    notif('n1', 't7', 'TDS payment challan — May', 'Meena Joshi', '919876500005', 'Hello Meena Joshi, this is an update from Acme & Associates, Chartered Accountants. The task "TDS payment challan — May" has been completed. Thank you.', ago(7900)),
    notif('n2', 't10', 'DIR-3 KYC — directors', 'Sanjay Gupta', '919876500003', 'Hello Sanjay Gupta, this is an update from Acme & Associates, Chartered Accountants. The task "DIR-3 KYC — directors" has been completed. Thank you.', ago(14300)),
  ]

  const comments = [
    cmt('cm1', 't1', 'u-priya', 'ITC reconciliation done — reviewing one 2B mismatch above ₹50k.', ago(120)),
    cmt('cm2', 't1', 'u-admin', 'Good. Flag it in the working before we file.', ago(95)),
    cmt('cm3', 't3', 'u-priya', 'Drafted the reply; need the purchase register from the client.', ago(150)),
    cmt('cm4', 't11', 'u-rohan', 'Started ledger scrutiny — cash vouching pending.', ago(300)),
  ]

  const messages: ChatMessage[] = [
    { id: 'msg1', workspace_id: WS_ID, channel: 'general', author_id: 'u-admin', body: 'Morning team — GST filing week. Let’s keep client updates flowing on WhatsApp.', created_at: ago(600) },
    { id: 'msg2', workspace_id: WS_ID, channel: 'general', author_id: 'u-priya', body: 'On it. Nirvana’s GSTR-3B is in review, one 2B mismatch to clear.', created_at: ago(540) },
    { id: 'msg3', workspace_id: WS_ID, channel: 'general', author_id: 'u-rohan', body: 'Advance tax computations for Patel & Co. by EOD.', created_at: ago(130) },
    { id: 'msg4', workspace_id: WS_ID, channel: dmKey('u-admin', 'u-priya'), author_id: 'u-admin', body: 'Can you prioritise the ASMT-10 reply for Nirvana?', created_at: ago(95) },
    { id: 'msg5', workspace_id: WS_ID, channel: dmKey('u-admin', 'u-priya'), author_id: 'u-priya', body: 'Yes — drafting now. Need the purchase register from the client.', created_at: ago(85) },
  ]

  return {
    workspaces: [workspace],
    users: SEED_USERS,
    clients: SEED_CLIENTS,
    tasks,
    comments,
    messages,
    notifications,
  }
}

function t(
  id: string,
  title: string,
  description: string,
  status: Task['status'],
  priority: Task['priority'],
  category: Task['category'],
  deadline: string | null,
  assigned_to: string,
  created_at: string,
  client_id: string | null,
): Task {
  return {
    id,
    workspace_id: WS_ID,
    title,
    description,
    status,
    priority,
    category,
    deadline,
    assigned_to,
    created_by: 'u-admin',
    client_id,
    created_at,
    updated_at: created_at,
  }
}

function notif(
  id: string,
  task_id: string,
  task_title: string,
  to_name: string,
  to_phone: string,
  body: string,
  when: string,
): WaNotification {
  return {
    id,
    workspace_id: WS_ID,
    task_id,
    task_title,
    to_name,
    to_phone,
    body,
    status: 'sent',
    created_at: when,
    sent_at: when,
  }
}

function cmt(id: string, task_id: string, author_id: string, body: string, created_at: string) {
  return { id, workspace_id: WS_ID, task_id, author_id, body, created_at }
}
