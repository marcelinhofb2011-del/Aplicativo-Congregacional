
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LifeMinistrySchedule, UserRole } from '../types';
import { getSchedules, addSchedule, updateSchedule, archiveSchedule } from '../services/firestoreService';
import LifeMinistryFormModal from '../components/LifeMinistryFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import { PlusIcon, PencilIcon, TrashIcon, ShareIcon } from '../components/icons/Icons';
import LifeMinistryDetail from '../components/details/LifeMinistryDetail';
import ScheduleAccordion from '../components/ScheduleAccordion';

const LifeMinistry: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const isServant = user?.role === UserRole.SERVANT;
    const isReadOnly = location.state?.fromDashboard === true;

    const [schedules, setSchedules] = useState<LifeMinistrySchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<LifeMinistrySchedule | null>(null);
    const [scheduleToDelete, setScheduleToDelete] = useState<LifeMinistrySchedule | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [allExpanded, setAllExpanded] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const displaySchedules = useMemo(() => {
        // Remove all filters to ensure data is displayed.
        // Sort safely, putting items without a valid date at the end.
        return [...schedules].sort((a, b) => {
            const dateA = a?.date ? new Date(a.date).getTime() : 0;
            const dateB = b?.date ? new Date(b.date).getTime() : 0;
            if (!dateA || isNaN(dateA)) return 1;
            if (!dateB || isNaN(dateB)) return -1;
            return dateB - dateA; // Sort descending (most recent first)
        });
    }, [schedules]);


    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            let fetchedSchedules = await getSchedules();
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set to start of day for comparison

            const expiredSchedules = fetchedSchedules.filter(schedule => {
                if (!schedule.date) return false;
                const scheduleDate = new Date(schedule.date);
                return scheduleDate < today;
            });

            if (expiredSchedules.length > 0) {
                // This is a simplified approach. In a real app, you might want to batch deletes.
                for (const schedule of expiredSchedules) {
                    await archiveSchedule(schedule.id, user?.uid || 'system-cleanup'); // Using archive as a soft-delete
                }
                // Re-fetch or filter locally
                fetchedSchedules = fetchedSchedules.filter(schedule => !expiredSchedules.some(expired => expired.id === schedule.id));
                setToastMessage(`${expiredSchedules.length} programações vencidas foram limpas.`);
            }

            setSchedules(fetchedSchedules);
        } catch (error) {
            console.error("Failed to fetch and clean schedules:", error);
            setToastMessage('Falha ao carregar ou limpar programações.');
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
                setExpandedItems(new Set(displaySchedules.map(s => s.id)));
            } else {
                setExpandedItems(new Set());
            }
            return nextState;
        });
    };

    const handleOpenModal = (schedule: LifeMinistrySchedule | null) => {
        setEditingSchedule(schedule);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSchedule(null);
    };

    const handleSaveSchedule = async (scheduleData: Omit<LifeMinistrySchedule, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!user) {
            setToastMessage('Erro: Usuário não autenticado.');
            return;
        }
        try {
            if (editingSchedule) {
                await updateSchedule(editingSchedule.id, scheduleData, user.uid);
                setToastMessage('Programação atualizada com sucesso!');
            } else {
                await addSchedule(scheduleData, user.uid);
                setToastMessage('Programação criada com sucesso!');
            }
            fetchSchedules(); // Refetch to get the latest data
        } catch (error) {
            console.error("Failed to save schedule:", error);
            setToastMessage('Erro ao salvar a programação.');
        } finally {
            handleCloseModal();
        }
    };

    const handleDeleteClick = (schedule: LifeMinistrySchedule) => {
        setScheduleToDelete(schedule);
    };

    const handleConfirmDelete = async () => {
        if (scheduleToDelete && user) {
            try {
                await archiveSchedule(scheduleToDelete.id, user.uid);
                setToastMessage('Programação arquivada com sucesso!');
                fetchSchedules(); // Refetch
            } catch (error) {
                console.error("Failed to delete schedule:", error);
                setToastMessage('Erro ao arquivar a programação.');
            } finally {
                setScheduleToDelete(null);
            }
        }
    };
    
    const formatScheduleForSharing = (schedule: LifeMinistrySchedule): string => {
        let text = `*Vida e Ministério Cristão - ${schedule.week}*\n\n`;
        text += `Cântico ${schedule.initialSong} e Oração\n`;
        text += `Presidente: ${schedule.president}\n\n`;

        text += `*TESOUROS DA PALAVRA DE DEUS*\n`;
        text += `• ${schedule.treasuresTheme.theme} (10 min): ${schedule.treasuresTheme.speaker}\n`;
        text += `• Encontre Joias Espirituais (10 min): ${schedule.spiritualGems.speaker}\n`;
        text += `• Leitura da Bíblia (4 min): ${schedule.bibleReading.student}\n\n`;
        
        text += `*FAÇA SEU MELHOR NO MINISTÉRIO*\n`;
        schedule.studentParts.forEach(part => {
            if(part.student) {
                text += `• ${part.theme} (${part.time} min): ${part.student}`;
                text += part.helper ? ` (Ajudante: ${part.helper})\n` : '\n';
            }
        });
        
        text += `\n*NOSSA VIDA CRISTÃ*\n`;
        text += `Cântico ${schedule.intermediateSong}\n`;
        schedule.christianLifeParts.forEach(part => {
            if (part.speaker) {
                text += `• ${part.theme} (${part.time} min): ${part.speaker}\n`;
            }
        });

        text += `\n*Estudo Bíblico de Congregação:*\n`;
        text += `• Dirigente: ${schedule.congregationBibleStudy.conductor}\n`;
        text += `• Leitor: ${schedule.congregationBibleStudy.reader}\n\n`;
        
        text += `Cântico ${schedule.finalSong} e Oração\n`;
        text += `Oração Final: ${schedule.finalPrayer}`;
        
        return text;
    }
    
    const handleShare = async (schedule: LifeMinistrySchedule) => {
        const shareData = {
            title: `Programação Vida e Ministério - ${schedule.week}`,
            text: formatScheduleForSharing(schedule),
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.text);
                setToastMessage('Programação copiada para a área de transferência!');
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error("Erro ao compartilhar:", err);
                setToastMessage('Não foi possível compartilhar a programação.');
            }
        }
    };

    return (
        <>
            <div className="bg-primary p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Vida e Ministério</h2>
                    {!isReadOnly && isServant && (
                        <button
                            onClick={() => handleOpenModal(null)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-white/20 hover:bg-white/30"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Criar
                        </button>
                    )}
                </div>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8">
                {displaySchedules.length > 0 && (
                    <div className="mb-4">
                        <button onClick={toggleAll} className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600">
                            {allExpanded ? 'Ocultar Todos' : 'Mostrar Todos'}
                        </button>
                    </div>
                )}

                {isLoading ? <p>Carregando...</p> : (
                     <div className="space-y-4">
                        {displaySchedules.length > 0 ? displaySchedules.map(schedule => (
                            <ScheduleAccordion
                                key={schedule.id}
                                isOpen={expandedItems.has(schedule.id)}
                                onToggle={() => toggleItem(schedule.id)}
                                title={
                                    <div>
                                        <p className="font-bold text-lg text-slate-900 dark:text-white">{schedule?.week || 'Semana indefinida'}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Presidente: {schedule?.president || 'Não definido'}</p>
                                    </div>
                                }
                                footer={
                                    <div className="p-4 flex justify-end items-center space-x-2">
                                        <button onClick={() => handleShare(schedule)} className="p-2 text-slate-500 hover:text-sky-500" aria-label="Compartilhar"><ShareIcon className="h-5 w-5" /></button>
                                        {isServant && (
                                            <>
                                                <button onClick={() => handleOpenModal(schedule)} className="p-2 text-slate-500 hover:text-amber-500" aria-label="Editar"><PencilIcon className="h-5 w-5" /></button>
                                                <button onClick={() => handleDeleteClick(schedule)} className="p-2 text-slate-500 hover:text-red-500" aria-label="Excluir"><TrashIcon className="h-5 w-5" /></button>
                                            </>
                                        )}
                                    </div>
                                }
                            >
                                <LifeMinistryDetail schedule={schedule} />
                            </ScheduleAccordion>
                        )) : (
                             <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                                Nenhuma programação encontrada. Verifique se há dados na coleção 'vida_e_ministerio'.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <LifeMinistryFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveSchedule}
                    initialData={editingSchedule}
                />
            )}

            <ConfirmationModal
                isOpen={!!scheduleToDelete}
                onClose={() => setScheduleToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Arquivamento"
                message="Você tem certeza que deseja arquivar esta programação? Ela não será mais exibida na lista principal."
            />
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </>
    );
};

export default LifeMinistry;
