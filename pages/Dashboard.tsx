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
    AppNotification,
    CalendarNote
} from '../types';
import { getAnnouncements, cleanupExpiredRecords, getCalendarNotes, updateCalendarNote } from '../services/firestoreService';
import { notificationService } from '../services/notificationService';
import { assignmentNotificationService } from '../services/assignmentNotificationService';
import ScheduleDetailModal from '../components/ScheduleDetailModal';
import NotificationOverlay from '../components/NotificationOverlay';
import { Link } from 'react-router-dom';
import { getBrazilToday, parseDateAsUTC } from '../utils/dateUtils';
import { 
    ChevronRight, 
    ChevronLeft,
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
    Pencil,
    CheckCircle2
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
    const [selectedAnnouncementModal, setSelectedAnnouncementModal] = useState<Announcement | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UpcomingEvent[]>([]);
    const [isReportReminderOpen, setIsReportReminderOpen] = useState(false);
    const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

    const handleCompleteNote = async (noteId: string) => {
        if (!user) return;
        try {
            await updateCalendarNote(noteId, { isCompleted: true }, user.uid);
            const notes = await getCalendarNotes(user.uid);
            setCalendarNotes(notes);
        } catch (error) {
            console.error("Error completing note from dashboard:", error);
        }
    };

    const getPreviousMonthName = () => {
        const today = new Date();
        const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const name = prevMonthDate.toLocaleDateString('pt-BR', { month: 'long' });
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const getPreviousMonthYear = () => {
        const today = new Date();
        const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        return prevMonthDate.getFullYear();
    };

    const todayDateObj = new Date();
    const currentDay = todayDateObj.getDate();
    const shouldShowReportAlert = currentDay >= 1 && currentDay <= 12;

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const normalizedQuery = searchQuery.toLowerCase().trim();

        // Helper to get matched roles
        const getMatchedRolesDescription = (s: any, query: string, defaultDesc: string): string => {
            const matched: string[] = [];
            const q = query.toLowerCase();

            const check = (name: string | undefined, role: string) => {
                if (name && name.toLowerCase().includes(q)) {
                    matched.push(`${role}: ${name}`);
                }
            };

            if ('week' in s) {
                check(s.president, 'Presidente');
                check(s.initialPrayer, 'Oração Inicial');
                check(s.treasuresTheme?.speaker, 'Tesouros (Orador)');
                check(s.spiritualGems?.speaker, 'Joias (Orador)');
                check(s.bibleReading?.student, 'Leitura da Bíblia');
                
                if (s.studentParts) {
                    s.studentParts.forEach((part: any, idx: number) => {
                        check(part.student, `Estudante Parte ${idx + 1}`);
                        check(part.helper, `Ajudante Parte ${idx + 1}`);
                    });
                }
                
                if (s.christianLifeParts) {
                    s.christianLifeParts.forEach((part: any, idx: number) => {
                        check(part.speaker, `Vida Cristã Parte ${idx + 1}`);
                    });
                }
                
                if (s.congregationBibleStudy) {
                    check(s.congregationBibleStudy.conductor, 'Estudo Bíblico (Dirigente)');
                    check(s.congregationBibleStudy.reader, 'Estudo Bíblico (Leitor)');
                }
                
                check(s.finalPrayer, 'Oração Final');
            } else if (('president' in s || 'reader' in s || 'indicator1' in s || 'audio' in s) && !('speakerName' in s) && !('month' in s) && !('group' in s)) {
                check(s.president, 'Presidente');
                check(s.reader, 'Leitor');
                check(s.indicator1, 'Indicador 1');
                check(s.indicator2, 'Indicador 2');
                check(s.audio, 'Áudio');
                check(s.video, 'Vídeo');
                check(s.mic1, 'Microfone 1');
                check(s.mic2, 'Microfone 2');
            } else if ('speakerName' in s && 'theme' in s) {
                check(s.speakerName, 'Orador');
            } else if ('conductorName' in s) {
                check(s.conductorName, 'Dirigente');
            } else if ('conductor' in s) {
                check(s.conductor, 'Dirigente');
            }
            
            if ('reader' in s && !('week' in s) && !('president' in s)) {
                check(s.reader, 'Leitor');
            }

            if (matched.length > 0) {
                return matched.join(' • ');
            }

            return defaultDesc;
        };

        const results = schedules.map(s => {
            const date = parseDateAsUTC(s.date);
            const day = date.getUTCDay();

            let type: UpcomingEvent['type'] = 'Designações';
            let title = '';
            let defaultDesc = '';

            if ('week' in s) {
                type = 'Vida e Ministério';
                title = s.week;
                defaultDesc = `Presidente: ${s.president || 'Não definido'}`;
            } else if (('president' in s || 'reader' in s || 'indicator1' in s || 'audio' in s) && !('week' in s) && !('speakerName' in s) && !('month' in s) && !('group' in s)) {
                type = 'Designações';
                const titleSuf = (day === 0 || day === 6) ? 'Fim de Semana' : 'Meio de Semana';
                title = `Designações ${titleSuf}`;
                defaultDesc = `Presidente: ${s.president || 'Não definido'}`;
            } else if ('group' in s && 'endDate' in s) {
                const cleaning = s as CleaningSchedule;
                const responsable = CLEANING_GROUPS[cleaning.group] || 'Equipe';
                type = 'Limpeza';
                title = cleaning.group;
                defaultDesc = `Período: ${parseDateAsUTC(cleaning.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} a ${parseDateAsUTC(cleaning.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} • Responsáveis: ${responsable}`;
            } else if ('conductorName' in s && !('month' in s)) {
                type = 'Serviço de Campo';
                title = 'Saída de campo';
                defaultDesc = `Dirigente: ${s.conductorName}`;
            } else if ('speakerName' in s && 'theme' in s) {
                type = 'Discurso Público';
                title = s.theme;
                defaultDesc = `Orador: ${s.speakerName}`;
            } else if ('conductorName' in s && 'month' in s) {
                type = 'Dirigente 1º Dom';
                title = 'Dirigente 1º Domingo';
                defaultDesc = `Dirigente: ${s.conductorName}`;
            } else if ('modality' in s && 'locationOrLink' in s) {
                type = 'Reunião';
                title = `Reunião ${s.modality}`;
                defaultDesc = `Presidente: ${s.president || 'Não definido'}`;
            } else {
                return null;
            }

            // Check if any of the searchable name fields contain the query
            const data = s as any;
            const fieldsToSearch = [
                data.president,
                data.reader,
                data.conductor,
                data.conductorName,
                data.initialPrayer,
                data.finalPrayer,
                data.indicator1,
                data.indicator2,
                data.audio,
                data.video,
                data.mic1,
                data.mic2,
                data.speakerName,
                data.treasuresTheme?.speaker,
                data.spiritualGems?.speaker,
                data.bibleReading?.student,
                data.congregationBibleStudy?.conductor,
                data.congregationBibleStudy?.reader,
                data.brotherName,
                data.responsibleElder1,
                data.responsibleElder2,
                ...(data.studentParts || []).flatMap((part: any) => [part.student, part.helper]),
                ...(data.christianLifeParts || []).map((part: any) => part.speaker),
                ...(data.assignedUids || [])
            ];

            const matches = fieldsToSearch.some(field => 
                typeof field === 'string' && field.toLowerCase().includes(normalizedQuery)
            );

            if (!matches) return null;

            const description = getMatchedRolesDescription(s, normalizedQuery, defaultDesc);

            return {
                date,
                type,
                title,
                description,
                fullData: s
            };
        }).filter((e): e is UpcomingEvent => e !== null)
          .sort((a, b) => b.date.getTime() - a.date.getTime());

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

    useEffect(() => {
        if (user) {
            const saved = localStorage.getItem(`dismissed_notifications_${user.uid}`);
            setDismissedNotificationIds(saved ? JSON.parse(saved) : []);
        } else {
            setDismissedNotificationIds([]);
        }
    }, [user]);

    const handleDismissNotification = (id: string) => {
        if (!user) return;
        const newDismissed = [...dismissedNotificationIds, id];
        setDismissedNotificationIds(newDismissed);
        localStorage.setItem(`dismissed_notifications_${user.uid}`, JSON.stringify(newDismissed));
    };

    const handleDismissAllNotifications = (ids: string[]) => {
        if (!user) return;
        const newDismissed = Array.from(new Set([...dismissedNotificationIds, ...ids]));
        setDismissedNotificationIds(newDismissed);
        localStorage.setItem(`dismissed_notifications_${user.uid}`, JSON.stringify(newDismissed));
    };

    const handleResultClick = (res: UpcomingEvent) => {
        setIsSearchOpen(false);
        setSearchQuery('');
        setViewingSchedule({
            id: res.fullData.id || '',
            type: res.type,
            title: res.title,
            date: res.date.toISOString(),
            details: res.description,
            fullData: res.fullData
        });
    };

    const unreadCount = notifications.filter(n => !n.isRead).length + unreadAnnouncementsCount;

    const mergedNotifications = React.useMemo(() => {
        const lastCheckAnn = localStorage.getItem(`lastCheck_announcements_${user?.uid}`) || '0';
        const lastCheckAnnTime = new Date(lastCheckAnn).getTime();

        const mappedAnnouncements = announcements.map(ann => ({
            id: ann.id,
            userUid: user?.uid || '',
            title: ann.title,
            description: ann.body,
            type: 'alert' as any,
            createdAt: ann.createdAt,
            date: ann.createdAt,
            isRead: new Date(ann.createdAt).getTime() <= lastCheckAnnTime,
            isPinned: ann.isPinned || false,
            isAnnouncement: true
        }));

        const all = [...notifications, ...mappedAnnouncements];
        
        const activeNotifications = all.filter(n => !dismissedNotificationIds.includes(n.id));
        
        return activeNotifications.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [notifications, announcements, user, isNotificationOpen, dismissedNotificationIds]);

    useEffect(() => {
        const lastCheckAnn = localStorage.getItem(`lastCheck_announcements_${user?.uid}`) || '0';
        
        const lastCheckAnnDate = new Date(lastCheckAnn);

        const newAnns = announcements
            .filter(ann => !dismissedNotificationIds.includes(ann.id))
            .filter(ann => new Date(ann.createdAt).getTime() > lastCheckAnnDate.getTime());

        setUnreadAnnouncementsCount(newAnns.length);
    }, [announcements, schedules, user, dismissedNotificationIds]);

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
        if (user) {
            getCalendarNotes(user.uid)
                .then(notes => setCalendarNotes(notes))
                .catch(err => console.error("Error loading calendar notes for dashboard:", err));
        }
    }, [user]);

    const upcomingNotes = React.useMemo(() => {
        if (!user || calendarNotes.length === 0) return [];
        const today = getBrazilToday();
        today.setUTCHours(0, 0, 0, 0);

        return calendarNotes.filter(note => {
            if (note.isCompleted) return false;
            if (!note.date) return false;

            const noteDateObj = parseDateAsUTC(note.date);
            noteDateObj.setUTCHours(0, 0, 0, 0);

            const diffTime = noteDateObj.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 0 = today, 1 = tomorrow, 2 = day after tomorrow

            return diffDays >= 0 && diffDays <= 2;
        });
    }, [calendarNotes, user]);

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
        <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/30 overflow-x-hidden transition-colors duration-300 pb-24">
            {/* New Header */}
            <header className="px-6 h-16 flex items-center justify-between fixed top-0 left-0 right-0 bg-primary border-b border-primary-dark z-50 transform-gpu transition-all shadow-md">
                <div 
                    className="flex items-center gap-2 cursor-pointer select-none active:opacity-80 transition-opacity"
                    onClick={() => setIsReportReminderOpen(true)}
                    title={shouldShowReportAlert ? "Lembrete: Enviar Relatório de Serviço" : "Vila Cisper"}
                >
                    <span className="text-lg font-extrabold tracking-tight text-white font-outfit uppercase transition-opacity">Vila Cisper</span>
                    {shouldShowReportAlert && (
                        <div className="relative flex h-3.5 w-3.5 items-center justify-center ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleTheme} 
                        className="p-2 text-amber-100 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    >
                        {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                    </button>
                    <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2 text-amber-100 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <Search className="h-6 w-6" />
                    </button>
                    {/* Notifications Button */}
                    <button 
                        onClick={handleOpenNotifications}
                        className={`p-2 relative transition-all duration-300 rounded-full hover:bg-white/10 ${unreadCount > 0 ? 'text-amber-300 scale-110' : 'text-amber-100 hover:text-white'}`}
                    >
                        <Bell className={`h-6 w-6 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 h-5 w-5 bg-amber-500 text-white text-[10px] font-black rounded-full border-2 border-primary flex items-center justify-center shadow-lg">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={logout} 
                        className="p-2 text-amber-100 hover:text-red-300 hover:bg-white/10 rounded-full transition-colors ml-1"
                        title="Sair"
                    >
                        <LogOut className="h-6 w-6" />
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-12 pt-24">
                {/* Hero / Greeting */}
                <section className="space-y-2">
                    <h2 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">Olá, <span className="text-primary dark:text-amber-500">{user?.displayName?.split(' ')[0] || 'Irmão'}</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-snug max-w-sm">
                        Sua programação semanal e designações em um só lugar.
                    </p>
                </section>

                {/* Alertas de Compromisso Próximo (Agenda) */}
                {upcomingNotes.length > 0 && (
                    <motion.section 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-3xl space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white relative shadow-md shadow-amber-500/20">
                                    <span className="absolute inset-0 bg-amber-500 rounded-2xl animate-ping opacity-25"></span>
                                    <Bell className="h-5 w-5 relative" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Compromisso Próximo!</h4>
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold tracking-widest uppercase mt-1">Agenda Pessoal</p>
                                </div>
                            </div>
                            <Link 
                                to="/calendario" 
                                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 hover:underline transition-all"
                            >
                                Ver Agenda <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="space-y-2.5">
                            {upcomingNotes.map((note) => {
                                const today = getBrazilToday();
                                today.setUTCHours(0, 0, 0, 0);
                                const noteDateObj = parseDateAsUTC(note.date);
                                noteDateObj.setUTCHours(0, 0, 0, 0);
                                const diffTime = noteDateObj.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                let relativeDayStr = "";
                                if (diffDays === 0) relativeDayStr = "Hoje";
                                else if (diffDays === 1) relativeDayStr = "Amanhã";
                                else relativeDayStr = `Em 2 dias (${parseDateAsUTC(note.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })})`;

                                return (
                                    <div 
                                        key={note.id} 
                                        className="flex items-start justify-between gap-3 p-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-amber-500/20 transition-all duration-300"
                                    >
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                                                    note.category === 'SAÚDE' ? 'bg-blue-50/80 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30' :
                                                    note.category === 'VIAGEM' ? 'bg-emerald-50/80 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30' :
                                                    note.category === 'LEMBRETE' ? 'bg-amber-50/80 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30' :
                                                    'bg-slate-50/80 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50'
                                                }`}>
                                                    {note.category}
                                                </span>
                                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                                    diffDays === 0 ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                                                    diffDays === 1 ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                                    'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                                }`}>
                                                    {relativeDayStr}
                                                </span>
                                                {note.time && (
                                                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {note.time}
                                                    </span>
                                                )}
                                            </div>
                                            <h5 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight font-sans line-clamp-1">{note.title}</h5>
                                            {note.description && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans leading-snug line-clamp-2">{note.description}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleCompleteNote(note.id)}
                                            className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5 hover:border-emerald-500/20 transition-all font-bold group"
                                            title="Marcar como concluído"
                                        >
                                            <CheckCircle2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.section>
                )}

                {/* Announcements Section */}
                {announcements.length > 0 && (
                    <section className="py-6 border-b border-slate-200 dark:border-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-sm shadow-primary/5">
                                    <Megaphone className="h-5 w-5" />
                                </div>
                                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Anúncios Importantes</h4>
                            </div>
                            <Link to="/announcements" className="text-xs font-bold text-primary dark:text-amber-500 uppercase tracking-wider hover:underline transition-all">VER TODOS</Link>
                        </div>
                        
                        {/* Carousel with slide indicators / swipe help */}
                        <div className="relative group">
                            {/* Horizontal scroll container */}
                            <div 
                                id="announcements-carousel"
                                className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 no-scrollbar -mx-6 px-6"
                            >
                                {announcements.slice(0, 5).map((ann) => {
                                    const isNew = (Date.now() - new Date(ann.createdAt).getTime()) < 5 * 24 * 60 * 60 * 1000;
                                    return (
                                        <div 
                                            key={ann.id}
                                            className="min-w-[75%] sm:min-w-[280px] md:min-w-[300px] max-w-[320px] snap-start p-4 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl cursor-pointer hover:border-primary/20 dark:hover:border-primary/15 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[142px] transform-gpu"
                                            onClick={() => setSelectedAnnouncementModal(ann)}
                                        >
                                            {/* Accent bar on the left */}
                                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                                            
                                            <div className="space-y-1.5 pl-1.5">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <div className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-amber-400 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                        <Megaphone className="h-2 w-2" />
                                                        <span>Anúncio</span>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                        {parseDateAsUTC(ann.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                    {isNew && (
                                                        <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                                            Novo
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight uppercase line-clamp-1">
                                                    {ann.title}
                                                </h4>
                                                
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                                                    {ann.body}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between text-[9px] font-extrabold text-primary dark:text-amber-500 uppercase tracking-widest pl-1.5 mt-1 hover:underline">
                                                <span>Acessar conteúdo</span>
                                                <ChevronRight className="h-3 w-3" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Left Scroll Button - Desktop only */}
                            <button 
                                onClick={() => {
                                    const carousel = document.getElementById('announcements-carousel');
                                    if (carousel) {
                                        carousel.scrollBy({ left: -260, behavior: 'smooth' });
                                    }
                                }}
                                className="absolute -left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-all opacity-0 group-hover:opacity-100 sm:flex hidden focus:outline-none focus:ring-2 focus:ring-primary/20 z-10"
                                aria-label="Anúncio anterior"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            {/* Right Scroll Button - Desktop only */}
                            <button 
                                onClick={() => {
                                    const carousel = document.getElementById('announcements-carousel');
                                    if (carousel) {
                                        carousel.scrollBy({ left: 260, behavior: 'smooth' });
                                    }
                                }}
                                className="absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-all opacity-0 group-hover:opacity-100 sm:flex hidden focus:outline-none focus:ring-2 focus:ring-primary/20 z-10"
                                aria-label="Próximo anúncio"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </section>
                )}

                {/* Date Splitter */}
                <section className="py-10 border-b-4 border-slate-900 dark:border-white/20">
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
                            {activeWeekRange ? new Date(activeWeekRange.end.getTime() - 86400000).toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' }) : ''}
                        </span>
                    </div>
                </section>

                {/* Midweek Meeting Section */}
                <section className="space-y-8 py-12 border-b-4 border-slate-900 dark:border-white/20 transition-all duration-300">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Meio de Semana</h4>
                        </div>
                        {nextLifeMinistry && (
                            <button 
                                onClick={() => setViewingSchedule({
                                    id: nextLifeMinistry.id,
                                    type: 'Vida e Ministério',
                                    title: nextLifeMinistry.week,
                                    date: nextLifeMinistry.date,
                                    details: '',
                                    fullData: nextLifeMinistry,
                                    displayMode: 'full'
                                })}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-primary dark:text-amber-500 border border-slate-100 dark:border-slate-800 transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
                            >
                                <span>Visualizar Programação</span>
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-1">
                        {/* Integrated Block */}
                        <div 
                            onClick={() => nextLifeMinistry && setViewingSchedule({
                                id: nextLifeMinistry.id,
                                type: 'Vida e Ministério',
                                title: nextLifeMinistry.week,
                                date: nextLifeMinistry.date,
                                details: '',
                                fullData: nextLifeMinistry,
                                displayMode: 'full'
                            })}
                            className="py-6 border-b border-slate-900 dark:border-white/10 flex items-center justify-between group cursor-pointer active:opacity-70 transition-opacity"
                        >
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-primary dark:text-amber-500 uppercase tracking-widest">PRESIDENTE</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{nextMidweekAssignment?.president || nextLifeMinistry?.president || 'Não definido'}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-700" />
                        </div>

                        <div 
                            onClick={() => nextLifeMinistry && setViewingSchedule({
                                id: nextLifeMinistry.id,
                                type: 'Vida e Ministério',
                                title: nextLifeMinistry.week,
                                date: nextLifeMinistry.date,
                                details: '',
                                fullData: nextLifeMinistry,
                                displayMode: 'full'
                            })}
                            className="grid grid-cols-1 gap-1 cursor-pointer"
                        >
                            <PartListItem icon={<LayoutGrid className="h-5 w-5" />} label="Tesouro da Palavra" value={nextLifeMinistry?.treasuresTheme?.speaker || 'Não definido'} />
                            <PartListItem icon={<Gem className="h-5 w-5" />} label="Joias Espirituais" value={nextLifeMinistry?.spiritualGems?.speaker || 'Não definido'} />
                            <PartListItem icon={<Book className="h-5 w-5" />} label="Leitura da Bíblia" value={nextLifeMinistry?.bibleReading?.student || 'Não definido'} />
                        </div>

                        {/* Assignments Integrated */}
                        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 grid grid-cols-1 gap-6">
                            <AssignmentBullet label="INDICADORES" value={nextMidweekAssignment ? `${nextMidweekAssignment.indicator1 || 'N/A'}${nextMidweekAssignment.indicator2 ? ` / ${nextMidweekAssignment.indicator2}` : ''}` : 'N/A'} color="bg-primary" />
                            <AssignmentBullet label="ÁUDIO E VÍDEO" value={nextMidweekAssignment ? `${nextMidweekAssignment.audio || 'N/A'}${nextMidweekAssignment.video ? ` / ${nextMidweekAssignment.video}` : ''}` : 'N/A'} color="bg-amber-800" />
                            <AssignmentBullet label="MICROFONE" value={nextMidweekAssignment ? `${nextMidweekAssignment.mic1 || 'N/A'}${nextMidweekAssignment.mic2 ? ` / ${nextMidweekAssignment.mic2}` : ''}` : 'N/A'} color="bg-amber-600" />
                        </div>
                    </div>
                </section>



                {/* Weekend Meeting Section */}
                <section className="space-y-8 py-12 border-b-4 border-slate-900 dark:border-white/20 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                            <Home className="h-6 w-6" />
                        </div>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Fim de Semana</h4>
                    </div>

                    <div className="space-y-8">
                        <div className="py-6 border-b border-slate-200 dark:border-white/5 group cursor-pointer active:opacity-70 transition-opacity">
                            <p className="text-[10px] font-black text-primary dark:text-amber-500 uppercase tracking-widest mb-2">DISCURSO PÚBLICO</p>
                            
                            {(nextPublicTalk?.notes?.trim() || nextPublicTalk?.song?.trim()) && (
                                <div className="my-6 space-y-4">
                                    {nextPublicTalk?.song?.trim() && (
                                        <div className="flex items-start gap-2">
                                            <Mic className="h-3.5 w-3.5 text-primary mt-0.5" />
                                            <div>
                                                <p className="text-[9px] font-black text-primary/60 dark:text-amber-500/60 uppercase tracking-widest leading-none mb-1">Cântico Inicial</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{nextPublicTalk.song}</p>
                                            </div>
                                        </div>
                                    )}
                                    {nextPublicTalk?.notes?.trim() && (
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
                            <AssignmentBullet label="INDICADORES" value={nextWeekendAssignment ? `${nextWeekendAssignment.indicator1 || 'N/A'}${nextWeekendAssignment.indicator2 ? ` / ${nextWeekendAssignment.indicator2}` : ''}` : 'N/A'} color="bg-primary" />
                            <AssignmentBullet label="ÁUDIO E VÍDEO" value={nextWeekendAssignment ? `${nextWeekendAssignment.audio || 'N/A'}${nextWeekendAssignment.video ? ` / ${nextWeekendAssignment.video}` : ''}` : 'N/A'} color="bg-amber-800" />
                            <AssignmentBullet label="MICROFONE" value={nextWeekendAssignment ? `${nextWeekendAssignment.mic1 || 'N/A'}${nextWeekendAssignment.mic2 ? ` / ${nextWeekendAssignment.mic2}` : ''}` : 'N/A'} color="bg-amber-600" />
                        </div>
                    </div>
                </section>

                {/* Service Conductors Section */}
                <section className="space-y-8 py-12 border-b-4 border-slate-900 dark:border-white/20">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary dark:text-amber-500">
                            <Users className="h-6 w-6" />
                        </div>
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Saídas de Campo</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-12">
                        {/* Saturday */}
                        <div className="flex items-center justify-between py-2 group cursor-pointer">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black text-primary dark:text-amber-500 uppercase tracking-[0.2em]">SÁBADO</p>
                                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                    <p className="text-[10px] font-bold text-slate-400">
                                        {nextFieldService?.date ? parseDateAsUTC(nextFieldService.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : '--'}
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{nextFieldService?.conductorName || 'Não definido'}</p>
                            </div>
                            <div className="h-10 w-10 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-primary transition-colors">
                                <ChevronRight className="h-5 w-5" />
                            </div>
                        </div>

                        {/* 1st Sunday */}
                        <div className="flex items-center justify-between py-2 group cursor-pointer border-b border-slate-200 dark:border-white/10">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em]">1º DOMINGO</p>
                                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                    <p className="text-[10px] font-bold text-slate-400">
                                        {nextFirstSundayConductor?.date ? parseDateAsUTC(nextFirstSundayConductor.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : '--'}
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{nextFirstSundayConductor?.conductorName || 'Não definido'}</p>
                            </div>
                            <div className="h-10 w-10 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-primary transition-colors">
                                <ChevronRight className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Cleaning Section */}
                <section className="space-y-8 py-12 border-b-4 border-slate-900 dark:border-white/20">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary dark:text-amber-500">
                            <Droplets className="h-6 w-6" />
                        </div>
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Limpeza</h4>
                    </div>

                    <div className="space-y-8">
                        <div className="py-2 space-y-1">
                            <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">GRUPO ATUAL</p>
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
            </main>

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
                onResultClick={handleResultClick}
            />

            <NotificationOverlay 
                isOpen={isNotificationOpen} 
                onClose={() => setIsNotificationOpen(false)} 
                userUid={user?.uid || ''} 
                notifications={mergedNotifications}
                onDismiss={handleDismissNotification}
                onDismissAll={handleDismissAllNotifications}
            />

            <ScheduleDetailModal
                schedule={viewingSchedule}
                onClose={() => setViewingSchedule(null)}
            />

            {/* Selected Announcement Modal Overlay */}
            <AnimatePresence>
                {selectedAnnouncementModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedAnnouncementModal(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header image / Banner if available */}
                            {selectedAnnouncementModal.images && selectedAnnouncementModal.images.length > 0 ? (
                                <div className="relative h-48 sm:h-56 overflow-hidden">
                                    <img 
                                        src={selectedAnnouncementModal.images[0]} 
                                        alt="" 
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                                    <button 
                                        onClick={() => setSelectedAnnouncementModal(null)}
                                        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                                    >
                                        ✕
                                    </button>
                                    <div className="absolute bottom-4 left-6 right-6">
                                        <span className="bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            Anúncio
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 pb-2 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
                                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        Anúncio
                                    </span>
                                    <button 
                                        onClick={() => setSelectedAnnouncementModal(null)}
                                        className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:opacity-80 transition-opacity"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Content area */}
                            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 no-scrollbar">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-sans">
                                    Publicado em {parseDateAsUTC(selectedAnnouncementModal.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight font-sans">
                                    {selectedAnnouncementModal.title}
                                </h3>
                                <p className="text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap font-sans">
                                    {selectedAnnouncementModal.body}
                                </p>

                                {/* Inline photos if there are multiple */}
                                {selectedAnnouncementModal.images && selectedAnnouncementModal.images.length > 1 && (
                                    <div className="grid grid-cols-2 gap-2 pt-4">
                                        {selectedAnnouncementModal.images.slice(1).map((img, i) => (
                                            <img 
                                                key={i} 
                                                src={img} 
                                                alt="" 
                                                className="rounded-2xl w-full object-cover h-28 border border-slate-100 dark:border-slate-800/50" 
                                                referrerPolicy="no-referrer" 
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer info */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/40 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] flex justify-between font-sans">
                                <span>Publicador Oficial</span>
                                <span className="text-primary font-sans font-bold">Ativo</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isReportReminderOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-5 animate-in fade-in zoom-in-95 duration-150"
                        >
                            <div className="mx-auto w-16 h-16 rounded-[22px] bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 relative">
                                <span className={`absolute inset-0 bg-amber-500/10 rounded-[22px] ${shouldShowReportAlert ? 'animate-pulse' : ''}`}></span>
                                <Bell className={`w-8 h-8 relative ${shouldShowReportAlert ? 'animate-bounce' : ''}`} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
                                    {shouldShowReportAlert ? `Relatório de ${getPreviousMonthName()}!` : "Enviar Relatório"}
                                </h3>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed space-y-1">
                                    <p>
                                        {shouldShowReportAlert ? (
                                            <span>
                                                Olá, irmão! Estamos no período de coleta do relatório de serviço de campo referente ao mês de <strong className="text-slate-800 dark:text-slate-200 uppercase">{getPreviousMonthName()}/2026</strong>.
                                            </span>
                                        ) : (
                                            <span>
                                                Olá, irmão! Deseja registrar ou enviar sua atividade de serviço de campo?
                                            </span>
                                        )}
                                    </p>
                                    <p>
                                        O envio pontual ajuda o secretário no processamento das informações congregacionais.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 pt-2">
                                <Link 
                                    to="/pioneiro"
                                    onClick={() => setIsReportReminderOpen(false)}
                                    className="w-full py-4 px-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm font-sans flex items-center justify-center gap-2"
                                >
                                    Enviar Relatório Agora
                                </Link>
                                <button 
                                    type="button"
                                    onClick={() => setIsReportReminderOpen(false)}
                                    className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-sans cursor-pointer"
                                >
                                    Fechar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SearchOverlay: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    query: string;
    onQueryChange: (q: string) => void;
    results: UpcomingEvent[];
    onResultClick: (res: UpcomingEvent) => void;
}> = ({ isOpen, onClose, query, onQueryChange, results, onResultClick }) => {
    const today = getBrazilToday();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 flex flex-col p-6 overflow-y-auto"
                >
                    <div className="w-full max-w-2xl mx-auto space-y-6 pt-12 pb-32">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Buscar Designação</h2>
                            <button 
                                onClick={onClose}
                                className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-full text-slate-900 dark:text-white transition-all"
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
                                className="w-full h-16 pl-14 pr-6 bg-slate-100 dark:bg-slate-800 rounded-3xl text-slate-900 dark:text-white font-bold text-lg border-none focus:ring-4 focus:ring-primary/50 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="space-y-4">
                            {query.trim() === '' ? (
                                <div className="text-center py-20">
                                    <div className="inline-flex h-20 w-20 bg-slate-100 dark:bg-white/5 rounded-[32px] items-center justify-center text-slate-400 mb-6">
                                        <Search className="h-10 w-10" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">Digite seu nome para encontrar suas próximas designações</p>
                                </div>
                            ) : results.length > 0 ? (
                                results.map((res, i) => {
                                    const isFutureOrToday = res.date.getTime() >= today.getTime();
                                    return (
                                        <motion.div 
                                            key={`${res.type}-${i}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => onResultClick(res)}
                                            className={`py-6 px-5 border-b border-slate-100 dark:border-white/5 rounded-3xl -mx-5 cursor-pointer active:opacity-70 transition-all ${
                                                isFutureOrToday 
                                                    ? 'bg-emerald-50/50 dark:bg-emerald-500/5 hover:bg-emerald-100/50 dark:hover:bg-emerald-500/10 border-l-4 border-l-emerald-500 dark:border-l-emerald-400 shadow-sm' 
                                                    : 'opacity-60 hover:opacity-90 hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-xl text-primary dark:text-amber-500">
                                                        {res.type === 'Vida e Ministério' ? <BookOpen className="h-5 w-5" /> : 
                                                         res.type === 'Designações' ? <Users className="h-5 w-5" /> :
                                                          res.type === 'Limpeza' ? <Droplets className="h-5 w-5" /> :
                                                          <Calendar className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-primary dark:text-amber-500 uppercase tracking-widest">{res.type}</span>
                                                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md w-fit mt-1 uppercase tracking-wider ${
                                                            isFutureOrToday 
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' 
                                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                            {isFutureOrToday ? 'Próxima' : 'Histórico'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                                    {res.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' })}
                                                </span>
                                            </div>
                                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{res.title}</h4>
                                            <p className="text-base text-slate-600 dark:text-slate-400 font-medium">{res.description}</p>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-20">
                                    <div className="inline-flex h-20 w-20 bg-rose-500/10 rounded-[32px] items-center justify-center text-rose-500 dark:text-rose-400 mb-6 font-bold text-3xl">!</div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhuma designação encontrada para "{query}"</p>
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
            <div className="p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl text-slate-400 dark:text-slate-600 group-hover:text-primary dark:group-hover:text-amber-500 transition-all">
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
        className={`p-3 rounded-2xl flex flex-col items-center gap-2 transition-all ${active ? 'bg-primary/10 border border-primary/20' : 'hover:bg-slate-100 dark:hover:bg-white/5'} cursor-pointer outline-none focus:ring-1 focus:ring-primary/50`}
    >
        <div className={`transition-all ${active ? 'text-primary dark:text-amber-500' : 'text-slate-400 dark:text-slate-600'}`}>
            {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
        </div>
        <span className={`text-[8px] font-bold uppercase tracking-widest ${active ? 'text-primary dark:text-amber-500' : 'text-slate-400 dark:text-slate-600'}`}>{label}</span>
    </button>
);

export default Dashboard;
