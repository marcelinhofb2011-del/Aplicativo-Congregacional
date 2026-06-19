
import React, { useState, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { AttendanceRecord, UserRole } from '../types';
import { getAttendanceRecords, updateAttendanceRecord, deleteAttendanceRecord } from '../services/firestoreService';
import { useAuth } from '../hooks/useAuth';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import AttendanceFormModal from '../components/AttendanceFormModal';
import ScheduleAccordion from '../components/ScheduleAccordion';
import AttendanceReportPDF from '../components/reports/AttendanceReportPDF';
import { PencilIcon, TrashIcon, DocumentChartBarIcon, ArrowDownTrayIcon, CalendarDaysIcon } from '../components/icons/Icons';

const AttendanceList: React.FC = () => {
    const { user } = useAuth();
    const isServant = user?.role === UserRole.SERVANT;
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
    const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    
    // State for viewing tabs: 'records' (Registry folder list) or 'analysis' (Semiannual stats and export)
    const [activeTab, setActiveTab] = useState<'records' | 'analysis'>('records');

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [analysisPeriod, setAnalysisPeriod] = useState(() => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setUTCMonth(endDate.getUTCMonth() - 5);
        startDate.setUTCDate(1);
        return {
            start: `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, '0')}`,
            end: `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, '0')}`,
        };
    });

    useEffect(() => {
        fetchRecords();
    }, []);
    
    const analysisData = useMemo(() => {
        const [startYear, startMonth] = analysisPeriod.start.split('-').map(Number);
        const [endYear, endMonth] = analysisPeriod.end.split('-').map(Number);
        const startDate = new Date(Date.UTC(startYear, startMonth - 1, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(endYear, endMonth, 0, 23, 59, 59, 999)); // Last millisecond of the end month

        const filtered = records.filter(r => {
            const recordDate = new Date(r.date);
            return recordDate >= startDate && recordDate <= endDate;
        });

        if (filtered.length === 0) {
            return { summary: { totalMeetings: 0, overallAverage: 0, peakAttendance: 0 }, monthlyBreakdown: [] };
        }

        const monthlyData: { [key: string]: { total: number, count: number, monthLabel: string } } = {};
        
        filtered.forEach(r => {
            const d = new Date(r.date);
            const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[key]) {
                monthlyData[key] = { total: 0, count: 0, monthLabel: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) };
            }
            monthlyData[key].total += r.totalCount;
            monthlyData[key].count++;
        });
        
        const sortedMonthKeys = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));
        const monthlyBreakdown = sortedMonthKeys.map(key => {
            const m = monthlyData[key];
            return {
                month: m.monthLabel.charAt(0).toUpperCase() + m.monthLabel.slice(1),
                total: m.total,
                average: parseFloat((m.total / m.count).toFixed(2)),
                meetings: m.count,
            };
        });
        
        const totalMeetings = filtered.length;
        const totalAttendance = filtered.reduce((sum, r) => sum + r.totalCount, 0);
        const overallAverage = parseFloat((totalAttendance / totalMeetings).toFixed(2));
        const peakAttendance = Math.max(...filtered.map(r => r.totalCount));

        return {
            summary: { totalMeetings, overallAverage, peakAttendance },
            monthlyBreakdown,
        };
    }, [records, analysisPeriod]);

    // Group records by month state & useMemo
    const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});

    const groupedRecords = useMemo(() => {
        const groups: {
            [key: string]: {
                year: number;
                month: number;
                monthLabel: string;
                records: AttendanceRecord[];
                totalCountSum: number;
                average: number;
            }
        } = {};

        records.forEach(r => {
            if (!r.date) return;
            const d = new Date(r.date);
            const year = d.getUTCFullYear();
            const month = d.getUTCMonth(); // 0-11
            const key = `${year}-${String(month + 1).padStart(2, '0')}`;
            
            if (!groups[key]) {
                const monthLabel = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                groups[key] = {
                    year,
                    month,
                    monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
                    records: [],
                    totalCountSum: 0,
                    average: 0
                };
            }
            
            groups[key].records.push(r);
            groups[key].totalCountSum += r.totalCount;
        });

        const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a)); // Newest month first
        
        return sortedKeys.map(key => {
            const group = groups[key];
            group.records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            group.average = parseFloat((group.totalCountSum / group.records.length).toFixed(1));
            return {
                key,
                ...group
            };
        });
    }, [records]);

    // Automatically expand the newest month group on initial load
    useEffect(() => {
        if (groupedRecords.length > 0 && Object.keys(expandedGroups).length === 0) {
            setExpandedGroups({ [groupedRecords[0].key]: true });
        }
    }, [groupedRecords, expandedGroups]);

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const formatDateCompact = (dateString: string) => {
        const d = new Date(dateString);
        const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
        const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
        const dayAndMonth = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
        return `${capitalizedWeekday}, ${dayAndMonth}`;
    };


    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const data = await getAttendanceRecords();
            setRecords(data);
        } catch (error) {
            console.error("Failed to fetch attendance records:", error);
            setToastMessage('Erro ao carregar registros.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(dateString));
    };

    const handleEdit = (record: AttendanceRecord) => {
        setEditingRecord(record);
        setIsFormModalOpen(true);
    };

    const handleDelete = (record: AttendanceRecord) => {
        setRecordToDelete(record);
    };
    
    const handleCloseModal = () => {
        setEditingRecord(null);
        setIsFormModalOpen(false);
    };

    const handleSave = async (formData: Omit<AttendanceRecord, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!editingRecord || !user) return;
        try {
            await updateAttendanceRecord(editingRecord.id, formData, user.uid);
            setToastMessage('Registro atualizado com sucesso!');
            fetchRecords();
        } catch (error) {
            setToastMessage('Erro ao atualizar o registro.');
        } finally {
            handleCloseModal();
        }
    };

    const confirmDelete = async () => {
        if (recordToDelete && user) {
            try {
                await deleteAttendanceRecord(recordToDelete.id);
                setToastMessage('Registro excluído com sucesso.');
                fetchRecords();
            } catch (error) {
                setToastMessage('Erro ao excluir o registro.');
            } finally {
                setRecordToDelete(null);
            }
        }
    };
    
    const handleExportPDF = async () => {
        setIsGeneratingPDF(true);
        const reportElement = document.getElementById('pdf-attendance-report');
        if (!reportElement) {
            setToastMessage('Erro ao encontrar o conteúdo para exportar.');
            setIsGeneratingPDF(false);
            return;
        }

        try {
            const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true });
            const dataUrl = canvas.toDataURL('image/png');
            
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `Relatorio_Assistencia_${analysisPeriod.start}_a_${analysisPeriod.end}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setToastMessage('Relatório exportado como imagem!');
        } catch (error) {
            console.error("PDF generation error:", error);
            setToastMessage('Falha ao exportar relatório.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };


    return (
        <>
            <div className="bg-primary p-4 sm:p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-white">Pasta de Assistência</h2>
                <p className="mt-1 text-amber-100">Lista de todos os registros de assistência.</p>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
                {/* Elegant, rounded top tab control */}
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-6 gap-1 max-w-md">
                    <button
                        type="button"
                        onClick={() => setActiveTab('records')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold rounded-xl transition-all ${
                            activeTab === 'records'
                                ? 'bg-white dark:bg-slate-800 text-primary-dark dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <CalendarDaysIcon className="h-5 w-5" />
                        Histórico
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('analysis')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold rounded-xl transition-all ${
                            activeTab === 'analysis'
                                ? 'bg-white dark:bg-slate-800 text-primary-dark dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <DocumentChartBarIcon className="h-5 w-5" />
                        Análise de Assistência
                    </button>
                </div>

                {/* Tab content 1: Histórico */}
                {activeTab === 'records' && (
                    <>
                        {isLoading ? (
                            <p className="text-center p-6 text-slate-500 dark:text-slate-400">Carregando registros...</p>
                        ) : (
                            <div className="space-y-4 animate-fade-in-up">
                                {groupedRecords.length > 0 ? (
                                    groupedRecords.map(group => {
                                        const isExpanded = !!expandedGroups[group.key];
                                        return (
                                            <div key={group.key} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden transition-all duration-200">
                                                <button 
                                                    type="button"
                                                    onClick={() => toggleGroup(group.key)}
                                                    className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors border-b border-dashed border-slate-200/50 dark:border-slate-700/50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 transition-colors">
                                                            <svg className={`h-4.5 w-4.5 text-primary-dark dark:text-slate-200 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">{group.monthLabel}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">Clique para {isExpanded ? 'recolher' : 'expandir'}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap items-center gap-2 sm:self-center">
                                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                            {group.records.length} {group.records.length === 1 ? 'Reunião' : 'Reuniões'}
                                                        </span>
                                                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#fdf2e9] dark:bg-amber-950/30 text-amber-900 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/20">
                                                            Média: {group.average}
                                                        </span>
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="p-2 sm:p-4 bg-slate-50/50 dark:bg-slate-900/10 divide-y divide-slate-100 dark:divide-slate-800/60">
                                                        {group.records.map(record => (
                                                            <div key={record.id} className="py-3 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/10 rounded-xl gap-3 transition-all group">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                                        {formatDateCompact(record.date)}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                                                                        Enviado por: {record.submitterName}
                                                                    </p>
                                                                </div>
                                                                
                                                                <div className="flex items-center justify-between sm:justify-end gap-6">
                                                                    <div className="flex items-center gap-4 text-center">
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pres.</p>
                                                                            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{record.presentCount}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">On.</p>
                                                                            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{record.onlineCount}</p>
                                                                        </div>
                                                                        <div className="border-l border-slate-200 dark:border-slate-700/60 pl-4">
                                                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Total</p>
                                                                            <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">{record.totalCount}</p>
                                                                        </div>
                                                                    </div>

                                                                    {isServant && (
                                                                        <div className="flex items-center space-x-0.5 sm:opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => handleEdit(record)} 
                                                                                title="Editar registro"
                                                                                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors"
                                                                            >
                                                                                <PencilIcon className="h-4 w-4" />
                                                                            </button>
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => handleDelete(record)} 
                                                                                title="Excluir de vez"
                                                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-lg transition-colors"
                                                                            >
                                                                                <TrashIcon className="h-4 w-4" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center border border-slate-200/60 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                                        Nenhum registro de assistência encontrado.
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Tab content 2: Análise de assistência */}
                {activeTab === 'analysis' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/60 dark:border-slate-700/60 space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-700/50 gap-4">
                                <div>
                                    <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2 font-outfit">
                                        <DocumentChartBarIcon className="h-6 w-6 text-emerald-500" />
                                        Métricas & Relatórios de Assistência
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                                        Selecione o intervalo de datas para calcular médias de reunião e gerar relatórios completos.
                                    </p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleExportPDF} 
                                    disabled={isGeneratingPDF} 
                                    className="inline-flex items-center justify-center px-5 py-3 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 rounded-xl shadow-md hover:shadow-lg transition-all"
                                >
                                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                    {isGeneratingPDF ? 'Exportando...' : 'Exportar Relatório'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold tracking-[0.1em] text-slate-400 dark:text-slate-500 uppercase font-sans">
                                        Mês de Início
                                    </label>
                                    <input 
                                        type="month" 
                                        value={analysisPeriod.start} 
                                        onChange={e => setAnalysisPeriod(p => ({ ...p, start: e.target.value }))} 
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-sans" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold tracking-[0.1em] text-slate-400 dark:text-slate-500 uppercase font-sans">
                                        Mês de Término
                                    </label>
                                    <input 
                                        type="month" 
                                        value={analysisPeriod.end} 
                                        onChange={e => setAnalysisPeriod(p => ({ ...p, end: e.target.value }))} 
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-sans" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-sans">Reuniões no Período</p>
                                    <p className="text-3xl font-black text-slate-700 dark:text-slate-200 mt-1 font-outfit">{analysisData.summary.totalMeetings}</p>
                                </div>
                                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/20 p-4 rounded-2xl">
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider font-sans">Média Geral</p>
                                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-outfit">{analysisData.summary.overallAverage}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-sans">Pico de Presença</p>
                                    <p className="text-3xl font-black text-slate-700 dark:text-slate-200 mt-1 font-outfit">{analysisData.summary.peakAttendance}</p>
                                </div>
                            </div>

                            <div className="overflow-hidden border border-slate-200/50 dark:border-slate-700/50 rounded-2xl">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/50 dark:border-slate-700/50">
                                        <tr>
                                            <th className="px-5 py-3 font-sans">Mês / Ano</th>
                                            <th className="px-5 py-3 text-right font-sans">Total Assistência</th>
                                            <th className="px-5 py-3 text-right font-sans">Média Mensal</th>
                                            <th className="px-5 py-3 text-right font-sans">Num. Reuniões</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800">
                                        {analysisData.monthlyBreakdown.map(m => (
                                            <tr key={m.month} className="hover:bg-slate-50/40 dark:hover:bg-slate-700/25 transition-all">
                                                <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300 font-sans">{m.month}</td>
                                                <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-400 font-sans">{m.total}</td>
                                                <td className="px-5 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">{m.average}</td>
                                                <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-400 font-sans">{m.meetings}</td>
                                            </tr>
                                        ))}
                                        {analysisData.monthlyBreakdown.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-slate-400 font-sans">
                                                    Nenhum dado encontrado para o período selecionado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isFormModalOpen && (
                <AttendanceFormModal isOpen={isFormModalOpen} onClose={handleCloseModal} onSave={handleSave} initialData={editingRecord} />
            )}

            <ConfirmationModal isOpen={!!recordToDelete} onClose={() => setRecordToDelete(null)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir permanentemente o registro de assistência de ${recordToDelete ? formatDate(recordToDelete.date) : ''}?`} />

            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
            
            {/* Hidden component for PDF generation */}
            <div className="absolute -left-[9999px] top-0 opacity-0">
                <div id="pdf-attendance-report">
                    <AttendanceReportPDF data={analysisData} period={analysisPeriod} />
                </div>
            </div>
        </>
    );
};

export default AttendanceList;