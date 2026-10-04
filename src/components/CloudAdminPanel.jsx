import React, { useEffect, useRef, useState } from "react";
import { Brand } from "./Brand";
import { supabase } from "../lib/supabase";
import { money } from "../store-data";
import { slotRequest } from "../admin-slot";
import { ScheduleSettings } from "./ScheduleSettings";
import { WeeklyCalendar } from "./WeeklyCalendar";
import { StudentEditor } from "./StudentEditor";
import { CatalogManager } from "./CatalogManager";
import { BookingRules } from "./BookingRules";
import { LessonEditor } from "./LessonEditor";

const empty = {
  students: [],
  requests: [],
  credits: [],
  instructors: [],
  vehicles: [],
  slots: [],
  lessons: [],
  notifications: [],
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
const dayOf = (value) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(value),
  );
const time = (value) =>
  new Date(value).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
const labels = {
  scheduled: "Agendada",
  completed: "Realizada",
  missed: "Falta",
  cancelled: "Cancelada",
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Recusado",
};

export function CloudAdminPanel() {
  const [access, setAccess] = useState("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [data, setData] = useState(empty);
  const [tab, setTab] = useState("Agenda");
  const [editingStudent, setEditingStudent] = useState(undefined);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [day, setDay] = useState(today);
  const [editingLesson, setEditingLesson] = useState(null);
  const [agendaCategory, setAgendaCategory] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reasons, setReasons] = useState({});
  const [slot, setSlot] = useState({
    category: "B",
    instructor: "",
    vehicle: "",
    start: "08:00",
    duration: 50,
    interval: 10,
  });
  const [booking, setBooking] = useState({ student: "", slot: "" });
  const generation = useRef(0);
  const locked = useRef(false);
  const currentUser = useRef(null);
  const loadController = useRef(null);

  async function load() {
    const version = ++generation.current;
    loadController.current?.abort();
    const controller = new AbortController();
    loadController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 12000);
    setLoading(true);
    setData(empty);
    try {
      const { data: role, error } = await supabase
        .rpc("my_access_role")
        .abortSignal(controller.signal);
      if (error) throw error;
      if (version !== generation.current) return;
      if (role !== "admin") {
        setAccess("denied");
        return;
      }
      setAccess("admin");
      const tables = {
        students: "students",
        requests: "package_requests",
        credits: "credit_grants",
        instructors: "instructors",
        vehicles: "vehicles",
        slots: "availability_slots",
        lessons: "lessons",
        notifications: "notifications",
      };
      const results = await Promise.all(
        Object.entries(tables).map(async ([key, table]) => {
          const result = await supabase
            .from(table)
            .select(key === "instructors" ? "id,name,category,active" : "*")
            .abortSignal(controller.signal);
          if (result.error) throw result.error;
          return [key, result.data];
        }),
      );
      if (version === generation.current) setData(Object.fromEntries(results));
    } catch (error) {
      if (version === generation.current) {
        setAccess("error");
        setMessage(
          controller.signal.aborted
            ? "O carregamento demorou demais. Verifique sua conexão e clique em Tentar novamente."
            : error.code === "PGRST202"
              ? "Aplique o SQL de acesso administrativo para ativar o painel."
              : "Não foi possível carregar o painel. Tente novamente.",
        );
      }
    } finally {
      clearTimeout(timeout);
      if (version === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    if (!supabase) {
      setAccess("error");
      setMessage("Supabase não configurado.");
      return;
    }
    let timer;
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const id = session?.user.id || null;
        if (event !== "INITIAL_SESSION" && id === currentUser.current) return;
        currentUser.current = id;
        loadController.current?.abort();
        generation.current++;
        setData(empty);
        setAccess(session ? "loading" : "login");
        clearTimeout(timer);
        if (session) timer = setTimeout(load, 0);
      },
    );
    return () => {
      generation.current++;
      loadController.current?.abort();
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);
  // A geração da agenda não bloqueia alunos, pedidos nem configurações.
  useEffect(() => {
    if (
      loading ||
      access !== "admin" ||
      !day ||
      !["Agenda", "Horários avulsos"].includes(tab)
    )
      return;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 12000);
    (async () => {
      try {
        for (const category of ["A", "B"]) {
          const result = await supabase
            .rpc("available_slots", { p_day: day, p_category: category })
            .abortSignal(controller.signal);
          if (result.error) throw result.error;
        }
        const result = await supabase
          .from("availability_slots")
          .select("*")
          .abortSignal(controller.signal);
        if (result.error) throw result.error;
        if (active)
          setData((previous) => ({ ...previous, slots: result.data }));
      } catch {
        if (active)
          setMessage(
            "Não foi possível atualizar os horários automáticos. Você pode continuar usando as configurações e tentar novamente na aba Agenda.",
          );
      } finally {
        clearTimeout(timeout);
      }
    })();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [access, day, tab, loading]);
  async function act(operation, success) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setMessage("");
    try {
      const result = await operation();
      if (result.error) throw result.error;
      await load();
      setMessage(success);
    } catch (error) {
      setMessage(
        error.code === "P0001"
          ? error.message
          : "Não foi possível salvar. Atualize o painel e confira os dados.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const name = (list, id) =>
    list.find((item) => item.id === id)?.name || "Cadastro indisponível";
  const ownDay = data.lessons
    .filter(
      (l) =>
        dayOf(l.starts_at) === day &&
        (!agendaCategory || l.category === agendaCategory),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const daySlots = data.slots
    .filter((s) => dayOf(s.starts_at) === day)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const freeSlots = daySlots.filter(
    (s) =>
      (!agendaCategory || s.category === agendaCategory) &&
      s.active &&
      new Date(s.starts_at) > new Date() &&
      !data.lessons.some(
        (l) =>
          l.status !== "cancelled" &&
          (l.instructor_id === s.instructor_id ||
            l.vehicle_id === s.vehicle_id ||
            l.student_id === booking.student) &&
          new Date(l.starts_at).getTime() <
            new Date(s.ends_at).getTime() + s.interval_minutes * 60000 &&
          new Date(l.blocked_until) > new Date(s.starts_at),
      ),
  );
  const balance = (id, cat) =>
    data.credits
      .filter((c) => c.student_id === id)
      .reduce((n, c) => n + (cat === "A" ? c.lessons_a : c.lessons_b), 0) -
    data.lessons.filter(
      (l) =>
        l.student_id === id && l.category === cat && l.status !== "cancelled",
    ).length;

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b bg-white">
        <div className="container flex flex-wrap items-center justify-between gap-4 py-5">
          <Brand />
          {access !== "login" && access !== "loading" && (
            <button
              disabled={busy}
              className="font-semibold"
              onClick={async () => {
                setBusy(true);
                try {
                  const { error } = await supabase.auth.signOut();
                  if (error) throw error;
                  setMessage("");
                } catch {
                  setMessage("Não foi possível sair. Tente novamente.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Sair da administração
            </button>
          )}
        </div>
      </header>
      <div className="container py-8">
        <h1 className="text-3xl font-extrabold">Gerenciador Habilita+</h1>
        {message && (
          <p role="status" className="mt-5 rounded-xl bg-blue-50 p-4">
            {message}
          </p>
        )}
        {access === "loading" ? (
          <p role="status" className="mt-6">
            Verificando acesso…
          </p>
        ) : access === "login" ? (
          <section className="admin-card mt-6 max-w-md">
            <h2 className="text-xl font-bold">Acesso administrativo</h2>
            <p className="my-3">
              Entre com sua conta autorizada para gerenciar a Habilita+.
            </p>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (locked.current) return;
                locked.current = true;
                setBusy(true);
                setMessage("");
                try {
                  const { error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                  });
                  if (error) throw error;
                  setPassword("");
                } catch {
                  setMessage(
                    "Não foi possível entrar. Confira seu e-mail e sua senha.",
                  );
                } finally {
                  locked.current = false;
                  setBusy(false);
                }
              }}
            >
              <label className="block">
                E-mail administrativo
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block">
                Senha
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button disabled={busy} className="btn btn-green w-full">
                {busy ? "Entrando…" : "Entrar no painel"}
              </button>
            </form>
          </section>
        ) : access === "denied" ? (
          <section className="admin-card mt-6">
            <h2 className="text-xl font-bold">Acesso restrito</h2>
            <p className="mt-3">Sua conta não tem permissão administrativa.</p>
            <button className="btn btn-green mt-4" onClick={load}>
              Verificar acesso novamente
            </button>
          </section>
        ) : access === "error" ? (
          <button className="btn btn-green mt-5" onClick={load}>
            Tentar novamente
          </button>
        ) : (
          <>
            <div className="my-5 flex flex-wrap gap-2">
              {[
                "Agenda",
                "Alunos",
                "Pedidos",
                "Configurar agenda",
                "Horários avulsos",
                "Catálogo",
                "Regras",
              ].map((t) => (
                <button
                  key={t}
                  className={`rounded-xl px-4 py-3 font-bold ${t === tab ? "bg-slate-900 text-white" : "border bg-white"}`}
                  onClick={() => setTab(t)}
                >
                  {t}
                  {t === "Pedidos" &&
                    ` (${data.requests.filter((r) => r.status === "pending").length})`}
                </button>
              ))}
              <button
                disabled={busy || loading}
                className="rounded-xl border px-4 py-3"
                onClick={load}
              >
                Atualizar
              </button>
            </div>
            {loading ? (
              <p role="status">Carregando dados…</p>
            ) : (
              <fieldset disabled={busy} className="min-w-0">
                {!!data.notifications.filter((n) => !n.read_at).length && (
                  <section className="admin-card mb-5">
                    <h2 className="font-bold">Novos agendamentos</h2>
                    {data.notifications
                      .filter((n) => !n.read_at)
                      .map((n) => {
                        const lesson = data.lessons.find(
                          (l) => l.id === n.lesson_id,
                        );
                        return (
                          <div
                            className="mt-3 flex flex-wrap items-center justify-between gap-3"
                            key={n.id}
                          >
                            <p>
                              {lesson
                                ? `${name(data.students, lesson.student_id)} · ${dayOf(lesson.starts_at)} às ${time(lesson.starts_at)}`
                                : "Nova aula"}
                            </p>
                            <button
                              className="text-green-700 underline"
                              onClick={() => {
                                if (lesson) {
                                  setDay(dayOf(lesson.starts_at));
                                  setTab("Agenda");
                                }
                                act(
                                  () =>
                                    supabase
                                      .from("notifications")
                                      .update({
                                        read_at: new Date().toISOString(),
                                      })
                                      .eq("id", n.id),
                                  "Aviso marcado como lido.",
                                );
                              }}
                            >
                              Ver e marcar como lido
                            </button>
                          </div>
                        );
                      })}
                  </section>
                )}
                {(tab === "Agenda" || tab === "Horários avulsos") && (
                  <label className="mb-5 block max-w-xs">
                    Data (horário de Brasília)
                    <input
                      type="date"
                      required
                      value={day}
                      onChange={(e) => {
                        setDay(e.target.value);
                        setBooking((b) => ({ ...b, slot: "" }));
                      }}
                    />
                  </label>
                )}
                {tab === "Alunos" && (
                  <>
                    <button
                      className="btn btn-green mb-4"
                      onClick={() => setEditingStudent(null)}
                    >
                      Cadastrar aluno
                    </button>
                    {editingStudent !== undefined && (
                      <StudentEditor
                        key={editingStudent?.id || "new"}
                        student={editingStudent}
                        onSaved={() => {
                          setEditingStudent(undefined);
                          load();
                        }}
                      />
                    )}
                    {historyStudent && (
                      <section className="admin-card mb-4">
                        <h2 className="text-xl font-bold">
                          Histórico de {historyStudent.name}
                        </h2>
                        <button
                          className="my-3 underline"
                          onClick={() => setHistoryStudent(null)}
                        >
                          Fechar histórico
                        </button>
                        {data.lessons
                          .filter((l) => l.student_id === historyStudent.id)
                          .map((l) => (
                            <p key={l.id}>
                              {dayOf(l.starts_at)} · {time(l.starts_at)} ·{" "}
                              {l.category} · {labels[l.status]}
                            </p>
                          ))}
                        {!data.lessons.some(
                          (l) => l.student_id === historyStudent.id,
                        ) && <p>Nenhuma aula registrada.</p>}
                      </section>
                    )}
                    <div className="grid gap-4 md:grid-cols-2">
                      {data.students.map((s) => (
                        <article className="admin-card" key={s.id}>
                          <h2 className="text-xl font-bold">{s.name}</h2>
                          <p>
                            {s.phone} · Categoria {s.category}
                          </p>
                          <p className="mt-3">
                            Créditos livres: moto {balance(s.id, "A")} · carro{" "}
                            {balance(s.id, "B")}
                          </p>
                          <p className="text-sm text-slate-500">
                            {s.active ? "Cadastro ativo" : "Cadastro inativo"}
                          </p>
                          <div className="mt-3 flex gap-4">
                            <button
                              className="text-green-700 underline"
                              onClick={() => setEditingStudent(s)}
                            >
                              Editar aluno
                            </button>
                            <button
                              className="underline"
                              onClick={() => setHistoryStudent(s)}
                            >
                              Ver histórico
                            </button>
                          </div>
                        </article>
                      ))}
                      {!data.students.length && <p>Nenhum aluno cadastrado.</p>}
                    </div>
                  </>
                )}
                {tab === "Catálogo" && <CatalogManager />}
                {tab === "Regras" && <BookingRules />}
                {tab === "Agenda" && (
                  <div className="mb-5 flex flex-wrap items-end gap-4 rounded-2xl border bg-white p-4">
                    <label className="block w-full sm:w-64">
                      Filtrar agenda por categoria
                      <select
                        value={agendaCategory}
                        onChange={(e) => {
                          setAgendaCategory(e.target.value);
                          setBooking((b) => ({ ...b, slot: "" }));
                        }}
                      >
                        <option value="">Todas as categorias</option>
                        <option value="A">Moto — Categoria A</option>
                        <option value="B">Carro — Categoria B</option>
                      </select>
                    </label>
                    <p className="pb-2 text-sm text-slate-600">
                      {ownDay.length} agendamento
                      {ownDay.length === 1 ? "" : "s"} no dia selecionado
                    </p>
                  </div>
                )}
                {tab === "Agenda" && day && (
                  <WeeklyCalendar
                    day={day}
                    onDay={setDay}
                    category={agendaCategory}
                    students={data.students}
                    instructors={data.instructors}
                    lessons={data.lessons}
                  />
                )}
                {tab === "Pedidos" && (
                  <div className="space-y-4">
                    {[...data.requests]
                      .sort(
                        (a, b) =>
                          Number(b.status === "pending") -
                          Number(a.status === "pending"),
                      )
                      .map((r) => (
                        <article className="admin-card" key={r.id}>
                          <h2 className="text-xl font-bold">
                            {name(data.students, r.student_id)}
                          </h2>
                          <p>
                            {r.package_name} · {money(r.price_cents / 100)} ·{" "}
                            {labels[r.status]}
                          </p>
                          <p>
                            {r.lessons_a} aulas de moto + {r.lessons_b} aulas de
                            carro
                          </p>
                          {r.status === "pending" ? (
                            <form
                              className="mt-4 space-y-3"
                              onSubmit={(e) => {
                                e.preventDefault();
                                act(
                                  () =>
                                    supabase.rpc("resolve_package", {
                                      p_request: r.id,
                                      p_approve: true,
                                      p_reason: reasons[r.id],
                                    }),
                                  "Pacote aprovado e créditos liberados.",
                                );
                              }}
                            >
                              <label>
                                Motivo da decisão
                                <input
                                  required
                                  value={reasons[r.id] || ""}
                                  onChange={(e) =>
                                    setReasons((v) => ({
                                      ...v,
                                      [r.id]: e.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <p className="text-sm text-slate-500">
                                Liberação manual. Isso não registra recebimento
                                nem cobra o aluno.
                              </p>
                              <div className="flex flex-wrap gap-3">
                                <button className="btn btn-green">
                                  Aprovar e liberar créditos
                                </button>
                                <button
                                  type="button"
                                  className="rounded-xl border px-4"
                                  disabled={!reasons[r.id]?.trim()}
                                  onClick={() =>
                                    act(
                                      () =>
                                        supabase.rpc("resolve_package", {
                                          p_request: r.id,
                                          p_approve: false,
                                          p_reason: reasons[r.id],
                                        }),
                                      "Pedido recusado.",
                                    )
                                  }
                                >
                                  Recusar
                                </button>
                              </div>
                            </form>
                          ) : (
                            <p className="mt-3">{r.reason}</p>
                          )}
                        </article>
                      ))}
                    {!data.requests.length && <p>Nenhum pedido recebido.</p>}
                  </div>
                )}
                {tab === "Configurar agenda" && (
                  <ScheduleSettings
                    instructors={data.instructors}
                    vehicles={data.vehicles}
                  />
                )}
                {tab === "Horários avulsos" && (
                  <>
                    <form
                      className="admin-card grid gap-4 sm:grid-cols-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const result = slotRequest(day, slot);
                        if (result.error) {
                          setMessage(result.error);
                          return;
                        }
                        act(
                          () => supabase.rpc("publish_slot", result.params),
                          "Horário liberado para os alunos.",
                        );
                      }}
                    >
                      <h2 className="text-xl font-bold sm:col-span-2">
                        Liberar horário
                      </h2>
                      <p className="text-sm text-slate-600 sm:col-span-2">
                        Data selecionada:{" "}
                        <strong>
                          {day
                            ? day.split("-").reverse().join("/")
                            : "Escolha uma data acima"}
                        </strong>
                        . Esta ação libera uma vaga; o agendamento do aluno vem
                        depois.
                      </p>
                      <label>
                        Categoria
                        <select
                          value={slot.category}
                          onChange={(e) =>
                            setSlot((s) => ({
                              ...s,
                              category: e.target.value,
                              instructor: "",
                              vehicle: "",
                            }))
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
                          value={slot.instructor}
                          onChange={(e) =>
                            setSlot((s) => ({
                              ...s,
                              instructor: e.target.value,
                            }))
                          }
                        >
                          <option value="">Selecione</option>
                          {data.instructors
                            .filter(
                              (i) =>
                                i.active && i.category.includes(slot.category),
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
                          value={slot.vehicle}
                          onChange={(e) =>
                            setSlot((s) => ({ ...s, vehicle: e.target.value }))
                          }
                        >
                          <option value="">Selecione</option>
                          {data.vehicles
                            .filter(
                              (v) => v.active && v.category === slot.category,
                            )
                            .map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label>
                        Início
                        <input
                          required
                          type="time"
                          value={slot.start}
                          onChange={(e) =>
                            setSlot((s) => ({ ...s, start: e.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Duração (minutos)
                        <input
                          type="number"
                          min="15"
                          max="180"
                          required
                          value={slot.duration}
                          onChange={(e) =>
                            setSlot((s) => ({ ...s, duration: e.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Intervalo (minutos)
                        <input
                          type="number"
                          min="0"
                          max="120"
                          required
                          value={slot.interval}
                          onChange={(e) =>
                            setSlot((s) => ({ ...s, interval: e.target.value }))
                          }
                        />
                      </label>
                      <button className="btn btn-green" disabled={!day}>
                        Liberar horário
                      </button>
                    </form>
                    <div className="mt-5 space-y-3">
                      {daySlots.map((s) => (
                        <article
                          className="admin-card flex flex-wrap items-center justify-between gap-3"
                          key={s.id}
                        >
                          <p>
                            {time(s.starts_at)} ·{" "}
                            {name(data.instructors, s.instructor_id)} ·{" "}
                            {name(data.vehicles, s.vehicle_id)} ·{" "}
                            {s.active ? "Liberado" : "Bloqueado"}
                          </p>
                          {s.active && (
                            <button
                              className="text-red-700 underline"
                              onClick={() =>
                                act(
                                  () =>
                                    supabase
                                      .from("availability_slots")
                                      .update(
                                        s.rule_id
                                          ? {
                                              active: false,
                                              manually_blocked: true,
                                            }
                                          : { active: false },
                                      )
                                      .eq("id", s.id),
                                  "Horário bloqueado. Aulas já reservadas foram mantidas.",
                                )
                              }
                            >
                              Bloquear novas reservas
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  </>
                )}
                {tab === "Agenda" && (
                  <>
                    <section className="space-y-4">
                      {ownDay.map((l) => (
                        <article className="admin-card" key={l.id}>
                          <h2 className="text-xl font-bold">
                            {time(l.starts_at)} ·{" "}
                            {name(data.students, l.student_id)}
                          </h2>
                          <p>
                            {name(data.instructors, l.instructor_id)} ·
                            Categoria {l.category} · {labels[l.status]}
                          </p>
                          {l.status === "scheduled" && (
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                className="rounded-xl bg-green-100 px-4 py-2 font-semibold text-green-900"
                                onClick={() => setEditingLesson(l.id)}
                              >
                                Editar agendamento
                              </button>
                              <button
                                className="rounded-xl border px-4 py-2 text-red-700"
                                onClick={() => {
                                  if (!window.confirm('Excluir este agendamento? Esta ação é irreversível.')) return;
                                  act(() => supabase.from('lessons').delete().eq('id', l.id), 'Agendamento excluído.');
                                }}
                              >
                                Excluir
                              </button>
                              {["completed", "missed", "cancelled"].map(
                                (state) => (
                                  <button
                                    key={state}
                                    disabled={
                                      state !== "cancelled" &&
                                      new Date(l.ends_at) > new Date()
                                    }
                                    className="rounded-xl border px-4 py-2"
                                    onClick={() => {
                                      if (
                                        state === "cancelled" &&
                                        !window.confirm(
                                          "Cancelar esta aula e devolver o crédito ao aluno?",
                                        )
                                      )
                                        return;
                                      act(
                                        () =>
                                          supabase.rpc("set_lesson_status", {
                                            p_lesson: l.id,
                                            p_status: state,
                                          }),
                                        "Status da aula atualizado.",
                                      );
                                    }}
                                  >
                                    {state === "cancelled"
                                      ? "Cancelar aula"
                                      : labels[state]}
                                  </button>
                                ),
                              )}
                            </div>
                          )}
                          {l.status === "scheduled" &&
                            editingLesson === l.id && (
                              <LessonEditor
                                key={l.id}
                                lesson={l}
                                instructors={data.instructors}
                                vehicles={data.vehicles}
                                onClose={() => setEditingLesson(null)}
                                onSaved={(nextDay) => {
                                  setEditingLesson(null);
                                  setDay(nextDay);
                                  load();
                                  setMessage(
                                    "Agendamento alterado. O mesmo crédito foi mantido.",
                                  );
                                }}
                              />
                            )}
                        </article>
                      ))}
                      {!ownDay.length && (
                        <p>
                          {agendaCategory
                            ? "Nenhuma aula desta categoria no dia selecionado."
                            : "Nenhuma aula agendada neste dia."}
                        </p>
                      )}
                    </section>
                    <form
                      className="admin-card mt-6 space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        act(
                          () =>
                            supabase.rpc("book_lesson", {
                              p_student: booking.student,
                              p_slot: booking.slot,
                            }),
                          "Aula agendada com o crédito do aluno.",
                        );
                      }}
                    >
                      <h2 className="text-xl font-bold">
                        Agendar para um aluno
                      </h2>
                      <label>
                        Aluno
                        <select
                          required
                          value={booking.student}
                          onChange={(e) =>
                            setBooking({ student: e.target.value, slot: "" })
                          }
                        >
                          <option value="">Selecione</option>
                          {data.students
                            .filter((s) => s.active)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label>
                        Horário livre
                        <select
                          required
                          value={booking.slot}
                          onChange={(e) =>
                            setBooking((b) => ({ ...b, slot: e.target.value }))
                          }
                        >
                          <option value="">Selecione</option>
                          {freeSlots.map((s) => (
                            <option key={s.id} value={s.id}>
                              {time(s.starts_at)} · {s.category} ·{" "}
                              {name(data.instructors, s.instructor_id)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="text-sm text-slate-500">
                        A confirmação depende de crédito disponível da
                        categoria.
                      </p>
                      <button className="btn btn-green">
                        Confirmar agendamento
                      </button>
                    </form>
                  </>
                )}
              </fieldset>
            )}
          </>
        )}
      </div>
    </main>
  );
}
