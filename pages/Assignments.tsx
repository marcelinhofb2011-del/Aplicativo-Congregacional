
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Assignment } from '../types';
import { getAssignments, addAssignment, updateAssignment, archiveAssignment } from '../services/firestoreService';
import { showNewAssignmentNotification } from '../utils/notifications';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import AssignmentFormModal from '../components/AssignmentFormModal';
import { PlusIcon, PencilIcon, TrashIcon } from '../components/icons/Icons';

const Assignments: React.FC = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State for the modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

    const [toastMessage, setToastMessage] = useState('');
    const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getAssignments();
            setAssignments(data);
        } catch (error) {
            console.error("Failed to fetch assignments:", error);
            setToastMessage('Erro ao carregar designações.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (assignment: Assignment | null) => {
        setEditingAssignment(assignment);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingAssignment(null);
        setIsModalOpen(false);
    };

    const handleSaveAssignment = async (formData: Omit<Assignment, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!user) {
            setToastMessage('Erro: Usuário não autenticado.');
            return;
        }

        try {
            if (editingAssignment) {
                await updateAssignment(editingAssignment.id, formData, user.uid);
                setToastMessage('Designações atualizadas com sucesso!');
            } else {
                await addAssignment(formData, user.uid);
                setToastMessage(`Designações para ${new Date(formData.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} criadas!`);
                showNewAssignmentNotification(`para ${new Date(formData.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`, "Novas designações de plataforma");
            }
            fetchData();
        } catch (error) {
            setToastMessage('Erro ao salvar designações.');
            console.error("Save assignment error:", error);
        } finally {
            handleCloseModal();
        }
    };

    const handleDelete = (assignment: Assignment) => {
        setAssignmentToDelete(assignment);
    };

    const confirmDelete = async () => {
        if (assignmentToDelete && user) {
            try {
                await archiveAssignment(assignmentToDelete.id, user.uid);
                setToastMessage('Designações arquivadas com sucesso.');
                setAssignmentToDelete(null);
                fetchData();
            } catch (error) {
                setToastMessage('Erro ao arquivar designações.');
                console.error("Archive error:", error);
            }
        }
    };
    
    const getAssignmentSummary = (assignment: Assignment): string => {
        const assignedRoles: string[] = [];
        if (assignment.indicator1 || assignment.indicator2) assignedRoles.push('Indicadores');
        if (assignment.mic1 || assignment.mic2) assignedRoles.push('Microfones');
        if (assignment.reader) assignedRoles.push('Leitor');
        if (assignment.audio) assignedRoles.push('Áudio');
        if (assignment.video) assignedRoles.push('Vídeo');

        if (assignedRoles.length === 0) {
            return 'Nenhuma designação preenchida.';
        }
        
        if (assignedRoles.length > 3) {
            return `${assignedRoles.slice(0, 3).join(', ')} e mais...`;
        }
        
        return assignedRoles.join(', ');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Designações de Plataforma</h2>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Criar
                </button>
            </div>
            
            {isLoading ? (
                <p className="text-center p-6">Carregando designações...</p>
            ) : (
                <div className="space-y-4">
                     {assignments.length > 0 ? assignments.map(assignment => {
                        const assignmentDate = new Date(assignment.date);
                        const today = new Date();
                        assignmentDate.setUTCHours(0,0,0,0);
                        today.setUTCHours(0,0,0,0);
                        const isFuture = assignmentDate >= today;

                        return (
                            <div key={assignment.id} className={`bg-white dark:bg-slate-800 shadow-md rounded-lg p-4 flex justify-between items-center transition-opacity ${!isFuture ? 'opacity-60' : ''}`}>
                                <div>
                                    <p className="font-bold text-lg text-slate-900 dark:text-white">
                                        {new Date(assignment.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' })}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {getAssignmentSummary(assignment)}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <button onClick={() => handleOpenModal(assignment)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handleDelete(assignment)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                                </div>
                            </div>
                        )
                     }) : (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg">
                            Nenhuma designação encontrada.
                        </div>
                     )}
                </div>
            )}
            
            {isModalOpen && (
                <AssignmentFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveAssignment}
                    initialData={editingAssignment}
                />
            )}
            
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
            
            <ConfirmationModal
                isOpen={!!assignmentToDelete}
                onClose={() => setAssignmentToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Arquivamento"
                message={`Você tem certeza que deseja arquivar as designações de ${assignmentToDelete ? new Date(assignmentToDelete.date).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : ''}?`}
            />
        </div>
    );
};

export default Assignments;
