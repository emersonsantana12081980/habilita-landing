import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { money } from "../store-data";
import { PackagePrice } from "./PackagePrice";
import { splitInstallments } from "../lib/package-pricing";
export function StudentPackageOffer({ pack, pending, onRequested }) {
  const [method, setMethod] = useState("card"),
    [code, setCode] = useState(""),
    [quote, setQuote] = useState(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
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
    ? splitInstallments(quote.total_cents, quote.installment_count)
    : null;
  return (
    <article className="admin-card min-w-0">
      <h2 className="text-xl font-bold">{pack.name}</h2>
      <p className="mt-3 text-sm">
        {pack.lessons_a > 0 && `${pack.lessons_a} aulas de moto `}
        {pack.lessons_b > 0 && `${pack.lessons_b} aulas de carro`}
      </p>
      <PackagePrice pack={pack} />
      {pending ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm">
          Você já tem uma solicitação pendente deste pacote.
        </p>
      ) : (
        <>
          <fieldset disabled={busy} className="space-y-3">
            <label>
              Forma de pagamento
              <select
                value={method}
                onChange={(e) => change(() => setMethod(e.target.value))}
              >
                <option value="card">Parcelado no cartão</option>
                <option value="cash">À vista</option>
              </select>
            </label>
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
              {quote.pricing_demo && (
                <p className="mt-2 text-xs font-bold text-amber-900">
                  Simulação com valores fictícios. Nenhuma cobrança será feita.
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
                const { error } = await supabase.rpc("request_package_offer", {
                  p_package: pack.id,
                  p_coupon: normalized,
                  p_method: method,
                  p_expected_total: quote.total_cents,
                  p_expected_installments: quote.installment_count,
                });
                if (error) throw error;
                await onRequested();
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
            {busy ? "Aguarde…" : "Solicitar pacote"}
          </button>
          {!quote && (
            <p className="mt-2 text-xs text-slate-500">
              Confira o valor ou aplique o cupom para continuar.
            </p>
          )}
        </>
      )}
    </article>
  );
}
