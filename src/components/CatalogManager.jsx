import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { CouponManager } from "./CouponManager";
import { PackagePrice } from "./PackagePrice";
import { packagePricing } from "../lib/package-pricing";
export function CatalogManager() {
  const installmentRatio = useRef(1);
  const [kind, setKind] = useState("packages"),
    [rows, setRows] = useState([]),
    [form, setForm] = useState(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    const { data, error } = await supabase
      .from(kind)
      .select(
        kind === "instructors"
          ? "id,slug,name,category,city,bio,photo_url,active"
          : "*",
      );
    if (error) setMessage("Não foi possível carregar o catálogo.");
    else setRows(data);
  }
  useEffect(() => {
    setRows([]);
    setForm(null);
    load();
  }, [kind]);
  function fresh() {
    return kind === "packages"
      ? {
          name: "",
          category: "B",
          lessons_a: 0,
          lessons_b: 2,
          price_cents: 29900,
          exam_vehicle: true,
          free_retest: true,
          retest_terms: "",
          card_installments: 12,
          card_total_cents: 35880,
          pricing_demo: true,
          boleto_installments: 6,
          active: true,
        }
      : {
          name: "",
          category: "A+B",
          city: "Caçapava",
          bio: "",
          photo_url: "",
          active: true,
        };
  }
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Catálogo do site</h2>
      <p>
        Alterações salvas aparecem na página pública ao abrir ou atualizar o
        site.
      </p>
      <div className="flex gap-3">
        <button onClick={() => setKind("packages")}>Pacotes</button>
        <button onClick={() => setKind("instructors")}>Instrutores</button>
        <button className="btn btn-green" onClick={() => setForm(fresh())}>
          Novo cadastro
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      {form && (
        <form
          className="admin-card grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setMessage("");
            try {
              if (
                kind === "instructors" &&
                form.photo_url &&
                !/^(https:\/\/|\/(?!\/))/.test(form.photo_url)
              )
                throw new Error("Use uma foto HTTPS ou um caminho local.");
              const payload = {
                ...form,
                slug: form.slug || crypto.randomUUID(),
              };
              const result = form.id
                ? await supabase.from(kind).update(payload).eq("id", form.id)
                : await supabase.from(kind).insert(payload);
              if (result.error)
                throw new Error(
                  "Confira categoria, aulas e valores. Não foi possível salvar.",
                );
              setForm(null);
              await load();
              setMessage("Catálogo atualizado no banco.");
            } catch (e) {
              setMessage(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Nome
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label>
            Categoria
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              {["A", "B", "A+B"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          {kind === "packages" ? (
            <>
              {[
                ["lessons_a", "Aulas de moto"],
                ["lessons_b", "Aulas de carro"],
                ["card_installments", "Número de parcelas"],
              ].map(([k, label]) => (
                <label key={k}>
                  {label}
                  <input
                    required
                    type="number"
                    min={k.startsWith("lessons") ? 0 : 1}
                    max={k.startsWith("lessons") ? 1000 : 12}
                    value={form[k]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [k]: Number(e.target.value) }))
                    }
                  />
                </label>
              ))}
              <label>
                Preço à vista (R$)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price_cents / 100}
                  onFocus={() => {
                    installmentRatio.current = form.price_cents > 0 && form.card_total_cents > 0
                      ? form.card_total_cents / form.price_cents : 1;
                  }}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      price_cents: Math.round(Number(e.target.value) * 100),
                      card_total_cents: Math.round(Math.round(Number(e.target.value) * 100) * installmentRatio.current),
                    }))
                  }
                />
              </label>
              <label>
                Valor total parcelado (R$)
                <input
                  required
                  type="number"
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  value={(form.card_total_cents ?? 0) / 100}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      card_total_cents: Math.round(
                        Number(e.target.value) * 100,
                      ),
                    }))
                  }
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.pricing_demo ?? true}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pricing_demo: e.target.checked }))
                  }
                />
                Valores fictícios para visualização
              </label>
              <div className="sm:col-span-2">
                <PackagePrice pack={form} />
                <p className="text-xs text-slate-600">
                  Alterar o preço à vista recalcula o total e as parcelas, mantendo
                  a proporção atual entre à vista e parcelado. Você também pode ajustar
                  o total parcelado manualmente. Desmarque a demonstração somente quando os
                  preços estiverem definidos.
                </p>
              </div>
              <label>
                Condições do reteste
                <textarea
                  value={form.retest_terms}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, retest_terms: e.target.value }))
                  }
                />
              </label>
              {[
                ["exam_vehicle", "Veículo para exame"],
                ["free_retest", "Reteste incluso"],
              ].map(([k, l]) => (
                <label key={k}>
                  <input
                    type="checkbox"
                    checked={form[k]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [k]: e.target.checked }))
                    }
                  />
                  {l}
                </label>
              ))}
            </>
          ) : (
            <>
              {[
                ["city", "Cidade"],
                ["photo_url", "URL da foto"],
              ].map(([k, l]) => (
                <label key={k}>
                  {l}
                  <input
                    value={form[k]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [k]: e.target.value }))
                    }
                  />
                </label>
              ))}
              <label className="sm:col-span-2">
                Apresentação
                <textarea
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                />
              </label>
            </>
          )}
          <label>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
            />
            Ativo no site
          </label>
          <button disabled={busy} className="btn btn-green">
            Salvar no site
          </button>
          <button type="button" onClick={() => setForm(null)}>
            Cancelar
          </button>
        </form>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <article className="admin-card" key={r.id}>
            <h3 className="font-bold">{r.name}</h3>
            <p>
              {r.category} · {r.active ? "Ativo" : "Inativo"}
            </p>
            <button
              className="mt-3 text-green-700 underline"
              onClick={() =>
                setForm(
                  kind === "packages"
                    ? {
                        ...r,
                        card_total_cents: packagePricing(r).total,
                        card_installments: packagePricing(r).count,
                        pricing_demo: packagePricing(r).demo,
                      }
                    : r,
                )
              }
            >
              Editar
            </button>
          </article>
        ))}
      </div>
      {kind === "packages" && <CouponManager />}
    </section>
  );
}
