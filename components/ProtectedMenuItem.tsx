import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PAGE_PASSWORDS } from '../constants';
import AccessPasswordModal from './AccessPasswordModal';

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
        // If the route is not protected, or if it's already been unlocked in the current session,
        // let the Link component handle navigation normally.
        if (!isProtected || isPageUnlocked(item.path)) {
            return;
        }

        // If the route is protected and not yet unlocked, prevent the default navigation
        // and show the password modal instead.
        e.preventDefault();
        setShowPasswordModal(true);
    };

    const handleVerifyPassword = (password: string) => {
        if (checkPagePassword(item.path, password)) {
            setShowPasswordModal(false);
            navigate(item.path); // Programmatically navigate after successful verification.
            return true;
        }
        // If the password is wrong, the modal will show an error message.
        return false;
    };

    return (
        <>
            <Link
                to={item.path}
                onClick={handleClick}
                className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 aspect-square"
            >
                <item.icon className={`h-10 w-10 mb-2 ${item.color}`} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</span>
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
