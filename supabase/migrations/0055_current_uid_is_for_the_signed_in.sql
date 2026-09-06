-- 0055: current_uid() is for the signed in.
--
-- 0054 granted execute on public.current_uid() to anon as well as
-- authenticated, on the thought that a policy might evaluate it under anon.
-- None does: every policy is `to authenticated`, anon holds no table grant that
-- would reach one, and the definer functions anon may call run as their owner,
-- whose privileges are what a nested call checks. The second lock (0015) says
-- a role holds only what it uses, and anon has no use for this; it would only
-- ever get null back. The security advisor flagged it, and it is right.

revoke execute on function public.current_uid() from anon;
