-- Classwork from elsewhere.
--
-- A person's Canvas or Google Classroom courses, brought in read-only so due
-- dates, assignments, announcements and links to materials sit beside the
-- class's own notes. Nothing here is a note. An imported item becomes a
-- MeltingPot resource only when a person starts a note from it and shares it
-- through the same composer and the same share_contribution as everything
-- else, so the record of days and the class standing stay about what people
-- actually did. The owner lifted the SPEC's exclusion of this on 2026-09-05
-- (decision 038).
--
-- Tokens never sit in these tables. The refresh token goes into Vault and only
-- the definer functions in 0050 read it back, and only on the app server's say
-- so. Who connected what, and when it last synced, lives in owner-only or
-- Pot-scoped rows, never on memberships or profiles, for the reason 0046 gave:
-- those tables are readable by the whole class (decision 033).
--
-- Who linked decides who reads. A maintainer linking a course to a Pot makes
-- its items readable by every member. A student linking a course privately
-- makes them readable by nobody but themselves. Both can be true of the same
-- course at once; the read layer collapses the pair. When a membership ends,
-- so do that person's links into the Pot: a class never keeps syncing from
-- the account of somebody who left.
--
-- What a Pot link shows its members about the linker: that they linked it
-- (the ledger), when it last synced and how many items it holds, and the
-- enrollment the provider reports. None of that is the linker's own activity
-- in the sense decision 033 protects: a sync is started by whoever opened the
-- Pot, or by the hourly job, and item timestamps describe the course. The
-- pass cursor and the Vault id stay outside the column grants.

create type public.lms_provider as enum ('google_classroom', 'canvas');
create type public.lms_item_kind as enum
  ('assignment', 'quiz', 'discussion', 'announcement', 'material', 'event');

-- One row per person per provider. The Canvas host is a column, so a table of
-- instances can replace the single configured one without a schema change.
create table public.lms_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider public.lms_provider not null,
  instance_url text check (instance_url is null or instance_url ~ '^https://[a-z0-9.-]+$'),
  external_user_id text not null check (char_length(external_user_id) <= 200),
  -- What the provider calls them, shown back so they know which account this is.
  external_display text check (char_length(external_display) <= 200),
  scopes text[] not null default '{}',
  -- A Vault id. The secret itself is never in this row.
  refresh_secret_id uuid,
  consent_at timestamptz not null default now(),
  -- Google in Testing status expires consent after seven days; Canvas when the
  -- key is revoked. Set by the sync when a refresh fails, cleared on reconnect.
  needs_reconnect_at timestamptz,
  last_error text check (char_length(last_error) <= 400),
  -- The person's course list as the provider last gave it, so opening settings
  -- costs no provider call. Refreshed on connect and on request.
  courses jsonb not null default '[]'::jsonb check (jsonb_typeof(courses) = 'array'),
  courses_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- A course on a provider, linked either to a Pot or to nobody but the linker.
create table public.lms_course_links (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.lms_connections (id) on delete cascade,
  -- Copied from the connection so the policies need no join. Immutable below.
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider public.lms_provider not null,
  pot_id uuid references public.pots (id) on delete cascade,
  external_course_id text not null check (char_length(external_course_id) <= 200),
  course_name text not null check (char_length(course_name) between 1 and 300),
  course_url text check (course_url is null or course_url ~ '^https://'),
  -- As the provider reports it. Informational: authority here is the Pot role.
  enrollment text not null default 'unknown'
    check (enrollment in ('teacher', 'student', 'unknown')),
  sync_status text not null default 'never'
    check (sync_status in ('never', 'running', 'ok', 'error', 'reconnect')),
  sync_started_at timestamptz,
  sync_finished_at timestamptz,
  -- Where a pass got to: passStartedAt, phase, pageToken. Empty once a pass
  -- completes, so the next run starts a fresh one.
  sync_cursor jsonb not null default '{}'::jsonb check (jsonb_typeof(sync_cursor) = 'object'),
  -- A phrase this codebase wrote, never provider output: members read it.
  sync_error text check (char_length(sync_error) <= 400),
  item_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique nulls not distinct (connection_id, external_course_id, pot_id)
);
create index lms_course_links_pot_idx on public.lms_course_links (pot_id) where pot_id is not null;
create index lms_course_links_user_idx on public.lms_course_links (user_id);

-- One imported thing. Assignments, quizzes, discussions, announcements,
-- materials and calendar events share this shape. materials is links only,
-- never bytes: reading a Drive file's content would need a restricted scope.
create table public.lms_items (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.lms_course_links (id) on delete cascade,
  -- Copied from the link for the policies. Immutable below.
  pot_id uuid references public.pots (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider public.lms_provider not null,
  -- Namespaced by the adapter as kind:providerId, so a Canvas assignment 12
  -- and a Canvas discussion 12 cannot collide.
  external_id text not null check (char_length(external_id) <= 200),
  kind public.lms_item_kind not null,
  title text not null check (char_length(title) between 1 and 500),
  -- Plain text; Canvas sends HTML, flattened on the server. Capped to match
  -- contributions.raw_text, since it may become a draft.
  description text not null default '' check (char_length(description) <= 20000),
  due_at timestamptz,
  -- Classroom gives a date with no time for some work; shown without a clock.
  due_all_day boolean not null default false,
  available_from timestamptz,
  posted_at timestamptz,
  url text check (url is null or url ~ '^https://'),
  materials jsonb not null default '[]'::jsonb
    check (jsonb_typeof(materials) = 'array' and jsonb_array_length(materials) <= 40),
  external_updated_at timestamptz,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  changed_at timestamptz not null default now(),
  -- Gone from the provider, or unpublished. Never deleted by the sync.
  removed_at timestamptz,
  unique (link_id, external_id)
);
-- The partial pair serves the due-date reads; the plain pair serves the
-- cascades from pots and profiles, whose deletes carry no removed_at test and
-- so cannot use a partial index.
create index lms_items_pot_due_idx on public.lms_items (pot_id, due_at) where removed_at is null;
create index lms_items_user_due_idx on public.lms_items (user_id, due_at) where removed_at is null;
create index lms_items_pot_fk_idx on public.lms_items (pot_id);
create index lms_items_user_fk_idx on public.lms_items (user_id);

-- Where a draft came from, when it came from classwork. Set by the composer on
-- insert, nulled if the item goes. Provenance only: it changes nothing about
-- how the note is organized, approved or shared. The column is written by the
-- browser, so the contributions policies below check that it points at an
-- item the author can actually see, in this Pot or in their own private list.
alter table public.contributions
  add column source_lms_item_id uuid references public.lms_items (id) on delete set null;
create index contributions_source_item_idx on public.contributions (source_lms_item_id)
  where source_lms_item_id is not null;

alter table public.lms_connections enable row level security;
alter table public.lms_course_links enable row level security;
alter table public.lms_items enable row level security;

-- The second lock first (0015, 0033, 0047): every verb the app does not use is
-- gone from the surface before a single policy exists. Writes go through the
-- functions in 0050 and nothing else.
revoke all on public.lms_connections from authenticated, anon;
revoke all on public.lms_course_links from authenticated, anon;
revoke all on public.lms_items from authenticated, anon;

-- The Vault id and the raw scope list are nobody's business in a browser, and
-- the pass cursor holds provider page tokens that the class has no use for.
-- Column grants mean the app's readers name their columns: select=* fails.
grant select (id, provider, instance_url, external_display, consent_at,
              needs_reconnect_at, last_error, courses, courses_fetched_at,
              created_at, updated_at)
  on public.lms_connections to authenticated;
grant select (id, connection_id, user_id, provider, pot_id, external_course_id,
              course_name, course_url, enrollment, sync_status, sync_started_at,
              sync_finished_at, sync_error, item_count, created_at)
  on public.lms_course_links to authenticated;
grant select on public.lms_items to authenticated;

create policy lms_connections_select on public.lms_connections
  for select to authenticated
  using (user_id = (select auth.uid()) and public.has_required_aal());

create policy lms_course_links_select on public.lms_course_links
  for select to authenticated
  using (
    (user_id = (select auth.uid()) and public.has_required_aal())
    or (pot_id is not null and public.is_pot_member(pot_id))
  );

create policy lms_items_select on public.lms_items
  for select to authenticated
  using (
    (pot_id is null and user_id = (select auth.uid()) and public.has_required_aal())
    or (pot_id is not null and public.is_pot_member(pot_id))
  );

-- A draft may name where it came from only if its author can see that item:
-- an item of this very Pot, or one of their own private links. Same policies
-- as 0029 and 0029c with that one clause added; they read lms_items, not
-- contributions, so there is no recursion (the trap 0029b fell into).
drop policy contributions_insert on public.contributions;
create policy contributions_insert on public.contributions for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_pot_member(pot_id)
    and status = 'draft'
    and (
      source_lms_item_id is null
      or exists (
        select 1 from public.lms_items i
        where i.id = contributions.source_lms_item_id
          and (i.pot_id = contributions.pot_id
               or (i.pot_id is null and i.user_id = (select auth.uid())))
      )
    )
  );

drop policy contributions_update on public.contributions;
create policy contributions_update on public.contributions for update to authenticated
  using (author_id = (select auth.uid()) and status <> 'shared')
  with check (
    author_id = (select auth.uid())
    and status <> 'shared'
    and (
      source_lms_item_id is null
      or exists (
        select 1 from public.lms_items i
        where i.id = contributions.source_lms_item_id
          and (i.pot_id = contributions.pot_id
               or (i.pot_id is null and i.user_id = (select auth.uid())))
      )
    )
  );

-- pot_id and user_id on links and items are copies. A write that moved one
-- would move the whole audience, so they cannot move. Same shape as 0029c,
-- with the search path pinned as 0040 did.
create or replace function public.tg_lms_scope_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.pot_id is distinct from old.pot_id or new.user_id is distinct from old.user_id then
    raise exception 'scope_immutable' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke execute on function public.tg_lms_scope_immutable() from public, anon, authenticated;
create trigger lms_course_links_scope_immutable
  before update on public.lms_course_links
  for each row execute function public.tg_lms_scope_immutable();
create trigger lms_items_scope_immutable
  before update on public.lms_items
  for each row execute function public.tg_lms_scope_immutable();

-- A connection that goes takes its secret with it, whichever way it goes:
-- lms_disconnect deletes the secret itself, but the cascade from a deleted
-- account does not, and a live refresh token nothing references must not stay
-- in Vault. Revoking it at the provider on account deletion is not done here;
-- that belongs to whatever account deletion flow arrives.
create or replace function public.tg_lms_connection_secret_gone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.refresh_secret_id is not null then
    delete from vault.secrets where id = old.refresh_secret_id;
  end if;
  return old;
end;
$$;
revoke execute on function public.tg_lms_connection_secret_gone() from public, anon, authenticated;
create trigger lms_connections_secret_gone
  before delete on public.lms_connections
  for each row execute function public.tg_lms_connection_secret_gone();

-- When a membership ends, the person's links into that Pot end with it, so
-- the class stops receiving classwork from an account that has left, and the
-- ledger shows the feed stopping. Inside a Pot's own delete this is a no-op
-- on rows the cascade is removing anyway.
create or replace function public.tg_membership_ends_course_links()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.lms_course_links where pot_id = old.pot_id and user_id = old.user_id;
  return null;
end;
$$;
revoke execute on function public.tg_membership_ends_course_links() from public, anon, authenticated;
create trigger membership_ends_course_links
  after delete on public.memberships
  for each row execute function public.tg_membership_ends_course_links();

-- Linking a course to a Pot is an administrative act; it goes on the ledger
-- 0045 keeps, through the one writer that table has. 0048 made that writer
-- skip a Pot that is mid-delete, so the cascade from pots passes through here
-- without failing the delete.
create or replace function public.tg_log_course_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.pot_id is not null then
    perform public.log_admin_event(new.pot_id, 'classwork_linked', new.id,
      jsonb_build_object('provider', new.provider, 'course', new.course_name));
  elsif tg_op = 'DELETE' and old.pot_id is not null then
    perform public.log_admin_event(old.pot_id, 'classwork_unlinked', old.id,
      jsonb_build_object('provider', old.provider, 'course', old.course_name));
  end if;
  return null;
end;
$$;
revoke execute on function public.tg_log_course_link() from public, anon, authenticated;
create trigger log_course_link
  after insert or delete on public.lms_course_links
  for each row execute function public.tg_log_course_link();

create trigger lms_connections_updated_at
  before update on public.lms_connections
  for each row execute function public.set_updated_at();
