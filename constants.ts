
import React from 'react';
import { UserRole } from './types';
import { DashboardIcon, ReportIcon, AttendanceIcon, LifeMinistryIcon, AssignmentsIcon, CleaningIcon, FieldServiceIcon, PublicTalkIcon, TerritoriesIcon, BusIcon, SettingsIcon, ConductorIcon, ShepherdingIcon, Squares2X2Icon, ChartBarIcon, UsersIcon } from './components/icons/Icons';

export interface NavItem {
    path: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    roles: UserRole[];
    color?: string;
}

// For Bottom Navigation
export const BOTTOM_NAV_ITEMS: NavItem[] = [
    { path: '/dashboard', label: 'Painel', icon: DashboardIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-blue-500' },
    { path: '/relatorio', label: 'Relatório', icon: ReportIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-slate-500' },
    { path: '/assistencia', label: 'Assistência', icon: AttendanceIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-teal-500' },
];

// For Secondary Menu (Servant/Elder only)
export const SECONDARY_NAV_ITEMS: NavItem[] = [
    { path: '/vida-e-ministerio', label: 'Vida e Ministério', icon: LifeMinistryIcon, roles: [UserRole.SERVANT], color: 'text-green-500' },
    { path: '/designacoes', label: 'Designações', icon: AssignmentsIcon, roles: [UserRole.SERVANT], color: 'text-orange-500' },
    { path: '/limpeza', label: 'Limpeza', icon: CleaningIcon, roles: [UserRole.SERVANT], color: 'text-purple-500' },
    { path: '/secretario', label: 'Secretário', icon: FieldServiceIcon, roles: [UserRole.SERVANT], color: 'text-emerald-600' },
    { path: '/publicadores', label: 'Publicadores', icon: UsersIcon, roles: [UserRole.SERVANT], color: 'text-rose-500' },
    { path: '/dirigentes', label: 'Dirigentes', icon: ConductorIcon, roles: [UserRole.SERVANT], color: 'text-cyan-500' },
    { path: '/pastoreio', label: 'Pastoreio', icon: ShepherdingIcon, roles: [UserRole.SERVANT], color: 'text-pink-500' },
    { path: '/discurso-publico', label: 'Discurso Público', icon: PublicTalkIcon, roles: [UserRole.SERVANT], color: 'text-indigo-600' },
    { path: '/territorios', label: 'Territórios', icon: TerritoriesIcon, roles: [UserRole.SERVANT], color: 'text-lime-500' },
    { path: '/passagens', label: 'Passagens', icon: BusIcon, roles: [UserRole.SERVANT], color: 'text-yellow-400' },
    { path: '/configuracoes', label: 'Configurações', icon: SettingsIcon, roles: [UserRole.SERVANT], color: 'text-slate-500' },
];

// Nav Item for the menu page itself (for Header title)
export const MENU_NAV_ITEM: NavItem = { path: '/menu', label: 'Menu', icon: Squares2X2Icon, roles: [UserRole.SERVANT], color: 'text-slate-500' };

// Nav Item for the new Resumo page
export const RESUMO_NAV_ITEM: NavItem = { path: '/resumo', label: 'Resumo', icon: ChartBarIcon, roles: [UserRole.SERVANT], color: 'text-indigo-500' };

// Nav Items for Secretary sub-pages (for Header titles)
export const REPORT_LIST_NAV_ITEM: NavItem = { path: '/secretario/relatorios', label: 'Pasta de Relatórios', icon: ReportIcon, roles: [UserRole.SERVANT], color: 'text-emerald-600' };
export const ATTENDANCE_LIST_NAV_ITEM: NavItem = { path: '/secretario/assistencia', label: 'Pasta de Assistência', icon: AttendanceIcon, roles: [UserRole.SERVANT], color: 'text-emerald-600' };


// Combined for routing and other lookups
export const ALL_NAV_ITEMS = [
    ...BOTTOM_NAV_ITEMS, 
    ...SECONDARY_NAV_ITEMS, 
    MENU_NAV_ITEM,
    RESUMO_NAV_ITEM,
    REPORT_LIST_NAV_ITEM,
    ATTENDANCE_LIST_NAV_ITEM
];

export const ATTENDANCE_EXTRA_PASSWORD = '4567'; // In a real app, this would not be hardcoded.

export const CLEANING_GROUPS: Record<string, string> = {
    'Grupo 1': 'Samuel/Geovane/Hugo',
    'Grupo 2': 'Airton/Dhiego',
    'Grupo 3': 'Danilo/Vilson/Kleber',
};