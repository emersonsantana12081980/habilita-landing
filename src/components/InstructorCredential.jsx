import React from 'react';
import { BadgeCheck, ExternalLink } from 'lucide-react';

export function InstructorCredential() {
  return <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900">
    <p className="font-bold">Credencial de Emerson Coelho de Santana</p>
    <a className="btn btn-green mt-4" href="/images/credencial-instrutor-emerson.png" target="_blank" rel="noopener noreferrer">
      <BadgeCheck size={20} aria-hidden="true" /> Ver credencial do instrutor
    </a>
    <p className="mt-3 text-sm text-slate-600">A imagem abre em uma nova aba, com os dados pessoais ocultos.</p>
    <a className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-green-800 underline" href="https://portalservicos.senatran.serpro.gov.br/#/instrutor/consulta-cpf" target="_blank" rel="noopener noreferrer">
      Consultar instrutor no portal da Senatran <ExternalLink size={16} aria-hidden="true" />
    </a>
  </div>;
}
