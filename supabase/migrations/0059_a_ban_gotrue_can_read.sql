-- 0059: A ban GoTrue can read.
--
-- 0057 banned the accounts that moved to Clerk with banned_until =
-- 'infinity'. Postgres accepts that; GoTrue does not. Its Go driver scans
-- the column into a time and 'infinity' arrives as the string "infinity",
-- so every password sign in for one of those addresses answered 500
-- ("error finding user: sql: Scan error on column banned_until") instead of
-- the refusal the ban was meant to be. The same rows keep the same ban, as
-- a date far enough away to mean the same thing and near enough to parse.

update auth.users
set banned_until = '2999-01-01T00:00:00Z'
where banned_until = 'infinity';
