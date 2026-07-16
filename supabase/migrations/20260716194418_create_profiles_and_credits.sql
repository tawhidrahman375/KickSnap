-- Per-user account state. Credits live here rather than localStorage so they
-- survive a cache clear and follow the user across devices.
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  credits       integer not null default 10 check (credits >= 0),
  exports_count integer not null default 0 check (exports_count >= 0),
  plan          text    not null default 'free' check (plan in ('free', 'pro', 'agency')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Read-only to the owner. Deliberately NO insert/update/delete policy: with an
-- UPDATE policy, any clipper could open DevTools and set credits = 9999, since
-- the publishable key is public by design. All writes go through the
-- security-definer functions below, which bypass RLS under controlled rules.
create policy "own profile is readable"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- Grant the free-tier credits at signup. Fires inside the auth transaction, so
-- a profile always exists by the time the client first reads one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The only way credits go down. Atomic: the `credits > 0` guard lives in the
-- UPDATE itself, so two exports firing at once can't both pass a check and
-- overdraw. Returns the new balance, or raises if there was nothing to spend.
create or replace function public.consume_credit()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining integer;
begin
  update public.profiles
     set credits       = credits - 1,
         exports_count = exports_count + 1,
         updated_at    = now()
   where id = (select auth.uid())
     and credits > 0
  returning credits into remaining;

  if remaining is null then
    raise exception 'insufficient_credits';
  end if;

  return remaining;
end;
$$;

revoke all on function public.consume_credit() from public, anon;
grant execute on function public.consume_credit() to authenticated;
