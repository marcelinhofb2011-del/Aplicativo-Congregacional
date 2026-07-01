import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getPioneerPlanningConfig,
  savePioneerPlanningConfig,
  getPioneerDailyRecords,
  addPioneerDailyRecord,
  updatePioneerDailyRecord,
  deletePioneerDailyRecord,
  getPublisherProfileByUid,
} from "../services/firestoreService";
import { PioneerPlanningConfig, PioneerDailyRecord, PublisherProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  TrendingUp,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  Plane,
  Award,
  AlertCircle,
  CheckCircle2,
  CalendarRange,
  Heart,
  Save,
  X,
  PlusCircle,
  HelpCircle,
  Activity,
  Check
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const PioneerPlanning: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublisherProfile | null>(null);
  const [config, setConfig] = useState<PioneerPlanningConfig | null>(null);
  const [dailyRecords, setDailyRecords] = useState<PioneerDailyRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "records" | "stats" | "simulator" | "settings">("dashboard");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Reference month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PioneerDailyRecord | null>(null);
  const [recordForm, setRecordForm] = useState({
    date: "",
    hours: 0,
    minutes: 0,
    studies: 0,
    revisits: 0,
    videos: 0,
    publications: 0,
    notes: ""
  });

  // Setup Form States
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupForm, setSetupForm] = useState({
    monthlyGoal: 50,
    quarterlyGoal: 150,
    annualGoal: 600,
    preachingDays: [2, 4, 6] as number[], // default: Ter, Qui, Sáb
    vacations: [] as { id: string; startDate: string; endDate: string; description: string }[]
  });

  // Vacation Period addition state
  const [newVacation, setNewVacation] = useState({
    startDate: "",
    endDate: "",
    description: ""
  });

  // Simulator State
  const [simTargetDays, setSimTargetDays] = useState<number[]>([]); // days of week
  const [simTravelStart, setSimTravelStart] = useState("");
  const [simTravelEnd, setSimTravelEnd] = useState("");
  const [simTargetEndDate, setSimTargetEndDate] = useState("");
  const [simResult, setSimResult] = useState<{
    daysAvailable: number;
    hoursRequired: number;
    hoursPerDay: string;
    weeksAvailable: number;
    hoursPerWeek: string;
    description: string;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load Data
  const loadAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch profile to check if pioneer
      const profileData = await getPublisherProfileByUid(user.uid);
      if (profileData) {
        setProfile(profileData);
      }

      // 2. Fetch planning config
      const configData = await getPioneerPlanningConfig(user.uid);
      if (configData) {
        setConfig(configData);
        setSetupForm({
          monthlyGoal: configData.monthlyGoal || 50,
          quarterlyGoal: configData.quarterlyGoal || 150,
          annualGoal: configData.annualGoal || 600,
          preachingDays: configData.preachingDays || [2, 4, 6],
          vacations: configData.vacations || []
        });
      } else {
        // No config yet, prompt setup
        setIsSetupOpen(true);
      }

      // 3. Fetch daily records
      const records = await getPioneerDailyRecords(user.uid);
      setDailyRecords(records);

    } catch (err) {
      console.error("Error loading planning data:", err);
      showToast("Erro ao carregar dados do planejamento.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  // Current Month calculations
  const monthCalculations = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1;
    const currentDay = today.getDate();

    // Check if showing selected month is in the past, present, or future
    const isPastMonth = year < currentYear || (year === currentYear && month < currentMonthNum);
    const isFutureMonth = year > currentYear || (year === currentYear && month > currentMonthNum);
    const isCurrentMonth = year === currentYear && month === currentMonthNum;

    // Filter daily records for this month
    const monthRecords = dailyRecords.filter(r => r.date.startsWith(selectedMonth));

    // Sum hours, minutes, studies, revisits, etc.
    let totalMinutes = 0;
    let totalStudiesMax = 0;
    let totalRevisits = 0;
    let totalVideos = 0;
    let totalPublications = 0;

    monthRecords.forEach(r => {
      totalMinutes += (r.hours || 0) * 60 + (r.minutes || 0);
      totalRevisits += r.revisits || 0;
      totalVideos += r.videos || 0;
      totalPublications += r.publications || 0;
      totalStudiesMax = Math.max(totalStudiesMax, r.studies || 0);
    });

    const hoursDone = Math.floor(totalMinutes / 60);
    const minutesDone = totalMinutes % 60;
    const decimalHoursDone = parseFloat((totalMinutes / 60).toFixed(1));

    // Goals
    const monthlyGoal = config?.monthlyGoal || 50;

    // Remaining hours
    const remainingMinutesGoal = Math.max(0, (monthlyGoal * 60) - totalMinutes);
    const remainingHours = Math.floor(remainingMinutesGoal / 60);
    const remainingMinutes = remainingMinutesGoal % 60;

    // Calculate Available Preaching Days (Dias Úteis)
    const preachingDays = config?.preachingDays || [2, 4, 6]; // defaults
    const vacations = config?.vacations || [];

    // Count how many total preaching days in this month
    // and how many remaining preaching days in this month
    let totalPreachingDaysInMonth = 0;
    let remainingPreachingDaysInMonth = 0;
    let travelDaysInMonth = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      // Check if this date falls within a travel range
      const isTravelDay = vacations.some(v => {
        const start = new Date(v.startDate + "T00:00:00");
        const end = new Date(v.endDate + "T00:00:00");
        return dateObj >= start && dateObj <= end;
      });

      const isPreachingDay = preachingDays.includes(dayOfWeek);

      if (isTravelDay) {
        travelDaysInMonth++;
      }

      if (isPreachingDay && !isTravelDay) {
        totalPreachingDaysInMonth++;
        
        if (isCurrentMonth) {
          if (d >= currentDay) {
            remainingPreachingDaysInMonth++;
          }
        } else if (isFutureMonth) {
          remainingPreachingDaysInMonth++;
        }
      }
    }

    // Days remaining in month
    let calendarDaysRemaining = 0;
    if (isCurrentMonth) {
      calendarDaysRemaining = daysInMonth - currentDay + 1;
    } else if (isFutureMonth) {
      calendarDaysRemaining = daysInMonth;
    }

    // Required average hours per preaching day
    const requiredMinPerPreachingDay = remainingPreachingDaysInMonth > 0 
      ? remainingMinutesGoal / remainingPreachingDaysInMonth
      : 0;
    
    const requiredHoursPerPreachingDay = Math.floor(requiredMinPerPreachingDay / 60);
    const requiredMinRemainder = Math.round(requiredMinPerPreachingDay % 60);

    const progressPercentage = Math.min(100, Math.round((totalMinutes / (monthlyGoal * 60)) * 100));

    // ADVISORY LOGIC (PIONEER INTELLIGENCE ENGINE)
    const tips: string[] = [];
    const daysPassedInMonth = isCurrentMonth ? currentDay : (isPastMonth ? daysInMonth : 0);
    const totalDaysInMonth = daysInMonth;

    // Calculated proportional target for today
    const proportionalTargetMin = Math.round((monthlyGoal * 60) * (daysPassedInMonth / totalDaysInMonth));
    const paceDiffMin = totalMinutes - proportionalTargetMin;
    const paceHours = Math.abs(Math.floor(paceDiffMin / 60));
    const paceMinutes = Math.abs(Math.round(paceDiffMin % 60));

    if (isCurrentMonth) {
      if (paceDiffMin >= 0) {
        tips.push(`Você está adiantado ${paceHours}h${paceMinutes > 0 ? paceMinutes + "m" : ""} em relação ao ritmo proporcional do mês.`);
        tips.push("Se continuar nessa média, concluirá sua meta de horas antes do previsto com facilidade!");
      } else {
        tips.push(`Você está atrás do ritmo ideal do mês por cerca de ${paceHours}h${paceMinutes > 0 ? paceMinutes + "m" : ""}.`);
      }

      if (remainingMinutesGoal <= 0) {
        tips.push("Parabéns! Você alcançou sua meta de horas para este mês! 🎉");
      } else {
        if (requiredMinPerPreachingDay > 0) {
          tips.push(`Hoje bastam ${requiredHoursPerPreachingDay}h${requiredMinRemainder > 0 ? requiredMinRemainder + "m" : ""} por dia de pregação programado para cumprir a meta.`);
        }
        
        // Travel advice
        const hoursNeeded = remainingMinutesGoal / 60;
        const currentAvgPerHour = totalMinutes > 0 ? (totalMinutes / 60) / Math.max(1, monthRecords.length) : 0;
        if (currentAvgPerHour > 0) {
          const daysCanTravel = Math.floor((remainingPreachingDaysInMonth * currentAvgPerHour - hoursNeeded) / currentAvgPerHour);
          if (daysCanTravel > 0) {
            tips.push(`Você pode tirar até ${daysCanTravel} dia(s) de folga sem comprometer sua meta se mantiver a média de pregação atual.`);
          }
        }
        
        if (remainingHours <= 12) {
          tips.push(`Faltam apenas ${remainingHours}h${remainingMinutes > 0 ? remainingMinutes + "m" : ""} para concluir seu objetivo mensal. Você está quase lá!`);
        }
      }
    } else if (isPastMonth) {
      if (totalMinutes >= monthlyGoal * 60) {
        tips.push("Meta concluída com sucesso neste mês! Excelente serviço! 🌟");
      } else {
        tips.push(`Neste mês você encerrou com ${hoursDone}h de pregação, atingindo ${progressPercentage}% da meta.`);
      }
    }

    return {
      daysInMonth,
      monthRecords,
      hoursDone,
      minutesDone,
      decimalHoursDone,
      remainingHours,
      remainingMinutes,
      totalPreachingDaysInMonth,
      remainingPreachingDaysInMonth,
      calendarDaysRemaining,
      requiredHoursPerPreachingDay,
      requiredMinRemainder,
      progressPercentage,
      travelDaysInMonth,
      totalStudiesMax,
      totalRevisits,
      totalVideos,
      totalPublications,
      tips,
      isCurrentMonth,
      isPastMonth,
      isFutureMonth,
    };
  }, [dailyRecords, config, selectedMonth]);

  // Open record form
  const handleOpenRecordModal = (record: PioneerDailyRecord | null, initialDate?: string) => {
    if (record) {
      setSelectedRecord(record);
      setRecordForm({
        date: record.date,
        hours: record.hours,
        minutes: record.minutes,
        studies: record.studies,
        revisits: record.revisits || 0,
        videos: record.videos || 0,
        publications: record.publications || 0,
        notes: record.notes || ""
      });
    } else {
      setSelectedRecord(null);
      setRecordForm({
        date: initialDate || new Date().toISOString().split("T")[0],
        hours: 2,
        minutes: 0,
        studies: 0,
        revisits: 0,
        videos: 0,
        publications: 0,
        notes: ""
      });
    }
    setIsRecordModalOpen(true);
  };

  // Submit daily record
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const dataToSave = {
        date: recordForm.date,
        hours: Number(recordForm.hours),
        minutes: Number(recordForm.minutes),
        studies: Number(recordForm.studies),
        revisits: Number(recordForm.revisits),
        videos: Number(recordForm.videos),
        publications: Number(recordForm.publications),
        notes: recordForm.notes
      };

      if (selectedRecord) {
        await updatePioneerDailyRecord(selectedRecord.id, dataToSave, user.uid);
        showToast("Registro diário atualizado com sucesso!");
      } else {
        await addPioneerDailyRecord(dataToSave, user.uid);
        showToast("Atividade registrada com sucesso!");
      }

      setIsRecordModalOpen(false);
      loadAllData();
    } catch (err) {
      console.error("Error saving daily record:", err);
      showToast("Erro ao salvar atividade.", "error");
    }
  };

  // Delete daily record
  const handleRecordDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    try {
      await deletePioneerDailyRecord(id);
      showToast("Registro excluído com sucesso!");
      setIsRecordModalOpen(false);
      loadAllData();
    } catch (err) {
      console.error("Error deleting daily record:", err);
      showToast("Erro ao excluir registro.", "error");
    }
  };

  // Save Config Setup
  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const configData = {
        monthlyGoal: Number(setupForm.monthlyGoal),
        quarterlyGoal: Number(setupForm.quarterlyGoal),
        annualGoal: Number(setupForm.annualGoal),
        preachingDays: setupForm.preachingDays,
        vacations: setupForm.vacations
      };

      await savePioneerPlanningConfig(user.uid, configData);
      showToast("Configurações do pioneiro atualizadas!");
      setIsSetupOpen(false);
      loadAllData();
    } catch (err) {
      console.error("Error saving setup:", err);
      showToast("Erro ao salvar configurações.", "error");
    }
  };

  // Handle Day preaching select/deselect
  const togglePreachingDay = (dayIndex: number) => {
    setSetupForm(prev => {
      const current = [...prev.preachingDays];
      if (current.includes(dayIndex)) {
        return { ...prev, preachingDays: current.filter(d => d !== dayIndex) };
      } else {
        return { ...prev, preachingDays: [...current, dayIndex].sort() };
      }
    });
  };

  // Vacation Periods addition
  const addVacationPeriod = () => {
    if (!newVacation.startDate || !newVacation.endDate || !newVacation.description.trim()) {
      showToast("Preencha todas as informações do período de viagem.", "error");
      return;
    }

    const vacationObj = {
      id: Math.random().toString(36).substring(2, 9),
      startDate: newVacation.startDate,
      endDate: newVacation.endDate,
      description: newVacation.description
    };

    setSetupForm(prev => ({
      ...prev,
      vacations: [...prev.vacations, vacationObj]
    }));

    setNewVacation({ startDate: "", endDate: "", description: "" });
    showToast("Período de viagem adicionado à lista!");
  };

  // Vacation remove
  const removeVacationPeriod = (id: string) => {
    setSetupForm(prev => ({
      ...prev,
      vacations: prev.vacations.filter(v => v.id !== id)
    }));
  };

  // Run Planning Simulator
  const runPlanningSimulator = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthlyGoal = config?.monthlyGoal || 50;

    // Filter preaching days for simulation
    const activeDays = simTargetDays.length > 0 ? simTargetDays : (config?.preachingDays || [2, 4, 6]);
    const travelStart = simTravelStart ? new Date(simTravelStart + "T00:00:00") : null;
    const travelEnd = simTravelEnd ? new Date(simTravelEnd + "T00:00:00") : null;
    const limitDate = simTargetEndDate ? new Date(simTargetEndDate + "T23:59:59") : null;

    let simulatedAvailableDays = 0;
    let detailsList: string[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();

      // Check limit date (e.g. "finish preaching until day 25")
      if (limitDate && dateObj > limitDate) {
        continue;
      }

      // Check travel dates
      let isTravel = false;
      if (travelStart && travelEnd) {
        isTravel = dateObj >= travelStart && dateObj <= travelEnd;
      }

      if (activeDays.includes(dayOfWeek) && !isTravel) {
        simulatedAvailableDays++;
      }
    }

    if (simulatedAvailableDays === 0) {
      setSimResult({
        daysAvailable: 0,
        hoursRequired: monthlyGoal,
        hoursPerDay: "0",
        weeksAvailable: 0,
        hoursPerWeek: "0",
        description: "Não há dias de pregação programados disponíveis na simulação com esses filtros."
      });
      return;
    }

    // Calculations
    const hoursPerDayDecimal = monthlyGoal / simulatedAvailableDays;
    const hoursInt = Math.floor(hoursPerDayDecimal);
    const minutesRemainder = Math.round((hoursPerDayDecimal - hoursInt) * 60);

    const hoursPerWeekDecimal = (monthlyGoal / simulatedAvailableDays) * Math.min(simulatedAvailableDays, activeDays.length);
    const hoursWeekInt = Math.floor(hoursPerWeekDecimal);
    const minutesWeekRemainder = Math.round((hoursPerWeekDecimal - hoursWeekInt) * 60);

    let desc = `Se você pregar apenas às ${activeDays.map(d => DAYS_OF_WEEK[d]).join(", ")}, `;
    if (travelStart && travelEnd) {
      desc += `desconsiderando a viagem de ${travelStart.toLocaleDateString("pt-BR")} a ${travelEnd.toLocaleDateString("pt-BR")}, `;
    }
    if (limitDate) {
      desc += `e encerrando todas as atividades até dia ${limitDate.toLocaleDateString("pt-BR")}, `;
    }
    desc += `você terá ${simulatedAvailableDays} dias de campo ativos para concluir suas ${monthlyGoal} horas.`;

    setSimResult({
      daysAvailable: simulatedAvailableDays,
      hoursRequired: monthlyGoal,
      hoursPerDay: `${hoursInt}h${minutesRemainder > 0 ? minutesRemainder + "m" : ""}`,
      weeksAvailable: parseFloat((simulatedAvailableDays / activeDays.length).toFixed(1)),
      hoursPerWeek: `${hoursWeekInt}h${minutesWeekRemainder > 0 ? minutesWeekRemainder + "m" : ""}`,
      description: desc
    });
  };

  // Calendar render functions
  const calendarCells = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    
    // Add placeholders for empty days at the start of the month
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dateStr: "", isPlaceholder: true, dayNum: 0 });
    }

    const preachingDays = config?.preachingDays || [2, 4, 6];
    const vacations = config?.vacations || [];

    // Populate actual days
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const cellDateObj = new Date(year, month, day);
      const dayOfWeek = cellDateObj.getDay();

      // Find record
      const dayRecord = dailyRecords.find(r => r.date === dateStr);

      // Check vacation
      const isVacation = vacations.some(v => {
        const start = new Date(v.startDate + "T00:00:00");
        const end = new Date(v.endDate + "T00:00:00");
        return cellDateObj >= start && cellDateObj <= end;
      });

      // Is scheduled preaching day
      const isPreachingDay = preachingDays.includes(dayOfWeek);

      // Determine status
      let status: "no_entry" | "entry_made" | "target_met" | "target_below" | "vacation" | "unavailable" = "no_entry";
      
      if (isVacation) {
        status = "vacation";
      } else if (!isPreachingDay) {
        status = "unavailable";
      }

      if (dayRecord) {
        const totalMinutes = (dayRecord.hours || 0) * 60 + (dayRecord.minutes || 0);
        // Let's say a daily average is ~2h30m (150 mins). If they did 2h or more, it's green.
        if (totalMinutes >= 120) {
          status = "target_met";
        } else {
          status = "target_below";
        }
      }

      cells.push({
        dateStr,
        isPlaceholder: false,
        dayNum: day,
        record: dayRecord || null,
        status,
        isPreachingDay,
        isVacation
      });
    }

    return cells;
  }, [currentCalendarDate, dailyRecords, config]);

  // Handle month switcher in calendar
  const handleCalendarMonthChange = (direction: "prev" | "next") => {
    setCurrentCalendarDate(prev => {
      const d = new Date(prev.getFullYear(), prev.getMonth() + (direction === "next" ? 1 : -1), 1);
      // Synchronize reference month if needed
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      return d;
    });
  };

  // Sync Calendar view when Selected Month switcher changes
  useEffect(() => {
    const [yr, mo] = selectedMonth.split("-").map(Number);
    if (currentCalendarDate.getFullYear() !== yr || currentCalendarDate.getMonth() !== mo - 1) {
      setCurrentCalendarDate(new Date(yr, mo - 1, 1));
    }
  }, [selectedMonth]);

  // Statistics Chart Data
  const chartsData = useMemo(() => {
    const monthRecords = dailyRecords.filter(r => r.date.startsWith(selectedMonth));

    // Sort by date ascending
    monthRecords.sort((a, b) => a.date.localeCompare(b.date));

    // 1. Hours per week (Divide 1-7, 8-14, 15-21, 22+)
    const weeklyData = [
      { name: "Sem 1 (1-7)", horas: 0, estudos: 0 },
      { name: "Sem 2 (8-14)", horas: 0, estudos: 0 },
      { name: "Sem 3 (15-21)", horas: 0, estudos: 0 },
      { name: "Sem 4 (22+)", horas: 0, estudos: 0 }
    ];

    // 2. Day productivity (Sunday to Saturday)
    const dayOfWeekData = DAYS_OF_WEEK.map(day => ({ name: day, horas: 0, count: 0 }));

    monthRecords.forEach(r => {
      const dayNum = Number(r.date.split("-")[2]);
      const hoursDecimal = (r.hours || 0) + (r.minutes || 0) / 60;
      
      // Weekly distribution
      if (dayNum <= 7) {
        weeklyData[0].horas += hoursDecimal;
        weeklyData[0].estudos += r.studies || 0;
      } else if (dayNum <= 14) {
        weeklyData[1].horas += hoursDecimal;
        weeklyData[1].estudos += r.studies || 0;
      } else if (dayNum <= 21) {
        weeklyData[2].horas += hoursDecimal;
        weeklyData[2].estudos += r.studies || 0;
      } else {
        weeklyData[3].horas += hoursDecimal;
        weeklyData[3].estudos += r.studies || 0;
      }

      // Day of week distribution
      const dateObj = new Date(r.date + "T00:00:00");
      const dow = dateObj.getDay();
      dayOfWeekData[dow].horas += hoursDecimal;
      dayOfWeekData[dow].count += 1;
    });

    // Formatting decimals
    const formattedWeekly = weeklyData.map(w => ({
      ...w,
      horas: parseFloat(w.horas.toFixed(1))
    }));

    const formattedDow = dayOfWeekData.map(d => ({
      ...d,
      horas: parseFloat(d.horas.toFixed(1))
    })).filter(d => d.horas > 0);

    return {
      weekly: formattedWeekly,
      daysProductivity: formattedDow,
      hasData: monthRecords.length > 0
    };
  }, [dailyRecords, selectedMonth]);

  // Format reference month switcher choices (show past 6 months and next 2 months)
  const renderedMonthsList = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = -6; i <= 2; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return list;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : toast.type === "error"
                ? "bg-rose-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            {toast.type === "success" && <Check className="h-4 w-4" />}
            {toast.type === "error" && <AlertCircle className="h-4 w-4" />}
            {toast.type === "info" && <Info className="h-4 w-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-white/5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                Planejamento do Pioneiro
                <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-black">
                  Exclusivo
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gerencie metas, registre horas e simule cronogramas inteligentes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Month Switcher Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              {renderedMonthsList.map((mStr) => {
                const [yr, mo] = mStr.split("-").map(Number);
                return (
                  <option key={mStr} value={mStr}>
                    {MONTHS_PT[mo - 1]} de {yr}
                  </option>
                );
              })}
            </select>

            <button
              id="btn_add_record_main"
              onClick={() => handleOpenRecordModal(null)}
              className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/10"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar Dia</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto border-t border-slate-100 dark:border-white/5">
          <div className="flex gap-2 py-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "dashboard"
                  ? "bg-amber-500/10 text-amber-500 font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Painel Inteligente
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "records"
                  ? "bg-amber-500/10 text-amber-500 font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Lançamentos & Calendário
            </button>
            <button
              onClick={() => setActiveTab("simulator")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "simulator"
                  ? "bg-amber-500/10 text-amber-500 font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Simulador de Horas
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "stats"
                  ? "bg-amber-500/10 text-amber-500 font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Estatísticas
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "settings"
                  ? "bg-amber-500/10 text-amber-500 font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Minhas Metas
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Space */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Activity className="h-10 w-10 text-amber-500 animate-pulse mb-3" />
            <span className="text-xs font-bold text-slate-400">Carregando dados do planejador...</span>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Warning if user profile doesn't classify them as Pioneer */}
            {profile && !profile.isRegularPioneer && !profile.isAuxiliaryPioneer && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 flex gap-3 text-xs text-amber-800 dark:text-amber-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-black">Aviso de Perfil</p>
                  <p className="mt-0.5">
                    Você está acessando o módulo de planejamento, mas seu perfil não está marcado como pioneiro regular ou auxiliar.
                    Caso queira atualizar sua designação para receber notificações precisas, faça no painel de Ajustes de Perfil.
                  </p>
                </div>
              </div>
            )}

            {/* =======================================================
                TAB 1: PAINEL INTELIGENTE
               ======================================================= */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Stats Cards Row */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Circle Dashboard Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-6 sm:p-8 shadow-md">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6">
                      Visão Geral do Mês
                    </h3>
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                      {/* Interactive Circular Indicator */}
                      <div className="relative h-44 w-44 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                            strokeWidth="8"
                          />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="42"
                            className="stroke-amber-500 fill-none"
                            strokeWidth="8"
                            strokeDasharray="263.89"
                            initial={{ strokeDashoffset: 263.89 }}
                            animate={{ strokeDashoffset: 263.89 - (263.89 * monthCalculations.progressPercentage) / 100 }}
                            transition={{ duration: 1 }}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center text-center">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">
                            {monthCalculations.hoursDone}h{monthCalculations.minutesDone > 0 ? monthCalculations.minutesDone : ""}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            Realizadas
                          </span>
                          <span className="text-[11px] text-amber-500 font-black mt-1">
                            {monthCalculations.progressPercentage}% concluído
                          </span>
                        </div>
                      </div>

                      {/* Detail Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Meta Mensal
                          </span>
                          <span className="block text-xl font-black text-slate-800 dark:text-white mt-1">
                            {config?.monthlyGoal || 50} horas
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Falta Realizar
                          </span>
                          <span className="block text-xl font-black text-slate-800 dark:text-white mt-1 text-amber-500">
                            {monthCalculations.remainingHours}h{monthCalculations.remainingMinutes > 0 ? monthCalculations.remainingMinutes + "m" : ""}
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Dias de Campo Restantes
                          </span>
                          <span className="block text-xl font-black text-slate-800 dark:text-white mt-1">
                            {monthCalculations.remainingPreachingDaysInMonth} dias
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Média por Dia Útil
                          </span>
                          <span className="block text-xl font-black text-slate-800 dark:text-white mt-1 text-emerald-500">
                            {monthCalculations.requiredHoursPerPreachingDay}h{monthCalculations.requiredMinRemainder > 0 ? monthCalculations.requiredMinRemainder + "m" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cumulative monthly results */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-6 shadow-md grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3">
                      <BookOpen className="h-5 w-5 text-blue-500 mx-auto mb-1.5" />
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudos</span>
                      <span className="block text-lg font-black text-slate-900 dark:text-white mt-0.5">{monthCalculations.totalStudiesMax}</span>
                    </div>
                    <div className="text-center p-3">
                      <Heart className="h-5 w-5 text-rose-500 mx-auto mb-1.5" />
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Revisitas</span>
                      <span className="block text-lg font-black text-slate-900 dark:text-white mt-0.5">{monthCalculations.totalRevisits}</span>
                    </div>
                    <div className="text-center p-3">
                      <Clock className="h-5 w-5 text-indigo-500 mx-auto mb-1.5" />
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Vídeos</span>
                      <span className="block text-lg font-black text-slate-900 dark:text-white mt-0.5">{monthCalculations.totalVideos}</span>
                    </div>
                    <div className="text-center p-3">
                      <Award className="h-5 w-5 text-teal-500 mx-auto mb-1.5" />
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Publicações</span>
                      <span className="block text-lg font-black text-slate-900 dark:text-white mt-0.5">{monthCalculations.totalPublications}</span>
                    </div>
                  </div>
                </div>

                {/* Sidebar Intelligent Advisory Card */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-[32px] p-6 sm:p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                      <Sparkles className="h-40 w-40" />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5" />
                      <h4 className="text-xs font-black uppercase tracking-wider">
                        Assistente Virtual do Pioneiro
                      </h4>
                    </div>

                    <p className="text-sm font-black leading-snug">
                      Olá! Vamos fazer suas horas renderem de modo inteligente hoje.
                    </p>

                    <div className="mt-6 space-y-4">
                      {monthCalculations.tips.length > 0 ? (
                        monthCalculations.tips.map((tip, idx) => (
                          <div key={idx} className="flex gap-2.5 text-xs bg-white/10 p-3 rounded-2xl border border-white/10">
                            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                            <span>{tip}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex gap-2.5 text-xs bg-white/10 p-3 rounded-2xl border border-white/10">
                          <Info className="h-4.5 w-4.5 shrink-0" />
                          <span>Adicione os registros das suas pregações diárias para receber as primeiras dicas inteligentes!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Travel / vacation warnings */}
                  {config?.vacations && config.vacations.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-6 shadow-md">
                      <div className="flex items-center gap-2 mb-4">
                        <Plane className="h-5 w-5 text-indigo-500" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          Viagens Cadastradas ({config.vacations.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {config.vacations.map(v => (
                          <div key={v.id} className="text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                            <span className="font-bold block text-slate-800 dark:text-white">{v.description}</span>
                            <span className="text-slate-400 text-[10px] block mt-0.5">
                              {new Date(v.startDate + "T00:00:00").toLocaleDateString("pt-BR")} a {new Date(v.endDate + "T00:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =======================================================
                TAB 2: LANÇAMENTOS E CALENDÁRIO
               ======================================================= */}
            {activeTab === "records" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Calendar Grid (8 Cols) */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-6 shadow-md">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-amber-500" />
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Agenda Mensal
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleCalendarMonthChange("prev")}
                        className="h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </button>
                      <span className="text-xs font-black text-slate-800 dark:text-white min-w-32 text-center uppercase tracking-wide">
                        {MONTHS_PT[currentCalendarDate.getMonth()]} de {currentCalendarDate.getFullYear()}
                      </span>
                      <button
                        onClick={() => handleCalendarMonthChange("next")}
                        className="h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-3">
                    {DAYS_OF_WEEK.map(d => (
                      <div key={d} className="py-1">{d.slice(0, 3)}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarCells.map((cell, idx) => {
                      if (cell.isPlaceholder) {
                        return <div key={`placeholder-${idx}`} className="aspect-square bg-transparent rounded-2xl" />;
                      }

                      // Determine color styling based on status
                      let bgClass = "bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300";
                      let borderClass = "border border-transparent";
                      let dotColor = "";

                      if (cell.status === "vacation") {
                        bgClass = "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300";
                        borderClass = "border border-purple-200 dark:border-purple-500/10";
                      } else if (cell.status === "unavailable") {
                        bgClass = "bg-slate-50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-600 opacity-60";
                      } else if (cell.status === "target_met") {
                        bgClass = "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
                        borderClass = "border border-emerald-200 dark:border-emerald-500/10";
                        dotColor = "bg-emerald-500";
                      } else if (cell.status === "target_below") {
                        bgClass = "bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
                        borderClass = "border border-amber-200 dark:border-amber-500/10";
                        dotColor = "bg-amber-500";
                      } else if (cell.record) {
                        bgClass = "bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300";
                        borderClass = "border border-blue-200 dark:border-blue-500/10";
                      }

                      return (
                        <div
                          key={cell.dateStr}
                          onClick={() => handleOpenRecordModal(cell.record, cell.dateStr)}
                          className={`aspect-square rounded-2xl flex flex-col justify-between p-2 cursor-pointer transition-all ${bgClass} ${borderClass}`}
                        >
                          <span className="text-xs font-black text-left">{cell.dayNum}</span>
                          <div className="flex items-center justify-between">
                            {cell.record ? (
                              <span className="text-[9px] font-black truncate max-w-full">
                                {cell.record.hours}h{cell.record.minutes > 0 ? cell.record.minutes : ""}
                              </span>
                            ) : cell.status === "vacation" ? (
                              <span className="text-[8px] font-black text-purple-500">Viajando</span>
                            ) : (
                              <span />
                            )}
                            {dotColor && <div className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar Legend */}
                  <div className="mt-6 flex flex-wrap gap-4 items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-white/5 pt-4">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3.5 w-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20" />
                      <span>Meta Cumprida</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3.5 w-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20" />
                      <span>Abaixo do Esperado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3.5 w-3.5 rounded-lg bg-purple-500/10 border border-purple-500/20" />
                      <span>Viagem / Férias</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3.5 w-3.5 rounded-lg bg-slate-100 dark:bg-slate-950/20" />
                      <span>Dia não planejado</span>
                    </div>
                  </div>
                </div>

                {/* Daily Records List (4 Cols) */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-6 shadow-md flex flex-col max-h-[600px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Lançamentos do Mês
                    </h3>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-bold px-2.5 py-1 rounded-full text-slate-500 dark:text-slate-300">
                      {monthCalculations.monthRecords.length} lançados
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                    {monthCalculations.monthRecords.length > 0 ? (
                      monthCalculations.monthRecords
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map(r => {
                          const dateObj = new Date(r.date + "T00:00:00");
                          return (
                            <div
                              key={r.id}
                              onClick={() => handleOpenRecordModal(r)}
                              className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                              <div>
                                <span className="block text-xs font-black text-slate-800 dark:text-white">
                                  {dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" })}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  {r.studies > 0 && (
                                    <span className="text-[9px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-black px-1.5 py-0.5 rounded">
                                      {r.studies} {r.studies === 1 ? "estudo" : "estudos"}
                                    </span>
                                  )}
                                  {r.notes && (
                                    <span className="text-[9px] text-slate-400 truncate max-w-32">{r.notes}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="block text-sm font-black text-slate-950 dark:text-white">
                                  {r.hours}h{r.minutes > 0 ? r.minutes : ""}
                                </span>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center">
                        <Info className="h-6 w-6 mb-2" />
                        <span className="text-xs font-bold">Nenhum lançamento neste mês.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =======================================================
                TAB 3: SIMULADOR DE PLANEJAMENTO
               ======================================================= */}
            {activeTab === "simulator" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-6 sm:p-8 shadow-md">
                <div className="flex items-center gap-2 mb-6">
                  <Sliders className="h-5 w-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Simulador de Planejamento Personalizado
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Descubra como estruturar sua pregação conforme suas limitações de viagem e dias de campo.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Inputs */}
                  <div className="space-y-6">
                    {/* Preaching days checkboxes */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Dias em que pode pregar na simulação
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day, idx) => {
                          const active = simTargetDays.includes(idx);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                setSimTargetDays(prev => 
                                  prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                active
                                  ? "bg-amber-500 border-amber-500 text-white font-black"
                                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Simulation travel dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Início da Viagem (Opcional)
                        </label>
                        <input
                          type="date"
                          value={simTravelStart}
                          onChange={(e) => setSimTravelStart(e.target.value)}
                          className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Fim da Viagem (Opcional)
                        </label>
                        <input
                          type="date"
                          value={simTravelEnd}
                          onChange={(e) => setSimTravelEnd(e.target.value)}
                          className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                        />
                      </div>
                    </div>

                    {/* Finish early date */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Quero terminar minhas horas até dia (Opcional)
                      </label>
                      <input
                        type="date"
                        value={simTargetEndDate}
                        onChange={(e) => setSimTargetEndDate(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={runPlanningSimulator}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs p-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/10"
                    >
                      <Sliders className="h-4.5 w-4.5" />
                      <span>Calcular Cronograma Personalizado</span>
                    </button>
                  </div>

                  {/* Outputs */}
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                    {simResult ? (
                      <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">
                          Seu Cronograma Gerado
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Dias Disponíveis
                            </span>
                            <span className="block text-2xl font-black text-slate-900 dark:text-white mt-1">
                              {simResult.daysAvailable}
                            </span>
                          </div>

                          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Necessário por Dia
                            </span>
                            <span className="block text-2xl font-black text-amber-500 mt-1">
                              {simResult.hoursPerDay}
                            </span>
                          </div>

                          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 text-center col-span-2">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Média Semanal Necessária
                            </span>
                            <span className="block text-2xl font-black text-slate-900 dark:text-white mt-1">
                              {simResult.hoursPerWeek}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-150 dark:border-white/5 pt-4">
                          {simResult.description}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-12">
                        <HelpCircle className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
                        <span className="text-xs font-bold max-w-xs">
                          Configure os parâmetros desejados ao lado e clique em calcular para obter o planejamento personalizado.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =======================================================
                TAB 4: ESTATÍSTICAS
               ======================================================= */}
            {activeTab === "stats" && (
              <div className="space-y-6">
                {chartsData.hasData ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Weekly distribution chart */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-6 shadow-md">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                        Horas Registradas por Semana
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartsData.weekly}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="horas" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Day of Week distribution chart */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-6 shadow-md">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                        Produtividade por Dia da Semana
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartsData.daysProductivity}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="horas" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-12 text-center text-slate-400 flex flex-col items-center justify-center shadow-md">
                    <Activity className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
                    <span className="text-xs font-bold">Sem dados suficientes para exibir gráficos. Registre algumas atividades diárias para começar!</span>
                  </div>
                )}
              </div>
            )}

            {/* =======================================================
                TAB 5: METAS / CONFIGURAÇÕES
               ======================================================= */}
            {activeTab === "settings" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-6 sm:p-8 shadow-md">
                <div className="flex items-center gap-2 mb-6">
                  <Sliders className="h-5 w-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Configurações do Pioneiro
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Atualize seus objetivos de horas, dias disponíveis e gerencie seus períodos de folga.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveSetup} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Meta Mensal (Horas)
                      </label>
                      <input
                        type="number"
                        required
                        value={setupForm.monthlyGoal}
                        onChange={(e) => setSetupForm({ ...setupForm, monthlyGoal: Math.max(1, parseInt(e.target.value) || 0) })}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Meta Trimestral (Opcional)
                      </label>
                      <input
                        type="number"
                        value={setupForm.quarterlyGoal}
                        onChange={(e) => setSetupForm({ ...setupForm, quarterlyGoal: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Meta Anual (Opcional)
                      </label>
                      <input
                        type="number"
                        value={setupForm.annualGoal}
                        onChange={(e) => setSetupForm({ ...setupForm, annualGoal: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Preaching days of week */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Dias da semana em que costuma participar da pregação
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day, idx) => {
                        const isSelected = setupForm.preachingDays.includes(idx);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => togglePreachingDay(idx)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-amber-500 border-amber-500 text-white font-black"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Traveling / Vacations list */}
                  <div className="space-y-4 border-t border-slate-100 dark:border-white/5 pt-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Viagens & Indisponibilidade Programadas
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Adicione períodos em que estará fora. O sistema redistribuirá as horas automaticamente.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div className="space-y-1">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Início</span>
                        <input
                          type="date"
                          value={newVacation.startDate}
                          onChange={(e) => setNewVacation({ ...newVacation, startDate: e.target.value })}
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-lg text-xs font-bold text-slate-800 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Fim</span>
                        <input
                          type="date"
                          value={newVacation.endDate}
                          onChange={(e) => setNewVacation({ ...newVacation, endDate: e.target.value })}
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-lg text-xs font-bold text-slate-800 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2 flex items-center gap-2">
                        <div className="flex-1">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Descrição</span>
                          <input
                            type="text"
                            placeholder="Ex: Férias na praia"
                            value={newVacation.description}
                            onChange={(e) => setNewVacation({ ...newVacation, description: e.target.value })}
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-lg text-xs font-bold text-slate-800 dark:text-white outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addVacationPeriod}
                          className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-lg mt-5 transition-all cursor-pointer shadow"
                        >
                          <Plus className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>

                    {setupForm.vacations.length > 0 && (
                      <div className="space-y-2 max-w-xl">
                        {setupForm.vacations.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-white/5 text-xs font-bold"
                          >
                            <div>
                              <span className="text-slate-800 dark:text-white block">{v.description}</span>
                              <span className="text-slate-400 text-[10px] block mt-0.5">
                                {new Date(v.startDate + "T00:00:00").toLocaleDateString("pt-BR")} a {new Date(v.endDate + "T00:00:00").toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVacationPeriod(v.id)}
                              className="text-rose-500 hover:text-rose-600 p-2 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-white/5 pt-6 flex justify-end gap-3">
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/10"
                    >
                      <Save className="h-4 w-4" />
                      <span>Salvar Configurações</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}
      </main>

      {/* =======================================================
          MODAL: SETUP INICIAL / FIRST USE
         ======================================================= */}
      {isSetupOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6"
          >
            <div>
              <h3 className="text-md font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                <Sparkles className="h-5 w-5 text-amber-500 animate-bounce" />
                Configuração Inicial do Planejamento
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Olá pioneiro! Defina suas metas iniciais para começarmos seu planejamento inteligente.
              </p>
            </div>

            <form onSubmit={handleSaveSetup} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Meta de Horas Mensal
                  </label>
                  <input
                    type="number"
                    required
                    value={setupForm.monthlyGoal}
                    onChange={(e) => setSetupForm({ ...setupForm, monthlyGoal: Math.max(1, parseInt(e.target.value) || 0) })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Meta Trimestral (Opcional)
                  </label>
                  <input
                    type="number"
                    value={setupForm.quarterlyGoal}
                    onChange={(e) => setSetupForm({ ...setupForm, quarterlyGoal: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Preaching Days selection */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Dias da semana em que costuma pregar
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day, idx) => {
                    const isSelected = setupForm.preachingDays.includes(idx);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => togglePreachingDay(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-500 border-amber-500 text-white font-black"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Salvar Planejamento</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* =======================================================
          MODAL: REGISTRO DIÁRIO (ADD / EDIT)
         ======================================================= */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {selectedRecord ? "Editar Atividade Diária" : "Lançar Atividade Diária"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Registe as horas e revisitas efetuadas na pregação de hoje.
                </p>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Data da Atividade
                </label>
                <input
                  type="date"
                  required
                  value={recordForm.date}
                  onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                />
              </div>

              {/* Hours and Minutes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Horas Realizadas
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={recordForm.hours}
                    onChange={(e) => setRecordForm({ ...recordForm, hours: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Minutos
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    required
                    value={recordForm.minutes}
                    onChange={(e) => setRecordForm({ ...recordForm, minutes: Math.max(0, Math.min(59, parseInt(e.target.value) || 0)) })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Bible Studies & Revisits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Estudos Bíblicos Dirigidos
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={recordForm.studies}
                    onChange={(e) => setRecordForm({ ...recordForm, studies: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Revisitas (Opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={recordForm.revisits}
                    onChange={(e) => setRecordForm({ ...recordForm, revisits: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Videos and Publications */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Vídeos Mostrados
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={recordForm.videos}
                    onChange={(e) => setRecordForm({ ...recordForm, videos: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Publicações Entregues
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={recordForm.publications}
                    onChange={(e) => setRecordForm({ ...recordForm, publications: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Observações (Opcional)
                </label>
                <textarea
                  placeholder="Ex: Trabalhei com o grupo no território central..."
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                {selectedRecord ? (
                  <button
                    id="btn_delete_record"
                    type="button"
                    onClick={() => handleRecordDelete(selectedRecord.id)}
                    className="text-rose-500 hover:text-rose-600 font-bold text-xs flex items-center gap-1 cursor-pointer bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir</span>
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex gap-2">
                  <button
                    id="btn_cancel_record"
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn_save_record"
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Salvar Registro</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default PioneerPlanning;
