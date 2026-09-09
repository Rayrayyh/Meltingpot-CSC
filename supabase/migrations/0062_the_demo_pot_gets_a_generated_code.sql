-- 0061 tightened the class code check but had to name one exception: the seeded
-- demo Pot BIO101, which carries three look alikes (I, O, 1, 0) and predates the
-- rule. This retires the exception by moving the fixture instead of excusing it.
--
-- 5R22AX came out of generate_class_code() itself, so the demo Pot now carries
-- the same kind of code every other class gets rather than a hand written one.

-- 1. The seeded row. Still allowed by 0061's check, which accepts the new code.
update public.pots set class_code = '5R22AX' where class_code = 'BIO101';

-- 2. dev_seed() hardcodes the code twice, once to delete the previous Pot and
--    once to insert it. Its body is 18,805 characters; retyping it to change one
--    literal is the mistake memory/lessons/011 records, where re-emitting a
--    function silently dropped guards nobody had looked at. So the swap is made
--    against the live definition: read it, assert the shape it must have,
--    replace, re-execute. Nothing is rewritten from memory.
do $$
declare src text; hits int;
begin
  select pg_get_functiondef(p.oid) into src
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'dev_seed';

  if src is null then
    raise exception 'dev_seed() not found';
  end if;

  hits := (length(src) - length(replace(src, 'BIO101', ''))) / 6;

  if hits = 0 then
    raise notice 'dev_seed() already free of the legacy code, nothing to do';
  elsif hits = 2 then
    execute replace(src, 'BIO101', '5R22AX');
  else
    raise exception 'dev_seed() names BIO101 % times, expected 2', hits;
  end if;
end $$;

-- 3. No exception left to carry.
alter table public.pots drop constraint if exists pots_class_code_check;

alter table public.pots
  add constraint pots_class_code_check
  check (class_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$');
