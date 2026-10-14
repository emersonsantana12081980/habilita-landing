import React, { useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Package, Bell, MessageCircle, ChevronLeft, ChevronRight, Route, Circle, ArrowUpRight } from "lucide-react";
import { UpcomingLessons } from "./UpcomingLessons";
import { ManualPayment } from "./ManualPayment";
import { money } from "../store-data";

export const studentPages = ["Início", "Agendar aula", "Minha agenda", "Histórico de aulas", "Meus pacotes", "Comprar aulas", "Minha jornada CNH", "Meu progresso", "Pagamentos", "Notificações", "Meu perfil", "Suporte"];
const dateKey = value => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(value));
const status = { approved: "Liberado", pending: "Em análise", rejected: "Recusado" };

export function StudentIdentity({ student, contact }) {
  const initials = (student?.name || "Aluno").split(" ").filter(Boolean).slice(0, 2).map(s => s[0]).join("");
  return <div className="student-identity"><div className="student-avatar" aria-hidden="true">{initials}</div><div><strong>{student?.name || "Aluno"}</strong><p>Aluno(a) Habilita+</p><span>Categoria {student?.category || "a definir"}</span></div></div>;
}
export function StudentSupport({ contact, compact = false }) {
  return <section className={`student-support ${compact ? "compact" : ""}`}><MessageCircle size={27}/><h3>Fale com seu instrutor</h3><p>Tire suas dúvidas sobre aulas, pacotes e agendamentos.</p><a className="btn" href={contact} target="_blank" rel="noreferrer">Abrir WhatsApp <ArrowUpRight size={16}/></a></section>;
}
export function StudentMonth({ lessons, onAgenda }) {
  const now = new Date();
  const [month, setMonth] = useState(() => { const key = dateKey(now); return new Date(`${key.slice(0, 7)}-01T12:00:00Z`); });
  const [selected, setSelected] = useState("");
  const year = month.getUTCFullYear(), m = month.getUTCMonth();
  const count = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((month.getUTCDay() + count) / 7) * 7 }, (_, i) => i - month.getUTCDay() + 1);
  const active = lessons.filter(l => l.status === "scheduled");
  const keyFor = day => `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const selectedLessons = active.filter(l => dateKey(l.starts_at) === selected);
  function move(n) { setMonth(new Date(Date.UTC(year, m + n, 1, 12))); setSelected(""); }
  return <section className="student-panel month-panel" aria-label="Calendário do aluno"><div className="student-panel-title"><h2>Minha agenda</h2><CalendarDays size={18}/></div>
    <div className="month-controls"><button aria-label="Mês anterior" onClick={() => move(-1)}><ChevronLeft size={18}/></button><strong aria-live="polite">{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}</strong><button aria-label="Próximo mês" onClick={() => move(1)}><ChevronRight size={18}/></button></div>
    <div className="month-grid">{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => <span className="month-weekday" key={d}>{d}</span>)}{cells.map((day, i) => {
      if (day < 1 || day > count) return <span key={i} className="month-blank"/>;
      const key = keyFor(day), booked = active.some(l => dateKey(l.starts_at) === key);
      return <button key={i} aria-label={`${day} de ${month.toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" })}${booked ? ", com aula agendada" : ""}`} aria-pressed={selected === key} className={`${key === dateKey(now) ? "today" : ""} ${booked ? "booked" : ""}`} onClick={() => setSelected(key)}>{day}{booked && <i/>}</button>;
    })}</div>
    {selected && <p className="month-selection" role="status">{selectedLessons.length ? selectedLessons.map(l => `${l.category === "A" ? "Moto" : "Carro"} às ${new Date(l.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}`).join(" · ") : "Nenhuma aula agendada neste dia."}</p>}
    <button className="student-text-link" onClick={onAgenda}>Ver agenda completa</button>
  </section>;
}
export function StudentJourney({ onDetails, compact = false }) {
  return <section className="student-panel" aria-label="Jornada CNH informativa"><div className="student-panel-title"><h2>Minha jornada CNH</h2>{onDetails && <button onClick={onDetails}>Ver detalhes</button>}</div><p className="student-muted">Acompanhe as etapas. Informações oficiais ainda não estão conectadas.</p>
    <ol className="journey-list">{["Cadastro no Detran", "Exames médico e psicológico", "Formação teórica", "Avaliação teórica", "Aulas práticas", "Exame prático"].map((s, i) => <li key={s}><span className="journey-marker">{i === 4 ? <Route size={17}/> : <Circle size={15}/>}</span><span>{s}</span><small>Não informado</small></li>)}</ol>
    {!compact && <p className="student-muted">Esta tela é informativa. As etapas aplicáveis e sua situação devem ser conferidas com o instrutor e o órgão responsável. Nenhuma conclusão oficial é presumida.</p>}
  </section>;
}
export function StudentProgress({ lessons, onHistory }) {
  const completed = lessons.filter(l => l.status === "completed");
  return <section className="student-panel"><div className="student-panel-title"><h2>Meu progresso nas aulas</h2>{onHistory && <button onClick={onHistory}>Ver histórico</button>}</div>
    <div className="progress-total"><CheckCircle2 size={26}/><strong>{completed.length}</strong><span>aulas realizadas</span></div>
    {["A", "B"].map(cat => <div className="progress-row" key={cat}><span>{cat === "A" ? "Prática de moto" : "Prática de carro"}</span><strong>{completed.filter(l => l.category === cat).length} aulas</strong></div>)}
    <p className="student-muted mt-4">As avaliações de manobras, estacionamento e percurso aparecerão quando o acompanhamento do instrutor estiver disponível.</p>
  </section>;
}
export function StudentPackageSummary({ requests, remaining, onBuy, compact = false }) {
  const approved = requests.filter(r => r.status === "approved");
  return <section className="student-panel"><div className="student-panel-title"><h2>Meus pacotes</h2><button onClick={onBuy}>Comprar aulas</button></div>
    <div className="package-balance"><Package size={26}/><div><strong>{remaining}</strong><span> aulas disponíveis para agendar</span></div></div>
    {approved.length ? approved.slice(0, compact ? 2 : approved.length).map(r => <article className="student-package-line" key={r.id}><strong>{r.package_name}</strong><span className="student-status">Liberado</span><p>{money(r.price_cents / 100)}{r.pricing_demo ? " · demonstração" : ""}</p></article>) : <p className="student-muted">Você ainda não tem um pacote liberado. Escolha suas aulas e acompanhe a análise da equipe.</p>}
    {!compact && requests.filter(r => r.status !== "approved").map(r => <article className="student-package-line" key={r.id}><strong>{r.package_name}</strong><span>{status[r.status] || r.status}</span><p>{money(r.price_cents / 100)}</p>{r.reason && <p>{r.reason}</p>}</article>)}
  </section>;
}
export function StudentUpdates({ requests, onAll, compact = false }) {
  const rows = [...requests].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).slice(0, compact ? 3 : 30);
  return <section className="student-panel"><div className="student-panel-title"><h2>{compact ? "Últimas atualizações" : "Notificações"}</h2>{onAll && <button onClick={onAll}>Ver todas</button>}</div>
    {rows.length ? rows.map(r => <div className="student-update" key={r.id}><Bell size={18}/><div><strong>{r.package_name}</strong><p>Pedido {status[r.status]?.toLowerCase() || "recebido"}{r.created_at ? ` · ${new Date(r.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : ""}</p></div></div>) : <p className="student-muted">Nenhuma atualização de pedido por enquanto.</p>}
    {!compact && <p className="student-muted mt-4">Aqui você acompanha a situação dos pedidos. Lembretes automáticos de aulas ainda não estão disponíveis.</p>}
  </section>;
}
export function StudentPayments({ requests }) {
  return <section className="student-panel"><div className="student-panel-title"><h2>Pagamentos e comprovantes</h2></div><p className="student-muted">Acompanhe seus pedidos e envie comprovantes para conferência manual. A situação do pedido não substitui um recibo de pagamento.</p>
    {!requests.length && <p className="student-empty">Você ainda não tem pedidos para acompanhar.</p>}
    {[...requests].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).map(r => <article className="payment-request" key={r.id}><div className="student-panel-title"><h3>{r.package_name}</h3><strong>{money(r.price_cents / 100)}</strong></div><p className="student-muted">{r.payment_method === "card" ? `Cartão · ${r.installment_count || 1} parcelas` : "Pix à vista"} · Pedido {status[r.status]?.toLowerCase() || "recebido"}</p><ManualPayment request={r}/></article>)}
  </section>;
}
export function StudentDashboard({ data, available, onNavigate }) {
  const total = data.credits.reduce((sum, c) => sum + c.lessons_a + c.lessons_b, 0);
  const remaining = Math.max(0, available("A") + available("B"));
  const completed = data.lessons.filter(l => l.status === "completed").length;
  const next = data.lessons.filter(l => l.status === "scheduled" && new Date(l.ends_at) > new Date()).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0];
  return <>
    <section className="student-welcome"><div><p>ÁREA DO ALUNO · HABILITA+</p><h1>Olá, {data.student.name.split(" ")[0]}!</h1><h2>Seu próximo passo começa aqui.</h2><span>Agende suas aulas, acompanhe seus pacotes e siga no seu ritmo.</span></div><blockquote>Dirigir com confiança.<small>Prática, orientação e um passo de cada vez.</small></blockquote></section>
    <div className="student-metrics">{[[Clock3, "Aulas liberadas", total, "aulas", "gold"], [CheckCircle2, "Aulas realizadas", completed, "aulas", "green"], [CalendarDays, "Saldo disponível", remaining, "aulas", "blue"], [CalendarDays, "Próxima aula", next ? new Date(next.starts_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }) : "A agendar", next ? new Date(next.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : "Escolha seu próximo passo", "rose"]].map(([Icon, title, value, detail, tone]) => <article key={title}><span className={`metric-icon ${tone}`}><Icon size={27}/></span><div><p>{title}</p><strong>{value}</strong><small>{detail}</small></div></article>)}</div>
    {!total && <div className="student-first-step"><div><strong>{data.requests.some(r => r.status === "pending") ? "Seu pedido está com a equipe" : "Vamos começar suas aulas?"}</strong><p>{data.requests.some(r => r.status === "pending") ? "Confira o pagamento e acompanhe a análise." : "Escolha um pacote para dar o primeiro passo."}</p></div><button className="btn btn-green" onClick={() => onNavigate(data.requests.some(r => r.status === "pending") ? "Pagamentos" : "Comprar aulas")}>{data.requests.some(r => r.status === "pending") ? "Acompanhar pedido" : "Escolher meu pacote"}</button></div>}
    <div className="student-dashboard-grid"><StudentJourney compact onDetails={() => onNavigate("Minha jornada CNH")}/><div className="student-upcoming-panel"><UpcomingLessons lessons={data.lessons} onAgenda={() => onNavigate("Minha agenda")} onPackages={() => onNavigate("Comprar aulas")}/><button className="btn btn-green" onClick={() => onNavigate(remaining ? "Agendar aula" : "Comprar aulas")}>{remaining ? "Agendar nova aula" : "Comprar aulas"}</button></div><StudentMonth lessons={data.lessons} onAgenda={() => onNavigate("Minha agenda")}/><StudentPackageSummary compact requests={data.requests} remaining={remaining} onBuy={() => onNavigate("Comprar aulas")}/><StudentProgress lessons={data.lessons} onHistory={() => onNavigate("Histórico de aulas")}/><StudentUpdates compact requests={data.requests} onAll={() => onNavigate("Notificações")}/></div>
  </>;
}
