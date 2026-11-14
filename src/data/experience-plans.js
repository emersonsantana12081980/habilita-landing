export const planCategories = [
  { id: 'B', label: 'Carro — Categoria B' },
  { id: 'A', label: 'Moto — Categoria A' },
  { id: 'A+B', label: 'Carro e moto — Categorias A/B' },
];
export const experienceLevels = [
  { id: 'experiencia', title: 'Já tenho experiência', badge: 'REVISÃO E PREPARAÇÃO', description: 'Para quem já dirige e quer revisar habilidades ou se preparar para o exame.', note: 'Defina com o instrutor o que você precisa praticar.' },
  { id: 'base', title: 'Tenho alguma base', badge: 'REFORÇO DE HABILIDADES', description: 'Para quem já teve aulas ou conhece o básico e quer ganhar prática e confiança.', note: 'Reforce o que já aprendeu, com orientação próxima.' },
  { id: 'zero', title: 'Vou começar do zero', badge: 'APRENDIZADO GRADUAL', description: 'Para quem nunca dirigiu e quer aprender os fundamentos no seu ritmo.', note: 'Planeje o aprendizado passo a passo com o instrutor.' },
];
export function readPlanChoice(search = '') {
  const query = new URLSearchParams(search);
  const category = planCategories.find(c => c.id === query.get('categoria'));
  const experience = experienceLevels.find(e => e.id === query.get('experiencia'));
  return category && experience ? { category, experience } : null;
}
// Um pacote básico por categoria; os demais continuam disponíveis no portal.
export function basicPackages(packages) {
  return planCategories.map(category => packages
    .filter(p => {
      if (!p.active || p.audience==='licensed' || p.category !== category.id || p.experience_level !== 'experiencia') return false;
      const offer = packageOffer(p);
      const expected = category.id === 'A+B' ? ['A','B'] : [category.id];
      return offer && expected.every(id => offer.hours.some(h => h.id === id && h.lessons === 2));
    })
    .sort((a,b) => packageOffer(a).cash-packageOffer(b).cash || String(a.id).localeCompare(String(b.id)))[0]
  ).filter(Boolean);
}
export function resolveExperienceOffer(packages, category, level) {
  const matches = packages.filter(p => p.active && p.category === category && p.experience_level === level);
  return matches.length === 1 ? packageOffer(matches[0]) : null;
}
export function packageOffer(pack) {
  const cash = pack.price_cents ?? Math.round(pack.price * 100);
  if (!Number.isSafeInteger(cash) || cash <= 0) return null;
  const total = pack.card_total_cents ?? pack.cardTotalCents;
  const count = pack.card_installments ?? pack.cardInstallments;
  const hasCard = Number.isSafeInteger(total) && total > 0 && Number.isInteger(count) && count > 0 && count <= 12;
  const hours = (pack.category === 'A+B' ? ['B', 'A'] : [pack.category]).map(id => ({
    id, lessons: id === 'B' ? pack.lessons_b ?? pack.carLessons ?? pack.lessons : pack.lessons_a ?? pack.motorcycleLessons ?? pack.lessons,
  })).filter(h => Number.isInteger(h.lessons) && h.lessons > 0);
  return { pack, cash, total: hasCard ? total : null, count: hasCard ? count : null, hours,
    terms: { examTerms: pack.exam_terms, retestTerms: pack.retest_terms ?? pack.retestTerms,
      cancellationTerms: pack.cancellation_terms, exclusions: pack.exclusions, cardContract: pack.card_contract } };
}
