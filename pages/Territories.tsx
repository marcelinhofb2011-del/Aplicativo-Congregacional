
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Territory, TerritoryStatus } from '../types';
import { getTerritories, updateTerritory as saveTerritoryUpdate } from '../services/firestoreService';
import TerritoryCard from '../components/TerritoryCard';
import TerritoryActionModal from '../components/TerritoryActionModal';
import Toast from '../components/Toast';

const Territories: React.FC = () => {
    const { user } = useAuth();
    const [territories, setTerritories] = useState<Territory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchTerritories();
    }, []);

    const fetchTerritories = async () => {
        setIsLoading(true);
        try {
            const data = await getTerritories();
            setTerritories(data);
        } catch (error) {
            console.error("Failed to fetch territories:", error);
            setToastMessage('Erro ao carregar territórios.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCardClick = (territory: Territory) => {
        setSelectedTerritory(territory);
    };
    
    const handleCloseModal = () => {
        setSelectedTerritory(null);
    };

    const updateTerritoryStateAndDB = async (id: string, updates: Partial<Territory>) => {
        try {
            await saveTerritoryUpdate(id, updates);
            // Optimistic update on client
            setTerritories(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        } catch(error) {
            console.error("Failed to update territory:", error);
            setToastMessage("Falha ao atualizar território.");
        } finally {
            handleCloseModal();
        }
    };

    const handleRequest = (territoryId: string, publisherName: string, expectedReturnDate: string, requestNotes?: string) => {
        const assignment = {
            publisherName,
            expectedReturnDate,
            requestNotes,
            checkoutDate: new Date().toISOString(), // Placeholder
        };
        updateTerritoryStateAndDB(territoryId, { status: TerritoryStatus.REQUESTED, assignment });
        setToastMessage(`Território ${territories.find(t=>t.id===territoryId)?.number} solicitado! Aguardando aprovação.`);
    };

    const handleApprove = (territoryId: string) => {
        const territory = territories.find(t => t.id === territoryId);
        if (!territory || !territory.assignment) return;
        
        const updatedAssignment = { ...territory.assignment, checkoutDate: new Date().toISOString() };
        updateTerritoryStateAndDB(territoryId, { status: TerritoryStatus.ASSIGNED, assignment: updatedAssignment });
        setToastMessage(`Território ${territory.number} designado com sucesso!`);
    };

    const handleReject = (territoryId: string) => {
        updateTerritoryStateAndDB(territoryId, { status: TerritoryStatus.AVAILABLE, assignment: undefined });
        setToastMessage(`Solicitação para o Território ${territories.find(t=>t.id===territoryId)?.number} foi rejeitada.`);
    };

    const handleReturn = (territoryId: string) => {
        updateTerritoryStateAndDB(territoryId, { status: TerritoryStatus.AVAILABLE, assignment: undefined });
        setToastMessage(`Território ${territories.find(t=>t.id===territoryId)?.number} devolvido e está livre.`);
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Controle de Territórios</h2>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                    Visualize o status, solicite ou gerencie os territórios da congregação.
                </p>
            </div>

            {isLoading ? <p>Carregando territórios...</p> : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {territories.sort((a,b) => a.number - b.number).map(territory => (
                        <TerritoryCard key={territory.id} territory={territory} onClick={handleCardClick} />
                    ))}
                </div>
            )}

            {selectedTerritory && (
                <TerritoryActionModal
                    isOpen={!!selectedTerritory}
                    onClose={handleCloseModal}
                    territory={selectedTerritory}
                    user={user}
                    onRequest={handleRequest}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onReturn={handleReturn}
                />
            )}
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </div>
    );
};

export default Territories;
