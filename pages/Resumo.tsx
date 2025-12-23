import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAttendanceRecords, getReports } from '../services/firestoreService';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';

const Resumo: React.FC = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
    const [reportData, setReportData] = useState<{ label: string; value: number; color: string }[]>([]);

    useEffect(() => {
        const fetchDataForCharts = async () => {
            setIsLoading(true);
            try {
                const [attendanceRecords, reportRecords] = await Promise.all([
                    getAttendanceRecords(),
                    getReports()
                ]);

                // Process Attendance Data
                const monthlyAttendance: { [key: string]: { total: number; count: number; date: Date } } = {};
                attendanceRecords.forEach(record => {
                    const recordDate = new Date(record.date);
                    // FIX: Use Date.UTC to create a timezone-independent key for grouping by month.
                    const monthKey = new Date(Date.UTC(recordDate.getUTCFullYear(), recordDate.getUTCMonth(), 1)).toISOString();
                    
                    if (!monthlyAttendance[monthKey]) {
                        monthlyAttendance[monthKey] = { total: 0, count: 0, date: new Date(monthKey) };
                    }
                    monthlyAttendance[monthKey].total += record.totalCount;
                    monthlyAttendance[monthKey].count++;
                });

                const sortedMonthKeys = Object.keys(monthlyAttendance).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
                setAttendanceData({
                    labels: sortedMonthKeys.map(key => monthlyAttendance[key].date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })),
                    data: sortedMonthKeys.map(key => monthlyAttendance[key].total / monthlyAttendance[key].count)
                });

                // Process Report Data
                const groupHours: { [key: string]: number } = { '1': 0, '2': 0, '3': 0 };
                reportRecords.forEach(report => {
                    if (report.group && groupHours[report.group] !== undefined) {
                         if (report.privilege === 'PIONEER') {
                             groupHours[report.group] += (report.hours || 0) + ((report.minutes || 0) / 60);
                         } else if (report.hasParticipated) {
                             groupHours[report.group] += 1; // 1 hour per participation
                         }
                    }
                });
                
                setReportData([
                    { label: 'G1', value: groupHours['1'], color: '#3b82f6' },
                    { label: 'G2', value: groupHours['2'], color: '#10b981' },
                    { label: 'G3', value: groupHours['3'], color: '#f97316' },
                ]);

            } catch (error) {
                console.error("Failed to load chart data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.role === 'SERVANT') {
            fetchDataForCharts();
        }
    }, [user]);

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Resumo e Estatísticas</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6">
                     <LineChart 
                        title="Média de Assistência"
                        data={attendanceData.data}
                        labels={attendanceData.labels}
                        isLoading={isLoading}
                    />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6">
                    <BarChart
                        title="Horas por Grupo (Est.)"
                        data={reportData}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default Resumo;