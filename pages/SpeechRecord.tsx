import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getPublicTalks, addPublicTalk } from '../services/firestoreService';
import { PublicTalkSchedule } from '../types';
import { REVERSE_PUBLIC_TALK_THEMES } from '../utils/publicTalksHelper';
import { ArrowDownTrayIcon, PlusIcon } from '../components/icons/Icons';
import * as XLSX from 'xlsx';
import { useAuth } from '../hooks/useAuth';
import PublicTalkFormModal from '../components/PublicTalkFormModal';
import Toast from '../components/Toast';

const SpeechRecord: React.FC = () => {
    const { user } = useAuth();
    const [talks, setTalks] = useState<PublicTalkSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getPublicTalks();
            setTalks(data);
        } catch (error) {
            console.error("Failed to fetch public talks:", error);
            setToastMessage('Erro ao carregar os discursos.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredTalks = useMemo(() => {
        return talks
            .map(talk => ({
                ...talk,
                year: new Date(talk.date).getFullYear(),
                number: REVERSE_PUBLIC_TALK_THEMES[talk.theme] || 0
            }))
            .filter(talk => 
                talk.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
                talk.number.toString().includes(searchTerm) ||
                talk.speakerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                talk.congregation.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => b.year - a.year || a.number - b.number);
    }, [talks, searchTerm]);

    const handleDownload = () => {
        const dataToExport = filteredTalks.map(talk => ({
            Ano: talk.year,
            'Nº': talk.number,
            'Tema do Discurso': talk.theme,
            Orador: talk.speakerName,
            Congregação: talk.congregation
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registro de Discursos");
        XLSX.writeFile(workbook, "Registro_de_Discursos.xlsx");
    };

    const handleOpenFormModal = () => {
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
    };

    const handleSaveTalk = async (formData: Omit<PublicTalkSchedule, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!user) return;

        try {
            await addPublicTalk(formData, user.uid);
            setToastMessage('Novo discurso adicionado com sucesso.');
            fetchData();
        } catch (error) {
            setToastMessage('Erro ao salvar o discurso.');
            console.error("Save public talk error:", error);
        } finally {
            handleCloseFormModal();
        }
    };

    return (
        <>
            <div className="bg-primary p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Registro de Discursos</h2>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={handleOpenFormModal}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-white/20 hover:bg-white/30"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Adicionar
                        </button>
                        <button 
                            onClick={handleDownload}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-white/20 hover:bg-white/30"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Baixar
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Pesquisar por tema, número, orador ou congregação..."
                        className="input-style"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <p className="text-center p-6">Carregando registros...</p>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Ano</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nº</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Tema do Discurso</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Orador</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Congregação</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredTalks.map(talk => (
                                    <tr key={talk.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{talk.year}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{talk.number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{talk.theme}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{talk.speakerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{talk.congregation}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {isFormModalOpen && (
                <PublicTalkFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseFormModal}
                    onSave={handleSaveTalk}
                    initialData={null}
                />
            )}
            
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </>
    );
};

export default SpeechRecord;