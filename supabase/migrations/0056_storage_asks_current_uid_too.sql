-- 0056: storage asks current_uid() too.
--
-- 0054 rewrote every policy it could see, and it looked in one schema: the loop
-- read pg_policies where schemaname = 'public'. The six policies on
-- storage.objects (attachments and avatars, from 0011 and 0035) kept
-- auth.uid(), which is sub::uuid and raises 22P02 on a Clerk subject, so under
-- Clerk every upload, every attachment read and every avatar change would have
-- errored while the rest of the app worked. The adversarial review of 0054
-- found it; this rewrites those six by hand, since there are six.
--
-- One clause goes rather than being translated. attachments_storage_delete
-- compared owner_id::uuid to the caller, and the storage API writes the token's
-- subject into owner_id, which for Clerk is not uuid shaped. The policy already
-- proves ownership through the contribution's author, so the cast is dropped.

drop policy if exists attachments_storage_select on storage.objects;
create policy attachments_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and public.is_pot_member(((storage.foldername(name))[1])::uuid)
    and exists (
      select 1 from public.contributions c
      where c.id = ((storage.foldername(objects.name))[2])::uuid
        and c.pot_id = ((storage.foldername(objects.name))[1])::uuid
        and (c.author_id = (select public.current_uid()) or c.status = 'shared')
    )
  );

drop policy if exists attachments_storage_insert on storage.objects;
create policy attachments_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and public.is_pot_member(((storage.foldername(name))[1])::uuid)
    and exists (
      select 1 from public.contributions c
      where c.id = ((storage.foldername(objects.name))[2])::uuid
        and c.author_id = (select public.current_uid())
        and c.pot_id = ((storage.foldername(objects.name))[1])::uuid
        and c.status <> 'shared'
    )
  );

drop policy if exists attachments_storage_delete on storage.objects;
create policy attachments_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'attachments'
    and exists (
      select 1 from public.contributions c
      where c.id = ((storage.foldername(objects.name))[2])::uuid
        and c.author_id = (select public.current_uid())
        and c.status <> 'shared'
    )
  );

drop policy if exists avatars_storage_insert on storage.objects;
create policy avatars_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select public.current_uid())::text
  );

drop policy if exists avatars_storage_update on storage.objects;
create policy avatars_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select public.current_uid())::text
  );

drop policy if exists avatars_storage_delete on storage.objects;
create policy avatars_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select public.current_uid())::text
  );
