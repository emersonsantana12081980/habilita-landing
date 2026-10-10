import React, { useEffect, useRef, useState } from "react";
import { Wallet, Plus, ShieldCheck } from "lucide-react";
import { money } from "../store-data";

function DepositPreview({onClose}) {
  const ref=useRef(null);
  const [amount,setAmount]=useState("100"),[method,setMethod]=useState("pix"),[review,setReview]=useState(false);
  const cents=Math.round(Number(amount)*100);
  useEffect(()=>{
    const previous=document.activeElement,element=ref.current,overflow=document.body.style.overflow;
    element.showModal();document.body.style.overflow="hidden";
    return ()=>{element.close();document.body.style.overflow=overflow;previous?.focus();};
  },[]);
  return <dialog ref={ref} aria-labelledby="deposit-title" onCancel={e=>{e.preventDefault();onClose();}} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border-0 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/50">
    <div className="flex items-center justify-between gap-3"><h2 id="deposit-title" className="text-xl font-bold">Adicionar saldo</h2><button className="rounded-lg border px-3 py-2 text-sm" onClick={onClose}>Fechar</button></div>
    <p className="my-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Prévia visual. Nenhuma cobrança ou solicitação real será criada.</p>
    {!review?<form className="space-y-4" onSubmit={e=>{e.preventDefault();if(Number.isFinite(cents)&&cents>0)setReview(true);}}>
      <label className="block font-semibold">Valor do depósito (R$)<input required type="number" step="0.01" min="1" max="10000" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
      <div className="grid grid-cols-3 gap-2">{[50,100,200].map(value=><button type="button" key={value} className={`rounded-lg border py-3 text-sm font-semibold ${Number(amount)===value?'border-green-600 bg-green-50 text-green-800':''}`} onClick={()=>setAmount(String(value))}>{money(value)}</button>)}</div>
      <fieldset><legend className="mb-2 font-semibold">Forma de pagamento</legend><div className="grid grid-cols-2 gap-3">{[['pix','Pix'],['card','Cartão']].map(([value,label])=><label key={value} className="flex items-center gap-2 rounded-lg border p-3"><input type="radio" name="deposit-method" value={value} checked={method===value} onChange={()=>setMethod(value)}/>{label}</label>)}</div></fieldset>
      <p className="text-xs text-slate-500">Pagamento via Mercado Pago: integração ainda não ativada. Limites e condições desta prévia serão definidos na integração.</p>
      <button className="btn btn-green w-full">Revisar depósito</button>
    </form>:<div className="space-y-4"><div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-600">Valor selecionado</p><p className="my-2 text-3xl font-bold">{money(cents/100)}</p><p>{method==='pix'?'Pix':'Cartão'} · Mercado Pago</p></div><p className="text-sm text-slate-600">Após a integração, o saldo só será liberado quando o pagamento for confirmado.</p><button disabled className="btn btn-green w-full opacity-60">Pagamento em breve</button><button className="w-full rounded-lg border p-3 text-sm" onClick={()=>setReview(false)}>Alterar valor ou forma</button></div>}
  </dialog>;
}

export function StudentWalletPreview({moto,carro}) {
  const [open,setOpen]=useState(false);
  return <>
    <section aria-label="Carteira do aluno" className="mt-5 rounded-2xl bg-[#0e213b] p-5 text-white sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="flex items-center gap-2 text-sm text-slate-300"><Wallet size={18}/>Saldo em reais <span className="rounded-full bg-white/10 px-2 py-1 text-xs">Demonstração</span></p><p className="mt-2 text-3xl font-bold">R$ 0,00</p><p className="mt-1 text-xs text-slate-300">Carteira ainda não ativada</p></div><button className="btn btn-green" onClick={()=>setOpen(true)}><Plus size={18}/>Adicionar saldo</button></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4 text-sm"><p>Créditos de aulas: <strong>{moto} moto · {carro} carro</strong></p><p className="flex items-center gap-2 text-xs text-slate-300"><ShieldCheck size={16}/>Saldo em reais separado das aulas</p></div>
    </section>
    {open && <DepositPreview onClose={()=>setOpen(false)}/>}
  </>;
}
