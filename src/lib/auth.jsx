import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

const AuthContext = createContext(null)

/**
 * Normalise Discord's identity payload into one shape, so no component has to
 * know how Discord names things.
 *
 * Key names verified against a real sign-in rather than assumed — Discord sends
 * no `preferred_username` at all. What it actually gives us:
 *   full_name                 → the handle          ("_onlycat")
 *   name                      → legacy handle#discr ("_onlycat#0")
 *   custom_claims.global_name → the display name    ("Cat .")
 * `#0` is Discord's marker for "no discriminator" on post-2023 accounts, so it
 * gets stripped; older accounts keep a real one (`someone#1234`).
 */
function toProfile(user) {
  if (!user) return null
  const m = user.user_metadata ?? {}
  const claims = m.custom_claims ?? {}

  const legacyName = typeof m.name === 'string' ? m.name.replace(/#0$/, '') : null
  const handle = m.preferred_username || m.user_name || m.full_name || legacyName

  return {
    id: user.id,
    email: user.email ?? null,
    // Prefer the display name Discord itself shows; fall back to the handle for
    // accounts that never set one.
    name: claims.global_name || handle || 'Clipper',
    username: handle || null,
    avatarUrl: m.avatar_url || m.picture || null,
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  // With no project configured there is nothing to load — start settled so the
  // UI never sits on a spinner that would never resolve.
  const [loading, setLoading] = useState(isSupabaseConfigured)
  // The `profiles` row: credits, exports_count, plan. Null when signed out.
  const [account, setAccount] = useState(null)

  useEffect(() => {
    if (!supabase) return

    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return
        setSession(data.session)
        setLoading(false)
      })
      .catch(() => active && setLoading(false))

    // Fires on sign-in, sign-out, token refresh, and once the ?code= exchange on
    // /auth/callback completes — this is what actually ends the callback wait.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id ?? null

  // Load the account row whenever the signed-in user changes. The signup trigger
  // creates the profile inside the same transaction as the auth user, so by the
  // time a session exists the row does too.
  const refreshAccount = useCallback(async () => {
    if (!supabase || !userId) {
      setAccount(null)
      return null
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('credits, exports_count, plan, discord_bonus_claimed')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      setAccount(null)
      return null
    }
    const next = {
      credits: data.credits,
      exportsCount: data.exports_count,
      plan: data.plan,
      discordBonusClaimed: data.discord_bonus_claimed,
    }
    setAccount(next)
    return next
  }, [userId])

  useEffect(() => {
    refreshAccount()
  }, [refreshAccount])

  /**
   * Spend one credit for an export. The balance comes back from the database
   * rather than being decremented locally — the server is the only thing that
   * knows the real number, and trusting a local guess is how counts drift.
   * Throws on an empty balance so callers can react.
   */
  const spendCredit = useCallback(async () => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.rpc('consume_credit')
    if (error) throw error
    setAccount((a) => (a ? { ...a, credits: data, exportsCount: a.exportsCount + 1 } : a))
    return data
  }, [])

  /** Claim the one-time Discord +5. The once-only rule is enforced server-side. */
  const claimDiscordBonus = useCallback(async () => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.rpc('claim_discord_bonus')
    if (error) throw error
    setAccount((a) => (a ? { ...a, credits: data, discordBonusClaimed: true } : a))
    return data
  }, [])

  const signInWithDiscord = useCallback(async (next = '/dashboard') => {
    if (!supabase) throw new Error('Supabase is not configured')
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      // identify = username + avatar, email = account email. Nothing more; we
      // don't need guild or messages access to run a clip editor.
      options: { redirectTo, scopes: 'identify email' },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setSession(null)
    setAccount(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile: toProfile(session?.user),
      account,
      loading,
      isConfigured: isSupabaseConfigured,
      signInWithDiscord,
      signOut,
      refreshAccount,
      spendCredit,
      claimDiscordBonus,
    }),
    [
      session,
      account,
      loading,
      signInWithDiscord,
      signOut,
      refreshAccount,
      spendCredit,
      claimDiscordBonus,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
