
import React from 'react';
import { PublicTalkSchedule } from '../../types';
import { ShareIcon } from '../icons/Icons';
import Toast from '../Toast';

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

const PublicTalkDetail: React.FC<{ schedule: PublicTalkSchedule }> = ({ schedule }) => {
    const [toastMessage, setToastMessage] = React.useState('');
    
    const formattedDate = new Date(schedule.date).toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });

    const handleShare = async () => {
        let text = `*Designação de Discurso Público*\n\n`;
        text += `*Tipo:* ${schedule.type === 'local' ? 'Discurso Local' : 'Discurso Fora'}\n`;
        text += `*Data:* ${formattedDate}\n`;
        text += `*Hora:* ${schedule.time}\n\n`;
        text += `*Tema:* ${schedule.theme}\n`;
        text += `*Orador:* ${schedule.speakerName}\n`;
        text += `*Congregação:* ${schedule.congregation}\n`;
        if(schedule.song) text += `*Cântico:* ${schedule.song}\n`;
        text += `*Imagem:* ${schedule.hasImage ? 'Sim' : 'Não'}\n`;
        if(schedule.address) text += `*Endereço:* ${schedule.address}\n`;
        if(schedule.phone) text += `*Telefone:* ${schedule.phone}\n`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Designação de Discurso Público',
                    text: text,
                });
            } else {
                await navigator.clipboard.writeText(text);
                setToastMessage('Designação copiada para a área de transferência!');
            }
        } catch (err) {
            console.error("Erro ao compartilhar:", err);
            setToastMessage('Não foi possível compartilhar a designação.');
        }
    };


    return (
        <div className="max-w-2xl mx-auto">
            <DetailSection title="Detalhes do Discurso Público">
                <DetailItem label="Tipo" value={schedule.type === 'local' ? 'Discurso Local' : 'Discurso Fora'} fullWidth />
                <DetailItem label="Data" value={formattedDate} />
                <DetailItem label="Hora" value={schedule.time} />
                <DetailItem label="Tema do Discurso" value={schedule.theme} fullWidth/>
                <DetailItem label="Orador" value={schedule.speakerName} />
                <DetailItem label="Congregação" value={schedule.congregation} />
                <DetailItem label="Cântico Nº" value={schedule.song} />
                <DetailItem label="Usa Imagem?" value={schedule.hasImage ? 'Sim' : 'Não'} />
                
                {schedule.type === 'away' && (
                    <>
                        <DetailItem label="Endereço" value={schedule.address} fullWidth />
                        <DetailItem 
                            label="Telefone"
                            value={schedule.phone ? <a href={`tel:${schedule.phone}`} className="text-primary hover:underline">{schedule.phone}</a> : '-'} 
                        />
                    </>
                )}
                
                <DetailItem label="Observações" value={schedule.notes} fullWidth />
            </DetailSection>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleShare}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
                >
                    <ShareIcon className="h-5 w-5 mr-2" />
                    Compartilhar
                </button>
            </div>
             <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </div>
    );
};

export default PublicTalkDetail;
