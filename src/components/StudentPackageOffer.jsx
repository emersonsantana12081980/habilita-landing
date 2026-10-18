import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { money } from "../store-data";
import { PackagePrice } from "./PackagePrice";
import { splitInstallments } from "../lib/package-pricing";
export function StudentPackageOffer({ pack, pending, onRequested }) {
  const [expanded, setExpanded] = useState(false);
  const [method, setMethod] = useState("card"),
    [code, setCode] = useState(""),
    [quote, setQuote] = useState(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [installments, setInstallments] = useState(Math.max(1, Math.min(12, pack.card_installments || 1)));
  const dialog = useRef(null);
  useEffect(() => { if (expanded && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [expanded]);
  const single = Number(pack.lessons_a || 0) + Number(pack.lessons_b || 0) === 1;
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    setQuote(null);
  }, [
    pack.price_cents,
    pack.card_total_cents,
    pack.card_installments,
    pack.pricing_demo,
  ]);
  function change(fn) {
    generation.current++;
    setQuote(null);
    setMessage("");
    fn();
  }
  const normalized = code.trim().toUpperCase();
  function errorMessage(error) {
    return error.code === "P0001"
      ? error.message
      : error.code === "PGRST202"
        ? "Preços e cupons precisam ser ativados no Supabase. Peça à equipe para aplicar a atualização."
        : "Não foi possível confirmar. Atualize a página para conferir antes de tentar novamente.";
  }
  async function calculate() {
    if (busy) return;
    const revision = ++generation.current;
    setBusy(true);
    setMessage("");
    setQuote(null);
    try {
      const { data, error } = await supabase.rpc("quote_package", {
        p_package: pack.id,
        p_coupon: normalized,
        p_method: method,
      });
      if (error) throw error;
      if (!data?.[0]) throw new Error("missing quote");
      if (revision === generation.current) {
        setQuote(data[0]);
        setMessage(
          normalized
            ? "Cupom aplicado. Confira o resumo."
            : "Valores conferidos.",
        );
      }
    } catch (e) {
      if (revision === generation.current) setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const split = quote
    ? splitInstallments(quote.total_cents, method === "card" ? installments : 1)
    : null;
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-semibold text-green-800">{single ? 'Aula avulsa' : 'Pacote de aulas'}</p>
          <h2 className="mt-1 text-lg font-bold">{pack.name}</h2>
          <p className="mt-1 text-sm text-slate-600">{pack.lessons_a > 0 && `${pack.lessons_a} aula(s) de moto `}{pack.lessons_b > 0 && `${pack.lessons_b} aula(s) de carro`}</p>
        </div>
        <div className="sm:ml-auto"><strong className="text-xl text-green-800">{money(pack.price_cents / 100)}</strong><span className="ml-2 text-sm">à vista</span>
          {pack.card_total_cents > 0 && <p className="text-sm text-slate-600">ou até {pack.card_installments || 1}x de {money(Math.ceil(pack.card_total_cents / (pack.card_installments || 1)) / 100)}</p>}
        </div>
        <button className="btn btn-green" disabled={pending} onClick={() => setExpanded(true)}>{pending ? 'Em análise' : single ? 'Contratar 1 aula' : 'Escolher este pacote'}</button>
      </div>
      {pending && <p className="mt-2 text-sm">Você já tem uma solicitação pendente deste pacote.</p>}
      {expanded && <dialog ref={dialog} aria-label={`Contratar ${pack.name}`} onCancel={e => { if (busy) e.preventDefault(); else setExpanded(false); }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl p-6 text-slate-900 shadow-xl backdrop:bg-black/50">
        <div className="flex items-start justify-between gap-3"><h2 className="text-xl font-bold">{pack.name}</h2><button type="button" disabled={busy} className="btn btn-outline" onClick={() => setExpanded(false)}>Fechar</button></div>
        <PackagePrice pack={pack} showDemoLabel={false} savedOnly/>
          <fieldset disabled={busy} className="space-y-3">
            <label>
              Forma de pagamento
              <select
                value={method}
                onChange={(e) => change(() => setMethod(e.target.value))}
              >
                <option value="card">Cartão de crédito — link pelo WhatsApp</option>
                <option value="cash">Pix à vista</option>
              </select>
            </label>
            {method === 'card' && <>
              <label>Quantidade de parcelas<select value={installments} onChange={e => setInstallments(Number(e.target.value))}>
                {Array.from({length:Math.max(1,Math.min(12,pack.card_installments || 1))},(_,i) => <option key={i+1} value={i+1}>{i+1}x</option>)}
              </select></label>
              <p className="text-sm">A equipe enviará o link de pagamento pelo WhatsApp cadastrado. O pedido ficará em análise até a confirmação do pagamento. O total do cartão é o apresentado abaixo, dividido nas parcelas escolhidas.</p>
            </>}
            {method === 'cash' && <p className="text-sm">Ao continuar, abriremos o Pix para copiar e anexar o comprovante. A equipe conferirá o pagamento antes de liberar o pacote.</p>}
            <label>
              Cupom de desconto (opcional)
              <input
                maxLength={30}
                autoComplete="off"
                value={code}
                placeholder="Digite seu cupom"
                onChange={(e) =>
                  change(() => setCode(e.target.value.toUpperCase()))
                }
              />
            </label>
            <button className="btn btn-outline w-full" onClick={calculate}>
              {normalized ? "Aplicar cupom" : "Conferir valor"}
            </button>
          </fieldset>
          {message && (
            <p role="status" className="mt-3 text-sm">
              {message}
            </p>
          )}
          {quote && (
            <div className="my-4 rounded-xl bg-green-50 p-4 text-sm">
              <p>Valor original: {money(quote.original_cents / 100)}</p>
              <p>
                Desconto{quote.coupon_code ? ` (${quote.coupon_code})` : ""}: −{" "}
                {money(quote.discount_cents / 100)}
              </p>
              <p className="mt-2 text-lg font-bold text-green-900">
                Total: {money(quote.total_cents / 100)}
              </p>
              {method === "card" && split && (
                <p className="mt-2">
                  {split.higher > 0
                    ? `${split.higher}x de ${money((split.base + 1) / 100)} + ${split.count - split.higher}x de ${money(split.base / 100)}`
                    : `${split.count}x de ${money(split.base / 100)}`}
                </p>
              )}
            </div>
          )}
          <button
            className="btn btn-green mt-4 w-full"
            disabled={busy || !quote}
            onClick={async () => {
              if (busy || !quote) return;
              setBusy(true);
              setMessage("");
              try {
                const { data: requestId, error } = await supabase.rpc("request_manual_package", {
                  p_package: pack.id,
                  p_coupon: normalized,
                  p_method: method,
                  p_expected_total: quote.total_cents,
                  p_expected_installments: quote.installment_count,
                  p_installments: method === "card" ? installments : 1,
                });
                if (error) throw error;
                if (!requestId) throw new Error("missing request");
                setExpanded(false);
                await onRequested(requestId);
                setQuote(null);
                setMessage("Solicitação enviada. Aguarde a análise da equipe.");
              } catch (e) {
                setQuote(null);
                setMessage(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Aguarde…" : "Continuar para pagamento"}
          </button>
          {!quote && (
            <p className="mt-2 text-xs text-slate-500">
              Confira o valor ou aplique o cupom para continuar. O pagamento será acompanhado manualmente pela equipe.
            </p>
          )}
      </dialog>}
    </article>
  );
}
