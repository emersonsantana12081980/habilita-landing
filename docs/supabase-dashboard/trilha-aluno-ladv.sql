begin;
alter table public.students add column if not exists onboarding_steps jsonb not null default '{}',
 add column if not exists ladv_documents jsonb not null default '{}';
create table if not exists public.student_journey_declarations (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id),
 declared_by uuid not null references public.profiles(id), step text not null,
 declared_at timestamptz not null default now(), unique(student_id,step));
alter table public.student_journey_declarations enable row level security;
revoke all on public.student_journey_declarations from public,anon,authenticated;
grant select on public.student_journey_declarations to authenticated;
drop policy if exists read_journey_declarations on public.student_journey_declarations;
create policy read_journey_declarations on public.student_journey_declarations for select to authenticated
 using(habilita_private.is_admin() or habilita_private.owns_student(student_id));

create or replace function habilita_private.onboarding_ready(steps jsonb) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(steps ?& array['initial_application','theory_course','registration','medical','theory_exam'],false);
$$;
revoke all on function habilita_private.onboarding_ready(jsonb) from public;
grant execute on function habilita_private.onboarding_ready(jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('student-ladv','student-ladv',false,5242880,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create or replace function habilita_private.can_access_ladv_file(object_name text,uploading boolean)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.students s where s.id::text=split_part(object_name,'/',1)
 and array_length(string_to_array(object_name,'/'),1)=3
 and split_part(object_name,'/',2) in ('A','B')
 and split_part(object_name,'/',3) ~ '^[0-9a-f-]{36}\.(pdf|jpg|png)$'
 and ((not uploading and habilita_private.is_admin()) or (habilita_private.owns_student(s.id)
   and (not uploading or (s.active and s.deleted_at is null and habilita_private.onboarding_ready(s.onboarding_steps)
   and (s.category='A+B' or s.category=split_part(object_name,'/',2)))))));
$$;
revoke all on function habilita_private.can_access_ladv_file(text,boolean) from public;
grant execute on function habilita_private.can_access_ladv_file(text,boolean) to authenticated;
drop policy if exists ladv_file_read on storage.objects;
create policy ladv_file_read on storage.objects for select to authenticated
 using(bucket_id='student-ladv' and habilita_private.can_access_ladv_file(name,false));
drop policy if exists ladv_file_upload on storage.objects;
create policy ladv_file_upload on storage.objects for insert to authenticated
 with check(bucket_id='student-ladv' and habilita_private.can_access_ladv_file(name,true));
-- Arquivos privados e imutáveis pelo navegador; sem update/delete.

create or replace function public.complete_student_onboarding_step(p_student uuid,p_step text,p_truth boolean)
returns void language plpgsql security definer set search_path='' as $$
declare s public.students; ordered text[]:=array['initial_application','theory_course','registration','medical','theory_exam','practice','practical_exam','toxicology']; step_index integer; i integer; cat text;
begin
 if not habilita_private.owns_student(p_student) then raise exception 'Somente o aluno pode declarar suas etapas'; end if;
 if p_truth is distinct from true then raise exception 'Confirme a declaração de veracidade'; end if;
 step_index:=array_position(ordered,p_step);
 if step_index is null then raise exception 'Etapa inválida'; end if;
 perform pg_advisory_xact_lock(724426001);
 select * into s from public.students where id=p_student and active and deleted_at is null for update;
 if not found then raise exception 'Cadastro indisponível'; end if;
 for i in 1..step_index-1 loop
   if not (s.onboarding_steps ? ordered[i]) then raise exception 'Declare a conclusão da etapa anterior'; end if;
 end loop;
 if step_index>=6 then
   foreach cat in array case when s.category='A+B' then array['A','B'] else array[s.category] end loop
     if nullif(s.ladv_documents->cat->>'path','') is null then raise exception 'Envie a LADV de cada categoria antes de continuar'; end if;
   end loop;
 end if;
 if s.onboarding_steps ? p_step then return; end if;
 insert into public.student_journey_declarations(student_id,declared_by,step) values(s.id,auth.uid(),p_step);
 update public.students set onboarding_steps=jsonb_set(onboarding_steps,array[p_step],to_jsonb(now()),true),
 journey_steps=case when p_step in ('registration','theory_course','medical','theory_exam')
 then jsonb_set(journey_steps,array[p_step],'"completed"'::jsonb,true) else journey_steps end where id=s.id;
end;
$$;

create or replace function public.submit_student_ladv(p_student uuid,p_category text,p_path text,p_truth boolean)
returns void language plpgsql security definer set search_path='' as $$
declare s public.students;
begin
 if not habilita_private.owns_student(p_student) then raise exception 'Somente o aluno pode enviar sua LADV'; end if;
 if p_truth is distinct from true then raise exception 'Confirme a declaração de veracidade'; end if;
 perform pg_advisory_xact_lock(724426001);
 select * into s from public.students where id=p_student and active and deleted_at is null for update;
 if not found then raise exception 'Cadastro indisponível'; end if;
 if not habilita_private.onboarding_ready(s.onboarding_steps) then raise exception 'Conclua as declarações anteriores antes de enviar a LADV'; end if;
 if p_category is null or p_category not in ('A','B') or (s.category<>'A+B' and s.category<>p_category) then raise exception 'Categoria inválida'; end if;
 if p_path is null or split_part(p_path,'/',1)<>s.id::text or split_part(p_path,'/',2)<>p_category
 or not habilita_private.can_access_ladv_file(p_path,true) then raise exception 'Arquivo não pertence ao aluno e à categoria'; end if;
 perform 1 from storage.objects where bucket_id='student-ladv' and name=p_path;
 if not found then raise exception 'O arquivo da LADV ainda não foi enviado'; end if;
 update public.students set ladv_documents=jsonb_set(ladv_documents,array[p_category],jsonb_build_object('path',p_path,'uploaded_at',now()),true),
 ladv_confirmations=jsonb_set(ladv_confirmations,array[p_category],to_jsonb(now()),true) where id=s.id;
 insert into public.student_ladv_declarations(student_id,declared_by,category,has_ladv,truth_accepted,declaration_version)
 values(s.id,auth.uid(),p_category,true,true,'ladv-v3-file');
end;
$$;
revoke all on function public.complete_student_onboarding_step(uuid,text,boolean),public.submit_student_ladv(uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.complete_student_onboarding_step(uuid,text,boolean),public.submit_student_ladv(uuid,text,text,boolean) to authenticated;

-- O bloqueio também vale para chamadas diretas e agendamentos pelo administrador.
create or replace function habilita_private.check_ladv_for_lesson() returns trigger
language plpgsql security definer set search_path='' as $$
declare s public.students; document_path text; cat text;
begin
 if new.status<>'scheduled' then return new; end if;
 perform pg_advisory_xact_lock(724426001);
 select * into s from public.students where id=new.student_id for update;
 if not found or not s.active or s.deleted_at is not null then raise exception 'Cadastro inativo'; end if;
 if new.category is null or new.category not in ('A','B') or (s.category<>'A+B' and s.category<>new.category) then raise exception 'Categoria inválida'; end if;
 if not s.licensed_driver then
   foreach cat in array case when s.category='A+B' then array['A','B'] else array[s.category] end loop
   document_path:=s.ladv_documents->cat->>'path';
   if not habilita_private.onboarding_ready(s.onboarding_steps) or nullif(s.ladv_confirmations->>cat,'') is null
     or document_path is null then raise exception 'Conclua a trilha e envie a LADV da categoria antes de agendar'; end if;
   perform 1 from storage.objects where bucket_id='student-ladv' and name=document_path;
   if not found then raise exception 'Documento LADV indisponível'; end if;
   end loop;
 end if;
 return new;
end;
$$;
revoke all on function habilita_private.check_ladv_for_lesson() from public,anon,authenticated;
create or replace function public.set_student_exam_date(p_student uuid,p_category text,p_date date)
returns void language plpgsql security definer set search_path='' as $$
declare s public.students;
begin
 if not (habilita_private.is_admin() or habilita_private.owns_student(p_student)) then raise exception 'Acesso negado'; end if;
 perform pg_advisory_xact_lock(724426001);
 select * into s from public.students where id=p_student and active and deleted_at is null for update;
 if not found then raise exception 'Cadastro indisponível'; end if;
 if p_category is null or p_category not in ('A','B') or (s.category<>'A+B' and s.category<>p_category) then raise exception 'Categoria inválida'; end if;
 if p_date is not null then
   if not s.licensed_driver and not (s.onboarding_steps ? 'practice') then raise exception 'Declare a conclusão da prática antes de informar o exame'; end if;
   if p_date<(now() at time zone 'America/Sao_Paulo')::date then raise exception 'Informe uma data a partir de hoje'; end if;
 end if;
 update public.students set practical_exam_dates=case when p_date is null then practical_exam_dates-p_category
 else jsonb_set(practical_exam_dates,array[p_category],to_jsonb(p_date::text),true) end where id=s.id;
end;
$$;
commit;
