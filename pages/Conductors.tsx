
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ConductorMeeting } from '../types';
import { getConductorMeetings, addConductorMeeting, updateConductorMeeting, archiveConductorMeeting } from '../services/firestoreService';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import ConductorsFormModal from '../components/ConductorsFormModal';
import { PencilIcon, TrashIcon, PlusIcon } from '../components/icons/Icons';

const Conductors: React.FC = () => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<ConductorMeeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<ConductorMeeting | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [meetingToDelete, setMeetingToDelete] = useState<ConductorMeeting | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

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
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Escala de Dirigentes</h2>
                <button onClick={() => handleOpenModal(null)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Criar
                </button>
            </div>
            
            {isLoading ? (
                <p className="text-center p-6">Carregando escala...</p>
            ) : (
                <div className="space-y-4">
                    {meetings.length > 0 ? meetings.map(meeting => {
                         const meetingDate = new Date(meeting.date);
                        const today = new Date();
                        meetingDate.setUTCHours(0,0,0,0);
                        today.setUTCHours(0,0,0,0);
                        const isFuture = meetingDate >= today;
                        return (
                        <div key={meeting.id} className={`bg-white dark:bg-slate-800 shadow-md rounded-lg p-4 flex justify-between items-center transition-opacity ${!isFuture ? 'opacity-60' : ''}`}>
                            <div>
                                <p className="font-bold text-lg text-slate-900 dark:text-white">{meeting.conductorName}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {new Date(meeting.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' })}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <button onClick={() => handleOpenModal(meeting)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                <button onClick={() => handleDelete(meeting)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                            </div>
                        </div>
                    )}) : (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg">
                            Nenhuma escala de dirigentes encontrada.
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
