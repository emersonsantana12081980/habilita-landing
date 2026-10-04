# Revisão da landing HABILITA+ — 04/10/2026

Referência: [PRD fornecido pelo responsável](PRD-LANDING-HABILITA.md).

## Implementado

- Ordem: header → hero → atendimento → como funciona → pacotes → transparência → diferenciais → instrutores → prova social → FAQ → CTA final → rodapé.
- Uma seção completa de pacotes, carregada do catálogo. WhatsApp é a ação principal; cadastro gratuito é acesso secundário no rodapé.
- Hero descreve aulas práticas e distingue a oferta do processo completo da CNH. Removidas urgência de lançamento e promessa implícita de aprovação.
- Cards com preços à vista, aulas, veículo conforme catálogo, duração pendente, itens não anunciados como incluídos e condições expansíveis.
- Reteste comunicado como condição a confirmar, sem prometer exame gratuito. Parcelas não são calculadas sobre o preço à vista quando o total financiado é desconhecido.
- `installmentText` calcula em centavos quando o total é validado; arredondamento é distribuído entre parcelas e preserva o total exato.
- Um perfil: sem filtro e sem promessa de escolha. Múltiplos: filtros por categoria e região (quando houver mais de uma), contato individual. Não foram criadas notas ou credenciais.
- Biografia de Emerson preservada conforme informações fornecidas anteriormente pelo responsável, sem alegar verificação de registro profissional.
- Prova social preparada: apenas relatos ativos e autorizados são exibidos. Na ausência, aviso explícito de conteúdo ainda não publicado.
- FAQ com 15 perguntas; não foram afirmados requisitos legais locais nem preços de taxas.
- WhatsApp oficial já autorizado: 12 99622-5250. Usa configuração do catálogo, mensagens por pacote/categoria/instrutor e fallback para contato ausente. Corrigido fallback antigo que substituía número vazio do banco por número de demonstração.
- Menu com Escape/foco, accordions nativos, contraste do CTA aumentado, alvos de toque, imagens com dimensões, animação reduzida. Assistente na landing fica no fluxo; não cobre preços/CTAs. Nas áreas internas mantém o comportamento anterior.
- Title, description, canonical, Open Graph, robots e sitemap. Rotas de acesso com cabeçalho `X-Robots-Tag: noindex, nofollow` na Vercel. Não foi criado schema LocalBusiness sem endereço/dados validados.
- Imagens WebP derivadas dos arquivos existentes; marca e foto do instrutor reaproveitam versões otimizadas. Nenhuma imagem nova foi gerada.
- Código das áreas internas carregado sob demanda. A landing continua React/Vite, sem prerender de catálogo; avaliar SSR/prerender se SEO orgânico exigir conteúdo estático no HTML inicial.

## Pendências de validação comercial

Editar `src/data/landing.js` somente com informações confirmadas. Preços, aulas e perfis continuam editáveis no painel.

| Informação | Estado / comportamento atual |
|---|---|
| Minutos por aula | A confirmar. Não inferido da duração de um horário na agenda. |
| Reteste | Confirmar cobertura, prazo, utilizações, taxas, veículo e aulas adicionais. Texto específico do catálogo é exibido quando cadastrado. |
| Cartão/boleto | Número de parcelas cadastrado; juros, totais e valores a confirmar. Configuração aceita total em centavos por pacote. |
| Local e cidades atendidas | Caçapava e região; ponto de encontro/cobertura adicional a confirmar. |
| Reagendamento/cancelamento comercial | Condições a confirmar; regras da conta continuam no banco e não foram alteradas. |
| Dados institucionais | CNPJ, razão social, Maps e Instagram não fornecidos, portanto não inventados. |
| Privacidade e termos | URLs pendentes, sem links fictícios ou texto apresentado como política jurídica aprovada. |
| Depoimentos/avaliações | Precisa de conteúdo real, autorização e eventual fonte verificável. Catálogo cloud atual não possui tabela pública de depoimentos; preparar essa integração antes de cadastrar relatos para produção. |

Os itens pendentes aparecem explicitamente como “a confirmar” ou “pendente de validação”. Não são ofertas novas aprovadas. Esta revisão não ativa pagamentos nem notificações externas.

## Eventos preparados

`src/lib/landing-events.js` dispara `CustomEvent('habilita:conversion')`. Não envia dados a terceiros, não cria cookies, não persiste identificadores e não captura texto de mensagens, nomes, e-mails ou telefones.

| Evento | Disparo |
|---|---|
| page_view | Entrada na landing |
| hero_whatsapp_click / header_whatsapp_click / mobile_whatsapp_click | CTA da respectiva origem |
| package_view | Primeiro encontro do card no viewport |
| package_whatsapp_click | CTA do pacote (id e categoria) |
| package_conditions_open | Expansão das condições |
| guidance_whatsapp_click / instructor_whatsapp_click | Orientação / contato com perfil |
| faq_open | FAQ expandido, identificador numérico |
| final_cta_click / footer_whatsapp_click / specialist_whatsapp_click | Demais origens de contato |
| signup_start | Link de cadastro da landing |
| signup_complete | Auth retorna uma identidade nova; não equivale a e-mail confirmado |
| scroll_depth | 25/50/75/90%, uma vez por carregamento |

Campos permitidos: evento, caminho sem query string, classe de dispositivo, origem, id de pacote, categoria, id da pergunta e percentual. Não existe painel de métricas conectado ainda. Vincular um adaptador aprovado após definir política/consentimento. Campanha (UTM) e cidade de conversão ficam para esse adaptador: não coletar query strings arbitrárias nem localização precisa.

## Validação e limites

Resultado final: compilação aprovada; **54 testes passaram** (12 da landing, 16 cloud, 24 fluxos de demonstração atualizados e 2 de fallback do chat). Dois testes opcionais de Chatvolt real não foram executados. Nenhuma mensagem real, cobrança ou alteração de banco foi disparada pelos testes.

Na última execução local da landing, LCP observado entre 396 e 528 ms e CLS 0 nas quatro larguras, sem limitação de rede/CPU e com catálogo simulado. Esses números são apenas diagnóstico local e não representam desempenho de celulares reais em produção.

Prévia disponível em `http://localhost:5173/` enquanto o servidor local estiver ativo. Esta revisão não foi publicada; o documento exige validação das informações pendentes antes da publicação.

- `npm run build`: compilação de produção.
- `npm exec playwright -- test --config playwright.landing.config.js`: catálogo simulado, 1440/768/390/360px; WhatsApp por categoria, disponibilidade de contato, catálogo vazio, múltiplos instrutores, links semânticos e capturas.
- `npm exec playwright -- test --config playwright.cloud.config.js`: regressão de login, cadastro, administração, edição individual e área do aluno; Supabase simulado, sem alterar dados reais.
- Testes de demonstração atualizados para o novo fluxo comercial; não confundem clique no WhatsApp com compra ou concessão de créditos.
- Imagens: hero original 2.433.883 bytes → 73.784 bytes (960px) / 35.714 (640px); marca 1.169.484 → 6.348; foto Emerson 2.442.152 → 128.140.
- Capturas em `artifacts/prd-*.png`. Performance observada no navegador local não equivale a Core Web Vitals de usuários reais. LCP/CLS coletados por PerformanceObserver nos testes; INP e percentis reais exigem monitoramento em produção. Nenhuma garantia de pontuação Lighthouse.
- Testes em Chrome com viewports/touch emulados, não aparelhos físicos iPhone/Android ou Safari.

## Experimentos posteriores

Rodar um por vez, após validar oferta e ativar mensuração consentida. Manter orçamento/origem comparáveis e acompanhar qualidade dos leads, não apenas cliques.

| Experimento | Hipótese e métrica | Período e decisão |
|---|---|---|
| Hero confiança × preparação para exame | Mensagem específica aumenta conversas qualificadas / visitantes | Pelo menos 2 semanas completas; calcular amostra com taxa atual antes de iniciar, não encerrar pelo primeiro pico |
| CTA “Falar com um instrutor” × “Ver pacotes e valores” | Redução da incerteza pode aumentar contato qualificado | Mesmo desenho/amostra; decidir por conversas qualificadas, com taxa de cadastro como apoio |
| Preço no topo do card × após inclusões | Melhor compreensão reduz dúvidas repetidas | Duas semanas no mínimo + amostra prevista; comparar conversão e perguntas sobre o que inclui |
| Depoimentos antes × depois dos pacotes | Evidência real aumenta confiança | Somente com autorização; comparar contato qualificado e cliques nas condições |

Não testar “Mais escolhido” sem dados nem recomendar pacote arbitrariamente. Próxima ação de marketing: campanha local por categoria, levando à mesma oferta validada, com mensagem de origem distinta e acompanhamento do atendimento. Não iniciar campanhas automaticamente.
