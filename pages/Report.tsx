import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublisherProfile, FieldServiceReport } from '../types';
import { addReport, getPublisherProfiles } from '../services/firestoreService';
import PublisherSearchModal from '../components/PublisherSearchModal';
import Toast from '../components/Toast';
import { MagnifyingGlassIcon, CalendarDaysIcon } from '../components/icons/Icons';

const Report: React.FC = () => {
    const navigate = useNavigate();

    // Form state
    const [allPublishers, setAllPublishers] = useState<PublisherProfile[]>([]);
    const [selectedPublisher, setSelectedPublisher] = useState<PublisherProfile | null>(null);
    const [group, setGroup] = useState<'1' | '2' | '3' | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [privilege, setPrivilege] = useState<'PIONEER' | 'PUBLISHER'>('PUBLISHER');
    const [hasParticipated, setHasParticipated] = useState<boolean>(false);
    const [hours, setHours] = useState<number | ''>('');
    const [minutes, setMinutes] = useState<number | ''>('');
    const [revisits, setRevisits] = useState<number | ''>('');
    const [studies, setStudies] = useState<number | ''>('');
    const [notes, setNotes] = useState('');
    
    const [isPublisherModalOpen, setPublisherModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

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
    
    const resetForm = () => {
        setSelectedPublisher(null);
        setGroup('');
        setDate(new Date().toISOString().split('T')[0]);
        setPrivilege('PUBLISHER');
        setHasParticipated(false);
        setHours('');
        setMinutes('');
        setRevisits('');
        setStudies('');
        setNotes('');
    };

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

        const reportData: Omit<FieldServiceReport, 'id'> = {
            publisherId: selectedPublisher.id,
            publisherName: selectedPublisher.name,
            group: group,
            date: new Date(date).toISOString(),
            privilege,
            notes,
            submittedAt: new Date().toISOString(),
            ...(privilege === 'PIONEER' 
                ? { hours: Number(hours) || 0, minutes: Number(minutes) || 0, revisits: Number(revisits) || 0, studies: Number(studies) || 0 }
                : { hasParticipated, revisits: hasParticipated ? Number(revisits) || 0 : 0, studies: hasParticipated ? Number(studies) || 0 : 0 }
            ),
        };

        try {
            await addReport(reportData);
            setToastMessage('Relatório enviado com sucesso!');
            resetForm();
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (error) {
             console.error("Failed to submit report:", error);
             setToastMessage('Erro ao enviar relatório.');
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Envio de Relatório de Serviço</h2>
            <form onSubmit={handleSubmitReport} className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-6">
                
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
                         <select
                            value={group}
                            onChange={e => setGroup(e.target.value as '1' | '2' | '3' | '')}
                            required
                            className="input-style"
                        >
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
                        <label className="flex items-center"><input type="radio" name="privilege" value="PUBLISHER" checked={privilege === 'PUBLISHER'} onChange={() => setPrivilege('PUBLISHER')} className="h-4 w-4 text-primary focus:ring-primary border-slate-300" /> <span className="ml-2">Publicador</span></label>
                        <label className="flex items-center"><input type="radio" name="privilege" value="PIONEER" checked={privilege === 'PIONEER'} onChange={() => setPrivilege('PIONEER')} className="h-4 w-4 text-primary focus:ring-primary border-slate-300" /> <span className="ml-2">Pioneiro(a)</span></label>
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
                            <label className="flex items-center"><input type="radio" name="participation" checked={hasParticipated === true} onChange={() => setHasParticipated(true)} className="h-4 w-4 text-primary focus:ring-primary border-slate-300" /> <span className="ml-2">Sim</span></label>
                            <label className="flex items-center"><input type="radio" name="participation" checked={hasParticipated === false} onChange={() => setHasParticipated(false)} className="h-4 w-4 text-primary focus:ring-primary border-slate-300" /> <span className="ml-2">Não</span></label>
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

                <div className="pt-2">
                    <button type="submit" className="w-full py-3 px-5 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark">
                        Enviar Relatório
                    </button>
                </div>
            </form>
            <PublisherSearchModal 
                isOpen={isPublisherModalOpen} 
                onClose={() => setPublisherModalOpen(false)} 
                onSelect={handleSelectPublisher} 
                publishers={allPublishers}
            />
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </div>
    );
};

export default Report;