# Preços e cupons — 04/10/2026

O responsável autorizou valores fictícios para visualização. Esta decisão substitui a pendência anterior de preço parcelado no PRD; os outros dados comerciais não foram inventados.

## Ativar no Supabase

1. Executar inteiro `supabase/migrations/202610040001_package_prices_coupons.sql` uma única vez no SQL Editor, depois das migrações anteriores.
2. Executar inteiro `supabase/tests/package-coupons.sql` para validar funções/permissões. O teste termina em ROLLBACK e desfaz as próprias alterações; se falhar, executar `ROLLBACK;`.
3. Reabrir o administrador, aba **Catálogo**. Editar pacote e configurar **Preço à vista**, **Valor total parcelado** e **Número de parcelas**.

A migração preserva os preços à vista existentes, cria totais parcelados de exemplo com aproximadamente 20% a mais, arredondados para 12 parcelas iguais, e marca os pacotes como fictícios. Não representa juros ou condições comerciais aprovadas. Nenhum pedido antigo é recalculado.

O total parcelado é independente do preço à vista. Não é o valor de uma parcela. A interface calcula as parcelas, distribui os centavos e mostra o total. Alterar o preço à vista não altera automaticamente o total parcelado já salvo.

Enquanto a migração não foi aplicada, os cards públicos exibem uma simulação claramente identificada de 12 parcelas. Gravação dos novos campos e aplicação de cupons dependem da migração; não há concessão de desconto local que substitua o banco.

## Administrador

- **Catálogo → Pacotes → Editar**: preços, número de parcelas e aviso de valores fictícios. Desmarcar o aviso apenas com valores finais definidos.
- **Catálogo → Cupons de desconto**: código único, percentual inteiro de 1 a 99% ou valor fixo em reais, todos os pacotes ou um pacote, validade opcional, ativo/inativo e opção de limitar a pacotes fictícios.
- Validade: até 23:59:59 do dia escolhido no fuso de São Paulo.
- Cupom de exemplo `HABILITA10`: 10%, somente pacotes de demonstração. O código não é divulgado como promoção real.
- Inativar o cupom pelo formulário de edição. Não há exclusão física, preservando a referência em solicitações antigas.
- O desconto aparece no pedido: valor original, desconto, código, total final, forma escolhida e parcelas.

## Aluno

Em **Meus pacotes**, escolher à vista ou parcelado, informar o cupom e clicar em **Aplicar cupom**. Sem cupom, usar **Conferir valor**. Conferir o resumo e clicar em **Solicitar pacote**.

Mudar cupom ou forma de pagamento invalida a consulta anterior. No envio, o servidor confere novamente preço, parcelas, cupom ativo, validade e pacote permitido. Se mudou, o aluno precisa conferir de novo. A solicitação é registrada com os valores calculados pelo banco, não com um valor livre enviado pelo navegador.

## Regras e limites

- Um cupom por solicitação, aplicado ao preço à vista ou ao total parcelado conforme a escolha. Não acumulável.
- Cupons não liberam créditos, não efetuam cobranças nem mandam notificações externas. A aprovação manual existente continua necessária.
- Desconto maior ou igual ao total é rejeitado: pacotes gratuitos não fazem parte deste fluxo.
- Não há limite global de utilizações ou restrição de “primeira compra”. O cupom pode ser reutilizado enquanto válido; apenas um pedido pendente por aluno/pacote, conforme regra existente.
- Somente administradores podem listar, criar ou editar cupons. Alunos autenticados consultam um código específico via RPC; tabelas não ficam abertas para listagem de cupons.
- Logs de pedidos preservam a condição aplicada, mesmo depois de uma alteração no cupom.
- Banco: migração e teste SQL preparados para execução pelo responsável; não executados remotamente pelo assistente.

## Validação

Verificação local concluída: 20 cenários cloud aprovados entre a execução principal e a repetição do teste de cupom, 12 testes da landing page e 8 testes de pacotes/conversão. Compilação de produção aprovada; permanece o aviso de tamanho do bundle principal (aproximadamente 507 kB antes de gzip). A validação SQL no Supabase ainda depende da execução dos arquivos acima.

Os testes cloud incluem cadastro de preço/cupom fixo, cupom inválido, desconto percentual, troca à vista/parcelado, cupom que deixa de valer antes do envio e remoção do cupom. APIs simuladas, sem cobranças/dados reais. O teste SQL cobre também RLS, pacote incompatível, expiração, adulteração do total, parcelas desatualizadas, duplicação, preservação de pedido antigo e ausência de concessão automática de créditos.
