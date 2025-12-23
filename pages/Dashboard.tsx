
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
    getSchedules as fetchLifeMinistrySchedules,
    getAssignments,
    getCleaningSchedules,
    getConductorMeetings,
    getPublicTalks,
    getAttendanceRecords,
} from '../services/firestoreService';
import {
    LifeMinistrySchedule,
    Schedule,
    Assignment,
    CleaningSchedule,
    ConductorMeeting,
    PublicTalkSchedule,
    AttendanceRecord,
    BaseRecord
} from '../types';
import ScheduleCard from '../components/ScheduleCard';
import DetailedScheduleModal from '../components/ScheduleDetailModal';

type FullScheduleData = LifeMinistrySchedule | Assignment | CleaningSchedule | ConductorMeeting | PublicTalkSchedule;

// This interface is compatible with the `Schedule` type expected by ScheduleCard
// but also includes the full data object for the detailed modal.
export interface DashboardSchedule {
    id: string;
    type: string;
    title: string;
    date: string;
    details: string; // Kept for type compatibility, but not used in the new modal.
    fullData: FullScheduleData;
}


const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<DashboardSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSchedule, setSelectedSchedule] = useState<DashboardSchedule | null>(null);
    const [showNewAssignmentBadge, setShowNewAssignmentBadge] = useState(false);
    const [showPendingAttendanceBadge, setShowPendingAttendanceBadge] = useState(false);

    useEffect(() => {
        const loadSchedulesAndBadges = async () => {
            setIsLoading(true);
            try {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                // Fetch all data in parallel from local storage
                const [
                    lifeMinistrySchedules,
                    assignments,
                    cleaningSchedules,
                    conductorMeetings,
                    publicTalks,
                    attendanceRecords,
                ] = await Promise.all([
                    fetchLifeMinistrySchedules(),
                    getAssignments(),
                    getCleaningSchedules(),
                    getConductorMeetings(),
                    getPublicTalks(),
                    getAttendanceRecords(),
                ]);

                // --- Badge Logic ---
                try {
                    const lastVisit = localStorage.getItem('lastDashboardVisit');
                    const lastVisitDate = lastVisit ? new Date(lastVisit) : null;
                    
                    // 1. Check for new assignments
                    if (lastVisitDate) {
                        const hasNewAssignment = assignments.some(a => new Date(a.createdAt) > lastVisitDate);
                        if (hasNewAssignment) {
                            setShowNewAssignmentBadge(true);
                        }
                    }

                    // 2. Check for pending attendance for midweek meetings
                    const reportedDates = new Set(attendanceRecords.map(r => new Date(r.date).toISOString().split('T')[0]));
                    const hasPendingAttendance = lifeMinistrySchedules.some(schedule => {
                        const weekStartDate = new Date(schedule.date);
                        // Midweek meeting is on Wednesday (Monday UTC + 2 days)
                        const meetingDate = new Date(weekStartDate);
                        meetingDate.setUTCDate(weekStartDate.getUTCDate() + 2);
                        
                        if (meetingDate < today && !reportedDates.has(meetingDate.toISOString().split('T')[0])) {
                            return true; // Found a pending attendance
                        }
                        return false;
                    });

                    if (hasPendingAttendance) {
                        setShowPendingAttendanceBadge(true);
                    }

                } catch (badgeError) {
                    console.error("Error processing notification badges:", badgeError);
                    // App continues to work without badges on error, as requested.
                }


                // Map each data type to the generic DashboardSchedule type
                const mappedLMS = lifeMinistrySchedules.map((lms: LifeMinistrySchedule): DashboardSchedule => ({
                    id: lms.id,
                    type: 'Vida e Ministério',
                    title: `Reunião: ${lms.week}`,
                    date: lms.date,
                    details: '', // Not used
                    fullData: lms
                }));

                const mappedAssignments = assignments.map((a: Assignment): DashboardSchedule => ({
                    id: a.id,
                    type: 'Designações',
                    title: 'Designações de Plataforma',
                    date: a.date,
                    details: '', // Not used
                    fullData: a
                }));

                const mappedCleaning = cleaningSchedules.map((cs: CleaningSchedule): DashboardSchedule => ({
                    id: cs.id,
                    type: 'Limpeza',
                    title: `Limpeza - ${cs.group}`,
                    date: cs.date,
                    details: '', // Not used
                    fullData: cs
                }));

                const mappedConductors = conductorMeetings.map((cm: ConductorMeeting): DashboardSchedule => ({
                    id: cm.id,
                    type: 'Dirigentes',
                    title: `Dirigente: ${cm.conductorName}`,
                    date: cm.date,
                    details: '', // Not used
                    fullData: cm
                }));
                
                const mappedPublicTalks = publicTalks
                    .filter(pt => pt.type === 'local')
                    .map((pt: PublicTalkSchedule): DashboardSchedule => ({
                        id: pt.id,
                        type: 'Discurso Público',
                        title: pt.theme,
                        date: pt.date,
                        details: '', // Not used
                        fullData: pt
                    }));

                // Combine all schedules
                const allSchedules: DashboardSchedule[] = [
                    ...mappedLMS,
                    ...mappedAssignments,
                    ...mappedCleaning,
                    ...mappedConductors,
                    ...mappedPublicTalks,
                ];

                // Filter for future events and sort
                const futureSchedules = allSchedules
                    .filter(schedule => {
                        const scheduleEndDate = schedule.type === 'Limpeza'
                            ? new Date((schedule.fullData as CleaningSchedule).endDate)
                            : new Date(schedule.date);
                        
                        scheduleEndDate.setUTCHours(23, 59, 59, 999); // Ensure end of day
                        return scheduleEndDate >= today;
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                setSchedules(futureSchedules);
            } catch (error) {
                console.error("Failed to fetch schedules:", error);
            } finally {
                setIsLoading(false);
                // Update last visit time AFTER checks are done
                localStorage.setItem('lastDashboardVisit', new Date().toISOString());
            }
        };

        loadSchedulesAndBadges();
    }, []);

    const handleDetailsClick = (schedule: Schedule) => {
        setSelectedSchedule(schedule as DashboardSchedule);
    };

    const handleCloseModal = () => {
        setSelectedSchedule(null);
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Painel</h2>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                    Olá, {user?.email}! Aqui estão suas próximas programações.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    {showNewAssignmentBadge && (
                        <span className="animate-slow-pulse inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                            Nova designação
                        </span>
                    )}
                    {showPendingAttendanceBadge && (
                        <span className="animate-slow-pulse inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                            Assistência pendente
                        </span>
                    )}
                </div>
            </div>

            {isLoading ? (
                 <div className="text-center py-10"><p>Carregando programações...</p></div>
            ) : schedules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {schedules.map((schedule, index) => (
                        <div key={schedule.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                             <ScheduleCard 
                                schedule={schedule} 
                                onDetailsClick={handleDetailsClick}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhuma programação futura encontrada.</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Verifique novamente mais tarde ou adicione novas designações no menu.</p>
                </div>
            )}
            
            <DetailedScheduleModal 
                schedule={selectedSchedule} 
                onClose={handleCloseModal} 
            />
        </div>
    );
};

export default Dashboard;
