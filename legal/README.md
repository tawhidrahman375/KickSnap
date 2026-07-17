# KickSnap Legal Documents — Draft Pack

Three drafts for KickSnap, a credit-based, client-side video editing SaaS:

- [`privacy-policy.md`](./privacy-policy.md)
- [`terms-of-service.md`](./terms-of-service.md)
- [`cookie-policy.md`](./cookie-policy.md)

> ⚠️ **Not legal advice.** These are starting drafts written to match KickSnap's
> actual stack and the facts provided. **Have a qualified UK solicitor review them
> before you publish or take payments.** Several clauses (digital-content refunds,
> the minor-founder issue, liability caps) have real legal consequences if wrong.

---

## 1. Facts these drafts are built on

- **Product:** browser-based clip editor; credit-based; **no refunds on used credits**.
- **Processing:** **100% client-side (WebCodecs)** — we never upload, receive, or store clips.
- **Auth:** Discord OAuth. **Payments:** Stripe. **Analytics:** PostHog.
- **Not affiliated with Kick.com** (explicit disclaimer in ToS §2).
- **Based in the UK; users are global** (UK GDPR + CCPA/CPRA + general global rights covered).
- Assumed sub-processors: **Supabase** (auth/DB), **Vercel** (hosting). Change if different.

---

## 2. Placeholders to replace (search for `[` across all three files)

| Placeholder | What to put | Notes |
|---|---|---|
| `[LEGAL ENTITY / TRADING NAME]` | Your registered company or sole-trader trading name | See §4 below re: the minor-founder issue |
| `[Business address]` | A real contact address | **Legally required** for UK consumer contracts |
| `[privacy@kicksnap.net]` | Your privacy contact email | |
| `[support@kicksnap.net]` | Your support/billing email | |
| `kicksnap.net` | Final production domain | Update if different |
| `[Vercel]`, `[Supabase]` | Actual hosting / DB / auth providers | Must match reality for GDPR sub-processor list |
| `[Stripe, Inc. / Stripe Payments Europe]` | The correct Stripe entity for your account | |
| `[16]` / `[18]` | Final minimum ages | **Flagged for review — see §4** |
| `[12]` months / `[£50]` liability cap | Confirm the figures you want | ToS §14 |
| Cookie names (`[sb-*-auth-token]`, `[ph_*_posthog]`, etc.) | Real names from your deployed app | Inspect your app's storage and sync the tables |
| `[our cookie settings / "Cookie preferences" link]` | Your actual consent mechanism | See §5 below |

---

## 3. ⭐ Flagged for professional review

### Refunds / digital-content consent (ToS §8–§9)
"No refunds on used credits" **only holds up in the UK/EU** if you capture the customer's
express consent to immediate supply of digital content **at checkout** and acknowledge they
lose the cancellation right for credits they use. The drafts say this — but your **Stripe
checkout UI must actually present and record that consent** (a ticked/again-confirmed
statement). Without it, the 14-day cooling-off right can override "no refunds."

### Minor founder → who is the contracting party? (ToS §3, §12; Privacy §12)
If the founder/operator is under 18, a minor generally **cannot form a binding contract**
or be the sole named **data controller / legal entity**. Options to discuss with a
solicitor/parent: an adult (parent/guardian) or a limited company as the contracting entity.
Resolve this before choosing what goes in `[LEGAL ENTITY / TRADING NAME]`.

### International transfers (Privacy §5)
US-based processors (Stripe, PostHog, Vercel, Discord) mean personal data leaves the UK.
Confirm the transfer mechanism you rely on (UK IDTA/Addendum or EU SCCs) and that each
provider's DPA is in place.

### Consumer law specifics
Liability caps (§14) and disclaimers (§13) must not exclude non-excludable UK consumer
rights (Consumer Rights Act 2015). The drafts carve these out — have it confirmed.

---

## 4. Before you publish — checklist

- [ ] Solicitor review completed (esp. §3 items above)
- [ ] Legal entity / contracting party resolved (minor-founder issue)
- [ ] All `[BRACKETED]` placeholders replaced
- [ ] Real business address added
- [ ] Contact emails live and monitored
- [ ] Minimum ages confirmed and consistent across all three docs
- [ ] Cookie/storage tables match the deployed app's actual names
- [ ] Cookie consent banner / preferences control implemented (PECR requirement for analytics)
- [ ] Stripe checkout captures digital-content immediate-supply consent
- [ ] Sub-processor list (Supabase, Vercel, Stripe, PostHog, Discord) accurate
- [ ] "Last updated" dates set to publication date
- [ ] Links to all three docs added to the site footer

---

## 5. Publishing notes

- These are Markdown drafts. Render them into your app's routes (e.g. `/privacy`,
  `/terms`, `/cookies`) or paste into your CMS. They intentionally cross-link each other.
- Keep the three in sync — a change to ages, entity name, or providers affects all three.
- Analytics (PostHog) should stay **off until consent** in regions where PECR/GDPR apply;
  wire the cookie-preferences link referenced in the Cookie Policy to that toggle.
