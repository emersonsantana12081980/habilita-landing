export const journeySteps = [
  ['registration', 'Cadastro no Detran'],
  ['medical', 'Exames médico e psicológico'],
  ['theory_course', 'Formação teórica'],
  ['theory_exam', 'Avaliação teórica'],
];
export const journeyStatuses = { pending: 'Não informado', in_progress: 'Em andamento', completed: 'Concluído' };
export function canBookJourney(student, category = student?.category) {
  if (!['A', 'B'].includes(category) || !journeyCategories(student).includes(category)) return false;
  return student?.licensed_driver === true || (Boolean(student?.ladv_confirmations?.[category]) && journeySteps.every(([key]) => student?.journey_steps?.[key] === 'completed'));
}
export function journeyCategories(student) { return student?.category === 'A+B' ? ['A', 'B'] : [student?.category || 'B']; }
export function completedPractice(lessons, category) {
  return new Set(lessons.filter(l => l.category === category && l.status === 'completed').map(l => l.id)).size;
}
