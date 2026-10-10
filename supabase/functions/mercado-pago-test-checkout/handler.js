// Primeira etapa: checkout de TESTE, restrito ao administrador.
// Não registra recebimentos, não aprova pedidos e não concede créditos.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const checkoutHosts = new Set(["www.mercadopago.com.br", "sandbox.mercadopago.com.br"]);

export function safeCheckoutUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      !url.port && checkoutHosts.has(url.hostname);
  } catch { return false; }
}

export function createTestCheckoutHandler({ env, authenticate, loadOrder, fetchImpl = fetch }) {
  return async (req) => {
    const site = env("SITE_URL") || "https://habilita-landing.vercel.app";
    const allowed = new Set([site, "http://localhost:5173", "http://127.0.0.1:4174"]);
    const origin = req.headers.get("origin");
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Vary": "Origin",
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      ...(allowed.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    };
    const reply = (status, data) => new Response(JSON.stringify(data), { status, headers });
    if (origin && !allowed.has(origin)) return reply(403, { error: "Origem não permitida." });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (req.method !== "POST") return reply(405, { error: "Método não permitido." });
    if (!req.headers.get("authorization")?.startsWith("Bearer "))
      return reply(401, { error: "Entre novamente na sua conta." });
    try {
      const user = await authenticate(req.headers.get("authorization"));
      if (!user) return reply(401, { error: "Entre novamente na sua conta." });
      if (user.role !== "admin") return reply(403, { error: "Teste disponível somente para a administração." });
      if (env("MERCADO_PAGO_TEST_ENABLED") !== "true")
        return reply(503, { error: "O checkout de teste ainda não foi ativado no servidor." });
      const token = env("MERCADO_PAGO_ACCESS_TOKEN_TEST");
      if (!token) return reply(503, { error: "Configure a credencial de teste no servidor." });
      let input;
      try {
        const raw = await req.text();
        if (raw.length > 1024) return reply(400, { error: "Solicitação inválida." });
        input = JSON.parse(raw);
      } catch { return reply(400, { error: "Solicitação inválida." }); }
      if (!uuid.test(input?.request_id) || Object.keys(input).some(k => k !== "request_id"))
        return reply(400, { error: "Envie somente o identificador do pedido." });
      // O navegador não escolhe o valor, desconto, titular, método ou parcelas.
      const order = await loadOrder(user.id, input.request_id, req.headers.get("authorization"));
      if (!order || order.status !== "pending" || order.pricing_demo !== true)
        return reply(409, { error: "Selecione um pedido pendente com valores de demonstração da sua própria conta." });
      if (!Number.isSafeInteger(order.price_cents) || order.price_cents < 100 || order.price_cents > 1000000 ||
          !["cash", "card"].includes(order.payment_method) ||
          !Number.isInteger(order.installment_count) || order.installment_count < 1 || order.installment_count > 12)
        return reply(409, { error: "Confira os valores e as condições cadastradas no pedido." });
      const mp = async (path, options = {}) => {
        const response = await fetchImpl(`https://api.mercadopago.com${path}`, {
          ...options,
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error("provider_error");
        return response.json();
      };
      // APP_USR também pode pertencer a vendedor fictício. O prefixo não prova
      // ambiente de teste: validamos a identidade no provedor antes de criar.
      const seller = await mp("/users/me");
      if (seller.site_id !== "MLB" || !seller.tags?.includes("test_user"))
        return reply(409, { error: "A credencial deve pertencer a um vendedor de teste brasileiro. Nenhum checkout foi criado." });
      const back = new URL("/aluno?checkout=teste", site).href;
      if (!back.startsWith("https://")) return reply(503, { error: "Configure o endereço HTTPS de retorno." });
      const types = ["ticket", "atm", "debit_card", "prepaid_card", "account_money", "digital_currency",
        order.payment_method === "cash" ? "credit_card" : "bank_transfer"];
      const preference = await mp("/checkout/preferences", {
        method: "POST",
        body: JSON.stringify({
          items: [{ id: order.id, title: `[TESTE] ${order.package_name}`.slice(0, 120),
            quantity: 1, currency_id: "BRL", unit_price: order.price_cents / 100 }],
          external_reference: `habilita-test-${order.id}-${crypto.randomUUID()}`,
          metadata: { package_request_id: order.id, environment: "test", grants_credits: false },
          back_urls: { success: back, pending: back, failure: back },
          auto_return: "approved",
          payment_methods: { excluded_payment_types: types.map(id => ({ id })),
            installments: order.payment_method === "card" ? order.installment_count : 1 },
          expires: true,
          expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }),
      });
      if (!preference.id || !safeCheckoutUrl(preference.init_point)) throw new Error("invalid_checkout");
      return reply(200, { mode: "test", checkout_url: preference.init_point, preference_id: preference.id,
        amount_cents: order.price_cents });
    } catch {
      // Nunca devolver credenciais, dados do provedor ou detalhes de autenticação.
      return reply(502, { error: "Não foi possível abrir o teste. Confira a configuração ou tente novamente mais tarde." });
    }
  };
}
