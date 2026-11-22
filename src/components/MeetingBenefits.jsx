import React from 'react';
import { trackLanding } from '../lib/landing-events';

export function MeetingBenefits() {
  return <section className="meeting-fold" aria-labelledby="meeting-heading">
    <div className="container section-space">
      <div className="meeting-intro">
        <p className="eyebrow">NO SEU RITMO, COM ORIENTAÇÃO</p>
        <h2 id="meeting-heading">Seu instrutor encontra você no ponto escolhido.</h2>
        <p className="section-subtitle">Escolha entre os locais disponíveis para seu horário. Consulte o endereço e a localização antes da aula.</p>
      </div>
      <div className="meeting-cards">
        <article>
          <img src="/images/MULHER%20.png" width="1672" height="941" loading="lazy" alt="Imagem ilustrativa de uma mulher agendando pelo celular" />
          <div className="meeting-copy"><span className="eyebrow">01 · PELO CELULAR</span><h3>Agende sem sair de casa.</h3>
            <p>Consulte os horários no seu painel e organize suas aulas, saldo e pagamentos em um só lugar.</p>
            <p className="meeting-note">O agendamento depende de saldo liberado e dos requisitos da sua categoria.</p>
          </div>
        </article>
        <article>
          <img src="/images/ENCONTRO%20.png" width="1672" height="941" loading="lazy" alt="Imagem ilustrativa do instrutor recebendo uma aluna no ponto de encontro" />
          <div className="meeting-copy"><span className="eyebrow">02 · NO PONTO COMBINADO</span><h3>Escolha onde encontrar seu instrutor.</h3>
            <p>Selecione um dos pontos disponíveis para a aula. O endereço e o link do Google Maps ficam junto do seu agendamento.</p>
            <p className="meeting-note">Locais sujeitos à disponibilidade do horário e do instrutor.</p>
          </div>
        </article>
      </div>
      <div className="meeting-footer"><div><a href="/cadastro" className="btn btn-green" onClick={() => trackLanding('signup_start', {source:'online_benefit'})}>Criar conta gratuita</a><p>Cadastro não gera cobrança nem libera créditos automaticamente.</p></div><small>Imagens ilustrativas.</small></div>
    </div>
  </section>;
}
