
import React, { useState, useEffect } from 'react';
import { PublicTalkSchedule, BaseRecord } from '../types';
import { XIcon } from './icons/Icons';

interface PublicTalkFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<PublicTalkSchedule, 'id' | keyof BaseRecord>) => void;
    initialData: PublicTalkSchedule | null;
}

const BLANK_TALK: Omit<PublicTalkSchedule, 'id' | keyof BaseRecord> = {
    type: 'local',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    theme: '',
    song: '',
    hasImage: false,
    speakerName: '',
    congregation: '',
    address: '',
    phone: '',
    notes: ''
};

const PublicTalkFormModal: React.FC<PublicTalkFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(BLANK_TALK);
    const [dayOfWeek, setDayOfWeek] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                type: initialData.type,
                date: new Date(initialData.date).toISOString().split('T')[0],
                time: initialData.time,
                theme: initialData.theme,
                song: initialData.song || '',
                hasImage: initialData.hasImage,
                speakerName: initialData.speakerName,
                congregation: initialData.congregation,
                address: initialData.address || '',
                phone: initialData.phone || '',
                notes: initialData.notes || '',
            });
        } else {
            setFormData(BLANK_TALK);
        }
    }, [initialData, isOpen]);
    
    useEffect(() => {
        if (formData.date) {
            const date = new Date(`${formData.date}T00:00:00Z`);
            const day = date.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' });
            setDayOfWeek(day.charAt(0).toUpperCase() + day.slice(1));
        }
    }, [formData.date]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'radio') {
            setFormData(prev => ({ ...prev, [name]: value === 'true' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleTypeChange = (type: 'local' | 'away') => {
        setFormData(prev => ({ ...prev, type }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.theme || !formData.speakerName || !formData.date || !formData.time || !formData.congregation) return;

        const dataToSave: Omit<PublicTalkSchedule, 'id' | keyof BaseRecord> = {
            ...formData,
            date: new Date(formData.date).toISOString(),
        };
        onSave(dataToSave);
    };

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {initialData ? 'Editar Discurso' : 'Agendar Discurso'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Discurso</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => handleTypeChange('local')} className={`px-4 py-2.5 rounded-md text-sm font-medium ${formData.type === 'local' ? 'bg-primary text-white shadow' : 'bg-slate-200 dark:bg-slate-700'}`}>Discurso Local</button>
                                <button type="button" onClick={() => handleTypeChange('away')} className={`px-4 py-2.5 rounded-md text-sm font-medium ${formData.type === 'away' ? 'bg-primary text-white shadow' : 'bg-slate-200 dark:bg-slate-700'}`}>Discurso Fora</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="input-style" />
                                {dayOfWeek && <p className="text-xs text-slate-500 mt-1">{dayOfWeek}</p>}
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora</label>
                                <input type="time" name="time" value={formData.time} onChange={handleInputChange} required className="input-style" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                             <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tema do Discurso</label>
                                <input type="text" name="theme" value={formData.theme} onChange={handleInputChange} required className="input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cântico Nº</label>
                                <input type="text" name="song" value={formData.song || ''} onChange={handleInputChange} className="input-style" />
                            </div>
                        </div>
                        
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Usa imagem?</label>
                            <div className="flex gap-4">
                               <label className="flex items-center"><input type="radio" name="hasImage" value="true" checked={formData.hasImage === true} onChange={handleInputChange} className="h-4 w-4" /> <span className="ml-2">Sim</span></label>
                               <label className="flex items-center"><input type="radio" name="hasImage" value="false" checked={formData.hasImage === false} onChange={handleInputChange} className="h-4 w-4" /> <span className="ml-2">Não</span></label>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Orador</label>
                                <input type="text" name="speakerName" value={formData.speakerName} onChange={handleInputChange} required className="input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Congregação</label>
                                <input type="text" name="congregation" value={formData.congregation} onChange={handleInputChange} required className="input-style" />
                            </div>
                        </div>
                         
                         {formData.type === 'away' && (
                             <div className="border-t pt-4 space-y-4">
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço</label>
                                    <input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} className="input-style" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                                    <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="input-style" />
                                </div>
                             </div>
                         )}

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
export default PublicTalkFormModal;
