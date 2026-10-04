begin;
create table public.lesson_changes (
 id uuid primary key default gen_random_uuid(),
 lesson_id uuid not null references public.lessons(id),
 old_slot_id uuid not null references public.availability_slots(id),
 new_slot_id uuid not null references public.availability_slots(id),
 old_start timestamptz not null,
 new_start timestamptz not null,
 changed_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now()
);
alter table public.lesson_changes enable row level security;
revoke all on public.lesson_changes from public,anon,authenticated;
grant select on public.lesson_changes to authenticated;
create policy read_changes on public.lesson_changes for select to authenticated
 using(habilita_private.is_admin() or exists(select 1 from public.lessons l where l.id=lesson_id and habilita_private.owns_student(l.student_id)));

create function public.reschedule_options(p_lesson uuid,p_day date)
returns table(id uuid,instructor_id uuid,vehicle_id uuid,starts_at timestamptz,ends_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare original public.lessons;
begin
 if not habilita_private.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
 select * into original from public.lessons where lessons.id=p_lesson;
 if not found or original.status<>'scheduled' then raise exception 'Aula não pode ser alterada'; end if;
 perform habilita_private.ensure_day(p_day);
 return query select s.id,s.instructor_id,s.vehicle_id,s.starts_at,s.ends_at
 from public.availability_slots s
 join public.instructors i on i.id=s.instructor_id and i.active and i.category in(s.category,'A+B')
 join public.vehicles v on v.id=s.vehicle_id and v.active and v.category=s.category
 cross join public.booking_settings rules
 where s.active and not s.manually_blocked and s.category=original.category and s.id<>original.slot_id
 and s.starts_at>now() and s.starts_at>=now()+make_interval(hours=>rules.minimum_notice_hours)
 and (s.starts_at at time zone 'America/Sao_Paulo')::date=p_day
 and not exists(select 1 from public.schedule_exceptions where day=p_day)
 and (select count(*) from public.lessons l where l.student_id=original.student_id and l.id<>original.id
   and l.status<>'cancelled' and (l.starts_at at time zone 'America/Sao_Paulo')::date=p_day)<rules.daily_limit
 and not exists(select 1 from public.lessons l where l.id<>original.id and l.status<>'cancelled'
   and (l.student_id=original.student_id or l.instructor_id=s.instructor_id or l.vehicle_id=s.vehicle_id)
   and l.starts_at<s.ends_at+make_interval(mins=>s.interval_minutes) and l.blocked_until>s.starts_at)
 order by s.starts_at;
end $$;

create function public.reschedule_lesson(p_lesson uuid,p_slot uuid) returns void
language plpgsql security definer set search_path='' as $$
declare original public.lessons; target public.availability_slots; d date;
begin
 if not habilita_private.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
 perform pg_advisory_xact_lock(724426001);
 select * into original from public.lessons where id=p_lesson for update;
 if not found or original.status<>'scheduled' then raise exception 'Somente aulas agendadas podem ser alteradas'; end if;
 perform 1 from public.students where id=original.student_id and active for update;
 if not found then raise exception 'Aluno inativo'; end if;
 select (starts_at at time zone 'America/Sao_Paulo')::date into d from public.availability_slots where id=p_slot;
 if not exists(select 1 from public.reschedule_options(p_lesson,d) where id=p_slot) then
   raise exception 'Horário indisponível. Atualize a seleção; a aula original foi mantida.'; end if;
 select * into target from public.availability_slots where id=p_slot and active for update;
 if not found then raise exception 'Horário indisponível'; end if;
 perform 1 from public.instructors where id=target.instructor_id and active and category in(target.category,'A+B') for share;
 if not found then raise exception 'Instrutor indisponível'; end if;
 perform 1 from public.vehicles where id=target.vehicle_id and active and category=target.category for share;
 if not found then raise exception 'Veículo indisponível'; end if;
 insert into public.lesson_changes(lesson_id,old_slot_id,new_slot_id,old_start,new_start,changed_by)
 values(original.id,original.slot_id,target.id,original.starts_at,target.starts_at,auth.uid());
 update public.lessons set slot_id=target.id,instructor_id=target.instructor_id,vehicle_id=target.vehicle_id,
 starts_at=target.starts_at,ends_at=target.ends_at,blocked_until=target.ends_at+make_interval(mins=>target.interval_minutes),
 status_by=auth.uid(),status_at=now() where id=original.id;
 update public.notifications set read_at=null where lesson_id=original.id;
end $$;
revoke all on function public.reschedule_options(uuid,date),public.reschedule_lesson(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reschedule_options(uuid,date),public.reschedule_lesson(uuid,uuid) to authenticated;
commit;
