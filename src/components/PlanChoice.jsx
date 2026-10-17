import React from 'react';
import { readPlanChoice } from '../data/experience-plans';
export function PlanChoice() {
  const choice = readPlanChoice(location.search);
  if (!choice) return null;
  return <aside aria-label="Sua escolha de aulas" className="my-5 rounded-xl border border-green-200 bg-green-50 p-4 text-slate-900"><p className="text-xs font-bold uppercase tracking-wide text-green-800">Você escolheu</p><p className="mt-1 font-bold">{choice.category.label}</p><p>{choice.experience.title}</p><p className="mt-2 text-sm">Vamos conversar sobre essa opção. O cadastro não contrata aulas nem gera cobrança.</p></aside>;
}
