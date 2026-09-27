import React, { useState } from "react";
import { supabase } from "../lib/supabase";
export function CloudProfileEditor({ student, email, onSaved }) {
  const [name, setName] = useState(student.name),
    [phone, setPhone] = useState(student.phone),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      className="admin-card space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        try {
          const { error } = await supabase.rpc("update_my_profile", {
            p_name: name.trim(),
            p_phone: phone.replace(/\D/g, ""),
          });
          if (error) throw error;
          setMessage("Dados atualizados.");
          await onSaved();
        } catch (e) {
          setMessage(
            e.code === "P0001"
              ? e.message
              : "Não foi possível salvar seus dados. Tente novamente.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-xl font-bold">Seus dados</h2>
      <label>
        Nome completo
        <input
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        WhatsApp com DDD
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      <p>{email}</p>
      <p>Categoria {student.category}</p>
      <p className="text-sm text-slate-500">
        Para alterar e-mail ou categoria, fale com a equipe.
      </p>
      {message && <p role="status">{message}</p>}
      <button disabled={busy} className="btn btn-green">
        Salvar meus dados
      </button>
    </form>
  );
}
