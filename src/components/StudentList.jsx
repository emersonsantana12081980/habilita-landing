import React from "react";

const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function StudentList({ students, balance, onEdit, onHistory, onStatus, filters, setFilters }) {
  const { search, status, category } = filters;
  const setSearch = (search) => setFilters(f => ({...f,search}));
  const setStatus = (status) => setFilters(f => ({...f,status}));
  const setCategory = (category) => setFilters(f => ({...f,category}));
  const visible = students.filter((s) => {
    const query = normalize(search.trim());
    const digits = search.replace(/\D/g, "");
    return (status === "all" || (status === "active" ? s.active : !s.active)) &&
      (!category || s.category === category) &&
      (!query || normalize(s.name).includes(query) || normalize(s.phone).includes(query) ||
        (digits.length > 0 && /^[\d\s()+.-]+$/.test(search) && String(s.phone || "").replace(/\D/g, "").includes(digits)));
  }).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return <section aria-label="Lista de alunos" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-[2fr_1fr_1fr]">
      <label className="text-sm font-semibold">Buscar aluno
        <input type="search" placeholder="Nome ou WhatsApp" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      <label className="text-sm font-semibold">Situação do cadastro
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Ativos</option><option value="archived">Arquivo morto (inativos)</option><option value="all">Todos</option>
        </select>
      </label>
      <label className="text-sm font-semibold">Categoria do aluno
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas</option><option value="A">A — Moto</option><option value="B">B — Carro</option><option value="A+B">A+B — Carro e moto</option>
        </select>
      </label>
    </div>
    <p className="px-4 py-3 text-sm text-slate-500" role="status">{visible.length} cadastro(s) encontrado(s). Arquivar mantém créditos e histórico.</p>
    <ul className="divide-y divide-slate-100">
      {visible.map((student) => <li key={student.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="min-w-0 flex-1 basis-56">
          <div className="flex flex-wrap items-center gap-2"><h2 className="break-words font-bold">{student.name}</h2>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${student.active ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-600"}`}>{student.active ? "Ativo" : "Arquivado"}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{student.phone || "Sem WhatsApp"} · Categoria {student.category}</p>
          <p className="mt-1 text-xs text-slate-500">Créditos livres: moto {balance(student.id, "A")} · carro {balance(student.id, "B")}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button className="rounded-lg border px-3 py-2 font-semibold" onClick={() => onEdit(student)}>Editar aluno</button>
          <button className="rounded-lg border px-3 py-2" onClick={() => onHistory(student)}>Ver histórico</button>
          <button className={`rounded-lg px-3 py-2 font-semibold ${student.active ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`} onClick={() => {
            if (window.confirm(student.active
              ? `Enviar ${student.name} para o arquivo morto? O cadastro ficará inativo, sem novos agendamentos. Créditos, histórico e aulas já agendadas serão mantidos.`
              : `Restaurar ${student.name} como aluno ativo?`)) onStatus(student, !student.active);
          }}>{student.active ? "Enviar ao arquivo morto" : "Restaurar cadastro"}</button>
        </div>
      </li>)}
    </ul>
    {!visible.length && <p className="p-6 text-center text-slate-500">Nenhum aluno encontrado com estes filtros.</p>}
  </section>;
}
