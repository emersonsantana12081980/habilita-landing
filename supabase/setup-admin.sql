-- Executar no SQL Editor depois de 202609260002_admin_access.sql.
-- Conta confirmada e autorizada pelo responsável da Habilita+.
begin;
do $$
declare account_id uuid;
begin
  select id into account_id from auth.users
  where lower(email) = 'fds.cpv@hotmail.com' and email_confirmed_at is not null;
  if account_id is null then raise exception 'Conta não encontrada ou e-mail ainda não confirmado'; end if;
  if not exists(select 1 from public.profiles where id=account_id) then
    raise exception 'Perfil não encontrado para esta conta'; end if;
  insert into habilita_private.user_roles(user_id,role) values(account_id,'admin')
  on conflict(user_id) do update set role='admin';
end $$;
commit;
select 'Administrador liberado para fds.cpv@hotmail.com' as resultado;
