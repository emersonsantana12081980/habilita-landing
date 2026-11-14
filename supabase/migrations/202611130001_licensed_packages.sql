begin;
alter table public.packages add column if not exists audience text not null default 'first_license' check (audience in ('first_license','licensed'));
create function habilita_private.signup_licensed_student() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.user_id is not null and exists(select 1 from auth.users where id=new.user_id and raw_user_meta_data->>'licensed_driver'='true') then new.licensed_driver:=true; end if;
 return new;
end;$$;
create trigger signup_licensed_student before insert on public.students for each row execute function habilita_private.signup_licensed_student();
revoke all on function habilita_private.signup_licensed_student() from public,anon,authenticated;
create function habilita_private.check_package_audience() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare audience_value text; licensed boolean;
begin
 if new.package_id is null then return new; end if;
 select audience into audience_value from public.packages where id=new.package_id;
 select licensed_driver into licensed from public.students where id=new.student_id;
 if (audience_value='licensed') is distinct from licensed then raise exception 'Este pacote não corresponde ao perfil do aluno.'; end if;
 return new;
end;$$;
create trigger check_package_audience before insert on public.package_requests for each row execute function habilita_private.check_package_audience();
revoke all on function habilita_private.check_package_audience() from public,anon,authenticated;
commit;
