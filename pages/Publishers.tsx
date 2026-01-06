
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PublisherProfile, PublisherStatus } from '../types';
import { getPublisherProfiles, addPublisherProfile, updatePublisherProfile, archivePublisherProfile } from '../services/firestoreService';
import { PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon } from '../components/icons/Icons';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import PublisherFormModal from '../components/PublisherFormModal';
import PublisherDetailModal from '../components/details/PublisherDetailModal';
import PublisherPDFModal from '../components/PublisherPDFModal';


const statusConfig: Record<PublisherStatus, { label: string, style: string }> = {
    [PublisherStatus.ACTIVE]: { label: 'Ativo', style: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
    [PublisherStatus.REGULAR]: { label: 'Regular', style: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
    [PublisherStatus.IRREGULAR]: { label: 'Irregular', style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
    [PublisherStatus.INACTIVE]: { label: 'Inativo', style: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' },
};


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
        <>
            <div className="sticky top-0 z-10 bg-[#65a30d] p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Pasta de Publicadores</h2>
                        <p className="mt-1 text-lime-100">Gerencie os perfis de todos os publicadores.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsPdfModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-white/20 hover:bg-white/30"
                        >
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            Gerar PDF
                        </button>
                        <button
                            onClick={handleAddClick}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-white/20 hover:bg-white/30"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Adicionar
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
                {isLoading ? (
                    <p>Carregando...</p>
                ) : (
                    <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
                        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                            {publishers.length > 0 ? publishers.map(pub => {
                                 const config = statusConfig[pub.status || PublisherStatus.ACTIVE];
                                 return (
                                <li key={pub.id} className="p-4 flex justify-between items-center">
                                    <div onClick={() => handleViewDetails(pub)} className="cursor-pointer flex-grow">
                                        <p className="font-semibold text-slate-900 dark:text-white">{pub.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                             <p className="text-sm text-slate-500 dark:text-slate-400">Grupo: {pub.group}</p>
                                             {config && (
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.style}`}>
                                                    {config.label}
                                                </span>
                                             )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => handleEditClick(pub)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                        <button onClick={() => handleDeleteClick(pub)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                                    </div>
                                </li>
                            )}) : (
                                <li className="p-6 text-center text-slate-500">Nenhum publicador cadastrado.</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
            
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
        </>
    );
};

export default Publishers;
