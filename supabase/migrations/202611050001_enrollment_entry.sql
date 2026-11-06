-- Entrada opcional, ativada individualmente pelo administrador. Não concede aulas.
begin;
create table public.enrollment_entries (
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null unique references public.students(id) on delete cascade,
 amount_cents integer not null default 2990 check(amount_cents=2990),
 status text not null default 'pending' check(status in ('pending','confirmed','cancelled')),
 pix_payment jsonb not null,
 activated_at timestamptz not null default now(),
 activated_by uuid not null references public.profiles(id),
 confirmed_at timestamptz,
 confirmed_by uuid references public.profiles(id),
 confirmation_note text,
 cancelled_at timestamptz,
 cancelled_by uuid references public.profiles(id),
 applied_request_id uuid unique references public.package_requests(id) on delete set null,
 applied_at timestamptz,
 applied_by uuid references public.profiles(id),
 check ((status='confirmed')=(confirmed_at is not null)),
 check (applied_request_id is null or status='confirmed')
);
alter table public.enrollment_entries enable row level security;
revoke all on public.enrollment_entries from public,anon,authenticated;
grant select on public.enrollment_entries to authenticated;
create policy entry_read on public.enrollment_entries for select to authenticated
 using(habilita_private.is_admin() or habilita_private.owns_student(student_id));
alter table public.package_requests add column entry_discount_cents integer not null default 0
 check(entry_discount_cents in (0,2990));

create function public.admin_set_enrollment_entry(p_student uuid,p_enabled boolean)
returns void language plpgsql security definer set search_path='' as $$
declare e public.enrollment_entries; info jsonb;
begin
 if not habilita_private.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
 if p_enabled is null then raise exception 'Informe a ativação'; end if;
 perform 1 from public.students where id=p_student and active and not deletion_pending for update;
 if not found then raise exception 'Aluno ativo necessário'; end if;
 select * into e from public.enrollment_entries where student_id=p_student for update;
 if e.status='confirmed' then raise exception 'Entrada já confirmada; não é possível cobrar novamente'; end if;
 if p_enabled then
   if e.status='pending' then return; end if;
   select commercial_info into info from public.site_settings where id=true;
   if nullif(trim(info->>'pixCode'),'') is null or nullif(trim(info->>'pixReceiver'),'') is null then
     raise exception 'Configure o Pix e o recebedor no admin antes de ativar a entrada'; end if;
   insert into public.enrollment_entries(student_id,pix_payment,activated_by)
   values(p_student,jsonb_build_object('code',info->>'pixCode','receiver',info->>'pixReceiver','bank',info->>'pixBank'),auth.uid())
   on conflict(student_id) do update set status='pending',pix_payment=excluded.pix_payment,
     activated_at=now(),activated_by=auth.uid(),cancelled_at=null,cancelled_by=null;
 else
   update public.enrollment_entries set status='cancelled',cancelled_at=now(),cancelled_by=auth.uid()
   where student_id=p_student and status='pending';
 end if;
end $$;

create function public.admin_confirm_enrollment_entry(p_student uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare e public.enrollment_entries;
begin
 if not habilita_private.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
 if coalesce(length(trim(p_reason)),0)=0 or length(p_reason)>500 then raise exception 'Informe a conferência do pagamento'; end if;
 perform 1 from public.students where id=p_student and active and not deletion_pending for update;
 if not found then raise exception 'Aluno ativo necessário'; end if;
 select * into e from public.enrollment_entries where student_id=p_student for update;
 if e.status='confirmed' then return; end if;
 if e.id is null or e.status<>'pending' then raise exception 'Não existe entrada pendente'; end if;
 update public.enrollment_entries set status='confirmed',confirmed_at=now(),confirmed_by=auth.uid(),
 confirmation_note=trim(p_reason) where id=e.id;
end $$;

-- Aplicação manual antes de cobrar o saldo do pacote. Repetir não desconta novamente.
create function public.admin_apply_enrollment_entry(p_request uuid)
returns void language plpgsql security definer set search_path='' as $$
declare r public.package_requests; e public.enrollment_entries;
begin
 if not habilita_private.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
 select * into r from public.package_requests where id=p_request for update;
 if not found then raise exception 'Pedido inexistente'; end if;
 select * into e from public.enrollment_entries where student_id=r.student_id for update;
 if e.applied_request_id=r.id and r.entry_discount_cents=2990 then return; end if;
 if e.id is null or e.status<>'confirmed' then raise exception 'Confirme o pagamento da entrada antes de abater'; end if;
 if e.applied_request_id is not null then raise exception 'A entrada já foi abatida em outro pedido'; end if;
 if r.status<>'pending' or r.payment_confirmed_at is not null then raise exception 'Use um pedido pendente, ainda não pago'; end if;
 if r.price_cents<=e.amount_cents then raise exception 'O valor restante do pacote deve ser maior que R$ 29,90'; end if;
 update public.package_requests set price_cents=price_cents-e.amount_cents,entry_discount_cents=e.amount_cents where id=r.id;
 update public.enrollment_entries set applied_request_id=r.id,applied_at=now(),applied_by=auth.uid() where id=e.id;
end $$;

-- Pedido recusado devolve a disponibilidade da entrada, mantendo seu histórico no pedido.
create function habilita_private.release_enrollment_entry() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.status='rejected' and old.status<>'rejected' then
   update public.enrollment_entries set applied_request_id=null,applied_at=null,applied_by=null
   where applied_request_id=new.id;
 end if;
 return new;
end $$;
create trigger release_entry_after_rejection after update of status on public.package_requests
for each row execute function habilita_private.release_enrollment_entry();
revoke all on function habilita_private.release_enrollment_entry() from public,anon,authenticated;
revoke all on function public.admin_set_enrollment_entry(uuid,boolean),public.admin_confirm_enrollment_entry(uuid,text),public.admin_apply_enrollment_entry(uuid) from public,anon,authenticated;
grant execute on function public.admin_set_enrollment_entry(uuid,boolean),public.admin_confirm_enrollment_entry(uuid,text),public.admin_apply_enrollment_entry(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('enrollment-receipts','enrollment-receipts',false,5242880,array['image/jpeg','image/png','application/pdf']);
create function habilita_private.can_access_entry_receipt(object_name text,uploading boolean)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.enrollment_entries e join public.students s on s.id=e.student_id
 where e.id::text=split_part(object_name,'/',1)
 and array_length(string_to_array(object_name,'/'),1)=2
 and split_part(object_name,'/',2) ~ '^[0-9a-f-]{36}\.(jpg|png|pdf)$'
 and ((not uploading and habilita_private.is_admin()) or
 (s.user_id=auth.uid() and s.active and not s.deletion_pending and (not uploading or e.status='pending'))));
$$;
revoke all on function habilita_private.can_access_entry_receipt(text,boolean) from public,anon,authenticated;
grant execute on function habilita_private.can_access_entry_receipt(text,boolean) to authenticated;
create policy entry_receipt_read on storage.objects for select to authenticated
 using(bucket_id='enrollment-receipts' and habilita_private.can_access_entry_receipt(name,false));
create policy entry_receipt_upload on storage.objects for insert to authenticated
 with check(bucket_id='enrollment-receipts' and habilita_private.can_access_entry_receipt(name,true));

-- Inclui comprovantes de entrada na exclusão definitiva do aluno, mesmo sem owner_id.
create or replace function habilita_private.student_files(p_student uuid)
returns table(bucket_id text,name text) language sql stable security definer set search_path='' as $$
 select o.bucket_id,o.name from storage.objects o join public.students s on s.id=p_student
 where (s.user_id is not null and o.owner_id=s.user_id::text)
 or (o.bucket_id='student-ladv' and split_part(o.name,'/',1)=s.id::text)
 or (o.bucket_id='package-receipts' and exists(select 1 from public.package_requests r
     where r.student_id=s.id and r.id::text=split_part(o.name,'/',1)))
 or (o.bucket_id='enrollment-receipts' and exists(select 1 from public.enrollment_entries e
     where e.student_id=s.id and e.id::text=split_part(o.name,'/',1)));
$$;
commit;
