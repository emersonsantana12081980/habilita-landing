import React from "react";
import { CalendarDays, ArrowRight } from "lucide-react";

export function UpcomingLessons({ lessons, onAgenda, onPackages }) {
  const upcoming = lessons.filter(l => l.status === "scheduled" && new Date(l.ends_at) > new Date()).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)).slice(0, 3);
  return <section className="admin-card upcoming-lessons" aria-label="Próximas aulas">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="m-0!">Próximas aulas</h2><button className="text-sm font-semibold text-green-800" onClick={onAgenda}>Ver minhas aulas <ArrowRight className="inline" size={15}/></button></div>
    {upcoming.length ? <ul className="mt-5 divide-y divide-slate-100">{upcoming.map(l => {
      const start = new Date(l.starts_at);
      return <li key={l.id} className="flex items-center gap-4 py-4"><div className="lesson-date"><strong>{start.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" })}</strong><span>{start.toLocaleDateString("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" })}</span></div><div className="min-w-0 flex-1"><p className="font-semibold">{start.toLocaleDateString("pt-BR", { weekday: "long", timeZone: "America/Sao_Paulo" })} · {start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}</p><p className="mt-1 text-sm text-slate-500">Aula prática · {l.category === "A" ? "Moto" : "Carro"}</p><span className="mt-2 inline-block rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-800">Agendada</span></div></li>;
    })}</ul> : <div className="py-8 text-center"><CalendarDays className="mx-auto mb-3 text-slate-400" size={32}/><p className="text-sm text-slate-600">Você ainda não tem uma aula agendada.</p><button className="mt-4 text-sm font-semibold text-green-800 underline" onClick={onPackages}>Consultar meus pacotes</button></div>}
  </section>;
}
