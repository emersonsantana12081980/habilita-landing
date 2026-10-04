// Preencher somente após validação do responsável. null = confirmação pendente.
// Preços, quantidade de aulas e instrutores continuam vindo do catálogo/admin.
export const commercialInfo = {
  lessonMinutes: null,
  lessonLocation: null,
  serviceRegion: null,
  cancellationPolicy: null,
  privacyUrl: null,
  termsUrl: null,
  instagramUrl: null,
  mapsUrl: null,
  legalName: null,
  cnpj: null,
  // Por slug/id: { cardTotalCents: 29900, boletoTotalCents: 29900,
  // lessonMinutes: 50, retestTerms: "Condições confirmadas..." }
  // Não presumir parcelamento sem juros a partir do preço à vista.
  packages: {},
};
export const faqItems = [
  [
    "Nunca dirigi. Posso fazer as aulas?",
    "Conte ao instrutor que você está começando. Ele avaliará seu objetivo, sua experiência e os documentos necessários antes de combinar as aulas.",
  ],
  [
    "O pacote inclui o processo completo da CNH?",
    "Os valores apresentados são de pacotes de aulas práticas, com os itens indicados em cada oferta. Não representam o preço do processo completo da CNH. Confirme separadamente taxas e demais etapas.",
  ],
  [
    "O que está incluído no valor?",
    "Cada card informa a quantidade de aulas e se inclui veículo para o exame. A duração, a disponibilidade e as condições do reteste devem ser confirmadas antes da contratação.",
  ],
  [
    "O que não está incluído?",
    "Não considere taxas oficiais, exames médico e psicológico, curso e prova teórica ou emissão da CNH incluídos nos preços exibidos sem confirmação expressa da equipe.",
  ],
  [
    "Os veículos estão inclusos para o exame?",
    "Confira esse item no pacote escolhido. Quando indicado, a utilização depende da categoria e das condições combinadas, incluindo local e disponibilidade na data do exame.",
  ],
  [
    "Quanto dura cada aula?",
    () =>
      commercialInfo.lessonMinutes
        ? `A duração informada é de ${commercialInfo.lessonMinutes} minutos. Confira também as condições específicas do seu pacote.`
        : "Duração a confirmar com o instrutor antes da contratação. A quantidade de aulas está descrita em cada pacote.",
  ],
  [
    "Posso contratar aulas extras?",
    "Consulte o instrutor sobre aulas adicionais, valores e horários disponíveis. A quantidade incluída é a que consta no pacote contratado.",
  ],
  [
    "Como escolho dias e horários?",
    "Informe sua disponibilidade pelo WhatsApp. Na área do aluno, o agendamento utiliza os horários livres e exige créditos disponíveis para a categoria. Criar uma conta é gratuito e não libera créditos automaticamente.",
  ],
  [
    "Como funciona o reteste?",
    "Consulte as condições do pacote. Antes de contratar, confirme o serviço coberto, prazo, número de utilizações e eventuais taxas. Não considere taxas oficiais ou serviços adicionais gratuitos sem confirmação.",
  ],
  [
    "Quais formas de pagamento são aceitas?",
    "Os cards mostram o preço à vista e as opções de parcelamento cadastradas. Confirme o valor de cada parcela, juros, total e condições de contratação com o instrutor. O site ainda não realiza cobranças online.",
  ],
  [
    "Posso fazer aulas aos finais de semana?",
    "A disponibilidade depende da agenda do instrutor. Informe os dias que você prefere para verificar as opções antes de contratar.",
  ],
  [
    "Já tenho CNH, mas tenho medo de dirigir. Vocês ajudam?",
    "Fale com o instrutor sobre sua experiência e sobre o que causa insegurança. Ele poderá orientar sobre aulas de reforço e um plano adequado ao seu ritmo.",
  ],
  [
    "Onde as aulas são realizadas?",
    () =>
      commercialInfo.lessonLocation ||
      "O local e o ponto de encontro precisam ser combinados com o instrutor. Confirme essas informações antes da aula.",
  ],
  [
    "Atendem cidades além de Caçapava?",
    () =>
      commercialInfo.serviceRegion ||
      "O atendimento é divulgado para Caçapava e região. Informe sua cidade e bairro para confirmar cobertura e possíveis condições de deslocamento.",
  ],
  [
    "O que acontece se eu precisar remarcar?",
    () =>
      commercialInfo.cancellationPolicy ||
      "Entre em contato com a equipe para solicitar a alteração. Na área do aluno, consulte as regras vigentes de antecedência e cancelamento. A remarcação depende de um novo horário disponível; confirme as condições antes de contratar.",
  ],
];
