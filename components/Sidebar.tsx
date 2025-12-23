
import React, { Fragment } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
// FIX: Imported ALL_NAV_ITEMS instead of the non-existent NAV_ITEMS.
import { ALL_NAV_ITEMS } from '../constants';
import { LogoutIcon, XIcon, ChurchIcon } from './icons/Icons';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) return null;

    // FIX: Used ALL_NAV_ITEMS to correctly filter all available navigation items.
    const availableNavItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(user.role));

    const content = (
        <div className="flex flex-col h-full bg-slate-800 text-slate-100">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <ChurchIcon className="h-8 w-8 text-primary text-3xl"/>
                    <span className="text-xl font-bold">Congregação</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden text-slate-400 hover:text-white"
                >
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {availableNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                                isActive
                                    ? 'bg-primary text-white'
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5 mr-3" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-700">
                <div className="mb-2 px-4">
                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    <p className="text-xs text-slate-400">{user.role === 'SERVANT' ? 'Servo / Ancião' : 'Publicador'}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2.5 rounded-lg text-slate-300 hover:bg-red-500 hover:text-white transition-colors duration-200"
                >
                    <LogoutIcon className="h-5 w-5 mr-3" />
                    <span>Sair</span>
                </button>
            </div>
        </div>
    );
    
    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:flex-shrink-0 w-64">
                {content}
            </div>

            {/* Mobile Sidebar */}
            <div
                className={`fixed inset-0 z-40 flex lg:hidden transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="w-64">
                   {content}
                </div>
                <div className="flex-shrink-0 w-14" aria-hidden="true" onClick={() => setIsOpen(false)}>
                </div>
            </div>
        </>
    );
};

export default Sidebar;