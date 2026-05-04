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
    MeetingSchedule
} from '../types';
import { getAnnouncements, cleanupExpiredRecords } from '../services/firestoreService';
import ScheduleDetailModal from '../components/ScheduleDetailModal';
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
    Calendar
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
    const [nextMeetingSchedule, setNextMeetingSchedule] = useState<MeetingSchedule | null>(null);
    const [activeWeekRange, setActiveWeekRange] = useState<{ start: Date, end: Date } | null>(null);

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
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 pb-24 font-sans">
            {/* Custom Header matching the image */}
            <header className="sticky top-0 z-40 px-6 py-6 flex items-center justify-between bg-[#F8F9FB]/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/30 dark:border-slate-800/30">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold text-slate-700 dark:text-slate-200 font-outfit">Aplicativo da congregação</h1>
                </div>
                {/* ... rest of header ... */}
                <div className="flex items-center gap-2">
                    <Link 
                        to="/calendario" 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full transition-all hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50"
                        title="Agenda Pessoal"
                    >
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="text-xs font-bold font-sans uppercase tracking-wider">Agenda</span>
                    </Link>
                    <button onClick={toggleTheme} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                    </button>
                    <button onClick={() => logout()} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <LogOut className="h-6 w-6" />
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-8 max-w-2xl mx-auto">
                {/* Week Section */}
                <motion.section 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <p className="text-[10px] font-bold tracking-[0.2em] text-indigo-500 uppercase mb-4 font-sans">ESTA SEMANA</p>
                    
                    <div className="relative">
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-white tracking-tight font-outfit leading-tight lowercase first-letter:uppercase">
                            {activeWeekRange ? (
                                `${activeWeekRange.start.getUTCDate()}-${new Date(activeWeekRange.end.getTime() - 86400000).getUTCDate()} de ${activeWeekRange.end.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' })} programação dessa semana`
                            ) : (
                                'programação da semana'
                            )}
                        </h2>
                        <div className="h-1.5 w-24 bg-indigo-500 dark:bg-primary mt-6 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                    </div>
                </motion.section>

                {/* Sua Próxima Designação (Kept as requested) */}
                <AnimatePresence>
                    {nextAppointment && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 border border-primary/20 rounded-[32px] p-6 flex items-center justify-between shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                                    <BookOpen className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5 font-sans">Sua Próxima Designação</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight font-outfit">{nextAppointment.type}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                                        {new Date(nextAppointment.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' })}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleViewDetails(nextAppointment.fullData, nextAppointment.type)}
                                className="h-12 w-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 border border-slate-100 dark:border-slate-700"
                            >
                                <ChevronRight className="h-6 w-6 text-primary" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Midweek Card */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-xl shadow-indigo-100/50 dark:shadow-none border border-indigo-50 dark:border-slate-800 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute top-8 right-8 h-12 w-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                        <Book className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-8 font-outfit flex items-center gap-2">
                        <span className="h-8 w-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                        Meio de Semana
                    </h3>
                    
                    <div className="space-y-8">
                        <DutyItem 
                            label="ÁUDIO E VÍDEO" 
                            value={`${nextMidweekAssignment?.audio || 'Não definido'}${nextMidweekAssignment?.video ? ` / ${nextMidweekAssignment.video}` : ''}`} 
                            dotColor="bg-indigo-400"
                        />
                        <DutyItem 
                            label="INDICADORES" 
                            value={`${nextMidweekAssignment?.indicator1 || 'Não definido'}${nextMidweekAssignment?.indicator2 ? ` / ${nextMidweekAssignment.indicator2}` : ''}`} 
                            dotColor="bg-indigo-400"
                        />
                        <DutyItem 
                            label="MICROFONES" 
                            value={`${nextMidweekAssignment?.mic1 || 'Não definido'}${nextMidweekAssignment?.mic2 ? ` / ${nextMidweekAssignment.mic2}` : ''}`} 
                            dotColor="bg-indigo-400"
                        />
                        <DutyItem 
                            label="PRESIDENTE" 
                            value={nextMidweekAssignment?.president || 'Não definido'} 
                            dotColor="bg-indigo-400"
                        />
                    </div>
                </motion.section>

                {/* Weekend Card */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-xl shadow-emerald-100/50 dark:shadow-none border border-emerald-50 dark:border-slate-800 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute top-8 right-8 h-12 w-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                        <Home className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-8 font-outfit flex items-center gap-2">
                        <span className="h-8 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                        Final de Semana
                    </h3>
                    
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl p-8 mb-8 border border-emerald-100/50 dark:border-emerald-800/30">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-600/70 dark:text-emerald-400 uppercase mb-4 font-sans">DISCURSO PÚBLICO</p>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-white leading-snug mb-2 font-outfit">
                            {nextPublicTalk?.theme || 'Tema não definido'}
                        </h4>
                        {nextPublicTalk?.song && (
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-5 font-sans">
                                Cântico {nextPublicTalk.song}
                            </p>
                        )}
                        <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                            <User className="h-4 w-4 text-emerald-500" />
                            <p className="text-sm font-semibold font-sans">
                                {nextPublicTalk?.speakerName || 'Orador não definido'} 
                                {nextPublicTalk?.congregation ? ` (${nextPublicTalk.congregation})` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 px-2 mb-8">
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-2 font-sans">PRESIDENTE</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white font-outfit">
                                {nextWeekendAssignment?.president || 'Não definido'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-2 font-sans">LEITOR</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white font-outfit">
                                {nextWeekendAssignment?.reader || 'Não definido'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 border-t border-slate-100 dark:border-slate-800 pt-8">
                        <DutyItem 
                            label="ÁUDIO E VÍDEO" 
                            value={`${nextWeekendAssignment?.audio || 'Não definido'}${nextWeekendAssignment?.video ? ` / ${nextWeekendAssignment.video}` : ''}`} 
                            dotColor="bg-emerald-400"
                        />
                        <DutyItem 
                            label="INDICADORES" 
                            value={`${nextWeekendAssignment?.indicator1 || 'Não definido'}${nextWeekendAssignment?.indicator2 ? ` / ${nextWeekendAssignment.indicator2}` : ''}`} 
                            dotColor="bg-emerald-400"
                        />
                        <DutyItem 
                            label="MICROFONES" 
                            value={`${nextWeekendAssignment?.mic1 || 'Não definido'}${nextWeekendAssignment?.mic2 ? ` / ${nextWeekendAssignment.mic2}` : ''}`} 
                            dotColor="bg-emerald-400"
                        />
                    </div>
                </motion.section>

                {/* Small Cards Row */}
                <div className="grid grid-cols-2 gap-6">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] border border-amber-100 dark:border-amber-800/30 shadow-lg shadow-amber-100/20 dark:shadow-none"
                    >
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase mb-3 font-sans">LIMPEZA DO SALÃO</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white font-outfit">
                                {nextCleaning?.group || 'Nenhum grupo'}
                            </p>
                            {nextCleaning?.group && CLEANING_GROUPS[nextCleaning.group] && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                                    {CLEANING_GROUPS[nextCleaning.group].split('/').slice(0, 2).join(', ')}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-amber-600/70 dark:text-amber-400/70 font-sans tracking-wide">
                                {nextCleaning ? `${new Date(nextCleaning.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} — ${new Date(nextCleaning.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}` : 'Sem data'}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/20 dark:to-slate-900 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden border border-sky-100 dark:border-sky-800/30 shadow-lg shadow-sky-100/20 dark:shadow-none"
                    >
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.2em] text-sky-600 dark:text-sky-400 uppercase mb-3 font-sans">DIRIGENTE</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white font-outfit">
                                {nextFieldService?.conductorName || 'Não definido'}
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-sky-600/70 dark:text-sky-400/70 font-sans tracking-wide">
                                {nextFieldService ? new Date(nextFieldService.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : 'Sem data'}
                            </p>
                            <div className="h-10 w-10 bg-sky-100 dark:bg-sky-900/40 rounded-2xl flex items-center justify-center">
                                <Users className="h-6 w-6 text-sky-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.45 }}
                        className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-900 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden border border-rose-100 dark:border-rose-800/30 shadow-lg shadow-rose-100/20 dark:shadow-none col-span-2"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12"></div>
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.2em] text-rose-600 dark:text-rose-400 uppercase mb-3 font-sans">DIRIGENTE 1º DOMINGO</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white font-outfit">
                                {nextFirstSundayConductor?.conductorName || 'Não definido'}
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-rose-600/70 dark:text-rose-400/70 font-sans tracking-wide">
                                {nextFirstSundayConductor ? new Date(nextFirstSundayConductor.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', timeZone: 'UTC' }) : 'Sem data'}
                            </p>
                            <div className="h-10 w-10 bg-rose-100 dark:bg-rose-900/40 rounded-2xl flex items-center justify-center">
                                <Users className="h-6 w-6 text-rose-600" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Announcements Section */}
                <section className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-outfit">Anúncios</h3>
                        <Link to="/announcements" className="text-sm font-bold text-slate-400 hover:text-primary transition-colors font-sans">Ver todos</Link>
                    </div>

                    <div className="space-y-4">
                        {isLoadingAnnouncements ? (
                            [1, 2].map(i => <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-3xl animate-pulse"></div>)
                        ) : announcements.length > 0 ? (
                            announcements.slice(0, 3).map((ann, idx) => (
                                <motion.div 
                                    key={ann.id} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (idx * 0.1) }}
                                    className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="h-14 w-14 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                                        {ann.title.toLowerCase().includes('manutenção') ? <Monitor className="h-7 w-7" /> : 
                                         ann.title.toLowerCase().includes('urgente') ? <ShieldCheck className="h-7 w-7 text-red-400" /> :
                                         <Megaphone className="h-7 w-7" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1 truncate font-outfit">{ann.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-sans">{ann.body}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-300 flex-shrink-0" />
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">Nenhum anúncio no momento.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <ScheduleDetailModal
                schedule={viewingSchedule}
                onClose={() => setViewingSchedule(null)}
            />
        </div>
    );
};

const DutyItem: React.FC<{ label: string, value: string, dotColor: string }> = ({ label, value, dotColor }) => (
    <div className="flex items-start gap-5">
        <div className={`h-2.5 w-2.5 rounded-full ${dotColor} mt-2 flex-shrink-0 shadow-sm`}></div>
        <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-1.5 font-sans">{label}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight font-outfit">{value}</p>
        </div>
    </div>
);

export default Dashboard;
