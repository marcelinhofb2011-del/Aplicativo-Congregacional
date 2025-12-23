
import React, { useState, useEffect, useMemo } from 'react';
import { BusTicket, BusTicketStatus, ExtraPerson } from '../types';
import { XIcon } from './icons/Icons';

interface BusTicketFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (ticket: BusTicket) => void;
    initialData: BusTicket | null;
}

const BLANK_TICKET: Omit<BusTicket, 'id' | 'saleDate'> = {
    name: '',
    document: '',
    totalPeople: 1,
    days: [],
    unitPrice: 50,
    extraPeople: [],
    totalAmount: 0,
    amountPaid: 0,
    change: 0,
    paymentMethod: '',
    status: BusTicketStatus.RESERVED,
    event: '',
    notes: ''
};

const BusTicketFormModal: React.FC<BusTicketFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(BLANK_TICKET);
    
    useEffect(() => {
        setFormData(initialData || BLANK_TICKET);
    }, [initialData, isOpen]);
    
    // Auto-calculate total and change
    useEffect(() => {
        const totalAmount = (formData.totalPeople || 0) * (formData.days?.length || 0) * (formData.unitPrice || 0);
        const change = (formData.amountPaid || 0) > totalAmount ? (formData.amountPaid || 0) - totalAmount : 0;
        
        if (formData.totalAmount !== totalAmount || formData.change !== change) {
             setFormData(prev => ({ ...prev, totalAmount, change }));
        }
    }, [formData.totalPeople, formData.days, formData.unitPrice, formData.amountPaid]);


    if (!isOpen) return null;

    const handleDayChange = (day: 'Sexta' | 'Sábado' | 'Domingo') => {
        const newDays = formData.days.includes(day)
            ? formData.days.filter(d => d !== day)
            : [...formData.days, day];
        setFormData(prev => ({ ...prev, days: newDays as ('Sexta' | 'Sábado' | 'Domingo')[] }));
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumberField = ['totalPeople', 'unitPrice', 'amountPaid'].includes(name);

        if (isNumberField) {
            let numericValue;
            if (name === 'totalPeople') {
                numericValue = value === '' ? 0 : parseInt(value, 10);
            } else {
                numericValue = value === '' ? 0 : parseFloat(value);
            }

            if (isNaN(numericValue)) {
                return; // Ignore non-numeric or invalid input like "5.5.5"
            }

            if (name === 'totalPeople') {
                setFormData(prev => {
                    const numExtra = Math.max(0, numericValue - 1);
                    let extraPeople: ExtraPerson[] = [];
                    if (numExtra > 0) {
                        const currentExtra = prev.extraPeople;
                        extraPeople = Array.from({ length: numExtra }, (_, i) => 
                            currentExtra[i] || { id: crypto.randomUUID(), name: '', document: '' }
                        );
                    }
                    return { ...prev, totalPeople: numericValue, extraPeople };
                });
            } else {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleExtraPersonChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const updatedExtra = [...formData.extraPeople];
        updatedExtra[index] = { ...updatedExtra[index], [name]: value };
        setFormData(prev => ({...prev, extraPeople: updatedExtra}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
         if (formData.totalPeople < 1) {
            alert('A quantidade de pessoas deve ser de pelo menos 1.');
            return;
        }
        const finalTicket: BusTicket = {
            id: initialData?.id || crypto.randomUUID(),
            saleDate: initialData?.saleDate || new Date().toISOString(),
            ...formData,
        };
        onSave(finalTicket);
    };

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto p-4" onClick={onClose}>
            <div className="container mx-auto max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold">{initialData ? 'Editar' : 'Nova'} Passagem</h2>
                        <button type="button" onClick={onClose}><XIcon className="h-6 w-6" /></button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Main Passenger */}
                        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Nome</label><input name="name" value={formData.name} onChange={handleInputChange} required className="input-style" /></div>
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Documento</label><input name="document" value={formData.document} onChange={handleInputChange} className="input-style" /></div>
                        </fieldset>

                        {/* Trip Details */}
                        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Qtde Pessoas</label><input name="totalPeople" type="number" min="1" value={formData.totalPeople || ''} onChange={handleInputChange} className="input-style" /></div>
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Valor Unitário</label><input name="unitPrice" type="number" step="0.01" min="0" value={formData.unitPrice || ''} onChange={handleInputChange} className="input-style" /></div>
                        </fieldset>
                        
                        {/* Event and Days */}
                        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start md:items-end">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Evento</label>
                                <select name="event" value={formData.event || ''} onChange={handleInputChange} className="input-style">
                                    <option value="">Selecione o Evento</option>
                                    <option value="Assembleia">Assembleia</option>
                                    <option value="Congresso">Congresso</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Dias</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['Sexta', 'Sábado', 'Domingo'].map(d => (
                                        <button type="button" key={d} onClick={() => handleDayChange(d as any)} className={`px-3 py-1 text-sm rounded-full ${formData.days.includes(d as any) ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{d}</button>
                                    ))}
                                </div>
                            </div>
                        </fieldset>
                        
                        {/* Extra Passengers */}
                        {formData.extraPeople.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-slate-700 dark:text-slate-300">Pessoas Extras</h4>
                                {formData.extraPeople.map((person, index) => (
                                    <div key={person.id} className="grid grid-cols-2 gap-2">
                                        <input name="name" value={person.name} onChange={e => handleExtraPersonChange(index, e)} placeholder={`Nome ${index + 2}`} className="input-style"/>
                                        <input name="document" value={person.document} onChange={e => handleExtraPersonChange(index, e)} placeholder={`Documento ${index + 2}`} className="input-style"/>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Payment Details */}
                        <fieldset className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Valor Total</label><p className="font-bold text-lg">R$ {formData.totalAmount.toFixed(2)}</p></div>
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Valor Recebido</label><input name="amountPaid" type="number" step="0.01" min="0" value={formData.amountPaid || ''} onChange={handleInputChange} className="input-style" /></div>
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Troco</label><p className="font-bold text-lg">R$ {formData.change.toFixed(2)}</p></div>
                             <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Status</label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className="input-style">
                                    <option value={BusTicketStatus.RESERVED}>Reserva</option>
                                    <option value={BusTicketStatus.PARTIAL}>Parcial</option>
                                    <option value={BusTicketStatus.PAID}>Pago</option>
                                </select>
                            </div>
                            <div className="col-span-2 md:col-span-4">
                               <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Forma de Pagamento</label>
                               <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className="input-style">
                                    <option value="">Selecione</option>
                                    <option value="PIX">PIX</option>
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="Cartão">Cartão</option>
                               </select>
                           </div>
                        </fieldset>

                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Observação</label>
                            <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={2} className="input-style"></textarea>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                        <button type="submit" className="px-6 py-3 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark">
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BusTicketFormModal;
