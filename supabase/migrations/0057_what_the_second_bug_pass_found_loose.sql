-- 0057: What the second bug pass found loose.
--
-- Twenty-seven agents read the tree and the database; fifteen findings
-- survived a skeptic. Seven of them live here.
--
-- 1. The ten people who moved to Clerk (0054) kept their Supabase Auth rows,
--    their passwords and twenty-one live sessions. Clerk's second factor
--    guarded one door while the old one stood open beside it. The rows stay,
--    because the trigger in item 2 used to take the profile with them and the
--    profile is the person; they are banned instead, and every session and
--    refresh token they held is revoked. Local runs and the Playwright suite
--    still sign in through Supabase Auth with the seed accounts, which have
--    no clerk_id and are untouched.
-- 2. handle_deleted_user deleted the profile whenever an auth.users row went.
--    For a Clerk person that row is vestigial, and dropping it would have
--    taken their Pots, notes and memberships. A profile Clerk owns stays.
-- 3. sign_up_student let anyone mint a Supabase account outside Clerk, second
--    factor and all. The live site never calls it; local runs and the suite
--    do, with addresses on the test domain the dev seed already trusts. It
--    now admits only those.
-- 4. classwork_finish_pass stamped a lapsed connection but left the
--    connection's other course links in 'ok', so their pages never offered
--    Reconnect and the hourly job kept trying them. The token is the
--    connection's, so every link on it is as lapsed as the one that noticed.
-- 5. save_study_set accepted an empty deck or test and served it as the
--    class's set for that material until someone rebuilt it. It refuses.
-- 6. Rebuilding a practice test replaced the keys under anyone taking the
--    old one; their hand-in was then marked against a different test and
--    recorded as if it were this one. A set now carries a generation, and a
--    hand-in names the generation it took. A mismatch is refused.
-- 7. study_set_removed_for lets the route learn a set was taken down before
--    it spends a generation, calls the model, and hands the full test back
--    with its answer key because the save was refused.

-- 1. The old door, closed for the people who moved.
update auth.users u
set banned_until = 'infinity'
from public.profiles p
where p.id = u.id and p.clerk_id is not null and u.banned_until is null;

delete from auth.sessions s
using public.profiles p
where p.id = s.user_id and p.clerk_id is not null;

update auth.refresh_tokens rt
set revoked = true
from public.profiles p
where p.id::text = rt.user_id and p.clerk_id is not null and rt.revoked = false;

-- 2. A profile Clerk owns is not the auth row's to take.
create or replace function public.handle_deleted_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- What the dropped foreign key's cascade used to do, for the accounts
  -- Supabase Auth still owns. A Clerk person's auth row is a leftover of the
  -- move (0054); deleting it must not delete them.
  delete from public.profiles where id = old.id and clerk_id is null;
  return old;
end;
$$;

-- 3. Browser sign up through Supabase Auth is for the test domain.
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
  -- Real people sign up through Clerk, which the live site uses (0054). This
  -- path serves local runs and the test suite, whose accounts live on the
  -- same domain dev_seed trusts (0034). Anything else would be a Supabase
  -- account minted around Clerk and its second factor.
  if v_email not like '%@meltingpot.dev' then
    return jsonb_build_object('error', 'not_configured');
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

-- 4. A lapsed connection lapses every course it carries.
create or replace function public.classwork_finish_pass(p_link_id uuid, p_status text, p_error text)
returns void
language plpgsql
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
    -- The refresh token belongs to the connection, not the link, so the
    -- sibling links cannot sync either. Said on each of them, so every course
    -- page offers Reconnect and the hourly job stops claiming them. One
    -- still mid pass is left to find out for itself and finish here.
    update public.lms_course_links
    set sync_status = 'reconnect',
        sync_finished_at = now(),
        sync_error = left(p_error, 400)
    where connection_id = v_connection
      and id <> p_link_id
      and sync_status <> 'running';
  end if;
end;
$$;

-- 5 and 6. A set with nothing in it is not saved; a rebuilt set is a new
-- generation of the same row.
alter table public.study_sets
  add column if not exists generation integer not null default 1;

comment on column public.study_sets.generation is
  'Counts up each time the set is rebuilt in place. A practice hand-in names the generation it took, so a rebuild cannot mark it.';

create or replace function public.save_study_set(p_pot_id uuid, p_kind text, p_fingerprint text, p_payload jsonb, p_model text, p_options jsonb default null, p_keys jsonb default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select public.current_uid());
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
  -- The shape, and then that there is something in it. A deck with no cards
  -- or a test with no questions used to be stored and served as the class's
  -- set for that material, an empty page nobody could rebuild without the
  -- regenerate button.
  if p_kind = 'flashcards' and (
    jsonb_typeof(p_payload -> 'cards') <> 'array'
    or jsonb_array_length(p_payload -> 'cards') = 0
  ) then
    raise exception 'invalid_payload';
  end if;
  if p_kind = 'practice' and (
    jsonb_typeof(p_payload -> 'questions') <> 'array'
    or jsonb_array_length(p_payload -> 'questions') = 0
  ) then
    raise exception 'invalid_payload';
  end if;
  if p_kind = 'summary' and (
    jsonb_typeof(p_payload -> 'overview') <> 'string'
    or char_length(trim(p_payload ->> 'overview')) = 0
  ) then
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
        created_at = now(),
        -- A rebuild in place. Anyone still taking the previous test holds
        -- its generation, and submit_practice_test refuses the mismatch.
        generation = public.study_sets.generation + 1
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

-- A new parameter is a new signature; the old one goes so a call with three
-- arguments cannot be ambiguous.
drop function if exists public.submit_practice_test(uuid, uuid, jsonb);

create or replace function public.submit_practice_test(p_attempt_id uuid, p_set_id uuid, p_answers jsonb, p_generation integer default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select public.current_uid());
  v_set public.study_sets%rowtype;
  v_keys jsonb;
  v_order jsonb;
  v_choices jsonb;
  v_count integer;
  v_index integer;
  v_choice integer;
  v_correct boolean;
  v_correct_count integer := 0;
  v_total integer;
  v_first boolean;
  v_marks jsonb := '[]'::jsonb;
  v_existing public.study_attempts%rowtype;
  v_seen integer[] := '{}';
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_attempt_id is null then raise exception 'invalid_attempt'; end if;

  select * into v_set from public.study_sets where id = p_set_id;
  if v_set.id is null or v_set.removed_at is not null then raise exception 'set_not_found'; end if;
  if v_set.kind <> 'practice' then raise exception 'not_a_practice_set'; end if;
  if not v_set.secured then raise exception 'set_not_secured'; end if;
  if not public.is_pot_member(v_set.pot_id) then raise exception 'not_pot_member'; end if;
  -- The test on this person's screen is the one they answered. If the set
  -- was rebuilt underneath them, the keys now belong to different questions
  -- and marking against them would record a score for a test never taken.
  if p_generation is not null and p_generation <> v_set.generation then
    raise exception 'set_replaced';
  end if;

  select * into v_existing from public.study_attempts where id = p_attempt_id;
  if v_existing.id is not null then
    if v_existing.user_id <> v_uid or v_existing.set_id <> p_set_id then
      raise exception 'attempt_conflict';
    end if;
    select keys into v_keys from public.study_set_keys where set_id = p_set_id;
    select coalesce(jsonb_agg(jsonb_build_object(
      'index', r.question_index,
      'choice', r.choice,
      'correct', r.correct,
      'answerIndex', (v_keys -> r.question_index ->> 'answerIndex')::integer,
      'explanation', v_keys -> r.question_index ->> 'explanation'
    ) order by r.question_index), '[]'::jsonb)
    into v_marks
    from public.study_responses r where r.attempt_id = p_attempt_id;
    return jsonb_build_object(
      'firstPass', v_existing.first_pass,
      'correct', v_existing.correct,
      'total', v_existing.total,
      'replayed', true,
      'marks', v_marks
    );
  end if;

  perform consume_rate_limit('submit_practice', 'user:' || v_uid::text, 120, interval '1 hour');

  select keys into v_keys from public.study_set_keys where set_id = p_set_id;
  if v_keys is null then raise exception 'set_not_secured'; end if;
  v_count := jsonb_array_length(v_keys);

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'invalid_answers';
  end if;
  v_order := p_answers -> 'order';
  v_choices := p_answers -> 'choices';
  if v_order is null or jsonb_typeof(v_order) <> 'array'
     or jsonb_array_length(v_order) = 0
     or jsonb_array_length(v_order) > v_count then
    raise exception 'invalid_answers';
  end if;
  if v_choices is not null and jsonb_typeof(v_choices) <> 'object' then
    raise exception 'invalid_answers';
  end if;

  v_total := jsonb_array_length(v_order);

  v_first := v_total = v_count and not exists (
    select 1 from public.study_attempts
    where set_id = p_set_id and user_id = v_uid and kind = 'practice'
  );

  insert into public.study_attempts (id, pot_id, set_id, user_id, kind, first_pass, correct, total)
  values (p_attempt_id, v_set.pot_id, p_set_id, v_uid, 'practice', v_first, 0, v_total);

  for i in 0 .. v_total - 1 loop
    if jsonb_typeof(v_order -> i) <> 'number' then raise exception 'invalid_answers'; end if;
    v_index := (v_order ->> i)::integer;
    if v_index < 0 or v_index >= v_count then raise exception 'invalid_answers'; end if;
    if v_index = any (v_seen) then raise exception 'invalid_answers'; end if;
    v_seen := v_seen || v_index;

    if v_choices ? v_index::text then
      v_choice := (v_choices ->> v_index::text)::integer;
      if v_choice < 0 or v_choice > 3 then raise exception 'invalid_answers'; end if;
    else
      v_choice := null;
    end if;

    v_correct := v_choice is not null
      and v_choice = (v_keys -> v_index ->> 'answerIndex')::integer;
    if v_correct then v_correct_count := v_correct_count + 1; end if;

    insert into public.study_responses (attempt_id, question_index, choice, correct)
    values (p_attempt_id, v_index, v_choice, v_correct);

    v_marks := v_marks || jsonb_build_object(
      'index', v_index,
      'choice', v_choice,
      'correct', v_correct,
      'answerIndex', (v_keys -> v_index ->> 'answerIndex')::integer,
      'explanation', v_keys -> v_index ->> 'explanation'
    );
  end loop;

  update public.study_attempts set correct = v_correct_count where id = p_attempt_id;

  return jsonb_build_object(
    'firstPass', v_first,
    'correct', v_correct_count,
    'total', v_total,
    'replayed', false,
    'marks', v_marks
  );
end;
$$;

revoke execute on function public.submit_practice_test(uuid, uuid, jsonb, integer) from public, anon;
grant execute on function public.submit_practice_test(uuid, uuid, jsonb, integer) to authenticated;

-- 7. Whether a set for this material was taken down. Members cannot see
-- removed rows (0053), which is right for reading and wrong for the one
-- question the route has to ask before it spends a generation.
create or replace function public.study_set_removed_for(p_pot_id uuid, p_kind text, p_fingerprint text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_pot_member(p_pot_id) and exists (
    select 1 from public.study_sets
    where pot_id = p_pot_id
      and kind = p_kind
      and source_fingerprint = left(p_fingerprint, 128)
      and removed_at is not null
  );
$$;

revoke execute on function public.study_set_removed_for(uuid, text, text) from public, anon;
grant execute on function public.study_set_removed_for(uuid, text, text) to authenticated;
