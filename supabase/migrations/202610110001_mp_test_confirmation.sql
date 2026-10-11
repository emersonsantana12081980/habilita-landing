begin;

-- Confirmações de simulação: nenhuma destas tabelas concede créditos reais.
create table public.mp_test_attempts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.package_requests(id),
  student_id uuid not null references public.students(id),
  external_reference text not null unique,
  collector_id text not null,
  amount_cents integer not null check (amount_cents between 100 and 1000000),
  created_at timestamptz not null default now()
);
create table public.mp_test_payments (
  payment_id text primary key check (payment_id ~ '^[0-9]{1,30}$'),
  attempt_id uuid not null references public.mp_test_attempts(id),
  request_id uuid not null references public.package_requests(id),
  student_id uuid not null references public.students(id),
  amount_cents integer not null check (amount_cents between 100 and 1000000),
  status text not null check (status in ('pending','in_process','authorized','approved','rejected','cancelled','refunded','charged_back','in_mediation')),
  provider_updated_at timestamptz not null,
  confirmed_at timestamptz not null default now()
);
create index mp_test_payments_student on public.mp_test_payments(student_id, confirmed_at desc);
alter table public.mp_test_attempts enable row level security;
alter table public.mp_test_payments enable row level security;
revoke all on public.mp_test_attempts, public.mp_test_payments from anon, authenticated;
grant select on public.mp_test_payments to authenticated;
grant all on public.mp_test_attempts, public.mp_test_payments to service_role;
create policy own_admin_test_payments on public.mp_test_payments for select to authenticated
  using (habilita_private.is_admin() and habilita_private.owns_student(student_id));

-- Snapshot imutável antes de enviar a preferência ao provedor.
create function public.register_mp_test_attempt(p_request uuid, p_reference text, p_collector text, p_amount integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare r public.package_requests; result uuid;
begin
  select * into r from public.package_requests where id=p_request for update;
  if not found or r.status <> 'pending' or r.pricing_demo is distinct from true or r.price_cents <> p_amount then
    raise exception 'Pedido de teste indisponível';
  end if;
  if p_reference is null or p_reference !~ ('^habilita-test-' || p_request::text || '-[0-9a-f-]{36}$')
    or p_collector is null or p_collector !~ '^[0-9]{1,30}$' then raise exception 'Referência inválida'; end if;
  insert into public.mp_test_attempts(request_id,student_id,external_reference,collector_id,amount_cents)
    values(r.id,r.student_id,p_reference,p_collector,p_amount) returning id into result;
  return result;
end;
$$;

-- Somente a função do servidor pode gravar resultados consultados no provedor.
-- Duplicatas são idempotentes; notificações atrasadas não regridem o estado.
create function public.record_mp_test_payment(p_payment text, p_reference text, p_collector text,
  p_request uuid, p_amount integer, p_status text, p_updated timestamptz)
returns text language plpgsql security definer set search_path = '' as $$
declare a public.mp_test_attempts; existing public.mp_test_payments;
begin
  select * into a from public.mp_test_attempts where external_reference=p_reference for update;
  if not found then return 'unknown_attempt'; end if;
  if p_collector is distinct from a.collector_id or p_request is distinct from a.request_id
    or p_amount is distinct from a.amount_cents then return 'mismatch'; end if;
  if p_updated is null or p_payment is null or p_status is null then raise exception 'Pagamento inválido'; end if;
  select * into existing from public.mp_test_payments where payment_id=p_payment;
  if found and existing.attempt_id <> a.id then return 'mismatch'; end if;
  insert into public.mp_test_payments(payment_id,attempt_id,request_id,student_id,amount_cents,status,provider_updated_at)
    values(p_payment,a.id,a.request_id,a.student_id,a.amount_cents,p_status,p_updated)
  on conflict(payment_id) do update set status=excluded.status,
    provider_updated_at=excluded.provider_updated_at, confirmed_at=now()
    where public.mp_test_payments.attempt_id=excluded.attempt_id
      and public.mp_test_payments.provider_updated_at < excluded.provider_updated_at;
  return 'recorded';
end;
$$;
revoke all on function public.register_mp_test_attempt(uuid,text,text,integer),
  public.record_mp_test_payment(text,text,text,uuid,integer,text,timestamptz) from public,anon,authenticated;
grant execute on function public.register_mp_test_attempt(uuid,text,text,integer),
  public.record_mp_test_payment(text,text,text,uuid,integer,text,timestamptz) to service_role;
commit;
