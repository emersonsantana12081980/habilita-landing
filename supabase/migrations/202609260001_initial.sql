-- HABILITA+ | Execute o arquivo inteiro no SQL Editor, como postgres.
-- Migração inicial, uma única vez. Não importa dados locais nem cria logins fictícios.
begin;

create schema if not exists habilita_private;
revoke all on schema habilita_private from public, anon;
grant usage on schema habilita_private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 120),
  phone text not null default '' check (length(phone) <= 30),
  created_at timestamptz not null default now()
);
-- Papéis nunca vêm de user_metadata, nem podem ser alterados pelo aluno.
create table habilita_private.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'instructor'))
);
alter table habilita_private.user_roles enable row level security;
revoke all on habilita_private.user_roles from public, anon, authenticated;

create function habilita_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from habilita_private.user_roles
    where user_id = auth.uid() and role = 'admin');
$$;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 120),
  phone text not null default '' check (length(phone) <= 30),
  category text not null default 'A+B' check (category in ('A','B','A+B')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create function habilita_private.owns_student(student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.students where id = student
    and user_id = auth.uid() and active);
$$;

create table public.instructors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  user_id uuid unique references public.profiles(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 120),
  category text not null check (category in ('A','B','A+B')),
  city text not null default 'Caçapava',
  bio text not null default '',
  photo_url text not null default '',
  active boolean not null default true
);
-- Vínculo privado: não revela o UUID de login no catálogo público.
revoke all on public.instructors from public, anon, authenticated;
create function habilita_private.owns_instructor(instructor uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.instructors i
    join habilita_private.user_roles r on r.user_id = i.user_id
    where i.id = instructor and i.user_id = auth.uid()
      and i.active and r.role = 'instructor');
$$;

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('A','B')),
  active boolean not null default true
);
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (length(trim(name)) > 0),
  category text not null check (category in ('A','B','A+B')),
  lessons_a integer not null default 0 check (lessons_a between 0 and 1000),
  lessons_b integer not null default 0 check (lessons_b between 0 and 1000),
  price_cents integer not null check (price_cents > 0),
  exam_vehicle boolean not null default true,
  free_retest boolean not null default true,
  retest_terms text not null default '',
  card_installments integer not null default 3 check (card_installments between 1 and 12),
  boleto_installments integer not null default 6 check (boleto_installments between 1 and 12),
  active boolean not null default true,
  check ((category = 'A' and lessons_a > 0 and lessons_b = 0)
    or (category = 'B' and lessons_b > 0 and lessons_a = 0)
    or (category = 'A+B' and lessons_a > 0 and lessons_b > 0))
);
create table public.site_settings (
  id boolean primary key default true check (id),
  city text not null default 'Caçapava',
  whatsapp text not null default '5512996225250',
  ai_enabled boolean not null default true
);
create table public.working_hours (
  weekday integer primary key check (weekday between 0 and 6),
  opens time not null default '08:00',
  closes time not null default '18:00',
  duration_minutes integer not null default 50 check (duration_minutes between 15 and 180),
  interval_minutes integer not null default 10 check (interval_minutes between 0 and 120),
  active boolean not null default true,
  check (closes > opens),
  check (extract(epoch from (closes - opens)) / 60 >= duration_minutes)
);
-- Horários concretos liberados pela administração. Sem nomes de alunos.
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.instructors(id),
  vehicle_id uuid not null references public.vehicles(id),
  category text not null check (category in ('A','B')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  interval_minutes integer not null default 10 check (interval_minutes between 0 and 120),
  active boolean not null default true,
  check (ends_at > starts_at),
  check (ends_at <= starts_at + interval '3 hours'),
  unique (instructor_id, vehicle_id, starts_at)
);
create table public.package_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  package_id uuid not null references public.packages(id),
  package_name text not null,
  lessons_a integer not null check (lessons_a >= 0),
  lessons_b integer not null check (lessons_b >= 0),
  price_cents integer not null check (price_cents > 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reason text,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (lessons_a + lessons_b > 0)
);
create unique index one_pending_request on public.package_requests(student_id, package_id) where status = 'pending';
create table public.credit_grants (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.package_requests(id),
  student_id uuid not null references public.students(id),
  lessons_a integer not null check (lessons_a >= 0),
  lessons_b integer not null check (lessons_b >= 0),
  granted_by uuid not null references public.profiles(id),
  reason text not null,
  created_at timestamptz not null default now()
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  slot_id uuid not null references public.availability_slots(id),
  instructor_id uuid not null references public.instructors(id),
  vehicle_id uuid not null references public.vehicles(id),
  category text not null check (category in ('A','B')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  blocked_until timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','missed','cancelled')),
  booked_by uuid not null references public.profiles(id),
  status_by uuid references public.profiles(id),
  status_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and blocked_until >= ends_at)
);
create unique index one_lesson_per_slot on public.lessons(slot_id) where status <> 'cancelled';
create index lessons_student on public.lessons(student_id, category, status);
create index lessons_instructor on public.lessons(instructor_id, starts_at);
create index lessons_vehicle on public.lessons(vehicle_id, starts_at);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons(id),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
-- Faturamento manual: sem integração de cobrança e sem liberar créditos automaticamente.
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  description text not null,
  sale_date date not null,
  status text not null default 'active' check (status in ('active','cancelled')),
  created_at timestamptz not null default now()
);
create table public.installments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id),
  number integer not null check (number between 1 and 12),
  due_date date not null,
  amount_cents integer not null check (amount_cents > 0),
  unique (invoice_id, number)
);
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  installment_id uuid not null references public.installments(id),
  amount_cents integer not null check (amount_cents > 0),
  received_date date not null,
  method text not null check (method in ('pix','cash','credit','debit','boleto','transfer')),
  status text not null default 'received' check (status in ('received','void')),
  created_at timestamptz not null default now()
);

create function habilita_private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare display_name text;
begin
  display_name := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Aluno'), 120);
  insert into public.profiles(id, name, phone) values
    (new.id, display_name, left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 30));
  insert into public.students(user_id, name, phone, category) values
    (new.id, display_name, left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 30),
      case when new.raw_user_meta_data ->> 'category' in ('A','B','A+B')
        then new.raw_user_meta_data ->> 'category' else 'A+B' end);
  return new;
end;
$$;
create trigger habilita_new_user after insert on auth.users
for each row execute function habilita_private.handle_new_user();

-- RLS e grants explícitos, inclusive quando "Automatically expose" está desligado.
do $$ declare t text; begin
  foreach t in array array['profiles','students','instructors','vehicles','packages',
    'site_settings','working_hours','availability_slots','package_requests','credit_grants',
    'lessons','notifications','invoices','installments','receipts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    if t <> 'instructors' then
      execute format('grant select on public.%I to authenticated', t);
    end if;
    execute format('create policy admin_read on public.%I for select to authenticated using (habilita_private.is_admin())', t);
  end loop;
  foreach t in array array['packages','vehicles','instructors','site_settings','working_hours','availability_slots','students'] loop
    execute format('grant insert, update on public.%I to authenticated', t);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check (habilita_private.is_admin())', t);
    execute format('create policy admin_update on public.%I for update to authenticated using (habilita_private.is_admin()) with check (habilita_private.is_admin())', t);
  end loop;
end $$;
grant usage on schema public to anon, authenticated;
grant select on public.packages, public.site_settings to anon;
grant select (id, slug, name, category, city, bio, photo_url, active) on public.instructors to anon, authenticated;
create policy catalog_packages on public.packages for select to anon, authenticated using (active);
create policy catalog_instructors on public.instructors for select to anon, authenticated using (active);
create policy catalog_settings on public.site_settings for select to anon, authenticated using (true);
create policy own_profile on public.profiles for select to authenticated using (id = auth.uid());
create policy own_student on public.students for select to authenticated using (user_id = auth.uid());
create policy own_requests on public.package_requests for select to authenticated using (habilita_private.owns_student(student_id));
create policy own_credits on public.credit_grants for select to authenticated using (habilita_private.owns_student(student_id));
create policy own_lessons on public.lessons for select to authenticated
  using (habilita_private.owns_student(student_id) or habilita_private.owns_instructor(instructor_id));
create policy instructor_students on public.students for select to authenticated using (
  exists(select 1 from public.lessons l where l.student_id = students.id
    and habilita_private.owns_instructor(l.instructor_id)));
create policy own_invoices on public.invoices for select to authenticated using (habilita_private.owns_student(student_id));
create policy own_installments on public.installments for select to authenticated using (
  exists(select 1 from public.invoices i where i.id = installments.invoice_id));
create policy own_receipts on public.receipts for select to authenticated using (
  exists(select 1 from public.installments i where i.id = receipts.installment_id));
grant update (name, phone) on public.profiles to authenticated;
create policy edit_profile on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
grant update (read_at) on public.notifications to authenticated;
create policy read_notification on public.notifications for update to authenticated
  using (habilita_private.is_admin()) with check (habilita_private.is_admin());
-- Nenhum grant de escrita direta para créditos, pedidos, aulas ou faturamento.

create function public.request_package(p_package uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare s uuid; p public.packages; result uuid;
begin
  select id into s from public.students where user_id = auth.uid() and active;
  if s is null then raise exception 'Cadastro de aluno ativo necessário'; end if;
  select * into p from public.packages where id = p_package and active;
  if not found then raise exception 'Pacote indisponível'; end if;
  insert into public.package_requests(student_id, package_id, package_name, lessons_a, lessons_b, price_cents)
    values (s, p.id, p.name, p.lessons_a, p.lessons_b, p.price_cents) returning id into result;
  return result;
end;
$$;
create function public.resolve_package(p_request uuid, p_approve boolean, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.package_requests;
begin
  if not habilita_private.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
  if p_approve is null or coalesce(length(trim(p_reason)),0) = 0 then raise exception 'Informe a decisão e o motivo'; end if;
  select * into r from public.package_requests where id = p_request for update;
  if not found or r.status <> 'pending' then raise exception 'Solicitação já atendida ou inexistente'; end if;
  perform 1 from public.students where id = r.student_id and active for update;
  if not found then raise exception 'Aluno inativo'; end if;
  update public.package_requests set status = case when p_approve then 'approved' else 'rejected' end,
    reason = trim(p_reason), resolved_at = now(), resolved_by = auth.uid() where id = r.id;
  if p_approve then
    insert into public.credit_grants(request_id, student_id, lessons_a, lessons_b, granted_by, reason)
      values (r.id, r.student_id, r.lessons_a, r.lessons_b, auth.uid(), trim(p_reason));
    update public.students set category = case
      when (category like '%A%' or r.lessons_a > 0) and (category like '%B%' or r.lessons_b > 0) then 'A+B'
      when r.lessons_a > 0 then 'A' else category end where id = r.student_id;
  end if;
end;
$$;

-- Retorna apenas horários livres, sem identificar quem ocupa os demais.
create function public.available_slots(p_day date, p_category text) returns table (
  id uuid, instructor_id uuid, vehicle_id uuid, starts_at timestamptz, ends_at timestamptz
) language sql stable security definer set search_path = '' as $$
  select s.id, s.instructor_id, s.vehicle_id, s.starts_at, s.ends_at
  from public.availability_slots s
  join public.instructors i on i.id = s.instructor_id and i.active
  join public.vehicles v on v.id = s.vehicle_id and v.active and v.category = s.category
  where auth.uid() is not null and s.active and s.category = p_category
    and (i.category = s.category or i.category = 'A+B')
    and (s.starts_at at time zone 'America/Sao_Paulo')::date = p_day
    and s.starts_at > now()
    and not exists(select 1 from public.lessons l where l.status <> 'cancelled'
      and (l.instructor_id = s.instructor_id or l.vehicle_id = s.vehicle_id
        or habilita_private.owns_student(l.student_id))
      and l.starts_at < s.ends_at + make_interval(mins => s.interval_minutes)
      and l.blocked_until > s.starts_at)
  order by s.starts_at;
$$;

create function public.book_lesson(p_student uuid, p_slot uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare s public.availability_slots; c public.students; total bigint; used bigint; result uuid;
begin
  if not (habilita_private.is_admin() or habilita_private.owns_student(p_student)) then
    raise exception 'Acesso negado'; end if;
  -- Todas as reservas passam por esta trava; não há INSERT direto na API.
  perform pg_advisory_xact_lock(724426001);
  select * into c from public.students where id = p_student and active for update;
  if not found then raise exception 'Aluno inativo'; end if;
  select * into s from public.availability_slots where id = p_slot and active for update;
  if not found or s.starts_at <= now() then raise exception 'Horário indisponível'; end if;
  if position(s.category in c.category) = 0 then raise exception 'Categoria incompatível'; end if;
  perform 1 from public.instructors where id = s.instructor_id and active
    and (category = s.category or category = 'A+B') for share;
  if not found then raise exception 'Instrutor indisponível'; end if;
  perform 1 from public.vehicles where id = s.vehicle_id and active and category = s.category for share;
  if not found then raise exception 'Veículo indisponível'; end if;
  select coalesce(sum(case when s.category = 'A' then lessons_a else lessons_b end),0)
    into total from public.credit_grants where student_id = c.id;
  select count(*) into used from public.lessons where student_id = c.id and category = s.category and status <> 'cancelled';
  if total <= used then raise exception 'Créditos insuficientes'; end if;
  if exists(select 1 from public.lessons l where l.status <> 'cancelled'
      and (l.student_id = c.id or l.instructor_id = s.instructor_id or l.vehicle_id = s.vehicle_id)
      and l.starts_at < s.ends_at + make_interval(mins => s.interval_minutes)
      and l.blocked_until > s.starts_at) then raise exception 'Horário já ocupado'; end if;
  insert into public.lessons(student_id, slot_id, instructor_id, vehicle_id, category, starts_at, ends_at, blocked_until, booked_by)
    values(c.id, s.id, s.instructor_id, s.vehicle_id, s.category, s.starts_at, s.ends_at,
      s.ends_at + make_interval(mins => s.interval_minutes), auth.uid()) returning id into result;
  insert into public.notifications(lesson_id) values(result);
  return result;
end;
$$;
create function public.set_lesson_status(p_lesson uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare l public.lessons;
begin
  perform pg_advisory_xact_lock(724426001);
  select * into l from public.lessons where id = p_lesson for update;
  if not found then raise exception 'Aula inexistente'; end if;
  if not (habilita_private.is_admin() or habilita_private.owns_instructor(l.instructor_id)) then raise exception 'Acesso negado'; end if;
  if p_status is null or p_status not in ('completed','missed','cancelled') or l.status <> 'scheduled' then
    raise exception 'Transição inválida'; end if;
  if p_status <> 'cancelled' and l.ends_at > now() then raise exception 'Aula ainda não terminou'; end if;
  update public.lessons set status = p_status, status_by = auth.uid(), status_at = now() where id = l.id;
end;
$$;

revoke all on all functions in schema habilita_private from public, anon, authenticated;
grant execute on function habilita_private.is_admin(), habilita_private.owns_student(uuid), habilita_private.owns_instructor(uuid) to authenticated;
revoke all on function public.request_package(uuid), public.resolve_package(uuid,boolean,text),
  public.available_slots(date,text), public.book_lesson(uuid,uuid), public.set_lesson_status(uuid,text) from public, anon, authenticated;
grant execute on function public.request_package(uuid), public.resolve_package(uuid,boolean,text),
  public.available_slots(date,text), public.book_lesson(uuid,uuid), public.set_lesson_status(uuid,text) to authenticated;

insert into public.site_settings(id) values (true);
insert into public.working_hours(weekday) select generate_series(1,5);
insert into public.vehicles(slug,name,category) values ('carro-mobi','Fiat Mobi','B'), ('moto-treino','Moto de instrução','A');
insert into public.packages(slug,name,category,lessons_a,lessons_b,price_cents) values
  ('pacote-carro-exemplo','Pacote Carro','B',0,2,29900),
  ('pacote-moto-exemplo','Pacote Moto','A',2,0,16990),
  ('pacote-carro-moto-exemplo','Pacote Carro e Moto','A+B',2,2,39999);
insert into public.instructors(slug,name,category,city,bio,photo_url) values
  ('emerson-santana','Emerson Santana','A+B','Caçapava',
   'Há 15 anos, atuo como instrutor de trânsito e diretor-geral de CFC, contribuindo para a formação de mais de 5 mil alunos. Minha missão é ajudar você a dirigir com segurança, confiança e autonomia, com orientação clara, paciência e respeito ao seu ritmo de aprendizagem.',
   '/9f9ca8a1-0a11-4449-9b8b-b09d88bcb6d0.png');

commit;
