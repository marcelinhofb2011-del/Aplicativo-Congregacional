import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
    getSchedules,
    getAssignments,
    getCleaningSchedules,
    getConductorMeetings,
    getPublicTalks,
    getShepherdingVisits,
    getFirstSundayConductors
} from '../services/firestoreService';
import type { LifeMinistrySchedule, Assignment, CleaningSchedule, ConductorMeeting, PublicTalkSchedule, ShepherdingVisit, FirstSundayConductor } from '../types';

export type ScheduleItem = LifeMinistrySchedule | Assignment | CleaningSchedule | ConductorMeeting | PublicTalkSchedule | ShepherdingVisit | FirstSundayConductor;

interface ScheduleContextType {
    schedules: ScheduleItem[];
    isLoading: boolean;
    error: string | null;
    forceUpdate: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updateTrigger, setUpdateTrigger] = useState(0);

    const forceUpdate = useCallback(() => {
        setUpdateTrigger(prev => prev + 1);
    }, []);
    
    useEffect(() => {
        if (user) {
            const fetchAllSchedules = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    // Buscar todos os tipos de agendamentos em paralelo
                    const results = await Promise.all([
                        getSchedules(),
                        getAssignments(),
                        getCleaningSchedules(),
                        getConductorMeetings(),
                        getPublicTalks(),
                        getShepherdingVisits(),
                        getFirstSundayConductors(),
                    ]);
                    
                    const allSchedules = results.flat();
                    setSchedules(allSchedules);
                } catch (err) {
                    console.error("Falha ao buscar programações:", err);
                    setError("Não foi possível carregar as programações do banco de dados.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAllSchedules();
        } else {
            // Limpa os dados quando o usuário faz logout
            setSchedules([]);
            setIsLoading(false);
        }
    }, [user, updateTrigger]);

    return (
        <ScheduleContext.Provider value={{ schedules, isLoading, error, forceUpdate }}>
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
