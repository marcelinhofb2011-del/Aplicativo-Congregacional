
import React from 'react';
import { ShepherdingVisit } from '../../types';

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-white">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </div>
);

const DetailItem: React.FC<{ label: string; value?: React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-md text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{value || '-'}</p>
    </div>
);

const ShepherdingDetail: React.FC<{ schedule: ShepherdingVisit }> = ({ schedule }) => {
    const formattedDate = new Date(schedule.date).toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });

    return (
        <div className="max-w-2xl mx-auto">
            <DetailSection title="Detalhes da Visita de Pastoreio">
                <DetailItem label="Irmão(s) Visitado(s)" value={schedule.brotherName} fullWidth />
                <DetailItem label="Data" value={formattedDate} />
                <DetailItem label="Hora" value={schedule.time} />
                <DetailItem label="Irmão Responsável" value={schedule.responsibleElder1} />
                {schedule.responsibleElder2 && <DetailItem label="Irmão Responsável 2" value={schedule.responsibleElder2} />}
                <DetailItem label="Observações" value={schedule.notes} fullWidth />
            </DetailSection>
        </div>
    );
};

export default ShepherdingDetail;
