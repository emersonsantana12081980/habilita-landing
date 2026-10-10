import test from "node:test";
import assert from "node:assert/strict";
import { createTestCheckoutHandler, safeCheckoutUrl } from "../supabase/functions/mercado-pago-test-checkout/handler.js";

const id = "00000000-0000-4000-8000-000000000001";
function fixture(overrides = {}) {
  const calls = [];
  const env = { MERCADO_PAGO_TEST_ENABLED: "true", MERCADO_PAGO_ACCESS_TOKEN_TEST: "secret-fixture" };
  const order = { id, status: "pending", pricing_demo: true, price_cents: 26910,
    payment_method: "cash", installment_count: 1, package_name: "Carro com cupom" };
  const handler = createTestCheckoutHandler({
    env: key => ({ ...env, ...overrides.env })[key],
    authenticate: async () => overrides.user === undefined ? { id: "admin", role: "admin" } : overrides.user,
    loadOrder: async () => overrides.missingOrder ? null : { ...order, ...overrides.order },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (overrides.fail) return new Response("upstream secret diagnostic", { status: 500 });
      return Response.json(url.endsWith("/users/me") ? (overrides.seller || { site_id: "MLB", tags: ["test_user"] }) :
        { id: "pref-test", init_point: overrides.checkout || "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test" });
    },
  });
  const run = (body = { request_id: id }, headers = {}) => handler(new Request("https://example.com", {
    method: "POST", headers: { Authorization: "Bearer user-token", ...headers }, body: JSON.stringify(body),
  }));
  return { handler, run, calls };
}
test("checkout usa preço líquido do pedido e não envia dados reais do comprador", async () => {
  const f = fixture(); const response = await f.run(); const result = await response.json();
  assert.equal(response.status, 200); assert.equal(result.amount_cents, 26910); assert.equal(result.mode, "test");
  const preference = JSON.parse(f.calls[1].options.body);
  assert.equal(preference.items[0].unit_price, 269.10);
  assert.equal(preference.items[0].currency_id, "BRL");
  assert.equal(preference.payer, undefined);
  assert.equal(preference.metadata.grants_credits, false);
  assert.ok(preference.payment_methods.excluded_payment_types.some(t => t.id === "credit_card"));
  assert.match(preference.back_urls.success, /checkout=teste/);
  assert.ok(!JSON.stringify(result).includes("secret-fixture"));
});
test("cartão preserva máximo de parcelas contratado", async () => {
  const f = fixture({ order: { payment_method: "card", installment_count: 12 } });
  assert.equal((await f.run()).status, 200);
  const pref = JSON.parse(f.calls[1].options.body);
  assert.equal(pref.payment_methods.installments, 12);
  assert.ok(pref.payment_methods.excluded_payment_types.some(t => t.id === "bank_transfer"));
});
for (const [name, overrides, status] of [
  ["sessão inválida", { user: null }, 401],
  ["aluno comum", { user: { id: "student", role: "student" } }, 403],
  ["teste desativado", { env: { MERCADO_PAGO_TEST_ENABLED: "false" } }, 503],
  ["sem chave", { env: { MERCADO_PAGO_ACCESS_TOKEN_TEST: "" } }, 503],
  ["pedido de outro usuário ou aluno inativo", { missingOrder: true }, 409],
  ["pedido aprovado", { order: { status: "approved" } }, 409],
  ["preço real", { order: { pricing_demo: false } }, 409],
  ["preço negativo", { order: { price_cents: -1 } }, 409],
]) test(`bloqueia ${name} antes de acessar Mercado Pago`, async () => {
  const f = fixture(overrides); assert.equal((await f.run()).status, status); assert.equal(f.calls.length, 0);
});
test("recusa adulteração do preço enviada pelo navegador", async () => {
  const f = fixture(); assert.equal((await f.run({ request_id: id, price_cents: 1 })).status, 400);
  assert.equal(f.calls.length, 0);
});
test("recusa credencial de vendedor real antes de criar preferência", async () => {
  const f = fixture({ seller: { site_id: "MLB", tags: [] } });
  assert.equal((await f.run()).status, 409); assert.equal(f.calls.length, 1);
});
test("falha do provedor não expõe diagnóstico ou segredo", async () => {
  const f = fixture({ fail: true }); const response = await f.run();
  assert.equal(response.status, 502); assert.ok(!(await response.text()).includes("secret"));
});
test("valida origem, autenticação e destino do checkout", async () => {
  const f = fixture();
  assert.equal((await f.run(undefined, { Origin: "https://evil.example" })).status, 403);
  assert.equal((await f.run(undefined, { Authorization: "" })).status, 401);
  for (const url of ["javascript:alert(1)", "https://www.mercadopago.com.br.evil.example", "https://x@www.mercadopago.com.br", "http://www.mercadopago.com.br"])
    assert.equal(safeCheckoutUrl(url), false);
  assert.equal((await fixture({ checkout: "https://evil.example" }).run()).status, 502);
});
