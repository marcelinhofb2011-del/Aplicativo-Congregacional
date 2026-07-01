import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getReports,
  addReport,
  addMonthlyReport,
  deleteReport,
  getPioneerDailyRecords,
  getPublisherProfileByUid,
} from "../services/firestoreService";
import { FieldServiceReport } from "../types";
import {
  PlusIcon,
  TrashIcon,
  ShareIcon,
  ChevronLeftIcon,
  CheckIcon,
  UserIcon,
} from "../components/icons/Icons";
import ConfirmationModal from "../components/ConfirmationModal";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Plus,
  FileText,
  X as XIcon,
  Calendar as CalendarIcon,
  AlertTriangle,
} from "lucide-react";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const Pioneer: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // App General States
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  });
  const [allReports, setAllReports] = useState<FieldServiceReport[]>([]);

  // Form States (For adding new reports)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formMonth, setFormMonth] = useState("");
  const [formGroup, setFormGroup] = useState<"1" | "2" | "3" | "">("");
  const [formIsPioneer, setFormIsPioneer] = useState(false);
  const [formParticipated, setFormParticipated] = useState(true);
  const [formHours, setFormHours] = useState(0);
  const [formMinutes, setFormMinutes] = useState(0);
  const [formStudies, setFormStudies] = useState(0);
  const [formRevisits, setFormRevisits] = useState(0);
  const [formNotes, setFormNotes] = useState("");

  // Animation / Modal Feedback
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Fetch all reports
  const loadData = async () => {
    setLoading(true);
    try {
      const reportsData = await getReports();
      const activeReports = (reportsData || []).filter((r) => r.isActive !== false);
      setAllReports(activeReports);
    } catch (error) {
      console.error("Error loading reports:", error);
      setToastMessage("Erro ao carregar relatórios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Month Switcher
  const handleMonthChange = (direction: "prev" | "next") => {
    const [year, month] = selectedMonth.split("-").map(Number);
    let newDate;
    if (direction === "prev") {
      newDate = new Date(year, month - 2, 1);
    } else {
      newDate = new Date(year, month, 1);
    }
    const newMonthStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newMonthStr);
  };

  // Generate 12 months list for dropdown select
  const renderedMonthsList = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      result.push(mStr);
    }
    return result;
  }, []);

  // Filtered list of reports for the currently selected month
  const monthReports = useMemo(() => {
    return allReports.filter((r) => {
      if (!r.date) return false;
      const d = new Date(r.date);
      const mStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      return mStr === selectedMonth;
    });
  }, [allReports, selectedMonth]);

  // Statistics for the selected month
  const stats = useMemo(() => {
    let totalHours = 0;
    let totalStudies = 0;
    let totalRevisits = 0;
    let totalCount = monthReports.length;

    monthReports.forEach((r) => {
      totalHours += r.hours || 0;
      totalHours += (r.minutes || 0) / 60;
      totalStudies += r.studies || 0;
      totalRevisits += r.revisits || 0;
    });

    return {
      totalHours: parseFloat(totalHours.toFixed(1)),
      totalStudies,
      totalRevisits,
      totalCount,
    };
  }, [monthReports]);

  // Trigger auto-fill when formMonth or formIsPioneer changes in the open form
  useEffect(() => {
    if (isFormOpen && formIsPioneer && formMonth && user) {
      const loadAndPrefillForSelectedMonth = async () => {
        try {
          const records = await getPioneerDailyRecords(user.uid);
          const monthRecords = records.filter(r => r.date.startsWith(formMonth));
          if (monthRecords.length > 0) {
            let totalMinutes = 0;
            let totalStudiesMax = 0;
            let totalRevisits = 0;
            monthRecords.forEach(r => {
              totalMinutes += (r.hours || 0) * 60 + (r.minutes || 0);
              totalStudiesMax = Math.max(totalStudiesMax, r.studies || 0);
              totalRevisits += r.revisits || 0;
            });
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            setFormHours(h);
            setFormMinutes(m);
            setFormStudies(totalStudiesMax);
            setFormRevisits(totalRevisits);
            setToastMessage(`Valores atualizados com base nos registros diários de ${formMonth}! 🤖`);
          } else {
            setFormHours(0);
            setFormMinutes(0);
            setFormStudies(0);
            setFormRevisits(0);
          }
        } catch (e) {
          console.error("Error prefilling for month:", e);
        }
      };
      loadAndPrefillForSelectedMonth();
    }
  }, [formMonth, formIsPioneer, isFormOpen, user]);

  // Opens a fresh empty form
  const handleOpenNewForm = async () => {
    setFormMonth(selectedMonth);
    setFormGroup("");
    setFormParticipated(true);
    setFormNotes("");
    setIsFormOpen(true);

    if (!user) return;

    try {
      const profile = await getPublisherProfileByUid(user.uid);
      if (profile) {
        setFormName(profile.name || "");
        const isPioneer = profile.isRegularPioneer || profile.isAuxiliaryPioneer;
        setFormIsPioneer(isPioneer);
        
        if (isPioneer) {
          const records = await getPioneerDailyRecords(user.uid);
          const monthRecords = records.filter(r => r.date.startsWith(selectedMonth));
          if (monthRecords.length > 0) {
            let totalMinutes = 0;
            let totalStudiesMax = 0;
            let totalRevisits = 0;
            monthRecords.forEach(r => {
              totalMinutes += (r.hours || 0) * 60 + (r.minutes || 0);
              totalStudiesMax = Math.max(totalStudiesMax, r.studies || 0);
              totalRevisits += r.revisits || 0;
            });
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            setFormHours(h);
            setFormMinutes(m);
            setFormStudies(totalStudiesMax);
            setFormRevisits(totalRevisits);
            setToastMessage("Valores preenchidos automaticamente com base nos seus registros diários do planejador! 🤖✨");
          } else {
            setFormHours(0);
            setFormMinutes(0);
            setFormStudies(0);
            setFormRevisits(0);
          }
        } else {
          setFormHours(0);
          setFormMinutes(0);
          setFormStudies(0);
          setFormRevisits(0);
        }
      } else {
        setFormName("");
        setFormIsPioneer(false);
        setFormHours(0);
        setFormMinutes(0);
        setFormStudies(0);
        setFormRevisits(0);
      }
    } catch (e) {
      console.error("Error auto-prefilling report form:", e);
      setFormName("");
      setFormIsPioneer(false);
      setFormHours(0);
      setFormMinutes(0);
      setFormStudies(0);
      setFormRevisits(0);
    }
  };

  // Submission handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formName.trim()) {
      setToastMessage("Por favor, preencha o Nome.");
      return;
    }

    setLoading(true);
    try {
      const [yearStr, monthNum] = formMonth.split("-");
      const monthName = MONTHS[parseInt(monthNum) - 1];

      // Save to main/coordinator reports
      await addMonthlyReport(
        {
          userId: user.uid,
          userName: formName.trim(),
          month: monthName,
          year: parseInt(yearStr),
          hours: formIsPioneer ? formHours + formMinutes / 60 : formParticipated ? formHours || 0 : 0,
          studies: formStudies || 0,
          revisits: formRevisits || 0,
          publications: 0,
          hasParticipated: formIsPioneer ? true : formParticipated,
          notes: formNotes || `Relatório enviado pelo App de Relatório de Serviço.`,
          status: "Enviado",
        },
        user.uid,
      );

      // Save to secretary/reports
      const reportDateISO = new Date(
        Date.UTC(parseInt(yearStr), parseInt(monthNum) - 1, 1),
      ).toISOString();
      await addReport(
        {
          publisherId: user.uid,
          publisherName: formName.trim(),
          group: formGroup || "1",
          date: reportDateISO,
          privilege: formIsPioneer ? "PIONEER_REGULAR" : "PUBLISHER",
          hours: formIsPioneer ? formHours : formParticipated ? formHours || 0 : 0,
          minutes: formIsPioneer ? formMinutes : 0,
          revisits: formRevisits || 0,
          studies: formStudies || 0,
          hasParticipated: formIsPioneer ? true : formParticipated,
          notes: formNotes || `Relatório enviado pelo App de Relatório de Serviço.`,
          isActive: true,
        },
        user.uid,
      );

      // Reload
      await loadData();

      // Show success anim and close form
      setShowSuccessAnim(true);
      setTimeout(() => {
        setShowSuccessAnim(false);
      }, 3000);

      setToastMessage("Relatório enviado com sucesso!");
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error submitting report:", error);
      setToastMessage("Erro ao enviar relatório.");
    } finally {
      setLoading(false);
    }
  };

  // Deletion logic
  const confirmDeleteReport = async () => {
    if (!reportToDelete) return;
    setLoading(true);
    try {
      await deleteReport(reportToDelete);
      setToastMessage("Relatório excluído com sucesso.");
      await loadData();
    } catch (error) {
      console.error("Error deleting report:", error);
      setToastMessage("Erro ao excluir relatório.");
    } finally {
      setLoading(false);
      setReportToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  // WhatsApp sharing logic
  const handleShareReport = (report: FieldServiceReport) => {
    const d = new Date(report.date);
    const mName = MONTHS[d.getUTCMonth()];
    const yr = d.getUTCFullYear();

    let shareText = `📋 *Relatório de Serviço de Campo*\n`;
    shareText += `--------------------------------\n`;
    shareText += `*Mês:* ${mName} / ${yr}\n`;
    shareText += `*Publicador:* ${report.publisherName}\n`;
    shareText += `*Modalidade:* ${report.privilege === "PUBLISHER" ? "Publicador" : "Pioneiro"}\n`;
    if (report.group) {
      shareText += `*Grupo:* Grupo ${report.group}\n`;
    }
    shareText += `*Participou:* ${report.hasParticipated ? "Sim" : "Não"}\n`;
    if (report.privilege !== "PUBLISHER") {
      shareText += `*Horas:* ${report.hours || 0}h${report.minutes ? ` ${report.minutes}m` : ""}\n`;
    }
    if (report.studies) shareText += `*Estudos:* ${report.studies}\n`;
    if (report.revisits) shareText += `*Revisitas:* ${report.revisits}\n`;
    if (report.notes) shareText += `*Observações:* ${report.notes}\n`;
    shareText += `--------------------------------\n`;
    shareText += `Gerado pelo App de Gestão`;

    const encodedText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encodedText}`, "_blank");
  };

  return (
    <div
      id="pioneer_page_container"
      className="container mx-auto px-4 sm:px-6 md:px-8 py-6 max-w-3xl pb-32 font-sans"
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-3 border-b border-slate-100 dark:border-white/5 transition-all">
        <button
          id="btn_back_home"
          onClick={() => {
            if (isFormOpen) {
              setIsFormOpen(false);
            } else {
              navigate("/");
            }
          }}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Relatórios de Serviço
          </h1>
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">
            Secretaria de Congregação
          </p>
        </div>
        <div className="w-10"></div>
      </header>

      {/* Main Grid: Form OR Dashboard */}
      {isFormOpen ? (
        /* ==================== 1. UNIFIED SUBMISSION FORM ==================== */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[32px] p-6 sm:p-8 shadow-2xl max-w-xl mx-auto"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-6">
            <div>
              <h3 className="text-md font-black text-slate-900 dark:text-white">
                Novo Lançamento de Relatório
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Insira as atividades mensais e envie diretamente ao sistema.
              </p>
            </div>
            <button
              id="btn_cancel_form"
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Seletor: É pioneiro? E grupo. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  É Pioneiro?
                </label>
                <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl flex border border-slate-200 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setFormIsPioneer(false)}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      !formIsPioneer
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-black"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormIsPioneer(true)}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      formIsPioneer
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-black"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Grupo de Campo
                </label>
                <select
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                >
                  <option value="">Sem Grupo / Outro</option>
                  <option value="1">Grupo 1</option>
                  <option value="2">Grupo 2</option>
                  <option value="3">Grupo 3</option>
                </select>
              </div>
            </div>

            {/* Nome Completo e Mês */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Mês de Referência
                </label>
                <select
                  value={formMonth}
                  onChange={(e) => setFormMonth(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                >
                  {renderedMonthsList.map((mStr) => {
                    const [yr, mo] = mStr.split("-").map(Number);
                    return (
                      <option key={mStr} value={mStr}>
                        {MONTHS[mo - 1]} de {yr}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Conditional Dynamic Fields */}
            {!formIsPioneer ? (
              /* ==================== PUBLISHER FIELDS ==================== */
              <motion.div
                key="pub_fields"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Checkbox/Button Participou da Pregação */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Participou da Pregação?
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Fez pelo menos um pouco de testemunho durante o mês.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormParticipated(!formParticipated)}
                    className={`h-10 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      formParticipated
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {formParticipated ? "✓ Sim, Participei" : "Não Participei"}
                  </button>
                </div>

                {formParticipated && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Estudos Bíblicos
                    </span>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setFormStudies(Math.max(0, formStudies - 1))}
                        className="h-9 w-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-lg shadow-sm"
                      >
                        -
                      </button>
                      <span className="text-xl font-black text-slate-800 dark:text-white w-8 text-center">
                        {formStudies}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormStudies(formStudies + 1)}
                        className="h-9 w-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-lg shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ==================== PIONEER FIELDS ==================== */
              <motion.div
                key="pioneer_fields"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Horas e Minutos */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Horas
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormHours(Math.max(0, formHours - 1))}
                        className="h-8 w-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-center font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={formHours === 0 ? "" : formHours}
                        onChange={(e) => setFormHours(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        className="text-lg font-black text-slate-800 dark:text-white w-12 text-center bg-transparent border-none outline-none focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => setFormHours(formHours + 1)}
                        className="h-8 w-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-center font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Minutos
                    </span>
                    <select
                      value={formMinutes}
                      onChange={(e) => setFormMinutes(Number(e.target.value))}
                      className="p-1 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                    >
                      <option value={0}>00 min</option>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                    </select>
                  </div>
                </div>

                {/* Estudos e Revisitas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Estudos Bíblicos
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormStudies(Math.max(0, formStudies - 1))}
                        className="h-8 w-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-center font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-lg font-black text-slate-800 dark:text-white w-6 text-center">
                        {formStudies}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormStudies(formStudies + 1)}
                        className="h-8 w-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-center font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Revisitas
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormRevisits(Math.max(0, formRevisits - 1))}
                        className="h-8 w-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-center font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-lg font-black text-slate-800 dark:text-white w-6 text-center">
                        {formRevisits}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormRevisits(formRevisits + 1)}
                        className="h-8 w-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-center font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Observações */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Observações Adicionais (Opcional)
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Escreva algum detalhe extra..."
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl text-xs focus:ring-2 focus:ring-primary outline-none transition-all resize-none text-slate-700 dark:text-slate-100"
                rows={2}
              />
            </div>

            {/* Submit Button (ONLY "ENVIAR" Option) */}
            <div className="pt-4">
              <button
                id="btn_submit_report"
                type="submit"
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckIcon className="h-4 w-4" /> Enviar Relatório
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        /* ==================== 2. MAIN REPORTS DASHBOARD ==================== */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Month Switcher */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 p-4 rounded-3xl shadow-sm">
            <button
              onClick={() => handleMonthChange("prev")}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200/50 dark:border-slate-700/50"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-md font-black text-slate-900 dark:text-white capitalize">
                {new Date(selectedMonth + "-01T12:00:00").toLocaleString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Mês de Referência
              </p>
            </div>
            <button
              onClick={() => handleMonthChange("next")}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200/50 dark:border-slate-700/50"
            >
              <ChevronLeftIcon className="h-4 w-4 rotate-180" />
            </button>
          </div>

          {/* Statistics Summary */}
          {monthReports.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 p-4 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Total Relatórios
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                  {stats.totalCount}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 p-4 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Total Horas
                </span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
                  {stats.totalHours}h
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 p-4 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Estudos Bíblicos
                </span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {stats.totalStudies}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 p-4 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Revisitas
                </span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                  {stats.totalRevisits}
                </span>
              </div>
            </div>
          )}

          {/* List of Reports */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Relatórios Recebidos ({monthReports.length})
              </h3>
              <button
                onClick={handleOpenNewForm}
                className="px-4 py-2 bg-primary hover:bg-primary-dark transition-colors text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-primary/15 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Novo Envio
              </button>
            </div>

            {monthReports.length > 0 ? (
              <div className="space-y-3">
                {monthReports.map((report) => {
                  const isPioneer = report.privilege !== "PUBLISHER";
                  const avatarColor = isPioneer
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

                  return (
                    <div
                      key={report.id}
                      className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-white/10"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-md shrink-0 ${avatarColor}`}>
                          {report.publisherName ? report.publisherName.charAt(0).toUpperCase() : <UserIcon className="h-5 w-5" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-slate-850 dark:text-white leading-tight">
                              {report.publisherName}
                            </h4>
                            {report.group && (
                              <span className="text-[9px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                                Gp {report.group}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                            Modalidade: <span className="text-slate-600 dark:text-slate-300">{isPioneer ? "Pioneiro" : "Publicador"}</span>
                          </p>

                          {/* Report specifics */}
                          <div className="flex gap-4 pt-1 flex-wrap">
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                              Participou: <span className={report.hasParticipated ? "text-emerald-500" : "text-rose-500"}>{report.hasParticipated ? "Sim" : "Não"}</span>
                            </span>
                            {isPioneer && (
                              <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                                Horas: <span className="text-indigo-600 dark:text-indigo-400 font-black">{report.hours || 0}h{report.minutes ? ` ${report.minutes}m` : ""}</span>
                              </span>
                            )}
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                              Estudos: <span className="text-slate-900 dark:text-white font-black">{report.studies || 0}</span>
                            </span>
                            {isPioneer && report.revisits !== undefined && (
                              <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                                Revisitas: <span className="text-slate-900 dark:text-white font-black">{report.revisits || 0}</span>
                              </span>
                            )}
                          </div>

                          {report.notes && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-1 bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                              "{report.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 sm:self-center justify-end border-t border-slate-50 dark:border-white/5 sm:border-none pt-3 sm:pt-0">
                        <button
                          onClick={() => handleShareReport(report)}
                          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Compartilhar no WhatsApp"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setReportToDelete(report.id);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          title="Excluir Relatório"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 p-12 text-center rounded-3xl space-y-4">
                <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-450">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-md font-bold text-slate-800 dark:text-white">
                    Nenhum relatório recebido
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    Toque no botão abaixo ou no botão de novo envio para adicionar relatórios de serviço de campo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setReportToDelete(null);
        }}
        onConfirm={confirmDeleteReport}
        title="Excluir Relatório"
        message="Tem certeza que deseja excluir este relatório? Esta ação removerá o registro permanentemente do banco de dados."
      />

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccessAnim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center text-center p-6"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-24 w-24 bg-emerald-500 text-white rounded-full flex items-center justify-center text-4xl shadow-2xl shadow-emerald-500/40 mb-6"
            >
              <CheckCircle2 className="h-12 w-12" />
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-black text-white font-outfit"
            >
              Relatório Enviado!
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-slate-400 text-sm mt-2 max-w-xs leading-relaxed"
            >
              A atividade de serviço de campo foi registrada com sucesso com um identificador único.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      <Toast message={toastMessage} onClear={() => setToastMessage("")} />
    </div>
  );
};

export default Pioneer;
