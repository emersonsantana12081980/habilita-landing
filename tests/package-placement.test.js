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
test('não exibe oferta ambígua, inativa, fictícia ou sem confirmação', () => {
  assert.equal(resolveExperienceOffer([pack, { ...pack, id: 'p2' }], 'B', 'base'), null);
  for (const change of [{ active: false }, { pricing_demo: true }, { offer_confirmed: false }, { lesson_minutes_b: null }])
    assert.equal(resolveExperienceOffer([{ ...pack, ...change }], 'B', 'base'), null);
});
test('pacote combinado exige valores separados que correspondam ao total', () => {
  const combined = { ...pack, category: 'A+B', lessons_a: 2, lesson_minutes_a: 50, cash_a_cents: 10000, cash_b_cents: 20000 };
  assert.equal(resolveExperienceOffer([combined], 'A+B', 'base').pack.id, 'p1');
  assert.equal(resolveExperienceOffer([{ ...combined, cash_a_cents: 9999 }], 'A+B', 'base'), null);
});
