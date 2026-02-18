
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
        return <div className="h-full min-h-[224px] bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse"></div>;
    }

    const hasCleaning = !!cleaningSchedule;
    const hasFieldService = !!fieldServiceMeeting;

    const renderCleaningContent = () => {
        if (!cleaningSchedule) {
            return (
                <div className="flex items-center gap-4 opacity-60">
                    <CleaningIcon className="h-6 w-6 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Limpeza do Salão</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma escala futura.</p>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-4">
                <CleaningIcon className="h-6 w-6 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Limpeza do Salão</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {cleaningSchedule.group}: {formatDate(cleaningSchedule.date)} a {formatDate(cleaningSchedule.endDate)}
                    </p>
                </div>
            </div>
        );
    };

    const renderFieldServiceContent = () => {
        if (!fieldServiceMeeting) {
            return (
                <div className="flex items-center gap-4 opacity-60">
                    <ConductorIcon className="h-6 w-6 text-cyan-500 dark:text-cyan-400 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Serviço de Campo</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma reunião futura.</p>
                    </div>
                </div>
            );
        }
        const meetingDate = new Date(fieldServiceMeeting.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', timeZone: 'UTC' });
        return (
            <div className="flex items-center gap-4">
                <ConductorIcon className="h-6 w-6 text-cyan-500 dark:text-cyan-400 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Serviço de Campo</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Dirigente:</span> {fieldServiceMeeting.conductorName} - {meetingDate}
                    </p>
                    {fieldServiceMeeting.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                            {fieldServiceMeeting.notes}
                        </p>
                    )}
                </div>
            </div>
        );
    };


    return (
        <div className="relative flex flex-col justify-around h-full bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 p-6 min-h-[224px]">
           {renderCleaningContent()}
           
           {(hasCleaning || hasFieldService) && <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>}
           
           {renderFieldServiceContent()}
        </div>
    );
};

export default CombinedScheduleWidget;
