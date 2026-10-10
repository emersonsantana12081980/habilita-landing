import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { money } from "../store-data";

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
  </section>;
}
