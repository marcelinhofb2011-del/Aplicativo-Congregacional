import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
    getMonthlyReports, 
    addMonthlyReport, 
    updateMonthlyReport, 
    getPublisherProfileByUid,
    getPioneerDailyRecords,
    getPioneerPlanningConfig
} from '../services/firestoreService';
import { MonthlyFieldServiceReport, PublisherProfile, PioneerDailyRecord, PioneerPlanningConfig } from '../types';
import Layout from '../components/Layout';
import { PlusIcon, PencilIcon, CalendarDaysIcon, DocumentTextIcon } from '../components/icons/Icons';
import Toast from '../components/Toast';

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MonthlyReport: React.FC = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<MonthlyFieldServiceReport[]>([]);
    const [profile, setProfile] = useState<PublisherProfile | null>(null);
    const [dailyRecords, setDailyRecords] = useState<PioneerDailyRecord[]>([]);
    const [planningConfig, setPlanningConfig] = useState<PioneerPlanningConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReport, setEditingReport] = useState<MonthlyFieldServiceReport | null>(null);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [reportsData, profileData, recordsData, configData] = await Promise.all([
                getMonthlyReports(user.uid),
                getPublisherProfileByUid(user.uid),
                getPioneerDailyRecords(user.uid),
                getPioneerPlanningConfig(user.uid)
            ]);
            const sortedReports = reportsData.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month);
            });
            setReports(sortedReports);
            setProfile(profileData);
            setDailyRecords(recordsData || []);
            setPlanningConfig(configData);
        } catch (error) {
            console.error("Error loading report data:", error);
        } finally {
            setLoading(false);
        }
    };

    const isPioneer = useMemo(() => {
        return profile?.isRegularPioneer || profile?.isAuxiliaryPioneer;
    }, [profile]);

    const handleSave = async (data: Partial<MonthlyFieldServiceReport>) => {
        if (!user) return;
        try {
            if (editingReport) {
                await updateMonthlyReport(editingReport.id, { ...data, status: 'Editado' }, user.uid);
                setToastMessage('Relatório atualizado com sucesso!');
            } else {
                // Check uniqueness
                const exists = reports.find(r => r.month === data.month && r.year === data.year);
                if (exists) {
                    setToastMessage("Você já enviou o relatório deste mês.");
                    return;
                }
                await addMonthlyReport({
                    ...data,
                    userId: user.uid,
                    userName: user.displayName || user.email || 'Anônimo',
                    status: 'Enviado'
                }, user.uid);
                setToastMessage('Relatório enviado com sucesso!');
            }
            await loadData();
            setIsModalOpen(false);
            setEditingReport(null);
        } catch (error) {
            console.error("Error saving report:", error);
            setToastMessage('Erro ao salvar relatório.');
        }
    };

    return (
        <Layout title="Relatório Mensal">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Meus Relatórios</h2>
                        <button 
                            onClick={() => { setEditingReport(null); setIsModalOpen(true); }}
                            className="btn-primary flex items-center gap-2"
                        >
                            <PlusIcon className="h-5 w-5" /> Novo Relatório
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <DocumentTextIcon className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">Nenhum relatório enviado ainda.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mês/Ano</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Horas</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estudos</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {reports.map((report) => {
                                            const isCurrentMonth = report.month === MONTHS[new Date().getMonth()] && report.year === new Date().getFullYear();
                                            return (
                                                <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <CalendarDaysIcon className="h-5 w-5 text-slate-400" />
                                                            <span className="text-sm font-medium text-slate-900 dark:text-white">{report.month} {report.year}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{report.hours}h</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{report.studies}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                            report.status === 'Enviado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {report.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        {isCurrentMonth && (
                                                            <button 
                                                                onClick={() => { setEditingReport(report); setIsModalOpen(true); }}
                                                                className="p-2 text-slate-400 hover:text-primary transition-colors"
                                                            >
                                                                <PencilIcon className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <ReportModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                    initialData={editingReport}
                    isPioneer={isPioneer || false}
                    dailyRecords={dailyRecords}
                    planningConfig={planningConfig}
                />
            )}
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </Layout>
    );
};

const ReportModal: React.FC<{
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (data: Partial<MonthlyFieldServiceReport>) => void;
    initialData: MonthlyFieldServiceReport | null;
    isPioneer: boolean;
    dailyRecords: PioneerDailyRecord[];
    planningConfig: PioneerPlanningConfig | null;
}> = ({ isOpen, onClose, onSave, initialData, isPioneer, dailyRecords, planningConfig }) => {
    const [month, setMonth] = useState(initialData?.month || MONTHS[new Date().getMonth()]);
    const [year, setYear] = useState(initialData?.year || new Date().getFullYear());
    const [hours, setHours] = useState<number | ''>(initialData?.hours ?? '');
    const [studies, setStudies] = useState<number | ''>(initialData?.studies ?? '');
    const [revisits, setRevisits] = useState<number | ''>(initialData?.revisits ?? '');
    const [publications, setPublications] = useState<number | ''>(initialData?.publications ?? '');
    const [hasParticipated, setHasParticipated] = useState(initialData?.hasParticipated ?? true);
    const [notes, setNotes] = useState(initialData?.notes || '');

    // Convert month/year into YYYY-MM format
    const selectedMonthStr = useMemo(() => {
        const monthIndex = MONTHS.indexOf(month) + 1;
        return `${year}-${String(monthIndex).padStart(2, '0')}`;
    }, [month, year]);

    // Recalculate daily activity statistics for the selected month dynamically
    const monthlySummary = useMemo(() => {
        const monthRecords = dailyRecords.filter(r => r.date.startsWith(selectedMonthStr));

        let totalMinutes = 0;
        let totalStudiesMax = 0;
        let totalRevisits = 0;
        let totalPublications = 0;

        monthRecords.forEach(r => {
            totalMinutes += (r.hours || 0) * 60 + (r.minutes || 0);
            totalRevisits += r.revisits || 0;
            totalPublications += r.publications || 0;
            totalStudiesMax = Math.max(totalStudiesMax, r.studies || 0);
        });

        const calculatedHours = Number((totalMinutes / 60).toFixed(1));

        return {
            hours: calculatedHours,
            studies: totalStudiesMax,
            revisits: totalRevisits,
            publications: totalPublications,
            hasData: monthRecords.length > 0
        };
    }, [selectedMonthStr, dailyRecords]);

    // Determine the user's monthly goal (either month-specific or general general goal)
    const goalHours = useMemo(() => {
        if (!planningConfig) return 0;
        if (planningConfig.monthGoals && planningConfig.monthGoals[selectedMonthStr] !== undefined) {
            return planningConfig.monthGoals[selectedMonthStr];
        }
        return planningConfig.monthlyGoal || 0;
    }, [selectedMonthStr, planningConfig]);

    const goalPercentage = useMemo(() => {
        if (goalHours === 0) return 0;
        return (monthlySummary.hours / goalHours) * 100;
    }, [monthlySummary.hours, goalHours]);

    // Sync input fields with planning records when month/year changes if editing a brand-new report
    useEffect(() => {
        if (!initialData) {
            setHours(monthlySummary.hours || '');
            setStudies(monthlySummary.studies || '');
            setRevisits(monthlySummary.revisits || '');
            setPublications(monthlySummary.publications || '');
        }
    }, [selectedMonthStr, initialData, monthlySummary]);

    const handleImportFromPlanning = () => {
        setHours(monthlySummary.hours || 0);
        setStudies(monthlySummary.studies || 0);
        setRevisits(monthlySummary.revisits || 0);
        setPublications(monthlySummary.publications || 0);
    };

    const handleSave = () => {
        if (!month || !year || studies === '' || revisits === '' || publications === '') {
            alert('Por favor, preencha os campos obrigatórios.');
            return;
        }
        if (isPioneer && hours === '') {
            alert('Campo Horas é obrigatório para pioneiros.');
            return;
        }
        onSave({ 
            month, 
            year, 
            hours: hours === '' ? undefined : Number(hours), 
            studies: Number(studies), 
            revisits: Number(revisits), 
            publications: Number(publications), 
            hasParticipated,
            notes 
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        {initialData ? 'Editar Relatório' : 'Novo Relatório Mensal'}
                    </h3>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Auto-import alert banner */}
                    {monthlySummary.hasData && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-500/10 p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                            <div className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                                Encontramos registros para <span className="font-extrabold">{month} de {year}</span> no seu Planejamento.
                            </div>
                            <button
                                type="button"
                                onClick={handleImportFromPlanning}
                                className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-sm shadow-amber-500/10"
                            >
                                Importar Dados
                            </button>
                        </div>
                    )}

                    {!isPioneer && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Participou no ministério?</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input type="radio" checked={hasParticipated} onChange={() => setHasParticipated(true)} className="h-4 w-4 text-primary" />
                                    <span className="text-sm">Sim</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" checked={!hasParticipated} onChange={() => setHasParticipated(false)} className="h-4 w-4 text-primary" />
                                    <span className="text-sm">Não</span>
                                </label>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mês *</label>
                            <select value={month} onChange={e => setMonth(e.target.value)} className="select-style w-full">
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ano *</label>
                            <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} className="input-style w-full" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Horas {isPioneer ? '*' : '(Opcional)'}</label>
                        <input type="number" value={hours} onChange={e => setHours(e.target.value === '' ? '' : Number(e.target.value))} className="input-style w-full" placeholder={isPioneer ? "Total de horas do mês" : "Opcional para publicadores"} />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estudos *</label>
                            <input type="number" value={studies} onChange={e => setStudies(e.target.value === '' ? '' : Number(e.target.value))} className="input-style w-full" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Revisitas *</label>
                            <input type="number" value={revisits} onChange={e => setRevisits(e.target.value === '' ? '' : Number(e.target.value))} className="input-style w-full" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Publicações *</label>
                            <input type="number" value={publications} onChange={e => setPublications(e.target.value === '' ? '' : Number(e.target.value))} className="input-style w-full" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-style w-full" rows={2} />
                    </div>

                    {isPioneer && goalHours > 0 && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Resumo do Planejamento</p>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Horas registradas:</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{monthlySummary.hours.toFixed(1)}h</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                                <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(goalPercentage, 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-right text-slate-500 mt-1">{goalPercentage.toFixed(1)}% da meta ({goalHours}h)</p>
                        </div>
                    )}
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button onClick={handleSave} className="btn-primary px-8">Salvar</button>
                </div>
            </div>
        </div>
    );
};

export default MonthlyReport;
