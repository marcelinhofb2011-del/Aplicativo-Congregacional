import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { 
    LifeMinistryIcon, 
    AssignmentsIcon, 
    CleaningIcon, 
    DocumentTextIcon,
    PublicTalkIcon, 
    BusIcon,
    ChartBarIcon,
    ConductorIcon,
    SettingsIcon,
    MegaphoneIcon,
    CalendarDaysIcon,
    CalendarSolidIcon,
    BookOpenIcon,
} from '../components/icons/Icons';

// Itens de menu para a grade principal
const MENU_GRID_ITEMS = [
    { path: '/calendario', label: 'Calendário', icon: CalendarSolidIcon, color: 'text-blue-500' },
    { path: '/pioneiro', label: 'Relatório', icon: BookOpenIcon, color: 'text-teal-500' },
    { path: '/resumo', label: 'Análise', icon: ChartBarIcon, color: 'text-indigo-500' },
    { path: '/anuncios', label: 'Anúncios', icon: MegaphoneIcon, color: 'text-sky-500' },
    { path: '/vida-e-ministerio', label: 'Ministério', icon: LifeMinistryIcon, color: 'text-green-500' },
    { path: '/designacoes', label: 'Designações', icon: AssignmentsIcon, color: 'text-orange-500' },
    { path: '/limpeza', label: 'Limpeza', icon: CleaningIcon, color: 'text-purple-500' },
    { path: '/secretario', label: 'Secretário', icon: DocumentTextIcon, color: 'text-emerald-600' },
    { path: '/dirigentes', label: 'Serviço de Campo', icon: ConductorIcon, color: 'text-cyan-500' },
    { path: '/discurso-publico', label: 'Discursos', icon: PublicTalkIcon, color: 'text-indigo-600' },
    { path: '/passagens', label: 'Passagens', icon: BusIcon, color: 'text-amber-600' },
    { path: '/configuracoes', label: 'Ajustes', icon: SettingsIcon, color: 'text-slate-600' },

];


const Menu: React.FC = () => {
        const { user } = useAuth();

    if (!user) return null;

    return (
                <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-xl mx-auto">
                <div className="grid grid-cols-3 gap-4 sm:gap-5">
                                        {MENU_GRID_ITEMS.filter((item) => {
                        // Deixar Secretário, Análise (resumo) e lista total do Ministério apenas para responsáveis (SERVANT)
                        if (user.role === UserRole.PUBLISHER) {
                            if (item.path === '/secretario' || item.path === '/resumo' || item.path === '/vida-e-ministerio') {
                                return false;
                            }
                        }
                        return true;
                    }).map((item) => {
                        const targetPath = (item.path === '/pioneiro' && user.role === UserRole.PUBLISHER)
                            ? '/relatorio'
                            : item.path;

                        return (
                            <Link
                                key={item.path}
                                to={targetPath}
                                className="flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark transition-all duration-300 aspect-square"
                            >
                                <item.icon className={`h-10 w-10 sm:h-12 sm:w-12 mb-2 ${item.color}`} />
                                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Menu;