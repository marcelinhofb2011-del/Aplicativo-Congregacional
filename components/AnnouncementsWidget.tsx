
import React from 'react';
import { Link } from 'react-router-dom';
import { Announcement } from '../types';
import { MegaphoneIcon } from './icons/Icons';

interface AnnouncementsWidgetProps {
    announcements: Announcement[];
    isLoading: boolean;
}

const AnnouncementsWidget: React.FC<AnnouncementsWidgetProps> = ({ announcements, isLoading }) => {
    
    const sortedAnnouncements = [...announcements]
        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);

    const renderSkeleton = () => (
        <div className="space-y-4">
            <div className="h-5 bg-slate-200/50 dark:bg-slate-700/50 rounded-md w-3/4 animate-pulse"></div>
            <div className="h-4 bg-slate-200/50 dark:bg-slate-700/50 rounded-md w-full animate-pulse"></div>
            <div className="h-4 bg-slate-200/50 dark:bg-slate-700/50 rounded-md w-5/6 animate-pulse"></div>
        </div>
    );

    const renderContent = () => {
        if (sortedAnnouncements.length === 0) {
            return <p className="text-slate-500 dark:text-slate-400">Nenhum anúncio recente.</p>;
        }
        return (
            <div className="space-y-4">
                {sortedAnnouncements.map((ann, index) => (
                    <div key={ann.id} className={`border-slate-200 dark:border-slate-700 ${index > 0 ? 'pt-4 border-t' : ''}`}>
                        <div className="flex items-center gap-2">
                           {ann.isPinned && <span className="text-xs font-bold text-amber-500">[FIXADO]</span>}
                           <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{ann.title}</h4>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{ann.body}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50 p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <MegaphoneIcon className="h-6 w-6 text-sky-500" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quadro de Anúncios</h3>
                    </div>
                    <Link to="/anuncios" className="text-sm font-semibold text-primary hover:underline">
                        Ver todos
                    </Link>
                </div>
                {isLoading ? renderSkeleton() : renderContent()}
            </div>
        </div>
    );
};

export default AnnouncementsWidget;
