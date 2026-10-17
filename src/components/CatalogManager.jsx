import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { CouponManager } from "./CouponManager";
import { PackagePrice } from "./PackagePrice";
import { packagePricing } from "../lib/package-pricing";
import { InstructorAccess } from "./InstructorAccess";
import { createInstructorAccount } from "../lib/instructor-account";
export function CatalogManager({ initialKind = "packages", instructorsOnly = false }) {
  const installmentRatio = useRef(1);
  const [accountEmail, setAccountEmail] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  const [createAccess, setCreateAccess] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  useEffect(() => {
    if (!photoFile) { setPhotoPreview(""); return; }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);
  const [kind, setKind] = useState(initialKind),
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
    setPhotoFile(null);
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
      <h2 className="text-2xl font-bold">{instructorsOnly ? "Instrutores" : "Catálogo do site"}</h2>
      <p>
        Alterações salvas aparecem na página pública ao abrir ou atualizar o
        site.
      </p>
      <div className="flex gap-3">
        {!instructorsOnly && <><button onClick={() => setKind("packages")}>Pacotes</button>
        <button onClick={() => setKind("instructors")}>Instrutores</button></>}
        <button disabled={busy} className="btn btn-green" onClick={() => { setAccountEmail(""); setInitialPassword(""); setCreateAccess(false); setPhotoFile(null); setForm(fresh()); }}>
          {kind === "instructors" ? "Cadastrar instrutor" : "Novo cadastro"}
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
              if (kind === "instructors" && createAccess && !form.id) {
                const { error } = await supabase.rpc("admin_check_instructor_email", { p_email: accountEmail.trim() });
                if (error) throw new Error(error.message === "account_exists"
                  ? "Este e-mail já possui conta. Desmarque Criar acesso, salve o cadastro e use Vincular login do instrutor. A senha existente será preservada."
                  : "Não foi possível conferir o e-mail. Verifique a atualização de cadastro de contas no Supabase.");
              }
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
              if (kind === "instructors" && !payload.id) payload.id = crypto.randomUUID();
              if (kind === "instructors" && photoFile) {
                const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
                if (!extensions[photoFile.type] || photoFile.size > 5 * 1024 * 1024)
                  throw new Error("Escolha uma foto JPG, PNG ou WebP de até 5 MB.");
                const path = `${crypto.randomUUID()}.${extensions[photoFile.type]}`;
                const { error } = await supabase.storage.from("instructor-photos").upload(path, photoFile, { contentType: photoFile.type, upsert: false });
                if (error) throw new Error("Não foi possível enviar a foto. Confira se o armazenamento de fotos foi ativado no Supabase e tente novamente.");
                payload.photo_url = supabase.storage.from("instructor-photos").getPublicUrl(path).data.publicUrl;
                setForm(current => ({ ...current, photo_url: payload.photo_url }));
                setPhotoFile(null);
              }
              const result = form.id
                ? await supabase.from(kind).update(payload).eq("id", form.id)
                : await supabase.from(kind).insert(payload);
              if (result.error)
                throw new Error(
                  "Confira categoria, aulas e valores. Não foi possível salvar.",
                );
              let savedMessage = "Catálogo atualizado no banco.";
              if (kind === "instructors" && createAccess && !form.id) {
                setForm(payload);
                try { savedMessage = await createInstructorAccount(payload, accountEmail, initialPassword); }
                catch (failure) { await load(); throw failure; }
                finally { setInitialPassword(""); setCreateAccess(false); }
              }
              setForm(null);
              await load();
              setMessage(savedMessage);
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
              {!form.id && <div className="sm:col-span-2 grid gap-3 rounded-xl border border-slate-200 p-4">
                <label><input type="checkbox" checked={createAccess} onChange={e => { setCreateAccess(e.target.checked); setInitialPassword(""); }} /> Criar acesso do instrutor</label>
                {createAccess && <><label>E-mail do instrutor<input type="email" required maxLength={254} autoComplete="off" value={accountEmail} onChange={e => setAccountEmail(e.target.value)}/></label>
                <label>Senha inicial<input type="password" required minLength={8} autoComplete="new-password" value={initialPassword} onChange={e => setInitialPassword(e.target.value)}/></label>
                <p className="text-sm text-slate-600">Use pelo menos 8 caracteres. O instrutor receberá a confirmação por e-mail e poderá definir sua própria senha no primeiro acesso. A senha não será enviada por e-mail.</p></>}
              </div>}
              <div className="sm:col-span-2">
                <label>Foto do instrutor
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => {
                    const file = event.target.files?.[0];
                    setMessage("");
                    if (file && (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
                      setMessage("Escolha uma foto JPG, PNG ou WebP de até 5 MB.");
                      event.target.value = ""; setPhotoFile(null); return;
                    }
                    setPhotoFile(file || null);
                  }} />
                </label>
                <p className="text-sm text-slate-600">JPG, PNG ou WebP, até 5 MB. A foto será pública no perfil do instrutor e enviada ao salvar.</p>
                {(photoPreview || form.photo_url) && <img src={photoPreview || form.photo_url} alt="Prévia da foto do instrutor" className="mt-3 h-32 w-32 rounded-xl object-cover" />}
              </div>
              {[
                ["city", "Cidade"],
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
          <button disabled={busy} type="button" onClick={() => { setPhotoFile(null); setForm(null); }}>
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
              disabled={busy}
              onClick={() => { setCreateAccess(false); setInitialPassword(""); setPhotoFile(null);
                setForm(
                  kind === "packages"
                    ? {
                        ...r,
                        card_total_cents: packagePricing(r).total,
                        card_installments: packagePricing(r).count,
                        pricing_demo: packagePricing(r).demo,
                      }
                    : r,
                ); }}
            >
              Editar
            </button>
            {kind === "instructors" && <InstructorAccess instructor={r} />}
          </article>
        ))}
      </div>
      {kind === "packages" && <CouponManager />}
    </section>
  );
}
