
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import { useAuth } from '../hooks/useAuth';
import NotificationModal from './NotificationModal';

const Layout: React.FC = () => {
    const { user, notifications, handleNotificationsShown } = useAuth();
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    useEffect(() => {
        // Show modal if there are unread notifications upon loading the layout
        if (notifications.length > 0) {
            setIsNotificationModalOpen(true);
        }
    }, [notifications]);

    const handleCloseNotificationModal = () => {
        setIsNotificationModalOpen(false);
        // Mark notifications as read in the backend and clear them from the context state
        const notificationIds = notifications.map(n => n.id);
        if (notificationIds.length > 0) {
            handleNotificationsShown(notificationIds);
        }
    };

    if (!user) return null;

    return (
        <div className="flex flex-col h-screen bg-light dark:bg-dark">
            <Header />
            
            <main className="flex-1 overflow-y-auto pb-16 animate-fade-in">
                <Outlet />
            </main>
            
            <BottomNav />
            
            <NotificationModal
                isOpen={isNotificationModalOpen}
                onClose={handleCloseNotificationModal}
                notifications={notifications}
            />
        </div>
    );
};

export default Layout;
