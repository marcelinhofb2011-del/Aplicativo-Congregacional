import React from 'react';
import { Assignment } from '../types';
import { AssignmentsIcon, PodiumIcon, ChevronRightIcon } from './icons/Icons';

interface AssignmentsWidgetProps {
    schedule?: Assignment;
    isLoading: boolean;
    onDetailsClick: (schedule: Assignment) => void;
}

const AssignmentsWidget: React.FC<AssignmentsWidgetProps> = ({ schedule, isLoading, onDetailsClick }) => {
    
    if (isLoading) {
         return <div className="h-full bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse" style={{minHeight: '224px'}}></div>
    }

    if (!schedule) {
        return (
             <div className="relative block p-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50">
                <div className="flex justify-between items-start">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-orange-500">
                        <AssignmentsIcon className="h-7 w-7 text-white" />
                    </div>
                </div>
                <div className="mt-8" style={{minHeight: '128px'}}>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Designações</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Nenhuma designação futura encontrada.
                    </p>
                </div>
            </div>
        )
    }

    const formattedDate = new Date(schedule.date).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
    });

    return (
        <div className="relative flex flex-col justify-between h-full bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 transition-transform transform hover:-translate-y-1 hover:shadow-2xl">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-orange-500">
                        <AssignmentsIcon className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Designações</h3>
                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{formattedDate}</p>
                    </div>
                </div>
                
                <div className="mt-6 space-y-4" style={{minHeight: '104px'}}>
                    {schedule.president ? (
                        <div className="flex items-center gap-3">
                            <PodiumIcon className="h-6 w-6 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Presidente</p>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{schedule.president}</p>
                            </div>
                        </div>
                    ) : (
                         <p className="text-sm text-slate-500 dark:text-slate-400 pt-4">Nenhuma designação de presidente para esta data.</p>
                    )}
                </div>
            </div>
             <button
                onClick={() => onDetailsClick(schedule)}
                className="w-full text-left bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 rounded-b-3xl mt-4"
            >
                <div className="flex justify-between items-center px-6 py-4">
                    <span className="font-semibold text-primary">Ver programação completa</span>
                    <ChevronRightIcon className="h-5 w-5 text-primary" />
                </div>
            </button>
        </div>
    );
};

export default AssignmentsWidget;