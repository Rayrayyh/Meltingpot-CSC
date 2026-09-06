-- 0054: identity behind the seam.
--
-- Every policy and every definer function asked auth.uid() who is calling.
-- That is Supabase Auth's answer, a uuid it minted. The auth seam in
-- web/lib/auth was built so Clerk could take over identity later (decision
-- 013), and Supabase accepts Clerk's session tokens through third-party auth,
-- but a Clerk subject is "user_2abc..." and not a uuid, so auth.uid() would
-- fail on every row. This migration puts one question in front of all of them:
--
--   public.current_uid()  the caller's profile id, whatever signed them in.
--
-- For a Supabase token it is auth.uid(), unchanged. For a Clerk token it is
-- the profile that carries that subject as clerk_id, or, for someone who has
-- never had one, a uuid derived from the subject (version 5, fixed namespace),
-- which is also the id ensure_profile() gives their row. Imported accounts
-- keep their old uuid by having clerk_id set; new ones get the derived one.
--
-- Nothing changes for the app as deployed: NEXT_PUBLIC_AUTH_PROVIDER is
-- unset, every token is Supabase's, and current_uid() is auth.uid() by another
-- name. The rewrite of the 25 policies and 40 functions that name auth.uid()
-- is done here in one DO block from their live definitions (pg_get_functiondef
-- and pg_policies), not retyped by hand, which is lesson 011 applied at scale:
-- what is re-emitted is exactly what was there, plus the one substitution.
--
-- Two other things follow from profiles no longer being a mirror of
-- auth.users: the foreign key from profiles.id to auth.users goes (a Clerk
-- profile has no auth.users row), and a trigger on auth.users deletion takes
-- over what the cascade did. has_required_aal() learns to read a Clerk token:
-- Clerk enforces an enrolled second factor at sign in and records it in the
-- token's fva claim; when the session token template also carries two_factor
-- (user.two_factor_enabled) the check is exact.

-- 1. The profile can now belong to a subject that is not one of ours -------

alter table public.profiles add column if not exists clerk_id text;
create unique index if not exists profiles_clerk_id_key on public.profiles (clerk_id) where clerk_id is not null;

alter table public.profiles drop constraint if exists profiles_id_fkey;

create or replace function public.handle_deleted_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- What the dropped foreign key's cascade used to do.
  delete from public.profiles where id = old.id;
  return old;
end;
$$;
revoke execute on function public.handle_deleted_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
after delete on auth.users
for each row execute function public.handle_deleted_user();

-- 2. One answer to "who is calling" -------------------------------------------

-- A stable id for a subject that never had a profile: version 5 under a fixed
-- namespace, so the browser and the database agree on it without a lookup.
create or replace function public.clerk_uuid(p_sub text)
returns uuid
language sql
immutable
strict
set search_path = public
as $$
  select extensions.uuid_generate_v5('9f3b6c1e-2d47-4a58-8e1f-0c7a5b2d9e61'::uuid, p_sub);
$$;
revoke execute on function public.clerk_uuid(text) from public, anon, authenticated;

create or replace function public.current_uid()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_sub text := auth.jwt() ->> 'sub';
  v_id uuid;
begin
  if v_sub is null or v_sub = '' then
    return null;
  end if;
  -- Supabase Auth mints uuids; that is the whole test, and the common case.
  if v_sub ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v_sub::uuid;
  end if;
  -- A Clerk subject: the profile that carries it, else the derived id.
  -- Definer, so reading profiles here does not recurse into its own policy.
  select id into v_id from public.profiles where clerk_id = v_sub;
  return coalesce(v_id, public.clerk_uuid(v_sub));
end;
$$;
revoke execute on function public.current_uid() from public;
grant execute on function public.current_uid() to anon, authenticated;

-- The row a Clerk sign in needs on first arrival. Supabase sessions have theirs
-- from the trigger on auth.users and are handed straight back.
create or replace function public.ensure_profile(p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub text := auth.jwt() ->> 'sub';
  v_id uuid := public.current_uid();
  v_name text := left(coalesce(nullif(trim(p_display_name), ''), 'Student'), 80);
begin
  if v_id is null then raise exception 'not_authenticated'; end if;
  if v_sub ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v_id;
  end if;
  insert into public.profiles (id, display_name, clerk_id)
  values (v_id, v_name, v_sub)
  on conflict (id) do update
    set clerk_id = coalesce(public.profiles.clerk_id, excluded.clerk_id);
  return v_id;
end;
$$;
revoke execute on function public.ensure_profile(text) from public, anon;
grant execute on function public.ensure_profile(text) to authenticated;

-- 3. The second factor check reads either token --------------------------------

create or replace function public.has_required_aal()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when (auth.jwt() ->> 'sub') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      -- A Clerk session. fva[1] is the age in minutes of the second factor
      -- this session cleared, -1 when it cleared none. Clerk refuses to open
      -- a session for an enrolled account without one, so the claim is
      -- ordinarily enough; a two_factor claim from the session token template
      -- makes the requirement explicit when the owner adds it.
      coalesce((auth.jwt() -> 'fva' ->> 1)::int, -1) >= 0
      or coalesce(auth.jwt() ->> 'two_factor', 'false') <> 'true'
    else
      coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (
        select 1
        from auth.mfa_factors f
        where f.user_id = (select auth.uid())
          and f.status = 'verified'
      )
  end;
$$;

-- 4. Every policy and function that asked auth.uid() now asks current_uid() --

do $$
declare
  r record;
  v_sql text;
begin
  for r in
    select p.oid, p.proname
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname not in ('current_uid', 'has_required_aal', 'ensure_profile', 'clerk_uuid', 'handle_deleted_user')
      and pg_get_functiondef(p.oid) like '%auth.uid()%'
    order by p.proname
  loop
    execute replace(pg_get_functiondef(r.oid), 'auth.uid()', 'public.current_uid()');
  end loop;

  for r in
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '') like '%auth.uid()%' or coalesce(with_check, '') like '%auth.uid()%')
    order by tablename, policyname
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    v_sql := format(
      'create policy %I on %I.%I as %s for %s to %s',
      r.policyname, r.schemaname, r.tablename, r.permissive, r.cmd, array_to_string(r.roles, ', ')
    );
    if r.qual is not null then
      v_sql := v_sql || format(' using (%s)', replace(r.qual, 'auth.uid()', 'public.current_uid()'));
    end if;
    if r.with_check is not null then
      v_sql := v_sql || format(' with check (%s)', replace(r.with_check, 'auth.uid()', 'public.current_uid()'));
    end if;
    execute v_sql;
  end loop;
end;
$$;
