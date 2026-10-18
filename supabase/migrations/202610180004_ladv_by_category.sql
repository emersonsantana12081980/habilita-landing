begin;
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
