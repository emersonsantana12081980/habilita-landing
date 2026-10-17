# Área do instrutor Habilita+

Endereço: https://habilita-landing.vercel.app/instrutor

## Cadastro pelo administrativo

### Conta criada pelo administrador

No novo cadastro, marque **Criar acesso do instrutor** e informe e-mail e senha inicial (mínimo 8 caracteres). Ao salvar, o perfil é salvo, a conta é criada por um cliente Auth separado (sem trocar a sessão do administrador) e vinculada usando a RPC administrativa. Não são expostas chaves secretas no navegador. Senhas não entram na tabela de instrutores nem no armazenamento local.

Configuração necessária antes de usar:

1. Execute `supabase/migrations/202610170003_instructor_account_check.sql`, além das migrations anteriores de acesso.
2. No Supabase Authentication, mantenha **Confirm email** ativado e configure o envio SMTP para os destinatários reais. Limites de envio e CAPTCHA do projeto também se aplicam a esse fluxo de cadastro.
3. Em URL Configuration, adicione `https://habilita-landing.vercel.app/instrutor?primeiro-acesso=1` às Redirect URLs permitidas. Mantenha o template de confirmação usando `{{ .ConfirmationURL }}`.
4. Teste com um endereço de e-mail que você controla. O link confirma o e-mail e abre a tela para definir a senha pessoal. Também existe **Trocar senha** na área autenticada.

O e-mail de confirmação é enviado pelo Supabase Auth; não contém a senha inicial. A tela não promete entrega na caixa de entrada. Com confirmação desativada, informa explicitamente que a conta não exigiu confirmação. Contas existentes são recusadas na pré-checagem administrativa: use o vínculo existente em vez de redefinir senhas. Em falha após salvar o perfil, o cadastro permanece e o erro orienta como recuperar o vínculo. A criação Auth e o vínculo no banco não são uma transação única. A troca de senha é oferecida na tela de primeiro acesso, não é uma política obrigatória imposta pelo servidor. O trigger atual de criação de contas também cria um registro de aluno, sem concessão de créditos.

Referências: https://supabase.com/docs/reference/javascript/auth-signup e https://supabase.com/docs/reference/javascript/auth-updateuser.

Para enviar fotos do computador ou celular, execute também `supabase/migrations/202610170002_instructor_photos.sql`. Em **Foto do instrutor**, escolha JPG, PNG ou WebP de até 5 MB e salve. A prévia aparece antes de salvar. A foto fica pública no catálogo; somente administradores podem enviar. Substituições usam arquivos novos e preservam os antigos; arquivos sem referência podem ser limpos posteriormente no Storage pela administração. Cancelar antes de salvar não envia o arquivo.

Abra `/admin` → **Instrutores** → **Cadastrar instrutor**. Preencha nome, categoria, cidade e apresentação e salve. Para liberar login, abra **Vincular login do instrutor** no cartão e informe o e-mail de uma conta existente. Não é criada uma senha ou uma conta de autenticação por esse formulário.

Antes de usar o vínculo pelo painel, execute `supabase/migrations/202610170001_admin_instructors.sql` no SQL Editor. Essa função exige administrador no servidor e não permite substituir vínculos existentes. Preserva o papel de administrador quando ele também é instrutor. A migration não foi aplicada remotamente pela ferramenta.

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
