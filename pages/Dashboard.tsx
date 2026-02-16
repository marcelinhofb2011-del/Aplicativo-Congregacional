

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSchedules } from '../contexts/ScheduleContext';
import {
    UserRole,
    BaseRecord,
    LifeMinistrySchedule,
    Assignment,
    CleaningSchedule,
    ConductorMeeting,
    PublicTalkSchedule,
    ShepherdingVisit,
    Announcement,
    DashboardSchedule,
} from '../types';
import DashboardWindow from '../components/DashboardWindow';
import AnnouncementsWidget from '../components/AnnouncementsWidget';
import { getAnnouncements } from '../services/firestoreService';
import { SECONDARY_NAV_ITEMS } from '../constants';
import LifeMinistryWidget from '../components/LifeMinistryWidget';
import ScheduleDetailModal from '../components/ScheduleDetailModal';
import AssignmentsWidget from '../components/AssignmentsWidget';
import CombinedScheduleWidget from '../components/CombinedScheduleWidget';


const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { schedules, isLoading: isLoadingSchedules } = useSchedules();
    const location = useLocation();
    const [dashboardWindows, setDashboardWindows] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
    const [viewingSchedule, setViewingSchedule] = useState<DashboardSchedule | null>(null);
    const [nextLifeMinistry, setNextLifeMinistry] = useState<LifeMinistrySchedule | undefined>(undefined);
    const [nextAssignment, setNextAssignment] = useState<Assignment | undefined>(undefined);
    const [nextCleaningSchedule, setNextCleaningSchedule] = useState<CleaningSchedule | undefined>(undefined);
    const [nextFieldServiceMeeting, setNextFieldServiceMeeting] = useState<ConductorMeeting | undefined>(undefined);

    useEffect(() => {
        const fetchAnnouncements = async () => {
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

        fetchAnnouncements();
    }, [user]);

    useEffect(() => {
        if (!user || isLoadingSchedules) return;

        const loadDashboardData = () => {
            try {
                const lifeMinistrySchedules = schedules.filter(s => 'president' in s && s.week) as LifeMinistrySchedule[];
                const assignments = schedules.filter(s => 'indicator1' in s || 'mic1' in s) as Assignment[];
                const cleaningSchedules = schedules.filter(s => 'endDate' in s) as CleaningSchedule[];
                const conductorMeetings = schedules.filter(s => 'conductorName' in s) as ConductorMeeting[];
                const publicTalks = schedules.filter(s => 'theme' in s && 'speakerName' in s) as PublicTalkSchedule[];
                const shepherdingVisits = schedules.filter(s => 'brotherName' in s) as ShepherdingVisit[];

                const today = new Date();
                today.setUTCHours(0, 0, 0, 0);
                
                const upcomingLifeMinistry = lifeMinistrySchedules
                    .filter(s => {
                        const startDate = new Date(s.date);
                        const endDate = new Date(startDate);
                        endDate.setUTCDate(endDate.getUTCDate() + 6);
                        return endDate >= today;
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                setNextLifeMinistry(upcomingLifeMinistry[0]);

                const upcomingAssignments = assignments
                    .filter(s => new Date(s.date) >= today)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setNextAssignment(upcomingAssignments[0]);

                const upcomingCleaning = cleaningSchedules
                    .filter(s => new Date(s.endDate) >= today)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setNextCleaningSchedule(upcomingCleaning[0]);

                const upcomingFieldService = conductorMeetings
                    .filter(s => new Date(s.date) >= today)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setNextFieldServiceMeeting(upcomingFieldService[0]);


                const isUpcoming = (item: any, typeHint: string): boolean => {
                    const scheduleData = item.fullData || item;

                    if (!scheduleData.date || isNaN(new Date(scheduleData.date).getTime())) {
                        return false;
                    }
                    
                    if (typeHint === 'Limpeza' || typeHint === '/limpeza') {
                        return new Date(scheduleData.endDate) >= today;
                    }
                    
                    return new Date(scheduleData.date) >= today;
                };
                
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const hasNew = (items: BaseRecord[]) => {
                    return items.some(s => s.createdAt && new Date(s.createdAt) > twentyFourHoursAgo);
                };

                const dashboardPublicTalks = user.role === UserRole.PUBLISHER
                    ? publicTalks.filter(talk => talk.type === 'local')
                    : publicTalks;

                const dataMap: { [key: string]: BaseRecord[] } = {
                    '/pastoreio': shepherdingVisits,
                    '/discurso-publico': dashboardPublicTalks,
                };
                
                const windows = SECONDARY_NAV_ITEMS
                    .filter(item => dataMap[item.path] && item.roles.includes(user.role))
                    .map(item => {
                        const data = dataMap[item.path];
                        const upcomingItems = data.filter(d => isUpcoming(d, item.path));
                        return {
                            ...item,
                            count: upcomingItems.length,
                            hasNewItem: hasNew(upcomingItems)
                        };
                    });
                setDashboardWindows(windows);

            } catch (error) {
                console.error("Failed to process dashboard data:", error);
            }
        };

        loadDashboardData();
    }, [user, schedules, isLoadingSchedules, location]);

    const handleViewLifeMinistryDetails = (scheduleData: LifeMinistrySchedule) => {
        setViewingSchedule({
            id: scheduleData.id,
            type: 'Vida e Ministério',
            title: `Programação - ${scheduleData.week}`,
            date: scheduleData.date,
            details: '',
            fullData: scheduleData,
        });
    };
    
    const handleViewAssignmentDetails = (scheduleData: Assignment) => {
        setViewingSchedule({
            id: scheduleData.id,
            type: 'Designações',
            title: `Designações - ${new Date(scheduleData.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`,
            date: scheduleData.date,
            details: '',
            fullData: scheduleData,
        });
    };

    const welcomeMessage = `Olá, ${user?.displayName || user?.email?.split('@')[0] || 'irmão'}!`;
    const subtitle = user?.role === UserRole.SERVANT
        ? "Aqui está um resumo das próximas atividades e anúncios."
        : "Consulte os anúncios e as próximas atividades da congregação.";

    const renderDashboardContent = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="animate-fade-in-up">
                <LifeMinistryWidget 
                    schedule={nextLifeMinistry}
                    isLoading={isLoadingSchedules}
                    onDetailsClick={handleViewLifeMinistryDetails}
                />
            </div>
             <div className="animate-fade-in-up" style={{ animationDelay: `75ms` }}>
                <AssignmentsWidget 
                    schedule={nextAssignment}
                    isLoading={isLoadingSchedules}
                    onDetailsClick={handleViewAssignmentDetails}
                />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                <CombinedScheduleWidget 
                    cleaningSchedule={nextCleaningSchedule}
                    fieldServiceMeeting={nextFieldServiceMeeting}
                    isLoading={isLoadingSchedules}
                />
            </div>
            {dashboardWindows.length > 0 ? dashboardWindows.map((window, index) => (
                <div key={window.path} className="animate-fade-in-up" style={{ animationDelay: `${(index + 3) * 75}ms` }}>
                    <DashboardWindow
                        title={window.label}
                        icon={window.icon}
                        count={window.count}
                        path={window.path}
                        colorClass={window.color || 'text-slate-500'}
                        hasNewItem={window.hasNewItem}
                    />
                </div>
            )) : (
                 !isLoadingSchedules && !nextLifeMinistry && !nextAssignment && !nextCleaningSchedule && !nextFieldServiceMeeting && (
                     <div className="sm:col-span-2 lg:col-span-3 text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Nenhuma outra programação futura encontrada.</h3>
                    </div>
                 )
            )}
        </div>
    );

    return (
        <>
            <div className="sticky top-0 z-10 bg-primary p-4 sm:p-6 lg:p-8">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                    {welcomeMessage}
                </h1>
                <p className="mt-2 text-blue-100">
                    {subtitle}
                </p>
            </div>

            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                <AnnouncementsWidget announcements={announcements} isLoading={isLoadingAnnouncements} />
                {renderDashboardContent()}
            </div>
            
            <ScheduleDetailModal
                schedule={viewingSchedule}
                onClose={() => setViewingSchedule(null)}
            />
        </>
    );
};

export default Dashboard;