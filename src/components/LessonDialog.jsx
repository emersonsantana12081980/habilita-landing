import React, { useEffect, useRef, useState } from "react";
import { LessonEditor } from "./LessonEditor";
import { supabase } from "../lib/supabase";

export function LessonDialog({
  lesson,
  students,
  instructors,
  vehicles,
  onClose,
  onSaved,
}) {
  const ref = useRef(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  const name = (items, id) =>
    items.find((i) => i.id === id)?.name || "Não informado";
  return (
    <dialog
      ref={ref}
      aria-labelledby="lesson-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border-0 bg-white p-5 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id="lesson-dialog-title" className="text-xl font-bold">
          Detalhes da aula
        </h2>
        <button
          autoFocus
          disabled={busy}
          onClick={onClose}
          aria-label="Fechar detalhes"
          className="rounded-lg px-3 py-2 hover:bg-slate-100"
        >
          ✕
        </button>
      </div>
      <p className="text-lg font-bold">{name(students, lesson.student_id)}</p>
      <p className="mt-1 text-sm text-slate-600">
        {new Date(lesson.starts_at).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          dateStyle: "short",
          timeStyle: "short",
        })}{" "}
        · Categoria {lesson.category}
      </p>
      <dl className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
        <div>
          <dt className="text-slate-500">Instrutor</dt>
          <dd className="font-semibold">
            {name(instructors, lesson.instructor_id)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Veículo</dt>
          <dd className="font-semibold">{name(vehicles, lesson.vehicle_id)}</dd>
        </div>
      </dl>
      <p className="text-sm">
        Status:{" "}
        {
          {
            scheduled: "Agendada",
            cancelled: "Cancelada",
            completed: "Realizada",
            missed: "Falta",
          }[lesson.status]
        }
      </p>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {lesson.status === "scheduled" && !editing && (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            disabled={busy}
            className="btn btn-green"
            onClick={() => setEditing(true)}
          >
            Editar agendamento
          </button>
          <button
            disabled={busy}
            className="rounded-xl border border-red-200 px-4 py-2 text-red-700"
            onClick={async () => {
              if (
                !window.confirm(
                  "Cancelar esta aula e devolver o crédito ao aluno?",
                )
              )
                return;
              setBusy(true);
              setError("");
              try {
                const result = await supabase.rpc("set_lesson_status", {
                  p_lesson: lesson.id,
                  p_status: "cancelled",
                });
                if (result.error) throw result.error;
                onSaved();
              } catch (e) {
                setError(
                  e.code === "P0001"
                    ? e.message
                    : "Não foi possível confirmar o cancelamento. Atualize a agenda para conferir.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Cancelando…" : "Cancelar aula"}
          </button>
        </div>
      )}
      {editing && (
        <LessonEditor
          lesson={lesson}
          instructors={instructors}
          vehicles={vehicles}
          onClose={() => setEditing(false)}
          onSaved={onSaved}
        />
      )}
    </dialog>
  );
}
