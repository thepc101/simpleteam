import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Trim to defend against copy-paste whitespace / quotes / trailing slashes.
const clean = (v: string | undefined) => (v ?? '').trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '')

const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
const anon = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Only treat as configured when the URL is a real https Supabase endpoint — a
// malformed value falls back to local mode instead of breaking login.
export const isSupabaseConfigured = /^https:\/\/.+\.supabase\.co$/.test(url) && anon.length > 20

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
