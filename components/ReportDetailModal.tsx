
import React from 'react';
import { FieldServiceReport } from '../types';
import { XIcon } from './icons/Icons';

interface ReportDetailModalProps {
    report: FieldServiceReport | null;
    onClose: () => void;
}

const DetailItem: React.FC<{ label: string, value: any }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-md text-slate-800 dark:text-slate-200">{value}</p>
    </div>
);


const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose }) => {
    if (!report) return null;

    const privilegeText = report.privilege === 'PIONEER' ? 'Pioneiro(a)' : 'Publicador';
    const submittedAtDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(report.submittedAt));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Detalhes do Relatório</h3>
                    <button onClick={onClose}><XIcon className="h-6 w-6 text-slate-500" /></button>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <DetailItem label="Publicador" value={report.publisherName} />
                        <DetailItem label="Grupo" value={report.group} />
                        <DetailItem label="Data" value={new Date(report.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} />
                        <DetailItem label="Privilégio" value={privilegeText} />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-md">
                        {report.privilege === 'PIONEER' ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <DetailItem label="Horas" value={report.hours || 0} />
                                <DetailItem label="Minutos" value={report.minutes || 0} />
                                <DetailItem label="Revisitas" value={report.revisits || 0} />
                                <DetailItem label="Estudos" value={report.studies || 0} />
                            </div>
                        ) : (
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <DetailItem label="Participou?" value={report.hasParticipated ? 'Sim' : 'Não'} />
                                {report.hasParticipated && <>
                                    <DetailItem label="Revisitas" value={report.revisits || 0} />
                                    <DetailItem label="Estudos" value={report.studies || 0} />
                                </>}
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-4">
                        <DetailItem label="Observações" value={<span className="italic">{report.notes || 'Nenhuma.'}</span>} />
                    </div>
                     <div className="mt-4 border-t pt-4">
                        <DetailItem label="Enviado em" value={submittedAtDate} />
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 text-right rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default ReportDetailModal;