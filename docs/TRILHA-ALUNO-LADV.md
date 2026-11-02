# Trilha do aluno e envio de LADV

Implementação de 02/11/2026. A publicação do site não aplica a migration no Supabase.

## Ativação

No SQL Editor do projeto Habilita+, execute integralmente `docs/supabase-dashboard/trilha-aluno-ladv.sql`. O arquivo corresponde à migration `202611020003_student_onboarding_ladv.sql` e depende das migrations anteriores de jornada e LADV por categoria.

Depois, entre como aluno de primeira habilitação e atualize a página. Sem essa ativação, a tela informa que a equipe precisa ativar a trilha.

## Comportamento

- Nove etapas expansíveis: requerimento, teoria, abertura do processo, exames médico e psicológico juntos, prova teórica, envio da LADV, prática, prova prática e toxicológico.
- As orientações podem ser consultadas livremente; a declaração de conclusão exige as etapas anteriores e ciência de veracidade.
- A primeira habilitação permanece na trilha, sem menu do portal, até concluir as cinco declarações iniciais e enviar a LADV de todas as categorias escolhidas. A+B exige os dois documentos.
- Aulas de reforço para quem declara já ser habilitado preservam a dispensa de trilha solicitada anteriormente.
- Alunos existentes de primeira habilitação também devem preencher as novas declarações e enviar o documento. Créditos, pagamentos e aulas existentes são preservados.
- Cada upload aceita PDF/JPG/PNG de até 5 MB. O bucket é privado; aluno proprietário e administração podem consultar por link temporário. Substituições preservam arquivos anteriores.
- Não há integração oficial nem verificação automática de autenticidade. Não se solicita laudo médico; apenas declaração de conclusão.
- A declaração e o caminho do documento são gravados somente depois do upload. Falha no envio mantém o bloqueio.
- O banco exige a trilha e a existência do arquivo ao agendar, inclusive em operações administrativas. Saldo, disponibilidade e demais regras de agendamento permanecem.
- A prática informa a quantidade de aulas realizadas na plataforma separadamente da carga horária oficial. Não considera automaticamente duas aulas de qualquer duração como duas horas.
- Após declarar a prática concluída, o aluno informa a data do exame de cada categoria. As declarações são auditadas, não são registros oficiais.

## Validação

Testes automatizados de interface usam Supabase simulado: progressão, A+B, persistência após recarga, erro de upload e acesso de aluno habilitado. Testes unitários verificam o bloqueio por categoria. Build de produção deve ser executado antes da publicação.

A migration foi revisada, mas não executada contra o Supabase remoto neste ambiente. Após aplicá-la, conferir com uma conta de teste o upload privado, a gravação das declarações e a tentativa de agendamento antes/depois da LADV.

Fonte das orientações: [Detran-SP / Poupatempo](https://poupatempo.sp.gov.br/carta/391270A7-15C2-4FC2-BE72-38C4D14B4A1C), conferida em 02/11/2026. As condições oficiais podem mudar.
