
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LifeMinistrySchedule } from '../types';
import { getSchedules, addSchedule, updateSchedule, archiveSchedule } from '../services/firestoreService';
import LifeMinistryFormModal from '../components/LifeMinistryFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import { PlusIcon, PencilIcon, TrashIcon, ShareIcon } from '../components/icons/Icons';

const LifeMinistry: React.FC = () => {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<LifeMinistrySchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<LifeMinistrySchedule | null>(null);
    const [scheduleToDelete, setScheduleToDelete] = useState<LifeMinistrySchedule | null>(null);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const fetchedSchedules = await getSchedules();
            setSchedules(fetchedSchedules);
        } catch (error) {
            console.error("Failed to fetch schedules:", error);
            setToastMessage('Falha ao carregar programações.');
        } finally {
            setIsLoading(false);
        }
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
            if (err.name === 'AbortError') {
                console.log('Share canceled by user.');
            } else {
                console.error("Erro ao compartilhar:", err);
                setToastMessage('Não foi possível compartilhar a programação.');
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vida e Ministério</h2>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Criar
                </button>
            </div>

            {isLoading ? <p>Carregando...</p> : (
                 <div className="space-y-4">
                    {schedules.map(schedule => (
                        <div key={schedule.id} className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-4 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg text-slate-900 dark:text-white">
                                    {schedule.week}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Presidente: {schedule.president}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleShare(schedule)} className="p-2 text-slate-500 hover:text-sky-500"><ShareIcon className="h-5 w-5" /></button>
                                <button onClick={() => handleOpenModal(schedule)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                <button onClick={() => handleDeleteClick(schedule)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
        </div>
    );
};

export default LifeMinistry;
