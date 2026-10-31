const text = v => typeof v === 'string' && v.trim().length > 0;
const positive = v => Number.isInteger(v) && v > 0;
export function offerProblems(p) {
  const errors=[];
  if (!positive(p.price_cents)) errors.push('preço à vista');
  if (!positive(p.card_total_cents) || !positive(p.card_installments) || p.card_installments>12) errors.push('parcelamento');
  if (!text(p.card_contract)) errors.push('juros e condições do cartão');
  if (!text(p.exam_terms)) errors.push('condições do veículo para exame');
  if (!text(p.exclusions)) errors.push('taxas não incluídas');
  if (!text(p.cancellation_terms)) errors.push('cancelamento');
  if (!['A','B','A+B'].includes(p.category)) errors.push('categoria');
  if (p.category!=='B' && (!positive(p.lessons_a) || !positive(p.lesson_minutes_a) || p.lesson_minutes_a>1440)) errors.push('quantidade e duração de moto');
  if (p.category!=='A' && (!positive(p.lessons_b) || !positive(p.lesson_minutes_b) || p.lesson_minutes_b>1440)) errors.push('quantidade e duração de carro');
  if (p.category==='A+B' && (!positive(p.cash_a_cents) || !positive(p.cash_b_cents) || p.cash_a_cents+p.cash_b_cents!==p.price_cents)) errors.push('valores de carro e moto devem somar o total');
  if (!text(p.experience_level)) errors.push('tipo de experiência');
  if (p.free_retest && (!text(p.retest_coverage) || !text(p.retest_validity) || !positive(p.retest_uses) || p.retest_uses>100 || !text(p.retest_costs))) errors.push('cobertura, prazo, utilizações e custos do reteste');
  return errors;
}
export function isConfirmedOffer(p) {
  return p.active===true && !p.deleted_at && p.offer_confirmed===true && p.pricing_demo===false && offerProblems(p).length===0;
}
