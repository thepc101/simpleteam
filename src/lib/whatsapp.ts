import type { Client, Task, Workspace } from './types'
import { sanitizePhone } from './crypto'

export const DEFAULT_WA_TEMPLATE =
  'Hello {client}, this is an update from {company}. The task "{task}" has been completed on {date}. Thank you.'

export const WA_PLACEHOLDERS = ['{client}', '{company}', '{task}', '{date}']

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
}

export function buildMessage(task: Task, client: Client | undefined, workspace: Workspace): string {
  return renderTemplate(workspace.wa_template || DEFAULT_WA_TEMPLATE, {
    client: client?.contact_person || client?.name || 'there',
    company: workspace.name,
    task: task.title,
    date: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  })
}

/** Build a wa.me deep link that opens WhatsApp with the message prefilled. */
export function waLink(phone: string, message: string): string {
  return `https://wa.me/${sanitizePhone(phone)}?text=${encodeURIComponent(message)}`
}
