import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
function offset(day, n) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const localDay = (v) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(v),
  );
const time = (v) =>
  new Date(v).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
export function WeeklyCalendar({
  day,
  onDay,
  students,
  instructors,
  lessons,
  category = "",
}) {
  const [slots, setSlots] = useState([]),
    [loading, setLoading] = useState(false),
    [message, setMessage] = useState("");
  const [blocked, setBlocked] = useState([]);
  const dow = new Date(day + "T12:00:00Z").getUTCDay();
  const start = day ? offset(day, -((dow + 6) % 7)) : "";
  const days = start
    ? Array.from({ length: 7 }, (_, n) => offset(start, n))
    : [];
  useEffect(() => {
    if (!start) return;
    const c = new AbortController();
    let active = true;
    setLoading(true);
    setMessage("");
    const timeout = setTimeout(() => c.abort(), 25000);
    (async () => {
      try {
        for (const d of days) {
          const result = await supabase
            .rpc("available_slots", { p_day: d, p_category: "A" })
            .abortSignal(c.signal);
          if (result.error) throw result.error;
        }
        const result = await supabase
          .from("availability_slots")
          .select("*")
          .gte("starts_at", start + "T00:00:00-03:00")
          .lt("starts_at", offset(start, 7) + "T00:00:00-03:00")
          .abortSignal(c.signal);
        if (result.error) throw result.error;
        const exceptions = await supabase
          .from("schedule_exceptions")
          .select("day,reason")
          .gte("day", start)
          .lt("day", offset(start, 7))
          .abortSignal(c.signal);
        if (exceptions.error) throw exceptions.error;
        if (active) {
          setSlots(result.data);
          setBlocked(exceptions.data);
        }
      } catch {
        if (active) {
          setSlots([]);
          setMessage(
            "Não foi possível atualizar a semana. Escolha novamente a data ou atualize o painel.",
          );
        }
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      c.abort();
      clearTimeout(timeout);
    };
  }, [start, lessons]);
  return (
    <section className="mb-6 rounded-2xl border bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Visão semanal</h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onDay(offset(day, -7))}
            className="rounded px-3 py-1 border"
          >
            ← Semana anterior
          </button>
          <button
            type="button"
            onClick={() => onDay(offset(day, 7))}
            className="rounded px-3 py-1 border"
          >
            Próxima semana →
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-400" /> Livre
        </span>
        &nbsp;·&nbsp;
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-400" /> Aula
        </span>
        &nbsp;·&nbsp;
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-400" /> Bloqueado
        </span>
      </p>
      {loading && <p role="status">Atualizando semana…</p>}
      {message && <p role="status">{message}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {days.map((d) => (
          <div
            key={d}
            className={`rounded-xl border p-3 ${d === day ? "border-green-600 shadow" : "border-slate-200"}`}
          >
            <button
              className="mb-3 w-full text-left font-bold"
              onClick={() => onDay(d)}
            >
              <div className="text-sm text-slate-500">
                {new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                  timeZone: "UTC",
                })}
              </div>
            </button>
            {blocked.some((b) => b.day === d) && (
              <p className="mb-2 rounded-lg bg-amber-50 p-2 text-xs">
                Sem atendimento: {blocked.find((b) => b.day === d).reason}
              </p>
            )}
            <div className="space-y-2">
              {lessons
                .filter(
                  (l) =>
                    localDay(l.starts_at) === d &&
                    l.status !== "cancelled" &&
                    (!category || l.category === category),
                )
                .map((l) => (
                  <div
                    key={l.id}
                    className="flex items-start justify-between rounded-lg bg-blue-50 p-2 text-xs text-blue-950"
                  >
                    <div>
                      <strong className="block">
                        {time(l.starts_at)} · {l.category}
                      </strong>
                      <div>
                        {students.find((s) => s.id === l.student_id)?.name ||
                          "Aluno"}
                      </div>
                      <div className="text-slate-600">
                        {
                          instructors.find((i) => i.id === l.instructor_id)
                            ?.name
                        }
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        className="text-sm text-slate-700 underline"
                        onClick={() => onDay(d)}
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              {slots
                .filter(
                  (s) =>
                    localDay(s.starts_at) === d &&
                    (!category || s.category === category) &&
                    !lessons.some(
                      (l) => l.slot_id === s.id && l.status !== "cancelled",
                    ),
                )
                .map((s) => {
                  const occupied = lessons.some(
                    (l) =>
                      l.status !== "cancelled" &&
                      (l.instructor_id === s.instructor_id ||
                        l.vehicle_id === s.vehicle_id) &&
                      new Date(l.starts_at).getTime() <
                        new Date(s.ends_at).getTime() +
                          s.interval_minutes * 60000 &&
                      new Date(l.blocked_until) > new Date(s.starts_at),
                  );
                  const free =
                    s.active &&
                    !blocked.some((b) => b.day === d) &&
                    !s.manually_blocked &&
                    !occupied &&
                    new Date(s.starts_at) > new Date();
                  return (
                    <div
                      key={s.id}
                      className={`flex items-start justify-between rounded-lg p-2 text-xs ${free ? "bg-green-50 text-green-900" : "bg-slate-100 text-slate-500"}`}
                    >
                      <div>
                        <div className="font-semibold">
                          {time(s.starts_at)} · {s.category}
                        </div>
                        <div className="text-slate-600">
                          {free
                            ? "Livre"
                            : occupied
                              ? "Ocupado"
                              : "Bloqueado / encerrado"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <button
                          className="text-sm text-slate-700 underline"
                          onClick={() => onDay(d)}
                        >
                          Selecionar
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
            {!slots.some(
              (s) =>
                localDay(s.starts_at) === d &&
                (!category || s.category === category),
            ) &&
              !lessons.some(
                (l) =>
                  localDay(l.starts_at) === d &&
                  l.status !== "cancelled" &&
                  (!category || l.category === category),
              ) && <p className="text-xs text-slate-500">Sem horários</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
