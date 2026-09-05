-- Your sidebar, in your order, and the class the collapsed rail opens.
--
-- Three things arrive together because they answer one question. With the rail
-- collapsed the My Pots control has no list to open, so it has to navigate, and
-- it needs somewhere to go: the class you put first, else one you marked, else
-- the one you were in last.
--
-- Both of these are tables of their own rather than columns hung off
-- memberships or profiles, and that is the entire reason they exist. The
-- memberships_select policy lets every member of a Pot read the whole roster,
-- and profiles_select lets anyone who shares a Pot with you read your row. A
-- last_viewed_at on either would publish to twenty nine classmates exactly when
-- each of them last opened the class. That is behavioural data about a child,
-- and nobody but its owner has any business reading it. Here the only policy on
-- either table is the owner's own row.

create table public.sidebar_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  -- Nav link keys in the order this person wants them, and the ones they have
  -- put away. Both are advisory: a key that no longer exists is ignored on
  -- read, and a link missing from the list is appended in its default place.
  -- So shipping a new destination never leaves it invisible to everyone who
  -- already arranged their sidebar, and retiring one never corrupts an order.
  nav_order text[] not null default '{}' check (cardinality(nav_order) <= 32),
  nav_hidden text[] not null default '{}' check (cardinality(nav_hidden) <= 32),
  updated_at timestamptz not null default now()
);

create table public.pot_preferences (
  user_id uuid not null references public.profiles (id) on delete cascade,
  pot_id uuid not null references public.pots (id) on delete cascade,
  -- Null means not marked. Storing when rather than whether costs nothing and
  -- breaks the tie when someone has marked several.
  favorited_at timestamptz,
  last_viewed_at timestamptz,
  -- Null sorts last, so a class nobody has arranged keeps its join order behind
  -- the ones they have.
  position integer check (position is null or position between 0 and 4096),
  primary key (user_id, pot_id)
);

alter table public.sidebar_preferences enable row level security;
alter table public.pot_preferences enable row level security;

create policy sidebar_preferences_own on public.sidebar_preferences
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Reading and clearing need only that the row is yours, so a preference left
-- behind by a class you have left is still yours to delete. Writing also asks
-- that you are actually in the Pot, so the table cannot be used as free storage
-- keyed on Pot ids you have nothing to do with.
create policy pot_preferences_own on public.pot_preferences
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_pot_member(pot_id));
