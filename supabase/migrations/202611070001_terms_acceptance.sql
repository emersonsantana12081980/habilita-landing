begin;
create table public.terms_acceptances (
 user_id uuid not null references auth.users(id) on delete cascade,
 version text not null,
 accepted_at timestamptz not null default now(),
 primary key(user_id,version)
);
alter table public.terms_acceptances enable row level security;
revoke all on public.terms_acceptances from anon,authenticated;
grant select on public.terms_acceptances to authenticated;
create policy own_terms_acceptance on public.terms_acceptances for select to authenticated using(user_id=auth.uid());
create function public.accept_student_terms(p_version text,p_accepted boolean) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
 if p_accepted is distinct from true or p_version is distinct from '2026-11-07' then raise exception 'Confirme a versão vigente dos termos'; end if;
 insert into public.terms_acceptances(user_id,version) values(auth.uid(),p_version) on conflict do nothing;
end;$$;
revoke all on function public.accept_student_terms(text,boolean) from public,anon;
grant execute on function public.accept_student_terms(text,boolean) to authenticated;
-- O aceite informado no cadastro é registrado pelo servidor, sem confiar na data do navegador.
create function public.record_signup_terms() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.raw_user_meta_data->>'terms_version'='2026-11-07' and new.raw_user_meta_data->>'terms_accepted'='true' then
  insert into public.terms_acceptances(user_id,version) values(new.id,'2026-11-07') on conflict do nothing;
 end if;
 return new;
end;$$;
revoke all on function public.record_signup_terms() from public,anon,authenticated;
create trigger record_signup_terms after insert on auth.users for each row execute function public.record_signup_terms();
commit;
