import React from 'react';
import { useAuth } from '../hooks/useAuth';

const OnlineIndicator: React.FC = () => {
    const { onlineCount, user } = useAuth();

    // Se não houver ninguém logado ou count zero (improvável se o próprio user está logado)
    if (!user || onlineCount === 0) {
        return null;
    }

    return (
        <div 
            className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"
            title={`${onlineCount} usuário(s) ativos no momento`}
        >
            <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                {onlineCount} {onlineCount === 1 ? 'Online' : 'Online'}
            </span>
        </div>
    );
};

export default OnlineIndicator;