# Supabase Discord auth — setup

The code is written and works the moment these two values exist. Everything below
happens in dashboards, so it has to be done by hand.

Until `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, the app runs in
**guest mode**: the landing page, editor and dashboard all work exactly as they
did before, and `/signin` explains that sign-in isn't configured. Nothing breaks.

## 1. Create the Supabase project

1. <https://supabase.com/dashboard> → **New project**.
2. Region: **West EU (London)** — closest to you and to most of the Discord.
3. Save the database password in a password manager. You won't need it for auth,
   but you can't see it again.

## 2. Create the Discord OAuth app

1. <https://discord.com/developers/applications> → **New Application** → name it
   `KickSnap`.
2. **OAuth2**, under the **Settings** heading in the left sidebar. If you see no
   sidebar at all, click the **☰** next to "DEVELOPER PORTAL" — it collapses on
   narrow windows, which is the usual reason Redirects can't be found.
3. On that page → **Redirects** → **Add Redirect** → paste the callback URL
   exactly:

   ```
   https://ozhgxejnnqrjrsvkecji.supabase.co/auth/v1/callback
   ```

   A mismatched redirect is the #1 cause of `invalid_grant`.
4. **Save Changes** (Discord silently discards redirects if you skip this).
5. Copy the **Client ID** and **Client Secret** from **Client information** on
   the same page (Reset Secret if the secret is hidden). The **Public Key** on
   the General Information page is *not* the secret — that one's for bot
   interactions.

The KickSnap app is already created: Client ID `1527392642604728400`.

## 3. Connect Discord to Supabase

1. Supabase dashboard → **Authentication** → **Sign In / Providers** → **Discord**.
2. Toggle **Enable**, paste the Client ID and Client Secret from step 2, **Save**.
3. **Authentication** → **URL Configuration**:
   - **Site URL**: `https://kicksnap.net`
   - **Redirect URLs** — add all three, one per line:
     ```
     http://localhost:5173/**
     https://kicksnap.net/**
     https://*.vercel.app/**
     ```
     The localhost entry is what lets you test sign-in in dev; the wildcard one
     covers Vercel preview deploys.

## 4. Wire up the env vars

Supabase dashboard → **Connect** (top bar). You need exactly two values:

| Field in Supabase | Goes into |
| --- | --- |
| Project URL | `VITE_SUPABASE_URL` |
| Publishable key (`sb_publishable_…`) | `VITE_SUPABASE_ANON_KEY` |

The publishable key is what older projects called the `anon` / `public` key —
the env var keeps the old name because that's what supabase-js calls the
parameter.

**Never** copy the secret key (`sb_secret_…`, formerly `service_role`) into this
project. Anything prefixed `VITE_` is compiled into the JavaScript bundle and
readable by every visitor — the publishable key is designed for exactly that, the
secret key bypasses every security rule you have.

Locally:

```bash
cp .env.example .env.local   # then paste the two values in
npm run dev
```

`.env.local` is gitignored. Restart the dev server after editing it — Vite only
reads env files at startup.

On Vercel: **Project → Settings → Environment Variables**, add both for
Production, Preview and Development, then redeploy (env vars are baked in at
build time, so an existing deploy won't pick them up).

## 5. Check it works

1. `npm run dev`, open <http://localhost:5173/dashboard>.
2. You should be bounced to `/signin?next=/dashboard`.
3. **Continue with Discord** → Discord's consent screen → back to
   `/auth/callback` → lands on `/dashboard`.
4. Your Discord avatar and username should be in the sidebar's bottom-left.
5. **Settings → Sign out** should return you to the landing page, and
   `/dashboard` should bounce you again.

## How it fits together

| File | Role |
| --- | --- |
| `src/lib/supabase.js` | Browser client; exports `isSupabaseConfigured` |
| `src/lib/auth.jsx` | `<AuthProvider>` + `useAuth()` — session, profile, sign in/out |
| `src/components/RequireAuth.jsx` | Route gate; opens automatically in guest mode |
| `src/pages/SignIn.jsx` | `/signin` — the Discord button |
| `src/pages/AuthCallback.jsx` | `/auth/callback` — waits for the code exchange |

`useAuth()` gives you `{ session, user, profile, loading, isConfigured,
signInWithDiscord, signOut }`. `profile` is normalised
(`{ id, email, name, username, avatarUrl }`) because Discord's `user_metadata`
key names vary between legacy and current accounts.

## Not done yet

Credits still read from `localStorage` (`kicksnap_credits`, `kicksnap_exports`)
in `src/pages/Dashboard.jsx`. Moving them into Postgres — a `profiles` table,
RLS policies, a signup trigger granting the 10 free credits, and deducting on
export — is the next slice, and it's what makes credits survive a device change.
