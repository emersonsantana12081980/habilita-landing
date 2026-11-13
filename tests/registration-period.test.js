import test from 'node:test';
import assert from 'node:assert/strict';
import {registrationPeriod} from '../src/lib/registration-period.js';
const now=new Date('2026-11-13T15:00:00Z');
test('cadastro usa dia de Brasília e inclui limites do período',()=>{
 const today=registrationPeriod({period:'today'},now);
 assert.equal(today.matches('2026-11-13T02:59:59Z'),false);
 assert.equal(today.matches('2026-11-13T03:00:00Z'),true);
 assert.equal(today.matches('2026-11-14T02:59:59Z'),true);
 assert.equal(today.matches('2026-11-14T03:00:00Z'),false);
 const week=registrationPeriod({period:'week'},now);
 assert.equal(week.matches('2026-11-07T03:00:00Z'),true);
 assert.equal(week.matches('2026-11-07T02:59:59Z'),false);
 const month=registrationPeriod({period:'month'},now);
 assert.equal(month.matches('2026-11-01T03:00:00Z'),true);
 assert.equal(month.matches('2026-11-01T02:59:59Z'),false);
});
test('personalizado inclui último dia, rejeita inversão e trata datas ausentes',()=>{
 const range=registrationPeriod({period:'custom',dateFrom:'2026-10-01',dateTo:'2026-10-31'},now);
 assert.equal(range.matches('2026-11-01T02:59:59Z'),true);
 assert.equal(range.matches('2026-11-01T03:00:00Z'),false);
 assert.equal(range.matches(null),false);
 assert.equal(range.matches('invalid'),false);
 assert.equal(registrationPeriod().matches(null),true);
 assert.equal(registrationPeriod({period:'custom',dateFrom:'2026-11-02',dateTo:'2026-11-01'}).invalid,true);
});
