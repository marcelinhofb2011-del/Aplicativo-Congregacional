import React from 'react';
import { Schedule } from '../types';
import { ALL_NAV_ITEMS } from '../constants';
import { MagnifyingGlassIcon } from './icons/Icons';

interface ScheduleCardProps {
    schedule: Schedule;
    onDetailsClick: (schedule: Schedule) => void;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'short',
    }).format(date);
};

// Sub-componente para o indicador de prioridade por data
const PriorityIndicator: React.FC<{ scheduleDate: Date }> = ({ scheduleDate }) => {
    const now = new Date();
    // Normaliza as datas para o início do dia para obter uma diferença de dias limpa
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfScheduleDate = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate());

    const diffTime = startOfScheduleDate.getTime() - startOfToday.getTime();
    // diffDays será 0 para hoje, 1 para amanhã, etc.
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return null; // Não mostra para eventos passados

    let indicatorColor = '';
    let isPulsating = false;

    if (diffDays <= 3) { // Urgente: 0-3 dias
        indicatorColor = 'bg-red-500';
        isPulsating = true;
    } else if (diffDays <= 10) { // Em breve: 4-10 dias
        indicatorColor = 'bg-yellow-500';
    } else { // Distante: >10 dias
        indicatorColor = 'bg-green-500';
    }

    // Cria uma cor mais clara para a animação de pulso, ex: bg-red-500 -> bg-red-400
    const pingColor = indicatorColor.replace('-500', '-400'); 

    return (
        <div className="flex-shrink-0 ml-4 pt-1">
            <span className="relative flex h-3 w-3" title={`Faltam ${diffDays} dia(s)`}>
                {isPulsating && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-75`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${indicatorColor}`}></span>
            </span>
        </div>
    );
};


const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, onDetailsClick }) => {
    const navItem = ALL_NAV_ITEMS.find(item => item.label === schedule.type);
    
    // Define default colors and derive from constants if available
    const textColor = navItem?.color || 'text-slate-500';
    const borderColor = navItem?.color ? navItem.color.replace('text-', 'border-') : 'border-slate-500';

    const scheduleDate = new Date(schedule.date);

    return (
        <div className={`rounded-xl shadow-lg overflow-hidden bg-white dark:bg-slate-800 border-l-4 ${borderColor}`}>
            <div className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className={`text-sm font-bold ${textColor}`}>{schedule.type}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{schedule.title}</h3>
                    </div>
                    
                    <PriorityIndicator scheduleDate={scheduleDate} />

                </div>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{formatDate(schedule.date)}</p>

                <div className="mt-5 flex justify-end">
                    <button
                        onClick={() => onDetailsClick(schedule)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
                    >
                        <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                        Detalhes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleCard;