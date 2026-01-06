
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { BOTTOM_NAV_ITEMS } from '../constants';
import { Squares2X2Icon } from './icons/Icons';

const BottomNav: React.FC = () => {
    const { user } = useAuth();
    if (!user) return null;

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex flex-col items-center justify-center w-full pt-2 pb-1 text-sm transition-colors duration-200 ${
            isActive
                ? 'text-primary'
                : 'text-slate-500 dark:text-slate-400 hover:text-primary'
        }`;
        
    // Para publicadores, mostrar todos os itens definidos.
    // Para servos, mostrar apenas o painel, pois o menu já dá acesso a tudo.
    const itemsToShow = user.role === UserRole.SERVANT
        ? BOTTOM_NAV_ITEMS.filter(item => item.path === '/dashboard')
        : BOTTOM_NAV_ITEMS;

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
            {itemsToShow.map((item) => (
                <NavLink key={item.path} to={item.path} className={navLinkClass}>
                    <item.icon className="h-6 w-6 mb-1" />
                    <span>{item.label}</span>
                </NavLink>
            ))}
            {user.role === UserRole.SERVANT && (
                <NavLink to="/menu" className={navLinkClass}>
                    <Squares2X2Icon className="h-6 w-6 mb-1" />
                    <span>Menu</span>
                </NavLink>
            )}
        </nav>
    );
};

export default BottomNav;