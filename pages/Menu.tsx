
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
    DashboardIcon, 
    LifeMinistryIcon, 
    AssignmentsIcon, 
    CleaningIcon, 
    FieldServiceIcon, 
    PublicTalkIcon, 
    BusIcon,
    ChartBarIcon,
    TerritoriesIcon,
    ConductorIcon,
    ShepherdingIcon,
    SettingsIcon,
} from '../components/icons/Icons';

// Itens de menu para a grade principal
const MENU_GRID_ITEMS = [
    { path: '/dashboard', label: 'Painel', icon: DashboardIcon, color: 'text-blue-500' },
    { path: '/resumo', label: 'Resumo', icon: ChartBarIcon, color: 'text-indigo-500' },
    { path: '/vida-e-ministerio', label: 'Ministério', icon: LifeMinistryIcon, color: 'text-green-500' },
    { path: '/designacoes', label: 'Designações', icon: AssignmentsIcon, color: 'text-orange-500' },
    { path: '/limpeza', label: 'Limpeza', icon: CleaningIcon, color: 'text-purple-500' },
    { path: '/secretario', label: 'Secretário', icon: FieldServiceIcon, color: 'text-emerald-600' },
    { path: '/dirigentes', label: 'Dirigentes', icon: ConductorIcon, color: 'text-cyan-500' },
    { path: '/pastoreio', label: 'Pastoreio', icon: ShepherdingIcon, color: 'text-pink-500' },
    { path: '/discurso-publico', label: 'Discursos', icon: PublicTalkIcon, color: 'text-indigo-600' },
    { path: '/territorios', label: 'Territórios', icon: TerritoriesIcon, color: 'text-lime-500' },
    { path: '/passagens', label: 'Passagens', icon: BusIcon, color: 'text-yellow-400' },
    { path: '/configuracoes', label: 'Ajustes', icon: SettingsIcon, color: 'text-slate-500' },
];


const Menu: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Menu Principal</h2>

            {/* Navegação Principal */}
            <div className="grid grid-cols-3 gap-4">
                {MENU_GRID_ITEMS.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 aspect-square"
                    >
                        <item.icon className={`h-10 w-10 mb-2 ${item.color}`} />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Menu;
