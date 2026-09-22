import React, { useState } from "react";
import { UsersRound, MapPin, Check, ArrowRight } from "lucide-react";
import { InstructorAvatar } from "./InstructorAvatar";
import { teachesCategory } from "../store-data";

export function InstructorSection({
  instructors,
  city,
  selectedId,
  select,
  contact,
}) {
  const [filter, setFilter] = useState("");
  const active = instructors.filter((i) => i.active);
  const visible = active.filter((i) => !filter || teachesCategory(i, filter));
  const selected = active.find((i) => i.id === selectedId);
  return (
    <section
      id="instrutores"
      className="container section-space"
      aria-labelledby="instructor-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">PESSOAS QUE ACOMPANHAM SUA CONQUISTA</p>
          <h2 id="instructor-heading">Escolha seu instrutor.</h2>
          <p className="section-subtitle">
            Conheça os perfis e indique com quem você gostaria de aprender.
          </p>
        </div>
        {active.length > 0 && (
          <label className="w-full sm:w-56">
            Filtrar por categoria
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filtrar instrutores por categoria"
            >
              <option value="">Todas as categorias</option>
              <option value="A">A — Moto</option>
              <option value="B">B — Carro</option>
              <option value="A+B">A/B — Carro e moto</option>
            </select>
          </label>
        )}
      </div>
      {active.length === 0 ? (
        <div className="mt-8 flex flex-col items-start gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-7 sm:flex-row sm:items-center">
          <span className="icon-tile">
            <UsersRound size={25} />
          </span>
          <div className="flex-1">
            <h3 className="font-bold">
              Vamos encontrar o instrutor para você.
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Os perfis serão disponibilizados em breve. Fale com a equipe para
              conhecer os instrutores e combinar suas aulas.
            </p>
          </div>
          <button
            className="btn btn-green shrink-0"
            onClick={() =>
              contact(
                "Olá! Quero conhecer os instrutores disponíveis e escolher quem vai me acompanhar.",
              )
            }
          >
            Conhecer instrutores <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((i) => (
              <article
                key={i.id}
                className={`flex min-w-0 flex-col rounded-2xl border p-6 ${selectedId === i.id ? "border-green-600 bg-green-50/50 ring-1 ring-green-600" : "border-slate-200 bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <InstructorAvatar instructor={i} large />
                  <span className="rounded-full bg-[#0e213b] px-3 py-1.5 text-xs font-bold text-white">
                    {i.category.replace("+", "/")}
                  </span>
                </div>
                <h3 className="mt-5 break-words text-xl font-bold">{i.name}</h3>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin size={14} className="shrink-0 text-green-600" />
                  {i.city || city}
                </p>
                <p className="mb-6 mt-4 whitespace-pre-line break-words text-sm leading-6 text-slate-500">
                  {i.bio ||
                    "Converse com a equipe para conhecer o atendimento deste instrutor."}
                </p>
                <button
                  aria-label={`Selecionar instrutor ${i.name}`}
                  aria-pressed={selectedId === i.id}
                  className={`btn mt-auto w-full ${selectedId === i.id ? "btn-green" : "btn-outline"}`}
                  onClick={() => select(i.id)}
                >
                  {selectedId === i.id ? (
                    <>
                      <Check size={17} /> Instrutor selecionado
                    </>
                  ) : (
                    <>
                      Escolher instrutor <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </article>
            ))}
          </div>
          {!visible.length && (
            <p className="mt-6 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
              Nenhum instrutor disponível para esta categoria. Experimente outro
              filtro ou fale com a equipe.
            </p>
          )}
          {selected && (
            <div className="mt-6 flex flex-col items-start gap-4 rounded-xl bg-[#0e213b] p-5 text-white sm:flex-row sm:items-center">
              <div className="w-full min-w-0 sm:flex-1">
                <p className="break-words text-sm font-semibold" role="status">
                  Instrutor escolhido: {selected.name}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  A disponibilidade será confirmada pela equipe.
                </p>
              </div>
              <a className="btn btn-green" href="#pacotes">
                Ver pacotes <ArrowRight size={16} />
              </a>
              <button
                className="text-xs underline underline-offset-4"
                onClick={() => select("")}
              >
                Remover escolha
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
