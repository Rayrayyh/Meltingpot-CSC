-- 0060: Sign up belongs to Clerk now.
--
-- 0057 narrowed public.sign_up_student to addresses on the test domain,
-- which stopped it minting accounts under any address but left the door
-- itself open: anyone could still create @meltingpot.dev accounts from the
-- anon key, and an account is a foothold. A holder of one gets an
-- authenticated Postgres session, and with it the ability to create Pots and
-- to guess at six character class codes, which is the only thing standing
-- between a stranger and a class's notes. Per user rate limits do not help
-- against someone who can make more users.
--
-- Clerk has owned sign up on the live site since 2026-09-08, so nothing real
-- calls this from a browser any more. Only service_role may now, which is
-- what dev_seed already uses.
--
-- The cost lands on the Playwright suite, which signed its accounts up
-- through the form because it had no other way: there is no service role key
-- in the developer environment, and a browser cannot hold a secret. So the
-- suite stops creating accounts and starts using two that the seed provides,
-- both deliberately in no Pot, which is the state those specs actually need:
-- one to see the empty dashboard and create a Pot, one to join a Pot with a
-- code as a stranger would.

revoke execute on function public.sign_up_student(text, text, text) from public, anon, authenticated;

-- The two fixtures. Created only if absent, so re-running is harmless and a
-- suite that dirtied them (the joiner is in a Pot now) is repaired by
-- dev_seed, which drops BIO101 and takes its memberships with it.
do $$
begin
  perform set_config('app.bypass_rate_limit', 'on', true);
  if not exists (select 1 from auth.users where email = 'newcomer@meltingpot.dev') then
    perform public.register_student('newcomer@meltingpot.dev', 'MeltingPot-dev1', 'Sam Rivera');
  end if;
  if not exists (select 1 from auth.users where email = 'joiner@meltingpot.dev') then
    perform public.register_student('joiner@meltingpot.dev', 'MeltingPot-dev1', 'Nina Cole');
  end if;
end $$;

-- Every account the old suite left behind, one per run since August. They
-- were only ever reachable through the door this migration closes.
delete from public.pots where owner_id in (
  select id from auth.users where email like 'e2e.%@meltingpot.dev'
);
delete from auth.users where email like 'e2e.%@meltingpot.dev';
