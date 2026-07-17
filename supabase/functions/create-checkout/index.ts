// Creates a Stripe Checkout session for the signed-in user.
//
// This has to be server-side: the Stripe secret key can never reach the browser,
// and the client must not get to decide what it pays or what it receives.
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

// The only prices we will ever charge. The client sends a price id; if it isn't
// on this list the request dies here. Without it, anyone could POST the id of a
// $0 price (or one from another Stripe account) and take the goods for nothing.
const ALLOWED_PRICES = new Set([
  'price_1TuCHkGY8sI4AeivEZFpRTSJ', // Starter    $5   one-off
  'price_1TuCI2GY8sI4Aeiv9e7Yf7Ic', // Pro Pack   $10  one-off
  'price_1TuCIbGY8sI4AeivAPLyIkVq', // Pro        $15/mo
  'price_1TuCIwGY8sI4Aeiv5Rr07xs5', // Pro        $150/yr
  'price_1TuCJDGY8sI4AeivEfG6J7cF', // Agency     $150/mo
  'price_1TuCJaGY8sI4AeivJMnHkSlf', // Agency     $1500/yr
])

const SUBSCRIPTION_PRICES = new Set([
  'price_1TuCIbGY8sI4AeivAPLyIkVq',
  'price_1TuCIwGY8sI4Aeiv5Rr07xs5',
  'price_1TuCJDGY8sI4AeivEfG6J7cF',
  'price_1TuCJaGY8sI4AeivJMnHkSlf',
])

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://kicksnap.net'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Identify the caller from their JWT rather than trusting a user id in the
    // body — otherwise anyone could buy credits onto someone else's account, or
    // more to the point, claim someone else's purchase.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'not signed in' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return json({ error: 'not signed in' }, 401)

    const { priceId } = await req.json()
    if (!priceId || !ALLOWED_PRICES.has(priceId)) {
      return json({ error: 'unknown price' }, 400)
    }

    // Reuse this account's Stripe customer if we've seen them before, so their
    // cards and invoices stay in one place.
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    let customerId = profile?.stripe_customer_id ?? undefined
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        // The link back to KickSnap. If a webhook ever arrives without our
        // client_reference_id, this is how we still know who paid.
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
    }

    const isSubscription = SUBSCRIPTION_PRICES.has(priceId)

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // Both of these carry the user id through to the webhook. Subscriptions
      // don't reliably surface client_reference_id on later invoices, so the
      // customer metadata above is the durable one.
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      ...(isSubscription
        ? { subscription_data: { metadata: { supabase_user_id: user.id } } }
        : {}),
      // Deliberately NOT enabling automatic_tax. KickSnap isn't VAT registered,
      // and charging tax we have no registration to remit would be worse than
      // annoying. This is the setting that decides what the customer actually
      // pays — the dashboard's tax preview has no say.
      success_url: `${SITE_URL}/dashboard?checkout=success`,
      cancel_url: `${SITE_URL}/dashboard?checkout=cancelled`,
    })

    return json({ url: session.url })
  } catch (err) {
    console.error('[create-checkout]', err)
    // Don't leak Stripe's internals to the browser.
    return json({ error: 'could not start checkout' }, 500)
  }
})
