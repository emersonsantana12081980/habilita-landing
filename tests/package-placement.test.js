import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveExperienceOffer } from '../src/data/experience-plans.js';

const pack = { id: 'p1', active: true, category: 'B', experience_level: 'base',
  offer_confirmed: true, pricing_demo: false, price_cents: 30000,
  card_total_cents: 33000, card_installments: 3, lessons_b: 3,
  lesson_minutes_b: 50, card_contract: '3 parcelas no cartão' };

test('o cadastro aparece somente na categoria e experiência escolhidas', () => {
  for (const category of ['A', 'B', 'A+B']) for (const level of ['experiencia', 'base', 'zero']) {
    assert.equal(Boolean(resolveExperienceOffer([pack], category, level)), category === 'B' && level === 'base');
  }
});
test('uses registered prices without extra confirmation or duration fields', () => {
  const result = resolveExperienceOffer([{ ...pack, pricing_demo: true, offer_confirmed: false, lesson_minutes_b: null, card_contract: null }], 'B', 'base');
  assert.equal(result.cash, 30000);
  assert.equal(result.total, 33000);
  assert.equal(result.hours[0].lessons, 3);
});
test('ambiguous or inactive slots are not selected', () => {
  assert.equal(resolveExperienceOffer([pack, { ...pack, id: 'p2' }], 'B', 'base'), null);
  assert.equal(resolveExperienceOffer([{ ...pack, active: false }], 'B', 'base'), null);
});
test('missing installment price does not invent interest or hide cash price', () => {
  const result = resolveExperienceOffer([{ ...pack, card_total_cents: null }], 'B', 'base');
  assert.equal(result.cash, 30000);
  assert.equal(result.total, null);
});
