import React from "react";
import { House, CalendarDays, Package, UserRound, Users, ClipboardList, Settings2, Clock3, BookOpen, LayoutDashboard } from "lucide-react";
export function PortalNavIcon({ name }) {
  const Icon = ({ "Início": House, "Meus pacotes": Package, "Minhas aulas": CalendarDays, "Meu perfil": UserRound, "Agendar aula": CalendarDays, "Resumo": LayoutDashboard, "Agenda": CalendarDays, "Alunos": Users, "Pedidos": ClipboardList, "Catálogo": Package, "Configurar agenda": Clock3, "Horários avulsos": Clock3, "Regras": BookOpen })[name] || Settings2;
  return <Icon size={18} aria-hidden="true" />;
}
