import React, { useState, useEffect } from 'react';
import { getMeetingSchedules, addMeetingSchedule, updateMeetingSchedule, archiveMeetingSchedule } from '../services/firestoreService';
import { MeetingSchedule } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PlusIcon, PencilIcon, TrashIcon, CalendarDaysIcon, ConductorIcon, WifiIcon, MapPinIcon } from '../components/icons/Icons';
import Layout from '../components/Layout';

const Programations: React.FC = () => {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<MeetingSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<MeetingSchedule | null>(null);

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        setLoading(true);
        try {
            const data = await getMeetingSchedules();
            setSchedules(data);
        } catch (error) {
            console.error('Erro ao carregar programações:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: Partial<MeetingSchedule>) => {
        if (!user) return;
        try {
            if (editingSchedule) {
                await updateMeetingSchedule(editingSchedule.id, data, user.uid);
            } else {
                await addMeetingSchedule(data, user.uid);
            }
            await loadSchedules();
            setIsModalOpen(false);
            setEditingSchedule(null);
        } catch (error) {
            console.error('Erro ao salvar programação:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (!confirm('Deseja arquivar esta programação?')) return;
        try {
            await archiveMeetingSchedule(id, user.uid);
            await loadSchedules();
        } catch (error) {
            console.error('Erro ao arquivar:', error);
        }
    };

    return (
        <Layout title="Programações">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reuniões Agendadas</h2>
                        <button 
                            onClick={() => { setEditingSchedule(null); setIsModalOpen(true); }}
                            className="btn-primary flex items-center gap-2"
                        >
                            <PlusIcon className="h-5 w-5" /> Nova Programação
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <CalendarDaysIcon className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">Nenhuma reunião agendada.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {schedules.map((schedule) => (
                                <div key={schedule.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg">
                                                <CalendarDaysIcon className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {new Date(schedule.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(schedule.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingSchedule(schedule); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleDelete(schedule.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <ConductorIcon className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium">Presidente:</span> {schedule.president}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <WifiIcon className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium">Modalidade:</span> 
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                schedule.modality === 'Presencial' ? 'bg-green-100 text-green-700' :
                                                schedule.modality === 'Híbrida' ? 'bg-blue-100 text-blue-700' :
                                                'bg-purple-100 text-purple-700'
                                            }`}>
                                                {schedule.modality}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <MapPinIcon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="font-medium">Local/Link:</span>
                                                <p className="text-xs break-all text-slate-500 mt-0.5">{schedule.locationOrLink}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <ScheduleModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                    initialData={editingSchedule} 
                />
            )}
        </Layout>
    );
};

const ScheduleModal: React.FC<{
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (data: Partial<MeetingSchedule>) => void;
    initialData: MeetingSchedule | null;
}> = ({ isOpen, onClose, onSave, initialData }) => {
    const [date, setDate] = useState(initialData ? initialData.date.split('T')[0] : '');
    const [time, setTime] = useState(initialData ? new Date(initialData.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '19:30');
    const [president, setPresident] = useState(initialData?.president || '');
    const [modality, setModality] = useState<'Presencial' | 'Híbrida' | 'Online'>(initialData?.modality || 'Presencial');
    const [locationOrLink, setLocationOrLink] = useState(initialData?.locationOrLink || '');
    const [notes, setNotes] = useState(initialData?.notes || '');

    const handleSave = () => {
        if (!date || !president || !locationOrLink) {
            alert('Por favor, preencha os campos obrigatórios.');
            return;
        }
        const fullDate = new Date(`${date}T${time}`).toISOString();
        onSave({ date: fullDate, president, modality, locationOrLink, notes });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        {initialData ? 'Editar Programação' : 'Nova Programação'}
                    </h3>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data *</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-style w-full" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input-style w-full" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Presidente *</label>
                        <input type="text" value={president} onChange={e => setPresident(e.target.value)} placeholder="Nome do irmão" className="input-style w-full" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modalidade</label>
                        <select value={modality} onChange={e => setModality(e.target.value as any)} className="select-style w-full">
                            <option value="Presencial">Presencial</option>
                            <option value="Híbrida">Híbrida</option>
                            <option value="Online">Online</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Local ou Link *</label>
                        <textarea 
                            value={locationOrLink} 
                            onChange={e => setLocationOrLink(e.target.value)} 
                            placeholder="Endereço ou link do Zoom" 
                            className="input-style w-full" 
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-style w-full" rows={2} />
                    </div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button onClick={handleSave} className="btn-primary px-8">Salvar</button>
                </div>
            </div>
        </div>
    );
};

export default Programations;
