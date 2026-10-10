# Mercado Pago — primeira etapa, somente testes

Aplicação Habilita Mais: Checkout Pro / API de Preferences. O Access Token de
teste é configurado pelo titular diretamente nos Secrets do Supabase.

## O que esta entrega faz

- Administrador autenticado acessa `/aluno` > Meus pacotes e vê a seção de teste.
- Seleciona um pedido próprio, pendente, com `pricing_demo = true`.
- O checkout recebe o valor total salvo no pedido, incluindo o desconto já aplicado.
- Não permite informar outro valor, pagar parcialmente nem usar pedidos de terceiros.
- Valida no Mercado Pago que a credencial pertence a um vendedor fictício brasileiro.
- Não grava pagamentos, não aprova pedidos, não libera aulas e não altera saldo real.
- Alunos comuns não veem a seção; a função também verifica o papel administrativo.

## Configuração no Supabase (não enviar chaves pelo chat)

Em Edge Functions > Secrets:

| Nome | Valor |
| --- | --- |
| `MERCADO_PAGO_ACCESS_TOKEN_TEST` | Access Token do vendedor de teste; usuário informou que salvou |
| `MERCADO_PAGO_TEST_ENABLED` | `true` para habilitar somente esta função de teste |
| `SITE_URL` | `https://habilita-landing.vercel.app` |

Esta implementação não usa Public Key no navegador. Não colocar Access Token em
variáveis `VITE_*`, SQL, Git ou arquivos públicos. Não há credencial de produção.

## Publicação da função

Não exige nova migração SQL. Requer as migrações de preços/cupons e papéis já aplicadas.
A função tem dois arquivos em `supabase/functions/mercado-pago-test-checkout/`:
`index.ts` e `handler.js`. Ambos devem ser publicados juntos.

Pelo CLI autenticado no projeto:

```powershell
npx supabase functions deploy mercado-pago-test-checkout --project-ref utxacavhovsjirmgwtjq --no-verify-jwt
```

`verify_jwt = false` desativa apenas a validação antiga do gateway. O código chama
`auth.getUser` com o JWT do usuário e exige `my_access_role() = admin`. Consultas ao
banco usam a sessão do usuário e RLS, sem chave service_role.

Alternativa: criar a função pelo editor de Edge Functions no Dashboard, adicionar
os dois arquivos e desativar a opção de verificação JWT legada do gateway.

Depois publicar o frontend pelo fluxo Git/Vercel. Os arquivos preparados localmente
não significam que a função ou o site já foram publicados.

## Roteiro do teste externo

1. No Mercado Pago, criar/selecionar comprador de teste brasileiro, diferente do vendedor.
2. Entrar na conta administradora do Habilita+ pela área do aluno. O perfil precisa estar ativo.
3. Solicitar um pacote fictício; deixar pendente, sem aprovar no administrador.
4. Em Meus pacotes, usar “Testar pagamento do pacote”. O total já vem do pedido.
5. No Mercado Pago, utilizar somente conta e cartão de teste. Preferir cartão para o
   primeiro teste; Pix depende das possibilidades do ambiente de teste do provedor.
6. Conferir sucesso/recusa/pendência com os cenários de teste do provedor.
7. Retornar ao site e conferir que créditos e pedido não foram alterados.

O limite de parcelas é enviado ao provedor, mas juros e parcelas finais precisam ser
conferidos no checkout antes de definir a política comercial de produção.

## Próxima etapa obrigatória antes de vendas reais

- Tabela de pagamentos/tentativas, referência imutável e reutilização/idempotência.
- Webhook: validar assinatura, consultar pagamento na API e confrontar vendedor,
  ambiente, pedido, moeda e valor; tratar notificações repetidas e fora de ordem.
- Concessão de créditos uma única vez, conciliada com aprovações manuais existentes.
- Estados no aluno/admin, estorno, contestação e reconciliação de pagamentos pendentes.
- Definir se pagamento libera diretamente ou depende também da análise da equipe.
- Validar preços reais, cupons, juros e parcelamento; testar antes de ativar produção.

Neste protótipo cada clique pode criar outra preferência fictícia, com vencimento
de 30 minutos. Não usar como implementação de cobrança real. Voltar pela URL de
sucesso nunca comprova pagamento.

## Validação local

`node --test tests/mercado-pago-test.test.js` testa o handler com provedores simulados.
Os testes de navegador validam acesso, preço mostrado e falha recuperável. Esses
testes não validam a credencial salva nem executam transações no Mercado Pago.

Referências:
- https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/overview
- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/functions/deploy
