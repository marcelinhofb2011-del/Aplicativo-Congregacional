import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
    getPioneerRecords, 
    addPioneerRecord, 
    updatePioneerRecord, 
    deletePioneerRecord,
    getPublisherProfileByUid,
    addMonthlyReport
} from '../services/firestoreService';
import { PioneerRecord, PioneerActivity, PublisherProfile, UserRole } from '../types';
import { 
    CalendarDaysIcon, 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    ShareIcon, 
    DocumentTextIcon,
    ChevronLeftIcon,
    CheckIcon,
    XMarkIcon
} from '../components/icons/Icons';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const Pioneer: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState<'hub' | 'daily' | 'report'>('hub');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [records, setRecords] = useState<PioneerRecord[]>([]);
    const [profile, setProfile] = useState<PublisherProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');

    // Daily Log States
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<PioneerActivity | null>(null);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

    // Monthly Report States
    const [participated, setParticipated] = useState<boolean | null>(null);
    const [reportStudies, setReportStudies] = useState<number>(0);
    const [reportHours, setReportHours] = useState<number>(0);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [recordsData, profileData] = await Promise.all([
                getPioneerRecords(),
                getPublisherProfileByUid(user.uid)
            ]);
            setRecords(recordsData);
            setProfile(profileData);
        } catch (error) {
            console.error('Error loading pioneer data:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentRecord = useMemo(() => {
        return records.find(r => r.month === selectedMonth && r.createdBy === user?.uid);
    }, [records, selectedMonth, user]);

    const totalHoursCompleted = useMemo(() => {
        if (!currentRecord) return 0;
        const totalMinutes = currentRecord.activities.reduce((acc, act) => {
            const studyMinutes = act.studies.reduce((sAcc, s) => sAcc + (s.hours * 60) + s.minutes, 0);
            return acc + (act.hours * 60) + act.minutes + studyMinutes;
        }, 0);
        return totalMinutes / 60;
    }, [currentRecord]);

    const totalStudiesCompleted = useMemo(() => {
        if (!currentRecord) return 0;
        // Count unique students across all activities in the month
        const studentNames = new Set<string>();
        currentRecord.activities.forEach(act => {
            act.studies.forEach(s => studentNames.add(s.name.toLowerCase().trim()));
        });
        return studentNames.size;
    }, [currentRecord]);

    const handleSaveGoal = async (data: Partial<PioneerRecord>) => {
        if (!user) return;
        try {
            if (currentRecord) {
                await updatePioneerRecord(currentRecord.id, {
                    ...data,
                    isAuxiliaryPioneer: data.role === 'Pioneiro Auxiliar',
                }, user.uid);
            } else {
                await addPioneerRecord({
                    month: selectedMonth,
                    activities: [],
                    role: data.role || 'Publicador',
                    goalHours: data.goalHours || 0,
                    studentCount: data.studentCount || 0,
                    isAuxiliaryPioneer: data.role === 'Pioneiro Auxiliar',
                }, user.uid);
            }
            await loadData();
            setIsGoalModalOpen(false);
            setToastMessage('Configurações salvas!');
        } catch (error) {
            console.error('Error saving goal:', error);
            setToastMessage('Erro ao salvar.');
        }
    };

    const handleAddOrUpdateActivity = async (activity: PioneerActivity) => {
        if (!user || !currentRecord) return;
        try {
            let updatedActivities = [...currentRecord.activities];
            if (editingActivity) {
                updatedActivities = updatedActivities.map(a => a.id === editingActivity.id ? activity : a);
            } else {
                updatedActivities.push(activity);
            }
            await updatePioneerRecord(currentRecord.id, { activities: updatedActivities }, user.uid);
            await loadData();
            setIsActivityModalOpen(false);
            setEditingActivity(null);
            setToastMessage('Registro salvo!');
        } catch (error) {
            console.error('Error saving activity:', error);
            setToastMessage('Erro ao salvar.');
        }
    };

    const handleDeleteActivity = async (activityId: string) => {
        if (!user || !currentRecord) return;
        if (!confirm('Deseja excluir este registro?')) return;
        try {
            const updatedActivities = currentRecord.activities.filter(a => a.id !== activityId);
            await updatePioneerRecord(currentRecord.id, { activities: updatedActivities }, user.uid);
            await loadData();
            setToastMessage('Registro excluído.');
        } catch (error) {
            console.error('Error deleting activity:', error);
        }
    };

    const handleSubmitMonthlyReport = async () => {
        if (!user || !profile) return;
        
        const isPioneer = profile.isRegularPioneer || profile.isAuxiliaryPioneer;
        
        if (!isPioneer && participated === null) {
            alert('Por favor, informe se participou da congregação.');
            return;
        }

        if (isPioneer && !reportHours) {
            alert('Campo Horas é obrigatório para pioneiros.');
            return;
        }

        const [yearStr, monthNum] = selectedMonth.split('-');
        const monthName = MONTHS[parseInt(monthNum) - 1];

        try {
            await addMonthlyReport({
                userId: user.uid,
                userName: profile.name || user.displayName || 'Publicador',
                month: monthName,
                year: parseInt(yearStr),
                hours: reportHours || 0,
                studies: reportStudies,
                revisits: 0,
                publications: 0,
                hasParticipated: participated ?? true,
                notes: `Relatório gerado via aba Pioneiro.`,
                status: 'Enviado'
            } as any, user.uid);
            
            setToastMessage('Relatório mensal enviado com sucesso!');
            setView('hub');
        } catch (error) {
            console.error('Error submitting monthly report:', error);
            setToastMessage('Erro ao enviar relatório.');
        }
    };

    const handleShare = async () => {
        if (!currentRecord) return;

        const monthName = new Date(selectedMonth + '-01').toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        let report = `📄 *Relatório de Serviço - ${monthName}*\n`;
        report += `--------------------------------\n`;
        report += `*Participante:* ${profile?.name || user?.displayName || 'N/A'}\n`;
        report += `*Modalidade:* ${currentRecord.role}\n`;
        report += `*Estudantes:* ${totalStudiesCompleted}\n\n`;

        report += `*Resumo de Horas:*\n`;
        report += `- Alvo Mensal: ${currentRecord.goalHours}h\n`;
        report += `- Total Realizado: ${totalHoursCompleted.toFixed(1)}h\n\n`;

        report += `*Detalhes da Atividade:*\n`;
        currentRecord.activities.sort((a, b) => a.date.localeCompare(b.date)).forEach(act => {
            const dateObj = new Date(act.date);
            const day = dateObj.getDate();
            const weekday = dateObj.toLocaleString('pt-BR', { weekday: 'short' });
            report += `${day} (${weekday}): ${act.hours}h ${act.minutes}m`;
            report += `\n`;
        });

        report += `\n--------------------------------\n`;
        report += `Gerado pelo App de Gestão`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Relatório de Serviço - ${monthName}`,
                    text: report,
                });
            } else {
                await navigator.clipboard.writeText(report);
                alert('Relatório copiado!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Header */}
            <div className="bg-primary p-4 sm:p-6 shadow-lg">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    {view !== 'hub' && (
                        <button onClick={() => setView('hub')} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                            <ChevronLeftIcon className="h-6 w-6" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-white">Pioneiro</h1>
                        <p className="text-xs text-blue-100 opacity-80">Gestão de horas e relatórios</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Month Selector */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CalendarDaysIcon className="h-5 w-5 text-primary" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                            {new Date(selectedMonth + '-01').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0 cursor-pointer"
                    />
                </div>

                {view === 'hub' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Option 1: Relatar Horas */}
                        <button 
                            onClick={() => setView('daily')}
                            className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-transparent hover:border-primary transition-all group"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <CalendarDaysIcon className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Relatar Horas</h3>
                            <p className="text-sm text-slate-500 text-center mt-2">Registre sua atividade diária de pregação e estudos.</p>
                        </button>

                        {/* Option 2: Criar Relatório */}
                        <button 
                            onClick={() => {
                                setView('report');
                                // Pre-fill with daily log totals if available
                                if (currentRecord) {
                                    setReportHours(Math.floor(totalHoursCompleted));
                                    setReportStudies(totalStudiesCompleted);
                                }
                            }}
                            className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-transparent hover:border-emerald-500 transition-all group"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <DocumentTextIcon className="h-8 w-8 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Criar Relatório</h3>
                            <p className="text-sm text-slate-500 text-center mt-2">Fechamento mensal para entrega à congregação.</p>
                        </button>
                    </div>
                )}

                {view === 'daily' && (
                    <div className="space-y-6 animate-fade-in">
                        {!currentRecord ? (
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl text-center space-y-4 border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                    <PlusIcon className="h-10 w-10 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nenhum planejamento</h3>
                                    <p className="text-sm text-slate-500">Comece definindo seu alvo para este mês.</p>
                                </div>
                                <button onClick={() => setIsGoalModalOpen(true)} className="btn-primary w-full max-w-xs mx-auto">
                                    Configurar Mês
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Alvo</p>
                                        <p className="text-xl font-black text-primary">{currentRecord.goalHours}h</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                                        <p className="text-xl font-black text-emerald-500">{totalHoursCompleted.toFixed(1)}h</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Estudos</p>
                                        <p className="text-xl font-black text-indigo-500">{totalStudiesCompleted}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingActivity(null); setIsActivityModalOpen(true); }} className="flex-1 btn-primary flex items-center justify-center gap-2 py-3">
                                        <PlusIcon className="h-5 w-5" /> Novo Registro
                                    </button>
                                    <button onClick={handleShare} className="p-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors">
                                        <ShareIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => setIsGoalModalOpen(true)} className="p-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors">
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* List */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                        <h4 className="font-bold text-slate-800 dark:text-white">Registros do Mês</h4>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {currentRecord.activities.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-sm italic">Nenhum registro ainda.</div>
                                        ) : (
                                            currentRecord.activities
                                                .sort((a, b) => b.date.localeCompare(a.date))
                                                .map(act => (
                                                    <div key={act.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center">
                                                                <span className="text-xs font-bold text-slate-400 leading-none">{new Date(act.date).toLocaleString('pt-BR', { weekday: 'short' }).toUpperCase()}</span>
                                                                <span className="text-sm font-black text-slate-700 dark:text-slate-200">{new Date(act.date).getDate()}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800 dark:text-white">{act.hours}h {act.minutes}m</p>
                                                                <p className="text-xs text-slate-500">{act.studies.length} estudos registrados</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => { setEditingActivity(act); setIsActivityModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary"><PencilIcon className="h-4 w-4"/></button>
                                                            <button onClick={() => handleDeleteActivity(act.id)} className="p-2 text-slate-400 hover:text-red-500"><TrashIcon className="h-4 w-4"/></button>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {view === 'report' && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 space-y-6 animate-fade-in">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Fechamento Mensal</h3>
                            <p className="text-sm text-slate-500 mt-1">Confirme os dados para enviar à congregação.</p>
                        </div>

                        <div className="space-y-4">
                            {/* Publisher Name (Read-only for self) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Publicador</label>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700">
                                    {profile?.name || user?.displayName || 'N/A'}
                                </div>
                            </div>

                            {/* Participation (Only for non-pioneers) */}
                            {!(profile?.isRegularPioneer || profile?.isAuxiliaryPioneer) && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Participou da Congregação?</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setParticipated(true)}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${participated === true ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                                        >
                                            <CheckIcon className="h-5 w-5" /> Sim
                                        </button>
                                        <button 
                                            onClick={() => setParticipated(false)}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${participated === false ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                                        >
                                            <XMarkIcon className="h-5 w-5" /> Não
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Studies Quantity */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Estudos Bíblicos (Quantidade)</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="number" 
                                        value={reportStudies} 
                                        onChange={(e) => setReportStudies(parseInt(e.target.value) || 0)}
                                        className="input-style flex-1"
                                    />
                                    <div className="flex gap-1">
                                        <button onClick={() => setReportStudies(Math.max(0, reportStudies - 1))} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">-</button>
                                        <button onClick={() => setReportStudies(reportStudies + 1)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">+</button>
                                    </div>
                                </div>
                            </div>

                            {/* Hours Totals */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                {(profile?.isRegularPioneer || profile?.isAuxiliaryPioneer) && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800 mb-4">
                                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Status de Pioneiro</p>
                                        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                                            {profile.isRegularPioneer ? 'Pioneiro Regular' : 'Pioneiro Auxiliar'}
                                        </p>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">
                                        Horas Totais {!(profile?.isRegularPioneer || profile?.isAuxiliaryPioneer) && '(Opcional)'}
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="number" 
                                            value={reportHours} 
                                            onChange={(e) => setReportHours(parseInt(e.target.value) || 0)}
                                            className="input-style flex-1"
                                            placeholder={!(profile?.isRegularPioneer || profile?.isAuxiliaryPioneer) ? "Opcional para publicadores" : "Total de horas"}
                                        />
                                        <div className="flex gap-1">
                                            <button onClick={() => setReportHours(Math.max(0, reportHours - 1))} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">-</button>
                                            <button onClick={() => setReportHours(reportHours + 1)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">+</button>
                                        </div>
                                    </div>
                                    {currentRecord && (
                                        <p className="text-[10px] text-slate-400 mt-1 italic">* Baseado em {totalHoursCompleted.toFixed(1)}h registradas no log diário.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button 
                                onClick={handleSubmitMonthlyReport}
                                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary-dark hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                <DocumentTextIcon className="h-6 w-6" /> Enviar Relatório Final
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <GoalModal 
                isOpen={isGoalModalOpen} 
                onClose={() => setIsGoalModalOpen(false)} 
                onSave={handleSaveGoal} 
                initialData={currentRecord} 
            />
            <ActivityModal 
                isOpen={isActivityModalOpen} 
                onClose={() => setIsActivityModalOpen(false)} 
                onSave={handleAddOrUpdateActivity} 
                initialData={editingActivity}
            />
            
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </div>
    );
};

// --- Sub-components (Modals) ---

const GoalModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: (data: Partial<PioneerRecord>) => void, initialData: PioneerRecord | null}> = ({ isOpen, onClose, onSave, initialData }) => {
    const [goalHours, setGoalHours] = useState('');
    const [role, setRole] = useState<'Publicador' | 'Pioneiro Auxiliar' | 'Pioneiro Regular'>('Publicador');
    const [studentCount, setStudentCount] = useState('0');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setGoalHours(String(initialData.goalHours));
                setRole(initialData.role);
                setStudentCount(String(initialData.studentCount || 0));
            } else {
                setGoalHours('');
                setRole('Publicador');
                setStudentCount('0');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
                <h4 className="text-xl font-black mb-6 text-center text-slate-800 dark:text-white">Configurar Mês</h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Alvo de Horas</label>
                        <input type="number" value={goalHours} onChange={(e) => setGoalHours(e.target.value)} placeholder="Ex: 50" className="input-style w-full" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Modalidade</label>
                        <select value={role} onChange={(e) => setRole(e.target.value as any)} className="select-style w-full">
                            <option>Publicador</option>
                            <option>Pioneiro Auxiliar</option>
                            <option>Pioneiro Regular</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button onClick={() => onSave({ goalHours: parseInt(goalHours, 10), role, studentCount: parseInt(studentCount, 10) })} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const ActivityModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: (activity: PioneerActivity) => void, initialData: PioneerActivity | null}> = ({ isOpen, onClose, onSave, initialData }) => {
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [studies, setStudies] = useState<{id: string, name: string, hours: number, minutes: number}[]>([]);
    const [newStudentName, setNewStudentName] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setDate(initialData.date);
                setHours(initialData.hours);
                setMinutes(initialData.minutes);
                setStudies(initialData.studies);
            } else {
                setDate(new Date().toISOString().split('T')[0]);
                setHours(0);
                setMinutes(0);
                setStudies([]);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
                <h4 className="text-xl font-black mb-6 text-center text-slate-800 dark:text-white">{initialData ? 'Editar Registro' : 'Novo Registro'}</h4>
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Data</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-style w-full" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Horas</label>
                            <input type="number" value={hours} onChange={e => setHours(parseInt(e.target.value) || 0)} className="input-style w-full" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Minutos</label>
                            <input type="number" value={minutes} onChange={e => setMinutes(parseInt(e.target.value) || 0)} className="input-style w-full" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estudos Bíblicos</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newStudentName} 
                                onChange={e => setNewStudentName(e.target.value)} 
                                placeholder="Nome do estudante" 
                                className="input-style flex-1"
                            />
                            <button 
                                onClick={() => {
                                    if (newStudentName) {
                                        setStudies([...studies, { id: Date.now().toString(), name: newStudentName, hours: 0, minutes: 0 }]);
                                        setNewStudentName('');
                                    }
                                }}
                                className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                            >
                                <PlusIcon className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            {studies.map(s => (
                                <div key={s.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.name}</span>
                                    <button onClick={() => setStudies(studies.filter(st => st.id !== s.id))} className="text-rose-500">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button 
                        onClick={() => onSave({ id: initialData?.id || Date.now().toString(), date, hours, minutes, studies })} 
                        className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pioneer;
