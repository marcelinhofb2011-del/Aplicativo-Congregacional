import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import { useAuth } from '../hooks/useAuth';
import NotificationModal from './NotificationModal';

const Layout: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const showHeader = location.pathname !== '/' && location.pathname !== '/dashboard';

    if (!user) return null;

    return (
        <div className="flex flex-col h-screen bg-light dark:bg-dark">
            {showHeader && <Header />}
            
            <main className={`flex-1 overflow-y-auto pb-[100px] animate-fade-in ${!showHeader ? 'pt-0' : ''}`}>
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