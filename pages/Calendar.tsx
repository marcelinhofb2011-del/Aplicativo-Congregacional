
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsInputFocused } from '../hooks/useIsInputFocused';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { 
    getCalendarNotes, 
    addCalendarNote, 
    updateCalendarNote, 
    deleteCalendarNote,
    getCalendarEvents
} from '../services/firestoreService';
import { CalendarNote, CalendarEvent } from '../types';
import { 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    Calendar as CalendarIcon, 
    Clock, 
    MapPin, 
    Stethoscope, 
    Plane, 
    FileText,
    CheckCircle2,
    Circle,
    X,
    MoreVertical,
    Bell,
    Menu as MenuIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Calendar: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isInputFocused = useIsInputFocused();
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    useBodyScrollLock(isFormOpen);
    const [showAll, setShowAll] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);
    const [newNote, setNewNote] = useState({
        title: '',
        description: '',
        time: '',
        category: 'NOTAS' as CalendarNote['category'],
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [fetchedNotes, fetchedEvents] = await Promise.all([
                getCalendarNotes(user.uid),
                getCalendarEvents()
            ]);
            setNotes(fetchedNotes);
            setEvents(fetchedEvents);
        } catch (error) {
            console.error("Error fetching calendar data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const date = new Date(year, month, 1);
        const days = [];
        
        // Get the day of the week for the first day of the month
        const firstDayIndex = date.getDay();
        
        // Add padding for previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                month: month - 1,
                year: year,
                isCurrentMonth: false
            });
        }
        
        // Add days of current month
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) {
            days.push({
                day: i,
                month: month,
                year: year,
                isCurrentMonth: true
            });
        }
        
        // Add padding for next month
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                day: i,
                month: month + 1,
                year: year,
                isCurrentMonth: false
            });
        }
        
        return days;
    }, [currentMonth]);

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const isToday = (day: number, month: number, year: number) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    };

    const isSelected = (day: number, month: number, year: number) => {
        return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
    };

    const getDayContent = (day: number, month: number, year: number) => {
        const dateStr = new Date(year, month, day).toISOString().split('T')[0];
        const dayNotes = notes.filter(n => n.date === dateStr);
        const dayEvents = events.filter(e => e.date === dateStr);
        return { notes: dayNotes, events: dayEvents };
    };

    const handleAddNote = async () => {
        if (!user) return;
        try {
            if (editingNote) {
                await updateCalendarNote(editingNote.id, {
                    ...newNote,
                    isCompleted: editingNote.isCompleted
                }, user.uid);
            } else {
                await addCalendarNote({
                    ...newNote,
                    isCompleted: false
                }, user.uid);
            }
            setIsFormOpen(false);
            setEditingNote(null);
            setNewNote({
                title: '',
                description: '',
                time: '',
                category: 'NOTAS',
                date: selectedDate.toISOString().split('T')[0]
            });
            fetchData();
        } catch (error) {
            console.error("Error saving note:", error);
        }
    };

    const handleToggleComplete = async (note: CalendarNote) => {
        if (!user) return;
        try {
            await updateCalendarNote(note.id, { isCompleted: !note.isCompleted }, user.uid);
            fetchData();
        } catch (error) {
            console.error("Error toggling completion:", error);
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!user) return;
        try {
            await deleteCalendarNote(id);
            setDeleteConfirmId(null);
            fetchData();
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    };

    const openEditModal = (note: CalendarNote) => {
        setEditingNote(note);
        setNewNote({
            title: note.title,
            description: note.description,
            time: note.time || '',
            category: note.category,
            date: note.date
        });
        setIsFormOpen(true);
        setTimeout(() => {
            const formElement = document.getElementById('note-form-section');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const filteredNotes = useMemo(() => {
        if (showAll) return notes;
        const dateStr = selectedDate.toISOString().split('T')[0];
        return notes.filter(n => n.date === dateStr);
    }, [notes, selectedDate, showAll]);

    const monthName = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const selectedDateDisplay = selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const selectedWeekday = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' });

    const pendingRemindersCount = notes.filter(n => !n.isCompleted).length;
    const monthEventsCount = events.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
    }).length;

    const getCategoryIcon = (category: CalendarNote['category']) => {
        switch (category) {
            case 'SAÚDE': return <Stethoscope className="w-5 h-5 text-blue-500" />;
            case 'VIAGEM': return <Plane className="w-5 h-5 text-emerald-500" />;
            case 'LEMBRETE': return <Bell className="w-5 h-5 text-amber-500" />;
            default: return <FileText className="w-5 h-5 text-slate-500" />;
        }
    };

    const getCategoryColor = (category: CalendarNote['category']) => {
        switch (category) {
            case 'SAÚDE': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'VIAGEM': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'LEMBRETE': return 'bg-amber-50 text-amber-600 border-amber-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getCategorySelectStyle = (category: CalendarNote['category'], isSelected: boolean) => {
        if (!isSelected) {
            return 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-850';
        }
        switch (category) {
            case 'SAÚDE': 
                return 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:text-slate-950 dark:border-blue-500 shadow-md shadow-blue-500/20';
            case 'VIAGEM': 
                return 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-500 shadow-md shadow-emerald-500/20';
            case 'LEMBRETE': 
                return 'bg-amber-500 text-slate-950 border-amber-500 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-500 shadow-md shadow-amber-500/20';
            default: 
                return 'bg-slate-800 text-white border-slate-850 dark:bg-slate-100 dark:text-slate-950 dark:border-slate-100 shadow-md shadow-slate-800/10 dark:shadow-none';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 transition-colors duration-300">
            {/* Top Bar - Fixed */}
            <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 shadow-md transition-colors duration-300">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-xl text-slate-800 dark:text-white transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-slate-900 dark:text-white font-black text-lg tracking-tight">Agenda Pessoal</h2>
                <div className="w-10" /> {/* Spacer to center title */}
            </div>

            {/* Spacer for fixed header */}
            <div className="h-16"></div>

            {/* Hero Header */}
            <div className="relative h-80 w-full overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1444464666168-49d633b86797?q=80&w=1200&auto=format&fit=crop" 
                    alt="Hero" 
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-slate-50 dark:to-slate-950 transition-colors duration-300" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6 pt-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1"
                    >
                        <span className="text-xs font-black uppercase tracking-[0.25em] text-white/90">
                            {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                        <h1 className="text-8xl font-black tracking-tighter drop-shadow-2xl">
                            {selectedDate.getDate()}
                        </h1>
                        <p className="text-2xl font-extrabold capitalize text-white tracking-tight">
                            {selectedWeekday}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-10 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Calendar, Summaries & Notes */}
                    <div className="lg:col-span-7 space-y-6 w-full">
                {/* Monthly Calendar Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/60 p-6 transition-all duration-300"
                >
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white capitalize tracking-tight">{monthName}</h2>
                        <div className="flex gap-2">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-y-4 text-center">
                        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(day => (
                            <span key={day} className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest">{day}</span>
                        ))}
                        
                        {daysInMonth.map((d, i) => {
                            const { notes: dayNotes, events: dayEvents } = getDayContent(d.day, d.month, d.year);
                            const hasContent = dayNotes.length > 0 || dayEvents.length > 0;
                            const isSel = isSelected(d.day, d.month, d.year);
                            const isTdy = isToday(d.day, d.month, d.year);

                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(new Date(d.year, d.month, d.day))}
                                    className={`relative h-10 w-10 mx-auto flex items-center justify-center rounded-xl text-sm font-black transition-all
                                        ${!d.isCurrentMonth ? 'text-slate-350 dark:text-slate-700' : 'text-slate-700 dark:text-slate-300'}
                                        ${isSel ? 'bg-amber-500 dark:bg-amber-500 text-slate-950 dark:text-slate-950 shadow-lg shadow-amber-500/25' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}
                                        ${isTdy && !isSel ? 'border-2 border-amber-500 dark:border-amber-500 text-amber-600 dark:text-amber-500' : ''}
                                    `}
                                >
                                    {d.day}
                                    {hasContent && (
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 items-center">
                                            {dayNotes.length > 0 && (
                                                <div className="flex items-center">
                                                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                                                    {dayNotes.length > 1 && (
                                                        <span className="text-[7px] font-black text-blue-400 ml-0.5 leading-none">{dayNotes.length}</span>
                                                    )}
                                                </div>
                                            )}
                                            {dayEvents.length > 0 && (
                                                <div className="flex items-center">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                                    {dayEvents.length > 1 && (
                                                        <span className="text-[7px] font-black text-emerald-400 ml-0.5 leading-none">{dayEvents.length}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-5 rounded-3xl border border-blue-100/60 dark:border-blue-800/20 transition-all duration-300">
                        <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest block">Lembretes Pendentes</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{pendingRemindersCount}</span>
                            <span className="text-xs text-blue-500/75 dark:text-blue-400/70 font-bold">Para hoje</span>
                        </div>
                    </div>
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-3xl border border-indigo-100/60 dark:border-indigo-800/20 transition-all duration-300">
                        <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block">Eventos do Mês</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{monthEventsCount}</span>
                            <span className="text-xs text-indigo-500/75 dark:text-indigo-400/70 font-bold">Agendados</span>
                        </div>
                    </div>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {showAll ? 'Todas as Anotações' : 'Minhas Anotações'}
                            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 font-bold">({filteredNotes.length})</span>
                        </h3>
                        <button 
                            onClick={() => setShowAll(!showAll)}
                            className="text-sm font-black text-primary dark:text-amber-500 hover:opacity-80 transition-colors"
                        >
                            {showAll ? 'Ver por dia' : 'Ver todos'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 dark:border-white" />
                            </div>
                        ) : filteredNotes.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 transition-all">
                                <FileText className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                                <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">Nenhuma anotação para este dia</p>
                            </div>
                        ) : (
                            filteredNotes.map((note) => (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`bg-white dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl shadow-sm hover:shadow-md border-l-4 flex flex-col gap-3 group transition-all duration-300 border-y border-r border-slate-100/50 dark:border-slate-800/40
                                        ${note.category === 'SAÚDE' ? 'border-l-blue-500' : 
                                          note.category === 'VIAGEM' ? 'border-l-emerald-500' : 
                                          note.category === 'LEMBRETE' ? 'border-l-amber-500' : 'border-l-slate-450'}
                                    `}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300
                                            ${note.category === 'SAÚDE' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400' : 
                                              note.category === 'VIAGEM' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400' : 
                                              note.category === 'LEMBRETE' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400' : 
                                              'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}
                                        `}>
                                            {getCategoryIcon(note.category)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <h4 className={`font-black tracking-tight text-slate-900 dark:text-white truncate text-base leading-tight ${note.isCompleted ? 'line-through opacity-40' : ''}`}>
                                                    {note.title}
                                                </h4>
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                                    {showAll && <span className="mr-2 opacity-75">{new Date(note.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>}
                                                    {note.time}
                                                </span>
                                            </div>
                                            <p className={`text-sm text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed ${note.isCompleted ? 'line-through opacity-40' : ''}`}>
                                                {note.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20 -mx-5 -mb-5 px-5 py-3 rounded-b-3xl border-t border-slate-100/40 dark:border-slate-800/40 mt-1">
                                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getCategoryColor(note.category)}`}>
                                            {note.category}
                                        </span>
                                        <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleToggleComplete(note)}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-450 hover:text-emerald-500 dark:hover:text-emerald-455 transition-colors"
                                                title={note.isCompleted ? "Marcar pendente" : "Marcar concluída"}
                                            >
                                                {note.isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                                            </button>
                                            <button 
                                                onClick={() => openEditModal(note)}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-450 hover:text-slate-705 dark:hover:text-white transition-colors"
                                                title="Editar"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => setDeleteConfirmId(note.id)}
                                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-slate-405 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                                                title="Excluir"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

                {/* Right Column: Integrated Form (Responsive: Overlay on mobile, integrated side-by-side on desktop) */}
                <div 
                    id="note-form-section" 
                    className={`transition-all duration-300 w-full lg:col-span-12 xl:col-span-5 lg:sticky lg:top-24
                        ${isFormOpen 
                            ? 'fixed inset-0 z-[60] overflow-y-auto bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm p-4 flex items-start justify-center lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:overflow-visible lg:flex lg:items-start lg:justify-stretch' 
                            : 'hidden lg:block lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:overflow-visible'
                        }`}
                >
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 lg:p-8 rounded-[28px] sm:rounded-[32px] shadow-2xl lg:shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:lg:shadow-none transition-all duration-300 w-full max-w-md lg:max-w-none my-auto lg:my-0">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                {editingNote ? '✏️ Editar Anotação' : '📅 Nova Anotação'}
                            </h2>
                            {/* Close button ONLY shown on mobile to hide the form */}
                            <button 
                                onClick={() => setIsFormOpen(false)} 
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-full transition-colors text-slate-600 dark:text-slate-400 lg:hidden"
                                title="Fechar Formulário"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 sm:space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1 block">Título</label>
                                <input 
                                    type="text" 
                                    value={newNote.title}
                                    onChange={e => setNewNote({...newNote, title: e.target.value})}
                                    placeholder="Ex: Consulta Médica"
                                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-650 outline-none text-sm sm:text-base"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1 block">Descrição</label>
                                <textarea 
                                    value={newNote.description}
                                    onChange={e => setNewNote({...newNote, description: e.target.value})}
                                    placeholder="Detalhes da anotação..."
                                    rows={3}
                                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-650 outline-none text-sm sm:text-base"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1 block">Data</label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input 
                                            type="date" 
                                            value={newNote.date}
                                            onChange={e => setNewNote({...newNote, date: e.target.value})}
                                            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl sm:rounded-2xl pl-10 pr-3 py-3 sm:pl-11 sm:pr-4 sm:py-4 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 transition-all outline-none text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1 block">Horário</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input 
                                            type="time" 
                                            value={newNote.time}
                                            onChange={e => setNewNote({...newNote, time: e.target.value})}
                                            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl sm:rounded-2xl pl-10 pr-3 py-3 sm:pl-11 sm:pr-4 sm:py-4 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 transition-all outline-none text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-2 block">Categoria</label>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {(['NOTAS', 'SAÚDE', 'VIAGEM', 'LEMBRETE'] as CalendarNote['category'][]).map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setNewNote({...newNote, category: cat})}
                                            className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all border ${getCategorySelectStyle(cat, newNote.category === cat)}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-1">
                                {(editingNote || isFormOpen) && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setEditingNote(null);
                                            setNewNote({
                                                title: '',
                                                description: '',
                                                time: '',
                                                category: 'NOTAS',
                                                date: selectedDate.toISOString().split('T')[0]
                                            });
                                            setIsFormOpen(false);
                                        }}
                                        className="flex-1 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold hover:bg-slate-55 dark:hover:bg-slate-850 transition-colors"
                                    >
                                        Limpar
                                    </button>
                                )}
                                <button 
                                    onClick={handleAddNote}
                                    disabled={!newNote.title}
                                    className="flex-1 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-40 disabled:active:scale-100"
                                >
                                    {editingNote ? 'Salvar' : 'Criar Anotação'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="w-8 h-8 text-rose-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Excluir Anotação?</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Esta ação não pode ser desfeita.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 py-3 rounded-2xl font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-705 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteNote(deleteConfirmId)}
                                    className="flex-1 py-3 rounded-2xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200 dark:shadow-none"
                                >
                                    Excluir
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button - Mobile ONLY (lg:hidden) */}
            {!isFormOpen && !isInputFocused && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setEditingNote(null);
                        setNewNote({
                            title: '',
                            description: '',
                            time: '',
                            category: 'NOTAS',
                            date: selectedDate.toISOString().split('T')[0]
                        });
                        setIsFormOpen(true);
                        setTimeout(() => {
                            const formElement = document.getElementById('note-form-section');
                            if (formElement) {
                                formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 100);
                    }}
                    className="fixed bottom-28 right-6 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 px-6 py-4 rounded-2xl shadow-2xl shadow-slate-900/40 dark:shadow-amber-500/10 flex items-center gap-3 font-bold z-20 transition-colors lg:hidden"
                >
                    <Plus className="w-6 h-6" />
                    <span>Adicionar Anotação</span>
                </motion.button>
            )}
        </div>
    );
};

export default Calendar;
