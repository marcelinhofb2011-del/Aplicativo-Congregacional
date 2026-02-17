
import React from 'react';
import { LifeMinistrySchedule } from '../types';
import { LifeMinistryIcon, PodiumIcon, BookOpenIcon, ChevronRightIcon } from './icons/Icons';

interface LifeMinistryWidgetProps {
    schedule?: LifeMinistrySchedule;
    isLoading: boolean;
    onDetailsClick: (schedule: LifeMinistrySchedule) => void;
}

const LifeMinistryWidget: React.FC<LifeMinistryWidgetProps> = ({ schedule, isLoading, onDetailsClick }) => {
    
    if (isLoading) {
         return <div className="h-52 bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse"></div>;
    }

    if (!schedule) {
        return (
             <div className="relative block p-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 h-52 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-green-500">
                        <LifeMinistryIcon className="h-7 w-7 text-white" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Vida e Ministério</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Nenhuma programação futura encontrada.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => onDetailsClick(schedule)}
            className="w-full h-52 text-left p-6 flex flex-col justify-between bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 transition-transform transform hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-dark"
        >
            <div> {/* Top part of the card */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-green-500">
                        <LifeMinistryIcon className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vida e Ministério</h3>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">{schedule.week}</p>
                    </div>
                </div>
                
                <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <PodiumIcon className="h-6 w-6 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Presidente</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{schedule.president}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <BookOpenIcon className="h-6 w-6 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Leitura da Bíblia</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{schedule.bibleReading.student}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-center">
                <span className="font-semibold text-primary dark:text-blue-400 text-sm">Ver programação completa</span>
                <ChevronRightIcon className="h-5 w-5 text-primary dark:text-blue-400 ml-1" />
            </div>
        </button>
    );
};

export default LifeMinistryWidget;
