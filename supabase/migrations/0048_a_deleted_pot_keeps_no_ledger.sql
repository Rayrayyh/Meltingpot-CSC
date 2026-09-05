-- A deleted Pot keeps no ledger, so deleting a Pot works again.
--
-- 0045 put a trigger on memberships that writes member_removed to admin_events
-- through log_admin_event. When a Pot is deleted the cascade removes its
-- memberships, the trigger fires for each one, and the insert names a Pot that
-- is already gone in this transaction. admin_events.pot_id references pots,
-- the check runs at the end of that inner insert against a view in which the
-- Pot no longer exists, and the whole delete fails with a foreign key
-- violation. Every Pot has at least its owner's membership, so no Pot could be
-- deleted since 0045 went live. Confirmed on 2026-09-05 with a delete inside a
-- DO block that raised afterwards, so nothing persisted (memory/lessons/013).
--
-- Fixed once, in the one writer every ledger trigger calls, rather than in
-- each trigger: an event about a Pot that no longer exists is skipped. Inside a
-- cascade that select sees no Pot; every ordinary event still finds its Pot
-- and lands. The body below is 0045's, diffed against pg_get_functiondef on
-- the live function before this was applied (memory/lessons/011), plus one
-- guard.

create or replace function public.log_admin_event(
  p_pot_id uuid,
  p_kind text,
  p_subject_id uuid,
  p_detail jsonb
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if p_pot_id is null then return; end if;
  -- Inside a Pot's own delete cascade the Pot is already gone from this
  -- transaction's view; an entry about it would fail the foreign key and take
  -- the delete down with it.
  if not exists (select 1 from public.pots where id = p_pot_id) then return; end if;
  insert into public.admin_events (pot_id, actor_id, kind, subject_id, detail)
  values (p_pot_id, (select auth.uid()), p_kind, p_subject_id, coalesce(p_detail, '{}'::jsonb));
end;
$$;

revoke execute on function public.log_admin_event(uuid, text, uuid, jsonb) from public, anon, authenticated;
