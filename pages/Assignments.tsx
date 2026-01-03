import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Assignment, UserRole } from '../types';
import { getAssignments, addAssignment, updateAssignment, archiveAssignment } from '../services/firestoreService';
import { showNewAssignmentNotification } from '../utils/notifications';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import AssignmentFormModal from '../components/AssignmentFormModal';
import AssignmentDetail from '../components/details/AssignmentDetail';
import { PlusIcon, PencilIcon, TrashIcon } from '../components/icons/Icons';
import ScheduleAccordion from '../components/ScheduleAccordion';

const Assignments: React.FC = () => {
    const { user } = useAuth();
    const isServant = user?.role === UserRole.SERVANT;
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

    const [toastMessage, setToastMessage] = useState('');
    const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [allExpanded, setAllExpanded] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const upcomingAssignments = useMemo(() => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        return assignments
            .filter(a => new Date(a.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [assignments]);

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
                setExpandedItems(new Set(upcomingAssignments.map(s => s.id)));
            } else {
                setExpandedItems(new Set());
            }
            return nextState;
        });
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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Designações de Plataforma</h2>
                {isServant && (
                    <button
                        onClick={() => handleOpenModal(null)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Criar
                    </button>
                )}
            </div>
            
            {upcomingAssignments.length > 0 && (
                <div className="mb-4">
                    <button onClick={toggleAll} className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600">
                        {allExpanded ? 'Ocultar Programação' : 'Mostrar Programação'}
                    </button>
                </div>
            )}
            
            {isLoading ? (
                <p className="text-center p-6">Carregando designações...</p>
            ) : (
                <div className="space-y-4">
                     {upcomingAssignments.length > 0 ? upcomingAssignments.map(assignment => (
                        <ScheduleAccordion
                            key={assignment.id}
                            isOpen={expandedItems.has(assignment.id)}
                            onToggle={() => toggleItem(assignment.id)}
                            title={
                                <p className="font-bold text-lg text-slate-900 dark:text-white">
                                    {new Date(assignment.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                </p>
                            }
                            footer={
                                isServant && (
                                    <div className="p-3 flex justify-end items-center space-x-2">
                                        <button onClick={() => handleOpenModal(assignment)} className="p-2 text-slate-500 hover:text-amber-500" aria-label="Editar"><PencilIcon className="h-5 w-5" /></button>
                                        <button onClick={() => handleDelete(assignment)} className="p-2 text-slate-500 hover:text-red-500" aria-label="Excluir"><TrashIcon className="h-5 w-5" /></button>
                                    </div>
                                )
                            }
                        >
                            <AssignmentDetail assignment={assignment} />
                        </ScheduleAccordion>
                     )) : (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                            Nenhuma designação futura encontrada.
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