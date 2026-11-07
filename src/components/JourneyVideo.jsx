import React,{useEffect,useRef,useState} from 'react';
import {youtubeId} from '../lib/youtube';

function VideoDialog({id,title,onClose}) {
  const dialog=useRef(null);
  useEffect(()=>{
    const el=dialog.current,previous=document.activeElement,overflow=document.body.style.overflow;
    el.showModal();document.body.style.overflow='hidden';
    return ()=>{el.close();document.body.style.overflow=overflow;previous?.focus();};
  },[]);
  return <dialog ref={dialog} aria-label={`Vídeo: ${title}`} onCancel={e=>{e.preventDefault();onClose();}}
    className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto rounded-2xl border-0 bg-white p-4 text-slate-900 shadow-xl backdrop:bg-slate-950/75">
    <div className="mb-4 flex items-start justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2><button autoFocus type="button" className="btn btn-outline" onClick={onClose}>Fechar vídeo</button></div>
    <iframe title={`Vídeo de orientação: ${title}`} className="aspect-video w-full rounded-xl border-0" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
    <p className="mt-3 text-sm">Se o vídeo não reproduzir aqui, <a className="font-semibold text-green-800 underline" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">abrir no YouTube</a>.</p>
  </dialog>;
}
export function JourneyVideo({url,title,label='Assista ao vídeo'}) {
  const [opened,setOpened]=useState(false);
  const id=youtubeId(url);
  if(!id)return null;
  return <><button type="button" className="btn btn-outline" onClick={()=>setOpened(true)}>{label}</button>
    {opened&&<VideoDialog key={id} id={id} title={title} onClose={()=>setOpened(false)}/>}</>;
}
