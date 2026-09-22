import React, { useRef, useState } from "react";
import { UsersRound, Save, Pencil, Trash2 } from "lucide-react";
import { safePhotoUrl } from "../store-data";
import { InstructorAvatar } from "./InstructorAvatar";

const empty = {
  name: "",
  category: "A+B",
  city: "",
  bio: "",
  photo: "",
  active: true,
};

export function InstructorManager({ data, update }) {
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");
  const nameInput = useRef(null);
  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });
  function save(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage("Informe o nome do instrutor.");
      return;
    }
    if (form.photo.trim() && !safePhotoUrl(form.photo.trim())) {
      setMessage(
        "Use um link HTTPS ou o caminho de uma imagem da pasta public, como /foto.jpg.",
      );
      return;
    }
    const instructor = {
      ...form,
      id: form.id || crypto.randomUUID(),
      name: form.name.trim(),
      city: form.city.trim(),
      bio: form.bio.trim(),
      photo: form.photo.trim(),
    };
    let missing = false;
    const saved = update((current) => {
      if (form.id && !current.instructors.some((i) => i.id === form.id)) {
        missing = true;
        return null;
      }
      return {
        instructors: form.id
          ? current.instructors.map((i) => (i.id === form.id ? instructor : i))
          : [...current.instructors, instructor],
      };
    });
    if (saved) {
      setForm(empty);
      setMessage(
        "Instrutor salvo. O perfil ativo já aparece na página pública deste navegador.",
      );
    } else
      setMessage(
        missing
          ? "Este instrutor foi excluído em outra aba. Cancele a edição e cadastre novamente."
          : "Não foi possível salvar o instrutor. Verifique o armazenamento do navegador.",
      );
  }
  function remove(instructor) {
    if (
      !window.confirm(
        `Excluir o instrutor ${instructor.name}? Solicitações anteriores manterão o nome registrado.`,
      )
    )
      return;
    if (
      update((current) => ({
        instructors: current.instructors.filter((i) => i.id !== instructor.id),
      }))
    ) {
      if (form.id === instructor.id) setForm(empty);
      setMessage("Instrutor excluído.");
    } else setMessage("Não foi possível excluir o instrutor.");
  }
  return (
    <section
      id="admin-instrutores"
      aria-labelledby="instructor-admin-title"
      className="admin-card mt-7"
    >
      <h2 id="instructor-admin-title" className="admin-title">
        <UsersRound size={21} /> Instrutores
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Cadastre os perfis que os alunos podem conhecer e selecionar. Apenas os
        instrutores ativos aparecem na página pública.
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={save}
          className="grid content-start gap-4 sm:grid-cols-2"
        >
          <h3 className="font-semibold sm:col-span-2">
            {form.id ? "Editar instrutor" : "Cadastrar instrutor"}
          </h3>
          <label className="sm:col-span-2">
            Nome do instrutor
            <input
              ref={nameInput}
              required
              maxLength={80}
              placeholder="Nome e sobrenome"
              {...field("name")}
            />
          </label>
          <label>
            Categorias do instrutor
            <select aria-label="Categorias do instrutor" {...field("category")}>
              <option value="A">A — Moto</option>
              <option value="B">B — Carro</option>
              <option value="A+B">A/B — Carro e moto</option>
            </select>
          </label>
          <label>
            Status do instrutor
            <select
              aria-label="Status do instrutor"
              value={String(form.active)}
              onChange={(e) =>
                setForm({ ...form, active: e.target.value === "true" })
              }
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            Cidade do instrutor
            <input maxLength={80} placeholder={data.city} {...field("city")} />
          </label>
          <label className="sm:col-span-2">
            Apresentação do instrutor
            <textarea
              rows={3}
              maxLength={350}
              placeholder="Conte como o instrutor ajuda o aluno a aprender."
              {...field("bio")}
              className="mt-2 block w-full resize-y rounded-lg border border-slate-200 p-3 text-sm font-normal text-slate-900"
            />
          </label>
          <label className="sm:col-span-2">
            Link da foto (opcional)
            <input
              type="text"
              maxLength={2000}
              placeholder="https://.../foto.jpg"
              {...field("photo")}
            />
          </label>
          <p className="text-xs leading-5 text-slate-500 sm:col-span-2">
            Use um endereço HTTPS ou /nome-do-arquivo.png da pasta public. Sem
            foto, o perfil exibe um avatar.
          </p>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button className="btn btn-green">
              <Save size={16} /> Salvar instrutor
            </button>
            {form.id && (
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  setForm(empty);
                  setMessage("");
                }}
              >
                Cancelar edição
              </button>
            )}
          </div>
          {message && (
            <p
              role="status"
              className="rounded-lg bg-slate-50 p-3 text-sm leading-6 sm:col-span-2"
            >
              {message}
            </p>
          )}
        </form>
        <div>
          <h3 className="mb-4 font-semibold">
            Instrutores cadastrados ({data.instructors.length})
          </h3>
          {!data.instructors.length && (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm leading-6 text-slate-500">
              Nenhum instrutor cadastrado. Preencha o formulário para adicionar
              o primeiro perfil.
            </div>
          )}
          <div className="space-y-3">
            {data.instructors.map((i) => (
              <article
                key={i.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4"
              >
                <InstructorAvatar instructor={i} />
                <div className="min-w-0 flex-1">
                  <h4 className="break-words text-sm font-bold">{i.name}</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Categoria {i.category.replace("+", "/")} ·{" "}
                    {i.city || data.city}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded px-2 py-1 text-[10px] ${i.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {i.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex">
                  <button
                    type="button"
                    aria-label={`Editar instrutor ${i.name}`}
                    className="flex h-11 w-11 items-center justify-center text-slate-500"
                    onClick={() => {
                      setForm(i);
                      setMessage("");
                      nameInput.current?.focus();
                    }}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Excluir instrutor ${i.name}`}
                    className="flex h-11 w-11 items-center justify-center text-red-500"
                    onClick={() => remove(i)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
