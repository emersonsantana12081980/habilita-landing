# Pagamento manual de demonstração

O aluno escolhe o pacote, seleciona cartão parcelado ou Pix à vista, aplica o cupom e confirma o valor calculado pelo servidor. O pedido continua pendente. No cartão, a equipe combina a conclusão; não existe cobrança nem coleta de dados do cartão. No Pix, os dados são propositalmente fictícios e não há QR Code ou código Pix utilizável.

## Ativar anexos

No SQL Editor do projeto Supabase, execute todo o arquivo `supabase/migrations/202610120001_manual_payment_receipts.sql`. A migração depende das tabelas e funções já utilizadas pelo portal. Ela cria o bucket privado `package-receipts` e as políticas de leitura e envio; não altera pedidos, créditos ou recebimentos. Pode ser executada novamente.

## Conferir

1. Aluno: escolha Pix e confirme o pedido. Envie JPG, PNG ou PDF de teste, até 5 MB, em “Pagamento e comprovante”. Atualize os comprovantes para conferir que ficou salvo.
2. Administração: abra Pedidos, encontre o aluno, abra “Consultar comprovantes” e clique em “Atualizar comprovantes”. Prepare e abra o arquivo por link temporário.
3. A equipe confere manualmente e usa a decisão existente do pedido. Aprovar libera créditos; anexar um arquivo não aprova o pedido. Não aprove testes em cadastros reais.

Os arquivos não são públicos. O aluno ativo só acessa os próprios pedidos e só envia para pedidos Pix/à vista pendentes. Administradores podem consultar os anexos. Não há política para sobrescrever ou excluir arquivos pelo navegador. A autorização do banco precisa ser validada no ambiente Supabase após aplicar a migração; os testes locais da interface usam respostas simuladas.

Antes de receber pagamentos reais, substituir os dados de demonstração e definir como serão cobradas as parcelas no cartão.
