import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import { useAuth } from '../hooks/useAuth';
import NotificationModal from './NotificationModal';

const Layout: React.FC = () => {
    // FIX: `notifications` and `handleNotificationsShown` were removed from AuthContext.
    // The logic for showing the notification modal has been disabled to prevent runtime errors.
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="flex flex-col h-screen bg-light dark:bg-dark">
            <Header />
            
            <main className="flex-1 overflow-y-auto pb-16 animate-fade-in">
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