import test from 'node:test';
import assert from 'node:assert/strict';
import { canBookJourney, journeyCategories, completedPractice } from '../src/lib/student-journey.js';
test('primeira habilitação exige quatro etapas; habilitado pode fazer reforço', () => {
  assert.equal(canBookJourney({}), false);
  assert.equal(canBookJourney({licensed_driver:true}), true);
  const steps={registration:'completed',medical:'completed',theory_course:'completed',theory_exam:'completed'};
  assert.equal(canBookJourney({journey_steps:steps}), true);
  assert.equal(canBookJourney({journey_steps:{...steps,medical:'in_progress'}}), false);
});
test('prática conta somente aulas realizadas distintas, separadas por categoria', () => {
  const lessons=[{id:'1',category:'A',status:'completed'},{id:'1',category:'A',status:'completed'},{id:'2',category:'B',status:'completed'},{id:'3',category:'B',status:'missed'},{id:'4',category:'A',status:'cancelled'}];
  assert.deepEqual(journeyCategories({category:'A+B'}),['A','B']);
  assert.equal(completedPractice(lessons,'A'),1);
  assert.equal(completedPractice(lessons,'B'),1);
});
