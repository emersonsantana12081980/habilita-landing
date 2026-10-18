# Pagamento manual dos pacotes

## Ativação

Executar inteiro `docs/supabase-dashboard/ativar-pagamento-manual.sql` no SQL Editor do projeto. O arquivo é reaplicável e reúne comprovantes privados e a nova função de pedido. Depende das migrations existentes de preços/cupons, análise de pedidos e configurações comerciais. Não altera pagamentos já aprovados ou créditos.

No admin → Configurações do site, preencher código Pix copia e cola (ou chave), nome do recebedor e banco. Usar uma chave ou código reutilizável sem valor fixo, porque cada pedido pode ter um total diferente, inclusive com cupom. O aluno vê o total e deve conferir no aplicativo bancário. Os dados Pix ficam registrados no pedido para mudanças futuras de configuração não alterarem pedidos anteriores.

O código Pix e os dados comerciais são públicos; não cadastrar credenciais. Se o código ou o recebedor estiverem vazios, o servidor recusa novos pedidos Pix com orientação para falar com a equipe.

## Aluno

Escolher pacote → Pix ou cartão → aplicar cupom/conferir valor → continuar. Pix abre uma janela com os dados, botão copiar e envio de JPG/PNG/PDF de até 5 MB. Cartão permite de 1 até o limite de parcelas do pacote (máximo 12), mantendo o total de cartão cadastrado e dividindo nas parcelas escolhidas. Não há coleta de dados do cartão nem checkout automático. A equipe enviará o link manualmente pelo WhatsApp cadastrado.

Pedidos entram em análise com status `pending`. Anexar comprovante não confirma pagamento e não libera aulas. O aluno pode reabrir o pagamento na aba Pagamentos. Pedidos antigos sem dados Pix continuam sem código; a equipe orienta esses alunos diretamente.

## Administração

Pedidos → Em análise: consultar comprovante por link temporário ou abrir o WhatsApp do aluno para encaminhar o link de cartão. O botão somente abre a conversa; o envio é feito pela equipe. Após confirmar o recebimento, aprovar e liberar créditos; ou recusar com motivo. A aprovação existente preserva liberação única de créditos e os pré-requisitos de agendamento.

Comprovantes permanecem em bucket privado, visíveis ao dono do pedido e administradores. A autorização e os preços são conferidos no servidor. A função nova reaproveita a transação que impede pedidos pendentes duplicados.

Testes locais usam Supabase simulado e nenhum pagamento real. A execução do SQL em produção depende do acesso administrativo ao Supabase e deve ocorrer antes do uso do fluxo publicado.
