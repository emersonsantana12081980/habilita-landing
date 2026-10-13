-- Comprovantes privados para conferência manual. Não aprova pedidos nem libera créditos.
begin;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('package-receipts', 'package-receipts', false, 5242880,
  array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function habilita_private.can_access_package_receipt(object_name text, uploading boolean)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.package_requests r
    where r.id::text = split_part(object_name, '/', 1)
      and array_length(string_to_array(object_name, '/'), 1) = 2
      and split_part(object_name, '/', 2) ~ '^[0-9a-f-]{36}\.(jpg|png|pdf)$'
      and (
        (not uploading and habilita_private.is_admin())
        or (habilita_private.owns_student(r.student_id)
          and (not uploading or (r.status = 'pending' and r.payment_method = 'cash')))
      )
  );
$$;
revoke all on function habilita_private.can_access_package_receipt(text, boolean) from public;
grant execute on function habilita_private.can_access_package_receipt(text, boolean) to authenticated;
drop policy if exists package_receipt_read on storage.objects;
create policy package_receipt_read on storage.objects for select to authenticated
using (bucket_id = 'package-receipts' and habilita_private.can_access_package_receipt(name, false));
drop policy if exists package_receipt_upload on storage.objects;
create policy package_receipt_upload on storage.objects for insert to authenticated
with check (bucket_id = 'package-receipts' and habilita_private.can_access_package_receipt(name, true));
-- Sem permissão de sobrescrever ou apagar comprovantes pelo navegador.
commit;
