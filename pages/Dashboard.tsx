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
    Search
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
            
            // For a range (like Cleaning), consider it valid if today is not past the end date
            return today < endDate;
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
    const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            const unsubscribe = notificationService.subscribeToNotifications(user.uid, (data) => {
                setNotifications(data);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

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

        setNextCleaning(findNextUpcomingRange(cleaningSchedules) || null);
        
        // Find next 3 cleaning cycles for the "Próximos Grupos" section
        // Skip the first one if it's already shown in the main cleaning card
        const sortedCleaning = cleaningSchedules
            .filter(item => {
                const endDate = parseDateAsUTC(item.endDate);
                endDate.setUTCHours(23, 59, 59, 999);
                return today < endDate;
            })
            .sort((a, b) => parseDateAsUTC(a.date).getTime() - parseDateAsUTC(b.date).getTime());
            
        const nextGroups = sortedCleaning.length > 0 && findNextUpcomingRange(cleaningSchedules)?.id === sortedCleaning[0].id
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
    
    const handleViewDetails = (event: ScheduleItem, type: UpcomingEvent['type']) => {
        let title = 'details';
        if ('week' in event) title = event.week;
        if ('president' in event && !('week' in event)) title = 'Reunião de Fim de Semana';

        setViewingSchedule({
            id: event.id,
            type: type,
            title: title,
            date: event.date,
            details: '',
            fullData: event as any,
        });
    };

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const weekRangeStr = activeWeekRange ? 
        `${activeWeekRange.start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${new Date(activeWeekRange.end.getTime() - 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` 
        : '';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden transition-colors duration-300">
            {/* Optimized Background Accents - Subtler for both modes */}
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/[0.05] dark:bg-indigo-600/[0.03] rounded-full pointer-events-none -z-10 blur-[80px]"></div>
            <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/[0.04] dark:bg-emerald-600/[0.02] rounded-full pointer-events-none -z-10 blur-[80px]"></div>

            {/* Custom Header - Fixed top */}
            <header className="fixed top-0 left-0 right-0 z-40 px-6 py-6 flex items-center justify-between bg-white/80 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.05] transition-colors">
                <div className="flex items-center gap-3 max-w-2xl mx-auto w-full flex-row justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 border border-indigo-400/30 shadow-lg shadow-indigo-500/20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center">
                            <Home className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight font-outfit">Aplicativo da</h1>
                            <p className="text-[10px] text-slate-700 dark:text-slate-500 font-bold uppercase tracking-widest font-sans">congregação</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button onClick={toggleTheme} className="p-2.5 text-slate-700 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.1] mx-1"></div>
                        <button 
                            onClick={() => setIsNotificationOpen(true)}
                            className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white relative transition-colors"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 h-4 w-4 bg-rose-500 text-[9px] font-black text-white rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={logout}
                            className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Sair"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Spacer for fixed header */}
            <div className="h-24"></div>

            <main className="px-6 py-8 space-y-12 max-w-2xl mx-auto">
                {/* Greeting & Date Section */}
                <motion.section 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-2"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-outfit">Olá, {user?.displayName?.split(' ')[0] || 'Irmão'}</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-sans font-semibold mt-1">Veja sua programação para os próximos dias.</p>
                        </div>
                        <Link 
                            to="/calendario" 
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-2xl transition-all border border-indigo-500/10 group overflow-hidden relative"
                        >
                            <Calendar className="h-4 w-4 relative z-10" />
                            <span className="text-[10px] font-bold font-sans uppercase tracking-[0.1em] relative z-10">Agenda</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </Link>
                    </div>
                </motion.section>

                {/* Week Heading Section */}
                <motion.section 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <p className="text-[10px] font-bold tracking-[0.3em] text-indigo-500 uppercase mb-4 font-sans drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">ESTA SEMANA</p>
                    
                    <div className="relative group">
                        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight font-outfit leading-tight lowercase first-letter:uppercase transition-all duration-500 group-hover:tracking-normal">
                            {activeWeekRange ? (
                                <>
                                    <span className="text-slate-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">{activeWeekRange.start.getUTCDate()}–{new Date(activeWeekRange.end.getTime() - 86400000).getUTCDate()} de {activeWeekRange.end.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' })}</span>
                                    <br />
                                    <span className="text-slate-900 dark:text-white">programação dessa semana</span>
                                </>
                            ) : (
                                'programação da semana'
                            )}
                        </h2>
                        <div className="h-1.5 w-16 bg-indigo-500 mt-8 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.8)] dark:shadow-[0_0_20px_rgba(99,102,241,0.8)] group-hover:w-24 transition-all duration-500"></div>
                    </div>
                </motion.section>

                {/* Personal Assignment Reminder (Modified to match image style) */}
                <AnimatePresence>
                    {nextAppointment && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white dark:bg-[#0f172a] border border-indigo-100 dark:border-indigo-500/30 rounded-[32px] p-7 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-[#131c33] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_rgba(79,70,229,0.05)] relative overflow-hidden"
                            onClick={() => handleViewDetails(nextAppointment.fullData, nextAppointment.type)}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none"></div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="h-16 w-16 rounded-[24px] bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-[0_10px_25px_rgba(99,102,241,0.4)] border border-indigo-400/30 group-hover:rotate-6 transition-transform">
                                    <BookOpen className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-[0.2em] font-sans">DESIGNADO PARA VOCÊ</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight font-outfit">{nextAppointment.type}</p>
                                    <p className="text-sm text-indigo-700 dark:text-indigo-400/70 font-sans font-bold lowercase first-letter:uppercase">
                                        {new Date(nextAppointment.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' })}
                                    </p>
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-full flex items-center justify-center text-indigo-500 dark:text-indigo-400 group-hover:translate-x-2 transition-transform relative z-10">
                                <ChevronRight className="h-8 w-8" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Midweek Card */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white dark:bg-slate-900/80 rounded-[40px] p-10 border border-slate-200 dark:border-white/[0.05] relative shadow-2xl shadow-indigo-500/5 group hover:border-indigo-500/20 transition-all hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                    <div className="absolute top-8 right-8 h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-10 font-outfit flex items-center gap-4">
                        <span className="h-8 w-1 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)] group-hover:h-10 transition-all duration-500"></span>
                        Reunião Meio de Semana
                    </h3>
                    
                    <div className="space-y-10">
                        {/* President Header */}
                        <div className="flex items-center gap-4 p-4 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05] border border-indigo-500/10 rounded-3xl group-hover:bg-indigo-500/[0.08] transition-colors">
                            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-widest">Presidente da Reunião</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white font-outfit">
                                    {nextMidweekAssignment?.president || nextLifeMinistry?.president || 'Não definido'}
                                </p>
                            </div>
                        </div>

                        {/* Parts with Icons */}
                        <div className="space-y-6">
                            <PremiumPartItem 
                                icon={<Library className="h-5 w-5" />}
                                iconColor="bg-indigo-500/20 text-indigo-400 border-indigo-500/10"
                                label="Tesouro da Palavra de Deus"
                                value={nextLifeMinistry?.treasuresTheme?.speaker || 'Não definido'}
                            />
                            <PremiumPartItem 
                                icon={<Gem className="h-5 w-5" />}
                                iconColor="bg-emerald-500/20 text-emerald-400 border-emerald-500/10"
                                label="Jóias espirituais"
                                value={nextLifeMinistry?.spiritualGems?.speaker || 'Não definido'}
                            />
                            <PremiumPartItem 
                                icon={<Book className="h-5 w-5" />}
                                iconColor="bg-amber-500/20 text-amber-400 border-amber-500/10"
                                label="Leitura da Bíblia"
                                value={nextLifeMinistry?.bibleReading?.student || 'Não definido'}
                            />
                        </div>

                        <div className="relative">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-white/[0.05] to-transparent"></div>
                            <div className="absolute left-1/2 -translate-x-1/2 -top-2 px-4 bg-slate-50 dark:bg-slate-900 backdrop-blur-md rounded-full border border-slate-200 dark:border-white/[0.05] text-[8px] font-bold text-slate-600 dark:text-slate-500 tracking-[0.3em] uppercase">Designações</div>
                        </div>

                        {/* General Assignments with Dots */}
                        <div className="space-y-6">
                            <DutyItem 
                                label="INDICADORES" 
                                value={`${nextMidweekAssignment?.indicator1 || 'Não definido'}${nextMidweekAssignment?.indicator2 ? ` / ${nextMidweekAssignment.indicator2}` : ''}`} 
                                dotColor="bg-indigo-500"
                            />
                            <DutyItem 
                                label="ÁUDIO E VÍDEO" 
                                value={`${nextMidweekAssignment?.audio || 'Não definido'}${nextMidweekAssignment?.video ? ` / ${nextMidweekAssignment.video}` : ''}`} 
                                dotColor="bg-indigo-500"
                            />
                            <DutyItem 
                                label="MICROFONE" 
                                value={`${nextMidweekAssignment?.mic1 || 'Não definido'}${nextMidweekAssignment?.mic2 ? ` / ${nextMidweekAssignment.mic2}` : ''}`} 
                                dotColor="bg-indigo-500"
                            />
                        </div>
                    </div>
                </motion.section>

                {/* Weekend Card */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white dark:bg-slate-900/80 rounded-[40px] p-10 border border-slate-200 dark:border-white/[0.05] relative shadow-2xl shadow-emerald-500/5 group hover:border-emerald-500/20 transition-all hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                    <div className="absolute top-8 right-8 h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                        <Home className="h-6 w-6" />
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-10 font-outfit flex items-center gap-4">
                        <span className="h-8 w-1 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] group-hover:h-10 transition-all duration-500"></span>
                        Reunião de Final de Semana
                    </h3>
                    
                    <div className="bg-emerald-500/[0.04] dark:bg-emerald-500/[0.04] border border-emerald-100 dark:border-emerald-500/20 rounded-[32px] p-8 mb-10 group-hover:bg-emerald-500/10 transition-colors">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-500 uppercase mb-4 font-sans">DISCURSO PÚBLICO</p>
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white leading-snug mb-3 font-outfit">
                            {nextPublicTalk?.theme || 'Tema não definido'}
                        </h4>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <User className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-400 font-sans uppercase tracking-tight">
                                {nextPublicTalk?.speakerName || 'Orador não definido'} 
                                <span className="mx-2 text-slate-300 dark:text-slate-700">•</span> 
                                {nextPublicTalk?.congregation || 'Local'}
                            </p>
                        </div>

                        <div className="h-px w-full bg-emerald-500/10 mb-6"></div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest font-sans">Presidente</p>
                                <p className="text-base font-bold text-slate-900 dark:text-white font-outfit">
                                    {nextWeekendAssignment?.president || 'Não definido'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest font-sans">Leitor Sentinela</p>
                                <p className="text-base font-bold text-slate-900 dark:text-white font-outfit">
                                    {nextWeekendAssignment?.reader || 'Não definido'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <DutyItem 
                            label="INDICADORES" 
                            value={`${nextWeekendAssignment?.indicator1 || 'Não definido'}${nextWeekendAssignment?.indicator2 ? ` / ${nextWeekendAssignment.indicator2}` : ''}`} 
                            dotColor="bg-emerald-500"
                        />
                        <DutyItem 
                            label="MICROFONE" 
                            value={`${nextWeekendAssignment?.mic1 || 'Não definido'}${nextWeekendAssignment?.mic2 ? ` / ${nextWeekendAssignment.mic2}` : ''}`} 
                            dotColor="bg-emerald-500"
                        />
                        <DutyItem 
                            label="ÁUDIO E VÍDEO" 
                            value={`${nextWeekendAssignment?.audio || 'Não definido'}${nextWeekendAssignment?.video ? ` / ${nextWeekendAssignment.video}` : ''}`} 
                            dotColor="bg-indigo-500"
                        />
                    </div>
                </motion.section>

                {/* Small Cards Grid - Compacted */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-8">
                    {/* Dirigente Sábado */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 }}
                        className="bg-white dark:bg-slate-900/80 rounded-[28px] p-6 border border-slate-200 dark:border-white/[0.05] flex flex-col justify-between min-h-[150px] group transition-all hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-indigo-500/20"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-4">
                                <p className="text-[10px] font-bold tracking-[0.15em] text-slate-600 dark:text-slate-500 uppercase font-sans">DIRIGENTE SÁBADO</p>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-tighter">RESPONSÁVEL</p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white font-outfit line-clamp-1">
                                            {nextFieldService?.conductorName || 'Não definido'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.03] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-indigo-500" />
                                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-sans uppercase tracking-[0.1em]">
                                    {nextFieldService ? new Date(nextFieldService.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : 'Sem data'}
                                </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-700" />
                        </div>
                    </motion.div>

                    {/* Dirigente 1º Domingo */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.45 }}
                        className="bg-white dark:bg-slate-900/80 rounded-[28px] p-6 border border-slate-200 dark:border-white/[0.05] flex flex-col justify-between min-h-[150px] relative overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-rose-500/20 transition-all"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-4">
                                <p className="text-[10px] font-bold tracking-[0.15em] text-rose-600 dark:text-rose-500 uppercase font-sans">DIRIGENTE 1º DOMINGO</p>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-tighter">RESPONSÁVEL</p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white font-outfit line-clamp-1">
                                            {nextFirstSundayConductor?.conductorName || 'Não definido'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-700 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.03]">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-rose-500" />
                                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400/80 font-sans uppercase tracking-[0.1em]">
                                    {nextFirstSundayConductor ? new Date(nextFirstSundayConductor.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', timeZone: 'UTC' }) : 'Sem data'}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Limpeza Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.55 }}
                        className="bg-white dark:bg-slate-900/80 rounded-[28px] p-6 border border-slate-200 dark:border-white/[0.05] flex flex-col justify-between min-h-[150px] group hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-amber-500/20 transition-all"
                    >
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold tracking-[0.2em] text-amber-700 dark:text-amber-500 uppercase font-sans">LIMPEZA DO SALÃO</p>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-400 border border-amber-500/20 group-hover:rotate-6 transition-transform flex-shrink-0">
                                    <LayoutGrid className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-lg font-bold text-slate-900 dark:text-white font-outfit truncate">{nextCleaning?.group || 'Nenhum grupo'}</p>
                                    {nextCleaning?.group && CLEANING_GROUPS[nextCleaning.group] && (
                                        <p className="text-[9px] font-bold text-slate-600 dark:text-slate-500 font-sans uppercase tracking-tight line-clamp-1">
                                            {CLEANING_GROUPS[nextCleaning.group]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.03]">
                            <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/60 font-sans uppercase tracking-[0.15em]">
                                {nextCleaning ? `${new Date(nextCleaning.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} a ${new Date(nextCleaning.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}` : 'Sem data'}
                            </p>
                        </div>
                    </motion.div>

                    {/* Próximos Grupos Card - Compacted as well */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.65 }}
                        className="bg-white dark:bg-slate-900/80 rounded-[28px] p-6 border border-slate-200 dark:border-white/[0.05] flex flex-col justify-between min-h-[150px] group hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-emerald-500/20 transition-all"
                    >
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-600 dark:text-emerald-500 uppercase font-sans">PRÓXIMOS GRUPOS</p>
                            <div className="grid grid-cols-1 gap-2">
                                {nextCleaningGroups.length > 0 ? (
                                    nextCleaningGroups.map((group, idx) => (
                                        <div key={group.id || idx} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="h-5 w-5 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                                                    <span className="text-[8px] font-bold uppercase">{group.group.split(' ')[1] || 'G'}</span>
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-900 dark:text-white font-sans truncate">{group.group}</span>
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 font-sans uppercase tracking-tighter flex-shrink-0">
                                                {new Date(group.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-slate-500 font-sans">Sem programações</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>


                {/* Announcements Section */}
                <section className="space-y-8 pt-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-outfit">Anúncios</h3>
                        <Link to="/announcements" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors font-sans uppercase tracking-[0.1em]">Ver todas</Link>
                    </div>

                    <div className="space-y-5 pb-12">
                        {isLoadingAnnouncements ? (
                            [1, 2].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-900/40 rounded-[32px] animate-pulse border border-slate-100 dark:border-white/[0.05]"></div>)
                        ) : announcements.length > 0 ? (
                            announcements.slice(0, 3).map((ann, idx) => {
                                const isExpanded = expandedAnnouncement === ann.id;
                                return (
                                    <motion.div 
                                        key={ann.id} 
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ 
                                            delay: 0.7 + (idx * 0.1),
                                            layout: { duration: 0.3, ease: "easeOut" }
                                        }}
                                        onClick={() => setExpandedAnnouncement(isExpanded ? null : ann.id)}
                                        className={`bg-white dark:bg-slate-900/80 p-8 rounded-[32px] border border-slate-200 dark:border-white/[0.05] flex items-start gap-6 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-md dark:shadow-lg ${isExpanded ? 'ring-1 ring-indigo-500/30' : ''}`}
                                    >
                                        <div className="h-16 w-16 rounded-[24px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                                            {ann.title.toLowerCase().includes('manutenção') ? <Monitor className="h-8 w-8" /> : 
                                             ann.title.toLowerCase().includes('urgente') ? <ShieldCheck className="h-8 w-8 text-rose-500 dark:text-rose-400" /> :
                                             <Megaphone className="h-8 w-8" />}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1 py-1">
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate font-outfit uppercase tracking-tight">{ann.title}</h4>
                                            <p className={`text-sm text-slate-700 dark:text-slate-400 leading-relaxed font-sans transition-all duration-300 ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                                                {ann.body}
                                            </p>
                                            {isExpanded && ann.date && (
                                                <div className="pt-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Publicado em {new Date(ann.date).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronRight className="h-6 w-6 text-slate-400 dark:text-slate-700 group-hover:translate-x-2 transition-all" />
                                        </motion.div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="text-center py-16 bg-slate-100 dark:bg-slate-900/20 rounded-[32px] border border-slate-200 dark:border-white/[0.03]">
                                <Info className="h-10 w-10 text-slate-400 dark:text-slate-700 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 font-sans">Nenhum anúncio no momento.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

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

const PremiumPartItem: React.FC<{ icon: React.ReactNode, iconColor: string, label: string, value: string }> = ({ icon, iconColor, label, value }) => (
    <div className="flex items-center justify-between gap-6 group/item">
        <div className="flex items-center gap-5">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover/item:scale-110 ${iconColor}`}>
                {icon}
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white font-outfit tracking-tight">{label}</p>
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-300 font-sans text-right max-w-[120px] truncate" title={value}>{value}</p>
    </div>
);

const DutyItem: React.FC<{ label: string, value: string, dotColor: string }> = ({ label, value, dotColor }) => (
    <div className="flex items-center justify-between gap-6 group/duty">
        <div className="flex items-center gap-5">
            <div className={`h-2 w-2 rounded-full ${dotColor} flex-shrink-0 shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-transform group-hover/duty:scale-150 duration-500`}></div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-800 dark:text-slate-400 uppercase font-sans group-hover/duty:text-slate-950 dark:group-hover/duty:text-slate-300 transition-colors">{label}</p>
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-200 font-sans text-right">{value}</p>
    </div>
);

export default Dashboard;
