begin;
alter table public.students add column if not exists deletion_pending boolean not null default false;
alter table public.students drop constraint if exists pending_deletion_inactive;
alter table public.students add constraint pending_deletion_inactive check (not deletion_pending or not active);

-- Listagem privada, inclusive arquivos antigos substituídos e comprovantes.
create or replace function habilita_private.student_files(p_student uuid)
returns table(bucket_id text,name text) language sql stable security definer set search_path='' as $$
 select o.bucket_id,o.name from storage.objects o join public.students s on s.id=p_student
 where (s.user_id is not null and o.owner_id=s.user_id::text)
 or (o.bucket_id='student-ladv' and split_part(o.name,'/',1)=s.id::text)
 or (o.bucket_id='package-receipts' and exists(select 1 from public.package_requests r
     where r.student_id=s.id and r.id::text=split_part(o.name,'/',1)));
$$;
revoke all on function habilita_private.student_files(uuid) from public,anon,authenticated;

create or replace function habilita_private.can_delete_student_file(p_bucket text,p_name text)
returns boolean language sql stable security definer set search_path='' as $$
 select habilita_private.is_admin() and exists(select 1 from public.students s
 cross join lateral habilita_private.student_files(s.id) f
 where s.deletion_pending and f.bucket_id=p_bucket and f.name=p_name);
$$;
revoke all on function habilita_private.can_delete_student_file(text,text) from public,anon,authenticated;
grant execute on function habilita_private.can_delete_student_file(text,text) to authenticated;
drop policy if exists admin_purge_student_files on storage.objects;
create policy admin_purge_student_files on storage.objects for delete to authenticated
 using(habilita_private.can_delete_student_file(bucket_id,name));
drop policy if exists admin_read_student_files_to_purge on storage.objects;
create policy admin_read_student_files_to_purge on storage.objects for select to authenticated
 using(habilita_private.can_delete_student_file(bucket_id,name));

create or replace function public.admin_prepare_student_deletion(p_student uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.students; files jsonb;
begin
 if not habilita_private.is_admin() then raise exception 'admin_required'; end if;
 perform pg_advisory_xact_lock(724426001);
 select * into s from public.students where id=p_student for update;
 if not found then raise exception 'registration_not_found'; end if;
 if s.user_id=auth.uid() or exists(select 1 from habilita_private.user_roles where user_id=s.user_id)
 or exists(select 1 from public.instructors where user_id=s.user_id) then raise exception 'protected_account'; end if;
 update public.students set active=false,deletion_pending=true where id=s.id;
 select coalesce(jsonb_agg(jsonb_build_object('bucket',f.bucket_id,'path',f.name)),'[]'::jsonb)
 into files from habilita_private.student_files(s.id) f;
 return files;
end;
$$;

-- Só finaliza depois da remoção real dos arquivos pela API Storage.
-- Dados relacionais e conta Auth são removidos na mesma transação.
create or replace function public.admin_finish_student_deletion(p_student uuid)
returns void language plpgsql security definer set search_path='' as $$
declare s public.students;
begin
 if not habilita_private.is_admin() then raise exception 'admin_required'; end if;
 perform pg_advisory_xact_lock(724426001);
 select * into s from public.students where id=p_student for update;
 if not found then return; end if;
 if not s.deletion_pending then raise exception 'deletion_not_prepared'; end if;
 if s.user_id=auth.uid() or exists(select 1 from habilita_private.user_roles where user_id=s.user_id)
 or exists(select 1 from public.instructors where user_id=s.user_id) then raise exception 'protected_account'; end if;
 if exists(select 1 from habilita_private.student_files(s.id)) then raise exception 'student_files_remaining'; end if;
 delete from public.receipts where installment_id in(select i.id from public.installments i join public.invoices v on v.id=i.invoice_id where v.student_id=s.id);
 delete from public.installments where invoice_id in(select id from public.invoices where student_id=s.id);
 delete from public.invoices where student_id=s.id;
 delete from public.notifications where lesson_id in(select id from public.lessons where student_id=s.id);
 delete from public.lesson_changes where lesson_id in(select id from public.lessons where student_id=s.id);
 delete from public.lessons where student_id=s.id;
 delete from public.mp_test_payments where student_id=s.id;
 delete from public.mp_test_attempts where student_id=s.id;
 delete from public.credit_grants where student_id=s.id;
 delete from public.package_requests where student_id=s.id;
 delete from public.student_journey_declarations where student_id=s.id;
 delete from public.student_ladv_declarations where student_id=s.id;
 delete from public.students where id=s.id;
 if s.user_id is not null then
   delete from public.profiles where id=s.user_id;
   delete from auth.users where id=s.user_id;
 end if;
end;
$$;
revoke all on function public.admin_prepare_student_deletion(uuid),public.admin_finish_student_deletion(uuid) from public,anon,authenticated;
grant execute on function public.admin_prepare_student_deletion(uuid),public.admin_finish_student_deletion(uuid) to authenticated;
commit;
