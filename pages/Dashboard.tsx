import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSchedules, ScheduleItem } from '../contexts/ScheduleContext';
import {
    LifeMinistrySchedule,
    Assignment,
    CleaningSchedule,
    ConductorMeeting,
    DashboardSchedule,
    PublicTalkSchedule,
    Announcement,
    FirstSundayConductor,
    MeetingSchedule,
    AppNotification
} from '../types';
import { getAnnouncements, cleanupExpiredRecords } from '../services/firestoreService';
import { notificationService } from '../services/notificationService';
import { assignmentNotificationService } from '../services/assignmentNotificationService';
import ScheduleDetailModal from '../components/ScheduleDetailModal';
import NotificationOverlay from '../components/NotificationOverlay';
import { Link } from 'react-router-dom';
import { getBrazilToday, parseDateAsUTC } from '../utils/dateUtils';
import { 
    ChevronRight, 
    Megaphone,
    BookOpen,
    Home,
    Users,
    Book,
    User,
    LogOut,
    Sun,
    Moon,
    Monitor,
    ShieldCheck,
    Info,
    Calendar,
    Bell,
    Gem,
    Library,
    Mic,
    Mic2,
    Video,
    LayoutGrid,
    Search,
    Star,
    MoreVertical,
    Clock,
    Layout,
    Play,
    Droplets,
    Tv,
    Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';
import { CLEANING_GROUPS } from '../constants';

type UpcomingEvent = {
    date: Date;
    type: 'Vida e Ministério' | 'Designações' | 'Limpeza' | 'Serviço de Campo' | 'Discurso Público' | 'Dirigente 1º Dom' | 'Reunião';
    title: string;
    description: string;
    fullData: LifeMinistrySchedule | Assignment | CleaningSchedule | ConductorMeeting | PublicTalkSchedule | FirstSundayConductor | MeetingSchedule;
};

const findNextUpcomingRange = <T extends { date: string, endDate?: string }>(items: T[]): T | undefined => {
    const today = getBrazilToday();

    return items
        .filter(item => {
            if (!item.date) return false;
            const start = parseDateAsUTC(item.date);
            
            let endDate: Date;
            if (item.endDate) {
                endDate = parseDateAsUTC(item.endDate);
                endDate.setUTCHours(23, 59, 59, 999);
            } else {
                endDate = new Date(start.getTime());
                endDate.setUTCDate(start.getUTCDate() + 7);
            }
            
            // For a range (like Cleaning), consider it valid if today is not past the end date (inclusive)
            return today.getTime() <= endDate.getTime();
        })
        .sort((a, b) => parseDateAsUTC(a.date).getTime() - parseDateAsUTC(b.date).getTime())[0];
};

const findNextUpcoming = <T extends { date: string }>(items: T[]): T | undefined => {
    const today = getBrazilToday();

    return items
        .filter(item => item.date)
        .filter(item => {
            const itemDate = parseDateAsUTC(item.date);
            // Revert to simple "today or future" logic to avoid breaking sections like First Sunday 
            // that don't follow the weekly 13-19/20-26 meeting cycle strictly.
            return itemDate.getTime() >= today.getTime();
        })
        .sort((a, b) => parseDateAsUTC(a.date).getTime() - parseDateAsUTC(b.date).getTime())[0];
};

const findCurrentInWeek = <T extends { date: string }>(items: T[], weekStart: Date, weekEnd: Date): T | undefined => {
    const today = getBrazilToday();
    const inWeek = items
        .filter(item => {
            const d = parseDateAsUTC(item.date);
            return d.getTime() >= weekStart.getTime() && d.getTime() < weekEnd.getTime();
        })
        .sort((a, b) => parseDateAsUTC(a.date).getTime() - parseDateAsUTC(b.date).getTime());
    
    if (inWeek.length === 0) return undefined;

    // 1. If today matches exactly one of the records, prioritize that one!
    const exactMatch = inWeek.find(item => parseDateAsUTC(item.date).getTime() === today.getTime());
    if (exactMatch) return exactMatch;

    // 2. Favor upcoming items within that same week range
    const upcoming = inWeek.filter(item => parseDateAsUTC(item.date).getTime() >= today.getTime());
    if (upcoming.length > 0) return upcoming[0];

    // 3. Fallback to the latest record in the week window
    return inWeek[inWeek.length - 1];
};

const Dashboard: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    const { theme, setTheme } = useTheme();
    const { schedules, isLoading: isLoadingSchedules } = useSchedules();
    const [viewingSchedule, setViewingSchedule] = useState<DashboardSchedule | null>(null);
    const [nextAppointment, setNextAppointment] = useState<UpcomingEvent | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);

    const [nextLifeMinistry, setNextLifeMinistry] = useState<LifeMinistrySchedule | undefined>();
    const [nextMidweekAssignment, setNextMidweekAssignment] = useState<Assignment | undefined>();
    const [nextWeekendAssignment, setNextWeekendAssignment] = useState<Assignment | undefined>();
    const [nextCleaning, setNextCleaning] = useState<CleaningSchedule | undefined>();
    const [nextFieldService, setNextFieldService] = useState<ConductorMeeting | undefined>();
    const [nextPublicTalk, setNextPublicTalk] = useState<PublicTalkSchedule | undefined>();
    const [nextFirstSundayConductor, setNextFirstSundayConductor] = useState<FirstSundayConductor | undefined>();
    const [nextCleaningGroups, setNextCleaningGroups] = useState<CleaningSchedule[]>([]);
    const [nextMeetingSchedule, setNextMeetingSchedule] = useState<MeetingSchedule | null>(null);
    const [activeWeekRange, setActiveWeekRange] = useState<{ start: Date, end: Date } | null>(null);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
    const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UpcomingEvent[]>([]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const normalizedQuery = searchQuery.toLowerCase().trim();
        
        const allPossibleEvents: UpcomingEvent[] = schedules.map(s => {
            const date = parseDateAsUTC(s.date);
            const day = date.getUTCDay();

            if ('week' in s) return { date, type: 'Vida e Ministério' as const, title: s.week, description: `Presidente: ${s.president || 'Não definido'}`, fullData: s };
            
            if (('president' in s || 'reader' in s || 'indicator1' in s || 'audio' in s) && !('week' in s) && !('speakerName' in s) && !('month' in s) && !('group' in s)) {
                const title = (day === 0 || day === 6) ? 'Fim de Semana' : 'Meio de Semana';
                return { date, type: 'Designações' as const, title: `Designações ${title}`, description: `Presidente: ${s.president || 'Não definido'}`, fullData: s };
            }
            
            if ('group' in s && 'endDate' in s) {
                const cleaning = s as CleaningSchedule;
                const responsable = CLEANING_GROUPS[cleaning.group] || 'Equipe';
                return { 
                    date, 
                    type: 'Limpeza' as const, 
                    title: cleaning.group, 
                    description: `Período: ${parseDateAsUTC(cleaning.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} a ${parseDateAsUTC(cleaning.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} • Responsáveis: ${responsable}`, 
                    fullData: cleaning 
                };
            }
            if ('conductorName' in s && !('month' in s)) return { date, type: 'Serviço de Campo' as const, title: 'Saída de campo', description: `Dirigente: ${s.conductorName}`, fullData: s };
            if ('speakerName' in s && 'theme' in s) return { date, type: 'Discurso Público' as const, title: s.theme, description: `Orador: ${s.speakerName}`, fullData: s };
            if ('conductorName' in s && 'month' in s) return { date, type: 'Dirigente 1º Dom' as const, title: 'Dirigente 1º Domingo', description: `Dirigente: ${s.conductorName}`, fullData: s };
            if ('modality' in s && 'locationOrLink' in s) return { date, type: 'Reunião' as const, title: `Reunião ${s.modality}`, description: `Presidente: ${s.president || 'Não definido'}`, fullData: s };
            
            return null;
        }).filter((e): e is UpcomingEvent => e !== null);

        const results = allPossibleEvents.filter(event => {
            const data = event.fullData as any;
            const fieldsToSearch = [
                data.president,
                data.reader,
                data.indicator1,
                data.indicator2,
                data.audio,
                data.video,
                data.mic1,
                data.mic2,
                data.speakerName,
                data.conductorName,
                data.treasuresTheme?.speaker,
                data.spiritualGems?.speaker,
                data.bibleReading?.student,
                ...(data.assignedUids || [])
            ];

            return fieldsToSearch.some(field => 
                typeof field === 'string' && field.toLowerCase().includes(normalizedQuery)
            );
        }).sort((a, b) => b.date.getTime() - a.date.getTime());

        setSearchResults(results);
    }, [searchQuery, schedules]);

    useEffect(() => {
        if (user) {
            const unsubscribe = notificationService.subscribeToNotifications(user.uid, (data) => {
                setNotifications(data);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const unreadCount = notifications.filter(n => !n.isRead).length + unreadAnnouncementsCount;

    useEffect(() => {
        const lastCheckAnn = localStorage.getItem(`lastCheck_announcements_${user?.uid}`) || '0';
        
        const lastCheckAnnDate = new Date(lastCheckAnn);

        const newAnns = announcements.filter(ann => new Date(ann.createdAt).getTime() > lastCheckAnnDate.getTime());

        setUnreadAnnouncementsCount(newAnns.length);
    }, [announcements, schedules, user]);

    const handleOpenNotifications = () => {
        setIsNotificationOpen(!isNotificationOpen);
        if (!isNotificationOpen) {
            // Mark items as "seen" local-only
            const now = new Date().toISOString();
            localStorage.setItem(`lastCheck_announcements_${user?.uid}`, now);
            setUnreadAnnouncementsCount(0);
        }
    };

    const handleNotificationClick = async (notif: AppNotification) => {
        await notificationService.markAsRead(notif.id);
        if (notif.link) {
            // Logic to navigate or scroll to the reference info
        }
        setIsNotificationOpen(false);
    };

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setIsLoadingAnnouncements(true);
            try {
                if (user) {
                    await cleanupExpiredRecords(user.uid);
                }
                const data = await getAnnouncements();
                setAnnouncements(data);
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

        const today = getBrazilToday();
        
        // Calculate the canonical Monday-to-Sunday week window
        // For today Sunday April 19, this will result in:
        // activeWeekStart = Monday April 13
        // activeWeekEnd = Monday April 20
        const dayOfWeek = today.getUTCDay(); // 0 (Sun) to 6 (Sat)
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const activeWeekStart = new Date(today);
        activeWeekStart.setUTCDate(today.getUTCDate() - diffToMonday);
        const activeWeekEnd = new Date(activeWeekStart);
        activeWeekEnd.setUTCDate(activeWeekStart.getUTCDate() + 7);

        setActiveWeekRange({ start: activeWeekStart, end: activeWeekEnd });

        // Filter ONLY active records for all types
        const lifeMinistrySchedules = (schedules.filter(s => s.isActive !== false && 'week' in s) as LifeMinistrySchedule[])
            .sort((a, b) => parseDateAsUTC(a.date).getTime() - parseDateAsUTC(b.date).getTime());
        
        // Assignments are anything that isn't one of the other specialized types but has a date
        const assignmentSchedules = schedules.filter(s => 
            s.isActive !== false &&
            !('week' in s) &&
            !('group' in s) &&
            !('conductorName' in s) &&
            'date' in s
        ) as Assignment[];

        const meetingSchedules = schedules.filter(s => s.isActive !== false && 'modality' in s && 'locationOrLink' in s) as MeetingSchedule[];
        const cleaningSchedules = schedules.filter(s => s.isActive !== false && 'group' in s && 'endDate' in s) as CleaningSchedule[];
        const fieldServiceSchedules = schedules.filter(s => s.isActive !== false && 'conductorName' in s && !('month' in s)) as ConductorMeeting[];
        const publicTalkSchedules = schedules.filter(s => s.isActive !== false && 'speakerName' in s && 'theme' in s) as PublicTalkSchedule[];
        const firstSundaySchedules = schedules.filter(s => s.isActive !== false && 'conductorName' in s && 'month' in s) as FirstSundayConductor[];

        // Helper to merge records for the same date
        const mergeRecordsByDate = <T extends { date: string }>(items: T[]) => {
            const merged: Record<string, T> = {};
            items.forEach(item => {
                const dateKey = parseDateAsUTC(item.date).toISOString();
                if (!merged[dateKey]) {
                    merged[dateKey] = { ...item };
                } else {
                    Object.keys(item).forEach(key => {
                        const val = (item as any)[key];
                        if (val && !(merged[dateKey] as any)[key]) {
                            (merged[dateKey] as any)[key] = val;
                        }
                    });
                }
            });
            return Object.values(merged);
        };

        const mergedAssignments = mergeRecordsByDate(assignmentSchedules);
        const mergedPublicTalks = mergeRecordsByDate(publicTalkSchedules);

        // 1. Find the current week's "Life & Ministry" record based on the canonical window (Monday to Sunday)
        const mergedLifeMinistry = mergeRecordsByDate(lifeMinistrySchedules);
        
        let currentLifeMinistry = mergedLifeMinistry.find(item => {
            const itemDate = parseDateAsUTC(item.date);
            return itemDate.getTime() >= activeWeekStart.getTime() && itemDate.getTime() < activeWeekEnd.getTime();
        });

        // ONLY if there is no record for the current week, try to find the next available future record
        if (!currentLifeMinistry) {
            currentLifeMinistry = mergedLifeMinistry
                .filter(item => parseDateAsUTC(item.date).getTime() >= activeWeekEnd.getTime())
                .sort((a, b) => parseDateAsUTC(a.date).getTime() - parseDateAsUTC(b.date).getTime())[0];
        }

        // Fallback to the most recent past record if still null (to ensure something is always shown)
        if (!currentLifeMinistry) {
            currentLifeMinistry = mergedLifeMinistry
                .filter(item => today.getTime() >= parseDateAsUTC(item.date).getTime())
                .sort((a, b) => parseDateAsUTC(b.date).getTime() - parseDateAsUTC(a.date).getTime())[0];
        }

        setNextLifeMinistry(currentLifeMinistry || null);

        // Update the active range based on the record found
        let weekStart = activeWeekStart;
        let weekEnd = activeWeekEnd;

        if (currentLifeMinistry) {
            const recordDate = parseDateAsUTC(currentLifeMinistry.date);
            const rDayOfWeek = recordDate.getUTCDay();
            const rDiffToMonday = rDayOfWeek === 0 ? 6 : rDayOfWeek - 1;
            weekStart = new Date(recordDate);
            weekStart.setUTCDate(recordDate.getUTCDate() - rDiffToMonday);
            weekEnd = new Date(weekStart);
            weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
            
            // Sync the active range with the record found
            setActiveWeekRange({ start: weekStart, end: weekEnd });
        }

        let finalMidweek: Assignment | null = null;
        let finalWeekend: Assignment | null = null;

        // Use the displayed week window for all filtered sections
        // This ensures all cards match the week range shown at the top

        // 1. Strict Weekly Interval Sections (Meeting info, Cleaning, Public Talk)
        // They stay on current week's data until Monday arrive.
        const midweekMeetingRecords = mergedAssignments.filter(a => {
            const d = parseDateAsUTC(a.date);
            const day = d.getUTCDay();
            return d.getTime() >= weekStart.getTime() && d.getTime() < weekEnd.getTime() && day >= 1 && day <= 5;
        }).sort((a, b) => parseDateAsUTC(a.date).getTime() - parseDateAsUTC(b.date).getTime());

        const weekendMeetingRecords = mergedAssignments.filter(a => {
            const d = parseDateAsUTC(a.date);
            const day = d.getUTCDay();
            return d.getTime() >= weekStart.getTime() && d.getTime() < weekEnd.getTime() && (day === 0 || day === 6);
        }).sort((a, b) => {
            // Prioritize today for the weekend summary
            const da = parseDateAsUTC(a.date);
            const db = parseDateAsUTC(b.date);
            if (da.getTime() === today.getTime()) return -1;
            if (db.getTime() === today.getTime()) return 1;
            return da.getTime() - db.getTime();
        });

        // Merge helper for the summary cards
        const mergeAllInWindow = (records: Assignment[]) => {
            if (records.length === 0) return null;
            return records.reduce((acc, curr) => {
                Object.keys(curr).forEach(key => {
                    const val = (curr as any)[key];
                    // Only overwrite if the accumulator doesn't have a value yet (favor non-empty strings)
                    if (val && (typeof val !== 'string' || val.trim() !== '') && !(acc as any)[key]) {
                        (acc as any)[key] = val;
                    }
                });
                return acc;
            }, {} as Assignment);
        };

        const finalMidweekRaw = mergeAllInWindow(midweekMeetingRecords);
        const finalWeekendRaw = mergeAllInWindow(weekendMeetingRecords);
        
        // Find general meeting schedule for more fallback data
        const currentMeeting = meetingSchedules.find(m => {
            const d = parseDateAsUTC(m.date);
            return d.getTime() >= weekStart.getTime() && d.getTime() < weekEnd.getTime();
        });

        // Consolidate Midweek Info
        let midRecord: any = finalMidweekRaw ? { ...finalMidweekRaw } : null;
        if (currentMeeting) {
            const mDay = parseDateAsUTC(currentMeeting.date).getUTCDay();
            if (mDay >= 1 && mDay <= 5) {
                if (!midRecord) midRecord = { ...currentMeeting };
                else {
                    // Update only missing fields
                    Object.keys(currentMeeting).forEach(key => {
                        const val = (currentMeeting as any)[key];
                        if (val && !midRecord[key]) midRecord[key] = val;
                    });
                }
            }
        }
        if (currentLifeMinistry) {
            const lDate = parseDateAsUTC(currentLifeMinistry.date);
            const lDay = lDate.getUTCDay();
            if (lDay >= 1 && lDay <= 5) {
                if (!midRecord) midRecord = { ...currentLifeMinistry };
                else if (!midRecord.president && currentLifeMinistry.president) midRecord.president = currentLifeMinistry.president;
            }
        }

        // Consolidate Weekend Info
        let weekRecord: any = finalWeekendRaw ? { ...finalWeekendRaw } : null;
        if (currentMeeting) {
            const mDay = parseDateAsUTC(currentMeeting.date).getUTCDay();
            if (mDay === 0 || mDay === 6) {
                if (!weekRecord) weekRecord = { ...currentMeeting };
                else {
                    Object.keys(currentMeeting).forEach(key => {
                        const val = (currentMeeting as any)[key];
                        if (val && !weekRecord[key]) weekRecord[key] = val;
                    });
                }
            }
        }

        const nextCl = findNextUpcomingRange(cleaningSchedules) || null;
        setNextCleaning(nextCl);
        
        // Find next 3 cleaning cycles for the "Próximos Grupos" section
        // Skip the first one if it's already shown in the main cleaning card
        const sortedCleaning = cleaningSchedules
            .filter(item => {
                const endDate = parseDateAsUTC(item.endDate);
                endDate.setUTCHours(23, 59, 59, 999);
                return today.getTime() <= endDate.getTime(); // Use inclusive check consistently
            })
            .sort((a, b) => parseDateAsUTC(a.date).getTime() - parseDateAsUTC(b.date).getTime());
            
        const nextGroups = (nextCl && sortedCleaning.length > 0 && nextCl.id === sortedCleaning[0].id)
            ? sortedCleaning.slice(1, 4)
            : sortedCleaning.slice(0, 3);
            
        setNextCleaningGroups(nextGroups);
        
        // Only show local talks for the dashboard card this week
        const weekPublicTalks = mergedPublicTalks.filter(t => {
            const d = parseDateAsUTC(t.date);
            return d.getTime() >= weekStart.getTime() && d.getTime() < weekEnd.getTime() && t.type === 'local';
        }).sort((a, b) => parseDateAsUTC(a.date).getTime() - parseDateAsUTC(b.date).getTime());
        
        setNextPublicTalk(findCurrentInWeek(weekPublicTalks, weekStart, weekEnd) || null);

        // 2. Date-Specific Sections (Conducting duties)
        // They update to the next available one immediately after their specific date passes.
        setNextFieldService(findNextUpcoming(fieldServiceSchedules) || null);
        setNextFirstSundayConductor(findNextUpcoming(firstSundaySchedules) || null);
        setNextMeetingSchedule(currentMeeting || null);

        setNextMidweekAssignment(midRecord || null);
        setNextWeekendAssignment(weekRecord || null);

        // 3. Set up the dashboard events list (STRICTLY limited to canonical active week 13-19)
        const allEvents: UpcomingEvent[] = schedules.map(s => {
            const date = parseDateAsUTC(s.date);
            const day = date.getUTCDay();

            if ('week' in s) return { date, type: 'Vida e Ministério', title: s.week, description: `Presidente: ${s.president || 'Não definido'}`, fullData: s };
            
            // Refined Assignment title
            if (('president' in s || 'reader' in s || 'indicator1' in s || 'audio' in s) && !('week' in s) && !('month' in s) && !('group' in s)) {
                const title = (day === 0 || day === 6) ? 'Fim de Semana' : 'Meio de Semana';
                return { date, type: 'Designações', title: `Designações ${title}`, description: `Presidente: ${s.president || 'Não definido'}`, fullData: s };
            }
            
            if ('group' in s && 'endDate' in s) {
                const cleaning = s as CleaningSchedule;
                return { date, type: 'Limpeza', title: cleaning.group, description: `Responsáveis: ${cleaning.assignedUids?.join(', ') || 'Grupo'}`, fullData: cleaning };
            }
            if ('conductorName' in s && !('month' in s)) return { date, type: 'Serviço de Campo', title: 'Saída de campo', description: `Dirigente: ${s.conductorName}`, fullData: s };
            if ('speakerName' in s && 'theme' in s) return { date, type: 'Discurso Público', title: s.theme, description: `Orador: ${s.speakerName}`, fullData: s };
            if ('conductorName' in s && 'month' in s) return { date, type: 'Dirigente 1º Dom', title: 'Dirigente 1º Domingo', description: `Dirigente: ${s.conductorName}`, fullData: s };
            if ('modality' in s && 'locationOrLink' in s) return { date, type: 'Reunião', title: `Reunião ${s.modality}`, description: `Presidente: ${s.president || 'Não definido'}`, fullData: s };
            
            return null;
        }).filter((e): e is UpcomingEvent => {
            if (!e) return false;
            // Only show events within the currently active week window
            return e.date.getTime() >= activeWeekStart.getTime() && e.date.getTime() < activeWeekEnd.getTime();
        }).sort((a, b) => a.date.getTime() - b.date.getTime());

        // Update list of user-relevant assignments
        const userAssignments = allEvents.filter(event => 
            (event.fullData as any).assignedUids?.includes(user?.uid) || 
            (event.fullData as any).userId === user?.uid ||
            (event.fullData as any).createdBy === user?.uid
        );
        
        // Next personal appointment (upcoming or today, but within this week)
        const upcomingUserAssignments = userAssignments.filter(e => e.date.getTime() >= today.getTime());
        setNextAppointment(upcomingUserAssignments.length > 0 ? upcomingUserAssignments[0] : null);

        // Check for reminders
        if (userAssignments.length > 0) {
            assignmentNotificationService.checkUpcomingReminders(user.uid, userAssignments.map(e => ({ ...e.fullData, id: e.fullData.id })));
        }

    }, [user, schedules, isLoadingSchedules]);
    
    const handleViewDetails = (event: ScheduleItem, type: UpcomingEvent['type'], displayMode: DashboardSchedule['displayMode'] = 'full') => {
        let title = 'details';
        if ('week' in event) title = event.week;
        if ('president' in event && !('week' in event)) title = 'Reunião de Fim de Semana';
        if (displayMode === 'midweek_part') title = 'Designação';
        if (displayMode === 'weekend_talk') title = 'Discurso Público';

        setViewingSchedule({
            id: event.id,
            type: type,
            title: title,
            date: event.date,
            details: '',
            fullData: event as any,
            displayMode: displayMode
        });
    };

    const handlePartClick = (partName: string, speaker: string, date: string) => {
        setViewingSchedule({
            id: `part-${partName}`,
            type: 'Vida e Ministério',
            title: partName,
            date: date,
            details: speaker,
            fullData: { speaker, partName },
            displayMode: 'midweek_part'
        });
    };

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const weekRangeStr = activeWeekRange ? 
        `${activeWeekRange.start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} a ${new Date(activeWeekRange.end.getTime() - 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}` 
        : '';

    return (
        <div className="min-h-screen bg-white dark:bg-[#07060b] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden transition-colors duration-300 pb-40">
            {/* New Header */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between fixed top-0 left-0 right-0 bg-white/80 dark:bg-[#07060b]/80 backdrop-blur-2xl z-50 transition-all border-b-2 border-slate-900 dark:border-white/20">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-indigo-600 dark:text-white uppercase transition-opacity">APP</span>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleTheme} 
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
                        title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    >
                        {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                    </button>
                    <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
                    >
                        <Search className="h-6 w-6" />
                    </button>
                    {/* Notifications Button */}
                    <button 
                        onClick={handleOpenNotifications}
                        className={`p-2 relative transition-all duration-300 ${unreadCount > 0 ? 'text-amber-500 dark:text-amber-400 scale-110' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white'}`}
                    >
                        <Bell className={`h-6 w-6 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 h-5 w-5 bg-amber-500 text-white text-[10px] font-black rounded-full border-2 border-slate-50 dark:border-[#070b14] flex items-center justify-center shadow-lg">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={logout} 
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-1"
                        title="Sair"
                    >
                        <LogOut className="h-6 w-6" />
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-12 pt-36">
                {/* Hero / Greeting */}
                <section className="space-y-2">
                    <h2 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">Olá, <span className="text-indigo-600 dark:text-indigo-400">{user?.displayName?.split(' ')[0] || 'Irmão'}</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-snug max-w-sm">
                        Sua programação semanal e designações em um só lugar.
                    </p>
                </section>

                {/* Date Splitter */}
                <section className="py-10 border-b-2 border-slate-900 dark:border-white/20">
                    <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-4">
                        ESTA SEMANA
                    </h3>
                    <div className="flex items-end gap-3 translate-x-[-2px]">
                        <h3 className="text-5xl font-bold text-slate-900 dark:text-white tracking-tighter">
                            {activeWeekRange ? (
                                `${activeWeekRange.start.getUTCDate()}–${new Date(activeWeekRange.end.getTime() - 86400000).getUTCDate()}`
                            ) : (
                                '--'
                            )}
                        </h3>
                        <span className="text-2xl font-bold text-slate-400 dark:text-slate-600 pb-[6px]">
                            {activeWeekRange?.end.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' })}
                        </span>
                    </div>
                </section>

                {/* Midweek Meeting Section */}
                <section className="space-y-8 py-10 transition-all duration-300 border-b-2 border-slate-900 dark:border-white/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Meio de Semana</h4>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {/* Integrated Block */}
                        <div className="py-6 border-b border-slate-900 dark:border-white/10 flex items-center justify-between group cursor-pointer active:opacity-70 transition-opacity">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">PRESIDENTE</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{nextMidweekAssignment?.president || nextLifeMinistry?.president || 'Não definido'}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-700" />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            <PartListItem icon={<LayoutGrid className="h-5 w-5" />} label="Tesouro da Palavra" value={nextLifeMinistry?.treasuresTheme?.speaker || 'Não definido'} />
                            <PartListItem icon={<Gem className="h-5 w-5" />} label="Joias Espirituais" value={nextLifeMinistry?.spiritualGems?.speaker || 'Não definido'} />
                            <PartListItem icon={<Book className="h-5 w-5" />} label="Leitura da Bíblia" value={nextLifeMinistry?.bibleReading?.student || 'Não definido'} />
                        </div>

                        {/* Assignments Integrated */}
                        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 grid grid-cols-1 gap-6">
                            <AssignmentBullet label="INDICADORES" value={nextMidweekAssignment ? `${nextMidweekAssignment.indicator1 || 'N/A'}${nextMidweekAssignment.indicator2 ? ` / ${nextMidweekAssignment.indicator2}` : ''}` : 'N/A'} color="bg-purple-500" />
                            <AssignmentBullet label="ÁUDIO E VÍDEO" value={nextMidweekAssignment ? `${nextMidweekAssignment.audio || 'N/A'}${nextMidweekAssignment.video ? ` / ${nextMidweekAssignment.video}` : ''}` : 'N/A'} color="bg-cyan-500" />
                            <AssignmentBullet label="MICROFONE" value={nextMidweekAssignment ? `${nextMidweekAssignment.mic1 || 'N/A'}${nextMidweekAssignment.mic2 ? ` / ${nextMidweekAssignment.mic2}` : ''}` : 'N/A'} color="bg-orange-500" />
                        </div>
                    </div>
                </section>



                {/* Weekend Meeting Section */}
                <section className="space-y-8 py-10 transition-all duration-300 border-b-2 border-slate-900 dark:border-white/20">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                            <Home className="h-6 w-6" />
                        </div>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Fim de Semana</h4>
                    </div>

                    <div className="space-y-8">
                        <div className="py-6 border-b border-slate-200 dark:border-white/5 group cursor-pointer active:opacity-70 transition-opacity">
                            <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-2">DISCURSO PÚBLICO</p>
                            
                            {(nextPublicTalk?.notes || nextPublicTalk?.song) && (
                                <div className="my-6 space-y-4">
                                    {nextPublicTalk?.song && (
                                        <div className="flex items-start gap-2">
                                            <Mic className="h-3.5 w-3.5 text-indigo-500 mt-0.5" />
                                            <div>
                                                <p className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest leading-none mb-1">Cântico Inicial</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{nextPublicTalk.song}</p>
                                            </div>
                                        </div>
                                    )}
                                    {nextPublicTalk?.notes && (
                                        <div className="flex items-start gap-2">
                                            <Pencil className="h-3.5 w-3.5 text-amber-500 mt-0.5" />
                                            <div>
                                                <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest leading-none mb-1">Observações / Textos</p>
                                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 italic">
                                                    {nextPublicTalk.notes}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <h5 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
                                {nextPublicTalk?.theme || 'Tema não definido'}
                            </h5>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400">
                                    <User className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    {nextPublicTalk?.speakerName || 'N/A'} • <span className="opacity-50 uppercase text-[10px]">{nextPublicTalk?.congregation || 'LOCAL'}</span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PRESIDENTE</p>
                                <p className="text-base font-bold text-slate-900 dark:text-white">{nextWeekendAssignment?.president || 'Não definido'}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LEITOR SENTINELA</p>
                                <p className="text-base font-bold text-slate-900 dark:text-white">{nextWeekendAssignment?.reader || 'Não definido'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <AssignmentBullet label="INDICADORES" value={nextWeekendAssignment ? `${nextWeekendAssignment.indicator1 || 'N/A'}${nextWeekendAssignment.indicator2 ? ` / ${nextWeekendAssignment.indicator2}` : ''}` : 'N/A'} color="bg-cyan-500" />
                            <AssignmentBullet label="ÁUDIO E VÍDEO" value={nextWeekendAssignment ? `${nextWeekendAssignment.audio || 'N/A'}${nextWeekendAssignment.video ? ` / ${nextWeekendAssignment.video}` : ''}` : 'N/A'} color="bg-indigo-500" />
                            <AssignmentBullet label="MICROFONE" value={nextWeekendAssignment ? `${nextWeekendAssignment.mic1 || 'N/A'}${nextWeekendAssignment.mic2 ? ` / ${nextWeekendAssignment.mic2}` : ''}` : 'N/A'} color="bg-blue-500" />
                        </div>
                    </div>
                </section>

                {/* Service Conductors Section */}
                <section className="space-y-8 py-10 border-b-2 border-slate-900 dark:border-white/20">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Users className="h-6 w-6" />
                        </div>
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Saídas de Campo</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-12">
                        {/* Saturday */}
                        <div className="flex items-center justify-between py-2 group cursor-pointer">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">SÁBADO</p>
                                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                    <p className="text-[10px] font-bold text-slate-400">
                                        {nextFieldService?.date ? parseDateAsUTC(nextFieldService.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : '--'}
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{nextFieldService?.conductorName || 'Não definido'}</p>
                            </div>
                            <div className="h-10 w-10 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 transition-colors">
                                <ChevronRight className="h-5 w-5" />
                            </div>
                        </div>

                        {/* 1st Sunday */}
                        <div className="flex items-center justify-between py-2 group cursor-pointer border-b border-slate-200 dark:border-white/10">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">1º DOMINGO</p>
                                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                    <p className="text-[10px] font-bold text-slate-400">
                                        {nextFirstSundayConductor?.date ? parseDateAsUTC(nextFirstSundayConductor.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : '--'}
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{nextFirstSundayConductor?.conductorName || 'Não definido'}</p>
                            </div>
                            <div className="h-10 w-10 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 transition-colors">
                                <ChevronRight className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Cleaning Section */}
                <section className="space-y-8 py-10 border-b-2 border-slate-900 dark:border-white/20">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-500">
                            <Droplets className="h-6 w-6" />
                        </div>
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Limpeza</h4>
                    </div>

                    <div className="space-y-8">
                        <div className="py-2 space-y-1">
                            <p className="text-[10px] font-black text-amber-600 opacity-60 uppercase tracking-widest">GRUPO ATUAL</p>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{nextCleaning?.group || 'Grupo não definido'}</h4>
                            <p className="text-sm text-slate-500 font-medium pt-1">
                                {nextCleaning ? `${CLEANING_GROUPS[nextCleaning.group] || 'Responsáveis'} • Período: ${parseDateAsUTC(nextCleaning.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} a ${parseDateAsUTC(nextCleaning.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}` : '--'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 pt-6 border-t border-slate-200 dark:border-white/5">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">PRÓXIMOS GRUPOS</p>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                {nextCleaningGroups.length > 0 ? (
                                    nextCleaningGroups.map((group, idx) => (
                                        <div key={idx} className="flex-shrink-0 w-40 p-5 bg-slate-50 dark:bg-white/[0.03] rounded-2xl space-y-2">
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">{group.group}</p>
                                            <p className="text-xs font-bold text-slate-400 uppercase">{parseDateAsUTC(group.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm italic text-slate-400 dark:text-slate-600">Nenhum grupo futuro</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>



                {/* Announcements Section */}
                <section className="pb-12 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Anúncios</h3>
                        <Link to="/announcements" className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 dark:hover:text-white transition-colors">VER TODOS</Link>
                    </div>
                    <div className="space-y-1">
                        {announcements.slice(0, 3).map((ann) => {
                            const isExpanded = expandedAnnouncement === ann.id;
                            return (
                                <motion.div 
                                    key={ann.id}
                                    layout
                                    className="py-8 border-b-2 border-slate-900 dark:border-white/20 cursor-pointer active:opacity-70 transition-opacity overflow-hidden"
                                    onClick={() => setExpandedAnnouncement(isExpanded ? null : ann.id)}
                                >
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-6 w-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-md flex items-center justify-center text-indigo-500">
                                                    <Megaphone className="h-3 w-3" />
                                                </div>
                                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                                    {parseDateAsUTC(ann.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                </p>
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight uppercase">{ann.title}</h4>
                                            <p className={`text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>{ann.body}</p>
                                            
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        {ann.images && ann.images.length > 0 && (
                                                            <div className="grid grid-cols-1 gap-4 mt-6">
                                                                {ann.images.map((img, i) => (
                                                                    <img key={i} src={img} alt="" className="rounded-[32px] w-full object-cover max-h-[500px]" referrerPolicy="no-referrer" />
                                                                ))}
                                                            </div>
                                                        )}
                                                        <p className="text-[10px] font-black text-slate-400 pt-6 uppercase tracking-[0.2em]">
                                                            Publicado em {parseDateAsUTC(ann.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className={`mt-2 transition-transform duration-500 ${isExpanded ? 'rotate-90 text-indigo-500' : 'text-slate-300 dark:text-slate-800'}`}>
                                            <ChevronRight className="h-6 w-6" />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* Fixed Bottom Tab Bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/70 dark:bg-[#07060b]/80 backdrop-blur-3xl border-t border-slate-100 dark:border-white/5 z-50 px-8 flex items-center justify-between pb-4 transition-colors">
                <BottomNavItem icon={<Home />} label="Início" active theme={theme} />
                <BottomNavItem icon={<Star />} label="Designações" theme={theme} />
                <BottomNavItem icon={<Users />} label="Assistência" theme={theme} />
                <BottomNavItem icon={<LayoutGrid />} label="Menu" theme={theme} />
            </nav>

            {/* Search Overlay */}
            <SearchOverlay 
                isOpen={isSearchOpen}
                onClose={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                }}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                results={searchResults}
            />

            <NotificationOverlay 
                isOpen={isNotificationOpen} 
                onClose={() => setIsNotificationOpen(false)} 
                userUid={user?.uid || ''} 
                notifications={notifications}
            />

            <ScheduleDetailModal
                schedule={viewingSchedule}
                onClose={() => setViewingSchedule(null)}
            />
        </div>
    );
};

const SearchOverlay: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    query: string;
    onQueryChange: (q: string) => void;
    results: UpcomingEvent[];
}> = ({ isOpen, onClose, query, onQueryChange, results }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-slate-900/40 dark:bg-black/80 backdrop-blur-md flex flex-col p-6 overflow-y-auto"
                >
                    <div className="w-full max-w-2xl mx-auto space-y-6 pt-12 pb-32">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-bold text-white">Buscar Designação</h2>
                            <button 
                                onClick={onClose}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                            >
                                <LogOut className="h-6 w-6 rotate-180" />
                            </button>
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                            <input 
                                autoFocus
                                type="text"
                                value={query}
                                onChange={(e) => onQueryChange(e.target.value)}
                                placeholder="Digite seu nome..."
                                className="w-full h-16 pl-14 pr-6 bg-white dark:bg-slate-800 rounded-3xl text-slate-900 dark:text-white font-bold text-lg border-none focus:ring-4 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="space-y-4">
                            {query.trim() === '' ? (
                                <div className="text-center py-20">
                                    <div className="inline-flex h-20 w-20 bg-white/5 rounded-[32px] items-center justify-center text-slate-400 mb-6">
                                        <Search className="h-10 w-10" />
                                    </div>
                                    <p className="text-slate-400 font-medium">Digite seu nome para encontrar suas próximas designações</p>
                                </div>
                            ) : results.length > 0 ? (
                                results.map((res, i) => (
                                    <motion.div 
                                        key={`${res.type}-${i}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="py-8 border-b border-white/5 active:opacity-70 transition-opacity"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                                                    {res.type === 'Vida e Ministério' ? <BookOpen className="h-5 w-5" /> : 
                                                     res.type === 'Designações' ? <Users className="h-5 w-5" /> :
                                                      res.type === 'Limpeza' ? <Droplets className="h-5 w-5" /> :
                                                      <Calendar className="h-5 w-5" />}
                                                </div>
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{res.type}</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500">
                                                {res.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' })}
                                            </span>
                                        </div>
                                        <h4 className="text-2xl font-bold text-white mb-2">{res.title}</h4>
                                        <p className="text-base text-slate-400 font-medium">{res.description}</p>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <div className="inline-flex h-20 w-20 bg-rose-500/10 rounded-[32px] items-center justify-center text-rose-400 mb-6 font-bold text-3xl">!</div>
                                    <p className="text-slate-400 font-medium">Nenhuma designação encontrada para "{query}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const MiniAssignmentItem: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-600 transition-colors">
            {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
        </div>
        <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 transition-colors">{label}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate transition-colors">{value}</p>
        </div>
    </div>
);

const PartListItem: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="flex items-center justify-between group cursor-pointer active:opacity-70 py-4 border-b border-slate-50 dark:border-white/[0.02] last:border-0 transition-all">
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 transition-all">
                {icon}
            </div>
            <p className="text-base font-bold text-slate-600 dark:text-slate-400 transition-colors">{label}</p>
        </div>
        <p className="text-base font-bold text-slate-900 dark:text-white transition-colors">{value}</p>
    </div>
);

const AssignmentBullet: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className={`h-1.5 w-1.5 rounded-full ${color}`}></div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
        </div>
        <p className="text-base font-bold text-slate-900 dark:text-white text-right leading-tight">{value}</p>
    </div>
);

const PartIcon: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`p-3 rounded-2xl flex flex-col items-center gap-2 transition-all ${active ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-slate-100 dark:hover:bg-white/5'} cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500/50`}
    >
        <div className={`transition-all ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
            {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
        </div>
        <span className={`text-[8px] font-bold uppercase tracking-widest ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>{label}</span>
    </button>
);

const BottomNavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; theme?: string }> = ({ icon, label, active, theme }) => (
  <button className={`flex flex-col items-center gap-1.5 transition-all outline-none ${active ? (theme === 'dark' ? 'text-white' : 'text-indigo-600') : 'text-slate-400 dark:text-slate-500'}`}>
    <div className={`transition-all ${active ? 'scale-110' : ''}`}>
      {React.cloneElement(icon as React.ReactElement, { className: "h-7 w-7" })}
    </div>
    <span className="text-[10px] font-bold tracking-wider">{label}</span>
  </button>
);

export default Dashboard;
