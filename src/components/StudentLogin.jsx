import React, { useState } from "react";
import { LogIn, LockKeyhole } from "lucide-react";
export const DEMO_PASSWORD = "habilita-demo";

export function StudentLogin({ clients, enter }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  function submit(e) {
    e.preventDefault();
    const client = clients.find(
      (c) =>
        c.source === "student-demo" &&
        c.active &&
        c.email?.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!client || password !== DEMO_PASSWORD) {
      setMessage("Confira o e-mail cadastrado e a senha de demonstração.");
      return;
    }
    setPassword("");
    enter(client.id);
  }
  return (
    <section className="admin-card mx-auto mt-8 max-w-md">
      <div className="mb-5 inline-flex rounded-2xl bg-green-50 p-3 text-green-700">
        <LockKeyhole size={25} />
      </div>
      <p className="eyebrow">ÁREA DO ALUNO</p>
      <h1 className="mt-3 text-3xl font-extrabold">Bom ter você de volta.</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Entre para acompanhar seus créditos e suas aulas.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label>
          E-mail de acesso
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="btn btn-green w-full">
          <LogIn size={17} /> Entrar
        </button>
      </form>
      <button
        className="mt-4 text-sm font-semibold text-green-700"
        onClick={() =>
          setMessage(
            "A recuperação por e-mail será ativada com o login seguro. Para testar agora, use a senha de demonstração habilita-demo. Nenhum e-mail foi enviado.",
          )
        }
      >
        Esqueci minha senha
      </button>
      {message && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900"
        >
          {message}
        </p>
      )}
      <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
        Teste com o e-mail do cadastro fictício e a senha{" "}
        <strong>{DEMO_PASSWORD}</strong>. Esta senha é compartilhada, não
        protege dados reais. Não use sua senha pessoal.
      </p>
    </section>
  );
}
