
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
    getSchedules,
    getAssignments,
    getCleaningSchedules,
    getConductorMeetings,
    getPublicTalks,
    getShepherdingVisits
} from '../services/firestoreService';
import { LifeMinistrySchedule, Assignment, CleaningSchedule, ConductorMeeting, PublicTalkSchedule, ShepherdingVisit, BaseRecord } from '../types';

export type ScheduleItem = LifeMinistrySchedule | Assignment | CleaningSchedule | ConductorMeeting | PublicTalkSchedule | ShepherdingVisit;

interface ScheduleContextType {
    schedules: ScheduleItem[];
    isLoading: boolean;
    error: string | null;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Só busca os dados se houver um usuário logado
        if (user) {
            const fetchAllSchedules = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const [
                        lifeMinistry,
                        assignments,
                        cleaning,
                        conductors,
                        publicTalks,
                        shepherding,
                    ] = await Promise.all([
                        getSchedules(),
                        getAssignments(),
                        getCleaningSchedules(),
                        getConductorMeetings(),
                        getPublicTalks(),
                        getShepherdingVisits(),
                    ]);

                    const allSchedules: ScheduleItem[] = [
                        ...lifeMinistry,
                        ...assignments,
                        ...cleaning,
                        ...conductors,
                        ...publicTalks,
                        ...shepherding,
                    ];
                    
                    setSchedules(allSchedules);
                } catch (err) {
                    console.error("Failed to fetch all schedules:", err);
                    setError("Falha ao carregar as programações.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAllSchedules();
        } else {
            // Se o usuário deslogar, limpa os dados
            setSchedules([]);
            setIsLoading(false);
        }
    }, [user]);

    return (
        <ScheduleContext.Provider value={{ schedules, isLoading, error }}>
            {children}
        </ScheduleContext.Provider>
    );
};

export const useSchedules = () => {
    const context = useContext(ScheduleContext);
    if (context === undefined) {
        throw new Error('useSchedules must be used within a ScheduleProvider');
    }
    return context;
};
