import React, { useState } from "react";
import { money } from "../store-data";
import { supabase } from "../lib/supabase";

export const requestStage = (r) => r.status !== "pending" ? "finished" : r.review_started_at ? "review" : "requested";
export const requestLabel = (r) => r.status === "approved" ? "Finalizado · Aprovado" : r.status === "rejected" ? "Finalizado · Recusado" : r.review_started_at ? "Em análise" : "Solicitado";

export function RequestBoard({ requests, students, reasons, setReasons, act, filters, setFilters }) {
  const [limit, setLimit] = useState(12);
  const normalize = v => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const change = (key,value) => {setFilters(f=>({...f,[key]:value}));setLimit(12);};
  const invalidDates = filters.from && filters.to && filters.from > filters.to;
  const filtered = requests.filter(r=>{
    const student=students.find(s=>s.id===r.student_id);
    const category=r.lessons_a>0 ? r.lessons_b>0 ? "A+B" : "A" : "B";
    const day=r.created_at ? new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date(r.created_at)) : "";
    return !invalidDates && (!filters.search || normalize(`${student?.name || ""} ${r.package_name}`).includes(normalize(filters.search.trim()))) &&
      (!filters.category || category===filters.category) && (!filters.result || r.status===filters.result) &&
      (!filters.from || day>=filters.from) && (!filters.to || (day && day<=filters.to));
  });
  return <>
    <div className="mb-4 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-sm">Buscar pedido<input type="search" placeholder="Aluno ou pacote" value={filters.search} onChange={e=>change('search',e.target.value)}/></label>
      <label className="text-sm">Categoria do pedido<select value={filters.category} onChange={e=>change('category',e.target.value)}><option value="">Todas</option><option value="A">Moto</option><option value="B">Carro</option><option value="A+B">Carro e moto</option></select></label>
      <label className="text-sm">Resultado do pedido<select value={filters.result} onChange={e=>change('result',e.target.value)}><option value="">Todos</option><option value="pending">Em aberto</option><option value="approved">Aprovados</option><option value="rejected">Recusados</option></select></label>
      <label className="text-sm">Solicitado desde<input type="date" value={filters.from} onChange={e=>change('from',e.target.value)}/></label>
      <label className="text-sm">Solicitado até<input type="date" value={filters.to} onChange={e=>change('to',e.target.value)}/></label>
      <button className="text-left text-sm font-semibold underline" onClick={()=>{setFilters({search:"",category:"",result:"",from:"",to:""});setLimit(12);}}>Limpar filtros de pedidos</button>
    </div>
    {invalidDates && <p role="alert" className="mb-3 text-red-700">A data inicial deve ser anterior ou igual à data final.</p>}
    <p role="status" className="mb-3 text-sm text-slate-600">{filtered.length} pedido(s) encontrado(s)</p>
    <div className="grid items-start gap-4 lg:grid-cols-3">
    {[["requested", "Solicitado"], ["review", "Em análise"], ["finished", "Pedido finalizado"]].map(([stage, title]) => {
      const rows = filtered.filter(r => requestStage(r) === stage).sort((a,b) => (b.created_at || "").localeCompare(a.created_at || ""));
      return <section key={stage} aria-label={title} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-100 p-3">
        <h2 className="mb-3 flex justify-between px-1 font-bold">{title}<span className="rounded-full bg-white px-2 text-slate-600">{rows.length}</span></h2>
        <div className="space-y-3">{(stage==='finished'?rows.slice(0,limit):rows).map(r => <article key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="break-words font-bold">{students.find(s=>s.id===r.student_id)?.name || "Cadastro indisponível"}</h3>
          <p className="mt-1 text-sm text-slate-600">{r.package_name}</p>
          <p className={`mt-2 text-xs font-bold ${r.status === "rejected" ? "text-red-700" : "text-green-800"}`}>{requestLabel(r)}</p>
          <p className="mt-3 font-bold">{money(r.price_cents/100)}</p>
          <p className="text-xs text-slate-500">{r.lessons_a} aulas de moto · {r.lessons_b} aulas de carro</p>
          {r.original_price_cents && <p className="mt-2 text-xs text-slate-600">Original: {money(r.original_price_cents/100)} · Desconto: {money(r.discount_cents/100)}{r.coupon_code && ` · Cupom: ${r.coupon_code}`} · {r.payment_method === "card" ? `${r.installment_count}x no cartão` : "À vista"}{r.pricing_demo && " · Valores fictícios"}</p>}
          {stage === "requested" && <button className="mt-3 w-full rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-800" onClick={()=>act(()=>supabase.rpc("start_package_review",{p_request:r.id}),"Pedido em análise.")}>Iniciar análise</button>}
          {r.status === "pending" ? <details className="mt-3" open={stage === "review" || undefined}>
            <summary className="cursor-pointer text-sm font-semibold">Decidir pedido</summary>
            <form className="mt-3 space-y-3" onSubmit={e=>{e.preventDefault();act(()=>supabase.rpc("resolve_package",{p_request:r.id,p_approve:true,p_reason:reasons[r.id]}),"Pacote aprovado e créditos liberados.");}}>
              <label className="text-sm">Motivo da decisão<input required value={reasons[r.id] || ""} onChange={e=>setReasons(v=>({...v,[r.id]:e.target.value}))}/></label>
              <p className="text-xs text-slate-500">Aprovação manual libera créditos, sem realizar cobrança.</p>
              <button disabled={!reasons[r.id]?.trim()} className="btn btn-green w-full">Aprovar e liberar créditos</button>
              <button type="button" disabled={!reasons[r.id]?.trim()} className="w-full rounded-lg border px-3 py-2 text-red-700" onClick={()=>act(()=>supabase.rpc("resolve_package",{p_request:r.id,p_approve:false,p_reason:reasons[r.id]}),"Pedido recusado.")}>Recusar</button>
            </form>
          </details> : r.reason && <p className="mt-3 break-words text-sm text-slate-600">{r.reason}</p>}
        </article>)}</div>
        {!rows.length && <p className="py-5 text-center text-sm text-slate-500">Nenhum pedido nesta etapa.</p>}
        {stage==='finished' && rows.length>limit && <button className="mt-3 w-full rounded-lg border bg-white p-3 text-sm font-semibold" onClick={()=>setLimit(n=>n+12)}>Mostrar mais finalizados ({rows.length-limit})</button>}
      </section>;
    })}
  </div></>;
}

export function StudentRequests({ requests }) {
  return <aside className="mb-5 ml-auto w-full max-w-md rounded-xl border border-slate-200 bg-white">
    <details><summary className="cursor-pointer p-3 text-sm font-semibold">Meus pedidos ({requests.length}) · acompanhar</summary>
      <ul className="max-h-72 divide-y overflow-y-auto border-t">{[...requests].sort((a,b)=>(b.created_at || "").localeCompare(a.created_at || "")).map(r=><li key={r.id} className="p-3 text-sm">
        <div className="flex justify-between gap-3"><strong>{r.package_name}</strong><span className="shrink-0">{money(r.price_cents/100)}</span></div>
        <p className="mt-1 text-xs font-semibold text-slate-600">{requestLabel(r)}</p>
        {r.payment_method === "card" && <p className="text-xs">{r.installment_count}x no cartão</p>}
        {r.coupon_code && <p className="text-xs">Cupom {r.coupon_code} · desconto de {money(r.discount_cents/100)}</p>}
        {r.pricing_demo && <p className="text-xs text-amber-900">Valores fictícios para visualização</p>}
        {r.reason && <p className="mt-1 break-words text-xs">{r.reason}</p>}
      </li>)}</ul>
      {!requests.length && <p className="p-3 text-sm text-slate-500">Nenhuma solicitação por enquanto.</p>}
    </details>
  </aside>;
}
