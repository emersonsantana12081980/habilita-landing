# Confirmação de pagamentos de teste — MP-04

Esta etapa registra a confirmação consultada no Mercado Pago e exibe o resultado
no painel de testes do administrador. Não movimenta saldo, não aprova
`package_requests` e não concede aulas. Produção e liberação automática real são
uma etapa posterior. Uma compra de teste nunca deve conceder benefícios reais.

## Instalação (nesta ordem)

1. Supabase > SQL Editor: executar
   `supabase/migrations/202610110001_mp_test_confirmation.sql` uma única vez.
2. Executar `supabase/tests/mp-test-confirmation.sql` no SQL Editor. Esperado:
   “Confirmações de teste verificadas; dados fictícios desfeitos.”
3. Edge Functions: criar `mercado-pago-test-webhook` usando todo o conteúdo de
   `docs/supabase-dashboard/mercado-pago-test-webhook.ts` como `index.ts`.
   Desativar Verify JWT with legacy secret: a função valida HMAC do provedor.
4. Na aplicação Mercado Pago que emite as notificações do vendedor de teste,
   configurar Webhooks de **Pagamentos** para:
   `https://utxacavhovsjirmgwtjq.supabase.co/functions/v1/mercado-pago-test-webhook`.
   Usar a configuração do ambiente correspondente à credencial do vendedor de
   teste, não a conta do comprador. Se o painel não oferecer configuração para
   essas credenciais, conferir a aplicação do vendedor de teste antes de trocar
   qualquer credencial. Não habilitar pagamentos de vendedor real.
5. Copiar a chave secreta de assinatura de Webhooks para o Secret do Supabase
   `MERCADO_PAGO_WEBHOOK_SECRET_TEST`. Não colar no código ou no chat. Este segredo
   é diferente do Access Token. Manter os Secrets existentes.
6. Atualizar `mercado-pago-test-checkout` com o arquivo gerado de mesmo nome.
   MP-04 usa também `SUPABASE_SERVICE_ROLE_KEY`, padrão do servidor, para registrar
   a tentativa. Nunca colocar essa chave no frontend ou nas variáveis VITE.
7. Publicar o frontend atualizado na Vercel após aplicar o SQL. A tela
   Meus pacotes > teste da administração contém “Confirmações do Mercado Pago”.
8. Gerar um novo checkout pelo Habilita+, pagar com comprador e cartão de teste
   usando titular APRO, entrar novamente no Habilita+ se necessário e clicar em
   “Atualizar pagamentos”. Aguardar a entrega do webhook. Aprovação deve aparecer
   como “Aprovado no teste”. Pagamentos anteriores a MP-04 não têm tentativa
   registrada e serão ignorados; não são importados automaticamente.

## Proteções e diagnóstico

- ID de pagamento vem do parâmetro `data.id` assinado por HMAC-SHA256, usando
  `x-signature` e `x-request-id`. A URL enviada no corpo nunca é acessada.
- O servidor consulta `/v1/payments/{id}` e `/users/me` com o token privado.
  Confere vendedor de teste brasileiro, `live_mode=false`, moeda BRL, referência,
  metadata, preço e tentativa registrada antes de criar o checkout.
- Guarda somente identificadores, valor, status e datas; sem cartão, CPF ou
  dados brutos do comprador. O usuário não pode gravar confirmações.
- Um pagamento tem um único registro; atualizações antigas não sobrescrevem as
  recentes. Estornos e contestações atualizam a simulação sem tocar nos créditos.
- 401: assinatura ausente/incorreta (inclusive teste manual sem HMAC).
  503: segredo/configuração ausente ou falha temporária no provedor/banco;
  Mercado Pago pode reentregar. 200 `unknown_attempt`: checkout antigo ou de outra
  instalação; gerar uma nova tentativa pelo site atualizado.
- O retorno do navegador nunca confirma pagamento. A tela lê exclusivamente o
  resultado persistido pelo servidor. O botão Atualizar consulta o banco; não
  cria cobrança, não concede créditos e não consulta diretamente a API MP.
- Reentregas de assinaturas válidas são permitidas, com deduplicação por
  pagamento e data no banco. Não há reconciliação agendada: se a entrega falhar,
  verificar/reentregar a notificação pelo painel Mercado Pago.

## Verificação

Testes Node cobrem assinatura, adulteração, ambiente, dono, preço, callbacks e
falhas transitórias. O SQL de testes cobre duplicatas, ordem dos eventos, RLS,
permissões, estorno e ausência de créditos. O SQL precisa ser executado no
Supabase: não há PostgreSQL local configurado. A confirmação de ponta a ponta
depende da instalação e de uma nova compra fictícia.

Fonte oficial de assinatura e configuração:
https://www.mercadopago.com.br/developers/en/docs/checkout-pro-preferences/additional-settings/optional-notifications
