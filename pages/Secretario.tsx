
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ReportIcon, AttendanceIcon, ChevronRightIcon, BookOpenIcon } from '../components/icons/Icons';
import { UserRole } from '../types';

const Secretario: React.FC = () => {
    const { user } = useAuth();
    const isServant = user?.role === UserRole.SERVANT;

    const baseMenuItems = [
        { path: '/secretario/relatorios', label: 'Relatórios de Serviço', icon: ReportIcon, color: 'text-blue-500' },
        { path: '/secretario/assistencia', label: 'Registros de Assistência', icon: AttendanceIcon, color: 'text-emerald-500' },
    ];

    const menuItems = isServant
        ? [...baseMenuItems, { path: '/publicadores', label: 'Pasta de Publicadores', icon: BookOpenIcon, color: 'text-rose-500' }]
        : baseMenuItems;
        
    return (
        <>
            <div className="bg-[#65a30d] p-4 sm:p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-white">Painel do Secretário</h2>
                <p className="mt-1 text-lime-100 max-w-2xl">
                    Acesse as pastas de relatórios de serviço de campo e os registros de assistência da congregação.
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