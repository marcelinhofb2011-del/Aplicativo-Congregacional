
import { addDays, isSameDay } from 'date-fns';
import { notificationService } from './notificationService';
import { 
    NotificationType, 
    LifeMinistrySchedule, 
    Assignment, 
    CleaningSchedule, 
    PublicTalkSchedule
} from '../types';

export const assignmentNotificationService = {
    // Check for upcoming assignments and remind the user (client-side implementation)
    checkUpcomingReminders: async (userUid: string, schedules: any[]) => {
        const tomorrow = addDays(new Date(), 1);
        
        for (const schedule of schedules) {
            if (!schedule.date) continue;
            const scheduleDate = new Date(schedule.date);
            
            if (isSameDay(scheduleDate, tomorrow)) {
                // In a production app, we'd check if a reminder was already sent
                // For this implementation, we'll keep it simple
                await notificationService.createNotification({
                    userUid,
                    title: 'Lembrete: Designação amanhã',
                    description: `Você tem uma designação agendada para amanhã. Não se esqueça!`,
                    type: NotificationType.IMPORTANT_ALERT,
                    date: new Date().toISOString(),
                    referenceId: schedule.id,
                });
            }
        }
    },

    // Notify users in a Life & Ministry schedule
    notifyLifeMinistry: async (schedule: LifeMinistrySchedule) => {
        const uidsToNotify = new Set<string>();
        
        if (schedule.presidentUid) uidsToNotify.add(schedule.presidentUid);
        if (schedule.initialPrayerUid) uidsToNotify.add(schedule.initialPrayerUid);
        if (schedule.treasuresTheme?.speakerUid) uidsToNotify.add(schedule.treasuresTheme.speakerUid);
        if (schedule.spiritualGems?.speakerUid) uidsToNotify.add(schedule.spiritualGems.speakerUid);
        if (schedule.bibleReading?.studentUid) uidsToNotify.add(schedule.bibleReading.studentUid);
        if (schedule.congregationBibleStudy?.conductorUid) uidsToNotify.add(schedule.congregationBibleStudy.conductorUid);
        if (schedule.congregationBibleStudy?.readerUid) uidsToNotify.add(schedule.congregationBibleStudy.readerUid);
        if (schedule.finalPrayerUid) uidsToNotify.add(schedule.finalPrayerUid);

        schedule.studentParts?.forEach(part => {
            if (part.studentUid) uidsToNotify.add(part.studentUid);
            if (part.helperUid) uidsToNotify.add(part.helperUid);
        });

        schedule.christianLifeParts?.forEach(part => {
            if (part.speakerUid) uidsToNotify.add(part.speakerUid);
        });

        const promises = Array.from(uidsToNotify).map(uid => 
            notificationService.sendDesignationNotification(
                uid,
                'Nova Designação: Vida e Ministério',
                `Você tem uma parte na semana de ${schedule.week}. Confira os detalhes!`,
                schedule.id,
                NotificationType.DESIGNATION
            )
        );

        await Promise.all(promises);
    },

    // Notify users in a Platform Assignment
    notifyPlatformAssignment: async (assignment: Assignment) => {
        const uidsToNotify = new Set<string>();
        
        if (assignment.presidentUid) uidsToNotify.add(assignment.presidentUid);
        if (assignment.indicator1Uid) uidsToNotify.add(assignment.indicator1Uid);
        if (assignment.indicator2Uid) uidsToNotify.add(assignment.indicator2Uid);
        if (assignment.mic1Uid) uidsToNotify.add(assignment.mic1Uid);
        if (assignment.mic2Uid) uidsToNotify.add(assignment.mic2Uid);
        if (assignment.readerUid) uidsToNotify.add(assignment.readerUid);
        if (assignment.audioUid) uidsToNotify.add(assignment.audioUid);
        if (assignment.videoUid) uidsToNotify.add(assignment.videoUid);

        const promises = Array.from(uidsToNotify).map(uid => 
            notificationService.sendDesignationNotification(
                uid,
                'Nova Designação: Som e Indicadores',
                `Você foi designado para uma tarefa no dia ${new Date(assignment.date).toLocaleDateString('pt-BR')}.`,
                assignment.id,
                NotificationType.DESIGNATION
            )
        );

        await Promise.all(promises);
    },

    // Notify users in a Cleaning schedule
    notifyCleaning: async (schedule: CleaningSchedule) => {
        if (!schedule.assignedUids || schedule.assignedUids.length === 0) return;

        const promises = schedule.assignedUids.map(uid => 
            notificationService.sendDesignationNotification(
                uid,
                'Escala de Limpeza',
                `Seu grupo foi designado para a limpeza na semana de ${new Date(schedule.date).toLocaleDateString('pt-BR')}.`,
                schedule.id,
                NotificationType.CLEANING
            )
        );

        await Promise.all(promises);
    },

    // Notify user of a Public Talk
    notifyPublicTalk: async (schedule: PublicTalkSchedule) => {
        if (!schedule.assignedUids || schedule.assignedUids.length === 0) return;

        const promises = schedule.assignedUids.map(uid => 
            notificationService.sendDesignationNotification(
                uid,
                'Discurso Público',
                `Você tem um discurso agendado para o dia ${new Date(schedule.date).toLocaleDateString('pt-BR')}: "${schedule.theme}"`,
                schedule.id,
                NotificationType.DESIGNATION
            )
        );

        await Promise.all(promises);
    },

    // Notify of a generic schedule change
    notifyScheduleChange: async (uids: string[], title: string, message: string, referenceId: string) => {
        const promises = uids.map(uid => 
            notificationService.sendDesignationNotification(
                uid,
                title,
                message,
                referenceId,
                NotificationType.SCHEDULE_CHANGE
            )
        );

        await Promise.all(promises);
    },

    // Generic Important Alert
    broadcastAlert: async (uids: string[], title: string, message: string, referenceId?: string) => {
        const promises = uids.map(uid => 
            notificationService.sendDesignationNotification(
                uid,
                title,
                message,
                referenceId || '',
                NotificationType.IMPORTANT_ALERT
            )
        );

        await Promise.all(promises);
    }
};
