import React, { useState } from "react";
import { Car, Bike, CheckCircle2, ArrowRight } from "lucide-react";
import { StudentPackageOffer } from "./StudentPackageOffer";
import { money } from "../store-data";

export function StudentStart({ packages, requests, contact, onRequested, initialCategory = "" }) {
  const [choice, setChoice] = useState(initialCategory);
  const [showMore, setShowMore] = useState(false);
  const pending = requests.filter(r => r.status === "pending");
  const choices = [["B", "Quero aulas de carro", Car], ["A", "Quero aulas de moto", Bike], ["A+B", "Quero carro e moto", Car]];
  const visible = packages.filter(p => choice === "A+B" ? p.lessons_a > 0 && p.lessons_b > 0 : choice === "A" ? p.lessons_a > 0 && !p.lessons_b : choice === "B" ? p.lessons_b > 0 && !p.lessons_a : false);
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
          {r.pricing_demo && <p className="mt-1 text-xs text-amber-800">Valor de demonstração, sujeito à confirmação.</p>}
          <p className="mt-2 text-sm text-slate-600">{r.review_started_at ? "A equipe está analisando sua solicitação." : "Solicitação recebida. Aguarde o contato da equipe ou fale conosco pelo WhatsApp."}</p>
          <p className="mt-2 text-sm text-slate-600">Não é necessário solicitar este pacote novamente.</p>
        </div></div>
      </article>)}
      <button className="rounded-lg px-1 py-3 text-sm font-semibold text-green-800 underline" onClick={() => setShowMore(v => !v)}>{showMore ? "Ocultar outros pacotes" : "Quero conhecer outros pacotes"}</button>
    </div>}
    {(!pending.length || showMore) && <>
      <div className="grid gap-3 sm:grid-cols-3">
        {choices.map(([value, label, Icon]) => <button key={value} aria-pressed={choice === value} onClick={() => setChoice(value)} className={`flex min-h-28 items-center gap-3 rounded-2xl border-2 p-5 text-left font-bold transition ${choice === value ? "border-green-700 bg-green-50 text-green-900" : "border-slate-200 bg-white hover:border-green-600"}`}><Icon className="shrink-0" size={28}/><span>{label}</span><ArrowRight className="ml-auto shrink-0" size={18}/></button>)}
      </div>
      {choice && <div>
        <h3 className="text-xl font-bold">Escolha seu pacote</h3>
        <p className="mb-5 mt-2 text-sm text-slate-600">Sua solicitação não gera cobrança. Vamos confirmar os detalhes com você.</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map(pack => <StudentPackageOffer key={pack.id} pack={pack} guided pending={pending.some(r => r.package_id === pack.id)} onRequested={onRequested}/>)}</div>
        {!visible.length && <p className="rounded-xl border bg-white p-5">Não há um pacote disponível nesta opção no momento. Fale com a equipe para combinar suas aulas.</p>}
      </div>}
    </>}
    <a href={contact} target="_blank" rel="noreferrer" className="btn btn-outline">{pending.length ? "Falar com a equipe sobre meu pacote" : "Preciso de ajuda para escolher"}</a>
  </section>;
}
