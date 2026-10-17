import React, { useState } from 'react';
import { Bike, CarFront, Clock3, MessageCircle, Plus } from 'lucide-react';
import { money } from '../store-data';
import { trackLanding } from '../lib/landing-events';
import { experienceLevels, planCategories, resolveExperienceOffer } from '../data/experience-plans';

export function installmentText(totalCents, count) {
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0 || !Number.isInteger(count) || count <= 0) return null;
  const base = Math.floor(totalCents / count), remainder = totalCents % count;
  return remainder
    ? `${remainder}x de ${money((base + 1) / 100)} + ${count - remainder}x de ${money(base / 100)} · total ${money(totalCents / 100)}`
    : `${count}x de ${money(base / 100)} · total ${money(totalCents / 100)}`;
}
export function PublicPackages({ packages, contact }) {
  const [category, setCategory] = useState('B');
  const selected = planCategories.find(c => c.id === category);
  return <section id="pacotes" className="bg-slate-50 section-space" aria-labelledby="packages-title"><div className="container">
    <span id="categorias" />
    <div className="mb-7 max-w-2xl"><p className="eyebrow">PACOTES DE AULAS PRÁTICAS · CAÇAPAVA E REGIÃO</p><h2 id="packages-title">Escolha o plano pelo seu momento.</h2><p className="section-subtitle">Selecione a categoria e compare as opções conforme sua experiência. O instrutor ajuda a definir o plano com você.</p></div>
    <fieldset className="mb-7"><legend className="mb-3 text-sm font-semibold">Qual categoria você quer praticar?</legend><div className="flex flex-wrap gap-3">{planCategories.map(c => <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)} className={`min-h-11 rounded-full border px-5 py-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700 ${category === c.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{c.label}</button>)}</div></fieldset>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold uppercase tracking-wide">Qual é a sua experiência?</h3><p className="text-sm text-slate-500" aria-live="polite">Pratique no seu ritmo.</p></div>
    <div className="grid gap-5 lg:grid-cols-3">{experienceLevels.map(level => {
      const offer = resolveExperienceOffer(packages, category, level.id);
      const query = new URLSearchParams({ categoria: category, experiencia: level.id });
      if (offer) query.set('pacote', offer.pack.id);
      const message = `Olá! Tenho interesse em aulas: ${selected.label}. Meu perfil: ${level.title}.${offer ? ` Pacote: ${offer.pack.name}.` : ''} Gostaria de consultar horários, duração, valores e condições.`;
      return <article key={`${category}-${level.id}`} data-category={category} data-experience={level.id} className={`flex min-w-0 flex-col rounded-2xl border bg-white p-6 shadow-sm ${level.id === 'base' ? 'border-yellow-400 ring-1 ring-yellow-200' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between gap-2"><span className="rounded-md bg-yellow-100 px-2 py-1 text-[11px] font-bold text-yellow-950">{level.badge}</span><span className="flex text-slate-500">{category !== 'A' && <CarFront size={19}/>} {category !== 'B' && <Bike size={19}/>}</span></div>
        <h4 className="mt-5 text-xl font-extrabold">{level.title}</h4><p className="mt-3 text-sm leading-6 text-slate-600">{level.description}</p>
        <div className="my-5 rounded-lg bg-slate-50 p-3 text-sm font-medium text-green-800"><Clock3 size={16} className="mr-2 inline"/>{level.note}</div>
        {offer ? <div className="mb-4"><p className="text-sm text-green-800">À vista</p><p className="text-3xl font-extrabold text-green-800">{money(offer.cash / 100)}</p><p className="mt-2 text-sm text-slate-600">{offer.total % offer.count === 0 ? `ou até ${offer.count}x de ${money(offer.total / offer.count / 100)} no cartão` : `No cartão: ${installmentText(offer.total,offer.count)}`}</p><p className="mt-1 text-xs text-slate-500">Total parcelado: {money(offer.total/100)}.</p><p className="mt-2 text-xs text-slate-600">{offer.total > offer.cash ? `O total no cartão é ${money((offer.total-offer.cash)/100)} maior que o preço à vista.` : offer.total < offer.cash ? 'O total no cartão é menor que o preço à vista, conforme condição cadastrada.' : 'Mesmo total à vista e no cartão.'}</p>{offer.hours.map(h => <p key={h.id} className="mt-2 text-sm">{h.id === 'B' ? 'Carro' : 'Moto'}: {h.lessons} aulas de {h.minutes} min · {(h.lessons*h.minutes/60).toLocaleString('pt-BR',{maximumFractionDigits:2})} horas{category === 'A+B' ? ` · ${money(h.cash/100)} à vista` : ''}.</p>)}</div>
          : <div className="mb-4"><p className="text-xl font-extrabold text-green-800">Vamos montar seu plano</p><p className="mt-2 text-sm leading-6 text-slate-600">Consulte valores e carga horária com o instrutor antes de contratar.</p>{category === 'A+B' && <p className="mt-2 text-sm text-slate-600">Carro e moto: horas e valores definidos separadamente.</p>}</div>}
        <details className="group mb-5 rounded-xl border border-slate-100 p-4"><summary className="flex min-h-6 cursor-pointer items-center justify-between gap-2 text-sm font-semibold">Ver condições<Plus size={16} className="group-open:rotate-45"/></summary><div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          {!offer && <p>Quantidade de aulas, duração de cada aula e total de horas ainda precisam ser definidos para esta opção. Confirme esses dados antes de contratar.</p>}
          {[["Veículo para exame",offer?.terms.examTerms],["Reteste",offer?.terms.retestTerms],["Cancelamento e reagendamento",offer?.terms.cancellationTerms],["Taxas e outras etapas da CNH",offer?.terms.exclusions],["Contratação e pagamento",offer?.terms.cardContract]].map(([title,text]) => <p key={title}><strong>{title}:</strong> {text || 'consulte as condições com o instrutor antes de contratar.'}</p>)}
          <p>Esta opção se refere a aulas práticas, não ao processo completo da CNH. O site não conclui compras ou pagamentos. A necessidade de aulas adicionais depende da experiência e da avaliação do instrutor. Não há garantia de aprovação.</p>
        </div></details>
        <button className="btn mt-auto w-full bg-yellow-400 text-slate-900 hover:bg-yellow-300" onClick={() => contact(message,'package_whatsapp_click',{category,package_id:offer?.pack.id,source:level.id})}><MessageCircle size={17}/> Conversar sobre este plano</button>
        <a className="mt-3 flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-3 py-3 text-center text-sm font-bold" href={`/cadastro?${query}`} onClick={() => trackLanding('signup_start',{category,source:level.id,package_id:offer?.pack.id})}>Cadastre-se grátis</a>
        <p className="mt-2 text-center text-xs text-slate-500">Cadastro gratuito, sem cobrança.</p>
      </article>;
    })}</div>
    <p className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm leading-6 text-slate-700"><strong>Primeira habilitação:</strong> a carga mínima prática é de 2 horas por categoria. Em A/B, são 2 horas para carro e 2 para moto. Esse mínimo não define a quantidade adequada para cada pessoa nem garante aprovação. <a className="font-semibold underline" href="https://detran.sp.gov.br/cnhpaulista/" target="_blank" rel="noopener noreferrer">Consulte o Detran-SP.</a></p>
  </div></section>;
}
