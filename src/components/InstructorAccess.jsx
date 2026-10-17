import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export function InstructorAccess({ instructor }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <details className="mt-4 border-t border-slate-200 pt-4">
    <summary className="cursor-pointer font-semibold">Vincular login do instrutor</summary>
    <p className="my-3 text-sm text-slate-600">Use o e-mail de uma conta já cadastrada na Habilita+. Este vínculo libera a área do instrutor com a senha atual dessa conta.</p>
    <form className="grid gap-3" onSubmit={async event => {
      event.preventDefault(); if (busy) return;
      setBusy(true); setMessage("");
      try {
        const { error } = await supabase.rpc("admin_link_instructor", { p_instructor: instructor.id, p_email: email.trim() }).abortSignal(AbortSignal.timeout(15000));
        if (error) throw error;
        setMessage("Acesso vinculado. O instrutor já pode entrar em /instrutor com sua senha atual.");
      } catch (error) {
        const messages = {
          account_not_found: "Esse e-mail ainda não tem conta. Cadastre a conta primeiro e tente novamente.",
          instructor_not_found: "Instrutor não encontrado. Atualize a página.",
          instructor_already_linked: "Este instrutor já está vinculado a outro e-mail. O vínculo existente foi preservado.",
          account_already_linked: "Esta conta já está vinculada a outro instrutor.",
          admin_required: "Somente a administração pode liberar este acesso.",
        };
        setMessage(messages[error.message] || "Não foi possível vincular. Confira se a atualização de acesso dos instrutores foi executada no Supabase e tente novamente.");
      } finally { setBusy(false); }
    }}>
      <label>E-mail de acesso de {instructor.name}<input type="email" required maxLength={254} autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <button disabled={busy} className="btn btn-green">{busy ? "Vinculando…" : "Vincular acesso"}</button>
      {message && <p role="status">{message}</p>}
    </form>
    <a href="/instrutor" className="mt-3 inline-block text-green-700 underline">Abrir área do instrutor</a>
  </details>;
}
