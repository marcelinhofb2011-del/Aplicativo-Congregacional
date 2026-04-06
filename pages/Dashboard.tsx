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
    FirstSundayConductor
} from '../types';
import { getAnnouncements, cleanupExpiredRecords } from '../services/firestoreService';
import ScheduleDetailModal from '../components/ScheduleDetailModal';
import { Link } from 'react-router-dom';
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
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';

type UpcomingEvent = {
    date: Date;
    type: 'Vida e Ministério' | 'Designações' | 'Limpeza' | 'Serviço de Campo' | 'Discurso Público';
    title: string;
    description: string;
    fullData: LifeMinistrySchedule | Assignment | CleaningSchedule | ConductorMeeting | PublicTalkSchedule;
};

const findNextUpcomingRange = <T extends { date: string, endDate?: string }>(items: T[]): T | undefined => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const today = new Date(todayStr + 'T00:00:00Z');

    return items
        .filter(item => {
            if (!item.date || isNaN(new Date(item.date).getTime())) return false;

            let endDate: Date;
            if (item.endDate && !isNaN(new Date(item.endDate).getTime())) {
                endDate = new Date(item.endDate);
            } else {
                const startDate = new Date(item.date);
                endDate = new Date(startDate.getTime());
                endDate.setUTCDate(startDate.getUTCDate() + 6);
            }
            return endDate >= today;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
};

const findNextUpcoming = <T extends { date: string }>(items: T[]): T | undefined => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const today = new Date(todayStr + 'T00:00:00Z');

    return items
        .filter(item => item.date && !isNaN(new Date(item.date).getTime()))
        .filter(item => new Date(item.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
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

        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        const today = new Date(todayStr + 'T00:00:00Z');

        const bufferDate = new Date(today);
        bufferDate.setUTCDate(today.getUTCDate() - 3);

        const allUpcomingEvents: UpcomingEvent[] = schedules.map(s => {
            if ('week' in s) return { date: new Date(s.date), type: 'Vida e Ministério', title: s.week, description: `Presidente: ${s.president || 'Não definido'}`, fullData: s };
            if ('president' in s && !('week' in s)) return { date: new Date(s.date), type: 'Designações', title: 'Reunião de Fim de Semana', description: `Presidente: ${s.president || 'Não definido'}`, fullData: s };
            if ('group' in s && 'endDate' in s) return { date: new Date(s.date), type: 'Limpeza', title: s.group, description: `Responsáveis: ${s.assignedUids?.join(', ') || 'Grupo'}`, fullData: s };
            if ('conductorName' in s) return { date: new Date(s.date), type: 'Serviço de Campo', title: 'Saída de campo', description: `Dirigente: ${s.conductorName}`, fullData: s };
            return null;
        }).filter((e): e is UpcomingEvent => e !== null && e.date >= today)
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        const userAssignmentsList = allUpcomingEvents.filter(event => 
            event.fullData.assignedUids?.includes(user.uid)
        );
        
        setNextAppointment(userAssignmentsList.length > 0 ? userAssignmentsList[0] : null);

        const lifeMinistrySchedules = schedules.filter(s => 'week' in s && 'president' in s) as LifeMinistrySchedule[];
        const currentLifeMinistry = findNextUpcomingRange(lifeMinistrySchedules);
        setNextLifeMinistry(currentLifeMinistry);

        const assignmentSchedules = schedules.filter(s => 'president' in s && !('week' in s)) as Assignment[];
        const cleaningSchedules = schedules.filter(s => 'group' in s && 'endDate' in s) as CleaningSchedule[];
        const fieldServiceSchedules = schedules.filter(s => 'conductorName' in s && !('month' in s)) as ConductorMeeting[];
        const publicTalkSchedules = schedules.filter(s => 'speakerName' in s && 'theme' in s) as PublicTalkSchedule[];
        const firstSundaySchedules = schedules.filter(s => 'conductorName' in s && 'month' in s) as FirstSundayConductor[];

        // Filter assignments to be within the current week if possible
        let midweekAssignments = assignmentSchedules.filter(a => {
            const day = new Date(a.date).getUTCDay();
            return day >= 1 && day <= 5;
        });
        let weekendAssignments = assignmentSchedules.filter(a => {
            const day = new Date(a.date).getUTCDay();
            return day === 0 || day === 6;
        });

        if (currentLifeMinistry) {
            const weekStart = new Date(currentLifeMinistry.date);
            const weekEnd = new Date(weekStart.getTime());
            weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

            const midweekInWeek = midweekAssignments.filter(a => {
                const d = new Date(a.date);
                return d >= weekStart && d <= weekEnd;
            });
            const weekendInWeek = weekendAssignments.filter(a => {
                const d = new Date(a.date);
                return d >= weekStart && d <= weekEnd;
            });

            if (midweekInWeek.length > 0) midweekAssignments = midweekInWeek;
            if (weekendInWeek.length > 0) weekendAssignments = weekendInWeek;
        }

        setNextMidweekAssignment(findNextUpcoming(midweekAssignments));
        setNextWeekendAssignment(findNextUpcoming(weekendAssignments));
        
        setNextCleaning(findNextUpcomingRange(cleaningSchedules));
        setNextFieldService(findNextUpcoming(fieldServiceSchedules));
        setNextPublicTalk(findNextUpcoming(publicTalkSchedules));
        setNextFirstSundayConductor(findNextUpcoming(firstSundaySchedules));

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

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 pb-24 font-sans">
            {/* Custom Header matching the image */}
            <header className="sticky top-0 z-40 px-6 py-6 flex items-center justify-between bg-[#F8F9FB]/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/30 dark:border-slate-800/30">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold text-slate-700 dark:text-slate-200 font-outfit">Aplicativo da congregação</h1>
                </div>
                {/* ... rest of header ... */}
                <div className="flex items-center gap-2">
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
                >
                    <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-1 font-sans">ESTA SEMANA</p>
                    <div className="relative inline-block">
                        <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight font-outfit">
                            {nextLifeMinistry?.week || 'Sem programação'}
                        </h2>
                        <div className="h-1.5 w-20 bg-slate-800 dark:bg-primary mt-3 rounded-full"></div>
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
                            value={nextMidweekAssignment?.president || nextLifeMinistry?.president || 'Não definido'} 
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
                        <h4 className="text-xl font-bold text-slate-800 dark:text-white leading-snug mb-5 font-outfit">
                            {nextPublicTalk?.theme || 'Tema não definido'}
                        </h4>
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
                            <p className="text-[10px] font-bold tracking-[0.2em] text-sky-600 dark:text-sky-400 uppercase mb-3 font-sans">DIRIGENTE SÁBADO</p>
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
