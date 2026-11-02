# Confirmar pagamento e liberar aulas

1. Execute `docs/supabase-dashboard/confirmar-pagamento-manual.sql` no SQL Editor do Supabase. A função depende das migrations anteriores de pedidos e créditos. Esta entrega não executou SQL no banco remoto.
2. No admin, abra **Pedidos → Decidir pedido**. Confira o valor recebido no Pix ou a aprovação do cartão no provedor, registre o motivo e marque a conferência.
3. Clique **Confirmar pagamento e liberar aulas**. A quantidade vem do pedido original, separada em carro e moto; alterar o catálogo não altera esse pedido.
4. O aluno verá o saldo disponível e a confirmação em Pagamentos. A área sincroniza ao voltar para a aba ou em até 15 segundos quando visível. Também há atualização manual.

A confirmação e a liberação são atômicas no banco. Cliques repetidos não duplicam créditos. Somente administradores podem confirmar. Alunos inativos e pedidos recusados não recebem novas liberações. O agendamento continua exigindo saldo na categoria, horário livre e requisitos da jornada/LADV ou condição de habilitado para reforço.

O registro confirma manualmente o pagamento do pedido; não realiza cobrança, consulta automática ao provedor nem emite recibo fiscal. O fluxo financeiro de faturas existente permanece separado.

Teste SQL disponível em `supabase/tests/confirm-manual-payment.sql`; não executado localmente por ausência de PostgreSQL. Testes de navegador usam Supabase simulado.
