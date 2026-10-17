import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveExperienceOffer, readPlanChoice } from '../src/data/experience-plans.js';
import { splitInstallments } from '../src/lib/package-pricing.js';
const pack={id:'real-b',category:'B',active:true,pricing_demo:false,price_cents:10000,card_total_cents:11000,card_installments:3,lessons_b:3};
const terms={confirmed:true,packageId:'real-b',lessonMinutes:{B:60},cardContract:'Condição confirmada pelo responsável'};
test('ofertas pendentes, demonstrativas ou com horas ausentes não são anunciadas',()=>{
  assert.equal(resolveExperienceOffer([pack],'B','base'),null);
  const config={B:{base:terms}};
  assert.equal(resolveExperienceOffer([{...pack,pricing_demo:true}],'B','base',config),null);
  assert.equal(resolveExperienceOffer([pack],'B','base',{B:{base:{...terms,lessonMinutes:null}}}),null);
  assert.equal(resolveExperienceOffer([pack],'A','base',config),null);
  assert.equal(resolveExperienceOffer([pack],'B','zero',config),null);
  assert.equal(resolveExperienceOffer([pack],'B','base',config).pack.id,'real-b');
});
test('A/B exige discriminação consistente de valores e horas',()=>{
  const both={...pack,id:'both',category:'A+B',lessons_a:2,lessons_b:3};
  const config={'A+B':{base:{...terms,packageId:'both',lessonMinutes:{A:60,B:60},cashByCategory:{A:4000,B:6000}}}};
  assert.deepEqual(resolveExperienceOffer([both],'A+B','base',config).hours.map(h=>h.lessons*h.minutes),[180,120]);
  config['A+B'].base.cashByCategory.A=5000;
  assert.equal(resolveExperienceOffer([both],'A+B','base',config),null);
});
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
