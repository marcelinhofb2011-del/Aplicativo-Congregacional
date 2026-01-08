
import React, { useState, useEffect, useMemo } from 'react';
import { FieldServiceReport, UserRole } from '../types';
import { getReports, updateReport, archiveReport } from '../services/firestoreService';
import { useAuth } from '../hooks/useAuth';
import ReportDetailModal from '../components/ReportDetailModal';
import ReportFormModal from '../components/ReportFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import { MagnifyingGlassIcon, FilterIcon, PencilIcon, TrashIcon, CalendarDaysIcon } from '../components/icons/Icons';
import ReportSummary from '../components/ReportSummary';

const ReportList: React.FC = () => {
    const { user } = useAuth();
    const isServant = user?.role === UserRole.SERVANT;
    const [reports, setReports] = useState<FieldServiceReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });
    
    // State for modals
    const [selectedReport, setSelectedReport] = useState<FieldServiceReport | null>(null); // For detail view
    const [editingReport, setEditingReport] = useState<FieldServiceReport | null>(null); // For form modal
    const [reportToDelete, setReportToDelete] = useState<FieldServiceReport | null>(null); // For confirmation
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const fetchedReports = await getReports();
            setReports(fetchedReports);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
            setToastMessage('Erro ao carregar relatórios.');
        } finally {
            setIsLoading(false);
        }
    };

    const uniqueGroups = ['all', '1', '2', '3'];
    
    const filteredReports = useMemo(() => {
        return reports
            .filter(r => {
                 const reportDate = new Date(r.date);
                 const reportMonth = `${reportDate.getUTCFullYear()}-${String(reportDate.getUTCMonth() + 1).padStart(2, '0')}`;
                 return reportMonth === selectedMonth;
            })
            .filter(report => report.publisherName.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(report => selectedGroup === 'all' || report.group === selectedGroup);
    }, [reports, searchTerm, selectedGroup, selectedMonth]);

    const summaryData = useMemo(() => {
        const statsByGroup: {
            [key: string]: {
                pioneerHours: number;
                pioneerCount: Set<string>;
                studies: number;
            }
        } = {};

        for (const report of filteredReports) {
            if (!report.group) continue;
            if (!statsByGroup[report.group]) {
                statsByGroup[report.group] = { pioneerHours: 0, pioneerCount: new Set(), studies: 0 };
            }
            
            // Regra: Soma os estudos de TODOS os relatórios (pioneiros e publicadores).
            statsByGroup[report.group].studies += report.studies || 0;
            
            // Regra: Soma as horas APENAS de relatórios com privilégio de 'PIONEER'.
            // Relatórios de publicadores não contribuem para este total de horas.
            if (report.privilege === 'PIONEER') {
                const hours = (report.hours || 0) + ((report.minutes || 0) / 60);
                statsByGroup[report.group].pioneerHours += hours;
                statsByGroup[report.group].pioneerCount.add(report.publisherId);
            }
        }
        
        const groupSummaries = Object.keys(statsByGroup).sort().map(groupKey => {
            const groupStats = statsByGroup[groupKey];
            const pioneerCount = groupStats.pioneerCount.size;
            return {
                group: groupKey,
                pioneerHours: groupStats.pioneerHours,
                pioneerAverage: pioneerCount > 0 ? groupStats.pioneerHours / pioneerCount : 0,
                studies: groupStats.studies
            };
        });

        const totalPioneerHours = groupSummaries.reduce((sum, g) => sum + g.pioneerHours, 0);
        const totalStudies = groupSummaries.reduce((sum, g) => sum + g.studies, 0);
        
        const totalPioneersInFilteredSet = Object.values(statsByGroup).reduce((set, stats) => {
            stats.pioneerCount.forEach(id => set.add(id));
            return set;
        }, new Set<string>()).size;

        const overallAverage = totalPioneersInFilteredSet > 0 ? totalPioneerHours / totalPioneersInFilteredSet : 0;

        return { groupSummaries, totalPioneerHours, totalStudies, overallAverage };
    }, [filteredReports]);
    
    const handleEdit = (report: FieldServiceReport) => {
        setEditingReport(report);
    };

    const handleDelete = (report: FieldServiceReport) => {
        setReportToDelete(report);
    };

    const handleSave = async (formData: Partial<FieldServiceReport>) => {
        if (!editingReport || !user) return;
        try {
            await updateReport(editingReport.id, formData, user.uid);
            setToastMessage('Relatório atualizado com sucesso!');
            fetchReports();
        } catch (error) {
            setToastMessage('Erro ao atualizar relatório.');
        } finally {
            setEditingReport(null);
        }
    };
    
    const confirmDelete = async () => {
        if (reportToDelete && user) {
            try {
                await archiveReport(reportToDelete.id, user.uid);
                setToastMessage('Relatório excluído com sucesso.');
                fetchReports();
            } catch (error) {
                setToastMessage('Erro ao excluir relatório.');
            } finally {
                setReportToDelete(null);
            }
        }
    };

    return (
        <>
            <div className="bg-primary p-4 sm:p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-white">Pasta de Relatórios</h2>
                <p className="mt-1 text-blue-100">Visualize e filtre todos os relatórios enviados.</p>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                        <input 
                            type="text"
                            placeholder="Buscar por nome..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                        />
                    </div>
                    <div className="relative">
                        <CalendarDaysIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none" />
                         <input 
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                        />
                    </div>
                    <div className="relative">
                        <FilterIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                        <select
                            value={selectedGroup}
                            onChange={e => setSelectedGroup(e.target.value)}
                            className="w-full appearance-none pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                        >
                            {uniqueGroups.map(group => (
                                <option key={group} value={group}>
                                    {group === 'all' ? 'Todos os Grupos' : `Grupo ${group}`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <ReportSummary data={summaryData} isLoading={isLoading} />

                <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden">
                   {isLoading ? (
                        <p className="p-4 text-center">Carregando relatórios...</p>
                   ) : (
                     <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredReports.length > 0 ? filteredReports.map(report => (
                            <li key={report.id} className="p-4 group hover:bg-slate-50 dark:hover:bg-slate-700/50 flex justify-between items-center">
                                <div className="cursor-pointer flex-grow" onClick={() => setSelectedReport(report)}>
                                    <p className="font-semibold text-primary">{report.publisherName}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Grupo: {report.group} | Data: {new Date(report.date).toLocaleDateString('pt-BR', {timeZone:'UTC'})}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isServant && (
                                        <>
                                            <button onClick={() => handleEdit(report)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                            <button onClick={() => handleDelete(report)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                                        </>
                                    )}
                                </div>
                            </li>
                        )) : (
                            <li className="p-6 text-center text-slate-500 dark:text-slate-400">
                               Nenhum relatório corresponde aos filtros.
                            </li>
                        )}
                    </ul>
                   )}
                </div>
            </div>
            
            <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
            
            {editingReport && (
                <ReportFormModal
                    isOpen={!!editingReport}
                    onClose={() => setEditingReport(null)}
                    onSave={handleSave}
                    initialData={editingReport}
                />
            )}
            
            <ConfirmationModal
                isOpen={!!reportToDelete}
                onClose={() => setReportToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir o relatório de ${reportToDelete?.publisherName}?`}
            />

            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </>
    );
};

export default ReportList;