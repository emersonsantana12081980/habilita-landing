import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestWebhookHandler, verifiedPayment } from '../supabase/functions/mercado-pago-test-webhook/handler.js';

const request = '00000000-0000-4000-8000-000000000001';
const secret = 'webhook-fixture-only';
const seller = {id:123,site_id:'MLB',tags:['test_user']};
const payment = {id:456,collector_id:123,live_mode:false,currency_id:'BRL',status:'approved',
  transaction_amount:299,external_reference:`habilita-test-${request}-00000000-0000-4000-8000-000000000002`,
  metadata:{package_request_id:request,environment:'test',grants_credits:false},date_last_updated:'2026-10-11T12:00:00.000Z'};

async function notification(overrides={}) {
  const manifest = 'id:456;request-id:request-fixture;ts:1791710000;';
  const key = await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signature = [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(manifest)))].map(x=>x.toString(16).padStart(2,'0')).join('');
  return new Request(overrides.url || 'https://project.supabase.co/functions/v1/mercado-pago-test-webhook?data.id=456',{
    method:'POST',headers:{'x-request-id':'request-fixture','x-signature':`ts=1791710000,v1=${signature}`,...overrides.headers},
    body:JSON.stringify(overrides.body || {type:'payment',data:{id:'456'},status:'rejected',transaction_amount:1}),
  });
}
function fixture(overrides={}) {
  const calls=[]; const records=[];
  const handler=createTestWebhookHandler({
    env:key=>({MERCADO_PAGO_TEST_ENABLED:'true',MERCADO_PAGO_WEBHOOK_SECRET_TEST:secret,MERCADO_PAGO_ACCESS_TOKEN_TEST:'token-private',...overrides.env})[key],
    fetchImpl:async url=>{calls.push(url);if(overrides.providerFailure)return new Response('secret provider',{status:500});return Response.json(url.endsWith('/users/me') ? {...seller,...overrides.seller} : {...payment,...overrides.payment});},
    recordPayment:async args=>{if(overrides.dbFailure)throw new Error('database-private');records.push(args);return overrides.result || 'recorded';},
  });return {handler,calls,records};
}
test('assinatura válida consulta provedor e ignora valor/status enviados pelo POST',async()=>{
  const f=fixture();const response=await f.handler(await notification());
  assert.equal(response.status,200);assert.equal(f.records.length,1);
  assert.equal(f.records[0].p_status,'approved');assert.equal(f.records[0].p_amount,29900);
  assert.equal(f.records[0].p_request,request);
  assert.deepEqual(f.calls.sort(),['https://api.mercadopago.com/users/me','https://api.mercadopago.com/v1/payments/456'].sort());
});
for(const [label, overrides] of [
  ['sem assinatura',{headers:{'x-signature':''}}],
  ['HMAC incorreto',{headers:{'x-signature':`ts=1791710000,v1=${'0'.repeat(64)}`}}],
  ['ID adulterado',{url:'https://example.com?data.id=789'}],
  ['request id adulterado',{headers:{'x-request-id':'other'}}],
  ['ID com caminho',{url:'https://example.com?data.id=../../users/me'}],
]) test(`recusa ${label} antes de acessar provedor`,async()=>{
  const f=fixture();assert.equal((await f.handler(await notification(overrides))).status,401);
  assert.equal(f.calls.length,0);assert.equal(f.records.length,0);
});
for(const [label, override] of [
  ['pagamento real',{live_mode:true}],['sem ambiente',{live_mode:undefined}],
  ['outro vendedor',{collector_id:999}],['moeda estrangeira',{currency_id:'USD'}],
  ['valor fracionário inválido',{transaction_amount:1.001}],['valor fora do limite',{transaction_amount:0.01}],
  ['ID diferente',{id:999}],['sem vínculo',{external_reference:'unknown'}],
  ['metadata de outro pedido',{metadata:{...payment.metadata,package_request_id:'other'}}],
  ['metadata real',{metadata:{...payment.metadata,environment:'production'}}],
  ['créditos habilitados',{metadata:{...payment.metadata,grants_credits:true}}],
  ['status inválido',{status:'fake'}],['sem data',{date_last_updated:null}],
]) test(`não registra ${label}`,async()=>{
  const f=fixture({payment:override});assert.equal((await f.handler(await notification())).status,200);assert.equal(f.records.length,0);
});
test('rejeita conta real mesmo com live_mode falso e guarda estorno verificado',()=>{
  assert.equal(verifiedPayment(payment,{...seller,tags:[]},'456'),null);
  assert.equal(verifiedPayment({...payment,status:'refunded'},seller,'456').p_status,'refunded');
});
test('falhas transitórias pedem reentrega e não expõem segredos',async()=>{
  for(const override of [{providerFailure:true},{dbFailure:true}]){
    const f=fixture(override);const response=await f.handler(await notification());assert.equal(response.status,503);
    assert.doesNotMatch(await response.text(),/secret|private|token/);
  }
});
test('configuração incompleta, tópico diferente e IDs divergentes não gravam',async()=>{
  const disabled=fixture({env:{MERCADO_PAGO_TEST_ENABLED:'false'}});
  assert.equal((await disabled.handler(await notification())).status,503);assert.equal(disabled.calls.length,0);
  const f=fixture();
  assert.equal((await f.handler(await notification({body:{type:'merchant_order',data:{id:456}}}))).status,200);
  assert.equal((await f.handler(await notification({body:{type:'payment',data:{id:789}}}))).status,400);
  assert.equal(f.calls.length,0);
});
test('tentativa desconhecida é ignorada; duplicatas usam sempre a mesma identidade',async()=>{
  const unknown=fixture({result:'unknown_attempt'});
  assert.equal((await (await unknown.handler(await notification())).json()).result,'unknown_attempt');
  const f=fixture();await f.handler(await notification());await f.handler(await notification());
  assert.deepEqual(f.records[0],f.records[1]);
});
