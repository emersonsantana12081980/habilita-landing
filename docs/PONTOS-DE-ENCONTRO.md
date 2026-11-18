# Pontos de encontro

Aplicar `supabase/migrations/202611170001_meeting_points.sql` uma única vez, após as migrações anteriores, no SQL Editor. Publicar o frontend em seguida. A migração passa a exigir ponto nas novas reservas/remarcações; cadastrar locais no admin antes de liberar a agenda aos alunos. Aulas existentes permanecem intactas e mostram “combine com a equipe” quando não há local salvo.

Admin → Pontos de encontro: nome, endereço/bairro, Google Maps, orientação, instrutor, categoria, dias e período. O período deve abranger toda a aula. Para locais com períodos distintos, cadastrar entradas separadas. Não há cálculo de rota: o admin deve ajustar os intervalos da agenda para deslocamentos. Pontos inativos não aparecem em novas reservas; usar Editar/desativar preserva histórico.

Fluxo: aluno escolhe categoria/dia/horário, consulta pontos válidos e confirma. Um ponto único é pré-selecionado. A escolha de horário sozinha não reserva crédito. Admin também escolhe ponto ao agendar ou remarcar. As funções existentes de autorização, jornada/LADV, saldo e conflito são chamadas dentro da mesma transação. O lock de agenda também protege alterações dos pontos.

Nome, endereço, link e orientação são copiados pelo servidor para a aula; nenhuma dessas informações é aceita do navegador na confirmação. Remarcar revalida o ponto e registra antigo/novo local no histórico; a rotina existente reabre a notificação no painel. Não há envio automático de WhatsApp.

Validação local: build e testes de interface com Supabase simulado. Validação real necessária após aplicar SQL: reservar com saldo, rejeitar ponto de outro instrutor/categoria/período ou inativo, conferir que falhas não consomem crédito, testar duas reservas concorrentes, alterar endereço e conferir snapshot antigo, remarcar e conferir histórico, login de instrutor sem acesso a aulas alheias. O schema e funções não foram executados no banco de produção pelo assistente.
