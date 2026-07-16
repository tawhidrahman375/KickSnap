# Database schema

These migrations are the source of truth for KickSnap's Postgres schema
(project `ozhgxejnnqrjrsvkecji`, eu-west-1). Both files here are **already
applied** to the live project — the filenames match the versions Supabase has
recorded, so the CLI knows to skip them rather than run them twice.

## The one rule

**Never edit a migration that has already been applied.** Supabase tracks
migrations by the version prefix in the filename. Editing an applied file
changes what's in git without changing the database, so the two silently drift
and a fresh clone rebuilds something that never existed. To change the schema,
always add a *new* migration.

## Making a schema change

Easiest path is to ask Claude — the Supabase MCP applies migrations directly and
records the version, then the file gets written here to match.

By hand with the CLI:

```bash
supabase link --project-ref ozhgxejnnqrjrsvkecji
supabase migration new whatever_you_are_changing   # creates a timestamped file
# write your SQL into it, then:
supabase db push
```

After **any** DDL, check the security linter — it catches missing RLS and
over-exposed functions:

```bash
supabase inspect db lint
```

or ask Claude to run `get_advisors`.

## What's here

| Migration | What it does |
| --- | --- |
| `20260716194418_create_profiles_and_credits` | `profiles` table, RLS, signup trigger, `consume_credit()` |
| `20260716194621_restrict_handle_new_user_execute` | Revokes public EXECUTE on the trigger function |

## Why credits aren't writable by the client

`profiles` has a SELECT policy and **no INSERT/UPDATE/DELETE policy**. That's
deliberate. The publishable key ships inside the browser bundle — it's meant to
— so anything RLS permits, a clipper with DevTools can do. An UPDATE policy on
`profiles` would let anyone set their own `credits` to 9999 and export forever
free.

So credits only move through `consume_credit()`, which is `security definer`
(runs as the owner, bypassing RLS) and enforces its own rules: one credit at a
time, never below zero, `exports_count` incremented in the same statement.

**If a write ever fails and the "obvious fix" looks like adding an UPDATE policy
to `profiles` — it isn't.** That reopens the hole. Add a function instead.

Two linter warnings are expected and should be left alone:

- `consume_credit` executable by `authenticated` — that's the design; signed-in
  users are supposed to call it.
- Leaked-password protection disabled — KickSnap has no passwords (Discord OAuth
  only). It's flagged because the Email provider is still enabled in the
  dashboard; disabling it there would silence this.
