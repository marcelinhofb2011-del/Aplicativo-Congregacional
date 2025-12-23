
import React from 'react';
import { BusTicket, BusTicketStatus } from '../types';
import { PencilIcon, TrashIcon } from './icons/Icons';

interface BusTicketCardProps {
    ticket: BusTicket;
    onEdit: () => void;
    onViewReceipt: () => void;
    onDelete: () => void;
}

const statusConfig = {
    [BusTicketStatus.PAID]: { label: 'Pago', style: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
    [BusTicketStatus.PARTIAL]: { label: 'Parcial', style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
    [BusTicketStatus.RESERVED]: { label: 'Reserva', style: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
};

const BusTicketCard: React.FC<BusTicketCardProps> = ({ ticket, onEdit, onViewReceipt, onDelete }) => {
    const config = statusConfig[ticket.status];
    
    return (
        <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-4 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{ticket.name}</h3>
                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${config.style}`}>{config.label}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{ticket.document}</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    {ticket.totalPeople} pessoa(s) | Dias: {ticket.days.join(', ')}
                </p>
            </div>
            <div className="flex justify-between items-end mt-4">
                <div>
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="font-bold text-xl text-primary">R$ {ticket.totalAmount.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={onViewReceipt} className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20">
                        Recibo
                    </button>
                    <button onClick={onEdit} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                    <button onClick={onDelete} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                </div>
            </div>
        </div>
    );
};

export default BusTicketCard;
