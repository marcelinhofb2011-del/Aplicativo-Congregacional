import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
    getMonthlyReports, 
    addMonthlyReport, 
    updateMonthlyReport, 
    getPublisherProfileByUid,
    getPioneerRecordsByUser 
} from '../services/firestoreService';
import { MonthlyFieldServiceReport, PublisherProfile, PioneerRecord } from '../types';
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
    const [pioneerRecords, setPioneerRecords] = useState<PioneerRecord[]>([]);
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
            const [reportsData, profileData, pioneerData] = await Promise.all([
                getMonthlyReports(user.uid),
                getPublisherProfileByUid(user.uid),
                getPioneerRecordsByUser(user.uid)
            ]);
            const sortedReports = reportsData.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month);
            });
            setReports(sortedReports);
            setProfile(profileData);
            setPioneerRecords(pioneerData);
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
                    alert("Você já enviou o relatório deste mês.");
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
                    pioneerRecords={pioneerRecords}
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
    pioneerRecords: PioneerRecord[];
}> = ({ isOpen, onClose, onSave, initialData, isPioneer, pioneerRecords }) => {
    const [month, setMonth] = useState(initialData?.month || MONTHS[new Date().getMonth()]);
    const [year, setYear] = useState(initialData?.year || new Date().getFullYear());
    const [hours, setHours] = useState<number | ''>(initialData?.hours ?? '');
    const [studies, setStudies] = useState<number | ''>(initialData?.studies ?? '');
    const [revisits, setRevisits] = useState<number | ''>(initialData?.revisits ?? '');
    const [publications, setPublications] = useState<number | ''>(initialData?.publications ?? '');
    const [hasParticipated, setHasParticipated] = useState(initialData?.hasParticipated ?? true);
    const [notes, setNotes] = useState(initialData?.notes || '');

    const currentPioneerRecord = useMemo(() => {
        const monthIndex = MONTHS.indexOf(month) + 1;
        const monthStr = `${year}-${String(monthIndex).padStart(2, '0')}`;
        return pioneerRecords.find(r => r.month === monthStr);
    }, [month, year, pioneerRecords]);

    const registeredHours = useMemo(() => {
        if (!currentPioneerRecord) return 0;
        const totalMinutes = currentPioneerRecord.activities.reduce((acc, act) => {
            const studyMinutes = act.studies.reduce((sAcc, s) => sAcc + (s.hours * 60) + s.minutes, 0);
            return acc + (act.hours * 60) + act.minutes + studyMinutes;
        }, 0);
        return totalMinutes / 60;
    }, [currentPioneerRecord]);

    const goalPercentage = useMemo(() => {
        if (!currentPioneerRecord || currentPioneerRecord.goalHours === 0) return 0;
        return (registeredHours / currentPioneerRecord.goalHours) * 100;
    }, [registeredHours, currentPioneerRecord]);

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

                    {isPioneer && currentPioneerRecord && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Resumo do Planejamento</p>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Horas registradas:</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{registeredHours.toFixed(1)}h</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                                <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(goalPercentage, 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-right text-slate-500 mt-1">{goalPercentage.toFixed(1)}% da meta ({currentPioneerRecord.goalHours}h)</p>
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
