

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PublisherProfile, FieldServiceReport } from '../types';
import { addReport, getPublisherProfiles } from '../services/firestoreService';
import PublisherSearchModal from '../components/PublisherSearchModal';
import Toast from '../components/Toast';
import { MagnifyingGlassIcon, CalendarDaysIcon, DocumentTextIcon } from '../components/icons/Icons';
import { motion } from 'motion/react';

const Report: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Form state
    const [allPublishers, setAllPublishers] = useState<PublisherProfile[]>([]);
    const [selectedPublisher, setSelectedPublisher] = useState<PublisherProfile | null>(null);
    const [group, setGroup] = useState<'1' | '2' | '3' | ''>('');
    const [date, setDate] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    });
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
        setDate(() => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}`;
        });
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
        if (!user || !selectedPublisher || !group) {
            alert("Por favor, selecione um publicador e um grupo.");
            return;
        }

        const [year, month] = date.split('-').map(Number);
        const reportDate = new Date(Date.UTC(year, month - 1, 1));

        const reportData: Omit<FieldServiceReport, 'id' | 'submittedAt'> = {
            publisherId: selectedPublisher.id,
            publisherName: selectedPublisher.name,
            group: group,
            date: reportDate.toISOString(),
            privilege,
            notes,
            ...(privilege === 'PIONEER' 
                ? { hours: Number(hours) || 0, minutes: Number(minutes) || 0, revisits: Number(revisits) || 0, studies: Number(studies) || 0 }
                : { hasParticipated, revisits: hasParticipated ? Number(revisits) || 0 : 0, studies: hasParticipated ? Number(studies) || 0 : 0 }
            ),
        };

        try {
            await addReport(reportData, user.uid);
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
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 font-sans pb-12">
            <main className="px-6 space-y-8 max-w-2xl mx-auto pt-8">
                {/* Page Title Section */}
                <motion.section 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-1 font-sans">RELATÓRIO</p>
                    <div className="relative inline-block">
                        <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight font-outfit">
                            Enviar Relatório
                        </h2>
                        <div className="h-1.5 w-20 bg-sky-500 mt-3 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.3)]"></div>
                    </div>
                    <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm font-sans">
                        Preencha os campos abaixo para registrar sua atividade de campo.
                    </p>
                </motion.section>

                {/* Form Card */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-[40px] p-8 sm:p-10 shadow-xl shadow-sky-100/50 dark:shadow-none border border-sky-50 dark:border-slate-800 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute top-8 right-8 h-12 w-12 bg-sky-100 dark:bg-sky-900/40 rounded-full flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-sm">
                        <DocumentTextIcon className="h-6 w-6" />
                    </div>

                    <form onSubmit={handleSubmitReport} className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Publicador</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={selectedPublisher?.name || ''} 
                                        onClick={() => setPublisherModalOpen(true)} 
                                        placeholder="Clique para buscar" 
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/20 transition-all font-sans pr-12 cursor-pointer" 
                                        required 
                                    />
                                    <button type="button" onClick={() => setPublisherModalOpen(true)} className="absolute top-1/2 right-4 -translate-y-1/2">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-sky-500" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Grupo</label>
                                <select
                                    value={group}
                                    onChange={e => setGroup(e.target.value as '1' | '2' | '3' | '')}
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/20 transition-all font-sans appearance-none"
                                >
                                    <option value="" disabled>Selecione o grupo</option>
                                    <option value="1">Grupo 1</option>
                                    <option value="2">Grupo 2</option>
                                    <option value="3">Grupo 3</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Mês do Relatório</label>
                                <div className="relative">
                                    <input 
                                        type="month" 
                                        value={date} 
                                        onChange={e => setDate(e.target.value)} 
                                        required 
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/20 transition-all font-sans pr-12" 
                                    />
                                    <CalendarDaysIcon className="h-5 w-5 text-sky-500 absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Privilégio</label>
                                <div className="flex gap-4 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                    <button 
                                        type="button"
                                        onClick={() => setPrivilege('PUBLISHER')}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${privilege === 'PUBLISHER' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Publicador
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setPrivilege('PIONEER')}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${privilege === 'PIONEER' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Pioneiro(a)
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {privilege === 'PIONEER' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans ml-1">Horas</label>
                                    <input type="number" min="0" value={hours} onChange={e => setHours(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/20 transition-all font-sans" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans ml-1">Minutos</label>
                                    <input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/20 transition-all font-sans" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans ml-1">Revisitas</label>
                                    <input type="number" min="0" value={revisits} onChange={e => setRevisits(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/20 transition-all font-sans" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans ml-1">Estudos</label>
                                    <input type="number" min="0" value={studies} onChange={e => setStudies(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/20 transition-all font-sans" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Participou no ministério?</label>
                                    <div className="flex gap-4 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-fit">
                                        <button 
                                            type="button"
                                            onClick={() => setHasParticipated(true)}
                                            className={`py-2 px-6 rounded-xl text-sm font-bold transition-all ${hasParticipated === true ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            Sim
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setHasParticipated(false)}
                                            className={`py-2 px-6 rounded-xl text-sm font-bold transition-all ${hasParticipated === false ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            Não
                                        </button>
                                    </div>
                                </div>
                                {hasParticipated && (
                                     <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase font-sans ml-1">Revisitas</label>
                                            <input type="number" min="0" value={revisits} onChange={e => setRevisits(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/20 transition-all font-sans" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase font-sans ml-1">Estudos</label>
                                            <input type="number" min="0" value={studies} onChange={e => setStudies(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/20 transition-all font-sans" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Observação</label>
                            <textarea 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)} 
                                rows={3} 
                                placeholder="Alguma observação importante..."
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/20 transition-all font-sans resize-none"
                            ></textarea>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                className="w-full py-5 px-6 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/25 active:scale-[0.98] font-sans text-lg"
                            >
                                Enviar Relatório
                            </button>
                        </div>
                    </form>
                </motion.section>
            </main>
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
