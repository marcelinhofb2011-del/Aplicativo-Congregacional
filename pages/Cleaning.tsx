
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CleaningSchedule, UserRole } from '../types';
import { getCleaningSchedules, addCleaningSchedule, updateCleaningSchedule, deleteCleaningSchedule } from '../services/firestoreService';
import { assignmentNotificationService } from '../services/assignmentNotificationService';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import CleaningFormModal from '../components/CleaningFormModal';
import CleaningDetail from '../components/details/CleaningDetail';
import { PencilIcon, TrashIcon, PlusIcon } from '../components/icons/Icons';
import ScheduleAccordion from '../components/ScheduleAccordion';
import { CLEANING_GROUPS } from '../constants';

const Cleaning: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const isServant = user?.role === UserRole.SERVANT;
    const isReadOnly = location.state?.fromDashboard === true;
    
    const [schedules, setSchedules] = useState<CleaningSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<CleaningSchedule | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [scheduleToDelete, setScheduleToDelete] = useState<CleaningSchedule | null>(null);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [allExpanded, setAllExpanded] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);
    
    const upcomingSchedules = useMemo(() => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        return schedules
            .filter(s => s.isActive !== false && new Date(s.endDate) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [schedules]);

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
                setExpandedItems(new Set(upcomingSchedules.map(s => s.id)));
            } else {
                setExpandedItems(new Set());
            }
            return nextState;
        });
    };

    const handleOpenModal = (schedule: CleaningSchedule | null) => {
        setEditingSchedule(schedule);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingSchedule(null);
        setIsModalOpen(false);
    };

    const handleSaveSchedule = async (formData: Omit<CleaningSchedule, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!user) return;

        try {
            if (editingSchedule) {
                await updateCleaningSchedule(editingSchedule.id, formData, user.uid);
                await assignmentNotificationService.notifyCleaning({ ...formData, id: editingSchedule.id } as any);
                setToastMessage('Escala de limpeza atualizada!');
            } else {
                const newSchedule = await addCleaningSchedule(formData, user.uid);
                await assignmentNotificationService.notifyCleaning(newSchedule as any);
                setToastMessage('Nova escala de limpeza adicionada.');
            }
            setExpandedItems(new Set()); // Collapse all items after save
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
                await deleteCleaningSchedule(scheduleToDelete.id);
                setToastMessage('Escala de limpeza excluída.');
                setScheduleToDelete(null);
                fetchData();
            } catch (error) {
                setToastMessage('Erro ao excluir a escala.');
                console.error("Delete cleaning schedule error:", error);
            }
        }
    };
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });

    return (
        <>
            <div className="bg-primary p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Escala de Limpeza</h2>
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
                {upcomingSchedules.length > 0 && (
                    <div className="mb-4">
                        <button onClick={toggleAll} className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600">
                            {allExpanded ? 'Ocultar Programação' : 'Mostrar Programação'}
                        </button>
                    </div>
                )}
                
                {isLoading ? (
                    <p className="text-center p-6">Carregando escala...</p>
                ) : (
                    <div className="space-y-4">
                        {upcomingSchedules.length > 0 ? upcomingSchedules.map(schedule => (
                            <ScheduleAccordion
                                key={schedule.id}
                                isOpen={expandedItems.has(schedule.id)}
                                onToggle={() => toggleItem(schedule.id)}
                                title={
                                    <div>
                                        <p className="font-bold text-lg text-slate-900 dark:text-white">{formatDate(schedule.date)} a {formatDate(schedule.endDate)}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{schedule.group}: {CLEANING_GROUPS[schedule.group]}</p>
                                    </div>
                                }
                                footer={
                                    isServant && (
                                        <div className="p-3 flex justify-end items-center space-x-4">
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(schedule); }} className="p-2 text-slate-500 hover:text-amber-500" aria-label="Editar"><PencilIcon className="h-5 w-5" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(schedule); }} className="p-2 text-slate-500 hover:text-red-500" aria-label="Excluir"><TrashIcon className="h-5 w-5" /></button>
                                        </div>
                                    )
                                }
                            >
                               <CleaningDetail schedule={schedule} />
                            </ScheduleAccordion>
                        )) : (
                            <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                                Nenhuma escala de limpeza futura encontrada.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <CleaningFormModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveSchedule}
                    initialData={editingSchedule}
                />
            )}
             
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
            <ConfirmationModal
                isOpen={!!scheduleToDelete}
                onClose={() => setScheduleToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão"
                message={`Você tem certeza que deseja excluir permanentemente a escala de limpeza do período de ${scheduleToDelete ? formatDate(scheduleToDelete.date) : ''} a ${scheduleToDelete ? formatDate(scheduleToDelete.endDate) : ''}?`}
            />
        </>
    );
};

export default Cleaning;