
import React, { useState, useEffect } from 'react';
import { ShepherdingVisit, BaseRecord } from '../types';
import { XIcon } from './icons/Icons';

interface ShepherdingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<ShepherdingVisit, 'id' | keyof BaseRecord>) => void;
    initialData: ShepherdingVisit | null;
}

const BLANK_VISIT: Omit<ShepherdingVisit, 'id' | keyof BaseRecord> = {
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    brotherName: '',
    responsibleElder1: '',
    responsibleElder2: '',
    notes: ''
};

const ShepherdingFormModal: React.FC<ShepherdingFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(BLANK_VISIT);
    const [dayOfWeek, setDayOfWeek] = useState('');

    useEffect(() => {
        if (initialData) {
            // Handle potential old data structure for backward compatibility
            const data: Omit<ShepherdingVisit, 'id' | keyof BaseRecord> = {
                date: new Date(initialData.date).toISOString().split('T')[0],
                time: initialData.time || '19:00',
                brotherName: initialData.brotherName,
                responsibleElder1: (initialData as any).responsibleElder1 || (initialData as any).responsibleElder || '',
                responsibleElder2: (initialData as any).responsibleElder2 || '',
                notes: initialData.notes || ''
            };
            setFormData(data);
        } else {
            setFormData(BLANK_VISIT);
        }
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
        if (!formData.brotherName || !formData.date || !formData.time || !formData.responsibleElder1) {
             alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const dataToSave: Omit<ShepherdingVisit, 'id' | keyof BaseRecord> = {
            date: new Date(formData.date).toISOString(),
            time: formData.time,
            brotherName: formData.brotherName,
            responsibleElder1: formData.responsibleElder1,
            responsibleElder2: formData.responsibleElder2 || '',
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
                            {initialData ? 'Editar Registro' : 'Novo Registro'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data / Dia da semana</label>
                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="input-style" />
                                {dayOfWeek && <p className="text-xs text-slate-500 mt-1">{dayOfWeek}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horas</label>
                                <input type="time" name="time" value={formData.time} onChange={handleInputChange} required className="input-style" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Irmão(s) a ser(em) visitado(s)</label>
                            <input type="text" name="brotherName" value={formData.brotherName} onChange={handleInputChange} required className="input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Irmãos Responsáveis</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                <input type="text" name="responsibleElder1" value={formData.responsibleElder1} onChange={handleInputChange} required className="input-style" placeholder="Nome" />
                                <input type="text" name="responsibleElder2" value={formData.responsibleElder2 || ''} onChange={handleInputChange} className="input-style" placeholder="Nome (opcional)" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                            <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={3} className="input-style"></textarea>
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
export default ShepherdingFormModal;
