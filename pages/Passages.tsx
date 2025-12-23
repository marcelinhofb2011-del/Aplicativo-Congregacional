
import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { BusTicket, BusTicketStatus } from '../types';
import { getBusTickets, addBusTicket, updateBusTicket, deleteBusTicket } from '../services/firestoreService';
import { PlusIcon } from '../components/icons/Icons';
import BusTicketCard from '../components/BusTicketCard';
import BusTicketFormModal from '../components/BusTicketFormModal';
import BusTicketReceiptModal from '../components/BusTicketReceiptModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';

const Passages: React.FC = () => {
    const [tickets, setTickets] = useState<BusTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTicket, setEditingTicket] = useState<BusTicket | null>(null);
    const [viewingReceipt, setViewingReceipt] = useState<BusTicket | null>(null);
    const [ticketToDelete, setTicketToDelete] = useState<BusTicket | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const data = await getBusTickets();
            setTickets(data);
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
            setToastMessage("Erro ao carregar passagens.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleOpenForm = (ticket: BusTicket | null) => {
        setEditingTicket(ticket);
        setIsFormOpen(true);
    };
    
    const handleCloseForm = () => {
        setEditingTicket(null);
        setIsFormOpen(false);
    };
    
    const handleSaveTicket = async (ticketData: BusTicket) => {
        try {
            if (editingTicket) {
                await updateBusTicket(ticketData.id, ticketData);
                setToastMessage('Passagem atualizada com sucesso!');
            } else {
                const { id, ...newTicketData } = ticketData;
                await addBusTicket(newTicketData);
                setToastMessage('Passagem salva com sucesso!');
            }
            fetchTickets(); // Refetch to get updated list
        } catch (error) {
            console.error("Failed to save ticket:", error);
            setToastMessage("Erro ao salvar passagem.");
        } finally {
            handleCloseForm();
        }
    };
    
    const handleDeleteClick = (ticket: BusTicket) => {
        setTicketToDelete(ticket);
    };

    const handleConfirmDelete = async () => {
        if (!ticketToDelete) return;
        try {
            await deleteBusTicket(ticketToDelete.id);
            setToastMessage('Passagem excluída com sucesso!');
            fetchTickets();
        } catch (error) {
            console.error("Failed to delete ticket:", error);
            setToastMessage("Erro ao excluir passagem.");
        } finally {
            setTicketToDelete(null);
        }
    };

    const handleExportExcel = () => {
        const dataToExport = tickets.map(t => ({
            'Data': new Date(t.saleDate).toLocaleDateString('pt-BR'),
            'Nome': t.name,
            'Documento': t.document,
            'Evento': t.event || '',
            'Pessoas': t.totalPeople,
            'Dias': t.days.join(', '),
            'Valor Total': t.totalAmount.toFixed(2),
            'Valor Pago': t.amountPaid.toFixed(2),
            'Status': t.status,
            'Método Pagamento': t.paymentMethod,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Passagens");
        XLSX.writeFile(workbook, "Relatorio_Passagens.xlsx");
    };

    const summary = useMemo(() => {
        return tickets.reduce((acc, ticket) => {
            acc.totalSold += ticket.totalPeople;
            acc.totalAmount += ticket.totalAmount;
            acc.totalPaid += ticket.amountPaid;
            return acc;
        }, { totalSold: 0, totalAmount: 0, totalPaid: 0 });
    }, [tickets]);

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciamento de Passagens</h2>
                <div className="flex gap-2">
                     <button onClick={handleExportExcel} className="px-4 py-3 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200">
                        Exportar Excel
                    </button>
                    <button onClick={() => handleOpenForm(null)} className="inline-flex items-center px-4 py-3 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Adicionar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow"><p className="text-sm text-slate-500">Total de Passagens</p><p className="text-2xl font-bold">{summary.totalSold}</p></div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow"><p className="text-sm text-slate-500">Valor Total</p><p className="text-2xl font-bold">R$ {summary.totalAmount.toFixed(2)}</p></div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow"><p className="text-sm text-slate-500">Total Recebido</p><p className="text-2xl font-bold">R$ {summary.totalPaid.toFixed(2)}</p></div>
            </div>

            {isLoading ? <p>Carregando passagens...</p> : (
                <div className="space-y-4">
                    {tickets.map(ticket => (
                        <BusTicketCard 
                            key={ticket.id} 
                            ticket={ticket} 
                            onEdit={() => handleOpenForm(ticket)}
                            onViewReceipt={() => setViewingReceipt(ticket)}
                            onDelete={() => handleDeleteClick(ticket)}
                        />
                    ))}
                </div>
            )}

            {isFormOpen && (
                <BusTicketFormModal
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    onSave={handleSaveTicket}
                    initialData={editingTicket}
                />
            )}
            
            <BusTicketReceiptModal
                isOpen={!!viewingReceipt}
                onClose={() => setViewingReceipt(null)}
                ticket={viewingReceipt}
            />

            <ConfirmationModal
                isOpen={!!ticketToDelete}
                onClose={() => setTicketToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message={`Você tem certeza que deseja excluir permanentemente a passagem de ${ticketToDelete?.name}? Esta ação não pode ser desfeita.`}
            />

            <Toast message={toastMessage} onClear={() => setToastMessage('')}/>
        </div>
    );
};

export default Passages;
