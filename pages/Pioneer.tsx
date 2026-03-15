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
    XMarkIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    UserIcon,
    ChevronRightIcon as ChevronRightIconSolid
} from '../components/icons/Icons';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell,
    LineChart,
    Line
} from 'recharts';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const Pioneer: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState<'hub' | 'daily' | 'report' | 'analysis'>('hub');
    const [viewHistory, setViewHistory] = useState<string[]>(['hub']);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
    const [records, setRecords] = useState<PioneerRecord[]>([]);
    const [profile, setProfile] = useState<PublisherProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');

    const navigateTo = (newView: 'hub' | 'daily' | 'report' | 'analysis') => {
        setViewHistory(prev => [...prev, newView]);
        setView(newView);
    };

    const handleBack = () => {
        if (viewHistory.length > 1) {
            const newHistory = [...viewHistory];
            newHistory.pop(); // Remove current view
            const prevView = newHistory[newHistory.length - 1] as any;
            setViewHistory(newHistory);
            setView(prevView);
        } else {
            setView('hub');
            setViewHistory(['hub']);
        }
    };

    // Daily Log States
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<PioneerActivity | null>(null);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

    // Monthly Report States
    const [participated, setParticipated] = useState<boolean | null>(null);
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
            return acc + (act.hours * 60) + act.minutes;
        }, 0);
        return totalMinutes / 60;
    }, [currentRecord]);

    const progressStats = useMemo(() => {
        if (!currentRecord || currentRecord.goalHours <= 0) return null;

        const [year, month] = selectedMonth.split('-').map(Number);
        const now = new Date();
        const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
        const isPastMonth = now.getFullYear() > year || (now.getFullYear() === year && (now.getMonth() + 1) > month);
        
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        
        let daysRemaining = 0;
        let currentDay = lastDayOfMonth;

        if (isCurrentMonth) {
            currentDay = now.getDate();
            daysRemaining = (lastDayOfMonth - currentDay) + 1; // Including today
        } else if (isPastMonth) {
            currentDay = lastDayOfMonth;
            daysRemaining = 0;
        } else {
            currentDay = 0;
            daysRemaining = lastDayOfMonth;
        }

        const remainingHours = Math.max(0, currentRecord.goalHours - totalHoursCompleted);
        const dailyAverageNeeded = daysRemaining > 0 ? remainingHours / daysRemaining : 0;

        // Status calculation
        const progressPercent = (totalHoursCompleted / currentRecord.goalHours) * 100;
        const timePercent = (currentDay / lastDayOfMonth) * 100;
        
        let status: 'Ruim' | 'Bom' | 'Ótimo' = 'Bom';
        let statusColor = 'text-amber-500';
        let statusBg = 'bg-amber-500/10';

        if (progressPercent >= 100) {
            status = 'Ótimo';
            statusColor = 'text-emerald-500';
            statusBg = 'bg-emerald-500/10';
        } else if (progressPercent >= timePercent + 5) {
            status = 'Ótimo';
            statusColor = 'text-emerald-500';
            statusBg = 'bg-emerald-500/10';
        } else if (progressPercent >= timePercent - 10) {
            status = 'Bom';
            statusColor = 'text-blue-500';
            statusBg = 'bg-blue-500/10';
        } else {
            status = 'Ruim';
            statusColor = 'text-rose-500';
            statusBg = 'bg-rose-500/10';
        }

        return {
            remainingHours,
            dailyAverageNeeded,
            daysRemaining,
            status,
            statusColor,
            statusBg,
            progressPercent,
            timePercent
        };
    }, [currentRecord, totalHoursCompleted, selectedMonth]);

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
        if (!user) return;
        if (!profile) {
            setToastMessage('Perfil não encontrado. Por favor, complete seu cadastro nas configurações.');
            return;
        }
        
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
            // 1. Save to Firestore for congregation records
            await addMonthlyReport({
                userId: user.uid,
                userName: profile.name || user.displayName || 'Publicador',
                month: monthName,
                year: parseInt(yearStr),
                hours: reportHours || 0,
                studies: currentRecord?.studentCount || 0,
                revisits: 0,
                publications: 0,
                hasParticipated: participated ?? true,
                notes: `Relatório gerado via aba Pioneiro.`,
                status: 'Enviado'
            } as any, user.uid);
            
            // 2. Generate share text for WhatsApp
            let shareText = `📋 *Relatório de Serviço de Campo*\n`;
            shareText += `--------------------------------\n`;
            shareText += `*Mês:* ${monthName} / ${yearStr}\n`;
            shareText += `*Publicador:* ${profile.name || user.displayName || 'N/A'}\n`;
            
            if (isPioneer) {
                shareText += `*Privilégio:* ${profile.isRegularPioneer ? 'Pioneiro Regular' : 'Pioneiro Auxiliar'}\n`;
                shareText += `*Horas:* ${reportHours}h\n`;
            } else {
                shareText += `*Participou:* ${participated ? 'Sim' : 'Não'}\n`;
                if (reportHours > 0) shareText += `*Horas:* ${reportHours}h\n`;
            }
            
            if (currentRecord?.studentCount && currentRecord.studentCount > 0) {
                shareText += `*Estudos Bíblicos:* ${currentRecord.studentCount}\n`;
            }
            
            shareText += `--------------------------------\n`;
            shareText += `Gerado pelo App de Gestão`;

            setToastMessage('Relatório salvo com sucesso!');

            // 3. Trigger Share Dialog
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `Relatório - ${monthName}/${yearStr}`,
                        text: shareText
                    });
                } catch (err) {
                    console.log('Share cancelled or failed', err);
                }
            } else {
                await navigator.clipboard.writeText(shareText);
                alert('Relatório salvo e copiado! Agora você pode colar no WhatsApp do irmão responsável.');
            }
            
            navigateTo('hub');
        } catch (error) {
            console.error('Error submitting monthly report:', error);
            setToastMessage('Erro ao enviar relatório.');
        }
    };

    const handleShare = async () => {
        if (!currentRecord) return;

        const [year, month] = selectedMonth.split('-').map(Number);
        const monthName = new Date(year, month - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        let report = `📄 *Relatório de Serviço - ${monthName}*\n`;
        report += `--------------------------------\n`;
        report += `*Participante:* ${profile?.name || user?.displayName || 'N/A'}\n`;
        report += `*Modalidade:* ${currentRecord.role}\n\n`;

        report += `*Resumo de Horas:*\n`;
        report += `- Alvo Mensal: ${currentRecord.goalHours}h\n`;
        report += `- Total Realizado: ${totalHoursCompleted.toFixed(1)}h\n\n`;

        report += `*Detalhes da Atividade:*\n`;
        currentRecord.activities.sort((a, b) => a.date.localeCompare(b.date)).forEach(act => {
            const dateObj = new Date(act.date + 'T12:00:00');
            const day = dateObj.getDate();
            const weekday = dateObj.toLocaleString('pt-BR', { weekday: 'short' });
            report += `${day} (${weekday}): ${act.hours}h ${act.minutes}m - ${act.category || 'Pregação'}`;
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

    // Analysis Calculations
    const annualStats = useMemo(() => {
        const yearRecords = records.filter(r => r.month.startsWith(String(selectedYear)) && r.createdBy === user?.uid);
        
        const monthlyData = MONTHS.map((name, index) => {
            const monthStr = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
            const record = yearRecords.find(r => r.month === monthStr);
            
            let hours = 0;
            if (record) {
                const totalMinutes = record.activities.reduce((acc, act) => {
                    return acc + (act.hours * 60) + act.minutes;
                }, 0);
                hours = totalMinutes / 60;
            }
            
            return { name: name.substring(0, 3), fullMonth: name, hours, monthStr };
        });

        const totalHours = monthlyData.reduce((acc, m) => acc + m.hours, 0);
        const activeMonths = monthlyData.filter(m => m.hours > 0).length;
        const averageHours = activeMonths > 0 ? totalHours / activeMonths : 0;

        // Calculate average hours per year across all years
        const allYears = Array.from(new Set(records.map(r => r.month.split('-')[0])));
        const yearlyTotals = allYears.map(year => {
            const yearRecs = records.filter(r => r.month.startsWith(year) && r.createdBy === user?.uid);
            return yearRecs.reduce((acc, r) => {
                const mins = r.activities.reduce((a, act) => a + (act.hours * 60) + act.minutes, 0);
                return acc + (mins / 60);
            }, 0);
        });
        const averageYearlyHours = yearlyTotals.length > 0 
            ? yearlyTotals.reduce((a, b) => a + b, 0) / yearlyTotals.length 
            : 0;

        return { monthlyData, totalHours, averageHours, activeMonths, averageYearlyHours };
    }, [records, selectedYear, user]);

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
                        <button onClick={handleBack} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
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
                            {(() => {
                                const [year, month] = selectedMonth.split('-').map(Number);
                                return new Date(year, month - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                            })()}
                        </span>
                    </div>
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0 cursor-pointer"
                    />
                </div>

                {!profile && !loading && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl border border-amber-100 dark:border-amber-800 flex flex-col items-center text-center space-y-4">
                        <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Perfil Incompleto</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-400">Você precisa configurar seu perfil de publicador para enviar relatórios.</p>
                        </div>
                        <button 
                            onClick={() => navigate('/configuracoes')}
                            className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
                        >
                            Configurar Agora
                        </button>
                    </div>
                )}

                {view === 'hub' && (
                    <div className="space-y-4">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total no Mês</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{totalHoursCompleted.toFixed(1)}h</p>
                            </div>
                            <button 
                                onClick={() => setIsGoalModalOpen(true)}
                                className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-left hover:border-primary transition-all relative group"
                            >
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alvo Mensal</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-2xl font-black text-primary">{currentRecord?.goalHours || 0}h</p>
                                    <PencilIcon className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1">Toque para alterar</p>
                            </button>
                        </div>

                        {progressStats && (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Progresso do Mês</h4>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${progressStats.statusBg} ${progressStats.statusColor}`}>
                                        Status: {progressStats.status}
                                    </span>
                                </div>
                                
                                <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000"
                                        style={{ width: `${Math.min(100, progressStats.progressPercent)}%` }}
                                    />
                                    {progressStats.daysRemaining > 0 && (
                                        <div 
                                            className="absolute top-0 h-full w-0.5 bg-slate-400/30 z-10"
                                            style={{ left: `${progressStats.timePercent}%` }}
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <ArrowTrendingUpIcon className="h-4 w-4 text-indigo-500" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Média Necessária</p>
                                        </div>
                                        <p className="text-lg font-black text-slate-800 dark:text-white">
                                            {progressStats.dailyAverageNeeded.toFixed(1)}h<span className="text-xs font-medium text-slate-400">/dia</span>
                                        </p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <CalendarDaysIcon className="h-4 w-4 text-amber-500" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Faltam</p>
                                        </div>
                                        <p className="text-lg font-black text-slate-800 dark:text-white">
                                            {progressStats.remainingHours.toFixed(1)}h
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action List */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                            <button 
                                onClick={() => navigateTo('daily')}
                                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CalendarDaysIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-800 dark:text-white">Relatar Horas</h3>
                                        <p className="text-xs text-slate-500">Registre sua atividade diária</p>
                                    </div>
                                </div>
                                <ChevronRightIconSolid className="h-5 w-5 text-slate-300" />
                            </button>

                            <button 
                                onClick={() => {
                                    navigateTo('report');
                                    if (currentRecord) {
                                        setReportHours(Math.floor(totalHoursCompleted));
                                    }
                                }}
                                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <DocumentTextIcon className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-800 dark:text-white">Criar Relatório</h3>
                                        <p className="text-xs text-slate-500">Fechamento mensal para a congregação</p>
                                    </div>
                                </div>
                                <ChevronRightIconSolid className="h-5 w-5 text-slate-300" />
                            </button>

                            <button 
                                onClick={() => navigateTo('analysis')}
                                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ChartBarIcon className="h-6 w-6 text-indigo-500" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-800 dark:text-white">Análise e Comparação</h3>
                                        <p className="text-xs text-slate-500">Progresso mensal e anual com gráficos</p>
                                    </div>
                                </div>
                                <ChevronRightIconSolid className="h-5 w-5 text-slate-300" />
                            </button>
                        </div>
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
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Alvo Mensal</p>
                                        <p className="text-xl font-black text-primary">{currentRecord.goalHours}h</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Realizado</p>
                                        <p className="text-xl font-black text-emerald-500">{totalHoursCompleted.toFixed(1)}h</p>
                                    </div>
                                    {progressStats && (
                                        <>
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Faltam</p>
                                                <p className="text-xl font-black text-amber-500">{progressStats.remainingHours.toFixed(1)}h</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Média Diária</p>
                                                <p className="text-xl font-black text-indigo-500">{progressStats.dailyAverageNeeded.toFixed(1)}h</p>
                                            </div>
                                        </>
                                    )}
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
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <h4 className="font-bold text-slate-800 dark:text-white">Registros do Mês</h4>
                                        <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                            {currentRecord.activities.length} {currentRecord.activities.length === 1 ? 'dia' : 'dias'}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {currentRecord.activities.length === 0 ? (
                                            <div className="p-10 text-center">
                                                <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <CalendarDaysIcon className="h-6 w-6 text-slate-300" />
                                                </div>
                                                <p className="text-slate-400 text-sm italic">Nenhum registro ainda.</p>
                                            </div>
                                        ) : (
                                            currentRecord.activities
                                                .sort((a, b) => b.date.localeCompare(a.date))
                                                .map(act => (
                                                    <div key={act.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                                                <span className="text-[10px] font-bold text-slate-400 leading-none mb-0.5">{new Date(act.date + 'T12:00:00').toLocaleString('pt-BR', { weekday: 'short' }).toUpperCase()}</span>
                                                                <span className="text-base font-black text-slate-700 dark:text-slate-200">{new Date(act.date + 'T12:00:00').getDate()}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800 dark:text-white text-lg">{act.hours}h {act.minutes}m</p>
                                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{act.category || 'Pregação'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => { setEditingActivity(act); setIsActivityModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"><PencilIcon className="h-4 w-4"/></button>
                                                            <button onClick={() => handleDeleteActivity(act.id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><TrashIcon className="h-4 w-4"/></button>
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
                                <ShareIcon className="h-6 w-6" /> Salvar e Compartilhar
                            </button>
                        </div>
                    </div>
                )}

                {view === 'analysis' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Year Selector */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CalendarDaysIcon className="h-5 w-5 text-indigo-500" />
                                <span className="font-bold text-slate-700 dark:text-slate-200">Ano de {selectedYear}</span>
                            </div>
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-transparent border-none text-sm font-bold text-indigo-500 focus:ring-0 cursor-pointer"
                            >
                                {[0, 1, 2].map(offset => {
                                    const year = new Date().getFullYear() - offset;
                                    return <option key={year} value={year}>{year}</option>;
                                })}
                            </select>
                        </div>

                        {/* Annual Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                        <ChartBarIcon className="h-5 w-5 text-indigo-500" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Anual</p>
                                </div>
                                <p className="text-3xl font-black text-slate-800 dark:text-white">{annualStats.totalHours.toFixed(1)}h</p>
                                <p className="text-xs text-slate-500 mt-1">Soma de todos os meses</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                        <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Média Mensal</p>
                                </div>
                                <p className="text-3xl font-black text-slate-800 dark:text-white">{annualStats.averageHours.toFixed(1)}h</p>
                                <p className="text-xs text-slate-500 mt-1">Considerando meses ativos</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 col-span-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <CalendarDaysIcon className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Média Anual (Histórico)</p>
                                </div>
                                <p className="text-3xl font-black text-slate-800 dark:text-white">{annualStats.averageYearlyHours.toFixed(1)}h</p>
                                <p className="text-xs text-slate-500 mt-1">Média de horas totais por ano registrado</p>
                            </div>
                        </div>

                        {/* Monthly Chart */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-6">Comparativo Mensal</h4>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={annualStats.monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ 
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                backgroundColor: '#1e293b',
                                                color: '#fff'
                                            }}
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                            labelStyle={{ display: 'none' }}
                                        />
                                        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                                            {annualStats.monthlyData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.hours > 0 ? '#6366f1' : '#f1f5f9'} 
                                                    className="transition-all duration-300"
                                                    onClick={() => {
                                                        setSelectedMonth(entry.monthStr);
                                                        navigateTo('daily');
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[10px] text-center text-slate-400 mt-4 italic">Toque em uma barra para ver os detalhes do mês.</p>
                        </div>

                        {/* Monthly List Breakdown */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="font-bold text-slate-800 dark:text-white">Detalhamento por Mês</h4>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {annualStats.monthlyData.map(m => (
                                    <div 
                                        key={m.monthStr} 
                                        onClick={() => {
                                            setSelectedMonth(m.monthStr);
                                            navigateTo('daily');
                                        }}
                                        className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${m.hours > 0 ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                {m.name}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">{m.fullMonth}</p>
                                                <p className="text-xs text-slate-500">{m.hours.toFixed(1)} horas registradas</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {m.hours > 0 && (
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            )}
                                            <ChevronLeftIcon className="h-4 w-4 text-slate-300 rotate-180" />
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                        <input 
                            type="number" 
                            value={goalHours} 
                            onChange={(e) => setGoalHours(e.target.value)} 
                            placeholder="Ex: 50" 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-slate-800 dark:text-white font-bold" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Modalidade</label>
                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value as any)} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-slate-800 dark:text-white font-bold"
                        >
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
    const getTodayStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const [date, setDate] = useState(getTodayStr);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [category, setCategory] = useState<'Pregação' | 'Estudos' | 'Outra'>('Pregação');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setDate(initialData.date);
                setHours(initialData.hours);
                setMinutes(initialData.minutes);
                setCategory(initialData.category || 'Pregação');
            } else {
                setDate(getTodayStr());
                setHours(0);
                setMinutes(0);
                setCategory('Pregação');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
                <h4 className="text-xl font-black mb-6 text-center text-slate-800 dark:text-white">{initialData ? 'Editar Registro' : 'Novo Registro'}</h4>
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Data</label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-slate-800 dark:text-white font-bold" 
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Modalidade</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Pregação', 'Estudos', 'Outra'] as const).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all border-2 ${
                                        category === cat 
                                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' 
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Horas</label>
                            <input 
                                type="number" 
                                value={hours} 
                                onChange={e => setHours(parseInt(e.target.value) || 0)} 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-slate-800 dark:text-white font-bold" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Minutos</label>
                            <input 
                                type="number" 
                                value={minutes} 
                                onChange={e => setMinutes(parseInt(e.target.value) || 0)} 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-slate-800 dark:text-white font-bold" 
                            />
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button 
                        onClick={() => onSave({ id: initialData?.id || Date.now().toString(), date, hours, minutes, category, studies: [] })} 
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
