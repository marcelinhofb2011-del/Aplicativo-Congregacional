import React, { useState, useEffect } from 'react';
import { PublisherProfile, FieldServiceReport } from '../types';
import { getPublisherProfiles } from '../services/firestoreService';
import PublisherSearchModal from './PublisherSearchModal';
import { MagnifyingGlassIcon, CalendarDaysIcon, XIcon } from './icons/Icons';

interface ReportFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Partial<FieldServiceReport>) => void;
    initialData: FieldServiceReport | null;
}

const ReportFormModal: React.FC<ReportFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    // Form state
    const [allPublishers, setAllPublishers] = useState<PublisherProfile[]>([]);
    const [selectedPublisher, setSelectedPublisher] = useState<PublisherProfile | null>(null);
    const [group, setGroup] = useState<'1' | '2' | '3' | ''>('');
    const [date, setDate] = useState('');
    const [privilege, setPrivilege] = useState<'PIONEER' | 'PUBLISHER'>('PUBLISHER');
    const [hasParticipated, setHasParticipated] = useState<boolean>(false);
    const [hours, setHours] = useState<number | ''>('');
    const [minutes, setMinutes] = useState<number | ''>('');
    const [revisits, setRevisits] = useState<number | ''>('');
    const [studies, setStudies] = useState<number | ''>('');
    const [notes, setNotes] = useState('');
    
    const [isPublisherModalOpen, setPublisherModalOpen] = useState(false);

    useEffect(() => {
        const fetchPublishers = async () => {
            try {
                const publishers = await getPublisherProfiles();
                setAllPublishers(publishers);
            } catch (error) {
                console.error("Failed to fetch publishers for report form:", error);
            }
        };
        fetchPublishers();
    }, []);

    useEffect(() => {
        if (initialData && allPublishers.length > 0) {
            const publisherMatch = allPublishers.find(p => p.id === initialData.publisherId);
            setSelectedPublisher(publisherMatch || { id: initialData.publisherId, name: initialData.publisherName } as PublisherProfile);
            setGroup(initialData.group);
            setDate(new Date(initialData.date).toISOString().split('T')[0]);
            setPrivilege(initialData.privilege);
            setHasParticipated(initialData.hasParticipated || false);
            setHours(initialData.hours ?? '');
            setMinutes(initialData.minutes ?? '');
            setRevisits(initialData.revisits ?? '');
            setStudies(initialData.studies ?? '');
            setNotes(initialData.notes || '');
        }
    }, [initialData, allPublishers, isOpen]);


    const handleSelectPublisher = (publisher: PublisherProfile) => {
        setSelectedPublisher(publisher);
        setGroup(publisher.group);
        setPublisherModalOpen(false);
    };
    
    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPublisher || !group) {
            alert("Por favor, selecione um publicador e um grupo.");
            return;
        }

        const reportData: Partial<FieldServiceReport> = {
            publisherId: selectedPublisher.id,
            publisherName: selectedPublisher.name,
            group: group,
            date: new Date(date).toISOString(),
            privilege,
            notes,
            ...(privilege === 'PIONEER' 
                ? { hasParticipated: undefined, hours: Number(hours) || 0, minutes: Number(minutes) || 0, revisits: Number(revisits) || 0, studies: Number(studies) || 0 }
                : { hasParticipated, hours: undefined, minutes: undefined, revisits: hasParticipated ? Number(revisits) || 0 : 0, studies: hasParticipated ? Number(studies) || 0 : 0 }
            ),
        };
        
        onSave(reportData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <form onSubmit={handleSubmitReport}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Editar Relatório
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                                <div className="relative">
                                    <input type="text" readOnly value={selectedPublisher?.name || ''} onClick={() => setPublisherModalOpen(true)} placeholder="Clique na lupa" className="input-style cursor-pointer" required />
                                    <button type="button" onClick={() => setPublisherModalOpen(true)} className="absolute top-1/2 right-3 -translate-y-1/2">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grupo</label>
                                 <select value={group} onChange={e => setGroup(e.target.value as '1' | '2' | '3' | '')} required className="input-style">
                                    <option value="" disabled>Selecione o grupo</option>
                                    <option value="1">Grupo 1</option>
                                    <option value="2">Grupo 2</option>
                                    <option value="3">Grupo 3</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                            <div className="relative">
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="input-style pr-10" />
                                <CalendarDaysIcon className="h-5 w-5 text-slate-400 absolute top-1/2 right-3 -translate-y-1/2" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Privilégio</label>
                            <div className="flex gap-4">
                                <label className="flex items-center"><input type="radio" name="privilege" value="PUBLISHER" checked={privilege === 'PUBLISHER'} onChange={() => setPrivilege('PUBLISHER')} className="h-4 w-4 text-primary" /> <span className="ml-2">Publicador</span></label>
                                <label className="flex items-center"><input type="radio" name="privilege" value="PIONEER" checked={privilege === 'PIONEER'} onChange={() => setPrivilege('PIONEER')} className="h-4 w-4 text-primary" /> <span className="ml-2">Pioneiro(a)</span></label>
                            </div>
                        </div>
                        
                        {privilege === 'PIONEER' ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div><label className="block text-sm font-medium">Horas</label><input type="number" min="0" value={hours} onChange={e => setHours(e.target.value === '' ? '' : parseInt(e.target.value))} className="input-style mt-1" /></div>
                                <div><label className="block text-sm font-medium">Minutos</label><input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value === '' ? '' : parseInt(e.target.value))} className="input-style mt-1" /></div>
                                <div><label className="block text-sm font-medium">Revisitas</label><input type="number" min="0" value={revisits} onChange={e => setRevisits(e.target.value === '' ? '' : parseInt(e.target.value))} className="input-style mt-1" /></div>
                                <div><label className="block text-sm font-medium">Estudos</label><input type="number" min="0" value={studies} onChange={e => setStudies(e.target.value === '' ? '' : parseInt(e.target.value))} className="input-style mt-1" /></div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Participou no ministério?</label>
                                <div className="flex gap-4 mb-4">
                                    <label className="flex items-center"><input type="radio" name="participation" checked={hasParticipated === true} onChange={() => setHasParticipated(true)} className="h-4 w-4 text-primary" /> <span className="ml-2">Sim</span></label>
                                    <label className="flex items-center"><input type="radio" name="participation" checked={hasParticipated === false} onChange={() => setHasParticipated(false)} className="h-4 w-4 text-primary" /> <span className="ml-2">Não</span></label>
                                </div>
                                {hasParticipated && (
                                     <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-medium">Revisitas</label><input type="number" min="0" value={revisits} onChange={e => setRevisits(e.target.value === '' ? '' : parseInt(e.target.value))} className="input-style mt-1" /></div>
                                        <div><label className="block text-sm font-medium">Estudos</label><input type="number" min="0" value={studies} onChange={e => setStudies(e.target.value === '' ? '' : parseInt(e.target.value))} className="input-style mt-1" /></div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observação</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input-style"></textarea>
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-4 pb-8">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 mr-3">
                            Cancelar
                        </button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-dark">
                            Salvar Alterações
                        </button>
                    </div>
                </form>

                <PublisherSearchModal 
                    isOpen={isPublisherModalOpen} 
                    onClose={() => setPublisherModalOpen(false)} 
                    onSelect={handleSelectPublisher} 
                    publishers={allPublishers}
                />
            </div>
        </div>
    );
};

export default ReportFormModal;