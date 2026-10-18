import React, { useState } from 'react';
import { Circle, Clock3, CheckCircle2, CalendarDays } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { journeySteps, journeyStatuses, journeyCategories, completedPractice } from '../lib/student-journey';

export function StudentJourney({ student = {}, lessons = [], compact = false, onDetails, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save(operation) {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      const { error } = await operation();
      if (error) throw error;
      await onSaved?.(); setMessage('Informações salvas e disponíveis para a equipe.');
    } catch (error) { setMessage(error.code === 'P0001' ? error.message : 'Não foi possível salvar. Confira se a atualização da jornada foi ativada no Supabase.'); }
    finally { setBusy(false); }
  }
  const editable = !compact && Boolean(onSaved) && Object.hasOwn(student, 'journey_steps');
  return <section className="student-panel" aria-label="Minha jornada CNH">
    <div className="student-panel-title"><h2>Minha jornada CNH</h2>{onDetails && <button onClick={onDetails}>Ver detalhes</button>}</div>
    <p className="student-muted">Informe suas etapas concluídas. Aulas realizadas são atualizadas pela equipe. Estas informações não substituem os registros do Detran.</p>
    {!compact && onSaved && !Object.hasOwn(student, 'journey_steps') && <p className="mt-3 text-sm">A edição da jornada ainda não foi habilitada. Fale com a equipe.</p>}
    {editable && <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy} checked={student.licensed_driver || false} onChange={e => save(() => supabase.rpc('update_student_journey', {p_student:student.id,p_steps:student.journey_steps || {},p_licensed:e.target.checked}))}/>Já sou habilitado e quero aulas de reforço</label>}
    {student.licensed_driver && <p className="mt-3 text-sm text-green-800">Aulas de reforço: etapas da primeira habilitação dispensadas para agendamento na plataforma.</p>}
    {!student.licensed_driver && journeyCategories(student).map(ladvCategory => <div key={ladvCategory} className="mt-4 rounded-xl border border-slate-200 p-4 text-sm">
      <h3 className="font-bold">{ladvCategory === 'A' ? 'Moto (A)' : 'Carro (B)'}: LADV e declaração de veracidade</h3>
      <p className="mt-2">Para agendar aulas práticas, informe que possui sua Licença para Aprendizagem de Direção Veicular (LADV) e confirme a declaração abaixo.</p>
      {student.ladv_confirmations?.[ladvCategory] ? <><p className="mt-3 font-semibold text-green-800">LADV e ciência confirmadas pelo aluno em {new Date(student.ladv_confirmations?.[ladvCategory]).toLocaleString('pt-BR', {timeZone:'America/Sao_Paulo'})}.</p>
        {editable && <button disabled={busy} className="mt-2 underline" onClick={() => save(() => supabase.rpc('declare_student_ladv',{p_student:student.id,p_category:ladvCategory,p_has_ladv:false,p_truth:false}))}>Retirar minha declaração</button>}</>
        : editable && Object.hasOwn(student,'ladv_confirmations') ? <form aria-label={`LADV ${ladvCategory}`} className="mt-3 space-y-3" onSubmit={e => {
          e.preventDefault(); const fields = new FormData(e.currentTarget);
          save(() => supabase.rpc('declare_student_ladv',{p_student:student.id,p_category:ladvCategory,p_has_ladv:fields.has('ladv'),p_truth:fields.has('truth')}));
        }}>
          <label className="flex items-start gap-2"><input type="checkbox" name="ladv" required disabled={busy}/>Informo que possuo LADV válida para a categoria das aulas que vou agendar.</label>
          <label className="flex items-start gap-2"><input type="checkbox" name="truth" required disabled={busy}/>Declaro que as informações prestadas são verdadeiras e estou ciente de que devo apresentar minha LADV à equipe antes das aulas práticas.</label>
          <button disabled={busy} className="btn btn-green">Confirmar LADV e declaração</button>
        </form> : <p className="mt-3 text-amber-800">Declaração de LADV pendente.</p>}
      <p className="mt-3 student-muted">Esta declaração é informada pelo aluno; não representa validação automática do documento.</p>
    </div>)}
    <ol className="journey-list">{journeySteps.map(([key,label]) => {
      const status = student.journey_steps?.[key] || 'pending';
      const Icon = status === 'completed' ? CheckCircle2 : status === 'in_progress' ? Clock3 : Circle;
      return <li key={key}><span className={status === 'completed' ? 'text-green-700' : 'journey-marker'}><Icon size={17}/></span><span>{label}</span>
        {editable ? <select aria-label={label} className="ml-auto max-w-40" disabled={busy} value={status} onChange={e => save(() => supabase.rpc('update_student_journey', {p_student:student.id,p_steps:{...student.journey_steps,[key]:e.target.value},p_licensed:student.licensed_driver || false}))}>{Object.entries(journeyStatuses).map(([value,text]) => <option key={value} value={value}>{text}</option>)}</select> : <small>{journeyStatuses[status]}</small>}
      </li>;
    })}</ol>
    {journeyCategories(student).map(category => {
      const count = completedPractice(lessons,category), done = count >= 2;
      const exam = student.practical_exam_dates?.[category];
      return <div key={category} className="mt-4 rounded-xl border border-slate-200 p-3 text-sm">
        <p className="flex items-center gap-2 font-semibold">{done ? <CheckCircle2 className="text-green-700" size={18}/> : <Clock3 size={18}/>}Aulas práticas · {category === 'A' ? 'Moto' : 'Carro'}</p>
        <p className="mt-2">{count} aulas realizadas · {done ? 'Mínimo de 2 aulas concluído' : 'Em andamento — mínimo de 2 aulas realizadas'}</p>
        <p className="mt-3 flex items-center gap-2"><CalendarDays size={17}/>Exame prático: {exam ? `Data informada: ${exam.split('-').reverse().join('/')}` : 'Data não informada'}</p>
        {editable && <form key={exam || 'empty'} className="mt-3 space-y-2" onSubmit={e => { e.preventDefault(); const value = new FormData(e.currentTarget).get('date'); save(() => supabase.rpc('set_student_exam_date',{p_student:student.id,p_category:category,p_date:value || null})); }}>
          <label>Data do exame de {category === 'A' ? 'moto' : 'carro'}<input name="date" type="date" defaultValue={exam || ''} disabled={busy || !done}/></label>
          <button disabled={busy || !done} className="btn btn-green">Salvar data do exame</button>
          <p className="student-muted">Informe a data após agendar seu exame. Ela ficará disponível para a equipe. Deixe em branco para retirar uma data informada.</p>
        </form>}
      </div>;
    })}
    {message && <p role="status" className="mt-4 text-sm">{message}</p>}
  </section>;
}
