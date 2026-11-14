import React, { useState } from 'react';
import { experienceLevels, planCategories } from '../data/experience-plans';
import { StudentPackageOffer } from './StudentPackageOffer';

export function StudentPackageCatalog({packages,requests,onRequested,initialCategory='',initialExperience='',licensed=false}) {
  const [category,setCategory]=useState(initialCategory);
  const [experience,setExperience]=useState(initialExperience);
  const visible=packages.filter(p=>(!category || p.category===category) && (licensed || !experience || p.experience_level===experience));
  const button=active=>`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold ${active?'border-slate-900 bg-slate-900 text-white':'border-slate-200 bg-white text-slate-900'}`;
  return <section aria-label="Escolher pacotes por experiência" className="space-y-5">
    <div><h3 className="text-xl font-bold">Encontre seu pacote de aulas</h3><p className="mt-2 text-sm text-slate-600">Escolha a categoria e seu momento. Compare os valores antes de continuar para pagamento.</p></div>
    <fieldset><legend className="mb-2 font-semibold">1. Qual categoria você quer praticar?</legend><div className="flex flex-wrap gap-2">
      {[{id:'',label:'Todas as categorias'},...planCategories].map(c=><button key={c.id} type="button" className={button(category===c.id)} aria-pressed={category===c.id} onClick={()=>setCategory(c.id)}>{c.label}</button>)}
    </div></fieldset>
    {!licensed&&<fieldset><legend className="mb-2 font-semibold">2. Qual é sua experiência?</legend><div className="flex flex-wrap gap-2">
      {[{id:'',title:'Todos os tipos'},...experienceLevels].map(e=><button key={e.id} type="button" className={button(experience===e.id)} aria-pressed={experience===e.id} onClick={()=>setExperience(e.id)}>{e.title}</button>)}
    </div></fieldset>}
    <p role="status" className="text-sm text-slate-600">{visible.length} opção(ões) disponível(is). Cadastro não gera cobrança nem libera créditos.</p>
    <div className="space-y-3">{visible.map(pack=><StudentPackageOffer key={pack.id} pack={pack} pending={requests.some(r=>r.package_id===pack.id&&r.status==='pending')} onRequested={onRequested}/>)}</div>
    {!visible.length && <div className="rounded-xl border bg-white p-5"><p>Nenhum pacote cadastrado para esta combinação. Escolha outra opção ou fale com a equipe.</p><button className="mt-3 font-semibold text-green-800 underline" onClick={()=>{setCategory('');setExperience('');}}>Limpar filtros</button></div>}
  </section>;
}
