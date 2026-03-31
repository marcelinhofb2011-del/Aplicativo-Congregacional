import React, { useState, useEffect } from 'react';
import { LifeMinistrySchedule, StudentPart, ChristianLifePart, BaseRecord, PublisherProfile } from '../types';
import { XIcon } from './icons/Icons';
import PublisherAutocomplete from './PublisherAutocomplete';
import { getPublisherProfiles } from '../services/firestoreService';

interface LifeMinistryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (schedule: Omit<LifeMinistrySchedule, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => void;
    initialData: LifeMinistrySchedule | null;
}

const calculateWeekRange = (dateString: string) => {
    const selectedDate = new Date(`${dateString}T00:00:00Z`);
    const dayOfWeek = selectedDate.getUTCDay();
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
    return { weekString, startDateISO: monday.toISOString() };
};

const initialDateStr = new Date().toISOString().split('T')[0];
const initialWeekData = calculateWeekRange(initialDateStr);

const BLANK_SCHEDULE: Omit<LifeMinistrySchedule, 'id' | keyof BaseRecord> = {
    week: initialWeekData.weekString,
    date: initialWeekData.startDateISO,
    initialSong: '',
    president: '',
    presidentUid: '',
    initialPrayer: '',
    initialPrayerUid: '',
    treasuresTheme: { theme: '', speaker: '', speakerUid: '' },
    spiritualGems: { speaker: '', speakerUid: '' },
    bibleReading: { student: '', studentUid: '' },
    studentParts: Array.from({ length: 4 }, () => ({ id: crypto.randomUUID(), theme: '', time: 0, student: '', studentUid: '', helper: '', helperUid: '' })),
    intermediateSong: '',
    christianLifeParts: Array.from({ length: 3 }, () => ({ id: crypto.randomUUID(), theme: '', time: 0, speaker: '', speakerUid: '' })),
    congregationBibleStudy: { conductor: '', conductorUid: '', reader: '', readerUid: '' },
    finalSong: '',
    finalPrayer: '',
    finalPrayerUid: '',
    assignedUids: []
};

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
    const [publishers, setPublishers] = useState<PublisherProfile[]>([]);

    useEffect(() => {
        const fetchPublishers = async () => {
            const data = await getPublisherProfiles();
            setPublishers(data);
        };
        fetchPublishers();
    }, []);

    useEffect(() => {
        if (initialData) {
            const studentParts = [...initialData.studentParts];
            while (studentParts.length < 4) studentParts.push({ id: crypto.randomUUID(), theme: '', time: 0, student: '', studentUid: '', helper: '', helperUid: '' });
            const christianLifeParts = [...initialData.christianLifeParts];
            while (christianLifeParts.length < 3) christianLifeParts.push({ id: crypto.randomUUID(), theme: '', time: 0, speaker: '', speakerUid: '' });
            
            setFormData({
                week: initialData.week,
                date: initialData.date,
                initialSong: initialData.initialSong,
                president: initialData.president,
                presidentUid: initialData.presidentUid || '',
                initialPrayer: initialData.initialPrayer,
                initialPrayerUid: initialData.initialPrayerUid || '',
                treasuresTheme: { ...initialData.treasuresTheme, speakerUid: initialData.treasuresTheme.speakerUid || '' },
                spiritualGems: { ...initialData.spiritualGems, speakerUid: initialData.spiritualGems.speakerUid || '' },
                bibleReading: { ...initialData.bibleReading, studentUid: initialData.bibleReading.studentUid || '' },
                studentParts: studentParts,
                intermediateSong: initialData.intermediateSong,
                christianLifeParts: christianLifeParts,
                congregationBibleStudy: { ...initialData.congregationBibleStudy, conductorUid: initialData.congregationBibleStudy.conductorUid || '', readerUid: initialData.congregationBibleStudy.readerUid || '' },
                finalSong: initialData.finalSong,
                finalPrayer: initialData.finalPrayer,
                finalPrayerUid: initialData.finalPrayerUid || '',
                assignedUids: initialData.assignedUids || []
            });
            setDatePickerValue(new Date(initialData.date).toISOString().split('T')[0]);
        } else {
            const todayStr = new Date().toISOString().split('T')[0];
            const currentWeekData = calculateWeekRange(todayStr);
            setFormData({ ...BLANK_SCHEDULE, date: currentWeekData.startDateISO, week: currentWeekData.weekString });
            setDatePickerValue(todayStr);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePublisherSelect = (publisher: PublisherProfile | null, section?: string, index?: number, subField?: string) => {
        const name = publisher?.name || '';
        const uid = publisher?.uid || '';

        setFormData(prev => {
            const next = { ...prev };
            if (section === 'studentParts' && index !== undefined && subField) {
                const parts = [...next.studentParts];
                parts[index] = { ...parts[index], [subField]: name, [`${subField}Uid`]: uid };
                return { ...next, studentParts: parts };
            } else if (section === 'christianLifeParts' && index !== undefined) {
                const parts = [...next.christianLifeParts];
                parts[index] = { ...parts[index], speaker: name, speakerUid: uid };
                return { ...next, christianLifeParts: parts };
            } else if (section && subField) {
                const sec = next[section as keyof typeof next] as any;
                return { ...next, [section]: { ...sec, [subField]: name, [`${subField}Uid`]: uid } };
            } else if (subField) {
                return { ...next, [subField]: name, [`${subField}Uid`]: uid };
            }
            return next;
        });
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDateStr = e.target.value;
        if (!selectedDateStr) return;
        setDatePickerValue(selectedDateStr);
        const { weekString, startDateISO } = calculateWeekRange(selectedDateStr);
        setFormData(prev => ({ ...prev, date: startDateISO, week: weekString }));
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
        
        const uidsSet = new Set<string>();
        if (formData.presidentUid) uidsSet.add(formData.presidentUid);
        if (formData.initialPrayerUid) uidsSet.add(formData.initialPrayerUid);
        if (formData.treasuresTheme.speakerUid) uidsSet.add(formData.treasuresTheme.speakerUid);
        if (formData.spiritualGems.speakerUid) uidsSet.add(formData.spiritualGems.speakerUid);
        if (formData.bibleReading.studentUid) uidsSet.add(formData.bibleReading.studentUid);
        formData.studentParts.forEach(p => {
            if (p.studentUid) uidsSet.add(p.studentUid);
            if (p.helperUid) uidsSet.add(p.helperUid);
        });
        formData.christianLifeParts.forEach(p => {
            if (p.speakerUid) uidsSet.add(p.speakerUid);
        });
        if (formData.congregationBibleStudy.conductorUid) uidsSet.add(formData.congregationBibleStudy.conductorUid);
        if (formData.congregationBibleStudy.readerUid) uidsSet.add(formData.congregationBibleStudy.readerUid);
        if (formData.finalPrayerUid) uidsSet.add(formData.finalPrayerUid);

        onSave({ ...formData, assignedUids: Array.from(uidsSet) });
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
                            <input type="date" name="date-selector" value={datePickerValue} onChange={handleDateChange} required className="input-style" />
                            <p className="text-md font-semibold text-slate-800 dark:text-slate-200 mt-2 text-center bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md">{formData.week}</p>
                        </div>
                        <FormRow>
                             <FormField name="initialSong" label="Cântico Inicial (Nº)" value={formData.initialSong} onChange={handleInputChange} required />
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Presidente</label>
                                <PublisherAutocomplete 
                                    publishers={publishers}
                                    selectedPublisher={publishers.find(p => p.uid === formData.presidentUid) || null}
                                    onSelect={(pub) => handlePublisherSelect(pub, undefined, undefined, 'president')}
                                    placeholder="Presidente"
                                />
                             </div>
                        </FormRow>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Oração Inicial</label>
                            <PublisherAutocomplete 
                                publishers={publishers}
                                selectedPublisher={publishers.find(p => p.uid === formData.initialPrayerUid) || null}
                                onSelect={(pub) => handlePublisherSelect(pub, undefined, undefined, 'initialPrayer')}
                                placeholder="Oração Inicial"
                            />
                        </div>
                    </Section>

                    <Section title="Tesouros da Palavra de Deus">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tema Principal (10 min)</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input name="theme" value={formData.treasuresTheme.theme} onChange={e => handleNestedChange('treasuresTheme', e)} placeholder="Tema" required className="input-style"/>
                                <PublisherAutocomplete 
                                    publishers={publishers}
                                    selectedPublisher={publishers.find(p => p.uid === formData.treasuresTheme.speakerUid) || null}
                                    onSelect={(pub) => handlePublisherSelect(pub, 'treasuresTheme', undefined, 'speaker')}
                                    placeholder="Orador"
                                />
                            </div>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Joias Espirituais (10 min)</label>
                            <PublisherAutocomplete 
                                publishers={publishers}
                                selectedPublisher={publishers.find(p => p.uid === formData.spiritualGems.speakerUid) || null}
                                onSelect={(pub) => handlePublisherSelect(pub, 'spiritualGems', undefined, 'speaker')}
                                placeholder="Orador"
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leitura da Bíblia (4 min)</label>
                            <PublisherAutocomplete 
                                publishers={publishers}
                                selectedPublisher={publishers.find(p => p.uid === formData.bibleReading.studentUid) || null}
                                onSelect={(pub) => handlePublisherSelect(pub, 'bibleReading', undefined, 'student')}
                                placeholder="Leitor"
                            />
                         </div>
                    </Section>
                    
                    <Section title="Faça Seu Melhor no Ministério">
                        {formData.studentParts.map((part, index) => (
                            <div key={part.id} className="p-3 border-t border-slate-200 dark:border-slate-700 first:border-t-0 first:pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Parte {index + 1} (Tema e Duração)</label>
                                        <div className="flex items-center gap-2">
                                            <input name="theme" value={part.theme} onChange={e => handlePartChange('studentParts', index, e)} placeholder="Tema da parte" className="input-style flex-grow" />
                                            <input name="time" type="number" value={part.time || ''} onChange={e => handlePartChange('studentParts', index, e)} placeholder="Min" className="input-style w-20" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Designados</label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-grow">
                                                <PublisherAutocomplete 
                                                    publishers={publishers}
                                                    selectedPublisher={publishers.find(p => p.uid === part.studentUid) || null}
                                                    onSelect={(pub) => handlePublisherSelect(pub, 'studentParts', index, 'student')}
                                                    placeholder="Estudante"
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <PublisherAutocomplete 
                                                    publishers={publishers}
                                                    selectedPublisher={publishers.find(p => p.uid === part.helperUid) || null}
                                                    onSelect={(pub) => handlePublisherSelect(pub, 'studentParts', index, 'helper')}
                                                    placeholder="Ajudante"
                                                />
                                            </div>
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
                                        <PublisherAutocomplete 
                                            publishers={publishers}
                                            selectedPublisher={publishers.find(p => p.uid === part.speakerUid) || null}
                                            onSelect={(pub) => handlePublisherSelect(pub, 'christianLifeParts', index)}
                                            placeholder="Orador"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Section>

                    <Section title="Estudo Bíblico de Congregação">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirigente</label>
                                <PublisherAutocomplete 
                                    publishers={publishers}
                                    selectedPublisher={publishers.find(p => p.uid === formData.congregationBibleStudy.conductorUid) || null}
                                    onSelect={(pub) => handlePublisherSelect(pub, 'congregationBibleStudy', undefined, 'conductor')}
                                    placeholder="Dirigente"
                                />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leitor</label>
                                <PublisherAutocomplete 
                                    publishers={publishers}
                                    selectedPublisher={publishers.find(p => p.uid === formData.congregationBibleStudy.readerUid) || null}
                                    onSelect={(pub) => handlePublisherSelect(pub, 'congregationBibleStudy', undefined, 'reader')}
                                    placeholder="Leitor"
                                />
                             </div>
                        </div>
                        <FormRow>
                            <FormField name="finalSong" label="Cântico Final (Nº)" value={formData.finalSong} onChange={handleInputChange} required />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Oração Final</label>
                                <PublisherAutocomplete 
                                    publishers={publishers}
                                    selectedPublisher={publishers.find(p => p.uid === formData.finalPrayerUid) || null}
                                    onSelect={(pub) => handlePublisherSelect(pub, undefined, undefined, 'finalPrayer')}
                                    placeholder="Oração Final"
                                />
                            </div>
                        </FormRow>
                    </Section>

                    <div className="flex justify-end pt-4 pb-8">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 mr-3">Cancelar</button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-dark">Salvar Programação</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LifeMinistryFormModal;
