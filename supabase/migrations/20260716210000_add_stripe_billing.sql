-- Stripe billing. Everything here is written for the webhook, which runs with
-- the service-role key; none of it is reachable from the browser.

-- One Stripe customer per KickSnap account, so a returning buyer keeps their
-- payment history instead of becoming a new customer on every checkout.
alter table public.profiles
  add column stripe_customer_id text unique;

-- Stripe retries webhooks until it gets a 2xx, and will happily deliver the same
-- event twice. Without a record of what we've already applied, one retry of a
-- $10 pack grants 200 credits.
create table public.processed_stripe_events (
  id           text primary key, -- Stripe's event id (evt_...)
  processed_at timestamptz not null default now()
);

-- RLS on with no policies at all: the service role bypasses RLS, and nobody else
-- has any business reading our webhook ledger.
alter table public.processed_stripe_events enable row level security;

-- Applies a paid purchase. Idempotent on the Stripe event id, so a replayed
-- webhook is a no-op rather than free credits.
create or replace function public.grant_credits(
  p_user_id  uuid,
  p_credits  integer,
  p_plan     text,
  p_event_id text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining integer;
begin
  -- Claim the event. If it's already there, this inserts nothing and FOUND is
  -- false — meaning we've applied this purchase before.
  insert into public.processed_stripe_events (id) values (p_event_id)
  on conflict (id) do nothing;

  if not found then
    select credits into remaining from public.profiles where id = p_user_id;
    return remaining;
  end if;

  update public.profiles
     set credits    = credits + p_credits,
         plan       = coalesce(p_plan, plan),
         updated_at = now()
   where id = p_user_id
  returning credits into remaining;

  if remaining is null then
    raise exception 'no profile for user %', p_user_id;
  end if;

  return remaining;
end;
$$;

-- Only the webhook (service role) may grant credits. Emphatically not the
-- browser: an authenticated caller able to run this could mint its own balance,
-- which is the same hole the profiles RLS design exists to close.
revoke all on function public.grant_credits(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.grant_credits(uuid, integer, text, text) to service_role;

-- Agency is an unlimited plan, so it must not spend credits. Modelling
-- "unlimited" as a big number (9999/month, stacking on every renewal) would be a
-- lie with a countdown attached — it eventually runs out, and the balance shown
-- would be nonsense. Unlimited is a property of the plan, not a quantity.
--
-- Exports are still counted for agency, so the stat stays truthful.
create or replace function public.consume_credit()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining integer;
  user_plan text;
begin
  select plan into user_plan from public.profiles where id = (select auth.uid());

  if user_plan = 'agency' then
    update public.profiles
       set exports_count = exports_count + 1,
           updated_at    = now()
     where id = (select auth.uid())
    returning credits into remaining;

    if remaining is null then
      raise exception 'no profile for user';
    end if;
    return remaining;
  end if;

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
