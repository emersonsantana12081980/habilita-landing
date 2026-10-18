import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { money } from "../store-data";

const bucket = "package-receipts";
export function ManualPayment({ request, admin = false, autoOpen = false, onClose }) {
  const [files, setFiles] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [opened, setOpened] = useState(autoOpen);
  const dialog = useRef(null);
  useEffect(() => {
    if (opened && !admin && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [opened, admin]);
  function close() { setOpened(false); onClose?.(); }
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
  const content = <div className="mt-4 space-y-3 text-sm">
      {!admin && <>
        {request.pricing_demo && <p className="rounded-lg bg-amber-100 p-3 font-semibold">Pedido de demonstração. Não faça uma transferência real.</p>}
        <p className="font-bold">Total do pedido: {money(request.price_cents / 100)}</p>
        <p className="font-semibold">{request.status === 'pending' ? 'Em análise — aguardando confirmação da equipe.' : request.status === 'approved' ? 'Pedido aprovado pela equipe.' : 'Pedido recusado pela equipe.'}</p>
        {request.payment_method === "card" ? <>
          <p>Cartão de crédito · {request.installment_count || 1} parcelas.</p>
          <p>A equipe enviará o link de pagamento pelo WhatsApp cadastrado. O pacote só será liberado após a conferência manual do pagamento.</p>
        </> : <>
          <h4 className="font-bold">Pix à vista</h4>
          {request.status === 'pending' && (request.pix_payment?.code ? <>
            <p>Recebedor: {request.pix_payment.receiver}<br/>Banco: {request.pix_payment.bank || 'Confira no seu aplicativo bancário'}</p>
            <label className="block">Código ou chave Pix<textarea className="mt-2 w-full break-all" readOnly rows={4} value={request.pix_payment.code}/></label>
            <button type="button" className="btn btn-outline" onClick={async () => {
              try { await navigator.clipboard.writeText(request.pix_payment.code); setMessage('Pix copiado.'); }
              catch { setMessage('Selecione o código acima e copie manualmente.'); }
            }}>Copiar Pix</button>
            <p>Confira o recebedor e o valor de {money(request.price_cents / 100)} no aplicativo do banco. Depois, envie o comprovante abaixo.</p>
          </> : <p>Este pedido ainda não possui dados Pix. Solicite os dados à equipe pelo WhatsApp.</p>)}
          {request.status === "pending" && <form onSubmit={upload} className="space-y-3">
            <label className="block">Anexar comprovante Pix (JPG, PNG ou PDF, até 5 MB)<input name="receipt" type="file" accept="image/jpeg,image/png,application/pdf" required disabled={busy}/></label>
            <button className="btn btn-green" disabled={busy}>{busy ? "Enviando…" : "Enviar comprovante para análise"}</button>
          </form>}
        </>}
      </>}
      {(admin || request.payment_method !== 'card') && <button className="underline" disabled={busy} onClick={list}>Atualizar comprovantes</button>}
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
    </div>;
  if (admin) return <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <summary className="cursor-pointer font-semibold">Consultar comprovantes</summary>{content}
  </details>;
  return <>
    {!autoOpen && <button type="button" className="btn btn-outline mt-3" onClick={() => setOpened(true)}>{request.payment_method === 'card' ? 'Acompanhar pagamento no cartão' : 'Ver Pix e enviar comprovante'}</button>}
    {opened && <dialog ref={dialog} aria-label={request.payment_method === 'card' ? 'Pagamento no cartão' : 'Pagamento Pix'} onCancel={close} onClose={close} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl p-6 text-slate-900 shadow-xl backdrop:bg-black/50">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{request.package_name}</h2><button autoFocus type="button" className="btn btn-outline" onClick={close}>Fechar</button></div>
      {content}
    </dialog>}
  </>;
}
