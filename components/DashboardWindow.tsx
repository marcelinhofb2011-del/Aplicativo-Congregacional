import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardWindowProps {
    title: string;
    icon: React.FC<{ className?: string }>;
    count: number;
    path: string;
    colorClass: string;
    hasNewItem: boolean;
}

const DashboardWindow: React.FC<DashboardWindowProps> = ({ title, icon: Icon, count, path, colorClass, hasNewItem }) => {
    // e.g., 'text-green-500' -> 'bg-green-500'
    const bgColorClass = colorClass.replace('text-', 'bg-');

    return (
        <Link to={path} state={{ fromDashboard: true }} className="relative block p-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 transition-transform transform hover:-translate-y-1 hover:shadow-2xl">
            <div className="flex justify-between items-start">
                <div className={`flex items-center justify-center h-12 w-12 rounded-xl ${bgColorClass}`}>
                    <Icon className="h-7 w-7 text-white" />
                </div>
                {hasNewItem && (
                    <div className="animate-slow-pulse absolute top-4 right-4">
                         <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white shadow-md">
                            Nova
                        </span>
                    </div>
                )}
            </div>
            <div className="mt-16">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {count} {count === 1 ? 'programação futura' : 'programações futuras'}
                </p>
            </div>
        </Link>
    );
};

export default DashboardWindow;