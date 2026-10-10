import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { normalizePhone } from "../store-data";

const fields = [
  ["lessonLocation","Local e ponto de encontro"], ["serviceRegion","Região atendida"],
  ["cancellationPolicy","Informações de cancelamento"], ["retestTerms","Condições gerais do reteste"],
  ["privacyUrl","Link da política de privacidade"], ["termsUrl","Link dos termos de uso"],
  ["instagramUrl","Link do Instagram"], ["mapsUrl","Link da localização"],
  ["legalName","Nome institucional"], ["cnpj","CNPJ (se aplicável)"],
];
export function SiteSettings() {
  const [form,setForm]=useState(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  async function load() {
    setMessage("");
    const {data,error}=await supabase.from("site_settings").select("*").single();
    if(error){setMessage("Não foi possível carregar as configurações.");return;}
    setForm({...data,commercial_info:data.commercial_info || {}});
  }
  useEffect(()=>{load();},[]);
  const change=(key,value)=>setForm(f=>({...f,commercial_info:{...f.commercial_info,[key]:value}}));
  if(!form)return <section><p role="status">{message || "Carregando configurações…"}</p>{message && <button onClick={load}>Tentar novamente</button>}</section>;
  return <form className="admin-card grid gap-4 sm:grid-cols-2" onSubmit={async e=>{
    e.preventDefault();if(busy)return;setBusy(true);setMessage("");
    try {
      const phone=normalizePhone(form.whatsapp);
      if(form.whatsapp.trim() && !phone)throw new Error("Informe um WhatsApp válido com DDD.");
      const info={};
      for(const [key] of fields){const value=String(form.commercial_info[key] || "").trim();
        if(key.endsWith('Url') && value){let url;try{url=new URL(value);}catch{throw new Error("Use links completos iniciados por https://.");}if(url.protocol!=="https:" || url.username || url.password)throw new Error("Use links HTTPS sem credenciais.");}
        info[key]=value || null;
      }
      const minutes=form.commercial_info.lessonMinutes;
      info.lessonMinutes=minutes==null || minutes==="" ? null : Number(minutes);
      if(info.lessonMinutes!==null && (!Number.isInteger(info.lessonMinutes) || info.lessonMinutes<15 || info.lessonMinutes>180))throw new Error("Informe duração entre 15 e 180 minutos.");
      if(!form.city.trim())throw new Error("Informe a cidade.");
      const {error}=await supabase.from("site_settings").update({city:form.city.trim(),whatsapp:phone,ai_enabled:form.ai_enabled,commercial_info:info}).eq("id",true).select("id").single();
      if(error)throw new Error(error.code==='PGRST204' || error.code==='42703'?"Aplique o SQL de configurações comerciais no Supabase antes de salvar.":"Não foi possível salvar. Confira a conexão e tente novamente.");
      setMessage("Configurações salvas. Reabra ou atualize a página pública para conferir.");
    }catch(error){setMessage(error.message);}finally{setBusy(false);}
  }}>
    <h2 className="text-2xl font-bold sm:col-span-2">Configurações do site</h2>
    <p className="text-sm text-slate-600 sm:col-span-2">Estes dados são públicos. Preencha apenas informações confirmadas. Campos opcionais vazios continuam como informação a confirmar. Regras efetivas de agendamento continuam na aba Regras; reteste específico do pacote fica no Catálogo.</p>
    <label>Cidade<input required maxLength={120} value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/></label>
    <label>WhatsApp de atendimento<input type="tel" value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))}/></label>
    <label>Duração padrão da aula (minutos)<input type="number" min="15" max="180" value={form.commercial_info.lessonMinutes ?? ""} onChange={e=>change('lessonMinutes',e.target.value)}/></label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={form.ai_enabled} onChange={e=>setForm(f=>({...f,ai_enabled:e.target.checked}))}/>Exibir agente de atendimento</label>
    {fields.map(([key,label])=><label key={key}>{label}{['cancellationPolicy','retestTerms','lessonLocation','serviceRegion'].includes(key)?<textarea maxLength={2000} rows={3} value={form.commercial_info[key] || ""} onChange={e=>change(key,e.target.value)}/>:<input type={key.endsWith('Url')?'url':'text'} maxLength={500} value={form.commercial_info[key] || ""} onChange={e=>change(key,e.target.value)}/>}</label>)}
    {message && <p role="status" className="sm:col-span-2">{message}</p>}
    <button disabled={busy} className="btn btn-green sm:col-span-2">{busy?"Salvando…":"Salvar configurações do site"}</button>
  </form>;
}
