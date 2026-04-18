import React, { useState, useEffect } from 'react';
import { Announcement, BaseRecord } from '../types';
import { XIcon } from './icons/Icons';

interface AnnouncementFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<Announcement, 'id' | keyof BaseRecord>) => void;
    initialData: Announcement | null;
}

const BLANK_ANNOUNCEMENT: Omit<Announcement, 'id' | keyof BaseRecord | 'images'> = {
    title: '',
    body: '',
    isPinned: false,
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


const AnnouncementFormModal: React.FC<AnnouncementFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(BLANK_ANNOUNCEMENT);
    const [images, setImages] = useState<string[]>([]);
    const [isConverting, setIsConverting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                body: initialData.body,
                isPinned: initialData.isPinned,
            });
            setImages(initialData.images || []);
        } else {
            setFormData(BLANK_ANNOUNCEMENT);
            setImages([]);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsConverting(true);
        try {
            const filePromises = Array.from(files).map(fileToBase64);
            const base64strings = await Promise.all(filePromises);
            setImages(prev => [...prev, ...base64strings]);
        } catch (error) {
            console.error("Error converting files to base64", error);
            alert("Ocorreu um erro ao processar as imagens.");
        } finally {
            setIsConverting(false);
        }
    };
    
    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.body.trim()) {
            alert('Por favor, preencha o título e a descrição do anúncio.');
            return;
        }
        onSave({ ...formData, images });
    };

    return (
        <div className="fixed inset-0 bg-light dark:bg-dark z-[100] overflow-y-auto">
            <div className="container mx-auto px-4 py-8 pb-32 max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {initialData ? 'Editar Anúncio' : 'Novo Anúncio'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título do Anúncio</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="input-style"
                                placeholder="Título breve do anúncio"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                            <textarea
                                name="body"
                                value={formData.body}
                                onChange={handleInputChange}
                                required
                                rows={6}
                                className="input-style"
                                placeholder="Digite o conteúdo completo do anúncio aqui."
                            ></textarea>
                        </div>

                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fazer upload de arquivos</label>
                             <input type="file" multiple accept="image/*" onChange={handleFileChange} className="input-style" />
                             {isConverting && <p className="text-sm text-slate-500 mt-2">Processando imagens...</p>}
                             {images.length > 0 && (
                                 <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                     {images.map((imgSrc, index) => (
                                         <div key={index} className="relative group">
                                             <img src={imgSrc} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                                             <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <XIcon className="h-3 w-3" />
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>

                         <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isPinned"
                                name="isPinned"
                                checked={formData.isPinned}
                                onChange={handleCheckboxChange}
                                className="h-4 w-4 rounded text-primary focus:ring-primary border-slate-300"
                            />
                            <label htmlFor="isPinned" className="ml-2 block text-sm text-slate-900 dark:text-slate-200">
                                Fixar no topo do mural de anúncios
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 pb-8">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 mr-3">
                            Cancelar
                        </button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-dark">
                            Salvar Anúncio
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AnnouncementFormModal;