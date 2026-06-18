
import React from 'react';
import { LifeMinistrySchedule } from '../../types';

// Helper components to structure the detail view, integrated seamlessly with the page layout.

const SectionHeader: React.FC<{ title: string; colorHex: string }> = ({ title, colorHex }) => (
    <div className="flex items-center gap-3 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800">
        <span className="w-2.5 h-6 rounded-sm shrink-0" style={{ backgroundColor: colorHex }} />
        <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200 font-outfit">
            {title}
        </h3>
    </div>
);

const DetailRow: React.FC<{
    left: React.ReactNode;
    right?: React.ReactNode;
    isSong?: boolean;
}> = ({ left, right, isSong = false }) => (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 gap-1 sm:gap-4 ${isSong ? 'font-bold text-primary dark:text-amber-500 bg-slate-50/50 dark:bg-white/[0.01] px-3 py-2 rounded-xl mt-1' : ''}`}>
        <div className="text-slate-800 dark:text-slate-200 text-sm sm:text-base select-text pr-2 leading-relaxed">{left}</div>
        {right && (
            <div className="sm:text-right shrink-0">
                <p className="font-bold text-slate-900 dark:text-slate-100 bg-primary/5 dark:bg-amber-500/10 px-3 py-1 rounded-lg inline-block border border-primary/20 dark:border-amber-500/20 text-xs sm:text-sm">
                    {right}
                </p>
            </div>
        )}
    </div>
);

const LifeMinistryDetail: React.FC<{ schedule: LifeMinistrySchedule }> = ({ schedule }) => {

    // Filter out empty parts from arrays to correctly number the meeting items.
    const activeChristianLifeParts = schedule?.christianLifeParts?.filter(p => p.theme && p.speaker) || [];
    const activeStudentParts = schedule?.studentParts?.filter(p => p.theme && p.student) || [];
    let partCounter = 3; // Starts after Treasures parts.

    return (
        <div className="w-full max-w-3xl mx-auto font-sans select-text pb-12 px-2 sm:px-4">
            <header className="text-center space-y-2 mb-8 mt-4">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 block">
                    Congregação Vila Cisper
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-outfit">
                    Vida e Ministério Cristão
                </h2>
                <div className="w-12 h-1 bg-primary dark:bg-amber-500 mx-auto rounded-full mt-2" />
            </header>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 mb-6 font-medium">
                <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 font-extrabold font-outfit tracking-wider">
                    {schedule?.week || 'Semana não definida'}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Presidente: <span className="font-extrabold text-primary dark:text-amber-400 bg-primary/10 dark:bg-amber-400/10 px-2.5 py-1 rounded-lg ml-1">{schedule?.president || 'Não definido'}</span>
                </div>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                    <div className="space-y-1">
                        <p className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full" />
                            Cântico Inicial: <span className="text-primary dark:text-amber-500 font-black">{schedule?.initialSong || 'N/D'}</span>
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-transparent rounded-full" />
                            Comentários iniciais (1 min)
                        </p>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800/50 inline-block self-start sm:self-center">
                        Oração Inicial: <span className="font-bold text-slate-800 dark:text-slate-200 ml-1">{schedule?.initialPrayer || 'Não definido'}</span>
                    </div>
                </div>
            </div>

            {/* Tesouros */}
            <div className="space-y-1">
                <SectionHeader title="Tesouros da Palavra de Deus" colorHex="#4b5563" />
                <div className="space-y-0.5">
                    <DetailRow 
                        left={<>1. {schedule?.treasuresTheme?.theme || 'Tema não definido'} <span className="text-xs text-slate-500 font-medium ml-1">({schedule?.treasuresTheme?.time || '10'} min)</span></>}
                        right={schedule?.treasuresTheme?.speaker || 'Não definido'}
                    />
                    <DetailRow 
                        left={<>2. Joias espirituais <span className="text-xs text-slate-500 font-medium ml-1">(10 min)</span></>}
                        right={schedule?.spiritualGems?.speaker || 'Não definido'}
                    />
                    <DetailRow 
                        left={<>3. Leitura da Bíblia <span className="text-xs text-slate-500 font-medium ml-1">({schedule?.bibleReading?.time || '4'} min)</span></>}
                        right={schedule?.bibleReading?.student || 'Não definido'}
                    />
                </div>
            </div>
 
            {/* Ministério */}
            <div className="space-y-1">
                <SectionHeader title="Faça Seu Melhor no Ministério" colorHex="#f59e0b" />
                <div className="space-y-0.5 pt-2">
                    {activeStudentParts.length === 0 ? (
                        <p className="text-xs italic text-slate-400 py-3">Nenhuma designação de estudante ativa.</p>
                    ) : (
                        activeStudentParts.map((part) => {
                             partCounter++;
                             return (
                                <div key={part.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 gap-2 sm:gap-4 select-text">
                                    {/* Left: Number, Theme & Duration */}
                                    <div className="space-y-1">
                                        <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-snug">
                                            <span className="font-bold text-slate-400 dark:text-slate-600 mr-2">{partCounter}.</span>
                                            {part.theme}
                                        </p>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
                                            {part.time} min
                                        </span>
                                    </div>
                                    
                                    {/* Right: Participant Badges */}
                                    <div className="flex flex-row flex-wrap items-center gap-2 shrink-0">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Estudante</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 px-3 py-1 rounded-lg text-xs">
                                                {part.student}
                                            </span>
                                        </div>
                                        {part.helper && (
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Ajudante</span>
                                                <span className="font-extrabold text-slate-900 dark:text-white bg-slate-100/60 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-3 py-1 rounded-lg text-xs">
                                                    {part.helper}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
 
            {/* Vida Cristã */}
            <div className="space-y-1">
                <SectionHeader title="Nossa Vida Cristã" colorHex="#be123c" />
                <div className="space-y-0.5">
                    <DetailRow left={`• Cântico ${schedule?.intermediateSong || 'N/D'}`} isSong />
                    
                    {activeChristianLifeParts.map((part) => {
                       partCounter++;
                       return (
                           <DetailRow 
                                key={part.id}
                                left={<>{partCounter}. {part.theme} <span className="text-xs text-slate-500 font-medium ml-1">({part.time} min)</span></>}
                                right={part.speaker}
                            />
                        )
                    })}
 
                    <DetailRow 
                        left={<>{partCounter + 1}. Estudo bíblico de congregação <span className="text-xs text-slate-500 font-medium ml-1">(30 min)</span></>}
                        right={
                            <span className="flex flex-col items-start sm:items-end gap-0.5">
                                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Dirigente / Leitor</span>
                                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                    {schedule?.congregationBibleStudy?.conductor || 'N/D'} / {schedule?.congregationBibleStudy?.reader || 'N/D'}
                                </span>
                            </span>
                        }
                    />
                    <DetailRow left={`• Cântico ${schedule?.finalSong || 'N/D'}`} isSong />
                    
                    <div className="flex justify-between items-center py-4 border-t border-slate-100 dark:border-slate-800/40 text-sm mt-3">
                        <div className="text-slate-400 text-xs italic">
                            Fim da Reunião
                        </div>
                        <div className="text-right text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            Oração Final: <span className="font-extrabold text-slate-800 dark:text-slate-200 ml-1">{schedule?.finalPrayer || 'Não definido'}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
export default LifeMinistryDetail;