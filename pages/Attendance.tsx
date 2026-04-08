
import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole, AttendanceRecord, BaseRecord } from '../types';
import { addAttendanceRecord } from '../services/firestoreService';
import Toast from '../components/Toast';
import { CalendarDaysIcon, UsersSolidIcon } from '../components/icons/Icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

import { getLocalDateString } from '../utils/dateUtils';

const Attendance: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [toastMessage, setToastMessage] = useState('');

    const [date, setDate] = useState(getLocalDateString());
    const [submitterName, setSubmitterName] = useState('');
    const [presentCount, setPresentCount] = useState<number | ''>('');
    const [onlineCount, setOnlineCount] = useState<number | ''>('');

    const totalCount = useMemo(() => {
        return (Number(presentCount) || 0) + (Number(onlineCount) || 0);
    }, [presentCount, onlineCount]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submitterName || !date || (presentCount === '' && onlineCount === '')) return;

        if (!user) {
            setToastMessage('Erro: Sessão de usuário inválida. Por favor, faça login novamente.');
            return;
        }

        const newRecordData: Omit<AttendanceRecord, 'id' | keyof BaseRecord> = {
            date: new Date(date).toISOString(),
            submitterName,
            presentCount: Number(presentCount) || 0,
            onlineCount: Number(onlineCount) || 0,
            totalCount: totalCount,
        };

        try {
            await addAttendanceRecord(newRecordData, user.uid);
            setToastMessage('Registro de assistência salvo com sucesso!');
            
            // Reset form
            setDate(getLocalDateString());
            setSubmitterName('');
            setPresentCount('');
            setOnlineCount('');

            // "Close" the page by navigating back to the dashboard after a short delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (error) {
            console.error("Failed to save attendance:", error);
            setToastMessage('Erro ao salvar registro.');
        }
    };
    
    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 font-sans pb-12">
            <main className="px-6 space-y-8 max-w-2xl mx-auto pt-8">
                {/* Page Title Section */}
                <motion.section 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-1 font-sans">SECRETARIA</p>
                    <div className="relative inline-block">
                        <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight font-outfit">
                            Assistência
                        </h2>
                        <div className="h-1.5 w-20 bg-emerald-500 mt-3 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                    </div>
                    <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm font-sans">
                        Informe o número de presentes e online na reunião.
                    </p>
                </motion.section>

                {/* Form Card */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-[40px] p-8 sm:p-10 shadow-xl shadow-emerald-100/50 dark:shadow-none border border-emerald-50 dark:border-slate-800 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute top-8 right-8 h-12 w-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                        <UsersSolidIcon className="h-6 w-6" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Data da Reunião</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={date} 
                                        onChange={e => setDate(e.target.value)} 
                                        required 
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans pr-12" 
                                    />
                                    <CalendarDaysIcon className="h-5 w-5 text-emerald-500 absolute top-1/2 right-4 -translate-y-1/2" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Seu Nome</label>
                                <input 
                                    type="text" 
                                    value={submitterName} 
                                    onChange={e => setSubmitterName(e.target.value)} 
                                    required 
                                    placeholder="Ex: João Silva"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Presentes (Local)</label>
                                <input 
                                    type="number" 
                                    value={presentCount} 
                                    onChange={e => setPresentCount(e.target.value === '' ? '' : parseInt(e.target.value))} 
                                    required 
                                    min="0" 
                                    placeholder="0"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans ml-1">Conectados (Online)</label>
                                <input 
                                    type="number" 
                                    value={onlineCount} 
                                    onChange={e => setOnlineCount(e.target.value === '' ? '' : parseInt(e.target.value))} 
                                    required 
                                    min="0" 
                                    placeholder="0"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans" 
                                />
                            </div>
                        </div>

                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl p-8 border border-emerald-100/50 dark:border-emerald-800/30 text-center">
                            <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-600/70 dark:text-emerald-400 uppercase mb-2 font-sans">TOTAL DA ASSISTÊNCIA</p>
                            <p className="text-5xl font-black text-slate-800 dark:text-white font-outfit tracking-tight">{totalCount}</p>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                className="w-full py-5 px-6 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] font-sans text-lg"
                            >
                                Salvar Registro
                            </button>
                        </div>
                    </form>
                </motion.section>
            </main>
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </div>
    );
};

export default Attendance;
