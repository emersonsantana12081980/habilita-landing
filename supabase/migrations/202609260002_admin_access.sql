-- Execute uma vez, depois da migração inicial. Não promove contas automaticamente.
begin;
create or replace function public.my_access_role() returns text
language sql stable security definer set search_path = '' as $$
  select case when auth.uid() is null then 'anonymous'
    else coalesce((select role from habilita_private.user_roles where user_id = auth.uid()), 'student') end;
$$;
revoke all on function public.my_access_role() from public, anon, authenticated;
grant execute on function public.my_access_role() to authenticated;

-- Liberar um horário pelo painel confere os recursos e conflitos no servidor.
create or replace function public.publish_slot(
  p_instructor uuid, p_vehicle uuid, p_category text, p_start timestamptz,
  p_duration integer default 50, p_interval integer default 10
) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid; finish timestamptz;
begin
  if not habilita_private.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
  if p_start is null or p_start <= now() or p_category is null or p_category not in ('A','B')
    or p_duration is null or p_duration not between 15 and 180
    or p_interval is null or p_interval not between 0 and 120 then raise exception 'Confira data, duração e intervalo'; end if;
  perform pg_advisory_xact_lock(724426001);
  perform 1 from public.instructors where id=p_instructor and active and category in (p_category,'A+B') for share;
  if not found then raise exception 'Instrutor incompatível ou inativo'; end if;
  perform 1 from public.vehicles where id=p_vehicle and active and category=p_category for share;
  if not found then raise exception 'Veículo incompatível ou inativo'; end if;
  finish := p_start + make_interval(mins=>p_duration);
  if exists(select 1 from public.availability_slots s where s.active
    and (s.instructor_id=p_instructor or s.vehicle_id=p_vehicle)
    and s.starts_at < finish + make_interval(mins=>p_interval)
    and s.ends_at + make_interval(mins=>s.interval_minutes) > p_start)
    or exists(select 1 from public.lessons l where l.status<>'cancelled'
    and (l.instructor_id=p_instructor or l.vehicle_id=p_vehicle)
    and l.starts_at < finish + make_interval(mins=>p_interval) and l.blocked_until > p_start)
    then raise exception 'Já existe horário ou aula nesse intervalo'; end if;
  insert into public.availability_slots(instructor_id,vehicle_id,category,starts_at,ends_at,interval_minutes)
    values(p_instructor,p_vehicle,p_category,p_start,finish,p_interval) returning id into result;
  return result;
end;
$$;
revoke all on function public.publish_slot(uuid,uuid,text,timestamptz,integer,integer) from public,anon,authenticated;
grant execute on function public.publish_slot(uuid,uuid,text,timestamptz,integer,integer) to authenticated;
commit;
