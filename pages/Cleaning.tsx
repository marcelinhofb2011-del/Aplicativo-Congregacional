
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CleaningSchedule, MeetingDay } from '../types';
import { getCleaningSchedules, addCleaningSchedule, updateCleaningSchedule, archiveCleaningSchedule } from '../services/firestoreService';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import CleaningFormModal from '../components/CleaningFormModal';
import { PencilIcon, TrashIcon, PlusIcon } from '../components/icons/Icons';
import { CLEANING_GROUPS } from '../constants';
import DetailedScheduleModal from '../components/ScheduleDetailModal';
import { DashboardSchedule } from './Dashboard';

const meetingDayLabels: Record<MeetingDay, string> = {
    midweek: 'Meio de semana',
    weekend: 'Fim de semana',
};

const Cleaning: React.FC = () => {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<CleaningSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<CleaningSchedule | null>(null);
    const [viewingSchedule, setViewingSchedule] = useState<DashboardSchedule | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [scheduleToDelete, setScheduleToDelete] = useState<CleaningSchedule | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getCleaningSchedules();
            setSchedules(data);
        } catch (error) {
            console.error("Failed to fetch cleaning schedules:", error);
            setToastMessage('Erro ao carregar a escala de limpeza.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (schedule: CleaningSchedule | null) => {
        setEditingSchedule(schedule);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingSchedule(null);
        setIsModalOpen(false);
    };

    const handleViewDetails = (schedule: CleaningSchedule) => {
        setViewingSchedule({
            id: schedule.id,
            type: 'Limpeza',
            title: `Limpeza - ${schedule.group}`,
            date: schedule.date,
            details: '', // not used
            fullData: schedule,
        });
    };

    const handleSaveSchedule = async (formData: Omit<CleaningSchedule, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!user) return;

        try {
            if (editingSchedule) {
                await updateCleaningSchedule(editingSchedule.id, formData, user.uid);
                setToastMessage('Escala de limpeza atualizada!');
            } else {
                await addCleaningSchedule(formData, user.uid);
                setToastMessage('Nova escala de limpeza adicionada.');
            }
            fetchData();
        } catch (error) {
            setToastMessage('Erro ao salvar a escala.');
            console.error("Save cleaning schedule error:", error);
        } finally {
            handleCloseModal();
        }
    };

    const handleDelete = (schedule: CleaningSchedule) => {
        setScheduleToDelete(schedule);
    };

    const confirmDelete = async () => {
        if (scheduleToDelete && user) {
            try {
                await archiveCleaningSchedule(scheduleToDelete.id, user.uid);
                setToastMessage('Escala de limpeza arquivada.');
                setScheduleToDelete(null);
                fetchData();
            } catch (error) {
                setToastMessage('Erro ao arquivar a escala.');
                console.error("Archive cleaning schedule error:", error);
            }
        }
    };
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Escala de Limpeza</h2>
                 <button
                    onClick={() => handleOpenModal(null)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Criar
                </button>
            </div>
            
            {isLoading ? (
                <p className="text-center p-6">Carregando escala...</p>
            ) : (
                <div className="space-y-4">
                    {schedules.length > 0 ? schedules.map(schedule => {
                        const today = new Date();
                        today.setUTCHours(0,0,0,0);
                        const scheduleEndDate = new Date(schedule.endDate);
                        scheduleEndDate.setUTCHours(0,0,0,0);
                        const isFuture = scheduleEndDate >= today;
                        
                        return (
                        <div key={schedule.id} className={`bg-white dark:bg-slate-800 shadow-md rounded-lg transition-opacity ${!isFuture ? 'opacity-60' : ''}`}>
                            <div onClick={() => handleViewDetails(schedule)} className="p-4 cursor-pointer">
                                <p className="font-bold text-lg text-slate-900 dark:text-white">
                                    {formatDate(schedule.date)} a {formatDate(schedule.endDate)}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                     {schedule.group}: {CLEANING_GROUPS[schedule.group]}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Dias: {schedule.meetingDays.map(d => meetingDayLabels[d]).join(' e ')}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0 border-t border-slate-100 dark:border-slate-700/50 px-4 py-2 justify-end">
                                <button onClick={() => handleOpenModal(schedule)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                <button onClick={() => handleDelete(schedule)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                            </div>
                        </div>
                    )}) : (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg">
                            Nenhuma escala de limpeza encontrada.
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <CleaningFormModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveSchedule}
                    initialData={editingSchedule}
                />
            )}
             
            <DetailedScheduleModal 
                schedule={viewingSchedule}
                onClose={() => setViewingSchedule(null)}
            />
            
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
            <ConfirmationModal
                isOpen={!!scheduleToDelete}
                onClose={() => setScheduleToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Arquivamento"
                message={`Você tem certeza que deseja arquivar a escala de limpeza do período de ${scheduleToDelete ? formatDate(scheduleToDelete.date) : ''} a ${scheduleToDelete ? formatDate(scheduleToDelete.endDate) : ''}?`}
            />
        </div>
    );
};

export default Cleaning;
