
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PAGE_PASSWORDS } from '../constants';
import AccessPasswordModal from './AccessPasswordModal';
import { ChevronRightIcon } from './icons/Icons'; // Importar o ícone

interface ProtectedMenuItemProps {
    item: {
        path: string;
        label: string;
        icon: React.FC<{ className?: string }>;
        color?: string;
    };
}

const ProtectedMenuItem: React.FC<ProtectedMenuItemProps> = ({ item }) => {
    const { isPageUnlocked, checkPagePassword } = useAuth();
    const navigate = useNavigate();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    
    const isProtected = !!PAGE_PASSWORDS[item.path as keyof typeof PAGE_PASSWORDS];

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!isProtected || isPageUnlocked(item.path)) {
            return;
        }

        e.preventDefault();
        setShowPasswordModal(true);
    };

    const handleVerifyPassword = (password: string) => {
        if (checkPagePassword(item.path, password)) {
            setShowPasswordModal(false);
            navigate(item.path);
            return true;
        }
        return false;
    };

    return (
        <>
            <Link
                to={item.path}
                onClick={handleClick}
                className="flex items-center p-5 w-full text-left transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
            >
                <item.icon className={`h-8 w-8 mr-4 ${item.color || 'text-slate-500'}`} />
                <span className="flex-grow text-lg font-semibold text-slate-700 dark:text-slate-200">
                    {item.label}
                </span>
                <ChevronRightIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </Link>

            {showPasswordModal && (
                <AccessPasswordModal 
                    onVerify={handleVerifyPassword} 
                    onClose={() => setShowPasswordModal(false)} 
                />
            )}
        </>
    );
};

export default ProtectedMenuItem;