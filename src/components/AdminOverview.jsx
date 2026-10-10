import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const localDay = value => new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo"}).format(new Date(value));
const time = value => new Date(value).toLocaleTimeString("pt-BR",{timeZone:"America/Sao_Paulo",hour:"2-digit",minute:"2-digit"});

export function AdminOverview({data,onNavigate,onLesson}) {
  const day=localDay(new Date());
  const [slots,setSlots]=useState(null),[error,setError]=useState(false),[retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();let mounted=true;
    const timer=setTimeout(()=>controller.abort(),12000);
    setSlots(null);setError(false);
    Promise.all(["A","B"].map(category=>supabase.rpc("available_slots",{p_day:day,p_category:category}).abortSignal(controller.signal)))
      .then(results=>{if(results.some(r=>r.error))throw new Error();if(mounted)setSlots(results.map(r=>r.data?.length || 0));})
      .catch(()=>{if(mounted)setError(true);}).finally(()=>clearTimeout(timer));
    return ()=>{mounted=false;controller.abort();clearTimeout(timer);};
  },[day,retry]);
  const lessons=data.lessons.filter(l=>localDay(l.starts_at)===day && l.status!=="cancelled").sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
  const pending=data.requests.filter(r=>r.status==="pending");
  return <section aria-label="Resumo do administrador" className="space-y-5">
    <div><h2 className="text-2xl font-bold">Seu dia na Habilita+</h2><p className="text-sm text-slate-600">{day.split('-').reverse().join('/')} · Horário de Brasília</p></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["Aulas de hoje",lessons.length,"Agenda",`${lessons.filter(l=>l.status==='scheduled').length} agendadas · ${lessons.filter(l=>l.status==='completed').length} realizadas · ${lessons.filter(l=>l.status==='missed').length} faltas`],
        ["Pedidos pendentes",pending.length,"Pedidos",`${pending.filter(r=>r.review_started_at).length} em análise`],
        ["Alunos ativos",data.students.filter(s=>s.active).length,"Alunos","Consultar cadastros e fichas"],
      ].map(([title,count,target,note])=><button key={title} className="rounded-2xl border bg-white p-5 text-left shadow-sm" onClick={()=>onNavigate(target,day)}><span className="font-semibold">{title}</span><strong className="my-2 block text-3xl">{count}</strong><span className="text-xs text-slate-600">{note}</span></button>)}
      <div className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="font-semibold">Horários livres hoje</h3>{error?<><p role="status" className="my-2 text-sm">Não foi possível consultar as vagas.</p><button className="text-sm underline" onClick={()=>setRetry(n=>n+1)}>Tentar novamente</button></>:slots?<><strong className="my-2 block text-3xl">{slots[0]+slots[1]}</strong><p className="text-xs text-slate-600">Moto: {slots[0]} · Carro: {slots[1]}</p></>:<p className="my-3 text-sm" role="status">Consultando vagas…</p>}<button className="mt-3 text-sm font-semibold text-green-800 underline" onClick={()=>onNavigate("Agenda",day)}>Consultar agenda</button></div>
    </div>
    <p className="text-xs text-slate-500">Vagas representam opções de agendamento, sujeitas a crédito e confirmação. Opções podem compartilhar instrutor ou veículo.</p>
    <div className="rounded-2xl border bg-white p-5"><h3 className="mb-3 font-bold">Aulas do dia</h3><ul className="divide-y">{lessons.slice(0,8).map(l=><li key={l.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold">{time(l.starts_at)} · {data.students.find(s=>s.id===l.student_id)?.name || "Aluno"}</p><p className="text-sm text-slate-600">Categoria {l.category} · {{scheduled:"Agendada",completed:"Realizada",missed:"Falta"}[l.status]}</p></div><button className="rounded-lg border px-3 py-2 text-sm" onClick={()=>onLesson(l)}>Ver aula</button></li>)}</ul>{!lessons.length && <p className="text-sm text-slate-600">Nenhuma aula não cancelada para hoje.</p>}<button className="mt-4 text-sm font-semibold text-green-800 underline" onClick={()=>onNavigate("Agenda",day)}>Abrir agenda completa</button></div>
  </section>;
}
