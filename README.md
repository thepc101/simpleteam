# SimpleTeam

**Asana, but simpler** — an all-in-one task & compliance workspace built for a Chartered Accountancy firm.

SimpleTeam gives a CA practice the 20% of features they use 80% of the time: client management, compliance-categorised tasks, a filing calendar, role-based workflows, and one-tap WhatsApp client updates — fast, clean, and easy to run.

## Features

- **Clients** — first-class client directory (entity type, GSTIN/PAN, contacts) with a relationship manager per client.
- **Compliance tasks** — every task is tagged GST / Income Tax / TDS / ROC / Audit / Advisory, linked to a client, with priority, deadline and assignee.
- **Compliance calendar** — month grid of filing deadlines (agenda view on mobile).
- **Dashboard** — clients, open work by compliance area, overdue, due-this-week, team workload.
- **My Tasks / Backlog** — personal Today/Upcoming/Later view and an undated "Pending Works" backlog.
- **List & Kanban** — toggle views with drag-and-drop and rich filters.
- **Roles & security** — owner/admin/leader/member; only admins create & assign work; PBKDF2-hashed passwords; long invite codes; workspace-scoped data.
- **WhatsApp updates** — auto-queue a client message when a filing completes; every message is fully editable; opens WhatsApp (or WhatsApp Business) with the text pre-filled — no API required.
- **Laws reference** — plain-language GST, Income-tax Act 2025 and Companies Act 2013 (small company) summaries.
- **Customisation** — light/dark theme, brand accent-colour picker, collapsible sidebar.
- Account management — change/reset password, delete account, manage the workspace.

## Tech

- Next.js 14 (App Router) · TypeScript · Tailwind CSS · lucide-react · Supabase
- **Two backends, auto-selected.** With `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` set, it runs on **Supabase** (real accounts, multi-user, realtime). Without them it runs **local-first** on this device (`localStorage`, cross-tab live updates). See [`SUPABASE.md`](SUPABASE.md).

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

On first run, **create an account** — you become the owner/admin of a new, empty workspace.
Invite teammates with the workspace's invite code (Settings → they choose "Join with code").
To go cloud + multi-user, follow [`SUPABASE.md`](SUPABASE.md).

---

Made by [thepc101](https://thepc101.github.io).
