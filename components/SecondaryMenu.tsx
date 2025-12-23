
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SECONDARY_NAV_ITEMS } from '../constants';
import { LogoutIcon, XIcon, ChurchIcon } from './icons/Icons';

interface SecondaryMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const SecondaryMenu: React.FC<SecondaryMenuProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        onClose(); // Close menu on logout
        navigate('/login');
    };

    if (!isOpen || !user) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
            onClick={onClose}
        >
            <div 
                className="bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-lg m-4 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-2">
                        <ChurchIcon className="h-8 w-8 text-primary"/>
                        <span className="text-xl font-bold">Menu Secundário</span>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {SECONDARY_NAV_ITEMS.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={`flex flex-col items-center justify-center text-center p-4 rounded-xl text-white font-semibold shadow-lg transform hover:scale-105 transition-transform duration-200 ${item.color}`}
                        >
                            <item.icon className="h-10 w-10 mb-2" />
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="mb-2 px-2">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{user.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.role === 'SERVANT' ? 'Servo / Ancião' : 'Publicador'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white transition-colors duration-200"
                    >
                        <LogoutIcon className="h-5 w-5 mr-3" />
                        <span>Sair</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecondaryMenu;
