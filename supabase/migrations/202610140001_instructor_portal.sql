-- Execute no SQL Editor. Não modifica contas, aulas ou permissões existentes.
begin;
create or replace function public.instructor_portal()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare instructor public.instructors%rowtype; result jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select i.* into instructor from public.instructors i
    join habilita_private.user_roles r on r.user_id = i.user_id
    where i.user_id = auth.uid() and i.active and r.role in ('instructor', 'admin');
  if not found then raise exception 'instructor_access_required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', l.id, 'student_id', l.student_id, 'student_name', s.name,
    'category', l.category, 'starts_at', l.starts_at, 'ends_at', l.ends_at,
    'status', l.status, 'vehicle_name', v.name
  ) order by l.starts_at), '[]'::jsonb) into result
  from public.lessons l join public.students s on s.id = l.student_id
    join public.vehicles v on v.id = l.vehicle_id
    where l.instructor_id = instructor.id;
  return jsonb_build_object('instructor', jsonb_build_object(
    'name', instructor.name, 'category', instructor.category, 'city', instructor.city
  ), 'lessons', result);
end;
$$;
revoke all on function public.instructor_portal() from public, anon, authenticated;
grant execute on function public.instructor_portal() to authenticated;
commit;
