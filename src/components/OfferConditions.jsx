import React from 'react';
export function OfferConditions({ pack:p }) {
  return <dl className="my-4 space-y-3 text-sm leading-6 text-slate-700">
    <div><dt className="font-bold">Categoria e aulas</dt><dd>Categoria {p.category?.replace('+','/')}.
      {p.lessons_a>0 && ` Moto: ${p.lessons_a} aula(s), ${p.lesson_minutes_a} minutos cada.`}
      {p.lessons_b>0 && ` Carro: ${p.lessons_b} aula(s), ${p.lesson_minutes_b} minutos cada.`}</dd></div>
    <div><dt className="font-bold">Juros e parcelamento</dt><dd className="whitespace-pre-line">{p.card_contract}</dd></div>
    <div><dt className="font-bold">Veículo para exame {p.exam_vehicle?'— incluído nas condições abaixo':'— não incluído'}</dt><dd className="whitespace-pre-line">{p.exam_terms}</dd></div>
    <div><dt className="font-bold">Taxas e serviços não incluídos</dt><dd className="whitespace-pre-line">{p.exclusions}</dd></div>
    <div><dt className="font-bold">Reteste</dt><dd>{p.free_retest ? <>
      <p>Cobertura: {p.retest_coverage}</p><p>Prazo e início da contagem: {p.retest_validity}</p>
      <p>Utilizações: {p.retest_uses}</p><p>Custos e taxas: {p.retest_costs}</p>
    </> : 'Não incluído. Solicite um orçamento separado antes de contratar.'}</dd></div>
    <div><dt className="font-bold">Cancelamento e reagendamento</dt><dd className="whitespace-pre-line">{p.cancellation_terms}</dd></div>
    <p>Pacote de aulas práticas, não inclui o processo completo da CNH. Não há garantia de aprovação.</p>
  </dl>;
}
export function OfferConditionsEditor({form,setForm}) {
  const change=(key,value)=>setForm(f=>({...f,[key]:value,offer_confirmed:false}));
  return <fieldset className="sm:col-span-2 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
    <legend className="font-bold">Condições confirmadas da oferta</legend>
    {[["lesson_minutes_a","Duração de cada aula de moto (minutos)",form.category!=='B'],["lesson_minutes_b","Duração de cada aula de carro (minutos)",form.category!=='A']].filter(x=>x[2]).map(([key,label])=><label key={key}>{label}<input type="number" min="1" max="1440" value={form[key]??''} onChange={e=>change(key,e.target.value?Number(e.target.value):null)}/></label>)}
    {form.category==='A+B' && [['cash_a_cents','Parte do valor à vista — moto (R$)'],['cash_b_cents','Parte do valor à vista — carro (R$)']].map(([key,label])=><label key={key}>{label}<input type="number" min="0.01" step="0.01" value={form[key]==null?'':form[key]/100} onChange={e=>change(key,e.target.value?Math.round(Number(e.target.value)*100):null)}/></label>)}
    {[['card_contract','Juros, acréscimos e condições do cartão'],['exam_terms','Veículo para exame: disponibilidade, local e custos'],['exclusions','Taxas e serviços não incluídos'],['cancellation_terms','Condições de cancelamento e reagendamento'],...(form.free_retest?[['retest_coverage','Reteste: serviço coberto'],['retest_validity','Reteste: prazo e início da contagem'],['retest_costs','Reteste: eventuais custos e taxas']]:[])].map(([key,label])=><label key={key}>{label}<textarea maxLength={2000} value={form[key]||''} onChange={e=>change(key,e.target.value)}/></label>)}
    {form.free_retest && <label>Reteste: quantidade de utilizações<input type="number" min="1" max="100" value={form.retest_uses??''} onChange={e=>change('retest_uses',e.target.value?Number(e.target.value):null)}/></label>}
    <label className="sm:col-span-2 flex items-start gap-2"><input type="checkbox" name="offer_confirmed" checked={form.offer_confirmed===true} onChange={e=>setForm(f=>({...f,offer_confirmed:e.target.checked}))}/>Confirmo que os preços estão vigentes e revisei todas as condições acima para publicar esta oferta.</label>
    <p className="sm:col-span-2 text-sm">Sem confirmação ou com informações incompletas, a oferta fica oculta para visitantes e alunos. Não informe valores ou benefícios de exemplo.</p>
  </fieldset>;
}
