-- 0058: The hourly job knocks on the domain.
--
-- 0052 scheduled the classwork sync against the netlify.app address, the
-- only one the site had. Since 2026-09-08 the site is served at
-- meltingpots.xyz and the proxy sends every other request on the alias to
-- the domain, exempting this one door until the job itself moved. This is
-- the move. cron.schedule by name is an upsert, so the job keeps its name,
-- its minute and its bearer, and only the address changes.

select cron.schedule(
  'classwork-sync-due',
  '17 * * * *',
  $$
  select net.http_post(
    url := 'https://meltingpots.xyz/api/classwork/sync-due',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || (
        select s.decrypted_secret from vault.decrypted_secrets s where s.name = 'classwork_sync_trigger'
      )
    ),
    timeout_milliseconds := 25000
  );
  $$
);
