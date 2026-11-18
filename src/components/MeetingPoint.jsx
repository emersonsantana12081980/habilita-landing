import React, {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';

export function safeMapsUrl(value){
 try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&((['maps.app.goo.gl','maps.google.com'].includes(u.hostname))||(['www.google.com','google.com','goo.gl'].includes(u.hostname)&&u.pathname.startsWith('/maps')))?u.href:null;}catch{return null;}
}
export function MeetingPoint({point}){
 if(!point)return <p className="mt-2 text-sm text-slate-500">Ponto de encontro: combine com a equipe.</p>;
 const url=safeMapsUrl(point.maps_url);
 return <div className="mt-3 rounded-xl border border-slate-200 p-3 text-sm"><p className="font-semibold">Ponto de encontro: {point.name}</p><p>{point.address}</p>{point.instructions&&<p className="mt-1">{point.instructions}</p>}{url&&<a className="inline-block py-2 font-semibold text-green-800 underline" href={url} target="_blank" rel="noopener noreferrer">Ver no Google Maps ↗</a>}</div>;
}
export function MeetingPointPicker({slot,value,onChange}){
 const [points,setPoints]=useState([]),[state,setState]=useState(''),[loaded,setLoaded]=useState('');
 useEffect(()=>{
  let alive=true; setPoints([]);setLoaded('');setState(slot?'Carregando pontos…':'');onChange('');
  if(slot)supabase.rpc('meeting_point_options',{p_slot:slot}).then(({data,error})=>{
   if(!alive)return;setLoaded(slot);setPoints(error?[]:data||[]);setState(error?'Não foi possível carregar os pontos. Confira se a atualização do banco foi aplicada.':data?.length?'':'Nenhum ponto disponível neste horário. Escolha outro horário ou fale com a equipe.');
   if(!error&&data?.length===1)onChange(data[0].id);
  }).catch(()=>{if(alive)setState('Não foi possível carregar os pontos. Tente outro horário.');});
  return()=>{alive=false;};
 },[slot]);
 if(!slot)return null;
 return <div className="my-4">{state&&<p role="status">{state}</p>}{loaded===slot&&points.length>0&&<><label>Ponto de encontro<select aria-label="Ponto de encontro" required value={value} onChange={e=>onChange(e.target.value)}><option value="">Selecione o local</option>{points.map(p=><option key={p.id} value={p.id}>{p.name} — {p.address}</option>)}</select></label><MeetingPoint point={points.find(p=>p.id===value)}/></>}</div>;
}
