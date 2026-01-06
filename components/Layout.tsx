
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import { useAuth } from '../hooks/useAuth';

const Layout: React.FC = () => {
    const { user } = useAuth();

    // Don't render layout if no user
    if (!user) return null;

    return (
        <div className="flex flex-col h-screen bg-light dark:bg-dark">
            <Header />
            
            <main className="flex-1 overflow-y-auto pb-16 animate-fade-in"> {/* padding-bottom to avoid overlap with BottomNav */}
                <Outlet />
            </main>
            
            <BottomNav />
        </div>
    );
};

export default Layout;