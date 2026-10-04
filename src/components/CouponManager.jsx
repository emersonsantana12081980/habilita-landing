import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { money } from "../store-data";
const empty = {
  code: "",
  kind: "percent",
  amount: 10,
  package_id: "",
  expires_at: "",
  active: true,
  demo_only: true,
};
export function CouponManager() {
  const [rows, setRows] = useState([]),
    [packages, setPackages] = useState([]),
    [form, setForm] = useState({ ...empty }),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function load() {
    const [c, p] = await Promise.all([
      supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("packages").select("id,name"),
    ]);
    if (c.error || p.error) {
      setMessage(
        "Cupons ainda não disponíveis. Aplique o SQL de preços e cupons no Supabase.",
      );
      return;
    }
    setRows(c.data);
    setPackages(p.data);
  }
  useEffect(() => {
    load();
  }, []);
  return (
    <section className="admin-card mt-6">
      <h2 className="text-xl font-bold">Cupons de desconto</h2>
      <p className="mt-2 text-sm text-slate-600">
        Desconto aplicado ao valor à vista ou ao total parcelado escolhido pelo
        aluno. Não altera créditos nem gera cobrança.
      </p>
      {message && (
        <p role="status" className="my-3 text-sm">
          {message}
        </p>
      )}
      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setMessage("");
          try {
            const payload = {
              code: form.code.trim().toUpperCase(),
              kind: form.kind,
              amount: form.amount,
              package_id: form.package_id || null,
              expires_at: form.expires_at
                ? new Date(form.expires_at + "T23:59:59-03:00").toISOString()
                : null,
              active: form.active,
              demo_only: form.demo_only,
            };
            const result = form.id
              ? await supabase.from("coupons").update(payload).eq("id", form.id)
              : await supabase.from("coupons").insert(payload);
            if (result.error) throw result.error;
            await load();
            setForm({ ...empty });
            setMessage("Cupom salvo.");
          } catch {
            setMessage(
              "Não foi possível salvar. Confira o código (deve ser único), o valor e se o SQL foi aplicado.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Código do cupom
          <input
            required
            pattern="[A-Za-z0-9_-]{3,30}"
            maxLength={30}
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value.toUpperCase() })
            }
          />
        </label>
        <label>
          Tipo de desconto
          <select
            value={form.kind}
            onChange={(e) =>
              setForm({
                ...form,
                kind: e.target.value,
                amount: e.target.value === "percent" ? 10 : 1000,
              })
            }
          >
            <option value="percent">Porcentagem (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </select>
        </label>
        <label>
          {form.kind === "percent" ? "Desconto (%)" : "Desconto (R$)"}
          <input
            required
            type="number"
            min={form.kind === "percent" ? 1 : 0.01}
            max={form.kind === "percent" ? 99 : 1000000}
            step={form.kind === "percent" ? 1 : 0.01}
            value={form.kind === "percent" ? form.amount : form.amount / 100}
            onChange={(e) =>
              setForm({
                ...form,
                amount: Math.round(
                  Number(e.target.value) * (form.kind === "percent" ? 1 : 100),
                ),
              })
            }
          />
        </label>
        <label>
          Válido para
          <select
            value={form.package_id}
            onChange={(e) => setForm({ ...form, package_id: e.target.value })}
          >
            <option value="">Todos os pacotes</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Validade do cupom (opcional)
          <input
            type="date"
            value={form.expires_at}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Cupom ativo
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.demo_only}
            onChange={(e) => setForm({ ...form, demo_only: e.target.checked })}
          />
          Usar apenas em pacotes de demonstração
        </label>
        <div className="flex gap-3">
          <button disabled={busy} className="btn btn-green">
            Salvar cupom
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm({ ...empty })}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rows.map((c) => (
          <article
            key={c.id}
            className="rounded-xl border border-slate-200 p-4"
          >
            <h3 className="font-bold">{c.code}</h3>
            <p className="text-sm">
              {c.kind === "percent" ? `${c.amount}%` : money(c.amount / 100)} de
              desconto · {c.active ? "Ativo" : "Inativo"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {c.demo_only
                ? "Somente demonstração"
                : "Disponível para pacotes reais"}{" "}
              ·{" "}
              {c.expires_at
                ? `Até ${new Date(c.expires_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
                : "Sem vencimento"}
            </p>
            <button
              className="mt-3 min-h-11 font-semibold text-green-800"
              onClick={() =>
                setForm({
                  ...c,
                  package_id: c.package_id || "",
                  expires_at: c.expires_at
                    ? new Intl.DateTimeFormat("en-CA", {
                        timeZone: "America/Sao_Paulo",
                      }).format(new Date(c.expires_at))
                    : "",
                })
              }
            >
              Editar cupom {c.code}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
