import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
    getPioneerRecords, 
    updatePioneerRecord, 
    getPublisherProfileByUid,
    addMonthlyReport,
    setPioneerRecord,
    addPioneerRecord,
    updatePublisherProfile,
    addReport,
    addPublisherProfile
} from '../services/firestoreService';
import { PioneerRecord, PioneerActivity, PublisherProfile, UserRole } from '../types';
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    ShareIcon, 
    DocumentTextIcon,
    ChevronLeftIcon,
    CheckIcon,
    ChartBarIcon,
    UserIcon,
    TrophyIcon,
    DocumentArrowDownIcon
} from '../components/icons/Icons';
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

    // Core States
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [selectedYear, setSelectedYear] = useState(() => {
        const now = new Date();
        return now.getFullYear();
    });
    const [records, setRecords] = useState<PioneerRecord[]>([]);
    const [profile, setProfile] = useState<PublisherProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'tracker' | 'reports'>('tracker');
    
    // Form and Modal States
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<PioneerActivity | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
    const [isReportOverwriteConfirmOpen, setIsReportOverwriteConfirmOpen] = useState(false);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [tempPublisherName, setTempPublisherName] = useState('');
    const [tempPublisherGroup, setTempPublisherGroup] = useState<'1' | '2' | '3'>('1');
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [tempGoalHours, setTempGoalHours] = useState<number>(0);

    // Form Fields (For manual edits / pre-fill)
    const [participated, setParticipated] = useState<boolean>(true);
    const [reportHours, setReportHours] = useState<number>(0);
    const [reportStudies, setReportStudies] = useState<number>(0);
    const [reportRevisits, setReportRevisits] = useState<number>(0);
    const [reportNotes, setReportNotes] = useState<string>('');

    // Fetch All User Data
    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [recordsData, profileData] = await Promise.all([
                getPioneerRecords(),
                getPublisherProfileByUid(user.uid)
            ]);
            
            // Filter user specific records
            const userRecords = recordsData.filter(r => r.createdBy === user.uid);
            setRecords(userRecords);
            setProfile(profileData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    // Derived State
    const currentRecord = useMemo(() => {
        return records.find(r => r.month === selectedMonth && r.createdBy === user?.uid);
    }, [records, selectedMonth, user]);

    // Dynamic current mode: is calculated from profile or currently selected record role
    const currentRole = useMemo(() => {
        if (currentRecord) return currentRecord.role;
        if (profile?.isRegularPioneer) return 'Pioneiro Regular';
        if (profile?.isAuxiliaryPioneer) return 'Pioneiro Auxiliar';
        return 'Publicador';
    }, [currentRecord, profile]);

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

    // Prefill form values
    useEffect(() => {
        if (currentRecord) {
            setReportHours(totalHoursCompleted || 0);
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

    // Service Year helper (Sep - Aug)
    const getServiceYearFromMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-').map(Number);
        const serviceYearStart = month >= 9 ? year : year - 1;
        return `${serviceYearStart}-${serviceYearStart + 1}`;
    };

    const handleMonthChange = (direction: 'prev' | 'next') => {
        const [year, month] = selectedMonth.split('-').map(Number);
        let newDate;
        if (direction === 'prev') {
            newDate = new Date(year, month - 2, 1);
        } else {
            newDate = new Date(year, month, 1);
        }
        const newMonthStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
        setSelectedMonth(newMonthStr);
        setSelectedYear(newDate.getFullYear());
    };

    // Role switcher directly on top of screen
    const handleRoleChange = async (newRole: 'Publicador' | 'Pioneiro Auxiliar' | 'Pioneiro Regular') => {
        if (!user || !profile) return;
        setLoading(true);
        try {
            const defaultGoal = newRole === 'Pioneiro Regular' ? 50 : (newRole === 'Pioneiro Auxiliar' ? 30 : 0);
            
            // 1. Update general profile values so they stay consistent app-wide
            await updatePublisherProfile(profile.id, {
                ...profile,
                isRegularPioneer: newRole === 'Pioneiro Regular',
                isAuxiliaryPioneer: newRole === 'Pioneiro Auxiliar',
                isPublisher: newRole === 'Publicador'
            }, user.uid);

            // 2. Update monthly specific planner record
            if (currentRecord) {
                await setPioneerRecord({
                    ...currentRecord,
                    role: newRole,
                    goalHours: defaultGoal,
                    isAuxiliaryPioneer: newRole === 'Pioneiro Auxiliar'
                });
            } else {
                await addPioneerRecord({
                    month: selectedMonth,
                    serviceYear: getServiceYearFromMonth(selectedMonth),
                    activities: [],
                    role: newRole,
                    goalHours: defaultGoal,
                    studentCount: 0,
                    revisits: 0,
                    isAuxiliaryPioneer: newRole === 'Pioneiro Auxiliar',
                }, user.uid);
            }

            await loadData();
            setToastMessage(`Alterado para ${newRole}!`);
        } catch (error) {
            console.error('Error changing role:', error);
            setToastMessage('Erro ao alterar modalidade.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoalHoursChange = async (hours: number) => {
        if (!user || !currentRecord) return;
        try {
            await setPioneerRecord({
                ...currentRecord,
                goalHours: hours
            });
            await loadData();
            setToastMessage('Alvo de horas atualizado!');
        } catch (error) {
            console.error('Error updating goal:', error);
            setToastMessage('Erro ao atualizar alvo.');
        }
    };

    // Daily Activity Logic
    const handleAddOrUpdateActivity = async (activity: PioneerActivity) => {
        if (!user) return;
        try {
            const dateObj = new Date(activity.date + 'T12:00:00');
            const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            
            let targetRecord = records.find(r => r.month === monthStr && r.createdBy === user.uid);
            
            if (!targetRecord) {
                const defaultGoal = currentRole === 'Pioneiro Regular' ? 50 : (currentRole === 'Pioneiro Auxiliar' ? 30 : 0);
                const newRecord: PioneerRecord = {
                    id: `${user.uid}-${monthStr}`,
                    month: monthStr,
                    serviceYear: getServiceYearFromMonth(monthStr),
                    goalHours: defaultGoal,
                    role: currentRole as any,
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
            setToastMessage('Registro salvo com sucesso!');
        } catch (error) {
            console.error('Error saving activity:', error);
            setToastMessage('Erro ao salvar registro.');
        }
    };

    const handleDeleteActivity = (id: string) => {
        setActivityToDelete(id);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteActivity = async () => {
        if (!user || !currentRecord || !activityToDelete) return;
        try {
            const updatedActivities = currentRecord.activities.filter(a => a.id !== activityToDelete);
            await updatePioneerRecord(currentRecord.id, { activities: updatedActivities }, user.uid);
            await loadData();
            setToastMessage('Registro excluído com sucesso.');
        } catch (error) {
            console.error('Error deleting activity:', error);
            setToastMessage('Erro ao excluir registro.');
        } finally {
            setActivityToDelete(null);
            setIsDeleteConfirmOpen(false);
        }
    };

    // Monthly Closure/Submit Report Logic
    const handleSubmitMonthlyReport = async () => {
        if (!user) return;
        
        // If profile doesn't exist or doesn't have a name, prompt name registration first
        if (!profile || !profile.name) {
            setTempPublisherName(profile?.name || user.displayName || '');
            setTempPublisherGroup(profile?.group || '1');
            setIsNameModalOpen(true);
            return;
        }

        const [yearStr, monthNum] = selectedMonth.split('-');
        const monthName = MONTHS[parseInt(monthNum) - 1];

        // Check for duplicate submitted report to avoid overwriting accidentally
        const alreadySubmitted = currentRecord?.submitted;
        if (alreadySubmitted) {
            setIsReportOverwriteConfirmOpen(true);
            return;
        }
        
        await processReportSubmission();
    };

    const handleConfirmName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !tempPublisherName.trim()) {
            setToastMessage('Por favor, digite seu nome.');
            return;
        }
        
        try {
            setLoading(true);
            setIsNameModalOpen(false);
            
            const profileData = {
                uid: user.uid,
                name: tempPublisherName.trim(),
                group: tempPublisherGroup,
                isRegularPioneer: currentRole === 'Pioneiro Regular',
                isAuxiliaryPioneer: currentRole === 'Pioneiro Auxiliar',
                isPublisher: currentRole === 'Publicador',
                isUnbaptizedPublisher: false,
                isMinisterialServant: false,
                isElder: false,
                email: user.email || '',
                isActive: true
            };
            
            let updatedProfile: PublisherProfile;
            if (profile) {
                await updatePublisherProfile(profile.id, profileData, user.uid);
                updatedProfile = { ...profile, ...profileData };
            } else {
                const docRef = await addPublisherProfile(profileData, user.uid);
                updatedProfile = { id: docRef.id, ...profileData } as PublisherProfile;
            }
            
            // Reload data so profile is populated
            const [recordsData] = await Promise.all([
                getPioneerRecords()
            ]);
            const userRecords = recordsData.filter(r => r.createdBy === user.uid);
            setRecords(userRecords);
            setProfile(updatedProfile);
            
            // Now proceed with submitting
            const [yearStr, monthNum] = selectedMonth.split('-');
            const alreadySubmitted = currentRecord?.submitted;
            if (alreadySubmitted) {
                setIsReportOverwriteConfirmOpen(true);
                return;
            }
            
            await processReportSubmission(updatedProfile);
        } catch (error) {
            console.error('Error saving profile and submitting:', error);
            setToastMessage('Erro ao salvar nome de publicador.');
        } finally {
            setLoading(false);
        }
    };

    const processReportSubmission = async (activeProfile?: PublisherProfile) => {
        const targetProfile = activeProfile || profile;
        if (!user || !targetProfile) {
            setToastMessage('Perfil de publicador não identificado.');
            return;
        }

        const [yearStr, monthNum] = selectedMonth.split('-');
        const monthName = MONTHS[parseInt(monthNum) - 1];
        const isPioneer = currentRole !== 'Publicador';

        try {
            // 1. Save to Congregation collection (relatorios_pregacao) so coordinators receive it
            await addMonthlyReport({
                userId: user.uid,
                userName: targetProfile.name || user.displayName || 'Publicador',
                month: monthName,
                year: parseInt(yearStr),
                hours: isPioneer ? reportHours : (participated ? reportHours || 0 : 0),
                studies: reportStudies || 0,
                revisits: reportRevisits || 0,
                publications: 0,
                hasParticipated: isPioneer ? true : participated,
                notes: reportNotes || `Relatório enviado pelo App.`,
                status: 'Enviado'
            } as any, user.uid);

            // 2. Also save to standard "relatorios" collection for the Secretary to see on standard reports tab
            const reportDateISO = new Date(Date.UTC(parseInt(yearStr), parseInt(monthNum) - 1, 1)).toISOString();
            await addReport({
                publisherId: user.uid,
                publisherName: targetProfile.name || user.displayName || 'Publicador',
                group: targetProfile.group || '1',
                date: reportDateISO,
                privilege: isPioneer ? 'PIONEER' : 'PUBLISHER',
                hours: isPioneer ? reportHours : (participated ? reportHours || 0 : 0),
                minutes: 0,
                revisits: reportRevisits || 0,
                studies: reportStudies || 0,
                hasParticipated: isPioneer ? true : participated,
                notes: reportNotes || `Relatório enviado pelo App de Relatório de Serviço.`,
                isActive: true
            }, user.uid);

            // 3. Mark local month as submitted under PioneerRecord
            const pioneerRecord: PioneerRecord = {
                id: currentRecord?.id || `${user.uid}-${selectedMonth}`,
                month: selectedMonth,
                serviceYear: getServiceYearFromMonth(selectedMonth),
                goalHours: currentRecord?.goalHours || (isPioneer ? (currentRole === 'Pioneiro Regular' ? 50 : 30) : 0),
                role: currentRole as any,
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
            await loadData();

            // 4. Formulate share text
            let shareText = `📋 *Relatório de Serviço de Campo*\n`;
            shareText += `--------------------------------\n`;
            shareText += `*Mês:* ${monthName} / ${yearStr}\n`;
            shareText += `*Publicador:* ${targetProfile.name || user.displayName || 'N/A'}\n`;
            shareText += `*Modalidade:* ${currentRole}\n`;
            
            if (isPioneer) {
                shareText += `*Horas:* ${reportHours}h\n`;
            } else {
                shareText += `*Participou:* ${participated ? 'Sim' : 'Não'}\n`;
                if (reportHours > 0) shareText += `*Horas:* ${reportHours}h\n`;
            }
            
            if (reportStudies > 0) shareText += `*Estudos Bíblicos:* ${reportStudies}\n`;
            if (reportRevisits > 0) shareText += `*Revisitas:* ${reportRevisits}\n`;
            if (reportNotes) shareText += `*Observações:* ${reportNotes}\n`;
            shareText += `--------------------------------\n`;
            shareText += `Gerado pelo App de Gestão`;

            setToastMessage('Relatório gravado e enviado para a aba secretário com sucesso!');

            // 5. Try browser share API or clipboard copy
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `Relatório - ${monthName}/${yearStr}`,
                        text: shareText
                    });
                } catch (err: any) {
                    if (err.name !== 'AbortError') {
                        console.error('Share failed', err);
                    }
                }
            } else {
                await navigator.clipboard.writeText(shareText);
                setToastMessage('Relatório salvo, enviado com sucesso e copiado para compartilhar!');
            }
            setIsReportOverwriteConfirmOpen(false);
        } catch (error) {
            console.error('Error submitting report:', error);
            setToastMessage('Erro ao salvar relatório.');
        }
    };

    // Monthly PDF Gen
    const generateMonthlyPDF = () => {
        const doc = new jsPDF();
        const [year, monthNum] = selectedMonth.split('-').map(Number);
        const monthName = MONTHS[monthNum - 1];
        const userName = profile?.name || user?.displayName || 'Publicador';

        doc.setFontSize(18);
        doc.text(`Relatório de Serviço - ${monthName} / ${year}`, 105, 20, { align: 'center' });
        
        doc.setFontSize(11);
        doc.text(`Publicador: ${userName}`, 20, 38);
        doc.text(`Modalidade: ${currentRole}`, 20, 46);
        if (currentRole !== 'Publicador') {
            doc.text(`Alvo de Horas: ${currentRecord?.goalHours || 0}h`, 20, 54);
            doc.text(`Total Realizado: ${totalHoursCompleted.toFixed(1)}h`, 20, 62);
            doc.text(`Estudos Bíblicos: ${reportStudies}`, 20, 70);
            doc.text(`Revisitas: ${reportRevisits}`, 20, 78);
        } else {
            doc.text(`Participou no Mês: ${participated ? 'Sim' : 'Não'}`, 20, 54);
            doc.text(`Estudos Bíblicos: ${reportStudies}`, 20, 62);
            if (reportHours > 0) doc.text(`Horas Opcionais: ${reportHours}h`, 20, 70);
        }

        if (currentRecord?.activities && currentRecord.activities.length > 0) {
            doc.line(20, 85, 190, 85);
            doc.setFont('helvetica', 'bold');
            doc.text('Data', 20, 93);
            doc.text('Dia', 60, 93);
            doc.text('Tempo', 100, 93);
            doc.text('Categoria', 140, 93);
            doc.setFont('helvetica', 'normal');

            let y = 101;
            const sortedActivities = [...currentRecord.activities].sort((a, b) => a.date.localeCompare(b.date));
            sortedActivities.forEach((act) => {
                const date = new Date(act.date + 'T12:00:00');
                doc.text(act.date, 20, y);
                doc.text(date.toLocaleString('pt-BR', { weekday: 'short' }), 60, y);
                doc.text(`${act.hours}h ${act.minutes}m`, 100, y);
                doc.text(act.category || 'Pregação', 140, y);
                y += 8;
                
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });
        }

        if (reportNotes) {
            const yOffset = currentRecord?.activities && currentRecord.activities.length > 0 ? 240 : 100;
            doc.setFont('helvetica', 'bold');
            doc.text('Observações:', 20, yOffset);
            doc.setFont('helvetica', 'normal');
            const splitNotes = doc.splitTextToSize(reportNotes, 170);
            doc.text(splitNotes, 20, yOffset + 7);
        }

        doc.save(`relatorio_${monthName}_${year}.pdf`);
        setToastMessage('PDF gerado com sucesso!');
    };

    // Calculate Pioneer Statistics
    const pioneerMetrics = useMemo(() => {
        if (currentRole === 'Publicador' || !currentRecord) return null;
        
        const goal = currentRecord.goalHours || 30;
        const remaining = Math.max(0, goal - totalHoursCompleted);
        const percent = Math.min(100, (totalHoursCompleted / goal) * 100);

        // Calculate remaining active days in selected month
        const [year, month] = selectedMonth.split('-').map(Number);
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
        const totalDays = new Date(year, month, 0).getDate();
        
        let daysLeft = totalDays;
        if (isCurrentMonth) {
            daysLeft = Math.max(1, totalDays - today.getDate() + 1);
        } else if (today.getFullYear() > year || (today.getFullYear() === year && (today.getMonth() + 1) > month)) {
            daysLeft = 0; // Past month
        }

        const avgDaily = daysLeft > 0 ? remaining / daysLeft : 0;

        return {
            goal,
            remaining,
            percent,
            daysLeft,
            avgDaily: avgDaily.toFixed(requestedDecimals(avgDaily))
        };
    }, [currentRecord, totalHoursCompleted, currentRole, selectedMonth]);

    function requestedDecimals(num: number) {
        return num > 0 && num < 0.1 ? 2 : 1;
    }

    // Historical Comparative Data for Charts
    const historyChartData = useMemo(() => {
        return MONTHS.map((name, i) => {
            const monthNumStr = String(i + 1).padStart(2, '0');
            const monthStr = `${selectedYear}-${monthNumStr}`;
            const rec = records.find(r => r.month === monthStr);
            let hours = 0;
            if (rec) {
                const totalMinutes = rec.activities.reduce((acc, act) => acc + (act.hours * 60) + act.minutes, 0);
                hours = totalMinutes / 60;
            }
            return {
                name: name.substring(0, 3),
                horas: Number(hours.toFixed(1)),
                monthStr
            };
        });
    }, [records, selectedYear]);

    return (
        <div id="pioneer_page_container" className="container mx-auto px-4 sm:px-6 md:px-8 py-6 max-w-4xl pb-32">
            
            {/* Elegant Fixed Header */}
            <header className="flex items-center justify-between mb-6 pb-2 transition-all">
                <button 
                    onClick={() => navigate('/')} 
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Relatório de Serviço</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pioneiros & Publicadores</p>
                </div>
                <div className="w-10"></div> {/* Spacer balance */}
            </header>

            {/* Main Interactive Category Switcher directly on top */}
            <section className="bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl flex relative mb-6 border border-slate-200/50 dark:border-white/5 transition-colors">
                {(['Publicador', 'Pioneiro Auxiliar', 'Pioneiro Regular'] as const).map((role) => (
                    <button
                        key={role}
                        onClick={() => handleRoleChange(role)}
                        className={`flex-1 py-2.5 text-center text-xs font-black rounded-xl transition-all duration-300 ${
                            currentRole === role
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md shadow-slate-900/5'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        {role === 'Publicador' ? 'Publicador' : role === 'Pioneiro Auxiliar' ? 'Auxiliar' : 'Regular'}
                    </button>
                ))}
            </section>

            {/* Month selector reference */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-5 mb-8 transition-all">
                <button 
                    onClick={() => handleMonthChange('prev')} 
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <div className="text-center">
                    <p className="text-lg font-extrabold text-slate-800 dark:text-white capitalize">
                        {new Date(selectedMonth + '-01T12:00:00').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Mês de Referência</p>
                </div>
                <button 
                    onClick={() => handleMonthChange('next')} 
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                    <ChevronLeftIcon className="h-4 w-4 rotate-180" />
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="h-8 w-8 rounded-xl bg-primary animate-bounce"></div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-4">Carregando Informações...</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    
                    {/* ==================== 1. PUBLISHER VIEW ==================== */}
                    {currentRole === 'Publicador' ? (
                        <motion.div 
                            key="publisher_layout"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Submission Success Banner */}
                            {currentRecord?.submitted ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl text-center space-y-4">
                                    <div className="h-12 w-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl shadow-lg shadow-emerald-500/20">
                                        <CheckIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400">Relatório Enviado! 🌟</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sua atividade mensal foi enviada com sucesso ao Secretário.</p>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-left grid grid-cols-2 gap-3 divide-x divide-slate-100 dark:divide-white/5">
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Pregação</p>
                                            <p className="text-lg font-black text-slate-800 dark:text-white">{participated ? 'Participei' : 'Não Participei'}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Estudos</p>
                                            <p className="text-lg font-black text-slate-800 dark:text-white">{reportStudies}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={generateMonthlyPDF}
                                            className="flex-1 py-3 text-xs font-bold ring-1 ring-slate-200 dark:ring-white/15 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <DocumentArrowDownIcon className="h-4 w-4" /> PDF
                                        </button>
                                        <button 
                                            onClick={() => {
                                                // Quick resubmission or toggle of submitted state
                                                if (currentRecord) {
                                                    setPioneerRecord({ ...currentRecord, submitted: false });
                                                    loadData();
                                                }
                                            }}
                                            className="flex-1 py-3 text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white rounded-xl hover:bg-black transition-colors"
                                        >
                                            Editar Relatório
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Streamlined Form for Publishers */
                                <div className="space-y-8">
                                    <div className="border-b border-slate-100 dark:border-white/5 pb-4">
                                        <h3 className="text-md font-extrabold text-slate-800 dark:text-white">Enviar Fechamento Mensal</h3>
                                        <p className="text-xs text-slate-400 mt-1">Preencha os dados simples de serviço para este mês.</p>
                                    </div>

                                    {/* Participated Field */}
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Participou no serviço este mês?</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setParticipated(true)}
                                                className={`py-3.5 text-center font-extrabold rounded-2xl border-2 transition-all ${
                                                    participated === true
                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                                                    : 'bg-white dark:bg-slate-900 border-slate-250 dark:border-white/5 text-slate-500 hover:bg-slate-50'
                                                }`}
                                            >
                                                Sim, Participei
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setParticipated(false);
                                                    setReportHours(0);
                                                }}
                                                className={`py-3.5 text-center font-extrabold rounded-2xl border-2 transition-all ${
                                                    participated === false
                                                    ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/10'
                                                    : 'bg-white dark:bg-slate-900 border-slate-250 dark:border-white/5 text-slate-500 hover:bg-slate-50'
                                                }`}
                                            >
                                                Não Participei
                                            </button>
                                        </div>
                                    </div>

                                    {participated && (
                                        <AnimatePresence>
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="space-y-6"
                                            >
                                                {/* Bible Studies Selector */}
                                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl">
                                                    <div>
                                                        <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">Estudos Bíblicos</h4>
                                                        <p className="text-[10px] text-slate-400">Dirigidos no mês</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => setReportStudies(Math.max(0, reportStudies - 1))}
                                                            className="h-10 w-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 font-black text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors flex items-center justify-center"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="text-lg font-black text-slate-800 dark:text-white w-6 text-center">{reportStudies}</span>
                                                        <button 
                                                            onClick={() => setReportStudies(reportStudies + 1)}
                                                            className="h-10 w-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 font-black text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors flex items-center justify-center"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Optional Hours Input */}
                                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl">
                                                    <div>
                                                        <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">Horas (Opcional)</h4>
                                                        <p className="text-[10px] text-slate-400">Tempo dedicado à pregação</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => setReportHours(Math.max(0, reportHours - 1))}
                                                            className="h-10 w-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 font-black text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors flex items-center justify-center"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="text-lg font-black text-slate-800 dark:text-white w-6 text-center">{reportHours}</span>
                                                        <button 
                                                            onClick={() => setReportHours(reportHours + 1)}
                                                            className="h-10 w-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 font-black text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors flex items-center justify-center"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </AnimatePresence>
                                    )}

                                    {/* Textarea Notes */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Observações</label>
                                        <textarea
                                            value={reportNotes}
                                            onChange={(e) => setReportNotes(e.target.value)}
                                            placeholder="Tema das revisitas, campanhas especiais, etc..."
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all resize-none text-slate-700 dark:text-slate-100"
                                            rows={3}
                                        />
                                    </div>

                                    {/* Big submit CTA */}
                                    <button
                                        onClick={handleSubmitMonthlyReport}
                                        className="w-full py-4 bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShareIcon className="h-5 w-5" /> Salvar & Enviar por WhatsApp
                                    </button>
                                </div>
                            )}

                        </motion.div>
                    ) : (
                        
                        /* ==================== 2. PIONEER TRACKER & CLOSE OUT ==================== */
                        <motion.div 
                            key="pioneer_layout"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            
                            {/* Pioneer Stats Overview */}
                            {pioneerMetrics && (
                                <div className="space-y-6 py-4 transition-all">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalHoursCompleted.toFixed(1)}h</p>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Realizadas de {pioneerMetrics.goal}h</p>
                                        </div>
                                        <div className="text-right">
                                            <button 
                                                onClick={() => {
                                                    setTempGoalHours(pioneerMetrics.goal);
                                                    setIsGoalModalOpen(true);
                                                }}
                                                className="text-[10px] text-primary hover:underline font-extrabold uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-xl transition-colors"
											>
                                                Definir Alvo
                                            </button>
                                        </div>
                                    </div>

                                    {/* Linear Progress Bar */}
                                    <div className="relative">
                                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                style={{ width: `${pioneerMetrics.percent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-2">
                                            <span>{pioneerMetrics.percent.toFixed(0)}% Concluído</span>
                                            <span>Faltam {pioneerMetrics.remaining.toFixed(1)} horas</span>
                                        </div>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl text-center">
                                            <p className="text-xs text-slate-400 font-extrabold tracking-wider uppercase">Faltam Horas</p>
                                            <span className="text-lg font-black text-slate-800 dark:text-white mt-1 block">{pioneerMetrics.remaining.toFixed(1)}h</span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl text-center">
                                            <p className="text-xs text-slate-400 font-extrabold tracking-wider uppercase">Média Diária</p>
                                            <span className="text-lg font-black text-slate-800 dark:text-white mt-1 block">{pioneerMetrics.avgDaily}h / dia</span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-[10px] text-center text-slate-400 italic">Previsão baseada em {pioneerMetrics.daysLeft} dias restantes neste mês.</p>
                                </div>
                            )}

                            {/* Pioneer Dashboard Navigation Tabs */}
                            <div className="flex border-b border-slate-200 dark:border-white/10 gap-6">
                                <button
                                    onClick={() => setActiveTab('tracker')}
                                    className={`py-3 text-sm font-black border-b-2 transition-all relative ${
                                        activeTab === 'tracker'
                                        ? 'border-indigo-500 text-slate-900 dark:text-white'
                                        : 'border-transparent text-slate-400'
                                    }`}
                                >
                                    Diário de Bordo
                                </button>
                                <button
                                    onClick={() => setActiveTab('reports')}
                                    className={`py-3 text-sm font-black border-b-2 transition-all relative ${
                                        activeTab === 'reports'
                                        ? 'border-indigo-500 text-slate-900 dark:text-white'
                                        : 'border-transparent text-slate-400'
                                    }`}
                                >
                                    Enviar Fechamento ({selectedMonth.split('-')[1]})
                                </button>
                            </div>

                            {/* ================= TAB 1: DIÁRIO DE BORDO ================= */}
                            {activeTab === 'tracker' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Registros de Tempo</h3>
                                        <button 
                                            onClick={() => {
                                                setEditingActivity(null);
                                                setIsActivityModalOpen(true);
                                            }}
                                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 transition-colors text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-500/10"
                                        >
                                            <PlusIcon className="h-4 w-4" /> Novo Registro
                                        </button>
                                    </div>

                                    {currentRecord?.activities && currentRecord.activities.length > 0 ? (
                                        <div className="border-t border-b border-slate-200 dark:border-white/10 divide-y divide-slate-150 dark:divide-white/5 transition-all">
                                            {[...currentRecord.activities]
                                                .sort((a, b) => b.date.localeCompare(a.date))
                                                .map((act) => {
                                                    const d = new Date(act.date + 'T12:00:00');
                                                    return (
                                                        <div key={act.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-905 text-slate-600 dark:text-slate-300 rounded-xl flex flex-col items-center justify-center">
                                                                    <span className="text-[9px] font-black leading-none uppercase text-slate-400">{d.toLocaleString('pt-BR', { weekday: 'short' })}</span>
                                                                    <span className="text-md font-extrabold leading-none mt-1">{d.getDate()}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{act.hours}h {act.minutes > 0 ? `${act.minutes}m` : ''}</p>
                                                                    <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-slate-500 mt-1 inline-block">{act.category || 'Pregação'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => {
                                                                        setEditingActivity(act);
                                                                        setIsActivityModalOpen(true);
                                                                    }}
                                                                    className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                                                                >
                                                                    <PencilIcon className="h-4 w-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteActivity(act.id)}
                                                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 p-12 text-center rounded-3xl space-y-4">
                                            <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                                                <TrophyIcon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-md font-bold text-slate-800 dark:text-white">Nenhum registro lançado</p>
                                                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Lançar sua atividade diária ajuda você a acompanhar sua meta de pioneiro facilmente.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Annual comparative chart */}
                                    <div className="py-6 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <ChartBarIcon className="h-4 w-4" /> Evolução Mensal ({selectedYear})
                                            </h4>
                                        </div>
                                        <div className="h-48 w-full mt-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={historyChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" className="dark:hidden" />
                                                    <XAxis 
                                                        dataKey="name" 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                                    />
                                                    <YAxis 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                                    />
                                                    <Tooltip 
                                                        cursor={{ fill: 'transparent' }}
                                                        contentStyle={{ 
                                                            borderRadius: '12px', 
                                                            border: 'none', 
                                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                            backgroundColor: '#1e293b',
                                                            color: '#fff',
                                                            fontSize: '11px'
                                                        }}
                                                    />
                                                    <Bar dataKey="horas" radius={[4, 4, 0, 0]}>
                                                        {historyChartData.map((entry, index) => (
                                                            <Cell 
                                                                key={`cell-${index}`} 
                                                                fill={entry.horas > 0 ? '#6366f1' : '#f1f5f9'} 
                                                                onClick={() => {
                                                                    setSelectedMonth(entry.monthStr);
                                                                }}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ================= TAB 2: ENVIAR FECHAMENTO ================= */}
                            {activeTab === 'reports' && (
                                <div className="space-y-6">
                                    {currentRecord?.submitted ? (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl text-center space-y-4">
                                            <div className="h-12 w-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl shadow-lg shadow-emerald-500/20">
                                                <CheckIcon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400">Relatório Enviado! 🚀</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Seu relatório de pioneiro foi gravado e compartilhado com sucesso.</p>
                                            </div>

                                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-left grid grid-cols-3 gap-2">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Horas</p>
                                                    <p className="text-md font-black text-slate-800 dark:text-white">{reportHours}h</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Estudos</p>
                                                    <p className="text-md font-black text-slate-800 dark:text-white">{reportStudies}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Revisitas</p>
                                                    <p className="text-md font-black text-slate-800 dark:text-white">{reportRevisits}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={generateMonthlyPDF}
                                                    className="flex-1 py-3 text-xs font-bold ring-1 ring-slate-200 dark:ring-white/15 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <DocumentArrowDownIcon className="h-4 w-4" /> PDF
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (currentRecord) {
                                                            setPioneerRecord({ ...currentRecord, submitted: false });
                                                            loadData();
                                                        }
                                                    }}
                                                    className="flex-1 py-3 text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white rounded-xl hover:bg-black transition-colors"
                                                >
                                                    Editar Relatório
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 py-4">
                                            <div>
                                                <h3 className="text-md font-extrabold text-slate-800 dark:text-white">Fechamento Mensal de Pioneiro</h3>
                                                <p className="text-xs text-slate-400 mt-1">Revise os números gerados automaticamente do seu diário de bordo.</p>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Total Hours Input */}
                                                <div className="bg-slate-50 dark:bg-slate-900/55 p-4 rounded-2xl flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">Horas Realizadas</h4>
                                                        <p className="text-[10px] text-slate-400">Puxadas automaticamente do diário de bordo</p>
                                                    </div>
                                                    <input 
                                                        type="number"
                                                        value={reportHours}
                                                        onChange={(e) => setReportHours(parseFloat(e.target.value) || 0)}
                                                        className="w-20 p-2 text-center text-md font-black bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white"
                                                    />
                                                </div>

                                                {/* Total Studies Input */}
                                                <div className="bg-slate-50 dark:bg-slate-900/55 p-4 rounded-2xl flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">Estudos Bíblicos</h4>
                                                        <p className="text-[10px] text-slate-400">Dirigidos durante o mês inteiro</p>
                                                    </div>
                                                    <input 
                                                        type="number"
                                                        value={reportStudies}
                                                        onChange={(e) => setReportStudies(parseInt(e.target.value) || 0)}
                                                        className="w-20 p-2 text-center text-md font-black bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white"
                                                    />
                                                </div>

                                                {/* Total Revisits Input */}
                                                <div className="bg-slate-50 dark:bg-slate-900/55 p-4 rounded-2xl flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">Revisitas Feitas</h4>
                                                        <p className="text-[10px] text-slate-400">Visitas de retorno realizadas</p>
                                                    </div>
                                                    <input 
                                                        type="number"
                                                        value={reportRevisits}
                                                        onChange={(e) => setReportRevisits(parseInt(e.target.value) || 0)}
                                                        className="w-20 p-2 text-center text-md font-black bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Observações adicionais</label>
                                                <textarea
                                                    value={reportNotes}
                                                    onChange={(e) => setReportNotes(e.target.value)}
                                                    placeholder="Acrescente alguma observação (ex: auxílio pioneiro temporário...)"
                                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all resize-none text-slate-700 dark:text-slate-100"
                                                    rows={3}
                                                />
                                            </div>

                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={generateMonthlyPDF}
                                                    className="px-4 py-4 ring-1 ring-slate-200 dark:ring-white/10 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <DocumentTextIcon className="h-5 w-5" /> PDF
                                                </button>
                                                <button
                                                    onClick={handleSubmitMonthlyReport}
                                                    className="flex-1 py-4 bg-slate-900 dark:bg-emerald-600 hover:opacity-90 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                                                >
                                                    <ShareIcon className="h-5 w-5" /> Fechar & Compartilhar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </motion.div>
                    )}

                </AnimatePresence>
            )}

            {/* Daily Record Logging Modal */}
            <ActivityModal 
                isOpen={isActivityModalOpen} 
                onClose={() => { setIsActivityModalOpen(false); setEditingActivity(null); }} 
                onSave={handleAddOrUpdateActivity} 
                initialData={editingActivity}
                defaultMonth={selectedMonth}
            />

            {/* Toast Updates */}
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />

            {/* Confirm Actions Modals */}
            <ConfirmationModal 
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDeleteActivity}
                title="Excluir Registro"
                message="Tem certeza que deseja excluir esta atividade de seu diário? Esta ação não pode ser desfeita."
            />

            <ConfirmationModal 
                isOpen={isReportOverwriteConfirmOpen}
                onClose={() => setIsReportOverwriteConfirmOpen(false)}
                onConfirm={processReportSubmission}
                title="Substituir Relatório"
                message="Você já enviou um relatório para este mês. Deseja editá-lo/substituí-lo?"
            />

            {/* Modal: Identificar Nome e Grupo para Envio */}
            <AnimatePresence>
                {isNameModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsNameModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        
                        {/* Modal Body */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[32px] p-6 w-full max-w-sm shadow-2xl relative z-10 border border-slate-100 dark:border-white/5 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full -mr-8 -mt-8 font-sans"></div>
                            
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 font-outfit">Quem está enviando?</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 font-sans">
                                Identifique seu nome e grupo de serviço de campo para que o Secretário possa arquivar corretamente nas fichas da congregação.
                            </p>
                            
                            <form onSubmit={handleConfirmName} className="space-y-4 font-sans">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans">Nome Completo</label>
                                    <input 
                                        type="text"
                                        required
                                        value={tempPublisherName}
                                        onChange={(e) => setTempPublisherName(e.target.value)}
                                        placeholder="Ex: João Silva"
                                        className="w-full bg-slate-50 dark:bg-slate-800/80 border-none rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/30 transition-all font-sans"
                                    />
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans">Grupo de Campo</label>
                                    <select 
                                        value={tempPublisherGroup}
                                        onChange={(e) => setTempPublisherGroup(e.target.value as '1' | '2' | '3')}
                                        className="w-full bg-slate-50 dark:bg-slate-800/80 border-none rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/30 transition-all cursor-pointer font-sans"
                                    >
                                        <option value="1">Grupo 1</option>
                                        <option value="2">Grupo 2</option>
                                        <option value="3">Grupo 3</option>
                                    </select>
                                </div>
                                
                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsNameModalOpen(false)}
                                        className="flex-1 py-3 text-xs font-bold ring-1 ring-slate-100 dark:ring-white/10 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-sans"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 transition-all font-sans"
                                    >
                                        Confirmar e Enviar
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Definir Alvo de Horas */}
            <AnimatePresence>
                {isGoalModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsGoalModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        
                        {/* Modal Body */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[32px] p-6 w-full max-w-sm shadow-2xl relative z-10 border border-slate-100 dark:border-white/5 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-8 -mt-8 font-sans"></div>
                            
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 font-outfit">Definir Alvo de Horas</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 font-sans">
                                Ajuste a sua meta de horas mensal para acompanhar seu progresso e média diária.
                            </p>
                            
                            <form 
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (tempGoalHours >= 0) {
                                        await handleGoalHoursChange(tempGoalHours);
                                        setIsGoalModalOpen(false);
                                    } else {
                                        setToastMessage('Por favor, insira um valor válido de horas.');
                                    }
                                }} 
                                className="space-y-4 font-sans"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans">Qual é o seu alvo de horas?</label>
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        value={tempGoalHours || ''}
                                        onChange={(e) => setTempGoalHours(Number(e.target.value))}
                                        placeholder="Ex: 50"
                                        className="w-full bg-slate-50 dark:bg-slate-800/80 border-none rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/30 transition-all font-sans"
                                    />
                                </div>
                                
                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsGoalModalOpen(false)}
                                        className="flex-1 py-3 text-xs font-bold ring-1 ring-slate-100 dark:ring-white/10 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-sans"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all font-sans"
                                    >
                                        Salvar Alvo
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Daily Activity Logger submodal ---
const ActivityModal: React.FC<{
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (activity: PioneerActivity) => void, 
    initialData: PioneerActivity | null, 
    defaultMonth: string
}> = ({ isOpen, onClose, onSave, initialData, defaultMonth }) => {
    
    const getTodayStr = () => {
        const d = new Date();
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (yearMonth === defaultMonth) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } else {
            return `${defaultMonth}-01`;
        }
    };

    const [date, setDate] = useState(getTodayStr);
    const [hours, setHours] = useState<number>(1);
    const [minutes, setMinutes] = useState<number>(0);
    const [category, setCategory] = useState<'Pregação' | 'Estudos' | 'Outra'>('Pregação');
    const [revisits, setRevisits] = useState<number>(0);
    const [studies, setStudies] = useState<number>(0);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setDate(initialData.date);
                setHours(initialData.hours);
                setMinutes(initialData.minutes);
                setCategory(initialData.category || 'Pregação');
                setRevisits(initialData.revisits || 0);
                setStudies(initialData.studies || 0);
            } else {
                setDate(getTodayStr());
                setHours(1);
                setMinutes(0);
                setCategory('Pregação');
                setRevisits(0);
                setStudies(0);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[110] p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
                <h4 className="text-lg font-black mb-6 text-center text-slate-800 dark:text-white">
                    {initialData ? 'Editar Registro' : 'Lançar Tempo Diário'}
                </h4>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Data do serviço</label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-white/5 rounded-xl font-bold text-sm text-slate-800 dark:text-white outline-none" 
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Modalidade</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Pregação', 'Estudos', 'Outra'] as const).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                                        category === cat 
                                        ? 'bg-indigo-500 border-indigo-500 text-white shadow-md' 
                                        : 'bg-slate-50 dark:bg-slate-850 border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Horas</label>
                            <input 
                                type="number" 
                                value={hours === 0 ? '' : hours}
                                onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))} 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-white/5 rounded-xl font-bold text-slate-850 dark:text-white outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Minutos</label>
                            <select 
                                value={minutes} 
                                onChange={e => setMinutes(parseInt(e.target.value))} 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-white/5 rounded-xl font-bold text-slate-850 dark:text-white outline-none"
                            >
                                <option value={0}>00 min</option>
                                <option value={15}>15 min</option>
                                <option value={30}>30 min</option>
                                <option value={45}>45 min</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Revisitas (+)</label>
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden px-1 border border-slate-205 dark:border-white/5">
                                <button type="button" onClick={() => setRevisits(Math.max(0, revisits - 1))} className="p-2 text-slate-500 font-bold">-</button>
                                <span className="flex-1 text-center font-bold text-slate-800 dark:text-white text-xs">{revisits}</span>
                                <button type="button" onClick={() => setRevisits(revisits + 1)} className="p-2 text-slate-500 font-bold">+</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Estudos (+)</label>
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden px-1 border border-slate-205 dark:border-white/5">
                                <button type="button" onClick={() => setStudies(Math.max(0, studies - 1))} className="p-2 text-slate-500 font-bold">-</button>
                                <span className="flex-1 text-center font-bold text-slate-800 dark:text-white text-xs">{studies}</span>
                                <button type="button" onClick={() => setStudies(studies + 1)} className="p-2 text-slate-500 font-bold">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-xl font-extrabold text-xs transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => onSave({ 
                            id: initialData?.id || Date.now().toString(), 
                            date, 
                            hours, 
                            minutes, 
                            category, 
                            revisits, 
                            studies 
                        })} 
                        className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl font-extrabold text-xs shadow-md shadow-indigo-500/10 transition-all"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pioneer;
