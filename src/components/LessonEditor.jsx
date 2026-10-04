import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
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
export function LessonEditor({
  lesson,
  instructors,
  vehicles,
  onClose,
  onSaved,
}) {
  const [day, setDay] = useState(localDay(lesson.starts_at)),
    [slots, setSlots] = useState([]),
    [selected, setSelected] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setSelected("");
    setSlots([]);
    setMessage("");
    if (!day) return;
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => controller.abort(), 12000);
    supabase
      .rpc("reschedule_options", { p_lesson: lesson.id, p_day: day })
      .abortSignal(controller.signal)
      .then(({ data, error }) => {
        if (!active) return;
        if (error)
          setMessage(
            error.code === "PGRST202"
              ? "A edição precisa ser ativada com o novo SQL no Supabase."
              : "Não foi possível consultar horários. Tente outra data.",
          );
        else setSlots(data || []);
      })
      .catch(() => {
        if (active) setMessage("Falha de conexão. Tente novamente.");
      })
      .finally(() => {
        clearTimeout(timer);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [day, lesson.id]);
  return (
    <form
      className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || !selected) return;
        setBusy(true);
        setMessage("");
        try {
          const { error } = await supabase.rpc("reschedule_lesson", {
            p_lesson: lesson.id,
            p_slot: selected,
          });
          if (error) throw error;
          const next = slots.find((s) => s.id === selected);
          onSaved(localDay(next.starts_at));
        } catch (e) {
          setMessage(
            e.code === "P0001"
              ? e.message
              : "Não foi possível confirmar a alteração. Atualize a agenda para conferir antes de tentar novamente.",
          );
          setSelected("");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3 className="font-bold">Editar agendamento</h3>
      <p className="my-2 text-sm">
        O aluno e a categoria {lesson.category} serão mantidos. A troca usa o
        mesmo crédito reservado.
      </p>
      <fieldset disabled={busy} className="grid min-w-0 gap-3 sm:grid-cols-2">
        <label>
          Nova data
          <input
            type="date"
            required
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </label>
        <label>
          Novo horário e instrutor
          <select
            required
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={loading}
          >
            <option value="">Selecione um horário livre</option>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {time(s.starts_at)} ·{" "}
                {instructors.find((i) => i.id === s.instructor_id)?.name ||
                  "Instrutor"}{" "}
                ·{" "}
                {vehicles.find((v) => v.id === s.vehicle_id)?.name || "Veículo"}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      {loading && (
        <p role="status" className="mt-3">
          Buscando horários…
        </p>
      )}
      {!loading && !message && day && !slots.length && (
        <p className="mt-3 text-sm">
          Sem outros horários livres nesta data. Escolha outro dia.
        </p>
      )}
      {message && (
        <p role="status" className="mt-3">
          {message}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          disabled={busy || loading || !selected}
          className="btn btn-green"
        >
          Salvar alteração
        </button>
        <button disabled={busy} type="button" onClick={onClose}>
          Fechar edição
        </button>
      </div>
    </form>
  );
}
