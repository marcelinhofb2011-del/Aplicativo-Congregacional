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

    const showBackButton = location.pathname !== '/' && location.pathname !== '/dashboard';
    
    const handleLogout = () => {
        logout();
    };

    const toggleTheme = () => {
        // Toggle only between light and dark for simplicity in the header
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleBack = () => {
        // Verifica se há uma entrada no histórico para a qual voltar.
        // A chave 'default' é usada para a primeira entrada na pilha de histórico.
        // Qualquer navegação subsequente terá uma chave única.
        if (location.key !== 'default') {
            navigate(-1);
        } else {
            // Se não houver histórico (por exemplo, o usuário abriu um link direto),
            // navega para o painel como um fallback seguro.
            navigate('/', { replace: true });
        }
    };

    return (
        <header className={`flex items-center justify-between h-16 bg-primary px-4 sm:px-6 lg:px-8 flex-shrink-0 fixed top-0 left-0 right-0 z-50 shadow-md`}>
            <div className="flex-1">
                {showBackButton && (
                    <button onClick={handleBack} className="flex items-center gap-1 text-blue-100 hover:text-white transition-colors p-2 -ml-2 rounded-md">
                        <ArrowLeftIcon className="h-5 w-5" />
                        <span className="text-sm font-medium hidden sm:inline">Voltar</span>
                    </button>
                )}
            </div>
            <div className="flex-1 text-center">
                <h1 className="text-xl font-semibold text-white truncate">{title}</h1>
            </div>
            <div className="flex-1 flex justify-end items-center space-x-2">
                <OnlineIndicator />
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Alterar tema"
                >
                    {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                </button>
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-full text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Sair"
                >
                    <LogoutIcon className="h-6 w-6" />
                </button>
            </div>
        </header>
    );
};

export default Header;