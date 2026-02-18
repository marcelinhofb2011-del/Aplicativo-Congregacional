
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
         return <div className="h-full min-h-[224px] bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse"></div>;
    }

    if (!schedule) {
        return (
             <div className="relative block p-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 h-full min-h-[224px] flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-orange-500">
                        <AssignmentsIcon className="h-7 w-7 text-white" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Designações</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Nenhuma programação futura.
                    </p>
                </div>
            </div>
        )
    }

    const formattedDate = new Date(schedule.date).toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC'
    });

    return (
        <button
            onClick={() => onDetailsClick(schedule)}
            className="w-full h-full min-h-[224px] text-left p-6 flex flex-col justify-between bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 transition-transform transform hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-dark"
        >
            <div>
                <div className="flex justify-between items-start">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-orange-500">
                        <AssignmentsIcon className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Designações</h3>
                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{formattedDate}</p>
                    </div>
                </div>
                
                <div className="mt-4 space-y-3">
                    {schedule.president && (
                        <div className="flex items-center gap-3">
                            <PodiumIcon className="h-6 w-6 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            <div>
                                <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Presidente</p>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{schedule.president}</p>
                            </div>
                        </div>
                    )}
                     {schedule.reader && (
                        <div className="flex items-center gap-3">
                            <BookOpenIcon className="h-6 w-6 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                             <div>
                                <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Leitor</p>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{schedule.reader}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex justify-end items-center mt-2">
                 <span className="text-sm font-semibold text-primary dark:text-blue-400">Ver designação</span>
                <ChevronRightIcon className="h-5 w-5 text-primary dark:text-blue-400" />
            </div>
        </button>
    );
};

export default AssignmentsWidget;
