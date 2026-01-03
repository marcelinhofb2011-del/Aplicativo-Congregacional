import React from 'react';
import { Assignment } from '../../types';

const DetailItem: React.FC<{ label: string; value?: React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-md text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{value || '-'}</p>
    </div>
);

const AssignmentDetail: React.FC<{ assignment: Assignment }> = ({ assignment }) => {
    const formattedDate = new Date(assignment.date).toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });

    return (
        <div className="p-4 sm:p-6">
            <h3 className="text-xl font-semibold mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-white">
                Designações - {formattedDate}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {assignment.indicator1 && <DetailItem label="👤 Indicador" value={assignment.indicator1} />}
                {assignment.indicator2 && <DetailItem label="👤 Indicador" value={assignment.indicator2} />}
                {assignment.mic1 && <DetailItem label="🎤 Microfone" value={assignment.mic1} />}
                {assignment.mic2 && <DetailItem label="🎤 Microfone" value={assignment.mic2} />}
                {assignment.reader && <DetailItem label="📖 Leitor" value={assignment.reader} />}
                {assignment.audio && <DetailItem label="🎶 Áudio" value={assignment.audio} />}
                {assignment.video && <DetailItem label="🖥️ Vídeo" value={assignment.video} />}
                {assignment.notes && <DetailItem label="Observações" value={assignment.notes} fullWidth />}
            </div>
        </div>
    );
};

export default AssignmentDetail;