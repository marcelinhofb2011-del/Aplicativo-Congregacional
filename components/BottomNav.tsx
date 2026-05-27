
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { BOTTOM_NAV_ITEMS } from '../constants';
import { Squares2X2Icon } from './icons/Icons';
import { useIsInputFocused } from '../hooks/useIsInputFocused';

const BottomNav: React.FC = () => {
    const { user } = useAuth();
    const isInputFocused = useIsInputFocused();
    
    if (!user || isInputFocused) return null;

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ${
            isActive
                ? 'text-primary'
                : 'text-slate-400 hover:text-slate-600'
        }`;
        
    // Show default bottom nav items for both roles.
    // Servants get an additional "Menu" link.
    const itemsToShow = BOTTOM_NAV_ITEMS;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)] transform-gpu">
            <nav className="max-w-2xl mx-auto h-full flex justify-around items-center px-4">
                {itemsToShow.map((item) => (
                    <NavLink key={item.path} to={item.path} className={navLinkClass}>
                        {({ isActive }) => (
                            <div className="flex flex-col items-center gap-1.5">
                                <div className={`p-2 rounded-xl transition-all duration-500 ${isActive ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-slate-300'}`}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-500 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-500'}`}>
                                    {item.label}
                                </span>
                            </div>
                        )}
                    </NavLink>
                ))}
                {user.role === UserRole.SERVANT && (
                    <NavLink to="/menu" className={navLinkClass}>
                        {({ isActive }) => (
                            <div className="flex flex-col items-center gap-1.5">
                                <div className={`p-2 rounded-xl transition-all duration-500 ${isActive ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-slate-300'}`}>
                                    <Squares2X2Icon className="h-6 w-6" />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-500 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-500'}`}>
                                    Menu
                                </span>
                            </div>
                        )}
                    </NavLink>
                )}
            </nav>
        </div>
    );
};

export default BottomNav;
