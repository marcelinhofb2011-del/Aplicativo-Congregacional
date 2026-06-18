
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
    X, 
    Bell, 
    Trash2, 
    Pin, 
    PinOff, 
    Calendar, 
    AlertTriangle, 
    Info, 
    User, 
    Users,
    ChevronRight,
    Search,
    Megaphone
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppNotification, NotificationType } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    userUid: string;
    notifications: AppNotification[];
}

const NotificationCategoryIcon: React.FC<{ type: NotificationType; isAnnouncement?: boolean }> = ({ type, isAnnouncement }) => {
    if (isAnnouncement) {
        return <Megaphone className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
    }
    switch (type) {
        case NotificationType.DESIGNATION:
            return <User className="w-5 h-5 text-primary" />;
        case NotificationType.SCHEDULE_CHANGE:
            return <Calendar className="w-5 h-5 text-blue-500" />;
        case NotificationType.IMPORTANT_ALERT:
            return <Info className="w-5 h-5 text-amber-500" />;
        case NotificationType.CLEANING:
            return <Users className="w-5 h-5 text-emerald-500" />;
        case NotificationType.ASSEMBLY_CONGRESS:
            return <AlertTriangle className="w-5 h-5 text-purple-500" />;
        case NotificationType.EMERGENCY:
            return <AlertTriangle className="w-5 h-5 text-rose-500" />;
        default:
            return <Bell className="w-5 h-5 text-slate-500" />;
    }
};

const NotificationOverlay: React.FC<NotificationOverlayProps> = ({ isOpen, onClose, userUid, notifications }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const drawerRef = useRef<HTMLDivElement>(null);

    // Filter notifications based on search
    const filteredNotifications = notifications.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        n.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAllRead = async () => {
        if (unreadCount > 0) {
            await notificationService.markAllAsRead(userUid);
        }
    };

    const handleTogglePin = async (n: AppNotification) => {
        await notificationService.togglePin(n.id, n.isPinned);
    };

    const handleDelete = async (id: string) => {
        await notificationService.deleteNotification(id);
    };

    const handleMarkRead = async (id: string) => {
        await notificationService.markAsRead(id);
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    const content = (
        <AnimatePresence>
            {isOpen && (
                <div id="notification-portal-root" className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        id="notification-backdrop"
                        key="notification-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[-1]"
                        onClick={onClose}
                    />
                    
                    {/* Drawer */}
                    <motion.div
                        id="notification-drawer"
                        key="notification-drawer"
                        ref={drawerRef}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="h-full w-full max-w-md bg-white dark:bg-[#07060b] shadow-2xl flex flex-col relative z-10"
                    >
                        {/* Header */}
                        <div className="p-8 pb-6">
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Atividade</h2>
                                    <p className="text-[10px] text-primary dark:text-amber-500 font-bold uppercase tracking-[0.2em]">Fluxo de Notificações</p>
                                </div>
                                <button
                                    id="close-notifications"
                                    onClick={onClose}
                                    className="h-12 w-12 flex items-center justify-center bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="notification-search"
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-[20px] text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto px-8 custom-scrollbar space-y-2">
                            {filteredNotifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                                    <div className="h-20 w-20 bg-slate-100 dark:bg-white/5 rounded-[32px] flex items-center justify-center mb-6">
                                        <Bell className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Silêncio absoluto</p>
                                </div>
                            ) : (
                                filteredNotifications.map((n) => (
                                    <motion.div
                                        key={n.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`relative group py-6 transition-all border-b border-slate-50 dark:border-white/[0.03] last:border-none`}
                                    >
                                        <div className="flex gap-5">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                                n.isRead ? 'bg-slate-50 dark:bg-white/5 text-slate-400' : 'bg-primary/10 text-primary dark:text-amber-500'
                                            }`}>
                                                <NotificationCategoryIcon type={n.type} isAnnouncement={n.isAnnouncement} />
                                            </div>

                                            <div className="flex-1 min-w-0 pr-8">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className={`font-black text-xs uppercase tracking-widest truncate ${
                                                        n.isRead ? 'text-slate-400' : 'text-slate-900 dark:text-white'
                                                    }`}>
                                                        {n.title}
                                                    </h3>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                                        {format(new Date(n.createdAt), "dd MMM", { locale: ptBR })}
                                                    </span>
                                                </div>
                                                <p className={`text-sm leading-relaxed ${
                                                    n.isRead ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
                                                }`}>
                                                    {n.description}
                                                </p>

                                                <div className="mt-4 flex items-center gap-4">
                                                    {!n.isRead && (
                                                        <button
                                                            onClick={() => handleMarkRead(n.id)}
                                                            className="text-[10px] font-black text-primary dark:text-amber-500 hover:text-primary-dark dark:hover:text-amber-600 uppercase tracking-widest"
                                                        >
                                                            Marcar Lida
                                                        </button>
                                                    )}
                                                    {n.link && (
                                                        <button
                                                            className="text-[10px] font-black text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest flex items-center gap-1"
                                                        >
                                                            Detalhes
                                                            <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Overlay */}
                                        {!n.isAnnouncement && (
                                            <div className="absolute top-6 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleTogglePin(n)}
                                                    className={`p-2 rounded-xl transition-colors ${
                                                        n.isPinned 
                                                        ? 'bg-amber-500/20 text-amber-500' 
                                                        : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400'
                                                    }`}
                                                >
                                                    {n.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(n.id)}
                                                    className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Unread indicator */}
                                        {!n.isRead && (
                                            <div className="absolute top-7 left-0 w-1.5 h-1.5 bg-primary dark:bg-amber-500 rounded-full"></div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 space-y-4">
                            <button
                                id="mark-all-read"
                                onClick={handleMarkAllRead}
                                className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-[20px] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                                disabled={unreadCount === 0}
                            >
                                Limpar Todas
                            </button>
                            <p className="text-[9px] font-black text-center text-slate-400 uppercase tracking-widest opacity-50">
                                Congregação VL Cisper
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
};

export default NotificationOverlay;
