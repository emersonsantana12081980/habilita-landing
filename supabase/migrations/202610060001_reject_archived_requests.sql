begin;
create or replace function public.resolve_package(p_request uuid, p_approve boolean, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.package_requests;
begin
  if not habilita_private.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
  if p_approve is null or coalesce(length(trim(p_reason)),0) = 0 then raise exception 'Informe a decisão e o motivo'; end if;
  select * into r from public.package_requests where id = p_request for update;
  if not found or r.status <> 'pending' then raise exception 'Solicitação já atendida ou inexistente'; end if;
  if p_approve then
    perform 1 from public.students where id = r.student_id and active for update;
    if not found then raise exception 'Aluno inativo'; end if;
  end if;
  update public.package_requests set status = case when p_approve then 'approved' else 'rejected' end,
    reason = trim(p_reason), resolved_at = now(), resolved_by = auth.uid() where id = r.id;
  if p_approve then
    insert into public.credit_grants(request_id, student_id, lessons_a, lessons_b, granted_by, reason)
      values (r.id, r.student_id, r.lessons_a, r.lessons_b, auth.uid(), trim(p_reason));
    update public.students set category = case
      when (category like '%A%' or r.lessons_a > 0) and (category like '%B%' or r.lessons_b > 0) then 'A+B'
      when r.lessons_a > 0 then 'A' else category end where id = r.student_id;
  end if;
end;
$$;
commit;
