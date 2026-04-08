
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAttendanceRecords } from '../services/firestoreService';
import { AttendanceRecord } from '../types';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';
import { 
    Calendar, 
    ChevronDown, 
    TrendingUp, 
    TrendingDown, 
    Users, 
    BarChart2, 
    FileText,
    Bell,
    Monitor,
    BookOpen,
    MoreVertical
} from 'lucide-react';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { getLocalDateString } from '../utils/dateUtils';

const AttendanceAnalysis: React.FC = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [periodMonths, setPeriodMonths] = useState(6);
    const [customPeriod, setCustomPeriod] = useState<{ start: string; end: string } | null>(null);
    const [isCustomPeriodOpen, setIsCustomPeriodOpen] = useState(false);
    const [tempCustomPeriod, setTempCustomPeriod] = useState({ start: '', end: '' });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await getAttendanceRecords();
                setRecords(data);
            } catch (error) {
                console.error("Failed to fetch attendance records:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const { filteredRecords, previousRecords } = useMemo(() => {
        if (records.length === 0) return { filteredRecords: [], previousRecords: [] };

        const now = new Date();
        let startDate: Date;
        let endDate: Date = new Date();
        let prevStartDate: Date;
        let prevEndDate: Date;

        if (customPeriod) {
            const [sYear, sMonth] = customPeriod.start.split('-').map(Number);
            const [eYear, eMonth] = customPeriod.end.split('-').map(Number);
            startDate = new Date(Date.UTC(sYear, sMonth - 1, 1));
            endDate = new Date(Date.UTC(eYear, eMonth, 0));
            
            const diffMonths = (eYear - sYear) * 12 + (eMonth - sMonth) + 1;
            prevEndDate = new Date(startDate);
            prevEndDate.setUTCDate(0);
            prevStartDate = new Date(prevEndDate);
            prevStartDate.setUTCMonth(prevEndDate.getUTCMonth() - diffMonths + 1);
            prevStartDate.setUTCDate(1);
        } else {
            startDate = new Date();
            startDate.setUTCMonth(now.getUTCMonth() - periodMonths + 1);
            startDate.setUTCDate(1);
            
            prevEndDate = new Date(startDate);
            prevEndDate.setUTCDate(0);
            prevStartDate = new Date(prevEndDate);
            prevStartDate.setUTCMonth(prevEndDate.getUTCMonth() - periodMonths + 1);
            prevStartDate.setUTCDate(1);
        }

        const current = records.filter(r => {
            const d = new Date(r.date);
            return d >= startDate && d <= endDate;
        });

        const previous = records.filter(r => {
            const d = new Date(r.date);
            return d >= prevStartDate && d <= prevEndDate;
        });

        return { filteredRecords: current, previousRecords: previous };
    }, [records, periodMonths, customPeriod]);

    const stats = useMemo(() => {
        if (filteredRecords.length === 0) return null;

        const totalAttendance = filteredRecords.reduce((sum, r) => sum + r.totalCount, 0);
        const averageAttendance = totalAttendance / filteredRecords.length;
        const peakAttendance = Math.max(...filteredRecords.map(r => r.totalCount));
        
        const prevTotalAttendance = previousRecords.reduce((sum, r) => sum + r.totalCount, 0);
        const prevAverageAttendance = previousRecords.length > 0 ? prevTotalAttendance / previousRecords.length : 0;

        const percentChange = prevAverageAttendance > 0 
            ? ((averageAttendance - prevAverageAttendance) / prevAverageAttendance * 100).toFixed(1)
            : '0';

        // Find peak record for context
        const peakRecord = filteredRecords.find(r => r.totalCount === peakAttendance);
        const peakMonth = peakRecord ? new Date(peakRecord.date).toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' }) : '';

        // Last record
        const sortedByDate = [...filteredRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastRecord = sortedByDate[0];

        // Weekend vs Midweek
        const weekendRecords = filteredRecords.filter(r => {
            const day = new Date(r.date).getUTCDay();
            return day === 0 || day === 6; // Sunday or Saturday
        });
        const midweekRecords = filteredRecords.filter(r => {
            const day = new Date(r.date).getUTCDay();
            return day >= 1 && day <= 5;
        });

        // Latest Weekend and Midweek records
        const latestWeekend = records
            .filter(r => {
                const day = new Date(r.date).getUTCDay();
                return day === 0 || day === 6;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        const latestMidweek = records
            .filter(r => {
                const day = new Date(r.date).getUTCDay();
                return day >= 1 && day <= 5;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        // Monthly data for chart
        const monthlyMap: { [key: string]: { total: number; count: number; label: string; timestamp: number } } = {};
        filteredRecords.forEach(r => {
            const d = new Date(r.date);
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
            if (!monthlyMap[key]) {
                monthlyMap[key] = { 
                    total: 0, 
                    count: 0, 
                    label: d.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }),
                    timestamp: d.getTime()
                };
            }
            monthlyMap[key].total += r.totalCount;
            monthlyMap[key].count++;
        });

        const chartData = Object.values(monthlyMap)
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(m => ({
                name: m.label.charAt(0).toUpperCase() + m.label.slice(1).replace('.', ''),
                value: Math.round(m.total / m.count)
            }));

        return {
            totalAttendance,
            averageAttendance: Math.round(averageAttendance),
            peakAttendance,
            peakMonth,
            latestWeekend,
            latestMidweek,
            chartData,
            percentChange,
            prevAverageAttendance: Math.round(prevAverageAttendance),
            lastRecord
        };
    }, [filteredRecords, previousRecords]);

    const periodLabel = useMemo(() => {
        if (filteredRecords.length === 0) return 'Nenhum dado';
        const sorted = [...filteredRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const start = new Date(sorted[0].date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' });
        const end = new Date(sorted[sorted.length - 1].date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' });
        return `${start} — ${end}`;
    }, [filteredRecords]);

    const handleExportPDF = async () => {
        const element = document.getElementById('analysis-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#F8FAFC' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Analise_Assistencia_${getLocalDateString()}.pdf`);
        } catch (error) {
            console.error("PDF generation error:", error);
        }
    };

    const applyCustomPeriod = () => {
        if (tempCustomPeriod.start && tempCustomPeriod.end) {
            setCustomPeriod(tempCustomPeriod);
            setIsCustomPeriodOpen(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                        <BarChart2 className="text-white w-6 h-6" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Análise de Assistência</h1>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                    <Bell className="w-6 h-6" />
                </button>
            </div>

            <div id="analysis-content" className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Period Selector */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Período do Relatório</span>
                        <button 
                            onClick={() => setIsCustomPeriodOpen(!isCustomPeriodOpen)}
                            className="flex items-center gap-2 text-slate-500 font-medium text-sm hover:text-primary transition-colors"
                        >
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{periodLabel}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isCustomPeriodOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {isCustomPeriodOpen && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-white p-4 rounded-2xl shadow-inner border border-slate-100 space-y-4"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Início</label>
                                    <input 
                                        type="month" 
                                        value={tempCustomPeriod.start} 
                                        onChange={e => setTempCustomPeriod(p => ({ ...p, start: e.target.value }))}
                                        className="w-full bg-slate-50 border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Fim</label>
                                    <input 
                                        type="month" 
                                        value={tempCustomPeriod.end} 
                                        onChange={e => setTempCustomPeriod(p => ({ ...p, end: e.target.value }))}
                                        className="w-full bg-slate-50 border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={applyCustomPeriod}
                                className="w-full bg-primary text-white py-2 rounded-lg font-bold text-sm"
                            >
                                Aplicar Período Personalizado
                            </button>
                        </motion.div>
                    )}

                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setPeriodMonths(6); setCustomPeriod(null); }}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${periodMonths === 6 && !customPeriod ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            Últimos 6 Meses
                        </button>
                        <button 
                            onClick={() => { setPeriodMonths(12); setCustomPeriod(null); }}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${periodMonths === 12 && !customPeriod ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            Últimos 12 Meses
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : !stats ? (
                    <div className="text-center py-20 text-slate-400">
                        Nenhum dado encontrado para este período.
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Total Attendance */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Total<br/>Assistência</span>
                                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-500 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                        <TrendingUp className="w-3 h-3" />
                                        {stats.percentChange}%
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-slate-800 mb-1">
                                    {stats.totalAttendance.toLocaleString('pt-BR')}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">Acumulado no período</div>
                            </motion.div>

                            {/* Average per Meeting */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                            >
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Média por<br/>Reunião</div>
                                <div className="flex items-baseline gap-1 mb-1">
                                    <span className="text-3xl font-bold text-slate-800">{stats.averageAttendance}</span>
                                    <span className="text-xs text-slate-400 font-medium">/ ant. {stats.prevAverageAttendance}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                    <span className={parseFloat(stats.percentChange) >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                        {parseFloat(stats.percentChange) >= 0 ? '+' : ''}{stats.percentChange}%
                                    </span> vs período anterior
                                </div>
                            </motion.div>

                            {/* Peak Attendance */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                            >
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Pico de<br/>Assistência</div>
                                <div className="text-3xl font-bold text-slate-800 mb-1">{stats.peakAttendance}</div>
                                <div className="text-[10px] text-slate-400 font-medium italic">Recorde em {stats.peakMonth}</div>
                            </motion.div>

                            {/* Last Record */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                            >
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Última<br/>Reunião</div>
                                <div className="text-3xl font-bold text-slate-800 mb-1">
                                    {stats.lastRecord?.totalCount || 0}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium italic truncate">
                                    {stats.lastRecord ? new Date(stats.lastRecord.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }) : 'Sem dados'}
                                </div>
                            </motion.div>
                        </div>

                        {/* Monthly Evolution Chart */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-bold text-slate-800">Evolução de Presença Mensal</h3>
                                <button className="text-slate-300"><MoreVertical className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: '#F8FAFC' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                                            {stats.chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === stats.chartData.length - 2 ? '#334155' : '#CBD5E1'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Performance by Meeting */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Desempenho por Reunião</h3>
                            
                            {/* Weekend */}
                            <div className="bg-[#EFF6FF] p-4 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#DBEAFE] rounded-xl flex items-center justify-center text-[#2563EB]">
                                        <Monitor className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">Fim de Semana</div>
                                        <div className="text-xs text-slate-500">
                                            {stats.latestWeekend 
                                                ? new Date(stats.latestWeekend.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }) 
                                                : 'Discurso e Sentinela'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-slate-800">{stats.latestWeekend?.totalCount || 0}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Última Reunião</div>
                                </div>
                            </div>

                            {/* Midweek */}
                            <div className="bg-[#F8FAFC] p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">Meio de Semana</div>
                                        <div className="text-xs text-slate-500">
                                            {stats.latestMidweek 
                                                ? new Date(stats.latestMidweek.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }) 
                                                : 'Vida e Ministério'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-slate-800">{stats.latestMidweek?.totalCount || 0}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Última Reunião</div>
                                </div>
                            </div>
                        </div>

                        {/* PDF Button */}
                        <button 
                            onClick={handleExportPDF}
                            className="w-full bg-[#334155] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-slate-200 transition-transform active:scale-95"
                        >
                            <FileText className="w-5 h-5" />
                            Gerar Relatório PDF
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AttendanceAnalysis;
