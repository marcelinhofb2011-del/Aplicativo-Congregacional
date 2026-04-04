
import React from 'react';
import { UserRole } from './types';
import { DashboardIcon, AttendanceIcon, LifeMinistryIcon, AssignmentsIcon, CleaningIcon, FieldServiceIcon, PublicTalkIcon, TerritoriesIcon, BusIcon, SettingsIcon, ConductorIcon, ShepherdingIcon, Squares2X2Icon, ChartBarIcon, DocumentTextIcon, MegaphoneIcon, CalendarDaysIcon, TrophyIcon, UsersIcon, BookOpenIcon } from './components/icons/Icons';

export interface NavItem {
    path: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    roles: UserRole[];
    color?: string;
}

// For Bottom Navigation
export const BOTTOM_NAV_ITEMS: NavItem[] = [
    { path: '/dashboard', label: 'Página inicial', icon: DashboardIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-blue-500' },
    { path: '/pioneiro', label: 'Pioneiro', icon: BookOpenIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-amber-500' },
    { path: '/assistencia', label: 'Assistência', icon: UsersIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-teal-500' },
];

// For Secondary Menu (Servant/Elder only)
export const SECONDARY_NAV_ITEMS: NavItem[] = [
    { path: '/vida-e-ministerio', label: 'Vida e Ministério', icon: LifeMinistryIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-green-500' },
    { path: '/designacoes', label: 'Designações', icon: AssignmentsIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-orange-500' },
    { path: '/limpeza', label: 'Limpeza', icon: CleaningIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-purple-500' },
    { path: '/secretario', label: 'Secretário', icon: DocumentTextIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-emerald-600' },
    { path: '/dirigentes', label: 'Serviço de Campo', icon: ConductorIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-cyan-500' },
    { path: '/discurso-publico', label: 'Discurso Público', icon: PublicTalkIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-indigo-600' },
    { path: '/territorios', label: 'Territórios', icon: TerritoriesIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-lime-500' },
    { path: '/passagens', label: 'Passagens', icon: BusIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-yellow-400' },
    { path: '/configuracoes', label: 'Configurações', icon: SettingsIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-slate-500' },
];

// Nav Item for the menu page itself (for Header title)
export const MENU_NAV_ITEM: NavItem = { path: '/menu', label: 'Menu', icon: Squares2X2Icon, roles: [UserRole.SERVANT], color: 'text-slate-500' };

// Nav Item for the new Resumo page
export const RESUMO_NAV_ITEM: NavItem = { path: '/resumo', label: 'Resumo', icon: ChartBarIcon, roles: [UserRole.SERVANT], color: 'text-indigo-500' };

// Nav Item for Announcements page
export const ANNOUNCEMENTS_NAV_ITEM: NavItem = { path: '/anuncios', label: 'Anúncios', icon: MegaphoneIcon, roles: [UserRole.PUBLISHER, UserRole.SERVANT], color: 'text-sky-500' };

// Nav Items for Secretary sub-pages (for Header titles)
export const ATTENDANCE_LIST_NAV_ITEM: NavItem = { path: '/secretario/assistencia', label: 'Pasta de Assistência', icon: AttendanceIcon, roles: [UserRole.SERVANT], color: 'text-emerald-600' };


// Combined for routing and other lookups
export const ALL_NAV_ITEMS = [
    ...BOTTOM_NAV_ITEMS, 
    ...SECONDARY_NAV_ITEMS, 
    MENU_NAV_ITEM,
    RESUMO_NAV_ITEM,
    ANNOUNCEMENTS_NAV_ITEM,
    ATTENDANCE_LIST_NAV_ITEM,
];

export const CLEANING_GROUPS: Record<string, string> = {
    'Grupo 1': 'Samuel/Geovane/Hugo',
    'Grupo 2': 'Airton/Dhiego',
    'Grupo 3': 'Danilo/Vilson/Kleber',
};

export const MENU_ITEM_GRADIENTS: { [key: string]: string } = {
    'text-blue-500': 'from-blue-500 to-blue-600',
    'text-indigo-500': 'from-indigo-500 to-indigo-600',
    'text-green-500': 'from-green-500 to-green-600',
    'text-orange-500': 'from-orange-500 to-orange-600',
    'text-purple-500': 'from-purple-500 to-purple-600',
    'text-emerald-600': 'from-emerald-500 to-emerald-700',
    'text-rose-500': 'from-rose-500 to-rose-600',
    'text-cyan-400': 'from-cyan-400 to-cyan-600',
    'text-pink-500': 'from-pink-500 to-pink-600',
    'text-indigo-600': 'from-indigo-500 to-indigo-700',
    'text-lime-500': 'from-lime-400 to-lime-600',
    'text-yellow-400': 'from-yellow-400 to-yellow-500',
    'text-slate-500': 'from-slate-500 to-slate-700',
    'text-sky-500': 'from-sky-500 to-sky-600',
};