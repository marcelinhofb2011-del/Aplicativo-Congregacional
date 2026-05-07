
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsInputFocused } from '../hooks/useIsInputFocused';
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
    const [isModalOpen, setIsModalOpen] = useState(false);
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
            setIsModalOpen(false);
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
        setIsModalOpen(true);
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

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Top Bar - Fixed */}
            <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-slate-800/80 backdrop-blur-md shadow-lg">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-white font-bold text-lg">Agenda Pessoal</h2>
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
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-slate-50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6 pt-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <span className="text-sm font-bold uppercase tracking-widest text-white/90">
                            {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                        <h1 className="text-8xl font-black tracking-tighter drop-shadow-2xl">
                            {selectedDate.getDate()}
                        </h1>
                        <p className="text-2xl font-medium capitalize text-white">
                            {selectedWeekday}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-12 relative z-10 space-y-6">
                {/* Monthly Calendar Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6"
                >
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold text-slate-900 capitalize">{monthName}</h2>
                        <div className="flex gap-2">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <ChevronLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <ChevronRight className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-y-4 text-center">
                        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(day => (
                            <span key={day} className="text-[10px] font-bold text-slate-500 tracking-widest">{day}</span>
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
                                    className={`relative h-10 w-10 mx-auto flex items-center justify-center rounded-xl text-sm font-medium transition-all
                                        ${!d.isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
                                        ${isSel ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/30' : 'hover:bg-slate-50'}
                                        ${isTdy && !isSel ? 'border-2 border-slate-800' : ''}
                                    `}
                                >
                                    {d.day}
                                    {hasContent && (
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 items-center">
                                            {dayNotes.length > 0 && (
                                                <div className="flex items-center">
                                                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                                                    {dayNotes.length > 1 && (
                                                        <span className="text-[7px] font-bold text-blue-400 ml-0.5 leading-none">{dayNotes.length}</span>
                                                    )}
                                                </div>
                                            )}
                                            {dayEvents.length > 0 && (
                                                <div className="flex items-center">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                                    {dayEvents.length > 1 && (
                                                        <span className="text-[7px] font-bold text-emerald-400 ml-0.5 leading-none">{dayEvents.length}</span>
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
                    <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Lembretes Pendentes</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-black text-blue-600">{pendingRemindersCount}</span>
                            <span className="text-xs text-blue-400 font-medium">Para hoje</span>
                        </div>
                    </div>
                    <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Eventos do Mês</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-black text-indigo-600">{monthEventsCount}</span>
                            <span className="text-xs text-indigo-400 font-medium">Agendados</span>
                        </div>
                    </div>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-xl font-bold text-slate-900">
                            {showAll ? 'Todas as Anotações' : 'Minhas Anotações'}
                            <span className="ml-2 text-sm text-slate-500 font-bold">({filteredNotes.length})</span>
                        </h3>
                        <button 
                            onClick={() => setShowAll(!showAll)}
                            className="text-sm font-bold text-blue-700"
                        >
                            {showAll ? 'Ver por dia' : 'Ver todos'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
                            </div>
                        ) : filteredNotes.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                                <p className="text-slate-400 font-medium">Nenhuma anotação para este dia</p>
                            </div>
                        ) : (
                            filteredNotes.map((note) => (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`bg-white p-5 rounded-3xl shadow-sm border-l-4 flex items-start gap-4 group
                                        ${note.category === 'SAÚDE' ? 'border-l-blue-500' : 
                                          note.category === 'VIAGEM' ? 'border-l-emerald-500' : 
                                          note.category === 'LEMBRETE' ? 'border-l-amber-500' : 'border-l-slate-400'}
                                    `}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                                        ${note.category === 'SAÚDE' ? 'bg-blue-50' : 
                                          note.category === 'VIAGEM' ? 'bg-emerald-50' : 
                                          note.category === 'LEMBRETE' ? 'bg-amber-50' : 'bg-slate-50'}
                                    `}>
                                        {getCategoryIcon(note.category)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`font-bold text-slate-900 truncate ${note.isCompleted ? 'line-through opacity-50' : ''}`}>
                                                {note.title}
                                            </h4>
                                            <span className="text-xs font-bold text-slate-600">
                                                {showAll && <span className="mr-2">{new Date(note.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>}
                                                {note.time}
                                            </span>
                                        </div>
                                        <p className={`text-sm text-slate-700 font-medium line-clamp-2 mb-3 ${note.isCompleted ? 'opacity-50' : ''}`}>
                                            {note.description}
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(note.category)}`}>
                                                {note.category}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleToggleComplete(note)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                                >
                                                    {note.isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-slate-400" />}
                                                </button>
                                                <button 
                                                    onClick={() => openEditModal(note)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-slate-600" />
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteConfirmId(note.id)}
                                                    className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-rose-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="w-8 h-8 text-rose-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Excluir Anotação?</h3>
                            <p className="text-slate-500 text-sm mb-6">Esta ação não pode ser desfeita.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 py-3 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteNote(deleteConfirmId)}
                                    className="flex-1 py-3 rounded-2xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
                                >
                                    Excluir
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            {!isInputFocused && (
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
                        setIsModalOpen(true);
                    }}
                    className="fixed bottom-28 right-6 bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-slate-800/40 flex items-center gap-3 font-bold z-20"
                >
                    <Plus className="w-6 h-6" />
                    <span>Adicionar Anotação</span>
                </motion.button>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className={`fixed inset-0 z-[100] flex justify-center p-4 transition-all duration-300 ${isInputFocused ? 'items-start pt-10' : 'items-end sm:items-center'}`}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="relative w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900">
                                    {editingNote ? 'Editar Anotação' : 'Nova Anotação'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X className="w-6 h-6 text-slate-600" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 block">Título</label>
                                    <input 
                                        type="text" 
                                        value={newNote.title}
                                        onChange={e => setNewNote({...newNote, title: e.target.value})}
                                        placeholder="Ex: Consulta Médica"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-slate-800 transition-all placeholder:text-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 block">Descrição</label>
                                    <textarea 
                                        value={newNote.description}
                                        onChange={e => setNewNote({...newNote, description: e.target.value})}
                                        placeholder="Detalhes da anotação..."
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-slate-800 transition-all resize-none placeholder:text-slate-400"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 block">Data</label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                            <input 
                                                type="date" 
                                                value={newNote.date}
                                                onChange={e => setNewNote({...newNote, date: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-slate-800 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 block">Horário</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                            <input 
                                                type="time" 
                                                value={newNote.time}
                                                onChange={e => setNewNote({...newNote, time: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-slate-800 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4 block">Categoria</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(['NOTAS', 'SAÚDE', 'VIAGEM', 'LEMBRETE'] as CalendarNote['category'][]).map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setNewNote({...newNote, category: cat})}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border
                                                    ${newNote.category === cat ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-800/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}
                                                `}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={handleAddNote}
                                    disabled={!newNote.title}
                                    className="w-full bg-slate-800 text-white py-5 rounded-3xl font-bold text-lg shadow-xl shadow-slate-800/30 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                                >
                                    {editingNote ? 'Salvar Alterações' : 'Criar Anotação'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Calendar;
