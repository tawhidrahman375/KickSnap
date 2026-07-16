-- The Discord +5 reward used to be tracked in localStorage, which meant it was
-- both re-claimable (clear storage, claim again) and invisible to the server.
-- Move the flag next to the credits it grants so the once-only rule is real.
alter table public.profiles
  add column discord_bonus_claimed boolean not null default false;

-- Atomic and idempotent: the `not claimed` guard is inside the UPDATE, so
-- double-clicking Claim can't grant 10. Raises if there was nothing to claim.
create or replace function public.claim_discord_bonus()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining integer;
begin
  update public.profiles
     set credits               = credits + 5,
         discord_bonus_claimed = true,
         updated_at            = now()
   where id = (select auth.uid())
     and discord_bonus_claimed = false
  returning credits into remaining;

  if remaining is null then
    raise exception 'bonus_already_claimed';
  end if;

  return remaining;
end;
$$;

revoke all on function public.claim_discord_bonus() from public, anon;
grant execute on function public.claim_discord_bonus() to authenticated;
