import React, { useState, useEffect } from 'react';
import { Assignment, BaseRecord } from '../types';
import { XIcon } from './icons/Icons';

interface AssignmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<Assignment, 'id' | keyof BaseRecord>) => void;
    initialData: Assignment | null;
}

type RoleField = 'president' | 'indicator1' | 'indicator2' | 'mic1' | 'mic2' | 'reader' | 'audio' | 'video';

const BLANK_ASSIGNMENT_STATE: Record<RoleField, string> & { date: string; notes: string; } = {
    date: new Date().toISOString().split('T')[0],
    president: '',
    indicator1: '', indicator2: '', mic1: '', mic2: '',
    reader: '', audio: '', video: '', notes: ''
};

const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(BLANK_ASSIGNMENT_STATE);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    date: new Date(initialData.date).toISOString().split('T')[0],
                    president: initialData.president || '',
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
                setFormData(BLANK_ASSIGNMENT_STATE);
            }
        }
    }, [isOpen, initialData]);


    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const assignedRoles: RoleField[] = (Object.keys(formData) as (keyof typeof formData)[])
            .filter((key): key is RoleField => 
                key !== 'date' && key !== 'notes' && typeof formData[key] === 'string' && (formData[key] as string).trim() !== ''
            );

        if (assignedRoles.length === 0) {
            alert('Preencha pelo menos uma designação.');
            return;
        }

        const dataToSave: Omit<Assignment, 'id' | keyof BaseRecord> = {
            date: new Date(formData.date + 'T00:00:00Z').toISOString(), // Treat date as UTC
            notes: formData.notes || '',
            president: formData.president || '',
            indicator1: formData.indicator1 || '',
            indicator2: formData.indicator2 || '',
            mic1: formData.mic1 || '',
            mic2: formData.mic2 || '',
            reader: formData.reader || '',
            audio: formData.audio || '',
            video: formData.video || '',
            assignedUids: [] // UIDs are no longer tracked with simple text inputs
        };
        onSave(dataToSave);
    };

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
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
                        
                        <div className="space-y-6">
                             {/* Presidente */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Presidente 👔</label>
                                <input type="text" name="president" value={formData.president} onChange={handleInputChange} placeholder="Nome do presidente..." className="input-style" />
                            </div>

                            {/* Indicadores */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Indicadores 👤</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input type="text" name="indicator1" value={formData.indicator1} onChange={handleInputChange} placeholder="Nome do indicador 1..." className="input-style" />
                                    <input type="text" name="indicator2" value={formData.indicator2} onChange={handleInputChange} placeholder="Nome do indicador 2..." className="input-style" />
                                </div>
                            </div>
                            
                            {/* Microfones */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Microfones 🎤</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input type="text" name="mic1" value={formData.mic1} onChange={handleInputChange} placeholder="Nome do microfone 1..." className="input-style" />
                                    <input type="text" name="mic2" value={formData.mic2} onChange={handleInputChange} placeholder="Nome do microfone 2..." className="input-style" />
                                </div>
                            </div>

                            {/* Leitor, Áudio, Vídeo */}
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leitor 📖</label>
                                    <input type="text" name="reader" value={formData.reader} onChange={handleInputChange} placeholder="Nome do leitor..." className="input-style" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Áudio 🎶</label>
                                    <input type="text" name="audio" value={formData.audio} onChange={handleInputChange} placeholder="Nome do responsável..." className="input-style" />
                                </div>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vídeo 🖥️</label>
                                <input type="text" name="video" value={formData.video} onChange={handleInputChange} placeholder="Nome do responsável..." className="input-style" />
                            </div>
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