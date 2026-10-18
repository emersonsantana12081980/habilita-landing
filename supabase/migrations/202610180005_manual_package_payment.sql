begin;
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
