

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
    LifeMinistryIcon, 
    AssignmentsIcon, 
    CleaningIcon, 
    FieldServiceIcon, 
    PublicTalkIcon, 
    BusIcon,
    ChartBarIcon,
    ConductorIcon,
    ShepherdingIcon,
    SettingsIcon,
    ChevronRightIcon,
    MegaphoneIcon,
} from '../components/icons/Icons';

// Itens de menu para a grade principal
const MENU_GRID_ITEMS = [
    { path: '/resumo', label: 'Resumo', icon: ChartBarIcon, color: 'text-indigo-500' },
    { path: '/anuncios', label: 'Anúncios', icon: MegaphoneIcon, color: 'text-sky-500' },
    { path: '/vida-e-ministerio', label: 'Ministério', icon: LifeMinistryIcon, color: 'text-green-500' },
    { path: '/designacoes', label: 'Designações', icon: AssignmentsIcon, color: 'text-orange-500' },
    { path: '/limpeza', label: 'Limpeza', icon: CleaningIcon, color: 'text-purple-500' },
    { path: '/secretario', label: 'Secretário', icon: FieldServiceIcon, color: 'text-emerald-600' },
    { path: '/dirigentes', label: 'Serviço de Campo', icon: ConductorIcon, color: 'text-cyan-500' },
    { path: '/discurso-publico', label: 'Discursos', icon: PublicTalkIcon, color: 'text-indigo-600' },
    { path: '/passagens', label: 'Passagens', icon: BusIcon, color: 'text-yellow-400' },
    { path: '/configuracoes', label: 'Ajustes', icon: SettingsIcon, color: 'text-slate-500' },
];


const Menu: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div>
            <div className="sticky top-0 z-10 bg-primary p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Menu Principal</h2>
                    <p className="text-blue-100">
                        Navegue pelas seções administrativas para gerenciar a congregação.
                    </p>
                </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                        {MENU_GRID_ITEMS.map((item) => (
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
        </div>
    );
};

export default Menu;