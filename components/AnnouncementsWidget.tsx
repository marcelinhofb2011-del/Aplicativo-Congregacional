import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Announcement } from '../types';
import { MegaphoneIcon, ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface AnnouncementsWidgetProps {
    announcements: Announcement[];
    isLoading: boolean;
}

// Renamed for clarity: this carousel handles images within a single announcement slide.
const ImageCarousel: React.FC<{ images: string[], title: string }> = ({ images, title }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setTimeout(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000); // Change image every 5 seconds
        return () => clearTimeout(timer);
    }, [currentIndex, images.length]);

    if (!images || images.length === 0) return null;

    return (
        <div className="relative w-full h-full overflow-hidden">
            <div className="flex transition-transform duration-700 ease-in-out h-full" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {images.map((src, i) => (
                    <img key={i} src={src} alt={`${title} - imagem ${i + 1}`} className="w-full h-full object-cover flex-shrink-0" />
                ))}
            </div>
        </div>
    );
};

const AnnouncementsWidget: React.FC<AnnouncementsWidgetProps> = ({ announcements, isLoading }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const sortedAnnouncements = [...announcements]
        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5); // Show up to 5 announcements in the carousel

    useEffect(() => {
        if (isLoading || sortedAnnouncements.length <= 1) return;
        const timer = setTimeout(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % sortedAnnouncements.length);
        }, 8000); // Change announcement every 8 seconds
        return () => clearTimeout(timer);
    }, [currentIndex, isLoading, sortedAnnouncements.length]);

    const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prevIndex) => (prevIndex - 1 + sortedAnnouncements.length) % sortedAnnouncements.length);
    };
    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prevIndex) => (prevIndex + 1) % sortedAnnouncements.length);
    };
    const goToSlide = (slideIndex: number) => {
        setCurrentIndex(slideIndex);
    };

    const renderSkeleton = () => (
         <div className="h-80 bg-slate-200/50 dark:bg-slate-700/50 rounded-3xl animate-pulse"></div>
    );

    const renderContent = () => {
        if (sortedAnnouncements.length === 0) {
            return (
                <div className="text-center py-12 px-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Nenhum anúncio recente.</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Quando novos anúncios forem criados, eles aparecerão aqui.</p>
                </div>
            );
        }
        return (
            <div className="relative w-full h-96 md:h-80 bg-gradient-to-tr from-sky-400 to-primary dark:from-sky-800 dark:to-blue-900 rounded-3xl shadow-xl overflow-hidden text-white group">
                <div className="flex transition-transform duration-700 ease-in-out h-full" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                    {sortedAnnouncements.map((ann) => {
                        const hasImages = ann.images && ann.images.length > 0;
                        return (
                            <div key={ann.id} className="w-full h-full flex-shrink-0 p-6 flex flex-col md:flex-row items-center gap-6">
                                {hasImages && (
                                    <div className="w-full h-40 md:w-5/12 md:h-full flex-shrink-0 rounded-xl overflow-hidden shadow-lg">
                                        <ImageCarousel images={ann.images!} title={ann.title} />
                                    </div>
                                )}
                                <div className={`w-full ${hasImages ? 'md:w-7/12' : ''} flex flex-col justify-center`}>
                                    {ann.isPinned && (
                                        <span className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full mb-2 w-fit">
                                            FIXADO
                                        </span>
                                    )}
                                    <h4 className="font-bold text-xl lg:text-2xl mb-2 line-clamp-2">{ann.title}</h4>
                                    <p className="text-sm text-blue-100 line-clamp-3 md:line-clamp-4 lg:line-clamp-5">{ann.body}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {sortedAnnouncements.length > 1 && (
                    <>
                        <button onClick={goToPrevious} className="absolute top-1/2 left-3 -translate-y-1/2 bg-black/20 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white">
                            <ChevronLeftIcon className="h-6 w-6" />
                        </button>
                        <button onClick={goToNext} className="absolute top-1/2 right-3 -translate-y-1/2 bg-black/20 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white">
                            <ChevronRightIcon className="h-6 w-6" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                            {sortedAnnouncements.map((_, i) => (
                                <button key={i} onClick={() => goToSlide(i)} className={`h-2 w-2 rounded-full transition-colors ${currentIndex === i ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}></button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
             <div className="flex justify-between items-center mb-4 px-2">
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
    );
};

export default AnnouncementsWidget;