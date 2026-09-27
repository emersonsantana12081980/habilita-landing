import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
export function BookingRules({readOnly=false}) {
  const [form, setForm] = useState(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase
      .from("booking_settings")
      .select("*")
      .single()
      .then(({ data, error }) => {
        if (error)
          setMessage("Execute o SQL das melhorias para ativar as regras.");
        else setForm(data);
      });
  }, []);
  if(readOnly)return form?<p className="my-4 rounded-xl bg-slate-100 p-3 text-sm">Agende com {form.minimum_notice_hours}h de antecedência. Cancele até {form.cancellation_notice_hours}h antes da aula para liberar o crédito. Limite de {form.daily_limit} aulas por dia.</p>:null;
  return (
    <section className="admin-card">
      <h2 className="text-xl font-bold">Regras de agendamento</h2>
      {message && (
        <p role="status" className="my-3">
          {message}
        </p>
      )}
      {form && (
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const { error } = await supabase
              .from("booking_settings")
              .update(form)
              .eq("id", true);
            setMessage(
              error
                ? "Não foi possível salvar."
                : "Regras salvas. As aulas existentes foram preservadas.",
            );
            setBusy(false);
          }}
        >
          {[
            [
              "minimum_notice_hours",
              "Antecedência para agendar (horas)",
              0,
              168,
            ],
            [
              "cancellation_notice_hours",
              "Antecedência para cancelar (horas)",
              0,
              720,
            ],
            ["daily_limit", "Máximo de aulas por aluno/dia", 1, 12],
          ].map(([key, label, min, max]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                required
                min={min}
                max={max}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: Number(e.target.value) }))
                }
              />
            </label>
          ))}
          <button disabled={busy} className="btn btn-green">
            Salvar regras
          </button>
        </form>
      )}
    </section>
  );
}
