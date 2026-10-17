-- Permite ao administrador vincular uma conta existente, sem trocar vínculos.
begin;
create or replace function public.admin_link_instructor(p_instructor uuid, p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare account_id uuid; linked_id uuid;
begin
  if not habilita_private.is_admin() then raise exception 'admin_required'; end if;
  -- Serializa vínculos concorrentes feitos por esta função.
  perform pg_advisory_xact_lock(724426017);
  select id into account_id from auth.users where lower(email) = lower(trim(p_email));
  if account_id is null then raise exception 'account_not_found'; end if;
  select user_id into linked_id from public.instructors where id = p_instructor for update;
  if not found then raise exception 'instructor_not_found'; end if;
  if linked_id is not null and linked_id <> account_id then
    raise exception 'instructor_already_linked'; end if;
  if exists(select 1 from public.instructors where user_id = account_id and id <> p_instructor) then
    raise exception 'account_already_linked'; end if;
  update public.instructors set user_id = account_id where id = p_instructor;
  insert into habilita_private.user_roles(user_id, role) values(account_id, 'instructor')
    on conflict(user_id) do nothing;
end;
$$;
revoke all on function public.admin_link_instructor(uuid,text) from public, anon, authenticated;
grant execute on function public.admin_link_instructor(uuid,text) to authenticated;
commit;
