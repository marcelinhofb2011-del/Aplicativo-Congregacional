import React, { useState, useEffect, useMemo } from 'react';
import { ShareIcon } from './icons/Icons';

// --- Tipos de Dados ---
type PioneerGoal = {
    hours: number;
    role: 'Publicador' | 'Pioneiro Auxiliar' | 'Pioneiro Regular';
    notes: string;
};

type StudentStudy = {
    id: number;
    name: string;
    hours: number;
    minutes: number;
};

type Activity = {
    hours: number;
    minutes: number;
    studies: StudentStudy[];
};

// --- Componente Principal ---
const PioneerTargetModal: React.FC<{isOpen: boolean, onClose: () => void}> = ({ isOpen, onClose }) => {
    const [currentMonthYear, setCurrentMonthYear] = useState('');
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [goal, setGoal] = useState<PioneerGoal | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        const date = new Date();
        const monthName = date.toLocaleString('pt-BR', { month: 'long' });
        const year = date.getFullYear();
        setCurrentMonthYear(`${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`);
    }, []);

    const handleSaveGoal = (data: PioneerGoal) => {
        setGoal(data);
        setIsEntryModalOpen(false);
    };

    const handleAddActivity = (activity: Activity) => {
        setActivities(prev => [...prev, activity]);
    };

        const handleCancelGoal = () => {
        setGoal(null);
        setActivities([]);
    };

    const handleShare = async () => {
        if (!goal) return;

        let report = `📄 *Relatório de Serviço - ${currentMonthYear}*\n`;
        report += `--------------------------------\n`;
        report += `*Modalidade:* ${goal.role}\n\n`;

        report += `*Resumo de Horas:*\n`;
        report += `- Alvo Mensal: ${goal.hours}h\n`;
        report += `- Total Realizado: ${totalHoursCompleted.toFixed(1)}h\n`;
        report += `- Horas Restantes: ${remainingHours.toFixed(1)}h\n\n`;

        const totalFieldMinutes = activities.reduce((acc, act) => acc + (act.hours * 60) + act.minutes, 0);
        const fieldHours = Math.floor(totalFieldMinutes / 60);
        const fieldMinutes = totalFieldMinutes % 60;

        report += `*Detalhes da Atividade:*\n`;
        report += `- Horas de Campo: ${fieldHours}h ${fieldMinutes}m\n`;

        const allStudies = activities.flatMap(act => act.studies);
        if (allStudies.length > 0) {
            report += `\n*Estudos Dirigidos:*\n`;
            allStudies.forEach(study => {
                if (study.hours > 0 || study.minutes > 0) {
                    report += `- ${study.name}: ${study.hours}h ${study.minutes}m\n`;
                }
            });
        }

        report += `--------------------------------\n`;
        report += `Gerado pelo App de Gestão`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Relatório de Serviço - ${currentMonthYear}`,
                    text: report,
                });
            } else {
                await navigator.clipboard.writeText(report);
                alert('Relatório copiado para a área de transferência!');
            }
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
            alert('Não foi possível compartilhar o relatório.');
        }
    };

    const totalHoursCompleted = useMemo(() => {
        const totalMinutes = activities.reduce((acc, act) => {
            const studyMinutes = act.studies.reduce((sAcc, s) => sAcc + (s.hours * 60) + s.minutes, 0);
            return acc + (act.hours * 60) + act.minutes + studyMinutes;
        }, 0);
        return totalMinutes / 60;
    }, [activities]);

    const remainingHours = goal ? goal.hours - totalHoursCompleted : 0;

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}></div>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md z-50">
                <h3 className="text-lg font-bold text-center mb-4">🎯 Alvo para pioneiro</h3>
                {!goal ? (
                    <div onClick={() => setIsEntryModalOpen(true)} className="cursor-pointer text-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                        <p className="text-2xl">{currentMonthYear}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-sm text-slate-500">Alvo</p>
                                <p className="text-2xl font-bold text-primary">{goal.hours}h</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Realizado</p>
                                <p className="text-2xl font-bold text-green-500">{totalHoursCompleted.toFixed(1)}h</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Faltam</p>
                                <p className="text-2xl font-bold text-red-500">{remainingHours.toFixed(1)}h</p>
                            </div>
                        </div>
                        <button onClick={() => setIsActivityModalOpen(true)} className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark">
                            (+) Novo Registro
                        </button>
                                                <div className="flex items-center justify-center space-x-4 pt-2">
                            <button onClick={handleShare} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:underline flex items-center"><ShareIcon className="h-4 w-4 mr-1"/> Compartilhar</button>
                            <button onClick={() => setIsEntryModalOpen(true)} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:underline">Editar Alvo</button>
                            <button onClick={handleCancelGoal} className="text-sm font-medium text-red-500 hover:underline">Cancelar Alvo</button>
                        </div>
                    </div>
                )}
            </div>
            <EntryModal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} onSave={handleSaveGoal} initialData={goal} />
            <AddActivityModal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} onSave={handleAddActivity} />
        </>
    );
};

// --- Modal de Definição de Alvo ---
const EntryModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: (data: PioneerGoal) => void, initialData: PioneerGoal | null}> = ({ isOpen, onClose, onSave, initialData }) => {
    const [hours, setHours] = useState('');
    const [role, setRole] = useState<'Publicador' | 'Pioneiro Auxiliar' | 'Pioneiro Regular'>('Publicador');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setHours(String(initialData.hours));
                setRole(initialData.role);
                setNotes(initialData.notes);
            } else {
                setHours('');
                setRole('Publicador');
                setNotes('');
            }
        }
    }, [isOpen, initialData]);

    const handleSaveClick = () => {
        if (hours) {
            onSave({ hours: parseInt(hours, 10), role, notes });
            if (!initialData) {
                setHours(''); setRole('Publicador'); setNotes('');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60]">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h4 className="text-lg font-bold mb-4">Horas</h4>
                <div className="space-y-4">
                    <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Digite as horas" className="input-style w-full" />
                    <select value={role} onChange={(e) => setRole(e.target.value as any)} className="select-style w-full">
                        <option>Publicador</option>
                        <option>Pioneiro Auxiliar</option>
                        <option>Pioneiro Regular</option>
                    </select>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observação" className="input-style w-full" rows={3}></textarea>
                </div>
                <div className="flex justify-end mt-6 space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">❌ Cancelar</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">🆗 Salvar</button>
                </div>
            </div>
        </div>
    );
};

// --- Modal de Adicionar Atividade ---
const AddActivityModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: (activity: Activity) => void}> = ({ isOpen, onClose, onSave }) => {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [studies, setStudies] = useState<StudentStudy[]>([]);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

    const handleSave = () => {
        onSave({ hours, minutes, studies });
        // Reset state
        setHours(0); setMinutes(0); setStudies([]);
        onClose();
    };

    const handleAddStudent = (name: string) => {
        setStudies(prev => [...prev, { id: Date.now(), name, hours: 0, minutes: 0 }]);
    };

    const handleStudyTimeChange = (id: number, type: 'hours' | 'minutes', value: number) => {
        setStudies(prev => prev.map(s => s.id === id ? { ...s, [type]: value } : s));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[70]">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h4 className="text-lg font-bold mb-4">Novo Registro</h4>
                <div className="space-y-6">
                    <div>
                        <h5 className="text-md font-semibold mb-2">Horas de Campo</h5>
                        <div className="grid grid-cols-2 gap-4">
                            <NumberSpinner label="Horas" value={hours} onChange={setHours} />
                            <NumberSpinner label="Minutos" value={minutes} onChange={setMinutes} />
                        </div>
                    </div>
                    <div>
                        <h5 className="text-md font-semibold mb-2">Relatório de Estudos</h5>
                        <div className="space-y-2">
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                {studies.map(study => (
                                    <div key={study.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md">
                                        <span className="text-slate-800 dark:text-slate-200 flex-1 truncate pr-2">{study.name}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-28"><NumberSpinner label="H" value={study.hours} onChange={(newHours) => handleStudyTimeChange(study.id, 'hours', newHours)} /></div>
                                            <div className="w-28"><NumberSpinner label="M" value={study.minutes} onChange={(newMinutes) => handleStudyTimeChange(study.id, 'minutes', newMinutes)} /></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setIsStudentModalOpen(true)} className="w-full inline-flex items-center justify-center px-4 py-2 border border-dashed text-sm font-medium rounded-md text-primary border-primary hover:bg-primary/10">
                                (+) Adicionar Estudo
                            </button>
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end mt-6 space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Ok</button>
                </div>
                <AddStudentModal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} onSave={handleAddStudent} />
            </div>
        </div>
    );
};

// --- Modal de Adicionar Estudante ---
const AddStudentModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: (name: string) => void}> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const handleSaveClick = () => {
        if (name) {
            onSave(name);
            setName('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[80]">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-xs">
                <h4 className="text-lg font-bold mb-4">Adicionar Estudante</h4>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do estudante" className="input-style w-full" />
                <div className="flex justify-end mt-4 space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancelar</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Salvar</button>
                </div>
            </div>
        </div>
    );
};

// --- Componente de Contador Numérico ---
const NumberSpinner: React.FC<{label: string, value: number, onChange: (value: number) => void}> = ({ label, value, onChange }) => {
    return (
        <div>
            {label && <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>}
            <div className="flex items-center">
                <button onClick={() => onChange(Math.max(0, value - 1))} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-l-md text-slate-800 dark:text-slate-200">-</button>
                <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)} className="input-style w-full text-center rounded-none p-1" />
                <button onClick={() => onChange(value + 1)} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-r-md text-slate-800 dark:text-slate-200">+</button>
            </div>
        </div>
    );
};

export default PioneerTargetModal;
