-- A course list worth refreshing.
--
-- A person's courses are cached on their connection so settings opens without
-- a provider call. Refreshing that list needs an access token, and the only
-- functions that hand the server a refresh token are per link (a pass) or
-- terminal (disconnect), so a person who had connected but linked nothing yet
-- had no way to refresh at all. The first function returns the token for the
-- caller's own connection behind the same three questions as every keyed
-- function in 0050: a person, the key, and their own row. The route uses it
-- to refresh the course list and for nothing else; syncing still goes through
-- a pass.
--
-- The second lets that route say when the refresh was refused, the way a
-- failed pass does through classwork_finish_pass, so Home and settings show
-- the reconnect notice at once rather than after the next sync trips it.

create or replace function public.lms_connection_token(p_connection_id uuid, p_server_key text)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  c public.lms_connections%rowtype;
  v_token text;
begin
  if v_uid is null or not public.has_required_aal() then raise exception 'not_authenticated'; end if;
  perform public.classwork_require_server_key(p_server_key);
  perform public.consume_rate_limit('lms_connection_token', 'user:' || v_uid::text, 20, interval '1 hour');
  select * into c from public.lms_connections where id = p_connection_id and user_id = v_uid;
  if c.id is null then raise exception 'connection_not_found'; end if;
  if c.needs_reconnect_at is not null or c.refresh_secret_id is null then
    raise exception 'reconnect_required';
  end if;
  select s.decrypted_secret into v_token from vault.decrypted_secrets s where s.id = c.refresh_secret_id;
  if v_token is null then raise exception 'reconnect_required'; end if;
  return v_token;
end;
$$;

create or replace function public.lms_connection_needs_reconnect(
  p_connection_id uuid,
  p_error text,
  p_server_key text
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or not public.has_required_aal() then raise exception 'not_authenticated'; end if;
  perform public.classwork_require_server_key(p_server_key);
  update public.lms_connections
  set needs_reconnect_at = now(), last_error = left(p_error, 400)
  where id = p_connection_id and user_id = v_uid;
  if not found then raise exception 'connection_not_found'; end if;
  update public.lms_course_links
  set sync_status = 'reconnect'
  where connection_id = p_connection_id and sync_status <> 'running';
end;
$$;

revoke execute on function public.lms_connection_token(uuid, text) from public, anon;
revoke execute on function public.lms_connection_needs_reconnect(uuid, text, text) from public, anon;
grant execute on function public.lms_connection_token(uuid, text) to authenticated;
grant execute on function public.lms_connection_needs_reconnect(uuid, text, text) to authenticated;
