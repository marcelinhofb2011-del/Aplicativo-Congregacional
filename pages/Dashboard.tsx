
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
// FIX: Import ScheduleItem from ScheduleContext where it is defined.
import { useSchedules, ScheduleItem } from '../contexts/ScheduleContext';
import {
    LifeMinistrySchedule,
    Assignment,
    CleaningSchedule,
    ConductorMeeting,
    DashboardSchedule,
    PublicTalkSchedule
} from '../types';
import AnnouncementsWidget from '../components/AnnouncementsWidget';
import { getAnnouncements } from '../services/firestoreService';
import ScheduleDetailModal from '../components/ScheduleDetailModal';
import { Link } from 'react-router-dom';
import { ChartBarIcon, AssignmentsIcon, MegaphoneIcon, ChevronRightIcon } from '../components/icons/Icons';
import LifeMinistryWidget from '../components/LifeMinistryWidget';
import AssignmentsWidget from '../components/AssignmentsWidget';
import CombinedScheduleWidget from '../components/CombinedScheduleWidget';
import PublicTalkWidget from '../components/PublicTalkWidget';

type UpcomingEvent = {
    date: Date;
    type: 'Vida e Ministério' | 'Designações' | 'Limpeza' | 'Serviço de Campo';
    title: string;
    description: string;
    fullData: LifeMinistrySchedule | Assignment | CleaningSchedule | ConductorMeeting;
};

// Helper for events that span a period (Life & Ministry, Cleaning)
const findNextUpcomingRange = <T extends { date: string, endDate?: string }>(items: T[]): T | undefined => {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    return items
        .filter(item => {
            if (!item.date || isNaN(new Date(item.date).getTime())) return false;

            let endDate: Date;
            if (item.endDate && !isNaN(new Date(item.endDate).getTime())) {
                endDate = new Date(item.endDate);
            } else {
                // For LifeMinistrySchedule, which lasts for a week (start date + 6 days)
                const startDate = new Date(item.date);
                endDate = new Date(startDate.getTime());
                endDate.setUTCDate(startDate.getUTCDate() + 6);
            }
            return endDate >= today;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
};

// Helper for single-day events (Assignments, Field Service)
const findNextUpcoming = <T extends { date: string }>(items: T[]): T | undefined => {
    const now = new Date();
    // Use UTC date for comparison to avoid timezone issues
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    return items
        .filter(item => item.date && !isNaN(new Date(item.date).getTime()))
        .filter(item => new Date(item.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
};

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { schedules, isLoading: isLoadingSchedules } = useSchedules();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
    const [viewingSchedule, setViewingSchedule] = useState<DashboardSchedule | null>(null);
    const [nextAppointment, setNextAppointment] = useState<UpcomingEvent | null>(null);

    // State for each type of schedule widget
    const [nextLifeMinistry, setNextLifeMinistry] = useState<LifeMinistrySchedule | undefined>();
    const [nextAssignment, setNextAssignment] = useState<Assignment | undefined>();
    const [nextCleaning, setNextCleaning] = useState<CleaningSchedule | undefined>();
    const [nextFieldService, setNextFieldService] = useState<ConductorMeeting | undefined>();
    const [nextPublicTalk, setNextPublicTalk] = useState<PublicTalkSchedule | undefined>();


    useEffect(() => {
        const fetchAnnouncementsData = async () => {
            if (!user) return;
            setIsLoadingAnnouncements(true);
            try {
                const fetchedAnnouncements = await getAnnouncements();
                setAnnouncements(fetchedAnnouncements);
            } catch (error) {
                console.error("Failed to fetch announcements:", error);
            } finally {
                setIsLoadingAnnouncements(false);
            }
        };
        fetchAnnouncementsData();
    }, [user]);

    useEffect(() => {
        if (!user || isLoadingSchedules) return;

        const allUpcomingEvents: UpcomingEvent[] = schedules.map(s => {
            // This mapping is now only for the "Next Personal Appointment" feature
            if ('week' in s && s.president) return { date: new Date(s.date), type: 'Vida e Ministério', title: s.week, description: `Presidente: ${s.president}`, fullData: s };
            if ('president' in s && !('week' in s)) return { date: new Date(s.date), type: 'Designações', title: 'Reunião de Fim de Semana', description: `Presidente: ${s.president}`, fullData: s };
            if ('group' in s && 'endDate' in s) return { date: new Date(s.date), type: 'Limpeza', title: s.group, description: `Responsáveis: ${s.assignedUids?.join(', ') || 'Grupo'}`, fullData: s };
            if ('conductorName' in s) return { date: new Date(s.date), type: 'Serviço de Campo', title: 'Saída de campo', description: `Dirigente: ${s.conductorName}`, fullData: s };
            return null;
        }).filter((e): e is UpcomingEvent => e !== null && e.date >= new Date())
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        const userAssignments = allUpcomingEvents.filter(event => 
            event.fullData.assignedUids?.includes(user.uid)
        );
        
        setNextAppointment(userAssignments.length > 0 ? userAssignments[0] : null);

        // Separate schedules by type for the widgets
        const lifeMinistrySchedules = schedules.filter(s => 'week' in s && 'president' in s) as LifeMinistrySchedule[];
        const assignmentSchedules = schedules.filter(s => 'president' in s && !('week' in s)) as Assignment[];
        const cleaningSchedules = schedules.filter(s => 'group' in s && 'endDate' in s) as CleaningSchedule[];
        const fieldServiceSchedules = schedules.filter(s => 'conductorName' in s) as ConductorMeeting[];
        const publicTalkSchedules = schedules.filter(s => 'speakerName' in s && 'theme' in s) as PublicTalkSchedule[];

        setNextLifeMinistry(findNextUpcomingRange(lifeMinistrySchedules));
        setNextAssignment(findNextUpcoming(assignmentSchedules));
        setNextCleaning(findNextUpcomingRange(cleaningSchedules));
        setNextFieldService(findNextUpcoming(fieldServiceSchedules));
        setNextPublicTalk(findNextUpcoming(publicTalkSchedules));

    }, [user, schedules, isLoadingSchedules]);
    
    const handleViewDetails = (event: ScheduleItem, type: UpcomingEvent['type']) => {
        let title = 'details';
        if ('week' in event) title = event.week;
        if ('president' in event && !('week' in event)) title = 'Reunião de Fim de Semana';

        setViewingSchedule({
            id: event.id,
            type: type,
            title: title,
            date: event.date,
            details: '',
            fullData: event as any,
        });
    };

    const welcomeMessage = `Olá, ${user?.displayName || user?.email?.split('@')[0] || 'irmão'}!`;

    const QuickAccessButton: React.FC<{ to: string; icon: React.FC<any>; label: string; color: string }> = ({ to, icon: Icon, label, color }) => (
        <Link to={to} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
            <Icon className={`h-7 w-7 ${color}`} />
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{label}</span>
        </Link>
    );
    
    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{welcomeMessage}</h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Aqui está um resumo de sua congregação.</p>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                        <QuickAccessButton to="/resumo" icon={ChartBarIcon} label="Resumo" color="text-indigo-500" />
                        <QuickAccessButton to="/designacoes" icon={AssignmentsIcon} label="Designações" color="text-orange-500" />
                        <QuickAccessButton to="/anuncios" icon={MegaphoneIcon} label="Anúncios" color="text-sky-500" />
                    </div>
                </div>

                {nextAppointment && (
                    <div className="bg-gradient-to-br from-primary to-blue-700 dark:from-slate-800 dark:to-slate-900 text-white rounded-3xl p-6 shadow-xl animate-fade-in-up">
                        <p className="text-sm font-semibold uppercase tracking-wider text-blue-200 dark:text-blue-300">Seu Próximo Compromisso</p>
                        <h3 className="text-xl font-bold mt-2">{nextAppointment.type}</h3>
                        <p className="text-blue-100 dark:text-blue-200">{nextAppointment.title}</p>
                        <p className="mt-3 font-semibold">{nextAppointment.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                        <button onClick={() => handleViewDetails(nextAppointment.fullData, nextAppointment.type)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
                            Ver Detalhes <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}
                
                <AnnouncementsWidget announcements={announcements} isLoading={isLoadingAnnouncements} />

                {/* Upcoming Congregation Schedules Grid */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 px-2">Próximas Programações</h2>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <LifeMinistryWidget
                            schedule={nextLifeMinistry}
                            isLoading={isLoadingSchedules}
                            onDetailsClick={(schedule) => handleViewDetails(schedule, 'Vida e Ministério')}
                        />
                        <AssignmentsWidget
                            schedule={nextAssignment}
                            isLoading={isLoadingSchedules}
                            onDetailsClick={(schedule) => handleViewDetails(schedule, 'Designações')}
                        />
                        <PublicTalkWidget
                            schedule={nextPublicTalk}
                            isLoading={isLoadingSchedules}
                            onDetailsClick={(schedule) => handleViewDetails(schedule, 'Discurso Público')}
                        />
                         <div>
                             <CombinedScheduleWidget
                                cleaningSchedule={nextCleaning}
                                fieldServiceMeeting={nextFieldService}
                                isLoading={isLoadingSchedules}
                            />
                        </div>
                    </div>
                </div>

            </div>
            
            <ScheduleDetailModal
                schedule={viewingSchedule}
                onClose={() => setViewingSchedule(null)}
            />
        </>
    );
};

export default Dashboard;
