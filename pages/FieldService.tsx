
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FieldServiceMeeting } from '../types';
import { getFieldServiceMeetings, addFieldServiceMeeting, updateFieldServiceMeeting, archiveFieldServiceMeeting } from '../services/firestoreService';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import { PencilIcon, TrashIcon } from '../components/icons/Icons';

const FieldService: React.FC = () => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<FieldServiceMeeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState<Omit<FieldServiceMeeting, 'id' | 'createdAt' | 'createdBy' | 'isActive' | 'updatedAt' | 'updatedBy'>>({
        date: new Date().toISOString().split('T')[0],
        conductor: '',
        reader: '',
        notes: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [meetingToDelete, setMeetingToDelete] = useState<FieldServiceMeeting | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getFieldServiceMeetings();
            setMeetings(data);
        } catch (error) {
            console.error("Failed to fetch field service meetings:", error);
            setToastMessage('Erro ao carregar as reuniões de serviço.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            conductor: '',
            reader: '',
            notes: ''
        });
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.conductor || !formData.date || !formData.reader || !user) return;

        const meetingData = {
            ...formData,
            date: new Date(formData.date).toISOString()
        };

        try {
            if (editingId) {
                await updateFieldServiceMeeting(editingId, meetingData, user.uid);
                setToastMessage('Reunião de serviço atualizada!');
            } else {
                await addFieldServiceMeeting(meetingData, user.uid);
                setToastMessage('Nova reunião de serviço adicionada.');
            }
            resetForm();
            fetchData();
        } catch (error) {
            setToastMessage('Erro ao salvar a reunião.');
            console.error("Save field service meeting error:", error);
        }
    };

    const handleEdit = (meeting: FieldServiceMeeting) => {
        setEditingId(meeting.id);
        setFormData({
            date: new Date(meeting.date).toISOString().split('T')[0],
            conductor: meeting.conductor,
            reader: meeting.reader,
            notes: meeting.notes || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (meeting: FieldServiceMeeting) => {
        setMeetingToDelete(meeting);
    };

    const confirmDelete = async () => {
        if (meetingToDelete && user) {
            try {
                await archiveFieldServiceMeeting(meetingToDelete.id, user.uid);
                setToastMessage('Reunião de serviço arquivada.');
                setMeetingToDelete(null);
                fetchData();
            } catch (error) {
                setToastMessage('Erro ao arquivar a reunião.');
                console.error("Archive field service meeting error:", error);
            }
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Serviço de Campo</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-4 sticky top-24">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b pb-2 mb-4">
                            {editingId ? 'Editar Reunião' : 'Nova Reunião'}
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirigente</label>
                            <input type="text" name="conductor" value={formData.conductor} onChange={handleInputChange} required className="input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leitor</label>
                            <input type="text" name="reader" value={formData.reader} onChange={handleInputChange} required className="input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                            <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} className="input-style"></textarea>
                        </div>
                        <div className="pt-2 flex gap-2">
                            <button type="submit" className="w-full py-3 px-5 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark">
                                {editingId ? 'Atualizar' : 'Salvar'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={resetForm} className="py-3 px-5 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    {isLoading ? (
                        <p className="text-center p-6">Carregando reuniões...</p>
                    ) : (
                        <div className="space-y-4">
                            {meetings.length > 0 ? meetings.map(meeting => {
                                const meetingDate = new Date(meeting.date);
                                const today = new Date();
                                meetingDate.setUTCHours(0,0,0,0);
                                today.setUTCHours(0,0,0,0);
                                const isFuture = meetingDate >= today;
                                return (
                                <div key={meeting.id} className={`bg-white dark:bg-slate-800 shadow rounded-lg p-4 transition-all ${isFuture ? 'border-l-4 border-rose-500' : 'opacity-70'}`}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="font-bold text-rose-600 dark:text-rose-400">
                                                {new Date(meeting.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">Dirigente: {meeting.conductor}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">Leitor: {meeting.reader}</p>
                                            {meeting.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">Obs: {meeting.notes}</p>}
                                        </div>
                                        <div className="flex">
                                            <button onClick={() => handleEdit(meeting)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                            <button onClick={() => handleDelete(meeting)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                                        </div>
                                    </div>
                                </div>
                            )}) : (
                                <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg">
                                    Nenhuma reunião de serviço encontrada.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
            <ConfirmationModal
                isOpen={!!meetingToDelete}
                onClose={() => setMeetingToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Arquivamento"
                message={`Você tem certeza que deseja arquivar a reunião de serviço de ${meetingToDelete ? new Date(meetingToDelete.date).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : ''}?`}
            />
        </div>
    );
};

export default FieldService;
