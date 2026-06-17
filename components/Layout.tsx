import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import { useAuth } from '../hooks/useAuth';
import NotificationModal from './NotificationModal';

const Layout: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const showHeader = location.pathname !== '/' && location.pathname !== '/dashboard' && location.pathname !== '/calendario';

    if (!user) return null;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {showHeader && <Header />}
            
            <main className={`flex-1 overflow-x-hidden animate-fade-in pb-24 ${showHeader ? 'pt-16' : 'pt-0'}`}>
                <Outlet />
            </main>
            
            <BottomNav />
            
            <NotificationModal
                isOpen={false}
                onClose={() => {}}
                notifications={[]}
            />
        </div>
    );
};

export default Layout;