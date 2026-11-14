import React from 'react';
import {StudentMonth,StudentPackageSummary} from './StudentDesign';
export const licensedPages=['Início','Agendar aula','Minha agenda','Meus pacotes','Comprar aulas','Pagamentos','Meu perfil','Suporte'];
export function LicensedDashboard({data,available,onNavigate}){
 const balance=Math.max(0,available('A'))+Math.max(0,available('B'));
 return <div className="space-y-5"><section className="rounded-2xl bg-[#0e213b] p-6 text-white">
  <p className="text-sm text-green-300">AULAS PARA HABILITADOS</p><h2 className="mt-2 text-2xl font-bold">Mais prática para dirigir com confiança</h2>
  <p className="mt-3">Escolha suas aulas, acompanhe o pagamento e reserve um horário.</p>
  <p className="mt-4 font-bold">Saldo disponível: {Math.max(0,available('B'))} aulas de carro · {Math.max(0,available('A'))} aulas de moto</p>
  <div className="mt-5 flex flex-wrap gap-3"><button className="btn btn-green" onClick={()=>onNavigate(balance?'Agendar aula':'Comprar aulas')}>{balance?'Agendar aula':'Escolher pacote'}</button><button className="btn bg-white! text-slate-900!" onClick={()=>onNavigate('Pagamentos')}>Ver pagamentos</button></div>
 </section><div className="grid gap-5 lg:grid-cols-2"><StudentMonth lessons={data.lessons} onAgenda={()=>onNavigate('Minha agenda')}/><StudentPackageSummary requests={data.requests} remaining={balance} onBuy={()=>onNavigate('Comprar aulas')}/></div></div>;
}
