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
        return <div className="h-full bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse" style={{minHeight: '224px'}}></div>;
    }

    const hasCleaning = !!cleaningSchedule;
    const hasFieldService = !!fieldServiceMeeting;

    const renderCleaningContent = () => {
        if (!cleaningSchedule) {
            return (
                <div className="flex items-center gap-4 opacity-60">
                    <CleaningIcon className="h-6 w-6 text-violet-200 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-white">Limpeza do Salão</p>
                        <p className="text-sm text-violet-200">Nenhuma escala futura.</p>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-4">
                <CleaningIcon className="h-6 w-6 text-violet-200 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-white">Limpeza do Salão</p>
                    <p className="text-sm text-violet-200">
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
                    <ConductorIcon className="h-6 w-6 text-violet-200 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-white">Serviço de Campo</p>
                        <p className="text-sm text-violet-200">Nenhuma reunião futura.</p>
                    </div>
                </div>
            );
        }
        const meetingDate = new Date(fieldServiceMeeting.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', timeZone: 'UTC' });
        return (
            <div className="flex items-center gap-4">
                <ConductorIcon className="h-6 w-6 text-violet-200 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-white">Serviço de Campo</p>
                    <p className="text-sm text-violet-200">
                        {fieldServiceMeeting.conductorName} - {meetingDate}
                    </p>
                </div>
            </div>
        );
    };


    return (
        <div className="relative flex flex-col justify-around h-full bg-gradient-to-br from-violet-500 to-fuchsia-500 dark:from-violet-800 dark:to-fuchsia-900 rounded-3xl shadow-lg p-6" style={{minHeight: '224px'}}>
           {renderCleaningContent()}
           
           {(hasCleaning && hasFieldService) && <div className="border-t border-white/20 my-2"></div>}
           
           {renderFieldServiceContent()}
        </div>
    );
};

export default CombinedScheduleWidget;
