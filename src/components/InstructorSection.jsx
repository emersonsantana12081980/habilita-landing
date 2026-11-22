import React, { useState } from "react";
import { MapPin } from "lucide-react";
import { InstructorAvatar } from "./InstructorAvatar";
import { InstructorProfile } from "./InstructorProfile";
import { teachesCategory } from "../store-data";

export function InstructorSection({ instructors, city, contact }) {
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const active = instructors.filter((i) => i.active);
  const isEmerson = (i) => i.slug === "emerson-santana";
  const regions = [...new Set(active.map((i) => i.city || city))];
  const visible = active.filter(
    (i) =>
      (active.length === 1 || !category || teachesCategory(i, category)) &&
      (regions.length === 1 || !region || (i.city || city) === region),
  );
  return (
    <section
      id="instrutores"
      className="container section-space"
      aria-labelledby="instructor-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">QUEM VAI ACOMPANHAR VOCÊ</p>
          <h2 id="instructor-heading">
            {active.length > 1
              ? "Conheça os instrutores disponíveis."
              : "Aprenda com quem entende do caminho."}
          </h2>
          <p className="section-subtitle">
            Conheça a experiência e a forma de ensinar antes de combinar sua
            aula.
          </p>
        </div>
        {active.length > 1 && (
          <div className="flex flex-wrap gap-3">
            <label>
              Categoria
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filtrar instrutores por categoria"
              >
                <option value="">Todas as categorias</option>
                <option value="A">A — Moto</option>
                <option value="B">B — Carro</option>
                <option value="A+B">A/B — Carro e moto</option>
              </select>
            </label>
            {regions.length > 1 && (
              <label>
                Região
                <select
                  aria-label="Região"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="">Todas as regiões</option>
                  {regions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
      </div>
      {active.length === 0 ? (
        <p className="mt-7 rounded-xl bg-slate-50 p-6 text-sm text-slate-600">
          Os perfis serão disponibilizados em breve. Fale com a equipe para
          conhecer o atendimento.
        </p>
      ) : (
        <div
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((i) => (
            <article
              key={i.id}
              className="flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6"
            >
              {isEmerson(i) ? <img src="/images/EMERSON%20.png" width="1086" height="1448" loading="lazy" alt="Emerson, instrutor da Habilita+" className="h-24 w-24 rounded-xl object-cover object-top" /> : <InstructorAvatar instructor={i} large />}
              <div className="min-w-0 flex flex-1 flex-col w-full">
                <span className="text-xs font-bold text-green-800">
                  CATEGORIA {i.category.replace("+", "/")}
                </span>
                <h3 className="mt-2 break-words text-2xl font-bold">
                  {i.name}
                </h3>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin size={15} aria-hidden="true" />
                  {i.city || city}
                </p>
                <p className="mt-4 line-clamp-3 break-words text-sm leading-7 text-slate-600">
                  {i.bio ||
                    "Converse com o instrutor para conhecer sua experiência e o atendimento."}
                </p>
                <button className="btn btn-green mt-5" onClick={() => setSelected(i)}>Ver perfil</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {active.length > 0 && !visible.length && (
        <p className="mt-6 text-sm text-slate-600">
          Nenhum perfil encontrado. Tente outra categoria ou região.
        </p>
      )}
      {selected && <InstructorProfile instructor={selected} city={city} contact={contact} onClose={() => setSelected(null)} />}
    </section>
  );
}
