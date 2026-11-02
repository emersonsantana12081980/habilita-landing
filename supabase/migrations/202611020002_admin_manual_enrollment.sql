begin;
alter table public.package_requests alter column package_id drop not null;
alter table public.package_requests
 add column if not exists admin_created_by uuid references public.profiles(id),
 add column if not exists admin_entry jsonb;

create or replace function public.admin_add_student_classes(
 p_operation uuid,p_student uuid,p_package uuid,p_name text,p_lessons_a integer,p_lessons_b integer,
 p_total integer,p_method text,p_installments integer,p_paid boolean,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare pack public.packages; existing public.package_requests; entry jsonb;
 title text; qty_a integer; qty_b integer; info jsonb;
begin
 if not habilita_private.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
 if p_operation is null or p_student is null then raise exception 'Aluno e identificador obrigatórios'; end if;
 entry:=jsonb_build_object('student',p_student,'package',p_package,'name',p_name,'a',p_lessons_a,'b',p_lessons_b,
   'total',p_total,'method',p_method,'installments',p_installments,'paid',p_paid,'reason',p_reason);
 perform 1 from public.students where id=p_student and active and deleted_at is null for update;
 if not found then raise exception 'Selecione um aluno ativo'; end if;
 select * into existing from public.package_requests where id=p_operation;
 if found then
   if existing.admin_created_by=auth.uid() and existing.admin_entry=entry then return existing.id; end if;
   raise exception 'Lançamento já utilizado. Atualize a ficha e confira o histórico.';
 end if;
 if p_paid is null or p_total is null or p_total<1 or p_total>100000000 then raise exception 'Informe o valor total e a situação do pagamento'; end if;
 if p_method is null or p_method not in ('cash','card') or p_installments is null or p_installments not between 1 and 12
   or (p_method='cash' and p_installments<>1) then raise exception 'Forma de pagamento ou parcelas inválidas'; end if;
 if coalesce(length(trim(p_reason)),0)=0 or length(p_reason)>500 then raise exception 'Informe o motivo (até 500 caracteres)'; end if;
 if p_package is not null then
   select * into pack from public.packages where id=p_package and active and deleted_at is null for share;
   if not found then raise exception 'Pacote indisponível'; end if;
   title:=pack.name; qty_a:=pack.lessons_a; qty_b:=pack.lessons_b;
 else
   title:=trim(p_name);qty_a:=p_lessons_a;qty_b:=p_lessons_b;
   if coalesce(length(title),0)=0 or length(title)>150 then raise exception 'Informe a descrição das aulas'; end if;
 end if;
 if qty_a is null or qty_b is null or qty_a not between 0 and 1000 or qty_b not between 0 and 1000 or qty_a+qty_b<1 then raise exception 'Informe pelo menos uma aula de carro ou moto'; end if;
 select commercial_info into info from public.site_settings where id=true;
 insert into public.package_requests(id,student_id,package_id,package_name,lessons_a,lessons_b,price_cents,
   original_price_cents,payment_method,installment_count,pricing_demo,review_started_at,reason,admin_created_by,admin_entry,pix_payment)
 values(p_operation,p_student,p_package,title,qty_a,qty_b,p_total,p_total,p_method,p_installments,false,now(),trim(p_reason),auth.uid(),entry,
   case when p_method='cash' and nullif(trim(info->>'pixCode'),'') is not null then
   jsonb_build_object('code',info->>'pixCode','receiver',info->>'pixReceiver','bank',info->>'pixBank') else null end);
 if p_paid then perform public.confirm_manual_package_payment(p_operation,trim(p_reason)); end if;
 return p_operation;
end;
$$;
revoke all on function public.admin_add_student_classes(uuid,uuid,uuid,text,integer,integer,integer,text,integer,boolean,text) from public,anon,authenticated;
grant execute on function public.admin_add_student_classes(uuid,uuid,uuid,text,integer,integer,integer,text,integer,boolean,text) to authenticated;
commit;
