# KickSnap

**The clip editor built for Kick clippers.**

KickSnap is a browser-based video editor for people who cut highlight clips from [Kick](https://kick.com) livestreams and repost them to TikTok, YouTube Shorts, and Instagram Reels — usually to get paid through Kick's official clipping program. Instead of manually reformatting footage in a general-purpose editor and risking a rejected submission over a misplaced watermark, KickSnap turns a raw clip into a submission-ready export in under a minute.

Live at **[kicksnap.net](https://kicksnap.net)**.

## The problem

Editing in CapCut or similar tools for the Kick clipping program means: manually cropping to the right aspect ratio, eyeballing where the official streamer overlay goes, and re-exporting for three different platforms. Get the overlay placement wrong and the clip gets rejected — no payout, wasted work.

## What it does

- **One-click reformatting** into the three formats Kick's clipping program accepts: 9:16 full-screen, 9:16 split, and 1:1 square.
- **Correct overlay placement, automatically.** Pick a streamer from a curated list of ~70+ real Kick creators and the right overlay is applied in the right spot — with a "dead zone" warning if you drag something into a position that risks rejection.
- **Blur or zoom background fill** for footage that doesn't natively fit the target aspect ratio.
- **TikTok-style animated captions**, emoji support included.
- **A real cut/trim timeline** — multi-segment editing with undo/redo.
- **Everything happens in your browser.** Clips are decoded, composited, and re-encoded locally via WebCodecs — nothing is uploaded to a server. No FFmpeg, no upload wait, no one else ever sees your footage.

A live demo on the landing page lets you try the editor before signing up.

## Who it's for

Kick streamers' clippers — the people who watch a stream, cut the best moments, and submit them to the platform's creator-command clipping program for a share of views-based payout. KickSnap isn't affiliated with Kick.com; it's a tool built to help clippers meet the program's submission rules faster and more reliably.

## Pricing

Credit-metered, one credit per export:

| Plan | Price | Credits |
|---|---|---|
| Free | $0 | 10/month |
| Pro | $15/mo (or $150/yr) | 150/month + rollover, full analytics |
| Agency | $150/mo (or $1500/yr) | Unlimited, batch processing, auto-post |

One-time top-ups are also available (from $5 for 30 credits). New users get +5 bonus credits for joining the [KickSnap Discord](https://discord.gg/bKZJgWZWu8).

## How it's built

- **Frontend:** React 19 + Vite, Tailwind CSS v4, shadcn/ui, React Router
- **Video engine:** [mediabunny](https://github.com/Vanilagy/mediabunny) — WebCodecs-based decode/composite/encode, entirely client-side
- **Backend:** Supabase (Postgres, Auth, Edge Functions) — credits and plan state are held server-side behind `security definer` RPCs, never trusted from the client
- **Auth:** Discord OAuth (fits where the Kick clipping community already lives)
- **Payments:** Stripe, via Supabase Edge Functions — checkout session creation and webhook handling both run server-side, with an idempotency ledger for webhook retries
- **Analytics:** PostHog
- **Hosting:** Vercel (static SPA build)

Sign-in is optional — the editor itself works in a "guest mode" with no account, no upload, and no credits gate for trying it out.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in Supabase/PostHog keys to enable auth, credits, and analytics — without them the app runs fully in guest mode.

```bash
npm run build    # production build
npm run lint     # oxlint
```

## Project structure

```
src/
├── pages/         Landing, Editor, Dashboard, SignIn, legal pages
├── editor/         the actual editor: timeline, compositor, export pipeline,
│                    streamer/overlay catalog, caption tooling
├── components/     landing page sections + shared UI (shadcn-based)
└── lib/            Supabase client, auth, analytics, pricing, site config

supabase/
├── functions/      create-checkout, stripe-webhook (Deno edge functions)
└── migrations/     profiles/credits schema, Stripe billing, Discord bonus

legal/              terms of service, privacy policy, cookie policy
docs/               Discord OAuth + Supabase setup notes
```

## Disclaimer

KickSnap is an independent tool and is not affiliated with, endorsed by, or sponsored by Kick.com or Kick Streaming Pty Ltd.
