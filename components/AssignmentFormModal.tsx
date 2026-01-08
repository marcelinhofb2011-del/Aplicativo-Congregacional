
import React, { useState, useEffect } from 'react';
import { Assignment, BaseRecord, PublisherProfile } from '../types';
import { XIcon, UserPlusIcon } from './icons/Icons';
import { getPublisherProfiles } from '../services/firestoreService';
import PublisherSearchModal from './PublisherSearchModal';

interface AssignmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<Assignment, 'id' | keyof BaseRecord>) => void;
    initialData: Assignment | null;
}

type RoleField = 'indicator1' | 'indicator2' | 'mic1' | 'mic2' | 'reader' | 'audio' | 'video';

const roleLabels: Record<RoleField, string> = {
    indicator1: 'Indicador 👤',
    indicator2: 'Indicador 👤',
    mic1: 'Microfone 🎤',
    mic2: 'Microfone 🎤',
    reader: 'Leitor 📖',
    audio: 'Áudio 🎶',
    video: 'Vídeo 🖥️'
};

const BLANK_ASSIGNMENT_STATE = {
    date: new Date().toISOString().split('T')[0],
    indicator1: null, indicator2: null, mic1: null, mic2: null,
    reader: null, audio: null, video: null, notes: ''
};

// Componente para um único seletor de publicador
const PublisherSelector: React.FC<{
    label: string;
    publisher: PublisherProfile | null;
    onSelect: () => void;
    onClear: () => void;
}> = ({ label, publisher, onSelect, onClear }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <div className="flex gap-2">
            <div className="input-style flex-grow flex items-center justify-between">
                <span className={publisher ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                    {publisher?.name || 'Ninguém designado'}
                </span>
            </div>
            <button type="button" onClick={onSelect} className="p-3 bg-primary text-white rounded-md hover:bg-primary-dark"><UserPlusIcon className="h-5 w-5"/></button>
            {publisher && <button type="button" onClick={onClear} className="p-3 bg-red-500 text-white rounded-md hover:bg-red-600"><XIcon className="h-5 w-5"/></button>}
        </div>
    </div>
);

// Componente para um par de seletores de publicador, com um único rótulo
const PairedPublisherSelector: React.FC<{
    label: string;
    publisher1: PublisherProfile | null;
    publisher2: PublisherProfile | null;
    onSelect1: () => void;
    onClear1: () => void;
    onSelect2: () => void;
    onClear2: () => void;
}> = ({ label, publisher1, publisher2, onSelect1, onClear1, onSelect2, onClear2 }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Selector 1 */}
            <div className="flex gap-2">
                <div className="input-style flex-grow flex items-center justify-between">
                    <span className={publisher1 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                        {publisher1?.name || 'Vaga 1'}
                    </span>
                </div>
                <button type="button" onClick={onSelect1} className="p-3 bg-primary text-white rounded-md hover:bg-primary-dark"><UserPlusIcon className="h-5 w-5"/></button>
                {publisher1 && <button type="button" onClick={onClear1} className="p-3 bg-red-500 text-white rounded-md hover:bg-red-600"><XIcon className="h-5 w-5"/></button>}
            </div>
            {/* Selector 2 */}
            <div className="flex gap-2">
                <div className="input-style flex-grow flex items-center justify-between">
                    <span className={publisher2 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                        {publisher2?.name || 'Vaga 2'}
                    </span>
                </div>
                <button type="button" onClick={onSelect2} className="p-3 bg-primary text-white rounded-md hover:bg-primary-dark"><UserPlusIcon className="h-5 w-5"/></button>
                {publisher2 && <button type="button" onClick={onClear2} className="p-3 bg-red-500 text-white rounded-md hover:bg-red-600"><XIcon className="h-5 w-5"/></button>}
            </div>
        </div>
    </div>
);


const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<Record<RoleField, PublisherProfile | null> & { date: string; notes: string; }>(BLANK_ASSIGNMENT_STATE);
    const [publishers, setPublishers] = useState<PublisherProfile[]>([]);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [activeRole, setActiveRole] = useState<RoleField | null>(null);

    useEffect(() => {
        if (isOpen) {
            getPublisherProfiles().then(setPublishers);
        }
    }, [isOpen]);

    useEffect(() => {
        if (initialData && publishers.length > 0) {
            const findPub = (name?: string) => publishers.find(p => p.name === name) || null;
            setFormData({
                date: new Date(initialData.date).toISOString().split('T')[0],
                indicator1: findPub(initialData.indicator1),
                indicator2: findPub(initialData.indicator2),
                mic1: findPub(initialData.mic1),
                mic2: findPub(initialData.mic2),
                reader: findPub(initialData.reader),
                audio: findPub(initialData.audio),
                video: findPub(initialData.video),
                notes: initialData.notes || ''
            });
        } else if (!initialData) {
            setFormData(BLANK_ASSIGNMENT_STATE);
        }
    }, [initialData, isOpen, publishers]);

    if (!isOpen) return null;

    const handleOpenSearch = (role: RoleField) => {
        setActiveRole(role);
        setIsSearchModalOpen(true);
    };

    const handleSelectPublisher = (publisher: PublisherProfile) => {
        if (activeRole) {
            setFormData(prev => ({ ...prev, [activeRole]: publisher }));
        }
        setIsSearchModalOpen(false);
        setActiveRole(null);
    };

    const handleClearPublisher = (role: RoleField) => {
        setFormData(prev => ({ ...prev, [role]: null }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const assignedRoles = Object.keys(roleLabels).filter(role => formData[role as RoleField]);
        if (assignedRoles.length === 0) {
            alert('Preencha pelo menos uma designação.');
            return;
        }

        const dataToSave: Omit<Assignment, 'id' | keyof BaseRecord> = {
            date: new Date(formData.date + 'T00:00:00Z').toISOString(), // Treat date as UTC
            notes: formData.notes || '',
            indicator1: formData.indicator1?.name || '',
            indicator2: formData.indicator2?.name || '',
            mic1: formData.mic1?.name || '',
            mic2: formData.mic2?.name || '',
            reader: formData.reader?.name || '',
            audio: formData.audio?.name || '',
            video: formData.video?.name || '',
            assignedUids: Array.from(new Set(assignedRoles.map(role => formData[role as RoleField]?.uid).filter((uid): uid is string => !!uid)))
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
                            <PairedPublisherSelector 
                                label="Indicadores 👤"
                                publisher1={formData.indicator1}
                                publisher2={formData.indicator2}
                                onSelect1={() => handleOpenSearch('indicator1')}
                                onClear1={() => handleClearPublisher('indicator1')}
                                onSelect2={() => handleOpenSearch('indicator2')}
                                onClear2={() => handleClearPublisher('indicator2')}
                            />
                            <PairedPublisherSelector 
                                label="Microfones 🎤"
                                publisher1={formData.mic1}
                                publisher2={formData.mic2}
                                onSelect1={() => handleOpenSearch('mic1')}
                                onClear1={() => handleClearPublisher('mic1')}
                                onSelect2={() => handleOpenSearch('mic2')}
                                onClear2={() => handleClearPublisher('mic2')}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <PublisherSelector label={roleLabels.reader} publisher={formData.reader} onSelect={() => handleOpenSearch('reader')} onClear={() => handleClearPublisher('reader')} />
                               <PublisherSelector label={roleLabels.audio} publisher={formData.audio} onSelect={() => handleOpenSearch('audio')} onClear={() => handleClearPublisher('audio')} />
                            </div>
                             <PublisherSelector label={roleLabels.video} publisher={formData.video} onSelect={() => handleOpenSearch('video')} onClear={() => handleClearPublisher('video')} />
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

                 <PublisherSearchModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                    onSelect={handleSelectPublisher}
                    publishers={publishers}
                />
            </div>
        </div>
    );
};

export default AssignmentFormModal;
