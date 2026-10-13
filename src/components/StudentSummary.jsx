import React from "react";
import { CalendarDays, CheckCircle2, Car, Bike } from "lucide-react";
export function StudentSummary({ lessons, moto, carro }) {
  const upcoming = lessons.filter(l => l.status === "scheduled" && new Date(l.ends_at) > new Date()).length;
  const completed = lessons.filter(l => l.status === "completed").length;
  return <div className="student-stats" aria-label="Resumo das suas aulas">
    {[["Aulas agendadas", upcoming, CalendarDays], ["Aulas realizadas", completed, CheckCircle2], ["Disponíveis · carro", carro, Car], ["Disponíveis · moto", moto, Bike]].map(([label, value, Icon]) => <article key={label}><Icon size={20} aria-hidden="true"/><p>{label}</p><strong>{value}</strong></article>)}
  </div>;
}
