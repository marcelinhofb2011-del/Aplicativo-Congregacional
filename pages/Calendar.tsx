import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, XIcon, BirdIcon, TrashIcon } from '../components/icons/Icons';

type NoteColor = 'yellow' | 'blue' | 'red';
interface Note {
  id: string;
  text: string;
  color: NoteColor;
}

const NOTE_COLORS: { name: NoteColor; bg: string; darkBg: string }[] = [
  { name: 'yellow', bg: 'bg-yellow-200', darkBg: 'dark:bg-yellow-800' },
  { name: 'blue', bg: 'bg-blue-200', darkBg: 'dark:bg-blue-800' },
  { name: 'red', bg: 'bg-red-200', darkBg: 'dark:bg-red-800' },
];

const LOCAL_STORAGE_KEY = 'congregational-calendar-notes';

const Calendar: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [notes, setNotes] = useState<Record<string, Note[]>>({});
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    // Carregar notas do localStorage
    useEffect(() => {
        try {
            const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedNotes) {
                setNotes(JSON.parse(savedNotes));
            }
        } catch (error) {
            console.error("Falha ao carregar anotações:", error);
        }
    }, []);

    // Salvar notas no localStorage
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
        } catch (error) {
            console.error("Falha ao salvar anotações:", error);
        }
    }, [notes]);

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const grid: (Date | null)[] = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            grid.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push(new Date(year, month, i));
        }
        return grid;
    }, [currentDate]);

    const handleDayClick = (day: Date) => {
        setSelectedDay(day);
        setEditingNote(null);
        setIsModalOpen(true);
    };

    const handleAddNote = () => {
        const dayToUse = selectedDay || new Date();
        setSelectedDay(dayToUse);
        setEditingNote(null);
        setIsModalOpen(true);
    };

    const handleEditNote = (day: Date, note: Note) => {
        setSelectedDay(day);
        setEditingNote(note);
        setIsModalOpen(true);
    }
    
    const handleSaveNote = useCallback((text: string, color: NoteColor) => {
        if (!selectedDay) return;
        const dateKey = selectedDay.toISOString().split('T')[0];
        
        setNotes(prev => {
            const dayNotes = prev[dateKey] ? [...prev[dateKey]] : [];
            if (editingNote) { // Editando
                const noteIndex = dayNotes.findIndex(n => n.id === editingNote.id);
                if (noteIndex > -1) {
                    dayNotes[noteIndex] = { ...editingNote, text, color };
                }
            } else { // Novo
                dayNotes.push({ id: crypto.randomUUID(), text, color });
            }
            return { ...prev, [dateKey]: dayNotes };
        });
        
        setIsModalOpen(false);
        setEditingNote(null);
    }, [selectedDay, editingNote]);
    
    const handleDeleteNote = useCallback((noteId: string) => {
        if (!selectedDay) return;
        const dateKey = selectedDay.toISOString().split('T')[0];
        setNotes(prev => {
            const dayNotes = prev[dateKey]?.filter(n => n.id !== noteId) || [];
            if (dayNotes.length > 0) {
                return { ...prev, [dateKey]: dayNotes };
            } else {
                const newNotes = { ...prev };
                delete newNotes[dateKey];
                return newNotes;
            }
        });
         setIsModalOpen(false);
         setEditingNote(null);
    }, [selectedDay]);

    const isToday = (day: Date) => {
        const today = new Date();
        return day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
    };

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="flex flex-col h-full p-4 md:p-6 pb-20">
            <header className="flex justify-between items-start mb-6 px-2">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                            Calendário de Anotações
                        </h1>
                        <BirdIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 hidden sm:block" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 capitalize">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        <ChevronLeftIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        <ChevronRightIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                {weekDays.map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1">
                {calendarGrid.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} className="bg-slate-50 dark:bg-slate-800/20 rounded-xl"></div>;
                    const dateKey = day.toISOString().split('T')[0];
                    const dayNotes = notes[dateKey] || [];

                    return (
                        <button key={dateKey} onClick={() => handleDayClick(day)} className="relative text-left p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 overflow-hidden flex flex-col">
                            <span className={`font-bold ${isToday(day) ? 'bg-primary text-white rounded-full h-7 w-7 flex items-center justify-center' : 'text-slate-700 dark:text-slate-300'}`}>{day.getDate()}</span>
                            <div className="flex-1 mt-2 space-y-1 overflow-y-auto">
                                {dayNotes.map(note => {
                                     const colorInfo = NOTE_COLORS.find(c => c.name === note.color);
                                     return (
                                        <div key={note.id} onClick={(e) => { e.stopPropagation(); handleEditNote(day, note); }} className={`p-1.5 rounded-md ${colorInfo?.bg} ${colorInfo?.darkBg}`}>
                                            <p className="text-xs text-slate-800 dark:text-slate-200 truncate">{note.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </button>
                    );
                })}
            </div>

            <button onClick={handleAddNote} className="fixed z-20 bottom-20 right-6 h-14 w-14 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-dark transition-transform transform hover:scale-110">
                <PlusIcon className="h-7 w-7" />
            </button>
            
            {isModalOpen && selectedDay && (
                <NoteModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    date={selectedDay}
                    note={editingNote}
                    onSave={handleSaveNote}
                    onDelete={handleDeleteNote}
                />
            )}
        </div>
    );
};

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    note: Note | null;
    onSave: (text: string, color: NoteColor) => void;
    onDelete: (noteId: string) => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, date, note, onSave, onDelete }) => {
    const [text, setText] = useState(note?.text || '');
    const [color, setColor] = useState<NoteColor>(note?.color || 'yellow');
    
    const handleSave = () => {
        if (text.trim()) {
            onSave(text.trim(), color);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                        {note ? 'Editar anotação' : 'Nova anotação'} para {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                    </h3>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        rows={4}
                        placeholder="Escreva sua anotação aqui..."
                        className="w-full mt-4 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent focus:ring-2 focus:ring-primary focus:outline-none"
                    ></textarea>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex space-x-2">
                            {NOTE_COLORS.map(c => (
                                <button key={c.name} onClick={() => setColor(c.name)} className={`h-8 w-8 rounded-full ${c.bg} ${c.darkBg} ${color === c.name ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-slate-800' : ''}`}></button>
                            ))}
                        </div>
                         {note && (
                            <button onClick={() => onDelete(note.id)} className="p-2 text-slate-500 hover:text-red-500 rounded-full">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 flex justify-end space-x-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark">Salvar</button>
                </div>
            </div>
        </div>
    );
};


export default Calendar;