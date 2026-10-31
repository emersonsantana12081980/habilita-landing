import test from 'node:test';
import assert from 'node:assert/strict';
import {isConfirmedOffer} from '../src/lib/confirmed-offer.js';
import {approvedPhotos,approvedTestimonials,instructorEvidence} from '../src/lib/trust-content.js';
const offer={active:true,offer_confirmed:true,pricing_demo:false,category:'B',experience_level:'experiencia',lessons_b:2,lesson_minutes_b:50,price_cents:30000,card_total_cents:33000,card_installments:3,card_contract:'Total com acréscimo informado.',exam_terms:'Veículo não incluído.',exclusions:'Taxas do exame não incluídas.',cancellation_terms:'Avisar com 24 horas.'};
test('somente ofertas completas e confirmadas são publicáveis',()=>{
 assert.equal(isConfirmedOffer(offer),true);
 for(const change of [{offer_confirmed:false},{pricing_demo:true},{active:false},{deleted_at:'2026-01-01'},{price_cents:0},{lesson_minutes_b:null},{card_contract:''},{exam_terms:''},{exclusions:''},{card_total_cents:null}]) assert.equal(isConfirmedOffer({...offer,...change}),false,JSON.stringify(change));
});
test('reteste exige cobertura, validade, limite e custos; combo exige composição correta',()=>{
 const retest={...offer,free_retest:true,retest_coverage:'Veículo',retest_validity:'30 dias após exame',retest_uses:1,retest_costs:'Taxa do exame não incluída'};
 assert.equal(isConfirmedOffer(retest),true);
 for(const key of ['retest_coverage','retest_validity','retest_uses','retest_costs']) assert.equal(isConfirmedOffer({...retest,[key]:null}),false);
 assert.equal(isConfirmedOffer({...retest,retest_uses:101}),false);
 const combo={...offer,category:'A+B',lessons_a:2,lesson_minutes_a:50,cash_a_cents:15000,cash_b_cents:15000};
 assert.equal(isConfirmedOffer(combo),true);
 assert.equal(isConfirmedOffer({...combo,cash_b_cents:14000}),false);
});
test('conteúdo de confiança requer autorização e origem; alterações invalidam evidência',()=>{
 const photo={url:'https://example.com/photo.jpg',caption:'Aula autorizada',real:true,authorized:true};
 assert.deepEqual(approvedPhotos({photos:[null,photo,{...photo,authorized:false},{...photo,url:'javascript:alert(1)'}]}),[photo]);
 const review={name:'Cliente autorizado',text:'Avaliação real',source:'Registro autorizado',verified:true,authorized:true,active:true};
 assert.deepEqual(approvedTestimonials({testimonials:[null,review,{...review,verified:false},{...review,source:''}]}),[review]);
 assert.notEqual(instructorEvidence({id:'1',name:'A',bio:'Original'}),instructorEvidence({id:'1',name:'A',bio:'Alterado'}));
});
