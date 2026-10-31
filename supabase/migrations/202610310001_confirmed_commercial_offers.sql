begin;
alter table public.packages
 add column if not exists retest_coverage text,
 add column if not exists retest_validity text,
 add column if not exists retest_uses integer,
 add column if not exists retest_costs text;

-- Uma oferta antiga não comprova as novas informações de reteste.
update public.packages set offer_confirmed=false where offer_confirmed and free_retest
 and not coalesce(length(trim(retest_coverage))>0 and length(trim(retest_validity))>0
 and retest_uses between 1 and 100 and length(trim(retest_costs))>0,false);
alter table public.packages drop constraint if exists packages_confirmed_retest_valid;
alter table public.packages add constraint packages_confirmed_retest_valid check (
 not offer_confirmed or not free_retest or coalesce(
 length(trim(retest_coverage))>0 and length(trim(retest_validity))>0
 and retest_uses between 1 and 100 and length(trim(retest_costs))>0,false));

drop policy if exists catalog_packages on public.packages;
create policy catalog_packages on public.packages for select to anon,authenticated
 using(active and offer_confirmed and not pricing_demo and deleted_at is null);

-- Preserva preço/cupom no cálculo original, acrescentando a confirmação da oferta.
do $$ begin
 if to_regprocedure('habilita_private.quote_package(uuid,text,text)') is null then
   alter function public.quote_package(uuid,text,text) set schema habilita_private;
 end if;
end $$;
revoke all on function habilita_private.quote_package(uuid,text,text) from public,anon,authenticated;
create or replace function public.quote_package(p_package uuid,p_coupon text,p_method text)
returns table(original_cents integer,discount_cents integer,total_cents integer,installment_count integer,coupon_code text,pricing_demo boolean)
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.packages where id=p_package and active and offer_confirmed and not pricing_demo and deleted_at is null for share;
 if not found then raise exception 'Oferta aguardando confirmação de preços e condições. Consulte a equipe pelo WhatsApp.'; end if;
 return query select * from habilita_private.quote_package(p_package,p_coupon,p_method);
end;
$$;
revoke all on function public.quote_package(uuid,text,text) from public,anon,authenticated;
grant execute on function public.quote_package(uuid,text,text) to authenticated;

create or replace function habilita_private.require_confirmed_package() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.packages where id=new.package_id and active and offer_confirmed and not pricing_demo and deleted_at is null for share;
 if not found then raise exception 'Oferta indisponível: confirme preços e condições no catálogo.'; end if;
 return new;
end;
$$;
revoke all on function habilita_private.require_confirmed_package() from public,anon,authenticated;
drop trigger if exists package_request_confirmed_offer on public.package_requests;
create trigger package_request_confirmed_offer before insert on public.package_requests
 for each row execute function habilita_private.require_confirmed_package();
commit;
