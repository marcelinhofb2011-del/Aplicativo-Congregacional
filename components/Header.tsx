
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ALL_NAV_ITEMS } from '../constants';
import { ArrowLeftIcon, LogoutIcon, MoonIcon, SunIcon } from './icons/Icons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import OnlineIndicator from './OnlineIndicator';

const Header: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { theme, setTheme } = useTheme();

    const findNavItem = (pathname: string) => {
        let item = ALL_NAV_ITEMS.find(i => i.path === pathname);
        if (item) return item;

        const pathSegments = pathname.split('/').filter(Boolean);
        if (pathSegments.length > 1) {
            const parentPath = `/${pathSegments[0]}`;
            item = ALL_NAV_ITEMS.find(i => i.path === parentPath);
            if (item) return item;
        }
        return ALL_NAV_ITEMS.find(i => i.path === '/dashboard');
    };

    const currentNavItem = findNavItem(location.pathname);
    const title = currentNavItem ? currentNavItem.label : 'Painel';
    const colorClass = currentNavItem?.color || 'text-primary';
    
    // Convert text-color-500 to border-color-500
    const borderColorClass = colorClass.replace('text-', 'border-');

    const showBackButton = location.pathname !== '/' && location.pathname !== '/dashboard';
    
    const handleLogout = () => {
        logout();
    };

    const toggleTheme = () => {
        // Toggle only between light and dark for simplicity in the header
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className={`flex items-center justify-between h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8 border-b-2 ${borderColorClass} flex-shrink-0 sticky top-0 z-30`}>
            <div className="flex-1">
                {showBackButton && (
                    <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors p-2 -ml-2 rounded-md">
                        <ArrowLeftIcon className="h-5 w-5" />
                        <span className="text-sm font-medium hidden sm:inline">Voltar</span>
                    </button>
                )}
            </div>
            <div className="flex-1 text-center">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white truncate">{title}</h1>
            </div>
            <div className="flex-1 flex justify-end items-center space-x-2">
                <OnlineIndicator />
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Alterar tema"
                >
                    {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                </button>
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Sair"
                >
                    <LogoutIcon className="h-6 w-6" />
                </button>
            </div>
        </header>
    );
};

export default Header;
