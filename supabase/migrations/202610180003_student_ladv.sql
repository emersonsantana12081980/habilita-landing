begin;
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
create trigger lesson_ladv_prerequisite before insert or update of slot_id,student_id,starts_at,status on public.lessons
  for each row execute function habilita_private.check_ladv_for_lesson();
commit;
