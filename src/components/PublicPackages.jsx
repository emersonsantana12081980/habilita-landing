import React, { useEffect, useRef } from "react";
import { Bike, CarFront, Check, Plus } from "lucide-react";
import { lessonLabel } from "../data/packages";
import { commercialInfo as defaults } from "../data/landing";
import { money } from "../store-data";
import { trackLanding } from "../lib/landing-events";
import { PackagePrice } from "./PackagePrice";
import { packagePricing } from "../lib/package-pricing";

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
  const details = commercialInfo.packages[pack.slug || pack.id] || {};
  const duration = details.lessonMinutes || commercialInfo.lessonMinutes;
  const retest = details.retestTerms || pack.retestTerms || commercialInfo.retestTerms;
  const category = pack.category.replace("+", "/");
  const pricing = packagePricing(pack);
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
      <PackagePrice pack={pack} />
      <p className="mb-4 text-sm text-slate-600">
        Pacote prático · não é a CNH completa
      </p>
      <ul className="space-y-3 text-sm leading-6">
        {[
          lessonLabel(pack),
          pack.examVehicle
            ? pack.category === "A+B"
              ? "Carro e moto para o exame, conforme condições"
              : "Veículo para o exame, conforme condições"
            : "Veículo para o exame não informado neste pacote",
        ].map((t) => (
          <li key={t} className="flex gap-2">
            <Check
              size={18}
              className="mt-1 shrink-0 text-green-700"
              aria-hidden="true"
            />
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-slate-600">
        Duração:{" "}
        {duration
          ? `${duration} minutos por aula`
          : "a confirmar com o instrutor"}
        .
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Taxas e outras etapas da CNH não estão anunciadas como incluídas.
      </p>
      <details
        className="group my-5 rounded-xl bg-slate-50 p-4"
        onToggle={(e) => {
          if (e.currentTarget.open)
            trackLanding("package_conditions_open", {
              package_id: pack.id,
              category: pack.category,
            });
        }}
      >
        <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">
          Ver condições{" "}
          <Plus
            size={16}
            className="shrink-0 group-open:rotate-45"
            aria-hidden="true"
          />
        </summary>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          {[["Cartão", pricing.count, pricing.total]].map(
            ([label, count, total]) =>
              count > 0 && (
                <p key={label}>
                  <strong className="text-slate-800">{label}:</strong>{" "}
                  {installmentText(total, count) ||
                    `${count}x anunciado. Valor das parcelas, juros e total a confirmar antes de contratar.`}
                </p>
              ),
          )}
          {!pack.cardInstallments && !pack.boletoInstallments && (
            <p>Consulte as formas de pagamento disponíveis.</p>
          )}
          <p>
            <strong className="text-slate-800">Reteste:</strong>{" "}
            {retest ||
              (pack.freeRetest
                ? "condição anunciada, com cobertura, prazo, utilizações e eventuais taxas a confirmar. Não considere o exame inteiro gratuito."
                : "não anunciado como incluído. Consulte a equipe.")}
          </p>
          <p>
            Confirme o local, a duração das aulas e a disponibilidade do veículo
            na data do exame. Não há garantia de aprovação.
          </p>
        </div>
      </details>
      <a className="btn btn-green mt-auto w-full" href={`/cadastro?pacote=${encodeURIComponent(pack.id)}`} onClick={() => trackLanding("signup_start", { source: "package", category: pack.category, package_id: pack.id })}>
        Cadastre-se grátis
      </a>
      <p className="mt-2 text-center text-xs text-slate-500">Criar sua conta não gera cobrança.</p>
      <a className="mt-3 min-h-11 py-3 text-center text-sm font-semibold text-green-800 underline underline-offset-4" href={`/aluno?pacote=${encodeURIComponent(pack.id)}`}>Tem cupom? Aplique na área do aluno</a>
    </article>
  );
}

export function PublicPackages({ packages, contact, commercialInfo = defaults }) {
  const active = packages.filter((p) => p.active);
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
        {active.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {active.map((p) => (
              <PublicPackage key={p.id} pack={p} contact={contact} commercialInfo={commercialInfo} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-7">
            <h3 className="text-xl font-bold">
              Seu plano começa com uma conversa.
            </h3>
            <p className="my-4 text-slate-600">
              Consulte os pacotes e valores disponíveis diretamente com o
              instrutor.
            </p>
            <a className="btn btn-green" href="/cadastro" onClick={() => trackLanding("signup_start", { source: "empty_catalog" })}>Cadastre-se grátis</a>
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
