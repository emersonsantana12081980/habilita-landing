begin;
alter table public.students add column if not exists deleted_at timestamptz;
alter table public.packages add column if not exists deleted_at timestamptz;
alter table public.package_requests add column if not exists board_archived_at timestamptz;
alter table public.students add constraint deleted_student_inactive check (deleted_at is null or not active);
alter table public.packages add constraint deleted_package_inactive check (deleted_at is null or not active);

-- Exclusão lógica: remove o cadastro das listas sem destruir saldo e documentos.
create or replace function public.admin_delete_registration(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
  if not habilita_private.is_admin() then raise exception 'admin_required'; end if;
  if p_kind is null or p_kind not in ('students','instructors','packages') then
    raise exception 'invalid_registration_kind'; end if;
  perform pg_advisory_xact_lock(724426001);
  if p_kind = 'students' then
    update public.students set active=false, deleted_at=coalesce(deleted_at,now()) where id=p_id;
    get diagnostics affected = row_count;
    if affected=0 then raise exception 'registration_not_found'; end if;
    update public.lessons set status='cancelled',status_by=auth.uid(),status_at=now()
      where student_id=p_id and status='scheduled' and starts_at>=now();
    update public.package_requests set status='rejected',reason='Cadastro do aluno excluído pela administração',resolved_by=auth.uid(),resolved_at=now()
      where student_id=p_id and status='pending';
    update public.package_requests set board_archived_at=coalesce(board_archived_at,now()) where student_id=p_id;
  elsif p_kind = 'packages' then
    update public.packages set active=false,deleted_at=coalesce(deleted_at,now()) where id=p_id;
    get diagnostics affected = row_count;
    if affected=0 then raise exception 'registration_not_found'; end if;
    -- Pedidos existentes possuem snapshot e continuam válidos; bloqueia novas vendas.
  else
    begin
      delete from public.instructors where id=p_id;
      get diagnostics affected = row_count;
      if affected=0 then raise exception 'registration_not_found'; end if;
    exception when foreign_key_violation then raise exception 'registration_has_history'; end;
  end if;
end;
$$;
revoke all on function public.admin_delete_registration(text,uuid) from public,anon,authenticated;
grant execute on function public.admin_delete_registration(text,uuid) to authenticated;

create or replace function public.admin_archive_finished_request(p_request uuid)
returns void language plpgsql security definer set search_path='' as $$
declare item public.package_requests;
begin
  if not habilita_private.is_admin() then raise exception 'admin_required'; end if;
  select * into item from public.package_requests where id=p_request for update;
  if not found then raise exception 'request_not_found'; end if;
  if item.status not in ('approved','rejected') then raise exception 'request_not_finished'; end if;
  update public.package_requests set board_archived_at=coalesce(board_archived_at,now()) where id=p_request;
end;
$$;
revoke all on function public.admin_archive_finished_request(uuid) from public,anon,authenticated;
grant execute on function public.admin_archive_finished_request(uuid) to authenticated;
commit;
