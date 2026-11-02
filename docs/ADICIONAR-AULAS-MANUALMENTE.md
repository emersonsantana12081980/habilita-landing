# Cadastro manual na conta do aluno

Ative executando `docs/supabase-dashboard/adicionar-aulas-manualmente.sql` no SQL Editor do Supabase, após o SQL de confirmação de pagamento manual. A migration não foi executada remotamente nesta entrega.

No admin: **Alunos → Ver ficha → Adicionar aulas**.

- Escolha um pacote cadastrado ou informe uma quantidade manual de aulas de carro e moto.
- Informe o valor total combinado, forma de pagamento, parcelas se cartão e observação.
- **Pendente** é o padrão: registra na conta do aluno, sem saldo liberado. A equipe confirma depois em Pedidos.
- **Confirmado** exige conferência do pagamento e libera os créditos ao salvar.

O aluno não precisa selecionar pacote nem enviar solicitação. Internamente o lançamento usa o histórico de pedidos e créditos existente, para permitir acompanhamento, comprovantes e confirmação posterior. Não cria pacote no catálogo público nem conta como cobrança automática. O saldo aparece na conta do aluno e continua sujeito às regras de agendamento/LADV.

O servidor exige administrador, aluno ativo, quantidades e valor válidos. Repetir a mesma tentativa usa o mesmo identificador e não duplica o lançamento. Pacotes usam as quantidades cadastradas no servidor, mesmo que os dados enviados pelo navegador sejam alterados.
