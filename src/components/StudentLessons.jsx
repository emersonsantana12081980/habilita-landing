import React, { useState } from "react";
import { Car, Bike, Clock3 } from "lucide-react";

export function StudentLessons({ lessons, busy, onCancel }) {
  const [filter, setFilter] = useState("Próximas");
  const upcoming = (l) =>
    l.status === "scheduled" && new Date(l.ends_at || l.starts_at) > new Date();
  const groups = {
    Próximas: lessons.filter(upcoming),
    Histórico: lessons.filter((l) => !upcoming(l)),
  };
  const visible = [...groups[filter]].sort((a, b) =>
    filter === "Próximas"
      ? new Date(a.starts_at) - new Date(b.starts_at)
      : new Date(b.starts_at) - new Date(a.starts_at),
  );
  const labels = {
    scheduled: "Agendada",
    cancelled: "Cancelada",
    completed: "Realizada",
    missed: "Falta",
  };
  const styles = {
    scheduled: "bg-blue-50 text-blue-700",
    cancelled: "bg-slate-100 text-slate-500",
    completed: "bg-green-50 text-green-700",
    missed: "bg-amber-50 text-amber-800",
  };
  return (
    <section className="mt-5" aria-label="Lista de aulas">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Suas aulas</h2>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {Object.keys(groups).map((label) => (
            <button
              key={label}
              aria-pressed={filter === label}
              onClick={() => setFilter(label)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${filter === label ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              {label} ({groups[label].length})
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {visible.map((l) => {
          const Icon = l.category === "A" ? Bike : Car;
          const d = new Date(l.starts_at);
          return (
            <article
              key={l.id}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-slate-100 py-2">
                <span className="text-xl font-bold leading-none">
                  {d.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    timeZone: "America/Sao_Paulo",
                  })}
                </span>
                <span className="mt-1 text-xs uppercase text-slate-500">
                  {d.toLocaleDateString("pt-BR", {
                    month: "short",
                    timeZone: "America/Sao_Paulo",
                  })}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <Icon size={16} />
                    {l.category === "A" ? "Aula de moto" : "Aula de carro"}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${styles[l.status]}`}
                  >
                    {labels[l.status]}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                  <Clock3 size={14} />
                  {d.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Sao_Paulo",
                  })}{" "}
                  · Categoria {l.category} · {d.getFullYear()}
                </p>
                {upcoming(l) && (
                  <button
                    disabled={busy}
                    onClick={() => onCancel(l)}
                    className="mt-2 py-1 text-xs font-semibold text-red-700 hover:underline"
                  >
                    Cancelar aula
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          {filter === "Próximas"
            ? "Nenhuma aula futura agendada. Escolha um horário em Agendar aula."
            : "Seu histórico de aulas aparecerá aqui."}
        </p>
      )}
      <p className="mt-4 text-xs text-slate-500">
        Precisa alterar uma aula? Fale com a equipe pelo botão Chame
        especialista.
      </p>
    </section>
  );
}
