import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  MessageCircle,
  Check,
  CarFront,
  ShieldCheck,
  Clock3,
  MapPin,
  CalendarDays,
  Menu,
  X,
  Plus,
  Minus,
  Route,
} from "lucide-react";
import { useStore, whatsappUrl } from "./store";
import { AdminPanel } from "./components/AdminPanel";
import { Booking } from "./components/Booking";
import { Brand } from "./components/Brand";
import { CategorySection } from "./components/CategorySection";
import { SpecialistChat } from "./components/SpecialistChat";
import { PackageDetails } from "./components/PackageDetails";
import { packageMessage } from "./store-data";
import { Testimonials } from "./components/Testimonials";
import { InstructorSection } from "./components/InstructorSection";

export function App() {
  const [data, update, error] = useStore();
  const [booking, setBooking] = useState(null);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const selectedInstructor = data.instructors.find(
    (i) => i.id === selectedInstructorId && i.active,
  );
  useEffect(() => {
    if (selectedInstructorId && !selectedInstructor)
      setSelectedInstructorId("");
  }, [selectedInstructorId, selectedInstructor]);
  const contact = (message, instructor = selectedInstructor) => {
    const text =
      message || "Olá! Quero saber mais sobre as aulas da HABILITA+.";
    const url = whatsappUrl(
      data.whatsapp,
      text +
        (instructor
          ? ` Minha preferência de instrutor: ${instructor.name}.`
          : ""),
    );
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      setNotice(
        "O contato de atendimento será disponibilizado em breve. Enquanto isso, conheça nossas modalidades e pacotes.",
      );
    }
  };
  if (window.location.pathname.replace(/\/$/, "") === "/admin")
    return <AdminPanel data={data} update={update} error={error} />;
  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <header className="fixed top-0 z-30 w-full border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="container flex h-21 items-center justify-between gap-4">
          <Brand />
          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-4 text-xs font-medium lg:flex xl:gap-6"
          >
            <a href="#vantagens">Por que Habilita+?</a>
            <a href="#categorias">Categorias</a>
            <a href="#instrutores">Instrutores</a>
            <a href="#pacotes">Nossos pacotes</a>
            <a href="#duvidas">Dúvidas frequentes</a>
          </nav>
          <button
            className="btn btn-green hidden sm:flex"
            onClick={() => contact()}
          >
            <MessageCircle size={17} /> Vamos conversar{" "}
            <ArrowUpRight size={16} />
          </button>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-50 lg:hidden"
            aria-label={menu ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            onClick={() => setMenu(!menu)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setMenu(false);
            }}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
        {menu && (
          <nav
            id="mobile-menu"
            aria-label="Navegação móvel"
            className="flex flex-col gap-2 border-t border-slate-100 bg-white p-5 lg:hidden"
            onKeyDown={(event) => {
              if (event.key === "Escape") setMenu(false);
            }}
          >
            {[
              ["vantagens", "Por que Habilita+?"],
              ["categorias", "Categorias"],
              ["instrutores", "Instrutores"],
              ["pacotes", "Nossos pacotes"],
              ["duvidas", "Dúvidas frequentes"],
            ].map(([id, label]) => (
              <a
                className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-green-50"
                key={id}
                href={"#" + id}
                onClick={() => setMenu(false)}
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>
      <main id="conteudo">
        <section className="hero relative overflow-hidden">
          <div className="container grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:py-20">
            <div className="relative z-10 min-w-0">
              <div className="launch-badge">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-600" />{" "}
                VAGAS DE LANÇAMENTO EM {data.city.toUpperCase()}
              </div>
              <h1 className="hero-title mt-6 font-extrabold leading-[1.08] tracking-[-.045em]">
                Lançamento
                <br />
                em {data.city}.<br />
                <span className="text-green-600">Categorias A e B.</span>
              </h1>
              <p className="mt-6 max-w-[440px] text-base leading-7 text-slate-500">
                Aprenda a dirigir sem estresse e conquiste sua CNH. Aulas
                práticas de{" "}
                <strong className="font-semibold text-slate-700">
                  carro e moto
                </strong>
                , no seu ritmo e com quem entende do caminho.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="check-circle">
                    <Check size={12} />
                  </span>{" "}
                  Aulas práticas personalizadas
                </span>
                <span className="flex items-center gap-2">
                  <span className="check-circle">
                    <Check size={12} />
                  </span>{" "}
                  Veículos inclusos para o exame
                </span>
              </div>
              <button
                onClick={() => contact()}
                className="btn btn-green pulse-cta mt-8 min-h-14 w-full sm:w-auto"
              >
                <MessageCircle size={20} /> Chame agora no WhatsApp{" "}
                <ArrowUpRight size={19} />
              </button>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <MapPin size={14} className="text-green-600" /> Em {data.city} e
                região <span className="mx-1 text-slate-300">•</span> Categorias
                A e B
              </div>
            </div>
            <div className="relative lg:ml-1">
              <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full border border-green-200/50" />
              <div className="hero-photo relative overflow-hidden rounded-[24px] shadow-xl shadow-slate-900/10">
                <div className="vehicle-frame">
                  <img
                    src="/vehicles.png"
                    alt="Fiat Mobi prata com a identidade HABILITA+"
                    width="1536"
                    height="1024"
                    fetchPriority="high"
                  />
                </div>
                <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/30 bg-white/95 px-3 py-2 text-[9px] font-bold tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> SEU
                  PRÓXIMO PASSO ESTÁ AQUI
                </span>
                <div className="bg-[#0e213b] px-6 py-7 text-white sm:px-7">
                  <p className="text-[9px] font-medium tracking-[.16em] text-green-300">
                    MAIS CONFIANÇA. MAIS INDEPENDÊNCIA.
                  </p>
                  <p className="mt-2 max-w-sm text-[22px] font-semibold leading-snug tracking-tight sm:text-2xl">
                    Você no comando do seu futuro.
                  </p>
                </div>
              </div>
              <div className="relative mx-4 -mt-1 flex items-center gap-3 rounded-b-xl border border-t-0 border-slate-100 bg-white px-4 py-4 shadow-lg shadow-slate-900/5 sm:mx-6 sm:px-5">
                <span className="rounded-full bg-green-50 p-2.5 text-green-600">
                  <ShieldCheck size={23} />
                </span>
                <div>
                  <p className="text-sm font-bold">Segurança em cada trajeto</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Acompanhamento do início ao exame
                  </p>
                </div>
              </div>
              <div className="absolute -left-5 top-[35%] hidden rounded-xl border border-slate-100 bg-white p-3 shadow-lg sm:block">
                <CarFront className="text-green-600" size={27} />
              </div>
            </div>
          </div>
        </section>
        <section className="border-y border-slate-100 bg-white">
          <div className="container grid grid-cols-2 gap-5 py-7 lg:grid-cols-4">
            {[
              [ShieldCheck, "Sua segurança em primeiro lugar"],
              [Clock3, "Horários que cabem na sua rotina"],
              [CarFront, "Carro e moto para sua preparação"],
              [MapPin, "Perto de você, em " + data.city],
            ].map(([Icon, label]) => (
              <div
                key={label}
                className="flex items-center justify-center gap-3 text-[11px] font-semibold text-slate-600"
              >
                <Icon
                  size={20}
                  strokeWidth={1.6}
                  className="shrink-0 text-green-600"
                />
                {label}
              </div>
            ))}
          </div>
        </section>
        <section id="vantagens" className="container section-space">
          <div className="text-center">
            <p className="eyebrow">MENOS COMPLICAÇÃO, MAIS CONQUISTAS</p>
            <h2>Um novo jeito de chegar à sua CNH.</h2>
            <p className="section-subtitle">
              Mais do que ensinar a dirigir, ajudamos você a ganhar confiança.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              [
                Route,
                "Treino para a vida real",
                "Da baliza ao trânsito da cidade. Uma preparação prática, focada nas suas necessidades.",
              ],
              [
                CalendarDays,
                "Seu tempo, seu ritmo",
                "Combine os melhores horários com o instrutor e aprenda sem atropelar sua rotina.",
              ],
              [
                ShieldCheck,
                "Ao seu lado em cada etapa",
                "Orientação próxima, paciência e veículos preparados para você evoluir com segurança.",
              ],
            ].map(([Icon, title, desc], i) => (
              <article key={title} className="feature-card">
                <div className="flex items-start justify-between">
                  <span className="icon-tile">
                    <Icon size={24} strokeWidth={1.7} />
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold tracking-tight">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{desc}</p>
              </article>
            ))}
          </div>
        </section>
        <CategorySection
          contact={contact}
          packages={data.packages}
          book={setBooking}
        />
        <InstructorSection
          instructors={data.instructors}
          city={data.city}
          selectedId={selectedInstructorId}
          select={setSelectedInstructorId}
          contact={contact}
        />
        <section id="pacotes" className="container section-space">
          <div className="text-center">
            <p className="eyebrow">SEU OBJETIVO, SEU PLANO</p>
            <h2>O pacote certo para você.</h2>
            <p className="section-subtitle">
              Para começar, reforçar ou recuperar a confiança. Vamos juntos.
            </p>
          </div>
          {data.packages.filter((p) => p.active).length ? (
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {data.packages
                .filter((p) => p.active)
                .map((p) => (
                  <article key={p.id} className="feature-card flex flex-col">
                    <span className="eyebrow">CATEGORIA {p.category}</span>
                    <h3 className="mt-4 text-xl font-bold">{p.name}</h3>
                    <div className="mb-6 mt-5">
                      <PackageDetails pack={p} />
                    </div>
                    <button
                      className="btn btn-green mt-auto"
                      onClick={() => setBooking(p)}
                    >
                      Agendar / garantir pacote <ArrowRight size={16} />
                    </button>
                    <button
                      className="btn btn-outline mt-3"
                      onClick={() => contact(packageMessage(p))}
                    >
                      <MessageCircle size={17} /> Quero este pacote no WhatsApp
                    </button>
                  </article>
                ))}
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center gap-7 rounded-2xl border border-green-100 bg-[#f3faf5] p-8 md:flex-row md:p-10">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-green-600">
                <MessageCircle size={29} strokeWidth={1.6} />
              </span>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold tracking-tight">
                  Seu plano começa com uma conversa.
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Escolha seu pacote diretamente com o instrutor no WhatsApp.
                  Conte seu objetivo e encontre a melhor opção para você.
                </p>
              </div>
              <button
                className="btn btn-green shrink-0"
                onClick={() =>
                  contact("Olá! Quero montar meu pacote de aulas.")
                }
              >
                Montar meu pacote <ArrowUpRight size={17} />
              </button>
            </div>
          )}
        </section>
        <Testimonials testimonials={data.testimonials} />
        <section className="container pb-16">
          <div className="rounded-[24px] bg-[#0e213b] px-7 py-12 text-white md:px-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
              <div>
                <p className="eyebrow text-green-400!">SIMPLES ASSIM</p>
                <h2 className="mt-3! text-white!">
                  Da primeira conversa
                  <br />à primeira conquista.
                </h2>
              </div>
              <div className="grid gap-7 sm:grid-cols-3">
                {[
                  [
                    "01",
                    "Vamos conversar",
                    "Conte seu objetivo e tire suas dúvidas.",
                  ],
                  [
                    "02",
                    "Escolha seu horário",
                    "Combine um plano que cabe na sua rotina.",
                  ],
                  [
                    "03",
                    "É hora de praticar",
                    "Ganhe confiança a cada nova aula.",
                  ],
                ].map(([n, title, desc]) => (
                  <div key={n}>
                    <span className="text-sm font-bold text-green-400">
                      {n} <span className="ml-2 text-slate-600">————</span>
                    </span>
                    <h3 className="mt-5 text-sm font-semibold">{title}</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-400">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section
          id="duvidas"
          className="container grid gap-8 pb-20 md:grid-cols-[.8fr_1fr]"
        >
          <div>
            <p className="eyebrow">PODE PERGUNTAR</p>
            <h2>Dúvidas pelo caminho?</h2>
            <p className="mt-4 text-sm text-slate-500">
              A gente ajuda você a dar o próximo passo.
            </p>
            <button
              className="mt-6 flex items-center gap-2 text-sm font-semibold text-green-700"
              onClick={() => contact()}
            >
              Fale com o instrutor <ArrowUpRight size={16} />
            </button>
          </div>
          <div>
            {[
              [
                "Nunca dirigi. Posso fazer as aulas?",
                "As aulas podem ser adaptadas ao seu nível de experiência. Converse com o instrutor para avaliar sua preparação e confirmar os requisitos e documentos necessários antes de começar.",
              ],
              [
                "Os veículos estão inclusos para o exame?",
                "Sim, a proposta inclui carro ou moto para o exame conforme a categoria e o pacote combinado. Confirme disponibilidade, local e condições com o instrutor.",
              ],
              [
                "Como escolho os dias e horários?",
                "Você pode consultar os horários disponibilizados em um pacote ou combinar sua disponibilidade diretamente pelo WhatsApp.",
              ],
              [
                "Já tenho CNH, mas tenho medo de dirigir. Vocês ajudam?",
                "Sim! Converse com o instrutor sobre aulas de reforço e retomada da confiança, com exercícios adaptados ao seu ritmo.",
              ],
            ].map(([q, a]) => (
              <details key={q} className="group border-b border-slate-200 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                  {q}
                  <Plus
                    size={16}
                    className="shrink-0 text-slate-400 group-open:hidden"
                  />
                  <Minus
                    size={16}
                    className="hidden shrink-0 text-green-600 group-open:block"
                  />
                </summary>
                <p className="mt-4 text-sm leading-6 text-slate-500">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-100 bg-slate-50 py-9">
        <div className="container flex flex-wrap items-center justify-between gap-6">
          <Brand />
          <p className="text-xs text-slate-500">
            Conectando você à sua CNH.
            <br />
            <span className="mt-1 inline-block">{data.city} · SP</span>
          </p>
          <div className="text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} HABILITA+. Todos os direitos
              reservados.
            </p>
            <a
              href="/admin"
              className="mt-2 inline-block underline underline-offset-4"
            >
              Área do instrutor
            </a>
          </div>
        </div>
      </footer>
      <div className="mobile-contact-bar sm:hidden">
        <button onClick={() => contact()} className="btn btn-green w-full">
          <MessageCircle size={18} /> Falar com o instrutor{" "}
          <ArrowUpRight size={17} />
        </button>
      </div>
      {data.ai && <SpecialistChat contact={contact} />}{" "}
      {booking && (
        <Booking
          initialInstructorId={selectedInstructorId}
          pack={booking}
          data={data}
          update={update}
          close={() => setBooking(null)}
          contact={contact}
        />
      )}{" "}
      {notice && (
        <div
          className="fixed bottom-24 left-4 right-4 z-50 mx-auto flex max-w-lg items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:bottom-6"
          role="status"
        >
          <p className="text-sm leading-6">{notice}</p>
          <button aria-label="Fechar aviso" onClick={() => setNotice("")}>
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}
