
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ConductorMeeting, UserRole } from '../types';
import { 
    getConductorMeetings, addConductorMeeting, updateConductorMeeting, archiveConductorMeeting,
    getFirstSundayConductors, addFirstSundayConductor, updateFirstSundayConductor, archiveFirstSundayConductor
} from '../services/firestoreService';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import ConductorsFormModal from '../components/ConductorsFormModal';
import FirstSundayConductorsFormModal from '../components/FirstSundayConductorsFormModal';
import ConductorDetail from '../components/details/ConductorDetail';
import { PencilIcon, TrashIcon, PlusIcon, UserIcon, CalendarDaysIcon } from '../components/icons/Icons';
import ScheduleAccordion from '../components/ScheduleAccordion';
import { FirstSundayConductor } from '../types';

const Conductors: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const isServant = user?.role === UserRole.SERVANT;
    const isReadOnly = location.state?.fromDashboard === true;

    const [activeTab, setActiveTab] = useState<'regular' | 'firstSunday'>('regular');
    const [meetings, setMeetings] = useState<ConductorMeeting[]>([]);
    const [firstSundayConductors, setFirstSundayConductors] = useState<FirstSundayConductor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<ConductorMeeting | null>(null);
    
    const [isFirstSundayModalOpen, setIsFirstSundayModalOpen] = useState(false);
    const [editingFirstSunday, setEditingFirstSunday] = useState<FirstSundayConductor | null>(null);

    const [toastMessage, setToastMessage] = useState('');
    const [meetingToDelete, setMeetingToDelete] = useState<ConductorMeeting | null>(null);
    const [firstSundayToDelete, setFirstSundayToDelete] = useState<FirstSundayConductor | null>(null);
    
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [allExpanded, setAllExpanded] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);
    
    const upcomingMeetings = useMemo(() => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        return meetings
            .filter(m => new Date(m.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [meetings]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'regular') {
                const data = await getConductorMeetings();
                setMeetings(data);
            } else {
                const data = await getFirstSundayConductors();
                setFirstSundayConductors(data);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            setToastMessage('Erro ao carregar os dados.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleItem = (id: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleAll = () => {
        setAllExpanded(prev => {
            const nextState = !prev;
            if (nextState) {
                setExpandedItems(new Set(upcomingMeetings.map(s => s.id)));
            } else {
                setExpandedItems(new Set());
            }
            return nextState;
        });
    };

    const handleOpenModal = (meeting: ConductorMeeting | null) => {
        setEditingMeeting(meeting);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingMeeting(null);
        setIsModalOpen(false);
    };

    const handleOpenFirstSundayModal = (conductor: FirstSundayConductor | null) => {
        setEditingFirstSunday(conductor);
        setIsFirstSundayModalOpen(true);
    };

    const handleCloseFirstSundayModal = () => {
        setEditingFirstSunday(null);
        setIsFirstSundayModalOpen(false);
    };
    
    const handleSaveMeeting = async (formData: Omit<ConductorMeeting, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!user) return;

        try {
            if (editingMeeting) {
                await updateConductorMeeting(editingMeeting.id, formData, user.uid);
                setToastMessage('Registro de dirigente atualizado!');
            } else {
                await addConductorMeeting(formData, user.uid);
                setToastMessage('Novo dirigente adicionado à escala.');
            }
            fetchData();
        } catch (error) {
            setToastMessage('Erro ao salvar o registro.');
            console.error("Save conductor meeting error:", error);
        } finally {
            handleCloseModal();
        }
    };

    const handleSaveFirstSunday = async (formData: Omit<FirstSundayConductor, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!user) return;

        try {
            if (editingFirstSunday) {
                await updateFirstSundayConductor(editingFirstSunday.id, formData, user.uid);
                setToastMessage('Dirigente do 1º domingo atualizado!');
            } else {
                await addFirstSundayConductor(formData, user.uid);
                setToastMessage('Novo dirigente do 1º domingo adicionado.');
            }
            fetchData();
        } catch (error) {
            setToastMessage('Erro ao salvar o registro.');
            console.error("Save first sunday conductor error:", error);
        } finally {
            handleCloseFirstSundayModal();
        }
    };

    const handleDelete = (meeting: ConductorMeeting) => {
        setMeetingToDelete(meeting);
    };

    const handleDeleteFirstSunday = (conductor: FirstSundayConductor) => {
        setFirstSundayToDelete(conductor);
    };

    const confirmDelete = async () => {
        if (meetingToDelete && user) {
            try {
                await archiveConductorMeeting(meetingToDelete.id, user.uid);
                setToastMessage('Registro de dirigente arquivado.');
                setMeetingToDelete(null);
                fetchData();
            } catch (error) {
                setToastMessage('Erro ao arquivar o registro.');
                console.error("Archive conductor meeting error:", error);
            }
        }
    };

    const confirmDeleteFirstSunday = async () => {
        if (firstSundayToDelete && user) {
            try {
                await archiveFirstSundayConductor(firstSundayToDelete.id, user.uid);
                setToastMessage('Registro arquivado.');
                setFirstSundayToDelete(null);
                fetchData();
            } catch (error) {
                setToastMessage('Erro ao arquivar o registro.');
                console.error("Archive first sunday conductor error:", error);
            }
        }
    };

    return (
        <>
            <div className="bg-primary p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Dirigentes</h2>
                        <p className="mt-1 text-blue-100">Gerencie os dirigentes para as saídas de campo e reuniões.</p>
                    </div>
                    {!isReadOnly && isServant && (
                        <button 
                            onClick={() => activeTab === 'regular' ? handleOpenModal(null) : handleOpenFirstSundayModal(null)} 
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-white/20 hover:bg-white/30"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Criar
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
                {/* Tabs */}
                <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => setActiveTab('regular')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                            activeTab === 'regular'
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <CalendarDaysIcon className="h-4 w-4" />
                        Escala Regular
                    </button>
                    <button
                        onClick={() => setActiveTab('firstSunday')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                            activeTab === 'firstSunday'
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <UserIcon className="h-4 w-4" />
                        1º Domingo
                    </button>
                </div>

                {activeTab === 'regular' ? (
                    <>
                        {upcomingMeetings.length > 0 && (
                            <div className="mb-4">
                                <button onClick={toggleAll} className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600">
                                    {allExpanded ? 'Ocultar Programação' : 'Mostrar Programação'}
                                </button>
                            </div>
                        )}
                        
                        {isLoading ? (
                            <p className="text-center p-6">Carregando escala...</p>
                        ) : (
                            <div className="space-y-4">
                                {upcomingMeetings.length > 0 ? upcomingMeetings.map(meeting => (
                                    <ScheduleAccordion
                                        key={meeting.id}
                                        isOpen={expandedItems.has(meeting.id)}
                                        onToggle={() => toggleItem(meeting.id)}
                                        title={
                                            <div>
                                                <p className="font-bold text-lg text-slate-900 dark:text-white">{new Date(meeting.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' })}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Dirigente: {meeting.conductorName}</p>
                                            </div>
                                        }
                                        footer={
                                            isServant && (
                                                <div className="p-3 flex justify-end items-center space-x-2">
                                                    <button onClick={() => handleOpenModal(meeting)} className="p-2 text-slate-500 hover:text-amber-500" aria-label="Editar"><PencilIcon className="h-5 w-5" /></button>
                                                    <button onClick={() => handleDelete(meeting)} className="p-2 text-slate-500 hover:text-red-500" aria-label="Excluir"><TrashIcon className="h-5 w-5" /></button>
                                                </div>
                                            )
                                        }
                                    >
                                        <ConductorDetail schedule={meeting} />
                                    </ScheduleAccordion>
                                )) : (
                                    <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                                        Nenhuma escala futura encontrada.
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading ? (
                            <p className="col-span-full text-center p-6">Carregando...</p>
                        ) : firstSundayConductors.length > 0 ? (
                            firstSundayConductors.map(conductor => (
                                <div key={conductor.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-primary uppercase tracking-wider">{conductor.month}</p>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{conductor.conductorName}</h3>
                                            {conductor.date && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    {new Date(conductor.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                                </p>
                                            )}
                                        </div>
                                        {isServant && (
                                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenFirstSundayModal(conductor)} className="p-1.5 text-slate-400 hover:text-amber-500"><PencilIcon className="h-4 w-4" /></button>
                                                <button onClick={() => handleDeleteFirstSunday(conductor)} className="p-1.5 text-slate-400 hover:text-red-500"><TrashIcon className="h-4 w-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                    {conductor.notes && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">"{conductor.notes}"</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                                Nenhum dirigente do 1º domingo cadastrado.
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {isModalOpen && (
                <ConductorsFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveMeeting}
                    initialData={editingMeeting}
                />
            )}

            {isFirstSundayModalOpen && (
                <FirstSundayConductorsFormModal
                    isOpen={isFirstSundayModalOpen}
                    onClose={handleCloseFirstSundayModal}
                    onSave={handleSaveFirstSunday}
                    initialData={editingFirstSunday}
                />
            )}
            
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
            <ConfirmationModal
                isOpen={!!meetingToDelete}
                onClose={() => setMeetingToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Arquivamento"
                message={`Você tem certeza que deseja arquivar o registro do dirigente ${meetingToDelete?.conductorName}?`}
            />

            <ConfirmationModal
                isOpen={!!firstSundayToDelete}
                onClose={() => setFirstSundayToDelete(null)}
                onConfirm={confirmDeleteFirstSunday}
                title="Confirmar Arquivamento"
                message={`Você tem certeza que deseja arquivar o dirigente ${firstSundayToDelete?.conductorName} de ${firstSundayToDelete?.month}?`}
            />
        </>
    );
};

export default Conductors;