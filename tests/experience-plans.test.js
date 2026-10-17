import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveExperienceOffer, readPlanChoice } from '../src/data/experience-plans.js';
import { splitInstallments } from '../src/lib/package-pricing.js';
test('a seleção aceita somente as categorias e experiências conhecidas',()=>{
  assert.equal(readPlanChoice('?categoria=A%2BB&experiencia=zero').category.id,'A+B');
  assert.equal(readPlanChoice('?categoria=X&experiencia=zero'),null);
  assert.equal(readPlanChoice('?categoria=B&experiencia=desconhecida'),null);
});
test('parcelas repartem os centavos sem aumentar o total anunciado',()=>{
  for(const total of [11000,39999,10000]) {
    const {base,higher,count}=splitInstallments(total,3);
    assert.equal(higher*(base+1)+(count-higher)*base,total);
  }
});
