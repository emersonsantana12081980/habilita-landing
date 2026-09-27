import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
const defaults = {
  weekdays: [1, 2, 3, 4, 5],
  opens: "08:00",
  closes: "18:00",
  lunch_start: "12:00",
  lunch_end: "13:00",
  duration: 50,
  gap: 10,
  horizon: 30,
  category: "B",
  instructor_id: "",
  vehicle_id: "",
  active: true,
};
export function ScheduleSettings({ instructors, vehicles }) {
  const [form, setForm] = useState(defaults),
    [rules, setRules] = useState([]),
    [exceptions, setExceptions] = useState([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  const [block, setBlock] = useState({ day: "", reason: "" });
  async function load() {
    setReady(false);
    const [r, e] = await Promise.all([
      supabase.from("schedule_rules").select("*"),
      supabase.from("schedule_exceptions").select("*").order("day"),
    ]);
    if (r.error || e.error) {
      setMessage(
        "Para ativar esta configuração, execute o SQL da agenda semanal no Supabase.",
      );
      return;
    }
    setRules(r.data);
    setExceptions(e.data);
    setReady(true);
  }
  useEffect(() => {
    load();
  }, []);
  async function save(fn, success) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await fn();
      if (error) throw error;
      await load();
      setMessage(success);
    } catch {
      setMessage("Não foi possível salvar. Confira os campos e a conexão.");
    } finally {
      setBusy(false);
    }
  }
  function submit(e) {
    e.preventDefault();
    if (!form.weekdays.length) {
      setMessage("Selecione pelo menos um dia da semana.");
      return;
    }
    if (
      form.closes <= form.opens ||
      (form.lunch_start &&
        (!form.lunch_end ||
          form.lunch_end <= form.lunch_start ||
          form.lunch_start < form.opens ||
          form.lunch_end > form.closes))
    ) {
      setMessage("Confira o expediente e a pausa para almoço.");
      return;
    }
    const payload = {
      ...form,
      duration: Number(form.duration),
      gap: Number(form.gap),
      horizon: Number(form.horizon),
      lunch_start: form.lunch_start || null,
      lunch_end: form.lunch_start ? form.lunch_end : null,
    };
    save(
      () =>
        supabase
          .from("schedule_rules")
          .upsert(payload, { onConflict: "instructor_id,vehicle_id" }),
      "Rotina salva. Os horários serão disponibilizados automaticamente a cada consulta.",
    );
  }
  function field(key, label, type = "time", props = {}) {
    return (
      <label>
        {label}
        <input
          required
          type={type}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          {...props}
        />
      </label>
    );
  }
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Configurações da agenda</h2>
        <p className="mt-2 text-slate-600">
          Configure uma vez. A rotina se repete nas próximas semanas, sem
          cadastrar cada data.
        </p>
      </div>
      {message && (
        <p role="status" className="rounded-xl bg-blue-50 p-4">
          {message}
        </p>
      )}
      {!ready ? (
        <button onClick={load} className="btn btn-green">
          Verificar configuração
        </button>
      ) : (
        <>
          <form onSubmit={submit} className="admin-card">
            <fieldset
              disabled={busy}
              className="grid min-w-0 gap-4 sm:grid-cols-2"
            >
              <label>
                Categoria
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...defaults, category: e.target.value })
                  }
                >
                  <option value="A">Moto</option>
                  <option value="B">Carro</option>
                </select>
              </label>
              <label>
                Instrutor
                <select
                  required
                  value={form.instructor_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, instructor_id: e.target.value }))
                  }
                >
                  <option value="">Selecione</option>
                  {instructors
                    .filter(
                      (i) => i.active && i.category.includes(form.category),
                    )
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Veículo
                <select
                  required
                  value={form.vehicle_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vehicle_id: e.target.value }))
                  }
                >
                  <option value="">Selecione</option>
                  {vehicles
                    .filter((v) => v.active && v.category === form.category)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                </select>
              </label>
              <div className="sm:col-span-2">
                <p className="mb-2 font-semibold">Repetir toda semana</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Domingo",
                    "Segunda",
                    "Terça",
                    "Quarta",
                    "Quinta",
                    "Sexta",
                    "Sábado",
                  ].map((name, n) => (
                    <label
                      className="flex items-center gap-2 rounded-xl border p-3"
                      key={name}
                    >
                      <input
                        type="checkbox"
                        checked={form.weekdays.includes(n)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            weekdays: e.target.checked
                              ? [...f.weekdays, n]
                              : f.weekdays.filter((d) => d !== n),
                          }))
                        }
                      />
                      {name}
                    </label>
                  ))}
                </div>
              </div>
              {field("opens", "Início do expediente")}
              {field("closes", "Fim do expediente")}
              <label className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.lunch_start}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      lunch_start: e.target.checked ? "12:00" : "",
                      lunch_end: e.target.checked ? "13:00" : "",
                    }))
                  }
                />
                Pausa para almoço
              </label>
              {!!form.lunch_start && (
                <>
                  {field("lunch_start", "Início do almoço")}
                  {field("lunch_end", "Fim do almoço")}
                </>
              )}
              {field("duration", "Duração da aula (minutos)", "number", {
                min: 15,
                max: 180,
              })}
              {field("gap", "Intervalo entre aulas (minutos)", "number", {
                min: 0,
                max: 120,
              })}
              <label>
                Liberar sempre os próximos
                <select
                  value={form.horizon}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, horizon: Number(e.target.value) }))
                  }
                >
                  {[7, 15, 30, 60, 90].map((n) => (
                    <option key={n} value={n}>
                      {n} dias
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-green" type="submit">
                Salvar e ativar rotina
              </button>
            </fieldset>
          </form>
          <div className="space-y-3">
            {rules.map((r) => (
              <article key={r.id} className="admin-card">
                <h3 className="font-bold">
                  {instructors.find((i) => i.id === r.instructor_id)?.name} ·
                  Categoria {r.category}
                </h3>
                <p>
                  {r.opens.slice(0, 5)} às {r.closes.slice(0, 5)} · próximos{" "}
                  {r.horizon} dias · {r.active ? "Ativa" : "Pausada"}
                </p>
                <div className="mt-3 flex gap-4">
                  <button
                    disabled={busy}
                    className="text-green-700 underline"
                    onClick={() => {
                      setForm({
                        ...r,
                        active: true,
                        opens: r.opens.slice(0, 5),
                        closes: r.closes.slice(0, 5),
                        lunch_start: r.lunch_start?.slice(0, 5) || "",
                        lunch_end: r.lunch_end?.slice(0, 5) || "",
                      });
                    }}
                  >
                    Editar rotina
                  </button>
                  <button
                    disabled={busy}
                    className="underline"
                    onClick={() =>
                      save(
                        () =>
                          supabase
                            .from("schedule_rules")
                            .update({ active: !r.active })
                            .eq("id", r.id),
                        "Rotina atualizada. As aulas já reservadas foram preservadas.",
                      )
                    }
                  >
                    {r.active ? "Pausar" : "Ativar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          <form
            className="admin-card space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save(
                () => supabase.from("schedule_exceptions").upsert(block),
                "Data bloqueada para novas reservas. Aulas existentes foram mantidas.",
              );
            }}
          >
            <h3 className="text-xl font-bold">Feriados e folgas</h3>
            <p className="text-sm text-slate-600">
              Cadastre as datas sem atendimento. O bloqueio vale para todos os
              instrutores. Feriados não são importados automaticamente.
            </p>
            <label>
              Data bloqueada
              <input
                required
                type="date"
                value={block.day}
                onChange={(e) =>
                  setBlock((b) => ({ ...b, day: e.target.value }))
                }
              />
            </label>
            <label>
              Motivo
              <input
                required
                value={block.reason}
                onChange={(e) =>
                  setBlock((b) => ({ ...b, reason: e.target.value }))
                }
                placeholder="Ex.: feriado municipal ou folga"
              />
            </label>
            <button disabled={busy} className="btn btn-green">
              Bloquear data
            </button>
            {exceptions.map((e) => (
              <div key={e.day} className="flex flex-wrap justify-between gap-3">
                <span>
                  {e.day.split("-").reverse().join("/")} · {e.reason}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  className="underline"
                  onClick={() =>
                    save(
                      () =>
                        supabase
                          .from("schedule_exceptions")
                          .delete()
                          .eq("day", e.day),
                      "Bloqueio removido.",
                    )
                  }
                >
                  Remover bloqueio
                </button>
              </div>
            ))}
          </form>
        </>
      )}
    </section>
  );
}
