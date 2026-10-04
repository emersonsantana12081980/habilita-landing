# Instalação do banco HABILITA+

## 1. Criar as tabelas no Supabase

1. Abra seu projeto no Supabase.
2. No menu esquerdo, clique **SQL Editor** (ícone `>_`).
3. Clique **New query**.
4. Abra `supabase/migrations/202609260001_initial.sql` no VS Code.
5. Copie **todo o arquivo**, cole na consulta e clique **Run**.
6. O resultado esperado é **Success. No rows returned**.
7. Abra **Table Editor** para ver as 15 tabelas do schema `public`.

Execute uma única vez em um projeto novo. O script usa uma transação: falhas
impedem uma instalação parcial. Não apaga tabelas existentes. Se houver erro,
copie a mensagem para diagnóstico; não tente remover tabelas para contorná-lo.

## Estrutura

- `profiles`: perfil vinculado ao login Supabase Auth (senha fica no Auth).
- `students`: alunos, inclusive cadastros manuais ainda sem login.
- `instructors`, `vehicles`, `packages`: catálogo e recursos.
- `site_settings`, `working_hours`: configuração pública e expediente.
- `availability_slots`: horários concretos liberados pela administração.
- `package_requests`: pedidos com cópia do preço e das aulas ofertadas.
- `credit_grants`: liberações manuais auditáveis, uma por pedido.
- `lessons`: reservas, aulas realizadas, faltas e cancelamentos.
- `notifications`: aviso persistente ao painel administrativo.
- `invoices`, `installments`, `receipts`: base para faturamento manual.
- `habilita_private.user_roles`: papéis administrativos, fora da API pública.

Entram apenas os pacotes Carro R$299, Moto R$169,90 e Carro e Moto R$399,99,
o perfil público do Emerson, os dois veículos e configurações iniciais.
Nenhum aluno, senha, crédito, pagamento ou agendamento fictício é criado.

## Regras e limites

Todas as tabelas têm RLS e grants explícitos. Alunos leem seus registros;
instrutores autenticados veem suas aulas e alunos relacionados; administrador
lê o conjunto completo. Catálogo público não expõe UUID de login do instrutor
(selecione explicitamente as colunas públicas, não `select('*')`).

O trigger de Auth cria aluno e perfil, ignorando papéis enviados em metadata.
Usuários que já existiam no Auth antes da migração não são importados.
Perfil e cadastro administrativo são registros distintos: a futura integração
deve definir a atualização conjunta de nome e telefone.

`request_package` copia condições do pacote no servidor; `resolve_package`
aprova/rejeita somente como admin, exige motivo e impede aprovação duplicada.
Nenhum recebimento financeiro é gerado por essa aprovação.

`available_slots` retorna horários sem dados de outras pessoas. Admin publica
horários concretos; `working_hours` serve como modelo para o futuro gerador de
horários, não gera vagas automaticamente. Não existe sincronização Google.
`book_lesson` exige crédito da categoria e serializa reservas numa transação,
verificando conflitos de aluno, instrutor e veículo, inclusive intervalo.
`set_lesson_status` permite admin/instrutor responsável finalizar após o término
ou cancelar. Cancelar libera crédito; faltas e aulas realizadas o consomem.

Não há escrita direta por API em pedidos, créditos e aulas. Alterações nesses
registros pelo Table Editor/SQL como postgres contornam as regras: use as funções.
Faturamento tem tabelas e leitura protegida, mas escrita pela API permanece
fechada até implementar as operações de venda/recebimento/estorno transacionais.
Pagamentos, notificações push/WhatsApp, acesso real pelo site e sincronização do
painel ainda precisam de integração no React. Não publique como backend completo.

## 2. Verificar as regras

Após a instalação, abra outra consulta e execute todo
`supabase/tests/access-and-booking.sql`. O teste cria identidades temporárias,
verifica isolamento, aprovação, saldo, reserva e cancelamento, e desfaz tudo
com `ROLLBACK`. Em caso de erro, execute `ROLLBACK;` antes de continuar.
O teste sequencial não substitui um ensaio concorrente antes do uso real.

## 3. Primeiro administrador (após integrar o cadastro real)

Crie e confirme sua conta pelo Auth. Identifique o UUID correto em
Authentication > Users. No SQL Editor, execute substituindo o UUID abaixo:

```sql
insert into habilita_private.user_roles(user_id, role)
values ('UUID-DA-SUA-CONTA', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

O usuário deve ter perfil criado pelo trigger. Não existe senha administrativa
padrão nem promoção por e-mail, formulário ou metadata.
Para instrutor, atribua papel `instructor` e vincule seu UUID a
`instructors.user_id`, também pelo SQL Editor como administrador do banco.

Edição individual de aulas: execute uma vez
`migrations/202609270002_reschedule_lesson.sql` após as migrações anteriores.
O administrador pode remarcar uma aula agendada para outra vaga da mesma
categoria. A operação mantém o aluno, o identificador e o crédito reservado,
verifica conflitos do aluno/instrutor/veículo e registra a mudança em
`lesson_changes`. Em caso de conflito, a transação mantém a aula original.
O arquivo `tests/reschedule.sql` valida a remarcação com dados temporários
e desfaz tudo ao terminar; execute-o inteiro no SQL Editor.

Referências oficiais:
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions
