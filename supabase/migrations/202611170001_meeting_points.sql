begin;
create table public.meeting_points (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 1 and 100),
 address text not null check(length(trim(address)) between 1 and 300),
 maps_url text not null check(maps_url ~ '^https://(maps\.app\.goo\.gl/|goo\.gl/maps/|maps\.google\.com/|www\.google\.com/maps|google\.com/maps)'),
 instructions text not null default '' check(length(instructions)<=500),
 instructor_id uuid not null references public.instructors(id),
 category text not null check(category in ('A','B','A+B')),
 weekdays integer[] not null default array[1,2,3,4,5] check(cardinality(weekdays)>0 and weekdays <@ array[0,1,2,3,4,5,6]),
 opens time not null default '08:00', closes time not null default '18:00',
 active boolean not null default true, check(closes>opens)
);
alter table public.meeting_points enable row level security;
revoke all on public.meeting_points from public,anon,authenticated;
grant select,insert,update,delete on public.meeting_points to authenticated;
create policy admin_points on public.meeting_points for all to authenticated using(habilita_private.is_admin()) with check(habilita_private.is_admin());
create trigger lock_points before insert or update or delete on public.meeting_points for each statement execute function habilita_private.lock_schedule();
alter table public.lessons add column meeting_point_id uuid references public.meeting_points(id), add column meeting_point jsonb;
alter table public.lesson_changes add column old_meeting_point jsonb, add column new_meeting_point jsonb;

create function public.meeting_point_options(p_slot uuid) returns setof public.meeting_points
language sql stable security definer set search_path='' as $$
 select p.* from public.meeting_points p join public.availability_slots s on s.id=p_slot
 where auth.uid() is not null and p.active and p.instructor_id=s.instructor_id
 and p.category in(s.category,'A+B')
 and extract(dow from s.starts_at at time zone 'America/Sao_Paulo')::integer=any(p.weekdays)
 and (s.starts_at at time zone 'America/Sao_Paulo')::date=(s.ends_at at time zone 'America/Sao_Paulo')::date
 and (s.starts_at at time zone 'America/Sao_Paulo')::time>=p.opens
 and (s.ends_at at time zone 'America/Sao_Paulo')::time<=p.closes order by p.name;
$$;
create function habilita_private.point_snapshot(p_slot uuid,p_point uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.meeting_points;
begin
 select * into p from public.meeting_point_options(p_slot) where id=p_point;
 if not found then raise exception 'Selecione um ponto de encontro disponível para este horário.'; end if;
 return jsonb_build_object('name',p.name,'address',p.address,'maps_url',p.maps_url,'instructions',p.instructions);
end $$;
alter function public.book_lesson(uuid,uuid) rename to book_lesson_before_points;
alter function public.book_lesson_before_points(uuid,uuid) set schema habilita_private;
create function public.book_lesson(p_student uuid,p_slot uuid,p_point uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare snapshot jsonb; result uuid;
begin
 perform pg_advisory_xact_lock(724426001);
 snapshot:=habilita_private.point_snapshot(p_slot,p_point);
 result:=habilita_private.book_lesson_before_points(p_student,p_slot);
 update public.lessons set meeting_point_id=p_point,meeting_point=snapshot where id=result;
 return result;
end $$;
create function public.book_lesson(p_student uuid,p_slot uuid) returns uuid
language plpgsql security definer set search_path='' as $$
begin raise exception 'Atualize a página e selecione o ponto de encontro antes de agendar.'; end $$;

alter function public.reschedule_lesson(uuid,uuid) rename to reschedule_before_points;
alter function public.reschedule_before_points(uuid,uuid) set schema habilita_private;
create function public.reschedule_lesson(p_lesson uuid,p_slot uuid,p_point uuid) returns void
language plpgsql security definer set search_path='' as $$
declare snapshot jsonb; old_point jsonb;
begin
 if not habilita_private.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
 perform pg_advisory_xact_lock(724426001);
 snapshot:=habilita_private.point_snapshot(p_slot,p_point);
 select meeting_point into old_point from public.lessons where id=p_lesson for update;
 perform habilita_private.reschedule_before_points(p_lesson,p_slot);
 update public.lessons set meeting_point_id=p_point,meeting_point=snapshot where id=p_lesson;
 update public.lesson_changes set old_meeting_point=old_point,new_meeting_point=snapshot
 where id=(select id from public.lesson_changes where lesson_id=p_lesson order by created_at desc limit 1);
end $$;
create function public.reschedule_lesson(p_lesson uuid,p_slot uuid) returns void
language plpgsql security definer set search_path='' as $$
begin raise exception 'Atualize a página e selecione o ponto de encontro antes de remarcar.'; end $$;
revoke all on function habilita_private.point_snapshot(uuid,uuid),habilita_private.book_lesson_before_points(uuid,uuid),habilita_private.reschedule_before_points(uuid,uuid) from public,anon,authenticated;
revoke all on function public.meeting_point_options(uuid),public.book_lesson(uuid,uuid,uuid),public.book_lesson(uuid,uuid),public.reschedule_lesson(uuid,uuid,uuid),public.reschedule_lesson(uuid,uuid) from public,anon,authenticated;
grant execute on function public.meeting_point_options(uuid),public.book_lesson(uuid,uuid,uuid),public.book_lesson(uuid,uuid),public.reschedule_lesson(uuid,uuid,uuid),public.reschedule_lesson(uuid,uuid) to authenticated;
-- Preserve the instructor authorization and enrich only lessons already returned.
alter function public.instructor_portal() rename to instructor_portal_before_points;
alter function public.instructor_portal_before_points() set schema habilita_private;
revoke all on function habilita_private.instructor_portal_before_points() from public,anon,authenticated;
create function public.instructor_portal() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb; enriched jsonb;
begin
 result:=habilita_private.instructor_portal_before_points();
 select coalesce(jsonb_agg(entry || jsonb_build_object('meeting_point',l.meeting_point) order by ordinal),'[]'::jsonb)
 into enriched from jsonb_array_elements(result->'lessons') with ordinality as items(entry,ordinal)
 join public.lessons l on l.id=(entry->>'id')::uuid;
 return jsonb_set(result,'{lessons}',enriched);
end $$;
revoke all on function public.instructor_portal() from public,anon,authenticated;
grant execute on function public.instructor_portal() to authenticated;
commit;
