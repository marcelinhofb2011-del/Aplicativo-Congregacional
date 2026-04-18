import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Announcement, UserRole } from '../types';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement, archiveAnnouncement } from '../services/firestoreService';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import ScheduleAccordion from '../components/ScheduleAccordion';
import AnnouncementFormModal from '../components/AnnouncementFormModal';
import { PlusIcon, PencilIcon, TrashIcon, ShareIcon } from '../components/icons/Icons';

const Announcements: React.FC = () => {
    const { user } = useAuth();
    const isServant = user?.role === UserRole.SERVANT;

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        try {
            let data = await getAnnouncements();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const expiredAnnouncements = data.filter(ann => {
                const announcementDate = new Date(ann.createdAt);
                // Do not delete pinned announcements
                return !ann.isPinned && announcementDate < thirtyDaysAgo;
            });

            if (expiredAnnouncements.length > 0) {
                for (const ann of expiredAnnouncements) {
                    await archiveAnnouncement(ann.id, user?.uid || 'system-cleanup');
                }
                data = data.filter(ann => !expiredAnnouncements.some(expired => expired.id === ann.id));
                setToastMessage(`${expiredAnnouncements.length} anúncios antigos foram limpos.`);
            }

            setAnnouncements(data);
        } catch (error) {
            console.error("Failed to fetch and clean announcements:", error);
            setToastMessage('Falha ao carregar ou limpar anúncios.');
        } finally {
            setIsLoading(false);
        }
    };

    const sortedAnnouncements = useMemo(() => {
        return [...announcements].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [announcements]);

    const toggleItem = (id: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleOpenModal = (announcement: Announcement | null) => {
        setEditingAnnouncement(announcement);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAnnouncement(null);
    };

    const handleSave = async (data: Omit<Announcement, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
        if (!user) return;
        try {
            if (editingAnnouncement) {
                await updateAnnouncement(editingAnnouncement.id, data, user.uid);
                setToastMessage('Anúncio atualizado com sucesso!');
            } else {
                await addAnnouncement(data, user.uid);
                setToastMessage('Anúncio criado com sucesso!');
            }
            fetchAnnouncements();
        } catch (error) {
            setToastMessage('Erro ao salvar o anúncio.');
        } finally {
            handleCloseModal();
        }
    };

    const handleDeleteClick = (announcement: Announcement) => {
        setAnnouncementToDelete(announcement);
    };

    const handleConfirmDelete = async () => {
        if (announcementToDelete && user) {
            try {
                await deleteAnnouncement(announcementToDelete.id);
                setToastMessage('Anúncio excluído com sucesso!');
                fetchAnnouncements();
            } catch (error) {
                setToastMessage('Erro ao excluir o anúncio.');
            } finally {
                setAnnouncementToDelete(null);
            }
        }
    };
    
    const handleShare = async (announcement: Announcement) => {
        const shareData = {
            title: `Anúncio: ${announcement.title}`,
            text: `*${announcement.title}*\n\n${announcement.body}`,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.text);
                setToastMessage('Anúncio copiado para a área de transferência!');
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error("Erro ao compartilhar:", err);
                setToastMessage('Não foi possível compartilhar o anúncio.');
            }
        }
    };

    return (
        <>
            <div className="bg-primary p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Mural de Anúncios</h2>
                    {isServant && (
                        <button onClick={() => handleOpenModal(null)} className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-md">
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Criar Anúncio
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
                {isLoading ? (
                    <p>Carregando...</p>
                ) : (
                    <div className="space-y-4">
                        {sortedAnnouncements.length > 0 ? sortedAnnouncements.map(ann => (
                            <ScheduleAccordion
                                key={ann.id}
                                isOpen={expandedItems.has(ann.id)}
                                onToggle={() => toggleItem(ann.id)}
                                title={
                                    <div className="flex items-center gap-3">
                                        {ann.isPinned && <span className="text-xs font-bold text-amber-500">[FIXADO]</span>}
                                        <div>
                                            <p className="font-bold text-lg text-slate-900 dark:text-white">{ann.title}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(ann.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                }
                                footer={
                                    <div className="p-3 flex justify-end items-center space-x-2">
                                        <button onClick={() => handleShare(ann)} className="p-2 text-slate-500 hover:text-sky-500" aria-label="Compartilhar">
                                            <ShareIcon className="h-5 w-5" />
                                        </button>
                                        {isServant && (
                                            <>
                                                <button onClick={() => handleOpenModal(ann)} className="p-2 text-slate-500 hover:text-amber-500" aria-label="Editar"><PencilIcon className="h-5 w-5" /></button>
                                                <button onClick={() => handleDeleteClick(ann)} className="p-2 text-slate-500 hover:text-red-500" aria-label="Excluir"><TrashIcon className="h-5 w-5" /></button>
                                            </>
                                        )}
                                    </div>
                                }
                            >
                                <div className="p-4 sm:p-6">
                                    <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                        {ann.body}
                                    </div>
                                    {ann.images && ann.images.length > 0 && (
                                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {ann.images.map((img, idx) => (
                                                <img key={idx} src={img} alt={`Anúncio ${idx + 1}`} className="rounded-md object-cover aspect-square" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </ScheduleAccordion>
                        )) : (
                            <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                                Nenhum anúncio encontrado.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <AnnouncementFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    initialData={editingAnnouncement}
                />
            )}

            <ConfirmationModal
                isOpen={!!announcementToDelete}
                onClose={() => setAnnouncementToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir este anúncio permanentemente?"
            />
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </>
    );
};

export default Announcements;