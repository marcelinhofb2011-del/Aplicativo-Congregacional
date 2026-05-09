
import React from 'react';
// FIX: Import DashboardSchedule from types.ts and remove the incorrect import.
import { LifeMinistrySchedule, Assignment, CleaningSchedule, ConductorMeeting, PublicTalkSchedule, ShepherdingVisit, BaseRecord, DashboardSchedule } from '../types';
import { ArrowLeftIcon } from './icons/Icons';
import { Home, User } from 'lucide-react';
import LifeMinistryDetail from './details/LifeMinistryDetail';
import AssignmentDetail from './details/AssignmentDetail';
import CleaningDetail from './details/CleaningDetail';
import ConductorDetail from './details/ConductorDetail';
import PublicTalkDetail from './details/PublicTalkDetail';
import ShepherdingDetail from './details/ShepherdingDetail';

interface DetailedScheduleModalProps {
    schedule: DashboardSchedule | null;
    onClose: () => void;
}

const DetailedScheduleModal: React.FC<DetailedScheduleModalProps> = ({ schedule, onClose }) => {
    if (!schedule) return null;

    const renderDetailContent = () => {
        const { type, fullData, displayMode } = schedule;

        if (displayMode === 'midweek_part') {
            const data = fullData as any;
            return (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-8 rounded-[32px] text-center">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Irmão Designado</p>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{data.speaker || data.student || 'Não definido'}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{schedule.title}</p>
                    </div>
                    
                    <div className="p-6 bg-slate-100 dark:bg-white/[0.03] rounded-3xl border border-slate-200 dark:border-white/[0.05]">
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic text-center">
                            Esta é uma visão simplificada da sua designação.
                        </p>
                    </div>
                </div>
            );
        }

        if (displayMode === 'weekend_talk') {
            const talk = fullData as PublicTalkSchedule;
            return (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[40px]">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6">Discurso Público</p>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-8">{talk.theme}</h2>
                        
                        <div className="space-y-6 pt-6 border-t border-emerald-500/10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Orador</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{talk.speakerName}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <Home className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Congregação</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{talk.congregation}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        switch (type) {
            case 'Vida e Ministério':
                return <LifeMinistryDetail schedule={fullData as LifeMinistrySchedule} />;
            case 'Designações':
                return <AssignmentDetail assignment={fullData as Assignment} />;
            case 'Limpeza':
                return <CleaningDetail schedule={fullData as CleaningSchedule} />;
            case 'Serviço de Campo':
                 return <ConductorDetail schedule={fullData as ConductorMeeting} title="Saída de Campo" />;
            case 'Dirigente 1º Dom':
                 return <ConductorDetail schedule={fullData as any} title="Dirigente 1º Domingo" />;
            case 'Pastoreio':
                return <ShepherdingDetail schedule={fullData as ShepherdingVisit} />;
            case 'Discurso Público':
                return <PublicTalkDetail schedule={fullData as PublicTalkSchedule} />;
            default:
                return <p>Detalhes não disponíveis para este tipo de evento.</p>;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-[#020617] z-50 overflow-y-auto animate-fade-in transition-colors duration-300">
            <header className="sticky top-0 z-10 flex items-center h-16 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md px-4 sm:px-6 border-b border-slate-200 dark:border-white/10">
                <div className="flex-1 flex justify-start">
                    <button onClick={onClose} className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors p-2 -ml-2 rounded-md">
                        <ArrowLeftIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">Voltar</span>
                    </button>
                </div>
                <div className="flex-1 text-center">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate font-outfit">Detalhes</h1>
                </div>
                 <div className="flex-1"></div> {/* Placeholder for balance */}
            </header>
            <main className="p-4 sm:p-6 lg:p-8">
                {renderDetailContent()}
            </main>
        </div>
    );
};

export default DetailedScheduleModal;