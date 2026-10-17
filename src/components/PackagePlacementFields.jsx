import React from 'react';
import { experienceLevels, planCategories } from '../data/experience-plans';

export function PackagePlacementFields({ form, setForm }) {
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  return <fieldset className="sm:col-span-2 grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
    <legend className="px-2 font-bold">Quadro do pacote na página inicial</legend>
    <label>Nível de experiência
      <select required value={form.experience_level || ''} onChange={e => set('experience_level', e.target.value)}>
        <option value="">Selecione o quadro</option>
        {experienceLevels.map(level => <option key={level.id} value={level.id}>{level.title}</option>)}
      </select>
    </label>
    <p className="text-sm">Destino: <strong>{planCategories.find(c => c.id === form.category)?.label}</strong> → {experienceLevels.find(l => l.id === form.experience_level)?.title || 'Escolha o nível de experiência'}.</p>
    {(form.category === 'A+B' ? ['B', 'A'] : [form.category]).map(category => <React.Fragment key={category}>
      <label>Duração de cada aula de {category === 'B' ? 'carro' : 'moto'} (minutos)
        <input type="number" min="1" max="1440" required={form.offer_confirmed} value={form[`lesson_minutes_${category.toLowerCase()}`] ?? ''} onChange={e => set(`lesson_minutes_${category.toLowerCase()}`, e.target.value ? Number(e.target.value) : null)} />
      </label>
      {form.category === 'A+B' && <label>Valor à vista de {category === 'B' ? 'carro' : 'moto'} (R$)
        <input type="number" min="0.01" step="0.01" required={form.offer_confirmed} value={form[`cash_${category.toLowerCase()}_cents`] == null ? '' : form[`cash_${category.toLowerCase()}_cents`] / 100} onChange={e => set(`cash_${category.toLowerCase()}_cents`, e.target.value ? Math.round(Number(e.target.value) * 100) : null)} />
      </label>}
    </React.Fragment>)}
    {[['card_contract', 'Condições do parcelamento'], ['exam_terms', 'Condições do exame'], ['cancellation_terms', 'Regras de cancelamento'], ['exclusions', 'O que não está incluso']].map(([key, label]) => <label key={key}>{label}<textarea required={form.offer_confirmed} value={form[key] || ''} onChange={e => set(key, e.target.value)} /></label>)}
    <label className="sm:col-span-2"><input type="checkbox" checked={form.offer_confirmed ?? false} onChange={e => set('offer_confirmed', e.target.checked)} /> Valores, duração e condições conferidos para exibir neste quadro</label>
    <p className="sm:col-span-2 text-sm text-slate-600">Cada categoria tem três quadros. Cadastre apenas um pacote ativo por quadro. Sem a confirmação dos dados, o site mantém a opção de consultar o plano.</p>
  </fieldset>;
}
