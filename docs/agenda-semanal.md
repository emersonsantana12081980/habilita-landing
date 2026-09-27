# Agenda semanal permanente

Execute uma vez `supabase/migrations/202609260003_recurring_schedule.sql`
no SQL Editor, depois das migrações 001 e 002. Sem esse SQL, a nova tela explica
que a ativação está pendente; não simula salvamento local.

No administrador, abra **Configurar agenda**, selecione instrutor e veículo,
dias, expediente, pausa, duração, intervalo e janela (7–90 dias). Clique em
**Salvar e ativar rotina**. Há uma rotina por par instrutor/veículo. Editar ou
pausar muda apenas disponibilidade futura, nunca o histórico de aulas.

O banco gera o dia consultado por aluno ou administrador. Assim, a janela
avança diariamente sem tarefa agendada, assinatura paga ou painel aberto.
O cálculo usa America/Sao_Paulo. A disponibilidade final exclui recursos já
reservados, saldo é validado na confirmação, e mudanças em regras são
serializadas com as reservas. Uma tela antiga não consegue reservar um horário
que foi desativado pela nova configuração.

Feriados e folgas são datas cadastradas explicitamente no painel, válidas para
todos os instrutores. Não há importação automática de calendário de feriados.
As aulas já agendadas em uma data bloqueada permanecem e devem ser tratadas
pela equipe. Horários manuais são mantidos como exceções e também respeitam
datas bloqueadas. Bloqueio individual de uma vaga automática persiste até
edição administrativa no banco; não é reaberto pela geração diária.

Instalação e testes reais do SQL estão pendentes no projeto remoto. Testes de
interface usam respostas simuladas; não comprovam execução da migração.
