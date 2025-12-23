
import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { BusTicket } from '../types';
import { XIcon } from './icons/Icons';

interface BusTicketReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: BusTicket | null;
}

const BusTicketReceiptModal: React.FC<BusTicketReceiptModalProps> = ({ isOpen, ticket, onClose }) => {
    const [isSharing, setIsSharing] = useState(false);

    if (!isOpen || !ticket) return null;

    const handlePrint = () => {
        const printContentsNode = document.getElementById('printable-receipt');
        if (!printContentsNode) return;

        const printWindow = window.open('', '_blank', 'height=800,width=600');
        if (!printWindow) {
            alert('Por favor, permita pop-ups para imprimir o recibo.');
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Recibo</title>
                    ${document.head.innerHTML}
                </head>
                <body>
                    ${printContentsNode.innerHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.onload = () => { // Wait for the content to load
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    };

    const shareAsText = () => {
        let text = `*Recibo - Passagem de Ônibus*\n\n`;
        text += `*Nome:* ${ticket.name}\n`;
        text += `*Documento:* ${ticket.document}\n`;
        if (ticket.event) {
            text += `*Evento:* ${ticket.event}\n`;
        }
        text += `*Dias:* ${ticket.days.join(', ')}\n`;
        text += `*Pessoas:* ${ticket.totalPeople}\n\n`;
        text += `*Valor Total: R$ ${ticket.totalAmount.toFixed(2)}*\n`;
        text += `*Status:* ${ticket.status}\n\n`;
        text += `Obrigado!`;
        
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const handleShare = async () => {
        // The element to capture is the parent of the printable area, which has the background and styling.
        const receiptContentElement = document.getElementById('printable-receipt')?.parentElement;
        if (!receiptContentElement) {
            shareAsText(); // Fallback if element not found
            return;
        }

        // Use fallback for browsers that don't support the Web Share API
        if (!navigator.share) {
            shareAsText();
            return;
        }
        
        setIsSharing(true);
        try {
            const canvas = await html2canvas(receiptContentElement, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                // Capture the element as is, including its background color (light or dark)
                backgroundColor: null, 
                // We need to capture the whole modal content, so we ignore the print-specific styles for capture
                ignoreElements: (element) => false,
            });

            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));

            if (!blob) {
                throw new Error("Falha ao criar a imagem do recibo.");
            }

            const file = new File([blob], 'recibo-passagem.png', { type: 'image/png' });
            const shareData = {
                files: [file],
                title: 'Recibo de Passagem',
                text: `Recibo para ${ticket.name}`,
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                console.log("Compartilhamento de arquivo não suportado, usando texto.");
                shareAsText();
            }

        } catch (err) {
            // Don't show error if user cancels the share sheet
            if ((err as Error).name !== 'AbortError') {
                console.error("Erro ao compartilhar:", err);
                shareAsText(); // Fallback on any other error
            }
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md flex flex-col">
                <div id="printable-receipt">
                     <style>{`
                        @media print { 
                            body { -webkit-print-color-adjust: exact; color-adjust: exact; }
                            .no-print { display: none !important; } 
                            .printable-area { padding: 1rem; }
                            .print-header { color: #3b82f6 !important; }
                        }
                    `}</style>
                    <div className="p-6 printable-area">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-primary print-header">Recibo de Passagem</h2>
                            <p className="text-sm text-slate-500">Data da Venda: {new Date(ticket.saleDate).toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="space-y-3 text-sm border-t border-b border-dashed py-4">
                            <div className="flex justify-between"><span className="text-slate-500">Nome:</span><span className="font-semibold">{ticket.name}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Documento:</span><span>{ticket.document}</span></div>
                            {ticket.event && <div className="flex justify-between"><span className="text-slate-500">Evento:</span><span className="font-semibold">{ticket.event}</span></div>}
                            <div className="flex justify-between"><span className="text-slate-500">Dias:</span><span>{ticket.days.join(', ')}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Pessoas:</span><span>{ticket.totalPeople}</span></div>
                        </div>
                         {ticket.extraPeople.length > 0 && (
                            <div className="py-4 border-b border-dashed">
                                <h4 className="text-sm text-slate-500 mb-2">Acompanhantes:</h4>
                                <ul className="text-sm space-y-1">
                                    {ticket.extraPeople.map(p => <li key={p.id}>{p.name} ({p.document})</li>)}
                                </ul>
                            </div>
                         )}
                        <div className="space-y-3 pt-4 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Total:</span><span className="font-semibold">R$ {ticket.totalAmount.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Pago:</span><span>R$ {ticket.amountPaid.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Troco:</span><span>R$ {ticket.change.toFixed(2)}</span></div>
                             <div className="flex justify-between text-base pt-2 font-bold"><span className="text-slate-500">Status:</span><span className="text-primary">{ticket.status}</span></div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-between rounded-b-lg no-print">
                    <button onClick={handlePrint} className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300">Imprimir/PDF</button>
                    <button onClick={handleShare} disabled={isSharing} className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed">
                        {isSharing ? 'Gerando...' : 'Compartilhar'}
                    </button>
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default BusTicketReceiptModal;
