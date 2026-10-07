import React, { useEffect, useRef, useState } from "react";
import { money } from "../store-data";
import { requestLabel } from "./RequestBoard";

const date = value => value ? new Date(value).toLocaleString("pt-BR", {timeZone:"America/Sao_Paulo",dateStyle:"short",timeStyle:"short"}) : "Data não registrada";
const labels = {scheduled:"Agendada",completed:"Realizada",missed:"Falta",cancelled:"Cancelada"};

export function StudentRecord({student, data, onClose, onEdit, onStatus}) {
  const dialog=useRef(null);
  const [tab,setTab]=useState("Resumo");
  useEffect(()=>{
    const previous=document.activeElement, overflow=document.body.style.overflow;
    const element=dialog.current;
    element.showModal();document.body.style.overflow="hidden";
    return ()=>{element.close();document.body.style.overflow=overflow;previous?.focus();};
  },[]);
  const requests=data.requests.filter(r=>r.student_id===student.id);
  const grants=data.credits.filter(r=>r.student_id===student.id);
  const lessons=data.lessons.filter(r=>r.student_id===student.id);
  const totals=["A","B"].map(category=>{
    const received=grants.reduce((n,g)=>n+(category==="A"?g.lessons_a:g.lessons_b),0);
    const reserved=lessons.filter(l=>l.category===category && l.status==="scheduled").length;
    const used=lessons.filter(l=>l.category===category && ["completed","missed"].includes(l.status)).length;
    return {category,received,reserved,used,balance:received-reserved-used};
  });
  const name=(items,id)=>items.find(i=>i.id===id)?.name || "Não informado";
  return <dialog ref={dialog} aria-labelledby="student-record-title" onCancel={e=>{e.preventDefault();onClose();}} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border-0 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-950/50">
    <div className="flex items-start justify-between gap-3"><div><h2 id="student-record-title" className="text-xl font-bold">Ficha do aluno</h2><p className="mt-1 break-words font-semibold">{student.name}</p></div><button onClick={onClose} className="rounded-lg border px-3 py-2">Fechar ficha</button></div>
    <p className="mt-2 text-sm text-slate-600">{student.phone || "Sem WhatsApp"} · Categoria {student.category} · {student.active?"Ativo":"Arquivado"}</p>
    <nav aria-label="Seções da ficha" className="my-5 flex flex-wrap gap-2">{["Resumo","Pedidos","Aulas","Extrato"].map(t=><button key={t} onClick={()=>setTab(t)} aria-current={tab===t?"page":undefined} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab===t?"bg-slate-900 text-white":"bg-slate-100"}`}>{t}</button>)}</nav>
    {tab==="Resumo" && <>
      <div className="grid gap-3 sm:grid-cols-2">{totals.map(t=><section key={t.category} aria-label={`Saldo ${t.category}`} className="rounded-xl border p-4"><h3 className="font-bold">{t.category==="A"?"Moto":"Carro"}</h3><p className="my-2 text-3xl font-bold">{t.balance} <span className="text-sm font-normal">disponíveis</span></p><p className="text-sm text-slate-600">Recebidos: {t.received} · Reservados: {t.reserved} · Utilizados: {t.used}</p></section>)}</div>
      <p className="mt-3 text-sm text-slate-600">Aulas realizadas e faltas utilizam crédito. Aulas canceladas não descontam do saldo. Os créditos são agrupados por categoria, sem atribuir consumo a um pacote específico.</p>
      <div className="mt-5 flex flex-wrap gap-3"><button className="btn btn-green" onClick={()=>onEdit(student)}>Editar aluno</button><button className="rounded-xl border px-4 py-3" onClick={()=>{if(window.confirm(student.active?"Arquivar este aluno? Créditos, histórico e aulas marcadas serão mantidos; novos agendamentos ficarão bloqueados.":"Restaurar este cadastro como ativo?"))onStatus(student,!student.active);}}>{student.active?"Enviar ao arquivo morto":"Restaurar cadastro"}</button></div>
    </>}
    {tab==="Pedidos" && <ul className="divide-y">{[...requests].sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||"")).map(r=><li key={r.id} className="py-3"><h3 className="font-semibold">{r.package_name}</h3><p className="text-sm">{requestLabel(r)} · {money(r.price_cents/100)}</p><p className="text-xs text-slate-500">{date(r.created_at)} · {r.lessons_a} aulas de moto · {r.lessons_b} aulas de carro</p>{r.reason && <p className="mt-1 break-words text-sm">{r.reason}</p>}</li>)}{!requests.length && <li>Nenhum pedido registrado.</li>}</ul>}
    {tab==="Aulas" && <ul className="divide-y">{[...lessons].sort((a,b)=>b.starts_at.localeCompare(a.starts_at)).map(l=><li key={l.id} className="py-3"><p className="font-semibold">{date(l.starts_at)} · {labels[l.status] || l.status}</p><p className="text-sm">Categoria {l.category} · {name(data.instructors,l.instructor_id)} · {name(data.vehicles,l.vehicle_id)}</p></li>)}{!lessons.length && <li>Nenhuma aula registrada.</li>}</ul>}
    {tab==="Extrato" && <>
      <p className="mb-4 text-sm text-slate-600">Conferência do saldo atual. Datas das entradas são de liberação; datas das aulas são as agendadas. Não é uma linha do tempo de alterações nem um comprovante de pagamento.</p>
      <h3 className="font-bold">Créditos recebidos</h3><ul className="mb-5 divide-y">{[...grants].sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||"")).map(g=><li key={g.id} className="py-3 text-sm"><p className="font-semibold">{requests.find(r=>r.id===g.request_id)?.package_name || "Liberação de créditos"}</p><p>+{g.lessons_a} moto · +{g.lessons_b} carro</p><p className="text-xs text-slate-500">{date(g.created_at)}</p>{g.reason && <p className="break-words">{g.reason}</p>}</li>)}{!grants.length && <li className="py-3 text-sm">Nenhum crédito recebido.</li>}</ul>
      <h3 className="font-bold">Reservas e utilização</h3><ul className="divide-y">{[...lessons].sort((a,b)=>b.starts_at.localeCompare(a.starts_at)).map(l=><li key={l.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{date(l.starts_at)} · {l.category} · {labels[l.status]}</span><strong>{l.status==="cancelled"?"0 · cancelada, sem desconto":l.status==="scheduled"?"−1 reservado":"−1 utilizado"}</strong></li>)}{!lessons.length && <li className="py-3 text-sm">Nenhuma movimentação por aula.</li>}</ul>
      <p className="mt-4 rounded-xl bg-green-50 p-3 font-semibold">Saldo atual: moto {totals[0].balance} · carro {totals[1].balance}</p>
    </>}
  </dialog>;
}
