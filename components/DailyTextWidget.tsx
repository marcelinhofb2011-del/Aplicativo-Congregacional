import React, { useState, useEffect } from 'react';
import { getDailyText, getWeeklyBibleReading } from '../data/spiritualRoutineData';
import { BookOpenIcon } from './icons/Icons';

const DailyTextWidget: React.FC = () => {
    const [dailyText, setDailyText] = useState<{ date: string; scripture: string; comment: string } | null>(null);
    const [weeklyReading, setWeeklyReading] = useState<string | null>(null);

    useEffect(() => {
        const today = new Date();
        setDailyText(getDailyText(today));
        setWeeklyReading(getWeeklyBibleReading(today));
    }, []);
    
    const todayFormatted = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    if (!dailyText) {
        return (
            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 p-6 text-center">
                 <p className="text-slate-500 dark:text-slate-400">Texto diário para hoje não encontrado.</p>
            </div>
        );
    }

    return (
        <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 overflow-hidden animate-fade-in-up">
            <div className="p-6">
                <p className="font-semibold text-primary dark:text-sky-400">{todayFormatted}</p>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-2">{dailyText.scripture}</h3>
                <p className="text-slate-600 dark:text-slate-300 mt-2 text-base leading-relaxed">{dailyText.comment}</p>
                 <a href="https://wol.jw.org/pt/wol/h/r5/lp-t" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline mt-4 inline-block">
                    Leia mais em jw.org
                </a>
            </div>
            {weeklyReading && (
                <div className="bg-slate-100/50 dark:bg-slate-900/20 px-6 py-4 border-t border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <BookOpenIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Leitura semanal da Bíblia</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{weeklyReading}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyTextWidget;
