import React from "react";
import {
  CarFront,
  Clock3,
  Route,
  ShieldCheck,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { MotorcycleIcon } from "./MotorcycleIcon";

const motorcycle = "/aa1d39d3-8028-46ab-8bad-addfc1300336.png";
const categories = [
  {
    id: "A",
    title: "DE MOTO",
    description:
      "Treinamento prático para ganhar equilíbrio, confiança e domínio da moto.",
    benefits: [
      [MotorcycleIcon, "Moto pronta para o exame"],
      [Route, "Treino de equilíbrio e percurso"],
      [Clock3, "Horários flexíveis na pista"],
    ],
    message:
      "Olá! Tenho interesse na categoria A (moto). Quero saber mais sobre as aulas e os horários.",
  },
  {
    id: "B",
    title: "DE CARRO",
    description:
      "Aprenda a dirigir com segurança, da primeira baliza ao trânsito da cidade.",
    benefits: [
      [CarFront, "Carro pronto para o exame"],
      [ShieldCheck, "Comando duplo de segurança"],
      [Route, "Treino de baliza e trânsito real"],
    ],
    message:
      "Olá! Tenho interesse na categoria B (carro). Quero saber mais sobre as aulas e os horários.",
  },
  {
    id: "A/B",
    title: "CARRO E MOTO",
    description:
      "Duas categorias, novas possibilidades. Sua preparação completa em um só lugar.",
    benefits: [
      [CarFront, "Carro e moto para o exame"],
      [Route, "Preparação nas duas categorias"],
      [Clock3, "Um plano que cabe na sua rotina"],
    ],
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

export function CategorySection({ contact }) {
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
            Do primeiro treino ao exame, uma preparação que acompanha o seu
            objetivo.
          </p>
        </div>
        <div className="mt-9 grid items-stretch gap-6 lg:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.id}
              className="license-card"
              aria-labelledby={`category-${category.id.replace("/", "-")}`}
            >
              <VehiclePhoto category={category.id} />
              <div className="flex flex-1 flex-col px-5 pb-6 pt-6 sm:px-7 lg:px-5">
                <h3
                  id={`category-${category.id.replace("/", "-")}`}
                  className="license-title"
                >
                  <span>HABILITAÇÃO</span>
                  <span className="text-yellow-300">{category.title}</span>
                </h3>
                <p className="mt-3 min-h-18 text-sm leading-6 text-slate-300">
                  {category.description}
                </p>
                <ul className="mb-6 mt-4">
                  {category.benefits.map(([Icon, label]) => (
                    <li
                      key={label}
                      className="flex min-h-16 items-center gap-3 border-b border-white/10 py-3 last:border-0"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-green-400/50 bg-green-600 text-white">
                        <Icon size={22} strokeWidth={2} />
                      </span>
                      <span className="text-sm font-semibold leading-5 text-slate-100">
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className="license-cta mt-auto"
                  onClick={() => contact(category.message)}
                >
                  <MessageCircle size={23} className="shrink-0" />
                  <span className="border-l border-white/35 pl-3">
                    QUERO CATEGORIA {category.id}
                  </span>
                  <ChevronRight size={20} className="ml-auto shrink-0" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
