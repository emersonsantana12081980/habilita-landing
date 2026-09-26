import React, { useState } from "react";
import { Bell, CheckCircle2, Users } from "lucide-react";
import { money } from "../store-data";
import { resolvePackage } from "../student";

export function StudentRequests({ data, update }) {
  const [review, setReview] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  function resolve(id, status) {
    let error = "";
    const saved = update((current) => {
      const result = resolvePackage(current, id, status, reason);
      if (result.error) {
        error = result.error;
        return null;
      }
      return result.patch;
    });
    setMessage(
      saved
        ? status === "approved"
          ? "Créditos liberados uma única vez para este pedido. Nenhum pagamento foi registrado."
          : "Solicitação recusada."
        : error || "Não foi possível atualizar.",
    );
    if (saved) {
      setReview("");
      setReason("");
    }
  }
  const requests = [...data.packageRequests].sort(
    (a, b) =>
      Number(b.status === "pending") - Number(a.status === "pending") ||
      b.createdAt.localeCompare(a.createdAt),
  );
  return (
    <section className="admin-card">
      <h2 className="admin-title">
        <Users size={21} /> Pedidos de alunos
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Confira o pacote e libere os créditos para o aluno agendar. Nesta
        demonstração, a liberação é manual; não registra recebimento nem
        comprova pagamento.
      </p>
      {message && (
        <p role="status" className="my-4 rounded-xl bg-slate-50 p-4 text-sm">
          {message}
        </p>
      )}
      {!requests.length && (
        <p className="mt-6 text-sm text-slate-500">
          Nenhum pacote solicitado. Use a área do aluno para testar um cadastro
          gratuito.
        </p>
      )}
      <div className="mt-5 space-y-4">
        {requests.map((r) => (
          <article
            key={r.id}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h3 className="font-bold">{r.clientName}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {r.name} · {money(r.priceCents / 100)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {r.credits.B} créditos de carro + {r.credits.A} créditos de
                  moto
                </p>
              </div>
              <span className="text-xs font-semibold text-green-700">
                {r.status === "pending"
                  ? "Aguardando análise"
                  : r.status === "approved"
                    ? "Liberado manualmente"
                    : "Recusado"}
              </span>
            </div>
            {r.reason && (
              <p className="mt-3 text-xs text-slate-500">Motivo: {r.reason}</p>
            )}
            {r.status === "pending" &&
              (review === r.id ? (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <label>
                    Motivo da liberação ou recusa
                    <input
                      maxLength={250}
                      value={reason}
                      placeholder="Ex.: liberação de teste autorizada pelo instrutor"
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <p className="text-xs text-slate-500">
                    O motivo será exibido ao aluno. Os créditos correspondem ao
                    pacote solicitado, sem alteração retroativa de preço.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      disabled={!reason.trim()}
                      className="btn btn-green disabled:opacity-40"
                      onClick={() => resolve(r.id, "approved")}
                    >
                      <CheckCircle2 size={17} /> Liberar créditos
                    </button>
                    <button
                      disabled={!reason.trim()}
                      className="btn btn-outline disabled:opacity-40"
                      onClick={() => resolve(r.id, "rejected")}
                    >
                      Recusar pedido
                    </button>
                    <button
                      className="text-sm text-slate-500"
                      onClick={() => setReview("")}
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-outline mt-4"
                  onClick={() => {
                    setReview(r.id);
                    setReason("");
                  }}
                >
                  Revisar pedido
                </button>
              ))}
          </article>
        ))}
      </div>
    </section>
  );
}

export function StudentNotifications({ data, update, openLesson }) {
  const notices = data.notifications.filter((n) => !n.read);
  if (!notices.length) return null;
  return (
    <section className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
      <h2 className="admin-title">
        <Bell size={20} /> Novas aulas de alunos ({notices.length})
      </h2>
      <p className="mt-2 text-xs text-slate-600">
        Avisos desta demonstração, sincronizados entre abas do mesmo navegador.
      </p>
      <div className="mt-3 space-y-3">
        {notices.map((n) => (
          <div
            key={n.id}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-green-200 pt-3"
          >
            <div>
              <p className="text-sm font-bold">
                {n.clientName} · {n.category === "A" ? "Moto" : "Carro"}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {new Date(n.start).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}{" "}
                · {n.instructorName}
              </p>
            </div>
            <button
              className="btn btn-outline"
              onClick={() => {
                if (
                  update((current) => ({
                    notifications: current.notifications.map((x) =>
                      x.id === n.id ? { ...x, read: true } : x,
                    ),
                  }))
                )
                  openLesson(n);
              }}
            >
              Ver aula e marcar como lida
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
