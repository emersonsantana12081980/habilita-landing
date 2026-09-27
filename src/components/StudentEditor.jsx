import React, { useState } from "react";
import { supabase } from "../lib/supabase";
export function StudentEditor({ student, onSaved }) {
  const [form, setForm] = useState(
      student || { name: "", phone: "", category: "B", active: true },
    ),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="admin-card mb-4 grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setMessage("");
        try {
          const phone = form.phone.replace(/\D/g, "");
          if (!/^\d{10,13}$/.test(phone))
            throw new Error("Informe WhatsApp com DDD.");
          const payload = {
            name: form.name.trim(),
            phone,
            category: form.category,
            active: form.active,
          };
          const result = student
            ? await supabase
                .from("students")
                .update(payload)
                .eq("id", student.id)
            : await supabase.from("students").insert(payload);
          if (result.error) throw new Error("Não foi possível salvar o aluno.");
          onSaved();
        } catch (e) {
          setMessage(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-xl font-bold sm:col-span-2">
        {student ? "Editar aluno" : "Cadastrar aluno"}
      </h2>
      <label>
        Nome
        <input
          required
          maxLength={120}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </label>
      <label>
        WhatsApp
        <input
          required
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </label>
      <label>
        Categoria
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
        >
          {["A", "B", "A+B"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
        />
        Cadastro ativo
      </label>
      <p className="text-sm text-slate-500 sm:col-span-2">
        Cadastro manual não cria senha. Os créditos e o histórico são
        preservados.
      </p>
      {message && <p role="status">{message}</p>}
      <button disabled={busy} className="btn btn-green">
        Salvar aluno
      </button>
    </form>
  );
}
