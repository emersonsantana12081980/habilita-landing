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
// Preencher somente depois de confirmação comercial. Não mapear um pacote antigo
// para três níveis por suposição. null mantém o card apenas como consulta.
// Entrada: { confirmed:true, packageId:<id/slug existente>, lessonMinutes:{A:...,B:...},
// cashByCategory:{A:<centavos>,B:<centavos>}, cardContract:<texto confirmado>,
// examTerms, retestTerms, cancellationTerms, exclusions }
export const experienceOffers = {
  B: { experiencia: null, base: null, zero: null },
  A: { experiencia: null, base: null, zero: null },
  'A+B': { experiencia: null, base: null, zero: null },
};
export function readPlanChoice(search = '') {
  const query = new URLSearchParams(search);
  const category = planCategories.find(c => c.id === query.get('categoria'));
  const experience = experienceLevels.find(e => e.id === query.get('experiencia'));
  return category && experience ? { category, experience } : null;
}
export function resolveExperienceOffer(packages, category, level, offers = experienceOffers) {
  const assigned = packages.filter(p => p.active && p.category === category && p.experience_level === level);
  if (assigned.length > 1) return null;
  const saved = assigned[0];
  const terms = saved ? {
    confirmed: saved.offer_confirmed, packageId: saved.id,
    lessonMinutes: { A: saved.lesson_minutes_a, B: saved.lesson_minutes_b },
    cashByCategory: { A: saved.cash_a_cents, B: saved.cash_b_cents },
    cardContract: saved.card_contract, examTerms: saved.exam_terms,
    retestTerms: saved.retest_terms, cancellationTerms: saved.cancellation_terms,
    exclusions: saved.exclusions,
  } : offers[category]?.[level];
  if (!terms?.confirmed) return null;
  const matches = packages.filter(p => p.active && p.category === category && (p.id === terms.packageId || p.slug === terms.packageId));
  if (matches.length !== 1) return null;
  const pack = matches[0];
  if ((pack.pricing_demo ?? pack.pricingDemo) !== false) return null;
  const cash = pack.price_cents ?? Math.round(pack.price * 100);
  const total = pack.card_total_cents ?? pack.cardTotalCents;
  const count = pack.card_installments ?? pack.cardInstallments;
  if (![cash,total].every(n => Number.isSafeInteger(n) && n > 0) || !Number.isInteger(count) || count < 1 || count > 12 || !terms.cardContract) return null;
  const hours = (category === 'A+B' ? ['B','A'] : [category]).map(id => ({ id, minutes: terms.lessonMinutes?.[id], lessons: id === 'B'
    ? pack.lessons_b ?? pack.carLessons ?? (category === 'B' ? pack.lessons : null)
    : pack.lessons_a ?? pack.motorcycleLessons ?? (category === 'A' ? pack.lessons : null), cash: terms.cashByCategory?.[id] }));
  if (hours.some(h => !Number.isInteger(h.minutes) || h.minutes <= 0 || !Number.isInteger(h.lessons) || h.lessons <= 0)) return null;
  if (category === 'A+B' && (hours.some(h => !Number.isSafeInteger(h.cash) || h.cash <= 0) || hours.reduce((sum,h) => sum+h.cash,0) !== cash)) return null;
  return { pack, terms, cash, total, count, hours };
}
