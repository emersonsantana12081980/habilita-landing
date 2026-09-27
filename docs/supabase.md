# Supabase — conexão inicial

A biblioteca oficial e o cliente em `src/lib/supabase.js` estão preparados.
O aplicativo continua demonstrativo: os formulários e o gerenciador ainda usam
localStorage. Configurar estas variáveis não ativa autenticação ou persistência remota.

## Configuração local

Copie `.env.example` para `.env.local` e preencha a URL do projeto e a chave
`sb_publishable_`. `.env.local` é ignorado pelo Git. Não use chaves secretas,
service_role ou senha do banco em variáveis `VITE_`.

Execute `npm.cmd run check:supabase`. O teste consulta somente as configurações
públicas do Auth, sem cadastrar usuários, enviar e-mails ou alterar dados.
Sucesso significa que URL, chave e serviço Auth responderam; não verifica
tabelas, políticas RLS ou agendamento.

Na Vercel, estas mesmas variáveis deverão ser cadastradas nas configurações
do projeto quando a integração completa estiver pronta para publicação.

## Próxima etapa

A migração inicial está pronta em
`supabase/migrations/202609260001_initial.sql`. As instruções para executar no
SQL Editor e o teste transacional estão em `supabase/README.md`. Os arquivos
foram revisados, mas ainda não executados em PostgreSQL: a instalação da
ferramenta local de teste não foi autorizada. A execução remota também está
pendente, pois a chave pública não permite executar DDL.

Aplicar e validar a migração SQL para os cadastros, permissões e RLS;
substituir o login demonstrativo por Supabase Auth; proteger o painel por papel
administrativo e conectar os dados. Agendamentos e liberação de créditos precisam
de transações no servidor para impedir reservas ou créditos duplicados.
Não importar automaticamente os cadastros fictícios do navegador.

Referência: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
