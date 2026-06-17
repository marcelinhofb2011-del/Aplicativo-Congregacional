

import React from 'react';
import { Link } from 'react-router-dom';
import { AttendanceIcon, ChevronRightIcon, ReportIcon, CalendarDaysIcon } from '../components/icons/Icons';

const Secretario: React.FC = () => {
    
    const menuItems = [
        { path: '/secretario/relatorios', label: 'Pasta de Relatórios', icon: ReportIcon, color: 'text-amber-500' },
        { path: '/secretario/assistencia', label: 'Registros de Assistência', icon: AttendanceIcon, color: 'text-emerald-500' },
        { path: '/secretario/registro-discurso', label: 'Registro de Discursos', icon: ReportIcon, color: 'text-sky-500' },
    ];
        
    return (
        <>
            <div className="bg-primary p-4 sm:p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-white">Painel do Secretário</h2>
                <p className="mt-1 text-blue-100 max-w-2xl">
                    Acesse os registros de assistência da congregação.
                </p>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-md">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                        {menuItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="flex items-center p-5 w-full text-left transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                            >
                                <item.icon className={`h-8 w-8 mr-4 ${item.color}`} />
                                <span className="flex-grow text-lg font-semibold text-slate-700 dark:text-slate-200">
                                    {item.label}
                                </span>
                                <ChevronRightIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Secretario;