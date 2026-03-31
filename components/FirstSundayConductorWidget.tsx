
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
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm animate-pulse">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
        );
    }

    if (!conductor) return null;

    return (
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-4 shadow-lg transform hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-100">Dirigente 1º Dom</p>
                <div className="p-1.5 bg-white/20 rounded-full">
                    <UserIcon className="h-4 w-4 text-white" />
                </div>
            </div>
            <h3 className="text-xl font-bold mb-0">{conductor.conductorName}</h3>
            <div className="flex items-center gap-2">
                <p className="text-xs text-amber-100 font-medium">{conductor.month}</p>
                {conductor.date && (
                    <p className="text-xs text-amber-200">
                        • {new Date(conductor.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })}
                    </p>
                )}
            </div>
        </div>
    );
};

export default FirstSundayConductorWidget;
