import React, { useState } from "react";
import { Quote, Pencil, Trash2 } from "lucide-react";

export function Testimonials({ testimonials }) {
  const visible = testimonials.filter((t) => t.active && t.authorized);
  if (!visible.length) return null;
  return (
    <section id="depoimentos" className="container section-space">
      <p className="eyebrow">QUEM APRENDEU COM A GENTE</p>
      <h2>Histórias de quem esteve ao volante.</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {visible.map((t) => (
          <figure key={t.id} className="feature-card">
            <Quote className="mb-4 text-green-600" aria-hidden="true" />
            <blockquote className="whitespace-pre-line break-words text-sm leading-7 text-slate-600">
              {t.text}
            </blockquote>
            <figcaption className="mt-5 break-words font-bold text-slate-900">
              {t.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

const empty = { name: "", text: "", authorized: false, active: true };
export function TestimonialManager({ testimonials, update }) {
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState("");
  function save(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) {
      setStatus("Preencha o nome e o depoimento.");
      return;
    }
    const item = {
      ...form,
      id: form.id || crypto.randomUUID(),
      name: form.name.trim(),
      text: form.text.trim(),
    };
    if (
      update((current) => ({
        testimonials: form.id
          ? current.testimonials.map((t) => (t.id === form.id ? item : t))
          : [...current.testimonials, item],
      }))
    ) {
      setForm(empty);
      setStatus("Depoimento salvo neste navegador.");
    }
  }
  return (
    <section id="admin-depoimentos" className="admin-card mt-7">
      <h2 className="admin-title">Depoimentos de alunos</h2>
      <p className="mt-3 text-sm text-slate-500">
        Cadastre somente relatos reais. Apenas depoimentos ativos e autorizados
        aparecem na página. Nesta demonstração, os dados ficam somente neste
        navegador; cadastrar aqui não publica para outros visitantes.
      </p>
      <form onSubmit={save} className="mt-5 grid gap-4">
        <label>
          Nome para exibição
          <input
            required
            maxLength={80}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Texto do depoimento
          <textarea
            required
            rows={4}
            maxLength={1000}
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.authorized}
            onChange={(e) => setForm({ ...form, authorized: e.target.checked })}
          />{" "}
          Tenho autorização do aluno para exibir este relato e nome
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />{" "}
          Depoimento ativo
        </label>
        <div className="flex gap-3">
          <button className="btn btn-green">Salvar depoimento</button>
          {form.id && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setForm(empty)}
            >
              Cancelar edição
            </button>
          )}
        </div>
      </form>
      <p aria-live="polite" className="mt-3 text-sm">
        {status}
      </p>
      {!testimonials.length && (
        <p className="mt-4 text-sm text-slate-500">
          Nenhum depoimento cadastrado. A seção pública permanece oculta.
        </p>
      )}
      <div className="mt-4 space-y-3">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="break-words font-bold">{t.name}</p>
              <p className="line-clamp-2 break-words text-sm text-slate-500">
                {t.text}
              </p>
              <p className="mt-2 text-xs">
                {t.active && t.authorized
                  ? "Visível neste navegador"
                  : "Oculto"}
              </p>
            </div>
            <button
              className="p-2"
              aria-label={`Editar depoimento de ${t.name}`}
              onClick={() => setForm(t)}
            >
              <Pencil size={18} />
            </button>
            <button
              className="p-2 text-red-600"
              aria-label={`Excluir depoimento de ${t.name}`}
              onClick={() => {
                if (window.confirm("Excluir este depoimento?")) {
                  if (
                    update((current) => ({
                      testimonials: current.testimonials.filter(
                        (x) => x.id !== t.id,
                      ),
                    }))
                  ) {
                    if (form.id === t.id) setForm(empty);
                    setStatus("Depoimento excluído.");
                  }
                }
              }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
