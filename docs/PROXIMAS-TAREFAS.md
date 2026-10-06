# HABILITA+ — próximas tarefas

Registrado em 05/10/2026, após avaliação do código. O responsável pediu para salvar e executar depois. Esta lista não autoriza iniciar agora as implementações.

Atualização de 06/10/2026: o responsável autorizou iniciar as correções e continuar as melhorias. Progresso local descrito em [ENTREGA-2026-10-06.md](ENTREGA-2026-10-06.md). A alteração de banco ainda depende de aplicação e teste remoto.

## Situação atual

- Site publicado: https://habilita-landing.vercel.app
- Última versão publicada: `d3db1e7`.
- Cadastro gratuito nos botões principais, WhatsApp no topo e agente flutuante.
- Alunos em lista com busca, filtros, arquivo morto e restauração.
- Pedidos do administrador em Kanban: Solicitado, Em análise e Finalizado; resultado aprovado ou recusado.
- Pedidos do aluno em lista compacta e recolhida.
- Preços de demonstração, parcelamento e cupons configuráveis.
- Pagamentos online e notificações externas continuam para uma etapa posterior.
- Avaliação baseada no código; não incluiu entrar em contas reais de produção.

## 1. Corrigir os fluxos operacionais

- [ ] **Revisar o botão Excluir agendamento.** A interface tenta apagar diretamente a aula, mas as migrações não concedem essa permissão. Substituir pela operação de cancelamento, preservando o histórico e aplicando a regra de crédito já existente. Conferir lista e popup para evitar ações divergentes.
  - Aceite: nenhum botão informa exclusão que o banco não realiza; cancelamento atualiza a agenda e o saldo corretamente, sem apagar o histórico.
- [ ] **Permitir finalizar por recusa pedidos de alunos arquivados.** Hoje `resolve_package` exige aluno ativo também para recusar. Manter a exigência de aluno ativo para aprovação/liberação de créditos.
  - Aceite: administrador recusa pedido de aluno inativo; aprovação continua bloqueada; o pedido sai das pendências sem gerar crédito.

## 2. Melhorar o início da área do aluno

- [ ] **Mostrar pacotes ativos.** Exibir nome, aulas contratadas, utilizadas/reservadas e saldo por categoria, com critérios claros quando houver mais de um pacote.
  - Antes de implementar: definir como atribuir consumo a pacotes; o saldo atual é agregado por categoria. Não inventar um consumo individual sem rastreabilidade.
- [ ] **Exibir a próxima ação adequada.** Sem pacote: escolher pacote; com solicitação pendente: acompanhar pedido; com crédito: agendar aula.
- [ ] **Completar o resumo da próxima aula.** Data, horário, categoria, instrutor, veículo e ponto de encontro confirmado. Dados ausentes devem ter orientação clara.
- [ ] **Explicar impedimentos de agendamento.** Diferenciar saldo insuficiente, ausência de vagas e cadastro inativo, com instrução de próximo passo.
- [ ] **Adicionar resumo compacto dos pedidos no início.** Mostrar a quantidade e a etapa, com acesso à lista existente.
  - Aceite geral: testar aluno novo, pedido em análise, pacote aprovado com saldo, saldo esgotado e cadastro inativo, em celular e computador.

## 3. Criar a ficha completa do aluno no administrador

- [ ] Reunir dados cadastrais, situação, pacotes/pedidos, créditos e aulas em uma única ficha.
- [ ] Permitir acessar edição, arquivamento/restauração e histórico sem perder a busca da lista.
- [ ] Criar extrato de créditos: concessão, reserva/uso e devolução, com data, motivo e referência ao pedido ou aula.
- [ ] Definir e registrar trilha de auditoria das ações administrativas: quem fez, quando e motivo; aproveitar registros existentes de alterações de aulas.
  - Aceite: saldo reconciliável com pedidos e aulas; sem permitir alteração direta de créditos pelo navegador; acesso restrito aos perfis autorizados.

## 4. Melhorar o controle diário do administrador

- [ ] **Resumo inicial:** aulas de hoje, pedidos aguardando análise, alunos ativos e horários livres, com links para os respectivos filtros.
- [ ] **Filtros no Kanban:** nome do aluno, período, categoria e resultado; limitar/paginar os pedidos finalizados.
- [ ] **Busca e paginação no banco:** evitar carregar todas as linhas de várias tabelas a cada atualização; manter contagens e filtros corretos.
- [ ] Preservar filtros e posição útil depois de salvar, arquivar ou restaurar.
  - Aceite: validar listas vazias, vários resultados, paginação e falhas de carregamento; não mostrar registros de outro aluno a usuários sem autorização.

## 5. Finalizar informações da página de vendas

- [ ] Confirmar duração das aulas.
- [ ] Confirmar ponto de encontro, locais e região atendida.
- [ ] Confirmar cobertura, prazo, utilizações e possíveis taxas do reteste.
- [ ] Levar informações comerciais e links para configurações no administrador.
- [ ] Preparar e validar textos de privacidade e termos antes de substituir os avisos de pendência.
- [ ] Substituir valores fictícios somente quando o responsável definir os preços à vista e parcelados.
- [ ] Cadastrar depoimentos reais autorizados e preparar sua integração com o catálogo cloud.
- [ ] Revisar textos que ainda apresentam WhatsApp como início obrigatório: o fluxo principal passou a ser cadastro gratuito, mantendo atendimento para dúvidas.
- [ ] Atualizar a documentação antiga e testes de demonstração que ainda descrevem os CTAs anteriores; preservar os testes atuais do cadastro.
  - Aceite: nenhuma condição comercial inventada; site e área do aluno apresentam informações coerentes; botões de cadastro, WhatsApp e agente funcionam nas larguras de celular e computador.

## 6. Etapa posterior — ainda adiada

- [ ] Integrar pagamento com validação no servidor, webhook e proteção contra liberação duplicada de créditos.
- [ ] Integrar notificações externas de confirmação, cancelamento e lembretes, após definir canal e provedor.
- [ ] Definir relatórios financeiros com base em recebimentos efetivamente registrados; pedido aprovado manualmente não equivale a pagamento recebido.

## Como retomar

Começar pela seção 1. Implementar e testar cada bloco; documentar mudanças de banco e aplicá-las antes da publicação dependente. Não apagar cadastros, pedidos ou aulas reais para realizar testes. Marcar tarefas concluídas somente com a respectiva validação.

Nenhuma tarefa desta lista foi implementada durante seu registro.
