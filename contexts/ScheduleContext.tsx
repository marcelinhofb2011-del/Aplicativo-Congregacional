import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
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

    const queueUpdate = useCallback((key: keyof typeof collData, data: any) => {
        setCollData(prev => ({ ...prev, [key]: data }));
    }, []);

    useEffect(() => {
        if (!user) {
            setCollData({
                programacao: [],
                designacoes: [],
                limpeza: [],
                dirigentes: [],
                discursos: [],
                pastoreio: [],
                dirigentesPrimeiro: [],
                programacoesReuniao: []
            });
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const unsubscribes: (() => void)[] = [];

        try {
            unsubscribes.push(subscribeSchedules(data => queueUpdate('programacao', data)));
            unsubscribes.push(subscribeAssignments(data => queueUpdate('designacoes', data)));
            unsubscribes.push(subscribeCleaningSchedules(data => queueUpdate('limpeza', data)));
            unsubscribes.push(subscribeConductorMeetings(data => queueUpdate('dirigentes', data)));
            unsubscribes.push(subscribePublicTalks(data => queueUpdate('discursos', data)));
            unsubscribes.push(subscribeShepherdingVisits(data => queueUpdate('pastoreio', data)));
            unsubscribes.push(subscribeFirstSundayConductors(data => queueUpdate('dirigentesPrimeiro', data)));
            unsubscribes.push(subscribeMeetingSchedules(data => queueUpdate('programacoesReuniao', data)));

            // Set loading to false once we have initial data
            const timeout = setTimeout(() => setIsLoading(false), 800);
            return () => {
                unsubscribes.forEach(unsub => unsub());
                clearTimeout(timeout);
            };
        } catch (err) {
            console.error("Falha ao configurar ouvintes em tempo real:", err);
            setError("Não foi possível carregar as programações em tempo real.");
            setIsLoading(false);
        }
    }, [user, updateTrigger, queueUpdate]);

    // Compute schedules array via useMemo directly, eliminating an extra state commit loop
    const schedules = useMemo(() => {
        return [
            ...collData.programacao,
            ...collData.designacoes,
            ...collData.limpeza,
            ...collData.dirigentes,
            ...collData.discursos,
            ...collData.pastoreio,
            ...collData.dirigentesPrimeiro,
            ...collData.programacoesReuniao
        ];
    }, [
        collData.programacao,
        collData.designacoes,
        collData.limpeza,
        collData.dirigentes,
        collData.discursos,
        collData.pastoreio,
        collData.dirigentesPrimeiro,
        collData.programacoesReuniao
    ]);

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
