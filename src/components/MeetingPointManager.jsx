import React,{useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
import {MeetingPoint,safeMapsUrl} from './MeetingPoint';
const fresh=()=>({name:'',address:'',maps_url:'',instructions:'',instructor_id:'',category:'B',weekdays:[1,2,3,4,5],opens:'08:00',closes:'18:00',active:true});
export function MeetingPointManager({instructors}){
 const [rows,setRows]=useState([]),[form,setForm]=useState(fresh),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function load(){const {data,error}=await supabase.from('meeting_points').select('*').order('name');if(error)setMessage('Aplique o SQL dos pontos de encontro no Supabase para ativar este cadastro.');else setRows(data||[]);}
 useEffect(()=>{load();},[]);
 const field=(key,label,type='text')=><label>{label}<input required={key!=='instructions'} type={type} maxLength={key==='address'?300: key==='maps_url'?1000:100} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>;
 return <section className="admin-card"><h2>Pontos de encontro</h2><p className="my-3 text-sm">Defina os locais e períodos atendidos. Reserve tempo de deslocamento na agenda; o sistema não calcula trajetos entre bairros.</p><form className="grid gap-4 sm:grid-cols-2" onSubmit={async e=>{e.preventDefault();if(busy)return;if(!safeMapsUrl(form.maps_url)){setMessage('Use um link HTTPS do Google Maps.');return;}if(!form.weekdays.length||form.closes<=form.opens){setMessage('Confira os dias e o período de atendimento.');return;}setBusy(true);setMessage('');try{const {error}=await supabase.from('meeting_points').upsert(form);if(error)throw error;setForm(fresh());await load();setMessage('Ponto salvo. Aulas anteriores mantêm o endereço combinado.');}catch{setMessage('Não foi possível salvar. Confira os campos e a atualização do banco.');}finally{setBusy(false);}}}>
 {field('name','Nome do ponto')}{field('address','Endereço e bairro')}{field('maps_url','Link do Google Maps','url')}
 <label>Orientação<textarea maxLength={500} value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})}/></label>
 <label>Instrutor<select aria-label="Instrutor" required value={form.instructor_id} onChange={e=>setForm({...form,instructor_id:e.target.value})}><option value="">Selecione</option>{instructors.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
 <label>Categoria<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="A">Moto</option><option value="B">Carro</option><option value="A+B">Carro e moto</option></select></label>
 {field('opens','Atende a partir de','time')}{field('closes','Aulas terminam até','time')}
 <fieldset className="sm:col-span-2"><legend>Dias atendidos</legend><div className="flex flex-wrap gap-4">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((name,d)=><label key={d}><input type="checkbox" checked={form.weekdays.includes(d)} onChange={e=>setForm({...form,weekdays:e.target.checked?[...form.weekdays,d]:form.weekdays.filter(x=>x!==d)})}/> {name}</label>)}</div></fieldset>
 <label><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Disponível para novos agendamentos</label>
 <div className="flex gap-3"><button disabled={busy} className="btn btn-green">Salvar ponto</button><button type="button" onClick={()=>setForm(fresh())}>Novo / limpar</button></div></form>
 {message&&<p role="status" className="my-4">{message}</p>}<div className="grid gap-4 md:grid-cols-2 mt-6">{rows.map(p=><article key={p.id}><MeetingPoint point={p}/><p className="text-sm">{instructors.find(i=>i.id===p.instructor_id)?.name} · {p.category} · {p.opens.slice(0,5)}–{p.closes.slice(0,5)} · {p.active?'Ativo':'Desativado'}</p><button className="py-3 font-semibold text-green-800" onClick={()=>setForm(p)}>Editar / desativar</button></article>)}</div></section>;
}
