
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { WifiIcon } from './icons/Icons';

const OnlineIndicator: React.FC = () => {
    const { onlineCount } = useAuth();

    if (onlineCount <= 0) {
        return null;
    }

    return (
        <div 
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 p-2 rounded-full"
            title={`${onlineCount} usuário(s) online agora`}
        >
            <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <span className="hidden sm:inline">{onlineCount} online</span>
        </div>
    );
};

export default OnlineIndicator;
