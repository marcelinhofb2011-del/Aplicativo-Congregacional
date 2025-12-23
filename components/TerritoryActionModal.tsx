
import React, { useState, useEffect } from 'react';
import { Territory, TerritoryStatus, User, UserRole } from '../types';
import { XIcon } from './icons/Icons';

interface TerritoryActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    territory: Territory;
    user: User | null;
    onRequest: (territoryId: string, publisherName: string, expectedReturnDate: string, requestNotes?: string) => void;
    onApprove: (territoryId: string) => void;
    onReject: (territoryId: string) => void;
    onReturn: (territoryId: string) => void;
}

const TerritoryActionModal: React.FC<TerritoryActionModalProps> = ({ isOpen, onClose, territory, user, onRequest, onApprove, onReject, onReturn }) => {
    const [publisherName, setPublisherName] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (territory) {
            // Pre-fill form for convenience
            setPublisherName(user?.email || '');
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            setReturnDate(futureDate.toISOString().split('T')[0]);
            setNotes('');
        }
    }, [territory, user]);

    if (!isOpen || !user) return null;

    const handleRequestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRequest(territory.id, publisherName, new Date(returnDate).toISOString(), notes);
    };

    const isServant = user.role === UserRole.SERVANT;

    const renderContent = () => {
        // Servant view of Assigned territory
        if (isServant && territory.status === TerritoryStatus.ASSIGNED && territory.assignment) {
            return (
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Território Designado</h3>
                    <div className="mt-4 space-y-3 text-sm">
                        <p><span className="font-semibold">Irmão:</span> {territory.assignment.publisherName}</p>
                        <p><span className="font-semibold">Retirada:</span> {new Date(territory.assignment.checkoutDate).toLocaleDateString('pt-BR')}</p>
                        <p><span className="font-semibold">Devolução Prevista:</span> {new Date(territory.assignment.expectedReturnDate).toLocaleDateString('pt-BR')}</p>
                        {territory.assignment.requestNotes && <p><span className="font-semibold">Observação:</span> {territory.assignment.requestNotes}</p>}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button onClick={() => onReturn(territory.id)} className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700">
                            Marcar como Devolvido
                        </button>
                    </div>
                </div>
            );
        }
        // Servant view of Requested territory
        if (isServant && territory.status === TerritoryStatus.REQUESTED && territory.assignment) {
            return (
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Analisar Solicitação</h3>
                    <div className="mt-4 space-y-3 text-sm">
                        <p><span className="font-semibold">Solicitante:</span> {territory.assignment.publisherName}</p>
                        <p><span className="font-semibold">Devolução Prevista:</span> {new Date(territory.assignment.expectedReturnDate).toLocaleDateString('pt-BR')}</p>
                        {territory.assignment.requestNotes && <p><span className="font-semibold">Observação:</span> {territory.assignment.requestNotes}</p>}
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button onClick={() => onReject(territory.id)} className="px-5 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700">
                            Rejeitar
                        </button>
                        <button onClick={() => onApprove(territory.id)} className="px-5 py-2.5 bg-primary text-white rounded-md hover:bg-primary-dark">
                            Aprovar
                        </button>
                    </div>
                </div>
            );
        }
        // Publisher view to Request
        if (territory.status === TerritoryStatus.AVAILABLE) {
            return (
                <form onSubmit={handleRequestSubmit}>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Solicitar Território {territory.number}</h3>
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Seu Nome</label>
                            <input type="text" value={publisherName} onChange={e => setPublisherName(e.target.value)} required className="input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data prevista de devolução</label>
                            <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} required className="input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observação (opcional)</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="input-style"></textarea>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-md hover:bg-primary-dark">
                            Enviar Solicitação
                        </button>
                    </div>
                </form>
            );
        }
        
        // Fallback for non-actionable states
        return <p>Este território não pode ser solicitado no momento.</p>;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-end">
                         <button onClick={onClose}><XIcon className="h-6 w-6 text-slate-500" /></button>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default TerritoryActionModal;