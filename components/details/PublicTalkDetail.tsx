
import React, { useState, useEffect } from 'react';
import { PublicTalkSchedule, UserRole } from '../../types';
import { PhoneIcon, PencilIcon, SaveIcon } from '../icons/Icons';
import { REVERSE_PUBLIC_TALK_THEMES } from '../../utils/publicTalksHelper';
import { useAuth } from '../../hooks/useAuth';
import { updatePublicTalk } from '../../services/firestoreService';
import { useSchedules } from '../../contexts/ScheduleContext';

interface PublicTalkDetailProps {
    schedule: PublicTalkSchedule;
}

const DetailItem: React.FC<{ label: string, value: React.ReactNode, fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
    <div className={fullWidth ? 'col-span-2' : ''}>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{label}</p>
        <p className="font-bold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
);

const PublicTalkDetail: React.FC<PublicTalkDetailProps> = ({ schedule }) => {
    const { user } = useAuth();
    const { forceUpdate } = useSchedules();
    const isServant = user?.role === UserRole.SERVANT;
    
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notes, setNotes] = useState(schedule.notes || '');
    const [song, setSong] = useState(schedule.song || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setNotes(schedule.notes || '');
        setSong(schedule.song || '');
    }, [schedule]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await updatePublicTalk(schedule.id, { 
                notes, 
                song 
            }, user.uid);
            setIsEditingNotes(false);
            forceUpdate();
        } catch (error) {
            console.error("Error saving quick notes:", error);
            alert("Erro ao salvar anotações.");
        } finally {
            setIsSaving(false);
        }
    };

    const formattedDate = new Date(schedule.date).toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
    
    return (
        <div id={`talk-card-content-${schedule.id}`} className="p-8 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-[40px]">
            <header className="text-center mb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">Congregação Cristã das Testemunhas de Jeová</p>
                <h2 className="text-3xl font-black mt-2 text-slate-900 dark:text-white tracking-tight">Designação de Discurso Público</h2>
            </header>
            
            <div className="space-y-8">
                {/* MEETING ANNOTATIONS SECTION - QUICK EDITABLE */}
                <section className="bg-amber-50/50 dark:bg-amber-500/[0.03] p-8 rounded-[40px] border border-amber-100 dark:border-amber-500/10 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <PencilIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <h3 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">Anotações da Reunião</h3>
                        </div>
                        {isServant && (
                            <button 
                                onClick={() => isEditingNotes ? handleSave() : setIsEditingNotes(true)}
                                disabled={isSaving}
                                className="px-4 py-1.5 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving ? 'Salvando...' : isEditingNotes ? (
                                    <>
                                        <SaveIcon className="h-3 w-3" />
                                        Salvar
                                    </>
                                ) : (
                                    <>
                                        <PencilIcon className="h-3 w-3" />
                                        Editar
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-amber-600/60 uppercase tracking-widest mb-1.5">Cântico Inicial / Tema do Cântico</label>
                                {isEditingNotes ? (
                                    <input 
                                        type="text"
                                        value={song}
                                        onChange={(e) => setSong(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-500/20 rounded-2xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                                        placeholder="Ex: Cântico 54 - 'Dê seu melhor'"
                                    />
                                ) : (
                                    <p className="text-lg font-bold text-slate-900 dark:text-white min-h-[1.5rem] bg-white/50 dark:bg-black/20 p-4 rounded-3xl border border-dashed border-amber-200 dark:border-amber-500/20 shadow-inner">
                                        {song || <span className="text-slate-400 font-normal italic">Informação Pendente (Ex: Cântico 54)</span>}
                                    </p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-[9px] font-black text-amber-600/60 uppercase tracking-widest mb-1.5">Textos Bíblicos / Outras Notas</label>
                                {isEditingNotes ? (
                                    <textarea 
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none resize-none"
                                        placeholder="Anote aqui os textos bíblicos principais ou outras observações do orador..."
                                    />
                                ) : (
                                    <div className="text-base font-medium text-slate-600 dark:text-slate-300 min-h-[4rem] bg-white/50 dark:bg-black/20 p-6 rounded-[32px] border border-dashed border-amber-200 dark:border-amber-500/20 whitespace-pre-wrap leading-relaxed shadow-inner italic">
                                        {notes || 'Nenhuma anotação adicional registrada para esta reunião.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-slate-50 dark:bg-white/[0.02] p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                    <h3 className="text-[10px] font-black text-primary dark:text-amber-500 uppercase tracking-widest mb-4">ORADOR E TEMA</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orador</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{schedule.speakerName}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tema</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{schedule.theme}</p>
                            <p className="text-primary dark:text-amber-500 mt-1 font-black text-[10px] uppercase tracking-widest">Esboço Nº {REVERSE_PUBLIC_TALK_THEMES[schedule.theme] || 'N/A'}</p>
                        </div>
                    </div>
                </section>

                <section className="px-2">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-white/5 pb-2">DETALHES DO EVENTO</h3>
                     <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                        <DetailItem label="Data" value={formattedDate} />
                        <DetailItem label="Hora" value={schedule.time} />
                        <DetailItem label="Congregação" value={schedule.congregation} />
                        <DetailItem label="Usará Imagens?" value={schedule.hasImage ? 'Sim' : 'Não'} />

                        {schedule.type === 'away' && schedule.address && (
                            <DetailItem label="Local" value={schedule.address} fullWidth />
                        )}
                        {schedule.phone && (
                            <DetailItem
                                label="Telefone (Contato)"
                                value={
                                    <a href={`tel:${schedule.phone}`} className="inline-flex items-center gap-2 group text-primary dark:text-amber-500 hover:underline">
                                        <span>{schedule.phone}</span>
                                        <PhoneIcon className="h-4 w-4" />
                                    </a>
                                }
                                fullWidth
                            />
                        )}
                     </div>
                </section>
            </div>

            <footer className="text-center pt-8 mt-12 border-t border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest leading-loose">
                    Sistema de Apoio Congregacional<br/>
                    <span className="text-primary/50 italic dark:text-amber-500/30">Gerado automaticamente pelo aplicativo VL Cisper</span>
                </p>
            </footer>
        </div>
    );
};

export default PublicTalkDetail;
