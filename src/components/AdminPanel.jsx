import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Save,
  CalendarDays,
  Settings,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Brand } from "./Brand";
import { money, normalizePhone } from "../store";
import { InstructorManager } from "./InstructorManager";
const empty = {
  name: "",
  category: "B",
  lessons: 2,
  carLessons: 2,
  motorcycleLessons: 2,
  price: "",
  active: true,
  examVehicle: false,
  freeRetest: false,
  cardInstallments: 0,
  boletoInstallments: 0,
};
export function AdminPanel({ data, update, error }) {
  const [pack, setPack] = useState(empty);
  const [settings, setSettings] = useState({
    city: data.city,
    whatsapp: data.whatsapp,
    ai: data.ai,
  });
  const [slot, setSlot] = useState("");
  const [status, setStatus] = useState("");
  function savePack(e) {
    e.preventDefault();
    const item = {
      ...pack,
      name: pack.name.trim(),
      lessons:
        pack.category === "A+B"
          ? Number(pack.carLessons) + Number(pack.motorcycleLessons)
          : Number(pack.lessons),
      carLessons: pack.category === "A+B" ? Number(pack.carLessons) : undefined,
      motorcycleLessons:
        pack.category === "A+B" ? Number(pack.motorcycleLessons) : undefined,
      cardInstallments: Number(pack.cardInstallments || 0),
      boletoInstallments: Number(pack.boletoInstallments || 0),
      price: Number(pack.price),
      id: pack.id || crypto.randomUUID(),
    };
    if (
      !item.name ||
      item.price <= 0 ||
      !Number.isInteger(item.lessons) ||
      item.lessons < 1
    ) {
      setStatus("Preencha o nome, o preço e uma quantidade inteira de aulas.");
      return;
    }
    if (
      pack.category === "A+B" &&
      ![item.carLessons, item.motorcycleLessons].every(
        (n) => Number.isInteger(n) && n > 0,
      )
    ) {
      setStatus("Informe a quantidade de aulas de carro e de moto.");
      return;
    }
    const next = pack.id
      ? data.packages.map((p) => (p.id === pack.id ? item : p))
      : [...data.packages, item];
    if (update({ packages: next })) {
      setPack(empty);
      setStatus("Pacote salvo. A página pública já foi atualizada.");
    }
  }
  function saveSettings(e) {
    e.preventDefault();
    if (!settings.city.trim()) {
      setStatus("Informe a cidade de atendimento.");
      return;
    }
    if (settings.whatsapp.trim() && !normalizePhone(settings.whatsapp)) {
      setStatus("Informe um WhatsApp com DDD válido.");
      return;
    }
    if (update({ ...settings, city: settings.city.trim() }))
      setStatus("Configurações salvas.");
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container flex min-h-24 flex-wrap items-center justify-between gap-4 py-4">
          <Brand />
          <a href="/" className="btn btn-outline">
            <ArrowLeft size={16} /> Ver página pública
          </a>
        </div>
      </header>
      <main className="container py-10">
        <p className="eyebrow">ÁREA DO INSTRUTOR</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Seu negócio, no seu controle.
        </h1>
        <a
          href="#admin-instrutores"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-green-700"
        >
          Cadastrar e gerenciar instrutores{" "}
          <ArrowLeft size={15} className="rotate-180" />
        </a>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Modo de demonstração: dados salvos apenas neste navegador. Este painel
          não possui autenticação; não use dados pessoais reais antes de
          conectar um backend seguro.
        </p>
        {(status || error) && (
          <div role="status" className="my-5 rounded-lg bg-white p-4 text-sm">
            {error || status}
          </div>
        )}
        <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-4">
          {[
            [
              Layers,
              data.packages.filter((p) => p.active).length,
              "Pacotes ativos",
            ],
            [
              CalendarDays,
              data.slots.filter(
                (s) => s.active && new Date(s.date) > new Date(),
              ).length,
              "Horários livres",
            ],
            [CheckCircle2, data.reservations.length, "Solicitações"],
          ].map(([Icon, count, label]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5"
            >
              <Icon size={19} className="mb-3 text-green-600" />
              <p className="text-2xl font-bold sm:text-3xl">{count}</p>
              <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                {label}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-7 lg:grid-cols-[1.4fr_1fr]">
          <section className="admin-card">
            <h2 className="admin-title">
              <Layers size={20} />{" "}
              {pack.id ? "Editar pacote" : "Cadastrar pacote"}
            </h2>
            <form
              onSubmit={savePack}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <label className="sm:col-span-2">
                Nome do pacote
                <input
                  required
                  maxLength={100}
                  value={pack.name}
                  placeholder="Ex.: Pacote 5 aulas de carro"
                  onChange={(e) => setPack({ ...pack, name: e.target.value })}
                />
              </label>
              <label htmlFor="package-category">
                Categoria
                <select
                  id="package-category"
                  aria-label="Categoria"
                  value={pack.category}
                  onChange={(e) =>
                    setPack({
                      ...pack,
                      category: e.target.value,
                      carLessons: pack.carLessons || 2,
                      motorcycleLessons: pack.motorcycleLessons || 2,
                    })
                  }
                >
                  <option>A</option>
                  <option>B</option>
                  <option>A+B</option>
                </select>
              </label>
              {pack.category !== "A+B" && (
                <label>
                  Quantidade de aulas
                  <input
                    type="number"
                    min="1"
                    max="200"
                    required
                    value={pack.lessons}
                    onChange={(e) =>
                      setPack({ ...pack, lessons: e.target.value })
                    }
                  />
                </label>
              )}
              {pack.category === "A+B" && (
                <>
                  <label>
                    Aulas de carro
                    <input
                      required
                      type="number"
                      min="1"
                      max="200"
                      value={pack.carLessons ?? ""}
                      onChange={(e) =>
                        setPack({ ...pack, carLessons: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Aulas de moto
                    <input
                      required
                      type="number"
                      min="1"
                      max="200"
                      value={pack.motorcycleLessons ?? ""}
                      onChange={(e) =>
                        setPack({ ...pack, motorcycleLessons: e.target.value })
                      }
                    />
                  </label>
                </>
              )}
              <label>
                Preço (R$)
                <input
                  type="number"
                  min="0.01"
                  max="100000"
                  step="0.01"
                  required
                  value={pack.price}
                  onChange={(e) => setPack({ ...pack, price: e.target.value })}
                />
              </label>
              <div className="space-y-3 sm:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(pack.examVehicle)}
                    onChange={(e) =>
                      setPack({ ...pack, examVehicle: e.target.checked })
                    }
                  />{" "}
                  Veículo para o exame incluso
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(pack.freeRetest)}
                    onChange={(e) =>
                      setPack({ ...pack, freeRetest: e.target.checked })
                    }
                  />{" "}
                  Reteste grátis
                </label>
              </div>
              <label>
                Parcelas no cartão
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={pack.cardInstallments || 0}
                  onChange={(e) =>
                    setPack({ ...pack, cardInstallments: e.target.value })
                  }
                />
              </label>
              <label>
                Parcelas no boleto
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={pack.boletoInstallments || 0}
                  onChange={(e) =>
                    setPack({ ...pack, boletoInstallments: e.target.value })
                  }
                />
              </label>
              <p className="text-xs text-slate-500 sm:col-span-2">
                Preço à vista. Use 0 para não oferecer uma modalidade de
                parcelamento. Cobranças não são geradas nesta demonstração.
              </p>
              <label htmlFor="package-status">
                Status
                <select
                  id="package-status"
                  aria-label="Status"
                  value={String(pack.active)}
                  onChange={(e) =>
                    setPack({ ...pack, active: e.target.value === "true" })
                  }
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </label>
              <div className="flex gap-3 sm:col-span-2">
                <button className="btn btn-green">
                  <Save size={16} /> Salvar pacote
                </button>
                {pack.id && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setPack(empty)}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
            <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">
              <h3 className="font-semibold">
                Pacotes cadastrados ({data.packages.length})
              </h3>
              {!data.packages.length && (
                <p className="text-sm text-slate-500">
                  Nenhum pacote cadastrado. A página exibirá o convite para
                  conversar no WhatsApp.
                </p>
              )}
              {data.packages.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-bold">{p.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Categoria {p.category} · {p.lessons} aulas ·{" "}
                      {money(p.price)}
                    </p>
                    <span
                      className={
                        "mt-2 inline-block rounded px-2 py-1 text-[10px] " +
                        (p.active
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500")
                      }
                    >
                      {p.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <button
                    aria-label={"Editar " + p.name}
                    onClick={() => setPack(p)}
                    className="p-2 text-slate-500"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    aria-label={"Excluir " + p.name}
                    onClick={() => {
                      if (window.confirm("Excluir o pacote " + p.name + "?")) {
                        update({
                          packages: data.packages.filter((x) => x.id !== p.id),
                        });
                        if (pack.id === p.id) setPack(empty);
                      }
                    }}
                    className="p-2 text-red-500"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          </section>
          <div className="space-y-7">
            <section className="admin-card">
              <h2 className="admin-title">
                <Settings size={20} /> Configurações rápidas
              </h2>
              <form onSubmit={saveSettings} className="mt-6 space-y-4">
                <label>
                  Cidade de atendimento
                  <input
                    required
                    maxLength={80}
                    value={settings.city}
                    onChange={(e) =>
                      setSettings({ ...settings, city: e.target.value })
                    }
                  />
                </label>
                <label>
                  WhatsApp com DDD
                  <input
                    type="tel"
                    placeholder="(12) 99999-9999"
                    value={settings.whatsapp}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsapp: e.target.value })
                    }
                  />
                </label>
                <p className="text-xs leading-5 text-slate-500">
                  Cadastre um número autorizado para habilitar os botões de
                  contato.
                </p>
                <label className="flex items-center gap-3">
                  <input
                    className="w-auto!"
                    type="checkbox"
                    checked={settings.ai}
                    onChange={(e) =>
                      setSettings({ ...settings, ai: e.target.checked })
                    }
                  />{" "}
                  Exibir atendimento Chatvolt
                </label>
                <button className="btn btn-green">
                  <Save size={16} /> Salvar configurações
                </button>
              </form>
            </section>
            <section className="admin-card">
              <h2 className="admin-title">
                <CalendarDays size={20} /> Disponibilidade
              </h2>
              <form
                className="mt-5 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (new Date(slot) <= new Date()) {
                    setStatus("Escolha um horário futuro.");
                    return;
                  }
                  if (data.slots.some((s) => s.date === slot)) {
                    setStatus("Este horário já foi cadastrado.");
                    return;
                  }
                  if (
                    update({
                      slots: [
                        ...data.slots,
                        { id: crypto.randomUUID(), date: slot, active: true },
                      ],
                    })
                  ) {
                    setSlot("");
                    setStatus("Horário liberado.");
                  }
                }}
              >
                <label>
                  Data e hora
                  <input
                    type="datetime-local"
                    required
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                  />
                </label>
                <button className="btn btn-outline">
                  <Plus size={16} /> Liberar horário
                </button>
              </form>
              <div className="mt-5 space-y-3">
                {!data.slots.length && (
                  <p className="text-sm text-slate-500">
                    Nenhum horário liberado.
                  </p>
                )}
                {[...data.slots]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs"
                    >
                      <span>
                        {new Date(s.date).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      <button
                        className={
                          s.active ? "text-green-700" : "text-slate-400"
                        }
                        onClick={() =>
                          update({
                            slots: data.slots.map((x) =>
                              x.id === s.id ? { ...x, active: !x.active } : x,
                            ),
                          })
                        }
                      >
                        {s.active
                          ? "Disponível · bloquear"
                          : "Bloqueado · liberar"}
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        </div>
        <InstructorManager data={data} update={update} />
        <section className="admin-card mt-7">
          <h2 className="admin-title">Solicitações demonstrativas</h2>
          <p className="my-4 text-xs text-slate-500">
            Solicitações locais não representam pagamentos ou aulas confirmadas.
          </p>
          {!data.reservations.length ? (
            <p className="text-sm text-slate-500">
              Nenhuma solicitação recebida neste navegador.
            </p>
          ) : (
            data.reservations.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap justify-between gap-3 border-t border-slate-100 py-4 text-sm"
              >
                <span>
                  <strong>{r.name}</strong> · {r.phone}
                  <br />
                  <span className="text-slate-500">
                    {r.packageName} · {new Date(r.date).toLocaleString("pt-BR")}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Instrutor: {r.instructorName || "Sem preferência"}
                  </span>
                </span>
                <span className="text-amber-700">Aguardando contato</span>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
