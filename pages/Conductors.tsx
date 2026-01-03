import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ConductorMeeting, UserRole } from '../types';
import { getConductorMeetings, addConductorMeeting, updateConductorMeeting, archiveConductorMeeting } from '../services/firestoreService';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import ConductorsFormModal from '../components/ConductorsFormModal';
import ConductorDetail from '../components/details/ConductorDetail';
import { PencilIcon, TrashIcon, PlusIcon } from '../components/icons/Icons';
import ScheduleAccordion from '../components/ScheduleAccordion';

const Conductors: React.FC = () => {
    const { user } = useAuth();
    const isServant = user?.role === UserRole.SERVANT;

    const [meetings, setMeetings] = useState<ConductorMeeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<ConductorMeeting | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [meetingToDelete, setMeetingToDelete] = useState<ConductorMeeting | null>(null);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [allExpanded, setAllExpanded] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);
    
    const upcomingMeetings = useMemo(() => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        return meetings
            .filter(m => new Date(m.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [meetings]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getConductorMeetings();
            setMeetings(data);
        } catch (error) {
            console.error("Failed to fetch conductor meetings:", error);
            setToastMessage('Erro ao carregar a lista de dirigentes.');
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
                setExpandedItems(new Set(upcomingMeetings.map(s => s.id)));
            } else {
                setExpandedItems(new Set());
            }
            return nextState;
        });
    };

    const handleOpenModal = (meeting: ConductorMeeting | null) => {
        setEditingMeeting(meeting);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingMeeting(null);
        setIsModalOpen(false);
    };
    
    const handleSaveMeeting = async (formData: Omit<ConductorMeeting, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!user) return;

        try {
            if (editingMeeting) {
                await updateConductorMeeting(editingMeeting.id, formData, user.uid);
                setToastMessage('Registro de dirigente atualizado!');
            } else {
                await addConductorMeeting(formData, user.uid);
                setToastMessage('Novo dirigente adicionado à escala.');
            }
            fetchData();
        } catch (error) {
            setToastMessage('Erro ao salvar o registro.');
            console.error("Save conductor meeting error:", error);
        } finally {
            handleCloseModal();
        }
    };

    const handleDelete = (meeting: ConductorMeeting) => {
        setMeetingToDelete(meeting);
    };

    const confirmDelete = async () => {
        if (meetingToDelete && user) {
            try {
                await archiveConductorMeeting(meetingToDelete.id, user.uid);
                setToastMessage('Registro de dirigente arquivado.');
                setMeetingToDelete(null);
                fetchData();
            } catch (error) {
                setToastMessage('Erro ao arquivar o registro.');
                console.error("Archive conductor meeting error:", error);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Serviço de Campo</h2>
                {isServant && (
                    <button onClick={() => handleOpenModal(null)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Criar
                    </button>
                )}
            </div>

            {upcomingMeetings.length > 0 && (
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
                    {upcomingMeetings.length > 0 ? upcomingMeetings.map(meeting => (
                         <ScheduleAccordion
                            key={meeting.id}
                            isOpen={expandedItems.has(meeting.id)}
                            onToggle={() => toggleItem(meeting.id)}
                            title={
                                <div>
                                    <p className="font-bold text-lg text-slate-900 dark:text-white">{new Date(meeting.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' })}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Dirigente: {meeting.conductorName}</p>
                                </div>
                            }
                            footer={
                                isServant && (
                                    <div className="p-3 flex justify-end items-center space-x-2">
                                        <button onClick={() => handleOpenModal(meeting)} className="p-2 text-slate-500 hover:text-amber-500" aria-label="Editar"><PencilIcon className="h-5 w-5" /></button>
                                        <button onClick={() => handleDelete(meeting)} className="p-2 text-slate-500 hover:text-red-500" aria-label="Excluir"><TrashIcon className="h-5 w-5" /></button>
                                    </div>
                                )
                            }
                        >
                            <ConductorDetail schedule={meeting} />
                        </ScheduleAccordion>
                    )) : (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                            Nenhuma escala futura encontrada.
                        </div>
                    )}
                </div>
            )}
            
            {isModalOpen && (
                <ConductorsFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveMeeting}
                    initialData={editingMeeting}
                />
            )}
            
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
            <ConfirmationModal
                isOpen={!!meetingToDelete}
                onClose={() => setMeetingToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Arquivamento"
                message={`Você tem certeza que deseja arquivar o registro do dirigente ${meetingToDelete?.conductorName} de ${meetingToDelete ? new Date(meetingToDelete.date).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : ''}?`}
            />
        </div>
    );
};

export default Conductors;
