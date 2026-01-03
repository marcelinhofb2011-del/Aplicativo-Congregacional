import React, { useState, useEffect } from 'react';
import { PublicTalkSchedule, BaseRecord } from '../types';
import { XIcon } from './icons/Icons';
import { getThemeByOutlineNumber } from '../utils/publicTalksHelper';

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

const FormSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary mb-3">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);


const PublicTalkFormModal: React.FC<PublicTalkFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(BLANK_TALK);
    const [outlineNumber, setOutlineNumber] = useState('');
    const [outlineWarning, setOutlineWarning] = useState('');

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
            setOutlineNumber('');
            setOutlineWarning('');
        } else {
            setFormData(BLANK_TALK);
            setOutlineNumber('');
            setOutlineWarning('');
        }
    }, [initialData, isOpen]);
    
    useEffect(() => {
        if (!outlineNumber) {
            setOutlineWarning('');
            if (!initialData) {
                 setFormData(prev => ({ ...prev, theme: '' }));
            }
            return;
        }

        const result = getThemeByOutlineNumber(outlineNumber);
        
        setFormData(prev => ({ ...prev, theme: result.theme }));
        setOutlineWarning(result.warning || '');
    }, [outlineNumber, initialData]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'radio') {
            setFormData(prev => ({ ...prev, [name]: value === 'true' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleOutlineNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setOutlineNumber(value);
    };
    
    const handleTypeChange = (type: 'local' | 'away') => {
        setFormData(prev => ({ ...prev, type }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.theme || !formData.speakerName || !formData.date || !formData.time || !formData.congregation) return;
        if (outlineWarning) {
            alert('Por favor, corrija o número do esboço. O tema atual não é válido.');
            return;
        }

        const dataToSave: Omit<PublicTalkSchedule, 'id' | keyof BaseRecord> = {
            ...formData,
            date: new Date(formData.date).toISOString(),
        };
        onSave(dataToSave);
    };

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <form onSubmit={handleSubmit}>
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {initialData ? 'Editar Discurso' : 'Agendar Discurso'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg space-y-6">
                        <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-wide">DESIGNAÇÃO DE DISCURSO</h2>
                        </div>
                        
                        <FormSection title="Identificação">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Discurso</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => handleTypeChange('local')} className={`px-4 py-2.5 rounded-md text-sm font-medium ${formData.type === 'local' ? 'bg-primary text-white shadow' : 'bg-slate-200 dark:bg-slate-700'}`}>Discurso Local</button>
                                    <button type="button" onClick={() => handleTypeChange('away')} className={`px-4 py-2.5 rounded-md text-sm font-medium ${formData.type === 'away' ? 'bg-primary text-white shadow' : 'bg-slate-200 dark:bg-slate-700'}`}>Discurso Fora</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                <div className="sm:col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nº do Esboço</label>
                                    <input type="number" name="outlineNumber" value={outlineNumber} onChange={handleOutlineNumberChange} className="input-style" placeholder="1-194" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tema do Discurso</label>
                                    <textarea name="theme" value={formData.theme} readOnly required className="input-style bg-slate-100 dark:bg-slate-700/50 h-20" rows={3}></textarea>
                                    {outlineWarning && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{outlineWarning}</p>}
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Designação">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Irmão Designado</label>
                                <input type="text" name="speakerName" value={formData.speakerName} onChange={handleInputChange} required className="input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Função</label>
                                <p className="mt-1 text-slate-800 dark:text-slate-200">Orador</p>
                            </div>
                        </FormSection>

                        <FormSection title="Informações do Evento">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="input-style" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora</label>
                                    <input type="time" name="time" value={formData.time} onChange={handleInputChange} required className="input-style" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Congregação</label>
                                <input type="text" name="congregation" value={formData.congregation} onChange={handleInputChange} required className="input-style" />
                            </div>
                             {formData.type === 'away' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Local (Endereço)</label>
                                    <input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} className="input-style" />
                                </div>
                             )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone (Contato)</label>
                                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="input-style" placeholder="(Opcional)" />
                            </div>
                        </FormSection>

                        <FormSection title="Observações">
                             <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={3} className="input-style" placeholder="Adicione qualquer observação relevante..."></textarea>
                        </FormSection>
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