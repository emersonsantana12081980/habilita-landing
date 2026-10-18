import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export function DeleteRegistration({ kind, record, onDeleted, disabled = false }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const locked = useRef(false);
  const label = { students: 'aluno', instructors: 'instrutor', packages: 'pacote' }[kind];
  return <div><button type="button" className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-800" disabled={busy || disabled} onClick={async () => {
    const confirmation = kind === 'students'
      ? `Excluir o cadastro de “${record.name}”? Ele sairá das listas, as aulas futuras serão canceladas e os pedidos pendentes serão encerrados. O histórico será preservado. A conta de login não será apagada.`
      : kind === 'packages'
      ? `Excluir o pacote “${record.name}”? Ele sairá do catálogo. Os pedidos e créditos já existentes serão preservados.`
      : `Excluir definitivamente o instrutor “${record.name}”? Cadastros com histórico vinculado não serão apagados. A conta de login não será excluída.`;
    if (locked.current || !window.confirm(confirmation)) return;
    locked.current = true; setBusy(true); setMessage('');
    try {
      const { error } = await supabase.rpc('admin_delete_registration', { p_kind: kind, p_id: record.id });
      if (error) throw error;
      await onDeleted();
    } catch (error) {
      setMessage(error.message === 'registration_has_history'
        ? `Não é possível excluir: há registros vinculados a este ${label}. ${kind === 'students' ? 'Use Enviar ao arquivo morto para mantê-lo inativo.' : 'Use Editar e desmarque Ativo no site para desativá-lo.'}`
        : error.message === 'admin_required' ? 'Somente administradores podem excluir cadastros.'
        : 'Não foi possível excluir. Atualize a lista e confira se a atualização de exclusão foi executada no Supabase.');
    } finally { locked.current = false; setBusy(false); }
  }}>{busy ? 'Excluindo…' : 'Excluir cadastro'}</button>{message && <p role="alert" className="mt-2 max-w-sm text-sm text-red-800">{message}</p>}</div>;
}
