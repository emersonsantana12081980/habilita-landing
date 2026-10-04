# PRD em formato de prompt — Melhoria da Landing Page HABILITA+

## Prompt principal

Você é um especialista sênior em **UX/UI, CRO, copywriting de resposta direta, marketing local, acessibilidade e desenvolvimento frontend**. Sua tarefa é melhorar a landing page pública da HABILITA+, atualmente disponível em:

**https://habilita-landing.vercel.app/**

A HABILITA+ conecta alunos a instrutores autônomos para aulas práticas de direção em Caçapava e região, nas categorias A, B e A/B.

O objetivo principal é aumentar a conversão de visitantes em **conversas qualificadas no WhatsApp**, sem perder credibilidade, clareza ou transparência comercial.

Não faça apenas mudanças estéticas. Reestruture a experiência para que o visitante entenda rapidamente:

1. O que é a HABILITA+;
2. Para quem o serviço é indicado;
3. O que está incluído em cada pacote;
4. O que não está incluído;
5. Quanto custa;
6. Como funciona a contratação;
7. Por que deve confiar na empresa ou no instrutor;
8. Qual é o próximo passo.

---

## Contexto atual

A página já possui:

- Identidade visual baseada em azul-marinho, verde, amarelo e branco;
- Hero com carro caracterizado da HABILITA+;
- Oferta para categorias A, B e A/B;
- Pacotes de R$ 169,90, R$ 299,00 e R$ 399,99;
- Botões para WhatsApp;
- Cadastro de aluno;
- Área do aluno;
- Área do instrutor;
- Seção de vantagens;
- Seção de instrutor;
- FAQ;
- Botão flutuante de contato.

A página apresenta os seguintes pacotes:

### Pacote Moto — Categoria A

- 02 aulas de moto;
- Veículo para o exame;
- Condição de reteste;
- À vista: R$ 169,90;
- Parcelamento anunciado em 3x no cartão e 6x no boleto.

### Pacote Carro — Categoria B

- 02 aulas de carro;
- Veículo para o exame;
- Condição de reteste;
- À vista: R$ 299,00;
- Parcelamento anunciado em 3x no cartão e 6x no boleto.

### Pacote Carro e Moto — Categoria A/B

- 02 aulas de carro + 02 aulas de moto;
- Carro e moto para o exame;
- Condição de reteste;
- À vista: R$ 399,99;
- Parcelamento anunciado em 3x no cartão e 6x no boleto.

**Importante:** não invente informações sobre taxas, duração das aulas, regras do reteste, quantidade de instrutores, avaliações, CNPJ, localização exata ou resultados. Quando a informação não estiver confirmada, use um placeholder editável e destaque que ela precisa ser validada pelo responsável da HABILITA+.

---

## Problemas a resolver

### 1. Proposta de valor genérica

O hero atual comunica lançamento, localização e categorias, mas não deixa suficientemente claro o diferencial da HABILITA+ nem a natureza exata dos pacotes.

### 2. Ambiguidade da oferta

O visitante pode interpretar que os valores apresentados incluem o processo completo da CNH. A nova página deve deixar claro se os pacotes são somente de aulas práticas e veículo para exame ou se incluem outras etapas.

### 3. Reteste pouco transparente

A expressão “reteste grátis” pode parecer contraditória quando acompanhada de ressalvas sobre taxas e condições. A comunicação deve ser comercialmente atrativa, mas juridicamente e operacionalmente clara.

### 4. Pouca prova social

A página precisa de espaço para depoimentos, avaliações, experiência profissional e evidências reais. Não crie depoimentos fictícios.

### 5. Pacotes repetidos

Os pacotes aparecem em mais de uma seção com conteúdo praticamente duplicado. Mantenha uma única seção completa de pacotes e substitua a repetição por um bloco de orientação ou recomendação.

### 6. Excesso de CTAs

Unifique a hierarquia das chamadas para ação.

### 7. Seção de instrutores desalinhada com a promessa

A página diz “Escolha seu instrutor”, mas atualmente mostra apenas um perfil. Adeque a copy ao estado real do produto ou prepare a estrutura para múltiplos instrutores sem prometer uma escolha que ainda não existe.

### 8. Falta de informações operacionais

A nova página deve responder dúvidas sobre duração das aulas, local, veículo, formas de pagamento, aulas adicionais, taxas, reagendamento, exame e atendimento.

---

## Objetivos de negócio

### Objetivo primário

Aumentar a quantidade de leads qualificados iniciando uma conversa pelo WhatsApp.

### Objetivos secundários

- Aumentar cliques nos pacotes;
- Reduzir dúvidas repetitivas no atendimento;
- Aumentar confiança antes do contato;
- Melhorar compreensão da oferta;
- Aumentar conversão de visitantes de Caçapava e região;
- Melhorar a experiência mobile;
- Preparar a página para campanhas locais de tráfego pago.

### Métricas recomendadas

Implementar ou preparar eventos para medir:

- Visualização da página;
- Clique no CTA principal;
- Clique em cada pacote;
- Clique no WhatsApp por categoria;
- Clique em “ver condições”;
- Início do cadastro;
- Conclusão do cadastro;
- Clique em FAQ;
- Scroll de 25%, 50%, 75% e 90%;
- Conversão por dispositivo;
- Conversão por origem de campanha;
- Conversão por cidade ou região, quando tecnicamente possível e respeitando privacidade.

Usar nomenclatura consistente, por exemplo:

- `hero_whatsapp_click`
- `package_view`
- `package_whatsapp_click`
- `signup_start`
- `signup_complete`
- `faq_open`
- `final_cta_click`

---

## Público-alvo

Atender principalmente:

1. Pessoas de Caçapava e região tirando a primeira habilitação;
2. Pessoas que precisam de aulas práticas para carro;
3. Pessoas que precisam de aulas práticas para moto;
4. Pessoas que farão exame e precisam de veículo;
5. Pessoas que reprovaram ou perderam confiança;
6. Pessoas que já têm CNH, mas têm medo de dirigir;
7. Pessoas que precisam de horários flexíveis;
8. Familiares que estão pesquisando e pagando as aulas.

A linguagem deve ser simples, acolhedora, profissional e brasileira. Evite excesso de termos técnicos, promessas absolutas e frases genéricas de marketing.

---

## Nova arquitetura de informação

Reorganize a página nesta ordem:

1. Header;
2. Hero com proposta de valor;
3. Provas rápidas de confiança;
4. Como funciona;
5. Categorias e pacotes;
6. O que está incluído e o que não está incluído;
7. Por que escolher a HABILITA+;
8. Instrutor ou instrutores;
9. Avaliações e prova social;
10. FAQ comercial;
11. CTA final;
12. Rodapé com informações institucionais.

---

## Requisitos de cada seção

### 1. Header

Manter a marca HABILITA+ e simplificar a navegação.

Itens recomendados:

- Logo;
- Como funciona;
- Pacotes;
- Instrutores;
- Dúvidas;
- CTA “Falar com um instrutor”.

No mobile:

- Usar menu acessível;
- Manter CTA de WhatsApp visível;
- Evitar excesso de itens no menu.

O botão “Área do aluno” pode permanecer, mas não deve competir visualmente com o CTA comercial principal.

---

### 2. Hero

Substituir o foco excessivo em “lançamento” por clareza da oferta.

Usar esta direção de copy:

**Selo:**

> Aulas práticas em Caçapava e região

**Título:**

> Ganhe confiança para dirigir e prepare-se para o exame da CNH

**Subtítulo:**

> Carro, moto ou os dois. Escolha seu pacote, combine seus horários e aprenda com instrutor experiente, veículos preparados e acompanhamento próximo.

**Benefícios rápidos:**

- Categorias A, B e A/B;
- Aulas práticas individuais;
- Veículo disponível para o exame;
- Atendimento pelo WhatsApp.

**CTA principal:**

> Falar com um instrutor

**CTA secundário:**

> Ver pacotes e valores

Adicionar uma nota de transparência editável:

> Pacotes de aulas práticas. Taxas e demais etapas da CNH conforme condições informadas no atendimento.

Se a HABILITA+ realmente incluir mais etapas, substituir a nota pela informação validada.

---

### 3. Provas rápidas de confiança

Criar uma faixa visual logo abaixo do hero com 3 a 5 indicadores.

Exemplos:

- Atendimento em Caçapava e região;
- Instrutor com [X] anos de experiência;
- Mais de [X] alunos atendidos;
- Veículos preparados para o exame;
- Horários combinados;
- Nota [X] no Google.

**Não inventar os números.** Usar placeholders editáveis quando necessário.

---

### 4. Como funciona

Criar um fluxo visual em três etapas:

#### 01 — Conte seu objetivo

Fale com o instrutor e informe a categoria, seu nível de experiência e sua disponibilidade.

#### 02 — Escolha seu pacote e horário

Entenda as condições, escolha o pacote adequado e combine os horários.

#### 03 — Pratique com confiança

Faça suas aulas e prepare-se para o próximo passo, conforme o plano combinado.

O texto deve evitar prometer aprovação, pois aprovação depende do desempenho do aluno e das regras do exame.

---

### 5. Categorias e pacotes

Manter os três pacotes, porém tornar os cards mais transparentes e fáceis de comparar.

Cada card deve conter:

- Categoria;
- Para quem é indicado;
- Número de aulas;
- Duração das aulas — usar placeholder se não confirmado;
- O que inclui;
- O que não inclui;
- Preço à vista;
- Valor das parcelas calculado corretamente;
- Condições de pagamento;
- Condições do reteste;
- CTA específico para WhatsApp.

Adicionar uma tag de recomendação em apenas um pacote, se houver uma estratégia comercial definida:

- “Mais escolhido”;
- “Melhor para começar”;
- “Mais completo”.

Não destacar um pacote sem validação do responsável.

Usar uma única CTA principal por card:

> Quero saber mais sobre este pacote

Essa ação deve abrir o WhatsApp com mensagem pré-preenchida contendo a categoria e o pacote.

Exemplo de mensagem:

> Olá! Vim pelo site da HABILITA+ e quero saber mais sobre o pacote de carro. Pode me explicar as condições?

---

### 6. Transparência da oferta

Adicionar abaixo dos cards uma seção chamada:

> Entenda exatamente o que você está contratando

Dividir em duas colunas:

#### Incluído no pacote

Usar apenas informações confirmadas, como:

- Aulas práticas;
- Veículo para o exame;
- Condição de reteste;
- Orientação do instrutor.

#### Não incluído ou sujeito a confirmação

Usar placeholders ou informações validadas, como:

- Taxas oficiais;
- Exames médico e psicológico;
- Curso teórico;
- Prova teórica;
- Emissão da CNH;
- Taxas administrativas;
- Custos adicionais do reteste.

Adicionar um aviso:

> As condições podem variar conforme categoria, instrutor e disponibilidade. Confirme todos os detalhes antes da contratação.

---

### 7. Por que escolher a HABILITA+

Evitar repetir apenas “confiança” e “segurança”. Organizar os diferenciais em quatro pilares:

1. **Flexibilidade:** horários combinados conforme disponibilidade;
2. **Proximidade:** atendimento em Caçapava e região;
3. **Preparação prática:** exercícios voltados ao trânsito e ao exame;
4. **Acompanhamento:** orientação clara do primeiro contato à aula.

Cada pilar deve ter uma frase objetiva e não repetir integralmente a copy do hero.

---

### 8. Instrutores

Se houver apenas um instrutor, substituir a promessa “Escolha seu instrutor” por:

> Aprenda com quem entende do caminho

Apresentar:

- Nome;
- Foto real;
- Categorias atendidas;
- Cidade ou região;
- Anos de experiência;
- Credenciais, se confirmadas;
- Número de alunos, se confirmado;
- Estilo de ensino;
- Disponibilidade, se possível;
- CTA “Falar com este instrutor”.

Se houver vários instrutores, criar cards consistentes com:

- Filtro por categoria;
- Região;
- Disponibilidade;
- Avaliação;
- Experiência;
- CTA individual.

Não mostrar um filtro vazio ou desnecessário quando houver apenas um instrutor.

---

### 9. Prova social

Criar uma seção de prova social com conteúdo real e verificável.

Possibilidades:

- Avaliações do Google;
- Depoimentos autorizados;
- Fotos de alunos;
- Vídeos curtos;
- Prints de feedback, com dados pessoais protegidos;
- Histórias de alunos;
- Número de alunos atendidos;
- Experiência do instrutor.

Se não houver material pronto, criar placeholders claramente identificados para preenchimento posterior:

- `[Depoimento real de aluno]`;
- `[Nome e categoria]`;
- `[Avaliação Google]`;
- `[Foto autorizada]`.

Nunca fabricar avaliações ou nomes.

---

### 10. FAQ comercial

Expandir o FAQ para incluir:

- Nunca dirigi. Posso fazer as aulas?
- O pacote inclui o processo completo da CNH?
- O que está incluído no valor?
- O que não está incluído?
- Os veículos estão inclusos para o exame?
- Quanto dura cada aula?
- Posso contratar aulas extras?
- Como escolho dias e horários?
- Como funciona o reteste?
- Quais formas de pagamento são aceitas?
- Posso fazer aulas aos finais de semana?
- Já tenho CNH, mas tenho medo de dirigir. Vocês ajudam?
- Onde as aulas são realizadas?
- Atendem cidades além de Caçapava?
- O que acontece se eu precisar remarcar?

As respostas devem ser objetivas, honestas e alinhadas às regras reais da operação.

---

### 11. CTA final

Criar uma seção final de conversão com contraste visual.

**Título sugerido:**

> Pronto para dar o próximo passo?

**Texto:**

> Conte se você precisa de carro, moto, preparação para o exame ou aulas para recuperar a confiança. Um instrutor poderá orientar você sobre o pacote mais adequado.

**CTA:**

> Falar com um instrutor no WhatsApp

Adicionar mensagem pré-preenchida e identificação de origem:

> Olá! Vim pela página da HABILITA+ e quero entender qual pacote é mais indicado para mim.

---

### 12. Rodapé

Incluir, quando aplicável e confirmado:

- HABILITA+;
- Descrição curta do negócio;
- Caçapava — SP;
- WhatsApp;
- Instagram;
- Google Maps;
- Área do aluno;
- Área do instrutor;
- Política de privacidade;
- Termos de uso;
- Política de cancelamento e reagendamento;
- CNPJ ou razão social, se aplicável.

Não inserir dados institucionais sem validação.

---

## Diretrizes de copy

- Escrever em português brasileiro;
- Usar linguagem humana, acolhedora e direta;
- Evitar frases genéricas como “transforme seus sonhos em realidade”;
- Evitar prometer aprovação na prova;
- Evitar criar urgência falsa;
- Explicar claramente a diferença entre aula, pacote e processo completo da CNH;
- Usar verbos de ação;
- Preferir frases curtas;
- Manter o tom profissional, sem parecer burocrático;
- Falar com a pessoa no singular;
- Usar “você” em vez de “o cliente”;
- Não usar “grátis” quando houver condições não explicadas;
- Não inventar depoimentos, números ou certificados.

---

## Diretrizes de design

- Preservar a identidade HABILITA+;
- Usar azul-marinho para confiança e conteúdo institucional;
- Usar verde para ações e CTAs;
- Usar amarelo para destaques comerciais e categorias;
- Manter contraste adequado;
- Reduzir elementos decorativos que competem com o CTA;
- Utilizar uma única hierarquia visual clara;
- Destacar o pacote recomendado apenas se houver base comercial;
- Usar imagens reais sempre que possível;
- Evitar repetir as mesmas fotos em várias seções;
- Priorizar cards legíveis no mobile;
- Garantir que os botões tenham área de toque confortável;
- Manter o botão flutuante sem esconder conteúdo ou CTAs;
- Garantir que o layout não dependa apenas de cor para comunicar informação.

---

## Requisitos mobile

A maior parte do tráfego local provavelmente será mobile. Portanto:

- Projetar primeiro para telas pequenas;
- Manter CTA principal visível ou facilmente acessível;
- Evitar cards muito estreitos;
- Fazer os pacotes funcionarem bem em rolagem vertical;
- Usar accordions acessíveis;
- Evitar texto pequeno;
- Evitar excesso de imagens grandes;
- Garantir carregamento rápido;
- Testar iPhone e Android em larguras comuns;
- Não permitir que o botão flutuante cubra preços ou botões.

---

## SEO e compartilhamento

Implementar ou revisar:

- `<title>` específico e orientado à busca local;
- Meta description persuasiva;
- Tag canonical;
- Open Graph;
- Imagem de compartilhamento para WhatsApp;
- Estrutura correta de H1, H2 e H3;
- Schema de negócio local, se os dados estiverem confirmados;
- Sitemap;
- Robots.txt;
- URLs amigáveis;
- Alt text nas imagens;
- Conteúdo textual visível para mecanismos de busca.

Sugestão de title:

> Aulas práticas de carro e moto em Caçapava | HABILITA+

Sugestão de description:

> Faça aulas práticas de carro e moto em Caçapava com instrutor experiente, horários combinados e veículos para o exame. Conheça os pacotes da HABILITA+.

Validar a descrição com a oferta real antes de publicar.

---

## Acessibilidade

Garantir:

- Contraste WCAG adequado;
- Navegação completa por teclado;
- Foco visível;
- Labels em inputs e selects;
- Botões com nomes acessíveis;
- Accordions compatíveis com leitores de tela;
- Ordem semântica de headings;
- Alt text em imagens relevantes;
- Imagens decorativas com alt vazio;
- Avisos de erro compreensíveis;
- Não depender somente de cor;
- Respeito a `prefers-reduced-motion`.

---

## Performance

- Converter imagens para WebP ou AVIF;
- Redimensionar imagens de acordo com o uso real;
- Aplicar lazy loading abaixo da primeira dobra;
- Pré-carregar apenas o asset principal do hero;
- Evitar JavaScript desnecessário;
- Reduzir fontes e pesos não utilizados;
- Medir Core Web Vitals;
- Verificar CLS causado por imagens sem dimensões definidas;
- Verificar LCP do hero;
- Não sacrificar clareza em nome de animações.

---

## Integração de WhatsApp

Todos os CTAs de WhatsApp devem:

1. Abrir o número oficial validado;
2. Usar mensagem pré-preenchida;
3. Identificar a categoria quando o clique partir de um pacote;
4. Identificar a origem da página, quando possível;
5. Abrir corretamente em desktop e mobile;
6. Ter fallback caso o número não esteja configurado.

Usar placeholders para o número oficial:

`[WHATSAPP_NUMBER_OFICIAL]`

Não inventar número.

---

## Critérios de aceite

A melhoria será considerada pronta quando:

- O visitante entender a oferta nos primeiros segundos;
- O hero tiver uma única CTA principal claramente priorizada;
- Cada pacote explicar inclusão, não inclusão, preço e condições;
- A expressão “reteste grátis” estiver definida ou substituída por uma descrição mais precisa;
- Os pacotes não estiverem duplicados sem necessidade;
- A página não prometer aprovação;
- Existir espaço para prova social real;
- O número de instrutores apresentado corresponder à realidade;
- O WhatsApp abrir com mensagem pré-preenchida;
- A navegação mobile estiver confortável;
- Os CTAs funcionarem em desktop e mobile;
- O FAQ responder as principais objeções comerciais;
- O rodapé tiver informações institucionais válidas;
- Não existirem depoimentos, números ou credenciais inventados;
- Metadados e canonical estiverem configurados;
- Imagens tiverem otimização e alt text adequado;
- Eventos de conversão estiverem preparados ou documentados;
- A página passar por revisão visual em pelo menos três larguras de tela.

---

## Processo de execução solicitado

Execute o trabalho nesta ordem:

1. Inspecione a estrutura atual e identifique componentes reutilizáveis;
2. Liste as informações que precisam de confirmação do responsável;
3. Proponha a nova arquitetura de informação;
4. Reescreva o conteúdo principal;
5. Reestruture os componentes de layout;
6. Implemente os novos CTAs;
7. Implemente a transparência dos pacotes;
8. Implemente o FAQ ampliado;
9. Prepare prova social sem inventar dados;
10. Otimize imagens, SEO, acessibilidade e performance;
11. Teste desktop e mobile;
12. Teste todos os links, botões e mensagens de WhatsApp;
13. Faça uma revisão final de conversão;
14. Entregue um resumo das alterações, pendências e recomendações de teste A/B.

---

## Entrega esperada

Ao concluir, entregar:

1. Landing page atualizada;
2. Lista de mudanças implementadas;
3. Lista de informações que ainda dependem de validação;
4. Relatório de testes realizados;
5. Eventos de conversão configurados ou especificados;
6. Recomendações de testes A/B;
7. Sugestão de próximos experimentos de marketing.

---

## Testes A/B recomendados depois da implementação

Testar uma variável por vez:

### Teste A — Hero

- “Ganhe confiança para dirigir”
- versus
- “Aulas práticas para o exame da CNH”

### Teste B — CTA

- “Falar com um instrutor”
- versus
- “Ver pacotes e valores”

### Teste C — Oferta

- Mostrar preços imediatamente;
- versus mostrar primeiro benefícios e preço logo depois.

### Teste D — Prova social

- Depoimentos antes dos pacotes;
- versus depoimentos depois dos pacotes.

### Teste E — Pacote destacado

- Pacote Carro como recomendado;
- versus Pacote A/B como recomendado.

Cada experimento deve ter hipótese, métrica principal, período mínimo e critério de decisão.

---

## Regra final

Priorize **clareza, confiança e conversão**. Não aumente a quantidade de elementos apenas para deixar a página mais cheia. Cada seção deve responder a uma dúvida, eliminar uma objeção ou conduzir o visitante ao próximo passo.

Se uma informação importante não estiver confirmada, não invente. Use um placeholder explícito e sinalize a pendência para validação antes da publicação.
