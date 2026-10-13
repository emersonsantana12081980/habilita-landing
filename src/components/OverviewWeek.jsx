import React, { useState } from "react";

const dayKey = value => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(value));
export function OverviewWeek({ lessons, students, onLesson, onNavigate }) {
  const today = dayKey(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const start = new Date(today + "T12:00:00Z");
  start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7 + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); });
  return <section className="overview-week" aria-label="Agenda da semana">
    <div className="overview-week-heading"><div><p className="eyebrow">SUA ROTINA ORGANIZADA</p><h3>Agenda da semana</h3></div><button className="btn btn-outline" onClick={() => onNavigate("Agenda", weekOffset === 0 ? today : days[0])}>Abrir agenda</button></div>
    <div className="week-controls"><button aria-label="Semana anterior" onClick={() => setWeekOffset(n => n - 1)}>←</button><p aria-live="polite">{days[0].split('-').reverse().join('/')} a {days[6].split('-').reverse().join('/')}</p><button aria-label="Próxima semana" onClick={() => setWeekOffset(n => n + 1)}>→</button><button onClick={() => setWeekOffset(0)}>Hoje</button></div>
    <div className="overview-week-scroll" role="group" tabIndex={0} aria-label="Dias da semana; role para ver todos os dias"><div className="overview-week-grid">{days.map(day => {
      const rows = lessons.filter(l => l.status !== "cancelled" && dayKey(l.starts_at) === day).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
      return <div className="overview-week-day" key={day}><header className={day === today ? "is-today" : ""}><span>{new Date(day + "T12:00:00Z").toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" })}</span><strong>{day.slice(8)}/{day.slice(5, 7)}</strong></header><div className="overview-week-events">{rows.map(l => <button key={l.id} onClick={() => onLesson(l)} className={`week-event ${l.category === "A" ? "week-event-moto" : ""}`}><strong>{new Date(l.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}</strong><span>{students.find(s => s.id === l.student_id)?.name || "Aluno"}</span><small>{l.category === "A" ? "Moto" : "Carro"} · {{ scheduled: "Agendada", completed: "Realizada", missed: "Falta" }[l.status]}</small></button>)}{!rows.length && <p className="week-empty">Sem aulas</p>}</div></div>;
    })}</div></div>
  </section>;
}
