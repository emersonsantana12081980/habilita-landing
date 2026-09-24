import React, { useState } from "react";
import { CalendarDays, ExternalLink } from "lucide-react";
import { googleBookingUrl } from "../google-calendar";

export function GoogleBooking({ url, pack }) {
  const [show, setShow] = useState(false);
  const safeUrl = googleBookingUrl(url);
  if (!safeUrl) return null;
  const embeddable = new URL(safeUrl).hostname === "calendar.google.com";
  return (
    <section className="mt-6 space-y-4 rounded-xl border border-green-200 bg-green-50 p-4">
      <h3 className="flex items-center gap-2 font-bold">
        <CalendarDays size={20} /> Agende sua aula no Google Agenda
      </h3>
      <p className="text-sm leading-6 text-slate-600">
        Veja os horários disponíveis e conclua sua reserva na página do
        instrutor. Os compromissos e dados de outros alunos não são exibidos
        nesta página de agendamento.
      </p>
      <p className="text-sm leading-6 text-slate-600">
        Pacote escolhido: <strong>{pack.name}</strong>. Informe esse pacote e a
        categoria {pack.category.replace("+", "/")} no formulário do Google. O
        pacote não é enviado automaticamente. Cada reserva corresponde a um
        horário, não a todas as aulas do pacote.
      </p>
      {embeddable && (
        <button className="btn btn-green w-full" onClick={() => setShow(!show)}>
          {show ? "Fechar calendário" : "Ver horários disponíveis"}
        </button>
      )}
      {show && embeddable && (
        <iframe
          title="Horários disponíveis no Google Agenda"
          src={`${safeUrl}?gv=true`}
          className="h-[620px] w-full rounded-lg border-0 bg-white"
        />
      )}
      <a
        className={`btn ${embeddable ? "btn-outline" : "btn-green"} w-full`}
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Agendar no Google <ExternalLink size={17} />
      </a>
      <p className="text-xs leading-5 text-slate-500">
        A confirmação e o cancelamento são gerenciados pelo Google. Reservar um
        horário não confirma o pagamento do pacote. Confira o instrutor, a
        duração e o local na página de agendamento.
      </p>
    </section>
  );
}
