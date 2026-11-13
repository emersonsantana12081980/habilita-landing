const formatter = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});
function dayKey(value) {
 const date = value ? new Date(value) : null;
 if (!date || Number.isNaN(date.getTime())) return '';
 const parts = Object.fromEntries(formatter.formatToParts(date).map(p=>[p.type,p.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
export function registrationPeriod({period='all',dateFrom='',dateTo=''}={}, now=new Date()) {
 const today=dayKey(now);
 let from='',to='';
 if(period==='today')from=to=today;
 if(period==='week'){
  const start=new Date(`${today}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate()-6);
  from=start.toISOString().slice(0,10);to=today;
 }
 if(period==='month'){from=today.slice(0,7)+'-01';to=today;}
 if(period==='custom'){from=dateFrom;to=dateTo;}
 const invalid=Boolean(from&&to&&from>to);
 return {invalid, matches(value){
  if(period==='all')return true;
  const day=dayKey(value);
  return !invalid&&!!day&&(!from||day>=from)&&(!to||day<=to);
 }};
}
