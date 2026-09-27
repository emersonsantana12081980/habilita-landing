begin;
create table public.booking_settings (
 id boolean primary key default true check(id),
 minimum_notice_hours integer not null default 2 check(minimum_notice_hours between 0 and 168),
 cancellation_notice_hours integer not null default 24 check(cancellation_notice_hours between 0 and 720),
 daily_limit integer not null default 2 check(daily_limit between 1 and 12)
);
insert into public.booking_settings(id) values(true);
alter table public.booking_settings enable row level security;
revoke all on public.booking_settings from public,anon,authenticated;
grant select,update on public.booking_settings to authenticated;
create policy read_rules on public.booking_settings for select to authenticated using(true);
create policy manage_rules on public.booking_settings for update to authenticated
 using(habilita_private.is_admin()) with check(habilita_private.is_admin());
create trigger lock_booking_settings before update on public.booking_settings
 for each statement execute function habilita_private.lock_schedule();

alter function public.available_slots(date,text) rename to available_slots_scheduled;
alter function public.available_slots_scheduled(date,text) set schema habilita_private;
create function public.available_slots(p_day date,p_category text)
returns table(id uuid,instructor_id uuid,vehicle_id uuid,starts_at timestamptz,ends_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta'; end if;
 return query select s.* from habilita_private.available_slots_scheduled(p_day,p_category) s
 cross join public.booking_settings r
 where s.starts_at>=now()+make_interval(hours=>r.minimum_notice_hours)
 and (habilita_private.is_admin() or
   (select count(*) from public.lessons l where habilita_private.owns_student(l.student_id)
    and l.status<>'cancelled' and (l.starts_at at time zone 'America/Sao_Paulo')::date=p_day)<r.daily_limit);
end $$;

alter function public.book_lesson(uuid,uuid) rename to book_lesson_scheduled;
alter function public.book_lesson_scheduled(uuid,uuid) set schema habilita_private;
create function public.book_lesson(p_student uuid,p_slot uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare s public.availability_slots; rules public.booking_settings; n integer;
begin
 if not(habilita_private.is_admin() or habilita_private.owns_student(p_student)) then raise exception 'Acesso negado'; end if;
 perform pg_advisory_xact_lock(724426001);
 select * into rules from public.booking_settings where id=true;
 select * into s from public.availability_slots where id=p_slot;
 if not found then raise exception 'Horário indisponível'; end if;
 if s.starts_at < now()+make_interval(hours=>rules.minimum_notice_hours) then
   raise exception 'Agende com pelo menos % horas de antecedência',rules.minimum_notice_hours; end if;
 select count(*) into n from public.lessons where student_id=p_student and status<>'cancelled'
   and (starts_at at time zone 'America/Sao_Paulo')::date=(s.starts_at at time zone 'America/Sao_Paulo')::date;
 if n>=rules.daily_limit then raise exception 'Limite de % aulas por dia atingido',rules.daily_limit; end if;
 return habilita_private.book_lesson_scheduled(p_student,p_slot);
end $$;
create function public.cancel_my_lesson(p_lesson uuid) returns void
language plpgsql security definer set search_path='' as $$
declare l public.lessons; hours integer;
begin
 perform pg_advisory_xact_lock(724426001);
 select * into l from public.lessons where id=p_lesson for update;
 if not found or not habilita_private.owns_student(l.student_id) then raise exception 'Acesso negado'; end if;
 select cancellation_notice_hours into hours from public.booking_settings where id=true;
 if l.status<>'scheduled' then raise exception 'Aula já encerrada ou cancelada'; end if;
 if l.starts_at<=now() or l.starts_at<now()+make_interval(hours=>hours) then
   raise exception 'O prazo para cancelar é de % horas antes da aula. Fale com a equipe.',hours; end if;
 update public.lessons set status='cancelled',status_by=auth.uid(),status_at=now() where id=l.id;
 update public.notifications set read_at=null where lesson_id=l.id;
end $$;
create function public.update_my_profile(p_name text,p_phone text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta'; end if;
 if coalesce(length(trim(p_name)),0) not between 1 and 120 or p_phone is null or p_phone !~ '^\d{10,13}$' then
   raise exception 'Confira nome e WhatsApp com DDD'; end if;
 update public.profiles set name=trim(p_name),phone=p_phone where id=auth.uid();
 update public.students set name=trim(p_name),phone=p_phone where user_id=auth.uid();
end $$;
revoke all on function habilita_private.book_lesson_scheduled(uuid,uuid) from public,anon,authenticated;
revoke all on function habilita_private.available_slots_scheduled(date,text) from public,anon,authenticated;
revoke all on function public.available_slots(date,text) from public,anon,authenticated;
grant execute on function public.available_slots(date,text) to authenticated;
revoke all on function public.book_lesson(uuid,uuid),public.cancel_my_lesson(uuid),public.update_my_profile(text,text) from public,anon,authenticated;
grant execute on function public.book_lesson(uuid,uuid),public.cancel_my_lesson(uuid),public.update_my_profile(text,text) to authenticated;
commit;
