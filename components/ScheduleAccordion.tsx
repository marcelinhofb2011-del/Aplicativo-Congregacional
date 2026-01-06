
import React from 'react';
import { ChevronRightIcon } from './icons/Icons';

interface ScheduleAccordionProps {
    title: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    headerActions?: React.ReactNode;
}

const ScheduleAccordion: React.FC<ScheduleAccordionProps> = ({ title, children, footer, isOpen, onToggle, headerActions }) => {
    return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden transition-all duration-300">
            <div
                className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
                <div onClick={onToggle} className="flex-grow pr-4 cursor-pointer">
                    {title}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    {headerActions}
                    <button
                        onClick={onToggle}
                        aria-expanded={isOpen}
                        className="p-1 rounded-full"
                    >
                        <ChevronRightIcon className={`h-5 w-5 text-slate-500 transition-transform duration-300 transform ${isOpen ? 'rotate-90' : 'rotate-0'}`} />
                    </button>
                </div>
            </div>
            <div
                className={`transition-all duration-500 ease-in-out grid ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
                <div className="overflow-hidden">
                    <div className="border-t border-slate-200 dark:border-slate-700">
                        {children}
                    </div>
                    {footer && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleAccordion;
