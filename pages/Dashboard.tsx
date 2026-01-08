
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
} from '../types';
import DashboardWindow from '../components/DashboardWindow';
import { SECONDARY_NAV_ITEMS } from '../constants';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { schedules, isLoading } = useSchedules();
    const location = useLocation();
    const [dashboardWindows, setDashboardWindows] = useState<any[]>([]);

    useEffect(() => {
        if (!user || isLoading) return;

        const loadDashboardData = () => {
            try {
                const lifeMinistrySchedules = schedules.filter(s => 'president' in s) as LifeMinistrySchedule[];
                const assignments = schedules.filter(s => 'indicator1' in s || 'mic1' in s) as Assignment[];
                const cleaningSchedules = schedules.filter(s => 'endDate' in s) as CleaningSchedule[];
                const conductorMeetings = schedules.filter(s => 'conductorName' in s) as ConductorMeeting[];
                const publicTalks = schedules.filter(s => 'theme' in s && 'speakerName' in s) as PublicTalkSchedule[];
                const shepherdingVisits = schedules.filter(s => 'brotherName' in s) as ShepherdingVisit[];

                const today = new Date();
                today.setUTCHours(0, 0, 0, 0);
                
                const isUpcoming = (item: any, typeHint: string): boolean => {
                    const scheduleData = item.fullData || item;
                    
                    if (typeHint === 'Limpeza' || typeHint === '/limpeza') {
                        return new Date(scheduleData.endDate) >= today;
                    }
                    if (typeHint === 'Vida e Ministério' || typeHint === '/vida-e-ministerio') {
                        const startDate = new Date(scheduleData.date);
                        const endDate = new Date(startDate);
                        endDate.setUTCDate(endDate.getUTCDate() + 6);
                        return endDate >= today;
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
                    '/vida-e-ministerio': lifeMinistrySchedules,
                    '/designacoes': assignments,
                    '/limpeza': cleaningSchedules,
                    '/dirigentes': conductorMeetings,
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
    }, [user, schedules, isLoading, location]);

    const welcomeMessage = `Olá, ${user?.displayName || user?.email?.split('@')[0] || 'irmão'}!`;
    const subtitle = user?.role === UserRole.SERVANT
        ? "Aqui está um resumo das próximas atividades."
        : "Consulte as próximas atividades da congregação.";

    const renderDashboardContent = () => (
        <>
            {isLoading && dashboardWindows.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardWindows.length > 0 ? dashboardWindows.map((window, index) => (
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
                    )) : (
                         <div className="sm:col-span-2 lg:col-span-3 text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Nenhuma programação futura encontrada.</h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Quando novas programações forem criadas, elas aparecerão aqui.</p>
                        </div>
                    )}
                </div>
            )}
        </>
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

            <div className="p-4 sm:p-6 lg:p-8">
                {renderDashboardContent()}
            </div>
        </>
    );
};

export default Dashboard;