import { localDay } from "./management.js";

export const PAYMENT_METHODS = {
  pix: "Pix",
  cash: "Dinheiro",
  credit: "Cartão de crédito",
  debit: "Cartão de débito",
  boleto: "Boleto",
  transfer: "Transferência",
};
export function cents(value) {
  const text = String(value).trim().replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export function validDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(new Date(`${value}T12:00:00`).getTime()) &&
    localDay(new Date(`${value}T12:00:00`)) === value
  );
}
export function normalizeFinance(source) {
  return {
    invoices: (Array.isArray(source.invoices) ? source.invoices : []).filter(
      (i) =>
        i &&
        typeof i.id === "string" &&
        typeof i.clientId === "string" &&
        typeof i.description === "string" &&
        validDate(i.date) &&
        ["active", "cancelled"].includes(i.status) &&
        Array.isArray(i.installments) &&
        i.installments.length &&
        i.installments.every(
          (p) =>
            p &&
            typeof p.id === "string" &&
            validDate(p.due) &&
            Number.isSafeInteger(p.amount) &&
            p.amount > 0,
        ),
    ),
    payments: (Array.isArray(source.payments) ? source.payments : []).filter(
      (p) =>
        p &&
        typeof p.id === "string" &&
        typeof p.invoiceId === "string" &&
        typeof p.installmentId === "string" &&
        Number.isSafeInteger(p.amount) &&
        p.amount > 0 &&
        validDate(p.date) &&
        PAYMENT_METHODS[p.method] &&
        ["received", "void"].includes(p.status),
    ),
  };
}
export function installmentBalance(data, invoice, installment) {
  const paid = data.payments
    .filter(
      (p) =>
        p.invoiceId === invoice.id &&
        p.installmentId === installment.id &&
        p.status === "received",
    )
    .reduce((n, p) => n + p.amount, 0);
  return { paid, remaining: installment.amount - paid };
}
export function makeInvoice(data, form, id, today = localDay()) {
  const client = data.clients.find((c) => c.id === form.clientId && c.active);
  const amount = cents(form.amount);
  const count = Number(form.count);
  if (!client) return { error: "Selecione um cliente ativo." };
  if (
    !form.description.trim() ||
    !amount ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 12 ||
    amount < count
  )
    return { error: "Informe descrição, valor positivo e de 1 a 12 parcelas." };
  if (
    !validDate(form.date) ||
    form.date > today ||
    !validDate(form.due) ||
    form.due < form.date
  )
    return {
      error:
        "Confira a data da venda e o primeiro vencimento. A venda não pode estar no futuro.",
    };
  const first = new Date(`${form.due}T12:00:00`);
  const installments = Array.from({ length: count }, (_, n) => {
    const last = new Date(first.getFullYear(), first.getMonth() + n + 1, 0, 12);
    const next = new Date(
      first.getFullYear(),
      first.getMonth() + n,
      Math.min(first.getDate(), last.getDate()),
      12,
    );
    return {
      id: `${id}-${n + 1}`,
      number: n + 1,
      due: localDay(next),
      amount: Math.floor(amount / count) + (n < amount % count ? 1 : 0),
    };
  });
  return {
    invoice: {
      id,
      clientId: client.id,
      clientName: client.name,
      description: form.description.trim(),
      date: form.date,
      status: "active",
      installments,
    },
  };
}
export function makePayment(data, form, id, today = localDay()) {
  const invoice = data.invoices.find(
    (i) => i.id === form.invoiceId && i.status === "active",
  );
  const installment = invoice?.installments.find(
    (p) => p.id === form.installmentId,
  );
  if (!installment)
    return { error: "Parcela indisponível. Atualize a seleção." };
  const amount = cents(form.amount);
  if (
    !amount ||
    amount > installmentBalance(data, invoice, installment).remaining
  )
    return {
      error:
        "O recebimento deve ser positivo e não pode ultrapassar o saldo da parcela.",
    };
  if (
    !validDate(form.date) ||
    form.date > today ||
    form.date < invoice.date ||
    !PAYMENT_METHODS[form.method]
  )
    return { error: "Confira a data do recebimento e a forma de pagamento." };
  return {
    payment: {
      id,
      invoiceId: invoice.id,
      installmentId: installment.id,
      amount,
      date: form.date,
      method: form.method,
      status: "received",
    },
  };
}
export function financeSummary(data, month, today = localDay()) {
  const active = data.invoices.filter((i) => i.status === "active");
  return {
    sold: active
      .filter((i) => i.date.startsWith(month))
      .reduce(
        (n, i) => n + i.installments.reduce((s, p) => s + p.amount, 0),
        0,
      ),
    received: data.payments
      .filter(
        (p) =>
          p.status === "received" &&
          p.date.startsWith(month) &&
          active.some((i) => i.id === p.invoiceId),
      )
      .reduce((n, p) => n + p.amount, 0),
    outstanding: active.reduce(
      (n, i) =>
        n +
        i.installments.reduce(
          (s, p) => s + installmentBalance(data, i, p).remaining,
          0,
        ),
      0,
    ),
    overdue: active.reduce(
      (n, i) =>
        n +
        i.installments
          .filter((p) => p.due < today)
          .reduce((s, p) => s + installmentBalance(data, i, p).remaining, 0),
      0,
    ),
  };
}
