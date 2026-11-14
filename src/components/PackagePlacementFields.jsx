import React from 'react';
import { experienceLevels } from '../data/experience-plans';

export function PackagePlacementFields({ form, setForm }) {
  return <><label>Público do pacote
    <select value={form.audience || 'first_license'} onChange={e=>setForm(f=>({...f,audience:e.target.value}))}>
      <option value="first_license">Primeira habilitação</option><option value="licensed">Já habilitados — reforço</option>
    </select>
  </label>{form.audience!=='licensed'&&<label>Tipo de experiência
    <select required value={form.experience_level || ''} onChange={e => setForm(f => ({ ...f, experience_level: e.target.value }))}>
      <option value="">Selecione o tipo</option>
      {experienceLevels.map(level => <option key={level.id} value={level.id}>{level.title}</option>)}
    </select>
  </label>}</>;
}
