begin;
alter table public.package_requests
 add column if not exists payment_confirmed_at timestamptz,
 add column if not exists payment_confirmed_by uuid references public.profiles(id),
 add column if not exists payment_confirmed_cents integer check(payment_confirmed_cents > 0);

-- Confirmação manual do valor integral do pedido e liberação em uma transação.
-- A quantidade vem do pedido original; nunca do navegador ou catálogo atual.
create or replace function public.confirm_manual_package_payment(p_request uuid, p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.package_requests;
begin
 if not habilita_private.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
 if coalesce(length(trim(p_reason)),0)=0 or length(p_reason)>500 then raise exception 'Informe a conferência do pagamento (até 500 caracteres)'; end if;
 select * into r from public.package_requests where id=p_request for update;
 if not found then raise exception 'Pedido inexistente'; end if;
 if r.payment_confirmed_at is not null then return; end if;
 if r.status='rejected' then raise exception 'Pedido recusado não pode receber confirmação'; end if;
 if r.status='pending' then
   perform public.resolve_package(r.id,true,trim(p_reason));
 else
   -- Pedidos anteriormente liberados não recebem novos créditos.
   perform 1 from public.credit_grants where request_id=r.id and student_id=r.student_id
     and lessons_a=r.lessons_a and lessons_b=r.lessons_b;
   if not found then raise exception 'Créditos do pedido divergentes. Confira o histórico antes de confirmar.'; end if;
 end if;
 update public.package_requests set payment_confirmed_at=now(),payment_confirmed_by=auth.uid(),
   payment_confirmed_cents=r.price_cents, reason=trim(p_reason) where id=r.id;
end;
$$;
revoke all on function public.confirm_manual_package_payment(uuid,text) from public,anon,authenticated;
grant execute on function public.confirm_manual_package_payment(uuid,text) to authenticated;
commit;
