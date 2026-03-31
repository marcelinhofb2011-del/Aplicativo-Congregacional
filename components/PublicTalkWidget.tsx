import React from 'react';
import { PublicTalkSchedule } from '../types';
import { PodiumIcon, ConductorIcon, CalendarDaysIcon, ChevronRightIcon } from './icons/Icons';

interface PublicTalkWidgetProps {
    schedule?: PublicTalkSchedule;
    isLoading: boolean;
    onDetailsClick: (schedule: PublicTalkSchedule) => void;
}

const PublicTalkWidget: React.FC<PublicTalkWidgetProps> = ({ schedule, isLoading, onDetailsClick }) => {
    
    if (isLoading) {
         return <div className="h-full min-h-[120px] bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse"></div>;
    }

    if (!schedule) {
        return (
             <div className="relative block p-3 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 h-full min-h-[120px] flex flex-col justify-center items-center text-center">
                <div className="h-8 w-8 rounded-xl bg-teal-500 flex items-center justify-center mb-1">
                    <PodiumIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Discurso Público</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Nenhuma futura.</p>
            </div>
        )
    }

    const formattedDate = new Date(schedule.date).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', timeZone: 'UTC'
    });

    return (
        <button
            onClick={() => onDetailsClick(schedule)}
            className="w-full h-full min-h-[120px] text-left p-3 flex flex-col justify-between bg-teal-500/10 dark:bg-teal-900/20 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 transition-transform transform hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-dark"
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-teal-500">
                    <PodiumIcon className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Discurso Público</h3>
                    <p className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">{formattedDate}</p>
                </div>
            </div>
            
            <div className="mt-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                    <PodiumIcon className="h-3 w-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <p className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 truncate">{schedule.theme}</p>
                </div>
                 <div className="flex items-center gap-1.5">
                    <ConductorIcon className="h-3 w-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <p className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 truncate">{schedule.speakerName}</p>
                </div>
            </div>
            
            <div className="flex justify-end items-center">
                <ChevronRightIcon className="h-3.5 w-3.5 text-primary dark:text-blue-400" />
            </div>
        </button>
    );
};

export default PublicTalkWidget;