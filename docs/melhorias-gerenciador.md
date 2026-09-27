# Melhorias do gerenciador e área do aluno

Pagamento e notificações externas ficaram fora desta etapa a pedido do responsável.

## Ativar

Execute uma única vez, no SQL Editor, o arquivo
`supabase/migrations/202609270001_management_improvements.sql`, depois das três
migrações anteriores. Ele mantém os dados e reservas existentes.
Em outra consulta execute `supabase/tests/booking-rules.sql` para verificar
antecedência, limite diário, cancelamento e edição do perfil. Os dados de teste
são desfeitos por rollback; em caso de erro, execute `ROLLBACK;`.

## Implementado

- Agenda semanal visual, navegável, com livres, ocupados e bloqueados; seleção
  de um dia abre os detalhes e o formulário de agendamento existente.
- Cadastro manual, edição e inativação de alunos, saldo e histórico de aulas.
  Cadastro manual não cria conta Auth ou senha. Não faz associação automática
  com um login que venha a ser criado depois.
- Catálogo do banco na página pública. Painel edita pacotes, quantidades,
  valores, condições e perfis de instrutores. Inativar preserva histórico.
- Regras no servidor: antecedência de agendamento, prazo de cancelamento e
  limite por aluno/dia. Padrões iniciais: 2h para agendar, 24h para cancelar,
  no máximo 2 aulas/dia. Ajustáveis pelo administrador em Regras.
- Aluno pode corrigir nome e telefone e cancelar dentro do prazo. O cancelamento
  libera a reserva de crédito; não apaga a aula nem altera os créditos concedidos.
- Editar regras preserva aulas existentes. Cancelamento administrativo segue
  disponível no painel para exceções.

Consultas públicas usam somente o catálogo ativo. Dados locais de demonstração
não substituem dados do banco quando a conexão falha. Não há importação de
feriados; bloqueios continuam cadastrados em Configurar agenda.

## Validação

Testes de navegador usam respostas simuladas, inclusive edição de aluno,
persistência de regras e pacote aparecendo no site após edição. O teste SQL
precisa ser executado no projeto remoto pelo responsável; não temos acesso
administrativo ao banco com a chave pública do site.
