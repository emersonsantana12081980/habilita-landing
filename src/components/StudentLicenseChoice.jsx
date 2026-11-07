import React, {useRef, useState} from 'react';
import {supabase} from '../lib/supabase';

export function StudentLicenseChoice({student, onSaved}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const lock=useRef(false);
 async function update(licensed){
  if(lock.current)return;
  lock.current=true;setBusy(true);setMessage('');
  try{
   const {error}=await supabase.rpc('update_student_journey',{p_student:student.id,p_steps:student.journey_steps||{},p_licensed:licensed});
   if(error)throw error;
   await onSaved();
   setMessage('Objetivo atualizado.');
  }catch{setMessage('Não foi possível atualizar. Tente novamente.');}
  finally{lock.current=false;setBusy(false);}
 }
 return <section className="admin-card space-y-3" aria-label="Seu objetivo com as aulas">
  <h2 className="text-xl font-bold">Seu objetivo com as aulas</h2>
  <label className="flex items-start gap-2"><input type="checkbox" disabled={busy} checked={!!student.licensed_driver} onChange={e=>update(e.target.checked)}/>Já sou habilitado e quero aulas de reforço.</label>
  <p className="text-sm text-slate-600">Para primeira habilitação, deixe desmarcado e siga Minha jornada CNH. Para reforço, o agendamento depende do saldo de aulas e dos horários disponíveis.</p>
  {message&&<p role="status">{message}</p>}
 </section>;
}
