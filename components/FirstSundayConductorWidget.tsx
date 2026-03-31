
import React from 'react';
import { FirstSundayConductor } from '../types';
import { UserIcon } from './icons/Icons';

interface FirstSundayConductorWidgetProps {
    conductor: FirstSundayConductor | undefined;
    isLoading: boolean;
}

const FirstSundayConductorWidget: React.FC<FirstSundayConductorWidgetProps> = ({ conductor, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
        );
    }

    if (!conductor) return null;

    return (
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-6 shadow-lg transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-100">Dirigente do 1º Domingo</p>
                <div className="p-2 bg-white/20 rounded-full">
                    <UserIcon className="h-5 w-5 text-white" />
                </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{conductor.conductorName}</h3>
            <div className="flex flex-col">
                <p className="text-amber-100 font-medium">{conductor.month}</p>
                {conductor.date && (
                    <p className="text-xs text-amber-200 mt-0.5">
                        {new Date(conductor.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </p>
                )}
            </div>
            {conductor.notes && (
                <p className="mt-3 text-sm text-amber-50 text-opacity-90 italic">
                    "{conductor.notes}"
                </p>
            )}
        </div>
    );
};

export default FirstSundayConductorWidget;
