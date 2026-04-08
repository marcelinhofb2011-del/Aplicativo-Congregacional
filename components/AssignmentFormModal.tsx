import React, { useState, useEffect } from 'react';
import { Assignment, BaseRecord, PublisherProfile } from '../types';
import { XIcon } from './icons/Icons';
import PublisherAutocomplete from './PublisherAutocomplete';
import { getPublisherProfiles } from '../services/firestoreService';
import { getLocalDateString, formatToLocalDate } from '../utils/dateUtils';

interface AssignmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<Assignment, 'id' | keyof BaseRecord>) => void;
    initialData: Assignment | null;
}

type RoleField = 'president' | 'indicator1' | 'indicator2' | 'mic1' | 'mic2' | 'reader' | 'audio' | 'video';
type UidField = `${RoleField}Uid`;

interface FormState extends Record<RoleField, string>, Record<UidField, string> {
    date: string;
    notes: string;
    assignedUids: string[];
}

const BLANK_ASSIGNMENT_STATE: FormState = {
    date: getLocalDateString(),
    president: '', presidentUid: '',
    indicator1: '', indicator1Uid: '',
    indicator2: '', indicator2Uid: '',
    mic1: '', mic1Uid: '',
    mic2: '', mic2Uid: '',
    reader: '', readerUid: '',
    audio: '', audioUid: '',
    video: '', videoUid: '',
    notes: '',
    assignedUids: []
};

const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<FormState>(BLANK_ASSIGNMENT_STATE);
    const [publishers, setPublishers] = useState<PublisherProfile[]>([]);

    useEffect(() => {
        const fetchPublishers = async () => {
            const data = await getPublisherProfiles();
            setPublishers(data);
        };
        fetchPublishers();
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    date: formatToLocalDate(initialData.date),
                    president: initialData.president || '',
                    presidentUid: initialData.presidentUid || '',
                    indicator1: initialData.indicator1 || '',
                    indicator1Uid: initialData.indicator1Uid || '',
                    indicator2: initialData.indicator2 || '',
                    indicator2Uid: initialData.indicator2Uid || '',
                    mic1: initialData.mic1 || '',
                    mic1Uid: initialData.mic1Uid || '',
                    mic2: initialData.mic2 || '',
                    mic2Uid: initialData.mic2Uid || '',
                    reader: initialData.reader || '',
                    readerUid: initialData.readerUid || '',
                    audio: initialData.audio || '',
                    audioUid: initialData.audioUid || '',
                    video: initialData.video || '',
                    videoUid: initialData.videoUid || '',
                    notes: initialData.notes || '',
                    assignedUids: initialData.assignedUids || []
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

    const handlePublisherSelect = (field: RoleField, publisher: PublisherProfile | null) => {
        const name = publisher?.name || '';
        const uid = publisher?.uid || '';
        const uidField = `${field}Uid` as UidField;

        setFormData(prev => ({ 
            ...prev, 
            [field]: name,
            [uidField]: uid
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Collect all UIDs from the UID fields
        const uidsSet = new Set<string>();
        const uidFields: UidField[] = ['presidentUid', 'indicator1Uid', 'indicator2Uid', 'mic1Uid', 'mic2Uid', 'readerUid', 'audioUid', 'videoUid'];
        
        uidFields.forEach(field => {
            if (formData[field]) uidsSet.add(formData[field]);
        });

        const uids = Array.from(uidsSet);

        const dataToSave: Omit<Assignment, 'id' | keyof BaseRecord> = {
            date: new Date(formData.date + 'T00:00:00Z').toISOString(),
            notes: formData.notes || '',
            president: formData.president || '',
            presidentUid: formData.presidentUid || '',
            indicator1: formData.indicator1 || '',
            indicator1Uid: formData.indicator1Uid || '',
            indicator2: formData.indicator2 || '',
            indicator2Uid: formData.indicator2Uid || '',
            mic1: formData.mic1 || '',
            mic1Uid: formData.mic1Uid || '',
            mic2: formData.mic2 || '',
            mic2Uid: formData.mic2Uid || '',
            reader: formData.reader || '',
            readerUid: formData.readerUid || '',
            audio: formData.audio || '',
            audioUid: formData.audioUid || '',
            video: formData.video || '',
            videoUid: formData.videoUid || '',
            assignedUids: uids
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
                                <PublisherAutocomplete 
                                    publishers={publishers}
                                    selectedPublisher={publishers.find(p => p.uid === formData.presidentUid) || null}
                                    onSelect={(pub) => handlePublisherSelect('president', pub)}
                                    placeholder="Nome do presidente..."
                                />
                            </div>

                            {/* Indicadores */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Indicadores 👤</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <PublisherAutocomplete 
                                        publishers={publishers}
                                        selectedPublisher={publishers.find(p => p.uid === formData.indicator1Uid) || null}
                                        onSelect={(pub) => handlePublisherSelect('indicator1', pub)}
                                        placeholder="Nome do indicador 1..."
                                    />
                                    <PublisherAutocomplete 
                                        publishers={publishers}
                                        selectedPublisher={publishers.find(p => p.uid === formData.indicator2Uid) || null}
                                        onSelect={(pub) => handlePublisherSelect('indicator2', pub)}
                                        placeholder="Nome do indicador 2..."
                                    />
                                </div>
                            </div>
                            
                            {/* Microfones */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Microfones 🎤</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <PublisherAutocomplete 
                                        publishers={publishers}
                                        selectedPublisher={publishers.find(p => p.uid === formData.mic1Uid) || null}
                                        onSelect={(pub) => handlePublisherSelect('mic1', pub)}
                                        placeholder="Nome do microfone 1..."
                                    />
                                    <PublisherAutocomplete 
                                        publishers={publishers}
                                        selectedPublisher={publishers.find(p => p.uid === formData.mic2Uid) || null}
                                        onSelect={(pub) => handlePublisherSelect('mic2', pub)}
                                        placeholder="Nome do microfone 2..."
                                    />
                                </div>
                            </div>

                            {/* Leitor, Áudio, Vídeo */}
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leitor 📖</label>
                                    <PublisherAutocomplete 
                                        publishers={publishers}
                                        selectedPublisher={publishers.find(p => p.uid === formData.readerUid) || null}
                                        onSelect={(pub) => handlePublisherSelect('reader', pub)}
                                        placeholder="Nome do leitor..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Áudio 🎶</label>
                                    <PublisherAutocomplete 
                                        publishers={publishers}
                                        selectedPublisher={publishers.find(p => p.uid === formData.audioUid) || null}
                                        onSelect={(pub) => handlePublisherSelect('audio', pub)}
                                        placeholder="Nome do responsável..."
                                    />
                                </div>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vídeo 🖥️</label>
                                <PublisherAutocomplete 
                                    publishers={publishers}
                                    selectedPublisher={publishers.find(p => p.uid === formData.videoUid) || null}
                                    onSelect={(pub) => handlePublisherSelect('video', pub)}
                                    placeholder="Nome do responsável..."
                                />
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
