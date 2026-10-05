import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Clock3,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Route,
  ShieldCheck,
  X,
} from "lucide-react";
import { Brand } from "./Brand";
import { PublicPackages } from "./PublicPackages";
import { InstructorSection } from "./InstructorSection";
import { Testimonials } from "./Testimonials";
import { SpecialistChat } from "./SpecialistChat";
import { whatsappUrl } from "../store-data";
import { commercialInfo, faqItems } from "../data/landing";
import { trackLanding, useLandingEvents } from "../lib/landing-events";

const navigation = [
  ["como-funciona", "Como funciona"],
  ["pacotes", "Pacotes"],
  ["instrutores", "Instrutores"],
  ["duvidas", "Dúvidas"],
];
export function LandingPage({ data, error }) {
  const [menu, setMenu] = useState(false),
    [notice, setNotice] = useState("");
  const menuButton = useRef(null);
  const heroButton = useRef(null);
  const [showMobileContact, setShowMobileContact] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowMobileContact(!entry.isIntersecting),
      { rootMargin: "-84px 0px 0px 0px" },
    );
    observer.observe(heroButton.current);
    return () => observer.disconnect();
  }, []);
  useLandingEvents();
  function contact(message, event = "whatsapp_click", fields = {}) {
    const text =
      message ||
      "Olá! Vim pelo site da HABILITA+ e quero conversar com um instrutor sobre aulas práticas.";
    const url = whatsappUrl(data.whatsapp, text);
    if (!url) {
      setNotice(
        "O WhatsApp está temporariamente indisponível. Tente novamente mais tarde; você ainda pode consultar os pacotes e criar sua conta.",
      );
      return;
    }
    trackLanding(event, fields);
    window.open(url, "_blank", "noopener,noreferrer");
  }
  const closeMenu = () => {
    setMenu(false);
    menuButton.current?.focus();
  };
  return (
    <div className="public-landing">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <header className="fixed top-0 z-30 w-full border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="container flex h-21 items-center justify-between gap-3">
          <Brand />
          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-5 text-sm font-medium xl:flex"
          >
            {navigation.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
            <a href="/aluno" className="text-slate-600">
              Área do aluno
            </a>
          </nav>
          <a className="btn btn-green hidden sm:inline-flex"
            href="/cadastro" onClick={() => trackLanding("signup_start", { source: "header" })}>
            Cadastre-se grátis <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <button
            ref={menuButton}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 xl:hidden"
            aria-label={menu ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            onClick={() => setMenu(!menu)}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeMenu();
            }}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
        {menu && (
          <nav
            id="mobile-menu"
            aria-label="Navegação móvel"
            className="border-t border-slate-100 bg-white p-4 xl:hidden"
            onKeyDown={(e) => {
              if (e.key === "Escape") closeMenu();
            }}
          >
            {navigation.map(([id, label]) => (
              <a
                key={id}
                className="block rounded-lg px-4 py-3 text-sm hover:bg-slate-50"
                href={`#${id}`}
                onClick={() => setMenu(false)}
              >
                {label}
              </a>
            ))}
            <a href="/aluno" className="block px-4 py-3 text-sm text-slate-600">
              Área do aluno
            </a>
          </nav>
        )}
      </header>
      <main id="conteudo">
        <section className="hero">
          <div className="container grid items-center gap-10 py-10 md:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-2 text-xs font-bold text-yellow-950">
                <MapPin size={15} aria-hidden="true" />
                Aulas práticas em {data.city} e região
              </p>
              <h1 className="mt-6 text-[clamp(2.1rem,4vw,3.5rem)] font-extrabold leading-[1.08] tracking-[-.04em]">
                Ganhe confiança para dirigir{" "}
                <span className="text-green-700">
                  e prepare-se para o exame da CNH.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                Carro, moto ou os dois. Combine seus horários e pratique com
                orientação próxima de um instrutor autônomo.
              </p>
              <ul className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                {[
                  "Categorias A, B e A/B",
                  "Aulas práticas personalizadas",
                  "Veículo para exame conforme pacote",
                  "Cadastro gratuito, sem compromisso",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check
                      size={17}
                      className="mt-0.5 shrink-0 text-green-700"
                      aria-hidden="true"
                    />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <a className="btn btn-green min-h-13 w-full sm:w-auto"
                  ref={heroButton}
                  href="/cadastro" onClick={() => trackLanding("signup_start", { source: "hero" })}>
            Cadastre-se grátis <ArrowUpRight size={18} aria-hidden="true" />
          </a>
                <a href="#pacotes" className="btn btn-outline w-full sm:w-auto">
                  Ver pacotes e valores
                </a>
              </div>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600">
                Pacotes de aulas práticas. Taxas e demais etapas da CNH devem
                ser confirmadas separadamente antes da contratação.
              </p>
            </div>
            <figure className="overflow-hidden rounded-3xl bg-[#0e213b] shadow-xl shadow-slate-900/10">
              <img
                src="/images/hero-960.webp"
                srcSet="/images/hero-640.webp 640w, /images/hero-960.webp 960w"
                sizes="(min-width: 1024px) 520px, calc(100vw - 40px)"
                width="960"
                height="382"
                fetchPriority="high"
                alt="Fiat Mobi prata com a identidade visual HABILITA+"
                className="aspect-[2.51/1] w-full object-cover"
              />
              <figcaption className="p-6 text-white sm:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-green-300">
                  NO SEU RITMO, COM ORIENTAÇÃO
                </p>
                <p className="mt-3 text-2xl font-semibold leading-tight">
                  Sua próxima aula começa com uma boa conversa.
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Conte o que você precisa praticar. Vamos entender seu objetivo
                  e os próximos passos.
                </p>
              </figcaption>
            </figure>
          </div>
        </section>
        <section
          aria-label="Sobre o atendimento"
          className="border-y border-slate-200"
        >
          <div className="container grid grid-cols-2 gap-5 py-7 lg:grid-cols-4">
            {[
              [MapPin, `${data.city} e região`],
              [Route, "Carro, moto e preparação prática"],
              [Clock3, "Horários conforme disponibilidade"],
              [MessageCircle, "Contato direto com o instrutor"],
            ].map(([Icon, label]) => (
              <p
                key={label}
                className="flex items-start gap-2 text-sm font-medium text-slate-700"
              >
                <Icon
                  size={20}
                  className="shrink-0 text-green-700"
                  aria-hidden="true"
                />
                {label}
              </p>
            ))}
          </div>
        </section>
        <section id="como-funciona" className="container section-space">
          <p className="eyebrow">DA CONVERSA À PRÁTICA</p>
          <h2>Três passos, sem complicação.</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              [
                "Conte seu objetivo",
                "Informe a categoria, sua experiência e os dias em que pode fazer aula.",
              ],
              [
                "Escolha seu pacote e horário",
                "Confira os itens, valores e condições antes de combinar suas aulas.",
              ],
              [
                "Pratique com confiança",
                "Receba orientação e se prepare para seu próximo passo, conforme o plano combinado.",
              ],
            ].map(([title, text], i) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 p-6"
              >
                <span className="text-3xl font-extrabold text-green-700">
                  0{i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>
        {error && (
          <p
            role="status"
            className="container my-4 rounded-xl bg-amber-50 p-4"
          >
            {error}
          </p>
        )}
        <PublicPackages packages={data.packages} contact={contact} />
        <section id="condicoes" className="container section-space">
          <p className="eyebrow">CLAREZA ANTES DE CONTRATAR</p>
          <h2>Entenda exatamente o que você está contratando.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6">
              <h3 className="text-lg font-bold">
                O que está descrito no pacote
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                <li>✓ Quantidade de aulas práticas da categoria escolhida.</li>
                <li>✓ Veículo para o exame, quando indicado no card.</li>
                <li>✓ Orientação do instrutor durante as aulas.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-bold">
                Não incluído ou sujeito a confirmação
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                Taxas oficiais, exames médico e psicológico, curso e prova
                teórica, emissão da CNH, taxas administrativas e custos
                adicionais de reteste não estão anunciados como incluídos.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Duração, local das aulas e cobertura do reteste: confirme com a
                equipe.
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            As condições podem variar conforme categoria, instrutor e
            disponibilidade. Confirme todos os detalhes antes da contratação. A
            aprovação depende do desempenho do aluno e não é garantida.
          </p>
        </section>
        <section
          id="vantagens"
          className="bg-[#0e213b] section-space text-white"
        >
          <div className="container">
            <p className="eyebrow text-green-300!">PRÓXIMO DE VOCÊ</p>
            <h2>Preparação prática, com acompanhamento.</h2>
            <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  Clock3,
                  "Flexibilidade",
                  "Horários combinados conforme a agenda disponível.",
                ],
                [
                  MapPin,
                  "Proximidade",
                  `Atendimento em ${data.city} e região, com local combinado.`,
                ],
                [
                  Route,
                  "Preparação prática",
                  "Exercícios voltados ao trânsito e à preparação para o exame.",
                ],
                [
                  ShieldCheck,
                  "Acompanhamento",
                  "Orientação clara, do primeiro contato à aula.",
                ],
              ].map(([Icon, title, text]) => (
                <article key={title}>
                  <Icon className="text-green-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <InstructorSection
          instructors={data.instructors}
          city={data.city}
          contact={(message, instructor) =>
            contact(
              `${message}${instructor ? ` Quero conversar com ${instructor.name}.` : ""}`,
              "instructor_whatsapp_click",
            )
          }
        />
        <Testimonials testimonials={data.testimonials} />
        {!data.testimonials.some((t) => t.active && t.authorized) && (
          <section id="prova-social" className="container pb-16">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="eyebrow">EXPERIÊNCIAS REAIS</p>
              <h2 className="text-2xl!">Relatos de alunos, com autorização.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Espaço reservado para depoimentos reais e autorizados. Ainda não
                há avaliações publicadas aqui. Conheça o perfil do instrutor e
                tire suas dúvidas antes de contratar.
              </p>
            </div>
          </section>
        )}
        <section
          id="duvidas"
          className="container section-space border-t border-slate-100"
        >
          <div className="grid gap-8 lg:grid-cols-[.7fr_1fr]">
            <div>
              <p className="eyebrow">ANTES DA SUA PRIMEIRA AULA</p>
              <h2>Suas dúvidas, respondidas.</h2>
              <p className="section-subtitle">
                Se algo ainda não estiver claro, converse com o instrutor antes
                de escolher.
              </p>
            </div>
            <div>
              {faqItems.map(([q, a], i) => (
                <details
                  key={q}
                  className="group border-b border-slate-200"
                  onToggle={(e) => {
                    if (e.currentTarget.open)
                      trackLanding("faq_open", { question_id: i + 1 });
                  }}
                >
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-4 text-sm font-semibold">
                    {q}
                    <Plus
                      size={18}
                      className="shrink-0 text-green-800 group-open:rotate-45"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="pb-5 text-sm leading-7 text-slate-600">
                    {typeof a === "function" ? a() : a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="container pb-16">
          <div className="rounded-3xl bg-[#0e213b] p-7 text-white sm:p-12">
            <p className="eyebrow text-green-300!">VAMOS CONVERSAR?</p>
            <h2>Pronto para dar o próximo passo?</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Conte se você precisa de carro, moto, preparação para o exame ou
              aulas para recuperar a confiança. Um instrutor poderá orientar
              você sobre o pacote mais adequado.
            </p>
            <a className="btn btn-green mt-7" href="/cadastro" onClick={() => trackLanding("signup_start", { source: "final" })}>
              Cadastre-se grátis <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 bg-slate-50 py-10">
        <div className="container grid gap-8 md:grid-cols-3">
          <div>
            <Brand />
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Conectando alunos a instrutores autônomos para aulas práticas de
              carro e moto.
            </p>
            <p className="mt-2 text-sm text-slate-600">{data.city} e região</p>
          </div>
          <div className="flex flex-col items-start gap-1 text-sm">
            <h2 className="mb-2 text-base! tracking-normal!">
              Atendimento e acesso
            </h2>
            <button
              className="min-h-11 font-semibold text-green-800"
              onClick={() => contact(undefined, "footer_whatsapp_click")}
            >
              Falar pelo WhatsApp
            </button>
            <a className="py-3" href="/aluno">
              Área do aluno
            </a>
            <a
              className="py-3"
              href="/cadastro"
              onClick={() => trackLanding("signup_start", { source: "footer" })}
            >
              Criar conta gratuita
            </a>
            <a className="py-3" href="/admin">
              Área do instrutor
            </a>
          </div>
          <div className="text-sm text-slate-600">
            <h2 className="mb-4 text-base! tracking-normal! text-slate-900">
              Informações e condições
            </h2>
            <a href="#condicoes" className="block py-3 underline">
              Condições dos pacotes
            </a>
            <a href="#duvidas" className="block py-3 underline">
              Cancelamento e reagendamento
            </a>
            {[
              [commercialInfo.privacyUrl, "Política de privacidade"],
              [commercialInfo.termsUrl, "Termos de uso"],
              [commercialInfo.instagramUrl, "Instagram"],
              [commercialInfo.mapsUrl, "Localização"],
            ]
              .filter(([url]) => /^https:\/\//.test(url || ""))
              .map(([url, label]) => (
                <a
                  className="block py-3 underline"
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {label}
                </a>
              ))}
            {(!commercialInfo.privacyUrl || !commercialInfo.termsUrl) && (
              <p className="mt-3 text-xs leading-5">
                Política de privacidade e termos: publicação pendente de
                validação pelo responsável.
              </p>
            )}
            {commercialInfo.legalName && (
              <p className="mt-3">{commercialInfo.legalName}</p>
            )}
            {commercialInfo.cnpj && <p>CNPJ: {commercialInfo.cnpj}</p>}
          </div>
        </div>
        <p className="container mt-8 text-xs text-slate-500">
          © {new Date().getFullYear()} HABILITA+.
        </p>
      </footer>
      <div
        className={`mobile-contact-bar sm:hidden ${showMobileContact ? "" : "hidden"}`}
      >
        <a className="btn btn-green w-full"
          href="/cadastro" onClick={() => trackLanding("signup_start", { source: "mobile" })}>
            Cadastre-se grátis <ArrowUpRight size={18} aria-hidden="true" />
          </a>
      </div>
      {data.ai && (
        <SpecialistChat
          inline
          contact={() => contact(undefined, "specialist_whatsapp_click")}
        />
      )}
      {notice && (
        <div
          role="status"
          className="fixed bottom-40 left-4 right-4 z-50 mx-auto flex max-w-lg gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
        >
          <p className="text-sm leading-6">{notice}</p>
          <button onClick={() => setNotice("")} aria-label="Fechar aviso">
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
