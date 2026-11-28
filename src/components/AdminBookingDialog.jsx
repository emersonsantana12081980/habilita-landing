import React, {useEffect,useRef} from 'react';
export function AdminBookingDialog({children,onClose,busy,day}) {
 const ref=useRef(null);
 useEffect(()=>{const previous=document.activeElement;const overflow=document.body.style.overflow;ref.current.showModal();document.body.style.overflow='hidden';return()=>{document.body.style.overflow=overflow;previous?.focus();};},[]);
 return <dialog ref={ref} aria-label="Agendar aula para aluno" onCancel={e=>{e.preventDefault();if(!busy)onClose();}} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border-0 bg-white p-5 text-slate-900 backdrop:bg-slate-950/60">
 <div className="flex items-center justify-between gap-3"><strong>{day.split('-').reverse().join('/')} · Agendamento</strong><button type="button" disabled={busy} onClick={onClose} className="rounded-lg border p-3">Fechar</button></div>{children}</dialog>;
}
