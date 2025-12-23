
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PublicTalkSchedule } from '../types';
import { getPublicTalks, addPublicTalk, updatePublicTalk, archivePublicTalk } from '../services/firestoreService';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import PublicTalkFormModal from '../components/PublicTalkFormModal';
import DetailedScheduleModal from '../components/ScheduleDetailModal';
import { DashboardSchedule } from './Dashboard';
import { PencilIcon, TrashIcon, PlusIcon } from '../components/icons/Icons';

const PublicTalk: React.FC = () => {
    const { user } = useAuth();
    const [talks, setTalks] = useState<PublicTalkSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'local' | 'away'>('local');

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingTalk, setEditingTalk] = useState<PublicTalkSchedule | null>(null);
    const [viewingTalk, setViewingTalk] = useState<DashboardSchedule | null>(null);

    const [toastMessage, setToastMessage] = useState('');
    const [talkToDelete, setTalkToDelete] = useState<PublicTalkSchedule | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getPublicTalks();
            setTalks(data);
        } catch (error) {
            console.error("Failed to fetch public talks:", error);
            setToastMessage('Erro ao carregar os discursos.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const filteredTalks = useMemo(() => talks.filter(talk => talk.type === activeTab), [talks, activeTab]);

    const handleOpenFormModal = (talk: PublicTalkSchedule | null) => {
        setEditingTalk(talk);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setEditingTalk(null);
        setIsFormModalOpen(false);
    };
    
    const handleViewDetails = (talk: PublicTalkSchedule) => {
        setViewingTalk({
            id: talk.id,
            type: 'Discurso Público',
            title: talk.theme,
            date: talk.date,
            details: '', // not used
            fullData: talk,
        });
    };

    const handleSaveTalk = async (formData: Omit<PublicTalkSchedule, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!user) return;

        try {
            if (editingTalk) {
                await updatePublicTalk(editingTalk.id, formData, user.uid);
                setToastMessage('Discurso atualizado com sucesso!');
            } else {
                await addPublicTalk(formData, user.uid);
                setToastMessage('Novo discurso adicionado à programação.');
            }
            fetchData();
        } catch (error) {
            setToastMessage('Erro ao salvar o discurso.');
            console.error("Save public talk error:", error);
        } finally {
            handleCloseFormModal();
        }
    };

    const handleDelete = (talk: PublicTalkSchedule) => {
        setTalkToDelete(talk);
    };

    const confirmDelete = async () => {
        if (talkToDelete && user) {
            try {
                await archivePublicTalk(talkToDelete.id, user.uid);
                setToastMessage('Discurso arquivado com sucesso.');
                setTalkToDelete(null);
                fetchData();
            } catch (error) {
                setToastMessage('Erro ao arquivar o discurso.');
                console.error("Archive public talk error:", error);
            }
        }
    };
    
    const TabButton: React.FC<{ tabId: 'local' | 'away', label: string }> = ({ tabId, label }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === tabId
                    ? 'bg-primary text-white shadow'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Discursos Públicos</h2>
                <button onClick={() => handleOpenFormModal(null)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Agendar
                </button>
            </div>
            
            <div className="mb-6 flex space-x-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <TabButton tabId="local" label="Discurso Local" />
                <TabButton tabId="away" label="Discurso Fora" />
            </div>
            
            {isLoading ? (
                <p className="text-center p-6">Carregando discursos...</p>
            ) : (
                <div className="space-y-4">
                    {filteredTalks.length > 0 ? filteredTalks.map(talk => {
                        const talkDate = new Date(talk.date);
                        const today = new Date();
                        talkDate.setUTCHours(0,0,0,0);
                        today.setUTCHours(0,0,0,0);
                        const isFuture = talkDate >= today;
                        return (
                        <div key={talk.id} className={`bg-white dark:bg-slate-800 shadow-md rounded-lg transition-opacity ${!isFuture ? 'opacity-60' : ''}`}>
                             <div onClick={() => handleViewDetails(talk)} className="p-4 cursor-pointer">
                                <p className="font-bold text-lg text-slate-900 dark:text-white truncate">
                                    {new Date(talk.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })} às {talk.time}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {talk.speakerName} ({talk.congregation})
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">{talk.theme}</p>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0 border-t border-slate-100 dark:border-slate-700/50 px-4 py-2 justify-end">
                                <button onClick={() => handleOpenFormModal(talk)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                <button onClick={() => handleDelete(talk)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                            </div>
                        </div>
                    )}) : (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg">
                            Nenhuma programação de discurso encontrada para esta categoria.
                        </div>
                    )}
                </div>
            )}
            
            {isFormModalOpen && (
                <PublicTalkFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseFormModal}
                    onSave={handleSaveTalk}
                    initialData={editingTalk}
                />
            )}
            
            <DetailedScheduleModal 
                schedule={viewingTalk}
                onClose={() => setViewingTalk(null)}
            />
            
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
            <ConfirmationModal
                isOpen={!!talkToDelete}
                onClose={() => setTalkToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Arquivamento"
                message={`Você tem certeza que deseja arquivar o discurso "${talkToDelete?.theme}"?`}
            />
        </div>
    );
};

export default PublicTalk;
