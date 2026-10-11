# Mercado Pago — primeira etapa, somente testes

Aplicação Habilita Mais: Checkout Pro / API de Preferences. O Access Token de
teste é configurado pelo titular diretamente nos Secrets do Supabase.

## O que esta entrega faz

- Administrador autenticado acessa `/aluno` > Meus pacotes e vê a seção de teste.
- Seleciona um pedido próprio, pendente, com `pricing_demo = true`.
- O checkout recebe o valor total salvo no pedido, incluindo o desconto já aplicado.
- Não permite informar outro valor, pagar parcialmente nem usar pedidos de terceiros.
- Valida no Mercado Pago que a credencial pertence a um vendedor fictício brasileiro.
- MP-04 registra tentativas e confirmações de teste, sem aprovar pedidos, liberar aulas ou alterar saldo real.
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

MP-04 exige a migração `202610110001_mp_test_confirmation.sql`. Siga primeiro
`docs/MERCADO-PAGO-CONFIRMACAO-TESTE.md` para instalar o SQL e o webhook.
A função tem dois arquivos em `supabase/functions/mercado-pago-test-checkout/`:
`index.ts` e `handler.js`. Ambos devem ser publicados juntos.

Pelo CLI autenticado no projeto:

```powershell
npx supabase functions deploy mercado-pago-test-checkout --project-ref utxacavhovsjirmgwtjq --no-verify-jwt
```

`verify_jwt = false` desativa apenas a validação antiga do gateway. O código chama
`auth.getUser` com o JWT do usuário e exige `my_access_role() = admin`. Consultas ao
banco para ler pedidos usam a sessão do usuário e RLS. O registro de tentativas e
de confirmações usa a chave service_role somente no servidor.

Alternativa simples pelo Dashboard: executar `node scripts/build-mp-dashboard.mjs`
e copiar todo o arquivo `docs/supabase-dashboard/mercado-pago-test-checkout.ts`
para o `index.ts` do editor de Edge Functions. Essa versão contém os dois arquivos
reunidos e dispensa criar `handler.js` no Dashboard. Desativar a opção de verificação
JWT legada do gateway, mantendo a validação própria da sessão no código.

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

## Diagnóstico do erro de abertura (11/10/2026)

A mensagem genérica observada em produção não identifica a causa. A versão revisada
retorna apenas códigos controlados, sem imprimir respostas brutas nem credenciais:
`TOKEN_FORMAT`, `SELLER_401`, `SELLER_403`, `PREFERENCE_400`, `ORDER`, etc.
Não concluir que a credencial está errada sem evidência. Atualizar a função no
Dashboard e repetir o teste autenticado para obter a etapa e o status HTTP.
Alterar arquivos locais ou publicar o frontend na Vercel não atualiza essa função.

O usuário obteve `PREFERENCE_400`: a validação local e a consulta ao vendedor de
teste passaram, mas a criação da preferência foi recusada. Isso não identifica
sozinho qual parâmetro falhou. A revisão seguinte lê somente códigos de erro
conhecidos do JSON retornado pelo provedor; mensagens brutas são descartadas.
Também envia início e fim da validade com offset explícito, conforme os exemplos
oficiais. A causa externa e o sucesso do checkout ainda dependem de novo teste
após publicar esse código na Edge Function.

Referências:
- Revisão MP-03: removida a exclusão de `account_money`, não permitida na API
  Preferences segundo a documentação abaixo. Mantidos preço, parcelas e as
  validações de teste. O checkout pode oferecer saldo da conta Mercado Pago.
  Erros agora incluem MP-03 para identificar a versão implantada. Ainda é
  necessário publicar o arquivo gerado na Edge Function e retestar; não há
  confirmação de que essa incompatibilidade explica o 400 observado.
- https://www.mercadopago.com.br/developers/en/docs/checkout-pro-preferences/additional-settings/payment-methods
- https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/overview
- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/functions/deploy
