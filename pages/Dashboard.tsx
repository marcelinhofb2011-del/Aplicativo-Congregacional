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
    Tv
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
    const [unreadSchedulesCount, setUnreadSchedulesCount] = useState(0);
    const notificationRef = useRef<HTMLDivElement>(null);
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

    const unreadCount = notifications.filter(n => !n.isRead).length + unreadAnnouncementsCount + unreadSchedulesCount;

    useEffect(() => {
        const lastCheckAnn = localStorage.getItem(`lastCheck_announcements_${user?.uid}`) || '0';
        const lastCheckSched = localStorage.getItem(`lastCheck_schedules_${user?.uid}`) || '0';
        
        const lastCheckAnnDate = new Date(lastCheckAnn);
        const lastCheckSchedDate = new Date(lastCheckSched);

        const newAnns = announcements.filter(ann => new Date(ann.createdAt).getTime() > lastCheckAnnDate.getTime());
        const newScheds = schedules.filter(s => new Date(s.createdAt).getTime() > lastCheckSchedDate.getTime());

        setUnreadAnnouncementsCount(newAnns.length);
        setUnreadSchedulesCount(newScheds.length);
    }, [announcements, schedules, user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };

        if (isNotificationOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotificationOpen]);

    const handleOpenNotifications = () => {
        setIsNotificationOpen(!isNotificationOpen);
        if (!isNotificationOpen) {
            // Mark items as "seen" local-only
            const now = new Date().toISOString();
            localStorage.setItem(`lastCheck_announcements_${user?.uid}`, now);
            localStorage.setItem(`lastCheck_schedules_${user?.uid}`, now);
            setUnreadAnnouncementsCount(0);
            setUnreadSchedulesCount(0);
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
            !('theme' in s) &&
            !('speakerName' in s) &&
            !('modality' in s) &&
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
            if (('president' in s || 'reader' in s || 'indicator1' in s || 'audio' in s) && !('week' in s) && !('speakerName' in s) && !('month' in s) && !('group' in s)) {
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
        <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden transition-colors duration-300 pb-32">
            {/* New Header */}
            <header className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-slate-50/80 dark:bg-[#070b14]/80 backdrop-blur-lg z-40">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-indigo-600 dark:text-white uppercase">CONGREGAÇÃO</span>
                </div>
                <div className="flex items-center gap-4">
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

                    {/* Notifications Popover */}
                    <AnimatePresence>
                        {isNotificationOpen && (
                            <div 
                                ref={notificationRef}
                                className="absolute right-6 top-24 z-50"
                            >
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="w-80 max-h-[80vh] bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                                >
                                    <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Notificações</h3>
                                        {notifications.some(n => !n.isRead) && (
                                            <button 
                                                onClick={() => user && notificationService.markAllAsRead(user.uid)}
                                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 uppercase"
                                            >
                                                Ler tudo
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="overflow-y-auto custom-scrollbar">
                                        {(notifications.length === 0 && announcements.length === 0 && schedules.length === 0) ? (
                                            <div className="p-10 text-center space-y-3">
                                                <Bell className="h-10 w-10 text-slate-300 mx-auto opacity-20" />
                                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Tudo limpo por aqui</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-50 dark:divide-white/5">
                                                {/* Announcements in Notifications */}
                                                {announcements.slice(0, 3).map(ann => (
                                                    <div key={`ann-${ann.id}`} className="p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors relative group">
                                                        <div className="flex gap-4">
                                                            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                                                <Megaphone className="h-5 w-5" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase line-clamp-1">{ann.title}</p>
                                                                <p className="text-[11px] text-slate-500 line-clamp-2">{ann.body}</p>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase pt-1">Novo Anúncio</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Schedule Updates (General) */}
                                                {schedules.filter(s => {
                                                    const lastCheck = localStorage.getItem(`lastCheck_schedules_${user?.uid}`) || '0';
                                                    return new Date(s.createdAt).getTime() > new Date(lastCheck).getTime();
                                                }).slice(0, 3).map(s => (
                                                    <div key={`sched-${s.id}`} className="p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors relative group">
                                                        <div className="flex gap-4">
                                                            <div className="h-10 w-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-500 flex-shrink-0">
                                                                <Layout className="h-5 w-5" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase line-clamp-1">Programação Atualizada</p>
                                                                <p className="text-[11px] text-slate-500 line-clamp-2">Novas designações foram lançadas para {parseDateAsUTC(s.date).toLocaleDateString('pt-BR')}.</p>
                                                                <p className="text-[9px] font-bold text-amber-500 uppercase pt-1">Atualização</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* User Notifications */}
                                                {notifications.map(notif => (
                                                    <div 
                                                        key={notif.id} 
                                                        onClick={() => handleNotificationClick(notif)}
                                                        className={`p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer relative group ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
                                                    >
                                                        {!notif.isRead && (
                                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 bg-indigo-500 rounded-full"></div>
                                                        )}
                                                        <div className="flex gap-4">
                                                            <div className="h-10 w-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                                <Calendar className="h-5 w-5" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase line-clamp-1">{notif.title}</p>
                                                                <p className="text-[11px] text-slate-500 line-clamp-2">{notif.description}</p>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase pt-1">
                                                                    {new Date(notif.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                                        <Link 
                                            to="/announcements" 
                                            onClick={() => setIsNotificationOpen(false)}
                                            className="block text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors"
                                        >
                                            Ver todos os anúncios
                                        </Link>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            <main className="px-6 space-y-10">
                {/* Hero / Greeting */}
                <section className="pt-4 space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.25em]">ESTA SEMANA</p>
                        <h2 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">Olá, {user?.displayName?.split(' ')[0] || 'Irmão'}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-tight max-w-[300px]">
                            Veja sua programação para os próximos dias de adoração e serviço.
                        </p>
                    </div>

                    <button className="w-full h-14 bg-indigo-500 dark:bg-[#d8b4fe] hover:bg-indigo-600 dark:hover:bg-[#c084fc] text-white dark:text-[#4c1d95] rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20 group">
                        <Calendar className="h-6 w-6 group-hover:scale-110 transition-transform" />
                        AGENDA
                    </button>
                </section>

                {/* Date Splitter */}
                <section className="flex items-center gap-6">
                    <h3 className="text-4xl font-bold text-slate-900 dark:text-white whitespace-nowrap tracking-tight">
                        {activeWeekRange ? (
                            `${activeWeekRange.start.getUTCDate()}–${new Date(activeWeekRange.end.getTime() - 86400000).getUTCDate()} de ${activeWeekRange.end.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' })}`
                        ) : (
                            'Carregando...'
                        )}
                    </h3>
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent"></div>
                </section>

                {/* Midweek Meeting Card */}
                <section>
                    <div className="bg-white dark:bg-[#0f141f] border border-slate-200 dark:border-white/[0.03] rounded-3xl p-8 space-y-8 relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-all hover:bg-slate-50 dark:hover:bg-[#131a29]">
                        {/* Decorative background icon */}
                        <Library className="absolute -right-4 -top-4 h-32 w-32 text-slate-200 dark:text-white/[0.02] -rotate-12 pointer-events-none" />
                        
                        {/* Title Row */}
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <BookOpen className="h-7 w-7 text-indigo-600 dark:text-white" />
                                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Reunião Meio de Semana</h4>
                            </div>
                        </div>

                        {/* President Block */}
                        <div className="bg-slate-100 dark:bg-[#1f2937]/40 rounded-3xl p-5 flex items-center gap-5 border border-slate-200 dark:border-white/[0.05] relative z-10">
                            <div className="h-14 w-14 bg-white dark:bg-[#2e3744] rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-300 shadow-sm dark:shadow-inner">
                                <User className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none mb-1">PRESIDENTE</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{nextMidweekAssignment?.president || nextLifeMinistry?.president || 'Não definido'}</p>
                            </div>
                        </div>

                        {/* Meeting Parts */}
                        <div className="space-y-6 pt-2 relative z-10">
                            <PartListItem icon={<LayoutGrid className="h-5 w-5" />} label="Tesouro da Palavra" value={nextLifeMinistry?.treasuresTheme?.speaker || 'Não definido'} />
                            <PartListItem icon={<Gem className="h-5 w-5" />} label="Joias Espirituais" value={nextLifeMinistry?.spiritualGems?.speaker || 'Não definido'} />
                            <PartListItem icon={<Book className="h-5 w-5" />} label="Leitura da Bíblia" value={nextLifeMinistry?.bibleReading?.student || 'Não definido'} />
                        </div>

                        {/* Assignments Block */}
                        <div className="bg-slate-50 dark:bg-black/20 rounded-[32px] p-7 space-y-7 relative z-10 border border-slate-100 dark:border-transparent">
                            <h5 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] text-center mb-2">DESIGNAÇÕES</h5>
                            <div className="space-y-6">
                                <AssignmentBullet label="INDICADORES" value={nextMidweekAssignment ? `${nextMidweekAssignment.indicator1 || 'N/A'}${nextMidweekAssignment.indicator2 ? ` / ${nextMidweekAssignment.indicator2}` : ''}` : 'N/A'} color="bg-purple-500" />
                                <AssignmentBullet label="ÁUDIO E VÍDEO" value={nextMidweekAssignment ? `${nextMidweekAssignment.audio || 'N/A'}${nextMidweekAssignment.video ? ` / ${nextMidweekAssignment.video}` : ''}` : 'N/A'} color="bg-cyan-500" />
                                <AssignmentBullet label="MICROFONE" value={nextMidweekAssignment ? `${nextMidweekAssignment.mic1 || 'N/A'}${nextMidweekAssignment.mic2 ? ` / ${nextMidweekAssignment.mic2}` : ''}` : 'N/A'} color="bg-orange-500" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Weekend Meeting Card */}
                <section>
                    <div className="bg-white dark:bg-[#0f172a] border-l-4 border-cyan-500 rounded-3xl p-8 space-y-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl relative overflow-hidden border-y border-r border-slate-100 dark:border-transparent">
                        {/* Title Row */}
                        <div className="flex items-center justify-between">
                            <h4 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">Reunião de Fim de Semana</h4>
                            <Home className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
                        </div>

                        {/* Talk Special Box */}
                        <div className="border border-cyan-200 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/5 rounded-[32px] p-6 space-y-4">
                            <div>
                                <p className="text-[11px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1">DISCURSO PÚBLICO</p>
                                <h5 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {nextPublicTalk?.theme || 'Tema não definido'}
                                </h5>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-cyan-100 dark:bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">{nextPublicTalk?.speakerName || 'N/A'}</p>
                                    <p className="text-[10px] font-bold text-cyan-600/60 dark:text-cyan-400/60 uppercase tracking-wider">{nextPublicTalk?.congregation || 'LOCAL'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Weekend Info */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">PRESIDENTE</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{nextWeekendAssignment?.president || 'Não definido'}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">LEITOR SENTINELA</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{nextWeekendAssignment?.reader || 'Não definido'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Service Card */}
                <section>
                    <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-white/5 rounded-3xl p-7 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-lg shadow-slate-200/30 dark:shadow-none">
                        <div className="flex flex-col gap-2">
                            <h4 className="text-lg font-bold text-slate-700 dark:text-slate-100 flex items-center gap-3 uppercase tracking-wider">
                                DIRIGENTE SÁBADO
                                <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
                            </h4>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{nextFieldService?.conductorName || 'N/A'}</p>
                            <div className="flex items-center gap-2 text-slate-500 mt-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">SÁB., {nextFieldService?.date ? parseDateAsUTC(nextFieldService.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Cleaning Card */}
                <section>
                    <div className="bg-white dark:bg-[#111827] border-l-4 border-amber-500 rounded-3xl p-8 space-y-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl border-y border-r border-slate-100 dark:border-transparent">
                        <div className="flex items-center gap-6">
                            <div className="h-18 w-18 rounded-[28px] bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-500/20">
                                <Droplets className="h-10 w-10" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest leading-none">LIMPEZA DO SALÃO</p>
                                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{nextCleaning?.group || 'Grupo não definido'}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    {nextCleaning ? `${CLEANING_GROUPS[nextCleaning.group] || 'Responsáveis'} • ${parseDateAsUTC(nextCleaning.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} a ${parseDateAsUTC(nextCleaning.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}` : '--'}
                                </p>
                            </div>
                        </div>

                        {/* Future Cleaning Groups */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">PRÓXIMOS GRUPOS</p>
                            {nextCleaningGroups.length > 0 ? (
                                nextCleaningGroups.map((group, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-1">
                                        <p className="text-base font-bold text-slate-700 dark:text-slate-300">{group.group}</p>
                                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{parseDateAsUTC(group.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm italic text-slate-400 dark:text-slate-600">Nenhum grupo futuro</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Announcements Section */}
                <section className="pb-12 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Anúncios</h3>
                        <Link to="/announcements" className="text-sm font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 dark:hover:text-white transition-colors">VER TODAS</Link>
                    </div>
                    <div className="space-y-4">
                        {announcements.slice(0, 3).map((ann) => {
                            const isExpanded = expandedAnnouncement === ann.id;
                            return (
                                <motion.div 
                                    key={ann.id}
                                    layout
                                    className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-white/5 p-6 rounded-3xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-md dark:shadow-none overflow-hidden"
                                    onClick={() => setExpandedAnnouncement(isExpanded ? null : ann.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-6">
                                            <div className="h-16 w-16 bg-slate-50 dark:bg-[#1f2937] rounded-[24px] flex-shrink-0 flex items-center justify-center text-slate-400 dark:text-slate-300">
                                                <Megaphone className="h-7 w-7" />
                                            </div>
                                            <div className="space-y-2 pt-1">
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{ann.title}</h4>
                                                <p className={`text-sm text-slate-500 font-medium ${isExpanded ? '' : 'line-clamp-1'}`}>{ann.body}</p>
                                                {isExpanded && ann.images && ann.images.length > 0 && (
                                                    <div className="grid grid-cols-1 gap-4 mt-4">
                                                        {ann.images.map((img, i) => (
                                                            <img key={i} src={img} alt="" className="rounded-2xl w-full object-cover max-h-60" referrerPolicy="no-referrer" />
                                                        ))}
                                                    </div>
                                                )}
                                                {isExpanded && (
                                                    <p className="text-[10px] font-bold text-slate-400 pt-2 uppercase tracking-widest">
                                                        Publicado em {parseDateAsUTC(ann.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`mt-5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                                            <ChevronRight className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* Fixed Bottom Tab Bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/80 dark:bg-[#070b14]/90 backdrop-blur-2xl border-t border-slate-200 dark:border-white/5 z-50 px-6 flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.5)] transition-colors">
                <BottomNavItem icon={<Home />} label="Início" active theme={theme} />
                <BottomNavItem icon={<Book />} label="Pioneiro" theme={theme} />
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
                                        className="bg-white dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-lg"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                                                    {res.type === 'Vida e Ministério' ? <BookOpen className="h-5 w-5" /> : 
                                                     res.type === 'Designações' ? <Users className="h-5 w-5" /> :
                                                     res.type === 'Limpeza' ? <Droplets className="h-5 w-5" /> :
                                                     <Calendar className="h-5 w-5" />}
                                                </div>
                                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{res.type}</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">
                                                {res.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' })}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{res.title}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{res.description}</p>
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
        <div className="h-10 w-10 bg-slate-100 dark:bg-[#1f2937] border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
            {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
        </div>
        <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1 transition-colors">{label}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate transition-colors">{value}</p>
        </div>
    </div>
);

const PartListItem: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="flex items-center justify-between group cursor-pointer hover:bg-indigo-50 dark:hover:bg-white/[0.03] p-2 -mx-2 rounded-xl transition-all">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-100 dark:bg-slate-800/30 rounded-lg text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all">
                {icon}
            </div>
            <p className="text-base font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{label}</p>
        </div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{value}</p>
    </div>
);

const AssignmentBullet: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
    <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${color}`}></div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-white text-right max-w-[150px] leading-tight">{value}</p>
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
