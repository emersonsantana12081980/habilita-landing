import test from "node:test";
import assert from "node:assert/strict";
import {
  cents,
  makeInvoice,
  makePayment,
  financeSummary,
  installmentBalance,
  normalizeFinance,
} from "../src/finance.js";
const data = {
  clients: [{ id: "c", name: "Cliente teste", active: true }],
  invoices: [],
  payments: [],
};
const form = {
  clientId: "c",
  description: "Pacote",
  amount: "100.00",
  count: 3,
  date: "2030-01-15",
  due: "2030-01-31",
};
test("parcelas fecham centavos e respeitam fim do mês", () => {
  const { invoice } = makeInvoice(data, form, "i", "2030-01-31");
  assert.deepEqual(
    invoice.installments.map((p) => p.amount),
    [3334, 3333, 3333],
  );
  assert.deepEqual(
    invoice.installments.map((p) => p.due),
    ["2030-01-31", "2030-02-28", "2030-03-31"],
  );
  assert.equal(cents("169,90"), 16990);
  for (const v of ["-1", "1.999", "NaN", "", "1e3"])
    assert.equal(cents(v), null);
  assert.ok(
    makeInvoice(data, { ...form, date: "2030-02-30" }, "bad", "2030-03-31")
      .error,
  );
});
test("recebimentos parciais não ultrapassam saldo e estorno reabre parcela", () => {
  const invoice = makeInvoice(data, form, "i", "2030-01-31").invoice;
  const current = { ...data, invoices: [invoice] };
  const input = {
    invoiceId: "i",
    installmentId: "i-1",
    amount: "10",
    method: "pix",
    date: "2030-01-20",
  };
  const payment = makePayment(current, input, "p", "2030-01-31").payment;
  const paid = { ...current, payments: [payment] };
  assert.equal(
    installmentBalance(paid, invoice, invoice.installments[0]).remaining,
    2334,
  );
  assert.ok(
    makePayment(paid, { ...input, amount: "23.35" }, "p2", "2030-01-31").error,
  );
  assert.ok(
    makePayment(paid, { ...input, date: "2030-02-01" }, "p2", "2030-01-31")
      .error,
  );
  assert.ok(
    makePayment(
      { ...paid, invoices: [{ ...invoice, status: "cancelled" }] },
      input,
      "p2",
      "2030-01-31",
    ).error,
  );
  assert.deepEqual(financeSummary(paid, "2030-01", "2030-02-01"), {
    sold: 10000,
    received: 1000,
    outstanding: 9000,
    overdue: 2334,
  });
  assert.equal(
    financeSummary(
      { ...paid, payments: [{ ...payment, status: "void" }] },
      "2030-01",
      "2030-02-01",
    ).received,
    0,
  );
  assert.deepEqual(
    normalizeFinance({ invoices: [null, {}], payments: [null, {}] }),
    { invoices: [], payments: [] },
  );
});
