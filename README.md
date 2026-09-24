# HABILITA+

Landing page responsiva e painel local em React + Tailwind CSS, com imagens originais fornecidas no briefing.

## Executar

```sh
npm install
npm run dev
```

Abra a URL exibida pelo Vite. A página pública fica em `/` e o painel em `/admin`.

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

## Google Agenda sem banco próprio

A página fornecida pelo instrutor (`https://calendar.app.google/C6k6Voem3xcnGDSe6`) está configurada como padrão em `src/google-calendar.js`, usando o endereço completo de destino para incorporação. Não é necessário configurar uma variável na Vercel para essa página. `VITE_GOOGLE_BOOKING_URL` pode substituir o padrão em futuras alterações; valor vazio desativa o padrão e permite testar pelo painel. Os testes automatizados usam esse modo sem configuração global.

Configure `VITE_GOOGLE_BOOKING_URL` na Vercel com o link público **da página de agendamento** e faça um novo deploy. Não use o link de calendário público, ID da agenda, senha ou chave de API. A variável contém somente um link público. Para testar localmente, use o campo nas configurações do painel; ele não publica a configuração para outros visitantes. A configuração de produção tem prioridade sobre o teste local.

Crie a página no Google Agenda pelo computador em Criar > Agendamento de horários. Defina duração, dias, fuso horário, local, antecedência e intervalos. Mantenha a verificação de disponibilidade e registre os bloqueios de instrutor/veículo na agenda consultada. Adicione campos para WhatsApp, pacote e categoria no formulário do Google. Copie o link em Páginas de agendamento de horário > Copiar link.

Quando configurado, o fluxo de pacote usa a página do Google e não grava solicitações locais. Links completos de `calendar.google.com/calendar/appointments/schedules/` podem ser incorporados; links curtos `calendar.app.google` abrem em nova aba. O Google gerencia disponibilidade, reserva e cancelamento. O site não lê eventos privados, não recebe confirmação automática de reserva, não associa automaticamente o pacote e não confirma pagamento. Cada reserva corresponde a um horário. Uma página compartilhada não faz distribuição automática entre instrutores/veículos; configure os recursos no Google antes de oferecer reservas.

Guia oficial: https://support.google.com/calendar/answer/10729749?hl=pt-BR

Os cards de categoria mostram o preço à vista e o comando “Ver pacote e valores”. O WhatsApp de cada pacote recebe uma mensagem com nome, categoria e preço atuais. As condições do reteste podem ser editadas por pacote; quando não preenchidas, o site pede confirmação com o instrutor, sem presumir prazos ou taxas.

O painel permite cadastrar, editar e excluir depoimentos reais. Apenas relatos ativos e marcados como autorizados aparecem perto dos pacotes. Não há depoimentos fictícios pré-cadastrados. Como os dados ainda usam localStorage, alterações no painel são locais ao navegador e não são publicadas para outros visitantes.
