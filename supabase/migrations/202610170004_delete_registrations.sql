-- Exclusão administrativa sem cascata. Históricos vinculados bloqueiam a operação.
begin;
create or replace function public.admin_delete_registration(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
  if not habilita_private.is_admin() then raise exception 'admin_required'; end if;
  if p_kind is null or p_kind not in ('students','instructors','packages') then
    raise exception 'invalid_registration_kind'; end if;
  -- Mesma ordem de trava das operações de agenda.
  perform pg_advisory_xact_lock(724426001);
  begin
    -- Lista fechada acima; identificador escapado. FKs protegem também concorrência.
    execute format('delete from public.%I where id=$1',p_kind) using p_id;
    get diagnostics affected = row_count;
    if affected = 0 then raise exception 'registration_not_found'; end if;
  exception when foreign_key_violation then
    raise exception 'registration_has_history';
  end;
end;
$$;
revoke all on function public.admin_delete_registration(text,uuid) from public,anon,authenticated;
grant execute on function public.admin_delete_registration(text,uuid) to authenticated;
commit;
