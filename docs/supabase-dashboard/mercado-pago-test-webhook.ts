// @ts-nocheck
// Gerado por scripts/build-mp-dashboard.mjs. Não inserir credenciais aqui.
const paymentStatuses = new Set(['pending', 'in_process', 'authorized', 'approved', 'rejected',
  'cancelled', 'refunded', 'charged_back', 'in_mediation']);
const numericId = value => typeof value === 'string' && /^[0-9]{1,30}$/.test(value);
const encoder = new TextEncoder();

export async function verifySignature(req, secret) {
  const id = new URL(req.url).searchParams.get('data.id');
  const requestId = req.headers.get('x-request-id');
  const signature = req.headers.get('x-signature') || '';
  if (!numericId(id) || !requestId || requestId.length > 200 || /[;\r\n]/.test(requestId)) return false;
  const parts = signature.split(',').map(p => p.trim().split('='));
  const timestamps = parts.filter(([k]) => k === 'ts');
  const hashes = parts.filter(([k]) => k === 'v1');
  if (timestamps.length !== 1 || hashes.length !== 1) return false;
  const ts = timestamps[0][1]; const hash = hashes[0][1];
  if (!/^\d{1,16}$/.test(ts || '') || !/^[a-f0-9]{64}$/i.test(hash || '')) return false;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = Uint8Array.from(hash.match(/../g), h => parseInt(h, 16));
  // Reentregas são permitidas. O banco deduplica por pagamento e data do provedor.
  return crypto.subtle.verify('HMAC', key, bytes,
    encoder.encode(`id:${id};request-id:${requestId};ts:${ts};`));
}

export function verifiedPayment(payment, seller, expectedId) {
  if (String(payment?.id) !== expectedId || payment.live_mode !== false ||
      seller?.site_id !== 'MLB' || !seller.tags?.includes('test_user') ||
      String(payment.collector_id) !== String(seller.id) ||
      !numericId(String(seller.id)) || payment.currency_id !== 'BRL' ||
      !paymentStatuses.has(payment.status)) return null;
  const match = /^habilita-test-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-[0-9a-f-]{36}$/.exec(payment.external_reference || '');
  if (!match || payment.metadata?.package_request_id !== match[1] ||
      payment.metadata?.environment !== 'test' || payment.metadata?.grants_credits !== false) return null;
  if (typeof payment.transaction_amount !== 'number' || !Number.isFinite(payment.transaction_amount)) return null;
  const amount = Math.round(payment.transaction_amount * 100);
  if (!Number.isSafeInteger(amount) || amount < 100 || amount > 1000000 ||
      Math.abs(payment.transaction_amount * 100 - amount) > 0.000001) return null;
  if (typeof payment.date_last_updated !== 'string' || !Number.isFinite(Date.parse(payment.date_last_updated))) return null;
  return { p_payment: expectedId, p_reference: payment.external_reference,
    p_collector: String(payment.collector_id), p_request: match[1], p_amount: amount,
    p_status: payment.status, p_updated: payment.date_last_updated };
}

export function createTestWebhookHandler({ env, recordPayment, fetchImpl = fetch }) {
  return async req => {
    const reply = (status, result) => Response.json(result, { status, headers: { 'Cache-Control': 'no-store' } });
    if (req.method !== 'POST') return reply(405, { error: 'POST obrigatório' });
    const secret = env('MERCADO_PAGO_WEBHOOK_SECRET_TEST')?.trim();
    const token = env('MERCADO_PAGO_ACCESS_TOKEN_TEST')?.trim();
    if (env('MERCADO_PAGO_TEST_ENABLED') !== 'true' || !secret || !token)
      return reply(503, { error: 'Webhook de teste não configurado' });
    try {
      if (!(await verifySignature(req, secret))) return reply(401, { error: 'Assinatura inválida' });
      // Só o ID assinado na URL é usado. Status, valor e usuário do POST não são confiáveis.
      const id = new URL(req.url).searchParams.get('data.id');
      const raw = await req.text();
      if (raw.length > 16384) return reply(413, { error: 'Notificação muito grande' });
      let body;
      try { body = JSON.parse(raw); } catch { return reply(400, { error: 'JSON inválido' }); }
      if (body?.type !== 'payment') return reply(200, { result: 'ignored_topic' });
      if (String(body?.data?.id) !== id) return reply(400, { error: 'Identificador divergente' });
      const get = async path => {
        const response = await fetchImpl(`https://api.mercadopago.com${path}`, {
          headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error('provider_unavailable');
        return response.json();
      };
      const [payment, seller] = await Promise.all([get(`/v1/payments/${id}`), get('/users/me')]);
      const verified = verifiedPayment(payment, seller, id);
      if (!verified) return reply(200, { result: 'ignored_payment' });
      const result = await recordPayment(verified);
      return reply(200, { result });
    } catch {
      // Falha temporária: permitir reentrega, sem expor resposta ou credencial.
      return reply(503, { error: 'Confirmação temporariamente indisponível' });
    }
  };
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";

Deno.serve(createTestWebhookHandler({
  env: (key: string) => Deno.env.get(key),
  recordPayment: async (args: Record<string, unknown>) => {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.rpc("record_mp_test_payment", args);
    if (error) throw error;
    return data;
  },
}));
