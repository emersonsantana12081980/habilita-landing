# Excluir aluno e reutilizar o e-mail

No Supabase SQL Editor, execute todo o arquivo `docs/supabase-dashboard/excluir-aluno-definitivamente.sql`. Depende das migrations anteriores de pagamentos, jornada e LADV. O SQL apenas instala a função; não apaga alunos ao ser executado.

No site: Admin → Alunos → Excluir cadastro. A confirmação informa que cadastro, aulas, créditos, pedidos, pagamentos, declarações, documentos e login serão apagados definitivamente. Depois da conclusão, o aluno pode criar uma conta nova com o mesmo e-mail, sem herdar saldo ou histórico.

Para alunos removidos pela versão antiga: Situação do cadastro → Excluídos anteriormente — liberar e-mail. Localize o aluno pelo nome/WhatsApp e clique em Excluir cadastro.

Arquivar continua sendo uma operação distinta, que conserva login e histórico.

## Funcionamento e falhas

Só administradores podem preparar/finalizar. Contas também vinculadas a administrador ou instrutor são protegidas. A preparação torna o aluno inativo e impede reativação durante a exclusão. Arquivos são removidos pela API Storage, inclusive versões anteriores da LADV e comprovantes. Não se apagam apenas os metadados dos arquivos por SQL.

A finalização confere que não há arquivos restantes e remove registros dependentes, perfil e `auth.users` na mesma transação. A exclusão direta do usuário é suportada pelo Supabase; o e-mail é liberado somente após essa transação. Uma falha relacional reverte essa etapa, mas não recupera arquivos já apagados. Repetir a exclusão retoma o processo. Aluno inativo permanece localizável no arquivo morto; exclusões antigas permanecem no filtro próprio.

Não executar rotinas de exclusão em massa. A instalação não exclui contas automaticamente.

## Validação

Testes unitários: ordem das operações, lotes, autorização negada, falha de Storage, repetição e erro final. Testes de navegador: confirmação/cancelamento, localização de aluno excluído anteriormente e remoção dos arquivos antes da finalização, com serviços simulados.

O SQL foi revisado, mas não executado no banco remoto neste ambiente. Após instalar, verificar com uma conta de teste: aluno comum não pode chamar os RPCs; admin exclui uma conta com LADV/comprovante; a conta desaparece de Authentication → Users; novo cadastro aceita o mesmo e-mail. Tokens antigos podem permanecer criptograficamente válidos até expirar, mas ficam sem perfil/aluno ativo para autorização.

Referência: https://supabase.com/docs/guides/auth/managing-user-data
