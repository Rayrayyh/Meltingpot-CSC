-- generate_class_code() has always drawn its six characters from a 31 character
-- alphabet that leaves out 0, 1, I, L and O, because a class code gets read off
-- a whiteboard and typed by hand. The column check was the full [A-Z0-9]{6}, so
-- the rule the generator keeps was never actually enforced: a code set by hand
-- could still carry a look alike. This makes the column say what the generator
-- already does.
--
-- One row predates the rule: the seeded demo Pot BIO101, which dev_seed()
-- deletes and reinserts by that literal and which three end to end specs
-- navigate to by name. Tightening without an exception would refuse that insert
-- on the next reseed, and rewriting dev_seed's 18KB body to change one literal
-- is the shape of mistake memory/lessons/011 records. So the check names that
-- one fixture and refuses every other look alike. Retiring the exception means
-- moving the fixture, its three specs and the seeded row together, which is a
-- product visible change to the demo code and the owner's call.

alter table public.pots drop constraint if exists pots_class_code_check;

alter table public.pots
  add constraint pots_class_code_check
  check (
    class_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$'
    or class_code = 'BIO101'
  );
