
import React from 'react';
import { CleaningSchedule, ConductorMeeting } from '../types';
import { CleaningIcon, ConductorIcon } from './icons/Icons';

interface CombinedScheduleWidgetProps {
    cleaningSchedule?: CleaningSchedule;
    fieldServiceMeeting?: ConductorMeeting;
    isLoading: boolean;
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });

const CombinedScheduleWidget: React.FC<CombinedScheduleWidgetProps> = ({ cleaningSchedule, fieldServiceMeeting, isLoading }) => {
    
    if (isLoading) {
         return <div className="h-full min-h-[120px] bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse"></div>;
    }

    const hasCleaning = !!cleaningSchedule;
    const hasFieldService = !!fieldServiceMeeting;

    const renderCleaningContent = () => {
        if (!cleaningSchedule) {
            return (
                <div className="flex items-center gap-3 opacity-60">
                    <CleaningIcon className="h-5 w-5 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Limpeza</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Nenhuma.</p>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-3">
                <CleaningIcon className="h-5 w-5 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Limpeza</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {cleaningSchedule.group}: {formatDate(cleaningSchedule.date)}
                    </p>
                </div>
            </div>
        );
    };

    const renderFieldServiceContent = () => {
        if (!fieldServiceMeeting) {
            return (
                <div className="flex items-center gap-3 opacity-60">
                    <ConductorIcon className="h-5 w-5 text-cyan-500 dark:text-cyan-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Campo</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Nenhuma.</p>
                    </div>
                </div>
            );
        }
        const meetingDate = new Date(fieldServiceMeeting.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
        return (
            <div className="flex items-center gap-3">
                <ConductorIcon className="h-5 w-5 text-cyan-500 dark:text-cyan-400 flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Campo</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {fieldServiceMeeting.conductorName} - {meetingDate}
                    </p>
                </div>
            </div>
        );
    };


    return (
        <div className="relative flex flex-col justify-around h-full bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 p-4 min-h-[120px]">
           {renderCleaningContent()}
           
           <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
           
           {renderFieldServiceContent()}
        </div>
    );
};

export default CombinedScheduleWidget;
