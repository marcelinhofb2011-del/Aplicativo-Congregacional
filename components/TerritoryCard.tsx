
import React from 'react';
import { Territory, TerritoryStatus } from '../types';

interface TerritoryCardProps {
    territory: Territory;
    onClick: (territory: Territory) => void;
}

const statusConfig = {
    [TerritoryStatus.AVAILABLE]: {
        label: 'Livre',
        style: 'bg-green-100 dark:bg-green-900/50 border-green-500 text-green-800 dark:text-green-300',
    },
    [TerritoryStatus.REQUESTED]: {
        label: 'Solicitado',
        style: 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-500 text-yellow-800 dark:text-yellow-300',
    },
    [TerritoryStatus.ASSIGNED]: {
        label: 'Designado',
        style: 'bg-red-100 dark:bg-red-900/50 border-red-500 text-red-800 dark:text-red-300',
    },
};

const TerritoryCard: React.FC<TerritoryCardProps> = ({ territory, onClick }) => {
    const config = statusConfig[territory.status];
    
    return (
        <button 
            onClick={() => onClick(territory)}
            className={`w-full rounded-lg shadow-md p-4 text-left transition-transform transform hover:scale-105 border-l-4 ${config.style}`}
        >
            <div className="flex justify-between items-center">
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {territory.number}
                </p>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${config.style}`}>
                    {config.label}
                </span>
            </div>
            <div className="mt-2 h-12">
                {territory.status === TerritoryStatus.ASSIGNED && territory.assignment && (
                    <>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{territory.assignment.publisherName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                           Devolver em: {new Date(territory.assignment.expectedReturnDate).toLocaleDateString('pt-BR')}
                        </p>
                    </>
                )}
            </div>
        </button>
    );
};

export default TerritoryCard;
