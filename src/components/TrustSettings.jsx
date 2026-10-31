import React, {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
import {instructorEvidence} from '../lib/trust-content';
export function TrustSettings({info,change}) {
  const [instructors,setInstructors]=useState([]);
  useEffect(()=>{let live=true;supabase.from('instructors').select('id,name,bio,photo_url').then(({data,error})=>{if(live&&!error)setInstructors(data||[]);});return()=>{live=false;};},[]);
  return <fieldset className="sm:col-span-2 space-y-5 rounded-xl border p-4">
    <legend className="font-bold">Identificação e conteúdo autorizado</legend>
    <p className="text-sm">Marque somente após revisão pelo responsável. Isso registra sua declaração; não representa uma revisão jurídica ou verificação externa.</p>
    <label className="flex gap-2"><input type="checkbox" checked={!!info.legalName && info.identityReviewed===`${info.legalName}|${info.cnpj||''}`} onChange={e=>change('identityReviewed',e.target.checked?`${info.legalName}|${info.cnpj||''}`:null)}/>Conferi o nome institucional e a identificação comercial.</label>
    {[['privacyUrl','privacyReviewedUrl','Revisei e aprovo a política de privacidade desse link'],['termsUrl','termsReviewedUrl','Revisei e aprovo os termos desse link']].map(([key,approval,label])=><label key={key} className="flex gap-2"><input type="checkbox" disabled={!info[key]} checked={!!info[key]&&info[approval]===info[key]} onChange={e=>change(approval,e.target.checked?info[key]:null)}/>{label}</label>)}
    <h3 className="font-bold">Perfis dos instrutores</h3>
    {instructors.map(i=><label key={i.id} className="flex items-start gap-2"><input type="checkbox" checked={(info.approvedInstructorProfiles||[]).includes(instructorEvidence(i))} onChange={e=>change('approvedInstructorProfiles',e.target.checked?[...(info.approvedInstructorProfiles||[]),instructorEvidence(i)]:(info.approvedInstructorProfiles||[]).filter(v=>v!==instructorEvidence(i)))}/>Confirmo que a apresentação de {i.name} é comprovável e que sua foto é real e autorizada. Alterar a foto ou apresentação exige nova confirmação.</label>)}
    <h3 className="font-bold">Fotos reais de veículos e aulas</h3>
    {(info.photos||[]).map((p,index)=><div key={p.id} className="grid gap-3 rounded-lg bg-slate-50 p-3">
      {[['url','Link HTTPS da foto real'],['caption','Descrição da foto']].map(([key,label])=><label key={key}>{label}<input type={key==='url'?'url':'text'} maxLength={1000} value={p[key]||''} onChange={e=>change('photos',info.photos.map((v,n)=>n===index?{...v,[key]:e.target.value,authorized:false,real:false}:v))}/></label>)}
      <label><input type="checkbox" checked={p.real===true&&p.authorized===true} onChange={e=>change('photos',info.photos.map((v,n)=>n===index?{...v,real:e.target.checked,authorized:e.target.checked}:v))}/>Foto real; tenho autorização das pessoas retratadas para publicá-la.</label>
      <button type="button" onClick={()=>change('photos',info.photos.filter((_,n)=>n!==index))}>Remover foto da página</button>
    </div>)}
    <button type="button" className="btn btn-outline" disabled={(info.photos||[]).length>=6} onClick={()=>change('photos',[...(info.photos||[]),{id:crypto.randomUUID(),url:'',caption:'',real:false,authorized:false}])}>Adicionar foto real</button>
    <h3 className="font-bold">Avaliações reais</h3>
    {(info.testimonials||[]).map((t,index)=><div key={t.id} className="grid gap-3 rounded-lg bg-slate-50 p-3">
      {[['name','Nome autorizado para exibição'],['text','Avaliação do aluno'],['source','Origem da avaliação (ex.: mensagem recebida em data confirmada)']].map(([key,label])=><label key={key}>{label}<textarea maxLength={1000} value={t[key]||''} onChange={e=>change('testimonials',info.testimonials.map((v,n)=>n===index?{...v,[key]:e.target.value,authorized:false,verified:false}:v))}/></label>)}
      <label><input type="checkbox" checked={t.authorized===true&&t.verified===true} onChange={e=>change('testimonials',info.testimonials.map((v,n)=>n===index?{...v,authorized:e.target.checked,verified:e.target.checked,active:e.target.checked}:v))}/>Conferi que este relato é real e tenho autorização para publicar o texto e o nome.</label>
      <button type="button" onClick={()=>change('testimonials',info.testimonials.filter((_,n)=>n!==index))}>Remover avaliação da página</button>
    </div>)}
    <p className="text-sm">Esses dados são públicos: não inclua telefone, documentos, dados sensíveis ou conversas privadas na origem da avaliação.</p>
    <button type="button" className="btn btn-outline" disabled={(info.testimonials||[]).length>=6} onClick={()=>change('testimonials',[...(info.testimonials||[]),{id:crypto.randomUUID(),name:'',text:'',source:'',authorized:false,verified:false,active:false}])}>Adicionar avaliação real</button>
  </fieldset>;
}
