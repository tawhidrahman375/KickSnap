import posthog from 'posthog-js'

/**
 * Founder-side product analytics. Never rendered anywhere in the app — this is
 * purely for understanding usage from the PostHog dashboard, same audience as
 * a server log, not a feature.
 *
 * Same guest-degradation shape as supabase.js: no token means analytics
 * silently no-op instead of throwing, so a missing env var never breaks the
 * app for a real visitor.
 */
const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
const host = import.meta.env.VITE_POSTHOG_HOST

export const isAnalyticsConfigured = Boolean(token)

if (isAnalyticsConfigured) {
  posthog.init(token, {
    api_host: host,
    defaults: '2026-05-30',
  })
}

/** Tag events to the real KickSnap user instead of an anonymous device id. */
export function identifyUser(user) {
  if (!isAnalyticsConfigured || !user) return
  posthog.identify(user.id, { email: user.email })
}

/** Drop the identity link on sign-out so the next session starts anonymous. */
export function resetIdentity() {
  if (!isAnalyticsConfigured) return
  posthog.reset()
}

/** No-op when unconfigured, so callers never need to check isAnalyticsConfigured. */
export function track(event, properties) {
  if (!isAnalyticsConfigured) return
  posthog.capture(event, properties)
}
