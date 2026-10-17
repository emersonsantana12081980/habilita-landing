# Excluir alunos, instrutores e pacotes

Execute `supabase/migrations/202610170004_delete_registrations.sql` no SQL Editor para habilitar o botão **Excluir cadastro**.

Disponível em ADM → Alunos, Instrutores e Catálogo → Pacotes. A confirmação identifica o nome e avisa que a exclusão é definitiva. Cancelar não envia nenhuma operação. Após sucesso, a lista é atualizada e o editor do registro é fechado.

A função valida o administrador no servidor e aceita somente essas três tabelas. Usa a trava da agenda antes do DELETE, não usa CASCADE e deixa as chaves estrangeiras impedirem exclusão de dados com vínculos, inclusive concorrentes. Pedidos, aulas, créditos, pagamentos, regras de agenda e cupons associados podem bloquear a exclusão. Nesse caso, o cadastro permanece e a interface orienta arquivamento/desativação. Nenhuma aula ou pagamento é excluído por esse fluxo.

Excluir aluno ou instrutor remove apenas seu cadastro, não sua conta de autenticação nem seu perfil ou papel global. O acesso de instrutor às aulas depende do vínculo com um cadastro ativo. Fotos no Storage também são preservadas. Não se trata de exclusão integral de dados pessoais.

A migration precisa ser aplicada e validada no banco real: administrador exclui registro vazio; aluno/instrutor/visitante não pode executar; registro com FK permanece após falha; nome de tabela fora da lista é recusado. Os testes de navegador usam respostas simuladas e não validam a execução remota do SQL.
