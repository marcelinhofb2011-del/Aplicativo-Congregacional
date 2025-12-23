import React, { useState, useEffect, useMemo } from 'react';
import { FieldServiceReport } from '../types';
import { getReports, updateReport, archiveReport } from '../services/firestoreService';
import { useAuth } from '../hooks/useAuth';
import ReportDetailModal from '../components/ReportDetailModal';
import ReportFormModal from '../components/ReportFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import { MagnifyingGlassIcon, FilterIcon, PencilIcon, TrashIcon } from '../components/icons/Icons';

const ReportList: React.FC = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<FieldServiceReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('all');
    
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
            .filter(report => report.publisherName.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(report => selectedGroup === 'all' || report.group === selectedGroup);
    }, [reports, searchTerm, selectedGroup]);
    
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
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Pasta de Relatórios</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Visualize e filtre todos os relatórios enviados.</p>
            
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

            <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden">
               {isLoading ? (
                    <p className="p-4 text-center">Carregando relatórios...</p>
               ) : (
                 <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredReports.map(report => (
                        <li key={report.id} className="p-4 group hover:bg-slate-50 dark:hover:bg-slate-700/50 flex justify-between items-center">
                            <div className="cursor-pointer flex-grow" onClick={() => setSelectedReport(report)}>
                                <p className="font-semibold text-primary">{report.publisherName}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Grupo: {report.group} | Data: {new Date(report.date).toLocaleDateString('pt-BR', {timeZone:'UTC'})}
                                </p>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(report)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                <button onClick={() => handleDelete(report)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                            </div>
                        </li>
                    ))}
                </ul>
               )}
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
        </div>
    );
};

export default ReportList;