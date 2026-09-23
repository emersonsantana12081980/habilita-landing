import React from "react";
import {
  MessageCircle,
  ChevronRight,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import { PackageDetails } from "./PackageDetails";
import { money, packageMessage } from "../store-data";

const motorcycle = "/aa1d39d3-8028-46ab-8bad-addfc1300336.png";
const categories = [
  {
    id: "A",
    title: "DE MOTO",
    description:
      "Treinamento prático para ganhar equilíbrio, confiança e domínio da moto.",
    message:
      "Olá! Tenho interesse na categoria A (moto). Quero saber mais sobre as aulas e os horários.",
  },
  {
    id: "B",
    title: "DE CARRO",
    description:
      "Aprenda a dirigir com segurança, da primeira baliza ao trânsito da cidade.",
    message:
      "Olá! Tenho interesse na categoria B (carro). Quero saber mais sobre as aulas e os horários.",
  },
  {
    id: "A/B",
    title: "CARRO E MOTO",
    description:
      "Duas categorias, novas possibilidades. Sua preparação completa em um só lugar.",
    message:
      "Olá! Tenho interesse na categoria A/B (carro e moto). Quero conhecer o pacote combinado e os horários.",
  },
];

function VehiclePhoto({ category }) {
  return (
    <div
      className={`license-visual license-visual-${category === "A/B" ? "ab" : category.toLowerCase()}`}
    >
      {category === "A" && (
        <img
          src={motorcycle}
          alt="Moto preta para aulas da categoria A"
          className="license-motorcycle"
          loading="lazy"
          width="1920"
          height="1080"
        />
      )}
      {category !== "A" && (
        <div className="license-car-frame">
          <img
            src="/vehicles.png"
            alt="Fiat Mobi HABILITA+ para aulas da categoria B"
            loading="lazy"
            width="1536"
            height="1024"
          />
        </div>
      )}
      {category === "A/B" && (
        <img
          src={motorcycle}
          alt="Moto da opção combinada carro e moto"
          className="license-combined-motorcycle"
          loading="lazy"
          width="1920"
          height="1080"
        />
      )}
      <div className="license-badge">
        <span>CATEGORIA</span>
        <strong>{category}</strong>
      </div>
    </div>
  );
}

export function CategorySection({ contact, packages, book }) {
  return (
    <section id="categorias" className="bg-[#f3f5f7] py-14 sm:py-20">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">
              ESCOLHA SUA CATEGORIA. CONQUISTE SUA LIBERDADE.
            </p>
            <h2>Carro, moto ou os dois?</h2>
          </div>
          <p className="max-w-80 text-sm leading-6 text-slate-500">
            Toque em uma categoria para ver as aulas, os benefícios e as opções
            de pagamento.
          </p>
        </div>
        <div className="mt-9 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const offers = packages.filter(
              (p) => p.active && p.category === category.id.replace("/", "+"),
            );
            return (
              <details
                key={category.id}
                className="license-card group"
                data-category={category.id}
              >
                <summary
                  className="license-summary"
                  aria-label={`Ver pacotes da categoria ${category.id}`}
                >
                  <VehiclePhoto category={category.id} />
                  <div className="flex items-center justify-between gap-3 px-5 py-6">
                    <h3 className="license-title">
                      <span>HABILITAÇÃO</span>
                      <span className="text-yellow-300">{category.title}</span>
                    </h3>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-yellow-300/50 text-yellow-300 transition-transform group-open:rotate-180">
                      <ChevronDown size={22} />
                    </span>
                  </div>
                  <div className="px-5 pb-6">
                    {offers.length > 0 && (
                      <p className="mb-4 text-lg font-bold text-yellow-300">
                        {offers.length > 1 ? "A partir de " : "À vista "}
                        {money(Math.min(...offers.map((p) => Number(p.price))))}
                      </p>
                    )}
                    <span className="flex justify-center rounded-xl border border-yellow-300/50 px-4 py-3 text-sm font-bold text-yellow-300">
                      <span className="group-open:hidden">
                        Ver pacote e valores
                      </span>
                      <span className="hidden group-open:inline">
                        Recolher detalhes
                      </span>
                    </span>
                  </div>
                </summary>
                <div className="border-t border-white/10 px-5 pb-5">
                  <p className="my-5 text-sm leading-6 text-slate-300">
                    {category.description}
                  </p>
                  {offers.length ? (
                    offers.map((pack) => (
                      <div
                        key={pack.id}
                        className="mb-5 border-b border-white/10 pb-5 last:mb-0 last:border-0 last:pb-0"
                      >
                        <h4 className="mb-4 text-base font-bold text-white">
                          {pack.name}
                        </h4>
                        <PackageDetails pack={pack} dark />
                        <button
                          className="license-cta mt-6"
                          onClick={() => contact(packageMessage(pack))}
                        >
                          <MessageCircle size={21} /> Quero este pacote no
                          WhatsApp
                        </button>
                        <button
                          className="license-cta mt-6"
                          onClick={() => book(pack)}
                        >
                          <CalendarDays size={21} />
                          <span>GARANTIR MEU PACOTE</span>
                          <ChevronRight
                            size={20}
                            className="ml-auto shrink-0"
                          />
                        </button>
                      </div>
                    ))
                  ) : (
                    <>
                      <p className="mb-5 text-sm text-slate-300">
                        Consulte os pacotes disponíveis com o instrutor.
                      </p>
                      <button
                        className="license-cta"
                        onClick={() => contact(category.message)}
                      >
                        <MessageCircle size={21} /> CONSULTAR NO WHATSAPP{" "}
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
