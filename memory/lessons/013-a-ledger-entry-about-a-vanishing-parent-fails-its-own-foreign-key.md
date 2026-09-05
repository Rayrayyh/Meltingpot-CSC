# A ledger entry about a vanishing parent fails its own foreign key

An AFTER DELETE trigger that records "X was removed from Pot P" cannot
run inside P's own deletion: the row it inserts references P, and P is
already gone from the transaction's view when the check runs.

0045 added `log_membership_change`, an AFTER DELETE trigger on memberships
that writes `member_removed` to `admin_events` through `log_admin_event`.
`admin_events.pot_id` references `pots`. Deleting a Pot cascades to its
memberships, the trigger fires for each, and the insert names the Pot being
deleted. Postgres checks the foreign key at the end of that inner insert
with a snapshot in which the pots row has already been removed, so the
insert fails with `23503` and the entire `delete from pots` rolls back.
Every Pot has at least its owner's membership. So from the day 0045 went
live, no Pot could be deleted, and the owner's Delete button in Pot
settings failed every time. Nobody noticed because nothing tested it and
nobody deleted a Pot in that stretch.

It surfaced when a review of 0049 saw the same shape in a new trigger and
asked whether the old one already misbehaved. A DO block answered without
persisting anything:

```sql
do $$ declare v uuid; begin
  select id into v from public.pots where exists (
    select 1 from public.memberships m where m.pot_id = pots.id) limit 1;
  delete from public.pots where id = v;
  raise exception 'probe: delete succeeded, rolled back';
end $$;
```

The message that came back was the foreign key violation, not the probe
line. 0048 fixes it in the one writer every ledger trigger calls: an event
about a Pot that no longer exists is skipped. Inside the cascade that check
sees no Pot; every ordinary event still finds its Pot and lands.

Two habits from this:

- A row trigger fires inside cascades as well as inside the statements you
  wrote it for. Ask what its insert references, and whether the cascade's
  root is that very thing.
- When a review finds a shape wrong in new code, look for the same shape in
  what is already live before applying anything, and probe it inside a DO
  block that raises at the end. The error text is the answer and nothing
  persists.

Related: memory/lessons/011 on re-emitting a body, which is how the fix was
applied (the live definition diffed against 0045 first).
