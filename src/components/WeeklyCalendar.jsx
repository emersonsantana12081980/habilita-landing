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
export function WeeklyCalendar({ day, onDay, students, instructors, lessons }) {
  const [slots, setSlots] = useState([]),
    [loading, setLoading] = useState(false),
    [message, setMessage] = useState("");
  const [blocked,setBlocked]=useState([]);
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
        const exceptions=await supabase.from('schedule_exceptions').select('day,reason').gte('day',start).lt('day',offset(start,7)).abortSignal(c.signal);
        if(exceptions.error)throw exceptions.error;
        if (active) {setSlots(result.data);setBlocked(exceptions.data);}
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
          <button type="button" onClick={() => onDay(offset(day, -7))}>
            ← Semana anterior
          </button>
          <button type="button" onClick={() => onDay(offset(day, 7))}>
            Próxima semana →
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm">
        Verde: livre · Azul: aula · Cinza: bloqueado ou encerrado
      </p>
      {loading && <p role="status">Atualizando semana…</p>}
      {message && <p role="status">{message}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {days.map((d) => (
          <div
            key={d}
            className={`rounded-xl border p-2 ${d === day ? "border-green-600" : "border-slate-200"}`}
          >
            <button className="mb-3 w-full font-bold" onClick={() => onDay(d)}>
              {new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                timeZone: "UTC",
              })}
            </button>
            {blocked.some(b=>b.day===d)&&<p className="mb-2 rounded-lg bg-amber-50 p-2 text-xs">Sem atendimento: {blocked.find(b=>b.day===d).reason}</p>}
            {lessons
              .filter(
                (l) => localDay(l.starts_at) === d && l.status !== "cancelled",
              )
              .map((l) => (
                <button
                  onClick={() => onDay(d)}
                  key={l.id}
                  className="mb-2 block w-full rounded-lg bg-blue-100 p-2 text-left text-xs text-blue-950"
                >
                  <strong>
                    {time(l.starts_at)} · {l.category}
                  </strong>
                  <br />
                  {students.find((s) => s.id === l.student_id)?.name || "Aluno"}
                  <br />
                  {instructors.find((i) => i.id === l.instructor_id)?.name}
                </button>
              ))}
            {slots
              .filter(
                (s) =>
                  localDay(s.starts_at) === d &&
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
                    s.active && !blocked.some(b=>b.day===d) &&
                  !s.manually_blocked &&
                  !occupied &&
                  new Date(s.starts_at) > new Date();
                return (
                  <button
                    onClick={() => onDay(d)}
                    key={s.id}
                    className={`mb-2 block w-full rounded-lg p-2 text-left text-xs ${free ? "bg-green-100 text-green-900" : "bg-slate-100 text-slate-500"}`}
                  >
                    {time(s.starts_at)} · {s.category}
                    <br />
                    {free
                      ? "Livre"
                      : occupied
                        ? "Ocupado"
                        : "Bloqueado / encerrado"}
                  </button>
                );
              })}
            {!slots.some((s) => localDay(s.starts_at) === d) &&
              !lessons.some((l) => localDay(l.starts_at) === d) && (
                <p className="text-xs text-slate-500">Sem horários</p>
              )}
          </div>
        ))}
      </div>
    </section>
  );
}
