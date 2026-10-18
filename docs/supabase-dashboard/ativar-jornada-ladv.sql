-- Executar inteiro no SQL Editor. Pode ser repetido sem apagar dados.
begin;
alter table public.students
  add column if not exists journey_steps jsonb not null default '{}'::jsonb,
  add column if not exists licensed_driver boolean not null default false,
  add column if not exists practical_exam_dates jsonb not null default '{}'::jsonb;

create or replace function public.update_student_journey(p_student uuid,p_steps jsonb,p_licensed boolean)
returns void language plpgsql security definer set search_path='' as $$
declare entry record;
begin
  if not (habilita_private.is_admin() or habilita_private.owns_student(p_student)) then raise exception 'Acesso negado'; end if;
  perform pg_advisory_xact_lock(724426001);
  if p_steps is null or jsonb_typeof(p_steps)<>'object' or p_licensed is null then raise exception 'Etapas inválidas'; end if;
  for entry in select * from jsonb_each_text(p_steps) loop
    if entry.key not in ('registration','medical','theory_course','theory_exam') or entry.value is null or entry.value not in ('pending','in_progress','completed') then raise exception 'Etapa inválida'; end if;
  end loop;
  update public.students set journey_steps=p_steps,licensed_driver=p_licensed where id=p_student and active and deleted_at is null;
  if not found then raise exception 'Cadastro inativo ou indisponível'; end if;
end;
$$;

create or replace function public.set_student_exam_date(p_student uuid,p_category text,p_date date)
returns void language plpgsql security definer set search_path='' as $$
declare student public.students; completed integer;
begin
  if not (habilita_private.is_admin() or habilita_private.owns_student(p_student)) then raise exception 'Acesso negado'; end if;
  perform pg_advisory_xact_lock(724426001);
  select * into student from public.students where id=p_student and active and deleted_at is null for update;
  if not found then raise exception 'Cadastro indisponível'; end if;
  if p_category is null or p_category not in ('A','B') or (student.category<>'A+B' and student.category<>p_category) then raise exception 'Categoria inválida'; end if;
  if p_date is not null then
    select count(*) into completed from public.lessons where student_id=p_student and category=p_category and status='completed';
    if completed<2 then raise exception 'Conclua pelo menos 2 aulas nesta categoria antes de informar o exame'; end if;
    if p_date < (now() at time zone 'America/Sao_Paulo')::date then raise exception 'Informe uma data de exame a partir de hoje'; end if;
  end if;
  update public.students set practical_exam_dates=case when p_date is null then practical_exam_dates-p_category
    else jsonb_set(practical_exam_dates,array[p_category],to_jsonb(p_date::text),true) end where id=p_student;
end;
$$;

-- Preserva todas as regras de saldo, concorrência, prazo e limite diário existentes.
do $$ begin
if to_regprocedure('habilita_private.book_lesson_before_journey(uuid,uuid)') is null then
 alter function public.book_lesson(uuid,uuid) rename to book_lesson_before_journey;
 alter function public.book_lesson_before_journey(uuid,uuid) set schema habilita_private;
end if;
end $$;
revoke all on function habilita_private.book_lesson_before_journey(uuid,uuid) from public,anon,authenticated;
create or replace function public.book_lesson(p_student uuid,p_slot uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare student public.students;
begin
  if not (habilita_private.is_admin() or habilita_private.owns_student(p_student)) then raise exception 'Acesso negado'; end if;
  perform pg_advisory_xact_lock(724426001);
  select * into student from public.students where id=p_student for update;
  if not found or not student.active or student.deleted_at is not null then raise exception 'Cadastro inativo'; end if;
  if not student.licensed_driver and not (student.journey_steps @> '{"registration":"completed","medical":"completed","theory_course":"completed","theory_exam":"completed"}'::jsonb) then
    raise exception 'Complete as etapas anteriores às aulas práticas em Minha jornada CNH';
  end if;
  return habilita_private.book_lesson_before_journey(p_student,p_slot);
end;
$$;
revoke all on function public.update_student_journey(uuid,jsonb,boolean),public.set_student_exam_date(uuid,text,date),public.book_lesson(uuid,uuid) from public,anon,authenticated;
grant execute on function public.update_student_journey(uuid,jsonb,boolean),public.set_student_exam_date(uuid,text,date),public.book_lesson(uuid,uuid) to authenticated;

-- Também cobre remarcação e inserções administrativas diretas.
create or replace function habilita_private.check_journey_for_lesson() returns trigger
language plpgsql security definer set search_path='' as $$
declare student public.students;
begin
  if new.status<>'scheduled' then return new; end if;
  perform pg_advisory_xact_lock(724426001);
  select * into student from public.students where id=new.student_id for update;
  if not found or not student.active or student.deleted_at is not null then raise exception 'Cadastro inativo'; end if;
  if not student.licensed_driver and not (student.journey_steps @> '{"registration":"completed","medical":"completed","theory_course":"completed","theory_exam":"completed"}'::jsonb) then
    raise exception 'Complete as etapas anteriores às aulas práticas em Minha jornada CNH';
  end if;
  return new;
end;
$$;
revoke all on function habilita_private.check_journey_for_lesson() from public,anon,authenticated;
drop trigger if exists lesson_journey_prerequisites on public.lessons;
create trigger lesson_journey_prerequisites before insert or update of slot_id,student_id,starts_at,status on public.lessons
  for each row execute function habilita_private.check_journey_for_lesson();

alter table public.students add column if not exists ladv_confirmed_at timestamptz;
create table if not exists public.student_ladv_declarations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  declared_by uuid not null references auth.users(id),
  has_ladv boolean not null,
  truth_accepted boolean not null,
  declaration_version text not null default 'ladv-v1',
  declared_at timestamptz not null default now()
);
alter table public.student_ladv_declarations enable row level security;
revoke all on public.student_ladv_declarations from public,anon,authenticated;
grant select on public.student_ladv_declarations to authenticated;
drop policy if exists read_ladv_declarations on public.student_ladv_declarations;
create policy read_ladv_declarations on public.student_ladv_declarations for select to authenticated
  using (habilita_private.is_admin() or habilita_private.owns_student(student_id));

create or replace function public.declare_student_ladv(p_student uuid,p_has_ladv boolean,p_truth boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not habilita_private.owns_student(p_student) then raise exception 'Somente o aluno pode fazer sua declaração'; end if;
  if p_has_ladv is null or p_truth is null or p_has_ladv<>p_truth then raise exception 'Confirme a LADV e a declaração de veracidade'; end if;
  perform pg_advisory_xact_lock(724426001);
  update public.students set ladv_confirmed_at=case when p_has_ladv and p_truth then now() else null end
    where id=p_student and active and deleted_at is null;
  if not found then raise exception 'Cadastro inativo ou indisponível'; end if;
  insert into public.student_ladv_declarations(student_id,declared_by,has_ladv,truth_accepted)
    values(p_student,auth.uid(),p_has_ladv,p_truth);
end;
$$;
revoke all on function public.declare_student_ladv(uuid,boolean,boolean) from public,anon,authenticated;
grant execute on function public.declare_student_ladv(uuid,boolean,boolean) to authenticated;

-- Complementa os pré-requisitos existentes em agendamentos e remarcações.
create or replace function habilita_private.check_ladv_for_lesson() returns trigger
language plpgsql security definer set search_path='' as $$
declare student public.students;
begin
  if new.status<>'scheduled' then return new; end if;
  perform pg_advisory_xact_lock(724426001);
  select * into student from public.students where id=new.student_id for update;
  if not found or not student.active or student.deleted_at is not null then raise exception 'Cadastro inativo'; end if;
  if not student.licensed_driver and student.ladv_confirmed_at is null then
    raise exception 'Confirme sua LADV e a declaração de veracidade em Minha jornada CNH antes de agendar';
  end if;
  return new;
end;
$$;
revoke all on function habilita_private.check_ladv_for_lesson() from public,anon,authenticated;
drop trigger if exists lesson_ladv_prerequisite on public.lessons;
create trigger lesson_ladv_prerequisite before insert or update of slot_id,student_id,starts_at,status on public.lessons
  for each row execute function habilita_private.check_ladv_for_lesson();

alter table public.students add column if not exists ladv_confirmations jsonb not null default '{}';
alter table public.student_ladv_declarations add column if not exists category text check (category in ('A','B'));
-- A declaração antiga não identifica a categoria: o aluno deve confirmar novamente.
drop function if exists public.declare_student_ladv(uuid,boolean,boolean);
create or replace function public.declare_student_ladv(p_student uuid,p_category text,p_has_ladv boolean,p_truth boolean)
returns void language plpgsql security definer set search_path='' as $$
declare student public.students;
begin
  if not habilita_private.owns_student(p_student) then raise exception 'Somente o aluno pode fazer sua declaração'; end if;
  if p_category is null or p_category not in ('A','B') then raise exception 'Categoria inválida'; end if;
  if p_has_ladv is null or p_truth is null or p_has_ladv<>p_truth then raise exception 'Confirme a LADV e a declaração de veracidade'; end if;
  perform pg_advisory_xact_lock(724426001);
  select * into student from public.students where id=p_student for update;
  if not found or not student.active or student.deleted_at is not null then raise exception 'Cadastro inativo'; end if;
  if student.category is null or (student.category<>'A+B' and student.category<>p_category) then raise exception 'Categoria não pertence ao cadastro'; end if;
  update public.students set ladv_confirmations=case when p_has_ladv then
    jsonb_set(ladv_confirmations,array[p_category],to_jsonb(now()),true)
    else ladv_confirmations-p_category end where id=p_student;
  insert into public.student_ladv_declarations(student_id,declared_by,category,has_ladv,truth_accepted,declaration_version)
    values(p_student,auth.uid(),p_category,p_has_ladv,p_truth,'ladv-v2-category');
end;
$$;
revoke all on function public.declare_student_ladv(uuid,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.declare_student_ladv(uuid,text,boolean,boolean) to authenticated;

create or replace function habilita_private.check_ladv_for_lesson() returns trigger
language plpgsql security definer set search_path='' as $$
declare student public.students;
begin
  if new.status<>'scheduled' then return new; end if;
  perform pg_advisory_xact_lock(724426001);
  select * into student from public.students where id=new.student_id for update;
  if not found or not student.active or student.deleted_at is not null then raise exception 'Cadastro inativo'; end if;
  if new.category is null or new.category not in ('A','B') or student.category is null
    or (student.category<>'A+B' and student.category<>new.category) then raise exception 'Categoria inválida para este aluno'; end if;
  if not student.licensed_driver and nullif(student.ladv_confirmations->>new.category,'') is null then
    raise exception 'Confirme a LADV e a declaração de veracidade da categoria % em Minha jornada CNH',new.category;
  end if;
  return new;
end;
$$;
revoke all on function habilita_private.check_ladv_for_lesson() from public,anon,authenticated;
drop trigger if exists lesson_ladv_prerequisite on public.lessons;
create trigger lesson_ladv_prerequisite before insert or update of category,slot_id,student_id,starts_at,status on public.lessons
  for each row execute function habilita_private.check_ladv_for_lesson();
commit;
