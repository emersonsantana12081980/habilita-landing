# Cadastro e login reais — implantação em etapas

O SQL inicial e o teste de acesso/agendamento foram executados com sucesso no
Supabase pelo responsável em 26/09/2026 (resultado apresentado na conversa).

## Teste local

`.env.local` contém `VITE_SUPABASE_ENABLED=true`, URL e chave pública.
Execute `npm.cmd run dev` e abra `/cadastro` ou `/aluno` no endereço exibido.
Os dados demonstrativos não são migrados e a senha `habilita-demo` não funciona.

Antes de criar uma conta, configure no Supabase **Authentication > URL Configuration**:

- Site URL: `https://habilita-landing.vercel.app`
- Redirect URLs: `http://localhost:5173/aluno`, `http://localhost:5173/aluno?recuperar=1`,
  `http://127.0.0.1:5173/aluno`, `http://127.0.0.1:5173/aluno?recuperar=1`,
  `https://habilita-landing.vercel.app/aluno`,
  `https://habilita-landing.vercel.app/aluno?recuperar=1`.

Confirmação e recuperação dependem do envio de e-mails do Auth. O serviço
padrão do Supabase restringe destinatários e volume; para alunos externos,
configure SMTP próprio em Authentication antes de liberar cadastros públicos.
Não desative confirmação para contornar problemas de entrega.

## O que está conectado

- Cadastro com senha própria, confirmação de e-mail, login, sessão e saída.
- Solicitação de recuperação e troca de senha pelo link recebido.
- Leitura do próprio cadastro, créditos, aulas, catálogo e solicitações.
- Pedido de pacote por RPC, sem cobrança; reserva por RPC apenas com saldo.
- Consulta de horários explicitamente liberados no banco.
- Falhas de rede não retornam ao cadastro fictício nem liberam acesso.

O React filtra os dados exibidos, mas a autorização efetiva é a RLS e as funções
SQL. A sessão é administrada pelo SDK Supabase; não há senha compartilhada.

## O que ainda não está conectado

O gerenciador antigo usa localStorage. Por isso `/admin` mostra uma tela de
integração em andamento quando o modo Supabase está ligado. Não libera créditos,
horários, faturamento ou cadastros reais pelo painel antigo. Essas operações
administrativas serão integradas em outra etapa; por enquanto o banco pode
ser operado pelo responsável através do SQL Editor e funções documentadas.
O perfil do aluno é somente leitura nesta etapa.
A página de vendas ainda usa o catálogo local, enquanto a área do aluno usa o
catálogo do banco. As duas fontes precisam ser unificadas antes do lançamento.

## Publicação

Não foi publicada nesta etapa. Não ative o modo real para público geral antes
de conectar o painel e validar e-mail, confirmação e recuperação com sua conta.
Quando estiver pronto, configure na Vercel as três variáveis do `.env.example`,
com `VITE_SUPABASE_ENABLED=true`, e faça novo deploy. Nunca use chave secreta.

## Testes

`npm.cmd exec playwright -- test --config playwright.cloud.config.js`
usa API simulada em desktop/celular. Não envia e-mails ou mensagens reais.
A suíte antiga força `VITE_SUPABASE_ENABLED=false` para cobrir a demonstração.

Referências:
https://supabase.com/docs/guides/auth/passwords
https://supabase.com/docs/guides/auth/auth-smtp
