import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { StudentPackageCatalog } from "./StudentPackageCatalog";
import { ManualPayment } from "./ManualPayment";
import { money } from "../store-data";

export function StudentStart({ packages, requests, contact, onRequested, initialCategory = "" }) {
  const [showMore, setShowMore] = useState(false);
  const pending = requests.filter(r => r.status === "pending");
  return <section aria-label="Comece suas aulas" className="space-y-6">
    <div className="rounded-2xl bg-[#0e213b] p-6 text-white sm:p-8">
      <p className="text-sm font-semibold text-green-300">SEU PRÓXIMO PASSO</p>
      <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">{pending.length ? "Recebemos seu interesse" : "Vamos começar suas aulas?"}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-slate-200">{pending.length ? "Sua solicitação está com a equipe. Vamos confirmar os detalhes do pacote com você antes de liberar o agendamento." : "Escolha o que você quer aprender. Nossa equipe ajuda a combinar os próximos passos."}</p>
      <ol aria-label="Etapas para começar" className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
        {["Escolher pacote", "Confirmar com a equipe", "Agendar aulas"].map((label, i) => <li key={label} aria-current={i === (pending.length ? 1 : 0) ? "step" : undefined} className={i === (pending.length ? 1 : 0) ? "font-bold text-white" : "text-slate-300"}>{i + 1}. {label}</li>)}
      </ol>
    </div>
    {!!pending.length && <div className="space-y-3">
      {pending.map(r => <article key={r.id} className="rounded-2xl border border-green-200 bg-white p-5">
        <div className="flex items-start gap-3"><CheckCircle2 className="shrink-0 text-green-700" size={23}/><div>
          <h3 className="text-lg font-bold">{r.package_name}</h3>
          <p className="mt-1 font-semibold">{money(r.price_cents / 100)}</p>
          <p className="mt-2 text-sm text-slate-600">{r.review_started_at ? "A equipe está analisando sua solicitação." : "Solicitação recebida. Aguarde o contato da equipe ou fale conosco pelo WhatsApp."}</p>
          <p className="mt-2 text-sm text-slate-600">Não é necessário solicitar este pacote novamente.</p>
        </div></div>
        <ManualPayment request={r}/>
      </article>)}
      <button className="rounded-lg px-1 py-3 text-sm font-semibold text-green-800 underline" onClick={() => setShowMore(v => !v)}>{showMore ? "Ocultar outros pacotes" : "Quero conhecer outros pacotes"}</button>
    </div>}
    {(!pending.length || showMore) && <StudentPackageCatalog packages={packages} requests={requests} initialCategory={initialCategory} onRequested={onRequested}/>}
    <a href={contact} target="_blank" rel="noreferrer" className="btn btn-outline">{pending.length ? "Falar com a equipe sobre meu pacote" : "Preciso de ajuda para escolher"}</a>
  </section>;
}
