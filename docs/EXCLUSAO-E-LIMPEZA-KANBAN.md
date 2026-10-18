# Exclusão de cadastros e limpeza do Kanban

Aplicar no SQL Editor: `supabase/migrations/202610180001_delete_and_clean_board.sql`.

- Alunos e pacotes usam exclusão lógica (`deleted_at`) e ficam inativos. Saem das listas de cadastro, inclusive do arquivo morto. Registros históricos e contas de autenticação permanecem.
- A exclusão de aluno cancela aulas agendadas futuras, recusa pedidos pendentes e retira seus pedidos do quadro. Executado atomicamente, com a mesma trava de agenda existente. O diálogo explica esses efeitos antes da confirmação.
- Excluir pacote não revoga compras ou créditos existentes.
- Instrutores mantêm a regra anterior: exclusão física bloqueada por vínculos.
- Excluir do quadro só aceita pedidos aprovados ou recusados. Grava `board_archived_at` sem mudar status, créditos, documentos ou histórico do aluno. Repetir a operação é idempotente.
- Ambas as funções validam a autorização administrativa no servidor; usuários anônimos não possuem execução.

Validação: build e 12 cenários Playwright com Supabase simulado passaram. A migration ainda precisa ser aplicada e validada no Supabase real; nenhum cadastro real foi excluído durante os testes.
