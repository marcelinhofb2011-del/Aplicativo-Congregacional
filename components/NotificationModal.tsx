
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNotification } from '../types';
import { LifeMinistryIcon, AssignmentsIcon, CleaningIcon, ConductorIcon, PublicTalkIcon } from './icons/Icons';

interface NotificationModalProps {
    isOpen: boolean;
    notifications: AppNotification[];
    onClose: () => void;
}

const NotificationIcon: React.FC<{ type: AppNotification['tipo'] }> = ({ type }) => {
    const iconProps = { className: "h-6 w-6 text-primary" };
    switch (type) {
        case 'vida_ministerio': return <LifeMinistryIcon {...iconProps} />;
        case 'designacao': return <AssignmentsIcon {...iconProps} />;
        case 'limpeza': return <CleaningIcon {...iconProps} />;
        case 'servico_campo': return <ConductorIcon {...iconProps} />;
        case 'discurso_publico': return <PublicTalkIcon {...iconProps} />;
        default: return (
             <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
        );
    }
};

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, notifications, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen || notifications.length === 0) {
        return null;
    }

    const handleNavigate = (path: string) => {
        onClose();
        navigate(path);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-slate-900 dark:text-white">Suas Notificações</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Você tem {notifications.length} nova(s) designação(ões) ou aviso(s).
                    </p>
                </div>

                <div className="flex-grow overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
                    {notifications.map(notification => (
                        <div key={notification.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900">
                                    <NotificationIcon type={notification.tipo} />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{notification.titulo}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{notification.descricao}</p>
                                    <button
                                        onClick={() => handleNavigate(notification.link)}
                                        className="text-sm font-medium text-primary hover:underline mt-1"
                                    >
                                        Ver detalhes
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end rounded-b-lg">
                    <button
                        onClick={onClose}
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 bg-primary text-sm font-medium text-white hover:bg-primary-dark"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
