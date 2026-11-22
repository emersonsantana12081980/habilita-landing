import React, { useEffect, useRef } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { InstructorAvatar } from './InstructorAvatar';
import { InstructorCredential } from './InstructorCredential';

export function InstructorProfile({ instructor, city, contact, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  const emerson = instructor.slug === 'emerson-santana';
  return <dialog ref={dialog} className="instructor-profile" aria-labelledby="profile-name" onClose={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="instructor-profile-content">
      <button className="profile-close" autoFocus aria-label="Fechar perfil" onClick={onClose}><X /></button>
      <p className="eyebrow">CONHEÇA SEU INSTRUTOR</p>
      <div className="mt-5 flex flex-wrap items-center gap-5">
        {emerson ? <img src="/images/EMERSON%20.png" alt={instructor.name} className="h-28 w-28 rounded-2xl object-cover object-top" /> : <InstructorAvatar instructor={instructor} large />}
        <div><h2 id="profile-name">{instructor.name}</h2><p className="mt-2 text-sm text-slate-600">Categoria {(instructor.category || '').replace('+','/')} · {instructor.city || city}</p></div>
      </div>
      <p className="mt-6 whitespace-pre-line break-words leading-7 text-slate-600">{instructor.bio || 'Converse com o instrutor para conhecer sua experiência e o atendimento.'}</p>
      <p className="mt-4 text-sm text-slate-600">Horários: confirme a disponibilidade no atendimento.</p>
      <button className="btn btn-green mt-5" onClick={() => contact('Olá! Gostaria de conhecer suas aulas e disponibilidade.', instructor)}><MessageCircle size={18}/> Falar com este instrutor</button>
      {emerson ? <InstructorCredential /> : <div className="mt-6 rounded-xl border border-slate-200 p-5"><h3 className="font-bold">Consulta de credencial</h3><p className="mt-2 text-sm text-slate-600">Consulte o credenciamento no portal oficial da Senatran. Solicite ao instrutor os dados necessários para a consulta.</p><a className="btn btn-outline mt-4" href="https://portalservicos.senatran.serpro.gov.br/#/instrutor/consulta-cpf" target="_blank" rel="noopener noreferrer">Consultar credencial na Senatran</a></div>}
    </div>
  </dialog>;
}
