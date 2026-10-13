import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { money } from "../store-data";

const bucket = "package-receipts";
export function ManualPayment({ request, admin = false }) {
  const [files, setFiles] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  async function list() {
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.storage.from(bucket).list(request.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      setFiles(data || []);
    } catch { setMessage("Não foi possível consultar os comprovantes. Peça à equipe para conferir a configuração de anexos."); }
    finally { setBusy(false); }
  }
  async function upload(e) {
    e.preventDefault();
    const file = e.currentTarget.elements.receipt.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage("Escolha uma imagem JPG, PNG ou PDF de até 5 MB."); return;
    }
    setBusy(true); setMessage("");
    try {
      const extension = { "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf" }[file.type];
      const { error } = await supabase.storage.from(bucket).upload(`${request.id}/${crypto.randomUUID()}.${extension}`, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setMessage("Comprovante enviado. Aguarde a conferência manual da equipe. O envio não libera aulas automaticamente.");
      setFiles(null);
    } catch { setMessage("O comprovante não foi enviado. Tente novamente; se persistir, fale com a equipe para ativar os anexos."); }
    finally { setBusy(false); }
  }
  return <details open={!admin && request.status === "pending" ? true : undefined} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <summary className="cursor-pointer font-semibold">{admin ? "Consultar comprovantes" : "Pagamento e comprovante"}</summary>
    <div className="mt-4 space-y-3 text-sm">
      {!admin && <>
        <p className="rounded-lg bg-amber-100 p-3 font-semibold">Ambiente de teste: dados fictícios. Não faça uma transferência real.</p>
        <p className="font-bold">Total do pedido: {money(request.price_cents / 100)}</p>
        {request.payment_method === "card" ? <>
          <p>Cartão de crédito · {request.installment_count || 1} parcelas. A equipe combinará o pagamento com você.</p>
          <p>Esta simulação não cobra o cartão. Não envie número do cartão, validade ou código de segurança.</p>
        </> : <>
          <h4 className="font-bold">Pix à vista · demonstração</h4>
          <p>Recebedor: Habilita Mais — TESTE<br/>Banco: Banco fictício de testes<br/>Chave fictícia: PIX-DEMONSTRACAO-SEM-VALIDADE</p>
          <p>Use um arquivo de teste para experimentar o envio do comprovante.</p>
          {request.status === "pending" && <form onSubmit={upload} className="space-y-3">
            <label className="block">Anexar comprovante Pix (JPG, PNG ou PDF, até 5 MB)<input name="receipt" type="file" accept="image/jpeg,image/png,application/pdf" required disabled={busy}/></label>
            <button className="btn btn-green" disabled={busy}>{busy ? "Enviando…" : "Enviar comprovante para análise"}</button>
          </form>}
        </>}
      </>}
      <button className="underline" disabled={busy} onClick={list}>Atualizar comprovantes</button>
      {files?.length === 0 && <p>Nenhum comprovante anexado.</p>}
      {files?.map((file, i) => <button key={file.name} className="block underline" disabled={busy} onClick={async () => {
        setBusy(true); setUrl(""); setMessage("");
        try {
          const { data, error } = await supabase.storage.from(bucket).createSignedUrl(`${request.id}/${file.name}`, 60);
          if (error) throw error;
          setUrl(data.signedUrl);
        } catch { setMessage("Não foi possível abrir o comprovante. Tente novamente."); }
        finally { setBusy(false); }
      }}>Preparar comprovante {i + 1}</button>)}
      {url && <a className="block font-bold underline" href={url} target="_blank" rel="noreferrer">Abrir comprovante (link válido por 1 minuto)</a>}
      {message && <p role="status">{message}</p>}
    </div>
  </details>;
}
