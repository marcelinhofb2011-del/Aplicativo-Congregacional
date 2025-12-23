
import React, { useState, useEffect } from 'react';
import { CleaningSchedule, BaseRecord, MeetingDay } from '../types';
import { XIcon } from './icons/Icons';
import { CLEANING_GROUPS } from '../constants';

interface CleaningFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<CleaningSchedule, 'id' | keyof BaseRecord>) => void;
    initialData: CleaningSchedule | null;
}

const BLANK_SCHEDULE: Omit<CleaningSchedule, 'id' | keyof BaseRecord> = {
    date: new Date().toISOString().split('T')[0], // startDate
    endDate: new Date().toISOString().split('T')[0],
    group: '',
    meetingDays: [],
    notes: ''
};

const MeetingDayButton: React.FC<{ day: MeetingDay, label: string, selectedDays: MeetingDay[], onToggle: (day: MeetingDay) => void }> = ({ day, label, selectedDays, onToggle }) => {
    const isSelected = selectedDays.includes(day);
    return (
        <button
            type="button"
            onClick={() => onToggle(day)}
            className={`px-4 py-2.5 rounded-md text-sm font-medium transition-colors w-full ${
                isSelected 
                ? 'bg-primary text-white shadow' 
                : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
        >
            {label}
        </button>
    );
}

const CleaningFormModal: React.FC<CleaningFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(BLANK_SCHEDULE);

    useEffect(() => {
        if (initialData) {
            setFormData({
                date: new Date(initialData.date).toISOString().split('T')[0],
                endDate: new Date(initialData.endDate).toISOString().split('T')[0],
                group: initialData.group,
                meetingDays: initialData.meetingDays || [],
                notes: initialData.notes || ''
            });
        } else {
            setFormData(BLANK_SCHEDULE);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMeetingDayToggle = (day: MeetingDay) => {
        setFormData(prev => {
            const newMeetingDays = prev.meetingDays.includes(day)
                ? prev.meetingDays.filter(d => d !== day)
                : [...prev.meetingDays, day];
            return { ...prev, meetingDays: newMeetingDays };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.group || !formData.date || !formData.endDate || formData.meetingDays.length === 0) {
            alert('Por favor, preencha todos os campos obrigatórios, incluindo pelo menos um dia de reunião.');
            return;
        }
        if (new Date(formData.endDate) < new Date(formData.date)) {
            alert('A data final não pode ser anterior à data de início.');
            return;
        }
        const dataToSave: Omit<CleaningSchedule, 'id' | keyof BaseRecord> = {
            date: new Date(formData.date).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            group: formData.group,
            meetingDays: formData.meetingDays,
            notes: formData.notes || ''
        };
        onSave(dataToSave);
    };

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {initialData ? 'Editar Escala' : 'Adicionar à Escala'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data Início</label>
                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data Fim</label>
                                <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required className="input-style" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grupo Responsável</label>
                            <select name="group" value={formData.group} onChange={handleInputChange} required className="input-style">
                                <option value="" disabled>Selecione um grupo</option>
                                {Object.entries(CLEANING_GROUPS).map(([groupName, members]) => (
                                    <option key={groupName} value={groupName}>
                                        {groupName}: {members}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dias da Reunião</label>
                            <div className="grid grid-cols-2 gap-2">
                                <MeetingDayButton day="midweek" label="Meio de semana" selectedDays={formData.meetingDays} onToggle={handleMeetingDayToggle} />
                                <MeetingDayButton day="weekend" label="Fim de semana" selectedDays={formData.meetingDays} onToggle={handleMeetingDayToggle} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                            <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={2} className="input-style"></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 pb-8">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 mr-3">
                            Cancelar
                        </button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-dark">
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default CleaningFormModal;
