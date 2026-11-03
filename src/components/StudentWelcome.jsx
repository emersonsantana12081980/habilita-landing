import React, { useEffect, useRef, useState } from 'react';

export function StudentWelcome() {
  const dialog = useRef(null);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (closed) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [closed]);
  if (closed) return null;
  return <dialog ref={dialog} aria-label="Boas-vindas à Habilita+"
    onCancel={event => { event.preventDefault(); setClosed(true); }}
    className="m-auto w-[calc(100%_-_2rem)] max-w-4xl max-h-[90dvh] overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-950/75">
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <h2 className="font-bold text-slate-900">Bem-vindo à Habilita+</h2>
      <button type="button" aria-label="Fechar boas-vindas" onClick={() => setClosed(true)} className="rounded-lg px-3 py-2 text-xl text-slate-900">×</button>
    </div>
    <img src="/images/boas-vindas-aluno.png" width="1536" height="1024" className="block h-auto w-full"
      alt="Habilita+ — instrutor autônomo. Seu apoio na conquista da primeira CNH. Aulas práticas de carro e moto, orientação completa e atendimento em Caçapava-SP."/>
    <div className="sticky bottom-0 bg-white p-4">
      <button type="button" autoFocus className="btn btn-green w-full" onClick={() => setClosed(true)}>Fechar e continuar</button>
    </div>
  </dialog>;
}
