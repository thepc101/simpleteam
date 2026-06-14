# Going live with Supabase (real auth + realtime)

SimpleTeam runs in two modes automatically:

- **No env vars** → local-storage demo (single browser, cross-tab only).
- **`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` set** → Supabase: real
  accounts, multi-user, and **realtime** (chat, tasks, clients, dashboard and the WhatsApp
  queue all update live for everyone in the workspace via Supabase Realtime + RLS).

You don't change any code to switch — just add the two keys.

## 1. Create a project
1. Go to <https://supabase.com> → **New project**. Pick a region close to your firm.
2. Wait for it to provision (~2 min).

## 2. Run the schema
1. Open **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and **Run**.
   This creates the tables, row-level-security policies, the signup trigger (auto-creates a
   profile + workspace), and adds every table to the realtime publication.

## 3. Auth settings
- **Authentication → Providers → Email**: for instant access during setup, turn **off
  “Confirm email.”** (Leave it on for production — users then confirm via an email link before
  the first sign-in.)
- **Authentication → URL Configuration**: set the **Site URL** (your Vercel URL, or
  `http://localhost:3000` locally) and add it under **Redirect URLs**. This makes the
  **password-reset** links work — they return the user to `/reset` to set a new password.

## 4. Get your keys
- **Project Settings → API** → copy the **Project URL** and the **anon public** key.

## 5. Wire it up
**Local:**
```bash
cp .env.local.example .env.local
# paste the two values, then:
npm run dev
```
**Vercel:** Project → **Settings → Environment Variables** → add both keys → **Redeploy**.

## 6. First run
- **Sign up** (name, email, password) → then **Create a team** (you become the **owner/admin**).
- Share the workspace **invite code** (Settings) with your team; they sign up and choose
  **Join a team**.
- New members start with no special role — **the owner promotes them** (admin/leader) in **Team**.

## Notes
- The sample “Acme & Associates” data only exists in the local demo; your Supabase workspace
  starts empty — you add real clients and tasks.
- **Account deletion** removes the profile/workspace rows immediately. Fully deleting the
  underlying auth user requires a small Edge Function using the service-role key (optional;
  the auth row is otherwise harmless and can also be removed from the Supabase dashboard).
- RLS scopes every query to the signed-in user's workspace, so workspaces are fully isolated.
