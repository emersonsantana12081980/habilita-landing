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
- Liberação/bloqueio de horários e solicitação demonstrativa de agendamento.
- Persistência em localStorage e sincronização entre abas da mesma origem.
- Estado inicial sem pacotes. WhatsApp padrão: **(12) 99622-5250**, alterável no painel. O contato vazio da versão inicial é atualizado automaticamente; números já configurados são preservados.
- Chat demonstrativo com respostas locais; não usa uma API de IA.

## Limites desta versão

Os dados ficam apenas no navegador e não são compartilhados entre dispositivos. `/admin` não tem autenticação. Não cadastre dados pessoais reais nesta demonstração. Agendamentos não são confirmados automaticamente; não há cobrança, QR Pix, envio automático de WhatsApp ou backend conectado. O botão WhatsApp abre uma mensagem para envio manual.

Para produção: implementar autenticação e autorização, banco com regras de acesso, reserva transacional de horários, backend para IA, checkout e webhook autenticado e idempotente do provedor de pagamentos. Segredos devem permanecer no servidor. Implementar consentimento e política de privacidade antes de capturar dados reais.

## Vercel

Importe o repositório como Vite, com comando `npm run build` e saída `dist`. O arquivo `vercel.json` oferece fallback de rotas para `/admin`.

## Verificação dos fluxos

```sh
npm test
npm run test:e2e
```

Os testes de navegador usam o Google Chrome instalado, iniciam o Vite automaticamente e cobrem desktop e celular: pacotes, edição/exclusão, sincronização entre abas, configurações, disponibilidade, solicitação de aula, chat e navegação. As capturas ficam em `artifacts/`, e falhas geram rastros em `test-results/`. Os testes interceptam o link de WhatsApp; nenhuma mensagem é enviada.

No PowerShell com restrição a scripts, use `npm.cmd` no lugar de `npm`.
