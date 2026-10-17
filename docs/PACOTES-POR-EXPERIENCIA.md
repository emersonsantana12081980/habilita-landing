# Prévia: pacotes por experiência

## Atualização: cadastro pelo administrador

A associação manual descrita abaixo foi substituída pelo cadastro no administrador: Categoria + Nível de experiência. O site consulta os campos salvos no pacote para escolher o quadro.

Antes de publicar, executar `supabase/migrations/202610170005_package_experience.sql` no SQL Editor do Supabase. Não foi executado remotamente nesta sessão. Preserva os registros antigos sem quadro e acrescenta um índice único para impedir dois pacotes ativos na mesma categoria/experiência, inclusive sob concorrência. As políticas de autorização existentes permanecem.

No administrador: Catálogo → Pacotes → Novo cadastro ou Editar. Escolher categoria e nível, preencher duração, valores e condições. Desmarcar demonstração e confirmar os dados para mostrar preços. Para substituir um pacote, editar o existente ou desativá-lo antes de ativar outro no mesmo quadro.

Build e sete testes Node passaram, incluindo isolamento das nove combinações, duplicidade, dados incompletos e soma A/B. Migration ainda requer aplicação e validação no banco.

Não publicar sem autorização explícita. A versão atual é de consulta: nenhuma das nove combinações tem condições comerciais confirmadas. O site publicado continua na versão anterior até aprovação.

## Alterações

Seleção de carro B, moto A ou A/B; exatamente três cards por experiência. WhatsApp é a ação principal e reutiliza o contato configurado. Cadastro preserva categoria/experiência na URL e exibe resumo na área do aluno; não cria pedido ou conta automaticamente. O ID de pacote só entra na URL quando existe associação explícita e oferta validada.

Os registros antigos do banco foram preservados. As associações estão em `src/data/experience-plans.js`, todas pendentes. Cada combinação deve apontar para o ID/slug correto de um pacote existente. Só são mostrados preços de pacotes ativos, explicitamente não demonstrativos, com condições aprovadas, duração e quantidade válidas. Para A/B, exige discriminação de valores que some o total e horas por categoria. Não utiliza o cálculo de demonstração do helper antigo. Parcelas desiguais por centavos são discriminadas, sem arredondar todas para cima.

## Dados pendentes

- Preço à vista, total no cartão, número de parcelas e forma de contratação do parcelamento, para os nove perfis.
- Quantidade e minutos por aula, com divisão A/B; não inferir 2 aulas = 2 horas.
- Veículo para exame, reteste, cancelamento, reagendamento e exclusões.
- Número oficial: código/configuração anterior usa 5512996225250; imagem hero-960.webp contém (12) 99123-4567. Não alteramos a imagem ou o contato sem confirmação. Cabeçalho e botões novos reutilizam `contact()` com `site_settings.whatsapp`.

A carga mínima legal é informativa, separada da oferta: https://detran.sp.gov.br/cnhpaulista/ e Resolução Contran 1020/2025 (duas horas para cada categoria em A/B). Não há promessa de aprovação. Revisar condições vigentes ao publicar.

O restante da página, cadastro administrativo e cobrança não foi redesenhado. Três respostas do FAQ diretamente relacionadas a quantidade/duração/preços foram ajustadas para não afirmar que todos os cards já têm oferta numérica. O restante do portal ainda contém o fluxo anterior de pacotes e pagamentos de demonstração, fora do escopo desta seção.

Validação: testes Node para ofertas incompletas/demonstração, mapeamento de categoria e valores A/B; Playwright para nove combinações, links de cadastro e WhatsApp, teclado e quatro tamanhos de tela. Nenhum envio de WhatsApp, criação de conta ou pagamento real.
