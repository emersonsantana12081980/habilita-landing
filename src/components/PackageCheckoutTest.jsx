import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { money } from "../store-data";

const paymentLabels = {
  approved: 'Aprovado no teste', pending: 'Pendente', in_process: 'Em análise',
  authorized: 'Autorizado, aguardando captura', rejected: 'Recusado', cancelled: 'Cancelado',
  refunded: 'Estornado', charged_back: 'Contestado', in_mediation: 'Em mediação',
};

function TestPaymentResults({ requests }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    setLoading(true);
    setError('');
    supabase.from('mp_test_payments')
      .select('payment_id,request_id,amount_cents,status,confirmed_at')
      .order('confirmed_at', { ascending: false }).limit(10)
      .abortSignal(controller.signal)
      .then(({ data, error: problem }) => {
        if (!alive) return;
        if (problem) setError('Não foi possível consultar as confirmações. Confira a instalação do SQL e tente atualizar.');
        else setPayments(data || []);
      }).catch(() => {
        if (alive) setError('Não foi possível consultar as confirmações. Tente novamente.');
      }).finally(() => { clearTimeout(timeout); if (alive) setLoading(false); });
    return () => { alive = false; clearTimeout(timeout); controller.abort(); };
  }, [refresh]);
  return <div className="mt-5 border-t border-amber-200 pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-base font-bold">Confirmações do Mercado Pago</h3>
      <button className="btn" disabled={loading} onClick={() => setRefresh(n => n + 1)}>
        {loading ? 'Consultando…' : 'Atualizar pagamentos'}
      </button>
    </div>
    <p className="mt-2 text-sm">Somente resultados verificados pelo servidor. Testes não adicionam saldo nem créditos de aulas.</p>
    {error ? <p role="status" className="mt-2 text-sm text-red-800">{error}</p> :
      !loading && !payments.length ? <p role="status" className="mt-3 text-sm">Nenhuma confirmação recebida. Após pagar, aguarde a notificação e clique em atualizar.</p> :
      <ul className="mt-3 space-y-2" aria-label="Pagamentos de teste confirmados">
        {payments.map(payment => <li key={payment.payment_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-sm">
          <div><strong>{requests.find(r => r.id === payment.request_id)?.package_name || 'Pedido de teste'}</strong>
            <p>Pagamento {payment.payment_id} · {money(payment.amount_cents / 100)}</p></div>
          <span className={`rounded-full px-3 py-1 font-semibold ${payment.status === 'approved' ? 'bg-green-100 text-green-900' : 'bg-slate-100 text-slate-800'}`}>
            {paymentLabels[payment.status] || 'Aguardando confirmação'}
          </span>
        </li>)}
      </ul>}
  </div>;
}

export function PackageCheckoutTest({ requests }) {
  const [admin, setAdmin] = useState(false);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    let alive = true;
    supabase.rpc("my_access_role").then(({ data, error }) => {
      if (alive && !error) setAdmin(data === "admin");
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const eligible = requests.filter(r => r.status === "pending" && r.pricing_demo === true);
  const order = eligible.find(r => r.id === selected) || eligible[0];
  if (!admin) return null;
  async function open() {
    if (lock.current || !order) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("mercado-pago-test-checkout", {
        body: { request_id: order.id },
      });
      if (error) {
        let detail;
        try { detail = await error.context?.json(); } catch { /* transport failure */ }
        throw new Error(detail?.error || "Checkout de teste indisponível. A função precisa estar publicada e configurada no Supabase.");
      }
      const url = new URL(data?.checkout_url);
      if (data.mode !== "test" || url.protocol !== "https:" || url.username || url.password || url.port ||
        !["www.mercadopago.com.br", "sandbox.mercadopago.com.br"].includes(url.hostname))
        throw new Error("O servidor não retornou um checkout de teste válido.");
      window.location.assign(url.href);
    } catch (error) {
      setMessage(error.message || "Não foi possível abrir o checkout de teste.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return <section aria-label="Teste de pagamento do administrador" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
    <h2 className="font-bold">Mercado Pago · teste da administração</h2>
    <p className="mt-2 text-sm">Use comprador e cartão de teste. Esta etapa não libera aulas nem registra recebimentos reais.</p>
    {eligible.length ? <>
      <label className="mt-3 block text-sm">Pedido de demonstração
        <select disabled={busy} value={order.id} onChange={e => { setSelected(e.target.value); setMessage(""); }}>
          {eligible.map(r => <option key={r.id} value={r.id}>{r.package_name} · {money(r.price_cents / 100)}</option>)}
        </select>
      </label>
      <p className="mt-3 text-xl font-bold">Total do pedido: {money(order.price_cents / 100)}</p>
      <p className="mt-1 text-sm">{order.payment_method === "card" ? "Cartão: confira parcelas e eventuais juros no checkout de teste." : "À vista · Pix (conforme disponibilidade no ambiente de teste)."}</p>
      <button disabled={busy} onClick={open} className="btn btn-green mt-3">{busy ? "Abrindo teste…" : "Testar pagamento do pacote"}</button>
    </> : <p className="mt-3 text-sm">Solicite um pacote com valores fictícios nesta conta para testar. O pedido precisa estar pendente.</p>}
    {message && <p role="status" className="mt-3 text-sm text-red-800">{message}</p>}
    <TestPaymentResults requests={requests} />
  </section>;
}
