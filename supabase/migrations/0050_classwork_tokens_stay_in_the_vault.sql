-- Classwork tokens stay in the Vault, and only the app server can ask for them.
--
-- Every definer function this schema grants to authenticated is callable from a
-- browser console with the person's own JWT, over PostgREST. That is fine for
-- functions that assert nothing a browser could not already assert about
-- itself. It is not fine for a function that returns a refresh token, or one
-- that writes a page of imported items into a Pot every member can read: a
-- member could call it directly and forge classwork, or read their own token
-- and reuse it elsewhere.
--
-- So there is a server key. Thirty two random bytes live in Netlify as
-- CLASSWORK_SERVER_KEY and in Vault as the secret named classwork_server_key,
-- created once by the owner in the SQL editor and never in a migration file.
-- Every function below that touches a token or writes imported rows takes the
-- key and refuses without it. The defence is the key's 256 bits of entropy,
-- not a counter: a wrong key raises, and a raise rolls back whatever the same
-- call counted, so a probe limit here would record nothing while charging
-- honest calls (the review of this file's first draft caught it doing exactly
-- that). The compare hashes both sides so the first differing byte does not
-- set the timing.
--
-- The key is not the whole boundary. Every keyed function also asks who is
-- calling and what they are to the link, so a route that took a link id from
-- a browser still could not be turned on somebody else's course. The hourly
-- job of phase 4 carries no person's JWT; it gets its own door with its own
-- limits, and these guards stay as they are. The pass logic therefore lives in
-- internal functions (classwork_open_pass, classwork_apply_page,
-- classwork_finish_pass) that the door can reuse without re-emitting a body
-- (memory/lessons/011).
--
-- Refresh tokens only. Access tokens live in route memory for one run.

create or replace function public.classwork_server_key_ok(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_key is not null and char_length(p_key) >= 32 and exists (
    select 1 from vault.decrypted_secrets s
    where s.name = 'classwork_server_key'
      and extensions.digest(s.decrypted_secret, 'sha256') = extensions.digest(p_key, 'sha256')
  );
$$;
revoke execute on function public.classwork_server_key_ok(text) from public, anon, authenticated;

create or replace function public.classwork_require_server_key(p_key text)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.classwork_server_key_ok(p_key) then
    raise exception 'not_authorised';
  end if;
end;
$$;
revoke execute on function public.classwork_require_server_key(text) from public, anon, authenticated;

/* The caller's standing to a link: their own, or a Pot they belong to.
   is_pot_member carries the second factor check. */
create or replace function public.classwork_link_visible(p_link_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.lms_course_links l
    where l.id = p_link_id
      and (l.user_id = p_uid or (l.pot_id is not null and public.is_pot_member(l.pot_id)))
  );
$$;
revoke execute on function public.classwork_link_visible(uuid, uuid) from public, anon, authenticated;

-- Connect, or reconnect. The refresh token goes to Vault under a name derived
-- from the connection id; a reconnect replaces it in place and clears the
-- reconnect flag on every link that was waiting on it, cursor included: a
-- pass interrupted by a lapsed consent holds page tokens that died with it.
create or replace function public.lms_connect(
  p_provider public.lms_provider,
  p_instance_url text,
  p_external_user_id text,
  p_external_display text,
  p_refresh_token text,
  p_scopes text[],
  p_courses jsonb,
  p_server_key text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_secret uuid;
begin
  if v_uid is null or not public.has_required_aal() then raise exception 'not_authenticated'; end if;
  perform public.classwork_require_server_key(p_server_key);
  perform public.consume_rate_limit('lms_connect', 'user:' || v_uid::text, 10, interval '1 hour');
  if p_refresh_token is null or char_length(p_refresh_token) = 0 then raise exception 'token_required'; end if;
  if p_external_user_id is null or char_length(p_external_user_id) = 0 then raise exception 'identity_required'; end if;
  if p_courses is null or jsonb_typeof(p_courses) <> 'array' then raise exception 'courses_invalid'; end if;

  select id, refresh_secret_id into v_id, v_secret
  from public.lms_connections
  where user_id = v_uid and provider = p_provider
  for update;

  if v_id is null then
    v_id := gen_random_uuid();
    v_secret := vault.create_secret(p_refresh_token, 'lms:' || v_id::text, 'Classwork refresh token');
    insert into public.lms_connections
      (id, user_id, provider, instance_url, external_user_id, external_display,
       scopes, refresh_secret_id, courses, courses_fetched_at)
    values
      (v_id, v_uid, p_provider, p_instance_url, p_external_user_id, p_external_display,
       coalesce(p_scopes, '{}'), v_secret, p_courses, now());
  else
    if v_secret is null then
      v_secret := vault.create_secret(p_refresh_token, 'lms:' || v_id::text, 'Classwork refresh token');
    else
      perform vault.update_secret(v_secret, p_refresh_token);
    end if;
    update public.lms_connections
    set instance_url = p_instance_url,
        external_user_id = p_external_user_id,
        external_display = p_external_display,
        scopes = coalesce(p_scopes, '{}'),
        refresh_secret_id = v_secret,
        consent_at = now(),
        needs_reconnect_at = null,
        last_error = null,
        courses = p_courses,
        courses_fetched_at = now()
    where id = v_id;
    update public.lms_course_links
    set sync_status = 'never', sync_error = null, sync_cursor = '{}'::jsonb
    where connection_id = v_id and sync_status = 'reconnect';
  end if;
  return v_id;
end;
$$;

-- Disconnect returns the refresh token once, so the route can ask the provider
-- to revoke it, then removes everything in one transaction: the secret, the
-- connection, and by cascade every link and item. Drafts started from an item
-- keep their text and their attached links; only the provenance pointer nulls.
-- (0049's delete trigger would remove the secret too; doing it here as well
-- keeps this function honest on its own.)
create or replace function public.lms_disconnect(p_connection_id uuid, p_server_key text)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_secret uuid;
  v_token text;
begin
  if v_uid is null or not public.has_required_aal() then raise exception 'not_authenticated'; end if;
  perform public.classwork_require_server_key(p_server_key);
  perform public.consume_rate_limit('lms_disconnect', 'user:' || v_uid::text, 10, interval '1 hour');

  select refresh_secret_id into v_secret
  from public.lms_connections
  where id = p_connection_id and user_id = v_uid
  for update;
  if not found then raise exception 'connection_not_found'; end if;

  if v_secret is not null then
    select s.decrypted_secret into v_token from vault.decrypted_secrets s where s.id = v_secret;
    delete from vault.secrets where id = v_secret;
  end if;
  delete from public.lms_connections where id = p_connection_id;
  return v_token;
end;
$$;

create or replace function public.lms_set_courses(p_connection_id uuid, p_courses jsonb, p_server_key text)
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
  perform public.consume_rate_limit('lms_set_courses', 'user:' || v_uid::text, 30, interval '1 hour');
  if p_courses is null or jsonb_typeof(p_courses) <> 'array' then raise exception 'courses_invalid'; end if;
  update public.lms_connections
  set courses = p_courses, courses_fetched_at = now()
  where id = p_connection_id and user_id = v_uid;
  if not found then raise exception 'connection_not_found'; end if;
end;
$$;

-- Linking needs no server key: it asserts nothing a browser could not already
-- assert about itself. A Pot link asks for the maintainer role on that Pot.
-- The course name and URL are stored as the maintainer gives them, within the
-- authority they already hold over sections and corrections.
create or replace function public.link_lms_course(
  p_connection_id uuid,
  p_external_course_id text,
  p_course_name text,
  p_course_url text,
  p_enrollment text,
  p_pot_id uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_provider public.lms_provider;
  v_id uuid;
begin
  if v_uid is null or not public.has_required_aal() then raise exception 'not_authenticated'; end if;
  perform public.consume_rate_limit('link_lms_course', 'user:' || v_uid::text, 30, interval '1 hour');
  if p_external_course_id is null or char_length(p_external_course_id) not between 1 and 200 then
    raise exception 'course_invalid';
  end if;
  if nullif(trim(coalesce(p_course_name, '')), '') is null then raise exception 'course_invalid'; end if;

  select provider into v_provider
  from public.lms_connections
  where id = p_connection_id and user_id = v_uid;
  if v_provider is null then raise exception 'connection_not_found'; end if;

  if p_pot_id is not null then
    if not public.is_pot_maintainer(p_pot_id) then raise exception 'not_pot_maintainer'; end if;
    if exists (select 1 from public.pots where id = p_pot_id and archived_at is not null) then
      raise exception 'pot_archived';
    end if;
  end if;

  insert into public.lms_course_links
    (connection_id, user_id, provider, pot_id, external_course_id, course_name, course_url, enrollment)
  values
    (p_connection_id, v_uid, v_provider, p_pot_id, p_external_course_id,
     left(trim(p_course_name), 300),
     case when p_course_url ~ '^https://' then p_course_url end,
     case when p_enrollment in ('teacher', 'student') then p_enrollment else 'unknown' end)
  on conflict (connection_id, external_course_id, pot_id) do update
    set course_name = excluded.course_name, course_url = excluded.course_url
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.unlink_lms_course(p_link_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_owner uuid;
  v_pot uuid;
begin
  if v_uid is null or not public.has_required_aal() then raise exception 'not_authenticated'; end if;
  perform public.consume_rate_limit('unlink_lms_course', 'user:' || v_uid::text, 30, interval '1 hour');
  select user_id, pot_id into v_owner, v_pot from public.lms_course_links where id = p_link_id;
  if v_owner is null then raise exception 'link_not_found'; end if;
  if v_owner <> v_uid and not (v_pot is not null and public.is_pot_maintainer(v_pot)) then
    raise exception 'not_authorised';
  end if;
  delete from public.lms_course_links where id = p_link_id;
end;
$$;

-- A sync pass, in three steps, because a pass can outlive one function
-- invocation. open claims the link and hands back the token; apply lands one
-- page and either stores the cursor or closes the pass; finish records an
-- outcome the pass could not record itself. The three internal functions
-- below hold the logic and are callable by nobody; the lms_sync_* functions
-- after them add the caller's standing and the rate limits, and are what the
-- app calls.

create or replace function public.classwork_open_pass(p_link_id uuid, p_force boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  l public.lms_course_links%rowtype;
  c public.lms_connections%rowtype;
  v_token text;
  v_cursor jsonb;
begin
  p_force := coalesce(p_force, false);
  select * into l from public.lms_course_links where id = p_link_id for update;
  if l.id is null then raise exception 'link_not_found'; end if;

  select * into c from public.lms_connections where id = l.connection_id;
  if c.needs_reconnect_at is not null or c.refresh_secret_id is null then
    raise exception 'reconnect_required';
  end if;
  if l.sync_status = 'running' and l.sync_started_at > now() - interval '2 minutes' then
    raise exception 'sync_in_progress';
  end if;
  if not p_force and l.sync_cursor = '{}'::jsonb and l.sync_status in ('ok', 'error')
     and l.sync_finished_at > now() - interval '15 minutes' then
    raise exception 'sync_too_soon';
  end if;
  perform public.consume_rate_limit('lms_sync_link', 'link:' || l.id::text, 8, interval '1 hour');

  select s.decrypted_secret into v_token from vault.decrypted_secrets s where s.id = c.refresh_secret_id;
  if v_token is null then raise exception 'reconnect_required'; end if;

  -- A pass resumes only while it is fresh. Forced, never opened, or an hour
  -- old (provider page tokens do not live that long): start again. Removal
  -- stays right, since everything the fresh pass sees is stamped after its
  -- own passStartedAt.
  v_cursor := case
    when p_force
      or l.sync_cursor = '{}'::jsonb
      or coalesce((l.sync_cursor ->> 'passStartedAt')::timestamptz, '-infinity'::timestamptz)
         < now() - interval '1 hour'
    then jsonb_build_object('passStartedAt', to_jsonb(now()))
    else l.sync_cursor end;

  update public.lms_course_links
  set sync_status = 'running', sync_started_at = now(), sync_error = null, sync_cursor = v_cursor
  where id = l.id;

  return jsonb_build_object(
    'connectionId', c.id,
    'provider', c.provider,
    'instanceUrl', c.instance_url,
    'externalCourseId', l.external_course_id,
    'refreshToken', v_token,
    'cursor', v_cursor
  );
end;
$$;
revoke execute on function public.classwork_open_pass(uuid, boolean) from public, anon, authenticated;

create or replace function public.classwork_apply_page(
  p_link_id uuid,
  p_items jsonb,
  p_cursor jsonb,
  p_done boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  l public.lms_course_links%rowtype;
  v_item jsonb;
  v_kind public.lms_item_kind;
  v_external text;
  v_hash text;
  v_existing_id uuid;
  v_existing_hash text;
  v_pass timestamptz;
  v_inserted integer := 0;
  v_changed integer := 0;
  v_removed integer := 0;
begin
  if p_done is null then raise exception 'done_invalid'; end if;
  select * into l from public.lms_course_links where id = p_link_id for update;
  if l.id is null then raise exception 'link_not_found'; end if;
  if l.sync_status <> 'running' then raise exception 'sync_not_running'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'items_invalid'; end if;
  if jsonb_array_length(p_items) > 200 then raise exception 'items_invalid'; end if;
  v_pass := (l.sync_cursor ->> 'passStartedAt')::timestamptz;
  if v_pass is null then raise exception 'sync_not_running'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_external := v_item ->> 'externalId';
    v_hash := v_item ->> 'contentHash';
    if v_external is null or char_length(v_external) > 200
       or v_hash is null or v_hash !~ '^[0-9a-f]{64}$'
       or coalesce(v_item ->> 'title', '') = ''
       or (v_item ->> 'kind') is null then
      raise exception 'item_invalid';
    end if;
    begin
      v_kind := (v_item ->> 'kind')::public.lms_item_kind;
    exception when others then
      raise exception 'item_invalid';
    end;

    select id, content_hash into v_existing_id, v_existing_hash
    from public.lms_items where link_id = l.id and external_id = v_external;

    if v_existing_id is null then
      insert into public.lms_items
        (link_id, pot_id, user_id, provider, external_id, kind, title, description,
         due_at, due_all_day, available_from, posted_at, url, materials,
         external_updated_at, content_hash)
      values
        (l.id, l.pot_id, l.user_id, l.provider, v_external, v_kind,
         left(v_item ->> 'title', 500),
         left(coalesce(v_item ->> 'description', ''), 20000),
         (v_item ->> 'dueAt')::timestamptz,
         coalesce((v_item ->> 'dueAllDay')::boolean, false),
         (v_item ->> 'availableFrom')::timestamptz,
         (v_item ->> 'postedAt')::timestamptz,
         v_item ->> 'url',
         coalesce(v_item -> 'materials', '[]'::jsonb),
         (v_item ->> 'externalUpdatedAt')::timestamptz,
         v_hash);
      v_inserted := v_inserted + 1;
    elsif v_existing_hash <> v_hash then
      update public.lms_items
      set kind = v_kind,
          title = left(v_item ->> 'title', 500),
          description = left(coalesce(v_item ->> 'description', ''), 20000),
          due_at = (v_item ->> 'dueAt')::timestamptz,
          due_all_day = coalesce((v_item ->> 'dueAllDay')::boolean, false),
          available_from = (v_item ->> 'availableFrom')::timestamptz,
          posted_at = (v_item ->> 'postedAt')::timestamptz,
          url = v_item ->> 'url',
          materials = coalesce(v_item -> 'materials', '[]'::jsonb),
          external_updated_at = (v_item ->> 'externalUpdatedAt')::timestamptz,
          content_hash = v_hash,
          changed_at = now(),
          last_seen_at = now(),
          removed_at = null
      where id = v_existing_id;
      v_changed := v_changed + 1;
    else
      update public.lms_items
      set last_seen_at = now(), removed_at = null
      where id = v_existing_id;
    end if;
  end loop;

  if p_done then
    update public.lms_items
    set removed_at = now()
    where link_id = l.id and removed_at is null and last_seen_at < v_pass;
    get diagnostics v_removed = row_count;
    update public.lms_course_links
    set sync_status = 'ok',
        sync_finished_at = now(),
        sync_cursor = '{}'::jsonb,
        sync_error = null,
        item_count = (select count(*) from public.lms_items where link_id = l.id and removed_at is null)
    where id = l.id;
  else
    if p_cursor is null or jsonb_typeof(p_cursor) <> 'object' then raise exception 'cursor_invalid'; end if;
    update public.lms_course_links
    set sync_cursor = p_cursor || jsonb_build_object('passStartedAt', to_jsonb(v_pass)),
        sync_started_at = now()
    where id = l.id;
  end if;

  return jsonb_build_object('inserted', v_inserted, 'changed', v_changed, 'removed', v_removed);
end;
$$;
revoke execute on function public.classwork_apply_page(uuid, jsonb, jsonb, boolean) from public, anon, authenticated;

create or replace function public.classwork_finish_pass(p_link_id uuid, p_status text, p_error text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_connection uuid;
begin
  if p_status not in ('ok', 'error', 'reconnect') then raise exception 'status_invalid'; end if;
  update public.lms_course_links
  set sync_status = p_status,
      sync_finished_at = now(),
      sync_error = left(p_error, 400),
      sync_cursor = case when p_status = 'ok' then '{}'::jsonb else sync_cursor end
  where id = p_link_id
  returning connection_id into v_connection;
  if v_connection is null then raise exception 'link_not_found'; end if;
  if p_status = 'reconnect' then
    update public.lms_connections
    set needs_reconnect_at = now(), last_error = left(p_error, 400)
    where id = v_connection;
  end if;
end;
$$;
revoke execute on function public.classwork_finish_pass(uuid, text, text) from public, anon, authenticated;

-- The doors the app uses. Each asks the same three questions before touching
-- the pass: is there a person, do they hold the key, and is this link theirs
-- to see. begin also asks, for a Pot link, that the Pot is still open and
-- the caller still a member, now rather than when the link was made
-- (memory/lessons/007), and that only the linker or a maintainer forces.
create or replace function public.lms_sync_begin(p_link_id uuid, p_force boolean, p_server_key text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  l public.lms_course_links%rowtype;
begin
  p_force := coalesce(p_force, false);
  if v_uid is null or not public.has_required_aal() then raise exception 'not_authenticated'; end if;
  perform public.classwork_require_server_key(p_server_key);
  perform public.consume_rate_limit('lms_sync_user', 'user:' || v_uid::text, 60, interval '1 hour');

  select * into l from public.lms_course_links where id = p_link_id for update;
  if l.id is null then raise exception 'link_not_found'; end if;
  if l.pot_id is null then
    if l.user_id <> v_uid then raise exception 'not_authorised'; end if;
  else
    if not public.is_pot_member(l.pot_id) then raise exception 'not_authorised'; end if;
    if exists (select 1 from public.pots where id = l.pot_id and archived_at is not null) then
      raise exception 'pot_archived';
    end if;
    if p_force and l.user_id <> v_uid and not public.is_pot_maintainer(l.pot_id) then
      raise exception 'not_authorised';
    end if;
  end if;

  return public.classwork_open_pass(l.id, p_force);
end;
$$;

create or replace function public.lms_sync_apply(
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
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or not public.has_required_aal() then raise exception 'not_authenticated'; end if;
  perform public.classwork_require_server_key(p_server_key);
  if not public.classwork_link_visible(p_link_id, v_uid) then raise exception 'not_authorised'; end if;
  return public.classwork_apply_page(p_link_id, p_items, p_cursor, p_done);
end;
$$;

create or replace function public.lms_sync_finish(
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
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or not public.has_required_aal() then raise exception 'not_authenticated'; end if;
  perform public.classwork_require_server_key(p_server_key);
  if not public.classwork_link_visible(p_link_id, v_uid) then raise exception 'not_authorised'; end if;
  perform public.classwork_finish_pass(p_link_id, p_status, p_error);
end;
$$;

revoke execute on function public.lms_connect(public.lms_provider, text, text, text, text, text[], jsonb, text) from public, anon;
revoke execute on function public.lms_disconnect(uuid, text) from public, anon;
revoke execute on function public.lms_set_courses(uuid, jsonb, text) from public, anon;
revoke execute on function public.link_lms_course(uuid, text, text, text, text, uuid) from public, anon;
revoke execute on function public.unlink_lms_course(uuid) from public, anon;
revoke execute on function public.lms_sync_begin(uuid, boolean, text) from public, anon;
revoke execute on function public.lms_sync_apply(uuid, jsonb, jsonb, boolean, text) from public, anon;
revoke execute on function public.lms_sync_finish(uuid, text, text, text) from public, anon;

grant execute on function public.lms_connect(public.lms_provider, text, text, text, text, text[], jsonb, text) to authenticated;
grant execute on function public.lms_disconnect(uuid, text) to authenticated;
grant execute on function public.lms_set_courses(uuid, jsonb, text) to authenticated;
grant execute on function public.link_lms_course(uuid, text, text, text, text, uuid) to authenticated;
grant execute on function public.unlink_lms_course(uuid) to authenticated;
grant execute on function public.lms_sync_begin(uuid, boolean, text) to authenticated;
grant execute on function public.lms_sync_apply(uuid, jsonb, jsonb, boolean, text) to authenticated;
grant execute on function public.lms_sync_finish(uuid, text, text, text) to authenticated;
