export const cnhSource='https://poupatempo.sp.gov.br/carta/391270A7-15C2-4FC2-BE72-38C4D14B4A1C';
const laboratoriesSearch = 'https://www.google.com/search?q=laboratorios+credenciados+ao+detran+para+exame+toxicologico+ca%C3%A7apava&udm=local';
const laboratoriesButton = {label:'Ver laboratórios em Caçapava',url:laboratoriesSearch};
export const cnhTrail=[
 {key:'initial_application',title:'Preencha o requerimento inicial',text:[
  'Baixe o aplicativo CNH do Brasil para Android ou iOS e entre com sua conta Gov.br.',
  'Em Primeira habilitação → Requerimento, confira seus dados, escolha a categoria e informe São Paulo (SP).'],
  declaration:'Declaro que preenchi e conferi meu requerimento inicial.'},
 {key:'theory_course',title:'Realize o curso teórico',text:[
  'Faça o curso pelo aplicativo CNH do Brasil (EaD), em autoescola credenciada, entidade especializada de ensino EaD ou órgão do Sistema Nacional de Trânsito, nas modalidades autorizadas.',
  'No aplicativo, emita o certificado ao concluir. Para certificados emitidos após 10/09/2026, a atualização no Detran-SP é automática. Se não atualizar ou o certificado for anterior, solicite a validação.'],
  links:[['Solicitar validação do curso teórico','https://www.detran.sp.gov.br/detransp?id=sc_cat_item_detransp_svc&sys_id=9ffe1f1c874b121422bdc9530cbb3570&svc_id=d6dc808d47b53a9006482a54f26d4337']],
  declaration:'Declaro que concluí o curso teórico e emiti meu certificado.'},
 {key:'registration',title:'Abra o processo no Detran-SP',text:[
  'Presencial: agende o serviço de primeira habilitação no Poupatempo e compareça à unidade no dia e horário marcados. No atendimento, abra o processo, cadastre a biometria e agende os exames médico e psicológico.',
  'Online: acesse o link abaixo, clique em Iniciar serviço, entre com sua conta Gov.br e siga as instruções para abrir o processo e agendar a biometria e os exames.'],
  links:[['Abrir serviço oficial de primeira habilitação',cnhSource]],declaration:'Declaro que abri meu processo no Detran-SP e realizei a coleta biométrica.'},
 {key:'medical',title:'Exames médico, psicotécnico e toxicológico — primeira habilitação',text:[
  'Exame médico: R$ 90,00. Compareça à clínica credenciada conforme o agendamento e pague diretamente ao médico.',
  'Exame psicotécnico (avaliação psicológica): R$ 90,00. Compareça conforme o agendamento e pague diretamente ao psicólogo.',
  'Exame toxicológico: consulte o valor diretamente nos laboratórios credenciados pela Senatran. Para processos iniciados a partir de 17/06/2026, ele é exigido para emitir a PPD; recomenda-se realizá-lo após o curso prático, observando a validade de 90 dias na emissão.',
  'Para avançar nesta etapa, confirme a aptidão nos exames médico e psicológico. A conferência do toxicológico está no último passo. Não envie laudos ou resultados médicos ao site.'],
  action: laboratoriesButton,
  declaration:'Declaro que realizei os exames médico e psicológico e estou apto para seguir o processo.'},
 {key:'theory_exam',title:'Agende e realize a prova teórica',text:[
  'Taxa do exame teórico: R$ 52,83. Efetue o pagamento e acesse o link abaixo para agendar sua prova na unidade do Detran-SP ou Poupatempo disponível.',
  'Escolha a data, o horário e o local e compareça conforme o agendamento.',
  'Avance depois da aprovação. Em seguida, obtenha a LADV correspondente à categoria.'],
  links:[['Agendar prova teórica','https://www.detran.sp.gov.br/detransp/pb/servico/habilitacao/agendar_exame_teorico_de_habilitacao?id=carta_de_servico_agendar_exame_teorico_de_habilitacao']],
  declaration:'Declaro que fui aprovado na prova teórica.'},
 {key:'ladv',title:'Emita e envie sua LADV para iniciar as aulas',text:[
  'Após a aprovação teórica, emita sua Licença para Aprendizagem de Direção Veicular (LADV) no canal oficial e salve o documento. Depois, faça o upload abaixo em PDF, JPG ou PNG, até 5 MB. Para carro e moto, envie o documento correspondente em cada categoria.',
  'Após enviar a LADV das categorias escolhidas, você poderá acessar as demais áreas do portal. O agendamento das aulas práticas depende da confirmação do pagamento pela equipe, da liberação do saldo de aulas e dos horários disponíveis. O envio não confirma autenticidade ou validade no Detran.']},
 {key:'practice',title:'Realize o curso prático de direção',text:[
  'Na primeira habilitação, são exigidas 2 horas de prática para A ou B; para A e B, 2 horas em cada categoria (4 horas ao todo). ACC não exige curso prático e não é oferecida neste agendamento.',
  'Na Habilita+, siga as aulas com seu instrutor autônomo credenciado. Depois do envio da LADV e da confirmação do pagamento pela equipe, agende usando seu saldo de aulas e os horários disponíveis.',
  'A informação de conclusão deve constar no Detran-SP; se não atualizar, solicite a validação pelo serviço oficial.',
  'Horas e quantidade de aulas são diferentes: confira a duração de cada aula contratada.'],
  links:[['Consultar instrutores credenciados','https://www.gov.br/transportes/pt-br/conteudos-cnh-do-brasil/por-dentro-da-nova-cnh-do-brasil'],['Validar curso prático','https://www.detran.sp.gov.br/detransp/pb/servico/habilitacao/validar_curso_pratico_da_cnh_do_brasil_no_detran_sp?id=carta_de_servico_validar_curso_pratico_da_cnh_do_brasil_no_detran_sp']],
  declaration:'Declaro que concluí a carga prática exigida nas categorias do meu processo.'},
 {key:'practical_exam',title:'Agende e realize a prova prática',text:[
  'Taxa do exame prático: R$ 52,83 por categoria. Para carro e moto, pague a taxa correspondente a cada categoria. Você pode pagar em casa lotérica, informando seu CPF e solicitando a taxa do exame prático de direção. Guarde o comprovante e confira o valor no canal oficial antes de pagar.',
  'Como seu acompanhamento é com instrutor autônomo, você mesmo faz o agendamento: acesse o link abaixo, entre com sua conta Gov.br e siga as instruções para escolher a categoria, o local e a data disponíveis.',
  'Informe abaixo a data do exame para a equipe. Compareça ao local no dia e horário marcados.'],
  links:[['Agendar exame prático','https://www.detran.sp.gov.br/detransp/pb/servico/habilitacao/agendar_exame_pratico_de_direcao_veicular?id=carta_de_servico_agendar_exame_pratico_de_direcao_veicular']],
  declaration:'Declaro que realizei a prova prática e fui aprovado nas categorias do meu processo.'},
 {key:'toxicology',title:'Confira o exame toxicológico e a emissão da PPD',text:[
  'Para processos iniciados a partir de 17/06/2026, o exame toxicológico é obrigatório para emitir a PPD. Recomenda-se realizá-lo após o curso prático; ele pode ser providenciado antes da prova prática.',
  'Na emissão da PPD, o exame precisa estar dentro de 90 dias da coleta. A emissão depende da aprovação prática e da confirmação do resultado negativo, quando exigido.',
  'Confira a situação no serviço oficial. Não anexe resultados de exames aqui.'],
  action: laboratoriesButton,
  links:[['Conferir orientações oficiais',cnhSource]],declaration:'Declaro que conferi e cumpri a exigência do toxicológico aplicável ao meu processo, ou confirmei no Detran que ela não se aplica.'},
];
