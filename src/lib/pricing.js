/**
 * The Stripe catalogue, as the UI sees it.
 *
 * Price IDs are not secret — they're names. The dangerous half is the
 * price → credits mapping, which lives in the stripe-webhook function and is
 * duplicated there deliberately: if the browser could say how many credits a
 * purchase is worth, it would just say "one million". Edge functions can't
 * import from src/, so the two lists have to be kept in step by hand.
 *
 * Tax note: Starter, Pro Pack, and both monthly prices were created with
 * tax_behavior `exclusive`; the two yearly prices are `inclusive`. Nothing
 * charges tax today because the checkout session leaves `automatic_tax` off, so
 * all six bill their face value. But tax_behavior is immutable once a price
 * exists, so if Stripe Tax is ever switched on the monthlies would add 20% on
 * top ($150 -> $180) while the yearlies wouldn't. Replace the four exclusive
 * prices before registering for VAT, not after.
 */

export const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter',
    priceId: 'price_1TuCHkGY8sI4AeivEZFpRTSJ',
    price: 5,
    credits: 30,
  },
  {
    id: 'pro_pack',
    name: 'Pro Pack',
    priceId: 'price_1TuCI2GY8sI4Aeiv9e7Yf7Ic',
    price: 10,
    credits: 100,
  },
]

export const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    monthly: { priceId: 'price_1TuCIbGY8sI4AeivAPLyIkVq', price: 15 },
    // Yearly is the monthly rate x10, not x12 — that's where "2 months free"
    // comes from. $150/yr reads as $12.50/mo on the billing toggle.
    yearly: { priceId: 'price_1TuCIwGY8sI4Aeiv5Rr07xs5', price: 150 },
  },
  {
    id: 'agency',
    name: 'Agency',
    monthly: { priceId: 'price_1TuCJDGY8sI4AeivEfG6J7cF', price: 150 },
    yearly: { priceId: 'price_1TuCJaGY8sI4AeivJMnHkSlf', price: 1500 },
  },
]

/** Every price the checkout function will accept. Anything else is rejected. */
export const ALL_PRICE_IDS = [
  ...CREDIT_PACKS.map((p) => p.priceId),
  ...PLANS.flatMap((p) => [p.monthly.priceId, p.yearly.priceId]),
]
