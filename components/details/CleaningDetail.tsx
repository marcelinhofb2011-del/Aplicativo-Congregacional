
import React from 'react';
import { CleaningSchedule, MeetingDay } from '../../types';
import { CLEANING_GROUPS } from '../../constants';

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-white">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const DetailItem: React.FC<{ label: string; value?: React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-md text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{value || '-'}</p>
    </div>
);

const meetingDayLabels: Record<MeetingDay, string> = {
    midweek: 'Meio de semana',
    weekend: 'Fim de semana',
};


const CleaningDetail: React.FC<{ schedule: CleaningSchedule }> = ({ schedule }) => {
    const formattedStartDate = new Date(schedule.date).toLocaleDateString('pt-BR', { dateStyle: 'long', timeZone: 'UTC' });
    const formattedEndDate = new Date(schedule.endDate).toLocaleDateString('pt-BR', { dateStyle: 'long', timeZone: 'UTC' });
    const formattedMeetingDays = schedule.meetingDays.map(day => meetingDayLabels[day]).join(', ');

    return (
        <div className="max-w-2xl mx-auto">
            <DetailSection title="Detalhes da Escala de Limpeza">
                <DetailItem label="Período" value={`${formattedStartDate} a ${formattedEndDate}`} fullWidth />
                <DetailItem label="Dias de Reunião" value={formattedMeetingDays} fullWidth />
                <DetailItem 
                    label="Grupo Responsável" 
                    value={`${schedule.group}: ${CLEANING_GROUPS[schedule.group]}`} 
                    fullWidth 
                />
                <DetailItem label="Observações" value={schedule.notes} fullWidth />
            </DetailSection>
        </div>
    );
};

export default CleaningDetail;
