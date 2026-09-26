# HABILITA+

Landing page responsiva e painel local em React + Tailwind CSS, com imagens originais fornecidas no briefing.

## Executar

```sh
npm install
npm run dev
```

Abra a URL exibida pelo Vite. A página pública fica em `/` e o painel em `/admin`.

## Área do aluno (prévia local, sem autenticação)

O fluxo público agora é **venda → `/cadastro?pacote=ID` → cadastro gratuito → solicitação de pacote → liberação manual → agendamento com crédito → aviso no painel**. Não há calendário ou janela de agendamento na página de vendas. “Criar minha conta grátis” abre `/cadastro`; “Área do aluno” abre somente o login em `/aluno`. Após entrar: Início, Meus pacotes, Minhas aulas e Meu perfil, com botão separado para agendar.

- Use apenas dados fictícios. O cadastro cria um cliente com zero créditos. O login demonstrativo usa o e-mail cadastrado e a senha compartilhada `habilita-demo`, exibida na tela. A senha digitada não é persistida. Não há verificação de e-mail, login seguro ou Supabase nesta etapa. A sessão fica no sessionStorage; sair remove a sessão. Não há seletor público de cadastros. “Esqueci minha senha” informa a limitação e não envia e-mail. Isso não é controle de acesso para produção.
- Meu perfil permite editar nome e WhatsApp, preservando créditos e histórico. O e-mail permanece somente leitura. Mudança/recuperação de senha real depende da futura autenticação.
- O aluno solicita um pacote sem pagar. O pedido guarda nome, preço e quantidade de aulas naquele momento. Em `/admin` → **Pedidos de alunos**, o instrutor revisa, informa um motivo e libera ou recusa. A aprovação soma os créditos uma única vez por pedido e preserva o histórico; não lança recebimento financeiro automaticamente.
- A agenda pode ser consultada sem saldo. Confirmar exige um crédito livre da categoria, cadastro ativo, instrutor compatível e veículo disponível. Ao agendar, o crédito é reservado e uma notificação aparece no painel. Realização/falta consome a aula; cancelamento pelo instrutor devolve o crédito. Remarcação/cancelamento pelo aluno é solicitado via WhatsApp, sem alteração automática.
- A área mostra as próprias aulas e pedidos do cadastro selecionado. Esse filtro é apenas visual: todos os dados da demonstração estão no localStorage, acessível no dispositivo. A notificação sincroniza entre abas da mesma origem, não entre celulares. Nenhum cadastro, aula ou pagamento real deve ser usado antes do backend.
- O mesmo Chatvolt está disponível na área do aluno, respeitando a opção de atendimento do painel. O botão WhatsApp abre uma mensagem manual.

### Conexão de produção pendente

Será necessário criar/configurar o projeto Supabase e implementar autenticação, permissões por aluno/instrutor, migração dos dados e operações transacionais no servidor. O aluno não poderá editar créditos, liberar pedidos ou consultar aulas de terceiros. O agendamento deverá reservar crédito e horário atomicamente, com bloqueio de conflitos de aluno, instrutor e veículo. A notificação deverá ser persistida no banco. A futura API de pagamento deverá liberar créditos somente após confirmação autenticada e idempotente do provedor. A prévia atual não implementa essas garantias e não deve ser publicada como sistema de produção.

## Gerenciador do instrutor (demonstração local)

A aba **Faturamento** registra vendas vinculadas a clientes, com valor negociado e até 12 parcelas mensais. Valores são armazenados em centavos; parcelas preservam o total e ajustam vencimentos ao último dia de meses curtos. O preço atual do pacote é apenas sugestão ao criar a venda; cadastros existentes não geram dívidas automaticamente.

O resumo separa vendas pela data da venda e recebimentos pela data do pagamento, no mês selecionado. Saldo e atraso incluem todos os períodos (vencimento hoje não está em atraso). É possível registrar pagamentos parciais, consultar histórico, estornar registros e cancelar vendas sem recebimentos ativos. Estornos preservam o histórico, reabrem saldo e não devolvem dinheiro por banco. Valores brutos, sem cálculo de taxas, juros, despesas ou lucro. Não há cobrança real, nota fiscal ou integração bancária. Vendas não alteram o saldo de aulas. Dados financeiros também ficam apenas no navegador.

`/admin` abre a gestão de **Hoje, Clientes, Agenda e Expediente**. O painel anterior de pacotes, instrutores e configurações do site continua em `/admin?view=site`.

1. Cadastre um cliente fictício com WhatsApp, categoria e pacote (ou quantidade manual de aulas).
2. Ajuste o expediente: exemplo inicial de segunda a sexta, 08h–18h, aulas de 50 minutos e intervalo de 10 minutos. O fuso utilizado é o do dispositivo.
3. Na Agenda, escolha dia, cliente, categoria, instrutor e veículo. Só aparecem horários futuros livres, dentro do expediente e com saldo suficiente. O sistema considera sobreposição e intervalo do cliente, instrutor e veículo.
4. A lista do dia permite cancelar; após o término permite marcar realizada ou falta. Agendadas reservam saldo, realizadas e faltas consomem uma aula, canceladas liberam saldo e horário. O histórico permanece ao arquivar clientes. Os totais contratados são uma cópia do pacote no cadastro e não mudam quando a oferta pública é editada.

Esta agenda é independente do Google e das solicitações demonstrativas antigas. Veículos iniciais: Fiat Mobi (B) e moto de instrução (A). Não há pagamento, envio de mensagens, login ou banco nesta etapa. Somente dados fictícios. A persistência usa localStorage e não garante exclusão mútua entre gravações simultâneas em abas diferentes; uso real exige reservas transacionais no servidor. Não há sincronização entre dispositivos. A página de vendas não foi alterada nesta etapa.

```sh
npm run build
npm run preview
```

## Recursos

- Cadastro, edição, exclusão e ativação de pacotes.
- Configuração de cidade, WhatsApp e visibilidade do chat.
- Cadastro, edição, exclusão e ativação de instrutores em `/admin#admin-instrutores`: nome, categorias, cidade, apresentação e foto por URL HTTPS.
- Perfil inicial de **Emerson Santana** em `src/data/instructors.js`, com foto local e descrição baseada nos dados fornecidos: 15 anos de atuação e contribuição na formação de mais de 5 mil alunos. O perfil é adicionado uma vez aos navegadores antigos; edições, inativação e exclusão feitas no painel são preservadas. Por estar no código, esse perfil aparece também para novos visitantes após a publicação.
- Seção pública `/#instrutores` com filtro por categoria e escolha do instrutor. O agendamento oferece apenas perfis compatíveis e guarda o nome escolhido no histórico e na mensagem de WhatsApp.
- Liberação/bloqueio de horários e solicitação demonstrativa de agendamento.
- Persistência em localStorage e sincronização entre abas da mesma origem.
- Pacotes iniciais em `src/data/packages.js`: carro (2 aulas, R$ 299,00), moto (2 aulas, R$ 169,90) e carro + moto (2 aulas de cada, R$ 399,99). Incluem veículo para exame, reteste grátis e opções de 3x no cartão e 6x no boleto, conforme o exemplo fornecido. Não há cálculo de juros ou cobrança real.
- Os cards de categoria começam recolhidos, com foto, título e controle de expansão. Ao abrir, mostram os pacotes ativos daquela categoria e permitem solicitar o agendamento. O painel edita os mesmos dados exibidos nas categorias, na seção de pacotes e no agendamento. Exclusões, inativação e alterações são preservadas após recarregar.
- WhatsApp padrão: **(12) 99622-5250**, alterável no painel. O contato vazio da versão inicial é atualizado automaticamente; números já configurados são preservados.
- Atendimento Chatvolt pelo botão flutuante **Chame especialista**, com o agente `cmkoa8q6501ypkh1566oeotza`. O embed oficial é carregado ao clicar no botão; pode ser desativado nas configurações do painel. As respostas são configuradas no Chatvolt, não no código da página.

## Limites desta versão

Os dados administrativos ficam apenas no navegador e não são compartilhados entre dispositivos. `/admin` não tem autenticação. Não cadastre dados pessoais reais nesta demonstração. Agendamentos não são confirmados automaticamente; não há cobrança, QR Pix ou envio automático de WhatsApp. O botão WhatsApp abre uma mensagem para envio manual. O chat utiliza o serviço externo Chatvolt e depende da disponibilidade e configuração do agente, inclusive dos domínios autorizados.

Integração baseada na [referência oficial do Chatvolt](https://docs.chatvolt.ai/widgets/chatbot/reference). Autorize o domínio público da Vercel no Chatvolt, caso tenha ativado a restrição de domínios. As conversas do chat não sincronizam automaticamente os pacotes e instrutores locais.

A escolha do instrutor representa uma preferência, sujeita a confirmação pela equipe. A agenda continua compartilhada entre os instrutores. Cadastrar um perfil no painel da Vercel não o publica para outros visitantes: essa etapa depende da integração com banco de dados. Perfis excluídos ou inativos deixam de ser selecionáveis, mas o nome registrado nas solicitações anteriores é preservado.

Para produção: implementar autenticação e autorização, banco com regras de acesso, reserva transacional de horários, backend para IA, checkout e webhook autenticado e idempotente do provedor de pagamentos. Segredos devem permanecer no servidor. Implementar consentimento e política de privacidade antes de capturar dados reais.

## Vercel

Importe o repositório como Vite, com comando `npm run build` e saída `dist`. O arquivo `vercel.json` oferece fallback de rotas para `/admin`.

## Verificação dos fluxos

```sh
npm test
npm run test:e2e
```

Os testes de navegador usam o Google Chrome instalado, iniciam o Vite automaticamente e cobrem desktop e celular: pacotes, edição/exclusão, sincronização entre abas, configurações, disponibilidade, solicitação de aula, chat e navegação. As capturas ficam em `artifacts/`, e falhas geram rastros em `test-results/`. A suíte normal simula o módulo Chatvolt e intercepta o link de WhatsApp; nenhuma mensagem é enviada. A verificação opcional com `CHATVOLT_LIVE=1` abre o agente real, sem enviar mensagens.

No PowerShell com restrição a scripts, use `npm.cmd` no lugar de `npm`.
# Melhorias de contato e conteúdo

## Google Agenda (integração anterior, fora do fluxo público atual)

A página fornecida pelo instrutor (`https://calendar.app.google/C6k6Voem3xcnGDSe6`) está configurada como padrão em `src/google-calendar.js`, usando o endereço completo de destino para incorporação. Não é necessário configurar uma variável na Vercel para essa página. `VITE_GOOGLE_BOOKING_URL` pode substituir o padrão em futuras alterações; valor vazio desativa o padrão e permite testar pelo painel. Os testes automatizados usam esse modo sem configuração global.

Configure `VITE_GOOGLE_BOOKING_URL` na Vercel com o link público **da página de agendamento** e faça um novo deploy. Não use o link de calendário público, ID da agenda, senha ou chave de API. A variável contém somente um link público. Para testar localmente, use o campo nas configurações do painel; ele não publica a configuração para outros visitantes. A configuração de produção tem prioridade sobre o teste local.

Crie a página no Google Agenda pelo computador em Criar > Agendamento de horários. Defina duração, dias, fuso horário, local, antecedência e intervalos. Mantenha a verificação de disponibilidade e registre os bloqueios de instrutor/veículo na agenda consultada. Adicione campos para WhatsApp, pacote e categoria no formulário do Google. Copie o link em Páginas de agendamento de horário > Copiar link.

Os componentes anteriores e a configuração foram preservados, mas não são chamados pela página pública atual. O agendamento agora ocorre na área do aluno e usa a agenda local do gerenciador. Não existe sincronização entre essa agenda e o Google.

Guia oficial: https://support.google.com/calendar/answer/10729749?hl=pt-BR

Os cards de categoria mostram o preço à vista e o comando “Ver pacote e valores”. O WhatsApp de cada pacote recebe uma mensagem com nome, categoria e preço atuais. As condições do reteste podem ser editadas por pacote; quando não preenchidas, o site pede confirmação com o instrutor, sem presumir prazos ou taxas.

O painel permite cadastrar, editar e excluir depoimentos reais. Apenas relatos ativos e marcados como autorizados aparecem perto dos pacotes. Não há depoimentos fictícios pré-cadastrados. Como os dados ainda usam localStorage, alterações no painel são locais ao navegador e não são publicadas para outros visitantes.
