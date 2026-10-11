// Primeira etapa: checkout de TESTE, restrito ao administrador.
// Não registra recebimentos, não aprova pedidos e não concede créditos.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const checkoutHosts = new Set(["www.mercadopago.com.br", "sandbox.mercadopago.com.br"]);

// Somente identificadores conhecidos podem sair da resposta do provedor.
// Não repassar mensagens brutas: podem conter dados pessoais ou credenciais.
const providerErrors = {
  collector_does_not_comply_with_current_regulation: "A conta do vendedor de teste tem uma pendência indicada pelo Mercado Pago. Confira essa conta no painel Developers.",
  invalid_collector_id: "O Mercado Pago recusou a identificação do vendedor vinculado à credencial.",
  invalid_collector_email: "O Mercado Pago recusou o e-mail vinculado ao vendedor de teste.",
  invalid_access_token: "O Mercado Pago recusou o Access Token usado nesta operação.",
  invalid_payment_methods: "O Mercado Pago recusou a configuração de meios de pagamento ou parcelas.",
  invalid_items: "O Mercado Pago recusou os dados ou o valor do pacote enviado.",
  invalid_back_urls: "O Mercado Pago recusou os endereços de retorno. Confira o SITE_URL nos Secrets.",
  invalid_auto_return: "O Mercado Pago recusou a configuração de retorno automático ao site.",
  invalid_expiration_date_from: "O Mercado Pago recusou a data inicial de validade do checkout.",
  invalid_expiration_date_to: "O Mercado Pago recusou a data final de validade do checkout.",
  invalid_date: "O Mercado Pago recusou o período de validade do checkout.",
  invalid_operation_type: "O Mercado Pago recusou o tipo de operação da aplicação.",
};

export function knownProviderError(body) {
  if (!body || typeof body !== "object") return null;
  const causes = Array.isArray(body.cause) ? body.cause.slice(0, 10) : [];
  const candidates = [body.error, body.code, body.message,
    ...causes.flatMap(c => [c?.code, c?.description])];
  // Correspondência exata: não procurar substrings em mensagens sensíveis.
  return candidates.find(value => typeof value === "string" &&
    Object.hasOwn(providerErrors, value)) || null;
}

class ProviderFailure extends Error {
  constructor(status, reason = null) {
    super("provider_error"); this.status = status; this.reason = reason;
  }
}

function diagnostic(stage, error) {
  const status = error instanceof ProviderFailure ? error.status : null;
  const reason = error instanceof ProviderFailure ? error.reason : null;
  const code = `${stage}${status ? `_${status}` : ""}${reason ? `_${reason}` : ""}`;
  let message = {
    AUTH: "Não foi possível verificar o acesso administrativo no Supabase.",
    ORDER: "Não foi possível consultar o pedido no Supabase.",
    REGISTER: "Não foi possível registrar a tentativa. Confira se o SQL de confirmação de testes foi aplicado.",
    SELLER: "Não foi possível consultar o vendedor de teste no Mercado Pago.",
    CONFIG: "Confira o SITE_URL: deve ser o endereço HTTPS do site.",
    PREFERENCE: "O Mercado Pago não conseguiu criar o checkout de teste.",
    CHECKOUT_URL: "O Mercado Pago retornou um endereço de checkout inesperado.",
  }[stage] || "Não foi possível concluir o teste.";
  if (status === 401) message = "O Mercado Pago recusou a credencial. Copie novamente o Access Token de teste para MERCADO_PAGO_ACCESS_TOKEN_TEST nos Secrets do Supabase.";
  else if (status === 403) message = "O Mercado Pago negou acesso à operação. Confira as permissões da aplicação e a conta de teste vinculada à credencial.";
  else if (status === 429) message = "O Mercado Pago limitou as tentativas. Aguarde antes de tentar novamente.";
  else if (stage === "PREFERENCE" && status === 400) message = "O Mercado Pago recusou a configuração enviada para o checkout. Precisamos revisar os parâmetros da integração.";
  else if (["TimeoutError", "AbortError"].includes(error?.name)) message = "A consulta demorou além do limite. Aguarde e tente novamente.";
  if (reason) message = providerErrors[reason];
  return { error: `${message} Código: ${code}. Revisão: MP-04.`, code, revision: "MP-04" };
}

export function safeCheckoutUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      !url.port && checkoutHosts.has(url.hostname);
  } catch { return false; }
}

export function createTestCheckoutHandler({ env, authenticate, loadOrder, registerAttempt, fetchImpl = fetch }) {
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
    let stage = "AUTH";
    try {
      const user = await authenticate(req.headers.get("authorization"));
      if (!user) return reply(401, { error: "Entre novamente na sua conta." });
      if (user.role !== "admin") return reply(403, { error: "Teste disponível somente para a administração." });
      if (env("MERCADO_PAGO_TEST_ENABLED") !== "true")
        return reply(503, { error: "O checkout de teste ainda não foi ativado no servidor." });
      const token = env("MERCADO_PAGO_ACCESS_TOKEN_TEST")?.trim();
      if (!token) return reply(503, { error: "Configure a credencial de teste no servidor." });
      if (["true", "false"].includes(token.toLowerCase()) || /\s/.test(token))
        return reply(503, { error: "MERCADO_PAGO_ACCESS_TOKEN_TEST precisa conter o Access Token copiado do Mercado Pago, sem espaços. O valor true pertence somente a MERCADO_PAGO_TEST_ENABLED.", code: "TOKEN_FORMAT" });
      let input;
      try {
        const raw = await req.text();
        if (raw.length > 1024) return reply(400, { error: "Solicitação inválida." });
        input = JSON.parse(raw);
      } catch { return reply(400, { error: "Solicitação inválida." }); }
      if (!uuid.test(input?.request_id) || Object.keys(input).some(k => k !== "request_id"))
        return reply(400, { error: "Envie somente o identificador do pedido." });
      // O navegador não escolhe o valor, desconto, titular, método ou parcelas.
      stage = "ORDER";
      const order = await loadOrder(user.id, input.request_id, req.headers.get("authorization"));
      if (!order || order.status !== "pending" || order.pricing_demo !== true)
        return reply(409, { error: "Selecione um pedido pendente com valores de demonstração da sua própria conta." });
      if (!Number.isSafeInteger(order.price_cents) || order.price_cents < 100 || order.price_cents > 1000000)
        return reply(409, { error: "O pedido de teste deve ter valor entre R$ 1,00 e R$ 10.000,00. Selecione outro pedido ou solicite um novo pacote com o valor corrigido." });
      if (
          !["cash", "card"].includes(order.payment_method) ||
          !Number.isInteger(order.installment_count) || order.installment_count < 1 || order.installment_count > 12)
        return reply(409, { error: "Confira os valores e as condições cadastradas no pedido." });
      const mp = async (path, options = {}) => {
        const response = await fetchImpl(`https://api.mercadopago.com${path}`, {
          ...options,
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) {
          let reason = null;
          try { reason = knownProviderError(await response.json()); } catch { /* erro não JSON */ }
          throw new ProviderFailure(response.status, reason);
        }
        return response.json();
      };
      // APP_USR também pode pertencer a vendedor fictício. O prefixo não prova
      // ambiente de teste: validamos a identidade no provedor antes de criar.
      stage = "SELLER";
      const seller = await mp("/users/me");
      if (seller.site_id !== "MLB" || !seller.tags?.includes("test_user"))
        return reply(409, { error: "A credencial deve pertencer a um vendedor de teste brasileiro. Nenhum checkout foi criado." });
      stage = "CONFIG";
      const back = new URL("/aluno?checkout=teste", site).href;
      if (!back.startsWith("https://")) return reply(503, { error: "Configure o endereço HTTPS de retorno." });
      // Preferences não permite excluir saldo da conta (account_money).
      // Não confundir essa restrição com a configuração da API de Orders.
      const types = ["ticket", "atm", "debit_card", "prepaid_card", "digital_currency",
        order.payment_method === "cash" ? "credit_card" : "bank_transfer"];
      // Período completo, com offset explícito no formato mostrado na documentação.
      // Margem de um minuto evita que o início fique no futuro por diferença de relógio.
      const now = Date.now();
      const providerDate = ms => new Date(ms).toISOString().replace("Z", "+00:00");
      const reference = `habilita-test-${order.id}-${crypto.randomUUID()}`;
      // A tentativa registrada vincula o callback ao pedido e ao preço desta compra.
      stage = "REGISTER";
      await registerAttempt({ p_request: order.id, p_reference: reference,
        p_collector: String(seller.id), p_amount: order.price_cents });
      stage = "CONFIG";
      const notification = new URL('/functions/v1/mercado-pago-test-webhook', env('SUPABASE_URL'));
      if (notification.protocol !== 'https:') throw new Error('invalid_notification_url');
      notification.searchParams.set('source_news', 'webhooks');
      stage = "PREFERENCE";
      const preference = await mp("/checkout/preferences", {
        method: "POST",
        body: JSON.stringify({
          items: [{ id: order.id, title: `[TESTE] ${order.package_name}`.slice(0, 120),
            quantity: 1, currency_id: "BRL", unit_price: order.price_cents / 100 }],
          external_reference: reference,
          notification_url: notification.href,
          metadata: { package_request_id: order.id, environment: "test", grants_credits: false },
          back_urls: { success: back, pending: back, failure: back },
          auto_return: "approved",
          payment_methods: { excluded_payment_types: types.map(id => ({ id })),
            installments: order.payment_method === "card" ? order.installment_count : 1 },
          expires: true,
          expiration_date_from: providerDate(now - 60 * 1000),
          expiration_date_to: providerDate(now + 30 * 60 * 1000),
        }),
      });
      stage = "CHECKOUT_URL";
      if (!preference.id || !safeCheckoutUrl(preference.init_point)) throw new Error("invalid_checkout");
      return reply(200, { mode: "test", checkout_url: preference.init_point, preference_id: preference.id,
        amount_cents: order.price_cents });
    } catch (error) {
      // Nunca devolver credenciais, dados do provedor ou detalhes de autenticação.
      return reply(502, diagnostic(stage, error));
    }
  };
}
