// Grants credits once Stripe confirms a payment.
//
// This endpoint is public — anyone on the internet can POST to it. The signature
// check is the only thing standing between a stranger and free credits, so it
// runs before anything else and there is no path around it.
//
// Deploy with --no-verify-jwt: Stripe is not a signed-in user and cannot present
// a Supabase JWT. Its signature is the authentication.
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

// price -> what it's worth. Lives here, server-side, on purpose: the browser
// telling us how many credits it bought would be an invitation.
//
// Agency grants 0 credits and relies on plan = 'agency', which consume_credit
// treats as unlimited. Granting it a big number instead would stack 9999 more on
// every renewal and still, absurdly, be finite.
const CREDITS_FOR_PRICE: Record<string, { credits: number; plan: string | null }> = {
  price_1TuCHkGY8sI4AeivEZFpRTSJ: { credits: 30, plan: null },    // Starter  $5
  price_1TuCI2GY8sI4Aeiv9e7Yf7Ic: { credits: 100, plan: null },   // Pro Pack $10
  price_1TuCIbGY8sI4AeivAPLyIkVq: { credits: 150, plan: 'pro' },  // Pro      $15/mo
  price_1TuCIwGY8sI4Aeiv5Rr07xs5: { credits: 150, plan: 'pro' },  // Pro      $150/yr
  price_1TuCJDGY8sI4AeivEfG6J7cF: { credits: 0, plan: 'agency' }, // Agency   $150/mo  — unlimited via plan
  price_1TuCJaGY8sI4AeivJMnHkSlf: { credits: 0, plan: 'agency' }, // Agency   $1500/yr — unlimited via plan
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

// Service role: the webhook has no user session, and grant_credits is granted to
// service_role only. This key must never be exposed to a browser.
const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

/** Find the KickSnap user behind a Stripe object, in order of reliability. */
async function resolveUserId(
  refId: string | null,
  metaId: string | undefined,
  customerId: string | null,
): Promise<string | null> {
  if (metaId) return metaId
  if (refId) return refId
  if (!customerId) return null
  // Subscription renewals arrive months later with neither field set, so fall
  // back to the customer we stored at first checkout.
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.id ?? null
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    // constructEventAsync (not constructEvent) — Deno has no synchronous crypto.
    // Must run against the RAW body; parsing the JSON first breaks the digest.
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    )
  } catch (err) {
    console.error('[stripe-webhook] bad signature', err)
    return new Response('bad signature', { status: 400 })
  }

  try {
    switch (event.type) {
      // One-time credit packs.
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        // Subscriptions are credited by invoice.paid instead, so that renewals
        // grant credits too — not just the first month.
        if (s.mode !== 'payment') break
        if (s.payment_status !== 'paid') break

        const userId = await resolveUserId(
          s.client_reference_id,
          s.metadata?.supabase_user_id,
          typeof s.customer === 'string' ? s.customer : null,
        )
        if (!userId) {
          console.error('[stripe-webhook] no user for session', s.id)
          break
        }

        // Read the price back from Stripe rather than trusting anything the
        // client sent — this is the number that decides credits.
        const items = await stripe.checkout.sessions.listLineItems(s.id, { limit: 1 })
        const priceId = items.data[0]?.price?.id
        const grant = priceId ? CREDITS_FOR_PRICE[priceId] : undefined
        if (!grant) {
          console.error('[stripe-webhook] unmapped price', priceId)
          break
        }

        if (typeof s.customer === 'string') {
          await admin.from('profiles').update({ stripe_customer_id: s.customer }).eq('id', userId)
        }
        await admin.rpc('grant_credits', {
          p_user_id: userId,
          p_credits: grant.credits,
          p_plan: grant.plan,
          p_event_id: event.id,
        })
        break
      }

      // Subscriptions: first payment AND every renewal.
      case 'invoice.paid': {
        const inv = event.data.object as Stripe.Invoice
        const priceId = inv.lines.data[0]?.price?.id
        const grant = priceId ? CREDITS_FOR_PRICE[priceId] : undefined
        if (!grant) break

        const userId = await resolveUserId(
          null,
          inv.subscription_details?.metadata?.supabase_user_id,
          typeof inv.customer === 'string' ? inv.customer : null,
        )
        if (!userId) {
          console.error('[stripe-webhook] no user for invoice', inv.id)
          break
        }

        await admin.rpc('grant_credits', {
          p_user_id: userId,
          p_credits: grant.credits,
          p_plan: grant.plan,
          p_event_id: event.id,
        })
        break
      }

      // Cancelled or lapsed: drop back to free. Credits already bought are kept
      // — they were paid for, and clawing them back would be theft.
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = await resolveUserId(
          null,
          sub.metadata?.supabase_user_id,
          typeof sub.customer === 'string' ? sub.customer : null,
        )
        if (userId) await admin.from('profiles').update({ plan: 'free' }).eq('id', userId)
        break
      }
    }
  } catch (err) {
    // 500 makes Stripe retry, and grant_credits is idempotent on event.id, so a
    // retry can't double-grant.
    console.error('[stripe-webhook] handler failed', event.type, err)
    return new Response('handler error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
