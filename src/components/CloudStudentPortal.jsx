import { StudentRequests } from "./RequestBoard";
import { StudentPackageOffer } from "./StudentPackageOffer";
import { StudentLessons } from "./StudentLessons";
import { trackLanding } from "../lib/landing-events";
import React, { useEffect, useRef, useState } from "react";
import { Brand } from "./Brand";
import { CloudProfileEditor } from "./CloudProfileEditor";
import { BookingRules } from "./BookingRules";
import { SpecialistChat } from "./SpecialistChat";
import { supabase } from "../lib/supabase";
import { money, whatsappUrl } from "../store-data";

const empty = {
  student: null,
  packages: [],
  credits: [],
  lessons: [],
  requests: [],
  settings: null,
};
const date = (value) =>
  new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
const statusLabel = {
  pending: "Aguardando liberação",
  approved: "Liberado",
  rejected: "Não aprovado",
  scheduled: "Agendada",
  completed: "Realizada",
  missed: "Falta",
  cancelled: "Cancelada",
};
function errorText(error) {
  if (error?.code === "invalid_credentials")
    return "E-mail ou senha incorretos.";
  if (error?.code === "email_not_confirmed")
    return "Confirme seu e-mail antes de entrar.";
  if (error?.status === 429)
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (error?.code === "23505")
    return "Você já tem uma solicitação pendente para este pacote.";
  if (error?.code === "P0001") return error.message;
  return "Não foi possível concluir. Confira sua conexão e tente novamente. Se persistir, fale com o especialista.";
}

export function CloudStudentPortal() {
  const requestedPackage =
    new URLSearchParams(location.search).get("pacote") || "";
  const signup = location.pathname.replace(/\/$/, "") === "/cadastro";
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(
    new URLSearchParams(location.search).get("recuperar") === "1",
  );
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "B",
    password: "",
    confirm: "",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState(requestedPackage ? "Meus pacotes" : "Início");
  const [day, setDay] = useState("");
  const [category, setCategory] = useState("B");
  const [slots, setSlots] = useState(null);
  const [slotLoading, setSlotLoading] = useState(false);
  const version = useRef(0);
  const identity = useRef(null);
  const slotsVersion = useRef(0);
  const lock = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, next) => {
        if (identity.current !== next?.user.id) {
          version.current++;
          identity.current = next?.user.id;
          setData(empty);
        }
        slotsVersion.current++;
        setSlots(null);
        setSession(next);
        setReady(true);
        if (!next) setData(empty);
        if (event === "PASSWORD_RECOVERY") setRecovery(true);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  async function refresh(userId) {
    const current = ++version.current;
    setLoading(true);
    setFailed(false);
    try {
      const responses = await Promise.all([
        supabase
          .from("students")
          .select("id,name,phone,category,active")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("packages")
          .select("id,slug,name,category,lessons_a,lessons_b,price_cents")
          .eq("active", true),
        supabase.from("credit_grants").select("student_id,lessons_a,lessons_b"),
        supabase
          .from("lessons")
          .select("id,student_id,category,starts_at,ends_at,status")
          .order("starts_at"),
        supabase
          .from("package_requests")
          .select("id,student_id,package_id,package_name,status,reason"),
        supabase.from("site_settings").select("whatsapp,ai_enabled").single(),
      ]);
      const bad = responses.find((r) => r.error);
      if (bad) throw bad.error;
      if (current !== version.current) return;
      const student = responses[0].data;
      setData({
        student,
        packages: responses[1].data,
        credits: responses[2].data.filter((r) => r.student_id === student?.id),
        lessons: responses[3].data.filter((r) => r.student_id === student?.id),
        requests: responses[4].data.filter((r) => r.student_id === student?.id),
        settings: responses[5].data,
      });
    } catch (error) {
      if (current === version.current) {
        setFailed(true);
        setData(empty);
        setMessage(errorText(error));
      }
    } finally {
      if (current === version.current) setLoading(false);
    }
  }
  useEffect(() => {
    if (session?.user.id) refresh(session.user.id);
  }, [session?.user.id]);
  useEffect(() => {
    const current = ++slotsVersion.current;
    setSlots(null);
    if (!day || !session || tab !== "Agendar aula") {
      setSlotLoading(false);
      return;
    }
    setSlotLoading(true);
    supabase
      .rpc("available_slots", { p_day: day, p_category: category })
      .then(({ data: result, error }) => {
        if (current !== slotsVersion.current) return;
        setSlotLoading(false);
        if (error) setMessage(errorText(error));
        else setSlots(result);
      })
      .catch((error) => {
        if (current === slotsVersion.current) {
          setSlotLoading(false);
          setMessage(errorText(error));
        }
      });
    return () => {
      slotsVersion.current++;
    };
  }, [day, category, tab, session?.user.id]);

  async function action(fn) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function submit(event) {
    event.preventDefault();
    action(async () => {
      if ((signup || recovery) && form.password !== form.confirm) {
        setMessage("As senhas precisam ser iguais.");
        return;
      }
      if (recovery) {
        const { error } = await supabase.auth.updateUser({
          password: form.password,
        });
        if (error) throw error;
        setRecovery(false);
        history.replaceState(null, "", "/aluno");
        setMessage("Senha atualizada.");
      } else if (signup) {
        const phone = form.phone.replace(/\D/g, "");
        if (!form.name.trim() || !/^\d{10,13}$/.test(phone)) {
          setMessage("Informe nome e WhatsApp com DDD.");
          return;
        }
        const { error, data: result } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: `${location.origin}/aluno`,
            data: { name: form.name.trim(), phone, category: form.category },
          },
        });
        if (error) throw error;
        // Supabase can return an obfuscated user for an already registered email.
        // Count only a new identity; this event does not mean email is confirmed.
        if (result.user?.identities?.length) trackLanding("signup_complete");
        setMessage(
          result.session
            ? "Cadastro criado. Seus créditos começam em zero."
            : "Confira seu e-mail para confirmar o cadastro. Se já tem conta, entre pela área do aluno.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
      }
      setForm((f) => ({ ...f, password: "", confirm: "" }));
    });
  }
  const field = (name, label, type = "text", extra = {}) => (
    <label className="block" key={name}>
      {label}
      <input
        className="mt-1 w-full"
        type={type}
        name={name}
        required
        value={form[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        {...extra}
      />
    </label>
  );
  const available = (cat) =>
    data.credits.reduce(
      (sum, r) => sum + (cat === "A" ? r.lessons_a : r.lessons_b),
      0,
    ) -
    data.lessons.filter((l) => l.category === cat && l.status !== "cancelled")
      .length;
  const contact = whatsappUrl(
    data.settings?.whatsapp || "5512996225250",
    "Olá! Preciso de ajuda na área do aluno.",
  );
  const canUse = session && data.student?.active && !loading && !failed;

  return (
    <main className="min-h-screen bg-slate-50 pb-28 text-slate-900">
      <header className="border-b bg-white">
        <div className="container flex flex-wrap items-center justify-between gap-4 py-5">
          <Brand />
          <a href="/" className="text-sm font-semibold">
            Voltar ao site
          </a>
          {session && (
            <button
              disabled={busy}
              onClick={() =>
                action(async () => {
                  const { error } = await supabase.auth.signOut();
                  if (error) throw error;
                  setRecovery(false);
                  setMessage("");
                })
              }
              className="text-sm font-bold"
            >
              Sair
            </button>
          )}
        </div>
      </header>
      <div className="container py-8">
        {message && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm"
          >
            {message}
          </p>
        )}
        {!supabase ? (
          <p>Conexão não configurada. Entre em contato com a equipe.</p>
        ) : !ready ? (
          <p role="status">Verificando acesso…</p>
        ) : !session || recovery ? (
          <section className="admin-card mx-auto max-w-md">
            <p className="eyebrow">ÁREA DO ALUNO</p>
            <h1 className="mt-3 text-3xl font-extrabold">
              {recovery
                ? "Crie sua nova senha"
                : signup
                  ? "Seu primeiro passo começa aqui"
                  : "Bom ter você de volta"}
            </h1>
            {signup && !recovery && (
              <p className="mt-3 text-sm text-slate-600">
                Cadastro gratuito. Contrate aulas quando estiver pronto.
              </p>
            )}
            {recovery && !session ? (
              <p className="mt-5">
                Abra o link enviado ao seu e-mail. Se expirou,{" "}
                <a href="/aluno" className="text-green-700 underline">
                  solicite outro na tela de login
                </a>
                .
              </p>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                {signup && !recovery && (
                  <>
                    {field("name", "Nome completo", "text", {
                      maxLength: 120,
                      autoComplete: "name",
                    })}
                    {field("phone", "WhatsApp com DDD", "tel", {
                      maxLength: 20,
                      autoComplete: "tel",
                    })}
                    <label className="block">
                      Categoria
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, category: e.target.value }))
                        }
                      >
                        <option value="A">A — Moto</option>
                        <option value="B">B — Carro</option>
                        <option value="A+B">A+B — Carro e moto</option>
                      </select>
                    </label>
                  </>
                )}
                {!recovery &&
                  field("email", "E-mail", "email", {
                    autoComplete: "username",
                  })}
                {field(
                  "password",
                  recovery ? "Nova senha" : "Senha",
                  "password",
                  {
                    minLength: signup || recovery ? 8 : 1,
                    autoComplete:
                      signup || recovery ? "new-password" : "current-password",
                  },
                )}
                {(signup || recovery) &&
                  field("confirm", "Confirme a senha", "password", {
                    minLength: 8,
                    autoComplete: "new-password",
                  })}
                <button disabled={busy} className="btn btn-green w-full">
                  {busy
                    ? "Aguarde…"
                    : recovery
                      ? "Salvar senha"
                      : signup
                        ? "Criar conta grátis"
                        : "Entrar"}
                </button>
              </form>
            )}
            {!signup && !recovery && (
              <button
                disabled={busy}
                className="mt-5 text-sm font-bold text-green-700"
                onClick={() =>
                  action(async () => {
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
                      setMessage("Preencha seu e-mail para recuperar a senha.");
                      return;
                    }
                    const { error } = await supabase.auth.resetPasswordForEmail(
                      form.email.trim(),
                      { redirectTo: `${location.origin}/aluno?recuperar=1` },
                    );
                    if (error) throw error;
                    setMessage(
                      "Se houver uma conta com esse e-mail, você receberá as instruções de recuperação.",
                    );
                  })
                }
              >
                Esqueci minha senha
              </button>
            )}
            <p className="mt-6 text-sm">
              <a
                className="font-bold text-green-700"
                href={signup ? "/aluno" : `/cadastro${location.search}`}
              >
                {signup
                  ? "Já tenho conta. Entrar"
                  : "Ainda não tenho conta. Cadastrar"}
              </a>
            </p>
          </section>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold">
              {data.student
                ? `Olá, ${data.student.name.split(" ")[0]}`
                : "Área do aluno"}
            </h1>
            <p className="mt-2 text-slate-600">
              Sua preparação, um passo de cada vez.
            </p>
            <button
              className="mt-3 text-sm font-semibold text-green-700"
              disabled={loading || busy}
              onClick={() => refresh(session.user.id)}
            >
              Atualizar informações
            </button>
            {loading ? (
              <p role="status" className="mt-6">
                Carregando seus dados…
              </p>
            ) : failed ? (
              <p className="mt-6">
                Não conseguimos carregar sua conta. Tente atualizar.
              </p>
            ) : !data.student ? (
              <p className="mt-6">
                Seu perfil de aluno não foi encontrado. Fale com a equipe para
                concluir o cadastro.
              </p>
            ) : !data.student.active ? (
              <p className="mt-6">
                Seu cadastro está inativo. Fale com a equipe.
              </p>
            ) : (
              <>
                <nav
                  aria-label="Área do aluno"
                  className="my-6 flex flex-wrap gap-2"
                >
                  {[
                    "Início",
                    "Meus pacotes",
                    "Minhas aulas",
                    "Meu perfil",
                    "Agendar aula",
                  ].map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        setTab(name);
                        setMessage("");
                      }}
                      className={`rounded-xl px-4 py-3 text-sm font-bold ${tab === name ? "bg-slate-900 text-white" : "border bg-white"}`}
                      aria-current={tab === name ? "page" : undefined}
                    >
                      {name}
                    </button>
                  ))}
                </nav>
                {tab === "Início" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {["A", "B"].map((cat) => (
                        <div key={cat} className="admin-card">
                          <h2 className="font-bold">
                            {cat === "A" ? "Moto" : "Carro"}
                          </h2>
                          <p className="my-3 text-4xl font-extrabold">
                            {available(cat)}
                          </p>
                          <p className="text-sm text-slate-600">
                            Créditos disponíveis para agendar
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="admin-card mt-5">
                      <h2 className="font-bold">Próxima aula</h2>
                      <p className="mt-3">
                        {data.lessons.find(
                          (l) =>
                            l.status === "scheduled" &&
                            new Date(l.ends_at) > new Date(),
                        )
                          ? date(
                              data.lessons.find(
                                (l) =>
                                  l.status === "scheduled" &&
                                  new Date(l.ends_at) > new Date(),
                              ).starts_at,
                            )
                          : "Você ainda não tem uma aula agendada."}
                      </p>
                      <button
                        className="btn btn-green mt-4"
                        onClick={() => setTab("Meus pacotes")}
                      >
                        Conhecer os pacotes
                      </button>
                    </div>
                  </>
                )}
                {tab === "Meus pacotes" && (
                  <>
                    <StudentRequests requests={data.requests} />
                    <p className="mb-5 text-sm text-slate-600">
                      Solicitar não gera cobrança. A equipe confirma as
                      condições e libera os créditos após análise.
                    </p>
                    <div className="grid gap-4 md:grid-cols-3">
                      {data.packages.map((p) => (
                        <StudentPackageOffer
                          key={p.id}
                          pack={p}
                          pending={data.requests.some(
                            (r) =>
                              r.package_id === p.id && r.status === "pending",
                          )}
                          onRequested={async () => {
                            await refresh(session.user.id);
                            setMessage(
                              "Solicitação enviada. Aguarde a liberação pela equipe.",
                            );
                          }}
                        />
                      ))}
                    </div>

                  </>
                )}
                {tab === "Minhas aulas" && <BookingRules readOnly />}
                {tab === "Minhas aulas" && (
                  <StudentLessons
                    lessons={data.lessons}
                    busy={busy}
                    onCancel={(l) => {
                      if (
                        !window.confirm(
                          "Cancelar esta aula e devolver o crédito disponível?",
                        )
                      )
                        return;
                      action(async () => {
                        const { error } = await supabase.rpc(
                          "cancel_my_lesson",
                          { p_lesson: l.id },
                        );
                        if (error) throw error;
                        await refresh(session.user.id);
                        setMessage(
                          "Aula cancelada. Crédito disponível novamente.",
                        );
                      });
                    }}
                  />
                )}
                {tab === "Meu perfil" && (
                  <CloudProfileEditor
                    student={data.student}
                    email={session.user.email}
                    onSaved={() => refresh(session.user.id)}
                  />
                )}
                {tab === "Agendar aula" && (
                  <div className="admin-card">
                    <BookingRules readOnly />
                    <h2 className="text-xl font-bold">
                      Escolha um horário livre
                    </h2>
                    <p className="my-3 text-sm text-slate-600">
                      Horário de Brasília. Cada reserva utiliza um crédito da
                      categoria.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label>
                        Categoria
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="A">A — Moto</option>
                          <option value="B">B — Carro</option>
                        </select>
                      </label>
                      <label>
                        Dia
                        <input
                          type="date"
                          value={day}
                          onChange={(e) => setDay(e.target.value)}
                        />
                      </label>
                    </div>
                    {available(category) <= 0 && (
                      <p className="mt-4 text-amber-800">
                        Você pode consultar horários, mas precisa de créditos
                        para confirmar.
                      </p>
                    )}
                    {slotLoading ? (
                      <p className="mt-4" role="status">
                        Buscando horários…
                      </p>
                    ) : slots?.length === 0 ? (
                      <p className="mt-4">
                        Não há horários livres nessa data. Escolha outro dia ou
                        fale com a equipe.
                      </p>
                    ) : (
                      <div className="mt-5 flex flex-wrap gap-3">
                        {slots?.map((s) => (
                          <button
                            className="btn btn-green"
                            key={s.id}
                            disabled={
                              busy ||
                              !canUse ||
                              available(category) <= 0 ||
                              !data.student.category.includes(category)
                            }
                            onClick={() =>
                              action(async () => {
                                const { error } = await supabase.rpc(
                                  "book_lesson",
                                  { p_student: data.student.id, p_slot: s.id },
                                );
                                setSlots(null);
                                if (error) throw error;
                                await refresh(session.user.id);
                                setTab("Minhas aulas");
                                setMessage(
                                  "Aula agendada. A equipe recebeu o aviso no banco.",
                                );
                              })
                            }
                          >
                            Agendar {date(s.starts_at)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
        <a
          href={contact}
          target="_blank"
          rel="noreferrer"
          className="btn btn-green mt-8"
        >
          Falar pelo WhatsApp
        </a>
      </div>
      {data.settings?.ai_enabled !== false && (
        <SpecialistChat
          contact={() => window.open(contact, "_blank", "noopener,noreferrer")}
        />
      )}
    </main>
  );
}
