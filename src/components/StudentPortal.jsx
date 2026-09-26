import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CarFront,
  Check,
  LogOut,
  MessageCircle,
  Package,
  UserRound,
} from "lucide-react";
import { Brand } from "./Brand";
import { SpecialistChat } from "./SpecialistChat";
import { PackageDetails } from "./PackageDetails";
import { StudentLogin, DEMO_PASSWORD } from "./StudentLogin";
import { money, whatsappUrl, normalizePhone } from "../store-data";
import {
  balance,
  freeTimes,
  localDay,
  DEFAULT_VEHICLES,
  LESSON_STATUS,
} from "../management";
import {
  registerStudent,
  requestPackage,
  bookStudent,
  STUDENT_SESSION_KEY,
} from "../student";

function readSession() {
  try {
    return sessionStorage.getItem(STUDENT_SESSION_KEY) || "";
  } catch {
    return "";
  }
}
const time = (s) =>
  new Date(s).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
const dateTime = (s) =>
  new Date(s).toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });
export function StudentPortal({ data, update, error }) {
  const requestedId =
    new URLSearchParams(window.location.search).get("pacote") || "";
  const requestedPack = data.packages.find(
    (p) => p.id === requestedId && p.active,
  );
  const [session, setSession] = useState(readSession);
  const [tab, setTab] = useState(requestedPack ? "packages" : "home");
  const [message, setMessage] = useState("");
  const registration =
    window.location.pathname.replace(/\/$/, "") === "/cadastro";
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: requestedPack?.category || "B",
  });
  const [selection, setSelection] = useState({
    day: localDay(),
    category: requestedPack?.category === "A" ? "A" : "B",
    instructorId:
      new URLSearchParams(window.location.search).get("instrutor") || "",
    vehicleId: requestedPack?.category === "A" ? "moto-treino" : "carro-mobi",
    start: "",
  });
  const student = data.clients.find(
    (c) => c.id === session && c.source === "student-demo",
  );
  const ownLessons = student
    ? data.lessons
        .filter((l) => l.clientId === student.id)
        .sort((a, b) => a.start.localeCompare(b.start))
    : [];
  const ownRequests = student
    ? data.packageRequests.filter((r) => r.clientId === student.id)
    : [];
  const next = ownLessons.find(
    (l) => l.status === "scheduled" && new Date(l.end) > new Date(),
  );
  const credits = student
    ? balance(student, data.lessons, selection.category)
    : null;
  const times = student
    ? freeTimes(data, { ...selection, clientId: student.id }, new Date(), true)
    : [];
  useEffect(() => {
    if (student && !student.category.includes(selection.category))
      setSelection((s) => ({
        ...s,
        category: student.category === "A" ? "A" : "B",
        vehicleId: student.category === "A" ? "moto-treino" : "carro-mobi",
        instructorId: "",
        start: "",
      }));
  }, [student?.category, selection.category]);
  function contact(text = "Olá! Tenho uma dúvida sobre minha área do aluno.") {
    const url = whatsappUrl(data.whatsapp, text);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else
      setMessage("O contato não está disponível. Tente novamente mais tarde.");
  }
  function enter(id) {
    try {
      sessionStorage.setItem(STUDENT_SESSION_KEY, id);
      window.history.replaceState(null, "", `/aluno${window.location.search}`);
      setSession(id);
      setMessage("");
    } catch {
      setMessage("Não foi possível abrir o cadastro neste navegador.");
    }
  }
  function signUp(e) {
    e.preventDefault();
    const id = crypto.randomUUID();
    let reason = "";
    const saved = update((current) => {
      const result = registerStudent(current, form, id);
      if (result.error) {
        reason = result.error;
        return null;
      }
      return { clients: [...current.clients, result.client] };
    });
    if (saved) enter(id);
    else setMessage(reason || "Não foi possível cadastrar.");
  }
  function choosePackage(pack) {
    let reason = "";
    const saved = update((current) => {
      const result = requestPackage(
        current,
        student.id,
        pack.id,
        crypto.randomUUID(),
      );
      if (result.error) {
        reason = result.error;
        return null;
      }
      return { packageRequests: [...current.packageRequests, result.request] };
    });
    setMessage(
      saved
        ? "Solicitação enviada ao instrutor. Nenhuma cobrança foi feita. Aguarde a liberação dos créditos."
        : reason || "Não foi possível solicitar.",
    );
  }
  function book(e) {
    e.preventDefault();
    let reason = "";
    const saved = update((current) => {
      const result = bookStudent(
        current,
        student.id,
        selection,
        crypto.randomUUID(),
      );
      if (result.error) {
        reason = result.error;
        return null;
      }
      return result.patch;
    });
    if (saved) {
      setTab("lessons");
      setSelection({ ...selection, start: "" });
      setMessage(
        "Aula agendada! Um crédito ficou reservado e o instrutor recebeu um aviso no painel local.",
      );
    } else {
      setMessage(reason || "Não foi possível agendar.");
      setSelection({ ...selection, start: "" });
    }
  }
  function go(nextTab) {
    setTab(nextTab);
    setMessage("");
    if (nextTab === "profile")
      setProfile({ name: student.name, phone: student.phone });
  }
  return (
    <div className="min-h-screen bg-[#f3f5f7] pb-32">
      <header className="border-b border-slate-200 bg-white">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-5">
          <Brand />
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm font-semibold text-slate-600">
              <ArrowLeft size={15} className="mr-1 inline" />
              Site
            </a>
            {student && (
              <button
                className="text-sm font-semibold text-slate-600"
                onClick={() => {
                  try {
                    sessionStorage.removeItem(STUDENT_SESSION_KEY);
                  } catch {}
                  setSession("");
                  setMessage("");
                }}
              >
                <LogOut size={15} className="mr-1 inline" />
                Sair
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="container py-7 sm:py-10">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          Prévia de demonstração · Use dados fictícios. Sem login seguro ou
          pagamento. Os cadastros ficam neste navegador e podem ser acessados
          por quem usa este dispositivo.
        </p>
        {(message || error) && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm"
          >
            {error || message}
          </p>
        )}
        {!student && !registration ? (
          <StudentLogin clients={data.clients} enter={enter} />
        ) : !student ? (
          <div className="mx-auto mt-8 grid max-w-4xl items-start gap-7 md:grid-cols-2">
            <section>
              <p className="eyebrow">ÁREA DO ALUNO</p>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
                Seu próximo passo começa aqui.
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Crie seu cadastro grátis, conheça os pacotes e acompanhe suas
                aulas. Você só precisa de créditos para confirmar um horário.
              </p>
              <ul className="mt-6 space-y-4 text-sm text-slate-600">
                {[
                  "Cadastro gratuito, sem cartão",
                  "Créditos separados para carro e moto",
                  "Agenda e acompanhamento das aulas",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="shrink-0 text-green-600" size={18} />
                    {t}
                  </li>
                ))}
              </ul>
              {requestedPack && (
                <div className="mt-7 rounded-2xl bg-slate-900 p-5 text-white">
                  <p className="text-xs text-green-400">VOCÊ ESCOLHEU</p>
                  <p className="mt-2 font-bold">{requestedPack.name}</p>
                  <p className="mt-2 text-sm">
                    {money(requestedPack.price)} à vista
                  </p>
                  <p className="mt-3 text-xs text-slate-300">
                    O cadastro é gratuito. Escolher o pacote não gera cobrança.
                  </p>
                </div>
              )}
            </section>
            <section className="admin-card">
              <h2 className="admin-title">Criar cadastro grátis</h2>
              <form onSubmit={signUp} className="mt-5 space-y-4">
                <label>
                  Seu nome
                  <input
                    required
                    maxLength={80}
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label>
                  Seu e-mail
                  <input
                    required
                    type="email"
                    maxLength={150}
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </label>
                <label>
                  Seu WhatsApp
                  <input
                    required
                    type="tel"
                    maxLength={20}
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </label>
                <label>
                  Categoria de interesse
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    <option value="B">Carro · B</option>
                    <option value="A">Moto · A</option>
                    <option value="A+B">Carro e moto · A/B</option>
                  </select>
                </label>
                <button className="btn btn-green w-full">
                  Criar meu cadastro grátis <ArrowRight size={17} />
                </button>
              </form>
              <p className="mt-5 text-xs leading-5 text-slate-500">
                Para voltar depois, entre com seu e-mail e a senha de teste{" "}
                {DEMO_PASSWORD}.
              </p>
              <a
                href={`/aluno${window.location.search}`}
                className="mt-4 inline-block text-sm font-semibold text-green-700"
              >
                Já tenho cadastro. Entrar
              </a>
            </section>
          </div>
        ) : !student.active ? (
          <section className="admin-card mt-7">
            <h1 className="text-2xl font-bold">Cadastro indisponível</h1>
            <p className="mt-4 text-sm text-slate-500">
              Fale com o instrutor para revisar seu cadastro.
            </p>
            <button className="btn btn-green mt-5" onClick={() => contact()}>
              Falar no WhatsApp
            </button>
          </section>
        ) : (
          <>
            <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">ÁREA DO ALUNO</p>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
                  Olá, {student.name.split(" ")[0]}.
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Acompanhe seu caminho até a próxima aula.
                </p>
              </div>
              <button className="btn btn-outline" onClick={() => contact()}>
                <MessageCircle size={17} /> Falar no WhatsApp
              </button>
            </div>
            <nav
              aria-label="Área do aluno"
              className="my-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
            >
              {[
                ["home", "Início", UserRound],
                ["packages", "Meus pacotes", Package],
                ["lessons", "Minhas aulas", CarFront],
                ["profile", "Meu perfil", UserRound],
              ].map(([id, label, Icon]) => (
                <button
                  key={id}
                  aria-current={tab === id ? "page" : undefined}
                  onClick={() => go(id)}
                  className={`flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${tab === id ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </nav>
            <button
              className="btn btn-green mb-6"
              onClick={() => go("schedule")}
            >
              <CalendarDays size={18} /> Agendar aula
            </button>
            {tab === "profile" && profile && (
              <section className="admin-card max-w-xl">
                <h2 className="admin-title">Meu perfil</h2>
                <form
                  className="mt-5 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (
                      !profile.name.trim() ||
                      !normalizePhone(profile.phone)
                    ) {
                      setMessage("Informe nome e WhatsApp com DDD válido.");
                      return;
                    }
                    let reason = "";
                    const saved = update((current) => {
                      const own = current.clients.find(
                        (c) => c.id === student.id && c.active,
                      );
                      if (!own) {
                        reason = "Cadastro indisponível.";
                        return null;
                      }
                      if (
                        current.clients.some(
                          (c) =>
                            c.id !== student.id &&
                            normalizePhone(c.phone) ===
                              normalizePhone(profile.phone),
                        )
                      ) {
                        reason = "Este WhatsApp já está em outro cadastro.";
                        return null;
                      }
                      return {
                        clients: current.clients.map((c) =>
                          c.id === student.id
                            ? {
                                ...c,
                                name: profile.name.trim(),
                                phone: profile.phone.trim(),
                              }
                            : c,
                        ),
                      };
                    });
                    setMessage(
                      saved
                        ? "Dados de contato atualizados."
                        : reason || "Não foi possível atualizar.",
                    );
                  }}
                >
                  <label>
                    Nome no perfil
                    <input
                      required
                      maxLength={80}
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    WhatsApp no perfil
                    <input
                      required
                      type="tel"
                      maxLength={20}
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    E-mail de acesso
                    <input type="email" readOnly value={student.email} />
                  </label>
                  <p className="text-xs text-slate-500">
                    Categoria: {student.category.replace("+", "/")}. Para
                    alterar seu e-mail ou categoria, fale com o instrutor.
                  </p>
                  <button className="btn btn-green">Salvar meus dados</button>
                </form>
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h3 className="font-semibold">Acesso à conta</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Senha compartilhada de teste: {DEMO_PASSWORD}. Alteração e
                    recuperação de senha serão ativadas com o login seguro.
                  </p>
                </div>
              </section>
            )}
            {tab === "home" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {["B", "A"].map((cat) => {
                    const b = balance(student, data.lessons, cat);
                    return (
                      <section key={cat} className="admin-card">
                        <p className="text-xs font-semibold text-slate-500">
                          {cat === "B"
                            ? "CARRO · CATEGORIA B"
                            : "MOTO · CATEGORIA A"}
                        </p>
                        <p className="mt-3 text-4xl font-extrabold">
                          {b.available}{" "}
                          <span className="text-sm font-normal text-slate-500">
                            créditos disponíveis
                          </span>
                        </p>
                        <p className="mt-3 text-xs text-slate-500">
                          {b.reserved} reservados · {b.used} utilizados
                        </p>
                      </section>
                    );
                  })}
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <section className="admin-card">
                    <h2 className="admin-title">Sua próxima aula</h2>
                    {next ? (
                      <>
                        <p className="mt-4 text-lg font-bold">
                          {dateTime(next.start)}
                        </p>
                        <p className="mt-3 text-sm text-slate-600">
                          {next.category === "A" ? "Moto" : "Carro"} ·{" "}
                          {next.instructorName}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {next.vehicleName} · Combine o ponto de encontro com o
                          instrutor.
                        </p>
                        <button
                          className="btn btn-outline mt-5"
                          onClick={() => go("lessons")}
                        >
                          Ver minhas aulas
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="my-5 text-sm text-slate-500">
                          Você ainda não tem uma próxima aula agendada.
                        </p>
                        <button
                          className="btn btn-green"
                          onClick={() =>
                            go(
                              student.credits.A + student.credits.B > 0
                                ? "schedule"
                                : "packages",
                            )
                          }
                        >
                          {student.credits.A + student.credits.B > 0
                            ? "Escolher um horário"
                            : "Conhecer os pacotes"}
                        </button>
                      </>
                    )}
                  </section>
                  <section className="admin-card">
                    <h2 className="admin-title">Como funciona?</h2>
                    <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
                      <li>1. Escolha seu pacote.</li>
                      <li>
                        2. Aguarde a liberação dos créditos pelo instrutor.
                      </li>
                      <li>3. Escolha um horário livre e confirme sua aula.</li>
                    </ol>
                    <p className="mt-4 text-xs text-slate-500">
                      Pagamento online será adicionado depois. Nesta prévia, a
                      liberação é manual e não comprova pagamento.
                    </p>
                  </section>
                </div>
              </>
            )}
            {tab === "packages" && (
              <>
                <h2 className="admin-title">Escolha seu próximo passo</h2>
                <p className="mt-3 text-sm text-slate-500">
                  Solicite um pacote. Os créditos só aparecem após a liberação
                  do instrutor.
                </p>
                {requestedId && !requestedPack && (
                  <p className="mt-4 text-sm text-amber-800">
                    O pacote do link não está disponível. Confira as opções
                    abaixo.
                  </p>
                )}
                <div className="mt-6 grid items-start gap-5 lg:grid-cols-3">
                  {[...data.packages.filter((p) => p.active)]
                    .sort(
                      (a, b) =>
                        Number(b.id === requestedId) -
                        Number(a.id === requestedId),
                    )
                    .map((p) => {
                      const pending = ownRequests.some(
                        (r) => r.packageId === p.id && r.status === "pending",
                      );
                      return (
                        <article
                          key={p.id}
                          className={`admin-card ${p.id === requestedId ? "ring-2 ring-green-500" : ""}`}
                        >
                          <p className="eyebrow">
                            CATEGORIA {p.category.replace("+", "/")}
                          </p>
                          <h3 className="my-4 text-xl font-bold">{p.name}</h3>
                          <PackageDetails pack={p} />
                          <button
                            className="btn btn-green mt-5 w-full disabled:opacity-50"
                            disabled={pending}
                            onClick={() => choosePackage(p)}
                          >
                            {pending
                              ? "Aguardando liberação"
                              : "Solicitar este pacote"}
                          </button>
                        </article>
                      );
                    })}
                </div>
                {!data.packages.some((p) => p.active) && (
                  <section className="admin-card mt-5">
                    <p className="text-sm text-slate-500">
                      Ainda não há pacotes disponíveis. Fale com o instrutor
                      para montar seu plano.
                    </p>
                    <button
                      className="btn btn-green mt-4"
                      onClick={() => contact()}
                    >
                      Consultar pacotes no WhatsApp
                    </button>
                  </section>
                )}
                {ownRequests.length > 0 && (
                  <section className="admin-card mt-6">
                    <h2 className="admin-title">Meus pedidos de pacote</h2>
                    {[...ownRequests].reverse().map((r) => (
                      <div
                        key={r.id}
                        className="mt-4 border-t border-slate-100 pt-4"
                      >
                        <p className="font-semibold">
                          {r.name} · {money(r.priceCents / 100)}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          {r.status === "pending"
                            ? "Aguardando liberação do instrutor"
                            : r.status === "approved"
                              ? "Créditos liberados manualmente"
                              : "Solicitação não aprovada"}
                        </p>
                        {r.reason && (
                          <p className="mt-2 text-xs text-slate-500">
                            {r.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </section>
                )}
              </>
            )}
            {tab === "schedule" && (
              <section className="admin-card max-w-3xl">
                <h2 className="admin-title">Escolha sua próxima aula</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Consulte os horários livres. Para confirmar, você precisa de 1
                  crédito da categoria escolhida.
                </p>
                <form onSubmit={book} className="mt-5 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      Categoria da aula
                      <select
                        value={selection.category}
                        onChange={(e) =>
                          setSelection({
                            ...selection,
                            category: e.target.value,
                            vehicleId:
                              e.target.value === "A"
                                ? "moto-treino"
                                : "carro-mobi",
                            instructorId: "",
                            start: "",
                          })
                        }
                      >
                        {["B", "A"]
                          .filter((cat) => student.category.includes(cat))
                          .map((cat) => (
                            <option key={cat} value={cat}>
                              {cat === "B" ? "Carro" : "Moto"}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Instrutor
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
                        <option value="">Escolha o instrutor</option>
                        {data.instructors
                          .filter(
                            (i) =>
                              i.active &&
                              (i.category === selection.category ||
                                i.category === "A+B"),
                          )
                          .map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Dia da aula
                      <input
                        type="date"
                        required
                        min={localDay()}
                        value={selection.day}
                        onChange={(e) =>
                          setSelection({
                            ...selection,
                            day: e.target.value,
                            start: "",
                          })
                        }
                      />
                    </label>
                    <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
                      Créditos disponíveis nesta categoria:{" "}
                      <strong>{credits.available}</strong>
                    </div>
                  </div>
                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold">
                      Horários disponíveis · {data.workingHours.duration}{" "}
                      minutos
                    </legend>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {times.map((s) => (
                        <button
                          key={s.start}
                          type="button"
                          aria-pressed={selection.start === s.start}
                          onClick={() =>
                            setSelection({ ...selection, start: s.start })
                          }
                          className={`min-h-11 rounded-xl border p-3 text-sm font-semibold ${selection.start === s.start ? "border-green-600 bg-green-50 text-green-800" : "border-slate-200"}`}
                        >
                          {time(s.start)}
                        </button>
                      ))}
                    </div>
                    {!times.length && (
                      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        {selection.instructorId
                          ? "Nenhum horário livre neste dia. Tente outra data."
                          : "Escolha um instrutor e uma data para consultar a agenda."}
                      </p>
                    )}
                  </fieldset>
                  {selection.start &&
                    times.some((s) => s.start === selection.start) && (
                      <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6">
                        <strong>Confira sua escolha</strong>
                        <p>{dateTime(selection.start)}</p>
                        <p>
                          {
                            data.instructors.find(
                              (i) => i.id === selection.instructorId,
                            )?.name
                          }{" "}
                          ·{" "}
                          {
                            DEFAULT_VEHICLES.find(
                              (v) => v.id === selection.vehicleId,
                            )?.name
                          }
                        </p>
                        <p>
                          Será reservado 1 crédito de{" "}
                          {selection.category === "A" ? "moto" : "carro"}.
                        </p>
                      </div>
                    )}
                  {credits.available > 0 ? (
                    <button
                      className="btn btn-green w-full disabled:opacity-40"
                      disabled={!times.some((s) => s.start === selection.start)}
                    >
                      Confirmar aula · usar 1 crédito
                    </button>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm leading-6 text-amber-900">
                        Você pode consultar a agenda, mas precisa de créditos
                        para confirmar uma aula.
                      </p>
                      <button
                        type="button"
                        className="btn btn-green mt-4"
                        onClick={() => go("packages")}
                      >
                        Escolher um pacote
                      </button>
                    </div>
                  )}
                </form>
              </section>
            )}
            {tab === "lessons" && (
              <section className="admin-card">
                <h2 className="admin-title">Minhas aulas</h2>
                {!ownLessons.length && (
                  <p className="mt-5 text-sm text-slate-500">
                    Nenhuma aula agendada. Consulte a agenda e escolha seu
                    horário.
                  </p>
                )}
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {ownLessons.map((l) => (
                    <article
                      key={l.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <p className="text-xs font-semibold text-green-700">
                        {LESSON_STATUS[l.status]}
                      </p>
                      <h3 className="mt-3 font-bold">{dateTime(l.start)}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {l.category === "A" ? "Moto" : "Carro"} ·{" "}
                        {l.instructorName}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {l.vehicleName} · Combine o ponto de encontro com o
                        instrutor.
                      </p>
                      {l.status === "scheduled" && (
                        <button
                          className="mt-4 text-sm font-semibold text-green-700"
                          onClick={() =>
                            contact(
                              `Olá! Sou ${student.name}. Preciso falar sobre minha aula de ${dateTime(l.start)}.`,
                            )
                          }
                        >
                          Solicitar alteração pelo WhatsApp
                        </button>
                      )}
                    </article>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-5 text-slate-500">
                  Para remarcar ou cancelar, fale com o instrutor. A solicitação
                  por WhatsApp não altera a reserva automaticamente.
                </p>
              </section>
            )}
          </>
        )}
      </main>
      {data.ai && <SpecialistChat contact={contact} />}
    </div>
  );
}
