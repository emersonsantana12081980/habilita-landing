-- Executar uma vez. Mantém os pedidos e créditos existentes.
begin;
alter table public.package_requests add column review_started_at timestamptz;
create function public.start_package_review(p_request uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not habilita_private.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
  update public.package_requests set review_started_at=coalesce(review_started_at,now())
    where id=p_request and status='pending';
  if not found then raise exception 'Pedido finalizado ou inexistente'; end if;
end;
$$;
revoke all on function public.start_package_review(uuid) from public,anon,authenticated;
grant execute on function public.start_package_review(uuid) to authenticated;
commit;
