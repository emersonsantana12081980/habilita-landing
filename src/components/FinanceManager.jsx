import React, { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { money } from "../store-data";
import { localDay } from "../management";
import {
  PAYMENT_METHODS,
  financeSummary,
  installmentBalance,
  makeInvoice,
  makePayment,
} from "../finance";

const currency = (n) => money(n / 100);
const dateLabel = (s) => new Date(`${s}T12:00:00`).toLocaleDateString("pt-BR");
const newSale = () => ({
  clientId: "",
  description: "",
  amount: "",
  count: 1,
  date: localDay(),
  due: localDay(),
});
export function FinanceManager({ data, update }) {
  const [month, setMonth] = useState(localDay().slice(0, 7));
  const [form, setForm] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");
  const summary = financeSummary(data, month);
  function saveSale(e) {
    e.preventDefault();
    let reason = "";
    const saved = update((current) => {
      const result = makeInvoice(current, form, crypto.randomUUID());
      if (result.error) {
        reason = result.error;
        return null;
      }
      return { invoices: [...current.invoices, result.invoice] };
    });
    setStatus(
      saved
        ? "Venda registrada. As parcelas já estão no contas a receber."
        : reason || "Não foi possível salvar.",
    );
    if (saved) {
      setForm(null);
      setFilter("open");
    }
  }
  function receive(e) {
    e.preventDefault();
    let reason = "";
    const saved = update((current) => {
      const result = makePayment(current, receipt, crypto.randomUUID());
      if (result.error) {
        reason = result.error;
        return null;
      }
      return { payments: [...current.payments, result.payment] };
    });
    setStatus(
      saved ? "Recebimento registrado." : reason || "Não foi possível salvar.",
    );
    if (saved) setReceipt(null);
  }
  function cancel(id) {
    if (!window.confirm("Cancelar esta venda? O histórico será preservado."))
      return;
    let reason = "";
    const saved = update((current) => {
      if (
        current.payments.some(
          (p) => p.invoiceId === id && p.status === "received",
        )
      ) {
        reason =
          "Estorne os registros de recebimento antes de cancelar a venda.";
        return null;
      }
      return {
        invoices: current.invoices.map((i) =>
          i.id === id ? { ...i, status: "cancelled" } : i,
        ),
      };
    });
    setStatus(
      saved ? "Venda cancelada." : reason || "Não foi possível cancelar.",
    );
  }
  function reverse(id) {
    if (
      !window.confirm(
        "Estornar este registro? Isso reabre o saldo, mas não devolve dinheiro ao cliente.",
      )
    )
      return;
    if (
      update((current) => ({
        payments: current.payments.map((p) =>
          p.id === id && p.status === "received"
            ? { ...p, status: "void", voidedAt: new Date().toISOString() }
            : p,
        ),
      }))
    )
      setStatus("Registro estornado. Nenhuma devolução bancária foi efetuada.");
  }
  const matches = data.invoices.filter((i) => {
    const remaining = i.installments.reduce(
      (n, p) => n + installmentBalance(data, i, p).remaining,
      0,
    );
    const state =
      filter === "all" ||
      (filter === "cancelled" && i.status === "cancelled") ||
      (i.status === "active" &&
        ((filter === "open" && remaining > 0) ||
          (filter === "paid" && remaining === 0) ||
          (filter === "overdue" &&
            i.installments.some(
              (p) =>
                p.due < localDay() &&
                installmentBalance(data, i, p).remaining > 0,
            ))));
    return (
      state &&
      `${i.clientName} ${i.description}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR"))
    );
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="admin-title">
            <Wallet size={22} /> Faturamento
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Vendas, parcelas e recebimentos dos seus clientes.
          </p>
        </div>
        <button
          className="btn btn-green"
          onClick={() => {
            setForm(newSale());
            setReceipt(null);
            setStatus("");
          }}
        >
          <Plus size={17} /> Nova venda
        </button>
      </div>
      <p className="rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-900">
        Controle manual de valores brutos, sem taxas ou despesas. Não gera Pix,
        boleto ou nota fiscal e não cobra o cliente. Registrar uma venda não
        altera o saldo de aulas.
      </p>
      {status && (
        <p
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm"
        >
          {status}
        </p>
      )}
      <label className="max-w-xs">
        Mês do resumo
        <input
          type="month"
          required
          value={month}
          onChange={(e) => {
            if (e.target.value) setMonth(e.target.value);
          }}
        />
      </label>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Vendido no mês", summary.sold, "Data da venda"],
          ["Recebido no mês", summary.received, "Data do recebimento"],
          ["Saldo a receber", summary.outstanding, "Todos os períodos"],
          ["Em atraso", summary.overdue, "Vencido até ontem"],
        ].map(([title, value, note]) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
          >
            <p className="text-xs text-slate-500">{title}</p>
            <p className="mt-2 break-words text-xl font-extrabold tracking-tight sm:text-2xl">
              {currency(value)}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">{note}</p>
          </div>
        ))}
      </div>
      {form && (
        <section className="admin-card">
          <h3 className="admin-title">Registrar venda</h3>
          <form onSubmit={saveSale} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label>
              Cliente da venda
              <select
                required
                value={form.clientId}
                onChange={(e) => {
                  const c = data.clients.find((c) => c.id === e.target.value);
                  const p = data.packages.find((p) => p.id === c?.packageId);
                  setForm({
                    ...form,
                    clientId: e.target.value,
                    description: c?.packageName || "Aulas práticas",
                    amount: p ? String(p.price) : "",
                  });
                }}
              >
                <option value="">Selecione um cliente</option>
                {data.clients
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Descrição da venda
              <input
                required
                maxLength={100}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <label>
              Valor total (R$)
              <input
                required
                type="number"
                min="0.01"
                max="9999999.99"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </label>
            <label>
              Quantidade de parcelas
              <select
                value={form.count}
                onChange={(e) =>
                  setForm({ ...form, count: Number(e.target.value) })
                }
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1} {i ? "parcelas mensais" : "parcela"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Data da venda
              <input
                required
                type="date"
                max={localDay()}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <label>
              Primeiro vencimento
              <input
                required
                type="date"
                min={form.date}
                value={form.due}
                onChange={(e) => setForm({ ...form, due: e.target.value })}
              />
            </label>
            <p className="text-xs leading-5 text-slate-500 sm:col-span-2">
              Confira o valor combinado com o cliente. O preço do pacote é
              apenas uma sugestão; a venda guarda o valor informado. Parcelas
              mensais, sem cálculo de juros. Diferenças de centavos ficam nas
              primeiras parcelas.
            </p>
            {!data.clients.some((c) => c.active) && (
              <p className="text-sm text-amber-800 sm:col-span-2">
                Cadastre um cliente ativo na aba Clientes para registrar a
                venda.
              </p>
            )}
            <div className="flex gap-3 sm:col-span-2">
              <button className="btn btn-green">Salvar venda</button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setForm(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}
      {receipt && (
        <section className="admin-card">
          <h3 className="admin-title">Registrar recebimento</h3>
          <p className="mt-3 text-sm font-semibold">{receipt.label}</p>
          <form onSubmit={receive} className="mt-5 grid gap-4 sm:grid-cols-3">
            <label>
              Valor recebido (R$)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={receipt.amount}
                onChange={(e) =>
                  setReceipt({ ...receipt, amount: e.target.value })
                }
              />
            </label>
            <label>
              Data do recebimento
              <input
                required
                type="date"
                max={localDay()}
                value={receipt.date}
                onChange={(e) =>
                  setReceipt({ ...receipt, date: e.target.value })
                }
              />
            </label>
            <label>
              Forma de pagamento
              <select
                value={receipt.method}
                onChange={(e) =>
                  setReceipt({ ...receipt, method: e.target.value })
                }
              >
                {Object.entries(PAYMENT_METHODS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-3 sm:col-span-3">
              <button className="btn btn-green">Confirmar recebimento</button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setReceipt(null)}
              >
                Fechar
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="admin-card">
        <h3 className="admin-title">Contas a receber</h3>
        <div className="my-5 grid gap-4 sm:grid-cols-2">
          <label>
            Buscar venda
            <input
              placeholder="Cliente ou descrição"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Situação da venda
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="open">Em aberto</option>
              <option value="overdue">Em atraso</option>
              <option value="paid">Quitadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="all">Todas</option>
            </select>
          </label>
        </div>
        {!matches.length && (
          <p className="py-5 text-sm text-slate-500">
            Nenhuma venda nesta seleção. Use “Nova venda” para começar.
          </p>
        )}
        <div className="space-y-5">
          {[...matches].reverse().map((i) => (
            <article
              key={i.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h4 className="break-words font-bold">{i.clientName}</h4>
                  <p className="mt-1 break-words text-sm text-slate-600">
                    {i.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Venda de {dateLabel(i.date)} ·{" "}
                    {currency(i.installments.reduce((n, p) => n + p.amount, 0))}
                    {i.status === "cancelled" ? " · Cancelada" : ""}
                  </p>
                </div>
                {i.status === "active" && (
                  <button
                    className="text-xs text-red-700"
                    onClick={() => cancel(i.id)}
                  >
                    Cancelar venda
                  </button>
                )}
              </div>
              <div className="mt-4 space-y-3">
                {i.installments.map((p) => {
                  const b = installmentBalance(data, i, p);
                  return (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          Parcela {p.number} · {currency(p.amount)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Vencimento {dateLabel(p.due)} · Recebido{" "}
                          {currency(b.paid)}
                        </p>
                        <p
                          className={`mt-1 text-xs font-semibold ${i.status === "active" && b.remaining > 0 && p.due < localDay() ? "text-red-700" : "text-slate-600"}`}
                        >
                          {i.status === "cancelled"
                            ? "Cancelada"
                            : b.remaining === 0
                              ? "Quitada"
                              : `Saldo ${currency(b.remaining)}${p.due < localDay() ? " · Em atraso" : ""}`}
                        </p>
                      </div>
                      {i.status === "active" && b.remaining > 0 && (
                        <button
                          className="btn btn-outline"
                          aria-label={`Receber parcela ${p.number} de ${i.clientName}`}
                          onClick={() => {
                            setReceipt({
                              invoiceId: i.id,
                              installmentId: p.id,
                              label: `${i.clientName} · ${i.description} · Parcela ${p.number}`,
                              amount: (b.remaining / 100).toFixed(2),
                              date: localDay(),
                              method: "pix",
                            });
                            setForm(null);
                            setStatus("");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Registrar recebimento
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="admin-card">
        <h3 className="admin-title">
          Histórico de recebimentos · {month.split("-").reverse().join("/")}
        </h3>
        <p className="mt-2 text-xs text-slate-500">
          Estornar corrige o registro local; não faz devoluções bancárias.
        </p>
        {!data.payments.some((p) => p.date.startsWith(month)) && (
          <p className="mt-5 text-sm text-slate-500">
            Nenhum recebimento neste mês.
          </p>
        )}
        {[...data.payments]
          .filter((p) => p.date.startsWith(month))
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((p) => {
            const i = data.invoices.find((i) => i.id === p.invoiceId);
            return (
              <div
                key={p.id}
                className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {i?.clientName || "Cliente"} · {currency(p.amount)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {dateLabel(p.date)} · {PAYMENT_METHODS[p.method]} ·{" "}
                    {p.status === "void" ? "Estornado" : "Recebido"}
                  </p>
                </div>
                {p.status === "received" && (
                  <button
                    className="text-xs font-semibold text-red-700"
                    onClick={() => reverse(p.id)}
                  >
                    Estornar registro
                  </button>
                )}
              </div>
            );
          })}
      </section>
    </div>
  );
}
