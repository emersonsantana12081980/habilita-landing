# Ofertas e conteúdo público

## Ativação

1. No Supabase, abra SQL Editor e execute `docs/supabase-dashboard/confirmar-ofertas-comerciais.sql`. O projeto precisa ter as migrations anteriores aplicadas. Este script ainda não foi executado remotamente nesta entrega.
2. No admin, abra Catálogo, edite a oferta e preencha valores vigentes, categoria, aulas, duração, total parcelado, juros e condições, veículo para exame, taxas excluídas e cancelamento.
3. Se houver reteste incluído, informe cobertura, prazo e início da contagem, número de utilizações e custos remanescentes.
4. Marque a confirmação das condições e salve. Alterar campos do pacote exige confirmar novamente. Ofertas sem confirmação ou incompletas ficam ocultas na página e na compra do aluno. Pedidos anteriores são preservados.

## Informações que o responsável ainda precisa fornecer

- Preços e condições atuais: não foram fornecidos nesta solicitação; nenhum preço foi inventado.
- Identificação comercial e região/bairros atendidos.
- URLs dos termos e da política de privacidade, após revisão pelo responsável. A interface não faz revisão jurídica nem certifica o documento.
- Fotos reais autorizadas, com legenda, e confirmação dos perfis dos instrutores. Mudanças de nome, apresentação ou foto invalidam a confirmação do perfil.
- Avaliações verdadeiras e autorizadas, com referência de origem sem informações pessoais privadas.

Em Configurações do site, registre os links e confirme a revisão. Links legais só aparecem quando a confirmação corresponde à URL atual. Fotos e avaliações só aparecem após a confirmação exigida. Não inserir promessas de aprovação nem experiência sem comprovação.

## Verificação

Testes automatizados conferem ofertas incompletas/fictícias ocultas, condições de reteste e composição de categoria dupla, conteúdo sem autorização oculto, botão persistente no celular e ausência de rolagem horizontal. Testes de navegador usam serviços simulados; não comprovam execução da migration no banco real.
