
import React from 'react';
import { BookOpenIcon } from './icons/Icons';

interface DailyText {
    date: string; // YYYY-MM-DD
    scripture: string;
    comment: string;
}

interface DailyTextWidgetProps {
    dailyText: DailyText | null;
    isLoading: boolean;
}

const DailyTextWidget: React.FC<DailyTextWidgetProps> = ({ dailyText, isLoading }) => {
    if (isLoading) {
        return <div className="min-h-[224px] bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse"></div>;
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

    if (!dailyText) {
        return (
            <div className="relative block p-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 min-h-[224px] flex flex-col justify-center">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-primary">
                        <BookOpenIcon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Texto Diário</h3>
                        <p className="text-sm font-semibold text-primary dark:text-amber-500">{formattedDate}</p>
                    </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                    O texto diário para hoje não está disponível.
                </p>
            </div>
        );
    }

    return (
        <div className="relative block p-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 min-h-[224px]">
             <div className="flex justify-between items-start mb-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-primary">
                    <BookOpenIcon className="h-7 w-7 text-white" />
                </div>
                <div className="text-right">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Texto Diário</h3>
                    <p className="text-sm font-semibold text-primary dark:text-amber-500">{formattedDate}</p>
                </div>
            </div>
            <div className="space-y-3">
                <p className="font-semibold italic text-slate-800 dark:text-slate-200">
                    {dailyText.scripture}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-5">
                    {dailyText.comment}
                </p>
            </div>
        </div>
    );
};

export default DailyTextWidget;
