<!--
  DRAFT — NOT LEGAL ADVICE. Review with a qualified UK solicitor before publishing.
  Replace every [BRACKETED] placeholder. See legal/README.md for the checklist.
  The specific cookie/storage names in the tables below are illustrative — confirm
  the actual names against your deployed app (Supabase auth, PostHog, Stripe) and
  keep this table in sync, as PECR/UK GDPR expect an accurate inventory.
-->

# KickSnap Cookie Policy

**Last updated: 12 July 2026**

This Cookie Policy explains how **KickSnap** ("KickSnap", "we", "us", "our") uses cookies and similar technologies (such as browser **local storage** and **session storage**) on the KickSnap website and application at **kicksnap.com** (the "Service").

It should be read alongside our [Privacy Policy](./privacy-policy.md), which explains how we handle personal data more generally, and our [Terms of Service](./terms-of-service.md).

By using the Service you agree to our use of **strictly necessary** technologies. For **analytics and any non-essential** technologies, we ask for your consent where the law requires it (for example, under the UK Privacy and Electronic Communications Regulations ("PECR") and UK/EU GDPR), and you can change your choice at any time (see Section 6).

---

## 1. A quick note on how KickSnap works

KickSnap edits your clips **entirely inside your own browser** using the WebCodecs API. Your videos are never uploaded to us. As a result, most of the "storage" the app uses is **local to your device** — it stays in your browser to make the app work and to remember your preferences, rather than being sent to our servers. We explain what that involves below.

---

## 2. What are cookies and similar technologies?

- **Cookies** are small text files a website stores in your browser. They can be *first-party* (set by us) or *third-party* (set by another service, such as Stripe or Discord).
- **Local storage** and **session storage** are browser mechanisms that let a web app store small amounts of data on your device — for example, your sign-in session or a preference flag. KickSnap relies on these more than on traditional cookies.
- **Session** items are deleted when you close the tab or browser; **persistent** items remain until they expire or are cleared.

We refer to all of these collectively as "cookies" in this Policy for simplicity.

---

## 3. Categories of cookies we use

### 3.1 Strictly necessary (always on)
These are required for the Service to function and cannot be switched off in our systems. They do not require consent. They include keeping you signed in, securing the app, and remembering essential state.

| Name (illustrative) | Type / storage | Set by | Purpose | Duration |
|---|---|---|---|---|
| `sb-*-auth-token` | Local storage | KickSnap / Supabase | Keeps you signed in after Discord login; authenticates requests | Until sign-out / expiry |
| `ks_discord_reward_claimed` | Local storage | KickSnap | Remembers that you have already claimed the Discord bonus credits | Persistent until cleared |
| `ks_preferences` | Local storage | KickSnap | Remembers editor/UI preferences on your device | Persistent until cleared |
| `__stripe_mid` / `__stripe_sid` | Cookie | Stripe | Fraud prevention and secure checkout during payment | Up to 1 year / 30 min |
| Discord OAuth session | Cookie | Discord | Authenticates you during the Discord sign-in flow | Session / per Discord |

### 3.2 Analytics / performance (consent-based)
These help us understand how the Service is used so we can improve it. We use **PostHog**. Where required, we only set these **after you consent**, and you can withdraw consent at any time. This analytics **never includes the content of your clips.**

| Name (illustrative) | Type / storage | Set by | Purpose | Duration |
|---|---|---|---|---|
| `ph_*_posthog` | Local storage / cookie | PostHog | Measures feature usage, page views, and events to improve the Service | Up to 1 year |

### 3.3 Advertising / targeting
**We do not currently use advertising or cross-site tracking cookies.** If this changes, we will update this Policy and request consent where required before setting them.

---

## 4. Third-party cookies

Some cookies are set by third parties that provide parts of the Service. We do not control these cookies, and their use is governed by each provider's own policy:

- **Stripe** (payments / fraud prevention) — [stripe.com/cookies-policy/legal](https://stripe.com/cookies-policy/legal)
- **Discord** (sign-in / OAuth) — [discord.com/privacy](https://discord.com/privacy)
- **PostHog** (analytics) — [posthog.com/privacy](https://posthog.com/privacy)
- **Vercel** (hosting / delivery) — [vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy)

---

## 5. Why we use them

- **Keep you signed in** and secure your session (necessary).
- **Enable checkout** and prevent payment fraud via Stripe (necessary).
- **Remember your choices**, such as UI preferences and whether you have claimed the Discord reward (necessary).
- **Understand and improve** how people use the editor via PostHog analytics (consent-based).

---

## 6. Your choices and how to manage cookies

- **Consent controls.** Where we ask for consent (e.g. analytics), you can accept or decline when prompted, and change your decision at any time via **your browser settings**.
- **Browser controls.** You can block or delete cookies and clear local/session storage in your browser settings. Guides: [Chrome](https://support.google.com/chrome/answer/95647), [Edge](https://support.microsoft.com/microsoft-edge), [Firefox](https://support.mozilla.org/kb/cookies), [Safari](https://support.apple.com/safari).
- **Effect of blocking.** If you block **strictly necessary** items (such as the sign-in session or Stripe's checkout cookies), core features like signing in, saving your credit balance, and paying **may not work.** Blocking analytics has no effect on functionality.
- **Do Not Track / Global Privacy Control.** Where technically feasible, we aim to honour recognised opt-out signals sent by your browser.

Clearing your browser storage will also remove local flags such as your saved preferences and the Discord-reward marker, and will sign you out.

---

## 7. Changes to this Policy

We may update this Cookie Policy as our Service or the technologies we use change. When we make material changes, we will update the "Last updated" date and, where appropriate, ask for renewed consent. Please check back periodically.

---

## 8. Contact us

If you have questions about our use of cookies:

**KickSnap**
Registered address available on request by email.
Email: **privacy@kicksnap.com**

You can also contact the UK Information Commissioner's Office (ICO) at [ico.org.uk](https://ico.org.uk) if you have concerns about how we use cookies or personal data.
