import { isConfirmedOffer } from '../lib/confirmed-offer';
import { OfferConditions } from './OfferConditions';
import React, { useEffect, useRef, useState } from "react";
import { experienceLevels, planCategories } from "../data/experience-plans";
import { Bike, CarFront } from "lucide-react";
import { commercialInfo as defaults } from "../data/landing";
import { money } from "../store-data";
import { trackLanding } from "../lib/landing-events";
import { PackagePrice } from "./PackagePrice";

export function installmentText(totalCents, count) {
  if (
    !Number.isSafeInteger(totalCents) ||
    totalCents <= 0 ||
    !Number.isInteger(count) ||
    count <= 0
  )
    return null;
  const base = Math.floor(totalCents / count),
    remainder = totalCents % count;
  if (!remainder)
    return `${count}x de ${money(base / 100)} · total ${money(totalCents / 100)}`;
  return `${remainder}x de ${money((base + 1) / 100)} + ${count - remainder}x de ${money(base / 100)} · total ${money(totalCents / 100)}`;
}

function PublicPackage({ pack, contact, commercialInfo }) {
  const ref = useRef(null);
  const category = pack.category.replace("+", "/");
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackLanding("package_view", {
            package_id: pack.id,
            category: pack.category,
          });
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [pack.id, pack.category]);
  return (
    <article
      ref={ref}
      data-category={pack.category}
      className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-lg bg-yellow-100 px-3 py-2 text-sm font-bold text-yellow-950">
          Categoria {category}
        </span>
        <span className="flex gap-1 text-slate-600">
          {pack.category !== "A" && <CarFront aria-hidden="true" />}
          {pack.category !== "B" && <Bike aria-hidden="true" />}
        </span>
      </div>
      <h3 className="mt-5 text-2xl font-bold tracking-tight">{pack.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
        {pack.category === "A"
          ? "Para praticar equilíbrio, controle e percurso de moto."
          : pack.category === "B"
            ? "Para praticar manobras e direção com carro."
            : "Para quem quer se preparar nas duas categorias."}
      </p>
      <PackagePrice pack={pack} showDemoLabel={false} savedOnly />
      <OfferConditions pack={pack}/>
      <button className="btn btn-green mt-auto w-full" onClick={() => contact(`Olá! Quero consultar horários e valores do pacote ${pack.name}, categoria ${category}. Meu bairro é: `, 'package_whatsapp_click', {package_id:pack.id})}>Consultar horários e valores no WhatsApp</button>
      <a className="btn btn-outline mt-3 w-full" href={`/cadastro?pacote=${encodeURIComponent(pack.id)}`}>Criar conta gratuita</a>
      <p className="mt-2 text-center text-xs text-slate-500">Cadastro não gera cobrança nem libera créditos.</p>
    </article>
  );
}

export function PublicPackages({ packages, contact, commercialInfo = defaults }) {
  const [category, setCategory] = useState('all');
  const [experience, setExperience] = useState('experiencia');
  const active = packages.filter(p => isConfirmedOffer(p) && (category === 'all' || p.category === category) && (experience === 'all' || p.experience_level === experience));
  return (
    <section
      id="pacotes"
      className="bg-slate-50 section-space"
      aria-labelledby="packages-title"
    >
      <div className="container">
        <span id="categorias" />
        <div className="mb-9 max-w-2xl">
          <p className="eyebrow">CARRO, MOTO OU OS DOIS</p>
          <h2 id="packages-title">
            Compare os pacotes. Escolha seu próximo passo.
          </h2>
          <p className="section-subtitle">
            Aulas práticas com condições claras. Converse com o instrutor para
            saber qual opção faz sentido para você.
          </p>
        </div>
        <div className="mb-7 space-y-4">
          <p className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-slate-700">
            Comece pelos pacotes para quem já tem experiência. Para ver mais opções, selecione nos botões abaixo a categoria e o tipo de experiência que combinam com você.
          </p>
          <fieldset><legend className="mb-2 text-sm font-semibold">Categoria</legend>
            <div className="flex flex-wrap gap-2">{[{id:'all',label:'Todas'}, ...planCategories].map(c => <button type="button" key={c.id} aria-pressed={category === c.id} onClick={() => setCategory(c.id)} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold ${category === c.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>{c.label}</button>)}</div>
          </fieldset>
          <fieldset><legend className="mb-2 text-sm font-semibold">Tipo de experiência</legend>
            <div className="flex flex-wrap gap-2">{[{id:'all',title:'Todos os tipos'}, ...experienceLevels].map(e => <button type="button" key={e.id} aria-pressed={experience === e.id} onClick={() => setExperience(e.id)} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold ${experience === e.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>{e.title}</button>)}</div>
          </fieldset>
        </div>
        {active.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {active.map((p) => (
              <PublicPackage key={p.id} pack={p} contact={contact} commercialInfo={commercialInfo} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-7">
            <h3 className="text-xl font-bold">
              Consulte os valores e horários com a equipe.
            </h3>
            <p className="my-4 text-slate-600">
              Mostramos apenas ofertas com preços e condições confirmados. Informe sua categoria e bairro pelo WhatsApp.
            </p>
            <button className="btn btn-green" onClick={() => contact(undefined, 'empty_offers_whatsapp_click')}>Consultar horários e valores no WhatsApp</button>
            <button className="ml-4 min-h-11 underline" onClick={() => { setCategory('all'); setExperience('all'); }}>Ver todos os pacotes</button>
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">
            <strong className="text-slate-900">Ainda em dúvida?</strong> Conte
            sua experiência e o que você quer praticar.
          </p>
          <button
            className="min-h-11 text-sm font-bold text-green-800 underline underline-offset-4"
            onClick={() =>
              contact(
                "Olá! Vim pelo site e preciso de orientação para escolher meu pacote.",
                "guidance_whatsapp_click",
              )
            }
          >
            Me ajude a escolher
          </button>
        </div>
      </div>
    </section>
  );
}
