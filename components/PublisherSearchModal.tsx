
import React, { useState, useMemo } from 'react';
import { PublisherProfile } from '../types';
import { MagnifyingGlassIcon, XIcon } from './icons/Icons';

interface PublisherSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (publisher: PublisherProfile) => void;
    publishers: PublisherProfile[];
}

const PublisherSearchModal: React.FC<PublisherSearchModalProps> = ({ isOpen, onClose, onSelect, publishers }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPublishers = useMemo(() => {
        if (!searchTerm) return publishers;
        return publishers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, publishers]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar publicador..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                            autoFocus
                        />
                    </div>
                </div>
                <ul className="flex-grow overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredPublishers.map(publisher => (
                        <li key={publisher.id}>
                            <button
                                onClick={() => onSelect(publisher)}
                                className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            >
                                <p className="font-medium text-slate-800 dark:text-slate-200">{publisher.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Grupo: {publisher.group}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PublisherSearchModal;
