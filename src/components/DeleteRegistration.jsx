import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { deleteStudent } from '../lib/delete-student';

export function DeleteRegistration({ kind, record, onDeleted, disabled = false }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const locked = useRef(false);
  const label = { students: 'aluno', instructors: 'instrutor', packages: 'pacote' }[kind];
  return <div><button type="button" className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-800" disabled={busy || disabled} onClick={async () => {
    const confirmation = kind === 'students'
      ? `Excluir definitivamente “${record.name}”? Serão apagados o cadastro, as aulas, pedidos, pagamentos, documentos e a conta de login. O e-mail ficará disponível para um novo cadastro. Esta ação não pode ser desfeita.`
      : kind === 'packages'
      ? `Excluir o pacote “${record.name}”? Ele sairá do catálogo. Os pedidos e créditos já existentes serão preservados.`
      : `Excluir definitivamente o instrutor “${record.name}”? Cadastros com histórico vinculado não serão apagados. A conta de login não será excluída.`;
    if (locked.current || !window.confirm(confirmation)) return;
    locked.current = true; setBusy(true); setMessage('');
    try {
      if (kind === 'students') await deleteStudent(supabase, record.id);
      else {
        const { error } = await supabase.rpc('admin_delete_registration', { p_kind: kind, p_id: record.id });
        if (error) throw error;
      }
      await onDeleted();
    } catch (error) {
      setMessage(error.message === 'protected_account' ? 'Esta conta também é de administrador ou instrutor. A exclusão de aluno não pode apagar esse acesso.'
        : kind === 'students' ? 'A exclusão não foi concluída. Confira se o SQL de exclusão definitiva foi ativado e tente novamente. Se o aluno ficou inativo, localize-o no arquivo morto para repetir a exclusão.'
        : error.message === 'registration_has_history'
        ? `Não é possível excluir: há registros vinculados a este ${label}. ${kind === 'students' ? 'Use Enviar ao arquivo morto para mantê-lo inativo.' : 'Use Editar e desmarque Ativo no site para desativá-lo.'}`
        : error.message === 'admin_required' ? 'Somente administradores podem excluir cadastros.'
        : 'Não foi possível excluir. Atualize a lista e confira se a atualização de exclusão foi executada no Supabase.');
    } finally { locked.current = false; setBusy(false); }
  }}>{busy ? 'Excluindo…' : 'Excluir cadastro'}</button>{message && <p role="alert" className="mt-2 max-w-sm text-sm text-red-800">{message}</p>}</div>;
}
