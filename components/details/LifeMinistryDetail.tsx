
import React from 'react';
import { LifeMinistrySchedule } from '../../types';

// Helper components to structure the detail view, mimicking the PDF layout.

const SectionHeader: React.FC<{ title: string; colorClass: string }> = ({ title, colorClass }) => (
    <div className={`${colorClass} px-4 py-1.5 text-white font-bold text-center tracking-wide rounded-t-md`}>
        <h3 className="text-sm uppercase">{title}</h3>
    </div>
);

const DetailRow: React.FC<{
    left: React.ReactNode;
    right?: React.ReactNode;
    isSong?: boolean;
}> = ({ left, right, isSong = false }) => (
    <div className={`flex justify-between items-center py-2.5 border-b border-slate-200 dark:border-slate-700 last:border-b-0 ${isSong ? 'font-bold' : ''}`}>
        <p className="text-slate-800 dark:text-slate-200 pr-4">{left}</p>
        {right && (
            <div className="text-right flex-shrink-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{right}</p>
            </div>
        )}
    </div>
);

const LifeMinistryDetail: React.FC<{ schedule: LifeMinistrySchedule }> = ({ schedule }) => {

    // Filter out empty parts from arrays to correctly number the meeting items.
    const activeChristianLifeParts = schedule.christianLifeParts.filter(p => p.theme && p.speaker);
    const activeStudentParts = schedule.studentParts.filter(p => p.theme && p.student);
    let partCounter = 3; // Starts after Treasures parts.

    return (
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-lg shadow-lg font-sans">
            <div className="p-6 sm:p-8">
                <h2 className="text-center text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                    Programação da reunião do meio de semana
                </h2>
                <hr className="border-slate-400 dark:border-slate-600 mb-4" />
                
                <h3 className="text-center font-bold text-slate-700 dark:text-slate-300 mb-2">{schedule.week}</h3>
                
                <div className="flex justify-end text-sm mb-2">
                    <p>Presidente: <span className="font-semibold">{schedule.president}</span></p>
                </div>

                <div className="border-b border-slate-200 dark:border-slate-700">
                     <div className="flex justify-between items-start py-2">
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">• Cântico {schedule.initialSong}</p>
                            <p className="text-slate-800 dark:text-slate-200">• Comentários iniciais (1 min)</p>
                        </div>
                        <div className="text-right text-sm">
                             <p>Oração: <span className="font-semibold">{schedule.initialPrayer}</span></p>
                        </div>
                    </div>
                </div>

                {/* Tesouros */}
                <div className="mt-6">
                    <SectionHeader title="Tesouros da Palavra de Deus" colorClass="bg-slate-600" />
                    <div className="px-4 py-2 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-md">
                        <DetailRow 
                            left={<>1. {schedule.treasuresTheme.theme} <span className="text-slate-500">(10 min)</span></>}
                            right={schedule.treasuresTheme.speaker}
                        />
                        <DetailRow 
                            left={<>2. Joias espirituais <span className="text-slate-500">(10 min)</span></>}
                            right={schedule.spiritualGems.speaker}
                        />
                        <DetailRow 
                            left={<>3. Leitura da Bíblia <span className="text-slate-500">(4 min)</span></>}
                            right={schedule.bibleReading.student}
                        />
                    </div>
                </div>

                {/* Ministério */}
                <div className="mt-6">
                    <SectionHeader title="Faça Seu Melhor no Ministério" colorClass="bg-amber-500" />
                    <div className="px-4 py-2 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-md">
                        {/* Header Row */}
                        <div className="flex items-start text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
                            <div className="w-1/2 sm:w-3/5 pr-4"></div> {/* Spacer for the theme column */}
                            <div className="w-1/2 sm:w-2/5 flex text-right">
                                <p className="w-1/2 px-2">Estudante</p>
                                <p className="w-1/2 px-2">Ajudante</p>
                            </div>
                        </div>

                        {activeStudentParts.map((part) => {
                             partCounter++;
                             return (
                                <div key={part.id} className="flex items-start py-2.5 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                    {/* Left: Theme */}
                                    <div className="w-1/2 sm:w-3/5 pr-4">
                                        <p className="text-slate-800 dark:text-slate-200">{partCounter}. {part.theme} <span className="text-slate-500">({part.time} min)</span></p>
                                    </div>
                                    {/* Right: Names */}
                                    <div className="w-1/2 sm:w-2/5 flex text-right">
                                        <p className="w-1/2 font-semibold text-slate-900 dark:text-slate-100 px-2 break-words">{part.student}</p>
                                        <p className="w-1/2 font-semibold text-slate-900 dark:text-slate-100 px-2 break-words">{part.helper || ''}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Vida Cristã */}
                 <div className="mt-6">
                    <SectionHeader title="Nossa Vida Cristã" colorClass="bg-rose-700" />
                     <div className="px-4 py-2 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-md">
                        <DetailRow left={`• Cântico ${schedule.intermediateSong}`} isSong />
                        
                        {activeChristianLifeParts.map((part) => {
                           partCounter++;
                           return (
                               <DetailRow 
                                    key={part.id}
                                    left={<>{partCounter}. {part.theme} <span className="text-slate-500">({part.time} min)</span></>}
                                    right={part.speaker}
                                />
                            )
                        })}

                        <DetailRow 
                            left={<>{partCounter + 1}. Estudo bíblico de congregação <span className="text-slate-500">(30 min)</span></>}
                            right={
                                <>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Dirigente/leitor</span>
                                    {schedule.congregationBibleStudy.conductor} / {schedule.congregationBibleStudy.reader}
                                </>
                            }
                        />
                         <DetailRow left={`• Cântico ${schedule.finalSong}`} isSong />
                         <div className="flex justify-end items-center py-2 text-sm">
                             <div className="text-right">
                                <p>Oração: <span className="font-semibold">{schedule.finalPrayer}</span></p>
                            </div>
                         </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
export default LifeMinistryDetail;
