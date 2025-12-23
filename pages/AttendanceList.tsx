import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types';
import { getAttendanceRecords, updateAttendanceRecord, archiveAttendanceRecord } from '../services/firestoreService';
import { useAuth } from '../hooks/useAuth';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import AttendanceFormModal from '../components/AttendanceFormModal';
import { PencilIcon, TrashIcon } from '../components/icons/Icons';

const AttendanceList: React.FC = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State for modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
    const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const data = await getAttendanceRecords();
            setRecords(data);
        } catch (error) {
            console.error("Failed to fetch attendance records:", error);
            setToastMessage('Erro ao carregar registros.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'full',
            timeZone: 'UTC',
        }).format(new Date(dateString));
    };

    const handleEdit = (record: AttendanceRecord) => {
        setEditingRecord(record);
        setIsFormModalOpen(true);
    };

    const handleDelete = (record: AttendanceRecord) => {
        setRecordToDelete(record);
    };
    
    const handleCloseModal = () => {
        setEditingRecord(null);
        setIsFormModalOpen(false);
    };

    const handleSave = async (formData: Omit<AttendanceRecord, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!editingRecord || !user) return;
        try {
            await updateAttendanceRecord(editingRecord.id, formData, user.uid);
            setToastMessage('Registro atualizado com sucesso!');
            fetchRecords();
        } catch (error) {
            setToastMessage('Erro ao atualizar o registro.');
            console.error(error);
        } finally {
            handleCloseModal();
        }
    };

    const confirmDelete = async () => {
        if (recordToDelete && user) {
            try {
                await archiveAttendanceRecord(recordToDelete.id, user.uid);
                setToastMessage('Registro arquivado com sucesso.');
                fetchRecords();
            } catch (error) {
                setToastMessage('Erro ao arquivar o registro.');
                console.error(error);
            } finally {
                setRecordToDelete(null);
            }
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Pasta de Assistência</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Lista de todos os registros de assistência.</p>
            {isLoading ? <p>Carregando registros...</p> : (
                <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden">
                   <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {records.length > 0 ? records.map(record => (
                            <li key={record.id} className="p-4 group hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                    <div className="mb-2 sm:mb-0">
                                        <p className="font-bold text-primary">{formatDate(record.date)}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Enviado por: {record.submitterName}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-4 text-center">
                                            <div>
                                                <p className="text-sm text-slate-500">Presentes</p>
                                                <p className="font-semibold text-lg">{record.presentCount}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Online</p>
                                                <p className="font-semibold text-lg">{record.onlineCount}</p>
                                            </div>
                                            <div className="border-l pl-4">
                                                <p className="text-sm text-slate-500">Total</p>
                                                <p className="font-bold text-2xl text-slate-900 dark:text-white">{record.totalCount}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(record)} className="p-2 text-slate-500 hover:text-amber-500"><PencilIcon className="h-5 w-5" /></button>
                                            <button onClick={() => handleDelete(record)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        )) : (
                             <li className="p-6 text-center text-slate-500 dark:text-slate-400">
                                Nenhum registro de assistência encontrado.
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {isFormModalOpen && (
                <AttendanceFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    initialData={editingRecord}
                />
            )}

            <ConfirmationModal
                isOpen={!!recordToDelete}
                onClose={() => setRecordToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir o registro de assistência de ${recordToDelete ? formatDate(recordToDelete.date) : ''}?`}
            />

            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </div>
    );
};

export default AttendanceList;