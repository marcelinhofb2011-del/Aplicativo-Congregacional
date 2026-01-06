
import React, { useState, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { AttendanceRecord, UserRole } from '../types';
import { getAttendanceRecords, updateAttendanceRecord, archiveAttendanceRecord } from '../services/firestoreService';
import { useAuth } from '../hooks/useAuth';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import AttendanceFormModal from '../components/AttendanceFormModal';
import ScheduleAccordion from '../components/ScheduleAccordion';
import AttendanceReportPDF from '../components/reports/AttendanceReportPDF';
import { PencilIcon, TrashIcon, DocumentChartBarIcon, ArrowDownTrayIcon } from '../components/icons/Icons';

const AttendanceList: React.FC = () => {
    const { user } = useAuth();
    const isServant = user?.role === UserRole.SERVANT;
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
    const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    
    // State for analysis
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(true);
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
        const startDate = new Date(Date.UTC(startYear, startMonth - 1, 1));
        const endDate = new Date(Date.UTC(endYear, endMonth, 0)); // Last day of the end month

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
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
            if (!monthlyData[key]) {
                monthlyData[key] = { total: 0, count: 0, monthLabel: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) };
            }
            monthlyData[key].total += r.totalCount;
            monthlyData[key].count++;
        });
        
        const monthlyBreakdown = Object.values(monthlyData).map(m => ({
            month: m.monthLabel,
            total: m.total,
            average: parseFloat((m.total / m.count).toFixed(2)),
            meetings: m.count,
        })).reverse();
        
        const totalMeetings = filtered.length;
        const totalAttendance = filtered.reduce((sum, r) => sum + r.totalCount, 0);
        const overallAverage = parseFloat((totalAttendance / totalMeetings).toFixed(2));
        const peakAttendance = Math.max(...filtered.map(r => r.totalCount));

        return {
            summary: { totalMeetings, overallAverage, peakAttendance },
            monthlyBreakdown,
        };
    }, [records, analysisPeriod]);


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
                await archiveAttendanceRecord(recordToDelete.id, user.uid);
                setToastMessage('Registro arquivado com sucesso.');
                fetchRecords();
            } catch (error) {
                setToastMessage('Erro ao arquivar o registro.');
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
            <div className="bg-[#65a30d] p-4 sm:p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-white">Pasta de Assistência</h2>
                <p className="mt-1 text-lime-100">Lista de todos os registros de assistência.</p>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
                {isServant && (
                    <div className="mb-6">
                        <ScheduleAccordion
                            isOpen={isAnalysisOpen}
                            onToggle={() => setIsAnalysisOpen(!isAnalysisOpen)}
                            title={
                                <div className="flex items-center gap-2">
                                    <DocumentChartBarIcon className="h-6 w-6 text-primary" />
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Análise de Assistência</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Clique para expandir e ver as estatísticas</p>
                                    </div>
                                </div>
                            }
                        >
                            <div className="p-4 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                    <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">De</label>
                                            <input type="month" value={analysisPeriod.start} onChange={e => setAnalysisPeriod(p => ({ ...p, start: e.target.value }))} className="input-style mt-1" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Até</label>
                                            <input type="month" value={analysisPeriod.end} onChange={e => setAnalysisPeriod(p => ({ ...p, end: e.target.value }))} className="input-style mt-1" />
                                        </div>
                                    </div>
                                     <button onClick={handleExportPDF} disabled={isGeneratingPDF} className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:bg-primary/50">
                                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                        {isGeneratingPDF ? 'Exportando...' : 'Exportar para PDF'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                    <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-md"><p className="text-sm text-slate-500">Total de Reuniões</p><p className="text-2xl font-bold">{analysisData.summary.totalMeetings}</p></div>
                                    <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-md"><p className="text-sm text-slate-500">Média Geral</p><p className="text-2xl font-bold">{analysisData.summary.overallAverage}</p></div>
                                    <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-md"><p className="text-sm text-slate-500">Pico de Assistência</p><p className="text-2xl font-bold">{analysisData.summary.peakAttendance}</p></div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-slate-700 dark:text-slate-300">
                                            <tr><th className="px-4 py-2">Mês</th><th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-right">Média</th><th className="px-4 py-2 text-right">Reuniões</th></tr>
                                        </thead>
                                        <tbody>
                                            {analysisData.monthlyBreakdown.map(m => (
                                                <tr key={m.month} className="border-b dark:border-slate-700"><td className="px-4 py-2 font-medium">{m.month}</td><td className="px-4 py-2 text-right">{m.total}</td><td className="px-4 py-2 text-right font-bold">{m.average}</td><td className="px-4 py-2 text-right">{m.meetings}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </ScheduleAccordion>
                    </div>
                )}
                
                {isLoading ? <p className="text-center p-6">Carregando registros...</p> : (
                    <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden">
                       <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                            {records.length > 0 ? records.map(record => (
                                <li key={record.id} className="p-4 group hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                        <div className="mb-2 sm:mb-0">
                                            <p className="font-bold text-primary">{formatDate(record.date)}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Enviado por: {record.submitterName}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-4 text-center">
                                                <div><p className="text-sm text-slate-500">Presentes</p><p className="font-semibold text-lg">{record.presentCount}</p></div>
                                                <div><p className="text-sm text-slate-500">Online</p><p className="font-semibold text-lg">{record.onlineCount}</p></div>
                                                <div className="border-l pl-4"><p className="text-sm text-slate-500">Total</p><p className="font-bold text-2xl text-slate-900 dark:text-white">{record.totalCount}</p></div>
                                            </div>
                                            {isServant && (
                                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(record)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                                    <button onClick={() => handleDelete(record)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            )) : (
                                 <li className="p-6 text-center text-slate-500 dark:text-slate-400">Nenhum registro de assistência encontrado.</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>

            {isFormModalOpen && (
                <AttendanceFormModal isOpen={isFormModalOpen} onClose={handleCloseModal} onSave={handleSave} initialData={editingRecord} />
            )}

            <ConfirmationModal isOpen={!!recordToDelete} onClose={() => setRecordToDelete(null)} onConfirm={confirmDelete} title="Confirmar Arquivamento" message={`Tem certeza que deseja arquivar o registro de assistência de ${recordToDelete ? formatDate(recordToDelete.date) : ''}?`} />

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
