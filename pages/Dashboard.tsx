
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
    getSchedules as fetchLifeMinistrySchedules,
    getAssignments,
    getCleaningSchedules,
    getConductorMeetings,
    getPublicTalks,
    getShepherdingVisits,
} from '../services/firestoreService';
import {
    LifeMinistrySchedule,
    Assignment,
    CleaningSchedule,
    ConductorMeeting,
    PublicTalkSchedule,
    ShepherdingVisit,
    DashboardSchedule,
    UserRole,
    BaseRecord,
} from '../types';
import ScheduleCard from '../components/ScheduleCard';
import ScheduleDetailModal from '../components/ScheduleDetailModal';
import DashboardWindow from '../components/DashboardWindow';
import { SECONDARY_NAV_ITEMS } from '../constants';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);

    // States for different user roles
    const [dashboardWindows, setDashboardWindows] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<DashboardSchedule[]>([]);
    
    const [selectedSchedule, setSelectedSchedule] = useState<DashboardSchedule | null>(null);

    useEffect(() => {
        if (!user) return;

        const loadDashboardData = async () => {
            setIsLoading(true);
            try {
                const [
                    lifeMinistrySchedules,
                    assignments,
                    cleaningSchedules,
                    conductorMeetings,
                    publicTalks,
                    shepherdingVisits,
                ] = await Promise.all([
                    fetchLifeMinistrySchedules(),
                    getAssignments(),
                    getCleaningSchedules(),
                    getConductorMeetings(),
                    getPublicTalks(),
                    getShepherdingVisits(),
                ]);

                const today = new Date();
                today.setUTCHours(0, 0, 0, 0);
                
                // Helper to determine if a schedule is still upcoming based on its type
                const isUpcoming = (item: any, typeHint: string): boolean => {
                    const scheduleData = item.fullData || item;
                    
                    if (typeHint === 'Limpeza' || typeHint === '/limpeza') {
                        return new Date(scheduleData.endDate) >= today;
                    }
                    if (typeHint === 'Vida e Ministério' || typeHint === '/vida-e-ministerio') {
                        const startDate = new Date(scheduleData.date);
                        startDate.setUTCDate(startDate.getUTCDate() + 6);
                        return startDate >= today;
                    }
                    return new Date(scheduleData.date) >= today;
                };

                if (user.role === UserRole.SERVANT) {
                    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    const hasNew = (items: BaseRecord[]) => items.some(s => s.createdAt && new Date(s.createdAt) > twentyFourHoursAgo);
                    const dataMap: { [key: string]: BaseRecord[] } = {
                        '/vida-e-ministerio': lifeMinistrySchedules,
                        '/designacoes': assignments,
                        '/limpeza': cleaningSchedules,
                        '/dirigentes': conductorMeetings,
                        '/pastoreio': shepherdingVisits,
                        '/discurso-publico': publicTalks,
                    };
                    
                    const windows = SECONDARY_NAV_ITEMS
                        .filter(item => dataMap[item.path])
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
                    setSchedules([]); // Clear schedule list for servant view

                } else {
                    // Publisher view logic
                    const mappedLMS: DashboardSchedule[] = lifeMinistrySchedules.map(s => ({ id: s.id, type: 'Vida e Ministério', title: `Reunião: ${s.week}`, date: s.date, details: `Presidente: ${s.president}`, fullData: s }));
                    const mappedAssignments: DashboardSchedule[] = assignments.map(a => ({ id: a.id, type: 'Designações', title: 'Designações de Plataforma', date: a.date, details: `Indicadores, Microfones, Leitor...`, fullData: a }));
                    const mappedCleaning: DashboardSchedule[] = cleaningSchedules.map(c => ({ id: c.id, type: 'Limpeza', title: `Limpeza: ${c.group}`, date: c.date, details: `Responsáveis: ${c.group}`, fullData: c }));
                    const mappedConductors: DashboardSchedule[] = conductorMeetings.map(c => ({ id: c.id, type: 'Serviço de Campo', title: 'Reunião de Saída de Campo', date: c.date, details: `Dirigente: ${c.conductorName}`, fullData: c }));
                    const mappedPublicTalks: DashboardSchedule[] = publicTalks.filter(t => t.type === 'local').map(t => ({ id: t.id, type: 'Discurso Público', title: `Discurso: ${t.theme}`, date: t.date, details: `Orador: ${t.speakerName}`, fullData: t }));

                    const allSchedules = [...mappedLMS, ...mappedAssignments, ...mappedCleaning, ...mappedConductors, ...mappedPublicTalks];
                    const upcomingSchedules = allSchedules
                        .filter(s => isUpcoming(s, s.type))
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    
                    setSchedules(upcomingSchedules);
                    setDashboardWindows([]); // Clear dashboard windows for publisher view
                }

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, [user, location]);

    const handleDetailsClick = (schedule: DashboardSchedule) => setSelectedSchedule(schedule);
    const handleCloseModal = () => setSelectedSchedule(null);

    const welcomeMessage = `Olá, ${user?.displayName || user?.email?.split('@')[0] || 'irmão'}!`;
    const subtitle = user?.role === UserRole.SERVANT
        ? "Aqui está um resumo das próximas atividades."
        : "Consulte as próximas atividades e designações da congregação.";

    const renderUpcomingEvents = (limit?: number) => (
        isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-slate-200/50 dark:bg-slate-700/50 rounded-xl animate-pulse"></div>)}
            </div>
        ) : schedules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(limit ? schedules.slice(0, limit) : schedules).map((schedule, index) => (
                    <div key={schedule.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 75}ms` }}>
                        <ScheduleCard schedule={schedule} onDetailsClick={handleDetailsClick} />
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Nenhuma programação futura encontrada.</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Quando novas programações forem criadas, elas aparecerão aqui.</p>
            </div>
        )
    );

    const renderServantDashboard = () => (
        <>
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardWindows.map((window, index) => (
                        <div key={window.path} className="animate-fade-in-up" style={{ animationDelay: `${index * 75}ms` }}>
                            <DashboardWindow
                                title={window.label}
                                icon={window.icon}
                                count={window.count}
                                path={window.path}
                                colorClass={window.color || 'text-slate-500'}
                                hasNewItem={window.hasNewItem}
                            />
                        </div>
                    ))}
                </div>
            )}
        </>
    );

    return (
        <>
            <div className="sticky top-0 z-10 bg-[#65a30d] p-4 sm:p-6 lg:p-8">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                    {welcomeMessage}
                </h1>
                <p className="mt-2 text-lime-100">
                    {subtitle}
                </p>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
                {user?.role === UserRole.SERVANT ? renderServantDashboard() : renderUpcomingEvents()}
            </div>
            
            <ScheduleDetailModal 
                schedule={selectedSchedule}
                onClose={handleCloseModal}
            />
        </>
    );
};

export default Dashboard;
