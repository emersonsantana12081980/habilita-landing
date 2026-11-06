# Entrada da matrícula

Entrada de R$ 29,90, opcional para navegar e ativada individualmente pelo admin.

## Ativação

Execute uma vez o SQL completo `supabase/migrations/202611050001_enrollment_entry.sql`, depois das migrations anteriores, inclusive a de exclusão definitiva do aluno. Configure o Pix e o recebedor nas informações comerciais do admin. A atualização não ativa cobranças existentes ou novas automaticamente.

Admin → Alunos → Ver ficha → Entrada da matrícula → Ativar cobrança de R$ 29,90.

O aluno vê o aviso em cada carregamento enquanto a entrada estiver pendente. Pode fechar, continuar e reabrir o Pix pelo aviso na página, inclusive durante a jornada CNH. Comprovantes são privados; enviar não confirma pagamento.

## Conferência e abatimento manual

Na mesma ficha, consulte os comprovantes, confira o recebimento na conta, informe o motivo, marque a confirmação e clique em Confirmar pagamento da entrada. Isso não libera aulas. O aviso de cobrança desaparece após atualização dos dados (até 15 segundos, retorno à janela ou recarregamento).

Para abater, crie ou selecione um pedido com pagamento **pendente**. Na ficha → Entrada da matrícula, clique em **Abater entrada: nome do pacote**. O sistema desconta R$ 29,90 do saldo do pedido. Atualize qualquer link ou valor comunicado ao aluno antes de cobrar o restante. Depois, confirme o pagamento do saldo pelo fluxo normal de Pedidos para liberar as aulas.

O abatimento é manual e não é incluído automaticamente na cotação do catálogo. Pode ser combinado com cupom já aplicado. O restante precisa ser positivo; pedidos até R$ 29,90 não recebem abatimento neste fluxo. Não aplica retroativamente em pedidos pagos/aprovados. Repetir a aplicação no mesmo pedido não duplica desconto. Dois pedidos concorrentes não podem consumir a mesma entrada. Recusar o pedido devolve a disponibilidade da entrada, sem apagar o registro do abatimento no pedido recusado.

A entrada só pode ser confirmada uma vez por aluno. Desativar cobrança pendente não confirma nem estorna dinheiro. Não há reembolso automático. Não recebe dados de cartão. Não altera os requisitos da LADV ou saldo para agendamento.

## Verificação antes de usar

- Aplicar a migration e verificar autorização real com admin, aluno titular e outro aluno.
- Ativar para um aluno de teste: popup no carregamento, fechar/Esc sem bloqueio, Pix e upload privados.
- Conferir pagamento: sem concessão de aulas; aviso de cobrança some.
- Aplicar a dois pedidos simultâneos: apenas um deve ser abatido; repetir no mesmo não altera o saldo.
- Recusar o pedido: entrada fica disponível novamente. Pedido pago não aceita abatimento.
- Excluir aluno: comprovantes de entrada incluídos na limpeza e registro removido com o aluno.

Testes de interface com Supabase simulado não substituem essas verificações no banco real. A migration não é aplicada por publicar o frontend.
