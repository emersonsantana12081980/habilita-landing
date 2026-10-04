-- Execute inteiro uma vez, após as migrações anteriores. Não ativa pagamentos.
begin;
alter table public.packages
 add column card_total_cents integer check(card_total_cents > 0),
 add column pricing_demo boolean not null default true;
-- Valores de exemplo; o preço à vista cadastrado é preservado.
update public.packages set card_installments=12,
 card_total_cents=least(2147483640,round(price_cents::numeric * 1.2 / 12)*12)::integer;

create table public.coupons (
 id uuid primary key default gen_random_uuid(),
 code text not null unique check(code=upper(trim(code)) and code ~ '^[A-Z0-9_-]{3,30}$'),
 kind text not null check(kind in ('percent','fixed')),
 amount integer not null check(amount > 0),
 package_id uuid references public.packages(id),
 expires_at timestamptz,
 active boolean not null default true,
 demo_only boolean not null default true,
 created_at timestamptz not null default now(),
 check(kind<>'percent' or amount<=99)
);
alter table public.coupons enable row level security;
revoke all on public.coupons from public,anon,authenticated;
grant select,insert,update on public.coupons to authenticated;
create policy manage_coupons on public.coupons for all to authenticated
 using(habilita_private.is_admin()) with check(habilita_private.is_admin());

alter table public.package_requests
 add column coupon_id uuid references public.coupons(id),
 add column coupon_code text,
 add column discount_cents integer not null default 0 check(discount_cents>=0),
 add column original_price_cents integer check(original_price_cents>0),
 add column payment_method text not null default 'cash' check(payment_method in ('cash','card')),
 add column installment_count integer not null default 1 check(installment_count between 1 and 12),
 add column pricing_demo boolean not null default false;

create function public.quote_package(p_package uuid,p_coupon text,p_method text)
returns table(original_cents integer,discount_cents integer,total_cents integer,installment_count integer,coupon_code text,pricing_demo boolean)
language plpgsql security definer set search_path='' as $$
declare p public.packages; c public.coupons; amount_off integer:=0; base integer;
 input_code text:=upper(trim(coalesce(p_coupon,'')));
begin
 if not exists(select 1 from public.students where user_id=auth.uid() and active) then
   raise exception 'Cadastro de aluno ativo necessário'; end if;
 if p_method is null or p_method not in ('cash','card') then raise exception 'Forma de pagamento inválida'; end if;
 select * into p from public.packages where id=p_package and active for share;
 if not found then raise exception 'Pacote indisponível'; end if;
 base:=case when p_method='card' then p.card_total_cents else p.price_cents end;
 if base is null then raise exception 'Valor parcelado ainda não configurado'; end if;
 if input_code<>'' then
   select * into c from public.coupons where coupons.code=input_code for share;
   if not found or not c.active or (c.expires_at is not null and c.expires_at<=now())
     or (c.package_id is not null and c.package_id<>p.id) or (c.demo_only and not p.pricing_demo)
   then raise exception 'Cupom inválido, expirado ou não aplicável a este pacote'; end if;
   amount_off:=case when c.kind='percent' then round(base::numeric*c.amount/100)::integer else c.amount end;
   if amount_off>=base then raise exception 'O desconto deve ser menor que o valor do pacote'; end if;
 end if;
 return query select base,amount_off,base-amount_off,
   case when p_method='card' then p.card_installments else 1 end,nullif(input_code,''),p.pricing_demo;
end $$;

create function public.request_package_offer(p_package uuid,p_coupon text,p_method text,p_expected_total integer,p_expected_installments integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare s uuid; p public.packages; q record; result uuid; coupon uuid;
begin
 select id into s from public.students where user_id=auth.uid() and active for update;
 if s is null then raise exception 'Cadastro de aluno ativo necessário'; end if;
 select * into q from public.quote_package(p_package,p_coupon,p_method);
 -- O total enviado só confirma a simulação; nunca é a fonte do preço.
 if p_expected_total is distinct from q.total_cents or p_expected_installments is distinct from q.installment_count then raise exception 'O valor ou parcelamento mudou. Confira o desconto novamente antes de solicitar.'; end if;
 select * into p from public.packages where id=p_package;
 if q.coupon_code is not null then select id into coupon from public.coupons where code=q.coupon_code; end if;
 if exists(select 1 from public.package_requests where student_id=s and package_id=p.id and status='pending') then
   raise exception 'Você já tem uma solicitação pendente deste pacote'; end if;
 insert into public.package_requests(student_id,package_id,package_name,lessons_a,lessons_b,price_cents,
   original_price_cents,discount_cents,coupon_id,coupon_code,payment_method,installment_count,pricing_demo)
 values(s,p.id,p.name,p.lessons_a,p.lessons_b,q.total_cents,q.original_cents,q.discount_cents,
   coupon,q.coupon_code,p_method,q.installment_count,q.pricing_demo) returning id into result;
 return result;
end $$;
revoke all on function public.quote_package(uuid,text,text),public.request_package_offer(uuid,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.quote_package(uuid,text,text),public.request_package_offer(uuid,text,text,integer,integer) to authenticated;
insert into public.coupons(code,kind,amount,demo_only) values('HABILITA10','percent',10,true);
commit;
