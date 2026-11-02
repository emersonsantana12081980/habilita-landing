import React, {useState} from 'react';
import {AdminStudentClasses} from './AdminStudentClasses';

export function AdminManualOrder({students,onSaved}) {
 const [open,setOpen]=useState(false),[studentId,setStudentId]=useState(''),[busy,setBusy]=useState(false);
 const active=students.filter(s=>s.active&&!s.deleted_at).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 const student=active.find(s=>s.id===studentId);
 return <section className="mb-5 rounded-xl border bg-white p-4">
  {!open?<button className="btn btn-green" onClick={()=>setOpen(true)}>Lançar pedido manual</button>:<>
   <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Lançar pedido manual</h2><button disabled={busy} type="button" className="rounded-lg border px-3 py-2" onClick={()=>{setOpen(false);setStudentId('');}}>Fechar lançamento</button></div>
   <label className="mb-4 block">Aluno do pedido<select disabled={busy} value={studentId} onChange={e=>setStudentId(e.target.value)}><option value="">Selecione o aluno</option>{active.map(s=><option key={s.id} value={s.id}>{s.name}{s.phone?` · ${s.phone}`:''}</option>)}</select></label>
   {!active.length&&<p>Cadastre ou ative um aluno na seção Alunos para lançar o pedido.</p>}
   {student&&<AdminStudentClasses key={student.id} student={student} onBusy={setBusy} onSaved={async message=>{setOpen(false);setStudentId('');await onSaved(message);}}/>}
  </>}
 </section>;
}
