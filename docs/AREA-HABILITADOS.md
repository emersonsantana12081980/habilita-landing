# Área para habilitados

Aplicar `supabase/migrations/202611130001_licensed_packages.sql` no SQL Editor antes de publicar o frontend.

- Divulgação: `/habilitados`. Cadastro aberto, declaração de CNH válida e aceite dos termos obrigatórios.
- O servidor identifica o aluno na criação do perfil. Login habitual em `/aluno` reconhece o perfil salvo, independentemente do link usado.
- A declaração é do aluno; não representa verificação oficial de CNH.
- Admin → Catálogo → pacote → Público do pacote: Primeira habilitação ou Já habilitados — reforço. Aplica-se também às aulas avulsas.
- Todos os pacotes existentes continuam como primeira habilitação. Criar ou editar pacotes de reforço antes de divulgar o link; sem ofertas marcadas, o catálogo fica vazio.
- Habilitados veem início, agenda, pacotes, pagamentos, perfil e suporte. Jornada CNH, exames, LADV, notificações e banner de primeira habilitação ficam ocultos. Pagamento e créditos continuam necessários para reservar.
- Pedidos antigos continuam no histórico. O filtro vale para novas ofertas. Mudança de público do pacote não altera pedidos anteriores.
- O trigger de pedidos valida o público no servidor, inclusive pedidos manuais do admin. Pedidos personalizados sem pacote continuam permitidos. Ao lançar um pacote para um aluno, selecionar um com público correspondente.
- A instalação não altera saldos, aulas existentes ou situação de pagamento.

Validação real após o SQL: cadastrar pelo link, conferir `students.licensed_driver=true`, criar um pacote para cada público e conferir os dois perfis. Confirmar um pagamento e testar agendamento com saldo. Testes locais com Supabase simulado não substituem essa validação.
