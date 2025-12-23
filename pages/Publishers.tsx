
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PublisherProfile } from '../types';
import { getPublisherProfiles, addPublisherProfile, updatePublisherProfile, archivePublisherProfile } from '../services/firestoreService';
import { PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon } from '../components/icons/Icons';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import PublisherFormModal from '../components/PublisherFormModal';
import PublisherDetailModal from '../components/details/PublisherDetailModal';
import PublisherPDFModal from '../components/PublisherPDFModal';


const Publishers: React.FC = () => {
    const { user } = useAuth();
    const [publishers, setPublishers] = useState<PublisherProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [selectedPublisher, setSelectedPublisher] = useState<PublisherProfile | null>(null);
    const [publisherToDelete, setPublisherToDelete] = useState<PublisherProfile | null>(null);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getPublisherProfiles();
            setPublishers(data);
        } catch (error) {
            console.error("Failed to fetch publishers:", error);
            setToastMessage('Erro ao carregar publicadores.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddClick = () => {
        setSelectedPublisher(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (publisher: PublisherProfile) => {
        setSelectedPublisher(publisher);
        setIsDetailOpen(false); // Close detail view
        setIsFormOpen(true); // Open form view
    };
    
    const handleViewDetails = (publisher: PublisherProfile) => {
        setSelectedPublisher(publisher);
        setIsDetailOpen(true);
    };
    
    const handleDeleteClick = (publisher: PublisherProfile) => {
        setPublisherToDelete(publisher);
    }
    
    const handleCloseModals = () => {
        setIsFormOpen(false);
        setIsDetailOpen(false);
        setSelectedPublisher(null);
    };
    
    const handleSave = async (data: Omit<PublisherProfile, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!user) {
            setToastMessage('Erro: Usuário não autenticado.');
            return;
        }
        try {
            if (selectedPublisher) {
                await updatePublisherProfile(selectedPublisher.id, data, user.uid);
                setToastMessage('Publicador atualizado com sucesso!');
            } else {
                await addPublisherProfile(data, user.uid);
                setToastMessage('Publicador adicionado com sucesso!');
            }
            fetchData();
        } catch (error) {
            console.error("Failed to save publisher:", error);
            setToastMessage('Erro ao salvar publicador.');
        } finally {
            handleCloseModals();
        }
    };

    const handleConfirmDelete = async () => {
        if (publisherToDelete && user) {
            try {
                await archivePublisherProfile(publisherToDelete.id, user.uid);
                setToastMessage('Publicador arquivado com sucesso.');
                fetchData();
            } catch (error) {
                setToastMessage('Erro ao arquivar publicador.');
            } finally {
                setPublisherToDelete(null);
            }
        }
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pasta de Publicadores</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setIsPdfModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        Gerar PDF
                    </button>
                    <button
                        onClick={handleAddClick}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Adicionar
                    </button>
                </div>
            </div>

            {isLoading ? (
                <p>Carregando...</p>
            ) : (
                <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {publishers.length > 0 ? publishers.map(pub => (
                            <li key={pub.id} className="p-4 flex justify-between items-center">
                                <div onClick={() => handleViewDetails(pub)} className="cursor-pointer flex-grow">
                                    <p className="font-semibold text-slate-900 dark:text-white">{pub.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Grupo: {pub.group}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleEditClick(pub)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handleDeleteClick(pub)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                                </div>
                            </li>
                        )) : (
                            <li className="p-6 text-center text-slate-500">Nenhum publicador cadastrado.</li>
                        )}
                    </ul>
                </div>
            )}
            
            {isFormOpen && (
                <PublisherFormModal 
                    isOpen={isFormOpen}
                    onClose={handleCloseModals}
                    onSave={handleSave}
                    initialData={selectedPublisher}
                />
            )}
            
            {isDetailOpen && selectedPublisher && (
                <PublisherDetailModal 
                    isOpen={isDetailOpen}
                    onClose={handleCloseModals}
                    onEdit={handleEditClick}
                    publisher={selectedPublisher}
                />
            )}

            <PublisherPDFModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                publishers={publishers}
            />

            <ConfirmationModal 
                isOpen={!!publisherToDelete}
                onClose={() => setPublisherToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Arquivamento"
                message={`Tem certeza que deseja arquivar o registro de ${publisherToDelete?.name}?`}
            />

            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </div>
    );
};

export default Publishers;
