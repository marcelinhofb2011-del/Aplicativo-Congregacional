
import React from 'react';
import { Assignment } from '../types';
import { AssignmentsIcon, PodiumIcon, BookOpenIcon, ChevronRightIcon } from './icons/Icons';

interface AssignmentsWidgetProps {
    schedule?: Assignment;
    isLoading: boolean;
    onDetailsClick: (schedule: Assignment) => void;
}

const AssignmentsWidget: React.FC<AssignmentsWidgetProps> = ({ schedule, isLoading, onDetailsClick }) => {
    
    if (isLoading) {
         return <div className="h-full min-h-[120px] bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse"></div>;
    }

    if (!schedule) {
        return (
             <div className="relative block p-3 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 h-full min-h-[120px] flex flex-col justify-center items-center text-center">
                <div className="h-8 w-8 rounded-xl bg-orange-500 flex items-center justify-center mb-1">
                    <AssignmentsIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Designações</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Nenhuma futura.</p>
            </div>
        )
    }

    const formattedDate = new Date(schedule.date).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', timeZone: 'UTC'
    });

    return (
        <button
            onClick={() => onDetailsClick(schedule)}
            className="w-full h-full min-h-[120px] text-left p-4 flex flex-col justify-between bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 transition-transform transform hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-dark"
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-orange-500">
                    <AssignmentsIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Designações</h3>
                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">{formattedDate}</p>
                </div>
            </div>
            
            <div className="mt-2 space-y-1">
                {schedule.president && (
                    <div className="flex items-center gap-2">
                        <PodiumIcon className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Pres: {schedule.president}</p>
                    </div>
                )}
                 {schedule.reader && (
                    <div className="flex items-center gap-2">
                        <BookOpenIcon className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Leitor: {schedule.reader}</p>
                    </div>
                )}
            </div>
            
            <div className="flex justify-end items-center">
                <ChevronRightIcon className="h-4 w-4 text-primary dark:text-blue-400" />
            </div>
        </button>
    );
};

export default AssignmentsWidget;
