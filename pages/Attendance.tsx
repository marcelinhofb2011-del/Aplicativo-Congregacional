
import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole, AttendanceRecord, BaseRecord } from '../types';
import { addAttendanceRecord } from '../services/firestoreService';
import AttendancePasswordModal from '../components/AttendancePasswordModal';
import Toast from '../components/Toast';
import { CalendarDaysIcon } from '../components/icons/Icons';
import { useNavigate } from 'react-router-dom';

const Attendance: React.FC = () => {
    const { user, isAttendanceUnlocked, checkAttendancePassword } = useAuth();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(user?.role === UserRole.PUBLISHER && !isAttendanceUnlocked);
    const [toastMessage, setToastMessage] = useState('');

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitterName, setSubmitterName] = useState(user?.email || '');
    const [presentCount, setPresentCount] = useState<number | ''>('');
    const [onlineCount, setOnlineCount] = useState<number | ''>('');

    const isPublisher = user?.role === UserRole.PUBLISHER;

    const totalCount = useMemo(() => {
        return (Number(presentCount) || 0) + (Number(onlineCount) || 0);
    }, [presentCount, onlineCount]);
    
    const handleVerifyPassword = (password: string) => {
        const success = checkAttendancePassword(password);
        if (success) {
            setShowModal(false);
        }
        return success;
    };
    
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
            setDate(new Date().toISOString().split('T')[0]);
            setSubmitterName(user?.email || '');
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

    if (isPublisher && !isAttendanceUnlocked) {
        return (
            <div>
                {showModal && <AttendancePasswordModal onVerify={handleVerifyPassword} onClose={() => setShowModal(false)} />}
                <div className="bg-white dark:bg-slate-900 shadow rounded-lg p-6 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Esta seção requer uma senha adicional para ser acessada.</p>
                    <button onClick={() => setShowModal(true)} className="mt-4 px-5 py-3 bg-primary text-white rounded-md hover:bg-primary-dark">
                        Digitar Senha
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-xl mx-auto">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Registrar Assistência</h2>
             <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                         <div className="relative">
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="input-style pr-10" />
                            <CalendarDaysIcon className="h-5 w-5 text-slate-400 absolute top-1/2 right-3 -translate-y-1/2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Seu Nome</label>
                        <input type="text" value={submitterName} onChange={e => setSubmitterName(e.target.value)} required className="input-style" />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Presentes</label>
                        <input type="number" value={presentCount} onChange={e => setPresentCount(e.target.value === '' ? '' : parseInt(e.target.value))} required min="0" className="input-style" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Online</label>
                        <input type="number" value={onlineCount} onChange={e => setOnlineCount(e.target.value === '' ? '' : parseInt(e.target.value))} required min="0" className="input-style" />
                    </div>
                </div>
                 <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-md text-center">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total da Assistência</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalCount}</p>
                 </div>
                <div className="pt-2">
                    <button type="submit" className="w-full py-3 px-5 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark">
                        Enviar
                    </button>
                </div>
            </form>
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </div>
    );
};

export default Attendance;
