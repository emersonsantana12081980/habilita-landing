import React from "react";
import { House, CalendarDays, Package, UserRound, Users, ClipboardList, Settings2, Clock3, BookOpen, LayoutDashboard, Bell, CreditCard, Headphones, Route, TrendingUp, ShoppingBag } from "lucide-react";
export function PortalNavIcon({ name }) {
  const Icon = ({ "Início": House, "Meus pacotes": Package, "Comprar aulas": ShoppingBag, "Minha agenda": CalendarDays, "Histórico de aulas": Clock3, "Minha jornada CNH": Route, "Meu progresso": TrendingUp, "Pagamentos": CreditCard, "Notificações": Bell, "Suporte": Headphones, "Minhas aulas": CalendarDays, "Meu perfil": UserRound, "Agendar aula": CalendarDays, "Resumo": LayoutDashboard, "Agenda": CalendarDays, "Alunos": Users, "Pedidos": ClipboardList, "Catálogo": Package, "Configurar agenda": Clock3, "Horários avulsos": Clock3, "Regras": BookOpen })[name] || Settings2;
  return <Icon size={18} aria-hidden="true" />;
}
