
import React from 'react';
// FIX: Import DashboardSchedule from types.ts and remove the incorrect import.
import { LifeMinistrySchedule, Assignment, CleaningSchedule, ConductorMeeting, PublicTalkSchedule, ShepherdingVisit, BaseRecord, DashboardSchedule } from '../types';
import { ArrowLeftIcon } from './icons/Icons';
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
        const { type, fullData } = schedule;
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
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-50 overflow-y-auto animate-fade-in transition-colors duration-300">
            <header className="sticky top-0 z-10 flex items-center h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 border-b border-slate-200 dark:border-white/10">
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