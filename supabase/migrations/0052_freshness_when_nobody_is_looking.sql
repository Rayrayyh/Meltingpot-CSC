-- Freshness when nobody is looking.
--
-- Sync on open keeps a class current while people use it. Overnight, or over
-- a weekend, nobody opens anything, and a due date the teacher moved on Friday
-- should still be right at Monday's first glance. So once an hour Postgres
-- asks the site to sync whatever has gone an hour without one.
--
-- The hour is a job in pg_cron that makes one HTTP request through pg_net to
-- /api/classwork/sync-due, carrying a bearer the route checks. The route holds
-- no person's session. It calls lms_sync_claim_due with the server key, which
-- hands back up to five links with their tokens, and then runs the same pass
-- as sync on open through two keyed wrappers granted to anon. That is the
-- whole authority of the machine path: the bearer, the server key, five links
-- an hour, read-only scopes. lms_sync_begin's own guards stay exactly as they
-- are (decision 038); this is the separate door it asked for.
--
-- The bearer lives in Vault as classwork_sync_trigger, created by the owner in
-- the SQL editor and never in a migration; the job reads it at fire time. pg_net
-- keeps its answers in net._http_response for six hours, which is the log.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Up to five links an hour overdue, opened as passes. A link that cannot open
-- right now (a race with an open, a consent lapsed since the select) simply
-- waits for the next hour rather than failing the batch.
create or replace function public.lms_sync_claim_due(p_server_key text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  l record;
  v_out jsonb := '[]'::jsonb;
  v_pass jsonb;
begin
  perform public.classwork_require_server_key(p_server_key);
  perform public.consume_rate_limit('lms_sync_due', 'machine:cron', 12, interval '1 hour');
  for l in
    select k.id
    from public.lms_course_links k
    join public.lms_connections c on c.id = k.connection_id
    left join public.pots p on p.id = k.pot_id
    where c.needs_reconnect_at is null
      and c.refresh_secret_id is not null
      and k.sync_status <> 'reconnect'
      and (k.sync_status <> 'running' or k.sync_started_at < now() - interval '2 minutes')
      and (k.sync_finished_at is null or k.sync_finished_at < now() - interval '1 hour')
      and (k.pot_id is null or p.archived_at is null)
    order by k.sync_finished_at asc nulls first, k.created_at asc
    limit 5
    for update of k skip locked
  loop
    begin
      v_pass := public.classwork_open_pass(l.id, false);
      v_out := v_out || jsonb_build_array(v_pass || jsonb_build_object('linkId', l.id));
    exception when others then
      null;
    end;
  end loop;
  return v_out;
end;
$$;

create or replace function public.lms_cron_apply(
  p_link_id uuid,
  p_items jsonb,
  p_cursor jsonb,
  p_done boolean,
  p_server_key text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.classwork_require_server_key(p_server_key);
  return public.classwork_apply_page(p_link_id, p_items, p_cursor, p_done);
end;
$$;

create or replace function public.lms_cron_finish(
  p_link_id uuid,
  p_status text,
  p_error text,
  p_server_key text
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.classwork_require_server_key(p_server_key);
  perform public.classwork_finish_pass(p_link_id, p_status, p_error);
end;
$$;

-- The machine path is anon plus the key, and only that. Signed-in people keep
-- the lms_sync_* doors from 0050, which ask who they are.
revoke execute on function public.lms_sync_claim_due(text) from public, authenticated;
revoke execute on function public.lms_cron_apply(uuid, jsonb, jsonb, boolean, text) from public, authenticated;
revoke execute on function public.lms_cron_finish(uuid, text, text, text) from public, authenticated;
grant execute on function public.lms_sync_claim_due(text) to anon;
grant execute on function public.lms_cron_apply(uuid, jsonb, jsonb, boolean, text) to anon;
grant execute on function public.lms_cron_finish(uuid, text, text, text) to anon;

-- Seventeen minutes past each hour, so it never lands on the hour with
-- everything else. cron.schedule by name is an upsert, so re-running this is
-- safe. Without the Vault secret the header is null and the route answers 401,
-- which net._http_response then shows.
select cron.schedule(
  'classwork-sync-due',
  '17 * * * *',
  $$
  select net.http_post(
    url := 'https://meltingpot-csc.netlify.app/api/classwork/sync-due',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || (
        select s.decrypted_secret from vault.decrypted_secrets s where s.name = 'classwork_sync_trigger'
      )
    ),
    timeout_milliseconds := 25000
  );
  $$
);
