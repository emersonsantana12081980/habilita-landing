import React,{useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
export const TERMS_VERSION='2026-11-07';
export function TermsGate({onAccepted}){
 const [checked,setChecked]=useState(false),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState('');
 async function check(){
  setLoading(true);setMessage('');
  const {data,error}=await supabase.from('terms_acceptances').select('version').eq('version',TERMS_VERSION).limit(1);
  if(error)setMessage('Não foi possível consultar o aceite. Tente novamente ou fale com a equipe.');
  else if(data?.length)onAccepted();
  setLoading(false);
 }
 useEffect(()=>{check().catch(()=>{setLoading(false);setMessage('Não foi possível consultar o aceite. Tente novamente.');});},[]);
 async function accept(){
  if(!checked||busy)return;
  setBusy(true);setMessage('');
  try{const {error}=await supabase.rpc('accept_student_terms',{p_version:TERMS_VERSION,p_accepted:true});if(error)throw error;onAccepted();}
  catch{setMessage('Não foi possível registrar seu aceite. Tente novamente ou fale com a equipe.');}
  finally{setBusy(false);}
 }
 return <main className="container max-w-2xl! py-12"><section className="admin-card space-y-5">
  <h1 className="text-2xl font-bold">Termos e Condições</h1>
  {loading?<p role="status">Conferindo seu aceite…</p>:<>
   <p>Antes de continuar na área do aluno, leia os termos da Habilita+. Seu aceite será registrado com a versão e a data.</p>
   <a href="/termos" target="_blank" rel="noopener noreferrer" className="font-bold text-green-800 underline">Ler Termos e Condições — versão {TERMS_VERSION}</a>
   <label className="flex items-start gap-3"><input type="checkbox" checked={checked} disabled={busy} onChange={e=>setChecked(e.target.checked)}/>Li e aceito os Termos e Condições.</label>
   <button className="btn btn-green" disabled={!checked||busy} onClick={accept}>{busy?'Registrando…':'Aceitar e continuar'}</button>
  </>}
  {message&&<p role="alert">{message}</p>}
  <div className="flex flex-wrap gap-4"><a href="/" className="underline">Voltar ao site</a><button className="underline" onClick={()=>supabase.auth.signOut()}>Sair da conta</button></div>
 </section></main>;
}
