import React,{useRef,useState} from 'react';
import {supabase} from '../lib/supabase';
export function LadvUpload({student,category,editable,onSaved}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[replace,setReplace]=useState(false),[url,setUrl]=useState('');
 const uploaded=useRef(null),lock=useRef(false),doc=student.ladv_documents?.[category];
 const label=category==='A'?'Moto (A)':'Carro (B)';
 return <section className="mt-4 rounded-xl border p-4" aria-label={`Documento LADV ${category}`}>
 <h4 className="font-bold">LADV · {label}</h4>
 {doc?.path&&<><p className="mt-2 text-green-800">Documento enviado pelo aluno; autenticidade não verificada automaticamente.</p><button type="button" disabled={busy} className="mt-2 underline" onClick={async()=>{
  setBusy(true);setMessage('');setUrl('');try{const {data,error}=await supabase.storage.from('student-ladv').createSignedUrl(doc.path,60);if(error)throw error;setUrl(data.signedUrl);}catch{setMessage('Não foi possível abrir o documento.');}finally{setBusy(false);}
 }}>Abrir LADV de {label}</button>{editable&&<button type="button" disabled={busy} className="ml-4 underline" onClick={()=>setReplace(!replace)}>{replace?'Cancelar substituição':'Substituir documento'}</button>}</>}
 {editable&&(!doc?.path||replace)&&<form className="mt-3 space-y-3" onSubmit={async e=>{
  e.preventDefault();if(lock.current)return;
  const fields=new FormData(e.currentTarget),file=fields.get('document');
  const ext={'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png'}[file?.type];
  if(!ext||!file.size||file.size>5242880){setMessage('Selecione um PDF, JPG ou PNG de até 5 MB.');return;}
  if(!fields.has('truth'))return;
  lock.current=true;setBusy(true);setMessage('');
  try{
   const identity=`${file.name}|${file.size}|${file.lastModified}`;
   let path=uploaded.current?.identity===identity?uploaded.current.path:null;
   if(!path){path=`${student.id}/${category}/${crypto.randomUUID()}.${ext}`;const {error}=await supabase.storage.from('student-ladv').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;uploaded.current={identity,path};}
   const {error}=await supabase.rpc('submit_student_ladv',{p_student:student.id,p_category:category,p_path:path,p_truth:true});if(error)throw error;
   await onSaved();setReplace(false);setMessage('LADV enviada e declaração registrada.');
  }catch(error){setMessage(error.code==='P0001'?error.message:'Não foi possível concluir o envio. Tente novamente ou peça à equipe para verificar a ativação da trilha.');}
  finally{lock.current=false;setBusy(false);}
 }}>
  <label className="block">Arquivo LADV de {label}<input name="document" type="file" accept="application/pdf,image/jpeg,image/png" required disabled={busy}/></label>
  <label className="flex items-start gap-2"><input type="checkbox" name="truth" required disabled={busy}/>Declaro que esta LADV é minha, está válida para a categoria {category} e que as informações são verdadeiras.</label>
  <button className="btn btn-green" disabled={busy}>{busy?'Enviando…':`Enviar LADV de ${label}`}</button>
 </form>}
 {url&&<a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 block font-bold underline">Visualizar documento · link válido por 60 segundos</a>}
 {!editable&&!doc?.path&&<p className="mt-2">Documento ainda não enviado.</p>}
 {message&&<p className="mt-3 text-sm" role="status">{message}</p>}
 </section>;
}
