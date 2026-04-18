
import React, { useState, useEffect } from 'react';
import { FirstSundayConductor } from '../types';
import { XIcon } from './icons/Icons';

interface FirstSundayConductorsFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<FirstSundayConductor, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => void;
    initialData: FirstSundayConductor | null;
}

const FirstSundayConductorsFormModal: React.FC<FirstSundayConductorsFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [month, setMonth] = useState('');
    const [date, setDate] = useState('');
    const [conductorName, setConductorName] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (initialData) {
            setMonth(initialData.month);
            setDate(initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '');
            setConductorName(initialData.conductorName);
            setNotes(initialData.notes || '');
        } else {
            // Default to current month
            const now = new Date();
            setMonth(now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }));
            
            // Find first Sunday of current month
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const firstSunday = new Date(firstDay);
            firstSunday.setDate(1 + (7 - firstDay.getDay()) % 7);
            setDate(firstSunday.toISOString().split('T')[0]);
            
            setConductorName('');
            setNotes('');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            month,
            date: new Date(date).toISOString(),
            conductorName,
            notes
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden pb-10 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {initialData ? 'Editar Dirigente' : 'Novo Dirigente do 1º Domingo'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <XIcon className="h-6 w-6 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg mb-2">
                        <span className="font-semibold">Hoje:</span>
                        <span>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mês e Ano</label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: Janeiro 2026"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data do Domingo</label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Dirigente</label>
                        <input
                            type="text"
                            required
                            placeholder="Nome do irmão"
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                            value={conductorName}
                            onChange={(e) => setConductorName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações (Opcional)</label>
                        <textarea
                            rows={3}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FirstSundayConductorsFormModal;
