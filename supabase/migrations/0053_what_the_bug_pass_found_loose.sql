-- 0053: what the bug pass of 5 September 2026 found loose in the database.
--
-- Six small things and no schema change. Every body below is the live one
-- (pg_get_functiondef, lesson 011) plus the one change described.
--
-- 1. Signing up counted no failed attempt. register_student raises for a taken
--    email or a weak password, and a raise rolls back the row consume_rate_limit
--    had just written, so probing a thousand addresses cost nothing against the
--    limit. sign_up_student runs the same checks but answers with a jsonb error
--    instead of raising, so every attempt stays counted, and hands the insert to
--    register_student, which a browser can no longer call directly.
-- 2. A member could put back a card a maintainer had taken down: the author
--    check in set_flashcard_removed said nothing about who removed it.
-- 3. remove_member, set_member_role and regenerate_class_code took an aal1
--    session at face value while every other door asks has_required_aal().
-- 4. save_study_set handed a member the id of a set a maintainer had removed,
--    which the route read as a successful save with nothing to open.
-- 5. classwork_open_pass started a pass over after an hour, which is exactly the
--    hourly cron's cadence, so a slow pass never resumed. Ninety minutes.
-- 6. Grants the defaults hand out and nothing uses: truncate, references and
--    trigger on every table; insert, update and delete on admin_events, which
--    only definer triggers write; delete on study_sets and note_flashcards,
--    whose removal goes through functions; and execute on the trigger functions
--    of 0029 and 0045, which fire without it.

-- 1. Signing up, counted -------------------------------------------------------

create or replace function public.sign_up_student(p_email text, p_password text, p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
begin
  -- Counted first, and never undone by an answer below: a refusal is a
  -- return, not a raise, so the row stays written.
  perform public.consume_rate_limit('sign_up_student', 'ip:' || public.client_ip(), 200, interval '1 hour');
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('error', 'invalid_email');
  end if;
  if p_password is null
    or char_length(p_password) < 8
    or p_password !~ '[A-Z]'
    or p_password !~ '[a-z]'
    or p_password !~ '[0-9]'
    or p_password !~ '[^a-zA-Z0-9[:space:]]' then
    return jsonb_build_object('error', 'weak_password');
  end if;
  if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 80 then
    return jsonb_build_object('error', 'invalid_display_name');
  end if;
  if exists (select 1 from auth.users where email = v_email) then
    return jsonb_build_object('error', 'email_taken');
  end if;
  -- The same checks run again inside and cannot fail now. The insert stays in
  -- one place, unchanged since 0042.
  v_id := public.register_student(p_email, p_password, p_display_name);
  return jsonb_build_object('userId', v_id);
end;
$$;

revoke execute on function public.sign_up_student(text, text, text) from public, anon, authenticated;
grant execute on function public.sign_up_student(text, text, text) to anon, authenticated;
-- A browser reaches register_student only through the counted door above.
-- dev_seed, a definer function, still calls it as the owner.
revoke execute on function public.register_student(text, text, text) from public, anon, authenticated;

-- 2. A removed card stays down -----------------------------------------------

create or replace function public.set_flashcard_removed(p_card_id uuid, p_removed boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_pot uuid;
  v_author uuid;
  v_remover uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  p_removed := coalesce(p_removed, false);
  select pot_id, created_by, removed_by into v_pot, v_author, v_remover
  from public.note_flashcards where id = p_card_id;
  if v_pot is null then raise exception 'not_found'; end if;

  -- Authorship used to outlive membership, so someone who had left the Pot
  -- could still remove or restore its cards with a card id.
  if not public.is_pot_member(v_pot) then raise exception 'not_pot_member'; end if;
  if v_author <> v_uid and not public.is_pot_maintainer(v_pot) then
    raise exception 'not_allowed';
  end if;
  -- A card a maintainer took down stays down until a maintainer, or whoever
  -- took it down, puts it back. Having written the card does not outrank that.
  if not p_removed and v_remover is not null and v_remover <> v_uid
     and not public.is_pot_maintainer(v_pot) then
    raise exception 'not_allowed';
  end if;

  update public.note_flashcards
  set removed_at = case when p_removed then now() else null end,
      removed_by = case when p_removed then v_uid else null end
  where id = p_card_id;
end;
$$;

-- 3. The membership doors ask for the second factor too ------------------------

create or replace function public.remove_member(p_pot_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_caller_role pot_role;
  v_target_role pot_role;
begin
  if v_uid is null or not public.has_required_aal() then raise exception 'not_authenticated'; end if;
  select role into v_caller_role from memberships
  where pot_id = p_pot_id and user_id = v_uid;
  select role into v_target_role from memberships
  where pot_id = p_pot_id and user_id = p_user_id;

  if v_caller_role is null or v_caller_role = 'member' then
    raise exception 'not_pot_maintainer';
  end if;
  perform consume_rate_limit('remove_member', 'user:' || v_uid::text, 60, interval '1 hour');
  if v_target_role is null then
    raise exception 'member_not_found';
  end if;
  if v_target_role = 'owner' then
    raise exception 'cannot_remove_owner';
  end if;
  if v_target_role = 'maintainer' and v_caller_role <> 'owner' then
    raise exception 'owner_required';
  end if;

  delete from memberships where pot_id = p_pot_id and user_id = p_user_id;
end;
$$;

create or replace function public.set_member_role(p_pot_id uuid, p_user_id uuid, p_role pot_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_target_role pot_role;
begin
  if v_uid is null or not public.has_required_aal() then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from pots where id = p_pot_id and owner_id = v_uid) then
    raise exception 'not_pot_owner';
  end if;
  perform consume_rate_limit('set_member_role', 'user:' || v_uid::text, 60, interval '1 hour');
  if p_role not in ('member', 'maintainer') then
    raise exception 'invalid_role';
  end if;

  select role into v_target_role from memberships
  where pot_id = p_pot_id and user_id = p_user_id;

  if v_target_role is null then
    raise exception 'member_not_found';
  end if;
  if v_target_role = 'owner' then
    raise exception 'cannot_change_owner_role';
  end if;

  update memberships set role = p_role
  where pot_id = p_pot_id and user_id = p_user_id;
end;
$$;

create or replace function public.regenerate_class_code(p_pot_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_code text;
  v_attempts int := 0;
begin
  if v_uid is null or not public.has_required_aal() then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from pots where id = p_pot_id and owner_id = v_uid) then
    raise exception 'not_pot_owner';
  end if;
  perform consume_rate_limit('regenerate_class_code', 'user:' || v_uid::text, 20, interval '1 hour');

  loop
    v_code := generate_class_code();
    v_attempts := v_attempts + 1;
    begin
      update pots set class_code = v_code where id = p_pot_id;
      exit;
    exception when unique_violation then
      if v_attempts >= 10 then
        raise exception 'code_generation_failed';
      end if;
    end;
  end loop;

  return v_code;
end;
$$;

-- 4. A removed set is refused, not returned ------------------------------------

create or replace function public.save_study_set(p_pot_id uuid, p_kind text, p_fingerprint text, p_payload jsonb, p_model text, p_options jsonb default null, p_keys jsonb default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_existing public.study_sets%rowtype;
  v_maintainer boolean;
  v_generation text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not public.is_pot_member(p_pot_id) then raise exception 'not_pot_member'; end if;
  if p_kind not in ('summary', 'flashcards', 'practice') then
    raise exception 'invalid_kind';
  end if;

  v_maintainer := public.is_pot_maintainer(p_pot_id);

  select study_generation into v_generation from public.pots where id = p_pot_id;
  if v_generation = 'maintainers' and not v_maintainer then
    raise exception 'generation_closed';
  end if;

  perform consume_rate_limit('save_study_set', 'user:' || v_uid::text, 60, interval '1 hour');

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid_payload';
  end if;
  if pg_column_size(p_payload) > 400000 then
    raise exception 'payload_too_large';
  end if;
  if p_kind = 'flashcards' and jsonb_typeof(p_payload -> 'cards') <> 'array' then
    raise exception 'invalid_payload';
  end if;
  if p_kind = 'practice' and jsonb_typeof(p_payload -> 'questions') <> 'array' then
    raise exception 'invalid_payload';
  end if;
  if p_kind = 'summary' and jsonb_typeof(p_payload -> 'overview') <> 'string' then
    raise exception 'invalid_payload';
  end if;
  if p_keys is not null then
    if p_kind <> 'practice' then raise exception 'keys_without_practice'; end if;
    if jsonb_typeof(p_keys) <> 'array' then raise exception 'invalid_keys'; end if;
    if pg_column_size(p_keys) > 200000 then raise exception 'keys_too_large'; end if;
  end if;

  select * into v_existing from public.study_sets
  where pot_id = p_pot_id and kind = p_kind and source_fingerprint = left(p_fingerprint, 128);

  -- A maintainer took this one down. Returning its id read as a save that
  -- worked; the route now hears why nothing was stored and says so.
  if v_existing.id is not null and v_existing.removed_at is not null and not v_maintainer then
    raise exception 'study_set_removed';
  end if;

  -- A set whose answers live on the server never goes back to carrying them
  -- in the payload. Nothing legitimate asks for that: the browser's fallback
  -- save only runs when the server's save failed, and then there is no row.
  if v_existing.id is not null and v_existing.secured and p_keys is null then
    raise exception 'cannot_unsecure_set';
  end if;

  insert into public.study_sets (pot_id, kind, source_fingerprint, payload, model, options, generated_by, secured)
  values (p_pot_id, p_kind, left(p_fingerprint, 128), p_payload, left(p_model, 120), p_options, v_uid, p_keys is not null)
  on conflict (pot_id, kind, source_fingerprint) do update
    set payload = excluded.payload,
        model = excluded.model,
        options = excluded.options,
        generated_by = excluded.generated_by,
        secured = excluded.secured,
        removed_at = null,
        removed_by = null,
        created_at = now()
  returning id into v_id;

  if p_keys is not null then
    insert into public.study_set_keys (set_id, keys)
    values (v_id, p_keys)
    on conflict (set_id) do update set keys = excluded.keys, created_at = now();
  else
    delete from public.study_set_keys where set_id = v_id;
  end if;

  return v_id;
end;
$$;

-- 5. A pass gets ninety minutes to resume --------------------------------------

create or replace function public.classwork_open_pass(p_link_id uuid, p_force boolean)
returns jsonb
language plpgsql
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

  -- A pass resumes only while it is fresh. Forced, never opened, or ninety
  -- minutes old (provider page tokens do not live much longer, and the hourly
  -- cron must find a pass it left half done still resumable): start again.
  -- Removal stays right, since everything the fresh pass sees is stamped
  -- after its own passStartedAt.
  v_cursor := case
    when p_force
      or l.sync_cursor = '{}'::jsonb
      or coalesce((l.sync_cursor ->> 'passStartedAt')::timestamptz, '-infinity'::timestamptz)
         < now() - interval '90 minutes'
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

-- 6. Grants nothing uses -------------------------------------------------------

revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke insert, update, delete on public.admin_events from anon, authenticated;
revoke delete on public.study_sets, public.note_flashcards from anon, authenticated;
revoke execute on function
  public.tg_log_membership(),
  public.tg_log_note_moderation(),
  public.tg_log_proposal_decision(),
  public.tg_log_study_moderation(),
  public.tg_log_flashcard_moderation(),
  public.contributions_pot_is_immutable()
from public, anon, authenticated;
