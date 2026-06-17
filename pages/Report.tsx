

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PublisherProfile, FieldServiceReport } from '../types';
import { addReport, getPublisherProfiles, getReports } from '../services/firestoreService';
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
    const [publisherName, setPublisherName] = useState('');
    const [group, setGroup] = useState<'1' | '2' | '3' | ''>('');
    const [date, setDate] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    });
    const [privilege, setPrivilege] = useState<'PIONEER' | 'PIONEER_REGULAR' | 'PIONEER_AUXILIARY' | 'PUBLISHER'>('PUBLISHER');
    const [hasParticipated, setHasParticipated] = useState<boolean>(false);
    const [hours, setHours] = useState<number | ''>('');
    const [minutes, setMinutes] = useState<number | ''>('');
    const [revisits, setRevisits] = useState<number | ''>('');
    const [studies, setStudies] = useState<number | ''>('');
    const [notes, setNotes] = useState('');
    
    const [isPublisherModalOpen, setPublisherModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);

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
        setPublisherName('');
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
        setPublisherName(publisher.name);
        setGroup(publisher.group);
        if (publisher.isRegularPioneer) {
            setPrivilege('PIONEER_REGULAR');
        } else if (publisher.isAuxiliaryPioneer) {
            setPrivilege('PIONEER_AUXILIARY');
        } else {
            setPrivilege('PUBLISHER');
        }
        setPublisherModalOpen(false);
    };
    
    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = publisherName.trim();
        if (!user || !trimmedName || !group) {
            setAlertConfig({
                isOpen: true,
                title: "Atenção",
                message: "Por favor, preencha o nome do publicador e selecione um grupo."
            });
            return;
        }

        const [year, month] = date.split('-').map(Number);
        const reportDate = new Date(Date.UTC(year, month - 1, 1));

        const matched = allPublishers.find(p => p.name.trim().toLowerCase() === trimmedName.toLowerCase());
        const finalPublisherId = matched ? matched.id : 'custom-' + Math.random().toString(36).substr(2, 9);
        const finalPublisherName = matched ? matched.name : trimmedName;

        const reportData: Omit<FieldServiceReport, 'id' | 'submittedAt'> = {
            publisherId: finalPublisherId,
            publisherName: finalPublisherName,
            group: group,
            date: reportDate.toISOString(),
            privilege,
            notes,
            ...(privilege !== 'PUBLISHER' 
                ? { hours: Number(hours) || 0, minutes: Number(minutes) || 0, revisits: Number(revisits) || 0, studies: Number(studies) || 0 }
                : { hasParticipated, revisits: hasParticipated ? Number(revisits) || 0 : 0, studies: hasParticipated ? Number(studies) || 0 : 0 }
            ),
        };

        try {
            // Verificar duplicidade de relatório para o mesmo publicador e mês/ano
            const existingReports = await getReports();
            const isDuplicate = existingReports.some(r => {
                if (r.isActive === false) return false;
                const rName = r.publisherName ? r.publisherName.trim().toLowerCase() : '';
                const currentSearchName = finalPublisherName.trim().toLowerCase();
                if (rName !== currentSearchName) return false;

                if (r.date) {
                    const rDate = new Date(r.date);
                    const rYear = rDate.getUTCFullYear();
                    const rMonth = rDate.getUTCMonth() + 1;
                    return rYear === year && rMonth === month;
                }
                return false;
            });

            if (isDuplicate) {
                setAlertConfig({
                    isOpen: true,
                    title: "Relatório Duplicado",
                    message: `Atenção: Já existe um relatório ativo enviado para o publicador "${finalPublisherName}" referente a este mês (${month}/${year}). Para evitar duplicidade, o envio foi bloqueado.`
                });
                return;
            }

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-36">
            <main className="px-6 space-y-8 max-w-4xl mx-auto pt-8">
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
                        <div className="h-1.5 w-20 bg-primary mt-3 rounded-full shadow-[0_0_10px_rgba(120,53,15,0.3)]"></div>
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
                    className="space-y-8 relative"
                >
                    <form onSubmit={handleSubmitReport} className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Publicador</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={publisherName} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            setPublisherName(val);
                                            const matched = allPublishers.find(p => p.name.trim().toLowerCase() === val.trim().toLowerCase());
                                            if (matched) {
                                                setSelectedPublisher(matched);
                                                setGroup(matched.group);
                                                if (matched.isRegularPioneer) {
                                                    setPrivilege('PIONEER_REGULAR');
                                                } else if (matched.isAuxiliaryPioneer) {
                                                    setPrivilege('PIONEER_AUXILIARY');
                                                } else {
                                                    setPrivilege('PUBLISHER');
                                                }
                                            } else {
                                                setSelectedPublisher(null);
                                            }
                                        }}
                                        placeholder="Digite o nome ou busque ao lado" 
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans pr-12" 
                                        required 
                                    />
                                    <button type="button" onClick={() => setPublisherModalOpen(true)} className="absolute top-1/2 right-4 -translate-y-1/2" title="Buscar na lista de publicadores">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-primary hover:text-primary-dark transition-colors" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Grupo</label>
                                <select
                                    value={group}
                                    onChange={e => setGroup(e.target.value as '1' | '2' | '3' | '')}
                                    required
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans appearance-none"
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
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans pr-12" 
                                    />
                                    <CalendarDaysIcon className="h-5 w-5 text-primary dark:text-amber-500 absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Privilégio</label>
                                <div className="flex flex-col sm:flex-row gap-2 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                                    <button 
                                        type="button"
                                        onClick={() => setPrivilege('PUBLISHER')}
                                        className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all ${privilege === 'PUBLISHER' ? 'bg-white dark:bg-slate-700 text-primary dark:text-amber-500 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Publicador
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setPrivilege('PIONEER_AUXILIARY')}
                                        className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all ${privilege === 'PIONEER_AUXILIARY' ? 'bg-white dark:bg-slate-700 text-primary dark:text-amber-500 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Pioneiro Auxiliar
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setPrivilege('PIONEER_REGULAR')}
                                        className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all ${privilege === 'PIONEER_REGULAR' ? 'bg-white dark:bg-slate-700 text-primary dark:text-amber-500 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Pioneiro Regular
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {privilege !== 'PUBLISHER' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans ml-1">Horas</label>
                                    <input type="number" min="0" value={hours} onChange={e => setHours(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans ml-1">Minutos</label>
                                    <input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans ml-1">Revisitas</label>
                                    <input type="number" min="0" value={revisits} onChange={e => setRevisits(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans ml-1">Estudos</label>
                                    <input type="number" min="0" value={studies} onChange={e => setStudies(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Participou no ministério?</label>
                                    <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-fit">
                                        <button 
                                            type="button"
                                            onClick={() => setHasParticipated(true)}
                                            className={`py-2 px-6 rounded-xl text-sm font-bold transition-all ${hasParticipated === true ? 'bg-white dark:bg-slate-700 text-primary dark:text-amber-500 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            Sim
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setHasParticipated(false)}
                                            className={`py-2 px-6 rounded-xl text-sm font-bold transition-all ${hasParticipated === false ? 'bg-white dark:bg-slate-700 text-primary dark:text-amber-500 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            Não
                                        </button>
                                    </div>
                                </div>
                                {hasParticipated && (
                                     <div className="grid grid-cols-2 gap-6">
                                         <div className="space-y-2">
                                             <label className="text-[10px] font-bold text-slate-400 uppercase font-sans ml-1">Revisitas</label>
                                             <input type="number" min="0" value={revisits} onChange={e => setRevisits(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans" />
                                         </div>
                                         <div className="space-y-2">
                                             <label className="text-[10px] font-bold text-slate-400 uppercase font-sans ml-1">Estudos</label>
                                             <input type="number" min="0" value={studies} onChange={e => setStudies(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans" />
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
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans resize-none"
                            ></textarea>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                className="w-full py-5 px-6 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 active:scale-[0.98] font-sans text-lg"
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

            {alertConfig && alertConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-700 text-center space-y-4"
                    >
                        <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit">{alertConfig.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed">{alertConfig.message}</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setAlertConfig(null)}
                            className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-md active:scale-95 text-sm font-sans"
                        >
                            OK
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Report;
