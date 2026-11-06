import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ManualPayment } from './ManualPayment';
import { StudentWelcome } from './StudentWelcome';

const payment = entry => ({...entry, package_name:'Entrada da matrícula', price_cents:entry.amount_cents,
  payment_method:'cash', status:entry.status === 'confirmed' ? 'approved' : entry.status === 'cancelled' ? 'rejected' : 'pending'});
const errorText = error => error?.code === 'P0001' ? error.message : 'Não foi possível consultar ou salvar a entrada. Confira se a atualização de entrada foi aplicada no Supabase e tente novamente.';

function EntryNotice({entry,onClose,onPay}) {
  const dialog=useRef(null);
  useEffect(()=>{
    const el=dialog.current, previous=document.activeElement, overflow=document.body.style.overflow;
    el.showModal();document.body.style.overflow='hidden';
    return ()=>{el.close();document.body.style.overflow=overflow;previous?.focus();};
  },[]);
  return <dialog ref={dialog} aria-labelledby="entry-title" onCancel={e=>{e.preventDefault();onClose();}}
    className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border-0 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/70">
    <div className="flex items-start justify-between gap-3"><h2 id="entry-title" className="text-2xl font-bold">Valide sua matrícula na Habilita+</h2><button aria-label="Fechar aviso de entrada" onClick={onClose} className="rounded-lg px-3 py-2">×</button></div>
    <p className="mt-5 text-4xl font-extrabold text-green-800">R$ 29,90</p>
    <p className="mt-4">Sua entrada foi ativada pela equipe. Após a confirmação do pagamento, esse valor será abatido de um pacote, uma única vez.</p>
    <p className="mt-3 text-sm text-slate-600">Você pode continuar e pagar depois. A entrada não libera aulas ou agendamento. A equipe aplicará o abatimento antes de cobrar o saldo do pacote.</p>
    <button autoFocus className="btn btn-green mt-6 w-full" onClick={onPay}>Pagar entrada de R$ 29,90</button>
    <button className="btn btn-outline mt-3 w-full" onClick={onClose}>Continuar depois</button>
  </dialog>;
}

export function StudentEnrollmentEntry({student}) {
  const [entry,setEntry]=useState(null),[loaded,setLoaded]=useState(false),[dismissed,setDismissed]=useState(false),[pay,setPay]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    if(!student?.id)return;
    let alive=true;
    const load=async()=>{
      const result=await supabase.from('enrollment_entries').select('*').eq('student_id',student.id).maybeSingle();
      if(!alive)return;
      if(result.error){setError('Não foi possível consultar a entrada. Tente atualizar a página.');setLoaded(true);return;}
      setError('');setEntry(result.data);setLoaded(true);
      if(result.data?.status!=='pending')setPay(false);
    };
    load();window.addEventListener('focus',load);const timer=setInterval(load,15000);
    return ()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',load);};
  },[student?.id]);
  if(!loaded)return null;
  const pending=entry?.status==='pending' && student.active;
  return <>
    {error && <p role="status" className="m-4 text-sm">{error}</p>}
    {!entry && !error && <StudentWelcome/>}
    {pending && !dismissed && !pay && <EntryNotice entry={entry} onClose={()=>setDismissed(true)} onPay={()=>{setDismissed(true);setPay(true);}}/>}
    {pending && <aside aria-label="Entrada da matrícula" className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
      <strong>Entrada da matrícula: R$ 29,90 — aguardando confirmação.</strong>
      <p>Se já enviou o comprovante, aguarde a conferência da equipe. Não é necessário pagar novamente.</p>
      <button className="btn btn-outline mt-2" onClick={()=>{setDismissed(true);setPay(true);}}>Ver Pix e comprovante da entrada</button>
    </aside>}
    {entry?.status==='confirmed' && <p className="m-4 rounded-xl bg-green-50 p-4 text-sm text-green-900">{entry.applied_request_id ? 'Entrada confirmada: R$ 29,90 já abatidos do seu pedido.' : 'Entrada confirmada: você tem R$ 29,90 para abater de um pacote. A equipe aplicará antes de cobrar o saldo.'}</p>}
    {pending && pay && <ManualPayment request={payment(entry)} entry autoOpen onClose={()=>setPay(false)}/>}
  </>;
}

export function AdminEnrollmentEntry({student,requests=[],onChanged}) {
  const [entry,setEntry]=useState(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[reason,setReason]=useState(''),[checked,setChecked]=useState(false);
  async function load(){
    const result=await supabase.from('enrollment_entries').select('*').eq('student_id',student.id).maybeSingle();
    if(result.error)throw result.error;
    setEntry(result.data);setReady(true);
  }
  useEffect(()=>{load().catch(e=>setMessage(errorText(e)));},[student.id]);
  async function act(name,args,success){
    if(busy)return;setBusy(true);setMessage('');
    try{const {error}=await supabase.rpc(name,args);if(error)throw error;await load();setMessage(success);if(name==='admin_apply_enrollment_entry')await onChanged?.(success);}
    catch(e){setMessage(errorText(e));}finally{setBusy(false);}
  }
  return <section aria-label="Gerenciar entrada da matrícula" className="rounded-xl border p-4">
    <h3 className="font-bold">Entrada da matrícula · R$ 29,90</h3>
    <p className="mt-2 text-sm">Ative somente para este aluno. O aviso pode ser fechado e reaparece ao carregar a área. Confirmar a entrada não concede aulas.</p>
    <p className="my-3 font-semibold">{!ready?'Consultando…':entry?.status==='confirmed'?'Pagamento confirmado':entry?.status==='pending'?'Cobrança ativada — pendente':'Cobrança desativada'}</p>
    <fieldset disabled={busy || !ready || !student.active || student.deletion_pending || !!student.deleted_at} className="space-y-3">
      {entry?.status!=='confirmed' && <button className="btn btn-outline" onClick={()=>act('admin_set_enrollment_entry',{p_student:student.id,p_enabled:entry?.status!=='pending'},entry?.status==='pending'?'Cobrança desativada.':'Entrada ativada para este aluno.')}>
        {entry?.status==='pending'?'Desativar cobrança da entrada':'Ativar cobrança de R$ 29,90'}
      </button>}
      {entry && <ManualPayment request={payment(entry)} entry admin/>}
      {entry?.status==='pending' && <>
        <label className="block text-sm">Conferência do pagamento<input maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Identificação do recebimento conferido"/></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/>Conferi o recebimento de R$ 29,90 na conta.</label>
        <button className="btn btn-green" disabled={!checked || !reason.trim()} onClick={()=>act('admin_confirm_enrollment_entry',{p_student:student.id,p_reason:reason},'Entrada confirmada. Nenhuma aula foi liberada.')}>Confirmar pagamento da entrada</button>
      </>}
      {entry?.status==='confirmed' && (entry.applied_request_id ? <p>Entrada já abatida no pedido {requests.find(r=>r.id===entry.applied_request_id)?.package_name || entry.applied_request_id}.</p> : <>
        <p className="text-sm">Crédito disponível: R$ 29,90. Selecione um pedido pendente antes de cobrar o saldo. Para lançamento manual, crie o pedido como pagamento pendente primeiro.</p>
        {requests.filter(r=>r.status==='pending'&&!r.payment_confirmed_at).map(r=><button key={r.id} className="btn btn-outline block" onClick={()=>{
          if(window.confirm(`Abater R$ 29,90 do pedido ${r.package_name}? Atualize o valor enviado ao aluno antes de cobrar.`))act('admin_apply_enrollment_entry',{p_request:r.id},'Entrada abatida. Confira o novo saldo antes de cobrar o pacote.');
        }}>Abater entrada: {r.package_name}</button>)}
        {!requests.some(r=>r.status==='pending'&&!r.payment_confirmed_at) && <p className="text-sm">Nenhum pedido pendente. Crie um pedido para aplicar a entrada.</p>}
      </>)}
    </fieldset>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </section>;
}
