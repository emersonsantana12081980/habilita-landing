import React from 'react';

export function StudentRegistrationDate({value}) {
 const date=value?new Date(value):null;
 const valid=date&&!Number.isNaN(date.getTime());
 return <p className="mt-1 text-xs text-slate-500">Data de cadastro: {valid?<time dateTime={date.toISOString()}>{date.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'})} (Brasília)</time>:'Não registrada'}</p>;
}
