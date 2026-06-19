import React, { useState, useMemo, useRef, useEffect, KeyboardEvent } from 'react';
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
    const [focusedIndex, setFocusedIndex] = useState(-1);
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
        const handleClickOutside = (event: Event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const filteredPublishers = useMemo(() => {
        // Always sort the baseline alphabetically
        const sortedBaseline = [...publishers].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        if (!searchTerm) return sortedBaseline;

        const term = searchTerm.toLowerCase();
        
        // Prioritize publishers that start with the typed term
        const startsWithTerm = sortedBaseline.filter(p => p.name.toLowerCase().startsWith(term));
        const containsTerm = sortedBaseline.filter(p => p.name.toLowerCase().includes(term) && !p.name.toLowerCase().startsWith(term));

        return [...startsWithTerm, ...containsTerm];
    }, [searchTerm, publishers]);

    // Reset focused index whenever filtered options or open state change
    useEffect(() => {
        setFocusedIndex(-1);
    }, [isOpen, searchTerm]);

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

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev => (prev + 1 < filteredPublishers.length ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => (prev - 1 >= 0 ? prev - 1 : filteredPublishers.length - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < filteredPublishers.length) {
                    handleSelect(filteredPublishers[focusedIndex]);
                } else if (filteredPublishers.length > 0) {
                    // select top match if any
                    handleSelect(filteredPublishers[0]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            default:
                break;
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => { setIsOpen(true); }}
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
                    {filteredPublishers.length > 0 ? filteredPublishers.map((pub, idx) => (
                        <li key={pub.id}>
                            <button
                                type="button"
                                onClick={() => handleSelect(pub)}
                                className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors
                                    ${idx === focusedIndex 
                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' 
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                                    }
                                `}
                            >
                                <span className={pub.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ? 'font-bold underline text-amber-600 dark:text-amber-500' : ''}>
                                    {pub.name}
                                </span>
                            </button>
                        </li>
                    )) : (
                        <li className="px-4 py-2 text-slate-500 text-xs">Nenhum resultado</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default PublisherAutocomplete;