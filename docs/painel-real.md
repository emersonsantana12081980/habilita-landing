# Painel conectado ao Supabase

## Ativação pelo responsável

1. No SQL Editor, execute o arquivo inteiro `supabase/migrations/202609260002_admin_access.sql`.
2. Em outra consulta, execute `supabase/setup-admin.sql`. Ele concede acesso
   administrativo somente à conta confirmada `fds.cpv@hotmail.com`, indicada
   pelo responsável. Não cria senha nem outra conta. Não publique este script
   como endpoint HTTP; deve ser executado pelo dono do projeto no SQL Editor.
3. Abra `http://localhost:5173/admin` e entre com essa conta no formulário
   administrativo. Entrada e saída permanecem em `/admin`, sem passar pela
   área do aluno. A verificação do papel ocorre no banco após autenticar.

As consultas e operações do painel são protegidas por RLS e funções SQL.
Aluno autenticado não vê o gerenciador. Falha na consulta de papel nega acesso.
Não há leitura nem migração de cadastros locais neste painel.

## Funcionalidades desta etapa

- Alunos: consulta dos cadastros e saldo disponível por categoria.
- Pedidos: aprovação/recusa com motivo; aprovação concede créditos uma vez,
  sem gerar cobrança ou recibo.
- Horários: liberação de uma vaga por vez, com instrutor, veículo, categoria,
  duração e intervalo; validação no banco impede sobreposição com outras vagas
  ativas e aulas. Bloquear novas reservas não cancela aulas existentes.
- Agenda: lista do dia, reserva pelo administrador com crédito do aluno,
  cancelamento, conclusão/falta após o horário da aula.
- Avisos de novos agendamentos persistidos no banco, com marcação de leitura.

Horários digitados consideram Brasília (UTC-03:00). A administração libera as
vagas explicitamente; o modelo `working_hours` não publica dias automaticamente.
Atualize o painel para receber mudanças feitas em outros dispositivos; ainda
não há assinatura Realtime. Não há integração Google.

Ainda faltam edição/cadastro manual de alunos, CRUD do catálogo real,
faturamento, interface para instrutor e sincronização da página de vendas.
O painel atual carrega listas pelo limite configurado na API (normalmente 1000
registros); paginação será necessária antes de volumes maiores.
Nenhuma dessas partes ausentes deve ser apresentada como concluída.

## Testes

`npm.cmd exec playwright -- test --config playwright.cloud.config.js` cobre
login, acesso negado a aluno, lista administrativa, aprovação e publicação de
horário, em desktop e celular com API simulada. A migração 002 precisa ser aplicada
e validada no Supabase; o teste simulado não substitui validação real das RPCs.

O modo real permanece em teste local. A publicação está pendente.
