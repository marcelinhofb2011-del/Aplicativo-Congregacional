
import React, { useState, useEffect } from 'react';
import { Assignment, BaseRecord } from '../types';
import { XIcon } from './icons/Icons';

interface AssignmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<Assignment, 'id' | keyof BaseRecord>) => void;
    initialData: Assignment | null;
}

const BLANK_ASSIGNMENT: Omit<Assignment, 'id' | keyof BaseRecord> = {
    date: new Date().toISOString().split('T')[0],
    indicator1: '',
    indicator2: '',
    mic1: '',
    mic2: '',
    reader: '',
    audio: '',
    video: '',
    notes: ''
};

// Helper to prevent re-renders on input change
const FormField: React.FC<{
    name: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ name, label, value, onChange }) => (
     <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="input-style"
        placeholder={label}
     />
);

const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(BLANK_ASSIGNMENT);

    useEffect(() => {
        if (initialData) {
            setFormData({
                date: new Date(initialData.date).toISOString().split('T')[0],
                indicator1: initialData.indicator1 || '',
                indicator2: initialData.indicator2 || '',
                mic1: initialData.mic1 || '',
                mic2: initialData.mic2 || '',
                reader: initialData.reader || '',
                audio: initialData.audio || '',
                video: initialData.video || '',
                notes: initialData.notes || ''
            });
        } else {
            setFormData(BLANK_ASSIGNMENT);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const hasAssignment = formData.indicator1 || formData.indicator2 || formData.mic1 || formData.mic2 || formData.reader || formData.audio || formData.video;
        if (!hasAssignment) {
            alert('Preencha pelo menos uma designação.');
            return;
        }
        
        const dataToSave: Omit<Assignment, 'id' | keyof BaseRecord> = {
            date: new Date(formData.date).toISOString(),
            indicator1: formData.indicator1 || '',
            indicator2: formData.indicator2 || '',
            mic1: formData.mic1 || '',
            mic2: formData.mic2 || '',
            reader: formData.reader || '',
            audio: formData.audio || '',
            video: formData.video || '',
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
                            {initialData ? 'Editar Designações' : 'Novas Designações'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="input-style" />
                        </div>
                        
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Indicadores 👤</label>
                            <div className="grid grid-cols-2 gap-2">
                                <FormField name="indicator1" label="Nome" value={formData.indicator1} onChange={handleInputChange} />
                                <FormField name="indicator2" label="Nome" value={formData.indicator2} onChange={handleInputChange} />
                            </div>
                        </div>

                         <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Microfones 🎤</label>
                            <div className="grid grid-cols-2 gap-2">
                                <FormField name="mic1" label="Nome" value={formData.mic1} onChange={handleInputChange} />
                                <FormField name="mic2" label="Nome" value={formData.mic2} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="block text-sm font-medium">Leitor 📖</label>
                                <FormField name="reader" label="Nome" value={formData.reader} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-medium">Áudio 🎶</label>
                                <FormField name="audio" label="Nome" value={formData.audio} onChange={handleInputChange} />
                            </div>
                        </div>
                         <div className="space-y-3">
                            <label className="block text-sm font-medium">Vídeo 🖥️</label>
                            <FormField name="video" label="Nome" value={formData.video} onChange={handleInputChange} />
                         </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                            <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} className="input-style"></textarea>
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

export default AssignmentFormModal;
