
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ShepherdingVisit } from '../types';
import { getShepherdingVisits, addShepherdingVisit, updateShepherdingVisit, archiveShepherdingVisit } from '../services/firestoreService';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import ShepherdingFormModal from '../components/ShepherdingFormModal';
import { PencilIcon, TrashIcon, PlusIcon } from '../components/icons/Icons';
import DetailedScheduleModal from '../components/ScheduleDetailModal';
import { DashboardSchedule } from './Dashboard';

const Shepherding: React.FC = () => {
    const { user } = useAuth();
    const [visits, setVisits] = useState<ShepherdingVisit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVisit, setEditingVisit] = useState<ShepherdingVisit | null>(null);
    const [viewingVisit, setViewingVisit] = useState<DashboardSchedule | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [visitToDelete, setVisitToDelete] = useState<ShepherdingVisit | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getShepherdingVisits();
            setVisits(data);
        } catch (error) {
            console.error("Failed to fetch shepherding visits:", error);
            setToastMessage('Erro ao carregar visitas de pastoreio.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleOpenModal = (visit: ShepherdingVisit | null) => {
        setEditingVisit(visit);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingVisit(null);
        setIsModalOpen(false);
    };

    const handleViewDetails = (visit: ShepherdingVisit) => {
        setViewingVisit({
            id: visit.id,
            type: 'Pastoreio',
            title: `Visita: ${visit.brotherName}`,
            date: visit.date,
            details: '', // not used
            fullData: visit,
        });
    };

    const handleSaveVisit = async (formData: Omit<ShepherdingVisit, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!user) return;

        try {
            if (editingVisit) {
                await updateShepherdingVisit(editingVisit.id, formData, user.uid);
                setToastMessage('Registro de pastoreio atualizado!');
            } else {
                await addShepherdingVisit(formData, user.uid);
                setToastMessage('Novo registro de pastoreio adicionado.');
            }
            fetchData();
        } catch (error) {
            setToastMessage('Erro ao salvar o registro.');
            console.error("Save shepherding visit error:", error);
        } finally {
            handleCloseModal();
        }
    };

    const handleDelete = (visit: ShepherdingVisit) => {
        setVisitToDelete(visit);
    };

    const confirmDelete = async () => {
        if (visitToDelete && user) {
            try {
                await archiveShepherdingVisit(visitToDelete.id, user.uid);
                setToastMessage('Registro de pastoreio arquivado.');
                setVisitToDelete(null);
                fetchData();
            } catch (error) {
                setToastMessage('Erro ao arquivar o registro.');
                console.error("Archive shepherding visit error:", error);
            }
        }
    };

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Registros de Pastoreio</h2>
                <button onClick={() => handleOpenModal(null)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Criar
                </button>
            </div>
            
            {isLoading ? (
                <p className="text-center p-6">Carregando registros...</p>
            ) : (
                <div className="space-y-4">
                    {visits.length > 0 ? visits.map(visit => {
                        const visitDate = new Date(visit.date);
                        const today = new Date();
                        visitDate.setUTCHours(0,0,0,0);
                        today.setUTCHours(0,0,0,0);
                        const isPast = visitDate < today;
                        return (
                        <div key={visit.id} className={`bg-white dark:bg-slate-800 shadow-md rounded-lg transition-opacity ${isPast ? 'opacity-60' : ''}`}>
                            <div className="p-4 cursor-pointer" onClick={() => handleViewDetails(visit)}>
                                <p className="font-bold text-lg text-slate-900 dark:text-white">{visit.brotherName}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {new Date(visit.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })} às {visit.time}
                                </p>
                                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                    <p>Resp: {visit.responsibleElder1}</p>
                                    {visit.responsibleElder2 && <p>Resp 2: {visit.responsibleElder2}</p>}
                                </div>
                                {visit.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic truncate">Obs: {visit.notes}</p>}
                            </div>
                             <div className="flex items-center space-x-2 flex-shrink-0 border-t border-slate-100 dark:border-slate-700/50 px-4 py-2 justify-end">
                                <button onClick={() => handleOpenModal(visit)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                <button onClick={() => handleDelete(visit)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                            </div>
                        </div>
                    )}) : (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg">
                            Nenhum registro de pastoreio encontrado.
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <ShepherdingFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveVisit}
                    initialData={editingVisit}
                />
            )}

            <DetailedScheduleModal 
                schedule={viewingVisit}
                onClose={() => setViewingVisit(null)}
            />
            
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
            <ConfirmationModal
                isOpen={!!visitToDelete}
                onClose={() => setVisitToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Arquivamento"
                message={`Você tem certeza que deseja arquivar o registro de pastoreio para ${visitToDelete?.brotherName} de ${visitToDelete ? new Date(visitToDelete.date).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : ''}?`}
            />
        </div>
    );
};

export default Shepherding;
