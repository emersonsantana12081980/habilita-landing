import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, Home, History, LogOut, RefreshCw, Clock, Users, CheckCircle2 } from "lucide-react";
import { Brand } from "./Brand";
import { OverviewWeek } from "./OverviewWeek";
import { supabase } from "../lib/supabase";
import { InstructorPassword } from "./InstructorPassword";
import "../instructor-design.css";

const date = value => new Date(value).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
const time = value => new Date(value).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const day = value => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(value));
const labels = { scheduled: "Agendada", completed: "Realizada", missed: "Falta", cancelled: "Cancelada" };
export default function InstructorPortal() {
  const [changePassword, setChangePassword] = useState(() => new URLSearchParams(location.search).has('primeiro-acesso'));
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("Início");
  const [selectedDay, setSelectedDay] = useState("");
  const [selected, setSelected] = useState(null);
  const version = useRef(0);
  const user = useRef(null);
  async function load() {
    const request = ++version.current;
    setBusy(true); setError(""); setData(null); setSelected(null);
    try {
      const { data: result, error: failure } = await supabase.rpc("instructor_portal").abortSignal(AbortSignal.timeout(15000));
      if (request !== version.current) return;
      if (failure) throw failure;
      setData(result);
    } catch (failure) {
      if (request !== version.current) return;
      setError(failure.message?.includes("instructor_access_required")
        ? "Esta conta ainda não está vinculada a um instrutor ativo. Peça à administração para liberar seu acesso."
        : "Não foi possível carregar sua agenda. A administração precisa conferir a conexão e a configuração da área do instrutor.");
    } finally { if (request === version.current) setBusy(false); }
  }
  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (user.current !== next?.user?.id) {
        ++version.current; setData(null); setSelected(null); setError(""); setBusy(false);
        user.current = next?.user?.id;
      }
      setSession(next); setReady(true);
    });
    return () => { ++version.current; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => { if (session?.user?.id) load(); }, [session?.user?.id]);
  async function login(event) {
    event.preventDefault(); setBusy(true); setError("");
    const { error: failure } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPassword(""); setBusy(false);
    if (failure) setError("Não foi possível entrar. Confira seu e-mail e senha.");
  }
  async function logout() {
    ++version.current; setData(null); setSelected(null);
    const { error: failure } = await supabase.auth.signOut();
    if (failure) setError("Não foi possível sair. Tente novamente.");
  }
  const lessons = data?.lessons || [];
  const upcoming = lessons.filter(l => l.status === "scheduled" && new Date(l.ends_at) >= new Date());
  const rows = tab === "Histórico" ? lessons.filter(l => l.status !== "scheduled").slice().reverse()
    : upcoming.filter(l => !selectedDay || day(l.starts_at) === selectedDay);
  const students = lessons.map(l => ({ id: l.student_id, name: l.student_name }));
  const list = items => items.length ? <div className="instructor-lessons">{items.map(l => <button className="instructor-lesson" key={l.id} onClick={() => setSelected(l)}>
    <span className="instructor-date"><strong>{time(l.starts_at)}</strong>{date(l.starts_at)}</span><span><strong>{l.student_name}</strong><small>{l.category === "A" ? "Moto" : "Carro"} · {l.vehicle_name}</small></span><span className={`instructor-status ${l.status}`}>{labels[l.status] || l.status}</span>
  </button>)}</div> : <p className="instructor-empty">Nenhuma aula {tab === "Histórico" ? "no histórico" : "agendada neste período"}. As aulas atribuídas a você aparecerão aqui.</p>;
  return <div className="instructor-shell">
    <header className="instructor-top"><Brand /><span>Área do instrutor</span>{session ? <><button onClick={() => setChangePassword(true)}>Trocar senha</button><button onClick={logout}><LogOut size={18}/> Sair</button></> : <a href="/">Voltar ao site</a>}</header>
    {session && changePassword ? <InstructorPassword onDone={() => { setChangePassword(false); history.replaceState(null, '', '/instrutor'); }} /> : <>
    {!ready ? <p role="status">Carregando acesso…</p> : !session ? <main className="instructor-login"><div><p className="eyebrow">HABILITA+ · INSTRUTORES</p><h1>Sua agenda, em um só lugar.</h1><p>Confira suas próximas aulas e organize o seu dia.</p></div><form onSubmit={login}><h2>Entrar na área do instrutor</h2><p>Use o e-mail e a senha da sua conta vinculada pela administração.</p><label>E-mail<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)}/></label><label>Senha<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/></label>{error && <p role="alert">{error}</p>}<button className="instructor-primary" disabled={busy || !supabase}>{busy ? "Entrando…" : "Entrar"}</button>{!supabase && <p role="alert">A conexão com o sistema ainda não está configurada.</p>}<a href="/aluno">Sou aluno</a></form></main> : <div className="instructor-layout">
      <aside><div className="instructor-identity"><span>{data?.instructor.name?.slice(0, 1) || "H"}</span><strong>{data?.instructor.name || "Instrutor Habilita+"}</strong><small>{data ? `Categoria ${data.instructor.category} · ${data.instructor.city}` : "Acesso reservado"}</small></div><nav aria-label="Menu do instrutor">{[["Início", Home], ["Agenda", CalendarDays], ["Histórico", History]].map(([name, Icon]) => <button key={name} aria-current={tab === name ? "page" : undefined} onClick={() => { setTab(name); setSelectedDay(""); }}><Icon size={20}/>{name}</button>)}</nav><p>Precisa alterar uma aula? Fale com a administração para ajustar o agendamento.</p><a href="/">Ver site Habilita+</a></aside>
      <main><section className="instructor-hero"><p>SEU DIA NA HABILITA+</p><h1>Olá{data ? `, ${data.instructor.name.split(" ")[0]}` : ""}!</h1><p>Mais organização para acompanhar cada aluno.</p></section><div className="instructor-heading"><h2>{tab === "Início" ? "Resumo das suas aulas" : tab === "Agenda" ? "Minha agenda" : "Histórico de aulas"}</h2><button disabled={busy} onClick={load}><RefreshCw size={16}/> {busy ? "Atualizando…" : "Atualizar"}</button></div>
      {error && <p role="alert" className="instructor-notice">{error}</p>}{busy && <p role="status">Carregando suas aulas…</p>}
      {data && <>{tab === "Início" && <div className="instructor-stats">{[[CalendarDays, upcoming.length, "Aulas agendadas"], [Users, new Set(upcoming.map(l => l.student_id)).size, "Alunos com aulas marcadas"], [CheckCircle2, lessons.filter(l => l.status === "completed").length, "Aulas realizadas"]].map(([Icon, value, label]) => <article key={label}><Icon/><div><strong>{value}</strong><span>{label}</span></div></article>)}</div>}
      {tab !== "Histórico" && <OverviewWeek lessons={lessons} students={students} onLesson={setSelected} onNavigate={(_tab, value) => { setTab("Agenda"); setSelectedDay(value); }}/>}
      <section className="instructor-card"><div className="instructor-heading"><h3>{tab === "Início" ? "Próximas aulas" : tab === "Histórico" ? "Aulas realizadas, faltas e cancelamentos" : "Aulas agendadas"}</h3>{tab === "Agenda" && <label>Filtrar por dia<input type="date" value={selectedDay} onChange={e => setSelectedDay(e.target.value)}/><button onClick={() => setSelectedDay("")}>Todos os dias</button></label>}</div>{list(tab === "Início" ? upcoming.slice(0, 5) : rows)}</section></>}
      {selected && <section className="instructor-card" role="region" aria-label="Detalhes da aula"><div className="instructor-heading"><h3>Detalhes da aula</h3><button onClick={() => setSelected(null)}>Fechar detalhes</button></div><p><strong>{selected.student_name}</strong></p><p><Clock size={16}/> {date(selected.starts_at)} · {time(selected.starts_at)} às {time(selected.ends_at)}</p><p>{selected.vehicle_name} · Categoria {selected.category}</p><p>{labels[selected.status]}</p></section>}
      </main></div>}
    </>}
  </div>;
}
