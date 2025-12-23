
import React from 'react';
import { LifeMinistrySchedule, Assignment, CleaningSchedule, ConductorMeeting, PublicTalkSchedule, ShepherdingVisit, BaseRecord } from '../types';
import { ArrowLeftIcon } from './icons/Icons';
import LifeMinistryDetail from './details/LifeMinistryDetail';
import AssignmentDetail from './details/AssignmentDetail';
import CleaningDetail from './details/CleaningDetail';
import ConductorDetail from './details/ConductorDetail';
import PublicTalkDetail from './details/PublicTalkDetail';
import ShepherdingDetail from './details/ShepherdingDetail';
import { DashboardSchedule } from '../pages/Dashboard';

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
            case 'Dirigentes':
                 return <ConductorDetail schedule={fullData as ConductorMeeting} />;
            case 'Pastoreio':
                return <ShepherdingDetail schedule={fullData as ShepherdingVisit} />;
            case 'Discurso Público':
                return <PublicTalkDetail schedule={fullData as PublicTalkSchedule} />;
            default:
                return <p>Detalhes não disponíveis para este tipo de evento.</p>;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto animate-fade-in">
            <header className="sticky top-0 z-10 flex items-center h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 sm:px-6 border-b-2 border-primary">
                <div className="flex-1 flex justify-start">
                    <button onClick={onClose} className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors p-2 -ml-2 rounded-md">
                        <ArrowLeftIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">Voltar</span>
                    </button>
                </div>
                <div className="flex-1 text-center">
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white truncate">Detalhes da Programação</h1>
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