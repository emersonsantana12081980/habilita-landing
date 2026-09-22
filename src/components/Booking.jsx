import React, { useEffect, useRef, useState } from "react";
import { X, CalendarDays, CheckCircle2 } from "lucide-react";
import { normalizePhone } from "../store";
import { teachesCategory } from "../store-data";
import { PackageDetails } from "./PackageDetails";
export function Booking({
  pack,
  data,
  update,
  close,
  contact,
  initialInstructorId = "",
}) {
  const dialog = useRef(null);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [instructorId, setInstructorId] = useState(
    () =>
      data.instructors.find(
        (i) =>
          i.id === initialInstructorId && teachesCategory(i, pack.category),
      )?.id || "",
  );
  const [requestedInstructor, setRequestedInstructor] = useState(null);
  const compatibleInstructors = data.instructors.filter((i) =>
    teachesCategory(i, pack.category),
  );
  const chosenInstructor = compatibleInstructors.find(
    (i) => i.id === instructorId,
  );
  const invalidInstructor = Boolean(instructorId && !chosenInstructor);
  useEffect(() => {
    const modal = dialog.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.showModal();
    return () => {
      modal.close();
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);
  const slots = data.slots
    .filter((s) => s.active && new Date(s.date) > new Date())
    .sort((a, b) => a.date.localeCompare(b.date));
  function submit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Informe seu nome.");
      return;
    }
    if (!normalizePhone(phone)) {
      setError("Informe um telefone válido com DDD.");
      return;
    }
    let requestedSlot;
    let conflict = false;
    let instructorConflict = false;
    let instructorSnapshot = null;
    const saved = update((current) => {
      const instructor = current.instructors.find(
        (i) => i.id === instructorId && teachesCategory(i, pack.category),
      );
      if (instructorId && !instructor) {
        instructorConflict = true;
        return null;
      }
      const s = current.slots.find(
        (s) => s.id === selected && s.active && new Date(s.date) > new Date(),
      );
      const activePack = current.packages.find(
        (p) => p.id === pack.id && p.active,
      );
      if (!s || !activePack) {
        conflict = true;
        return null;
      }
      requestedSlot = s;
      instructorSnapshot = instructor
        ? { id: instructor.id, name: instructor.name }
        : null;
      return {
        reservations: [
          ...current.reservations,
          {
            id: crypto.randomUUID(),
            name: name.trim(),
            phone,
            packageName: pack.name,
            date: s.date,
            instructorId: instructor?.id || "",
            instructorName: instructor?.name || "",
          },
        ],
        slots: current.slots.map((x) =>
          x.id === s.id ? { ...x, active: false } : x,
        ),
      };
    });
    if (saved) {
      setRequestedDate(requestedSlot.date);
      setRequestedInstructor(instructorSnapshot);
      setDone(true);
    } else
      setError(
        instructorConflict
          ? "Este instrutor não está mais disponível para esta categoria. Escolha outro ou continue sem preferência."
          : conflict
            ? "Este pacote ou horário não está mais disponível. Feche a janela e escolha outra opção."
            : "Não foi possível salvar sua solicitação.",
      );
  }
  function contactInstructor(message) {
    if (!done && invalidInstructor) {
      setError("Escolha um instrutor disponível ou continue sem preferência.");
      return;
    }
    if (!normalizePhone(data.whatsapp)) {
      setError(
        "O contato de atendimento será disponibilizado em breve. Tente novamente mais tarde.",
      );
      return;
    }
    setError("");
    contact(message, done ? requestedInstructor : chosenInstructor || null);
  }
  return (
    <dialog
      ref={dialog}
      onCancel={close}
      aria-labelledby="booking-title"
      className="booking-dialog"
    >
      <div className="p-6 sm:p-8">
        <div className="flex justify-between gap-4">
          <span className="icon-tile">
            <CalendarDays size={24} />
          </span>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-50"
            onClick={close}
            aria-label="Fechar agendamento"
          >
            <X size={22} />
          </button>
        </div>
        {done ? (
          <>
            <CheckCircle2 className="mt-6 text-green-600" size={35} />
            <h2 id="booking-title">Solicitação salva neste navegador.</h2>
            <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800">
              {pack.name}
              <span className="mt-2 block text-sm font-normal">
                Instrutor: {requestedInstructor?.name || "Sem preferência"}
              </span>
              <br />
              <span className="mt-1 inline-block font-normal">
                {new Date(requestedDate).toLocaleString("pt-BR", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </span>
            </p>
            <p className="my-5 text-sm leading-6 text-slate-500">
              Esta é uma demonstração. Para confirmar a aula e combinar o
              pagamento, envie sua solicitação ao instrutor pelo WhatsApp.
            </p>
            <button
              className="btn btn-green w-full"
              onClick={() =>
                contactInstructor(
                  `Olá! Sou ${name.trim()}. Tenho interesse em ${pack.name}, no dia ${new Date(requestedDate).toLocaleString("pt-BR")}. Podemos confirmar disponibilidade e pagamento?`,
                )
              }
            >
              Enviar ao instrutor
            </button>
          </>
        ) : (
          <>
            <h2 id="booking-title">{pack.name}</h2>
            <p className="my-4 text-sm text-slate-500">
              Categoria {pack.category.replace("+", "/")}
            </p>
            <PackageDetails pack={pack} />
            <p className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              Agendamento demonstrativo. Nenhuma cobrança será realizada. A
              confirmação acontece diretamente com o instrutor.
            </p>
            <div className="mt-5">
              <label>
                Instrutor de preferência
                <select
                  aria-label="Instrutor de preferência"
                  value={instructorId}
                  onChange={(e) => {
                    setInstructorId(e.target.value);
                    setError("");
                  }}
                >
                  <option value="">
                    Sem preferência — a equipe me orienta
                  </option>
                  {invalidInstructor && (
                    <option value={instructorId} disabled>
                      Instrutor indisponível — altere a escolha
                    </option>
                  )}
                  {compatibleInstructors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} · {i.category.replace("+", "/")}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {compatibleInstructors.length
                  ? "Exibimos quem atende à categoria do pacote. A agenda é compartilhada; a equipe confirma a disponibilidade do instrutor."
                  : "Ainda não há instrutores cadastrados para esta categoria. Você pode solicitar a aula sem preferência."}
              </p>
              {initialInstructorId &&
                !data.instructors.some(
                  (i) =>
                    i.id === initialInstructorId &&
                    teachesCategory(i, pack.category),
                ) && (
                  <p className="mt-2 text-xs text-amber-800">
                    O instrutor escolhido na página não atende este pacote ou
                    não está mais disponível. Selecione outra opção.
                  </p>
                )}
            </div>
            {slots.length ? (
              <form onSubmit={submit} className="mt-5 space-y-4">
                <p
                  id="slot-label"
                  className="text-xs font-semibold text-slate-600"
                >
                  Escolha um horário
                </p>
                <div
                  className="grid grid-cols-2 gap-2"
                  role="group"
                  aria-labelledby="slot-label"
                >
                  {slots.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={selected === s.id}
                      onClick={() => setSelected(s.id)}
                      className={
                        "rounded-lg border p-3 text-xs " +
                        (selected === s.id
                          ? "border-green-600 bg-green-50 text-green-800"
                          : "border-slate-200")
                      }
                    >
                      {new Date(s.date).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </button>
                  ))}
                </div>
                <label>
                  Nome de demonstração
                  <input
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  Telefone de demonstração
                  <input
                    required
                    type="tel"
                    maxLength={20}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                <button
                  disabled={!selected || invalidInstructor}
                  className="btn btn-green w-full disabled:opacity-40"
                >
                  Solicitar horário
                </button>
              </form>
            ) : (
              <div className="mt-6">
                <p className="mb-5 text-sm text-slate-500">
                  Ainda não há horários disponíveis na agenda. Combine o melhor
                  horário diretamente com o instrutor.
                </p>
                <button
                  className="btn btn-green w-full"
                  onClick={() =>
                    contactInstructor(
                      "Olá! Quero agendar o pacote " + pack.name,
                    )
                  }
                >
                  Consultar pelo WhatsApp
                </button>
              </div>
            )}
          </>
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700"
          >
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}
