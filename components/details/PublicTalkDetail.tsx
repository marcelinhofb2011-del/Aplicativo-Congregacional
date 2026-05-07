
import React from 'react';
import { PublicTalkSchedule } from '../../types';
import { PhoneIcon } from '../icons/Icons';
import { REVERSE_PUBLIC_TALK_THEMES } from '../../utils/publicTalksHelper';

interface PublicTalkDetailProps {
    schedule: PublicTalkSchedule;
}

const DetailItem: React.FC<{ label: string, value: React.ReactNode, fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
    <div className={fullWidth ? 'col-span-2' : ''}>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{label}</p>
        <p className="font-bold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
);

const PublicTalkDetail: React.FC<PublicTalkDetailProps> = ({ schedule }) => {
    const formattedDate = new Date(schedule.date).toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
    
    return (
        <div id={`talk-card-content-${schedule.id}`} className="p-8 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <header className="text-center mb-8">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Congregação Cristã das Testemunhas de Jeová</p>
                <h2 className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">Designação de Discurso Público</h2>
            </header>
            
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold border-b-2 border-slate-300 dark:border-slate-600 pb-2 mb-3 text-slate-700 dark:text-slate-300">Orador</h3>
                    <p className="text-xl">{schedule.speakerName}</p>
                </div>

                <div>
                    <h3 className="text-lg font-semibold border-b-2 border-slate-300 dark:border-slate-600 pb-2 mb-3 text-slate-700 dark:text-slate-300">Tema</h3>
                    <p className="text-xl font-bold">{schedule.theme}</p>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 font-semibold">Esboço Nº {REVERSE_PUBLIC_TALK_THEMES[schedule.theme] || 'N/A'}</p>
                </div>
                
                <div>
                     <h3 className="text-lg font-semibold border-b-2 border-slate-300 dark:border-slate-600 pb-2 mb-3 text-slate-700 dark:text-slate-300">Detalhes do Evento</h3>
                     <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-3">
                        <DetailItem label="Data" value={formattedDate} />
                        <DetailItem label="Hora" value={schedule.time} />
                        <DetailItem label="Congregação" value={schedule.congregation} />
                        <DetailItem label="Usará Imagens?" value={schedule.hasImage ? 'Sim' : 'Não'} />

                        {schedule.type === 'away' && schedule.address && (
                            <DetailItem label="Local" value={schedule.address} fullWidth />
                        )}
                        {schedule.phone && (
                            <DetailItem
                                label="Telefone (Contato)"
                                value={
                                    <a href={`tel:${schedule.phone}`} className="inline-flex items-center gap-2 group text-primary hover:underline">
                                        <span>{schedule.phone}</span>
                                        <PhoneIcon className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
                                    </a>
                                }
                                fullWidth
                            />
                        )}
                     </div>
                </div>

                {schedule.notes && (
                     <div>
                        <h3 className="text-lg font-semibold border-b-2 border-slate-300 dark:border-slate-600 pb-2 mb-3 text-slate-700 dark:text-slate-300">Observações</h3>
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap italic">{schedule.notes}</p>
                    </div>
                )}
            </div>

            <footer className="text-center border-t border-slate-200 dark:border-slate-700 pt-4 mt-8">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-500">Gerado pelo aplicativo congregacional VL Cisper</p>
            </footer>
        </div>
    );
};

export default PublicTalkDetail;
