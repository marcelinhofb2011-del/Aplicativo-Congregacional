
import React, { useState, useEffect } from 'react';
import { hasNotificationPermission, requestNotificationPermission, showTestNotification } from '../utils/notifications';
import { useTheme, Theme } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
    const [permissionStatus, setPermissionStatus] = useState(Notification.permission);
    const { theme, setTheme } = useTheme();

    const handleRequestPermission = async () => {
        const status = await requestNotificationPermission();
        setPermissionStatus(status);
    };
    
    const ThemeButton: React.FC<{ value: Theme, label: string }> = ({ value, label }) => (
        <button
            onClick={() => setTheme(value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                theme === value 
                ? 'bg-primary text-white' 
                : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h2>
            
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Aparência</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Escolha como o aplicativo deve ser exibido.
                </p>
                <div className="mt-4 flex space-x-2">
                    <ThemeButton value="light" label="Claro" />
                    <ThemeButton value="dark" label="Escuro" />
                    <ThemeButton value="system" label="Sistema" />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notificações Push</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Receba notificações sobre novas designações e anúncios importantes, mesmo quando o aplicativo estiver fechado.
                </p>
                <div className="mt-6">
                    {permissionStatus === 'granted' && (
                        <div className="p-4 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-md">
                            <p className="font-semibold">As notificações estão ativadas.</p>
                            <button onClick={showTestNotification} className="mt-2 text-sm font-medium underline">
                                Enviar notificação de teste
                            </button>
                        </div>
                    )}
                    {permissionStatus === 'default' && (
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-md">
                            <p className="font-semibold">Deseja ativar as notificações?</p>
                            <button onClick={handleRequestPermission} className="mt-2 px-5 py-2.5 bg-primary text-white rounded-md hover:bg-primary-dark">
                                Ativar Notificações
                            </button>
                        </div>
                    )}
                    {permissionStatus === 'denied' && (
                         <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-md">
                            <p className="font-semibold">As notificações foram bloqueadas.</p>
                            <p className="mt-1 text-sm">Para ativá-las, você precisa alterar as permissões de notificação nas configurações do seu navegador.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;