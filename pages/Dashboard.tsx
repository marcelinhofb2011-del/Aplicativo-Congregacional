
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
    PublicTalkSchedule,
    Announcement
} from '../types';
import { cleanupExpiredRecords, getFirstSundayConductors, getAnnouncements } from '../services/firestoreService';
import ScheduleDetailModal from '../components/ScheduleDetailModal';
import { Link } from 'react-router-dom';
import { AssignmentsIcon, ChevronRightIcon, CalendarDaysIcon, MegaphoneIcon } from '../components/icons/Icons';
import LifeMinistryWidget from '../components/LifeMinistryWidget';
import AssignmentsWidget from '../components/AssignmentsWidget';
import CombinedScheduleWidget from '../components/CombinedScheduleWidget';
import PublicTalkWidget from '../components/PublicTalkWidget';
import FirstSundayConductorWidget from '../components/FirstSundayConductorWidget';

type UpcomingEvent = {
    date: Date;
    type: 'Vida e Ministério' | 'Designações' | 'Limpeza' | 'Serviço de Campo' | 'Discurso Público';
    title: string;
    description: string;
    fullData: LifeMinistrySchedule | Assignment | CleaningSchedule | ConductorMeeting | PublicTalkSchedule;
};

// Helper for events that span a period (Life & Ministry, Cleaning)
const findNextUpcomingRange = <T extends { date: string, endDate?: string }>(items: T[]): T | undefined => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const today = new Date(todayStr + 'T00:00:00Z');

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
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const today = new Date(todayStr + 'T00:00:00Z');

    return items
        .filter(item => item.date && !isNaN(new Date(item.date).getTime()))
        .filter(item => new Date(item.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
};

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { schedules, isLoading: isLoadingSchedules } = useSchedules();
    const [viewingSchedule, setViewingSchedule] = useState<DashboardSchedule | null>(null);
    const [nextAppointment, setNextAppointment] = useState<UpcomingEvent | null>(null);
    const [userAssignments, setUserAssignments] = useState<UpcomingEvent[]>([]);
    const [firstSundayConductor, setFirstSundayConductor] = useState<any>();
    const [isLoadingFirstSunday, setIsLoadingFirstSunday] = useState(true);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);

    // State for each type of schedule widget
    const [nextLifeMinistry, setNextLifeMinistry] = useState<LifeMinistrySchedule | undefined>();
    const [nextAssignment, setNextAssignment] = useState<Assignment | undefined>();
    const [nextCleaning, setNextCleaning] = useState<CleaningSchedule | undefined>();
    const [nextFieldService, setNextFieldService] = useState<ConductorMeeting | undefined>();
    const [nextPublicTalk, setNextPublicTalk] = useState<PublicTalkSchedule | undefined>();


    useEffect(() => {
        if (user) {
            cleanupExpiredRecords(user.uid);
        }
    }, [user]);

    useEffect(() => {
        const fetchFirstSundayData = async () => {
            if (!user) return;
            setIsLoadingFirstSunday(true);
            try {
                const data = await getFirstSundayConductors();
                const now = new Date();
                const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
                const today = new Date(todayStr + 'T00:00:00Z');

                // Find the first conductor whose date is today or in the future
                const nextConductor = data.find(c => new Date(c.date) >= today);
                setFirstSundayConductor(nextConductor || data[data.length - 1]);
            } catch (error) {
                console.error("Failed to fetch first sunday conductors:", error);
            } finally {
                setIsLoadingFirstSunday(false);
            }
        };

        fetchFirstSundayData();
    }, [user]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setIsLoadingAnnouncements(true);
            try {
                const data = await getAnnouncements();
                setAnnouncements(data);
            } catch (error) {
                console.error("Failed to fetch announcements:", error);
            } finally {
                setIsLoadingAnnouncements(false);
            }
        };
        fetchAnnouncements();
    }, []);

    useEffect(() => {
        if (!user || isLoadingSchedules) return;

        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        const today = new Date(todayStr + 'T00:00:00Z');

        const allUpcomingEvents: UpcomingEvent[] = schedules.map(s => {
            // This mapping is now only for the "Next Personal Appointment" feature
            if ('week' in s && s.president) return { date: new Date(s.date), type: 'Vida e Ministério', title: s.week, description: `Presidente: ${s.president}`, fullData: s };
            if ('president' in s && !('week' in s)) return { date: new Date(s.date), type: 'Designações', title: 'Reunião de Fim de Semana', description: `Presidente: ${s.president}`, fullData: s };
            if ('group' in s && 'endDate' in s) return { date: new Date(s.date), type: 'Limpeza', title: s.group, description: `Responsáveis: ${s.assignedUids?.join(', ') || 'Grupo'}`, fullData: s };
            if ('conductorName' in s) return { date: new Date(s.date), type: 'Serviço de Campo', title: 'Saída de campo', description: `Dirigente: ${s.conductorName}`, fullData: s };
            return null;
        }).filter((e): e is UpcomingEvent => e !== null && e.date >= today)
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        const userAssignmentsList = allUpcomingEvents.filter(event => 
            event.fullData.assignedUids?.includes(user.uid)
        );
        
        setUserAssignments(userAssignmentsList);
        setNextAppointment(userAssignmentsList.length > 0 ? userAssignmentsList[0] : null);

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

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 space-y-4">
                {/* Header Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-7 lg:col-span-8">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{welcomeMessage}</h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Resumo da congregação.</p>
                        </div>
                    </div>

                    <div className="md:col-span-5 lg:col-span-4">
                        <FirstSundayConductorWidget conductor={firstSundayConductor} isLoading={isLoadingFirstSunday} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left Column: Personal Assignments */}
                    <div className="lg:col-span-5">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 h-full min-h-[120px] flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <AssignmentsIcon className="h-5 w-5 text-primary" />
                                    Sua Próxima Designação
                                </h2>
                            </div>
                            
                            {isLoadingSchedules ? (
                                <div className="h-12 bg-slate-100 dark:bg-slate-700 animate-pulse rounded-xl"></div>
                            ) : nextAppointment ? (
                                <button 
                                    onClick={() => handleViewDetails(nextAppointment.fullData, nextAppointment.type)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <AssignmentsIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {nextAppointment.type === 'Designações' ? 'Partes Mecânicas' : nextAppointment.type}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {nextAppointment.date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRightIcon className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                                </button>
                            ) : (
                                <div className="text-center py-2">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma próxima.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Congregation Schedules */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="px-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Próximas Programações</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <CombinedScheduleWidget
                                cleaningSchedule={nextCleaning}
                                fieldServiceMeeting={nextFieldService}
                                isLoading={isLoadingSchedules}
                            />
                        </div>
                    </div>
                </div>

                {/* Announcements Section */}
                <div className="mt-4 px-2">
                    <div className="flex items-center gap-2 mb-3">
                        <MegaphoneIcon className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Anúncios e Eventos</h2>
                    </div>
                    
                    {isLoadingAnnouncements ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                            ))}
                        </div>
                    ) : announcements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {announcements.map(ann => (
                                <div key={ann.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{ann.title}</h3>
                                        {ann.isPinned && (
                                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary"></span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                                        {ann.body}
                                    </p>
                                    <div className="mt-2 flex justify-end">
                                        <span className="text-[9px] text-slate-400">
                                            {new Date(ann.createdAt).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum anúncio no momento.</p>
                        </div>
                    )}
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
