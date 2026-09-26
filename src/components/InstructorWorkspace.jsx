import React, { useState } from "react";
import {
  CalendarDays,
  Users,
  Clock3,
  Plus,
  ArrowLeft,
  Settings,
  CarFront,
  Check,
  Search,
  Wallet,
} from "lucide-react";
import { Brand } from "./Brand";
import { FinanceManager } from "./FinanceManager";
import { StudentRequests, StudentNotifications } from "./StudentRequests";
import { normalizePhone } from "../store-data";
import {
  balance,
  createLesson,
  changeLessonStatus,
  freeTimes,
  localDay,
  validHours,
  DEFAULT_VEHICLES,
  LESSON_STATUS,
} from "../management";

const clock = (value) =>
  new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
const emptyClient = {
  name: "",
  phone: "",
  category: "B",
  packageId: "",
  active: true,
  credits: { A: 0, B: 2 },
};
const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function InstructorWorkspace({ data, update, error }) {
  const [tab, setTab] = useState("today");
  const [day, setDay] = useState(localDay());
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [client, setClient] = useState(null);
  const [historyId, setHistoryId] = useState("");
  const [selection, setSelection] = useState({
    clientId: "",
    category: "B",
    instructorId: "",
    vehicleId: "carro-mobi",
    start: "",
  });
  const [hours, setHours] = useState(data.workingHours);
  const lessons = data.lessons
    .filter((l) => localDay(new Date(l.start)) === day)
    .sort((a, b) => a.start.localeCompare(b.start));
  const todayLessons = data.lessons.filter(
    (l) =>
      localDay(new Date(l.start)) === localDay() && l.status !== "cancelled",
  );
  const activeClients = data.clients.filter((c) => c.active);
  const chosenClient = data.clients.find((c) => c.id === selection.clientId);
  const available = freeTimes(data, { ...selection, day });
  function navigate(next) {
    setTab(next);
    setMessage("");
  }
  function openSchedule(c) {
    setSelection({
      clientId: c.id,
      category: c.category === "A" ? "A" : "B",
      instructorId: "",
      vehicleId: c.category === "A" ? "moto-treino" : "carro-mobi",
      start: "",
    });
    setDay(localDay());
    navigate("agenda");
  }
  function saveClient(e) {
    e.preventDefault();
    if (!client.name.trim() || !normalizePhone(client.phone)) {
      setMessage("Informe nome e WhatsApp com DDD válido.");
      return;
    }
    if (
      ![client.credits.A, client.credits.B].every(
        (n) =>
          Number.isInteger(Number(n)) && Number(n) >= 0 && Number(n) <= 200,
      )
    ) {
      setMessage("Informe quantidades inteiras de aulas entre 0 e 200.");
      return;
    }
    const record = {
      ...client,
      id: client.id || crypto.randomUUID(),
      name: client.name.trim(),
      phone: client.phone.trim(),
      credits: { A: Number(client.credits.A), B: Number(client.credits.B) },
    };
    let reason = "";
    const saved = update((current) => {
      if (
        current.clients.some(
          (c) =>
            c.id !== record.id &&
            normalizePhone(c.phone) === normalizePhone(record.phone),
        )
      ) {
        reason = "Já existe um cliente com este WhatsApp.";
        return null;
      }
      if (client.id && !current.clients.some((c) => c.id === client.id)) {
        reason = "Cliente não encontrado. Reabra o cadastro.";
        return null;
      }
      if (
        ["A", "B"].some(
          (cat) => balance(record, current.lessons, cat).available < 0,
        )
      ) {
        reason =
          "O total de aulas não pode ser menor que as aulas usadas e agendadas.";
        return null;
      }
      return {
        clients: client.id
          ? current.clients.map((c) => (c.id === record.id ? record : c))
          : [...current.clients, record],
      };
    });
    if (saved) {
      setClient(null);
      setMessage("Cliente salvo neste navegador.");
    } else setMessage(reason || "Não foi possível salvar.");
  }
  function book(e) {
    e.preventDefault();
    let reason = "";
    const saved = update((current) => {
      const result = createLesson(current, {
        ...selection,
        day,
        id: crypto.randomUUID(),
      });
      if (result.error) {
        reason = result.error;
        return null;
      }
      return { lessons: [...current.lessons, result.lesson] };
    });
    setMessage(
      saved
        ? "Aula agendada. O horário foi reservado na agenda local."
        : reason || "Não foi possível agendar.",
    );
    setSelection({ ...selection, start: "" });
  }
  function changeStatus(id, status) {
    if (
      status === "cancelled" &&
      !window.confirm(
        "Cancelar esta aula? O horário e o saldo serão liberados.",
      )
    )
      return;
    const saved = update((current) => {
      const next = changeLessonStatus(
        current.lessons.find((l) => l.id === id),
        status,
      );
      return next
        ? { lessons: current.lessons.map((l) => (l.id === id ? next : l)) }
        : null;
    });
    setMessage(
      saved
        ? "Situação da aula atualizada."
        : "Não foi possível alterar. Realizadas e faltas só podem ser registradas após o fim da aula.",
    );
  }
  function lessonList(items) {
    return items.length ? (
      <div className="mt-5 space-y-3">
        {items.map((l) => (
          <article
            key={l.id}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">
                  {clock(l.start)}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    até {clock(l.end)}
                  </span>
                </p>
                <p className="mt-1 font-semibold">{l.clientName}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {l.category === "A" ? "Moto" : "Carro"} · {l.instructorName}
                  <br />
                  {l.vehicleName}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${l.status === "completed" ? "bg-green-50 text-green-700" : l.status === "scheduled" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}
              >
                {LESSON_STATUS[l.status]}
              </span>
            </div>
            {l.status === "scheduled" && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {Date.parse(l.end) <= Date.now() && (
                  <>
                    <button
                      className="btn btn-outline"
                      onClick={() => changeStatus(l.id, "completed")}
                    >
                      <Check size={15} /> Realizada
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => changeStatus(l.id, "missed")}
                    >
                      Registrar falta
                    </button>
                  </>
                )}
                <button
                  className="px-3 py-2 text-xs font-semibold text-red-700"
                  onClick={() => changeStatus(l.id, "cancelled")}
                >
                  Cancelar aula
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    ) : (
      <div className="my-8 text-center">
        <CalendarDays className="mx-auto mb-3 text-slate-300" size={36} />
        <p className="font-semibold">Nenhuma aula neste dia.</p>
        <p className="mt-2 text-sm text-slate-500">
          Selecione um cliente e um horário livre para começar.
        </p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#f3f5f7]">
      <header className="border-b border-slate-200 bg-white">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-5">
          <Brand />
          <a href="/" className="text-sm font-semibold text-slate-600">
            <ArrowLeft size={16} className="mr-2 inline" />
            Ver site
          </a>
        </div>
      </header>
      <main className="container py-7 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">GESTÃO DO INSTRUTOR</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
              Seu dia, organizado.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Clientes, aulas e horários em um só lugar.
            </p>
          </div>
          <a href="/admin?view=site" className="btn btn-outline">
            <Settings size={17} /> Gerenciar site e pacotes
          </a>
        </div>
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          Versão de demonstração · Use dados fictícios. Os cadastros ficam
          apenas neste navegador, sem login e sem sincronização com o Google
          Agenda.
        </p>
        <nav
          aria-label="Gestão do instrutor"
          className="my-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
        >
          {[
            ["today", "Hoje", Clock3],
            ["clients", "Clientes", Users],
            ["agenda", "Agenda", CalendarDays],
            ["finance", "Faturamento", Wallet],
            [
              "students",
              `Pedidos de alunos${data.packageRequests.filter((r) => r.status === "pending").length ? ` (${data.packageRequests.filter((r) => r.status === "pending").length})` : ""}`,
              Users,
            ],
            ["hours", "Expediente", Settings],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => {
                navigate(id);
                if (id === "today") setDay(localDay());
              }}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-5 text-sm font-semibold ${tab === id ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        {(message || error) && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-slate-200 bg-white p-4 text-sm"
          >
            {error || message}
          </p>
        )}
        <StudentNotifications
          data={data}
          update={update}
          openLesson={(n) => {
            navigate("agenda");
            setDay(localDay(new Date(n.start)));
          }}
        />
        {tab === "students" && <StudentRequests data={data} update={update} />}
        {tab === "today" && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Aulas hoje", todayLessons.length],
                [
                  "A realizar",
                  todayLessons.filter((l) => l.status === "scheduled").length,
                ],
                ["Clientes ativos", activeClients.length],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
              <section className="admin-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="admin-title">Aulas de hoje</h2>
                  <span className="text-xs text-slate-500">
                    {new Date().toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
                {lessonList(lessons)}
              </section>
              <section className="admin-card">
                <h2 className="admin-title">Vamos organizar a próxima aula?</h2>
                <p className="my-4 text-sm leading-6 text-slate-500">
                  Cadastre o cliente, confira o saldo e escolha um horário
                  disponível.
                </p>
                <button
                  className="btn btn-green w-full"
                  onClick={() => {
                    navigate("clients");
                    setClient({
                      ...emptyClient,
                      credits: { ...emptyClient.credits },
                    });
                  }}
                >
                  <Plus size={17} /> Cadastrar cliente
                </button>
                <button
                  className="btn btn-outline mt-3 w-full"
                  onClick={() => navigate("agenda")}
                >
                  <CalendarDays size={17} /> Agendar aula
                </button>
                <p className="mt-5 text-xs text-slate-500">
                  Acompanhe vendas e recebimentos na aba Faturamento.
                </p>
              </section>
            </div>
          </>
        )}
        {tab === "clients" && (
          <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
            <section className="admin-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="admin-title">
                  Clientes ({data.clients.length})
                </h2>
                <button
                  className="btn btn-green"
                  onClick={() => {
                    setClient({
                      ...emptyClient,
                      credits: { ...emptyClient.credits },
                    });
                    setHistoryId("");
                  }}
                >
                  <Plus size={17} /> Novo cliente
                </button>
              </div>
              <label className="mt-5">
                <Search size={15} className="mr-1 inline" /> Buscar cliente
                <input
                  placeholder="Nome ou WhatsApp"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              {!data.clients.length && (
                <p className="py-8 text-sm text-slate-500">
                  Seu primeiro cliente começa aqui. Clique em “Novo cliente”
                  para cadastrar um exemplo.
                </p>
              )}
              <div className="mt-5 space-y-4">
                {data.clients
                  .filter((c) =>
                    `${c.name} ${c.phone}`
                      .toLocaleLowerCase("pt-BR")
                      .includes(search.toLocaleLowerCase("pt-BR")),
                  )
                  .map((c) => (
                    <article
                      key={c.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words font-bold">{c.name}</h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {c.phone} · Categoria {c.category.replace("+", "/")}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {c.active ? "Ativo" : "Arquivado"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {c.packageName || "Aulas avulsas"}
                      </p>
                      <div className="my-3 space-y-1">
                        {["B", "A"]
                          .filter((cat) => c.credits[cat] > 0)
                          .map((cat) => {
                            const b = balance(c, data.lessons, cat);
                            return (
                              <p key={cat} className="text-xs leading-5">
                                <strong>
                                  {cat === "B" ? "Carro" : "Moto"}:{" "}
                                  {b.available} livres
                                </strong>{" "}
                                · {b.reserved} agendadas · {b.used} usadas
                              </p>
                            );
                          })}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {c.active && (
                          <button
                            className="text-sm font-bold text-green-700"
                            onClick={() => openSchedule(c)}
                          >
                            Agendar aula
                          </button>
                        )}
                        <button
                          className="text-sm font-semibold text-slate-600"
                          onClick={() => {
                            setClient({ ...c, credits: { ...c.credits } });
                            setHistoryId("");
                          }}
                        >
                          Editar cliente
                        </button>
                        <button
                          className="text-sm font-semibold text-slate-600"
                          onClick={() => {
                            setHistoryId(c.id);
                            setClient(null);
                          }}
                        >
                          Histórico
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            </section>
            {client ? (
              <section className="admin-card">
                <h2 className="admin-title">
                  {client.id ? "Editar cliente" : "Cadastrar cliente"}
                </h2>
                <form onSubmit={saveClient} className="mt-5 space-y-4">
                  <label>
                    Nome do cliente
                    <input
                      required
                      maxLength={80}
                      value={client.name}
                      onChange={(e) =>
                        setClient({ ...client, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    WhatsApp do cliente
                    <input
                      required
                      type="tel"
                      maxLength={20}
                      value={client.phone}
                      onChange={(e) =>
                        setClient({ ...client, phone: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Categoria do cliente
                    <select
                      value={client.category}
                      onChange={(e) =>
                        setClient({
                          ...client,
                          category: e.target.value,
                          packageId: "",
                          packageName: "",
                          credits: {
                            A: e.target.value.includes("A") ? 2 : 0,
                            B: e.target.value.includes("B") ? 2 : 0,
                          },
                        })
                      }
                    >
                      <option>B</option>
                      <option>A</option>
                      <option>A+B</option>
                    </select>
                  </label>
                  <label>
                    Pacote do cliente
                    <select
                      value={client.packageId}
                      onChange={(e) => {
                        const p = data.packages.find(
                          (p) => p.id === e.target.value,
                        );
                        setClient({
                          ...client,
                          packageId: p?.id || "",
                          packageName: p?.name || "",
                          credits: p
                            ? {
                                A:
                                  p.category === "A"
                                    ? Number(p.lessons)
                                    : p.category === "A+B"
                                      ? Number(p.motorcycleLessons || 0)
                                      : 0,
                                B:
                                  p.category === "B"
                                    ? Number(p.lessons)
                                    : p.category === "A+B"
                                      ? Number(p.carLessons || 0)
                                      : 0,
                              }
                            : client.credits,
                        });
                      }}
                    >
                      <option value="">
                        Aulas avulsas / quantidade manual
                      </option>
                      {client.packageId &&
                        !data.packages.some(
                          (p) =>
                            p.id === client.packageId &&
                            p.active &&
                            p.category === client.category,
                        ) && (
                          <option value={client.packageId}>
                            {client.packageName} (histórico)
                          </option>
                        )}
                      {data.packages
                        .filter(
                          (p) => p.active && p.category === client.category,
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  {["B", "A"]
                    .filter((cat) => client.category.includes(cat))
                    .map((cat) => (
                      <label key={cat}>
                        Total de aulas de {cat === "B" ? "carro" : "moto"}
                        <input
                          type="number"
                          required
                          min="0"
                          max="200"
                          value={client.credits[cat]}
                          onChange={(e) =>
                            setClient({
                              ...client,
                              credits: {
                                ...client.credits,
                                [cat]: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </label>
                    ))}
                  <p className="text-xs leading-5 text-slate-500">
                    O total inclui aulas usadas, agendadas e disponíveis.
                    Alterar o pacote no site não modifica este saldo.
                  </p>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={client.active}
                      onChange={(e) =>
                        setClient({ ...client, active: e.target.checked })
                      }
                    />{" "}
                    Cliente ativo
                  </label>
                  <div className="flex gap-3">
                    <button className="btn btn-green">Salvar cliente</button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setClient(null)}
                    >
                      Fechar
                    </button>
                  </div>
                </form>
              </section>
            ) : historyId ? (
              <section className="admin-card">
                <h2 className="admin-title">Histórico de aulas</h2>
                <p className="mt-3 font-semibold">
                  {data.clients.find((c) => c.id === historyId)?.name}
                </p>
                {data.lessons.filter((l) => l.clientId === historyId).length ? (
                  data.lessons
                    .filter((l) => l.clientId === historyId)
                    .sort((a, b) => b.start.localeCompare(a.start))
                    .map((l) => (
                      <p
                        key={l.id}
                        className="mt-3 border-t border-slate-100 pt-3 text-sm"
                      >
                        {new Date(l.start).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}{" "}
                        · {l.category}
                        <span className="block text-xs text-slate-500">
                          {l.instructorName} · {LESSON_STATUS[l.status]}
                        </span>
                      </p>
                    ))
                ) : (
                  <p className="mt-5 text-sm text-slate-500">
                    Nenhuma aula registrada.
                  </p>
                )}
              </section>
            ) : (
              <section className="admin-card">
                <Users className="text-green-600" />
                <h2 className="admin-title mt-4">
                  Um cadastro, todas as aulas.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Selecione um cliente para editar seus dados ou acompanhar o
                  histórico. Arquivar preserva as aulas já registradas.
                </p>
              </section>
            )}
          </div>
        )}
        {tab === "agenda" && (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <section className="admin-card">
              <h2 className="admin-title">Agenda de aulas</h2>
              <label className="mt-5">
                Dia da agenda
                <input
                  type="date"
                  required
                  value={day}
                  onChange={(e) => {
                    setDay(e.target.value);
                    setSelection({ ...selection, start: "" });
                  }}
                />
              </label>
              {lessonList(lessons)}
            </section>
            <section className="admin-card">
              <h2 className="admin-title">Agendar aula</h2>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Selecione os recursos. Aparecem apenas horários livres dentro do
                expediente.
              </p>
              <form onSubmit={book} className="mt-5 space-y-4">
                <label>
                  Cliente da aula
                  <select
                    required
                    value={selection.clientId}
                    onChange={(e) => {
                      const c = data.clients.find(
                        (c) => c.id === e.target.value,
                      );
                      setSelection({
                        ...selection,
                        clientId: e.target.value,
                        category: c?.category === "A" ? "A" : "B",
                        vehicleId:
                          c?.category === "A" ? "moto-treino" : "carro-mobi",
                        instructorId: "",
                        start: "",
                      });
                    }}
                  >
                    <option value="">Selecione o cliente</option>
                    {activeClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!activeClients.length && (
                  <button
                    type="button"
                    className="text-sm font-bold text-green-700"
                    onClick={() => {
                      navigate("clients");
                      setClient({
                        ...emptyClient,
                        credits: { ...emptyClient.credits },
                      });
                    }}
                  >
                    Cadastrar primeiro cliente
                  </button>
                )}
                <label>
                  Tipo de aula
                  <select
                    value={selection.category}
                    onChange={(e) =>
                      setSelection({
                        ...selection,
                        category: e.target.value,
                        vehicleId:
                          e.target.value === "A" ? "moto-treino" : "carro-mobi",
                        instructorId: "",
                        start: "",
                      })
                    }
                  >
                    {["B", "A"]
                      .filter(
                        (cat) =>
                          !chosenClient || chosenClient.category.includes(cat),
                      )
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === "B" ? "Carro · B" : "Moto · A"}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Instrutor da aula
                  <select
                    required
                    value={selection.instructorId}
                    onChange={(e) =>
                      setSelection({
                        ...selection,
                        instructorId: e.target.value,
                        start: "",
                      })
                    }
                  >
                    <option value="">Selecione o instrutor</option>
                    {data.instructors
                      .filter(
                        (i) =>
                          i.active &&
                          (i.category === "A+B" ||
                            i.category === selection.category),
                      )
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Veículo da aula
                  <select
                    value={selection.vehicleId}
                    onChange={(e) =>
                      setSelection({
                        ...selection,
                        vehicleId: e.target.value,
                        start: "",
                      })
                    }
                  >
                    {DEFAULT_VEHICLES.filter(
                      (v) => v.category === selection.category,
                    ).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </label>
                {chosenClient && (
                  <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                    Aulas disponíveis:{" "}
                    <strong>
                      {
                        balance(chosenClient, data.lessons, selection.category)
                          .available
                      }
                    </strong>
                  </p>
                )}
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold">
                    Horários livres · {data.workingHours.duration} min por aula
                  </legend>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {available.map((s) => (
                      <button
                        type="button"
                        key={s.start}
                        aria-pressed={selection.start === s.start}
                        className={`min-h-11 rounded-lg border px-2 py-3 text-sm font-semibold ${selection.start === s.start ? "border-green-600 bg-green-50 text-green-800" : "border-slate-200"}`}
                        onClick={() =>
                          setSelection({ ...selection, start: s.start })
                        }
                      >
                        {clock(s.start)}
                      </button>
                    ))}
                  </div>
                  {!available.length && (
                    <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                      {!chosenClient || !selection.instructorId
                        ? "Escolha cliente e instrutor para consultar os horários."
                        : "Sem horários disponíveis. Confira o saldo de aulas ou escolha outro dia."}
                    </p>
                  )}
                </fieldset>
                <button
                  disabled={!available.some((s) => s.start === selection.start)}
                  className="btn btn-green w-full disabled:opacity-40"
                >
                  <CalendarDays size={17} /> Confirmar agendamento
                </button>
                <p className="text-xs leading-5 text-slate-500">
                  Esta reserva organiza a agenda local. Não registra pagamento
                  nem envia mensagens ao aluno.
                </p>
              </form>
            </section>
          </div>
        )}
        {tab === "finance" && <FinanceManager data={data} update={update} />}
        {tab === "hours" && (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <section className="admin-card">
              <h2 className="admin-title">Expediente e duração</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Valores iniciais de exemplo. Ajuste à sua rotina antes de
                agendar. Alterações afetam os próximos agendamentos.
              </p>
              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!validHours(hours)) {
                    setMessage(
                      "Confira os dias, a duração e o início e fim do expediente.",
                    );
                    return;
                  }
                  if (update({ workingHours: hours }))
                    setMessage(
                      "Expediente salvo. Aulas existentes foram preservadas.",
                    );
                }}
              >
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold">
                    Dias de atendimento
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {dayNames.map((label, d) => (
                      <label key={label} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={hours.days.includes(d)}
                          onChange={(e) =>
                            setHours({
                              ...hours,
                              days: e.target.checked
                                ? [...hours.days, d]
                                : hours.days.filter((n) => n !== d),
                            })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="grid grid-cols-2 gap-4">
                  <label>
                    Início do expediente
                    <input
                      required
                      type="time"
                      value={hours.start}
                      onChange={(e) =>
                        setHours({ ...hours, start: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Fim do expediente
                    <input
                      required
                      type="time"
                      value={hours.end}
                      onChange={(e) =>
                        setHours({ ...hours, end: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Duração da aula (min)
                    <input
                      required
                      type="number"
                      min="15"
                      max="180"
                      value={hours.duration}
                      onChange={(e) =>
                        setHours({ ...hours, duration: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Intervalo entre aulas (min)
                    <input
                      required
                      type="number"
                      min="0"
                      max="120"
                      value={hours.interval}
                      onChange={(e) =>
                        setHours({ ...hours, interval: Number(e.target.value) })
                      }
                    />
                  </label>
                </div>
                <button className="btn btn-green">Salvar expediente</button>
              </form>
            </section>
            <section className="admin-card">
              <h2 className="admin-title">
                <CarFront size={20} /> Regras desta versão
              </h2>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
                <li>Veículos disponíveis: Fiat Mobi e moto de instrução.</li>
                <li>
                  Cliente, instrutor e veículo não podem ter aulas sobrepostas.
                  O intervalo também é respeitado.
                </li>
                <li>
                  Aulas agendadas reservam saldo. Realizadas e faltas consomem
                  uma aula. Cancelamentos devolvem o saldo.
                </li>
                <li>
                  Uma aula só pode ser marcada como realizada ou falta depois do
                  horário de término.
                </li>
              </ul>
              <a
                className="mt-5 inline-block text-sm font-bold text-green-700"
                href="/admin?view=site#admin-instrutores"
              >
                Gerenciar instrutores →
              </a>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
