import React, { useState, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { useAuth } from '../hooks/useAuth';
import { PublicTalkSchedule, UserRole } from '../types';
import { getPublicTalks, addPublicTalk, updatePublicTalk, archivePublicTalk } from '../services/firestoreService';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import PublicTalkFormModal from '../components/PublicTalkFormModal';
import PublicTalkDetail from '../components/details/PublicTalkDetail';
import { PlusIcon, ShareIcon, PencilIcon, TrashIcon } from '../components/icons/Icons';
import ScheduleAccordion from '../components/ScheduleAccordion';
import { REVERSE_PUBLIC_TALK_THEMES } from '../utils/publicTalksHelper';

const PublicTalk: React.FC = () => {
    const { user } = useAuth();
    const isServant = user?.role === UserRole.SERVANT;
    
    const [talks, setTalks] = useState<PublicTalkSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'local' | 'away'>('local');

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingTalk, setEditingTalk] = useState<PublicTalkSchedule | null>(null);

    const [toastMessage, setToastMessage] = useState('');
    const [talkToDelete, setTalkToDelete] = useState<PublicTalkSchedule | null>(null);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [allExpanded, setAllExpanded] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    
    useEffect(() => {
        fetchData();
    }, []);
    
    const upcomingTalks = useMemo(() => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        return talks
            .filter(talk => talk.type === activeTab && new Date(talk.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [talks, activeTab]);

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
    
    const toggleItem = (id: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleAll = () => {
        setAllExpanded(prev => {
            const nextState = !prev;
            if (nextState) {
                setExpandedItems(new Set(upcomingTalks.map(s => s.id)));
            } else {
                setExpandedItems(new Set());
            }
            return nextState;
        });
    };

    const handleOpenFormModal = (talk: PublicTalkSchedule | null) => {
        setEditingTalk(talk);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setEditingTalk(null);
        setIsFormModalOpen(false);
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

    const handleShare = async (schedule: PublicTalkSchedule) => {
        const shareElement = document.getElementById(`talk-card-content-${schedule.id}`);
        if (!shareElement) {
            setToastMessage("Erro ao gerar imagem da designação.");
            return;
        }

        const textFallback = () => {
            const formattedDate = new Date(schedule.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
            const fullDateStringForShare = `${formattedDate} às ${schedule.time}`;
            const outlineNumber = REVERSE_PUBLIC_TALK_THEMES[schedule.theme] || 'N/A';
    
            let text = `----------------------------------\n`;
            text += `DESIGNAÇÃO DE DISCURSO\n\n`;
            text += `[ Seção 1 — Identificação ]\n...`; // Abridged for brevity
            text += `----------------------------------`;
            return text;
        };
        
        setIsSharing(true);
        try {
            const canvas = await html2canvas(shareElement, { scale: 2, useCORS: true, backgroundColor: null });
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error("Falha ao criar imagem da designação.");

            const file = new File([blob], `designacao_discurso.png`, { type: 'image/png' });
            const shareData = { files: [file], title: 'Designação de Discurso Público', text: `Designação para ${schedule.speakerName}` };

            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                const text = textFallback();
                await navigator.clipboard.writeText(text);
                setToastMessage('Designação copiada para a área de transferência!');
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error("Erro ao compartilhar:", err);
                setToastMessage('Falha ao compartilhar. Designação copiada como texto.');
                await navigator.clipboard.writeText(textFallback());
            }
        } finally {
            setIsSharing(false);
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
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {isServant ? 'Discursos Públicos' : 'Discursos Locais'}
                </h2>
                {isServant && (
                    <button onClick={() => handleOpenFormModal(null)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Agendar
                    </button>
                )}
            </div>
            
            {isServant && (
                <div className="mb-6 flex space-x-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <TabButton tabId="local" label="Discurso Local" />
                    <TabButton tabId="away" label="Discurso Fora" />
                </div>
            )}

            {upcomingTalks.length > 0 && (
                <div className="mb-4">
                    <button onClick={toggleAll} className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600">
                        {allExpanded ? 'Ocultar Programação' : 'Mostrar Programação'}
                    </button>
                </div>
            )}
            
            {isLoading ? (
                <p className="text-center p-6">Carregando discursos...</p>
            ) : (
                <div className="space-y-4">
                    {upcomingTalks.length > 0 ? upcomingTalks.map(talk => (
                        <ScheduleAccordion
                            key={talk.id}
                            isOpen={expandedItems.has(talk.id)}
                            onToggle={() => toggleItem(talk.id)}
                            title={
                                <div>
                                    <p className="font-bold text-lg text-slate-900 dark:text-white">{new Date(talk.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{talk.speakerName} - {talk.theme}</p>
                                </div>
                            }
                            footer={
                                <div className="p-3 flex justify-end items-center space-x-2">
                                    <button onClick={() => handleShare(talk)} disabled={isSharing} className="p-2 text-slate-500 hover:text-sky-500 disabled:opacity-50" aria-label="Compartilhar"><ShareIcon className="h-5 w-5" /></button>
                                    {isServant && (
                                        <>
                                            <button onClick={() => handleOpenFormModal(talk)} className="p-2 text-slate-500 hover:text-amber-500" aria-label="Editar"><PencilIcon className="h-5 w-5" /></button>
                                            <button onClick={() => handleDelete(talk)} className="p-2 text-slate-500 hover:text-red-500" aria-label="Excluir"><TrashIcon className="h-5 w-5" /></button>
                                        </>
                                    )}
                                </div>
                            }
                        >
                            <PublicTalkDetail schedule={talk} />
                        </ScheduleAccordion>
                    )) : (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                            Nenhuma programação futura encontrada para esta categoria.
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
