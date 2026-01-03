import React from 'react';
import { ChartBarIcon } from './icons/Icons';

interface GroupSummary {
    group: string;
    pioneerHours: number;
    pioneerAverage: number;
    studies: number;
}

interface SummaryData {
    groupSummaries: GroupSummary[];
    totalPioneerHours: number;
    totalStudies: number;
    overallAverage: number;
}

interface ReportSummaryProps {
    data: SummaryData;
    isLoading: boolean;
}

const SummaryCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
        <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-300 mb-2">{title}</h4>
        <div className="space-y-2">{children}</div>
    </div>
);

const SummaryItem: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline text-sm">
        <span className="text-slate-500 dark:text-slate-400">{label}:</span>
        <span className="font-bold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
);


const ReportSummary: React.FC<ReportSummaryProps> = ({ data, isLoading }) => {
    if (isLoading) {
        return <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg h-48 w-full mb-6"></div>;
    }

    const hasData = data.groupSummaries.length > 0 && (data.totalPioneerHours > 0 || data.totalStudies > 0);

    return (
        <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
                <ChartBarIcon className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Resumo Mensal</h3>
            </div>
            
            {!hasData ? (
                 <p className="text-slate-500 dark:text-slate-400 text-center py-8">Nenhum relatório encontrado para o período e filtro selecionados.</p>
            ) : (
                <div className="space-y-6">
                    {data.groupSummaries.length > 1 && (
                        <SummaryCard title="Resumo Geral do Mês">
                            <SummaryItem label="Total de horas (pioneiros)" value={data.totalPioneerHours.toFixed(2)} />
                            <SummaryItem label="Média geral de horas" value={data.overallAverage.toFixed(2)} />
                            <SummaryItem label="Total de estudos" value={data.totalStudies} />
                        </SummaryCard>
                    )}

                    <div>
                        <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-300 mb-2">Resumo Mensal por Grupo</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.groupSummaries.map(summary => (
                                <div key={summary.group} className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg border-l-4 border-primary">
                                    <h5 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Grupo {summary.group}</h5>
                                    <div className="space-y-1">
                                        <SummaryItem label="Horas pioneiros (mês)" value={summary.pioneerHours.toFixed(2)} />
                                        <SummaryItem label="Média mensal de horas" value={summary.pioneerAverage.toFixed(2)} />
                                        <SummaryItem label="Estudos bíblicos (mês)" value={summary.studies} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default ReportSummary;
