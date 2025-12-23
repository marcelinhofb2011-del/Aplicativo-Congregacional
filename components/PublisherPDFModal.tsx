
import React, { useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { PublisherProfile } from '../types';
import { XIcon, ShareIcon } from './icons/Icons';
import Toast from './Toast';

interface PublisherPDFModalProps {
    isOpen: boolean;
    onClose: () => void;
    publishers: PublisherProfile[];
}

const PublisherPDFModal: React.FC<PublisherPDFModalProps> = ({ isOpen, onClose, publishers }) => {
    const [selectedGroup, setSelectedGroup] = useState<'all' | '1' | '2' | '3'>('all');
    const [generatedReportUrl, setGeneratedReportUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const filteredPublishers = useMemo(() => {
        if (selectedGroup === 'all') {
            return publishers;
        }
        return publishers.filter(p => p.group === selectedGroup);
    }, [publishers, selectedGroup]);

    const handleGeneratePreview = async () => {
        setIsGenerating(true);
        setGeneratedReportUrl(null);
        // Timeout to allow the DOM to update with the filtered list
        setTimeout(async () => {
            const element = document.getElementById('pdf-content');
            if (element) {
                try {
                    const canvas = await html2canvas(element, { scale: 2 });
                    const dataUrl = canvas.toDataURL('image/png');
                    setGeneratedReportUrl(dataUrl);
                } catch (error) {
                    console.error("Error generating report image:", error);
                    setToastMessage('Erro ao gerar a visualização do relatório.');
                }
            }
            setIsGenerating(false);
        }, 100);
    };
    
    const handleShare = async () => {
        if (!generatedReportUrl) {
            setToastMessage('Gere uma visualização primeiro.');
            return;
        }
        try {
            const blob = await (await fetch(generatedReportUrl)).blob();
            const file = new File([blob], 'relatorio_publicadores.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Relatório de Publicadores',
                    text: `Relatório de publicadores - Grupo ${selectedGroup === 'all' ? 'Todos' : selectedGroup}`,
                });
            } else {
                 setToastMessage('Compartilhamento de arquivos não suportado neste navegador.');
            }
        } catch (error) {
            console.error("Error sharing report:", error);
            if ((error as Error).name !== 'AbortError') {
                 setToastMessage('Erro ao compartilhar relatório.');
            }
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-50 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Gerar Relatório</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Controls */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                             <label className="block text-sm font-medium mb-2">Filtrar por Grupo</label>
                             <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value as any)} className="input-style">
                                <option value="all">Todos os Grupos</option>
                                <option value="1">Grupo 1</option>
                                <option value="2">Grupo 2</option>
                                <option value="3">Grupo 3</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <button onClick={handleGeneratePreview} disabled={isGenerating} className="w-full px-5 py-3 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-dark disabled:bg-primary/50">
                                {isGenerating ? 'Gerando...' : 'Visualizar Relatório'}
                            </button>
                             <button onClick={handleShare} disabled={!generatedReportUrl || isGenerating} className="w-full inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50">
                                <ShareIcon className="h-5 w-5 mr-2" />
                                Compartilhar
                            </button>
                        </div>
                    </div>
                    {/* Preview */}
                    <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                         <h3 className="text-xl font-semibold mb-4">Visualização</h3>
                         <div className="bg-slate-100 dark:bg-slate-700/50 rounded-md aspect-[210/297] flex items-center justify-center overflow-auto">
                            {generatedReportUrl ? (
                                <img src={generatedReportUrl} alt="Pré-visualização do relatório" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <p className="text-slate-500">A pré-visualização aparecerá aqui.</p>
                            )}
                         </div>
                    </div>
                </div>

                {/* Hidden element for PDF generation */}
                <div className="absolute -left-[9999px] top-0">
                     <div id="pdf-content" className="p-10 bg-white" style={{ width: '800px' }}>
                        <div className="text-center mb-8">
                             <h1 className="text-2xl font-bold text-black">Lista de Publicadores</h1>
                             <h2 className="text-lg text-gray-600">Congregação Central</h2>
                        </div>
                        <div className="mb-4">
                            <p className="font-semibold text-black">Grupo: <span className="font-normal">{selectedGroup === 'all' ? 'Todos' : selectedGroup}</span></p>
                        </div>
                        <table className="w-full text-left border-collapse">
                             <thead>
                                <tr>
                                    <th className="border-b-2 border-black p-2 text-black font-bold">Nome</th>
                                    <th className="border-b-2 border-black p-2 text-black font-bold w-24">Grupo</th>
                                </tr>
                             </thead>
                             <tbody>
                                {filteredPublishers.map((p) => (
                                    <tr key={p.id}>
                                        <td className="border-b border-gray-300 p-2 text-black">{p.name}</td>
                                        <td className="border-b border-gray-300 p-2 text-black">{p.group}</td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                     </div>
                </div>
            </div>
            <Toast message={toastMessage} onClear={() => setToastMessage('')} />
        </div>
    );
};

export default PublisherPDFModal;
