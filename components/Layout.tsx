
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
            
            <main className="flex-1 overflow-y-auto pb-16"> {/* padding-bottom to avoid overlap with BottomNav */}
                 <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
                    <Outlet />
                 </div>
            </main>
            
            <BottomNav />
        </div>
    );
};

export default Layout;