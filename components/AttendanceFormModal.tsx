import React, { useState, useEffect, useMemo } from 'react';
import { AttendanceRecord, BaseRecord } from '../types';
import { XIcon, CalendarDaysIcon } from './icons/Icons';

interface AttendanceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<AttendanceRecord, 'id' | keyof BaseRecord>) => void;
    initialData: AttendanceRecord | null;
}

const BLANK_RECORD: Omit<AttendanceRecord, 'id' | keyof BaseRecord> = {
    date: new Date().toISOString().split('T')[0],
    submitterName: '',
    presentCount: 0,
    onlineCount: 0,
    totalCount: 0,
};

const AttendanceFormModal: React.FC<AttendanceFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(BLANK_RECORD);

    useEffect(() => {
        if (initialData) {
            setFormData({
                date: new Date(initialData.date).toISOString().split('T')[0],
                submitterName: initialData.submitterName,
                presentCount: initialData.presentCount,
                onlineCount: initialData.onlineCount,
                totalCount: initialData.totalCount,
            });
        } else {
            setFormData(BLANK_RECORD);
        }
    }, [initialData, isOpen]);

    const totalCount = useMemo(() => {
        return (Number(formData.presentCount) || 0) + (Number(formData.onlineCount) || 0);
    }, [formData.presentCount, formData.onlineCount]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            presentCount: Number(formData.presentCount) || 0,
            onlineCount: Number(formData.onlineCount) || 0,
            totalCount: totalCount,
        };
        onSave(dataToSave);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Editar Assistência
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                                <div className="relative">
                                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="input-style pr-10" />
                                    <CalendarDaysIcon className="h-5 w-5 text-slate-400 absolute top-1/2 right-3 -translate-y-1/2" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome (Enviado por)</label>
                                <input type="text" name="submitterName" value={formData.submitterName} onChange={handleInputChange} required className="input-style" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Presentes</label>
                                <input type="number" name="presentCount" value={formData.presentCount} onChange={handleInputChange} required min="0" className="input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Online</label>
                                <input type="number" name="onlineCount" value={formData.onlineCount} onChange={handleInputChange} required min="0" className="input-style" />
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-md text-center">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total da Assistência</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalCount}</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 pb-8">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 mr-3">
                            Cancelar
                        </button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-dark">
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default AttendanceFormModal;