-- The preference tables 0046 added get the second lock the rest of the schema
-- carries, and their reads get the second factor gate their writes already had.
--
-- 0015 set the rule: every verb the app does not use is revoked, so row level
-- security is the second line rather than the only one, and 0033 applied it to
-- the study tables that had arrived without it. 0046 arrived without it too.
-- The app upserts into both tables and reads both, and never deletes from
-- either; 0046's header argued that a preference left behind by a class you
-- have left should stay yours to delete, but nothing does that, and a verb
-- nothing uses is a verb that should not exist on the surface. That sentence
-- in 0046 is superseded here rather than edited, because an applied migration
-- is left as written.
--
-- The other gap is the gate. pot_preferences writes already went through
-- is_pot_member, which refuses a session whose second factor is outstanding
-- (0028). Its reads did not, and sidebar_preferences had the gate on neither.
-- A session that has not finished signing in now reads no preferences at all,
-- which degrades to the default order and the first class, the same as a
-- person who never arranged anything. The proxy already keeps such a session
-- off every signed-in page, so this is consistency rather than a new wall.

revoke delete, truncate, references, trigger
  on public.sidebar_preferences from authenticated, anon;
revoke delete, truncate, references, trigger
  on public.pot_preferences from authenticated, anon;

grant select, insert, update on public.sidebar_preferences to authenticated;
grant select, insert, update on public.pot_preferences to authenticated;

drop policy if exists sidebar_preferences_own on public.sidebar_preferences;
create policy sidebar_preferences_own on public.sidebar_preferences
  for all to authenticated
  using (user_id = (select auth.uid()) and public.has_required_aal())
  with check (user_id = (select auth.uid()) and public.has_required_aal());

drop policy if exists pot_preferences_own on public.pot_preferences;
create policy pot_preferences_own on public.pot_preferences
  for all to authenticated
  using (user_id = (select auth.uid()) and public.has_required_aal())
  with check (user_id = (select auth.uid()) and public.is_pot_member(pot_id));
