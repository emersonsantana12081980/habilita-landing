-- Fotos públicas do catálogo; somente administradores podem enviar.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('instructor-photos','instructor-photos',true,5242880,
  array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,
  file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists instructor_photo_upload on storage.objects;
create policy instructor_photo_upload on storage.objects for insert to authenticated
with check(bucket_id='instructor-photos' and habilita_private.is_admin()
  and name ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$');
-- URLs públicas permitem mostrar a foto na página comercial.
-- Arquivos têm nomes novos: sem sobrescrita nem exclusão pelo navegador.
commit;
