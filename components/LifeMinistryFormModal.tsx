import React, { useState, useEffect } from 'react';
// FIX: Imported BaseRecord to resolve type errors.
import { LifeMinistrySchedule, StudentPart, ChristianLifePart, BaseRecord } from '../types';
import { XIcon } from './icons/Icons';

interface LifeMinistryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (schedule: Omit<LifeMinistrySchedule, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => void;
    initialData: LifeMinistrySchedule | null;
}

const calculateWeekRange = (dateString: string) => {
    // Input: "YYYY-MM-DD"
    const selectedDate = new Date(`${dateString}T00:00:00Z`);

    const dayOfWeek = selectedDate.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(selectedDate);
    monday.setUTCDate(selectedDate.getUTCDate() - diffToMonday);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const formatOptions: Intl.DateTimeFormatOptions = { month: 'long', timeZone: 'UTC' };
    const monthFormatter = new Intl.DateTimeFormat('pt-BR', formatOptions);

    const startDay = monday.getUTCDate();
    const endDay = sunday.getUTCDate();
    const startMonth = monthFormatter.format(monday);
    const endMonth = monthFormatter.format(sunday);

    const weekString = monday.getUTCMonth() === sunday.getUTCMonth()
        ? `${startDay}–${endDay} de ${endMonth}`
        : `${startDay} de ${startMonth}–${endDay} de ${endMonth}`;

    return {
        weekString,
        startDateISO: monday.toISOString(),
    };
};

// Initial state calculation
const initialDateStr = new Date().toISOString().split('T')[0];
const initialWeekData = calculateWeekRange(initialDateStr);


const BLANK_SCHEDULE: Omit<LifeMinistrySchedule, 'id' | keyof BaseRecord> = {
    week: initialWeekData.weekString,
    date: initialWeekData.startDateISO,
    initialSong: '',
    president: '',
    initialPrayer: '',
    treasuresTheme: { theme: '', speaker: '' },
    spiritualGems: { speaker: '' },
    bibleReading: { student: '' },
    studentParts: Array.from({ length: 4 }, () => ({ id: crypto.randomUUID(), theme: '', time: 0, student: '', helper: '' })),
    intermediateSong: '',
    christianLifeParts: Array.from({ length: 3 }, () => ({ id: crypto.randomUUID(), theme: '', time: 0, speaker: '' })),
    congregationBibleStudy: { conductor: '', reader: '' },
    finalSong: '',
    finalPrayer: ''
};

// Helper components moved outside the main component to prevent re-creation on re-renders
const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-white">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const FormRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
);

const FormField: React.FC<{ name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean, type?: string, placeholder?: string }> = 
({ name, label, value, onChange, required, type = 'text', placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="input-style" />
    </div>
);


const LifeMinistryFormModal: React.FC<LifeMinistryFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<Omit<LifeMinistrySchedule, 'id' | keyof BaseRecord>>(BLANK_SCHEDULE);
    const [datePickerValue, setDatePickerValue] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (initialData) {
            // Ensure studentParts has 4 items and christianLifeParts has 3 for consistency
            const studentParts = [...initialData.studentParts];
            while (studentParts.length < 4) studentParts.push({ id: crypto.randomUUID(), theme: '', time: 0, student: '', helper: '' });
            
            const christianLifeParts = [...initialData.christianLifeParts];
            while (christianLifeParts.length < 3) christianLifeParts.push({ id: crypto.randomUUID(), theme: '', time: 0, speaker: '' });
            
            // Populate form state field by field to avoid including metadata
            setFormData({
                week: initialData.week,
                date: initialData.date,
                initialSong: initialData.initialSong,
                president: initialData.president,
                initialPrayer: initialData.initialPrayer,
                treasuresTheme: initialData.treasuresTheme,
                spiritualGems: initialData.spiritualGems,
                bibleReading: initialData.bibleReading,
                studentParts: studentParts,
                intermediateSong: initialData.intermediateSong,
                christianLifeParts: christianLifeParts,
                congregationBibleStudy: initialData.congregationBibleStudy,
                finalSong: initialData.finalSong,
                finalPrayer: initialData.finalPrayer,
            });
            setDatePickerValue(new Date(initialData.date).toISOString().split('T')[0]);
        } else {
             // When creating a new schedule, ensure it's for the current day
            const todayStr = new Date().toISOString().split('T')[0];
            const currentWeekData = calculateWeekRange(todayStr);
            // Reset the form to blank state for the current week
            setFormData({
                ...BLANK_SCHEDULE,
                date: currentWeekData.startDateISO,
                week: currentWeekData.weekString,
            });
            setDatePickerValue(todayStr);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDateStr = e.target.value; // "YYYY-MM-DD"
        if (!selectedDateStr) return;
        
        setDatePickerValue(selectedDateStr);

        const { weekString, startDateISO } = calculateWeekRange(selectedDateStr);
        
        setFormData(prev => ({
            ...prev,
            date: startDateISO,
            week: weekString
        }));
    };

    const handleNestedChange = (section: 'congregationBibleStudy' | 'treasuresTheme' | 'spiritualGems' | 'bibleReading', e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [section]: { ...prev[section], [name]: value } }));
    };

    const handlePartChange = (type: 'studentParts' | 'christianLifeParts', index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const parts = [...formData[type]];
        const partToUpdate = { ...parts[index], [name]: name === 'time' ? parseInt(value) || 0 : value };
        parts[index] = partToUpdate as any;
        setFormData(prev => ({ ...prev, [type]: parts }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // The formData is already clean because it's populated field by field,
        // so we can pass it directly to onSave.
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {initialData ? 'Editar Programação' : 'Nova Programação'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <Section title="Cabeçalho">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Selecione uma data na semana desejada</label>
                            <input 
                                type="date"
                                name="date-selector"
                                value={datePickerValue} 
                                onChange={handleDateChange} 
                                required 
                                className="input-style" 
                            />
                            <p className="text-md font-semibold text-slate-800 dark:text-slate-200 mt-2 text-center bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md">
                                {formData.week}
                            </p>
                        </div>
                        <FormRow>
                             <FormField name="initialSong" label="Cântico Inicial (Nº)" value={formData.initialSong} onChange={handleInputChange} required />
                             <FormField name="president" label="Presidente" value={formData.president} onChange={handleInputChange} required />
                        </FormRow>
                        <FormField name="initialPrayer" label="Oração Inicial" value={formData.initialPrayer} onChange={handleInputChange} required />
                    </Section>

                    <Section title="Tesouros da Palavra de Deus">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tema Principal (10 min)</label>
                            <FormRow>
                                <input name="theme" value={formData.treasuresTheme.theme} onChange={e => handleNestedChange('treasuresTheme', e)} placeholder="Tema" required className="input-style"/>
                                <input name="speaker" value={formData.treasuresTheme.speaker} onChange={e => handleNestedChange('treasuresTheme', e)} placeholder="Orador" required className="input-style"/>
                            </FormRow>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Joias Espirituais (10 min)</label>
                            <input name="speaker" value={formData.spiritualGems.speaker} onChange={e => handleNestedChange('spiritualGems', e)} placeholder="Orador" required className="input-style"/>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leitura da Bíblia (4 min)</label>
                            <input name="student" value={formData.bibleReading.student} onChange={e => handleNestedChange('bibleReading', e)} placeholder="Leitor" required className="input-style"/>
                         </div>
                    </Section>
                    
                    <Section title="Faça Seu Melhor no Ministério">
                        {formData.studentParts.map((part, index) => (
                            <div key={part.id} className="p-3 border-t border-slate-200 dark:border-slate-700 first:border-t-0 first:pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    {/* Left side: Theme and Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Parte {index + 1} (Tema e Duração)</label>
                                        <div className="flex items-center gap-2">
                                            <input name="theme" value={part.theme} onChange={e => handlePartChange('studentParts', index, e)} placeholder="Tema da parte" className="input-style flex-grow" />
                                            <input name="time" type="number" value={part.time || ''} onChange={e => handlePartChange('studentParts', index, e)} placeholder="Min" className="input-style w-20" />
                                        </div>
                                    </div>
                                    {/* Right side: Student and Helper */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Designados</label>
                                        <div className="flex items-center gap-2">
                                            <input name="student" value={part.student} onChange={e => handlePartChange('studentParts', index, e)} placeholder="Estudante" className="input-style flex-grow" />
                                            <input name="helper" value={part.helper || ''} onChange={e => handlePartChange('studentParts', index, e)} placeholder="Ajudante" className="input-style flex-grow" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Section>

                    <Section title="Nossa Vida Cristã">
                        <FormField name="intermediateSong" label="Cântico Intermediário (Nº)" value={formData.intermediateSong} onChange={handleInputChange} required />
                        {formData.christianLifeParts.map((part, index) => (
                            <div key={part.id} className="p-3 border-t border-slate-200 dark:border-slate-700">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tema {index + 1}</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                                    <input name="theme" value={part.theme} onChange={e => handlePartChange('christianLifeParts', index, e)} placeholder="Tema" className="input-style md:col-span-2" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input name="time" type="number" value={part.time || ''} onChange={e => handlePartChange('christianLifeParts', index, e)} placeholder="Tempo" className="input-style" />
                                        <input name="speaker" value={part.speaker} onChange={e => handlePartChange('christianLifeParts', index, e)} placeholder="Orador" className="input-style" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Section>

                    <Section title="Estudo Bíblico de Congregação">
                         <FormRow>
                             <FormField name="conductor" label="Dirigente" value={formData.congregationBibleStudy.conductor} onChange={e => handleNestedChange('congregationBibleStudy', e)} required />
                             <FormField name="reader" label="Leitor" value={formData.congregationBibleStudy.reader} onChange={e => handleNestedChange('congregationBibleStudy', e)} required />
                        </FormRow>
                        <FormRow>
                            <FormField name="finalSong" label="Cântico Final (Nº)" value={formData.finalSong} onChange={handleInputChange} required />
                            <FormField name="finalPrayer" label="Oração Final" value={formData.finalPrayer} onChange={handleInputChange} required />
                        </FormRow>
                    </Section>

                    <div className="flex justify-end pt-4 pb-8">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 mr-3">
                            Cancelar
                        </button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-dark">
                            Salvar Programação
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LifeMinistryFormModal;