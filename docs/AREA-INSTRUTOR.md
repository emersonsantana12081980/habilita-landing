# Área do instrutor Habilita+

Endereço: https://habilita-landing.vercel.app/instrutor

Escopo: login com conta existente, resumo, agenda semanal, lista por dia, detalhes e histórico. Somente consulta. Administração e alterações de agendamento continuam em `/admin`.

## Ativar no Supabase

1. Abra SQL Editor e execute o arquivo completo `supabase/migrations/202610140001_instructor_portal.sql`.
2. Em Authentication → Users, crie a conta do instrutor, se ainda não existir. Não compartilhe senha em conversa ou repositório.
3. Consulte os instrutores cadastrados para encontrar o slug correto:

```sql
select id, slug, name, active from public.instructors order by name;
```

4. No bloco abaixo, substitua apenas o e-mail e o slug pelos dados reais. Execute no SQL Editor. O bloco não cria instrutores nem troca um vínculo existente. O papel de administrador, se já existir, é preservado.

```sql
begin;
do $$
declare
  account_id uuid;
  target_id uuid;
  account_email text := 'SUBSTITUA-PELO-EMAIL';
  instructor_slug text := 'SUBSTITUA-PELO-SLUG';
begin
  select id into account_id from auth.users where lower(email) = lower(account_email);
  if account_id is null then raise exception 'Crie a conta em Authentication primeiro'; end if;
  select id into target_id from public.instructors
    where slug = instructor_slug and active for update;
  if target_id is null then raise exception 'Instrutor ativo não encontrado'; end if;
  if exists(select 1 from public.instructors where id=target_id and user_id is not null and user_id<>account_id)
    then raise exception 'Este instrutor já tem outra conta vinculada'; end if;
  update public.instructors set user_id=account_id where id=target_id;
  insert into habilita_private.user_roles(user_id,role) values(account_id,'instructor')
    on conflict(user_id) do nothing;
end $$;
commit;
```

5. Entre em `/instrutor` com essa conta. As aulas precisam estar atribuídas ao mesmo instrutor na administração.

## Autorização e validação

A função `instructor_portal()` não recebe ID do navegador. Exige usuário autenticado, papel instructor/admin e vínculo com instrutor ativo. Mesmo administrador só consulta seu próprio vínculo nessa função. Retorna nome do aluno, veículo, categoria, horários e status das aulas desse instrutor; não retorna contatos, pagamentos ou documentos. Não concede escrita nem modifica RLS existente.

Testes de interface com respostas simuladas cobrem login, agenda, detalhes, histórico, logout, ausência de vínculo, ausência de função e agenda vazia em desktop e celular. Eles não substituem a validação da autorização no banco real.

Após aplicar a migration, validar com duas contas de instrutor e aulas distintas: cada conta deve receber somente suas aulas; aluno sem papel, conta sem vínculo e instrutor inativo devem receber erro. Uma chamada sem sessão não pode executar a função. Alterar o vínculo não pode deixar os dados antigos acessíveis após atualizar/reentrar. A aplicação local não tem acesso administrativo ao Supabase para executar essa validação remotamente.
