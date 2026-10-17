begin;
create or replace function public.admin_check_instructor_email(p_email text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not habilita_private.is_admin() then raise exception 'admin_required'; end if;
  if p_email is null or length(trim(p_email)) > 254 or trim(p_email) not like '%@%.%' then
    raise exception 'invalid_email'; end if;
  if exists(select 1 from auth.users where lower(email)=lower(trim(p_email))) then
    raise exception 'account_exists'; end if;
end;
$$;
revoke all on function public.admin_check_instructor_email(text) from public, anon, authenticated;
grant execute on function public.admin_check_instructor_email(text) to authenticated;
commit;
