import React from 'react';
import {Navigation,MapPinned,Building2,ShieldCheck,ArrowUpRight} from 'lucide-react';

const services=[
 {Icon:Navigation,title:'Direção em rodovias e uso de GPS',text:'Pratique planejamento de rotas, configuração do GPS antes de sair, acessos, saídas, mudanças de faixa e ultrapassagens quando permitidas e seguras.'},
 {Icon:MapPinned,title:'Viagens para outras cidades',text:'Desenvolva autonomia em trajetos intermunicipais, com orientação sobre rotas, sinalização e entradas e saídas de cidades.'},
 {Icon:Building2,title:'Cidades grandes e trânsito intenso',text:'Prepare-se para avenidas movimentadas, cruzamentos, mudanças de faixa e horários de pico. Trajetos como São Paulo são combinados conforme disponibilidade.'},
 {Icon:ShieldCheck,title:'Direção defensiva',text:'Treine percepção de riscos, distância de segurança, antecipação de situações perigosas, frenagem preventiva e tomada de decisões no trânsito.'},
];
export function LicensedServices(){
 return <section className="licensed-services" id="servicos-aprimoramento" aria-labelledby="licensed-services-title">
  <p className="licensed-kicker">Serviços de aprimoramento</p>
  <h2 id="licensed-services-title">Já tem CNH? Vá mais longe com a Habilita+ Mais.</h2>
  <p className="licensed-services-lead">Aulas práticas para dirigir com mais confiança, autonomia e segurança. Treinamento individual, com orientação e evolução no seu ritmo.</p>
  <div className="licensed-service-grid">{services.map(({Icon,title,text},index)=><article key={title}><div className="licensed-service-icon"><Icon size={28} aria-hidden="true"/><span>0{index+1}</span></div><h3>{title}</h3><p>{text}</p><a href="#cadastro-habilitado">Quero esse treinamento <ArrowUpRight size={17} aria-hidden="true"/></a></article>)}</div>
  <div className="licensed-services-bottom"><div><h3>Aulas personalizadas para o seu próximo desafio</h3><p>Atendimento em Caçapava–SP e região. Treinamentos em outras localidades mediante agendamento e disponibilidade. Combine o percurso, a duração e os valores com a equipe antes de contratar.</p></div><a className="btn btn-green" href="#cadastro-habilitado">Criar minha conta gratuita</a></div>
 </section>;
}
