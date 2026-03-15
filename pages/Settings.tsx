
import React, { useState, useEffect } from 'react';
import { hasNotificationPermission, requestNotificationPermission, showTestNotification } from '../utils/notifications';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { getPublisherProfileByUid, addPublisherProfile, updatePublisherProfile } from '../services/firestoreService';
import { PublisherProfile } from '../types';
import { UserIcon, CheckIcon as CheckCircleIcon, ExclamationCircleIcon } from '../components/icons/Icons';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [permissionStatus, setPermissionStatus] = useState(Notification.permission);
    const { theme, setTheme } = useTheme();
    
    // Profile States
    const [profile, setProfile] = useState<PublisherProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileName, setProfileName] = useState('');
    const [profileGroup, setProfileGroup] = useState<'1' | '2' | '3' | ''>('');
    const [isRegularPioneer, setIsRegularPioneer] = useState(false);
    const [isAuxiliaryPioneer, setIsAuxiliaryPioneer] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;
        setLoadingProfile(true);
        try {
            const data = await getPublisherProfileByUid(user.uid);
            if (data) {
                setProfile(data);
                setProfileName(data.name || '');
                setProfileGroup(data.group || '');
                setIsRegularPioneer(data.isRegularPioneer || false);
                setIsAuxiliaryPioneer(data.isAuxiliaryPioneer || false);
            } else {
                setProfileName(user.displayName || '');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        if (!profileName.trim()) {
            setToast({ message: 'O nome é obrigatório.', type: 'error' });
            return;
        }

        setSavingProfile(true);
        try {
            const profileData = {
                uid: user.uid,
                name: profileName,
                group: profileGroup,
                isRegularPioneer,
                isAuxiliaryPioneer,
                isPublisher: true,
                isUnbaptizedPublisher: false,
                isMinisterialServant: false,
                isElder: false,
                email: user.email || '',
            };

            if (profile) {
                await updatePublisherProfile(profile.id, profileData, user.uid);
            } else {
                await addPublisherProfile(profileData, user.uid);
            }
            
            setToast({ message: 'Perfil atualizado com sucesso!', type: 'success' });
            loadProfile();
        } catch (error) {
            console.error('Error saving profile:', error);
            setToast({ message: 'Erro ao salvar perfil.', type: 'error' });
        } finally {
            setSavingProfile(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

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
        <>
            <div className="bg-primary p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-white">Configurações</h2>
                </div>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Profile Section */}
                    <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <UserIcon className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Meu Perfil</h3>
                        </div>
                        
                        {loadingProfile ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                    <input 
                                        type="text" 
                                        value={profileName} 
                                        onChange={e => setProfileName(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="Seu nome"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grupo de Serviço</label>
                                    <select 
                                        value={profileGroup} 
                                        onChange={e => setProfileGroup(e.target.value as any)}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                                    >
                                        <option value="">Selecione um grupo</option>
                                        <option value="1">Grupo 1</option>
                                        <option value="2">Grupo 2</option>
                                        <option value="3">Grupo 3</option>
                                    </select>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={isRegularPioneer} 
                                            onChange={e => {
                                                setIsRegularPioneer(e.target.checked);
                                                if (e.target.checked) setIsAuxiliaryPioneer(false);
                                            }}
                                            className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pioneiro Regular</span>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={isAuxiliaryPioneer} 
                                            onChange={e => {
                                                setIsAuxiliaryPioneer(e.target.checked);
                                                if (e.target.checked) setIsRegularPioneer(false);
                                            }}
                                            className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pioneiro Auxiliar</span>
                                    </label>
                                </div>

                                <button 
                                    onClick={handleSaveProfile}
                                    disabled={savingProfile}
                                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {savingProfile ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : 'Salvar Perfil'}
                                </button>

                                {!profile && (
                                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs">
                                        <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
                                        <p>Você ainda não configurou seu perfil. Isso é necessário para enviar relatórios.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

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
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce-in z-50 ${
                    toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                    {toast.type === 'success' ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationCircleIcon className="h-5 w-5" />}
                    <span className="font-bold text-sm">{toast.message}</span>
                </div>
            )}
        </>
    );
};

export default Settings;