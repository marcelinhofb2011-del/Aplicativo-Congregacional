
import React, { useState, useEffect } from 'react';
import { ConductorMeeting, BaseRecord } from '../types';
import { XIcon } from './icons/Icons';

interface ConductorsFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<ConductorMeeting, 'id' | keyof BaseRecord>) => void;
    initialData: ConductorMeeting | null;
}

const BLANK_MEETING: Omit<ConductorMeeting, 'id' | keyof BaseRecord> = {
    date: new Date().toISOString().split('T')[0],
    conductorName: '',
    notes: ''
};

const ConductorsFormModal: React.FC<ConductorsFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(BLANK_MEETING);
    const [dayOfWeek, setDayOfWeek] = useState('');

    useEffect(() => {
        setFormData(initialData ? {
            date: new Date(initialData.date).toISOString().split('T')[0],
            conductorName: initialData.conductorName,
            notes: initialData.notes || ''
        } : BLANK_MEETING);
    }, [initialData, isOpen]);

    useEffect(() => {
        if (formData.date) {
            const date = new Date(`${formData.date}T00:00:00Z`);
            const day = date.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' });
            setDayOfWeek(day.charAt(0).toUpperCase() + day.slice(1));
        } else {
            setDayOfWeek('');
        }
    }, [formData.date]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.conductorName || !formData.date) return;

        const dataToSave: Omit<ConductorMeeting, 'id' | keyof BaseRecord> = {
            date: new Date(formData.date).toISOString(),
            conductorName: formData.conductorName,
            notes: formData.notes || ''
        };
        onSave(dataToSave);
    };

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {initialData ? 'Editar Dirigente' : 'Adicionar Dirigente'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data / Dia da Semana</label>
                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="input-style" />
                            {dayOfWeek && <p className="text-xs text-slate-500 mt-1">{dayOfWeek}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Dirigente</label>
                            <input type="text" name="conductorName" value={formData.conductorName} onChange={handleInputChange} required className="input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                            <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={2} className="input-style"></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 pb-8">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 mr-3">
                            Cancelar
                        </button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-dark">
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ConductorsFormModal;
