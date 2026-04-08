import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
    getPioneerRecords, 
    addPioneerRecord, 
    updatePioneerRecord, 
    deletePioneerRecord,
    getPublisherProfileByUid,
    addMonthlyReport,
    setPioneerRecord
} from '../services/firestoreService';
import { PioneerRecord, PioneerActivity, PublisherProfile, UserRole } from '../types';
import { 
    CalendarDaysIcon, 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    ShareIcon, 
    DocumentTextIcon,
    ChevronLeftIcon,
    CheckIcon,
    XMarkIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    UserIcon,
    TrophyIcon,
    DocumentArrowDownIcon,
    ChevronRightIcon as ChevronRightIconSolid,
    DashboardIcon as HomeIcon,
    BookOpenIcon,
    UsersIcon,
    SettingsIcon,
    MegaphoneIcon
} from '../components/icons/Icons';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
    PieChart,
    Pie
} from 'recharts';
import { jsPDF } from 'jspdf';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import { useNavigate, useLocation } from 'react-router-dom';

import { motion, AnimatePresence } from 'motion/react';

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const Pioneer: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [view, setView] = useState<'hub' | 'daily' | 'report' | 'analysis' | 'profile'>('hub');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [selectedYear, setSelectedYear] = useState(() => {
        const now = new Date();
        const month = now.getMonth() + 1;
        return month >= 9 ? now.getFullYear() + 1 : now.getFullYear();
    });
    const [records, setRecords] = useState<PioneerRecord[]>([]);
    const [profile, setProfile] = useState<PublisherProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');
    const [yearType, setYearType] = useState<'service' | 'calendar'>('service');

    const navigateTo = (newView: 'hub' | 'daily' | 'report' | 'analysis' | 'profile') => {
        if (newView === 'hub') navigate('/pioneiro');
        else if (newView === 'daily') navigate('/pioneiro/registro');
        else if (newView === 'report') navigate('/pioneiro/relatorio');
        else if (newView === 'analysis') navigate('/pioneiro/analise');
        else if (newView === 'profile') navigate('/pioneiro/perfil');
    };

    useEffect(() => {
        const path = location.pathname.split('/').filter(Boolean).pop();
        if (path === 'registro') setView('daily');
        else if (path === 'relatorio') setView('report');
        else if (path === 'analise') setView('analysis');
        else if (path === 'perfil') setView('profile');
        else setView('hub');
    }, [location.pathname]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleMonthChange = (newMonth: string) => {
        setSelectedMonth(newMonth);
        const [year, month] = newMonth.split('-').map(Number);
        
        const isPioneer = profile?.isRegularPioneer || profile?.isAuxiliaryPioneer || 
                         currentRecord?.role === 'Pioneiro Regular' || currentRecord?.role === 'Pioneiro Auxiliar';

        if (isPioneer) {
            // JW Service Year: starts in September. 
            // If month is Sep-Dec (9-12), service year is next year.
            // If month is Jan-Aug (1-8), service year is current year.
            const sYear = month >= 9 ? year + 1 : year;
            setSelectedYear(sYear);
        } else {
            // Standard Calendar Year
            setSelectedYear(year);
        }
    };

    const handlePrevMonth = () => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const d = new Date(year, month - 2, 1);
        const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        handleMonthChange(newMonth);
    };

    const handleNextMonth = () => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const d = new Date(year, month, 1);
        const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        handleMonthChange(newMonth);
    };

    const handleSaveGoal = async (data: { role?: 'Publicador' | 'Pioneiro Auxiliar' | 'Pioneiro Regular', goalHours: number, studentCount?: number }) => {
        if (!user) return;
        try {
            const currentRole = data.role || currentRecord?.role || profile?.role || 'Publicador';
            
            const updatedProfile = {
                ...profile,
                role: currentRole as any,
                isRegularPioneer: currentRole === 'Pioneiro Regular',
                isAuxiliaryPioneer: currentRole === 'Pioneiro Auxiliar'
            } as PublisherProfile;
            
            setProfile(updatedProfile);
            
            if (currentRecord) {
                await setPioneerRecord({
                    ...currentRecord,
                    role: currentRole,
                    goalHours: data.goalHours,
                    studentCount: data.studentCount ?? currentRecord.studentCount,
                    isAuxiliaryPioneer: currentRole === 'Pioneiro Auxiliar'
                });
            } else {
                await addPioneerRecord({
                    month: selectedMonth,
                    serviceYear: getServiceYearFromMonth(selectedMonth),
                    activities: [],
                    role: currentRole,
                    goalHours: data.goalHours,
                    studentCount: data.studentCount || 0,
                    isAuxiliaryPioneer: currentRole === 'Pioneiro Auxiliar',
                }, user.uid);
            }
            
            await loadData();
            setToastMessage('Configurações atualizadas!');
        } catch (error) {
            console.error('Error saving goal:', error);
            setToastMessage('Erro ao salvar.');
        }
    };

    // Settings States
    const [reminderEnabled, setReminderEnabled] = useState(true);
    const [autoShareEnabled, setAutoShareEnabled] = useState(false);

    // Daily Log States
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isManualReportModalOpen, setIsManualReportModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<PioneerActivity | null>(null);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

    // Monthly Report States
    const [participated, setParticipated] = useState<boolean | null>(null);
    const [reportHours, setReportHours] = useState<number>(0);
    const [reportStudies, setReportStudies] = useState<number>(0);
    const [reportRevisits, setReportRevisits] = useState<number>(0);
    const [reportNotes, setReportNotes] = useState<string>('');

    // Confirmation States
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
    const [isReportOverwriteConfirmOpen, setIsReportOverwriteConfirmOpen] = useState(false);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    useEffect(() => {
        if (profile) {
            const now = new Date();
            const month = now.getMonth() + 1;
            const isPioneer = profile.isRegularPioneer || profile.isAuxiliaryPioneer;
            
            setYearType(isPioneer ? 'service' : 'calendar');

            if (isPioneer) {
                const sYear = month >= 9 ? now.getFullYear() + 1 : now.getFullYear();
                setSelectedYear(sYear);
            } else {
                setSelectedYear(now.getFullYear());
            }
        }
    }, [profile]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [recordsData, profileData] = await Promise.all([
                getPioneerRecords(),
                getPublisherProfileByUid(user.uid)
            ]);
            setRecords(recordsData);
            setProfile(profileData);
        } catch (error) {
            console.error('Error loading pioneer data:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentRecord = useMemo(() => {
        return records.find(r => r.month === selectedMonth && r.createdBy === user?.uid);
    }, [records, selectedMonth, user]);

    const totalHoursCompleted = useMemo(() => {
        if (!currentRecord) return 0;
        const totalMinutes = currentRecord.activities.reduce((acc, act) => {
            return acc + (act.hours * 60) + act.minutes;
        }, 0);
        return totalMinutes / 60;
    }, [currentRecord]);

    const totalRevisits = useMemo(() => {
        if (!currentRecord) return 0;
        return currentRecord.activities.reduce((acc, act) => acc + (act.revisits || 0), 0);
    }, [currentRecord]);

    const totalStudies = useMemo(() => {
        if (!currentRecord) return 0;
        return currentRecord.activities.reduce((acc, act) => acc + (act.studies || 0), 0);
    }, [currentRecord]);

    useEffect(() => {
        if (currentRecord) {
            setReportHours(totalHoursCompleted);
            setReportStudies(totalStudies || currentRecord.studentCount || 0);
            setReportRevisits(totalRevisits || currentRecord.revisits || 0);
            setReportNotes(currentRecord.notes || '');
        } else {
            setReportHours(0);
            setReportStudies(0);
            setReportRevisits(0);
            setReportNotes('');
        }
    }, [currentRecord, totalHoursCompleted, totalStudies, totalRevisits]);

    const progressStats = useMemo(() => {
        if (!currentRecord || currentRecord.goalHours <= 0) return null;

        const [year, month] = selectedMonth.split('-').map(Number);
        const now = new Date();
        const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
        const isPastMonth = now.getFullYear() > year || (now.getFullYear() === year && (now.getMonth() + 1) > month);
        
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        
        let daysRemaining = 0;
        let currentDay = lastDayOfMonth;

        if (isCurrentMonth) {
            currentDay = now.getDate();
            daysRemaining = (lastDayOfMonth - currentDay) + 1; // Including today
        } else if (isPastMonth) {
            currentDay = lastDayOfMonth;
            daysRemaining = 0;
        } else {
            currentDay = 0;
            daysRemaining = lastDayOfMonth;
        }

        const remainingHours = Math.max(0, currentRecord.goalHours - totalHoursCompleted);
        const dailyAverageNeeded = daysRemaining > 0 ? remainingHours / daysRemaining : 0;

        const formatDuration = (hours: number) => {
            if (hours <= 0) return "0 MIN";
            const h = Math.floor(hours);
            const m = Math.round((hours - h) * 60);
            
            if (h > 0 && m > 0) {
                return `${h}H ${m}MIN`;
            } else if (h > 0) {
                return `${h}H`;
            } else {
                return `${m}MIN`;
            }
        };

        // Status calculation
        const progressPercent = (totalHoursCompleted / currentRecord.goalHours) * 100;
        const timePercent = (currentDay / lastDayOfMonth) * 100;
        
        let status: 'Ruim' | 'Bom' | 'Ótimo' = 'Bom';
        let statusColor = 'text-amber-500';
        let statusBg = 'bg-amber-500/10';

        if (progressPercent >= 100) {
            status = 'Ótimo';
            statusColor = 'text-emerald-500';
            statusBg = 'bg-emerald-500/10';
        } else if (progressPercent >= timePercent + 5) {
            status = 'Ótimo';
            statusColor = 'text-emerald-500';
            statusBg = 'bg-emerald-500/10';
        } else if (progressPercent >= timePercent - 10) {
            status = 'Bom';
            statusColor = 'text-blue-500';
            statusBg = 'bg-blue-500/10';
        } else {
            status = 'Ruim';
            statusColor = 'text-rose-500';
            statusBg = 'bg-rose-500/10';
        }

        return {
            remainingHours,
            dailyAverageNeeded,
            formattedDailyAverage: formatDuration(dailyAverageNeeded),
            formattedRemaining: formatDuration(remainingHours),
            daysRemaining,
            status,
            statusColor,
            statusBg,
            progressPercent,
            timePercent
        };
    }, [currentRecord, totalHoursCompleted, selectedMonth]);

    const getServiceYearFromMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-').map(Number);
        const serviceYearStart = month >= 9 ? year : year - 1;
        return `${serviceYearStart}-${serviceYearStart + 1}`;
    };

    const handleAddOrUpdateActivity = async (activity: PioneerActivity) => {
        if (!user) return;
        try {
            const dateObj = new Date(activity.date + 'T12:00:00');
            const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            
            // Find or create the record for the activity's month
            let targetRecord = records.find(r => r.month === monthStr && r.createdBy === user.uid);
            
            if (!targetRecord) {
                const defaultGoal = profile?.isRegularPioneer ? 50 : (profile?.isAuxiliaryPioneer ? 30 : 0);
                const newRecord: PioneerRecord = {
                    id: `${user.uid}-${monthStr}`,
                    month: monthStr,
                    serviceYear: getServiceYearFromMonth(monthStr),
                    goalHours: defaultGoal,
                    role: profile?.isRegularPioneer ? 'Pioneiro Regular' : (profile?.isAuxiliaryPioneer ? 'Pioneiro Auxiliar' : 'Publicador'),
                    activities: [activity],
                    studentCount: 0,
                    revisits: 0,
                    notes: '',
                    submitted: false,
                    createdAt: new Date().toISOString(),
                    isActive: true,
                    createdBy: user.uid
                };
                await setPioneerRecord(newRecord);
            } else {
                let updatedActivities = [...targetRecord.activities];
                
                if (editingActivity) {
                    const oldDateObj = new Date(editingActivity.date + 'T12:00:00');
                    const oldMonthStr = `${oldDateObj.getFullYear()}-${String(oldDateObj.getMonth() + 1).padStart(2, '0')}`;
                    
                    if (oldMonthStr === monthStr) {
                        updatedActivities = updatedActivities.map(a => a.id === editingActivity.id ? activity : a);
                        await updatePioneerRecord(targetRecord.id, { activities: updatedActivities }, user.uid);
                    } else {
                        // Month changed: remove from old, add to new
                        const oldRecord = records.find(r => r.month === oldMonthStr && r.createdBy === user.uid);
                        if (oldRecord) {
                            const filteredOld = oldRecord.activities.filter(a => a.id !== editingActivity.id);
                            await updatePioneerRecord(oldRecord.id, { activities: filteredOld }, user.uid);
                        }
                        updatedActivities.push(activity);
                        await updatePioneerRecord(targetRecord.id, { activities: updatedActivities }, user.uid);
                    }
                } else {
                    updatedActivities.push(activity);
                    await updatePioneerRecord(targetRecord.id, { activities: updatedActivities }, user.uid);
                }
            }
            
            await loadData();
            setIsActivityModalOpen(false);
            setEditingActivity(null);
            
            if (monthStr !== selectedMonth) {
                setToastMessage(`Registro salvo em ${dateObj.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`);
            } else {
                setToastMessage('Registro salvo!');
            }
        } catch (error) {
            console.error('Error saving activity:', error);
            setToastMessage('Erro ao salvar.');
        }
    };

    const handleDeleteActivity = (activityId: string) => {
        setActivityToDelete(activityId);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteActivity = async () => {
        if (!user || !currentRecord || !activityToDelete) return;
        try {
            const updatedActivities = currentRecord.activities.filter(a => a.id !== activityToDelete);
            await updatePioneerRecord(currentRecord.id, { activities: updatedActivities }, user.uid);
            await loadData();
            setToastMessage('Registro excluído.');
        } catch (error) {
            console.error('Error deleting activity:', error);
            setToastMessage('Erro ao excluir registro.');
        } finally {
            setActivityToDelete(null);
            setIsDeleteConfirmOpen(false);
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const year = selectedYear;
        const userName = profile?.name || user?.displayName || 'Publicador';

        doc.setFontSize(20);
        doc.text('Relatório Anual de Pioneiro', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Publicador: ${userName}`, 20, 40);
        doc.text(`Ano de Serviço: ${year}`, 20, 50);
        doc.text(`Total de Horas no Ano de Serviço: ${annualStats.totalHours.toFixed(1)}h`, 20, 60);
        doc.text(`Meta Anual: ${annualStats.annualGoal}h (${annualStats.progressToGoal.toFixed(1)}%)`, 20, 70);
        doc.text(`Crescimento vs Ano Anterior: ${annualStats.growth >= 0 ? '+' : ''}${annualStats.growth.toFixed(1)}%`, 20, 80);

        doc.line(20, 85, 190, 85);

        doc.setFont('helvetica', 'bold');
        doc.text('Mês', 20, 95);
        doc.text('Horas', 80, 95);
        doc.text('Estudos', 120, 95);
        doc.text('Revisitas', 160, 95);
        doc.setFont('helvetica', 'normal');

        let y = 105;
        annualStats.monthlyData.forEach((m) => {
            const record = records.find(r => r.month === m.monthStr && r.createdBy === user?.uid);
            if (m.hours > 0 || (record && record.submitted)) {
                doc.text(m.fullMonth, 20, y);
                doc.text(`${m.hours.toFixed(1)}h`, 80, y);
                doc.text(`${record?.studentCount || 0}`, 120, y);
                doc.text(`${record?.revisits || 0}`, 160, y);
                y += 10;
                
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            }
        });

        doc.save(`relatorio_pioneiro_${year}_${userName.replace(/\s+/g, '_')}.pdf`);
        setToastMessage('PDF gerado com sucesso!');
    };

    const generateMonthlyPDF = () => {
        const doc = new jsPDF();
        const [year, monthNum] = selectedMonth.split('-').map(Number);
        const monthName = MONTHS[monthNum - 1];
        const userName = profile?.name || user?.displayName || 'Publicador';

        doc.setFontSize(20);
        doc.text(`Relatório de Serviço - ${monthName} / ${year}`, 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Publicador: ${userName}`, 20, 40);
        doc.text(`Modalidade: ${currentRecord?.role || 'Publicador'}`, 20, 50);
        doc.text(`Alvo de Horas: ${currentRecord?.goalHours || 0}h`, 20, 60);
        doc.text(`Total Realizado: ${totalHoursCompleted.toFixed(1)}h`, 20, 70);
        doc.text(`Estudos Bíblicos: ${currentRecord?.studentCount || 0}`, 20, 80);
        doc.text(`Revisitas: ${currentRecord?.revisits || 0}`, 20, 90);

        doc.line(20, 95, 190, 95);

        doc.setFont('helvetica', 'bold');
        doc.text('Data', 20, 105);
        doc.text('Dia', 60, 105);
        doc.text('Horas', 100, 105);
        doc.text('Categoria', 140, 105);
        doc.setFont('helvetica', 'normal');

        let y = 115;
        const sortedActivities = [...(currentRecord?.activities || [])].sort((a, b) => a.date.localeCompare(b.date));
        
        sortedActivities.forEach((act) => {
            const date = new Date(act.date + 'T12:00:00');
            doc.text(act.date, 20, y);
            doc.text(date.toLocaleString('pt-BR', { weekday: 'short' }), 60, y);
            doc.text(`${act.hours}h ${act.minutes}m`, 100, y);
            doc.text(act.category || 'Pregação', 140, y);
            y += 10;
            
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });

        if (currentRecord?.notes) {
            y += 10;
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', 'bold');
            doc.text('Observações:', 20, y);
            doc.setFont('helvetica', 'normal');
            y += 7;
            const splitNotes = doc.splitTextToSize(currentRecord.notes, 170);
            doc.text(splitNotes, 20, y);
        }

        doc.save(`relatorio_${monthName}_${year}_${userName.replace(/\s+/g, '_')}.pdf`);
        setToastMessage('PDF mensal gerado!');
    };

    const handleSubmitMonthlyReport = async () => {
        if (!user) return;
        if (!profile) {
            setToastMessage('Perfil não encontrado. Por favor, complete seu cadastro nas configurações.');
            return;
        }

        const [yearStr, monthNum] = selectedMonth.split('-');
        const monthName = MONTHS[parseInt(monthNum) - 1];

        // Check for duplicate
        const existing = records.find(r => r.month === selectedMonth && r.createdBy === user.uid && r.submitted);
        if (existing) {
            setIsReportOverwriteConfirmOpen(true);
            return;
        }
        
        await processReportSubmission();
    };

    const processReportSubmission = async () => {
        if (!user || !profile) return;

        const [yearStr, monthNum] = selectedMonth.split('-');
        const monthName = MONTHS[parseInt(monthNum) - 1];
        const isPioneer = profile.isRegularPioneer || profile.isAuxiliaryPioneer;
        
        if (!isPioneer && participated === null) {
            setToastMessage('Por favor, informe se participou da congregação.');
            return;
        }

        if (isPioneer && !reportHours) {
            setToastMessage('Campo Horas é obrigatório para pioneiros.');
            return;
        }

        try {
            // 1. Save to Firestore for congregation records
            await addMonthlyReport({
                userId: user.uid,
                userName: profile.name || user.displayName || 'Publicador',
                month: monthName,
                year: parseInt(yearStr),
                hours: reportHours || 0,
                studies: reportStudies || 0,
                revisits: reportRevisits || 0,
                publications: 0,
                hasParticipated: participated ?? true,
                notes: reportNotes || `Relatório gerado via aba Pioneiro.`,
                status: 'Enviado'
            } as any, user.uid);

            // 1.5 Save to PioneerRecord for history
            const pioneerRecord: PioneerRecord = {
                id: currentRecord?.id || `${user.uid}-${selectedMonth}`,
                month: selectedMonth,
                serviceYear: getServiceYearFromMonth(selectedMonth),
                goalHours: currentRecord?.goalHours || 0,
                role: isPioneer ? (profile.isRegularPioneer ? 'Pioneiro Regular' : 'Pioneiro Auxiliar') : 'Publicador',
                activities: currentRecord?.activities || [],
                studentCount: reportStudies || 0,
                revisits: reportRevisits || 0,
                notes: reportNotes || '',
                submitted: true,
                submittedAt: new Date().toISOString(),
                createdAt: currentRecord?.createdAt || new Date().toISOString(),
                isActive: true,
                createdBy: user.uid
            };
            await setPioneerRecord(pioneerRecord);
            
            // 2. Generate share text for WhatsApp
            let shareText = `📋 *Relatório de Serviço de Campo*\n`;
            shareText += `--------------------------------\n`;
            shareText += `*Mês:* ${monthName} / ${yearStr}\n`;
            shareText += `*Publicador:* ${profile.name || user.displayName || 'N/A'}\n`;
            
            if (isPioneer) {
                shareText += `*Privilégio:* ${profile.isRegularPioneer ? 'Pioneiro Regular' : 'Pioneiro Auxiliar'}\n`;
                shareText += `*Horas:* ${reportHours}h\n`;
            } else {
                shareText += `*Participou:* ${participated ? 'Sim' : 'Não'}\n`;
                if (reportHours > 0) shareText += `*Horas:* ${reportHours}h\n`;
            }
            
            if (reportStudies > 0) {
                shareText += `*Estudos Bíblicos:* ${reportStudies}\n`;
            }

            if (reportRevisits > 0) {
                shareText += `*Revisitas:* ${reportRevisits}\n`;
            }

            if (reportNotes) {
                shareText += `*Observações:* ${reportNotes}\n`;
            }
            
            shareText += `--------------------------------\n`;
            shareText += `Gerado pelo App de Gestão`;

            setToastMessage('Relatório salvo com sucesso!');

            // 3. Trigger Share Dialog
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `Relatório - ${monthName}/${yearStr}`,
                        text: shareText
                    });
                } catch (err: any) {
                    if (err.name !== 'AbortError') {
                        console.error('Error sharing monthly report:', err);
                    }
                }
            } else {
                await navigator.clipboard.writeText(shareText);
                setToastMessage('Relatório salvo e copiado! Agora você pode colar no WhatsApp.');
            }
            
            navigateTo('hub');
        } catch (error) {
            console.error('Error submitting monthly report:', error);
            setToastMessage('Erro ao enviar relatório.');
        }
    };

    const handleShare = async () => {
        if (!currentRecord) return;

        const [year, month] = selectedMonth.split('-').map(Number);
        const monthName = new Date(year, month - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        let report = `📄 *Relatório de Serviço - ${monthName}*\n`;
        report += `--------------------------------\n`;
        report += `*Participante:* ${profile?.name || user?.displayName || 'N/A'}\n`;
        report += `*Modalidade:* ${currentRecord.role}\n\n`;

        report += `*Resumo de Horas:*\n`;
        report += `- Alvo Mensal: ${currentRecord.goalHours}h\n`;
        report += `- Total Realizado: ${totalHoursCompleted.toFixed(1)}h\n\n`;

        report += `*Detalhes da Atividade:*\n`;
        currentRecord.activities.sort((a, b) => a.date.localeCompare(b.date)).forEach(act => {
            const dateObj = new Date(act.date + 'T12:00:00');
            const day = dateObj.getDate();
            const weekday = dateObj.toLocaleString('pt-BR', { weekday: 'short' });
            report += `${day} (${weekday}): ${act.hours}h ${act.minutes}m - ${act.category || 'Pregação'}`;
            report += `\n`;
        });

        report += `\n--------------------------------\n`;
        report += `Gerado pelo App de Gestão`;

        try {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `Relatório de Serviço - ${monthName}`,
                        text: report,
                    });
                } catch (shareError: any) {
                    // Ignore cancellation errors
                    if (shareError.name !== 'AbortError') {
                        console.error('Error sharing:', shareError);
                    }
                }
            } else {
                await navigator.clipboard.writeText(report);
                setToastMessage('Relatório copiado!');
            }
        } catch (error) {
            console.error('Clipboard error:', error);
        }
    };

    // Analysis Calculations
    const annualStats = useMemo(() => {
        if (!user) return { totalHours: 0, growth: 0, progressToGoal: 0, monthlyData: [], yearlyTotals: [] };

        const isServiceYear = yearType === 'service';

        // Year logic: Service Year (Sep-Aug) or Calendar Year (Jan-Dec)
        const getYearRecords = (year: number) => {
            return records.filter(r => {
                const [rYear, rMonth] = r.month.split('-').map(Number);
                if (isServiceYear) {
                    const isPrevYearPart = (rYear === year - 1 && rMonth >= 9);
                    const isCurrentYearPart = (rYear === year && rMonth <= 8);
                    return (isPrevYearPart || isCurrentYearPart) && r.createdBy === user.uid;
                } else {
                    return rYear === year && r.createdBy === user.uid;
                }
            });
        };

        const yearRecords = getYearRecords(selectedYear);
        const prevYearRecords = getYearRecords(selectedYear - 1);
        
        const calculateTotal = (recs: PioneerRecord[]) => {
            return recs.reduce((acc, r) => {
                const monthlyTotal = r.activities.reduce((a, act) => a + act.hours + (act.minutes / 60), 0);
                return acc + monthlyTotal;
            }, 0);
        };

        const totalHours = calculateTotal(yearRecords);
        const prevTotalHours = calculateTotal(prevYearRecords);

        const growth = prevTotalHours > 0 ? ((totalHours - prevTotalHours) / prevTotalHours) * 100 : 0;

        const activeMonths = yearRecords.filter(r => r.activities.length > 0).length;
        const averageHours = activeMonths > 0 ? totalHours / activeMonths : 0;

        // Yearly Totals
        const currentYear = new Date().getFullYear();
        const years = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
        const yearlyTotals = years.map(year => {
            const yearRecs = getYearRecords(year);
            const total = calculateTotal(yearRecs);
            return { year: String(year), total: Number(total.toFixed(1)) };
        }).filter(y => y.total > 0 || parseInt(y.year) === selectedYear).sort((a, b) => a.year.localeCompare(b.year));

        const averageYearlyHours = yearlyTotals.length > 0 
            ? yearlyTotals.reduce((a, b) => a + b.total, 0) / yearlyTotals.length 
            : 0;

        // Monthly Data ordered by Year type
        const monthsOrder = isServiceYear 
            ? [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8] 
            : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        const monthlyData = monthsOrder.map(monthNum => {
            const year = isServiceYear 
                ? (monthNum >= 9 ? selectedYear - 1 : selectedYear)
                : selectedYear;
            const monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;
            const name = MONTHS[monthNum - 1];
            const record = records.find(r => r.month === monthStr && r.createdBy === user.uid);
            
            let hours = 0;
            if (record) {
                const totalMinutes = record.activities.reduce((acc, act) => {
                    return acc + (act.hours * 60) + act.minutes;
                }, 0);
                hours = totalMinutes / 60;
            }
            
            return { name: name.substring(0, 3), fullMonth: name, hours, monthStr };
        });

        const annualGoal = currentRecord?.role === 'Pioneiro Regular' ? 600 : (currentRecord?.role === 'Pioneiro Auxiliar' ? (currentRecord.goalHours * 12) : 0);
        const progressToGoal = annualGoal > 0 ? (totalHours / annualGoal) * 100 : 0;

        return { 
            monthlyData, 
            totalHours, 
            prevTotalHours,
            growth,
            averageHours, 
            activeMonths, 
            averageYearlyHours,
            annualGoal,
            progressToGoal,
            yearlyTotals,
            isServiceYear
        };
    }, [records, selectedYear, user, profile, currentRecord, yearType]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 font-sans pb-32">
            {/* Sub-navigation Header */}
            <header className="px-6 pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {view !== 'hub' ? (
                        <button 
                            onClick={handleBack}
                            className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm"
                        >
                            <ChevronLeftIcon className="h-6 w-6" />
                        </button>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                            <UserIcon className="h-6 w-6 text-slate-400" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-sm font-bold text-slate-700 dark:text-slate-200 font-outfit">
                            {view === 'hub' ? 'Área do Pioneiro' : 
                             view === 'daily' ? 'Registro Diário' :
                             view === 'report' ? 'Fechamento Mensal' :
                             view === 'analysis' ? 'Análise Anual' : 'Configurações'}
                        </h1>
                        {view === 'hub' && <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Gestão de Atividades</p>}
                    </div>
                </div>
                {view === 'hub' && (
                    <button 
                        onClick={() => navigateTo('profile')}
                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                    >
                        <SettingsIcon className="h-6 w-6" />
                    </button>
                )}
            </header>

            <main className="px-6 space-y-8 max-w-2xl mx-auto pt-4">
                {view === 'profile' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Title Section */}
                        <section>
                            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight font-outfit">Meu Perfil</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 font-sans">Gerencie sua jornada e compromissos espirituais.</p>
                        </section>

                        {/* Role Selection */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">Papel no Serviço</h3>
                                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Ativo</span>
                            </div>

                            <div className="space-y-3">
                                {/* Publicador */}
                                <button 
                                    onClick={() => handleSaveGoal({ role: 'Publicador', goalHours: 0 })}
                                    className={`w-full p-6 rounded-[32px] border transition-all flex items-start justify-between text-left ${
                                        currentRecord?.role === 'Publicador' || (!currentRecord && profile?.role === 'Publicador')
                                        ? 'bg-white dark:bg-slate-900 border-primary/20 shadow-lg shadow-primary/5' 
                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                    }`}
                                >
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                            <BookOpenIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-800 dark:text-white font-outfit">Publicador</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans max-w-[200px]">Focado em participação ativa e estudos pessoais regulares.</p>
                                        </div>
                                    </div>
                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                                        currentRecord?.role === 'Publicador' ? 'border-primary bg-primary' : 'border-slate-200 dark:border-slate-700'
                                    }`}>
                                        {currentRecord?.role === 'Publicador' && <CheckIcon className="h-4 w-4 text-white" />}
                                    </div>
                                </button>

                                {/* Pioneiro Auxiliar */}
                                <div className={`w-full p-6 rounded-[32px] border transition-all space-y-4 ${
                                    currentRecord?.role === 'Pioneiro Auxiliar'
                                    ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20' 
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                }`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                                                currentRecord?.role === 'Pioneiro Auxiliar' ? 'bg-white/20 text-white' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'
                                            }`}>
                                                <TrophyIcon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className={`text-lg font-bold font-outfit ${currentRecord?.role === 'Pioneiro Auxiliar' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>Pioneiro Auxiliar</h4>
                                                <div className="flex gap-2 mt-3">
                                                    <button 
                                                        onClick={() => handleSaveGoal({ role: 'Pioneiro Auxiliar', goalHours: 15 })}
                                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                            currentRecord?.role === 'Pioneiro Auxiliar' && currentRecord.goalHours === 15
                                                            ? 'bg-white text-blue-600' 
                                                            : 'bg-white/10 text-white border border-white/20'
                                                        }`}
                                                    >
                                                        15h
                                                    </button>
                                                    <button 
                                                        onClick={() => handleSaveGoal({ role: 'Pioneiro Auxiliar', goalHours: 30 })}
                                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                            currentRecord?.role === 'Pioneiro Auxiliar' && currentRecord.goalHours === 30
                                                            ? 'bg-white text-blue-600' 
                                                            : 'bg-white/10 text-white border border-white/20'
                                                        }`}
                                                    >
                                                        30h
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleSaveGoal({ role: 'Pioneiro Auxiliar', goalHours: 30 })}
                                            className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                                                currentRecord?.role === 'Pioneiro Auxiliar' ? 'border-white bg-white' : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            {currentRecord?.role === 'Pioneiro Auxiliar' && <CheckIcon className="h-4 w-4 text-blue-600" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Pioneiro Regular */}
                                <button 
                                    onClick={() => handleSaveGoal({ role: 'Pioneiro Regular', goalHours: 50 })}
                                    className={`w-full p-6 rounded-[32px] border transition-all flex items-start justify-between text-left ${
                                        currentRecord?.role === 'Pioneiro Regular'
                                        ? 'bg-white dark:bg-slate-900 border-primary/20 shadow-lg shadow-primary/5' 
                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                    }`}
                                >
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                                            <TrophyIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-800 dark:text-white font-outfit">Pioneiro Regular</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans max-w-[200px]">Compromisso mensal de 50h para expansão do ministério.</p>
                                        </div>
                                    </div>
                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                                        currentRecord?.role === 'Pioneiro Regular' ? 'border-primary bg-primary' : 'border-slate-200 dark:border-slate-700'
                                    }`}>
                                        {currentRecord?.role === 'Pioneiro Regular' && <CheckIcon className="h-4 w-4 text-white" />}
                                    </div>
                                </button>
                            </div>

                            <button 
                                onClick={() => setIsGoalModalOpen(true)}
                                className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <PencilIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-slate-800 dark:text-white">Alvo Personalizado</h4>
                                        <p className="text-xs text-slate-500">Defina uma meta de horas específica</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-black text-primary">{currentRecord?.goalHours || 0}h</span>
                                    <ChevronRightIconSolid className="h-5 w-5 text-slate-300" />
                                </div>
                            </button>
                        </section>

                        {/* Service Year Stats */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">Ano de Serviço {selectedYear-1}–{selectedYear}</h3>
                            
                            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 font-sans">TOTAL ACUMULADO</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-6xl font-black text-blue-900 dark:text-white font-outfit">{Math.floor(annualStats.totalHours)}</span>
                                        <span className="text-2xl font-bold text-slate-400 font-outfit">h</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, annualStats.progressToGoal)}%` }}
                                            className="h-full bg-emerald-500 rounded-full"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                                        {annualStats.progressToGoal.toFixed(0)}% da meta anual de {annualStats.annualGoal}h atingida
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                                        <ArrowTrendingUpIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Média Mensal</p>
                                        <p className="text-xl font-bold text-slate-800 dark:text-white font-outfit">{annualStats.averageHours.toFixed(1)}h</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                        <UsersIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Estudos</p>
                                        <p className="text-xl font-bold text-slate-800 dark:text-white font-outfit">{currentRecord?.studentCount || 0} Ativos</p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-[32px] border border-blue-100 dark:border-blue-800/30 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-lg font-bold text-slate-800 dark:text-white font-outfit">Período Atual</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">Setembro - Agosto</p>
                                        </div>
                                    </div>
                                    <CalendarDaysIcon className="h-6 w-6 text-slate-800 dark:text-white" />
                                </div>
                            </div>
                        </section>

                        {/* Report Settings */}
                        <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[40px] space-y-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white font-outfit text-center">Configurações de Relatório</h3>
                            
                            <div className="space-y-3">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] flex items-center justify-between border border-slate-100 dark:border-slate-800">
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                            <MegaphoneIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white font-outfit">Lembrete de Fechamento</h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">Notificar no dia 25 de cada mês</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setReminderEnabled(!reminderEnabled)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${reminderEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${reminderEnabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] flex items-center justify-between border border-slate-100 dark:border-slate-800">
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <ShareIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white font-outfit">Compartilhamento Automático</h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">Enviar PDF para o grupo de serviço</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setAutoShareEnabled(!autoShareEnabled)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${autoShareEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoShareEnabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                )}

                {view === 'hub' && (
                    <div className="space-y-8">
                        {/* Page Title Section */}
                        <div className="flex items-center gap-4">
                            <motion.section 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                className="flex-1"
                            >
                                <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-1 font-sans">MINISTÉRIO</p>
                                <div className="relative inline-block">
                                    <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight font-outfit">
                                        {currentRecord?.role === 'Publicador' ? 'Publicador' : 'Pioneiro'}
                                    </h2>
                                    <div className="h-1.5 w-20 bg-amber-500 mt-3 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>
                                </div>
                            </motion.section>
                        </div>

                        {/* Dynamic Dashboard Content */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center space-y-6">
                                <div className="flex flex-col items-center">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">Progresso do Mês</h3>
                                    {progressStats && (
                                        <span className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${progressStats.statusBg} ${progressStats.statusColor}`}>
                                            Status: {progressStats.status}
                                        </span>
                                    )}
                                    {!progressStats && (
                                        <span className="mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500">
                                            Relatório de Publicador
                                        </span>
                                    )}
                                </div>

                                <div className="relative h-64 w-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Completed', value: totalHoursCompleted },
                                                    { name: 'Remaining', value: Math.max(0, (currentRecord?.goalHours || 0) - totalHoursCompleted) }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={100}
                                                startAngle={90}
                                                endAngle={-270}
                                                paddingAngle={0}
                                                dataKey="value"
                                            >
                                                <Cell fill="#3b82f6" />
                                                <Cell fill="#f1f5f9" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {currentRecord?.goalHours ? 'PROGRESSO' : 'HORAS'}
                                        </p>
                                        <p className="text-5xl font-black text-slate-800 dark:text-white font-outfit">
                                            {currentRecord?.goalHours 
                                                ? `${Math.min(100, Math.round((totalHoursCompleted / currentRecord.goalHours) * 100))}%`
                                                : totalHoursCompleted.toFixed(0)
                                            }
                                        </p>
                                        <p className="text-xs font-bold text-blue-600 mt-1">
                                            {totalHoursCompleted.toFixed(1)}h {currentRecord?.goalHours ? `/ ${currentRecord.goalHours}h` : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Participação</p>
                                        <p className="text-xl font-black text-emerald-600">{participated ? 'SIM' : 'NÃO'}</p>
                                    </div>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estudos</p>
                                        <p className="text-xl font-black text-blue-600">{reportStudies}</p>
                                    </div>
                                </div>

                                {progressStats && (
                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Faltam</p>
                                            <p className="text-xl font-black text-amber-600">{progressStats?.formattedRemaining}</p>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Média Diária</p>
                                            <p className="text-xl font-black text-indigo-600">{progressStats?.formattedDailyAverage}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Month Selector */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center">
                                    <CalendarDaysIcon className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Mês de Referência</p>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={handlePrevMonth}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <ChevronLeftIcon className="h-4 w-4 text-slate-400" />
                                        </button>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 font-outfit min-w-[120px] text-center">
                                            {(() => {
                                                const [year, month] = selectedMonth.split('-').map(Number);
                                                return new Date(year, month - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                                            })()}
                                        </span>
                                        <button 
                                            onClick={handleNextMonth}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <ChevronRightIconSolid className="h-4 w-4 text-slate-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <input 
                                    type="month" 
                                    value={selectedMonth} 
                                    onChange={(e) => handleMonthChange(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <button className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-primary font-sans">Alterar</button>
                            </div>
                        </motion.div>

                        {/* Year Summary Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[32px] shadow-lg shadow-indigo-500/20 text-white"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">
                                        {annualStats.isServiceYear ? `Ano de Serviço ${selectedYear}` : `Ano ${selectedYear}`}
                                    </p>
                                    <h3 className="text-2xl font-black font-outfit mt-1">{annualStats.totalHours.toFixed(1)}h <span className="text-sm font-normal opacity-70">acumuladas</span></h3>
                                </div>
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                    <TrophyIcon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                    <span>Progresso Anual</span>
                                    <span>{annualStats.progressToGoal.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-white rounded-full transition-all duration-1000" 
                                        style={{ width: `${Math.min(100, annualStats.progressToGoal)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] opacity-80 italic">Meta anual: {annualStats.annualGoal}h</p>
                            </div>
                        </motion.div>

                        {!profile && !loading && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900 p-8 rounded-[40px] border border-amber-100 dark:border-amber-800/30 flex flex-col items-center text-center space-y-6 shadow-lg shadow-amber-100/20 dark:shadow-none"
                            >
                                <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/40 rounded-3xl flex items-center justify-center">
                                    <UserIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-amber-200 font-outfit">Perfil Incompleto</h3>
                                    <p className="text-sm text-slate-500 dark:text-amber-400/70 font-sans mt-2">Você precisa configurar seu perfil de publicador para enviar relatórios.</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/configuracoes')}
                                    className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/25 active:scale-[0.98] font-sans"
                                >
                                    Configurar Agora
                                </button>
                            </motion.div>
                        )}

                        {/* Service Year Quick Access */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <CalendarDaysIcon className="h-4 w-4 text-indigo-500" />
                                    Ano de Serviço {selectedYear}
                                </h4>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Set {selectedYear-1} - Ago {selectedYear}</span>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2">
                                {annualStats.monthlyData.map(m => (
                                    <button
                                        key={m.monthStr}
                                        onClick={() => {
                                            setSelectedMonth(m.monthStr);
                                            navigateTo('daily');
                                        }}
                                        className={`p-2 rounded-xl text-center transition-all border ${
                                            selectedMonth === m.monthStr
                                            ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                                            : m.hours > 0
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                                            : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                                        }`}
                                    >
                                        <p className="text-[10px] font-black uppercase">{m.name}</p>
                                        <p className="text-[8px] opacity-70">{m.hours > 0 ? `${m.hours.toFixed(0)}h` : '-'}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action List */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                            <button 
                                onClick={() => navigateTo('daily')}
                                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CalendarDaysIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-800 dark:text-white">Relatar Horas</h3>
                                        <p className="text-xs text-slate-500">Registre sua atividade diária</p>
                                    </div>
                                </div>
                                <ChevronRightIconSolid className="h-5 w-5 text-slate-300" />
                            </button>

                            <button 
                                onClick={() => {
                                    navigateTo('report');
                                    if (currentRecord) {
                                        setReportHours(Math.floor(totalHoursCompleted));
                                        setReportStudies(currentRecord.studentCount || 0);
                                    }
                                }}
                                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <DocumentTextIcon className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-800 dark:text-white">Criar Relatório</h3>
                                        <p className="text-xs text-slate-500">Fechamento mensal para a congregação</p>
                                    </div>
                                </div>
                                <ChevronRightIconSolid className="h-5 w-5 text-slate-300" />
                            </button>

                            <button 
                                onClick={() => navigateTo('report')}
                                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CalendarDaysIcon className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-800 dark:text-white">Relatórios Passados</h3>
                                        <p className="text-xs text-slate-500">Lançar ou revisar meses anteriores</p>
                                    </div>
                                </div>
                                <ChevronRightIconSolid className="h-5 w-5 text-slate-300" />
                            </button>

                            <button 
                                onClick={() => navigateTo('analysis')}
                                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ChartBarIcon className="h-6 w-6 text-indigo-500" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-800 dark:text-white">Análise e Comparação</h3>
                                        <p className="text-xs text-slate-500">Progresso mensal e anual com gráficos</p>
                                    </div>
                                </div>
                                <ChevronRightIconSolid className="h-5 w-5 text-slate-300" />
                            </button>
                        </div>
                    </div>
                )}

                {view === 'daily' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Stats Cards */}
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Realizado</p>
                                        <p className="text-3xl font-black text-emerald-500 font-outfit">{totalHoursCompleted.toFixed(1)}h</p>
                                    </div>
                                    {progressStats && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Faltam</p>
                                                <p className="text-xl font-black text-amber-500">{progressStats.formattedRemaining}</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Média Diária</p>
                                                <p className="text-xl font-black text-indigo-500">{progressStats.formattedDailyAverage}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingActivity(null); setIsActivityModalOpen(true); }} className="flex-1 btn-primary flex items-center justify-center gap-2 py-3">
                                        <PlusIcon className="h-5 w-5" /> Novo Registro
                                    </button>
                                    <button onClick={handleShare} className="p-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors">
                                        <ShareIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* List */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <h4 className="font-bold text-slate-800 dark:text-white">Registros do Mês</h4>
                                        <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                            {currentRecord?.activities.length || 0} {(currentRecord?.activities.length || 0) === 1 ? 'dia' : 'dias'}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {!currentRecord || currentRecord.activities.length === 0 ? (
                                            <div className="p-10 text-center">
                                                <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <CalendarDaysIcon className="h-6 w-6 text-slate-300" />
                                                </div>
                                                <p className="text-slate-400 text-sm italic">Nenhum registro ainda.</p>
                                            </div>
                                        ) : (
                                            currentRecord.activities
                                                .sort((a, b) => b.date.localeCompare(a.date))
                                                .map(act => (
                                                    <div key={act.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                                                <span className="text-[10px] font-bold text-slate-400 leading-none mb-0.5">{new Date(act.date + 'T12:00:00').toLocaleString('pt-BR', { weekday: 'short' }).toUpperCase()}</span>
                                                                <span className="text-base font-black text-slate-700 dark:text-slate-200">{new Date(act.date + 'T12:00:00').getDate()}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800 dark:text-white text-lg">{act.hours}h {act.minutes}m</p>
                                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{act.category || 'Pregação'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => { setEditingActivity(act); setIsActivityModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"><PencilIcon className="h-4 w-4"/></button>
                                                            <button onClick={() => handleDeleteActivity(act.id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><TrashIcon className="h-4 w-4"/></button>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                {view === 'report' && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 space-y-6 animate-fade-in">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Fechamento Mensal</h3>
                            <p className="text-sm text-slate-500 mt-1">Confirme os dados para enviar à congregação.</p>
                        </div>

                        {/* Month Selector inside Report View */}
                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CalendarDaysIcon className="h-5 w-5 text-primary" />
                                <span className="font-bold text-slate-700 dark:text-slate-200">Mês de Referência</span>
                            </div>
                            <input 
                                type="month" 
                                value={selectedMonth}
                                onChange={(e) => handleMonthChange(e.target.value)}
                                className="bg-transparent font-bold text-primary outline-none"
                            />
                        </div>

                        <div className="space-y-4">
                            {/* Publisher Name (Read-only for self) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Publicador</label>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700">
                                    {profile?.name || user?.displayName || 'N/A'}
                                </div>
                            </div>

                            {/* Participation (Only for non-pioneers) */}
                            {!(profile?.isRegularPioneer || profile?.isAuxiliaryPioneer) && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Participou da Congregação?</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setParticipated(true)}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${participated === true ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                                        >
                                            <CheckIcon className="h-5 w-5" /> Sim
                                        </button>
                                        <button 
                                            onClick={() => setParticipated(false)}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${participated === false ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                                        >
                                            <XMarkIcon className="h-5 w-5" /> Não
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Hours Totals */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                {(profile?.isRegularPioneer || profile?.isAuxiliaryPioneer) && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800 mb-4">
                                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Status de Pioneiro</p>
                                        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                                            {profile.isRegularPioneer ? 'Pioneiro Regular' : 'Pioneiro Auxiliar'}
                                        </p>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">
                                        Horas Totais {!(profile?.isRegularPioneer || profile?.isAuxiliaryPioneer) && '(Opcional)'}
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="number" 
                                            value={reportHours} 
                                            onChange={(e) => setReportHours(parseInt(e.target.value) || 0)}
                                            className="input-style flex-1"
                                            placeholder={!(profile?.isRegularPioneer || profile?.isAuxiliaryPioneer) ? "Opcional para publicadores" : "Total de horas"}
                                        />
                                        <div className="flex gap-1">
                                            <button onClick={() => setReportHours(Math.max(0, reportHours - 1))} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">-</button>
                                            <button onClick={() => setReportHours(reportHours + 1)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">+</button>
                                        </div>
                                    </div>
                                    {currentRecord && (
                                        <p className="text-[10px] text-slate-400 mt-1 italic">* Baseado em {totalHoursCompleted.toFixed(1)}h registradas no log diário.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">
                                        Estudos Bíblicos
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="number" 
                                            value={reportStudies} 
                                            onChange={(e) => setReportStudies(parseInt(e.target.value) || 0)}
                                            className="input-style flex-1"
                                            placeholder="Quantidade de estudos"
                                        />
                                        <div className="flex gap-1">
                                            <button onClick={() => setReportStudies(Math.max(0, reportStudies - 1))} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">-</button>
                                            <button onClick={() => setReportStudies(reportStudies + 1)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">+</button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">
                                        Revisitas
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="number" 
                                            value={reportRevisits} 
                                            onChange={(e) => setReportRevisits(parseInt(e.target.value) || 0)}
                                            className="input-style flex-1"
                                            placeholder="Quantidade de revisitas"
                                        />
                                        <div className="flex gap-1">
                                            <button onClick={() => setReportRevisits(Math.max(0, reportRevisits - 1))} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">-</button>
                                            <button onClick={() => setReportRevisits(reportRevisits + 1)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">+</button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">
                                        Observações
                                    </label>
                                    <textarea 
                                        value={reportNotes} 
                                        onChange={(e) => setReportNotes(e.target.value)}
                                        className="input-style w-full min-h-[100px] py-3"
                                        placeholder="Alguma observação importante?"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 space-y-3">
                            <button 
                                onClick={handleSubmitMonthlyReport}
                                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary-dark hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                <ShareIcon className="h-6 w-6" /> Salvar e Compartilhar
                            </button>
                            
                            <button 
                                onClick={generateMonthlyPDF}
                                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5" /> Gerar PDF Mensal
                            </button>
                        </div>
                    </div>
                )}

                {view === 'analysis' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Year Selector */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CalendarDaysIcon className="h-5 w-5 text-indigo-500" />
                                <div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 block">
                                        {annualStats.isServiceYear ? `Ano de Serviço ${selectedYear}` : `Ano ${selectedYear}`}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                        {annualStats.isServiceYear 
                                            ? `Setembro ${selectedYear - 1} - Agosto ${selectedYear}`
                                            : `Janeiro ${selectedYear} - Dezembro ${selectedYear}`
                                        }
                                    </span>
                                </div>
                            </div>
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-transparent border-none text-sm font-bold text-indigo-500 focus:ring-0 cursor-pointer"
                            >
                                {[0, 1, 2, 3, 4].map(offset => {
                                    const now = new Date();
                                    const month = now.getMonth() + 1;
                                    const isServiceYear = annualStats.isServiceYear;
                                    const currentYear = isServiceYear 
                                        ? (month >= 9 ? now.getFullYear() + 1 : now.getFullYear())
                                        : now.getFullYear();
                                    const year = currentYear - offset;
                                    return <option key={year} value={year}>{year}</option>;
                                })}
                            </select>
                        </div>

                        {/* Annual Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                        <ChartBarIcon className="h-5 w-5 text-indigo-500" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Anual</p>
                                </div>
                                <p className="text-3xl font-black text-slate-800 dark:text-white">{annualStats.totalHours.toFixed(1)}h</p>
                                <p className="text-xs text-slate-500 mt-1">Soma de todos os meses</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                        <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Crescimento</p>
                                </div>
                                <p className={`text-3xl font-black ${annualStats.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {annualStats.growth >= 0 ? '+' : ''}{annualStats.growth.toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Comparado ao ano anterior</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 col-span-2">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                            <TrophyIcon className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Meta Anual {annualStats.annualGoal > 0 ? `(${annualStats.annualGoal}h)` : ''}
                                        </p>
                                    </div>
                                    <span className="text-xs font-black text-amber-600">{annualStats.progressToGoal.toFixed(1)}%</span>
                                </div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                                    <div 
                                        className="h-full bg-amber-500 transition-all duration-1000"
                                        style={{ width: `${Math.min(100, annualStats.progressToGoal)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500">Faltam {(600 - annualStats.totalHours).toFixed(1)}h para bater a meta.</p>
                            </div>
                        </div>

                        {/* PDF Generation Button */}
                        <button 
                            onClick={generatePDF}
                            className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                        >
                            <DocumentArrowDownIcon className="h-5 w-5" /> Gerar Relatório PDF Anual
                        </button>

                        {/* Monthly Chart */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold text-slate-800 dark:text-white">
                                    Comparativo Mensal ({annualStats.isServiceYear ? `Ano de Serviço ${selectedYear}` : `Ano ${selectedYear}`})
                                </h4>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setYearType('service')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${yearType === 'service' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Serviço
                                    </button>
                                    <button 
                                        onClick={() => setYearType('calendar')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${yearType === 'calendar' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Civil
                                    </button>
                                </div>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={annualStats.monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ 
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                backgroundColor: '#1e293b',
                                                color: '#fff'
                                            }}
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                            labelStyle={{ display: 'none' }}
                                        />
                                        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                                            {annualStats.monthlyData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.hours > 0 ? '#6366f1' : '#f1f5f9'} 
                                                    className="transition-all duration-300"
                                                    onClick={() => {
                                                        setSelectedMonth(entry.monthStr);
                                                        navigateTo('daily');
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[10px] text-center text-slate-400 mt-4 italic">Toque em uma barra para ver os detalhes do mês.</p>
                        </div>

                        {/* Yearly Comparison Chart */}
                        {annualStats.yearlyTotals && annualStats.yearlyTotals.length > 1 && (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                                <h4 className="font-bold text-slate-800 dark:text-white mb-6">Comparativo por Ano</h4>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={annualStats.yearlyTotals}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis 
                                                dataKey="year" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                            />
                                            <Tooltip 
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ 
                                                    borderRadius: '12px', 
                                                    border: 'none', 
                                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                    backgroundColor: '#1e293b',
                                                    color: '#fff'
                                                }}
                                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                                labelStyle={{ display: 'none' }}
                                            />
                                            <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Monthly List Breakdown */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="font-bold text-slate-800 dark:text-white">Detalhamento por Mês</h4>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {annualStats.monthlyData.map(m => (
                                    <div 
                                        key={m.monthStr} 
                                        onClick={() => {
                                            setSelectedMonth(m.monthStr);
                                            navigateTo('daily');
                                        }}
                                        className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${m.hours > 0 ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                {m.name}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">{m.fullMonth}</p>
                                                <p className="text-xs text-slate-500">{m.hours.toFixed(1)} horas registradas</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {m.hours > 0 && (
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            )}
                                            <ChevronLeftIcon className="h-4 w-4 text-slate-300 rotate-180" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Pioneer Sub-Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-6 pt-3 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <nav className="max-w-md mx-auto flex justify-between items-center">
                    <button 
                        onClick={() => navigateTo('hub')}
                        className={`flex flex-col items-center gap-1 transition-all ${view === 'hub' ? 'text-blue-600' : 'text-slate-400'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${view === 'hub' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <HomeIcon className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Início</span>
                    </button>

                    <button 
                        onClick={() => navigateTo('daily')}
                        className={`flex flex-col items-center gap-1 transition-all ${view === 'daily' ? 'text-blue-600' : 'text-slate-400'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${view === 'daily' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <PencilIcon className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Registro</span>
                    </button>

                    <button 
                        onClick={() => navigateTo('analysis')}
                        className={`flex flex-col items-center gap-1 transition-all ${view === 'analysis' ? 'text-blue-600' : 'text-slate-400'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${view === 'analysis' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <ChartBarIcon className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Análise</span>
                    </button>

                    <button 
                        onClick={() => navigateTo('profile')}
                        className={`flex flex-col items-center gap-1 transition-all ${view === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${view === 'profile' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <UserIcon className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Perfil</span>
                    </button>
                </nav>
            </div>

            {/* Modals */}
            <GoalModal 
                isOpen={isGoalModalOpen} 
                onClose={() => setIsGoalModalOpen(false)} 
                onSave={handleSaveGoal} 
                initialData={currentRecord} 
            />
            <ActivityModal 
                isOpen={isActivityModalOpen} 
                onClose={() => { setIsActivityModalOpen(false); setEditingActivity(null); }} 
                onSave={handleAddOrUpdateActivity} 
                initialData={editingActivity}
                defaultMonth={selectedMonth}
            />
            
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />

            <ConfirmationModal 
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDeleteActivity}
                title="Excluir Registro"
                message="Tem certeza que deseja excluir este registro de horas? Esta ação não pode ser desfeita."
            />

            <ConfirmationModal 
                isOpen={isReportOverwriteConfirmOpen}
                onClose={() => setIsReportOverwriteConfirmOpen(false)}
                onConfirm={processReportSubmission}
                title="Substituir Relatório"
                message={`Já existe um relatório enviado para este mês. Deseja substituí-lo?`}
            />
        </div>
    );
};

// --- Sub-components (Modals) ---

const GoalModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: (data: Partial<PioneerRecord>) => void, initialData: PioneerRecord | null}> = ({ isOpen, onClose, onSave, initialData }) => {
    const [goalHours, setGoalHours] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setGoalHours(String(initialData.goalHours));
            } else {
                setGoalHours('');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
                <h4 className="text-xl font-black mb-6 text-center text-slate-800 dark:text-white">Definir Alvo de Horas</h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Alvo para este Mês</label>
                        <input 
                            type="number" 
                            value={goalHours} 
                            onChange={(e) => setGoalHours(e.target.value)} 
                            placeholder="Ex: 50" 
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-slate-800 dark:text-white font-black text-2xl text-center" 
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 text-center italic">O perfil (Publicador/Pioneiro) deve ser configurado na aba Perfil.</p>
                </div>
                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button onClick={() => onSave({ goalHours: parseInt(goalHours, 10) })} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const ActivityModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: (activity: PioneerActivity) => void, initialData: PioneerActivity | null, defaultMonth: string}> = ({ isOpen, onClose, onSave, initialData, defaultMonth }) => {
    const getTodayStr = () => {
        const d = new Date();
        const todayMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        if (todayMonth === defaultMonth) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } else {
            // Se não for o mês atual, retorna o primeiro dia do mês selecionado
            return `${defaultMonth}-01`;
        }
    };

    const [date, setDate] = useState(getTodayStr);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [category, setCategory] = useState<'Pregação' | 'Estudos' | 'Outra'>('Pregação');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setDate(initialData.date);
                setHours(initialData.hours);
                setMinutes(initialData.minutes);
                setCategory(initialData.category || 'Pregação');
            } else {
                setDate(getTodayStr());
                setHours(0);
                setMinutes(0);
                setCategory('Pregação');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-scale-in max-h-[90vh] overflow-y-auto">
                <h4 className="text-xl font-black mb-6 text-center text-slate-800 dark:text-white">{initialData ? 'Editar Registro' : 'Novo Registro'}</h4>
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Data</label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-slate-800 dark:text-white font-bold" 
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Modalidade</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Pregação', 'Estudos', 'Outra'] as const).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all border-2 ${
                                        category === cat 
                                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' 
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Horas</label>
                            <input 
                                type="number" 
                                value={hours} 
                                onChange={e => setHours(parseInt(e.target.value) || 0)} 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-slate-800 dark:text-white font-bold" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Minutos</label>
                            <input 
                                type="number" 
                                value={minutes} 
                                onChange={e => setMinutes(parseInt(e.target.value) || 0)} 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-slate-800 dark:text-white font-bold" 
                            />
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button 
                        onClick={() => onSave({ 
                            id: initialData?.id || Date.now().toString(), 
                            date, 
                            hours, 
                            minutes, 
                            category, 
                            revisits: 0, 
                            studies: 0, 
                            studyDetails: initialData?.studyDetails || [] 
                        })} 
                        className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pioneer;
