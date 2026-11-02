import test from 'node:test';
import assert from 'node:assert/strict';
import { canBookJourney, journeyCategories, completedPractice, journeyPortalLocked } from '../src/lib/student-journey.js';
const onboarding_steps=Object.fromEntries(['initial_application','theory_course','registration','medical','theory_exam'].map(k=>[k,'2026-11-02']));
const ladv_documents={A:{path:'student/A/doc.pdf'},B:{path:'student/B/doc.pdf'}};
test('primeira habilitação exige quatro etapas; habilitado pode fazer reforço', () => {
  assert.equal(canBookJourney({}), false);
  assert.equal(canBookJourney({licensed_driver:true,category:'B'},'B'), true);
  const steps={registration:'completed',medical:'completed',theory_course:'completed',theory_exam:'completed'};
  assert.equal(canBookJourney({journey_steps:steps}), false);
  assert.equal(canBookJourney({onboarding_steps,ladv_documents,journey_steps:steps,category:'B',ladv_confirmations:{B:'2026-10-18T10:00:00Z'}}), true);
  assert.equal(canBookJourney({journey_steps:{...steps,medical:'in_progress'},category:'B',ladv_confirmations:{B:'2026-10-18T10:00:00Z'}}), false);
});
test('prática conta somente aulas realizadas distintas, separadas por categoria', () => {
  const lessons=[{id:'1',category:'A',status:'completed'},{id:'1',category:'A',status:'completed'},{id:'2',category:'B',status:'completed'},{id:'3',category:'B',status:'missed'},{id:'4',category:'A',status:'cancelled'}];
  assert.deepEqual(journeyCategories({category:'A+B'}),['A','B']);
  assert.equal(completedPractice(lessons,'A'),1);
  assert.equal(completedPractice(lessons,'B'),1);
});

test('LADV for car never unlocks motorcycle or an undeclared category', () => {
  const student={onboarding_steps,ladv_documents,category:'A+B',journey_steps:{registration:'completed',medical:'completed',theory_course:'completed',theory_exam:'completed'},ladv_confirmations:{B:'2026-10-18T10:00:00Z'}};
  assert.equal(canBookJourney(student,'B'),false);
  assert.equal(canBookJourney(student,'A'),false);
  assert.equal(canBookJourney({...student,ladv_confirmations:{},ladv_confirmed_at:'2026-10-18'},'B'),false);
  assert.equal(canBookJourney({...student,category:'B',licensed_driver:true},'A'),false);
  assert.equal(canBookJourney({...student,ladv_confirmations:{...student.ladv_confirmations,A:'2026-10-18T11:00:00Z'}},'A'),true);
});

test("legacy declarations cannot bypass upload or sequential preparation",()=>{
 const student={category:"B",onboarding_steps,ladv_documents,ladv_confirmations:{B:"2026-11-02"}};
 assert.equal(journeyPortalLocked(student),false);
 assert.equal(journeyPortalLocked({...student,ladv_documents:{}}),true);
 assert.equal(journeyPortalLocked({...student,onboarding_steps:{}}),true);
 assert.equal(journeyPortalLocked({category:"B",licensed_driver:true}),false);
});
