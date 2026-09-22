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
- Estado inicial sem pacotes. WhatsApp padrão: **(12) 99622-5250**, alterável no painel. O contato vazio da versão inicial é atualizado automaticamente; números já configurados são preservados.
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
