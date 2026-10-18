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

alter table public.package_requests add column if not exists pix_payment jsonb;
create or replace function public.request_manual_package(
 p_package uuid,p_coupon text,p_method text,p_expected_total integer,p_expected_installments integer,p_installments integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; info jsonb;
begin
 if p_method is null or p_method not in ('cash','card') then raise exception 'Forma de pagamento inválida'; end if;
 if p_installments is null or p_installments<1 or p_installments>12
   or p_expected_installments is null or p_installments>p_expected_installments
   or (p_method='cash' and p_installments<>1) then raise exception 'Quantidade de parcelas inválida'; end if;
 if p_method='cash' then
   select commercial_info into info from public.site_settings where id=true for share;
   if nullif(trim(info->>'pixCode'),'') is null or nullif(trim(info->>'pixReceiver'),'') is null then
     raise exception 'Pix ainda não configurado. Fale com a equipe ou escolha cartão';
   end if;
 end if;
 -- Revalida preço/cupom/limite de parcelas no servidor e serializa pedidos do aluno.
 result:=public.request_package_offer(p_package,p_coupon,p_method,p_expected_total,p_expected_installments);
 update public.package_requests set installment_count=p_installments,review_started_at=now(),
   pix_payment=case when p_method='cash' then jsonb_build_object(
     'code',info->>'pixCode','receiver',info->>'pixReceiver','bank',info->>'pixBank') else null end
   where id=result;
 return result;
end;
$$;
revoke all on function public.request_manual_package(uuid,text,text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.request_manual_package(uuid,text,text,integer,integer,integer) to authenticated;
commit;
