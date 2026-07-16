-- handle_new_user only ever runs from the on_auth_user_created trigger, which
-- executes as the table owner and does not need an EXECUTE grant. Leaving it
-- granted also published it at /rest/v1/rpc/handle_new_user for anon to call.
revoke all on function public.handle_new_user() from public, anon, authenticated;
