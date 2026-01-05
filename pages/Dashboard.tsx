

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
    getSchedules as fetchLifeMinistrySchedules,
    getAssignments,
    getCleaningSchedules,
    getConductorMeetings,
    getPublicTalks,
} from '../services/firestoreService';
import {
    BaseRecord
} from '../types';
import DashboardWindow from '../components/DashboardWindow';
import { LifeMinistryIcon, AssignmentsIcon, CleaningIcon, ConductorIcon, PublicTalkIcon } from '../components/icons/Icons';

interface SectionData {
    title: string;
    icon: React.FC<{ className?: string }>;
    colorClass: string;
    path: string;
    count: number;
    hasNewItem: boolean;
}

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [sections, setSections] = useState<SectionData[]>([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);
            try {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                const [
                    lifeMinistrySchedules,
                    assignments,
                    cleaningSchedules,
                    conductorMeetings,
                    publicTalks,
                ] = await Promise.all([
                    fetchLifeMinistrySchedules(),
                    getAssignments(),
                    getCleaningSchedules(),
                    getConductorMeetings(),
                    getPublicTalks(),
                ]);

                const lastVisit = localStorage.getItem('lastDashboardVisit');
                const lastVisitDate = lastVisit ? new Date(lastVisit) : null;

                const checkNewItems = (items: BaseRecord[]) => {
                    if (!lastVisitDate) return false;
                    return items.some(item => new Date(item.createdAt) > lastVisitDate);
                };

                const filterUpcoming = (items: (BaseRecord & { date: string, endDate?: string })[]) => {
                    return items.filter(item => {
                        // Special handling for cleaning schedules with an end date
                        const itemEndDate = item.endDate ? new Date(item.endDate) : new Date(item.date);
                        itemEndDate.setUTCHours(23, 59, 59, 999);
                        return itemEndDate >= today;
                    });
                };
                
                // Garante que apenas discursos locais sejam considerados para o painel.
                const localPublicTalks = publicTalks.filter(talk => talk.type === 'local');
                
                const dashboardSections: SectionData[] = [
                    {
                        title: 'Vida e Ministério',
                        icon: LifeMinistryIcon,
                        colorClass: 'text-green-500',
                        path: '/vida-e-ministerio',
                        count: filterUpcoming(lifeMinistrySchedules).length,
                        hasNewItem: checkNewItems(lifeMinistrySchedules),
                    },
                    {
                        title: 'Designações',
                        icon: AssignmentsIcon,
                        colorClass: 'text-orange-500',
                        path: '/designacoes',
                        count: filterUpcoming(assignments).length,
                        hasNewItem: checkNewItems(assignments),
                    },
                    {
                        title: 'Limpeza',
                        icon: CleaningIcon,
                        colorClass: 'text-purple-500',
                        path: '/limpeza',
                        count: filterUpcoming(cleaningSchedules).length,
                        hasNewItem: checkNewItems(cleaningSchedules),
                    },
                    {
                        title: 'Serviço de Campo',
                        icon: ConductorIcon,
                        colorClass: 'text-cyan-500',
                        path: '/dirigentes',
                        count: filterUpcoming(conductorMeetings).length,
                        hasNewItem: checkNewItems(conductorMeetings),
                    },
                    {
                        title: 'Discursos Locais',
                        icon: PublicTalkIcon,
                        colorClass: 'text-indigo-600',
                        path: '/discurso-publico',
                        count: filterUpcoming(localPublicTalks).length,
                        hasNewItem: checkNewItems(localPublicTalks),
                    }
                ];

                setSections(dashboardSections);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
                localStorage.setItem('lastDashboardVisit', new Date().toISOString());
            }
        };

        loadDashboardData();
    }, []);

    const welcomeMessage = `Olá, ${user?.displayName || user?.email?.split('@')[0] || 'irmão'}!`;
    
    const hasAnyNewItem = sections.some(s => s.hasNewItem);


    return (
        <div className="space-y-8">
            <div className="px-4 sm:px-0">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {welcomeMessage}
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    {hasAnyNewItem 
                        ? "Você tem novas designações. Confira as seções abaixo."
                        : "Aqui está um resumo das suas próximas atividades."
                    }
                </p>
            </div>

            {isLoading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-48 bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse"></div>
                     ))}
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sections.map((section, index) => (
                         <div key={section.title} className="animate-fade-in-up" style={{ animationDelay: `${index * 75}ms` }}>
                            <DashboardWindow
                                title={section.title}
                                icon={section.icon}
                                count={section.count}
                                path={section.path}
                                colorClass={section.colorClass}
                                hasNewItem={section.hasNewItem}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;