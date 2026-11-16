import React from 'react';
import {InstructorCredential} from './InstructorCredential';
import {CarFront,CalendarDays,Clock3,MapPin} from 'lucide-react';

export function LicensedIntro(){
 return <section className="licensed-intro" aria-labelledby="licensed-title">
  <p className="licensed-kicker">Aulas para quem já tem CNH</p>
  <h1 id="licensed-title">Volte a dirigir com <em>confiança</em></h1>
  <p className="licensed-lead">Pratique carro ou moto com orientação individual, no seu ritmo, em Caçapava e região.</p>
  <a className="licensed-mobile-cta" href="#cadastro-habilitado">Quero me cadastrar ↓</a>
  <a className="licensed-services-link" href="#servicos-aprimoramento">Conheça nossos treinamentos ↓</a>
  <div className="licensed-photo"><img src="/images/hero-960.webp" width="960" height="382" alt="Veículo com a identidade visual da Habilita+" fetchPriority="high"/><span><MapPin size={19}/>Caçapava–SP e região</span></div>
  <div className="licensed-benefits">
   <article><CarFront/><h2>Pratique no seu ritmo</h2><p>Manobras, estacionamento e trânsito, com orientação próxima.</p></article>
   <article><CalendarDays/><h2>Escolha suas aulas</h2><p>Pacotes de reforço ou aulas avulsas disponíveis para você.</p></article>
   <article><Clock3/><h2>Agende pelo painel</h2><p>Após confirmar o pagamento e liberar o saldo, escolha seu horário.</p></article>
  </div>
  <InstructorCredential/>
 </section>;
}
