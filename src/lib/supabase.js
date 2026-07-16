import { createClient } from '@supabase/supabase-js'

/**
 * Supabase browser client.
 *
 * Both values are public by design — the anon key is safe to ship in the bundle
 * because row-level security, not secrecy, is what protects the data. The
 * service-role key must never appear in this file or anywhere under src/.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * The app has to run with no Supabase project attached: local checkouts before
 * `.env.local` exists, and any preview deploy missing the env vars. Everything
 * auth-related degrades to signed-out guest mode instead of throwing, so the
 * landing page and editor keep working.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // The OAuth redirect lands back on /auth/callback carrying ?code=; this
        // lets the client exchange it for a session without us hand-rolling it.
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null
