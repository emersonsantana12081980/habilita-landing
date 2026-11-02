import React, {useEffect,useRef,useState} from 'react';
import {supabase} from '../lib/supabase';
import {money} from '../store-data';

export function AdminStudentClasses({student,onSaved,onBusy}) {
 const [packages,setPackages]=useState([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const [form,setForm]=useState({type:'custom',packageId:'',name:'Aulas avulsas',a:0,b:1,total:'',method:'cash',installments:1,paid:'pending',reason:'',checked:false});
 const operation=useRef(crypto.randomUUID()),lock=useRef(false);
 useEffect(()=>{let active=true;supabase.from('packages').select('id,name,lessons_a,lessons_b,price_cents,card_total_cents,card_installments').eq('active',true).is('deleted_at',null).then(({data,error})=>{if(active){if(error)setMessage('Não foi possível carregar os pacotes. Você pode cadastrar aulas manualmente.');else setPackages(data||[]);}});return()=>{active=false;};},[]);
 const change=(key,value)=>setForm(f=>({...f,[key]:value}));
 const pack=packages.find(p=>p.id===form.packageId);
 const a=form.type==='package'?pack?.lessons_a||0:Number(form.a), b=form.type==='package'?pack?.lessons_b||0:Number(form.b);
 return <form className="space-y-4 rounded-xl border p-4" onSubmit={async e=>{
  e.preventDefault();if(lock.current)return;
  const cents=Math.round(Number(form.total)*100);
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a+b<1||a>1000||b>1000||!Number.isSafeInteger(cents)||cents<1){setMessage('Informe a quantidade de aulas e um valor total válido.');return;}
  if(form.type==='package'&&!pack){setMessage('Selecione um pacote.');return;}
  if(form.paid==='paid'&&!form.checked){setMessage('Confirme que conferiu o pagamento.');return;}
  lock.current=true;setBusy(true);onBusy?.(true);setMessage('');
  try {
   const {error}=await supabase.rpc('admin_add_student_classes',{p_operation:operation.current,p_student:student.id,p_package:form.type==='package'?pack.id:null,p_name:form.name,p_lessons_a:a,p_lessons_b:b,p_total:cents,p_method:form.method,p_installments:form.method==='cash'?1:Number(form.installments),p_paid:form.paid==='paid',p_reason:form.reason.trim()});
   if(error)throw error;
   await onSaved(form.paid==='paid'?'Cadastro manual concluído: pagamento confirmado e aulas liberadas.':'Cadastro manual concluído: pagamento pendente. Confirme em Pedidos para liberar as aulas.');
  }catch(error){setMessage(error.code==='PGRST202'?'Execute o SQL adicionar-aulas-manualmente.sql no Supabase para ativar esta opção.':error.code==='23505'?'Já existe um lançamento pendente desse pacote para o aluno. Confira em Pedidos.':error.code==='P0001'?error.message:'Não foi possível confirmar o resultado. Tente novamente sem alterar os dados; a repetição não duplica o lançamento.');}
  finally{lock.current=false;setBusy(false);onBusy?.(false);}
 }}>
 <h3 className="text-lg font-bold">Adicionar pacote ou aulas</h3>
 <p className="text-sm">Cadastre para {student.name}, sem solicitação do aluno.</p>
 <fieldset disabled={busy||!student.active} className="grid gap-4 sm:grid-cols-2">
  <label>O que adicionar<select value={form.type} onChange={e=>change('type',e.target.value)}><option value="custom">Aulas avulsas / quantidade manual</option><option value="package">Pacote cadastrado</option></select></label>
  {form.type==='package'?<label>Pacote<select required value={form.packageId} onChange={e=>{const p=packages.find(v=>v.id===e.target.value);setForm(f=>({...f,packageId:e.target.value,total:p?((f.method==='card'?p.card_total_cents:p.price_cents)||p.price_cents)/100:'',checked:false}));}}><option value="">Selecione</option>{packages.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>:<>
   <label>Descrição<input required maxLength={150} value={form.name} onChange={e=>change('name',e.target.value)}/></label>
   <label>Quantidade de aulas de carro<input type="number" min="0" max="1000" step="1" required value={form.b} onChange={e=>change('b',e.target.value)}/></label>
   <label>Quantidade de aulas de moto<input type="number" min="0" max="1000" step="1" required value={form.a} onChange={e=>change('a',e.target.value)}/></label>
  </>}
  <label>Forma de pagamento<select value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value,installments:1,checked:false}))}><option value="cash">Pix à vista</option><option value="card">Cartão de crédito</option></select></label>
  <label>Valor total combinado (R$)<input required type="number" min="0.01" max="1000000" step="0.01" value={form.total} onChange={e=>setForm(f=>({...f,total:e.target.value,checked:false}))}/></label>
  {form.method==='card'&&<label>Parcelas<select value={form.installments} onChange={e=>change('installments',Number(e.target.value))}>{Array.from({length:12},(_,n)=><option key={n+1} value={n+1}>{n+1}x</option>)}</select></label>}
  <label>Status do pagamento<select value={form.paid} onChange={e=>setForm(f=>({...f,paid:e.target.value,checked:false}))}><option value="pending">Pendente</option><option value="paid">Confirmado</option></select></label>
  <label className="sm:col-span-2">Motivo / observação<textarea required maxLength={500} value={form.reason} onChange={e=>change('reason',e.target.value)}/></label>
  <p className="sm:col-span-2 rounded-lg bg-slate-50 p-3">{b} aulas de carro · {a} aulas de moto · Total: {money(Number(form.total)||0)}. {form.paid==='paid'?'As aulas entrarão no saldo ao salvar.':'Fica pendente, sem liberar saldo até confirmar o pagamento.'}</p>
  {form.paid==='paid'&&<label className="sm:col-span-2 flex gap-2"><input type="checkbox" required checked={form.checked} onChange={e=>change('checked',e.target.checked)}/>Conferi o recebimento do Pix ou a aprovação no cartão.</label>}
  <button className="btn btn-green sm:col-span-2" disabled={busy}>{busy?'Salvando…':'Salvar lançamento manual'}</button>
 </fieldset>
 {!student.active&&<p>Restaure o cadastro do aluno antes de adicionar aulas.</p>}
 {message&&<p role="alert">{message}</p>}
 </form>;
}
