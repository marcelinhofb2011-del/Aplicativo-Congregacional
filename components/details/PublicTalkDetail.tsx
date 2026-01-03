import React from 'react';
import { PublicTalkSchedule } from '../../types';
import { PhoneIcon } from '../icons/Icons';
import { REVERSE_PUBLIC_TALK_THEMES } from '../../utils/publicTalksHelper';

interface PublicTalkDetailProps {
    schedule: PublicTalkSchedule;
}

const DetailCardSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary mb-3">{title}</h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const DetailCardItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-semibold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
);


const PublicTalkDetail: React.FC<PublicTalkDetailProps> = ({ schedule }) => {
    const formattedDate = new Date(schedule.date).toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
    
    return (
        <div id={`talk-card-content-${schedule.id}`} className="p-6 space-y-6 bg-white dark:bg-slate-800">
             <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-wide">DESIGNAÇÃO DE DISCURSO</h2>
            </div>
            <DetailCardSection title="Identificação">
                <DetailCardItem label="Tipo de discurso" value={schedule.type === 'local' ? 'Discurso Local' : 'Discurso Fora'} />
                <DetailCardItem label="Número do esboço" value={REVERSE_PUBLIC_TALK_THEMES[schedule.theme] || 'N/A'} />
                <DetailCardItem label="Tema do discurso" value={schedule.theme} />
            </DetailCardSection>
            <DetailCardSection title="Designação">
                <DetailCardItem label="Irmão designado" value={schedule.speakerName} />
                <DetailCardItem label="Função" value="Orador" />
            </DetailCardSection>
            <DetailCardSection title="Informações do Evento">
                <DetailCardItem label="Data" value={`${formattedDate} às ${schedule.time}`} />
                <DetailCardItem label="Congregação" value={schedule.congregation} />
                {schedule.type === 'away' && schedule.address && (
                    <DetailCardItem label="Local" value={schedule.address} />
                )}
                {schedule.phone && (
                    <DetailCardItem
                        label="Telefone (Contato)"
                        value={
                            <a href={`tel:${schedule.phone}`} className="inline-flex items-center gap-2 group text-primary hover:underline">
                                <span>{schedule.phone}</span>
                                <PhoneIcon className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
                            </a>
                        }
                    />
                )}
            </DetailCardSection>
            {schedule.notes && (
                <DetailCardSection title="Observações">
                   <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{schedule.notes}</p>
                </DetailCardSection>
            )}
        </div>
    );
};

export default PublicTalkDetail;
