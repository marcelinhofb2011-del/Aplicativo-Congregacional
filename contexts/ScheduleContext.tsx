import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
    subscribeSchedules,
    subscribeAssignments,
    subscribeCleaningSchedules,
    subscribeConductorMeetings,
    subscribePublicTalks,
    subscribeShepherdingVisits,
    subscribeFirstSundayConductors,
    subscribeMeetingSchedules
} from '../services/firestoreService';
import type { LifeMinistrySchedule, Assignment, CleaningSchedule, ConductorMeeting, PublicTalkSchedule, ShepherdingVisit, FirstSundayConductor, MeetingSchedule } from '../types';

export type ScheduleItem = LifeMinistrySchedule | Assignment | CleaningSchedule | ConductorMeeting | PublicTalkSchedule | ShepherdingVisit | FirstSundayConductor | MeetingSchedule;

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

    // State for individual collections to combine them
    const [collData, setCollData] = useState<{
        programacao: LifeMinistrySchedule[];
        designacoes: Assignment[];
        limpeza: CleaningSchedule[];
        dirigentes: ConductorMeeting[];
        discursos: PublicTalkSchedule[];
        pastoreio: ShepherdingVisit[];
        dirigentesPrimeiro: FirstSundayConductor[];
        programacoesReuniao: MeetingSchedule[];
    }>({
        programacao: [],
        designacoes: [],
        limpeza: [],
        dirigentes: [],
        discursos: [],
        pastoreio: [],
        dirigentesPrimeiro: [],
        programacoesReuniao: []
    });

    const forceUpdate = useCallback(() => {
        setUpdateTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (!user) {
            setSchedules([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const unsubscribes: (() => void)[] = [];

        try {
            unsubscribes.push(subscribeSchedules(data => setCollData(prev => ({ ...prev, programacao: data }))));
            unsubscribes.push(subscribeAssignments(data => setCollData(prev => ({ ...prev, designacoes: data }))));
            unsubscribes.push(subscribeCleaningSchedules(data => setCollData(prev => ({ ...prev, limpeza: data }))));
            unsubscribes.push(subscribeConductorMeetings(data => setCollData(prev => ({ ...prev, dirigentes: data }))));
            unsubscribes.push(subscribePublicTalks(data => setCollData(prev => ({ ...prev, discursos: data }))));
            unsubscribes.push(subscribeShepherdingVisits(data => setCollData(prev => ({ ...prev, pastoreio: data }))));
            unsubscribes.push(subscribeFirstSundayConductors(data => setCollData(prev => ({ ...prev, dirigentesPrimeiro: data }))));
            unsubscribes.push(subscribeMeetingSchedules(data => setCollData(prev => ({ ...prev, programacoesReuniao: data }))));

            // Set loading to false once we have initial data from all (or at least some)
            // For simplicity, we'll just set it to false after a short delay or when the first update comes in
            const timeout = setTimeout(() => setIsLoading(false), 1000);
            return () => {
                unsubscribes.forEach(unsub => unsub());
                clearTimeout(timeout);
            };
        } catch (err) {
            console.error("Falha ao configurar ouvintes em tempo real:", err);
            setError("Não foi possível carregar as programações em tempo real.");
            setIsLoading(false);
        }
    }, [user, updateTrigger]);

    // Combine all data whenever any collection updates
    useEffect(() => {
        const allSchedules: ScheduleItem[] = [
            ...collData.programacao,
            ...collData.designacoes,
            ...collData.limpeza,
            ...collData.dirigentes,
            ...collData.discursos,
            ...collData.pastoreio,
            ...collData.dirigentesPrimeiro,
            ...collData.programacoesReuniao
        ];
        setSchedules(allSchedules);
    }, [collData]);

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
