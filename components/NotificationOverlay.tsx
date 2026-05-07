
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    X, 
    Bell, 
    CheckCheck, 
    Trash2, 
    Pin, 
    PinOff, 
    Calendar, 
    AlertTriangle, 
    Info, 
    User, 
    Users,
    Clock,
    ChevronRight,
    Search
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

const NotificationCategoryIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
    switch (type) {
        case NotificationType.DESIGNATION:
            return <User className="w-5 h-5 text-indigo-500" />;
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
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        ref={drawerRef}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-950 shadow-2xl z-[70] flex flex-col border-l border-slate-200 dark:border-white/[0.05]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-white/[0.05]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                                        <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Central de Notificações</h2>
                                        <p className="text-xs text-slate-500 font-medium">Congregação VL Cisper</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleMarkAllRead}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all border border-indigo-200/50 dark:border-indigo-500/20"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Marcar todas como lidas
                                </button>
                            </div>

                            <div className="mt-4 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar notificações..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {filteredNotifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <Bell className="w-16 h-16 mb-4 text-slate-300" />
                                    <p className="text-slate-500 font-medium">Nenhuma notificação encontrada</p>
                                </div>
                            ) : (
                                filteredNotifications.map((n) => (
                                    <motion.div
                                        key={n.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`relative group p-4 rounded-2xl border transition-all ${
                                            n.isRead 
                                            ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5' 
                                            : 'bg-indigo-50/30 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20'
                                        } ${n.isPinned ? 'ring-1 ring-amber-400/30' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`mt-1 p-2 rounded-xl flex-shrink-0 ${
                                                n.isRead ? 'bg-slate-100 dark:bg-white/5' : 'bg-white dark:bg-slate-800 shadow-sm'
                                            }`}>
                                                <NotificationCategoryIcon type={n.type} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className={`font-bold text-sm truncate pr-14 ${
                                                        n.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'
                                                    }`}>
                                                        {n.title}
                                                    </h3>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(n.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                                                    </span>
                                                </div>
                                                <p className={`text-xs leading-relaxed line-clamp-2 ${
                                                    n.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'
                                                }`}>
                                                    {n.description}
                                                </p>

                                                <div className="mt-3 flex items-center gap-2">
                                                    {!n.isRead && (
                                                        <button
                                                            onClick={() => handleMarkRead(n.id)}
                                                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                        >
                                                            Marcar como lida
                                                        </button>
                                                    )}
                                                    {n.link && (
                                                        <button
                                                            className="text-[10px] font-bold text-slate-900 dark:text-white flex items-center gap-0.5 hover:underline"
                                                        >
                                                            Ver detalhes
                                                            <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Overlay */}
                                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleTogglePin(n)}
                                                className={`p-1.5 rounded-lg transition-colors ${
                                                    n.isPinned 
                                                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                                                    : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400'
                                                }`}
                                            >
                                                {n.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(n.id)}
                                                className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Pin indicator */}
                                        {n.isPinned && (
                                            <div className="absolute -top-1 -left-1">
                                                <div className="p-1 bg-amber-400 rounded-lg shadow-lg">
                                                    <Pin className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Unread indicator */}
                                        {!n.isRead && (
                                            <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/[0.05]">
                            <p className="text-[10px] font-bold text-center text-slate-400 uppercase tracking-widest">
                                Notificações geradas automaticamente pelo sistema
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationOverlay;
