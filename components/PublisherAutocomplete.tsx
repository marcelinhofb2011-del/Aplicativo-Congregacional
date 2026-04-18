import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PublisherProfile } from '../types';
import { XIcon } from './icons/Icons';

interface PublisherAutocompleteProps {
    publishers: PublisherProfile[];
    selectedPublisher: PublisherProfile | null;
    onSelect: (publisher: PublisherProfile | null) => void;
    onTextChange?: (text: string) => void;
    placeholder?: string;
    initialValue?: string;
}

const PublisherAutocomplete: React.FC<PublisherAutocompleteProps> = ({ publishers, selectedPublisher, onSelect, onTextChange, placeholder, initialValue }) => {
    const [searchTerm, setSearchTerm] = useState(initialValue || selectedPublisher?.name || '');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedPublisher) {
            setSearchTerm(selectedPublisher.name);
        } else if (initialValue !== undefined) {
            setSearchTerm(initialValue);
        }
    }, [selectedPublisher, initialValue]);

    useEffect(() => {
        // Close dropdown if clicked outside
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredPublishers = useMemo(() => {
        if (!searchTerm) return publishers;
        return publishers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, publishers]);

    const handleSelect = (publisher: PublisherProfile) => {
        onSelect(publisher);
        setSearchTerm(publisher.name);
        setIsOpen(false);
    };
    
    const handleClear = () => {
        onSelect(null);
        if (onTextChange) onTextChange('');
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (onTextChange) onTextChange(value);
        if (!isOpen) setIsOpen(true);
        if (selectedPublisher && value !== selectedPublisher.name) {
            onSelect(null); // Deselect if user starts typing something different
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => { setIsOpen(true); }}
                onBlur={() => setTimeout(() => { setIsOpen(false); }, 200)}
                placeholder={placeholder || 'Buscar publicador...'}
                className="input-style pr-10"
                autoComplete="off"
            />
            {selectedPublisher && (
                 <button type="button" onClick={handleClear} className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <XIcon className="h-5 w-5 text-slate-400 hover:text-red-500"/>
                </button>
            )}

            {isOpen && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredPublishers.length > 0 ? filteredPublishers.map(pub => (
                        <li key={pub.id}>
                            <button
                                type="button"
                                onClick={() => handleSelect(pub)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                {pub.name}
                            </button>
                        </li>
                    )) : (
                        <li className="px-4 py-2 text-slate-500">Nenhum resultado</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default PublisherAutocomplete;