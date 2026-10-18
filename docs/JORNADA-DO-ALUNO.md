# Jornada do aluno

## LADV e ciência

Para ativação manual, executar inteiro `docs/supabase-dashboard/ativar-jornada-ladv.sql`. Esse arquivo reúne a jornada e a LADV numa transação e pode ser reaplicado. Não substitui a migration anterior de exclusão de cadastros. Nenhum SQL foi executado remotamente nesta sessão.

Primeira habilitação exige, além das quatro etapas, declaração explícita de LADV e veracidade. Duas caixas desmarcadas inicialmente; confirmação grava data no servidor e histórico append-only com autor, versão e aceites. Somente o próprio aluno pode declarar. Retirar a declaração bloqueia novas reservas. Habilitados continuam dispensados para reforço, conforme escolha do responsável.

O trigger do banco cobre novas aulas, remarcações e reativação de reservas. Sem declaração, o frontend também bloqueia o botão mesmo antes da ativação do SQL. Não há validação oficial da LADV. Texto v1: “Informo que possuo LADV válida para a categoria das aulas que vou agendar.” e “Declaro que as informações prestadas são verdadeiras e estou ciente de que devo apresentar minha LADV à equipe antes das aulas práticas.”

LADV por categoria: aplicar o arquivo consolidado acima ou, se as migrations 002 e 003 já foram aplicadas, executar `supabase/migrations/202610180004_ladv_by_category.sql`. A declaração v2 registra categoria, autor, data e os dois aceites. Declarações antigas não liberam automaticamente carro e moto: o aluno confirma novamente cada categoria. A confirmação salva substitui o formulário pelo status; retirar a declaração bloqueia somente a categoria correspondente. A aprovação de um pacote não confirma LADV. O trigger também cobre alterações de categoria da aula.

Até aplicar a atualização, o frontend bloqueia agendamentos de primeira habilitação sem a confirmação da categoria. Após aplicação, as novas colunas retornadas ao recarregar ativam os formulários.

## Cadastro sem confirmação de e-mail

No Supabase, em Authentication → Sign In / Providers → Email, desligar **Confirm email** e salvar. É uma configuração do projeto, não do formulário React. O fluxo existente aceita a sessão retornada no cadastro e abre imediatamente a área do aluno. Mantém e-mail para login e recuperação e não pede endereço residencial. A opção afeta também outros cadastros desse projeto. Enquanto estiver ligada, a interface continua informando a exigência real do servidor. Na verificação de 18/10/2026, `mailer_autoconfirm` ainda retornou `false`; não foi possível alterar a configuração com as credenciais públicas disponíveis.

Aluno informa cadastro no Detran, exames médico/psicológico, formação e avaliação teórica como não informado, em andamento ou concluído. Para primeira habilitação, as quatro etapas concluídas são pré-requisito de agendamento. O próprio aluno declara que já é habilitado para aulas de reforço, dispensando essas etapas. Não se trata de verificação oficial do Detran.

Aulas práticas são calculadas exclusivamente por aulas com status completed. Mínimo operacional escolhido pelo responsável: 2 aulas por categoria, separadamente para A/B. Não é uma afirmação sobre carga horária legal nem conclusão oficial da CNH. Faltas, cancelamentos e reservas não contam.

Após duas aulas por categoria, aluno informa a data do exame dessa categoria. Datas passadas novas são recusadas. Vazio remove a data. A equipe consulta na lista de alunos ou na ficha. Não agenda exame em órgão externo e não envia mensagens fora da plataforma.

RPCs autorizam somente o próprio aluno ou administrador, validam cadastro ativo e entradas permitidas. Preservam regras anteriores de crédito, antecedência, limite diário e concorrência. Trigger adicional cobre remarcações e inserções diretas de aulas. Etapas e reservas usam a trava de agenda existente para evitar corrida. Não muda créditos ou pagamentos.

Validação local: build, testes unitários de etapas/contagem e Playwright desktop/mobile com Supabase simulado. A migration precisa ser aplicada e validada no banco real; não foi executada remotamente nesta sessão.
