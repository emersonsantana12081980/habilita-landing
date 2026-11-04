import React,{useEffect,useRef,useState} from 'react';
import {ChevronDown,CheckCircle2,LockKeyhole} from 'lucide-react';
import {supabase} from '../lib/supabase';
import {cnhTrail,cnhSource} from '../data/cnh-trail';
import {journeyCategories,onboardingReady,hasLadvDocument,completedPractice} from '../lib/student-journey';
import {LadvUpload} from './LadvUpload';

export function StudentJourney({student={},lessons=[],compact=false,onDetails,onSaved}) {
 const categories=journeyCategories(student);
 const done=key=>key==='ladv'?categories.every(cat=>hasLadvDocument(student,cat)):Boolean(student.onboarding_steps?.[key]);
 const next=cnhTrail.find(step=>!done(step.key))?.key||'toxicology';
 const [expanded,setExpanded]=useState(next),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const lock=useRef(false);
 useEffect(()=>setExpanded(next),[next]);
 const editable=!compact&&Boolean(onSaved), configured=Object.hasOwn(student,'onboarding_steps');
 async function save(operation){if(lock.current)return;lock.current=true;setBusy(true);setMessage('');try{const {error}=await operation();if(error)throw error;await onSaved?.();}catch(error){setMessage(error.code==='P0001'?error.message:'Não foi possível salvar. Peça à equipe para conferir a ativação da trilha no Supabase.');}finally{lock.current=false;setBusy(false);}}
 return <section className="student-panel" aria-label="Minha jornada CNH">
  <div className="student-panel-title"><h2>Minha jornada CNH</h2>{onDetails&&<button onClick={onDetails}>Continuar minha jornada</button>}</div>
  <p className="student-muted">Abra cada etapa pela seta. Declare a conclusão para avançar. As declarações são suas e não substituem os registros oficiais do Detran.</p>
  {!compact&&<p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">Na primeira habilitação, siga a jornada até emitir e enviar a LADV das categorias escolhidas. Para agendar aulas práticas, a equipe precisa confirmar o pagamento e liberar seu saldo; escolha então um horário disponível.</p>}
  {editable&&!configured&&<p role="alert" className="mt-3">A trilha ainda precisa ser ativada pela equipe. Fale conosco pelo WhatsApp.</p>}
  {editable&&<label className="my-4 flex items-start gap-2 text-sm"><input type="checkbox" disabled={busy} checked={!!student.licensed_driver} onChange={e=>save(()=>supabase.rpc('update_student_journey',{p_student:student.id,p_steps:student.journey_steps||{},p_licensed:e.target.checked}))}/>Já sou habilitado e quero aulas de reforço.</label>}
  {student.licensed_driver?<p className="my-4 text-green-800">Aulas de reforço: a trilha da primeira habilitação é dispensada. O agendamento depende do saldo e dos horários disponíveis.</p>:<>
  <p className="my-4 text-sm font-semibold">{cnhTrail.filter(step=>done(step.key)).length} de {cnhTrail.length} etapas informadas</p>
  <ol className="space-y-3">{cnhTrail.map((step,index)=>{
   const complete=done(step.key), available=cnhTrail.slice(0,index).every(previous=>done(previous.key));
   const isOpen=!compact&&expanded===step.key;
   return <li key={step.key} className="overflow-hidden rounded-xl border border-slate-200">
    <h3><button type="button" className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={isOpen} aria-controls={`trail-${step.key}`} onClick={()=>compact?onDetails?.():setExpanded(isOpen?'':step.key)}>
     <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${complete?'bg-green-100 text-green-800':'bg-slate-100'}`}>{complete?<CheckCircle2 size={19}/>:index+1}</span>
     <span className="flex-1 font-bold">{step.title}<small className="mt-1 block font-normal text-slate-500">{complete?'Declarado pelo aluno':available?'Seu próximo passo':'Conclua a etapa anterior para avançar'}</small></span>
     {!available&&!complete&&<LockKeyhole size={16}/>}<ChevronDown size={20} className={isOpen?'rotate-180':''}/>
    </button></h3>
    <div id={`trail-${step.key}`} hidden={!isOpen} className="space-y-3 border-t p-4 text-sm leading-6">
     {step.text.map(text=><p key={text}>{text}</p>)}
     {step.action&&<a className="btn btn-green" href={step.action.url} target="_blank" rel="noopener noreferrer">{step.action.label} ↗</a>}
     {step.links?.map(([label,url])=><a className="block font-semibold text-green-800 underline" key={url} href={url} target="_blank" rel="noopener noreferrer">{label} ↗</a>)}
     {step.key==='ladv'&&categories.map(category=><LadvUpload key={category} student={student} category={category} editable={editable&&configured&&available&&onboardingReady(student)} onSaved={onSaved}/>)}
     {step.key==='practice'&&categories.map(category=><p key={category}>{category==='A'?'Moto':'Carro'}: {completedPractice(lessons,category)} aulas realizadas na Habilita+. Confira a carga horária com seu instrutor.</p>)}
     {step.key==='practical_exam'&&categories.map(category=><div key={category} className="rounded-lg bg-slate-50 p-3"><p>{category==='A'?'Moto':'Carro'}: exame {student.practical_exam_dates?.[category]||'ainda não informado'}</p>{editable&&available&&<form onSubmit={e=>{e.preventDefault();const date=new FormData(e.currentTarget).get('exam_date');save(()=>supabase.rpc('set_student_exam_date',{p_student:student.id,p_category:category,p_date:date||null}));}}><label>Data do exame de {category==='A'?'moto':'carro'}<input type="date" name="exam_date" defaultValue={student.practical_exam_dates?.[category]||''} disabled={busy}/></label><button className="btn btn-outline mt-2" disabled={busy}>Salvar data do exame</button></form>}</div>)}
     {step.declaration&&editable&&!complete&&<form key={step.key} className="space-y-3" onSubmit={e=>{e.preventDefault();if(!available||!configured||!new FormData(e.currentTarget).has('truth'))return;save(()=>supabase.rpc('complete_student_onboarding_step',{p_student:student.id,p_step:step.key,p_truth:true}));}}>
      <label className="flex items-start gap-2"><input type="checkbox" name="truth" required disabled={!available||!configured||busy}/>{step.declaration} Confirmo que esta informação é verdadeira.</label>
      <button className="btn btn-green" disabled={!available||!configured||busy}>{busy?'Salvando…':'Declarar conclusão e continuar'}</button>
     </form>}
     {complete&&<p className="font-semibold text-green-800">{step.key==='ladv'?'Documento enviado pelo aluno.':'Conclusão declarada pelo aluno.'}</p>}
    </div>
   </li>;
  })}</ol>
  </>}
  {compact&&categories.some(category=>hasLadvDocument(student,category))&&categories.map(category=>student.ladv_documents?.[category]?.path&&<LadvUpload key={category} student={student} category={category} editable={false}/>)}
  {message&&<p role="status" className="mt-4">{message}</p>}
  <a href={cnhSource} target="_blank" rel="noopener noreferrer" className="mt-5 block text-xs text-green-800 underline">Fonte: Detran-SP / Poupatempo · valores e orientações conferidos em 03/11/2026. Confira as taxas no canal oficial antes de pagar.</a>
 </section>;
}
