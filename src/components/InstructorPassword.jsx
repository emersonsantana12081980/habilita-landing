import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
export function InstructorPassword({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <main className="instructor-login"><div><h1>Bem-vindo à Habilita+!</h1><p>Defina sua senha pessoal para acessar suas aulas.</p></div><form onSubmit={async e => {
    e.preventDefault(); if (busy) return;
    if (password !== confirm) { setMessage('As senhas precisam ser iguais.'); return; }
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword(''); setConfirm(''); onDone();
    } catch { setMessage('Não foi possível atualizar a senha. Confira os requisitos da sua conta e tente novamente.'); }
    finally { setBusy(false); }
  }}><h2>Definir minha senha</h2><label>Nova senha<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}/></label><label>Confirmar nova senha<input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}/></label><p>Pelo menos 8 caracteres.</p>{message && <p role="alert">{message}</p>}<button disabled={busy} className="instructor-primary">{busy ? 'Salvando…' : 'Salvar minha senha'}</button></form></main>;
}
