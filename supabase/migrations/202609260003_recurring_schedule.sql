-- Agenda semanal permanente. Executar depois das migrações 001 e 002.
begin;
create table public.schedule_rules (
 id uuid primary key default gen_random_uuid(),
 instructor_id uuid not null references public.instructors(id),
 vehicle_id uuid not null references public.vehicles(id),
 category text not null check(category in ('A','B')),
 weekdays integer[] not null check(cardinality(weekdays)>0 and weekdays <@ array[0,1,2,3,4,5,6]),
 opens time not null, closes time not null,
 lunch_start time, lunch_end time,
 duration integer not null check(duration between 15 and 180),
 gap integer not null check(gap between 0 and 120),
 horizon integer not null default 30 check(horizon between 1 and 90),
 active boolean not null default true,
 check(closes>opens),
 check(extract(epoch from (closes-opens))/60>=duration),
 check((lunch_start is null and lunch_end is null) or
 (lunch_start is not null and lunch_end is not null and lunch_start>=opens and lunch_end<=closes and lunch_end>lunch_start)),
 unique(instructor_id,vehicle_id)
);
create table public.schedule_exceptions (
 day date primary key,
 reason text not null check(length(trim(reason))>0)
);
alter table public.schedule_rules enable row level security;
alter table public.schedule_exceptions enable row level security;
revoke all on public.schedule_rules,public.schedule_exceptions from public,anon,authenticated;
grant select,insert,update,delete on public.schedule_rules,public.schedule_exceptions to authenticated;
create policy admin_schedule on public.schedule_rules for all to authenticated
 using(habilita_private.is_admin()) with check(habilita_private.is_admin());
create policy admin_exceptions on public.schedule_exceptions for all to authenticated
 using(habilita_private.is_admin()) with check(habilita_private.is_admin());
alter table public.availability_slots add column rule_id uuid references public.schedule_rules(id) on delete restrict;
alter table public.availability_slots add column manually_blocked boolean not null default false;

-- Mesma trava das reservas: alterações de regras não correm junto com uma reserva.
create function habilita_private.lock_schedule() returns trigger language plpgsql
set search_path='' as $$ begin perform pg_advisory_xact_lock(724426001); return null; end $$;
create trigger lock_rules before insert or update or delete on public.schedule_rules
 for each statement execute function habilita_private.lock_schedule();
create trigger lock_exceptions before insert or update or delete on public.schedule_exceptions
 for each statement execute function habilita_private.lock_schedule();

-- Materializa só o dia consultado. A janela avança sem cron e sem abrir o admin.
create function habilita_private.ensure_day(p_day date) returns void
language plpgsql security definer set search_path='' as $$
declare r public.schedule_rules; starts timestamp; finish timestamp; t timestamptz;
begin
 perform pg_advisory_xact_lock(724426001);
 if p_day is null then return; end if;
 update public.availability_slots set active=false where rule_id is not null
   and (starts_at at time zone 'America/Sao_Paulo')::date=p_day;
 if p_day < (now() at time zone 'America/Sao_Paulo')::date
   or p_day > (now() at time zone 'America/Sao_Paulo')::date+90
   or exists(select 1 from public.schedule_exceptions where day=p_day) then return; end if;
 for r in select sr.* from public.schedule_rules sr
   join public.instructors i on i.id=sr.instructor_id and i.active and i.category in (sr.category,'A+B')
   join public.vehicles v on v.id=sr.vehicle_id and v.active and v.category=sr.category
   where sr.active and extract(dow from p_day)::integer=any(sr.weekdays)
     and p_day <= (now() at time zone 'America/Sao_Paulo')::date+sr.horizon loop
   starts := p_day+r.opens;
   while starts+make_interval(mins=>r.duration)<=p_day+r.closes loop
     finish:=starts+make_interval(mins=>r.duration);
     if r.lunch_start is not null and starts<p_day+r.lunch_end
       and finish+make_interval(mins=>r.gap)>p_day+r.lunch_start then
       starts:=p_day+r.lunch_end;
       continue;
     end if;
     t:=starts at time zone 'America/Sao_Paulo';
     if t>now() then
       insert into public.availability_slots(instructor_id,vehicle_id,category,starts_at,ends_at,interval_minutes,rule_id)
       values(r.instructor_id,r.vehicle_id,r.category,t,finish at time zone 'America/Sao_Paulo',r.gap,r.id)
       on conflict(instructor_id,vehicle_id,starts_at) do update
       set active=not public.availability_slots.manually_blocked,
         ends_at=excluded.ends_at,interval_minutes=excluded.interval_minutes,category=excluded.category
       where public.availability_slots.rule_id=r.id;
     end if;
     starts:=starts+make_interval(mins=>r.duration+r.gap);
   end loop;
 end loop;
end $$;

create or replace function public.available_slots(p_day date,p_category text)
returns table(id uuid,instructor_id uuid,vehicle_id uuid,starts_at timestamptz,ends_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta'; end if;
 perform habilita_private.ensure_day(p_day);
 return query select s.id,s.instructor_id,s.vehicle_id,s.starts_at,s.ends_at
 from public.availability_slots s
 join public.instructors i on i.id=s.instructor_id and i.active and i.category in(s.category,'A+B')
 join public.vehicles v on v.id=s.vehicle_id and v.active and v.category=s.category
 where s.active and not s.manually_blocked and s.category=p_category and s.starts_at>now()
 and (s.starts_at at time zone 'America/Sao_Paulo')::date=p_day
 and not exists(select 1 from public.schedule_exceptions where day=p_day)
 and not exists(select 1 from public.lessons l where l.status<>'cancelled'
   and (l.instructor_id=s.instructor_id or l.vehicle_id=s.vehicle_id or habilita_private.owns_student(l.student_id))
   and l.starts_at<s.ends_at+make_interval(mins=>s.interval_minutes) and l.blocked_until>s.starts_at)
 order by s.starts_at;
end $$;

-- Revalida a configuração antes de usar a operação transacional já testada.
alter function public.book_lesson(uuid,uuid) set schema habilita_private;
create function public.book_lesson(p_student uuid,p_slot uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare d date;
begin
 if not(habilita_private.is_admin() or habilita_private.owns_student(p_student)) then raise exception 'Acesso negado'; end if;
 perform pg_advisory_xact_lock(724426001);
 select (starts_at at time zone 'America/Sao_Paulo')::date into d from public.availability_slots where id=p_slot;
 perform habilita_private.ensure_day(d);
 if exists(select 1 from public.schedule_exceptions where day=d)
   or not exists(select 1 from public.availability_slots where id=p_slot and active and not manually_blocked)
   then raise exception 'Este horário não está mais disponível. Escolha outro.'; end if;
 return habilita_private.book_lesson(p_student,p_slot);
end $$;
revoke all on function habilita_private.ensure_day(date),habilita_private.lock_schedule(),habilita_private.book_lesson(uuid,uuid) from public,anon,authenticated;
revoke all on function public.available_slots(date,text),public.book_lesson(uuid,uuid) from public,anon,authenticated;
grant execute on function public.available_slots(date,text),public.book_lesson(uuid,uuid) to authenticated;
commit;
